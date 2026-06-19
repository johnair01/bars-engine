'use client'

import type { ReactNode, CSSProperties } from 'react'
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
import type { MoveCard } from '@/lib/allyship-deck/types'
import { MovePip } from './MovePip'
import { FaceBadge } from './FaceBadge'

/** Which reading of the card to show: introspective (self) or for-others (campaign). */
export type CardSubject = 'self' | 'campaign'

function cardRootStyle(card: MoveCard, extra?: CSSProperties): CSSProperties {
  const t = themeForMove(card.move)
  return {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    border: `2px solid ${DECK_GOLD}`,
    background: `radial-gradient(120% 90% at 78% 8%, ${t.gradFrom}, ${t.gradTo} 64%)`,
    boxShadow: `${INSET_TOP}, 0 0 26px 1px color-mix(in srgb, ${t.glow} 38%, transparent), 0 18px 40px -20px rgba(0,0,0,.9)`,
    color: SURFACE_TOKENS.textPrimary,
    ...extra,
  }
}

const labelStyle: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: SURFACE_TOKENS.textSecondary,
}

/**
 * The Allyship Deck card — element-tinted body, gold edge, move pip + face badge.
 *
 * - `variant="grid"` — a compact, clickable tile for Browse / the gallery.
 * - `variant="full"` — the detail card: banner → marks → ◇ domain → the question →
 *   "The practice" well → foot. Pass `footerSlot` (e.g. a Send-to-BARS button) to extend it.
 *
 * Presentational only — no data fetching, no client hooks. Drive `subject` from the parent.
 * @see .specify/specs/allyship-deck-experience/spec.md
 */
export function AllyshipCard({
  card,
  variant = 'grid',
  subject = 'self',
  onClick,
  footerSlot,
}: {
  card: MoveCard
  variant?: 'grid' | 'full'
  subject?: CardSubject
  onClick?: () => void
  footerSlot?: ReactNode
}) {
  const question = subject === 'campaign' ? card.campaignQuestion : card.primaryQuestion
  const t = themeForMove(card.move)

  if (variant === 'grid') {
    return (
      <button
        type="button"
        onClick={onClick}
        style={cardRootStyle(card, {
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 186,
          padding: 14,
          textAlign: 'left',
          cursor: onClick ? 'pointer' : 'default',
          width: '100%',
        })}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <MovePip move={card.move} size={28} />
          <FaceBadge operation={card.operation} size={26} />
        </div>
        <div style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 16, color: '#fff', lineHeight: 1.15 }}>
          {card.title}
        </div>
        <div style={{ ...labelStyle, color: t.gem }}>◇ {DOMAIN_LABELS[card.domain]}</div>
        <div
          style={{
            fontFamily: DECK_FONTS.body,
            fontSize: 12.5,
            color: SURFACE_TOKENS.textSecondary,
            lineHeight: 1.45,
            marginTop: 'auto',
          }}
        >
          {question.length > 92 ? `${question.slice(0, 92)}…` : question}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ ...labelStyle, fontSize: 9 }}>#{card.num}</span>
          {footerSlot}
        </div>
      </button>
    )
  }

  // full
  return (
    <article style={cardRootStyle(card, { padding: '20px 22px 18px' })}>
      <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 24, color: '#fff', margin: 0, lineHeight: 1.15 }}>
        {card.title}
      </h2>

      {/* marks row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginTop: 14 }}>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <MovePip move={card.move} size={34} />
          <span style={{ ...labelStyle, color: t.gem }}>{MOVE_LABELS[card.move]}</span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <FaceBadge operation={card.operation} size={36} />
          <span style={labelStyle}>{OPERATION_LABELS[card.operation]}</span>
        </span>
        <span style={{ marginLeft: 'auto', ...labelStyle, color: t.gem, alignSelf: 'center' }}>
          ◇ {DOMAIN_LABELS[card.domain]}
        </span>
      </div>

      {/* the question */}
      <p
        style={{
          fontFamily: DECK_FONTS.body,
          fontStyle: 'italic',
          fontSize: 18,
          color: '#e7c98a',
          lineHeight: 1.45,
          margin: '16px 0 0',
        }}
      >
        {question}
      </p>

      {/* the practice well */}
      <div
        style={{
          marginTop: 16,
          padding: '13px 15px',
          borderRadius: 8,
          background: SURFACE_TOKENS.surfaceInset,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,.4)',
        }}
      >
        <div style={{ ...labelStyle, color: SURFACE_TOKENS.textMuted }}>The practice</div>
        <div style={{ fontFamily: DECK_FONTS.body, fontSize: 14.5, color: '#fff', marginTop: 3, lineHeight: 1.5 }}>
          {card.remediation}
        </div>
      </div>

      {card.flavor && (
        <p
          style={{
            fontFamily: DECK_FONTS.body,
            fontStyle: 'italic',
            fontSize: 13.5,
            color: SURFACE_TOKENS.textSecondary,
            margin: '14px 0 0',
          }}
        >
          {card.flavor}
        </p>
      )}

      {/* foot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 10, color: SURFACE_TOKENS.textMuted, letterSpacing: '0.08em' }}>
          #{card.num}
        </span>
        <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 12, color: DECK_GOLD }}>
          → {card.outputBar} ♦
        </span>
      </div>
      {/* reward/minutes: omitted until BAR layer provides real values */}
      {/* restore when wired: {card.minutes} MIN · #{card.num}   ♦ {card.reward} */}

      {footerSlot}
    </article>
  )
}
