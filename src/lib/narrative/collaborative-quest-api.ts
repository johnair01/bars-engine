import { getSpokeMoveBeds } from '@/actions/spoke-move-seeds'
import type { SpokeMoveBedMoveType } from '@/lib/spoke-move-beds'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

export { bridgeBranchWithBar, publishStoryForCollaboration } from '@/actions/collaborative-story'
export { plantKernelFromBar } from '@/actions/spoke-move-seeds'

export interface SpokeSeed {
    id: string
    title: string
    creatorId: string
    moveType: SpokeMoveBedMoveType
    isAnchor: boolean
    wateringProgress: { complete: number; total: number }
    face?: GameMasterFace
}

/**
 * 1. Get the "Seeds" (Kernels) for the current Spoke / Move Bed.
 * Used by the UI to render "Yes-And" choices.
 * This is a thin wrapper over the SMB beds to make it "vibecoder-friendly."
 */
export async function getSpokeSeeds(
    campaignRef: string,
    spokeIndex: number,
    moveType: SpokeMoveBedMoveType
): Promise<SpokeSeed[]> {
    const result = await getSpokeMoveBeds({ campaignRef, spokeIndex })
    if ('error' in result) return []

    // Ensure beds is an array and find the one matching the moveType
    const beds = result.beds as any[]
    const bed = beds.find((b) => b.moveType === moveType)
    if (!bed) return []

    const seeds: SpokeSeed[] = []

    // Add Anchor if it exists
    if (bed.anchorBarId) {
        seeds.push({
            id: bed.anchorBarId,
            title: bed.anchorTitle || 'Spoke Anchor',
            creatorId: 'system',
            moveType: bed.moveType,
            isAnchor: true,
            wateringProgress: { complete: 6, total: 6 },
        })
    }

    // Add Kernels
    for (const k of bed.kernels) {
        seeds.push({
            id: k.id,
            title: k.title,
            creatorId: k.creatorId,
            moveType: bed.moveType,
            isAnchor: false,
            wateringProgress: { complete: k.wateringComplete, total: k.wateringTotal },
        })
    }

    return seeds
}
