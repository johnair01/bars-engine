/**
 * @route GET /api/registry
 * @entity SYSTEM
 * @description Serve route registry with filtering for agent discovery and introspection
 * @permissions public
 * @query entity:string (optional) - Filter by entity type (BAR, QUEST, CAMPAIGN, etc.)
 * @query permission:string (optional) - Filter by permission scope (public, authenticated, admin)
 * @query agentDiscoverable:boolean (optional) - Filter by agent visibility
 * @query format:string (optional) - Output format: json (default) or openapi
 * @relationships SYSTEM (registry introspection), all entities (route catalog)
 * @energyCost 0 (read-only metadata)
 * @dimensions WHO:agent+developer, WHAT:registry metadata, WHERE:system introspection, ENERGY:route discovery
 * @example /api/registry?entity=BAR&agentDiscoverable=true
 * @agentDiscoverable true
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { toOpenAPI } from '@/lib/registry-openapi';

interface RegistryRoute {
  id: string;
  method: string;
  pattern: string;
  entity: string;
  description: string;
  permissions: string[];
  params?: any[];
  query?: any[];
  relationships?: any[];
  energyCost?: number;
  dimensions?: Record<string, string>;
  example?: string;
  agentDiscoverable?: boolean;
  sourceFile: string;
  lineNumber: number;
}

interface Registry {
  version: string;
  generatedAt: string;
  entities: Record<string, any>;
  routes: RegistryRoute[];
  relationships: Record<string, any>;
  dimensions: Record<string, any>;
}

let cachedRegistry: Registry | null = null;
let cacheTimestamp: number = 0;
let cacheETag: string | null = null;
const CACHE_TTL = 60000; // 1 minute

function generateETag(data: any): string {
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
}

function loadRegistry(): { registry: Registry; etag: string } {
  const now = Date.now();

  // Return cached if fresh
  if (cachedRegistry && cacheETag && (now - cacheTimestamp) < CACHE_TTL) {
    return { registry: cachedRegistry, etag: cacheETag };
  }

  // Load from file
  const registryPath = path.join(process.cwd(), 'public/registry.json');

  if (!fs.existsSync(registryPath)) {
    throw new Error('Registry file not found. Run: npm run build:registry');
  }

  const content = fs.readFileSync(registryPath, 'utf-8');
  cachedRegistry = JSON.parse(content);
  cacheETag = generateETag(cachedRegistry);
  cacheTimestamp = now;

  return { registry: cachedRegistry, etag: cacheETag };
}

function filterRoutes(
  routes: RegistryRoute[],
  filters: {
    entity?: string;
    permission?: string;
    agentDiscoverable?: boolean;
  }
): RegistryRoute[] {
  let filtered = routes;

  if (filters.entity) {
    const entityUpper = filters.entity.toUpperCase();
    filtered = filtered.filter(r => r.entity === entityUpper);
  }

  if (filters.permission) {
    filtered = filtered.filter(r =>
      r.permissions?.includes(filters.permission!)
    );
  }

  if (filters.agentDiscoverable !== undefined) {
    filtered = filtered.filter(r =>
      r.agentDiscoverable === filters.agentDiscoverable
    );
  }

  return filtered;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const entity = searchParams.get('entity') || undefined;
    const permission = searchParams.get('permission') || undefined;
    const agentDiscoverableParam = searchParams.get('agentDiscoverable');
    const agentDiscoverable = agentDiscoverableParam
      ? agentDiscoverableParam === 'true'
      : undefined;
    const format = searchParams.get('format') || 'json';

    // Load registry
    const { registry, etag } = loadRegistry();

    // Check ETag for 304 Not Modified
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          'ETag': etag,
        },
      });
    }

    // Apply filters
    const filteredRoutes = filterRoutes(registry.routes, {
      entity,
      permission,
      agentDiscoverable,
    });

    // Build response
    const response = {
      version: registry.version,
      generatedAt: registry.generatedAt,
      filters: {
        entity,
        permission,
        agentDiscoverable,
      },
      metadata: {
        totalRoutes: registry.routes.length,
        filteredRoutes: filteredRoutes.length,
        entities: Object.keys(registry.entities).length,
        relationships: Object.keys(registry.relationships).length,
      },
      entities: registry.entities,
      routes: filteredRoutes,
      relationships: registry.relationships,
      dimensions: registry.dimensions,
    };

    // Handle format
    if (format === 'openapi') {
      // Build filtered registry for OpenAPI conversion
      const filteredRegistry = {
        ...registry,
        routes: filteredRoutes,
      };

      // Convert to OpenAPI 3.0 spec
      const openAPISpec = toOpenAPI(filteredRegistry, request.nextUrl.origin);

      return NextResponse.json(openAPISpec, {
        headers: {
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
          'Content-Type': 'application/json',
          'ETag': etag,
        },
      });
    }

    // Return JSON with caching headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'Content-Type': 'application/json',
        'ETag': etag,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to load registry',
        message,
        hint: 'Run: npm run build:registry'
      },
      { status: 500 }
    );
  }
}
