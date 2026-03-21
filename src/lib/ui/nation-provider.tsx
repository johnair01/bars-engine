'use client'

/**
 * BARS ENGINE — NationProvider
 *
 * Broadcasts the current player's nation element and archetype/playbook name
 * to all descendant components via React context.
 *
 * Design law:
 *  - Server-fed only: data flows in as RSC props, never fetched on the client.
 *  - Handles both authenticated (element set) and unauthenticated (null) contexts.
 *  - Consumers use useNation() hook — no prop-drilling required.
 *  - All color derivation happens at consumers via ELEMENT_TOKENS from card-tokens.ts.
 *  - For unauthenticated pages, pass earthFallback={true} to use earth tokens
 *    as the default aesthetic instead of null/empty tokens.
 *
 * Usage (authenticated RSC layout/page):
 *   <NationProvider element={player.nation?.element ?? null} archetypeName={player.archetype?.name ?? null}>
 *     {children}
 *   </NationProvider>
 *
 * Usage (unauthenticated page — earth fallback):
 *   <NationProvider element={null} archetypeName={null} earthFallback={true}>
 *     {children}
 *   </NationProvider>
 *
 * Usage (client component):
 *   const { element, archetypeName, tokens, resolvedFromFallback } = useNation()
 */

import { createContext, useContext, type ReactNode } from 'react'
import { ELEMENT_TOKENS, elementCssVars, type ElementKey } from './card-tokens'
import type { NationKey } from './card-art-registry'

// ─── Context Shape ────────────────────────────────────────────────────────────

export interface NationContextValue {
  /** Wuxing element for the current player's nation, or null if unauthenticated and no earthFallback */
  element: ElementKey | null
  /** Archetype / playbook name for the current player, or null if not set */
  archetypeName: string | null
  /** Derived element tokens — null only when element is null (no earthFallback) */
  tokens: typeof ELEMENT_TOKENS[ElementKey] | null
  /** CSS custom property object — empty record only when element is null (no earthFallback) */
  cssVars: Record<string, string>
  /**
   * True when element resolved via earth fallback for an unauthenticated page.
   * False when element came from a real player context (authenticated).
   * False when element is null (unauthenticated, earthFallback not requested).
   *
   * Use this to distinguish "genuine earth player" from "unauthenticated earth default":
   *   if (element === 'earth' && !resolvedFromFallback) → real earth player
   *   if (element === 'earth' && resolvedFromFallback)  → unauthenticated default
   *   if (element === null)                              → unauthenticated, no fallback
   */
  resolvedFromFallback: boolean
}

const NationContext = createContext<NationContextValue>({
  element: null,
  archetypeName: null,
  tokens: null,
  cssVars: {},
  resolvedFromFallback: false,
})

// ─── Provider Props ───────────────────────────────────────────────────────────

export interface NationProviderProps {
  /**
   * Wuxing element string from player.nation.element (Prisma field).
   * Pass null for unauthenticated or incomplete player profiles.
   */
  element: string | null | undefined
  /**
   * Archetype or playbook name.
   * Accepts player.archetype.name OR player.playerPlaybook.playbookName.
   * Pass null if neither is available.
   */
  archetypeName: string | null | undefined
  /**
   * When true and element is null/undefined/invalid, falls back to 'earth' as the
   * default element — providing terracotta/ochre earth tokens to unauthenticated pages.
   *
   * When false (default), null element remains null in the context: tokens and cssVars
   * will be null/empty, and consumers must handle the null case gracefully.
   *
   * Typical usage:
   *   - Authenticated page.tsx: earthFallback={false} (default) — element from player.nation.element
   *   - Public/unauthenticated page: earthFallback={true} — earth aesthetic as default
   *   - Pre-resolved element (e.g. public profile): pass element directly, no earthFallback needed
   */
  earthFallback?: boolean
  children: ReactNode
}

// ─── Provider Component ───────────────────────────────────────────────────────

/**
 * NationProvider wraps layout or page RSC output and makes nation/element
 * context available to all client components in the subtree.
 *
 * CONSTRAINT: Must be placed in the RSC tree (page.tsx or layout.tsx) where
 * player data is fetched. Never self-fetch on client mount.
 *
 * @example Authenticated — element from player data
 *   <NationProvider element={player.nation?.element ?? null} archetypeName={player.archetype?.name ?? null}>
 *     <Dashboard />
 *   </NationProvider>
 *
 * @example Unauthenticated — earth fallback for landing pages
 *   <NationProvider element={null} archetypeName={null} earthFallback={true}>
 *     <LandingPage />
 *   </NationProvider>
 *
 * @example Pre-resolved public profile — explicit element, no earthFallback needed
 *   <NationProvider element={publicPlayer.nation.element} archetypeName={publicPlayer.archetype?.name ?? null}>
 *     <PublicProfile />
 *   </NationProvider>
 */
export function NationProvider({
  element,
  archetypeName,
  earthFallback = false,
  children,
}: NationProviderProps) {
  // Validate and normalise the incoming element — reject unknown strings
  const validElements: ElementKey[] = ['fire', 'water', 'wood', 'metal', 'earth']
  const passedElement: ElementKey | null =
    element && validElements.includes(element as ElementKey)
      ? (element as ElementKey)
      : null

  // Apply earth fallback for unauthenticated pages when explicitly requested.
  // resolvedFromFallback tracks whether the earth token is "real" or a default.
  const resolvedFromFallback: boolean = passedElement === null && earthFallback
  const resolvedElement: ElementKey | null =
    passedElement ?? (earthFallback ? 'earth' : null)

  const tokens = resolvedElement ? ELEMENT_TOKENS[resolvedElement] : null
  const cssVars = resolvedElement ? elementCssVars(resolvedElement) : {}

  const value: NationContextValue = {
    element: resolvedElement,
    archetypeName: archetypeName ?? null,
    tokens,
    cssVars,
    resolvedFromFallback,
  }

  return (
    <NationContext.Provider value={value}>
      {children}
    </NationContext.Provider>
  )
}

// ─── Consumer Hook ────────────────────────────────────────────────────────────

/**
 * useNation — access the current player's nation element and archetype.
 *
 * Returns null-safe values. Components should degrade gracefully when
 * element is null (unauthenticated / incomplete profile).
 *
 * @example Authenticated player
 *   const { element, tokens, cssVars } = useNation()
 *   const sigil = tokens?.sigil ?? '◇'
 *   const accentText = tokens?.textAccent ?? 'text-zinc-400'
 *
 * @example Distinguishing real earth player from unauthenticated earth fallback
 *   const { element, resolvedFromFallback } = useNation()
 *   if (element === 'earth' && !resolvedFromFallback) {
 *     // Genuine Meridia player — show earth-themed content
 *   } else if (resolvedFromFallback) {
 *     // Unauthenticated — earth aesthetic is the default, not the player's nation
 *   }
 */
export function useNation(): NationContextValue {
  return useContext(NationContext)
}

// ─── Re-exports for consumers ─────────────────────────────────────────────────
// NationKey re-exported from card-art-registry to prevent type drift.
// Use NationKey when working with nation identifiers (pyrakanth, lamenth, etc.)
// Use ElementKey when working with Wuxing elements (fire, water, wood, metal, earth)

export type { ElementKey }
export type { NationKey }
