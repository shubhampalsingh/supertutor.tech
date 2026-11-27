"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type PlanRow = {
  id: string;
  goal: string;
  targetDate: string | null;
  topicCount: number;
  mastered: number;
  nextStep: { kind: string; title?: string; reason: string };
};

const LEVELS = ["beginner", "some experience", "intermediate", "advanced"] as const;
const STYLES = ["examples", "analogies", "step-by-step", "concise summaries"] as const;

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanRow[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("beginner");
  const [hours, setHours] = useState(4);
  const [targetDate, setTargetDate] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("examples");
  const [syllabus, setSyllabus] = useState("");
  const [showSyllabus, setShowSyllabus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then(async (r) => {
        if (r.status === 401) {
          setSignedIn(false);
          return;
        }
        const d = await r.json();
        setPlans(d.plans ?? []);
      })
      .catch(() => setPlans([]));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy || goal.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim(),
          level,
          hoursPerWeek: hours,
          targetDate: targetDate || null,
          style,
          syllabus: syllabus.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/plan/${data.id}`);
    } catch {
      setError("Connection problem. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!signedIn) {
    return (
      <div className="card mx-auto mt-16 max-w-md p-8 text-center">
        <h1 className=" text-2xl font-semibold tracking-tight">Sign in to build a learning plan</h1>
        <p className="mt-2 text-slate-600">
          Plans, uploaded notes and your progress are saved to your account, so you need to sign in first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Study plans"
        title="Study plans"
        description="Describe what you want to learn. SuperTutor builds a topic roadmap, teaches each topic from your materials, checks understanding and adapts what comes next."
      />

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_420px]">
      <section className="order-2 lg:order-1">
      <h2 className="font-semibold">Your plans</h2>
      {plans === null ? (
        <p className="mt-3 text-sm text-slate-500">Loading…</p>
      ) : plans.length === 0 ? (
        <div className="card mt-3 border-dashed p-8 text-center text-sm text-slate-500">
          No plans yet. Create your first one with the form.
        </div>
      ) : (
        <ul className="card mt-3 divide-y divide-line">
          {plans.map((p) => (
            <li key={p.id}>
              <Link href={`/plan/${p.id}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{p.goal}</span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-500">
                      {p.mastered}/{p.topicCount} mastered
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${p.topicCount ? (p.mastered / p.topicCount) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="mt-2 truncate text-sm text-slate-500">
                    Next: {p.nextStep.title ? <span className="text-slate-700">{p.nextStep.title}</span> : null}{" "}
                    {p.nextStep.title ? "" : p.nextStep.reason}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      </section>

      <form onSubmit={create} className="card order-1 space-y-4 p-6 lg:order-2">
        <h2 className="font-semibold">New plan</h2>
        <label className="block">
          <span className="text-sm font-medium">Goal</span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="For example: pass my CN7050 Intelligent Systems exam"
            className="input mt-1.5"
            maxLength={300}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Current level</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as (typeof LEVELS)[number])}
              className="input mt-1.5 capitalize"
            >
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Explanation style</span>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as (typeof STYLES)[number])}
              className="input mt-1.5 capitalize"
            >
              {STYLES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Hours per week</span>
            <input
              type="number"
              min={1}
              max={60}
              value={hours}
              onChange={(e) => setHours(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
              className="input mt-1.5"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Target date (optional)</span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input mt-1.5"
            />
          </label>
        </div>
        {showSyllabus ? (
          <label className="block">
            <span className="text-sm font-medium">Syllabus or learning outcomes (optional)</span>
            <textarea
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              rows={5}
              maxLength={20000}
              placeholder="Paste topic lists, module outcomes or exam objectives"
              className="input mt-1.5"
            />
          </label>
        ) : (
          <button type="button" onClick={() => setShowSyllabus(true)} className="text-sm font-medium text-brand hover:underline">
            Add a syllabus or learning outcomes
          </button>
        )}
        {error && <p className="text-sm text-bubblegum">{error}</p>}
        <button disabled={busy || goal.trim().length < 3} className="btn-primary w-full py-2.5">
          {busy ? "Building your plan… this takes about 30 seconds" : "Create plan"}
        </button>
      </form>

      </div>
    </div>
  );
}
