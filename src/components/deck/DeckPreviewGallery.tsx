'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import {
  DECK_FONTS,
  DECK_GOLD,
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

const isMove = (c: AllyshipDeck['cards'][number]): c is MoveCard => c.kind === 'move'

/**
 * Unauthenticated gallery of all 120 move cards using the high-fidelity `AllyshipCard`.
 * Powers `/deck/preview` — a design-review surface (no paywall, reads the public JSON),
 * and the visual proof of the card primitive. Filters by move/operation/domain + the
 * self/others subject toggle; click a card to open it full.
 */
export function DeckPreviewGallery() {
  const [deck, setDeck] = useState<AllyshipDeck | null>(null)
  const [error, setError] = useState(false)
  const [subject, setSubject] = useState<CardSubject>('self')
  const [fMove, setFMove] = useState<BasicMove | 'all'>('all')
  const [fOp, setFOp] = useState<Operation | 'all'>('all')
  const [fDomain, setFDomain] = useState<AllyshipDomain | 'all'>('all')
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
  const shown = useMemo(
    () =>
      moveCards.filter(
        (c) =>
          (fMove === 'all' || c.move === fMove) &&
          (fOp === 'all' || c.operation === fOp) &&
          (fDomain === 'all' || c.domain === fDomain),
      ),
    [moveCards, fMove, fOp, fDomain],
  )

  if (error) return <Centered>The deck could not be loaded.</Centered>
  if (!deck) return <Centered>Shuffling…</Centered>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px 80px' }}>
      <header style={{ textAlign: 'center', marginBottom: 18 }}>
        <p style={{ ...kicker, color: DECK_GOLD }}>Design preview · no account needed</p>
        <h1 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 30, color: '#fff', margin: '6px 0 0' }}>
          The Allyship Deck — all {moveCards.length} cards
        </h1>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textSecondary, margin: '8px 0 0' }}>
          5 moves × 4 domains × 6 faces. Click a card to open it.
        </p>
      </header>

      {/* subject toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <Chip active={subject === 'self'} onClick={() => setSubject('self')}>
          Allyship for self
        </Chip>
        <Chip active={subject === 'campaign'} onClick={() => setSubject('campaign')}>
          Allyship for others
        </Chip>
      </div>

      {/* filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
        <FilterRow value={fMove} setValue={setFMove} all="All moves" options={Object.entries(MOVE_LABELS) as [BasicMove, string][]} />
        <FilterRow value={fDomain} setValue={setFDomain} all="All domains" options={Object.entries(DOMAIN_LABELS) as [AllyshipDomain, string][]} />
        <FilterRow value={fOp} setValue={setFOp} all="All faces" options={Object.entries(OPERATION_LABELS) as [Operation, string][]} />
      </div>

      <p style={{ ...kicker, color: SURFACE_TOKENS.textSecondary, textAlign: 'center', marginBottom: 14 }}>
        {shown.length} of {moveCards.length} cards
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(178px, 1fr))', gap: 12 }}>
        {shown.map((c) => (
          <AllyshipCard key={c.id} card={c} variant="grid" subject={subject} onClick={() => setSelected(c)} />
        ))}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.72)',
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            zIndex: 50,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(380px, 92vw)' }}>
            <AllyshipCard card={selected} variant="full" subject={subject} />
            <button type="button" onClick={() => setSelected(null)} style={closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterRow<T extends string>({
  value,
  setValue,
  all,
  options,
}: {
  value: T | 'all'
  setValue: (v: T | 'all') => void
  all: string
  options: [T, string][]
}) {
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value as T | 'all')}
      style={{
        fontFamily: DECK_FONTS.mono,
        fontSize: 12,
        padding: '7px 10px',
        borderRadius: 6,
        background: SURFACE_TOKENS.surfaceInset,
        color: SURFACE_TOKENS.textPrimary,
        border: '1px solid rgba(255,255,255,.12)',
      }}
    >
      <option value="all">{all}</option>
      {options.map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
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
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '6px 12px',
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: SURFACE_TOKENS.textSecondary, fontFamily: DECK_FONTS.body }}>
      {children}
    </div>
  )
}

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
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
