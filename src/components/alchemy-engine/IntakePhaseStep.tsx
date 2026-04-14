'use client'

/**
 * IntakePhaseStep — Intake phase CYOA step for the Alchemy Engine vertical slice.
 *
 * Phase 1 of 3: Intake (dissatisfied) → Action (neutral) → Reflection (epiphany)
 *
 * Design:
 *   - Challenger face = Fire element, cinnabar frame
 *   - Wake Up WAVE move context: first awareness, naming what's stuck
 *   - Player names their dissatisfaction via CYOA selection OR freeform text
 *   - Non-AI path is first-class: all prompts are GM-authored
 *   - Completing Intake advances regulation: dissatisfied → neutral
 *   - Output flows to ActionPhaseStep as the context for Challenger moves
 *
 * Uses CultivationCard with fire element at dissatisfied altitude (phase 1).
 * Follows DailyCheckInQuest wizard step pattern.
 *
 * @see src/components/alchemy-engine/ActionPhaseStep.tsx — next phase
 * @see src/lib/alchemy-engine/types.ts — PHASE_REGULATION_MAP.intake
 */

import { useState } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { FACE_META } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import { PassageNarrative, type PassageContent } from './PassageNarrative'

// ─── CYOA Intake Prompts (GM-authored, non-AI) ─────────────────────────────

export interface IntakePrompt {
  id: string
  title: string
  description: string
  /** Placeholder text for freeform elaboration */
  placeholder: string
}

/**
 * Default CYOA intake prompts for Challenger + Wake Up vertical slice.
 * Each represents a common pattern of dissatisfaction the Challenger names.
 */
export const DEFAULT_INTAKE_PROMPTS: IntakePrompt[] = [
  {
    id: 'avoiding',
    title: 'Something I\'ve been avoiding',
    description: 'There\'s a thing you keep not looking at. The Challenger sees it. Name it.',
    placeholder: 'The thing I\'ve been avoiding is...',
  },
  {
    id: 'stuck',
    title: 'A place I feel stuck',
    description: 'Stuckness is a signal, not a sentence. Where are you stuck, and what does the stuckness feel like?',
    placeholder: 'I feel stuck because...',
  },
  {
    id: 'tension',
    title: 'A tension I\'m holding',
    description: 'Two things that don\'t fit together. The Challenger doesn\'t resolve tensions — they name them.',
    placeholder: 'The tension I\'m holding is between...',
  },
]

// ─── Output types ───────────────────────────────────────────────────────────

export interface IntakePhaseState {
  /** Which intake prompt was selected (or 'freeform' if none) */
  promptId: string
  /** The player's response text — their named dissatisfaction */
  content: string
  /** Title for the Intake BAR */
  title: string
}

// ─── Props ──────────────────────────────────────────────────────────────────

export interface IntakePhaseStepProps {
  /** Callback when the player completes the Intake phase */
  onComplete: (state: IntakePhaseState) => void
  /** Current altitude (should be 'dissatisfied' for intake) */
  currentAltitude: AlchemyAltitude
  /** Current emotional channel name for display context */
  channelName?: string
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

// ─── Sub-step types ─────────────────────────────────────────────────────────

type IntakeSubStep = 'choose_prompt' | 'respond' | 'confirm'

// ─── Component ──────────────────────────────────────────────────────────────

export function IntakePhaseStep({
  onComplete,
  currentAltitude,
  channelName,
  isPending = false,
  passageContent = null,
  isLoadingPassage = false,
}: IntakePhaseStepProps) {
  const [subStep, setSubStep] = useState<IntakeSubStep>('choose_prompt')
  const [selectedPrompt, setSelectedPrompt] = useState<IntakePrompt | null>(null)
  const [response, setResponse] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const challengerMeta = FACE_META.challenger
  const fireTokens = ELEMENT_TOKENS.fire

  // ─── Sub-step: Choose Prompt ──────────────────────────────────────────────

  if (subStep === 'choose_prompt') {
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
                Phase 1 of 3 · Intake
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${fireTokens.badgeBg} ${challengerMeta.color} font-medium`}>
                {challengerMeta.label}
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              {passageContent?.invitation
                ? passageContent.invitation
                : 'The Challenger asks: what\u2019s wrong?'}
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
                Something brought you here. Name it — even if it&apos;s messy.
                The Challenger doesn&apos;t need polish; they need honesty.
              </p>
            )}
            {channelName && (
              <span className="block mt-1 text-[10px] text-zinc-500">
                Channel: {channelName}
              </span>
            )}
          </div>

          {/* Prompt choices */}
          <div className="grid grid-cols-1 gap-3">
            {DEFAULT_INTAKE_PROMPTS.map((prompt) => {
              const isHovered = hoveredId === prompt.id
              return (
                <button
                  key={prompt.id}
                  onClick={() => {
                    setSelectedPrompt(prompt)
                    setSubStep('respond')
                  }}
                  onMouseEnter={() => setHoveredId(prompt.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  disabled={isPending}
                  className={`
                    group relative text-left rounded-lg border transition-all duration-200
                    ${fireTokens.border} ${fireTokens.bg}
                    hover:border-orange-500/70 hover:bg-orange-950/50
                    active:scale-[0.98]
                    disabled:opacity-40 disabled:pointer-events-none
                    p-4
                  `}
                  aria-label={`Select: ${prompt.title}`}
                >
                  <h4 className={`text-sm font-semibold ${fireTokens.textAccent} group-hover:text-orange-200 transition-colors mb-1`}>
                    {prompt.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {prompt.description}
                  </p>

                  {/* Hover indicator */}
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
        </div>
      </CultivationCard>
    )
  }

  // ─── Sub-step: Respond ────────────────────────────────────────────────────

  if (subStep === 'respond' && selectedPrompt) {
    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        className="p-5"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 1 of 3 · Intake
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${fireTokens.badgeBg} ${challengerMeta.color} font-medium`}>
                {selectedPrompt.title}
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              Name it
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {selectedPrompt.description}
            </p>
          </div>

          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder={selectedPrompt.placeholder}
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
            aria-label={`Your response: ${selectedPrompt.placeholder}`}
          />
          <p className="text-[10px] text-zinc-600">
            {response.length > 0
              ? `${response.length} characters`
              : 'Write as much or as little as feels honest'
            }
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubStep('choose_prompt')}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              ← Different prompt
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
              Name this →
            </button>
          </div>
        </div>
      </CultivationCard>
    )
  }

  // ─── Sub-step: Confirm ────────────────────────────────────────────────────

  if (subStep === 'confirm' && selectedPrompt) {
    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        ritual
        className="p-5"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 1 of 3 · Confirm Intake
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              The Challenger hears you
            </h3>
          </div>

          <div className={`rounded-lg border ${fireTokens.border} ${fireTokens.bg} p-3 space-y-2`}>
            <span className={`text-xs font-medium ${fireTokens.textAccent}`}>
              {selectedPrompt.title}
            </span>
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{response.trim()}&rdquo;
            </p>
            <span className="text-[10px] text-zinc-600">
              dissatisfied → neutral (naming unlocks action)
            </span>
          </div>

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
                  promptId: selectedPrompt.id,
                  content: response.trim(),
                  title: selectedPrompt.title,
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
                  Naming...
                </span>
              ) : (
                'Seal this naming →'
              )}
            </button>
          </div>
        </div>
      </CultivationCard>
    )
  }

  return null
}
