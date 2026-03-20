/**
 * Frontend client for BARs Engine AI Agents (Game Master Sects).
 *
 * All endpoints hit the Python backend (FastAPI).
 * Cookie auth (bars_player_id) is forwarded automatically via credentials: 'include'.
 */

const AGENT_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Generic response type (mirrors backend AgentResponse)
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

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface QuestDraft {
  title: string
  description: string
  quest_type: string
  grammar: 'epiphany_bridge' | 'kotter'
  move_type: string | null
  emotional_alchemy_tag: string | null
  kotter_stage: number
  nation: string | null
  archetype: string | null
  allyship_domain: string | null
  completion_conditions: string[]
  vibulon_reward: number
  confidence: number
  reasoning: string
}

export interface MoveProposal {
  available_moves: { move_key: string; move_name: string; available: boolean; reason: string | null }[]
  recommended_move: string | null
  reasoning: string
  energy_assessment: string
  blocked_moves: string[]
}

export interface EmotionalAlchemyReading {
  current_element: string | null
  emotional_channel: string | null
  satisfaction_state: string | null
  narrative_lock: string | null
  shadow_belief: string | null
  recommended_move_type: string | null
  wave_stage: string | null
  guidance: string
}

export interface CampaignAssessment {
  instance_id: string | null
  current_kotter_stage: number
  active_domains: string[]
  thread_status: { thread_id: string; title: string; status: string; quest_count: number }[]
  recommended_actions: string[]
  readiness_for_next_stage: number
  reasoning: string
}

export interface CommunityGuidance {
  recommended_instance: string | null
  recommended_campaign_domain: string | null
  onboarding_next_step: string | null
  bar_sharing_suggestions: string[]
  event_recommendations: string[]
  tone: string
  message: string
}

export interface SageResponseOutput {
  synthesis: string
  consulted_agents: string[]
  discerned_move: string | null
  hexagram_alignment: { hexagram_number: number | null; alignment_score: number; interpretation: string } | null
  legibility_note: string | null
  generative_deps: string[]
  feedback_flags_collected: string[]
}

export interface GitHubIssueResult {
  url: string
  number: number
  title: string
}

export interface AgentMindState {
  agent_id: string
  nation: string
  archetype: string
  goal: string
  narrative_lock: string
  emotional_state: string
  energy: number
  bars: string[]
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

async function agentFetch<T>(
  path: string,
  body: Record<string, unknown>,
  method: 'POST' | 'GET' = 'POST'
): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  }
  if (method === 'POST') {
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(`${AGENT_BASE}${path}`, opts)
  if (!res.ok) {
    throw new Error(`Agent request failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// Architect
export async function consultArchitect(
  narrativeLock: string,
  grammar: 'epiphany_bridge' | 'kotter' = 'epiphany_bridge'
): Promise<AgentResponse<QuestDraft>> {
  return agentFetch('/api/agents/architect/draft', {
    narrative_lock: narrativeLock,
    quest_grammar: grammar,
  })
}

// Challenger
export async function consultChallenger(
  questId?: string
): Promise<AgentResponse<MoveProposal>> {
  return agentFetch('/api/agents/challenger/propose', {
    quest_id: questId ?? null,
  })
}

// Shaman
export async function consultShaman(
  context?: string
): Promise<AgentResponse<EmotionalAlchemyReading>> {
  return agentFetch('/api/agents/shaman/read', {
    context: context ?? null,
  })
}

export async function suggestShadowName(
  chargeDescription: string,
  maskShape: string,
  attempt: number = 0
): Promise<{ suggested_name: string; deterministic?: boolean }> {
  const url = `${AGENT_BASE}/api/agents/shaman/suggest-shadow-name`
  const opts: RequestInit = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      charge_description: chargeDescription,
      mask_shape: maskShape,
      attempt: Math.max(0, Math.floor(attempt)),
    }),
    signal: AbortSignal.timeout(15_000),
  }
  try {
    const res = await fetch(url, opts)
    if (!res.ok) {
      console.error('[suggestShadowName] fetch failed', { url, status: res.status, statusText: res.statusText })
      throw new Error(`Agent request failed: ${res.status} ${res.statusText}`)
    }
    return res.json()
  } catch (e) {
    if (e instanceof Error) {
      if (e.name === 'AbortError') {
        console.error('[suggestShadowName] timeout (15s)', { url })
      } else {
        console.error('[suggestShadowName] error', { url, message: e.message })
      }
    }
    throw e
  }
}

// Regent
export async function consultRegent(
  instanceId: string
): Promise<AgentResponse<CampaignAssessment>> {
  return agentFetch('/api/agents/regent/assess', {
    instance_id: instanceId,
  })
}

// Diplomat
export async function consultDiplomat(): Promise<AgentResponse<CommunityGuidance>> {
  return agentFetch('/api/agents/diplomat/guide', {})
}

// Sage
export async function consultSage(
  question: string
): Promise<AgentResponse<SageResponseOutput>> {
  return agentFetch('/api/agents/sage/consult', { question })
}

// Agent Mind Model
export async function createAgentMind(config: {
  nation: string
  archetype: string
  goal: string
  narrative_lock: string
  emotional_state?: string
  energy?: number
}): Promise<AgentMindState> {
  return agentFetch('/api/agents/mind/create', config)
}

export async function stepAgentMind(agentId: string): Promise<AgentMindState> {
  return agentFetch(`/api/agents/mind/${agentId}/step`, {})
}

export async function getAgentMind(agentId: string): Promise<AgentMindState> {
  const res = await fetch(`${AGENT_BASE}/api/agents/mind/${agentId}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error(`Agent mind fetch failed: ${res.status}`)
  return res.json()
}
