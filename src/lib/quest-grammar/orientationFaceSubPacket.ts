/**
 * Orientation Quest — Face Sub-Packet Utilities
 *
 * Static branch-to-field mapping and dispatch utilities for the orientation quest.
 * Individual face sub-packet compilers live in orientationFaceSubPackets.ts (plural).
 *
 * @see orientationFaceSubPackets.ts — the 6 individual face sub-packet compilers
 * @see orientationMetaPacket.ts — meta-packet dispatch that uses these utilities
 */

import { GAME_MASTER_FACES } from './types'
import {
  compileFaceSubPacket as compileFaceSubPacketImpl,
  FACE_FIELD_MAP,
} from './orientationFaceSubPackets'
import type { GameMasterFace, QuestNode, SegmentVariant } from './types'

// Re-export field map for consumers that only need this utility module
export { FACE_FIELD_MAP }

/**
 * Static branch-to-field mapping: each GM face → the primary canonical move ID
 * it uses when guiding TransformationMove proposal co-creation.
 *
 * Constraint: "Branch-to-field mapping is static lookup at compile time."
 *
 * Distinct from FACE_FIELD_MAP (which maps face → TransformationMove schema fields).
 * This maps face → canonical move ID (for depthMoveId, training signal, etc.).
 */
export const FACE_TO_CANONICAL_MOVE_ID: Record<GameMasterFace, string> = {
  shaman: 'observe',        // Wake Up — surface implicit narrative via belonging/ritual lens
  challenger: 'experiment', // Show Up — behavioral experiment via edge/action lens
  regent: 'name',           // Wake Up — clarify and label via structure/order lens
  architect: 'reframe',     // Grow Up — change interpretation via blueprint/strategy lens
  diplomat: 'feel',         // Clean Up — embody emotional awareness via relational/care lens
  sage: 'integrate',        // Show Up — anchor transformation via whole/emergence lens
} as const

/**
 * Prefix used for a face sub-packet's node IDs.
 * Each face sub-packet prefixes all its nodes with `orient_${face}`.
 * @example faceSubPacketPrefix('shaman') === 'orient_shaman'
 */
export function faceSubPacketPrefix(face: GameMasterFace): string {
  return `orient_${face}`
}

/**
 * Terminal node ID for a face sub-packet.
 * All face sub-packet journeys end at this node before converging.
 * @example faceSubPacketTerminalId('shaman') === 'orient_shaman_terminal'
 */
export function faceSubPacketTerminalId(face: GameMasterFace): string {
  return `${faceSubPacketPrefix(face)}_terminal`
}

/**
 * Compile a face sub-packet and return its nodes, patching the terminal node's
 * choices to converge to the given target ID.
 *
 * The individual face sub-packet compilers in orientationFaceSubPackets.ts emit
 * terminals with `choices: []`. This utility patches the terminal to enable
 * convergence back to the meta-packet's shared terminal node.
 *
 * @param face - The GM face to compile.
 * @param convergenceTargetId - Node ID the patched terminal should point to.
 * @param segment - Segment variant.
 * @returns { nodes, startNodeId } — nodes include the patched terminal.
 */
export function compileFaceSubPacketWithConvergence(
  face: GameMasterFace,
  convergenceTargetId: string,
  segment: SegmentVariant = 'player'
): { nodes: QuestNode[]; startNodeId: string } {
  const packet = compileFaceSubPacketImpl(face, { segment })
  const terminalId = faceSubPacketTerminalId(face)

  // Patch the terminal node to converge to the meta-packet terminal
  const nodes: QuestNode[] = packet.nodes.map((node) => {
    if (node.id === terminalId && node.choices.length === 0) {
      return {
        ...node,
        choices: [
          {
            text: 'Complete orientation',
            targetId: convergenceTargetId,
          },
        ],
        anchors: {
          ...node.anchors,
          consequenceCue: 'proposal submitted',
        },
      }
    }
    return node
  })

  return { nodes, startNodeId: packet.startNodeId }
}

/**
 * Instantiate and emit all face sub-packets (or a subset), patching each
 * terminal to converge to `convergenceTargetId`.
 *
 * Called by compileOrientationMetaPacket() as the core dispatch step.
 *
 * @param faces - Which faces to instantiate (defaults to all 6).
 * @param convergenceTargetId - All terminals converge here.
 * @param segment - Segment variant.
 * @returns Flat array of all nodes from all instantiated sub-packets.
 */
export function instantiateAllFaceSubPackets(
  faces: readonly GameMasterFace[] = GAME_MASTER_FACES,
  convergenceTargetId: string,
  segment: SegmentVariant = 'player'
): QuestNode[] {
  const allNodes: QuestNode[] = []
  for (const face of faces) {
    const { nodes } = compileFaceSubPacketWithConvergence(face, convergenceTargetId, segment)
    allNodes.push(...nodes)
  }
  return allNodes
}
