'use server'

/**
 * CCV — Campaign Contribution Visibility
 * Server actions for sub-campaign slot adventure entry.
 *
 * AC 6: Player can enter a specific adventure/quest flow from a sub-campaign slot landing page.
 *
 * Design: API-first — return types defined before UI wiring.
 * Pattern: follows src/actions/campaign-contributions.ts conventions.
 */

import { db } from '@/lib/db'

// ============================================================
// Types
// ============================================================

/**
 * A single adventure available within a CampaignSlot.
 * Only active (status='ACTIVE') adventures are returned.
 */
export type SlotAdventureItem = {
  id: string
  title: string
  description: string | null
  /** Starting node ID for the adventure player; null means player at default */
  startNodeId: string | null
  /** Type of adventure — CYOA_INTAKE, CHARACTER_CREATOR, or null for standard */
  adventureType: string | null
  /** URL to enter this adventure from the slot landing page */
  entryUrl: string
}

/**
 * Full slot detail returned by getSlotDetails.
 * Contains the slot metadata and its resolved, playable adventures.
 */
export type SlotDetail = {
  id: string
  campaignRef: string
  parentSlotId: string | null
  /** 1=branch, 2=sub-branch, 3=adventure container */
  level: number
  title: string
  description: string | null
  /** Only active child slots */
  childSlots: Array<{
    id: string
    title: string
    description: string | null
    level: number
    sortOrder: number
    adventureCount: number
  }>
  /** Active adventures linked to this slot */
  adventures: SlotAdventureItem[]
  /** Breadcrumb trail from campaign root to this slot */
  breadcrumb: Array<{ id: string; title: string }>
  status: string
}

// ============================================================
// getSlotDetails
// ============================================================

/**
 * Returns slot details with resolved adventures and child slots.
 *
 * Adventures are resolved by parsing the JSON adventureIds array and
 * fetching each Adventure that has status='ACTIVE'.
 *
 * Child slots are returned for nesting navigation (level 1 → 2 → 3).
 * Slots at level 3 (adventure containers) may have no children.
 *
 * @param slotId  The CampaignSlot.id to fetch
 * @returns       SlotDetail or null if the slot doesn't exist / is archived
 */
