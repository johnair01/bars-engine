/**
 * @route GET /api/cron/character-sheet-reminder
 * @entity SYSTEM
 * @description Quarterly reminder, with a blank character sheet attached, to everyone who asked for it
 * @permissions cron (Authorization: Bearer <CRON_SECRET>)
 * @example GET /api/cron/character-sheet-reminder?dryRun=1
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { runCharacterSheetReminder } from '@/lib/esp/sheet-reminder'

// Scheduled in vercel.json for the 10th, 11th and 12th of February, May, August
// and November. The second and third days finish anything the first left over.
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when that variable is
 * set in the project. Without it this route refuses every caller, so nothing
 * sends until the secret exists.
 *
 * `?dryRun=1` reports how many readers would be written to, and anything that
 * blocks the send, without calling Resend.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.get('dryRun') === '1'
  const report = await runCharacterSheetReminder({ dryRun, budgetMs: 240_000 })
  console.info('[sheet-reminder]', JSON.stringify(report))
  return NextResponse.json(report, { status: report.status === 'blocked' ? 503 : 200 })
}
