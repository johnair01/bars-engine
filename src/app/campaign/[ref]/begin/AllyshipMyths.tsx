'use client'

/**
 * AllyshipMyths — the myth-busting beat of the onboarding funnel. Deterministic
 * CYOA cards: myth → truth → reframe. Spec: .specify/specs/campaign-lead-forge/spec.md
 */
import { useEffect, useMemo, useState } from 'react'
import { getMythsForDomain } from '@/lib/allyship-myths/myths'
import type { AllyshipDomainKey } from '@/lib/allyship-domains'

const PURPLE = 'var(--bars-liminal)'

export function AllyshipMyths({
  domain,
  onDone,
}: {
  domain?: AllyshipDomainKey | null
  onDone: (mythIdsSeen: string[]) => void
}) {
  const myths = useMemo(() => getMythsForDomain(domain), [domain])
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const myth = myths[i]
  const isLast = i >= myths.length - 1

  // Empty catalog → advance via an effect, never a setState during render.
  useEffect(() => {
    if (!myth) onDone([])
  }, [myth, onDone])

  function next() {
    if (isLast) {
      onDone(myths.map((m) => m.id))
      return
    }
    setI((n) => n + 1)
    setFlipped(false)
  }

  if (!myth) return null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between text-[10px] uppercase" style={{ letterSpacing: '.18em', color: '#a09e98' }}>
        <span>Myth {i + 1} / {myths.length}</span>
        <span style={{ color: '#d4a017' }}>Reframe</span>
      </div>

      <div
        className="rounded-2xl border border-white/[0.08] p-6"
        style={{ background: 'radial-gradient(120% 80% at 50% 0%, #1a1526 0%, #121210 60%)' }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#c88' }}>
          The myth
        </p>
        <p className="mt-1 text-[19px] font-semibold leading-snug text-[#f4f2ec]">“{myth.myth}”</p>

        {flipped ? (
          <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">The truth</p>
              <p className="mt-1 text-[15px] leading-relaxed text-[#e6e4de]">{myth.truth}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: PURPLE }}>
                Your reframe
              </p>
              <p className="mt-1 text-[15px] leading-relaxed text-[#e6e4de]">{myth.reframe}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setFlipped(true)}
            className="mt-5 rounded-xl border border-white/15 px-4 py-2.5 text-[13px] font-semibold text-[#f4f2ec]"
          >
            Flip it →
          </button>
        )}
      </div>

      {flipped && (
        <button
          onClick={next}
          className="self-end rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white"
          style={{ background: PURPLE }}
        >
          {isLast ? 'Choose my domain →' : 'Next myth →'}
        </button>
      )}
    </div>
  )
}
