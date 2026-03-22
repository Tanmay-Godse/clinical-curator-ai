from fastapi import APIRouter, HTTPException

from app.schemas.knowledge import KnowledgePackRequest, KnowledgePackResponse
from app.services import knowledge_service
from app.services.procedure_loader import ProcedureNotFoundError

router = APIRouter(tags=["knowledge"])


@router.post("/knowledge-pack", response_model=KnowledgePackResponse)
def create_knowledge_pack(payload: KnowledgePackRequest) -> KnowledgePackResponse:
    try:
        return knowledge_service.generate_knowledge_pack(payload)
    except ProcedureNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
