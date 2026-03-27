'use client'

import {
  getQuestProposal,
  reviewQuestProposal,
  publishProposal,
} from '@/actions/quest-proposals'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'

type Proposal = Awaited<ReturnType<typeof getQuestProposal>>

/**
 * @page /admin/quest-proposals/:proposalId
 * @entity QUEST
 * @description Quest proposal detail with edit, review (approve/reject/defer), and publish actions
 * @permissions admin
 * @params proposalId:string (path, required)
 * @relationships DERIVED_FROM (BAR source)
 * @dimensions WHO:admin, WHAT:QUEST, PERSONAL_THROUGHPUT:clean-up
 * @example /admin/quest-proposals/prop_123
 * @agentDiscoverable false
 */
export default function QuestProposalDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [proposal, setProposal] = useState<Proposal>(null)
  const [isPending, startTransition] = useTransition()
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const id = params.id

  useEffect(() => {
    if (!id) return
    startTransition(async () => {
      const p = await getQuestProposal(id)
      setProposal(p)
      if (p) {
        setEditTitle(p.title)
        setEditDescription(p.description)
      }
    })
  }, [id])

  const handleReview = async (action: 'approve' | 'reject' | 'defer') => {
    setMessage(null)
    try {
      await reviewQuestProposal(id, {
        action,
        editedFields:
          editTitle !== proposal?.title || editDescription !== proposal?.description
            ? { title: editTitle, description: editDescription }
            : undefined,
      })
      setMessage(`Proposal ${action}d`)
      const p = await getQuestProposal(id)
      setProposal(p)
      if (p) {
        setEditTitle(p.title)
        setEditDescription(p.description)
      }
    } catch (e) {
      setMessage(`Error: ${e instanceof Error ? e.message : 'Unknown'}`)
    }
  }

  const handlePublish = async () => {
    setMessage(null)
    const result = await publishProposal(id)
    if (result.success) {
      setMessage(`Published quest ${result.questId}`)
      const p = await getQuestProposal(id)
      setProposal(p)
    } else {
      setMessage(`Error: ${result.reason}`)
    }
  }

  if (!proposal) {
    return (
      <div className="p-8 text-zinc-500">
        {isPending ? 'Loading...' : 'Proposal not found'}
      </div>
    )
  }

  let emotionalAlchemy: { status?: string; moveId?: string; moveName?: string; prompt?: string } = {}
  try {
    emotionalAlchemy = JSON.parse(proposal.emotionalAlchemy) as typeof emotionalAlchemy
  } catch {
    // ignore
  }

  const canPublish = proposal.reviewStatus === 'approved' && !proposal.publishedQuestId

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <Link
            href="/admin/quest-proposals"
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            ← Back to Proposals
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Quest Proposal</h1>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full ${
            proposal.reviewStatus === 'pending'
              ? 'bg-amber-900/50 text-amber-300'
              : proposal.reviewStatus === 'approved'
                ? 'bg-emerald-900/50 text-emerald-300'
                : proposal.reviewStatus === 'rejected'
                  ? 'bg-red-900/50 text-red-300'
                  : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {proposal.reviewStatus}
        </span>
      </header>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.startsWith('Error') ? 'bg-red-900/30 text-red-300' : 'bg-emerald-900/30 text-emerald-300'
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <label className="text-sm font-bold text-zinc-400">Title</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full mt-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm font-bold text-zinc-400">Description</label>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="w-full mt-1 bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white h-32"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-500">Domain</span>
            <p className="text-white">{proposal.domain ?? '—'}</p>
          </div>
          <div>
            <span className="text-zinc-500">Quest Type</span>
            <p className="text-white">{proposal.questType ?? '—'}</p>
          </div>
          <div>
            <span className="text-zinc-500">Confidence</span>
            <p className="text-white">{(proposal.confidenceScore * 100).toFixed(0)}%</p>
          </div>
          <div>
            <span className="text-zinc-500">Source BAR</span>
            <p className="text-white font-mono text-xs truncate">{proposal.barId}</p>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <h3 className="text-sm font-bold text-zinc-400 mb-2">Emotional Alchemy</h3>
          <div className="text-sm space-y-1">
            <p>
              Status: <span className={emotionalAlchemy.status === 'resolved' ? 'text-emerald-400' : 'text-amber-400'}>
                {emotionalAlchemy.status ?? 'unknown'}
              </span>
            </p>
            {emotionalAlchemy.moveName && <p>Move: {emotionalAlchemy.moveName}</p>}
            {emotionalAlchemy.prompt && <p className="text-zinc-500">{emotionalAlchemy.prompt}</p>}
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-4 flex flex-wrap gap-2">
          {proposal.reviewStatus === 'pending' && (
            <>
              <button
                onClick={() => handleReview('approve')}
                disabled={isPending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => handleReview('defer')}
                disabled={isPending}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium"
              >
                Defer
              </button>
              <button
                onClick={() => handleReview('reject')}
                disabled={isPending}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-300 rounded-lg font-medium"
              >
                Reject
              </button>
            </>
          )}
          {canPublish && (
            <button
              onClick={handlePublish}
              disabled={isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium"
            >
              Publish to Campaign
            </button>
          )}
          {proposal.publishedQuestId && (
            <Link
              href={`/admin/quests/${proposal.publishedQuestId}`}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium inline-block"
            >
              View Published Quest →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
