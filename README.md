# Clinical Curator AI

Clinical Curator AI is a simulation-only clinical skills trainer centered on a
live suturing demo. Learners practice on safe surfaces such as an orange,
banana, or foam pad while the system handles camera-based feedback, live voice
coaching, debriefs, review tickets, and short knowledge rounds.

## Start Here

- [docs/README.md](docs/README.md): documentation hub and reading order
- [docs/how-to-run.md](docs/how-to-run.md): fastest local run path
- [docs/local-setup.md](docs/local-setup.md): fuller developer setup and architecture
- [docs/vercel-deployment.md](docs/vercel-deployment.md): frontend deployment on Vercel
- [docs/backend-deployment.md](docs/backend-deployment.md): persistent backend deployment
- [docs/api-reference.md](docs/api-reference.md): backend API reference

## Current Demo Surface

- `/login`: fixed-account sign-in for the public demo
- `/dashboard`: primary landing page after sign-in
- `/train/simple-interrupted-suture`: live trainer
- `/review/[sessionId]`: debrief and replay
- `/knowledge`: rapidfire, quiz, and flashcards
- `/library`: procedure guide and practice references
- `/profile`: account and quota view
- `/admin/reviews`: human review queue
- `/developer/approvals`: developer-only approval flow

## Architecture

- `frontend`: Next.js 16 app in [`frontend/`](frontend/)
- `backend`: FastAPI app in [`backend/`](backend/)
- `analysis / coach / debrief`: Anthropic-backed requests
- `speech-to-text`: OpenAI `gpt-4o-mini-transcribe`
- `speech output`: browser speech first, backend TTS fallback
- `auth and quota persistence`: SQLite in the backend
- `session history and cached learning state`: browser `localStorage`
- `deployment shape`: frontend on Vercel, backend on a separate persistent Python host

## Public Demo Accounts

The public login flow is fixed-account-only so the deployed demo does not allow
open self-service account creation.

- `Student_1@gmail.com`
- `Student_2@gmail.com`
- `Student_3@gmail.com`
- `Student_4@gmail.com`
- shared password: `CODESTORMERS`

Public demo rules:

- each public student account has `10` live sessions
- the live-session allowance is consumed when a camera run starts
- learners cannot reset their own quota
- only admin or developer accounts can reset demo account limits
- unknown usernames are routed to `/access-required`

## Repository Layout

```text
.
|-- backend/       FastAPI API, AI transport, scoring, auth, review queue, tests
|-- docs/          setup, deployment, API, and team-process documentation
|-- frontend/      Next.js UI, trainer, dashboard, review, profile, and library
`-- open-library/  procedure rubric and benchmark reference assets
```

## Verification

```bash
cd frontend
npm run lint
npm run typecheck
npm run build

cd ../backend
source .venv/bin/activate
pytest
```

## Package Docs

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)
