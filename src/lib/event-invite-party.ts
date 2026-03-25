/**
 * Event invite party (EIP) — event-scoped initiation routing + BAR config.
 * @see .specify/specs/event-invite-party-initiation/spec.md
 */

/** Allowed slug segments for `/campaign/event/[eventSlug]/initiation` (Bruised Banana MVP). */
export const EVENT_INVITE_ALLOWED_SLUGS = ['apr-4-dance', 'apr-5-game'] as const
export type EventInviteSlug = (typeof EVENT_INVITE_ALLOWED_SLUGS)[number]

export function isAllowedEventInviteSlug(s: string): s is EventInviteSlug {
  return (EVENT_INVITE_ALLOWED_SLUGS as readonly string[]).includes(s)
}

/** Adventure slug: `{campaignRef}-event-{eventSlug}-initiation-{segment}` */
export function eventInitiationAdventureSlug(
  campaignRef: string,
  eventSlug: string,
  segment: 'player' | 'sponsor'
): string {
  return `${campaignRef}-event-${eventSlug}-initiation-${segment}`
}
