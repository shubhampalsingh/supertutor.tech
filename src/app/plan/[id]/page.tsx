"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronLeft, FileText, Flag, Trash2, Upload } from "lucide-react";

type Topic = {
  id: string;
  order: number;
  title: string;
  summary: string;
  objectives: string[];
  estMinutes: number;
  milestone: string | null;
  status: "todo" | "learning" | "mastered" | "revise";
  mastery: number;
  attempts: number;
  weakConcepts: string[];
  nextReviewAt: string | null;
};
type Material = { id: string; title: string; kind: string; chars: number; createdAt: string; planId: string | null };
type NextStep = { kind: "review" | "reteach" | "learn" | "quiz" | "done"; topicId?: string; title?: string; reason: string };
type PlanData = {
  plan: {
    id: string;
    goal: string;
    level: string;
    hoursPerWeek: number;
    targetDate: string | null;
    style: string;
    summary: string;
    topics: Topic[];
  };
  materials: Material[];
  nextStep: NextStep;
};

const STATUS: Record<Topic["status"], { label: string; cls: string }> = {
  todo: { label: "Not started", cls: "bg-slate-100 text-slate-500" },
  learning: { label: "Learning", cls: "bg-sky/10 text-sky" },
  revise: { label: "Needs practice", cls: "bg-sunny/10 text-sunny" },
  mastered: { label: "Mastered", cls: "bg-mint/10 text-mint" },
};

const STEP_CTA: Record<NextStep["kind"], { label: string; mode: string }> = {
  learn: { label: "Start lesson", mode: "lesson" },
  reteach: { label: "Revisit this topic", mode: "reteach" },
  review: { label: "Review with a quiz", mode: "quiz" },
  quiz: { label: "Take the quiz", mode: "quiz" },
  done: { label: "", mode: "" },
};

