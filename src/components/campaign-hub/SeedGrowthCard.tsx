'use client'

/**
 * SeedGrowthCard — Campaign Hub seed BAR card with four growth stage display.
 *
 * Renders a CultivationCard whose element channel is driven by the seed's
 * current growth stage Wuxing mapping (Sub-AC 3a → 3b):
 *
 *   sprout  → water  (水) — deep navy frame + teal glow
 *   sapling → wood   (木) — sage frame + jade glow
 *   plant   → earth  (土) — terracotta frame + ochre glow
 *   tree    → fire   (火) — cinnabar frame + ember glow
 *
 * Visual anatomy (top → bottom):
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  [card-art-window] centered stage illustration (SVG)    │
 *   ├──────────────────────────────────────────────────────────┤
 *   │  [stage badge] sigil + label              [water level] │
 *   │  [title]                                               │
 *   │  [GrowthStageTrack]  ○ ○ ● ○  ████░░░░  progress      │
 *   └──────────────────────────────────────────────────────────┘
 *
 * AI: Do NOT hardcode hex values. All colors flow through ELEMENT_TOKENS
 *     and the CSS custom properties injected by CultivationCard.
 *     Read UI_COVENANT.md and card-tokens.ts before modifying.
 */

import type { CSSProperties } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import {
  getGrowthStage,
  getGrowthProgress,
  getGrowthStagesForFace,
  type GrowthStageMetadata,
  type GrowthStageName,
} from '@/lib/campaign-hub/growth-stage'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
// Paths use `currentColor` so the icon inherits the Wuxing element palette
// set via `color` on the wrapper element. Never hardcode fill hex here.

function SproutIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Seed coat at base */}
      <ellipse cx="12" cy="20.5" rx="3.5" ry="1.5" strokeOpacity="0.4" />
      {/* Main stem */}
      <line x1="12" y1="20" x2="12" y2="10" />
      {/* Left cotyledon */}
      <path
        d="M12 14 C8 12 6 8 9 7 C12 6 12 10 12 14"
        fill="currentColor"
        fillOpacity="0.35"
        strokeWidth="1"
      />
      {/* Right cotyledon */}
      <path
        d="M12 14 C16 12 18 8 15 7 C12 6 12 10 12 14"
        fill="currentColor"
        fillOpacity="0.35"
        strokeWidth="1"
      />
      {/* Apical bud */}
      <circle cx="12" cy="9" r="1" fill="currentColor" fillOpacity="0.7" stroke="none" />
    </svg>
  )
}

function SaplingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Ground line */}
      <path d="M7 22 L17 22" strokeOpacity="0.35" />
      {/* Trunk */}
      <line x1="12" y1="22" x2="12" y2="7" />
      {/* Left branch */}
      <line x1="12" y1="16" x2="7" y2="12" />
      {/* Left leaf cluster */}
      <path
        d="M7 12 C5 10 5 6 8 5.5 C10 5 9.5 9 7 12"
        fill="currentColor"
        fillOpacity="0.35"
        strokeWidth="1"
      />
      {/* Right branch */}
      <line x1="12" y1="13" x2="17" y2="10" />
      {/* Right leaf cluster */}
      <path
        d="M17 10 C19 8 19.5 4 16.5 3.5 C14.5 3 14.5 7 17 10"
        fill="currentColor"
        fillOpacity="0.35"
        strokeWidth="1"
      />
      {/* Apical bud */}
      <circle cx="12" cy="6.5" r="1.5" fill="currentColor" fillOpacity="0.6" stroke="none" />
    </svg>
  )
}

function PlantIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Root spread */}
      <path d="M9 22 Q12 20.5 15 22" strokeOpacity="0.4" />
      <path d="M12 22 L12 20" strokeOpacity="0.4" />
      {/* Trunk — slightly thicker */}
      <line x1="12" y1="20" x2="12" y2="5" strokeWidth="1.8" />
      {/* Left lower branch */}
      <line x1="12" y1="17" x2="5.5" y2="13" />
      {/* Left foliage */}
      <path
        d="M5.5 13 C3 11 2.5 6 6 5.5 C8.5 5 8.5 10.5 5.5 13"
        fill="currentColor"
        fillOpacity="0.35"
        strokeWidth="1"
      />
      {/* Right upper branch */}
      <line x1="12" y1="13" x2="18.5" y2="9" />
      {/* Right foliage */}
      <path
        d="M18.5 9 C21 7 21.5 2 18 1.5 C15.5 1 15.5 6.5 18.5 9"
        fill="currentColor"
        fillOpacity="0.35"
        strokeWidth="1"
      />
      {/* Top crown */}
      <path
        d="M12 5 C10 3 10 0.5 12 0.5 C14 0.5 14 3 12 5"
        fill="currentColor"
        fillOpacity="0.5"
        strokeWidth="1"
      />
    </svg>
  )
}

function TreeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Root system */}
      <path d="M10 23 Q12 21.5 14 23" strokeOpacity="0.4" />
      <path d="M11.5 22.5 L10.5 21" strokeOpacity="0.35" />
      <path d="M12.5 22.5 L13.5 21" strokeOpacity="0.35" />
      {/* Trunk — substantial */}
      <line x1="12" y1="21" x2="12" y2="10" strokeWidth="2.5" />
      {/* Full canopy */}
      <path
        d="M12 10 C12 10 4.5 12.5 3.5 8 C2.5 3.5 7.5 1 12 3 C16.5 1 21.5 3.5 20.5 8 C19.5 12.5 12 10 12 10 Z"
        fill="currentColor"
        fillOpacity="0.45"
        strokeWidth="1"
      />
      {/* Inner canopy highlight */}
      <path
        d="M12 8 C12 8 8 9.5 7 7 C8 4.5 10 3.5 12 4.5 C14 3.5 16 4.5 17 7 C16 9.5 12 8 12 8 Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="none"
      />
      {/* Fruit — quest-ready bearing */}
      <circle cx="7.5"  cy="7.5" r="1"   fill="currentColor" fillOpacity="0.9" stroke="none" />
      <circle cx="16.5" cy="7"   r="1"   fill="currentColor" fillOpacity="0.9" stroke="none" />
      <circle cx="12"   cy="5.5" r="1"   fill="currentColor" fillOpacity="0.9" stroke="none" />
      <circle cx="9.5"  cy="5"   r="0.7" fill="currentColor" fillOpacity="0.7" stroke="none" />
      <circle cx="14.5" cy="5.5" r="0.7" fill="currentColor" fillOpacity="0.7" stroke="none" />
    </svg>
  )
}

/** Resolve the correct inline SVG for a growth stage iconKey. */
export function GrowthStageIcon({
  iconKey,
  className,
}: {
  iconKey: string
  className?: string
}) {
  switch (iconKey) {
    case 'growth-sprout':  return <SproutIcon  className={className} />
    case 'growth-sapling': return <SaplingIcon className={className} />
    case 'growth-plant':   return <PlantIcon   className={className} />
    case 'growth-tree':    return <TreeIcon    className={className} />
    default:               return null
  }
}

// ─── Stage Order ──────────────────────────────────────────────────────────────

const STAGE_ORDER: GrowthStageName[] = ['sprout', 'sapling', 'plant', 'tree']

// ─── GrowthStageTrack ─────────────────────────────────────────────────────────

export interface GrowthStageTrackProps {
  /** All four stages with computed min/max bounds for the active GM face. */
  allStages: GrowthStageMetadata[]
  /** The currently active stage. */
  currentStage: GrowthStageMetadata
  /** Fractional progress (0–1) within the current stage. */
  progressWithinStage: number
}

/**
 * GrowthStageTrack — horizontal four-pip progress track with per-stage
 * Wuxing element coloring and a within-stage progress bar.
 *
 * Each pip uses its own element's `--pip-color` / `--pip-glow` CSS vars
 * (injected inline) so the active pip glows with the correct element color
 * independently of the parent CultivationCard element.
 *
 * Progress bar fill uses `--element-frame` from the parent CultivationCard
 * so it always matches the active stage element automatically.
 */
export function GrowthStageTrack({
  allStages,
  currentStage,
  progressWithinStage,
}: GrowthStageTrackProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage.name)
  const progressPercent = Math.round(Math.min(1, Math.max(0, progressWithinStage)) * 100)

  return (
    <div
      role="group"
      aria-label={`Growth stage: ${currentStage.label}, ${progressPercent}% progress`}
    >
      {/* Four stage pips ───────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-1 mb-2">
        {allStages.map((stage, i) => {
          const isActive   = stage.name === currentStage.name
          const isComplete = i < currentIndex
          const tok        = ELEMENT_TOKENS[stage.colorToken]

          // Inject pip-specific color vars only for active/complete pips.
          // Inactive pips use the default transparent fallback in CSS.
          const pipVars = (isActive || isComplete)
            ? ({ '--pip-color': tok.cssVarColor, '--pip-glow': tok.cssVarGlow } as CSSProperties)
            : undefined

          return (
            <div
              key={stage.name}
              className="flex flex-col items-center gap-1 flex-1"
            >
              {/* Pip circle ─────────────────────────────────────────────── */}
              <div
                className={[
                  'growth-stage-track__pip',
                  isActive   && 'growth-stage-track__pip--active',
                  isComplete && 'growth-stage-track__pip--complete',
                ].filter(Boolean).join(' ')}
                style={pipVars}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Icon inherits element color via CSS `color` on wrapper span */}
                <span
                  style={{
                    color: (isActive || isComplete) ? tok.cssVarColor : undefined,
                  }}
                  className="transition-colors duration-200"
                >
                  <GrowthStageIcon
                    iconKey={stage.iconKey}
                    className={[
                      'w-5 h-5 transition-opacity duration-200',
                      isActive   ? 'opacity-100' : isComplete ? 'opacity-55' : 'opacity-18',
                    ].join(' ')}
                  />
                </span>
              </div>

              {/* Stage label ─────────────────────────────────────────────── */}
              <span
                className="text-[9px] font-mono uppercase tracking-wide transition-colors duration-200 leading-none"
                style={{
                  color: isActive ? tok.cssVarColor : undefined,
                  opacity: isActive ? 1 : isComplete ? 0.45 : 0.22,
                }}
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Within-stage progress bar ────────────────────────────────────────── */}
      {/* Fill uses --element-frame from the parent CultivationCard */}
      <div className="growth-stage-progress" aria-hidden="true">
        <div
          className="growth-stage-progress__fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}

