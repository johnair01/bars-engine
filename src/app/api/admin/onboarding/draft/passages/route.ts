import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseTwee } from '@/lib/twee-parser'

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

const EXCLUDED = new Set(['StoryTitle', 'StoryData'])

/**
 * @route GET /api/admin/onboarding/draft/passages
 * @entity CAMPAIGN
 * @description List all passages in the onboarding draft Twee file
 * @permissions admin
 * @params none
 * @query none
 * @relationships CONTAINS (passage nodes), IMPLEMENTS (campaign flow)
 * @energyCost 0 (read-only)
 * @dimensions WHO:adminId, WHAT:CAMPAIGN, WHERE:GATHERING_RESOURCES, ENERGY:none
 * @example /api/admin/onboarding/draft/passages
 * @agentDiscoverable true
 */
export async function GET() {
  const authError = await requireAdmin()
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  try {
    const tweeSource = await readFile(TWEE_PATH, 'utf-8')
    const parsed = parseTwee(tweeSource)
    const passages = parsed.passages
      .filter((p) => !EXCLUDED.has(p.name))
      .map((p) => ({
        id: p.name,
        name: p.name,
        tags: p.tags,
        body: p.cleanText,
        links: p.links,
      }))
    return NextResponse.json({ passages })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load passages'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
