# Tasks: Campaign branch seeds

## Phase 0 — Spec & backlog

- [x] **CBS-0.1** — Lock **FR5** visibility choice in `plan.md` (recommend hybrid C) and remove ambiguity in `spec.md` if needed.
- [x] **CBS-0.2** — Add **BACKLOG.md** row (ID **1.54 CBS**) linking to this spec kit.
- [x] **CBS-0.3** — Add “See also” link from [player-facing-cyoa-generator/spec.md](../player-facing-cyoa-generator/spec.md) to CBS (one paragraph).

## Phase 1 — Schema + plant

- [ ] **CBS-1.1** — Add Prisma models `CampaignBranchSeed` + `CampaignBranchSeedWater` (or chosen names) with indexes on `(adventureId, nodeId)`, `planterPlayerId`, `status`, `createdAt`.
- [ ] **CBS-1.2** — Run migration workflow per [fail-fix workflow](../../../../.cursor/rules/fail-fix-workflow.mdc) (`db:sync` local; `migrate dev` before ship).
- [ ] **CBS-1.3** — Implement `plantCampaignBranchSeed` server action: validate auth, lengths, adventure/node existence, rate limit stub.
- [ ] **CBS-1.4** — `CampaignReader`: **broken path** UI — primary “Plant a seed” + preserve login redirect.
- [ ] **CBS-1.5** — `CampaignReader`: **quiet** “Suggest a branch” entry (secondary, non-intrusive per UI_COVENANT when styling).

## Phase 2 — Water + visibility

- [ ] **CBS-2.1** — Implement `waterCampaignBranchSeed` with role resolution (`player` | `steward` | `admin`).
- [ ] **CBS-2.2** — Implement `listSeedsForNode` / player-facing seed summary per **FR5** decision.
- [ ] **CBS-2.3** — Steward queue page or panel: list by campaign/adventure, sort by **weighted score** + recency.
- [ ] **CBS-2.4** — Actions: archive/decline seed (steward/admin only) with optional reason.

## Phase 3 — Metabolize

- [ ] **CBS-3.1** — Steward “Metabolize” opens authoring flow with **prefill** from seed (text, suggested `nodeId` / `targetId`).
- [ ] **CBS-3.2** — On graph save, run existing **UGA** validation path; no bypass.
- [ ] **CBS-3.3** — Mark seed `metabolized`, store `resultingPassageIds` (and/or choice patch metadata).

## Phase 4 — Hardening

- [ ] **CBS-4.1** — Rate limits + basic logging/metrics for plant/water.
- [ ] **CBS-4.2** — Document steward runbook snippet (where queue lives, how to metabolize).

## Phase 5 — Agents (optional)

- [ ] **CBS-5.1** — Optional draft-from-seed helper (human-in-the-loop only).

## Verification

- [ ] **CBS-V.1** — `npm run check` && `npm run build` after Phases 1–3.
- [ ] **CBS-V.2** — Manual E2E: broken link → plant → steward water → metabolize → playthrough succeeds.
