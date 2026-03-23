'use server'

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { compileQuest, buildQuestPromptContext, toSkeletonPacket } from '@/lib/quest-grammar'
import { compileQuestWithPrivileging } from '@/lib/quest-grammar/compileQuest'
import { getHexagramStructure } from '@/lib/iching-struct'
import type { BuildQuestPromptContextInput, QuestCompileInput, IChingContext } from '@/lib/quest-grammar'
import { getOpenAI } from '@/lib/openai'
import { generateObjectWithCache } from '@/lib/ai-with-cache'
import { parseTwee } from '@/lib/twee-parser'
import { z } from 'zod'
import { getMoveById, type SerializableQuestPacket } from '@/lib/quest-grammar'
import { compileCharacterCreationPacket } from '@/lib/quest-grammar/characterCreationPacket'
import { compileMovesGMPacket } from '@/lib/quest-grammar/movesGMPacket'
import { FACE_META } from '@/lib/quest-grammar/types'
import { getMovesForLens } from '@/lib/quest-grammar/lens-moves'
import { getFaceSentence } from '@/lib/face-sentences'
import { isBackendAvailable, compileQuestViaAgent } from '@/lib/agent-client'

const INITIATION_SLUG_PREFIX = 'bruised-banana-initiation'

/** Build IChingContext from hexagramId for quest generation. */
async function buildIChingContextFromHexagram(hexagramId: number): Promise<IChingContext> {
  const [hexagram, structure] = await Promise.all([
    db.bar.findUnique({ where: { id: hexagramId } }),
    Promise.resolve(getHexagramStructure(hexagramId)),
  ])
  return {
    hexagramId,
    hexagramName: hexagram?.name ?? `Hexagram ${hexagramId}`,
    hexagramTone: hexagram?.tone ?? '',
    hexagramText: hexagram?.text ?? '',
    upperTrigram: structure.upper,
    lowerTrigram: structure.lower,
  }
}

/** Extended input for compile actions — hexagramId builds ichingContext server-side. */
type CompileActionInput = QuestCompileInput & { hexagramId?: number }

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

/**
 * Server action: compile quest skeleton (structure only, placeholder text).
 * Admin reviews structure before generating flavor. Uses compileQuestWithPrivileging for structure.
 */
export async function compileQuestSkeletonAction(
  input: CompileActionInput
): Promise<SerializableQuestPacket | { error: string }> {
  try {
    const { hexagramId, ...rest } = input
    const ichingContext =
      input.ichingContext ?? (hexagramId ? await buildIChingContextFromHexagram(hexagramId) : undefined)
    const packet = await compileQuestWithPrivileging({ ...rest, ichingContext })
    const { telemetryHooks: _, ...serializable } = packet
    return toSkeletonPacket(serializable)
  } catch (e) {
    console.error('[compileQuestSkeletonAction]', e)
    return { error: e instanceof Error ? e.message : 'Skeleton compilation failed' }
  }
}

/**
 * Server action: compile quest with nation/playbook choice privileging.
 * Use from client components instead of compileQuestWithPrivileging (which uses Prisma).
 * When hexagramId is provided, builds ichingContext server-side for AI prompt context.
 */
export async function compileQuestWithPrivilegingAction(
  input: CompileActionInput
): Promise<SerializableQuestPacket | { error: string }> {
  try {
    const { hexagramId, ...rest } = input
    const ichingContext =
      input.ichingContext ?? (hexagramId ? await buildIChingContextFromHexagram(hexagramId) : undefined)
    const player = await getCurrentPlayer()
    const packet = await compileQuestWithPrivileging({
      ...rest,
      ichingContext,
      isAuthenticated: !!player,
    })
    const { telemetryHooks: _, ...serializable } = packet
    return serializable
  } catch (e) {
    console.error('[compileQuestWithPrivilegingAction]', e)
    return { error: e instanceof Error ? e.message : 'Compilation failed' }
  }
}

