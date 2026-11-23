import type { CSSProperties } from 'react'

export const GOLD = '#f3d27a'
export const INK = '#f1ebf7'
export const MUTED = '#b9abc9'
export const CARD = 'rgba(255,255,255,0.06)'
export const LINE = 'rgba(255,255,255,0.18)'
/** Seed-packet paper: the packet's own face, so the six questions read as a card in the hand and not a form. */
export const PAPER = '#f3ead7'
export const PAPER_INK = '#2b2118'
export const PAPER_MUTED = '#6b5a45'

export const btn: CSSProperties = {
  minHeight: 48, borderRadius: 14, border: `1px solid ${LINE}`, background: CARD, color: INK, padding: '10px 14px',
  fontSize: '1rem', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
}
export const primary: CSSProperties = { ...btn, background: GOLD, color: '#1c1822', border: `1px solid ${GOLD}`, fontWeight: 700, textAlign: 'center' }
export const chip: CSSProperties = { background: 'rgba(23,18,28,.78)', color: INK, border: `1px solid ${GOLD}`, borderRadius: 999, padding: '8px 14px', fontSize: '.92rem', fontFamily: 'inherit', cursor: 'pointer', backdropFilter: 'blur(4px)' }
