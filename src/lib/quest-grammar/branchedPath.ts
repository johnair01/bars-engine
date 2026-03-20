/**
 * Branched path orientation — generateBranchedPath API (Phase 2)
 * Spec: .specify/specs/branched-path-orientation/spec.md
 *
 * Wraps quest compilation with branch metadata: token estimate vs budget, maxDepth convention,
 * primaryBranchAxis hint for callers (horizontal vs altitudinal choice emphasis).
 * Heuristic-first: uses compileQuest / compileQuestWithPrivileging; no extra AI calls here.
 */

import { compileQuestWithPrivileging } from './compileQuest'
import { compileQuest } from './compileQuestCore'
import type { QuestCompileInput, QuestPacket, SerializableQuestPacket } from './types'

/** Input: same surface as quest compile, plus branch UX hints. */
export type BranchedPathInput = Omit<QuestCompileInput, 'privilegeContext'> & {
  /**
   * Emphasize 4-move (WCGS) vs 6-face branching in copy/authoring.
   * Phase 1 already allows up to 4 privileged choices via move-assignment; this is metadata for tooling.
   */
  primaryBranchAxis?: 'horizontal' | 'altitudinal' | 'balanced'
}

export type BranchedQuestPacket = SerializableQuestPacket & {
  branchedPathMeta: {
    maxDepth: number
    tokenBudget: number
    primaryBranchAxis?: BranchedPathInput['primaryBranchAxis']
    /** Rough word-count proxy: sum of node wordCountEstimate */
    estimatedTokens: number
    withinBudget: boolean
  }
}

function stripTelemetry(p: QuestPacket): SerializableQuestPacket {
  const { telemetryHooks: _, ...rest } = p
  return rest
}

function estimatePacketTokens(packet: SerializableQuestPacket): number {
  return packet.nodes.reduce((acc, n) => acc + (n.wordCountEstimate ?? Math.max(1, Math.ceil(n.text.length / 5))), 0)
}

function toQuestCompileInput(input: BranchedPathInput): QuestCompileInput {
  const { primaryBranchAxis: _, ...rest } = input
  return rest
}

/**
 * Compile a branched-path-oriented quest packet with budget / depth metadata.
 *
 * @param options.maxDepth — Recorded in meta (FR4); default 3. Deeper graph surgery deferred.
 * @param options.tokenBudget — Compared to summed wordCountEstimate (FR3 heuristic).
 */
export async function generateBranchedPath(
  input: BranchedPathInput,
  options?: { maxDepth?: number; tokenBudget?: number }
): Promise<BranchedQuestPacket> {
  const maxDepth = options?.maxDepth ?? 3
  const tokenBudget = options?.tokenBudget ?? 12_000

  const questInput = toQuestCompileInput(input)

  const packet =
    questInput.targetNationId || questInput.targetArchetypeId
      ? await compileQuestWithPrivileging(questInput)
      : compileQuest(questInput)

  const serial = stripTelemetry(packet)
  const estimatedTokens = estimatePacketTokens(serial)
  const withinBudget = estimatedTokens <= tokenBudget

  return {
    ...serial,
    branchedPathMeta: {
      maxDepth,
      tokenBudget,
      primaryBranchAxis: input.primaryBranchAxis,
      estimatedTokens,
      withinBudget,
    },
  }
}
