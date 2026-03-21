"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";

import { saveAuthUser } from "@/lib/storage";
import type { UserRole } from "@/lib/types";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const nextPath = searchParams.get("next");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>(
    requestedRole === "admin" ? "admin" : "student",
  );

  const destination = useMemo(() => {
    if (nextPath) {
      return nextPath;
    }

    return role === "admin" ? "/admin/reviews" : "/train/simple-interrupted-suture";
  }, [nextPath, role]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveAuthUser(name, role);
    router.push(destination);
  }

  return (
    <main className="page-shell auth-shell">
      <div className="page-inner auth-page">
        <section className="auth-layout">
          <article className="hero-card hero-copy auth-hero">
            <span className="eyebrow">Entry checkpoint</span>
            <h1>Choose who is entering the simulation system.</h1>
            <p>
              Students enter the coaching workspace. Admin reviewers enter the human
              validation queue that supervises flagged sessions and corrects the model when
              needed.
            </p>
            <div className="signal-grid">
              <article className="signal-card">
                <span>Student path</span>
                <strong>Practice + review</strong>
              </article>
              <article className="signal-card">
                <span>Admin path</span>
                <strong>Validate + correct</strong>
              </article>
              <article className="signal-card">
                <span>Safety path</span>
                <strong>Block patient misuse</strong>
              </article>
            </div>
          </article>

          <article className="panel auth-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Sign in</span>
                <h2 className="panel-title">Local role login</h2>
              </div>
              <span className="pill">No backend auth yet</span>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="field-label">
                Display name
                <input
                  className="text-input"
                  onChange={(event) => setName(event.target.value)}
                  placeholder={role === "admin" ? "Faculty Reviewer" : "Student Name"}
                  value={name}
                />
              </label>

              <div className="role-switch">
                <button
                  className={`role-card ${role === "student" ? "is-active" : ""}`}
                  onClick={() => setRole("student")}
                  type="button"
                >
                  <span className="feature-index">Student</span>
                  <strong>Use the trainer</strong>
                  <p className="panel-copy">
                    Capture steps, receive AI coaching, and send flagged sessions for human
                    validation.
                  </p>
                </button>
                <button
                  className={`role-card ${role === "admin" ? "is-active" : ""}`}
                  onClick={() => setRole("admin")}
                  type="button"
                >
                  <span className="feature-index">Admin</span>
                  <strong>Review flagged cases</strong>
                  <p className="panel-copy">
                    Inspect blocked or low-confidence sessions, correct outcomes, and add
                    rubric feedback.
                  </p>
                </button>
              </div>

              <button className="button-primary" type="submit">
                Continue as {role === "admin" ? "Admin Reviewer" : "Student"}
              </button>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell auth-shell">
          <div className="page-inner auth-page">
            <div className="empty-state">
              <h1 className="review-title">Loading login</h1>
              <p className="review-subtle">
                Preparing the student and admin entry points.
              </p>
            </div>
          </div>
        </main>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
