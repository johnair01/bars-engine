/**
 * Spoke Adventure generator — first-hit AI generation + cache by (gmFace, moveType, campaignRef[, spokeIndex]).
 *
 * findOrGenerateSpokeAdventure():
 *   1. Check DB for existing CYOA_SPOKE Adventure matching (gmFace, moveType, campaignRef)
 *   2. If found → return cached adventureId (no AI call)
 *   3. If not found → generate via Vercel AI SDK, persist as CYOA_SPOKE Adventure + passages
 *
 * Cache invalidation:
 *   invalidateSpokeAdventuresForCampaign() — called when GM re-saves master playbookTemplate
 *   Archives (status → ARCHIVED) all CYOA_SPOKE Adventures for the given campaignRef.
 *
 * buildIntakePromptContext():
 *   Standalone context assembler — NOT coupled to buildQuestPromptContext.
 *   Inputs: gmFace, moveType, campaignRef + campaign metadata from DB.
 */

import { generateObject } from 'ai'
import { z } from 'zod'
import { getOpenAI } from '@/lib/openai'
import { db } from '@/lib/db'
import type { GmFaceKey, IntakeMoveType } from './types'
import { SD_LADDER } from './types'

// ---------------------------------------------------------------------------
// Spoke passage schema (AI output)
// ---------------------------------------------------------------------------

const SpokePassageSchema = z.object({
  nodeId: z.string(),
  text: z.string(),
  isTerminal: z.boolean().optional(),
  choices: z.array(
    z.object({
      text: z.string(),
      targetId: z.string(),
      // Optional moveType tag — player sees only text; routing is hidden
      moveType: z.enum(['wakeUp', 'cleanUp', 'growUp', 'showUp']).optional(),
    }),
  ),
})

const SpokeAdventureSchema = z.object({
  title: z.string(),
  description: z.string(),
  startNodeId: z.string(),
  passages: z.array(SpokePassageSchema).min(3).max(12),
})

type SpokeAdventureAI = z.infer<typeof SpokeAdventureSchema>

// ---------------------------------------------------------------------------
// GM face → thematic descriptor (used in prompt, never shown to player)
// ---------------------------------------------------------------------------

const GM_FACE_DESCRIPTORS: Record<GmFaceKey, string> = {
  shaman:     'ritual, belonging, ancestral wisdom, and the power of shared story',
  challenger: 'bold action, edge-meeting, raw power, and cutting through obstacles',
  regent:     'order, clear roles, structured progress, and reliable process',
  architect:  'strategic thinking, systems design, optimization, and measurable achievement',
  diplomat:   'relational warmth, care, pluralistic inclusion, and mutual recognition',
  sage:       'integral perspective, meta-awareness, synthesis, and holding complexity',
}

const MOVE_TYPE_DESCRIPTORS: Record<IntakeMoveType, string> = {
  wakeUp:  'awareness, threshold crossing, and seeing what is actually true',
  cleanUp: 'responsibility, repair, amends, and honest reckoning',
  growUp:  'development, capability-building, and real maturation',
  showUp:  'committed presence, showing up for others, and taking action',
}

// ---------------------------------------------------------------------------
// buildIntakePromptContext
// ---------------------------------------------------------------------------

/** When the spoke is launched from a campaign hub portal or intake (slot + hex + Kotter stage). */
export type HubSpokePromptContext = {
  spokeIndex: number
  hexagramId: number
  kotterStage: number
}

export interface IntakePromptContext {
  gmFace: GmFaceKey
  moveType: IntakeMoveType
  campaignRef: string
  campaignName: string
  campaignDescription: string
  gmFaceDescriptor: string
  moveTypeDescriptor: string
  hubSpoke?: HubSpokePromptContext
}

export async function buildIntakePromptContext(
  gmFace: GmFaceKey,
  moveType: IntakeMoveType,
  campaignRef: string,
  hubSpoke?: HubSpokePromptContext,
): Promise<IntakePromptContext> {
  // Fetch campaign context from the CYOA_INTAKE Adventure's description
  // (no standalone Campaign model — campaigns are identified by string refs)
  const intakeAdventure = await db.adventure.findFirst({
    where: { adventureType: 'CYOA_INTAKE', campaignRef, status: 'ACTIVE' },
    select: { title: true, description: true },
  })

  return {
    gmFace,
    moveType,
    campaignRef,
    campaignName: intakeAdventure?.title ?? campaignRef,
    campaignDescription: intakeAdventure?.description ?? '',
    gmFaceDescriptor: GM_FACE_DESCRIPTORS[gmFace],
    moveTypeDescriptor: MOVE_TYPE_DESCRIPTORS[moveType],
    ...(hubSpoke != null ? { hubSpoke } : {}),
  }
}

