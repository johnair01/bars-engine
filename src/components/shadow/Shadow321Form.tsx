'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  UNPACKING_QUESTIONS,
  EXPERIENCE_OPTIONS,
  LIFE_STATE_OPTIONS,
  Q3_SEP,
  FACE_OPTIONS,
  baseInputClass,
  deriveMetadata321,
} from '@/lib/quest-grammar'
import type { UnpackingAnswers, Metadata321 } from '@/lib/quest-grammar'
import type { Phase3Taxonomic, Phase1Identification } from '@/lib/quest-grammar'
import { createQuestFrom321Metadata, fuelSystemFrom321, persist321Session } from '@/actions/charge-metabolism'

const STORAGE_KEY = 'shadow321_metadata'
const STORAGE_SESSION_KEY = 'shadow321_session'

type Phase = 'face' | 'talk' | 'be' | 'prompt'

export type Shadow321FormProps = {
  /** EFA mode: call when 321 done, parent advances to resolution */
  onComplete?: (metadata: Metadata321) => void
  /** EFA mode: hide standalone nav, show resolution CTA */
  embedded?: boolean
  /** Optional: for linkedQuestId in metadata when creating BAR from quest context */
  contextQuestId?: string | null
  /** Optional: prefill q1 (experience) from charge BAR when launched via run321FromCharge */
  initialQ1?: string
}

