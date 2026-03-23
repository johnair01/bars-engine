# Tasks: 321 → BAR draft experience

Source: [.specify/specs/321-bar-draft-experience/spec.md](./spec.md) · [.specify/specs/321-bar-draft-experience/plan.md](./plan.md)

## Phase 1 — Derivation

- [x] **1.1** Define `BarDraftFrom321` (exported) alongside or replacing consumer expectations for `Metadata321` prefill; document mapping from old shape.
- [x] **1.2** Implement `deriveBarDraftFrom321` (deterministic): `body`, `systemTitle`, `moveType`, curated `tags`, optional `source321FullText` via legacy concatenation.
- [x] **1.3** Add unit tests with fixed phase2/phase3 snapshots (Runner + Form variants if shapes differ).
- [x] **1.4** Update call sites that currently use `deriveMetadata321` for BAR prefill to use new derivation for **default body/title**; keep legacy export available for “original” panel.

## Phase 2 — Reversibility

- [x] **2.1** Audit `clearSession()` / `sessionStorage` in `Shadow321Runner` and `Shadow321Form` for all artifact branches.
- [x] **2.2** Change lifecycle: session survives **Create BAR** navigation until submit success or explicit discard.
- [x] **2.3** Adjust `CreateBarPageClient` storage read/remove strategy to match 2.2.
- [x] **2.4** Add in-app back control from quick BAR to artifact step where router allows; verify embedded + standalone 321.

## Phase 3 — Quick BAR UI

- [x] **3.1** Add `quickFrom321` (or equivalent) prop to `CreateBarForm` from `/create-bar?from321=1`.
- [x] **3.2** Body-first layout; de-emphasize title (system default, Advanced optional label).
- [x] **3.3** Require allyship domain in quick mode; empty validation message.
- [x] **3.4** Hide nation/archetype gating behind Advanced (or omit in mode).
- [ ] **3.5** Add image upload to quick path when supported by BAR model; otherwise document deferral in spec Non-goals and leave TODO with link.

## Phase 4 — Server

- [x] **4.1** Extend `createCustomBar` to map `systemTitle` → `title` and persist draft metadata (including source 321 blob if product needs it).
- [x] **4.2** Regression: non-321 BAR creation unchanged.

## Phase 5 — Milestone tags (stretch)

- [x] **5.1** Emit `move:` and `domain:` tags from derivation.
- [ ] **5.2** Document consumer hooks for campaign milestones (reference throughput spec).

## Verify

- [x] `npm run check`
- [x] `npm run build`
- [ ] Manual: 321 → Create BAR → back → different artifact path still works with session
