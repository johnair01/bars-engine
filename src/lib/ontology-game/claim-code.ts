// Decoder for the ontology game's OAG2. claim code (spec ontology-game-bar-claim).
// Pure and rule-based: no model reads any field. The browser encodes in
// content/ontology-game/game.jsx (encodeClaimCode); this file must agree with it.
import { createHash } from 'node:crypto'

export const CLAIM_CHANNELS = ['anger', 'fear', 'sadness', 'joy', 'neutrality'] as const
export const CLAIM_ALTITUDES = ['magenta', 'red', 'amber', 'orange', 'green', 'teal'] as const

export const SATISFIED_NAME: Record<string, string> = {
  anger: 'Triumph',
  fear: 'Wonder',
  sadness: 'Poignance',
  joy: 'Bliss',
  neutrality: 'Peace',
}

// Frozen copy of stems[channel][altitude].satisfied from game.jsx.
export const SATISFIED_SENTENCES: Record<string, Record<string, string>> = {
  "anger": {
    "magenta": "Presence blazes back open between us, and I move toward it, not against it.",
    "red": "I chose to move, and my force is doing exactly what I asked of it.",
    "amber": "The right order is restored, or I've rightly broken with the law that no longer deserves my loyalty.",
    "orange": "I see the mechanism now, and the heat cools into a plan that actually works.",
    "green": "The voice is in the room now, and the whole conversation is better for it.",
    "teal": "I see how I fit into the larger unfolding, and I move with it instead of bracing against it."
  },
  "sadness": {
    "magenta": "The presence comes back into reach, and I'm with what I love again.",
    "red": "I rebuild what's true about my power from what actually held, not from the image that broke.",
    "amber": "I've found my right relation to the group again, or I've knowingly chosen to stand apart from it.",
    "orange": "My values come into focus, and what I do finally matches what I actually care about.",
    "green": "I feel seen in what I care about, and I can see how everyone else holds it too.",
    "teal": "I see how this loss is teaching the whole system something it needed to learn."
  },
  "joy": {
    "magenta": "Aliveness floods back between us, and the boundary between me and what I love goes thin.",
    "red": "My force is live and animated again, and I feel my own capacity moving.",
    "amber": "I'm fully alive, and the order I answer to holds anyway — it was never actually against me.",
    "orange": "I understand what lets me be fully alive, and now I know how to get back here on purpose.",
    "green": "All of me is in the room now, seen and wanted, not just tolerated.",
    "teal": "I see exactly how my aliveness serves the larger pattern, and it stops feeling like a cost."
  },
  "fear": {
    "magenta": "The rupture holds without breaking me, and wonder opens up where the threat was.",
    "red": "I have the power to hold this boundary, even without needing to force anything through it.",
    "amber": "The sacred boundary holds, and I'm not the only one holding it up.",
    "orange": "I understand the limits of my own method, and that understanding is itself the ground I needed.",
    "green": "All the wisdom in the room is present and weighted rightly, and nothing had to be silenced to get there.",
    "teal": "I see that what refuses to integrate was already whole, and my need to integrate it was the only thing missing."
  },
  "neutrality": {
    "magenta": "I'm separate and held at the same time, and the ground has presence again.",
    "red": "My force is still mine, held in reserve, ready for the next real thing without needing to prove it now.",
    "amber": "I'm the ballast holding what's true, and I can trust that the order will carry what needs carrying.",
    "orange": "I'm the mirror the system uses to see itself, and the detached view is its own kind of peace.",
    "green": "I'm holding plural truths at once without collapsing any of them, and that container itself is alive.",
    "teal": "I see how the whole system is learning through exactly this, and the stillness turns out to be part of it."
  }
}

export const CLAIM_CODE_PREFIX = 'OAG2.'
export const MAX_CLAIMS = 30
export const MAX_WORDS = 280

export type Claim = {
  at: number
  channel: string
  lens: string
  named: string
  words: string
}
export type ClaimCounts = {
  totalCycles: number
  channelCounts: Record<string, number>
  channelsSatisfied: Record<string, unknown>
}
export type DecodeResult =
  | { ok: true; claims: Claim[]; counts: ClaimCounts; build: string; codeHash: string }
  | { ok: false; reason: string }

const fail = (reason: string): DecodeResult => ({ ok: false, reason })

export function decodeClaimCode(code: string): DecodeResult {
  if (typeof code !== 'string' || !code.startsWith(CLAIM_CODE_PREFIX)) return fail('wrong prefix')
  const rest = code.slice(CLAIM_CODE_PREFIX.length)
  const dot = rest.lastIndexOf('.')
  if (dot < 0) return fail('missing checksum')
  const body = rest.slice(0, dot)
  const sum = rest.slice(dot + 1)
  if (!/^[A-Za-z0-9_-]+$/.test(body)) return fail('bad base64')
  const expect = createHash('sha256').update(body).digest('hex').slice(0, 8)
  if (sum !== expect) return fail('checksum mismatch')
  let payload: any
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return fail('bad base64')
  }
  if (!payload || payload.v !== 2 || !Array.isArray(payload.k)) return fail('bad shape')
  if (payload.k.length > MAX_CLAIMS) return fail('too many claims')
  const claims: Claim[] = []
  for (const row of payload.k) {
    if (!Array.isArray(row) || row.length < 4) return fail('bad shape')
    const [at, channel, lens, named, words] = row
    if (typeof at !== 'number' || !Number.isFinite(at)) return fail('bad shape')
    if (!(CLAIM_CHANNELS as readonly string[]).includes(channel)) return fail('unknown channel')
    if (!(CLAIM_ALTITUDES as readonly string[]).includes(lens)) return fail('unknown altitude')
    if (!(CLAIM_ALTITUDES as readonly string[]).includes(named)) return fail('unknown altitude')
    const w = typeof words === 'string' ? words : ''
    if (w.length > MAX_WORDS) return fail('words too long')
    claims.push({ at, channel, lens, named, words: w })
  }
  const s = payload.s || {}
  const counts: ClaimCounts = {
    totalCycles: Number.isFinite(s.totalCycles) ? s.totalCycles : 0,
    channelCounts: s.channelCounts && typeof s.channelCounts === 'object' ? s.channelCounts : {},
    channelsSatisfied: s.channelsSatisfied && typeof s.channelsSatisfied === 'object' ? s.channelsSatisfied : {},
  }
  return { ok: true, claims, counts, build: typeof payload.build === 'string' ? payload.build : '', codeHash: expect }
}
