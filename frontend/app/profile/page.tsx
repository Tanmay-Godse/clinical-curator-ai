"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { AppFrame } from "@/components/AppFrame";
import {
  buildSharedSidebarItems,
  DEFAULT_TRAINING_HREF,
} from "@/lib/appShell";
import {
  clearAuthUser,
  getAuthUser,
  listSessionsForOwner,
  updateAuthUserProfile,
} from "@/lib/storage";
import type { AuthUser, SessionRecord } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(() =>
    typeof window === "undefined" ? null : getAuthUser(),
  );
  const [sessions, setSessions] = useState<SessionRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const nextUser = getAuthUser();
    return nextUser ? listSessionsForOwner(nextUser.username) : [];
  });
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login?role=student&next=%2Fprofile");
    }
  }, [router, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name);
    setUsername(user.username);
  }, [user]);

  const latestReviewHref = useMemo(() => {
    const latestSession = sessions[0];
    return latestSession ? `/review/${latestSession.id}` : DEFAULT_TRAINING_HREF;
  }, [sessions]);
  const hasSavedSession = sessions.length > 0;

  function handleLogout() {
    clearAuthUser();
    router.push("/login");
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateAuthUserProfile({
        name,
        username,
        currentPassword,
        newPassword: newPassword.trim() || undefined,
      });

      setUser(updatedUser);
      setSessions(listSessionsForOwner(updatedUser.username));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Profile updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Profile update failed. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <AppFrame
        brandSubtitle="Workspace profile"
        pageTitle="Profile"
        sidebarItems={buildSharedSidebarItems({ userRole: null })}
      >
        <section className="dashboard-card dashboard-frame-panel">
          <span className="dashboard-card-eyebrow">Preparing Profile</span>
          <h2>Loading your workspace profile.</h2>
          <p>Checking the signed-in account and saved sessions.</p>
        </section>
      </AppFrame>
    );
  }

  const reviewCount = sessions.filter((session) => session.debrief).length;
  const voiceSessions = sessions.filter((session) => session.equityMode.audioCoaching).length;

  return (
    <AppFrame
      brandSubtitle="Workspace profile"
      footerPrimaryAction={{
        href: DEFAULT_TRAINING_HREF,
        icon: "play",
        label: "Start Session",
        strong: true,
      }}
      footerSecondaryActions={[
        { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
        { icon: "logout", label: "Logout", onClick: handleLogout },
      ]}
      pageTitle="Profile"
      sidebarItems={buildSharedSidebarItems({
        reviewHref: latestReviewHref,
        userRole: user.role,
      })}
      topActions={[
        { href: latestReviewHref, label: hasSavedSession ? "Latest Review" : "Open Trainer" },
        { href: DEFAULT_TRAINING_HREF, label: "Live Session", strong: true },
      ]}
      userName={user.name}
    >
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-kicker">Profile</span>
          <h1>{user.name}</h1>
          <p>
            Keep this page simple: your account, your recent activity, and quick ways
            back into practice.
          </p>
        </div>
        <div className="dashboard-hero-meta">
          <span>{user.role}</span>
          <span>{user.username}</span>
        </div>
      </section>

      <section className="dashboard-kpi-grid">
        <article className="dashboard-card dashboard-kpi-card">
          <span>Sessions</span>
          <strong>{sessions.length}</strong>
          <p>Saved practice runs.</p>
        </article>
        <article className="dashboard-card dashboard-kpi-card">
          <span>Reviews</span>
          <strong>{reviewCount}</strong>
          <p>Saved debriefs.</p>
        </article>
        <article className="dashboard-card dashboard-kpi-card">
          <span>Voice Sessions</span>
          <strong>{voiceSessions}</strong>
          <p>Hands-free guided runs.</p>
        </article>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-left-column">
          <article className="dashboard-card dashboard-session-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Edit Profile</span>
                <h2>Workspace details</h2>
              </div>
            </div>
            <form onSubmit={(event) => void handleSaveProfile(event)}>
              <div className="inline-form-row">
                <label className="field-label">
                  Display name
                  <input
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    value={name}
                  />
                </label>
                <label className="field-label">
                  Username
                  <input
                    onChange={(event) => setUsername(event.target.value)}
                    type="text"
                    value={username}
                  />
                </label>
              </div>

              <div className="inline-form-row" style={{ marginTop: 16 }}>
                <label className="field-label">
                  Current password
                  <input
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    required
                    type="password"
                    value={currentPassword}
                  />
                </label>
                <label className="field-label">
                  New password
                  <input
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Leave blank to keep current password"
                    type="password"
                    value={newPassword}
                  />
                </label>
              </div>

              <div className="inline-form-row" style={{ marginTop: 16 }}>
                <label className="field-label">
                  Confirm new password
                  <input
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat new password"
                    type="password"
                    value={confirmPassword}
                  />
                </label>
                <article className="metric-card compact-metric-card">
                  <p className="metric-label">Role</p>
                  <p className="metric-value">{user.role}</p>
                  <p className="panel-copy" style={{ marginTop: 10 }}>
                    Roles stay fixed for this workspace account.
                  </p>
                </article>
              </div>

              {error ? (
                <div className="feedback-block" style={{ marginTop: 16 }}>
                  <div className="feedback-header">
                    <strong>Update failed</strong>
                  </div>
                  <p className="feedback-copy" style={{ marginTop: 10 }}>
                    {error}
                  </p>
                </div>
              ) : null}

              {successMessage ? (
                <div className="feedback-block" style={{ marginTop: 16 }}>
                  <div className="feedback-header">
                    <strong>Saved</strong>
                  </div>
                  <p className="feedback-copy" style={{ marginTop: 10 }}>
                    {successMessage}
                  </p>
                </div>
              ) : null}

              <div className="button-row" style={{ marginTop: 16 }}>
                <button className="button-primary" disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </article>
        </div>

        <div className="dashboard-right-column">
          <article className="dashboard-card dashboard-session-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Quick Actions</span>
                <h2>Jump back in</h2>
              </div>
            </div>
            <div className="dashboard-frame-actions">
              <Link className="dashboard-primary-button" href={DEFAULT_TRAINING_HREF}>
                Start live session
              </Link>
              <Link className="dashboard-action-pill" href={latestReviewHref}>
                {hasSavedSession ? "Open latest review" : "Open trainer"}
              </Link>
            </div>
          </article>
        </div>
      </div>
    </AppFrame>
  );
}
