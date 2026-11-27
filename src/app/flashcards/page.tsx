"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

type CardT = { id?: string; front: string; back: string };
type DeckSummary = {
  id: string;
  title: string;
  topic: string;
  cardCount: number;
  dueCount: number;
};

export default function FlashcardsPage() {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<DeckSummary[]>([]);

  // Study state
  const [studyTitle, setStudyTitle] = useState<string | null>(null);
  const [cards, setCards] = useState<CardT[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    fetch("/api/decks")
      .then((r) => r.json())
      .then((d) => setDecks(d.decks ?? []))
      .catch(() => {});
  }, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), count }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Deck generation failed. Please try again.");
        return;
      }
      if (data.deckId) {
        const full = await fetch(`/api/decks/${data.deckId}`).then((r) => r.json());
        startStudy(data.title, full.deck?.cards ?? data.cards);
        setDecks((d) => [
          {
            id: data.deckId,
            title: data.title,
            topic: topic.trim(),
            cardCount: data.cards.length,
            dueCount: data.cards.length,
          },
          ...d,
        ]);
      } else {
        startStudy(data.title, data.cards);
      }
      setTopic("");
    } catch {
      setError("Connection problem. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function startStudy(title: string, deckCards: CardT[]) {
    setStudyTitle(title);
    setCards(deckCards);
    setIdx(0);
    setFlipped(false);
  }

  async function openDeck(id: string) {
    const data = await fetch(`/api/decks/${id}`).then((r) => r.json());
    if (data.deck) startStudy(data.deck.title, data.deck.cards);
  }

  async function rate(rating: "again" | "good" | "easy") {
    const card = cards[idx];
    if (card.id) {
      fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: card.id, rating }),
      }).catch(() => {});
    }
    if (idx + 1 < cards.length) {
      setIdx(idx + 1);
      setFlipped(false);
    } else {
      setStudyTitle(null);
      setCards([]);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Flashcards"
        title="Flashcards"
        description="Generate a deck on any topic. Rating each card schedules its next review using spaced repetition."
      />

      {studyTitle && cards.length > 0 ? (
        <div className="animate-pop mt-6">
          <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-500">
            <span>{studyTitle}</span>
            <span>
              {idx + 1} / {cards.length}
            </span>
          </div>
          <button
            onClick={() => setFlipped(!flipped)}
            className="card flex min-h-64 w-full items-center justify-center p-8 text-center transition hover:border-slate-300"
          >
            <div>
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                {flipped ? "Answer" : "Question · click to reveal"}
              </div>
              <div className="text-xl font-medium">
                {flipped ? cards[idx].back : cards[idx].front}
              </div>
            </div>
          </button>
          {flipped ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => rate("again")}
                className="btn-secondary py-2.5"
              >
                Again
              </button>
              <button
                onClick={() => rate("good")}
                className="btn-secondary py-2.5"
              >
                Good
              </button>
              <button
                onClick={() => rate("easy")}
                className="btn-secondary py-2.5"
              >
                Easy
              </button>
            </div>
          ) : (
            <p className="mt-4 text-center text-sm text-slate-500">
              Recall the answer, then click the card to check.
            </p>
          )}
          <button
            onClick={() => {
              setStudyTitle(null);
              setCards([]);
            }}
            className="mx-auto mt-4 block text-sm font-bold text-slate-400 hover:text-slate-600"
          >
            ← Back to decks
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={generate} className="card animate-pop mt-6 space-y-5 p-6">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Topic</label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="For example: French irregular verbs"
                className="input"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="mr-1 text-sm font-medium">Cards</label>
              {[5, 10, 15, 20].map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setCount(n)}
                  className={`rounded-md border px-3.5 py-1.5 text-sm font-medium ${
                    count === n
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-slate-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {error && (
              <div className="rounded-lg border border-sunny/30 bg-sunny/5 px-4 py-2 text-sm">
                {error}
              </div>
            )}
            <button disabled={busy || !topic.trim()} className="btn-primary w-full py-2.5">
              {busy ? "Generating cards…" : "Create deck"}
            </button>
          </form>

          {decks.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-semibold">Your decks</h2>
              <div className="space-y-2">
                {decks.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => openDeck(d.id)}
                    className="card flex w-full items-center gap-3 p-4 text-left transition hover:border-slate-300"
                  >
                    <Layers className="h-5 w-5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{d.title}</div>
                      <div className="text-sm text-slate-500">{d.cardCount} cards</div>
                    </div>
                    {d.dueCount > 0 && (
                      <span className="ml-auto rounded-md bg-sunny/10 px-2 py-0.5 text-xs font-medium text-sunny">
                        {d.dueCount} due
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
