import json
from typing import Any

from app.core.config import settings
from app.schemas.knowledge import (
    KnowledgeFlashcard,
    KnowledgeMultipleChoiceQuestion,
    KnowledgePackRequest,
    KnowledgePackResponse,
)
from app.schemas.procedure import ProcedureDefinition
from app.services.ai_client import (
    AIConfigurationError,
    AIRequestError,
    AIResponseError,
    send_json_message,
)
from app.services.procedure_loader import load_procedure


def generate_knowledge_pack(payload: KnowledgePackRequest) -> KnowledgePackResponse:
    procedure = load_procedure(payload.procedure_id)
    fallback_response = _build_fallback_knowledge_pack(payload, procedure)

    try:
        response_data = send_json_message(
            model=settings.ai_learning_model,
            max_tokens=settings.ai_learning_max_tokens,
            system_prompt=_build_knowledge_system_prompt(payload, procedure),
            user_content=_build_knowledge_user_content(payload, procedure),
            output_schema=KnowledgePackResponse.model_json_schema(),
        )
    except (AIConfigurationError, AIRequestError, AIResponseError):
        return fallback_response

    return _normalize_knowledge_pack(response_data, fallback_response)


def _build_knowledge_system_prompt(
    payload: KnowledgePackRequest,
    procedure: ProcedureDefinition,
) -> str:
    return (
        "You are an engaging clinical skills study coach. "
        f"Generate a compact, gamified knowledge pack for the simulation-only procedure '{procedure.title}'. "
        f"Return every learner-facing field in the requested language '{payload.feedback_language}'. "
        "Keep the content educational, concise, and motivating for a hackathon demo. "
        "The pack must include a rapidfire round, a deeper quiz, and flashcards. "
        "Use only simulation-safe teaching points from the procedure rubric. "
        "Do not provide patient-care instructions, diagnoses, or live-clinical guidance. "
        "Prefer clear, concrete technique cues over trivia."
    )


def _build_knowledge_user_content(
    payload: KnowledgePackRequest,
    procedure: ProcedureDefinition,
) -> list[dict[str, Any]]:
    summary = {
        "procedure_id": procedure.id,
        "procedure_title": procedure.title,
        "practice_surface": procedure.practice_surface,
        "skill_level": payload.skill_level,
        "feedback_language": payload.feedback_language,
        "learner_name": payload.learner_name,
        "focus_area": payload.focus_area,
        "recent_issue_labels": payload.recent_issue_labels,
        "stages": [stage.model_dump(mode="json") for stage in procedure.stages],
        "overlay_targets": [
            target.model_dump(mode="json") for target in procedure.named_overlay_targets
        ],
        "requirements": {
            "rapidfire_rounds": 5,
            "quiz_questions": 5,
            "flashcards": 6,
        },
    }

    return [
        {
            "type": "text",
            "text": (
                "Build a gamified study pack that helps the learner review stage goals, "
                "common errors, and camera-based judging cues. Use short answer options, "
                "stage-aware explanations, and flashcards that are easy to remember.\n\n"
                f"{json.dumps(summary, indent=2)}"
            ),
        }
    ]


def _build_fallback_knowledge_pack(
    payload: KnowledgePackRequest,
    procedure: ProcedureDefinition,
) -> KnowledgePackResponse:
    focus_area = _clean_text(payload.focus_area) or (
        payload.recent_issue_labels[0]
        if payload.recent_issue_labels
        else "needle entry consistency"
    )

    rapidfire = _build_fallback_rapidfire(procedure)
    quiz = _build_fallback_quiz(procedure)
    flashcards = _build_fallback_flashcards(procedure)

    return KnowledgePackResponse(
        title=f"{procedure.title} knowledge lab",
        summary=(
            "Review the live rubric in a fast, game-style format before going back into the trainer."
        ),
        recommended_focus=focus_area,
        celebration_line=(
            "Nice work. Keep the next round focused on one visible correction at a time."
        ),
        rapidfire_rounds=rapidfire,
        quiz_questions=quiz,
        flashcards=flashcards,
    )


