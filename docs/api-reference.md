# API Reference

The backend exposes a small Phase 1 API under:

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

Phase 1 uses a deterministic mock response based on `stage_id`. The image payload is accepted and validated, but the mock logic does not inspect it yet.

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

## Phase 1 mock stage behavior

The deterministic backend returns:

- `pass` for `setup`
- `pass` for `grip`
- `retry` for `needle_entry`
- `retry` for `needle_exit`
- `pass` for `pull_through`
- `retry` for `knot_tie`
- `pass` for `final_check`

This is intentional so the frontend can demonstrate both retry and pass flows before real Claude analysis is added.

## Frontend-local session model

The review page is powered by browser `localStorage`, not by a backend database.

Each local session includes:

- procedure id
- skill level
- calibration points
- stage events
- score deltas
- coaching messages

## Phase 2 note

Phase 2 will keep the same endpoint-driven structure but replace the deterministic analyze behavior with Claude-powered frame analysis and add AI debrief generation.

