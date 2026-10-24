/** The deck as a place (art direction "Lantern deck", board ty-still-pick = A). Every strand is a room in one of the
 * studio's department halls (ty-boat-departments), and its state is how the room looks, never a list: a bell and a letter when it waits on Wendell, scaffolding while
 * a thread is building it, a lit window and chimney smoke while it moves, vines and dim windows while it rests, and a
 * spirit walking through the Everdoor when it is done. Pure, so the layout can be tested without a browser. */
import type { Deck, Passenger } from './deck'

export type Look = 'bell' | 'scaffold' | 'lit' | 'vines' | 'everdoor'
export type House = {
  strand: string; look: Look; tier: 0 | 1; x: number
  /** 1 bright to 0 faded, from days untouched against the 21-day fade. */
  glow: number
  /** Vines thicken day by day while a strand rests (0 to 1). */
  vines: number
  /** Unopened letters in the mail slot: rounds built past his last look. */
  letters: number
  /** What the letter says (bell), or the one line the spirit says when you knock. */
  line: string
  hue: number
  /** Days since the strand was last touched. */
  days: number
}
export type CrewMate = { id: string; opus: boolean; home: string }
/** A room inside a department hall: a house's look, placed by hall and storey. */
export type Room = House & { hall: string; wing?: string }
export type Hall = {
  id: string; name: string; lead: string; x: number; w: number
  /** Rooms waiting on Wendell; the hall hangs one bell when any do. */
  bells: number
  /** The hall's most urgent look, for the outside: bell, then scaffold, lit, vines. */
  look: Look
  wings: { name: string; x0: number; x1: number }[]
}
export type World = {
  width: number; halls: Hall[]; rooms: Room[]; crew: CrewMate[]; wheelhouseX: number; mastX: number; everdoorX: number
  done: string[]; islands: { stage: string; state: string }[]; at: string
  /** The ship's log in the wheelhouse: what happened on board lately, newest first, in plain words. */
  log: string[]
}

/** The boat is a game design studio, and each department is a hall (position ty-boat-departments). A hall's lead is
 * its CCGS role; a wing is a room group inside a hall, built as a gabled annex. A strand missing here still shows,
 * in the cargo hold. */
export const DEPARTMENTS: { id: string; name: string; lead: string; rooms: string[]; wings: { name: string; rooms: string[] }[] }[] = [
  { id: 'art', name: 'Art Studio', lead: 'art-director', rooms: ['spirit-generator', 'cave-studio', 'calrunia-creator'],
    wings: [{ name: 'Blender workshop', rooms: ['blender-frame-flesh-warp', 'blender-pipeline-test', 'jev-asset', 'game-demo'] }] },
  { id: 'design', name: 'Design Room', lead: 'game-designer',
    rooms: ['chapter1-demo', 'walkthrough', 'engine-slice', 'skilled-helper', 'steps-hand', 'move-nature', 'root', 'studio-lot', 'studio'],
    wings: [{ name: 'Spirit nursery', rooms: ['inner-creatures', 'spirit-dissolve', 'perceptual-shadow', 'spirit-care', 'wave-battle'] }] },
  { id: 'map', name: 'Map Room', lead: 'level-designer', rooms: ['calrunia-world', 'inner-vessel', 'relationship-creature'],
    wings: [{ name: 'Caves', rooms: ['cave-of-lessons', 'cave-levels', 'cave-controls', 'big-mind-cave', 'spirits-in-caves', 'wave-room', 'element-settings'] }] },
  { id: 'story', name: 'Story Room', lead: 'narrative-director', rooms: ['story-pipeline', 'corpus', 'friendcraft', 'somatic-ontology', 'ontology-flows'],
    wings: [{ name: 'Healing practice', rooms: ['shame-coaching', 'work-dbt'] }] },
  { id: 'post', name: 'Post Office', lead: 'community-manager', rooms: ['podcast', 'flirtcraft', 'email-pipeline', 'virtual-launch', 'artist-corps'],
    wings: [{ name: 'Coaching business', rooms: ['coaching-pipeline', 'coaching-site'] }] },
  { id: 'engine', name: 'Engine Room', lead: 'producer', rooms: ['board-plumbing', 'session-cost', 'process-retro', 'morning-menu'], wings: [] },
  { id: 'hold', name: 'Cargo Hold', lead: 'producer', rooms: [], wings: [] },
]

