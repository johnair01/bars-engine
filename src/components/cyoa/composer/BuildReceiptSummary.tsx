'use client'

/**
 * BuildReceiptSummary — Formatted build receipt echo for the CYOA Composer.
 *
 * Pure display component that renders a CyoaBuild receipt's core fields:
 *   face + emotional vector + narrative template selection
 * as a formatted, immutable receipt card.
 *
 * Used in two contexts:
 *   1. Composer confirmation step — preview of the build before freezing
 *   2. Hub ledger echo — full receipt rendered from CampaignHubStateV1
 *
 * Visual anatomy (top -> bottom):
 *   +-------------------------------------------------------------+
 *   |  [receipt header]  "Build Receipt" + blueprint key           |
 *   +-------------------------------------------------------------+
 *   |  [face badge]  Game Master face sigil + label + role         |
 *   +-------------------------------------------------------------+
 *   |  [emotional vector]  channel:altitude -> channel:altitude    |
 *   |  [move family badge]  Transcend | Translate                  |
 *   +-------------------------------------------------------------+
 *   |  [narrative template]  template key + WAVE move spine        |
 *   +-------------------------------------------------------------+
 *   |  [campaign context]  spoke index + kotter stage + instance   |
 *   +-------------------------------------------------------------+
 *   |  [timestamp]  created at                                     |
 *   +-------------------------------------------------------------+
 *
 * Three-channel encoding (UI_COVENANT.md):
 *   Element  -> derived from emotional vector's channelTo (target channel)
 *   Altitude -> derived from emotional vector's altitudeTo (target altitude)
 *   Stage    -> 'growing' (receipt is a completed, living artifact)
 *
 * AI: Do NOT hardcode hex values. All colors flow through ELEMENT_TOKENS
 *     and CSS custom properties injected by CultivationCard.
 *     Read UI_COVENANT.md and card-tokens.ts before modifying.
 *
 * @see CyoaBuild in src/lib/cyoa-build/types.ts — canonical build receipt
 * @see CyoaBuildDraft in src/lib/cyoa-build/types.ts — draft preview shape
 * @see ReturnWitness — hub-facing receipt display (uses CompletedBuildReceipt)
 * @see ReturnWitnessCard — ceremony-styled variant
 * @see CultivationCard — three-channel card primitive
 * @see GscpProgressBundle — pattern ancestor for immutable receipts
 */

import { type CSSProperties } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import {
  ELEMENT_TOKENS,
  SURFACE_TOKENS,
  elementCssVars,
  altitudeCssVars,
  type ElementKey,
} from '@/lib/ui/card-tokens'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector, EmotionalChannel, PersonalMoveType } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import type { CyoaBuild, CyoaBuildDraft } from '@/lib/cyoa-build/types'

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

// ---------------------------------------------------------------------------
// WAVE move display labels
// ---------------------------------------------------------------------------

const WAVE_MOVE_LABEL: Record<PersonalMoveType, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)
}

/** Resolve the wuxing element for an emotional channel. Falls back to earth. */
function channelToElement(channel: EmotionalChannel | string): ElementKey {
  return CHANNEL_TO_ELEMENT[channel] ?? 'earth'
}

/** Derive the move family from an emotional vector. */
function deriveMoveFamily(ev: EmotionalVector): 'Transcend' | 'Translate' {
  return ev.channelFrom === ev.channelTo ? 'Transcend' : 'Translate'
}

/** Format ISO 8601 timestamp for display. */
function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

// ---------------------------------------------------------------------------
// Normalized receipt shape — supports both CyoaBuild and CyoaBuildDraft
// ---------------------------------------------------------------------------

/**
 * Internal normalized shape for the receipt display.
 * Allows the component to render both frozen CyoaBuilds and
 * in-progress CyoaBuildDrafts by normalizing to a common shape.
 */
