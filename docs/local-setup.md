# Local Setup Guide

This guide explains the current local demo setup and the trainer behavior that
the UI exposes today.

## Current Stack

- `Frontend`: Next.js app with dashboard, knowledge lab, library, profile, trainer, and review flows
- `Backend`: FastAPI app with procedure loading, safety gate, analysis, coaching, review queue, and debrief generation
- `Main model`: `claude-sonnet-4-6`
- `Speech-to-text`: `gpt-4o-mini-transcribe`
- `Session storage`: browser `localStorage`
- `Accounts`: local demo accounts persisted through the backend
- `Developer approvals`: fixed super-user account gates admin promotion

## Local Services

- frontend: `http://localhost:3000`
- backend: `http://localhost:8001`
- API base for frontend: `http://localhost:8001/api/v1`

## Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Recommended `backend/.env`:

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

Start the backend:

```bash
uvicorn app.main:app --reload --port 8001
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend env:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
```

## Provider Compatibility

The current docs are written around Anthropic plus OpenAI transcription, but the
backend config still supports:

- `AI_PROVIDER=auto` for provider auto-detection
- Anthropic-style `/messages` endpoints
- OpenAI-compatible AI endpoints
- older `OPENAI_*` and `ANTHROPIC_*` env aliases

If you use a nonstandard proxy, set `AI_PROVIDER` explicitly.

## Main Routes

- `/dashboard`: default app landing page
- `/knowledge`: gamified study and flashcard mode
- `/train/simple-interrupted-suture`: live trainer
- `/library`: learning library
- `/profile`: local account profile and editing
- `/review/[sessionId]`: session review and debrief
- `/admin/reviews`: faculty review queue
- `/developer/approvals`: fixed developer approval queue

## Local Auth Model

The login page is shared for everyone.

- `student`: default learner workspace
- `admin`: only becomes active after developer approval
- `developer`: fixed super-user account used for approvals and admin queue access

Fixed developer credentials for the local demo:

- email: `developer@gmail.com`
- password: `Qwerty@123`

Important behavior:

- the developer email cannot be created from the UI
- selecting `Admin reviewer` during account creation creates a student account with a pending admin request
- only the fixed developer account can approve or reject those requests

## Live Trainer Behavior

The trainer is intentionally constrained for the hackathon demo:

- each camera run is limited to `2 minutes`
- the recurring camera-based coach refresh runs every `1 second`
- the voice loop listens continuously between coach turns when `Audio coaching` is on
- the camera surface itself stays clean while live; setup overlays are not drawn on top of the video
- setup automatically passes once a safe simulated practice surface is clearly visible

## Live Session Defaults

The learner no longer has to manage a large setup checkbox cluster.

Always on for the current demo:

- `Simulation-only confirmation`
- `Audio coaching`
- `Offline-first logging`

Still configurable:

- `Skill level`
- `Feedback language`
- `Practice surface`
- `Learner focus`
- `Low-bandwidth capture`

## Review Flow Notes

- debrief requests still need network access
- if `Offline-first logging` is enabled and the device is offline, the review page keeps the local history visible and waits to regenerate the AI debrief until the device reconnects
- low-confidence attempts stay ungraded instead of receiving a forced score
- debrief audio playback appears when `Audio coaching` was enabled for that session
- the debrief response includes a personal `error_fingerprint` and one `adaptive_drill`

## Human Review Queue

Admin reviewers can open `http://localhost:3000/admin/reviews` after the fixed
developer account approves their pending request.

The queue primarily collects:

- safety-gate blocked sessions
- low-confidence attempts
- unclear or unsafe outcomes

Each case can be resolved with reviewer notes, a corrected status, and corrected
coaching text.

## Verification

Backend smoke checks:

```bash
curl http://localhost:8001/api/v1/health
curl http://localhost:8001/api/v1/procedures/simple-interrupted-suture
curl -X POST http://localhost:8001/api/v1/knowledge-pack \
  -H "Content-Type: application/json" \
  -d '{"procedure_id":"simple-interrupted-suture","skill_level":"beginner","feedback_language":"en"}'
curl -X POST http://localhost:8001/api/v1/debrief \
  -H "Content-Type: application/json" \
  -d '{"session_id":"demo-session","procedure_id":"simple-interrupted-suture","skill_level":"beginner","feedback_language":"en","events":[]}'
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run typecheck
```

Backend checks:

```bash
cd backend
source .venv/bin/activate
pytest
```

Verified smoke flow on `2026-03-22`:

- login and account creation
- fixed developer sign-in
- admin-request approval flow
- dashboard render
- library render
- knowledge lab render
- profile edit save
- live trainer camera start
- analysis request from `Check My Step`
- review page load after a captured attempt

## Troubleshooting

- If the camera does not start, make sure the app is opened on `localhost`.
- If the mic does not open, allow microphone permission and restart the camera.
- If the coach cannot respond to learner voice, confirm the OpenAI transcription key is configured.
- If the review page says the debrief is unavailable while offline, reconnect and refresh that session review.
