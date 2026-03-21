import json
from typing import Any

from pydantic import ValidationError

from app.core.config import settings
from app.schemas.debrief import DebriefDraft, DebriefRequest, DebriefResponse, QuizQuestion
from app.services.anthropic_client import AIResponseError, send_json_message
from app.services.procedure_loader import load_procedure


def generate_session_debrief(payload: DebriefRequest) -> DebriefResponse:
    procedure = load_procedure(payload.procedure_id)

    if not payload.events:
        return DebriefResponse(
            strengths=[
                "You opened the trainer and set up a simulation-only suturing session.",
                "The review workflow is ready once you capture a scored attempt.",
                "Your session record is already structured for stage-by-stage coaching.",
            ],
            improvement_areas=[
                "Capture at least one analyzed frame to unlock personalized technique feedback.",
                "Log a full attempt on the current stage so the debrief can compare progress.",
                "Use the trainer camera to keep the practice surface centered and visible.",
            ],
            practice_plan=[
                "Start with the setup stage and capture a clear frame with the instrument visible.",
                "Ask one focused question during analysis so the coaching stays targeted.",
                "Return to review after the first scored attempt to generate the AI debrief.",
            ],
            quiz=[
                QuizQuestion(
                    question="Why does the trainer ask for a clear view of the practice surface?",
                    answer="A clear view makes it easier to judge technique, framing, and target alignment.",
                ),
                QuizQuestion(
                    question="What should you do if the frame is blurry or the tool is out of view?",
                    answer="Retake the frame so the analyzer can judge the step more reliably.",
                ),
                QuizQuestion(
                    question="What is the first goal of the setup stage?",
                    answer="Center the simulation surface and keep the tools visible before advancing.",
                ),
            ],
        )

    response_data = send_json_message(
        model=settings.anthropic_debrief_model,
        max_tokens=settings.anthropic_debrief_max_tokens,
        system_prompt=_build_debrief_system_prompt(),
        user_content=_build_debrief_user_content(
            payload=payload,
            procedure_title=procedure.title,
            practice_surface=procedure.practice_surface,
        ),
        output_schema=DebriefDraft.model_json_schema(),
    )

    try:
        return DebriefDraft.model_validate(response_data)
    except ValidationError as exc:
        raise AIResponseError("Claude returned an invalid debrief payload.") from exc


def _build_debrief_system_prompt() -> str:
    return (
        "You are an AI clinical skills coach writing a brief review for a simulation-only suturing practice session. "
        "The learner is practicing a simple interrupted suture on a safe practice surface, not a patient. "
        "Use the recorded stage events to identify strengths, improvement areas, a three-step practice plan, and a three-question quiz. "
        "Keep the tone encouraging, specific, and educational. "
        "Do not invent patient-care claims or high-stakes medical advice."
    )


def _build_debrief_user_content(
    *,
    payload: DebriefRequest,
    procedure_title: str,
    practice_surface: str,
) -> list[dict[str, Any]]:
    session_summary: dict[str, Any] = {
        "session_id": payload.session_id,
        "procedure_title": procedure_title,
        "practice_surface": practice_surface,
        "skill_level": payload.skill_level,
        "attempt_count": len(payload.events),
        "total_score": sum(event.score_delta for event in payload.events),
        "events": [event.model_dump(mode="json") for event in payload.events],
    }

    return [
        {
            "type": "text",
            "text": (
                "Generate a concise debrief for this stored suturing session. "
                "The response must match the JSON schema exactly.\n\n"
                f"{json.dumps(session_summary, indent=2)}"
            ),
        }
    ]
