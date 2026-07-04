import { sendEmail } from '@/lib/email/send'
import { absoluteUrl } from '@/lib/email/urls'
import {
  CampaignInviteEmail,
  campaignInviteText,
} from '@/lib/email/templates/CampaignInviteEmail'
import {
  DailyReminderEmail,
  dailyReminderText,
} from '@/lib/email/templates/DailyReminderEmail'
import { canSendEmail, parseNotificationPrefs } from '@/lib/notifications/prefs'
import { getPlayerEmail, getPlayerFirstName } from '@/lib/notifications/player-email'
import {
  createNotificationLog,
  finalizeNotificationLog,
  hasNotificationForPeriod,
} from '@/lib/notifications/log'
import { unsubscribeUrl } from '@/lib/notifications/unsubscribe-token'
import { db } from '@/lib/db'

export type SendEventInviteEmailInput = {
  targetPlayerId: string
  inviterPlayerId: string
  eventTitle: string
  eventDescription: string
  barId: string
  invitationId: string
}

/**
 * Persist-then-send event invitation email (HNTF Phase 2).
 * Failures are logged; never throws to caller.
 */
export async function sendEventInviteEmail(input: SendEventInviteEmailInput): Promise<void> {
  const { targetPlayerId, inviterPlayerId, eventTitle, eventDescription, barId, invitationId } =
    input

  const periodKey = `invite:${invitationId}`
  if (await hasNotificationForPeriod(targetPlayerId, 'event_invite', periodKey)) return

  const [targetRow, inviterRow, email] = await Promise.all([
    db.player.findUnique({
      where: { id: targetPlayerId },
      select: { notificationPrefsJson: true },
    }),
    db.player.findUnique({
      where: { id: inviterPlayerId },
      select: { name: true },
    }),
    getPlayerEmail(targetPlayerId),
  ])

  const prefs = parseNotificationPrefs(targetRow?.notificationPrefsJson)
  const log = await createNotificationLog({
    playerId: targetPlayerId,
    type: 'event_invite',
    periodKey,
    metadata: { invitationId, barId, toEmail: email },
  })

  if (!email) {
    await finalizeNotificationLog(log.id, 'skipped', null, { reason: 'no_email' })
    return
  }

  if (!canSendEmail(prefs, 'campaign_invite')) {
    await finalizeNotificationLog(log.id, 'skipped', null, { reason: 'pref_off' })
    return
  }

  const settingsUrl = absoluteUrl('/settings/notifications')
  const props = {
    inviterDisplayName: inviterRow?.name?.trim() || 'Someone',
    eventTitle,
    eventDescription,
    ctaUrl: absoluteUrl(`/bars/${barId}`),
    settingsUrl,
    unsubscribeUrl: unsubscribeUrl(targetPlayerId, 'campaign_invite'),
  }

  const result = await sendEmail({
    to: email,
    subject: `Invitation: ${eventTitle}`,
    react: CampaignInviteEmail(props),
    text: campaignInviteText(props),
    tags: [{ name: 'notification', value: 'event_invite' }],
  })

  if (!result.ok) {
    await finalizeNotificationLog(log.id, 'failed', null, { error: result.error })
    return
  }

  if (result.skipped) {
    await finalizeNotificationLog(log.id, 'skipped', null, { reason: result.reason })
    return
  }

  await finalizeNotificationLog(log.id, 'sent', result.id, { subject: `Invitation: ${eventTitle}` })
}

export type SendDailyReminderEmailInput = {
  playerId: string
}

export async function sendDailyReminderEmail(
  input: SendDailyReminderEmailInput,
): Promise<'sent' | 'skipped' | 'failed'> {
  const { playerId } = input

  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { notificationPrefsJson: true },
  })
  if (!player) return 'skipped'

  const prefs = parseNotificationPrefs(player.notificationPrefsJson)
  if (!canSendEmail(prefs, 'daily_reminder')) return 'skipped'

  const tz = prefs.dailyReminder?.timezone ?? 'UTC'
  const periodKey = localDateKey(new Date(), tz)
  if (await hasNotificationForPeriod(playerId, 'daily_reminder', periodKey)) return 'skipped'

  const email = await getPlayerEmail(playerId)
  const log = await createNotificationLog({
    playerId,
    type: 'daily_reminder',
    periodKey,
    metadata: { toEmail: email },
  })

  if (!email) {
    await finalizeNotificationLog(log.id, 'skipped', null, { reason: 'no_email' })
    return 'skipped'
  }

  const firstName = await getPlayerFirstName(playerId)
  const settingsUrl = absoluteUrl('/settings/notifications')
  const props = {
    playerFirstName: firstName,
    ctaUrl: absoluteUrl('/tap-the-vein'),
    settingsUrl,
    unsubscribeUrl: unsubscribeUrl(playerId, 'daily_reminder'),
  }

  const result = await sendEmail({
    to: email,
    subject: 'Tap the Vein — when you are ready',
    react: DailyReminderEmail(props),
    text: dailyReminderText(props),
    tags: [{ name: 'notification', value: 'daily_reminder' }],
  })

  if (!result.ok) {
    await finalizeNotificationLog(log.id, 'failed', null, { error: result.error })
    return 'failed'
  }

  if (result.skipped) {
    await finalizeNotificationLog(log.id, 'skipped', null, { reason: result.reason })
    return 'skipped'
  }

  await finalizeNotificationLog(log.id, 'sent', result.id, { periodKey })
  return 'sent'
}

export function localDateKey(now: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  } catch {
    return now.toISOString().slice(0, 10)
  }
}
