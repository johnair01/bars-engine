# Tasks: Humanoid v1 walkable contract

- [x] **T1** — Audit `argyra-bold-heart` (and any other walkable PNGs) vs humanoid v1 dimensions and frame order; record in spec or WALKABLE_SPRITES if legacy.
- [x] **T2** — Add export metadata JSON sidecar(s) per humanoid_v1_spec template.
- [x] **T3** — Implement validation script (512×64 strip, 8 frames, optional JSON schema check).
- [x] **T4** — Add `package.json` script e.g. `sprites:validate-humanoid` and run in CI or document for release checklist.
- [x] **T5** — Confirm Pixi draw position uses anchor (32,56) or document transform if using different internal coords.
- [ ] **T6** — Verification quest `cert-humanoid-v1-contract-v1`; `npm run check` if TS touched.
