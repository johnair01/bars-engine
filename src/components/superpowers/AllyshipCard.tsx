'use client'

/**
 * AllyshipCard — the reusable poker-format (5:7) card (Mobility Quest design
 * handoff). The canonical visual for every card in the project: a base Allyship
 * card + an optional gold superpower "modifier foil". Collapses to a strip,
 * expands to a full card. Faithful port of the design handoff
 * (design_handoff_milestone_needs/AllyshipCard.dc.html) — self-contained styling
 * + computed element CSS vars; a sibling of CultivationCard.
 *
 * Element color = the base card's identity; the gold foil = the superpower overlay.
 */
import { useState, type CSSProperties } from 'react'

// ─── Card grammar types ──────────────────────────────────────────────────────
export type CardElement = 'fire' | 'water' | 'wood' | 'metal' | 'earth' | 'liminal'
export type MoveKey = 'wake' | 'clean' | 'grow' | 'show' | 'open'
export type FaceKey = 'shaman' | 'challenger' | 'regent' | 'architect' | 'diplomat' | 'sage'
export type DomainKey = 'gather' | 'aware' | 'direct' | 'organize'
export type CardStatus = 'open' | 'mine' | 'taken' | 'done' | 'signedout'

export interface AllyshipCardData {
  id: string
  num?: string
  title: string
  move: MoveKey
  moveLabel: string
  face: FaceKey
  faceLabel: string
  el: CardElement
  domain: DomainKey
  domainLabel: string
  /** Reflection question (base card's contemplative prompt). */
  q: string
  yield: number
}

export interface AllyshipCardMod {
  spKey: string
  spLabel: string
  /** The actionable contribution (imperative). */
  contribution: string
  /** What to make / produce. */
  artifact: string
  /** Short ask, e.g. "1 intro", "$50", "2 hrs". */
  ask: string
  /** Inner (self-allyship) modifier vs world-facing. */
  internal?: boolean
}

export interface AllyshipCardProps {
  card: AllyshipCardData
  mod: AllyshipCardMod
  status?: CardStatus
  pending?: boolean
  collapsible?: boolean
  defaultExpanded?: boolean
  onClaim?: (id: string) => void
  onComplete?: (id: string) => void
  onRelease?: (id: string) => void
}

// ─── Element palettes (gradFrom/gradTo/glow/gem/frame) ───────────────────────
const EL: Record<CardElement, { gf: string; gt: string; glow: string; gem: string; frame: string }> = {
  fire: { gf: '#431407', gt: '#1c0700', glow: '#e8671a', gem: '#e74c3c', frame: '#c1392b' },
  water: { gf: '#0c1e3e', gt: '#020c1f', glow: '#1a7a8a', gem: '#3a93c8', frame: '#1a3a5c' },
  wood: { gf: '#052e16', gt: '#011309', glow: '#27ae60', gem: '#2ecc71', frame: '#4a7c59' },
  earth: { gf: '#451a03', gt: '#1a0a00', glow: '#d4a017', gem: '#e0a93b', frame: '#b5651d' },
  metal: { gf: '#1e2530', gt: '#0d1017', glow: '#bdc3c7', gem: '#bdc3c7', frame: '#8e9aab' },
  liminal: { gf: '#2a2150', gt: '#140e2a', glow: '#7c3aed', gem: '#a855f7', frame: '#6d52c9' },
}

type GlyphDef = { d?: string; t?: 'circle'; cx?: number; cy?: number; r?: number; f?: boolean }

const MOVE: Record<MoveKey, GlyphDef[]> = {
  wake: [{ d: 'M12 46 L52 46' }, { d: 'M22 46 A10 10 0 0 1 42 46' }, { d: 'M32 21 L32 13' }, { d: 'M46 26 L51 21' }, { d: 'M18 26 L13 21' }],
  clean: [{ d: 'M30 14 L34 26 L46 30 L34 34 L30 46 L26 34 L14 30 L26 26 Z' }, { d: 'M47 16 L49 21 L54 23 L49 25 L47 30 L45 25 L40 23 L45 21 Z' }],
  grow: [{ d: 'M32 52 L32 28' }, { d: 'M32 34 C22 34 18 26 18 17 C28 17 32 25 32 34 Z' }, { d: 'M32 30 C42 30 46 23 46 15 C36 15 32 22 32 30 Z' }, { d: 'M21 54 L43 54' }],
  show: [{ d: 'M16 54 L16 24 Q32 9 48 24 L48 54' }, { t: 'circle', cx: 32, cy: 29, r: 5 }, { d: 'M24 54 L25.5 40 Q32 34 38.5 40 L40 54' }],
  open: [{ d: 'M27 16 Q15 32 27 48' }, { d: 'M37 16 Q49 32 37 48' }, { t: 'circle', cx: 32, cy: 36, r: 3.2 }, { d: 'M32 28 L32 22' }, { d: 'M25.5 31 L21 27' }, { d: 'M38.5 31 L43 27' }],
}

