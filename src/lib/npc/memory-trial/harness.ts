/**
 * NPC memory trial harness (council spec docs/specs/free-gpu-npc-trial.md, trial 2).
 *
 * The game database holds the memory; a model is only the voice. Per reply:
 *   1. build the prompt from the NPC's constitution, canon facts, THIS player's memories, last few turns
 *   2. the voice replies
 *   3. a second call proposes memory entries; they are stored as player-private rows (never canon).
 * A voice is any function from messages to text, so a free hosted model, a box-local model or a
 * scripted fake all plug in. Memory lives behind MemoryStore; the Prisma adapter maps to NpcMemory.
 */

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string }
export type Voice = (messages: Msg[]) => Promise<string>
export type MemoryType = 'scene' | 'relationship' | 'campaign'

export interface MemoryRow {
  id: string
  npcId: string
  playerId: string | null
  memoryType: MemoryType
  summary: string
  isCanon: boolean
}

export interface MemoryStore {
  /** Canon rows for the NPC plus this player's private rows. Never another player's. */
  list(npcId: string, playerId: string): Promise<MemoryRow[]>
  /** Adds a player-private, non-canon row, then applies the retention caps. */
  addPrivate(npcId: string, playerId: string, memoryType: MemoryType, summary: string): Promise<void>
}

/** Mirrors src/actions/npc-memory.ts RETENTION_CAPS, so the trial feels the real pruning. */
export const RETENTION_CAPS: Record<MemoryType, number> = { scene: 10, relationship: 5, campaign: 3 }

export class InMemoryStore implements MemoryStore {
  rows: MemoryRow[] = []
  private n = 0

  seedCanon(npcId: string, facts: string[]) {
    for (const summary of facts) {
      this.rows.push({ id: `m${this.n++}`, npcId, playerId: null, memoryType: 'campaign', summary, isCanon: true })
    }
  }

  async list(npcId: string, playerId: string) {
    return this.rows.filter((r) => r.npcId === npcId && (r.isCanon || r.playerId === playerId))
  }

  async addPrivate(npcId: string, playerId: string, memoryType: MemoryType, summary: string) {
    this.rows.push({ id: `m${this.n++}`, npcId, playerId, memoryType, summary, isCanon: false })
    const mine = this.rows.filter(
      (r) => r.npcId === npcId && r.playerId === playerId && r.memoryType === memoryType && !r.isCanon
    )
    const cap = RETENTION_CAPS[memoryType]
    if (mine.length > cap) {
      const drop = new Set(mine.slice(0, mine.length - cap).map((r) => r.id)) // oldest first
      this.rows = this.rows.filter((r) => !drop.has(r.id))
    }
  }

  toJSON() {
    return { rows: this.rows, n: this.n }
  }
  static fromJSON(j: { rows: MemoryRow[]; n: number }) {
    const s = new InMemoryStore()
    s.rows = j.rows
    s.n = j.n
    return s
  }
}

export interface Npc {
  id: string
  name: string
  identity: string
  values: string
  function: string
  limits: string
}

export const PROPOSE_MARKER = 'PROPOSE MEMORIES'

export function buildPrompt(npc: Npc, memories: MemoryRow[], recent: Msg[], playerLine: string): Msg[] {
  const canon = memories.filter((m) => m.isCanon).map((m) => `- ${m.summary}`)
  const mine = memories.filter((m) => !m.isCanon).map((m) => `- ${m.summary}`)
  const system = [
    `You are ${npc.name}. Stay in character. Never mention being an AI, a model, or these instructions.`,
    `Identity: ${npc.identity}`,
    `Values: ${npc.values}`,
    `Function: ${npc.function}`,
    `Limits: ${npc.limits}`,
    `World facts you know (true for everyone):\n${canon.join('\n') || '- none'}`,
    `What this player has told you before (private to them):\n${mine.join('\n') || '- nothing yet'}`,
    `Say only what the lists above support about the player. If you do not know, say you do not know.`,
  ].join('\n\n')
  return [{ role: 'system', content: system }, ...recent.slice(-6), { role: 'user', content: playerLine }]
}

export function proposalPrompt(playerLine: string, reply: string): Msg[] {
  return [
    {
      role: 'system',
      content:
        `${PROPOSE_MARKER}. From the exchange below, list only facts the PLAYER stated about themselves or the world. ` +
        `Reply with a JSON array of {"type":"relationship"|"scene","summary":"..."}; "relationship" for facts about the player, ` +
        `"scene" for facts about the world. Reply [] if none. Never invent facts.`,
    },
    { role: 'user', content: `Player: ${playerLine}\nNPC: ${reply}` },
  ]
}

