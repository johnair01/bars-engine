'use client'

// ---------------------------------------------------------------------------
// PracticeCard — the POST-CARD formation (UI_COVENANT §10). Renders the
// composer's PracticeRecommendation as an element-coded CultivationCard: the
// neutral read has resolved into a move with an element, an altitude, and a
// tool. Contrast with the pre-card DiagnosticFlow (raw SceneCard).
//
// Three channels: element = the vector's channel; altitude = the vector's
// altitude; stage = growing (active practice). Element color derives from
// ELEMENT_TOKENS / EMOTION_TO_ELEMENT — no hex in this file.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import {
  getToolById,
  EMOTION_TO_ELEMENT,
  type PracticeRecommendation,
  type EmotionalVector,
} from '@/lib/emotional-alchemy'

const eyebrow = 'text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500'

function ReRate({ before }: { before: number }) {
  const [after, setAfter] = useState<number | null>(null)
  const delta = after === null ? null : before - after
  const verdict =
    delta === null ? null : delta >= 2 ? 'moved' : delta <= -2 ? 'worse' : 'flat'
  const message: Record<string, string> = {
    moved: 'That moved. Worth logging — the charge is lighter than it was.',
    flat: 'Barely shifted. One different tool, or just capture it — either is honest.',
    worse: 'It got louder. That is data, not failure — ground first, then a different tool.',
  }
  return (
    <div className="space-y-3">
      <p className={eyebrow}>Re-rate · how loud now?</p>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
        {Array.from({ length: 11 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAfter(i)}
            className={`min-h-[44px] rounded-lg border text-sm tabular-nums transition-colors ${after === i ? 'border-purple-500 bg-purple-950/40 text-purple-200' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
          >
            {i}
          </button>
        ))}
      </div>
      {verdict && (
        <p className={`text-sm ${verdict === 'worse' ? 'text-amber-300' : 'text-zinc-300'}`}>
          {before} → {after}. {message[verdict]}
        </p>
      )}
      <p className={eyebrow}>Not saved — this is your rep to keep.</p>
    </div>
  )
}

export function PracticeCard({ rec, vector }: { rec: PracticeRecommendation; vector: EmotionalVector }) {
  const [showWhy, setShowWhy] = useState(false)
  const [picked, setPicked] = useState<'internal' | 'external' | null>(null)

  const { channel, altitude } = vector
  const element = EMOTION_TO_ELEMENT[channel]
  const t = ELEMENT_TOKENS[element]
  const tool = getToolById(rec.primaryToolId)
  const prependTool = rec.prepend ? getToolById(rec.prepend) : null
  const spirit = rec.spiritStep
  const steps = rec.protocol

  return (
    <CultivationCard element={element} altitude={altitude} stage="growing" animated>
      <div className="relative z-10 space-y-5 p-5">
        {/* Grounding prepend (hot charge, §4.1 step 1). */}
        {prependTool && (
          <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2">
            <p className={eyebrow + ' text-amber-500/90'}>First · {prependTool.timebox.minMinutes}–{prependTool.timebox.maxMinutes} min</p>
            <p className="mt-0.5 text-sm text-zinc-300">{prependTool.barsName} — cool the charge before the move.</p>
          </div>
        )}

        {/* Element-coded header — the formation. */}
        <div className={`rounded-lg ${t.bg} px-4 py-3`}>
          <p className={eyebrow}>Your practice</p>
          <div className="mt-1 flex items-baseline justify-between gap-3">
            <h2 className={`text-xl font-bold ${t.textAccent}`}>{tool?.barsName ?? rec.primaryToolId}</h2>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-300">{rec.timeboxMinutes} min</span>
          </div>
          {tool && <p className="mt-0.5 text-xs text-zinc-400">{tool.genericName}</p>}
        </div>

        {rec.bridged && (
          <p className="text-xs italic text-zinc-500">Your drawn move is banked for later — we cool and metabolize the charge first.</p>
        )}

        {/* Stance question — the move framing. */}
        {rec.stanceQuestion && (
          <p className="border-l-2 border-zinc-700 pl-4 text-base leading-relaxed text-zinc-200">{rec.stanceQuestion}</p>
        )}

        {/* Protocol — the description well. Spirit step (last) carries the element gem. */}
        <ol className="space-y-2.5">
          {steps.map((step, i) => {
            const isSpirit = step === spirit
            return (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-zinc-200">
                <span
                  aria-hidden
                  className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: isSpirit ? t.gem : '#3f3f46' }}
                />
                <span className={isSpirit ? 'text-zinc-100' : ''}>{step}</span>
              </li>
            )
          })}
        </ol>

        {/* Show Up — primary action, bottom zone (§1.7). */}
        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <p className={eyebrow}>Show up · make it real</p>
          <button
            type="button"
            onClick={() => setPicked('internal')}
            className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${picked === 'internal' ? 'border-purple-500 bg-purple-950/30 text-zinc-100' : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'}`}
          >
            <span className={eyebrow + ' block'}>Internal</span>
            <span className="mt-1 block">{rec.showUp.internal}</span>
          </button>
          {rec.showUp.external ? (
            <button
              type="button"
              onClick={() => setPicked('external')}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${picked === 'external' ? 'border-purple-500 bg-purple-950/30 text-zinc-100' : 'border-zinc-800 text-zinc-300 hover:border-zinc-600'}`}
            >
              <span className={eyebrow + ' block'}>External{rec.showUp.externalGated ? ' · when the charge cools' : ''}</span>
              <span className="mt-1 block">{rec.showUp.external}</span>
            </button>
          ) : (
            <p className="rounded-lg border border-zinc-800 px-4 py-3 text-xs text-zinc-500">
              Internal only for now — nothing external is aimed at the person who caused this by default. That is your call to make, later.
            </p>
          )}
        </div>

        {/* Re-rate close (§1.5) appears once a move is chosen. */}
        {picked && (
          <div className="border-t border-zinc-800 pt-4">
            <ReRate before={vector.intensity} />
          </div>
        )}

        {/* Inspectable reasoning (§8). */}
        <div className="border-t border-zinc-800 pt-3">
          <button type="button" onClick={() => setShowWhy((s) => !s)} className="text-xs text-zinc-500 hover:text-zinc-300">
            {showWhy ? 'Hide' : 'Why this tool?'}
          </button>
          {showWhy && (
            <div className="mt-2 space-y-1.5 text-xs text-zinc-500">
              <p>Considered: {rec.candidatesConsidered.map((c) => `${c.toolId} (${c.score})`).join(' · ')}</p>
              <p>Role: {rec.rolePath.join(' → ')}</p>
              {rec.guardsApplied.length > 0 && <p>Guards: {rec.guardsApplied.join(', ')}</p>}
              {rec.notes.map((n, i) => (
                <p key={i} className="leading-relaxed">› {n}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </CultivationCard>
  )
}
