"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { listReviewCases, resolveReviewCase } from "@/lib/api";
import { clearAuthUser, getAuthUser } from "@/lib/storage";
import type { AuthUser, ReviewCase, StepStatus } from "@/lib/types";

type ResolutionDraft = {
  reviewerNotes: string;
  correctedStepStatus: StepStatus | "";
  correctedCoachingMessage: string;
  rubricFeedback: string;
};

function createResolutionDraft(): ResolutionDraft {
  return {
    reviewerNotes: "",
    correctedStepStatus: "",
    correctedCoachingMessage: "",
    rubricFeedback: "",
  };
}

export default function AdminReviewPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [cases, setCases] = useState<ReviewCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"pending" | "resolved">("pending");
  const [drafts, setDrafts] = useState<Record<string, ResolutionDraft>>({});
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const nextUser = getAuthUser();
    if (!nextUser || nextUser.role !== "admin") {
      router.replace("/login?role=admin&next=/admin/reviews");
      return;
    }

    setAuthUser(nextUser);
  }, [router]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    let cancelled = false;

    async function loadCases() {
      setLoading(true);
      setPageError(null);

      try {
        const response = await listReviewCases({ status: statusFilter });
        if (!cancelled) {
          setCases(response);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(
            error instanceof Error
              ? error.message
              : "The review queue could not be loaded.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCases();

    return () => {
      cancelled = true;
    };
  }, [authUser, statusFilter]);

  const summary = useMemo(() => {
    const pending = cases.filter((caseItem) => caseItem.status === "pending").length;
    const resolved = cases.filter((caseItem) => caseItem.status === "resolved").length;
    return { pending, resolved };
  }, [cases]);

  function handleDraftChange(
    caseId: string,
    nextDraft: Partial<ResolutionDraft>,
  ) {
    setDrafts((current) => ({
      ...current,
      [caseId]: {
        ...(current[caseId] ?? createResolutionDraft()),
        ...nextDraft,
      },
    }));
  }

  async function handleResolve(caseItem: ReviewCase) {
    if (!authUser) {
      return;
    }

    const draft = drafts[caseItem.id] ?? createResolutionDraft();
    if (!draft.reviewerNotes.trim()) {
      setPageError("Reviewer notes are required before resolving a case.");
      return;
    }

    setActiveCaseId(caseItem.id);
    setPageError(null);

    try {
      const resolvedCase = await resolveReviewCase(caseItem.id, {
        reviewer_name: authUser.name,
        reviewer_notes: draft.reviewerNotes,
        corrected_step_status:
          draft.correctedStepStatus === "" ? undefined : draft.correctedStepStatus,
        corrected_coaching_message: draft.correctedCoachingMessage || undefined,
        rubric_feedback: draft.rubricFeedback || undefined,
      });

      setCases((current) =>
        current.map((entry) => (entry.id === resolvedCase.id ? resolvedCase : entry)),
      );
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "The review case could not be resolved.",
      );
    } finally {
      setActiveCaseId(null);
    }
  }

  function handleLogout() {
    clearAuthUser();
    router.push("/login");
  }

  if (!authUser) {
    return (
      <main className="page-shell">
        <div className="page-inner trainer-shell">
          <div className="empty-state">
            <h1 className="review-title">Loading admin console</h1>
            <p className="review-subtle">
              Validating reviewer access to the human-in-the-loop queue.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell review-page-shell">
      <div className="page-inner review-shell">
        <header className="page-header">
          <div className="brand">
            <span className="brand-mark">AC</span>
            <span>Validation Queue</span>
          </div>
          <div className="button-row">
            <span className="pill">{authUser.name}</span>
            <Link className="button-ghost" href="/">
              Landing
            </Link>
            <Link className="button-secondary" href="/train/simple-interrupted-suture">
              Student View
            </Link>
            <button className="button-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="trainer-intro-strip review-intro-strip">
          <div>
            <span className="eyebrow">Human validation layer</span>
            <h1 className="trainer-hero-title">Review flagged sessions before trust turns into false confidence.</h1>
          </div>
          <p className="body-copy">
            This queue captures blocked scenes, low-confidence attempts, and unsafe or
            unclear outputs so faculty or trained senior students can correct them and feed
            better rubric decisions back into the system.
          </p>
        </section>

        <section className="summary-grid">
          <article className="metric-card">
            <p className="metric-label">Pending</p>
            <p className="metric-value">{summary.pending}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Resolved</p>
            <p className="metric-value">{summary.resolved}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Current Filter</p>
            <p className="metric-value">{statusFilter}</p>
          </article>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Review cases</h2>
              <p className="panel-copy">
                Inspect what the AI saw, why the session was escalated, and how the human
                reviewer wants to correct the outcome.
              </p>
            </div>
            <div className="button-row">
              <button
                className="button-secondary"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </button>
              <button
                className="button-secondary"
                onClick={() => setStatusFilter("resolved")}
              >
                Resolved
              </button>
            </div>
          </div>

          {pageError ? (
            <div className="feedback-block" style={{ marginTop: 18 }}>
              <div className="feedback-header">
                <strong>Queue issue</strong>
                <span className="status-badge status-unsafe">attention</span>
              </div>
              <p className="feedback-copy">{pageError}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="feedback-block" style={{ marginTop: 18 }}>
              <p className="feedback-copy">Loading flagged sessions for review.</p>
            </div>
          ) : null}

          {!loading && cases.length === 0 ? (
            <div className="feedback-block" style={{ marginTop: 18 }}>
              <p className="feedback-copy">
                No review cases match this filter right now.
              </p>
            </div>
          ) : null}

          <div className="admin-review-grid">
            {cases.map((caseItem) => {
              const draft = drafts[caseItem.id] ?? createResolutionDraft();

              return (
                <article className="review-card admin-review-card" key={caseItem.id}>
                  <header>
                    <strong>{caseItem.stage_id.replaceAll("_", " ")}</strong>
                    <span className="pill">{caseItem.status}</span>
                  </header>
                  <p className="review-subtle">
                    Source: {caseItem.source}. Session: {caseItem.session_id ?? "not linked"}.
                  </p>
                  <p className="review-subtle">{caseItem.trigger_reason}</p>
                  <p className="review-subtle">
                    Safety gate: {caseItem.safety_gate.status}. Confidence:{" "}
                    {Math.round((caseItem.confidence ?? 0) * 100)}%.
                  </p>

                  {caseItem.status === "resolved" ? (
                    <div className="feedback-block" style={{ marginTop: 16 }}>
                      <strong>Resolved by {caseItem.reviewer_name}</strong>
                      <p className="feedback-copy">{caseItem.reviewer_notes}</p>
                      {caseItem.rubric_feedback ? (
                        <p className="feedback-copy">{caseItem.rubric_feedback}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="admin-resolution-form">
                      <label className="field-label">
                        Reviewer notes
                        <textarea
                          onChange={(event) =>
                            handleDraftChange(caseItem.id, {
                              reviewerNotes: event.target.value,
                            })
                          }
                          placeholder="Summarize what the AI got right or wrong."
                          value={draft.reviewerNotes}
                        />
                      </label>

                      <label className="field-label">
                        Corrected step status
                        <select
                          onChange={(event) =>
                            handleDraftChange(caseItem.id, {
                              correctedStepStatus: event.target.value as
                                | StepStatus
                                | "",
                            })
                          }
                          value={draft.correctedStepStatus}
                        >
                          <option value="">Keep current assessment</option>
                          <option value="pass">Pass</option>
                          <option value="retry">Retry</option>
                          <option value="unclear">Unclear</option>
                          <option value="unsafe">Unsafe</option>
                        </select>
                      </label>

                      <label className="field-label">
                        Corrected coaching message
                        <textarea
                          onChange={(event) =>
                            handleDraftChange(caseItem.id, {
                              correctedCoachingMessage: event.target.value,
                            })
                          }
                          placeholder="Optional human-authored replacement coaching."
                          value={draft.correctedCoachingMessage}
                        />
                      </label>

                      <label className="field-label">
                        Rubric feedback
                        <textarea
                          onChange={(event) =>
                            handleDraftChange(caseItem.id, {
                              rubricFeedback: event.target.value,
                            })
                          }
                          placeholder="What should improve in the rubric or prompt?"
                          value={draft.rubricFeedback}
                        />
                      </label>

                      <button
                        className="button-primary"
                        disabled={activeCaseId === caseItem.id}
                        onClick={() => void handleResolve(caseItem)}
                        type="button"
                      >
                        {activeCaseId === caseItem.id ? "Saving Review..." : "Resolve Case"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
