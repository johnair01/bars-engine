'use client'

/**
 * The one optional ask on an otherwise ungated page.
 *
 * This is Appendix H's own instruction rather than a funnel: *"Date every
 * version. Across a year of play you can watch your face, your shadow and your
 * myths move."* A reminder to re-fill is the book asking, and the copy says
 * exactly what arrives and how often, so the ask is legible before it is made.
 *
 * It enters no sequence — see `src/lib/esp/list-contract.ts`.
 */

import { captureCharacterSheetNudge } from '@/actions/leads'
import { EmailCaptureForm } from '@/components/leads/EmailCaptureForm'

export function CharacterSheetNudge() {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-700 bg-black/20 p-6">
      <h2 className="text-lg font-bold">Want the nudge?</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        The sheet is worth re-filling every few months. Re-filling is where you see the
        movement, and a sheet with one date on it cannot show you any.
      </p>
      <EmailCaptureForm
        className="mt-4"
        promise="One reminder a quarter, with a blank copy attached. Nothing else."
        submitLabel="Remind me"
        onSubmit={captureCharacterSheetNudge}
      />
    </section>
  )
}
