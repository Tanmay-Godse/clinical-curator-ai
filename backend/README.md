# Backend

This package contains the FastAPI service for Phase 2.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# set ANTHROPIC_API_KEY in .env
uvicorn app.main:app --reload --port 8000
```

## Environment

Required for live AI behavior:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_ANALYSIS_MODEL=claude-sonnet-4-6
ANTHROPIC_DEBRIEF_MODEL=claude-haiku-4-5
```

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/procedures/{id}`
- `POST /api/v1/analyze-frame`
- `POST /api/v1/debrief`

## Testing

```bash
source .venv/bin/activate
pytest
```

## Current Phase 2 behavior

- serves the suturing procedure contract
- sends stage analysis requests to Claude
- validates Claude JSON responses with Pydantic
- computes `score_delta` deterministically in Python
- generates AI review debriefs and quizzes from stored session events
- validates request and response shapes with Pydantic
- returns `503` when Anthropic is not configured
- still uses browser-local session storage rather than backend persistence

For the full local run guide, use `../docs/local-setup.md`.