export function Shadow321Form({ onComplete, embedded, contextQuestId, initialQ1 }: Shadow321FormProps = {}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [chargeError, setChargeError] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('face')

  const [phase3, setPhase3] = useState<Phase3Taxonomic>({})
  const [answers, setAnswers] = useState<UnpackingAnswers>({
    q1: initialQ1 ?? '',
    q2: [],
    q3: '',
    q4: [],
    q5: '',
    q6: [],
  })
  const [alignedAction, setAlignedAction] = useState('')
  const [phase1, setPhase1] = useState<Phase1Identification>({})
  const [q6Context, setQ6Context] = useState('')

  const getMetadata = (): Metadata321 => deriveMetadata321(
    phase3,
    { ...answers, q6Context: q6Context || undefined, alignedAction },
    phase1,
    contextQuestId ?? undefined
  )

  const store321SessionForCreateBar = () => {
    if (typeof window !== 'undefined') {
      const metadata = getMetadata()
      const phase2 = { ...answers, q6Context: q6Context || undefined, alignedAction }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(metadata))
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({
        phase3Snapshot: JSON.stringify(phase3),
        phase2Snapshot: JSON.stringify(phase2),
      }))
    }
  }

  const handleImportMetadata = () => {
    const metadata = getMetadata()
    store321SessionForCreateBar()
    toast.success('Taking you to create your BAR. Your 321 metadata is ready.')
    if (embedded && onComplete) {
      window.open('/create-bar?from321=1', '_blank')
      onComplete(metadata)
    } else {
      router.push('/create-bar?from321=1')
    }
  }

  const handleCreateBar = () => {
    store321SessionForCreateBar()
    toast.success('Taking you to create your BAR. Your 321 metadata is ready.')
    if (embedded && onComplete) {
      window.open('/create-bar?from321=1', '_blank')
      onComplete(getMetadata())
    } else {
      router.push('/create-bar?from321=1')
    }
  }

  const handleSkipOrContinue = () => {
    if (embedded && onComplete) {
      onComplete(getMetadata())
    }
  }

  const handleTurnIntoQuest = () => {
    setChargeError(null)
    startTransition(async () => {
      const metadata = getMetadata()
      const phase2 = { ...answers, q6Context: q6Context || undefined, alignedAction }
      const res = await createQuestFrom321Metadata(metadata, phase2, phase3)
      if (res && 'error' in res) {
        setChargeError(res.error)
        toast.error(res.error)
      } else if (res?.success) {
        toast.success('Quest created! Place it in a thread or contribute to the gameboard.')
        if (embedded && onComplete) {
          onComplete(metadata)
        } else {
          router.push(`/hand?quest=${res.questId}`)
          router.refresh()
        }
      }
    })
  }

  const handleFuelSystem = () => {
    setChargeError(null)
    startTransition(async () => {
      const metadata = getMetadata()
      const res = await fuelSystemFrom321(metadata)
      if (res && 'error' in res) {
        setChargeError(res.error)
        toast.error(res.error)
      } else if (res?.success) {
        toast.success('Charge fueled the system. Your insight was recorded.')
        if (embedded && onComplete) {
          onComplete(metadata)
        } else {
          router.push('/')
          router.refresh()
        }
      }
    })
  }

  const handleSkip = () => {
    setChargeError(null)
    startTransition(async () => {
      const phase3Snapshot = JSON.stringify(phase3)
      const phase2Snapshot = JSON.stringify({ ...answers, q6Context: q6Context || undefined, alignedAction })
      await persist321Session({
        phase3Snapshot,
        phase2Snapshot,
        outcome: 'skipped',
      })
      toast.success('321 skipped. Your charge is preserved.')
      router.push('/')
      router.refresh()
    })
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
            value={options.includes(answers[key] as (typeof options)[number]) ? answers[key] : (answers[key] ? '__other__' : '')}
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
          {(answers[key] === '' || (answers[key] && !options.includes(answers[key] as (typeof options)[number]))) && (
            <input
              type="text"
              value={options.includes(answers[key] as (typeof options)[number]) ? '' : answers[key]}
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
      const sel = LIFE_STATE_OPTIONS.includes(lifeState as (typeof LIFE_STATE_OPTIONS)[number]) ? lifeState : ''
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
          <input
            type="text"
            value={distance}
            onChange={(e) => {
              const d = e.target.value
              setAnswers((a) => ({ ...a, [key]: sel ? `${sel}${d ? Q3_SEP + d : ''}` : (d ? Q3_SEP + d : '') }))
            }}
            placeholder="How far do you feel from your creation?"
            className={`${baseInputClass} text-sm mt-2`}
          />
        </div>
      )
    }
    if (type === 'multiselect') {
      const options = item.options!
      const selected = Array.isArray(answers[key]) ? (answers[key] as string[]) : []
      const isQ6 = key === 'q6'
      return (
        <div key={key} className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            <span className="text-purple-400 font-mono text-xs mr-2">{semantic}</span>
            {label}
          </label>
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
      {!embedded && (
      <div className="flex gap-2 text-sm text-zinc-500">
        <span className={phase === 'face' ? 'text-purple-400' : ''}>3. Face It</span>
        <span>→</span>
        <span className={phase === 'talk' ? 'text-purple-400' : ''}>2. Talk to It</span>
        <span>→</span>
        <span className={phase === 'be' ? 'text-purple-400' : ''}>1. Be It</span>
      </div>
      )}

      {phase === 'face' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Face It — Taxonomic Layer</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                What nation, archetype, or energy does this connect to?
              </label>
              <input
                type="text"
                value={phase3.identityFreeText ?? ''}
                onChange={(e) => setPhase3((p) => ({ ...p, identityFreeText: e.target.value || undefined }))}
                placeholder="Free type — describe in your own words. We'll figure it out when you create a BAR."
                className={baseInputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Developmental Lens</label>
              <select
                value={phase3.developmentalLens ?? ''}
                onChange={(e) => setPhase3((p) => ({ ...p, developmentalLens: e.target.value || undefined }))}
                className={baseInputClass}
              >
                <option value="">None</option>
                {FACE_OPTIONS.map((key) => (
                  <option key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Gender of Personified Charge</label>
              <input
                type="text"
                value={phase3.genderOfCharge ?? ''}
                onChange={(e) => setPhase3((p) => ({ ...p, genderOfCharge: e.target.value || undefined }))}
                placeholder="Optional"
                className={baseInputClass}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhase('talk')}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg"
          >
            Next: Talk to It
          </button>
        </div>
      )}

      {phase === 'talk' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Talk to It — 6 Unpacking Questions</h2>
          <div className="space-y-5">
            {UNPACKING_QUESTIONS.map(renderQuestion)}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">7. Aligned Action</label>
            <select
              value={alignedAction}
              onChange={(e) => setAlignedAction(e.target.value)}
              className={baseInputClass}
            >
              <option value="">Choose one…</option>
              <option value="Wake Up">Wake Up</option>
              <option value="Clean Up">Clean Up</option>
              <option value="Grow Up">Grow Up</option>
              <option value="Show Up">Show Up</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase('face')}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setPhase('be')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg"
            >
              Next: Be It
            </button>
          </div>
        </div>
      )}

      {phase === 'be' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Be It — Identification & Integration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Identification</label>
              <input
                type="text"
                value={phase1.identification ?? ''}
                onChange={(e) => setPhase1((p) => ({ ...p, identification: e.target.value || undefined }))}
                placeholder="What are you identifying with?"
                className={baseInputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Integration</label>
              <input
                type="text"
                value={phase1.integration ?? ''}
                onChange={(e) => setPhase1((p) => ({ ...p, integration: e.target.value || undefined }))}
                placeholder="How does this integrate?"
                className={baseInputClass}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPhase('talk')}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setPhase('prompt')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg"
            >
              Complete 321
            </button>
          </div>
        </div>
      )}

      {phase === 'prompt' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">What next?</h2>
          <p className="text-zinc-400">
            Turn this charge into a BAR, a quest, or fuel the system. Or skip.
          </p>
          {chargeError && (
            <div className="text-sm text-red-400 bg-red-950/30 px-3 py-2 rounded-lg">{chargeError}</div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleTurnIntoQuest}
              disabled={isPending}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg disabled:opacity-50"
            >
              {isPending ? '…' : 'Turn into Quest'}
            </button>
            <button
              type="button"
              onClick={handleFuelSystem}
              disabled={isPending}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg disabled:opacity-50"
            >
              Fuel System
            </button>
            <button
              type="button"
              onClick={handleImportMetadata}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg"
            >
              Create BAR (Import metadata)
            </button>
            <button
              type="button"
              onClick={handleCreateBar}
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg"
            >
              Create BAR (from scratch)
            </button>
            {embedded && onComplete ? (
              <button
                type="button"
                onClick={handleSkipOrContinue}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg"
              >
                Continue to resolution
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkip}
                disabled={isPending}
                className="px-6 py-3 text-zinc-400 hover:text-white transition disabled:opacity-50"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
