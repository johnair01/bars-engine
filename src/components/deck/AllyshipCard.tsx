'use client'

import type { ReactNode, CSSProperties } from 'react'
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
  barTermId,
} from '@/lib/allyship-deck/glossary'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { MovePip } from './MovePip'
import { FaceBadge } from './FaceBadge'
import { CardApplications } from './CardApplications'

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

/** Scaffold placeholder used by un-authored generated cards; never shown to players. */
const UNAUTHORED_MARK = '— author —'
const authoredList = (items: string[] | undefined): string[] =>
  (items ?? []).filter((s) => s && s.trim() && s !== UNAUTHORED_MARK)

/** A subdued reference list (Avoid / How it slips) — authored anti-patterns, secondary to the practice. */
function GuardrailList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div style={{ ...labelStyle, color: SURFACE_TOKENS.textMuted }}>{label}</div>
      <ul
        style={{
          margin: '5px 0 0',
          paddingLeft: 18,
          fontFamily: DECK_FONTS.body,
          fontSize: 13.5,
          color: SURFACE_TOKENS.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {items.map((item, i) => (
          <li key={i} style={{ marginTop: i === 0 ? 0 : 3 }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
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
          // Lock the trading-card proportion (5:7) so tiles keep their shape
          // instead of stretching to fill the grid/flex row they sit in.
          aspectRatio: '5 / 7',
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
    <article
      style={cardRootStyle(card, {
        padding: '20px 22px 18px',
        // Same trading-card proportion (5:7) as the card back; longer readings
        // scroll inside the frame instead of stretching it (overflowY overrides
        // the base `overflow: hidden`, which still clips X for the rounded frame).
        aspectRatio: '5 / 7',
        overflowY: 'auto',
      })}
    >
      <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 24, color: '#fff', margin: 0, lineHeight: 1.15 }}>
        {card.title}
      </h2>

      {/* marks row — each term deep-links to its glossary definition */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginTop: 14 }}>
        <Link
          href={glossaryHref(moveTermId(card.move))}
          title={`What is ${MOVE_LABELS[card.move]}?`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none' }}
        >
          <MovePip move={card.move} size={34} />
          <span style={{ ...labelStyle, color: t.gem }}>{MOVE_LABELS[card.move]}</span>
        </Link>
        <Link
          href={glossaryHref(operationTermId(card.operation))}
          title={`What is the ${OPERATION_LABELS[card.operation]} face?`}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, textDecoration: 'none' }}
        >
          <FaceBadge operation={card.operation} size={36} />
          <span style={labelStyle}>{OPERATION_LABELS[card.operation]}</span>
        </Link>
        <Link
          href={glossaryHref(domainTermId(card.domain))}
          title={`What is ${DOMAIN_LABELS[card.domain]}?`}
          style={{ marginLeft: 'auto', ...labelStyle, color: t.gem, alignSelf: 'center', textDecoration: 'none' }}
        >
          ◇ {DOMAIN_LABELS[card.domain]}
        </Link>
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

      {/* your move — the one concrete next step (distinct from the ongoing practice) */}
      {card.action && (
        <div
          style={{
            marginTop: 16,
            padding: '12px 15px',
            borderRadius: 8,
            background: `color-mix(in srgb, ${DECK_GOLD} 9%, ${SURFACE_TOKENS.surfaceInset})`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px color-mix(in srgb, ${DECK_GOLD} 34%, transparent)`,
          }}
        >
          <div style={{ ...labelStyle, color: DECK_GOLD }}>Your move</div>
          <div style={{ fontFamily: DECK_FONTS.body, fontSize: 14.5, color: '#fff', marginTop: 3, lineHeight: 1.5 }}>
            {card.action}
          </div>
        </div>
      )}

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

      {/* guardrails — authored anti-patterns: what to avoid, and how the move commonly slips */}
      {(authoredList(card.forbiddenMoves).length > 0 || authoredList(card.failureModes).length > 0) && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {authoredList(card.forbiddenMoves).length > 0 && (
            <GuardrailList label="Avoid" items={authoredList(card.forbiddenMoves)} />
          )}
          {authoredList(card.failureModes).length > 0 && (
            <GuardrailList label="How it slips" items={authoredList(card.failureModes)} />
          )}
        </div>
      )}

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

      {/* how this shows up in real life — authored applications or deterministic fallback */}
      <CardApplications card={card} subject={subject} />

      {/* foot */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 10, color: SURFACE_TOKENS.textMuted, letterSpacing: '0.08em' }}>
          #{card.num}
        </span>
        <Link
          href={glossaryHref(barTermId(card.outputBar))}
          title={`What is a ${card.outputBar} BAR?`}
          style={{ fontFamily: DECK_FONTS.mono, fontSize: 12, color: DECK_GOLD, textDecoration: 'none' }}
        >
          → {card.outputBar} ♦
        </Link>
      </div>
      {/* reward/minutes: omitted until BAR layer provides real values */}
      {/* restore when wired: {card.minutes} MIN · #{card.num}   ♦ {card.reward} */}

      {footerSlot}
    </article>
  )
}
