'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

const STORAGE_KEY = 'shadow321_metadata'

type Phase = 'face' | 'talk' | 'be' | 'prompt'

export type Shadow321FormProps = {
  /** EFA mode: call when 321 done, parent advances to resolution */
  onComplete?: (metadata: Metadata321) => void
  /** EFA mode: hide standalone nav, show resolution CTA */
  embedded?: boolean
  /** Optional: for linkedQuestId in metadata when creating BAR from quest context */
  contextQuestId?: string | null
}

export function Shadow321Form({ onComplete, embedded, contextQuestId }: Shadow321FormProps = {}) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('face')

  const [phase3, setPhase3] = useState<Phase3Taxonomic>({})
  const [answers, setAnswers] = useState<UnpackingAnswers>({
    q1: '',
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

  const handleImportMetadata = () => {
    const metadata = getMetadata()
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(metadata))
    }
    if (embedded && onComplete) {
      window.open('/create-bar?from321=1', '_blank')
      onComplete(metadata)
    } else {
      router.push('/create-bar?from321=1')
    }
  }

  const handleCreateBar = () => {
    if (embedded && onComplete) {
      window.open('/create-bar', '_blank')
      onComplete(getMetadata())
    } else {
      router.push('/create-bar')
    }
  }

  const handleSkipOrContinue = () => {
    if (embedded && onComplete) {
      onComplete(getMetadata())
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
          <textarea
            value={distance}
            onChange={(e) => {
              const d = e.target.value
              setAnswers((a) => ({ ...a, [key]: sel ? `${sel}${d ? Q3_SEP + d : ''}` : (d ? Q3_SEP + d : '') }))
            }}
            placeholder="How far do you feel from your creation?"
            rows={2}
            className={`${baseInputClass} text-sm mt-2 resize-none`}
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
              <label className="block text-sm font-medium text-zinc-300 mb-1">Nation / Archetype</label>
              <input
                type="text"
                value={phase3.nationName ?? ''}
                onChange={(e) => setPhase3((p) => ({ ...p, nationName: e.target.value || undefined }))}
                placeholder="e.g. The Bold Heart"
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
              <textarea
                value={phase1.identification ?? ''}
                onChange={(e) => setPhase1((p) => ({ ...p, identification: e.target.value || undefined }))}
                placeholder="What are you identifying with?"
                rows={3}
                className={baseInputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Integration</label>
              <textarea
                value={phase1.integration ?? ''}
                onChange={(e) => setPhase1((p) => ({ ...p, integration: e.target.value || undefined }))}
                placeholder="How does this integrate?"
                rows={3}
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
          <h2 className="text-xl font-bold text-white">Create a BAR?</h2>
          <p className="text-zinc-400">
            You can turn this 321 session into a BAR. Import metadata to pre-fill the creation form, or create from scratch.
          </p>
          <div className="flex flex-wrap gap-3">
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
              <Link
                href="/"
                className="px-6 py-3 text-zinc-400 hover:text-white transition"
              >
                Skip
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
