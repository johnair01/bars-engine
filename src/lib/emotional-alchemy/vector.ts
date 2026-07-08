/**
 * Emotional Alchemy — the Charge Diagnostic core.
 * Spec: .specify/specs/emotional-alchemy-diagnostic/spec.md
 *
 * TRANSCRIBED from docs/MTGOA_PRACTICE_ATLAS.md v3:
 *   §1.2 (vector), §1.3 (pipeline), §1.6 (privacy), §3.1 (picker + flat fork),
 *   §8 (ask-don't-infer inventory).
 *
 * Pure, deterministic, no AI, no network. The diagnostic produces a structured
 * DiagnosticResult that the composer (target 3) consumes; raw blocker/story text
 * lives only in client working state (DiagnosticAnswers) and never enters the
 * result — §1.6.
 */

import type { EmotionChannel, SatisfactionSpirit, BlockerShape } from './types'

// ── vector (§1.2) ───────────────────────────────────────────────────────────

export type Altitude = 'dissatisfied' | 'neutral' | 'satisfied'

export interface EmotionalVector {
  channel: EmotionChannel
  /** 0–10, player-rated. */
  intensity: number
  altitude: Altitude
  target: SatisfactionSpirit
}

// ── routing context (§1.3) ──────────────────────────────────────────────────

export type TimeBudget = 2 | 10 | 30
export type Temporal = 'now' | 'replay' | 'upcoming'
export type Fuel = 'depleted' | 'steady' | 'charged'

/** The raw channel tap (§3.1 picker). */
export type ChannelPick = EmotionChannel | 'flat' | 'cant_tell'

/** The four answers to the flat fork (§3.1). */
export type FlatAnswer = 'rested_calm' | 'walled_off' | 'buried' | 'grey'

/** Ally-or-target branch (§8.6). */
export type HarmRelation = 'witnessed' | 'received' | 'own_conduct'

/**
 * Felt-texture of the charge — a PLAYER-FACING display field (design handoff),
 * distinct from the composer's routing `BlockerShape`. The player picks it on
 * the defaults screen and it shows on The Read; it does not drive tool routing.
 */
export type FeltShape = 'knot' | 'weight' | 'fog' | 'spark' | 'static' | 'edge'

const DEFAULT_FELT_SHAPE: Record<EmotionChannel, FeltShape> = {
  anger: 'edge',
  sadness: 'weight',
  fear: 'static',
  joy: 'spark',
  neutrality: 'fog',
}

export function defaultFeltShape(channel: EmotionChannel): FeltShape {
  return DEFAULT_FELT_SHAPE[channel]
}

/** Layer-check outcome (§8.2). */
export type LayerAnswer = 'descended' | 'stayed' | 'declined'

/** Thread identity (§1.3 step 3). Label is a short player-authored name, not raw text. */
export type ThreadRef =
  | { kind: 'new'; label: string }
  | { kind: 'existing'; id: string; label: string }

export type DiagnosticFlag =
  | 'crisis'
  | 'hot_charge'
  | 'safety_power_over'
  | 'verified_rest'
  | 'frozen_suspected'
  | 'numbness_verified'
  | 'capture_only'
  | 'layer_descended'

export type DiagnosticStep =
  | 'blocker'
  | 'thread'
  | 'channel'
  | 'flat_fork'
  | 'cant_tell'
  | 'intensity'
  | 'time'
  | 'temporal'
  | 'fuel'
  | 'story'
  | 'layer_check'
  | 'harm_relation'
  | 'safety'
  | 'defaults'
  | 'summary'

/**
 * The composer-ready output. NB: no raw blocker/story text — §1.6. Every field
 * is an enum, number, or a short player-authored thread label.
 */
