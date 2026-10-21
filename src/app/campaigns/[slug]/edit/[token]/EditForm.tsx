'use client'

import { useState, useTransition } from 'react'
import { FIELD_SPEC, type HostedCampaignFields, type HostedFieldKey } from '@/lib/hosted-campaigns/campaigns'
import { saveHostedCampaign } from '@/actions/hosted-campaign'

const box = {
  background: 'var(--bars-surface-inset)',
  border: '1px solid var(--bars-line)',
  color: 'var(--bars-text-primary)',
} as const

export function EditForm({
  slug,
  token,
  initial,
  savedAt,
}: {
  slug: string
  token: string
  initial: HostedCampaignFields
  savedAt: string | null
}) {
  const [fields, setFields] = useState(initial)
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<string | null>(
    savedAt ? `Last saved ${new Date(savedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.` : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const set = (k: HostedFieldKey, v: string) => {
    setFields((f) => ({ ...f, [k]: v }))
    setDirty(true)
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        start(async () => {
          const res = await saveHostedCampaign(slug, token, fields)
          if (res.ok) {
            setDirty(false)
            setStatus('Saved. Your page shows it now.')
          } else setError(res.error)
        })
      }}
    >
      <header className="flex flex-col gap-2">
        <h1 style={{ fontFamily: 'var(--bars-font-display)', fontSize: 'var(--bars-text-3xl)' }}>Your campaign page</h1>
        <p style={{ color: 'var(--bars-text-secondary)' }}>
          Fill in what you have. Anything left blank shows its prompt on the page in gold, so placeholders are fine. Keep this link private: it is how you edit.
        </p>
        <a href={`/campaigns/${slug}`} target="_blank" rel="noopener noreferrer" className="self-start underline" style={{ color: 'var(--bars-earth-gem)' }}>
          Open your page
        </a>
        <a href={`/campaigns/${slug}/edit/${token}/intake`} className="self-start font-semibold underline" style={{ color: 'var(--bars-earth-gem)' }}>
          Build your GoFundMe and Patreon pages, one step at a time
        </a>
      </header>

      {FIELD_SPEC.map((f) => (
        <label key={f.key} className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">{f.label}</span>
          {f.long ? (
            <textarea id={`f-${f.key}`} rows={f.key === 'story' ? 8 : 2} value={fields[f.key]} placeholder={f.prompt} onChange={(e) => set(f.key, e.target.value)} className="rounded-md px-3 py-2" style={box} />
          ) : (
            <input id={`f-${f.key}`} type={f.url ? 'url' : 'text'} value={fields[f.key]} placeholder={f.prompt} onChange={(e) => set(f.key, e.target.value)} className="rounded-md px-3 py-2" style={box} />
          )}
        </label>
      ))}

      <div
        className="sticky bottom-0 flex flex-wrap items-center gap-3 py-3"
        style={{ background: 'var(--bars-bg-base)', borderTop: '1px solid var(--bars-line)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <button type="submit" disabled={pending || !dirty} className="rounded-md px-4 py-2 font-semibold disabled:opacity-60" style={{ background: 'var(--bars-earth-gem)', color: 'var(--bars-bg-base)' }}>
          {pending ? 'Saving' : 'Save'}
        </button>
        <span className="text-sm" role="status" style={{ color: error ? 'var(--bars-fire-gem)' : 'var(--bars-text-secondary)' }}>
          {error ?? (dirty ? 'You have changes that are not saved yet.' : status)}
        </span>
      </div>
    </form>
  )
}
