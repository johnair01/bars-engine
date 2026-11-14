/**
 * An encounter's beats: the six unpacking questions laid on the epiphany bridge, with light buds of three beats.
 *
 * Wendell, 2026-11-13 (encounter-bridge-look-1, A): an encounter has backstory, desire, a wall, an epiphany, a plan,
 * episodic conflicts, transformation and achievement. The six questions fill the first half of the bridge; play walks
 * the second half. Each Q6 reservation can bud one micro-encounter of three beats: the wall (that reservation), the
 * epiphany (Q5 asked of it) and one step, which goes to the farm as a seed (send-to-farm, bars #732).
 *
 * The map and its reasons are the council pass `encounter-bridge-1_2026-11-13` (six-faces-council store). Written in:
 *  - Challenger: at most three open buds; a reservation may go unplayed.
 *  - Regent: the eight beats keep his names. "Let go with honour" counts only when the player names it in their own
 *    words, the goal is composted, and a return date is offered.
 *  - Architect: Q5 at beat 4 (`intake.q5`) and Q5 inside a bud (`bud.epiphany`) are kept in separate fields.
 *  - Diplomat: every beat carries a one-sentence plain version, and the plan's steps start as drafts the player steers.
 *
 * Pure data and pure functions: no store, no model call. The board's spirit deck draws `deckOf()`.
 */

/** The eight beats in story order, with the names he gave them. */
export const BEATS = ['backstory', 'desire', 'wall', 'epiphany', 'plan', 'conflicts', 'transformation', 'achievement'] as const
export type BeatKey = (typeof BEATS)[number]

/** The six unpacking questions, by number. */
export type QKey = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6'

/** The six answers of one intake. Q6 is a list: one entry per reservation. Any answer may be skipped (Shaman). */
export interface Intake {
  q1?: string // the experience to create (outer desire)
  q2?: string // the satisfied state it brings (inner desire)
  q3?: string // life now, compared to that
  q4?: string // how it feels to live here
  q5?: string // what would have to be true
  q6?: string[] // reservations
}

export interface BeatDef {
  key: BeatKey
  n: number
  label: string
  /** One plain sentence a player reads on the card (Diplomat). */
  plain: string
  /** The questions whose answers fill this beat. The plan has none: it is drawn from Q1, Q5 and Q6. */
  fills: QKey[]
  /** Which half of the bridge: the intake fills the first half, play walks the second. */
  half: 'intake' | 'play'
}

export const BEAT_DEFS: Record<BeatKey, BeatDef> = {
  backstory: { key: 'backstory', n: 1, label: 'Backstory', half: 'intake', fills: ['q3', 'q4'],
    plain: 'Where you are now, and how it feels to live there.' },
  desire: { key: 'desire', n: 2, label: 'Desire', half: 'intake', fills: ['q1', 'q2'],
    plain: 'What you want to make, and the feeling it would bring.' },
  wall: { key: 'wall', n: 3, label: 'The wall', half: 'intake', fills: ['q6'],
    plain: 'Something you learned that stands in the way.' },
  epiphany: { key: 'epiphany', n: 4, label: 'Epiphany', half: 'intake', fills: ['q5'],
    plain: 'What would have to be true for it to work.' },
  plan: { key: 'plan', n: 5, label: 'The plan', half: 'play', fills: [],
    plain: 'Your goal, your truth and your worries, turned into steps you choose.' },
  conflicts: { key: 'conflicts', n: 6, label: 'Episodic conflicts', half: 'play', fills: ['q6'],
    plain: 'One small encounter for each worry you choose to face.' },
  transformation: { key: 'transformation', n: 7, label: 'Transformation', half: 'play', fills: ['q2'],
    plain: 'In your own words: did the feeling you wanted arrive?' },
  achievement: { key: 'achievement', n: 8, label: 'Achievement', half: 'play', fills: ['q1'],
    plain: 'The goal held, or let go with honour.' },
}

/** A bud's three beats. */
export const BUD_BEATS = ['wall', 'epiphany', 'step'] as const
export type BudBeatKey = (typeof BUD_BEATS)[number]

export const BUD_PLAIN: Record<BudBeatKey, { label: string; plain: string }> = {
  wall: { label: 'The wall', plain: 'One worry, as something you learned.' },
  epiphany: { label: 'Epiphany', plain: 'What would have to be true for this worry to loosen.' },
  step: { label: 'One step', plain: 'One thing you could do this week. It goes to the farm as a seed.' },
}

