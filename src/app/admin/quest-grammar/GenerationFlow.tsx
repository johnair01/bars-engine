'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { compileQuest, questPacketToTwee } from '@/lib/quest-grammar'
import { publishQuestPacketToPassages, appendQuestToAdventure, compileQuestWithAI, compileQuestWithPrivilegingAction, compileQuestSkeletonAction, generateQuestOverviewWithAI } from '@/actions/quest-grammar'
import { castIChingTraditional } from '@/actions/cast-iching'
import { logPrePublishFeedback } from '@/actions/narrative-quality-feedback'
import { getAdminWorldData } from '@/actions/admin'
import { QuestOutlineReview } from '@/components/admin/QuestOutlineReview'
import { SkeletonReview } from '@/components/admin/SkeletonReview'
import { FACE_SENTENCES } from '@/lib/face-sentences'
import {
  STEPS,
  baseInputClass,
  EXPERIENCE_OPTIONS,
  LIFE_STATE_OPTIONS,
  MOVE_OPTIONS,
  Q3_SEP,
} from '@/lib/quest-grammar'
import type {
  UnpackingAnswers,
  SegmentVariant,
  SerializableQuestPacket,
  NodeChoiceOverride,
} from '@/lib/quest-grammar'
import type { QuestModel } from './UnpackingForm'
import { loadPersistedFlowState, savePersistedFlowState, clearPersistedFlowState } from './useGenerationFlowState'

const FACE_OPTIONS = Object.keys(FACE_SENTENCES) as (keyof typeof FACE_SENTENCES)[]

function extractNodeOverrides(packet: SerializableQuestPacket): Record<string, NodeChoiceOverride> | undefined {
  const overrides: Record<string, NodeChoiceOverride> = {}
  for (const n of packet.nodes) {
    if (
      n.choiceType ||
      (n.enabledFaces?.length ?? 0) > 0 ||
      (n.enabledHorizontal?.length ?? 0) > 0 ||
      (n.obstacleActions && Object.keys(n.obstacleActions).length > 0)
    ) {
      overrides[n.id] = {}
      if (n.choiceType) overrides[n.id].choiceType = n.choiceType
      if (n.enabledFaces?.length) overrides[n.id].enabledFaces = n.enabledFaces
      if (n.enabledHorizontal?.length) overrides[n.id].enabledHorizontal = n.enabledHorizontal
      if (n.obstacleActions && Object.keys(n.obstacleActions).length > 0) {
        overrides[n.id].obstacleActions = n.obstacleActions
      }
    }
  }
  return Object.keys(overrides).length ? overrides : undefined
}

type PlaybookItem = { id: string; name: string }
type NationItem = { id: string; name: string }

