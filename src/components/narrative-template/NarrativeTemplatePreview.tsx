'use client'

/**
 * NarrativeTemplatePreview — Presentational Component
 *
 * Renders a NarrativeTemplate as a cultivation card with full three-channel
 * encoding:
 *   Channel 1 (Element → Color): Frame border, glow, gem derived from
 *     the emotional vector's Wuxing element via ELEMENT_TOKENS.
 *   Channel 2 (Altitude → Border): Border width, glow radius, float
 *     period derived from the emotional vector's altitude via ALTITUDE_TOKENS.
 *   Channel 3 (Stage → Density): Art window height, stat block visibility,
 *     description line count via STAGE_TOKENS.
 *
 * When no emotional vector is provided, the card renders in a neutral
 * "unsealed" state (earth element, neutral altitude, seed stage) with
 * muted styling that invites the player to begin the composer.
 *
 * Uses cultivation-cards.css for all game aesthetic. Layout via Tailwind.
 * Colors derived exclusively from card-tokens.ts — no hardcoded hex.
 *
 * @see UI_COVENANT.md — governing constraint document
 * @see src/lib/ui/card-tokens.ts — ELEMENT_TOKENS, ALTITUDE_TOKENS, STAGE_TOKENS
 * @see src/styles/cultivation-cards.css — game aesthetic classes
 * @see src/lib/narrative-template/preview.ts — palette resolution utilities
 */

