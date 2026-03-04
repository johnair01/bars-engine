'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { compileQuest, buildQuestPromptContext } from '@/lib/quest-grammar'
import type { BuildQuestPromptContextInput } from '@/lib/quest-grammar'
import { getOpenAI } from '@/lib/openai'
import { generateObjectWithCache } from '@/lib/ai-with-cache'
import { parseTwee } from '@/lib/twee-parser'
import { z } from 'zod'
import { getMoveById, type SerializableQuestPacket } from '@/lib/quest-grammar'

const INITIATION_SLUG_PREFIX = 'bruised-banana-initiation'

async function checkAdmin() {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')

  const adminRole = await db.playerRole.findFirst({
    where: {
      playerId: player.id,
      role: { key: 'admin' },
    },
  })

  if (!adminRole) throw new Error('Not authorized')
  return player
}

const questGrammarNodeTextSchema = z.object({
  nodeTexts: z
    .array(z.string())
    .length(4)
    .describe('Grammatical, coherent story text for nodes 0–3 (orientation, rising_engagement, tension, integration). Preserve markdown and structure.'),
})

/**
 * Compile quest with AI-enhanced node text for the first 4 beats.
 * Transcendence and consequence nodes keep heuristic output (fixed structure).
 */
export async function compileQuestWithAI(
  input: BuildQuestPromptContextInput
): Promise<{ packet: SerializableQuestPacket } | { error: string }> {
  try {
    if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
      return { error: 'Quest Grammar AI is disabled. Set QUEST_GRAMMAR_AI_ENABLED=true to enable.' }
    }

    const packet = compileQuest(input)
    const promptContext = await buildQuestPromptContext(input, packet)
    const isCommunal = input.questModel === 'communal'

    const systemPrompt = isCommunal
      ? `You are a narrative designer for a choose-your-own-adventure quest. Your task is to turn the prompt context into grammatical, emotionally coherent story text for each Kotter stage.

Rules:
- Output clear, second-person prose. No fragments or placeholder text.
- Preserve any **bold** headers and structure.
- Keep the communal change arc: urgency → coalition → vision → communicate.
- Each node should feel like part of one continuous story.
- Follow the Voice Style Guide: presence first, confident tone, economical with words.`
      : `You are a narrative designer for a choose-your-own-adventure quest. Your task is to turn the prompt context into grammatical, emotionally coherent story text for each beat.

Rules:
- Output clear, second-person prose. No fragments or placeholder text.
- Preserve any **bold** headers and structure.
- Keep the emotional arc: orientation → rising engagement → tension → integration.
- Each node should feel like part of one continuous story.
- Follow the Voice Style Guide: presence first, confident tone, economical with words.`

    const userPrompt = isCommunal
      ? `${promptContext}

---

Draft node texts to refine (make grammatical and coherent; preserve structure):
0. Urgency — include experience, current life, framing, create urgency (${input.segment === 'player' ? 'You are entering a living world mid-formation. Your participation matters.' : 'You are protecting emergence. Your stewardship catalyzes what wants to happen.'})
1. Coalition — who will contribute? shadow voices, build the coalition
2. Vision — what does success look like? satisfied state, "What would have to be true?"
3. Communicate — share the need, aligned action, spread the message

Return 4 refined node texts (nodeTexts array), one per stage. Preserve markdown and structure.`
      : `${promptContext}

---

Draft node texts to refine (make grammatical and coherent; preserve structure):
0. Orientation — include experience, current life, and framing (${input.segment === 'player' ? 'You are entering a living world mid-formation. Your participation matters.' : 'You are protecting emergence. Your stewardship catalyzes what wants to happen.'})
1. Rising engagement — include dissatisfied state, "What would have to be true?", rising energy
2. Tension — include gap between from-state and to-state, shadow voices
3. Integration — include aligned action, translating primary channel into movement, threshold is near

Return 4 refined node texts (nodeTexts array), one per beat. Preserve markdown and structure.`

    const inputKey = JSON.stringify({
      unpackingAnswers: input.unpackingAnswers,
      alignedAction: input.alignedAction,
      segment: input.segment,
      questModel: input.questModel ?? 'personal',
      targetNationId: input.targetNationId ?? null,
      targetPlaybookId: input.targetPlaybookId ?? null,
      targetArchetypeIds: input.targetArchetypeIds ?? [],
      developmentalLens: input.developmentalLens ?? null,
      playerPOV: input.playerPOV ?? null,
      expectedMoves: input.expectedMoves ?? [],
      feature: 'quest_grammar_ai',
    })
    const modelId = process.env.QUEST_GRAMMAR_AI_MODEL || 'gpt-4o'

    const { object } = await generateObjectWithCache<z.infer<typeof questGrammarNodeTextSchema>>({
      feature: 'quest_grammar_ai',
      inputKey,
      model: modelId,
      schema: questGrammarNodeTextSchema,
      system: systemPrompt,
      prompt: userPrompt,
      getModel: () => getOpenAI()(modelId),
    })

    for (let i = 0; i < 4; i++) {
      packet.nodes[i].text = object.nodeTexts[i]
      packet.nodes[i].wordCountEstimate = packet.nodes[i].text.trim().split(/\s+/).filter(Boolean).length
    }

    // Strip telemetryHooks (functions) so packet is serializable for client components
    const { telemetryHooks: _, ...serializable } = packet
    return { packet: serializable }
  } catch (e) {
    console.error('[compileQuestWithAI]', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to generate quest with AI',
    }
  }
}

