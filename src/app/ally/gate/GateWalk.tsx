'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import {
  DEFAULT_CULTIVATOR,
  DREAMS,
  FEELINGS,
  FRAMES,
  GROUND_SPOTS,
  IMPACT_LINE,
  PLACES,
  PLACE_SPOTS,
  PLACE_IMG,
  keepsakeLine,
  placesFor,
  stuckStep,
  LINKS,
  PAY,
  ROBES,
  SCENES,
  SKIN_RAMP,
  STORY,
  STORY_IMG,
  courierLine,
  type Cultivator,
  type Hotspot,
  type Scene,
} from '@/lib/founder-gate/content'
import { setShippedCount } from '@/actions/founder-gate'

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


const ROBE_COLOR: Record<string, string> = { A1: '#3b4a8a', A2: '#b99a6b', B1: '#3f6b52', B2: '#8a7a64', C1: '#efe6c8', C2: '#7d7a86' }

interface Ctx { feeling: string | null; stuckDone: boolean; shipped: number | null }

/** The scene for an id: a story beat is built from STORY (his text) and STORY_IMG (real stills); grounds and places depend on the feeling picked. */
function sceneFor(id: string, c: Ctx): Scene | null {
  const m = /^story-(\d)$/.exec(id)
  if (m) {
    const i = Number(m[1])
    const b = STORY[i]
    const im = STORY_IMG[i]
    if (!b || !im) return null
    return { id, img: im.img, pos: im.pos, motion: im.motion, domain: `${b.title} · draft`, lines: b.paras, next: i === STORY.length - 1 ? 'shape' : `story-${i + 1}`, source: im.source, standIn: true }
  }
  const f = FEELINGS.find((x) => x.id === c.feeling)
  if (id === 'grounds' && f) {
    const lit = placesFor(f.id)
    return {
      id, img: SCENES.feeling.img, motion: 'out', domain: 'The outer grounds · the places', source: SCENES.feeling.source,
      lines: [`Each lit place is a move toward ${f.name}. ${IMPACT_LINE}`],
      hotspots: [
        ...PLACES.map((p) => {
          const quiet = p.id === 'quiet-room'
          const on = quiet ? c.stuckDone : lit.includes(p)
          const [x, y] = GROUND_SPOTS[p.id] ?? [50, 50]
          return { id: p.id, x, y, label: quiet && !c.stuckDone ? `${p.name} (opens when you are stuck)` : p.name, to: on ? (quiet ? 'place-quiet-room' : `place-${p.id}`) : undefined, locked: !on, note: !on ? (quiet ? 'This room opens only when something specific has you stuck. Tap Stuck? and find out.' : `This place does not serve ${f.name}. Pick another feeling to light it.`) : undefined }
        }),
        { id: 'stuck', x: 50, y: 40, label: 'Stuck?', to: 'stuck' },
      ],
      next: 'dream', nextLabel: 'Plant my dream',
    }
  }
  if (id === 'stuck' && f) {
    const st = stuckStep(f.id)
    return { ...SCENES.stuck, lines: [SCENES.stuck.lines[0], `${st.move}. ${st.action}`], hotspots: [
      { id: 'still', x: 30, y: 40, label: 'I am still stuck on this', to: 'room-intro' },
      { id: 'free', x: 72, y: 44, label: 'That moved me', to: 'grounds' },
    ] }
  }
  const pm = /^place-(.+)$/.exec(id)
  if (pm) {
    const p = PLACES.find((x) => x.id === pm[1]); const im = PLACE_IMG[pm[1]]
    if (!p || !im) return null
    const cl = p.id === 'couriers-post' ? courierLine(c.shipped) : null
    const links = p.offers.filter((o) => o.href)
    return {
      id, img: im.img, pos: im.pos, motion: 'in', domain: `${p.name} · direct action`, standIn: im.standIn, source: im.source,
      lines: [`${p.blurb}${cl ? ` ${cl}.` : ''}`],
      hotspots: links.map((o, i) => ({ id: o.label, x: PLACE_SPOTS[i % 4][0], y: PLACE_SPOTS[i % 4][1], label: o.label, href: o.href })),
      next: 'grounds', nextLabel: 'Back to the grounds',
    }
  }
  return SCENES[id] ?? null
}

