import json
from functools import lru_cache
from typing import Any

from anthropic import APIError, Anthropic

from app.core.config import settings


class AIConfigurationError(RuntimeError):
    pass


class AIRequestError(RuntimeError):
    pass


class AIResponseError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def get_anthropic_client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise AIConfigurationError(
            "ANTHROPIC_API_KEY is not configured. Add it to backend/.env before using Phase 2 AI features."
        )

    return Anthropic(
        api_key=settings.anthropic_api_key,
        timeout=settings.anthropic_timeout_seconds,
    )


def send_json_message(
    *,
    model: str,
    system_prompt: str,
    user_content: list[dict[str, Any]],
    output_schema: dict[str, Any],
    max_tokens: int,
) -> dict[str, Any]:
    client = get_anthropic_client()

    try:
        response = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": user_content,
                }
            ],
            output_config={
                "type": "json_schema",
                "schema": output_schema,
            },
        )
    except APIError as exc:
        raise AIRequestError(
            f"Claude request failed: {exc.__class__.__name__}."
        ) from exc

    text_chunks = [
        block.text
        for block in response.content
        if getattr(block, "type", None) == "text"
    ]

    if not text_chunks:
        raise AIResponseError("Claude returned an empty response body.")

    raw_payload = "".join(text_chunks)

    try:
        return json.loads(raw_payload)
    except json.JSONDecodeError as exc:
        raise AIResponseError("Claude returned invalid JSON.") from exc
