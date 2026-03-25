import { z } from 'zod'

/** CustomBar.type for CSHE Phase C gallery filter */
export const SWAP_LISTING_BAR_TYPE = 'swap_listing'

const metaInner = z.object({
  v: z.literal(1),
  brand: z.string().max(200).nullable().optional(),
  size: z.string().max(120).nullable().optional(),
  condition: z.string().max(120).nullable().optional(),
})

export type SwapListingMetaV1 = z.infer<typeof metaInner>

const wrapped = z.object({
  swapListing: metaInner,
})

export function encodeSwapListingDocQuestMetadata(meta: {
  brand?: string | null
  size?: string | null
  condition?: string | null
}): string {
  const inner: SwapListingMetaV1 = {
    v: 1,
    brand: meta.brand?.trim() || null,
    size: meta.size?.trim() || null,
    condition: meta.condition?.trim() || null,
  }
  return JSON.stringify({ swapListing: inner })
}

export function parseSwapListingFromDocQuest(raw: string | null | undefined): SwapListingMetaV1 | null {
  if (!raw?.trim()) return null
  try {
    const j = JSON.parse(raw) as unknown
    const p = wrapped.safeParse(j)
    if (!p.success) return null
    return p.data.swapListing
  } catch {
    return null
  }
}

export const swapListingDraftInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(3).max(20000),
  brand: z.string().trim().max(200).optional(),
  size: z.string().trim().max(120).optional(),
  condition: z.string().trim().max(120).optional(),
})

export type SwapListingDraftInput = z.infer<typeof swapListingDraftInputSchema>

export function deriveListingTitle(title: string, description: string): string {
  const t = title.trim()
  if (t.length > 0) return t.length <= 200 ? t : t.slice(0, 197) + '...'
  const first = description.trim().split(/\r?\n/)[0] || ''
  if (first.length <= 80) return first || 'Swap listing'
  return first.slice(0, 77) + '...'
}
