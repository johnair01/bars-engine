'use client'

import { useState, useEffect } from 'react'
import { questPacketToTwee } from '@/lib/quest-grammar'
import { publishQuestPacketToPassages, compileQuestWithAI, compileQuestWithPrivilegingAction } from '@/actions/quest-grammar'
import { logPrePublishFeedback } from '@/actions/narrative-quality-feedback'
import { getAdminWorldData } from '@/actions/admin'
import { QuestOutlineReview } from '@/components/admin/QuestOutlineReview'
import {
  UNPACKING_QUESTIONS,
  EXPERIENCE_OPTIONS,
  LIFE_STATE_OPTIONS,
  MOVE_OPTIONS,
  FACE_OPTIONS,
  Q3_SEP,
  baseInputClass,
} from '@/lib/quest-grammar'
import type { UnpackingAnswers, SegmentVariant, SerializableQuestPacket } from '@/lib/quest-grammar'

export type QuestModel = 'personal' | 'communal'

type PlaybookItem = { id: string; name: string }
type NationItem = { id: string; name: string }

export function UnpackingForm() {
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
  const [preview, setPreview] = useState<SerializableQuestPacket | null>(null)
  const [accepted, setAccepted] = useState(false)
  const [generationCount, setGenerationCount] = useState(0)
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    getAdminWorldData().then(([nationList, archetypes]) => {
      setNations((nationList as { id: string; name: string }[]).map((n) => ({ id: n.id, name: n.name })))
      setPlaybooks((archetypes as { id: string; name: string }[])
        .filter((p) => p.name.startsWith('The '))
        .map((p) => ({ id: p.id, name: p.name })))
    }).catch(() => {})
  }, [])
  const [error, setError] = useState<string | null>(null)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [publishError, setPublishError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<'idle' | 'pending' | 'error'>('idle')
  const [aiError, setAiError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
      const input = {
        unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
        alignedAction,
        segment: effectiveSegment,
        campaignId: 'bruised-banana',
        questModel,
        targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
        developmentalLens: developmentalLens ?? undefined,
        targetNationId: targetNationId ?? undefined,
        targetPlaybookId: targetArchetypeIds[0],
      }
      const result = await compileQuestWithPrivilegingAction(input)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setPreview(result)
      setAccepted(false)
      setGenerationCount((c) => c + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Compilation failed')
    }
  }

  const renderQuestion = (item: (typeof UNPACKING_QUESTIONS)[number]) => {
    const { key, semantic, label, type } = item
    if (type === 'experience') {
      const options = item.options ?? EXPERIENCE_OPTIONS
      return (
        <div key={key} className="space-y-2">
          <label htmlFor={key} className="block text-sm font-medium text-zinc-300 mb-1">
            <span className="text-purple-400 font-mono text-xs mr-2">{semantic}</span>
            {label}
          </label>
          <select
            id={key}
            value={options.includes(answers[key] as typeof options[number]) ? answers[key] : (answers[key] ? '__other__' : '')}
            onChange={(e) => {
              const v = e.target.value
              setAnswers((a) => ({ ...a, [key]: v === '__other__' ? '' : v }))
            }}
            className={baseInputClass}
          >
            <option value="">Choose one…</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="__other__">Other (type below)</option>
          </select>
          {(answers[key] === '' || (answers[key] && !options.includes(answers[key] as typeof options[number]))) && (
            <input
              type="text"
              value={options.includes(answers[key] as typeof options[number]) ? '' : answers[key]}
              onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
              placeholder="Your own experience…"
              className={`${baseInputClass} text-sm`}
            />
          )}
        </div>
      )
    }
    if (type === 'lifeState') {
      const raw = (answers.q3 ?? '') as string
      const [lifeState, distance] = raw.includes(Q3_SEP) ? raw.split(Q3_SEP).map((s) => s.trim()) : [raw, '']
      const sel = LIFE_STATE_OPTIONS.includes(lifeState as typeof LIFE_STATE_OPTIONS[number]) ? lifeState : ''
      return (
        <div key={key} className="space-y-2">
          <label htmlFor={key} className="block text-sm font-medium text-zinc-300 mb-1">
            <span className="text-purple-400 font-mono text-xs mr-2">{semantic}</span>
            {label}
          </label>
          <select
            id={key}
            value={sel}
            onChange={(e) => {
              const v = e.target.value
              setAnswers((a) => ({ ...a, [key]: v ? `${v}${distance ? Q3_SEP + distance : ''}` : (distance ? Q3_SEP + distance : '') }))
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
              setAnswers((a) => ({ ...a, [key]: sel ? `${sel}${d ? Q3_SEP + d : ''}` : (d ? Q3_SEP + d : '') }))
            }}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                const target = e.target as HTMLTextAreaElement
                const start = target.selectionStart ?? 0
                const end = target.selectionEnd ?? 0
                const newDistance = distance.slice(0, start) + ' ' + distance.slice(end)
                setAnswers((a) => ({ ...a, [key]: sel ? `${sel}${newDistance ? Q3_SEP + newDistance : ''}` : (newDistance ? Q3_SEP + newDistance : '') }))
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
    if (type === 'multiselect') {
      const options = item.options
      const selected = Array.isArray(answers[key]) ? (answers[key] as string[]) : []
      const isQ6 = key === 'q6'
      return (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            <span className="text-purple-400 font-mono text-xs mr-2">{semantic}</span>
            {label}
          </label>
          <p className="text-xs text-zinc-500 mb-2">Select all that apply</p>
          <div className="flex flex-wrap gap-3">
            {options.map((opt) => {
              const isChecked = selected.includes(opt)
              return (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selected, opt]
                        : selected.filter((s) => s !== opt)
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
    if (type === 'short') {
      return (
        <div key={key}>
          <label htmlFor={key} className="block text-sm font-medium text-zinc-300 mb-1">
            <span className="text-purple-400 font-mono text-xs mr-2">{semantic}</span>
            {label}
          </label>
          <input
            id={key}
            type="text"
            value={answers[key]}
            onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
            className={baseInputClass}
            placeholder="Short response…"
          />
        </div>
      )
    }
    return (
      <div key={key}>
        <label htmlFor={key} className="block text-sm font-medium text-zinc-300 mb-1">
          <span className="text-purple-400 font-mono text-xs mr-2">{semantic}</span>
          {label}
        </label>
        <textarea
          id={key}
          value={answers[key]}
          onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
          className={`${baseInputClass} min-h-[80px] resize-y`}
          rows={2}
          placeholder="Describe…"
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5 sm:space-y-6">
          {UNPACKING_QUESTIONS.map(renderQuestion)}
        </div>

        <div>
          <label htmlFor="alignedAction" className="block text-sm font-medium text-zinc-300 mb-1">
            <span className="text-purple-400 font-mono text-xs mr-2">7. Starting move</span>
            Aligned action
          </label>
          <select
            id="alignedAction"
            value={MOVE_OPTIONS.includes(alignedAction as typeof MOVE_OPTIONS[number]) ? alignedAction : (alignedAction ? '__other__' : '')}
            onChange={(e) => {
              const v = e.target.value
              setAlignedAction(v === '__other__' ? '' : v)
            }}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[44px] touch-manipulation"
          >
            <option value="">Choose one…</option>
            {MOVE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
            <option value="__other__">Other (type below)</option>
          </select>
          {(alignedAction === '' || (alignedAction && !MOVE_OPTIONS.includes(alignedAction as typeof MOVE_OPTIONS[number]))) && (
            <input
              type="text"
              value={MOVE_OPTIONS.includes(alignedAction as typeof MOVE_OPTIONS[number]) ? '' : alignedAction}
              onChange={(e) => setAlignedAction(e.target.value)}
              placeholder="Your own aligned action…"
              className="w-full px-4 py-3 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[44px] touch-manipulation text-sm"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Model</label>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Segment</label>
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
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Target nation</label>
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
          <p className="text-xs text-zinc-500 mt-1">Privileges nation-element moves in choices</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Target archetype(s)</label>
          <p className="text-xs text-zinc-500 mb-2">Select all that apply (optional)</p>
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

        <div>
          <label htmlFor="developmentalLens" className="block text-sm font-medium text-zinc-300 mb-2">Developmental lens</label>
          <select
            id="developmentalLens"
            value={developmentalLens ?? ''}
            onChange={(e) => setDevelopmentalLens(e.target.value || null)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[44px] touch-manipulation"
          >
            <option value="">None (generic)</option>
            {FACE_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Expected moves (milestones)</label>
          <div className="flex flex-wrap gap-3 mb-2">
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
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <p className="text-xs text-zinc-500 mt-1">Optional.</p>
        </div>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-zinc-400 hover:text-zinc-300">Player POV (optional)</summary>
          <div className="mt-3 space-y-3 pl-2 border-l-2 border-zinc-700">
            {[
              { key: 'p1' as const, label: 'What do you want to get out of this?' },
              { key: 'p2' as const, label: 'How will you feel when you get it?' },
              { key: 'p3' as const, label: "What's life like for you right now?" },
              { key: 'p4' as const, label: 'How does it feel to be here?' },
              { key: 'p5' as const, label: 'What would have to be true for you to feel this way?' },
              { key: 'p6' as const, label: 'What holds you back?' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-zinc-500 mb-1">{label}</label>
                <input
                  type="text"
                  value={playerPOV[key] ?? ''}
                  onChange={(e) => setPlayerPOV((p) => ({ ...p, [key]: e.target.value || undefined }))}
                  placeholder="Short response…"
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm"
                />
              </div>
            ))}
          </div>
        </details>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={aiStatus === 'pending'}
            onClick={async () => {
              setAiStatus('pending')
              setAiError(null)
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
                setAccepted(false)
                setGenerationCount((c) => c + 1)
              }
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
          >
            {aiStatus === 'pending' ? 'Generating…' : 'Generate with AI'}
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
          >
            Compile (heuristic)
          </button>
        </div>
        {aiError && (
          <div className="p-4 bg-amber-900/20 border border-amber-800 rounded-lg text-amber-600 text-sm">
            {aiError}
          </div>
        )}
      </form>

      {preview && (
        <div className="border border-zinc-700 rounded-xl p-6 bg-zinc-900/40">
          <QuestOutlineReview
            packet={preview}
            accepted={accepted}
            generationCount={generationCount}
            isRegenerating={isRegenerating}
            onAccept={() => setAccepted(true)}
            onReset={() => {
              setPreview(null)
              setAccepted(false)
              setGenerationCount(0)
              setPublishStatus('idle')
              setPublishError(null)
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
                  targetPlaybookId: targetArchetypeIds[0],
                  targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                  developmentalLens: developmentalLens ?? undefined,
                  expectedMoves: parsedMoves.length > 0 ? parsedMoves : undefined,
                  playerPOV: hasPlayerPOV ? playerPOV : undefined,
                  adminFeedback: feedback,
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
            {/* Post-accept actions: export + publish */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-zinc-500">
                Publish to {preview.segmentVariant} variant. Visit{' '}
                <a
                  href={`/campaign/initiation?segment=${preview.segmentVariant}`}
                  className="text-purple-400 hover:text-purple-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  /campaign/initiation?segment={preview.segmentVariant}
                </a>{' '}
                to play.
              </p>
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
                  const segmentsToPublish: SegmentVariant[] =
                    segment === 'both' ? ['player', 'sponsor'] : [segment]
                  let lastError: string | null = null
                  for (const seg of segmentsToPublish) {
                    let packet: SerializableQuestPacket
                    if (seg === preview.segmentVariant) {
                      packet = preview
                    } else {
                      const compiled = await compileQuestWithPrivilegingAction({
                        unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
                        alignedAction,
                        segment: seg,
                        campaignId: 'bruised-banana',
                        questModel,
                        targetNationId: targetNationId ?? undefined,
                        targetPlaybookId: targetArchetypeIds[0],
                        targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
                        developmentalLens: developmentalLens ?? undefined,
                      })
                      if ('error' in compiled) {
                        lastError = compiled.error
                        continue
                      }
                      packet = compiled
                    }
                    const result = await publishQuestPacketToPassages(packet)
                    if (!result.success) lastError = result.error ?? 'Publish failed'
                  }
                  if (!lastError) {
                    setPublishStatus('success')
                  } else {
                    setPublishStatus('error')
                    setPublishError(lastError)
                  }
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {publishStatus === 'pending'
                  ? 'Publishing…'
                  : publishStatus === 'success'
                    ? 'Published'
                    : 'Publish to Campaign'}
              </button>
              {publishError && (
                <p className="text-sm text-red-400">{publishError}</p>
              )}
            </div>
          </QuestOutlineReview>
        </div>
      )}
    </div>
  )
}
