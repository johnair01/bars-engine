# Tasks — Avatar Paper Doll Coherence (PDC)

Check off in order within each phase unless parallelized.

## Phase 0 — Anchor contract

- [ ] **PDC-0.1** — Add `docs/PORTRAIT_SPRITE_ANCHOR.md` (or dedicated section in `docs/SPRITE_ASSETS.md`): 64×64 grid, centerline, ground line, head/torso bands.
- [ ] **PDC-0.2** — Optional: add `public/sprites/parts/_reference/anchor-guide.png` for artists.
- [ ] **PDC-0.3** — Link from [spec.md](./spec.md) and from `docs/WALKABLE_SPRITES.md` / `SPRITE_ASSETS.md` (“portrait vs walkable” one-liner).

## Phase 1 — Asset audit

- [ ] **PDC-1.1** — Inventory all portrait part PNGs (five directories).
- [ ] **PDC-1.2** — Pass/fail/re-export table; prioritize base + nation_body.
- [ ] **PDC-1.3** — Re-export or approve offset-debt list for remaining assets.

## Phase 2 — Code

- [ ] **PDC-2.1** — Extend `PartSpec` + `getAvatarPartSpecs` with optional `offsetX`, `offsetY` (and optional `getPartLayoutOverrides` / JSON manifest).
- [ ] **PDC-2.2** — Update `Avatar.tsx` to apply per-layer transforms inside the circular clip.
- [ ] **PDC-2.3** — Deduplicate: route `CharacterCreatorAvatarPreview` / `OnboardingAvatarPreview` through shared layering helper if they duplicate `Avatar` logic.
- [ ] **PDC-2.4** — Fill manifest from Phase 1 debt; default all zeros for clean assets.

## Phase 3 — Validation & QA

- [ ] **PDC-3.1** — Run `npx tsx scripts/validate-sprite-layers.ts`; fix any new failures from art changes.
- [ ] **PDC-3.2** — Optional: extend validator (alpha heuristics) — only if stable; else skip.
- [ ] **PDC-3.3** — Manual QA: `/`, character creator, `/hand`, campaign avatar preview.
- [ ] **PDC-3.4** — Optional screenshot / visual regression test for `Avatar`.

## Phase 3b — Verification quest (Spec Kit Translator)

- [ ] **PDC-VQ.1** — Implement `cert-paper-doll-coherence-v1` per [spec.md — Verification Quest](./spec.md#verification-quest).
- [ ] **PDC-VQ.2** — Idempotent seed + npm script; follow patterns in [cyoa-certification-quests](../cyoa-certification-quests/).
- [ ] **PDC-VQ.3** — Run quest once end-to-end before marking PDC done.

## Phase 4 — ARDS

- [ ] **PDC-4.1** — Cross-link anchor + offset schema to ARDS Portrait register when available.
- [ ] **PDC-4.2** — Update [BACKLOG.md](../../backlog/BACKLOG.md) row 1.42 status when shipped.
