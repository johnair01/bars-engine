'use server'

import { dbBase as db } from '@/lib/db'
import { requirePlayer } from '@/lib/auth'
import { mapBlueprintToMetadata, type BarClassification } from '@/lib/cyoa/blueprint-prompt-library'

export type ArtifactProvenance = {
    id: string
    blueprintKey: string
    title: string
    description: string
    acquiredAt: Date
    classification: BarClassification
    runId: string
    storyName?: string
}

/**
 * Aggregates all artifacts earned by the player across all Twine runs.
 */
export async function getLibraryProvenance(): Promise<ArtifactProvenance[]> {
    const playerId = await requirePlayer()

    const runs = await db.twineRun.findMany({
        where: { playerId },
        include: { story: true },
        orderBy: { updatedAt: 'desc' }
    })

    const provenance: ArtifactProvenance[] = []

    for (const run of runs) {
        if (!run.cyoaState) continue

        try {
            const state = JSON.parse(run.cyoaState) as { artifactLedger?: any[] }
            if (state.artifactLedger && Array.isArray(state.artifactLedger)) {
                for (const artifact of state.artifactLedger) {
                    provenance.push({
                        id: `${run.id}-${artifact.blueprintKey}`,
                        blueprintKey: artifact.blueprintKey,
                        title: artifact.title || 'Untitled Artifact',
                        description: artifact.description || '',
                        acquiredAt: run.updatedAt,
                        classification: mapBlueprintToMetadata(artifact.blueprintKey),
                        runId: run.id,
                        storyName: run.story?.title
                    })
                }
            }
        } catch (e) {
            console.error(`Error parsing cyoaState for run ${run.id}:`, e)
        }
    }

    return provenance
}
