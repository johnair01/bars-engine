'use client'

import { captureInterestList } from '@/actions/leads'
import { EmailCaptureForm } from '@/components/leads/EmailCaptureForm'

export function NonprofitFoundingCircle() {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-700 bg-black/20 p-6">
      <h2 className="text-lg font-bold">If one of those four is you</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        Put your name down and say which one. Saying &ldquo;I have done a board before&rdquo; or
        &ldquo;I have a space&rdquo; is enough to start from.
      </p>
      <EmailCaptureForm
        className="mt-4"
        askName
        promise="I will write when the founding circle meets. No sequence, and no ask for money — that one stays closed until the paperwork clears."
        submitLabel="Put me down"
        onSubmit={({ email, name }) => captureInterestList({ email, name, list: 'nonprofit' })}
      />
    </section>
  )
}
