# How To Run Locally

This repo is documented around the current hackathon demo stack:

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
- `/admin/reviews`
- `/developer/approvals`

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

If the fixed developer account signs in, the app immediately routes it to
`/developer/approvals` instead of the student dashboard.

Then:

1. Create or sign in to a local account from `/login`.
2. Open `/train/simple-interrupted-suture`.
3. Start the camera and use `Check My Step` for stage analysis.
4. If you want an admin reviewer account, choose `Admin reviewer` during account creation.
5. Sign in as `developer@gmail.com` to approve or reject pending admin requests.
6. Use `/admin/reviews` after approval if you want to inspect flagged attempts.

## 4. Live Trainer Notes

Current demo behavior:

- camera runs are limited to `2 minutes`
- frame capture and proactive coach refresh run every `1 second`
- learner voice is transcribed before being sent to Claude
- low-confidence or ambiguous attempts stay `not graded` and prompt a retake
- setup-stage analysis now accepts a clearly visible orange, banana, foam pad, or similar inert practice surface as a valid simulated field

Current fixed session defaults:

- `Simulation-only confirmation` is always on
- `Audio coaching` is always on
- `Offline-first logging` is always on

Still editable in the trainer:

- `Skill level`
- `Feedback language`
- `Practice surface`
- `Learner focus`
- `Low-bandwidth capture`

## Quick Verification

Backend:

```bash
curl http://localhost:8001/api/v1/health
curl http://localhost:8001/api/v1/procedures/simple-interrupted-suture
curl -X POST http://localhost:8001/api/v1/knowledge-pack \
  -H "Content-Type: application/json" \
  -d '{"procedure_id":"simple-interrupted-suture","skill_level":"beginner","feedback_language":"en"}'
curl -X POST http://localhost:8001/api/v1/debrief \
  -H "Content-Type: application/json" \
  -d '{"session_id":"demo-session","procedure_id":"simple-interrupted-suture","skill_level":"beginner","events":[]}'
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
6. start the camera
7. run `Check My Step`
8. open the linked review page

Developer approval flow verified separately:

1. create an account from `/login` with role `Admin reviewer`
2. sign in as `developer@gmail.com`
3. open `/developer/approvals`
4. approve the pending admin request
5. sign back in with the reviewed account and confirm `/admin/reviews` is accessible

## Troubleshooting

- Camera or microphone access requires `localhost` or `https`.
- If voice coaching is enabled after the browser has already blocked mic access, allow microphone permission and retry the camera.
- If learner audio cannot be transcribed, confirm the OpenAI transcription key is configured.
- If the network is offline, analyzed attempts will not be sent to Claude, but local offline practice logs can still be saved when `Offline-first logging` is on.
- If an admin reviewer cannot access `/admin/reviews`, check whether the request is still pending inside `/developer/approvals`.

## Need More Detail?

- `docs/local-setup.md` for the full setup and troubleshooting flow
- `docs/team-setup.md` for collaborator setup and open-repo secret handling
- `docs/api-reference.md` for backend routes and request/response examples
- `backend/README.md` for backend-only setup notes
- `frontend/README.md` for frontend-only setup notes
