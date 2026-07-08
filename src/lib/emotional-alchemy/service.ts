/**
 * Emotional Alchemy — the service seam (Practice Atlas service spec, Phase 0).
 * Spec: .specify/specs/emotional-alchemy-service/spec.md
 *
 * The one contract every front door (capture, EFA, roadblock, deck, daemon)
 * hands off to. Pure + DB-free: turns a partially-known charge (an AlchemySeed)
 * into a diagnostic prefill and a canonical entry URL, and back. No UI here —
 * wiring the diagnostic to consume a seed is Phase 1.
 *
 * Privacy (§1.6): the seed carries structured fields + a barId *reference*, never
 * raw blocker/story text. Raw text stays in client state and the BAR itself.
 */

import type { EmotionChannel, MoveRole } from './types'
import type { Altitude, DiagnosticAnswers, DiagnosticFlag, EmotionalVector, ThreadRef } from './vector'
import { normalizeCaptureIntensity } from './vector'

export type AlchemySource = 'capture' | 'efa' | 'roadblock' | 'deck' | 'daemon' | 'manual'

export interface AlchemySeed {
  source: AlchemySource
  /** Pre-known channel (e.g. capture's emotion_channel). */
  channel?: EmotionChannel
  /** 0–10, already normalized (capture's 1–5 must pass through normalizeCaptureIntensity — S4). */
  intensity?: number
  /** Pre-known altitude (e.g. capture's satisfaction). */
  altitude?: Altitude
  /** Short player-authored thread name (not raw text). */
  threadLabel?: string
  /** Deck source: a pre-drawn Allyship card id → the flow can skip the draw. */
  drawnCardId?: string
  /** EFA source: the Vibes-Emergency tag (channel hint + provenance). */
  vibeTag?: string
  /** The charge BAR this practice extends (provenance + BARs logging). A reference, not text. */
  barId?: string
  /** Where to send the player after the practice. */
  returnTo?: string
}

/**
 * Structured-only log of a practice — the input to `logAlchemySession`. Mirrors
 * the AlchemySession Prisma model. NB: no raw blocker/story text (§1.6).
 */
export interface AlchemySessionInput {
  /** The charge BAR this practice extends (BARs logging provenance). */
  chargeSourceBarId?: string
  source: AlchemySource
  vectorBefore: EmotionalVector
  drawnCardId?: string
  toolId: string
  rolePath: MoveRole[]
  showUp?: { kind: 'internal' | 'external' | 'declined'; recipient?: string; date?: string; doneCheck?: boolean }
  /** Re-rate after the practice (§1.5). */
  vectorAfterIntensity?: number
  timeboxKept?: boolean
  exitedGracefully?: boolean
  threadLabel?: string
  flags: DiagnosticFlag[]
}

export const DIAGNOSE_PATH = '/practice/diagnose'

const SOURCES: AlchemySource[] = ['capture', 'efa', 'roadblock', 'deck', 'daemon', 'manual']
const CHANNELS: EmotionChannel[] = ['anger', 'sadness', 'fear', 'joy', 'neutrality']
const ALTITUDES: Altitude[] = ['dissatisfied', 'neutral', 'satisfied']

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const isSource = (v: string | null): v is AlchemySource => v !== null && (SOURCES as string[]).includes(v)
const isChannel = (v: string | null): v is EmotionChannel => v !== null && (CHANNELS as string[]).includes(v)
const isAltitude = (v: string | null): v is Altitude => v !== null && (ALTITUDES as string[]).includes(v)

/**
 * Build the diagnostic prefill from a seed. Structured fields only — the blocker
 * (raw text) is never seeded from the URL; a caller with a `barId` prefills it
 * from the BAR client-side (Phase 1). The flow starts at the first unanswered
 * step (Phase 1 wiring) so seeded steps are skipped.
 */
