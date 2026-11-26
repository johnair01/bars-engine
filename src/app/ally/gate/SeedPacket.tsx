'use client'

import { useEffect, useRef, useState } from 'react'
import { BELIEFS, DISSATISFACTIONS } from '@/lib/coaching/unpacking-walk'
import { CHANNELS, CROP_FAMILY } from '@/lib/between/crops'
import { OWN_SEED, SEEDS, SOIL, WEATHER_HELPER } from '@/lib/founder-gate/content'
import { EMPTY_PACKET, firstBelief, packetLabels, waterOptions, type Packet, type PacketKey } from '@/lib/founder-gate/seed-packet'
import { GOLD, INK, LINE, MUTED, btn, primary } from './ui'

const KEYS: PacketKey[] = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']
/** One scene frame per side: a real farm still shows above, the question and its choices sit in a bottom sheet. */
const FRAME_IMG: Record<PacketKey, { img: string; pos: string }> = {
  q1: { img: 'farm-1', pos: '50% 50%' }, q2: { img: 'farm-2', pos: '30% 50%' }, q3: { img: 'farm-3', pos: '50% 50%' },
  q4: { img: 'farm-4', pos: '30% 50%' }, q5: { img: 'farm-2', pos: '75% 50%' }, q6: { img: 'farm-3', pos: '20% 50%' },
}
/** What the player just did, shown over the bare frame while the card is down. */
const BEAT: Record<PacketKey, string> = {
  q1: 'The seed goes into your hand.', q2: 'The crop takes its place in the bed.', q3: 'The soil settles around it.',
  q4: 'The weather rolls in over the field.', q5: 'Water falls on the bed.', q6: 'The stone settles at the bed’s edge.',
}
const BEAT_MS = 1500
const ENTER_MS = 900
const CSS = `
@keyframes sp-push{from{transform:scale(1)}to{transform:scale(1.12)}}
@keyframes sp-in{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:scale(1)}}
@keyframes sp-cap{0%{opacity:0;transform:translateY(8px)}25%,80%{opacity:1;transform:none}100%{opacity:0}}
.sp-push{animation:sp-push ${BEAT_MS}ms ease-out forwards}
.sp-in{animation:sp-in ${ENTER_MS}ms ease-out both}
.sp-cap{animation:sp-cap ${BEAT_MS}ms ease both}
.sp-sheet{transition:transform .5s ease,opacity .4s ease}
.sp-sheet[data-hide="1"]{transform:translateY(100%);opacity:0;pointer-events:none}
@media (prefers-reduced-motion: reduce){.sp-push,.sp-in,.sp-cap{animation:none!important}.sp-sheet{transition:none}}
`
const PENCIL = 'Georgia, "Times New Roman", serif'

const paperBtn = (on: boolean): React.CSSProperties => ({
  background: on ? 'rgba(243,210,122,.2)' : 'rgba(23,18,28,.72)', color: INK, border: on ? `2px solid ${GOLD}` : `1px solid ${LINE}`, borderRadius: 14, padding: '10px 14px',
  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', minHeight: 56, boxShadow: on ? `0 0 0 3px rgba(243,210,122,.35)` : 'none',
})

function answerText(p: Packet, k: PacketKey): string {
  switch (k) {
    case 'q1': return p.seed === 'own' ? p.own.trim() : SEEDS.find((s) => s.domain === p.seed)?.front ?? ''
    case 'q2': return p.family ? CROP_FAMILY[p.family].name : ''
    case 'q3': return SOIL.find((s) => s.id === p.soil)?.season ?? ''
    case 'q4': return p.weather.join(', ')
    case 'q5': return p.water.trim()
    case 'q6': return p.stone ? `${p.stone.belief}${p.stone.set ? ', set at the edge' : ', left'}` : ''
  }
}

