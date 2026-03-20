/**
 * Map charge quest suggestions through applyArchetypeOverlay (QuestSeed path).
 * Spec: .specify/specs/individuation-engine/plan.md (IE-3)
 */

import { applyArchetypeOverlay } from '@/lib/archetype-influence-overlay'
import type { ArchetypeInfluenceProfile } from '@/lib/archetype-influence-overlay/types'
import type { QuestSuggestion } from '@/lib/charge-quest-generator'
import type { QuestSeed } from '@/lib/transformation-move-registry/types'

function suggestionToQuestSeed(s: QuestSuggestion, sourceNarrative: string): QuestSeed {
  return {
    quest_seed_id: `charge-${s.template_id ?? s.move_type}`,
    source_narrative: sourceNarrative,
    lock_type: 'emotional_lock',
    arc: {
      show: {
        move_id: s.move_type,
        prompt: s.quest_summary,
        output_type: 'action',
      },
      integrate: {
        move_id: s.move_type,
        bar_prompt: s.quest_summary,
        bar_type: 'insight',
      },
    },
  }
}

/**
 * Apply archetype overlay to each suggestion's summary (via minimal QuestSeed).
 */
export function applyArchetypeToChargeSuggestions(
  suggestions: QuestSuggestion[],
  profile: ArchetypeInfluenceProfile,
  sourceNarrative: string
): QuestSuggestion[] {
  return suggestions.map((s) => {
    const seed = suggestionToQuestSeed(s, sourceNarrative)
    const overlaid = applyArchetypeOverlay(seed, profile)
    const summary = overlaid.arc.show?.prompt ?? s.quest_summary
    return { ...s, quest_summary: summary }
  })
}
