'use server'

/**
 * NPC Move Selection — server actions for the spoke NPC encounter move picker.
 *
 * When a player talks to a face NPC in a spoke intro room, the NPC offers:
 *   1. **Face moves** (primary) — the 4 moves from this NPC's face lineage.
 *      These are PROMPTS the NPC asks the player; the player's response becomes
 *      a `player_response` BAR. This is the prototype prompt-deck pattern that
 *      converges with backlog 1.34 PDH and Issue #47 when those ship.
 *   2. **Nation flavor** (secondary) — the player's own nation moves, BUT only
 *      shown when the player's nation matches the NPC's nation (since each NPC
 *      represents both a face and a nation). This is "the NPC can teach you
 *      moves of their nation" when the alignment is there.
 *
 * The face moves are the main path. The nation flavor is optional alignment-bonus.
 */

import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
    getNationMoveSet,
    type WcgsStage,
} from '@/lib/nation/move-library-accessor'
import { getFaceMoveSet } from '@/lib/face-moves/face-move-library'
import type { GameMasterFace } from '@/lib/quest-grammar/types'

// ─── Key resolution helpers (mirrors nursery-ritual.ts) ─────────────────────

const ARCHETYPE_NAME_TO_KEY: Record<string, string> = {
    'heaven (qian)': 'bold_heart',
    'bold heart': 'bold_heart',
    'earth (kun)': 'devoted_guardian',
    'devoted guardian': 'devoted_guardian',
    'mountain (gen)': 'still_point',
    'still point': 'still_point',
    'fire (li)': 'truth_seer',
    'truth seer': 'truth_seer',
    'lake (dui)': 'joyful_connector',
    'joyful connector': 'joyful_connector',
    'water (kan)': 'danger_walker',
    'danger walker': 'danger_walker',
    'thunder (zhen)': 'decisive_storm',
    'decisive storm': 'decisive_storm',
    'wind (xun)': 'subtle_influence',
    'subtle influence': 'subtle_influence',
}

function resolveArchetypeKey(name: string | undefined | null): string | null {
    if (!name) return null
    return ARCHETYPE_NAME_TO_KEY[name.toLowerCase()] ?? null
}

const ELEMENT_TO_NATION_KEY: Record<string, string> = {
    metal: 'argyra',
    water: 'lamenth',
    wood: 'virelune',
    fire: 'pyrakanth',
    earth: 'meridia',
}

function wcgsToMoveType(stage: WcgsStage): string {
    const map: Record<WcgsStage, string> = {
        wake_up: 'wakeUp',
        clean_up: 'cleanUp',
        grow_up: 'growUp',
        show_up: 'showUp',
    }
    return map[stage]
}

// ─── Types ──────────────────────────────────────────────────────────────────

/** A face move card — primary offering at an NPC encounter. */
export type FaceMoveCard = {
    moveId: string                 // canonical_id from face-moves.json
    shortName: string              // e.g. "Cross the Forge"
    ritualName: string             // e.g. "Crossing the Forge Without Looking Away"
    wcgsStage: WcgsStage
    tagline: string                // the promise (Sola's test)
    description: string
    prompt: string                 // the question the NPC asks
    trialSlug: string | null       // optional CYOA trial path
    source: 'face'
}

/** A nation flavor move card — secondary offering, only when nation aligns. */
export type NationFlavorCard = {
    moveId: string
    moveName: string
    sourceKey: string              // the nation key
    wcgsStage: WcgsStage
    description: string
    purpose: string
    source: 'nation'
}

export type GetNpcMovesResult =
    | {
          success: true
          /** The face the player is talking to (e.g. 'challenger' for Ignis). */
          face: GameMasterFace
          /** Player's nation (resolved from element). */
          playerNationKey: string
          /** Player's archetype if set. */
          archetypeKey: string | null
          /** The 4 face moves from this NPC's lineage — always shown. */
          faceMoves: FaceMoveCard[]
          /** Whether the player's nation matches the NPC's nation. */
          nationAligns: boolean
          /** The NPC's nation (for display). */
          npcNationKey: string
          /** Player's nation moves — only populated when nationAligns is true. */
          nationFlavorMoves: NationFlavorCard[]
      }
    | { error: string }

// ─── NPC nation lookup ──────────────────────────────────────────────────────

/** Map face → NPC's nation key. (Mirrors named-guides.ts.) */
const FACE_TO_NPC_NATION: Record<GameMasterFace, string> = {
    challenger: 'pyrakanth',
    shaman: 'virelune',
    architect: 'argyra',
    regent: 'meridia',
    diplomat: 'lamenth',
    sage: 'all',
}

// ─── getNpcMovesForPlayer ───────────────────────────────────────────────────

/**
 * Resolve the moves an NPC offers a player, given the face the player is talking to.
 *
 * Returns:
 *   - The 4 face moves from the NPC's lineage (PRIMARY — always shown)
 *   - The player's nation moves IF the player's nation matches the NPC's nation
 *     (FLAVOR — alignment bonus). Empty array if no alignment.
 *
 * The Witness's nation is 'all', so it never matches a specific nation flavor.
 * Players talking to the Witness only see face moves.
 */
