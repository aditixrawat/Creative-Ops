import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "edge";

const MODEL_MAP: Record<string, string> = {
  "claude-sonnet-4-6": "claude-sonnet-4-6",
  "claude-opus-4-6":   "claude-opus-4-6",
};

export async function POST(req: NextRequest) {
  // Auth guard
  const sb   = await getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { prompt, model } = await req.json() as { prompt: string; model: string };
  if (!prompt?.trim()) return new Response("Empty prompt", { status: 400 });

  const claudeModel = MODEL_MAP[model] ?? "claude-sonnet-4-6";

  const client = new Anthropic();

  const stream = await client.messages.stream({
    model:      claudeModel,
    max_tokens: 1024,
    messages:   [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
    cancel() { stream.abort(); },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":  "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
