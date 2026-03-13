/**
 * Archetype Influence Overlay v1 — Apply overlay to quest seeds
 * Spec: .specify/specs/archetype-influence-overlay/spec.md
 */

import type { ArchetypeInfluenceProfile } from './types'
import type { QuestSeed, QuestSeedArc } from '../transformation-moves/types'

/**
 * Applies archetype influence overlay to a quest seed.
 * Modifies Experiment (show) and Integration prompts; does not change move selection.
 */
export function applyArchetypeOverlay(
  seed: QuestSeed,
  profile: ArchetypeInfluenceProfile
): QuestSeed {
  const arc = { ...seed.arc }

  // Experiment stage (show_up) — flavor the action objective
  if (arc.show?.prompt && profile.prompt_modifiers[0]) {
    const modifier = profile.prompt_modifiers[0]
    arc.show = {
      ...arc.show,
      prompt: `${arc.show.prompt} ${modifier}`.trim(),
    }
  }

  // Integration stage — flavor the reflection/bar prompt
  if (arc.integrate?.bar_prompt && profile.reflection_style[0]) {
    const reflection = profile.reflection_style[0]
    arc.integrate = {
      ...arc.integrate,
      bar_prompt: `${arc.integrate.bar_prompt} (${profile.archetype_name}: ${reflection})`.trim(),
    }
  }

  return {
    ...seed,
    arc,
  }
}
