import type { BarAnalysis } from '@/lib/bar-forge/types'
import type { GameMasterFaceKey } from '@/lib/bar-forge/types'
import {
  buildCleanUpArtifact,
  buildStubArtifact,
  buildWakeArtifact,
} from '@/lib/game-master-quest/artifacts'
import { GM_AXIS } from '@/lib/game-master-quest/axis'
import { aggregateBarForgePatterns } from '@/lib/game-master-quest/patterns'
import type { GmArtifact } from '@/lib/game-master-quest/types'
import { gameMasterMoveRequestSchema } from '@/lib/game-master-quest/schemas'
import { gmWaveMoveToBarWavePhase } from '@/lib/game-master-quest/wave-move'
import type { z } from 'zod'

type MoveRequest = z.infer<typeof gameMasterMoveRequestSchema>

export async function runGameMasterMove(body: MoveRequest): Promise<{
  bar: string
  move: string
  artifacts: Partial<Record<GameMasterFaceKey, GmArtifact>>
  meta: {
    axis: typeof GM_AXIS
    patterns?: Awaited<ReturnType<typeof aggregateBarForgePatterns>>
  }
}> {
  const wavePhase = gmWaveMoveToBarWavePhase(body.move)
  const analysis: BarAnalysis = { ...body.analysis, wavePhase }

  const ctx = body.context
  const contextHint =
    ctx?.campaignRef || ctx?.nationKey || ctx?.archetypeKey
      ? {
          campaignRef: ctx.campaignRef,
          nationKey: ctx.nationKey,
          archetypeKey: ctx.archetypeKey,
        }
      : undefined

  const artifacts: Partial<Record<GameMasterFaceKey, GmArtifact>> = {}

  for (const face of body.gameMasters) {
    if (body.move === 'grow_up' || body.move === 'show_up') {
      artifacts[face] = buildStubArtifact(face, body.move)
      continue
    }
    if (body.move === 'wake_up') {
      artifacts[face] = buildWakeArtifact(body.bar, analysis, face, contextHint)
    } else {
      artifacts[face] = buildCleanUpArtifact(body.bar, analysis, face, contextHint)
    }
  }

  const meta: {
    axis: typeof GM_AXIS
    patterns?: Awaited<ReturnType<typeof aggregateBarForgePatterns>>
  } = { axis: GM_AXIS }

  if (body.move === 'wake_up') {
    meta.patterns = await aggregateBarForgePatterns()
  }

  return {
    bar: body.bar,
    move: body.move,
    artifacts,
    meta,
  }
}
