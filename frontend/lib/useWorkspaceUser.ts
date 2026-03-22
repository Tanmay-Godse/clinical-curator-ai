"use client";

import { useCallback, useSyncExternalStore } from "react";

import { getAuthUser, listSessionsForOwner } from "@/lib/storage";
import type { AuthUser, SessionRecord } from "@/lib/types";

type WorkspaceUserState = {
  hydrated: boolean;
  sessions: SessionRecord[];
  user: AuthUser | null;
};

const emptyState: WorkspaceUserState = {
  hydrated: false,
  sessions: [],
  user: null,
};

let cachedBrowserSignature: string | null = null;
let cachedBrowserState: WorkspaceUserState = emptyState;

const listeners = new Set<() => void>();

function emitWorkspaceUserChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const handleStorage = () => {
    listener();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getSnapshot() {
  const user = getAuthUser();
  const sessions = user ? listSessionsForOwner(user.username) : [];
  const signature = JSON.stringify({ user, sessions });

  if (cachedBrowserSignature === signature) {
    return cachedBrowserState;
  }

  cachedBrowserSignature = signature;
  cachedBrowserState = {
    hydrated: true,
    sessions,
    user,
  };

  return cachedBrowserState;
}

export function useWorkspaceUser() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => emptyState);

  const sync = useCallback(() => {
    emitWorkspaceUserChange();
  }, []);

  return {
    ...state,
    sync,
  };
}
