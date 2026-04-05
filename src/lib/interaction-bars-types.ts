export const INTERACTION_BAR_TYPES = [
  'quest_invitation',
  'help_request',
  'appreciation',
  'coordination',
] as const

export type InteractionBarType = (typeof INTERACTION_BAR_TYPES)[number]

export const BAR_RESPONSE_TYPES = [
  'join',
  'curious',
  'witness',
  'offer_help',
  'decline',
  'cant_help',
  'appreciate',
] as const

export type BarResponseType = (typeof BAR_RESPONSE_TYPES)[number]

export type CreateInteractionBarPayload = {
  barType: InteractionBarType
  title: string
  description: string
  visibility: 'private' | 'public'
  payload: Record<string, unknown>
  parentId?: string
  campaignRef?: string
}

export type ListBarsFilters = {
  campaignRef?: string
  barType?: string | string[]
  visibility?: 'private' | 'public'
  creatorId?: string
  parentId?: string
  status?: string | string[]
}

export type BarFeedFilters = {
  campaignRef?: string
  barTypes?: string[]
  statuses?: string[]
  limit?: number
  offset?: number
}
