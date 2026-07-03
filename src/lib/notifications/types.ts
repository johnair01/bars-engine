export type NotificationType =
  | 'campaign_invite'
  | 'event_invite'
  | 'daily_reminder'
  | 'waiting_for_followup'

export type NotificationChannel = 'email' | 'in_app' | 'push'

export type NotificationStatus = 'pending' | 'sent' | 'skipped' | 'failed'

export type UnsubscribeScope = 'all' | 'daily_reminder' | 'campaign_invite'

export type NotificationPreferences = {
  unsubscribedAll?: boolean
  campaignInviteEmail?: boolean
  dailyReminder?: {
    enabled: boolean
    hourLocal?: number
    timezone?: string
  }
  waitingForEmail?: boolean
  dailyReminderPromptDismissedAt?: string
}

export const DEFAULT_NOTIFICATION_PREFS: Required<
  Pick<NotificationPreferences, 'unsubscribedAll' | 'campaignInviteEmail' | 'waitingForEmail'>
> & {
  dailyReminder: { enabled: boolean; hourLocal: number; timezone: string }
} = {
  unsubscribedAll: false,
  campaignInviteEmail: true,
  waitingForEmail: false,
  dailyReminder: { enabled: false, hourLocal: 9, timezone: 'UTC' },
}
