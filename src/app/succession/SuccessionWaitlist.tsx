'use client'

import { captureInterestList } from '@/actions/leads'
import { EmailCaptureForm } from '@/components/leads/EmailCaptureForm'

export function SuccessionWaitlist() {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-700 bg-black/20 p-6">
      <h2 className="text-lg font-bold">The list</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        If you are already teaching this, say so in the name field or write to me directly.
        Knowing who is out there doing it is most of what I need before any of this can be
        designed.
      </p>
      <EmailCaptureForm
        className="mt-4"
        askName
        promise="One update when there is something real to say. No sequence, no launch runway, and no seat being held."
        submitLabel="Add me"
        onSubmit={({ email, name }) => captureInterestList({ email, name, list: 'succession' })}
      />
    </section>
  )
}
