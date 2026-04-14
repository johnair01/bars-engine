'use client'

/**
 * CultivationCard — BARs Engine card design system primitive.
 *
 * Three-channel visual encoding (from UI_COVENANT.md):
 *   element  → color channel (frame border, glow, gem)
 *   altitude → border/glow intensity channel
 *   stage    → card density channel (art window height, stat block) — UI-only
 *
 * All game aesthetic is expressed via CSS classes from cultivation-cards.css.
 * All layout is Tailwind's domain.
 * CSS custom properties are injected via `style` attribute on the root element.
 *
 * Children passthrough only — no typed slot props.
 * Consumers use STAGE_TOKENS from card-tokens.ts to style interior content.
 *
 * AI: Do NOT add typed slot props. Do NOT hardcode hex values.
 *     Read UI_COVENANT.md and card-tokens.ts before modifying this file.
 */

import { createContext, useContext, type ReactNode, type CSSProperties } from 'react'
import {
  elementCssVars,
  altitudeCssVars,
  ALTITUDE_TOKENS,
  ELEMENT_TOKENS,
  STAGE_TOKENS,
  type ElementKey,
  type CardStage,
  type CardAltitude,
} from '@/lib/ui/card-tokens'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import { useNation } from '@/lib/ui/nation-provider'

// ─── Re-exports for consumer convenience ─────────────────────────────────────
// Consumers import STAGE_TOKENS to style interior content (art window, stat block, etc.)
export type { ElementKey, CardStage } from '@/lib/ui/card-tokens'
export type { AlchemyAltitude } from '@/lib/alchemy/types'

// ─── CardStageContext ─────────────────────────────────────────────────────────
// CultivationCard injects the current stage and its derived tokens into context,
// so any descendant component can call useCardStage() without prop-drilling.
//
// CardStage is UI-only — no domain data lives here.
// The context default ('seed') is a safe fallback for components rendered
// outside a CultivationCard — they will see seed-level density tokens.

export interface CardStageContextValue {
  /** Current card density stage — UI-only, no domain coupling. */
  stage: CardStage
  /** Derived STAGE_TOKENS entry for the current stage. */
  tokens: typeof STAGE_TOKENS[CardStage]
}

const CardStageContext = createContext<CardStageContextValue>({
  stage:  'seed',
  tokens: STAGE_TOKENS['seed'],
})

/**
 * useCardStage — access the current card's stage and derived tokens.
 *
 * Must be called from a component rendered inside a CultivationCard.
 * Returns a safe seed-stage default when called outside any card.
 *
 * @example
 *   const { stage, tokens } = useCardStage()
 *   // Drive art window height from stage
 *   return <div className={`card-art-window ${tokens.artWindowHeight}`} />
 *
 * @example
 *   const { tokens } = useCardStage()
 *   // Conditionally render stat blocks
 *   return tokens.statBlockVisible ? <StatBlock /> : null
 */
