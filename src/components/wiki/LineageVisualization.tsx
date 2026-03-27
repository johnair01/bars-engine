'use client';

/**
 * Lineage Visualization Component
 *
 * Interactive provenance tree visualization for artifact relationships.
 * Displays FORK_OF, DERIVED_FROM, and other relationship types.
 */

import { useState } from 'react';
import Link from 'next/link';
import type { LineageNode, EntityType } from '@/lib/wiki/lineage-queries';

interface LineageVisualizationProps {
  lineage: LineageNode;
  onNodeClick?: (node: LineageNode) => void;
  maxDepth?: number;
}

const ENTITY_COLORS: Record<EntityType, { bg: string; border: string; text: string }> = {
  BAR: { bg: 'bg-purple-900/30', border: 'border-purple-600', text: 'text-purple-300' },
  QUEST: { bg: 'bg-green-900/30', border: 'border-green-600', text: 'text-green-300' },
  CAMPAIGN: { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-300' },
  SEED: { bg: 'bg-yellow-900/30', border: 'border-yellow-600', text: 'text-yellow-300' },
  WIKI: { bg: 'bg-cyan-900/30', border: 'border-cyan-600', text: 'text-cyan-300' },
  EVENT: { bg: 'bg-pink-900/30', border: 'border-pink-600', text: 'text-pink-300' },
  NPC: { bg: 'bg-orange-900/30', border: 'border-orange-600', text: 'text-orange-300' },
  PLAYER: { bg: 'bg-indigo-900/30', border: 'border-indigo-600', text: 'text-indigo-300' },
};

function LineageNodeCard({
  node,
  onClick,
  isRoot,
}: {
  node: LineageNode;
  onClick?: () => void;
  isRoot?: boolean;
}) {
  const colors = ENTITY_COLORS[node.type] || ENTITY_COLORS.BAR;

  return (
    <div
      className={`
        rounded-lg border-2 p-3 transition-all
        ${colors.bg} ${colors.border}
        ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
        ${isRoot ? 'ring-2 ring-white/30' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
              {node.type}
            </span>
            {isRoot && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white">
                ROOT
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-white truncate">
            {node.title}
          </h4>
          {node.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
              {node.description}
            </p>
          )}
        </div>
        <Link
          href={`/wiki/artifacts/${node.id}`}
          className="text-zinc-400 hover:text-white transition text-xs"
          onClick={(e) => e.stopPropagation()}
        >
          →
        </Link>
      </div>

      {node.metadata && Object.keys(node.metadata).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(node.metadata).slice(0, 3).map(([key, value]) => (
            <span
              key={key}
              className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-zinc-400"
            >
              {key}: {String(value).slice(0, 20)}
            </span>
          ))}
        </div>
      )}

      {node.relationships.length > 0 && (
        <div className="mt-2 text-[10px] text-zinc-500">
          {node.relationships.map((rel, i) => (
            <div key={i}>
              {rel.type} → {rel.targetType}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LineageTree({
  node,
  onNodeClick,
  depth = 0,
  maxDepth = 10,
  isRoot = false,
}: {
  node: LineageNode;
  onNodeClick?: (node: LineageNode) => void;
  depth?: number;
  maxDepth?: number;
  isRoot?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 3); // Auto-expand first 3 levels

  if (depth > maxDepth) {
    return null;
  }

  const hasChildren = node.children.length > 0;

  return (
    <div className="relative">
      {/* Node card */}
      <div className="relative z-10">
        <LineageNodeCard
          node={node}
          onClick={() => {
            if (hasChildren) {
              setIsExpanded(!isExpanded);
            }
            if (onNodeClick) {
              onNodeClick(node);
            }
          }}
          isRoot={isRoot}
        />

        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -right-2 -bottom-2 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-white hover:bg-zinc-700 transition z-20"
          >
            {isExpanded ? '−' : '+'}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="mt-4 ml-8 space-y-4 border-l-2 border-zinc-800 pl-4">
          {node.children.map((child, i) => (
            <div key={child.id} className="relative">
              {/* Connection line */}
              <div className="absolute -left-4 top-6 w-4 h-0.5 bg-zinc-800" />

              <LineageTree
                node={child}
                onNodeClick={onNodeClick}
                depth={depth + 1}
                maxDepth={maxDepth}
                isRoot={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LineageVisualization({
  lineage,
  onNodeClick,
  maxDepth = 10,
}: LineageVisualizationProps) {
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);

  const handleNodeClick = (node: LineageNode) => {
    setSelectedNode(node);
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  // Count nodes recursively
  const countNodes = (node: LineageNode): number => {
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
  };

  const totalNodes = countNodes(lineage);

  return (
    <div className="space-y-6">
      {/* Stats header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4 text-zinc-400">
          <span>Total nodes: <strong className="text-white">{totalNodes}</strong></span>
          <span>Max depth: <strong className="text-white">{lineage.depth}</strong></span>
          <span>Direct children: <strong className="text-white">{lineage.children.length}</strong></span>
        </div>

        <div className="flex gap-2">
          {Object.entries(ENTITY_COLORS).map(([type, colors]) => (
            <div
              key={type}
              className="flex items-center gap-1.5"
            >
              <div className={`w-3 h-3 rounded ${colors.bg} border ${colors.border}`} />
              <span className="text-xs text-zinc-500">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lineage tree */}
      <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-6 overflow-x-auto">
        <LineageTree
          node={lineage}
          onNodeClick={handleNodeClick}
          maxDepth={maxDepth}
          isRoot={true}
        />
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
            Selected Node
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-zinc-500">ID</div>
              <div className="text-white font-mono text-xs">{selectedNode.id}</div>
            </div>
            <div>
              <div className="text-zinc-500">Type</div>
              <div className="text-white">{selectedNode.type}</div>
            </div>
            <div>
              <div className="text-zinc-500">Created</div>
              <div className="text-white">{selectedNode.createdAt.toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-zinc-500">Depth</div>
              <div className="text-white">{selectedNode.depth}</div>
            </div>
            <div className="col-span-2">
              <div className="text-zinc-500 mb-1">Metadata</div>
              <pre className="text-xs text-zinc-400 bg-black/30 rounded p-2 overflow-x-auto">
                {JSON.stringify(selectedNode.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
