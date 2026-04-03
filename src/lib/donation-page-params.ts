import { z } from 'zod'

const DSW_ALLOWED_PATH = new Set(['money', 'time', 'space'])
const DSW_ALLOWED_TIER = new Set(['small', 'medium', 'large', 'custom'])
const cuidSchema = z.string().cuid()

export type ParsedDonatePageSearchParams = {
  amount?: string
  dswPath?: string
  dswTier?: string
  dswNarrative?: string
  dswMilestoneId?: string
  dswEchoQuestId?: string
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

  return {
    ...(amount ? { amount } : {}),
    ...(safePath ? { dswPath: safePath } : {}),
    ...(safeTier ? { dswTier: safeTier } : {}),
    ...(safeNarrative ? { dswNarrative: safeNarrative } : {}),
    ...(safeMilestoneId ? { dswMilestoneId: safeMilestoneId } : {}),
    ...(safeEchoQuestId ? { dswEchoQuestId: safeEchoQuestId } : {}),
  }
}
