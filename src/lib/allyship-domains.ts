/**
 * Allyship domains (WHERE the work happens).
 * Distinct from moves (personal throughput: Wake Up, Clean Up, Grow Up, Show Up).
 *
 * A domain is not tied to a wuxing element: all five elements can carry each of the four
 * domains (Wendell, 2026-11-20). See {@link ALL_ELEMENTS} and {@link domainGemVar}.
 * @see .specify/memory/conceptual-model.md
 */
export const ALLYSHIP_DOMAINS = [
  { key: 'GATHERING_RESOURCES', label: 'Gathering Resources', short: 'Resources' },
  { key: 'DIRECT_ACTION', label: 'Direct Action', short: 'Action' },
  { key: 'RAISE_AWARENESS', label: 'Raise Awareness', short: 'Awareness' },
  { key: 'SKILLFUL_ORGANIZING', label: 'Skillful Organizing', short: 'Organizing' },
] as const

export type AllyshipDomainKey = (typeof ALLYSHIP_DOMAINS)[number]['key']

export function getDomainLabel(domainKey: string | null): string {
  if (!domainKey) return ''
  const d = ALLYSHIP_DOMAINS.find((x) => x.key === domainKey)
  return d?.label ?? domainKey
}

/** Each allyship domain carries one Wuxing element (element = color, per UI_COVENANT). */
/**
 * The wuxing elements a domain may be read through.
 *
 * Wendell, 2026-11-20: "the domains shouldn't be mapped to an element. All 5 elements can
 * apply to each of the 4 domains." A domain says WHERE the work happens; an element says the
 * emotional channel it is moved in. Every one of the five can carry every one of the four, so
 * there is no fixed domain→element pairing to look up. Anything that needs "the element of a
 * domain" must be told which element, and pick its color from that.
 */
export const ALL_ELEMENTS = ['metal', 'water', 'wood', 'fire', 'earth'] as const

export type DomainElement = (typeof ALL_ELEMENTS)[number]

/**
 * The domain's element gem color as a CSS var (from bars-tokens.css). Covenant:
 * color derives from tokens, never a component-local palette or inline hex.
 *
 * The element is a required argument: no domain owns one. Callers that have no element
 * to hand should pass nothing and get undefined, not a guessed color.
 */
export function domainGemVar(
  domainKey: string | null | undefined,
  element?: DomainElement | null
): string | undefined {
  if (!domainKey || !element) return undefined
  return ALL_ELEMENTS.includes(element) ? `var(--bars-${element}-gem)` : undefined
}

export function parseCampaignDomainPreference(raw: string | null): string[] {
  if (!raw || raw.trim() === '') return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string')
    }
    return []
  } catch {
    return []
  }
}