/** Challenger's cap: no more than three buds open at once. */
export const MAX_OPEN_BUDS = 3

export type BudState = 'open' | 'unplayed' | 'done'

/** A micro-encounter: three beats on one reservation. `budOf` names the encounter it grew from. */
export interface Bud {
  id: string
  budOf: string
  reservation: string
  state: BudState
  /** Q5 asked of this reservation. Kept apart from the encounter's own Q5 (`intake.q5`). */
  epiphany?: string
  /** The one step, in the player's words once they steer the draft. */
  step?: string
  /** True once the player has changed or accepted the draft; until then the step is the council's draft. */
  steered?: boolean
  /** The farm seed the step became (send-to-farm), once sent. */
  seedId?: string
}

export interface PlanStep {
  reservation: string
  /** The draft question the council puts to the player for this step; the player writes the step. */
  draft: string
  budId: string
}

/** Beat 5: Q1 x Q5 x Q6 drawn together, each reservation a step. */
export interface PlanCard {
  goal: string
  truth: string
  steps: PlanStep[]
  /** True once the player has steered the plan (Diplomat: the player must visibly steer). */
  steered: boolean
}

/** Regent's done condition for "let go with honour". */
export interface LetGo {
  /** The player's own words naming the letting go. */
  words: string
  composted: boolean
  /** A return date offered (YYYY-MM-DD). */
  returnOn?: string
}

export interface Encounter {
  id: string
  name: string
  intake: Intake
  plan?: PlanCard
  buds: Bud[]
  /** Beat 7: Q2 asked again, in the player's words. */
  transformation?: string
  /** Beat 8: either held, or let go with honour. */
  achievement?: { held: true } | { letGo: LetGo }
}

const text = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const reservations = (intake: Intake) => (intake.q6 ?? []).filter(text).map(r => r.trim())

export const budId = (encounterId: string, i: number) => `${encounterId}--bud-${i + 1}`

/** The plan's triangulation: the goal (Q1), the truth (Q5), and one drafted step per reservation (Q6). */
export function triangulatePlan(encounterId: string, intake: Intake): PlanCard {
  const truth = intake.q5?.trim() ?? ''
  return {
    goal: intake.q1?.trim() ?? '',
    truth,
    steered: false,
    steps: reservations(intake).map((r, i) => ({
      reservation: r,
      budId: budId(encounterId, i),
      draft: truth
        ? `With "${r}" in mind, what is one thing you could do this week that makes "${truth}" a little more true?`
        : `With "${r}" in mind, what is one thing you could do this week?`,
    })),
  }
}

/**
 * One bud per reservation. The first three open and the rest wait unplayed (Challenger's cap); the player may change
 * which are open with `openBud` and `setBudDown`.
 */
export function budsFor(encounterId: string, intake: Intake): Bud[] {
  return reservations(intake).map((r, i): Bud => ({
    id: budId(encounterId, i), budOf: encounterId, reservation: r, state: i < MAX_OPEN_BUDS ? 'open' : 'unplayed',
  }))
}

/** A new encounter from a done intake: its plan drafted, its buds grown, nothing yet played. */
export function encounterFromIntake(id: string, name: string, intake: Intake): Encounter {
  return { id, name, intake, plan: triangulatePlan(id, intake), buds: budsFor(id, intake) }
}

/** Open a waiting bud. Refused while three are open. */
export function openBud(buds: Bud[], id: string): Bud[] | { error: string } {
  const bud = buds.find(b => b.id === id)
  if (!bud) return { error: `no bud ${id}` }
  if (bud.state === 'open') return buds
  if (buds.filter(b => b.state === 'open').length >= MAX_OPEN_BUDS)
    return { error: `${MAX_OPEN_BUDS} buds are open; finish one or set one down first` }
  return buds.map(b => (b.id === id ? { ...b, state: 'open' } : b))
}

/** Set an open bud down unplayed: a reservation may go unplayed (Challenger). */
export function setBudDown(buds: Bud[], id: string): Bud[] {
  return buds.map(b => (b.id === id && b.state === 'open' ? { ...b, state: 'unplayed' } : b))
}

/** Regent's condition: the player's own words, the goal composted, and a return date offered. */
export function letGoIsDone(l: LetGo | undefined): boolean {
  return !!l && text(l.words) && l.composted === true && text(l.returnOn)
}

