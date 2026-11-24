/**
 * @route POST /api/world-kit/publish
 * @entity SYSTEM
 * @description The gate for a locally authored world kit: findings (dry run) or publish into the author's dojo
 * @permissions Bearer token mapped to an author (WORLD_KIT_TOKENS); no cookie session
 * @params files:object (body) - world.yaml, world.md, conditions.yaml, obstacles.yaml, npcs.yaml as text
 * @params portraits:array (body) - [{name, base64}] PNG images
 * @params dryRun:boolean (query ?dryRun=1) - return findings and store nothing but a diagnostics row
 * @relationships WorldKit, WorldKitAttempt
 * @agentDiscoverable false
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { runGate } from '@/lib/world-kit/gate'
import { configured, playerForToken } from '@/lib/world-kit/auth'

export const dynamic = 'force-dynamic'
const MAX_BODY = 6 * 1024 * 1024

/**
 * Exact visible state (rulings 2026-11-23/24):
 * - accepted / accepted_with_warnings: one WorldKit row for (author, kit id), updated in place on republish, visible to
 *   its author only (`visibility: "author"`). Response 200 `{outcome: "created"|"updated", ...}`.
 * - rejected: no WorldKit row is created or changed. A WorldKitAttempt row keeps the findings. Response 422.
 * - dryRun: the same findings, no WorldKit row, and `outcome: "checked"`.
 */
export async function POST(request: NextRequest) {
  if (!configured()) return NextResponse.json({ error: 'WORLD_KIT_TOKENS is not set on this engine' }, { status: 503 })
  const playerId = playerForToken(request.headers.get('authorization'))
  if (!playerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const player = await db.player.findUnique({ where: { id: playerId }, select: { id: true } })
  if (!player) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const text = await request.text()
  if (text.length > MAX_BODY) return NextResponse.json({ error: 'Kit is over 6 MB' }, { status: 413 })
  let body: { files?: Record<string, unknown>; portraits?: unknown }
  try {
    body = JSON.parse(text)
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('not an object')
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1'
  const result = runGate(body)
  const kitId = result.identity?.kitId ?? null

  if (result.verdict === 'rejected' || dryRun) {
    const outcome = dryRun ? 'checked' : 'rejected'
    await db.worldKitAttempt.create({ data: { playerId, kitId, verdict: result.verdict, outcome, findings: result.findings } })
    return NextResponse.json({ ok: result.verdict !== 'rejected', outcome, verdict: result.verdict, findings: result.findings, kit: null }, { status: result.verdict === 'rejected' ? 422 : 200 })
  }

  const { identity } = result
  if (!identity) return NextResponse.json({ error: 'gate returned no identity' }, { status: 500 })
  const data = {
    name: identity.name,
    version: identity.version,
    files: body.files as object,
    portraits: body.portraits as object,
    findings: result.findings,
  }
  const existing = await db.worldKit.findUnique({ where: { playerId_kitId: { playerId, kitId: identity.kitId } }, select: { id: true } })
  const kit = await db.worldKit.upsert({
    where: { playerId_kitId: { playerId, kitId: identity.kitId } },
    create: { playerId, kitId: identity.kitId, ...data },
    update: data,
    select: { id: true, kitId: true, name: true, version: true, visibility: true },
  })
  const outcome = existing ? 'updated' : 'created'
  await db.worldKitAttempt.create({ data: { playerId, kitId: identity.kitId, verdict: result.verdict, outcome, findings: result.findings } })
  return NextResponse.json({ ok: true, outcome, verdict: result.verdict, findings: result.findings, kit })
}
