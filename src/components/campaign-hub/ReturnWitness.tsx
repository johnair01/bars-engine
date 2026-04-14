'use client'

/**
 * ReturnWitness — Hub return-ritual receipt card.
 *
 * Renders the full build receipt (face + emotional vector + narrative template)
 * from a CompletedBuildReceipt passed as props. Zero data-fetching logic —
 * the hub ledger is self-contained.
 *
 * Visual anatomy (top → bottom):
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │  [face badge]  Game Master face sigil + label               │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  [emotional vector]  channelFrom:altitude → channelTo:alt   │
 *   │  [move family badge]  Transcend | Translate                 │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  [narrative template]  templateKind / templateKey            │
 *   │  [charge text]  player's intention statement                │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  [BAR summaries]  inline bar titles + vibeulons             │
 *   │  [total vibeulons]  sum earned                              │
 *   ├──────────────────────────────────────────────────────────────┤
 *   │  [timestamp]  completed at                                  │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * Three-channel encoding (UI_COVENANT.md):
 *   Element → derived from emotional vector's channelTo (target channel)
 *   Altitude → derived from emotional vector's altitudeTo (target altitude)
 *   Stage → 'growing' (receipt is a completed, living artifact)
 *
 * AI: Do NOT hardcode hex values. All colors flow through ELEMENT_TOKENS
 *     and CSS custom properties injected by CultivationCard.
 *     Read UI_COVENANT.md and card-tokens.ts before modifying.
 *
 * @see CompletedBuildReceipt in src/lib/campaign-hub/types.ts — data shape
 * @see CyoaBuild in src/lib/cyoa-build/types.ts — canonical build receipt
 * @see GscpProgressBundle — pattern ancestor for immutable receipts
 */

import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, SURFACE_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'
import type { EmotionalVector, EmotionalChannel } from '@/lib/quest-grammar/types'
import type { CompletedBuildReceipt, CompletedBuildBarSummary } from '@/lib/campaign-hub/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import { NarrativeTemplatePreview as NarrativeTemplatePreviewComponent } from '@/components/narrative-template/NarrativeTemplatePreview'
import { buildPreviewFromReceipt } from '@/lib/narrative-template/preview'

// ---------------------------------------------------------------------------
// Channel → Element mapping (canonical, matches wuxing.ts ontology)
// ---------------------------------------------------------------------------

const CHANNEL_TO_ELEMENT: Record<string, ElementKey> = {
  Anger:      'fire',
  Joy:        'wood',
  Neutrality: 'earth',
  Fear:       'metal',
  Sadness:    'water',
}

// ---------------------------------------------------------------------------
// BAR type display labels
// ---------------------------------------------------------------------------

