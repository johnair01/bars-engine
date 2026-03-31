'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  listBarCandidates,
  approveBarCandidate,
  rejectBarCandidate,
  mintBarFromBarCandidate,
  saveBarCandidateAsPrompt,
  saveBarCandidateAsLore,
} from '@/actions/source-ingestion'

type Candidate = {
  id: string
  candidateType: string
  titleDraft: string
  bodyDraft: string
  metabolizabilityTier: string
  recommendedDisposition: string
  reviewStatus: string
  chargeScore?: number | null
  actionabilityScore?: number | null
  sourceExcerpt: {
    id: string
    excerptIndex: number
    pageStart?: number | null
    pageEnd?: number | null
    chapterTitle?: string | null
    sectionTitle?: string | null
    text: string
  }
}

export function CandidateReviewList({ documentId }: { documentId: string }) {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  useEffect(() => {
    listBarCandidates(documentId).then((r) => {
      if (r.success && r.candidates) setCandidates(r.candidates as Candidate[])
      setLoading(false)
    })
  }, [documentId, router])

  async function handleAction(id: string, fn: () => Promise<{ success?: boolean; error?: string }>) {
    setActioningId(id)
    try {
      const result = await fn()
      if (result.error) console.error(result.error)
      router.refresh()
      listBarCandidates(documentId).then((r) => {
        if (r.success && r.candidates) setCandidates(r.candidates as Candidate[])
      })
    } finally {
      setActioningId(null)
    }
  }

  if (loading) return <p className="text-zinc-500 text-sm">Loading…</p>
  if (candidates.length === 0) return <p className="text-zinc-500 text-sm">No candidates yet. Parse and analyze the document.</p>

  return (
    <div className="space-y-4">
      {candidates.map((c) => (
        <div
          key={c.id}
          className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-3"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-white">{c.titleDraft}</h3>
            <span className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
              {c.candidateType} · {c.metabolizabilityTier}
            </span>
          </div>
          <p className="text-sm text-zinc-400 line-clamp-2">{c.bodyDraft}</p>
          <div className="flex gap-2 text-xs text-zinc-600">
            {c.chargeScore != null && <span>charge: {c.chargeScore.toFixed(2)}</span>}
            {c.actionabilityScore != null && <span>action: {c.actionabilityScore.toFixed(2)}</span>}
            <span>disposition: {c.recommendedDisposition}</span>
            <span>status: {c.reviewStatus}</span>
          </div>
          <div className="text-xs text-zinc-600">
            Excerpt {c.sourceExcerpt.excerptIndex}
            {c.sourceExcerpt.pageStart != null && ` · p.${c.sourceExcerpt.pageStart}`}
            {c.sourceExcerpt.sectionTitle && ` · ${c.sourceExcerpt.sectionTitle}`}
          </div>
          <button
            type="button"
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            {expandedId === c.id ? 'Hide excerpt' : 'Show excerpt'}
          </button>
          {expandedId === c.id && (
            <div className="bg-black/50 rounded p-3 text-sm text-zinc-400 max-h-40 overflow-y-auto">
              {c.sourceExcerpt.text.slice(0, 800)}
              {c.sourceExcerpt.text.length > 800 && '…'}
            </div>
          )}
          {c.reviewStatus === 'PENDING' && (
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleAction(c.id, () => approveBarCandidate(c.id))}
                disabled={actioningId === c.id}
                className="px-2 py-1 text-xs bg-green-900/50 text-green-300 rounded hover:bg-green-900/70 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(c.id, () => mintBarFromBarCandidate(c.id))}
                disabled={actioningId === c.id}
                className="px-2 py-1 text-xs bg-purple-900/50 text-purple-300 rounded hover:bg-purple-900/70 disabled:opacity-50"
              >
                Mint BAR
              </button>
              <button
                onClick={() => handleAction(c.id, () => saveBarCandidateAsPrompt(c.id))}
                disabled={actioningId === c.id}
                className="px-2 py-1 text-xs bg-blue-900/50 text-blue-300 rounded hover:bg-blue-900/70 disabled:opacity-50"
              >
                Save as Prompt
              </button>
              <button
                onClick={() => handleAction(c.id, () => saveBarCandidateAsLore(c.id))}
                disabled={actioningId === c.id}
                className="px-2 py-1 text-xs bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 disabled:opacity-50"
              >
                Save as Lore
              </button>
              <button
                onClick={() => handleAction(c.id, () => rejectBarCandidate(c.id))}
                disabled={actioningId === c.id}
                className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-900/70 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
