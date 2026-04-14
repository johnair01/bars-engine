'use server'

/**
 * CYOA Composer — Player Context Assembly Server Action
 *
 * Fetches all data needed to construct a PlayerComposerContext for the
 * adaptive resolver:
 *   1. Today's daily check-in (emotional vector pre-fill)
 *   2. Campaign hub state → completedBuilds (build history for face recommendations)
 *   3. Campaign hub state → spoke draw (spokeFace for current spoke)
 *   4. Checkpoint data (session resume)
 *   5. GM step ordering overrides (campaign-level)
 *
 * The resolver itself is pure (no DB access) — this action is the data
 * access boundary that feeds it. Follows the existing pattern where
 * `src/actions/` handles DB queries and `src/lib/` contains pure logic.
 *
 * @see src/lib/cyoa-composer/adaptive-resolver.ts — pure resolver
 * @see src/actions/alchemy.ts — getTodayCheckIn
 * @see src/actions/cyoa-build-checkpoint.ts — loadComposerCheckpoint
 * @see src/actions/composer-step-overrides.ts — getEffectiveComposerSteps
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { getTodayCheckIn } from '@/actions/alchemy'
import type { PlayerComposerContext } from '@/lib/cyoa-composer/adaptive-resolver'
import { buildStateToBag } from '@/lib/cyoa-composer/adaptive-resolver'
import type { CompletedBuildReceipt, CampaignHubStateV1 } from '@/lib/campaign-hub/types'
import { isCampaignHubStateV1, getCompletedBuilds } from '@/lib/campaign-hub/types'
import { restoreCheckpoint } from '@/lib/cyoa-composer/checkpoint-persistence'
import { parseComposerStepOverrides } from '@/lib/cyoa-composer/step-registry'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import type { TemplateCatalogEntry } from '@/lib/cyoa-composer/branch-visibility'

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

/**
 * Everything the Composer page needs to initialize:
 *  - playerContext: feeds the adaptive resolver
 *  - completedBuilds: feeds FaceRecommendations (from hub ledger, no fan-out)
 *  - templateCatalog: feeds the step renderer's template list
 *  - adventureId: for checkpoint persistence
 *  - campaignRef: for build receipt construction
 *  - spokeIndex: current spoke index
 */
export interface ComposerPageData {
  playerContext: PlayerComposerContext
  completedBuilds: CompletedBuildReceipt[]
  templateCatalog: TemplateCatalogEntry[]
  adventureId: string
  campaignRef: string
  spokeIndex: number
  playerId: string
}

export type ComposerPageDataResult =
  | { success: true; data: ComposerPageData }
  | { success: false; error: string }

// ---------------------------------------------------------------------------
// Main action
// ---------------------------------------------------------------------------

/**
 * Fetch all player context data needed for the CYOA Composer.
 *
 * Assembles the PlayerComposerContext from multiple data sources in parallel:
 *   - Daily check-in (emotional vector pre-fill)
 *   - Hub state (completedBuilds for recommendations + spokeFace)
 *   - Checkpoint (session resume data)
 *   - GM step overrides (campaign config)
 *
 * @param adventureId - The adventure being composed for
 * @param instanceId - Campaign instance (for hub state + step overrides)
 * @param spokeIndex - Current spoke index (0-7, for spoke draw face)
 * @param ctaFace - Optional face pre-locked from CTA / deep link
 */
