/**
 * The Between's store rules, with no database: which document a page path names, how an update merges, and who may
 * write what. Kept pure so the tests can walk every rule without Postgres (src/lib/between/__tests__/rules.test.ts).
 *
 * The 3D page (public/between/garden.js) writes the same paths it wrote to the claude.ai artifact store:
 * garden/main, items/<id>, spirits/<id>, daemons/<id>, shown/<player id>, data/users/<player id>/garden|spark|pouch|home.
 * A room is one garden (br-room-is-garden); the homeroom is a garden of kind "home" held by one person (br-home-is-a-room).
 * Six-faces-council relationship-creature callsheet, positions bh-move-to-bars-engine and the rc-* rulings.
 */

import { ALL_CANONICAL_MOVES } from '@/lib/quest-grammar/move-engine'
import { ITEMS as ROOM_ITEMS, shellFor, shellOf } from '../../../public/calrunia/room-kit.js'

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json }
export type Doc = { [k: string]: Json }

export type Target =
  | { table: 'garden' }
  | { table: 'items' | 'spirits' | 'daemons'; id: string }
  | { table: 'shown'; playerId: string }
  | { table: 'privates'; playerId: string; key: PrivateKey }

const PRIVATE_KEYS = ['garden', 'spark', 'pouch', 'home'] as const
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
  const home = garden.kind === 'home'
  if (home && !who.member) return no(403, 'A homeroom is its keeper\'s own.')
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
      if ('kind' in data) return no(400, 'A room stays a room and a homeroom stays a homeroom.')
      if (home && ('members' in data || 'joinRequest' in data || 'phase' in data || 'invitations' in data || 'styleAsk' in data))
        return no(400, 'A homeroom is held by one person.')
      if ('style' in data && !(typeof data.style === 'string' && ID.test(data.style))) return no(400, 'Choose one of the room styles.')
      if ('style' in data || 'styleAsk' in data) { const v = styleWrite(me, garden, data); if (!v.ok) return v }
      if ('looks' in data) { const v = looksWrite(me, data.looks); if (!v.ok) return v }
      if ('invitations' in data) { const v = invitationsWrite(me, garden, data.invitations); if (!v.ok) return v }
      if ('room' in data) { const v = roomWrite(me, garden, data.room); if (!v.ok) return v }
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
      if (home && (cur ? cur.by : data?.by) !== me) return no(403, 'A homeroom is its keeper\'s own.')
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
      if (target.key === 'home' && !home) return no(400, 'Your look and hopes are kept in your homeroom.')
      if (target.key === 'home' && op !== 'delete') return homeWrite(op === 'set' ? data! : merge(cur ?? {}, data!))
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

/* ---------- rooms, the homeroom, looks and invitations (relationship-creature, the br-* positions) ----------
 * A look is sprout's creator text (public/calrunia/look.js); each person writes only their own key in a room's
 * `looks`, so the other sees them as they made themselves (br-look-is-sprouts). An invitation is "come sit with me":
 * whoever sends it writes it, and the other person writes only their answer (br-invite-two-kinds). The homeroom's private
 * doc holds the look, goals and check-ins, and nobody else ever reads it (br-goals-private). */

const LOOK = /^[a-z_]{1,16}(\.[a-z_]{1,16}){6}$/
const NOTE_MAX = 280
const isNote = (v: unknown) => typeof v === 'string' && v.length <= NOTE_MAX

function looksWrite(me: string, looks: Json | undefined): Verdict {
  if (!isObj(looks)) return no(400, 'A look is kept by name.')
  for (const [k, v] of Object.entries(looks)) {
    if (k !== me) return no(403, 'You can only set your own look.')
    if (v !== null && !(typeof v === 'string' && LOOK.test(v))) return no(400, 'A look is the creator\'s choices.')
  }
  return yes
}

export const ANSWERS = ['yes', 'later', 'no'] as const
const INV_NEW = new Set(['by', 'kind', 'when', 'note', 'at', 'answer', 'answeredAt'])

