"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { generateKnowledgePack } from "@/lib/api";
import { buildSharedSidebarItems, DEFAULT_TRAINING_HREF } from "@/lib/appShell";
import { clearAuthUser } from "@/lib/storage";
import type {
  FeedbackLanguage,
  KnowledgePackResponse,
  SessionRecord,
  SkillLevel,
} from "@/lib/types";
import { useWorkspaceUser } from "@/lib/useWorkspaceUser";

const KNOWLEDGE_PROCEDURE_ID = "simple-interrupted-suture";
const KNOWLEDGE_PROGRESS_PREFIX = "ai-clinical-skills-coach:knowledge-progress";
const RAPIDFIRE_SECONDS = 12;

type KnowledgeTab = "flashcards" | "quiz" | "rapidfire";

type KnowledgeProgress = {
  answeredCount: number;
  completedQuizRounds: number;
  correctCount: number;
  flashcardsMastered: number;
  perfectRounds: number;
  rapidfireBestStreak: number;
  totalPoints: number;
};

const defaultKnowledgeProgress: KnowledgeProgress = {
  answeredCount: 0,
  completedQuizRounds: 0,
  correctCount: 0,
  flashcardsMastered: 0,
  perfectRounds: 0,
  rapidfireBestStreak: 0,
  totalPoints: 0,
};

function progressKey(username: string) {
  return `${KNOWLEDGE_PROGRESS_PREFIX}:${username.trim().toLowerCase()}`;
}

function readProgress(username: string): KnowledgeProgress {
  if (typeof window === "undefined") {
    return defaultKnowledgeProgress;
  }

  const raw = window.localStorage.getItem(progressKey(username));
  if (!raw) {
    return defaultKnowledgeProgress;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<KnowledgeProgress>;
    return {
      answeredCount:
        typeof parsed.answeredCount === "number" ? parsed.answeredCount : 0,
      completedQuizRounds:
        typeof parsed.completedQuizRounds === "number"
          ? parsed.completedQuizRounds
          : 0,
      correctCount: typeof parsed.correctCount === "number" ? parsed.correctCount : 0,
      flashcardsMastered:
        typeof parsed.flashcardsMastered === "number" ? parsed.flashcardsMastered : 0,
      perfectRounds:
        typeof parsed.perfectRounds === "number" ? parsed.perfectRounds : 0,
      rapidfireBestStreak:
        typeof parsed.rapidfireBestStreak === "number"
          ? parsed.rapidfireBestStreak
          : 0,
      totalPoints: typeof parsed.totalPoints === "number" ? parsed.totalPoints : 0,
    };
  } catch {
    return defaultKnowledgeProgress;
  }
}

function writeProgress(username: string, progress: KnowledgeProgress) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(progressKey(username), JSON.stringify(progress));
}

function ratingFromPoints(points: number) {
  if (points >= 700) {
    return "Technique Coach";
  }
  if (points >= 450) {
    return "Sharp Observer";
  }
  if (points >= 250) {
    return "Steady Learner";
  }
  if (points >= 120) {
    return "Focused Starter";
  }
  return "New Challenger";
}

function deriveReviewHref(sessions: SessionRecord[]) {
  return sessions[0] ? `/review/${sessions[0].id}` : DEFAULT_TRAINING_HREF;
}

function deriveRecentIssueLabels(sessions: SessionRecord[]) {
  const issueCounts = new Map<string, number>();

  for (const session of sessions) {
    for (const event of session.events) {
      for (const issue of event.issues) {
        const label = issue.message.trim();
        if (!label) {
          continue;
        }
        issueCounts.set(label, (issueCounts.get(label) ?? 0) + 1);
      }
    }
  }

  return [...issueCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label]) => label);
}

function deriveLatestSkillLevel(sessions: SessionRecord[]): SkillLevel {
  return sessions[0]?.skillLevel ?? "beginner";
}

function deriveLatestLanguage(sessions: SessionRecord[]): FeedbackLanguage {
  return sessions[0]?.equityMode.feedbackLanguage ?? "en";
}

