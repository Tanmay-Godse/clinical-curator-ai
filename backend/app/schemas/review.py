from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analyze import SafetyGateResult


class HumanReviewCase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    status: Literal["pending", "resolved"]
    source: Literal["safety_gate", "confidence_flag", "quality_flag"]
    session_id: str | None = None
    procedure_id: str
    stage_id: str
    skill_level: Literal["beginner", "intermediate"]
    student_name: str | None = None
    created_at: str
    trigger_reason: str
    analysis_blocked: bool = False
    initial_step_status: Literal["pass", "retry", "unclear", "unsafe"] | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    coaching_message: str | None = None
    safety_gate: SafetyGateResult
    reviewer_name: str | None = None
    reviewer_notes: str | None = None
    corrected_step_status: Literal["pass", "retry", "unclear", "unsafe"] | None = None
    corrected_coaching_message: str | None = None
    rubric_feedback: str | None = None
    resolved_at: str | None = None


class ResolveReviewCaseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    reviewer_name: str
    reviewer_notes: str
    corrected_step_status: Literal["pass", "retry", "unclear", "unsafe"] | None = None
    corrected_coaching_message: str | None = None
    rubric_feedback: str | None = None
