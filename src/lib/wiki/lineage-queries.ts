/**
 * Lineage Query Utilities
 *
 * Database queries for artifact provenance and relationship traversal.
 * Supports multiple entity types: BAR, QUEST, CAMPAIGN, SEED.
 */

import { db } from '@/lib/db';

export type EntityType = 'BAR' | 'QUEST' | 'CAMPAIGN' | 'SEED' | 'WIKI' | 'EVENT' | 'NPC' | 'PLAYER';

export interface LineageNode {
  id: string;
  type: EntityType;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  relationships: {
    type: 'FORK_OF' | 'DERIVED_FROM' | 'CONTAINS' | 'VALIDATES' | 'IMPLEMENTS';
    targetId: string;
    targetType: EntityType;
  }[];
  children: LineageNode[];
  depth: number;
}

export interface LineageStats {
  rootId: string;
  rootType: EntityType;
  totalNodes: number;
  maxDepth: number;
  branchCount: number;
  entityDistribution: Record<EntityType, number>;
  relationshipCounts: Record<string, number>;
}

/**
 * Get complete lineage tree for an artifact (ancestors + descendants)
 */
export async function getArtifactLineage(
  id: string,
  type: EntityType
): Promise<LineageNode | null> {
  const artifact = await getArtifactById(id, type);
  if (!artifact) return null;

  // Build lineage tree
  const node: LineageNode = {
    id: artifact.id,
    type,
    title: artifact.title,
    description: artifact.description,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt,
    metadata: artifact.metadata,
    relationships: artifact.relationships,
    children: [],
    depth: 0,
  };

  // Recursively fetch descendants
  node.children = await getDescendants(id, type, 1);

  return node;
}

/**
 * Get ancestors (parent chain) for an artifact
 */
export async function getArtifactAncestors(
  id: string,
  type: EntityType
): Promise<LineageNode[]> {
  const ancestors: LineageNode[] = [];
  let currentId: string | null = id;
  let currentType = type;
  let depth = 0;

  while (currentId && depth < 100) { // Safety limit
    const artifact = await getArtifactById(currentId, currentType);
    if (!artifact) break;

    ancestors.push({
      id: artifact.id,
      type: currentType,
      title: artifact.title,
      description: artifact.description,
      createdAt: artifact.createdAt,
      updatedAt: artifact.updatedAt,
      metadata: artifact.metadata,
      relationships: artifact.relationships,
      children: [],
      depth,
    });

    // Find parent relationship
    const parentRel = artifact.relationships.find(
      r => r.type === 'FORK_OF' || r.type === 'DERIVED_FROM'
    );

    if (parentRel) {
      currentId = parentRel.targetId;
      currentType = parentRel.targetType;
    } else {
      currentId = null;
    }

    depth++;
  }

  return ancestors.reverse(); // Root first
}

/**
 * Get all descendants (forks, derivatives) for an artifact
 */
export async function getArtifactDescendants(
  id: string,
  type: EntityType,
  maxDepth: number = 10
): Promise<LineageNode[]> {
  return getDescendants(id, type, 0, maxDepth);
}

/**
 * Calculate lineage statistics for a root artifact
 */
export async function getLineageStats(
  rootId: string,
  rootType: EntityType
): Promise<LineageStats> {
  const lineage = await getArtifactLineage(rootId, rootType);
  if (!lineage) {
    return {
      rootId,
      rootType,
      totalNodes: 0,
      maxDepth: 0,
      branchCount: 0,
      entityDistribution: {} as Record<EntityType, number>,
      relationshipCounts: {},
    };
  }

  const stats: LineageStats = {
    rootId,
    rootType,
    totalNodes: 0,
    maxDepth: 0,
    branchCount: 0,
    entityDistribution: {} as Record<EntityType, number>,
    relationshipCounts: {},
  };

  // Traverse tree and collect stats
  const traverse = (node: LineageNode, depth: number) => {
    stats.totalNodes++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    // Count entity types
    stats.entityDistribution[node.type] =
      (stats.entityDistribution[node.type] || 0) + 1;

    // Count relationships
    for (const rel of node.relationships) {
      stats.relationshipCounts[rel.type] =
        (stats.relationshipCounts[rel.type] || 0) + 1;
    }

    // Count branches (nodes with multiple children)
    if (node.children.length > 1) {
      stats.branchCount++;
    }

    // Recurse
    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  };

  traverse(lineage, 0);

  return stats;
}

