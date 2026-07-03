'use client'

import { useState, useTransition } from 'react'
import { updateNotificationPreferences } from '@/actions/notification-preferences'

type DailyReminderOptInBannerProps = {
  show: boolean
}

export function DailyReminderOptInBanner({ show }: DailyReminderOptInBannerProps) {
  const [visible, setVisible] = useState(show)
  const [pending, startTransition] = useTransition()

  if (!visible) return null

  function dismiss() {
    startTransition(async () => {
      await updateNotificationPreferences({ dismissDailyReminderPrompt: true })
      setVisible(false)
    })
  }

  function optIn() {
    startTransition(async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      await updateNotificationPreferences({
        dailyReminderEnabled: true,
        dailyReminderTimezone: tz,
        dailyReminderHourLocal: 9,
      })
      setVisible(false)
    })
  }

  return (
    <div
      style={{
        marginBottom: 16,
        padding: '14px 16px',
        borderRadius: 10,
        background: 'color-mix(in srgb, #7c3aed 12%, #14130f)',
        boxShadow: 'inset 0 0 0 1px color-mix(in srgb, #7c3aed 35%, transparent)',
      }}
    >
      <p
        style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: 8.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#a855f7',
          margin: '0 0 6px',
        }}
      >
        Optional ritual
      </p>
      <p style={{ fontFamily: 'Jost, sans-serif', fontSize: 13, lineHeight: 1.5, color: '#e8e6e0', margin: '0 0 12px' }}>
        Want a gentle daily email to open Tap the Vein? One nudge max — no streaks, easy to turn off.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={optIn}
          style={{
            fontFamily: 'Jost, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            cursor: pending ? 'wait' : 'pointer',
            background: '#7c3aed',
            color: '#fff',
            minHeight: 44,
          }}
        >
          Yes, remind me
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={dismiss}
          style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '10px 14px',
            borderRadius: 8,
            border: 'none',
            cursor: pending ? 'wait' : 'pointer',
            background: 'transparent',
            color: '#8a877f',
            minHeight: 44,
          }}
        >
          Not now
        </button>
      </div>
    </div>
  )
}