const questOverviewSchema = z.object({
  objectives: z
    .array(z.string())
    .describe('Quest objectives — what a completer achieves'),
  passages: z
    .array(
      z.object({
        id: z.string().describe('Passage ID (alphanumeric, underscores)'),
        text: z.string().describe('Passage body text (markdown)'),
        choices: z.array(
          z.object({
            text: z.string(),
            targetId: z.string(),
            moveId: z.string().optional().describe('Canonical move ID for choice privileging'),
          })
        ),
      })
    )
    .min(4)
    .describe('Passages for the CYOA flow. 2–3 choices per passage.'),
  startPassage: z.string().describe('ID of the starting passage'),
})

/**
 * Generate quest overview and Twee source from prompt context.
 * AI constructs full structure; output { quests (objectives), tweeSource }.
 */
export async function generateQuestOverviewWithAI(
  input: BuildQuestPromptContextInput
): Promise<
  | { success: true; objectives: string[]; tweeSource: string }
  | { success: false; error: string }
> {
  try {
    if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
      return { success: false, error: 'Quest Grammar AI is disabled.' }
    }

    const packet = compileQuest(input)
    const promptContext = await buildQuestPromptContext(input, packet)

    const systemPrompt = `You are a narrative designer for a choose-your-own-adventure quest. From the prompt context, generate a complete quest skeleton: objectives and passages with choices.

Rules:
- Output 4–6 passages. One beat per passage. 2–3 choices per passage (style guide; except final).
- Passage IDs: node_0, node_1, ... or similar. Start passage: node_0.
- Clear second-person prose. Follow Voice Style Guide: presence first, confident, economical.
- Emotional arc: orientation → rising engagement → tension → integration → consequence.
- Final passage: choice to "Create my account" (targetId: signup) or similar.`

    const userPrompt = `${promptContext}

---

Generate a quest skeleton. Return:
- objectives: array of 3–5 strings (what a completer achieves)
- passages: array of { id, text, choices: [{ text, targetId }] }
- startPassage: "node_0"`

    const inputKey = JSON.stringify({
      ...input,
      targetNationId: input.targetNationId ?? null,
      targetPlaybookId: input.targetPlaybookId ?? null,
      feature: 'quest_overview_ai',
    })
    const modelId = process.env.QUEST_GRAMMAR_AI_MODEL || 'gpt-4o'

    const { object } = await generateObjectWithCache<z.infer<typeof questOverviewSchema>>({
      feature: 'quest_overview_ai',
      inputKey,
      model: modelId,
      schema: questOverviewSchema,
      system: systemPrompt,
      prompt: userPrompt,
      getModel: () => getOpenAI()(modelId),
    })

    // Convert to Twee 3
    const title = `Quest — ${input.segment}`
    let twee = `:: StoryTitle\n${title}\n\n`
    twee += `:: StoryData\n{\n  "ifid": "quest-overview-${Date.now()}",\n  "format": "SugarCube",\n  "format-version": "2.36.1",\n  "start": "${object.startPassage}"\n}\n\n`

    const nodeIds = new Set(object.passages.map((p) => p.id))
    const externalTargets = new Set<string>()
    for (const p of object.passages) {
      for (const c of p.choices) {
        if (!nodeIds.has(c.targetId)) externalTargets.add(c.targetId)
      }
    }

    for (const p of object.passages) {
      const links = p.choices
        .map((c) => `[[${c.text}|${c.targetId}]]`)
        .join('\n')
      const body = links ? `${p.text.trim()}\n\n${links}` : p.text.trim()
      twee += `:: ${p.id}\n${body}\n\n`
    }

    for (const tid of externalTargets) {
      twee += `:: ${tid}\n[End — ${tid}]\n\n`
    }

    return {
      success: true,
      objectives: object.objectives,
      tweeSource: twee,
    }
  } catch (e) {
    console.error('[generateQuestOverviewWithAI]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to generate quest overview',
    }
  }
}

/**
 * Publish QuestPacket to bruised-banana-initiation-{segment} Adventure.
 * Creates or updates Adventure and Passages. Segment determines which variant is stored.
 */
