'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { compileQuest, compileQuestWithPrivileging, questPacketToTwee } from '@/lib/quest-grammar'
import { publishQuestPacketToPassages, appendQuestToAdventure, compileQuestWithAI, generateQuestOverviewWithAI } from '@/actions/quest-grammar'
import { getAdminWorldData } from '@/actions/admin'
import { FACE_SENTENCES } from '@/lib/face-sentences'
import {
  STEPS,
  baseInputClass,
  EXPERIENCE_OPTIONS,
  LIFE_STATE_OPTIONS,
  MOVE_OPTIONS,
  Q3_SEP,
} from './unpacking-constants'
import type { UnpackingAnswers, SegmentVariant, SerializableQuestPacket } from '@/lib/quest-grammar'
import type { QuestModel } from './UnpackingForm'

const FACE_OPTIONS = Object.keys(FACE_SENTENCES) as (keyof typeof FACE_SENTENCES)[]

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
  const [expectedMoves, setExpectedMoves] = useState('')
  const [playerPOV, setPlayerPOV] = useState<{ p1?: string; p2?: string; p3?: string; p4?: string; p5?: string; p6?: string }>({})
  const [preview, setPreview] = useState<SerializableQuestPacket | null>(null)

  useEffect(() => {
    getAdminWorldData().then(([nationList, archetypes]) => {
      setNations((nationList as { id: string; name: string }[]).map((n) => ({ id: n.id, name: n.name })))
      setPlaybooks((archetypes as { id: string; name: string }[]).map((p) => ({ id: p.id, name: p.name })))
    }).catch(() => {})
  }, [])
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
      try {
        setOverviewResult(null)
        const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
        const packet = await compileQuestWithPrivileging({
          unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
          alignedAction,
          segment: effectiveSegment,
          questModel: questModel,
          campaignId: 'bruised-banana',
          targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
          developmentalLens: developmentalLens ?? undefined,
          targetNationId: targetNationId ?? undefined,
          targetPlaybookId: targetArchetypeIds[0],
        })
        // Strip telemetryHooks (functions) so packet is safe for client state
        const { telemetryHooks: _, ...serializable } = packet
        setPreview(serializable)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Compilation failed')
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
          <input
            type="text"
            value={distance}
            onChange={(e) => {
              const d = e.target.value
              setAnswers((a) => ({
                ...a,
                q3: sel ? `${sel}${d ? Q3_SEP + d : ''}` : (d ? Q3_SEP + d : ''),
              }))
            }}
            placeholder="How far do you feel from your creation?"
            className={`${baseInputClass} text-sm mt-2`}
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
          <p className="text-xs text-zinc-500">Privileges nation-element moves in choices (2–3 per passage)</p>
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
        <div className="space-y-2">
          <textarea
            value={expectedMoves}
            onChange={(e) => setExpectedMoves(e.target.value)}
            placeholder="Wake Up to learn, Clean Up to work through, Grow Up to build capacity, Show Up to act"
            rows={4}
            className={`${baseInputClass} min-h-[100px] resize-y`}
          />
          <p className="text-xs text-zinc-500">One move per line or comma-separated. Milestones a completer must take.</p>
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
        <div className="border border-zinc-700 rounded-xl p-6 space-y-6 bg-zinc-900/40">
          <h3 className="text-lg font-bold text-white">Generated Quest — QuestPacket</h3>
          <div className="text-sm text-zinc-400">
            <p><strong>Signature:</strong> {preview.signature.primaryChannel}</p>
            <p><strong>Move type:</strong> {preview.signature.moveType ?? '—'}</p>
            <p>Dissatisfied: {preview.signature.dissatisfiedLabels.join(', ')}</p>
            <p>Satisfied: {preview.signature.satisfiedLabels.join(', ')}</p>
            <p>Shadow voices: {preview.signature.shadowVoices.join(', ')}</p>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-zinc-300">Nodes ({preview.nodes.length})</h4>
            {preview.nodes.map((node) => (
              <div key={node.id} className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-purple-400 font-mono text-sm">{node.id}</span>
                  <span className="text-zinc-500 text-xs">{node.beatType}</span>
                </div>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap">{node.text}</p>
              </div>
            ))}
          </div>
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
                const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
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
            <button
              type="button"
              onClick={() => {
                setPreview(null)
                setStepIndex(0)
                setTargetNationId(null)
                setTargetArchetypeIds([])
                setDevelopmentalLens(null)
              }}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Create another
            </button>
          </div>
          {publishError && <p className="text-sm text-red-400">{publishError}</p>}
          {appendError && <p className="text-sm text-red-400">{appendError}</p>}
          <div className="mt-4 pt-4 border-t border-zinc-700">
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Import from .twee (creates Adventure + QuestThread)</h4>
            <p className="text-xs text-zinc-500">Use the <strong>Import .twee</strong> tab above to paste .twee source and create a linked Adventure + QuestThread with editable quests.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {appendToAdventureId && (
        <div className="rounded-lg border border-purple-500/40 bg-purple-950/30 px-4 py-2 text-sm text-purple-200">
          Appending to Adventure — generated quest will be added to the existing adventure.
        </div>
      )}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-zinc-400 hover:text-white transition"
            >
              Back
            </button>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-2">{step.title}</h2>
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
                disabled={aiStatus === 'pending'}
                onClick={async () => {
                  setAiStatus('pending')
                  setAiError(null)
                  setError(null)
                  setOverviewResult(null)
                  const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
                  const parsedMoves = expectedMoves
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                  const hasPlayerPOV = Object.values(playerPOV).some(Boolean)
                  const result = await compileQuestWithAI({
                    unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                    alignedAction,
                    segment: effectiveSegment,
                    questModel: questModel,
                    campaignId: 'bruised-banana',
                    targetNationId: targetNationId ?? undefined,
                    targetPlaybookId: targetArchetypeIds[0],
                    targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                    developmentalLens: developmentalLens ?? undefined,
                    expectedMoves: parsedMoves.length > 0 ? parsedMoves : undefined,
                    playerPOV: hasPlayerPOV ? playerPOV : undefined,
                  })
                  if ('error' in result) {
                    setAiStatus('error')
                    setAiError(result.error)
                  } else {
                    setAiStatus('idle')
                    setPreview(result.packet)
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
                  const parsedMoves = expectedMoves
                    .split(/[\n,]+/)
                    .map((s) => s.trim())
                    .filter(Boolean)
                  const hasPlayerPOV = Object.values(playerPOV).some(Boolean)
                  const result = await generateQuestOverviewWithAI({
                    unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                    alignedAction,
                    segment: effectiveSegment,
                    questModel: questModel,
                    campaignId: 'bruised-banana',
                    targetNationId: targetNationId ?? undefined,
                    targetPlaybookId: targetArchetypeIds[0],
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
