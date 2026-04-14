'use client'

/**
 * ReflectionPhaseStep — Reflection phase CYOA step for the Alchemy Engine vertical slice.
 *
 * Phase 3 of 3: Intake (dissatisfied) -> Action (neutral) -> Reflection (epiphany)
 *
 * Design:
 *   - The Reflection BAR IS the epiphany artifact (no separate Epiphany model)
 *   - Default path: CYOA-generated completion options (non-AI first-class)
 *   - Opt-in alternative: freeform writing for players who want to author their own epiphany
 *   - Challenger face + Wake Up WAVE move context: confrontation -> integration -> insight
 *   - Fire element UI at neutral altitude (entering Reflection = neutral regulation)
 *   - Completing Reflection advances regulation: neutral -> satisfied (= epiphany)
 *
 * Sub-steps:
 *   1. choose_mode — Select CYOA completions OR opt into freeform writing
 *   2. cyoa_select — Pick from CYOA-generated reflection completions (default path)
 *   3. cyoa_edit — Inline edit/customize the selected completion (text editing, save, revert)
 *   4. freeform_write — Write your own reflection (opt-in alternative)
 *   5. confirm — Review and seal the Reflection BAR (= epiphany)
 *
 * Non-AI path is first-class: CYOA completions are GM-authored template content,
 * freeform writing requires no AI. AI-generated completions are an enhancement
 * layered on top when available.
 *
 * @see src/components/alchemy-engine/ActionPhaseStep.tsx — sibling component pattern
 * @see src/lib/alchemy-engine/types.ts — PHASE_REGULATION_MAP.reflection: neutral -> satisfied
 */

import { useState } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { FACE_META } from '@/lib/quest-grammar/types'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import { CompletionOptionsList, type CompletionOption, type CompletionSelectionState } from './CompletionOptionsList'
import { CompletionEditor, type CompletionEditState } from './CompletionEditor'
import { PassageNarrative, type PassageContent } from './PassageNarrative'

// ---------------------------------------------------------------------------
// CYOA Reflection Completion — GM-authored or AI-generated options
// ---------------------------------------------------------------------------

/**
 * A single CYOA reflection completion option.
 *
 * These represent pre-written (GM-authored) or AI-generated epiphany
 * completions that the player selects from. The selected completion
 * becomes the Reflection BAR content (= the epiphany artifact).
 */
export interface ReflectionCompletion {
  /** Unique key for this completion */
  id: string
  /** Short title/label for the completion */
  title: string
  /** The full reflection text — this becomes the BAR content */
  content: string
  /** Optional tone hint for the player */
  tone?: 'confrontational' | 'integrative' | 'transcendent'
  /** Source provenance: gm-authored template bank or ai-generated */
  source: 'template' | 'ai'
}

/**
 * Default CYOA completions for Challenger + Wake Up vertical slice.
 * GM-authored template bank content — no AI required.
 *
 * These represent archetypal epiphany patterns for the Challenger face:
 * each one transforms the "wake up" confrontation into integrated insight.
 */
export const DEFAULT_CHALLENGER_REFLECTIONS: ReflectionCompletion[] = [
  {
    id: 'boundary_honored',
    title: 'The boundary was the breakthrough',
    content: 'What I thought was resistance was actually a boundary asking to be honored. The challenge wasn\'t to push through — it was to recognize what I was protecting and why it matters. The anger was a compass, not a cage.',
    tone: 'integrative',
    source: 'template',
  },
  {
    id: 'naming_freed',
    title: 'Naming it set me free',
    content: 'The moment I named it out loud, the weight shifted. Not gone — but distributed differently. The thing I was avoiding wasn\'t as large as its shadow. Speaking it made it real, and real things can be worked with.',
    tone: 'confrontational',
    source: 'template',
  },
  {
    id: 'wake_up_moment',
    title: 'I was asleep to this',
    content: 'I wasn\'t stuck — I was asleep. The dissatisfaction was an alarm I\'d been hitting snooze on. Waking up doesn\'t mean the problem is solved. It means I can finally see it clearly enough to begin.',
    tone: 'transcendent',
    source: 'template',
  },
]

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

