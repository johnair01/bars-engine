import type { NotificationPreferences, UnsubscribeScope } from './types'

export function applyUnsubscribeScope(
  prefs: NotificationPreferences,
  scope: UnsubscribeScope,
): NotificationPreferences {
  if (scope === 'all') {
    return {
      ...prefs,
      unsubscribedAll: true,
      dailyReminder: { ...prefs.dailyReminder, enabled: false, hourLocal: prefs.dailyReminder?.hourLocal ?? 9, timezone: prefs.dailyReminder?.timezone ?? 'UTC' },
      campaignInviteEmail: false,
    }
  }
  if (scope === 'daily_reminder') {
    return {
      ...prefs,
      dailyReminder: {
        enabled: false,
        hourLocal: prefs.dailyReminder?.hourLocal ?? 9,
        timezone: prefs.dailyReminder?.timezone ?? 'UTC',
      },
    }
  }
  return { ...prefs, campaignInviteEmail: false }
}
