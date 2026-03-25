/**
 * Deterministic "Raise the urgency" quest payloads for campaign deck cards (Kotter stage 1).
 * Delegates copy to {@link composeKotterQuestSeedBar} (Kotter × hexagram × domain slots).
 * @see .specify/specs/world-map-campaign-deck-portals/
 */

import type { DeckCardMaterialSpec, DeckIntakeV1 } from '@/lib/admin-campaign-deck-intake'
import {
  composeKotterQuestSeedBar,
  type KotterQuestSeedBarPayload,
} from '@/lib/kotter-quest-seed-grammar'
import type { AllyshipDomain } from '@/lib/kotter'

export const OWNER_GOAL_LINE_MAX_LEN = 280

export type RaiseUrgencyQuestPayload = KotterQuestSeedBarPayload

const VALID_DOMAINS: readonly AllyshipDomain[] = [
  'GATHERING_RESOURCES',
  'DIRECT_ACTION',
  'RAISE_AWARENESS',
  'SKILLFUL_ORGANIZING',
]

function resolveDomain(spec: DeckCardMaterialSpec): AllyshipDomain {
  const d = spec.domain
  if (d && (VALID_DOMAINS as readonly string[]).includes(d)) {
    return d as AllyshipDomain
  }
  return 'GATHERING_RESOURCES'
}

/**
 * Build quest title + description from deck card spec + intake (template-only, reproducible).
 * Wizard path: stage 1, no emotional-alchemy / face until CYOA passes them in a later iteration.
 */
export function buildRaiseUrgencyQuestPayload(
  campaignRef: string,
  spec: DeckCardMaterialSpec,
  intake: DeckIntakeV1,
): RaiseUrgencyQuestPayload {
  const composed = composeKotterQuestSeedBar({
    campaignRef,
    kotterStage: 1,
    allyshipDomain: resolveDomain(spec),
    hexagramId: spec.hexagramId,
    emotionalAlchemyTag: null,
    gameMasterFace: null,
    ownerGoalLine: intake.ownerGoalLine,
    portalTheme: spec.theme,
    gmFaceMoveId: intake.gmFaceMoveId?.trim() || null,
  })

  const fx = JSON.parse(composed.completionEffects) as Record<string, unknown>
  fx.campaignDeckWizard = true
  fx.intakeVersion = intake.v
  fx.generatedAt = intake.appliedAt ?? null
  if (intake.gmFaceMoveId?.trim()) {
    fx.deckIntakeGmFaceMoveId = intake.gmFaceMoveId.trim()
  }

  return {
    ...composed,
    completionEffects: JSON.stringify(fx),
  }
}
