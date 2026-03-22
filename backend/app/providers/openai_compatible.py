import json
from typing import Any
from urllib.parse import urlparse

import httpx

from app.providers.base import (
    AIConfigurationError,
    AIRequestError,
    AIResponseError,
    JSONMessageRequest,
)

PLACEHOLDER_API_KEYS = {
    "SET_IN_ENV_MANAGER",
    "SET_IN_MICROMAMBA_ENV",
    "YOUR_REAL_KEY_HERE",
}


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        timeout_seconds: float,
    ) -> None:
        self._base_url = base_url
        self._api_key = api_key or "EMPTY"
        self._timeout_seconds = timeout_seconds

    def send_json_message(self, request: JSONMessageRequest) -> dict[str, Any]:
        api_key = self._api_key.strip() or "EMPTY"
        if api_key.upper() in PLACEHOLDER_API_KEYS:
            raise AIConfigurationError(
                "AI_API_KEY is still set to a placeholder value. Inject the real key through your shell or micromamba environment first."
            )

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        provider_flavor = _provider_flavor(self._base_url)
        payload_plan = _payload_plan_for_provider(provider_flavor)
        response: httpx.Response | None = None

        for index, response_mode in enumerate(payload_plan):
            try:
                response = self._post_json_message(
                    headers=headers,
                    payload=_build_payload(
                        request=request,
                        response_format_type=response_mode,
                        provider_flavor=provider_flavor,
                    ),
                )
            except httpx.HTTPError as exc:
                raise AIRequestError(
                    "The OpenAI-compatible request could not reach the configured model server."
                ) from exc

            if response.status_code < 400:
                break

            has_next_attempt = index < len(payload_plan) - 1
            if not has_next_attempt:
                break

            if not _should_try_next_payload(
                response=response,
                current_mode=response_mode,
                next_mode=payload_plan[index + 1],
            ):
                break

        if response is None:
            raise AIResponseError("The model request did not receive a response.")

        if response.status_code >= 400:
            raise AIRequestError(_extract_error_message(response))

        try:
            response_data = response.json()
        except json.JSONDecodeError as exc:
            raise AIResponseError(
                "The model server returned a non-JSON response."
            ) from exc

        raw_payload = _extract_message_text(response_data)

        try:
            parsed_payload = json.loads(raw_payload)
        except json.JSONDecodeError as exc:
            raise AIResponseError(
                "The model server returned invalid JSON content."
            ) from exc

        if not isinstance(parsed_payload, dict):
            raise AIResponseError(
                "The model server returned a JSON value that was not an object."
            )

        return parsed_payload

    def _post_json_message(
        self,
        *,
        headers: dict[str, str],
        payload: dict[str, Any],
    ) -> httpx.Response:
        return httpx.post(
            _chat_completions_url(self._base_url),
            headers=headers,
            json=payload,
            timeout=self._timeout_seconds,
        )


def _provider_flavor(base_url: str) -> str:
    parsed = urlparse(base_url.rstrip("/").lower())
    if parsed.netloc.endswith("z.ai") or "bigmodel" in parsed.netloc:
        return "zai"
    return "generic"


def _payload_plan_for_provider(provider_flavor: str) -> list[str | None]:
    if provider_flavor == "zai":
        return ["json_object", None]
    return ["json_schema", "json_object", None]


def _should_try_next_payload(
    *,
    response: httpx.Response,
    current_mode: str | None,
    next_mode: str | None,
) -> bool:
    if current_mode == "json_schema" and next_mode == "json_object":
        return _should_retry_with_json_object(response)

    if current_mode in {"json_schema", "json_object"} and next_mode is None:
        return _should_retry_without_response_format(response)

    return False


def _build_payload(
    *,
    request: JSONMessageRequest,
    response_format_type: str | None,
    provider_flavor: str,
) -> dict[str, Any]:
    system_prompt = request.system_prompt

    if response_format_type in {"json_object", None}:
        system_prompt = _system_prompt_with_embedded_schema(
            request.system_prompt,
            request.output_schema,
        )

    payload = {
        "model": request.model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": _to_openai_content(
                    request.user_content,
                    provider_flavor=provider_flavor,
                ),
            },
        ],
        "max_tokens": request.max_tokens,
        "temperature": 0,
    }

    if response_format_type == "json_schema":
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": {
                "name": "coach_response",
                "schema": request.output_schema,
            },
        }
    elif response_format_type == "json_object":
        payload["response_format"] = {"type": "json_object"}

    return payload


