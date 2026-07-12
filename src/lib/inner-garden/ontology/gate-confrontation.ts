/**
 * Inner Garden — Gate Confrontation (multi-channel blocker & route-hand capacity).
 *
 * Spec: .specify/specs/inner-garden-blocker-route-hand/spec.md
 *
 * A blocker is a SET of channel-threads (1..5, ≤ one per channel), each a climb from a
 * present emotional state toward that channel's satisfaction spirit. The required capacity
 * is a ROUTE-HAND (one move per thread). This replaces the old single-vector model, which
 * dropped altitude on cross-channel edges and over-granted a whole class from one capacity.
 *
 * Design (user decisions 2026-07-12):
 *  - Neutral suffices: a thread resolves at dissatisfied→neutral (metabolize = insight); the
 *    satisfaction spirit is OPTIONAL depth (transcend → the satisfaction fruit).
 *  - Player-reported thread count (≤ 5). Blockers are OPTIONAL — action needs no blocker; a
 *    blocker is self-reported or inferred (a planted seed left un-actioned past the window).
 *  - Capacity keys are altitude-preserving — no lossy collapse.
 *
 * Channels/spirits mirror `emotional-alchemy` (kept local to stay pure + tsx-testable).
 * Pure functions. No I/O, no render.
 */

// --- vocabulary (mirror of emotional-alchemy canonical enums) ---
export type EmotionChannel = 'anger' | 'sadness' | 'fear' | 'joy' | 'neutrality'
export type SatisfactionSpirit = 'triumph' | 'poignance' | 'wonder' | 'bliss' | 'peace'
export type Altitude = 'dissatisfied' | 'neutral' | 'satisfied'
export type MoveRole = 'metabolize' | 'translate' | 'transcend'

export const CHANNEL_SPIRIT: Record<EmotionChannel, SatisfactionSpirit> = {
  anger: 'triumph',
  sadness: 'poignance',
  fear: 'wonder',
  joy: 'bliss',
  neutrality: 'peace',
}
export const SPIRIT_CHANNEL: Record<SatisfactionSpirit, EmotionChannel> = {
  triumph: 'anger',
  poignance: 'sadness',
  wonder: 'fear',
  bliss: 'joy',
  peace: 'neutrality',
}

/** One vector-edge a charge is stuck on: a channel climbing toward its (aspirational) spirit. */
export interface ChannelThread {
  channel: EmotionChannel
  presentAltitude: Altitude
  /** Aspirational spirit; reaching NEUTRAL already resolves the thread. */
  target: SatisfactionSpirit
}

/** A blocker = 1..5 threads (≤ one per channel). */
export type BlockerSignature = ChannelThread[]

export type BlockerOrigin = 'self_reported' | 'inferred'
export interface Blocker {
  origin: BlockerOrigin
  threads: BlockerSignature
}

/**
 * A capacity is keyed by the exact edge it crosses — altitude-preserving, so owning one
 * never collapses a distinct climb:
 *   metabolize:<channel>          dissatisfied → neutral
 *   transcend:<channel>-><spirit> neutral → satisfied
 *   translate:<from>-><to>        cross-channel (at neutral)
 */
export type CapacityKey = string

/** The moves one thread needs, split into REQUIRED (to neutral) vs OPTIONAL depth (to spirit). */
export function threadRouteHand(t: ChannelThread): { required: CapacityKey[]; optional: CapacityKey[] } {
  const spiritChannel = SPIRIT_CHANNEL[t.target]
  const metabolize = `metabolize:${t.channel}`

  if (spiritChannel === t.channel) {
    // within-channel climb: (dissatisfied→neutral) then optional (neutral→spirit)
    const required = t.presentAltitude === 'dissatisfied' ? [metabolize] : []
    const optional = [`transcend:${t.channel}->${t.target}`]
    return { required, optional }
  }

  // cross-channel: metabolize (if stuck) → translate to the target channel (both required),
  // then optionally transcend that channel to its spirit.
  const required = [
    ...(t.presentAltitude === 'dissatisfied' ? [metabolize] : []),
    `translate:${t.channel}->${spiritChannel}`,
  ]
  const optional = [`transcend:${spiritChannel}->${t.target}`]
  return { required, optional }
}

/** Every thread's REQUIRED (to-neutral) moves — the hand that clears the blocker. */
export function requiredRouteHand(threads: BlockerSignature): CapacityKey[] {
  const keys = new Set<CapacityKey>()
  for (const t of threads) for (const k of threadRouteHand(t).required) keys.add(k)
  return [...keys]
}

export type GatePath = 'task' | 'school' | 'craft'

