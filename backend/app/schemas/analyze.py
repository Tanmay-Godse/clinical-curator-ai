from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Issue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    code: str
    severity: Literal["low", "medium", "high"]
    message: str


class AnalyzeFrameRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    procedure_id: str
    stage_id: str
    skill_level: Literal["beginner", "intermediate"]
    image_base64: str = Field(min_length=1)
    student_question: str | None = None


class AnalyzeFrameResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step_status: Literal["pass", "retry", "unclear", "unsafe"]
    confidence: float = Field(ge=0, le=1)
    visible_observations: list[str]
    issues: list[Issue]
    coaching_message: str
    next_action: str
    overlay_target_ids: list[str]
    score_delta: int = Field(ge=0)


class AnalysisDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step_status: Literal["pass", "retry", "unclear", "unsafe"]
    confidence: float = Field(ge=0, le=1)
    visible_observations: list[str] = Field(min_length=2, max_length=4)
    issues: list[Issue] = Field(default_factory=list, max_length=3)
    coaching_message: str
    next_action: str
    overlay_target_ids: list[str] = Field(default_factory=list, max_length=3)