export interface DiagnosticResult {
  vector: EmotionalVector
  time: TimeBudget
  temporal: Temporal
  fuel: Fuel
  /** Confirmed blocker shape, or null when undetermined. */
  /** Internal routing hint, classified from text (composer input). */
  shape: BlockerShape | null
  shapeConfidence: 'high' | 'low'
  /** Player-facing felt texture (display only; not routing). */
  feltShape: FeltShape | null
  thread: ThreadRef
  /** Set when the harm fork fired (any anger/fear charge, or identity harm). */
  harmRelation: HarmRelation | null
  layerChecked: boolean
  flags: DiagnosticFlag[]
}

/** Client-only working state. Holds raw text; never serialized to the result. */
export interface DiagnosticAnswers {
  blocker?: string
  story?: string
  thread?: ThreadRef
  channelPick?: ChannelPick
  /** Channel confirmed at the defaults step when the pick was `flat`→walled_off or `cant_tell`. */
  channelConfirmed?: EmotionChannel
  flatAnswer?: FlatAnswer
  intensity?: number
  time?: TimeBudget
  temporal?: Temporal
  fuel?: Fuel
  layerAnswer?: LayerAnswer
  harmRelation?: HarmRelation
  safetyPowerOver?: boolean
  altitude?: Altitude
  target?: SatisfactionSpirit
  shape?: BlockerShape | null
  shapeConfidence?: 'high' | 'low'
  feltShape?: FeltShape
  captureOnly?: boolean
  crisis?: boolean
}

// ── channel → default target (§1.2; no-drift vs CAPABILITIES) ────────────────

const DEFAULT_TARGET: Record<EmotionChannel, SatisfactionSpirit> = {
  anger: 'triumph',
  sadness: 'poignance',
  fear: 'wonder',
  joy: 'bliss',
  neutrality: 'peace',
}

export function defaultTargetForChannel(channel: EmotionChannel): SatisfactionSpirit {
  return DEFAULT_TARGET[channel]
}

// ── intensity-driven defaults (visible, editable — §8.1) ─────────────────────

/** Atlas §1.3: dissatisfied when intensity ≥ 4, else neutral. Player may edit. */
export function defaultAltitude(intensity: number): Altitude {
  return intensity >= 4 ? 'dissatisfied' : 'neutral'
}

/** Atlas §4 hot-charge guard threshold. */
export function isHotCharge(intensity: number): boolean {
  return intensity >= 7
}

/**
 * Crisis range (0–10 scale): 9–10 means a practice may not be the right tool —
 * surface the "seek outside help" path. Fires in the diagnostic intensity step
 * AND on the post-practice re-rate (a rep that leaves the charge at 9–10
 * escalates, it does not just suggest "a different tool").
 */
export function isCrisisIntensity(intensity: number): boolean {
  return intensity >= 9
}

/**
 * Normalize charge-capture's 1–5 intensity onto the diagnostic's 0–10 scale
 * (hostile-review S4). Capture's max (5 = "flooding") MUST map to 10 so a
 * max-intensity captured charge can reach the crisis range — any seed built
 * from a capture BAR must pass its intensity through here.
 */
export function normalizeCaptureIntensity(oneToFive: number): number {
  const n = Math.max(1, Math.min(5, Math.round(oneToFive)))
  return Math.round((n / 5) * 10) // 1→2, 2→4, 3→6, 4→8, 5→10
}

/** Atlas §8.2 — layer check offered once at intensity ≥ 5. */
export function shouldOfferLayerCheck(intensity: number): boolean {
  return intensity >= 5
}

// ── flat fork (§3.1) ─────────────────────────────────────────────────────────

/**
 * Resolve the flat-or-numb fork. The app never maps flat → Peace automatically;
 * this is the mandatory disambiguation before Neutrality can carry a Peace target.
 */
