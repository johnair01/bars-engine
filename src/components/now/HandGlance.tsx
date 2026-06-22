'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { listMovableVaultBars, promoteVaultBarToHand, type MovableVaultBar } from '@/actions/hand'

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
  // Empty-slot Vault picker (bottom sheet). `pickerSlot` is the target slot.
  const router = useRouter()
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)

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
                <button
                  key={slot.slotIndex}
                  type="button"
                  onClick={() => setPickerSlot(slot.slotIndex)}
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
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, color 0.2s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  +
                </button>
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

      {pickerSlot !== null && (
        <EmptySlotSheet
          slotIndex={pickerSlot}
          onClose={() => setPickerSlot(null)}
          onPicked={() => {
            setPickerSlot(null)
            router.refresh()
          }}
        />
      )}
    </section>
  )
}

/**
 * Bottom sheet for an empty Hand slot: pull an existing Vault BAR in, or
 * capture a new one. Vault BARs are lazy-loaded when the sheet opens.
 */
function EmptySlotSheet({
  slotIndex,
  onClose,
  onPicked,
}: {
  slotIndex: number
  onClose: () => void
  onPicked: () => void
}) {
  const [bars, setBars] = useState<MovableVaultBar[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let active = true
    listMovableVaultBars().then(res => {
      if (!active) return
      if ('error' in res) setError(res.error)
      else setBars(res)
    })
    return () => { active = false }
  }, [])

  const pull = (barId: string) => {
    startTransition(async () => {
      const res = await promoteVaultBarToHand({ barId, targetSlot: slotIndex })
      if ('error' in res) {
        setError(res.error)
        return
      }
      onPicked()
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(5,4,3,0.86)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 18,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ borderRadius: 18, background: '#242420', boxShadow: '0 24px 48px -16px rgba(0,0,0,0.9)', padding: 20, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 17, letterSpacing: '-0.015em', margin: 0, color: '#e8e6e0' }}>
            Fill this slot
          </h3>
          <Link href="/bars/capture" style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#c4b5fd', textDecoration: 'none' }}>
            + Capture new
          </Link>
        </div>

        {error && (
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#e74c3c', margin: '0 0 10px' }}>{error}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          {bars === null && !error && (
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#6b6965', margin: 0 }}>Loading your Vault…</p>
          )}
          {bars && bars.length === 0 && (
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#6b6965', margin: 0 }}>
              No Vault BARs to pull in. Capture a new one above.
            </p>
          )}
          {bars?.map(b => {
            const el = isElementKey(b.element) ? ELEMENT_TOKENS[b.element] : null
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => pull(b.id)}
                disabled={pending}
                style={{
                  textAlign: 'left', cursor: pending ? 'not-allowed' : 'pointer', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 8,
                  background: '#111110', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.1)',
                  opacity: pending ? 0.5 : 1, WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ flex: '0 0 auto', width: 8, height: 8, borderRadius: '50%', background: el ? el.gem : '#7c3aed', boxShadow: `0 0 7px 1px ${el ? el.glow : '#7c3aed'}88` }} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#e8e6e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {b.title}
                </span>
                <span style={{ flex: '0 0 auto', fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
                  → Hand
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
