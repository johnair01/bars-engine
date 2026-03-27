'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'

interface AlchemyState {
  channel: string
  altitude: string
}

const CHANNEL_COLORS: Record<string, string> = {
  fear:        'text-violet-300 border-violet-700/40 bg-violet-900/20',
  anger:       'text-red-300    border-red-700/40    bg-red-900/20',
  sadness:     'text-blue-300   border-blue-700/40   bg-blue-900/20',
  joy:         'text-yellow-300 border-yellow-700/40 bg-yellow-900/20',
  neutrality:  'text-zinc-300   border-zinc-700/40   bg-zinc-900/20',
}

const ALTITUDE_MEANINGS: Record<string, Record<string, string>> = {
  fear:       { dissatisfied: 'anxiety',      neutral: 'orientation',  satisfied: 'excitement' },
  anger:      { dissatisfied: 'frustration',  neutral: 'clarity',      satisfied: 'bravery' },
  sadness:    { dissatisfied: 'grief',        neutral: 'acceptance',   satisfied: 'poignance' },
  joy:        { dissatisfied: 'restlessness', neutral: 'appreciation', satisfied: 'bliss' },
  neutrality: { dissatisfied: 'apathy',       neutral: 'presence',     satisfied: 'peace' },
}

const ALTITUDES = ['dissatisfied', 'neutral', 'satisfied']

interface Props {
  initialState: AlchemyState | null
  playerId: string
}

export function AlchemyStateWidget({ initialState, playerId: _playerId }: Props) {
  const router = useRouter()
  const [state] = useState<AlchemyState | null>(initialState)
  const [launching, startLaunch] = useTransition()
  const [sceneId, setSceneId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sceneId) router.push(`/growth-scene/${sceneId}`)
  }, [sceneId, router])

  const colors = state ? (CHANNEL_COLORS[state.channel] ?? CHANNEL_COLORS.neutrality) : 'text-zinc-400 border-zinc-800 bg-zinc-900/20'
  const meaning = state ? (ALTITUDE_MEANINGS[state.channel]?.[state.altitude] ?? state.altitude) : null
  const altitudeIdx = state ? ALTITUDES.indexOf(state.altitude) : -1
  const nextAltitude = altitudeIdx >= 0 && altitudeIdx < 2 ? ALTITUDES[altitudeIdx + 1] : null
  const nextMeaning = state && nextAltitude ? ALTITUDE_MEANINGS[state.channel]?.[nextAltitude] : null

  const handleEnterScene = () => {
    setError(null)
    startLaunch(async () => {
      try {
        const res = await fetch('/api/growth-scenes/generate', { method: 'POST' })
        let json: { scene_id?: string; error?: string }
        try {
          json = await res.json() as { scene_id?: string; error?: string }
        } catch {
          setError(`Server error (${res.status}) — try again.`)
          return
        }
        if (json.error) { setError(json.error); return }
        if (json.scene_id) setSceneId(json.scene_id)
      } catch {
        setError('Network error — check your connection and try again.')
      }
    })
  }

  return (
    <section className={`border rounded-xl p-5 space-y-3 ${colors}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest opacity-60 mb-0.5">Emotional Alchemy</p>
          {state ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-bold capitalize">{state.channel}</span>
              <span className="text-sm opacity-70 capitalize">{meaning}</span>
            </div>
          ) : (
            <p className="text-sm opacity-60 italic">No alchemy state set yet.</p>
          )}
        </div>
        {state && nextAltitude && (
          <div className="text-right text-xs opacity-60 leading-relaxed">
            <p>Growth vector</p>
            <p className="font-mono">{meaning} → {nextMeaning}</p>
          </div>
        )}
      </div>

      {/* Altitude progress bar */}
      {state && (
        <div className="flex gap-1.5 items-center">
          {ALTITUDES.map((alt, i) => (
            <div
              key={alt}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                i <= altitudeIdx ? 'opacity-100' : 'opacity-20'
              } bg-current`}
            />
          ))}
          <span className="text-[10px] ml-1 opacity-50 capitalize">{state.altitude}</span>
        </div>
      )}

      {/* CTA */}
      {state && nextAltitude ? (
        <button
          onClick={handleEnterScene}
          disabled={launching}
          className="w-full mt-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-current/10 hover:bg-current/20 border border-current/30 transition-all disabled:opacity-50"
        >
          {launching ? 'Opening scene…' : `Enter growth scene →`}
        </button>
      ) : state?.altitude === 'satisfied' ? (
        <p className="text-xs opacity-50 italic text-center pt-1">
          Altitude satisfied — you&apos;ve reached the top of this vector.
        </p>
      ) : null}

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </section>
  )
}
