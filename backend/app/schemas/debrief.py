from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analyze import Issue


class DebriefEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stage_id: str
    attempt: int = Field(ge=1)
    step_status: Literal["pass", "retry", "unclear", "unsafe"]
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


class DebriefRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str
    procedure_id: str
    skill_level: Literal["beginner", "intermediate"]
    events: list[DebriefEvent] = Field(default_factory=list)


class DebriefResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    strengths: list[str] = Field(min_length=3, max_length=3)
    improvement_areas: list[str] = Field(min_length=3, max_length=3)
    practice_plan: list[str] = Field(min_length=3, max_length=3)
    quiz: list[QuizQuestion] = Field(min_length=3, max_length=3)


class DebriefDraft(DebriefResponse):
    pass
