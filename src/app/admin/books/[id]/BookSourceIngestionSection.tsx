'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  promoteBookToSourceIngestionPipeline,
  getSourceDocumentForBook,
  analyzeSourceDocument,
  listBarCandidates,
  approveBarCandidate,
  rejectBarCandidate,
  mintBarFromBarCandidate,
  saveBarCandidateAsPrompt,
  saveBarCandidateAsLore,
} from '@/actions/source-ingestion'
import { SOURCE_ANALYSIS_PROFILES } from '@/lib/source-genre-profiles'

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

export function BookSourceIngestionSection({
  bookId,
  hasExtractedText,
}: {
  bookId: string
  hasExtractedText: boolean
}) {
  const router = useRouter()
  const [sourceDoc, setSourceDoc] = useState<{
    id: string
    status: string
    excerptCount: number
    candidateCount: number
    promptCount: number
    seedCount: number
  } | null>(null)
  const [promoting, setPromoting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [profileId, setProfileId] = useState('NONFICTION')
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const loadSourceDoc = async () => {
    const r = await getSourceDocumentForBook(bookId)
    if (r.success && r.sourceDocument) {
      setSourceDoc({
        id: r.sourceDocument.id,
        status: r.sourceDocument.status,
        excerptCount: r.sourceDocument.excerpts?.length ?? r.sourceDocument._count?.excerpts ?? 0,
        candidateCount: r.candidateCount ?? 0,
        promptCount: r.promptCount ?? 0,
        seedCount: r.seedCount ?? 0,
      })
      if (r.sourceDocument.id) {
        const cr = await listBarCandidates(r.sourceDocument.id)
        if (cr.success && cr.candidates) setCandidates(cr.candidates as Candidate[])
      }
    } else {
      setSourceDoc(null)
    }
  }

  useEffect(() => {
    if (hasExtractedText) loadSourceDoc()
  }, [bookId, hasExtractedText])

  const handlePromote = async () => {
    setError(null)
    setPromoting(true)
    try {
      const r = await promoteBookToSourceIngestionPipeline(
        bookId,
        profileId as 'NONFICTION' | 'PHILOSOPHY' | 'FICTION' | 'MEMOIR' | 'PRACTICAL' | 'CONTEMPLATIVE'
      )
      if ('error' in r) setError(r.error)
      else await loadSourceDoc()
      router.refresh()
    } finally {
      setPromoting(false)
    }
  }

  const handleAnalyze = async () => {
    if (!sourceDoc) return
    setError(null)
    setAnalyzing(true)
    try {
      const r = await analyzeSourceDocument(
        sourceDoc.id,
        profileId as 'NONFICTION' | 'PHILOSOPHY' | 'FICTION' | 'MEMOIR' | 'PRACTICAL' | 'CONTEMPLATIVE'
      )
      if ('error' in r) setError(r.error ?? null)
      else await loadSourceDoc()
      router.refresh()
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAction = async (
    id: string,
    fn: () => Promise<{ success?: boolean; error?: string }>
  ) => {
    setActioningId(id)
    try {
      await fn()
      await loadSourceDoc()
      router.refresh()
    } finally {
      setActioningId(null)
    }
  }

  if (!hasExtractedText) return null

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">
        Source Ingestion (BAR Candidate Pipeline)
      </h2>
      <p className="text-xs text-zinc-500 mb-3">
        Promote to the candidate pipeline for curated BARs, extension prompts, and quest seeds. Not every excerpt becomes a BAR.
      </p>

      {error && (
        <div className="mb-3 bg-red-900/20 border border-red-800 rounded p-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!sourceDoc ? (
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className="rounded border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm px-2 py-1"
          >
            {SOURCE_ANALYSIS_PROFILES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            onClick={handlePromote}
            disabled={promoting}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition disabled:opacity-50"
          >
            {promoting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                Promoting...
              </>
            ) : (
              'Promote to Source Ingestion'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-zinc-500">
              {sourceDoc.excerptCount} excerpts · {sourceDoc.candidateCount} candidates · {sourceDoc.promptCount} prompts · {sourceDoc.seedCount} seeds
            </span>
            <select
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="rounded border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm px-2 py-1"
            >
              {SOURCE_ANALYSIS_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  Analyzing...
                </>
              ) : (
                'Analyze Excerpts'
              )}
            </button>
          </div>

          {candidates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-300">Candidates</h3>
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-white text-sm">{c.titleDraft}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {c.candidateType} · {c.metabolizabilityTier}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{c.bodyDraft}</p>
                  <div className="flex gap-2 text-xs text-zinc-600">
                    {c.chargeScore != null && <span>charge: {c.chargeScore.toFixed(2)}</span>}
                    {c.actionabilityScore != null && <span>action: {c.actionabilityScore.toFixed(2)}</span>}
                    <span>disposition: {c.recommendedDisposition}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="text-xs text-amber-400 hover:text-amber-300"
                  >
                    {expandedId === c.id ? 'Hide excerpt' : 'Show excerpt'}
                  </button>
                  {expandedId === c.id && (
                    <div className="bg-black/50 rounded p-2 text-xs text-zinc-400 max-h-32 overflow-y-auto">
                      {c.sourceExcerpt.text.slice(0, 600)}
                      {c.sourceExcerpt.text.length > 600 && '…'}
                    </div>
                  )}
                  {c.reviewStatus === 'PENDING' && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      <button
                        onClick={() => handleAction(c.id, () => approveBarCandidate(c.id))}
                        disabled={actioningId === c.id}
                        className="px-2 py-0.5 text-xs bg-green-900/50 text-green-300 rounded hover:bg-green-900/70 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(c.id, () => mintBarFromBarCandidate(c.id))}
                        disabled={actioningId === c.id}
                        className="px-2 py-0.5 text-xs bg-purple-900/50 text-purple-300 rounded hover:bg-purple-900/70 disabled:opacity-50"
                      >
                        Mint BAR
                      </button>
                      <button
                        onClick={() => handleAction(c.id, () => saveBarCandidateAsPrompt(c.id))}
                        disabled={actioningId === c.id}
                        className="px-2 py-0.5 text-xs bg-blue-900/50 text-blue-300 rounded hover:bg-blue-900/70 disabled:opacity-50"
                      >
                        Save as Prompt
                      </button>
                      <button
                        onClick={() => handleAction(c.id, () => saveBarCandidateAsLore(c.id))}
                        disabled={actioningId === c.id}
                        className="px-2 py-0.5 text-xs bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 disabled:opacity-50"
                      >
                        Save as Lore
                      </button>
                      <button
                        onClick={() => handleAction(c.id, () => rejectBarCandidate(c.id))}
                        disabled={actioningId === c.id}
                        className="px-2 py-0.5 text-xs bg-red-900/50 text-red-300 rounded hover:bg-red-900/70 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
