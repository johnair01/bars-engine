'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import {
  DECK_FONTS,
  DECK_GOLD,
  LIMINAL,
  MOVE_LABELS,
  OPERATION_LABELS,
  DOMAIN_LABELS,
} from '@/lib/allyship-deck/card-visuals'
import type {
  AllyshipDeck,
  MoveCard,
  BasicMove,
  Operation,
  AllyshipDomain,
} from '@/lib/allyship-deck/types'
import { AllyshipCard, type CardSubject } from './AllyshipCard'

type View = 'draw' | 'browse' | 'find'

const isMove = (c: AllyshipDeck['cards'][number]): c is MoveCard => c.kind === 'move'

/**
 * The Allyship Deck app (gated `/deck`). Three surfaces on the high-fidelity card:
 *   • Draw — face-down card → shuffle (420ms flip) → reveal.
 *   • Browse — filter chips (move / domain / face) over all 120 cards.
 *   • Find a card — the authored `problems[]`: pick a struggle → its cards, in order.
 * Card detail opens in an overlay. "Send to BARS" lands in slice 3.
 *
 * @see .specify/specs/allyship-deck-experience/spec.md
 */
export function AllyshipDeckReader() {
  const [deck, setDeck] = useState<AllyshipDeck | null>(null)
  const [error, setError] = useState(false)
  const [view, setView] = useState<View>('draw')
  const [subject, setSubject] = useState<CardSubject>('self')

  // Draw
  const [shuffling, setShuffling] = useState(false)
  const [drawn, setDrawn] = useState<MoveCard | null>(null)

  // Browse filters
  const [fMove, setFMove] = useState<BasicMove | 'all'>('all')
  const [fOp, setFOp] = useState<Operation | 'all'>('all')
  const [fDomain, setFDomain] = useState<AllyshipDomain | 'all'>('all')

  // Find a card
  const [problemId, setProblemId] = useState<string | null>(null)

  // Detail overlay (browse / find)
  const [selected, setSelected] = useState<MoveCard | null>(null)

  useEffect(() => {
    fetch('/allyship-deck/allyship-deck.json')
      .then((r) => {
        if (!r.ok) throw new Error('load')
        return r.json() as Promise<AllyshipDeck>
      })
      .then(setDeck)
      .catch(() => setError(true))
  }, [])

  const moveCards = useMemo(() => (deck ? deck.cards.filter(isMove) : []), [deck])
  const browsed = useMemo(
    () =>
      moveCards.filter(
        (c) =>
          (fMove === 'all' || c.move === fMove) &&
          (fOp === 'all' || c.operation === fOp) &&
          (fDomain === 'all' || c.domain === fDomain),
      ),
    [moveCards, fMove, fOp, fDomain],
  )

  const draw = () => {
    if (!moveCards.length || shuffling) return
    setShuffling(true)
    setDrawn(null)
    window.setTimeout(() => {
      setDrawn(moveCards[Math.floor(Math.random() * moveCards.length)])
      setShuffling(false)
    }, 420)
  }

  const switchView = (v: View) => {
    setView(v)
    setSelected(null)
    window.scrollTo(0, 0)
  }

  if (error) return <Centered>The deck could not be loaded.</Centered>
  if (!deck) return <Centered>Shuffling…</Centered>

  const problem = deck.problems.find((p) => p.id === problemId) || null
  const problemCards = problem ? moveCards.filter((c) => problem.cardIds.includes(c.id)) : []

  return (
    <main style={{ minHeight: '100vh', background: SURFACE_TOKENS.bgBase }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 80px' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: 12 }}>
          <p style={{ ...kicker, color: DECK_GOLD }}>Mastering Allyship Moves</p>
          <h1 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 28, color: '#fff', margin: '4px 0 0' }}>
            The Allyship Deck
          </h1>
        </header>

        {/* Subject toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          <Chip active={subject === 'self'} onClick={() => setSubject('self')}>
            Allyship for self
          </Chip>
          <Chip active={subject === 'campaign'} onClick={() => setSubject('campaign')}>
            Allyship for others
          </Chip>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
          {(['draw', 'browse', 'find'] as View[]).map((v) => (
            <NavTab key={v} active={view === v} onClick={() => switchView(v)}>
              {v === 'draw' ? 'Draw' : v === 'browse' ? 'Browse' : 'Find a card'}
            </NavTab>
          ))}
        </nav>

        {/* Draw */}
        {view === 'draw' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 8 }}>
            {drawn ? (
              <>
                <div key={drawn.id} className="deck-card-flip-in" style={{ width: 'min(360px, 92vw)' }}>
                  <AllyshipCard card={drawn} variant="full" subject={subject} />
                </div>
                <button type="button" style={secondaryBtn} onClick={draw}>
                  Draw again
                </button>
              </>
            ) : (
              <>
                <FaceDown pulsing={shuffling} />
                <button type="button" style={{ ...primaryBtn, opacity: shuffling ? 0.6 : 1 }} onClick={draw} disabled={shuffling}>
                  {shuffling ? 'Shuffling…' : 'Shuffle & draw'}
                </button>
                <p style={{ fontFamily: DECK_FONTS.body, fontSize: 13, color: SURFACE_TOKENS.textSecondary, textAlign: 'center', maxWidth: 360 }}>
                  Pull one move at random. Read its question. Do its practice.
                </p>
              </>
            )}
          </div>
        )}

        {/* Browse */}
        {view === 'browse' && (
          <>
            <ChipGroup label="Move" value={fMove} setValue={setFMove} options={Object.entries(MOVE_LABELS) as [BasicMove, string][]} />
            <ChipGroup label="Domain" value={fDomain} setValue={setFDomain} options={Object.entries(DOMAIN_LABELS) as [AllyshipDomain, string][]} />
            <ChipGroup label="Face" value={fOp} setValue={setFOp} options={Object.entries(OPERATION_LABELS) as [Operation, string][]} />
            <p style={{ ...kicker, color: SURFACE_TOKENS.textSecondary, textAlign: 'center', margin: '14px 0' }}>
              {browsed.length} of {moveCards.length} cards
            </p>
            <CardGrid cards={browsed} subject={subject} onPick={setSelected} />
          </>
        )}

        {/* Find a card */}
        {view === 'find' && (
          <>
            <p style={{ fontFamily: DECK_FONTS.body, fontSize: 15, color: SURFACE_TOKENS.textSecondary, textAlign: 'center', marginBottom: 14 }}>
              Start from what you&rsquo;re actually stuck on.
            </p>
            {!problem ? (
              <div style={{ display: 'grid', gap: 8 }}>
                {deck.problems.map((p) => (
                  <button key={p.id} type="button" onClick={() => setProblemId(p.id)} style={problemRow}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: LIMINAL.glow, flex: 'none' }} />
                    <span style={{ flex: 1 }}>{p.label}</span>
                    <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted, whiteSpace: 'nowrap' }}>{p.cardIds.length} cards →</span>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 19, color: '#fff', margin: 0 }}>
                    &ldquo;{problem.label}&rdquo;
                  </h3>
                  <p style={{ fontFamily: DECK_FONTS.body, fontSize: 13, color: SURFACE_TOKENS.textSecondary, margin: '6px 0 0' }}>
                    Move through these in order.
                  </p>
                  <button type="button" onClick={() => setProblemId(null)} style={{ ...secondaryBtn, marginTop: 12, padding: '8px 16px', fontSize: 13 }}>
                    ← Pick another
                  </button>
                </div>
                <CardGrid cards={problemCards} subject={subject} onPick={setSelected} />
              </>
            )}
          </>
        )}
      </div>

      {/* Detail overlay */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 50 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(380px, 92vw)' }}>
            <AllyshipCard card={selected} variant="full" subject={subject} />
            {/* Send to BARS lands in slice 3 (footerSlot). */}
            <button type="button" onClick={() => setSelected(null)} style={closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

/* ── sub-components ─────────────────────────────────────────────── */

function FaceDown({ pulsing }: { pulsing: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 200,
        height: 288,
        borderRadius: 12,
        border: `2px solid ${DECK_GOLD}`,
        background: 'radial-gradient(120% 90% at 50% 0%, #241a3e, #0c0a14 70%)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 0 30px -12px ${LIMINAL.frame}, 0 20px 44px -20px rgba(0,0,0,.9)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 200ms ease',
        transform: pulsing ? 'scale(.97)' : 'none',
      }}
    >
      <div style={{ position: 'absolute', inset: 10, borderRadius: 10, border: `1px solid color-mix(in srgb, ${DECK_GOLD} 40%, transparent)` }} />
      <span style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 60, color: `color-mix(in srgb, ${DECK_GOLD} 80%, transparent)` }}>B</span>
    </div>
  )
}

