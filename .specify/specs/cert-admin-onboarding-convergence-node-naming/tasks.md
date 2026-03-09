# Tasks: Admin Onboarding Convergence Node Naming

## Phase 1: Convergence Detection

- [x] Identify how convergence nodes are represented in the onboarding flow structure.
- [x] Add logic to detect convergence (choice items have convergence node from first branch).

## Phase 2: Display Label

- [x] Override display label for convergence nodes to "Convergence".
- [x] Ensure graph/tree view uses the new label (NodeRow displayLabel prop).
- [x] Preserve node IDs for API and navigation (editPassageId uses node.id).

## Verification

- [ ] Run cert-admin-onboarding-flow-api-v1; verify convergence nodes show clear label.
- [ ] No regressions on graph navigation or passage edit.
