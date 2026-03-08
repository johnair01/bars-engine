'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  compileQuestWithPrivilegingAction,
  compileQuestWithAI,
  generateQuestOverviewWithAI,
  publishQuestPacketToPassagesWithSourceQuest,
  createAdventureAndThreadFromTwee,
} from '@/actions/quest-grammar'
import { getAdminWorldData } from '@/actions/admin'
import {
  STEPS,
  FACE_OPTIONS,
  EXPERIENCE_OPTIONS,
  SATISFACTION_OPTIONS,
  DISSATISFACTION_OPTIONS,
  SHADOW_VOICE_OPTIONS,
  MOVE_OPTIONS,
  LIFE_STATE_OPTIONS,
  Q3_SEP,
  baseInputClass,
} from '@/lib/quest-grammar'
import type { UnpackingAnswers, SegmentVariant, SerializableQuestPacket } from '@/lib/quest-grammar'
import type { QuestModel } from '@/app/admin/quest-grammar/UnpackingForm'
import Link from 'next/link'

type QuestForUpgrade = {
  id: string
  title: string
  description?: string | null
  moveType?: string | null
  storyContent?: string | null
}

type Props = {
  questId: string
  quest: QuestForUpgrade
  existingAdventureId?: string | null
}

/** Pre-fill alignedAction from moveType (e.g. "Wake Up" -> "Wake Up") */
function moveTypeToAlignedAction(moveType: string | null | undefined): string {
  if (!moveType) return ''
  const normalized = moveType.trim()
  if (MOVE_OPTIONS.includes(normalized as (typeof MOVE_OPTIONS)[number])) return normalized
  return ''
}

