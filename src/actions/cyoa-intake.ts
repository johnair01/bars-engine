'use server'

/**
 * CYOA Intake server actions.
 *
 * SD routing metadata schema: src/lib/cyoa-intake/types.ts  (IntakeTemplate)
 * SD routing algorithm:       src/lib/cyoa-intake/resolveRouting.ts
 * gmFace inference layer:     src/lib/cyoa-intake/inferGmFace.ts
 * Example seed template:      src/lib/cyoa-intake/seed.ts
 *
 * The IntakeTemplate (stored in Adventure.playbookTemplate) carries hidden
 * sdWeights per choice option — used by resolveIntakeRouting() to infer
 * gmFace + moveType without exposing face labels anywhere in the player UI.
 *
 * completeIntakeSession() is the ONLY action that writes gmFace + moveType
 * to the DB. It does NOT return gmFace to the caller — it returns only the
 * opaque spokeSessionId and optional spokeAdventureId for routing.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { checkGM } from '@/actions/admin'
import { getTodayCheckIn } from '@/actions/alchemy'
import { resolveIntakeRouting } from '@/lib/cyoa-intake/resolveRouting'
import type { GmFaceKey, IntakeTemplate } from '@/lib/cyoa-intake/types'
import {
  INTAKE_MOVE_TYPES,
  resolveIntakeMoveType,
  type CompleteIntakeSessionInput,
  type CompleteIntakeSessionResult,
  type IntakeAdventureData,
  type IntakeCheckInAnswers,
  type IntakeCheckInData,
  type IntakeChoice,
  type IntakeChoiceLogEntry,
  type IntakePageData,
  type IntakePassage,
  type IntakePlaybookData,
  type IntakeProgressPayload,
  type IntakeMoveType,
} from '@/lib/cyoa-intake/intakeSurface'
import {
  findOrGenerateSpokeAdventure,
  invalidateSpokeAdventuresForCampaign,
} from '@/lib/cyoa-intake/spoke-generator'

// ---------------------------------------------------------------------------
// getIntakeAdventure
// ---------------------------------------------------------------------------

/**
 * Fetch a CYOA_INTAKE adventure by id.
 * Returns null if not found or not ACTIVE with type CYOA_INTAKE.
 */
export async function getIntakeAdventure(id: string): Promise<IntakeAdventureData | null> {
  const adventure = await db.adventure.findFirst({
    where: { id, adventureType: 'CYOA_INTAKE', status: 'ACTIVE' },
    include: { passages: { orderBy: { createdAt: 'asc' } } },
  })
  if (!adventure) return null

  return {
    id: adventure.id,
    title: adventure.title,
    description: adventure.description,
    startNodeId: adventure.startNodeId,
    passages: adventure.passages.map((p) => {
      // Parse choices JSON — choice objects may carry hidden moveType tags
      let choices: IntakeChoice[] = []
      try {
        choices = JSON.parse(p.choices) as IntakeChoice[]
      } catch {
        choices = []
      }

      // Extract moveType from passage metadata (for terminal node routing)
      let passageMoveType: IntakeMoveType | undefined
      if (p.metadata && typeof p.metadata === 'object' && !Array.isArray(p.metadata)) {
        const meta = p.metadata as Record<string, unknown>
        const mt = meta['moveType']
        if (typeof mt === 'string' && (INTAKE_MOVE_TYPES as readonly string[]).includes(mt)) {
          passageMoveType = mt as IntakeMoveType
        }
      }

      return {
        nodeId: p.nodeId,
        text: p.text,
        choices,
        ...(passageMoveType ? { moveType: passageMoveType } : {}),
      }
    }),
    campaignRef: adventure.campaignRef,
  }
}

// ---------------------------------------------------------------------------
// getOrCreateIntakePlaybook
// ---------------------------------------------------------------------------

/**
 * Resume an in-progress intake PlayerPlaybook for this player+adventure,
 * or create a new one if none exists.
 */
export async function getOrCreateIntakePlaybook(
  adventureId: string,
): Promise<IntakePlaybookData> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')

  // Look for an existing in-progress intake playbook
  const existing = await db.playerPlaybook.findFirst({
    where: {
      playerId: player.id,
      adventureId,
      playbookRole: 'intake',
      completedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  })
  if (existing) return existing

  // Create a fresh intake playbook
  return db.playerPlaybook.create({
    data: {
      playerId: player.id,
      adventureId,
      playbookName: 'Intake',
      playbookRole: 'intake',
    },
  })
}

// ---------------------------------------------------------------------------
// saveIntakeProgress
// ---------------------------------------------------------------------------

/**
 * Persist current passage position + choice history to the PlayerPlaybook.
 */
