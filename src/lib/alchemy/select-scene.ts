import { db } from '@/lib/db'
import type { EmotionChannel, AlchemyAltitude, AlchemySceneTemplateRow } from '@/lib/alchemy/types'

export interface SelectSceneOpts {
  archetypeSlug?: string
  nationSlug?: string
  campaignPhase?: string
  sceneType?: string // 'transcend' | 'generate' | 'control'
  channel?: string   // override: use targetChannel for generate/control
  altitudeFrom?: string // override: caller computes via wuxing
  /** Active daemon's wuxing channel — low-weight (3) scoring signal. IE-5 */
  daemonChannel?: string
  /** Active daemon's altitude — informational, not scored directly. IE-5 */
  daemonAltitude?: string
}

type SceneResult = AlchemySceneTemplateRow | null

const selectFields = {
  id: true,
  title: true,
  situation: true,
  friction: true,
  invitation: true,
  choices: true,
  advice: true,
  archetypeBias: true,
  nationBias: true,
} as const

function scoreCandidate(
  row: { archetypeBias: string | null; nationBias: string | null },
  opts: SelectSceneOpts
): number {
  let score = 0
  if (opts.archetypeSlug && row.archetypeBias) {
    try {
      const slugs: string[] = JSON.parse(row.archetypeBias)
      if (slugs.includes(opts.archetypeSlug)) score += 10
    } catch { /* malformed JSON */ }
  }
  if (opts.nationSlug && row.nationBias) {
    try {
      const slugs: string[] = JSON.parse(row.nationBias)
      if (slugs.includes(opts.nationSlug)) score += 5
    } catch { /* malformed JSON */ }
  }
  // Daemon channel: low-weight signal from active summoned daemon (IE-5)
  if (opts.daemonChannel && row.archetypeBias) {
    try {
      const slugs: string[] = JSON.parse(row.archetypeBias)
      if (slugs.includes(opts.daemonChannel.toLowerCase())) score += 3
    } catch { /* malformed JSON */ }
  }
  return score
}

function pickBest(
  candidates: Array<{
    id: string; title: string; situation: string; friction: string
    invitation: string; choices: string; advice: string | null
    archetypeBias: string | null; nationBias: string | null
  }>,
  opts: SelectSceneOpts
): SceneResult {
  if (candidates.length === 0) return null
  let best = candidates[0]
  let bestScore = scoreCandidate(best, opts)
  for (let i = 1; i < candidates.length; i++) {
    const s = scoreCandidate(candidates[i], opts)
    if (s > bestScore) { best = candidates[i]; bestScore = s }
  }
  return { id: best.id, title: best.title, situation: best.situation, friction: best.friction, invitation: best.invitation, choices: best.choices, advice: best.advice }
}

/**
 * Selects the most relevant AlchemySceneTemplate for a player.
 *
 * Caller should pass channel/altitudeFrom/sceneType from wuxing resolution.
 * If not provided, falls back to reading player's current alchemy state.
 *
 * Priority: sceneType+channel+altitude exact match → channel+sceneType → null.
 */
export async function selectScene(
  playerId: string,
  opts: SelectSceneOpts = {}
): Promise<SceneResult> {
  let channel: string
  let altitude: string

  if (opts.channel && opts.altitudeFrom) {
    channel = opts.channel
    altitude = opts.altitudeFrom
  } else {
    const state = await db.alchemyPlayerState.findUnique({
      where: { playerId },
      select: { channel: true, altitude: true },
    })
    if (!state) return null
    channel = state.channel as EmotionChannel
    altitude = state.altitude as AlchemyAltitude
  }

  const sceneType = opts.sceneType ?? 'transcend'

  const exactCandidates = await db.alchemySceneTemplate.findMany({
    where: { channel, altitudeFrom: altitude, sceneType, status: 'active' },
    select: selectFields,
  })
  if (exactCandidates.length > 0) return pickBest(exactCandidates, opts)

  // Fallback: any active template for this channel+sceneType
  const channelCandidates = await db.alchemySceneTemplate.findMany({
    where: { channel, sceneType, status: 'active' },
    select: selectFields,
  })
  if (channelCandidates.length > 0) return pickBest(channelCandidates, opts)

  // Last resort: any transcend template for this channel (pre-schema templates)
  const legacyCandidates = await db.alchemySceneTemplate.findMany({
    where: { channel },
    select: selectFields,
  })
  return pickBest(legacyCandidates, opts)
}
