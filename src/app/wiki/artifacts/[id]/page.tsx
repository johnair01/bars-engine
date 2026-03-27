/**
 * @page /wiki/artifacts/:id
 * @entity WIKI
 * @description Wiki artifact detail page with lineage visualization and provenance context
 * @permissions public
 * @params id:string (path, required) - Artifact identifier
 * @searchParams type:string (optional) - Entity type hint (BAR, QUEST, CAMPAIGN, etc.)
 * @relationships all artifact types (displays provenance for any entity)
 * @energyCost 0 (read-only wiki page)
 * @dimensions WHO:viewer, WHAT:artifact lineage, WHERE:wiki, ENERGY:provenance exploration
 * @example /wiki/artifacts/bar_123?type=BAR
 * @agentDiscoverable true
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArtifactLineage, getLineageStats, type EntityType } from '@/lib/wiki/lineage-queries';
import { LineageVisualization } from '@/components/wiki/LineageVisualization';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}

const ENTITY_TYPES: EntityType[] = ['BAR', 'QUEST', 'CAMPAIGN', 'SEED', 'WIKI', 'EVENT', 'NPC', 'PLAYER'];

export default async function WikiArtifactPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { type } = await searchParams;

  // Try to detect entity type or try all types
  const entityTypes: EntityType[] = type
    ? [type.toUpperCase() as EntityType]
    : ENTITY_TYPES;

  let lineage = null;
  let detectedType: EntityType | null = null;

  for (const entityType of entityTypes) {
    try {
      const result = await getArtifactLineage(id, entityType);
      if (result) {
        lineage = result;
        detectedType = entityType;
        break;
      }
    } catch (error) {
      console.error(`Failed to fetch ${entityType} ${id}:`, error);
    }
  }

  if (!lineage || !detectedType) {
    notFound();
  }

  // Get lineage statistics
  const stats = await getLineageStats(id, detectedType);

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
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
          <span className="text-zinc-400">{lineage.title}</span>
        </div>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 rounded-lg bg-purple-900/30 border border-purple-600 text-purple-300 text-xs font-bold uppercase tracking-wider">
                  {detectedType}
                </span>
                <span className="text-xs text-zinc-500">
                  ID: <code className="text-zinc-400 font-mono">{id}</code>
                </span>
              </div>
              <h1 className="text-3xl font-bold text-white">
                {lineage.title}
              </h1>
              {lineage.description && (
                <p className="mt-2 text-zinc-400">
                  {lineage.description}
                </p>
              )}
            </div>

            <Link
              href={`/wiki/lineage/${id}?type=${detectedType}`}
              className="px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white text-sm transition"
            >
              View Full Lineage →
            </Link>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Created</div>
              <div className="text-white mt-1">
                {new Date(lineage.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Updated</div>
              <div className="text-white mt-1">
                {new Date(lineage.updatedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Descendants</div>
              <div className="text-white mt-1">{stats.totalNodes - 1}</div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-zinc-500 text-xs">Max Depth</div>
              <div className="text-white mt-1">{stats.maxDepth}</div>
            </div>
          </div>
        </div>

        {/* Relationships */}
        {lineage.relationships.length > 0 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-3">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">
              Relationships
            </h2>
            <div className="space-y-2">
              {lineage.relationships.map((rel, i) => (
                <Link
                  key={i}
                  href={`/wiki/artifacts/${rel.targetId}?type=${rel.targetType}`}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-purple-400 uppercase">
                      {rel.type}
                    </span>
                    <span className="text-sm text-zinc-300">
                      {rel.targetType}
                    </span>
                    <code className="text-xs text-zinc-500 font-mono">
                      {rel.targetId}
                    </code>
                  </div>
                  <span className="text-zinc-500">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Artifact-specific metadata */}
        {lineage.metadata && Object.keys(lineage.metadata).length > 0 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-3">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">
              Metadata
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(lineage.metadata).map(([key, value]) => (
                <div key={key} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="text-xs text-zinc-500 mb-1">{key}</div>
                  <div className="text-sm text-white font-medium">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lineage Statistics */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          <h2 className="text-sm uppercase tracking-widest text-zinc-400">
            Lineage Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Total Nodes</div>
              <div className="text-2xl font-bold text-white">{stats.totalNodes}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Branches</div>
              <div className="text-2xl font-bold text-white">{stats.branchCount}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Max Depth</div>
              <div className="text-2xl font-bold text-white">{stats.maxDepth}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 mb-1">Entity Types</div>
              <div className="text-2xl font-bold text-white">
                {Object.keys(stats.entityDistribution).length}
              </div>
            </div>
          </div>

          {Object.keys(stats.entityDistribution).length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <div className="text-xs text-zinc-500 mb-2">Entity Distribution</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.entityDistribution).map(([entity, count]) => (
                  <span
                    key={entity}
                    className="px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs"
                  >
                    {entity}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Provenance Visualization */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">
              Provenance Tree
            </h2>
            <Link
              href={`/wiki/lineage/${id}?type=${detectedType}`}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              View full lineage →
            </Link>
          </div>

          <LineageVisualization lineage={lineage} maxDepth={3} />

          {lineage.children.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              No descendants found. This is a leaf node in the provenance tree.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href={`/wiki/lineage/${id}?type=${detectedType}`}
            className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-center transition"
          >
            Explore Full Lineage
          </Link>
          <Link
            href={`/api/registry?entity=${detectedType}`}
            className="flex-1 py-3 px-6 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white font-bold rounded-xl text-center transition"
          >
            View API Registry
          </Link>
        </div>
      </div>
    </div>
  );
}