export function seedToAnswers(seed: AlchemySeed): Partial<DiagnosticAnswers> {
  const a: Partial<DiagnosticAnswers> = {}
  if (seed.channel) a.channelPick = seed.channel
  if (typeof seed.intensity === 'number') a.intensity = clamp(Math.round(seed.intensity), 0, 10)
  if (seed.altitude) a.altitude = seed.altitude
  if (seed.threadLabel) {
    const thread: ThreadRef = { kind: 'new', label: seed.threadLabel }
    a.thread = thread
  }
  return a
}

/**
 * Build a seed from a charge-capture BAR. Enforces S4: capture's 1–5 intensity
 * is normalized so its max (5) reaches the crisis range (→10). `satisfaction`
 * and `emotion_channel` map straight across (same enums).
 */
export function seedFromCapture(input: {
  barId: string
  channel?: EmotionChannel
  satisfaction?: Altitude
  intensityOneToFive?: number
  threadLabel?: string
  returnTo?: string
}): AlchemySeed {
  return {
    source: 'capture',
    barId: input.barId,
    channel: input.channel,
    altitude: input.satisfaction,
    intensity: typeof input.intensityOneToFive === 'number' ? normalizeCaptureIntensity(input.intensityOneToFive) : undefined,
    threadLabel: input.threadLabel,
    returnTo: input.returnTo,
  }
}

/** EFA Vibes-Emergency tag → channel hint (an editable default, not a hard inference). */
const VIBE_CHANNEL: Record<string, EmotionChannel | undefined> = {
  overwhelm: 'neutrality', // Earth overload
  'boundary-leak': 'anger', // boundaries → Fire
  'head-spin': 'fear', // anxious spin → Metal
  'self-sabotage': undefined, // belief-driven — ask
  frozen: 'fear', // freeze → Metal
  numb: undefined, // → flat path; the player taps it
  conflict: 'anger',
  other: undefined,
}

export function seedFromVibeTag(tag: string): Pick<AlchemySeed, 'channel' | 'vibeTag'> {
  return { channel: VIBE_CHANNEL[tag], vibeTag: tag }
}

/** Canonical entry URL (mirrors 321's ?chargeBarId=/?returnTo=). Only set fields are included. */
export function alchemyHref(seed: AlchemySeed): string {
  const p = new URLSearchParams()
  p.set('src', seed.source)
  if (seed.channel) p.set('ch', seed.channel)
  if (typeof seed.intensity === 'number') p.set('i', String(clamp(Math.round(seed.intensity), 0, 10)))
  if (seed.altitude) p.set('alt', seed.altitude)
  if (seed.threadLabel) p.set('thread', seed.threadLabel)
  if (seed.drawnCardId) p.set('card', seed.drawnCardId)
  if (seed.vibeTag) p.set('vibe', seed.vibeTag)
  if (seed.barId) p.set('bar', seed.barId)
  if (seed.returnTo) p.set('return', seed.returnTo)
  return `${DIAGNOSE_PATH}?${p.toString()}`
}

/** Parse the entry URL back into a seed. Validates enums; unknown source → 'manual'. */
export function seedFromParams(params: URLSearchParams): AlchemySeed {
  const src = params.get('src')
  const seed: AlchemySeed = { source: isSource(src) ? src : 'manual' }

  const ch = params.get('ch')
  if (isChannel(ch)) seed.channel = ch

  const i = params.get('i')
  if (i !== null && i.trim() !== '' && Number.isFinite(Number(i))) seed.intensity = clamp(Math.round(Number(i)), 0, 10)

  const alt = params.get('alt')
  if (isAltitude(alt)) seed.altitude = alt

  const thread = params.get('thread')
  if (thread) seed.threadLabel = thread

  const card = params.get('card')
  if (card) seed.drawnCardId = card

  const vibe = params.get('vibe')
  if (vibe) seed.vibeTag = vibe

  const bar = params.get('bar')
  if (bar) seed.barId = bar

  const ret = params.get('return')
  if (ret) seed.returnTo = ret

  return seed
}
