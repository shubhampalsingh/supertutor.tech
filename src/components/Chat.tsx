"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, MessagesSquare, X } from "lucide-react";
import { encodeImage, type EncodedImage } from "@/lib/clientImage";

type Msg = {
  role: "user" | "assistant";
  content: string;
  image?: { mediaType: "image/jpeg"; data: string };
  previewUrl?: string;
};

const SUBJECTS = ["Math", "Science", "English", "History", "Coding", "Languages"];

export function Chat({
  mode,
  greeting,
  placeholder,
  allowSubjects = true,
  initialImage,
}: {
  mode: "tutor" | "solve";
  greeting: string;
  placeholder: string;
  allowSubjects?: boolean;
  initialImage?: EncodedImage | null;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState<string | undefined>();
  const [pendingImage, setPendingImage] = useState<EncodedImage | null>(
    initialImage ?? null
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string, image: EncodedImage | null) {
    if ((!text.trim() && !image) || busy) return;
    setError(null);
    setBusy(true);

    const userMsg: Msg = {
      role: "user",
      content: text.trim(),
      ...(image
        ? {
            image: { mediaType: image.mediaType, data: image.data },
            previewUrl: image.previewUrl,
          }
        : {}),
    };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setPendingImage(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: chatIdRef.current ?? undefined,
          mode,
          subject,
          messages: history.map((m) => ({
            role: m.role,
            content: m.content,
            image: m.image,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMessages(history);
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      const newChatId = res.headers.get("x-chat-id");
      if (newChatId) chatIdRef.current = newChatId;

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages([...history, { role: "assistant", content: snapshot }]);
      }
    } catch {
      setMessages(history);
      setError("Connection lost. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPendingImage(await encodeImage(file));
    } catch {
      setError("Couldn't read that image. Try another file.");
    }
    e.target.value = "";
  }

  return (
    <div className="flex h-[calc(100dvh-180px)] min-h-[420px] flex-col">
      {allowSubjects && messages.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <button
              key={s}
              onClick={() => setSubject(subject === s ? undefined : s)}
              className={`rounded-md border px-3 py-1 text-sm font-medium transition ${
                subject === s
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="card flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <MessagesSquare className="h-5 w-5" />
            </span>
            <p className="mt-3 max-w-sm whitespace-pre-line text-sm text-slate-600">{greeting}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`animate-pop flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 ${
                m.role === "user" ? "bubble-user" : "bubble-ai"
              }`}
            >
              {m.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.previewUrl}
                  alt="uploaded problem"
                  className="mb-2 max-h-52 rounded-xl"
                />
              )}
              <div className="whitespace-pre-wrap">
                {m.content ||
                  (m.role === "assistant" && busy && i === messages.length - 1 ? (
                    <span className="text-slate-400">Thinking…</span>
                  ) : (
                    m.content
                  ))}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="animate-pop mt-2 rounded-lg border border-sunny/30 bg-sunny/5 px-4 py-2 text-sm text-slate-700">
          {error}
        </div>
      )}

      {pendingImage && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pendingImage.previewUrl} alt="preview" className="h-12 rounded-lg" />
          <span className="text-sm text-slate-600">Photo attached</span>
          <button
            onClick={() => setPendingImage(null)}
            className="ml-auto rounded-md p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form
        className="mt-2 flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(input, pendingImage);
        }}
      >
        <input type="file" accept="image/*" hidden ref={fileRef} onChange={onPickFile} />
        <button
          type="button"
          title="Attach a photo"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach a photo"
          className="btn-secondary flex h-[42px] w-[42px] shrink-0 items-center justify-center"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="input min-w-0 flex-1"
        />
        <button type="submit" disabled={busy || (!input.trim() && !pendingImage)} className="btn-primary h-[42px] px-5">
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
