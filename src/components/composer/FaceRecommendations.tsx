'use client'

/**
 * FaceRecommendations — Under-explored face suggestion cards for the CYOA Composer.
 *
 * Renders a grid of selectable CultivationCards, one per GameMasterFace,
 * prioritized by the face-recommendation resolver. Under-explored faces
 * are visually promoted (higher altitude glow, animated entry); recently
 * overused faces are de-emphasized (lower altitude, no animation).
 *
 * The component is a controlled selection — the parent Composer owns the
 * selected face state and passes it via `selectedFace`. FaceRecommendations
 * calls `onSelectFace` when the player taps a card; it never mutates state.
 *
 * Three-channel encoding (UI_COVENANT.md):
 *   Channel 1 (element) — gmFaceToElement maps each face to its Wuxing element
 *   Channel 2 (altitude) — recommendation score drives altitude:
 *     score ≥ 0.70 → satisfied (full glow, recommended)
 *     score ≥ 0.40 → neutral   (standard presentation)
 *     score <  0.40 → dissatisfied (dim, recently overused)
 *   Channel 3 (stage) — exploration status:
 *     unexplored → seed  (compact, mysterious — invitation to discover)
 *     explored   → growing (expanded, familiar — shows usage count)
 *
 * AI: Do NOT hardcode hex. All colors flow through card-tokens.ts + cultivation-cards.css.
 *     Read UI_COVENANT.md before modifying.
 *
 * @see src/lib/cyoa-composer/face-recommendation.ts — scoring resolver (pure function)
 * @see src/lib/campaign-hub/gm-face-element.ts — face → Wuxing element mapping
 * @see src/components/ui/CultivationCard.tsx — card design system primitive
 * @see src/lib/quest-grammar/types.ts — GameMasterFace, FACE_META
 */

import { useMemo } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { STAGE_TOKENS } from '@/lib/ui/card-tokens'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import type { CardStage } from '@/lib/ui/card-tokens'
import type { GameMasterFace, EmotionalVector } from '@/lib/quest-grammar/types'
import { FACE_META } from '@/lib/quest-grammar/types'
import {
  resolveFaceRecommendations,
  getFaceExplorationProgress,
  type FaceRecommendation,
  type FaceRecommendationResult,
} from '@/lib/cyoa-composer/face-recommendation'
import type { CompletedBuildReceipt } from '@/lib/campaign-hub/types'
import { gmFaceToElement } from '@/lib/campaign-hub/gm-face-element'

// ─── Props ──────────────────────────────────────────────────────────────────

export interface FaceRecommendationsProps {
  /** Player's completed build receipts (from CampaignHubStateV1). */
  completedBuilds: CompletedBuildReceipt[]
  /** Player's current emotional vector (from check-in or composer). Null if not yet resolved. */
  emotionalVector?: EmotionalVector | null
  /** Currently selected face (controlled). Null if no selection yet. */
  selectedFace: GameMasterFace | null
  /** Callback when the player selects a face card. */
  onSelectFace: (face: GameMasterFace) => void
  /** Optional: restrict to a subset of faces (GM campaign config). */
  availableFaces?: GameMasterFace[]
  /** Optional: disable all cards (e.g. during confirmation step). */
  disabled?: boolean
  /** Optional: pre-computed recommendation result (skip re-computation). */
  precomputedResult?: FaceRecommendationResult
}

// ─── Score → Altitude Mapping ───────────────────────────────────────────────

/** Map recommendation score to altitude for visual treatment. */
function scoreToAltitude(score: number): AlchemyAltitude {
  if (score >= 0.70) return 'satisfied'
  if (score >= 0.40) return 'neutral'
  return 'dissatisfied'
}

/** Map exploration status to card stage. */
function exploredToStage(explored: boolean): CardStage {
  return explored ? 'growing' : 'seed'
}

// ─── Score Badge ────────────────────────────────────────────────────────────

function ScoreBadge({ score, isTop }: { score: number; isTop: boolean }) {
  const percent = Math.round(score * 100)
  if (isTop) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
        Recommended
      </span>
    )
  }
  if (score >= 0.70) {
    return (
      <span className="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-zinc-800/50 text-zinc-300 border border-zinc-600/30">
        {percent}%
      </span>
    )
  }
  return null
}

// ─── Usage Indicator ────────────────────────────────────────────────────────

function UsageIndicator({ timesUsed, explored }: { timesUsed: number; explored: boolean }) {
  if (!explored) {
    return (
      <span className="text-xs text-zinc-500 italic">
        Not yet explored
      </span>
    )
  }
  return (
    <span className="text-xs text-zinc-400">
      {timesUsed} {timesUsed === 1 ? 'build' : 'builds'}
    </span>
  )
}