export async function publishQuestPacketToPassages(
  packet: SerializableQuestPacket
): Promise<{ success: boolean; error?: string }> {
  try {
    await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  const segment = packet.segmentVariant
  const slug = `${INITIATION_SLUG_PREFIX}-${segment}`
  const title = `Bruised Banana Initiation (${segment})`

  try {
    const adventure = await db.adventure.upsert({
      where: { slug },
      update: {
        title,
        status: 'ACTIVE',
        startNodeId: packet.startNodeId,
        description: `Quest Grammar–generated initiation flow. Segment: ${segment}. Editable in Admin → Adventures.`,
      },
      create: {
        slug,
        title,
        status: 'ACTIVE',
        startNodeId: packet.startNodeId,
        description: `Quest Grammar–generated initiation flow. Segment: ${segment}.`,
        visibility: 'PUBLIC_ONBOARDING',
      },
    })

    for (const node of packet.nodes) {
      const choicesJson = JSON.stringify(node.choices)
      await db.passage.upsert({
        where: {
          adventureId_nodeId: {
            adventureId: adventure.id,
            nodeId: node.id,
          },
        },
        update: { text: node.text, choices: choicesJson },
        create: {
          adventureId: adventure.id,
          nodeId: node.id,
          text: node.text,
          choices: choicesJson,
        },
      })
    }

    revalidatePath('/admin/quest-grammar')
    revalidatePath('/admin/adventures')
    return { success: true }
  } catch (e) {
    console.error('[publishQuestPacketToPassages]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to publish',
    }
  }
}

/**
 * Publish QuestPacket to a NEW Adventure linked to sourceQuestId (upgrade flow).
 * Creates Adventure + Passages + QuestThread with sourceQuestId.
 * Last node (consequence) gets linkedQuestId = sourceQuestId.
 */
export async function publishQuestPacketToPassagesWithSourceQuest(
  packet: SerializableQuestPacket,
  sourceQuestId: string,
  questTitle: string
): Promise<
  | { success: true; adventureId: string; threadId: string }
  | { success: false; error: string }
> {
  let player
  try {
    player = await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  const quest = await db.customBar.findUnique({ where: { id: sourceQuestId } })
  if (!quest) return { success: false, error: 'Source quest not found' }

  try {
    const slug = `${questTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-cyoa-${Date.now()}`
    const title = `${questTitle} (CYOA)`

    const adventure = await db.adventure.create({
      data: {
        slug,
        title,
        status: 'ACTIVE',
        startNodeId: packet.startNodeId,
        description: `Quest upgrade: ${questTitle}. From unpacking flow.`,
        visibility: 'PUBLIC_ONBOARDING',
      },
    })

    const nodes = packet.nodes
    const lastNode = nodes[nodes.length - 1]

    for (const node of nodes) {
      const choicesJson = JSON.stringify(node.choices)
      const linkedQuestId = node.id === lastNode.id ? sourceQuestId : null
      await db.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId: node.id,
          text: node.text,
          choices: choicesJson,
          linkedQuestId,
        },
      })
    }

    const thread = await db.questThread.create({
      data: {
        title,
        description: `Upgraded from quest: ${questTitle}. Original quest preserved.`,
        creatorType: 'system',
        creatorId: player.id,
        adventureId: adventure.id,
        sourceQuestId,
        status: 'active',
      },
    })

    await db.threadQuest.create({
      data: {
        threadId: thread.id,
        questId: sourceQuestId,
        position: 1,
      },
    })

    revalidatePath('/admin/adventures')
    revalidatePath('/admin/journeys')
    revalidatePath(`/admin/quests/${sourceQuestId}`)
    return { success: true, adventureId: adventure.id, threadId: thread.id }
  } catch (e) {
    console.error('[publishQuestPacketToPassagesWithSourceQuest]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to publish',
    }
  }
}

export type CreateAdventureFromTweeOptions = {
  title?: string
  slug?: string
  /** When set, creates QuestThread with sourceQuestId; end passage links to quest; no CustomBars per passage. */
  sourceQuestId?: string
}

/**
 * Parse .twee source and create Adventure + Passages + QuestThread.
 * Default: each passage becomes a CustomBar (quest) in the thread.
 * With sourceQuestId: upgrade mode — no CustomBars, end passage links to original quest.
 */
export async function createAdventureAndThreadFromTwee(
  tweeSource: string,
  titleOrOptions?: string | CreateAdventureFromTweeOptions,
  slug?: string
): Promise<
  | { success: true; adventureId: string; threadId: string }
  | { success: false; error: string }
