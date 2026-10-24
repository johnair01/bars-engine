/** The deck as a place (art direction "Lantern deck", board ty-still-pick = A). Every strand is a house on the boat
 * and its state is how the house looks, never a list: a bell and a letter when it waits on Wendell, scaffolding while
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
export type World = {
  width: number; houses: House[]; crew: CrewMate[]; wheelhouseX: number; mastX: number; everdoorX: number
  ladders: number[]; done: string[]; islands: { stage: string; state: string }[]; at: string
  /** The ship's log in the wheelhouse: what happened on board lately, newest first, in plain words. */
  log: string[]
}

export const HOUSE_W = 150
const GAP = 14
const STERN = 220 // the Everdoor and its steps
const WHEELHOUSE_W = 300
const MAST_W = 300 // room for the hammock between the wheelhouse and the mast
const BOW = 260

/** A thread is building it when it moved within a day; otherwise moving strands just glow. */
export function lookOf(p: Passenger): Look {
  if (p.mood === 'done') return 'everdoor'
  if (p.mood === 'waiting') return 'bell'
  if (p.mood === 'moving') return p.days <= 1 || (p.loop?.ahead ?? 0) > 0 ? 'scaffold' : 'lit'
  return 'vines'
}

/** The strand's own words, trimmed to what one character can say in one bubble. */
export function lineOf(p: Passenger, max = 140): string {
  const s = (p.mood === 'waiting' ? p.next : p.text).replace(/`/g, '').replace(/\s+/g, ' ').trim()
  return s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max - 1)).replace(/[,;:]$/, '') + '…'
}

/** A stable colour per strand, so a house keeps its roof between visits. */
export function hueOf(name: string): number {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

/** Two rows, stern to bow: the Everdoor, resting houses (oldest nearest the door), the wheelhouse, the mast, the
 * moving and building houses, then the houses with bells at the bow, where you see them first. Each region fills
 * the lower deck and the gallery above it, split evenly. */
export function worldOf(deck: Deck): World {
  const house = (p: Passenger): Omit<House, 'tier' | 'x'> => ({
    strand: p.strand, look: lookOf(p), glow: Math.round(p.glow * 100) / 100,
    vines: p.mood === 'resting' ? Math.min(1, Math.round((p.days / 21) * 100) / 100 + 0.2) : 0,
    letters: p.loop?.ahead ?? 0, line: lineOf(p), hue: hueOf(p.strand), days: p.days,
  })
  const by = (l: Look[]) => deck.passengers.filter(p => l.includes(lookOf(p)))
  const resting = by(['vines']).sort((a, b) => b.days - a.days || a.strand.localeCompare(b.strand))
  const working = [...by(['scaffold']), ...by(['lit'])]
  const bells = by(['bell']).sort((a, b) => a.days - b.days || a.strand.localeCompare(b.strand))

  const houses: House[] = [], ladders: number[] = []
  let x = STERN
  const region = (list: Passenger[]) => {
    const cols = Math.ceil(list.length / 2)
    list.forEach((p, i) => {
      const tier = (i % 2) as 0 | 1, col = Math.floor(i / 2)
      houses.push({ ...house(p), tier, x: x + col * (HOUSE_W + GAP) + HOUSE_W / 2 })
    })
    x += cols * (HOUSE_W + GAP)
    if (cols) ladders.push(x - GAP / 2)
  }
  const everdoorX = STERN / 2
  region(resting)
  const wheelhouseX = x + WHEELHOUSE_W / 2
  x += WHEELHOUSE_W
  const mastX = x + MAST_W / 2
  x += MAST_W
  region(working)
  region(bells)
  return {
    width: x + BOW, houses, ladders, everdoorX, wheelhouseX, mastX, at: deck.at,
    crew: deck.crew.slice(0, Math.max(3, Math.min(8, working.length))).map((s, i) => ({
      id: s.id, opus: s.model === 'opus', home: working[i % Math.max(1, working.length)]?.strand ?? '',
    })),
    done: by(['everdoor']).map(p => p.strand),
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
