"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";

import {
  clearAuthUser,
  createAuthAccount,
  getAuthUser,
  signInAuthUser,
} from "@/lib/storage";
import type { AuthMode, AuthUser, UserRole } from "@/lib/types";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRoleParam = searchParams.get("role");
  const requestedRole: UserRole | null =
    requestedRoleParam === "admin" || requestedRoleParam === "student"
      ? requestedRoleParam
      : null;
  const nextPath = searchParams.get("next");

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [role, setRole] = useState<UserRole>(requestedRole ?? "student");
  const [signInUsername, setSignInUsername] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const activeRole = requestedRole ?? role;

  useEffect(() => {
    setCurrentUser(getAuthUser());
  }, []);

  const destination = useMemo(() => {
    if (nextPath) {
      return nextPath;
    }

    return activeRole === "admin"
      ? "/admin/reviews"
      : "/train/simple-interrupted-suture";
  }, [activeRole, nextPath]);

  const canContinueWithCurrentUser =
    currentUser && (!requestedRole || currentUser.role === requestedRole);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await signInAuthUser({
        username: signInUsername,
        password: signInPassword,
        role: activeRole,
      });
      setCurrentUser(user);
      router.push(nextPath ?? (user.role === "admin" ? "/admin/reviews" : "/train/simple-interrupted-suture"));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Sign-in failed. Check your username and password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (createPassword !== confirmPassword) {
      setError("Passwords do not match. Re-enter them and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await createAuthAccount({
        name: createName,
        username: createUsername,
        password: createPassword,
        role: activeRole,
      });
      setCurrentUser(user);
      router.push(nextPath ?? (user.role === "admin" ? "/admin/reviews" : "/train/simple-interrupted-suture"));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Account creation failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    if (!currentUser) {
      return;
    }

    router.push(
      nextPath ??
        (currentUser.role === "admin"
          ? "/admin/reviews"
          : "/train/simple-interrupted-suture"),
    );
  }

  function handleSignOut() {
    clearAuthUser();
    setCurrentUser(null);
    setError(null);
  }

  return (
    <main className="page-shell auth-shell">
      <div className="page-inner auth-page">
        <section className="auth-layout">
          <article className="hero-card hero-copy auth-hero">
            <span className="eyebrow">Entry checkpoint</span>
            <h1>Sign in with a real local account before entering the simulation system.</h1>
            <p>
              Students enter the coaching workspace. Admin reviewers enter the human
              validation queue that supervises flagged sessions and corrects the model when
              needed. This is still local demo auth, but it now behaves like an actual
              account flow with username, password, and account creation.
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
                <span>Account mode</span>
                <strong>Local demo auth</strong>
              </article>
            </div>
          </article>

          <article className="panel auth-panel">
            <div className="panel-header">
              <div>
                <span className="eyebrow">Access control</span>
                <h2 className="panel-title">Sign in or create account</h2>
              </div>
              <span className="pill">Username + password</span>
            </div>

            {currentUser ? (
              <div className="feedback-block">
                <div className="feedback-header">
                  <strong>Current local session</strong>
                  <span className="pill">
                    {currentUser.name} · {currentUser.role}
                  </span>
                </div>
                <p className="feedback-copy" style={{ marginTop: 12 }}>
                  Signed in as <strong>{currentUser.username}</strong>.
                </p>
                {!canContinueWithCurrentUser ? (
                  <p className="feedback-copy" style={{ marginTop: 12 }}>
                    The requested route expects a {requestedRole} account. Sign out and use a
                    matching account, or create one below.
                  </p>
                ) : null}
                <div className="button-row" style={{ marginTop: 16 }}>
                  {canContinueWithCurrentUser ? (
                    <button className="button-primary" onClick={handleContinue} type="button">
                      Continue to Workspace
                    </button>
                  ) : null}
                  <button className="button-secondary" onClick={handleSignOut} type="button">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : null}

            <div className="auth-mode-switch">
              <button
                className={`auth-mode-button ${mode === "sign-in" ? "is-active" : ""}`}
                onClick={() => setMode("sign-in")}
                type="button"
              >
                Sign In
              </button>
              <button
                className={`auth-mode-button ${mode === "create-account" ? "is-active" : ""}`}
                onClick={() => setMode("create-account")}
                type="button"
              >
                Create Account
              </button>
            </div>

            <div className="role-switch">
              <button
                className={`role-card ${role === "student" ? "is-active" : ""}`}
                disabled={Boolean(requestedRole)}
                onClick={() => setRole("student")}
                type="button"
              >
                <span className="feature-index">Student</span>
                <strong>Use the trainer</strong>
                <p className="panel-copy">
                  Capture steps, receive AI coaching, and revisit the session review.
                </p>
              </button>
              <button
                className={`role-card ${role === "admin" ? "is-active" : ""}`}
                disabled={Boolean(requestedRole)}
                onClick={() => setRole("admin")}
                type="button"
              >
                <span className="feature-index">Admin</span>
                <strong>Review flagged cases</strong>
                <p className="panel-copy">
                  Inspect blocked or low-confidence sessions and resolve human-review cases.
                </p>
              </button>
            </div>

            {error ? (
              <div className="feedback-block">
                <div className="feedback-header">
                  <strong>Authentication issue</strong>
                  <span className="status-badge status-unsafe">attention</span>
                </div>
                <p className="feedback-copy" style={{ marginTop: 12 }}>
                  {error}
                </p>
              </div>
            ) : null}

            {mode === "sign-in" ? (
              <form className="auth-form" onSubmit={(event) => void handleSignIn(event)}>
                <label className="field-label">
                  Username
                  <input
                    autoComplete="username"
                    className="text-input"
                    onChange={(event) => setSignInUsername(event.target.value)}
                    placeholder="student01 or faculty.reviewer"
                    required
                    value={signInUsername}
                  />
                </label>

                <label className="field-label">
                  Password
                  <input
                    autoComplete="current-password"
                    className="text-input"
                    minLength={8}
                    onChange={(event) => setSignInPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={signInPassword}
                  />
                </label>

                <p className="auth-helper-copy">
                  You are signing in as <strong>{activeRole}</strong> and will be redirected
                  to <strong>{destination}</strong>.
                </p>

                <button className="button-primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Signing In..." : "Sign In"}
                </button>
              </form>
            ) : (
              <form
                className="auth-form"
                onSubmit={(event) => void handleCreateAccount(event)}
              >
                <label className="field-label">
                  Display name
                  <input
                    autoComplete="name"
                    className="text-input"
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder={role === "admin" ? "Faculty Reviewer" : "Student Name"}
                    required
                    value={createName}
                  />
                </label>

                <div className="inline-form-row">
                  <label className="field-label">
                    Username
                    <input
                      autoComplete="username"
                      className="text-input"
                      onChange={(event) => setCreateUsername(event.target.value)}
                      placeholder="Choose a username"
                      required
                      value={createUsername}
                    />
                  </label>

                  <label className="field-label">
                    Role
                    <select
                      disabled={Boolean(requestedRole)}
                      onChange={(event) => setRole(event.target.value as UserRole)}
                      value={activeRole}
                    >
                      <option value="student">Student</option>
                      <option value="admin">Admin reviewer</option>
                    </select>
                  </label>
                </div>

                <div className="inline-form-row">
                  <label className="field-label">
                    Password
                    <input
                      autoComplete="new-password"
                      className="text-input"
                      minLength={8}
                      onChange={(event) => setCreatePassword(event.target.value)}
                      placeholder="At least 8 characters"
                      required
                      type="password"
                      value={createPassword}
                    />
                  </label>

                  <label className="field-label">
                    Confirm password
                    <input
                      autoComplete="new-password"
                      className="text-input"
                      minLength={8}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter password"
                      required
                      type="password"
                      value={confirmPassword}
                    />
                  </label>
                </div>

                <p className="auth-helper-copy">
                  This creates a local demo account in browser storage and signs you in
                  immediately.
                </p>

                <button className="button-primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}
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
                Preparing the student and admin account flows.
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
