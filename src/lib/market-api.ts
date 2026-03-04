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
  playbook: { name: string } | null
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
}

/** Client-side filter params. Server returns all player quests; client filters for UX. */
export type MarketFilters = {
  search?: string
  domain?: string[]
  nation?: string[]
  archetype?: string[]
  kotterStage?: number | null
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
      const creatorArchetype = q.creator?.playbook?.name
      if (!creatorArchetype || !filters.archetype.includes(creatorArchetype)) return false
    }
    if (filters.kotterStage != null && q.kotterStage !== filters.kotterStage) {
      return false
    }
    return true
  })
}
