from fastapi import APIRouter, HTTPException

from app.schemas.debrief import DebriefRequest, DebriefResponse
from app.services import debrief_service
from app.services.anthropic_client import (
    AIConfigurationError,
    AIRequestError,
    AIResponseError,
)
from app.services.procedure_loader import ProcedureNotFoundError

router = APIRouter(tags=["debrief"])


@router.post("/debrief", response_model=DebriefResponse)
def create_debrief(payload: DebriefRequest) -> DebriefResponse:
    try:
        return debrief_service.generate_session_debrief(payload)
    except ProcedureNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except AIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (AIRequestError, AIResponseError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
