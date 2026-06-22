'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { captureBar } from '@/actions/capture-bar'
import { resolveOverflow } from '@/actions/hand'
import type { CaptureDestination } from '@/actions/capture-bar'

type OverflowItem = { slotIndex: number; barId: string; title: string; type: string }

export function CaptureBox() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [destination, setDestination] = useState<CaptureDestination>('vault')
  const [pending, startTransition] = useTransition()
  const [flash, setFlash] = useState<string | null>(null)
  const [overflow, setOverflow] = useState<{ newBarId: string; newBarTitle: string; items: OverflowItem[] } | null>(null)

  const canCapture = text.trim().length > 0 && !pending

  const showFlash = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(null), 1700)
  }

  const handleCapture = () => {
    if (!canCapture) return
    const content = text.trim()
    startTransition(async () => {
      const result = await captureBar({ content, destination })
      if ('error' in result) {
        showFlash(result.error)
        return
      }
      if (!result.success) {
        setOverflow({
          newBarId: result.barId,
          newBarTitle: result.overflow.newBarTitle,
          items: result.overflow.currentHand,
        })
        return
      }
      setText('')
      showFlash(destination === 'hand' ? 'Added to hand' : 'Saved to vault')
      router.refresh()
    })
  }

  const handleSwap = (depositBarId: string) => {
    if (!overflow) return
    startTransition(async () => {
      await resolveOverflow({ newBarId: overflow.newBarId, depositBarId })
      setOverflow(null)
      setText('')
      showFlash('Added to hand')
      router.refresh()
    })
  }

  const handleKeepInVault = () => {
    setOverflow(null)
    showFlash('Saved to vault')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleCapture()
  }

  return (
    <footer style={{
      position: 'relative',
      flex: '0 0 auto',
      padding: '14px 20px 28px',
      background: 'linear-gradient(180deg, transparent, #0a0908 22%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
    }}>
      {/* Flash toast */}
      {flash && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: -14,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 14px',
          borderRadius: 9999,
          background: '#242420',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.8)',
          fontFamily: 'Space Mono, monospace',
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color: '#e8e6e0',
          whiteSpace: 'nowrap',
          pointerEvents: 'none' as const,
          zIndex: 10,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ecc71', boxShadow: '0 0 8px 1px #27ae6088' }} />
          {flash}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
          Capture
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
          Felt signal · pre-form
        </span>
      </div>

      {/* Input well */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderRadius: 8, background: '#111110', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}>
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Name what's alive right now…"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'Nunito, sans-serif',
            fontSize: 14,
            color: '#e8e6e0',
          }}
        />
        <button
          type="button"
          title="Voice capture"
          style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', border: 'none', background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)', color: '#a09e98', fontSize: 11, WebkitTapHighlightColor: 'transparent' }}
        >
          ○
        </button>
        <button
          type="button"
          title="Canvas capture"
          onClick={() => router.push('/bars/capture')}
          style={{ flex: '0 0 auto', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', border: 'none', background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)', color: '#a09e98', fontSize: 10, WebkitTapHighlightColor: 'transparent' }}
        >
          ◇
        </button>
      </div>

      {/* Destination toggle + Keep button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 11 }}>
        <div style={{ flex: 1, display: 'flex', gap: 4, padding: 4, borderRadius: 8, background: '#111110', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
          {(['vault', 'hand'] as CaptureDestination[]).map(dest => (
            <button
              key={dest}
              type="button"
              onClick={() => setDestination(dest)}
              style={{
                flex: 1,
                cursor: 'pointer',
                border: 'none',
                padding: '8px 4px',
                borderRadius: 6,
                fontFamily: 'Space Mono, monospace',
                fontSize: 9,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: destination === dest ? '#e8e6e0' : '#6b6965',
                background: destination === dest ? '#1e1e1c' : 'transparent',
                boxShadow: destination === dest
                  ? 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.14)'
                  : 'none',
                transition: 'background-color 0.2s, color 0.2s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {dest.charAt(0).toUpperCase() + dest.slice(1)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleCapture}
          disabled={!canCapture}
          style={{
            flex: '0 0 auto',
            cursor: canCapture ? 'pointer' : 'not-allowed',
            border: 'none',
            padding: '12px 22px',
            borderRadius: 8,
            fontFamily: 'Jost, sans-serif',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '-0.01em',
            color: '#fff',
            background: '#7c3aed',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px color-mix(in srgb, #7c3aed 60%, #000)',
            opacity: canCapture ? 1 : 0.45,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            transition: 'opacity 0.2s',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {pending ? '…' : 'Keep'}
          {!pending && <span style={{ fontSize: 13 }}>→</span>}
        </button>
      </div>

      {/* Overflow modal — hand full */}
      {overflow && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(5,4,3,0.86)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: 18,
        }}>
          <div style={{ borderRadius: 18, background: '#242420', boxShadow: '0 24px 48px -16px rgba(0,0,0,0.9)', padding: 20 }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#e74c3c' }}>
              Hand full · 6 / 6
            </span>
            <h3 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 18, letterSpacing: '-0.015em', margin: '8px 0 0', color: '#e8e6e0' }}>
              Make room for the seed.
            </h3>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: '7px 0 0' }}>
              "{overflow.newBarTitle}" is safe in the Vault. Send one BAR back to the Vault to carry it in your hand instead.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '16px 0 4px', maxHeight: 260, overflowY: 'auto' }}>
              {overflow.items.map(item => (
                <button
                  key={item.barId}
                  type="button"
                  onClick={() => handleSwap(item.barId)}
                  disabled={pending}
                  style={{
                    textAlign: 'left',
                    cursor: pending ? 'not-allowed' : 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '11px 12px',
                    borderRadius: 8,
                    background: '#111110',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.1)',
                    opacity: pending ? 0.5 : 1,
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ flex: '0 0 auto', width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 7px 1px #7c3aed88' }} />
                  <span style={{ flex: 1, minWidth: 0, fontFamily: 'Nunito, sans-serif', fontSize: 12, color: '#e8e6e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.title}
                  </span>
                  <span style={{ flex: '0 0 auto', fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
                    → Vault
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleKeepInVault}
              style={{
                width: '100%',
                marginTop: 10,
                cursor: 'pointer',
                border: 'none',
                padding: 12,
                borderRadius: 8,
                fontFamily: 'Jost, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                color: '#a09e98',
                background: 'transparent',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Keep it in the Vault
            </button>
          </div>
        </div>
      )}
    </footer>
  )
}
