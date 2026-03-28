import template from './allyship-intake-thunder.template.json'
import { parseEventInviteStory, type EventInviteStory } from '../schema'

/**
 * Allyship intake CYOA for emergent Support campaigns (e.g. Thunder).
 * @see docs/runbooks/EMERGENT_ALLYSHIP_INTAKE_OPS.md
 * @see .specify/specs/emergent-campaign-bar-interview/spec.md (ECI)
 */
export const ALLYSHIP_INTAKE_THUNDER_TEMPLATE_JSON = JSON.stringify(template)

export function parseAllyshipIntakeThunderTemplate(): EventInviteStory | null {
  return parseEventInviteStory(ALLYSHIP_INTAKE_THUNDER_TEMPLATE_JSON)
}
