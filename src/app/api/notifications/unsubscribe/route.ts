import { NextRequest, NextResponse } from 'next/server'
import { applyUnsubscribeForPlayer } from '@/actions/notification-preferences'
import { verifyUnsubscribeToken } from '@/lib/notifications/unsubscribe-token'
import { absoluteUrl } from '@/lib/email/urls'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  const verified = verifyUnsubscribeToken(token)
  if (!verified) {
    return NextResponse.redirect(absoluteUrl('/settings/notifications?error=invalid_token'))
  }

  await applyUnsubscribeForPlayer(verified.playerId, verified.scope)

  const scopeLabel =
    verified.scope === 'all'
      ? 'all non-essential emails'
      : verified.scope === 'daily_reminder'
        ? 'daily reminders'
        : 'campaign invite emails'

  return NextResponse.redirect(
    absoluteUrl(`/settings/notifications?unsubscribed=${encodeURIComponent(scopeLabel)}`),
  )
}
