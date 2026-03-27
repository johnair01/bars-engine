# Deep Linking & API Registration Guide

## Overview

The bars-engine uses a **decorator-based annotation system** to create a living registry of all routes and pages. This system makes the invisible lineage visible - encoding provenance, relationships, and micro-ontologies in every URL.

**Core Metaphor:** Deep links as provenance threads in the living web
- **Decorators** = Incantations (ontological position declarations)
- **Registry** = Grimoire (living index of all threads)
- **Validator** = Guardian at the gate (ensures no thread goes untraced)

---

## 5-Dimensional Encoding

Every route should encode the game's 5-dimensional ontology:

| Dimension | Description | URL Encoding |
|-----------|-------------|--------------|
| **WHO** | Identity & Agency (Nation, Playbook, creator, forger) | Query params: `nationId`, `forgerId`, `creatorId` |
| **WHAT** | Artifact type (BAR, QUEST, CAMPAIGN, SEED) | Path segments: `/api/bars/:id` |
| **WHERE** | Allyship domain (GATHERING_RESOURCES, DIRECT_ACTION, etc.) | Query param: `domain` or `allyshipDomain` |
| **ENERGY** | Vibulon, emotional alchemy moves, energy costs | Query params: `vibulon`, `energyCost`, `move` |
| **PERSONAL_THROUGHPUT** | Wake Up/Clean Up/Grow Up/Show Up | Query param: `stage` or `throughputStage` |

---

## Annotation Format

Use JSDoc annotations above route handlers (`export async function GET/POST/etc.`) and page components (`export default async function`).

### Required Fields

```typescript
/**
 * @route [METHOD] [PATTERN]        // or @page [PATTERN] for frontend pages
 * @entity [ENTITY_TYPE]             // BAR, QUEST, CAMPAIGN, SEED, WIKI
 * @description [PURPOSE]            // Human-readable description
 * @permissions [RULES]              // Comma-separated: authenticated, owner, admin
 */
```

### Optional Fields

```typescript
/**
 * @params [NAME]:[TYPE] ([LOCATION], [REQUIRED])
 * @query [NAME]:[TYPE] ([OPTIONS], [REQUIRED])
 * @relationships [TYPE] ([FIELD])
 * @energyCost [NUMBER] ([DESCRIPTION])
 * @dimensions [WHO]:[FIELD], [WHAT]:[VALUE], [WHERE]:[FIELD], [ENERGY]:[FIELD]
 * @example [SAMPLE_URL]
 * @agentDiscoverable [true|false]
 * @experimental [true|false]
 */
```

---

## Examples

### API Route Example

**File:** `src/app/api/bars/[id]/route.ts`

```typescript
/**
 * @route GET /api/bars/:barId
 * @entity BAR
 * @description Fetch a single BAR with optional lineage/energy view
 * @permissions authenticated, owner_or_collaborator
 * @params barId:string (path, required)
 * @query view:string (lineage|energy|relationships, optional)
 * @query includeProvenance:boolean (default false)
 * @relationships FORK_OF (parentBarId), DERIVED_FROM (collapsedFromQuest)
 * @energyCost 0 (read operation)
 * @dimensions WHO:forgerId, WHAT:BAR, WHERE:allyshipDomain, ENERGY:vibulon
 * @example /api/bars/bar_123?view=lineage&includeProvenance=true
 * @agentDiscoverable true
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Implementation
}
```

### Frontend Page Example

**File:** `src/app/bars/[id]/page.tsx`

```typescript
/**
 * @page /bars/:barId
 * @entity BAR
 * @description BAR detail page with sharing and provenance visualization
 * @permissions public (with share=external), authenticated (default)
 * @params barId:string (path, required)
 * @searchParams share:string (internal|external, optional)
 * @searchParams expanded:string (lineage|energy|forks, optional)
 * @relationships displays FORK_OF lineage, shows DERIVED_FROM quests
 * @energyCost 0 (read-only view)
 * @dimensions WHO:viewer+forgerId, WHAT:BAR, WHERE:allyshipDomain, ENERGY:vibulon
 * @example /bars/bar_123?share=external&expanded=lineage
 * @agentDiscoverable false
 */
export default async function BarDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { share?: string; expanded?: string }
}) {
  // Implementation
}
```

---

## Validation

### Run Validator

```bash
# Permissive mode (warnings only)
npm run validate:routes

# Strict mode (fail on missing annotations)
npm run validate:routes:strict
```

### Build Registry

```bash
# Generate public/registry.json
npm run build:registry

# Full build with validation
npm run build
```

### Verify Registry

