import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, FALLBACK_BETA, FALLBACK_MODEL, MODEL } from "@/lib/anthropic";

type Effort = "low" | "medium" | "high";

export class AgentRefusal extends Error {}

/**
 * One structured-output call. The LLM handles language; callers validate the
 * result and do any scoring/scheduling in application code.
 */
export async function jsonCall<T>(opts: {
  system: string;
  user: Anthropic.Beta.BetaContentBlockParam[] | string;
  schema: Record<string, unknown>;
  effort?: Effort;
  maxTokens?: number;
}): Promise<T> {
  const stream = anthropic().beta.messages.stream({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 16000,
    betas: [FALLBACK_BETA],
    fallbacks: [{ model: FALLBACK_MODEL }],
    output_config: {
      effort: opts.effort ?? "medium",
      format: { type: "json_schema", schema: opts.schema },
    },
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const res = await stream.finalMessage();
  if (res.stop_reason === "refusal") throw new AgentRefusal("Request declined.");
  const text = res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text) as T;
}

/** Streams plain text to the browser; calls onDone with the full text. */
export function streamText(opts: {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
  effort?: Effort;
  onDone?: (full: string) => Promise<void> | void;
  headers?: Record<string, string>;
}): Response {
  const stream = anthropic().beta.messages.stream({
    model: MODEL,
    max_tokens: 16000,
    betas: [FALLBACK_BETA],
    fallbacks: [{ model: FALLBACK_MODEL }],
    output_config: { effort: opts.effort ?? "low" },
    system: opts.system,
    messages: opts.messages,
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" && !full) {
          full = "I can't help with that one. Let's get back to your learning plan.";
          controller.enqueue(encoder.encode(full));
        }
      } catch {
        controller.enqueue(encoder.encode("\n\nSomething went wrong. Please try again."));
      } finally {
        controller.close();
        if (full && opts.onDone) await Promise.resolve(opts.onDone(full)).catch(() => {});
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...(opts.headers ?? {}),
    },
  });
}
