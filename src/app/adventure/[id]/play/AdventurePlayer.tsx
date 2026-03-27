'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completeQuest } from '@/actions/quest-engine'
import { saveAdventureProgress, getAdventureProgress } from '@/actions/adventure-progress'
import { emitBarFromPassage } from '@/actions/emit-bar-from-passage'
import { createBarFromMoveChoice } from '@/actions/create-bar-from-move-choice'
import { generateQuestFromReading } from '@/actions/generate-quest'
import { saveCyoaHexagramSnapshot } from '@/actions/cyoa-artifact-ledger'
import { chunkIntoSlides } from '@/lib/slide-chunker'
import { applyAuthenticatedChoicePolicy } from '@/lib/cyoa/filter-choices'
import type { CyoaArtifactLedgerEntry } from '@/lib/cyoa/types'
import { CastIChingModal } from '@/components/CastIChingModal'
import { CyoaBarLedgerSheet } from '@/components/cyoa/CyoaBarLedgerSheet'
import { CopyableProse } from '@/components/ui/CopyableProse'
import { CopyTextButton } from '@/components/ui/CopyTextButton'

interface Choice {
  text: string
  targetId: string
  moveType?: string
  blueprintKey?: string
}

interface Node {
  id: string
  text: string
  choices: Choice[]
  linkedQuestId?: string
  isCompletionPassage?: boolean
  metadata?: {
    actionType?: string
    castIChingTargetId?: string
    barTemplate?: { defaultTitle?: string; defaultDescription?: string }
    nextTargetId?: string
    moveType?: string
    /** Prompt library / ledger key for bar_emit */
    blueprintKey?: string
    /** e.g. transcendence — expands BAR recap */
    beat?: string
  }
}

interface Props {
  adventureId: string
  adventureSlug: string
  startNodeId: string
  questId?: string
  threadId?: string
  isRitual?: boolean
  isPreview?: boolean
  campaignRef?: string
  schoolsAdventureId?: string
  returnTo?: string
  portalHexagramId?: number
  portalFace?: string
  portalSpokeIndex?: number
  portalKotterStage?: number
  /** Instance display name when playing from campaign hub */
  campaignDisplayName?: string
}

