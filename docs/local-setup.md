# Local Setup Guide

This guide walks through the full local setup for the Phase 1 version of AI Clinical Skills Coach.

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

### Mock analyze endpoint

```bash
curl -X POST http://localhost:8000/api/v1/analyze-frame \
  -H 'Content-Type: application/json' \
  -d '{"procedure_id":"simple-interrupted-suture","stage_id":"needle_entry","skill_level":"beginner","image_base64":"ZmFrZQ=="}'
```

This should return a mock `retry` response with:

- `step_status`
- `visible_observations`
- `issues`
- `coaching_message`
- `overlay_target_ids`
- `score_delta`

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
8. Review the mock feedback in the side panel
9. Click `Advance to Next Stage` after a passing stage
10. Click `Open Review` after the final passing stage

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

## 10. Current limitations

- analysis is deterministic and mocked in Phase 1
- there is no Claude integration yet
- there is no backend debrief route yet
- session history is stored locally in the browser
- the product is simulation-only and not intended for real clinical use

