# AI Clinical Skills Coach

AI Clinical Skills Coach is a simulation-only Phase 2 trainer for practicing a simple interrupted suture on a safe surface such as an orange, banana, or foam pad. The project is split into a Next.js frontend and a FastAPI backend, with the frontend calling live backend endpoints for procedure metadata, Claude-powered frame analysis, and an AI review debrief.

## Documentation

- `docs/local-setup.md`: full local installation, run, verification, and troubleshooting guide
- `docs/api-reference.md`: backend endpoint contract and example requests
- `frontend/README.md`: frontend-specific commands and notes
- `backend/README.md`: backend-specific commands and notes

## Phase 2 Scope

- One procedure: `simple-interrupted-suture`
- One training loop: landing -> trainer -> analyze -> review
- Simulation-only framing throughout the app
- Local browser session persistence
- Claude-powered frame analysis
- AI-generated review debrief and quiz

## Monorepo Layout

```text
.
├── backend/   FastAPI API, procedure contract, Claude services, tests
├── docs/      Setup guide and API reference
└── frontend/  Next.js landing, trainer, and review UI
```

## Quick Start

### 1. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# add your Anthropic API key to backend/.env
uvicorn app.main:app --reload --port 8000
```

### 2. Start the frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### 3. Open the app

Visit `http://localhost:3000`.

## Verification Commands

### Backend

```bash
curl http://localhost:8000/api/v1/health
curl http://localhost:8000/api/v1/procedures/simple-interrupted-suture
curl -X POST http://localhost:8000/api/v1/analyze-frame \
  -H 'Content-Type: application/json' \
  -d '{"procedure_id":"simple-interrupted-suture","stage_id":"needle_entry","skill_level":"beginner","image_base64":"ZmFrZQ=="}'
curl -X POST http://localhost:8000/api/v1/debrief \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"demo-session","procedure_id":"simple-interrupted-suture","skill_level":"beginner","events":[]}'
```

### Frontend and backend quality checks

```bash
cd frontend
npm run lint
npm run typecheck
npm run build

cd ../backend
source .venv/bin/activate
pytest
```

## Important Notes

- This build is for simulated practice only and does not replace instructors, clinical judgment, or real patient training.
- The frontend stores session data in browser `localStorage`, so review pages depend on the same browser profile used during training.
- `POST /api/v1/analyze-frame` and `POST /api/v1/debrief` require `ANTHROPIC_API_KEY` in `backend/.env` for live AI behavior.
- If the Anthropic key is missing, the backend returns a clear `503` explaining how to enable Phase 2 AI features.
