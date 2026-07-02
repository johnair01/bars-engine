'use client'

/**
 * LeadBoard — the owner's follow-up queue: every lead (manual + automated) with a
 * shared status machine. Spec: .specify/specs/campaign-lead-forge/spec.md
 */
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { transitionLead } from '@/actions/campaign-leads'
import {
  LEAD_STATUSES,
  LEAD_STATUS_META,
  LEAD_TRANSITIONS,
  type CampaignLeadRow,
  type LeadStatus,
} from '@/lib/campaign-leads/types'
import { getDomainLabel } from '@/lib/allyship-domains'

type Filter = 'all' | LeadStatus

export function LeadBoard({
  leads,
  questTitleById,
}: {
  leads: CampaignLeadRow[]
  questTitleById: Record<string, string>
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length }
    for (const s of LEAD_STATUSES) c[s] = 0
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1
    return c
  }, [leads])

  const visible = useMemo(
    () => (filter === 'all' ? leads : leads.filter((l) => l.status === filter)),
    [leads, filter],
  )

  function move(lead: CampaignLeadRow, to: LeadStatus) {
    setError(null)
    setBusyId(lead.id)
    startTransition(async () => {
      const res = await transitionLead(lead.id, to)
      setBusyId(null)
      if (res.ok) router.refresh()
      else setError(res.error)
    })
  }

  const chips: Filter[] = ['all', ...LEAD_STATUSES]

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const active = filter === c
          const label = c === 'all' ? 'All' : LEAD_STATUS_META[c].label
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="rounded-full border px-3 py-1 text-[12px] font-semibold"
              style={{
                borderColor: active ? '#8b5cf6' : 'rgba(255,255,255,0.12)',
                background: active ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: active ? '#c4b5fd' : '#a09e98',
              }}
            >
              {label} <span className="opacity-60">{counts[c] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-[13px] text-red-400">{error}</p>}

      {visible.length === 0 ? (
        <p className="rounded-xl border border-white/[0.07] p-6 text-center text-[13px] text-[#6b6862]">
          No leads {filter === 'all' ? 'yet' : `in “${filter}”`}. Forge one above, or share the
          onboarding funnel link.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((lead) => {
            const meta = LEAD_STATUS_META[lead.status]
            const nextStates = LEAD_TRANSITIONS[lead.status]
            const questTitles = lead.starterQuestIds.map((id) => questTitleById[id] ?? id)
            return (
              <li
                key={lead.id}
                className="rounded-2xl border border-white/[0.07] p-4"
                style={{ background: '#121210' }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-bold text-[#f4f2ec]">
                        {lead.name || (lead.source === 'automated' ? 'Self-created player' : 'Unnamed lead')}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{ background: `${meta.color}22`, color: meta.color }}
                      >
                        {meta.label}
                      </span>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-[#a09e98]">
                        {lead.source}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-[#a09e98]">
                      {lead.contact && <span>{lead.contact}</span>}
                      {lead.domain && <span>{getDomainLabel(lead.domain)}</span>}
                      {lead.superpower && <span>⚡ {lead.superpower}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nextStates.map((to) => (
                      <button
                        key={to}
                        onClick={() => move(lead, to)}
                        disabled={pending && busyId === lead.id}
                        className="rounded-lg border px-2.5 py-1 text-[11px] font-semibold disabled:opacity-50"
                        style={{ borderColor: `${LEAD_STATUS_META[to].color}55`, color: LEAD_STATUS_META[to].color }}
                      >
                        → {LEAD_STATUS_META[to].label}
                      </button>
                    ))}
                  </div>
                </div>

                {(lead.actions.length > 0 || questTitles.length > 0 || lead.notes || lead.mythsSeen.length > 0) && (
                  <div className="mt-3 grid grid-cols-1 gap-3 border-t border-white/[0.05] pt-3 sm:grid-cols-2">
                    {lead.actions.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6862]">Actions</p>
                        <ul className="mt-1 list-disc pl-4 text-[12px] text-[#d6d4ce]">
                          {lead.actions.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {questTitles.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6862]">
                          Starter quests
                        </p>
                        <ul className="mt-1 list-disc pl-4 text-[12px] text-[#d6d4ce]">
                          {questTitles.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {lead.mythsSeen.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6862]">Myths worked</p>
                        <p className="mt-1 text-[12px] text-[#d6d4ce]">{lead.mythsSeen.join(', ')}</p>
                      </div>
                    )}
                    {lead.notes && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6b6862]">Notes</p>
                        <p className="mt-1 text-[12px] text-[#d6d4ce]">{lead.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
