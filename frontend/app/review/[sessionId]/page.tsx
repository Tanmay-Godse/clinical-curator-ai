"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ReviewSummary } from "@/components/ReviewSummary";
import { generateDebrief, getProcedure } from "@/lib/api";
import { getSession } from "@/lib/storage";
import type {
  DebriefRequest,
  DebriefResponse,
  ProcedureDefinition,
  SessionRecord,
} from "@/lib/types";

function buildDebriefPayload(session: SessionRecord): DebriefRequest {
  return {
    session_id: session.id,
    procedure_id: session.procedureId,
    skill_level: session.skillLevel,
    events: session.events.map((event) => ({
      stage_id: event.stageId,
      attempt: event.attempt,
      step_status: event.stepStatus,
      issues: event.issues,
      score_delta: event.scoreDelta,
      coaching_message: event.coachingMessage,
      overlay_target_ids: event.overlayTargetIds,
      visible_observations: event.visibleObservations ?? [],
      next_action: event.nextAction,
      confidence: event.confidence,
      created_at: event.createdAt,
    })),
  };
}

export default function ReviewPage() {
  const params = useParams();
  const sessionParam = params.sessionId;
  const sessionId =
    typeof sessionParam === "string" ? sessionParam : sessionParam?.[0];

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [procedure, setProcedure] = useState<ProcedureDefinition | null>(null);
  const [debrief, setDebrief] = useState<DebriefResponse | null>(null);
  const [debriefError, setDebriefError] = useState<string | null>(null);
  const [isDebriefLoading, setIsDebriefLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const existingSession = getSession(sessionId);
    setSession(existingSession);

    if (!existingSession) {
      setLoading(false);
      return;
    }

    const sessionToHydrate: SessionRecord = existingSession;

    let cancelled = false;

    async function hydrateProcedure() {
      setDebrief(null);
      setDebriefError(null);
      setIsDebriefLoading(sessionToHydrate.events.length > 0);

      try {
        const procedurePromise = getProcedure(sessionToHydrate.procedureId);
        const debriefPromise =
          sessionToHydrate.events.length > 0
            ? generateDebrief(buildDebriefPayload(sessionToHydrate))
            : Promise.resolve(null);

        const [procedureResult, debriefResult] = await Promise.allSettled([
          procedurePromise,
          debriefPromise,
        ]);

        if (cancelled) {
          return;
        }

        if (procedureResult.status === "fulfilled") {
          setProcedure(procedureResult.value);
        } else {
          setProcedure(null);
        }

        if (debriefResult.status === "fulfilled") {
          setDebrief(debriefResult.value);
        } else if (sessionToHydrate.events.length > 0) {
          const reason = debriefResult.reason;
          setDebriefError(
            reason instanceof Error
              ? reason.message
              : "The AI debrief request failed for this session.",
          );
        }
      } catch {
        if (!cancelled) {
          setProcedure(null);
          setDebrief(null);
          setDebriefError("The review page could not hydrate its API data.");
        }
      } finally {
        if (!cancelled) {
          setIsDebriefLoading(false);
          setLoading(false);
        }
      }
    }

    void hydrateProcedure();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (loading) {
    return (
      <main className="page-shell">
        <div className="page-inner review-shell">
          <div className="empty-state">
            <h1 className="review-title">Loading review</h1>
            <p className="review-subtle">
              Reconstructing the local training session and requesting the stored AI
              debrief.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="page-shell">
        <div className="page-inner review-shell">
          <div className="empty-state">
            <h1 className="review-title">No local session found</h1>
            <p className="review-subtle">
              This review page depends on the browser session record created during
              training.
            </p>
            <div
              className="review-actions"
              style={{ justifyContent: "center", marginTop: 18 }}
            >
              <Link className="button-primary" href="/train/simple-interrupted-suture">
                Return to Trainer
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-inner review-shell">
        <header className="page-header">
          <div className="brand">
            <span className="brand-mark">AC</span>
            <span>Session Review</span>
          </div>
          <div className="button-row">
            <span className="pill">Phase 2 AI summary</span>
            <Link className="button-ghost" href="/">
              Landing
            </Link>
            <Link className="button-secondary" href={`/train/${session.procedureId}`}>
              Back to Trainer
            </Link>
          </div>
        </header>

        <ReviewSummary
          debrief={debrief}
          debriefError={debriefError}
          isDebriefLoading={isDebriefLoading}
          procedure={procedure}
          session={session}
        />
      </div>
    </main>
  );
}
