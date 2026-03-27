/** Timebank-aligned offer BAR — see `.specify/specs/offer-bar-timebank-wizard-modal/spec.md` */

export const OFFER_BAR_KIND = 'timebank_offer' as const
export const OFFER_BAR_PROTOCOL_VERSION = 1 as const

export type OfferBarSkillBand = 'skilled' | 'unskilled' | 'either'

export type CreativeOfferPattern = 'along_the_way' | 'scheduled' | 'batch' | 'other'

export type OfferBarDswPath = 'time' | 'space'

/**
 * Persisted under `CustomBar.docQuestMetadata` as `{ offerBar: OfferBarMetadata }`.
 */
export type OfferBarMetadata = {
  kind: typeof OFFER_BAR_KIND
  protocolVersion: typeof OFFER_BAR_PROTOCOL_VERSION
  skillBand: OfferBarSkillBand
  estimatedHours?: number
  sessionCount?: number
  schedulingNotes?: string
  geographyOrVenue?: string
  creativeOfferPattern?: CreativeOfferPattern
  source: 'dsw_wizard'
  campaignRef?: string
  dswPath?: OfferBarDswPath
}

export type OfferBarDocQuestPayload = {
  offerBar: OfferBarMetadata
}
