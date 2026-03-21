import json
import re
from typing import Any

from pydantic import ValidationError

from app.core.config import settings
from app.schemas.analyze import AnalyzeFrameRequest, SafetyGateDraft, SafetyGateResult
from app.schemas.procedure import ProcedureDefinition, ProcedureStage
from app.services.ai_client import AIRequestError, AIResponseError, send_json_message

CLINICAL_SCENE_PATTERN = re.compile(
    r"\b(patient|operating room|or\b|hospital|bedside|clinic|ward|incision|bleeding|surgery)\b",
    re.IGNORECASE,
)


def evaluate_safety_gate(
    *,
    payload: AnalyzeFrameRequest,
    procedure: ProcedureDefinition,
    stage: ProcedureStage,
) -> SafetyGateResult:
    if not payload.simulation_confirmation:
        return SafetyGateResult(
            status="blocked",
            confidence=1.0,
            reason="Simulation-only confirmation is required before any analysis can run.",
            refusal_message=(
                "Analysis was blocked because this product only supports simulation practice. "
                "Confirm that the image shows an orange, banana, or foam pad before retrying."
            ),
        )

    text_signal = payload.student_question or ""
    if CLINICAL_SCENE_PATTERN.search(text_signal):
        return SafetyGateResult(
            status="blocked",
            confidence=0.95,
            reason="The request text suggests a real-patient or live-clinical context.",
            refusal_message=(
                "Analysis was blocked because the request appears related to a real patient or clinical scene. "
                "Use the trainer only for simulation images captured on a practice surface."
            ),
        )

    try:
        response_data = send_json_message(
            model=settings.ai_analysis_model,
            max_tokens=settings.ai_safety_max_tokens,
            system_prompt=_build_safety_system_prompt(),
            user_content=_build_safety_user_content(
                payload=payload,
                procedure=procedure,
                stage=stage,
            ),
            output_schema=SafetyGateDraft.model_json_schema(),
        )
        draft = SafetyGateDraft.model_validate(response_data)
    except (AIRequestError, AIResponseError, ValidationError):
        return SafetyGateResult(
            status="needs_human_review",
            confidence=0.0,
            reason="Automatic safety screening could not confirm a simulation-only practice scene.",
            refusal_message=(
                "Analysis was paused because the safety screen could not confidently verify that this image comes "
                "from a simulation setup. A faculty reviewer can inspect the session manually."
            ),
        )

    refusal_message = (draft.refusal_message or "").strip() or None
    if draft.status == "blocked" and not refusal_message:
        refusal_message = (
            "Analysis was blocked because the image may depict a real patient or live clinical scene. "
            "Use only simulation images from an orange, banana, or foam pad."
        )
    if draft.status == "needs_human_review" and not refusal_message:
        refusal_message = (
            "Analysis was paused because the safety screen could not confidently clear the image for autonomous coaching. "
            "A faculty reviewer can inspect the session manually."
        )

    return SafetyGateResult(
        status=draft.status,
        confidence=draft.confidence,
        reason=draft.reason.strip(),
        refusal_message=refusal_message,
    )


def _build_safety_system_prompt() -> str:
    return (
        "You are a safety gate for a simulation-only suturing coach. "
        "Your job is to block or escalate images that may show a real patient, living tissue, or a live clinical environment. "
        "Only clear images that confidently appear to be simulation practice on an orange, banana, foam pad, bench model, or other inert training surface. "
        "If you are unsure, use 'needs_human_review'."
    )


def _build_safety_user_content(
    *,
    payload: AnalyzeFrameRequest,
    procedure: ProcedureDefinition,
    stage: ProcedureStage,
) -> list[dict[str, Any]]:
    safety_context = {
        "procedure_title": procedure.title,
        "stage_title": stage.title,
        "practice_surface": procedure.practice_surface,
        "student_question": payload.student_question or "",
        "allowed_scene_examples": [
            "orange practice surface",
            "banana peel practice surface",
            "foam pad or bench model",
        ],
        "blocked_scene_examples": [
            "real patient skin or tissue",
            "operating room",
            "bedside clinical environment",
            "live wound or incision",
        ],
    }

    return [
        {
            "type": "text",
            "text": (
                "Classify whether this scene is safe for simulation-only coaching.\n\n"
                f"{json.dumps(safety_context, indent=2)}"
            ),
        },
        {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": payload.image_base64,
            },
        },
    ]
