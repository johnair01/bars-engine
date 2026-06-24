'use client'

/**
 * SuperpowerQuiz — the discovery intake runner (campaign Phase 2, FR7).
 *
 * Self-contained, deterministic, offline-capable: walks the 12 forced-choice
 * items + the orientation question, then calls submitSuperpowerIntake (stateless
 * scoring — NO database, NO AI) and renders SuperpowerReveal. NO email gate.
 * Accessible: real <button>s, keyboard-operable, a labeled progress indicator.
 * UI_COVENANT: Tailwind for layout only.
 */
import { useMemo, useState, useTransition } from 'react'
import { QUIZ_ITEMS, ORIENTATION_ITEM } from '@/lib/superpowers/quiz/items'
import { submitSuperpowerIntake } from '@/actions/superpower-intake'
import type { QuizAnswer } from '@/lib/superpowers/quiz/types'
import type { SuperpowerOrientation } from '@/lib/superpowers/types'
import type { SuperpowerIntakeOutcome } from '@/lib/superpowers/routing'
import { SuperpowerReveal } from './SuperpowerReveal'

export interface SuperpowerQuizProps {
  /** Optional campaign context, forwarded to the action (reserved for Phase 4). */
  campaignRef?: string
}

const TOTAL_STEPS = QUIZ_ITEMS.length + 1 // items + orientation

export function SuperpowerQuiz({ campaignRef }: SuperpowerQuizProps) {
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
      if (res.ok) setOutcome(res.outcome)
      else setError(res.error)
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
      <div className="space-y-4">
        <SuperpowerReveal routing={outcome.routing} copy={outcome.copy} />
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={restart}
            className="text-xs underline opacity-70 hover:opacity-100"
          >
            Retake the quiz
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl space-y-5">
      <ProgressIndicator current={step + 1} total={TOTAL_STEPS} />

      {item ? (
        <fieldset className="space-y-3" disabled={pending}>
          <legend className="text-base font-semibold leading-snug">{item.situation}</legend>
          <div className="space-y-2">
            {item.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => chooseItemOption(opt.id)}
                className="block w-full rounded-lg border border-white/15 px-4 py-3 text-left text-sm hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <fieldset className="space-y-3" disabled={pending}>
          <legend className="text-base font-semibold leading-snug">{ORIENTATION_ITEM.prompt}</legend>
          <div className="space-y-2">
            {ORIENTATION_ITEM.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => chooseOrientation(opt.orientation)}
                className="block w-full rounded-lg border border-white/15 px-4 py-3 text-left text-sm hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || pending}
          className="text-xs underline opacity-70 hover:opacity-100 disabled:opacity-30"
        >
          ← Back
        </button>
        {pending ? <span className="text-xs opacity-70">Reading your spread…</span> : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  const pct = Math.round((Math.min(current, total) / total) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs opacity-70">
        <span>
          Question {Math.min(current, total)} of {total}
        </span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded bg-white/10"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="block h-full bg-white/40" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
