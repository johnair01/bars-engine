/**
 * Allyship Myths — deterministic content for the /campaign/[ref]/begin funnel.
 * Spec: .specify/specs/campaign-lead-forge/spec.md
 *
 * A short myth-busting beat that gives a newcomer a truer frame of allyship
 * before they choose a domain. Authored copy, editable, no AI. Each myth pairs a
 * common misconception with a one-line truth and a reframe that points toward a
 * move. `domainHint` (optional) nudges the domain step when a myth resonates.
 *
 * EDIT ME: this is a starter set — revise the voice/copy freely. Keep ids stable
 * (they are captured on the lead as `mythsSeen`).
 */
import type { AllyshipDomainKey } from '@/lib/allyship-domains'

export interface AllyshipMyth {
  /** Stable id — persisted on the lead. Do not rename casually. */
  id: string
  /** The misconception, stated plainly (as the newcomer might hold it). */
  myth: string
  /** The correction, one honest line. */
  truth: string
  /** A forward-pointing reframe — turns the truth into a stance / next move. */
  reframe: string
  /** Optional domain this myth most naturally opens toward. */
  domainHint?: AllyshipDomainKey
}

export const ALLYSHIP_MYTHS: readonly AllyshipMyth[] = [
  {
    id: 'perfection',
    myth: 'I have to be perfectly informed before I can help.',
    truth: 'Waiting until you are perfect is how nothing gets done — allyship is a practice, not a credential.',
    reframe: 'Start where you are. One imperfect move, repeated, beats a perfect plan you never run.',
    domainHint: 'DIRECT_ACTION',
  },
  {
    id: 'saviour',
    myth: 'Being an ally means swooping in to fix things for people.',
    truth: 'Real allyship follows the lead of the people most affected — it amplifies, it does not overwrite.',
    reframe: 'Ask "what do you actually need?" before you act. Support the plan that already exists.',
    domainHint: 'SKILLFUL_ORGANIZING',
  },
  {
    id: 'loud',
    myth: 'If I am not loud and visible, I am not really helping.',
    truth: 'Awareness work and quiet resourcing both move the needle — different superpowers, same cause.',
    reframe: 'Play your position. A connector, a strategist, and a disruptor all win — differently.',
    domainHint: 'RAISE_AWARENESS',
  },
  {
    id: 'money',
    myth: 'Unless I can give a lot of money, my contribution does not count.',
    truth: 'Movements run on many small, steady inputs — time, skills, introductions, and yes, small gifts.',
    reframe: 'Gather what you can gather. Consistency compounds; a $5 habit outlasts a $500 impulse.',
    domainHint: 'GATHERING_RESOURCES',
  },
  {
    id: 'oneandone',
    myth: 'I did the thing once, so I am an ally now.',
    truth: 'Allyship is a verb — it is the next move, and the one after that, not a badge you earn once.',
    reframe: 'Treat it like training. Show up again tomorrow; let the streak, not the moment, define you.',
    domainHint: 'DIRECT_ACTION',
  },
] as const

export const ALLYSHIP_MYTH_IDS: readonly string[] = ALLYSHIP_MYTHS.map((m) => m.id)

export function getMythById(id: string): AllyshipMyth | undefined {
  return ALLYSHIP_MYTHS.find((m) => m.id === id)
}

/**
 * Ordered myths for the funnel. When a domain is already known, surface myths
 * that open toward it first (stable within-group order preserved).
 */
export function getMythsForDomain(domain?: AllyshipDomainKey | null): readonly AllyshipMyth[] {
  if (!domain) return ALLYSHIP_MYTHS
  const primary = ALLYSHIP_MYTHS.filter((m) => m.domainHint === domain)
  const rest = ALLYSHIP_MYTHS.filter((m) => m.domainHint !== domain)
  return [...primary, ...rest]
}