const questGrammarNodeTextSchema = z.object({
  nodeTexts: z
    .array(z.string())
    .min(6)
    .max(10)
    .describe('Grammatical, coherent story text for every spine node. Personal: 6 beats (or 7 with lens choice). Communal: 8 (or 9 with lens choice).'),
})

/** Generate depth passages for face-specific depth nodes via direct OpenAI. */
async function _generateDepthPassages(
  depthNodes: { id: string; text: string; wordCountEstimate?: number; depth?: number; gameMasterFace?: string }[],
  effectiveInput: BuildQuestPromptContextInput,
  ichingContext: IChingContext | undefined
) {
  const depthSchema = z.object({
    depthTexts: z.array(z.string()).length(depthNodes.length).describe('Action-oriented prose for each depth passage'),
  })
  const depthPromptParts = depthNodes.map((node, i) => {
    const face = node.gameMasterFace
    const meta = face ? FACE_META[face as keyof typeof FACE_META] : null
    const moves = face ? getMovesForLens(face) : []
    const move = moves[0]
    const faceSentence = face ? getFaceSentence(face) : ''
    return `${i}. Face: ${meta?.label ?? face}. Role: ${meta?.role ?? ''}. Mission: ${meta?.mission ?? ''}. Move: ${move?.name ?? '—'}. Converges to next spine beat. Entry: "${faceSentence}"`
  })
  const depthUserPrompt = `Write action-oriented depth passages. Each is a moment where the player descends from narrative understanding into direct engagement. The shadow gives permission to act. Be specific, concrete, and kinetic.

For each depth node:
${depthPromptParts.join('\n')}

Return ${depthNodes.length} refined depth texts (depthTexts array), one per node. Preserve any **bold** headers. Second-person prose.`

  const inputKey = JSON.stringify({
    unpackingAnswers: effectiveInput.unpackingAnswers,
    segment: effectiveInput.segment,
    questModel: effectiveInput.questModel ?? 'personal',
    ichingContext: ichingContext ?? null,
    feature: 'quest_grammar_ai',
  })
  const depthInputKey = inputKey + '_depth_' + depthNodes.map((n) => n.id).join(',')
  const modelId = process.env.QUEST_GRAMMAR_AI_MODEL || 'gpt-4o'

  const depthResult = await generateObjectWithCache<z.infer<typeof depthSchema>>({
    feature: 'quest_grammar_ai',
    inputKey: depthInputKey,
    model: modelId,
    schema: depthSchema,
    system: `You are writing action-oriented depth passages guided by Game Master faces. Each face is a Taoist sect head who teaches a specific approach. The player descends from narrative understanding into direct engagement through the face's lens. The shadow gives permission to act. Be specific, concrete, and kinetic. Second-person prose.`,
    prompt: depthUserPrompt,
    getModel: () => getOpenAI()(modelId),
  })
  for (let i = 0; i < depthNodes.length; i++) {
    depthNodes[i].text = depthResult.object.depthTexts[i]
    depthNodes[i].wordCountEstimate = depthNodes[i].text.trim().split(/\s+/).filter(Boolean).length
  }
}

/**
 * Compile quest with AI-enhanced node text for ALL beats.
 * AI transforms unpacking answers into narrative prose (never verbatim).
 */