export async function getSlotDetails(slotId: string): Promise<SlotDetail | null> {
  const slot = await db.campaignSlot.findUnique({
    where: { id: slotId },
    include: {
      parentSlot: {
        select: {
          id: true,
          title: true,
          parentSlotId: true,
          parentSlot: {
            select: { id: true, title: true },
          },
        },
      },
      childSlots: {
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!slot || slot.status === 'archived') {
    return null
  }

  // Parse adventureIds JSON array
  let adventureIdList: string[] = []
  try {
    const parsed = JSON.parse(slot.adventureIds)
    if (Array.isArray(parsed)) {
      adventureIdList = parsed.filter((id) => typeof id === 'string')
    }
  } catch {
    // adventureIds is malformed — treat as empty
    adventureIdList = []
  }

  // Fetch active adventures by the linked IDs
  const adventures =
    adventureIdList.length > 0
      ? await db.adventure.findMany({
          where: {
            id: { in: adventureIdList },
            status: 'ACTIVE',
          },
          select: {
            id: true,
            title: true,
            description: true,
            startNodeId: true,
            adventureType: true,
          },
        })
      : []

  // Preserve the GM-specified sort order from adventureIds
  const adventureOrder = new Map(adventureIdList.map((id, i) => [id, i]))
  adventures.sort(
    (a, b) => (adventureOrder.get(a.id) ?? 999) - (adventureOrder.get(b.id) ?? 999),
  )

  // Build the adventure entry URLs with slot context
  const adventureItems: SlotAdventureItem[] = adventures.map((adv) => {
    const params = new URLSearchParams({
      ref: slot.campaignRef,
      returnTo: `/campaign/slot/${slot.id}`,
    })
    return {
      id: adv.id,
      title: adv.title,
      description: adv.description ?? null,
      startNodeId: adv.startNodeId ?? null,
      adventureType: adv.adventureType ?? null,
      entryUrl: `/campaign/slot/${slot.id}/enter/${adv.id}?${params.toString()}`,
    }
  })

  // Build breadcrumb trail (campaign hub → parent → this slot)
  const breadcrumb: Array<{ id: string; title: string }> = []
  if (slot.parentSlot?.parentSlot) {
    breadcrumb.push({
      id: slot.parentSlot.parentSlot.id,
      title: slot.parentSlot.parentSlot.title,
    })
  }
  if (slot.parentSlot) {
    breadcrumb.push({ id: slot.parentSlot.id, title: slot.parentSlot.title })
  }

  // Compute adventure counts for child slot cards
  const childSlotItems = await Promise.all(
    slot.childSlots.map(async (child) => {
      let childAdventureCount = 0
      try {
        const parsed = JSON.parse(child.adventureIds)
        if (Array.isArray(parsed)) {
          childAdventureCount = parsed.length
        }
      } catch {
        childAdventureCount = 0
      }
      return {
        id: child.id,
        title: child.title,
        description: child.description ?? null,
        level: child.level,
        sortOrder: child.sortOrder,
        adventureCount: childAdventureCount,
      }
    }),
  )

  return {
    id: slot.id,
    campaignRef: slot.campaignRef,
    parentSlotId: slot.parentSlotId ?? null,
    level: slot.level,
    title: slot.title,
    description: slot.description ?? null,
    childSlots: childSlotItems,
    adventures: adventureItems,
    breadcrumb,
    status: slot.status,
  }
}

// ============================================================
// resolveSlotAdventureEntry
// ============================================================

/**
 * Validates that a specific adventure belongs to a slot and returns the
 * adventure player URL with campaign context injected.
 *
 * Called by the entry redirect page before redirecting to the adventure player.
 *
 * @param slotId       The CampaignSlot.id
 * @param adventureId  The Adventure.id to enter
 * @returns            { adventureUrl } on success, or { error } on failure
 */
export type ResolveSlotAdventureEntryResult =
  | { adventureUrl: string; campaignRef: string; returnTo: string }
  | { error: string }

export async function resolveSlotAdventureEntry(
  slotId: string,
  adventureId: string,
): Promise<ResolveSlotAdventureEntryResult> {
  // Load slot (must be active)
  const slot = await db.campaignSlot.findUnique({
    where: { id: slotId },
    select: { id: true, campaignRef: true, adventureIds: true, status: true, title: true },
  })

  if (!slot || slot.status === 'archived') {
    return { error: 'Slot not found or archived' }
  }

  // Verify the adventure is in this slot's adventureIds list
  let adventureIdList: string[] = []
  try {
    const parsed = JSON.parse(slot.adventureIds)
    if (Array.isArray(parsed)) {
      adventureIdList = parsed.filter((id) => typeof id === 'string')
    }
  } catch {
    return { error: 'Slot has no linked adventures' }
  }

  if (!adventureIdList.includes(adventureId)) {
    return { error: 'Adventure is not part of this slot' }
  }

  // Verify the adventure is active
  const adventure = await db.adventure.findUnique({
    where: { id: adventureId, status: 'ACTIVE' },
    select: { id: true, startNodeId: true, campaignRef: true },
  })

  if (!adventure) {
    return { error: 'Adventure not found or inactive' }
  }

  // Build the adventure player URL
  // Use adventure.campaignRef if set, else fall back to slot.campaignRef
  const campaignRef = adventure.campaignRef ?? slot.campaignRef
  const returnTo = `/campaign/slot/${slot.id}`

  const params = new URLSearchParams({
    ref: campaignRef,
    returnTo,
    // Pass slotId so the adventure player can credit contribution to this campaign
    slotId: slot.id,
  })

  const adventureUrl = `/adventure/${adventure.id}/play?${params.toString()}`

  return { adventureUrl, campaignRef, returnTo }
}
