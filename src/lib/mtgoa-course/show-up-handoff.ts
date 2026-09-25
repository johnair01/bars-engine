import { MTGOA_ORGANIZATION_STATE } from './organization-state'
import type { DayTenLane, DayTenPlacement } from './day-ten'

/**
 * The Day 10 steward submission — pure domain.
 *
 * Everything a reader writes on Day 10 stays in the browser. This module
 * describes the one exception: a final artifact the reader reviews field by
 * field and deliberately sends to the Campaign Stewards.
 *
 * The boundary is structural rather than careful. The parser below accepts
 * exactly the artifact fields and rejects everything else, so the 3-2-1, the
 * load check, the body weather and the card answers have no path to the server
 * even if a future caller tries to pass them.
 *
 * Authority: .specify/specs/mtgoa-day10-campaign-handoff/design_handoff/README.md
 * Founder decisions of 2026-08-27 are recorded in SHOW_UP_TERMS below.
 */

export const SHOW_UP_HANDOFF_SOURCE = 'course-day-10' as const

/** The campaign this work belongs to. */
export const SHOW_UP_PARENT_CAMPAIGN_REF = 'mtgoa-book-launch'

/**
 * Which campaign refs a submission may name.
 *
 * Derived from the published organization state rather than typed out here, so
 * a submission can only ever land against a workstream a reader could actually
 * have read about. A closed or removed workstream stops being submittable the
 * moment it stops being published.
 */
export const SHOW_UP_CAMPAIGN_REFS: readonly string[] = [
  ...new Set([
    SHOW_UP_PARENT_CAMPAIGN_REF,
    ...MTGOA_ORGANIZATION_STATE.activeWorkstreams.map((w) => `mtgoa-${w.id}`),
  ]),
]

/**
 * What a sender can ask for.
 *
 * `contactRequired` is the gate: a request that expects a human response cannot
 * be sent without a contact route and consent. `none` is the anonymous path and
 * creates no contact record at all.
 */
export const SHOW_UP_STEWARD_REQUESTS: readonly {
  key: string
  label: string
  contactRequired: boolean
}[] = [
  { key: 'none', label: 'No reply needed — I want this visible to the campaign.', contactRequired: false },
  { key: 'ack', label: 'Acknowledge that you received it.', contactRequired: true },
  { key: 'feedback', label: 'Feedback on the handoff.', contactRequired: true },
  { key: 'convo', label: 'A conversation about whether this could become campaign work.', contactRequired: true },
  { key: 'offer', label: 'I am offering a specific capacity or resource.', contactRequired: true },
]

export function showUpStewardRequest(key: string | null) {
  return SHOW_UP_STEWARD_REQUESTS.find((r) => r.key === key) ?? null
}

/** Where the reader put the structure. Descriptive, and it grants nothing. */
export const SHOW_UP_PLACEMENT_KINDS: readonly { key: string; label: string }[] = [
  { key: 'calendar', label: 'calendar' },
  { key: 'message', label: 'consented message' },
  { key: 'doc', label: 'shared document' },
  { key: 'meeting', label: 'meeting' },
  { key: 'other', label: 'other' },
]

/**
 * Steward-side status.
 *
 * `shaping_conversation` is as far as this vocabulary goes. Turning a
 * submission into campaign work is a separate steward decision against
 * `CollectiveOffer` or `MilestoneNeed`, and no status change here performs it.
 */
export const SHOW_UP_SUBMISSION_STATUSES: readonly { key: string; label: string; body: string }[] = [
  { key: 'new', label: 'New', body: 'Arrived, and nobody has looked yet.' },
  { key: 'seen', label: 'Seen', body: 'A steward has read it.' },
  { key: 'replied', label: 'Replied', body: 'A steward responded through the sender’s chosen route.' },
  { key: 'shaping_conversation', label: 'Shaping', body: 'A conversation is open about what this could become.' },
  { key: 'closed', label: 'Closed', body: 'Handled. No further steward action is expected.' },
  { key: 'withdrawn', label: 'Withdrawn', body: 'The sender withdrew it. It has left active review.' },
]

