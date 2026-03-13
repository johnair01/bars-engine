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