export function UpgradeQuestToCYOAFlow({ questId, quest, existingAdventureId }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [nations, setNations] = useState<{ id: string; name: string }[]>([])
  const [playbooks, setPlaybooks] = useState<{ id: string; name: string }[]>([])
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
  const [overviewResult, setOverviewResult] = useState<{ objectives: string[]; tweeSource: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aiStatus, setAiStatus] = useState<'idle' | 'pending' | 'error'>('idle')
  const [aiError, setAiError] = useState<string | null>(null)
  const [publishStatus, setPublishStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [result, setResult] = useState<{ adventureId: string; threadId: string } | null>(null)

  useEffect(() => {
    getAdminWorldData().then(([nationList, archetypes]) => {
      setNations((nationList as { id: string; name: string }[]).map((n) => ({ id: n.id, name: n.name })))
      // Only canonical archetypes (The Bold Heart, etc.); exclude trigram-named (Earth (Kun), etc.)
      setPlaybooks((archetypes as { id: string; name: string }[])
        .filter((p) => p.name.startsWith('The '))
        .map((p) => ({ id: p.id, name: p.name })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (expanded && quest) {
      setAlignedAction((prev) => prev || moveTypeToAlignedAction(quest.moveType))
      setQ6Context((prev) => prev || (quest.description ?? '').slice(0, 500))
      setAnswers((a) => {
        if (a.q5 || !quest.description) return a
        return { ...a, q5: quest.description!.slice(0, 300) }
      })
    }
  }, [expanded, quest?.id])

  const step = STEPS[stepIndex]
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
        campaignId: 'bruised-banana',
        targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
        developmentalLens: developmentalLens ?? undefined,
        targetNationId: targetNationId ?? undefined,
        targetPlaybookId: targetArchetypeIds[0],
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setPreview(result)
      }
      return
    }
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1)
  }

  function handleBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1)
  }

  function renderInput() {
    if (!step || step.type === 'start' || step.type === 'generate') return null
    if (step.type === 'experience') {
      const val = answers.q1
      return (
        <div className="space-y-2">
          <select
            value={EXPERIENCE_OPTIONS.includes(val as (typeof EXPERIENCE_OPTIONS)[number]) ? val : (val ? '__other__' : '')}
            onChange={(e) => setAnswers((a) => ({ ...a, q1: e.target.value === '__other__' ? '' : e.target.value }))}
            className={baseInputClass}
          >
            <option value="">Choose one…</option>
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
            <option value="__other__">Other</option>
          </select>
          {val && !EXPERIENCE_OPTIONS.includes(val as (typeof EXPERIENCE_OPTIONS)[number]) && (
            <input type="text" value={val} onChange={(e) => setAnswers((a) => ({ ...a, q1: e.target.value }))} placeholder="Your own…" className={`${baseInputClass} text-sm mt-2`} />
          )}
        </div>
      )
    }
    if (step.type === 'multiselect') {
      const key = step.id === 'q2' ? 'q2' : step.id === 'q4' ? 'q4' : 'q6'
      const options = step.options
      const selected = Array.isArray(answers[key]) ? (answers[key] as string[]) : []
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selected.includes(opt)} onChange={(e) => {
                  const next = e.target.checked ? [...selected, opt] : selected.filter((s) => s !== opt)
                  setAnswers((a) => ({ ...a, [key]: next }))
                }} className="rounded border-zinc-600 text-purple-500" />
                <span className="text-sm text-zinc-300">{opt}</span>
              </label>
            ))}
          </div>
          {key === 'q6' && (
            <input type="text" value={q6Context} onChange={(e) => setQ6Context(e.target.value)} placeholder="Quest context (pre-filled from description)" className={`${baseInputClass} text-sm mt-2`} />
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
          <select value={sel} onChange={(e) => {
            const v = e.target.value
            setAnswers((a) => ({ ...a, q3: v ? `${v}${distance ? Q3_SEP + distance : ''}` : (distance ? Q3_SEP + distance : '') }))
          }} className={baseInputClass}>
            <option value="">Choose one…</option>
            {LIFE_STATE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <textarea
            value={distance}
            onChange={(e) => {
              const d = e.target.value
              setAnswers((a) => ({ ...a, q3: sel ? `${sel}${d ? Q3_SEP + d : ''}` : (d ? Q3_SEP + d : '') }))
            }}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                const target = e.target as HTMLTextAreaElement
                const start = target.selectionStart ?? 0
                const end = target.selectionEnd ?? 0
                const newDistance = distance.slice(0, start) + ' ' + distance.slice(end)
                setAnswers((a) => ({ ...a, q3: sel ? `${sel}${newDistance ? Q3_SEP + newDistance : ''}` : (newDistance ? Q3_SEP + newDistance : '') }))
                requestAnimationFrame(() => target.setSelectionRange(start + 1, start + 1))
              }
            }}
            placeholder="How far from your creation? (e.g. not that far)"
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
        <input type="text" value={answers[key] as string} onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))} className={baseInputClass} placeholder="Short response…" />
      )
    }
    if (step.type === 'move') {
      return (
        <div className="space-y-2">
          <select value={MOVE_OPTIONS.includes(alignedAction as (typeof MOVE_OPTIONS)[number]) ? alignedAction : (alignedAction ? '__other__' : '')} onChange={(e) => setAlignedAction(e.target.value === '__other__' ? '' : e.target.value)} className={baseInputClass}>
            <option value="">Choose one…</option>
            {MOVE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
            <option value="__other__">Other</option>
          </select>
          {alignedAction && !MOVE_OPTIONS.includes(alignedAction as (typeof MOVE_OPTIONS)[number]) && (
            <input type="text" value={alignedAction} onChange={(e) => setAlignedAction(e.target.value)} placeholder="Your aligned action…" className={`${baseInputClass} text-sm mt-2`} />
          )}
        </div>
      )
    }
    if (step.type === 'model') {
      return (
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={questModel === 'personal'} onChange={() => setQuestModel('personal')} className="text-purple-500" />
            <span>Personal (6 beats)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={questModel === 'communal'} onChange={() => setQuestModel('communal')} className="text-purple-500" />
            <span>Communal (8 stages)</span>
          </label>
        </div>
      )
    }
    if (step.type === 'segment') {
      return (
        <div className="flex flex-wrap gap-4">
          {(['player', 'sponsor', 'both'] as const).map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={segment === v} onChange={() => setSegment(v)} className="text-purple-500" />
              <span>{v.charAt(0).toUpperCase() + v.slice(1)}</span>
            </label>
          ))}
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
        <div className="flex flex-wrap gap-3">
          {playbooks.map((p) => (
            <label key={p.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={targetArchetypeIds.includes(p.id)} onChange={(e) => {
                const next = e.target.checked ? [...targetArchetypeIds, p.id] : targetArchetypeIds.filter((id) => id !== p.id)
                setTargetArchetypeIds(next)
              }} className="rounded border-zinc-600 text-purple-500" />
              <span className="text-sm text-zinc-300">{p.name}</span>
            </label>
          ))}
        </div>
      )
    }
    if (step.type === 'lens') {
      return (
        <select value={developmentalLens ?? ''} onChange={(e) => setDevelopmentalLens(e.target.value || null)} className={baseInputClass}>
          <option value="">None</option>
          {FACE_OPTIONS.map((k) => (
            <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>
          ))}
        </select>
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
        { key: 'p1' as const, label: 'What do you want?' },
        { key: 'p2' as const, label: 'How will you feel?' },
        { key: 'p3' as const, label: "What's life like now?" },
        { key: 'p4' as const, label: 'How does it feel?' },
        { key: 'p5' as const, label: 'What would have to be true?' },
        { key: 'p6' as const, label: 'What holds you back?' },
      ]
      return (
        <div className="space-y-4">
          {P_LABELS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm text-zinc-400 mb-1">{label}</label>
              <input type="text" value={playerPOV[key] ?? ''} onChange={(e) => setPlayerPOV((p) => ({ ...p, [key]: e.target.value || undefined }))} className={baseInputClass} />
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  if (result) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-400">Upgrade to CYOA</h3>
        <p className="text-sm text-emerald-400">Adventure created. Original quest preserved and linked.</p>
        <Link href={`/admin/adventures/${result.adventureId}`} className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg">
          View Adventure →
        </Link>
      </div>
    )
  }

  if (!expanded) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-zinc-400">Upgrade to CYOA</h3>
        <p className="text-xs text-zinc-500">
          Run the unpacking flow to generate CYOA content. Original quest is preserved and linked.
        </p>
        {existingAdventureId && (
          <p className="text-xs text-amber-500">This quest may already have an Adventure. You can create another.</p>
        )}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg"
        >
          Start unpacking flow
        </button>
      </div>
    )
  }

  if (preview) {
    const effectiveSegment: SegmentVariant = segment === 'both' ? 'player' : segment
    const parsedMoves = [...expectedMovesSelected, ...expectedMovesCustom.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)]
    const hasPlayerPOV = Object.values(playerPOV).some(Boolean)
    const input = {
      unpackingAnswers: { ...answers, q6Context: q6Context || undefined },
      alignedAction,
      segment: effectiveSegment,
      campaignId: 'bruised-banana',
      targetArchetypeIds: targetArchetypeIds.length > 0 ? targetArchetypeIds : undefined,
      developmentalLens: developmentalLens ?? undefined,
      expectedMoves: parsedMoves.length > 0 ? parsedMoves : undefined,
      playerPOV: hasPlayerPOV ? playerPOV : undefined,
    }

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-white">Generate & publish</h3>
        <p className="text-sm text-zinc-400">Choose how to create the Adventure. Both link to the original quest.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={aiStatus === 'pending' || publishStatus === 'pending'}
            onClick={async () => {
              setAiStatus('pending')
              setAiError(null)
              const res = await compileQuestWithAI(input)
              setAiStatus('idle')
              if ('error' in res) {
                setAiError(res.error)
                return
              }
              setPreview(res.packet)
              setPublishStatus('pending')
              const pub = await publishQuestPacketToPassagesWithSourceQuest(res.packet, questId, quest.title)
              setPublishStatus('idle')
              if (pub.success) {
                setResult({ adventureId: pub.adventureId, threadId: pub.threadId })
                router.refresh()
              } else {
                setAiError(pub.error)
              }
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg"
          >
            {aiStatus === 'pending' || publishStatus === 'pending' ? 'Generating…' : 'Path A: Compile with AI & publish'}
          </button>
          <button
            type="button"
            disabled={aiStatus === 'pending' || publishStatus === 'pending'}
            onClick={async () => {
              setAiStatus('pending')
              setAiError(null)
              const res = await generateQuestOverviewWithAI(input)
              setAiStatus('idle')
              if (!res.success) {
                setAiError(res.error)
                return
              }
              setPublishStatus('pending')
              const create = await createAdventureAndThreadFromTwee(res.tweeSource, {
                title: `${quest.title} (CYOA)`,
                slug: `${quest.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-cyoa-${Date.now()}`,
                sourceQuestId: questId,
              })
              setPublishStatus('idle')
              if (create.success) {
                setResult({ adventureId: create.adventureId, threadId: create.threadId })
                router.refresh()
              } else {
                setAiError(create.error)
              }
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-600 text-white text-sm font-medium rounded-lg"
          >
            {aiStatus === 'pending' || publishStatus === 'pending' ? 'Generating…' : 'Path B: Generate skeleton & create'}
          </button>
        </div>
        {aiError && <p className="text-sm text-red-400">{aiError}</p>}
        <button type="button" onClick={() => setPreview(null)} className="text-sm text-zinc-400 hover:text-white">
          Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-zinc-400">Unpacking flow — Upgrade to CYOA</h3>
        <button type="button" onClick={() => setExpanded(false)} className="text-xs text-zinc-500 hover:text-white">
          Collapse
        </button>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Step {stepIndex + 1} of {STEPS.length}</span>
          {stepIndex > 0 && (
            <button type="button" onClick={handleBack} className="text-sm text-zinc-400 hover:text-white">Back</button>
          )}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">{step.title}</h2>
          <p className="text-zinc-300 text-sm mb-4">{step.text}</p>
          {renderInput()}
        </div>
        {error && <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-600 text-sm">{error}</div>}
        <button type="button" onClick={handleContinue} className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg">
          {isGenerateStep ? 'Compile & preview' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