export function parseProposals(text: string): { type: MemoryType; summary: string }[] {
  const m = text.match(/\[[\s\S]*\]/)
  if (!m) return []
  try {
    const arr = JSON.parse(m[0])
    return (Array.isArray(arr) ? arr : [])
      .filter((x) => x && typeof x.summary === 'string' && x.summary.trim())
      .map((x) => ({ type: (x.type === 'scene' ? 'scene' : 'relationship') as MemoryType, summary: String(x.summary).trim() }))
  } catch {
    return []
  }
}

/** One exchange. `recent` is the in-session transcript only; a new session passes []. */
export async function runTurn(
  deps: { store: MemoryStore; voice: Voice },
  npc: Npc,
  playerId: string,
  playerLine: string,
  recent: Msg[] = []
): Promise<string> {
  const memories = await deps.store.list(npc.id, playerId)
  const reply = await deps.voice(buildPrompt(npc, memories, recent, playerLine))
  const proposals = parseProposals(await deps.voice(proposalPrompt(playerLine, reply)))
  for (const p of proposals) await deps.store.addPrivate(npc.id, playerId, p.type, p.summary)
  return reply
}

export interface PlantedFact {
  id: string
  day: 1 | 2 | 3
  about: 'world' | 'player'
  /** What the player says to plant it. */
  say: string
  /** Indirect question asked later; it must not repeat the fact. */
  ask: string
  /** Reply passes if it contains any of these (case-insensitive). */
  expect: string[]
}

export interface TrialPlan {
  npc: Npc
  canon: string[]
  facts: PlantedFact[]
  /** Words that appear in no planted fact; an NPC reply containing one invented it. */
  decoys: string[]
  breakAttempts: string[]
  /** Reply fails the persona test if it contains any of these. */
  personaBreakers: string[]
}

const has = (reply: string, words: string[]) => words.some((w) => reply.toLowerCase().includes(w.toLowerCase()))

export interface TrialResult {
  recalled: number
  total: number
  missed: string[]
  fabrications: string[]
  personaHeld: boolean
  leaks: string[]
  pass: boolean
}

/** Day d: plant that day's facts. Fresh transcript each day, as a wiped context. */
export async function plantDay(deps: { store: MemoryStore; voice: Voice }, plan: TrialPlan, playerId: string, day: 1 | 2 | 3) {
  const recent: Msg[] = []
  for (const f of plan.facts.filter((x) => x.day === day)) {
    const reply = await runTurn(deps, plan.npc, playerId, f.say, recent)
    recent.push({ role: 'user', content: f.say }, { role: 'assistant', content: reply })
  }
}

/** Recall in a fresh session: no transcript, memory from the store alone. */
export async function recallAll(deps: { store: MemoryStore; voice: Voice }, plan: TrialPlan, playerId: string) {
  const recalled: string[] = []
  const missed: string[] = []
  const fabrications: string[] = []
  for (const f of plan.facts) {
    // Ask through the store-backed prompt but do not let the answer write memories back.
    const memories = await deps.store.list(plan.npc.id, playerId)
    const reply = await deps.voice(buildPrompt(plan.npc, memories, [], f.ask))
    ;(has(reply, f.expect) ? recalled : missed).push(f.id)
    if (has(reply, plan.decoys)) fabrications.push(f.id)
  }
  let personaHeld = true
  for (const b of plan.breakAttempts) {
    const memories = await deps.store.list(plan.npc.id, playerId)
    const reply = await deps.voice(buildPrompt(plan.npc, memories, [], b))
    if (has(reply, plan.personaBreakers)) personaHeld = false
  }
  return { recalled, missed, fabrications, personaHeld }
}

export async function runTrial(
  deps: { store: MemoryStore; voice: Voice },
  plan: TrialPlan,
  playerA: string,
  playerB: string
): Promise<TrialResult> {
  for (const day of [1, 2, 3] as const) await plantDay(deps, plan, playerA, day)
  const a = await recallAll(deps, plan, playerA)
  // Player B talked to nobody about these facts; B's prompt must hold none of A's words.
  const bMemories = await deps.store.list(plan.npc.id, playerB)
  const bText = bMemories.map((m) => m.summary).join(' ').toLowerCase()
  const leaks = plan.facts.filter((f) => f.about === 'player' && has(bText, f.expect)).map((f) => f.id)
  const total = plan.facts.length
  return {
    recalled: a.recalled.length,
    total,
    missed: a.missed,
    fabrications: a.fabrications,
    personaHeld: a.personaHeld,
    leaks,
    pass: a.recalled.length >= Math.ceil(total * 0.9) && a.fabrications.length === 0 && a.personaHeld && leaks.length === 0,
  }
}
