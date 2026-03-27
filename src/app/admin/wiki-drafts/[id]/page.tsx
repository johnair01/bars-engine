/**
 * @page /admin/wiki-drafts/:id
 * @entity WIKI
 * @description Admin draft review page with approve/reject actions
 * @permissions admin
 * @params id:string (path, required) - Draft identifier
 * @relationships WIKI (draft review)
 * @energyCost 0 (admin action)
 * @dimensions WHO:admin, WHAT:draft approval, WHERE:admin panel, ENERGY:content moderation
 * @example /admin/wiki-drafts/draft_123
 * @agentDiscoverable false
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import type { WikiDraft, EntityType } from '@/lib/wiki/draft-generator';
import { DraftReviewActions } from '@/components/admin/DraftReviewActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WikiDraftReviewPage({ params }: PageProps) {
  const { id } = await params;

  const draftRecord = await db.wikiDraft.findUnique({
    where: { id },
  });

  if (!draftRecord) {
    notFound();
  }

  const draft: WikiDraft = {
    id: draftRecord.id,
    artifactId: draftRecord.artifactId,
    artifactType: draftRecord.artifactType as EntityType,
    title: draftRecord.title,
    summary: draftRecord.summary,
    provenanceExplanation: draftRecord.provenanceExplanation,
    relationshipDocumentation: draftRecord.relationshipDocumentation,
    usageExamples: JSON.parse(draftRecord.usageExamples),
    metadata: JSON.parse(draftRecord.metadata),
    status: draftRecord.status as 'pending' | 'approved' | 'rejected',
    reviewNotes: draftRecord.reviewNotes || undefined,
    reviewedBy: draftRecord.reviewedBy || undefined,
    reviewedAt: draftRecord.reviewedAt || undefined,
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="text-xs text-zinc-500">
          <Link href="/admin" className="hover:text-zinc-400">
            Admin
          </Link>
          {' / '}
          <Link href="/admin/wiki-drafts" className="hover:text-zinc-400">
            Wiki Drafts
          </Link>
          {' / '}
          <span className="text-zinc-400">{draft.title}</span>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded-lg bg-purple-900/30 border border-purple-600 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  {draft.artifactType}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                  draft.status === 'pending'
                    ? 'bg-yellow-900/30 border border-yellow-600 text-yellow-300'
                    : draft.status === 'approved'
                    ? 'bg-green-900/30 border border-green-600 text-green-300'
                    : 'bg-red-900/30 border border-red-600 text-red-300'
                }`}>
                  {draft.status}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                {draft.title}
              </h1>
              <code className="text-xs text-zinc-500 font-mono">
                Artifact ID: {draft.artifactId}
              </code>
            </div>

            <Link
              href={`/wiki/artifacts/${draft.artifactId}?type=${draft.artifactType}`}
              target="_blank"
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-sm transition"
            >
              View Artifact →
            </Link>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Generated</div>
              <div className="text-white mt-1">
                {new Date(draft.metadata.generatedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Model</div>
              <div className="text-white mt-1">{draft.metadata.modelUsed}</div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Lineage Depth</div>
              <div className="text-white mt-1">{draft.metadata.lineageDepth}</div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Relationships</div>
              <div className="text-white mt-1">{draft.metadata.relationshipCount}</div>
            </div>
          </div>
        </div>

        {/* Review Actions (if pending) */}
        {draft.status === 'pending' && (
          <DraftReviewActions draftId={draft.id} />
        )}

        {/* Review History (if reviewed) */}
        {draft.status !== 'pending' && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
              Review History
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Reviewed By:</span>
                <span className="text-white">{draft.reviewedBy || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Reviewed At:</span>
                <span className="text-white">
                  {draft.reviewedAt
                    ? new Date(draft.reviewedAt).toLocaleString()
                    : 'N/A'}
                </span>
              </div>
              {draft.reviewNotes && (
                <div className="pt-2 border-t border-zinc-800">
                  <div className="text-zinc-500 mb-1">Review Notes:</div>
                  <div className="text-white">{draft.reviewNotes}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Draft Content */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
              Summary
            </h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-zinc-300 whitespace-pre-wrap">{draft.summary}</p>
            </div>
          </div>

          {/* Provenance Explanation */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
              Provenance
            </h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <p className="text-zinc-300 whitespace-pre-wrap">
                {draft.provenanceExplanation}
              </p>
            </div>
          </div>

          {/* Relationships */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
              Relationships
            </h2>
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-zinc-300 whitespace-pre-wrap">
                {draft.relationshipDocumentation}
              </div>
            </div>
          </div>

          {/* Usage Examples */}
          {draft.usageExamples.length > 0 && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-4">
                Usage Examples
              </h2>
              <ul className="space-y-2">
                {draft.usageExamples.map((example, i) => (
                  <li key={i} className="text-sm text-zinc-300 pl-4 border-l-2 border-purple-600">
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/admin/wiki-drafts"
            className="flex-1 py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold rounded-xl text-center transition"
          >
            ← Back to Drafts
          </Link>
          {draft.status === 'pending' && (
            <Link
              href={`/admin/wiki-drafts/${draft.id}/edit`}
              className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-center transition"
            >
              Edit Draft
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
