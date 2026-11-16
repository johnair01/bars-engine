'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  DEFAULT_CULTIVATOR,
  FEELINGS,
  FEELING_LINES,
  FRAMES,
  PAY,
  STORY,
  PLACES,
  ROBES,
  SKIN_RAMP,
  courierLine,
  keepsakeLine,
  placesFor,
  stuckStep,
  type Cultivator,
  type Offer,
  type Place,
} from '@/lib/founder-gate/content'
import { setShippedCount } from '@/actions/founder-gate'

type Screen = 'gate' | 'story' | 'make' | 'feeling' | 'grounds' | 'place' | 'keepsake'

const GOLD = '#f3d27a'
const INK = '#f1ebf7'
const MUTED = '#b9abc9'
const CARD = 'rgba(255,255,255,0.06)'
const LINE = 'rgba(255,255,255,0.18)'

const btn: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 14,
  border: `1px solid ${LINE}`,
  background: CARD,
  color: INK,
  padding: '10px 14px',
  fontSize: '1rem',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
const primary: React.CSSProperties = { ...btn, background: GOLD, color: '#1c1822', border: `1px solid ${GOLD}`, fontWeight: 700, textAlign: 'center' }

function CopyPay({ kind }: { kind: 'venmo' | 'cashapp' }) {
  const [done, setDone] = useState(false)
  const handle = PAY[kind]
  const name = kind === 'venmo' ? 'Venmo' : 'Cash App'
  return (
    <button
      type="button"
      style={{ ...btn, flex: 1, display: 'grid', gap: 2 }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(handle)
        } catch {
          /* the handle is on screen to copy by hand */
        }
        setDone(true)
        setTimeout(() => setDone(false), 2500)
      }}
    >
      <span style={{ color: MUTED, fontSize: '.8rem' }}>{name}</span>
      <span style={{ fontWeight: 700 }}>{handle}</span>
      <span style={{ color: GOLD, fontSize: '.8rem' }} aria-live="polite">{done ? 'Copied. Open the app and paste.' : 'Tap to copy'}</span>
    </button>
  )
}

function PayRow() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <CopyPay kind="venmo" />
      <CopyPay kind="cashapp" />
    </div>
  )
}

function OfferingExit() {
  return (
    <div style={{ display: 'grid', gap: 8, marginTop: 6 }}>
      <p style={{ margin: 0, color: MUTED, fontSize: '.92rem' }}>Short on time? Leave an offering at the gate and go. Tap a handle to copy it.</p>
      <PayRow />
    </div>
  )
}

function OfferView({ offer }: { offer: Offer }) {
  if (offer.pay) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <div><b>{offer.label}</b>{offer.detail ? <span style={{ color: MUTED }}> · {offer.detail}</span> : null}</div>
        <PayRow />
      </div>
    )
  }
  return (
    <a href={offer.href} target="_blank" rel="noopener noreferrer" style={{ ...btn, display: 'block', textDecoration: 'none' }}>
      <b>{offer.label}</b>
      {offer.detail ? <span style={{ color: MUTED, display: 'block', fontSize: '.88rem' }}>{offer.detail}</span> : null}
    </a>
  )
}

