'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  Passage types                                                     */
/* ------------------------------------------------------------------ */

interface Choice {
  text: string
  target: string
}

interface Passage {
  id: string
  prose: string
  choices: Choice[]
  /** Tailwind border color class for the card */
  borderClass?: string
  /** Tailwind accent text class */
  accentClass?: string
  /** Tailwind background tint class */
  bgClass?: string
  /** External links shown after prose (final passage) */
  links?: { label: string; href: string }[]
}

/* ------------------------------------------------------------------ */
/*  Passage map                                                       */
/* ------------------------------------------------------------------ */

const PASSAGES: Record<string, Passage> = {
  start: {
    id: 'start',
    prose: 'You arrive at the threshold. The game is already happening around you.\n\nFour paths extend from where you stand. Each one is a move — a way of engaging with what is alive in you right now.\n\nWhich energy calls to you?',
    choices: [
      { text: 'Something feels charged. I want to wake up.', target: 'wake_up' },
      { text: 'Something is stuck. I need to clean up.', target: 'clean_up' },
      { text: 'I want to grow. Show me the edge.', target: 'grow_up' },
      { text: 'I am ready to work. Let me show up.', target: 'show_up' },
    ],
  },

  /* ---- WAKE UP (emerald) ---- */
  wake_up: {
    id: 'wake_up',
    prose: 'Something is charged. You feel it before you see it.\n\nWake Up is the first move. It means: raise awareness. Notice what is alive in you — a feeling, an image, a tension. You cannot act well from numbness. Waking up is the antidote.',
    borderClass: 'border-emerald-800/50',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/20',
    choices: [
      { text: 'Name what I feel', target: 'wake_up_name' },
      { text: 'Look around first', target: 'wake_up_look' },
    ],
  },
  wake_up_name: {
    id: 'wake_up_name',
    prose: 'Good. Naming is the first act of capture.\n\nIn BARS Engine, a "charge" is any moment of emotional intensity — curiosity, anger, wonder, dread. When you name it, you capture a BAR (Brave Act of Resistance). That charge becomes raw material for creative and developmental work.\n\nYou do not need to understand it yet. You just need to catch it before it passes.',
    borderClass: 'border-emerald-800/50',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
  },
  wake_up_look: {
    id: 'wake_up_look',
    prose: 'You look around and see the shape of the game.\n\nEvery player has a Nation — an emotional transformation pathway, the lens through which charge moves in you. And an Archetype — your agency pattern, how you move through the world. Neither is fixed. Both are frames that make the moves more specific to you.\n\nYou will discover yours as you play. For now, just notice: what catches your eye?',
    borderClass: 'border-emerald-800/50',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
  },

  /* ---- CLEAN UP (sky) ---- */
  clean_up: {
    id: 'clean_up',
    prose: 'There is something stuck. Not broken — just not moving.\n\nClean Up is the move for this. When charge accumulates without processing, it drives behavior unconsciously. You get reactive, flat, or avoidant. The antidote is not more thinking. It is metabolizing.',
    borderClass: 'border-sky-800/50',
    accentClass: 'text-sky-400',
    bgClass: 'bg-sky-950/20',
    choices: [
      { text: 'Face it directly', target: 'clean_up_face' },
      { text: 'Understand what is stuck', target: 'clean_up_understand' },
    ],
  },
  clean_up_face: {
    id: 'clean_up_face',
    prose: 'The 3-2-1 process is the core Clean Up tool.\n\n3rd person: describe the stuckness as "it" — observe it from a distance.\n2nd person: talk to it as "you" — enter dialogue.\n1st person: become it as "I" — own the energy.\n\nThis is not therapy. It is emotional composting — turning stuck charge into usable fuel. Most sessions take five minutes.',
    borderClass: 'border-sky-800/50',
    accentClass: 'text-sky-400',
    bgClass: 'bg-sky-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
    links: [
      { label: 'Try the 321 process now', href: '/shadow/321' },
    ],
  },
  clean_up_understand: {
    id: 'clean_up_understand',
    prose: 'Emotional alchemy is how the game maps inner movement.\n\nFive channels of energy — Wood (anger/growth), Fire (joy/connection), Earth (care/nourishment), Metal (grief/refinement), Water (fear/wisdom). Each one generates the next; each one can overwhelm another.\n\nWhen you are stuck, something in this cycle is blocked. Clean Up finds the block and moves it.',
    borderClass: 'border-sky-800/50',
    accentClass: 'text-sky-400',
    bgClass: 'bg-sky-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
  },

  /* ---- GROW UP (violet) ---- */
  grow_up: {
    id: 'grow_up',
    prose: 'The edge of what you know is here. Beyond it: discomfort, and growth.\n\nGrow Up is the developmental move. It asks you to hold a larger perspective than is currently comfortable. Quests that ask for this are growth quests — they are supposed to be hard.',
    borderClass: 'border-violet-800/50',
    accentClass: 'text-violet-400',
    bgClass: 'bg-violet-950/20',
    choices: [
      { text: 'Step through', target: 'grow_up_step' },
      { text: 'Cast the oracle', target: 'grow_up_oracle' },
    ],
  },
  grow_up_step: {
    id: 'grow_up_step',
    prose: 'Quests are the backbone of Grow Up.\n\nA quest is a structured creative challenge — time-bound, with clear stakes, designed to push you past your current edge. Some are solo. Some are collaborative. All of them require you to do something you have not done before.\n\nThe game creates the game. Your quest completions generate new quests for other players. Nothing is wasted.',
    borderClass: 'border-violet-800/50',
    accentClass: 'text-violet-400',
    bgClass: 'bg-violet-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
  },
  grow_up_oracle: {
    id: 'grow_up_oracle',
    prose: 'The I Ching oracle is a Grow Up tool — a mirror for developmental edges.\n\nYou ask a question. The oracle returns a hexagram — not an answer, but a frame. The frame holds the question in a way that lets you see what you could not see before. It is pattern recognition, not fortune-telling.\n\nUseful when you know you need to grow but do not know in which direction.',
    borderClass: 'border-violet-800/50',
    accentClass: 'text-violet-400',
    bgClass: 'bg-violet-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
    links: [
      { label: 'Consult the oracle', href: '/iching' },
    ],
  },

  /* ---- SHOW UP (amber) ---- */
  show_up: {
    id: 'show_up',
    prose: 'The work is waiting. Not in theory — in your hands.\n\nShow Up is the move that makes everything else count. A quest is not finished when it is captured or planned — it is finished when you move it. This is where charge becomes action.',
    borderClass: 'border-amber-800/50',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-950/20',
    choices: [
      { text: 'Find a quest', target: 'show_up_find' },
      { text: 'Create something', target: 'show_up_create' },
    ],
  },
  show_up_find: {
    id: 'show_up_find',
    prose: 'Available quests are waiting for players.\n\nSome are community quests — posted by other players or the game master. Some emerge from your own charges. All of them count. The only currency is completion: a BAR metabolized, a piece of work moved from potential to actual.',
    borderClass: 'border-amber-800/50',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
    links: [
      { label: 'Browse available quests', href: '/bars/available' },
    ],
  },
  show_up_create: {
    id: 'show_up_create',
    prose: 'Creating a BAR is the simplest Show Up move.\n\nA BAR is a Brave Act of Resistance — any creative or developmental artifact you bring into being. A poem, a conversation, a piece of code, a meal cooked with presence. The act of making it real is the resistance. The system tracks it so nothing is lost.',
    borderClass: 'border-amber-800/50',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-950/20',
    choices: [
      { text: 'Continue', target: 'finale' },
    ],
    links: [
      { label: 'Create a BAR', href: '/bars/create' },
    ],
  },

  /* ---- FINALE ---- */
  finale: {
    id: 'finale',
    prose: 'You have taken your first step. The compass is yours now.\n\nFour moves — Wake Up, Clean Up, Grow Up, Show Up. Most sessions you will touch one move deeply rather than all four lightly. That is the design.\n\nEvery session, one move. That is all it takes.',
    choices: [],
    links: [
      { label: 'Full handbook reference', href: '/wiki/handbook' },
      { label: 'Go to dashboard', href: '/' },
      { label: 'Explore the wiki', href: '/wiki' },
    ],
  },
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function HandbookCyoa() {
  const [currentId, setCurrentId] = useState('start')
  const [history, setHistory] = useState<string[]>([])
  const [fadingIn, setFadingIn] = useState(true)

  const passage = PASSAGES[currentId]

  const navigate = (target: string) => {
    setFadingIn(false)
    setTimeout(() => {
      setHistory((h) => [...h, currentId])
      setCurrentId(target)
      setFadingIn(true)
    }, 200)
  }

  const goBack = () => {
    if (history.length === 0) return
    setFadingIn(false)
    setTimeout(() => {
      const prev = history[history.length - 1]
      setHistory((h) => h.slice(0, -1))
      setCurrentId(prev)
      setFadingIn(true)
    }, 200)
  }

  if (!passage) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <p className="text-zinc-400">Passage not found.</p>
        <Link href="/wiki/handbook" className="text-zinc-500 hover:text-zinc-300 text-sm underline">
          Back to handbook
        </Link>
      </div>
    )
  }

  const isFinale = currentId === 'finale'
  const totalPassages = Object.keys(PASSAGES).length
  const visited = history.length + 1
  const progressPct = Math.min(100, Math.round((visited / totalPassages) * 100))

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">
            Orientation
          </p>
          {history.length > 0 && (
            <button
              onClick={goBack}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition"
            >
              &larr; Back
            </button>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Play the Handbook</h1>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-sky-500 via-violet-500 to-amber-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Passage */}
      <div className={`transition-opacity duration-200 ${fadingIn ? 'opacity-100' : 'opacity-0'}`}>
        <div
          className={`rounded-xl border p-5 sm:p-6 space-y-4 ${
            passage.borderClass ?? 'border-zinc-800'
          } ${passage.bgClass ?? 'bg-zinc-900/50'}`}
        >
          <div className="text-sm sm:text-base text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {passage.prose}
          </div>

          {/* Inline links (e.g. "Try the 321 process now") */}
          {passage.links && passage.links.length > 0 && !isFinale && (
            <div className="pt-2">
              {passage.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`inline-block text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                    passage.borderClass ?? 'border-zinc-700'
                  } ${passage.accentClass ?? 'text-zinc-400'} hover:bg-zinc-800`}
                >
                  {l.label} &rarr;
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Choices */}
        {passage.choices.length > 0 && (
          <div className="mt-4 space-y-2">
            {passage.choices.map((choice) => {
              const target = PASSAGES[choice.target]
              return (
                <button
                  key={choice.target}
                  onClick={() => navigate(choice.target)}
                  className={`w-full text-left px-4 py-3 rounded-lg border bg-zinc-800/40 hover:bg-zinc-800 text-sm text-zinc-300 transition group ${
                    target?.borderClass ?? 'border-zinc-700/60'
                  } hover:border-zinc-600`}
                >
                  <span className="group-hover:text-white transition">{choice.text}</span>
                  <span className="float-right text-zinc-600 group-hover:text-zinc-400 transition">
                    &rarr;
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Finale links */}
        {isFinale && (
          <div className="mt-6 space-y-3">
            {passage.links?.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block w-full text-center px-4 py-3 rounded-lg border border-zinc-700/60 bg-zinc-800/40 hover:bg-zinc-800 hover:border-zinc-600 text-sm text-zinc-300 transition"
              >
                {l.label} &rarr;
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