export async function saveIntakeProgress(
  playbookId: string,
  payload: IntakeProgressPayload,
): Promise<void> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')

  await db.playerPlaybook.update({
    where: { id: playbookId, playerId: player.id },
    data: {
      playerAnswers: JSON.stringify(payload),
    },
  })
}

// ---------------------------------------------------------------------------
// getIntakePageData — server-side aggregation for the page component
// ---------------------------------------------------------------------------

/**
 * Aggregate all data the page needs in a single call.
 * Throws if the adventure is not found or the player is not authenticated.
 *
 * @param adventureId      CYOA_INTAKE Adventure id
 * @param requestedPortalId  Optional CampaignPortal.id from the URL search param.
 *                           When present, validated against the DB.
 *                           When absent, auto-resolved from adventure.campaignRef.
 */
export async function getIntakePageData(
  adventureId: string,
  requestedPortalId?: string,
): Promise<IntakePageData> {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Not authenticated')

  const [adventure, checkIn] = await Promise.all([
    getIntakeAdventure(adventureId),
    getTodayCheckIn(player.id),
  ])

  if (!adventure) throw new Error('Adventure not found or not available')

  const playbook = await getOrCreateIntakePlaybook(adventureId)

  // Resolve portalId for completeIntakeSession —
  //   1. Prefer the explicitly supplied portalId (from URL ?portalId=...)
  //   2. Auto-resolve from adventure.campaignRef (most recently created portal)
  //   3. Return null if no portal exists yet for this campaign
  let portalId: string | null = null
  if (requestedPortalId) {
    const portal = await db.campaignPortal.findUnique({
      where: { id: requestedPortalId },
      select: { id: true },
    })
    portalId = portal?.id ?? null
  } else if (adventure.campaignRef) {
    const portal = await db.campaignPortal.findFirst({
      where: { campaignRef: adventure.campaignRef },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    })
    portalId = portal?.id ?? null
  }

  return {
    adventure,
    playbook,
    todayCheckIn: checkIn
      ? {
          id: checkIn.id,
          channel: checkIn.channel,
          altitude: checkIn.altitude,
          stucknessRating: checkIn.stucknessRating,
          sceneTypeChosen: checkIn.sceneTypeChosen,
        }
      : null,
    playerId: player.id,
    portalId,
  }
}

// ---------------------------------------------------------------------------
// completeIntakeSession — atomic intake submission
// ---------------------------------------------------------------------------

/** Today's date as YYYY-MM-DD (UTC) — local to this module. */
function intakeTodayString(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Complete an intake CYOA session atomically.
 *
 * This is a NEW server action separate from completeSpokeSession.
 * It does NOT emit any BARs, does NOT increment portal completionCount,
 * and does NOT trigger any portal side-effects.
 *
 * What it does (all in a single Prisma interactive transaction):
 *   1. Resolve gmFace + moveType from the player's choice log via the
 *      IntakeTemplate's hidden sdWeights (resolveIntakeRouting).
 *      Falls back to tag-based moveType resolution if template absent.
 *   2. Upsert today's AlchemyCheckIn (idempotent — re-uses existing if
 *      the player already checked in today via DailyCheckInQuest).
 *   3. Create a new SpokeSession (status=in_progress) with gmFace,
 *      moveType, and intakeCheckInId populated.
 *   4. Update the intake PlayerPlaybook: spokeSessionId + completedAt,
 *      and persist the resolved routing into playerAnswers.
 *
 * Returns the linked IDs to the client. gmFace and moveType are NOT
 * included in the return value — they are resolved server-side by the
 * spoke Adventure launcher when the player reaches the spoke runner.
 *
 * NOTE: PlayerPlaybook.spokeSessionId has no Prisma relation (intentional
 * loose coupling per schema design). Callers querying "all playbooks in
 * this spoke session" must use WHERE clauses, not Prisma include/select.
 */
