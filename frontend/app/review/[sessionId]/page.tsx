"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ReviewSummary } from "@/components/ReviewSummary";
import { getProcedure } from "@/lib/api";
import { getSession } from "@/lib/storage";
import type { ProcedureDefinition, SessionRecord } from "@/lib/types";

export default function ReviewPage() {
  const params = useParams();
  const sessionParam = params.sessionId;
  const sessionId =
    typeof sessionParam === "string" ? sessionParam : sessionParam?.[0];

  const [session, setSession] = useState<SessionRecord | null>(null);
  const [procedure, setProcedure] = useState<ProcedureDefinition | null>(null);
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
      try {
        const procedureResponse = await getProcedure(sessionToHydrate.procedureId);
        if (!cancelled) {
          setProcedure(procedureResponse);
        }
      } catch {
        if (!cancelled) {
          setProcedure(null);
        }
      } finally {
        if (!cancelled) {
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
              Reconstructing the local training session from browser storage.
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
            <span className="pill">Phase 1 local summary</span>
            <Link className="button-ghost" href="/">
              Landing
            </Link>
            <Link className="button-secondary" href={`/train/${session.procedureId}`}>
              Back to Trainer
            </Link>
          </div>
        </header>

        <ReviewSummary procedure={procedure} session={session} />
      </div>
    </main>
  );
}