export async function compileQuestWithAI(
  input: BuildQuestPromptContextInput & { hexagramId?: number }
): Promise<{ packet: SerializableQuestPacket } | { error: string }> {
  try {
    if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
      return { error: 'Quest Grammar AI is disabled. Set QUEST_GRAMMAR_AI_ENABLED=true to enable.' }
    }

    const { hexagramId, ...rest } = input
    const ichingContext =
      input.ichingContext ?? (hexagramId ? await buildIChingContextFromHexagram(hexagramId) : undefined)
    const sessionPlayer = await getCurrentPlayer()
    const effectiveInput = { ...rest, ichingContext, isAuthenticated: !!sessionPlayer }

    const packet = compileQuest(effectiveInput)

    // ---------------------------------------------------------------------------
    // Tier 1: Try Agent (backend Architect) — richer context, I Ching learning
    // ---------------------------------------------------------------------------
    const useAgent = process.env.AGENT_ROUTING_ENABLED !== 'false'
    if (useAgent) {
      try {
        const backendUp = await isBackendAvailable()
        if (backendUp) {
          const agentResult = await compileQuestViaAgent({
            unpackingAnswers: effectiveInput.unpackingAnswers as unknown as Record<string, string>,
            ichingContext,
            questGrammar: effectiveInput.questModel === 'communal' ? 'kotter' : 'epiphany_bridge',
            playerId: sessionPlayer?.id,
          })

          if (agentResult.output?.node_texts?.length) {
            const agentTexts = agentResult.output.node_texts
            const spineNodes = packet.nodes.filter((n) => !n.depth)
            const spineCount = Math.min(agentTexts.length, spineNodes.length)
            for (let i = 0; i < spineCount; i++) {
              packet.nodes[i].text = agentTexts[i]
              packet.nodes[i].wordCountEstimate = packet.nodes[i].text.trim().split(/\s+/).filter(Boolean).length
            }

            // Agent handled spine nodes — still need depth passages via direct AI
            // (depth passages are face-specific and need the existing prompt engineering)
            const depthNodes = packet.nodes.filter((n) => n.depth === 1)
            if (depthNodes.length > 0) {
              await _generateDepthPassages(depthNodes, effectiveInput, ichingContext)
            }

            const { telemetryHooks: _, ...serializable } = packet
            return { packet: serializable }
          }
        }
      } catch (agentErr) {
        console.warn('[compileQuestWithAI] Agent path failed, falling through to direct AI:', agentErr)
      }
    }

    // ---------------------------------------------------------------------------
    // Tier 2: Direct OpenAI (existing behavior)
    // ---------------------------------------------------------------------------
    const promptContext = await buildQuestPromptContext(effectiveInput, packet)
    const isCommunal = effectiveInput.questModel === 'communal'

    const authHint = effectiveInput.isAuthenticated
      ? `

AUTHENTICATED PLAYER: The player is already logged in. Do not mention creating an account, signing up, or cold signup. Do not frame the ending as "create your account." Donation/contribution links may remain where appropriate.`
      : ''

    const systemPrompt = isCommunal
      ? `You are a narrative designer for a choose-your-own-adventure quest. Your task is to turn the prompt context into grammatical, emotionally coherent story text for each Kotter stage.

Rules:
- Output clear, second-person prose. No fragments or placeholder text.
- Preserve any **bold** headers and structure.
- Keep the communal change arc: urgency → coalition → vision → communicate → obstacles → wins → build on → anchor.
- Each node should feel like part of one continuous story.
- Follow the Voice Style Guide: presence first, confident tone, economical with words.
- CRITICAL: Transform the creator unpacking answers into narrative. NEVER reproduce Q1–Q6 answers verbatim — weave them into story. The unpacking answers are raw material, not copy.
- For action nodes (wins, build_on, anchor): preserve the action link ([Contribute to the campaign](/event/donate)) but wrap it in compelling narrative prose.${authHint}`
      : `You are a narrative designer for a choose-your-own-adventure quest. Your task is to turn the prompt context into grammatical, emotionally coherent story text for each beat.

Rules:
- Output clear, second-person prose. No fragments or placeholder text.
- Preserve any **bold** headers and structure.
- Keep the emotional arc: orientation → rising engagement → tension → integration → transcendence → consequence.
- Each node should feel like part of one continuous story.
- Follow the Voice Style Guide: presence first, confident tone, economical with words.
- CRITICAL: Transform the creator unpacking answers into narrative. NEVER reproduce Q1–Q6 answers verbatim — weave them into story. The unpacking answers are raw material, not copy.
- For action nodes (transcendence, consequence): preserve the action link ([Contribute to the campaign](/event/donate)) but wrap it in compelling narrative prose.

Grammatical example (generate structure like this — 6 beats, each 2–4 sentences):
- Orientation: Scene-setting from unpacking. "You are entering a living world mid-formation. Your participation matters."
- Rising engagement: Dissatisfied state creates energy. "What would have to be true?"
- Tension: Gap between from-state and to-state. Shadow voices surface.
- Integration: Aligned action translates channel into movement. Threshold is near.
- Transcendence: Moment of commitment. Include [Contribute to the campaign](/event/donate) wrapped in narrative.
- Consequence: "You are now an Early Believer." Structural consequence.${authHint}`

    const framing = effectiveInput.segment === 'player'
      ? 'You are entering a living world mid-formation. Your participation matters.'
      : 'You are protecting emergence. Your stewardship catalyzes what wants to happen.'

    const hasLensChoice = ichingContext && packet.nodes.some((n) => n.id === 'lens_choice')

    let userPrompt = isCommunal
      ? `${promptContext}

---

Write narrative text for ALL ${hasLensChoice ? 9 : 8} spine nodes. Transform unpacking answers into story — never reproduce them verbatim.
${hasLensChoice ? '0. Lens choice — Invite the player to choose their developmental lens. Brief, evocative.\n' : ''}${hasLensChoice ? '1' : '0'}. Urgency — weave in the experience, current life context, and framing (${framing}). Create urgency.
${hasLensChoice ? '2' : '1'}. Coalition — who will contribute? Use shadow voices as tension, build the coalition.
${hasLensChoice ? '3' : '2'}. Vision — what does success look like? Satisfied state, "What would have to be true?"
${hasLensChoice ? '4' : '3'}. Communicate — share the need, aligned action, spread the message.
${hasLensChoice ? '5' : '4'}. Obstacles — what blocks progress? Dissatisfied state, shadow voices as real obstacles.
${hasLensChoice ? '6' : '5'}. Wins — first milestone reached. Include the action link: [Contribute to the campaign](/event/donate). Wrap it in narrative.
${hasLensChoice ? '7' : '6'}. Build On — scale the wins. Iterate and amplify. Include action link if relevant.
${hasLensChoice ? '8' : '7'}. Anchor — sustainable change. Contribution logged. Identity transformation: "You are now an Early Believer."

Return ${hasLensChoice ? 9 : 8} refined node texts (nodeTexts array), one per stage.`
      : `${promptContext}

---

Write narrative text for ALL ${hasLensChoice ? 7 : 6} spine nodes. Transform unpacking answers into story — never reproduce them verbatim.
${hasLensChoice ? '0. Lens choice — Invite the player to choose their developmental lens. Brief, evocative.\n' : ''}${hasLensChoice ? '1' : '0'}. Orientation — weave in the experience, current life context, and framing (${framing}). Set the scene.
${hasLensChoice ? '2' : '1'}. Rising engagement — the dissatisfied state creates rising energy. "What would have to be true?"
${hasLensChoice ? '3' : '2'}. Tension — the gap between from-state and to-state is real. Shadow voices surface.
${hasLensChoice ? '4' : '3'}. Integration — aligned action translates the primary channel into movement. The threshold is near.
${hasLensChoice ? '5' : '4'}. Transcendence — cross the threshold. Moment of commitment. Include action link: [Contribute to the campaign](/event/donate). Wrap in narrative.
${hasLensChoice ? '6' : '5'}. Consequence — structural consequence. Identity transformation: "You are now an Early Believer." Unlock: founders thread, patron updates.

Return ${hasLensChoice ? 7 : 6} refined node texts (nodeTexts array), one per node.`

    if (effectiveInput.adminFeedback) {
      userPrompt += `\n\n---\n\nAdmin feedback on previous generation (incorporate this into the regeneration):\n${effectiveInput.adminFeedback}`
    }

    const inputKey = JSON.stringify({
      unpackingAnswers: effectiveInput.unpackingAnswers,
      alignedAction: effectiveInput.alignedAction,
      segment: effectiveInput.segment,
      questModel: effectiveInput.questModel ?? 'personal',
      targetNationId: effectiveInput.targetNationId ?? null,
      targetArchetypeId: effectiveInput.targetArchetypeId ?? null,
      targetArchetypeIds: effectiveInput.targetArchetypeIds ?? [],
      developmentalLens: effectiveInput.developmentalLens ?? null,
      playerPOV: effectiveInput.playerPOV ?? null,
      expectedMoves: effectiveInput.expectedMoves ?? [],
      ichingContext: effectiveInput.ichingContext ?? null,
      adminFeedback: effectiveInput.adminFeedback ?? null,
      isAuthenticated: effectiveInput.isAuthenticated ?? false,
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

    const spineCount = Math.min(object.nodeTexts.length, packet.nodes.filter((n) => !n.depth).length)
    for (let i = 0; i < spineCount; i++) {
      packet.nodes[i].text = object.nodeTexts[i]
      packet.nodes[i].wordCountEstimate = packet.nodes[i].text.trim().split(/\s+/).filter(Boolean).length
    }

    const depthNodes = packet.nodes.filter((n) => n.depth === 1)
    if (depthNodes.length > 0) {
      await _generateDepthPassages(depthNodes, effectiveInput, ichingContext)
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
          })
        ),
      })
    )
    .min(4)
    .describe('Passages for the CYOA flow. 2–4 choices per passage.'),
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

    const player = await getCurrentPlayer()
    const packet = compileQuest({ ...input, isAuthenticated: !!player })
    const promptContext = await buildQuestPromptContext({ ...input, isAuthenticated: !!player }, packet)

    const overviewAuthRule = player
      ? `- Final passage: choice to continue the journey (e.g. targetId: redirect:/hand or next in-world step). Do NOT use cold signup or "Create my account" — the player is already logged in.`
      : `- Final passage: choice to "Create my account" (targetId: signup) or similar cold-start CTA.`

    const systemPrompt = `You are a narrative designer for a choose-your-own-adventure quest. From the prompt context, generate a complete quest skeleton: objectives and passages with choices.

Rules:
- Output 4–6 passages. One beat per passage. 2–3 choices per passage (style guide; except final).
- Passage IDs: node_0, node_1, ... or similar. Start passage: node_0.
- Clear second-person prose. Follow Voice Style Guide: presence first, confident, economical.
- Emotional arc: orientation → rising engagement → tension → integration → consequence.
${overviewAuthRule}`

    const userPrompt = `${promptContext}

---

Generate a quest skeleton. Return:
- objectives: array of 3–5 strings (what a completer achieves)
- passages: array of { id, text, choices: [{ text, targetId }] }
- startPassage: "node_0"`

    const inputKey = JSON.stringify({
      ...input,
      targetNationId: input.targetNationId ?? null,
      targetArchetypeId: input.targetArchetypeId ?? null,
      ichingContext: input.ichingContext ?? null,
      isAuthenticated: !!player,
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
      const metadata =
        node.actionType === 'cast_iching' && node.castIChingTargetId
          ? { actionType: 'cast_iching', castIChingTargetId: node.castIChingTargetId }
          : undefined
      await db.passage.upsert({
        where: {
          adventureId_nodeId: {
            adventureId: adventure.id,
            nodeId: node.id,
          },
        },
        update: { text: node.text, choices: choicesJson, ...(metadata && { metadata }) },
        create: {
          adventureId: adventure.id,
          nodeId: node.id,
          text: node.text,
          choices: choicesJson,
          ...(metadata && { metadata }),
        },
      })
    }

    revalidatePath('/admin/quest-grammar')
    revalidatePath('/admin/adventures')
    revalidatePath('/campaign/initiation')
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
 * When moveType provided, creates QuestAdventureLink for 4-move gameboard.
 */
export async function publishQuestPacketToPassagesWithSourceQuest(
  packet: SerializableQuestPacket,
  sourceQuestId: string,
  questTitle: string,
  moveType?: string
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
        status: 'DRAFT',
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

    if (moveType && ['wakeUp', 'cleanUp', 'growUp', 'showUp'].includes(moveType)) {
      await db.questAdventureLink.upsert({
        where: {
          questId_moveType: { questId: sourceQuestId, moveType },
        },
        create: {
          questId: sourceQuestId,
          adventureId: adventure.id,
          moveType,
        },
        update: { adventureId: adventure.id },
      })
    }

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

/**
 * Publish I Ching grammatic quest to a player.
 * Creates Adventure + Passages + QuestThread + CustomBar; assigns thread to player.
 * No admin required — called from generateQuestFromReading.
 */
export async function publishIChingQuestToPlayer(
  packet: SerializableQuestPacket,
  playerId: string,
  questTitle: string,
  hexagramId: number,
  campaignContext?: { campaignRef?: string; campaignGoal?: string }
): Promise<
  | { success: true; adventureId: string; threadId: string; questId: string }
  | { success: false; error: string }
> {
  try {
    const slug = `iching-${hexagramId}-${playerId.slice(0, 8)}-${Date.now().toString(36)}`
    const title = `${questTitle} (I Ching)`

    const quest = await db.customBar.create({
      data: {
        creatorId: playerId,
        title,
        description: packet.signature.satisfiedLabels[0]
          ? `From ${packet.signature.satisfiedLabels[0]} to ${packet.signature.dissatisfiedLabels[0] ?? 'clarity'}.`
          : 'An I Ching–guided quest.',
        type: 'vibe',
        reward: 1,
        status: 'active',
        visibility: 'private',
        storyPath: 'personal',
        hexagramId,
        isSystem: true,
        inputs: JSON.stringify([]),
        campaignRef: campaignContext?.campaignRef ?? null,
        campaignGoal: campaignContext?.campaignGoal ?? null,
      },
    })
    await db.customBar.update({ where: { id: quest.id }, data: { rootId: quest.id } })

    const adventure = await db.adventure.create({
      data: {
        slug,
        title,
        status: 'ACTIVE',
        startNodeId: packet.startNodeId,
        description: `I Ching grammatic quest: ${questTitle}.`,
        visibility: 'PRIVATE_QUEST',
      },
    })

    for (const node of packet.nodes) {
      const choicesJson = JSON.stringify(node.choices)
      await db.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId: node.id,
          text: node.text,
          choices: choicesJson,
        },
      })
    }

    const thread = await db.questThread.create({
      data: {
        title,
        description: `I Ching reading: ${questTitle}.`,
        creatorType: 'system',
        creatorId: playerId,
        adventureId: adventure.id,
        status: 'active',
      },
    })

    await db.threadQuest.create({
      data: {
        threadId: thread.id,
        questId: quest.id,
        position: 1,
      },
    })

    await db.threadProgress.create({
      data: {
        threadId: thread.id,
        playerId,
      },
    })

    revalidatePath('/')
    revalidatePath('/adventures')
    return { success: true, adventureId: adventure.id, threadId: thread.id, questId: quest.id }
  } catch (e) {
    console.error('[publishIChingQuestToPlayer]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to publish I Ching quest',
    }
  }
}

