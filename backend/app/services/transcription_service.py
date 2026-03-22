import base64
import binascii

import httpx

from app.core.config import settings
from app.providers.base import AIConfigurationError, AIRequestError, AIResponseError

PLACEHOLDER_API_KEYS = {
    "SET_IN_ENV_MANAGER",
    "SET_IN_MICROMAMBA_ENV",
    "YOUR_REAL_KEY_HERE",
}

MEDIA_TYPE_BY_FORMAT = {
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
}


def transcribe_audio_clip(*, audio_base64: str, audio_format: str | None) -> str:
    api_key = (settings.transcription_api_key or "").strip()
    if (
        not api_key
        or api_key == "EMPTY"
        or api_key.upper() in PLACEHOLDER_API_KEYS
    ):
        raise AIConfigurationError(
            "TRANSCRIPTION_API_KEY is not configured. Add an OpenAI API key for gpt-4o-mini-transcribe."
        )

    normalized_format = (audio_format or "wav").strip().lower()
    media_type = MEDIA_TYPE_BY_FORMAT.get(normalized_format)
    if not media_type:
        raise AIRequestError(
            "The transcription service only supports wav or mp3 audio clips."
        )

    try:
        audio_bytes = base64.b64decode(audio_base64, validate=True)
    except (ValueError, binascii.Error) as exc:
        raise AIRequestError("The learner audio clip is not valid base64 data.") from exc

    headers = {
        "Authorization": f"Bearer {api_key}",
    }
    files = {
        "file": (
            f"learner.{normalized_format}",
            audio_bytes,
            media_type,
        ),
    }
    data = {
        "model": settings.transcription_model,
        "response_format": "json",
    }

    try:
        response = httpx.post(
            f"{settings.transcription_api_base_url.rstrip('/')}/audio/transcriptions",
            headers=headers,
            data=data,
            files=files,
            timeout=settings.transcription_timeout_seconds,
        )
    except httpx.HTTPError as exc:
        raise AIRequestError(
            "The transcription request could not reach the configured OpenAI endpoint."
        ) from exc

    if response.status_code >= 400:
        raise AIRequestError(_extract_error_message(response))

    try:
        payload = response.json()
    except ValueError as exc:
        raise AIResponseError(
            "The transcription endpoint returned a non-JSON response."
        ) from exc

    transcript = payload.get("text")
    if not isinstance(transcript, str):
        raise AIResponseError(
            "The transcription endpoint did not return a text transcript."
        )

    cleaned = transcript.strip()
    if not cleaned:
        raise AIResponseError(
            "The transcription endpoint returned an empty transcript."
        )

    return cleaned


def _extract_error_message(response: httpx.Response) -> str:
    fallback_message = (
        f"Transcription request failed with status {response.status_code}."
    )

    try:
        error_data = response.json()
    except ValueError:
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
