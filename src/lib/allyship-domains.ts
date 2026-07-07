/**
 * Allyship domains (WHERE the work happens).
 * Distinct from moves (personal throughput: Wake Up, Clean Up, Grow Up, Show Up).
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
const DOMAIN_ELEMENT: Record<AllyshipDomainKey, 'fire' | 'water' | 'wood' | 'metal' | 'earth'> = {
  GATHERING_RESOURCES: 'earth',
  DIRECT_ACTION: 'fire',
  RAISE_AWARENESS: 'metal',
  SKILLFUL_ORGANIZING: 'wood',
}

/**
 * The domain's element gem color as a CSS var (from bars-tokens.css). Covenant:
 * color derives from tokens, never a component-local palette or inline hex.
 */
export function domainGemVar(domainKey: string | null | undefined): string | undefined {
  if (!domainKey) return undefined
  const el = DOMAIN_ELEMENT[domainKey as AllyshipDomainKey]
  return el ? `var(--bars-${el}-gem)` : undefined
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