/** The hall (and wing) a strand lives in; a new strand goes to the cargo hold so it still shows. */
export function hallOf(strand: string): { hall: string; wing?: string } {
  for (const d of DEPARTMENTS) {
    if (d.rooms.includes(strand)) return { hall: d.id }
    for (const w of d.wings) if (w.rooms.includes(strand)) return { hall: d.id, wing: w.name }
  }
  return { hall: 'hold' }
}

export const ROOM_W = 118
export const HALL_PAD = 24
export const DOOR_W = 64 // the hall's own door, at its stern end
const HALL_GAP = 40
const STERN = 220 // the Everdoor and its steps
const WHEELHOUSE_W = 300
const MAST_W = 300 // room for the hammock between the wheelhouse and the mast
const BOW = 260
const RANK: Record<Look, number> = { bell: 0, scaffold: 1, lit: 2, vines: 3, everdoor: 4 }

/** A thread is building it when it moved within a day; otherwise moving strands just glow. */
export function lookOf(p: Passenger): Look {
  if (p.mood === 'done') return 'everdoor'
  if (p.mood === 'waiting') return 'bell'
  if (p.mood === 'moving') return p.days <= 1 || (p.loop?.ahead ?? 0) > 0 ? 'scaffold' : 'lit'
  return 'vines'
}

/** Words for a letter: no parentheticals, links, pull request numbers or code, first letter up, full stop at the end. */
export function plainOf(s: string): string {
  let t = s.replace(/`[^`]*`/g, '').replace(/`/g, '')
  for (let i = 0; i < 3; i++) t = t.replace(/\s*\([^()]*\)/g, '')
  t = t.replace(/https?:\/\/\S+/g, '')
    .replace(/(?:\b(?:on|in|see|via)\s+)?(?:\b(?:[\w-]+-repo|bars-engine|council|sprout|six-faces-council|friendcraft[\w-]*)\s+)?(?:\b(?:draft|PR|pull request)\s+)?#\d+(?:\s*(?:,|and|\/)\s*#?\d+)*/gi, '')
    .replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').replace(/([,;:])(?=[.,;:]|$)/g, '').replace(/\s\b(on|in|at|to|of|with|for|and)\s*([.,;]|$)/gi, '$2')
    .replace(/^[\s,;:.]+/, '').trim()
  if (!t) return ''
  t = t[0].toUpperCase() + t.slice(1)
  return /[.!?…]$/.test(t) ? t : t + '.'
}

/** The strand's own words, trimmed to what one character can say in one bubble. */
export function lineOf(p: Passenger, max = 140): string {
  const s = plainOf(p.mood === 'waiting' ? p.next : p.text)
  return s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:.]$/, '') + '…'
}

