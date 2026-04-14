'use client'

import { useState } from 'react'

/**
 * 3-2-1 Shadow Dialogue — core mechanic for every Clean Up move.
 *
 * Three sequential steps:
 *   "It..." (3rd person — observe the feeling as external)
 *   "You..." (2nd person — address the feeling directly)
 *   "I..."  (1st person — own the feeling as self)
 *
 * Used by all emotional_processing (Clean Up) moves across all nations and archetypes.
 */

type Props = {
  /** The core prompt from the move definition (e.g., "What is this fear trying to protect?") */
  corePrompt: string
  /** Called with the completed 3 responses when the player finishes */
  onComplete: (responses: { it: string; you: string; i: string }) => void
  /** Optional face-voiced framing text */
  framing?: string
  /** NPC-voiced questions that override the generic steps */
  npcQuestions?: {
    framing: string
    it: { instruction: string; placeholder: string }
    you: { instruction: string; placeholder: string }
    i: { instruction: string; placeholder: string }
  }
}

const STEPS = [
  {
    key: 'it' as const,
    label: 'It...',
    instruction: 'Observe the feeling as something outside you. Describe it in the third person.',
    placeholder: 'It is a weight that sits on my chest when I think about...',
  },
  {
    key: 'you' as const,
    label: 'You...',
    instruction: 'Address the feeling directly. Speak to it as "you."',
    placeholder: 'You show up whenever I try to... You want me to...',
  },
  {
    key: 'i' as const,
    label: 'I...',
    instruction: 'Own the feeling as part of yourself. Speak as "I."',
    placeholder: 'I am the part of me that... I need...',
  },
] as const

export function ThreeTwoOneDialogue({ corePrompt, onComplete, framing, npcQuestions }: Props) {
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState({ it: '', you: '', i: '' })

  // Use NPC-voiced questions if provided, otherwise fall back to generic
  const steps = npcQuestions
    ? [
        { key: 'it' as const, label: 'It...', instruction: npcQuestions.it.instruction, placeholder: npcQuestions.it.placeholder },
        { key: 'you' as const, label: 'You...', instruction: npcQuestions.you.instruction, placeholder: npcQuestions.you.placeholder },
        { key: 'i' as const, label: 'I...', instruction: npcQuestions.i.instruction, placeholder: npcQuestions.i.placeholder },
      ]
    : STEPS

  const current = steps[step]
  const isLast = step === steps.length - 1
  const canAdvance = responses[current.key].trim().length > 0

  function handleNext() {
    if (isLast) {
      onComplete(responses)
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="space-y-5">
      {framing && (
        <p className="text-zinc-400 text-sm italic">&ldquo;{framing}&rdquo;</p>
      )}

      <p className="text-zinc-300 text-sm font-medium">{corePrompt}</p>

      {/* Progress */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 h-1 rounded-full transition-colors ${
              i < step ? 'bg-purple-500' : i === step ? 'bg-purple-400' : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Current step */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold text-lg">{current.label}</span>
          <span className="text-zinc-500 text-xs">Step {step + 1} of 3</span>
        </div>

        <p className="text-zinc-400 text-xs">{current.instruction}</p>

        <textarea
          value={responses[current.key]}
          onChange={e =>
            setResponses(prev => ({ ...prev, [current.key]: e.target.value }))
          }
          placeholder={current.placeholder}
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
          autoFocus
        />
      </div>

      {/* Completed steps (read-only) */}
      {step > 0 && (
        <div className="space-y-2 border-t border-zinc-800 pt-3">
          {steps.slice(0, step).map(s => (
            <div key={s.key} className="text-xs">
              <span className="text-purple-400/60 font-medium">{s.label}</span>{' '}
              <span className="text-zinc-500">{responses[s.key]}</span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleNext}
        disabled={!canAdvance}
        className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
      >
        {isLast ? 'Complete Dialogue' : 'Continue'}
      </button>
    </div>
  )
}
