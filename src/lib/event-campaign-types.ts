/**
 * EventCampaign.campaignType — string column on EventCampaign (Prisma).
 * Calendar gatherings (EventArtifact) attach only to {@link EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION}.
 */

export const EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION = 'event_production' as const

/** Raise-awareness / social content sprint: production QuestThread + CHS/spoke content — not calendar rows. */
export const EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN = 'awareness_content_run' as const

export const EVENT_CAMPAIGN_TYPES = [
  EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION,
  EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN,
] as const

export type EventCampaignType = (typeof EVENT_CAMPAIGN_TYPES)[number]

export function isEventCampaignType(value: string): value is EventCampaignType {
  return (EVENT_CAMPAIGN_TYPES as readonly string[]).includes(value)
}

/** Campaigns that may have dated EventArtifact rows (invites, .ics, RSVP). */
export function isCalendarEventCampaignType(campaignType: string | null | undefined): boolean {
  return !campaignType || campaignType === EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION
}

export function awarenessContentRunLabel(): string {
  return 'Awareness & social content run'
}
