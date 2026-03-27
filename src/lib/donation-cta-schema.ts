import { z } from 'zod'

function optionalPayUrl() {
  return z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? '' : String(v).trim()))
    .refine((s) => s === '' || /^https:\/\//i.test(s), 'Payment links must be https or empty')
    .transform((s) => (s === '' ? null : s))
}

/** Shared shape for Instance payment fields + optional CTA label (campaign + admin forms). */
export const instanceDonationCtaSchema = z.object({
  stripeOneTimeUrl: optionalPayUrl(),
  patreonUrl: optionalPayUrl(),
  venmoUrl: optionalPayUrl(),
  cashappUrl: optionalPayUrl(),
  paypalUrl: optionalPayUrl(),
  donationButtonLabel: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => {
      if (v == null) return null
      const t = String(v).trim()
      if (t === '') return null
      return t.slice(0, 120)
    }),
})

export type InstanceDonationCtaInput = z.infer<typeof instanceDonationCtaSchema>

/** Event-level overrides: same URL keys; null = inherit from Instance. */
export const eventDonationCtaOverridesSchema = z
  .object({
    stripeOneTimeUrl: optionalPayUrl(),
    patreonUrl: optionalPayUrl(),
    venmoUrl: optionalPayUrl(),
    cashappUrl: optionalPayUrl(),
    paypalUrl: optionalPayUrl(),
    donationButtonLabel: z.union([z.string().max(120), z.null()]).optional(),
  })
  .partial()
  .strict()

export type EventDonationCtaOverrides = z.infer<typeof eventDonationCtaOverridesSchema>