export async function completeIntakeSession(
  input: CompleteIntakeSessionInput,
): Promise<CompleteIntakeSessionResult> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const {
    portalId,
    playbookId,
    adventureId,
    choiceLog,
    passages,
    terminalNodeId,
    checkIn,
  } = input

  // ── Step 1: validate portal + load adventure template ──────────────────────

  const [portal, adventure] = await Promise.all([
    db.campaignPortal.findUnique({
      where: { id: portalId },
      select: { campaignRef: true },
    }),
    db.adventure.findFirst({
      where: { id: adventureId, adventureType: 'CYOA_INTAKE' },
      select: { playbookTemplate: true, campaignRef: true },
    }),
  ])

  if (!portal) return { error: 'Portal not found' }
  if (!adventure) return { error: 'Adventure not found or not a CYOA_INTAKE type' }

  // Verify the playbook belongs to this player
  const playbook = await db.playerPlaybook.findFirst({
    where: { id: playbookId, playerId: player.id, playbookRole: 'intake' },
    select: { id: true, completedAt: true },
  })
  if (!playbook) return { error: 'Intake playbook not found or does not belong to player' }
  if (playbook.completedAt) return { error: 'Intake already completed' }

  // ── Step 2: resolve gmFace + moveType ──────────────────────────────────────

  // Primary resolution: weighted SD scoring via IntakeTemplate
  let gmFace: GmFaceKey = 'sage' // safe default — broadest container
  let moveType: IntakeMoveType = 'growUp' // safe default — most generative

  if (adventure.playbookTemplate) {
    try {
      const template = JSON.parse(adventure.playbookTemplate) as IntakeTemplate
      const routing = resolveIntakeRouting(choiceLog, template)
      gmFace = routing.gmFace
      moveType = routing.moveType
    } catch {
      // Template malformed — fall through to tag-based fallback below
    }
  }

  // Tag-based fallback: override moveType only if a tagged choice/terminal is found
  // (preserves gmFace from SD scoring when template was valid)
  const tagMoveType = resolveIntakeMoveType(choiceLog, passages, terminalNodeId)
  if (tagMoveType && !adventure.playbookTemplate) {
    // Only use tag fallback when template-based scoring was not available
    moveType = tagMoveType
  }

  // ── Step 3: atomic transaction ─────────────────────────────────────────────
  //
  // All four writes happen in a single interactive Prisma transaction:
  //   a) upsert AlchemyCheckIn (idempotent)
  //   b) create SpokeSession with gmFace + moveType + intakeCheckInId
  //   c) update PlayerPlaybook with spokeSessionId + completedAt + routing in playerAnswers
  //   d) upsert AlchemyPlayerState to keep alchemy state consistent with check-in

  const today = intakeTodayString()

  try {
    const { spokeSessionId, checkInId } = await db.$transaction(async (tx) => {
      // a) Upsert AlchemyCheckIn — idempotent; existing record is kept as-is
      const checkInRecord = await tx.alchemyCheckIn.upsert({
        where: { playerId_date: { playerId: player.id, date: today } },
        create: {
          playerId: player.id,
          date: today,
          stucknessRating: checkIn.stucknessRating,
          channel: checkIn.channel,
          altitude: checkIn.altitude,
        },
        update: {
          // Do not overwrite an existing check-in's core answers —
          // the player may have already checked in via DailyCheckInQuest.
          // Only update if fields are null (first-time intake path).
        },
        select: { id: true },
      })

      // b) Create SpokeSession (in_progress; no BARs emitted here)
      const spokeSession = await tx.spokeSession.create({
        data: {
          portalId,
          playerId: player.id,
          campaignRef: adventure.campaignRef ?? portal.campaignRef,
          gmFace,
          moveType,
          intakeCheckInId: checkInRecord.id,
          status: 'in_progress',
          barSeedIds: '[]',
        },
        select: { id: true },
      })

      // c) Update PlayerPlaybook: mark complete, link spoke session, persist routing
      await tx.playerPlaybook.update({
        where: { id: playbookId },
        data: {
          spokeSessionId: spokeSession.id,
          completedAt: new Date(),
          playerAnswers: JSON.stringify({
            choiceLog,
            resolvedMoveType: moveType,
            // gmFace is intentionally NOT stored in playerAnswers — it is
            // persisted on SpokeSession only. This prevents accidental leakage
            // of face metadata into client-readable playbook records.
          } satisfies Pick<IntakeProgressPayload, 'choiceLog' | 'resolvedMoveType'>),
        },
      })

      // d) Keep AlchemyPlayerState consistent with the check-in answers
      await tx.alchemyPlayerState.upsert({
        where: { playerId: player.id },
        create: {
          playerId: player.id,
          channel: checkIn.channel,
          altitude: checkIn.altitude,
        },
        update: {
          channel: checkIn.channel,
          altitude: checkIn.altitude,
        },
      })

      return { spokeSessionId: spokeSession.id, checkInId: checkInRecord.id }
    })

    return { success: true, playbookId, spokeSessionId, checkInId }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `completeIntakeSession failed: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// launchSpokeAdventure
// ---------------------------------------------------------------------------

/**
 * After completeIntakeSession succeeds, call this to find or generate the
 * spoke Adventure for the player's resolved (gmFace, moveType, campaignRef).
 *
 * Returns the URL to the spoke Adventure player (`/adventure/[slug]/play`)
 * so the client can redirect immediately.
 *
 * Spoke generation happens at first hit — subsequent players for the same
 * (gmFace, moveType, campaignRef) receive the cached Adventure instantly.
 */
export async function launchSpokeAdventure(
  spokeSessionId: string,
): Promise<{ url: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const session = await db.spokeSession.findFirst({
    where: { id: spokeSessionId, playerId: player.id },
    select: { gmFace: true, moveType: true, campaignRef: true, portalId: true },
  })
  if (!session) return { error: 'Session not found' }

  const { gmFace, moveType, campaignRef } = session
  if (!gmFace || !moveType || !campaignRef) {
    return { error: 'Session routing incomplete — intake may still be processing' }
  }

  const result = await findOrGenerateSpokeAdventure(
    gmFace as GmFaceKey,
    moveType as IntakeMoveType,
    campaignRef,
  )
  if (!result) return { error: 'No spoke Adventure available for this campaign yet' }

  // Fetch the adventure slug for URL construction
  const adventure = await db.adventure.findUnique({
    where: { id: result.adventureId },
    select: { slug: true },
  })
  if (!adventure) return { error: 'Spoke Adventure not found' }

  return { url: `/adventure/${adventure.slug}/play` }
}

// ---------------------------------------------------------------------------
// saveIntakeTemplate (GM action — with cache invalidation)
// ---------------------------------------------------------------------------

/**
 * Save the master IntakeTemplate JSON onto a CYOA_INTAKE Adventure.
 * Automatically invalidates (archives) all cached CYOA_SPOKE Adventures
 * for the same campaignRef so the next player triggers fresh generation.
 *
 * Auth: requires admin or GM role.
 */
export async function saveIntakeTemplate(
  adventureId: string,
  templateJson: string,
): Promise<{ success: true; invalidated: number } | { error: string }> {
  try { await checkGM() } catch { return { error: 'Unauthorized' } }

  const adventure = await db.adventure.findFirst({
    where: { id: adventureId, adventureType: 'CYOA_INTAKE' },
    select: { campaignRef: true },
  })
  if (!adventure) return { error: 'CYOA_INTAKE adventure not found' }

  // Validate JSON is parseable before saving
  try { JSON.parse(templateJson) } catch { return { error: 'Invalid JSON in template' } }

  await db.adventure.update({
    where: { id: adventureId },
    data: { playbookTemplate: templateJson },
  })

  // Invalidate spoke cache for this campaign
  const invalidated = adventure.campaignRef
    ? await invalidateSpokeAdventuresForCampaign(adventure.campaignRef)
    : 0

  return { success: true, invalidated }
}

// ---------------------------------------------------------------------------
// createNpcEncounter
// ---------------------------------------------------------------------------

/**
 * Create an NpcEncounter record when a player enters an NPC side quest.
 * Stores departurePassageId so the player can return to their spoke adventure.
 */
export async function createNpcEncounter(input: {
  spokeSessionId: string
  npcId: string
  departurePassageId: string
}): Promise<{ encounterId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  // Verify the spoke session belongs to this player
  const session = await db.spokeSession.findFirst({
    where: { id: input.spokeSessionId, playerId: player.id },
    select: { id: true },
  })
  if (!session) return { error: 'Spoke session not found' }

  // Verify the NPC exists
  const npc = await db.npcConstitution.findUnique({
    where: { id: input.npcId },
    select: { id: true },
  })
  if (!npc) return { error: 'NPC not found' }

  const encounter = await db.npcEncounter.create({
    data: {
      spokeSessionId: input.spokeSessionId,
      npcId: input.npcId,
      departurePassageId: input.departurePassageId,
    },
    select: { id: true },
  })

  return { encounterId: encounter.id }
}

// ---------------------------------------------------------------------------
// completeNpcEncounter + getReturnPassageId
// ---------------------------------------------------------------------------

/**
 * Mark an NPC encounter complete and return the departurePassageId
 * so the player can resume their spoke adventure where they left off.
 */
export async function completeNpcEncounter(
  encounterId: string,
): Promise<{ departurePassageId: string; spokeSessionId: string } | { error: string }> {
  const player = await getCurrentPlayer()
  if (!player) return { error: 'Not authenticated' }

  const encounter = await db.npcEncounter.findFirst({
    where: { id: encounterId },
    include: { spokeSession: { select: { playerId: true, id: true } } },
  })
  if (!encounter) return { error: 'Encounter not found' }
  if (encounter.spokeSession.playerId !== player.id) return { error: 'Unauthorized' }

  await db.npcEncounter.update({
    where: { id: encounterId },
    data: { completedAt: new Date() },
  })

  return {
    departurePassageId: encounter.departurePassageId,
    spokeSessionId: encounter.spokeSession.id,
  }
}
