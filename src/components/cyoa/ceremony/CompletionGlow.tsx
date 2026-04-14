'use client'

/**
 * CompletionGlow — Ceremony effect wrapper for build receipt completion.
 *
 * Wraps a CultivationCard (or any element) with the completion glow effect.
 * The glow fires once on mount (ceremony-flash animation) then settles to
 * a sustained outer glow at satisfied-level intensity.
 *
 * Three-channel encoding (UI_COVENANT.md):
 *   Element  -> glow color (from --element-frame / --element-glow CSS vars)
 *   Altitude -> always 'satisfied' (completion = max altitude)
 *   Stage    -> 'growing' (receipt is a living, completed artifact)
 *
 * Register 7 (Ceremony) — ceremony-completion-glow class in cultivation-cards.css.
 *
 * AI: All color values flow through CSS custom properties set by CultivationCard
 *     or inline via elementCssVars(). Never hardcode hex values here.
 *
 * @see cultivation-cards.css — ceremony-completion-glow, ceremony-gem-pulse
 * @see card-tokens.ts — elementCssVars(), ELEMENT_TOKENS
 */

import { type ReactNode, type CSSProperties } from 'react'
import {
  elementCssVars,
  altitudeCssVars,
  ELEMENT_TOKENS,
  type ElementKey,
} from '@/lib/ui/card-tokens'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CompletionGlowProps {
  /**
   * Wuxing element driving the glow color channel.
   * Falls back to 'earth' (warm gold) if not provided.
   */
  element?: ElementKey

  /**
   * Whether the completion glow animation should fire.
   * When false, the wrapper renders children without any glow effect.
   * Useful for conditional ceremony triggering.
   */
  active?: boolean

  /**
   * Show the gem pulse indicator alongside the glow.
   * The gem pulse is a small pulsing dot in the element's gem color,
   * signaling "this receipt is alive" after the flash settles.
   */
  showGemPulse?: boolean

  /** Children to wrap with the glow effect. */
  children: ReactNode

  /** Additional CSS classes for layout only. */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CompletionGlow wraps its children in a ceremony glow container.
 *
 * When `active` is true, the ceremony-completion-glow CSS class fires
 * the flash animation (bright expand -> settle). The glow color is
 * derived from the element's CSS custom properties.
 *
 * Usage:
 * ```tsx
 * <CompletionGlow element="fire" active showGemPulse>
 *   <ReturnWitness receipt={receipt} />
 * </CompletionGlow>
 * ```
 */
export function CompletionGlow({
  element = 'earth',
  active = true,
  showGemPulse = false,
  children,
  className,
}: CompletionGlowProps) {
  // Inject element CSS vars so ceremony-completion-glow picks up the right colors
  const cssVars: CSSProperties = {
    ...elementCssVars(element),
    ...altitudeCssVars('satisfied'),
    '--grad-from': ELEMENT_TOKENS[element].gradFrom,
    '--grad-to': ELEMENT_TOKENS[element].gradTo,
  } as CSSProperties

  const containerClasses = [
    'relative',
    active && 'ceremony-completion-glow',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={containerClasses}
      style={active ? cssVars : undefined}
      aria-live={active ? 'polite' : undefined}
    >
      {children}

      {showGemPulse && active && (
        <div
          className="absolute -top-1 -right-1 z-20"
          style={cssVars}
          aria-hidden="true"
        >
          <span className="ceremony-gem-pulse" />
        </div>
      )}
    </div>
  )
}
