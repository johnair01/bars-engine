'use client'

import {
  listAgentProposals,
  approveAgentProposal,
  rejectAgentProposal,
} from '@/actions/agent-content-proposal'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'

type Proposal = Awaited<ReturnType<typeof listAgentProposals>>[number]

/**
 * @page /admin/agent-proposals
 * @entity NPC
 * @description Review and approve/reject NPC-generated content proposals for market publication
 * @permissions admin
 * @relationships DERIVED_FROM (proposals created by NPCs with nation/archetype context)
 * @dimensions WHO:npcCreator+admin, WHAT:BAR, PERSONAL_THROUGHPUT:clean-up
 * @example /admin/agent-proposals
 * @agentDiscoverable false
 */
export default function AgentProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    startTransition(async () => {
      const list = await listAgentProposals()
      setProposals(list)
    })
  }, [])

  const handleApprove = async (barId: string) => {
    const result = await approveAgentProposal(barId)
    if (result.success) {
      setProposals((prev) => prev.filter((p) => p.id !== barId))
    }
  }

  const handleReject = async (barId: string) => {
    const result = await rejectAgentProposal(barId)
    if (result.success) {
      setProposals((prev) => prev.filter((p) => p.id !== barId))
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/admin"
          className="text-xs text-zinc-500 hover:text-white transition-colors"
        >
          ← Back to Admin Control
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Agent Proposals</h1>
        <p className="text-zinc-400">
          NPC content proposals. Approve to publish to market; reject to archive.
        </p>
      </header>

      {isPending && proposals.length === 0 ? (
        <div className="text-zinc-500 animate-pulse">Loading...</div>
      ) : proposals.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No agent proposals pending. Run{' '}
          <code className="text-zinc-400">npm run propose:agent-content</code> to
          seed.
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div
              key={p.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-white">{p.title}</h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Proposed by {p.creator?.name ?? 'Unknown'} (simulated)
                    {p.creator?.nation?.name && ` • ${p.creator.nation.name}`}
                    {p.creator?.archetype?.name &&
                      ` • ${p.creator.archetype.name}`}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    disabled={isPending}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 text-sm font-medium rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-zinc-300 font-sans text-sm">
                  {p.description}
                </pre>
              </div>
              <p className="text-xs text-zinc-500">
                Bar ID: {p.id} • Move: {p.moveType ?? '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
