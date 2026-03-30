import fs from 'fs'
import path from 'path'

export interface PolarityRecord {
    id: string
    title: string
    polarity: string // A ↔ B
    poleA: string
    poleB: string
    tension: string
    shadowA?: string
    shadowB?: string
    whyItMatters?: string
    isTwoSided?: boolean
}

const REGISTRY_PATH = path.join(process.cwd(), '.specify/specs/player-facing-cyoa-generator/conceptual/bars_registry_v0_reconstructed.md')

/**
 * Parses the BAR registry markdown file into an array of PolarityRecord objects.
 */
export function parseRegistry(): PolarityRecord[] {
    try {
        const content = fs.readFileSync(REGISTRY_PATH, 'utf-8')
        const records: PolarityRecord[] = []

        // Split by ### [Number]. [Title]
        const sections = content.split(/### \d+\. /)

        for (let i = 1; i < sections.length; i++) {
            const section = sections[i]
            const lines = section.split('\n')
            const titleLine = lines[0].trim()

            const record: Partial<PolarityRecord> = {
                title: titleLine,
                isTwoSided: titleLine.includes(' ↔ ')
            }

            // Parse fields
            for (const line of lines) {
                if (line.includes('**Polarity:**')) {
                    record.polarity = line.split('**Polarity:**')[1].trim()
                    const parts = record.polarity.split(' ↔ ')
                    record.poleA = parts[0]?.trim()
                    record.poleB = parts[1]?.trim()
                } else if (line.includes('**Tension:**')) {
                    record.tension = line.split('**Tension:**')[1].trim()
                } else if (line.includes('**Shadow (')) {
                    // Extract pole name for shadow identification
                    const match = line.match(/\*\*Shadow \(([^)]+)\):\*\*\s*(.*)/)
                    if (match) {
                        const pole = match[1]
                        const shadowText = match[2]
                        if (record.poleA && pole.toLowerCase().includes(record.poleA.toLowerCase())) {
                            record.shadowA = shadowText
                        } else {
                            record.shadowB = shadowText
                        }
                    }
                } else if (line.includes('**Why it matters:**')) {
                    record.whyItMatters = line.split('**Why it matters:**')[1].trim()
                }
            }

            if (record.title && record.polarity) {
                records.push(record as PolarityRecord)
            }
        }

        return records
    } catch (error) {
        console.error('Error parsing BAR registry:', error)
        return []
    }
}

/**
 * Deterministically extracts polarity for a given BAR title.
 * Fallback to descriptive fuzzy matching if needed.
 */
export function extractPolarityDeterministic(barTitle: string): PolarityRecord | null {
    const registry = parseRegistry()
    const cleanSource = barTitle.toLowerCase().trim()

    // 1. Exact Match
    const exact = registry.find(r => r.title.toLowerCase() === cleanSource)
    if (exact) return exact

    // 2. Contains Match (e.g. "Romance Fog" matches "### 6. Romance Fog")
    const contains = registry.find(r => r.title.toLowerCase().includes(cleanSource) || cleanSource.includes(r.title.toLowerCase()))
    if (contains) return contains

    // 3. Normalized Match (removing special chars)
    const normalize = (s: string) => s.replace(/[^\w\s]/g, '').toLowerCase().trim()
    const normalizedSource = normalize(barTitle)
    const normalizedMatch = registry.find(r => normalize(r.title) === normalizedSource)

    return normalizedMatch || null
}

/**
 * Maps a PolarityRecord to Narrative Variables for the Transformation Move Registry.
 */
export function mapPolarityToNarrative(record: PolarityRecord, options?: { actor?: string }) {
    return {
        actor: options?.actor || 'you',
        state: record.tension,
        object: record.poleA // Default to Pole A as the object of engagement
    }
}