function invitationsWrite(me: string, garden: Doc, invs: Json | undefined): Verdict {
  if (!isObj(invs)) return no(400, 'An invitation is a small thing.')
  const have = isObj(garden.invitations) ? garden.invitations : {}
  for (const [id, inv] of Object.entries(invs)) {
    if (!ID.test(id)) return no(400, 'An invitation is a small thing.')
    const cur = isObj(have[id]) ? (have[id] as Doc) : null
    if (inv === null) {
      if (cur && cur.by !== me) return no(403, 'Only who sent an invitation takes it back.')
      continue
    }
    if (!isObj(inv)) return no(400, 'An invitation is a small thing.')
    const keys = Object.keys(inv)
    if (!cur) {
      if (memberIds(garden).length < 2) return no(400, 'Invite someone into the room first.')
      if (!keys.every(k => INV_NEW.has(k))) return no(400, 'An invitation carries a time and a note, nothing more.')
      if (inv.by !== me) return no(400, 'You can only invite in your own name.')
      if (inv.kind !== 'sit') return no(400, 'An invitation here is to come and sit.')
      if (inv.when != null && !isNum(inv.when)) return no(400, 'Choose a time, or leave it open.')
      if (inv.note != null && !isNote(inv.note)) return no(400, 'Keep the note short.')
      if (inv.answer != null) return no(400, 'Only the other person answers.')
      continue
    }
    if (cur.by === me) {
      if (!keys.every(k => k === 'when' || k === 'note')) return no(400, 'Only the other person answers.')
      if (inv.when != null && !isNum(inv.when)) return no(400, 'Choose a time, or leave it open.')
      if (inv.note != null && !isNote(inv.note)) return no(400, 'Keep the note short.')
      continue
    }
    if (!keys.every(k => k === 'answer' || k === 'answeredAt')) return no(400, 'You can answer it; the invitation stays theirs.')
    if (inv.answer != null && !(ANSWERS as readonly string[]).includes(inv.answer as string)) return no(400, 'Answer yes, another time, or no.')
    if (inv.answeredAt != null && !isNum(inv.answeredAt)) return no(400, 'Answer yes, another time, or no.')
  }
  return yes
}

/**
 * A room's style (br-style-is-the-place, with his note of 2026-10-23: both players consent to a style change). With two
 * people in the room, a change is an ask, `styleAsk = {by, style, at}`; only the other person sets `style`, and only to
 * the style asked for, clearing the ask as they do. Either of them clears an ask (taking it back, or not now). A spark
 * with one member, and the homeroom, change at once.
 */
function styleWrite(me: string, garden: Doc, data: Doc): Verdict {
  const ask = data.styleAsk
  if (ask !== undefined && ask !== null) {
    if (!isObj(ask) || !Object.keys(ask).every(k => k === 'by' || k === 'style' || k === 'at')) return no(400, 'An ask names a style, nothing more.')
    if (ask.by !== me) return no(400, 'You can only ask in your own name.')
    if (!(typeof ask.style === 'string' && ID.test(ask.style))) return no(400, 'Choose one of the room styles.')
    if (!isNum(ask.at)) return no(400, 'An ask has a time.')
    if ('style' in data) return no(400, 'Ask first; the room changes when they say yes.')
  }
  if (!('style' in data) || memberIds(garden).length < 2) return yes
  const cur = isObj(garden.styleAsk) ? garden.styleAsk : null
  if (!cur || cur.by === me || cur.style !== data.style || data.styleAsk !== null)
    return no(403, 'The room changes how it looks when you both say yes. Ask them first.')
  return yes
}

