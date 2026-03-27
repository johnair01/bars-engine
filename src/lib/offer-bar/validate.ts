import {
  OFFER_BAR_KIND,
  OFFER_BAR_PROTOCOL_VERSION,
  type CreativeOfferPattern,
  type OfferBarDswPath,
  type OfferBarMetadata,
  type OfferBarSkillBand,
} from './types'

export const OFFER_BAR_TITLE_MAX = 200
export const OFFER_BAR_DESCRIPTION_MAX = 8000
export const OFFER_BAR_NOTES_MAX = 2000
export const OFFER_BAR_VENUE_MAX = 500

const SKILL: ReadonlySet<string> = new Set(['skilled', 'unskilled', 'either'])
const PATTERN: ReadonlySet<string> = new Set(['along_the_way', 'scheduled', 'batch', 'other'])
const DSW: ReadonlySet<string> = new Set(['time', 'space'])

export type OfferBarCreateInput = {
  title: string
  description: string
  skillBand: OfferBarSkillBand
  campaignRef?: string | null
  estimatedHours?: number | null
  sessionCount?: number | null
  schedulingNotes?: string | null
  geographyOrVenue?: string | null
  creativeOfferPattern?: CreativeOfferPattern | null
  dswPath?: OfferBarDswPath | null
}

function trimTo(s: string | undefined | null, max: number): string | undefined {
  if (s == null) return undefined
  const t = s.trim()
  if (!t) return undefined
  return t.length > max ? t.slice(0, max) : t
}

/**
 * Validates wizard/modal input and returns persisted `OfferBarMetadata` or an error string.
 */
export function validateAndBuildOfferBarMetadata(input: OfferBarCreateInput): { ok: true; metadata: OfferBarMetadata } | { ok: false; error: string } {
  const title = (input.title ?? '').trim()
  if (!title) return { ok: false, error: 'Title is required' }
  if (title.length > OFFER_BAR_TITLE_MAX) {
    return { ok: false, error: `Title must be at most ${OFFER_BAR_TITLE_MAX} characters` }
  }

  const description = (input.description ?? '').trim()
  if (!description) return { ok: false, error: 'Description is required' }
  if (description.length > OFFER_BAR_DESCRIPTION_MAX) {
    return { ok: false, error: `Description must be at most ${OFFER_BAR_DESCRIPTION_MAX} characters` }
  }

  const band = input.skillBand
  if (!band || !SKILL.has(band)) {
    return { ok: false, error: 'Skill band must be skilled, unskilled, or either' }
  }

  let estimatedHours: number | undefined
  if (input.estimatedHours != null) {
    const n = Number(input.estimatedHours)
    if (!Number.isFinite(n) || n < 0 || n > 500) {
      return { ok: false, error: 'Estimated hours must be between 0 and 500' }
    }
    estimatedHours = n
  }

  let sessionCount: number | undefined
  if (input.sessionCount != null) {
    const n = Number(input.sessionCount)
    if (!Number.isFinite(n) || n < 0 || n > 100 || !Number.isInteger(n)) {
      return { ok: false, error: 'Session count must be an integer from 0 to 100' }
    }
    sessionCount = n
  }

  const schedulingNotes = trimTo(input.schedulingNotes ?? undefined, OFFER_BAR_NOTES_MAX)
  const geographyOrVenue = trimTo(input.geographyOrVenue ?? undefined, OFFER_BAR_VENUE_MAX)

  let creativeOfferPattern: CreativeOfferPattern | undefined
  if (input.creativeOfferPattern != null) {
    const p = input.creativeOfferPattern
    if (!PATTERN.has(p)) {
      return { ok: false, error: 'Invalid offer pattern' }
    }
    creativeOfferPattern = p
  }

  const campaignRef = trimTo(input.campaignRef ?? undefined, 120)

  let dswPath: OfferBarDswPath | undefined
  if (input.dswPath != null) {
    const d = input.dswPath
    if (!DSW.has(d)) return { ok: false, error: 'Invalid DSW path' }
    dswPath = d
  }

  const metadata: OfferBarMetadata = {
    kind: OFFER_BAR_KIND,
    protocolVersion: OFFER_BAR_PROTOCOL_VERSION,
    skillBand: band,
    source: 'dsw_wizard',
    ...(estimatedHours !== undefined ? { estimatedHours } : {}),
    ...(sessionCount !== undefined ? { sessionCount } : {}),
    ...(schedulingNotes ? { schedulingNotes } : {}),
    ...(geographyOrVenue ? { geographyOrVenue } : {}),
    ...(creativeOfferPattern ? { creativeOfferPattern } : {}),
    ...(campaignRef ? { campaignRef } : {}),
    ...(dswPath ? { dswPath } : {}),
  }

  return { ok: true, metadata }
}

/** Serialize for `CustomBar.docQuestMetadata`. */
export function serializeOfferBarDocQuest(metadata: OfferBarMetadata): string {
  const payload = { offerBar: metadata }
  return JSON.stringify(payload)
}

/** Parse stored `docQuestMetadata` JSON; returns `offerBar` or null if missing/invalid. */
export function parseOfferBarFromDocQuest(docQuestMetadata: string | null | undefined): OfferBarMetadata | null {
  if (!docQuestMetadata?.trim()) return null
  try {
    const raw = JSON.parse(docQuestMetadata) as { offerBar?: unknown }
    const ob = raw?.offerBar
    if (!ob || typeof ob !== 'object') return null
    const o = ob as Record<string, unknown>
    if (o.kind !== OFFER_BAR_KIND) return null
    if (o.protocolVersion !== OFFER_BAR_PROTOCOL_VERSION) return null
    if (typeof o.skillBand !== 'string' || !SKILL.has(o.skillBand)) return null
    if (o.source !== 'dsw_wizard') return null
    return ob as OfferBarMetadata
  } catch {
    return null
  }
}
