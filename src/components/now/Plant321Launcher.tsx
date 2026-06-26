'use client'

/**
 * Plant321Launcher — opens the isolated 3·2·1 (Plant) flow on-demand from the NOW
 * page tools rail. Renders a tile button identical to the rail's other tools, but
 * instead of navigating it opens a modal hosting a subject + the shared PlantTriad.
 *
 * On submit it calls the standalone `plantStandalone` server action (no daily
 * session, no TapTheVeinTask), so a 3·2·1 can be run anytime. The daily Tap the
 * Vein ritual is untouched.
 */

import { useState } from 'react'
import Link from 'next/link'
import { PlantTriad } from '@/components/plant/PlantTriad'
import { plantStandalone } from '@/actions/tap-the-vein'

export function Plant321Launcher({
  icon,
  iconColor,
  iconGlow,
  label,
  sub,
  mono,
}: {
  icon: string
  iconColor: string
  iconGlow: string
  label: string
  sub: string
  mono: boolean
}) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneBarId, setDoneBarId] = useState<string | null>(null)
  const purple = 'var(--bars-liminal)'

  function close() {
    setOpen(false)
    // Reset for the next run (the flow is independent each time).
    setSubject('')
    setBusy(false)
    setError(null)
    setDoneBarId(null)
  }

  async function submit(triad: { experienceIntent: string; dissatisfaction: string[]; satisfaction: string[] }) {
    if (!subject.trim()) {
      setError('Name what this is about')
      return
    }
    setBusy(true)
    setError(null)
    const res = await plantStandalone({ subject, ...triad })
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setDoneBarId(res.barId)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          flex: 1,
          textAlign: 'left',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          padding: '13px 12px',
          borderRadius: 8,
          background: '#1a1a18',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <span style={{
          fontFamily: mono ? 'Space Mono, monospace' : 'Jost, sans-serif',
          fontWeight: 800,
          fontSize: mono ? 15 : 17,
          lineHeight: 1,
          color: iconColor,
          textShadow: `0 0 12px ${iconGlow}`,
        }}>
          {icon}
        </span>
        <span style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 12, color: '#e8e6e0' }}>
          {label}
        </span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 7.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6b6965' }}>
          {sub}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.62)' }}
          onClick={close}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full"
            style={{
              maxWidth: 432,
              background: 'var(--bars-surface-elevated)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 -20px 60px rgba(0,0,0,0.6)',
              padding: '10px 16px calc(16px + env(safe-area-inset-bottom))',
              maxHeight: '88vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="flex justify-center pb-3">
              <span style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--bars-line-strong)' }} />
            </div>

            {doneBarId ? (
              <div style={{ paddingBottom: 8 }}>
                <span style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
                  3·2·1 · metabolized
                </span>
                <h2 style={{ fontFamily: 'var(--bars-font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '6px 0 0' }}>
                  Planted.
                </h2>
                <p style={{ fontFamily: 'var(--bars-font-body)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '6px 0 14px' }}>
                  The charge is named and growing in your Garden under today&rsquo;s lens.
                </p>
                <Link
                  href="/garden"
                  className="w-full"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    textDecoration: 'none',
                    minHeight: 48,
                    lineHeight: '48px',
                    borderRadius: 8,
                    background: purple,
                    color: '#fff',
                    fontFamily: 'var(--bars-font-display)',
                    fontWeight: 800,
                    fontSize: 15,
                    boxShadow: 'inset 0 1px 0 var(--bars-inset-top)',
                  }}
                >
                  Open in Garden ❀
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="w-full"
                  style={{ marginTop: 10, minHeight: 44, fontFamily: 'var(--bars-font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)', background: 'transparent' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <div style={{ paddingBottom: 8 }}>
                <span style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
                  Clean Up · 3·2·1
                </span>
                <h2 style={{ fontFamily: 'var(--bars-font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '6px 0 0' }}>
                  What&rsquo;s the charge?
                </h2>
                <p style={{ fontFamily: 'var(--bars-font-body)', fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '6px 0 10px' }}>
                  Name what&rsquo;s up — then the arc: a desired outcome, where you are now, where you want to be.
                </p>

                <textarea
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What are you carrying right now?"
                  rows={2}
                  style={{
                    width: '100%',
                    resize: 'none',
                    marginBottom: 14,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--bars-surface-card)',
                    color: 'var(--bars-text-primary)',
                    fontFamily: 'var(--bars-font-body)',
                    fontSize: 14,
                    boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)',
                    outline: 'none',
                  }}
                />

                <PlantTriad busy={busy} onSubmit={submit} />

                {error && (
                  <p style={{ fontFamily: 'var(--bars-font-mono)', fontSize: 10, letterSpacing: '0.04em', color: '#e06b6b', margin: '10px 2px 0' }}>
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={close}
                  className="w-full"
                  style={{ marginTop: 10, minHeight: 44, fontFamily: 'var(--bars-font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)', background: 'transparent' }}
                >
                  ← Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
