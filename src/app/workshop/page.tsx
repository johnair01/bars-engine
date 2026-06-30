import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'

/**
 * @page /workshop
 * @entity SYSTEM
 * @description PLACEHOLDER STUB for the Allyship Workshop — where the live,
 *   taught craft of delivery is learned (real consent practice, the five-beat
 *   delivery rehearsal, skillful scoping). It exists so the Promise Forge's
 *   "Learn to scope →" / "Learn the delivery in the workshop →" links resolve.
 *   Replace with the real workshop experience when its IA is designed (it may
 *   become a multi-section flow). Recreated from "BARS Allyship Workshop".
 * @permissions public
 * @relationships none (stub)
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:workshop, WHERE:workshop, ENERGY:practice
 * @agentDiscoverable false
 */
export const metadata: Metadata = {
  title: 'The Allyship Workshop · BARS Engine',
  description: 'Where the live craft of delivering a Promise Move is taught. Placeholder.',
}

const DISPLAY = 'var(--bars-font-display)'
const BODY = 'var(--bars-font-body)'
const MONO = 'var(--bars-font-mono)'

function mono(size: number, spacing: number, color: string): CSSProperties {
  return { fontFamily: MONO, fontSize: size, letterSpacing: `${spacing}em`, textTransform: 'uppercase', color }
}

const TEACHES = [
  { n: '01', title: 'Consent that’s real', body: 'How to open with a true question, hold the no, and keep it an invitation rather than a prescription.' },
  { n: '02', title: 'The five-beat delivery', body: 'Approach, probe, present, listen, end — rehearsed out loud, in pairs, until it’s in the body.' },
  { n: '03', title: 'Scoping skillfully', body: 'How to read your own capacity and the moment, so the promise stays inside what you can actually hold.' },
]

const BEATS = [
  { n: '01', label: 'Approach' },
  { n: '02', label: 'Probe' },
  { n: '03', label: 'Present' },
  { n: '04', label: 'Listen' },
  { n: '05', label: 'End' },
]

const DEV_NOTES = [
  'Linked from the Promise Forge in two places: the forge "Learn to scope →" link and the consent step’s "Learn the delivery in the workshop →" link.',
  'Intended content: the live/taught craft the forge deliberately leaves out — consent practice, the 5-beat delivery rehearsal, and skillful scoping.',
  'May become a multi-section flow or richer route rather than a single screen. The forge links can be repointed when the real IA lands.',
  'No real interactions wired here yet — copy is illustrative only.',
]

export default function WorkshopPage() {
  return (
    <div
      style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        fontFamily: BODY, color: 'var(--bars-text-primary)',
        background:
          'radial-gradient(ellipse 1000px 520px at 50% -10%, rgba(124,58,237,0.07), transparent 60%), var(--bars-bg-base)',
      }}
    >
      {/* header */}
      <header style={{ flex: '0 0 auto', padding: '14px 20px 0' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/forge" style={{ ...mono(9, 0.16, 'var(--bars-text-muted)'), textDecoration: 'none' }}>← Forge</Link>
          <span style={mono(9, 0.26, 'var(--bars-text-muted)')}>The Workshop</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--bars-text-secondary)' }} aria-hidden>◇ ○ ●</span>
        </div>
      </header>

      <div className="pf-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 20px 24px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {/* placeholder ribbon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, borderRadius: 'var(--bars-radius-md)', background: 'repeating-linear-gradient(135deg, rgba(124,58,237,0.10) 0 10px, rgba(124,58,237,0.03) 10px 20px)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 38%, var(--bars-line))', padding: '11px 13px' }}>
            <span style={{ flex: '0 0 auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--bars-liminal-glow)', boxShadow: '0 0 12px var(--bars-liminal-glow)' }} aria-hidden />
            <span style={mono(9, 0.12, 'var(--bars-liminal-glow)')}>Placeholder screen · not yet built</span>
          </div>

          <span style={{ display: 'block', marginTop: 20, ...mono(9, 0.16, 'var(--bars-text-muted)') }}>Where the doing is taught</span>
          <h1 style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: '-0.025em', fontSize: 25, lineHeight: 1.12, margin: '9px 0 0', color: 'var(--bars-text-primary)', textWrap: 'balance' as never }}>The Allyship Workshop</h1>
          <p style={{ fontFamily: BODY, fontSize: 13, lineHeight: 1.55, color: 'var(--bars-text-secondary)', margin: '11px 0 0', textWrap: 'pretty' as never }}>
            The forge shapes the <span style={{ color: 'var(--bars-text-primary)' }}>offer</span>. This is where people learn to <span style={{ color: 'var(--bars-text-primary)' }}>deliver</span> it — the live, practiced craft that doesn&rsquo;t belong on a form.
          </p>

          {/* what this will teach */}
          <span style={{ display: 'block', marginTop: 22, ...mono(9, 0.14, 'var(--bars-text-muted)') }}>What it will teach</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 11 }}>
            {TEACHES.map((t) => (
              <div key={t.n} style={{ borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)', padding: '13px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '0.1em', color: 'var(--bars-text-muted)' }}>{t.n}</span>
                  <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-primary)' }}>{t.title}</span>
                </div>
                <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '7px 0 0', textWrap: 'pretty' as never }}>{t.body}</p>
              </div>
            ))}
          </div>

          {/* the five beats */}
          <span style={{ display: 'block', marginTop: 22, ...mono(9, 0.14, 'var(--bars-text-muted)') }}>The five delivery beats · rehearsed here</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
            {BEATS.map((b) => (
              <span key={b.n} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...mono(9, 0.06, 'var(--bars-text-secondary)'), background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', borderRadius: 'var(--bars-radius-full)', padding: '6px 11px' }}>
                <span style={{ color: 'var(--bars-text-muted)' }}>{b.n}</span>{b.label}
              </span>
            ))}
          </div>

          {/* dev notes */}
          <div style={{ marginTop: 24, borderRadius: 'var(--bars-radius-lg)', background: 'color-mix(in srgb, var(--bars-metal-frame) 8%, var(--bars-surface-card))', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-metal-frame) 38%, var(--bars-line))', padding: '15px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: BODY, fontSize: 14, color: 'var(--bars-metal-gem)' }} aria-hidden>金</span>
              <span style={mono(9, 0.12, 'var(--bars-metal-gem)')}>Notes for Claude Code</span>
            </div>
            <p style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '11px 0 0' }}>
              This screen is a <span style={{ color: 'var(--bars-text-primary)' }}>placeholder</span>. It exists only so the links from the Promise Forge resolve. Replace it with the real workshop experience.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 13 }}>
              {DEV_NOTES.map((n) => (
                <div key={n} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <span style={{ flex: '0 0 auto', marginTop: 3, fontFamily: MONO, fontSize: 10, color: 'var(--bars-metal-gem)' }} aria-hidden>›</span>
                  <p style={{ fontFamily: MONO, fontSize: 10.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: 0, textWrap: 'pretty' as never }}>{n}</p>
                </div>
              ))}
            </div>
          </div>

          <Link href="/forge" style={{ display: 'block', marginTop: 18, textDecoration: 'none', textAlign: 'center', width: '100%', padding: 14, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-elevated)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)', color: 'var(--bars-text-secondary)', fontFamily: DISPLAY, fontWeight: 700, fontSize: 13 }}>
            ← Back to the Promise Forge
          </Link>
        </div>
      </div>
    </div>
  )
}
