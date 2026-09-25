import 'server-only'

/**
 * Server-side reads for ally-campaign content.
 *
 * Mirrors `src/lib/launch/page-content-server.ts`: a single read of
 * `AppConfig.theme`, parsed defensively, with the authored TS content as the
 * fallback for every failure mode — unreachable database, missing row, malformed
 * JSON. A public letter must render even when the admin layer is broken.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  parseAllyContentTheme,
  resolveAllyContent,
  type AllyContentOverrides,
  type ResolvedAllyContent,
} from './content-overrides'

/** Raw overrides. Returns `{}` rather than throwing on any failure. */
export async function getAllyContentOverrides(): Promise<AllyContentOverrides> {
  try {
    const config = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })
    return parseAllyContentTheme(config?.theme)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getAllyContentOverrides] Falling back to authored defaults:', error)
    }
    return {}
  }
}

/** Fully-resolved content for one invite slug. */
export async function getAllyContent(slug: string | undefined): Promise<ResolvedAllyContent> {
  return resolveAllyContent(slug, await getAllyContentOverrides())
}

/**
 * Whether the current viewer holds the global `admin` role — the gate for showing
 * the inline editor. Read-only and failure-tolerant: an error here must hide the
 * editor, never break the page for a visitor.
 */
export async function isCurrentPlayerAdmin(): Promise<boolean> {
  try {
    const player = await getCurrentPlayer()
    return player?.roles.some((role) => role.role.key === 'admin') ?? false
  } catch {
    return false
  }
}
