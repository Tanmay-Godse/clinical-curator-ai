import { createDefaultCalibration } from "@/lib/geometry";
import type {
  AuthUser,
  DebriefResponse,
  SessionRecord,
  SkillLevel,
  UserRole,
} from "@/lib/types";

const SESSIONS_KEY = "ai-clinical-skills-coach:sessions";
const AUTH_USER_KEY = "ai-clinical-skills-coach:auth-user";

function activeSessionKey(procedureId: string) {
  return `ai-clinical-skills-coach:active:${procedureId}`;
}

function readSessions(): Record<string, SessionRecord> {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(SESSIONS_KEY);

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as Record<string, SessionRecord>;
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, SessionRecord>) {
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function saveSession(session: SessionRecord): SessionRecord {
  const sessions = readSessions();
  sessions[session.id] = session;
  writeSessions(sessions);
  window.localStorage.setItem(activeSessionKey(session.procedureId), session.id);
  return session;
}

export function getSession(sessionId: string): SessionRecord | null {
  return readSessions()[sessionId] ?? null;
}

export function saveAuthUser(name: string, role: UserRole): AuthUser {
  const user: AuthUser = {
    id: crypto.randomUUID(),
    name: name.trim() || (role === "admin" ? "Admin Reviewer" : "Student User"),
    role,
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return user;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_KEY);
}

export function buildSessionReviewSignature(session: SessionRecord): string {
  return JSON.stringify({
    events: session.events,
    skillLevel: session.skillLevel,
  });
}

export function getCachedDebrief(session: SessionRecord): DebriefResponse | null {
  if (!session.debrief) {
    return null;
  }

  return session.debrief.reviewSignature === buildSessionReviewSignature(session)
    ? session.debrief.response
    : null;
}

export function saveSessionDebrief(
  sessionId: string,
  response: DebriefResponse,
): SessionRecord | null {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  return saveSession({
    ...session,
    debrief: {
      response,
      reviewSignature: buildSessionReviewSignature(session),
      generatedAt: new Date().toISOString(),
    },
  });
}

export function createSession(
  procedureId: string,
  skillLevel: SkillLevel,
): SessionRecord {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    procedureId,
    skillLevel,
    calibration: createDefaultCalibration(),
    events: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function startFreshSession(
  procedureId: string,
  skillLevel: SkillLevel,
): SessionRecord {
  const session = createSession(procedureId, skillLevel);
  return saveSession(session);
}

export function getOrCreateActiveSession(
  procedureId: string,
  skillLevel: SkillLevel,
): SessionRecord {
  const activeId = window.localStorage.getItem(activeSessionKey(procedureId));

  if (activeId) {
    const existing = getSession(activeId);
    if (existing) {
      return existing;
    }
  }

  return startFreshSession(procedureId, skillLevel);
}
