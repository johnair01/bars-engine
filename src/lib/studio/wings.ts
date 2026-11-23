/** The Wings (/board/studio?wings=1): the Stores' finished crates as a hall of rooms, one room per strand
 * (his C on ag-shelf-look-1, 2026-11-21: "C but using the A ability to jump from deck to binder mode. Each room is a
 * deck of cards"). A room is a deck: one crate at a time, newest first, with Keep, Steer and Compost; a binder, only
 * when asked, lays the same room's crates as pages. A placement is the Stores' own save (collection `stores`, run
 * `gallery`), so a crate placed here has left the Stores floor too. No count is shown. Pure apart from `loadWings`. */
import { CRATE_RUN, placementId, type Placement } from './stores'

export type WingCrate = { id: string; title: string; round: string; pic: string; maker: string | null }
export type Room = { strand: string; name: string; crates: WingCrate[] }
export type WingsWorld = { rooms: Room[]; demo: boolean }
/** The hall shows this many rooms, the strands with the newest crates first. */
export const HALL_CAP = 12
/** A room's door shows this many of its newest crates. */
export const DOOR_CAP = 3

/** A round's strand: its slug without the date and without the trailing round number ("2026-11-11-heaven-r28" is "heaven"). */
export function strandOf(round: string): string {
  const s = round.replace(/^\d{4}-\d\d-\d\d-/, '').replace(/(-(?:r|round|v|ad|look|part|slice|b|a)?\d+[a-z]?)+$/, '')
  return s || round
}

export function strandName(strand: string): string {
  const w = strand.replace(/-/g, ' ')
  return w.charAt(0).toUpperCase() + w.slice(1)
}

type Src = { sha: string; round: string; title: string; maker: string | null; picture: string; reviewed?: unknown }

/** Group unreviewed, unplaced crates (given newest first) into rooms; the room with the newest crate comes first. */
export function wingsOf(crates: Src[], placed: Record<string, Placement>): WingsWorld {
  const rooms = new Map<string, Room>()
  for (const c of crates) {
    if (c.reviewed) continue
    const id = 'crate-' + c.sha.slice(0, 16)
    if (placed[placementId(CRATE_RUN, id)]) continue
    const strand = strandOf(c.round)
    const room = rooms.get(strand) ?? { strand, name: strandName(strand), crates: [] }
    room.crates.push({ id, title: c.title, round: c.round, pic: c.picture, maker: c.maker })
    rooms.set(strand, room)
  }
  return { rooms: [...rooms.values()].slice(0, HALL_CAP), demo: false }
}

export function demoWings(): WingsWorld {
  const c = (n: number, title: string, round: string): WingCrate => ({ id: 'demo-' + n, title, round, pic: n % 2 ? '/studio/demo/crate-1.jpg' : '/studio/demo/crate-2.jpg', maker: null })
  return { demo: true, rooms: [
    { strand: 'heaven', name: 'Heaven', crates: [c(1, 'The sect hall from above', '2026-11-11-heaven-r28'), c(2, 'The hall at the stair head', '2026-11-11-heaven-r27'), c(3, 'The climb', '2026-11-10-heaven-r26'), c(4, 'The gate', '2026-11-09-heaven-r25')] },
    { strand: 'money-gate', name: 'Money gate', crates: [c(5, 'The till', '2026-10-30-money-gate-2'), c(6, 'The first coin', '2026-10-30-money-gate-1')] },
    { strand: 'hollow-interface', name: 'Hollow interface', crates: [c(7, 'The hollow', '2026-10-30-hollow-interface-3')] },
  ] }
}

export async function loadWings(placed: Record<string, Placement>): Promise<WingsWorld | null> {
  const { allCrates } = await import('@/lib/board/gallery')
  const crates = await allCrates().catch(() => null)
  return crates ? wingsOf(crates, placed) : null
}
