# Tasks: Template Library Game Master Placeholders

## Phase 1: Service

- [x] **1.1** Add `getPlaceholderForSlot(nodeId: string): string` in `src/lib/template-library/index.ts`:
  - Map context_* → Shaman, anomaly_* → Challenger, choice → Diplomat, response → Regent, artifact → Architect.
  - Return face-specific guidance string per spec.
- [x] **1.2** In `generateFromTemplate`, replace `text: \`[Edit: ${slot.nodeId}]\`` with `text: getPlaceholderForSlot(slot.nodeId)`.

## Phase 2: Verification

- [ ] **2.1** Generate from template via /admin/templates; confirm each passage shows face-specific placeholder.
- [ ] **2.2** Run cert-template-library-v1 STEP_2; confirm tester sees placeholders when generating.
- [x] **2.3** Run `npm run build` and `npm run check` — fail-fix. (2 pre-existing errors in scripts/verify-avatar-lockstep.ts, unrelated)
