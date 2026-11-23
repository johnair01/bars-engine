/**
 * WorkAdventure bridge claims (council row wa-world-kit-1, answer A: claims keyed by browser uuid).
 * The world script is a sensor, not an authority: every field is validated and re-decided here.
 * A uuid is a random id in the visitor's browser, so two browsers are two visitors and nothing
 * here may grant rights, rewards or edit access.
 */
export const WA_EVENTS = ['enter', 'leave', 'press', 'arrive'] as const
export type WaEventName = (typeof WA_EVENTS)[number]

export type WaClaim = { uuid: string; room: string; tile: { x: number; y: number } | null; event: WaEventName }
export type WaPresenceClaim = { uuid: string; room: string }

const UUID_RE = /^[A-Za-z0-9_-]{8,64}$/
const ROOM_RE = /^[a-z0-9][a-z0-9/_.-]{0,119}$/

function room(v: unknown): string | null {
  if (typeof v !== 'string') return null
  // WorkAdventure room ids look like /_/global/host/path/map.tmj; keep the last two segments.
  const parts = v.toLowerCase().split('/').filter(Boolean)
  const short = parts.slice(-2).join('/')
  return ROOM_RE.test(short) ? short : null
}

export function parsePresenceClaim(body: unknown): WaPresenceClaim | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>
  if (typeof b.uuid !== 'string' || !UUID_RE.test(b.uuid)) return null
  const r = room(b.room)
  return r ? { uuid: b.uuid, room: r } : null
}

export function parseClaim(body: unknown): WaClaim | null {
  const p = parsePresenceClaim(body)
  if (!p) return null
  const b = body as Record<string, unknown>
  if (!WA_EVENTS.includes(b.event as WaEventName)) return null
  let tile: WaClaim['tile'] = null
  if (b.tile !== undefined && b.tile !== null) {
    const t = b.tile as Record<string, unknown>
    if (!Number.isInteger(t?.x) || !Number.isInteger(t?.y)) return null
    const x = t.x as number
    const y = t.y as number
    if (x < 0 || y < 0 || x > 4096 || y > 4096) return null
    tile = { x, y }
  }
  return { ...p, tile, event: b.event as WaEventName }
}

export const PRESENCE_TTL_MS = 60_000
export const RATE_LIMIT = { windowMs: 10_000, max: 20 }

type Store = { seen: Map<string, { room: string; at: number }>; hits: Map<string, number[]> }
const g = globalThis as unknown as { __waBridge?: Store }
const store = (): Store => (g.__waBridge ??= { seen: new Map(), hits: new Map() })

/** True when this uuid is inside its rate limit. In-memory per server instance: best effort. */
export function allow(uuid: string, now = Date.now()): boolean {
  const s = store()
  const recent = (s.hits.get(uuid) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs)
  if (recent.length >= RATE_LIMIT.max) { s.hits.set(uuid, recent); return false }
  recent.push(now)
  s.hits.set(uuid, recent)
  return true
}

export function recordPresence(c: WaPresenceClaim, now = Date.now()): void {
  store().seen.set(c.uuid, { room: c.room, at: now })
}

export function forget(uuid: string): void {
  store().seen.delete(uuid)
}

/** Visitors per room, never ids. Expired entries are dropped. */
export function presenceCounts(now = Date.now()): Record<string, number> {
  const out: Record<string, number> = {}
  const s = store()
  for (const [uuid, v] of s.seen) {
    if (now - v.at > PRESENCE_TTL_MS) { s.seen.delete(uuid); continue }
    out[v.room] = (out[v.room] ?? 0) + 1
  }
  return out
}
