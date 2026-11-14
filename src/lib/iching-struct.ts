
export type Trigram = 'Heaven' | 'Earth' | 'Thunder' | 'Water' | 'Mountain' | 'Wind' | 'Fire' | 'Lake'

export const TRIGRAMS: Trigram[] = ['Heaven', 'Earth', 'Thunder', 'Water', 'Mountain', 'Wind', 'Fire', 'Lake']

export type HexagramIntegrityResult = {
    hexagram: number
    upperTrigram: Trigram
    lowerTrigram: Trigram
    upperArchetype: string | null
    lowerArchetype: string | null
    valid: boolean
    errors: string[]
}

interface HexagramStruct {
    upper: Trigram
    lower: Trigram
}

// The King Wen table for all 64 hexagrams: upper and lower trigram. Generated from
// public/between/iching/hexagrams.json (the coin table's table, checked line by line against the trigrams);
// src/lib/__tests__/iching-struct.test.ts keeps the two in step. Until 2026-11-07 only ten entries were filled and
// a binary fallback guessed the rest, which was wrong for 54 of 64 (council position ic2-hexagram-table).
export const HEXAGRAM_STRUCTURE: Record<number, HexagramStruct> = {
    1: { upper: 'Heaven', lower: 'Heaven' },
    2: { upper: 'Earth', lower: 'Earth' },
    3: { upper: 'Water', lower: 'Thunder' },
    4: { upper: 'Mountain', lower: 'Water' },
    5: { upper: 'Water', lower: 'Heaven' },
    6: { upper: 'Heaven', lower: 'Water' },
    7: { upper: 'Earth', lower: 'Water' },
    8: { upper: 'Water', lower: 'Earth' },
    9: { upper: 'Wind', lower: 'Heaven' },
    10: { upper: 'Heaven', lower: 'Lake' },
    11: { upper: 'Earth', lower: 'Heaven' },
    12: { upper: 'Heaven', lower: 'Earth' },
    13: { upper: 'Heaven', lower: 'Fire' },
    14: { upper: 'Fire', lower: 'Heaven' },
    15: { upper: 'Earth', lower: 'Mountain' },
    16: { upper: 'Thunder', lower: 'Earth' },
    17: { upper: 'Lake', lower: 'Thunder' },
    18: { upper: 'Mountain', lower: 'Wind' },
    19: { upper: 'Earth', lower: 'Lake' },
    20: { upper: 'Wind', lower: 'Earth' },
    21: { upper: 'Fire', lower: 'Thunder' },
    22: { upper: 'Mountain', lower: 'Fire' },
    23: { upper: 'Mountain', lower: 'Earth' },
    24: { upper: 'Earth', lower: 'Thunder' },
    25: { upper: 'Heaven', lower: 'Thunder' },
    26: { upper: 'Mountain', lower: 'Heaven' },
    27: { upper: 'Mountain', lower: 'Thunder' },
    28: { upper: 'Lake', lower: 'Wind' },
    29: { upper: 'Water', lower: 'Water' },
    30: { upper: 'Fire', lower: 'Fire' },
    31: { upper: 'Lake', lower: 'Mountain' },
    32: { upper: 'Thunder', lower: 'Wind' },
    33: { upper: 'Heaven', lower: 'Mountain' },
    34: { upper: 'Thunder', lower: 'Heaven' },
    35: { upper: 'Fire', lower: 'Earth' },
    36: { upper: 'Earth', lower: 'Fire' },
    37: { upper: 'Wind', lower: 'Fire' },
    38: { upper: 'Fire', lower: 'Lake' },
    39: { upper: 'Water', lower: 'Mountain' },
    40: { upper: 'Thunder', lower: 'Water' },
    41: { upper: 'Mountain', lower: 'Lake' },
    42: { upper: 'Wind', lower: 'Thunder' },
    43: { upper: 'Lake', lower: 'Heaven' },
    44: { upper: 'Heaven', lower: 'Wind' },
    45: { upper: 'Lake', lower: 'Earth' },
    46: { upper: 'Earth', lower: 'Wind' },
    47: { upper: 'Lake', lower: 'Water' },
    48: { upper: 'Water', lower: 'Wind' },
    49: { upper: 'Lake', lower: 'Fire' },
    50: { upper: 'Fire', lower: 'Wind' },
    51: { upper: 'Thunder', lower: 'Thunder' },
    52: { upper: 'Mountain', lower: 'Mountain' },
    53: { upper: 'Wind', lower: 'Mountain' },
    54: { upper: 'Thunder', lower: 'Lake' },
    55: { upper: 'Thunder', lower: 'Fire' },
    56: { upper: 'Fire', lower: 'Mountain' },
    57: { upper: 'Wind', lower: 'Wind' },
    58: { upper: 'Lake', lower: 'Lake' },
    59: { upper: 'Wind', lower: 'Water' },
    60: { upper: 'Water', lower: 'Lake' },
    61: { upper: 'Wind', lower: 'Lake' },
    62: { upper: 'Thunder', lower: 'Mountain' },
    63: { upper: 'Water', lower: 'Fire' },
    64: { upper: 'Fire', lower: 'Water' },
}

