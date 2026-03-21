from pydantic import BaseModel, ConfigDict, Field


class NamedOverlayTarget(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    label: str
    description: str
    u: float = Field(ge=0, le=1)
    v: float = Field(ge=0, le=1)
    color: str


class ProcedureStage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    objective: str
    visible_checks: list[str]
    common_errors: list[str]
    overlay_targets: list[str]
    score_weight: int = Field(ge=0)


class ProcedureDefinition(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    simulation_only: bool
    practice_surface: str
    named_overlay_targets: list[NamedOverlayTarget]
    stages: list[ProcedureStage]

