/**
 * The list contract — what a tag means and who is allowed into a sequence.
 *
 * Kept pure and free of network calls on purpose. The promise this encodes is
 * one the project made to 371 people who paid money before there was a product,
 * and a promise enforced only inside an HTTP client is a promise nobody can
 * read or test. `resend-list.ts` does the talking; this file decides.
 *
 * Contract from the site handoff (docs/handoffs/HANDOFF_SITE_2026-08-10.md §T3),
 * as amended by MAILING_LIST_SIX_FACES.md: Kit is closed, Resend Contacts carry
 * the list, and a reader joins only the list whose page promised them later
 * mail. Amendment 1 moved each promise from its own segment to a topic, because
 * the plan allows three segments.
 */

// ── Lists: who is on which ──────────────────────────────────────────────────

/**
 * The four pages that promise mail after the first one. A reader joins the
 * list for the page they signed up on, and no other.
 *
 * Chapter One, the Superpower quiz and the Myths Read are absent on purpose.
 * Their pages promise one email or a saved read, so those addresses stay in
 * Postgres and never reach a list. Kickstarter backers are absent too: they
 * are reached through Kickstarter, and no page on this site captures them.
 */
export type ListName = 'character-sheet' | 'succession' | 'nonprofit' | 'introductions'

/**
 * The one Resend segment for everyone promised updates. A Broadcast goes to
 * this segment scoped to one topic, so it reaches only that topic's readers.
 */
export const MAILING_LIST_SEGMENT = 'mailing list'

export type ListTerms = {
  /** The promise, verbatim from the page that collects the address. */
  promise: string
  /**
   * The Resend topic a Broadcast is scoped to, created with opt-out as its
   * default so it reaches only readers who joined it. `null` keeps the reader
   * out of the segment and every topic.
   */
  topic: string | null
}

export const LIST_TERMS: Readonly<Record<ListName, ListTerms>> = {
  // Reminder-only. The page promised one reminder a quarter "and nothing else,"
  // so these readers are contacts in no segment and no topic, and no Broadcast
  // can be addressed to them. The quarterly cron reads them from Postgres.
  'character-sheet': {
    promise: 'One reminder a quarter, with a blank copy attached. Nothing else.',
    topic: null,
  },
  succession: {
    promise: 'One update when there is something real to say. No sequence, no launch runway, and no seat being held.',
    topic: 'succession',
  },
  nonprofit: {
    promise:
      'I will write when the founding circle meets. No sequence, and no ask for money — that one stays closed until the paperwork clears.',
    topic: 'nonprofit founding circle',
  },
  introductions: {
    promise: 'Add me to your mailing list too.',
    topic: 'introductions',
  },
}

// ── Sources and sequences ────────────────────────────────────────────────────

/** Where a subscriber came in from. One per subscriber, set on first contact. */
export type LeadSource =
  | 'myths-read'
  | 'superpower'
  | 'character-sheet'
  | 'chapter-one'
  | 'kickstarter'
  /** Certification waitlist. Nothing is sold, so nothing is sequenced. */
  | 'succession'
  /** Founding circle for the in-formation org. Also unsequenced. */
  | 'nonprofit'

export const SOURCE_TAG_PREFIX = 'source:'

export function sourceTag(source: LeadSource): string {
  return `${SOURCE_TAG_PREFIX}${source}`
}

/**
 * Sources that never enter a sequence, no matter what else is true.
 *
 * The Kickstarter backers were promised roughly four broadcasts a year and no
 * funnel. Breaking that is not worth any conversion rate, so the exclusion is
 * a data structure rather than a code review comment.
 */
export const SOURCES_EXCLUDED_FROM_SEQUENCES: ReadonlySet<LeadSource> = new Set<LeadSource>([
  'kickstarter',
])

/**
 * No sequence runs today. The ruling of 2026-09-15 stopped applying
 * `sequence:welcome`, because no sequence emails exist and no form discloses
 * one. The rules below stay so that whatever sequence comes next inherits the
 * backer exclusion instead of rediscovering it.
 *
 * Tags that start an automation. Adding one of these to an existing
 * subscriber is what re-enters somebody into a sequence they already ran, so
 * these are added on first creation only.
 *
 * Retaking a quiz is normal and expected — Appendix H asks people to re-fill
 * the sheet every few months — so a retake updates the data tags and leaves
 * these alone.
 */
