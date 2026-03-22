"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import type { DashboardIconName } from "@/components/DashboardIcon";
import {
  buildSharedSidebarItems,
  buildSharedTopItems,
  DEFAULT_TRAINING_HREF,
} from "@/lib/appShell";
import { buildLearnerProfileSnapshot, inferEventGraded } from "@/lib/learnerProfile";
import { clearAuthUser, getAuthUser, listSessionsForOwner } from "@/lib/storage";
import type {
  AuthUser,
  FeedbackLanguage,
  SessionRecord,
} from "@/lib/types";

type LeaderboardEntry = {
  accent: string;
  department: string;
  highlight?: boolean;
  name: string;
  xp: number;
};

type MissionItem = {
  complete: boolean;
  current: number;
  label: string;
  target: number;
};

type AchievementItem = {
  description: string;
  icon: DashboardIconName;
  title: string;
  unlocked: boolean;
};

type SkillNode = {
  detail: string;
  icon: DashboardIconName;
  title: string;
  status: "locked" | "active" | "unlocked";
};

type DashboardSnapshot = {
  accuracy: number;
  achievementItems: AchievementItem[];
  currentRank: number;
  focusIssue: string;
  gradedAttempts: number;
  leaderboard: LeaderboardEntry[];
  latestReviewHref: string;
  latestSessionHref: string;
  level: number;
  levelProgressPercent: number;
  levelStartXp: number;
  levelTargetXp: number;
  levelTitle: string;
  missionItems: MissionItem[];
  reviewCount: number;
  sessionCount: number;
  skillNodes: SkillNode[];
  streakDays: number;
  totalXp: number;
  userName: string;
  voiceSessionCount: number;
  weeklyAttempts: number;
  weeklyAccuracy: number;
};

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.max(0, Math.round(value)));
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.round(value))}%`;
}

function getDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function countStreakDays(sessions: SessionRecord[]) {
  const uniqueDates = [...new Set(sessions.map((session) => getDateKey(session.createdAt)))]
    .map((key) => {
      const [year, month, day] = key.split("-").map(Number);
      return new Date(year, (month ?? 1) - 1, day ?? 1);
    })
    .sort((left, right) => right.getTime() - left.getTime());

  if (uniqueDates.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < uniqueDates.length; index += 1) {
    const previous = uniqueDates[index - 1];
    const current = uniqueDates[index];

    if (!previous || !current) {
      break;
    }

    const difference = Math.round(
      (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (difference !== 1) {
      break;
    }

    streak += 1;
  }

  return streak;
}

function pickFeedbackLanguage(sessions: SessionRecord[]): FeedbackLanguage {
  return sessions[0]?.equityMode.feedbackLanguage ?? "en";
}

function deriveDashboardSnapshot(
  user: AuthUser | null,
  sessions: SessionRecord[],
): DashboardSnapshot {
  const userSessions =
    user?.username
      ? sessions.filter((session) => session.ownerUsername === user.username)
      : [];
  const fallbackName = user?.name?.trim() || "Student Clinician";
  const feedbackLanguage = pickFeedbackLanguage(userSessions);
  const profile = buildLearnerProfileSnapshot(userSessions, feedbackLanguage);
  const allEvents = userSessions.flatMap((session) => session.events);
  const gradedEvents = allEvents.filter((event) => inferEventGraded(event));
  const passEvents = gradedEvents.filter((event) => event.stepStatus === "pass");
  const weeklyCutoff = Date.now() - 6 * 24 * 60 * 60 * 1000;
  const weeklyEvents = gradedEvents.filter(
    (event) => new Date(event.createdAt).getTime() >= weeklyCutoff,
  );
  const weeklyPasses = weeklyEvents.filter((event) => event.stepStatus === "pass");
  const todayKey = getDateKey(new Date());
  const sessionsToday = userSessions.filter(
    (session) => getDateKey(session.createdAt) === todayKey,
  ).length;
  const voiceSessionCount = userSessions.filter(
    (session) => session.equityMode.audioCoaching,
  ).length;
  const reviewCount = userSessions.filter((session) => session.debrief).length;
  const scoreBank = allEvents.reduce(
    (total, event) => total + Math.max(0, event.scoreDelta ?? 0),
    0,
  );
  const totalXp =
    scoreBank * 55 + passEvents.length * 180 + gradedEvents.length * 75 + userSessions.length * 240;
  const levelBand = 850;
  const level = Math.max(1, Math.floor(totalXp / levelBand) + 1);
  const levelStartXp = (level - 1) * levelBand;
  const levelTargetXp = level * levelBand;
  const levelProgressPercent =
    ((totalXp - levelStartXp) / Math.max(1, levelTargetXp - levelStartXp)) * 100;
  const accuracy =
    gradedEvents.length > 0 ? (passEvents.length / gradedEvents.length) * 100 : 0;
  const weeklyAccuracy =
    weeklyEvents.length > 0 ? (weeklyPasses.length / weeklyEvents.length) * 100 : 0;
  const levelTitles = [
    "Simulation Intern",
    "Junior Resident",
    "Senior Resident",
    "Chief Resident",
    "Clinical Fellow",
    "Attending Mentor",
  ];
  const levelTitle = levelTitles[Math.min(levelTitles.length - 1, Math.floor((level - 1) / 4))];
  const focusIssue = profile.recurring_issues[0]?.label ?? "needle entry consistency";
  const latestSession = userSessions[0];
  const latestReviewHref = latestSession
    ? `/review/${latestSession.id}`
    : DEFAULT_TRAINING_HREF;

  const stageAttemptCount = (stageId: string) =>
    allEvents.filter((event) => event.stageId === stageId).length;

  const needleEntryAttempts = stageAttemptCount("needle_entry");
  const skillNodes: SkillNode[] = [
    {
      detail:
        userSessions.length > 0
          ? `${userSessions.length} sessions logged`
          : "Start one live simulation to unlock this node.",
      icon: "activity",
      status: userSessions.length > 0 ? "unlocked" : "active",
      title: "Basic Suturing",
    },
    {
      detail:
        needleEntryAttempts > 0
          ? `${needleEntryAttempts} attempts tracked in the live trainer`
          : "Your first guided needle-entry rep will light this up.",
      icon: "target",
      status:
        needleEntryAttempts === 0
          ? "locked"
          : needleEntryAttempts >= 4
            ? "unlocked"
            : "active",
      title: "Needle Entry",
    },
    {
      detail:
        reviewCount > 0
          ? `${reviewCount} AI debrief${reviewCount === 1 ? "" : "s"} generated`
          : "Review at least one session to unlock guided remediation.",
      icon: "review",
      status: reviewCount > 0 ? "unlocked" : "locked",
      title: "Debrief Loop",
    },
  ];

  const achievementItems: AchievementItem[] = [
    {
      description: "Completed the first saved clinical simulation.",
      icon: "spark",
      title: "First Capture",
      unlocked: userSessions.length > 0,
    },
    {
      description: "Held a 90%+ graded pass rate across tracked attempts.",
      icon: "trophy",
      title: "Precision Run",
      unlocked: gradedEvents.length >= 3 && accuracy >= 90,
    },
    {
      description: "Finished at least one hands-free coached session.",
      icon: "activity",
      title: "Hands-Free Ready",
      unlocked: voiceSessionCount > 0,
    },
    {
      description: "Opened the review workflow and generated a debrief.",
      icon: "analytics",
      title: "Review Strategist",
      unlocked: reviewCount > 0,
    },
  ];

  const missionItems: MissionItem[] = [
    {
      complete: sessionsToday >= 3,
      current: sessionsToday,
      label: "Complete 3 simulations today",
      target: 3,
    },
    {
      complete: weeklyEvents.length > 0 && weeklyAccuracy >= 90,
      current: Math.min(90, Math.round(weeklyAccuracy)),
      label: "Maintain 90%+ pass rate this week",
      target: 90,
    },
    {
      complete: voiceSessionCount >= 1,
      current: voiceSessionCount,
      label: "Run 1 voice-guided session",
      target: 1,
    },
  ];

  const leaderboardPool: LeaderboardEntry[] = [
    {
      accent: "amber",
      department: "Neuro Dept.",
      name: "Dr. Sarah Chen",
      xp: Math.max(totalXp + 2400, 3200),
    },
    {
      accent: "cyan",
      department: "Cardiology",
      name: "Dr. James Wilson",
      xp: Math.max(totalXp + 1600, 2800),
    },
    {
      accent: "slate",
      department: "Emergency",
      name: "Dr. Priya Mehta",
      xp: Math.max(totalXp + 900, 2300),
    },
    {
      accent: "blue",
      department: user?.role === "admin" ? "Faculty" : "Trauma Resident",
      highlight: true,
      name: `You (${fallbackName})`,
      xp: totalXp,
    },
  ].sort((left, right) => right.xp - left.xp);

  const currentRank =
    leaderboardPool.findIndex((entry) => entry.highlight) >= 0
      ? leaderboardPool.findIndex((entry) => entry.highlight) + 1
      : leaderboardPool.length;

  return {
    accuracy,
    achievementItems,
    currentRank,
    focusIssue,
    gradedAttempts: gradedEvents.length,
    leaderboard: leaderboardPool,
    latestReviewHref,
    latestSessionHref: latestSession ? `/review/${latestSession.id}` : DEFAULT_TRAINING_HREF,
    level,
    levelProgressPercent,
    levelStartXp,
    levelTargetXp,
    levelTitle,
    missionItems,
    reviewCount,
    sessionCount: userSessions.length,
    skillNodes,
    streakDays: countStreakDays(userSessions),
    totalXp,
    userName: fallbackName,
    voiceSessionCount,
    weeklyAttempts: weeklyEvents.length,
    weeklyAccuracy,
  };
}

function RecentSessionPreview({ sessions }: { sessions: SessionRecord[] }) {
  if (sessions.length === 0) {
    return (
      <div className="dashboard-empty-state">
        No saved sessions yet. Start one live session and your latest work will
        appear here.
      </div>
    );
  }

  return (
    <div className="dashboard-session-list">
      {sessions.slice(0, 3).map((session) => {
        const attempts = session.events.length;
        const reviewReady = Boolean(session.debrief);
        return (
          <Link
            className="dashboard-session-item"
            href={`/review/${session.id}`}
            key={session.id}
          >
            <div>
              <strong>{attempts} attempt{attempts === 1 ? "" : "s"}</strong>
              <p>
                {session.procedureId.replaceAll("-", " ")} · {session.skillLevel}
              </p>
            </div>
            <span className={`dashboard-session-tag ${reviewReady ? "is-ready" : ""}`}>
              {reviewReady ? "review ready" : "in progress"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user] = useState<AuthUser | null>(() =>
    typeof window === "undefined" ? null : getAuthUser(),
  );
  const [sessions] = useState<SessionRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const nextUser = getAuthUser();
    return nextUser ? listSessionsForOwner(nextUser.username) : [];
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login?role=student&next=%2Fdashboard");
    }
  }, [router, user]);

  const snapshot = useMemo(
    () => deriveDashboardSnapshot(user, sessions),
    [sessions, user],
  );
  const hasSavedSession = snapshot.sessionCount > 0;

  const currentUserSessions =
    user?.username
      ? sessions.filter((session) => session.ownerUsername === user.username)
      : [];

  function handleLogout() {
    clearAuthUser();
    router.push("/login");
  }

  if (!user) {
    return (
      <AppFrame
        brandSubtitle="Precision training dashboard"
        pageTitle="Training Dashboard"
        sidebarItems={buildSharedSidebarItems({
          active: "dashboard",
          userRole: null,
        })}
        statusPill={{ icon: "dashboard", label: "checking account" }}
        topItems={buildSharedTopItems({ userRole: null })}
      >
        <section className="dashboard-card dashboard-frame-panel">
          <span className="dashboard-card-eyebrow">Preparing Dashboard</span>
          <h2>Checking the current workspace account.</h2>
          <p>
            We are validating the signed-in user before loading any saved sessions,
            review links, or progress data.
          </p>
        </section>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      brandSubtitle="Precision training dashboard"
      footerPrimaryAction={{
        href: DEFAULT_TRAINING_HREF,
        icon: "play",
        label: "Start New Session",
        strong: true,
      }}
      footerSecondaryActions={[
        { href: "/knowledge", icon: "spark", label: "Knowledge Lab" },
        { href: "/library", icon: "book", label: "Open Library" },
        { icon: "logout", label: "Logout", onClick: handleLogout },
      ]}
      pageTitle="Training Dashboard"
      sidebarItems={buildSharedSidebarItems({
        active: "dashboard",
        reviewHref: snapshot.latestReviewHref,
        userRole: user?.role ?? null,
      })}
      statusPill={{
        icon: "streak",
        label: snapshot.streakDays > 0 ? `${snapshot.streakDays} day streak` : "ready to train",
      }}
      topActions={[
        {
          href: snapshot.latestReviewHref,
          label: hasSavedSession ? "Latest Review" : "Open Trainer",
        },
        { href: DEFAULT_TRAINING_HREF, label: "Start Session", strong: true },
      ]}
      topItems={buildSharedTopItems({
        reviewHref: snapshot.latestReviewHref,
        userRole: user?.role ?? null,
      })}
      userName={snapshot.userName}
    >
      <section className="dashboard-hero">
        <div>
          <span className="dashboard-kicker">Focused Practice</span>
          <h1>Practice live and improve one rep at a time.</h1>
          <p>
            Start a live session, review the latest attempt, and focus on one clear
            improvement at a time.
          </p>
        </div>
        <div className="dashboard-hero-meta">
          <span>{snapshot.sessionCount} saved sessions</span>
          <Link href={snapshot.latestSessionHref}>
            {hasSavedSession ? "Open latest review" : "Open trainer"}
          </Link>
        </div>
      </section>

      <section className="dashboard-kpi-grid" id="analytics">
        <article className="dashboard-card dashboard-kpi-card">
          <span>Sessions</span>
          <strong>{snapshot.sessionCount}</strong>
          <p>Saved practice runs.</p>
        </article>
        <article className="dashboard-card dashboard-kpi-card">
          <span>Pass rate</span>
          <strong>{formatPercent(snapshot.accuracy)}</strong>
          <p>Pass rate across graded attempts.</p>
        </article>
        <article className="dashboard-card dashboard-kpi-card">
          <span>Reviews</span>
          <strong>{snapshot.reviewCount}</strong>
          <p>Saved debriefs ready to revisit.</p>
        </article>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-left-column">
          <article className="dashboard-card dashboard-session-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Next Best Action</span>
                <h2>Keep the workflow moving.</h2>
              </div>
              <span className="dashboard-meta-chip">
                {snapshot.streakDays > 0 ? `${snapshot.streakDays} day streak` : "ready"}
              </span>
            </div>
            <p className="library-lead-copy">
              Use the live session for one clean rep, then open the latest review to see
              what to repeat next.
            </p>
            <div className="dashboard-frame-actions">
              <Link className="dashboard-primary-button" href={DEFAULT_TRAINING_HREF}>
                Start live session
              </Link>
              <Link className="dashboard-action-pill" href={snapshot.latestReviewHref}>
                {hasSavedSession ? "Open latest review" : "Open trainer"}
              </Link>
              <Link className="dashboard-action-pill" href="/knowledge">
                Knowledge lab
              </Link>
            </div>
            <div className="dashboard-session-summary">
              <div>
                <span>Weekly attempts</span>
                <strong>{snapshot.weeklyAttempts}</strong>
              </div>
              <div>
                <span>Voice sessions</span>
                <strong>{snapshot.voiceSessionCount}</strong>
              </div>
              <div>
                <span>Main focus</span>
                <strong>{snapshot.focusIssue}</strong>
              </div>
            </div>
          </article>

          <section className="dashboard-achievement-block" id="recent-work">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Recent Work</span>
                <h2>Saved Sessions</h2>
              </div>
              <span className="dashboard-meta-chip">
                {snapshot.sessionCount} total
              </span>
            </div>
            <RecentSessionPreview sessions={currentUserSessions} />
          </section>
        </div>

        <div className="dashboard-right-column">
          <article className="dashboard-card dashboard-session-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">This Week</span>
                <h2>Progress at a glance</h2>
              </div>
              <span className="dashboard-meta-chip">
                {formatCompactNumber(snapshot.totalXp)} XP
              </span>
            </div>
            <div className="dashboard-session-summary">
              <div>
                <span>Weekly pass rate</span>
                <strong>{formatPercent(snapshot.weeklyAccuracy)}</strong>
              </div>
              <div>
                <span>Graded attempts</span>
                <strong>{snapshot.gradedAttempts}</strong>
              </div>
              <div>
                <span>AI reviews</span>
                <strong>{snapshot.reviewCount}</strong>
              </div>
            </div>
            <p className="library-lead-copy">
              Keep the next rep clean, then open review to decide what to repeat.
            </p>
          </article>
        </div>
      </div>
    </AppFrame>
  );
}
