/**
 * The Between's store rules, with no database: which document a page path names, how an update merges, and who may
 * write what. Kept pure so the tests can walk every rule without Postgres (src/lib/between/__tests__/rules.test.ts).
 *
 * The 3D page (public/between/garden.js) writes the same paths it wrote to the claude.ai artifact store:
 * garden/main, items/<id>, spirits/<id>, daemons/<id>, shown/<player id>, data/users/<player id>/garden|spark.
 * Six-faces-council relationship-creature callsheet, positions bh-move-to-bars-engine and the rc-* rulings.
 */

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
export type Doc = { [k: string]: Json }

export type Target =
  | { table: 'garden' }
  | { table: 'items' | 'spirits' | 'daemons'; id: string }
  | { table: 'shown'; playerId: string }
  | { table: 'privates'; playerId: string; key: 'garden' | 'spark' }

export type Op = 'set' | 'update' | 'delete'

const ID = /^[A-Za-z0-9_-]{1,64}$/

export function parsePath(path: unknown): Target | null {
  if (typeof path !== 'string') return null
  const p = path.split('/')
  if (p.length === 2 && p[0] === 'garden' && p[1] === 'main') return { table: 'garden' }
  if (p.length === 2 && ID.test(p[1])) {
    if (p[0] === 'items' || p[0] === 'spirits' || p[0] === 'daemons') return { table: p[0], id: p[1] }
    if (p[0] === 'shown') return { table: 'shown', playerId: p[1] }
  }
  if (p.length === 4 && p[0] === 'data' && p[1] === 'users' && ID.test(p[2]) && (p[3] === 'garden' || p[3] === 'spark'))
    return { table: 'privates', playerId: p[2], key: p[3] }
  return null
}

const isObj = (v: unknown): v is Doc => !!v && typeof v === 'object' && !Array.isArray(v)

/** The page's own merge: nested objects merge, anything else (null included) replaces. Same as garden.js `merge`. */
export function merge(a: Doc, b: Doc): Doc {
  const out: Doc = { ...a }
  for (const [k, v] of Object.entries(b)) {
    const cur = out[k]
    out[k] = isObj(v) && isObj(cur) ? merge(cur, v) : v
  }
  return out
}

/** Who is asking, and what they hold on this garden. */
export type Who = { playerId: string; member: boolean; invited: boolean }

export type Verdict = { ok: true } | { ok: false; status: number; error: string }
const no = (status: number, error: string): Verdict => ({ ok: false, status, error })
const yes: Verdict = { ok: true }

const memberIds = (g: Doc): string[] => (isObj(g.members) ? Object.keys(g.members) : [])

/**
 * May `who` apply `op` with `data` to `target`, given the garden as it stands and the document as it stands (`cur`,
 * null when there is none)? Members tend everything shared; only owners move their own walkers, pictures and notes.
 * Someone holding the invite link can only ask to join a spark, or take that request back.
 */
