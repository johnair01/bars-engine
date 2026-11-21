import 'server-only'

/**
 * Reads and writes for hosted campaigns. Mirrors `ally-campaign/content-server.ts`:
 * one read of `AppConfig.theme`, and a failed read falls back to the authored
 * defaults so the public page always renders.
 */

import crypto from 'crypto'
import { db } from '@/lib/db'
import {
  HOSTED_CAMPAIGNS_KEY,
  parseHostedStore,
  type HostedStore,
  type HostedStoredEntry,
} from './campaigns'

export async function getHostedStore(): Promise<HostedStore> {
  try {
    const config = await db.appConfig.findUnique({
      where: { id: 'singleton' },
      select: { theme: true },
    })
    return parseHostedStore(config?.theme)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getHostedStore] Falling back to authored defaults:', error)
    }
    return {}
  }
}

/**
 * Replace one campaign's stored entry, keeping every other key in the theme
 * (ally content, launch page, other campaigns) exactly as it was.
 */
export async function writeHostedEntry(
  slug: string,
  update: (current: HostedStoredEntry) => HostedStoredEntry,
  updatedBy?: string,
): Promise<HostedStoredEntry> {
  const existing = await db.appConfig.findUnique({
    where: { id: 'singleton' },
    select: { theme: true },
  })
  let theme: Record<string, unknown> = {}
  try {
    theme = existing?.theme ? (JSON.parse(existing.theme) as Record<string, unknown>) : {}
  } catch {
    theme = {}
  }
  const store = parseHostedStore(existing?.theme)
  const next = { ...update(store[slug] ?? {}), updatedAt: new Date().toISOString() }
  const nextTheme = JSON.stringify({ ...theme, [HOSTED_CAMPAIGNS_KEY]: { ...store, [slug]: next } })
  await db.appConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', theme: nextTheme, updatedBy },
    update: { theme: nextTheme, updatedBy },
  })
  return next
}

export function newEditToken(): string {
  return crypto.randomBytes(18).toString('base64url')
}