```bash
# Check registry structure
cat public/registry.json | jq '.routes | length'

# List all registered entities
cat public/registry.json | jq '.entities | keys'

# Find agent-discoverable routes
cat public/registry.json | jq '.routes[] | select(.agentDiscoverable == true) | .pattern'
```

---

## Relationship Types

Document entity relationships using `@relationships`:

| Type | Description | Example |
|------|-------------|---------|
| `FORK_OF` | BAR forked from another BAR | `FORK_OF (parentBarId)` |
| `DERIVED_FROM` | Quest spawned from BAR seed | `DERIVED_FROM (collapsedFromQuest)` |
| `CONTAINS` | Campaign contains quests | `CONTAINS (questIds)` |
| `VALIDATES` | Artifact validates specification | `VALIDATES (specId)` |
| `IMPLEMENTS` | Artifact implements spec | `IMPLEMENTS (specId)` |
| `SUPPORTS` | Artifact supports another | `SUPPORTS (supportedId)` |

---

## Entity Types

Valid `@entity` values:

- `BAR` - Atomic seed object
- `QUEST` - CustomBar with type='quest_seed'
- `CAMPAIGN` - Instance with associated quests
- `SEED` - Shareable transmission package
- `WIKI` - Knowledge base page
- `EVENT` - Campaign event
- `NPC` - Non-player character
- `DAEMON` - Background agent
- `PLAYER` - User account

---

## Best Practices

### 1. Annotate Before Implementation

Add annotations when creating new routes/pages, not as an afterthought.

### 2. Always Provide Examples

The `@example` field helps developers and agents understand usage:

```typescript
/**
 * @example /api/bars/bar_123?view=lineage&includeProvenance=true
 */
```

### 3. Map All 5 Dimensions

Even if some dimensions don't apply, document them:

```typescript
/**
 * @dimensions WHO:forgerId, WHAT:BAR, WHERE:allyshipDomain, ENERGY:vibulon, PERSONAL_THROUGHPUT:stage
 */
```

### 4. Document Provenance

Use `@relationships` to expose the lineage:

```typescript
/**
 * @relationships FORK_OF (parentBarId), DERIVED_FROM (collapsedFromQuest)
 */
```

### 5. Mark Agent-Discoverable Routes

Help agents find your APIs:

```typescript
/**
 * @agentDiscoverable true
 */
```

---

## Integration with Build Pipeline

The validator runs automatically during builds:

```json
{
  "scripts": {
    "build": "npm run validate:routes && npm run build:registry && next build"
  }
}
```

**Strict Mode:** To enforce annotation coverage, use:
```json
{
  "scripts": {
    "build": "npm run validate:routes:strict && npm run build:registry && next build"
  }
}
```

---

## Troubleshooting

### "Route handler without annotation"

Add JSDoc comment above your exported function:

```typescript
/**
 * @route GET /api/example
 * @entity BAR
 * @description Example route
 * @permissions authenticated
 */
export async function GET() { /* ... */ }
```

### "Unknown entity type"

Use one of the valid entity types: BAR, QUEST, CAMPAIGN, SEED, WIKI, EVENT, NPC, DAEMON, PLAYER.

### "Missing required field"

Ensure all required fields are present:
- `@route` or `@page`
- `@entity`
- `@description`
- `@permissions`

---

## Registry Structure

