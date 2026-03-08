import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseTwee } from '@/lib/twee-parser'
import { irToTwee, validateIrStory, type IRNode } from '@/lib/twine-authoring-ir'

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

export async function POST(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  let body: { story_nodes?: IRNode[]; story_metadata?: { title?: string; start_node?: string } }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { errors: ['Invalid JSON body'], warnings: [], twee_file: undefined },
      { status: 400 }
    )
  }

  const nodes = body.story_nodes
  if (!Array.isArray(nodes)) {
    return NextResponse.json(
      { errors: ['story_nodes is required and must be an array'], warnings: [], twee_file: undefined },
      { status: 400 }
    )
  }

  const validation = validateIrStory(nodes)
  if (!validation.valid) {
    return NextResponse.json({
      errors: validation.errors,
      warnings: validation.warnings,
      twee_file: undefined,
    })
  }

  const meta = body.story_metadata
  const title = meta?.title ?? 'IR Story'
  const startNode = meta?.start_node ?? nodes[0]?.node_id ?? 'Start'

  let tweeFile: string
  try {
    tweeFile = irToTwee(nodes, { title, startNode })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Compile failed'
    return NextResponse.json({
      errors: [msg],
      warnings: validation.warnings,
      twee_file: undefined,
    })
  }

  try {
    parseTwee(tweeFile)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Round-trip validation failed'
    return NextResponse.json({
      errors: [`Compiled output failed parse: ${msg}`],
      warnings: validation.warnings,
      twee_file: undefined,
    })
  }

  return NextResponse.json({
    twee_file: tweeFile,
    warnings: validation.warnings,
    errors: [],
  })
}
