/**
 * Tap the Vein — the morning menu (TTV-MENU).
 *
 * After the free write and the commit, the lines he kept become a menu the
 * council can read. Every item carries a bridge to a Lens goal. An item with no
 * goal gets a game-master suggestion: an existing goal it already serves, or a
 * new goal at a smaller time scale under one of his year goals, so the side
 * quest merges into the main quest. He accepts, picks another goal, or edits.
 *
 * Wendell, 2026-10-09 (board, `mm-menu-shape`): "All items need a bridge to lens
 * goals and game masters suggest ways to align to lens goals or suggest adding
 * lens goals a smaller time scales to integrate (side quests merging into main
 * quest)". And `mm-raw`: only kept lines leave the free write.
 *
 * Pure and deterministic: no model runs here (dual-track rule, CLAUDE.md). The
 * suggestions are word overlap plus a small domain vocabulary, so the same
 * morning always produces the same menu.
 */

import type { LensDomainKey } from '@/lib/lenses/domains'
import { LENS_DOMAINS } from '@/lib/lenses/domains'
import type { TtvBrainstormCandidate, TtvLensGoalOption } from '@/lib/tap-the-vein/types'

/** `mm-menu-shape`: at most seven items. */
export const MENU_MAX_ITEMS = 7

export const MENU_EXPORT_VERSION = 1

export type MenuCadence = 'year' | 'quarter' | 'month' | 'week'

const CADENCE_DEPTH: Record<MenuCadence, number> = { year: 0, quarter: 1, month: 2, week: 3 }

function isMenuCadence(value: string): value is MenuCadence {
  return value in CADENCE_DEPTH
}

function childCadence(cadence: MenuCadence): MenuCadence | null {
  switch (cadence) {
    case 'year':
      return 'quarter'
    case 'quarter':
      return 'month'
    case 'month':
      return 'week'
    case 'week':
      return null
  }
}

/** A task from today's session, as the menu needs it. */
export type MenuTaskInput = {
  id: string
  text: string
  status: string
  lensGoalId: string | null
}

/**
 * What the player has decided for one menu item. For a kept line that was never
 * committed this holds its bridge; a task keeps its bridge on the task row, so
 * for a task only "left unaligned" (null) is stored here.
 */
export type MenuLineDecision = {
  /** Goal the line is bridged to, or null when he chose to leave it unaligned. */
  lensGoalId: string | null
}

/** Stored on the session (`morning_menu`). Shape is versioned and parsed tolerantly. */
export type StoredMorningMenu = {
  /** Keyed by menu item key (`line:<normalized text>` or `task:<id>`). */
  lines: Record<string, MenuLineDecision>
  /** Set when he seals the menu; the export reads only sealed menus. */
  sealedAt: string | null
  /** Frozen copy of the menu at seal time — what the council reads. */
  sealed: MorningMenuExportItem[] | null
}

export type MenuGoalRef = {
  id: string
  title: string
  domain: LensDomainKey
  cadence: string
  /** Titles from the year goal down to this goal's parent. */
  chain: string[]
}

export type GameMasterVoice = 'architect' | 'sage' | 'challenger'

export type MenuSuggestion =
  | {
      kind: 'align'
      face: GameMasterVoice
      says: string
      goal: MenuGoalRef
    }
  | {
      kind: 'side_quest'
      face: GameMasterVoice
      says: string
      /** The goal the new, smaller goal hangs under. */
      parent: MenuGoalRef
      cadence: MenuCadence
      /** Proposed title; he can edit it before accepting. */
      title: string
      domain: LensDomainKey
    }

export type MenuItemStatus = 'bridged' | 'suggested' | 'unaligned'

export type MenuItem = {
  key: string
  text: string
  source: 'task' | 'kept_line'
  taskId: string | null
  status: MenuItemStatus
  /** Set when the item is bridged. */
  bridge: MenuGoalRef | null
  /** Set when the item is not bridged and a game master has a proposal. */
  suggestion: MenuSuggestion | null
  /** He chose to leave it unaligned (kept lines only). */
  leftUnaligned: boolean
}

export type MorningMenuExportItem = {
  key: string
  text: string
  source: 'task' | 'kept_line'
  status: 'bridged' | 'unaligned'
  goal: (MenuGoalRef & { trace: string }) | null
}