export function mayWrite(who: Who, garden: Doc, target: Target, op: Op, data: Doc | null, cur: Doc | null): Verdict {
  const me = who.playerId
  if (!who.member) {
    if (!who.invited) return no(403, 'Only the two people in this garden can tend it.')
    if (target.table !== 'garden' || op !== 'update' || !data) return no(403, 'Ask to join first.')
    const keys = Object.keys(data)
    if (keys.length !== 1 || keys[0] !== 'joinRequest') return no(403, 'Ask to join first.')
    if (garden.phase !== 'spark' || memberIds(garden).length >= 2) return no(403, 'This garden is held by two people already.')
    const jr = data.joinRequest
    const curJr = isObj(garden.joinRequest) ? garden.joinRequest : null
    if (jr === null) return curJr && curJr.uid === me ? yes : no(403, 'There is no request of yours to take back.')
    if (!isObj(jr) || jr.uid !== me) return no(403, 'You can only ask for yourself.')
    if (curJr && curJr.uid !== me) return no(409, 'Someone else has already asked to join.')
    return yes
  }
  switch (target.table) {
    case 'garden': {
      if (op !== 'update' || !data) return no(400, 'The garden is planted once and then only changed.')
      if ('startedBy' in data || 'v' in data) return no(400, 'Who started the garden does not change.')
      if ('members' in data) {
        const add = isObj(data.members) ? Object.keys(data.members) : []
        const jr = isObj(garden.joinRequest) ? garden.joinRequest : null
        if (garden.startedBy !== me) return no(403, 'Only the person who started the garden welcomes someone in.')
        if (add.length !== 1 || !jr || jr.uid !== add[0]) return no(400, 'Only the person who asked to join can be welcomed.')
        if (new Set([...memberIds(garden), ...add]).size > 2) return no(400, 'A Between holds two people.')
      }
      return yes
    }
    case 'items':
      if (op === 'set' && (!data || data.by !== me)) return no(400, 'An item is planted by whoever sets it down.')
      if (op !== 'set' && !cur) return no(404, 'That is no longer in the garden.')
      return yes
    case 'spirits':
    case 'daemons':
      if (op === 'set') return data && data.owner === me ? yes : no(400, 'You can only bring your own.')
      if (!cur) return no(404, 'That is no longer in the garden.')
      return cur.owner === me ? yes : no(403, 'It stays its owner\'s; you can greet it.')
    case 'shown':
    case 'privates':
      return target.playerId === me ? yes : no(403, 'That is the other person\'s own.')
  }
}

/**
 * An item as `me` may see it. A sealed charge someone else offered keeps its words on the server until `me` opens it:
 * the page used to hide them only on screen, so they reached the other person's device (council cc-seal-fix-first).
 */
export function itemFor(me: string, item: Doc): Doc {
  if (!item.sealed || item.by === me || (isObj(item.opened) && item.opened[me])) return item
  const out: Doc = { ...item, text: '' }
  if (isObj(item.history))
    out.history = Object.fromEntries(Object.entries(item.history).map(([k, e]) => [k, isObj(e) && e.by === item.by && 'text' in e ? { ...e, text: '' } : e]))
  return out
}

/** What someone holding only the invite link sees of the garden: the spark, who started it, never the hopes. */
export function invitedView(g: Doc): Doc {
  const setup = isObj(g.setup) ? { who: g.setup.who ?? null, kind: g.setup.kind ?? null } : null
  return { phase: g.phase ?? null, startedBy: g.startedBy ?? null, members: g.members ?? {}, joinRequest: g.joinRequest ?? null,
    lastTendedAt: g.lastTendedAt ?? null, setup }
}

/** A new garden as the setup sheet plants it, with the server's word on who started it. */
export function plantedGarden(me: string, data: Doc, at = Date.now()): Doc | null {
  const setup = isObj(data.setup) ? data.setup : null
  const who = setup && typeof setup.who === 'string' ? setup.who.trim().slice(0, 80) : ''
  if (!who) return null
  return {
    ...data, v: 1, startedBy: me, startedAt: typeof data.startedAt === 'number' ? data.startedAt : at,
    setup: { who, kind: String(setup!.kind ?? 'Something else').slice(0, 60), hopes: String(setup!.hopes ?? '').slice(0, 1000) },
    members: { [me]: { joinedAt: at } }, joinRequest: null, phase: 'spark', ending: null,
    lastTendedAt: typeof data.lastTendedAt === 'number' ? data.lastTendedAt : at,
  }
}

/** A garden carried over from the claude.ai artifact store: its member ids become `owner`'s player id. */
export function carriedGarden(owner: string, artifactGarden: Doc, from: string): Doc | null {
  if (artifactGarden.phase !== 'spark') return null
  const g = plantedGarden(owner, artifactGarden, typeof artifactGarden.startedAt === 'number' ? artifactGarden.startedAt : Date.now())
  return g && { ...g, carriedFrom: from }
}
