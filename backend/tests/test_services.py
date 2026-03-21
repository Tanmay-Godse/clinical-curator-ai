import pytest

from app.schemas.analyze import AnalyzeFrameRequest
from app.schemas.debrief import DebriefRequest
from app.services import analysis_service, debrief_service
from app.services.anthropic_client import AIResponseError


def test_analysis_service_rejects_unknown_overlay_targets(monkeypatch) -> None:
    monkeypatch.setattr(
        analysis_service,
        "send_json_message",
        lambda **_: {
            "step_status": "retry",
            "confidence": 0.82,
            "visible_observations": [
                "entry zone is visible",
                "needle angle looks shallow",
            ],
            "issues": [
                {
                    "code": "angle_shallow",
                    "severity": "medium",
                    "message": "The angle is too shallow.",
                }
            ],
            "coaching_message": "Rotate upward before retrying.",
            "next_action": "Capture a second attempt.",
            "overlay_target_ids": ["not_a_real_target"],
        },
    )

    payload = AnalyzeFrameRequest(
        procedure_id="simple-interrupted-suture",
        stage_id="needle_entry",
        skill_level="beginner",
        image_base64="ZmFrZQ==",
    )

    with pytest.raises(AIResponseError, match="not allowed for stage 'needle_entry'"):
        analysis_service.analyze_frame_payload(payload)


def test_debrief_service_returns_local_fallback_for_empty_session() -> None:
    response = debrief_service.generate_session_debrief(
        DebriefRequest(
            session_id="session-123",
            procedure_id="simple-interrupted-suture",
            skill_level="beginner",
            events=[],
        )
    )

    assert len(response.strengths) == 3
    assert len(response.improvement_areas) == 3
    assert len(response.practice_plan) == 3
    assert len(response.quiz) == 3