/** A stable colour per strand, so a room keeps its walls between visits. */
export function hueOf(name: string): number {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

/** Stern to bow: the Everdoor, the quiet halls (nothing waiting, nothing building), the wheelhouse, the mast, then
 * the halls with work in them, fewest bells first, so the halls that ring most are at the bow where you see them.
 * Inside a hall the core rooms come first and each wing after, in columns of two storeys. */
export function worldOf(deck: Deck): World {
  const room = (p: Passenger): Omit<House, 'tier' | 'x'> => ({
    strand: p.strand, look: lookOf(p), glow: Math.round(p.glow * 100) / 100,
    vines: p.mood === 'resting' ? Math.min(1, Math.round((p.days / 21) * 100) / 100 + 0.2) : 0,
    letters: p.loop?.ahead ?? 0, line: lineOf(p), hue: hueOf(p.strand), days: p.days,
  })
  const live = deck.passengers.filter(p => lookOf(p) !== 'everdoor')
  const groups = DEPARTMENTS.map(d => {
    const mine = live.filter(p => hallOf(p.strand).hall === d.id)
    const order = (l: Passenger[]) => l.sort((a, b) => RANK[lookOf(a)] - RANK[lookOf(b)] || a.days - b.days || a.strand.localeCompare(b.strand))
    const sections = [{ wing: undefined as string | undefined, list: order(mine.filter(p => !hallOf(p.strand).wing)) },
      ...d.wings.map(w => ({ wing: w.name, list: order(mine.filter(p => hallOf(p.strand).wing === w.name)) }))].filter(s => s.list.length)
    const looks = mine.map(lookOf)
    return { d, sections, n: mine.length, bells: looks.filter(l => l === 'bell').length, building: looks.includes('scaffold'),
      look: looks.sort((a, b) => RANK[a] - RANK[b])[0] ?? 'vines', oldest: Math.max(0, ...mine.map(p => p.days)) }
  }).filter(g => g.n)
  const quiet = groups.filter(g => !g.bells && !g.building).sort((a, b) => b.oldest - a.oldest || a.d.id.localeCompare(b.d.id))
  const busy = groups.filter(g => g.bells || g.building).sort((a, b) => a.bells - b.bells || a.d.id.localeCompare(b.d.id))

  const halls: Hall[] = [], rooms: Room[] = []
  let x = STERN
  const place = (g: typeof groups[number]) => {
    const x0 = x, wings: Hall['wings'] = []
    let cx = x0 + DOOR_W + HALL_PAD
    for (const s of g.sections) {
      const s0 = cx
      s.list.forEach((p, i) => rooms.push({ ...room(p), hall: g.d.id, ...(s.wing ? { wing: s.wing } : {}), tier: (i % 2) as 0 | 1,
        x: cx + Math.floor(i / 2) * ROOM_W + ROOM_W / 2 }))
      cx += Math.ceil(s.list.length / 2) * ROOM_W
      if (s.wing) wings.push({ name: s.wing, x0: s0, x1: cx })
    }
    const w = cx + HALL_PAD - x0
    halls.push({ id: g.d.id, name: g.d.name, lead: g.d.lead, x: x0 + w / 2, w, bells: g.bells, look: g.look, wings })
    x = x0 + w + HALL_GAP
  }
  const everdoorX = STERN / 2
  quiet.forEach(place)
  const wheelhouseX = x + WHEELHOUSE_W / 2
  x += WHEELHOUSE_W
  const mastX = x + MAST_W / 2
  x += MAST_W
  busy.forEach(place)
  const leads = new Map(deck.crew.map(s => [s.id, s]))
  return {
    width: x + BOW, halls, rooms, everdoorX, wheelhouseX, mastX, at: deck.at,
    crew: halls.map(h => ({ id: h.lead, opus: leads.get(h.lead)?.model === 'opus', home: h.id })),
    done: deck.passengers.filter(p => lookOf(p) === 'everdoor').map(p => p.strand),
    islands: deck.gates.map(g => ({ stage: g.stage, state: g.state })),
    log: logOf(deck),
  }
}

const ago = (d: number) => d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`
const named = (s: string) => s.replace(/-/g, ' ')

/** The ship's log: the last week on board, newest first, one line a strand, at most a dozen lines. */
export function logOf(deck: Deck, max = 12): string[] {
  return deck.passengers
    .filter(p => p.days <= 7)
    .sort((a, b) => a.days - b.days || a.strand.localeCompare(b.strand))
    .slice(0, max)
    .map(p => {
      const when = ago(p.days), n = named(p.strand)
      const what = {
        everdoor: `${n} walked through the Everdoor`, bell: `${n} rang the bell for you`,
        scaffold: `the crew raised scaffolding on ${n}`, lit: `a light came on in ${n}`, vines: `${n} lay down to rest`,
      }[lookOf(p)]
      return `${when[0].toUpperCase() + when.slice(1)}, ${what}.`
    })
}
