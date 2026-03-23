# Backend Deployment

This backend is intended for a persistent Python host, not Vercel serverless.

## Recommended Shape

- deploy the container built from `backend/Dockerfile`
- mount persistent storage at `/app/app/data`
- inject secrets through the host environment manager
- point the frontend Vercel app at the backend through `API_BASE_URL`

## Required Backend Secrets

Minimum runtime environment:

```env
FRONTEND_ORIGIN=https://clinical-curator-ai.vercel.app
SIMULATION_ONLY=true

AI_PROVIDER=anthropic
AI_API_BASE_URL=https://api.anthropic.com/v1/messages
AI_API_KEY=SET_IN_HOST_SECRET_MANAGER
AI_ANALYSIS_MODEL=claude-sonnet-4-6
AI_DEBRIEF_MODEL=claude-sonnet-4-6
AI_COACH_MODEL=claude-sonnet-4-6
AI_LEARNING_MODEL=claude-haiku-4-5

TRANSCRIPTION_API_BASE_URL=https://api.openai.com/v1
TRANSCRIPTION_API_KEY=SET_IN_HOST_SECRET_MANAGER
TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

Optional private team-only seeded accounts:

```env
PRIVATE_SEED_ACCOUNTS_JSON=[
  {
    "id": "account-developer-team",
    "name": "Developer Team",
    "username": "developer@example.com",
    "password": "SET_IN_HOST_SECRET_MANAGER",
    "role": "admin",
    "is_developer": true,
    "live_session_limit": null
  }
]
```

The four public judge demo accounts remain seeded from code. Private team admin
and developer accounts should now come from `PRIVATE_SEED_ACCOUNTS_JSON`, not
from source control.

## Docker Commands

Build:

```bash
docker build -t clinical-curator-backend ./backend
```

Run locally with a persistent volume:

```bash
docker run \
  --rm \
  -p 8001:8001 \
  -v clinical-curator-data:/app/app/data \
  --env-file backend/.env \
  clinical-curator-backend
```

For real deployments, keep placeholder values in `backend/.env` and inject the
real secrets in your host dashboard instead of editing tracked files.

## Frontend Wiring

In the Vercel project for `frontend`, set:

```env
API_BASE_URL=https://your-backend.example.com/api/v1
```

The production frontend proxies browser requests through `/api/proxy/*`, so the
backend URL stays server-side and out of the public client bundle.
