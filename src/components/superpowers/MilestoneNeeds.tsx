'use client'

/**
 * MilestoneNeeds — the campaign tiered-donation surface (Mobility Quest design
 * handoff). Composes AllyshipCard: a progress header (external/internal, never
 * blended), a Tier 1 swipeable matched "hand", and a collapsible Tier 2 list.
 * Stateful board: claim/complete/release call the real server actions with
 * optimistic local updates. No points, no rank. Faithful port of
 * MilestoneNeeds.dc.html. (Tokens inlined to exact handoff values.)
 */
import { useState, type CSSProperties } from 'react'
import { AllyshipCard, type AllyshipCardData, type AllyshipCardMod, type CardStatus } from './AllyshipCard'
import { claimMilestoneNeed, completeMilestoneNeed, releaseMilestoneNeed } from '@/actions/milestone-needs'

const C = {
  bg: '#0a0908',
  card: '#1a1a18',
  inset: '#111110',
  line: 'rgba(255,255,255,0.07)',
  insetTop: 'rgba(255,255,255,0.06)',
}

export type MNUnit = 'action' | 'currency' | 'hours'
export interface MNBar { unit: MNUnit; done: number; total: number }
export interface MNItem {
  id: string
  card: AllyshipCardData
  mod: AllyshipCardMod
  status: CardStatus
  unit: MNUnit
  value: number
}

export interface MilestoneNeedsProps {
  campaignTitle: string
  campaignBlurb: string
  lensLabel: string
  lensAbbr: string
  signedIn: boolean
  dataState?: 'populated' | 'loading' | 'empty'
  matched: MNItem[]
  open: MNItem[]
  summary: { external: MNBar[]; internal: MNBar[] }
  tier2DefaultOpen?: boolean
}

function barText(b: MNBar): string {
  if (b.unit === 'currency') return `$${b.done.toLocaleString()} / ${b.total.toLocaleString()}`
  if (b.unit === 'hours') return `${b.done} / ${b.total} hrs`
  return `${b.done} / ${b.total} acts`
}
function barAria(b: MNBar): string {
  if (b.unit === 'currency') return `$${b.done} of $${b.total} raised`
  if (b.unit === 'hours') return `${b.done} of ${b.total} hours given`
  return `${b.done} of ${b.total} actions logged`
}

const MONO = "'Space Mono',monospace"
const JOST = "'Jost',sans-serif"
const NUN = "'Nunito',sans-serif"