const FACE: Record<FaceKey, GlyphDef[]> = {
  shaman: [{ d: 'M15 33 Q32 53 49 33' }, { d: 'M32 44 L32 53' }, { d: 'M23 57 L41 57' }, { t: 'circle', cx: 32, cy: 19, r: 4.2 }, { d: 'M32 8 L32 12.5' }, { d: 'M21.5 13 L24.5 16' }, { d: 'M42.5 13 L39.5 16' }],
  challenger: [{ d: 'M32 9 L50 16 L50 32 Q50 48 32 56 Q14 48 14 32 L14 16 Z' }, { d: 'M32 19 L32 45' }, { d: 'M23 26 L41 26' }],
  regent: [{ d: 'M13 47 L15 21 L26 32 L32 15 L38 32 L49 21 L51 47 Z' }, { d: 'M13 47 L51 47' }, { t: 'circle', cx: 32, cy: 27, r: 2.2 }],
  architect: [{ t: 'circle', cx: 32, cy: 14, r: 3.4 }, { d: 'M32 17 L20 50' }, { d: 'M32 17 L44 50' }, { d: 'M24.5 41 Q32 47 39.5 41' }, { d: 'M15 50 L49 50' }],
  diplomat: [{ t: 'circle', cx: 25, cy: 32, r: 12 }, { t: 'circle', cx: 39, cy: 32, r: 12 }],
  sage: [{ d: 'M32 11 L53 49 L11 49 Z' }, { d: 'M21 40 Q32 31 43 40 Q32 47 21 40 Z' }, { t: 'circle', cx: 32, cy: 40, r: 3 }],
}

const DOMAIN: Record<DomainKey, GlyphDef[]> = {
  gather: [{ d: 'M16 24 L48 24 L43 46 Q32 52 21 46 Z' }],
  aware: [{ d: 'M32 14 L46 44 L18 44 Z' }, { d: 'M32 8 L32 14' }],
  direct: [{ d: 'M32 12 L48 19 L48 33 Q48 46 32 52 Q16 46 16 33 L16 19 Z' }],
  organize: [{ d: 'M20 20 L44 20 L44 44 L20 44 Z' }, { d: 'M20 20 L44 44' }, { d: 'M44 20 L20 44' }],
}

/** Superpower → glyph key (borrows a move/face sigil for the gold foil mark). */
const SP_GLYPH: Record<string, string> = {
  connector: 'diplomat', storyteller: 'shaman', strategist: 'architect',
  disruptor: 'challenger', alchemist: 'clean', coach: 'regent', escape_artist: 'open',
}

// ─── color helpers (match the dc.html) ───────────────────────────────────────
function rgbOf(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgba(h: string, a: number): string {
  const [r, g, b] = rgbOf(h)
  return `rgba(${r},${g},${b},${a})`
}
function mix(h1: string, h2: string, t: number): string {
  const a = rgbOf(h1), b = rgbOf(h2)
  const m = (i: 0 | 1 | 2) => Math.round(a[i] * t + b[i] * (1 - t))
  return `rgb(${m(0)},${m(1)},${m(2)})`
}

function Glyph({ defs, size = 20, sw = 2.6, style }: { defs: GlyphDef[]; size?: number; sw?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {defs.map((p, i) =>
        p.t === 'circle' ? (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.f ? 'currentColor' : 'none'} stroke={p.f ? 'none' : 'currentColor'} />
        ) : (
          <path key={i} d={p.d} fill={p.f ? 'currentColor' : 'none'} />
        ),
      )}
    </svg>
  )
}

