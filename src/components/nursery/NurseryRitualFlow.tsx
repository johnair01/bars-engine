'use client'

import { useState, useCallback } from 'react'
import type { MoveDefinition } from '@/lib/nation/move-library-accessor'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { FACE_META } from '@/lib/quest-grammar/types'
import { ThreeTwoOneDialogue } from './ThreeTwoOneDialogue'
import { StructuredBarReflection } from './StructuredBarReflection'

/**
 * NurseryRitualFlow — the move-driven ritual renderer.
 *
 * Replaces the Twee-based adventure runner for nursery rituals.
 * Switches UI based on move_category:
 *   awareness (Wake Up) → core_prompt + text reflection
 *   emotional_processing (Clean Up) → core_prompt + 3-2-1 dialogue
 *   behavioral_experiment (Grow Up) → core_prompt + action commitment
 *   action (Show Up) → core_prompt + action confirmation
 *
 * After the core ritual, renders StructuredBarReflection for the BAR.
 */

type Phase = 'intro' | 'core' | 'bar' | 'complete'

type Props = {
  nationMove: MoveDefinition
  archetypeMove?: MoveDefinition
  face: GameMasterFace
  /** Campaign's allyship domain key (e.g., 'gather_resources') for domain translations */
  domain?: string
  onComplete: (result: {
    barText: string
    reflectionFields: Record<string, string>
    coreResponse: unknown
    moveId: string
  }) => void
  onClose: () => void
  /** Result from completeNurseryRitual — shown in completion phase */
  completionResult?: {
    barTitle: string
    vibeulonsAwarded: number
    planted: boolean
  } | null
}

/** Face-voiced intro framing per move category. */
const CATEGORY_INTROS: Record<string, Record<GameMasterFace, string>> = {
  awareness: {
    shaman: 'Close your eyes. Let us sense what is rising beneath the surface.',
    challenger: 'Look clearly. What truth are you avoiding? Name it.',
    regent: 'Before we act, we must see. What pattern governs this moment?',
    architect: 'Every system has a signal. What is yours telling you?',
    diplomat: 'Listen to the space between you and the world. What do you notice?',
    sage: 'Be still. Observe without judgment. What reveals itself?',
  },
  emotional_processing: {
    shaman: 'We enter the shadow now. The 3-2-1 dialogue will guide us safely through.',
    challenger: 'Face this directly. The shadow has something to teach you. Speak to it.',
    regent: 'There is an order to shadow work. Follow the three steps with discipline.',
    architect: 'We will systematically engage what is hidden. Trust the structure.',
    diplomat: 'Approach the shadow with care. It deserves the same compassion you give others.',
    sage: 'The shadow is not your enemy. It is the part of you waiting to be integrated.',
  },
  behavioral_experiment: {
    shaman: 'The ritual has prepared you. Now take one step beyond the threshold.',
    challenger: 'Enough reflection. Act. What is the smallest bold move you can make?',
    regent: 'Growth requires discipline. Choose one action and commit to it.',
    architect: 'Design your experiment. What specific action will test your edge?',
    diplomat: 'Invite someone into this with you. Growth is relational.',
    sage: 'The experiment is the teacher. Let the result instruct you.',
  },
  action: {
    shaman: 'You have done the inner work. Now carry it into the world.',
    challenger: 'This is the moment. Execute with full conviction.',
    regent: 'Fulfill your commitment. The community is watching.',
    architect: 'Deploy what you have built. Make it real.',
    diplomat: 'Show up for others as you have shown up for yourself.',
    sage: 'Act from the whole of who you are. Nothing is left behind.',
  },
}

