'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { FACE_META } from '@/lib/quest-grammar/types'
import { SPOKE_MOVE_BED_MOVE_TYPES, type SpokeMoveBedMoveType } from '@/lib/spoke-move-beds'
import type { GscpWizardData } from '@/actions/generated-spoke-cyoa'
import { generateAndPersistGscpAdventure } from '@/actions/generated-spoke-cyoa'
import type { GeneratedSpokeInputs } from '@/lib/generated-spoke-cyoa/types'

const FACES: GameMasterFace[] = [
  'shaman',
  'challenger',
  'regent',
  'architect',
  'diplomat',
  'sage',
]

type Props = {
  data: GscpWizardData
}

export function GeneratedSpokeCyoaWizard({ data }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [moveFocus, setMoveFocus] = useState<SpokeMoveBedMoveType>('wakeUp')
  const [chargeText, setChargeText] = useState('')
  const [gmFace, setGmFace] = useState<GameMasterFace>('sage')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const input: GeneratedSpokeInputs = {
    campaignRef: data.campaignRef,
    spokeIndex: data.spokeIndex,
    kotterStage: data.kotterStage,
    hexagramId: data.hexagramId,
    changingLines: data.changingLines,
    milestoneSummary: data.milestoneSummary ?? undefined,
    fundraisingNote: data.fundraisingNote,
    instanceName: data.instanceName,
    allyshipDomain: data.allyshipDomain,
    moveFocus,
    chargeText,
    gmFace,
  }

  async function handleGenerate() {
    setError(null)
    setPending(true)
    try {
      const r = await generateAndPersistGscpAdventure(input)
      if ('error' in r) {
        setError(r.error)
        setPending(false)
        return
      }
      const u = new URLSearchParams({
        start: r.startNodeId,
        ref: data.campaignRef,
        spoke: String(data.spokeIndex),
        kotterStage: String(data.kotterStage),
        returnTo: `/campaign/hub?ref=${encodeURIComponent(data.campaignRef)}`,
      })
      if (data.hexagramId != null) u.set('hexagram', String(data.hexagramId))
      u.set('face', gmFace)
      router.push(`/adventure/${r.adventureId}/play?${u.toString()}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setPending(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 space-y-8 text-zinc-200">
      <Link
        href={`/campaign/landing?ref=${encodeURIComponent(data.campaignRef)}&spoke=${data.spokeIndex}`}
        className="text-xs text-zinc-500 hover:text-zinc-400"
      >
        ← Spoke landing
      </Link>

      {step === 0 && (
        <section className="space-y-4 border border-amber-900/40 rounded-2xl bg-amber-950/20 p-6">
          <p className="text-[10px] uppercase tracking-widest text-amber-500/90">Opening</p>
          <h1 className="text-2xl font-bold text-white">{data.instanceName}</h1>
          <p className="text-sm text-zinc-300 leading-relaxed">{data.milestoneSummary}</p>
          {data.hexagramId != null && (
            <p className="text-sm text-zinc-400">
              Fortune for this spoke: <strong className="text-zinc-200">Hexagram {data.hexagramId}</strong>
              {data.changingLines?.length
                ? ` · changing lines ${data.changingLines.join(', ')}`
                : null}
            </p>
          )}
          {data.fundraisingNote ? (
            <p className="text-xs text-teal-400/90 border border-teal-900/40 rounded-lg p-3">{data.fundraisingNote}</p>
          ) : null}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
          >
            Continue — move & charge →
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4 border border-zinc-800 rounded-2xl p-6">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Four moves</p>
          <p className="text-sm text-zinc-400">Which move are you focusing on for this spoke?</p>
          <div className="grid grid-cols-2 gap-2">
            {SPOKE_MOVE_BED_MOVE_TYPES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMoveFocus(m)}
                className={`rounded-lg px-3 py-2 text-sm font-medium border ${
                  moveFocus === m
                    ? 'border-purple-500 bg-purple-950/50 text-white'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {m === 'wakeUp'
                  ? 'Wake Up'
                  : m === 'cleanUp'
                    ? 'Clean Up'
                    : m === 'growUp'
                      ? 'Grow Up'
                      : 'Show Up'}
              </button>
            ))}
          </div>
          <label className="block space-y-2">
            <span className="text-xs text-zinc-500">Charge (felt signal) for this spoke</span>
            <textarea
              value={chargeText}
              onChange={(e) => setChargeText(e.target.value)}
              rows={5}
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-600"
              placeholder="What are you carrying here?"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="text-sm text-zinc-500">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={chargeText.trim().length < 3}
              className="flex-1 min-h-[44px] rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold"
            >
              Next — cultivation sifu →
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4 border border-zinc-800 rounded-2xl p-6">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Cultivation sifu</p>
          <p className="text-sm text-zinc-400">Choose the guide whose path shapes this run.</p>
          <div className="space-y-2">
            {FACES.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setGmFace(f)}
                className={`w-full text-left rounded-lg px-4 py-3 border ${
                  gmFace === f
                    ? 'border-purple-500 bg-purple-950/40'
                    : 'border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <span className={`font-semibold ${FACE_META[f].color}`}>{FACE_META[f].label}</span>
                <span className="block text-xs text-zinc-500 mt-1">{FACE_META[f].mission}</span>
              </button>
            ))}
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-zinc-500">
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={pending}
              className="flex-1 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold"
            >
              {pending ? 'Generating your journey…' : 'Generate journey & play →'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