const REQUEST_KEYS = new Set(SHOW_UP_STEWARD_REQUESTS.map((r) => r.key))
const KIND_KEYS = new Set(SHOW_UP_PLACEMENT_KINDS.map((k) => k.key))
const REF_KEYS = new Set(SHOW_UP_CAMPAIGN_REFS)
const LANE_KEYS = new Set<DayTenLane>(['personal', 'local_team'])
/** Only a built thing can be submitted. Returned and put down have nothing to send. */
const SENDABLE_PLACEMENTS = new Set<DayTenPlacement>(['placed', 'prepared'])

/** Field caps. Long enough for a real handoff, short enough to bound a row. */
export const SHOW_UP_LIMITS = {
  title: 120,
  purpose: 600,
  nextAction: 600,
  owner: 160,
  terms: 600,
  returnPlan: 600,
  note: 2000,
  placementLearning: 500,
  senderName: 120,
  senderContact: 200,
  senderRegion: 160,
} as const

/**
 * The terms shown to a sender before any contact field, and published on the
 * privacy page. Founder decisions, taken 2026-08-27.
 *
 * Both of these were open questions the design would not ship without. They are
 * kept here as one exported object so the page a reader agrees to and the page
 * that publishes the rule cannot drift apart.
 */
export const SHOW_UP_TERMS = {
  /** Who sees it. */
  visibility:
    'This handoff is visible only to MTGOA Campaign Stewards, currently Wendell Britt. It stays unpublished, and it assigns you nothing.',
  /** What a reader is promised. Decision: read, and no reply promised. */
  response:
    'Every handoff is read by a Campaign Steward. Asking for a response does not guarantee one, and no submission creates a role, task, or commitment.',
  /** How long it is kept. Decision: kept until withdrawn, contact erased on withdrawal. */
  retention:
    'We keep your handoff until you withdraw it. Withdrawing deletes your name and contact details immediately. The handoff itself stays in the campaign record with nothing identifying you attached.',
  /** How a sender keeps control without an account. */
  withdrawal:
    'You get a one-time link to your handoff. It shows the handoff and its steward status, and it lets you withdraw or change how you want to be reached. It reaches only your own submission.',
  /** What consent covers. */
  consent:
    'I give MTGOA Campaign Stewards permission to store this handoff and contact me only about the response I requested or this specific piece of work.',
} as const

export type ShowUpHandoffInput = {
  campaignRef: string
  lane: DayTenLane
  placementState: DayTenPlacement
  placementKind: string | null
  /** Optional organizing context from the card the reader played. Never an identity label. */
  face: string | null
  domain: string | null
  title: string
  purpose: string
  nextAction: string
  owner: string
  terms: string
  returnPlan: string
  stewardRequest: string
  note: string
  placementLearning: string
  senderName: string
  senderContact: string
  senderRegion: string
  consentToContact: boolean
}

export type ShowUpHandoffParsed = Omit<ShowUpHandoffInput, 'consentToContact'> & {
  consentToContact: boolean
  parentCampaignRef: string
  source: typeof SHOW_UP_HANDOFF_SOURCE
  /** True when this submission creates no contact record at all. */
  anonymous: boolean
}

export type ShowUpHandoffParseResult =
  | { ok: true; value: ShowUpHandoffParsed }
  | { ok: false; error: string }

const str = (value: unknown, cap: number) =>
  typeof value === 'string' ? value.trim().slice(0, cap) : ''

/**
 * Parse a submission from an untrusted client payload.
 *
 * Reads only the named artifact fields off the input. Anything else a caller
 * attaches is dropped by construction, which is what keeps the private half of
 * Day 10 unable to reach the database.
 */
