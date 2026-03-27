#!/usr/bin/env tsx
/**
 * Registry Builder
 *
 * Extracts route annotations and builds the API registry JSON file.
 * This registry exposes micro-ontologies to agents and serves as the grimoire
 * of all provenance threads in the system.
 *
 * Usage:
 *   npm run build:registry
 */

import { Project, JSDoc } from 'ts-morph';
import * as path from 'path';
import * as fs from 'fs';

interface Registry {
  version: string;
  generatedAt: string;
  entities: Record<string, EntityDefinition>;
  routes: RouteDefinition[];
  relationships: Record<string, RelationshipDefinition>;
  dimensions: Record<string, DimensionDefinition>;
}

interface EntityDefinition {
  name: string;
  description: string;
  provenanceFields: string[];
  relationships: string[];
  energyModel?: {
    readCost: number;
    createCost: number;
    forkCost?: number;
  };
}

interface RouteDefinition {
  id: string;
  method: string;
  pattern: string;
  entity: string;
  description: string;
  permissions: string[];
  params: ParamDefinition[];
  query: ParamDefinition[];
  relationships: RelationshipReference[];
  energyCost: number;
  dimensions: Record<string, string>;
  example: string;
  agentDiscoverable: boolean;
  experimental: boolean;
  sourceFile: string;
  lineNumber: number;
}

interface ParamDefinition {
  name: string;
  type: string;
  location: string;
  required: boolean;
  description?: string;
}

interface RelationshipReference {
  type: string;
  field: string;
  target: string;
}

interface RelationshipDefinition {
  name: string;
  description: string;
  source: string;
  target: string;
  field: string;
}

interface DimensionDefinition {
  dimension: string;
  description: string;
  urlEncoding: string;
  provenanceFields: string[];
}

// Entity definitions (expand as needed)
const ENTITIES: Record<string, EntityDefinition> = {
  BAR: {
    name: 'BAR',
    description: 'Atomic seed object in bars-engine',
    provenanceFields: ['parentBarId', 'forkRootId', 'forkDepth', 'branchTag', 'forgerId'],
    relationships: ['FORK_OF', 'DERIVED_FROM'],
    energyModel: {
      readCost: 0,
      createCost: 10,
      forkCost: 5,
    },
  },
  QUEST: {
    name: 'QUEST',
    description: "CustomBar with type='quest_seed'",
    provenanceFields: ['collapsedFromQuest', 'proposedByAgentId'],
    relationships: ['DERIVED_FROM'],
    energyModel: {
      readCost: 0,
      createCost: 20,
    },
  },
  CAMPAIGN: {
    name: 'CAMPAIGN',
    description: 'Instance with associated quests and participants',
    provenanceFields: ['creatorId', 'forkedFromInstanceId'],
    relationships: ['FORK_OF', 'CONTAINS'],
    energyModel: {
      readCost: 0,
      createCost: 50,
    },
  },
  SEED: {
    name: 'SEED',
    description: 'Shareable transmission package with full provenance',
    provenanceFields: ['sourceId', 'sourceType', 'createdBy'],
    relationships: ['DERIVED_FROM'],
    energyModel: {
      readCost: 0,
      createCost: 5,
    },
  },
};

// Relationship definitions
const RELATIONSHIPS: Record<string, RelationshipDefinition> = {
  FORK_OF: {
    name: 'FORK_OF',
    description: 'BAR is a fork of another BAR',
    source: 'BAR',
    target: 'BAR',
    field: 'parentBarId',
  },
  DERIVED_FROM: {
    name: 'DERIVED_FROM',
    description: 'Quest spawned from BAR seed',
    source: 'QUEST',
    target: 'BAR',
    field: 'collapsedFromQuest',
  },
  CONTAINS: {
    name: 'CONTAINS',
    description: 'Campaign contains quests',
    source: 'CAMPAIGN',
    target: 'QUEST',
    field: 'questIds',
  },
};