The generated `public/registry.json` contains:

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-03-27T00:00:00Z",
  "entities": { /* Entity definitions */ },
  "routes": [ /* All annotated routes */ ],
  "relationships": { /* Relationship types */ },
  "dimensions": { /* 5D ontology */ }
}
```

Agents and tools can introspect this registry to discover routes, understand relationships, and navigate the provenance web.

---

## Phase 2: Annotation Quality Tools

Beyond basic validation, Phase 2 provides tools for analyzing and improving annotation quality:

### Quality Analyzer

```bash
npm run analyze:routes
```

Analyzes all route annotations and generates:
- **Entity distribution** - Breakdown by entity type (BAR, QUEST, CAMPAIGN, etc.)
- **Field coverage** - Percentage of routes with each optional field
- **Completeness scores** - 0-100% quality metric per route
- **Prioritized improvements** - High/medium priority routes needing attention
- **Recommendations** - Specific suggestions for each route

**JSON Output:**
```bash
npm run analyze:routes -- --json > analysis.json
```

### Coverage Dashboard

```bash
npm run coverage:dashboard
```

Generates an interactive HTML dashboard at `public/coverage-dashboard.html` showing:
- Overall coverage statistics
- Entity distribution visualization
- Field coverage bar charts
- High/medium priority improvement tables
- Top quality routes (100% complete)

The dashboard opens automatically in your browser.

### Combined Report

```bash
npm run routes:report
```

Runs both validation and analysis in sequence for a complete quality assessment.

### Quality Metrics

Routes are scored on completeness (0-100%) based on:

**Required fields (must be 100%):**
- `@route` / `@page`
- `@entity`
- `@description`
- `@permissions`

**Optional fields (improve completeness score):**
- `@params` - Path parameters
- `@query` / `@searchParams` - Query parameters
- `@relationships` - Provenance connections
- `@energyCost` - Vibulon cost
- `@dimensions` - 5D ontology mapping
- `@example` - Sample URL
- `@agentDiscoverable` - Agent visibility flag

**Priority Levels:**
- **High** - < 60% complete or API routes < 70%
- **Medium** - 60-79% complete
- **Low** - 80-100% complete

---

## Phase 3: Registry API Endpoint

The Registry API provides programmatic access to the route registry for agents and tools.

### Endpoint

```
GET /api/registry
```

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `entity` | string | Filter by entity type | `?entity=BAR` |
| `permission` | string | Filter by permission scope | `?permission=authenticated` |
| `agentDiscoverable` | boolean | Filter by agent visibility | `?agentDiscoverable=true` |
| `format` | string | Output format: `json` or `openapi` | `?format=openapi` |

### Response Format (JSON)

```json
{
  "version": "1.0.0",
  "generatedAt": "2026-03-27T00:00:00Z",
  "filters": {
    "entity": "BAR",
    "permission": null,
    "agentDiscoverable": true
  },
  "metadata": {
    "totalRoutes": 274,
    "filteredRoutes": 15,
    "entities": 9,
    "relationships": 3
  },
  "entities": { /* Entity definitions */ },
  "routes": [ /* Filtered route array */ ],
  "relationships": { /* Relationship types */ },
  "dimensions": { /* 5D ontology */ }
}
```

### Examples

**Get all routes:**
```bash
curl http://localhost:3000/api/registry
```

**Get BAR-related routes:**
```bash
curl http://localhost:3000/api/registry?entity=BAR
```

**Get agent-discoverable routes:**
```bash
curl http://localhost:3000/api/registry?agentDiscoverable=true
```

**Get authenticated routes:**
```bash
curl http://localhost:3000/api/registry?permission=authenticated
```

**Get OpenAPI specification:**
```bash
curl http://localhost:3000/api/registry?format=openapi > openapi.json
```

**Combined filters:**
```bash
curl 'http://localhost:3000/api/registry?entity=QUEST&agentDiscoverable=true&permission=authenticated'
```

### OpenAPI Format

When `format=openapi` is specified, the registry is converted to an OpenAPI 3.0 specification:

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "BARs Engine API",
    "version": "1.0.0",
    "description": "Deep Linking & API Registration System..."
  },
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "BARs Engine Server"
    }
  ],
  "tags": [ /* Entity tags */ ],
  "paths": { /* OpenAPI paths */ },
  "components": {
    "schemas": { /* Response schemas */ },
    "securitySchemes": { /* Auth schemes */ }
  }
}
```

The OpenAPI spec includes:
- **Path parameters** from `@params`
- **Query parameters** from `@query` / `@searchParams`
- **Security schemes** from `@permissions`
- **Entity tags** from `@entity`
- **Metadata extensions** (`x-bars-metadata`) with source file location

### Caching

The Registry API uses aggressive caching for performance:

**HTTP Caching:**
- `Cache-Control: public, max-age=60, stale-while-revalidate=120`
- `ETag` support for conditional requests
- Returns `304 Not Modified` when content unchanged

**Server-side Caching:**
- In-memory cache with 1-minute TTL
- < 10ms response time for cached requests
- Automatically invalidates on registry rebuild

**Example with ETag:**
```bash
# First request
curl -i http://localhost:3000/api/registry
# Returns: ETag: "abc123def456"

# Subsequent request
curl -H 'If-None-Match: "abc123def456"' -i http://localhost:3000/api/registry
# Returns: 304 Not Modified (no body, fast response)
```

### Agent Integration

Agents can use the Registry API to:

1. **Discover available routes** - Query by entity type or permission
2. **Filter agent-accessible routes** - Use `agentDiscoverable=true`
3. **Generate API clients** - Export OpenAPI spec for code generation
4. **Navigate provenance** - Follow relationships between entities
5. **Understand ontology** - Read 5D dimensional mappings

