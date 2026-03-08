import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseTwee } from '@/lib/twee-parser'
import {
  irToTwee,
  validateIrStory,
  type IRNode,
  type IRStory,
} from '@/lib/twine-authoring-ir'

async function requireAdmin(): Promise<
  | { error: string; status: 401 | 403 }
  | { playerId: string }
> {
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
  return { playerId: player.id }
}

function parseIrDraft(irDraft: string): { nodes: IRNode[]; title?: string; startNode?: string } {
  const raw = JSON.parse(irDraft) as IRStory | IRNode[]
  if (Array.isArray(raw)) {
    return { nodes: raw }
  }
  const story = raw as IRStory
  const nodes = story.story_nodes ?? []
  const meta = story.story_metadata
  return {
    nodes,
    title: meta?.title,
    startNode: meta?.start_node,
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin()
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }
  const { playerId: adminId } = authResult

  let body: { storyId: string; irDraft?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { storyId, irDraft: irDraftBody } = body
  if (!storyId || typeof storyId !== 'string') {
    return NextResponse.json({ error: 'storyId is required' }, { status: 400 })
  }

  const story = await db.twineStory.findUnique({ where: { id: storyId } })
  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 })
  }

  const irDraft = irDraftBody ?? story.irDraft
  if (!irDraft || irDraft.trim() === '') {
    return NextResponse.json(
      { error: 'No irDraft provided and story has no saved irDraft' },
      { status: 400 }
    )
  }

  let nodes: IRNode[]
  let title: string | undefined
  let startNode: string | undefined
  try {
    const parsed = parseIrDraft(irDraft)
    nodes = parsed.nodes
    title = parsed.title
    startNode = parsed.startNode
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid irDraft JSON'
    return NextResponse.json({ error: `Invalid irDraft: ${msg}` }, { status: 400 })
  }

  const validation = validateIrStory(nodes)
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', errors: validation.errors },
      { status: 400 }
    )
  }

  let tweeSource: string
  try {
    tweeSource = irToTwee(nodes, {
      title: title ?? story.title,
      startNode: startNode ?? nodes[0]?.node_id ?? 'Start',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Compile failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  let parsed
  try {
    parsed = parseTwee(tweeSource)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Parse failed'
    return NextResponse.json({ error: `Round-trip parse failed: ${msg}` }, { status: 500 })
  }

  await db.$transaction([
    db.twineStory.update({
      where: { id: storyId },
      data: {
        sourceText: tweeSource,
        parsedJson: JSON.stringify(parsed),
        sourceType: 'twee',
        ...(irDraftBody ? { irDraft: irDraftBody } : {}),
      },
    }),
    db.compiledTweeVersion.create({
      data: {
        storyId,
        tweeContent: tweeSource,
        createdById: adminId,
      },
    }),
  ])

  return NextResponse.json({
    success: true,
    storyId,
    passageCount: parsed.passages.length,
  })
}
