'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseSourceDocument, analyzeSourceDocument } from '@/actions/source-ingestion'
import { SOURCE_ANALYSIS_PROFILES } from '@/lib/source-genre-profiles'

export function SourceDocumentActions({
  documentId,
  status,
  hasFile,
}: {
  documentId: string
  status: string
  hasFile: boolean
}) {
  const router = useRouter()
  const [parsePending, setParsePending] = useState(false)
  const [analyzePending, setAnalyzePending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleParse() {
    setError(null)
    setParsePending(true)
    try {
      const result = await parseSourceDocument(documentId)
      if (result.error) setError(result.error)
      router.refresh()
    } finally {
      setParsePending(false)
    }
  }

  async function handleAnalyze() {
    setError(null)
    setAnalyzePending(true)
    try {
      const form = document.getElementById('profile-form') as HTMLFormElement
      const formData = form ? new FormData(form) : null
      const profileId = (formData?.get('profileId') as string) || undefined
      const result = await analyzeSourceDocument(documentId, profileId as 'NONFICTION' | 'PHILOSOPHY' | 'FICTION' | 'MEMOIR' | 'PRACTICAL' | 'CONTEMPLATIVE')
      if (result.error) setError(result.error)
      router.refresh()
    } finally {
      setAnalyzePending(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}
      <div className="flex flex-wrap gap-4 items-center">
        <button
          onClick={handleParse}
          disabled={!hasFile || parsePending || status === 'PARSED' || status === 'ANALYZED'}
          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
        >
          {parsePending ? 'Parsing' : 'Parse'}
        </button>
        {(status === 'PARSED' || status === 'ANALYZED') && (
          <>
            <form id="profile-form" className="flex items-center gap-2">
              <label className="text-sm text-zinc-500">Profile:</label>
              <select name="profileId" className="bg-black border border-zinc-700 rounded px-2 py-1 text-sm text-white">
                {SOURCE_ANALYSIS_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </form>
            <button
              onClick={handleAnalyze}
              disabled={analyzePending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
            >
              {analyzePending ? 'Analyzing' : 'Analyze Excerpts'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
