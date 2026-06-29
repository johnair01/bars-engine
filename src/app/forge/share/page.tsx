import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import Link from 'next/link'

/**
 * @page /forge/share
 * @entity SYSTEM
 * @description The public, shareable face of a published Promise Move —
 *   invitation-shaped, consent-forward, scope and boundary in plain sight.
 *   Driven by `owner` + `status` search params (status: available | practice |
 *   paused | retired). Recreated from "BARS Promise Move - Share Card".
 * @searchParams owner:string (default "Maya")
 * @searchParams status:string (available | practice | paused | retired)
 * @permissions public
 * @relationships CUSTOM_BAR (the move being shared)
 * @energyCost 0
 * @dimensions WHO:owner, WHAT:promise move, WHERE:share, ENERGY:request
 * @agentDiscoverable false
 */
export const metadata: Metadata = {
  title: 'A Promise, Shared · BARS Engine',
  description: 'The public face of a forged Promise Move — an invitation you can request.',
}

const DISPLAY = 'var(--bars-font-display)'
const BODY = 'var(--bars-font-body)'
const MONO = 'var(--bars-font-mono)'

function mono(size: number, spacing: number, color: string): CSSProperties {
  return { fontFamily: MONO, fontSize: size, letterSpacing: `${spacing}em`, textTransform: 'uppercase', color }
}

type StatusKey = 'available' | 'practice' | 'paused' | 'retired'

type Props = { searchParams: Promise<{ owner?: string; status?: string }> }