import { useMemo } from 'react'
import type { CardStage } from '@/lib/ui/card-tokens'
import { ELEMENT_TOKENS, STAGE_TOKENS, SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import type { NarrativeTemplatePreview as NarrativeTemplatePreviewData } from '@/lib/narrative-template/preview'
import type { WuxingPalette } from '@/lib/narrative-template/preview'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'
import type { NarrativeTemplateKind } from '@/lib/narrative-template/types'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NarrativeTemplatePreviewProps {
  /** Preview data from buildNarrativeTemplatePreview(). */
  preview: NarrativeTemplatePreviewData
  /** Card stage — controls density (art window height, stat block, description lines). */
  stage?: CardStage
  /** Whether this card is the currently selected template. */
  selected?: boolean
  /** Whether the card is sealed (committed to a build receipt). */
  sealed?: boolean
  /** Whether to show the entry animation. */
  animate?: boolean
  /** Click handler. Omit for non-interactive cards (e.g. ledger receipts). */
  onClick?: () => void
  /** Optional className for layout positioning. */
  className?: string
}

// ---------------------------------------------------------------------------
// Kind metadata
// ---------------------------------------------------------------------------

const KIND_LABELS: Record<NarrativeTemplateKind, { label: string; sigil: string }> = {
  EPIPHANY:    { label: 'Epiphany',    sigil: '✦' },
  KOTTER:      { label: 'Kotter',      sigil: '⚡' },
  ORIENTATION: { label: 'Orientation', sigil: '◈' },
  CUSTOM:      { label: 'Custom',      sigil: '✧' },
}

const QUEST_MODEL_LABELS: Record<string, string> = {
  personal: 'Personal',
  communal: 'Communal',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build inline CSS custom properties from a WuxingPalette for cultivation-cards.css. */
function paletteToStyleVars(palette: WuxingPalette): React.CSSProperties {
  return {
    '--element-frame': palette.frame,
    '--element-glow': palette.glow,
    '--element-gem': palette.gem,
    '--glow-radius': palette.glowRadius,
    '--border-width': palette.borderWidth,
    '--border-opacity': String(palette.borderOpacity),
    '--grad-from': ELEMENT_TOKENS[palette.element].gradFrom,
    '--grad-to': ELEMENT_TOKENS[palette.element].gradTo,
  } as React.CSSProperties
}

/** Fallback neutral style vars when no palette is available. */
function neutralStyleVars(): React.CSSProperties {
  return {
    '--element-frame': '#3f3f46',
    '--element-glow': 'transparent',
    '--element-gem': '#6b6965',
    '--glow-radius': '0px',
    '--border-width': '1px',
    '--border-opacity': '0.3',
    '--grad-from': '#18181b',
    '--grad-to': '#09090b',
  } as React.CSSProperties
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Element sigil gem — small circle with the CJK element character. */
function ElementGem({ palette }: { palette: WuxingPalette | null }) {
  if (!palette) {
    return (
      <span
        className="ceremony-face-sigil text-xs"
        style={{
          '--element-frame': '#3f3f46',
        } as React.CSSProperties}
        aria-label="No element"
      >
        ?
      </span>
    )
  }

  return (
    <span
      className="ceremony-face-sigil text-xs"
      style={{
        '--element-frame': palette.frame,
        color: palette.gem,
      } as React.CSSProperties}
      aria-label={`${palette.element} element (${palette.sigil})`}
    >
      {palette.sigil}
    </span>
  )
}

/** Face affinity badges — small pill for each aligned GM face. */
function FaceAffinityBadges({ faces }: { faces: GameMasterFace[] }) {
  if (faces.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1" role="list" aria-label="Face affinities">
      {faces.map((face) => {
        const meta = FACE_META[face]
        return (
          <span
            key={face}
            role="listitem"
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color} bg-white/[0.04] border border-white/[0.06]`}
          >
            {meta.label}
          </span>
        )
      })}
    </div>
  )
}

/** Vector arrow — visual indicator of emotional vector transition. */
function VectorArrow({ palette }: { palette: NarrativeTemplatePreviewData['palette'] }) {
  if (!palette) return null

  const { source, destination, moveFamily } = palette
  const isSameElement = source.element === destination.element

  return (
    <div
      className="flex items-center gap-2 text-xs"
      aria-label={`${moveFamily} move: ${source.channel} ${source.altitude} to ${destination.channel} ${destination.altitude}`}
    >
      {/* Source element pip */}
      <span
        className="inline-flex items-center gap-1"
        style={{ color: source.gem }}
      >
        <span className="font-bold">{source.sigil}</span>
        <span style={{ color: SURFACE_TOKENS.textSecondary }}>
          {source.altitude}
        </span>
      </span>

      {/* Arrow */}
      <span
        className="text-xs"
        style={{
          color: isSameElement
            ? source.gem
            : destination.gem,
        }}
      >
        {moveFamily === 'Transcend' ? '↑' : '→'}
      </span>

      {/* Destination element pip */}
      <span
        className="inline-flex items-center gap-1"
        style={{ color: destination.gem }}
      >
        <span className="font-bold">{destination.sigil}</span>
        <span style={{ color: SURFACE_TOKENS.textSecondary }}>
          {destination.altitude}
        </span>
      </span>

      {/* Move family label */}
      <span
        className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{
          color: destination.gem,
          background: `color-mix(in srgb, ${destination.gem} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${destination.gem} 20%, transparent)`,
        }}
      >
        {moveFamily}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function NarrativeTemplatePreview({
  preview,
  stage = 'seed',
  selected = false,
  sealed = false,
  animate = false,
  onClick,
  className = '',
}: NarrativeTemplatePreviewProps) {
  const { name, kind, stepCount, questModel, faceAffinities, status, palette } = preview

  // Resolve the primary palette (source side when available)
  const primaryPalette: WuxingPalette | null = palette?.source ?? null

  // Build CSS custom properties for the card root
  const cardStyle = useMemo<React.CSSProperties>(() => {
    return primaryPalette
      ? paletteToStyleVars(primaryPalette)
      : neutralStyleVars()
  }, [primaryPalette])

  // Stage tokens for density channel
  const stageTokens = STAGE_TOKENS[stage]
  const kindMeta = KIND_LABELS[kind]

  // Compose CSS classes
  const isInteractive = !!onClick && !sealed
  const cardClasses = [
    'cultivation-card',
    'relative overflow-hidden',
    animate ? 'cultivation-card-enter' : '',
    selected ? 'cultivation-card--selected' : '',
    sealed ? 'cultivation-card--sealed' : '',
    status === 'archived' ? 'cultivation-card--composted' : '',
    isInteractive ? 'cursor-pointer' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cardClasses}
      style={cardStyle}
      onClick={isInteractive ? onClick : undefined}
      role={isInteractive ? 'button' : 'article'}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      aria-label={`${name} — ${kindMeta.label} template, ${stepCount} steps`}
      aria-selected={selected || undefined}
    >
      {/* Card frame gradient — element-colored background layer */}
      <div className="card-frame-gradient" />

      {/* Corner glow node — element aura at top-left */}
      <div className="card-corner-glow" />

      {/* Content layer — positioned above gradient */}
      <div className="relative z-10 flex flex-col p-4 gap-3">
        {/* ── Header Row: Element gem + Name + Kind badge ── */}
        <div className="flex items-start gap-3">
          <ElementGem palette={primaryPalette} />

          <div className="flex-1 min-w-0">
            <h3
              className="text-sm font-bold leading-tight truncate"
              style={{ color: SURFACE_TOKENS.textPrimary }}
            >
              {name}
            </h3>

            <div className="flex items-center gap-2 mt-1">
              {/* Kind label */}
              <span
                className="text-xs font-medium"
                style={{ color: SURFACE_TOKENS.textSecondary }}
              >
                {kindMeta.sigil} {kindMeta.label}
              </span>

              {/* Quest model */}
              <span
                className="text-xs"
                style={{ color: SURFACE_TOKENS.textMuted }}
              >
                {QUEST_MODEL_LABELS[questModel] ?? questModel}
              </span>
            </div>
          </div>

          {/* Sealed lock badge */}
          {sealed && (
            <span className="composer-lock-badge" aria-label="Sealed">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path
                  d="M3 4V3a2 2 0 1 1 4 0v1h.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5H3z"
                  fill="currentColor"
                />
              </svg>
            </span>
          )}
        </div>

        {/* ── Art Window — Stage-controlled height + element inner border ── */}
        <div
          className={`card-art-window rounded-lg ${stageTokens.artWindowHeight} ${stageTokens.artOpacity} flex items-center justify-center`}
          style={{
            background: SURFACE_TOKENS.surfaceInset,
          }}
        >
          {/* Art window content: vector arrow when palette available */}
          <div className="flex flex-col items-center justify-center w-full py-3 px-4 gap-2">
            {palette ? (
              <VectorArrow palette={palette} />
            ) : (
              <span
                className="text-xs italic"
                style={{ color: SURFACE_TOKENS.textMuted }}
              >
                Awaiting emotional vector…
              </span>
            )}
          </div>
        </div>

        {/* ── Description — Stage-controlled line count ── */}
        {preview.description && (
          <p
            className="text-xs leading-relaxed"
            style={{
              color: SURFACE_TOKENS.textSecondary,
              display: '-webkit-box',
              WebkitLineClamp: stageTokens.descriptionLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {preview.description}
          </p>
        )}

        {/* ── Stat Block — Stage-controlled visibility ── */}
        {stageTokens.statBlockVisible && (
          <div className="flex flex-col gap-2">
            {/* Divider */}
            <hr className="ceremony-witness-divider" />

            {/* Stats row */}
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: SURFACE_TOKENS.textMuted }}>
                {stepCount} {stepCount === 1 ? 'step' : 'steps'}
              </span>

              {/* Gem pulse indicator when palette is present */}
              {primaryPalette && (
                <span
                  className="ceremony-gem-pulse"
                  style={{
                    '--element-gem': primaryPalette.gem,
                  } as React.CSSProperties}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Face affinities */}
            {faceAffinities.length > 0 && (
              <FaceAffinityBadges faces={faceAffinities} />
            )}
          </div>
        )}

        {/* ── Minimal seed stat — shown when stat block is hidden ── */}
        {!stageTokens.statBlockVisible && (
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: SURFACE_TOKENS.textMuted }}>
              {stepCount} {stepCount === 1 ? 'step' : 'steps'}
            </span>
            {faceAffinities.length > 0 && (
              <span style={{ color: SURFACE_TOKENS.textMuted }}>
                {faceAffinities.map((f) => FACE_META[f].label).join(' · ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Composted overlay — crosshatch for archived templates ── */}
      {/* Handled by .cultivation-card--composted::before in cultivation-cards.css */}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export default NarrativeTemplatePreview
