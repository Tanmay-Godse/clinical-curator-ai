from typing import Any

from app.core.config import settings
from app.core.provider_factory import get_json_message_provider
from app.providers.base import (
    AIConfigurationError,
    AIRequestError,
    AIResponseError,
    JSONMessageRequest,
)


def send_json_message(
    *,
    model: str,
    system_prompt: str,
    user_content: list[dict[str, Any]],
    output_schema: dict[str, Any],
    max_tokens: int,
) -> dict[str, Any]:
    normalized_model = model.strip()
    if not normalized_model:
        raise AIConfigurationError(
            "The requested model id is empty. Set AI_ANALYSIS_MODEL and AI_DEBRIEF_MODEL in backend/.env."
        )

    provider = get_json_message_provider()
    return provider.send_json_message(
        JSONMessageRequest(
            model=normalized_model,
            system_prompt=system_prompt,
            user_content=user_content,
            output_schema=output_schema,
            max_tokens=max_tokens,
        )
    )