> {
  let player
  try {
    player = await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  const opts: CreateAdventureFromTweeOptions =
    typeof titleOrOptions === 'object' ? titleOrOptions : { title: titleOrOptions, slug }
  const sourceQuestId = opts.sourceQuestId

  try {
    const parsed = parseTwee(tweeSource)
    const { startPassage, passages } = parsed

    // Order passages: BFS from start, then any remaining
    const passageByName = new Map(passages.map((p) => [p.name, p]))
    const ordered: typeof passages = []
    const seen = new Set<string>()
    const queue = [startPassage]
    while (queue.length > 0) {
      const name = queue.shift()!
      if (seen.has(name)) continue
      seen.add(name)
      const p = passageByName.get(name)
      if (p) {
        ordered.push(p)
        for (const link of p.links) {
          if (!seen.has(link.target)) queue.push(link.target)
        }
      }
    }
    for (const p of passages) {
      if (!seen.has(p.name)) ordered.push(p)
    }

    const effectiveTitle = opts.title || parsed.title
    const effectiveSlug =
      opts.slug ?? slug ?? `${effectiveTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`

    const adventure = await db.adventure.create({
      data: {
        slug: effectiveSlug,
        title: effectiveTitle,
        status: 'ACTIVE',
        startNodeId: startPassage,
        description: sourceQuestId
          ? `Quest upgrade from .twee. ${ordered.length} passages.`
          : `Imported from .twee. ${ordered.length} passages.`,
        visibility: 'PUBLIC_ONBOARDING',
      },
    })

    const creatorId = player.id

    if (sourceQuestId) {
      // Upgrade mode: Passages only, end passage links to original quest
      const endPassageNames = new Set(
        ordered.filter((p) => p.links.length === 0).map((p) => p.name)
      )
      const lastOrdered = ordered[ordered.length - 1]?.name
      const completionNodeId = endPassageNames.has(lastOrdered) ? lastOrdered : Array.from(endPassageNames)[0] ?? lastOrdered

      for (const p of ordered) {
        const choicesJson = JSON.stringify(
          p.links.map((l) => ({ text: l.label, targetId: l.target }))
        )
        const linkedQuestId = p.name === completionNodeId ? sourceQuestId : null
        await db.passage.create({
          data: {
            adventureId: adventure.id,
            nodeId: p.name,
            text: p.text,
            choices: choicesJson,
            linkedQuestId,
          },
        })
      }

      const thread = await db.questThread.create({
        data: {
          title: effectiveTitle,
          description: `Upgraded from quest. Original quest preserved.`,
          creatorType: 'system',
          creatorId,
          adventureId: adventure.id,
          sourceQuestId,
          status: 'active',
        },
      })

      await db.threadQuest.create({
        data: { threadId: thread.id, questId: sourceQuestId, position: 1 },
      })

      revalidatePath(`/admin/quests/${sourceQuestId}`)
    } else {
      // Default: CustomBar per passage
      const questIds: string[] = []
      for (const p of ordered) {
        const choicesJson = JSON.stringify(
          p.links.map((l) => ({ text: l.label, targetId: l.target }))
        )
        const bar = await db.customBar.create({
          data: {
            creatorId,
            title: p.name.length > 40 ? p.name.slice(0, 37) + '...' : p.name,
            description: p.text,
            type: 'vibe',
            reward: 1,
            status: 'active',
            visibility: 'public',
            isSystem: true,
            inputs: JSON.stringify([]),
          },
        })
        await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
        questIds.push(bar.id)
        await db.passage.create({
          data: {
            adventureId: adventure.id,
            nodeId: p.name,
            text: p.text,
            choices: choicesJson,
            linkedQuestId: bar.id,
          },
        })
      }
      const thread = await db.questThread.create({
        data: {
          title: effectiveTitle,
          description: `Quest thread for ${adventure.title}. ${ordered.length} quests.`,
          creatorType: 'system',
          creatorId,
          adventureId: adventure.id,
          status: 'active',
        },
      })
      for (let pos = 0; pos < questIds.length; pos++) {
        await db.threadQuest.create({
          data: { threadId: thread.id, questId: questIds[pos], position: pos + 1 },
        })
      }
    }

    revalidatePath('/admin/adventures')
    revalidatePath('/admin/journeys')
    const thread = await db.questThread.findFirst({ where: { adventureId: adventure.id } })
    return {
      success: true,
      adventureId: adventure.id,
      threadId: thread!.id,
    }
  } catch (e) {
    console.error('[createAdventureAndThreadFromTwee]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to create adventure and thread',
    }
  }
}

/**
 * Append a generated QuestPacket to an existing Adventure.
 * Phase 5c: Recursive generation — "Generate another quest" from within a quest.
 *
 * - Creates new passages with prefixed node IDs to avoid collisions
 * - Connects from a terminal passage (one with no internal outgoing links) to the first new passage
 * - If the adventure has a linked QuestThread, creates CustomBars and appends to the thread
 */
export async function appendQuestToAdventure(
  packet: SerializableQuestPacket,
  adventureId: string
): Promise<
  | { success: true; adventureId: string; passageCount: number }
  | { success: false; error: string }
> {
  let player
  try {
    player = await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  try {
    const adventure = await db.adventure.findUnique({
      where: { id: adventureId },
      include: {
        passages: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!adventure) return { success: false, error: 'Adventure not found' }

    const existingNodeIds = new Set(adventure.passages.map((p) => p.nodeId))

    // Prefix for new nodes: g1_, g2_, ... (count existing append batches by prefix pattern or use timestamp)
    const appendPrefix = `g${Date.now().toString(36)}_`

    const nodeIdMap = new Map<string, string>()
    for (const node of packet.nodes) {
      nodeIdMap.set(node.id, appendPrefix + node.id)
    }

    const creatorId = player.id

    // Create CustomBars and Passages for each node
    const questIds: string[] = []
    for (const node of packet.nodes) {
      const newNodeId = nodeIdMap.get(node.id)!
      const choices = node.choices.map((c) => ({
        text: c.text,
        targetId: nodeIdMap.has(c.targetId) ? nodeIdMap.get(c.targetId)! : c.targetId,
      }))

      const bar = await db.customBar.create({
        data: {
          creatorId,
          title: node.id.length > 40 ? node.id.slice(0, 37) + '...' : node.id,
          description: node.text,
          type: 'vibe',
          reward: 1,
          status: 'active',
          visibility: 'public',
          isSystem: true,
          inputs: JSON.stringify([]),
        },
      })
      await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
      questIds.push(bar.id)

      await db.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId: newNodeId,
          text: node.text,
          choices: JSON.stringify(choices),
          linkedQuestId: bar.id,
        },
      })
    }

    // Handle external targets (e.g. signup) — create stub passages if they don't exist
    const externalTargets = new Set<string>()
    for (const node of packet.nodes) {
      for (const c of node.choices) {
        if (!nodeIdMap.has(c.targetId) && !existingNodeIds.has(c.targetId)) {
          externalTargets.add(c.targetId)
        }
      }
    }
    for (const tid of externalTargets) {
      const existing = adventure.passages.some((p) => p.nodeId === tid)
      if (!existing) {
        await db.passage.create({
          data: {
            adventureId: adventure.id,
            nodeId: tid,
            text: `[End — ${tid}]`,
            choices: '[]',
          },
        })
      }
    }

    // Find a terminal passage to connect from (choices only go to external targets, not to other passages)
    let connectFromPassage: (typeof adventure.passages)[0] | null = null
    for (const p of adventure.passages) {
      let choices: Array<{ text: string; targetId: string }> = []
      try {
        choices = JSON.parse(p.choices || '[]')
      } catch {
        /* ignore */
      }
      const allTargetsExternal = choices.every((c) => !existingNodeIds.has(c.targetId))
      if (choices.length === 0 || allTargetsExternal) {
        connectFromPassage = p
        break
      }
    }
    if (!connectFromPassage && adventure.passages.length > 0) {
      connectFromPassage = adventure.passages[adventure.passages.length - 1]
    }

    const firstNewNodeId = nodeIdMap.get(packet.startNodeId)!

    if (connectFromPassage) {
      let choices: Array<{ text: string; targetId: string }> = []
      try {
        choices = JSON.parse(connectFromPassage.choices || '[]')
      } catch {
        /* ignore */
      }
      const hasExistingLink = choices.some((c) => c.targetId === firstNewNodeId)
      if (!hasExistingLink) {
        choices.push({ text: 'Continue to next quest', targetId: firstNewNodeId })
        await db.passage.update({
          where: { id: connectFromPassage.id },
          data: { choices: JSON.stringify(choices) },
        })
      }
    }

    // Append to QuestThread if one exists
    const thread = await db.questThread.findFirst({
      where: { adventureId: adventure.id },
    })
    if (thread) {
      const { _max } = await db.threadQuest.aggregate({
        where: { threadId: thread.id },
        _max: { position: true },
      })
      const maxPosition = _max.position ?? 0
      for (let i = 0; i < questIds.length; i++) {
        await db.threadQuest.create({
          data: {
            threadId: thread.id,
            questId: questIds[i],
            position: maxPosition + i + 1,
          },
        })
      }
    }

    revalidatePath('/admin/adventures')
    revalidatePath(`/admin/adventures/${adventureId}`)
    revalidatePath('/admin/journeys')
    return {
      success: true,
      adventureId,
      passageCount: packet.nodes.length,
    }
  } catch (e) {
    console.error('[appendQuestToAdventure]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to append quest',
    }
  }
}

const storytellerBridgeSchema = z.object({
  passageTexts: z
    .array(z.string())
    .length(6)
    .describe('6 Epiphany Bridge passage texts: orientation, rising_engagement, tension, integration, transcendence, consequence. Markdown. No choices.'),
})

/**
 * Expand an edge (fromNodeId → toNodeId) with a Storyteller Bridge.
 * Phase 5e: Multiple passages, Epiphany Bridge structure, no choices.
 * AI generates 6 passages; inserted as linear narrative between A and B.
 */
export async function expandEdgeWithStory(
  adventureId: string,
  fromNodeId: string,
  toNodeId: string,
  moveId: string
): Promise<
  | { success: true; passageCount: number }
  | { success: false; error: string }
> {
  try {
    await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
    return { success: false, error: 'Quest Grammar AI is disabled.' }
  }

  const move = getMoveById(moveId)
  if (!move) return { success: false, error: `Unknown move: ${moveId}` }

  const adventure = await db.adventure.findUnique({
    where: { id: adventureId },
    include: { passages: true },
  })
  if (!adventure) return { success: false, error: 'Adventure not found' }

  const fromPassage = adventure.passages.find((p) => p.nodeId === fromNodeId)
  if (!fromPassage) return { success: false, error: `From passage not found: ${fromNodeId}` }

  let choices: Array<{ text: string; targetId: string }> = []
  try {
    choices = JSON.parse(fromPassage.choices || '[]')
  } catch {
    /* ignore */
  }
  const choiceIndex = choices.findIndex((c) => c.targetId === toNodeId)
  if (choiceIndex < 0) return { success: false, error: `No choice from ${fromNodeId} to ${toNodeId}` }

  const prefix = `bridge_${Date.now().toString(36)}_`
  const passageIds = ['orientation', 'rising_engagement', 'tension', 'integration', 'transcendence', 'consequence'].map(
    (beat, i) => `${prefix}${i}`
  )

  const systemPrompt = `You are a narrative designer. Generate a Storyteller Bridge: 6 passages that bridge an emotional gap using the move "${move.name}" (${move.narrative}).

Rules:
- Epiphany Bridge structure: orientation → rising engagement → tension → integration → transcendence → consequence.
- NO choices. Linear narrative. Second-person prose.
- Voice: presence first, confident, economical. No corporate or therapeutic language.
- Each passage: 2–4 short paragraphs. Clear emotional arc.`

  const userPrompt = `Generate 6 passage texts for a Storyteller Bridge. Move: ${move.name} — ${move.narrative}.

Return passageTexts: array of 6 strings (one per Epiphany Bridge beat). No choices. Markdown.`

  const inputKey = JSON.stringify({ adventureId, fromNodeId, toNodeId, moveId, feature: 'expand_edge_story' })
  const modelId = process.env.QUEST_GRAMMAR_AI_MODEL || 'gpt-4o'

  const { object } = await generateObjectWithCache<z.infer<typeof storytellerBridgeSchema>>({
    feature: 'expand_edge_story',
    inputKey,
    model: modelId,
    schema: storytellerBridgeSchema,
    system: systemPrompt,
    prompt: userPrompt,
    getModel: () => getOpenAI()(modelId),
  })

  const bridgePassages = object.passageTexts.map((text, i) => ({
    nodeId: passageIds[i],
    text,
  }))

  for (let i = 0; i < bridgePassages.length; i++) {
    const p = bridgePassages[i]
    const nextId = i + 1 < bridgePassages.length ? bridgePassages[i + 1].nodeId : toNodeId
    const choicesJson = JSON.stringify([{ text: 'Continue', targetId: nextId }])
    await db.passage.create({
      data: {
        adventureId,
        nodeId: p.nodeId,
        text: p.text,
        choices: choicesJson,
      },
    })
  }

  choices[choiceIndex] = { ...choices[choiceIndex], targetId: passageIds[0] }
  await db.passage.update({
    where: { id: fromPassage.id },
    data: { choices: JSON.stringify(choices) },
  })

  revalidatePath('/admin/adventures')
  revalidatePath(`/admin/adventures/${adventureId}`)
  return { success: true, passageCount: 6 }
}

const questBridgeSchema = z.object({
  passages: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        choices: z.array(z.object({ text: z.string(), targetId: z.string() })),
      })
    )
    .min(4)
    .describe('Epiphany Bridge passages with choices that flavor the path (linear movement)'),
  startPassage: z.string(),
})