def _build_fallback_rapidfire(
    procedure: ProcedureDefinition,
) -> list[KnowledgeMultipleChoiceQuestion]:
    questions: list[KnowledgeMultipleChoiceQuestion] = []
    objectives = [stage.objective for stage in procedure.stages]

    for index, stage in enumerate(procedure.stages[:5]):
        correct = stage.objective
        distractors = [item for item in objectives if item != correct]
        choices, correct_index = _build_choices(correct, distractors, seed=index)
        questions.append(
            KnowledgeMultipleChoiceQuestion(
                id=f"rapidfire-{stage.id}",
                stage_id=stage.id,
                prompt=f"What is the main goal of the {stage.title} stage?",
                choices=choices,
                correct_index=correct_index,
                explanation=(
                    f"The {stage.title} stage is scored on whether the trainer can clearly see "
                    f"the step objective: {stage.objective}"
                ),
                point_value=10,
                difficulty="warmup" if index < 2 else "core",
            )
        )

    return questions


def _build_fallback_quiz(
    procedure: ProcedureDefinition,
) -> list[KnowledgeMultipleChoiceQuestion]:
    questions: list[KnowledgeMultipleChoiceQuestion] = []
    common_errors = _unique_items(
        error for stage in procedure.stages for error in stage.common_errors
    )
    visible_checks = _unique_items(
        check for stage in procedure.stages for check in stage.visible_checks
    )

    for index, stage in enumerate(procedure.stages[:5]):
        if index % 2 == 0:
            correct = stage.common_errors[0] if stage.common_errors else stage.objective
            distractors = [item for item in common_errors if item != correct]
            prompt = f"Which issue is most associated with the {stage.title} stage?"
        else:
            correct = stage.visible_checks[0] if stage.visible_checks else stage.objective
            distractors = [item for item in visible_checks if item != correct]
            prompt = f"Which cue should stay visible for a strong {stage.title} rep?"

        choices, correct_index = _build_choices(correct, distractors, seed=index + 9)
        explanation = (
            f"In {stage.title}, the trainer is checking for {stage.visible_checks[0] if stage.visible_checks else stage.objective}. "
            f"A common miss is {stage.common_errors[0] if stage.common_errors else 'losing the main objective in frame'}."
        )
        questions.append(
            KnowledgeMultipleChoiceQuestion(
                id=f"quiz-{stage.id}",
                stage_id=stage.id,
                prompt=prompt,
                choices=choices,
                correct_index=correct_index,
                explanation=explanation,
                point_value=18,
                difficulty="core" if index < 3 else "challenge",
            )
        )

    return questions


def _build_fallback_flashcards(
    procedure: ProcedureDefinition,
) -> list[KnowledgeFlashcard]:
    cards: list[KnowledgeFlashcard] = []

    for stage in procedure.stages[:5]:
        cards.append(
            KnowledgeFlashcard(
                id=f"flash-stage-{stage.id}",
                stage_id=stage.id,
                front=f"{stage.title}: what should the learner remember?",
                back=(
                    f"Goal: {stage.objective}. Watch for {stage.visible_checks[0] if stage.visible_checks else 'a clear, reviewable frame'}."
                ),
                memory_tip=(
                    f"If this stage fails, first check for {stage.common_errors[0] if stage.common_errors else 'framing drift'}."
                ),
                point_value=12,
            )
        )

    for target in procedure.named_overlay_targets[:1]:
        cards.append(
            KnowledgeFlashcard(
                id=f"flash-target-{target.id}",
                stage_id="setup",
                front=f"Overlay target: {target.label}",
                back=target.description,
                memory_tip="Use overlay targets as visual anchors, not decorations.",
                point_value=10,
            )
        )

    return cards


def _normalize_knowledge_pack(
    response_data: dict[str, Any],
    fallback_response: KnowledgePackResponse,
) -> KnowledgePackResponse:
    title = _clean_text(response_data.get("title")) or fallback_response.title
    summary = _clean_text(response_data.get("summary")) or fallback_response.summary
    recommended_focus = (
        _clean_text(response_data.get("recommended_focus"))
        or fallback_response.recommended_focus
    )
    celebration_line = (
        _clean_text(response_data.get("celebration_line"))
        or fallback_response.celebration_line
    )

    rapidfire = _normalize_mcq_list(
        response_data.get("rapidfire_rounds"),
        fallback_response.rapidfire_rounds,
    )
    quiz = _normalize_mcq_list(
        response_data.get("quiz_questions"),
        fallback_response.quiz_questions,
    )
    flashcards = _normalize_flashcard_list(
        response_data.get("flashcards"),
        fallback_response.flashcards,
    )

    return KnowledgePackResponse(
        title=title,
        summary=summary,
        recommended_focus=recommended_focus,
        celebration_line=celebration_line,
        rapidfire_rounds=rapidfire,
        quiz_questions=quiz,
        flashcards=flashcards,
    )


