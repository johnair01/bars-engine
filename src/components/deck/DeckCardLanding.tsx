'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import {
  themeForMove,
  DECK_GOLD,
  INSET_TOP,
  DECK_FONTS,
  MOVE_LABELS,
  OPERATION_LABELS,
  DOMAIN_LABELS,
} from '@/lib/allyship-deck/card-visuals'
import {
  glossaryHref,
  moveTermId,
  operationTermId,
  domainTermId,
} from '@/lib/allyship-deck/glossary'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { MovePip } from './MovePip'
import { FaceBadge } from './FaceBadge'
import type { CardSubject } from './AllyshipCard'

/**
 * Public, ungated landing page for a single Allyship Deck card — the destination for
 * card-specific marketing links (`/deck/card/[id]`). It shows only the *question* side
 * of a card (title, move/operation/domain, both readings, the restored capability) and
 * always closes with a fixed CTA back to `/deck/sales`. The card's full "working"
 * (forbidden moves, failure modes, the remediation practice) is deliberately held back —
 * that depth is the paid deck.
 *
 * Reuses the deck's visual primitives (MovePip / FaceBadge / element theming) so the
 * landing card matches the real product; it does not reuse the full `AllyshipCard`
 * because that surface intentionally reveals the practice well.
 *
 * @see .specify/specs — Individual Card Landing Pages
 */
export function DeckCardLanding({ card }: { card: MoveCard }) {
  const [subject, setSubject] = useState<CardSubject>('self')
  const t = themeForMove(card.move)
  const question = subject === 'campaign' ? card.campaignQuestion : card.primaryQuestion

  // Per-card view — fire once on mount so we can compare which cards convert.
  useEffect(() => {
    sendDeckEvent('card_view', card.id)
  }, [card.id])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', padding: '32px 16px 80px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* The card — locked to the 5:7 poker proportion the deck uses everywhere
            (same as AllyshipCard's full variant); longer readings scroll inside the
            frame instead of stretching it. */}
        <article
          style={{
            position: 'relative',
            borderRadius: 14,
            aspectRatio: '5 / 7',
            overflowY: 'auto',
            border: `2px solid ${DECK_GOLD}`,
            background: `radial-gradient(120% 90% at 78% 8%, ${t.gradFrom}, ${t.gradTo} 64%)`,
            boxShadow: `${INSET_TOP}, 0 0 30px 1px color-mix(in srgb, ${t.glow} 38%, transparent), 0 22px 48px -22px rgba(0,0,0,.9)`,
            color: SURFACE_TOKENS.textPrimary,
            padding: '22px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <MovePip move={card.move} size={30} />
            <span
              style={{
                fontFamily: DECK_FONTS.mono,
                fontSize: 11,
                letterSpacing: '0.1em',
                color: SURFACE_TOKENS.textMuted,
              }}
            >
              {card.id}
            </span>
            <FaceBadge operation={card.operation} size={28} />
          </div>

          <h1 style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 30, color: '#fff', margin: '18px 0 0', lineHeight: 1.12 }}>
            {card.title}
          </h1>

          {/* three tags — move / operation / domain, each deep-links to its glossary term */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
            <Tag href={glossaryHref(moveTermId(card.move))} color={t.gem}>
              {MOVE_LABELS[card.move]}
            </Tag>
            <Tag href={glossaryHref(operationTermId(card.operation))} color="#e7c98a">
              {OPERATION_LABELS[card.operation]}
            </Tag>
            <Tag href={glossaryHref(domainTermId(card.domain))} color={t.gem}>
              ◇ {DOMAIN_LABELS[card.domain]}
            </Tag>
          </div>

          {/* subject toggle — same card, two readings */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <Chip active={subject === 'self'} onClick={() => setSubject('self')}>
              For self
            </Chip>
            <Chip active={subject === 'campaign'} onClick={() => setSubject('campaign')}>
              For others
            </Chip>
          </div>

          <p
            style={{
              fontFamily: DECK_FONTS.body,
              fontStyle: 'italic',
              fontSize: 19,
              color: '#e7c98a',
              lineHeight: 1.45,
              margin: '14px 0 0',
            }}
          >
            {question}
          </p>

          {card.capabilities.length > 0 && (
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 18,
                borderTop: '1px solid color-mix(in srgb, #fff 10%, transparent)',
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: DECK_FONTS.mono,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: SURFACE_TOKENS.textMuted,
                }}
              >
                Restores
              </span>
              <span style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: '#fff' }}>
                {card.capabilities.join(' · ')}
              </span>
            </div>
          )}
        </article>

        {/* CTA — fixed, brand voice, no scarcity. Always points back to the deck storefront. */}
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <p style={{ fontFamily: DECK_FONTS.body, fontSize: 15, color: SURFACE_TOKENS.textSecondary, margin: '0 auto 16px', maxWidth: 380 }}>
            This is one of 120 cards in the Allyship Deck.
          </p>
          <Link href="/deck/sales" onClick={() => sendDeckEvent('cta_click', card.id)} style={cta}>
            See the full deck →
          </Link>
        </div>
      </div>
    </main>
  )
}

/** Fire-and-forget analytics beacon; never blocks navigation or throws into the UI. */
function sendDeckEvent(event: 'card_view' | 'cta_click', cardId: string) {
  try {
    const body = JSON.stringify({ event, cardId })
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/deck/events', new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch('/api/deck/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* analytics must never break the page */
  }
}

function Tag({ href, color, children }: { href: string; color: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: DECK_FONTS.mono,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '5px 10px',
        borderRadius: 999,
        color,
        background: 'color-mix(in srgb, #000 24%, transparent)',
        border: `1px solid color-mix(in srgb, ${color} 40%, transparent)`,
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
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

const cta: CSSProperties = {
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