export type MorningMenuExport = {
  version: typeof MENU_EXPORT_VERSION
  sessionDate: string
  sealedAt: string
  items: MorningMenuExportItem[]
}

// ─── Parsing ────────────────────────────────────────────────────────────────

export function emptyStoredMenu(): StoredMorningMenu {
  return { lines: {}, sealedAt: null, sealed: null }
}

/** Survives null, the pre-migration shape, and hand-edited rows. */
export function parseStoredMenu(value: unknown): StoredMorningMenu {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyStoredMenu()
  const raw = value as Record<string, unknown>
  const lines: Record<string, MenuLineDecision> = {}
  if (raw.lines && typeof raw.lines === 'object' && !Array.isArray(raw.lines)) {
    for (const [key, decision] of Object.entries(raw.lines as Record<string, unknown>)) {
      if (!(key.startsWith('line:') || key.startsWith('task:')) || !decision || typeof decision !== 'object') continue
      const goalId = (decision as Record<string, unknown>).lensGoalId
      lines[key] = { lensGoalId: typeof goalId === 'string' && goalId ? goalId : null }
    }
  }
  const sealedAt = typeof raw.sealedAt === 'string' ? raw.sealedAt : null
  const sealed = Array.isArray(raw.sealed) ? (raw.sealed as MorningMenuExportItem[]) : null
  return { lines, sealedAt, sealed: sealedAt ? sealed : null }
}

// ─── Words ──────────────────────────────────────────────────────────────────

const STOPWORDS = new Set(
  (
    'a an and are as at be been but by do for from get got had has have i if in into is it its just me my of on ' +
    'or our out so some than that the their them then there these they this to up us was we were what when ' +
    'which who will with would you your more most make made can could should about over under via each ' +
    'today tomorrow week weekly month monthly year yearly quarter goal goals thing things stuff start finish'
  ).split(' '),
)

function stem(word: string): string {
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3)
  if (word.length > 4 && word.endsWith('ed')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

export function contentWords(text: string): Set<string> {
  const out = new Set<string>()
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOPWORDS.has(raw)) continue
    out.add(stem(raw))
  }
  return out
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let shared = 0
  for (const w of a) if (b.has(w)) shared++
  return shared / Math.sqrt(a.size * b.size)
}

/** Small per-domain vocabulary so a line can find a domain when no goal shares its words. */
const DOMAIN_WORDS: Record<LensDomainKey, string> = {
  relationships:
    'friend friends partner wife husband mom mother dad father family kid kids son daughter call text date dinner ' +
    'brother sister love connect visit reconnect relationship together',
  career:
    'work ship draft write publish client clients pitch build launch project book podcast episode code deploy ' +
    'design meeting career craft portfolio release edit chapter',
  money:
    'money invoice pay paid bill bills budget income tax taxes rent bank savings price sell sale revenue ' +
    'donor donation fundraise expense debt',
  health:
    'sleep run walk gym yoga stretch eat meal cook doctor therapy body rest meditate exercise workout water ' +
    'health breathe swim bike',
  allyship:
    'community ally allyship volunteer organize support mutual aid neighbor neighbors justice protest donate ' +
    'mentor serve showing',
}

const DOMAIN_VOCAB: Record<LensDomainKey, Set<string>> = Object.fromEntries(
  LENS_DOMAINS.map((d) => [d.key, contentWords(`${DOMAIN_WORDS[d.key]} ${d.prompt}`)]),
) as Record<LensDomainKey, Set<string>>

/** The domain whose vocabulary the line shares most with, or null. */
export function guessDomain(text: string): LensDomainKey | null {
  const words = contentWords(text)
  let best: LensDomainKey | null = null
  let bestHits = 0
  for (const d of LENS_DOMAINS) {
    let hits = 0
    for (const w of words) if (DOMAIN_VOCAB[d.key].has(w)) hits++
    if (hits > bestHits) {
      best = d.key
      bestHits = hits
    }
  }
  return best
}

// ─── Goals ──────────────────────────────────────────────────────────────────

export function normalizeLineKey(text: string): string {
  return 'line:' + text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function goalRef(goal: TtvLensGoalOption, byId: Map<string, TtvLensGoalOption>): MenuGoalRef {
  const chain: string[] = []
  let parentId = goal.parentGoalId
  const seen = new Set<string>([goal.id])
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId)
    const parent = byId.get(parentId)
    if (!parent) break
    chain.unshift(parent.title)
    parentId = parent.parentGoalId
  }
  return { id: goal.id, title: goal.title, domain: goal.domain, cadence: goal.cadence, chain }
}