const BAR_TYPE_LABEL: Record<string, string> = {
  vibe:    'Vibe',
  story:   'Story',
  insight: 'Insight',
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

/** Derive the move family from an emotional vector (same logic as quest-grammar). */
function deriveMoveFamily(ev: EmotionalVector): 'Transcend' | 'Translate' {
  return ev.channelFrom === ev.channelTo ? 'Transcend' : 'Translate'
}

/** Format ISO 8601 timestamp for display. */
function formatCompletedAt(iso: string): string {
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

// ---------------------------------------------------------------------------
// Sub-components (pure, no data fetching)
// ---------------------------------------------------------------------------

/** Face badge — displays Game Master face sigil + label + role. */
function FaceBadge({ face }: { face: GameMasterFace }) {
  const meta = FACE_META[face]
  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-lg font-bold ${meta.color}`}
        aria-hidden="true"
      >
        ◆
      </span>
      <div>
        <span className={`text-sm font-semibold ${meta.color}`}>
          {meta.label}
        </span>
        <span
          className="ml-2 text-xs"
          style={{ color: SURFACE_TOKENS.textSecondary }}
        >
          {meta.role}
        </span>
      </div>
    </div>
  )
}

/** Emotional vector display — from:altitude → to:altitude with element sigils. */
function EmotionalVectorDisplay({ vector }: { vector: EmotionalVector }) {
  const fromEl = channelToElement(vector.channelFrom)
  const toEl = channelToElement(vector.channelTo)
  const fromToken = ELEMENT_TOKENS[fromEl]
  const toToken = ELEMENT_TOKENS[toEl]
  const moveFamily = deriveMoveFamily(vector)

  return (
    <div className="space-y-1">
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
          →
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
            ? 'rgba(139, 92, 246, 0.2)'  // purple tint for Transcend
            : 'rgba(20, 184, 166, 0.2)',  // teal tint for Translate
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

/**
 * ReceiptTemplatePreview — renders the NarrativeTemplatePreview component
 * wired to the build receipt's template data with resolved Wuxing palette.
 *
 * Self-contained: builds preview data from receipt fields alone (no DB queries).
 * The card is always sealed (immutable receipt) and in 'seed' stage (compact).
 */
function ReceiptTemplatePreview({ receipt }: { receipt: CompletedBuildReceipt }) {
  const preview = buildPreviewFromReceipt(receipt)

  return (
    <div className="space-y-0.5">
      <div
        className="text-xs uppercase tracking-wider mb-1.5"
        style={{ color: SURFACE_TOKENS.textMuted }}
      >
        Template
      </div>
      <NarrativeTemplatePreviewComponent
        preview={preview}
        stage="seed"
        sealed
        selected={false}
        animate={false}
        className="w-full"
      />
    </div>
  )
}

/** Charge text — the player's intention statement. */
function ChargeText({ text }: { text: string }) {
  if (!text) return null
  return (
    <blockquote
      className="border-l-2 pl-3 text-sm italic"
      style={{
        borderColor: 'rgba(255,255,255,0.15)',
        color: SURFACE_TOKENS.textSecondary,
      }}
    >
      &ldquo;{text}&rdquo;
    </blockquote>
  )
}

/** BAR summary row — title, type badge, vibeulons. */
function BarSummaryRow({ bar }: { bar: CompletedBuildBarSummary }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span
          className="inline-block rounded px-1.5 py-0.5 text-xs"
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: SURFACE_TOKENS.textSecondary,
          }}
        >
          {BAR_TYPE_LABEL[bar.type] ?? bar.type}
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
  )
}

/** BAR summaries list + total vibeulons. */
function BarSummaries({
  bars,
  totalVibeulons,
}: {
  bars: CompletedBuildBarSummary[]
  totalVibeulons: number
}) {
  if (bars.length === 0 && totalVibeulons === 0) return null

  return (
    <div className="space-y-1.5">
      <div
        className="text-xs uppercase tracking-wider"
        style={{ color: SURFACE_TOKENS.textMuted }}
      >
        BARs Earned
      </div>
      {bars.map((bar) => (
        <BarSummaryRow key={bar.barId} bar={bar} />
      ))}
      {totalVibeulons > 0 && (
        <div
          className="flex justify-end pt-1 text-sm font-semibold"
          style={{ color: SURFACE_TOKENS.textPrimary }}
        >
          Total: {totalVibeulons} ✦
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReturnWitness — Main Component
// ---------------------------------------------------------------------------

export interface ReturnWitnessProps {
  /** The completed build receipt — self-contained, no fan-out queries needed. */
  receipt: CompletedBuildReceipt

  /**
   * Optional: override the CultivationCard element channel.
   * Defaults to the emotional vector's target channel (channelTo).
   */
  element?: ElementKey

  /** Additional CSS classes for layout only. */
  className?: string

  /** Whether to show the sealed (non-interactive) visual treatment. */
  sealed?: boolean

  /** Whether to apply entry animation. */
  animated?: boolean
}

/**
 * ReturnWitness — renders a full build receipt from the hub's completedBuilds ledger.
 *
 * This is a pure display component: it receives a CompletedBuildReceipt as props
 * and renders face, emotional vector, narrative template, charge text, BAR summaries,
 * and timestamp. No data fetching, no server actions, no hooks that query state.
 *
 * The hub is the self-contained ledger — ReturnWitness reads only from props.
 */
export function ReturnWitness({
  receipt,
  element,
  className,
  sealed = false,
  animated = false,
}: ReturnWitnessProps) {
  // Derive element from the emotional vector's target channel (channelTo)
  // unless explicitly overridden via the element prop.
  const resolvedElement: ElementKey =
    element ?? channelToElement(receipt.emotionalVector.channelTo)

  // Altitude derives from the target altitude (altitudeTo) — the "arrived" state.
  const resolvedAltitude: AlchemyAltitude = receipt.emotionalVector.altitudeTo

  return (
    <CultivationCard
      element={resolvedElement}
      altitude={resolvedAltitude}
      stage="growing"
      sealed={sealed}
      animated={animated}
      className={className}
      aria-label={`Build receipt: ${FACE_META[receipt.face].label} face, spoke ${receipt.spokeIndex}`}
    >
      <div className="space-y-3 p-4">
        {/* ── Section 1: Face Badge ──────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <FaceBadge face={receipt.face} />
          <span
            className="text-xs tabular-nums"
            style={{ color: SURFACE_TOKENS.textMuted }}
          >
            Spoke {receipt.spokeIndex + 1}
          </span>
        </div>

        {/* ── Divider ────────────────────────────────────────────────── */}
        <hr
          className="border-0"
          style={{
            height: '1px',
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />

        {/* ── Section 2: Emotional Vector ────────────────────────────── */}
        <EmotionalVectorDisplay vector={receipt.emotionalVector} />

        {/* ── Section 3: Narrative Template (rich preview with Wuxing palette) ── */}
        <ReceiptTemplatePreview receipt={receipt} />

        {/* ── Section 4: Charge Text ─────────────────────────────────── */}
        <ChargeText text={receipt.chargeText} />

        {/* ── Divider ────────────────────────────────────────────────── */}
        {(receipt.barSummaries.length > 0 || receipt.totalVibeulons > 0) && (
          <hr
            className="border-0"
            style={{
              height: '1px',
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />
        )}

        {/* ── Section 5: BAR Summaries ───────────────────────────────── */}
        <BarSummaries
          bars={receipt.barSummaries}
          totalVibeulons={receipt.totalVibeulons}
        />

        {/* ── Section 6: Timestamp ───────────────────────────────────── */}
        <div
          className="text-right text-xs"
          style={{ color: SURFACE_TOKENS.textMuted }}
        >
          {formatCompletedAt(receipt.completedAt)}
        </div>
      </div>
    </CultivationCard>
  )
}

// ---------------------------------------------------------------------------
// ReturnWitnessList — renders multiple receipts (hub ledger echo)
// ---------------------------------------------------------------------------

export interface ReturnWitnessListProps {
  /** Array of completed build receipts from the hub's completedBuilds ledger. */
  receipts: CompletedBuildReceipt[]

  /** Additional CSS classes for the list container layout. */
  className?: string

  /** Whether individual cards should be sealed (non-interactive). */
  sealed?: boolean

  /** Whether individual cards should animate on entry. */
  animated?: boolean
}

/**
 * ReturnWitnessList — renders the full hub ledger as a list of ReturnWitness cards.
 *
 * Self-contained: receives the completedBuilds array directly, no fan-out queries.
 * Renders each receipt sorted by spokeIndex (ascending).
 */
export function ReturnWitnessList({
  receipts,
  className,
  sealed = false,
  animated = false,
}: ReturnWitnessListProps) {
  if (receipts.length === 0) {
    return (
      <div
        className="py-8 text-center text-sm"
        style={{ color: SURFACE_TOKENS.textMuted }}
      >
        No completed builds yet.
      </div>
    )
  }

  // Sort by spokeIndex ascending for consistent display
  const sorted = [...receipts].sort((a, b) => a.spokeIndex - b.spokeIndex)

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {sorted.map((receipt) => (
        <ReturnWitness
          key={receipt.buildId}
          receipt={receipt}
          sealed={sealed}
          animated={animated}
        />
      ))}
    </div>
  )
}
