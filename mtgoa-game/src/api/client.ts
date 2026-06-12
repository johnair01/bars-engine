/**
 * AI client configuration and transport.
 *
 * The three AI integration points (intake, NPC generation, resolution narrative)
 * are documented in the Migration Brief § AI Integration Points. This module is
 * the shared transport.
 *
 * SECURITY: This is a browser SPA. The Anthropic API key must NEVER ship to the
 * client, so these helpers POST to a same-origin backend endpoint that holds the
 * key and proxies to the Anthropic SDK server-side. When no endpoint is
 * configured, every call degrades gracefully to a deterministic local fallback
 * (the project's dual-track principle: the game must work without a model).
 *
 * MODEL: defaulted to claude-opus-4-8 (current most-capable Opus; the canonical
 * default). The Migration Brief references claude-sonnet-4 / Fable 5 — swap
 * AI_MODEL here if a different model is desired. The model id is sent to the
 * backend, which is responsible for the actual Anthropic SDK call.
 */

export const AI_MODEL = "claude-opus-4-8" as const;

/** Base path of the AI proxy backend. Empty string disables remote calls. */
export const AI_ENDPOINT: string =
  (import.meta.env?.VITE_AI_ENDPOINT as string | undefined) ?? "";

export const aiEnabled = (): boolean => AI_ENDPOINT.trim().length > 0;

export interface AiRequest {
  /** One of: "intake" | "npc-generator" | "resolution". */
  kind: string;
  system: string;
  /** Free-form structured input for the call. */
  input: unknown;
  model?: string;
}

/**
 * POST an AI request to the backend proxy. Returns parsed JSON of type T.
 * Throws if the backend is unreachable or returns a non-2xx — callers wrap this
 * and fall back to deterministic content.
 */
export async function callAi<T>(req: AiRequest): Promise<T> {
  if (!aiEnabled()) {
    throw new Error("AI endpoint not configured");
  }
  const res = await fetch(`${AI_ENDPOINT}/${req.kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: req.model ?? AI_MODEL, system: req.system, input: req.input }),
  });
  if (!res.ok) {
    throw new Error(`AI proxy ${req.kind} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}
