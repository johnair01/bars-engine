import { NextRequest, NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { validateIrStory, type IRNode } from '@/lib/twine-authoring-ir'

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
 * @route POST /api/admin/story/validate
 * @entity CAMPAIGN
 * @description Validate IR story nodes (structural + semantic checks)
 * @permissions admin
 * @params none
 * @query none
 * @relationships VALIDATES (IR story nodes), SUPPORTS (twee compile + publish)
 * @energyCost 0 (validation only)
 * @dimensions WHO:adminId, WHAT:CAMPAIGN, WHERE:GATHERING_RESOURCES, ENERGY:none, PERSONAL_THROUGHPUT:CLEAN_UP
 * @example /api/admin/story/validate
 * @agentDiscoverable true
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin()
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status })
  }

  let body: { story_nodes?: IRNode[] }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { valid: false, errors: ['Invalid JSON body'], warnings: [] },
      { status: 400 }
    )
  }

  const nodes = body.story_nodes
  if (!Array.isArray(nodes)) {
    return NextResponse.json({
      valid: false,
      errors: ['story_nodes is required and must be an array'],
      warnings: [],
    })
  }

  const result = validateIrStory(nodes)
  return NextResponse.json({
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
  })
}
