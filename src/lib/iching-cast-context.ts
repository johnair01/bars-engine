/**
 * Optional collective / campaign context for I Ching casts.
 * @see .specify/specs/scene-atlas-game-loop/spec.md
 */

export type IChingCastContext = {
  instanceId?: string | null
  campaignRef?: string | null
  threadId?: string | null
  /** Resolved server-side from `instanceId` when present */
  instanceName?: string | null
}

export type IChingReadingLogEntry = {
  at: string
  hexagramId: number
  instanceId?: string | null
  campaignRef?: string | null
  threadId?: string | null
  instanceName?: string | null
}

function parseStoryProgressJson(s: string | null | undefined): Record<string, unknown> {
  if (!s?.trim()) return {}
  try {
    const o = JSON.parse(s) as Record<string, unknown>
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {}
  } catch {
    return {}
  }
}

/** Append a reading record to `storyProgress.ichingReadings` (keeps last 50). */
export function appendIChingReadingToStoryProgress(
  existing: string | null | undefined,
  entry: Omit<IChingReadingLogEntry, 'at'> & { hexagramId: number }
): string {
  const base = parseStoryProgressJson(existing)
  const prev = Array.isArray(base.ichingReadings) ? [...(base.ichingReadings as object[])] : []
  const full: IChingReadingLogEntry = {
    at: new Date().toISOString(),
    hexagramId: entry.hexagramId,
    instanceId: entry.instanceId ?? null,
    campaignRef: entry.campaignRef ?? null,
    threadId: entry.threadId ?? null,
    instanceName: entry.instanceName ?? null,
  }
  prev.push(full as unknown as object)
  return JSON.stringify({ ...base, ichingReadings: prev.slice(-50) })
}

export function hasIChingCastContext(ctx: IChingCastContext | null | undefined): boolean {
  if (!ctx) return false
  return Boolean(
    (ctx.instanceId && ctx.instanceId.trim()) ||
      (ctx.campaignRef && ctx.campaignRef.trim()) ||
      (ctx.threadId && ctx.threadId.trim()) ||
      (ctx.instanceName && ctx.instanceName.trim())
  )
}
