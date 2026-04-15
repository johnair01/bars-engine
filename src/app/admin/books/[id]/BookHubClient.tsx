'use client'

import { extractBookText, extractBookToc, deleteBook } from '@/actions/books'
import { analyzeBook, analyzeBookMore } from '@/actions/book-analyze'
import { createThreadFromBook } from '@/actions/book-to-thread'
import { generateBookSummaryAndLeverage } from '@/actions/book-summary'
import { createBookCampaign } from '@/actions/book-campaign'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CampaignRef = { value: string; label: string }

export function BookHubClient({
  bookId,
  bookTitle,
  bookStatus,
  campaignRefs,
  defaultCampaignRef,
  hasMoreChunks,
}: {
  bookId: string
  bookTitle: string
  bookStatus: string
  campaignRefs: readonly CampaignRef[]
  defaultCampaignRef: string
  hasMoreChunks?: boolean
}) {
  const router = useRouter()
  const [campaignRef, setCampaignRef] = useState(defaultCampaignRef)
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [extractingTocId, setExtractingTocId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [analyzingMoreId, setAnalyzingMoreId] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [summaryGeneratingId, setSummaryGeneratingId] = useState<string | null>(null)
  const [campaignGeneratingId, setCampaignGeneratingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [result, setResult] = useState<{ msg: string; ok: boolean } | null>(null)

  const clearResult = () => setResult(null)

  const handleExtract = async () => {
    setExtractingId(bookId)
    clearResult()
    const r = await extractBookText(bookId)
    setExtractingId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else setResult({ msg: `Extracted: ${r.pageCount} pages, ${r.wordCount} words`, ok: true })
    router.refresh()
  }

  const handleExtractToc = async () => {
    setExtractingTocId(bookId)
    clearResult()
    const r = await extractBookToc(bookId)
    setExtractingTocId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else setResult({ msg: `TOC extracted: ${r.entryCount} entries`, ok: true })
    router.refresh()
  }

  const handleAnalyze = async () => {
    setAnalyzingId(bookId)
    clearResult()
    const r = await analyzeBook(bookId)
    setAnalyzingId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else if ('chunksTotal' in r) {
      const chunkMsg =
        r.chunksTotal != null && r.chunksTotal > r.chunkCount
          ? `${r.chunkCount} of ${r.chunksTotal} chunks`
          : `${r.chunkCount} chunks`
      setResult({ msg: `Analyzed: ${r.questsCreated} quests from ${chunkMsg}`, ok: true })
    }
    router.refresh()
  }

  const handleAnalyzeMore = async () => {
    setAnalyzingMoreId(bookId)
    clearResult()
    const r = await analyzeBookMore(bookId)
    setAnalyzingMoreId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else if ('chunksTotal' in r)
      setResult({
        msg: `Analyzed: ${r.questsCreated} quests from ${r.chunkCount} of ${r.chunksTotal} chunks`,
        ok: true,
      })
    router.refresh()
  }

  const handlePublish = async () => {
    setPublishingId(bookId)
    clearResult()
    const r = await createThreadFromBook(bookId)
    setPublishingId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else setResult({ msg: `Published: ${r.questCount} quests → thread`, ok: true })
    router.refresh()
  }

  const handleSummary = async () => {
    setSummaryGeneratingId(bookId)
    clearResult()
    const r = await generateBookSummaryAndLeverage(bookId, campaignRef)
    setSummaryGeneratingId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else setResult({ msg: 'Summary + leverage generated', ok: true })
    router.refresh()
  }

  const handleCampaign = async () => {
    setCampaignGeneratingId(bookId)
    clearResult()
    const r = await createBookCampaign(bookId, campaignRef)
    setCampaignGeneratingId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else setResult({ msg: `Campaign created. Play at /campaign?ref=${r.slug ?? ''}`, ok: true })
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm(`Remove "${bookTitle}"? This cannot be undone.`)) return
    setDeletingId(bookId)
    clearResult()
    const r = await deleteBook(bookId)
    setDeletingId(null)
    if (r.error) setResult({ msg: r.error, ok: false })
    else router.push('/admin/books')
  }

  const busy =
    extractingId ||
    extractingTocId ||
    analyzingId ||
    analyzingMoreId ||
    publishingId ||
    summaryGeneratingId ||
    campaignGeneratingId ||
    deletingId

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">Actions</h2>
      {result && (
        <p
          className={`text-sm mb-3 ${result.ok ? 'text-green-400' : 'text-red-400'}`}
        >
          {result.msg}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {bookStatus === 'draft' && (
          <button
            onClick={handleExtract}
            disabled={!!busy}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded-lg transition disabled:opacity-50"
          >
            {extractingId ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                Extracting...
              </>
            ) : (
              'Extract Text'
            )}
          </button>
        )}
        {(bookStatus === 'extracted' ||
          bookStatus === 'analyzed' ||
          bookStatus === 'published') && (
          <button
            onClick={handleExtractToc}
            disabled={!!busy}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition disabled:opacity-50"
          >
            {extractingTocId ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                Extracting...
              </>
            ) : (
              'Extract TOC'
            )}
          </button>
        )}
        {bookStatus === 'extracted' && (
          <button
            onClick={handleAnalyze}
            disabled={!!busy}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
          >
            {analyzingId ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                Analyzing...
              </>
            ) : (
              'Trigger Analysis'
            )}
          </button>
        )}
        {(bookStatus === 'analyzed' || bookStatus === 'published') && (
          <>
            <button
              onClick={handlePublish}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {publishingId ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  Publishing...
                </>
              ) : (
                bookStatus === 'published' ? 'Re-publish' : 'Publish'
              )}
            </button>
            {hasMoreChunks && (
              <button
                onClick={handleAnalyzeMore}
                disabled={!!busy}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {analyzingMoreId ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze More'
                )}
              </button>
            )}
          </>
        )}
        {(bookStatus === 'extracted' ||
          bookStatus === 'analyzed' ||
          bookStatus === 'published') && (
          <div className="flex items-center gap-2">
            <select
              value={campaignRef}
              onChange={(e) => setCampaignRef(e.target.value)}
              className="rounded border border-zinc-600 bg-zinc-800 text-zinc-200 text-sm px-2 py-1"
            >
              {campaignRefs.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSummary}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {summaryGeneratingId ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  Summary...
                </>
              ) : (
                'Summary'
              )}
            </button>
          </div>
        )}
        {bookStatus === 'published' && (
          <button
            onClick={handleCampaign}
            disabled={!!busy}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
          >
            {campaignGeneratingId ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                Campaign...
              </>
            ) : (
              'Generate Campaign'
            )}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={!!busy}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-red-900/50 text-zinc-400 hover:text-red-300 rounded-lg transition disabled:opacity-50"
        >
          {deletingId ? (
            <>
              <span className="w-4 h-4 border-2 border-zinc-500/30 border-t-zinc-400 rounded-full animate-spin shrink-0" />
              Removing...
            </>
          ) : (
            'Remove'
          )}
        </button>
      </div>
    </section>
  )
}
