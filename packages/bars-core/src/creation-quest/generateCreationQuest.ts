/**
 * Creation Quest Bootstrap — Generate Creation Quest
 *
 * Rules-first: delegate to quest-grammar compileQuest when intent maps to unpacking flow.
 * AI fallback when no template matches (stub for now).
 * See .specify/specs/creation-quest-bootstrap/spec.md
 */

import { compileQuest } from '../quest-grammar'
import type { UnpackingAnswers, SegmentVariant } from '../quest-grammar'
import type { CreationIntent, CreationContext, CreationQuestPacket, CreationQuestNode } from './types'

/** Map quest-grammar QuestNode to CreationQuestNode */
function toCreationNode(node: { id: string; text: string; choices: Array<{ text: string; targetId: string }> }): CreationQuestNode {
  return {
    id: node.id,
    text: node.text,
    choices: node.choices.map((c) => ({ text: c.text, targetId: c.targetId })),
  }
}

export const CREATION_QUEST_HEURISTIC_THRESHOLD = Number(
  process.env.CREATION_QUEST_HEURISTIC_THRESHOLD ?? '0.8'
)

export const CREATION_QUEST_AI_ENABLED = process.env.CREATION_QUEST_AI_ENABLED !== 'false'

/**
 * Generate creation quest from intent and context.
 * Rules-first: when context has unpackingAnswers and intent confidence >= threshold,
 * delegate to compileQuest. Otherwise stub (AI fallback placeholder).
 * Pass unpackingAnswers via context.unpackingAnswers for rules path.
 */
export async function generateCreationQuest(
  intent: CreationIntent,
  context: CreationContext
): Promise<CreationQuestPacket> {
  const segment = (context.segment as SegmentVariant) ?? 'player'
  const campaignId = context.campaignId as string | undefined
  const unpackingAnswers = context.unpackingAnswers as (UnpackingAnswers & { alignedAction?: string }) | undefined

  // Rules path: when we have unpacking answers and intent maps to onboarding/creation
  if (
    unpackingAnswers &&
    intent.confidence >= CREATION_QUEST_HEURISTIC_THRESHOLD &&
    (intent.creationType === 'onboarding_quest' || intent.creationType === 'creation_quest')
  ) {
    const questModel = intent.questModel ?? 'personal'
    const packet = compileQuest({
      unpackingAnswers,
      alignedAction: unpackingAnswers.alignedAction ?? 'Show Up',
      segment,
      campaignId,
      questModel,
      moveType: intent.moveType,
    })
    const nodes = packet.nodes.map(toCreationNode)
    const result: CreationQuestPacket = {
      nodes,
      signature: JSON.stringify(packet.signature).slice(0, 100),
      segmentVariant: packet.segmentVariant,
      heuristicVsAi: 'heuristic',
      templateMatched: questModel === 'communal' ? 'kotter_8_stages' : 'epiphany_bridge',
    }
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[creation-quest]', {
        intentConfidence: intent.confidence,
        heuristicVsAi: result.heuristicVsAi,
        templateMatched: result.templateMatched,
      })
    }
    return result
  }

  // AI fallback: stub for now — return minimal packet
  if (CREATION_QUEST_AI_ENABLED) {
    const result: CreationQuestPacket = {
      nodes: [
        {
          id: 'node_0',
          text: 'Creation quest generation will use AI fallback when implemented. For now, use the quest grammar unpacking flow.',
          choices: [{ text: 'Continue', targetId: 'node_1' }],
        },
        {
          id: 'node_1',
          text: 'Complete your creation.',
          choices: [],
        },
      ],
      heuristicVsAi: 'ai',
      templateMatched: undefined,
    }
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[creation-quest]', {
        intentConfidence: intent.confidence,
        heuristicVsAi: result.heuristicVsAi,
        templateMatched: result.templateMatched,
      })
    }
    return result
  }

  // Rules-only: no heuristic match, AI disabled
  const fallbackResult: CreationQuestPacket = {
    nodes: [
      {
        id: 'node_0',
        text: 'No heuristic template matched. Please use the quest grammar unpacking flow (Q1–Q6 + aligned action) for creation quest generation.',
        choices: [],
      },
    ],
    heuristicVsAi: 'heuristic',
    templateMatched: undefined,
  }
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[creation-quest]', {
      intentConfidence: intent.confidence,
      heuristicVsAi: fallbackResult.heuristicVsAi,
      templateMatched: fallbackResult.templateMatched,
    })
  }
  return fallbackResult
}
