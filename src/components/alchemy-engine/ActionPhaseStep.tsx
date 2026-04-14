'use client'

/**
 * ActionPhaseStep — Action phase CYOA step for the Alchemy Engine vertical slice.
 *
 * Presents Challenger face moves (issueChallenge, proposeMove) as selectable
 * CYOA choices. This is phase 2 of the 3-phase arc:
 *   Intake (dissatisfied) → Action (neutral) → Reflection (epiphany)
 *
 * Design:
 *   - Challenger face = Fire element, text-red-400, cinnabar frame
 *   - Wake Up WAVE move context: awareness → action
 *   - Two Challenger moves as CYOA choices:
 *     1. Issue Challenge (fire_transcend): "Achieve Breakthrough" — direct confrontation
 *     2. Propose Move (wood_fire): "Declare Intention" — strategic momentum
 *   - Non-AI path is first-class: all choices are CYOA selections, no AI required
 *   - Selection produces channel-typed state for the Reflection phase
 *
 * Uses CultivationCard with fire element at neutral altitude (phase 2 = neutral).
 * Follows DailyCheckInQuest wizard step pattern.
 *
 * @see src/components/dashboard/DailyCheckInQuest.tsx — wizard step pattern
 * @see src/lib/quest-grammar/lens-moves.ts — Challenger move emphasis
 * @see src/actions/face-move-bar.ts — issueChallenge, proposeMove actions
 */

import { useState } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { FACE_META } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import { PassageNarrative, type PassageContent } from './PassageNarrative'

// ─── Challenger Move Definitions ─────────────────────────────────────────────
// Derived from lens-moves.ts Challenger emphasis + move-engine.ts canonical moves.
// Scoped to Wake Up WAVE stage per vertical slice constraint.

export interface ChallengerMoveChoice {
  /** Unique key for this choice */
  id: 'issue_challenge' | 'propose_move'
  /** Canonical move ID from move-engine.ts */
  canonicalMoveId: string
  /** Display title */
  title: string
  /** Player-facing description (in-voice, Challenger tone) */
  description: string
  /** Narrative from the canonical move */
  narrative: string
  /** Energy delta from the canonical move */
  energyDelta: number
  /** Element association */
  element: ElementKey
  /** Action prompt — what the player will do */
  actionPrompt: string
}

/** The two Challenger face moves available in the Action phase */
export const CHALLENGER_MOVES: ChallengerMoveChoice[] = [
  {
    id: 'issue_challenge',
    canonicalMoveId: 'fire_transcend',
    title: 'Issue Challenge',
    description: 'Name the thing you\'ve been avoiding. Say it out loud. The discomfort is the signal — lean in.',
    narrative: 'Anger → boundary honored',
    energyDelta: 2,
    element: 'fire',
    actionPrompt: 'What challenge will you name? What boundary needs honoring?',
  },
  {
    id: 'propose_move',
    canonicalMoveId: 'wood_fire',
    title: 'Declare Intention',
    description: 'Convert your momentum into a clear next action. No hedging, no "maybe" — declare what you will do.',
    narrative: 'Momentum into action',
    energyDelta: 1,
    element: 'fire',
    actionPrompt: 'What intention will you declare? What action are you committing to?',
  },
]

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ActionPhaseState {
  /** Which Challenger move was selected */
  selectedMove: ChallengerMoveChoice
  /** Player's free-text response to the action prompt (non-AI path) */
  response: string
}

export interface ActionPhaseStepProps {
  /** Callback when the player completes the Action phase */
  onComplete: (state: ActionPhaseState) => void
  /** Callback to go back to Intake phase */
  onBack?: () => void
  /** Current altitude from Intake phase (should be 'neutral' entering Action) */
  currentAltitude: AlchemyAltitude
  /** Optional: pre-selected move (for resuming) */
  initialMoveId?: 'issue_challenge' | 'propose_move'
  /** Optional: pre-filled response (for resuming) */
  initialResponse?: string
  /** Whether the component is in a pending/loading state */
  isPending?: boolean
  /**
   * AI-generated or template bank passage content.
   * When provided, replaces the default static header text with
   * resolved content (situation, friction, invitation).
   * When null, falls back to hardcoded static text.
   * Non-AI first-class: component works fully without this prop.
   */
  passageContent?: PassageContent | null
  /** Whether passage content is currently being loaded from the server */
  isLoadingPassage?: boolean
}

