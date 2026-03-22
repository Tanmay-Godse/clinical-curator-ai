# Local Setup Guide

This guide explains the current local demo setup and the trainer behavior that
the UI exposes today. Older model-server notes have been removed so this stays
aligned with the actual project.

## Current Stack

- `Frontend`: Next.js app with dashboard, knowledge lab, library, profile, trainer, and review flows
- `Backend`: FastAPI app with procedure loading, safety gate, analysis, coaching, review queue, and debrief generation
- `Main model`: `claude-sonnet-4-6`
- `Speech-to-text`: `gpt-4o-mini-transcribe`
- `Session storage`: browser `localStorage`
- `Accounts`: local demo accounts persisted through the backend

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

## Main Routes

- `/dashboard`: default app landing page
- `/knowledge`: gamified study and flashcard mode
- `/train/simple-interrupted-suture`: live trainer
- `/library`: learning library
- `/profile`: local account profile and editing
- `/review/[sessionId]`: session review and debrief
- `/admin/reviews`: faculty review queue

## Live Trainer Behavior

The trainer is intentionally constrained for the hackathon demo:

- each camera run is limited to `2 minutes`
- the recurring camera-based coach refresh runs every `5 seconds`
- the voice loop listens continuously between coach turns when `Audio coaching` is on
- the camera surface itself stays clean while live; setup overlays are not drawn on top of the video

## Setup Panel Features

### Equity mode

What it does:

- tells the backend to keep coaching and debrief language plainer and more access-focused
- still preserves the selected feedback language

What it does not do:

- it does not automatically turn on the other toggles

### Simulation-only confirmation

What it does:

- blocks frame analysis until the learner confirms the camera shows a safe practice surface
- allows the coach to start using fresh camera frames for guidance

### Audio coaching

What it does:

- enables spoken coaching playback
- primes microphone access when the camera starts
- keeps the hands-free loop running: coach speaks, listens, transcribes, and replies

### Low-bandwidth capture

What it does:

- compresses captured analysis frames more aggressively
- lowers uploaded frame size so slower connections stay usable

Current implementation:

- uploaded frames target a smaller long edge and lower JPEG quality
- changing this while the camera is live now refreshes the stream with the smaller capture profile

### Cheap-phone profile

What it does:

- asks the browser for a lighter live camera stream
- helps older or weaker devices keep the preview stable

Current implementation:

- the camera stream is requested at a smaller target resolution
- changing this while the camera is live now refreshes the stream with the lighter profile

### Offline-first logging

What it does:

- saves a local offline practice log when analysis is requested while the device is offline
- prevents those attempts from being silently lost

Current implementation:

- offline logs are stored in browser storage and surfaced again on the review flow

## Review Flow Notes

- debrief requests still need network access
- if `Offline-first logging` is enabled and the device is offline, the review page keeps the local history visible and waits to regenerate the AI debrief until the device reconnects
- debrief audio playback appears when `Audio coaching` was enabled for that session

## Verification

Backend smoke checks:

```bash
curl http://localhost:8001/api/v1/health
curl http://localhost:8001/api/v1/procedures/simple-interrupted-suture
curl -X POST http://localhost:8001/api/v1/knowledge-pack \
  -H "Content-Type: application/json" \
  -d '{"procedure_id":"simple-interrupted-suture","skill_level":"beginner","feedback_language":"en"}'
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
