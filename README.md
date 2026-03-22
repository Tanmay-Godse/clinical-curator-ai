# AI Clinical Skills Coach

AI Clinical Skills Coach is a simulation-only suturing trainer built for guided
practice on a safe surface such as an orange, banana, or foam pad.

The current primary demo path is:

- `/dashboard` as the shared app starting point
- `/train/simple-interrupted-suture` for the live session
- `/review/[sessionId]` for debrief and replay
- `/developer/approvals` for the fixed super-user approval queue
- `Claude Sonnet 4.6` for coaching, analysis, and debriefs
- `gpt-4o-mini-transcribe` for learner voice transcription

The current build also includes:

- browser-local session history and offline practice logs
- SQLite-backed demo account persistence
- deterministic scoring in Python with confidence-aware grading
- explicit `not graded - retake required` outcomes for ambiguous frames
- cross-session personal error fingerprinting and adaptive drill prescription
- human-in-the-loop validation for flagged sessions
- a hard simulation-only safety gate before analysis
- one shared login flow for students, admin-request accounts, and the fixed developer account
- developer approval workflow for promoting pending admin reviewers
- fixed live-session defaults for audio coaching, simulation confirmation, and offline-first logging
- open learning-library assets for rubrics and benchmark starters
- safer-skills roadmap notes for broader, lower-risk module expansion
- support for both Anthropic-style and OpenAI-compatible AI endpoints
- deterministic fallback study summaries when a live debrief request fails

## What The App Does

- live camera-guided suturing practice
- simulation-only safety gate before image analysis
- hands-free voice coaching with spoken replies
- browser-local session history and offline practice logs
- AI debriefs with adaptive drill suggestions
- confidence-aware grading with retake-required outcomes
- gamified `Knowledge Lab` with rapidfire rounds, quiz mode, and flashcards
- editable local profile with persisted account data
- admin review queue for flagged sessions
- dashboard, library, knowledge, profile, trainer, and review flows in one shared UI shell

## Current Demo Constraints

- one core procedure: `simple-interrupted-suture`
- each live camera run is limited to `2 minutes`
- the live coach/frame refresh runs every `1 second`
- sessions are stored in browser `localStorage`
- this is for simulation practice only, not real clinical care

## Account Roles

- `student`: normal learner workspace
- `admin`: reviewer workspace after developer approval
- `developer`: fixed super-user account used only for approvals and admin queue access

Local demo developer credentials are fixed in the backend:

- email: `developer@gmail.com`
- password: `Qwerty@123`

New users cannot create that developer email from the UI.

If a learner selects `Admin reviewer` during account creation, the backend stores the
account as `student` plus a pending admin request until the developer account approves it.

## Quick Start

Use the current quickstart in [docs/how-to-run.md](docs/how-to-run.md).

For a fuller project guide, use [docs/local-setup.md](docs/local-setup.md).

## Repository Layout

```text
.
|-- backend/       FastAPI API, AI transport, scoring, persistence, and tests
|-- docs/          setup and project docs
|-- frontend/      Next.js dashboard, knowledge, profile, trainer, review, and library UI
`-- open-library/  public rubric and benchmark starter assets
```

## AI Provider Support

The backend uses one generic AI configuration surface:

- `AI_PROVIDER`
- `AI_API_BASE_URL`
- `AI_API_KEY`
- `AI_ANALYSIS_MODEL`
- `AI_DEBRIEF_MODEL`
- `AI_COACH_MODEL`

`AI_PROVIDER=auto` is the default. In that mode:

- Anthropic-style `/messages` endpoints are treated as Anthropic
- everything else is treated as OpenAI-compatible
- older `OPENAI_*` and `ANTHROPIC_*` env names still work as aliases

This means the same backend can point at:

- Anthropic's Messages API
- a hosted OpenAI-compatible model server
- a local OpenAI-compatible server if your team wants to self-host during development

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

- UI: login, dashboard, library, knowledge lab, profile edit, live trainer, voice coach, analysis, and review
- API: health, procedure load, auth preview/sign-in, knowledge pack, coach chat, analyze frame, debrief, TTS, and review cases
- Reliability: session history persists in `localStorage`, offline logs can be preserved locally, low-confidence attempts stay ungraded, and flagged sessions can enter the admin review queue

## Documentation

- [docs/how-to-run.md](docs/how-to-run.md)
- [docs/local-setup.md](docs/local-setup.md)
- [docs/api-reference.md](docs/api-reference.md)
- [docs/team-setup.md](docs/team-setup.md)
- [docs/safer-skills-roadmap.md](docs/safer-skills-roadmap.md)
