import template from './event-invite-guest-journey.template.json'
import { parseEventInviteStory, type EventInviteStory } from '../schema'

/**
 * Canonical JSON string for `CustomBar.storyContent` on `event_invite` BARs.
 * @see docs/events/EVENT_INVITE_GUEST_JOURNEY_TEMPLATE.md
 */
export const EVENT_INVITE_GUEST_JOURNEY_TEMPLATE_JSON = JSON.stringify(template)

/** Returns parsed story or null if the bundled template drifts out of schema (CI should catch). */
export function parseGuestJourneyTemplate(): EventInviteStory | null {
  return parseEventInviteStory(EVENT_INVITE_GUEST_JOURNEY_TEMPLATE_JSON)
}
