/**
 * Server-side gmFace inference — hub-and-spoke campaign routing.
 *
 * This module is a SERVER-ONLY utility. It is intentionally NOT marked
 * 'use server' — that directive creates a Next.js action boundary that
 * allows client components to call the function via RPC. Keeping this
 * module as a plain server-only import prevents any accidental client
 * exposure of gmFace values.
 *
 * PRIVACY CONTRACT
 * ─────────────────────────────────────────────────────────────────────────
 *   • inferGmFaceFromPlaybook() returns an IntakeRoutingResult which
 *     contains the resolved gmFace and moveType values.
 *   • This result MUST NOT be passed to the client or included in any
 *     server action's return value that is consumed by a client component.
 *   • The only valid caller is completeIntakeSession() — a server action
 *     that writes gmFace + moveType to SpokeSession inside a transaction.
 *   • faceScores and moveScores in the result are for audit/debug only —
 *     they are not persisted and not sent to the client.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * See: src/lib/cyoa-intake/types.ts      — IntakeTemplate + IntakeRoutingResult schema
 * See: src/lib/cyoa-intake/resolveRouting.ts — core SD weight accumulation algorithm
 * See: src/actions/cyoa-intake.ts        — IntakeChoiceLogEntry + IntakeProgressPayload
 */

import { db } from '@/lib/db'
import { resolveIntakeRouting, type ChoiceLogEntry } from './resolveRouting'
import type { IntakeTemplate, IntakeRoutingResult, GmFaceKey } from './types'
import type { IntakeMoveType } from './types'
import { INTAKE_MOVE_TYPES, SD_LADDER } from './types'

// ---------------------------------------------------------------------------
// IntakeProgressPayload shape — mirrors cyoa-intake.ts without cross-import
// ---------------------------------------------------------------------------

/**
 * Minimal shape of the JSON stored in PlayerPlaybook.playerAnswers for
 * intake sessions. Mirrors IntakeProgressPayload from cyoa-intake.ts.
 * Defined here to avoid a circular import between this module and the
 * server action file.
 */
interface StoredIntakeProgress {
  choiceLog?: Array<{
    nodeId: string
    targetId: string
    choiceKey?: string
    moveType?: string
  }>
  resolvedMoveType?: string
}

// ---------------------------------------------------------------------------
// Template parsing
// ---------------------------------------------------------------------------

/**
 * Parse an Adventure's playbookTemplate JSON string as an IntakeTemplate.
 * Returns null if the field is absent, not a string, or fails JSON.parse.
 * Does NOT validate the internal structure — assumes GM-authored templates
 * are well-formed.
 */
