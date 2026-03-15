'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { SceneDsl, SceneChoice } from '@/lib/growth-scene/types'

interface ResolveResult {
  emotional_state_update: { altitude: string; advanced: boolean } | null
  artifacts_emitted: Array<{ type: string; payload: Record<string, unknown> }>
  npc_actions: unknown[]
}

const ALTITUDE_MEANINGS: Record<string, Record<string, string>> = {
  fear:       { dissatisfied: 'anxiety',      neutral: 'orientation',  satisfied: 'excitement' },
  anger:      { dissatisfied: 'frustration',  neutral: 'clarity',      satisfied: 'bravery' },
  sadness:    { dissatisfied: 'grief',        neutral: 'acceptance',   satisfied: 'poignance' },
  joy:        { dissatisfied: 'restlessness', neutral: 'appreciation', satisfied: 'bliss' },
  neutrality: { dissatisfied: 'apathy',       neutral: 'presence',     satisfied: 'peace' },
}

interface Props {
  sceneId: string
  dsl: SceneDsl
}

type Phase = 'cards' | 'choice' | 'result'

export function GrowthSceneRunner({ sceneId, dsl }: Props) {
  const [cardIdx, setCardIdx] = useState(0)
  const [phase, setPhase] = useState<Phase>('cards')
  const [result, setResult] = useState<ResolveResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentCard = dsl.cards[cardIdx]
  const isLastCard = cardIdx === dsl.cards.length - 1

  const handleNext = () => {
    if (isLastCard) { setPhase('choice'); return }
    setCardIdx((i) => i + 1)
  }

  const handleChoice = (choice: SceneChoice) => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/growth-scenes/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scene_id: sceneId, choice: choice.key }),
        })
        let json: ResolveResult & { error?: string }
        try {
          json = await res.json() as ResolveResult & { error?: string }
        } catch {
          setError(`Server error (${res.status}) — try again.`)
          return
        }
        if (json.error) { setError(json.error); return }
        setResult(json)
        setPhase('result')
      } catch {
        setError('Network error — check your connection and try again.')
      }
    })
  }

  const newAltitudeMeaning = result?.emotional_state_update
    ? ALTITUDE_MEANINGS[dsl.channel]?.[result.emotional_state_update.altitude]
    : null

  return (
    <div className="min-h-screen bg-black text-zinc-200 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">

        {/* Vector header */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">Growth Scene</p>
          <p className="text-xs font-mono text-zinc-500">{dsl.vector}</p>
        </div>

        {/* CARD PHASE */}
        {phase === 'cards' && currentCard && (
          <div className="space-y-6">
            <div
              key={cardIdx}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 min-h-[200px] flex items-center"
            >
              <p className="text-lg text-zinc-200 leading-relaxed">{currentCard.text}</p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {dsl.cards.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === cardIdx ? 'bg-zinc-300 w-4' : i < cardIdx ? 'bg-zinc-600' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-zinc-300 font-medium transition-all"
            >
              {isLastCard ? 'Make a move →' : 'Continue →'}
            </button>
          </div>
        )}

        {/* CHOICE PHASE */}
        {phase === 'choice' && (
          <div className="space-y-4">
            <p className="text-center text-sm text-zinc-500 italic">What do you do?</p>
            <div className="space-y-3">
              {dsl.choices.map((choice) => (
                <button
                  key={choice.key}
                  onClick={() => handleChoice(choice)}
                  disabled={isPending}
                  className={`w-full text-left px-5 py-4 rounded-xl border transition-all disabled:opacity-50 ${
                    choice.isGrowth
                      ? 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800 text-zinc-200'
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span className="text-sm leading-relaxed">{choice.label}</span>
                  {choice.isGrowth && (
                    <span className="ml-2 text-[10px] text-zinc-500 uppercase tracking-wider">growth move</span>
                  )}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-400 text-center">{error}</p>}
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === 'result' && result && (
          <div className="space-y-5">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-4">
              {result.emotional_state_update?.advanced ? (
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-white capitalize">
                    {newAltitudeMeaning ?? result.emotional_state_update.altitude}
                  </p>
                  <p className="text-sm text-zinc-400">
                    Your altitude advanced to{' '}
                    <span className="font-mono text-zinc-300">{result.emotional_state_update.altitude}</span>.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-zinc-400 text-sm">You stayed with what was here.</p>
                  <p className="text-xs text-zinc-600 mt-1">No altitude change — that&apos;s real too.</p>
                </div>
              )}

              {/* Artifacts */}
              {result.artifacts_emitted.length > 0 && (
                <div className="border-t border-zinc-800 pt-4 space-y-2">
                  {result.artifacts_emitted.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
                      {a.type === 'vibeulon' && (
                        <span className="text-green-400">+{String(a.payload.amount ?? 1)} ♦ vibeulon earned</span>
                      )}
                      {a.type === 'memory_entry' && (
                        <span className="text-zinc-500">Memory entry created for this scene.</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Advice */}
              {dsl.advice && (
                <div className="border-t border-zinc-800 pt-4">
                  <p className="text-xs text-zinc-500 italic leading-relaxed">{dsl.advice}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href="/wallet"
                className="flex-1 py-3 text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 text-sm transition-all"
              >
                ← Wallet
              </Link>
              <Link
                href="/"
                className="flex-1 py-3 text-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 text-sm transition-all"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
