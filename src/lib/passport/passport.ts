/**
 * The Calrunian passport (six-faces-council pass calrunia-world1, positions cw-passport and cw-chapter1-first; registry
 * calrunia/world.yaml). One player record crosses places and nothing else does: the player, their spirits with their care
 * state, the hand of cards and BARs, qi, vibeulons, embers and the places reached. A place reads it on entry and writes back
 * on exit. Signed in, it lives in Postgres (`passports`); a guest's lives in the browser (public/passport/guest.js) until
 * sign-in claims it. The contract is schema/passport.schema.json, checked by src/lib/__tests__/passport-contract.test.ts.
 *
 * The passport carries no level or rank (the Regent's guard in the pass): nothing here lets one place rank a player in another.
 */

export const PASSPORT_VERSION = 1
/** The places in calrunia/world.yaml. A place appears on a player's map once they have entered it (cw-emergent-map). */
export const PLACES = ['vessel', 'sprout', 'cave', 'root', 'between', 'element-lands'] as const
export type Place = (typeof PLACES)[number]
export const PASSPORT_KEYS = ['v', 'player', 'spirits', 'hand', 'qi', 'vibeulons', 'embers', 'places_reached', 'updated_at'] as const
export const CARE_STATES = ['well', 'corrupted', 'dead'] as const
export const HAND_KINDS = ['card', 'bar'] as const
const MAX_LINEAGE = 60

export type Spirit = {
  id: string
  name: string
  element: string | null
  family: string | null
  sittings: number
  born: { where: string; at: string }
  lineage: { where: string; at: string }[]
  loadout: boolean
  /** Spirit care (spirit-care.md): null until a place tracks it. */
  care: { last: string | null; state: (typeof CARE_STATES)[number] } | null
}
export type HandItem = { id: string; kind: (typeof HAND_KINDS)[number]; title: string; from: Place }
export type Ember = { id: string; source: string; element: string | null; look: number; state: string; at: string; label: string }
export type Passport = {
  v: 1
  player: { id: string | null; name: string | null; guest_id: string | null }
  spirits: Spirit[]
  hand: HandItem[]
  qi: number
  vibeulons: number
  embers: Ember[]
  places_reached: Place[]
  updated_at: string
}

/**
 * Which place writes which field (test W2: no place writes a field another owns). Every place reads every field.
 * `places_reached` is the one field all places write, and each only adds its own id. `player` is written by sign-in alone.
 * These owners are a position, standing unless Wendell flips it: the cave wakes spirits, Sprout's Chapter 1 deals the hand,
 * and the ship holds the qi meter, the vibeulons condensed from it and the embers its parts are made from (inner-vessel1).
 */
export const FIELD_OWNERS: Record<'spirits' | 'hand' | 'qi' | 'vibeulons' | 'embers', Place> = {
  spirits: 'cave',
  hand: 'sprout',
  qi: 'vessel',
  vibeulons: 'vessel',
  embers: 'vessel',
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)
const isStr = (x: unknown): x is string => typeof x === 'string'
const strOrNull = (x: unknown) => x === null || isStr(x)
const isWhen = (x: unknown) => isStr(x) && !Number.isNaN(Date.parse(x))
const isCount = (x: unknown) => typeof x === 'number' && Number.isInteger(x) && x >= 0

/** Checks a record against the passport contract by hand, as the board-save contract does (no schema library). */
export function validatePassport(p: unknown): { ok: true; passport: Passport } | { ok: false; errors: string[] } {
  const e: string[] = []
  if (!isObj(p)) return { ok: false, errors: ['not an object'] }
  for (const k of Object.keys(p)) if (!(PASSPORT_KEYS as readonly string[]).includes(k)) e.push(`unknown field ${k}`)
  if (p.v !== PASSPORT_VERSION) e.push('v must be 1')
  const pl = p.player
  if (!isObj(pl) || !strOrNull(pl.id) || !strOrNull(pl.name) || !strOrNull(pl.guest_id)) e.push('player needs id, name and guest_id (string or null)')
  else if (pl.id === null && pl.guest_id === null) e.push('player needs an id or a guest_id')
  if (!Array.isArray(p.spirits)) e.push('spirits must be a list')
  else {
    const ids = new Set<string>()
    p.spirits.forEach((s, i) => {
      const at = `spirits[${i}]`
      if (!isObj(s) || !isStr(s.id) || !s.id) return e.push(`${at} needs an id`)
      if (ids.has(s.id)) e.push(`${at} repeats id ${s.id}`)
      ids.add(s.id)
      if (!isStr(s.name)) e.push(`${at}.name must be text`)
      if (!strOrNull(s.element) || !strOrNull(s.family)) e.push(`${at}.element and family are text or null`)
      if (!isCount(s.sittings)) e.push(`${at}.sittings must be a whole number`)
      if (!isObj(s.born) || !isStr(s.born.where) || !isWhen(s.born.at)) e.push(`${at}.born needs where and at`)
      if (!Array.isArray(s.lineage) || s.lineage.length > MAX_LINEAGE || !s.lineage.every(l => isObj(l) && isStr(l.where) && isWhen(l.at)))
        e.push(`${at}.lineage must be up to ${MAX_LINEAGE} { where, at }`)
      if (typeof s.loadout !== 'boolean') e.push(`${at}.loadout must be true or false`)
      if (s.care !== null && !(isObj(s.care) && (s.care.last === null || isWhen(s.care.last)) && (CARE_STATES as readonly unknown[]).includes(s.care.state)))
        e.push(`${at}.care must be null or { last, state }`)
      if ('stage' in s || 'level' in s || 'rank' in s) e.push(`${at} carries a stage, level or rank`)
    })
    if (p.spirits.filter(s => isObj(s) && s.loadout === true).length > 3) e.push('at most three spirits in the loadout')
  }
  if (!Array.isArray(p.hand) || !p.hand.every(h => isObj(h) && isStr(h.id) && (HAND_KINDS as readonly unknown[]).includes(h.kind) && isStr(h.title) && (PLACES as readonly unknown[]).includes(h.from)))
    e.push('hand must be a list of { id, kind: card|bar, title, from: place }')
  if (typeof p.qi !== 'number' || !(p.qi >= 0)) e.push('qi must be a number, zero or more')
  if (!isCount(p.vibeulons)) e.push('vibeulons must be a whole number, zero or more')
  if (!Array.isArray(p.embers) || !p.embers.every(m => isObj(m) && isStr(m.id) && isStr(m.source) && strOrNull(m.element) && typeof m.look === 'number' && m.look >= 0 && m.look <= 1 && isStr(m.state) && isWhen(m.at) && isStr(m.label)))
    e.push('embers must be a list of { id, source, element, look 0..1, state, at, label }')
  if (!Array.isArray(p.places_reached) || !p.places_reached.every(x => (PLACES as readonly unknown[]).includes(x)) || new Set(p.places_reached).size !== p.places_reached.length)
    e.push('places_reached must list places from calrunia/world.yaml, once each')
  if (!isWhen(p.updated_at)) e.push('updated_at must be a time')
  return e.length ? { ok: false, errors: e } : { ok: true, passport: p as unknown as Passport }
}

