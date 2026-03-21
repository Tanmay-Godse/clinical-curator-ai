from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict[str, bool | str]:
    return {"status": "ok", "simulation_only": settings.simulation_only}

