/**
 * build-corpus — converts quest answers into a CommunityCharacterCorpus.
 *
 * Pure function: no DB, no side effects.
 * Called from the wizard on completion; result is saved via the server action.
 */
import type { QuestAnswer, CommunityCharacterCorpus } from './types'
import { getPromptTemplates } from './prompt-templates'

export function buildCorpus(
  answers: QuestAnswer[],
  archetypeKey: string,
  nationKey: string,
): CommunityCharacterCorpus {
  // Collect all prompt IDs from all answers, deduplicate preserving first-seen order
  const seen = new Set<string>()
  const orderedIds: string[] = []
  for (const answer of answers) {
    for (const id of answer.promptIds) {
      if (!seen.has(id)) {
        seen.add(id)
        orderedIds.push(id)
      }
    }
  }

  const prompts = getPromptTemplates(orderedIds)

  return {
    v: 1,
    archetypeKey,
    nationKey,
    questCompletedAt: new Date().toISOString(),
    answers,
    prompts,
  }
}
