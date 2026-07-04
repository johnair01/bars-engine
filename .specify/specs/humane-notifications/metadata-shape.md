# Notification preferences & log shapes

## `Player.notificationPrefsJson`

Stored as JSON string on `Player`. Merge on update; never wipe unknown keys.

```ts
export type NotificationPreferences = {
  /** Legal kill switch — stops all non-auth email */
  unsubscribedAll?: boolean

  /** Campaign / event invitation email (transactional). Default true. */
  campaignInviteEmail?: boolean

  /** Opt-in daily Tap the Vein nudge. Default false. */
  dailyReminder?: {
    enabled: boolean
    /** 0–23 local hour to send. Default 9. */
    hourLocal?: number
    /** IANA timezone, e.g. America/Los_Angeles. Default from browser or UTC. */
    timezone?: string
  }

  /** Future: PMA external waiting-for follow-up. Default false. */
  waitingForEmail?: boolean

  /** When player last dismissed the opt-in prompt for daily reminder */
  dailyReminderPromptDismissedAt?: string // ISO
}
```

### Defaults (server-side when null)

```ts
const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  unsubscribedAll: false,
  campaignInviteEmail: true,
  dailyReminder: { enabled: false, hourLocal: 9, timezone: 'UTC' },
  waitingForEmail: false,
}
```

---

## `NotificationLog`

Prisma model — audit + idempotency.

```ts
export type NotificationType =
  | 'campaign_invite'
  | 'event_invite'
  | 'daily_reminder'
  | 'waiting_for_followup' // future
  | 'awaken_chapter'       // existing funnel — backfill optional
  | 'rsvp_confirm'           // existing funnel — backfill optional

export type NotificationChannel = 'email' | 'in_app' | 'push' // push unused v1

export type NotificationStatus = 'pending' | 'sent' | 'skipped' | 'failed'

// NotificationLog row
{
  id: string
  playerId: string
  type: NotificationType
  channel: NotificationChannel
  status: NotificationStatus
  /** Resend message id, or skip reason */
  externalId?: string | null
  /** Idempotency: local date for daily_reminder YYYY-MM-DD */
  periodKey?: string | null
  sentAt?: Date | null
  metadataJson?: string | null // { subject, toEmail, eventInviteId, error? }
}
```

### Idempotency

- **daily_reminder:** unique `(playerId, type, periodKey)` where `periodKey` = local date
- **invite:** one log per `eventInviteId` or invite BAR id

---

## Unsubscribe token (signed, stateless v1)

Payload (HMAC with `NOTIFICATION_UNSUBSCRIBE_SECRET`):

```ts
{ playerId: string; scope: 'all' | 'daily_reminder' | 'campaign_invite'; exp: number }
```

`GET /api/notifications/unsubscribe?token=…` applies scope to prefs without login.

---

## Email template inputs

### `CampaignInviteEmail`

```ts
{
  inviterDisplayName: string
  campaignOrEventTitle: string
  ctaUrl: string
  settingsUrl: string
  unsubscribeUrl: string // scope: campaign_invite or all per policy
}
```

### `DailyReminderEmail`

```ts
{
  playerFirstName?: string
  ctaUrl: string // /tap-the-vein or /now
  settingsUrl: string
  unsubscribeUrl: string // scope: daily_reminder
}
```
