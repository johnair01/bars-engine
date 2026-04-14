'use client'

/**
 * ReturnWitnessCard — Ceremony-styled wrapper for the ReturnWitness component.
 *
 * Composes three ceremony layers:
 *   1. CompletionGlow — optional flash + sustained glow on completion
 *   2. CultivationCard — three-channel card primitive (element/altitude/stage)
 *   3. Witness shimmer — one-time entry sweep overlay
 *   4. Receipt stamp — rotated "WITNESSED" finality overlay
 *
 * This component is the hub ledger's visual representation of a completed
 * build receipt. It layers ceremony effects onto the base ReturnWitness
 * display component.
 *
 * Three-channel encoding (UI_COVENANT.md):
 *   Element  -> from receipt's emotional vector channelTo (target channel)
 *   Altitude -> from receipt's emotional vector altitudeTo (target altitude)
 *   Stage    -> 'growing' (completed receipt = living artifact)
 *
 * All ceremony effects are CSS-class-driven (cultivation-cards.css).
 * No hardcoded hex values — everything flows through card-tokens.ts.
 *
 * @see ReturnWitness — base receipt display component
 * @see CompletionGlow — glow wrapper
 * @see cultivation-cards.css — ceremony-witness-shimmer, ceremony-receipt-stamp
 * @see CompletedBuildReceipt — data shape from campaign-hub/types.ts
 */

import { type CSSProperties } from 'react'
import {
  elementCssVars,
  altitudeCssVars,
  ELEMENT_TOKENS,
  SURFACE_TOKENS,
  type ElementKey,
} from '@/lib/ui/card-tokens'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector, EmotionalChannel } from '@/lib/quest-grammar/types'
import type { CompletedBuildReceipt } from '@/lib/campaign-hub/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'

// ---------------------------------------------------------------------------
// Channel -> Element mapping (canonical, matches wuxing.ts ontology)
// ---------------------------------------------------------------------------

const CHANNEL_TO_ELEMENT: Record<string, ElementKey> = {
  Anger:      'fire',
  Joy:        'wood',
  Neutrality: 'earth',
  Fear:       'metal',
  Sadness:    'water',
}

