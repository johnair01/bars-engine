import type { NotificationPreferences } from './types'
import { DEFAULT_NOTIFICATION_PREFS } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clampHour(h: unknown): number {
  const n = typeof h === 'number' ? h : Number(h)
  if (!Number.isFinite(n)) return DEFAULT_NOTIFICATION_PREFS.dailyReminder.hourLocal
  return Math.min(23, Math.max(0, Math.floor(n)))
}

/** Parse stored JSON into merged preferences with defaults. */
export function parseNotificationPrefs(raw: string | null | undefined): NotificationPreferences {
  if (!raw?.trim()) return { ...DEFAULT_NOTIFICATION_PREFS }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return { ...DEFAULT_NOTIFICATION_PREFS }

    const daily = isRecord(parsed.dailyReminder) ? parsed.dailyReminder : {}

    return {
      unsubscribedAll:
        typeof parsed.unsubscribedAll === 'boolean'
          ? parsed.unsubscribedAll
          : DEFAULT_NOTIFICATION_PREFS.unsubscribedAll,
      campaignInviteEmail:
        typeof parsed.campaignInviteEmail === 'boolean'
          ? parsed.campaignInviteEmail
          : DEFAULT_NOTIFICATION_PREFS.campaignInviteEmail,
      waitingForEmail:
        typeof parsed.waitingForEmail === 'boolean'
          ? parsed.waitingForEmail
          : DEFAULT_NOTIFICATION_PREFS.waitingForEmail,
      dailyReminder: {
        enabled:
          typeof daily.enabled === 'boolean'
            ? daily.enabled
            : DEFAULT_NOTIFICATION_PREFS.dailyReminder.enabled,
        hourLocal: clampHour(daily.hourLocal),
        timezone:
          typeof daily.timezone === 'string' && daily.timezone.trim()
            ? daily.timezone.trim()
            : DEFAULT_NOTIFICATION_PREFS.dailyReminder.timezone,
      },
      dailyReminderPromptDismissedAt:
        typeof parsed.dailyReminderPromptDismissedAt === 'string'
          ? parsed.dailyReminderPromptDismissedAt
          : undefined,
    }
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS }
  }
}

export function serializeNotificationPrefs(prefs: NotificationPreferences): string {
  return JSON.stringify(prefs)
}

export type NotificationPrefsPatch = {
  unsubscribedAll?: boolean
  campaignInviteEmail?: boolean
  waitingForEmail?: boolean
  dailyReminderEnabled?: boolean
  dailyReminderHourLocal?: number
  dailyReminderTimezone?: string
  dismissDailyReminderPrompt?: boolean
}

/** Merge a partial patch from settings UI into stored prefs. */
export function mergeNotificationPrefs(
  current: NotificationPreferences,
  patch: NotificationPrefsPatch,
): NotificationPreferences {
  const next: NotificationPreferences = { ...current }

  if (patch.unsubscribedAll !== undefined) next.unsubscribedAll = patch.unsubscribedAll
  if (patch.campaignInviteEmail !== undefined) next.campaignInviteEmail = patch.campaignInviteEmail
  if (patch.waitingForEmail !== undefined) next.waitingForEmail = patch.waitingForEmail

  if (
    patch.dailyReminderEnabled !== undefined ||
    patch.dailyReminderHourLocal !== undefined ||
    patch.dailyReminderTimezone !== undefined
  ) {
    next.dailyReminder = {
      enabled: patch.dailyReminderEnabled ?? next.dailyReminder?.enabled ?? false,
      hourLocal: clampHour(patch.dailyReminderHourLocal ?? next.dailyReminder?.hourLocal),
      timezone:
        patch.dailyReminderTimezone?.trim() ||
        next.dailyReminder?.timezone ||
        DEFAULT_NOTIFICATION_PREFS.dailyReminder.timezone,
    }
  }

  if (patch.dismissDailyReminderPrompt) {
    next.dailyReminderPromptDismissedAt = new Date().toISOString()
  }

  return next
}

export function canSendEmail(
  prefs: NotificationPreferences,
  kind: 'campaign_invite' | 'daily_reminder',
): boolean {
  if (prefs.unsubscribedAll) return false
  if (kind === 'campaign_invite') return prefs.campaignInviteEmail !== false
  if (kind === 'daily_reminder') return prefs.dailyReminder?.enabled === true
  return false
}
