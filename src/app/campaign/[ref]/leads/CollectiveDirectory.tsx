'use client'

/**
 * CollectiveDirectory — published leads other stewards can adopt (decision B: adopt
 * = clone into your own roster). Spec: campaign-lead-forge Phase 6.
 */
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { adoptCollectiveLead, type CollectiveLeadRow } from '@/actions/campaign-leads'
import { getDomainLabel } from '@/lib/allyship-domains'

const PURPLE = '#8b5cf6'

export function CollectiveDirectory({
  leads,
  basePath,
  campaignRef,
}: {
  leads: CollectiveLeadRow[]
  basePath: string
  campaignRef: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function adopt(id: string) {
    setErr(null)
    setBusyId(id)
    startTransition(async () => {
      const res = await adoptCollectiveLead(id)
      setBusyId(null)
      if (res.ok) router.push(`${basePath}/${res.leadId}`)
      else setErr(res.error)
    })
  }

  return (
    <main
      className="min-h-screen px-4 pb-20 pt-8 sm:px-6"
      style={{ background: 'radial-gradient(120% 50% at 50% -6%, #141626 0%, #0a0908 46%)' }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase" style={{ letterSpacing: '.28em', color: '#9aa2e8', fontFamily: 'var(--bars-font-mono)' }}>
              ◇ Collective · {campaignRef}
            </span>
            <Link href={basePath} className="text-[13px] text-[#a09e98]">‹ Your list</Link>
          </div>
          <h1 className="text-[26px] font-bold text-[#f4f2ec] sm:text-[30px]">People the community is inviting</h1>
          <p className="max-w-2xl text-[13.5px] text-[#a09e98]">
            Leads other stewards published. Adopt one to add a copy to your list — you set your own
            goals and quests; their private notes never travel.
          </p>
        </header>

        {err && <p className="text-[13px] text-red-400">{err}</p>}

        {leads.length === 0 ? (
          <p className="rounded-xl border border-white/[0.07] p-6 text-center text-[13px] text-[#6b6862]">
            Nothing in the collective yet. Publish a lead from its workspace to share it here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="flex items-center justify-between gap-3 rounded-2xl border p-4"
                style={{ background: '#121210', borderColor: 'rgba(111,120,207,0.28)' }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-full text-[14px] font-bold" style={{ background: '#6f78cf', color: '#0d0f1c' }}>
                    {(lead.name?.trim()?.[0] ?? '◇').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold text-[#f4f2ec]">{lead.name || 'Unnamed lead'}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[12px] text-[#a09e98]">
                      {lead.domain && <span>{getDomainLabel(lead.domain)}</span>}
                      {lead.superpower && <span>⚡ {lead.superpower}</span>}
                      <span>published by {lead.forgedByName ?? 'a steward'}</span>
                    </div>
                  </div>
                </div>
                {lead.mine ? (
                  <span className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] font-semibold text-[#a09e98]">Yours</span>
                ) : (
                  <button
                    onClick={() => adopt(lead.id)}
                    disabled={pending && busyId === lead.id}
                    className="flex-none rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
                    style={{ background: PURPLE }}
                  >
                    {pending && busyId === lead.id ? 'Adopting…' : 'Adopt to my campaign'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