/** Resolve the wuxing element for an emotional channel. Falls back to earth. */
function channelToElement(channel: EmotionalChannel | string): ElementKey {
  return CHANNEL_TO_ELEMENT[channel] ?? 'earth'
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReturnWitnessCardProps {
  /** The completed build receipt — self-contained, no fan-out queries. */
  receipt: CompletedBuildReceipt

  /**
   * Override the card element channel.
   * Defaults to the emotional vector's target channel (channelTo).
   */
  element?: ElementKey

  /**
   * Whether to show the completion glow ceremony effect.
   * Fires the flash animation on mount, then settles.
   * Use for freshly completed receipts.
   */
  showCompletionGlow?: boolean

  /**
   * Whether to show the witness shimmer sweep on entry.
   * One-time element-colored shimmer across the card.
   */
  showShimmer?: boolean

  /**
   * Whether to show the "WITNESSED" stamp overlay.
   * Rotated, low-opacity finality seal on the card.
   */
  showStamp?: boolean

  /**
   * Whether to show the gem pulse indicator.
   * Small pulsing element-colored dot at top-right.
   */
  showGemPulse?: boolean

  /** Additional CSS classes for layout only. */
  className?: string
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Face badge with sigil — ceremony-styled version. */
function CeremonyFaceBadge({
  face,
  element,
}: {
  face: GameMasterFace
  element: ElementKey
}) {
  const meta = FACE_META[face]
  const token = ELEMENT_TOKENS[element]

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="ceremony-face-sigil"
        style={{
          '--element-frame': token.cssVarColor,
          color: token.cssVarColor,
        } as CSSProperties}
        aria-hidden="true"
      >
        {token.sigil}
      </div>
      <div className="flex flex-col">
        <span
          className={`text-sm font-semibold ${meta.color}`}
        >
          {meta.label}
        </span>
        <span
          className="text-xs"
          style={{ color: SURFACE_TOKENS.textMuted }}
        >
          {meta.role}
        </span>
      </div>
    </div>
  )
}

/** Emotional vector display — compact ceremony version. */
function CeremonyVectorDisplay({ vector }: { vector: EmotionalVector }) {
  const fromEl = channelToElement(vector.channelFrom)
  const toEl = channelToElement(vector.channelTo)
  const fromToken = ELEMENT_TOKENS[fromEl]
  const toToken = ELEMENT_TOKENS[toEl]
  const moveFamily = vector.channelFrom === vector.channelTo ? 'Transcend' : 'Translate'

  return (
    <div className="flex items-center gap-2 text-sm">
      <span style={{ color: fromToken.cssVarColor }} className="font-medium">
        {fromToken.sigil} {vector.channelFrom}
      </span>
      <span style={{ color: SURFACE_TOKENS.textMuted }} className="text-xs">
        →
      </span>
      <span style={{ color: toToken.cssVarColor }} className="font-medium">
        {toToken.sigil} {vector.channelTo}
      </span>
      <span
        className="ml-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: moveFamily === 'Transcend'
            ? 'rgba(139, 92, 246, 0.2)'
            : 'rgba(20, 184, 166, 0.2)',
          color: moveFamily === 'Transcend' ? '#a78bfa' : '#5eead4',
        }}
      >
        {moveFamily}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ReturnWitnessCard — ceremony-styled receipt card for the hub ledger.
 *
 * Layers ceremony effects (glow, shimmer, stamp, gem pulse) onto the
 * receipt data. Pure display component — receives CompletedBuildReceipt
 * as props, no data fetching.
 *
 * Usage:
 * ```tsx
 * <ReturnWitnessCard
 *   receipt={receipt}
 *   showCompletionGlow
 *   showShimmer
 *   showStamp
 * />
 * ```
 */
export function ReturnWitnessCard({
  receipt,
  element,
  showCompletionGlow = false,
  showShimmer = false,
  showStamp = false,
  showGemPulse = false,
  className,
}: ReturnWitnessCardProps) {
  const resolvedElement: ElementKey =
    element ?? channelToElement(receipt.emotionalVector.channelTo)
  const resolvedAltitude: AlchemyAltitude = receipt.emotionalVector.altitudeTo

  const token = ELEMENT_TOKENS[resolvedElement]

  // CSS vars for ceremony effects
  const cssVars: CSSProperties = {
    ...elementCssVars(resolvedElement),
    ...altitudeCssVars(resolvedAltitude),
    '--grad-from': token.gradFrom,
    '--grad-to': token.gradTo,
  } as CSSProperties

  // Assemble card classes
  const cardClasses = [
    'cultivation-card',
    showCompletionGlow && 'ceremony-completion-glow',
    'cultivation-card-enter',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Content wrapper classes
  const contentClasses = [
    'ceremony-witness-card',
    showShimmer && 'ceremony-witness-shimmer',
  ]
    .filter(Boolean)
    .join(' ')

  /** Format ISO 8601 timestamp for display. */
  function formatDate(iso: string): string {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  return (
    <div
      className={`relative ${cardClasses}`}
      style={cssVars}
      aria-label={`Build receipt: ${FACE_META[receipt.face].label} face, spoke ${receipt.spokeIndex + 1}`}
    >
      {/* Decorative background layers */}
      <div className="card-frame-gradient" aria-hidden="true" />
      <div className="card-corner-glow" aria-hidden="true" />

      {/* Content layer */}
      <div className={`relative z-10 ${contentClasses}`}>
        <div className="space-y-3 p-4">
          {/* Section 1: Face + Spoke Index */}
          <div className="flex items-center justify-between">
            <CeremonyFaceBadge face={receipt.face} element={resolvedElement} />
            <div className="flex items-center gap-2">
              {showGemPulse && (
                <span
                  className="ceremony-gem-pulse"
                  style={cssVars}
                  aria-hidden="true"
                />
              )}
              <span
                className="text-xs tabular-nums"
                style={{ color: SURFACE_TOKENS.textMuted }}
              >
                Spoke {receipt.spokeIndex + 1}
              </span>
            </div>
          </div>

          {/* Divider */}
          <hr className="ceremony-witness-divider" />

          {/* Section 2: Emotional Vector */}
          <CeremonyVectorDisplay vector={receipt.emotionalVector} />

          {/* Section 3: Narrative Template */}
          <div className="space-y-0.5">
            <div
              className="text-xs uppercase tracking-wider"
              style={{ color: SURFACE_TOKENS.textMuted }}
            >
              Template
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-block rounded px-1.5 py-0.5 text-xs"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: SURFACE_TOKENS.textSecondary,
                }}
              >
                {receipt.templateKind}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: SURFACE_TOKENS.textPrimary }}
              >
                {receipt.templateKey}
              </span>
            </div>
          </div>

          {/* Section 4: Charge Text */}
          {receipt.chargeText && (
            <blockquote
              className="border-l-2 pl-3 text-sm italic"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: SURFACE_TOKENS.textSecondary,
              }}
            >
              &ldquo;{receipt.chargeText}&rdquo;
            </blockquote>
          )}

          {/* Divider (before BARs) */}
          {(receipt.barSummaries.length > 0 || receipt.totalVibeulons > 0) && (
            <hr className="ceremony-witness-divider" />
          )}

          {/* Section 5: BAR Summaries */}
          {receipt.barSummaries.length > 0 && (
            <div className="space-y-1.5">
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: SURFACE_TOKENS.textMuted }}
              >
                BARs Earned
              </div>
              {receipt.barSummaries.map((bar) => (
                <div
                  key={bar.barId}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 text-xs"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: SURFACE_TOKENS.textSecondary,
                      }}
                    >
                      {bar.type}
                    </span>
                    <span style={{ color: SURFACE_TOKENS.textPrimary }}>
                      {bar.title}
                    </span>
                  </div>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: SURFACE_TOKENS.textSecondary }}
                  >
                    {bar.vibeulons} ✦
                  </span>
                </div>
              ))}
              {receipt.totalVibeulons > 0 && (
                <div
                  className="flex justify-end pt-1 text-sm font-semibold"
                  style={{ color: SURFACE_TOKENS.textPrimary }}
                >
                  Total: {receipt.totalVibeulons} ✦
                </div>
              )}
            </div>
          )}

          {/* Section 6: Timestamp */}
          <div
            className="text-right text-xs"
            style={{ color: SURFACE_TOKENS.textMuted }}
          >
            {formatDate(receipt.completedAt)}
          </div>
        </div>

        {/* Receipt Stamp overlay */}
        {showStamp && (
          <div
            className="ceremony-receipt-stamp"
            style={cssVars}
            aria-hidden="true"
          >
            Witnessed
          </div>
        )}
      </div>
    </div>
  )
}
