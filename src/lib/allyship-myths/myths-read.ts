/**
 * Myths Read — the allyship myth diagnostic (content + scorer).
 * Spec: .specify/specs/mtgoa-sales-letter/ (Open Dependency, now closed)
 * Authoritative source: Claude Design handoff `design_handoff_myths_read/`
 *   - logic_spec_reference.md (§2 taxonomy, §3 items, §4 scoring, §9 data model)
 *   - README.md (result content contract, strength labels)
 *
 * This is the *quiz* — distinct from `ALLYSHIP_MYTHS` in ./myths.ts, which is the
 * reframe-card beat used by /campaign/[ref]/begin. This diagnostic sorts a reader
 * into the top myths running them from real behavioral answers, then routes them to
 * the Deck (first yes) and the book (deeper yes).
 *
 * Design ethic — the quiz is the counter-con: items measure real behavior/felt
 * experience, never flattering "which ally are you" identity. Pure + deterministic;
 * no AI on the reader path. Keep myth/item ids stable — they are persisted.
 */

/** The ten myths (surface layer — shown to the reader). */
export type MythId = 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7' | 'M8' | 'M9' | 'M10'

/** The six root beliefs (deep layer — stored, never shown on the result screen). */
export type RootBelief =
  | 'not_good_enough'
  | 'not_ready'
  | 'insignificant'
  | 'not_capable'
  | 'not_worthy'
  | 'dont_belong'

export interface MythContent {
  /** Stable id — persisted on the read record. */
  id: MythId
  /** The claim on the card face, e.g. `Allyship means being good.` (no quotes). */
  claim: string
  /** Short label for the charge chip, e.g. `being good`. */
  short: string
  /** One-line diagnosis (card reveal). */
  diagnosis: string
  /** Where the book takes it apart — human chapter label, e.g. `Ch 0`. */
  chapter: string
  /** The mechanism / resolution text (reveal + book-spread map). */
  mechanism: string
  /** The micro-action reframe — "one move now". */
  move: string
  /** Root belief this myth bargains against (internal). */
  rootBelief: RootBelief
}

/**
 * The 10 myths. Copy is authoritative from the Claude Design handoff and final
 * unless the content team revises it.
 */
export const MYTHS: Record<MythId, MythContent> = {
  M1: {
    id: 'M1',
    claim: 'Allyship means being good.',
    short: 'being good',
    diagnosis: 'A private trial where the other person becomes your evidence.',
    chapter: 'Ch 0',
    mechanism: 'The redefinition + the counter-con (Token/Ticket).',
    move: 'Name the verdict you’re trying to win.',
    rootBelief: 'not_good_enough',
  },
  M2: {
    id: 'M2',
    claim: 'Allyship means saying the right words.',
    short: 'right words',
    diagnosis: 'Fluency that signals safety without proving it.',
    chapter: 'Ch 2',
    mechanism: 'The Shaman: the felt record under the language.',
    move: 'Name one thing you feel that you have no vocabulary for.',
    rootBelief: 'not_ready',
  },
  M3: {
    id: 'M3',
    claim: 'Allyship means helping the less powerful.',
    short: 'the less powerful',
    diagnosis: 'Turns a person into a project. That’s charity.',
    chapter: 'Ch 0',
    mechanism: 'The redefinition (charity vs. allyship).',
    move: 'Name where the mutuality is.',
    rootBelief: 'insignificant',
  },
  M4: {
    id: 'M4',
    claim: 'Allyship means following the right people.',
    short: 'the right people',
    diagnosis: 'Discernment surrendered to someone’s authority.',
    chapter: 'Ch 3',
    mechanism: 'The Challenger: keep your discernment or you’re staff.',
    move: 'Name one thing you disagreed with and swallowed.',
    rootBelief: 'not_capable',
  },
  M5: {
    id: 'M5',
    claim: 'Allyship means sacrificing yourself.',
    short: 'sacrificing yourself',
    diagnosis: 'Self-abandonment that sends an invoice.',
    chapter: 'Ch 0',
    mechanism: 'The Token System + self-allyship.',
    move: 'Name what actually refills you.',
    rootBelief: 'not_worthy',
  },
  M6: {
    id: 'M6',
    claim: 'Allyship means never causing harm.',
    short: 'never causing harm',
    diagnosis: 'Innocence protected by never moving.',
    chapter: 'Ch 6',
    mechanism: 'The Diplomat, the Repairer channel: repair + the game frame.',
    move: 'Name a rupture you’ve been avoiding repairing.',
    rootBelief: 'dont_belong',
  },
  M7: {
    id: 'M7',
    claim: 'Allyship means fixing the problem.',
    short: 'fixing it',
    diagnosis: 'Wanting it more than they do; help curdles to pressure.',
    chapter: 'Ch 0',
    mechanism: 'The Gates + Emotional Alchemy (the wound-bridge).',
    move: 'Name the charge under your urge to fix.',
    rootBelief: 'not_capable',
  },
  M8: {
    id: 'M8',
    claim: 'Allyship means having the right framework.',
    short: 'the right framework',
    diagnosis: 'The map becomes the destination.',
    chapter: 'Ch 7',
    mechanism: 'The Sage: seeing that replaces acting + Two Readings.',
    move: 'Name a pattern you see clearly and still haven’t moved on.',
    rootBelief: 'not_good_enough',
  },
  M9: {
    id: 'M9',
    claim: 'Allyship means being seen doing it.',
    short: 'being seen',
    diagnosis: 'Optics on someone else’s ledger.',
    chapter: 'Ch 0',
    mechanism: 'The Ticket System: optics aren’t tickets.',
    move: 'Name a move you’d make if no one saw.',
    rootBelief: 'dont_belong',
  },
  M10: {
    id: 'M10',
    claim: 'Allyship means paying down what you owe.',
    short: 'a debt to pay',
    diagnosis: 'An inherited, unpayable debt.',
    chapter: 'Ch 0',
    mechanism: 'The infinite-game frame.',
    move: 'Name what accurate accounting would actually say.',
    rootBelief: 'not_worthy',
  },
}

