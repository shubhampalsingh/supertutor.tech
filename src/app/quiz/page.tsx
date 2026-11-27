"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type Question = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};
type Quiz = { quizId: string | null; title: string; questions: Question[] };

export default function QuizPage() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [current, setCurrent] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), difficulty, count }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Quiz generation failed. Please try again.");
        return;
      }
      setQuiz(data);
      setCurrent(0);
      setPicked(null);
      setAnswers([]);
      setScore(0);
      setDone(false);
    } catch {
      setError("Connection problem — try again.");
    } finally {
      setBusy(false);
    }
  }

  function pick(i: number) {
    if (picked !== null || !quiz) return;
    setPicked(i);
    if (i === quiz.questions[current].answerIndex) setScore((s) => s + 1);
    setAnswers((a) => [...a, i]);
  }

  async function next() {
    if (!quiz) return;
    if (current + 1 < quiz.questions.length) {
      setCurrent((c) => c + 1);
      setPicked(null);
    } else {
      setDone(true);
      if (quiz.quizId) {
        fetch("/api/quiz/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizId: quiz.quizId,
            score:
              score, // score already includes the last answer (pick ran before next)
            total: quiz.questions.length,
            answers,
          }),
        }).catch(() => {});
      }
    }
  }

  const q = quiz?.questions[current];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Practice"
        title="Practice quiz"
        description="Generate multiple-choice questions on any topic. For quizzes that track mastery against your course materials, use a study plan."
      />

      {!quiz && (
        <form onSubmit={generate} className="card animate-pop mt-6 space-y-5 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">What do you want a quiz on?</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="For example: photosynthesis, or SQL joins"
              className="input"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Difficulty</label>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`rounded-md border px-3.5 py-1.5 text-sm font-medium capitalize ${
                      difficulty === d
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Questions</label>
              <div className="flex gap-2">
                {[5, 8, 10].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setCount(n)}
                    className={`rounded-md border px-3.5 py-1.5 text-sm font-medium ${
                      count === n
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-sunny/30 bg-sunny/5 px-4 py-2 text-sm">
              {error}
            </div>
          )}
          <button disabled={busy || !topic.trim()} className="btn-primary w-full py-2.5">
            {busy ? "Generating questions…" : "Generate quiz"}
          </button>
        </form>
      )}

      {quiz && !done && q && (
        <div className="card animate-pop mt-6 p-6" key={current}>
          <div className="mb-3 flex items-center justify-between text-sm font-bold text-slate-500">
            <span>{quiz.title}</span>
            <span>
              {current + 1} / {quiz.questions.length}
            </span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
          <h2 className="text-xl font-bold">{q.question}</h2>
          <div className="mt-4 space-y-2">
            {q.options.map((opt, i) => {
              let style = "border-line bg-white hover:border-slate-400";
              if (picked !== null) {
                if (i === q.answerIndex) style = "border-mint bg-mint/10";
                else if (i === picked) style = "border-bubblegum bg-bubblegum/10";
                else style = "border-line bg-white opacity-60";
              }
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={picked !== null}
                  className={`block w-full rounded-lg border px-4 py-3 text-left font-medium transition ${style}`}
                >
                  <span className="mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                  {picked !== null && i === q.answerIndex && <Check className="ml-2 inline h-4 w-4 text-mint" />}
                  {picked !== null && i === picked && i !== q.answerIndex && <X className="ml-2 inline h-4 w-4 text-bubblegum" />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="animate-pop mt-4 rounded-lg border border-line bg-slate-50 px-4 py-3 text-slate-700">
              <span className="font-bold">{picked === q.answerIndex ? "Correct." : "Incorrect."}</span>{" "}
              {q.explanation}
            </div>
          )}
          {picked !== null && (
            <button onClick={next} className="btn-primary mt-4 w-full py-3">
              {current + 1 < quiz.questions.length ? "Next question →" : "See results"}
            </button>
          )}
        </div>
      )}

      {quiz && done && (
        <div className="card animate-pop mt-6 p-8 text-center">
          
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            {score} / {quiz.questions.length}
          </h2>
          <p className="mt-1 text-slate-600">
            {score === quiz.questions.length
              ? "Every question correct."
              : score >= quiz.questions.length / 2
                ? "Good result. Review the explanations for the ones you missed."
                : "Review the explanations, then try again."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={() => {
                setQuiz(null);
                setTopic("");
              }}
              className="btn-primary px-6 py-2.5"
            >
              New quiz
            </button>
            <button
              onClick={() => {
                setCurrent(0);
                setPicked(null);
                setAnswers([]);
                setScore(0);
                setDone(false);
              }}
              className="btn-secondary px-6 py-2.5"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
