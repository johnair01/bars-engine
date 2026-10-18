/**
 * The Between's store rules, with no database: which document a page path names, how an update merges, and who may
 * write what. Kept pure so the tests can walk every rule without Postgres (src/lib/between/__tests__/rules.test.ts).
 *
 * The 3D page (public/between/garden.js) writes the same paths it wrote to the claude.ai artifact store:
 * garden/main, items/<id>, spirits/<id>, daemons/<id>, shown/<player id>, data/users/<player id>/garden|spark|pouch.
 * Six-faces-council relationship-creature callsheet, positions bh-move-to-bars-engine and the rc-* rulings.
 */

import { ALL_CANONICAL_MOVES } from '@/lib/quest-grammar/move-engine'

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
export type Doc = { [k: string]: Json }

export type Target =
  | { table: 'garden' }
  | { table: 'items' | 'spirits' | 'daemons'; id: string }
  | { table: 'shown'; playerId: string }
  | { table: 'privates'; playerId: string; key: PrivateKey }

const PRIVATE_KEYS = ['garden', 'spark', 'pouch'] as const
type PrivateKey = (typeof PRIVATE_KEYS)[number]

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
  if (p.length === 4 && p[0] === 'data' && p[1] === 'users' && ID.test(p[2]) && (PRIVATE_KEYS as readonly string[]).includes(p[3]))
    return { table: 'privates', playerId: p[2], key: p[3] as PrivateKey }
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
      if (op === 'update' && data && 'by' in data && data.by !== cur!.by) return no(400, 'Who made it does not change.')
      if (op === 'set' && cur && cur.by !== me) return no(400, 'Who made it does not change.')
      if (data?.kind === 'lantern' || cur?.kind === 'lantern') return lanternWrite(me, op, data, cur)
      return yes
    case 'spirits':
    case 'daemons':
      if (op === 'set') return data && data.owner === me ? yes : no(400, 'You can only bring your own.')
      if (!cur) return no(404, 'That is no longer in the garden.')
      return cur.owner === me ? yes : no(403, 'It stays its owner\'s; you can greet it.')
    case 'shown':
      return target.playerId === me ? yes : no(403, 'That is the other person\'s own.')
    case 'privates':
      if (target.playerId !== me) return no(403, 'That is the other person\'s own.')
      return target.key === 'pouch' && op !== 'delete' ? pouchWrite(op === 'set' ? data! : merge(cur ?? {}, data!)) : yes
  }
}

/* ---------- the hearth: embers and lanterns (council pass crafting-charge1, slice 1) ----------
 * Working a charge with one of the fifteen moves leaves an ember in the maker's private pouch. The ember stores the
 * move; its element is the move's own (move-engine.ts), so a move from another element is refused (cc-move-sets-element).
 * The ember holds no words, and where its charge came from is not recorded, so an unoffered charge makes the same ember
 * as an offered one. Its glow (the charge's intensity, or none) is private: it never reaches a shared row
 * (cc-pouch-private, cc-intensity-look). A lantern made from it is a shared item and an offer: only its maker moves, takes
 * back or composts it, and the other person can only add their own yes (cc-lantern-offer). */

export const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const
type Element = (typeof ELEMENTS)[number]

/** Each move's element pair; a transcend move stays in its element. */
export const MOVES: Record<string, { name: string; from: Element; to: Element }> = Object.fromEntries(
  ALL_CANONICAL_MOVES.map(m => {
    const from = (m.fromElement ?? m.element) as Element
    return [m.id, { name: m.name, from, to: (m.toElement ?? from) as Element }]
  }),
)

const EMBER_KEYS = new Set(['move', 'feel', 'glow', 'state', 'at', 'lantern'])
const LANTERN_KEYS = new Set(['kind', 'by', 'hue', 'element', 'pos', 'yes', 'status', 'at', 'history'])
const LOG_KEYS = new Set(['act', 'by', 'at'])
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** May this pouch stand? Every ember names a real move, matches the feeling it was worked from, and holds no words. */
export function pouchWrite(pouch: Doc): Verdict {
  for (const k of Object.keys(pouch)) if (k !== 'embers') return no(400, 'The pouch holds embers only.')
  const embers = pouch.embers ?? {}
  if (!isObj(embers)) return no(400, 'The pouch holds embers only.')
  for (const e of Object.values(embers)) {
    if (e === null) continue
    if (!isObj(e)) return no(400, 'An ember is a small thing.')
    for (const k of Object.keys(e)) if (!EMBER_KEYS.has(k)) return no(400, 'An ember keeps no words.')
    const m = typeof e.move === 'string' ? MOVES[e.move] : undefined
    if (!m) return no(400, 'Choose one of the fifteen moves.')
    if (e.feel != null && e.feel !== m.from) return no(400, 'That move starts from another feeling.')
    if (e.glow != null && !(isNum(e.glow) && Number.isInteger(e.glow) && e.glow >= 1 && e.glow <= 5)) return no(400, 'Glow is 1 to 5, or none.')
    if (e.state !== 'held' && e.state !== 'lit') return no(400, 'An ember is held or lit.')
  }
  return yes
}

const logOk = (h: Json | undefined, who?: string) =>
  h == null || (isObj(h) && Object.values(h).every(e => e === null || (isObj(e) && Object.keys(e).every(k => LOG_KEYS.has(k)) && (!who || e.by === who))))

function lanternWrite(me: string, op: Op, data: Doc | null, cur: Doc | null): Verdict {
  const maker = cur ? cur.by : data?.by
  if (op === 'delete') return maker === me ? yes : no(403, 'Only its maker takes a lantern back.')
  if (maker !== me) {
    // The other person answers the offer: their own yes (or taking it back), and a line in the log in their name.
    const keys = Object.keys(data!)
    if (!keys.every(k => k === 'yes' || k === 'history')) return no(400, 'A lantern stays its maker\'s; you can welcome it.')
    const y = data!.yes
    if (y !== undefined && !(isObj(y) && Object.keys(y).every(k => k === me) && Object.values(y).every(v => v === null || isNum(v))))
      return no(400, 'You can only answer for yourself.')
    return logOk(data!.history, me) ? yes : no(400, 'The log names acts, nothing more.')
  }
  const next = op === 'set' ? data! : merge(cur ?? {}, data!)
  for (const k of Object.keys(next)) if (!LANTERN_KEYS.has(k)) return no(400, 'A lantern carries no words and no glow of the feeling.')
  if (next.kind !== 'lantern') return no(400, 'A lantern stays a lantern.')
  if (next.element != null && !(ELEMENTS as readonly string[]).includes(next.element as string)) return no(400, 'That is not an element.')
  if (!isObj(next.pos) || !isNum(next.pos.x) || !isNum(next.pos.z)) return no(400, 'Set it somewhere in the hollow.')
  if (op !== 'set' && data && 'yes' in data) return no(400, 'Only the other person says yes.')
  if (op === 'set' && isObj(next.yes) && Object.keys(next.yes).length) return no(400, 'Only the other person says yes.')
  return logOk(next.history) ? yes : no(400, 'The log names acts, nothing more.')
}

/** A lantern counts toward the Between once, when someone other than its maker has said yes. */
export const lanternLit = (it: Doc) =>
  it.kind === 'lantern' && isObj(it.yes) && Object.entries(it.yes).some(([k, v]) => k !== it.by && isNum(v))

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
