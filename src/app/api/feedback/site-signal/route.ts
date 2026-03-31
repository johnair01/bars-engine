import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import {
  formatSiteSignalFeedbackBlock,
  siteSignalInputSchema,
} from '@/lib/feedback/site-signal-schema'
import { persistPlayerFeedbackToBacklog } from '@/lib/feedback/persist-player-feedback-to-backlog'

const PASSAGE_NAME = 'Site signal (nav)'
const QUEST_ID = 'system-feedback'

/**
 * POST /api/feedback/site-signal
 * Global nav “report issue” — same JSONL pipeline as Share Your Signal (system-feedback).
 */
export async function POST(request: NextRequest) {
  const player = await getCurrentPlayer()
  if (!player) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = siteSignalInputSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join('; ') || 'Invalid input'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const data = parsed.data

  let submitted: URL
  try {
    submitted = new URL(data.pageUrl)
  } catch {
    return NextResponse.json({ error: 'pageUrl is not a valid URL' }, { status: 400 })
  }

  const expectedOrigin = request.nextUrl.origin
  if (submitted.origin !== expectedOrigin) {
    return NextResponse.json(
      { error: 'Page URL must be same origin as this site.' },
      { status: 403 }
    )
  }

  const isAdmin =
    player.roles?.some((r: { role: { key: string } }) => r.role?.key === 'admin') ?? false

  const feedback = formatSiteSignalFeedbackBlock({ ...data, isAdmin })

  const persisted = await persistPlayerFeedbackToBacklog({
    source: 'site_signal_nav',
    playerId: player.id,
    playerName: player.name,
    questId: QUEST_ID,
    passageName: PASSAGE_NAME,
    feedback,
    context: {
      pageUrl: data.pageUrl,
      pathname: data.pathname,
      search: data.search,
      documentTitle: data.documentTitle,
      isAdmin,
      ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
    },
  })

  if ('error' in persisted) {
    console.error('Failed to persist site signal:', persisted.error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true, backlogItemId: persisted.backlogItemId })
}