/**
 * The room kit's placements (public/calrunia/room-kit.js, rk-spots-not-grid and rk-place-is-shared), kept in garden/main as
 * `room.placed`: spot id -> { item, owner, at }, or null for an empty spot. The shell is the garden's own (a homeroom is the
 * nook, a room the hollow) and is never written. You set an item down only in your own name, on a free spot that takes it;
 * either member lifts, and a lifted item goes back to its owner's satchel (nothing is deleted but the placement).
 */
function roomWrite(me: string, garden: Doc, room: Json): Verdict {
  if (!isObj(room) || !Object.keys(room).every(k => k === 'placed') || !isObj(room.placed)) return no(400, 'A room keeps where its things stand, nothing more.')
  const shell = shellOf(shellFor(garden)) as { spots: { id: string; takes: string; fixed?: boolean }[] }
  const cur = isObj(garden.room) && isObj(garden.room.placed) ? garden.room.placed : {}
  for (const [sid, v] of Object.entries(room.placed)) {
    const sp = shell.spots.find(s => s.id === sid)
    if (!sp || sp.fixed) return no(400, 'That is not a spot in this room.')
    if (v === null) continue
    if (!isObj(v) || !Object.keys(v).every(k => k === 'item' || k === 'owner' || k === 'at')) return no(400, 'A spot holds one thing.')
    const it = (ROOM_ITEMS as Record<string, { takes: string }>)[v.item as string]
    if (!it || it.takes !== sp.takes) return no(400, 'That does not fit there.')
    if (v.owner !== me) return no(400, 'You set things down in your own name.')
    if (!isNum(v.at)) return no(400, 'A placement has a time.')
    const was = cur[sid]
    if (isObj(was) && was.owner !== me) return no(409, 'Something stands there already. Lift it first.')
  }
  return yes
}

const HOME_KEYS = new Set(['look', 'goals', 'checkins', 'lastCheckin', 'embers', 'oriented', 'minute'])
const MINUTE_KEYS = new Set(['ember', 'mirror', 'hope', 'vine', 'skip'])
const MINUTE_SKIPS = new Set(['ember', 'mirror', 'hope'])

/**
 * The first minute's steps (public/calrunia/first-minute.js, Still C): each a time done, or null; `skip` the times a step was
 * left for later. Times only, never words: the hope written at the mirror is kept with the goals.
 */
function minuteOk(m: Json | undefined): boolean {
  if (m == null) return true
  if (!isObj(m)) return false
  for (const [k, v] of Object.entries(m)) {
    if (!MINUTE_KEYS.has(k)) return false
    if (k === 'skip') {
      if (v == null) continue
      if (!isObj(v) || !Object.entries(v).every(([s, t]) => MINUTE_SKIPS.has(s) && (t === null || isNum(t)))) return false
    } else if (v !== null && !isNum(v)) return false
  }
  return true
}
const HOME_EMBER_KEYS = new Set(['feel', 'at', 'given'])
const GIVEN_KEYS = new Set(['spirit', 'stone', 'room', 'at'])
const isId = (v: unknown) => typeof v === 'string' && ID.test(v)

/**
 * A check-in's ember (Between rooms part 4): a check-in is a W.A.V.E. walked through, and it leaves an ember of the
 * feeling that was here, kept in the homeroom until it is given. `given` is null while it waits; given, it names the spirit
 * it fed (or the stone it was left on in a room), the room it happened in (null for the homeroom), and when. No words.
 */
function homeEmberOk(e: Doc): boolean {
  if (!Object.keys(e).every(k => HOME_EMBER_KEYS.has(k))) return false
  if (!(ELEMENTS as readonly string[]).includes(e.feel as string) || !isNum(e.at)) return false
  const g = e.given
  if (g == null) return true
  if (!isObj(g) || !Object.keys(g).every(k => GIVEN_KEYS.has(k))) return false
  const to = [g.spirit, g.stone].filter(v => v != null)
  return to.length === 1 && isId(to[0]) && (g.room == null || isId(g.room)) && isNum(g.at)
}