/** "Year goal → Month goal → Week goal", as he reads it on the menu and the board. */
export function traceLabel(ref: MenuGoalRef): string {
  return [...ref.chain, ref.title].join(' → ')
}

function depth(goal: TtvLensGoalOption): number {
  return isMenuCadence(goal.cadence) ? CADENCE_DEPTH[goal.cadence] : 0
}

function descendants(rootId: string, goals: TtvLensGoalOption[]): TtvLensGoalOption[] {
  const out: TtvLensGoalOption[] = []
  const frontier = [rootId]
  const seen = new Set<string>(frontier)
  while (frontier.length) {
    const id = frontier.pop()!
    for (const g of goals) {
      if (g.parentGoalId === id && !seen.has(g.id)) {
        seen.add(g.id)
        out.push(g)
        frontier.push(g.id)
      }
    }
  }
  return out
}

/** Minimum overlap for a game master to say a line serves a goal. */
const ALIGN_THRESHOLD = 0.25

/**
 * Where a new, smaller goal for this line should hang under `anchor`: the
 * month goal in its branch closest to the line (new week goal), else one step
 * down from the anchor itself.
 */
function sideQuestPlacement(
  anchor: TtvLensGoalOption,
  words: Set<string>,
  goals: TtvLensGoalOption[],
): { parent: TtvLensGoalOption; cadence: MenuCadence } | null {
  const months = descendants(anchor.id, goals).filter((g) => g.cadence === 'month')
  if (anchor.cadence === 'month') months.unshift(anchor)
  if (months.length) {
    const best = [...months].sort((a, b) => overlapScore(words, contentWords(b.title)) - overlapScore(words, contentWords(a.title)))[0]
    return { parent: best, cadence: 'week' }
  }
  if (!isMenuCadence(anchor.cadence)) return null
  const next = childCadence(anchor.cadence)
  if (next) return { parent: anchor, cadence: next }
  // A week goal: the new goal is its sibling, under the same month.
  const parent = anchor.parentGoalId ? goals.find((g) => g.id === anchor.parentGoalId) : undefined
  return parent ? { parent, cadence: 'week' } : null
}

/**
 * The game master's proposal for a line with no goal yet.
 *
 * - The Architect names an existing week or month goal the line already serves.
 * - The Sage proposes a new, smaller goal when the line fits a year or quarter
 *   goal's theme but no goal at its scale: the side quest merging into the main
 *   quest.
 * - With no overlap at all, the Sage falls back to the domain vocabulary and
 *   proposes the side quest under that domain's first year goal.
 * - Otherwise there is no proposal and the Challenger asks him to place it.
 */
export function suggestBridge(text: string, goals: TtvLensGoalOption[]): MenuSuggestion | null {
  if (goals.length === 0) return null
  const byId = new Map(goals.map((g) => [g.id, g]))
  const words = contentWords(text)

  const scored = goals
    .map((goal) => ({ goal, score: overlapScore(words, contentWords(goal.title)) }))
    .filter((s) => s.score >= ALIGN_THRESHOLD)
    // Higher score first; on a tie the smaller time scale wins.
    .sort((a, b) => b.score - a.score || depth(b.goal) - depth(a.goal) || a.goal.title.localeCompare(b.goal.title))

  const best = scored[0]?.goal
  if (best && (best.cadence === 'week' || best.cadence === 'month')) {
    const ref = goalRef(best, byId)
    return {
      kind: 'align',
      face: 'architect',
      says: `This already serves “${best.title}”. Hang it there.`,
      goal: ref,
    }
  }

  let anchor = best
  if (!anchor) {
    const domain = guessDomain(text)
    if (domain) {
      anchor = goals
        .filter((g) => g.domain === domain && g.cadence === 'year')
        .sort((a, b) => a.title.localeCompare(b.title))[0]
    }
  }
  if (!anchor) return null

  const placement = sideQuestPlacement(anchor, words, goals)
  if (!placement) return null
  const parentRef = goalRef(placement.parent, byId)
  return {
    kind: 'side_quest',
    face: 'sage',
    says: `No ${placement.cadence} goal holds this yet. Add it as a ${placement.cadence} goal under “${placement.parent.title}” and the side quest joins the main one.`,
    parent: parentRef,
    cadence: placement.cadence,
    title: text.trim(),
    domain: placement.parent.domain,
  }
}

