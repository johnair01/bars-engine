'use client'

/**
 * ForgeLeadForm — owner hand-authors a tailored lead + starter quests, and gets
 * a shareable invite link. Spec: .specify/specs/campaign-lead-forge/spec.md
 */
import { useMemo, useState, useTransition } from 'react'
import { createManualLead } from '@/actions/campaign-leads'
import type { StarterQuestOption } from './CampaignLeadsPage'

const CHANNELS = ['text', 'email', 'instagram', 'signal', 'other'] as const
const PURPLE = '#8b5cf6'

interface DomainOption {
  key: string
  label: string
}

const inputCls =
  'w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[14px] text-[#f4f2ec] placeholder:text-[#6b6862] focus:border-[#8b5cf6] focus:outline-none'
const labelCls = 'text-[11px] font-semibold uppercase tracking-wide text-[#a09e98]'

export function ForgeLeadForm({
  campaignRef,
  questPool,
  domains,
}: {
  campaignRef: string
  questPool: StarterQuestOption[]
  domains: DomainOption[]
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [channel, setChannel] = useState<string>('text')
  const [domain, setDomain] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [actions, setActions] = useState<string[]>([''])
  const [selectedQuests, setSelectedQuests] = useState<string[]>([])
  const [roleKey, setRoleKey] = useState('')
  const [message, setMessage] = useState('')

  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ inviteUrl: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Quests matching the chosen domain float to the top; all remain selectable.
  const orderedQuests = useMemo(() => {
    if (!domain) return questPool
    const primary = questPool.filter((q) => q.domain === domain)
    const rest = questPool.filter((q) => q.domain !== domain)
    return [...primary, ...rest]
  }, [questPool, domain])

  function toggleQuest(id: string) {
    setSelectedQuests((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]))
  }

  function setAction(i: number, value: string) {
    setActions((prev) => prev.map((a, idx) => (idx === i ? value : a)))
  }

  function reset() {
    setName('')
    setContact('')
    setChannel('text')
    setDomain('')
    setNotes('')
    setActions([''])
    setSelectedQuests([])
    setRoleKey('')
    setMessage('')
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await createManualLead({
        campaignRef,
        name: name.trim(),
        contact: contact.trim() || undefined,
        channel,
        domain: domain || undefined,
        notes: notes.trim() || undefined,
        actions: actions.map((a) => a.trim()).filter(Boolean),
        starterQuestIds: selectedQuests,
        roleKey: roleKey.trim() || undefined,
        message: message.trim() || undefined,
      })
      if (res.ok) {
        setResult({ inviteUrl: res.inviteUrl })
        reset()
      } else {
        setError(res.error)
      }
    })
  }

  async function copyLink() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — the link is visible for manual copy */
    }
  }

  if (!open) {
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white"
          style={{ background: PURPLE }}
        >
          + Forge a lead
        </button>
        {result && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4">
            <p className="text-[13px] font-semibold text-emerald-300">Lead forged — share this link:</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="break-all rounded bg-black/40 px-2 py-1 text-[12px] text-[#f4f2ec]">
                {result.inviteUrl}
              </code>
              <button
                onClick={copyLink}
                className="rounded-lg border border-white/15 px-3 py-1 text-[12px] font-semibold text-[#f4f2ec]"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] p-5" style={{ background: '#121210' }}>
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-bold text-[#f4f2ec]">Forge a lead</h2>
        <button onClick={() => setOpen(false)} className="text-[12px] text-[#a09e98]">
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Name *</span>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Who is this?" />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Contact</span>
          <input
            className={inputCls}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="phone / email / @handle"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Channel</span>
          <select className={inputCls} value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Allyship domain</span>
          <select className={inputCls} value={domain} onChange={(e) => setDomain(e.target.value)}>
            <option value="">— pick a domain —</option>
            {domains.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-1">
        <span className={labelCls}>Actions they should take</span>
        {actions.map((a, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={inputCls}
              value={a}
              onChange={(e) => setAction(i, e.target.value)}
              placeholder={`Action ${i + 1} — e.g. "DM three friends about the launch"`}
            />
            {actions.length > 1 && (
              <button
                onClick={() => setActions((prev) => prev.filter((_, idx) => idx !== i))}
                className="rounded-lg border border-white/15 px-2 text-[12px] text-[#a09e98]"
                aria-label="Remove action"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => setActions((prev) => [...prev, ''])}
          className="mt-1 self-start text-[12px] font-semibold"
          style={{ color: PURPLE }}
        >
          + Add action
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className={labelCls}>Starter quests {domain && '(matching domain first)'}</span>
        <div className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-2">
          {orderedQuests.length === 0 && (
            <p className="px-1 py-2 text-[12px] text-[#6b6862]">
              No quests in the pool yet (looking for CustomBars of type onboarding/quest with a domain).
            </p>
          )}
          {orderedQuests.map((q) => {
            const checked = selectedQuests.includes(q.id)
            return (
              <label
                key={q.id}
                className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-white/[0.04]"
              >
                <input type="checkbox" checked={checked} onChange={() => toggleQuest(q.id)} className="mt-1" />
                <span className="text-[#e6e4de]">
                  {q.title}
                  {q.domain && <span className="ml-2 text-[11px] text-[#6b6862]">{q.domain}</span>}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Campaign role (optional)</span>
          <input
            className={inputCls}
            value={roleKey}
            onChange={(e) => setRoleKey(e.target.value)}
            placeholder="e.g. connector"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Owner notes (private)</span>
          <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="context for you" />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-1">
        <span className={labelCls}>Personal invite message</span>
        <textarea
          className={`${inputCls} min-h-[70px]`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="A note that greets them when they open the link."
        />
      </label>

      {error && <p className="mt-3 text-[13px] text-red-400">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={submit}
          disabled={pending || name.trim().length === 0}
          className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
          style={{ background: PURPLE }}
        >
          {pending ? 'Forging…' : 'Forge lead & get link'}
        </button>
      </div>
    </div>
  )
}