export const SEQUENCE_TRIGGER_TAGS: ReadonlySet<string> = new Set<string>([
  'sequence:welcome',
])

/** The tag that starts the one sequence this list has. */
export const WELCOME_SEQUENCE_TAG = 'sequence:welcome'

export type SequenceDecision = {
  /** Tags safe to apply to this subscriber right now. */
  tags: string[]
  /** Tags withheld, and the reason, so a caller can log the decision. */
  withheld: { tag: string; reason: 'excluded_source' | 'already_subscribed' }[]
}

/**
 * Decide which of `desiredTags` may actually be applied.
 *
 * Two rules, in this order:
 *   1. An excluded source never receives a sequence trigger. Checked against
 *      the tags being applied AND the tags already on the subscriber, because a
 *      backer who later takes a quiz is still a backer.
 *   2. An existing subscriber never receives a sequence trigger again.
 */
export function decideSequenceTags(input: {
  desiredTags: readonly string[]
  existingTags?: readonly string[]
  isNewSubscriber: boolean
}): SequenceDecision {
  const existing = new Set(input.existingTags ?? [])
  const excludedTags = new Set(
    [...SOURCES_EXCLUDED_FROM_SEQUENCES].map((source) => sourceTag(source)),
  )

  const isExcluded =
    [...excludedTags].some((tag) => existing.has(tag)) ||
    input.desiredTags.some((tag) => excludedTags.has(tag))

  const tags: string[] = []
  const withheld: SequenceDecision['withheld'] = []

  for (const tag of input.desiredTags) {
    if (!SEQUENCE_TRIGGER_TAGS.has(tag)) {
      tags.push(tag)
      continue
    }
    if (isExcluded) {
      withheld.push({ tag, reason: 'excluded_source' })
      continue
    }
    if (!input.isNewSubscriber) {
      withheld.push({ tag, reason: 'already_subscribed' })
      continue
    }
    tags.push(tag)
  }

  return { tags, withheld }
}

// ── Tag builders, one per surface ────────────────────────────────────────────

/**
 * `quiz:both` marks somebody who has taken the Myths Read and the Superpower
 * quiz. Chapter 9 argues the pair is more interesting than either alone, so it
 * is worth a tag rather than a report that has to join two tables.
 */
export function crossQuizTags(input: {
  desiredTags: readonly string[]
  existingTags: readonly string[]
}): string[] {
  const all = new Set([...input.existingTags, ...input.desiredTags])
  const hasMyths = all.has(sourceTag('myths-read'))
  const hasSuperpower = all.has(sourceTag('superpower'))
  return hasMyths && hasSuperpower ? ['quiz:both'] : []
}

export type MythsReadTagInput = {
  topMyth: string
  secondMyth?: string | null
  /** `Loud` | `Clear` | `Faint` from the read's own scoring. */
  strength?: string | null
}

export function buildMythsReadTags(input: MythsReadTagInput): string[] {
  const tags = [sourceTag('myths-read'), `myth:${input.topMyth}`, 'quiz:taken']
  if (input.strength) tags.push(`strength:${input.strength.toLowerCase()}`)
  return tags
}

export type SuperpowerTagInput = {
  /** The Face they lead with. */
  homeFace: string
  /**
   * The Face they avoid. Chapter 9 argues this is the more interesting datum,
   * so it is captured rather than inferred later from the ranking.
   */
  avoidedFace?: string | null
}

export function buildSuperpowerTags(input: SuperpowerTagInput): string[] {
  const tags = [sourceTag('superpower'), `face:${slugFace(input.homeFace)}`, 'quiz:taken']
  if (input.avoidedFace) tags.push(`avoids:${slugFace(input.avoidedFace)}`)
  return tags
}

function slugFace(face: string): string {
  return face.trim().toLowerCase().replace(/\s+/g, '-')
}
