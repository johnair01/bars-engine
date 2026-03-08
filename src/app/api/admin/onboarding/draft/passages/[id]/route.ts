import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseTwee } from '@/lib/twee-parser'
import { translateTweeToFlow } from '@/lib/twee-to-flow'
import {
  serializePassageToBlock,
  replacePassageInTwee,
  type PassageLink,
} from '@/lib/twee-serializer'

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

/**
 * Update all link targets in twee source: replace oldName with newName.
 * Handles [[label|target]] and [[target]] (no pipe) formats.
 */
function updateLinkTargetsInTwee(tweeSource: string, oldName: string, newName: string): string {
  const escaped = escapeRegex(oldName)
  const withPipe = new RegExp(`(\\[\\[)([^\\]|]+)(\\|)(${escaped})(\\]\\])`, 'g')
  const withoutPipe = new RegExp(`(\\[\\[)(${escaped})(\\]\\])`, 'g')
  return tweeSource
    .replace(withPipe, `$1$2$3${newName}$5`)
    .replace(withoutPipe, `$1${newName}$3`)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin()
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  const { id: passageId } = await params
  if (!passageId) {
    return NextResponse.json({ error: 'Passage id required' }, { status: 400 })
  }

  let body: { name?: string; body?: string; links?: PassageLink[] }
  try {
    body = (await request.json()) as { name?: string; body?: string; links?: PassageLink[] }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    let tweeSource = await readFile(TWEE_PATH, 'utf-8')
    const parsed = parseTwee(tweeSource)
    const passage = parsed.passages.find((p) => p.name === passageId)
    if (!passage) {
      return NextResponse.json({ error: `Passage not found: ${passageId}` }, { status: 404 })
    }

    const name = body.name ?? passage.name
    const bodyText = body.body ?? passage.cleanText
    const links: PassageLink[] = body.links ?? passage.links

    if (name !== passageId) {
      tweeSource = updateLinkTargetsInTwee(tweeSource, passageId, name)
    }

    const newBlock = serializePassageToBlock(name, passage.tags, bodyText, links)
    tweeSource = replacePassageInTwee(tweeSource, passageId, newBlock)

    parseTwee(tweeSource)
    translateTweeToFlow(tweeSource, {
      flowId: 'bruised-banana-onboarding-v1',
      campaignId: 'bruised_banana_residency',
    })

    await writeFile(TWEE_PATH, tweeSource, 'utf-8')
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update passage'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
