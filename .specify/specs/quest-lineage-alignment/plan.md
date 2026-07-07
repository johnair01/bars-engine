# Plan: Quest Lineage & Shadow Alignment (QLA)

> Implement per [spec.md](./spec.md). **API-first**: land the server actions + shared
> `mintQuestFromText` and the unified `getVaultInventory` read-model before any UI. Ship in three
> independently-mergeable phases so the immediate inventory/lineage bug (Phase 1) can go out first.

## Architectural strategy

The substrate already exists (`CustomBar.type='quest'`, `lensGoalId`, `plantSnapshot`; `LensGoal`
cadence + `parentGoalId`; `buildLensGoalSnapshot`; `PlayerQuest`). QLA is **connective tissue**, not
new foundations. Two principles:

1. **One canonical inventory home — without flattening the move-rooms.** The Vault is already a
   deliberate five-move room dashboard (`loadVaultCoreData` + `VaultMoveDashboard` →
   `/vault/charges|open-up|drafts|quests|…`). Do **not** replace it with a flat list. Instead add a
   canonical **"All BARs"** room (a new `getVaultInventory` read-model reusing `listMyBars`
   semantics, with a `room` discriminator derived from `type` + maturity +
   `lensGoalId`/`shadowAcknowledgedAt`), retire the 50-cap with cursor pagination, and **redirect
   `/bars` → the Vault** so there is one home. Keep `/bars/[id]` detail. The existing move-rooms are
   preserved; `getVaultInventory` powers the new room + lobby counts, not a wholesale rewrite.
2. **One mint path.** Extract `mintQuestFromText` so TTV commit and `growQuestFromBar` create quests
   the *same* way — always copying lineage. This is where the "lineage loss" bug dies.

Alignment is **derived, not duplicated**: `aligned = quest.lensGoalId → active LensGoal with
cadence='week'`. The only persisted alignment state is `shadowAcknowledgedAt` (player chose to keep
an unaligned quest). Rollup is a read-time aggregation up `parentGoalId` — never a stored cache.

### Room derivation (getVaultInventory)
| Room | Predicate |
|------|-----------|
| `quests` | `type='quest'` AND aligned (valid weekly `lensGoalId`) |
| `shadow` | `type='quest'` AND NOT aligned (null/invalid weekly goal) |
| `garden` | `gardenId` set OR maturity ∈ {context_named, elaborated} |
| `seeds` | remaining `type∈{bar,charge_capture}`, maturity ∈ {captured, shared_or_acted} (Hand/Vault) |

## File impacts

**New**
- `src/lib/quests/mint.ts` — `mintQuestFromText` (shared).
- `src/actions/vault.ts` — `getVaultInventory` (+ `VaultItemDTO`, `VaultRoom`).
- `src/actions/quests.ts` — `getQuestLineage`, `listShadowQuests`, `foldQuestIntoGoal`,
  `acknowledgeShadowQuest`, `getGoalRollup`.
- `src/lib/quests/__tests__/mint.test.ts`, `src/actions/__tests__/quest-lineage.test.ts`.
- `scripts/seed-cert-quest-lineage-alignment.ts` + Twine passages (verification quest).

**Modified**
- `prisma/schema.prisma` — `CustomBar.shadowAcknowledgedAt DateTime?`; indexes
  `@@index([creatorId, type, status])`, `@@index([lensGoalId])` (if absent).
- `src/actions/bars.ts` — `growQuestFromBar` copies `lensId/lensGoalId/plantSnapshot`;
  `getBarDetail` allows `type='quest'`.
- `src/actions/tap-the-vein.ts` — `commitTask` → `mintQuestFromText`; `weeklyLensGoalId` in;
  return `{ questId, aligned, placedIn }`; `upgradeTaskToQuest` → idempotent redirect.
- `src/app/vault/page.tsx`, `src/lib/vault-queries.ts`, `src/lib/vault-ui.ts` — render from
  `getVaultInventory`; retire the 50-cap; add rooms.
- `src/app/bars/page.tsx` (+ list sub-routes) — redirect to `/vault`.
- `src/app/bars/[id]/page.tsx` — quest branch: lineage chain, alignment badge, fold-in sheet.
- `src/app/tap-the-vein/TapTheVeinRunner.tsx` — weekly-goal selector/descend in Commit; thread
  `weeklyLensGoalId`; "→ dealt to your hand · aligned to <goal>" note.
- `src/app/observatory/**` (+ `src/app/lenses/**`) — render `getGoalRollup`.

## Phasing (each phase = its own PR, builds green independently)

- **Phase 1 — Foundation** (FR1–FR4): `getVaultInventory` + `/bars`→`/vault` redirect + cap removed;
  `growQuestFromBar` lineage fix + `mintQuestFromText` extraction + regression test. *Ships the
  user-visible inventory fix and stops lineage loss with zero schema change.*
- **Phase 2 — Born as quests** (FR5–FR8): schema migration (`shadowAcknowledgedAt` + indexes);
  `commitTask` mints quests with weekly attachment; `/bars/[id]` renders quests + lineage.
- **Phase 3 — Shadow & rollup** (FR9–FR12): shadow room + fold-in/acknowledge; `alignmentType`
  display; `getGoalRollup` in Observatory; verification quest seeded.

## Risks & mitigations
- **Behavior change to `commitTask`** (bar→quest): keep the return-shape superset the current TTV UI
  already consumes (`placedIn`), add `questId`/`aligned`; migrate the runner in the same PR.
- **Legacy data**: treat null-lineage quests + old TTV bars as shadow (no destructive backfill);
  optional idempotent backfill script marks obvious weekly matches.
- **Vault query regressions**: cover `getVaultInventory` room predicates with unit tests before
  swapping the page over; keep `chargeRoomWhere` until parity is proven, then delete.

## Verification
- Each phase: `npm run build` + `npm run check` (fail-fix).
- Phase 3: seed + walk `cert-quest-lineage-alignment-v1`.
- Prisma: `npx prisma migrate dev --name add_quest_shadow_alignment` → commit migration →
  `npm run db:sync` → `npm run db:record-schema-hash`.
