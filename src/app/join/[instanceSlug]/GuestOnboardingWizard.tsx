'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createInstanceNation,
  createInstanceArchetype,
  completeGuestOnboarding,
} from '@/actions/guest-onboarding'

type Step = 'vibe' | 'nation' | 'archetype' | 'confirm' | 'done'

const CHANNELS = [
  { value: 'fear', label: 'Fear', color: 'text-zinc-300', bg: 'border-zinc-500 bg-zinc-800/40' },
  { value: 'sadness', label: 'Sadness', color: 'text-blue-300', bg: 'border-blue-700/50 bg-blue-900/20' },
  { value: 'joy', label: 'Joy', color: 'text-emerald-300', bg: 'border-emerald-700/50 bg-emerald-900/20' },
  { value: 'anger', label: 'Anger', color: 'text-red-300', bg: 'border-red-700/50 bg-red-900/20' },
  { value: 'neutrality', label: 'Neutrality', color: 'text-yellow-300', bg: 'border-yellow-700/50 bg-yellow-900/20' },
]

const ALTITUDES = [
  { value: 'dissatisfied', label: 'Dissatisfied' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'satisfied', label: 'Satisfied' },
]

const ELEMENTS = [
  { value: 'metal', label: 'Metal', hint: 'fear / precision' },
  { value: 'water', label: 'Water', hint: 'sadness / depth' },
  { value: 'wood', label: 'Wood', hint: 'joy / growth' },
  { value: 'fire', label: 'Fire', hint: 'anger / passion' },
  { value: 'earth', label: 'Earth', hint: 'neutrality / stability' },
]

interface Props {
  instanceId: string
  instanceName: string
}