export function AdventurePlayer({
  adventureId,
  adventureSlug,
  startNodeId,
  questId,
  threadId,
  isRitual,
  isPreview,
  campaignRef,
  schoolsAdventureId,
  returnTo,
  portalHexagramId,
  portalFace,
  portalSpokeIndex,
  portalKotterStage,
  campaignDisplayName,
}: Props) {
  const [currentNode, setCurrentNode] = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [castModalOpen, setCastModalOpen] = useState(false)
  const [barSubmitting, setBarSubmitting] = useState(false)
  const [moveChoiceProcessing, setMoveChoiceProcessing] = useState(false)
  const [barTitle, setBarTitle] = useState('')
  const [barDescription, setBarDescription] = useState('')
  const [generatingPortalQuest, setGeneratingPortalQuest] = useState(false)
  const [portalQuestGenerated, setPortalQuestGenerated] = useState<{ title: string; questId?: string } | null>(null)
  const [ledger, setLedger] = useState<CyoaArtifactLedgerEntry[]>([])
  const [hexLine, setHexLine] = useState<string | null>(null)
  const router = useRouter()

  const refreshLedger = useCallback(async () => {
    if (isPreview) return
    const p = await getAdventureProgress(adventureId)
    if (!p?.stateData || typeof p.stateData !== 'object') return
    const sd = p.stateData as Record<string, unknown>
    const raw = sd.cyoaArtifactLedger
    setLedger(Array.isArray(raw) ? (raw as CyoaArtifactLedgerEntry[]) : [])
    const hex = sd.cyoaHexagramState as { hexagramId?: number } | undefined
    if (hex?.hexagramId != null) {
      setHexLine(`Hexagram ${hex.hexagramId} — carried on this journey.`)
    } else {
      setHexLine(null)
    }
  }, [adventureId, isPreview])

  useEffect(() => {
    void refreshLedger()
  }, [refreshLedger])

  const isBarEmitNode = currentNode?.metadata?.actionType === 'bar_emit'
  const isCastIChingNode =
    currentNode?.metadata?.actionType === 'cast_iching' &&
    currentNode?.metadata?.castIChingTargetId

  const fetchNode = async (nodeId: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (isPreview) params.set('preview', '1')
      if (portalFace) params.set('face', portalFace)
      if (campaignRef) params.set('ref', campaignRef)
      if (portalHexagramId != null && Number.isFinite(portalHexagramId)) {
        params.set('hexagram', String(portalHexagramId))
      }
      if (portalSpokeIndex != null && portalSpokeIndex >= 0 && portalSpokeIndex <= 7) {
        params.set('spoke', String(portalSpokeIndex))
      }
      if (portalKotterStage != null && Number.isFinite(portalKotterStage)) {
        params.set('kotterStage', String(portalKotterStage))
      }
      const qs = params.toString()
      const url = `/api/adventures/${adventureSlug}/${nodeId}${qs ? `?${qs}` : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        setError('Could not load this step.')
        return
      }
      const node = (await res.json()) as Node
      setCurrentNode(node)
      setSlideIndex(0)

      // Persist progress for resume on logout/login (PlayerAdventureProgress)
      if (!isPreview) {
        await saveAdventureProgress(adventureId, nodeId, {})
      }

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
          { threadId, source: 'adventure_passage' }
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
  }, [
    adventureSlug,
    startNodeId,
    questId,
    threadId,
    campaignRef,
    portalFace,
    portalHexagramId,
    portalSpokeIndex,
    portalKotterStage,
  ])

  useEffect(() => {
    if (currentNode?.metadata?.actionType === 'bar_emit') {
      const t = currentNode.metadata.barTemplate
      setBarTitle(t?.defaultTitle ?? '')
      setBarDescription(t?.defaultDescription ?? '')
    }
  }, [currentNode?.id, currentNode?.metadata?.actionType, currentNode?.metadata?.barTemplate])

  const handleGeneratePortalQuest = async () => {
    if (!portalHexagramId) return
    setGeneratingPortalQuest(true)
    try {
      const result = await generateQuestFromReading(
        portalHexagramId,
        null,
        campaignRef ? { campaignRef } : undefined
      )
      if ('error' in result) {
        alert(result.error)
      } else {
        setPortalQuestGenerated({ title: result.quest.title, questId: result.questId ?? undefined })
      }
    } finally {
      setGeneratingPortalQuest(false)
    }
  }

  const handleBarEmitSubmit = async () => {
    if (!currentNode || !isBarEmitNode) return
    const title = barTitle.trim()
    if (!title) {
      setError('Title is required')
      return
    }
    setBarSubmitting(true)
    setError(null)
    const result = await emitBarFromPassage({
      title,
      description: barDescription.trim(),
      adventureId,
      passageNodeId: currentNode.id,
      campaignRef: campaignRef ?? undefined,
      blueprintKey: currentNode.metadata?.blueprintKey,
    })
    setBarSubmitting(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    await refreshLedger()
    const nextId =
      currentNode.metadata?.nextTargetId ??
      currentNode.choices[0]?.targetId
    if (nextId) fetchNode(nextId)
    else router.push('/hand')
  }

  const handleChoice = async (choice: Choice) => {
    if (choice.targetId === 'signup' || choice.targetId === 'Game_Login') {
      const params = new URLSearchParams()
      if (questId) params.set('questId', questId)
      if (threadId) params.set('threadId', threadId)
      if (campaignRef) params.set('ref', campaignRef)
      const qs = params.toString()
      const returnPath = `/adventure/${adventureId}/play${qs ? `?${qs}` : ''}`
      router.push(`/login?returnTo=${encodeURIComponent(returnPath)}`)
      return
    }
    if (choice.targetId === 'redirect:returnTo' && returnTo) {
      router.push(returnTo)
      return
    }
    if (choice.targetId.startsWith('redirect:')) {
      const path = choice.targetId.slice(9)
      let url = path
      const returnToVal = returnTo ?? (campaignRef ? `/campaign/hub?ref=${campaignRef}` : null)
      if (returnToVal) {
        const sep = path.includes('?') ? '&' : '?'
        url = `${path}${sep}returnTo=${encodeURIComponent(returnToVal)}`
      }
      router.push(url)
      return
    }
    if (choice.targetId === 'schools' && schoolsAdventureId && currentNode) {
      const refPart = campaignRef ? `&ref=${encodeURIComponent(campaignRef)}` : ''
      const roomReturn = `/adventure/${adventureId}/play?start=${encodeURIComponent(currentNode.id)}${refPart}`
      router.push(`/adventure/${schoolsAdventureId}/play?returnTo=${encodeURIComponent(roomReturn)}`)
      return
    }

    const moveType = choice.moveType ?? currentNode?.metadata?.moveType
    if (moveType && currentNode) {
      setMoveChoiceProcessing(true)
      setError(null)
      const result = await createBarFromMoveChoice({
        moveType,
        passageNodeId: currentNode.id,
        adventureId,
        passageText: currentNode.text,
        choiceText: choice.text,
        questId: questId ?? undefined,
        campaignRef: campaignRef ?? undefined,
      })
      setMoveChoiceProcessing(false)
      if ('error' in result) {
        setError(result.error)
        return
      }
      await refreshLedger()
    }

    fetchNode(choice.targetId)
  }

  const displayChoices = useMemo(
    () => (currentNode ? applyAuthenticatedChoicePolicy(currentNode.choices, true) : []),
    [currentNode]
  )

  const isTranscendenceBeat = useMemo(
    () =>
      !!currentNode &&
      (currentNode.metadata?.beat === 'transcendence' ||
        /\bTranscendence\b/i.test(currentNode.text.slice(0, 200))),
    [currentNode]
  )

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
        <div className="flex justify-center items-start gap-2">
          <p className="text-red-400 flex-1 min-w-0">{error}</p>
          <CopyTextButton text={error} aria-label="Copy error message" />
        </div>
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

  const showHubContextStrip = Boolean(campaignRef?.trim())

  const slides = chunkIntoSlides(currentNode.text)
  const useSlideMode = slides.length > 1
  const displayText = useSlideMode ? slides[slideIndex] : currentNode.text

  return (
    <div
      className={`space-y-8 animate-in fade-in duration-500 ${!isPreview ? 'pb-32 sm:pb-36' : ''}`}
    >
      {showHubContextStrip ? (
        <div
          role="region"
          aria-label="Campaign hub context"
          className="rounded-lg border border-zinc-700/90 bg-zinc-950/90 px-3 py-2.5 sm:px-4 flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-xs text-zinc-400 min-w-0 flex-1 leading-relaxed">
            <span className="text-zinc-100 font-medium">
              {campaignDisplayName?.trim() ? campaignDisplayName.trim() : campaignRef}
            </span>
            {portalSpokeIndex !== undefined ? (
              <span className="text-zinc-500"> · Spoke {portalSpokeIndex + 1} of 8</span>
            ) : null}
            {portalHexagramId != null ? (
              <span className="text-zinc-500"> · Hexagram {portalHexagramId}</span>
            ) : null}
            {portalKotterStage != null ? (
              <span className="text-zinc-500"> · Collective stage {portalKotterStage}</span>
            ) : null}
          </p>
          <Link
            href={`/campaign/hub?ref=${encodeURIComponent(campaignRef!)}`}
            className="shrink-0 text-sm font-medium text-purple-400 hover:text-purple-300 min-h-[44px] inline-flex items-center"
          >
            Back to hub →
          </Link>
        </div>
      ) : null}
      <CopyableProse
        textToCopy={displayText}
        copyAriaLabel={useSlideMode ? 'Copy visible passage text' : 'Copy passage text'}
        className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 sm:p-8 prose prose-invert prose-lg max-w-none"
      >
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              const safeHref = href && typeof href === 'string' ? href : '/'
              const isInternal = safeHref.startsWith('/') && !safeHref.startsWith('//')
              if (isInternal) {
                return (
                  <Link
                    href={safeHref}
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    {children}
                  </Link>
                )
              }
              return (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  {children}
                </a>
              )
            },
          }}
        >
          {displayText}
        </ReactMarkdown>
      </CopyableProse>

      {useSlideMode ? (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (slideIndex < slides.length - 1) {
                setSlideIndex((i) => i + 1)
              } else {
                const firstChoice = displayChoices[0]
                if (firstChoice) void handleChoice(firstChoice)
              }
            }}
            disabled={completing || moveChoiceProcessing}
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
          {isBarEmitNode && (
            <div className="space-y-4 p-4 bg-zinc-900/80 border border-zinc-700 rounded-xl">
              <h3 className="text-lg font-medium text-zinc-200">Create a BAR</h3>
              <input
                type="text"
                placeholder="Title"
                value={barTitle}
                onChange={(e) => setBarTitle(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={barDescription}
                onChange={(e) => setBarDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              />
              <button
                onClick={handleBarEmitSubmit}
                disabled={barSubmitting || !barTitle.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
              >
                {barSubmitting ? 'Creating...' : 'Create BAR & Continue'}
              </button>
            </div>
          )}
          {isCastIChingNode && (
            <>
              <button
                onClick={() => setCastModalOpen(true)}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-xl">☰</span>
                <span>Cast the I Ching</span>
              </button>
              <CastIChingModal
                isOpen={castModalOpen}
                onClose={() => setCastModalOpen(false)}
                onComplete={(targetId) => {
                  setCastModalOpen(false)
                  fetchNode(targetId)
                }}
                targetNodeId={currentNode.metadata!.castIChingTargetId!}
                onHexagramAccepted={async (castResult) => {
                  await saveCyoaHexagramSnapshot(adventureId, {
                    hexagramId: castResult.hexagramId,
                    transformedHexagramId: castResult.transformedHexagramId,
                    changingLines: castResult.changingLines,
                  })
                  await refreshLedger()
                }}
              />
            </>
          )}
          {!isBarEmitNode &&
          (currentNode.choices.length === 0 && !isCastIChingNode ? (
            completing ? (
              <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-center">
                <p className="text-green-400 font-bold">Completing quest...</p>
              </div>
            ) : error && error.includes('gameboard') && questId && currentNode.linkedQuestId === questId ? (
              <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-xl text-center space-y-3">
                <p className="text-amber-300 font-medium">This campaign quest must be completed on the featured field.</p>
                <Link
                  href="/campaign/board?ref=bruised-banana"
                  className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Go to featured field →
                </Link>
              </div>
            ) : questId && currentNode.linkedQuestId === questId ? (
              <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-center">
                <p className="text-green-400 font-bold">Quest completed!</p>
                <p className="text-zinc-400 text-sm mt-1">Redirecting...</p>
              </div>
            ) : portalHexagramId && campaignRef ? (
              <div className="space-y-3">
                {portalQuestGenerated ? (
                  <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl space-y-3">
                    <p className="text-green-400 font-medium text-sm">Quest generated: {portalQuestGenerated.title}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link
                        href="/hand/quests"
                        className="flex-1 text-center py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        View in Vault →
                      </Link>
                      {portalQuestGenerated.questId ? (
                        <Link
                          href={`/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}&attach=${encodeURIComponent(portalQuestGenerated.questId)}`}
                          className="flex-1 text-center py-2 px-3 bg-teal-900/80 hover:bg-teal-800 text-teal-100 text-sm font-medium rounded-lg transition-colors border border-teal-800/50"
                        >
                          List on marketplace →
                        </Link>
                      ) : null}
                      <Link
                        href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
                        className="flex-1 text-center py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        Return to hub →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => void handleGeneratePortalQuest()}
                      disabled={generatingPortalQuest}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
                    >
                      {generatingPortalQuest ? 'Generating quest…' : `Generate quest from Hexagram ${portalHexagramId} →`}
                    </button>
                    <Link
                      href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
                      className="block w-full text-center py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                    >
                      Skip — return to lobby
                    </Link>
                  </>
                )}
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
            displayChoices.map((choice, i) => (
              <button
                key={i}
                onClick={() => void handleChoice(choice)}
                disabled={completing || moveChoiceProcessing}
                className="w-full text-left p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-purple-600/50 hover:bg-zinc-800/50 transition-all disabled:opacity-50"
              >
                {choice.text}
              </button>
            ))
          ))}
        </div>
      )}

      {error && !error.includes('gameboard') && (
        <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl flex justify-end items-start gap-2">
          <p className="text-red-400 text-sm flex-1 min-w-0">{error}</p>
          <CopyTextButton text={error} aria-label="Copy error message" />
        </div>
      )}

      {!isPreview && (
        <CyoaBarLedgerSheet
          entries={ledger}
          emphasizeRecap={isTranscendenceBeat}
          hexagramLine={hexLine}
        />
      )}
    </div>
  )
}
