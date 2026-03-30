import { AdventureTemplate } from '@prisma/client'
import { CmaStory, CmaNode, CmaEdge } from './types'
import { getMoveById, renderMovePrompt } from '@/lib/transformation-move-registry/services'
import { ParsedNarrative, EmotionChannel } from '@/lib/transformation-move-registry/types'

/**
 * Heuristic mapping from Coaster narrative tags to Canonical Transformation Moves.
 */
export function mapCoasterToMove(coasterTag: string, charge: EmotionChannel): string {
    const tag = coasterTag.toUpperCase()

    if (tag.includes('LIFT')) return 'observe'
    if (tag.includes('DROP')) return 'feel'
    if (tag.includes('TURN')) return 'reframe'
    if (tag.includes('INVERSION')) return 'invert'
    if (tag.includes('BRAKE')) return 'observe'
    if (tag.includes('STATION')) return 'integrate'

    // Charge-based adjustments
    if (charge === 'fear' && tag.includes('DROP')) return 'observe' // Scale back intensity
    if (charge === 'anger' && tag.includes('TURN')) return 'invert' // Direct confrontation

    return 'observe'
}

/**
 * Inflates a static AdventureTemplate into a dynamic CmaStory
 * using mission-aligned narrative variables and emotional charge.
 */
export function inflateTemplateToGraph(
    template: AdventureTemplate,
    narrative: ParsedNarrative,
    charge: EmotionChannel,
    options?: { mission?: string }
): CmaStory {
    // 1. Parse slots
    let passageSlots: any[] = []
    try {
        passageSlots = JSON.parse(template.passageSlots)
    } catch (e) {
        console.error('Failed to parse template passageSlots:', e)
    }

    // 2. Generate Nodes
    const nodes: CmaNode[] = passageSlots.map((slot: any) => {
        const moveId = mapCoasterToMove(slot.nodeId, charge)
        const move = getMoveById(moveId)

        // Render the prompt using the Charged Engine
        const renderedText = move
            ? renderMovePrompt(move, narrative, 0, { emotion_channel: charge })
            : 'Wait... something is shifting.'

        return {
            id: slot.nodeId,
            kind: 'scene',
            title: slot.label || slot.nodeId,
            metadata: {
                coasterTag: slot.nodeId,
                moveId: moveId,
                renderedText: renderedText,
                prompt: renderedText,
                mission: options?.mission
            }
        }
    })

    // 3. Sequential Edges (Baseline)
    const edges: CmaEdge[] = []
    for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
            id: `edge_${i}`,
            from: nodes[i].id,
            to: nodes[i + 1].id,
            label: 'Continue'
        })
    }

    return {
        startId: template.startNodeId,
        nodes,
        edges
    }
}

/**
 * Helper to apply "Lens-as-Branch" flavor to a choice edge.
 */
export function applyLensToChoice(edge: CmaEdge, lensId: string): CmaEdge {
    return {
        ...edge,
        label: `${edge.label || 'Next'} (${lensId})`,
        metadata: {
            ...(edge as any).metadata,
            gmId: lensId
        }
    }
}
