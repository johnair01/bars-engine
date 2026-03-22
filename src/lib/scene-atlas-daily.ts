/**
 * Daily bind limit for Scene Atlas (personal throughput). Stored in `Player.storyProgress.sceneAtlasDaily`.
 * @see .specify/specs/scene-atlas-game-loop/spec.md
 */

const DAY_KEY = 'sceneAtlasDaily' as const

export type SceneAtlasDailyPayload = {
  /** UTC calendar date YYYY-MM-DD */
  date: string
  /** Successful new card binds today */
  count: number
}

export function getSceneAtlasDailyLimit(): number {
  const raw = process.env.SCENE_ATLAS_DAILY_LIMIT
  const n = raw != null && raw !== '' ? Number.parseInt(raw, 10) : NaN
  if (Number.isFinite(n) && n >= 0) return n
  return 15
}

export function utcDateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function parseStoryProgressBase(storyProgress: string | null | undefined): Record<string, unknown> {
  if (!storyProgress?.trim()) return {}
  try {
    const o = JSON.parse(storyProgress) as Record<string, unknown>
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {}
  } catch {
    return {}
  }
}

export function getSceneAtlasDailyFromProgress(storyProgress: string | null | undefined): SceneAtlasDailyPayload | null {
  const base = parseStoryProgressBase(storyProgress)
  const raw = base[DAY_KEY]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const d = raw as Record<string, unknown>
  const date = typeof d.date === 'string' ? d.date : ''
  const count = typeof d.count === 'number' && Number.isFinite(d.count) ? Math.max(0, Math.floor(d.count)) : 0
  if (!date) return null
  return { date, count }
}

export function getSceneAtlasDailyState(storyProgress: string | null | undefined): {
  used: number
  limit: number
  remaining: number
} {
  const limit = getSceneAtlasDailyLimit()
  if (limit === 0) return { used: 0, limit: 0, remaining: Number.POSITIVE_INFINITY }
  const today = utcDateKey()
  const cur = getSceneAtlasDailyFromProgress(storyProgress)
  const used = cur?.date === today ? cur.count : 0
  return { used, limit, remaining: Math.max(0, limit - used) }
}

/** Returns null if bind is allowed; otherwise an error message for the UI. */
export function sceneAtlasDailyBindBlocked(storyProgress: string | null | undefined): string | null {
  const { remaining, limit } = getSceneAtlasDailyState(storyProgress)
  if (limit === 0) return null
  if (remaining <= 0) {
    return `Daily Scene Atlas limit reached (${limit} answers per day, UTC). Try again tomorrow.`
  }
  return null
}

/** Merge incremented daily count into existing storyProgress JSON string. */
export function incrementSceneAtlasDailyInStoryProgress(existing: string | null | undefined): string {
  const base = parseStoryProgressBase(existing)
  const today = utcDateKey()
  const cur = getSceneAtlasDailyFromProgress(existing)
  const count = cur?.date === today ? cur.count + 1 : 1
  return JSON.stringify({
    ...base,
    [DAY_KEY]: { date: today, count },
  })
}