// ─── Sub-step types ──────────────────────────────────────────────────────────

type ActionSubStep = 'choose_move' | 'respond' | 'confirm'

// ─── Component ───────────────────────────────────────────────────────────────

export function ActionPhaseStep({
  onComplete,
  onBack,
  currentAltitude,
  initialMoveId,
  initialResponse,
  isPending = false,
  passageContent = null,
  isLoadingPassage = false,
}: ActionPhaseStepProps) {
  const [subStep, setSubStep] = useState<ActionSubStep>(
    initialMoveId ? 'respond' : 'choose_move'
  )
  const [selectedMove, setSelectedMove] = useState<ChallengerMoveChoice | null>(
    initialMoveId ? CHALLENGER_MOVES.find(m => m.id === initialMoveId) ?? null : null
  )
  const [response, setResponse] = useState(initialResponse ?? '')
  const [hoveredMove, setHoveredMove] = useState<string | null>(null)

  const challengerMeta = FACE_META.challenger
  const fireTokens = ELEMENT_TOKENS.fire

  // ─── Sub-step: Choose Move ────────────────────────────────────────────────

  if (subStep === 'choose_move') {
    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        className="p-5"
      >
        <div className="space-y-4">
          {/* Phase header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 2 of 3 · Action
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${fireTokens.badgeBg} ${challengerMeta.color} font-medium`}>
                {challengerMeta.label}
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              {passageContent?.invitation
                ? passageContent.invitation
                : 'The Challenger speaks'}
            </h3>
            {/* When AI/template passage content is available, render the full narrative */}
            {(passageContent || isLoadingPassage) ? (
              <PassageNarrative
                passage={passageContent}
                isLoading={isLoadingPassage}
                element="fire"
                className="mt-2"
              />
            ) : (
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                You&apos;ve named your dissatisfaction. Now it&apos;s time to act.
                Choose your move — the Challenger doesn&apos;t wait.
              </p>
            )}
          </div>

          {/* Move choices */}
          <div className="grid grid-cols-1 gap-3">
            {CHALLENGER_MOVES.map((move) => {
              const isHovered = hoveredMove === move.id
              return (
                <button
                  key={move.id}
                  onClick={() => {
                    setSelectedMove(move)
                    setSubStep('respond')
                  }}
                  onMouseEnter={() => setHoveredMove(move.id)}
                  onMouseLeave={() => setHoveredMove(null)}
                  disabled={isPending}
                  className={`
                    group relative text-left rounded-lg border transition-all duration-200
                    ${fireTokens.border} ${fireTokens.bg}
                    hover:border-orange-500/70 hover:bg-orange-950/50
                    active:scale-[0.98]
                    disabled:opacity-40 disabled:pointer-events-none
                    p-4
                  `}
                  aria-label={`Choose ${move.title}: ${move.description}`}
                >
                  {/* Move title + energy badge */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className={`text-sm font-semibold ${fireTokens.textAccent} group-hover:text-orange-200 transition-colors`}>
                      {move.title}
                    </h4>
                    <span
                      className={`
                        shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded
                        ${move.energyDelta >= 2
                          ? 'bg-orange-800/60 text-orange-300'
                          : 'bg-amber-900/50 text-amber-300'
                        }
                      `}
                    >
                      {move.energyDelta >= 0 ? '+' : ''}{move.energyDelta} energy
                    </span>
                  </div>

                  {/* Move description */}
                  <p className="text-xs text-zinc-400 leading-relaxed mb-2">
                    {move.description}
                  </p>

                  {/* Narrative + move type hint */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600 italic">
                      {move.narrative}
                    </span>
                    <span className={`
                      text-[10px] uppercase tracking-wider
                      ${isHovered ? 'text-orange-400' : 'text-zinc-600'}
                      transition-colors
                    `}>
                      {move.canonicalMoveId === 'fire_transcend' ? 'Transcend' : 'Generative'} →
                    </span>
                  </div>

                  {/* Hover indicator bar */}
                  <div
                    className={`
                      absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg
                      bg-gradient-to-r from-orange-600 to-red-600
                      transition-opacity duration-200
                      ${isHovered ? 'opacity-100' : 'opacity-0'}
                    `}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>

          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ← Back to Intake
            </button>
          )}
        </div>
      </CultivationCard>
    )
  }

  // ─── Sub-step: Respond ────────────────────────────────────────────────────

  if (subStep === 'respond' && selectedMove) {
    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        className="p-5"
      >
        <div className="space-y-4">
          {/* Header with selected move context */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 2 of 3 · Action
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${fireTokens.badgeBg} ${challengerMeta.color} font-medium`}>
                {selectedMove.title}
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              {selectedMove.actionPrompt}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Speak plainly. The Challenger values honesty over eloquence.
            </p>
          </div>

          {/* Response textarea */}
          <div className="space-y-2">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={
                selectedMove.id === 'issue_challenge'
                  ? 'I challenge myself to...'
                  : 'I declare my intention to...'
              }
              rows={4}
              disabled={isPending}
              className={`
                w-full rounded-lg px-3 py-2.5
                bg-zinc-900/60 border ${fireTokens.border}
                text-sm text-zinc-200 placeholder:text-zinc-600
                focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30
                resize-none transition
                disabled:opacity-40
              `}
              aria-label={`Your response to: ${selectedMove.actionPrompt}`}
            />
            <p className="text-[10px] text-zinc-600">
              {response.length > 0
                ? `${response.length} characters — no minimum required`
                : 'Write as much or as little as feels honest'
              }
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubStep('choose_move')}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ← Different move
            </button>
            <button
              onClick={() => setSubStep('confirm')}
              disabled={isPending || response.trim().length === 0}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-medium transition
                ${response.trim().length > 0
                  ? `${fireTokens.badgeBg} border ${fireTokens.border} ${fireTokens.textAccent} hover:opacity-90`
                  : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              Commit to this →
            </button>
          </div>
        </div>
      </CultivationCard>
    )
  }

  // ─── Sub-step: Confirm ────────────────────────────────────────────────────

  if (subStep === 'confirm' && selectedMove) {
    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        ritual
        className="p-5"
      >
        <div className="space-y-4">
          {/* Confirmation header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 2 of 3 · Confirm Action
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              The Challenger witnesses your commitment
            </h3>
          </div>

          {/* Summary card */}
          <div className={`rounded-lg border ${fireTokens.border} ${fireTokens.bg} p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${fireTokens.textAccent}`}>
                {selectedMove.title}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {selectedMove.energyDelta >= 0 ? '+' : ''}{selectedMove.energyDelta} energy
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{response.trim()}&rdquo;
            </p>
            <p className="text-[10px] text-zinc-600">
              {selectedMove.narrative}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubStep('respond')}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ← Edit response
            </button>
            <button
              onClick={() => {
                onComplete({
                  selectedMove,
                  response: response.trim(),
                })
              }}
              disabled={isPending}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-medium transition
                bg-gradient-to-r from-orange-700/80 to-red-700/80
                border ${fireTokens.border}
                ${fireTokens.textAccent}
                hover:from-orange-600/80 hover:to-red-600/80
                active:scale-[0.98]
                disabled:opacity-40 disabled:pointer-events-none
              `}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-orange-300/40 border-t-orange-300 rounded-full animate-spin" />
                  Committing...
                </span>
              ) : (
                'Seal this action →'
              )}
            </button>
          </div>
        </div>
      </CultivationCard>
    )
  }

  // Fallback — should not reach here
  return null
}