export async function getNpcMovesForPlayer(input: {
    face: GameMasterFace
}): Promise<GetNpcMovesResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const nationElement = player.nation?.element
    if (!nationElement) return { error: 'Profile incomplete: nation missing' }
    const playerNationKey = ELEMENT_TO_NATION_KEY[nationElement]
    if (!playerNationKey) return { error: `Unknown nation element: ${nationElement}` }

    const archetypeKey = resolveArchetypeKey(player.archetype?.name)

    // Primary: 4 face moves from this NPC's lineage
    const faceMoves: FaceMoveCard[] = getFaceMoveSet(input.face).map((m) => ({
        moveId: m.canonical_id,
        shortName: m.short_name,
        ritualName: m.ritual_name,
        wcgsStage: m.wcgs_stage,
        tagline: m.tagline,
        description: m.description,
        prompt: m.prompt,
        trialSlug: m.trial_slug,
        source: 'face' as const,
    }))

    // Secondary: nation flavor — only when player's nation matches NPC's nation
    const npcNationKey = FACE_TO_NPC_NATION[input.face]
    const nationAligns = npcNationKey === playerNationKey
    let nationFlavorMoves: NationFlavorCard[] = []
    if (nationAligns) {
        const nationMoves = getNationMoveSet(playerNationKey)
        nationFlavorMoves = nationMoves.map((m) => ({
            moveId: m.move_id,
            moveName: m.move_name,
            sourceKey: m.source_key,
            wcgsStage: m.wcgs_stage,
            description: m.description,
            purpose: m.purpose,
            source: 'nation' as const,
        }))
    }

    return {
        success: true,
        face: input.face,
        playerNationKey,
        archetypeKey,
        faceMoves,
        nationAligns,
        npcNationKey,
        nationFlavorMoves,
    }
}

// ─── selectMoveAtNpc ────────────────────────────────────────────────────────

export type SelectMoveAtNpcResult =
    | { success: true; barId: string; barTitle: string }
    | { error: string }

/**
 * Player has chosen a move while talking to an NPC in a spoke intro room.
 * Creates a CustomBar tagged with the campaign, spoke, and NPC face context.
 *
 * For **face moves** (source: 'face'), the BAR is a `player_response` type and
 * stores the prompt the NPC asked. This aligns with the prompt-deck convergence
 * (Issue #47, backlog 1.34 PDH) — the BAR is the player's response slot to a
 * face's prompt.
 *
 * For **nation flavor moves** (source: 'nation'), the BAR is a `vibe` type
 * tagged with the existing nation move metadata.
 */
export async function selectMoveAtNpc(input: {
    moveId: string
    moveName: string
    moveDescription: string
    wcgsStage: WcgsStage
    face: GameMasterFace
    source: 'face' | 'nation'
    /** For face moves: the prompt the NPC asked. Stored as the BAR description. */
    prompt?: string
    /** For face moves: the optional CYOA trial slug. */
    trialSlug?: string | null
    campaignRef: string | null
    spokeIndex: number | null
}): Promise<SelectMoveAtNpcResult> {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not authenticated' }

    const moveType = wcgsToMoveType(input.wcgsStage)
    const title = `${input.moveName} (with ${input.face})`

    // Face moves store the prompt as the description (it's what the player will respond to).
    // Nation moves store the move description.
    const description = input.source === 'face' && input.prompt ? input.prompt : input.moveDescription

    // Face moves are player_response BARs (prompt-deck convergence).
    // Nation moves keep the legacy 'vibe' type until the broader prompt deck system ships.
    const barType = input.source === 'face' ? 'player_response' : 'vibe'

    // Resolve allyship domain from instance (for downstream campaign metric tagging)
    let allyshipDomain: string | null = null
    if (input.campaignRef) {
        const instance = await db.instance.findFirst({
            where: { OR: [{ campaignRef: input.campaignRef }, { slug: input.campaignRef }] },
            select: { allyshipDomain: true, primaryCampaignDomain: true },
        })
        allyshipDomain = instance?.allyshipDomain ?? instance?.primaryCampaignDomain ?? null
    }

    try {
        const bar = await db.customBar.create({
            data: {
                creatorId: player.id,
                title,
                description,
                type: barType,
                reward: 1,
                visibility: 'private',
                status: 'active',
                claimedById: player.id,
                inputs: JSON.stringify([]),
                moveType,
                rootId: `npc_move_${input.moveId}`,
                campaignRef: input.campaignRef ?? null,
                allyshipDomain,
                agentMetadata: JSON.stringify({
                    sourceType: 'npc_move_selection',
                    source: input.source,
                    moveId: input.moveId,
                    wcgsStage: input.wcgsStage,
                    face: input.face,
                    prompt: input.prompt ?? null,
                    trialSlug: input.trialSlug ?? null,
                    spokeIndex: input.spokeIndex,
                    campaignRef: input.campaignRef,
                }),
            },
        })

        revalidatePath('/', 'layout')
        revalidatePath('/bars')
        revalidatePath('/hand')

        return { success: true, barId: bar.id, barTitle: title }
    } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to create move BAR'
        return { error: msg }
    }
}
