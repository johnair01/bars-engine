/**
 * I Ching Alignment — Aligned hexagram draw for campaign deck
 *
 * Produces hexagrams aligned with player's next available step:
 * game clock (kotterStage), nation, archetype, developmental lens (Game Master sect).
 * See .specify/specs/iching-alignment-game-master-sects/spec.md
 */

import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'
import { getHexagramStructure } from '@/lib/iching-struct'
import { KOTTER_STAGES } from '@/lib/kotter'
import { NATION_AFFINITIES } from '@/lib/elemental-moves'
import type { KotterStage } from '@/lib/kotter'

export type IChingAlignmentContext = {
  kotterStage: number | null
  nationName: string | null
  playbookTrigram: string | null
  activeFace: string | null
  /** Bar IDs from PlayerBar where source='iching' — hexagrams the player has accepted */
  playedHexagramIds: number[]
}

/** Playbook name → trigram (from seed-utils fileMap / player_archetypes) */
const PLAYBOOK_TRIGRAM: Record<string, string> = {
  'The Bold Heart': 'Heaven',
  'The Devoted Guardian': 'Earth',
  'The Decisive Storm': 'Thunder',
  'The Danger Walker': 'Water',
  'The Still Point': 'Mountain',
  'The Subtle Influence': 'Wind',
  'The Truth Seer': 'Fire',
  'The Joyful Connector': 'Lake',
}

/** Face key → preferred trigram (Game Master sect) */
export const FACE_TRIGRAM_PREFERENCE: Record<string, string> = {
  shaman: 'Earth',
  challenger: 'Fire',
  regent: 'Lake',
  architect: 'Heaven',
  diplomat: 'Wind',
  sage: 'Mountain',
}

export type AlignmentBreakdown = {
  kotter: number
  nation: number
  archetype: number
  sect: number
}

/**
 * Fetch alignment context for a player: kotterStage, nationName, playbookTrigram, activeFace.
 */
export async function getAlignmentContext(playerId: string): Promise<IChingAlignmentContext> {
  const [player, instance, playedBars] = await Promise.all([
    db.player.findUnique({
      where: { id: playerId },
      include: { nation: true, archetype: true },
    }),
    getActiveInstance(),
    db.playerBar.findMany({
      where: { playerId, source: 'iching' },
      select: { barId: true },
    }),
  ])

  const playedHexagramIds = playedBars.map((pb) => pb.barId)

  if (!player) {
    return { kotterStage: null, nationName: null, playbookTrigram: null, activeFace: null, playedHexagramIds }
  }

  const nationName = player.nation?.name ?? null
  const playbookTrigram = player.archetype?.name
    ? PLAYBOOK_TRIGRAM[player.archetype.name] ?? null
    : null

  let activeFace: string | null = null
  if (player.storyProgress) {
    try {
      const parsed = JSON.parse(player.storyProgress) as { state?: Record<string, unknown> }
      const state = parsed?.state
      if (state && typeof state.active_face === 'string') {
        activeFace = state.active_face.toLowerCase().trim() || null
      }
    } catch {
      // Ignore parse errors
    }
  }

  const kotterStage =
    instance?.kotterStage != null && instance.kotterStage >= 1 && instance.kotterStage <= 8
      ? instance.kotterStage
      : null

  return {
    kotterStage,
    nationName,
    playbookTrigram,
    activeFace,
    playedHexagramIds,
  }
}

/**
 * Score a hexagram's alignment with the given context.
 * Returns total score and per-factor breakdown.
 */
export function scoreHexagramAlignment(
  hexagramId: number,
  context: IChingAlignmentContext
): { score: number; breakdown: AlignmentBreakdown } {
  const structure = getHexagramStructure(hexagramId)
  const upper = structure.upper
  const lower = structure.lower
  const trigrams = [upper, lower]

  const breakdown: AlignmentBreakdown = {
    kotter: 0,
    nation: 0,
    archetype: 0,
    sect: 0,
  }

  // Kotter: current stage trigram
  if (context.kotterStage != null) {
    const stage = context.kotterStage as KotterStage
    const stageTrigram = KOTTER_STAGES[stage]?.trigram
    if (stageTrigram) {
      const matches = trigrams.filter((t) => t === stageTrigram).length
      breakdown.kotter = matches >= 2 ? 2 : matches >= 1 ? 1 : 0
    }
  }

  // Nation: NATION_AFFINITIES
  if (context.nationName) {
    const affinities = NATION_AFFINITIES[context.nationName]
    if (affinities && trigrams.some((t) => affinities.includes(t))) {
      breakdown.nation = 1
    }
  }

  // Archetype: playbook trigram
  if (context.playbookTrigram && trigrams.some((t) => t === context.playbookTrigram)) {
    breakdown.archetype = 1
  }

  // Sect: FACE_TRIGRAM_PREFERENCE
  if (context.activeFace) {
    const preferred = FACE_TRIGRAM_PREFERENCE[context.activeFace]
    if (preferred && trigrams.some((t) => t === preferred)) {
      breakdown.sect = 1
    }
  }

  const score = breakdown.kotter + breakdown.nation + breakdown.archetype + breakdown.sect
  return { score, breakdown }
}

/**
 * Draw a hexagram aligned with the given context.
 * Prefers hexagrams the player has not yet received (throughput-first).
 * When no instance: pure random (1-64), preferring unplayed.
 * When instance exists: weighted random from scored pool (top 16 or score >= 1), preferring unplayed.
 */
export async function drawAlignedHexagram(context: IChingAlignmentContext): Promise<number> {
  const played = new Set(context.playedHexagramIds)

  if (context.kotterStage == null) {
    const unplayed = [...Array.from({ length: 64 }, (_, i) => i + 1)].filter((id) => !played.has(id))
    const drawPool = unplayed.length > 0 ? unplayed : [...Array.from({ length: 64 }, (_, i) => i + 1)]
    return drawPool[Math.floor(Math.random() * drawPool.length)]!
  }

  const scored: Array<{ id: number; score: number }> = []
  for (let id = 1; id <= 64; id++) {
    const { score } = scoreHexagramAlignment(id, context)
    scored.push({ id, score })
  }

  // Pool: hexagrams with score >= 1, or top 16 by score
  const withScore = scored.filter((s) => s.score >= 1)
  const pool = withScore.length > 0 ? withScore : scored.sort((a, b) => b.score - a.score).slice(0, 16)

  // Prefer unplayed; fall back to full pool when all played
  const unplayed = pool.filter((p) => !played.has(p.id))
  const drawPool = unplayed.length > 0 ? unplayed : pool

  // Weighted random: weight = score + 1 (so score 0 still has weight 1)
  const totalWeight = drawPool.reduce((sum, p) => sum + p.score + 1, 0)
  let r = Math.random() * totalWeight
  for (const p of drawPool) {
    r -= p.score + 1
    if (r <= 0) return p.id
  }
  return drawPool[drawPool.length - 1]!.id
}