export function resolveFlat(answer: FlatAnswer): {
  channel: EmotionChannel | null
  targetDefault: SatisfactionSpirit
  shapeHint: BlockerShape | null
  flags: DiagnosticFlag[]
} {
  switch (answer) {
    case 'rested_calm':
      // Genuine Peace — a legitimate, celebrated result.
      return { channel: 'neutrality', targetDefault: 'peace', shapeHint: null, flags: ['verified_rest', 'numbness_verified'] }
    case 'walled_off':
      // Frozen charge — route to T02 to find what froze; target undetermined.
      return { channel: null, targetDefault: 'poignance', shapeHint: 'unclear_heavy_body', flags: ['frozen_suspected', 'numbness_verified'] }
    case 'buried':
      // Earth overload (the S11 path).
      return { channel: 'neutrality', targetDefault: 'peace', shapeHint: 'many_items', flags: ['numbness_verified'] }
    case 'grey':
      // Joy-starved (the S10 path).
      return { channel: 'joy', targetDefault: 'bliss', shapeHint: 'practice_edge', flags: ['numbness_verified'] }
  }
}

// ── blocker-shape classifier (G8 — transparent, conservative, client-side) ───

/**
 * Ordered keyword scan → a shape hint. Deliberately conservative: returns
 * confidence 'low' unless a strong, unambiguous signal is present, and the UI
 * always renders the shape as an editable chip. This is a routing *bias*, not a
 * diagnosis — see Practice Atlas gap G8.
 */
