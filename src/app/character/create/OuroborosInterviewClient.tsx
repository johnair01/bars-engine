'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { advanceOuroborosInterview } from '@/actions/ouroboros-interview'
import type { OuroborosInterviewState, OuroborosNodeId } from '@/lib/ouroboros-interview'

const LENS_OPTIONS = [
  { value: 'understanding', label: 'Understanding', desc: 'I want to see more clearly' },
  { value: 'connecting', label: 'Connecting', desc: 'I want to relate better' },
  { value: 'acting', label: 'Acting', desc: 'I want to do more effectively' },
]

type Props = {
  playerId: string
  state: OuroborosInterviewState
  nations: { id: string; name: string; description: string }[]
  archetypes: { id: string; name: string; description: string }[]
  playbookMoves: { id: string; name: string; description: string }[]
  domains: readonly { key: string; label: string; short: string }[]
}

export function OuroborosInterviewClient({
  playerId,
  state,
  nations,
  archetypes,
  playbookMoves,
  domains,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const nodeId = state.currentNodeId

  const handleAdvance = (answer: Record<string, unknown>) => {
    startTransition(async () => {
      await advanceOuroborosInterview(playerId, nodeId, answer)
      router.refresh()
    })
  }

  // OUROBOROS_COMPLETE — summary and done
  if (nodeId === 'OUROBOROS_COMPLETE') {
    const nation = nations.find((n) => n.id === state.answers.nationId)
    const archetype = archetypes.find((a) => a.id === state.answers.archetypeId)
    const selectedDomains = (state.answers.domainPreference ?? [])
      .map((k) => domains.find((d) => d.key === k)?.label)
      .filter(Boolean)

    return (
      <div className="space-y-6">
        <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">
          Character Created
        </div>
        <h1 className="text-3xl font-bold text-white">Your Contribution</h1>
        <p className="text-zinc-400">
          Your character is set. Quests in your domain await.
        </p>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          {nation && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Nation</div>
              <div className="font-medium text-white">{nation.name}</div>
            </div>
          )}
          {archetype && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Archetype</div>
              <div className="font-medium text-white">{archetype.name}</div>
            </div>
          )}
          {selectedDomains.length > 0 && (
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Campaign Path</div>
              <div className="font-medium text-white">{selectedDomains.join(', ')}</div>
            </div>
          )}
        </div>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
        >
          Go to Dashboard →
        </Link>
      </div>
    )
  }

  // OUROBOROS_START
  if (nodeId === 'OUROBOROS_START') {
    return (
      <div className="space-y-6">
        <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">
          Ouroboros Interview
        </div>
        <h1 className="text-3xl font-bold text-white">Discover Your Character</h1>
        <p className="text-zinc-400">
          A reflective interview to guide you through Nation, Archetype, and your most effective
          contribution. The snake eating its tail — discovery feeds creation.
        </p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => handleAdvance({})}
            disabled={isPending}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Starting...' : 'Begin'}
          </button>
        </div>
      </div>
    )
  }

  // OUROBOROS_LENS
  if (nodeId === 'OUROBOROS_LENS') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">What draws you most right now?</h2>
        <p className="text-zinc-400 text-sm">Choose the developmental lens that resonates.</p>
        <div className="space-y-2">
          {LENS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAdvance({ lens: opt.value })}
              disabled={isPending}
              className="block w-full text-left p-4 rounded-xl border border-zinc-800 hover:border-purple-500/50 bg-zinc-900/50 transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-white">{opt.label}</div>
              <div className="text-sm text-zinc-500">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // OUROBOROS_NATION
  if (nodeId === 'OUROBOROS_NATION') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Choose your Nation</h2>
        <p className="text-zinc-400 text-sm">Each nation channels a different element and energy.</p>
        <div className="space-y-2">
          {nations.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleAdvance({ nationId: n.id })}
              disabled={isPending}
              className="block w-full text-left p-4 rounded-xl border border-zinc-800 hover:border-purple-500/50 bg-zinc-900/50 transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-white">{n.name}</div>
              <div className="text-sm text-zinc-500 line-clamp-2">{n.description}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // OUROBOROS_ARCHETYPE
  if (nodeId === 'OUROBOROS_ARCHETYPE') {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Choose your Archetype</h2>
        <p className="text-zinc-400 text-sm">Your archetype defines your identity and playbook of moves.</p>
        <div className="space-y-2">
          {archetypes.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleAdvance({ archetypeId: a.id })}
              disabled={isPending}
              className="block w-full text-left p-4 rounded-xl border border-zinc-800 hover:border-purple-500/50 bg-zinc-900/50 transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-white">{a.name}</div>
              <div className="text-sm text-zinc-500 line-clamp-2">{a.description}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // OUROBOROS_PLAYBOOK
  if (nodeId === 'OUROBOROS_PLAYBOOK') {
    const archetype = archetypes.find((a) => a.id === state.answers.archetypeId)
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Your Playbook</h2>
        <p className="text-zinc-400 text-sm">
          Moves available to {archetype?.name ?? 'your archetype'}. Use these when completing quests.
        </p>
        {playbookMoves.length > 0 ? (
          <div className="space-y-2">
            {playbookMoves.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50"
              >
                <div className="font-medium text-white">{m.name}</div>
                <div className="text-sm text-zinc-500">{m.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm italic">
            No archetype-specific moves yet. Your nation moves are available when you complete quests.
          </p>
        )}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => handleAdvance({})}
            disabled={isPending}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Continuing...' : 'Continue'}
          </button>
        </div>
      </div>
    )
  }

  // OUROBOROS_DOMAIN
  if (nodeId === 'OUROBOROS_DOMAIN') {
    return (
      <OuroborosDomainStep
        initialSelected={state.answers.domainPreference ?? []}
        domains={domains}
        isPending={isPending}
        onComplete={(domainPreference) => handleAdvance({ domainPreference })}
      />
    )
  }

  return null
}

function OuroborosDomainStep({
  initialSelected,
  domains,
  isPending,
  onComplete,
}: {
  initialSelected: string[]
  domains: readonly { key: string; label: string; short: string }[]
  isPending: boolean
  onComplete: (domainPreference: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Choose your campaign path</h2>
      <p className="text-zinc-400 text-sm">
        Which allyship domains do you want quests from? Select one or more.
      </p>
      <div className="space-y-2">
        {domains.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => toggle(d.key)}
            disabled={isPending}
            className={`block w-full text-left p-4 rounded-xl border transition-colors disabled:opacity-50 ${
              selected.has(d.key)
                ? 'border-purple-500 bg-purple-900/20'
                : 'border-zinc-800 hover:border-purple-500/50 bg-zinc-900/50'
            }`}
          >
            <div className="font-medium text-white">{d.label}</div>
            <span className="text-xs text-zinc-500">{selected.has(d.key) ? '✓ Selected' : 'Click to select'}</span>
          </button>
        ))}
      </div>
      <div className="pt-4">
        <button
          type="button"
          onClick={() => onComplete([...selected])}
          disabled={isPending}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Completing...' : 'Complete'}
        </button>
      </div>
    </div>
  )
}
