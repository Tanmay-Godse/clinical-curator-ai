# Local Setup Guide

This guide walks through the full local setup for the Phase 2 version of AI Clinical Skills Coach.

## 1. Prerequisites

Make sure your machine has:

- `Node.js` 22 or newer
- `npm` 10 or newer
- `Python` 3.13 or newer
- A webcam if you want to test the full trainer flow

The current repo has already been verified with:

- `Node 22.19.0`
- `npm 10.9.3`
- `Python 3.13.7`

## 2. Clone or open the repository

```bash
cd /path/to/your/projects
git clone <your-repo-url>
cd CodeStormers-Claude_Hackathon
```

If you already have the repo locally, just `cd` into it.

## 3. Backend setup

Open a terminal and run:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### What this does

- creates a Python virtual environment
- installs FastAPI, pytest, and the other backend dependencies
- creates a local `.env` file
- starts the API at `http://localhost:8000`

### Required backend environment for Phase 2

Open `backend/.env` and set:

```env
FRONTEND_ORIGIN=http://localhost:3000
SIMULATION_ONLY=true
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_ANALYSIS_MODEL=claude-sonnet-4-6
ANTHROPIC_DEBRIEF_MODEL=claude-haiku-4-5
```

If `ANTHROPIC_API_KEY` is empty, the trainer UI still loads, but live analysis and AI debrief calls return a clear `503` message.

### Expected result

You should see output similar to:

```text
Uvicorn running on http://127.0.0.1:8000
```

## 4. Frontend setup

Open a second terminal and run:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### What this does

- installs the Next.js frontend dependencies
- creates a local frontend environment file
- starts the frontend at `http://localhost:3000`

## 5. Open the app

Visit:

```text
http://localhost:3000
```

You should see the landing page for AI Clinical Skills Coach.

## 6. First-run verification

Before trying the trainer UI, verify the backend from a third terminal:

### Health check

```bash
curl http://localhost:8000/api/v1/health
```

Expected result:

```json
{"status":"ok","simulation_only":true}
```

### Procedure metadata

```bash
curl http://localhost:8000/api/v1/procedures/simple-interrupted-suture
```

This should return the procedure definition with:

- 7 stages
- 8 named overlay targets
- simulation-only metadata

### Analyze endpoint

```bash
curl -X POST http://localhost:8000/api/v1/analyze-frame \
  -H 'Content-Type: application/json' \
  -d '{"procedure_id":"simple-interrupted-suture","stage_id":"needle_entry","skill_level":"beginner","image_base64":"ZmFrZQ=="}'
```

With a valid Anthropic key, this should return a schema-valid AI response with:

- `step_status`
- `visible_observations`
- `issues`
- `coaching_message`
- `overlay_target_ids`
- `score_delta`

Without an Anthropic key, it should return a `503` with a message explaining how to enable Phase 2 AI features.

### Debrief endpoint

```bash
curl -X POST http://localhost:8000/api/v1/debrief \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"demo-session","procedure_id":"simple-interrupted-suture","skill_level":"beginner","events":[]}'
```

This route returns a three-part debrief and quiz. It uses a simple fallback response when `events` is empty, and it uses Claude for non-empty session histories.

## 7. How to use the trainer

Once both servers are running:

1. Open `http://localhost:3000`
2. Click `Start Training`
3. Allow camera access when prompted
4. Place an orange, banana, or foam pad in view
5. Choose either:
   - corner calibration mode
   - centered guide fallback mode
6. Select a stage if you want to jump around
7. Click `Check My Step`
8. Review the AI feedback in the side panel
9. Click `Advance to Next Stage` after a passing stage
10. Click `Open Review` after the final passing stage to request the AI debrief

## 8. Local quality checks

### Frontend

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

### Backend

```bash
cd backend
source .venv/bin/activate
pytest
```

## 9. Troubleshooting

### The frontend says it cannot load the procedure

Usually this means the backend is not running.

Check:

```bash
curl http://localhost:8000/api/v1/health
```

If that fails, restart the backend server.

### The camera button does nothing

Check browser permissions:

- make sure camera access is allowed for `localhost`
- reload the trainer page after changing permissions
- try the `Retry Camera Access` button

### Port 3000 or 8000 is already in use

Use a different port and update the environment values.

Example backend:

```bash
uvicorn app.main:app --reload --port 8001
```

Then update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1
```

### Review page shows no session

The review page depends on browser `localStorage`.

Use the same browser profile and same machine where you completed the trainer flow.

### You want a fresh clean session

Use the `Start Fresh Session` button in the trainer UI.

### Analysis or debrief returns a 503

This usually means `ANTHROPIC_API_KEY` is missing in `backend/.env`.

Check:

```bash
cat backend/.env
```

Make sure `ANTHROPIC_API_KEY` is set, then restart `uvicorn`.

## 10. Current limitations

- the trainer supports one procedure only: `simple-interrupted-suture`
- live AI behavior depends on a valid Anthropic API key
- session history is stored locally in the browser
- there is no database-backed persistence yet
- the product is simulation-only and not intended for real clinical use
