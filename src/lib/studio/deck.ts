/** The boat deck of the studio game (/board/studio): every number on it is read from six-faces-council main
 * (position ty-real-data). Strands come from council/callsheets/INDEX.md, loop rounds from council/loops/*.json,
 * staff from the Claude-Code-Game-Studios roster, the gate bar from the seven stages applied to Chapter 1. */
import { ROSTER, type Staff } from './roster'

const RAW = 'https://raw.githubusercontent.com/wendell-britt/Six-faces-council/main/'
const LOOPS_API = 'https://api.github.com/repos/wendell-britt/Six-faces-council/contents/council/loops?ref=main'

/** Spirits are let go after 21 days of neglect (spirit-care.md), so a strand untouched that long has faded. */
export const FADE_DAYS = 21

export type Mood = 'waiting' | 'moving' | 'done' | 'resting'
export type Passenger = {
  strand: string; sheet: string; touched: string; days: number; glow: number
  mood: Mood; text: string; next: string; loop?: LoopState
}
export type LoopState = { loop: string; round: number; lastLook: number; ahead: number; maxAhead: number }
export type Gate = { stage: string; does: string; state: 'passed' | 'here' | 'ahead' }
export type Deck = { at: string; passengers: Passenger[]; crew: Staff[]; gates: Gate[]; gateNote: string; source: string }

/** One `- [name](file.md), YYYY-MM-DD: text` line per open strand, under `## Open strands`. */
export function parseIndex(md: string, now: Date): Passenger[] {
  const open = md.split(/^## /m).find(s => s.startsWith('Open strands')) ?? ''
  const out: Passenger[] = []
  for (const line of open.split('\n')) {
    const m = line.match(/^- \[([^\]]+)\]\(([^)]+)\),\s*(\d{4}-\d{2}-\d{2}):\s*(.*)$/)
    if (!m) continue
    const [, strand, sheet, touched, text] = m
    const days = Math.max(0, Math.floor((now.getTime() - Date.parse(touched + 'T00:00:00Z')) / 86_400_000))
    out.push({ strand, sheet, touched, days, glow: Math.max(0, 1 - days / FADE_DAYS), mood: moodOf(text), text, next: nextOf(text) })
  }
  return out
}

/** The strand's own words decide its mood; the first rule that matches wins. */
export function moodOf(text: string): Mood {
  const t = text.toLowerCase()
  if (/^done\b|: done\b/.test(t)) return 'done'
  if (/wait(s|ing)? (on|for) (his|wendell|ari)|his (look|play|phone|answers?|note)|waiting on wendell/.test(t)) return 'waiting'
  if (/\bnext\b/.test(t)) return 'moving'
  return 'resting'
}

/** The last thing the line says comes next, or what it waits on. */
export function nextOf(text: string): string {
  const hits = [...text.matchAll(/(?:^|[;.]\s)((?:next|waits? on|waiting on)[^;.]*)/gi)]
  if (hits.length) return hits[hits.length - 1][1].trim()
  return (text.split(/[;.]\s/).pop() ?? '').trim()
}

/** A next-round contract (docs/loops.md): rounds built past his last look, against the strand's limit. */
export function parseLoop(json: unknown): LoopState | null {
  const j = json as { strand?: string; loop?: string; max_ahead?: number; last_look?: { round?: number }; rounds?: { round: number; status: string }[] }
  if (!j?.strand || !Array.isArray(j.rounds)) return null
  const done = j.rounds.filter(r => r.status === 'done').map(r => r.round)
  const round = done.length ? Math.max(...done) : 0, lastLook = j.last_look?.round ?? 0
  return { loop: j.loop ?? '', round, lastLook, ahead: Math.max(0, round - lastLook), maxAhead: j.max_ahead ?? 2 }
}

export const STAGES: [string, string][] = [
  ['Concept', 'Brainstorm, game concept'], ['Systems Design', 'Map systems, design docs'],
  ['Technical Setup', 'Engine, architecture decisions'], ['Pre-Production', 'Prototypes, vertical slice validation'],
  ['Production', 'Feature development'], ['Polish', 'Playtests, performance, bugs'], ['Release', 'Launch prep'],
]

/** Chapter 1 against the seven stages (position ty-gates). A gate verdict is advice; only Wendell passes a gate, and
 * he has passed none yet, so `passed` stays empty until a ruling records one. */
export const CHAPTER1 = {
  passed: [] as string[],
  here: 'Pre-Production',
  note: 'Gate check (advice): Chapter 1 is a vertical slice still being proven. The beat table and its validator are '
    + 'merged (sprout #66, #69) and the character creator is in review (sprout #71, #72). The Production gate opens on '
    + 'your phone play of the slice (chapter1-demo.md). No gate has been passed by you yet.',
}

export function gateBar(passed: string[], here: string): Gate[] {
  return STAGES.map(([stage, does]) => ({ stage, does, state: passed.includes(stage) ? 'passed' : stage === here ? 'here' : 'ahead' }))
}

/** The crew row leaves out the engine specialists (Godot, Unity, Unreal): our engine question waits (council #302). */
export function crew(): Staff[] {
  const rank = { director: 0, lead: 1, specialist: 2 }
  return ROSTER.filter(s => !s.engine).sort((a, b) => rank[a.tier] - rank[b.tier] || a.id.localeCompare(b.id))
}

let cache: { deck: Deck; at: number } | null = null

async function text(url: string): Promise<string | null> {
  try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? await r.text() : null } catch { return null }
}

async function loops(): Promise<Map<string, LoopState>> {
  const out = new Map<string, LoopState>()
  const list = await text(LOOPS_API)
  let names: string[] = ['spirit-generator.json']
  try { if (list) names = (JSON.parse(list) as { name: string }[]).map(f => f.name).filter(n => n.endsWith('.json')) } catch { /* keep the known one */ }
  await Promise.all(names.map(async n => {
    const body = await text(RAW + 'council/loops/' + n)
    try { const l = body && parseLoop(JSON.parse(body)); if (l) out.set(n.replace(/\.json$/, ''), l) } catch { /* skip */ }
  }))
  return out
}

/** The deck as main has it now, cached five minutes like the boards. */
export async function loadDeck(now = new Date()): Promise<Deck | null> {
  if (cache && now.getTime() - cache.at < 5 * 60_000) return cache.deck
  const index = await text(RAW + 'council/callsheets/INDEX.md')
  if (!index) return cache?.deck ?? null
  const passengers = parseIndex(index, now), loopMap = await loops()
  for (const p of passengers) { const l = loopMap.get(p.strand); if (l) p.loop = l }
  const deck: Deck = { at: now.toISOString(), passengers, crew: crew(), gates: gateBar(CHAPTER1.passed, CHAPTER1.here),
    gateNote: CHAPTER1.note, source: 'six-faces-council main: council/callsheets/INDEX.md, council/loops/' }
  cache = { deck, at: now.getTime() }
  return deck
}
