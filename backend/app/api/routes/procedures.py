from fastapi import APIRouter, HTTPException

from app.schemas.procedure import ProcedureDefinition
from app.services.procedure_loader import ProcedureNotFoundError, load_procedure

router = APIRouter(tags=["procedures"])


@router.get("/procedures/{procedure_id}", response_model=ProcedureDefinition)
def get_procedure(procedure_id: str) -> ProcedureDefinition:
    try:
        return load_procedure(procedure_id)
    except ProcedureNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

