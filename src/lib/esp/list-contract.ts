/**
 * The list contract — what a tag means and who is allowed into a sequence.
 *
 * Kept pure and free of network calls on purpose. The promise this encodes is
 * one the project made to 371 people who paid money before there was a product,
 * and a promise enforced only inside an HTTP client is a promise nobody can
 * read or test. `kit.ts` does the talking; this file decides.
 *
 * Contract from the site handoff (docs/handoffs/HANDOFF_SITE_2026-08-10.md §T3).
 */

/** Where a subscriber came in from. One per subscriber, set on first contact. */
export type LeadSource =
  | 'myths-read'
  | 'superpower'
  | 'character-sheet'
  | 'chapter-one'
  | 'kickstarter'

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
 * Tags that start an automation in Kit. Adding one of these to an existing
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
