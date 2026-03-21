# AI Clinical Skills Coach

AI Clinical Skills Coach is a simulation-only Phase 1 mock trainer for practicing a simple interrupted suture on a safe surface such as an orange, banana, or foam pad. The project is split into a Next.js frontend and a FastAPI backend, with the frontend calling live backend endpoints for procedure metadata and deterministic mock analysis.

## Documentation

- `docs/local-setup.md`: full local installation, run, verification, and troubleshooting guide
- `docs/api-reference.md`: backend endpoint contract and example requests
- `frontend/README.md`: frontend-specific commands and notes
- `backend/README.md`: backend-specific commands and notes

## Phase 1 Scope

- One procedure: `simple-interrupted-suture`
- One training loop: landing -> trainer -> analyze -> review
- Simulation-only framing throughout the app
- Local browser session persistence
- Deterministic mock analysis instead of real Claude integration

## Monorepo Layout

```text
.
├── backend/   FastAPI API, procedure contract, mock analysis, tests
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
- Phase 2 will introduce Claude-powered frame analysis and AI debrief generation on top of the same frontend flow.

