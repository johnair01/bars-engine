export const NATION_AFFINITIES: Record<string, string[]> = {
    'Argyra': ['Heaven', 'Wind'],
    'Pyrakanth': ['Fire', 'Thunder'],
    'Virelune': ['Water', 'Lake'],
    'Meridia': ['Lake', 'Heaven'], // Trade/Clarity
    'Lamenth': ['Mountain', 'Earth'],
}

export const ELEMENTAL_MOVES: Record<string, { affinity: string; description: string; icon: string }> = {
    'Silver Mirror': { affinity: 'Heaven', description: 'Reflect the true nature of a situation.', icon: '🪞' },
    'Solar Flare': { affinity: 'Fire', description: 'Blind the opposition with overwhelming truth.', icon: '☀️' },
    'Tidal Wave': { affinity: 'Water', description: 'Wash away obstacles with an emotional surge.', icon: '🌊' },
    'Golden Bridge': { affinity: 'Lake', description: 'Create a connection where none existed.', icon: '🌉' },
    'Stone Wall': { affinity: 'Mountain', description: 'Block all incoming interference.', icon: '🧱' },
}

export function hasAffinity(nationName: string, affinity: string): boolean {
    const affinities = NATION_AFFINITIES[nationName]
    return affinities ? affinities.includes(affinity) : false
}
