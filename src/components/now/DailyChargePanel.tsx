'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { applyDailyCharge } from '@/actions/daily-charge'

const NEXT_MOVE: Record<string, string> = {
  captured: 'Name its context',
  context_named: 'Elaborate it',
  elaborated: 'Share or act',
  shared_or_acted: 'Integrate',
  integrated: 'Plant in Garden',
}

type HandBar = { barId: string; title: string; maturity: string }

type DailyChargePanelProps = {
  alreadyDoneToday: boolean
  handBars: HandBar[]
}

type PanelState = 'done' | 'choosing' | 'picking'

export function DailyChargePanel({ alreadyDoneToday, handBars }: DailyChargePanelProps) {
  const router = useRouter()
  const [panelState, setPanelState] = useState<PanelState>(alreadyDoneToday ? 'done' : 'choosing')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const hasAdvanceable = handBars.length > 0

  const handleAdvance = (barId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await applyDailyCharge({ mode: 'advance', barId })
      if ('error' in result) {
        setError(result.error)
        return
      }
      if (!result.success) {
        if (result.reason === 'already-done-today') {
          setPanelState('done')
          return
        }
        setError('Could not advance that BAR')
        return
      }
      setPanelState('done')
      router.refresh()
    })
  }

  return (
    <section>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#d4a017' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a017', boxShadow: '0 0 6px 1px #d4a01788', display: 'inline-block', flex: '0 0 auto' }} />
          Daily charge
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
          Guaranteed ≥ 1 / day
        </span>
      </div>

      {panelState === 'done' && (
        <div style={{ borderRadius: 10, background: 'linear-gradient(160deg, #451a03 0%, #1a0a00 100%)', boxShadow: 'inset 0 0 0 1px #b5651d55, 0 4px 20px -8px #d4a01755' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '17px 18px' }}>
            <span style={{ flex: '0 0 auto', width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, #b5651d 20%, #111110)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px #b5651dbb, 0 0 14px 0 #d4a01766', color: '#d4a017', fontSize: 18 }}>
              ✓
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', margin: 0, color: '#e8e6e0' }}>
                A yellow brick is paved.
              </h3>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11.5, lineHeight: 1.45, color: '#a09e98', margin: '4px 0 0' }}>
                Today's charge is metabolized. Steady accumulation is the form.
              </p>
            </div>
          </div>
        </div>
      )}

      {panelState === 'choosing' && (
        <div style={{ borderRadius: 10, background: '#1a1a18', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '16px 16px 15px' }}>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: 0 }}>
              Spend today's one charge.{' '}
              <strong style={{ color: '#e8e6e0', fontWeight: 700 }}>Mint</strong> a fresh charge, or{' '}
              <strong style={{ color: '#e8e6e0', fontWeight: 700 }}>advance</strong> a BAR you're already holding.
            </p>
            <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
              <a
                href="/bars/create"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  borderRadius: 8,
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '-0.01em',
                  color: '#e8e6e0',
                  background: 'color-mix(in srgb, #b5651d 14%, transparent)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px #b5651dcc',
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Mint a charge
              </a>
              <button
                type="button"
                onClick={() => setPanelState('picking')}
                disabled={!hasAdvanceable}
                style={{
                  flex: 1,
                  cursor: hasAdvanceable ? 'pointer' : 'not-allowed',
                  border: 'none',
                  padding: 12,
                  borderRadius: 8,
                  fontFamily: 'Jost, sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '-0.01em',
                  color: '#e8e6e0',
                  background: '#111110',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.12)',
                  opacity: hasAdvanceable ? 1 : 0.4,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Advance a BAR
              </button>
            </div>
            {!hasAdvanceable && (
              <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#6b6965', margin: '12px 0 0', lineHeight: 1.5 }}>
                Advancing a Vault BAR? Pull it into your hand first.
              </p>
            )}
          </div>
        </div>
      )}

      {panelState === 'picking' && (
        <div style={{ borderRadius: 10, background: '#1a1a18', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '14px 14px 13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
              <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#e8e6e0' }}>
                Advance which BAR?
              </span>
              <button
                type="button"
                onClick={() => { setPanelState('choosing'); setError(null) }}
                style={{ cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#a09e98' }}
              >
                Back
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {handBars.map(bar => (
                <button
                  key={bar.barId}
                  type="button"
                  onClick={() => handleAdvance(bar.barId)}
                  disabled={pending}
                  style={{
                    textAlign: 'left',
                    cursor: pending ? 'not-allowed' : 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '10px 11px',
                    borderRadius: 8,
                    background: '#111110',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.1)',
                    opacity: pending ? 0.5 : 1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ flex: '0 0 auto', width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 7px 1px #7c3aed88' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'Nunito, sans-serif', fontSize: 11.5, lineHeight: 1.3, color: '#e8e6e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bar.title}
                    </span>
                    <span style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b6965', marginTop: 3 }}>
                      {bar.maturity.replace(/_/g, ' ')} → {NEXT_MOVE[bar.maturity] ?? 'Integrate'}
                    </span>
                  </span>
                  <span style={{ flex: '0 0 auto', fontFamily: 'Space Mono, monospace', fontSize: 13, color: '#7c3aed' }}>→</span>
                </button>
              ))}
            </div>
            {error && (
              <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#e05c2e', margin: '8px 0 0' }}>{error}</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
