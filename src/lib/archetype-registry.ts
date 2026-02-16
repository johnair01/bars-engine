type ArchetypeRecord = {
    id: string
    name: string
    description?: string | null
}

type ArchetypeRef = {
    id: string
    name: string
}

const LEGACY_ELEMENT_PATTERN = /Element:\s*([A-Za-z]+)/i

function normalizeToken(value: string) {
    return value.trim().toLowerCase()
}

export const TRIGRAM_TO_ARCHETYPE_NAME = {
    heaven: 'The Bold Heart',
    earth: 'The Devoted Guardian',
    thunder: 'The Decisive Storm',
    water: 'The Danger Walker',
    mountain: 'The Still Point',
    wind: 'The Subtle Influence',
    fire: 'The Truth Seer',
    lake: 'The Joyful Connector',
} as const

function toRef(record: ArchetypeRecord): ArchetypeRef {
    return { id: record.id, name: record.name }
}

export function buildArchetypeMapByTrigram(archetypes: ArchetypeRecord[]) {
    const byCanonicalName = new Map<string, ArchetypeRef>()
    const byLegacyElement = new Map<string, ArchetypeRef>()

    for (const archetype of archetypes) {
        byCanonicalName.set(normalizeToken(archetype.name), toRef(archetype))
        const match = archetype.description?.match(LEGACY_ELEMENT_PATTERN)
        if (match?.[1]) {
            const element = normalizeToken(match[1])
            if (!byLegacyElement.has(element)) {
                byLegacyElement.set(element, toRef(archetype))
            }
        }
    }

    const byTrigram = new Map<string, ArchetypeRef>()
    for (const [trigram, canonicalName] of Object.entries(TRIGRAM_TO_ARCHETYPE_NAME)) {
        const canonicalMatch = byCanonicalName.get(normalizeToken(canonicalName))
        const legacyMatch = byLegacyElement.get(trigram)
        const resolved = canonicalMatch || legacyMatch
        if (resolved) {
            byTrigram.set(trigram, resolved)
        }
    }

    return byTrigram
}

export function toTrigramArchetypeNameLookup(byTrigram: Map<string, ArchetypeRef>) {
    return Object.fromEntries(
        Array.from(byTrigram.entries()).map(([trigram, archetype]) => [trigram, archetype.name])
    ) as Record<string, string>
}
