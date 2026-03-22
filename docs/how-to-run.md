# How To Run Locally

This repo is now documented around the current hackathon demo stack:

- `Claude Sonnet 4.6` for analysis, coaching, and debriefs
- `gpt-4o-mini-transcribe` for learner voice transcription
- `Next.js` frontend on `http://localhost:3000`
- `FastAPI` backend on `http://localhost:8001`

The app opens on `/dashboard`, and the live trainer is at
`/train/simple-interrupted-suture`.

Other core routes:

- `/knowledge`
- `/library`
- `/profile`

## Prerequisites

Install:

- `Node.js 20+`
- `npm 10+`
- `Python 3.10+`
- a browser with camera and microphone support

## 1. Configure the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `backend/.env` like this:

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

Export the real API keys through your shell or environment manager instead of
committing them into the repo.

Start the backend:

```bash
uvicorn app.main:app --reload --port 8001
```

## 2. Configure the Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Use this frontend env value:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
```

Start the frontend:

```bash
npm run dev
```

## 3. Open the App

Visit:

```text
http://localhost:3000
```

The root route redirects to `/dashboard`.

## 4. Use the Live Trainer

1. Sign in or create a local demo account.
2. Open `Live Session`.
3. Start the camera.
4. Confirm `Simulation-only confirmation` before running frame analysis.
5. Turn on `Audio coaching` if you want the hands-free voice loop.

Current demo behavior:

- camera runs are limited to `2 minutes`
- frame capture/coach refresh runs every `5 seconds`
- learner voice is transcribed before being sent to Claude

## Setup Toggle Behavior

The setup panel now behaves like this:

- `Equity mode`: asks the AI to keep coaching and debrief language plainer and more access-focused
- `Simulation-only confirmation`: required before image-based analysis runs
- `Audio coaching`: enables spoken coaching plus microphone listening for learner replies
- `Low-bandwidth capture`: reduces uploaded frame size and quality
- `Cheap-phone profile`: requests a lighter live camera stream
- `Offline-first logging`: stores a local practice log when analysis is requested while offline

## Quick Verification

Backend:

```bash
curl http://localhost:8001/api/v1/health
curl http://localhost:8001/api/v1/procedures/simple-interrupted-suture
curl -X POST http://localhost:8001/api/v1/knowledge-pack \
  -H "Content-Type: application/json" \
  -d '{"procedure_id":"simple-interrupted-suture","skill_level":"beginner","feedback_language":"en"}'
```

Frontend and backend quality checks:

```bash
cd frontend
npm run lint
npm run typecheck

cd ../backend
source .venv/bin/activate
pytest
```

Browser smoke flow verified on `2026-03-22`:

1. create a student account from `/login`
2. land on `/dashboard`
3. open `/library`, `/knowledge`, and `/profile`
4. save a profile edit
5. open `/train/simple-interrupted-suture`
6. confirm `Simulation-only confirmation`
7. start the camera
8. run `Check My Step`
9. open the linked review page

## Troubleshooting

- Camera or microphone access requires `localhost` or `https`.
- If voice coaching is enabled after the browser has already blocked mic access,
  allow microphone permission and retry the camera.
- If the network is offline, analyzed attempts will not be sent to Claude, but
  local offline practice logs can still be saved when `Offline-first logging` is on.
