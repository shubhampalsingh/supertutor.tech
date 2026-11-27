/**
 * Progress and Revision agent + Orchestrator decision rules.
 * Pure application code: updates mastery estimates, schedules revision and
 * decides the learner's next step. Kept free of I/O so it is easy to test.
 */

export const MASTERY_THRESHOLD = 0.75;
const DAY = 86_400_000;

export type TopicState = {
  id: string;
  order: number;
  title: string;
  status: string; // todo | learning | mastered | revise
  mastery: number;
  attempts: number;
  weakConcepts: string[];
  nextReviewAt: Date | null;
};

/**
 * Blend the newest quiz accuracy into the mastery estimate.
 * Recent evidence counts more, but one lucky quiz can't jump a topic to 100%.
 */
export function updateMastery(prev: number, attempts: number, accuracy: number): number {
  const weight = attempts === 0 ? 0.8 : 0.6;
  return Math.round((prev * (1 - weight) + accuracy * weight) * 100) / 100;
}

/** Spaced revision: the better the mastery, the longer until the next review. */
export function nextReviewDate(mastery: number, attempts: number, now = new Date()): Date {
  if (mastery < 0.5) return new Date(now.getTime() + 1 * DAY);
  if (mastery < MASTERY_THRESHOLD) return new Date(now.getTime() + 2 * DAY);
  const days = Math.min(30, 3 * Math.pow(2, Math.max(0, attempts - 1)));
  return new Date(now.getTime() + days * DAY);
}

export function mergeWeakConcepts(prev: string[], missed: string[], gotRight: string[]): string[] {
  const right = new Set(gotRight.map((c) => c.toLowerCase()));
  const kept = prev.filter((c) => !right.has(c.toLowerCase()));
  for (const m of missed) if (!kept.some((k) => k.toLowerCase() === m.toLowerCase())) kept.push(m);
  return kept.slice(-8);
}

export type AssessmentOutcome = {
  mastery: number;
  status: "mastered" | "revise";
  nextReviewAt: Date;
  weakConcepts: string[];
  decision: "advance" | "reteach";
};

export function applyAssessment(
  topic: Pick<TopicState, "mastery" | "attempts" | "weakConcepts">,
  grade: { accuracy: number; missedConcepts: string[]; perQuestion: { correct: boolean; concept: string }[] },
  now = new Date()
): AssessmentOutcome {
  const mastery = updateMastery(topic.mastery, topic.attempts, grade.accuracy);
  const passed = mastery >= MASTERY_THRESHOLD && grade.accuracy >= 0.6;
  const gotRight = grade.perQuestion.filter((p) => p.correct).map((p) => p.concept);
  return {
    mastery,
    status: passed ? "mastered" : "revise",
    nextReviewAt: nextReviewDate(mastery, topic.attempts + 1, now),
    weakConcepts: mergeWeakConcepts(topic.weakConcepts, grade.missedConcepts, gotRight),
    decision: passed ? "advance" : "reteach",
  };
}

export type NextStep =
  | { kind: "review"; topicId: string; title: string; reason: string }
  | { kind: "reteach"; topicId: string; title: string; reason: string }
  | { kind: "learn"; topicId: string; title: string; reason: string }
  | { kind: "quiz"; topicId: string; title: string; reason: string }
  | { kind: "done"; reason: string };

/**
 * Orchestrator: choose what the learner should do next.
 * Priority: overdue revision → struggling topic → finish the topic in progress
 * → next new topic → done.
 */
export function chooseNextStep(topics: TopicState[], now = new Date()): NextStep {
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const due = sorted
    .filter((t) => t.status === "mastered" && t.nextReviewAt && t.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt!.getTime() - b.nextReviewAt!.getTime())[0];
  if (due) {
    return { kind: "review", topicId: due.id, title: due.title, reason: "It's time to review this so it sticks." };
  }
  const struggling = sorted.find((t) => t.status === "revise");
  if (struggling) {
    return {
      kind: "reteach",
      topicId: struggling.id,
      title: struggling.title,
      reason: struggling.weakConcepts.length
        ? `Let's look again at: ${struggling.weakConcepts.slice(0, 3).join(", ")}.`
        : "Your last quiz showed this needs another pass.",
    };
  }
  const learning = sorted.find((t) => t.status === "learning");
  if (learning) {
    return { kind: "quiz", topicId: learning.id, title: learning.title, reason: "You've studied this. Check your understanding with a quick quiz." };
  }
  const next = sorted.find((t) => t.status === "todo");
  if (next) {
    return { kind: "learn", topicId: next.id, title: next.title, reason: next.order === 0 ? "Start your plan here." : "You're ready for the next topic." };
  }
  return { kind: "done", reason: "Every topic is mastered. Reviews will appear here when they're due." };
}
