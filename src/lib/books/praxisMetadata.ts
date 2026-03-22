/**
 * Book praxis pillar metadata — stored inside Book.metadataJson.
 * Spec: .specify/specs/library-praxis-three-pillars/metadata-shape.md
 */

export type PraxisPillarId = 'antifragile' | 'commons_networks' | 'felt_sense'

export const PRAXIS_PILLAR_LABELS: Record<PraxisPillarId, string> = {
  antifragile: 'Antifragile',
  commons_networks: 'Commons / Networks',
  felt_sense: 'Felt Sense',
}

export const PRAXIS_PILLAR_COLORS: Record<PraxisPillarId, string> = {
  antifragile: 'text-orange-400 border-orange-800/50 bg-orange-950/20',
  commons_networks: 'text-sky-400 border-sky-800/50 bg-sky-950/20',
  felt_sense: 'text-violet-400 border-violet-800/50 bg-violet-950/20',
}

export interface BookPraxisMetadata {
  praxisPillar?: PraxisPillarId
  /** Short admin-facing summary of why this book is in the library */
  designIntentSummary?: string
  /** Provenance note, e.g. strand consult origin */
  strandNote?: string
  /** Wiki slugs to link when player library is exposed */
  relatedWikiSlugs?: string[]
}

/**
 * Parse praxis fields out of a book's metadataJson string.
 * Returns undefined rather than throwing if JSON is malformed.
 */
export function parsePraxisMetadata(metadataJson: string | null | undefined): BookPraxisMetadata {
  if (!metadataJson) return {}
  try {
    const parsed = JSON.parse(metadataJson) as Record<string, unknown>
    return {
      praxisPillar: isValidPillar(parsed.praxisPillar) ? parsed.praxisPillar : undefined,
      designIntentSummary:
        typeof parsed.designIntentSummary === 'string' ? parsed.designIntentSummary : undefined,
      strandNote: typeof parsed.strandNote === 'string' ? parsed.strandNote : undefined,
      relatedWikiSlugs: Array.isArray(parsed.relatedWikiSlugs)
        ? (parsed.relatedWikiSlugs as string[]).filter((s) => typeof s === 'string')
        : undefined,
    }
  } catch {
    return {}
  }
}

function isValidPillar(val: unknown): val is PraxisPillarId {
  return val === 'antifragile' || val === 'commons_networks' || val === 'felt_sense'
}

/**
 * Merge praxis fields into an existing metadataJson string without wiping other keys.
 */
export function mergePraxisMetadata(
  existingJson: string | null | undefined,
  updates: BookPraxisMetadata
): string {
  let base: Record<string, unknown> = {}
  try {
    if (existingJson) base = JSON.parse(existingJson) as Record<string, unknown>
  } catch {
    base = {}
  }
  return JSON.stringify({ ...base, ...updates })
}
