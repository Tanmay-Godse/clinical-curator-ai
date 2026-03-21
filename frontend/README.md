# Frontend

This package contains the Next.js UI for the Phase 2 trainer.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

## Useful Commands

```bash
npm run lint
npm run typecheck
npm run build
```

## Environment

The default backend base URL is:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## What lives here

- landing page
- trainer page
- review page
- camera capture and calibration UI
- overlay rendering
- local session persistence
- AI debrief request and review rendering

For the full project walkthrough, use `../docs/local-setup.md`.
