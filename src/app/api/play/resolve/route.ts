import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import type { BarAnalysis } from '@/lib/bar-forge/types'
import { resolveQuestForPlayer } from '@/lib/game-master-quest/resolve-quest'

type Scene = 'farm' | 'forest'
type AnalysisType = 'perception' | 'identity' | 'relational' | 'systemic'

function inferAnalysisType(text: string): AnalysisType {
  const t = text.toLowerCase()
  if (/(system|pattern|structure|process|infrastructure)/.test(t)) return 'systemic'
  if (/(we|team|together|relationship|community|ally)/.test(t)) return 'relational'
  if (/(i am|identity|who am i|self|role)/.test(t)) return 'identity'
  return 'perception'
}

function inferPolarity(text: string): string[] {
  const t = text.toLowerCase()
  const tags: string[] = []
  if (/(fear|stuck|blocked|freeze)/.test(t)) tags.push('fear')
  if (/(overwhelm|too much|chaos)/.test(t)) tags.push('overwhelm')
  if (/(action|move|ship|build)/.test(t)) tags.push('action')
  if (/(care|gentle|rest)/.test(t)) tags.push('care')
  if (tags.length === 0) tags.push('signal')
  return tags.slice(0, 3)
}

function buildAnalysis(text: string, scene: Scene): BarAnalysis {
  return {
    type: inferAnalysisType(text),
    wavePhase: scene === 'farm' ? 'Grow Up' : 'Wake Up',
    polarity: inferPolarity(text),
  }
}

async function resolveContextForPlayer(playerId: string): Promise<{ instanceId?: string; campaignRef?: string }> {
  const membership = await db.instanceMembership.findFirst({
    where: { playerId },
    orderBy: { createdAt: 'desc' },
    include: { instance: { select: { id: true, campaignRef: true } } },
  })
  if (membership?.instance?.id) {
    return {
      instanceId: membership.instance.id,
      campaignRef: membership.instance.campaignRef ?? undefined,
    }
  }

  const appConfig = await db.appConfig.findUnique({
    where: { id: 'singleton' },
    include: { activeInstance: { select: { id: true, campaignRef: true } } },
  })
  if (appConfig?.activeInstance?.id) {
    return {
      instanceId: appConfig.activeInstance.id,
      campaignRef: appConfig.activeInstance.campaignRef ?? undefined,
    }
  }

  return {}
}

export async function POST(request: NextRequest) {
  const player = await getCurrentPlayer()
  if (!player) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const body = json as {
    chargeText?: string
    scene?: Scene
    nationKey?: string
  }
  const chargeText = (body.chargeText ?? '').trim()
  const scene: Scene = body.scene === 'forest' ? 'forest' : 'farm'

  if (!chargeText) {
    return NextResponse.json({ error: 'chargeText is required' }, { status: 400 })
  }

  const ctx = await resolveContextForPlayer(player.id)
  if (!ctx.instanceId && !ctx.campaignRef) {
    return NextResponse.json(
      { error: 'No campaign context found for player (no instance membership / active instance)' },
      { status: 400 }
    )
  }

  const latestBar = await db.customBar.findFirst({
    where: { creatorId: player.id, type: 'bar' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, description: true },
  })
  const effectiveBarText = latestBar?.description?.trim() || chargeText

  const resolved = await resolveQuestForPlayer({
    instanceId: ctx.instanceId,
    campaignRef: ctx.campaignRef,
    playerId: player.id,
    nationKey: body.nationKey || undefined,
    bars: [
      {
        bar: effectiveBarText,
        analysis: buildAnalysis(effectiveBarText, scene),
      },
    ],
    charge: { text: chargeText, sourceBarId: latestBar?.id },
    options: { maxProposals: 3 },
  })

  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  }

  return NextResponse.json({
    ...resolved,
    sourceBar: latestBar ? { id: latestBar.id, description: latestBar.description } : null,
  })
}