def _system_prompt_with_embedded_schema(
    system_prompt: str,
    output_schema: dict[str, Any],
) -> str:
    schema_json = json.dumps(output_schema, indent=2, sort_keys=True)
    return (
        f"{system_prompt}\n\n"
        "Return a valid JSON object that matches this schema exactly. "
        "Do not wrap the JSON in markdown or add any extra commentary.\n"
        f"{schema_json}"
    )


def _should_retry_with_json_object(response: httpx.Response) -> bool:
    if response.status_code not in {400, 404, 422}:
        return False

    error_message = _extract_error_message(response).lower()
    return "json_schema" in error_message or (
        "response_format" in error_message and "schema" in error_message
    )


def _should_retry_without_response_format(response: httpx.Response) -> bool:
    if response.status_code not in {400, 404, 422}:
        return False

    error_message = _extract_error_message(response).lower()
    return "response_format" in error_message or "json_object" in error_message


def _chat_completions_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    return f"{normalized}/chat/completions"


def _to_openai_content(
    user_content: list[dict[str, Any]],
    *,
    provider_flavor: str,
) -> list[dict[str, Any]]:
    converted: list[dict[str, Any]] = []

    for item in user_content:
        item_type = item.get("type")

        if item_type == "text":
            text = item.get("text")
            if isinstance(text, str):
                converted.append({"type": "text", "text": text})
            continue

        if item_type == "image":
            source = item.get("source")
            if not isinstance(source, dict):
                raise AIRequestError("The image payload is missing its source block.")
            media_type = source.get("media_type")
            data = source.get("data")
            if not isinstance(media_type, str) or not isinstance(data, str):
                raise AIRequestError(
                    "The image payload must include a media type and base64 data."
                )
            converted.append(
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{media_type};base64,{data}",
                    },
                }
            )
            continue

        if item_type == "audio":
            if provider_flavor == "zai":
                raise AIRequestError(
                    "Audio input is not supported for the configured Z.AI GLM chat-completions endpoint in this build."
                )

            source = item.get("source")
            if not isinstance(source, dict):
                raise AIRequestError("The audio payload is missing its source block.")
            data = source.get("data")
            audio_format = source.get("format")
            if not isinstance(data, str) or not isinstance(audio_format, str):
                raise AIRequestError(
                    "The audio payload must include base64 data and a format."
                )
            normalized_format = audio_format.strip().lower()
            if normalized_format not in {"wav", "mp3"}:
                raise AIRequestError(
                    "The audio payload format must be wav or mp3 for the OpenAI-compatible provider."
                )
            converted.append(
                {
                    "type": "input_audio",
                    "input_audio": {
                        "data": data,
                        "format": normalized_format,
                    },
                }
            )

    if not converted:
        raise AIRequestError(
            "The model request did not include any usable user content."
        )

    return converted


def _extract_error_message(response: httpx.Response) -> str:
    fallback_message = (
        f"OpenAI-compatible request failed with status {response.status_code}."
    )

    try:
        error_data = response.json()
    except json.JSONDecodeError:
        return fallback_message

    if isinstance(error_data, dict):
        error_block = error_data.get("error")
        if isinstance(error_block, dict):
            message = error_block.get("message")
            if isinstance(message, str) and message.strip():
                return message.strip()
        detail = error_data.get("detail")
        if isinstance(detail, str) and detail.strip():
            return detail.strip()

    return fallback_message


def _extract_message_text(response_data: dict[str, Any]) -> str:
    try:
        message = response_data["choices"][0]["message"]
    except (KeyError, IndexError, TypeError) as exc:
        raise AIResponseError(
            "The model server returned an unexpected response structure."
        ) from exc

    content = message.get("content")
    if isinstance(content, str) and content.strip():
        return content

    if isinstance(content, list):
        text_parts = [
            item.get("text", "")
            for item in content
            if isinstance(item, dict) and item.get("type") == "text"
        ]
        joined = "".join(part for part in text_parts if isinstance(part, str))
        if joined.strip():
            return joined

    raise AIResponseError("The model server returned an empty response body.")
