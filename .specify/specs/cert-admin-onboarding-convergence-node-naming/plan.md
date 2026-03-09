# Plan: Admin Onboarding Convergence Node Naming

## Architecture

- **Detection**: Identify convergence nodes in the graph (nodes with multiple incoming edges, single outgoing or merge point).
- **Labeling**: Use a display label "Convergence" or "Convergence Node" instead of deriving from first branch name.
- **Scope**: Admin graph view and API response (if label is exposed).

## File impacts

| Action | Path |
|--------|------|
| Modify | Admin onboarding graph view component |
| Modify | GET /api/admin/onboarding/flow or equivalent (if label returned) |
| Modify | Node display logic for convergence detection |

## Implementation notes

- May need to add `isConvergence` or `nodeType: 'convergence'` to template structure.
- Or detect at render time: node with multiple incoming edges → show "Convergence" label.
- Keep internal node ID/name for routing; override display name only.
