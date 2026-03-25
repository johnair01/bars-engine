'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import {
  canCreateSwapListing,
  canModerateSwapListings,
  canViewSwapGalleryPublic,
  getSwapEventScopedRole,
  hasSwapInstanceMembership,
} from '@/lib/swap-event-permissions'
import {
  SWAP_LISTING_BAR_TYPE,
  deriveListingTitle,
  encodeSwapListingDocQuestMetadata,
  parseSwapListingFromDocQuest,
  swapListingDraftInputSchema,
} from '@/lib/swap-listing'

const PAGE_SIZE = 12
const MAX_LISTINGS_PER_PLAYER_PER_DAY = 25

function selectInstanceForSwap() {
  return {
    id: true,
    slug: true,
    name: true,
    campaignRef: true,
    swapEventIntake: true,
    swapEventIntakePublishedAt: true,
  } as const
}

type SwapInst = {
  id: string
  slug: string
  name: string
  campaignRef: string | null
  swapEventIntake: unknown
  swapEventIntakePublishedAt: Date | null
}

async function loadSwapInstance(slug: string): Promise<SwapInst | null> {
  const inst = await db.instance.findUnique({
    where: { slug },
    select: selectInstanceForSwap(),
  })
  if (!inst?.swapEventIntake) return null
  return inst
}

export async function createSwapListingDraft(
  slug: string,
  raw: unknown
): Promise<{ ok: true; barId: string } | { ok: false; error: string }> {
  const parsed = swapListingDraftInputSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join('; ') || 'Invalid input' }
  }
  const input = parsed.data
  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) return { ok: false, error: 'Sign in to create a listing.' }

  const inst = await loadSwapInstance(slug)
  if (!inst) return { ok: false, error: 'Swap instance not found.' }

  const published = !!inst.swapEventIntakePublishedAt
  const scoped = await getSwapEventScopedRole(playerId, inst.id)
  const member = await hasSwapInstanceMembership(playerId, inst.id)
  if (!canCreateSwapListing(isAdmin, scoped, member, published)) {
    return { ok: false, error: 'You cannot list items here yet (membership or published intake required).' }
  }

  const dayAgo = new Date(Date.now() - 864e5)
  const recent = await db.customBar.count({
    where: {
      creatorId: playerId,
      collapsedFromInstanceId: inst.id,
      type: SWAP_LISTING_BAR_TYPE,
      createdAt: { gte: dayAgo },
    },
  })
  if (recent >= MAX_LISTINGS_PER_PLAYER_PER_DAY) {
    return { ok: false, error: 'Daily listing limit reached. Try again tomorrow.' }
  }

  const title = deriveListingTitle(input.title, input.description)
  const docJson = encodeSwapListingDocQuestMetadata({
    brand: input.brand,
    size: input.size,
    condition: input.condition,
  })

  const bar = await db.customBar.create({
    data: {
      creatorId: playerId,
      title,
      description: input.description.trim(),
      type: SWAP_LISTING_BAR_TYPE,
      reward: 0,
      visibility: 'private',
      status: 'active',
      inputs: '[]',
      rootId: 'temp',
      collapsedFromInstanceId: inst.id,
      campaignRef: inst.campaignRef,
      allyshipDomain: 'GATHERING_RESOURCES',
      docQuestMetadata: docJson,
      swapListingHidden: false,
    },
  })
  await db.customBar.update({
    where: { id: bar.id },
    data: { rootId: bar.id },
  })

  revalidatePath(`/swap/${slug}/gallery`)
  revalidatePath(`/swap/${slug}/new`)
  return { ok: true, barId: bar.id }
}

export async function finalizeSwapListing(
  slug: string,
  barId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { playerId } = await getCurrentPlayerSafe()
  if (!playerId) return { ok: false, error: 'Sign in required.' }

  const inst = await loadSwapInstance(slug)
  if (!inst) return { ok: false, error: 'Swap instance not found.' }

  const bar = await db.customBar.findFirst({
    where: {
      id: barId,
      creatorId: playerId,
      type: SWAP_LISTING_BAR_TYPE,
      collapsedFromInstanceId: inst.id,
    },
    select: { id: true },
  })
  if (!bar) return { ok: false, error: 'Listing not found.' }

  const assetCount = await db.asset.count({
    where: { customBarId: barId, type: 'bar_attachment' },
  })
  if (assetCount < 1) {
    return { ok: false, error: 'Add at least one photo before publishing your listing.' }
  }

  await db.customBar.update({
    where: { id: barId },
    data: { visibility: 'public' },
  })

  revalidatePath(`/swap/${slug}/gallery`)
  revalidatePath(`/swap/${slug}/new`)
  return { ok: true }
}

export type SwapListingSummary = {
  id: string
  title: string
  description: string
  brand: string | null
  size: string | null
  condition: string | null
  coverUrl: string | null
  creatorName: string | null
  createdAt: string
  swapListingHidden: boolean
}

