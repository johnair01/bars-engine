import Link from 'next/link'
import type { CSSProperties } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import type { ElementKey } from '@/lib/ui/card-tokens'

/**
 * DeckCard — one card in a card-table menu (the reusable "cookie cutter").
 *
 * A tactile CYOA doorway: corner numeral/label, title, optional meta + emoji + chip, an
 * optional wayfinding ribbon, and a draw affordance. Built on the `CultivationCard`
 * primitive so it inherits the player's nation element (unless `element` overrides) plus
 * the covenant's physical-card feel. Whole card is a link.
 *
 * Generic by design — MtGoA spokes today; any menu surface tomorrow.
 * Spec: .specify/specs/mtgoa-menu-skeuomorphic-cyoa/
 */
export interface DeckCardProps {
  /** Big corner numeral/label, e.g. "IV". */
  numeral: string
  title: string
  /** Where drawing the card leads. */
  href: string
  /** Small meta line top-right, e.g. "Kotter 4". */
  meta?: string
  /** Emoji/sigil top-right. */
  emoji?: string
  /** One short chip (e.g. a feeling tag). */
  chip?: string
  /** Wayfinding ribbon. `tintHex` should come from a semantic token (not a hardcoded color). */
  ribbon?: { label: string; tintHex?: string }
  /** Verb shown bottom-right. Defaults to "Draw →". */
  drawLabel?: string
  /** Per-card element override; omit to inherit the player's nation (NationProvider). */
  element?: ElementKey
  ariaLabel?: string
}

export function DeckCard({
  numeral,
  title,
  href,
  meta,
  emoji,
  chip,
  ribbon,
  drawLabel = 'Draw →',
  element,
  ariaLabel,
}: DeckCardProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? `${numeral}. ${title}`}
      className="block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
    >
      <CultivationCard
        element={element}
        altitude="neutral"
        stage="growing"
        animated
        className="h-full"
        aria-label={`${numeral}. ${title}`}
      >
        <div className="flex h-full flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <span
              className="text-3xl font-bold tabular-nums leading-none"
              style={{ color: 'var(--element-gem)' }}
            >
              {numeral}
            </span>
            {(meta || emoji) && (
              <span className="flex items-center gap-1.5 text-zinc-400">
                {meta && <span className="text-[10px] uppercase tracking-wide">{meta}</span>}
                {emoji && (
                  <span className="text-lg" aria-hidden="true">
                    {emoji}
                  </span>
                )}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-zinc-100">{title}</h3>

          {chip && (
            <div>
              <span className="inline-block rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300">
                {chip}
              </span>
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-center justify-between gap-2 pt-1">
            {ribbon ? (
              <span
                className="card-funnel-ribbon text-[11px] font-semibold text-zinc-200"
                style={{ '--ribbon-tint': ribbon.tintHex } as CSSProperties}
              >
                {ribbon.label}
              </span>
            ) : (
              <span />
            )}
            <span className="text-sm font-bold" style={{ color: 'var(--element-gem)' }}>
              {drawLabel}
            </span>
          </div>
        </div>
      </CultivationCard>
    </Link>
  )
}
