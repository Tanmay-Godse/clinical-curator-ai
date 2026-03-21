from typing import Literal

from fastapi import APIRouter, HTTPException, Query

from app.schemas.review import HumanReviewCase, ResolveReviewCaseRequest
from app.services import review_queue_service
from app.services.review_queue_service import ReviewCaseNotFoundError

router = APIRouter(tags=["review-cases"])


@router.get("/review-cases", response_model=list[HumanReviewCase])
def get_review_cases(
    status: Literal["pending", "resolved"] | None = Query(default=None),
    session_id: str | None = Query(default=None),
) -> list[HumanReviewCase]:
    return review_queue_service.list_review_cases(
        status=status,
        session_id=session_id,
    )


@router.post("/review-cases/{case_id}/resolve", response_model=HumanReviewCase)
def resolve_review_case(
    case_id: str,
    payload: ResolveReviewCaseRequest,
) -> HumanReviewCase:
    try:
        return review_queue_service.resolve_review_case(case_id, payload)
    except ReviewCaseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
