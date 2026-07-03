import { NextRequest, NextResponse } from 'next/server'
import { runDailyReminderCron } from '@/lib/notifications/daily-reminder-cron'

/**
 * @route GET /api/cron/daily-reminder
 * HNTF — opt-in daily Tap the Vein reminder emails.
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runDailyReminderCron()
  return NextResponse.json(result)
}
