'use client'

import { listNpcConstitutions } from '@/actions/npc-constitution'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'

type Npc = Awaited<ReturnType<typeof listNpcConstitutions>>[number]

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-900/50 text-emerald-300',
  draft: 'bg-zinc-800 text-zinc-400',
  suspended: 'bg-amber-900/50 text-amber-300',
  archived: 'bg-red-900/50 text-red-400',
}

const TIER_LABELS: Record<number, string> = { 1: 'T1', 2: 'T2', 3: 'T3', 4: 'T4' }

export default function NpcsPage() {
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [tierFilter, setTierFilter] = useState('all')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const list = await listNpcConstitutions({
        status: statusFilter === 'all' ? undefined : statusFilter,
        tier: tierFilter === 'all' ? undefined : parseInt(tierFilter),
      })
      setNpcs(list)
    })
  }, [statusFilter, tierFilter])

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← Back to Admin
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-3xl font-bold text-white">NPC Constitutions</h1>
            <p className="text-zinc-400 mt-1">Regent oversight console — all constitutions governed by Regent Game Master.</p>
          </div>
          <Link
            href="/admin/npcs/new"
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-medium text-sm"
          >
            + New Constitution
          </Link>
        </div>
      </header>

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-zinc-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-zinc-400">Tier:</label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">All</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
            <option value="4">Tier 4</option>
          </select>
        </div>
        {isPending && <span className="text-xs text-zinc-500 italic">Loading…</span>}
      </div>

      <div className="grid gap-3">
        {npcs.map((npc) => (
          <Link key={npc.id} href={`/admin/npcs/${npc.id}`} className="block group">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 group-hover:border-purple-500/50 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                  {TIER_LABELS[npc.tier] ?? `T${npc.tier}`}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                      {npc.name}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[npc.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                      {npc.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 truncate">{npc.archetypalRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-600 shrink-0">
                <span>v{npc.constitutionVersion}</span>
                <span className="text-zinc-700">|</span>
                <span>{npc.currentLocation}</span>
                <span className="text-zinc-600 group-hover:text-purple-400">→</span>
              </div>
            </div>
          </Link>
        ))}
        {npcs.length === 0 && !isPending && (
          <div className="text-zinc-600 text-sm italic py-8 text-center">
            No NPC constitutions found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
