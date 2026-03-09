'use client'

import {
  listQuestProposals,
  generateProposalFromBar,
} from '@/actions/quest-proposals'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'

type Proposal = Awaited<ReturnType<typeof listQuestProposals>>[number]

export default function QuestProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [isPending, startTransition] = useTransition()
  const [generateBarId, setGenerateBarId] = useState('')
  const [generateResult, setGenerateResult] = useState<string | null>(null)

  useEffect(() => {
    startTransition(async () => {
      const list = await listQuestProposals({
        status: statusFilter === 'all' ? undefined : (statusFilter as 'pending' | 'approved' | 'rejected' | 'deferred'),
      })
      setProposals(list)
    })
  }, [statusFilter])

  const handleGenerate = async () => {
    if (!generateBarId.trim()) return
    setGenerateResult(null)
    const result = await generateProposalFromBar(generateBarId.trim())
    if (result.success) {
      setGenerateResult(`Created proposal ${result.proposalId}`)
      setGenerateBarId('')
      startTransition(async () => {
        const list = await listQuestProposals({ status: statusFilter === 'all' ? undefined : (statusFilter as 'pending' | 'approved' | 'rejected' | 'deferred') })
        setProposals(list)
      })
    } else {
      setGenerateResult(`Error: ${result.reason}`)
    }
  }

  const alchemyStatus = (p: Proposal) => {
    try {
      const ea = JSON.parse(p.emotionalAlchemy) as { status?: string }
      return ea?.status ?? 'unknown'
    } catch {
      return 'unknown'
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-xs text-zinc-500 hover:text-white transition-colors">
          ← Back to Admin Control
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Quest Proposals</h1>
        <p className="text-zinc-400">
          BAR → Quest Generation Engine. Review and publish proposals from player inspiration.
        </p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <h2 className="text-sm font-bold text-zinc-400 mb-2">Generate from BAR</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={generateBarId}
            onChange={(e) => setGenerateBarId(e.target.value)}
            placeholder="CustomBar ID (BAR)"
            className="flex-1 min-w-[200px] bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white font-mono text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={isPending || !generateBarId.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium"
          >
            Generate Proposal
          </button>
        </div>
        {generateResult && (
          <p className={`mt-2 text-sm ${generateResult.startsWith('Error') ? 'text-amber-400' : 'text-emerald-400'}`}>
            {generateResult}
          </p>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm text-zinc-400">Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="deferred">Deferred</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="grid gap-4">
        {proposals.map((p) => (
          <Link
            key={p.id}
            href={`/admin/quest-proposals/${p.id}`}
            className="block group"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-start gap-4 group-hover:border-purple-500/50 transition-all">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                    {p.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.reviewStatus === 'pending'
                        ? 'bg-amber-900/50 text-amber-300'
                        : p.reviewStatus === 'approved'
                          ? 'bg-emerald-900/50 text-emerald-300'
                          : p.reviewStatus === 'rejected'
                            ? 'bg-red-900/50 text-red-300'
                            : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {p.reviewStatus}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {p.questType ?? '—'}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{p.description}</p>
                <div className="flex gap-3 mt-2 text-xs text-zinc-600">
                  <span>BAR: {p.bar?.title?.slice(0, 30) ?? p.barId}…</span>
                  <span>Domain: {p.domain ?? '—'}</span>
                  <span>Alchemy: {alchemyStatus(p)}</span>
                  <span>Confidence: {(p.confidenceScore * 100).toFixed(0)}%</span>
                </div>
              </div>
              <span className="text-zinc-600 group-hover:text-purple-400">Review →</span>
            </div>
          </Link>
        ))}
        {proposals.length === 0 && !isPending && (
          <div className="text-zinc-600 text-sm italic py-8 text-center">
            No proposals found. Generate one from a BAR above.
          </div>
        )}
      </div>
    </div>
  )
}
