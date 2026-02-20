'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { StoryNode, StoryChoice, StoryProgress } from '../types'
import { StoryNodeComponent } from './StoryNode'
import { getStoryNode, recordStoryChoice, getOrientationHandbookEntry } from '@/actions/guided-onboarding'
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
    const [infoHandbook, setInfoHandbook] = useState<any | null>(null)
    const [infoLoading, setInfoLoading] = useState(false)

    useEffect(() => {
        if (!infoNode) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [infoNode])

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

    const submitChoice = (nodeId: string, choice: StoryChoice, input?: string) => {
        startTransition(async () => {
            setValidationError(null)
            const result = await recordStoryChoice(
                playerId,
                nodeId,
                choice.id,
                input,
                choice.rewards
            )

            if (!result.success) {
                setValidationError(result.error || 'Unable to continue. Please review your selections.')
                return
            }

            setInfoNode(null)
            setInfoHandbook(null)
            if (result.redirectTo) {
                router.push(result.redirectTo)
            } else if (choice.nextNodeId === 'dashboard') {
                router.push('/dashboard')
            } else {
                router.push(`/conclave/guided?step=${encodeURIComponent(choice.nextNodeId)}`)
            }
        })
    }

    const handleChoice = async (choice: StoryChoice, input?: string) => {
        if (!currentNode) return
        if (choice.id.startsWith('view_nation_') || choice.id.startsWith('view_playbook_')) {
            setInfoLoading(true)
            const isNation = choice.id.startsWith('view_nation_')
            const entityId = choice.id.replace(isNation ? 'view_nation_' : 'view_playbook_', '')
            const [node, handbook] = await Promise.all([
                getStoryNode(choice.nextNodeId, playerId),
                getOrientationHandbookEntry(isNation ? 'nation' : 'playbook', entityId)
            ])
            setInfoNode(node)
            setInfoHandbook('success' in handbook && handbook.success ? handbook.entry : null)
            setInfoLoading(false)
            return
        }
        submitChoice(currentNode.nodeId, choice, input)
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
                    <div className="max-w-2xl w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain">
                        <h3 className="text-xl font-bold text-white sticky top-0 z-10 bg-zinc-950 pb-2">{infoNode.title}</h3>
                        {infoHandbook ? (
                            <div className="space-y-4">
                                {infoNode.nodeId.startsWith('playbook_info_') && infoHandbook.content && (
                                    <article className="prose prose-invert prose-sm max-w-none rounded-xl border border-zinc-800 bg-black/30 p-4">
                                        <ReactMarkdown>{infoHandbook.content}</ReactMarkdown>
                                    </article>
                                )}
                                {infoNode.nodeId.startsWith('nation_info_') && infoHandbook.imgUrl && (
                                    <div className="w-full h-44 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900">
                                        <img src={infoHandbook.imgUrl} alt={infoHandbook.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                {infoHandbook.description && !(infoNode.nodeId.startsWith('playbook_info_') && infoHandbook.content) && (
                                    <p className="text-zinc-300 whitespace-pre-wrap text-sm">{infoHandbook.description}</p>
                                )}
                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${(infoNode.nodeId.startsWith('playbook_info_') && infoHandbook.content) ? 'hidden' : ''}`}>
                                    {infoHandbook.wakeUp && <div className="rounded-lg border border-zinc-800 bg-black/40 p-2 text-xs text-zinc-300"><span className="text-zinc-500 uppercase tracking-wider">Wake Up:</span> {infoHandbook.wakeUp}</div>}
                                    {infoHandbook.cleanUp && <div className="rounded-lg border border-zinc-800 bg-black/40 p-2 text-xs text-zinc-300"><span className="text-zinc-500 uppercase tracking-wider">Clean Up:</span> {infoHandbook.cleanUp}</div>}
                                    {infoHandbook.growUp && <div className="rounded-lg border border-zinc-800 bg-black/40 p-2 text-xs text-zinc-300"><span className="text-zinc-500 uppercase tracking-wider">Grow Up:</span> {infoHandbook.growUp}</div>}
                                    {infoHandbook.showUp && <div className="rounded-lg border border-zinc-800 bg-black/40 p-2 text-xs text-zinc-300"><span className="text-zinc-500 uppercase tracking-wider">Show Up:</span> {infoHandbook.showUp}</div>}
                                </div>
                            </div>
                        ) : (
                            <p className="text-zinc-300 whitespace-pre-wrap text-sm">{infoNode.content}</p>
                        )}
                        <div className="flex gap-2 justify-end sticky bottom-0 z-10 bg-zinc-950 border-t border-zinc-800 pt-3">
                            {infoNode.nodeId.startsWith('nation_info_') && (
                                <button onClick={() => {
                                    const choice = infoNode.choices.find(c => c.id.startsWith('confirm_nation_'))
                                    if (choice) submitChoice(infoNode.nodeId, choice)
                                }} disabled={isPending} className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm">
                                    Choose this nation
                                </button>
                            )}
                            {infoNode.nodeId.startsWith('playbook_info_') && (
                                <button onClick={() => {
                                    const choice = infoNode.choices.find(c => c.id.startsWith('confirm_playbook_'))
                                    if (choice) submitChoice(infoNode.nodeId, choice)
                                }} disabled={isPending} className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm">
                                    Choose this archetype
                                </button>
                            )}
                            <button onClick={() => { setInfoNode(null); setInfoHandbook(null) }} disabled={isPending || infoLoading} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
