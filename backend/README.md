# Backend

This package contains the FastAPI backend for AI Clinical Skills Coach.

## Responsibilities

- serve procedure metadata to the frontend
- run the simulation-only safety gate
- send analysis, coaching, and debrief requests to `claude-sonnet-4-6`
- transcribe learner voice with `gpt-4o-mini-transcribe`
- validate and normalize AI responses
- compute deterministic score changes
- manage the faculty review queue
- persist local demo accounts in SQLite

## Local Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```

## Recommended Environment

```env
FRONTEND_ORIGIN=http://localhost:3000
SIMULATION_ONLY=true

AI_PROVIDER=anthropic
AI_API_BASE_URL=https://api.anthropic.com/v1/messages
AI_API_KEY=SET_IN_ENV_MANAGER
AI_ANALYSIS_MODEL=claude-sonnet-4-6
AI_DEBRIEF_MODEL=claude-sonnet-4-6
AI_COACH_MODEL=claude-sonnet-4-6

AI_TIMEOUT_SECONDS=60
AI_ANALYSIS_MAX_TOKENS=1400
AI_DEBRIEF_MAX_TOKENS=1200
AI_SAFETY_MAX_TOKENS=600
HUMAN_REVIEW_CONFIDENCE_THRESHOLD=0.78
GRADING_CONFIDENCE_THRESHOLD=0.80
ANTHROPIC_VERSION=2023-06-01

TRANSCRIPTION_API_BASE_URL=https://api.openai.com/v1
TRANSCRIPTION_API_KEY=SET_IN_ENV_MANAGER
TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
TRANSCRIPTION_TIMEOUT_SECONDS=60
```

Keep real API keys out of tracked files.

## Main Endpoints

- `GET /api/v1/health`
- `GET /api/v1/auth/accounts/preview`
- `POST /api/v1/auth/accounts`
- `POST /api/v1/auth/sign-in`
- `PUT /api/v1/auth/accounts/{account_id}`
- `GET /api/v1/procedures/{id}`
- `POST /api/v1/knowledge-pack`
- `POST /api/v1/analyze-frame`
- `POST /api/v1/coach-chat`
- `POST /api/v1/tts`
- `POST /api/v1/debrief`
- `GET /api/v1/review-cases`
- `POST /api/v1/review-cases/{case_id}/resolve`

## Current Route Notes

`POST /api/v1/analyze-frame`

- requires a vision-capable Claude model
- blocks analysis unless the request is confirmed as simulation-only
- accepts `practice_surface`, `feedback_language`, and `equity_mode`
- can return `analysis_mode="blocked"` without throwing an HTTP error

`POST /api/v1/coach-chat`

- supports text turns and learner voice turns
- transcribes learner audio before sending the conversation to Claude
- can use the current frame when `simulation_confirmation=true`

`POST /api/v1/knowledge-pack`

- returns rapidfire rounds, quiz questions, and flashcards
- uses the cheaper learning model path with a rubric-based fallback

`POST /api/v1/tts`

- returns `audio/wav`
- uses the selected coach voice preset for spoken playback

`POST /api/v1/debrief`

- returns an AI debrief when the backend is online
- still normalizes the response into a stable study-summary shape
- includes `equity_support_plan` and `audio_script`

## Testing

```bash
source .venv/bin/activate
pytest
```

Focused checks used most often in this repo:

```bash
./.venv/bin/pytest tests/test_services.py tests/test_api.py -q
```

Smoke-tested locally on `2026-03-22`:

- health
- procedure load
- auth preview and sign-in
- knowledge pack
- coach chat
- analyze frame
- debrief
- TTS
- review cases

For full app setup, use [../docs/local-setup.md](../docs/local-setup.md).