export default function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<PlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/plans/${id}`);
    const d = await res.json();
    if (!res.ok) setError(d.error ?? "Couldn't load this plan.");
    else setData(d);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/plans/${id}`)
      .then(async (res) => {
        const d = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(d.error ?? "Couldn't load this plan.");
        else setData(d);
      })
      .catch(() => !cancelled && setError("Connection problem."));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function upload(file: File) {
    setUploading(true);
    setUploadMsg(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`/api/plans/${id}/materials`, { method: "POST", body: form });
      const d = await res.json();
      setUploadMsg(res.ok ? `Added “${d.material.title}”. Lessons and quizzes will now use it.` : d.error);
      if (res.ok) await load();
    } catch {
      setUploadMsg("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeMaterial(mid: string) {
    if (!window.confirm("Delete this material and its index?")) return;
    await fetch(`/api/materials/${mid}`, { method: "DELETE" });
    await load();
  }

  async function deletePlan() {
    if (!window.confirm("Delete this plan, its progress and its uploaded materials? This can't be undone.")) return;
    await fetch(`/api/plans/${id}`, { method: "DELETE" });
    router.push("/plan");
  }

  if (error) return <div className="card mx-auto mt-16 max-w-md p-8 text-center font-medium">{error}</div>;
  if (!data) return <div className="pt-20 text-center text-slate-500">Loading plan…</div>;

  const { plan, materials, nextStep } = data;
  const mastered = plan.topics.filter((t) => t.status === "mastered").length;
  const totalMin = plan.topics.reduce((n, t) => n + t.estMinutes, 0);
  const gaps = plan.topics.filter((t) => t.status === "revise" || t.weakConcepts.length > 0);

  return (
    <div>
      <div className="border-b border-line pt-8 pb-6">
        <Link href="/plan" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> Study plans
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{plan.goal}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{plan.summary}</p>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {[
            ["Level", plan.level.charAt(0).toUpperCase() + plan.level.slice(1)],
            ["Time", `${plan.hoursPerWeek} h/week`],
            ["Estimated total", `${Math.max(1, Math.round(totalMin / 60))} h`],
            ...(plan.targetDate ? [["Target", new Date(plan.targetDate).toLocaleDateString()]] : []),
            ["Style", plan.style.charAt(0).toUpperCase() + plan.style.slice(1)],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-1.5">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Roadmap</h2>
            <span className="text-sm tabular-nums text-slate-500">
              {mastered}/{plan.topics.length} mastered
            </span>
          </div>
          <ol className="card mt-3 divide-y divide-line">
            {plan.topics.map((t) => (
              <li key={t.id} className="p-5">
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line text-xs tabular-nums text-slate-500">
                    {t.status === "mastered" ? <Check className="h-3.5 w-3.5 text-mint" /> : t.order + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="font-medium">{t.title}</div>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS[t.status].cls}`}>
                        {STATUS[t.status].label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{t.summary}</p>
                    <ul className="mt-2 space-y-0.5 text-sm text-slate-500">
                      {t.objectives.map((o, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                          {o}
                        </li>
                      ))}
                    </ul>
                    {t.attempts > 0 && (
                      <div className="mt-3 max-w-sm">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Mastery</span>
                          <span className="tabular-nums">{Math.round(t.mastery * 100)}%</span>
                        </div>
                        <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${t.mastery >= 0.75 ? "bg-mint" : "bg-sunny"}`}
                            style={{ width: `${t.mastery * 100}%` }}
                          />
                        </div>
                        {t.nextReviewAt && (
                          <div className="mt-1 text-xs text-slate-500">
                            Next review {new Date(t.nextReviewAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link href={`/plan/${id}/topic/${t.id}?mode=lesson`} className="btn-secondary px-3 py-1.5 text-sm">
                        Lesson
                      </Link>
                      <Link href={`/plan/${id}/topic/${t.id}?mode=quiz`} className="btn-secondary px-3 py-1.5 text-sm">
                        Quiz
                      </Link>
                      <span className="ml-1 text-xs text-slate-400">~{t.estMinutes} min</span>
                      {t.milestone && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                          <Flag className="h-3.5 w-3.5" /> {t.milestone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-20">
          <div className="card p-5">
            <div className="eyebrow">Next step</div>
            {nextStep.kind === "done" ? (
              <p className="mt-2 text-sm text-slate-600">{nextStep.reason}</p>
            ) : (
              <>
                <div className="mt-2 font-semibold">{nextStep.title}</div>
                <p className="mt-1 text-sm text-slate-600">{nextStep.reason}</p>
                <Link
                  href={`/plan/${id}/topic/${nextStep.topicId}?mode=${STEP_CTA[nextStep.kind].mode}`}
                  className="btn-primary mt-4 flex items-center justify-center gap-1.5 py-2.5 text-sm"
                >
                  {STEP_CTA[nextStep.kind].label} <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
            <div className="mt-5 h-1.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(mastered / plan.topics.length) * 100}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              {mastered} of {plan.topics.length} topics mastered
            </div>
          </div>

          {gaps.length > 0 && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold">Knowledge gaps</h2>
              <ul className="mt-3 space-y-2.5">
                {gaps.map((t) => (
                  <li key={t.id} className="text-sm">
                    <Link href={`/plan/${id}/topic/${t.id}?mode=reteach`} className="font-medium hover:text-brand">
                      {t.title}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {t.weakConcepts.length ? t.weakConcepts.join(" · ") : "Needs another pass"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-sm font-semibold">Study materials</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Lessons and quizzes cite these. Upload only material you&apos;re permitted to use. PDF, TXT or MD, up to 10 MB.
            </p>
            {materials.length > 0 && (
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {materials.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate">{m.title}</span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {m.chars < 1000 ? `${m.chars} chars` : `${Math.round(m.chars / 1000)}k chars`}
                    </span>
                    <button
                      onClick={() => removeMaterial(m.id)}
                      aria-label={`Delete ${m.title}`}
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-bubblegum"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="btn-secondary mt-3 flex cursor-pointer items-center justify-center gap-1.5 py-2 text-sm">
              <Upload className="h-4 w-4" />
              {uploading ? "Reading and indexing…" : "Upload a file"}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                className="sr-only"
              />
            </label>
            {uploadMsg && <p className="mt-2 text-xs text-slate-600">{uploadMsg}</p>}
          </div>

          <button onClick={deletePlan} className="text-xs text-slate-400 hover:text-bubblegum">
            Delete this plan and its data
          </button>
        </aside>
      </div>
    </div>
  );
}
