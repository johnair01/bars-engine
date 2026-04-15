/**
 * Narrative generation for book campaign CYOA.
 * Uses LORE context; AI for archetype intros and move passages.
 * Spec: .specify/specs/pdf-to-campaign-autogeneration/spec.md
 */
import { z } from 'zod'
import { generateObjectWithCache } from '@/lib/ai-with-cache'
import { getOpenAI } from '@/lib/openai'
import type { BookCampaignSkeleton, SkeletonNode } from './structure'

const LORE_SNIPPET = `World: Far-future silk-punk wuxia. Five nations (Argyra, Pyrakanth, Lamenth, Meridia, Virelune) channel emotional energy through constructs. Tone: comedic heist + Hitchhiker's wit.`

const MOVE_DEFINITIONS = {
  wakeUp: 'New ideas, awareness, seeing what the material reveals',
  cleanUp: 'Psychological barriers, emotional blocks to engaging with content',
  growUp: 'Emergent skills, skill tree, capacity building',
  showUp: 'Applying content to campaign context, experiments, commitments',
}

function getBookCampaignModel(): string {
  return process.env.BOOK_ANALYSIS_MODEL || 'gpt-4o-mini'
}

const archetypeIntroSchema = z.object({
  introText: z.string().describe('2–4 sentences. Second-person. As this archetype, you approach the book. Use game-world flavor.'),
})

const movePassageSchema = z.object({
  passageText: z.string().describe('2–4 sentences. Second-person. Introduce this move in the context of the book. Use game-world flavor.'),
})

export interface NarrativeInput {
  skeleton: BookCampaignSkeleton
  bookTitle: string
  bookAuthor: string | null
  campaignRef: string
  campaignContext: string
  summaryLeverage: {
    summary: string
    leverageInCampaign: string
    leverageInOtherDomains?: string[]
  }
  archetypes: { id: string; name: string; description: string }[]
  questTitlesByMove: { wakeUp: string[]; cleanUp: string[]; growUp: string[]; showUp: string[] }
}

export interface FilledNode {
  nodeId: string
  text: string
  choices: { text: string; targetId: string }[]
  linkedQuestId?: string
}

/**
 * Generate narratives and fill skeleton with prose.
 */
export async function generateBookCampaignNarratives(input: NarrativeInput): Promise<FilledNode[]> {
  const { skeleton, bookTitle, bookAuthor, campaignRef, campaignContext, summaryLeverage, archetypes, questTitlesByMove } = input
  const modelId = getBookCampaignModel()
  const getModel = () => getOpenAI()(modelId)

  const filled = new Map<string, FilledNode>()

  for (const node of skeleton.nodes) {
    if (node.nodeId === 'BOOK_Intro') {
      const text = `${summaryLeverage.summary}\n\n**How this book serves ${campaignContext}**\n\n${summaryLeverage.leverageInCampaign}`
      filled.set(node.nodeId, { nodeId: node.nodeId, text, choices: node.choices, linkedQuestId: node.linkedQuestId })
      continue
    }

    if (node.nodeId.startsWith('BOOK_Archetype_')) {
      const archId = node.nodeId.replace('BOOK_Archetype_', '')
      const arch = archetypes.find((a) => a.id === archId)
      if (!arch) {
        filled.set(node.nodeId, { nodeId: node.nodeId, text: node.textPlaceholder, choices: node.choices })
        continue
      }

      const inputKey = `book_campaign_arch:${bookTitle}:${campaignRef}:${archId}`
      const { object } = await generateObjectWithCache<z.infer<typeof archetypeIntroSchema>>({
        feature: 'book_campaign_narrative',
        inputKey,
        model: modelId,
        schema: archetypeIntroSchema,
        system: `You write flavorful second-person prose for the Integral Emergence game. ${LORE_SNIPPET} Be concise, confident, economical.`,
        prompt: `Book: ${bookTitle}${bookAuthor ? ` by ${bookAuthor}` : ''}. Campaign: ${campaignContext}.

Archetype: ${arch.name}
${arch.description}

Write 2–4 sentences. As ${arch.name}, how does the player approach this book? Use game-world flavor. Second person.`,
        getModel,
      })
      filled.set(node.nodeId, { nodeId: node.nodeId, text: object.introText, choices: node.choices })
      continue
    }

    if (['BOOK_WakeUp', 'BOOK_CleanUp', 'BOOK_GrowUp', 'BOOK_ShowUp'].includes(node.nodeId)) {
      const raw = node.nodeId.replace('BOOK_', '')
      const moveKey = (raw.charAt(0).toLowerCase() + raw.slice(1)) as keyof typeof MOVE_DEFINITIONS
      const moveDef = MOVE_DEFINITIONS[moveKey]
      const questTitles = questTitlesByMove[moveKey] ?? []

      const inputKey = `book_campaign_move:${bookTitle}:${campaignRef}:${node.nodeId}`
      const { object } = await generateObjectWithCache<z.infer<typeof movePassageSchema>>({
        feature: 'book_campaign_narrative',
        inputKey,
        model: modelId,
        schema: movePassageSchema,
        system: `You write flavorful second-person prose for the Integral Emergence game. ${LORE_SNIPPET} Be concise, confident, economical.`,
        prompt: `Book: ${bookTitle}. Campaign: ${campaignContext}.

Move: ${moveKey} — ${moveDef}
${questTitles.length ? `Sample quests: ${questTitles.slice(0, 3).join('; ')}` : ''}

Write 2–4 sentences introducing this move in the context of the book. Second person. Use game-world flavor.`,
        getModel,
      })
      filled.set(node.nodeId, {
        nodeId: node.nodeId,
        text: `**${moveKey.charAt(0).toUpperCase() + moveKey.slice(1)}** — ${moveDef}\n\n${object.passageText}`,
        choices: node.choices,
        linkedQuestId: node.linkedQuestId,
      })
      continue
    }

    if (node.nodeId === 'BOOK_Complete') {
      filled.set(node.nodeId, {
        nodeId: node.nodeId,
        text: `**Complete** — You have journeyed through "${bookTitle}" with the lens of your archetype. The material is now part of your toolkit for ${campaignContext}. What will you do next?`,
        choices: node.choices,
      })
      continue
    }

    if (node.nodeId === 'BOOK_ChooseArchetype') {
      filled.set(node.nodeId, {
        nodeId: node.nodeId,
        text: node.textPlaceholder,
        choices: node.choices,
      })
      continue
    }

    filled.set(node.nodeId, { nodeId: node.nodeId, text: node.textPlaceholder, choices: node.choices, linkedQuestId: node.linkedQuestId })
  }

  return skeleton.nodes.map((n) => filled.get(n.nodeId) ?? { nodeId: n.nodeId, text: n.textPlaceholder, choices: n.choices, linkedQuestId: n.linkedQuestId })
}
