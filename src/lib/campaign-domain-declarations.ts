/**
 * Campaigns that declare a domain of their own.
 *
 * WHY THIS FILE EXISTS. Three separate sites hardcoded `'GATHERING_RESOURCES'` guarded by `campaignRef ===
 * 'bruised-banana'` — a real, deliberate rule, but spelled identically to the silent-default bug we spent a day
 * hunting, and impossible for a reader (or a grep) to tell apart from it.
 *
 * So the fact is stated once, here, with its reason. Every site then reads `declaredDomainFor(campaignRef)`. That
 * makes the two cases visibly different:
 *
 *   - a DECLARED domain  -> comes from this table, with a named campaign and a stated reason
 *   - anything else      -> carries what the instance holds, or stops and asks a person
 *
 * There is still no third option. A campaign missing from this table has NOT declared a domain, and nothing may
 * invent one for it (Wendell, 2026-11-20: "a default here is exactly how Gather Resources silently became every
 * quest's answer").
 */
import { isDomainKey } from '@/lib/quest-grammar/domain-source'
import type { AllyshipDomainKey } from '@/lib/allyship-domains'

export interface DeclaredDomain {
  key: AllyshipDomainKey
  /** Why this campaign works in this domain. A reader must be able to check it, so it is stated, not assumed. */
  reason: string
}

/**
 * Campaigns whose domain is a property of the campaign itself rather than of a particular instance.
 *
 * `bruised-banana` is a Gather Resources campaign: its whole shape is raising and pooling resources, so every
 * quest it mints serves that domain whether or not its instance row happens to have been filled in.
 */
const DECLARED: Record<string, DeclaredDomain> = {
  'bruised-banana': {
    key: 'GATHERING_RESOURCES',
    reason: 'bruised-banana is a resource-pooling campaign; its quests gather by design, not by default',
  },
}

/** The domain a campaign declares for itself, or null when it declares none. Never invents one. */
export function declaredDomainFor(campaignRef: string | null | undefined): AllyshipDomainKey | null {
  if (!campaignRef) return null
  return DECLARED[campaignRef.trim()]?.key ?? null
}

/**
 * Pull `campaignRef` out of an untyped JSON blob (a CustomBar's contextJson, say) — string or null, never a guess.
 * Kept here so call sites do not each hand-roll a cast over `unknown`.
 */
export function campaignRefOf(context: unknown): string | null {
  if (context != null && typeof context === 'object' && 'campaignRef' in context) {
    const ref = (context as { campaignRef?: unknown }).campaignRef
    if (typeof ref === 'string' && ref.trim()) return ref.trim()
  }
  return null
}

/**
 * Resolve the domain a creating caller should carry: the instance's own if it is one of the four, else what the
 * campaign declares, else null (meaning: nothing to carry, ask a person).
 *
 * Validation is the point. An earlier version of this returned any non-empty string, so junk like 'NOT_A_DOMAIN'
 * passed through as though someone had chosen it — a silent default wearing a different coat. A carried value must
 * be one of the four keys or it is not a domain at all.
 *
 * This is the one place the two sources are combined, so no call site re-derives the precedence.
 */
export function resolveCarriedDomain(
  instanceDomain: string | null | undefined,
  campaignRef: string | null | undefined,
): AllyshipDomainKey | null {
  const fromInstance = (instanceDomain ?? '').trim()
  // isDomainKey is the single predicate for "is this one of the four". Re-deriving it here is how the object-vs-
  // string shape of ALLYSHIP_DOMAINS bit me once already.
  if (fromInstance && isDomainKey(fromInstance)) return fromInstance
  return declaredDomainFor(campaignRef)
}
