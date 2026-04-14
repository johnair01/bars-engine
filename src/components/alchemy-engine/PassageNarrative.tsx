'use client'

/**
 * PassageNarrative — Renders resolved passage content (situation, friction, invitation)
 * with source attribution in the CYOA passage rendering flow.
 *
 * This component is the integration point between the AI generation pipeline
 * (passage-resolver.ts) and the phase step UI components. It renders the same
 * visual structure regardless of whether content is AI-generated or static,
 * with a subtle source badge for transparency.
 *
 * When AI content is available, it replaces the default static text.
 * When AI is unavailable, the component renders nothing (callers fall back to
 * their own hardcoded text).
 *
 * Design:
 *   - Source attribution is subtle (10px badge), not distracting
 *   - AI content gets a small sparkle indicator
 *   - Template bank content shows "crafted" badge
 *   - Static inline content shows no badge (it's the default)
 *   - Loading state shows a skeleton pulse
 *
 * @see src/lib/alchemy-engine/passage-resolver.ts — content resolution pipeline
 * @see src/actions/alchemy-engine.ts — resolvePhasePassage server action
 */

import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Passage content that can be rendered by this component.
 * Mirrors the ResolvedPassageResult from the server action,
 * but only the fields needed for rendering.
 */
export interface PassageContent {
  /** Scene-setting narrative. */
  situation: string
  /** Friction point — what's at stake. */
  friction: string
  /** Invitation — what the player is being asked. */
  invitation: string
  /** How the content was obtained. */
  source: 'ai' | 'template_bank' | 'static_inline' | 'cached_ai'
  /** Whether AI was available when resolved. */
  aiAvailable: boolean
}

export interface PassageNarrativeProps {
  /** The resolved passage content to render. When null, component renders nothing. */
  passage: PassageContent | null
  /** Whether the passage is currently loading (shows skeleton). */
  isLoading?: boolean
  /** Element for color theming (defaults to 'fire' for Challenger). */
  element?: ElementKey
  /** Whether to show the source attribution badge. */
  showSource?: boolean
  /** Optional className for the outer wrapper. */
  className?: string
}

// ---------------------------------------------------------------------------
// Source Badge
// ---------------------------------------------------------------------------

function SourceBadge({
  source,
  element,
}: {
  source: PassageContent['source']
  element: ElementKey
}) {
  const tokens = ELEMENT_TOKENS[element]

  if (source === 'static_inline') return null

  const label =
    source === 'ai'
      ? 'ai-generated'
      : source === 'cached_ai'
      ? 'ai-cached'
      : 'crafted'

  const badgeStyle =
    source === 'ai' || source === 'cached_ai'
      ? `${tokens.badgeBg} ${tokens.textAccent}`
      : 'bg-zinc-800/60 text-zinc-500'

  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded ${badgeStyle}`}
      aria-label={`Content source: ${label}`}
    >
      {(source === 'ai' || source === 'cached_ai') && (
        <svg
          className="w-2.5 h-2.5"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M6 1L7.2 4.2L10.5 4.5L8 6.8L8.8 10L6 8.2L3.2 10L4 6.8L1.5 4.5L4.8 4.2L6 1Z"
            fill="currentColor"
            opacity="0.7"
          />
        </svg>
      )}
      {label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function PassageSkeleton({ element }: { element: ElementKey }) {
  const tokens = ELEMENT_TOKENS[element]
  return (
    <div
      className={`space-y-3 rounded-lg border ${tokens.border} bg-zinc-900/30 p-3 animate-pulse`}
      aria-label="Loading passage content..."
      role="status"
    >
      <div className="space-y-1.5">
        <div className={`h-2.5 rounded w-4/5 ${tokens.bg}`} />
        <div className={`h-2.5 rounded w-3/5 ${tokens.bg}`} />
      </div>
      <div className="space-y-1.5">
        <div className={`h-2.5 rounded w-full ${tokens.bg}`} />
        <div className={`h-2.5 rounded w-2/3 ${tokens.bg}`} />
      </div>
      <div className="space-y-1.5">
        <div className={`h-2.5 rounded w-3/4 ${tokens.bg}`} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Renders resolved passage content (situation, friction, invitation)
 * from the AI generation pipeline or static template bank.
 *
 * Usage in phase step components:
 * ```tsx
 * <PassageNarrative
 *   passage={resolvedPassage}
 *   isLoading={isLoadingPassage}
 *   element="fire"
 * />
 * ```
 *
 * When `passage` is null and `isLoading` is false, renders nothing.
 * This allows callers to fall back to their own hardcoded text.
 */
export function PassageNarrative({
  passage,
  isLoading = false,
  element = 'fire',
  showSource = true,
  className = '',
}: PassageNarrativeProps) {
  const tokens = ELEMENT_TOKENS[element]

  // Loading state
  if (isLoading) {
    return <PassageSkeleton element={element} />
  }

  // No content — render nothing, let caller show default text
  if (!passage) return null

  return (
    <div
      className={`space-y-2.5 rounded-lg border ${tokens.border} bg-zinc-900/30 p-3 ${className}`}
      data-testid="passage-narrative"
      data-source={passage.source}
    >
      {/* Situation — scene-setting narrative */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[9px] uppercase tracking-widest ${tokens.textAccent} opacity-50`}>
            scene
          </span>
          {showSource && <SourceBadge source={passage.source} element={element} />}
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          {passage.situation}
        </p>
      </div>

      {/* Friction — what's at stake */}
      <div>
        <span className={`text-[9px] uppercase tracking-widest ${tokens.textAccent} opacity-50`}>
          friction
        </span>
        <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
          {passage.friction}
        </p>
      </div>

      {/* Invitation — what the player is being asked */}
      <div>
        <span className={`text-[9px] uppercase tracking-widest ${tokens.textAccent} opacity-50`}>
          invitation
        </span>
        <p className={`text-xs ${tokens.textAccent} leading-relaxed mt-0.5 font-medium`}>
          {passage.invitation}
        </p>
      </div>
    </div>
  )
}
