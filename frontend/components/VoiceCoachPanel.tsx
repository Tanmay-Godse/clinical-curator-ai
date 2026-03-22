"use client";

import { useEffect, useMemo } from "react";

import {
  COACH_VOICE_OPTIONS,
  canUseSpeechSynthesis,
  canUseVoiceRecording,
  primeSpeechPlayback,
  speakText,
  stopSpeechPlayback,
} from "@/lib/audio";
import type {
  CoachVoicePreset,
  CoachChatMessage,
  CoachChatResponse,
  FeedbackLanguage,
} from "@/lib/types";

type VoiceCoachPanelProps = {
  cameraReady: boolean;
  coachTurn: CoachChatResponse | null;
  coachVoice: CoachVoicePreset;
  error: string | null;
  feedbackLanguage: FeedbackLanguage;
  messages: CoachChatMessage[];
  onCoachVoiceChange: (voice: CoachVoicePreset) => void;
  simulationConfirmed: boolean;
  voiceChatEnabled: boolean;
  voiceSessionStatus:
    | "idle"
    | "starting"
    | "watching"
    | "speaking"
    | "listening"
    | "thinking"
    | "paused";
};

export function VoiceCoachPanel({
  cameraReady,
  coachTurn,
  coachVoice,
  error,
  feedbackLanguage,
  messages,
  onCoachVoiceChange,
  simulationConfirmed,
  voiceChatEnabled,
  voiceSessionStatus,
}: VoiceCoachPanelProps) {
  const supportsSpeechSynthesis = useMemo(() => canUseSpeechSynthesis(), []);
  const supportsVoiceRecording = useMemo(() => canUseVoiceRecording(), []);

  useEffect(() => {
    return () => {
      stopSpeechPlayback();
    };
  }, []);

  async function handleTestVoice() {
    primeSpeechPlayback();
    await speakText(
      "Coach voice check. If you hear this, spoken guidance is working.",
      feedbackLanguage,
      coachVoice,
    );
  }

  return (
    <article className="panel" style={{ marginTop: 20 }}>
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Voice coach</h2>
          <p className="panel-copy">
            Keep voice guidance simple: start the camera, let the coach speak, and
            reply by voice when needed.
          </p>
        </div>
        <span className="pill">
          {cameraReady ? "camera live" : "waiting for camera"}
        </span>
      </div>

      <div className="coach-status-grid" style={{ marginTop: 16 }}>
        <article className="metric-card compact-metric-card">
          <p className="metric-label">Coach stage</p>
          <p className="metric-value">
            {coachTurn?.conversation_stage?.replaceAll("_", " ") ?? "standby"}
          </p>
          <p className="panel-copy" style={{ marginTop: 10 }}>
            {simulationConfirmed
              ? "Frame-aware coaching is ready."
              : "Confirm simulation-only mode to enable grading."}
          </p>
        </article>

        <article className="metric-card compact-metric-card">
          <p className="metric-label">Hands-free mode</p>
          <p className="metric-value">{voiceSessionStatus}</p>
          <p className="panel-copy" style={{ marginTop: 10 }}>
            {voiceChatEnabled
              ? "Coach replies play automatically and the mic reopens after each turn."
              : "Turn on Audio coaching in Setup to enable the loop."}
          </p>
        </article>
      </div>

      <div className="inline-form-row" style={{ marginTop: 16 }}>
        <label className="field-label">
          Coach voice
          <select
            onChange={(event) =>
              onCoachVoiceChange(event.target.value as CoachVoicePreset)
            }
            value={coachVoice}
          >
            {COACH_VOICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <article className="metric-card compact-metric-card">
          <p className="metric-label">Audio path</p>
          <p className="metric-value">
            {supportsSpeechSynthesis ? "browser voice" : "backend voice"}
          </p>
          <p className="panel-copy" style={{ marginTop: 10 }}>
            {supportsVoiceRecording ? "Mic ready for replies." : "Mic input is unavailable in this browser."}
          </p>
        </article>
      </div>

      {coachTurn ? (
        <div className="coach-plan-card" style={{ marginTop: 16 }}>
          <strong>Current plan</strong>
          <p className="panel-copy" style={{ marginTop: 10 }}>
            {coachTurn.plan_summary}
          </p>
          <p className="panel-copy" style={{ marginTop: 10 }}>
            Next step: {coachTurn.suggested_next_step}
          </p>
          {coachTurn.stage_focus.length > 0 ? (
            <ul className="feedback-list" style={{ marginTop: 12 }}>
              {coachTurn.stage_focus.slice(0, 3).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="coach-transcript" style={{ marginTop: 16 }}>
        {messages.length === 0 ? (
          <div className="feedback-block">
            <strong>Coach standby</strong>
            <p className="feedback-copy" style={{ marginTop: 12 }}>
              Start the camera and the coach will guide the stage from there.
            </p>
          </div>
        ) : (
          <ul className="timeline-list">
            {messages.slice(-4).map((message, index) => (
              <li className="timeline-item" key={`${message.role}-${index}-${message.content}`}>
                <header>
                  <strong>{message.role === "assistant" ? "AI coach" : "Learner"}</strong>
                  <span className="pill">{message.role}</span>
                </header>
                <p className="review-subtle" style={{ marginTop: 10 }}>
                  {message.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <div className="feedback-block" style={{ marginTop: 16 }}>
          <div className="feedback-header">
            <strong>Coach issue</strong>
            <span className="status-badge status-unsafe">attention</span>
          </div>
          <p className="feedback-copy" style={{ marginTop: 12 }}>
            {error}
          </p>
        </div>
      ) : null}

      <div className="button-row" style={{ marginTop: 16 }}>
        <button
          className="button-secondary"
          onClick={() => void handleTestVoice()}
          type="button"
        >
          Test Voice
        </button>
        <button
          className="button-ghost"
          onClick={stopSpeechPlayback}
          type="button"
        >
          Stop Voice
        </button>
      </div>
    </article>
  );
}
