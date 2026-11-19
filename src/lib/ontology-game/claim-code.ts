import { createHash } from 'node:crypto'
import {
  CLAIM_ALTITUDES,
  CLAIM_CHANNELS,
  SATISFIED_NAMES,
  SATISFIED_SENTENCES,
  type ClaimAltitude,
  type ClaimChannel,
} from './claim-table'

export const CLAIM_CODE_PREFIX = 'OAG2.'
export const MAX_CLAIMS = 30
export const MAX_WORDS = 280

export type Claim = {
  at: number
  channel: ClaimChannel
  lens: ClaimAltitude
  named: ClaimAltitude
  words: string
}
export type Counts = {
  totalCycles: number
  channelCounts: Partial<Record<ClaimChannel, number>>
  channelsSatisfied: Partial<Record<ClaimChannel, boolean>>
}
export type DecodeResult =
  | { ok: true; claims: Claim[]; counts: Counts; build: string; codeHash: string }
  | { ok: false; reason: string }

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const fail = (reason: string): DecodeResult => ({ ok: false, reason })
const isChannel = (v: unknown): v is ClaimChannel => (CLAIM_CHANNELS as readonly unknown[]).includes(v)
const isAltitude = (v: unknown): v is ClaimAltitude => (CLAIM_ALTITUDES as readonly unknown[]).includes(v)

/** Builds an OAG2 code. The game builds its own in the browser; this twin is for tests and tools. */
export function encodeClaimCode(payload: unknown): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${CLAIM_CODE_PREFIX}${body}.${sha256(body).slice(0, 8)}`
}

/** Pure and rule-based: no model reads any field. */
export function decodeClaimCode(code: string): DecodeResult {
  if (typeof code !== 'string' || !code.startsWith(CLAIM_CODE_PREFIX)) return fail('wrong prefix')
  const rest = code.slice(CLAIM_CODE_PREFIX.length)
  const dot = rest.lastIndexOf('.')
  if (dot < 0) return fail('missing checksum')
  const body = rest.slice(0, dot)
  const sum = rest.slice(dot + 1)
  if (!/^[A-Za-z0-9_-]+$/.test(body)) return fail('bad base64')
  if (sha256(body).slice(0, 8) !== sum) return fail('checksum mismatch')
  let payload: any
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return fail('bad base64')
  }
  if (!payload || payload.v !== 2 || !Array.isArray(payload.k)) return fail('wrong shape')
  if (payload.k.length > MAX_CLAIMS) return fail('too many claims')
  const claims: Claim[] = []
  for (const row of payload.k) {
    if (!Array.isArray(row)) return fail('wrong shape')
    const [at, channel, lens, named, words] = row
    if (typeof at !== 'number' || !Number.isFinite(at)) return fail('wrong shape')
    if (!isChannel(channel)) return fail('unknown channel')
    if (!isAltitude(lens) || !isAltitude(named)) return fail('unknown altitude')
    const w = words == null ? '' : words
    if (typeof w !== 'string') return fail('wrong shape')
    if (w.length > MAX_WORDS) return fail('words too long')
    claims.push({ at, channel, lens, named, words: w })
  }
  // Polarity other than satisfied: a row may not carry a sixth field naming one.
  if (payload.k.some((r: unknown[]) => r.length > 5)) return fail('polarity other than satisfied')
  const s = payload.s ?? {}
  const channelCounts: Counts['channelCounts'] = {}
  for (const [k, v] of Object.entries(s.channelCounts ?? {})) {
    if (!isChannel(k)) return fail('unknown channel')
    if (typeof v !== 'number') return fail('wrong shape')
    channelCounts[k] = v
  }
  const channelsSatisfied: Counts['channelsSatisfied'] = {}
  for (const [k, v] of Object.entries(s.channelsSatisfied ?? {})) {
    if (!isChannel(k)) return fail('unknown channel')
    channelsSatisfied[k] = !!v
  }
  return {
    ok: true,
    claims,
    counts: { totalCycles: Number(s.totalCycles) || 0, channelCounts, channelsSatisfied },
    build: typeof payload.build === 'string' ? payload.build : '',
    codeHash: sha256(code).slice(0, 16),
  }
}

export const claimTitle = (c: ClaimChannel) => SATISFIED_NAMES[c]
export const claimSentence = (c: ClaimChannel, a: ClaimAltitude) => SATISFIED_SENTENCES[c][a]
