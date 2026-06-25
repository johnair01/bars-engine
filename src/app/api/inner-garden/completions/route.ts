import { NextResponse } from 'next/server'
import { getCurrentPlayer } from '@/lib/auth'
import { dbBase } from '@/lib/db'
import {
  INNER_GARDEN_CHAPTER_1_SOURCE,
  INNER_GARDEN_TO_BARS_SCHEMA_VERSION,
  buildShamanResultSeedMetabolization,
  getInnerGardenEligibilityReason,
  normalizeSeedQuality,
  type InnerGardenCompletionPayload,
} from '@/lib/inner-garden/bridge'

const BAR_SELECT = {
  id: true,
  title: true,
  description: true,
  type: true,
  creatorId: true,
  status: true,
  archivedAt: true,
  seedMetabolization: true,
  nation: true,
  intensity: true,
  campaignRef: true,
  gameMasterFace: true,
  hexagramId: true,
  isSystem: true,
  inviteId: true,
  mergedIntoId: true,
} as const

export async function POST(request: Request) {
  const player = await getCurrentPlayer()
  if (!player) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const payload = (await request.json().catch(() => null)) as InnerGardenCompletionPayload | null
  if (!payload || payload.schemaVersion !== INNER_GARDEN_TO_BARS_SCHEMA_VERSION) {
    return NextResponse.json({ error: 'Unsupported Inner Garden completion payload' }, { status: 400 })
  }

  const sourceBarId = String(payload.sourceBarId ?? '').trim()
  const harvestedInsight = String(payload.harvestedInsight ?? payload.resultText ?? '').trim().slice(0, 2000)
  const emotionId = String(payload.emotionId ?? '').trim().slice(0, 60)
  const cultivationAction = String(payload.cultivationAction ?? '').trim().slice(0, 120)

  if (!sourceBarId || !emotionId || !cultivationAction || harvestedInsight.length < 3) {
    return NextResponse.json({ error: 'Completion payload is missing required fields' }, { status: 400 })
  }

  const source = await dbBase.customBar.findUnique({
    where: { id: sourceBarId },
    select: BAR_SELECT,
  })
  if (!source) return NextResponse.json({ error: 'Source BAR not found' }, { status: 404 })

  const reason = getInnerGardenEligibilityReason(source, player.id)
  if (reason) {
    return NextResponse.json({ error: `Source BAR is not eligible (${reason})` }, { status: 400 })
  }

  const existing = await dbBase.customBar.findFirst({
    where: {
      creatorId: player.id,
      sourceBarId: source.id,
      questSource: INNER_GARDEN_CHAPTER_1_SOURCE,
    },
    select: { id: true },
  })
  if (existing) return NextResponse.json({ resultBarId: existing.id, duplicate: true })

  const seedQuality = normalizeSeedQuality(String(payload.seedQuality ?? 55))
  const result = await dbBase.customBar.create({
    data: {
      creatorId: player.id,
      title: `Inner Garden harvest: ${source.title}`.slice(0, 80),
      description: harvestedInsight,
      type: 'bar',
      reward: 0,
      visibility: 'private',
      status: 'active',
      inputs: '[]',
      rootId: 'temp',
      sourceBarId: source.id,
      gameMasterFace: 'shaman',
      questSource: INNER_GARDEN_CHAPTER_1_SOURCE,
      campaignRef: payload.campaignRef ?? source.campaignRef,
      nation: source.nation,
      intensity: source.intensity,
      seedMetabolization: buildShamanResultSeedMetabolization(source.seedMetabolization, harvestedInsight),
      agentMetadata: JSON.stringify({
        ...payload,
        schemaVersion: INNER_GARDEN_TO_BARS_SCHEMA_VERSION,
        source: INNER_GARDEN_CHAPTER_1_SOURCE,
        sourceBarId: source.id,
        sourceBarType: source.type,
        guideFace: 'shaman',
        seedQuality,
        completedAt: payload.completedAt ?? new Date().toISOString(),
      }),
    },
    select: { id: true },
  })

  await dbBase.customBar.update({
    where: { id: result.id },
    data: { rootId: result.id },
  })

  return NextResponse.json({ resultBarId: result.id })
}
