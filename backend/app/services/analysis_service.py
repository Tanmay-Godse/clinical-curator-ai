from dataclasses import dataclass

from app.schemas.analyze import AnalyzeFrameResponse, Issue
from app.schemas.procedure import ProcedureStage

SEVERITY_PENALTY = {"low": 1, "medium": 2, "high": 4}


@dataclass(frozen=True)
class StageBehavior:
    step_status: str
    confidence: float
    visible_observations: list[str]
    issues: list[Issue]
    coaching_message: str
    next_action: str
    overlay_target_ids: list[str]


MOCK_BEHAVIOR: dict[str, StageBehavior] = {
    "setup": StageBehavior(
        step_status="pass",
        confidence=0.95,
        visible_observations=[
            "practice surface is centered in frame",
            "needle driver is visible",
            "suture material is ready to use",
        ],
        issues=[],
        coaching_message="Clean setup. Keep the same framing before advancing.",
        next_action="Move to the grip stage and keep your instrument visible.",
        overlay_target_ids=["surface_center"],
    ),
    "grip": StageBehavior(
        step_status="pass",
        confidence=0.91,
        visible_observations=[
            "needle driver is visible at the correct end of the surface",
            "hand position looks stable for a practice attempt",
        ],
        issues=[],
        coaching_message="Your grip looks stable enough for the mock flow. Keep the wrist relaxed before entry.",
        next_action="Advance to needle entry and focus on angle control.",
        overlay_target_ids=["needle_driver_grip"],
    ),
    "needle_entry": StageBehavior(
        step_status="retry",
        confidence=0.83,
        visible_observations=[
            "entry zone is visible",
            "instrument is close to the target point",
            "needle angle appears too shallow for a clean bite",
        ],
        issues=[
            Issue(
                code="angle_shallow",
                severity="medium",
                message="Approach is too shallow for a confident needle entry.",
            )
        ],
        coaching_message="Rotate the driver slightly upward and start the bite more perpendicular to the surface.",
        next_action="Reposition the grip, retake the frame, and try the entry again.",
        overlay_target_ids=["entry_point", "needle_angle"],
    ),
    "needle_exit": StageBehavior(
        step_status="retry",
        confidence=0.82,
        visible_observations=[
            "wound line is still visible",
            "needle path is partially complete",
            "exit point is not yet clearly established across the wound line",
        ],
        issues=[
            Issue(
                code="exit_not_visible",
                severity="medium",
                message="Complete the arc so the needle exits across the wound line.",
            )
        ],
        coaching_message="Follow the arc through and let the tip emerge clearly on the far side before advancing.",
        next_action="Retake the frame once the exit point is easier to see.",
        overlay_target_ids=["exit_point", "wound_line_center"],
    ),
    "pull_through": StageBehavior(
        step_status="pass",
        confidence=0.9,
        visible_observations=[
            "suture thread is visible",
            "thread path looks controlled during pull-through",
        ],
        issues=[],
        coaching_message="Controlled pull-through. Keep the thread organized so the next knot looks clean.",
        next_action="Advance to knot tying while maintaining gentle tension.",
        overlay_target_ids=["thread_path"],
    ),
    "knot_tie": StageBehavior(
        step_status="retry",
        confidence=0.79,
        visible_observations=[
            "knot material is visible",
            "the knot is present but not centered over the practice line",
        ],
        issues=[
            Issue(
                code="knot_off_center",
                severity="medium",
                message="The knot looks slightly off-center for a tidy finish.",
            )
        ],
        coaching_message="Seat the knot closer to center and avoid twisting the thread as you tighten.",
        next_action="Reset the knot position and capture one more attempt.",
        overlay_target_ids=["knot_center"],
    ),
    "final_check": StageBehavior(
        step_status="pass",
        confidence=0.93,
        visible_observations=[
            "final stitch is visible",
            "overall presentation is clean enough for a phase-one mock review",
        ],
        issues=[],
        coaching_message="Nice finish for the mock workflow. Your final frame is clear and review-ready.",
        next_action="Open the review page to see your phase-one summary.",
        overlay_target_ids=["wound_line_center", "knot_center"],
    ),
}


def build_mock_analysis(
    stage: ProcedureStage,
    student_question: str | None = None,
) -> AnalyzeFrameResponse:
    behavior = MOCK_BEHAVIOR[stage.id]
    allowed_overlay_targets = set(stage.overlay_targets)
    issues = [issue for issue in behavior.issues]
    overlay_target_ids = [
        target_id
        for target_id in behavior.overlay_target_ids
        if target_id in allowed_overlay_targets
    ]
    score_delta = stage.score_weight - sum(
        SEVERITY_PENALTY.get(issue.severity, 0) for issue in issues
    )

    coaching_message = behavior.coaching_message
    if student_question:
        coaching_message = (
            f"{behavior.coaching_message} You asked: '{student_question}'. "
            "Use the same adjustment on your next practice attempt."
        )

    return AnalyzeFrameResponse(
        step_status=behavior.step_status,  # type: ignore[arg-type]
        confidence=behavior.confidence,
        visible_observations=behavior.visible_observations,
        issues=issues,
        coaching_message=coaching_message,
        next_action=behavior.next_action,
        overlay_target_ids=overlay_target_ids,
        score_delta=max(0, score_delta),
    )

