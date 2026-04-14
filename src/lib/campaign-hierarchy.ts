import type { PrismaClient } from '@prisma/client'

/** Matches [.specify/specs/campaign-recursive-nesting/spec.md](../../../.specify/specs/campaign-recursive-nesting/spec.md) hard cap. */
export const HARD_CAMPAIGN_TREE_DEPTH = 10

export const SOFT_CAMPAIGN_TREE_DEPTH = 5

type DbSubset = Pick<PrismaClient, 'campaign'>

/**
 * Depth from root: root = 0, direct child = 1, …
 * Stops at `maxHops` or if a cycle is detected in stored data.
 */
export async function campaignDepthFromRoot(
  db: DbSubset,
  campaignId: string,
  maxHops = HARD_CAMPAIGN_TREE_DEPTH
): Promise<number> {
  let depth = 0
  let cur: string | null = campaignId
  const seen = new Set<string>()
  for (let i = 0; i <= maxHops && cur; i++) {
    if (seen.has(cur)) return maxHops + 1
    seen.add(cur)
    const parentId: string | null =
      (
        await db.campaign.findUnique({
          where: { id: cur },
          select: { parentCampaignId: true },
        })
      )?.parentCampaignId ?? null
    if (!parentId) break
    depth++
    cur = parentId
  }
  return depth
}

/**
 * True if assigning `parentId` as parent of `campaignId` would create a cycle.
 * `ancestorChainFromParent` = walk from `parentId` upward: [parentId, grandparentId, ...].
 */
export function wouldAssignParentCreateCycle(
  campaignId: string | undefined,
  parentId: string,
  ancestorChainFromParent: string[]
): boolean {
  if (campaignId !== undefined && parentId === campaignId) return true
  if (campaignId !== undefined && ancestorChainFromParent.includes(campaignId)) return true
  return false
}

/** Collect [parentId, grandparentId, ...] walking up from `startId` (includes start as first hop target's chain — start is the immediate parent candidate). */
export async function collectAncestorChainIds(
  db: DbSubset,
  startId: string,
  maxHops = HARD_CAMPAIGN_TREE_DEPTH
): Promise<string[]> {
  const chain: string[] = []
  let cur: string | null = startId
  const seen = new Set<string>()
  for (let i = 0; i < maxHops && cur; i++) {
    if (seen.has(cur)) break
    seen.add(cur)
    chain.push(cur)
    const parentId: string | null =
      (
        await db.campaign.findUnique({
          where: { id: cur },
          select: { parentCampaignId: true },
        })
      )?.parentCampaignId ?? null
    if (!parentId) break
    cur = parentId
  }
  return chain
}

export type ValidateParentResult = { ok: true } | { error: string }

/**
 * Validates `parentCampaignId` for create/update: same instance, no cycles, depth within hard cap.
 */
export async function validateCampaignParentAssignment(
  db: DbSubset,
  opts: {
    instanceId: string
    parentCampaignId: string | null | undefined
    /** Set when updating an existing campaign (cycle check). */
    campaignId?: string
  }
): Promise<ValidateParentResult> {
  const raw = opts.parentCampaignId?.trim()
  if (!raw) return { ok: true }

  const parent = await db.campaign.findUnique({
    where: { id: raw },
    select: { id: true, instanceId: true },
  })
  if (!parent) return { error: 'Parent campaign not found' }
  if (parent.instanceId !== opts.instanceId) {
    return { error: 'Parent campaign must belong to the same instance' }
  }

  const ancestors = await collectAncestorChainIds(db, parent.id)
  if (wouldAssignParentCreateCycle(opts.campaignId, parent.id, ancestors)) {
    return { error: 'Cannot assign parent: would create a cycle' }
  }

  const parentDepth = await campaignDepthFromRoot(db, parent.id)
  if (parentDepth + 1 > HARD_CAMPAIGN_TREE_DEPTH) {
    return { error: `Campaign tree cannot exceed depth ${HARD_CAMPAIGN_TREE_DEPTH}` }
  }

  return { ok: true }
}
