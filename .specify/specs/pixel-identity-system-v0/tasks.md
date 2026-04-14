# Tasks: Pixel identity system v0

- [x] **T1** — Read normative [humanoid_v1_spec.md](../../../docs/conclave/construc-conclave-9/humanoid_v1_spec.md); note any delta vs current 8×64×64 demo implementation.
- [x] **T2** — Add `CharacterIdentity` (and minimal `VisualTokenSet` if needed) TypeScript types; export from `src/lib/pixel-identity/` or agreed module.
- [x] **T3** — Implement resolver that produces current walkable URLs for nation/archetype (and demo override if present).
- [x] **T4** — Unit tests: resolver mapping, golden URLs for a small matrix.
- [x] **T5** — Update [docs/WALKABLE_SPRITES.md](../../../docs/WALKABLE_SPRITES.md) to cite humanoid v1 contract spec.
- [ ] **T6** — Verification quest `cert-pixel-identity-v0`; `npm run check`.
