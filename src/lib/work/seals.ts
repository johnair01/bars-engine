/**
 * The receipt seal (council position sr-receipt-seal, his pick B on rs1-look-1: the seal on its route). Each card he
 * sent carries one seal that reads the work queue, so the card tells him the same truth the workers see:
 *
 *   sent     the ticket is ready in a lit lane; the line names the next pickup
 *   picked   a worker claimed it ("Claude has it")
 *   done     a worker closed it; the line is its one-line result
 *   waiting  the work cannot move: every lane in its order is dry, or the worker gave up on it; the line names why
 *
 * Nothing else: no percentages, no ids, no lane words beyond the lane's own name.
 */

export type SealState = 'sent' | 'picked' | 'done' | 'waiting'

export interface SealTicket {
  sourceKey: string
  basis: unknown
  lane: string
  lanes: string[]
  state: string
  result: string | null
  createdAt: Date
  updatedAt: Date
  doneAt: Date | null
}

export interface DryLane { lane: string; dryUntil: Date | null }

export interface Seal {
  /** The board row the card is. */
  row: string
  state: SealState
  /** The lane that holds it, by the name he gave it (Claude, Freebuff). */
  lane: string
  sentAt: string
  /** When a worker picked it up, while it holds it. */
  pickedAt: string | null
  doneAt: string | null
  /** A worker's one-line result (done) or why it stopped (waiting after a failure). */
  result: string | null
  /** For waiting on a dry lane: when the lamp comes back on by itself. */
  movesAt: string | null
}

/** The Claude lane is picked up hourly at this minute (council board/work_pickup.py, the :12 routine). */
export const PICKUP_MINUTE = 12
/** A Done seal stays on the table one day, then the card leaves it (spec section 4 is not built; one round = one day). */
export const DONE_KEEP_MS = 24 * 60 * 60 * 1000

export const LANE_NAME: Record<string, string> = { claude: 'Claude', freebuff: 'Freebuff' }

/** The board row a ticket answers: basis.rows[0], else the docId in a council/questions/<id>@<answer> key. */
export function rowOf(t: Pick<SealTicket, 'sourceKey' | 'basis'>): string | null {
  const rows = (t.basis as { rows?: unknown } | null)?.rows
  if (Array.isArray(rows) && typeof rows[0] === 'string' && rows[0]) return rows[0]
  const m = /^council\/questions\/([^@]+)@/.exec(t.sourceKey)
  return m ? m[1] : null
}

/** The next pickup after `now`: the coming :12 of the hour. */
export function nextPickup(now: Date): Date {
  const d = new Date(now)
  d.setUTCSeconds(0, 0)
  d.setUTCMinutes(PICKUP_MINUTE)
  if (d <= now) d.setUTCHours(d.getUTCHours() + 1)
  return d
}

function stateOf(t: SealTicket, dry: Map<string, Date | null>): { state: SealState; movesAt: Date | null } {
  if (t.state === 'done') return { state: 'done', movesAt: null }
  if (t.state === 'claimed') return { state: 'picked', movesAt: null }
  if (t.state === 'failed' || t.state === 'held') return { state: 'waiting', movesAt: null }
  // ready: it waits only when its own lane is dry and no lane after it in its order is lit
  if (dry.has(t.lane)) {
    const after = t.lanes.slice(t.lanes.indexOf(t.lane) + 1)
    if (after.every(l => dry.has(l))) {
      const back = [t.lane, ...after].map(l => dry.get(l)).filter((d): d is Date => !!d).sort((a, b) => +a - +b)[0]
      return { state: 'waiting', movesAt: back ?? null }
    }
  }
  return { state: 'sent', movesAt: null }
}

/**
 * One seal per card, from the newest ticket for its row (a later answer to the same card replaces the earlier one).
 * Done seals older than a day leave the table.
 */
export function sealsFrom(tickets: SealTicket[], dryLanes: DryLane[], now = new Date()): Seal[] {
  const dry = new Map(dryLanes.map(d => [d.lane, d.dryUntil]))
  const newest = new Map<string, SealTicket>()
  for (const t of tickets) {
    const row = rowOf(t)
    if (!row) continue
    const was = newest.get(row)
    if (!was || t.createdAt > was.createdAt) newest.set(row, t)
  }
  const out: Seal[] = []
  for (const [row, t] of newest) {
    if (t.state === 'done' && t.doneAt && now.getTime() - t.doneAt.getTime() > DONE_KEEP_MS) continue
    const { state, movesAt } = stateOf(t, dry)
    // updatedAt is the claim on a claimed ticket (a heartbeat moves it later; the line then reads the last beat)
    const picked = t.state === 'claimed'
    out.push({
      row, state, lane: LANE_NAME[t.lane] ?? t.lane,
      sentAt: t.createdAt.toISOString(),
      pickedAt: picked ? t.updatedAt.toISOString() : null,
      doneAt: t.doneAt ? t.doneAt.toISOString() : null,
      result: state === 'done' || state === 'waiting' ? (t.result ?? '').trim().slice(0, 300) || null : null,
      movesAt: movesAt ? movesAt.toISOString() : null,
    })
  }
  return out.sort((a, b) => b.sentAt.localeCompare(a.sentAt))
}