export function AllyshipCard({
  card,
  mod,
  status = 'open',
  pending = false,
  collapsible = true,
  defaultExpanded = true,
  onClaim,
  onComplete,
  onRelease,
}: AllyshipCardProps) {
  const [override, setOverride] = useState<boolean | null>(null)
  const expanded = collapsible ? (override === null ? defaultExpanded : override) : true

  const c = EL[card.el] ?? EL.earth
  const vars = {
    '--cgf': c.gf, '--cgt': c.gt, '--cglow': c.glow, '--cgem': c.gem, '--cframe': c.frame, '--cgold': '#c9a84c',
    '--gem9': rgba(c.gem, 0.09), '--gem14': rgba(c.gem, 0.14), '--gem16': rgba(c.gem, 0.16), '--gem18': rgba(c.gem, 0.18),
    '--gem40': rgba(c.gem, 0.4), '--gem45': rgba(c.gem, 0.45), '--gem50': rgba(c.gem, 0.5), '--gem60': rgba(c.gem, 0.6),
    '--gemLite': mix(c.gem, '#ffffff', 0.88), '--gem18d': mix(c.gem, '#0a0805', 0.18),
    '--txt62': mix('#ffffff', c.gem, 0.62), '--txt42': mix('#ffffff', c.gem, 0.42),
    width: '100%',
  } as CSSProperties

  const spName = (mod.spLabel || '').toUpperCase()
  const collector = (card.domainLabel || 'Gather Resources').toUpperCase() + (card.num ? ` · ${card.num} / 120` : '')
  const modLabel = `${spName} · ${mod.internal ? 'Inner modifier' : 'Modifier'}`
  const statusBadge = status === 'mine' ? 'Claimed by you' : status === 'taken' ? 'In progress' : ''
  const primaryLabel = status === 'mine' ? (pending ? 'Working…' : 'Done — log it') : pending ? 'Working…' : "I'll take this"
  const stripSub = spName + (status === 'taken' ? ' · taken' : status === 'done' ? ' · done' : status === 'mine' ? ' · yours' : '')
  const stripOpacity = status === 'taken' ? 0.7 : status === 'done' ? 0.6 : 1
  const toggle = () => collapsible && setOverride((v) => !(v === null ? defaultExpanded : v))
  const modGlyphDefs = MOVE[(SP_GLYPH[mod.spKey] ?? '') as MoveKey] ?? FACE[(SP_GLYPH[mod.spKey] ?? 'diplomat') as FaceKey] ?? FACE.diplomat

  if (!expanded) {
    return (
      <div style={vars}>
        <button onClick={toggle} aria-expanded={false} aria-label={`Expand ${card.title}`} style={{ width: '100%', display: 'flex', alignItems: 'stretch', gap: 0, background: 'linear-gradient(100deg,var(--cgf),var(--cgt) 78%)', border: '1.5px solid var(--cframe)', borderRadius: 13, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, boxShadow: '0 10px 24px -18px rgba(0,0,0,.9)', opacity: stripOpacity }}>
          <span aria-hidden style={{ width: 4, flexShrink: 0, background: 'linear-gradient(var(--cgem),var(--cframe))' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', flex: 1, minWidth: 0 }}>
            <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, flexShrink: 0, borderRadius: '50%', color: 'var(--cgem)', background: 'var(--gem16)', boxShadow: 'inset 0 0 0 1px var(--gem50)' }}><Glyph defs={MOVE[card.move]} size={18} sw={3.4} /></span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
              <span style={{ fontFamily: "'Jost',sans-serif", fontWeight: 600, fontSize: 14.5, lineHeight: 1.15, color: '#f1efe9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.title}</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: '.13em', textTransform: 'uppercase', color: '#cdb86a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stripSub}</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, fontSize: 13, color: '#f1efe9', whiteSpace: 'nowrap' }}>{mod.ask}</span>
              <span aria-hidden style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#8c8a83' }}>▾ open</span>
            </span>
          </span>
        </button>
      </div>
    )
  }

  return (
    <div style={vars}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '5 / 7', borderRadius: 16, overflow: 'hidden', border: '2px solid var(--cgold)', background: 'radial-gradient(120% 90% at 80% 6%,var(--cgf),var(--cgt) 60%)', boxShadow: '0 22px 46px -22px rgba(0,0,0,.92),0 0 30px -16px var(--cglow)', display: 'flex', flexDirection: 'column' }}>
        <div aria-hidden style={{ position: 'absolute', right: '-16%', bottom: '-12%', color: 'var(--gem9)', pointerEvents: 'none', lineHeight: 0 }}><Glyph defs={FACE[card.face]} size={300} sw={1.5} /></div>

        {/* title banner */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, padding: '12px 14px 9px', borderBottom: '1px solid var(--gem16)' }}>
          <h3 style={{ margin: 0, fontFamily: "'Jost',sans-serif", fontWeight: 700, fontSize: 24, lineHeight: 1, letterSpacing: '-.015em', color: '#fff', textWrap: 'balance' } as CSSProperties}>{card.title}</h3>
          {collapsible ? (
            <button onClick={toggle} aria-label="Collapse card" style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--gem40)', background: 'rgba(0,0,0,.22)', color: '#cdb86a', fontFamily: "'Space Mono',monospace", fontSize: 12, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▴</button>
          ) : null}
        </div>

        {/* move + face row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 16px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 31, height: 31, borderRadius: '50%', color: '#fff', background: 'linear-gradient(150deg,var(--cgem),var(--cframe))', boxShadow: '0 4px 12px -5px #000,inset 0 1px 0 rgba(255,255,255,.18)' }}><Glyph defs={MOVE[card.move]} size={18} sw={3.4} /></span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--cgem)' }}>{card.moveLabel}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 33, height: 33, borderRadius: 10, color: 'var(--cgem)', background: 'rgba(0,0,0,.34)', border: '1px solid var(--gem45)' }}><Glyph defs={FACE[card.face]} size={22} sw={3} /></span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: '.16em', textTransform: 'uppercase', color: '#cdcbc4' }}>{card.faceLabel}</span>
          </div>
        </div>

        {/* body */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px 0', minHeight: 0 }}>
          <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontStyle: 'italic', fontSize: 12, lineHeight: 1.42, color: 'var(--txt62)' }}>{card.q}</p>

          {/* modifier foil */}
          <div style={{ borderRadius: 11, border: '1px solid rgba(201,168,76,.42)', background: 'linear-gradient(150deg,rgba(201,168,76,.13),rgba(201,168,76,.025))', boxShadow: 'inset 0 1px 0 rgba(255,235,170,.12)', padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0, borderRadius: '50%', color: '#1a1206', background: 'linear-gradient(150deg,#e8c878,#c9a84c)' }}><Glyph defs={modGlyphDefs} size={12} sw={3.6} /></span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', textTransform: 'uppercase', color: '#e0c878', flex: 1, minWidth: 0 }}>{modLabel}</span>
              {statusBadge ? (
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--cgem)', background: 'var(--gem16)', border: '1px solid var(--gem45)', borderRadius: 99, padding: '2px 7px', whiteSpace: 'nowrap' }}>{statusBadge}</span>
              ) : null}
            </div>
            <p style={{ margin: 0, fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 14, lineHeight: 1.34, color: '#f4ecd8', textWrap: 'pretty' } as CSSProperties}>{mod.contribution}</p>
            <div style={{ display: 'flex', gap: 7, alignItems: 'baseline' }}>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: '#b09a5e', flexShrink: 0 }}>Make</span>
              <span style={{ fontFamily: "'Nunito',sans-serif", fontSize: 11, lineHeight: 1.4, color: '#cdbf9a', textWrap: 'pretty' } as CSSProperties}>{mod.artifact}</span>
            </div>
          </div>
        </div>

        {/* footer */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '9px 16px', borderTop: '1px solid var(--gem14)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <span aria-hidden style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, flexShrink: 0, borderRadius: '50%', border: '1px solid rgba(201,168,76,.5)', color: '#c9a84c' }}><Glyph defs={DOMAIN[card.domain]} size={12} sw={3.4} /></span>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--txt42)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{collector}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, color: '#f3eee0' }}>
            <span style={{ color: '#c9a84c' }}>♦</span>{card.yield}
          </span>
        </div>

        {/* action bar */}
        <div style={{ position: 'relative', padding: '0 12px 12px' }}>
          {status === 'mine' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onRelease?.(card.id)} disabled={pending} style={{ flexShrink: 0, fontFamily: "'Jost',sans-serif", fontWeight: 600, fontSize: 12.5, color: '#bdbbb4', background: 'rgba(0,0,0,.25)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 9, padding: '9px 13px', cursor: 'pointer' }}>Release</button>
              <button onClick={() => onComplete?.(card.id)} disabled={pending} style={{ flex: 1, fontFamily: "'Jost',sans-serif", fontWeight: 700, fontSize: 13.5, color: '#10160d', background: 'linear-gradient(150deg,var(--gemLite),var(--cgem))', border: 'none', borderRadius: 9, padding: '10px 13px', cursor: 'pointer', boxShadow: '0 6px 16px -8px var(--cglow)' }}>{primaryLabel}</button>
            </div>
          ) : status === 'open' ? (
            <button onClick={() => onClaim?.(card.id)} disabled={pending} style={{ width: '100%', fontFamily: "'Jost',sans-serif", fontWeight: 700, fontSize: 13.5, color: '#f1efe9', background: 'var(--gem18d)', border: '1px solid var(--gem60)', borderRadius: 9, padding: '10px 13px', cursor: 'pointer' }}>{primaryLabel}</button>
          ) : status === 'signedout' ? (
            <button onClick={() => onClaim?.(card.id)} style={{ width: '100%', fontFamily: "'Jost',sans-serif", fontWeight: 600, fontSize: 12.5, color: '#cdb86a', background: 'transparent', border: '1px dashed rgba(201,168,76,.5)', borderRadius: 9, padding: '10px 13px', cursor: 'pointer' }}>Sign in to claim</button>
          ) : status === 'taken' ? (
            <div style={{ textAlign: 'center', fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#8c8a83', padding: '9px 0 4px' }}>Someone&apos;s on this</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 0 4px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', fontSize: 10, color: '#10160d', background: 'var(--cgem)' }}>✓</span>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--cgem)' }}>Logged — thank you</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── shared glyph helpers (exported for siblings) ────────────────────────────
export { MOVE, FACE, DOMAIN, SP_GLYPH, EL, Glyph }
export type { GlyphDef }
