'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoryNode, StoryChoice, StoryProgress } from '../types'
import { StoryNodeComponent } from './StoryNode'
import { recordStoryChoice } from '@/actions/guided-onboarding'
import { ProgressTracker } from './ProgressTracker'

interface StoryReaderProps {
    initialNode: StoryNode | null
    playerId: string
    progress: StoryProgress
}

export function StoryReader({ initialNode, playerId, progress: initialProgress }: StoryReaderProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    // Use prop directly since we rely on router.refresh() to update content
    const currentNode = initialNode

    // Determine current step for progress tracker
    const getOnboardingStep = (category: string): any => {
        switch (category) {
            case 'intro': return 'intro'
            case 'identity': return 'identity'
            case 'nation': return 'nation_discovery'
            case 'playbook': return 'playbook_discovery'
            case 'transition': return 'finalization'
            default: return 'intro'
        }
    }

    const currentStep = currentNode ? getOnboardingStep(currentNode.category || 'intro') : 'intro'

    const handleChoice = async (choice: StoryChoice, input?: string) => {
        if (!currentNode) return

        startTransition(async () => {
            // 1. Record the choice via Server Action
            const result = await recordStoryChoice(
                playerId,
                currentNode.nodeId,
                choice.id,
                input,
                choice.rewards
            )

            if (!result.success) {
                console.error('Failed to record choice:', result.error)
                return
            }

            // 2. Handle Navigation
            if (choice.nextNodeId === 'dashboard') {
                // Special case for ending
                router.push('/dashboard')
            } else {
                // Refresh the route to fetch the next node from the server
                // Alternatively, we could fetch just the next node here, but refreshing keeps server as source of truth
                router.refresh()
            }
        })
    }

    if (!currentNode && !isPending) {
        return <div className="text-center text-white p-8">Loading story...</div>
    }

    if (!currentNode) {
        return null
    }

    return (
        <div className="space-y-8">
            <ProgressTracker
                currentStep={currentStep}
                vibeulonsEarned={initialProgress.vibeulonsEarned}
            />

            <StoryNodeComponent
                node={currentNode}
                onChoiceSelect={handleChoice}
                isLoading={isPending}
            />
        </div>
    )
}