/** May the homeroom's private doc stand? A look, goals (each maybe tied to a room), check-ins from the five feelings, embers. */
export function homeWrite(doc: Doc): Verdict {
  for (const k of Object.keys(doc)) if (!HOME_KEYS.has(k)) return no(400, 'Your homeroom keeps your look, hopes and check-ins.')
  if (doc.look != null && !(typeof doc.look === 'string' && LOOK.test(doc.look))) return no(400, 'A look is the creator\'s choices.')
  if (doc.lastCheckin != null && !isNum(doc.lastCheckin)) return no(400, 'A check-in has a time.')
  if (doc.oriented != null && !isNum(doc.oriented)) return no(400, 'Your first minute here has a time.')
  if (!minuteOk(doc.minute)) return no(400, 'Your first minute here keeps times, nothing more.')
  for (const [field, ok] of [
    ['goals', (g: Doc) => typeof g.text === 'string' && g.text.trim().length > 0 && isNote(g.text) && (g.room == null || (typeof g.room === 'string' && ID.test(g.room))) && (g.at == null || isNum(g.at))],
    ['checkins', (c: Doc) => (c.feel == null || (ELEMENTS as readonly string[]).includes(c.feel as string)) && (c.line == null || isNote(c.line)) && isNum(c.at)
      && (c.wave == null || (isNum(c.wave) && Number.isInteger(c.wave) && c.wave >= 0 && c.wave <= 7))],
    ['embers', homeEmberOk],
  ] as const) {
    const all = doc[field]
    if (all == null) continue
    if (!isObj(all)) return no(400, 'Your homeroom keeps your look, hopes and check-ins.')
    for (const [id, v] of Object.entries(all)) {
      if (!ID.test(id)) return no(400, 'Your homeroom keeps your look, hopes and check-ins.')
      if (v !== null && !(isObj(v) && ok(v))) return no(400, field === 'goals' ? 'A hope is a short line, maybe tied to one room.' : field === 'embers' ? 'An ember is a feeling and where it went, nothing more.' : 'A check-in is a feeling and a short line.')
    }
  }
  return yes
}

/** The homeroom: one person, no creature, no join; it opens when there is no room in the link (br-home-is-a-room). */
export function plantedHome(me: string, at = Date.now()): Doc {
  return { v: 1, kind: 'home', startedBy: me, startedAt: at, members: { [me]: { joinedAt: at } }, joinRequest: null, phase: 'home',
    style: 'dusk-hollow', looks: {}, lastTendedAt: at }
}

/* ---------- what each room is waiting on, for the next-move lanes (public/calrunia/next-moves.js) ----------
 * Ids and kinds only, never an item's words, so a sealed charge stays sealed. */

export const STALE_DAYS = 5
const GONE = new Set(['retired', 'composted', 'withdrawn'])

export type RoomSummary = {
  id: string; kind: 'room'; phase: Json; who: Json; relKind: Json; style: Json; person: string | null
  stale: boolean; joinWaiting: boolean; waiting: { id: string; what: 'agreement' | 'offer' | 'ask' | 'lantern' }[]
  revisit: string[]; invitations: { id: string; when: number | null; note: string; at: number | null }[]; lastSatTogether: number | null
  hereNow: boolean; lastTendedAt: Json; styleAsk: { style: string; at: number | null } | null
  keptAgreement: boolean
  /** the scrolls they sent that you answered another time or no: kept on your shelf (Still B) */
  keepsakes: { id: string; when: number | null; note: string; answer: 'later' | 'no'; at: number | null }[]
  /** the other person started this room, so their seal wears the first hue (teal); else plum */
  personStarted: boolean
}

