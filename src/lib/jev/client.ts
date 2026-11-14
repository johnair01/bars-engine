/**
 * TypeSafe's Jev through the Vercel AI Gateway: typed questions about a piece of text, answered with probabilities.
 * Jev never writes text. It picks, scores and checks (council positions jev-select-only, jev-candidates-only).
 *
 * Why a plain fetch and not the AI SDK: the gateway serves Jev from `ai` 7 (`experimental_decide`), and bars-engine is
 * on `ai` 6. One endpoint does not justify a major upgrade of every model path in the app. The wire shape below is the
 * one jev-cli 0.7.0 sends to the same endpoint (github.com/tumf/jev-cli, `provider_request`).
 *
 * Auth: AI_GATEWAY_API_KEY when set, otherwise the deployment's Vercel OIDC token. bars-engine's Vercel project is on
 * the same team as Wendell's gateway credit, so OIDC may need no stored key at all; /api/council/jev-check says which
 * one worked.
 *
 * Every call has a no-model fallback (jev-fallback): `decide` returns `{ ok: false }` instead of throwing, and the
 * caller carries on as if Jev were not there. Never send player text (jev-no-player-text).
 */

export const JEV_ENDPOINT = 'https://ai-gateway.vercel.sh/v4/ai/evaluation-model'
export const JEV_MODEL = 'typesafe-ai/jev'
/** Jev takes about 32,000 tokens of state plus questions per request; this keeps state well under it (~4 chars a token). */
export const JEV_MAX_STATE_CHARS = 100_000

export type JevQuestion =
  | { type: 'noul'; instructions: string }
  | { type: 'choice'; instructions: string; criteria: Record<string, string> }
  | { type: 'score'; instructions: string; criteria: string[] }

export type JevAnswer = { noul?: number; choice?: string; score?: number; [k: string]: unknown }

export type JevAuth = { method: 'api-key' | 'oidc'; token: string }

export type JevResult =
  | { ok: true; answers: Record<string, JevAnswer>; model: string | null; auth: JevAuth['method']; ms: number }
  | { ok: false; error: string; status?: number; auth: JevAuth['method'] | null; ms: number }

/** The key wins over OIDC; `oidcToken` is the request's `x-vercel-oidc-token` header when a route has one. */
export function jevAuth(oidcToken?: string | null): JevAuth | null {
  const key = process.env.AI_GATEWAY_API_KEY
  if (key) return { method: 'api-key', token: key }
  const oidc = oidcToken || process.env.VERCEL_OIDC_TOKEN
  if (oidc) return { method: 'oidc', token: oidc }
  return null
}

/** The gateway calls a yes/no question `boolean`; Jev calls it `noul`. */
export function toGatewayRequest(state: string, questions: Record<string, JevQuestion>) {
  return {
    state,
    questions: Object.fromEntries(
      Object.entries(questions).map(([name, q]) => [name, { ...q, type: q.type === 'noul' ? 'boolean' : q.type }]),
    ),
  }
}

/** Back to Jev's names: a `boolean` answer's `probability` becomes `noul`. */
export function fromGatewayAnswers(answers: unknown): Record<string, JevAnswer> | null {
  if (!answers || typeof answers !== 'object') return null
  const out: Record<string, JevAnswer> = {}
  for (const [name, raw] of Object.entries(answers as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') return null
    const { type, probability, ...rest } = raw as Record<string, unknown>
    out[name] = type === 'boolean' ? { noul: probability as number, ...rest } : { ...rest }
  }
  return out
}

export async function decide(
  state: string,
  questions: Record<string, JevQuestion>,
  opts: { oidcToken?: string | null; timeoutMs?: number; fetchImpl?: typeof fetch } = {},
): Promise<JevResult> {
  const started = Date.now()
  const auth = jevAuth(opts.oidcToken)
  if (!auth) return { ok: false, error: 'no AI_GATEWAY_API_KEY or Vercel OIDC token here', auth: null, ms: 0 }
  if (state.length > JEV_MAX_STATE_CHARS) {
    return { ok: false, error: `state is ${state.length} chars, over ${JEV_MAX_STATE_CHARS}`, auth: auth.method, ms: 0 }
  }
  try {
    const res = await (opts.fetchImpl ?? fetch)(JEV_ENDPOINT, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${auth.token}`,
        'content-type': 'application/json',
        'ai-gateway-protocol-version': '0.0.1',
        'ai-gateway-auth-method': auth.method,
        'ai-evaluation-model-specification-version': '4',
        'ai-model-id': JEV_MODEL,
      },
      body: JSON.stringify(toGatewayRequest(state, questions)),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
    })
    const ms = Date.now() - started
    // Error bodies are not passed on: they may echo the state.
    if (!res.ok) return { ok: false, error: `gateway answered ${res.status}`, status: res.status, auth: auth.method, ms }
    const body = (await res.json()) as { answers?: unknown; model?: string }
    const answers = fromGatewayAnswers(body.answers)
    if (!answers) return { ok: false, error: 'gateway returned no answers', auth: auth.method, ms }
    return { ok: true, answers, model: body.model ?? null, auth: auth.method, ms }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.name : 'fetch failed', auth: auth.method, ms: Date.now() - started }
  }
}