export function GenerationFlow({
  appendToAdventureId = null,
}: {
  appendToAdventureId?: string | null
}) {
  const router = useRouter()
  const [stepIndex, setStepIndex] = useState(0)
  const [playbooks, setPlaybooks] = useState<PlaybookItem[]>([])
  const [nations, setNations] = useState<NationItem[]>([])
  const [answers, setAnswers] = useState<UnpackingAnswers>({
    q1: '',
    q2: [],
    q3: '',
    q4: [],
    q5: '',
    q6: [],
  })
  const [alignedAction, setAlignedAction] = useState('')
  const [questModel, setQuestModel] = useState<QuestModel>('personal')
  const [segment, setSegment] = useState<SegmentVariant | 'both'>('player')
  const [targetNationId, setTargetNationId] = useState<string | null>(null)
  const [targetArchetypeIds, setTargetArchetypeIds] = useState<string[]>([])
  const [developmentalLens, setDevelopmentalLens] = useState<string | null>(null)
  const [q6Context, setQ6Context] = useState('')
  const [expectedMovesSelected, setExpectedMovesSelected] = useState<string[]>([])
  const [expectedMovesCustom, setExpectedMovesCustom] = useState('')
  const [playerPOV, setPlayerPOV] = useState<{ p1?: string; p2?: string; p3?: string; p4?: string; p5?: string; p6?: string }>({})
  const [hexagramId, setHexagramId] = useState<number | null>(null)
  const [ichingCasting, setIchingCasting] = useState(false)
  const [preview, setPreview] = useState<SerializableQuestPacket | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [skeletonPreview, setSkeletonPreview] = useState<SerializableQuestPacket | null>(null)
  const [skeletonAccepted, setSkeletonAccepted] = useState(false)
  const [skeletonFeedback, setSkeletonFeedback] = useState('')
  const [isRegeneratingSkeleton, setIsRegeneratingSkeleton] = useState(false)
  const [isGeneratingFlavor, setIsGeneratingFlavor] = useState(false)

  useEffect(() => {
    getAdminWorldData().then(([nationList, archetypes]) => {
      setNations((nationList as { id: string; name: string }[]).map((n) => ({ id: n.id, name: n.name })))
      // Only canonical archetypes (The Bold Heart, etc.); exclude trigram-named (Earth (Kun), etc.)
      setPlaybooks((archetypes as { id: string; name: string }[])
        .filter((p) => p.name.startsWith('The '))
        .map((p) => ({ id: p.id, name: p.name })))
    }).catch(() => {})
  }, [])

  // Phase 4: Restore persisted state on mount
  useEffect(() => {
    const saved = loadPersistedFlowState()
    if (saved) {
      setStepIndex(saved.stepIndex)
      setAnswers(saved.answers)
      setAlignedAction(saved.alignedAction)
      setQuestModel(saved.questModel)
      setSegment(saved.segment)
      setTargetNationId(saved.targetNationId)
      setTargetArchetypeIds(saved.targetArchetypeIds)
      setDevelopmentalLens(saved.developmentalLens)
      setQ6Context(saved.q6Context)
      setExpectedMovesSelected(saved.expectedMovesSelected)
      setExpectedMovesCustom(saved.expectedMovesCustom)
      setPlayerPOV(saved.playerPOV)
      setHexagramId(saved.hexagramId)
    }
  }, [])

  // Phase 4: Persist state when form data changes (debounced by step)
  const persistState = useCallback(() => {
    savePersistedFlowState({
      stepIndex,
      answers,
      alignedAction,
      questModel,
      segment,
      targetNationId,
      targetArchetypeIds,
      developmentalLens,
      q6Context,
      expectedMovesSelected,
      expectedMovesCustom,
      playerPOV,
      hexagramId,
    })
  }, [stepIndex, answers, alignedAction, questModel, segment, targetNationId, targetArchetypeIds, developmentalLens, q6Context, expectedMovesSelected, expectedMovesCustom, playerPOV, hexagramId])

  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    persistState()
  }, [persistState])
  const [error, setError] = useState<string | null>(null)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<'idle' | 'pending' | 'error'>('idle')
  const [aiError, setAiError] = useState<string | null>(null)
  const [overviewResult, setOverviewResult] = useState<{ objectives: string[]; tweeSource: string } | null>(null)
  const [appendStatus, setAppendStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [appendError, setAppendError] = useState<string | null>(null)

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const isGenerateStep = step?.id === 'generate'

  async function handleContinue() {
    setError(null)
    if (isGenerateStep) {
      setOverviewResult(null)
      const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
      const result = await compileQuestWithPrivilegingAction({
        unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
        alignedAction,
        segment: effectiveSegment,
        questModel: questModel,
        campaignId: 'bruised-banana',
        targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
        developmentalLens: developmentalLens ?? undefined,
        targetNationId: targetNationId ?? undefined,
        targetArchetypeId: targetArchetypeIds[0],
        hexagramId: hexagramId ?? undefined,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setPreview(result)
        setAccepted(false)
        setGenerationCount((c) => c + 1)
      }
      return
    }
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((i) => i + 1)
    }
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  function renderInput() {
    if (!step || step.type === 'start' || step.type === 'generate') return null

    if (step.type === 'iching') {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={ichingCasting}
              onClick={async () => {
                setIchingCasting(true)
                setError(null)
                const result = await castIChingTraditional()
                setIchingCasting(false)
                if ('error' in result) {
                  setError(result.error)
                } else {
                  setHexagramId(result.hexagramId)
                }
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {ichingCasting ? 'Casting…' : 'Cast I Ching'}
            </button>
            <button
              type="button"
              onClick={() => setHexagramId(1 + Math.floor(Math.random() * 64))}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Random (testing)
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Or select hexagram (1–64)</label>
            <select
              value={hexagramId ?? ''}
              onChange={(e) => setHexagramId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className={baseInputClass}
            >
              <option value="">None (skip I Ching)</option>
              {Array.from({ length: 64 }, (_, i) => i + 1).map((id) => (
                <option key={id} value={id}>
                  Hexagram {id}
                </option>
              ))}
            </select>
          </div>
          {hexagramId && (
            <p className="text-xs text-zinc-500">
              Selected: Hexagram {hexagramId}. Quest will be aligned with this reading.
            </p>
          )}
        </div>
      )
    }

    if (step.type === 'experience') {
      const options = EXPERIENCE_OPTIONS
      const val = answers.q1
      return (
        <div className="space-y-2">
          <select
            value={options.includes(val as typeof options[number]) ? val : (val ? '__other__' : '')}
            onChange={(e) => {
              const v = e.target.value
              setAnswers((a) => ({ ...a, q1: v === '__other__' ? '' : v }))
            }}
            className={baseInputClass}
          >
            <option value="">Choose one…</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="__other__">Other</option>
          </select>
          {val && !options.includes(val as typeof options[number]) && (
            <input
              type="text"
              value={val}
              onChange={(e) => setAnswers((a) => ({ ...a, q1: e.target.value }))}
              placeholder="Your own experience…"
              className={`${baseInputClass} text-sm mt-2`}
            />
          )}
        </div>
      )
    }

    if (step.type === 'multiselect') {
      const options = step.options
      const key = step.id === 'q2' ? 'q2' : step.id === 'q4' ? 'q4' : 'q6'
      const selected = Array.isArray(answers[key]) ? (answers[key] as string[]) : []
      const isQ6 = key === 'q6'
      return (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Select all that apply</p>
          <div className="flex flex-wrap gap-3">
            {options.map((opt) => {
              const isChecked = selected.includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const next = e.target.checked ? [...selected, opt] : selected.filter((s) => s !== opt)
                      setAnswers((a) => ({ ...a, [key]: next }))
                    }}
                    className="rounded border-zinc-600 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm text-zinc-300">{opt}</span>
                </label>
              )
            })}
          </div>
          {isQ6 && (
            <input
              type="text"
              value={q6Context}
              onChange={(e) => setQ6Context(e.target.value)}
              placeholder="Add more context (optional)"
              className={`${baseInputClass} text-sm mt-2`}
            />
          )}
        </div>
      )
    }

    if (step.type === 'lifeState') {
      const raw = (answers.q3 ?? '') as string
      const [lifeState, distance] = raw.includes(Q3_SEP) ? raw.split(Q3_SEP).map((s) => s.trim()) : [raw, '']
      const sel = LIFE_STATE_OPTIONS.includes(lifeState as (typeof LIFE_STATE_OPTIONS)[number]) ? lifeState : ''
      return (
        <div className="space-y-2">
          <select
            value={sel}
            onChange={(e) => {
              const v = e.target.value
              setAnswers((a) => ({
                ...a,
                q3: v ? `${v}${distance ? Q3_SEP + distance : ''}` : (distance ? Q3_SEP + distance : ''),
              }))
            }}
            className={baseInputClass}
          >
            <option value="">Choose one…</option>
            {LIFE_STATE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <textarea
            value={distance}
            onChange={(e) => {
              const d = e.target.value
              setAnswers((a) => ({
                ...a,
                q3: sel ? `${sel}${d ? Q3_SEP + d : ''}` : (d ? Q3_SEP + d : ''),
              }))
            }}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                const target = e.target as HTMLTextAreaElement
                const start = target.selectionStart ?? 0
                const end = target.selectionEnd ?? 0
                const newDistance = distance.slice(0, start) + ' ' + distance.slice(end)
                setAnswers((a) => ({
                  ...a,
                  q3: sel ? `${sel}${newDistance ? Q3_SEP + newDistance : ''}` : (newDistance ? Q3_SEP + newDistance : ''),
                }))
                requestAnimationFrame(() => target.setSelectionRange(start + 1, start + 1))
              }
            }}
            placeholder="How far do you feel from your creation? (e.g. not that far)"
            rows={2}
            className={`${baseInputClass} text-sm mt-2 resize-none touch-auto`}
            spellCheck={false}
            inputMode="text"
            autoComplete="off"
          />
        </div>
      )
    }

    if (step.type === 'short') {
      const key = step.id === 'q5' ? 'q5' : 'q3'
      return (
        <input
          type="text"
          value={answers[key] as string}
          onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
          className={baseInputClass}
          placeholder="Short response…"
        />
      )
    }

    if (step.type === 'move') {
      return (
        <div className="space-y-2">
          <select
            value={MOVE_OPTIONS.includes(alignedAction as typeof MOVE_OPTIONS[number]) ? alignedAction : (alignedAction ? '__other__' : '')}
            onChange={(e) => {
              const v = e.target.value
              setAlignedAction(v === '__other__' ? '' : v)
            }}
            className={baseInputClass}
          >
            <option value="">Choose one…</option>
            {MOVE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="__other__">Other</option>
          </select>
          {alignedAction && !MOVE_OPTIONS.includes(alignedAction as typeof MOVE_OPTIONS[number]) && (
            <input
              type="text"
              value={alignedAction}
              onChange={(e) => setAlignedAction(e.target.value)}
              placeholder="Your own aligned action…"
              className={`${baseInputClass} text-sm mt-2`}
            />
          )}
        </div>
      )
    }

    if (step.type === 'model') {
      return (
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="questModel"
              value="personal"
              checked={questModel === 'personal'}
              onChange={() => setQuestModel('personal')}
              className="text-purple-500"
            />
            <span>Personal (Epiphany Bridge, 6 beats)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="questModel"
              value="communal"
              checked={questModel === 'communal'}
              onChange={() => setQuestModel('communal')}
              className="text-purple-500"
            />
            <span>Communal (Kotter, 8 stages)</span>
          </label>
        </div>
      )
    }

    if (step.type === 'segment') {
      return (
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="segment"
              value="player"
              checked={segment === 'player'}
              onChange={() => setSegment('player')}
              className="text-purple-500"
            />
            <span>Player</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="segment"
              value="sponsor"
              checked={segment === 'sponsor'}
              onChange={() => setSegment('sponsor')}
              className="text-purple-500"
            />
            <span>Sponsor</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="segment"
              value="both"
              checked={segment === 'both'}
              onChange={() => setSegment('both')}
              className="text-purple-500"
            />
            <span>Both</span>
          </label>
        </div>
      )
    }

    if (step.type === 'nation') {
      return (
        <div className="space-y-2">
          <select
            value={targetNationId ?? ''}
            onChange={(e) => setTargetNationId(e.target.value || null)}
            className={baseInputClass}
          >
            <option value="">None (generic)</option>
            {nations.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          <p className="text-xs text-zinc-500">Privileges nation-element moves in choices (2–4 per passage)</p>
        </div>
      )
    }

    if (step.type === 'archetype') {
      return (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Select all that apply (optional)</p>
          <div className="flex flex-wrap gap-3">
            {playbooks.map((p) => {
              const isChecked = targetArchetypeIds.includes(p.id)
              return (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const next = e.target.checked ? [...targetArchetypeIds, p.id] : targetArchetypeIds.filter((id) => id !== p.id)
                      setTargetArchetypeIds(next)
                    }}
                    className="rounded border-zinc-600 text-purple-500 focus:ring-purple-500"
                  />
                  <span className="text-sm text-zinc-300">{p.name}</span>
                </label>
              )
            })}
          </div>
        </div>
      )
    }

    if (step.type === 'lens') {
      return (
        <div className="space-y-2">
          <select
            value={developmentalLens ?? ''}
            onChange={(e) => setDevelopmentalLens(e.target.value || null)}
            className={baseInputClass}
          >
            <option value="">None (generic)</option>
            {FACE_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )
    }

    if (step.type === 'expectedMoves') {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {MOVE_OPTIONS.map((m) => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={expectedMovesSelected.includes(m)}
                  onChange={(e) => {
                    const next = e.target.checked ? [...expectedMovesSelected, m] : expectedMovesSelected.filter((x) => x !== m)
                    setExpectedMovesSelected(next)
                  }}
                  className="rounded border-zinc-600 text-purple-500"
                />
                <span className="text-sm text-zinc-300">{m}</span>
              </label>
            ))}
          </div>
          <input
            type="text"
            value={expectedMovesCustom}
            onChange={(e) => setExpectedMovesCustom(e.target.value)}
            placeholder="Other moves (comma-separated)"
            className={baseInputClass}
          />
        </div>
      )
    }

    if (step.type === 'playerPOV') {
      const P_LABELS = [
        { key: 'p1' as const, label: 'What do you want to get out of this?' },
        { key: 'p2' as const, label: 'How will you feel when you get it?' },
        { key: 'p3' as const, label: "What's life like for you right now?" },
        { key: 'p4' as const, label: 'How does it feel to be here?' },
        { key: 'p5' as const, label: 'What would have to be true for you to feel this way?' },
        { key: 'p6' as const, label: 'What holds you back?' },
      ]
      return (
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">Optional — helps AI speak to player wants and blocks. Skip if not needed.</p>
          {P_LABELS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-zinc-400 mb-1">{label}</label>
              <input
                type="text"
                value={playerPOV[key] ?? ''}
                onChange={(e) => setPlayerPOV((p) => ({ ...p, [key]: e.target.value || undefined }))}
                placeholder="Short response…"
                className={baseInputClass}
              />
            </div>
          ))}
        </div>
      )
    }

    return null
  }

  if (skeletonPreview) {
    return (
      <div className="space-y-6">
        <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-900/40">
          <SkeletonReview
            packet={skeletonPreview}
            feedback={skeletonFeedback}
            onFeedbackChange={setSkeletonFeedback}
            onRegenerate={async (feedback) => {
              setIsRegeneratingSkeleton(true)
              setError(null)
              const result = await compileQuestSkeletonAction({
                unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                alignedAction,
                segment: segment === 'both' ? 'player' : segment,
                questModel,
                campaignId: 'bruised-banana',
                targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                developmentalLens: developmentalLens ?? undefined,
                targetNationId: targetNationId ?? undefined,
                targetArchetypeId: targetArchetypeIds[0],
                hexagramId: hexagramId ?? undefined,
              })
              setIsRegeneratingSkeleton(false)
              if ('error' in result) setError(result.error)
              else setSkeletonPreview(result)
            }}
            onAccept={() => setSkeletonAccepted(true)}
            onReset={() => {
              setSkeletonPreview(null)
              setSkeletonAccepted(false)
              setSkeletonFeedback('')
            }}
            isRegenerating={isRegeneratingSkeleton}
            accepted={skeletonAccepted}
            onGenerateFlavor={async () => {
              setIsGeneratingFlavor(true)
              setError(null)
              const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
              const parsedMoves = [...expectedMovesSelected, ...expectedMovesCustom.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)]
              const hasPlayerPOV = Object.values(playerPOV).some(Boolean)
              const result = await compileQuestWithAI({
                unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                alignedAction,
                segment: effectiveSegment,
                campaignId: 'bruised-banana',
                questModel,
                targetNationId: targetNationId ?? undefined,
                targetArchetypeId: targetArchetypeIds[0],
                targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                developmentalLens: developmentalLens ?? undefined,
                expectedMoves: parsedMoves.length > 0 ? parsedMoves : undefined,
                playerPOV: hasPlayerPOV ? playerPOV : undefined,
                adminFeedback: skeletonFeedback || undefined,
                hexagramId: hexagramId ?? undefined,
              })
              setIsGeneratingFlavor(false)
              if ('error' in result) setError(result.error)
              else {
                setPreview(result.packet)
                setAccepted(false)
                setGenerationCount(1)
                setSkeletonPreview(null)
                setSkeletonAccepted(false)
                setSkeletonFeedback('')
              }
            }}
            isGeneratingFlavor={isGeneratingFlavor}
          />
        </div>
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>
    )
  }

  if (overviewResult) {
    return (
      <div className="space-y-6">
        <div className="border border-zinc-700 rounded-xl p-6 space-y-6 bg-zinc-900/40">
          <h3 className="text-lg font-bold text-white">AI Quest Overview</h3>
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Objectives</h4>
            <ul className="list-disc list-inside text-zinc-400 text-sm space-y-1">
              {overviewResult.objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([overviewResult.tweeSource], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `quest-overview-${Date.now()}.twee`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg"
            >
              Download .twee
            </button>
            <button
              type="button"
              onClick={() => setOverviewResult(null)}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg"
            >
              Back
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Use the Import .twee tab to create Adventure + QuestThread from this source.
          </p>
        </div>
      </div>
    )
  }

  if (preview) {
    return (
      <div className="space-y-6">
        <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-900/40">
          <QuestOutlineReview
            packet={preview}
            accepted={accepted}
            generationCount={generationCount}
            isRegenerating={isRegenerating}
            onPacketChange={(updated) => setPreview(updated)}
            onAccept={() => setAccepted(true)}
            onReset={() => {
              clearPersistedFlowState()
              setPreview(null)
              setAccepted(false)
              setGenerationCount(0)
              setStepIndex(0)
              setTargetNationId(null)
              setTargetArchetypeIds([])
              setDevelopmentalLens(null)
              setHexagramId(null)
              setSkeletonPreview(null)
              setSkeletonAccepted(false)
              setSkeletonFeedback('')
              setPublishStatus('idle')
              setPublishError(null)
              setAppendStatus('idle')
              setAppendError(null)
            }}
            onRegenerate={async (feedback) => {
              setIsRegenerating(true)
              setError(null)
              try {
                const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
                const parsedMoves = [...expectedMovesSelected, ...expectedMovesCustom.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)]
                const hasPlayerPOV = Object.values(playerPOV).some(Boolean)
                logPrePublishFeedback({
                  feedback,
                  generationCount,
                  packetSignature: {
                    primaryChannel: preview.signature.primaryChannel,
                    moveType: preview.signature.moveType,
                    segment: preview.segmentVariant,
                  },
                }).catch(() => {})
                const result = await compileQuestWithAI({
                  unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                  alignedAction,
                  segment: effectiveSegment,
                  campaignId: 'bruised-banana',
                  questModel,
                  targetNationId: targetNationId ?? undefined,
                  targetArchetypeId: targetArchetypeIds[0],
                  targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                  developmentalLens: developmentalLens ?? undefined,
                  expectedMoves: parsedMoves.length > 0 ? parsedMoves : undefined,
                  playerPOV: hasPlayerPOV ? playerPOV : undefined,
                  adminFeedback: feedback,
                  nodeOverrides: extractNodeOverrides(preview),
                  depthBranchOrder: preview.depthBranchOrder,
                })
                if ('error' in result) {
                  setError(result.error)
                } else {
                  setPreview(result.packet)
                  setAccepted(false)
                  setGenerationCount((c) => c + 1)
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Regeneration failed')
              } finally {
                setIsRegenerating(false)
              }
            }}
          >
            {/* Post-accept actions */}
            <div className="flex flex-wrap gap-3">
              {appendToAdventureId && (
                <button
                  type="button"
                  disabled={appendStatus === 'pending' || publishStatus === 'pending'}
                  onClick={async () => {
                    setAppendStatus('pending')
                    setAppendError(null)
                    const result = await appendQuestToAdventure(preview, appendToAdventureId)
                    if (result.success) {
                      setAppendStatus('success')
                      router.push(`/admin/adventures/${appendToAdventureId}`)
                    } else {
                      setAppendStatus('error')
                      setAppendError(result.error ?? 'Append failed')
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {appendStatus === 'pending' ? 'Appending…' : appendStatus === 'success' ? 'Appended' : 'Append to Adventure'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const twee = questPacketToTwee(preview)
                  const blob = new Blob([twee], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `quest-grammar-${preview.segmentVariant}-${Date.now()}.twee`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Export .twee
              </button>
              <button
                type="button"
                disabled={publishStatus === 'pending'}
                onClick={async () => {
                  setPublishStatus('pending')
                  setPublishError(null)
                  const result = await publishQuestPacketToPassages(preview)
                  if (result.success) setPublishStatus('success')
                  else {
                    setPublishStatus('error')
                    setPublishError(result.error ?? 'Publish failed')
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {publishStatus === 'pending' ? 'Publishing…' : publishStatus === 'success' ? 'Published' : 'Publish to Campaign'}
              </button>
            </div>
            {publishError && <p className="text-sm text-red-400">{publishError}</p>}
            {appendError && <p className="text-sm text-red-400">{appendError}</p>}
          </QuestOutlineReview>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {appendToAdventureId && (
        <div className="rounded-lg border border-purple-500/40 bg-purple-950/30 px-4 py-2 text-sm text-purple-200">
          Appending to Adventure — generated quest will be added to the existing adventure.
        </div>
      )}
      {/* Phase 4: Progress indicator */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => {
          const done = i < stepIndex
          const current = i === stepIndex
          return (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                current ? 'bg-purple-500' : done ? 'bg-purple-500/60' : 'bg-zinc-700'
              }`}
              title={s.title}
            />
          )
        })}
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8 space-y-6 shadow-lg">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <span aria-hidden>←</span> Previous passage
          </button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">{step.title}</h2>
          <p className="text-zinc-300 text-sm mb-4">{step.text}</p>
          {renderInput()}
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!isGenerateStep && (
            <button
              type="button"
              onClick={handleContinue}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              Continue
            </button>
          )}
          {isGenerateStep && (
            <>
              <button
                type="button"
                onClick={async () => {
                  setError(null)
                  setOverviewResult(null)
                  const result = await compileQuestSkeletonAction({
                    unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                    alignedAction,
                    segment: segment === 'both' ? 'player' : segment,
                    questModel,
                    campaignId: 'bruised-banana',
                    targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                    developmentalLens: developmentalLens ?? undefined,
                    targetNationId: targetNationId ?? undefined,
                    targetArchetypeId: targetArchetypeIds[0],
                    hexagramId: hexagramId ?? undefined,
                  })
                  if ('error' in result) setError(result.error)
                  else {
                    setSkeletonPreview(result)
                    setSkeletonAccepted(false)
                    setSkeletonFeedback('')
                  }
                }}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
              >
                Generate Skeleton
              </button>
              <button
                type="button"
                disabled={aiStatus === 'pending'}
                onClick={async () => {
                  setAiStatus('pending')
                  setAiError(null)
                  setError(null)
                  setOverviewResult(null)
                  const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
                  const parsedMoves = [...expectedMovesSelected, ...expectedMovesCustom.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)]
                  const hasPlayerPOV = Object.values(playerPOV).some(Boolean)
                  const result = await compileQuestWithAI({
                    unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                    alignedAction,
                    segment: effectiveSegment,
                    questModel: questModel,
                    campaignId: 'bruised-banana',
                    targetNationId: targetNationId ?? undefined,
                    targetArchetypeId: targetArchetypeIds[0],
                    targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                    developmentalLens: developmentalLens ?? undefined,
                    expectedMoves: parsedMoves.length > 0 ? parsedMoves : undefined,
                    playerPOV: hasPlayerPOV ? playerPOV : undefined,
                    hexagramId: hexagramId ?? undefined,
                  })
                  if ('error' in result) {
                    setAiStatus('error')
                    setAiError(result.error)
                  } else {
                    setAiStatus('idle')
                    setPreview(result.packet)
                    setAccepted(false)
                    setGenerationCount((c) => c + 1)
                  }
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                {aiStatus === 'pending' ? 'Generating…' : 'Generate with AI'}
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                Compile (heuristic)
              </button>
              <button
                type="button"
                disabled={aiStatus === 'pending'}
                onClick={async () => {
                  setAiStatus('pending')
                  setAiError(null)
                  setError(null)
                  setOverviewResult(null)
                  const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
                  const parsedMoves = [...expectedMovesSelected, ...expectedMovesCustom.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)]
                  const hasPlayerPOV = Object.values(playerPOV).some(Boolean)
                  const result = await generateQuestOverviewWithAI({
                    unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                    alignedAction,
                    segment: effectiveSegment,
                    questModel: questModel,
                    campaignId: 'bruised-banana',
                    targetNationId: targetNationId ?? undefined,
                    targetArchetypeId: targetArchetypeIds[0],
                    targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                    developmentalLens: developmentalLens ?? undefined,
                    expectedMoves: parsedMoves.length > 0 ? parsedMoves : undefined,
                    playerPOV: hasPlayerPOV ? playerPOV : undefined,
                  })
                  setAiStatus('idle')
                  if (result.success) {
                    setOverviewResult({ objectives: result.objectives, tweeSource: result.tweeSource })
                  } else {
                    setAiError(result.error)
                  }
                }}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
              >
                Generate overview (AI skeleton)
              </button>
            </>
          )}
        </div>
        {aiError && (
          <div className="p-4 bg-amber-900/20 border border-amber-800 rounded-lg text-amber-600 text-sm">
            {aiError}
          </div>
        )}
      </div>
    </div>
  )
}
