"use client";

import { Fragment, type ReactNode } from "react";

/**
 * Small, safe Markdown renderer for tutor output (no raw HTML).
 * Supports headings, bullet/numbered lists, bold, italics, inline code,
 * fenced code blocks and citation chips like [S1].
 */
export function Markdown({ text, onCite }: { text: string; onCite?: (ref: string) => void }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={key++} className="my-3 overflow-x-auto rounded-xl bg-ink/90 p-3 text-sm text-cream">
          <code>{code.join("\n")}</code>
        </pre>
      );
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const size = h[1].length <= 2 ? "text-xl" : "text-lg";
      blocks.push(
        <h3 key={key++} className={`${size} mt-4 mb-1 font-semibold tracking-tight`}>
          {inline(h[2], onCite)}
        </h3>
      );
      i++;
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        i++;
      }
      const cls = `my-2 space-y-1 pl-6 ${ordered ? "list-decimal" : "list-disc"}`;
      const children = items.map((it, j) => <li key={j}>{inline(it, onCite)}</li>);
      blocks.push(ordered ? <ol key={key++} className={cls}>{children}</ol> : <ul key={key++} className={cls}>{children}</ul>);
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,4}\s|```|\s*([-*]|\d+\.)\s+)/.test(lines[i])) {
      para.push(lines[i++]);
    }
    blocks.push(
      <p key={key++} className="my-2 leading-relaxed">
        {inline(para.join(" "), onCite)}
      </p>
    );
  }
  return <div>{blocks}</div>;
}

function inline(text: string, onCite?: (ref: string) => void): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[S\d+\](?:\s*\[S\d+\])*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code key={i} className="rounded bg-slate-100 px-1 text-[0.9em]">
          {p.slice(1, -1)}
        </code>
      );
    if (/^\[S\d+\]/.test(p)) {
      const refs = p.match(/S\d+/g) ?? [];
      return (
        <Fragment key={i}>
          {refs.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onCite?.(r)}
              className="mx-0.5 rounded-lg bg-sky/15 px-1.5 text-xs font-bold text-sky hover:bg-sky/25"
              title="Show source"
            >
              {r}
            </button>
          ))}
        </Fragment>
      );
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}