const SHAPE_KEYWORDS: { shape: BlockerShape; strong: RegExp; weak?: RegExp }[] = [
  { shape: 'two_voices', strong: /\b(part of me|half of me|torn between|on one hand|two minds)\b/ },
  { shape: 'win_wont_land', strong: /\b(we won|i won|celebrat|accomplished|succeeded|good news|got housed|landed the)\b/ },
  { shape: 'practice_edge', strong: /\b(first time|learning to|get better at|practic|my first|rehears)\b/ },
  { shape: 'many_items', strong: /\b(everything|so many|too much|overwhelm|all of it|seventeen|a dozen|every single)\b/ },
  { shape: 'unclear_heavy_body', strong: /\b(can'?t tell|don'?t know what|numb|foggy|heavy in my|nothing where)\b/ },
  { shape: 'imagined_other', strong: /\b(what if they|they might|afraid they'?ll|imagine (that )?they|they would)\b/ },
  { shape: 'ready_to_act', strong: /\b(i (just )?need to|i have to do|i should just|ready to)\b/ },
  {
    shape: 'interpersonal_live',
    strong: /\b(said to me|told me|in the meeting|my boss|my manager|my coworker|talked over)\b/,
    weak: /\b(he|she|they|him|her|them|friend|partner|colleague)\b/,
  },
  { shape: 'belief_sentence', strong: /\b(nobody will|it'?s all|i always|i never|because i'?m not)\b/, weak: /\bbecause\b/ },
]

export function classifyBlockerShape(
  blocker: string,
  story?: string
): { shape: BlockerShape | null; confidence: 'high' | 'low' } {
  const text = `${blocker} ${story ?? ''}`.toLowerCase()
  for (const entry of SHAPE_KEYWORDS) {
    if (entry.strong.test(text)) return { shape: entry.shape, confidence: 'high' }
  }
  for (const entry of SHAPE_KEYWORDS) {
    if (entry.weak?.test(text)) return { shape: entry.shape, confidence: 'low' }
  }
  return { shape: null, confidence: 'low' }
}

// ── safety / harm predicates (§8.5, §8.6) ────────────────────────────────────

const SAFETY_TRIGGERS =
  /\b(my boss|my manager|my supervisor|landlord|evict|police|\bcop\b|\bice\b|deport|get fired|getting fired|lose my job|my job|livelihood|\bhr\b)\b/

const IDENTITY_HARM =
  /\b(slur|racist|sexist|homophob|transphob|microaggression|called me a|because i'?m (black|brown|gay|trans|queer|disabled|a woman)|my identity|misgender)\b/

export function detectSafetyTrigger(text: string): boolean {
  return SAFETY_TRIGGERS.test(text.toLowerCase())
}

export function detectIdentityHarm(text: string): boolean {
  return IDENTITY_HARM.test(text.toLowerCase())
}

// ── step planning (§1.3) ─────────────────────────────────────────────────────

/**
 * Ordered visible steps given answers-so-far. The component re-plans after each
 * answer and advances to the next unanswered step. Conditional forks are
 * inserted only when their trigger is present.
 */
export function planSteps(a: Partial<DiagnosticAnswers>): DiagnosticStep[] {
  const steps: DiagnosticStep[] = ['blocker', 'thread', 'channel']

  if (a.channelPick === 'flat') steps.push('flat_fork')
  if (a.channelPick === 'cant_tell') steps.push('cant_tell')

  steps.push('intensity', 'time', 'temporal', 'fuel', 'story')

  const harmText = `${a.blocker ?? ''} ${a.story ?? ''}`
  if (typeof a.intensity === 'number' && shouldOfferLayerCheck(a.intensity)) steps.push('layer_check')
  // Harm fork (§8.6 + design handoff "A careful one"): any anger/fear charge,
  // or identity-harm wording on any channel.
  if (a.channelPick === 'anger' || a.channelPick === 'fear' || detectIdentityHarm(harmText)) steps.push('harm_relation')
  if (detectSafetyTrigger(harmText)) steps.push('safety')

  steps.push('defaults', 'summary')
  return steps
}

// ── finalize (§1.6 — structured-only) ────────────────────────────────────────

function req<T>(value: T | undefined, field: string): T {
  if (value === undefined) throw new Error(`Diagnostic incomplete: missing ${field}`)
  return value
}

/**
 * Build the structured, composer-ready result. Copies only structured fields —
 * the type has no place for raw blocker/story text (§1.6). Throws if a required
 * answer is missing.
 */
export function finalizeResult(a: DiagnosticAnswers): DiagnosticResult {
  const channel = resolveEffectiveChannel(a)
  const intensity = req(a.intensity, 'intensity')
  const altitude = a.altitude ?? defaultAltitude(intensity)
  const target = a.target ?? defaultTargetForChannel(channel)

  const flags = new Set<DiagnosticFlag>()
  if (a.crisis) flags.add('crisis')
  if (isHotCharge(intensity)) flags.add('hot_charge')
  if (a.safetyPowerOver) flags.add('safety_power_over')
  if (a.captureOnly) flags.add('capture_only')
  if (a.layerAnswer === 'descended') flags.add('layer_descended')
  if (a.channelPick === 'flat' && a.flatAnswer) {
    for (const f of resolveFlat(a.flatAnswer).flags) flags.add(f)
  }

  return {
    vector: { channel, intensity, altitude, target },
    time: req(a.time, 'time'),
    temporal: req(a.temporal, 'temporal'),
    fuel: req(a.fuel, 'fuel'),
    shape: a.shape ?? null,
    shapeConfidence: a.shapeConfidence ?? 'low',
    feltShape: a.feltShape ?? defaultFeltShape(channel),
    thread: req(a.thread, 'thread'),
    harmRelation: a.harmRelation ?? null,
    layerChecked: a.layerAnswer !== undefined && a.layerAnswer !== 'declined',
    flags: [...flags],
  }
}

/**
 * The effective channel: direct pick, or the flat-fork resolution, or (for
 * walled_off / cant_tell) the channel the player confirmed at the defaults step
 * (carried on `a.channelConfirmed`).
 */
function resolveEffectiveChannel(a: DiagnosticAnswers): EmotionChannel {
  if (a.channelPick === 'flat') {
    const flat = resolveFlat(req(a.flatAnswer, 'flatAnswer'))
    return flat.channel ?? req(a.channelConfirmed, 'channelConfirmed (walled_off needs confirmation)')
  }
  if (a.channelPick === 'cant_tell') {
    return req(a.channelConfirmed, 'channelConfirmed (cant_tell needs the felt-thread handoff)')
  }
  return req(a.channelPick, 'channel') as EmotionChannel
}