/** The six unpacking questions as a seed packet the player turns over, one side each. Answers sit in pencil under the card; tap one to rewrite it. */
export function SeedPacket({ done }: { done: (p: Packet) => void }) {
  const [p, setP] = useState<Packet>(EMPTY_PACKET)
  const [at, setAt] = useState(0)
  const [flip, setFlip] = useState(false)
  const [others, setOthers] = useState(false)
  const labels = packetLabels()
  const key = KEYS[at]
  const set = (patch: Partial<Packet>) => setP((v) => ({ ...v, ...patch }))
  /** 'card' = question showing; 'beat' = card down, the action plays; 'enter' = next frame arrives bare before the card rises. */
  const [phase, setPhase] = useState<'card' | 'beat' | 'enter'>('card')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const go = (i: number, enter = false) => {
    clearTimeout(timer.current); setAt(i); setFlip(false); setOthers(false)
    if (enter && !still) { setPhase('enter'); timer.current = setTimeout(() => setPhase('card'), ENTER_MS) } else setPhase('card')
  }
  /** After an answer: the card drops away, the picture plays the action, then the next frame arrives before its card. */
  const advance = (final?: Packet) => {
    if (still) { if (final || at >= KEYS.length - 1) done(final ?? p); else go(at + 1); return }
    setPhase('beat')
    timer.current = setTimeout(() => { if (final || at >= KEYS.length - 1) done(final ?? p); else go(at + 1, true) }, BEAT_MS)
  }
  const next = () => advance()
  const skip = () => { if (at >= KEYS.length - 1) done(p); else go(at + 1, true) }
  const picked = answerText(p, key) !== ''
  const belief = p.stone?.belief ?? firstBelief(p)

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: '#17121c' }} onClick={(e) => e.stopPropagation()}>
      <style>{CSS}</style>
      <img key={`${key}-${phase === 'enter' ? 'e' : ''}`} className={phase === 'beat' ? 'sp-push' : phase === 'enter' ? 'sp-in' : undefined} src={`/ally-gate/scenes/${FRAME_IMG[key].img}.jpg`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: FRAME_IMG[key].pos }} />
      {phase === 'beat' && (
        <div className="sp-cap" role="status" style={{ position: 'absolute', left: 16, right: 16, bottom: 28, textAlign: 'center', color: INK, fontFamily: 'Marcellus, Georgia, serif', fontSize: '1.3rem', textShadow: '0 2px 12px #000' }}>{BEAT[key]}</div>
      )}
      <div className="sp-sheet" data-hide={phase === 'card' ? undefined : '1'} aria-hidden={phase !== 'card'} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '52%', overflowY: 'auto', padding: '40px 16px 20px', display: 'grid', gap: 12, background: 'linear-gradient(rgba(15,11,19,0),rgba(15,11,19,.9) 28px)' }}>
        <div style={{ color: GOLD, fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase' }}>Your seed · scene {at + 1} of 6</div>
        <section style={{ color: INK, display: 'grid', gap: 12 }} aria-label={labels[key]}>
          <h2 style={{ margin: 0, position: 'sticky', top: 0, zIndex: 1, padding: '6px 0', background: '#0f0b13', fontFamily: 'Marcellus, Georgia, serif', fontWeight: 400, fontSize: '1.25rem', lineHeight: 1.3 }}>{labels[key]}</h2>
          {key === 'q4' && <p style={{ margin: 0, color: MUTED, fontSize: '.92rem' }}>{WEATHER_HELPER}</p>}

          {key === 'q1' && !p.seed && (
            <div style={{ display: 'grid', gridAutoRows: '1fr', gap: 8 }}>
              {SEEDS.map((s) => (
                <button key={s.domain} type="button" style={{ ...paperBtn(false), minHeight: 78, display: 'grid', alignContent: 'center', gap: 2 }} onClick={() => { set({ seed: s.domain }); setFlip(false) }}>
                  <b style={{ fontSize: '.78rem', letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>{s.title}</b>
                  <span>{s.front}</span>
                </button>
              ))}
              <button type="button" style={{ ...paperBtn(false), minHeight: 78, display: 'grid', alignContent: 'center', gap: 2 }} onClick={() => set({ seed: 'own' })}>
                <b style={{ fontSize: '.78rem', letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>{OWN_SEED.title}</b>
                <span>{OWN_SEED.front}</span>
              </button>
            </div>
          )}
          {key === 'q1' && p.seed && p.seed !== 'own' && (() => {
            const s = SEEDS.find((x) => x.domain === p.seed)!
            return (
              <div style={{ display: 'grid', gap: 10 }}>
                <button type="button" aria-label={flip ? 'Turn the packet back' : 'Turn the packet over'} onClick={() => setFlip(!flip)} style={{ ...paperBtn(true), minHeight: 110, display: 'grid', alignContent: 'center', gap: 4, transition: 'transform .4s', transform: flip ? 'rotateY(180deg)' : 'none' }}>
                  <span style={{ transform: flip ? 'rotateY(180deg)' : 'none', display: 'grid', gap: 4 }}>
                    <b style={{ fontSize: '.78rem', letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>{flip ? 'In the garden' : s.title}</b>
                    <span style={{ fontSize: '1.05rem' }}>{flip ? s.back : s.front}</span>
                    <span style={{ color: MUTED, fontSize: '.8rem' }}>{flip ? 'Tap to turn back' : 'Tap to turn it over'}</span>
                  </span>
                </button>
                <button type="button" style={{ ...btn, background: 'transparent', color: MUTED, borderColor: LINE, minHeight: 40 }} onClick={() => { set({ seed: null }); setFlip(false) }}>Choose another seed</button>
              </div>
            )
          })()}
          {key === 'q1' && p.seed === 'own' && (
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ color: MUTED, fontSize: '.85rem' }}>In pencil, in your own words</span>
              <textarea value={p.own} onChange={(e) => set({ own: e.target.value.slice(0, 200) })} rows={3} style={{ fontFamily: PENCIL, fontStyle: 'italic', fontSize: '1.05rem', color: '#4a4a52', background: '#fbf5e6', border: '1px dashed #a88f6a', borderRadius: 10, padding: 10 }} />
              <button type="button" style={{ ...btn, background: 'transparent', color: MUTED, borderColor: LINE, minHeight: 40 }} onClick={() => set({ seed: null, own: '' })}>Choose a packet instead</button>
            </label>
          )}

          {key === 'q2' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {CHANNELS.map((c) => {
                const f = CROP_FAMILY[c]
                return (
                  <button key={c} type="button" aria-pressed={p.family === c} style={{ ...paperBtn(p.family === c), display: 'grid', gridTemplateColumns: '64px 1fr', gap: 10, alignItems: 'center' }} onClick={() => set({ family: c })}>
                    <img src={`/ally-gate/crops/${c}.png`} alt="" width={64} height={64} style={{ borderRadius: 10, background: '#dfe9c9', objectFit: 'cover' }} />
                    <span style={{ display: 'grid', gap: 2 }}>
                      <b>{f.name}</b>
                      <span style={{ fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>{f.state}</span>
                      <span style={{ fontSize: '.9rem', lineHeight: 1.3 }}>{f.means}</span>
                      <span style={{ fontSize: '.85rem', color: MUTED, lineHeight: 1.3 }}>{f.grows}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {key === 'q3' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {SOIL.map((s) => (
                <button key={s.id} type="button" aria-pressed={p.soil === s.id} style={{ ...paperBtn(p.soil === s.id), display: 'grid', gap: 2 }} onClick={() => set({ soil: s.id })}>
                  <b>{s.season} <span style={{ color: MUTED, fontWeight: 400, fontSize: '.85rem' }}>· {s.id}</span></b>
                  <span style={{ color: MUTED, fontSize: '.9rem' }}>{s.line}</span>
                </button>
              ))}
            </div>
          )}

          {key === 'q4' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DISSATISFACTIONS.map((d) => {
                const i = p.weather.indexOf(d.state)
                return (
                  <button key={d.state} type="button" aria-pressed={i >= 0} style={{ ...paperBtn(i >= 0), minHeight: 44, padding: '8px 14px' }}
                    onClick={() => set({ weather: i >= 0 ? p.weather.filter((w) => w !== d.state) : [...p.weather, d.state] })}>
                    {d.state}{i === 0 ? ' ·  first' : ''}
                  </button>
                )
              })}
            </div>
          )}

          {key === 'q5' && (
            <div style={{ display: 'grid', gap: 8 }}>
              {waterOptions(p).map((w) => (
                <button key={w} type="button" aria-pressed={p.water === w} style={{ ...paperBtn(p.water === w), fontFamily: PENCIL, fontStyle: 'italic', color: '#4a4a52' }} onClick={() => set({ water: w })}>{w}</button>
              ))}
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: MUTED, fontSize: '.85rem' }}>Or in pencil, your own</span>
                <textarea value={p.water} onChange={(e) => set({ water: e.target.value.slice(0, 240) })} rows={2} style={{ fontFamily: PENCIL, fontStyle: 'italic', fontSize: '1.05rem', color: '#4a4a52', background: '#fbf5e6', border: '1px dashed #a88f6a', borderRadius: 10, padding: 10 }} />
              </label>
            </div>
          )}

          {key === 'q6' && (
            <div style={{ display: 'grid', gap: 10 }}>
              {!others ? (
                <>
                  <button type="button" aria-label={flip ? 'Turn the stone back' : 'Turn the stone over'} onClick={() => setFlip(!flip)} style={{ ...paperBtn(true), minHeight: 96, display: 'grid', alignContent: 'center', gap: 4 }}>
                    <b style={{ fontSize: '1.05rem' }}>{belief}</b>
                    {flip ? <span style={{ fontFamily: PENCIL, fontStyle: 'italic', color: '#4a4a52' }}>{BELIEFS.find((b) => b.belief === belief)?.sounds}</span> : <span style={{ color: MUTED, fontSize: '.8rem' }}>A stone in the bed. Tap to turn it over.</span>}
                  </button>
                  {flip && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" style={{ ...primary, flex: 1 }} onClick={() => advance({ ...p, stone: { belief, set: true } })}>Set it at the bed’s edge</button>
                      <button type="button" style={{ ...btn, flex: 1, textAlign: 'center', background: 'transparent', color: INK, borderColor: '#a88f6a' }} onClick={() => advance({ ...p, stone: { belief, set: false } })}>Leave it</button>
                    </div>
                  )}
                  <button type="button" style={{ ...btn, background: 'transparent', color: MUTED, borderColor: LINE, minHeight: 40 }} onClick={() => setOthers(true)}>Show the others</button>
                </>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {BELIEFS.map((b) => (
                    <button key={b.belief} type="button" style={paperBtn(belief === b.belief)} onClick={() => { set({ stone: { belief: b.belief, set: false } }); setOthers(false); setFlip(true) }}>{b.belief}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={{ ...btn, flex: '0 0 auto', textAlign: 'center' }} onClick={skip}>Skip this one</button>
          {at > 0 && <button type="button" style={{ ...btn, flex: '0 0 auto', textAlign: 'center' }} onClick={() => go(at - 1)}>Back</button>}
          {key !== 'q6' && <button type="button" style={{ ...primary, flex: 1, opacity: picked ? 1 : 0.55 }} disabled={!picked} onClick={next}>{key === 'q1' && p.seed && p.seed !== 'own' && !flip ? 'Plant this seed' : 'On to the next side'}</button>}
          {key === 'q6' && <button type="button" style={{ ...primary, flex: 1 }} onClick={() => advance()}>Plant it</button>}
        </div>

        {KEYS.some((k, i) => i !== at && answerText(p, k)) && (
          <div style={{ display: 'grid', gap: 4 }} aria-label="Your answers, in pencil">
            <span style={{ color: MUTED, fontSize: '.72rem', letterSpacing: '.1em', textTransform: 'uppercase' }}>In pencil. Tap one to rewrite it.</span>
            {KEYS.map((k, i) => (answerText(p, k) && i !== at ? (
              <button key={k} type="button" onClick={() => go(i)} style={{ background: 'none', border: 0, borderBottom: `1px dashed ${LINE}`, color: INK, textAlign: 'left', padding: '6px 2px', cursor: 'pointer', fontFamily: PENCIL, fontStyle: 'italic', fontSize: '.95rem' }}>
                <span style={{ color: GOLD, fontStyle: 'normal', fontFamily: 'inherit', fontSize: '.72rem', marginRight: 8 }}>{i + 1}</span>{answerText(p, k)}
              </button>
            ) : null))}
          </div>
        )}
      </div>
    </div>
  )
}
