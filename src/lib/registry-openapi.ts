/**
 * Registry to OpenAPI 3.0 Converter
 *
 * Transforms the route registry into OpenAPI 3.0 specification format
 * for API documentation and agent integration.
 */

interface RegistryRoute {
  id: string;
  method: string;
  pattern: string;
  entity: string;
  description: string;
  permissions: string[];
  params?: Array<{
    name: string;
    type: string;
    location: string;
    required: boolean;
  }>;
  query?: Array<{
    name: string;
    type: string;
    enum?: string[];
    required: boolean;
  }>;
  relationships?: Array<{
    type: string;
    field: string;
    target: string;
  }>;
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

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    securitySchemes: Record<string, any>;
  };
}

function convertPathPattern(pattern: string): string {
  // Convert Next.js pattern to OpenAPI pattern
  // /api/bars/:barId -> /api/bars/{barId}
  // /api/bars/[id] -> /api/bars/{id}
  return pattern
    .replace(/:(\w+)/g, '{$1}')
    .replace(/\[(\w+)\]/g, '{$1}');
}

function inferTypeFromString(type: string): { type: string; format?: string } {
  const lowerType = type.toLowerCase();

  if (lowerType.includes('string')) {
    return { type: 'string' };
  }
  if (lowerType.includes('number') || lowerType.includes('int')) {
    return { type: 'integer', format: 'int32' };
  }
  if (lowerType.includes('boolean') || lowerType.includes('bool')) {
    return { type: 'boolean' };
  }
  if (lowerType.includes('object')) {
    return { type: 'object' };
  }
  if (lowerType.includes('array')) {
    return { type: 'array', items: { type: 'string' } } as any;
  }

  // Default to string
  return { type: 'string' };
}

function convertRouteToOpenAPIPath(route: RegistryRoute): any {
  const pathItem: any = {};
  const method = route.method.toLowerCase();

  // Build parameter list
  const parameters: any[] = [];

  // Path parameters
  if (route.params) {
    for (const param of route.params) {
      parameters.push({
        name: param.name,
        in: 'path',
        required: param.required,
        schema: inferTypeFromString(param.type),
        description: `Path parameter: ${param.name}`,
      });
    }
  }

  // Query parameters
  if (route.query) {
    for (const query of route.query) {
      const schema: any = inferTypeFromString(query.type);
      if (query.enum) {
        schema.enum = query.enum;
      }
      parameters.push({
        name: query.name,
        in: 'query',
        required: query.required,
        schema,
        description: `Query parameter: ${query.name}`,
      });
    }
  }

  // Build response
  const response200: any = {
    description: 'Successful response',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
    },
  };

  // Build security based on permissions
  const security: any[] = [];
  if (route.permissions.includes('authenticated') || route.permissions.includes('admin')) {
    security.push({ sessionAuth: [] });
  }

  // Build operation
  pathItem[method] = {
    summary: route.description,
    description: [
      route.description,
      route.relationships ? `\n\n**Relationships:** ${route.relationships.map(r => r.type).join(', ')}` : '',
      route.dimensions ? `\n\n**Dimensions:** ${Object.entries(route.dimensions).map(([k, v]) => `${k}=${v}`).join(', ')}` : '',
      route.energyCost !== undefined ? `\n\n**Energy Cost:** ${route.energyCost} vibulon` : '',
    ].filter(Boolean).join(''),
    operationId: route.id,
    tags: [route.entity],
    parameters: parameters.length > 0 ? parameters : undefined,
    security: security.length > 0 ? security : undefined,
    responses: {
      '200': response200,
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
      '404': {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
      '500': {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
    'x-bars-metadata': {
      entity: route.entity,
      permissions: route.permissions,
      agentDiscoverable: route.agentDiscoverable,
      sourceFile: route.sourceFile,
      lineNumber: route.lineNumber,
    },
  };

  if (route.example) {
    pathItem[method]['x-example-url'] = route.example;
  }

  return pathItem;
}

export function toOpenAPI(registry: Registry, baseUrl: string = 'http://localhost:3000'): OpenAPISpec {
  const paths: Record<string, any> = {};

  // Group routes by path
  const routesByPath: Record<string, RegistryRoute[]> = {};
  for (const route of registry.routes) {
    const openAPIPath = convertPathPattern(route.pattern);
    if (!routesByPath[openAPIPath]) {
      routesByPath[openAPIPath] = [];
    }
    routesByPath[openAPIPath].push(route);
  }

  // Convert each path
  for (const [path, routes] of Object.entries(routesByPath)) {
    paths[path] = {};
    for (const route of routes) {
      const pathItem = convertRouteToOpenAPIPath(route);
      Object.assign(paths[path], pathItem);
    }
  }

  // Build entity tags
  const tags: Array<{ name: string; description: string }> = [];
  for (const [entityName, entityDef] of Object.entries(registry.entities)) {
    tags.push({
      name: entityName,
      description: entityDef.description || `${entityName} entity routes`,
    });
  }

  // Build OpenAPI spec
  const spec: OpenAPISpec = {
    openapi: '3.0.3',
    info: {
      title: 'BARs Engine API',
      version: registry.version,
      description: [
        'Deep Linking & API Registration System',
        '',
        'This API provides access to the BARs Engine ontology through a 5-dimensional framework:',
        '- **WHO**: Identity & Agency (Nation, Playbook, creator)',
        '- **WHAT**: Artifact type (BAR, QUEST, CAMPAIGN, SEED)',
        '- **WHERE**: Allyship domain',
        '- **ENERGY**: Vibulon & emotional alchemy',
        '- **PERSONAL_THROUGHPUT**: Wake Up/Clean Up/Grow Up/Show Up',
        '',
        `Generated: ${registry.generatedAt}`,
        `Total routes: ${registry.routes.length}`,
        `Entities: ${Object.keys(registry.entities).length}`,
      ].join('\n'),
    },
    servers: [
      {
        url: baseUrl,
        description: 'BARs Engine Server',
      },
    ],
    tags,
    paths,
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
      securitySchemes: {
        sessionAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'bars_player_id',
          description: 'Session-based authentication via cookie',
        },
      },
    },
  };

  return spec;
}
