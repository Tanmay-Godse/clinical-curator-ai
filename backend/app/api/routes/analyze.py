from fastapi import APIRouter, HTTPException

from app.schemas.analyze import AnalyzeFrameRequest, AnalyzeFrameResponse
from app.services.analysis_service import build_mock_analysis
from app.services.procedure_loader import (
    ProcedureNotFoundError,
    StageNotFoundError,
    load_procedure,
    load_stage,
)

router = APIRouter(tags=["analyze"])


@router.post("/analyze-frame", response_model=AnalyzeFrameResponse)
def analyze_frame(payload: AnalyzeFrameRequest) -> AnalyzeFrameResponse:
    try:
        procedure = load_procedure(payload.procedure_id)
        stage = load_stage(procedure, payload.stage_id)
    except (ProcedureNotFoundError, StageNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return build_mock_analysis(stage=stage, student_question=payload.student_question)

