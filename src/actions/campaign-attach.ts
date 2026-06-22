'use server'

/**
 * TSG Phase 2 — the explicit personal→collective bridge.
 *
 * Lets a player DECLARE that a BAR (or quest-BAR) of theirs serves a campaign:
 * "this work is for that campaign." Today this only happens implicitly through
 * the game loop; these actions make it a first-class, player-initiated act.
 *
 * Schema-reuse (per journey-map.md T0.2 — NO new fields for v1):
 *  - Sets `CustomBar.campaignRef` (= "this BAR belongs to campaign X").
 *  - Upserts a `ContributionAnnotation` (actionType='bar', createdById=player)
 *    so the campaign hub's contribution rollup (getMyContributions /
 *    getCampaignContributionProgress) surfaces the declared contribution.
 *
 * Pattern: follows src/actions/campaign-contributions.ts conventions.
 * All three are Server Actions (forms + useTransition); no route surface.
 */

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentPlayer } from '@/lib/auth'

// ============================================================
// Types
// ============================================================

/** Standard result envelope shared by the attach/detach mutations. */
export type AttachResult =
  | { success: true }
  | { error: string }
  | { needsLogin: true }

/** A campaign a player can offer work to. `ref` is the canonical campaignRef. */
export type AttachableCampaign = {
  ref: string
  name: string
}

/** A BAR the player has declared (offered) for a campaign — for hub display. */
export type DeclaredContribution = {
  barId: string
  title: string
  /** The player's intent note (or BAR title fallback) shown on the hub. */
  label: string
  /** Whether the BAR itself has been completed. */
  completed: boolean
}

// gmLabel is the player-facing label shown in the contribution list. Cap it so
// a long intent note can't blow out the hub UI.
const MAX_LABEL_LEN = 280

// ============================================================
// listAttachableCampaigns
// ============================================================

/**
 * Campaigns the current player can offer a BAR to.
 *
 * Primary set: campaigns the player belongs to (any role). Falls back to the
 * contribution-tracked campaigns (instances with a `campaignRef`) when the
 * player has no memberships yet, so the spine stays walkable for dogfooding /
 * the verification quest (e.g. Bruised Banana) without forcing a membership.
 *
 * Returns [] for logged-out callers (fail-soft; the UI shows a login affordance).
 */