export async function listSwapListings(
  slug: string,
  page: number,
  options?: { includeHidden?: boolean }
): Promise<
  | { ok: false; error: string }
  | {
      ok: true
      listings: SwapListingSummary[]
      hasMore: boolean
      page: number
      pageSize: number
      canModerate: boolean
    }
> {
  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  const inst = await loadSwapInstance(slug)
  if (!inst) return { ok: false, error: 'Swap instance not found.' }

  const published = !!inst.swapEventIntakePublishedAt
  let canModerate = false
  if (playerId) {
    const scoped = await getSwapEventScopedRole(playerId, inst.id)
    canModerate = canModerateSwapListings(isAdmin, scoped)
  }

  const canView = canModerate || canViewSwapGalleryPublic(published)
  if (!canView) {
    return { ok: false, error: 'Gallery is not available until organizers publish intake.' }
  }

  const p = Math.max(1, Math.floor(page))
  const includeHidden = !!options?.includeHidden && canModerate

  const where: {
    type: string
    collapsedFromInstanceId: string
    status: string
    archivedAt: null
    visibility: string
    swapListingHidden?: boolean
  } = {
    type: SWAP_LISTING_BAR_TYPE,
    collapsedFromInstanceId: inst.id,
    status: 'active',
    archivedAt: null,
    visibility: 'public',
  }
  if (!includeHidden) {
    where.swapListingHidden = false
  }

  const rows = await db.customBar.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (p - 1) * PAGE_SIZE,
    take: PAGE_SIZE + 1,
    select: {
      id: true,
      title: true,
      description: true,
      docQuestMetadata: true,
      createdAt: true,
      swapListingHidden: true,
      creator: { select: { name: true } },
      assets: {
        where: { type: 'bar_attachment' },
        orderBy: { createdAt: 'asc' },
        take: 1,
        select: { url: true },
      },
    },
  })

  const hasMore = rows.length > PAGE_SIZE
  const slice = hasMore ? rows.slice(0, PAGE_SIZE) : rows

  const listings: SwapListingSummary[] = slice.map((r) => {
    const meta = parseSwapListingFromDocQuest(r.docQuestMetadata)
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      brand: meta?.brand ?? null,
      size: meta?.size ?? null,
      condition: meta?.condition ?? null,
      coverUrl: r.assets[0]?.url ?? null,
      creatorName: r.creator.name,
      createdAt: r.createdAt.toISOString(),
      swapListingHidden: r.swapListingHidden,
    }
  })

  return {
    ok: true,
    listings,
    hasMore,
    page: p,
    pageSize: PAGE_SIZE,
    canModerate,
  }
}

export async function moderateSwapListing(
  slug: string,
  barId: string,
  action: 'hide' | 'unhide' | 'archive'
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  if (!playerId) return { ok: false, error: 'Sign in required.' }

  const inst = await loadSwapInstance(slug)
  if (!inst) return { ok: false, error: 'Swap instance not found.' }

  const scoped = await getSwapEventScopedRole(playerId, inst.id)
  if (!canModerateSwapListings(isAdmin, scoped)) {
    return { ok: false, error: 'Only swap host or co-host can moderate listings.' }
  }

  const bar = await db.customBar.findFirst({
    where: {
      id: barId,
      type: SWAP_LISTING_BAR_TYPE,
      collapsedFromInstanceId: inst.id,
    },
    select: { id: true },
  })
  if (!bar) return { ok: false, error: 'Listing not found.' }

  if (action === 'hide') {
    await db.customBar.update({ where: { id: barId }, data: { swapListingHidden: true } })
  } else if (action === 'unhide') {
    await db.customBar.update({ where: { id: barId }, data: { swapListingHidden: false } })
  } else {
    await db.customBar.update({
      where: { id: barId },
      data: { status: 'archived', archivedAt: new Date() },
    })
  }

  revalidatePath(`/swap/${slug}/gallery`)
  return { ok: true }
}

/** For RSC: whether the viewer may open gallery / create listing UI. */
export async function getSwapGalleryAccess(slug: string): Promise<{
  instanceName: string
  published: boolean
  canViewGallery: boolean
  canCreate: boolean
  canModerate: boolean
} | null> {
  const { playerId, isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })
  const inst = await loadSwapInstance(slug)
  if (!inst) return null

  const published = !!inst.swapEventIntakePublishedAt
  let scoped: Awaited<ReturnType<typeof getSwapEventScopedRole>> = null
  let member = false
  if (playerId) {
    scoped = await getSwapEventScopedRole(playerId, inst.id)
    member = await hasSwapInstanceMembership(playerId, inst.id)
  }
  const canModerate = playerId ? canModerateSwapListings(isAdmin, scoped) : false
  const canViewGallery = canModerate || canViewSwapGalleryPublic(published)
  const canCreate = playerId
    ? canCreateSwapListing(isAdmin, scoped, member, published)
    : false

  return {
    instanceName: inst.name,
    published,
    canViewGallery,
    canCreate,
    canModerate,
  }
}