interface NormalizedReceipt {
  face: GameMasterFace | null
  emotionalVector: EmotionalVector | null
  waveMoveSpine: { primary: PersonalMoveType | null; sequence: PersonalMoveType[] } | null
  narrativeTemplateKey: string | null
  blueprintKey: string | null
  campaignSnapshot: {
    spokeIndex: number
    kotterStage: number
    instanceName: string
  } | null
  createdAt: string | null
}

/** Normalize a frozen CyoaBuild into the display shape. */
function normalizeBuild(build: CyoaBuild): NormalizedReceipt {
  return {
    face: build.face,
    emotionalVector: build.emotionalVector,
    waveMoveSpine: {
      primary: build.waveMoveSpine.primary,
      sequence: [...build.waveMoveSpine.sequence],
    },
    narrativeTemplateKey: build.narrativeTemplateKey,
    blueprintKey: build.blueprintKey,
    campaignSnapshot: {
      spokeIndex: build.campaignSnapshot.spokeIndex,
      kotterStage: build.campaignSnapshot.kotterStage,
      instanceName: build.campaignSnapshot.instanceName,
    },
    createdAt: build.createdAt,
  }
}

/** Normalize a draft into the display shape (partial fields become null). */
function normalizeDraft(draft: CyoaBuildDraft): NormalizedReceipt {
  return {
    face: draft.face ?? null,
    emotionalVector: draft.emotionalVector ?? null,
    waveMoveSpine: draft.waveMoveSpine
      ? {
          primary: draft.waveMoveSpine.primary ?? null,
          sequence: draft.waveMoveSpine.sequence ?? [],
        }
      : null,
    narrativeTemplateKey: draft.narrativeTemplateKey ?? null,
    blueprintKey: null,
    campaignSnapshot: draft.campaignSnapshot
      ? {
          spokeIndex: draft.campaignSnapshot.spokeIndex,
          kotterStage: draft.campaignSnapshot.kotterStage,
          instanceName: draft.campaignSnapshot.instanceName,
        }
      : null,
    createdAt: draft.savedAt ?? null,
  }
}

// ---------------------------------------------------------------------------
// Sub-components (pure, no data fetching)
// ---------------------------------------------------------------------------

/** Receipt header — "Build Receipt" label + blueprint key. */
function ReceiptHeader({
  blueprintKey,
  element,
}: {
  blueprintKey: string | null
  element: ElementKey
}) {
  const token = ELEMENT_TOKENS[element]

  return (
    <div className="flex items-center justify-between">
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: token.cssVarColor }}
      >
        Build Receipt
      </span>
      {blueprintKey && (
        <span
          className="rounded px-1.5 py-0.5 text-xs tabular-nums"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            color: SURFACE_TOKENS.textMuted,
          }}
        >
          {blueprintKey}
        </span>
      )}
    </div>
  )
}

/** Face badge — Game Master face sigil + label + role. */
function ReceiptFaceBadge({
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
        <span className={`text-sm font-semibold ${meta.color}`}>
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

/** Emotional vector display — from:altitude -> to:altitude with element sigils. */
function ReceiptVectorDisplay({ vector }: { vector: EmotionalVector }) {
  const fromEl = channelToElement(vector.channelFrom)
  const toEl = channelToElement(vector.channelTo)
  const fromToken = ELEMENT_TOKENS[fromEl]
  const toToken = ELEMENT_TOKENS[toEl]
  const moveFamily = deriveMoveFamily(vector)

  return (
    <div className="space-y-1.5">
      <div
        className="text-xs uppercase tracking-wider"
        style={{ color: SURFACE_TOKENS.textMuted }}
      >
        Emotional Vector
      </div>
      <div className="flex items-center gap-2 text-sm">
        {/* From side */}
        <span
          className="font-medium"
          style={{ color: fromToken.cssVarColor }}
        >
          {fromToken.sigil} {vector.channelFrom}
        </span>
        <span
          className="text-xs"
          style={{ color: SURFACE_TOKENS.textMuted }}
        >
          ({capitalize(vector.altitudeFrom)})
        </span>

        {/* Arrow */}
        <span
          className="text-xs"
          style={{ color: SURFACE_TOKENS.textSecondary }}
          aria-label="to"
        >
          {'\u2192'}
        </span>

        {/* To side */}
        <span
          className="font-medium"
          style={{ color: toToken.cssVarColor }}
        >
          {toToken.sigil} {vector.channelTo}
        </span>
        <span
          className="text-xs"
          style={{ color: SURFACE_TOKENS.textMuted }}
        >
          ({capitalize(vector.altitudeTo)})
        </span>
      </div>

      {/* Move family badge */}
      <span
        className="inline-block rounded px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: moveFamily === 'Transcend'
            ? 'rgba(139, 92, 246, 0.2)'
            : 'rgba(20, 184, 166, 0.2)',
          color: moveFamily === 'Transcend'
            ? '#a78bfa'
            : '#5eead4',
        }}
      >
        {moveFamily}
      </span>
    </div>
  )
}

