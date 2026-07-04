'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateNotificationPreferences } from '@/actions/notification-preferences'
import type { NotificationPreferences } from '@/lib/notifications/types'

type LogRow = {
  id: string
  type: string
  channel: string
  status: string
  sentAt: Date | null
  createdAt: Date
}

type NotificationSettingsClientProps = {
  initialPrefs: NotificationPreferences
  recentLogs: LogRow[]
  email: string | null
  unsubscribedMessage?: string | null
  errorMessage?: string | null
}

const mono = 'var(--bars-font-mono)'
const body = 'var(--bars-font-body)'

function formatType(type: string): string {
  if (type === 'event_invite') return 'Event invite'
  if (type === 'daily_reminder') return 'Daily reminder'
  if (type === 'campaign_invite') return 'Campaign invite'
  return type
}

export function NotificationSettingsClient({
  initialPrefs,
  recentLogs,
  email,
  unsubscribedMessage,
  errorMessage,
}: NotificationSettingsClientProps) {
  const [prefs, setPrefs] = useState(initialPrefs)
  const [message, setMessage] = useState<string | null>(unsubscribedMessage ?? null)
  const [pending, startTransition] = useTransition()

  function save(patch: Parameters<typeof updateNotificationPreferences>[0]) {
    startTransition(async () => {
      const res = await updateNotificationPreferences(patch)
      if ('error' in res) {
        setMessage(res.error)
        return
      }
      setPrefs(res.prefs)
      setMessage('Saved.')
    })
  }

  const dailyEnabled = prefs.dailyReminder?.enabled ?? false
  const inviteEmail = prefs.campaignInviteEmail !== false

  return (
    <div className="flex flex-col gap-6">
      {errorMessage ? (
        <p style={{ fontFamily: body, fontSize: 14, color: '#e74c3c' }}>{errorMessage}</p>
      ) : null}
      {message ? (
        <p style={{ fontFamily: body, fontSize: 14, color: 'var(--bars-text-secondary)' }}>{message}</p>
      ) : null}

      <section>
        <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '0 0 8px' }}>
          Delivery address
        </p>
        <p style={{ fontFamily: body, fontSize: 14, color: 'var(--bars-text-primary)', margin: 0 }}>
          {email ?? 'No email on file — add one to your account to receive notifications.'}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <label className="flex items-start gap-3 cursor-pointer" style={{ minHeight: 44 }}>
          <input
            type="checkbox"
            checked={inviteEmail && !prefs.unsubscribedAll}
            disabled={pending || !!prefs.unsubscribedAll}
            onChange={(e) => save({ campaignInviteEmail: e.target.checked })}
            style={{ marginTop: 4, width: 18, height: 18 }}
          />
          <span>
            <span style={{ fontFamily: body, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-primary)', display: 'block' }}>
              Campaign & event invitations
            </span>
            <span style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-secondary)' }}>
              When someone invites you — transactional, on by default.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer" style={{ minHeight: 44 }}>
          <input
            type="checkbox"
            checked={dailyEnabled && !prefs.unsubscribedAll}
            disabled={pending || !!prefs.unsubscribedAll}
            onChange={(e) => save({ dailyReminderEnabled: e.target.checked })}
            style={{ marginTop: 4, width: 18, height: 18 }}
          />
          <span>
            <span style={{ fontFamily: body, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-primary)', display: 'block' }}>
              Daily practice reminder
            </span>
            <span style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-secondary)' }}>
              At most one gentle email per day. Off until you opt in. No streak language.
            </span>
          </span>
        </label>

        {dailyEnabled && !prefs.unsubscribedAll ? (
          <div className="flex flex-wrap gap-3" style={{ paddingLeft: 30 }}>
            <label style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-secondary)' }}>
              Hour (local){' '}
              <select
                value={prefs.dailyReminder?.hourLocal ?? 9}
                disabled={pending}
                onChange={(e) => save({ dailyReminderHourLocal: Number(e.target.value) })}
                style={{ marginLeft: 6, padding: '6px 8px', borderRadius: 6, background: '#14130f', color: '#e8e6e0', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? '12 am' : i < 12 ? `${i} am` : i === 12 ? '12 pm' : `${i - 12} pm`}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-secondary)' }}>
              Timezone{' '}
              <input
                type="text"
                defaultValue={prefs.dailyReminder?.timezone ?? 'UTC'}
                disabled={pending}
                onBlur={(e) => {
                  const v = e.target.value.trim()
                  if (v) save({ dailyReminderTimezone: v })
                }}
                placeholder="America/Los_Angeles"
                style={{ marginLeft: 6, padding: '6px 8px', borderRadius: 6, background: '#14130f', color: '#e8e6e0', border: '1px solid rgba(255,255,255,0.12)', minWidth: 200 }}
              />
            </label>
          </div>
        ) : null}
      </section>

      {prefs.unsubscribedAll ? (
        <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)' }}>
          You unsubscribed from all non-essential email. Turn invitations back on below when ready.
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={() => save({ unsubscribedAll: true, dailyReminderEnabled: false, campaignInviteEmail: false })}
        style={{
          fontFamily: mono,
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '12px 14px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'transparent',
          color: 'var(--bars-text-muted)',
          cursor: pending ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        Unsubscribe from all non-essential email
      </button>

      <section>
        <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '0 0 10px' }}>
          Recent notifications
        </p>
        {recentLogs.length === 0 ? (
          <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)', margin: 0 }}>None yet.</p>
        ) : (
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {recentLogs.map((log) => (
              <li
                key={log.id}
                style={{
                  fontFamily: body,
                  fontSize: 13,
                  color: 'var(--bars-text-secondary)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                {formatType(log.type)} · {log.status}
                <span style={{ color: 'var(--bars-text-muted)', fontSize: 11 }}>
                  {' '}
                  · {(log.sentAt ?? log.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/" style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', textDecoration: 'none' }}>
        ← Back to Now
      </Link>
    </div>
  )
}
