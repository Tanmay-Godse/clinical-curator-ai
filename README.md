# AI Clinical Skills Coach

AI Clinical Skills Coach is a simulation-only suturing trainer built for guided
practice on a safe surface such as an orange, banana, or foam pad.

The product now follows one primary demo path:

- `/dashboard` as the shared app starting point
- `/train/simple-interrupted-suture` for the live session
- `/review/[sessionId]` for debrief and replay
- `Claude Sonnet 4.6` for coaching, analysis, and debriefs
- `gpt-4o-mini-transcribe` for learner voice transcription

## What The App Does

- live camera-guided suturing practice
- simulation-only safety gate before image analysis
- hands-free voice coaching with spoken replies
- browser-local session history and offline practice logs
- AI debriefs with adaptive drill suggestions
- gamified `Knowledge Lab` with rapidfire rounds, quiz mode, and flashcards
- editable local profile with persisted account data
- admin review queue for flagged sessions
- dashboard, library, knowledge, profile, trainer, and review flows in one shared UI shell

## Current Demo Constraints

- one core procedure: `simple-interrupted-suture`
- each live camera run is limited to `2 minutes`
- the live coach/frame refresh runs every `5 seconds`
- sessions are stored in browser `localStorage`
- this is for simulation practice only, not real clinical care

## Core Setup Features

- `Equity mode`: plainer, more access-focused coaching language
- `Simulation-only confirmation`: required before frame analysis
- `Audio coaching`: spoken coaching plus live learner voice loop
- `Low-bandwidth capture`: smaller uploaded analysis frames
- `Cheap-phone profile`: lighter live camera stream
- `Offline-first logging`: local practice logs when offline

## Quick Start

Use the current quickstart in [docs/how-to-run.md](docs/how-to-run.md).

For a fuller project guide, use [docs/local-setup.md](docs/local-setup.md).

## Repository Layout

```text
.
|-- backend/       FastAPI API, AI transport, scoring, and tests
|-- docs/          setup and project docs
|-- frontend/      Next.js dashboard, knowledge, profile, trainer, review, and library UI
`-- open-library/  public rubric and benchmark starter assets
```

## Verification

```bash
cd frontend
npm run lint
npm run typecheck

cd ../backend
source .venv/bin/activate
pytest
```

Smoke-tested on `2026-03-22` against the local app:

- UI: login, dashboard, library, knowledge lab, profile edit, live trainer, camera start, analysis, and review
- API: health, procedure load, auth preview/sign-in, knowledge pack, coach chat, analyze frame, debrief, TTS, and review cases

## Documentation

- [docs/how-to-run.md](docs/how-to-run.md)
- [docs/local-setup.md](docs/local-setup.md)
- [docs/api-reference.md](docs/api-reference.md)
- [docs/team-setup.md](docs/team-setup.md)
- [docs/safer-skills-roadmap.md](docs/safer-skills-roadmap.md)
