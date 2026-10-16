/**
 * WAVE room runs opened from the Council Board: what the cave page may send, and the shape the council reads.
 *
 * The record is the blocker panel's (Six-faces-council docs/blocker-panel.md) with engine "wave-room". The
 * council's pull reads only savedAt, status, stage, task, rounds[].name, resolution and charge; the rest rides along.
 */

export const WAVE_RUN_REF = /^[a-z0-9][a-z0-9-]{0,79}$/
/** A run is a few hundred words at most; anything near this is not a run. */
export const WAVE_RUN_MAX_BYTES = 64 * 1024

export type WaveRunInput = { ref: string; record: Record<string, unknown>; savedAt: Date }

export function checkWaveRun(body: unknown): { ok: true; run: WaveRunInput } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Send { ref, record }' }
  const { ref, record } = body as { ref?: unknown; record?: unknown }
  if (typeof ref !== 'string' || !WAVE_RUN_REF.test(ref)) return { ok: false, error: 'ref must be lower-case letters, digits and dashes' }
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { ok: false, error: 'record must be an object' }
  const r = record as Record<string, unknown>
  if (r.engine !== 'wave-room') return { ok: false, error: 'record.engine must be "wave-room"' }
  if (typeof r.savedAt !== 'string' || Number.isNaN(Date.parse(r.savedAt))) return { ok: false, error: 'record.savedAt must be a time' }
  if (JSON.stringify(record).length > WAVE_RUN_MAX_BYTES) return { ok: false, error: 'record is too large' }
  return { ok: true, run: { ref, record: r, savedAt: new Date(r.savedAt) } }
}

/** A save only replaces the stored one when it is newer, so a late debounced send cannot undo the finished run. */
export function isNewer(incoming: Date, stored: Date | null | undefined): boolean {
  return !stored || incoming.getTime() >= stored.getTime()
}