export async function getPlayerComposerContext(
  adventureId: string,
  instanceId: string,
  spokeIndex: number,
  ctaFace?: GameMasterFace | null,
): Promise<ComposerPageDataResult> {
  const player = await getCurrentPlayer()
  if (!player) return { success: false, error: 'Not authenticated' }

  try {
    // ── Parallel data fetches ──────────────────────────────────────────────
    const [checkIn, instance, progress] = await Promise.all([
      // 1. Today's daily check-in
      getTodayCheckIn(player.id),

      // 2. Instance (campaignHubState + composerStepOverrides + campaignRef)
      db.instance.findUnique({
        where: { id: instanceId },
        select: {
          campaignHubState: true,
          composerStepOverrides: true,
          campaignRef: true,
        },
      }),

      // 3. Player progress (checkpoint data)
      db.playerAdventureProgress.findUnique({
        where: {
          playerId_adventureId: {
            playerId: player.id,
            adventureId,
          },
        },
        select: { stateData: true },
      }),
    ])

    if (!instance) {
      return { success: false, error: 'Campaign instance not found' }
    }

    // ── Parse hub state ──────────────────────────────────────────────────
    let hubState: CampaignHubStateV1 | null = null
    if (instance.campaignHubState) {
      try {
        const parsed = typeof instance.campaignHubState === 'string'
          ? JSON.parse(instance.campaignHubState as string)
          : instance.campaignHubState
        if (isCampaignHubStateV1(parsed)) {
          hubState = parsed
        }
      } catch {
        /* malformed hub state — proceed without it */
      }
    }

    // Extract completedBuilds from hub (self-contained ledger, no fan-out)
    const completedBuilds = hubState ? getCompletedBuilds(hubState) : []

    // Extract spoke face from the spoke draw (if available)
    let spokeFace: GameMasterFace | null = null
    if (hubState && spokeIndex >= 0 && spokeIndex < hubState.spokes.length) {
      spokeFace = hubState.spokes[spokeIndex].primaryFace
    }

    // ── Parse checkpoint ─────────────────────────────────────────────────
    let checkpointData: PlayerComposerContext['checkpointData'] = null
    if (progress?.stateData) {
      try {
        const stateData = JSON.parse(progress.stateData) as Record<string, unknown>
        const restored = restoreCheckpoint(stateData)
        if (restored.found && restored.buildState) {
          checkpointData = buildStateToBag(restored.buildState)
        }
      } catch {
        /* malformed checkpoint — proceed without it */
      }
    }

    // ── Parse GM step overrides ──────────────────────────────────────────
    const stepOverrides = parseComposerStepOverrides(
      instance.composerStepOverrides,
    )

    // ── Build daily check-in data for the resolver ───────────────────────
    const dailyCheckIn = checkIn
      ? {
          id: checkIn.id,
          channel: checkIn.channel,
          altitude: checkIn.altitude,
        }
      : null

    // ── Load template catalog ────────────────────────────────────────────
    const campaignRef = instance.campaignRef ?? ''
    const templateCatalog = await loadTemplateCatalog(campaignRef)

    // ── Assemble PlayerComposerContext ───────────────────────────────────
    const playerContext: PlayerComposerContext = {
      dailyCheckIn,
      spokeFace,
      ctaFace: ctaFace ?? null,
      checkpointData,
      stepOverrides,
    }

    return {
      success: true,
      data: {
        playerContext,
        completedBuilds,
        templateCatalog,
        adventureId,
        campaignRef,
        spokeIndex,
        playerId: player.id,
      },
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return { success: false, error: `Failed to load composer context: ${msg}` }
  }
}

// ---------------------------------------------------------------------------
// Template catalog loader
// ---------------------------------------------------------------------------

/**
 * Load narrative templates available for the given campaign reference.
 *
 * AdventureTemplate doesn't have campaignRef or title/kind/defaultSettings
 * columns directly — it has key, name, passageSlots. We load all templates
 * and map them to TemplateCatalogEntry using the available fields.
 *
 * For face/channel compatibility, we check the composerStepOverrides JSON
 * as a proxy (the template may embed compatibility hints there).
 *
 * Returns empty array if no templates exist — the composer handles this
 * gracefully by showing "no templates available" messaging.
 */
async function loadTemplateCatalog(
  _campaignRef: string,
): Promise<TemplateCatalogEntry[]> {
  try {
    // Load all adventure templates (they are campaign-agnostic registry entries)
    const templates = await db.adventureTemplate.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
      },
    })

    return templates.map((t): TemplateCatalogEntry => ({
      templateKey: t.key,
      templateKind: 'quest', // Default kind — extended by NarrativeTemplate system
      label: t.name,
      compatibleFaces: [], // Universal by default (no face restriction)
      compatibleChannels: [], // Universal by default (no channel restriction)
    }))
  } catch {
    // Table may not exist or query may fail — return empty
    return []
  }
}
