'use client'

import { useState } from 'react'
import type { Channel } from '@/lib/coaching/unpacking-walk'
import { CHANNELS, CROP_FAMILY, bedLabel } from '@/lib/between/crops'
import { FRUIT_TO, OWN_SEED, STUCK_OBJECTS, moveAction, type FruitTo } from '@/lib/founder-gate/content'
import { cropOf, pathFor, seedOf, stuckStart, type Packet } from '@/lib/founder-gate/seed-packet'
import { BedStage } from './Bed'
import { GOLD, INK, LINE, MUTED, btn, primary } from './ui'

const panel: React.CSSProperties = { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, padding: '48px 18px 20px', background: 'linear-gradient(rgba(15,11,19,0),rgba(15,11,19,.92) 34%)', display: 'grid', gap: 10 }
const say: React.CSSProperties = { margin: 0, fontFamily: 'Marcellus, Georgia, serif', fontSize: '1.15rem', lineHeight: 1.4, color: INK }
const small: React.CSSProperties = { color: GOLD, fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.1em' }

/** One still beat: a hand in soil, and only the crop's name. */
export function Planting({ packet, onDone }: { packet: Packet; onDone: () => void }) {
  const crop = cropOf(packet)
  return (
    <BedStage family={null} grow={0} ripe={false} lit={[]} glow={null} label="A hand presses a seed into the soil">
      <svg viewBox="0 0 120 80" aria-hidden style={{ position: 'absolute', left: '50%', top: '56%', width: 170, transform: 'translateX(-50%)', zIndex: 5 }}>
        <path d="M10 56 q24 -30 54 -22 q26 4 40 22 q-26 10 -54 6 q-24 -4 -40 -6z" fill="#d9b08a" stroke="#9a6f4a" strokeWidth="2" />
        <path d="M60 40 l8 -14 M70 42 l12 -10 M52 42 l2 -16" stroke="#9a6f4a" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <div style={panel}>
        <p style={{ ...say, textAlign: 'center', fontSize: '1.4rem' }}>{crop ? CROP_FAMILY[crop.family].name : 'A seed'}</p>
        <button type="button" style={primary} onClick={onDone}>Tend the bed</button>
      </div>
    </BedStage>
  )
}

/** The bed with its five objects. The first weather pick glows; tapping one starts the stuck path from its feeling. */
export function Bed({ packet, onObject, onRest, onStill }: { packet: Packet; onObject: (c: Channel) => void; onRest: () => void; onStill: () => void }) {
  const crop = cropOf(packet)
  const glow = stuckStart(packet)
  return (
    <BedStage family={crop?.family ?? null} grow={0.15} ripe={false} lit={[...CHANNELS]} glow={glow} onObject={onObject} label={crop ? bedLabel(crop) : 'Your bed'}>
      <div style={panel}>
        <span style={small}>{crop ? `${bedLabel(crop)} · ${CROP_FAMILY[crop.family].name}` : 'Your bed'}</span>
        <p style={say}>Five things trouble this bed. Tap the one most like what stops you from doing this.</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={{ ...btn, flex: 1, textAlign: 'center' }} onClick={onRest}>Let the weather be</button>
          <button type="button" style={{ ...btn, flex: 1, textAlign: 'center' }} onClick={onStill}>I am still stuck on this</button>
        </div>
      </div>
    </BedStage>
  )
}

/** One move: tend the object, the plant grows a stage, and the card ends with the next step of the help they chose. */
export function Move({ packet, from, i, onNext, onStill }: { packet: Packet; from: Channel; i: number; onNext: (nextIndex: number | 'harvest') => void; onStill: () => void }) {
  const [tended, setTended] = useState(false)
  const path = pathFor(from, packet)
  const mv = path[i]
  const crop = cropOf(packet)
  const seed = seedOf(packet)
  const step = seed?.nextStep ?? OWN_SEED.nextStep
  if (!mv) return null
  const o = STUCK_OBJECTS[mv.from]
  const last = i >= path.length - 1
  const done = i + (tended ? 1 : 0)
  return (
    <BedStage family={crop?.family ?? null} grow={Math.min(1, done / path.length)} ripe={last && tended} lit={[mv.from as Channel]} glow={tended ? null : (mv.from as Channel)} tended={tended ? [mv.from as Channel] : []}
      onObject={tended ? undefined : () => setTended(true)} label={`${o.name}, step ${i + 1} of ${path.length}`}>
      <div style={panel}>
        <span style={small}>Step {i + 1} of {path.length}</span>
        {!tended ? (
          <>
            <p style={say}>{o.look}</p>
            <button type="button" style={primary} onClick={() => setTended(true)}>{o.verb}</button>
          </>
        ) : (
          <>
            <p style={say}>{o.tended}</p>
            <p style={{ ...say, fontSize: '1rem', color: MUTED }}>{mv.name}. {moveAction(mv)}</p>
            <p style={{ ...say, fontSize: '1rem', color: GOLD }}>{step}</p>
            <button type="button" style={primary} onClick={() => onNext(last ? 'harvest' : i + 1)}>{last ? 'See the harvest' : 'Next step'}</button>
          </>
        )}
        {!tended && <button type="button" style={{ ...btn, textAlign: 'center' }} onClick={onStill}>I am still stuck on this</button>}
      </div>
    </BedStage>
  )
}

/** The ripe crop: the real act behind the seed, a choice of who gets the fruit, and the act itself is theirs to tap. */
export function Harvest({ packet, onOffering, onGrounds, onQuietRoom }: { packet: Packet; onOffering: () => void; onGrounds: () => void; onQuietRoom: () => void }) {
  const crop = cropOf(packet)
  const seed = seedOf(packet)
  const [to, setTo] = useState<FruitTo | null>(null)
  const [copied, setCopied] = useState(false)
  const act = seed?.act ?? 'own'
  const tapAct = async () => {
    if (act === 'offering') return onOffering()
    if (act === 'share' && !seed?.href) {
      try { await navigator.clipboard.writeText(`${window.location.origin}/ally/gate`) } catch { /* the link is the page you are on */ }
      setCopied(true); return
    }
    if (act === 'own') return onQuietRoom()
    if (seed?.href) window.open(seed.href, '_blank', 'noopener,noreferrer')
  }
  const family = crop ? CROP_FAMILY[crop.family] : null
  return (
    <BedStage family={crop?.family ?? null} grow={1} ripe lit={[]} glow={null} label="The ripe crop">
      <div style={panel}>
        <span style={small}>{family ? `${family.name} · ripe` : 'Ripe'}</span>
        {seed && <p style={say}>{seed.front}</p>}
        {!seed && <p style={say}>Your own seed ripens. Pick the first thing you will do about it this week.</p>}
        <p style={{ ...say, fontSize: '1rem', color: MUTED }}>Who gets the fruit?</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {FRUIT_TO.map((f) => (
            <button key={f.id} type="button" aria-pressed={to === f.id} style={{ ...btn, flex: 1, textAlign: 'center', borderColor: to === f.id ? GOLD : LINE, padding: '10px 6px' }} onClick={() => setTo(f.id)}>{f.label}</button>
          ))}
        </div>
        {to && <p style={{ ...say, fontSize: '1rem', color: GOLD }}>{FRUIT_TO.find((f) => f.id === to)!.line}</p>}
        {to && to !== 'keep' && (
          <button type="button" style={primary} onClick={tapAct}>{act === 'own' ? OWN_SEED.actLabel : seed!.actLabel}</button>
        )}
        {copied && <span style={{ color: GOLD, fontSize: '.85rem' }} aria-live="polite">Copied. Paste it to one person yourself.</span>}
        <button type="button" style={{ ...btn, textAlign: 'center' }} onClick={onGrounds}>On to the grounds</button>
      </div>
    </BedStage>
  )
}
