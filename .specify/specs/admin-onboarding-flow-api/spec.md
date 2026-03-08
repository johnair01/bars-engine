# Spec: Admin Onboarding Flow API

## Purpose

Expose the Bruised Banana onboarding template structure via an API so the admin onboarding page can display it. The template (`.twee` draft) is the source of truth; the API translates it to Flow JSON. API-first: contract before UI.

**Problem**: The admin onboarding page shows DB-driven orientation threads (Conclave language). The Bruised Banana draft structure is not reflected. Admins need to see the intended onboarding flow from the template.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Source of truth | `content/twine/onboarding/bruised-banana-onboarding-draft.twee` — translated via `translateTweeToFlow()` |
| API surface | Route Handler (`GET /api/admin/onboarding/flow`) — external consumers, tooling, future reuse |
| Campaign param | `?campaign=bruised-banana` — only supported value for now; 400 for unknown |
| Node ordering | Follow `start_node_id` and `actions[].next_node_id` for display order |

## API Contracts (API-First)

### GET /api/admin/onboarding/flow

**Input**: Query param `campaign` (required). Values: `bruised-banana`.

**Output**: `FlowOutput` (flow_id, campaign_id, start_node_id, nodes, completion_conditions, expected_events).

```ts
// Response shape (FlowOutput from src/lib/twee-to-flow/types.ts)
{
  flow_id: string
  campaign_id: string
  start_node_id: string
  nodes: FlowNode[]
  completion_conditions: CompletionCondition[]
  expected_events: string[]
}
```

- **Route Handler**: `NextResponse.json(flow)` on success; `400` for unknown campaign; `500` on translation error.
- **Implementation**: Read twee file from `content/twine/onboarding/bruised-banana-onboarding-draft.twee`, call `translateTweeToFlow()`, return result.

## User Stories

### P1: Admin sees template structure

**As an admin**, I want the onboarding page to show the Bruised Banana template structure (Arrival, The Work, The Invitation, etc.), so I can see the intended flow alongside DB-driven threads.

**Acceptance**: Visit `/admin/onboarding`; see "Template Structure (Bruised Banana)" section with nodes in traversal order; copy reflects the draft.

### P2: API returns flow for tooling

**As a developer or tool**, I want `GET /api/admin/onboarding/flow?campaign=bruised-banana` to return valid FlowOutput JSON, so I can consume the structure programmatically.

**Acceptance**: `curl` the endpoint returns 200 with valid FlowOutput; nodes include id, type, copy, actions.

## Functional Requirements

### Phase 1: API

- **FR1**: Create `GET /api/admin/onboarding/flow` route. Query param `campaign` required. Return 400 when `campaign` is missing or not `bruised-banana`.
- **FR2**: Read `content/twine/onboarding/bruised-banana-onboarding-draft.twee`, call `translateTweeToFlow()`, return JSON. Use `fs.readFileSync` or `readFile` from `fs/promises` with `path.join(process.cwd(), 'content/twine/onboarding/bruised-banana-onboarding-draft.twee')`.
- **FR3**: On success, return `NextResponse.json(flow)` with `Content-Type: application/json`.

### Phase 2: Admin UI

- **FR4**: Create client component `OnboardingFlowTemplate` that fetches the flow API on mount and renders a "Template Structure (Bruised Banana)" section.
- **FR5**: Use the same timeline UI pattern as the existing orientation path (numbered steps, vertical line, node dots). For each node: show `node.id`, `node.type`, truncated `node.copy`, first action labels.
- **FR6**: Add the component to the admin onboarding page above or alongside "Primary Orientation Path". Section heading: "Template Structure (Bruised Banana)" with note that this reflects the onboarding draft.
- **FR7**: Handle loading and error states in the client component.

### Phase 3: Node ordering

- **FR8**: Display nodes in traversal order. Build ordered list from `start_node_id` following `actions[].next_node_id`, or use array order if it already matches the draft.

## Non-Functional Requirements

- No schema changes. Read-only from filesystem.
- Admin page only; no auth enforcement required initially (admin routes are typically behind auth middleware).

## Verification Quest (required for UX features)

- **ID**: `cert-admin-onboarding-flow-api-v1`
- **Steps**:
  1. Visit `/admin/onboarding` as admin.
  2. Confirm "Template Structure (Bruised Banana)" section is visible.
  3. Confirm nodes (e.g. Arrival, The Work, The Invitation) appear in order.
  4. Confirm `GET /api/admin/onboarding/flow?campaign=bruised-banana` returns valid JSON (e.g. via browser or curl).
  5. Complete quest to receive reward.
- **Narrative**: Verify the onboarding flow API so admins can see the Bruised Banana template structure when preparing the residency launch.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- `src/lib/twee-to-flow/translateTweeToFlow.ts`
- `content/twine/onboarding/bruised-banana-onboarding-draft.twee`

## References

- [bruised-banana-onboarding-draft-integration.md](docs/architecture/bruised-banana-onboarding-draft-integration.md)
- [src/app/admin/onboarding/page.tsx](src/app/admin/onboarding/page.tsx)
- [src/lib/twee-to-flow/types.ts](src/lib/twee-to-flow/types.ts)
