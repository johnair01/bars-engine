import { NextRequest, NextResponse } from 'next/server'
import { _detectAndMarkAbandonedSessionsCore } from '@/actions/orientation-checkpoint'

// TODO: Before deploying to production:
//   1. Add CRON_SECRET to Vercel env vars (Settings → Environment Variables).
//      Generate with: openssl rand -hex 32
//   2. Create vercel.json in the repo root and add the cron schedule:
//      { "crons": [{ "path": "/api/cron/abandon-sessions", "schedule": "0 * * * *" }] }
//   See docs/ENV_AND_VERCEL.md § Cron Jobs for details.

/**
 * Cron endpoint: mark orientation sessions that have exceeded the abandonment
 * threshold as 'abandoned'.
 *
 * Called by Vercel Cron (or any scheduler) via:
 *   GET /api/cron/abandon-sessions
 *   Authorization: Bearer <CRON_SECRET>
 *
 * Required env var: CRON_SECRET
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

  const { markedCount } = await _detectAndMarkAbandonedSessionsCore()
  return NextResponse.json({ markedCount })
}