export function NurseryRitualFlow({
  nationMove,
  archetypeMove,
  face,
  domain,
  onComplete,
  onClose,
  completionResult,
}: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [coreResponse, setCoreResponse] = useState<unknown>(null)

  const meta = FACE_META[face]
  const move = nationMove // Primary move; archetypeMove provides personal variation
  const categoryIntro = CATEGORY_INTROS[move.move_category]?.[face] ?? ''

  // Use domain translation if available, otherwise use base prompts
  const domainTrans = domain ? move.domain_translations[domain] : undefined
  const displayPrompt = domainTrans?.translated_prompt ?? move.core_prompt
  const displayAction = domainTrans?.translated_action ?? move.target_effect

  const handleCoreComplete = useCallback((response: unknown) => {
    setCoreResponse(response)
    setPhase('bar')
  }, [])

  const handleBarComplete = useCallback(
    (result: { barText: string; fields: Record<string, string> }) => {
      setPhase('complete')
      onComplete({
        barText: result.barText,
        reflectionFields: result.fields,
        coreResponse,
        moveId: move.move_id,
      })
    },
    [coreResponse, move.move_id, onComplete]
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className={`text-xs font-medium ${meta.color}`}>
              {meta.label} — {meta.role}
            </p>
            <h2 className="text-white font-bold text-lg">{move.move_name}</h2>
            {archetypeMove && (
              <p className="text-zinc-500 text-xs mt-0.5">
                Personal variation: {archetypeMove.move_name}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-400 text-sm"
          >
            Exit
          </button>
        </div>

        {/* Phase: Intro */}
        {phase === 'intro' && (
          <div className="space-y-5">
            <p className="text-zinc-400 text-sm italic">
              &ldquo;{categoryIntro}&rdquo;
            </p>
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3">
              <p className="text-zinc-300 text-sm">{move.purpose}</p>
            </div>
            <p className="text-zinc-500 text-xs">{move.description}</p>
            <button
              type="button"
              onClick={() => setPhase('core')}
              className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
            >
              I am ready
            </button>
          </div>
        )}

        {/* Phase: Core Ritual (varies by move_category) */}
        {phase === 'core' && move.move_category === 'emotional_processing' && (
          <ThreeTwoOneDialogue
            corePrompt={displayPrompt}
            onComplete={responses => handleCoreComplete(responses)}
            framing={categoryIntro}
          />
        )}

        {phase === 'core' && move.move_category === 'awareness' && (
          <AwarenessPrompt
            prompt={displayPrompt}
            action={displayAction}
            onComplete={text => handleCoreComplete(text)}
          />
        )}

        {phase === 'core' && move.move_category === 'behavioral_experiment' && (
          <ActionPrompt
            prompt={displayPrompt}
            action={displayAction}
            buttonLabel="I have done this"
            onComplete={text => handleCoreComplete(text)}
          />
        )}

        {phase === 'core' && move.move_category === 'action' && (
          <ActionPrompt
            prompt={displayPrompt}
            action={displayAction}
            buttonLabel="I have acted"
            onComplete={text => handleCoreComplete(text)}
          />
        )}

        {/* Phase: BAR Reflection */}
        {phase === 'bar' && (
          <StructuredBarReflection
            moveName={move.move_name}
            barIntegration={move.bar_integration}
            reflectionSchema={move.reflection_schema}
            onComplete={handleBarComplete}
          />
        )}

        {/* Phase: Complete */}
        {phase === 'complete' && (
          <div className="space-y-5 text-center">
            <div className="text-4xl">✦</div>
            <h3 className="text-white font-bold text-lg">
              {move.move_name} — Complete
            </h3>
            <p className="text-zinc-400 text-sm italic">
              &ldquo;{move.move_category === 'awareness'
                ? 'You have seen what was hidden. Carry this clarity forward.'
                : move.move_category === 'emotional_processing'
                ? 'The dialogue is complete. What was shadow is now part of you.'
                : move.move_category === 'behavioral_experiment'
                ? 'You stretched beyond your edge. New capacity is yours.'
                : 'You have acted. The world has shifted.'
              }&rdquo;
            </p>

            {/* BAR planted + vibeulons result */}
            {completionResult && (
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm font-medium">BAR Created</span>
                  {completionResult.planted && (
                    <span className="text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded">
                      Planted on spoke
                    </span>
                  )}
                </div>
                <p className="text-zinc-300 text-sm">{completionResult.barTitle}</p>
                {completionResult.vibeulonsAwarded > 0 && (
                  <p className="text-amber-400 text-xs">
                    +{completionResult.vibeulonsAwarded} vibeulon{completionResult.vibeulonsAwarded !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {!completionResult && (
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm">
                <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                Planting...
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={!completionResult}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
            >
              Return to nursery
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-components for awareness and action phases ─────────────────────────

function AwarenessPrompt({
  prompt,
  action,
  onComplete,
}: {
  prompt: string
  action: string
  onComplete: (text: string) => void
}) {
  const [text, setText] = useState('')

  return (
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm font-medium">{prompt}</p>
      <p className="text-zinc-500 text-xs">{action}</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your reflection here..."
        rows={5}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onComplete(text)}
        disabled={text.trim().length === 0}
        className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
      >
        Continue to reflection
      </button>
    </div>
  )
}

function ActionPrompt({
  prompt,
  action,
  buttonLabel,
  onComplete,
}: {
  prompt: string
  action: string
  buttonLabel: string
  onComplete: (text: string) => void
}) {
  const [text, setText] = useState('')

  return (
    <div className="space-y-4">
      <p className="text-zinc-300 text-sm font-medium">{prompt}</p>
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3">
        <p className="text-zinc-400 text-sm">{action}</p>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Describe what you committed to or did..."
        rows={4}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
        autoFocus
      />
      <button
        type="button"
        onClick={() => onComplete(text)}
        disabled={text.trim().length === 0}
        className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  )
}
