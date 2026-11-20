# 🦸 SuperTutor — supertutor.tech

A playful AI tutor for students of every age, powered by Claude.

**Features**

- 🗺️ **Personal learning plan (agentic loop)** — enter a goal, level, weekly hours and target date; the planner builds a roadmap, the tutor teaches each topic from your own uploaded notes with citations, topic quizzes update a mastery estimate, and the orchestrator decides whether you move on, get a different explanation, or revise later.
- 📚 **Study materials** — upload PDFs, .txt or .md notes. They are validated, split into passages and indexed with Postgres full-text search; lessons and quiz explanations cite them as [S1], [S2]…
- 🧩 **Knowledge-gap tracking** — recurring mistakes are tracked per concept and shown on the plan and dashboard, with spaced revision dates.
- 💬 **AI Chat Tutor** — Socratic, adaptive tutoring that guides students to answers instead of handing them over. Subject modes, streaming responses, saved history for signed-in users.
- 📸 **Photo Problem Solver** — snap a homework problem, get a numbered step-by-step walkthrough (Claude vision), then ask follow-ups.
- 🎯 **Quiz Generator** — instant multiple-choice quizzes on any topic with friendly explanations; scores are saved.
- 🃏 **Flashcards** — auto-generated decks with lightweight SM-2 spaced repetition (Again / Good / Easy).
- 🔥 **Progress** — XP, daily streaks, usage meters, and recent quiz results on the dashboard.
- 🔐 **Auth & free tier** — works instantly for guests (small daily limit), Google sign-in unlocks bigger limits + saved history. Limits are in `src/lib/limits.ts`.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · NextAuth v5 (Google) · Prisma + Postgres · Claude API (`claude-opus-5-5` by default, configurable via `ANTHROPIC_MODEL`) · `unpdf` for PDF text extraction.

---

## Local development

```bash
npm install
cp .env.example .env        # then fill in the values (see below)
npx prisma db push          # creates tables in your Postgres DB
npm run dev                 # http://localhost:3000
```

## Environment variables

| Variable | Where to get it |
|---|---|
| `ANTHROPIC_API_KEY` | https://platform.claude.com → API keys |
| `ANTHROPIC_MODEL` | *(optional)* defaults to `claude-opus-5-5`; use `claude-sonnet-5-5` for cheaper high-volume traffic |
| `ANTHROPIC_FALLBACK_MODEL` | *(optional)* model the API retries on if the main model declines a request; defaults to `claude-opus-4-8` |
| `DATABASE_URL` | Free Postgres from [Neon](https://neon.tech) (or Vercel Postgres / Supabase) |
| `AUTH_SECRET` | `npx auth secret` or `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client (Web). Add redirect URIs: `https://supertutor.tech/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google` |

## Deploy to Vercel + supertutor.tech

1. Push this repo to GitHub and import it at https://vercel.com/new.
2. Add all the environment variables above in Vercel → Project → Settings → Environment Variables.
3. Deploy. The Prisma client is generated automatically on install.
4. Run the schema against your production DB once: `npx prisma db push` (with the production `DATABASE_URL` in your shell), or use Neon's SQL editor.
5. Point the domain: Vercel → Project → Settings → Domains → add `supertutor.tech`, then set the DNS records Vercel shows you at your registrar (usually an `A` record to `76.76.21.21` and `CNAME www → cname.vercel-dns.com`).
6. Update the Google OAuth redirect URI to the production domain.

## Agent architecture (Week 2 design → code)

Everything runs as Next.js route handlers. The LLM does language work; application code does scoring, scheduling and permissions.

| Agent in the design | Where it lives |
|---|---|
| Orchestrator / Learning Coordinator | `chooseNextStep()` in `src/lib/agents/progress.ts`, called by the plan and grade routes |
| Learner Profiling | stated goal/level/time/style feed `buildPlan()`; quiz history feeds mastery and weak concepts |
| Study Material Retrieval | `src/lib/agents/retrieval.ts` (validation, PDF text extraction, chunking, Postgres full-text search) |
| Learning Planner | `src/lib/agents/planner.ts` |
| Teaching | `src/lib/agents/teaching.ts` + `api/plans/[id]/topics/[topicId]/teach` (lesson, re-explain, follow-up) |
| Assessment | `src/lib/agents/assessment.ts` (LLM writes questions; `gradeQuiz()` scores in code) |
| Progress and Revision | `applyAssessment()` / `nextReviewDate()` in `src/lib/agents/progress.ts` |
| Quality and Safety | grounding rules in `teaching.ts`, citation checks in `assessment.ts`, learner error reports via `api/feedback` |

Learning loop: goal → plan → upload materials → lesson (cites sources) → topic quiz → grade → update mastery/weak concepts/review date → next step (advance, re-explain, or revise).

Learners control their data: plans and materials can be deleted from the plan page (deletes cascade to topics and indexed passages). All plan routes check ownership by user id.

## Notes

- Guests are rate-limited via a signed cookie; signed-in users via the `UsageDay` table. Tune limits in `src/lib/limits.ts`.
- All AI calls live in `src/app/api/{chat,quiz,flashcards}/route.ts`; prompts in `src/lib/anthropic.ts`.
- Chat streams plain text chunks; the client reads them incrementally (`src/components/Chat.tsx`).
