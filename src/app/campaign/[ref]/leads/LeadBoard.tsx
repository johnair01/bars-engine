'use client'

/**
 * LeadBoard — the roster/follow-up queue. Rows link to each lead's workspace;
 * status + collective are encoded as pills. Spec: campaign-lead-forge Phase 6.
 */
import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  LEAD_STATUSES,
  LEAD_STATUS_META,
  type CampaignLeadRow,
  type LeadStatus,
} from '@/lib/campaign-leads/types'
import { getDomainLabel } from '@/lib/allyship-domains'

type Filter = 'all' | LeadStatus | 'collective'

export function LeadBoard({ leads, basePath }: { leads: CampaignLeadRow[]; basePath: string }) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length, collective: 0 }
    for (const s of LEAD_STATUSES) c[s] = 0
    for (const l of leads) {
      c[l.status] = (c[l.status] ?? 0) + 1
      if (l.collective) c.collective += 1
    }
    return c
  }, [leads])

  const visible = useMemo(() => {
    if (filter === 'all') return leads
    if (filter === 'collective') return leads.filter((l) => l.collective)
    return leads.filter((l) => l.status === filter)
  }, [leads, filter])

  const chips: Filter[] = ['all', ...LEAD_STATUSES, 'collective']

  function initial(l: CampaignLeadRow): string {
    return (l.name?.trim()?.[0] ?? '✦').toUpperCase()
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const active = filter === c
          const label = c === 'all' ? 'All' : c === 'collective' ? '◇ Collective' : LEAD_STATUS_META[c].label
          const accent = c === 'collective' ? '#6f78cf' : '#8b5cf6'
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className="rounded-full border px-3 py-1 text-[12px] font-semibold"
              style={{
                borderColor: active ? accent : 'rgba(255,255,255,0.12)',
                background: active ? `${accent}26` : 'transparent',
                color: active ? '#d7d2f5' : '#a09e98',
              }}
            >
              {label} <span className="opacity-60">{counts[c] ?? 0}</span>
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-white/[0.07] p-6 text-center text-[13px] text-[#6b6862]">
          {leads.length === 0
            ? 'No one on your list yet. Add the first person you want to bring in.'
            : `No leads in “${filter}”.`}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((lead) => {
            const meta = LEAD_STATUS_META[lead.status]
            return (
              <li key={lead.id}>
                <Link
                  href={`${basePath}/${lead.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border p-4 transition-colors hover:border-white/20"
                  style={{
                    background: '#121210',
                    borderColor: lead.collective ? 'rgba(111,120,207,0.35)' : 'rgba(255,255,255,0.07)',
                  }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-9 w-9 flex-none place-items-center rounded-full text-[14px] font-bold"
                      style={{ background: lead.source === 'automated' ? '#8b5cf6' : '#46b06f', color: '#12100b' }}
                    >
                      {lead.source === 'automated' ? '✦' : initial(lead)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[15px] font-bold text-[#f4f2ec]">
                          {lead.name || (lead.source === 'automated' ? 'Self-created player' : 'Unnamed lead')}
                        </span>
                        {lead.collective && (
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                            style={{ background: 'rgba(111,120,207,0.15)', color: '#9aa2e8' }}
                          >
                            ◇ Published
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-[#a09e98]">
                        {lead.domain && <span>{getDomainLabel(lead.domain)}</span>}
                        {lead.channel && <span>{lead.channel}</span>}
                        {lead.superpower && <span>⚡ {lead.superpower}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                      style={{ background: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[#6b6862]">›</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