/**
 * A place writes back on exit. It may change only the fields it owns, and add only its own id to places_reached.
 * Returns the new passport, or the fields it tried to write that another place owns.
 */
export function writeFromPlace(p: Passport, place: Place, patch: Partial<Passport>): { ok: true; passport: Passport } | { ok: false; refused: string[] } {
  const refused = Object.keys(patch).filter(k => {
    if (k === 'places_reached') return (patch.places_reached || []).some(x => x !== place && !p.places_reached.includes(x))
    return FIELD_OWNERS[k as keyof typeof FIELD_OWNERS] !== place
  })
  if (refused.length) return { ok: false, refused }
  const next = { ...p, ...patch, updated_at: new Date().toISOString() } as Passport
  // A place only ever adds to places_reached; a shorter list in the patch never drops another place's entry.
  next.places_reached = PLACES.filter(x => x === place || p.places_reached.includes(x))
  return { ok: true, passport: next }
}

function unionBy<T extends { id: string }>(keep: T[], add: T[], mergeOne: (a: T, b: T) => T): T[] {
  const out = keep.map(x => ({ ...x }))
  for (const b of add) {
    const i = out.findIndex(a => a.id === b.id)
    if (i < 0) out.push({ ...b })
    else out[i] = mergeOne(out[i], b)
  }
  return out
}

function mergeSpirit(a: Spirit, b: Spirit): Spirit {
  const seen = new Set<string>()
  const lineage = [...a.lineage, ...b.lineage]
    .filter(l => (seen.has(l.where + l.at) ? false : (seen.add(l.where + l.at), true)))
    .sort((x, y) => x.at.localeCompare(y.at))
    .slice(-MAX_LINEAGE)
  const careLast = [a.care?.last, b.care?.last].filter(isStr).sort().pop() ?? null
  return {
    ...a,
    name: a.name || b.name,
    element: a.element ?? b.element,
    family: a.family ?? b.family,
    sittings: Math.max(a.sittings, b.sittings),
    born: a.born.at <= b.born.at ? a.born : b.born,
    lineage,
    care: a.care || b.care ? { last: careLast, state: (a.care ?? b.care)!.state } : null,
  }
}

/**
 * Sign-in claims a guest passport. The same spirit stays the player's (test W1): spirits, embers and hand items are joined
 * by id and nothing is dropped. Claiming twice gives the same passport, so qi and vibeulons take the larger of the two
 * rather than adding: a claim never mints currency.
 */
export function claimGuest(server: Passport | null, guest: Passport, player: { id: string; name: string }, at = new Date().toISOString()): Passport {
  const base: Passport = server ?? { ...guest, spirits: [], hand: [], embers: [], qi: 0, vibeulons: 0, places_reached: [] }
  const loadout = new Set(base.spirits.filter(s => s.loadout).map(s => s.id))
  const spirits = unionBy(base.spirits, guest.spirits, mergeSpirit)
  for (const s of spirits) {
    if (!s.loadout || loadout.has(s.id)) continue
    if (loadout.size >= 3) s.loadout = false
    else loadout.add(s.id)
  }
  return {
    v: 1,
    player: { id: player.id, name: player.name, guest_id: base.player.guest_id ?? guest.player.guest_id },
    spirits,
    hand: unionBy(base.hand, guest.hand, a => a),
    qi: Math.max(base.qi, guest.qi),
    vibeulons: Math.max(base.vibeulons, guest.vibeulons),
    embers: unionBy(base.embers, guest.embers, a => a),
    places_reached: PLACES.filter(x => base.places_reached.includes(x) || guest.places_reached.includes(x)),
    updated_at: at,
  }
}
