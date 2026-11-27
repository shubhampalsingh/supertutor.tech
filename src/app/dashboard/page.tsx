"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type Progress = {
  signedIn: boolean;
  name?: string;
  xp: number;
  streak: number;
  counts: { chats: number; quizzes: number; decks: number; dueCards: number };
  today: { chatMessages: number; quizzes: number; decks: number; solves: number };
  limits: { chatMessages: number; quizzes: number; decks: number; solves: number };
  recentAttempts: { topic: string; score: number; total: number; at: string }[];
  learning: {
    topics: number;
    mastered: number;
    avgMastery: number | null;
    gaps: { planId: string; topicId: string; title: string; goal: string; mastery: number; weakConcepts: string[] }[];
    reviewsDue: { planId: string; topicId: string; title: string; goal: string }[];
  };
};

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="pt-24 text-center text-sm text-slate-500">Loading progress…</div>;
  }

  if (!data?.signedIn) {
    return (
      <div className="card mx-auto mt-20 max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Sign in to see your progress</h1>
        <p className="mt-2 text-slate-600">
          Topic mastery, knowledge gaps, quiz results and review schedules are saved to your account.
        </p>
      </div>
    );
  }

  const { learning } = data;
  const usageRows = [
    { label: "Tutor messages", used: data.today.chatMessages, max: data.limits.chatMessages },
    { label: "Photo solves", used: data.today.solves, max: data.limits.solves },
    { label: "Quizzes", used: data.today.quizzes, max: data.limits.quizzes },
    { label: "Flashcard decks", used: data.today.decks, max: data.limits.decks },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Progress"
        title={data.name ? `${data.name.split(" ")[0]}'s progress` : "Your progress"}
        description="Mastery and knowledge gaps come from topic quizzes in your study plans."
        actions={
          <Link href="/plan" className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
            Study plans <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Topics mastered" value={`${learning.mastered}/${learning.topics}`} />
        <Stat
          label="Average mastery"
          value={learning.avgMastery === null ? "–" : `${Math.round(learning.avgMastery * 100)}%`}
          hint="Across assessed topics"
        />
        <Stat label="Quizzes taken" value={data.counts.quizzes} />
        <Stat label="Study streak" value={`${data.streak} ${data.streak === 1 ? "day" : "days"}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-semibold">Knowledge gaps</h2>
            <p className="text-sm text-slate-500">Topics and concepts to revisit, weakest first.</p>
          </div>
          {learning.topics === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-600">
              You don&apos;t have a study plan yet.{" "}
              <Link href="/plan" className="font-medium text-brand hover:underline">
                Create one from your goal
              </Link>{" "}
              to start tracking mastery.
            </div>
          ) : learning.gaps.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">No gaps identified yet. They appear after topic quizzes.</div>
          ) : (
            <ul className="divide-y divide-line">
              {learning.gaps.map((g) => (
                <li key={g.topicId} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/plan/${g.planId}/topic/${g.topicId}?mode=reteach`}
                      className="truncate text-sm font-medium hover:text-brand"
                    >
                      {g.title}
                    </Link>
                    <span className="shrink-0 text-sm tabular-nums text-sunny">{Math.round(g.mastery * 100)}%</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">
                    {g.weakConcepts.length ? g.weakConcepts.join(" · ") : g.goal}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-semibold">Due for review</h2>
            <p className="text-sm text-slate-500">Spaced revision keeps mastered topics fresh.</p>
          </div>
          {learning.reviewsDue.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">Nothing due right now.</div>
          ) : (
            <ul className="divide-y divide-line">
              {learning.reviewsDue.map((r) => (
                <li key={r.topicId} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.title}</div>
                    <div className="truncate text-xs text-slate-500">{r.goal}</div>
                  </div>
                  <Link
                    href={`/plan/${r.planId}/topic/${r.topicId}?mode=quiz`}
                    className="btn-secondary shrink-0 px-3 py-1.5 text-sm"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {data.counts.dueCards > 0 && (
            <Link
              href="/flashcards"
              className="flex items-center justify-between border-t border-line px-5 py-3.5 text-sm hover:bg-slate-50"
            >
              <span>
                {data.counts.dueCards} flashcard{data.counts.dueCards === 1 ? "" : "s"} due
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-semibold">Recent quiz results</h2>
          </div>
          {data.recentAttempts.length === 0 ? (
            <div className="px-5 py-8 text-sm text-slate-500">
              No quizzes yet.{" "}
              <Link href="/quiz" className="font-medium text-brand hover:underline">
                Take a practice quiz
              </Link>
              .
            </div>
          ) : (
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-28" />
                <col className="w-16" />
              </colgroup>
              <tbody className="divide-y divide-line">
                {data.recentAttempts.map((a, i) => (
                  <tr key={i}>
                    <td className="truncate px-5 py-3">{a.topic}</td>
                    <td className="py-3 text-right text-slate-500">{new Date(a.at).toLocaleDateString()}</td>
                    <td
                      className={`px-5 py-3 text-right font-medium tabular-nums ${
                        a.score / a.total >= 0.7 ? "text-mint" : "text-sunny"
                      }`}
                    >
                      {a.score}/{a.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Today&apos;s usage</h2>
          <div className="mt-4 space-y-3.5">
            {usageRows.map((r) => (
              <div key={r.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-600">{r.label}</span>
                  <span className="tabular-nums text-slate-500">
                    {r.used} / {r.max}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(100, (r.used / r.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