export function GuestOnboardingWizard({ instanceId, instanceName }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('vibe')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Step 1 — vibe
  const [channel, setChannel] = useState('')
  const [altitude, setAltitude] = useState('')
  const [intention, setIntention] = useState('')

  // Step 2 — nation
  const [nationName, setNationName] = useState('')
  const [element, setElement] = useState('')
  const [nationVibe, setNationVibe] = useState('')
  const [nationId, setNationId] = useState<string | null>(null)
  const [creatingNation, setCreatingNation] = useState(false)

  // Step 3 — archetype
  const [archetypeName, setArchetypeName] = useState('')
  const [centralConflict, setCentralConflict] = useState('')
  const [primaryQuestion, setPrimaryQuestion] = useState('')
  const [archetypeVibe, setArchetypeVibe] = useState('')
  const [archetypeId, setArchetypeId] = useState<string | null>(null)
  const [creatingArchetype, setCreatingArchetype] = useState(false)

  // Step 4 — result
  const [personalBars, setPersonalBars] = useState<{ title: string; description: string }[]>([])

  const handleCreateNation = () => {
    setError(null)
    setCreatingNation(true)
    startTransition(async () => {
      try {
        const result = await createInstanceNation({
          instanceId,
          nationName,
          element,
          vibeText: nationVibe,
        })
        if ('error' in result) {
          setError(result.error ?? 'Failed to create nation')
          setCreatingNation(false)
          return
        }
        setNationId(result.nation.id)
        setCreatingNation(false)
        setStep('archetype')
      } catch {
        setError('Failed to create nation — try again.')
        setCreatingNation(false)
      }
    })
  }

  const handleCreateArchetype = () => {
    setError(null)
    setCreatingArchetype(true)
    startTransition(async () => {
      try {
        const result = await createInstanceArchetype({
          instanceId,
          archetypeName,
          centralConflict,
          primaryQuestion,
          vibe: archetypeVibe,
        })
        if ('error' in result) {
          setError(result.error ?? 'Failed to create archetype')
          setCreatingArchetype(false)
          return
        }
        setArchetypeId(result.archetype.id)
        setCreatingArchetype(false)
        setStep('confirm')
      } catch {
        setError('Failed to create archetype — try again.')
        setCreatingArchetype(false)
      }
    })
  }

  const handleComplete = () => {
    if (!nationId || !archetypeId) return
    setError(null)
    startTransition(async () => {
      try {
        const result = await completeGuestOnboarding({
          instanceId,
          nationId,
          archetypeId,
          channel,
          altitude,
          intention,
          archetypeName,
        })
        if ('error' in result) {
          setError(result.error ?? 'Failed to complete onboarding')
          return
        }
        setPersonalBars(result.personalBars ?? [])
        setStep('done')
      } catch {
        setError('Something went wrong — try again.')
      }
    })
  }

  // Step 1: Vibe check
  if (step === 'vibe') {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 1 of 4 — Vibe Check</p>
          <h2 className="text-lg font-bold text-white">How are you showing up today?</h2>
          <p className="text-xs text-zinc-500 mt-1">Welcome to {instanceName}. Let&apos;s start with how you&apos;re feeling.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-2">Current emotional channel</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setChannel(c.value)}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition ${
                    channel === c.value
                      ? `${c.bg} ${c.color}`
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-2">Altitude</label>
            <div className="flex gap-2">
              {ALTITUDES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setAltitude(a.value)}
                  className={`flex-1 py-2 rounded-lg border text-sm transition ${
                    altitude === a.value
                      ? 'border-indigo-500 bg-indigo-900/20 text-indigo-300'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">One-word intention for today</label>
            <input
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="e.g. courage, rest, connection"
              maxLength={30}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <button
          onClick={() => setStep('nation')}
          disabled={!channel || !altitude || !intention.trim()}
          className="w-full py-2.5 rounded-lg bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium hover:bg-emerald-700/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Create Your Nation →
        </button>
      </div>
    )
  }

  // Step 2: Custom nation
  if (step === 'nation') {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 2 of 4 — Your Nation</p>
          <h2 className="text-lg font-bold text-white">Create your nation</h2>
          <p className="text-xs text-zinc-500 mt-1">AI will generate lore from your inputs.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Nation name</label>
            <input
              value={nationName}
              onChange={(e) => setNationName(e.target.value)}
              placeholder="e.g. The Verdant Threshold"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-2">Element</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ELEMENTS.map((el) => (
                <button
                  key={el.value}
                  onClick={() => setElement(el.value)}
                  className={`py-2.5 px-3 rounded-lg border text-left transition ${
                    element === el.value
                      ? 'border-amber-500 bg-amber-900/20 text-amber-300'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="text-xs font-medium">{el.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{el.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Describe the vibe of your nation</label>
            <textarea
              value={nationVibe}
              onChange={(e) => setNationVibe(e.target.value)}
              placeholder="A place where people gather to rebuild after loss, forged in shared grief but reaching toward joy…"
              rows={3}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setStep('vibe')}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            ← Back
          </button>
          <button
            onClick={handleCreateNation}
            disabled={!nationName || !element || !nationVibe.trim() || creatingNation || isPending}
            className="flex-1 py-2.5 rounded-lg bg-amber-800/40 border border-amber-700/50 text-amber-300 text-sm font-medium hover:bg-amber-700/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creatingNation ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                Generating lore…
              </span>
            ) : (
              'Generate nation →'
            )}
          </button>
        </div>
      </div>
    )
  }

  // Step 3: Custom archetype
  if (step === 'archetype') {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 3 of 4 — Your Archetype</p>
          <h2 className="text-lg font-bold text-white">Create your archetype</h2>
          <p className="text-xs text-zinc-500 mt-1">Your playbook — the emotional pattern you embody.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Archetype name</label>
            <input
              value={archetypeName}
              onChange={(e) => setArchetypeName(e.target.value)}
              placeholder="e.g. The Reluctant Spark"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Central conflict</label>
            <input
              value={centralConflict}
              onChange={(e) => setCentralConflict(e.target.value)}
              placeholder="e.g. Wanting to lead but fearing the spotlight"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Primary question this archetype lives with</label>
            <input
              value={primaryQuestion}
              onChange={(e) => setPrimaryQuestion(e.target.value)}
              placeholder="e.g. What would I do if I wasn't afraid of being seen?"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Vibe / energy of this archetype</label>
            <textarea
              value={archetypeVibe}
              onChange={(e) => setArchetypeVibe(e.target.value)}
              placeholder="e.g. Quiet intensity. Moves slowly until suddenly they don't."
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setStep('nation')}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            ← Back
          </button>
          <button
            onClick={handleCreateArchetype}
            disabled={
              !archetypeName ||
              !centralConflict ||
              !primaryQuestion ||
              !archetypeVibe.trim() ||
              creatingArchetype ||
              isPending
            }
            className="flex-1 py-2.5 rounded-lg bg-indigo-800/40 border border-indigo-700/50 text-indigo-300 text-sm font-medium hover:bg-indigo-700/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {creatingArchetype ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                Generating archetype…
              </span>
            ) : (
              'Generate archetype →'
            )}
          </button>
        </div>
      </div>
    )
  }

  // Step 4: Confirmation
  if (step === 'confirm') {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Step 4 of 4 — Welcome</p>
          <h2 className="text-lg font-bold text-white">Your character is ready</h2>
        </div>

        <div className="space-y-3">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 text-sm">
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Nation</span>
              <p className="text-white font-medium mt-0.5">{nationName}</p>
              <p className="text-xs text-zinc-400">{element} element</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 text-sm">
            <div>
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Archetype</span>
              <p className="text-white font-medium mt-0.5">{archetypeName}</p>
              <p className="text-xs text-zinc-400">{centralConflict}</p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-1 text-sm">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">Intention</span>
            <p className="text-zinc-300 mt-0.5 capitalize">{channel} · {altitude} · {intention}</p>
          </div>

          <p className="text-xs text-zinc-600 text-center">
            AI will generate 1–2 personal BARs for you after joining.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          onClick={handleComplete}
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium hover:bg-emerald-700/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              Joining…
            </span>
          ) : (
            'Join the game →'
          )}
        </button>
      </div>
    )
  }

  // Done
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <p className="text-emerald-400 text-lg font-semibold">You&apos;re in.</p>
        <p className="text-zinc-400 text-sm">
          Welcome to <span className="text-white">{instanceName}</span>.
        </p>
      </div>

      {personalBars.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase tracking-widest text-center">Your Personal BARs</p>
          {personalBars.map((bar, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <p className="text-sm font-semibold text-white">{bar.title}</p>
              <p className="text-xs text-zinc-400 mt-1">{bar.description}</p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => router.push('/')}
        className="w-full py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition"
      >
        Go to dashboard →
      </button>
    </div>
  )
}
