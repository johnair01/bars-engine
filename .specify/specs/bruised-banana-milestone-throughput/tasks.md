# Tasks: Bruised Banana Milestone Throughput & Player Guidance

Spec: [.specify/specs/bruised-banana-milestone-throughput/spec.md](./spec.md) · Plan: [plan.md](./plan.md)

## North star loop (v1) — contract + QA

Aligned with [spec.md § North star loop](./spec.md#north-star-loop-v1-product-contract) and [plan.md § North star path](./plan.md#north-star-path-traceability).

- [x] **BBMT-NS.0** — Spec + plan: North star definition, loop table, non-goals, verification quest, traceability table.
- [ ] **BBMT-NS.1** — Keep **plan.md** traceability table in sync when `computeGuidedActions` priority or hrefs change (`src/lib/bruised-banana-milestone/guided-actions.ts`).
- [ ] **BBMT-NS.2** — Run the **verification quest** (spec § North star); record outcome (pass / gap list) in PR description, `docs/BRUISED_BANANA_PROGRESS.md`, or a single backlog row per gap.
- [ ] **BBMT-NS.3** — **Gap sweep:** If no step in the quest produces a **honest** collective signal (fundraiser line, board participation flip, onboarding promotion, or persisted hub/spoke state), add **one** tracked follow-up (task or BACKLOG) for the missing wiring — avoid scope creep inside BBMT without a new spec slice.

## Phase 1 — Milestone snapshot + guided-action rules

- [x] **BBMT-1.1** Add `src/lib/bruised-banana-milestone/` (or `src/lib/campaign-milestone/`) with types: `MilestoneSnapshot`, `GuidedAction`.
- [x] **BBMT-1.2** Implement `buildMilestoneSnapshot` + server loader `getCampaignMilestoneGuidance` using `Instance` (goal cents, `kotterStage`, dates) — handle missing instance gracefully.
- [x] **BBMT-1.3** Implement `computeGuidedActions` + `getCampaignMilestoneGuidance(playerId)` with deterministic priority rules (see plan.md); integrate vault cap checks via [vault-limits](../../src/lib/vault-limits.ts).
- [x] **BBMT-1.4** Unit tests: `npm run test:bb-milestone` or fold into existing test runner (pure functions).

## Phase 2 — UI surfaces

- [x] **BBMT-2.1** Dashboard: show `MilestoneSnapshot` + guided actions on home ([`src/app/page.tsx`](../../src/app/page.tsx)); optional props on [`CampaignModal`](../../src/components/dashboard/CampaignModal.tsx) + [`DashboardSectionButtons`](../../src/components/dashboard/DashboardSectionButtons.tsx).
- [x] **BBMT-2.2** [`CampaignHubView`](../../src/components/campaign/CampaignHubView.tsx) — “Next for the residency” strip via [`CampaignMilestoneStrip`](../../src/components/campaign/CampaignMilestoneStrip.tsx).
- [x] **BBMT-2.3** Campaign/hub/board links use `ref=` where applicable (`computeGuidedActions`).

## Phase 3 — Docs, admin, backlog

- [ ] **BBMT-3.1** Optional admin: Instance field or JSON for custom milestone labels (defer if timeboxed).
- [x] **BBMT-3.2** Wiki or `docs/` one-pager: “How Bruised Banana progress works” (link from wiki BB page).
- [x] **BBMT-3.3** Mark [BACKLOG](../../backlog/BACKLOG.md) row BBMT Done when shipped; archive note if superseded.

## Dependency specs (documentation alignment)

- [x] **BBMT-D1** Update [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) — Related: link to this spec; **Purpose** one-liner that hub/spoke **connects** to milestone guidance.
- [x] **BBMT-D2** Update [game-loop-bars-quest-thread-campaign](../game-loop-bars-quest-thread-campaign/spec.md) — Related: collective milestone + placement.
- [x] **BBMT-D3** Update [bruised-banana-quest-map](../bruised-banana-quest-map/spec.md) — Related: guided actions surface container quests.
- [x] **BBMT-D4** Update [bruised-banana-house-integration/ANALYSIS.md](../bruised-banana-house-integration/ANALYSIS.md) — short “Throughput” subsection pointing to BBMT.

## Verification

- [x] `npm run test:bb-milestone`; eslint on touched files clean; run full `npm run check` / `npm run build` before merge.
- [ ] **North star verification quest** — [spec § North star loop](./spec.md#north-star-loop-v1-product-contract) (same as **BBMT-NS.2**); check off when done.
- [ ] Subjective playtest — spec § Acceptance (release gate): player names one action that felt like it moved the residency.
