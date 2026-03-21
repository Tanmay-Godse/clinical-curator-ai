from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analyze import EquityModeConfig, FeedbackLanguage, Issue


class DebriefEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage_id: str
    attempt: int = Field(ge=1)
    step_status: Literal["pass", "retry", "unclear", "unsafe"]
    analysis_mode: Literal["coaching", "blocked"] = "coaching"
    graded: bool = True
    grading_reason: str | None = None
    issues: list[Issue] = Field(default_factory=list)
    score_delta: int = Field(ge=0)
    coaching_message: str
    overlay_target_ids: list[str] = Field(default_factory=list)
    visible_observations: list[str] = Field(default_factory=list)
    next_action: str | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    created_at: str


class QuizQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str
    answer: str


class ErrorFingerprintItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    label: str
    count: int = Field(ge=1)
    stage_ids: list[str] = Field(default_factory=list, max_length=6)


class AdaptiveDrill(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    focus: str
    reason: str
    instructions: list[str] = Field(min_length=3, max_length=3)
    rep_target: str


class LearnerProfileSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total_sessions: int = Field(ge=0)
    graded_attempts: int = Field(ge=0)
    recurring_issues: list[ErrorFingerprintItem] = Field(default_factory=list, max_length=3)


class DebriefRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str
    procedure_id: str
    skill_level: Literal["beginner", "intermediate"]
    feedback_language: FeedbackLanguage = "en"
    equity_mode: EquityModeConfig = Field(default_factory=EquityModeConfig)
    learner_profile: LearnerProfileSnapshot | None = None
    events: list[DebriefEvent] = Field(default_factory=list)


class DebriefResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    feedback_language: FeedbackLanguage = "en"
    graded_attempt_count: int = Field(ge=0)
    not_graded_attempt_count: int = Field(ge=0)
    error_fingerprint: list[ErrorFingerprintItem] = Field(default_factory=list, max_length=3)
    adaptive_drill: AdaptiveDrill
    strengths: list[str] = Field(min_length=3, max_length=3)
    improvement_areas: list[str] = Field(min_length=3, max_length=3)
    practice_plan: list[str] = Field(min_length=3, max_length=3)
    equity_support_plan: list[str] = Field(min_length=3, max_length=3)
    audio_script: str
    quiz: list[QuizQuestion] = Field(min_length=3, max_length=3)


class DebriefDraft(DebriefResponse):
    pass
