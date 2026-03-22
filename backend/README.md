# Backend

This package contains the FastAPI backend for AI Clinical Skills Coach.

## Responsibilities

- serve procedure metadata to the frontend
- run the simulation-only safety gate
- send analysis, coaching, and debrief requests to `claude-sonnet-4-6`
- transcribe learner voice with `gpt-4o-mini-transcribe`
- validate and normalize AI responses
- compute deterministic score changes in Python
- withhold hard scores when image confidence is too low
- honor multilingual and equity-mode debrief settings
- merge optional learner-profile snapshots into debrief generation
- return personal error fingerprints and adaptive drill prescriptions
- return stable fallback debrief content when the debrief AI path is unavailable
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

Key settings:

- `FRONTEND_ORIGIN`: allowed browser origin for CORS
- `SIMULATION_ONLY`: keeps the backend in training-only mode
- `AI_PROVIDER`: `auto`, `openai`, or `anthropic`
- `AI_API_BASE_URL`: base URL for the upstream AI endpoint
- `AI_API_KEY`: bearer key for OpenAI-compatible endpoints or key header for Anthropic
- `AI_ANALYSIS_MODEL`: model used by `/api/v1/analyze-frame`
- `AI_DEBRIEF_MODEL`: model used by `/api/v1/debrief`
- `AI_COACH_MODEL`: model used by `/api/v1/coach-chat`
- `AI_TIMEOUT_SECONDS`: outbound request timeout
- `AI_ANALYSIS_MAX_TOKENS`: max tokens for analysis responses
- `AI_DEBRIEF_MAX_TOKENS`: max tokens for debrief responses
- `AI_SAFETY_MAX_TOKENS`: max tokens for safety-gate classification
- `HUMAN_REVIEW_CONFIDENCE_THRESHOLD`: confidence cutoff for automatic human escalation
- `GRADING_CONFIDENCE_THRESHOLD`: confidence cutoff for attaching a hard score to an analyzed attempt
- `ANTHROPIC_VERSION`: only used for Anthropic-style requests
- `TRANSCRIPTION_*`: dedicated speech-to-text configuration for learner audio

Backward compatibility:

- `OPENAI_*` and `ANTHROPIC_*` environment variables still work as aliases
- `AI_PROVIDER=auto` is the preferred default
- for public repos, keep `AI_API_KEY` out of tracked files and inject it through your environment manager

## Provider Auto-Detection

When `AI_PROVIDER=auto`, the backend uses these rules:

- if `AI_API_BASE_URL` points to `anthropic.com`, use Anthropic mode
- if `AI_API_BASE_URL` ends with `/messages`, use Anthropic mode
- otherwise, use OpenAI-compatible mode

Use an explicit `AI_PROVIDER` override if your proxy URL is ambiguous.

## Optional Provider Examples

### Anthropic-Style

```env
AI_PROVIDER=anthropic
AI_API_BASE_URL=https://api.anthropic.com/v1/messages
AI_API_KEY=SET_IN_ENV_MANAGER
AI_ANALYSIS_MODEL=claude-sonnet-4-6
AI_DEBRIEF_MODEL=claude-sonnet-4-6
AI_COACH_MODEL=claude-sonnet-4-6
```

### OpenAI-Compatible

```env
AI_PROVIDER=openai
AI_API_BASE_URL=https://your-openai-compatible-endpoint.example/v1
AI_API_KEY=SET_IN_ENV_MANAGER
AI_ANALYSIS_MODEL=your-vision-model
AI_DEBRIEF_MODEL=your-text-or-multimodal-model
AI_COACH_MODEL=your-text-or-multimodal-model
```

Use a vision-capable model for `AI_ANALYSIS_MODEL`. Text-only models will not work for the analyze route.

## Endpoints

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

- requires a vision-capable analysis model
- blocks analysis unless the request is confirmed as simulation-only
- accepts `practice_surface`, `feedback_language`, and `equity_mode`
- may return `analysis_mode="blocked"` without throwing an HTTP error
- returns `grading_decision` and `grading_reason` so the frontend can distinguish scored attempts from retake-only guidance
- returns `404` for unknown procedures or stages
- returns `503` when live AI analysis is not configured
- returns `502` when the upstream AI request fails or returns invalid JSON

`POST /api/v1/coach-chat`

- supports text turns and learner voice turns
- transcribes learner audio before sending the conversation to Claude
- can use the current frame when `simulation_confirmation=true`

`POST /api/v1/knowledge-pack`

- returns rapidfire rounds, quiz questions, and flashcards
- uses the cheaper learning-model path with a rubric-based fallback

`POST /api/v1/tts`

- returns `audio/wav`
- uses the selected coach voice preset for spoken playback

`POST /api/v1/debrief`

- returns an AI debrief when the backend is online
- still normalizes the response into a stable study-summary shape
- accepts an optional frontend-built `learner_profile` snapshot
- includes `equity_support_plan`, `audio_script`, `error_fingerprint`, `adaptive_drill`, `graded_attempt_count`, and `not_graded_attempt_count`

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