/**
 * Publish gameboard-aligned grammatic quest to a player.
 * Creates Adventure + Passages + QuestThread + CustomBar; assigns to player.
 * Quest is nested under parentQuestId with campaignRef.
 */
export async function publishGameboardAlignedQuestToPlayer(
  packet: SerializableQuestPacket,
  playerId: string,
  parentQuestId: string,
  campaignRef: string,
  parentTitle: string
): Promise<
  | { success: true; adventureId: string; threadId: string; questId: string }
  | { success: false; error: string }
> {
  try {
    const slug = `gameboard-${parentQuestId}-${playerId.slice(0, 8)}-${Date.now().toString(36)}`
    const title = `${packet.signature.satisfiedLabels[0] ?? 'Quest'} — ${parentTitle}`

    const quest = await db.customBar.create({
      data: {
        creatorId: playerId,
        title,
        description: packet.signature.satisfiedLabels[0]
          ? `From ${packet.signature.dissatisfiedLabels[0] ?? 'stuck'} to ${packet.signature.satisfiedLabels[0]}.`
          : `Aligned with ${parentTitle}.`,
        type: 'vibe',
        reward: 1,
        status: 'active',
        visibility: 'private',
        storyPath: 'personal',
        parentId: parentQuestId,
        rootId: parentQuestId,
        campaignRef,
        allyshipDomain: 'GATHERING_RESOURCES',
        moveType: packet.signature.moveType ?? undefined,
        isSystem: true,
        inputs: JSON.stringify([]),
      },
    })

    const adventure = await db.adventure.create({
      data: {
        slug,
        title,
        status: 'ACTIVE',
        startNodeId: packet.startNodeId,
        description: `Gameboard-aligned quest under ${parentTitle}.`,
        visibility: 'PRIVATE_QUEST',
      },
    })

    for (const node of packet.nodes) {
      const choicesJson = JSON.stringify(node.choices)
      await db.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId: node.id,
          text: node.text,
          choices: choicesJson,
        },
      })
    }

    const thread = await db.questThread.create({
      data: {
        title,
        description: `Gameboard quest under ${parentTitle}.`,
        creatorType: 'system',
        creatorId: playerId,
        adventureId: adventure.id,
        status: 'active',
      },
    })

    await db.threadQuest.create({
      data: {
        threadId: thread.id,
        questId: quest.id,
        position: 1,
      },
    })

    await db.threadProgress.create({
      data: {
        threadId: thread.id,
        playerId,
      },
    })

    await db.playerQuest.create({
      data: {
        playerId,
        questId: quest.id,
        status: 'assigned',
      },
    })

    revalidatePath('/')
    revalidatePath('/campaign/board')
    return { success: true, adventureId: adventure.id, threadId: thread.id, questId: quest.id }
  } catch (e) {
    console.error('[publishGameboardAlignedQuestToPlayer]', e)
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Failed to publish gameboard quest',
    }
  }
}

