'use client'

import { useState, useCallback } from 'react'
import { StoryNode, StoryChoice, StoryProgress } from '../types'

export function useStoryNavigation(initialNode: StoryNode | null, initialProgress: StoryProgress | null) {
    const [currentNode, setCurrentNode] = useState<StoryNode | null>(initialNode)
    const [progress, setProgress] = useState<StoryProgress | null>(initialProgress)
    const [isLoading, setIsLoading] = useState(false)

    const navigateToNode = useCallback(async (nodeId: string) => {
        setIsLoading(true)
        try {
            // TODO: Fetch node from server
            const response = await fetch(`/api/guided-onboarding/node/${nodeId}`)
            const node: StoryNode = await response.json()
            setCurrentNode(node)

            // Update progress
            if (progress) {
                setProgress({
                    ...progress,
                    currentNodeId: nodeId,
                    lastActiveAt: new Date()
                })
            }
        } catch (error) {
            console.error('Failed to navigate to node:', error)
        } finally {
            setIsLoading(false)
        }
    }, [progress])

    const makeChoice = useCallback(async (choice: StoryChoice) => {
        if (!currentNode || !progress) return

        setIsLoading(true)
        try {
            // Record choice on server
            const response = await fetch('/api/guided-onboarding/choice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nodeId: currentNode.nodeId,
                    choiceId: choice.id,
                    rewards: choice.rewards
                })
            })

            const result = await response.json()

            // Update progress with rewards
            const newProgress: StoryProgress = {
                ...progress,
                completedNodes: [...progress.completedNodes, currentNode.nodeId],
                decisions: [
                    ...progress.decisions,
                    {
                        nodeId: currentNode.nodeId,
                        choiceId: choice.id,
                        timestamp: new Date()
                    }
                ],
                vibeulonsEarned: progress.vibeulonsEarned + (choice.rewards?.vibeulons || 0),
                lastActiveAt: new Date()
            }

            setProgress(newProgress)

            // Navigate to next node
            await navigateToNode(choice.nextNodeId)
        } catch (error) {
            console.error('Failed to make choice:', error)
            setIsLoading(false)
        }
    }, [currentNode, progress, navigateToNode])

    return {
        currentNode,
        progress,
        isLoading,
        navigateToNode,
        makeChoice
    }
}