const CSS = `
@keyframes gw-in{from{transform:scale(1)}to{transform:scale(1.14)}}
@keyframes gw-out{from{transform:scale(1.14)}to{transform:scale(1)}}
@keyframes gw-left{from{transform:scale(1.1) translateX(2.5%)}to{transform:scale(1.1) translateX(-2.5%)}}
@keyframes gw-right{from{transform:scale(1.1) translateX(-2.5%)}to{transform:scale(1.1) translateX(2.5%)}}
@keyframes gw-ring{0%{box-shadow:0 0 0 0 rgba(243,210,122,.7)}100%{box-shadow:0 0 0 18px rgba(243,210,122,0)}}
@keyframes gw-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.gw-img{animation-duration:16s;animation-timing-function:ease-in-out;animation-fill-mode:both}
.gw-fade{animation:gw-fade .6s ease both}
.gw-ring{animation:gw-ring 1.8s ease-out infinite}
@media (prefers-reduced-motion: reduce){.gw-img,.gw-ring,.gw-fade{animation:none!important}}
`

const chip: React.CSSProperties = { background: 'rgba(23,18,28,.78)', color: INK, border: `1px solid ${GOLD}`, borderRadius: 999, padding: '8px 14px', fontSize: '.92rem', fontFamily: 'inherit', cursor: 'pointer', backdropFilter: 'blur(4px)' }

function Spot({ h, onTap, lit }: { h: Hotspot; onTap: () => void; lit?: boolean }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onTap() }} aria-label={h.label}
      style={{ position: 'absolute', left: `${h.x}%`, top: `${h.y}%`, transform: 'translate(-50%,-50%)', background: 'none', border: 0, padding: 0, cursor: 'pointer', display: 'grid', justifyItems: 'center', gap: 6, maxWidth: 170, zIndex: 3, opacity: h.locked ? 0.5 : 1 }}>
      <span className="gw-ring" style={{ width: 22, height: 22, borderRadius: '50%', background: lit ? GOLD : 'rgba(243,210,122,.55)', border: `2px solid ${GOLD}`, display: 'block' }} />
      <span style={{ ...chip, padding: '6px 11px', fontSize: '.82rem', lineHeight: 1.25, textAlign: 'center' }}>{h.label}</span>
    </button>
  )
}

