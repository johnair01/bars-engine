 
'use client'

import { useState } from 'react'
import Link from 'next/link'

const REFLECT_PROMPTS = [
  `What's alive in you around this quest right now?`,
  `What would it feel like to actually complete it?`,
  `What — honestly — might be in the way?`,
]

type MoveType = 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'

const MOVES: { type: MoveType; label: string; color: string; description: string }[] = [
  {
    type: 'wake_up',
    label: 'Wake Up',
    color: 'amber',
    description: `See what's true. Get honest about reality before you act.`,
  },
  {
    type: 'clean_up',
    label: 'Clean Up',
    color: 'blue',
    description: `Clear the obstacle. Address what's blocked, stuck, or unresolved.`,
  },
  {
    type: 'grow_up',
    label: 'Grow Up',
    color: 'emerald',
    description: `Shift perspective. Develop a capacity that wasn't there before.`,
  },
  {
    type: 'show_up',
    label: 'Show Up',
    color: 'purple',
    description: `Take action. Do the thing the situation is asking of you.`,
  },
]

const MOVE_DIRECTION: Record<
  MoveType,
  { title: string; body: string; cta?: { label: string; href: (questId: string) => string } }
> = {
  wake_up: {
    title: 'Start by seeing clearly.',
    body: `This quest begins with honest observation. Sit with what's real. Name it without judgment. The action comes after the seeing.`,
  },
  clean_up: {
    title: `Something's in the way.`,
    body: `The Emotional First Aid Kit is built for exactly this — metabolizing what's stuck so you can move. Open it with this quest as context.`,
    cta: {
      label: 'Open Emotional First Aid Kit',
      href: (questId) =>
        `/emotional-first-aid?questId=${encodeURIComponent(questId)}&returnTo=${encodeURIComponent('/hand')}`,
    },
  },
  grow_up: {
    title: 'This quest asks you to stretch.',
    body: `What perspective or capacity needs to expand? The growth often happens in the doing — start with one small act that requires the new version of you.`,
  },
  show_up: {
    title: 'The world is waiting.',
    body: `This is a doing quest. Something concrete needs to happen. Your presence and action are the move. Go do the thing.`,
  },
}

type Step = 'reflect' | 'move-select' | 'direction'

const COLOR_BUTTON: Record<string, string> = {
  amber: 'border-amber-800/50 bg-amber-950/20 hover:bg-amber-900/30 text-amber-300',
  blue: 'border-blue-800/50 bg-blue-950/20 hover:bg-blue-900/30 text-blue-300',
  emerald: 'border-emerald-800/50 bg-emerald-950/20 hover:bg-emerald-900/30 text-emerald-300',
  purple: 'border-purple-800/50 bg-purple-950/20 hover:bg-purple-900/30 text-purple-300',
}

const COLOR_BADGE: Record<string, string> = {
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  purple: 'text-purple-400',
}

export function UnpackQuestFlow({
  questId,
  initialMoveType,
}: {
  questId: string
  questTitle: string
  initialMoveType: string | null
}) {
  const [step, setStep] = useState<Step>('reflect')
  const [selectedMove, setSelectedMove] = useState<MoveType | null>(
    (initialMoveType as MoveType) ?? null
  )

  if (step === 'reflect') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="space-y-2">
          <h2 className="text-white font-semibold">Before you begin, sit with these.</h2>
          <p className="text-zinc-500 text-sm">No answers required. Just let them land.</p>
        </div>

        <div className="space-y-4">
          {REFLECT_PROMPTS.map((prompt, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4">
              <p className="text-zinc-300 text-sm leading-relaxed">{prompt}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep('move-select')}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition"
        >
          I&apos;ve reflected &mdash; continue &rarr;
        </button>
      </div>
    )
  }

  if (step === 'move-select') {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="space-y-1">
          <h2 className="text-white font-semibold">How does this quest want to move?</h2>
          <p className="text-zinc-500 text-sm">Choose the move that fits where you are right now.</p>
        </div>

        <div className="space-y-3">
          {MOVES.map((m) => (
            <button
              key={m.type}
              onClick={() => {
                setSelectedMove(m.type)
                setStep('direction')
              }}
              className={`w-full text-left rounded-xl border px-5 py-4 transition ${COLOR_BUTTON[m.color]}`}
            >
              <p className="font-semibold">{m.label}</p>
              <p className="text-sm mt-0.5 text-zinc-400">{m.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => setStep('reflect')}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition"
        >
          &larr; Back
        </button>
      </div>
    )
  }

  // direction
  const move = selectedMove ?? 'show_up'
  const dir = MOVE_DIRECTION[move]
  const moveInfo = MOVES.find((m) => m.type === move)!

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-1">
        <span className={`text-xs uppercase tracking-widest font-semibold ${COLOR_BADGE[moveInfo.color]}`}>
          {moveInfo.label}
        </span>
        <h2 className="text-white font-semibold text-lg">{dir.title}</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">{dir.body}</p>
      </div>

      <div className="space-y-3">
        {dir.cta && (
          <Link
            href={dir.cta.href(questId)}
            className="block w-full text-center py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
          >
            {dir.cta.label}
          </Link>
        )}

        <Link
          href="/hand"
          className="block w-full text-center py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 transition"
        >
          Done &mdash; go to Vault
        </Link>
      </div>

      <button
        onClick={() => setStep('move-select')}
        className="text-xs text-zinc-600 hover:text-zinc-400 transition"
      >
        &larr; Choose a different move
      </button>
    </div>
  )
}