// Helper: Get artifact by ID and type
async function getArtifactById(
  id: string,
  type: EntityType
): Promise<{
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  relationships: Array<{
    type: 'FORK_OF' | 'DERIVED_FROM' | 'CONTAINS' | 'VALIDATES' | 'IMPLEMENTS';
    targetId: string;
    targetType: EntityType;
  }>;
} | null> {
  try {
    switch (type) {
      case 'BAR': {
        const bar = await db.customBar.findUnique({
          where: { id },
          include: {
            parentBar: { select: { id: true } },
            forkRoot: { select: { id: true } },
          },
        });

        if (!bar) return null;

        const relationships: any[] = [];
        if (bar.parentBarId) {
          relationships.push({
            type: 'FORK_OF',
            targetId: bar.parentBarId,
            targetType: 'BAR',
          });
        }
        if (bar.forkRootId && bar.forkRootId !== bar.parentBarId) {
          relationships.push({
            type: 'FORK_OF',
            targetId: bar.forkRootId,
            targetType: 'BAR',
          });
        }

        return {
          id: bar.id,
          title: bar.title,
          description: bar.description || undefined,
          createdAt: bar.createdAt,
          updatedAt: bar.updatedAt,
          metadata: {
            status: bar.status,
            visibility: bar.visibility,
            allyshipDomain: bar.allyshipDomain,
            forkDepth: bar.forkDepth,
            branchTag: bar.branchTag,
          },
          relationships,
        };
      }

      case 'QUEST': {
        const quest = await db.quest.findUnique({
          where: { id },
          include: {
            seed: { select: { id: true } },
          },
        });

        if (!quest) return null;

        const relationships: any[] = [];
        if (quest.seedId) {
          relationships.push({
            type: 'DERIVED_FROM',
            targetId: quest.seedId,
            targetType: 'SEED',
          });
        }

        return {
          id: quest.id,
          title: quest.title,
          description: quest.description || undefined,
          createdAt: quest.createdAt,
          updatedAt: quest.updatedAt,
          metadata: {
            status: quest.status,
            questType: quest.questType,
            vibulon: quest.vibulon,
          },
          relationships,
        };
      }

      case 'CAMPAIGN': {
        const campaign = await db.campaign.findUnique({
          where: { id },
        });

        if (!campaign) return null;

        return {
          id: campaign.id,
          title: campaign.name,
          description: campaign.description || undefined,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
          metadata: {
            slug: campaign.slug,
            status: campaign.status,
          },
          relationships: [],
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${type} ${id}:`, error);
    return null;
  }
}

// Helper: Get descendants recursively
async function getDescendants(
  id: string,
  type: EntityType,
  currentDepth: number,
  maxDepth: number = 10
): Promise<LineageNode[]> {
  if (currentDepth >= maxDepth) return [];

  const children: LineageNode[] = [];

  try {
    switch (type) {
      case 'BAR': {
        // Find BARs that fork from this one
        const forks = await db.customBar.findMany({
          where: {
            OR: [
              { parentBarId: id },
              { forkRootId: id },
            ],
          },
          include: {
            parentBar: { select: { id: true } },
            forkRoot: { select: { id: true } },
          },
        });

        for (const fork of forks) {
          const relationships: any[] = [];
          if (fork.parentBarId) {
            relationships.push({
              type: 'FORK_OF',
              targetId: fork.parentBarId,
              targetType: 'BAR',
            });
          }

          const node: LineageNode = {
            id: fork.id,
            type: 'BAR',
            title: fork.title,
            description: fork.description || undefined,
            createdAt: fork.createdAt,
            updatedAt: fork.updatedAt,
            metadata: {
              status: fork.status,
              visibility: fork.visibility,
              forkDepth: fork.forkDepth,
              branchTag: fork.branchTag,
            },
            relationships,
            children: await getDescendants(fork.id, 'BAR', currentDepth + 1, maxDepth),
            depth: currentDepth + 1,
          };

          children.push(node);
        }
        break;
      }

      case 'QUEST': {
        // Find QUESTs derived from this seed
        const quests = await db.quest.findMany({
          where: { seedId: id },
          include: {
            seed: { select: { id: true } },
          },
        });

        for (const quest of quests) {
          const node: LineageNode = {
            id: quest.id,
            type: 'QUEST',
            title: quest.title,
            description: quest.description || undefined,
            createdAt: quest.createdAt,
            updatedAt: quest.updatedAt,
            metadata: {
              status: quest.status,
              questType: quest.questType,
            },
            relationships: quest.seedId
              ? [{ type: 'DERIVED_FROM', targetId: quest.seedId, targetType: 'SEED' }]
              : [],
            children: await getDescendants(quest.id, 'QUEST', currentDepth + 1, maxDepth),
            depth: currentDepth + 1,
          };

          children.push(node);
        }
        break;
      }

      // Other types can be added as needed
      default:
        break;
    }
  } catch (error) {
    console.error(`Error fetching descendants for ${type} ${id}:`, error);
  }

  return children;
}