**Example Agent Workflow:**
```javascript
// 1. Discover all agent-accessible BAR routes
const response = await fetch('/api/registry?entity=BAR&agentDiscoverable=true');
const { routes } = await response.json();

// 2. Find route for creating a BAR
const createRoute = routes.find(r => r.method === 'POST' && r.pattern.includes('/api/bars'));

// 3. Extract parameters and call endpoint
const { params, query } = createRoute;
// Use params/query to construct request...
```

---

## Phase 4: Wiki Integration

The Wiki system provides human-readable documentation for artifacts with lineage visualization.

### Artifact Wiki Pages

Every artifact (BAR, QUEST, CAMPAIGN, SEED, etc.) can be viewed via `/wiki/artifacts/:id`:

```
/wiki/artifacts/bar_123?type=BAR
/wiki/artifacts/quest_456?type=QUEST
/wiki/artifacts/campaign_789?type=CAMPAIGN
```

**Features:**
- Artifact metadata and content display
- Provenance relationships visualization
- 5D dimensional context
- Lineage statistics (descendants, depth, branches)
- Interactive tree navigation
- Links to related artifacts

**Auto-detection:**
If the `type` parameter is omitted, the system attempts to detect the entity type automatically by querying all supported types.

### Full Lineage Explorer

The lineage explorer provides a dedicated view of the complete provenance tree:

```
/wiki/lineage/:rootId?type=BAR
```

**Features:**
- Complete descendant tree with unlimited depth
- Lineage statistics dashboard:
  - Total nodes
  - Max depth
  - Branch count
  - Entity distribution
  - Relationship counts
- Depth controls (3, 5, 10, 20 levels)
- Interactive node exploration
- Export to JSON
- Visual provenance graph

**Example:**
```
/wiki/lineage/bar_root_123?type=BAR&maxDepth=10
```

### Lineage Query API

The lineage query utilities provide programmatic access to provenance data:

**TypeScript API:**
```typescript
import {
  getArtifactLineage,
  getArtifactAncestors,
  getArtifactDescendants,
  getLineageStats,
} from '@/lib/wiki/lineage-queries';

// Get complete lineage tree
const lineage = await getArtifactLineage('bar_123', 'BAR');

// Get ancestor chain
const ancestors = await getArtifactAncestors('bar_123', 'BAR');

// Get all descendants
const descendants = await getArtifactDescendants('bar_123', 'BAR', 5);

// Get statistics
const stats = await getLineageStats('bar_123', 'BAR');
```

**Lineage Node Structure:**
```typescript
interface LineageNode {
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
```

**Statistics Structure:**
```typescript
interface LineageStats {
  rootId: string;
  rootType: EntityType;
  totalNodes: number;
  maxDepth: number;
  branchCount: number;
  entityDistribution: Record<EntityType, number>;
  relationshipCounts: Record<string, number>;
}
```

### Lineage Visualization Component

The `LineageVisualization` React component provides interactive tree rendering:

```tsx
import { LineageVisualization } from '@/components/wiki/LineageVisualization';

<LineageVisualization
  lineage={lineageNode}
  onNodeClick={(node) => console.log('Clicked:', node)}
  maxDepth={10}
/>
```

**Features:**
- Color-coded entity types
- Expandable/collapsible nodes
- Interactive node selection
- Relationship type indicators
- Metadata display
- Auto-expand first 3 levels
- Connection lines showing parent-child relationships

**Entity Colors:**
- BAR: Purple
- QUEST: Green
- CAMPAIGN: Blue
- SEED: Yellow
- WIKI: Cyan
- EVENT: Pink
- NPC: Orange
- PLAYER: Indigo

### Deep Linking to Wiki Artifacts

Wiki pages support deep linking with query parameters:

**From annotations:**
```typescript
/**
 * @example /wiki/artifacts/bar_123?type=BAR
 * @relationships FORK_OF (parentBarId), DERIVED_FROM (collapsedFromQuest)
 */
```

**From registry:**
```javascript
const response = await fetch('/api/registry?entity=BAR&agentDiscoverable=true');
const { routes } = await response.json();

// For each route, link to wiki artifact
routes.forEach(route => {
  const wikiUrl = `/wiki/artifacts/${route.entity.toLowerCase()}_${id}?type=${route.entity}`;
  console.log(`Wiki: ${wikiUrl}`);
});
```

### Use Cases

**1. Provenance Exploration:**
- Trace BAR forks back to original seed
- Visualize quest derivation from BARs
- Understand campaign evolution

**2. Impact Analysis:**
- See all descendants affected by changes
- Identify branch points in provenance tree
- Calculate lineage depth and spread

**3. Documentation:**
- Auto-generate artifact documentation
- Link related artifacts
- Show relationship context

**4. Agent Discovery:**
- Agents can explore lineage via wiki pages
- Follow provenance threads programmatically
- Navigate 5D ontology relationships