/** Stable myth order for the "whole board" map (M1…M10). */
export const MYTH_IDS: readonly MythId[] = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10']

export interface QuizItem {
  /** Stable id — persisted with the answer. */
  id: string
  /** The behavioral statement, answered on the 0–4 frequency scale. */
  text: string
  /** Myth weights: myth id → weight. Primary = 1.0, cross-load = 0.5. */
  weights: Partial<Record<MythId, number>>
}

/**
 * The 12 items. Order is the presentation order. q10 cross-loads (M9 full + M1
 * half); M7 (q7,q12) and M8 (q8,q9) each carry two items.
 */
export const QUIZ_ITEMS: readonly QuizItem[] = [
  { id: 'q1', text: 'When I do something for a cause, some part of me is quietly checking whether it makes me a good person.', weights: { M1: 1 } },
  { id: 'q2', text: 'I relax in a room once I’ve heard people use the right language — I know I’m safe there.', weights: { M2: 1 } },
  { id: 'q3', text: 'I feel most useful when I’m helping someone who clearly can’t help themselves.', weights: { M3: 1 } },
  { id: 'q4', text: 'When someone with more standing or lived experience takes a position, I go along with it even when something in me disagrees.', weights: { M4: 1 } },
  { id: 'q5', text: 'I gauge whether I did enough by how drained I feel afterward.', weights: { M5: 1 } },
  { id: 'q6', text: 'I’d rather stay quiet than risk saying the wrong thing and being seen as harmful.', weights: { M6: 1 } },
  { id: 'q7', text: 'When someone I care about is struggling, I keep offering my solution even after they’ve stopped asking for it.', weights: { M7: 1 } },
  { id: 'q8', text: 'Before I act, I reach for a framework or an analysis so I feel like I’m standing on solid ground.', weights: { M8: 1 } },
  { id: 'q9', text: 'I understand my own patterns far better than I actually change them.', weights: { M8: 1 } },
  { id: 'q10', text: 'It matters to me that the right people notice I showed up.', weights: { M9: 1, M1: 0.5 } },
  { id: 'q11', text: 'I carry a sense that I owe something for advantages I didn’t earn, and that I have to keep paying it down.', weights: { M10: 1 } },
  { id: 'q12', text: 'It’s hard for me to let someone struggle when I’m sure I know what would help.', weights: { M7: 1 } },
] as const

/**
 * Canonical priority order for tie-breaks (§4). Weighted toward the reader's
 * likely-dominant myths (Framework, Fixer first).
 */
const CANONICAL_ORDER: readonly MythId[] = ['M8', 'M7', 'M1', 'M5', 'M6', 'M4', 'M2', 'M3', 'M9', 'M10']

/** Below this pct, ranks 2 and 3 are dropped from the surfaced set (§4 floor rule). */
export const SURFACE_FLOOR = 0.4

export type StrengthLabel = 'Loud' | 'Clear' | 'Faint'

/** Strength label from a myth's pct (README result contract). */
export function strengthLabel(pct: number): StrengthLabel {
  if (pct >= 0.72) return 'Loud'
  if (pct >= 0.55) return 'Clear'
  return 'Faint'
}

/**
 * The five Wuxing charge flavors for the Emotional Alchemy bridge on the result
 * screen (mirrors the deck's daily check-in). `element` keys the --bars-{element}
 * tokens; `route` is the scene the metabolize CTA would carry the seeded BAR to
 * (stubbed to the Deck for the sales-page MVP — see spec FR3a).
 */