export function useCardStage(): CardStageContextValue {
  return useContext(CardStageContext)
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface CultivationCardProps {
  /**
   * Wuxing element — drives the color channel.
   * Sets --element-frame, --element-glow, --element-gem CSS vars.
   * Maps to Nation.element in Prisma schema.
   *
   * Override resolution (AC 6):
   *   1. This prop, when provided — highest priority (per-card override)
   *   2. NationProvider context element — player's nation element
   *   3. 'earth' — safe default when neither is set
   *
   * Omit this prop on cards that should inherit the player's nation element.
   * Pass an explicit value to override (e.g. a quest card from a different nation).
   */
  element?: ElementKey

  /**
   * Altitude — drives the border/glow intensity channel.
   * AlchemyAltitude is reused per project constraint — no new altitude type.
   * Structurally identical to CardAltitude ('dissatisfied' | 'neutral' | 'satisfied').
   */
  altitude: AlchemyAltitude

  /**
   * Card density stage — UI display only, no domain coupling.
   * Determines art window height, stat block visibility, and composted overlay.
   * Consumers use STAGE_TOKENS from card-tokens.ts to style interior content.
   */
  stage: CardStage

  /**
   * Card interior content. All content rendered as children.
   * No typed slot props — the consumer owns the interior layout.
   *
   * Useful patterns:
   *   .card-art-window + STAGE_TOKENS[stage].artWindowHeight for art sizing
   *   STAGE_TOKENS[stage].artOpacity on the art image for composted fading
   *   STAGE_TOKENS[stage].statBlockVisible to show/hide stat blocks
   */
  children?: ReactNode

  // ─── Interaction state flags ──────────────────────────────────────────────
  // These map directly to CSS modifier classes in cultivation-cards.css.
  // All eight states from UI_COVENANT.md §"Eight Interaction States" are covered.

  /** Default, Hover, Focus, Active states are handled purely by CSS — no props needed. */

  /** Selected: pulse animation at satisfied-level glow. */
  selected?: boolean

  /** Disabled: 30% opacity, pointer-events: none, no glow. */
  disabled?: boolean

  /** Loading: shimmer animation on .card-art-window children. */
  loading?: boolean

  /** Ritual: alchemical moment — expanded glow 24px, scale 1.05. */
  ritual?: boolean

  /** Sealed: completed/immutable card — subtle lock overlay, reduced glow. */
  sealed?: boolean

  // ─── Animation flags ──────────────────────────────────────────────────────

  /** Apply entry animation (opacity 0→1, translateY 8px→0, 300ms). */
  animated?: boolean

  /**
   * Apply idle float animation (translateY 0→-3px).
   * Float period is driven by --float-period from the altitude token.
   * Only apply to active/selected cards — not all cards breathe.
   */
  floating?: boolean

  // ─── Layout and accessibility ─────────────────────────────────────────────

  /**
   * Additional CSS classes — layout control only.
   * Do NOT override cultivation-cards.css aesthetic classes here.
   */
  className?: string

  /**
   * Accessible label for screen readers.
   * Defaults to "[element] element cultivation card, [altitude] altitude, [stage] stage".
   * Override with meaningful game context when known (e.g. card name + type).
   */
  'aria-label'?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * CultivationCard
 *
 * Element prop override (AC 6):
 *   - Omit `element` → card inherits player's nation element from NationProvider context
 *   - Pass `element` → overrides the context (useful for cross-nation quest cards)
 *   - No NationProvider in tree + no `element` prop → falls back to 'earth'
 *
 * Usage — inherit from NationProvider (most cards):
 * ```tsx
 * import { CultivationCard } from '@/components/ui/CultivationCard'
 * import { STAGE_TOKENS } from '@/lib/ui/card-tokens'
 *
 * // element comes from NationProvider context — no prop needed
 * function PlayerCard({ altitude, stage }) {
 *   const st = STAGE_TOKENS[stage]
 *   return (
 *     <CultivationCard altitude={altitude} stage={stage}>
 *       <div className={`card-art-window ${st.artWindowHeight}`}>{...}</div>
 *     </CultivationCard>
 *   )
 * }
 * ```
 *
 * Usage — explicit override (cross-nation cards, previews):
 * ```tsx
 * // element prop overrides the NationProvider context
 * function QuestCard({ questElement, altitude, stage }) {
 *   const st = STAGE_TOKENS[stage]
 *   return (
 *     <CultivationCard element={questElement} altitude={altitude} stage={stage}>
 *       <div className={`card-art-window ${st.artWindowHeight} overflow-hidden rounded-t-xl`}>
 *         <img className={st.artOpacity} src={artUrl} alt="..." />
 *       </div>
 *       <div className="relative z-10 p-3 space-y-1">
 *         <h3 className="text-sm font-bold">{name}</h3>
 *         {st.statBlockVisible && <StatBlock />}
 *       </div>
 *     </CultivationCard>
 *   )
 * }
 * ```
 */
export function CultivationCard({
  element,
  altitude,
  stage,
  children,
  selected  = false,
  disabled  = false,
  loading   = false,
  ritual    = false,
  animated  = false,
  floating  = false,
  className,
  'aria-label': ariaLabel,
}: CultivationCardProps) {
  // ─── AC 6: Element override resolution ────────────────────────────────────
  // Priority 1 — explicit `element` prop (per-card override, highest priority)
  // Priority 2 — NationProvider context element (player's nation)
  // Priority 3 — 'earth' safe default (fallback when no context and no prop)
  //
  // useNation() is safe to call here: CultivationCard is already 'use client'.
  // When called outside a NationProvider tree, useNation() returns { element: null, ... }.
  const nation = useNation()
  const resolvedElement: ElementKey =
    element          // Priority 1: explicit per-card prop
    ?? nation.element  // Priority 2: NationProvider context
    ?? 'earth'        // Priority 3: safe default

  // AlchemyAltitude is structurally identical to CardAltitude — same union values.
  // TypeScript accepts direct assignment; no lossy cast.
  const cardAltitude   = altitude as CardAltitude
  const elementTokens  = ELEMENT_TOKENS[resolvedElement]
  const altitudeTokens = ALTITUDE_TOKENS[cardAltitude]

  // ─── CSS custom properties ────────────────────────────────────────────────
  // All color values flow through CSS vars to cultivation-cards.css.
  // Never hardcode hex in JSX or component logic — read from card-tokens.ts only.
  const cssVars = {
    // Channel 1: element color (from resolvedElement — prop override or context)
    ...elementCssVars(resolvedElement),

    // Channel 2: altitude glow radius
    ...altitudeCssVars(cardAltitude),

    // Frame gradient (used by .card-frame-gradient child)
    '--grad-from': elementTokens.gradFrom,
    '--grad-to':   elementTokens.gradTo,

    // Float animation period (used by .cultivation-card-float)
    '--float-period': altitudeTokens.floatPeriod !== 'none'
      ? altitudeTokens.floatPeriod
      : '4s',
  } as CSSProperties

  // ─── CSS class assembly ───────────────────────────────────────────────────
  // cultivation-cards.css owns all aesthetic classes.
  // Tailwind (via className) owns layout only.
  const cardClasses = [
    'cultivation-card',                               // base — always present
    selected  && 'cultivation-card--selected',        // pulse at satisfied-level glow
    disabled  && 'cultivation-card--disabled',        // 30% opacity, no interaction
    loading   && 'cultivation-card--loading',         // shimmer on .card-art-window
    ritual    && 'cultivation-card--ritual',          // expanded glow, scale 1.05
    stage === 'composted' && 'cultivation-card--composted', // ::before crosshatch overlay
    animated  && 'cultivation-card-enter',            // entry: opacity+Y animation
    floating  && 'cultivation-card-float',            // idle float: Y oscillation
    className,                                        // consumer layout classes
  ]
    .filter(Boolean)
    .join(' ')

  // Default ARIA label encodes the three-channel state for screen readers.
  // Uses resolvedElement so the label reflects the actual rendered element,
  // whether it came from the prop override or the NationProvider context.
  const defaultAriaLabel =
    ariaLabel ?? `${resolvedElement} element cultivation card, ${altitude} altitude, ${stage} stage`

  // ─── Stage context value ───────────────────────────────────────────────────
  // Derived once per render. Children call useCardStage() to access without
  // prop-drilling. CardStage is UI-only — no domain data in context.
  const stageContextValue: CardStageContextValue = {
    stage,
    tokens: STAGE_TOKENS[stage],
  }

  return (
    <CardStageContext.Provider value={stageContextValue}>
      <div
        className={`relative ${cardClasses}`}
        style={cssVars}
        aria-label={defaultAriaLabel}
      >
        {/*
          ── Decorative background layers (z-index: 0) ──────────────────────────

          card-frame-gradient: element-tinted radial gradient on the card body.
            Uses --grad-from / --grad-to vars set above.
            Position: absolute, inset: 0, pointer-events: none.

          card-corner-glow: soft element-colored radial light at top-left.
            Extends outside card bounds (top: -32px, left: -32px) — intentional.
            Ensure parent container allows overflow: visible for the aura effect.
            Position: absolute, pointer-events: none.
        */}
        <div className="card-frame-gradient" aria-hidden="true" />
        <div className="card-corner-glow"    aria-hidden="true" />

        {/*
          ── Content layer (z-index: 10) ────────────────────────────────────────

          Rendered above the composted ::before crosshatch overlay (z-index: 1).
          Rendered above the frame gradient and corner glow (z-index: 0).
          All consumer content lives here — no slot constraints.

          Children may call useCardStage() to read stage + tokens from context.
        */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </CardStageContext.Provider>
  )
}
