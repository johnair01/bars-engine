import 'server-only'

/**
 * The courier's count, "N of about 300 shipped". Lives in AppConfig.theme under its own key, so an admin changes it
 * without a deploy (same row and pattern as ally-campaign content). A missing or malformed value hides the count.
 */
import { db } from '@/lib/db'

export const FOUNDER_GATE_KEY = 'founderGate'

export function parseShipped(theme: string | null | undefined): number | null {
  try {
    const parsed = theme ? (JSON.parse(theme) as Record<string, unknown>) : {}
    const gate = parsed[FOUNDER_GATE_KEY] as { shipped?: unknown } | undefined
    const n = gate?.shipped
    return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : null
  } catch {
    return null
  }
}

export async function getShippedCount(): Promise<number | null> {
  try {
    const config = await db.appConfig.findUnique({ where: { id: 'singleton' }, select: { theme: true } })
    return parseShipped(config?.theme)
  } catch {
    return null
  }
}