// ---------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------

function buildSpokePrompt(ctx: IntakePromptContext): string {
  const hubPlacement =
    ctx.hubSpoke != null
      ? `

Structural placement (authoring metadata — do not name these system labels to the player):
- Collective pacing stage (Kotter 1–8): ${ctx.hubSpoke.kotterStage}
- Hub wheel spoke (0–7): ${ctx.hubSpoke.spokeIndex}
- I Ching hexagram id for this spoke (1–64): ${ctx.hubSpoke.hexagramId}
Let this placement subtly color stakes and imagery; avoid exposition about "stages", "spokes", or divination.`
      : ''

  return `You are generating a short CYOA (Choose Your Own Adventure) text for a player in the "${ctx.campaignName}" campaign.

Campaign context: ${ctx.campaignDescription || 'A community-centered campaign for growth and action.'}

This adventure is tailored to a player whose current energy resonates with:
- Theme: ${ctx.gmFaceDescriptor}
- Personal move: ${ctx.moveTypeDescriptor}${hubPlacement}

Requirements:
- 4–8 passage nodes total (including start and 1–2 terminal endings)
- Each non-terminal passage has 2–3 choices
- Choices are thematically rich but do NOT name any "faces", "GM faces", or Spiral Dynamics levels
- Terminal passages (isTerminal: true) end with a sense of completion and forward momentum
- The first passage (startNodeId) draws the player in with a scene or question
- Text is warm, second-person ("you"), evocative, and brief (2–4 sentences per passage)
- Choices on the final branching passage may include a moveType tag (wakeUp/cleanUp/growUp/showUp) matching the theme

Return a JSON object matching this structure exactly:
{
  "title": "...",
  "description": "...",
  "startNodeId": "start",
  "passages": [
    {
      "nodeId": "start",
      "text": "...",
      "choices": [
        { "text": "...", "targetId": "..." }
      ]
    },
    ...
    {
      "nodeId": "end_a",
      "text": "...",
      "isTerminal": true,
      "choices": []
    }
  ]
}`
}

