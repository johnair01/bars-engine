import type { GeneratedSpokeInputs } from '@/lib/generated-spoke-cyoa/types'
import type { CyoaBuild } from '@/lib/cyoa-build/schema'

/**
 * Map GSCP generated-spoke inputs into a full CyoaBuild. Campaign spoke flows default narrative template to Kotter grammar.
 */
export function cyoaBuildFromGeneratedSpokeInputs(input: GeneratedSpokeInputs): CyoaBuild {
  return {
    gameMasterFace: input.gmFace,
    narrativeTemplate: 'kotter',
    waveMove: input.moveFocus,
    campaignContext: {
      campaignRef: input.campaignRef,
      kotterStage: input.kotterStage,
      spokeIndex: input.spokeIndex,
      allyshipDomain: input.allyshipDomain ?? undefined,
    },
    emotionalVector: input.chargeText?.trim()
      ? { currentSummary: input.chargeText.trim() }
      : undefined,
    provenance: 'manual',
  }
}
