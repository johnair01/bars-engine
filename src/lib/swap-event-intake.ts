import { z } from 'zod'

/** InstanceMembership.roleKey values for clothing-swap (CSHE) sub-campaigns */
export const SWAP_EVENT_ROLE_HOST = 'swap_event_host'
export const SWAP_EVENT_ROLE_CO_HOST = 'swap_event_co_host'
export const SWAP_EVENT_ROLE_PARTICIPANT = 'swap_event_participant'

export const SWAP_EVENT_ORGANIZER_ROLE_KEYS = [SWAP_EVENT_ROLE_HOST, SWAP_EVENT_ROLE_CO_HOST] as const

const optionalUrl = z.union([z.string().url(), z.literal('')]).optional()

export const swapEventIntakePayloadSchema = z.object({
  narrativeTitle: z.string().max(500).optional(),
  narrativeBody: z.string().max(20000).optional(),
  partifulUrl: optionalUrl,
  hybridIrl: z.boolean().optional(),
  hybridVirtual: z.boolean().optional(),
  donationGoalCents: z.number().int().nonnegative().nullable().optional(),
  minOpeningBidVibeulons: z.number().int().min(1).optional(),
  fundraiserDisclaimer: z.string().max(12000).optional(),
  /** `datetime-local` or ISO string; parsed at auction close in later phases */
  eventClosesAt: z.string().max(40).optional(),
})

export type SwapEventIntakePayload = z.infer<typeof swapEventIntakePayloadSchema>

export function parseSwapEventIntakeJson(
  raw: unknown
): { ok: true; data: SwapEventIntakePayload } | { ok: false; error: string } {
  if (raw == null) {
    return { ok: true, data: {} }
  }
  if (typeof raw === 'object' && raw !== null && Object.keys(raw).length === 0) {
    return { ok: true, data: {} }
  }
  const r = swapEventIntakePayloadSchema.safeParse(raw)
  if (!r.success) {
    return { ok: false, error: r.error.flatten().formErrors.join('; ') || 'Invalid intake' }
  }
  return { ok: true, data: r.data }
}

export function mergeSwapEventIntake(existing: unknown, patch: SwapEventIntakePayload): SwapEventIntakePayload {
  const parsed = parseSwapEventIntakeJson(existing)
  const base = parsed.ok ? parsed.data : {}
  const merged = { ...base, ...patch }
  const again = swapEventIntakePayloadSchema.safeParse(merged)
  if (!again.success) {
    return swapEventIntakePayloadSchema.parse(base)
  }
  return again.data
}
