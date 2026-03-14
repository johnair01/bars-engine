'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { discoverDaemon } from '@/actions/daemons'

const STEPS = [
  { id: 'face', title: 'Face It', prompt: "What do you want to see more clearly? Name the charge or pattern you're noticing." },
  { id: 'talk', title: 'Talk to It', prompt: "What would it say if it could speak? One or two sentences." },
  { id: 'be', title: 'Be It', prompt: "What's one small step you can take from this place? An aligned action." },
]

export function WakeUp321Form({ playerId }: { playerId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const current = STEPS[step]
  const value = answers[current.id] ?? ''

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1)
    } else {
      setError(null)
      startTransition(async () => {
        const result = await discoverDaemon(playerId, '321_wake_up', {
          name: answers.face ? `From: ${answers.face.slice(0, 30)}...` : undefined,
        })
        if (result.error) {
          setError(result.error)
        } else {
          router.push('/daemons')
          router.refresh()
        }
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-purple-500' : 'bg-zinc-800'}`}
          />
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-2">{current.title}</h2>
        <p className="text-zinc-400 text-sm mb-4">{current.prompt}</p>
        <textarea
          value={value}
          onChange={(e) => setAnswers((a) => ({ ...a, [current.id]: e.target.value }))}
          placeholder="Your response..."
          className="w-full min-h-[120px] rounded-xl border border-zinc-700 bg-zinc-900 text-white p-4 placeholder:text-zinc-500 focus:border-purple-500 focus:outline-none"
          rows={4}
        />
      </div>

      {error && <p className="text-amber-400 text-sm">{error}</p>}

      <div className="flex gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:border-zinc-600"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={isPending}
          className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium disabled:opacity-50"
        >
          {step < STEPS.length - 1 ? 'Next' : isPending ? 'Discovering...' : 'Discover'}
        </button>
      </div>
    </div>
  )
}
