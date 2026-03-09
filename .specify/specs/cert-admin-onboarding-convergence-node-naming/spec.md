# Spec: Admin Onboarding Convergence Node Naming (Certification Feedback)

## Purpose

Fix confusing convergence node naming in the admin onboarding flow API/graph view. Currently convergence nodes are named after the first branch that feeds into them; feedback requests a generic "convergence node" label instead.

## Root cause

- Convergence nodes are auto-named after the first branch in the nodes that branch off of them.
- This is confusing because the name doesn't clearly indicate "convergence" and varies by branch order.
- Admin expects a consistent, descriptive label like "Convergence" or "Convergence Node".

## User story

**As an admin** viewing the onboarding flow graph, I want convergence nodes to be clearly labeled (e.g. "Convergence" or "Convergence Node") rather than named after the first branch, so I can quickly identify where branches merge.

## Functional requirements

- **FR1**: Convergence nodes MUST display a consistent label (e.g. "Convergence", "Convergence Node") in the graph/tree view.
- **FR2**: The label should not depend on which branch is "first"; use a deterministic, semantic name.
- **FR3**: Preserve node IDs for API/backend; only change display label in admin UI.

## Reference

- Feedback source: .feedback/cert_feedback.jsonl
- Quest: cert-admin-onboarding-flow-api-v1, passage: STEP_2
- Related: [admin-onboarding-flow-api](../admin-onboarding-flow-api/spec.md), [admin-onboarding-graph-view](../admin-onboarding-graph-view/spec.md)