/**
 * Expand an edge (fromNodeId → toNodeId) with a Quest Bridge.
 * Phase 5e: Epiphany Bridge structure, choices flavor the linear path.
 * AI generates quest passages; inserted as playable path between A and B.
 */
export async function expandEdgeWithQuest(
  adventureId: string,
  fromNodeId: string,
  toNodeId: string,
  moveId: string
): Promise<
  | { success: true; passageCount: number }
  | { success: false; error: string }
> {
  try {
    await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
    return { success: false, error: 'Quest Grammar AI is disabled.' }
  }

  const move = getMoveById(moveId)
  if (!move) return { success: false, error: `Unknown move: ${moveId}` }

  const adventure = await db.adventure.findUnique({
    where: { id: adventureId },
    include: { passages: true },
  })
  if (!adventure) return { success: false, error: 'Adventure not found' }

  const fromPassage = adventure.passages.find((p) => p.nodeId === fromNodeId)
  if (!fromPassage) return { success: false, error: `From passage not found: ${fromNodeId}` }

  let choices: Array<{ text: string; targetId: string }> = []
  try {
    choices = JSON.parse(fromPassage.choices || '[]')
  } catch {
    /* ignore */
  }
  const choiceIndex = choices.findIndex((c) => c.targetId === toNodeId)
  if (choiceIndex < 0) return { success: false, error: `No choice from ${fromNodeId} to ${toNodeId}` }

  const prefix = `bridge_${Date.now().toString(36)}_`

  const systemPrompt = `You are a narrative designer. Generate a Quest Bridge: Epiphany Bridge passages with choices that FLAVOR the path (linear movement—all choices lead forward).

Rules:
- Structure: orientation → rising engagement → tension → integration → consequence.
- Each passage: 2–3 choices that flavor tone/approach but lead to same next passage (linear).
- Move: "${move.name}" — ${move.narrative}. The transformation is this move.
- Voice: presence first, confident, economical. Second-person prose.`

  const userPrompt = `Generate a Quest Bridge. Move: ${move.name} — ${move.narrative}.

Return passages array with id, text, choices. Choices flavor the path; linear movement. Last passage choice targets: use "end" as placeholder for the node after the bridge.
Start passage: first id.`

  const inputKey = JSON.stringify({ adventureId, fromNodeId, toNodeId, moveId, feature: 'expand_edge_quest' })
  const modelId = process.env.QUEST_GRAMMAR_AI_MODEL || 'gpt-4o'

  const { object } = await generateObjectWithCache<z.infer<typeof questBridgeSchema>>({
    feature: 'expand_edge_quest',
    inputKey,
    model: modelId,
    schema: questBridgeSchema,
    system: systemPrompt,
    prompt: userPrompt,
    getModel: () => getOpenAI()(modelId),
  })

  const nodeIdMap = new Map<string, string>()
  const passageIds: string[] = []
  for (let i = 0; i < object.passages.length; i++) {
    const p = object.passages[i]
    const newNodeId = `${prefix}${i}`
    nodeIdMap.set(p.id, newNodeId)
    passageIds.push(newNodeId)
  }

  for (let i = 0; i < object.passages.length; i++) {
    const p = object.passages[i]
    const newNodeId = passageIds[i]
    const nextId = i + 1 < object.passages.length ? passageIds[i + 1] : toNodeId
    const mappedChoices = p.choices.map((c) => ({
      text: c.text,
      targetId: c.targetId === 'end' || !nodeIdMap.has(c.targetId) ? nextId : nodeIdMap.get(c.targetId)!,
    }))
    const choicesJson = JSON.stringify(mappedChoices.length ? mappedChoices : [{ text: 'Continue', targetId: nextId }])
    await db.passage.create({
      data: {
        adventureId,
        nodeId: newNodeId,
        text: p.text,
        choices: choicesJson,
      },
    })
  }

  choices[choiceIndex] = { ...choices[choiceIndex], targetId: passageIds[0] }
  await db.passage.update({
    where: { id: fromPassage.id },
    data: { choices: JSON.stringify(choices) },
  })

  revalidatePath('/admin/adventures')
  revalidatePath(`/admin/adventures/${adventureId}`)
  return { success: true, passageCount: object.passages.length }
}

