/**
 * Onboarding CYOA Generator — Quest Grammar Validation
 *
 * Runs N iterations of generateRandomTestInput → compileQuest and validates
 * structure: 6 nodes, beat order, choices present, action node format.
 * See .specify/specs/onboarding-cyoa-generator/spec.md
 */

import { compileQuest } from '@/lib/quest-grammar'
import { generateRandomTestInput } from './generateRandomTestInput'
import type { ValidationReport, ValidationFailure, RandomTestInput } from './types'

const EPIPHANY_BEATS = [
  'orientation',
  'rising_engagement',
  'tension',
  'integration',
  'transcendence',
  'consequence',
] as const

function validatePacket(
  iteration: number,
  input: RandomTestInput
): ValidationFailure | null {
  try {
    const packet = compileQuest({
      unpackingAnswers: input.unpackingAnswers,
      alignedAction: input.alignedAction,
      segment: 'player',
      campaignId: 'bruised-banana',
    })

    if (packet.nodes.length !== 6) {
      return {
        iteration,
        error: `Expected 6 nodes, got ${packet.nodes.length}`,
        input: {
          unpackingAnswers: input.unpackingAnswers,
          alignedAction: input.alignedAction,
        },
      }
    }

    for (let i = 0; i < EPIPHANY_BEATS.length; i++) {
      if (packet.nodes[i]!.beatType !== EPIPHANY_BEATS[i]) {
        return {
          iteration,
          error: `Node ${i} expected beat ${EPIPHANY_BEATS[i]}, got ${packet.nodes[i]!.beatType}`,
          input: { alignedAction: input.alignedAction },
        }
      }
    }

    const actionNode = packet.nodes.find((n) => n.isActionNode)
    if (!actionNode) {
      return {
        iteration,
        error: 'No action node (transcendence) found',
        input: { alignedAction: input.alignedAction },
      }
    }

    const nodesWithChoices = packet.nodes.filter((n) => n.choices.length > 0)
    if (nodesWithChoices.length === 0) {
      return {
        iteration,
        error: 'No nodes have choices',
        input: { alignedAction: input.alignedAction },
      }
    }

    for (const node of packet.nodes) {
      if (node.wordCountEstimate < 5 && !node.isActionNode) {
        return {
          iteration,
          error: `Node ${node.id} has very low word count (${node.wordCountEstimate})`,
          input: { alignedAction: input.alignedAction },
        }
      }
    }

    return null
  } catch (err) {
    return {
      iteration,
      error: err instanceof Error ? err.message : String(err),
      input: {
        unpackingAnswers: input.unpackingAnswers,
        alignedAction: input.alignedAction,
      },
    }
  }
}

/**
 * Run N iterations of random test input → compileQuest and return validation report.
 */
export async function validateQuestGrammar(
  iterations: number = 5
): Promise<ValidationReport> {
  const failures: ValidationFailure[] = []

  for (let i = 0; i < iterations; i++) {
    const input = await generateRandomTestInput()
    const failure = validatePacket(i + 1, input)
    if (failure) {
      failures.push(failure)
    }
  }

  return {
    pass: failures.length === 0,
    iterations,
    failures,
  }
}
