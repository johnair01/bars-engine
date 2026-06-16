import { z } from 'zod'
import { WALL_KEYS } from '@/lib/event/barn-raising'

const DSW_ALLOWED_PATH = new Set(['money', 'time', 'space'])
const DSW_ALLOWED_TIER = new Set(['small', 'medium', 'large', 'custom'])
const WALL_KEY_SET = new Set<string>(WALL_KEYS)
const cuidSchema = z.string().cuid()

export type ParsedDonatePageSearchParams = {
  amount?: string
  dswPath?: string
  dswTier?: string
  dswNarrative?: string
  dswMilestoneId?: string
  dswEchoQuestId?: string
  /** Barn wall key this purchase credits (e.g. "presale"). */
  wall?: string
  /** Product key from the pricing catalog (for contribution note). */
  product?: string
  /** Product variant label (for contribution note). */
  variant?: string
}

/**
 * Shared validation for `/event/donate` and public demo donate routes (DSW + echo quest ids).
 */
export function parseDonatePageSearchParams(sp: {
  amount?: string
  dswPath?: string
  dswTier?: string
  dswNarrative?: string
  dswMilestoneId?: string
  dswEchoQuestId?: string
  wall?: string
  product?: string
  variant?: string
}): ParsedDonatePageSearchParams {
  const amount = sp.amount?.trim()
  let dswNarrative = sp.dswNarrative?.trim() ?? ''
  if (dswNarrative.length > 280) dswNarrative = dswNarrative.slice(0, 280)
  const rawPath = sp.dswPath?.trim()
  const rawTier = sp.dswTier?.trim()
  const rawMilestone = sp.dswMilestoneId?.trim() ?? ''
  const rawEchoQuest = sp.dswEchoQuestId?.trim() ?? ''
  const safePath = rawPath && DSW_ALLOWED_PATH.has(rawPath) ? rawPath : undefined
  const safeTier = rawTier && DSW_ALLOWED_TIER.has(rawTier) ? rawTier : undefined
  const safeNarrative = dswNarrative || undefined
  const safeMilestoneId = cuidSchema.safeParse(rawMilestone).success ? rawMilestone : undefined
  const safeEchoQuestId = cuidSchema.safeParse(rawEchoQuest).success ? rawEchoQuest : undefined
  const rawWall = sp.wall?.trim()
  const safeWall = rawWall && WALL_KEY_SET.has(rawWall) ? rawWall : undefined
  const safeProduct = sp.product?.trim().slice(0, 64) || undefined
  const safeVariant = sp.variant?.trim().slice(0, 64) || undefined

  return {
    ...(amount ? { amount } : {}),
    ...(safePath ? { dswPath: safePath } : {}),
    ...(safeTier ? { dswTier: safeTier } : {}),
    ...(safeNarrative ? { dswNarrative: safeNarrative } : {}),
    ...(safeMilestoneId ? { dswMilestoneId: safeMilestoneId } : {}),
    ...(safeEchoQuestId ? { dswEchoQuestId: safeEchoQuestId } : {}),
    ...(safeWall ? { wall: safeWall } : {}),
    ...(safeProduct ? { product: safeProduct } : {}),
    ...(safeVariant ? { variant: safeVariant } : {}),
  }
}
