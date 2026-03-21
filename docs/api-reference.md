# API Reference

The backend exposes a small Phase 2 API under:

```text
http://localhost:8000/api/v1
```

## `GET /health`

Returns a simple service health payload.

### Example

```bash
curl http://localhost:8000/api/v1/health
```

### Response

```json
{"status":"ok","simulation_only":true}
```

## `GET /procedures/{id}`

Returns the procedure definition used by the frontend trainer.

### Supported procedure ids

- `simple-interrupted-suture`

### Example

```bash
curl http://localhost:8000/api/v1/procedures/simple-interrupted-suture
```

### Response shape

```json
{
  "id": "simple-interrupted-suture",
  "title": "Simple Interrupted Suture",
  "simulation_only": true,
  "practice_surface": "Orange, banana, or foam pad",
  "named_overlay_targets": [],
  "stages": []
}
```

### Important fields

- `named_overlay_targets`: overlay ids with labels, descriptions, normalized coordinates, and colors
- `stages`: stage ids, objectives, visible checks, common errors, overlay target ids, and score weights

## `POST /analyze-frame`

This endpoint submits a single captured trainer frame to the backend for Claude-powered stage analysis. The backend validates the request, prompts Claude with the procedure rubric, validates the returned JSON, rejects unknown overlay target ids, and computes `score_delta` in Python.

### Example request

```bash
curl -X POST http://localhost:8000/api/v1/analyze-frame \
  -H 'Content-Type: application/json' \
  -d '{
    "procedure_id": "simple-interrupted-suture",
    "stage_id": "needle_entry",
    "skill_level": "beginner",
    "image_base64": "ZmFrZQ==",
    "student_question": "Am I holding the needle too close to the tip?"
  }'
```

### Request body

```json
{
  "procedure_id": "simple-interrupted-suture",
  "stage_id": "needle_entry",
  "skill_level": "beginner",
  "image_base64": "ZmFrZQ==",
  "student_question": "optional question"
}
```

### Response body

```json
{
  "step_status": "retry",
  "confidence": 0.83,
  "visible_observations": [
    "entry zone is visible",
    "instrument is close to the target point",
    "needle angle appears too shallow for a clean bite"
  ],
  "issues": [
    {
      "code": "angle_shallow",
      "severity": "medium",
      "message": "Approach is too shallow for a confident needle entry."
    }
  ],
  "coaching_message": "Rotate the driver slightly upward and start the bite more perpendicular to the surface.",
  "next_action": "Reposition the grip, retake the frame, and try the entry again.",
  "overlay_target_ids": ["entry_point", "needle_angle"],
  "score_delta": 13
}
```

### Notes

- Requires `ANTHROPIC_API_KEY` in `backend/.env`
- Returns `503` when Phase 2 AI is not configured
- Returns `502` if the model response is invalid or the upstream call fails
- Uses stage-specific allowed `overlay_target_ids`

## `POST /debrief`

This endpoint generates the review-page debrief from the stored local session history.

### Example request

```bash
curl -X POST http://localhost:8000/api/v1/debrief \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "demo-session",
    "procedure_id": "simple-interrupted-suture",
    "skill_level": "beginner",
    "events": [
      {
        "stage_id": "needle_entry",
        "attempt": 1,
        "step_status": "retry",
        "issues": [
          {
            "code": "angle_shallow",
            "severity": "medium",
            "message": "The angle is too shallow."
          }
        ],
        "score_delta": 13,
        "coaching_message": "Rotate upward before retrying.",
        "overlay_target_ids": ["entry_point", "needle_angle"],
        "visible_observations": [
          "surface is centered",
          "entry zone is visible"
        ],
        "next_action": "Retry the entry stage.",
        "confidence": 0.88,
        "created_at": "2026-03-20T17:10:00.000Z"
      }
    ]
  }'
```

### Response body

```json
{
  "strengths": [
    "You kept the practice surface centered during the attempt.",
    "Your grip remained stable enough to judge the frame.",
    "You captured a reviewable image for coaching."
  ],
  "improvement_areas": [
    "Improve the entry angle on the first bite.",
    "Keep the needle arc consistent through the wound line.",
    "Seat the knot more centrally during the final tie."
  ],
  "practice_plan": [
    "Repeat the entry stage with a more perpendicular approach.",
    "Practice one slow exit arc while keeping the far side visible.",
    "Finish with one centered knot attempt and review the frame."
  ],
  "quiz": [
    {
      "question": "What does a shallow entry angle usually affect?",
      "answer": "It makes the first bite less confident and harder to control."
    },
    {
      "question": "Why should the far-side exit remain visible?",
      "answer": "Visibility helps confirm the arc completes across the practice line."
    },
    {
      "question": "What does a centered final knot improve?",
      "answer": "It improves the presentation and alignment of the finished stitch."
    }
  ]
}
```

### Notes

- Empty `events` are supported and return a structured fallback debrief
- Non-empty `events` use Claude to produce strengths, improvement areas, a 3-step practice plan, and a 3-question quiz
- Returns `503` when Phase 2 AI is not configured for non-empty sessions

## Frontend-local session model

The review page is powered by browser `localStorage`, not by a backend database.

Each local session includes:

- procedure id
- skill level
- calibration points
- stage events
- score deltas
- coaching messages
- optional visible observations, confidence, and next-action data for the review debrief
