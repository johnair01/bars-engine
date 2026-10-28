'use client'

import { useState, useTransition } from 'react'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { joinHostedCampaign } from '@/actions/hosted-campaign'

const input = {
  background: 'var(--bars-surface-inset)',
  border: '1px solid var(--bars-line)',
  color: 'var(--bars-text-primary)',
} as const

export function JoinForm({ slug, name }: { slug: string; name: string }) {
  const [domain, setDomain] = useState<string>('GATHERING_RESOURCES')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, start] = useTransition()

  if (done) {
    return (
      <p className="rounded-lg p-4" role="status" style={{ background: 'var(--bars-surface-card)', border: '1px solid var(--bars-earth-gem)' }}>
        You are on {name}&apos;s list. She will reach out the way you asked.
      </p>
    )
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg p-4"
      style={{ background: 'var(--bars-surface-card)', border: '1px solid var(--bars-line)' }}
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        setError(null)
        start(async () => {
          const res = await joinHostedCampaign({
            slug,
            domain,
            name: String(fd.get('name') ?? ''),
            contact: String(fd.get('contact') ?? ''),
            note: String(fd.get('note') ?? ''),
          })
          if (res.ok) setDone(true)
          else setError(res.error)
        })
      }}
    >
      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-semibold">Where you can help</legend>
        {ALLYSHIP_DOMAINS.map((d) => (
          <label key={d.key} className="cursor-pointer rounded-full px-3 py-1 text-sm" style={{ ...input, borderColor: domain === d.key ? 'var(--bars-earth-gem)' : 'var(--bars-line)' }}>
            <input type="radio" name="domain" value={d.key} checked={domain === d.key} onChange={() => setDomain(d.key)} className="mr-2" />
            {d.label}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        Your name
        <input id="join-name" name="name" required maxLength={120} className="rounded-md px-3 py-2" style={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        How she can reach you (email, phone or handle)
        <input id="join-contact" name="contact" required maxLength={200} className="rounded-md px-3 py-2" style={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Anything she should know (optional)
        <textarea id="join-note" name="note" maxLength={2000} rows={3} className="rounded-md px-3 py-2" style={input} />
      </label>
      {error && <p className="text-sm" role="alert" style={{ color: 'var(--bars-fire-gem)' }}>{error}</p>}
      <button type="submit" disabled={pending} className="self-start rounded-md px-4 py-2 font-semibold disabled:opacity-60" style={{ background: 'var(--bars-earth-gem)', color: 'var(--bars-bg-base)' }}>
        {pending ? 'Adding you' : "I'm in"}
      </button>
    </form>
  )
}
