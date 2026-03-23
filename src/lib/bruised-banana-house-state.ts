/**
 * Bruised Banana House — Instance.goalData shape for operator-visible state (Y Phase 2).
 * Coexists with interview JSON keys if present; preserves unknown keys on merge.
 */

export const HOUSE_GOAL_SCHEMA = 'bruised-banana-house-state-v1' as const

export type HouseStateV1 = {
  operatorNote?: string
  /** 1–5 subjective “house health” signal for operators */
  healthSignal?: number | null
  updatedAt?: string
  /** questId -> ISO date last marked done (optional; future automation) */
  recurringLastDone?: Record<string, string>
}

export type ParsedHouseGoalData = {
  v?: number
  schema?: string
  house?: HouseStateV1
  /** preserve extra keys from goal interview JSON */
  extra: Record<string, unknown>
}

function safeParse(raw: string | null | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {}
  try {
    const o = JSON.parse(raw) as unknown
    return o && typeof o === 'object' && !Array.isArray(o) ? (o as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function parseHouseGoalData(raw: string | null | undefined): ParsedHouseGoalData {
  const o = safeParse(raw)
  const { v, schema, house, ...rest } = o
  const houseObj =
    house && typeof house === 'object' && !Array.isArray(house) ? (house as Record<string, unknown>) : {}
  const hs: HouseStateV1 = {
    operatorNote: typeof houseObj.operatorNote === 'string' ? houseObj.operatorNote : undefined,
    healthSignal:
      typeof houseObj.healthSignal === 'number' && houseObj.healthSignal >= 1 && houseObj.healthSignal <= 5
        ? houseObj.healthSignal
        : houseObj.healthSignal === null
          ? null
          : undefined,
    updatedAt: typeof houseObj.updatedAt === 'string' ? houseObj.updatedAt : undefined,
    recurringLastDone:
      houseObj.recurringLastDone && typeof houseObj.recurringLastDone === 'object' && !Array.isArray(houseObj.recurringLastDone)
        ? (houseObj.recurringLastDone as Record<string, string>)
        : undefined,
  }
  return {
    v: typeof v === 'number' ? v : undefined,
    schema: typeof schema === 'string' ? schema : undefined,
    house: Object.keys(hs).length ? hs : undefined,
    extra: rest,
  }
}

export type HouseGoalMergePatch = {
  operatorNote: string
  /** Omit to leave previous health signal unchanged */
  healthSignal?: number | null
}

/**
 * Merge operator edits into Instance.goalData JSON string.
 */
export function mergeBruisedBananaHouseGoalData(
  previousGoalData: string | null | undefined,
  patch: HouseGoalMergePatch,
): string {
  const parsed = parseHouseGoalData(previousGoalData)
  const house: HouseStateV1 = {
    ...(parsed.house ?? {}),
    operatorNote: patch.operatorNote.trim() === '' ? undefined : patch.operatorNote.trim(),
    updatedAt: new Date().toISOString(),
  }
  if (patch.healthSignal !== undefined) {
    house.healthSignal = patch.healthSignal
  }
  const next: Record<string, unknown> = {
    ...parsed.extra,
    v: typeof parsed.v === 'number' ? parsed.v : 1,
    schema: HOUSE_GOAL_SCHEMA,
    house,
  }
  return JSON.stringify(next)
}

/** True when this instance is the BB house coordination row. */
export function isBruisedBananaHouseInstance(slug: string, campaignRef: string | null): boolean {
  return slug === 'bruised-banana-house' || campaignRef === 'bruised-banana-house'
}