export default async function ShareCardPage({ searchParams }: Props) {
  const sp = await searchParams
  const owner = sp.owner || 'Maya'
  const status = (['available', 'practice', 'paused', 'retired'].includes(sp.status || '')
    ? sp.status
    : 'available') as StatusKey

  const MAP: Record<StatusKey, { label: string; dot: string; glow: string; requestable: boolean; uTitle?: string; uBody?: string }> = {
    available: { label: 'Available', dot: 'var(--bars-wood-gem)', glow: '0 0 8px var(--bars-wood-glow)', requestable: true },
    practice: { label: 'Practicing', dot: 'var(--bars-earth-gem)', glow: '0 0 8px var(--bars-earth-glow)', requestable: true },
    paused: { label: 'Paused', dot: 'var(--bars-text-muted)', glow: 'none', requestable: false,
      uTitle: 'Paused right now', uBody: `${owner} has stepped back from this one for a bit. Check back later.` },
    retired: { label: 'Retired', dot: 'var(--bars-text-muted)', glow: 'none', requestable: false,
      uTitle: 'No longer offered', uBody: `${owner} has retired this move. It’s kept here for the record.` },
  }
  const m = MAP[status]

  return (
    <div
      style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        fontFamily: BODY, color: 'var(--bars-text-primary)',
        background:
          'radial-gradient(ellipse 1000px 540px at 82% -8%, rgba(124,58,237,0.07), transparent 60%), var(--bars-bg-base)',
      }}
    >
      {/* header */}
      <header style={{ flex: '0 0 auto', padding: '14px 20px 0' }}>
        <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/forge" style={{ ...mono(9, 0.16, 'var(--bars-text-muted)'), textDecoration: 'none' }}>← Forge</Link>
          <span style={mono(9, 0.26, 'var(--bars-text-muted)')}>Promise Move</span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--bars-text-secondary)' }} aria-hidden>◇ ○ ●</span>
        </div>
      </header>

      {/* scroll body */}
      <div className="pf-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px 14px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {/* invitation opener */}
          <div style={{ borderRadius: 'var(--bars-radius-lg)', background: 'color-mix(in srgb, var(--bars-liminal) 9%, var(--bars-surface-card))', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 34%, var(--bars-line))', padding: '15px 16px' }}>
            <span style={mono(8.5, 0.14, 'var(--bars-liminal-glow)')}>An invitation from {owner}</span>
            <p style={{ fontFamily: BODY, fontSize: 13, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '9px 0 0', textWrap: 'pretty' as never }}>
              Here&rsquo;s something I&rsquo;m practicing offering. If it would be useful, you&rsquo;re welcome to ask for it — this way.
            </p>
          </div>

          {/* the move card */}
          <div
            data-element="metal"
            style={{
              position: 'relative', overflow: 'hidden', marginTop: 14, borderRadius: 14, padding: '18px 18px 16px',
              background: 'radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, var(--bars-metal-frame) 14%, transparent), transparent 60%), linear-gradient(180deg,#1d1d1a,#1a1a18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1.5px var(--bars-metal-frame), 0 0 24px -4px var(--bars-metal-glow), 0 30px 60px -34px rgba(0,0,0,0.85)',
            }}
          >
            <span style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%,-50%)', fontFamily: BODY, fontSize: 160, lineHeight: 1, opacity: 0.06, color: 'var(--bars-metal-gem)', pointerEvents: 'none' }} aria-hidden>金</span>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={mono(8.5, 0.12, 'var(--bars-metal-gem)')}>Open · Skillful Organizing</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...mono(8, 0.1, 'var(--bars-text-secondary)'), background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', borderRadius: 'var(--bars-radius-full)', padding: '5px 9px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, boxShadow: m.glow }} aria-hidden />
                  {m.label}
                </span>
              </div>
              <h1 style={{ fontFamily: DISPLAY, fontWeight: 800, letterSpacing: '-0.02em', fontSize: 27, lineHeight: 1.08, margin: '13px 0 0', color: 'var(--bars-text-primary)' }}>Map the Tangle</h1>
              <p style={{ fontFamily: BODY, fontSize: 14, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '11px 0 0', textWrap: 'pretty' as never }}>
                &ldquo;I help people find the one knot that, once loosened, frees the rest — before they spend energy everywhere.&rdquo;
              </p>
            </div>
          </div>

          {/* what this helps with */}
          <div style={{ marginTop: 18 }}>
            <span style={mono(9, 0.14, 'var(--bars-text-muted)')}>What this helps with</span>
            <p style={{ fontFamily: BODY, fontSize: 13, lineHeight: 1.55, color: 'var(--bars-text-primary)', margin: '9px 0 0', textWrap: 'pretty' as never }}>
              When you&rsquo;re staring at a long list and everything feels equally urgent — I&rsquo;ll find the single thing that, once moved, makes the rest easier or unnecessary.
            </p>
          </div>

          {/* promise + scope + boundary grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            <div style={{ borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)', padding: '13px 14px' }}>
              <span style={mono(8.5, 0.12, 'var(--bars-text-muted)')}>What I promise</span>
              <p style={{ fontFamily: BODY, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-primary)', margin: '7px 0 0', textWrap: 'pretty' as never }}>
                I&rsquo;ll sit with your whole list and reflect back the single knot that, once loosened, frees the rest. You leave able to say the one thing out loud, in your own words.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)', padding: '13px 14px' }}>
                <span style={mono(8.5, 0.12, 'var(--bars-wood-gem)')}>In scope</span>
                <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '7px 0 0', textWrap: 'pretty' as never }}>One list, one knot. A single 30-min pass.</p>
              </div>
              <div style={{ flex: 1, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-metal-frame) 35%, var(--bars-line))', padding: '13px 14px' }}>
                <span style={mono(8.5, 0.12, 'var(--bars-metal-gem)')}>Not in scope</span>
                <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '7px 0 0', textWrap: 'pretty' as never }}>Running the project, or whose fault the knot is.</p>
              </div>
            </div>

            <div style={{ borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', padding: '12px 14px' }}>
              <span style={mono(8.5, 0.12, 'var(--bars-text-muted)')}>If I can&rsquo;t deliver</span>
              <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '7px 0 0', textWrap: 'pretty' as never }}>I&rsquo;ll say so within 2 days and hand your list back untouched — no half-help.</p>
            </div>
          </div>

          {/* consent ask — prominent */}
          <div style={{ marginTop: 18, borderRadius: 'var(--bars-radius-lg)', background: 'color-mix(in srgb, var(--bars-liminal) 12%, var(--bars-surface-card))', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-liminal) 46%, var(--bars-line)), 0 0 22px -9px var(--bars-liminal-glow)', padding: '15px 16px' }}>
            <span style={mono(8.5, 0.14, 'var(--bars-liminal-glow)')}>Before I help, I&rsquo;ll ask</span>
            <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15.5, lineHeight: 1.34, margin: '9px 0 0', color: 'var(--bars-text-primary)', textWrap: 'pretty' as never }}>
              &ldquo;Would it help to have someone find the one knot with you right now?&rdquo;
            </p>
            <p style={{ fontFamily: BODY, fontSize: 11, lineHeight: 1.4, color: 'var(--bars-text-muted)', margin: '9px 0 0' }}>It&rsquo;s an invitation, not a prescription. No is a complete answer.</p>
          </div>

          {/* how to ask */}
          <div style={{ marginTop: 18 }}>
            <span style={mono(9, 0.14, 'var(--bars-text-muted)')}>How to ask for it</span>
            <div style={{ marginTop: 10, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)', padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ flex: '0 0 auto', fontFamily: BODY, fontSize: 18, color: 'var(--bars-liminal-glow)' }} aria-hidden>&ldquo;</span>
              <p style={{ fontFamily: BODY, fontSize: 13.5, lineHeight: 1.4, color: 'var(--bars-text-primary)', margin: 0 }}>Can you help me find the one thing?</p>
            </div>
            <p style={{ ...mono(8.5, 0.08, 'var(--bars-text-muted)'), margin: '9px 2px 0' }}>Then: a 30-min call, or async voice notes back within 2 days.</p>
          </div>

          {/* example encounters */}
          <div style={{ marginTop: 18 }}>
            <span style={mono(9, 0.14, 'var(--bars-text-muted)')}>When people tend to ask</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 11 }}>
              {[
                'A launch plan has twelve tasks and no order.',
                'A team keeps re-deciding the same thing each week.',
                'A to-do list hides one real blocker behind ten chores.',
              ].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <span style={{ flex: '0 0 auto', marginTop: 5, width: 4, height: 4, borderRadius: '50%', background: 'var(--bars-metal-gem)', boxShadow: '0 0 8px var(--bars-metal-glow)' }} aria-hidden />
                  <p style={{ fontFamily: BODY, fontSize: 12, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: 0 }}>{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* request CTA footer */}
      <footer style={{ flex: '0 0 auto', padding: '13px 20px 18px', background: 'linear-gradient(180deg, transparent, var(--bars-bg-base) 32%)', boxShadow: 'inset 0 1px 0 var(--bars-line)' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {m.requestable ? (
            <>
              <button style={{ width: '100%', padding: 15, border: 'none', borderRadius: 'var(--bars-radius-md)', cursor: 'pointer', background: 'var(--bars-liminal)', color: '#fff', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, boxShadow: '0 0 26px -7px var(--bars-liminal-glow), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
                Ask {owner} for this →
              </button>
              <p style={{ ...mono(8.5, 0.1, 'var(--bars-text-muted)'), textAlign: 'center', margin: '10px 0 0' }}>You&rsquo;ll be asked for consent before anything happens</p>
            </>
          ) : (
            <div style={{ width: '100%', padding: 14, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-elevated)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)', textAlign: 'center' }}>
              <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 13.5, color: 'var(--bars-text-secondary)', margin: 0 }}>{m.uTitle}</p>
              <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.4, color: 'var(--bars-text-muted)', margin: '6px 0 0' }}>{m.uBody}</p>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
