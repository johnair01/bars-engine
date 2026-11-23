/**
 * The seed packet: the six unpacking questions run inside the gate walk (design pass satisfaction-crops-2026-11-16).
 * Pure. The labels are UNPACKING_QUESTIONS' own, word for word; the stranger wording and presets are the coaching
 * walk's (unpacking-walk.ts). Nothing here writes new questions.
 */
import { UNPACKING_QUESTIONS } from '@/lib/quest-grammar/unpacking-constants'
import { BELIEFS, DISSATISFACTIONS, EMPTY_WALK, jobsFor, type Channel } from '@/lib/coaching/unpacking-walk'
import { CHANNELS, makeCrop, type Crop, type Domain } from '@/lib/between/crops'
import { FEELINGS, SEEDS, WEATHER_HELPER, stuckPath, type PathMove, type Seed, type SoilId } from './content'

export const PACKET_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const
export type PacketKey = (typeof PACKET_KEYS)[number]

/** The six side labels, word for word from UNPACKING_QUESTIONS. */
export function packetLabels(): Record<PacketKey, string> {
  const out = {} as Record<PacketKey, string>
  for (const q of UNPACKING_QUESTIONS) out[q.key] = q.label
  return out
}
export { WEATHER_HELPER }

export interface Packet {
  /** question 1: a domain seed, or the player's own words (form 'own') */
  seed: Domain | 'own' | null
  own: string
  /** the picture tap on a write-your-own seed, or the question 2 pick for a preset seed */
  family: Channel | null
  soil: SoilId | null
  /** question 4: the first dissatisfied state picked sets where the stuck path starts */
  weather: string[]
  water: string
  stone: { belief: string; set: boolean } | null
}
export const EMPTY_PACKET: Packet = { seed: null, own: '', family: null, soil: null, weather: [], water: '', stone: null }

/** The crop of a packet. An own seed has a crop only after the picture tap sets a family; a skipped Q2 leaves none. */
export function cropOf(p: Packet): Crop | undefined {
  return p.seed ? makeCrop(p.family, p.seed) : undefined
}

/** The seed's help (its next step and act). An own seed has its own lines in content.ts (OWN_SEED). */
export function seedOf(p: Packet): Seed | undefined {
  return SEEDS.find((s) => s.domain === p.seed)
}

/** The channel the first question 4 pick sits under, where the stuck path starts. Null when question 4 was skipped. */
export function weatherChannel(state: string): Channel | null {
  return DISSATISFACTIONS.find((d) => d.state === state)?.channel ?? null
}
export function stuckStart(p: Packet): Channel | null {
  return p.weather.length ? weatherChannel(p.weather[0]) : null
}

/** The family the walk steers toward. Question 2 skipped means rest (Peace): fallow is fine. */
export function targetChannel(p: Packet): Channel {
  return p.family ?? 'neutrality'
}

/** The stuck path from a tapped object to the crop's family. The edges are stuckPath's own. */
export function pathFor(from: Channel, p: Packet): PathMove[] {
  return stuckPath(from, targetChannel(p))
}

/** Question 5's pencil answers: the job of each feeling picked at question 4 (jobsFor), and the player adds their own. */
export function waterOptions(p: Packet): string[] {
  const walk = { ...EMPTY_WALK, feels: p.weather }
  return jobsFor(walk).map((j) => j.job)
}

/** Question 6 shows one belief first; the rest open on "show the others". */
export function firstBelief(p: Packet): string {
  const i = p.seed ? (SEEDS.findIndex((s) => s.domain === p.seed) + 1) % BELIEFS.length : 0
  return BELIEFS[i].belief
}

/** Whether a channel id is one of the walk's five. */
export const isChannel = (v: unknown): v is Channel => (CHANNELS as ReadonlyArray<unknown>).includes(v)

/** The satisfied feeling's id for the walk's places and keepsake. */
export const feelingFor = (p: Packet) => FEELINGS.find((f) => f.id === targetChannel(p))!.id