function parseIntakeTemplate(raw: unknown): IntakeTemplate | null {
  if (!raw) return null
  let str: string
  if (typeof raw === 'string') {
    str = raw
  } else if (typeof raw === 'object') {
    // Stored as JSON object directly (some Prisma Json fields)
    try {
      str = JSON.stringify(raw)
    } catch {
      return null
    }
  } else {
    return null
  }
  try {
    const parsed = JSON.parse(str) as IntakeTemplate
    if (parsed.version !== 1 || !parsed.startNodeId || !Array.isArray(parsed.passages)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Choice log extraction
// ---------------------------------------------------------------------------

/**
 * Extract the choiceLog from a serialized IntakeProgressPayload string.
 * Returns an empty array on parse failure or absent field.
 *
 * Entries are mapped to ChoiceLogEntry (the minimal shape required by
 * resolveIntakeRouting) — moveType and choiceText are discarded here
 * because routing uses sdWeights from the template, not the log tags.
 */
function extractChoiceLog(playerAnswers: string | null): ChoiceLogEntry[] {
  if (!playerAnswers) return []
  try {
    const parsed = JSON.parse(playerAnswers) as StoredIntakeProgress
    if (!Array.isArray(parsed.choiceLog)) return []
    return parsed.choiceLog
      .filter((e) => typeof e.nodeId === 'string' && typeof e.targetId === 'string')
      .map((e) => ({
        nodeId: e.nodeId,
        targetId: e.targetId,
        ...(e.choiceKey ? { choiceKey: e.choiceKey } : {}),
      }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Fallback: tag-based moveType from choiceLog entries
// ---------------------------------------------------------------------------

/**
 * Extract a resolvedMoveType that was explicitly stored in the progress payload.
 * This is the simple "last tagged choice" fallback computed client-side as
 * the player navigated — used when no moveWeights were authored in the template.
 *
 * Returns null if the field is absent or not a valid IntakeMoveType.
 */
function extractStoredMoveType(playerAnswers: string | null): IntakeMoveType | null {
  if (!playerAnswers) return null
  try {
    const parsed = JSON.parse(playerAnswers) as StoredIntakeProgress
    if (
      typeof parsed.resolvedMoveType === 'string' &&
      (INTAKE_MOVE_TYPES as readonly string[]).includes(parsed.resolvedMoveType)
    ) {
      return parsed.resolvedMoveType as IntakeMoveType
    }
  } catch {
    // malformed — return null
  }
  return null
}

// ---------------------------------------------------------------------------
// Core inference function
// ---------------------------------------------------------------------------

/**
 * Infer the gmFace and moveType for a completed intake PlayerPlaybook.
 *
 * Steps:
 *   1. Fetch the PlayerPlaybook (verifies the record exists)
 *   2. Fetch the parent Adventure and parse playbookTemplate as IntakeTemplate
 *   3. Extract the player's choiceLog from playerAnswers
 *   4. Call resolveIntakeRouting(choiceLog, template) to accumulate sdWeights
 *      and compute gmFace + moveType via argmax
 *   5. If resolveIntakeRouting returns moveType='growUp' (the zero-weight default)
 *      AND the progress payload carries a tag-based resolvedMoveType, substitute
 *      the stored value — honouring the GM's explicit moveType tags on choices.
 *   6. Return the full IntakeRoutingResult (server-only — never sent to client)
 *
 * Returns null when:
 *   - The playbook does not exist
 *   - The parent adventure has no valid playbookTemplate
 *   - The choiceLog is empty (player navigated without logging choices)
 *
 * @param playbookId   ID of the completed intake PlayerPlaybook
 */
export async function inferGmFaceFromPlaybook(
  playbookId: string,
): Promise<IntakeRoutingResult | null> {
  // Fetch the playbook — no player auth here; caller (completeIntakeSession)
  // is responsible for verifying ownership before invoking this function.
  const playbook = await db.playerPlaybook.findUnique({
    where: { id: playbookId },
    select: {
      id: true,
      adventureId: true,
      playerAnswers: true,
    },
  })
  if (!playbook || !playbook.adventureId) return null

  // Fetch the Adventure template
  const adventure = await db.adventure.findUnique({
    where: { id: playbook.adventureId },
    select: { playbookTemplate: true },
  })
  if (!adventure) return null

  // Parse the IntakeTemplate from Adventure.playbookTemplate
  const template = parseIntakeTemplate(adventure.playbookTemplate)
  if (!template) return null

  // Extract the player's choice log
  const choiceLog = extractChoiceLog(playbook.playerAnswers)
  if (choiceLog.length === 0) return null

  // Run the SD weight accumulation algorithm
  const result = resolveIntakeRouting(choiceLog, template)

  // Substitute moveType from stored tag-based fallback when the algorithm
  // returned the zero-weight default ('growUp') and the player's navigation
  // path carried explicit moveType tags on choices.
  if (result.moveType === 'growUp') {
    const storedMoveType = extractStoredMoveType(playbook.playerAnswers)
    if (storedMoveType && storedMoveType !== 'growUp') {
      return { ...result, moveType: storedMoveType }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// SD ladder reroute helper — used by completeIntakeSession
// ---------------------------------------------------------------------------

/**
 * Find the nearest valid (gmFace, moveType) combination for a given campaign,
 * ascending the SD ladder when the exact branch is unavailable.
 *
 * Reroute algorithm (preserves moveType, ascends SD ladder):
 *   1. Check if (gmFace, moveType, campaignRef) has an Adventure → use it
 *   2. If not found, try (nextFaceUp, moveType, campaignRef)
 *   3. Continue ascending until a match is found or the top of the ladder
 *   4. If no match found anywhere on the ladder, return null
 *      (caller should route to campaign creation)
 *
 * PRIVACY: This function returns only the cache key tuple — it does NOT
 * expose the face label to the client. The resolved gmFace is only ever
 * written to SpokeSession.gmFace inside a server transaction.
 *
 * @param gmFace     Starting gmFace inferred from intake
 * @param moveType   Resolved moveType (preserved across reroutes)
 * @param campaignRef Campaign scope for Adventure cache lookup
 */
export async function resolveSpokeCacheKey(
  gmFace: GmFaceKey,
  moveType: IntakeMoveType,
  campaignRef: string,
): Promise<{ gmFace: GmFaceKey; moveType: IntakeMoveType; adventureId: string } | null> {
  // Build the SD ladder starting from the inferred face
  const startIdx = SD_LADDER.indexOf(gmFace)
  if (startIdx === -1) return null

  // Fetch all active CYOA_SPOKE Adventures for this campaign in one query,
  // then filter in JS against (gmFace, moveType) metadata from playbookTemplate.
  // This avoids N individual DB hits while keeping the filtering logic in code
  // (JSON path queries are not reliably supported across all Prisma backends).
  const spokeCandidates = await db.adventure.findMany({
    where: {
      adventureType: 'CYOA_SPOKE',
      campaignRef,
      status: 'ACTIVE',
    },
    select: { id: true, playbookTemplate: true },
  })

  // Build a lookup map: (gmFace, moveType) → adventureId
  const spokeMap = new Map<string, string>()
  for (const candidate of spokeCandidates) {
    const meta = parseSpokeTemplateMeta(candidate.playbookTemplate)
    if (meta?.gmFace && meta?.moveType) {
      const key = `${meta.gmFace}::${meta.moveType}`
      // First-match wins (one cached Adventure per combination per campaign)
      if (!spokeMap.has(key)) {
        spokeMap.set(key, candidate.id)
      }
    }
  }

  // Try each face from the inferred level upward — preserve moveType
  for (let i = startIdx; i < SD_LADDER.length; i++) {
    const candidateFace = SD_LADDER[i]
    const key = `${candidateFace}::${moveType}`
    const adventureId = spokeMap.get(key)
    if (adventureId) {
      return { gmFace: candidateFace, moveType, adventureId }
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Internal: spoke template metadata parser
// ---------------------------------------------------------------------------

interface SpokeTemplateMeta {
  gmFace?: string
  moveType?: string
}

function parseSpokeTemplateMeta(raw: unknown): SpokeTemplateMeta | null {
  if (!raw) return null
  try {
    let obj: Record<string, unknown>
    if (typeof raw === 'string') {
      obj = JSON.parse(raw) as Record<string, unknown>
    } else if (typeof raw === 'object' && raw !== null) {
      obj = raw as Record<string, unknown>
    } else {
      return null
    }
    return {
      gmFace: typeof obj.gmFace === 'string' ? obj.gmFace : undefined,
      moveType: typeof obj.moveType === 'string' ? obj.moveType : undefined,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Re-export types for callers of this module
// ---------------------------------------------------------------------------

export type { IntakeRoutingResult, GmFaceKey, IntakeMoveType }