export function GateWalk({ shipped, isAdmin }: { shipped: number | null; isAdmin: boolean }) {
  const [id, setId] = useState('gate')
  const [line, setLine] = useState(0)
  const [me, setMe] = useState<Cultivator>(DEFAULT_CULTIVATOR)
  const [view, setView] = useState(0)
  const [dream, setDream] = useState<string | null>(null)
  const [note, setNote] = useState<Hotspot | null>(null)
  const [seen, setSeen] = useState<string[]>([])
  const [feeling, setFeeling] = useState<string | null>(null)
  const [stuckDone, setStuckDone] = useState(false)
  const [offer, setOffer] = useState(false)
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

  const go = (to: string) => { setId(to); setLine(0); setNote(null); setSeen([]) }
  const isMake = id === 'make'
  const sc = isMake ? null : sceneFor(id, { feeling, stuckDone, shipped })
  const placeOffers = id.startsWith('place-') ? PLACES.find((p) => `place-${p.id}` === id) : undefined
  const lastLine = !sc || line >= sc.lines.length - 1
  const small = id === 'dream' || id === 'end'
  const planted = DREAMS.find((d) => d.id === dream)

  const advance = () => {
    if (!sc) return
    if (!lastLine) { setLine(line + 1); return }
    if (sc.next && !sc.hotspots) go(sc.next)
  }
  const back = () => { if (sc && line > 0) setLine(line - 1) }
  const tapSpot = (h: Hotspot) => {
    if (h.locked) { setNote(h); return }
    if (h.feeling) setFeeling(h.feeling)
    if (h.to === 'room-intro') setStuckDone(true)
    if (h.to) return go(h.to)
    if (h.href) { window.open(h.href, '_blank', 'noopener,noreferrer'); setSeen((v) => [...v, h.id]); return }
    if (h.dream) { setDream(h.dream); return go('end') }
    setNote(h); setSeen((v) => (v.includes(h.id) ? v : [...v, h.id]))
  }
  const canContinue = !!sc?.next && !!sc?.hotspots && lastLine && (id === 'shape' ? seen.length > 0 : true) && id !== 'room-intro'
  const caption = sc ? (id === 'end' && planted ? `Your dream is planted: ${planted.name}. It stands beside your figure. ${feeling ? keepsakeLine(feeling, []) : ''} There are two ways forward.` : sc.lines[line]) : ''

  return (
    <main style={{ position: 'fixed', inset: 0, background: '#0f0b13', color: INK, fontFamily: 'var(--bars-font-body, system-ui, sans-serif)', display: 'grid', justifyItems: 'center' }}>
      <style>{CSS}</style>
      <div style={{ position: 'relative', width: '100%', maxWidth: 520, height: '100%', overflow: 'hidden', background: '#17121c' }}
        onClick={(e) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); if (e.clientX - r.left < r.width * 0.28) back(); else advance() }}>
        {sc && (
          <img key={sc.id} className="gw-img" src={sc.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: sc.pos ?? '50% 50%', animationName: `gw-${sc.motion}` }} />
        )}
        {isMake && <Nook me={me} setMe={setMe} turn={() => setView((v) => (v + 1) % 4)} done={() => go('feeling')} />}

        {/* the one live figure: large in the nook, small beside the planted dream */}
        <div style={{ position: 'absolute', zIndex: 2, pointerEvents: isMake ? 'auto' : 'none', opacity: isMake || small ? 1 : 0, transition: 'all .35s',
          ...(isMake ? { left: '22%', right: '22%', top: '24%', height: '40%' } : { left: 8, bottom: 168, width: 96, height: 160, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.25)' }) }}>
          <iframe ref={frame} title="Your cultivator. Tap the figure to turn it." src="/ally-gate/figure.html" onLoad={send} style={{ width: '100%', height: '100%', border: 0, display: 'block', background: 'transparent' }} />
        </div>

        {/* top bar: where you are, and the offering exit, reachable from every scene */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, padding: '14px 14px 28px', display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', background: 'linear-gradient(rgba(15,11,19,.78),rgba(15,11,19,0))' }}>
          <span style={{ color: GOLD, letterSpacing: '.12em', fontSize: '.68rem', textTransform: 'uppercase', maxWidth: '55%' }}>
            {isMake ? 'Direct action · play the game' : sc?.domain}
            {sc?.standIn ? <span style={{ display: 'block', color: MUTED, textTransform: 'none', letterSpacing: 0 }}>stand-in picture</span> : null}
          </span>
          <button type="button" style={chip} onClick={(e) => { e.stopPropagation(); setOffer(true) }}>Leave an offering</button>
        </div>

        {sc?.hotspots?.map((h) => (lastLine || id === 'gate') ? <Spot key={h.id} h={h} onTap={() => tapSpot(h)} lit={seen.includes(h.id)} /> : null)}

        {/* caption */}
        {sc && (
          <div key={`${sc.id}-${line}-${note?.id ?? ''}`} className="gw-fade" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4, padding: '56px 20px 22px', background: 'linear-gradient(rgba(15,11,19,0),rgba(15,11,19,.88) 40%)', display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontSize: '1.2rem', lineHeight: 1.42 }}>{note ? note.note : caption}</p>
            {note && <span style={{ color: GOLD, fontSize: '.78rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>{note.label}</span>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: MUTED, fontSize: '.78rem' }}>
                {!lastLine ? 'Tap to go on' : sc.hotspots ? 'Tap a glowing spot' : sc.next ? 'Tap to go on' : ''}
                {id.startsWith('story-') && sc.lines.length > 0 ? ` · ${line + 1}/${sc.lines.length}` : ''}
              </span>
              {id.startsWith('story-') && <button type="button" style={{ ...chip, borderColor: LINE, fontSize: '.8rem', padding: '6px 12px' }} onClick={(e) => { e.stopPropagation(); go('shape') }}>Skip the story</button>}
              {canContinue && <button type="button" style={{ ...chip, background: GOLD, color: '#1c1822', fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); go(sc.next as string) }}>{sc.nextLabel ?? 'Continue'}</button>}
              {id === 'end' && <a href={LINKS.coachingFree} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ ...chip, background: GOLD, color: '#1c1822', fontWeight: 700, textDecoration: 'none' }}>Start it together</a>}
            </div>
            {placeOffers?.offers.filter((o) => o.pay).map((o) => <div key={o.label} onClick={(e) => e.stopPropagation()} style={{ display: 'grid', gap: 6 }}><span style={{ color: GOLD, fontSize: '.8rem' }}>{o.label}{o.detail ? ` · ${o.detail}` : ''}</span><PayRow /></div>)}
            {placeOffers && <a href={placeOffers.window.href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ ...chip, textAlign: 'center', textDecoration: 'none', borderColor: LINE }}>A window: {placeOffers.window.label}</a>}
            {id === 'end' && note?.id === 'join' && <a href={LINKS.patreon} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ ...chip, textAlign: 'center', textDecoration: 'none' }}>Join on Patreon</a>}
          </div>
        )}

        {isMake && (
          <p style={{ position: 'absolute', zIndex: 4, left: 0, right: 0, bottom: 86, margin: 0, textAlign: 'center', color: MUTED, fontSize: '.78rem' }}>
            Tap the pegs, the bowl and the lanterns. Tap the figure to turn it.{ready === 'no' ? ' The figure did not load on this device; the walk works without it.' : ''}
          </p>
        )}
        <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, bottom: 4, display: 'flex', justifyContent: 'center', gap: 6 }} aria-hidden>
          {['story', 'shape', 'make', 'feeling', 'grounds', 'dream', 'end'].map((k) => <i key={k} style={{ width: 6, height: 6, borderRadius: 3, background: id.startsWith(k) ? GOLD : LINE }} />)}
        </div>

        {offer && (
          <div role="dialog" aria-label="Leave an offering" style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(15,11,19,.82)', display: 'grid', alignItems: 'end' }} onClick={(e) => { e.stopPropagation(); setOffer(false) }}>
            <div style={{ background: '#1c1822', borderTop: `1px solid ${GOLD}`, padding: '20px 18px 28px', display: 'grid', gap: 12, borderRadius: '18px 18px 0 0' }} onClick={(e) => e.stopPropagation()}>
              <b style={{ fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.25rem' }}>Short on time? Leave an offering at the gate.</b>
              <p style={{ margin: 0, color: MUTED, fontSize: '.9rem' }}>Tap a handle to copy it, then open the app and paste. The walk will be here whenever you want it.</p>
              <PayRow />
              <p style={{ margin: 0, color: MUTED, fontSize: '.86rem' }}>$11 prints and ships one backer’s copy of the book.{courierLine(shipped) ? ` ${courierLine(shipped)}.` : ''}</p>
              <button type="button" style={btn} onClick={() => setOffer(false)}>Back to the walk</button>
              {isAdmin && <AdminCount shipped={shipped} />}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

/** The nook: robes on pegs, skin stones in a bowl, two lanterns for the frame, the live figure between. PLACEHOLDER art, built in CSS. */
function Nook({ me, setMe, turn, done }: { me: Cultivator; setMe: (c: Cultivator) => void; turn: () => void; done: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(#2a1f35 0%, #3a2a3f 58%, #4a3526 58.2%, #33241a 100%)' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ position: 'absolute', top: 64, left: 0, right: 0, padding: '0 10px', display: 'flex', justifyContent: 'space-between' }}>
        {ROBES.map((r) => (
          <button key={r.id} type="button" aria-pressed={me.outfit === r.id} aria-label={`${r.name}, ${r.note}`} onClick={() => setMe({ ...me, outfit: r.id })}
            style={{ background: 'none', border: 0, padding: 0, display: 'grid', justifyItems: 'center', gap: 4, width: 58, cursor: 'pointer', color: INK, fontFamily: 'inherit' }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: '#6b4a2b', display: 'block' }} />
            <span style={{ width: 40, height: 66, borderRadius: '6px 6px 14px 14px', background: ROBE_COLOR[r.id], border: me.outfit === r.id ? `3px solid ${GOLD}` : '1px solid rgba(255,255,255,.25)', display: 'block', clipPath: 'polygon(18% 0,82% 0,100% 100%,0 100%)' }} />
            <span style={{ fontSize: '.62rem', color: me.outfit === r.id ? GOLD : MUTED, lineHeight: 1.15, textAlign: 'center' }}>{r.name}</span>
          </button>
        ))}
      </div>
      {FRAMES.map((f, i) => (
        <button key={f.id} type="button" aria-pressed={me.who === f.id} onClick={() => setMe({ ...me, who: f.id })}
          style={{ position: 'absolute', top: '40%', [i === 0 ? 'left' : 'right']: 10, background: 'none', border: 0, display: 'grid', justifyItems: 'center', gap: 6, cursor: 'pointer', color: INK, fontFamily: 'inherit', width: 70 }}>
          <span className={me.who === f.id ? '' : 'gw-ring'} style={{ width: 34, height: 46, borderRadius: '50% 50% 45% 45%', background: me.who === f.id ? GOLD : 'rgba(243,210,122,.45)', border: `2px solid ${GOLD}`, display: 'block' }} />
          <span style={{ fontSize: '.72rem', color: me.who === f.id ? GOLD : MUTED }}>{f.name}</span>
        </button>
      ))}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 128, borderRadius: '10px 10px 60px 60px / 10px 10px 40px 40px', background: 'linear-gradient(#5a3f2a,#3d2a1c)', padding: '14px 12px 18px', border: '1px solid rgba(255,255,255,.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {SKIN_RAMP.map((c, i) => (
          <button key={c} type="button" aria-label={`Skin stone ${i + 1} of 8`} aria-pressed={me.skin === i} onClick={() => setMe({ ...me, skin: i })}
            style={{ width: 34, height: 34, borderRadius: '50%', background: c, border: me.skin === i ? `3px solid ${GOLD}` : '1px solid rgba(0,0,0,.4)', boxShadow: me.skin === i ? `0 0 14px ${GOLD}` : 'none', padding: 0, cursor: 'pointer' }} />
        ))}
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 20, display: 'flex', gap: 8, zIndex: 6 }}>
        <button type="button" style={{ ...btn, flex: '0 0 auto' }} onClick={turn}>Turn</button>
        <button type="button" style={{ ...primary, flex: 1 }} onClick={done}>This is my cultivator</button>
      </div>
    </div>
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
