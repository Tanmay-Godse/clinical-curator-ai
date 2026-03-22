from __future__ import annotations

import os
import tempfile
from typing import Any

from app.schemas.tts import SpeechSynthesisRequest


class TTSConfigurationError(RuntimeError):
    pass


class TTSSynthesisError(RuntimeError):
    pass


VOICE_ID_PREFERENCES: dict[str, dict[str, list[str]]] = {
    "en": {
        "guide_female": ["gmw/en-us", "gmw/en-us-nyc", "gmw/en", "gmw/en-gb-x-rp"],
        "mentor_female": ["gmw/en-us", "gmw/en-us-nyc", "gmw/en", "gmw/en-gb-x-rp"],
        "system_default": ["gmw/en-us", "gmw/en"],
    },
    "es": {
        "guide_female": ["roa/es", "roa/es-419"],
        "mentor_female": ["roa/es-419", "roa/es"],
        "system_default": ["roa/es", "roa/es-419"],
    },
    "fr": {
        "guide_female": ["roa/fr", "roa/fr-be", "roa/fr-ch"],
        "mentor_female": ["roa/fr", "roa/fr-ch", "roa/fr-be"],
        "system_default": ["roa/fr", "roa/fr-be", "roa/fr-ch"],
    },
    "hi": {
        "guide_female": ["inc/hi"],
        "mentor_female": ["inc/hi"],
        "system_default": ["inc/hi"],
    },
}

VOICE_RATE_BY_PRESET = {
    "guide_female": 176,
    "mentor_female": 160,
    "system_default": 180,
}

VOICE_NAME_HINTS_BY_PRESET = {
    "guide_female": [
        "america",
        "american",
        "allison",
        "aria",
        "ava",
        "emma",
        "jenny",
        "samantha",
        "victoria",
        "zira",
    ],
    "mentor_female": [
        "america",
        "american",
        "catherine",
        "hazel",
        "karen",
        "luna",
        "moira",
        "monica",
        "sara",
        "susan",
    ],
    "system_default": [],
}

FEMALE_VOICE_HINTS = [
    "female",
    "+f",
    "allison",
    "aria",
    "ava",
    "emma",
    "hazel",
    "jenny",
    "karen",
    "luna",
    "moira",
    "monica",
    "samantha",
    "sara",
    "susan",
    "victoria",
    "zira",
]

US_ENGLISH_VOICE_HINTS = [
    "en-us",
    "america",
    "american",
    "new york",
    "new york city",
    "united states",
]

MALE_VOICE_HINTS = [
    "male",
    "+m",
    "alex",
    "arthur",
    "daniel",
    "david",
    "fred",
    "guy",
    "james",
    "john",
    "lee",
    "matthew",
    "oliver",
    "thomas",
]


def synthesize_speech_wav(payload: SpeechSynthesisRequest) -> bytes:
    text = " ".join(payload.text.split())
    if not text:
        raise TTSSynthesisError("Speech text was empty after normalization.")

    try:
        import pyttsx3
    except ImportError as exc:
        raise TTSConfigurationError(
            "Backend TTS requires pyttsx3. Install backend requirements and restart the backend."
        ) from exc

    file_descriptor, output_path = tempfile.mkstemp(suffix=".wav")
    os.close(file_descriptor)
    engine: Any | None = None

    try:
        engine = pyttsx3.init()
        selected_voice_id = _select_voice_id(
            engine=engine,
            language=payload.feedback_language,
            coach_voice=payload.coach_voice,
        )
        if selected_voice_id:
            engine.setProperty("voice", selected_voice_id)

        engine.setProperty(
            "rate",
            VOICE_RATE_BY_PRESET.get(
                payload.coach_voice, VOICE_RATE_BY_PRESET["guide_female"]
            ),
        )
        engine.save_to_file(text, output_path)
        engine.runAndWait()
        engine.stop()

        if not os.path.exists(output_path) or os.path.getsize(output_path) <= 0:
            raise TTSSynthesisError("Backend TTS did not produce any audio output.")

        with open(output_path, "rb") as audio_file:
            return audio_file.read()
    except (TTSConfigurationError, TTSSynthesisError):
        raise
    except Exception as exc:
        raise TTSSynthesisError(
            "Backend TTS could not synthesize speech on this machine."
        ) from exc
    finally:
        if engine is not None:
            try:
                engine.stop()
            except Exception:
                pass
        if os.path.exists(output_path):
            os.remove(output_path)


def _select_voice_id(*, engine: Any, language: str, coach_voice: str) -> str | None:
    voices = engine.getProperty("voices") or []
    preferred_ids = VOICE_ID_PREFERENCES.get(language, {}).get(coach_voice, [])
    preferred_hints = VOICE_NAME_HINTS_BY_PRESET.get(coach_voice, [])

    best_voice_id: str | None = None
    best_score = float("-inf")

    for voice in voices:
        voice_id = str(getattr(voice, "id", ""))
        voice_name = str(getattr(voice, "name", ""))
        voice_gender = str(getattr(voice, "gender", ""))
        combined_voice_text = f"{voice_id} {voice_name} {voice_gender}".lower()
        voice_languages = [
            str(item).lower() for item in getattr(voice, "languages", []) or []
        ]

        language_score = 0
        lowered_voice_id = voice_id.lower()
        if (
            lowered_voice_id.endswith(f"/{language}")
            or f"/{language}-" in lowered_voice_id
            or any(language in item for item in voice_languages)
        ):
            language_score = 24
        elif any(language.split("-")[0] in item for item in voice_languages):
            language_score = 12

        preferred_id_score = 35 if voice_id in preferred_ids else 0
        preferred_hint_score = (
            18
            if any(hint in combined_voice_text for hint in preferred_hints)
            else 0
        )
        female_score = (
            24
            if coach_voice != "system_default"
            and any(hint in combined_voice_text for hint in FEMALE_VOICE_HINTS)
            else 0
        )
        us_english_score = (
            18
            if language == "en"
            and coach_voice != "system_default"
            and any(hint in combined_voice_text for hint in US_ENGLISH_VOICE_HINTS)
            else 0
        )
        male_penalty = (
            -10
            if coach_voice != "system_default"
            and any(hint in combined_voice_text for hint in MALE_VOICE_HINTS)
            else 0
        )
        score = (
            language_score
            + preferred_id_score
            + preferred_hint_score
            + female_score
            + us_english_score
            + male_penalty
        )

        if score > best_score:
            best_score = score
            best_voice_id = voice_id or None

    return best_voice_id or (getattr(voices[0], "id", None) if voices else None)
