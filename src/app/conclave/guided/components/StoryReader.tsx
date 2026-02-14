'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { StoryNode, StoryChoice, StoryProgress } from '../types'
import { StoryNodeComponent } from './StoryNode'
import { getStoryNode, recordStoryChoice } from '@/actions/guided-onboarding'
import { ProgressTracker } from './ProgressTracker'

interface StoryReaderProps {
    initialNode: StoryNode | null
    playerId: string
    progress: StoryProgress
}

export function StoryReader({ initialNode, playerId, progress: initialProgress }: StoryReaderProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [validationError, setValidationError] = useState<string | null>(null)
    const [infoNode, setInfoNode] = useState<StoryNode | null>(null)
    const [infoLoading, setInfoLoading] = useState(false)

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
        if (choice.id.startsWith('view_nation_') || choice.id.startsWith('view_playbook_')) {
            setInfoLoading(true)
            const node = await getStoryNode(choice.nextNodeId, playerId)
            setInfoNode(node)
            setInfoLoading(false)
            return
        }

        startTransition(async () => {
            setValidationError(null)
            // 1. Record the choice via Server Action
            const result = await recordStoryChoice(
                playerId,
                currentNode.nodeId,
                choice.id,
                input,
                choice.rewards
            )

            if (!result.success) {
                setValidationError(result.error || 'Unable to continue. Please review your selections.')
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
            {validationError && (
                <div className="max-w-3xl mx-auto rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
                    {validationError}
                </div>
            )}
            {infoNode && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">{infoNode.title}</h3>
                        <p className="text-zinc-300 whitespace-pre-wrap text-sm">{infoNode.content}</p>
                        <div className="flex gap-2 justify-end">
                            {infoNode.nodeId.startsWith('nation_info_') && (
                                <button onClick={() => handleChoice({ id: `confirm_nation_${infoNode.nodeId.replace('nation_info_', '')}`, text: '', nextNodeId: 'playbook_select', rewards: { unlocks: [`nation:${infoNode.nodeId.replace('nation_info_', '')}`] } })} disabled={isPending} className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm">
                                    Choose this nation
                                </button>
                            )}
                            {infoNode.nodeId.startsWith('playbook_info_') && (
                                <button onClick={() => handleChoice({ id: `confirm_playbook_${infoNode.nodeId.replace('playbook_info_', '')}`, text: '', nextNodeId: 'conclusion', rewards: { unlocks: [`playbook:${infoNode.nodeId.replace('playbook_info_', '')}`] } })} disabled={isPending} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm">
                                    Choose this archetype
                                </button>
                            )}
                            <button onClick={() => setInfoNode(null)} disabled={isPending || infoLoading} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
