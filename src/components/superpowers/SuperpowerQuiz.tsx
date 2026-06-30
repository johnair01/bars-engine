'use client'

/**
 * SuperpowerQuiz — the discovery intake runner, recreated from
 * design_handoff_superpower_route ("QUIZ" block).
 *
 * Walks the 11 forced-choice items + the orientation question, then calls
 * submitSuperpowerIntake (stateless deterministic scoring — NO database, NO AI)
 * and renders SuperpowerReveal. NO email gate. Accessible: real <button>s,
 * keyboard-operable, a labeled progress bar. Visuals use the BARS design tokens
 * (var(--bars-*)); motion chrome lives in src/styles/superpower-quiz.css.
 *
 * The dark radial shell + page header live in /superpower/page.tsx (persistent
 * above both quiz and result); this component owns the quiz body / result.
 */
import { useMemo, useState, useTransition, type CSSProperties } from 'react'
import { QUIZ_ITEMS, ORIENTATION_ITEM } from '@/lib/superpowers/quiz/items'
import { submitSuperpowerIntake } from '@/actions/superpower-intake'
import type { QuizAnswer } from '@/lib/superpowers/quiz/types'
import type { SuperpowerOrientation } from '@/lib/superpowers/types'
import type { SuperpowerIntakeOutcome } from '@/lib/superpowers/routing'
import { QUIZ_GOLD } from '@/lib/superpowers/reveal-presentation'
import { SuperpowerReveal } from './SuperpowerReveal'

const DISPLAY = 'var(--bars-font-display)'
const BODY = 'var(--bars-font-body)'
const MONO = 'var(--bars-font-mono)'

const TOTAL_STEPS = QUIZ_ITEMS.length + 1 // items + orientation

export interface SuperpowerQuizProps {
  /** Optional campaign context, forwarded to the action (reserved for Phase 4). */
  campaignRef?: string
}

export function SuperpowerQuiz({ campaignRef }: SuperpowerQuizProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [outcome, setOutcome] = useState<SuperpowerIntakeOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const isOrientationStep = step >= QUIZ_ITEMS.length
  const item = isOrientationStep ? null : QUIZ_ITEMS[step]

  const answerList = useMemo<QuizAnswer[]>(
    () => Object.entries(answers).map(([itemId, optionId]) => ({ itemId, optionId })),
    [answers],
  )

  function submit(finalOrientation: SuperpowerOrientation) {
    setError(null)
    startTransition(async () => {
      const res = await submitSuperpowerIntake({ answers: answerList, orientation: finalOrientation, campaignRef })
      if (res.ok) setOutcome(res.outcome)
      else setError(res.error)
    })
  }
  function chooseItemOption(optionId: string) {
    if (!item) return
    setAnswers((prev) => ({ ...prev, [item.id]: optionId }))
    setStep((s) => s + 1)
  }
  function restart() {
    setStep(0)
    setAnswers({})
    setOutcome(null)
    setError(null)
  }

  if (outcome) {
    return <SuperpowerReveal routing={outcome.routing} copy={outcome.copy} onRetake={restart} />
  }

  const stepNum = Math.min(step + 1, TOTAL_STEPS)
  const pct = Math.round((stepNum / TOTAL_STEPS) * 100)
  const situation = item ? item.situation : ORIENTATION_ITEM.prompt
  const options = item
    ? item.options.map((o) => ({ id: o.id, label: o.label, onClick: () => chooseItemOption(o.id) }))
    : ORIENTATION_ITEM.options.map((o) => ({ id: o.id, label: o.label, onClick: () => submit(o.orientation) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 26 }}>
      {/* progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...mono(10, 0.18), color: 'var(--bars-text-secondary)' }}>
          <span>Question {stepNum} / {TOTAL_STEPS}</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: QUIZ_GOLD }}>{pct}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ height: 3, width: '100%', borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.4)' }}
        >
          <div style={{ height: '100%', borderRadius: 99, background: QUIZ_GOLD, boxShadow: `0 0 10px -1px ${QUIZ_GOLD}`, transition: 'width .45s cubic-bezier(0.16,1,0.3,1)', width: `${pct}%` }} />
        </div>
      </div>

      {/* question card — re-keyed per step so sp-rise replays */}
      <div key={`step-${step}`} className="sp-rise" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {isOrientationStep && (
          <span style={mono(9.5, 0.22, 'var(--bars-liminal-glow)')}>Final · Orientation</span>
        )}
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.28, fontSize: 21, color: 'var(--bars-text-primary)', textWrap: 'pretty' as never }}>
          {situation}
        </h2>
        <div role="group" aria-label={situation} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt) => (
            <button key={opt.id} type="button" className="sp-opt" onClick={opt.onClick} disabled={pending} style={optionStyle}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* footer nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 18, marginTop: 2 }}>
        {step > 0 && (
          <button type="button" className="sp-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={pending} style={ghostStyle}>
            ← Back
          </button>
        )}
        <span style={{ ...mono(9.5, 0.16, 'var(--bars-text-muted)'), marginLeft: 'auto' }}>
          {pending ? 'Reading your spread…' : 'No sign-up · instant result'}
        </span>
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: BODY, fontSize: 13, color: 'var(--bars-fire-gem)', margin: 0 }}>{error}</p>
      )}
    </div>
  )
}

function mono(size: number, spacing: number, color?: string): CSSProperties {
  return { fontFamily: MONO, fontSize: size, letterSpacing: `${spacing}em`, textTransform: 'uppercase', ...(color ? { color } : {}) }
}

const optionStyle: CSSProperties = {
  appearance: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', boxSizing: 'border-box',
  fontFamily: BODY, fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, color: 'var(--bars-text-primary)',
  background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)', borderRadius: 12, padding: '15px 16px',
  boxShadow: 'inset 0 1px 0 var(--bars-inset-top)', textWrap: 'pretty' as never,
}

const ghostStyle: CSSProperties = {
  appearance: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
  fontFamily: MONO, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)',
}
