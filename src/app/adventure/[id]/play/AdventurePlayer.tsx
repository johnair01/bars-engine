'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useRouter } from 'next/navigation'
import { completeQuest } from '@/actions/quest-engine'
import { chunkIntoSlides } from '@/lib/slide-chunker'

interface Choice {
  text: string
  targetId: string
}

interface Node {
  id: string
  text: string
  choices: Choice[]
  linkedQuestId?: string
  isCompletionPassage?: boolean
}

interface Props {
  adventureSlug: string
  startNodeId: string
  questId?: string
  threadId?: string
  isRitual?: boolean
}

export function AdventurePlayer({
  adventureSlug,
  startNodeId,
  questId,
  threadId,
  isRitual,
}: Props) {
  const [currentNode, setCurrentNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [completing, setCompleting] = useState(false)
  const router = useRouter()

  const fetchNode = async (nodeId: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/adventures/${adventureSlug}/${nodeId}`)
      if (!res.ok) {
        setError('Could not load this step.')
        return
      }
      const node = (await res.json()) as Node
      setCurrentNode(node)
      setSlideIndex(0)

      // Check: completion passage with matching quest → complete
      if (
        node.isCompletionPassage &&
        node.linkedQuestId &&
        questId &&
        node.linkedQuestId === questId
      ) {
        setCompleting(true)
        const result = await completeQuest(
          questId,
          { passageReached: true },
          { threadId }
        )
        setCompleting(false)
        if (result && 'error' in result) {
          setError(result.error)
        } else {
          const ritualParam = isRitual ? '?ritual=true' : ''
          router.push(`/conclave/onboarding${ritualParam}`)
        }
      }
    } catch (e) {
      console.error(e)
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNode(startNodeId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adventureSlug, startNodeId, questId, threadId])

  const handleChoice = (choice: Choice) => {
    if (choice.targetId === 'signup' || choice.targetId === 'Game_Login') {
      router.push('/login')
      return
    }
    fetchNode(choice.targetId)
  }

  if (loading && !currentNode) {
    return (
      <div className="text-zinc-500 animate-pulse text-center p-8">
        Loading...
      </div>
    )
  }

  if (error && !currentNode) {
    return (
      <div className="space-y-4 text-center p-8 border border-zinc-800 rounded-xl">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => fetchNode(startNodeId)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!currentNode) return null

  const slides = chunkIntoSlides(currentNode.text)
  const useSlideMode = slides.length > 1
  const displayText = useSlideMode ? slides[slideIndex] : currentNode.text

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8 prose prose-invert prose-lg max-w-none">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {displayText}
        </ReactMarkdown>
      </div>

      {useSlideMode ? (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (slideIndex < slides.length - 1) {
                setSlideIndex((i) => i + 1)
              } else {
                const firstChoice = currentNode.choices[0]
                if (firstChoice) handleChoice(firstChoice)
              }
            }}
            disabled={completing}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl disabled:opacity-50 transition-colors"
          >
            {completing ? 'Completing...' : 'Continue'}
          </button>
          {slideIndex > 0 && (
            <button
              onClick={() => setSlideIndex((i) => i - 1)}
              className="py-2 px-4 text-zinc-500 hover:text-white text-sm font-medium transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {currentNode.choices.length === 0 ? (
            completing ? (
              <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-center">
                <p className="text-green-400 font-bold">Completing quest...</p>
              </div>
            ) : questId && currentNode.linkedQuestId === questId ? (
              <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-center">
                <p className="text-green-400 font-bold">Quest completed!</p>
                <p className="text-zinc-400 text-sm mt-1">Redirecting...</p>
              </div>
            ) : (
              <button
                onClick={() =>
                  router.push(isRitual ? '/conclave/onboarding?ritual=true' : '/conclave/onboarding')
                }
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl"
              >
                Continue Journey
              </button>
            )
          ) : (
            currentNode.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                disabled={completing}
                className="w-full text-left p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-600/50 hover:bg-zinc-800/50 transition-all disabled:opacity-50"
              >
                {choice.text}
              </button>
            ))
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-900/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}