export function MilestoneNeeds(props: MilestoneNeedsProps) {
  const dataState = props.dataState ?? 'populated'
  const [matched, setMatched] = useState<MNItem[]>(props.matched)
  const [open, setOpen] = useState<MNItem[]>(props.open)
  const [summary, setSummary] = useState(props.summary)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [tier2Open, setTier2Open] = useState(props.tier2DefaultOpen ?? true)

  const setStatus = (id: string, status: CardStatus) => {
    const upd = (arr: MNItem[]) => arr.map((n) => (n.id === id ? { ...n, status } : n))
    setMatched(upd)
    setOpen(upd)
  }
  const find = (id: string) => matched.find((n) => n.id === id) ?? open.find((n) => n.id === id)

  const bump = (item: MNItem) => {
    setSummary((s) => ({
      ...s,
      external: s.external.map((b) => (b.unit === item.unit ? { ...b, done: Math.min(b.total, b.done + item.value) } : b)),
    }))
  }

  async function claim(id: string) {
    if (pendingId || !props.signedIn) return
    setPendingId(id)
    const r = await claimMilestoneNeed({ needId: id })
    if (r.ok) setStatus(id, 'mine')
    setPendingId(null)
  }
  async function complete(id: string) {
    if (pendingId) return
    const item = find(id)
    setPendingId(id)
    const r = await completeMilestoneNeed({ needId: id })
    if (r.ok) {
      setStatus(id, 'done')
      if (item) bump(item)
    }
    setPendingId(null)
  }
  async function release(id: string) {
    if (pendingId) return
    const r = await releaseMilestoneNeed({ needId: id })
    if (r.ok) setStatus(id, 'open')
  }

  const mkBars = (arr: MNBar[]) =>
    arr.map((b) => ({ key: b.unit, pct: Math.max(2, Math.min(100, Math.round((b.done / b.total) * 100))), now: b.done, max: b.total, text: barText(b), aria: barAria(b) }))

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(120% 90% at 50% -8%, #14110d 0%, ${C.bg} 58%)`, display: 'flex', justifyContent: 'center', fontFamily: JOST }}>
      <div style={{ width: '100%', maxWidth: 440, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* header */}
        <div style={{ padding: '26px 20px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.26em', color: '#8c8a83' }}>Campaign · Gather Resources</span>
            <h1 style={{ margin: 0, fontFamily: JOST, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1, fontSize: 34, color: '#f1efe9' }}>{props.campaignTitle}</h1>
            <p style={{ margin: 0, fontFamily: NUN, fontSize: 13.5, lineHeight: 1.5, color: '#a8a69f', maxWidth: 330, textWrap: 'pretty' } as CSSProperties}>{props.campaignBlurb}</p>
          </div>
          <span aria-label={`${props.lensLabel} lens`} title={props.lensLabel} style={{ flexShrink: 0, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 13, fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#1a1206', background: 'linear-gradient(150deg,#e8c878,#c9a84c)', boxShadow: '0 8px 18px -10px #c9a84c' }}>{props.lensAbbr}</span>
            <span style={{ fontFamily: MONO, fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: '#cdb86a' }}>lens</span>
          </span>
        </div>

        {dataState === 'loading' ? (
          <div style={{ padding: '0 16px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: C.card, borderRadius: 14, boxShadow: `inset 0 0 0 1px ${C.line}`, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 9, width: '55%', borderRadius: 99, background: C.inset }} />
              <div style={{ height: 8, width: '100%', borderRadius: 99, background: C.inset }} />
              <div style={{ height: 8, width: '100%', borderRadius: 99, background: C.inset }} />
            </div>
          </div>
        ) : dataState === 'empty' ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 36px 80px', gap: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 54, height: 54, borderRadius: 16, fontFamily: MONO, fontSize: 13, fontWeight: 700, color: '#1a1206', background: 'linear-gradient(150deg,#e8c878,#c9a84c)', opacity: 0.85 }}>{props.lensAbbr}</span>
            <p style={{ margin: 0, fontFamily: NUN, fontSize: 15, lineHeight: 1.55, color: '#b8b6b0', maxWidth: 280, textWrap: 'pretty' } as CSSProperties}>No needs scoped for a {props.lensLabel} right now. The campaign surfaces matched cards as it grows.</p>
            <span style={{ fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.16em', color: '#8c8a83' }}>Check back · or browse the deck</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
            {/* progress card */}
            <div style={{ margin: '0 16px', background: C.card, borderRadius: 14, boxShadow: `inset 0 1px 0 ${C.insetTop},inset 0 0 0 1px ${C.line}`, padding: '16px 16px 17px', display: 'flex', flexDirection: 'column', gap: 15 }}>
              <ProgressGroup title="Help the world" sub="external · the fund" bars={mkBars(summary.external)} fill="linear-gradient(90deg,#b5651d,#e0a93b)" glow="rgba(212,160,23,.4)" inset={C.inset} />
              <div style={{ height: 1, background: C.line }} />
              <ProgressGroup title="Inner work" sub="self · separate track" bars={mkBars(summary.internal)} fill="linear-gradient(90deg,#7c3aed,#a855f7)" glow="rgba(124,58,237,.4)" inset={C.inset} />
            </div>

            {/* Tier 1 — matched hand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontFamily: MONO, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.2em', color: '#cdb86a' }}>Tier 1 · Matched · {props.lensLabel}</span>
                <h2 style={{ margin: 0, fontFamily: JOST, fontWeight: 700, letterSpacing: '-.015em', fontSize: 21, lineHeight: 1.1, color: '#f1efe9' }}>Ways only a {props.lensLabel} can help</h2>
                {props.signedIn ? (
                  <span style={{ fontFamily: MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#8c8a83' }}>{matched.length} cards · swipe →</span>
                ) : (
                  <span style={{ fontFamily: NUN, fontSize: 13, lineHeight: 1.4, color: '#a8a69f' }}>Browsing is open — sign in when you&apos;re ready to claim one.</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '4px 20px 16px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' } as CSSProperties}>
                {matched.map((item) => (
                  <div key={item.id} style={{ flex: 'none', width: 290, scrollSnapAlign: 'center' }}>
                    <AllyshipCard card={item.card} mod={item.mod} status={item.status} pending={pendingId === item.id} collapsible={false} onClaim={claim} onComplete={complete} onRelease={release} />
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 2 — open aid */}
            <div style={{ margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
              <button onClick={() => setTier2Open((v) => !v)} aria-expanded={tier2Open} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 4px', textAlign: 'left' }}>
                <span style={{ fontFamily: JOST, fontWeight: 600, fontSize: 16, letterSpacing: '-.01em', color: '#f1efe9' }}>Other ways to help</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: '#8c8a83', background: C.inset, boxShadow: `inset 0 0 0 1px ${C.line}`, padding: '2px 7px', borderRadius: 99 }}>{open.length}</span>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '.14em', color: '#8c8a83' }}>{tier2Open ? 'Hide ▴' : 'Show ▾'}</span>
              </button>
              {tier2Open ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <span style={{ fontFamily: NUN, fontSize: 12.5, lineHeight: 1.4, color: '#8c8a83', margin: '-2px 2px 2px' }}>Not your superpower, but the same cause. Tap any card to open it.</span>
                  {open.map((item) => (
                    <AllyshipCard key={item.id} card={item.card} mod={item.mod} status={item.status} pending={pendingId === item.id} collapsible defaultExpanded={false} onClaim={claim} onComplete={complete} onRelease={release} />
                  ))}
                </div>
              ) : null}
            </div>

            <p style={{ margin: '4px 24px 0', fontFamily: NUN, fontSize: 12, lineHeight: 1.5, color: '#8c8a83', textAlign: 'center', textWrap: 'pretty' } as CSSProperties}>Help moves a shared cause. No points, no rank — steady accumulation is the form.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressGroup({ title, sub, bars, fill, glow, inset }: { title: string; sub: string; bars: { key: string; pct: number; now: number; max: number; text: string; aria: string }[]; fill: string; glow: string; inset: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <span style={{ fontFamily: JOST, fontWeight: 600, fontSize: 14, letterSpacing: '-.01em', color: '#f1efe9' }}>{title}</span>
        <span style={{ fontFamily: MONO, fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.14em', color: '#8c8a83' }}>{sub}</span>
      </div>
      {bars.map((bar) => (
        <div key={bar.key} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div role="progressbar" aria-label={bar.aria} aria-valuenow={bar.now} aria-valuemin={0} aria-valuemax={bar.max} style={{ flex: 1, height: 8, borderRadius: 99, background: inset, boxShadow: 'inset 0 1px 2px rgba(0,0,0,.5)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 99, width: `${bar.pct}%`, background: fill, boxShadow: `0 0 8px ${glow}`, transition: 'width .5s cubic-bezier(.16,1,.3,1)' }} />
          </div>
          <span style={{ fontFamily: MONO, fontVariantNumeric: 'tabular-nums', fontSize: 11, color: '#bdbbb4', whiteSpace: 'nowrap', minWidth: 84, textAlign: 'right' }}>{bar.text}</span>
        </div>
      ))}
    </div>
  )
}
