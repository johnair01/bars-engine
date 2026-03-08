# Plan: Admin Onboarding Graph View

## Summary

Refactor OnboardingFlowTemplate to render a graph (choice → branches → convergence) instead of linear. Add Play draft and View API links. Update verification quest.

## Phase 1: Graph structure

### 1.1 Build graph from flow

**File**: `src/app/admin/onboarding/OnboardingFlowTemplate.tsx`

- Replace `buildOrderedNodes` with `buildFlowGraph(flow)` that returns a structure:
  - `LinearNode`: single node, one next
  - `ChoiceGroup`: { parent: FlowNode, branches: { label, node }[], convergenceId: string }
- Algorithm: traverse from start_node_id. When node has actions.length > 1, emit ChoiceGroup; when node has 1 action, emit LinearNode. For ChoiceGroup, all branches share same convergence (actions[0].next_node_id for each branch).
- Build `GraphItem[]`: alternating LinearNode and ChoiceGroup in traversal order.

### 1.2 Render graph

- For LinearNode: render single row (current style).
- For ChoiceGroup: render parent row, then indented children (pl-6 or nested div), then convergence node.
- Use same dot/line visual. Optional: subtle left border for branch group.

## Phase 2: Actionable links

### 2.1 Add links to header

**File**: `src/app/admin/onboarding/OnboardingFlowTemplate.tsx`

- In the card header (below "Reflects the onboarding draft"):
  - "Play draft" → `<Link href="/campaign/twine" target="_blank">Play draft</Link>`
  - "View API" → `<a href="/api/admin/onboarding/flow?campaign=bruised-banana" target="_blank">View API</a>`
- Style: small links, same pattern as Edit Thread / Config (text-xs, hover state).

## Phase 3: Verification quest

### 3.1 Update cert-admin-onboarding-flow-api-v1

**File**: `scripts/seed-cyoa-certification-quests.ts`

- Add step: confirm branching visible (Invitation with 3 branches).
- Add step: confirm Play draft and View API links work.
- Or create new cert-admin-onboarding-graph-view-v1. Simpler: extend existing cert.

## File Summary

| Action | Path |
|--------|------|
| Modify | `src/app/admin/onboarding/OnboardingFlowTemplate.tsx` |
| Modify | `scripts/seed-cyoa-certification-quests.ts` (optional) |