export function roomSummary(me: string, id: string, g: Doc, items: { id: string; data: Doc }[],
  opts: { now?: number; names?: Record<string, string>; hereNow?: boolean } = {}): RoomSummary {
  const now = opts.now ?? Date.now(), names = opts.names ?? {}
  const setup = isObj(g.setup) ? g.setup : {}
  const person = memberIds(g).find(m => m !== me) ?? null
  const who = g.startedBy === me || !g.startedBy ? setup.who ?? null : names[g.startedBy as string] ?? null
  const waiting: RoomSummary['waiting'] = [], revisit: string[] = []
  let keptAgreement = false // the room kit's lantern (rk-earned-only): a yes or no, never a count
  for (const { id: iid, data: it } of items) {
    if (it.kind === 'agreement' && it.status === 'kept') keptAgreement = true
    if (GONE.has(it.status as string)) continue
    const yesMe = isObj(it.yes) ? it.yes[me] : undefined
    if (it.kind === 'lantern') { if (it.by !== me && !isNum(yesMe)) waiting.push({ id: iid, what: 'lantern' }); continue }
    if (isObj(it.pending) && it.pending.by !== me) waiting.push({ id: iid, what: 'ask' })
    else if (it.kind === 'agreement' && it.status === 'proposed' && !yesMe) waiting.push({ id: iid, what: 'agreement' })
    else if (it.kind !== 'agreement' && it.status === 'offered' && it.by !== me) waiting.push({ id: iid, what: 'offer' })
    if (it.kind === 'agreement' && it.status === 'revisit') revisit.push(iid)
  }
  const invitations: RoomSummary['invitations'] = [], keepsakes: RoomSummary['keepsakes'] = []
  let lastSatTogether: number | null = null
  for (const [iid, inv] of Object.entries(isObj(g.invitations) ? g.invitations : {})) {
    if (!isObj(inv)) continue
    const scroll = { id: iid, when: isNum(inv.when) ? inv.when : null, note: typeof inv.note === 'string' ? inv.note : '', at: isNum(inv.at) ? inv.at : null }
    if (inv.by !== me && inv.answer == null) invitations.push(scroll)
    if (inv.by !== me && (inv.answer === 'later' || inv.answer === 'no')) keepsakes.push({ ...scroll, answer: inv.answer })
    const t = isNum(inv.when) ? inv.when : isNum(inv.answeredAt) ? inv.answeredAt : null
    if (inv.answer === 'yes' && t !== null && t <= now && (lastSatTogether === null || t > lastSatTogether)) lastSatTogether = t
  }
  const jr = isObj(g.joinRequest) ? g.joinRequest : null
  const sa = isObj(g.styleAsk) && g.styleAsk.by !== me && typeof g.styleAsk.style === 'string' ? g.styleAsk : null
  return {
    id, kind: 'room', phase: g.phase ?? null, who, relKind: setup.kind ?? null, style: g.style ?? null, person,
    stale: g.phase !== 'closed' && isNum(g.lastTendedAt) && now - g.lastTendedAt > STALE_DAYS * 864e5,
    joinWaiting: g.startedBy === me && !!jr, waiting, revisit, invitations, lastSatTogether,
    hereNow: !!opts.hereNow, lastTendedAt: g.lastTendedAt ?? null,
    styleAsk: sa ? { style: sa.style as string, at: isNum(sa.at) ? sa.at : null } : null,
    keptAgreement, keepsakes, personStarted: !!person && g.startedBy === person,
  }
}

/** A new garden as the setup sheet plants it, with the server's word on who started it. */
export function plantedGarden(me: string, data: Doc, at = Date.now()): Doc | null {
  const setup = isObj(data.setup) ? data.setup : null
  const who = setup && typeof setup.who === 'string' ? setup.who.trim().slice(0, 80) : ''
  if (!who) return null
  const look = isObj(data.looks) ? data.looks[me] : null
  return {
    ...data, v: 1, kind: 'room', startedBy: me, invitations: {}, looks: typeof look === 'string' && LOOK.test(look) ? { [me]: look } : {},
    style: typeof data.style === 'string' && ID.test(data.style) ? data.style : 'dusk-hollow', startedAt: typeof data.startedAt === 'number' ? data.startedAt : at,
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
