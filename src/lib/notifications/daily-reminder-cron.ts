import { db } from '@/lib/db'
import { parseNotificationPrefs } from '@/lib/notifications/prefs'
import { localDateKey, sendDailyReminderEmail } from '@/lib/notifications/send-email-notifications'

const QUIET_HOUR_START = 8
const QUIET_HOUR_END = 21

export type DailyReminderCronResult = {
  scanned: number
  sent: number
  skipped: number
  failed: number
}

function localHour(now: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now)
    const hourPart = parts.find((p) => p.type === 'hour')
    return hourPart ? Number(hourPart.value) : now.getUTCHours()
  } catch {
    return now.getUTCHours()
  }
}

function isWithinQuietHours(hour: number): boolean {
  return hour >= QUIET_HOUR_START && hour < QUIET_HOUR_END
}

/** Core cron job — exported for route handler. */
export async function runDailyReminderCron(now = new Date()): Promise<DailyReminderCronResult> {
  const result: DailyReminderCronResult = { scanned: 0, sent: 0, skipped: 0, failed: 0 }

  const players = await db.player.findMany({
    where: { notificationPrefsJson: { not: null } },
    select: { id: true, notificationPrefsJson: true },
    take: 5000,
  })

  for (const player of players) {
    const prefs = parseNotificationPrefs(player.notificationPrefsJson)
    if (!prefs.dailyReminder?.enabled || prefs.unsubscribedAll) continue

    const tz = prefs.dailyReminder.timezone ?? 'UTC'
    const targetHour = prefs.dailyReminder.hourLocal ?? 9
    const hour = localHour(now, tz)

    if (hour !== targetHour) continue
    if (!isWithinQuietHours(hour)) continue

    result.scanned += 1

    const sealedSessions = await db.tapTheVeinDailySession.findMany({
      where: { playerId: player.id, status: 'sealed' },
      select: { sessionDate: true },
      orderBy: { sessionDate: 'desc' },
      take: 5,
    })
    const periodKey = localDateKey(now, tz)
    const alreadySealedToday = sealedSessions.some(
      (s) => localDateKey(s.sessionDate, tz) === periodKey,
    )
    if (alreadySealedToday) {
      result.skipped += 1
      continue
    }

    const outcome = await sendDailyReminderEmail({ playerId: player.id })
    if (outcome === 'sent') result.sent += 1
    else if (outcome === 'failed') result.failed += 1
    else result.skipped += 1
  }

  return result
}
