/**
 * Twine Authoring IR → Twee for published quest proposals (FM T4.2).
 * @see .specify/specs/bar-quest-generation-engine/spec.md
 */

import { irToTwee, validateIrStory } from '@/lib/twine-authoring-ir'
import type { IRNode } from '@/lib/twine-authoring-ir'

export type QuestProposalTwineInput = {
  title: string
  description: string
  questType: string | null
  domain: string | null
  emotionalAlchemy: string
}

/**
 * Build a minimal 3-node IR story: intro → reflect → epilogue with [BIND quest_complete=…].
 */
export function buildIrNodesFromQuestProposal(
  input: QuestProposalTwineInput,
  publishedQuestId: string
): IRNode[] {
  let moveName = ''
  let prompt = ''
  let completionReflection = ''
  try {
    const ea = JSON.parse(input.emotionalAlchemy) as {
      moveName?: string | null
      prompt?: string | null
      completionReflection?: string | null
    }
    moveName = ea.moveName?.trim() ?? ''
    prompt = ea.prompt?.trim() ?? ''
    completionReflection = ea.completionReflection?.trim() ?? ''
  } catch {
    /* ignore */
  }

  const title = input.title.trim()
  const description = input.description.trim()

  const introParts = [`# ${title}`, '', description]
  if (input.domain?.trim()) introParts.push('', `Domain: ${input.domain.trim()}`)
  if (input.questType?.trim()) introParts.push(`Quest type: ${input.questType.trim()}`)

  const moveBlock = [moveName && `**${moveName}**`, prompt].filter(Boolean).join('\n\n')
  const startBody = [introParts.join('\n'), moveBlock].filter(Boolean).join('\n\n')

  const bindLine = `[BIND quest_complete=${publishedQuestId}]`
  const epilogueBody = [completionReflection || 'Thank you for showing up.', '', bindLine].join('\n')

  return [
    {
      node_id: 'qp_start',
      type: 'passage',
      body: startBody,
      choices: [{ text: 'Continue', next_node: 'qp_reflect' }],
    },
    {
      node_id: 'qp_reflect',
      type: 'passage',
      body: 'Before you complete, pause briefly. What shifts for you?',
      choices: [{ text: 'Mark complete', next_node: 'qp_epilogue' }],
    },
    {
      node_id: 'qp_epilogue',
      type: 'passage',
      body: epilogueBody,
    },
  ]
}

export interface QuestProposalIrCompileResult {
  tweeSource: string
  canonicalJson: string
}

/**
 * Validate IR, compile to Twee, and package canonical JSON for MicroTwineModule (IR v1 envelope).
 */
export function compileQuestProposalIrToTwee(
  input: QuestProposalTwineInput,
  publishedQuestId: string
): QuestProposalIrCompileResult {
  const nodes = buildIrNodesFromQuestProposal(input, publishedQuestId)
  const v = validateIrStory(nodes)
  if (!v.valid) {
    throw new Error(`IR validation failed: ${v.errors.join('; ')}`)
  }

  const storyTitle = input.title.trim().slice(0, 120) || 'Quest'
  const tweeSource = irToTwee(nodes, {
    title: storyTitle,
    startNode: 'qp_start',
  })

  const irEnvelope = {
    format: 'twine_ir_v1' as const,
    questProposalBridge: true,
    source: 'bar_quest_generation_engine_publish',
    publishedQuestId,
    story_metadata: { title: storyTitle, start_node: 'qp_start' },
    story_nodes: nodes,
  }

  return {
    tweeSource,
    canonicalJson: JSON.stringify(irEnvelope),
  }
}
