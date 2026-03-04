/**
 * Choice Privileging Context for AI Prompts
 *
 * ~100 tokens. Injected into buildQuestPromptContext when targetNationId/targetPlaybookId present.
 * CE: Nation and Playbook Choice Privileging.
 */

import type { ElementKey } from './elements'
import type { PersonalMoveType } from './types'

const WAVE_NAMES: Record<PersonalMoveType, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

/**
 * Build condensed choice-privileging block for AI prompts.
 * Style guide: 2–3 choices per passage. Privilege nation element + playbook WAVE.
 */
export function buildChoicePrivilegingContext(
  nationElement: ElementKey,
  playbookWave: PersonalMoveType
): string {
  const waveName = WAVE_NAMES[playbookWave]
  return `## Choice Privileging (2–3 per passage)
- Target nation element: ${nationElement}. Offer at least one choice favoring a move involving this element (e.g. fire → Achieve Breakthrough, Declare Intention, Temper Action).
- Target playbook primary WAVE: ${waveName}. Offer at least one choice favoring a move whose primary WAVE matches (e.g. showUp → Step Through, Achieve Breakthrough, Declare Intention).
- Limit: 2–3 choices per passage. Choices must be actionable and emergent.`
}
