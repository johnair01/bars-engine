'use client'

/**
 * SuperpowerReveal — the discovery result surface, recreated from
 * design_handoff_superpower_route ("RESULT" block).
 *
 * Renders a scored result as a lens, not a verdict: an element-coded primary
 * cultivation card (gift + shadow + at-best), a margin band to the secondary, an
 * **Aligned Action** bridge that routes from finding the superpower to taking a
 * concrete move in The Crossing, the full ranked spectrum, and the framing note.
 *
 * Per ADR 0002 a superpower is an arc, not a single element — the card's framing
 * element is the arc's anchor (`superpowerElement`), which matches the handoff's
 * superpower→element map without resurrecting the retired `channel` field.
 * Visuals use the BARS design tokens; motion lives in src/styles/superpower-quiz.css.
 */
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { SUPERPOWER_DEFS } from '@/lib/superpowers/types'
import { SUPERPOWER_TRANSLATION } from '@/lib/superpowers/matrix'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import type { SuperpowerRoutingResult } from '@/lib/superpowers/routing'
import type { ResultCopy } from '@/lib/superpowers/quiz/descriptions'
import {
  superpowerElement,
  ELEMENT_NATION,
  SUPERPOWER_CROSSING,
  CROSSING_HREF,
  ORIENTATION_LABEL,
} from '@/lib/superpowers/reveal-presentation'

const DISPLAY = 'var(--bars-font-display)'
const BODY = 'var(--bars-font-body)'
const MONO = 'var(--bars-font-mono)'

export interface SuperpowerRevealProps {
  routing: SuperpowerRoutingResult
  copy: ResultCopy
  onRetake?: () => void
}

function mono(size: number, spacing: number, color: string): CSSProperties {
  return { fontFamily: MONO, fontSize: size, letterSpacing: `${spacing}em`, textTransform: 'uppercase', color }
}