export async function listAttachableCampaigns(): Promise<AttachableCampaign[]> {
  const player = await getCurrentPlayer()
  if (!player) return []

  try {
    const memberships = await db.instanceMembership.findMany({
      where: { playerId: player.id },
      include: {
        instance: { select: { name: true, slug: true, campaignRef: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    let rows = memberships
      .map((m) => m.instance)
      .filter((i): i is NonNullable<typeof i> => i != null)

    // Fallback: tracked campaigns when the player has no memberships yet.
    if (rows.length === 0) {
      rows = await db.instance.findMany({
        where: { campaignRef: { not: null } },
        select: { name: true, slug: true, campaignRef: true },
        orderBy: { name: 'asc' },
        take: 20,
      })
    }

    // Canonical ref = campaignRef when set, else slug. De-dupe by ref.
    const byRef = new Map<string, AttachableCampaign>()
    for (const i of rows) {
      const ref = (i.campaignRef ?? i.slug)?.trim()
      if (!ref) continue
      if (!byRef.has(ref)) byRef.set(ref, { ref, name: i.name })
    }
    return [...byRef.values()]
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[listAttachableCampaigns]', e)
    }
    return []
  }
}

// ============================================================
// getMyDeclaredContributions
// ============================================================

/**
 * The BARs a player has explicitly offered to a campaign (player-declared
 * 'bar' annotations they created). Surfaced on the campaign hub so the player
 * can see their declared contributions — even before the BAR is completed.
 *
 * Fail-soft: returns [] on any error (the hub renders without it).
 */
export async function getMyDeclaredContributions(
  campaignRef: string,
  playerId: string,
): Promise<DeclaredContribution[]> {
  try {
    const ref = campaignRef.trim()
    const annotations = await db.contributionAnnotation.findMany({
      where: { campaignRef: ref, actionType: 'bar', createdById: playerId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })
    if (annotations.length === 0) return []

    const barIds = annotations.map((a) => a.actionId)
    const bars = await db.customBar.findMany({
      where: { id: { in: barIds } },
      select: { id: true, title: true, status: true },
    })
    const barById = new Map(bars.map((b) => [b.id, b]))

    return annotations
      .map((a) => {
        const bar = barById.get(a.actionId)
        if (!bar) return null
        return {
          barId: bar.id,
          title: bar.title,
          label: a.gmLabel,
          completed: bar.status === 'completed',
        }
      })
      .filter((x): x is DeclaredContribution => x != null)
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getMyDeclaredContributions]', e)
    }
    return []
  }
}

// ============================================================
// attachBarToCampaign
// ============================================================

/**
 * Declare that a BAR serves a campaign.
 *
 * - Validates ownership (a player can only offer their own BAR).
 * - Validates the campaign exists (Instance by campaignRef or slug) and
 *   normalizes to the canonical campaignRef.
 * - Sets `CustomBar.campaignRef` and upserts the player's contribution intent.
 *
 * Idempotent: re-attaching to the same campaign updates the intent label;
 * re-targeting to a different campaign clears the stale annotation first.
 */
export async function attachBarToCampaign(input: {
  barId: string
  campaignRef: string
  /** "I'm offering this as collective wisdom for X" — becomes the hub label. */
  intentNote?: string
}): Promise<AttachResult> {
  const player = await getCurrentPlayer()
  if (!player) return { needsLogin: true }

  const barId = input.barId?.trim()
  const requestedRef = input.campaignRef?.trim()
  if (!barId || !requestedRef) {
    return { error: 'Pick a BAR and a campaign to offer it to.' }
  }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, title: true, campaignRef: true },
  })
  if (!bar) return { error: 'That BAR no longer exists.' }
  if (bar.creatorId !== player.id) {
    return { error: 'You can only offer your own BAR to a campaign.' }
  }

  // Resolve + validate the campaign (exact match — no active-instance fallback,
  // so a typo can't silently attach to the wrong campaign).
  const instance = await db.instance.findFirst({
    where: { OR: [{ campaignRef: requestedRef }, { slug: requestedRef }] },
    select: { campaignRef: true, slug: true },
  })
  if (!instance) return { error: 'That campaign could not be found.' }
  const ref = (instance.campaignRef ?? instance.slug ?? requestedRef).trim()

  const gmLabel = (input.intentNote?.trim() || bar.title).slice(0, MAX_LABEL_LEN)

  try {
    await db.$transaction(async (tx) => {
      // Re-target: drop the stale declaration on the previous campaign.
      if (bar.campaignRef && bar.campaignRef !== ref) {
        await tx.contributionAnnotation.deleteMany({
          where: { campaignRef: bar.campaignRef, actionType: 'bar', actionId: barId },
        })
      }
      await tx.customBar.update({
        where: { id: barId },
        data: { campaignRef: ref },
      })
      await tx.contributionAnnotation.upsert({
        where: {
          campaignRef_actionType_actionId: {
            campaignRef: ref,
            actionType: 'bar',
            actionId: barId,
          },
        },
        create: {
          campaignRef: ref,
          actionType: 'bar',
          actionId: barId,
          gmLabel,
          createdById: player.id,
          status: 'active',
        },
        update: { gmLabel, status: 'active' },
      })
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[attachBarToCampaign]', e)
    }
    return { error: 'Could not offer this BAR right now. Try again.' }
  }

  revalidatePath('/hand')
  revalidatePath(`/campaign/${ref}`)
  return { success: true }
}

// ============================================================
// detachBarFromCampaign
// ============================================================

/**
 * Withdraw a BAR's campaign declaration. Clears `CustomBar.campaignRef` and
 * removes the player's contribution intent. Idempotent — a BAR with no
 * campaign is treated as already detached.
 */
export async function detachBarFromCampaign(input: {
  barId: string
}): Promise<AttachResult> {
  const player = await getCurrentPlayer()
  if (!player) return { needsLogin: true }

  const barId = input.barId?.trim()
  if (!barId) return { error: 'Missing BAR.' }

  const bar = await db.customBar.findUnique({
    where: { id: barId },
    select: { id: true, creatorId: true, campaignRef: true },
  })
  if (!bar) return { error: 'That BAR no longer exists.' }
  if (bar.creatorId !== player.id) {
    return { error: 'You can only withdraw your own BAR.' }
  }
  if (!bar.campaignRef) return { success: true } // already detached

  const previousRef = bar.campaignRef
  try {
    await db.$transaction(async (tx) => {
      await tx.contributionAnnotation.deleteMany({
        where: { campaignRef: previousRef, actionType: 'bar', actionId: barId },
      })
      await tx.customBar.update({
        where: { id: barId },
        data: { campaignRef: null },
      })
    })
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[detachBarFromCampaign]', e)
    }
    return { error: 'Could not withdraw this BAR right now. Try again.' }
  }

  revalidatePath('/hand')
  revalidatePath(`/campaign/${previousRef}`)
  return { success: true }
}
