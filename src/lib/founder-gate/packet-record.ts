/**
 * The packet record (hole H-packet-store, founder support demo step 1): the seed packet plus the player id it belongs to,
 * as a game master reads it. Pure: parsing and the store's shape. The database store is packet-server.ts.
 * parsePacket never repairs a packet. A value that is not a packet from the walk comes back null.
 */
import { isChannel, type Packet } from './seed-packet'
import { SEEDS, SOIL } from './content'

export interface PacketRecord { playerId: string; packet: Packet; updatedAt: Date }

const MAX_TEXT = 2000
const MAX_LIST = 20

const isText = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_TEXT

/** A packet from untrusted JSON (a request body or a stored string), or null when any field is not the walk's own. */
export function parsePacket(raw: unknown): Packet | null {
  let v = raw
  if (typeof v === 'string') {
    try { v = JSON.parse(v) } catch { return null }
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  const domains = SEEDS.map((s) => s.domain as string)
  const soils = SOIL.map((s) => s.id as string)

  if (!(o.seed === null || o.seed === 'own' || (typeof o.seed === 'string' && domains.includes(o.seed)))) return null
  if (!isText(o.own)) return null
  if (!(o.family === null || isChannel(o.family))) return null
  if (!(o.soil === null || (typeof o.soil === 'string' && soils.includes(o.soil)))) return null
  if (!Array.isArray(o.weather) || o.weather.length > MAX_LIST || !o.weather.every(isText)) return null
  if (!isText(o.water)) return null
  let stone: Packet['stone'] = null
  if (o.stone !== null) {
    const s = o.stone as { belief?: unknown; set?: unknown } | undefined
    if (!s || !isText(s.belief) || typeof s.set !== 'boolean') return null
    stone = { belief: s.belief, set: s.set }
  }
  return {
    seed: o.seed as Packet['seed'],
    own: o.own,
    family: o.family as Packet['family'],
    soil: o.soil as Packet['soil'],
    weather: o.weather as string[],
    water: o.water,
    stone,
  }
}

/** A player id the store accepts: non-empty, short, no whitespace. */
export const isPlayerId = (v: unknown): v is string => typeof v === 'string' && /^[\w.:-]{1,80}$/.test(v)
