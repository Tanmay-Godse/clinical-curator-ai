import json
from functools import lru_cache
from pathlib import Path

from app.schemas.procedure import ProcedureDefinition, ProcedureStage

PROCEDURES_DIR = Path(__file__).resolve().parents[1] / "procedures"


class ProcedureNotFoundError(LookupError):
    pass


class StageNotFoundError(LookupError):
    pass


@lru_cache(maxsize=16)
def load_procedure(procedure_id: str) -> ProcedureDefinition:
    for path in sorted(PROCEDURES_DIR.glob("*.json")):
        procedure = ProcedureDefinition.model_validate(json.loads(path.read_text()))
        if procedure.id == procedure_id:
            return procedure
    raise ProcedureNotFoundError(f"Procedure '{procedure_id}' was not found.")


def load_stage(procedure: ProcedureDefinition, stage_id: str) -> ProcedureStage:
    for stage in procedure.stages:
        if stage.id == stage_id:
            return stage
    raise StageNotFoundError(
        f"Stage '{stage_id}' was not found for procedure '{procedure.id}'."
    )

