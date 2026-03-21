"use client";

import type { ProcedureDefinition, SessionEvent, SessionRecord } from "@/lib/types";

type ReviewSummaryProps = {
  session: SessionRecord;
  procedure: ProcedureDefinition | null;
};

function toStageLabel(stageId: string, procedure: ProcedureDefinition | null) {
  return (
    procedure?.stages.find((stage) => stage.id === stageId)?.title ??
    stageId.replaceAll("-", " ")
  );
}

function getStatusClass(status: SessionEvent["stepStatus"]) {
  return `status-badge status-${status}`;
}

export function ReviewSummary({ session, procedure }: ReviewSummaryProps) {
  const totalScore = session.events.reduce((sum, event) => sum + event.scoreDelta, 0);
  const latestFeedback = session.events.at(-1)?.coachingMessage ?? "No coaching recorded yet.";

  return (
    <section className="review-grid">
      <article className="panel">
        <span className="pill">Local session recap</span>
        <h1 className="review-title" style={{ marginTop: 16 }}>
          Phase 1 review
        </h1>
        <p className="review-subtle" style={{ marginTop: 14 }}>
          This page renders from browser session data and the stored stage history. AI
          debriefing arrives in Phase 2, but the review loop is already in place.
        </p>
        <p className="review-score" style={{ marginTop: 18 }}>
          {totalScore}
        </p>
        <p className="review-subtle">Total mock score across {session.events.length} attempts.</p>

        <div className="summary-grid" style={{ marginTop: 22 }}>
          <article className="metric-card">
            <p className="metric-label">Procedure</p>
            <p className="metric-value">{procedure?.title ?? session.procedureId}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Skill level</p>
            <p className="metric-value">{session.skillLevel}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Last update</p>
            <p className="metric-value">
              {new Date(session.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </article>
        </div>

        <article className="review-card" style={{ marginTop: 22 }}>
          <header>
            <strong>Last coaching cue</strong>
            <span className="pill">Ready for Phase 2</span>
          </header>
          <p className="review-subtle">{latestFeedback}</p>
        </article>
      </article>

      <section>
        <article className="review-card">
          <header>
            <strong>Stage timeline</strong>
            <span className="pill">{session.events.length} logged attempts</span>
          </header>
          <ul className="timeline-list">
            {session.events.map((event) => (
              <li className="timeline-item" key={`${event.stageId}-${event.createdAt}`}>
                <header>
                  <strong>{toStageLabel(event.stageId, procedure)}</strong>
                  <span className={getStatusClass(event.stepStatus)}>
                    {event.stepStatus}
                  </span>
                </header>
                <p className="review-subtle">
                  Attempt {event.attempt}. Score delta {event.scoreDelta}. Overlay targets:{" "}
                  {event.overlayTargetIds.join(", ") || "none"}.
                </p>
                <p className="review-subtle">{event.coachingMessage}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="review-card" style={{ marginTop: 20 }}>
          <header>
            <strong>Phase 2 note</strong>
            <span className="pill">Planned</span>
          </header>
          <p className="review-subtle">
            The next phase will keep this exact structure and add Claude-powered frame
            analysis plus an AI-generated debrief and quiz. The local review loop is
            already stable enough for that upgrade path.
          </p>
        </article>
      </section>
    </section>
  );
}
