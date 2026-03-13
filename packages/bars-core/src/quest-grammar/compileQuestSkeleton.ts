/**
 * Quest Grammar — Skeleton Compiler
 *
 * Produces structure-only QuestPacket with placeholder text.
 * No AI. Use for skeleton-first flow: admin reviews structure before flavor generation.
 * See .specify/specs/onboarding-quest-generation-unblock/spec.md Phase 2.
 */

import type { SerializableQuestPacket, QuestNode, EmotionalAlchemySignature, SegmentVariant } from './types'

const BEAT_LABELS: Record<string, string> = {
  lens_choice: 'Lens choice',
  orientation: 'Orientation',
  rising_engagement: 'Rising Engagement',
  tension: 'Tension',
  integration: 'Integration',
  transcendence: 'Transcendence',
  consequence: 'Consequence',
  urgency: 'Urgency',
  coalition: 'Coalition',
  vision: 'Vision',
  communicate: 'Communicate',
  obstacles: 'Obstacles',
  wins: 'Wins',
  build_on: 'Build On',
  anchor: 'Anchor',
}

/** Input packet shape (from compileQuest / compileQuestWithPrivileging, minus telemetryHooks) */
type PacketInput = {
  nodes: QuestNode[]
  signature: EmotionalAlchemySignature
  segmentVariant: SegmentVariant
  startNodeId: string
  moveMap?: SerializableQuestPacket['moveMap']
  depthBranchOrder?: SerializableQuestPacket['depthBranchOrder']
}

/**
 * Convert a full QuestPacket to skeleton form: placeholder text for nodes and choices.
 * Call with output of compileQuest or compileQuestWithPrivileging.
 */
export function toSkeletonPacket(packet: PacketInput): SerializableQuestPacket {
  const nodes: QuestNode[] = packet.nodes.map((node: QuestNode) => {
    const beatLabel = node.id === 'lens_choice' ? 'Lens choice' : (BEAT_LABELS[node.beatType] ?? node.beatType)
    const placeholderText = node.depth
      ? `[${node.gameMasterFace ?? 'depth'} — ${beatLabel}]`
      : `[${beatLabel}]`
    return {
      ...node,
      text: placeholderText,
      wordCountEstimate: 0,
      choices: node.choices.map((c) => ({
        ...c,
        text: `[Choice → ${c.targetId}]`,
      })),
    }
  })
  const result: SerializableQuestPacket = {
    signature: packet.signature,
    nodes,
    segmentVariant: packet.segmentVariant,
    startNodeId: packet.startNodeId,
  }
  if (packet.moveMap) result.moveMap = packet.moveMap
  if (packet.depthBranchOrder) result.depthBranchOrder = packet.depthBranchOrder
  return result
}