export type UpgradeMode = 'wrapper' | 'replacement'

/**
 * Upgrade an existing quest to CYOA: create Adventure + QuestThread linked to the quest.
 * Preserves original quest for provenance (QuestThread.sourceQuestId).
 *
 * Wrapper: orientation passages lead to the quest as completion step.
 * Replacement: quest content (beats) becomes passages; final passage links to original quest.
 */
export async function upgradeQuestToCYOA(
  questId: string,
  mode: UpgradeMode
): Promise<
  | { success: true; adventureId: string; threadId: string }
  | { success: false; error: string }
> {
  let player
  try {
    player = await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  try {
    const quest = await db.customBar.findUnique({ where: { id: questId } })
    if (!quest) return { success: false, error: 'Quest not found' }

    const creatorId = player.id
    const questTitle = quest.title || 'Untitled Quest'
    const slug = `${questTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-cyoa-${Date.now()}`

    if (mode === 'wrapper') {
      // Orientation passages: node_0 → node_1 → node_2 → node_3 → completion (linked to quest)
      const orientationPassages: Array<{ id: string; text: string; next: string | null; linkedQuestId?: string }> = [
        {
          id: 'node_0',
          text: `**Orientation**\n\nYou are entering a living world mid-formation. Your participation matters.\n\nThis quest invites you: *${questTitle}*`,
          next: 'node_1',
        },
        {
          id: 'node_1',
          text: `**Rising engagement**\n\nSomething in you wants to move. The path ahead is forming.`,
          next: 'node_2',
        },
        {
          id: 'node_2',
          text: `**Tension**\n\nThe threshold is near. What will you choose?`,
          next: 'node_3',
        },
        {
          id: 'node_3',
          text: `**Integration**\n\nYou are ready. The quest awaits.`,
          next: 'completion',
        },
        {
          id: 'completion',
          text: quest.description,
          next: null,
          linkedQuestId: questId,
        },
      ]

      const adventure = await db.adventure.create({
        data: {
          slug,
          title: `${questTitle} (CYOA)`,
          status: 'ACTIVE',
          startNodeId: 'node_0',
          description: `Quest upgrade: ${questTitle}. Wrapper mode.`,
          visibility: 'PUBLIC_ONBOARDING',
        },
      })

      for (const p of orientationPassages) {
        const choicesJson = p.next
          ? JSON.stringify([{ text: 'Continue', targetId: p.next }])
          : '[]'
        await db.passage.create({
          data: {
            adventureId: adventure.id,
            nodeId: p.id,
            text: p.text,
            choices: choicesJson,
            linkedQuestId: p.linkedQuestId ?? null,
          },
        })
      }

      const thread = await db.questThread.create({
        data: {
          title: `${questTitle} (CYOA)`,
          description: `Upgraded from quest: ${questTitle}. Original quest preserved.`,
          creatorType: 'system',
          creatorId,
          adventureId: adventure.id,
          sourceQuestId: questId,
          status: 'active',
        },
      })

      await db.threadQuest.create({
        data: {
          threadId: thread.id,
          questId,
          position: 1,
        },
      })

      revalidatePath('/admin/adventures')
      revalidatePath('/admin/journeys')
      revalidatePath(`/admin/quests/${questId}`)
      return { success: true, adventureId: adventure.id, threadId: thread.id }
    }

    // Replacement mode: quest content → passages
    const content = (quest.description || '').trim() || quest.title || 'No content yet.'
    const beats = content
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (beats.length === 0) beats.push(content || 'Begin.')

    const passageIds = beats.map((_, i) => `beat_${i}`)
    const passageIdsWithEnd = [...passageIds, 'completion']

    const adventure = await db.adventure.create({
      data: {
        slug,
        title: `${questTitle} (CYOA)`,
        status: 'ACTIVE',
        startNodeId: passageIds[0],
        description: `Quest upgrade: ${questTitle}. Replacement mode.`,
        visibility: 'PUBLIC_ONBOARDING',
      },
    })

    for (let i = 0; i < beats.length; i++) {
      const nodeId = passageIds[i]
      const nextId = i + 1 < beats.length ? passageIds[i + 1] : 'completion'
      const choicesJson = JSON.stringify([{ text: 'Continue', targetId: nextId }])
      await db.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId,
          text: beats[i],
          choices: choicesJson,
        },
      })
    }

    // Completion passage: links to original quest
    await db.passage.create({
      data: {
        adventureId: adventure.id,
        nodeId: 'completion',
        text: `You have completed the journey. *${questTitle}*`,
        choices: '[]',
        linkedQuestId: questId,
      },
    })

    const thread = await db.questThread.create({
      data: {
        title: `${questTitle} (CYOA)`,
        description: `Upgraded from quest: ${questTitle}. Original quest preserved.`,
        creatorType: 'system',
        creatorId,
        adventureId: adventure.id,
        sourceQuestId: questId,
        status: 'active',
      },
    })

    await db.threadQuest.create({
      data: {
        threadId: thread.id,
        questId,
        position: 1,
      },
    })

    revalidatePath('/admin/adventures')
    revalidatePath('/admin/journeys')
    revalidatePath(`/admin/quests/${questId}`)
    return { success: true, adventureId: adventure.id, threadId: thread.id }
  } catch (e) {
    console.error('[upgradeQuestToCYOA]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to upgrade quest to CYOA',
    }
  }
}

