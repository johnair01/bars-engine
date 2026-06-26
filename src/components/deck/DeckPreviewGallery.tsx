'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DECK_FONTS, DECK_GOLD } from '@/lib/allyship-deck/card-visuals'
import type { AllyshipDeck, MoveCard } from '@/lib/allyship-deck/types'
import { pickDeckSample } from '@/lib/allyship-deck/sample'
import { AllyshipCard, type CardSubject } from './AllyshipCard'

const isMove = (c: AllyshipDeck['cards'][number]): c is MoveCard => c.kind === 'move'
const SAMPLE_SIZE = 12

/**
 * Unauthenticated *sample* gallery for `/deck/preview` — a teaser showing a
 * representative handful of cards (not all 120; the full deck is the paid product
 * at `/deck`). Reads the public JSON, samples deterministically via `pickDeckSample`,
 * keeps the self/others subject toggle, and points buyers to `/launch`. Click a
 * card to open it full.
 */
export function DeckPreviewGallery() {
  const [deck, setDeck] = useState<AllyshipDeck | null>(null)
  const [error, setError] = useState(false)
  const [subject, setSubject] = useState<CardSubject>('self')
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
  const sample = useMemo(() => pickDeckSample(moveCards, SAMPLE_SIZE), [moveCards])

  if (error) return <Centered>The deck could not be loaded.</Centered>
  if (!deck) return <Centered>Shuffling…</Centered>

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px 80px' }}>
      <header style={{ textAlign: 'center', marginBottom: 18 }}>
        <p style={{ ...kicker, color: DECK_GOLD }}>Sample · no account needed</p>
        <h1 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 30, color: '#fff', margin: '6px 0 0' }}>
          A taste of the Allyship Deck
        </h1>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textSecondary, margin: '8px 0 0' }}>
          {sample.length} of {moveCards.length} cards — 5 moves × 4 domains × 6 faces. Click a card to open it.
        </p>
      </header>

      {/* subject toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
        <Chip active={subject === 'self'} onClick={() => setSubject('self')}>
          Allyship for self
        </Chip>
        <Chip active={subject === 'campaign'} onClick={() => setSubject('campaign')}>
          Allyship for others
        </Chip>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(178px, 1fr))', gap: 12 }}>
        {sample.map((c) => (
          <AllyshipCard key={c.id} card={c} variant="grid" subject={subject} onClick={() => setSelected(c)} />
        ))}
      </div>

      {/* Buy CTA — the full deck lives behind the purchase */}
      <div style={{ textAlign: 'center', marginTop: 36 }}>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 15, color: SURFACE_TOKENS.textSecondary, margin: '0 auto 16px', maxWidth: 460 }}>
          This is a sample. Unlock all {moveCards.length} cards with the deck purchase,
          the game subscription, or the Founding Ally bundle.
        </p>
        <Link href="/launch" style={buyCta}>
          Get all {moveCards.length} cards
        </Link>
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

const buyCta: CSSProperties = {
  display: 'inline-block',
  padding: '13px 28px',
  borderRadius: 999,
  background: DECK_GOLD,
  color: '#150a04',
  fontFamily: DECK_FONTS.display,
  fontWeight: 700,
  fontSize: 15,
  textDecoration: 'none',
  boxShadow: '0 10px 30px -12px rgba(201,168,76,.7)',
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