/** The mode the player used to create their Reflection BAR. */
export type ReflectionMode = 'cyoa' | 'freeform'

/** State produced when the Reflection phase is completed. */
export interface ReflectionPhaseState {
  /** How the player created their reflection: CYOA selection or freeform writing */
  mode: ReflectionMode
  /** The reflection content that becomes the Reflection BAR (= epiphany artifact) */
  content: string
  /** Title for the Reflection BAR */
  title: string
  /** If CYOA mode, which completion was selected */
  selectedCompletionId?: string
  /** If CYOA mode, whether the player customized/edited the selected completion */
  isCustomized?: boolean
  /** If freeform mode, the raw player-authored text */
  freeformText?: string
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ReflectionPhaseStepProps {
  /** Callback when the player completes the Reflection phase (= epiphany) */
  onComplete: (state: ReflectionPhaseState) => void
  /** Callback to go back to Action phase */
  onBack?: () => void
  /** Current altitude (should be 'neutral' entering Reflection) */
  currentAltitude: AlchemyAltitude
  /** Current emotional channel name for display context */
  channelName?: string
  /**
   * CYOA reflection completions to offer.
   * Falls back to DEFAULT_CHALLENGER_REFLECTIONS if not provided.
   * Allows GM-authored template bank or AI-generated options.
   */
  completions?: ReflectionCompletion[]
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

// ---------------------------------------------------------------------------
// Sub-step types
// ---------------------------------------------------------------------------

type ReflectionSubStep = 'choose_mode' | 'cyoa_select' | 'cyoa_edit' | 'freeform_write' | 'confirm'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREEFORM_MIN_LENGTH = 20
const FREEFORM_PLACEHOLDER = 'What did this arc reveal to you? Write your own reflection...\n\nThere is no wrong answer. The Challenger values honesty over eloquence.'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReflectionPhaseStep({
  onComplete,
  onBack,
  currentAltitude,
  channelName,
  completions,
  isPending = false,
  passageContent = null,
  isLoadingPassage = false,
}: ReflectionPhaseStepProps) {
  const reflectionOptions = completions ?? DEFAULT_CHALLENGER_REFLECTIONS

  const [subStep, setSubStep] = useState<ReflectionSubStep>('choose_mode')
  const [selectedCompletion, setSelectedCompletion] = useState<ReflectionCompletion | null>(null)
  const [editedContent, setEditedContent] = useState<string | null>(null)
  const [editIsCustomized, setEditIsCustomized] = useState(false)
  const [freeformText, setFreeformText] = useState('')
  const [freeformTitle, setFreeformTitle] = useState('')

  const challengerMeta = FACE_META.challenger
  const fireTokens = ELEMENT_TOKENS.fire

  // Derived state
  const freeformValid = freeformText.trim().length >= FREEFORM_MIN_LENGTH

  // The content used for the BAR: edited content (if customized) or original
  const resolvedContent = selectedCompletion
    ? (editedContent ?? selectedCompletion.content)
    : null

  const confirmState: ReflectionPhaseState | null =
    subStep === 'confirm'
      ? selectedCompletion && resolvedContent
        ? {
            mode: 'cyoa',
            content: resolvedContent,
            title: selectedCompletion.title,
            selectedCompletionId: selectedCompletion.id,
            isCustomized: editIsCustomized,
          }
        : freeformValid
        ? {
            mode: 'freeform',
            content: freeformText.trim(),
            title: freeformTitle.trim() || 'My Reflection',
            freeformText: freeformText.trim(),
          }
        : null
      : null

  // ── Sub-step: Choose Mode ────────────────────────────────────────────────

  if (subStep === 'choose_mode') {
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
                Phase 3 of 3 · Reflection
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${fireTokens.badgeBg} ${challengerMeta.color} font-medium`}>
                {challengerMeta.label}
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              {passageContent?.invitation
                ? passageContent.invitation
                : 'The Challenger asks: what did you see?'}
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
                You named your dissatisfaction. You committed to action.
                Now — what does the view look like from here?
              </p>
            )}
            {channelName && (
              <span className="block mt-1 text-[10px] text-zinc-500">
                Channel: {channelName}
              </span>
            )}
          </div>

          {/* Mode selection */}
          <div className="grid grid-cols-1 gap-3">
            {/* CYOA path (default) */}
            <button
              onClick={() => setSubStep('cyoa_select')}
              disabled={isPending}
              className={`
                group relative text-left rounded-lg border transition-all duration-200
                ${fireTokens.border} ${fireTokens.bg}
                hover:border-orange-500/70 hover:bg-orange-950/50
                active:scale-[0.98]
                disabled:opacity-40 disabled:pointer-events-none
                p-4
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className={`text-sm font-semibold ${fireTokens.textAccent} group-hover:text-orange-200 transition-colors`}>
                  Choose a reflection
                </h4>
                <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-800/60 text-orange-300">
                  recommended
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Select from crafted reflections that capture the arc of your journey.
                Each one transforms what you faced into integrated insight.
              </p>
            </button>

            {/* Freeform path (opt-in) */}
            <button
              onClick={() => setSubStep('freeform_write')}
              disabled={isPending}
              className={`
                group relative text-left rounded-lg border transition-all duration-200
                border-zinc-700/60 bg-zinc-900/30
                hover:border-amber-600/50 hover:bg-zinc-900/50
                active:scale-[0.98]
                disabled:opacity-40 disabled:pointer-events-none
                p-4
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-zinc-300 group-hover:text-amber-200 transition-colors">
                  Write your own
                </h4>
                <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/60 text-zinc-400">
                  freeform
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Author your own epiphany in your own words.
                No templates, no prompts — just you and the page.
              </p>
            </button>
          </div>

          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              &larr; Back to Action
            </button>
          )}
        </div>
      </CultivationCard>
    )
  }

  // ── Sub-step: CYOA Select ────────────────────────────────────────────────

  // Map ReflectionCompletion[] to CompletionOption[] for the reusable list
  const completionOptions: CompletionOption[] = reflectionOptions.map((c) => ({
    id: c.id,
    title: c.title,
    content: c.content,
    label: c.tone,
    source: c.source,
  }))

  const handleCompletionSelectionChange = (state: CompletionSelectionState) => {
    if (state.selectedOption) {
      const found = reflectionOptions.find(r => r.id === state.selectedId)
      setSelectedCompletion(found ?? null)
    } else {
      setSelectedCompletion(null)
    }
  }

  const handleCompletionConfirm = (_option: CompletionOption) => {
    // selectedCompletion is already set via onSelectionChange
    // Go to edit step where player can customize before sealing
    if (selectedCompletion) {
      // Reset edit state for the newly selected completion
      setEditedContent(null)
      setEditIsCustomized(false)
      setSubStep('cyoa_edit')
    }
  }

  if (subStep === 'cyoa_select') {
    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        className="p-5"
      >
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 3 of 3 · Reflection
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${fireTokens.badgeBg} ${challengerMeta.color} font-medium`}>
                Choose Your Insight
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              Which truth landed?
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Select the reflection that resonates most. This becomes your epiphany artifact.
            </p>
          </div>

          {/* Completion choices — using CompletionOptionsList */}
          <CompletionOptionsList
            options={completionOptions}
            selectedId={selectedCompletion?.id ?? null}
            onSelectionChange={handleCompletionSelectionChange}
            onConfirm={handleCompletionConfirm}
            element="fire"
            disabled={isPending}
            showConfirmButton={true}
            confirmLabel="Seal this insight"
            allowDeselect={true}
            groupLabel="Reflection completion options"
          />

          {/* Switch to freeform */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSubStep('choose_mode')}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              &larr; Back
            </button>
            <button
              onClick={() => setSubStep('freeform_write')}
              disabled={isPending}
              className="text-xs text-amber-600/70 hover:text-amber-500 transition-colors"
            >
              Or write your own &rarr;
            </button>
          </div>
        </div>
      </CultivationCard>
    )
  }

  // ── Sub-step: CYOA Edit/Customize ─────────────────────────────────────────
  // After selecting a completion, the player can customize its text before
  // sealing it as their Reflection BAR (= epiphany artifact).
  // This step uses the CompletionEditor for inline text editing with
  // save and revert functionality.

  if (subStep === 'cyoa_edit' && selectedCompletion) {
    const handleEditStateChange = (state: CompletionEditState) => {
      setEditedContent(state.content)
      setEditIsCustomized(state.isCustomized)
    }

    const handleEditConfirm = (state: CompletionEditState) => {
      setEditedContent(state.content)
      setEditIsCustomized(state.isCustomized)
      setSubStep('confirm')
    }

    const handleEditCancel = () => {
      // Go back to selection — keep the selection but reset edits
      setEditedContent(null)
      setEditIsCustomized(false)
      setSubStep('cyoa_select')
    }

    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        className="p-5"
      >
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 3 of 3 · Reflection
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${fireTokens.badgeBg} ${challengerMeta.color} font-medium`}>
                Customize Your Insight
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              Make it yours
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              This reflection becomes your epiphany artifact. Customize the text to fit
              your experience, or seal it as-is.
            </p>
          </div>

          {/* Inline editor */}
          <CompletionEditor
            title={selectedCompletion.title}
            originalContent={selectedCompletion.content}
            source={selectedCompletion.source}
            tone={selectedCompletion.tone}
            element="fire"
            minLength={FREEFORM_MIN_LENGTH}
            disabled={isPending}
            onEditStateChange={handleEditStateChange}
            onConfirm={handleEditConfirm}
            onCancel={handleEditCancel}
          />
        </div>
      </CultivationCard>
    )
  }

  // ── Sub-step: Freeform Write (opt-in alternative) ────────────────────────

  if (subStep === 'freeform_write') {
    return (
      <CultivationCard
        element="fire"
        altitude={currentAltitude}
        stage="growing"
        className="p-5"
      >
        <div className="space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] uppercase tracking-widest ${fireTokens.textAccent} opacity-70`}>
                Phase 3 of 3 · Reflection
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 font-medium">
                Freeform
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              Write your own epiphany
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              This is your artifact. No one else needs to read it — but it needs to be honest.
              What shifted? What do you see now that you couldn&apos;t before?
            </p>
          </div>

          {/* Title input (optional) */}
          <div className="space-y-1">
            <label
              htmlFor="reflection-title"
              className="text-[10px] uppercase tracking-wider text-zinc-600"
            >
              Title (optional)
            </label>
            <input
              id="reflection-title"
              type="text"
              value={freeformTitle}
              onChange={(e) => setFreeformTitle(e.target.value)}
              placeholder="Name this insight..."
              disabled={isPending}
              className={`
                w-full rounded-lg px-3 py-2
                bg-zinc-900/60 border border-zinc-700/60
                text-sm text-zinc-200 placeholder:text-zinc-600
                focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30
                transition
                disabled:opacity-40
              `}
            />
          </div>

          {/* Freeform textarea */}
          <div className="space-y-1">
            <label
              htmlFor="reflection-freeform"
              className="text-[10px] uppercase tracking-wider text-zinc-600"
            >
              Your Reflection
            </label>
            <textarea
              id="reflection-freeform"
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder={FREEFORM_PLACEHOLDER}
              rows={6}
              disabled={isPending}
              className={`
                w-full rounded-lg px-3 py-2.5
                bg-zinc-900/60 border ${freeformValid ? 'border-amber-600/50' : 'border-zinc-700/60'}
                text-sm text-zinc-200 placeholder:text-zinc-600
                focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30
                resize-y min-h-[120px] transition
                disabled:opacity-40
              `}
              aria-label="Write your own reflection"
            />
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-zinc-600">
                {freeformText.trim().length > 0
                  ? freeformValid
                    ? `${freeformText.trim().length} characters`
                    : `${freeformText.trim().length} / ${FREEFORM_MIN_LENGTH} minimum characters`
                  : `Minimum ${FREEFORM_MIN_LENGTH} characters`
                }
              </p>
              {freeformValid && (
                <span className="text-[10px] text-amber-500/70">
                  Ready to seal
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubStep('choose_mode')}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              &larr; Back
            </button>
            <button
              onClick={() => {
                setSelectedCompletion(null)
                setSubStep('confirm')
              }}
              disabled={isPending || !freeformValid}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-medium transition
                ${freeformValid
                  ? 'bg-amber-900/40 border border-amber-700/50 text-amber-200 hover:opacity-90'
                  : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-600 cursor-not-allowed'
                }
              `}
            >
              Seal this reflection &rarr;
            </button>
          </div>
        </div>
      </CultivationCard>
    )
  }

  // ── Sub-step: Confirm ────────────────────────────────────────────────────

  if (subStep === 'confirm' && confirmState) {
    const isFreeform = confirmState.mode === 'freeform'
    const isCyoaCustomized = confirmState.mode === 'cyoa' && confirmState.isCustomized

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
                Phase 3 of 3 · Seal Epiphany
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                isFreeform
                  ? 'bg-amber-900/50 text-amber-300'
                  : `${fireTokens.badgeBg} text-orange-300`
              } font-medium`}>
                {isFreeform ? 'your words' : isCyoaCustomized ? 'customized' : 'crafted'}
              </span>
            </div>
            <h3 className={`text-base font-semibold ${fireTokens.textAccent}`}>
              The Challenger witnesses your epiphany
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              This reflection becomes your epiphany artifact — a BAR that marks your transformation.
            </p>
          </div>

          {/* Summary card */}
          <div className={`rounded-lg border ${fireTokens.border} ${fireTokens.bg} p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${fireTokens.textAccent}`}>
                {confirmState.title}
              </span>
              <div className="flex items-center gap-1.5">
                {isCyoaCustomized && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-800/60 text-orange-300">
                    edited
                  </span>
                )}
                <span className="text-[10px] font-mono text-zinc-500">
                  reflection BAR
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed italic">
              &ldquo;{confirmState.content}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600">
                {isFreeform
                  ? 'Authored by you'
                  : isCyoaCustomized
                  ? 'Customized reflection'
                  : 'Selected reflection'}
              </span>
              <span className="text-[10px] text-zinc-600">
                neutral &rarr; satisfied (epiphany)
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (isFreeform) {
                  setSubStep('freeform_write')
                } else {
                  // Go back to the edit step so they can customize further
                  setSubStep('cyoa_edit')
                }
              }}
              disabled={isPending}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              &larr; {isFreeform ? 'Edit reflection' : 'Edit / Customize'}
            </button>
            <button
              onClick={() => {
                if (!isFreeform) {
                  // Reset edit state and go back to pick a different one
                  setEditedContent(null)
                  setEditIsCustomized(false)
                  setSubStep('cyoa_select')
                }
              }}
              disabled={isPending || isFreeform}
              className={`text-xs transition-colors ${
                isFreeform ? 'hidden' : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              Different choice
            </button>
            <button
              onClick={() => onComplete(confirmState)}
              disabled={isPending}
              className={`
                flex-1 py-2.5 rounded-lg text-sm font-medium transition
                bg-gradient-to-r from-orange-700/80 to-amber-700/80
                border ${fireTokens.border}
                ${fireTokens.textAccent}
                hover:from-orange-600/80 hover:to-amber-600/80
                active:scale-[0.98]
                disabled:opacity-40 disabled:pointer-events-none
              `}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-3 h-3 border-2 border-orange-300/40 border-t-orange-300 rounded-full animate-spin" />
                  Sealing epiphany...
                </span>
              ) : (
                'Seal this epiphany \u2192'
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
