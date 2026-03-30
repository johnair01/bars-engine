'use client'

import { useState, useCallback, useMemo } from 'react'
import { getSpokeSeeds, bridgeBranchWithBar, plantKernelFromBar } from '@/lib/narrative/collaborative-quest-api'
import type { SpokeSeed } from '@/lib/narrative/collaborative-quest-api'
import type { PersonalMoveType } from '@/lib/quest-grammar/types'

/**
 * useSpokeQuest Hook
 * 
 * Provides "vibecoders" with a clean interface for handling collaborative seeds
 * and branching within the PassageRenderer or other adventure components.
 */
export function useSpokeQuest(params: {
    runId: string
    campaignRef?: string
    spokeIndex?: number
}) {
    const { runId, campaignRef, spokeIndex } = params

    const [seeds, setSeeds] = useState<SpokeSeed[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch seeds for a specific move type (e.g. 'wakeUp')
    const fetchSeedsForMove = useCallback(async (moveType: PersonalMoveType) => {
        if (!campaignRef || spokeIndex === undefined) return

        setIsLoading(true)
        setError(null)

        try {
            const data = await getSpokeSeeds(campaignRef, spokeIndex, moveType)
            setSeeds(data)
        } catch (e) {
            setError('Failed to fetch seeds')
        } finally {
            setIsLoading(false)
        }
    }, [campaignRef, spokeIndex])

    // Handle the "Yes-And" branch click
    const handleYesAnd = useCallback(async (nodeId: string, barId: string, isNewSeed?: boolean, moveType?: PersonalMoveType) => {
        setIsLoading(true)
        setError(null)

        try {
            // If they picked their own BAR, plant it in the Nursery
            if (isNewSeed && campaignRef && spokeIndex !== undefined && moveType) {
                const plantResult = await plantKernelFromBar({
                    campaignRef,
                    spokeIndex,
                    moveType,
                    barId,
                    intent: 'additional',
                })
                
                if ('error' in plantResult) {
                     console.warn('Failed to plant seed:', plantResult.error)
                     // Decide whether to fail the whole branching operation, 
                     // or just continue branching without the plant succeeding.
                     // We'll let it continue branching since the branch works even if planting fails. 
                }
            }

            const result = await bridgeBranchWithBar({
                parentRunId: runId,
                nodeId,
                barId
            })

            if ('error' in result) {
                setError(result.error || 'Branching failed')
                return null
            }

            return result.runId
        } catch (e) {
            setError('Unexpected error during branching')
            return null
        } finally {
            setIsLoading(false)
        }
    }, [runId])

    return {
        seeds,
        isLoading,
        error,
        fetchSeedsForMove,
        handleYesAnd
    }
}
