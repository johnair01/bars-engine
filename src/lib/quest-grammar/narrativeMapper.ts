import { PolarityRecord } from './polarityExtractor'
import {
    ParsedNarrative,
    WcgsStage,
    EmotionChannel
} from '@/lib/transformation-move-registry/types'

/**
 * Maps a BAR's polarity and charge to the narrative variables 
 * expected by the Transformation Move Registry.
 */
export function mapToNarrative(
    polarity: PolarityRecord,
    charge: EmotionChannel,
    options?: { actor?: string; mission?: string }
): ParsedNarrative {
    // Logic: The "state" is the tension itself.
    // The "object" is usually Pole A (the thing we are working on/with).
    // Some missions might pivot the object to Pole B (the goal).

    let object = polarity.poleA

    // If the mission is high-intensity/show-up, we might focus on the target state (Pole B)
    if (options?.mission?.toLowerCase().includes('action') || options?.mission?.toLowerCase().includes('show')) {
        object = polarity.poleB
    }

    return {
        raw_text: `${polarity.title}: ${polarity.tension}`,
        actor: options?.actor || 'you',
        state: polarity.tension,
        object: object
    }
}

/**
 * Suggests the best WAVE stage (Wake, Clean, Grow, Show) based on a Campaign Mission.
 */
export function getStageForMission(mission: string): WcgsStage {
    const m = mission.toLowerCase()
    if (m.includes('awareness') || m.includes('signal')) return 'wake_up'
    if (m.includes('clean') || m.includes('processing') || m.includes('blocker')) return 'clean_up'
    if (m.includes('organizing') || m.includes('perspective') || m.includes('growth')) return 'grow_up'
    if (m.includes('action') || m.includes('impact') || m.includes('show')) return 'show_up'

    return 'wake_up' // Default
}

/**
 * Filter move IDs based on the emotional charge and narrative context.
 */
export function filterMovesByCharge(
    moveIds: string[],
    charge: EmotionChannel
): string[] {
    // Simple heuristic: 
    // 'fear' prefers 'observe' (safe)
    // 'anger' prefers 'externalize' (discharge)
    // 'joy' prefers 'integrate' or 'experiment'

    if (charge === 'fear') return moveIds.filter(id => ['observe', 'name', 'feel'].includes(id))
    if (charge === 'anger') return moveIds.filter(id => ['externalize', 'invert', 'experiment'].includes(id))

    return moveIds
}
