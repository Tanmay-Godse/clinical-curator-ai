from fastapi import APIRouter, HTTPException, Response

from app.schemas.tts import SpeechSynthesisRequest
from app.services import tts_service

router = APIRouter(tags=["tts"])


@router.post("/tts")
def synthesize_speech(payload: SpeechSynthesisRequest) -> Response:
    try:
        synthesized_audio = tts_service.synthesize_speech(payload)
    except tts_service.TTSConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except tts_service.TTSSynthesisError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return Response(
        content=synthesized_audio.audio_bytes,
        media_type=synthesized_audio.media_type,
        headers={"Cache-Control": "no-store"},
    )
