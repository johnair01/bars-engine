import { getSourceDocumentDetail } from '@/actions/source-ingestion'
import { SourceDocumentActions } from './SourceDocumentActions'
import { CandidateReviewList } from './CandidateReviewList'
import Link from 'next/link'

export const maxDuration = 120

export default async function SourceDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await getSourceDocumentDetail(id)

  if ('error' in result && result.error) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">{result.error}</p>
        <Link href="/admin/source-ingestion" className="text-zinc-500 hover:text-zinc-400 text-sm">
          Back to Source Ingestion
        </Link>
      </div>
    )
  }

  if (!result.document) {
    return (
      <div className="space-y-4">
        <p className="text-red-400">Not found</p>
        <Link href="/admin/source-ingestion" className="text-zinc-500 hover:text-zinc-400 text-sm">
          Back to Source Ingestion
        </Link>
      </div>
    )
  }

  const { document: sourceDoc, candidateCount, promptCount, seedCount } = result

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">{sourceDoc.title}</h1>
        {sourceDoc.author && <p className="text-zinc-500">{sourceDoc.author}</p>}
        <div className="flex gap-2 mt-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              sourceDoc.status === 'ANALYZED' ? 'bg-green-900/50 text-green-300' : sourceDoc.status === 'PARSED' ? 'bg-blue-900/50 text-blue-300' : sourceDoc.status === 'FAILED' ? 'bg-red-900/50 text-red-300' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {sourceDoc.status}
          </span>
          <span className="text-xs text-zinc-600">
            {sourceDoc.pageCount ? `${sourceDoc.pageCount} pages` : ''} · {sourceDoc.documentKind}
          </span>
        </div>
        <p className="text-sm text-zinc-600 mt-2">
          {candidateCount} candidates · {promptCount} prompts · {seedCount} quest seeds
        </p>
      </div>

      <SourceDocumentActions documentId={id} status={sourceDoc.status} hasFile={!!sourceDoc.fileUrl} />

      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Candidates</h2>
        <CandidateReviewList documentId={id} />
      </section>

      <p className="text-xs text-zinc-600">
        <Link href="/admin/source-ingestion" className="text-zinc-500 hover:text-zinc-400">
          Back to Source Ingestion
        </Link>
      </p>
    </div>
  )
}