// ─── The menu ───────────────────────────────────────────────────────────────

const LIVE_EXCLUDED = new Set(['composted', 'carried_over'])

/**
 * Today's kept lines as menu items. Kept lines are today's live tasks and the
 * brainstorm lines he marked "play" that were never committed. Raw and
 * composted lines stay in the session (`mm-raw`). Unaligned items go last;
 * the list is capped at seven.
 */
export function buildMenu(input: {
  tasks: MenuTaskInput[]
  candidates: TtvBrainstormCandidate[]
  goals: TtvLensGoalOption[]
  stored: StoredMorningMenu
}): MenuItem[] {
  const byId = new Map(input.goals.map((g) => [g.id, g]))
  const items: MenuItem[] = []
  const seenText = new Set<string>()

  for (const task of input.tasks) {
    if (LIVE_EXCLUDED.has(task.status)) continue
    const key = normalizeLineKey(task.text)
    if (seenText.has(key)) continue
    seenText.add(key)
    const goal = task.lensGoalId ? byId.get(task.lensGoalId) : undefined
    const itemKey = `task:${task.id}`
    const leftUnaligned = input.stored.lines[itemKey]?.lensGoalId === null
    items.push(itemFor({ key: itemKey, text: task.text, source: 'task', taskId: task.id, goal, leftUnaligned }, input.goals, byId))
  }

  for (const c of input.candidates) {
    if (c.fate !== 'play') continue
    const key = normalizeLineKey(c.text)
    if (seenText.has(key)) continue
    seenText.add(key)
    const decision = input.stored.lines[key]
    const goal = decision?.lensGoalId ? byId.get(decision.lensGoalId) : undefined
    items.push(
      itemFor(
        { key, text: c.text.trim(), source: 'kept_line', taskId: null, goal, leftUnaligned: decision !== undefined && decision.lensGoalId === null },
        input.goals,
        byId,
      ),
    )
  }

  const rank: Record<MenuItemStatus, number> = { bridged: 0, suggested: 1, unaligned: 2 }
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank[a.item.status] - rank[b.item.status] || a.i - b.i)
    .slice(0, MENU_MAX_ITEMS)
    .map(({ item }) => item)
}

function itemFor(
  base: { key: string; text: string; source: 'task' | 'kept_line'; taskId: string | null; goal: TtvLensGoalOption | undefined; leftUnaligned: boolean },
  goals: TtvLensGoalOption[],
  byId: Map<string, TtvLensGoalOption>,
): MenuItem {
  if (base.goal) {
    return { key: base.key, text: base.text, source: base.source, taskId: base.taskId, status: 'bridged', bridge: goalRef(base.goal, byId), suggestion: null, leftUnaligned: false }
  }
  const suggestion = base.leftUnaligned ? null : suggestBridge(base.text, goals)
  return {
    key: base.key,
    text: base.text,
    source: base.source,
    taskId: base.taskId,
    status: suggestion ? 'suggested' : 'unaligned',
    bridge: null,
    suggestion,
    leftUnaligned: base.leftUnaligned,
  }
}

/**
 * What the council reads. Built only from menu items, so the free write itself
 * (`rawEntry`) can never be in it (`mm-raw`). A suggestion he has not accepted
 * is exported as unaligned: the bridge is his, never the game master's.
 */
export function toMenuExport(items: MenuItem[], sessionDate: string, sealedAt: string): MorningMenuExport {
  return {
    version: MENU_EXPORT_VERSION,
    sessionDate,
    sealedAt,
    items: items.map((item) => ({
      key: item.key,
      text: item.text,
      source: item.source,
      status: item.bridge ? 'bridged' : 'unaligned',
      goal: item.bridge ? { ...item.bridge, trace: traceLabel(item.bridge) } : null,
    })),
  }
}

/** Trace label for a goal id against the live goal list, for pickers. */
export function goalTrace(goalId: string, goals: TtvLensGoalOption[]): string | null {
  const byId = new Map(goals.map((g) => [g.id, g]))
  const goal = byId.get(goalId)
  return goal ? traceLabel(goalRef(goal, byId)) : null
}
