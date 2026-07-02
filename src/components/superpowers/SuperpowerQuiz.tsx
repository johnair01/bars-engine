'use client'

/**
 * SuperpowerQuiz — the discovery intake runner (campaign Phase 2, FR7).
 *
 * Self-contained, deterministic, offline-capable: walks the 12 forced-choice
 * items + the orientation question, then calls submitSuperpowerIntake (stateless
 * scoring — NO database, NO AI) and renders SuperpowerReveal. NO email gate.
 * Accessible: real <button>s, keyboard-operable, a labeled progress indicator.
 *
 * Styling: the dark "OS that contains cards" language (superpower-route handoff).
 * All color flows through --bars-* tokens; motion via superpower-quiz.css.
 * UI_COVENANT: Tailwind/inline for layout only — no hardcoded element hues.
 */
import { useMemo, useState, useTransition, type CSSProperties } from 'react'
import { QUIZ_ITEMS, ORIENTATION_ITEM } from '@/lib/superpowers/quiz/items'
import { submitSuperpowerIntake } from '@/actions/superpower-intake'
import type { QuizAnswer } from '@/lib/superpowers/quiz/types'
import type { SuperpowerOrientation } from '@/lib/superpowers/types'
import type { SuperpowerIntakeOutcome } from '@/lib/superpowers/routing'
import { SuperpowerReveal } from './SuperpowerReveal'

export interface SuperpowerQuizProps {
  /** Optional campaign context, forwarded to the action (reserved for Phase 4). */
  campaignRef?: string
  /**
   * Fired once when scoring resolves, with the full outcome. Additive: the quiz
   * still renders its own reveal. Used by the onboarding funnel to capture the
   * superpower + orientation and advance to the next step.
   */
  onComplete?: (outcome: SuperpowerIntakeOutcome) => void
}

const TOTAL_STEPS = QUIZ_ITEMS.length + 1 // items + orientation

const MONO: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const DISPLAY: CSSProperties = { fontFamily: 'var(--bars-font-display)' }
const BODY: CSSProperties = { fontFamily: 'var(--bars-font-body)' }

export function SuperpowerQuiz({ campaignRef, onComplete }: SuperpowerQuizProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [outcome, setOutcome] = useState<SuperpowerIntakeOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const isOrientationStep = step === QUIZ_ITEMS.length
  const item = isOrientationStep ? null : QUIZ_ITEMS[step]

  const answerList = useMemo<QuizAnswer[]>(
    () => Object.entries(answers).map(([itemId, optionId]) => ({ itemId, optionId })),
    [answers],
  )

  function submit(finalOrientation: SuperpowerOrientation) {
    setError(null)
    startTransition(async () => {
      const res = await submitSuperpowerIntake({
        answers: answerList,
        orientation: finalOrientation,
        campaignRef,
      })
      if (res.ok) {
        setOutcome(res.outcome)
        onComplete?.(res.outcome)
      } else setError(res.error)
    })
  }

  function chooseItemOption(optionId: string) {
    if (!item) return
    setAnswers((prev) => ({ ...prev, [item.id]: optionId }))
    setStep((s) => s + 1)
  }

  function chooseOrientation(value: SuperpowerOrientation) {
    submit(value)
  }

  function restart() {
    setStep(0)
    setAnswers({})
    setOutcome(null)
    setError(null)
  }

  if (outcome) {
    return (
      <div className="mt-6 flex flex-col gap-[18px]">
        <SuperpowerReveal routing={outcome.routing} copy={outcome.copy} />
        <button
          type="button"
          onClick={restart}
          className="sp-ghost self-start text-[10px] uppercase"
          style={{ ...MONO, letterSpacing: '.16em', color: 'var(--bars-text-muted)' }}
        >
          ↺ Retake the quiz
        </button>
      </div>
    )
  }

  const current = Math.min(step + 1, TOTAL_STEPS)
  const pct = Math.round((current / TOTAL_STEPS) * 100)

  const options = item
    ? item.options.map((opt) => ({ label: opt.label, onClick: () => chooseItemOption(opt.id) }))
    : ORIENTATION_ITEM.options.map((opt) => ({
        label: opt.label,
        onClick: () => chooseOrientation(opt.orientation),
      }))
  const situation = item ? item.situation : ORIENTATION_ITEM.prompt

  return (
    <div className="mt-[26px] flex flex-col gap-[22px]">
      {/* Progress */}
      <div className="flex flex-col gap-[7px]">
        <div
          className="flex items-baseline justify-between text-[10px] uppercase"
          style={{ ...MONO, letterSpacing: '.18em', color: 'var(--bars-text-secondary)' }}
        >
          <span>
            Question {current} / {TOTAL_STEPS}
          </span>
          <span className="tabular-nums" style={{ color: 'var(--bars-gold)' }}>
            {pct}%
          </span>
        </div>
        <div
          className="h-[3px] w-full overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(0,0,0,0.4)' }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'var(--bars-gold)',
              boxShadow: '0 0 10px -1px var(--bars-gold)',
              transition: 'width .45s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        </div>
      </div>

      {/* Question card */}
      <fieldset key={`step-${step}`} className="sp-rise m-0 flex flex-col gap-4 border-0 p-0" disabled={pending}>
        {isOrientationStep ? (
          <span
            className="text-[9.5px] uppercase"
            style={{ ...MONO, letterSpacing: '.22em', color: 'var(--bars-liminal-glow)' }}
          >
            Final · Orientation
          </span>
        ) : null}
        <legend
          className="p-0 text-[21px] font-semibold"
          style={{ ...DISPLAY, letterSpacing: '-.01em', lineHeight: 1.28, color: 'var(--bars-text-primary)' }}
        >
          {situation}
        </legend>

        <div className="flex flex-col gap-[10px]">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={opt.onClick}
              className="sp-opt w-full rounded-xl px-4 py-[15px] text-left text-[14.5px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                ...BODY,
                lineHeight: 1.45,
                color: 'var(--bars-text-primary)',
                background: 'var(--bars-surface-card)',
                border: '1px solid var(--bars-line)',
                boxShadow: 'inset 0 1px 0 var(--bars-inset-top)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Footer nav */}
      <div className="flex min-h-[18px] items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={pending}
            className="sp-ghost text-[10px] uppercase disabled:opacity-40"
            style={{ ...MONO, letterSpacing: '.16em', color: 'var(--bars-text-muted)' }}
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        <span
          className="text-[9.5px] uppercase"
          style={{ ...MONO, letterSpacing: '.16em', color: 'var(--bars-text-muted)' }}
        >
          {pending ? 'Reading your spread…' : 'No sign-up · instant result'}
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-sm" style={{ color: 'var(--bars-fire-gem)' }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
