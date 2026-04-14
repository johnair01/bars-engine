'use client'

/**
 * ReceiptContainer — Ledger-style wrapper for one or more ReturnWitness cards.
 *
 * Visual anatomy:
 *   ┌───────────────────────────────────────────────────┐
 *   │ [header]  "Completed Builds" + total vibeulons    │
 *   ├───────────────────────────────────────────────────┤
 *   │ [receipt 1]  ReturnWitness card                   │
 *   │ [receipt 2]  ReturnWitness card                   │
 *   │ ...                                               │
 *   └───────────────────────────────────────────────────┘
 *
 * Three-channel encoding (UI_COVENANT.md):
 *   Element  -> left accent bar color (from --element-frame CSS var)
 *   Altitude -> n/a at container level (individual receipts carry their own)
 *   Stage    -> n/a at container level
 *
 * Uses ceremony-receipt-container and ceremony-ledger-header CSS classes
 * from cultivation-cards.css.
 *
 * The container is a pure layout + ceremony styling component — it does NOT
 * fetch data. The hub ledger provides the receipts array as props.
 *
 * AI: Do NOT hardcode hex. Use SURFACE_TOKENS for text colors.
 *     Use ceremony-* CSS classes from cultivation-cards.css for structure.
 *
 * @see cultivation-cards.css — ceremony-receipt-container, ceremony-ledger-header
 * @see ReturnWitness — the card component rendered inside this container
 * @see CampaignHubStateV1 — hub state with completedBuilds ledger
 */

import { type ReactNode, type CSSProperties } from 'react'
import {
  elementCssVars,
  SURFACE_TOKENS,
  type ElementKey,
} from '@/lib/ui/card-tokens'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReceiptContainerProps {
  /**
   * Element for the left accent bar color.
   * When receipts span multiple elements, use 'earth' (neutral/gold)
   * or omit to use the default.
   */
  element?: ElementKey

  /**
   * Header label for the ledger section.
   * Defaults to "Completed Builds".
   */
  headerLabel?: string

  /**
   * Total vibeulons earned — displayed in the header.
   * Pass 0 or omit to hide the vibeulons display.
   */
  totalVibeulons?: number

  /**
   * Number of completed builds — displayed as a count badge.
   * Pass 0 or omit to hide.
   */
  buildCount?: number

  /** Receipt cards or other content to render inside the container. */
  children: ReactNode

  /** Additional CSS classes for layout only. */
  className?: string

  /** Whether the container should animate on entry. */
  animated?: boolean

  /** ARIA label for accessibility. */
  'aria-label'?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ReceiptContainer wraps ReturnWitness cards (or other receipt content)
 * in a ledger-style container with an element-colored left accent bar.
 *
 * Self-contained rendering — receives data via props, no fan-out queries.
 *
 * Usage:
 * ```tsx
 * <ReceiptContainer element="fire" totalVibeulons={420} buildCount={3}>
 *   {receipts.map(r => (
 *     <ReturnWitness key={r.buildId} receipt={r} />
 *   ))}
 * </ReceiptContainer>
 * ```
 */
export function ReceiptContainer({
  element = 'earth',
  headerLabel = 'Completed Builds',
  totalVibeulons = 0,
  buildCount = 0,
  children,
  className,
  animated = false,
  'aria-label': ariaLabel,
}: ReceiptContainerProps) {
  // Inject element CSS vars for the left accent bar (ceremony-receipt-container::before)
  const cssVars: CSSProperties = {
    ...elementCssVars(element),
  } as CSSProperties

  const containerClasses = [
    'ceremony-receipt-container',
    animated && 'cultivation-card-enter',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={containerClasses}
      style={cssVars}
      aria-label={ariaLabel ?? `${headerLabel}: ${buildCount} builds`}
      role="region"
    >
      {/* ── Ledger Header ──────────────────────────────────────────────── */}
      <div className="ceremony-ledger-header">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: SURFACE_TOKENS.textPrimary }}
          >
            {headerLabel}
          </span>
          {buildCount > 0 && (
            <span
              className="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs tabular-nums"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: SURFACE_TOKENS.textSecondary,
              }}
            >
              {buildCount}
            </span>
          )}
        </div>

        {totalVibeulons > 0 && (
          <span
            className="text-sm tabular-nums font-medium"
            style={{ color: SURFACE_TOKENS.textSecondary }}
          >
            {totalVibeulons} ✦
          </span>
        )}
      </div>

      {/* ── Receipt Content ────────────────────────────────────────────── */}
      <div className="p-3 space-y-3">
        {children}
      </div>
    </div>
  )
}
