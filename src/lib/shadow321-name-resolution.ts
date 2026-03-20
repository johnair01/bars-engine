/**
 * Shadow name resolution for 321 sessions (Phase 6 — persist on Shadow321Session).
 * See .specify/specs/321-suggest-name/spec.md
 */

export type Shadow321NameResolutionKind = 'suggested_accepted' | 'edited' | 'typed_no_suggest'

export type Shadow321NameFields = {
  finalShadowName: string
  nameResolution: Shadow321NameResolutionKind
  suggestionCount: number
}

/**
 * @param maskName — Current name in the "Give it a name" field (final choice).
 * @param lastSuggestedName — Value last produced by "Suggest name", or null if never clicked.
 * @param suggestionClickCount — Number of times the user clicked "Suggest name" for this charge/mask
 *   (e.g. Shadow321Runner's `suggestionAttemptRef` after clicks; 0 = never suggested).
 */
export function computeShadow321NameFields(
  maskName: string,
  lastSuggestedName: string | null,
  suggestionClickCount: number
): Shadow321NameFields | undefined {
  const finalShadowName = maskName.trim()
  if (!finalShadowName) return undefined

  const suggestionCount = Math.max(0, Math.floor(suggestionClickCount))

  let nameResolution: Shadow321NameResolutionKind
  if (suggestionCount === 0) {
    nameResolution = 'typed_no_suggest'
  } else if (lastSuggestedName !== null && finalShadowName === lastSuggestedName.trim()) {
    nameResolution = 'suggested_accepted'
  } else {
    nameResolution = 'edited'
  }

  return { finalShadowName, nameResolution, suggestionCount }
}
