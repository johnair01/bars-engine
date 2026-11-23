'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Channel } from '@/lib/coaching/unpacking-walk'
import { CHANNELS } from '@/lib/between/crops'
import { STUCK_OBJECTS } from '@/lib/founder-gate/content'
import { GOLD } from './ui'

/** The bed: the live crop in an iframe (public/ally-gate/crop.html) and the five objects that stand in its scene. */
export function BedStage({ family, grow, ripe, lit, glow, tended, onObject, children, label }: {
  family: Channel | null; grow: number; ripe: boolean
  /** the channels whose objects are shown; the rest are hidden (a move scene shows only the one being tended) */
  lit: Channel[]
  /** the object that glows: the first weather pick */
  glow: Channel | null
  tended?: Channel[]
  onObject?: (c: Channel) => void
  children?: ReactNode
  label?: string
}) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [ready, setReady] = useState(false)
  const send = useCallback(() => { frame.current?.contentWindow?.postMessage({ type: 'ally-gate-crop', family, grow, ripe }, window.location.origin) }, [family, grow, ripe])
  useEffect(() => {
    const on = (e: MessageEvent) => { if (e.origin === window.location.origin && e.data?.type === 'ally-gate-crop-ready') { setReady(true); send() } }
    window.addEventListener('message', on)
    return () => window.removeEventListener('message', on)
  }, [send])
  useEffect(() => { send() }, [send, ready])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'linear-gradient(rgba(15,11,19,.35),rgba(15,11,19,.7)), url(/ally-gate/scenes/farm-1.jpg) 50% 50%/cover' }} onClick={(e) => e.stopPropagation()}>
      <iframe ref={frame} title={label ?? 'Your bed'} src="/ally-gate/crop.html" onLoad={send} style={{ position: 'absolute', left: '14%', right: '14%', top: '20%', height: '38%', border: 0, background: 'transparent' }} />
      {CHANNELS.filter((c) => lit.includes(c)).map((c) => (
        <ObjectSpot key={c} c={c} glowing={glow === c} tended={!!tended?.includes(c)} onTap={onObject ? () => onObject(c) : undefined} />
      ))}
      {children}
    </div>
  )
}

const POS: Record<Channel, { left: string; top: string }> = {
  anger: { left: '6%', top: '47%' },
  fear: { left: '62%', top: '16%' },
  sadness: { left: '8%', top: '58%' },
  joy: { left: '72%', top: '46%' },
  neutrality: { left: '34%', top: '55%' },
}

function ObjectSpot({ c, glowing, tended, onTap }: { c: Channel; glowing: boolean; tended: boolean; onTap?: () => void }) {
  const o = STUCK_OBJECTS[c]
  return (
    <button type="button" onClick={onTap} disabled={!onTap} aria-label={`${o.name}. ${tended ? 'Tended.' : o.verb}`}
      style={{ position: 'absolute', ...POS[c], width: 84, background: 'none', border: 0, padding: 0, cursor: onTap ? 'pointer' : 'default', display: 'grid', justifyItems: 'center', gap: 4, color: '#fff', fontFamily: 'inherit', opacity: tended ? 0.55 : 1, zIndex: 4 }}>
      <span className={glowing && !tended ? 'gw-ring' : ''} style={{ borderRadius: 14, padding: 4, background: glowing && !tended ? 'rgba(243,210,122,.22)' : 'transparent', border: glowing && !tended ? `2px solid ${GOLD}` : '2px solid transparent' }}>
        <ObjectArt c={c} tended={tended} />
      </span>
      <span style={{ fontSize: '.7rem', lineHeight: 1.2, textAlign: 'center', background: 'rgba(23,18,28,.78)', borderRadius: 8, padding: '3px 6px' }}>{o.name}</span>
    </button>
  )
}

/** Flat drawings of the five objects, simple on purpose: the tending is the move. */
function ObjectArt({ c, tended }: { c: Channel; tended: boolean }) {
  const s = { width: 68, height: 52, display: 'block' } as const
  if (c === 'anger') return (
    <svg viewBox="0 0 68 52" style={s} aria-hidden>
      {tended ? (<><rect x="14" y="4" width="7" height="44" rx="2" fill="#8a5a33" /><rect x="47" y="4" width="7" height="44" rx="2" fill="#8a5a33" /><rect x="10" y="14" width="48" height="7" rx="2" fill="#a8703f" /><rect x="10" y="30" width="48" height="7" rx="2" fill="#a8703f" /></>)
        : (<><rect x="14" y="10" width="7" height="38" rx="2" fill="#8a5a33" /><rect x="6" y="38" width="56" height="8" rx="2" fill="#a8703f" transform="rotate(-9 34 42)" /><rect x="36" y="30" width="26" height="7" rx="2" fill="#7a4d2b" transform="rotate(14 49 33)" /></>)}
    </svg>)
  if (c === 'fear') return (
    <svg viewBox="0 0 68 52" style={s} aria-hidden>
      <ellipse cx="34" cy="30" rx="32" ry="16" fill="rgba(10,10,20,.55)" />
      <path d="M12 28 Q24 12 34 26 Q44 12 56 28 Q44 24 34 34 Q24 24 12 28Z" fill="#14121c" />
      <circle cx="34" cy="24" r="4" fill="#14121c" /><path d="M36 24 l8 3 -8 1z" fill="#c9a24a" />
    </svg>)
  if (c === 'sadness') return (
    <svg viewBox="0 0 68 52" style={s} aria-hidden>
      <path d="M16 20 h30 l-3 26 h-24z" fill={tended ? '#6f8fb8' : '#8b8f99'} />
      <path d="M46 26 q14 0 12 -10" stroke={tended ? '#6f8fb8' : '#8b8f99'} strokeWidth="5" fill="none" />
      <path d="M16 20 l-9 -6" stroke={tended ? '#6f8fb8' : '#8b8f99'} strokeWidth="5" />
      {tended ? <path d="M12 6 q-3 6 0 10 q3 -4 0 -10z" fill="#9ec8ff" /> : <path d="M24 22 l5 10 -4 6 5 8" stroke="#2b2430" strokeWidth="2" fill="none" />}
    </svg>)
  if (c === 'joy') return (
    <svg viewBox="0 0 68 52" style={s} aria-hidden>
      <rect x="4" y="30" width="60" height="18" rx="3" fill="#5e3a22" />
      <rect x="34" y="2" width="30" height="28" rx="3" fill="#7fb04e" /><circle cx="49" cy="10" r="5" fill="#f2c544" /><circle cx="42" cy="20" r="4" fill="#f2c544" /><circle cx="56" cy="21" r="4" fill="#f2c544" />
    </svg>)
  return (
    <svg viewBox="0 0 68 52" style={s} aria-hidden>
      <rect x="2" y="12" width="64" height="30" rx="14" fill={tended ? '#d8e2dc' : '#c9d3da'} opacity={tended ? 0.5 : 0.9} />
      <path d="M12 26 l6 -6 6 6 6 -6 6 6 6 -6 6 6 6 -6" stroke="#fff" strokeWidth="2" fill="none" />
    </svg>)
}
