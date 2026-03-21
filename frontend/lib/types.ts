export type StepStatus = "pass" | "retry" | "unclear" | "unsafe";
export type SkillLevel = "beginner" | "intermediate";
export type CalibrationMode = "corners" | "guide";
export type UserRole = "student" | "admin";
export type SafetyGateStatus = "cleared" | "blocked" | "needs_human_review";
export type ReviewCaseStatus = "pending" | "resolved";

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
  simulation_confirmation: boolean;
  session_id?: string;
  student_name?: string;
};

export type SafetyGateResult = {
  status: SafetyGateStatus;
  confidence: number;
  reason: string;
  refusal_message?: string | null;
};

export type AnalyzeFrameResponse = {
  analysis_mode: "coaching" | "blocked";
  step_status: StepStatus;
  confidence: number;
  visible_observations: string[];
  issues: Issue[];
  coaching_message: string;
  next_action: string;
  overlay_target_ids: string[];
  score_delta: number;
  safety_gate: SafetyGateResult;
  requires_human_review: boolean;
  human_review_reason?: string | null;
  review_case_id?: string | null;
};

export type SessionEvent = {
  stageId: string;
  attempt: number;
  stepStatus: StepStatus;
  analysisMode?: "coaching" | "blocked";
  issues: Issue[];
  scoreDelta: number;
  coachingMessage: string;
  overlayTargetIds: string[];
  visibleObservations?: string[];
  nextAction?: string;
  confidence?: number;
  safetyGate?: SafetyGateResult;
  requiresHumanReview?: boolean;
  humanReviewReason?: string;
  reviewCaseId?: string;
  createdAt: string;
};

export type DebriefEventRequest = {
  stage_id: string;
  attempt: number;
  step_status: StepStatus;
  issues: Issue[];
  score_delta: number;
  coaching_message: string;
  overlay_target_ids: string[];
  visible_observations: string[];
  next_action?: string;
  confidence?: number;
  created_at: string;
};

export type QuizQuestion = {
  question: string;
  answer: string;
};

export type DebriefRequest = {
  session_id: string;
  procedure_id: string;
  skill_level: SkillLevel;
  events: DebriefEventRequest[];
};

export type DebriefResponse = {
  strengths: string[];
  improvement_areas: string[];
  practice_plan: string[];
  quiz: QuizQuestion[];
};

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

export type ReviewCase = {
  id: string;
  status: ReviewCaseStatus;
  source: "safety_gate" | "confidence_flag" | "quality_flag";
  session_id?: string | null;
  procedure_id: string;
  stage_id: string;
  skill_level: SkillLevel;
  student_name?: string | null;
  created_at: string;
  trigger_reason: string;
  analysis_blocked: boolean;
  initial_step_status?: StepStatus | null;
  confidence?: number | null;
  coaching_message?: string | null;
  safety_gate: SafetyGateResult;
  reviewer_name?: string | null;
  reviewer_notes?: string | null;
  corrected_step_status?: StepStatus | null;
  corrected_coaching_message?: string | null;
  rubric_feedback?: string | null;
  resolved_at?: string | null;
};

export type ResolveReviewCaseRequest = {
  reviewer_name: string;
  reviewer_notes: string;
  corrected_step_status?: StepStatus;
  corrected_coaching_message?: string;
  rubric_feedback?: string;
};

export type StoredDebrief = {
  response: DebriefResponse;
  reviewSignature: string;
  generatedAt: string;
};

export type SessionRecord = {
  id: string;
  procedureId: string;
  skillLevel: SkillLevel;
  calibration: Calibration;
  events: SessionEvent[];
  debrief?: StoredDebrief;
  createdAt: string;
  updatedAt: string;
};