export type CreateAdventureFromTweeOptions = {
  title?: string
  slug?: string
  /** When set, creates QuestThread with sourceQuestId; end passage links to quest; no CustomBars per passage. */
  sourceQuestId?: string
  /** When set with sourceQuestId, creates QuestAdventureLink for 4-move gameboard. */
  moveType?: string
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
        status: 'DRAFT',
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

      if (opts.moveType && ['wakeUp', 'cleanUp', 'growUp', 'showUp'].includes(opts.moveType)) {
        await db.questAdventureLink.upsert({
          where: {
            questId_moveType: { questId: sourceQuestId, moveType: opts.moveType },
          },
          create: {
            questId: sourceQuestId,
            adventureId: adventure.id,
            moveType: opts.moveType,
          },
          update: { adventureId: adventure.id },
        })
      }

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
  adventureId: string,
  opts?: { skipAdminCheck?: boolean }
): Promise<
  | { success: true; adventureId: string; passageCount: number }
  | { success: false; error: string }
> {
  let player
  if (opts?.skipAdminCheck) {
    const admin = await db.player.findFirst({
      where: { roles: { some: { role: { key: 'admin' } } } },
      select: { id: true },
    })
    player = admin ?? (await db.player.findFirst({ select: { id: true } }))
    if (!player) return { success: false, error: 'No player found for creatorId' }
  } else {
    try {
      player = await checkAdmin()
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Not authorized' }
    }
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

      const metadata =
        node.actionType === 'cast_iching' && node.castIChingTargetId
          ? {
              actionType: 'cast_iching',
              castIChingTargetId: nodeIdMap.has(node.castIChingTargetId)
                ? nodeIdMap.get(node.castIChingTargetId)!
                : node.castIChingTargetId,
            }
          : undefined

      await db.passage.create({
        data: {
          adventureId: adventure.id,
          nodeId: newNodeId,
          text: node.text,
          choices: JSON.stringify(choices),
          linkedQuestId: bar.id,
          ...(metadata && { metadata }),
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

    await db.adventure.update({
      where: { id: adventureId },
      data: { status: 'DRAFT' },
    })

    if (!opts?.skipAdminCheck) {
      revalidatePath('/admin/adventures')
      revalidatePath(`/admin/adventures/${adventureId}`)
      revalidatePath('/admin/journeys')
    }
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

/**
 * Server action: get character creation packet with nations/playbooks from DB.
 * Pure compileCharacterCreationPacket cannot call Prisma.
 */
export async function getCharacterCreationPacket(segment: 'player' | 'sponsor' = 'player'): Promise<
  | { packet: SerializableQuestPacket }
  | { error: string }
> {
  try {
    await checkAdmin()
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Not authorized' }
  }

  try {
    const [nations, archetypes] = await Promise.all([
      db.nation.findMany({
        where: { archived: false },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      db.archetype.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ])

    const packet = compileCharacterCreationPacket({
      segment,
      nations: nations.map((n) => ({ id: n.id, name: n.name })),
      archetypes: archetypes.map((p) => ({ id: p.id, name: p.name })),
    })
    return { packet }
  } catch (e) {
    console.error('[getCharacterCreationPacket]', e)
    return { error: e instanceof Error ? e.message : 'Failed to get packet' }
  }
}

/**
 * Publish chained initiation adventure: intro + character creation + moves/GM.
 * Creates Adventure, publishes intro passages, appends char and moves packets.
 * @see .specify/specs/auto-flow-chained-initiation/spec.md
 */
export async function publishChainedInitiationAdventure(
  introPacket: SerializableQuestPacket,
  charPacket: SerializableQuestPacket,
  movesGMPacket: SerializableQuestPacket,
  slug: string,
  opts?: { campaignRef?: string; sourceQuestId?: string | null; skipAdminCheck?: boolean }
): Promise<
  | { success: true; adventureId: string; passageCount: number }
  | { error: string }
> {
  if (!opts?.skipAdminCheck) {
    try {
      await checkAdmin()
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Not authorized' }
    }
  }

  try {
    const adventure = await db.adventure.upsert({
      where: { slug },
      update: {
        title: `Chained Initiation (${slug})`,
        status: 'ACTIVE',
        startNodeId: introPacket.startNodeId,
        description: `Chained initiation: intro + character creation + moves/GM.`,
      },
      create: {
        slug,
        title: `Chained Initiation (${slug})`,
        status: 'ACTIVE',
        startNodeId: introPacket.startNodeId,
        description: `Chained initiation: intro + character creation + moves/GM.`,
        visibility: 'PUBLIC_ONBOARDING',
      },
    })

    for (const node of introPacket.nodes) {
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

    const appendOpts = opts?.skipAdminCheck ? { skipAdminCheck: true } : undefined
    const append1 = await appendQuestToAdventure(charPacket, adventure.id, appendOpts)
    if (!append1.success) return append1

    const append2 = await appendQuestToAdventure(movesGMPacket, adventure.id, appendOpts)
    if (!append2.success) return append2

    if (opts?.sourceQuestId) {
      const passages = await db.passage.findMany({
        where: { adventureId: adventure.id },
      })
      const signupPassage = passages.find((p) => p.nodeId.endsWith('moves_signup'))
      if (signupPassage) {
        await db.passage.update({
          where: { id: signupPassage.id },
          data: { linkedQuestId: opts.sourceQuestId },
        })
      }
    }

    const passageCount = await db.passage.count({ where: { adventureId: adventure.id } })
    if (!opts?.skipAdminCheck) {
      revalidatePath('/admin/adventures')
      revalidatePath('/campaign/board')
    }
    return {
      success: true,
      adventureId: adventure.id,
      passageCount,
    }
  } catch (e) {
    console.error('[publishChainedInitiationAdventure]', e)
    return {
      error: e instanceof Error ? e.message : 'Failed to publish chained initiation',
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

  await db.adventure.update({
    where: { id: adventureId },
    data: { status: 'DRAFT' },
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
- Each passage: 2–4 choices that flavor tone/approach but lead to same next passage (linear).
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

  await db.adventure.update({
    where: { id: adventureId },
    data: { status: 'DRAFT' },
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
          status: 'DRAFT',
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
        status: 'DRAFT',
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
        status: 'DRAFT',
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
