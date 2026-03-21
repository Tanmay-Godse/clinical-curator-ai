"use client";

import type { ProcedureStage, SessionEvent } from "@/lib/types";

type ProcedureStepperProps = {
  stages: ProcedureStage[];
  currentStageId: string;
  events: SessionEvent[];
  onSelectStage: (stageId: string) => void;
  onAdvance: () => void;
  canAdvance: boolean;
};

function getStatusClass(status: SessionEvent["stepStatus"]) {
  return `status-badge status-${status}`;
}

export function ProcedureStepper({
  stages,
  currentStageId,
  events,
  onSelectStage,
  onAdvance,
  canAdvance,
}: ProcedureStepperProps) {
  const latestEventByStage = new Map(
    stages.map((stage) => [
      stage.id,
      events.filter((event) => event.stageId === stage.id).at(-1) ?? null,
    ]),
  );

  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Procedure stepper</h2>
          <p className="panel-copy">
            Choose a stage, practice the visible checks, and use the live mock API to
            log each attempt.
          </p>
        </div>
        <button className="button-secondary" disabled={!canAdvance} onClick={onAdvance}>
          Advance
        </button>
      </div>

      <div className="stage-list">
        {stages.map((stage) => {
          const latestEvent = latestEventByStage.get(stage.id);
          const attempts = events.filter((event) => event.stageId === stage.id).length;

          return (
            <button
              className={`stage-row ${stage.id === currentStageId ? "is-active" : ""}`}
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              type="button"
            >
              <div>
                <strong>{stage.title}</strong>
                <span>
                  {stage.objective} Attempts: {attempts}. Weight: {stage.score_weight}.
                </span>
              </div>
              {latestEvent ? (
                <span className={getStatusClass(latestEvent.stepStatus)}>
                  {latestEvent.stepStatus}
                </span>
              ) : (
                <span className="stage-badge">Ready</span>
              )}
            </button>
          );
        })}
      </div>
    </article>
  );
}
