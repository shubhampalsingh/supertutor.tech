import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Camera,
  FileText,
  Layers,
  ListChecks,
  MessagesSquare,
  Quote,
  RefreshCw,
  ShieldCheck,
  Target,
} from "lucide-react";

const pillars = [
  {
    icon: Target,
    title: "A plan built around your goal",
    desc: "Enter what you need to learn, your current level, weekly hours and deadline. SuperTutor breaks it into topics in prerequisite order with clear objectives.",
  },
  {
    icon: FileText,
    title: "Grounded in your materials",
    desc: "Upload lecture notes or readings as PDF or text. Explanations and quiz feedback cite the exact passage, so you can check every claim.",
  },
  {
    icon: RefreshCw,
    title: "Adapts as you learn",
    desc: "Quiz results update a mastery estimate per topic. Strong results move you on; recurring mistakes trigger a different explanation and scheduled revision.",
  },
];

const steps = [
  { n: "01", title: "Set a goal", desc: "Goal, level, time available and target date." },
  { n: "02", title: "Add materials", desc: "Notes, slides as PDF, reading lists or a syllabus." },
  { n: "03", title: "Learn and practise", desc: "Lessons with citations, then a short topic quiz." },
  { n: "04", title: "Review gaps", desc: "Weak concepts and revision dates on your dashboard." },
];

const tools = [
  { href: "/tutor", icon: MessagesSquare, title: "Tutor", desc: "Ask questions and work through problems with guided hints." },
  { href: "/solve", icon: Camera, title: "Solve from a photo", desc: "Upload a problem and get a numbered, step-by-step walkthrough." },
  { href: "/quiz", icon: ListChecks, title: "Practice quizzes", desc: "Multiple-choice questions on any topic, with explanations." },
  { href: "/flashcards", icon: Layers, title: "Flashcards", desc: "Generated decks with spaced repetition scheduling." },
];

function ProductPreview() {
  const topics = [
    { t: "Variables and data types", m: 92, s: "Mastered", c: "text-mint bg-mint/10" },
    { t: "Control flow and loops", m: 64, s: "Needs practice", c: "text-sunny bg-sunny/10" },
    { t: "Functions and scope", m: 0, s: "Up next", c: "text-slate-600 bg-slate-100" },
  ];
  return (
    <div className="card overflow-hidden" aria-hidden>
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div>
          <div className="eyebrow">Study plan</div>
          <div className="text-sm font-semibold">Python for data analysis</div>
        </div>
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">1 of 6 mastered</span>
      </div>
      <ul className="divide-y divide-line">
        {topics.map((x) => (
          <li key={x.t} className="px-5 py-3.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium">{x.t}</span>
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${x.c}`}>{x.s}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand" style={{ width: `${x.m}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-line bg-slate-50 px-5 py-4 text-sm">
        <div className="flex items-start gap-2 text-slate-700">
          <Quote className="mt-0.5 h-4 w-4 shrink-0 text-sky" />
          <p>
            A <span className="font-medium">for</span> loop repeats a block once per item in a sequence
            <span className="ml-1 rounded bg-sky/10 px-1 text-xs font-semibold text-sky">S2</span>
          </p>
        </div>
        <div className="mt-1.5 pl-6 text-xs text-slate-500">Lecture 3 notes, page 4</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <section className="grid items-center gap-12 pt-16 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div>
          <p className="eyebrow text-brand">Personal learning assistant</p>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Study from your own course materials, with a plan that adapts to you.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
            SuperTutor turns a learning goal into a structured plan, explains each topic using the notes you
            upload, checks understanding with short quizzes, and decides what you should study next.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/plan" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5">
              Create a study plan <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/tutor" className="btn-secondary inline-flex items-center px-5 py-2.5">
              Try the tutor
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            The tutor works without an account. Sign in with Google to save plans, materials and progress.
          </p>
        </div>
        <ProductPreview />
      </section>

      <section className="border-t border-line py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-16">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="card p-5">
              <div className="font-mono text-sm text-slate-400">{s.n}</div>
              <div className="mt-2 font-semibold">{s.title}</div>
              <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Study tools</h2>
            <p className="mt-1 text-slate-600">Use them on their own, or alongside a study plan.</p>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ href, icon: Icon, title, desc }) => (
            <Link key={href} href={href} className="card group p-5 transition-colors hover:border-slate-300">
              <Icon className="h-5 w-5 text-slate-500 group-hover:text-brand" />
              <div className="mt-3 font-semibold">{title}</div>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="flex gap-4">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-mint" />
            <div>
              <h2 className="text-lg font-semibold">Transparent by design</h2>
              <p className="mt-2 leading-relaxed text-slate-600">
                Course-specific answers show their sources. When something isn&apos;t covered by your materials, the
                tutor says so. You can report errors or ask for another explanation at any point.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <BookOpenCheck className="mt-1 h-6 w-6 shrink-0 text-brand" />
            <div>
              <h2 className="text-lg font-semibold">Supports learning, not shortcuts</h2>
              <p className="mt-2 leading-relaxed text-slate-600">
                For assessed work, SuperTutor focuses on explanation, practice and feedback. You stay in control of
                your goals, schedule and uploaded files, and can delete them at any time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card mt-4 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Start with a goal</h2>
          <p className="mt-1 text-slate-600">It takes about a minute to set up your first plan.</p>
        </div>
        <Link href="/plan" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5">
          Create a study plan <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