function budBeatDone(b: Bud, k: BudBeatKey): boolean {
  if (k === 'wall') return text(b.reservation)
  if (k === 'epiphany') return text(b.epiphany)
  return text(b.step) && b.steered === true
}

/** Whether a beat of the encounter is done. */
export function beatDone(e: Encounter, k: BeatKey): boolean {
  const q = e.intake
  switch (k) {
    case 'backstory': return text(q.q3) || text(q.q4)
    case 'desire': return text(q.q1) || text(q.q2)
    case 'wall': return reservations(q).length > 0
    case 'epiphany': return text(q.q5)
    case 'plan': return e.plan?.steered === true
    case 'conflicts': return e.buds.length > 0 && e.buds.every(b => b.state !== 'open')
    case 'transformation': return text(e.transformation)
    case 'achievement': {
      const a = e.achievement
      if (!a) return false
      return 'held' in a ? a.held === true : letGoIsDone(a.letGo)
    }
  }
}

/** One card in a deck. */
export interface DeckCard {
  beat: BeatKey | BudBeatKey
  n: number
  label: string
  plain: string
  done: boolean
}

/** A deck: its next card on top, the rest underneath, and what is already played. */
export interface Deck {
  id: string
  top: DeckCard | null
  under: DeckCard[]
  done: DeckCard[]
  left: number
}

function stack(id: string, cards: DeckCard[]): Deck {
  const open = cards.filter(c => !c.done)
  return { id, top: open[0] ?? null, under: open.slice(1), done: cards.filter(c => c.done), left: open.length }
}

/** The encounter's own deck (the waiting spirit), and a small deck beside it for each open bud. */
export function deckOf(e: Encounter): { spirit: Deck; buds: Deck[] } {
  const spirit = stack(e.id, BEATS.map(k => {
    const d = BEAT_DEFS[k]
    return { beat: k, n: d.n, label: d.label, plain: d.plain, done: beatDone(e, k) }
  }))
  const buds = e.buds.filter(b => b.state === 'open').map(b =>
    stack(b.id, BUD_BEATS.map((k, i) => ({ beat: k, n: i + 1, ...BUD_PLAIN[k], done: budBeatDone(b, k) }))))
  return { spirit, buds }
}

/**
 * Challenger's falsification test for light buds: if fewer than half the reservations bud a step the player would
 * take within a week, light buds fail and option B is needed. `wouldTake` is the player's own yes, keyed by bud id.
 * The count is over every reservation, played or not, as the pass wrote it.
 */
export function budTest(e: Encounter, wouldTake: Record<string, boolean>) {
  const total = e.buds.length
  const yes = e.buds.filter(b => wouldTake[b.id] === true).length
  return { total, yes, pass: total > 0 && yes * 2 >= total }
}

/** What is wrong with an encounter's shape, as it would be saved with a battle. Empty when it is sound. */
export function encounterErrors(e: unknown): string[] {
  if (!e || typeof e !== 'object') return ['an encounter is an object']
  const out: string[] = []
  const x = e as Record<string, unknown>
  if (!text(x.id)) out.push('an encounter names its id')
  if (!x.intake || typeof x.intake !== 'object') out.push('an encounter carries its intake')
  else {
    const q6 = (x.intake as Intake).q6
    if (q6 !== undefined && !(Array.isArray(q6) && q6.every(r => typeof r === 'string'))) out.push('q6 is a list of reservations')
  }
  if (!Array.isArray(x.buds)) out.push('an encounter carries its buds')
  else {
    const buds = x.buds as Partial<Bud>[]
    if (buds.some(b => !b || b.budOf !== x.id)) out.push('every bud names the encounter it grew from in budOf')
    if (buds.some(b => !b || !['open', 'unplayed', 'done'].includes(b.state as string))) out.push('a bud is open, unplayed or done')
    if (buds.filter(b => b?.state === 'open').length > MAX_OPEN_BUDS) out.push(`no more than ${MAX_OPEN_BUDS} buds are open`)
  }
  const a = x.achievement as Record<string, unknown> | undefined
  if (a && typeof a === 'object' && 'letGo' in a && !letGoIsDone(a.letGo as LetGo))
    out.push('a let-go needs the player\'s own words, the goal composted, and a return date')
  return out
}
