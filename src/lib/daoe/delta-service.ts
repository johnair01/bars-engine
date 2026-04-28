/**
 * DAOE Phase 2 — Delta computation service
 *
 * Stateless delta computation for client-side prediction.
 * Accepts campaignId + frame → returns DeltaUpdate.
 *
 * LATENCY BUDGET (per spec):
 *   Fortune path — I Ching cast → <10ms (pure computation)
 *   Karma path — Prisma delta read → <5ms (indexed)
 *   Drama path — Twine state lookup → <1ms
 *   LLM path — NEVER in hot path (async only, 200-800ms)
 *
 * DAOE Phase 2 FR2.1: GET /api/daoe/state-delta
 * DAOE Phase 4 FR4.2: suspendedAt guard added once schema ships
 */

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import type { DeltaUpdate, FortuneState, DramaState, KarmaState, ResolutionRegister } from './types'

// ---------------------------------------------------------------------------
// Player session (cookie-based — matches existing bars pattern)
// ---------------------------------------------------------------------------

async function getPlayerIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('bars_player_id')?.value ?? null
}

// ---------------------------------------------------------------------------
// Register-specific state builders
// ---------------------------------------------------------------------------

/**
 * Fortune state from I Ching reading history.
 * Uses acquiredAt as the sort field — acquiredAt is the only timestamp on PlayerBar.
 */
async function buildFortuneState(playerId: string): Promise<FortuneState> {
  const readings = await db.playerBar.findMany({
    where: { playerId, source: 'iching' },
    orderBy: { acquiredAt: 'desc' },
    take: 20,
    select: { barId: true, acquiredAt: true },
  })

  const hexagrams = await db.bar.findMany({
    where: { id: { in: readings.map((r) => r.barId) } },
    select: { id: true, name: true },
  })

  const nameMap = new Map(hexagrams.map((h) => [h.id, h.name]))

  return {
    lastHexagram: readings[0] ? String(nameMap.get(readings[0].barId) ?? readings[0].barId) : '',
    lastCastAt: readings[0]?.acquiredAt?.toISOString() ?? '',
    castHistory: readings.map((r) => String(nameMap.get(r.barId) ?? r.barId)),
  }
}

/**
 * Drama state from Twine story progress.
 * Falls back to empty state when no story progress exists for this campaign.
 */
async function buildDramaState(playerId: string, campaignId: string): Promise<DramaState> {
  // DAOE Shaman S-4: The Drama register uses TwineRun state, not StoryProgress.
  // storyProgress.state is the player narrative state that drives fiction-first outcomes.
  const run = await db.twineRun.findFirst({
    where: { playerId, questId: campaignId },
    orderBy: { updatedAt: 'desc' },
    include: { story: { select: { parsedJson: true } } },
  })

  if (!run) {
    return { currentNode: 'start', availableChoices: [], narrativeContext: '' }
  }

  let parsedJson: Record<string, unknown> = {}
  try {
    parsedJson = JSON.parse(run.story?.parsedJson ?? '{}')
  } catch { /* use empty object */ }

  // current passage = TwineRun.currentPassageId
  // available choices = unvisited passages linked from current passage
  // narrative context = cyoaState (player narrative state)
  const visited: string[] = (() => {
    try { return JSON.parse(run.visited) } catch { return [] }
  })()
  const cyoaState: Record<string, unknown> = (() => {
    try { return JSON.parse(run.cyoaState) } catch { return {} }
  })()

  // Extract links from current passage in parsedJson
  let availableChoices: string[] = []
  const passages = (parsedJson as any).passages ?? {}
  const currentPassage = passages[run.currentPassageId] ?? {}
  const links: Array<{ text: string; target: string }> = currentPassage.links ?? []
  availableChoices = links
    .map((l: { target: string }) => l.target)
    .filter((t: string) => !visited.includes(t))

  return {
    currentNode: run.currentPassageId,
    availableChoices,
    narrativeContext: JSON.stringify(cyoaState).slice(0, 200),
  }
}

/**
 * Karma state from BSM maturity + alchemy streak.
 * storyProgress on Player is a JSON string — parse it for maturityPhase.
 */
async function buildKarmaState(playerId: string): Promise<KarmaState> {
  const player = await db.player.findUnique({
    where: { id: playerId },
    select: { storyProgress: true },
  })

  let maturityPhase = 'captured'
  let bsmProgress = 0

  try {
    const sp = typeof player?.storyProgress === 'string'
      ? JSON.parse(player.storyProgress)
      : (player?.storyProgress as any) ?? {}
    maturityPhase = (sp as any)?.maturityPhase ?? 'captured'
    bsmProgress = (sp as any)?.bsmProgress ?? 0
  } catch {
    // default: captured / 0
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const streakStart = new Date(today)
  streakStart.setDate(streakStart.getDate() - 30)

  // acquiredAt is the correct timestamp field on PlayerBar (not createdAt)
  const alchemyCount = await db.playerBar.count({
    where: {
      playerId,
      source: 'alchemy',
      acquiredAt: { gte: streakStart },
    },
  })

  return {
    maturityPhase,
    bsmProgress,
    alchemyStreak: alchemyCount,
  }
}

// ---------------------------------------------------------------------------
// Suspension check
// suspendedAt is added in Phase 4 migration.
// Guard is type-safe: TypeScript sees the field only when it exists in the schema.
// At runtime before Phase 4 migration: campaign.suspendedAt is always undefined.
// ---------------------------------------------------------------------------

async function isSuspended(campaignId: string): Promise<boolean> {
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { suspendedAt: true },
  })
  return campaign?.suspendedAt != null
}

// ---------------------------------------------------------------------------
// Main delta computation
// ---------------------------------------------------------------------------

/**
 * Compute a DeltaUpdate for a campaign at a given frame.
 *
 * The register is inferred from registerOverride or defaults to 'karma'.
 * Callers should pass registerOverride = 'fortune' | 'drama' | 'karma'
 * based on the last action type.
 */
export async function computeDelta(
  campaignId: string,
  frame: number,
  opts?: { registerOverride?: ResolutionRegister },
): Promise<DeltaUpdate> {
  const playerId = await getPlayerIdFromCookie()
  if (!playerId) {
    return { campaignId, frame, register: 'none', serverTime: Date.now(), suspended: true }
  }

  const suspended = await isSuspended(campaignId)
  if (suspended) {
    return { campaignId, frame, register: 'none', serverTime: Date.now(), suspended: true }
  }

  const register: ResolutionRegister = opts?.registerOverride ?? 'karma'

  let fortuneState: FortuneState | undefined
  let dramaState: DramaState | undefined
  let karmaState: KarmaState | undefined

  if (register === 'fortune') {
    fortuneState = await buildFortuneState(playerId)
  } else if (register === 'drama') {
    dramaState = await buildDramaState(playerId, campaignId)
  } else if (register === 'karma') {
    karmaState = await buildKarmaState(playerId)
  }

  return {
    campaignId,
    frame,
    register,
    ...(fortuneState && { fortuneState }),
    ...(dramaState && { dramaState }),
    ...(karmaState && { karmaState }),
    suspended,
    serverTime: Date.now(),
  }
}

export { isSuspended }