export interface ThreadResolution {
  thread: ChannelThread
  reachedNeutral: boolean // required step(s) owned — the thread is resolved
  reachedSpirit: boolean // optional depth owned too
  path: GatePath // for the next unmet step
}

/**
 * Per-thread resolution. A thread resolves when its REQUIRED (to-neutral) capacities are
 * owned; the blocker resolves only when EVERY thread does. Owning one thread's capacity
 * must NOT resolve a blocker whose other threads are unmet.
 */
export function resolveBlocker(
  threads: BlockerSignature,
  owned: ReadonlySet<CapacityKey>,
  library: ReadonlySet<CapacityKey> = new Set(),
): { resolved: boolean; threads: ThreadResolution[] } {
  const results: ThreadResolution[] = threads.map(t => {
    const { required, optional } = threadRouteHand(t)
    const reachedNeutral = required.every(k => owned.has(k))
    const reachedSpirit = reachedNeutral && optional.every(k => owned.has(k))
    const nextUnmet = required.find(k => !owned.has(k)) ?? optional.find(k => !owned.has(k))
    const path: GatePath = nextUnmet == null ? 'task' : library.has(nextUnmet) ? 'school' : 'craft'
    return { thread: t, reachedNeutral, reachedSpirit, path }
  })
  return { resolved: results.every(r => r.reachedNeutral), threads: results }
}

/** Grant a capacity into the player's permanent slots. */
export function earnCapacity(owned: ReadonlySet<CapacityKey>, capacity: CapacityKey): Set<CapacityKey> {
  return new Set(owned).add(capacity)
}

/** The metabolic role of a concrete demonstrated step (used by the demonstration bar). */
export function roleForStep(
  channel: EmotionChannel,
  pre: Altitude,
  _post: Altitude,
  postChannel?: EmotionChannel,
): MoveRole {
  if (postChannel && postChannel !== channel) return 'translate'
  return pre === 'dissatisfied' ? 'metabolize' : 'transcend'
}

// --- decomposition (AI-drafted, player-ratified) ---

/**
 * Read a blocker's channels from its own language. This deterministic keyword scaffold is
 * the TYPED SEAM where the real AI draft plugs in; the player always confirms/edits the
 * threads (they self-report). Caps at 5 (one per channel). "I keep avoiding the hard email"
 * → fear (avoidance) + anger (hard).
 */
const KEYWORD_CHANNEL: ReadonlyArray<readonly [RegExp, EmotionChannel]> = [
  [/avoid|afraid|scared|anxious|anxiet|worry|nervous|dread|fear/i, 'fear'],
  [/hard|anger|angry|frustrat|resent|unfair|irritat|furious|rage/i, 'anger'],
  [/sad|grief|griev|loss|lonely|miss|hurt|heavy|down/i, 'sadness'],
  [/stuck|numb|flat|bored|meh|blank|apath|indifferent/i, 'neutrality'],
  [/excit|eager|thrill|joy|can'?t wait/i, 'joy'],
]

export function decomposeBlockerFromText(text: string): { draft: BlockerSignature; rationale: string } {
  const channels: EmotionChannel[] = []
  for (const [re, ch] of KEYWORD_CHANNEL) {
    if (re.test(text) && !channels.includes(ch)) channels.push(ch)
  }
  const draft: BlockerSignature = channels.slice(0, 5).map(channel => ({
    channel,
    presentAltitude: 'dissatisfied' as Altitude,
    target: CHANNEL_SPIRIT[channel],
  }))
  const rationale = draft.length
    ? `Read ${draft.map(t => `${t.channel}→${t.target}`).join(', ')} from the language — confirm or edit; you self-report the threads.`
    : 'No clear channel read — name the threads yourself.'
  return { draft, rationale }
}

// --- inferred blockers (Pressure 2 of the action economy) ---

export const DEFAULT_STAGNATION_WINDOW_DAYS = 3

/**
 * A planted seed left un-actioned past the stagnation window earns an INFERRED blocker
 * (one thread on the seed's channel). Returns null within the window. Player cadence
 * overrides `windowDays`. Blockers are optional: absence of one means act freely.
 */
export function inferBlockerForStagnantSeed(
  seed: { plantedChannel: EmotionChannel; daysSinceAction: number },
  windowDays: number = DEFAULT_STAGNATION_WINDOW_DAYS,
): Blocker | null {
  if (seed.daysSinceAction < windowDays) return null
  return {
    origin: 'inferred',
    threads: [{ channel: seed.plantedChannel, presentAltitude: 'dissatisfied', target: CHANNEL_SPIRIT[seed.plantedChannel] }],
  }
}
