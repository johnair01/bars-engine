'use server'

import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOpenAI } from '@/lib/openai'
import { generateObjectWithCache } from '@/lib/ai-with-cache'
import { isBackendAvailable, refineCopyViaAgent } from '@/lib/agent-client'
import { z } from 'zod'

const VOICE_STYLE_GUIDE = `
Voice Style Guide (Librarian Campaign):
- Core: Presence first. Mechanics second. Initiation rituals, not explanations.
- Tone: Mischievous but warm (70%), slightly dangerous/amused (30%).
- Never: Corporate, therapeutic, apologetic, desperate, over-explanatory.
- Always: Confident, direct, respectful of intelligence, economical with words.
- Rhythm: Short declarative sentences. Let silence land.
- Avoid: "Hold space", "safe container", "trauma-informed". Prefer: Charge, fuel, forge, ledger, seed, crystallize.
- Emotional states: fuel, not wounds.
- Donation: Direct. Unapologetic. Never guilt-based.
`

export type CopyTarget =
  | 'instance_wakeUpContent'
  | 'instance_showUpContent'
  | 'instance_storyBridgeCopy'
  | 'instance_theme'
  | 'instance_targetDescription'
  | 'passage'

const TARGET_LABELS: Record<CopyTarget, string> = {
  instance_wakeUpContent: 'Wake Up: Learn the story',
  instance_showUpContent: 'Show Up: Contribute to the campaign',
  instance_storyBridgeCopy: 'Story bridge (game ↔ real world)',
  instance_theme: 'Theme',
  instance_targetDescription: 'Target description',
  passage: 'Passage text',
}

const copyImprovementSchema = z.object({
  improvedCopy: z.string().describe('The improved copy, same length or shorter. No preamble or explanation.'),
})

async function ensureAdmin(): Promise<string> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')

  const adminRole = await db.playerRole.findFirst({
    where: {
      playerId: player.id,
      role: { key: 'admin' },
    },
  })

  if (!adminRole) throw new Error('Not authorized')
  return player.id
}

/**
 * Improve onboarding/campaign copy using AI and the Voice Style Guide.
 * Repeatable process that can be metabolized by quests, admin tools, and certification flows.
 *
 * @param target - Which copy field is being improved (for context)
 * @param currentCopy - The existing copy to improve
 * @returns Improved copy or error
 */
export async function improveCopyWithAI(
  target: CopyTarget,
  currentCopy: string
): Promise<{ improvedCopy: string } | { error: string }> {
  try {
    await ensureAdmin()

    if (process.env.OPENAI_API_KEY === undefined || process.env.OPENAI_API_KEY === '') {
      return { error: 'OPENAI_API_KEY is not set. Add it to .env.local.' }
    }

    const targetLabel = TARGET_LABELS[target]

    // ---------------------------------------------------------------------------
    // Tier 1: Try Agent (Diplomat refine-copy) — richer I Ching context
    // ---------------------------------------------------------------------------
    if (process.env.AGENT_ROUTING_ENABLED !== 'false') {
      try {
        const backendUp = await isBackendAvailable()
        if (backendUp) {
          const agentResult = await refineCopyViaAgent({
            targetType: target,
            currentCopy,
          })
          const output = agentResult.output as { improved_copy?: string; improvedCopy?: string }
          const improved = output?.improved_copy ?? output?.improvedCopy
          if (improved) {
            return { improvedCopy: improved.trim() }
          }
        }
      } catch (agentErr) {
        console.warn('[copy-improvement] Agent path failed, falling through to direct AI:', agentErr)
      }
    }

    // ---------------------------------------------------------------------------
    // Tier 2: Direct OpenAI (existing behavior)
    // ---------------------------------------------------------------------------
    const inputKey = JSON.stringify({ target, currentCopy })
    const modelId = process.env.QUEST_GRAMMAR_AI_MODEL || 'gpt-4o'

    const systemPrompt = `You are a narrative designer for the Librarian Campaign. Improve the given copy to align with the Voice Style Guide.

${VOICE_STYLE_GUIDE}

Rules:
- Output ONLY the improved copy. No preamble, no explanation, no markdown.
- Preserve the intent and key information.
- Make it more confident, direct, economical.
- Same length or shorter.`

    const userPrompt = `Target: ${targetLabel}

Current copy:
---
${currentCopy}
---

Return the improved copy only.`

    const { object } = await generateObjectWithCache<z.infer<typeof copyImprovementSchema>>({
      feature: 'copy_improvement',
      inputKey,
      model: modelId,
      schema: copyImprovementSchema,
      system: systemPrompt,
      prompt: userPrompt,
      getModel: () => getOpenAI()(modelId),
    })

    return { improvedCopy: object.improvedCopy.trim() }
  } catch (e) {
    console.error('[copy-improvement]', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to improve copy',
    }
  }
}