// 5-Dimensional ontology
const DIMENSIONS: Record<string, DimensionDefinition> = {
  WHO: {
    dimension: 'Identity & Agency',
    description: 'Nation, Playbook, creator identity',
    urlEncoding: 'Query params: nationId, playbookId, creatorId, forgerId',
    provenanceFields: ['proposedByAgentId', 'invitedByPlayerId', 'forgerId'],
  },
  WHAT: {
    dimension: 'Artifact Type & Identity',
    description: 'CustomBar (quests), artifacts, seeds',
    urlEncoding: 'Path segments: /api/{entity-type}/:id',
    provenanceFields: ['parentBarId', 'forkRootId', 'collapsedFromQuest'],
  },
  WHERE: {
    dimension: 'Allyship Domain Context',
    description: 'GATHERING_RESOURCES, DIRECT_ACTION, RAISE_AWARENESS, SKILLFUL_ORGANIZING',
    urlEncoding: 'Query param: domain or allyshipDomain',
    provenanceFields: ['allyshipDomain'],
  },
  ENERGY: {
    dimension: 'Vibulon & Emotional Alchemy',
    description: 'Vibulon, InstanceParticipation.localBalance, emotional alchemy moves',
    urlEncoding: 'Query params: vibulon, localBalance, energyCost, move',
    provenanceFields: ['localBalance', 'emotional alchemy move metadata'],
  },
  PERSONAL_THROUGHPUT: {
    dimension: 'Wake/Clean/Grow/Show Up',
    description: 'Personal development stages',
    urlEncoding: 'Query param: stage or throughputStage',
    provenanceFields: ['custom quest metadata'],
  },
};

function parseRouteAnnotation(jsDoc: JSDoc, filePath: string, lineNumber: number): RouteDefinition | null {
  const tags = jsDoc.getTags();
  const route: Partial<RouteDefinition> = {
    sourceFile: filePath,
    lineNumber,
    params: [],
    query: [],
    relationships: [],
    dimensions: {},
    energyCost: 0,
    agentDiscoverable: false,
    experimental: false,
  };

  for (const tag of tags) {
    const tagName = tag.getTagName();
    const text = tag.getCommentText()?.toString() || '';

    switch (tagName) {
      case 'route':
        const routeParts = text.split(' ');
        route.method = routeParts[0];
        route.pattern = routeParts.slice(1).join(' ');
        break;
      case 'page':
        route.method = 'PAGE';
        route.pattern = text;
        break;
      case 'entity':
        route.entity = text.trim().toUpperCase();
        break;
      case 'description':
        route.description = text;
        break;
      case 'permissions':
        route.permissions = text.split(',').map(p => p.trim());
        break;
      case 'example':
        route.example = text;
        break;
      case 'agentDiscoverable':
        route.agentDiscoverable = text.toLowerCase() === 'true';
        break;
      case 'experimental':
        route.experimental = text.toLowerCase() === 'true';
        break;
      case 'energyCost':
        route.energyCost = parseFloat(text) || 0;
        break;
      case 'dimensions':
        const dimParts = text.split(',').map(p => p.trim());
        for (const dim of dimParts) {
          const [key, value] = dim.split(':').map(s => s.trim());
          if (key && value) {
            route.dimensions![key] = value;
          }
        }
        break;
    }
  }

  // Only include routes that have minimal required fields
  if (!route.pattern || !route.entity || !route.description) {
    return null;
  }

  // Generate route ID
  route.id = `${route.method?.toLowerCase()}_${route.entity.toLowerCase()}_${Date.now()}`;

  return route as RouteDefinition;
}

async function buildRegistry(): Promise<Registry> {
  const project = new Project({
    tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
  });

  const registry: Registry = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    entities: ENTITIES,
    routes: [],
    relationships: RELATIONSHIPS,
    dimensions: DIMENSIONS,
  };

  // Find all route and page files
  const apiRoutes = project.addSourceFilesAtPaths('src/app/api/**/route.ts');
  const pages = project.addSourceFilesAtPaths('src/app/**/page.tsx');

  const allFiles = [...apiRoutes, ...pages];

  for (const file of allFiles) {
    const filePath = file.getFilePath().replace(process.cwd(), '');
    const functions = [
      ...file.getFunctions().filter(f => f.isExported()),
      ...file.getVariableDeclarations().filter(v => v.isExported()),
    ];

    const defaultExport = file.getDefaultExportSymbol();
    if (defaultExport) {
      functions.push(...defaultExport.getDeclarations() as any);
    }

    for (const func of functions) {
      if (!func) continue;
      const jsDocs = func.getJsDocs?.() || [];

      for (const jsDoc of jsDocs) {
        const routeDef = parseRouteAnnotation(jsDoc, filePath, func.getStartLineNumber?.() || 0);
        if (routeDef) {
          registry.routes.push(routeDef);
        }
      }
    }
  }

  return registry;
}

// Main execution
buildRegistry()
  .then(registry => {
    const outputPath = path.join(process.cwd(), 'public', 'registry.json');

    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2));

    console.log('\n📖 Registry Built Successfully!\n');
    console.log(`Routes registered: ${registry.routes.length}`);
    console.log(`Entities defined: ${Object.keys(registry.entities).length}`);
    console.log(`Relationships defined: ${Object.keys(registry.relationships).length}`);
    console.log(`\n✅ Registry saved to: ${outputPath}\n`);
  })
  .catch(error => {
    console.error('❌ Registry build error:', error);
    process.exit(1);
  });
