/**
 * Market API — typed, deterministic, API-first.
 * Player-created quests only (isSystem: false). No AI.
 *
 * Spec: .specify/specs/market-redesign-launch/spec.md
 */

export type MarketQuestCreator = {
  id: string
  name: string | null
  avatarConfig: string | null
  nation: { name: string } | null
  archetype: { name: string } | null
}

export type MarketQuest = {
  id: string
  title: string
  description: string | null
  reward: number
  allyshipDomain: string | null
  kotterStage: number | null
  isAnonymous?: boolean
  showCreatorName?: boolean
  visibility?: string
  creator: MarketQuestCreator | null
  /** True when questSource === 'bounty' or stakedPool > 0 */
  isBounty?: boolean
}

/** Client-side filter params. Server returns all player quests; client filters for UX. */
export type MarketFilters = {
  search?: string
  domain?: string[]
  nation?: string[]
  archetype?: string[]
  kotterStage?: number | null
  /** When true, show only bounties; when false, show only non-bounties; when undefined, show all */
  bountiesOnly?: boolean
}

/**
 * Filter quests by client-side params. Deterministic; no server call.
 */
export function filterMarketQuests(
  quests: MarketQuest[],
  filters: MarketFilters
): MarketQuest[] {
  return quests.filter((q) => {
    if (filters.search) {
      const s = filters.search.toLowerCase()
      const matchesSearch =
        q.title.toLowerCase().includes(s) ||
        (q.description?.toLowerCase().includes(s) ?? false)
      if (!matchesSearch) return false
    }
    if (filters.domain?.length && q.allyshipDomain && !filters.domain.includes(q.allyshipDomain)) {
      return false
    }
    if (filters.nation?.length) {
      const creatorNation = q.creator?.nation?.name
      if (!creatorNation || !filters.nation.includes(creatorNation)) return false
    }
    if (filters.archetype?.length) {
      const creatorArchetype = q.creator?.archetype?.name
      if (!creatorArchetype || !filters.archetype.includes(creatorArchetype)) return false
    }
    if (filters.kotterStage != null && q.kotterStage !== filters.kotterStage) {
      return false
    }
    if (filters.bountiesOnly === true && !q.isBounty) return false
    if (filters.bountiesOnly === false && q.isBounty) return false
    return true
  })
}