function CardGrid({ cards, subject, onPick }: { cards: MoveCard[]; subject: CardSubject; onPick: (c: MoveCard) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
      {cards.map((c) => (
        <AllyshipCard key={c.id} card={c} variant="grid" subject={subject} onClick={() => onPick(c)} />
      ))}
    </div>
  )
}

function ChipGroup<T extends string>({
  label,
  value,
  setValue,
  options,
}: {
  label: string
  value: T | 'all'
  setValue: (v: T | 'all') => void
  options: [T, string][]
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted, width: 54, flex: 'none' }}>{label}</span>
      <Chip active={value === 'all'} onClick={() => setValue('all')}>
        All
      </Chip>
      {options.map(([k, lbl]) => (
        <Chip key={k} active={value === k} onClick={() => setValue(value === k ? 'all' : k)}>
          {lbl}
        </Chip>
      ))}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: DECK_FONTS.mono,
        fontSize: 11,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '6px 11px',
        borderRadius: 999,
        cursor: 'pointer',
        color: active ? '#150a04' : SURFACE_TOKENS.textSecondary,
        background: active ? DECK_GOLD : SURFACE_TOKENS.surfaceInset,
        border: active ? 'none' : '1px solid rgba(255,255,255,.12)',
        fontWeight: active ? 700 : 400,
      }}
    >
      {children}
    </button>
  )
}

function NavTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: DECK_FONTS.display,
        fontWeight: active ? 700 : 500,
        fontSize: 15,
        padding: '9px 18px',
        borderRadius: 10,
        cursor: 'pointer',
        border: `1px solid ${active ? DECK_GOLD : 'rgba(255,255,255,.12)'}`,
        background: active ? 'color-mix(in srgb, #C9A84C 16%, transparent)' : 'transparent',
        color: active ? '#e7c98a' : SURFACE_TOKENS.textPrimary,
      }}
    >
      {children}
    </button>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', background: SURFACE_TOKENS.bgBase, color: SURFACE_TOKENS.textSecondary, fontFamily: DECK_FONTS.body }}>
      {children}
    </div>
  )
}

/* ── style tokens ──────────────────────────────────────────────── */

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
}

const primaryBtn: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontWeight: 700,
  fontSize: 16,
  padding: '14px 30px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  color: '#fff',
  background: LIMINAL.frame,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 10px 24px -10px ${LIMINAL.frame}`,
}

const secondaryBtn: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontWeight: 600,
  fontSize: 15,
  padding: '12px 22px',
  borderRadius: 12,
  cursor: 'pointer',
  color: SURFACE_TOKENS.textPrimary,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,.16)',
}

const closeBtn: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 12,
  padding: '11px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'transparent',
  color: SURFACE_TOKENS.textSecondary,
  fontFamily: DECK_FONTS.display,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}

const problemRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  textAlign: 'left',
  padding: '15px 16px',
  borderRadius: 12,
  cursor: 'pointer',
  background: SURFACE_TOKENS.surfaceCard,
  border: '1px solid rgba(255,255,255,.12)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
  color: SURFACE_TOKENS.textPrimary,
  fontFamily: DECK_FONTS.body,
  fontSize: 15,
}