export function getHexagramStructure(id: number): HexagramStruct {
    const s = HEXAGRAM_STRUCTURE[id]
    if (s) return s
    // Out of range (0, 65, a stray id): wrap into 1 to 64 so callers keep getting a real hexagram, as the old
    // fallback always returned something.
    const k = Number.isFinite(id) ? Math.trunc(id) : 1
    const n = (((k - 1) % 64) + 64) % 64 + 1
    return HEXAGRAM_STRUCTURE[n]
}

const SPOT_CHECKS: Partial<Record<number, {
    upperTrigram: Trigram
    lowerTrigram: Trigram
    upperArchetype: string
    lowerArchetype: string
}>> = {
    20: {
        upperTrigram: 'Wind',
        lowerTrigram: 'Earth',
        upperArchetype: 'The Subtle Influence',
        lowerArchetype: 'The Devoted Guardian',
    },
    15: {
        upperTrigram: 'Earth',
        lowerTrigram: 'Mountain',
        upperArchetype: 'The Devoted Guardian',
        lowerArchetype: 'The Still Point',
    },
}

export function verifyHexagramIntegrity(
    hexagramNumber: number,
    trigramToArchetype: Record<string, string> = {}
): HexagramIntegrityResult {
    const structure = getHexagramStructure(hexagramNumber)
    const upperTrigram = structure.upper
    const lowerTrigram = structure.lower
    const upperArchetype = trigramToArchetype[upperTrigram.toLowerCase()] || null
    const lowerArchetype = trigramToArchetype[lowerTrigram.toLowerCase()] || null
    const errors: string[] = []

    if (!upperArchetype) {
        errors.push(`Missing archetype mapping for upper trigram "${upperTrigram}"`)
    }
    if (!lowerArchetype) {
        errors.push(`Missing archetype mapping for lower trigram "${lowerTrigram}"`)
    }

    if (
        upperTrigram !== lowerTrigram &&
        upperArchetype &&
        lowerArchetype &&
        upperArchetype.toLowerCase() === lowerArchetype.toLowerCase()
    ) {
        errors.push(
            `Distinct trigrams map to same archetype ("${upperTrigram}" and "${lowerTrigram}" -> "${upperArchetype}")`
        )
    }

    const expected = SPOT_CHECKS[hexagramNumber]
    if (expected) {
        if (upperTrigram !== expected.upperTrigram || lowerTrigram !== expected.lowerTrigram) {
            errors.push(
                `Hexagram ${hexagramNumber} expected ${expected.upperTrigram} over ${expected.lowerTrigram}, got ${upperTrigram} over ${lowerTrigram}`
            )
        }
        if (upperArchetype && upperArchetype !== expected.upperArchetype) {
            errors.push(
                `Hexagram ${hexagramNumber} upper trigram archetype expected "${expected.upperArchetype}", got "${upperArchetype}"`
            )
        }
        if (lowerArchetype && lowerArchetype !== expected.lowerArchetype) {
            errors.push(
                `Hexagram ${hexagramNumber} lower trigram archetype expected "${expected.lowerArchetype}", got "${lowerArchetype}"`
            )
        }
    }

    return {
        hexagram: hexagramNumber,
        upperTrigram,
        lowerTrigram,
        upperArchetype,
        lowerArchetype,
        valid: errors.length === 0,
        errors,
    }
}
