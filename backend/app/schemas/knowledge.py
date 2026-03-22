from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.analyze import FeedbackLanguage


class KnowledgeMultipleChoiceQuestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    stage_id: str
    prompt: str
    choices: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str
    point_value: int = Field(ge=5, le=40)
    difficulty: Literal["warmup", "core", "challenge"] = "core"


class KnowledgeFlashcard(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    stage_id: str
    front: str
    back: str
    memory_tip: str
    point_value: int = Field(ge=5, le=25)


class KnowledgePackRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    procedure_id: str
    skill_level: Literal["beginner", "intermediate"]
    feedback_language: FeedbackLanguage = "en"
    learner_name: str | None = None
    focus_area: str | None = None
    recent_issue_labels: list[str] = Field(default_factory=list, max_length=5)


class KnowledgePackResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    summary: str
    recommended_focus: str
    celebration_line: str
    rapidfire_rounds: list[KnowledgeMultipleChoiceQuestion] = Field(
        min_length=4, max_length=6
    )
    quiz_questions: list[KnowledgeMultipleChoiceQuestion] = Field(
        min_length=4, max_length=6
    )
    flashcards: list[KnowledgeFlashcard] = Field(min_length=4, max_length=8)