export function parseShowUpHandoff(input: unknown): ShowUpHandoffParseResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'Nothing to send.' }
  }
  const raw = input as Record<string, unknown>

  const campaignRef = str(raw.campaignRef, 80) || SHOW_UP_PARENT_CAMPAIGN_REF
  if (!REF_KEYS.has(campaignRef)) return { ok: false, error: 'Submissions are closed for that campaign.' }

  const lane = str(raw.lane, 40) as DayTenLane
  if (!LANE_KEYS.has(lane)) return { ok: false, error: 'Choose a lane before sending.' }

  const placementState = str(raw.placementState, 40) as DayTenPlacement
  if (!SENDABLE_PLACEMENTS.has(placementState)) {
    return { ok: false, error: 'Only a handoff you built and placed or prepared can be sent.' }
  }

  const placementKind = str(raw.placementKind, 40)
  if (placementKind && !KIND_KEYS.has(placementKind)) {
    return { ok: false, error: 'Choose where this is placed.' }
  }

  const stewardRequest = str(raw.stewardRequest, 40)
  const request = showUpStewardRequest(stewardRequest)
  if (!request || !REQUEST_KEYS.has(stewardRequest)) {
    return { ok: false, error: 'Choose what would be useful from us.' }
  }

  const purpose = str(raw.purpose, SHOW_UP_LIMITS.purpose)
  const nextAction = str(raw.nextAction, SHOW_UP_LIMITS.nextAction)
  if (!purpose && !nextAction) {
    return { ok: false, error: 'A handoff needs a purpose or a next action before it can be useful to anyone.' }
  }

  const consentToContact = raw.consentToContact === true
  const senderName = str(raw.senderName, SHOW_UP_LIMITS.senderName)
  const senderContact = str(raw.senderContact, SHOW_UP_LIMITS.senderContact)
  const senderRegion = str(raw.senderRegion, SHOW_UP_LIMITS.senderRegion)

  // A request that expects a human response cannot be sent without a route to
  // reply on and permission to use it.
  if (request.contactRequired && !(senderName && senderContact && consentToContact)) {
    return { ok: false, error: 'Add your name, a contact route, and consent to ask for a response.' }
  }

  // Consent is what makes contact storable. Without it the fields are dropped
  // here rather than saved and ignored downstream.
  const keepContact = consentToContact && !!senderContact
  const title = str(raw.title, SHOW_UP_LIMITS.title) || purpose.slice(0, SHOW_UP_LIMITS.title)

  return {
    ok: true,
    value: {
      campaignRef,
      parentCampaignRef: SHOW_UP_PARENT_CAMPAIGN_REF,
      source: SHOW_UP_HANDOFF_SOURCE,
      lane,
      placementState,
      placementKind: placementKind || null,
      face: str(raw.face, 40) || null,
      domain: str(raw.domain, 40) || null,
      title,
      purpose,
      nextAction,
      owner: str(raw.owner, SHOW_UP_LIMITS.owner),
      terms: str(raw.terms, SHOW_UP_LIMITS.terms),
      returnPlan: str(raw.returnPlan, SHOW_UP_LIMITS.returnPlan),
      stewardRequest,
      note: str(raw.note, SHOW_UP_LIMITS.note),
      placementLearning: str(raw.placementLearning, SHOW_UP_LIMITS.placementLearning),
      senderName: keepContact ? senderName : '',
      senderContact: keepContact ? senderContact : '',
      senderRegion: keepContact ? senderRegion : '',
      consentToContact: keepContact,
      anonymous: !keepContact,
    },
  }
}

/** The artifact rows a sender sees on their own handoff page, in the order the day built them. */
export function showUpArtifactRows(submission: {
  purpose: string | null
  nextAction: string | null
  owner: string | null
  terms: string | null
  returnPlan: string | null
}): { label: string; value: string }[] {
  return [
    { label: 'purpose', value: submission.purpose ?? '' },
    { label: 'next action', value: submission.nextAction ?? '' },
    { label: 'owner', value: submission.owner ?? '' },
    { label: 'terms', value: submission.terms ?? '' },
    { label: 'return', value: submission.returnPlan ?? '' },
  ].filter((row) => row.value.trim().length > 0)
}
