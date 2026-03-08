import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseTwee } from '@/lib/twee-parser'
import { translateTweeToFlow } from '@/lib/twee-to-flow'

const TWEE_PATH = path.join(
  process.cwd(),
  'content/twine/onboarding/bruised-banana-onboarding-draft.twee'
)

async function requireAdmin() {
  const player = await getCurrentPlayer()
  if (!player) {
    return { error: 'Not authenticated', status: 401 as const }
  }
  const adminRole = await db.playerRole.findFirst({
    where: { playerId: player.id, role: { key: 'admin' } },
  })
  if (!adminRole) {
    return { error: 'Admin access required', status: 403 as const }
  }
  return null
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  try {
    const tweeSource = await readFile(TWEE_PATH, 'utf-8')
    return NextResponse.json({ tweeSource })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load draft'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  let body: { tweeSource?: string }
  try {
    body = (await request.json()) as { tweeSource?: string }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const tweeSource = body.tweeSource
  if (typeof tweeSource !== 'string' || tweeSource.trim().length === 0) {
    return NextResponse.json({ error: 'tweeSource is required and must be a non-empty string' }, { status: 400 })
  }

  try {
    parseTwee(tweeSource)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid Twee syntax'
    return NextResponse.json({ error: `Parse failed: ${message}` }, { status: 400 })
  }

  try {
    translateTweeToFlow(tweeSource, {
      flowId: 'bruised-banana-onboarding-v1',
      campaignId: 'bruised_banana_residency',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid flow structure'
    return NextResponse.json({ error: `Flow validation failed: ${message}` }, { status: 400 })
  }

  try {
    await writeFile(TWEE_PATH, tweeSource, 'utf-8')
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to write draft'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
