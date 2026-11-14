/**
 * The fleet: every open ticket at its altitude, so Wendell can stand on one rung and steer any ticket to another lane
 * (fleet-altitude-look-1, his answer "a + C", 2026-11-13: the ladder of option A, with tickets as lanterns he drags
 * between lanes from option C).
 *
 *   oars   the ticket is moving: ready and young, or a worker holds it with a live lease. The rowers' business.
 *   ship   it has stalled: ready with no pickup for STALL_SHIP_MS, held for a read receipt, or its worker went quiet.
 *   fleet  it is blocked and needs him: it failed, every lane in its order is dry, or it stalled past STALL_FLEET_MS.
 *
 * A ticket only climbs: nothing is placed above where its trouble puts it. The board draws the rung he stands on and
 * every rung above it; tickets below are counted, not drawn. `why` is one plain sentence for the lantern's back.
 */
import { LANES } from './lanes'

export type Altitude = 'oars' | 'ship' | 'fleet'

/** No pickup in two hours: two hourly pickups have passed it by (the seals' STUCK_MS). */
export const STALL_SHIP_MS = 2 * 60 * 60 * 1000
/** Stalled for a day: the lanes will not sort it out alone, so it climbs to him. */
export const STALL_FLEET_MS = 24 * 60 * 60 * 1000

export interface FleetTicket {
  id: string
  title: string
  lane: string
  lanes: string[]
  state: string
  result: string | null
  leaseUntil: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface FleetLantern {
  id: string
  title: string
  lane: string
  state: string
  altitude: Altitude
  why: string
  /** When the ticket entered the state it is in (its push, or its claim). */
  since: string
  /** The lanes he can steer it to: every known lane but the one it is in. */
  steerTo: string[]
}

const NAME: Record<string, string> = { claude: 'Claude', freebuff: 'Freebuff', deepai: 'DeepAI' }
const name = (l: string) => NAME[l] ?? l

function hours(ms: number): string {
  const h = Math.floor(ms / 3600000)
  return h < 1 ? 'under an hour' : h === 1 ? 'an hour' : h < 48 ? `${h} hours` : `${Math.floor(h / 24)} days`
}

export function altitudeOf(t: FleetTicket, dry: Set<string>, now = new Date()): { altitude: Altitude; why: string } {
  const age = now.getTime() - t.createdAt.getTime()
  if (t.state === 'failed') {
    const r = (t.result ?? '').trim().slice(0, 160)
    return { altitude: 'fleet', why: r ? `${name(t.lane)} gave it up: ${r}` : `${name(t.lane)} gave it up.` }
  }
  if (t.state === 'claimed') {
    if (t.leaseUntil && t.leaseUntil < now) {
      const quiet = now.getTime() - t.leaseUntil.getTime()
      return quiet > STALL_FLEET_MS
        ? { altitude: 'fleet', why: `${name(t.lane)} took it and has said nothing for ${hours(quiet)}.` }
        : { altitude: 'ship', why: `${name(t.lane)} took it and went quiet.` }
    }
    return { altitude: 'oars', why: `${name(t.lane)} is working it.` }
  }
  if (t.state === 'held') {
    return age > STALL_FLEET_MS
      ? { altitude: 'fleet', why: `It has waited ${hours(age)} for a read receipt.` }
      : { altitude: 'ship', why: 'It waits for a worker to read its card first.' }
  }
  // ready
  const order = t.lanes.length ? t.lanes : [t.lane]
  if (order.every(l => dry.has(l))) {
    return { altitude: 'fleet', why: `Every lane it may run in is dry (${order.map(name).join(', ')}).` }
  }
  if (age > STALL_FLEET_MS) return { altitude: 'fleet', why: `No one has picked it up in ${hours(age)}.` }
  if (age > STALL_SHIP_MS) return { altitude: 'ship', why: `No one has picked it up in ${hours(age)}.` }
  return { altitude: 'oars', why: `It waits for ${name(t.lane)}'s next pickup.` }
}

/** Every open ticket (ready, claimed, held, failed) as a lantern, highest altitude first, then oldest first. */
export function fleetFrom(tickets: FleetTicket[], dry: Set<string>, now = new Date()): FleetLantern[] {
  const rank: Record<Altitude, number> = { fleet: 0, ship: 1, oars: 2 }
  return tickets
    .filter(t => ['ready', 'claimed', 'held', 'failed'].includes(t.state))
    .map(t => {
      const { altitude, why } = altitudeOf(t, dry, now)
      return {
        id: t.id, title: t.title, lane: t.lane, state: t.state, altitude, why,
        since: (t.state === 'claimed' ? t.updatedAt : t.createdAt).toISOString(),
        steerTo: (LANES as readonly string[]).filter(l => l !== t.lane),
      }
    })
    .sort((a, b) => rank[a.altitude] - rank[b.altitude] || a.since.localeCompare(b.since))
}