function resetRapidfireState() {
  return {
    bestStreak: 0,
    correct: 0,
    currentStreak: 0,
    finished: false,
    index: 0,
    selectedIndex: null as number | null,
    started: false,
    timeLeft: RAPIDFIRE_SECONDS,
  };
}

function resetQuizState() {
  return {
    correct: 0,
    finished: false,
    index: 0,
    selectedIndex: null as number | null,
  };
}

export default function KnowledgePage() {
  const router = useRouter();
  const { hydrated, sessions, user } = useWorkspaceUser();
  const [knowledgePack, setKnowledgePack] = useState<KnowledgePackResponse | null>(null);
  const [packError, setPackError] = useState<string | null>(null);
  const [isPackLoading, setIsPackLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<KnowledgeTab>("rapidfire");
  const [progress, setProgress] = useState<KnowledgeProgress>(defaultKnowledgeProgress);
  const [rapidfireState, setRapidfireState] = useState(resetRapidfireState);
  const [quizState, setQuizState] = useState(resetQuizState);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [flashcardsKnown, setFlashcardsKnown] = useState<string[]>([]);
  const knowledgeRequestIdRef = useRef(0);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login?role=student&next=%2Fknowledge");
      return;
    }

    if (hydrated && user?.isDeveloper) {
      router.replace("/developer/approvals");
      return;
    }

    if (user) {
      setProgress(readProgress(user.username));
    }
  }, [hydrated, router, user]);

  const latestReviewHref = useMemo(() => deriveReviewHref(sessions), [sessions]);
  const hasSavedSession = sessions.length > 0;
  const recentIssueLabels = useMemo(() => deriveRecentIssueLabels(sessions), [sessions]);
  const focusArea = recentIssueLabels[0] ?? "needle entry consistency";
  const latestSkillLevel = useMemo(() => deriveLatestSkillLevel(sessions), [sessions]);
  const latestLanguage = useMemo(() => deriveLatestLanguage(sessions), [sessions]);

  const updateProgress = useCallback(
    (mutator: (previous: KnowledgeProgress) => KnowledgeProgress) => {
      if (!user) {
        return;
      }

      setProgress((previous) => {
        const next = mutator(previous);
        writeProgress(user.username, next);
        return next;
      });
    },
    [user],
  );

  function resetInteractiveState() {
    setRapidfireState(resetRapidfireState());
    setQuizState(resetQuizState());
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setFlashcardsKnown([]);
  }

  async function loadKnowledgePack() {
    if (!user) {
      return;
    }

    const requestId = knowledgeRequestIdRef.current + 1;
    knowledgeRequestIdRef.current = requestId;
    setIsPackLoading(true);
    setPackError(null);

    try {
      const nextPack = await generateKnowledgePack({
        procedure_id: KNOWLEDGE_PROCEDURE_ID,
        skill_level: latestSkillLevel,
        feedback_language: latestLanguage,
        learner_name: user.name,
        focus_area: focusArea,
        recent_issue_labels: recentIssueLabels,
      });
      if (knowledgeRequestIdRef.current !== requestId) {
        return;
      }
      setKnowledgePack(nextPack);
      resetInteractiveState();
    } catch (error) {
      if (knowledgeRequestIdRef.current !== requestId) {
        return;
      }
      setPackError(
        error instanceof Error
          ? error.message
          : "Knowledge lab is unavailable right now. Try again in a moment.",
      );
    } finally {
      if (knowledgeRequestIdRef.current === requestId) {
        setIsPackLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!user) {
      return;
    }

    void loadKnowledgePack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    return () => {
      knowledgeRequestIdRef.current += 1;
    };
  }, []);

  const rapidfireQuestions = knowledgePack?.rapidfire_rounds ?? [];
  const quizQuestions = knowledgePack?.quiz_questions ?? [];
  const flashcards = knowledgePack?.flashcards ?? [];
  const currentRapidfireQuestion =
    rapidfireQuestions[rapidfireState.index] ?? null;
  const currentQuizQuestion = quizQuestions[quizState.index] ?? null;
  const currentFlashcard = flashcards[flashcardIndex] ?? null;
  const rating = ratingFromPoints(progress.totalPoints);
  const accuracyPercent =
    progress.answeredCount > 0
      ? Math.round((progress.correctCount / progress.answeredCount) * 100)
      : 0;

  useEffect(() => {
    if (
      activeTab !== "rapidfire" ||
      !rapidfireState.started ||
      rapidfireState.finished ||
      rapidfireState.selectedIndex !== null
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      let didTimeOut = false;
      setRapidfireState((previous) => {
        if (previous.selectedIndex !== null || previous.finished) {
          return previous;
        }

        if (previous.timeLeft <= 1) {
          didTimeOut = true;
          return {
            ...previous,
            currentStreak: 0,
            selectedIndex: -1,
            timeLeft: 0,
          };
        }

        return {
          ...previous,
          timeLeft: previous.timeLeft - 1,
        };
      });

      if (didTimeOut) {
        updateProgress((previous) => ({
          ...previous,
          answeredCount: previous.answeredCount + 1,
        }));
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    activeTab,
    rapidfireState.finished,
    rapidfireState.selectedIndex,
    rapidfireState.started,
    updateProgress,
  ]);

  function handleLogout() {
    clearAuthUser();
    router.push("/login");
  }

  function startRapidfire() {
    setRapidfireState({
      ...resetRapidfireState(),
      started: true,
    });
  }

  function answerRapidfire(choiceIndex: number) {
    if (!currentRapidfireQuestion || rapidfireState.selectedIndex !== null) {
      return;
    }

    const isCorrect = choiceIndex === currentRapidfireQuestion.correct_index;
    const nextStreak = isCorrect ? rapidfireState.currentStreak + 1 : 0;
    const nextBest = Math.max(rapidfireState.bestStreak, nextStreak);

    if (isCorrect) {
      updateProgress((previous) => ({
        ...previous,
        answeredCount: previous.answeredCount + 1,
        correctCount: previous.correctCount + 1,
        rapidfireBestStreak: Math.max(previous.rapidfireBestStreak, nextBest),
        totalPoints: previous.totalPoints + currentRapidfireQuestion.point_value,
      }));
    } else {
      updateProgress((previous) => ({
        ...previous,
        answeredCount: previous.answeredCount + 1,
      }));
    }

    setRapidfireState((previous) => ({
      ...previous,
      bestStreak: nextBest,
      correct: previous.correct + (isCorrect ? 1 : 0),
      currentStreak: nextStreak,
      selectedIndex: choiceIndex,
    }));
  }

  function advanceRapidfire() {
    if (!currentRapidfireQuestion) {
      return;
    }

    const isLastQuestion = rapidfireState.index >= rapidfireQuestions.length - 1;
    if (isLastQuestion) {
      setRapidfireState((previous) => ({
        ...previous,
        finished: true,
      }));
      return;
    }

    setRapidfireState((previous) => ({
      ...previous,
      index: previous.index + 1,
      selectedIndex: null,
      timeLeft: RAPIDFIRE_SECONDS,
    }));
  }

  function answerQuiz(choiceIndex: number) {
    if (!currentQuizQuestion || quizState.selectedIndex !== null) {
      return;
    }

    const isCorrect = choiceIndex === currentQuizQuestion.correct_index;
    updateProgress((previous) => ({
      ...previous,
      answeredCount: previous.answeredCount + 1,
      correctCount: previous.correctCount + (isCorrect ? 1 : 0),
      totalPoints: previous.totalPoints + (isCorrect ? currentQuizQuestion.point_value : 0),
    }));

    setQuizState((previous) => ({
      ...previous,
      correct: previous.correct + (isCorrect ? 1 : 0),
      selectedIndex: choiceIndex,
    }));
  }

  function advanceQuiz() {
    if (!currentQuizQuestion) {
      return;
    }

    const isLastQuestion = quizState.index >= quizQuestions.length - 1;
    if (isLastQuestion) {
      const perfectRound = quizState.correct === quizQuestions.length;
      updateProgress((previous) => ({
        ...previous,
        completedQuizRounds: previous.completedQuizRounds + 1,
        perfectRounds: previous.perfectRounds + (perfectRound ? 1 : 0),
      }));
      setQuizState((previous) => ({
        ...previous,
        finished: true,
      }));
      return;
    }

    setQuizState((previous) => ({
      ...previous,
      index: previous.index + 1,
      selectedIndex: null,
    }));
  }

  function markFlashcard(known: boolean) {
    if (!currentFlashcard) {
      return;
    }

    if (known && !flashcardsKnown.includes(currentFlashcard.id)) {
      setFlashcardsKnown((previous) => [...previous, currentFlashcard.id]);
      updateProgress((previous) => ({
        ...previous,
        flashcardsMastered: previous.flashcardsMastered + 1,
        totalPoints: previous.totalPoints + currentFlashcard.point_value,
      }));
    }

    setFlashcardFlipped(false);
    setFlashcardIndex((previous) => {
      if (previous >= flashcards.length - 1) {
        return 0;
      }
      return previous + 1;
    });
  }

  if (!hydrated || !user) {
    return (
      <AppFrame
        brandSubtitle="Knowledge lab"
        pageTitle="Knowledge Lab"
        sidebarItems={buildSharedSidebarItems({ active: "knowledge", userRole: null })}
      >
        <section className="dashboard-card dashboard-frame-panel">
          <span className="dashboard-card-eyebrow">Preparing Knowledge Lab</span>
          <h2>Checking your workspace profile.</h2>
          <p>We’re loading your study mode and recent practice context.</p>
        </section>
      </AppFrame>
    );
  }

  return (
    <AppFrame
      brandSubtitle="Gamified study mode"
      footerPrimaryAction={{
        href: DEFAULT_TRAINING_HREF,
        icon: "play",
        label: "Start Live Session",
        strong: true,
      }}
      footerSecondaryActions={[
        {
          href: latestReviewHref,
          icon: "review",
          label: hasSavedSession ? "Latest Review" : "Open Trainer",
        },
        { href: "/library", icon: "book", label: "Practice Guide" },
        { icon: "logout", label: "Logout", onClick: handleLogout },
      ]}
      pageTitle="Knowledge Lab"
      sidebarItems={buildSharedSidebarItems({
        active: "knowledge",
        isDeveloper: user.isDeveloper,
        reviewHref: latestReviewHref,
        userRole: user.role,
      })}
      statusPill={{ icon: "spark", label: rating }}
      topActions={[
        { href: latestReviewHref, label: hasSavedSession ? "Latest Review" : "Open Trainer" },
        { href: DEFAULT_TRAINING_HREF, label: "Open Trainer", strong: true },
      ]}
      userName={user.name}
    >
      <section className="dashboard-hero knowledge-hero">
        <div>
          <span className="dashboard-kicker">Knowledge Lab</span>
          <h1>Learn fast, test yourself, then take it back into the trainer.</h1>
          <p>
            This mode uses Claude to build a quick study pack around your current
            procedure, with rapid-fire rounds, a deeper quiz, and flashcards you can
            flip through at your own pace.
          </p>
        </div>
        <div className="dashboard-hero-meta">
          <span>{rating}</span>
          <span>{focusArea}</span>
          <button
            className="dashboard-action-pill is-strong"
            onClick={() => void loadKnowledgePack()}
            type="button"
          >
            New AI Round
          </button>
        </div>
      </section>

      <section className="knowledge-summary-grid">
        <article className="dashboard-card dashboard-kpi-card knowledge-summary-card">
          <span>Total points</span>
          <strong>{progress.totalPoints}</strong>
          <p>Your running score across quizzes, rounds, and flashcards.</p>
        </article>
        <article className="dashboard-card dashboard-kpi-card knowledge-summary-card">
          <span>Accuracy</span>
          <strong>{accuracyPercent}%</strong>
          <p>Correct answers across all knowledge checks.</p>
        </article>
        <article className="dashboard-card dashboard-kpi-card knowledge-summary-card">
          <span>Best streak</span>
          <strong>{progress.rapidfireBestStreak}</strong>
          <p>Your strongest rapid-fire run so far.</p>
        </article>
        <article className="dashboard-card dashboard-kpi-card knowledge-summary-card">
          <span>Flashcards mastered</span>
          <strong>{progress.flashcardsMastered}</strong>
          <p>Cards you marked as learned during study rounds.</p>
        </article>
      </section>

      {packError ? (
        <article className="feedback-block knowledge-feedback-block">
          <div className="feedback-header">
            <strong>Knowledge pack unavailable</strong>
          </div>
          <p className="feedback-copy">{packError}</p>
        </article>
      ) : null}

      <div className="dashboard-grid">
        <div className="dashboard-left-column">
          <article className="dashboard-card knowledge-pack-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Current Pack</span>
                <h2>{knowledgePack?.title ?? "Building your knowledge pack"}</h2>
              </div>
              <span className="dashboard-meta-chip">
                {isPackLoading ? "loading" : knowledgePack ? "ready" : "waiting"}
              </span>
            </div>
            <p className="library-lead-copy">
              {knowledgePack?.summary ??
                "Generating a study set from the suturing rubric and your recent practice context."}
            </p>
            <div className="knowledge-chip-row">
              <span className="dashboard-meta-chip">
                Focus: {knowledgePack?.recommended_focus ?? focusArea}
              </span>
              <span className="dashboard-meta-chip">
                Quiz rounds: {progress.completedQuizRounds}
              </span>
              <span className="dashboard-meta-chip">
                Perfect rounds: {progress.perfectRounds}
              </span>
            </div>
            <div className="knowledge-tab-row">
              <button
                className={`knowledge-tab ${activeTab === "rapidfire" ? "is-active" : ""}`}
                onClick={() => setActiveTab("rapidfire")}
                type="button"
              >
                Rapidfire
              </button>
              <button
                className={`knowledge-tab ${activeTab === "quiz" ? "is-active" : ""}`}
                onClick={() => setActiveTab("quiz")}
                type="button"
              >
                Quiz
              </button>
              <button
                className={`knowledge-tab ${activeTab === "flashcards" ? "is-active" : ""}`}
                onClick={() => setActiveTab("flashcards")}
                type="button"
              >
                Flashcards
              </button>
            </div>

            {activeTab === "rapidfire" ? (
              <section className="knowledge-mode-panel">
                {!rapidfireState.started || rapidfireState.finished ? (
                  <div className="knowledge-round-summary">
                    <div>
                      <span className="dashboard-card-eyebrow">Rapidfire Round</span>
                      <h3>
                        {rapidfireState.finished
                          ? `${rapidfireState.correct}/${rapidfireQuestions.length} correct`
                          : "Ready to sprint through the rubric?"}
                      </h3>
                      <p>
                        {rapidfireState.finished
                          ? knowledgePack?.celebration_line ??
                            "You finished the round. Generate a fresh one or head back to the trainer."
                          : "You get 12 seconds per question. Correct answers build streaks and points fast."}
                      </p>
                    </div>
                    <div className="knowledge-metric-strip">
                      <div>
                        <span>Current streak</span>
                        <strong>{rapidfireState.currentStreak}</strong>
                      </div>
                      <div>
                        <span>Best this round</span>
                        <strong>{rapidfireState.bestStreak}</strong>
                      </div>
                    </div>
                    <div className="dashboard-frame-actions">
                      <button
                        className="dashboard-primary-button"
                        onClick={startRapidfire}
                        type="button"
                      >
                        {rapidfireState.finished ? "Play Again" : "Start Rapidfire"}
                      </button>
                      <button
                        className="dashboard-action-pill"
                        onClick={() => void loadKnowledgePack()}
                        type="button"
                      >
                        Refresh Pack
                      </button>
                    </div>
                  </div>
                ) : currentRapidfireQuestion ? (
                  <div className="knowledge-question-shell">
                    <div className="knowledge-question-topline">
                      <span className="dashboard-card-eyebrow">
                        Question {rapidfireState.index + 1} of {rapidfireQuestions.length}
                      </span>
                      <span className="knowledge-timer">{rapidfireState.timeLeft}s</span>
                    </div>
                    <h3>{currentRapidfireQuestion.prompt}</h3>
                    <div className="knowledge-choice-grid">
                      {currentRapidfireQuestion.choices.map((choice, index) => {
                        const isSelected = rapidfireState.selectedIndex === index;
                        const isCorrect = index === currentRapidfireQuestion.correct_index;
                        const showCorrect =
                          rapidfireState.selectedIndex !== null && isCorrect;
                        const stateClass =
                          rapidfireState.selectedIndex === null
                            ? ""
                            : showCorrect
                              ? "is-correct"
                              : isSelected
                                ? "is-wrong"
                                : "";

                        return (
                          <button
                            className={`knowledge-choice ${stateClass}`}
                            key={`${currentRapidfireQuestion.id}:${choice}`}
                            onClick={() => answerRapidfire(index)}
                            type="button"
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                    {rapidfireState.selectedIndex !== null ? (
                      <div className="knowledge-explanation-card">
                        <strong>
                          {rapidfireState.selectedIndex === currentRapidfireQuestion.correct_index
                            ? "Correct"
                            : rapidfireState.selectedIndex === -1
                              ? "Time is up"
                              : "Not quite"}
                        </strong>
                        <p>{currentRapidfireQuestion.explanation}</p>
                        <button
                          className="dashboard-primary-button"
                          onClick={advanceRapidfire}
                          type="button"
                        >
                          {rapidfireState.index >= rapidfireQuestions.length - 1
                            ? "Finish Round"
                            : "Next Question"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {activeTab === "quiz" ? (
              <section className="knowledge-mode-panel">
                {currentQuizQuestion && !quizState.finished ? (
                  <div className="knowledge-question-shell">
                    <div className="knowledge-question-topline">
                      <span className="dashboard-card-eyebrow">
                        Quiz {quizState.index + 1} of {quizQuestions.length}
                      </span>
                      <span className="dashboard-meta-chip">
                        {currentQuizQuestion.difficulty}
                      </span>
                    </div>
                    <h3>{currentQuizQuestion.prompt}</h3>
                    <div className="knowledge-choice-grid">
                      {currentQuizQuestion.choices.map((choice, index) => {
                        const isSelected = quizState.selectedIndex === index;
                        const isCorrect = index === currentQuizQuestion.correct_index;
                        const showCorrect = quizState.selectedIndex !== null && isCorrect;
                        const stateClass =
                          quizState.selectedIndex === null
                            ? ""
                            : showCorrect
                              ? "is-correct"
                              : isSelected
                                ? "is-wrong"
                                : "";

                        return (
                          <button
                            className={`knowledge-choice ${stateClass}`}
                            key={`${currentQuizQuestion.id}:${choice}`}
                            onClick={() => answerQuiz(index)}
                            type="button"
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                    {quizState.selectedIndex !== null ? (
                      <div className="knowledge-explanation-card">
                        <strong>
                          {quizState.selectedIndex === currentQuizQuestion.correct_index
                            ? "Correct answer"
                            : "Review this cue"}
                        </strong>
                        <p>{currentQuizQuestion.explanation}</p>
                        <button
                          className="dashboard-primary-button"
                          onClick={advanceQuiz}
                          type="button"
                        >
                          {quizState.index >= quizQuestions.length - 1
                            ? "Finish Quiz"
                            : "Next Question"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="knowledge-round-summary">
                    <div>
                      <span className="dashboard-card-eyebrow">Quiz Complete</span>
                      <h3>
                        {quizState.correct}/{quizQuestions.length || 0} correct
                      </h3>
                      <p>
                        Use the explanation cards to spot what the trainer expects, then
                        take that mental model back into the live session.
                      </p>
                    </div>
                    <div className="dashboard-frame-actions">
                      <button
                        className="dashboard-primary-button"
                        onClick={() => setQuizState(resetQuizState())}
                        type="button"
                      >
                        Restart Quiz
                      </button>
                      <Link className="dashboard-action-pill" href={DEFAULT_TRAINING_HREF}>
                        Back to trainer
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            ) : null}

            {activeTab === "flashcards" ? (
              <section className="knowledge-mode-panel">
                {currentFlashcard ? (
                  <>
                    <div className="knowledge-question-topline">
                      <span className="dashboard-card-eyebrow">
                        Card {flashcardIndex + 1} of {flashcards.length}
                      </span>
                      <span className="dashboard-meta-chip">
                        Learned this round: {flashcardsKnown.length}
                      </span>
                    </div>
                    <button
                      className={`knowledge-flashcard ${flashcardFlipped ? "is-flipped" : ""}`}
                      onClick={() => setFlashcardFlipped((previous) => !previous)}
                      type="button"
                    >
                      <div className="knowledge-flashcard-face knowledge-flashcard-front">
                        <span className="dashboard-card-eyebrow">Prompt</span>
                        <h3>{currentFlashcard.front}</h3>
                        <p>Tap to flip the card.</p>
                      </div>
                      <div className="knowledge-flashcard-face knowledge-flashcard-back">
                        <span className="dashboard-card-eyebrow">Answer</span>
                        <h3>{currentFlashcard.back}</h3>
                        <p>{currentFlashcard.memory_tip}</p>
                      </div>
                    </button>
                    <div className="dashboard-frame-actions">
                      <button
                        className="dashboard-action-pill"
                        onClick={() => markFlashcard(false)}
                        type="button"
                      >
                        Need Again
                      </button>
                      <button
                        className="dashboard-primary-button"
                        onClick={() => markFlashcard(true)}
                        type="button"
                      >
                        Got It
                      </button>
                    </div>
                  </>
                ) : null}
              </section>
            ) : null}
          </article>
        </div>

        <div className="dashboard-right-column">
          <article className="dashboard-card knowledge-side-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Scoreboard</span>
                <h2>Your current rating</h2>
              </div>
              <span className="dashboard-meta-chip">{rating}</span>
            </div>
            <div className="knowledge-score-stack">
              <div>
                <span>Total points</span>
                <strong>{progress.totalPoints}</strong>
              </div>
              <div>
                <span>Answered</span>
                <strong>{progress.answeredCount}</strong>
              </div>
              <div>
                <span>Correct</span>
                <strong>{progress.correctCount}</strong>
              </div>
            </div>
          </article>

          <article className="dashboard-card knowledge-side-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Recommended Focus</span>
                <h2>What to keep in mind next</h2>
              </div>
            </div>
            <p className="library-lead-copy">
              {knowledgePack?.recommended_focus ?? focusArea}
            </p>
            <ul className="library-guardrail-list">
              {recentIssueLabels.length > 0 ? (
                recentIssueLabels.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>Use the knowledge round to sharpen one stage before the next session.</li>
              )}
            </ul>
          </article>

          <article className="dashboard-card knowledge-side-card">
            <div className="dashboard-card-header">
              <div>
                <span className="dashboard-card-eyebrow">Why This Helps</span>
                <h2>Study with the same rubric the trainer uses.</h2>
              </div>
            </div>
            <ul className="library-guardrail-list">
              <li>Rapidfire builds quick recall for stage goals and common misses.</li>
              <li>The quiz slows down and explains how the frame gets judged.</li>
              <li>Flashcards help you rehearse the same cues before the next rep.</li>
            </ul>
          </article>
        </div>
      </div>
    </AppFrame>
  );
}
