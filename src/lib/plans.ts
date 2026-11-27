import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TopicState } from "@/lib/agents/progress";
import type { PlanTopic } from "@prisma/client";

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export function unauthorized() {
  return Response.json({ error: "Sign in to use learning plans." }, { status: 401 });
}

export function notFound(what = "Plan") {
  return Response.json({ error: `${what} not found.` }, { status: 404 });
}

/** Load a plan the user owns (row-level access check), with its topics. */
export async function getOwnedPlan(userId: string, planId: string) {
  return prisma.learningPlan.findFirst({
    where: { id: planId, userId },
    include: { topics: { orderBy: { order: "asc" } } },
  });
}

export function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function toTopicState(t: PlanTopic): TopicState {
  return {
    id: t.id,
    order: t.order,
    title: t.title,
    status: t.status,
    mastery: t.mastery,
    attempts: t.attempts,
    weakConcepts: strings(t.weakConcepts),
    nextReviewAt: t.nextReviewAt,
  };
}

export function limitResponse(what: string) {
  return Response.json(
    { error: `You've reached today's ${what} limit. It resets at midnight UTC.`, limitReached: true },
    { status: 429 }
  );
}
