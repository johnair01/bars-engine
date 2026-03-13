/**
 * Server-side agent client for Next.js server actions.
 *
 * Routes AI calls through the backend Game Master agents instead of direct OpenAI.
 * Three-tier fallback: Agent → Direct OpenAI → Deterministic.
 *
 * Usage in server actions:
 *   const result = await postAgent<CompileReq, QuestCompilation>('/architect/compile', body)
 */

import type { IChingContext } from '@/lib/quest-grammar'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Types (mirror backend schemas)
// ---------------------------------------------------------------------------

export interface AgentResponse<T> {
  agent: string
  output: T
  discerned_move: 'wake_up' | 'clean_up' | 'grow_up' | 'show_up' | null
  legibility_note: string | null
  generative_deps: string[]
  feedback_flag: string | null
  usage_tokens: number | null
  deterministic: boolean
}

export interface QuestCompilationOutput {
  node_texts: string[]
  overview: string
  twee_source: string | null
  emotional_alchemy_tag: string | null
  confidence: number
  reasoning: string
  hexagram_interpretation: string | null
}

// ---------------------------------------------------------------------------
// Core fetch helper
// ---------------------------------------------------------------------------

export async function postAgent<Req extends Record<string, unknown>, Res>(
  path: string,
  body: Req,
): Promise<AgentResponse<Res>> {
  const url = `${BACKEND_URL}/api/agents${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    // Server action context — no cookies needed; pass player_id in body
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Agent ${path} failed: ${res.status} ${text}`)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Backend availability check
// ---------------------------------------------------------------------------

let _backendAvailable: boolean | null = null
let _lastCheck = 0
const CHECK_INTERVAL_MS = 30_000 // Re-check every 30s

export async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now()
  if (_backendAvailable !== null && now - _lastCheck < CHECK_INTERVAL_MS) {
    return _backendAvailable
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(2000),
    })
    _backendAvailable = res.ok
  } catch {
    _backendAvailable = false
  }
  _lastCheck = now
  return _backendAvailable
}

// ---------------------------------------------------------------------------
// Compile quest through Architect agent
// ---------------------------------------------------------------------------

export async function compileQuestViaAgent(opts: {
  unpackingAnswers: Record<string, string>
  emotionalSignature?: Record<string, unknown>
  ichingContext?: IChingContext
  questGrammar?: 'epiphany_bridge' | 'kotter'
  playerId?: string
  instanceId?: string
}): Promise<AgentResponse<QuestCompilationOutput>> {
  return postAgent('/architect/compile', {
    unpacking_answers: opts.unpackingAnswers,
    emotional_signature: opts.emotionalSignature ?? null,
    iching_context: opts.ichingContext ?? null,
    quest_grammar: opts.questGrammar ?? 'epiphany_bridge',
    player_id: opts.playerId ?? null,
    instance_id: opts.instanceId ?? null,
  })
}

// ---------------------------------------------------------------------------
// Storyteller bridge through Diplomat
// ---------------------------------------------------------------------------

export async function bridgeNarrativeViaAgent(opts: {
  narrativeText: string
  moveType?: string
  ichingContext?: IChingContext
  playerId?: string
  instanceId?: string
}): Promise<AgentResponse<unknown>> {
  return postAgent('/diplomat/bridge', {
    narrative_text: opts.narrativeText,
    move_type: opts.moveType ?? null,
    iching_context: opts.ichingContext ?? null,
    player_id: opts.playerId ?? null,
    instance_id: opts.instanceId ?? null,
  })
}

// ---------------------------------------------------------------------------
// Copy refinement through Diplomat
// ---------------------------------------------------------------------------

export async function refineCopyViaAgent(opts: {
  targetType: string
  currentCopy: string
  context?: string
  ichingContext?: IChingContext
  playerId?: string
}): Promise<AgentResponse<unknown>> {
  return postAgent('/diplomat/refine-copy', {
    target_type: opts.targetType,
    current_copy: opts.currentCopy,
    context: opts.context ?? null,
    iching_context: opts.ichingContext ?? null,
    player_id: opts.playerId ?? null,
  })
}

// ---------------------------------------------------------------------------
// Nation/archetype extraction through Shaman
// ---------------------------------------------------------------------------

export async function identifyViaAgent(opts: {
  freeText: string
  ichingContext?: IChingContext
  playerId?: string
}): Promise<AgentResponse<unknown>> {
  return postAgent('/shaman/identify', {
    free_text: opts.freeText,
    iching_context: opts.ichingContext ?? null,
    player_id: opts.playerId ?? null,
  })
}

// ---------------------------------------------------------------------------
// Book chunk analysis through Architect
// ---------------------------------------------------------------------------

export async function analyzeChunkViaAgent(opts: {
  chunkText: string
  domainHint?: string
  ichingContext?: IChingContext
  playerId?: string
}): Promise<AgentResponse<unknown>> {
  return postAgent('/architect/analyze-chunk', {
    chunk_text: opts.chunkText,
    domain_hint: opts.domainHint ?? null,
    iching_context: opts.ichingContext ?? null,
    player_id: opts.playerId ?? null,
  })
}
