"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Markdown } from "@/components/Markdown";
import { ArrowRight, ChevronLeft, Flag, HelpCircle, ThumbsUp, X } from "lucide-react";

type Source = { ref: string; title: string; page: number | null; snippet: string };
type Msg = { role: "user" | "assistant"; content: string; sources?: Source[] };
type Mode = "lesson" | "reteach" | "quiz";
type TopicInfo = { id: string; title: string; summary: string; objectives: string[]; status: string; mastery: number };

export default function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; topicId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { id, topicId } = use(params);
  const sp = use(searchParams);
  const router = useRouter();
  const initial: Mode = sp.mode === "quiz" ? "quiz" : sp.mode === "reteach" ? "reteach" : "lesson";
  const [mode, setMode] = useState<Mode>(initial);
  const [topic, setTopic] = useState<TopicInfo | null>(null);
  const [goal, setGoal] = useState("");

  useEffect(() => {
    fetch(`/api/plans/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setGoal(d.plan?.goal ?? "");
        setTopic(d.plan?.topics.find((t: TopicInfo) => t.id === topicId) ?? null);
      })
      .catch(() => {});
  }, [id, topicId]);

  function switchMode(m: Mode) {
    setMode(m);
    router.replace(`/plan/${id}/topic/${topicId}?mode=${m}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="border-b border-line pt-8">
      <Link href={`/plan/${id}`} className="inline-flex max-w-full items-center gap-1 truncate text-sm text-slate-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4 shrink-0" /> <span className="truncate">{goal || "Back to plan"}</span>
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{topic?.title ?? "…"}</h1>
      {topic && <p className="mt-2 text-slate-600">{topic.summary}</p>}
      <div className="mt-6 flex gap-6" role="tablist">
        {(["lesson", "quiz"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            role="tab"
            aria-selected={mode === m || (m === "lesson" && mode === "reteach")}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              (mode === m || (m === "lesson" && mode === "reteach")) ? "border-brand text-ink" : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {m === "quiz" ? "Check understanding" : "Lesson"}
          </button>
        ))}
      </div>
      </div>
      {mode === "quiz" ? (
        <TopicQuiz key="quiz" planId={id} topicId={topicId} onReteach={() => switchMode("reteach")} />
      ) : (
        <Lesson key={mode} planId={id} topicId={topicId} mode={mode} onQuiz={() => switchMode("quiz")} onReteach={() => switchMode("reteach")} />
      )}
    </div>
  );
}

function decodeSources(h: string | null): Source[] {
  if (!h) return [];
  try {
    const b64 = h.replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    return JSON.parse(json);
  } catch {
    return [];
  }
}

function Lesson({
  planId,
  topicId,
  mode,
  onQuiz,
  onReteach,
}: {
  planId: string;
  topicId: string;
  mode: "lesson" | "reteach";
  onQuiz: () => void;
  onReteach: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);
  const started = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);

  const run = useCallback(
    async (kind: "lesson" | "reteach" | "followup", history: Msg[]) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/plans/${planId}/topics/${topicId}/teach`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: kind,
            messages: kind === "followup" ? history.map(({ role, content }) => ({ role, content })) : [],
          }),
        });
        if (!res.ok || !res.body) {
          const d = await res.json().catch(() => ({}));
          setError(d.error ?? "Something went wrong.");
          return;
        }
        const sources = decodeSources(res.headers.get("x-sources"));
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let text = "";
        setMsgs([...history, { role: "assistant", content: "", sources }]);
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          text += dec.decode(value, { stream: true });
          setMsgs([...history, { role: "assistant", content: text, sources }]);
        }
      } catch {
        setError("Connection problem. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [planId, topicId]
  );

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run(mode, []);
  }, [mode, run]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs.length]);

  function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || busy) return;
    setInput("");
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(history);
    run("followup", history);
  }

  async function sendFeedback(kind: "error" | "unclear" | "helpful" | "not_helpful", excerpt: string) {
    let note: string | undefined;
    if (kind === "error") {
      note = window.prompt("What looks wrong? (optional)") ?? undefined;
    }
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId, kind, note, excerpt: excerpt.slice(0, 4000) }),
    }).catch(() => {});
    setFeedbackSent(kind === "error" ? "Thanks, the error report was saved." : "Thanks for the feedback.");
    if (kind === "unclear") onReteach();
  }

  return (
    <div className="mt-6">
      {mode === "reteach" && (
        <div className="mb-4 rounded-lg border border-sunny/20 bg-sunny/5 px-4 py-2.5 text-sm text-slate-700">
          A different explanation, focused on the concepts you found difficult.
        </div>
      )}
      <div className="space-y-4">
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="bubble-user ml-auto max-w-[85%] px-4 py-2.5">
              {m.content}
            </div>
          ) : (
            <div key={i} className="card p-6 leading-relaxed">
              {m.content ? (
                <Markdown
                  text={m.content}
                  onCite={(r) => setOpenSource(m.sources?.find((s) => s.ref === r) ?? null)}
                />
              ) : (
                <span className="text-sm text-slate-500">Preparing the lesson…</span>
              )}
              {m.sources && m.sources.length > 0 && m.content && (
                <details className="mt-5 rounded-lg border border-line bg-slate-50 p-3 text-sm">
                  <summary className="cursor-pointer font-medium text-slate-700">Sources from your materials ({m.sources.length})</summary>
                  <ul className="mt-2 space-y-2">
                    {m.sources.map((s) => (
                      <li key={s.ref}>
                        <span className="font-medium">[{s.ref}]</span> {s.title}
                        {s.page ? `, p. ${s.page}` : ""}
                        <div className="text-slate-600">“{s.snippet}…”</div>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {m.sources && m.sources.length === 0 && m.content && !busy && (
                <p className="mt-3 text-xs text-slate-400">
                  No uploaded materials matched this topic, so this explanation is from general knowledge.
                </p>
              )}
              {i === msgs.length - 1 && m.content && !busy && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4 text-sm">
                  <button onClick={() => sendFeedback("helpful", m.content)} className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 font-medium">
                    <ThumbsUp className="h-3.5 w-3.5" /> Helpful
                  </button>
                  <button onClick={() => sendFeedback("unclear", m.content)} className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 font-medium">
                    <HelpCircle className="h-3.5 w-3.5" /> Explain differently
                  </button>
                  <button onClick={() => sendFeedback("error", m.content)} className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 font-medium">
                    <Flag className="h-3.5 w-3.5" /> Report an error
                  </button>
                </div>
              )}
            </div>
          )
        )}
      </div>
      {feedbackSent && <p className="mt-2 text-sm text-mint">{feedbackSent}</p>}
      {error && <p className="mt-3 font-medium text-bubblegum">{error}</p>}

      {openSource && (
        <div className="card mt-4 p-4 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">
              [{openSource.ref}] {openSource.title}
              {openSource.page ? `, page ${openSource.page}` : ""}
            </span>
            <button onClick={() => setOpenSource(null)} aria-label="Close source" className="rounded p-0.5 text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-slate-600">“{openSource.snippet}…”</p>
        </div>
      )}

      <form onSubmit={ask} className="mt-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question…"
          className="input flex-1"
          disabled={busy}
        />
        <button disabled={busy || !input.trim()} className="btn-primary px-5 text-sm">Ask</button>
      </form>
      <div className="card mt-6 flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
        <div>
          <div className="font-medium">Ready to check your understanding?</div>
          <div className="text-sm text-slate-500">A short quiz updates your mastery estimate for this topic.</div>
        </div>
        <button onClick={onQuiz} disabled={busy} className="btn-primary inline-flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm">
          Take the quiz <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      <div ref={endRef} />
    </div>
  );
}

type QItem = { question: string; options: string[] };
type Result = {
  correct: boolean;
  picked: number;
  answerIndex: number;
  explanation: string;
  concept: string;
  source: { ref: string; title: string; page: number | null; snippet: string } | null;
};
type GradeResp = {
  score: number;
  total: number;
  results: Result[];
  outcome: { mastery: number; status: string; nextReviewAt: string; weakConcepts: string[]; decision: "advance" | "reteach" };
  nextStep: { kind: string; topicId?: string; title?: string; reason: string };
};

function TopicQuiz({ planId, topicId, onReteach }: { planId: string; topicId: string; onReteach: () => void }) {
  const [quiz, setQuiz] = useState<{ quizId: string; difficulty: string; questions: QItem[] } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [grade, setGrade] = useState<GradeResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const generate = useCallback(async () => {
    setBusy(true);
    setError(null);
    setGrade(null);
    setQuiz(null);
    try {
      const res = await fetch(`/api/plans/${planId}/topics/${topicId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Quiz generation failed.");
      else {
        setQuiz(d);
        setAnswers(d.questions.map(() => -1));
      }
    } catch {
      setError("Connection problem.");
    } finally {
      setBusy(false);
    }
  }, [planId, topicId]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    generate();
  }, [generate]);

  async function submit() {
    if (!quiz) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/plans/${planId}/topics/${topicId}/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.quizId, answers }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Grading failed.");
      else setGrade(d);
    } catch {
      setError("Connection problem.");
    } finally {
      setBusy(false);
    }
  }

  if (busy && !quiz) return <p className="mt-8 text-center text-slate-500">Writing questions from your materials…</p>;
  if (error && !quiz) return (
    <div className="mt-8 text-center">
      <p className="font-medium text-bubblegum">{error}</p>
      <button onClick={generate} className="btn-primary mt-3 px-5 py-2">Try again</button>
    </div>
  );
  if (!quiz) return null;

  return (
    <div className="mt-6 space-y-4">
      <p className="text-sm text-slate-500">
        {quiz.questions.length} questions · <span className="capitalize">{quiz.difficulty}</span> difficulty, adjusted to your current mastery
      </p>
      {quiz.questions.map((q, i) => {
        const r = grade?.results[i];
        return (
          <div key={i} className="card p-5">
            <div className="flex gap-3 font-medium">
              <span className="tabular-nums text-slate-400">{i + 1}.</span>
              <span>{q.question}</span>
            </div>
            <div className="mt-3 grid gap-2">
              {q.options.map((o, j) => {
                const picked = answers[i] === j;
                let cls = "border-line hover:bg-slate-50";
                if (r) {
                  if (j === r.answerIndex) cls = "border-mint bg-mint/10";
                  else if (picked) cls = "border-bubblegum bg-bubblegum/10";
                  else cls = "border-line opacity-60";
                } else if (picked) cls = "border-brand bg-brand/5 ring-1 ring-brand";
                return (
                  <button
                    key={j}
                    disabled={!!grade}
                    onClick={() => setAnswers((a) => a.map((x, k) => (k === i ? j : x)))}
                    className={`flex items-start gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${cls}`}
                  >
                    <span className="font-medium text-slate-400">{String.fromCharCode(65 + j)}</span>
                    <span>{o}</span>
                  </button>
                );
              })}
            </div>
            {r && (
              <div className={`mt-3 rounded-lg border-l-2 bg-slate-50 p-3 text-sm ${r.correct ? "border-mint" : "border-bubblegum"}`}>
                <span className={`font-medium ${r.correct ? "text-mint" : "text-bubblegum"}`}>{r.correct ? "Correct." : "Incorrect."}</span> {r.explanation}
                <div className="mt-1 text-xs text-slate-500">Concept: {r.concept}</div>
                {r.source && (
                  <div className="mt-2 text-xs text-slate-600">
                    From [{r.source.ref}] {r.source.title}
                    {r.source.page ? `, p. ${r.source.page}` : ""}: “{r.source.snippet.slice(0, 200)}…”
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {error && <p className="font-medium text-bubblegum">{error}</p>}
      {!grade ? (
        <button onClick={submit} disabled={busy || answers.some((a) => a < 0)} className="btn-primary w-full py-2.5">
          {busy ? "Checking…" : answers.some((a) => a < 0) ? "Answer every question to submit" : "Submit answers"}
        </button>
      ) : (
        <div className="card p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">Result</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
                {grade.score}/{grade.total}
              </div>
            </div>
            <div className="text-right">
              <div className="eyebrow">Mastery estimate</div>
              <div className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{Math.round(grade.outcome.mastery * 100)}%</div>
            </div>
          </div>
          {grade.outcome.decision === "advance" ? (
            <p className="mt-4 text-sm text-slate-700">
              <span className="font-medium text-mint">Topic mastered.</span> A review is scheduled for{" "}
              {new Date(grade.outcome.nextReviewAt).toLocaleDateString()}.
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-700">
              <span className="font-medium text-sunny">More practice recommended.</span>
              {grade.outcome.weakConcepts.length ? ` Focus on: ${grade.outcome.weakConcepts.join(", ")}.` : ""}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-5">
            {grade.outcome.decision === "reteach" && (
              <button onClick={onReteach} className="btn-primary px-4 py-2 text-sm">Revisit the lesson</button>
            )}
            {grade.nextStep.kind !== "done" && grade.nextStep.topicId && grade.nextStep.topicId !== topicId && (
              <Link href={`/plan/${planId}/topic/${grade.nextStep.topicId}?mode=${grade.nextStep.kind === "learn" ? "lesson" : grade.nextStep.kind === "reteach" ? "reteach" : "quiz"}`} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-sm">
                Next: {grade.nextStep.title} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button onClick={generate} className="btn-secondary px-4 py-2 text-sm">New quiz</button>
            <Link href={`/plan/${planId}`} className="btn-secondary px-4 py-2 text-sm">Back to plan</Link>
          </div>
        </div>
      )}
    </div>
  );
}
