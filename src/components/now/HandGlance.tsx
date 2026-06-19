'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

const MATURITY_LABELS: Record<string, string> = {
  captured: 'Captured',
  context_named: 'Context named',
  elaborated: 'Elaborated',
  shared_or_acted: 'Shared · acted',
  integrated: 'Integrated',
}

const NEXT_MOVE: Record<string, string> = {
  captured: 'Name its context',
  context_named: 'Elaborate it',
  elaborated: 'Share or act',
  shared_or_acted: 'Integrate',
  integrated: 'Plant in Garden',
}

function isElementKey(v: string | null | undefined): v is ElementKey {
  return v === 'fire' || v === 'water' || v === 'wood' || v === 'metal' || v === 'earth'
}

export type HandSlotData = {
  slotIndex: number
  barId: string | null
  title: string | null
  element: string | null
  maturity: string | null
}

type HandGlanceProps = {
  slots: HandSlotData[]
  filledCount: number
  vaultCount: number
  gardenCount: number
}

export function HandGlance({ slots, filledCount, vaultCount, gardenCount }: HandGlanceProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section>
      {/* Section header — collapsible toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 11, WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="flex items-center" style={{ gap: 8 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#a09e98', width: 9, textAlign: 'center' }}>
            {collapsed ? '▶' : '▼'}
          </span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#a09e98' }}>
            Your hand
          </span>
        </span>
        <span className="flex items-baseline" style={{ gap: 9 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: 13, color: '#e8e6e0' }}>
            {filledCount} / {slots.length}
          </span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
            Vault {vaultCount} · Garden {gardenCount}
          </span>
        </span>
      </button>

      {collapsed ? (
        // Collapsed: dot pills
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center"
          style={{ gap: 7, padding: '11px 13px', borderRadius: 10, background: 'transparent', cursor: 'pointer', border: 'none', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', WebkitTapHighlightColor: 'transparent' }}
        >
          {slots.filter(s => s.barId && isElementKey(s.element)).map(s => {
            const el = ELEMENT_TOKENS[s.element as ElementKey]
            return (
              <span
                key={s.slotIndex}
                style={{ width: 9, height: 9, borderRadius: '50%', flex: '0 0 auto', background: el.gem, boxShadow: `0 0 7px 1px ${el.glow}` }}
              />
            )
          })}
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
            {filledCount} held
          </span>
        </button>
      ) : (
        // Expanded: 2-col card grid
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: 10, borderRadius: 14, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' }}>
          {slots.map(slot => {
            const el = isElementKey(slot.element) ? ELEMENT_TOKENS[slot.element] : null
            const maturityLabel = MATURITY_LABELS[slot.maturity ?? ''] ?? 'Captured'
            const nextMove = NEXT_MOVE[slot.maturity ?? 'captured'] ?? 'Name its context'

            if (!slot.barId || !slot.title) {
              return (
                <Link
                  key={slot.slotIndex}
                  href="/bars/create"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    aspectRatio: '5 / 7',
                    borderRadius: 10,
                    background: 'transparent',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                    color: '#6b6965',
                    fontSize: 20,
                    fontWeight: 300,
                    textDecoration: 'none',
                    transition: 'box-shadow 0.2s, color 0.2s',
                  }}
                >
                  +
                </Link>
              )
            }

            return (
              <Link
                key={slot.slotIndex}
                href={`/bars/${slot.barId}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  aspectRatio: '5 / 7',
                  borderRadius: 10,
                  background: el
                    ? `linear-gradient(160deg, ${el.gradFrom} 0%, #0f0e0c 100%)`
                    : 'linear-gradient(160deg, #1e2530 0%, #0d1017 100%)',
                  boxShadow: el
                    ? `inset 0 0 0 1px ${el.frame}66, 0 4px 20px -8px ${el.glow}55`
                    : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                }}
              >
                {/* Art window with sigil */}
                <div style={{
                  position: 'relative',
                  flex: '0 0 38%',
                  width: '100%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: el
                    ? `radial-gradient(ellipse at 50% 32%, ${el.glow}3d 0%, transparent 72%), linear-gradient(160deg, ${el.gradFrom} 0%, #0f0e0c 100%)`
                    : 'linear-gradient(160deg, #1e2530 0%, #0d1017 100%)',
                }}>
                  <span style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 40,
                    lineHeight: 1,
                    color: el ? el.gem : '#6b6965',
                    opacity: 0.52,
                    textShadow: el ? `0 0 18px ${el.glow}a6` : 'none',
                  }}>
                    {el ? el.sigil : '◇'}
                  </span>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(15,14,12,0.9) 100%)' }} />
                </div>

                {/* Card body */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, padding: '8px 9px 9px', minHeight: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 5 }}>
                    <span style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 7.5,
                      letterSpacing: '0.05em',
                      color: el ? `color-mix(in srgb, ${el.gem} 80%, #ffffff)` : '#6b6965',
                      textShadow: el ? `0 0 8px ${el.glow}` : 'none',
                      whiteSpace: 'nowrap',
                    }}>
                      {el ? (slot.element!.charAt(0).toUpperCase() + slot.element!.slice(1)) : '—'}
                    </span>
                    <span style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 7,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color: '#6b6965',
                      whiteSpace: 'nowrap',
                    }}>
                      {maturityLabel}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: 'Nunito, sans-serif',
                    fontSize: 11,
                    lineHeight: 1.3,
                    color: '#e8e6e0',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                    flex: 1,
                  }}>
                    {slot.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 6 }}>
                    <span style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 7.5,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase' as const,
                      color: el ? el.gem : '#7c3aed',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      minWidth: 0,
                    }}>
                      → {nextMove}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      flex: '0 0 auto',
                      background: el ? el.gem : '#7c3aed',
                      boxShadow: `0 0 6px 1px ${el ? el.glow : '#7c3aed'}`,
                    }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