export type ElementKey = 'water' | 'fire' | 'metal' | 'earth' | 'wood'

export interface ChargeFlavor {
  key: 'sadness' | 'anger' | 'fear' | 'numbness' | 'restlessness'
  sigil: string
  label: string
  sub: string
  element: ElementKey
  route: string
  /** Move phrasing folded into the seeded-BAR summary. */
  move: string
}

export const CHARGE_FLAVORS: readonly ChargeFlavor[] = [
  { key: 'sadness', sigil: '水', label: 'Sadness', sub: 'Heavy — grief, something feels distant', element: 'water', route: 'Emotional First Aid', move: 'metabolize it (3·2·1)' },
  { key: 'anger', sigil: '火', label: 'Anger', sub: 'Heated — a boundary’s been crossed', element: 'fire', route: 'Adventure', move: 'take the concrete move' },
  { key: 'fear', sigil: '金', label: 'Fear', sub: 'Anxious — dread, bracing for it', element: 'metal', route: 'the Diplomat', move: 'open the hard conversation' },
  { key: 'numbness', sigil: '土', label: 'Numbness', sub: 'Shut down — going through the motions', element: 'earth', route: 'Capture a Charge', move: 'name it so it stops running you' },
  { key: 'restlessness', sigil: '木', label: 'Restlessness', sub: 'Forced — performing okay-ness', element: 'wood', route: 'Growth Scene', move: 'rehearse the move low-stakes' },
] as const

/** The five intensity steps for the charge panel. */
export const CHARGE_INTENSITIES = [
  { value: 2, label: 'Faint', readout: 'barely there' },
  { value: 4, label: 'Mild', readout: 'noticeable' },
  { value: 6, label: 'Live', readout: 'right at the surface' },
  { value: 8, label: 'Heavy', readout: 'it colors everything' },
  { value: 10, label: 'Overwhelming', readout: 'hard to think past' },
] as const

export interface MythScore {
  myth: MythId
  /** raw = Σ(value × weight). */
  raw: number
  /** pct = raw / (4 × Σweights), 0–1, comparable across myths. */
  pct: number
  /** Largest single item contribution (value × weight) to this myth — tie-break. */
  peak: number
  strength: StrengthLabel
}

export interface MythOutcome {
  /** All ten myths ranked (pct desc, tie-broken) — for the whole-board map. */
  ranked: MythScore[]
  /** The surfaced myths (1–3) after the floor rule — the result cards. */
  surfaced: MythScore[]
  /** Root beliefs derived from surfaced myths (internal — stored, not shown). */
  rootBeliefs: RootBelief[]
}

/**
 * Score a set of answers into the ranked + surfaced myths.
 *
 * @param answers item id → value (0–4). Missing items count as 0. Out-of-range
 *   values are clamped to [0,4].
 */
export function scoreMythRead(answers: Record<string, number>): MythOutcome {
  const raw: Record<MythId, number> = { M1: 0, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0, M7: 0, M8: 0, M9: 0, M10: 0 }
  const maxByMyth: Record<MythId, number> = { M1: 0, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0, M7: 0, M8: 0, M9: 0, M10: 0 }
  const peak: Record<MythId, number> = { M1: 0, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0, M7: 0, M8: 0, M9: 0, M10: 0 }

  for (const item of QUIZ_ITEMS) {
    const rawValue = answers[item.id] ?? 0
    const value = Math.max(0, Math.min(4, rawValue))
    for (const [myth, weight] of Object.entries(item.weights) as [MythId, number][]) {
      const contribution = value * weight
      raw[myth] += contribution
      maxByMyth[myth] += 4 * weight
      if (contribution > peak[myth]) peak[myth] = contribution
    }
  }

  const ranked: MythScore[] = MYTH_IDS.map((myth) => {
    const pct = maxByMyth[myth] > 0 ? raw[myth] / maxByMyth[myth] : 0
    return { myth, raw: raw[myth], pct, peak: peak[myth], strength: strengthLabel(pct) }
  }).sort((a, b) => {
    if (b.pct !== a.pct) return b.pct - a.pct
    if (b.peak !== a.peak) return b.peak - a.peak
    return CANONICAL_ORDER.indexOf(a.myth) - CANONICAL_ORDER.indexOf(b.myth)
  })

  // Floor rule: always keep rank 1; keep ranks 2 and 3 only if pct ≥ floor.
  const surfaced = ranked.slice(0, 3).filter((score, index) => index === 0 || score.pct >= SURFACE_FLOOR)

  const rootBeliefs = Array.from(new Set(surfaced.map((s) => MYTHS[s.myth].rootBelief)))

  return { ranked, surfaced, rootBeliefs }
}
