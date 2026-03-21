import type {
  AdaptiveDrill,
  ErrorFingerprintItem,
  FeedbackLanguage,
  Issue,
  LearnerProfileSnapshot,
  SessionEvent,
  SessionRecord,
} from "@/lib/types";

const ISSUE_LABELS: Record<string, Partial<Record<FeedbackLanguage, string>>> = {
  angle_shallow: {
    en: "shallow entry angle",
    es: "angulo de entrada superficial",
    fr: "angle d entree trop superficiel",
    hi: "shallow entry angle",
  },
  grip_inconsistent: {
    en: "inconsistent grip",
    es: "agarre inconsistente",
    fr: "prise inconsistante",
    hi: "inconsistent grip",
  },
  knot_overtight: {
    en: "overtight knot tying",
    es: "nudo demasiado apretado",
    fr: "noeud trop serre",
    hi: "overtight knot tying",
  },
  exit_misaligned: {
    en: "misaligned exit point",
    es: "punto de salida desalineado",
    fr: "point de sortie mal aligne",
    hi: "misaligned exit point",
  },
  thread_slack: {
    en: "uneven thread control",
    es: "control desigual del hilo",
    fr: "controle irregulier du fil",
    hi: "uneven thread control",
  },
  frame_blurry: {
    en: "unclear frame capture",
    es: "captura poco clara",
    fr: "capture peu claire",
    hi: "unclear frame capture",
  },
};

type DrillCopy = {
  defaultFocus: string;
  titlePrefix: string;
  reasonPrefix: string;
  repTarget: string;
  steps: (focus: string) => [string, string, string];
};

const DRILL_COPY: Record<FeedbackLanguage, DrillCopy> = {
  en: {
    defaultFocus: "frame clarity",
    titlePrefix: "Mini drill",
    reasonPrefix: "This drill targets your most repeated issue:",
    repTarget: "Target: 5 focused reps and 1 full capture.",
    steps: (focus) => [
      `Do 5 slow reps that isolate ${focus} instead of running a full stitch.`,
      "Pause after each rep and check whether the correction stayed visible in frame.",
      "Finish with 1 full captured attempt and compare it with the earlier pattern.",
    ],
  },
  es: {
    defaultFocus: "claridad de imagen",
    titlePrefix: "Mini ejercicio",
    reasonPrefix: "Este ejercicio apunta a tu correccion mas repetida:",
    repTarget: "Objetivo: 5 repeticiones enfocadas y 1 captura completa.",
    steps: (focus) => [
      `Haz 5 repeticiones lentas enfocadas solo en ${focus}, no en toda la sutura.`,
      "Haz una pausa despues de cada repeticion y verifica si la correccion sigue visible en la imagen.",
      "Termina con 1 intento completo capturado y comparalo con el patron anterior.",
    ],
  },
  fr: {
    defaultFocus: "clarte de l image",
    titlePrefix: "Mini exercice",
    reasonPrefix: "Cet exercice cible la correction la plus frequente :",
    repTarget: "Objectif : 5 repetitions ciblees puis 1 capture complete.",
    steps: (focus) => [
      `Faites 5 repetitions lentes en vous concentrant seulement sur ${focus}, pas sur toute la suture.`,
      "Marquez une pause apres chaque repetition pour verifier si la correction reste visible dans l image.",
      "Terminez par 1 tentative complete capturee puis comparez-la au motif precedent.",
    ],
  },
  hi: {
    defaultFocus: "frame clarity",
    titlePrefix: "Mini drill",
    reasonPrefix: "Yeh drill aapki sabse repeat hone wali correction par focused hai:",
    repTarget: "Target: 5 focused reps aur 1 full capture.",
    steps: (focus) => [
      `5 slow reps kijiye jisme focus sirf ${focus} par ho, poore stitch par nahi.`,
      "Har rep ke baad ruk kar dekhiye ki correction frame me clear rahi ya nahi.",
      "Akhir me 1 full captured attempt kijiye aur use pichhle pattern se compare kijiye.",
    ],
  },
};

export function inferEventGraded(event: Pick<SessionEvent, "graded" | "analysisMode" | "stepStatus">): boolean {
  if (typeof event.graded === "boolean") {
    return event.graded;
  }

  if (event.analysisMode === "blocked") {
    return false;
  }

  return event.stepStatus !== "unclear";
}

export function buildLearnerProfileSnapshot(
  sessions: SessionRecord[],
  feedbackLanguage: FeedbackLanguage,
): LearnerProfileSnapshot {
  const recurringIssues = new Map<string, ErrorFingerprintItem>();
  let gradedAttempts = 0;

  for (const session of sessions) {
    for (const event of session.events) {
      if (!inferEventGraded(event)) {
        continue;
      }

      gradedAttempts += 1;
      for (const issue of event.issues) {
        const existing = recurringIssues.get(issue.code);

        if (!existing) {
          recurringIssues.set(issue.code, {
            code: issue.code,
            label: issueLabel(issue, feedbackLanguage),
            count: 1,
            stage_ids: [event.stageId],
          });
          continue;
        }

        recurringIssues.set(issue.code, {
          ...existing,
          count: existing.count + 1,
          stage_ids: existing.stage_ids.includes(event.stageId)
            ? existing.stage_ids
            : [...existing.stage_ids, event.stageId].slice(0, 6),
        });
      }
    }
  }

  return {
    total_sessions: sessions.length,
    graded_attempts: gradedAttempts,
    recurring_issues: [...recurringIssues.values()]
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 3),
  };
}

export function buildLocalAdaptiveDrill(
  profile: LearnerProfileSnapshot | null,
  feedbackLanguage: FeedbackLanguage,
): AdaptiveDrill {
  const copy = DRILL_COPY[feedbackLanguage] ?? DRILL_COPY.en;
  const focus = profile?.recurring_issues[0]?.label ?? copy.defaultFocus;
  const instructions = copy.steps(focus);

  return {
    title: `${copy.titlePrefix}: ${focus}`,
    focus,
    reason: `${copy.reasonPrefix} ${focus}.`,
    instructions,
    rep_target: copy.repTarget,
  };
}

function issueLabel(issue: Issue, feedbackLanguage: FeedbackLanguage): string {
  const mappedLabel = ISSUE_LABELS[issue.code]?.[feedbackLanguage];
  if (mappedLabel) {
    return mappedLabel;
  }

  const trimmedMessage = issue.message.trim().replace(/\.$/, "");
  if (trimmedMessage && trimmedMessage.length <= 60) {
    return trimmedMessage.charAt(0).toLowerCase() + trimmedMessage.slice(1);
  }

  return issue.code.replaceAll("_", " ").replaceAll("-", " ");
}
