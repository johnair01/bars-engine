# Spec: Admin Onboarding Graph View

## Purpose

Replace the linear template display with a graph/tree view that shows branching and convergence. Add actionable links so admins can interface with the onboarding draft. Makes the admin onboarding page deft and interfaceable.

**Problem**: The template section shows a flat linear list. The Bruised Banana draft is a graph (choice nodes with multiple branches, convergence points). Admins cannot see subordinate relationships or take action on nodes.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Source of structure | Existing flow API (`GET /api/admin/onboarding/flow`) — no new API |
| Graph derivation | Deterministic: nodes with multiple actions = choice (branches); multiple nodes → same next = convergence |
| Rendering | Hierarchical: parent → indented children → convergence node |
| Actionable links | "Play draft" → /campaign/twine; "View API" → flow API URL |

## API Contracts (API-First)

No new API. Reuses `GET /api/admin/onboarding/flow?campaign=bruised-banana` (FlowOutput). Each node has `actions[]` with `next_node_id` and `label`. Graph structure is derived client-side.

## User Stories

### P1: Admin sees branching structure

**As an admin**, I want to see which nodes are choice points (multiple branches) and which nodes are convergence points (where branches rejoin), so I understand the flow structure.

**Acceptance**: The Invitation shows 3 branches (Aligned, Curious, Skeptical) under it; all converge to Why Identity Matters. Same for Choose Nation (5 branches), Choose Archetype (6), etc.

### P2: Admin can act on the draft

**As an admin**, I want actionable links on each node or section (Play draft, View API), so I can interface with the content.

**Acceptance**: Section header or card has "Play draft" (→ /campaign/twine) and "View API" (→ flow API). Matches interfaceability of DB-driven section.

## Functional Requirements

### Phase 1: Graph rendering

- **FR1**: Build graph structure from flow: node with N actions (N>1) = choice point; show parent, then N children (indented or grouped), then convergence node.
- **FR2**: Node with 1 action = linear step; render in sequence.
- **FR3**: Use same timeline visual (vertical line, dots) but with indentation for branches. Collapsible optional.
- **FR4**: For each node: show id, type badge, truncated copy, action labels. For choice nodes: show all branch labels.

### Phase 2: Actionable links

- **FR5**: Add "Play draft" link → `/campaign/twine` (opens the Twine player).
- **FR6**: Add "View API" link → `/api/admin/onboarding/flow?campaign=bruised-banana` (opens raw JSON in new tab).
- **FR7**: Place links in section header (alongside subtext) to match DB section's Edit Thread / Config pattern.

## Non-Functional Requirements

- Deterministic: no AI. Structure from flow JSON only.
- Client-side only: no new server routes.

## Verification Quest

- **ID**: `cert-admin-onboarding-graph-view-v1`
- **Steps**: Visit /admin/onboarding; confirm Template Structure shows branching (e.g. Invitation with 3 branches); confirm Play draft and View API links work.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [admin-onboarding-flow-api](.specify/specs/admin-onboarding-flow-api/spec.md)

## References

- [src/app/admin/onboarding/OnboardingFlowTemplate.tsx](src/app/admin/onboarding/OnboardingFlowTemplate.tsx)
- [content/twine/onboarding/bruised-banana-onboarding-draft.twee](content/twine/onboarding/bruised-banana-onboarding-draft.twee)