/** Narrative template + WAVE move spine display. */
function ReceiptTemplateDisplay({
  templateKey,
  waveMoveSpine,
}: {
  templateKey: string
  waveMoveSpine: { primary: PersonalMoveType | null; sequence: PersonalMoveType[] } | null
}) {
  return (
    <div className="space-y-2">
      {/* Template key */}
      <div className="space-y-0.5">
        <div
          className="text-xs uppercase tracking-wider"
          style={{ color: SURFACE_TOKENS.textMuted }}
        >
          Narrative Template
        </div>
        <span
          className="text-sm font-medium"
          style={{ color: SURFACE_TOKENS.textPrimary }}
        >
          {templateKey}
        </span>
      </div>

      {/* WAVE move spine */}
      {waveMoveSpine && waveMoveSpine.primary && (
        <div className="space-y-0.5">
          <div
            className="text-xs uppercase tracking-wider"
            style={{ color: SURFACE_TOKENS.textMuted }}
          >
            WAVE Move
          </div>
          <div className="flex items-center gap-2">
            {/* Primary move badge */}
            <span
              className="inline-block rounded px-2 py-0.5 text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: SURFACE_TOKENS.textPrimary,
              }}
            >
              {WAVE_MOVE_LABEL[waveMoveSpine.primary]}
            </span>

            {/* Sequence trail (if more than just primary) */}
            {waveMoveSpine.sequence.length > 1 && (
              <span
                className="text-xs"
                style={{ color: SURFACE_TOKENS.textMuted }}
              >
                {waveMoveSpine.sequence
                  .map((m) => WAVE_MOVE_LABEL[m])
                  .join(' \u2192 ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/** Campaign context row — spoke index, kotter stage, instance name. */
function ReceiptCampaignContext({
  snapshot,
}: {
  snapshot: { spokeIndex: number; kotterStage: number; instanceName: string }
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span style={{ color: SURFACE_TOKENS.textMuted }}>
        Spoke{' '}
        <span
          className="tabular-nums font-medium"
          style={{ color: SURFACE_TOKENS.textSecondary }}
        >
          {snapshot.spokeIndex + 1}
        </span>
      </span>
      <span
        style={{ color: 'rgba(255, 255, 255, 0.15)' }}
        aria-hidden="true"
      >
        |
      </span>
      <span style={{ color: SURFACE_TOKENS.textMuted }}>
        Stage{' '}
        <span
          className="tabular-nums font-medium"
          style={{ color: SURFACE_TOKENS.textSecondary }}
        >
          {snapshot.kotterStage}
        </span>
      </span>
      <span
        style={{ color: 'rgba(255, 255, 255, 0.15)' }}
        aria-hidden="true"
      >
        |
      </span>
      <span
        className="font-medium"
        style={{ color: SURFACE_TOKENS.textSecondary }}
      >
        {snapshot.instanceName}
      </span>
    </div>
  )
}

/**
 * Placeholder for unfilled receipt sections.
 * Shown in draft mode when a field hasn't been filled yet.
 */
function PendingField({ label }: { label: string }) {
  return (
    <div className="space-y-0.5">
      <div
        className="text-xs uppercase tracking-wider"
        style={{ color: SURFACE_TOKENS.textMuted }}
      >
        {label}
      </div>
      <span
        className="text-sm italic"
        style={{ color: SURFACE_TOKENS.textMuted }}
      >
        Pending...
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BuildReceiptSummary — Main Component
// ---------------------------------------------------------------------------

export interface BuildReceiptSummaryProps {
  /**
   * A frozen CyoaBuild receipt.
   * Mutually exclusive with `draft` — provide one or the other.
   */
  build?: CyoaBuild

  /**
   * A mutable CyoaBuildDraft (in-progress).
   * When provided, unfilled fields show "Pending..." placeholders.
   * Mutually exclusive with `build`.
   */
  draft?: CyoaBuildDraft

  /**
   * Override the CultivationCard element channel.
   * Defaults to the emotional vector's target channel (channelTo).
   */
  element?: ElementKey

  /**
   * Visual variant:
   *   - 'full' — all sections visible (confirmation step, hub echo)
   *   - 'compact' — face + vector + template only (inline preview)
   */
  variant?: 'full' | 'compact'

  /**
   * Whether to show the ceremony glow effect.
   * Use when displaying a freshly completed receipt.
   */
  showGlow?: boolean

  /**
   * Whether to show the witness shimmer sweep.
   * One-time entry animation effect.
   */
  showShimmer?: boolean

  /** Whether the card is in a sealed (non-interactive) state. */
  sealed?: boolean

  /** Whether to animate on entry. */
  animated?: boolean

  /** Additional CSS classes for layout only. */
  className?: string
}

/**
 * BuildReceiptSummary — Renders face + emotional vector + narrative template
 * selection as a formatted build receipt echo.
 *
 * Accepts either a frozen CyoaBuild or a mutable CyoaBuildDraft.
 * When given a draft, unfilled fields display graceful "Pending..." placeholders.
 * When given a frozen build, all fields are guaranteed present.
 *
 * This is a pure display component: zero data fetching, zero server actions.
 * All data flows through props — the receipt is self-contained.
 *
 * @example Frozen build (confirmation step)
 * ```tsx
 * <BuildReceiptSummary build={frozenBuild} showGlow animated />
 * ```
 *
 * @example Draft preview (mid-compose)
 * ```tsx
 * <BuildReceiptSummary draft={currentDraft} variant="compact" />
 * ```
 *
 * @example Hub ledger echo
 * ```tsx
 * <BuildReceiptSummary build={ledgerEntry.build} sealed />
 * ```
 */
export function BuildReceiptSummary({
  build,
  draft,
  element,
  variant = 'full',
  showGlow = false,
  showShimmer = false,
  sealed = false,
  animated = false,
  className,
}: BuildReceiptSummaryProps) {
  // Normalize to common shape
  const receipt: NormalizedReceipt = build
    ? normalizeBuild(build)
    : draft
      ? normalizeDraft(draft)
      : {
          face: null,
          emotionalVector: null,
          waveMoveSpine: null,
          narrativeTemplateKey: null,
          blueprintKey: null,
          campaignSnapshot: null,
          createdAt: null,
        }

  // Derive three-channel encoding
  const resolvedElement: ElementKey = element
    ?? (receipt.emotionalVector
      ? channelToElement(receipt.emotionalVector.channelTo)
      : 'earth')

  const resolvedAltitude: AlchemyAltitude = receipt.emotionalVector
    ? receipt.emotionalVector.altitudeTo
    : 'neutral'

  const token = ELEMENT_TOKENS[resolvedElement]

  // CSS vars for ceremony effects
  const cssVars: CSSProperties = {
    ...elementCssVars(resolvedElement),
    ...altitudeCssVars(resolvedAltitude),
    '--grad-from': token.gradFrom,
    '--grad-to': token.gradTo,
  } as CSSProperties

  // Aria label
  const ariaLabel = receipt.face
    ? `Build receipt: ${FACE_META[receipt.face].label} face`
    : 'Build receipt: in progress'

  // Shimmer class
  const contentClasses = [
    'ceremony-witness-card',
    showShimmer && 'ceremony-witness-shimmer',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <CultivationCard
      element={resolvedElement}
      altitude={resolvedAltitude}
      stage="growing"
      sealed={sealed}
      animated={animated}
      className={`${showGlow ? 'ceremony-completion-glow' : ''} ${className ?? ''}`}
      aria-label={ariaLabel}
    >
      <div className={contentClasses} style={cssVars}>
        <div className="space-y-3 p-4">
          {/* -- Section 1: Receipt Header ---------------------------------- */}
          <ReceiptHeader
            blueprintKey={variant === 'full' ? receipt.blueprintKey : null}
            element={resolvedElement}
          />

          {/* -- Divider ----------------------------------------------------- */}
          <hr className="ceremony-witness-divider" />

          {/* -- Section 2: Face Badge -------------------------------------- */}
          {receipt.face ? (
            <ReceiptFaceBadge face={receipt.face} element={resolvedElement} />
          ) : (
            <PendingField label="Game Master Face" />
          )}

          {/* -- Divider ----------------------------------------------------- */}
          <hr className="ceremony-witness-divider" />

          {/* -- Section 3: Emotional Vector -------------------------------- */}
          {receipt.emotionalVector ? (
            <ReceiptVectorDisplay vector={receipt.emotionalVector} />
          ) : (
            <PendingField label="Emotional Vector" />
          )}

          {/* -- Divider ----------------------------------------------------- */}
          <hr className="ceremony-witness-divider" />

          {/* -- Section 4: Narrative Template + WAVE Move ------------------- */}
          {receipt.narrativeTemplateKey ? (
            <ReceiptTemplateDisplay
              templateKey={receipt.narrativeTemplateKey}
              waveMoveSpine={receipt.waveMoveSpine}
            />
          ) : (
            <PendingField label="Narrative Template" />
          )}

          {/* -- Full variant: Campaign Context + Timestamp ----------------- */}
          {variant === 'full' && (
            <>
              {receipt.campaignSnapshot && (
                <>
                  <hr className="ceremony-witness-divider" />
                  <ReceiptCampaignContext snapshot={receipt.campaignSnapshot} />
                </>
              )}

              {receipt.createdAt && (
                <div
                  className="text-right text-xs"
                  style={{ color: SURFACE_TOKENS.textMuted }}
                >
                  {formatTimestamp(receipt.createdAt)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </CultivationCard>
  )
}

// ---------------------------------------------------------------------------
// BuildReceiptSummaryList — renders multiple build receipts
// ---------------------------------------------------------------------------

export interface BuildReceiptSummaryListProps {
  /** Array of frozen CyoaBuild receipts to display. */
  builds: CyoaBuild[]

  /** Visual variant applied to each receipt card. */
  variant?: 'full' | 'compact'

  /** Whether individual cards should be sealed. */
  sealed?: boolean

  /** Whether individual cards should animate on entry. */
  animated?: boolean

  /** Additional CSS classes for the list container. */
  className?: string
}

/**
 * BuildReceiptSummaryList — renders multiple CyoaBuild receipts as
 * a vertical list of BuildReceiptSummary cards.
 *
 * Sorted by campaign snapshot spoke index (ascending) for consistent display.
 * Pure display — receives builds array directly, no fan-out queries.
 */
export function BuildReceiptSummaryList({
  builds,
  variant = 'full',
  sealed = false,
  animated = false,
  className,
}: BuildReceiptSummaryListProps) {
  if (builds.length === 0) {
    return (
      <div
        className="py-8 text-center text-sm"
        style={{ color: SURFACE_TOKENS.textMuted }}
      >
        No build receipts yet.
      </div>
    )
  }

  // Sort by spoke index ascending
  const sorted = [...builds].sort(
    (a, b) => a.campaignSnapshot.spokeIndex - b.campaignSnapshot.spokeIndex,
  )

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {sorted.map((build) => (
        <BuildReceiptSummary
          key={build.id}
          build={build}
          variant={variant}
          sealed={sealed}
          animated={animated}
        />
      ))}
    </div>
  )
}
