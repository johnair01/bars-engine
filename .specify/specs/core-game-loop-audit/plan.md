# Plan: Core Game Loop Audit — remediations

The audit (spec.md) found the loop's mechanics largely exist but are fractured.
Each hole H1–H6 is an independent slice. Build in the recommended order; H1 first.

## H1 — TTV tasks become BARs  *(implement first)*
- `prisma/schema.prisma`: add `TapTheVeinTask.barId String?` → migration
  `add_ttv_task_bar_link` (author DB-free via `migrate diff` per
  docs/PRISMA_MIGRATE_STRATEGY.md; `db push` forbidden).
- `src/actions/tap-the-vein.ts`: `commitTask` also creates a `CustomBar`
  (type `bar`, maturity `captured`, title = task text, creatorId = player)
  reusing the `captureBar` create path; store `barId`; idempotent on `barId`.
- Route `upgradeTaskToQuest` through `growQuestFromBar(task.barId)` so the
  `upgraded_to_quest` status reflects a real quest.
- `TaskCard`: link to `/bars/{barId}`.

## H3 — 3·2·1 from a BAR
- Add a `'321'` action to `src/components/bars/GrowFromBar.tsx` (or a sibling row
  on `/bars/[id]`) linking `/shadow/321?chargeBarId={id}&returnTo=/bars/{id}`.
- Same affordance on the charge card (`src/components/hand/ChargeBarCard.tsx`).

## H2 — unified "all my BARs" view
- New surface aggregating `listMyBars` + charges + quests + garden seeds with
  type/maturity filters. No new persistence. Make it the BAR landing from VAULT.

## H6 — inline tune
- Fold `/bars/[id]/tune` fields into an inline editor on `/bars/[id]`.

## H4 — charge an existing BAR  *(needs model decision — see spec H4)*
- Default: extend `CustomBar.intensity` semantics + an "add charge" affordance on
  tune. No new column.

## H5 — daemon hub  *(graduate to its own spec)*
- `/daemons` discovery/hub; define what non-owned daemons are visible and what
  "connect" grants before building.

## Cross-cutting
- Each user-facing slice ships a `cert-*` verification quest.
- `npm run build` + `npm run check` per slice; migrations committed with schema.
