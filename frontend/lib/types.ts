export type StepStatus = "pass" | "retry" | "unclear" | "unsafe";
export type SkillLevel = "beginner" | "intermediate";
export type CalibrationMode = "corners" | "guide";

export type Point = {
  x: number;
  y: number;
};

export type Calibration = {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
};

export type OverlayTarget = {
  id: string;
  label: string;
  description: string;
  u: number;
  v: number;
  color: string;
};

export type ProcedureStage = {
  id: string;
  title: string;
  objective: string;
  visible_checks: string[];
  common_errors: string[];
  overlay_targets: string[];
  score_weight: number;
};

export type ProcedureDefinition = {
  id: string;
  title: string;
  simulation_only: boolean;
  practice_surface: string;
  named_overlay_targets: OverlayTarget[];
  stages: ProcedureStage[];
};

export type Issue = {
  code: string;
  severity: "low" | "medium" | "high";
  message: string;
};

export type AnalyzeFrameRequest = {
  procedure_id: string;
  stage_id: string;
  skill_level: SkillLevel;
  image_base64: string;
  student_question?: string;
};

export type AnalyzeFrameResponse = {
  step_status: StepStatus;
  confidence: number;
  visible_observations: string[];
  issues: Issue[];
  coaching_message: string;
  next_action: string;
  overlay_target_ids: string[];
  score_delta: number;
};

export type SessionEvent = {
  stageId: string;
  attempt: number;
  stepStatus: StepStatus;
  issues: Issue[];
  scoreDelta: number;
  coachingMessage: string;
  overlayTargetIds: string[];
  createdAt: string;
};

export type SessionRecord = {
  id: string;
  procedureId: string;
  skillLevel: SkillLevel;
  calibration: Calibration;
  events: SessionEvent[];
  createdAt: string;
  updatedAt: string;
};
