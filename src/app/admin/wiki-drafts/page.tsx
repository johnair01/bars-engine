/**
 * @page /admin/wiki-drafts
 * @entity WIKI
 * @description Admin page for reviewing AI-generated wiki drafts
 * @permissions admin
 * @searchParams status:string (optional) - Filter by status (pending, approved, rejected)
 * @relationships WIKI (draft management)
 * @energyCost 0 (read-only admin page)
 * @dimensions WHO:admin, WHAT:draft review, WHERE:admin panel, ENERGY:content moderation
 * @example /admin/wiki-drafts?status=pending
 * @agentDiscoverable false
 */

import Link from 'next/link';
import { getPendingDrafts } from '@/lib/wiki/draft-generator';

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function WikiDraftsAdminPage({ searchParams }: PageProps) {
  const { status } = await searchParams;

  // For now, only show pending drafts
  // TODO: Add filtering by status
  const drafts = await getPendingDrafts();

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Wiki Drafts</h1>
            <p className="mt-2 text-zinc-400">
              Review AI-generated wiki documentation drafts
            </p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-sm transition"
          >
            ← Back to Admin
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Pending Review
            </div>
            <div className="text-3xl font-bold text-yellow-400">{drafts.length}</div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Total Generated
            </div>
            <div className="text-3xl font-bold text-white">{drafts.length}</div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Approval Rate
            </div>
            <div className="text-3xl font-bold text-green-400">--</div>
          </div>
        </div>

        {/* Drafts List */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">
              Pending Drafts
            </h2>
            <div className="flex gap-2">
              <Link
                href="/admin/wiki-drafts?status=pending"
                className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Pending
              </Link>
              <Link
                href="/admin/wiki-drafts?status=approved"
                className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Approved
              </Link>
              <Link
                href="/admin/wiki-drafts?status=rejected"
                className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Rejected
              </Link>
            </div>
          </div>

          {drafts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-lg">No pending drafts</div>
              <div className="text-sm mt-2">
                Generate wiki drafts from artifact pages
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-4 space-y-3"
                >
                  {/* Draft Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-1 rounded bg-purple-900/30 border border-purple-600 text-purple-300 text-xs font-bold uppercase">
                          {draft.artifactType}
                        </span>
                        <code className="text-xs text-zinc-500 font-mono">
                          {draft.artifactId}
                        </code>
                      </div>
                      <h3 className="text-lg font-semibold text-white">
                        {draft.title}
                      </h3>
                      <div className="text-xs text-zinc-500 mt-1">
                        Generated {new Date(draft.metadata.generatedAt).toLocaleDateString()}
                        {' · '}
                        Model: {draft.metadata.modelUsed}
                        {' · '}
                        Depth: {draft.metadata.lineageDepth}
                        {' · '}
                        Relations: {draft.metadata.relationshipCount}
                      </div>
                    </div>

                    <Link
                      href={`/admin/wiki-drafts/${draft.id}`}
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition"
                    >
                      Review →
                    </Link>
                  </div>

                  {/* Draft Preview */}
                  <div className="border-t border-zinc-700 pt-3 space-y-2">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                        Summary
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-2">
                        {draft.summary}
                      </p>
                    </div>

                    {draft.usageExamples.length > 0 && (
                      <div>
                        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                          Usage Examples
                        </div>
                        <ul className="text-sm text-zinc-400 space-y-1">
                          {draft.usageExamples.slice(0, 2).map((example, i) => (
                            <li key={i} className="line-clamp-1">• {example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-sm text-zinc-400">
          <strong className="text-white">How it works:</strong> AI analyzes artifact metadata,
          lineage context, and relationships to generate comprehensive wiki documentation.
          Review and approve drafts to publish them to the wiki.
        </div>
      </div>
    </div>
  );
}