/**
 * Merge multiple Adventures into one. Passages are prefixed to avoid node ID collisions.
 * First adventure's start node becomes the new start.
 */
export async function mergeAdventures(
  adventureIds: string[],
  title?: string,
  slug?: string
): Promise<
  | { success: true; adventureId: string }
  | { success: false; error: string }
> {
  try {
    await checkAdmin()
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
  }

  if (adventureIds.length < 2) {
    return { success: false, error: 'Select at least 2 adventures to merge.' }
  }

  try {
    const found = await db.adventure.findMany({
      where: { id: { in: adventureIds } },
      include: { passages: true },
    })
    const orderMap = new Map(adventureIds.map((id, i) => [id, i]))
    const adventures = found.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

    if (adventures.length !== adventureIds.length) {
      return { success: false, error: 'One or more adventures not found.' }
    }

    const effectiveTitle = title || `Merged: ${adventures.map((a) => a.title).join(' + ')}`
    const effectiveSlug =
      slug ?? `merged-${Date.now()}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const adventure = await db.adventure.create({
      data: {
        slug: effectiveSlug,
        title: effectiveTitle,
        status: 'ACTIVE',
        description: `Merged from ${adventures.length} adventures.`,
        visibility: 'PUBLIC_ONBOARDING',
      },
    })

    let newStartNodeId: string | null = null

    for (let i = 0; i < adventures.length; i++) {
      const adv = adventures[i]
      const prefix = `a${i}_`
      const nodeMap = new Map<string, string>()
      for (const p of adv.passages) {
        nodeMap.set(p.nodeId, prefix + p.nodeId)
      }

      for (const p of adv.passages) {
        const newNodeId = nodeMap.get(p.nodeId)!
        let choices: Array<{ text: string; targetId: string }> = []
        try {
          choices = JSON.parse(p.choices || '[]')
        } catch {
          /* ignore */
        }
        const updatedChoices = choices.map((c) => ({
          text: c.text,
          targetId: nodeMap.has(c.targetId) ? nodeMap.get(c.targetId)! : c.targetId,
        }))

        await db.passage.create({
          data: {
            adventureId: adventure.id,
            nodeId: newNodeId,
            text: p.text,
            choices: JSON.stringify(updatedChoices),
            linkedQuestId: p.linkedQuestId,
          },
        })
      }

      if (i === 0 && adv.startNodeId && nodeMap.has(adv.startNodeId)) {
        newStartNodeId = nodeMap.get(adv.startNodeId)!
      }
    }

    if (newStartNodeId) {
      await db.adventure.update({
        where: { id: adventure.id },
        data: { startNodeId: newStartNodeId },
      })
    }

    revalidatePath('/admin/adventures')
    return { success: true, adventureId: adventure.id }
  } catch (e) {
    console.error('[mergeAdventures]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to merge adventures',
    }
  }
}
