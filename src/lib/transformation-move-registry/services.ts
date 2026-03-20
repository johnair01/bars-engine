/**
 * Transformation Move Registry v0 — Selection and prompt services
 * Spec: .specify/specs/transformation-move-registry/spec.md
 */

import { CANONICAL_MOVES } from './registry'
import {
  getArchetypeInfluenceProfile,
  applyArchetypeOverlay,
} from '@/lib/archetype-influence-overlay'
import type {
  TransformationMove,
  WcgsStage,
  LockType,
  ParsedNarrative,
  QuestSeed,
  QuestSeedArc,
} from './types'

/** Get all moves in the registry. */
export function getAllMoves(): TransformationMove[] {
  return [...CANONICAL_MOVES]
}

/** Filter moves by WCGS stage. */
export function getMovesByStage(stage: WcgsStage): TransformationMove[] {
  return CANONICAL_MOVES.filter((m) => m.wcgs_stage === stage)
}

/** Filter moves by lock type compatibility. */
export function getMovesByLockType(lockType: LockType): TransformationMove[] {
  return CANONICAL_MOVES.filter((m) => m.compatible_lock_types.includes(lockType))
}

/** Filter moves by WCGS stage and lock type. */
export function getMovesByStageAndLock(
  stage: WcgsStage,
  lockType: LockType
): TransformationMove[] {
  return CANONICAL_MOVES.filter(
    (m) => m.wcgs_stage === stage && m.compatible_lock_types.includes(lockType)
  )
}

/** Get move by ID. */
export function getMoveById(moveId: string): TransformationMove | undefined {
  return CANONICAL_MOVES.find((m) => m.move_id === moveId)
}

/** Render a prompt template with parsed narrative variables. */
export function renderPromptTemplate(
  templateText: string,
  narrative: ParsedNarrative,
  context?: { emotion_channel?: string; nation_name?: string; archetype_name?: string }
): string {
  let result = templateText
  result = result.replace(/\{actor\}/g, narrative.actor)
  result = result.replace(/\{state\}/g, narrative.state)
  result = result.replace(/\{object\}/g, narrative.object)
  if (context?.emotion_channel) result = result.replace(/\{emotion_channel\}/g, context.emotion_channel)
  if (context?.nation_name) result = result.replace(/\{nation_name\}/g, context.nation_name)
  if (context?.archetype_name) result = result.replace(/\{archetype_name\}/g, context.archetype_name)
  return result
}

/** Pick first template for a move and render with narrative. */
export function renderMovePrompt(
  move: TransformationMove,
  narrative: ParsedNarrative,
  templateIndex = 0,
  context?: { emotion_channel?: string; nation_name?: string; archetype_name?: string }
): string {
  const template = move.prompt_templates[templateIndex] ?? move.prompt_templates[0]
  if (!template) return ''
  return renderPromptTemplate(template.template_text, narrative, context)
}

export type AssembleQuestSeedRenderContext = {
  emotion_channel?: string
  nation_name?: string
  archetype_name?: string
}

/** Assemble a standard quest seed from selected moves and parsed narrative. */
export function assembleQuestSeed(
  narrative: ParsedNarrative,
  lockType: LockType,
  moveIds: { wake: string; clean: string; grow: string; show: string; integrate: string },
  options?: {
    archetypeKey?: string | null
    /** Substitutions for `{emotion_channel}`, `{nation_name}`, `{archetype_name}` in move templates. */
    renderContext?: AssembleQuestSeedRenderContext
  }
): QuestSeed {
  const arc: QuestSeedArc = {}
  const seedId = `gen_${Date.now().toString(36)}`
  const ctx = options?.renderContext

  const wakeMove = getMoveById(moveIds.wake)
  if (wakeMove) {
    arc.wake = {
      move_id: wakeMove.move_id,
      prompt: renderMovePrompt(wakeMove, narrative, 0, ctx),
      output_type: wakeMove.typical_output_type,
    }
  }

  const cleanMove = getMoveById(moveIds.clean)
  if (cleanMove) {
    arc.clean = {
      move_id: cleanMove.move_id,
      prompt: renderMovePrompt(cleanMove, narrative, 0, ctx),
      output_type: cleanMove.typical_output_type,
    }
  }

  const growMove = getMoveById(moveIds.grow)
  if (growMove) {
    arc.grow = {
      move_id: growMove.move_id,
      prompt: renderMovePrompt(growMove, narrative, 0, ctx),
      output_type: growMove.typical_output_type,
    }
  }

  const showMove = getMoveById(moveIds.show)
  if (showMove) {
    arc.show = {
      move_id: showMove.move_id,
      prompt: renderMovePrompt(showMove, narrative, 0, ctx),
      output_type: showMove.typical_output_type,
    }
  }

  const integrateMove = getMoveById(moveIds.integrate)
  if (integrateMove?.bar_integration.bar_prompt_template) {
    const barPrompt = integrateMove.bar_integration.bar_prompt_template
      .replace(/\{object\}/g, narrative.object)
      .replace(/\{state\}/g, narrative.state)
    arc.integrate = {
      move_id: integrateMove.move_id,
      bar_prompt: barPrompt,
      bar_type: integrateMove.bar_integration.bar_type ?? 'insight',
    }
  }

  let seed: QuestSeed = {
    quest_seed_id: seedId,
    source_narrative: narrative.raw_text,
    lock_type: lockType,
    arc,
  }

  if (options?.archetypeKey) {
    const profile = getArchetypeInfluenceProfile(options.archetypeKey)
    if (profile) seed = applyArchetypeOverlay(seed, profile)
  }

  return seed
}
