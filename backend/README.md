# Backend

This package contains the FastAPI service for Phase 1.

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /api/v1/health`
- `GET /api/v1/procedures/{id}`
- `POST /api/v1/analyze-frame`

## Testing

```bash
source .venv/bin/activate
pytest
```

## Current Phase 1 behavior

- serves the suturing procedure contract
- returns deterministic mock analysis responses by stage
- validates request and response shapes with Pydantic
- does not yet include Claude integration, debrief generation, or persistence

For the full local run guide, use `../docs/local-setup.md`.

