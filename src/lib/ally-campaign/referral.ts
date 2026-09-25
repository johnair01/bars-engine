/**
 * Ally referral attribution — the chain that turns "I told some people" into a
 * number on the board.
 *
 * The whole path, because it crosses four boundaries and each one can drop the
 * value silently:
 *
 *   1. An ally shares `/launch?ally=<leadId>#book-digital`.
 *   2. `AllyReferralCapture` (client) reads the param and stores it in a
 *      FIRST-TOUCH cookie. First touch, not last: the person who did the work of
 *      getting someone to look is the one who earned it, and a later visit
 *      through a different link shouldn't quietly reassign the credit.
 *   3. Outbound Gumroad links are decorated with the same parameter, so Gumroad
 *      echoes it back in the sale ping as `url_params[ally]`. This is the only
 *      hop we do not control, and it is why the value has to survive a round
 *      trip through a third party rather than living in our session.
 *   4. The webhook validates the id against a real `CampaignLead` and writes it
 *      into `RedemptionCode.metadata`, which is keyed one-per-sale and already
 *      idempotent on `externalOrderId`.
 *
 * No schema change: `metadata` is an existing nullable column, and attribution
 * is additive JSON inside it.
 *
 * Deliberately NOT a security boundary. A lead id here is a claim about where a
 * sale came from, not an authorisation to do anything, so a forged value costs
 * the campaign a wrong number and nothing else. It is validated against real
 * leads to keep the board honest, not to keep anyone out.
 */

/** Query parameter an ally's link carries. Also the key Gumroad echoes back. */
export const ALLY_PARAM = 'ally'

/** First-touch cookie. Not httpOnly — the client sets it and nothing secret is in it. */
export const ALLY_COOKIE = 'mtgoa_ally'

/** How long a referral stays credited to the ally who earned it. */
export const ALLY_COOKIE_DAYS = 60

/**
 * Lead ids are cuids. Validating shape before anything touches the database
 * keeps a hostile query string from reaching a lookup at all.
 */
const LEAD_ID_RE = /^[a-z0-9]{20,40}$/i

export function isPlausibleLeadId(value: string | null | undefined): value is string {
  return typeof value === 'string' && LEAD_ID_RE.test(value)
}

/** Pull a valid ally id out of a query string, or null. */
export function readAllyParam(search: string | URLSearchParams): string | null {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search
  const raw = params.get(ALLY_PARAM)
  return isPlausibleLeadId(raw) ? raw : null
}

/**
 * Add the ally parameter to an outbound URL, preserving whatever is already
 * there. Returns the url untouched when there's nothing to attribute or the
 * value is malformed — a broken link is worse than a missing attribution.
 */
export function withAllyParam(url: string, allyId: string | null | undefined): string {
  if (!isPlausibleLeadId(allyId)) return url
  // An empty href means the offer isn't purchasable yet (`gumroadUrl` defaults
  // to ''). Resolving it against the parse base would silently turn a dead CTA
  // into a link to the site root, which is worse than leaving it dead.
  if (!url.trim()) return url
  try {
    // Relative urls need a base to parse; the base is discarded on the way out.
    const isAbsolute = /^https?:\/\//i.test(url)
    const parsed = new URL(url, isAbsolute ? undefined : 'https://placeholder.invalid')
    parsed.searchParams.set(ALLY_PARAM, allyId)
    return isAbsolute ? parsed.toString() : `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return url
  }
}

// ── The Gumroad round trip ──────────────────────────────────────────────────

/**
 * Keys a Gumroad sale ping might use for a URL parameter.
 *
 * Gumroad nests these as `url_params[ally]` in the form body, but the exact
 * shape has varied and is not ours to control, so every plausible spelling is
 * tried rather than trusting one and losing attribution silently if it changes.
 */
export const GUMROAD_ALLY_KEYS: readonly string[] = [
  `url_params[${ALLY_PARAM}]`,
  ALLY_PARAM,
  `custom_fields[${ALLY_PARAM}]`,
  `variants[${ALLY_PARAM}]`,
] as const

/** Find the ally id in a Gumroad ping, whichever key it arrived under. */
export function allyFromGumroadPing(get: (key: string) => string | null): string | null {
  for (const key of GUMROAD_ALLY_KEYS) {
    const value = get(key)
    if (isPlausibleLeadId(value)) return value
  }
  return null
}

// ── What we store on the sale ───────────────────────────────────────────────

export interface ReferralMetadata {
  /** The `CampaignLead` id credited with this sale. */
  allyLeadId: string
  /** ISO timestamp of attribution — when the sale landed, not when they shared. */
  attributedAt: string
}

/**
 * Merge attribution into an existing metadata string without destroying it.
 *
 * `RedemptionCode.metadata` is a shared, free-form column that other features
 * may already be using, so this parses-merges-restringifies rather than
 * overwriting, and gives up rather than clobbering if the existing value isn't
 * an object.
 */
export function mergeReferralMetadata(
  existing: string | null | undefined,
  referral: ReferralMetadata,
): string {
  let base: Record<string, unknown> = {}
  if (existing && existing.trim()) {
    try {
      const parsed = JSON.parse(existing)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        base = parsed as Record<string, unknown>
      }
    } catch {
      // Unparseable prior value — keep it under a key rather than losing it.
      base = { previous: existing }
    }
  }
  return JSON.stringify({ ...base, referral })
}

/** Read attribution back out of a metadata string, if present and well-formed. */
export function readReferralMetadata(existing: string | null | undefined): ReferralMetadata | null {
  if (!existing || !existing.trim()) return null
  try {
    const parsed = JSON.parse(existing) as { referral?: unknown }
    const referral = parsed?.referral as ReferralMetadata | undefined
    if (referral && isPlausibleLeadId(referral.allyLeadId)) return referral
    return null
  } catch {
    return null
  }
}

/**
 * Substring that matches an attributed sale in a `metadata LIKE` query.
 *
 * Postgres JSON operators would be cleaner, but `metadata` is a plain `String?`
 * column, so a LIKE against the serialized shape is what is available without a
 * migration. Kept beside the writer so the two can't drift.
 */
export function metadataMatchFor(leadId: string): string {
  return `"allyLeadId":"${leadId}"`
}
