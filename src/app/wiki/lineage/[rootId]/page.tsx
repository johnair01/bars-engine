/**
 * @page /wiki/lineage/:rootId
 * @entity WIKI
 * @description Full lineage explorer with provenance tree, filtering, and export capabilities
 * @permissions public
 * @params rootId:string (path, required) - Root artifact identifier
 * @searchParams type:string (required) - Entity type (BAR, QUEST, CAMPAIGN, etc.)
 * @searchParams maxDepth:number (optional) - Maximum tree depth to display (default: 10)
 * @searchParams format:string (optional) - Export format: json, svg (future)
 * @relationships all artifact types (complete provenance graph)
 * @energyCost 0 (read-only wiki page)
 * @dimensions WHO:viewer, WHAT:full lineage, WHERE:wiki, ENERGY:provenance exploration
 * @example /wiki/lineage/bar_123?type=BAR&maxDepth=5
 * @agentDiscoverable true
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArtifactLineage, getLineageStats, type EntityType } from '@/lib/wiki/lineage-queries';
import { LineageVisualization } from '@/components/wiki/LineageVisualization';

interface PageProps {
  params: Promise<{ rootId: string }>;
  searchParams: Promise<{ type?: string; maxDepth?: string; format?: string }>;
}

export default async function LineageExplorerPage({ params, searchParams }: PageProps) {
  const { rootId } = await params;
  const { type, maxDepth: maxDepthParam, format } = await searchParams;

  if (!type) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Missing Entity Type</h1>
          <p className="text-zinc-400">
            Please specify the artifact type via ?type=BAR (or QUEST, CAMPAIGN, etc.)
          </p>
          <Link
            href={`/wiki/artifacts/${rootId}`}
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white"
          >
            ← Back to Artifact
          </Link>
        </div>
      </div>
    );
  }

  const entityType = type.toUpperCase() as EntityType;
  const maxDepth = maxDepthParam ? parseInt(maxDepthParam, 10) : 10;

  // Fetch lineage
  let lineage;
  try {
    lineage = await getArtifactLineage(rootId, entityType);
  } catch (error) {
    console.error(`Failed to fetch lineage for ${entityType} ${rootId}:`, error);
  }

  if (!lineage) {
    notFound();
  }

  // Get statistics
  const stats = await getLineageStats(rootId, entityType);
  if (!stats) {
    notFound(); // Lineage feature is stubbed, return 404
  }

  // Note: JSON export format removed - would need to be an API route, not a page
  // When lineage is restored, create /api/wiki/lineage/[rootId]/export route

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb */}
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">
            Wiki
          </Link>
          {' / '}
          <Link href="/wiki/artifacts" className="hover:text-zinc-400">
            Artifacts
          </Link>
          {' / '}
          <Link
            href={`/wiki/artifacts/${rootId}?type=${entityType}`}
            className="hover:text-zinc-400"
          >
            {lineage.title}
          </Link>
          {' / '}
          <span className="text-zinc-400">Lineage</span>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded-lg bg-purple-900/30 border border-purple-600 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  {entityType}
                </span>
                <span className="text-xs text-zinc-500">
                  Root ID: <code className="text-zinc-400 font-mono">{rootId}</code>
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                Provenance Tree: {lineage.title}
              </h1>
              <p className="mt-2 text-zinc-400">
                Complete lineage visualization showing all descendants and relationships
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href={`/wiki/artifacts/${rootId}?type=${entityType}`}
                className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-sm transition"
              >
                ← Artifact View
              </Link>
              <a
                href={`/wiki/lineage/${rootId}?type=${entityType}&format=json`}
                download={`lineage-${rootId}.json`}
                className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-sm transition"
              >
                Export JSON
              </a>
            </div>
          </div>
        </div>

        {/* Lineage Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overview Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
              Overview
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-zinc-500 text-xs">Total Nodes</div>
                <div className="text-3xl font-bold text-white">{stats.totalNodes}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs">Max Depth</div>
                <div className="text-2xl font-bold text-purple-400">{stats.maxDepth}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs">Branches</div>
                <div className="text-2xl font-bold text-green-400">{stats.branchCount}</div>
              </div>
            </div>
          </div>

          {/* Entity Distribution Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
              Entity Distribution
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.entityDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([entity, count]) => {
                  const percentage = Math.round((count / stats.totalNodes) * 100);
                  return (
                    <div key={entity} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">{entity}</span>
                        <span className="text-white">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded overflow-hidden">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Relationships Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">
              Relationships
            </h3>
            <div className="space-y-2">
              {Object.entries(stats.relationshipCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([relType, count]) => (
                  <div key={relType} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{relType}</span>
                    <span className="text-white font-mono">{count}</span>
                  </div>
                ))}
              {Object.keys(stats.relationshipCounts).length === 0 && (
                <div className="text-zinc-500 text-xs">No relationships</div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Showing lineage up to depth: <strong className="text-white">{maxDepth}</strong>
            </div>
            <div className="flex gap-2">
              {[3, 5, 10, 20].map((depth) => (
                <Link
                  key={depth}
                  href={`/wiki/lineage/${rootId}?type=${entityType}&maxDepth=${depth}`}
                  className={`
                    px-3 py-1.5 rounded text-sm transition
                    ${
                      maxDepth === depth
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }
                  `}
                >
                  {depth}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Provenance Tree Visualization */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-6">
            Complete Provenance Tree
          </h2>
          <LineageVisualization lineage={lineage} maxDepth={maxDepth} />
        </div>

        {/* Export Options */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <h3 className="text-sm uppercase tracking-widest text-zinc-500 mb-4">
            Export Options
          </h3>
          <div className="flex gap-4">
            <a
              href={`/wiki/lineage/${rootId}?type=${entityType}&format=json`}
              download={`lineage-${rootId}.json`}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-white transition"
            >
              📄 Export as JSON
            </a>
            <button
              disabled
              className="px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-600 cursor-not-allowed"
              title="SVG export coming in future release"
            >
              🖼️ Export as SVG (Coming Soon)
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/wiki/artifacts/${rootId}?type=${entityType}`}
            className="flex-1 py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold rounded-xl text-center transition"
          >
            ← Back to Artifact
          </Link>
          <Link
            href={`/api/registry?entity=${entityType}`}
            className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-center transition"
          >
            View API Registry →
          </Link>
        </div>
      </div>
    </div>
  );
}
