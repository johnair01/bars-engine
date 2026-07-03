import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getNotificationPreferencesView } from '@/actions/notification-preferences'
import { NotificationSettingsClient } from '@/components/notifications/NotificationSettingsClient'

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ unsubscribed?: string; error?: string }>
}

export default async function NotificationSettingsPage({ searchParams }: PageProps) {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const res = await getNotificationPreferencesView()
  if ('error' in res) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)', padding: 24 }}>
        <p>{res.error}</p>
      </div>
    )
  }

  const params = await searchParams
  const unsubscribedMessage = params.unsubscribed
    ? `Unsubscribed from ${params.unsubscribed}.`
    : null
  const errorMessage =
    params.error === 'invalid_token' ? 'That unsubscribe link expired or was invalid.' : null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)' }}>
      <div
        className="w-full"
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
        }}
      >
        <header style={{ marginBottom: 20 }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--bars-font-mono)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              textDecoration: 'none',
            }}
          >
            ← Now
          </Link>
          <h1
            style={{
              fontFamily: 'var(--bars-font-display)',
              fontWeight: 800,
              fontSize: 26,
              color: 'var(--bars-text-primary)',
              margin: '10px 0 6px',
            }}
          >
            Notifications
          </h1>
          <p style={{ fontFamily: 'var(--bars-font-body)', fontSize: 13, color: 'var(--bars-text-secondary)', margin: 0 }}>
            Email when you are away. In-app when you are here. No shame spirals.
          </p>
        </header>

        <NotificationSettingsClient
          initialPrefs={res.prefs}
          recentLogs={res.recentLogs}
          email={res.email}
          unsubscribedMessage={unsubscribedMessage}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  )
}
