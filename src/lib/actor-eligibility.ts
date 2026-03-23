/**
 * Actor Capability + Quest Eligibility Engine v0 (GC)
 *
 * Scoring primitives for matching actors to quests and quests to actors.
 * All logic is pure — callers supply the loaded data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EligibleQuest {
  questId: string
  title: string
  type: string
  moveType: string | null
  questPool: string | null
  nation: string | null
  archetype: string | null
  emotionalAlchemyTag: string | null
  score: number
  isRecommended: boolean
}

export interface EligibleActor {
  playerId: string
  name: string
  nationName: string | null
  archetypeName: string | null
  primaryWaveStage: string | null
  score: number
  isRecommended: boolean
}

/** Context about a player used for scoring — pre-loaded by the caller. */
export interface ActorContext {
  nationName: string | null
  archetypeName: string | null
  /** Player's archetype primary wave stage (e.g. 'wakeUp', 'cleanUp'). */
  primaryWaveStage: string | null
  /** Count of completed quests per moveType, for responder scoring. */
  completedMoveTypes?: string[]
}

/** Minimal quest snapshot used for scoring — pre-loaded by the caller. */
export interface QuestSnapshot {
  nation: string | null
  archetype: string | null
  moveType: string | null
  questPool: string | null
}

// ---------------------------------------------------------------------------
// Scoring constants
// ---------------------------------------------------------------------------

const SCORE_NATION_MATCH = 3
const SCORE_ARCHETYPE_MATCH = 3
const SCORE_MOVE_MATCH = 2
const SCORE_DISCOVERY_POOL = 1
const SCORE_DOJO_WITH_ARCHETYPE = 1
const SCORE_COMPLETED_MOVE_HISTORY = 1

export const RECOMMENDATION_THRESHOLD = 1

// ---------------------------------------------------------------------------
// scoreQuestForActor
// ---------------------------------------------------------------------------

/**
 * Score a quest against an actor's capabilities.
 * Returns an integer >= 0; 0 = neutral eligible, >= RECOMMENDATION_THRESHOLD = recommended.
 */
export function scoreQuestForActor(quest: QuestSnapshot, actor: ActorContext): number {
  let score = 0

  if (quest.nation && actor.nationName && quest.nation === actor.nationName) {
    score += SCORE_NATION_MATCH
  }
  if (quest.archetype && actor.archetypeName && quest.archetype === actor.archetypeName) {
    score += SCORE_ARCHETYPE_MATCH
  }
  if (quest.moveType && actor.primaryWaveStage && quest.moveType === actor.primaryWaveStage) {
    score += SCORE_MOVE_MATCH
  }
  if (quest.questPool === 'discovery') {
    score += SCORE_DISCOVERY_POOL
  }
  if (quest.questPool === 'dojo' && actor.archetypeName) {
    score += SCORE_DOJO_WITH_ARCHETYPE
  }

  return score
}

// ---------------------------------------------------------------------------
// scoreActorForQuest
// ---------------------------------------------------------------------------

/**
 * Score a player's fit for a specific quest.
 * Returns an integer >= 0; >= RECOMMENDATION_THRESHOLD = recommended responder.
 */
export function scoreActorForQuest(actor: ActorContext, quest: QuestSnapshot): number {
  let score = 0

  if (quest.nation && actor.nationName && quest.nation === actor.nationName) {
    score += SCORE_NATION_MATCH
  }
  if (quest.archetype && actor.archetypeName && quest.archetype === actor.archetypeName) {
    score += SCORE_ARCHETYPE_MATCH
  }
  if (quest.moveType && actor.primaryWaveStage && quest.moveType === actor.primaryWaveStage) {
    score += SCORE_MOVE_MATCH
  }
  if (quest.moveType && actor.completedMoveTypes?.includes(quest.moveType)) {
    score += SCORE_COMPLETED_MOVE_HISTORY
  }

  return score
}
