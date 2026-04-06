'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completeQuest } from '@/actions/quest-engine'
import { saveAdventureProgress, getAdventureProgress } from '@/actions/adventure-progress'
import { emitBarFromPassage } from '@/actions/emit-bar-from-passage'
import { createBarFromMoveChoice } from '@/actions/create-bar-from-move-choice'
import { generateQuestFromReading } from '@/actions/generate-quest'
import { plantSeedFromSpoke } from '@/actions/plant-seed-from-spoke'
import { completeGscpAdventureTerminal } from '@/actions/generated-spoke-cyoa'
import { saveCyoaHexagramSnapshot } from '@/actions/cyoa-artifact-ledger'
import { chunkIntoSlides } from '@/lib/slide-chunker'
import { applyAuthenticatedChoicePolicy } from '@/lib/cyoa/filter-choices'
import { buildOnboardingUrl } from '@/lib/safe-return-to'
import { FACE_META } from '@/lib/quest-grammar/types'
import { parseGameMasterFace } from '@/lib/quest-grammar/parseGameMasterFace'
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
  /** CYOA face picker — applied before fetch; persists for subsequent portal nodes */
  setFace?: string
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
  const [spokeSeedBarId, setSpokeSeedBarId] = useState<string | null>(null)
  /** Generated spoke CYOA terminal — server records BAR + nursery kernel */
  const [gscpTerminal, setGscpTerminal] = useState<{
    status: 'idle' | 'running' | 'done' | 'error'
    error: string | null
    barId: string | null
  }>({ status: 'idle', error: null, barId: null })
  const [ledger, setLedger] = useState<CyoaArtifactLedgerEntry[]>([])
  const [hexLine, setHexLine] = useState<string | null>(null)
  /** In-flow GM face from portal passages (overrides URL `face` after picker) */
  const [pickedFace, setPickedFace] = useState<string | null>(null)
  const pickedFaceRef = useRef<string | null>(null)
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

  useEffect(() => {
    pickedFaceRef.current = null
    setPickedFace(null)
  }, [adventureId, startNodeId])

  useEffect(() => {
    if (!currentNode || isPreview) return
    if (currentNode.metadata?.actionType !== 'gscp_terminal') {
      setGscpTerminal({ status: 'idle', error: null, barId: null })
      return
    }
    let cancelled = false
    setGscpTerminal({ status: 'running', error: null, barId: null })
    void completeGscpAdventureTerminal(adventureId).then((r) => {
      if (cancelled) return
      if ('error' in r) {
        setGscpTerminal({ status: 'error', error: r.error, barId: null })
      } else {
        setGscpTerminal({ status: 'done', error: null, barId: r.barId })
      }
    })
    return () => {
      cancelled = true
    }
    // Intentionally depend on id + actionType only (not full node) to avoid re-running on unrelated node updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gscp_terminal completion is keyed by node id
  }, [currentNode?.id, currentNode?.metadata?.actionType, adventureId, isPreview])

  const isBarEmitNode = currentNode?.metadata?.actionType === 'bar_emit'
  const isCastIChingNode =
    currentNode?.metadata?.actionType === 'cast_iching' &&
    currentNode?.metadata?.castIChingTargetId

  const fetchNode = async (
    nodeId: string,
    opts?: { faceOverride?: string }
  ) => {
    setLoading(true)
    setError(null)
    try {
      const faceForApi =
        opts?.faceOverride?.trim() ||
        pickedFaceRef.current?.trim() ||
        portalFace?.trim() ||
        undefined
      const params = new URLSearchParams()
      if (isPreview) params.set('preview', '1')
      if (faceForApi) params.set('face', faceForApi)
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

      // Auto-plant seed BAR when a spoke terminal node is reached (not GSCP — that uses completeGscpAdventureTerminal)
      const isGscpTerminal = node.metadata?.actionType === 'gscp_terminal'
      if (
        node.choices.length === 0 &&
        portalSpokeIndex != null &&
        campaignRef &&
        !isPreview &&
        !isGscpTerminal
      ) {
        void plantSeedFromSpoke({
          campaignRef,
          spokeIndex: portalSpokeIndex,
          hexagramId: portalHexagramId ?? undefined,
          portalFace: faceForApi,
        }).then((r) => {
          if ('success' in r) setSpokeSeedBarId(r.barId)
        })
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
          router.push(buildOnboardingUrl({ returnTo: returnTo ?? undefined, ritual: !!isRitual }))
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
      spokeIndex:
        portalSpokeIndex != null && portalSpokeIndex >= 0 && portalSpokeIndex <= 7
          ? portalSpokeIndex
          : undefined,
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
    if (nextId) void fetchNode(nextId)
    else router.push('/hand')
  }

  const handleChoice = async (choice: Choice) => {
    if (choice.targetId === 'signup' || choice.targetId === 'Game_Login') {
      const params = new URLSearchParams()
      if (questId) params.set('questId', questId)
      if (threadId) params.set('threadId', threadId)
      if (campaignRef) params.set('ref', campaignRef)
      if (returnTo) params.set('returnTo', returnTo)
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
      let path = choice.targetId.slice(9)
      const cref = campaignRef?.trim()
      if (cref && !path.includes('ref=')) {
        const sep = path.includes('?') ? '&' : '?'
        path = `${path}${sep}ref=${encodeURIComponent(cref)}`
      }
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
      if (choice.setFace) {
        pickedFaceRef.current = choice.setFace
        setPickedFace(choice.setFace)
      }
      const refPart = campaignRef ? `&ref=${encodeURIComponent(campaignRef)}` : ''
      const faceForSchool =
        choice.setFace?.trim() ||
        pickedFaceRef.current?.trim() ||
        portalFace?.trim()
      const facePart = faceForSchool
        ? `&face=${encodeURIComponent(faceForSchool)}`
        : ''
      const roomReturn = `/adventure/${adventureId}/play?start=${encodeURIComponent(currentNode.id)}${refPart}${facePart}`
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

    if (choice.setFace) {
      pickedFaceRef.current = choice.setFace
      setPickedFace(choice.setFace)
    }
    const faceOverride = choice.setFace?.trim() || undefined
    void fetchNode(choice.targetId, faceOverride ? { faceOverride } : undefined)
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

  /** Must run before any conditional return — same hook order on loading vs loaded (portal CYOA). */
  const portalFaceLabel = useMemo(() => {
    const raw = pickedFace?.trim() || portalFace?.trim()
    if (!raw) return null
    const parsed = parseGameMasterFace(raw)
    return parsed ? FACE_META[parsed].label : null
  }, [pickedFace, portalFace])

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
            {portalFaceLabel ? (
              <span className="text-zinc-500"> · GM face: {portalFaceLabel}</span>
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
            ) : currentNode.metadata?.actionType === 'gscp_terminal' ? (
              gscpTerminal.status === 'running' || gscpTerminal.status === 'idle' ? (
                <div className="p-4 bg-zinc-900/40 border border-zinc-700/50 rounded-xl text-center space-y-2">
                  <p className="text-zinc-300 font-medium">Recording your achievement…</p>
                  <p className="text-zinc-500 text-xs">BAR + spoke nursery</p>
                </div>
              ) : gscpTerminal.status === 'error' ? (
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-center space-y-2">
                  <p className="text-red-300 text-sm">{gscpTerminal.error ?? 'Could not complete this step.'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setGscpTerminal({ status: 'running', error: null, barId: null })
                      void completeGscpAdventureTerminal(adventureId).then((r) => {
                        if ('error' in r) {
                          setGscpTerminal({ status: 'error', error: r.error, barId: null })
                        } else {
                          setGscpTerminal({ status: 'done', error: null, barId: r.barId })
                        }
                      })
                    }}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-xl text-center">
                    <p className="text-green-400 font-bold">Spoke journey complete</p>
                    <p className="text-zinc-400 text-sm mt-1">
                      Achievement saved — your BAR appears on{' '}
                      <Link href="/hand" className="text-purple-400 hover:text-purple-300">
                        Hand
                      </Link>
                      .
                    </p>
                  </div>
                  {campaignRef ? (
                    <>
                      <Link
                        href={`/campaign/landing?ref=${encodeURIComponent(campaignRef)}${portalSpokeIndex != null ? `&spoke=${portalSpokeIndex}` : ''}`}
                        className="block w-full text-center py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
                      >
                        Continue to landing card →
                      </Link>
                      <Link
                        href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
                        className="block w-full text-center py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                      >
                        Return to hub
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/hand"
                      className="block w-full text-center py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
                    >
                      Open hand →
                    </Link>
                  )}
                </div>
              )
            ) : portalSpokeIndex != null && campaignRef ? (
              <div className="space-y-3">
                {spokeSeedBarId && (
                  <p className="text-xs text-emerald-500 text-center">
                    Seed planted — keep watering to grow it into a quest.
                  </p>
                )}
                <Link
                  href={`/campaign/landing?ref=${encodeURIComponent(campaignRef)}&spoke=${portalSpokeIndex}`}
                  className="block w-full text-center py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors"
                >
                  Continue to landing card →
                </Link>
                {portalHexagramId && (
                  portalQuestGenerated ? (
                    <p className="text-green-400 text-sm text-center">
                      Quest generated: {portalQuestGenerated.title}
                    </p>
                  ) : (
                    <button
                      onClick={() => void handleGeneratePortalQuest()}
                      disabled={generatingPortalQuest}
                      className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50 transition-colors"
                    >
                      {generatingPortalQuest ? 'Generating quest…' : `Generate quest from Hexagram ${portalHexagramId}`}
                    </button>
                  )
                )}
                <Link
                  href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}
                  className="block w-full text-center py-2 text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
                >
                  Return to hub
                </Link>
              </div>
            ) : (
              <button
                onClick={() =>
                  router.push(buildOnboardingUrl({ returnTo: returnTo ?? undefined, ritual: !!isRitual }))
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
