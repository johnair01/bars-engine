'use client'

/**
 * QuickAddLead — the lightweight roster add (decision A): four fields, then straight
 * into the lead's workspace to set goals + quests. Spec: campaign-lead-forge Phase 6.
 */
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { quickAddLead } from '@/actions/campaign-leads'

const CHANNELS = ['text', 'email', 'instagram', 'signal', 'other'] as const
const PURPLE = '#8b5cf6'
const inputCls =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[14px] text-[#f4f2ec] placeholder:text-[#6b6862] focus:border-[#8b5cf6] focus:outline-none'
const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-[#a09e98]'

export function QuickAddLead({
  campaignRef,
  basePath,
  domains,
}: {
  campaignRef: string
  basePath: string
  domains: { key: string; label: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [channel, setChannel] = useState('text')
  const [domain, setDomain] = useState('')
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await quickAddLead({
        campaignRef,
        name: name.trim(),
        contact: contact.trim() || undefined,
        channel,
        domain: domain || undefined,
      })
      if (res.ok) router.push(`${basePath}/${res.leadId}`)
      else setError(res.error)
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white"
        style={{ background: PURPLE }}
      >
        + Add a lead
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: '#121210' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#f4f2ec]">Add a lead</h2>
        <button onClick={() => setOpen(false)} className="text-[12px] text-[#a09e98]">
          Close
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Name *</span>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Who do you want to invite?" autoFocus />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Contact</span>
          <input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} placeholder="phone / email / @handle" />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Channel</span>
          <select className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Allyship domain</span>
          <select className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="">— pick later —</option>
            {domains.map((d) => (
              <option key={d.key} value={d.key}>{d.label}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="mt-3 text-[13px] text-red-400">{error}</p>}
      <button
        onClick={submit}
        disabled={pending || name.trim().length === 0}
        className="mt-5 rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
        style={{ background: PURPLE }}
      >
        {pending ? 'Adding…' : 'Add & open workspace →'}
      </button>
    </div>
  )
}