export function SuperpowerReveal({ routing, copy, onRetake }: SuperpowerRevealProps) {
  const primary = routing.superpower
  const el = superpowerElement(primary)
  const sigil = ELEMENT_TOKENS[el].sigil
  const primaryLabel = SUPERPOWER_DEFS[primary].label
  const secondaryLabel = SUPERPOWER_DEFS[routing.secondary].label
  const orientation = routing.orientation
  const ori = orientation ?? 'external'
  const cell = SUPERPOWER_TRANSLATION[primary][ori]
  const role = SUPERPOWER_CROSSING[primary]

  const marginPct = Math.round(routing.margin * 100)
  const marginWidth = `${Math.max(6, Math.min(100, marginPct))}%`

  return (
    <div className="sp-rise-slow" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 24 }}>
      <span style={mono(10, 0.26, 'var(--bars-text-secondary)')}>Your reading · primary lens</span>

      {/* primary cultivation card */}
      <div
        data-element={el}
        style={{
          position: 'relative', overflow: 'hidden', background: 'var(--bars-surface-card)', borderRadius: 14, padding: 20,
          boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 0 0 2px var(--bars-element-frame), 0 0 28px -6px var(--bars-element-glow)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 80% at 88% -10%, color-mix(in srgb, var(--bars-element-glow) 16%, transparent) 0%, transparent 56%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
              <span style={mono(9.5, 0.2, 'var(--bars-element-gem)')}>{ELEMENT_NATION[el]}</span>
              <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.0, fontSize: 30, color: 'var(--bars-text-primary)' }}>{primaryLabel}</h2>
              {orientation && (
                <span style={mono(9, 0.12, 'var(--bars-text-secondary)')}>{ORIENTATION_LABEL[orientation]}</span>
              )}
            </div>
            <span
              className="sp-float"
              style={{
                flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 50, height: 50,
                borderRadius: 14, fontSize: 24, color: 'var(--bars-element-gem)',
                background: 'color-mix(in srgb, var(--bars-element-frame) 22%, var(--bars-surface-inset))',
                boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bars-element-frame) 60%, transparent), 0 0 18px -4px var(--bars-element-glow)',
                textShadow: '0 0 12px var(--bars-element-glow)',
              }}
              aria-hidden
            >
              {sigil}
            </span>
          </div>

          <p style={{ margin: 0, fontFamily: BODY, fontSize: 14.5, lineHeight: 1.6, color: 'var(--bars-text-primary)', textWrap: 'pretty' as never }}>{copy.primary.gift}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 13, borderTop: '1px solid var(--bars-line)' }}>
            <p style={{ margin: 0, fontFamily: BODY, fontSize: 13, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' as never }}>
              <span style={{ ...mono(9.5, 0.14, 'var(--bars-element-gem)'), marginRight: 6 }}>Shadow</span>{copy.primary.shadow}
            </p>
            <p style={{ margin: 0, fontFamily: BODY, fontSize: 13, lineHeight: 1.55, color: 'var(--bars-text-secondary)', textWrap: 'pretty' as never }}>
              <span style={{ ...mono(9.5, 0.14, 'var(--bars-element-gem)'), marginRight: 6 }}>At best</span>{copy.primary.atBest}
            </p>
          </div>
        </div>
      </div>

      {/* margin band + secondary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, background: 'var(--bars-surface-inset)', borderRadius: 12, padding: '15px 16px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', ...mono(10, 0.1, 'var(--bars-text-primary)') }}>
          <span style={{ color: 'var(--bars-text-primary)' }}>{primaryLabel}</span>
          <span style={{ color: 'var(--bars-text-muted)' }}>{secondaryLabel}</span>
        </div>
        <div style={{ height: 6, width: '100%', borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }} role="img" aria-label={`${primaryLabel} leads by ${marginPct} percent`}>
          <div data-element={el} style={{ height: '100%', borderRadius: 99, background: 'var(--bars-element-gem)', boxShadow: '0 0 8px -1px var(--bars-element-glow)', transition: 'width .6s cubic-bezier(0.16,1,0.3,1)', width: marginWidth }} />
        </div>
        <p style={{ margin: '2px 0 0', fontFamily: BODY, fontSize: 13, lineHeight: 1.5, color: 'var(--bars-text-secondary)', textWrap: 'pretty' as never }}>{copy.tryAdjacent}</p>
        {!routing.confident && (
          <p style={{ margin: 0, fontFamily: BODY, fontSize: 12, lineHeight: 1.5, color: 'var(--bars-text-muted)', textWrap: 'pretty' as never }}>
            These two are close — you may carry both. Read each and choose for yourself.
          </p>
        )}
      </div>

      {/* Aligned Action — live campaign (reserved liminal-purple action treatment) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <span style={mono(10, 0.24, 'var(--bars-liminal-glow)')}>Move into aligned action · live</span>
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, background: 'linear-gradient(168deg, #16111f 0%, #111110 52%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(124,58,237,0.30), 0 0 34px -10px rgba(124,58,237,0.55)', padding: '19px 18px 18px' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 80% at 90% -12%, rgba(124,58,237,0.22) 0%, transparent 55%)' }} />
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={mono(9.5, 0.16, '#a78bfa')}>◇ The Allyship Launch · Barn Raising</span>
              <h3 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 700, fontSize: 25, letterSpacing: '-0.02em', lineHeight: 1.0, color: '#f4f2ec' }}>The Crossing</h3>
              <p style={{ margin: '2px 0 0', fontFamily: BODY, fontSize: 13.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', textWrap: 'pretty' as never }}>
                Wendell needs a reliable car to keep showing up. Every superpower has a way in.
              </p>
            </div>

            {/* your lens on this campaign */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 12, padding: '13px 14px' }}>
              <span style={mono(9, 0.14, '#a78bfa')}>Your {primaryLabel} lens · {ori === 'internal' ? 'self-allyship' : 'world-facing'}</span>
              <p style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 600, fontSize: 16, lineHeight: 1.32, letterSpacing: '-0.01em', color: 'var(--bars-text-primary)', textWrap: 'pretty' as never }}>{cell.prompt}</p>
              <p style={{ margin: 0, fontFamily: BODY, fontSize: 12.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', textWrap: 'pretty' as never }}>
                <span style={{ ...mono(8.5, 0.14, '#8c8a83'), marginRight: 6 }}>Make</span>{cell.suggestedArtifact}
              </p>
            </div>

            {/* matched move */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 11, fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '0.02em', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.05, color: '#0a0908', background: 'linear-gradient(150deg,#b794f6,#7c3aed)', boxShadow: '0 8px 18px -10px #7c3aed' }} aria-hidden>
                {role.abbr}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span style={mono(9, 0.14, '#8c8a83')}>Your path · {role.role}</span>
                <span style={{ fontFamily: BODY, fontSize: 13.5, fontWeight: 600, lineHeight: 1.42, color: 'var(--bars-text-primary)', textWrap: 'pretty' as never }}>{role.move}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
              <Link href={CROSSING_HREF} style={{ flex: 1, minWidth: 170, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, color: '#fff', background: 'linear-gradient(150deg,#8b5cf6,#7c3aed)', borderRadius: 11, padding: '12px 16px', textDecoration: 'none', boxShadow: '0 10px 26px -12px #7c3aed, inset 0 1px 0 rgba(255,255,255,0.18)' }}>
                Take this move in The Crossing →
              </Link>
              <Link href={CROSSING_HREF} style={{ flex: 'none', textAlign: 'center', fontFamily: DISPLAY, fontWeight: 600, fontSize: 14, color: '#cdbff5', background: 'transparent', border: '1px solid rgba(124,58,237,0.42)', borderRadius: 11, padding: '12px 16px', textDecoration: 'none' }}>
                See all paths
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* full spectrum */}
      <details style={{ background: 'var(--bars-surface-card)', borderRadius: 12, boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 0 0 1px var(--bars-line)', overflow: 'hidden' }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '14px 16px', ...mono(10, 0.16, 'var(--bars-text-secondary)') }}>See your full spectrum ▾</summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11, padding: '2px 16px 17px' }}>
          {routing.ranked.map((r) => {
            const rEl = superpowerElement(r.superpower)
            const w = `${Math.round(r.pct * 100)}%`
            return (
              <div key={r.superpower} data-element={rEl} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 96, flex: 'none', fontFamily: DISPLAY, fontSize: 13, fontWeight: 500, color: 'var(--bars-text-primary)' }}>{SUPERPOWER_DEFS[r.superpower].label}</span>
                <span style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', borderRadius: 99, background: 'var(--bars-element-gem)', opacity: 0.85, width: w }} />
                </span>
                <span style={{ width: 34, flex: 'none', textAlign: 'right', fontFamily: MONO, fontSize: 10, fontVariantNumeric: 'tabular-nums', color: 'var(--bars-text-secondary)' }}>{w}</span>
              </div>
            )
          })}
        </div>
      </details>

      {/* framing */}
      <p style={{ margin: 0, fontFamily: BODY, fontSize: 12, lineHeight: 1.6, color: 'var(--bars-text-muted)', textWrap: 'pretty' as never }}>{copy.framing}</p>

      {onRetake && (
        <button type="button" className="sp-ghost" onClick={onRetake} style={{ alignSelf: 'flex-start', appearance: 'none', cursor: 'pointer', background: 'none', border: 'none', padding: 0, ...mono(10, 0.16, 'var(--bars-text-muted)') }}>
          ↺ Retake the quiz
        </button>
      )}
    </div>
  )
}
