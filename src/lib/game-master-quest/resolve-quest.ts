import { db } from '@/lib/db'
import type { BarAnalysis, GameMasterFaceKey } from '@/lib/bar-forge/types'
import {
  loadMatchableQuestsForMatching,
  matchBarToQuestsSync,
  toQuestDto,
} from '@/lib/bar-forge/match-bar-to-quests'
import { buildQuestCompletionPrize } from '@/lib/game-master-quest/artifacts'
import { ALL_GM_FACES, GM_AXIS } from '@/lib/game-master-quest/axis'
import { barForgeRowToBarAnalysis } from '@/lib/game-master-quest/bar-sources'
import { resolveInstance } from '@/lib/game-master-quest/instance'
import type { QuestProposal } from '@/lib/game-master-quest/types'
import type { resolveQuestRequestSchema } from '@/lib/game-master-quest/schemas'
import type { z } from 'zod'

type ResolveBody = z.infer<typeof resolveQuestRequestSchema>

function slugKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function pickPresentingFace(
  index: number,
  prefer?: GameMasterFaceKey[]
): GameMasterFaceKey {
  const pool = prefer?.length ? prefer : ALL_GM_FACES
  return pool[index % pool.length]!
}

export async function resolveQuestForPlayer(body: ResolveBody): Promise<
  | {
      ok: true
      collective: {
        kotterStage: number
        allyshipDomain: string | null
        campaignRef: string | null
      }
      player: { nationKey: string | null; archetypeKey: string | null }
      proposals: QuestProposal[]
      meta: { axis: typeof GM_AXIS }
    }
  | { ok: false; status: 400 | 404; error: string }
> {
  const instResult = await resolveInstance({
    instanceId: body.instanceId,
    campaignRef: body.campaignRef,
  })

  if (!instResult.ok) {
    if (instResult.reason === 'ambiguous') {
      return {
        ok: false,
        status: 400,
        error: `Multiple instances share campaignRef "${body.campaignRef}". Pass instanceId.`,
      }
    }
    return { ok: false, status: 404, error: 'Instance not found' }
  }

  const instance = instResult.instance

  const player = await db.player.findUnique({
    where: { id: body.playerId },
    include: { nation: true, archetype: true },
  })

  if (!player) {
    return { ok: false, status: 404, error: 'Player not found' }
  }

  const merged: { bar: string; analysis: BarAnalysis }[] = []

  if (body.barRegistryIds?.length) {
    const records = await db.barForgeRecord.findMany({
      where: { id: { in: body.barRegistryIds } },
    })
    const byId = new Map(records.map((r) => [r.id, r]))
    for (const id of body.barRegistryIds) {
      const row = byId.get(id)
      if (row) merged.push(barForgeRowToBarAnalysis(row))
    }
  }

  if (body.bars?.length) {
    for (const b of body.bars) {
      merged.push({ bar: b.bar, analysis: b.analysis })
    }
  }

  if (merged.length === 0) {
    return { ok: false, status: 400, error: 'No BAR rows resolved (check barRegistryIds and bars)' }
  }

  const primary = merged[0]!
  const maxProp = Math.min(20, Math.max(1, body.options?.maxProposals ?? 3))
  const prefer = body.options?.preferFaces

  const rows = await loadMatchableQuestsForMatching()
  const quests = rows.map(toQuestDto)
  const { ranked } = matchBarToQuestsSync(quests, primary.analysis, maxProp)

  const chargeLine =
    body.charge?.text?.trim() ||
    primary.bar.slice(0, 200) ||
    'Earned by completing the quest.'

  const nationKey = player.nation ? slugKey(player.nation.name) : null
  const archetypeKey = player.archetype ? slugKey(player.archetype.name) : null

  const proposals: QuestProposal[] = ranked.map((r, i) => {
    const presentingFace = pickPresentingFace(i, prefer)
    const prize = buildQuestCompletionPrize(r.quest, presentingFace, chargeLine)
    const rationale = [`score:${r.score}`, ...r.reasons.slice(0, 4)]
    if (body.nationKey && r.quest.nation) {
      rationale.push(`quest_nation:${r.quest.nation}`)
    }
    return {
      questId: r.quest.id,
      presentingFace,
      artifactPrize: prize,
      rationale,
      sceneHint: `Instance Kotter ${instance.kotterStage}; collective domain ${instance.allyshipDomain ?? 'unset'}`,
    }
  })

  return {
    ok: true,
    collective: {
      kotterStage: instance.kotterStage,
      allyshipDomain: instance.allyshipDomain,
      campaignRef: instance.campaignRef,
    },
    player: {
      nationKey: body.nationKey ?? nationKey,
      archetypeKey: body.archetypeKey ?? archetypeKey,
    },
    proposals,
    meta: { axis: GM_AXIS },
  }
}