async function generateSpokeAdventureContent(
  ctx: IntakePromptContext,
): Promise<SpokeAdventureAI | null> {
  try {
    const result = await generateObject({
      model: getOpenAI()('gpt-4o-mini'),
      schema: SpokeAdventureSchema,
      prompt: buildSpokePrompt(ctx),
      maxOutputTokens: 2000,
    })
    return result.object
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// findOrGenerateSpokeAdventure — public API
// ---------------------------------------------------------------------------

export interface FindOrGenerateResult {
  adventureId: string
  generated: boolean
  gmFace: GmFaceKey
  moveType: IntakeMoveType
}

/**
 * Look up a cached CYOA_SPOKE Adventure for (gmFace, moveType, campaignRef).
 * If not found, generate via AI and persist.
 * Uses SD ladder ascending reroute: if exact branch unavailable, try next face up.
 *
 * Returns adventureId + whether it was freshly generated.
 * Returns null if generation fails and no cache hit anywhere on the SD ladder.
 */
export async function findOrGenerateSpokeAdventure(
  gmFace: GmFaceKey,
  moveType: IntakeMoveType,
  campaignRef: string,
  hubSpoke?: HubSpokePromptContext,
): Promise<FindOrGenerateResult | null> {
  const cached = await findCachedSpoke(gmFace, moveType, campaignRef, hubSpoke)
  if (cached) {
    return { adventureId: cached.adventureId, generated: false, gmFace: cached.gmFace, moveType }
  }

  const ctx = await buildIntakePromptContext(gmFace, moveType, campaignRef, hubSpoke)
  const generated = await generateSpokeAdventureContent(ctx)
  if (!generated) return null

  const adventureId = await persistSpokeAdventure(
    generated,
    gmFace,
    moveType,
    campaignRef,
    hubSpoke,
  )
  if (!adventureId) return null

  return { adventureId, generated: true, gmFace, moveType }
}

// ---------------------------------------------------------------------------
// findCachedSpoke — DB lookup with SD ladder reroute
// ---------------------------------------------------------------------------

function spokeScopedCacheKey(
  face: GmFaceKey,
  move: IntakeMoveType,
  spokeIndex: number,
): string {
  return `${face}::${move}::s${spokeIndex}`
}

async function findCachedSpoke(
  gmFace: GmFaceKey,
  moveType: IntakeMoveType,
  campaignRef: string,
  hubSpoke?: HubSpokePromptContext,
): Promise<{ adventureId: string; gmFace: GmFaceKey } | null> {
  const candidates = await db.adventure.findMany({
    where: { adventureType: 'CYOA_SPOKE', campaignRef, status: 'ACTIVE' },
    select: { id: true, playbookTemplate: true },
  })

  const map = new Map<string, string>()
  for (const c of candidates) {
    try {
      const meta = JSON.parse(c.playbookTemplate ?? '{}') as {
        gmFace?: string
        moveType?: string
        spokeIndex?: number
      }
      if (!meta.gmFace || !meta.moveType) continue
      const legacyKey = `${meta.gmFace}::${meta.moveType}`
      if (!map.has(legacyKey)) map.set(legacyKey, c.id)
      if (
        typeof meta.spokeIndex === 'number' &&
        meta.spokeIndex >= 0 &&
        meta.spokeIndex <= 7
      ) {
        const sk = spokeScopedCacheKey(
          meta.gmFace as GmFaceKey,
          meta.moveType as IntakeMoveType,
          meta.spokeIndex,
        )
        if (!map.has(sk)) map.set(sk, c.id)
      }
    } catch { /* skip malformed */ }
  }

  const startIdx = SD_LADDER.indexOf(gmFace)
  for (let i = startIdx; i < SD_LADDER.length; i++) {
    const candidateFace = SD_LADDER[i]
    if (
      hubSpoke != null &&
      hubSpoke.spokeIndex >= 0 &&
      hubSpoke.spokeIndex <= 7
    ) {
      const scoped = map.get(
        spokeScopedCacheKey(candidateFace, moveType, hubSpoke.spokeIndex),
      )
      if (scoped) return { adventureId: scoped, gmFace: candidateFace }
    }
    const legacy = map.get(`${candidateFace}::${moveType}`)
    if (legacy) return { adventureId: legacy, gmFace: candidateFace }
  }

  return null
}

// ---------------------------------------------------------------------------
// persistSpokeAdventure — write generated content to DB
// ---------------------------------------------------------------------------

async function persistSpokeAdventure(
  content: SpokeAdventureAI,
  gmFace: GmFaceKey,
  moveType: IntakeMoveType,
  campaignRef: string,
  hubSpoke?: HubSpokePromptContext,
): Promise<string | null> {
  const slug = `spoke-${campaignRef}-${gmFace}-${moveType}-${Date.now()}`

  const templateMeta: Record<string, unknown> = {
    gmFace,
    moveType,
    generatedAt: new Date().toISOString(),
  }
  if (hubSpoke != null) {
    templateMeta.spokeIndex = hubSpoke.spokeIndex
    templateMeta.hexagramId = hubSpoke.hexagramId
    templateMeta.kotterStage = hubSpoke.kotterStage
  }

  try {
    const adventure = await db.adventure.create({
      data: {
        slug,
        title: content.title,
        description: content.description,
        adventureType: 'CYOA_SPOKE',
        campaignRef,
        status: 'ACTIVE',
        startNodeId: content.startNodeId,
        playbookTemplate: JSON.stringify(templateMeta),
        passages: {
          create: content.passages.map((p) => ({
            nodeId: p.nodeId,
            text: p.text,
            choices: JSON.stringify(
              p.choices.map((c) => ({
                text: c.text,
                targetId: c.targetId,
                ...(c.moveType ? { moveType: c.moveType } : {}),
              })),
            ),
            // Store isTerminal in metadata JSON so the adventure player can detect it
            ...(p.isTerminal ? { metadata: { isTerminal: true } } : {}),
          })),
        },
      },
      select: { id: true },
    })
    return adventure.id
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// invalidateSpokeAdventuresForCampaign — cache invalidation on GM re-save
// ---------------------------------------------------------------------------

/**
 * Archive all CYOA_SPOKE Adventures for a campaign.
 * Called when a GM re-saves the master playbookTemplate on a CYOA_INTAKE Adventure.
 * Archived adventures are kept for audit — new players will trigger fresh generation.
 */
export async function invalidateSpokeAdventuresForCampaign(
  campaignRef: string,
): Promise<number> {
  const result = await db.adventure.updateMany({
    where: { adventureType: 'CYOA_SPOKE', campaignRef, status: 'ACTIVE' },
    data: { status: 'ARCHIVED' },
  })
  return result.count
}
