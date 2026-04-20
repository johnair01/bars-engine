/**
 * POST /api/bar-asset/persist — Constructor C wire
 * Accepts a BarAsset and upserts it to the game DB via CustomBar.
 */
import { NextResponse } from 'next/server'
import { db, dbBase } from '@/lib/db'
import { hasMinimumMaturityForConstructorB } from '@/lib/bar-asset/types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const asset = body.asset

    if (!asset?.id && !asset?.barDef?.id) {
      return NextResponse.json({ error: 'asset or asset.barDef.id is required' }, { status: 400 })
    }

    const resolvedId = asset.id ?? asset.barDef.id
    const maturityPhase = asset.maturity ?? asset.metadata?.state?.maturity

    if (!maturityPhase || !hasMinimumMaturityForConstructorB({ maturity: maturityPhase })) {
      const displayMaturity = maturityPhase ?? 'missing'
      return NextResponse.json(
        { error: `Asset maturity '${displayMaturity}' is below 'integrated'. Rejected by Constructor C gate.` },
        { status: 422 },
      )
    }

    // Use $queryRaw to bypass Prisma type validation on nullable fields
    // This avoids Prisma's strict null-checking on creatorId, status, type, etc.
    const barTypeMap: Record<string, string> = {
      blessed: 'blessed_object',
      rune: 'rune',
      quest: 'quest',
      allyship: 'allyship',
    }
    const barType = barTypeMap[asset.barDef.type] ?? 'blessed_object'
    const barDefJson = JSON.stringify(asset.barDef)
    const storyContent = (asset.metadata as any)?.content?.storyContent ?? null
    const twineLogicJson = (asset.metadata as any)?.content?.twineLogic
      ? JSON.stringify((asset.metadata as any).content.twineLogic)
      : null

    await dbBase.$executeRaw`
      INSERT INTO custom_bars (id, "creatorId", title, description, "status", "type", inputs, reward, "storyPath", "storyContent", "twineLogic")
      VALUES (${resolvedId}, 'system', ${asset.barDef.title}, ${asset.barDef.description}, 'seed', ${barType}, ${barDefJson}, ${asset.barDef.reward ?? 1}, ${asset.metadata?.content?.storyPath ?? null}, ${storyContent}, ${twineLogicJson})
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        inputs = EXCLUDED.inputs,
        reward = EXCLUDED.reward,
        "storyPath" = EXCLUDED."storyPath",
        "storyContent" = EXCLUDED."storyContent",
        "twineLogic" = EXCLUDED."twineLogic"
    `

    return NextResponse.json({ success: true, id: resolvedId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/bar-asset/persist]', message)
    return NextResponse.json({ error: 'Internal server error', detail: message }, { status: 500 })
  }
}