def _normalize_mcq_list(
    items: Any,
    fallback_items: list[KnowledgeMultipleChoiceQuestion],
) -> list[KnowledgeMultipleChoiceQuestion]:
    normalized: list[KnowledgeMultipleChoiceQuestion] = []
    source_items = items if isinstance(items, list) else []

    for index, fallback in enumerate(fallback_items):
        candidate = source_items[index] if index < len(source_items) else {}
        if not isinstance(candidate, dict):
            candidate = {}

        raw_choices = candidate.get("choices")
        choices = [
            _clean_text(choice)
            for choice in raw_choices
            if isinstance(choice, str) and _clean_text(choice)
        ] if isinstance(raw_choices, list) else []
        unique_choices = _unique_items(choices)
        if len(unique_choices) != 4:
            unique_choices = fallback.choices

        correct_index = candidate.get("correct_index")
        if not isinstance(correct_index, int) or not (0 <= correct_index < len(unique_choices)):
            correct_index = fallback.correct_index

        point_value = candidate.get("point_value")
        if not isinstance(point_value, int) or point_value < 5 or point_value > 40:
            point_value = fallback.point_value

        difficulty = candidate.get("difficulty")
        if difficulty not in {"warmup", "core", "challenge"}:
            difficulty = fallback.difficulty

        normalized.append(
            KnowledgeMultipleChoiceQuestion(
                id=_clean_text(candidate.get("id")) or fallback.id,
                stage_id=_clean_text(candidate.get("stage_id")) or fallback.stage_id,
                prompt=_clean_text(candidate.get("prompt")) or fallback.prompt,
                choices=unique_choices,
                correct_index=correct_index,
                explanation=_clean_text(candidate.get("explanation"))
                or fallback.explanation,
                point_value=point_value,
                difficulty=difficulty,
            )
        )

    return normalized


def _normalize_flashcard_list(
    items: Any,
    fallback_items: list[KnowledgeFlashcard],
) -> list[KnowledgeFlashcard]:
    normalized: list[KnowledgeFlashcard] = []
    source_items = items if isinstance(items, list) else []

    for index, fallback in enumerate(fallback_items):
        candidate = source_items[index] if index < len(source_items) else {}
        if not isinstance(candidate, dict):
            candidate = {}

        point_value = candidate.get("point_value")
        if not isinstance(point_value, int) or point_value < 5 or point_value > 25:
            point_value = fallback.point_value

        normalized.append(
            KnowledgeFlashcard(
                id=_clean_text(candidate.get("id")) or fallback.id,
                stage_id=_clean_text(candidate.get("stage_id")) or fallback.stage_id,
                front=_clean_text(candidate.get("front")) or fallback.front,
                back=_clean_text(candidate.get("back")) or fallback.back,
                memory_tip=_clean_text(candidate.get("memory_tip"))
                or fallback.memory_tip,
                point_value=point_value,
            )
        )

    return normalized


def _build_choices(
    correct: str,
    distractors: list[str],
    *,
    seed: int,
) -> tuple[list[str], int]:
    clean_correct = _clean_text(correct) or "Correct answer"
    clean_distractors = [
        item
        for item in _unique_items(_clean_text(choice) for choice in distractors)
        if item != clean_correct
    ]
    fallback_fillers = [
        "Focus only on speed and ignore framing.",
        "Skip the camera check and move to the next stage.",
        "Treat every blurry frame as a pass.",
        "Ignore the visible objective and tie immediately.",
    ]

    pool = clean_distractors + [
        item for item in fallback_fillers if item != clean_correct
    ]
    selected = pool[:3]
    while len(selected) < 3:
        selected.append(fallback_fillers[len(selected)])

    insert_index = seed % 4
    choices = selected.copy()
    choices.insert(insert_index, clean_correct)
    return choices, insert_index


def _unique_items(values: Any) -> list[str]:
    items: list[str] = []
    for value in values:
        cleaned = _clean_text(value)
        if cleaned and cleaned not in items:
            items.append(cleaned)
    return items


def _clean_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    return " ".join(value.split()).strip()
