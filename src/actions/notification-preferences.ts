'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import {
  mergeNotificationPrefs,
  parseNotificationPrefs,
  serializeNotificationPrefs,
  type NotificationPrefsPatch,
} from '@/lib/notifications/prefs'
import { listRecentNotificationLogs } from '@/lib/notifications/log'
import type { NotificationPreferences } from '@/lib/notifications/types'
import { applyUnsubscribeScope } from '@/lib/notifications/apply-unsubscribe'

export type NotificationPreferencesView = {
  prefs: NotificationPreferences
  recentLogs: Awaited<ReturnType<typeof listRecentNotificationLogs>>
  email: string | null
}

export async function getNotificationPreferencesView(): Promise<
  NotificationPreferencesView | { error: string }
> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const row = await db.player.findUnique({
    where: { id: player.id },
    select: {
      notificationPrefsJson: true,
      contactType: true,
      contactValue: true,
      account: { select: { email: true } },
    },
  })
  if (!row) return { error: 'Player not found' }

  const email =
    row.account?.email?.trim().toLowerCase() ??
    (row.contactType === 'email' ? row.contactValue?.trim().toLowerCase() : null) ??
    null

  return {
    prefs: parseNotificationPrefs(row.notificationPrefsJson),
    recentLogs: await listRecentNotificationLogs(player.id),
    email,
  }
}

export async function updateNotificationPreferences(
  patch: NotificationPrefsPatch,
): Promise<{ success: true; prefs: NotificationPreferences } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const row = await db.player.findUnique({
    where: { id: player.id },
    select: { notificationPrefsJson: true },
  })
  if (!row) return { error: 'Player not found' }

  const current = parseNotificationPrefs(row.notificationPrefsJson)
  const next = mergeNotificationPrefs(current, patch)

  await db.player.update({
    where: { id: player.id },
    data: { notificationPrefsJson: serializeNotificationPrefs(next) },
  })

  revalidatePath('/settings/notifications')
  return { success: true, prefs: next }
}

/** Apply unsubscribe token scope without requiring login. */
export async function applyUnsubscribeForPlayer(
  playerId: string,
  scope: 'all' | 'daily_reminder' | 'campaign_invite',
): Promise<void> {
  const row = await db.player.findUnique({
    where: { id: playerId },
    select: { notificationPrefsJson: true },
  })
  if (!row) return

  const current = parseNotificationPrefs(row.notificationPrefsJson)
  const next = applyUnsubscribeScope(current, scope)

  await db.player.update({
    where: { id: playerId },
    data: { notificationPrefsJson: serializeNotificationPrefs(next) },
  })
}