### Export Options

**JSON Export:**
```bash
# Direct download
curl '/wiki/lineage/bar_123?type=BAR&format=json' > lineage.json

# Or via link
<a href="/wiki/lineage/bar_123?type=BAR&format=json" download>Export JSON</a>
```

**Future Export Formats:**
- SVG visualization (coming soon)
- GraphML for graph analysis tools
- DOT format for Graphviz

### AI-Generated Wiki Drafts

The wiki system includes AI-powered draft generation for comprehensive artifact documentation.

**Draft Generation API:**
```bash
POST /api/wiki-drafts/generate
Content-Type: application/json

{
  "artifactId": "bar_123",
  "artifactType": "BAR",
  "options": {
    "maxLineageDepth": 5,
    "includeUsageExamples": true,
    "tone": "technical"
  }
}
```

**Draft Structure:**
- **Summary** - 2-3 paragraph overview of the artifact
- **Provenance** - Lineage history and relationships to parent/child artifacts
- **Relationships** - Documentation of each relationship type (FORK_OF, DERIVED_FROM, etc.)
- **Usage Examples** - 3-5 practical examples with URL patterns

**AI Model:** OpenAI gpt-4-turbo
- Temperature: 0.7
- Max tokens: 2000
- Context includes artifact metadata, lineage stats, relationships

**Admin Review Workflow:**

1. **View pending drafts** - `/admin/wiki-drafts`
   - Lists all AI-generated drafts awaiting review
   - Shows preview (title, summary, metadata)
   - Filters by status: pending, approved, rejected

2. **Review draft details** - `/admin/wiki-drafts/:id`
   - Full draft content display
   - Metadata: generation date, model used, lineage depth, relationship count
   - Link to original artifact
   - Review history (if already reviewed)

3. **Approve or reject** - Client component with actions
   - Approve: Accept draft for publication
   - Reject: Decline draft with optional notes
   - Review notes field for rejection reasons
   - Redirects to draft list on success

**API Routes:**
```bash
# Generate draft
POST /api/wiki-drafts/generate
Body: { artifactId, artifactType, options? }

# Review draft
POST /api/wiki-drafts/:id/review
Body: { status: "approved" | "rejected", reviewNotes? }
```

**Database Model:**
```typescript
model WikiDraft {
  id                          String   @id @default(cuid())
  artifactId                  String
  artifactType                String
  title                       String
  summary                     String   @db.Text
  provenanceExplanation       String   @db.Text
  relationshipDocumentation   String   @db.Text
  usageExamples               String   @db.Text // JSON array
  metadata                    String   @db.Text // JSON object
  status                      String   @default("pending")
  reviewNotes                 String?  @db.Text
  reviewedBy                  String?
  reviewedAt                  DateTime?
  createdAt                   DateTime @default(now())
  updatedAt                   DateTime @updatedAt
}
```

**TypeScript API:**
```typescript
import {
  generateWikiDraft,
  getPendingDrafts,
  reviewDraft,
  updateDraft,
} from '@/lib/wiki/draft-generator';

// Generate draft
const draft = await generateWikiDraft('bar_123', 'BAR', {
  maxLineageDepth: 5,
  includeUsageExamples: true,
  tone: 'technical',
});

// List pending drafts
const pending = await getPendingDrafts();

// Review draft
const reviewed = await reviewDraft(
  'draft_id',
  'approved',
  'admin_user',
  'Looks good!'
);

// Update draft content
const updated = await updateDraft('draft_id', {
  summary: 'Updated summary...',
});
```

**Integration with Artifact Pages:**

Future enhancement: Add "Generate Wiki Draft" button to artifact pages (`/wiki/artifacts/:id`) that calls the generation API and redirects admins to the review page.

---

## Next Steps

1. **Annotate existing routes** - Start with high-priority player-facing routes
2. **Run validation** - Check coverage with `npm run validate:routes`
3. **Build registry** - Generate the grimoire with `npm run build:registry`
4. **Analyze quality** - Review completeness with `npm run analyze:routes`
5. **View dashboard** - Explore metrics with `npm run coverage:dashboard`
6. **Verify integration** - Ensure build pipeline includes validation

---

## References

- **Strand Results:** `/Users/nathan.neibauer/code/claude/he360-dodo/strand-results/active/STRAND_e0093cb3.json`
- **Implementation Plan:** `/.claude/plans/structured-dancing-porcupine.md`
- **5-Dimensional Ontology:** `ARCHITECTURE.md § Conceptual Model`
- **Provenance Model:** `ARCHITECTURE.md § Core Objects → BAR (Kernel)`
