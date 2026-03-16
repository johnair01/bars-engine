'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'vibe' | 'goals' | 'review' | 'creating' | 'done'

const DOMAIN_OPTIONS = [
  { value: 'GATHERING_RESOURCES', label: 'Gathering Resources' },
  { value: 'DIRECT_ACTION', label: 'Direct Action' },
  { value: 'RAISE_AWARENESS', label: 'Raise Awareness' },
  { value: 'SKILLFUL_ORGANIZING', label: 'Skillful Organizing' },
]

const ENERGY_OPTIONS = ['chill', 'medium', 'high-energy']
const VIBE_SUGGESTIONS = [
  'joyful',
  'chaotic',
  'intimate',
  'electric',
  'reflective',
  'playful',
  'fierce',
  'tender',
]

export function InstanceCreationWizard({ copyFromSlug }: { copyFromSlug?: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('vibe')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Vibe data
  const [birthdayName, setBirthdayName] = useState('')
  const [vibeWords, setVibeWords] = useState<string[]>([])
  const [vibeInput, setVibeInput] = useState('')
  const [desiredFeeling, setDesiredFeeling] = useState('')
  const [energyLevel, setEnergyLevel] = useState('medium')

  // Goal data
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [secondaryGoals, setSecondaryGoals] = useState(['', '', ''])
  const [domainType, setDomainType] = useState('GATHERING_RESOURCES')
  const [campaignDuration, setCampaignDuration] = useState('one evening')

  // Derived
  const slugBase = birthdayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
  const slug = `${slugBase}-birthday`
  const instanceName = birthdayName ? `${birthdayName}'s Birthday` : 'Birthday Instance'

  const addVibeWord = (word: string) => {
    const trimmed = word.trim().toLowerCase()
    if (trimmed && !vibeWords.includes(trimmed) && vibeWords.length < 6) {
      setVibeWords([...vibeWords, trimmed])
    }
    setVibeInput('')
  }

  const handleCreate = () => {
    setError(null)
    setStep('creating')
    startTransition(async () => {
      try {
        const res = await fetch('/api/lobby/create-instance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            name: instanceName,
            vibeData: { birthdayPersonName: birthdayName, vibeWords, desiredFeeling, energyLevel },
            goalData: {
              primaryGoal,
              secondaryGoals: secondaryGoals.filter(Boolean),
              domainType,
              campaignDuration,
            },
            sourceInstanceId: copyFromSlug ?? undefined,
          }),
        })
        const json = (await res.json()) as {
          instanceId?: string
          slug?: string
          barsGenerated?: number
          error?: string
        }
        if (json.error) {
          setError(json.error)
          setStep('review')
          return
        }
        setStep('done')
        setTimeout(() => router.push('/lobby'), 2000)
      } catch {
        setError('Network error — try again.')
        setStep('review')
      }
    })
  }

  if (step === 'vibe') {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Step 1 of 3 — Vibe Interview
          </p>
          <h2 className="text-lg font-bold text-white">What&apos;s the vibe?</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Birthday person&apos;s name</label>
            <input
              value={birthdayName}
              onChange={(e) => setBirthdayName(e.target.value)}
              placeholder="e.g. JJ"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Vibe words (up to 6)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {vibeWords.map((w) => (
                <span
                  key={w}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300"
                >
                  {w}
                  <button
                    onClick={() => setVibeWords(vibeWords.filter((v) => v !== w))}
                    className="text-zinc-500 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={vibeInput}
                onChange={(e) => setVibeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addVibeWord(vibeInput)
                  }
                }}
                placeholder="Type a word + enter"
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
              />
              <button
                onClick={() => addVibeWord(vibeInput)}
                className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {VIBE_SUGGESTIONS.filter((s) => !vibeWords.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addVibeWord(s)}
                  className="px-2 py-0.5 rounded-full border border-zinc-700 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">I want guests to feel…</label>
            <textarea
              value={desiredFeeling}
              onChange={(e) => setDesiredFeeling(e.target.value)}
              placeholder="e.g. seen, energized, and part of something bigger"
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-2">Energy level</label>
            <div className="flex gap-2">
              {ENERGY_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEnergyLevel(e)}
                  className={`flex-1 py-2 rounded-lg border text-sm transition ${
                    energyLevel === e
                      ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setStep('goals')}
          disabled={!birthdayName || vibeWords.length === 0 || !desiredFeeling}
          className="w-full py-2.5 rounded-lg bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium hover:bg-emerald-700/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next: Campaign Goals →
        </button>
      </div>
    )
  }

  if (step === 'goals') {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Step 2 of 3 — Campaign Goals
          </p>
          <h2 className="text-lg font-bold text-white">
            What do you want this game to accomplish?
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Primary goal (one sentence)</label>
            <input
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g. Help JJ's friends reconnect and celebrate her courage"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">
              Secondary goals (optional, up to 3)
            </label>
            <div className="space-y-2">
              {secondaryGoals.map((g, i) => (
                <input
                  key={i}
                  value={g}
                  onChange={(e) => {
                    const updated = [...secondaryGoals]
                    updated[i] = e.target.value
                    setSecondaryGoals(updated)
                  }}
                  placeholder={`Goal ${i + 2}`}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-2">Domain type</label>
            <div className="grid grid-cols-2 gap-2">
              {DOMAIN_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDomainType(d.value)}
                  className={`py-2 px-3 rounded-lg border text-xs text-left transition ${
                    domainType === d.value
                      ? 'border-indigo-500 bg-indigo-900/20 text-indigo-300'
                      : 'border-zinc-700 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Campaign duration</label>
            <input
              value={campaignDuration}
              onChange={(e) => setCampaignDuration(e.target.value)}
              placeholder="e.g. one evening, a week"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setStep('vibe')}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            ← Back
          </button>
          <button
            onClick={() => setStep('review')}
            disabled={!primaryGoal}
            className="flex-1 py-2.5 rounded-lg bg-indigo-800/40 border border-indigo-700/50 text-indigo-300 text-sm font-medium hover:bg-indigo-700/40 transition disabled:opacity-40"
          >
            Review →
          </button>
        </div>
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Step 3 of 3 — Review
          </p>
          <h2 className="text-lg font-bold text-white">Ready to create?</h2>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3 text-sm">
          <div>
            <span className="text-zinc-500">Instance name:</span>{' '}
            <span className="text-white font-medium">{instanceName}</span>
          </div>
          <div>
            <span className="text-zinc-500">Slug:</span>{' '}
            <span className="font-mono text-zinc-300">/{slug}</span>
          </div>
          <div>
            <span className="text-zinc-500">Vibe:</span>{' '}
            <span className="text-zinc-300">{vibeWords.join(', ')}</span>
          </div>
          <div>
            <span className="text-zinc-500">Goal:</span>{' '}
            <span className="text-zinc-300">{primaryGoal}</span>
          </div>
          <div>
            <span className="text-zinc-500">Domain:</span>{' '}
            <span className="text-zinc-300">{domainType}</span>
          </div>
          <div className="text-xs text-zinc-600 pt-1">
            AI will generate 3–5 draft campaign BARs after creation.
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setStep('goals')}
            className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition"
          >
            ← Back
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg bg-emerald-800/40 border border-emerald-700/50 text-emerald-300 text-sm font-medium hover:bg-emerald-700/40 transition disabled:opacity-40"
          >
            {isPending ? 'Creating…' : 'Create instance →'}
          </button>
        </div>
      </div>
    )
  }

  if (step === 'creating') {
    return (
      <div className="flex items-center gap-3 py-8">
        <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-sm text-zinc-400">Creating instance + generating BARs…</p>
      </div>
    )
  }

  return (
    <div className="py-8 text-center space-y-3">
      <p className="text-emerald-400 text-lg font-semibold">Instance created</p>
      <p className="text-zinc-500 text-sm">Redirecting to lobby…</p>
    </div>
  )
}