export function GateWalk({ shipped, isAdmin }: { shipped: number | null; isAdmin: boolean }) {
  const [screen, setScreen] = useState<Screen>('gate')
  const [me, setMe] = useState<Cultivator>(DEFAULT_CULTIVATOR)
  const [feeling, setFeeling] = useState<string | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [visited, setVisited] = useState<string[]>([])
  const [stuck, setStuck] = useState(false)
  const [name, setName] = useState('')
  const [view, setView] = useState(0)
  const [beat, setBeat] = useState(0)
  const [ready, setReady] = useState<'wait' | 'yes' | 'no'>('wait')
  const frame = useRef<HTMLIFrameElement>(null)

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: 'ally-gate-figure', ...me, view }, window.location.origin)
  }, [me, view])
  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'ally-gate-ready') setReady('yes')
      if (e.data?.type === 'ally-gate-failed') setReady('no')
    }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, [])
  useEffect(() => { send() }, [send])

  const go = (s: Screen) => { setScreen(s); setStuck(false); window.scrollTo({ top: 0 }) }
  const feel = FEELINGS.find((f) => f.id === feeling) ?? null
  const big = screen === 'gate' || screen === 'make' || screen === 'keepsake'
  const lit = feeling ? placesFor(feeling) : []

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(125% 85% at 50% -10%, #2a1f35 0%, #17121c 62%)', color: INK, fontFamily: 'var(--bars-font-body, system-ui, sans-serif)' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 18px 56px', display: 'grid', gap: 18 }}>
        <p style={{ margin: 0, color: GOLD, letterSpacing: '.14em', fontSize: '.72rem', textTransform: 'uppercase' }}>The Heaven sect · outer grounds</p>

        {/* the one figure: large at the gate, the maker and the keepsake; small while you walk */}
        <div style={{ height: big ? 380 : 132, borderRadius: 18, overflow: 'hidden', border: `1px solid ${LINE}`, background: '#1c1822', transition: 'height .25s' }}>
          <iframe
            ref={frame}
            title="Your cultivator. Tap the figure to turn it."
            src="/ally-gate/figure.html"
            onLoad={send}
            style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
          />
        </div>
        {ready === 'no' && <p style={{ margin: 0, color: MUTED, fontSize: '.88rem' }}>The figure did not load on this device. The walk works without it.</p>}

        {screen === 'gate' && (
          <section style={{ display: 'grid', gap: 14 }}>
            <h1 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.7rem', lineHeight: 1.2 }}>Wendell’s Gate</h1>
            <p style={{ margin: 0, color: MUTED, lineHeight: 1.5 }}>An old friend has fallen on hard times again. Read how it came to this, then make your own cultivator and find the kind of help that feels alive for you.</p>
            <button type="button" style={primary} onClick={() => { setBeat(0); go('story') }}>Read the story</button>
            <OfferingExit />
          </section>
        )}

        {screen === 'story' && (() => { const sb = STORY[beat]; const last = beat === STORY.length - 1; return (
          <section style={{ display: 'grid', gap: 14 }}>
            <img src={sb.img} alt={sb.alt} style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 18, border: `1px solid ${LINE}` }} />
            <p style={{ margin: 0, color: MUTED, fontSize: '.75rem' }}>{beat + 1} of {STORY.length}{sb.placeholder ? ' · placeholder text, the real story is coming' : ''}</p>
            <h2 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.5rem' }}>{sb.title}</h2>
            <p style={{ margin: 0, lineHeight: 1.55 }}>{sb.text}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {beat > 0 && <button type="button" style={{ ...btn, flex: '0 0 auto' }} onClick={() => setBeat(beat - 1)}>Back</button>}
              <button type="button" style={{ ...primary, flex: 1 }} onClick={() => (last ? go('make') : setBeat(beat + 1))}>{last ? 'Make your cultivator' : 'Next'}</button>
            </div>
            <OfferingExit />
          </section>) })()}

        {screen === 'make' && (
          <section style={{ display: 'grid', gap: 16 }}>
            <h2 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.4rem' }}>Make your cultivator</h2>
            <p style={{ margin: 0, color: MUTED, fontSize: '.92rem' }}>Tap to choose. Tap the figure to turn it. You can change anything later.</p>
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <legend style={{ color: GOLD, fontSize: '.8rem', marginBottom: 6 }}>Frame</legend>
              <div style={{ display: 'flex', gap: 8 }}>
                {FRAMES.map((f) => (
                  <button key={f.id} type="button" aria-pressed={me.who === f.id} style={{ ...btn, flex: 1, borderColor: me.who === f.id ? GOLD : LINE }} onClick={() => setMe({ ...me, who: f.id })}>{f.name}</button>
                ))}
              </div>
            </fieldset>
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <legend style={{ color: GOLD, fontSize: '.8rem', marginBottom: 6 }}>Robe</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {ROBES.map((r) => (
                  <button key={r.id} type="button" aria-pressed={me.outfit === r.id} style={{ ...btn, borderColor: me.outfit === r.id ? GOLD : LINE, padding: '8px 12px' }} onClick={() => setMe({ ...me, outfit: r.id })}>
                    <b style={{ display: 'block', fontSize: '.95rem' }}>{r.name}</b>
                    <span style={{ color: MUTED, fontSize: '.78rem' }}>{r.note}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <legend style={{ color: GOLD, fontSize: '.8rem', marginBottom: 6 }}>Skin</legend>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
                {SKIN_RAMP.map((c, i) => (
                  <button key={c} type="button" aria-label={`Skin tone ${i + 1} of 8`} aria-pressed={me.skin === i} onClick={() => setMe({ ...me, skin: i })}
                    style={{ width: 38, height: 38, borderRadius: '50%', background: c, border: me.skin === i ? `3px solid ${GOLD}` : `1px solid ${LINE}`, cursor: 'pointer', padding: 0 }} />
                ))}
              </div>
            </fieldset>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={{ ...btn, flex: '0 0 auto' }} onClick={() => setView((v) => (v + 1) % 4)}>Turn</button>
              <button type="button" style={{ ...primary, flex: 1 }} onClick={() => go('feeling')}>This is my cultivator</button>
            </div>
          </section>
        )}

        {screen === 'feeling' && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.4rem' }}>Which feeling did you come for?</h2>
            <p style={{ margin: 0, color: MUTED, fontSize: '.92rem' }}>Pick the one you would most like to feel today. It lights the places that serve it.</p>
            {FEELINGS.map((f) => (
              <button key={f.id} type="button" style={{ ...btn, display: 'grid', gap: 2 }} onClick={() => { setFeeling(f.id); go('grounds') }}>
                <b style={{ fontSize: '1.1rem' }}>{f.name}</b>
                <span style={{ color: MUTED, fontSize: '.9rem' }}>{FEELING_LINES[f.id]}</span>
              </button>
            ))}
          </section>
        )}

        {screen === 'grounds' && feel && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.4rem' }}>The outer grounds</h2>
            <p style={{ margin: 0, color: MUTED, fontSize: '.92rem' }}>Each lit place is a move toward {feel.name}. Walk to one.</p>
            {PLACES.map((p) => {
              const on = lit.includes(p)
              return (
                <button key={p.id} type="button" disabled={!on} style={{ ...btn, display: 'grid', gap: 2, opacity: on ? 1 : 0.38, borderColor: on ? GOLD : LINE }}
                  onClick={() => { setPlace(p); setVisited((v) => (v.includes(p.id) ? v : [...v, p.id])); go('place') }}>
                  <b>{p.name}</b>
                  <span style={{ color: MUTED, fontSize: '.88rem' }}>{p.blurb}</span>
                </button>
              )
            })}
            <button type="button" style={btn} onClick={() => setStuck((s) => !s)} aria-expanded={stuck}>Stuck?</button>
            {stuck && (() => { const s = stuckStep(feel.id); return (
              <div style={{ ...btn, cursor: 'default', display: 'grid', gap: 6 }}>
                <b style={{ color: GOLD }}>{s.move}</b>
                <span>{s.action}</span>
              </div>) })()}
            <button type="button" style={primary} onClick={() => go('keepsake')}>I am ready to take my keepsake</button>
          </section>
        )}

        {screen === 'place' && place && feel && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.4rem' }}>{place.name}</h2>
            <p style={{ margin: 0, color: MUTED }}>{place.blurb}</p>
            {place.id === 'couriers-post' && courierLine(shipped) && <p style={{ margin: 0, color: GOLD }}>{courierLine(shipped)}</p>}
            <div style={{ display: 'grid', gap: 8 }}>
              {place.offers.map((o) => <OfferView key={o.label} offer={o} />)}
            </div>
            <a href={place.window.href} target="_blank" rel="noopener noreferrer" style={{ ...btn, display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', background: 'rgba(243,210,122,.08)' }}>
              {place.window.img ? <img src={place.window.img} alt="" width={64} height={64} style={{ objectFit: 'cover', borderRadius: 10 }} /> : null}
              <span><span style={{ color: MUTED, fontSize: '.75rem', display: 'block' }}>A window</span>{place.window.label}</span>
            </a>
            <button type="button" style={btn} onClick={() => go('grounds')}>Back to the grounds</button>
          </section>
        )}

        {screen === 'keepsake' && feel && (
          <section style={{ display: 'grid', gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.4rem' }}>{name.trim() ? `${name.trim()}, your keepsake` : 'Your keepsake'}</h2>
            <p style={{ margin: 0, lineHeight: 1.5 }}>{keepsakeLine(feel.id, visited)}</p>
            <p style={{ margin: 0, color: MUTED, fontSize: '.9rem' }}>Your cultivator stands in the sect. Take a screenshot to keep this. You are the hero of this story, and the move was yours.</p>
            <label style={{ display: 'grid', gap: 4, color: MUTED, fontSize: '.85rem' }}>
              Name on the keepsake (optional)
              <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} style={{ ...btn, cursor: 'text' }} />
            </label>
            <button type="button" style={btn} onClick={() => go('grounds')}>Walk some more</button>
          </section>
        )}

        {isAdmin && <AdminCount shipped={shipped} />}
      </div>
    </main>
  )
}

function AdminCount({ shipped }: { shipped: number | null }) {
  const [v, setV] = useState(shipped === null ? '' : String(shipped))
  const [msg, setMsg] = useState('')
  const [pending, start] = useTransition()
  return (
    <div style={{ ...btn, cursor: 'default', display: 'grid', gap: 8 }}>
      <b style={{ color: GOLD, fontSize: '.85rem' }}>Admin: courier’s count (shipped copies)</b>
      <div style={{ display: 'flex', gap: 8 }}>
        <input inputMode="numeric" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ''))} style={{ ...btn, flex: 1, minHeight: 40 }} aria-label="Shipped copies" />
        <button type="button" disabled={pending || v === ''} style={{ ...btn, minHeight: 40 }}
          onClick={() => start(async () => { const r = await setShippedCount(Number(v)); setMsg(r.ok ? 'Saved' : r.error) })}>Save</button>
      </div>
      <span aria-live="polite" style={{ color: MUTED, fontSize: '.8rem' }}>{msg}</span>
    </div>
  )
}