// ─── Exploration Progress ───────────────────────────────────────────────────

function ExplorationProgress({ result }: { result: FaceRecommendationResult }) {
  const progress = getFaceExplorationProgress(result)
  const { exploredCount } = result

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="flex gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < exploredCount
                ? 'bg-emerald-400'
                : 'bg-zinc-700'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-zinc-400">
        {exploredCount} of 6 faces explored ({progress}%)
      </span>
    </div>
  )
}

// ─── Individual Face Card ───────────────────────────────────────────────────

interface FaceCardProps {
  rec: FaceRecommendation
  isSelected: boolean
  isTop: boolean
  disabled: boolean
  onSelect: (face: GameMasterFace) => void
}

function FaceCard({ rec, isSelected, isTop, disabled, onSelect }: FaceCardProps) {
  const element = gmFaceToElement(rec.face)
  const altitude = scoreToAltitude(rec.score)
  const stage = exploredToStage(rec.explored)
  const meta = FACE_META[rec.face]
  const stageTokens = STAGE_TOKENS[stage]

  const handleClick = () => {
    if (!disabled) {
      onSelect(rec.face)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault()
      onSelect(rec.face)
    }
  }

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-label={`${meta.label} — ${meta.mission}. ${rec.reason}`}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="cursor-pointer focus:outline-none"
    >
      <CultivationCard
        element={element}
        altitude={altitude}
        stage={stage}
        selected={isSelected}
        disabled={disabled}
        sealed={false}
        animated={!rec.explored}
        floating={isTop && !isSelected}
        className="p-0 transition-transform"
      >
        {/* Card interior — follows CultivationCard children-only pattern */}
        <div className="p-3 space-y-2">
          {/* Header: face label + score badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${meta.color}`}>
                {meta.label}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                {meta.role}
              </span>
            </div>
            <ScoreBadge score={rec.score} isTop={isTop} />
          </div>

          {/* Mission description */}
          <p className="text-xs text-zinc-300 leading-relaxed">
            {meta.mission}
          </p>

          {/* Recommendation reason (contextual) */}
          <p className="text-[11px] text-zinc-400 leading-snug italic">
            {rec.reason}
          </p>

          {/* Footer: usage + exploration status */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-700/40">
            <UsageIndicator timesUsed={rec.timesUsed} explored={rec.explored} />
            {rec.breakdown.emotionalAffinity > 0 && (
              <span className="text-[10px] text-teal-400/80">
                Resonant
              </span>
            )}
          </div>
        </div>
      </CultivationCard>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * FaceRecommendations — renders a selectable grid of face suggestion cards.
 *
 * Sorted by recommendation score (highest first). Under-explored faces
 * are visually promoted via CultivationCard's three-channel encoding.
 *
 * Usage within ComposerStepRenderer:
 * ```tsx
 * <FaceRecommendations
 *   completedBuilds={hubState.completedBuilds}
 *   emotionalVector={dataBag.emotionalVector}
 *   selectedFace={dataBag.lockedFace}
 *   onSelectFace={(face) => onStepComplete('face_selection', { lockedFace: face })}
 * />
 * ```
 */
export function FaceRecommendations({
  completedBuilds,
  emotionalVector,
  selectedFace,
  onSelectFace,
  availableFaces,
  disabled = false,
  precomputedResult,
}: FaceRecommendationsProps) {
  // ── Resolve recommendations (memoized — pure function, stable inputs) ────
  const result = useMemo(() => {
    if (precomputedResult) return precomputedResult
    return resolveFaceRecommendations(completedBuilds, emotionalVector, availableFaces)
  }, [completedBuilds, emotionalVector, availableFaces, precomputedResult])

  const topFace = result.topRecommendation.face

  return (
    <div className="space-y-3" role="radiogroup" aria-label="Choose a Game Master face">
      {/* Exploration progress bar */}
      <ExplorationProgress result={result} />

      {/* Prompt text */}
      <p className="text-sm text-zinc-300">
        {result.unexploredFaces.length > 0
          ? `You have ${result.unexploredFaces.length} unexplored ${
              result.unexploredFaces.length === 1 ? 'face' : 'faces'
            } — each opens a distinct developmental path.`
          : 'All six faces explored. Choose the one that calls to you now.'
        }
      </p>

      {/* Face card grid — responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {result.recommendations.map((rec) => (
          <FaceCard
            key={rec.face}
            rec={rec}
            isSelected={selectedFace === rec.face}
            isTop={rec.face === topFace}
            disabled={disabled}
            onSelect={onSelectFace}
          />
        ))}
      </div>
    </div>
  )
}