// ─── SeedGrowthCard ───────────────────────────────────────────────────────────

export interface SeedGrowthCardProps {
  /**
   * Current water level for the seed (0–100).
   * Drives stage resolution and progress calculation.
   */
  waterLevel: number

  /**
   * Active GM face — determines the growth threshold table.
   * Six faces, each with a distinct cultivation tempo.
   */
  face: GameMasterFace

  /** Optional seed title / BAR summary to display inside the card. */
  title?: string

  /**
   * Altitude override for border intensity.
   * Defaults to automatic: 'satisfied' at tree stage (quest-ready), 'neutral' otherwise.
   */
  altitude?: AlchemyAltitude

  /** Apply entry animation (opacity+Y) on mount. */
  animated?: boolean

  /** Apply idle float animation (for selected/active seeds). */
  floating?: boolean

  /** Additional layout classes — do NOT override cultivation-cards.css. */
  className?: string
}

/**
 * SeedGrowthCard
 *
 * Card component for a planted seed (BAR) in the Campaign Hub seed garden.
 * Consuming `getGrowthStage` and `getGrowthProgress` from Sub-AC 3a, it:
 *
 *   1. Resolves the stage from water level + GM face
 *   2. Sets the CultivationCard `element` to the stage's Wuxing colorToken
 *      so the full three-channel visual encoding shifts with each stage
 *   3. Renders a prominent stage illustration (inline SVG, currentColor)
 *   4. Displays the Wuxing sigil + stage label badge
 *   5. Shows a four-pip GrowthStageTrack with within-stage progress bar
 *
 * The altitude auto-escalates to 'satisfied' when the seed reaches 'tree'
 * stage, producing a full element glow to signal quest readiness.
 *
 * @example
 * <SeedGrowthCard waterLevel={42} face="regent" title="Find the hidden path" />
 * // Resolves to sapling stage (wood/木), neutral altitude, 68% within-stage progress
 *
 * @example
 * <SeedGrowthCard waterLevel={78} face="regent" animated floating />
 * // Tree stage (fire/火), auto-satisfied altitude, full glow
 */
export function SeedGrowthCard({
  waterLevel,
  face,
  title,
  altitude: altitudeProp,
  animated = false,
  floating = false,
  className,
}: SeedGrowthCardProps) {
  // ─── Resolve growth state from Sub-AC 3a ──────────────────────────────────
  const stage    = getGrowthStage(waterLevel, face)
  const progress = getGrowthProgress(waterLevel, face)
  const allStages = getGrowthStagesForFace(face)

  // ─── Element tokens for the current stage ─────────────────────────────────
  const tok = ELEMENT_TOKENS[stage.colorToken]

  // ─── Altitude: auto-escalate at tree stage ────────────────────────────────
  // Tree = full expression, quest-ready → satisfied (full glow)
  // Everything else → neutral (light border, subtle presence)
  const altitude: AlchemyAltitude =
    altitudeProp ?? (stage.name === 'tree' ? 'satisfied' : 'neutral')

  return (
    <CultivationCard
      element={stage.colorToken}
      altitude={altitude}
      stage="growing"
      animated={animated}
      floating={floating}
      className={className}
      aria-label={`Seed: ${stage.label} stage — ${Math.round(waterLevel)} water${title ? `. ${title}` : ''}`}
    >
      {/* ── Art window: prominent stage illustration ───────────────────── */}
      <div className="card-art-window growth-stage-art h-[42%] overflow-hidden rounded-t-xl">
        <span
          style={{ color: tok.cssVarColor }}
          className="transition-colors duration-300"
          aria-hidden="true"
        >
          <GrowthStageIcon
            iconKey={stage.iconKey}
            className="w-16 h-16 drop-shadow-sm"
          />
        </span>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="p-3 space-y-2.5">
        {/* Stage badge row: sigil + label + water level */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Wuxing sigil */}
            <span
              className={`text-base font-bold leading-none ${tok.textAccent}`}
              aria-hidden="true"
            >
              {tok.sigil}
            </span>
            {/* Stage label badge */}
            <span
              className={`text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${tok.badgeBg} ${tok.textAccent}`}
            >
              {stage.label}
            </span>
          </div>
          {/* Water level counter */}
          <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
            {Math.round(waterLevel)}
            <span className="ml-0.5 text-zinc-600">水</span>
          </span>
        </div>

        {/* Optional title */}
        {title && (
          <p className="text-sm font-medium text-white leading-snug line-clamp-2">
            {title}
          </p>
        )}

        {/* Growth stage progress track */}
        <GrowthStageTrack
          allStages={allStages}
          currentStage={stage}
          progressWithinStage={progress}
        />
      </div>
    </CultivationCard>
  )
}
