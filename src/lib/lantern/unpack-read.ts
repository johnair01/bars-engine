/**
 * The card back's reader (six-faces-council .specify/specs/clean-up-alchemy, FR-005, FR-018). One module serves the lantern
 * table and the Council Board's card turn: this wraps `readAll` and adds the two feeling hands, q4 (feel_now) and q2
 * (feel_want), as the palette words it heard. Pure: no language model, so it reads the same with or without AI.
 */
import { readAll, type ReadAll } from './interpret'
import { STATE, CHANNELS, type Channel } from './engine'
import { DISSATISFACTION_OPTIONS, SATISFACTION_OPTIONS } from '../quest-grammar/unpacking-constants'

/** The board's feeling hands, by channel (cua-feelings-sort): the one copy the card back draws. */
export const FEEL_NOW: Record<Channel, string[]> = {
  metal: ['scared', 'anxious', 'worried', 'overwhelmed'],
  fire: ['frustrated', 'stuck'],
  water: ['disappointed', 'isolated'],
  earth: ['numb', 'empty'],
  wood: ['craving'],
}
export const FEEL_WANT: Record<Channel, string[]> = {
  wood: ['delighted', 'energized', 'free'],
  fire: ['triumphant', 'proud'],
  earth: ['peaceful', 'fulfilled'],
  metal: ['excited', 'relieved'],
  water: ['poignant', 'blissful'],
}

export const MAX_TEXT = 2000
export const MAX_LEXICON_WORDS = 200

export type Lexicon = Partial<Record<Channel, string[]>>

export interface UnpackRead extends ReadAll {
  feel_now: string[]
  feel_want: string[]
}

const esc = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const has = (low: string, w: string) => new RegExp(`(?:^|[^a-z'])${esc(w)}(?:s|es|ed|d|ing|ly)?(?![a-z])`).test(low)

/** Reads lexicon from a request body; null when it is malformed or over 200 words. */
export function parseLexicon(raw: unknown): Lexicon | null {
  if (raw === undefined) return {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out: Lexicon = {}
  let n = 0
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!(CHANNELS as readonly string[]).includes(k) || !Array.isArray(v)) return null
    const ws = v.map(w => (typeof w === 'string' ? w.trim().toLowerCase() : '')).filter(Boolean)
    n += ws.length
    if (n > MAX_LEXICON_WORDS) return null
    out[k as Channel] = ws
  }
  return out
}

/** Pencil the six answers and the two feeling hands from one text; his own lexicon words count as that channel's q4 feeling. */
export function unpackRead(text: string, lexicon: Lexicon = {}): UnpackRead {
  const base = readAll(text)
  const low = text.toLowerCase()
  const now = new Set<string>(), want = new Set<string>()
  const heard = [...base.heard]
  for (const c of CHANNELS) {
    for (const w of FEEL_NOW[c]) if (has(low, w)) now.add(w)
    for (const w of FEEL_WANT[c]) if (has(low, w)) want.add(w)
    for (const w of lexicon[c] ?? []) if (has(low, w)) { now.add(FEEL_NOW[c][0]); if (!heard.includes(w)) heard.push(w) }
  }
  // the engine's own names for the dissatisfied states (Frustration, Anxiety, Despair, Apathy, Craving) pencil the same hand
  for (const c of CHANNELS) if (has(low, STATE[c][0].toLowerCase())) now.add(FEEL_NOW[c][0])
  const order = (ws: Set<string>, all: readonly string[]) => [...ws].sort((a, b) => all.indexOf(a) - all.indexOf(b))
  const channel = base.channel ?? (CHANNELS.find(c => FEEL_NOW[c].some(w => now.has(w))) ?? null)
  return {
    ...base,
    heard,
    channel,
    feel_now: order(now, DISSATISFACTION_OPTIONS),
    feel_want: order(want, SATISFACTION_OPTIONS),
  }
}
