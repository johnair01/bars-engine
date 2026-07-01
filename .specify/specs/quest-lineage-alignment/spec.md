# Spec: Quest Lineage & Shadow Alignment (QLA)

## Purpose

Make the NOW loop's output *land somewhere real and aligned*. Today a Tap-the-Vein (TTV)
commit mints a `type='bar'` seed that shows on `/bars` but not in the Vault, only becomes a
quest through a separate manual gesture, and — when it does — **loses its lens lineage**
(`growQuestFromBar` nulls `lensId`/`lensGoalId`). There is no surface connecting quests to the
weekly→monthly→quarterly→yearly lens-goal hierarchy, and no way to see work running *out* of
alignment.

QLA closes that loop: **one canonical inventory (Vault)**, **tasks born as quests at commit**
(carrying lineage), **every quest hangs on a weekly lens goal that rolls up week→month→quarter→year**,
and **anything unattached surfaces as a shadow quest** to fold in or knowingly keep.

**Problem**: Inventory drift (Vault ≠ /bars), lineage loss on quest creation, no quest↔lens
surface, no alignment/shadow visibility. Extends **1.45 CGLA** ("fragmented inventory", "TTV
islanded") and supersedes the manual "upgrade ceremony" framing of **2.11 TTVU**.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic
over AI. The entire loop works with no language model.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Inventory surface** | **Vault is the single canonical personal inventory.** A unified `getVaultInventory` read-model replaces the drifted `chargeRoomWhere` (vault) vs `listMyBars` (/bars) split and its 50-item cap asymmetry. Vault shows all owned active `CustomBar`s across **rooms** (Hand/Vault captured seeds · Garden planted · **Quests**). `/bars` and `/bars/*` list routes fold into `/vault` (redirect); the BAR **detail** page stays. |
| **Task → Quest (born at commit)** | A committed TTV task is **born a quest**. `commitTask` calls a shared `mintQuestFromText` that creates `type='quest'` carrying `lensGoalId` + `plantSnapshot`, assigns a `PlayerQuest`, and links `task.questId`. The intermediate `type='bar'` seed step and the separate `upgradeTaskToQuest` gesture are removed from the commit path (kept only as a back-compat no-op / redirect). |
| **Lineage propagation (bug fix)** | `growQuestFromBar` and `mintQuestFromText` **always** copy `lensId` / `lensGoalId` / `plantSnapshot` onto the quest. Quests are never created with null lineage when a source goal exists. |
| **Weekly attachment required** | Every quest **must hang on a `week`-cadence lens goal**. The TTV commit UI requires selecting an active weekly goal (or descending/creating one inline). Month/quarter/year goals are *roll-up targets*, not direct attachment points — a quest attaches at `week`, and the chain resolves upward via `LensGoal.parentGoalId`. |
| **Shadow quest** | A quest with no valid, active, `week`-cadence `lensGoalId` is a **shadow quest** (out of alignment). It is surfaced (Vault "Shadow" room + Quests page) with two moves: **fold in** (attach to an existing weekly goal or descend a new one) or **acknowledge** (keep it, knowingly out of alignment). The dormant `LensGoal.alignmentType` and a new `CustomBar.shadowAcknowledgedAt` back this. |
| **Quest detail page** | Extend `/bars/[id]` to render `type='quest'` (remove the "Not a BAR" block) so quests get a home showing the **lineage chain** (week→month→quarter→year), alignment state, and the fold-in action. No separate detail route. |
| **Rollup** | Display-only in this spec: a `getGoalRollup` read-model aggregates child-quest/goal progress up the cadence chain for the Observatory/Lenses view. **No auto-completion** of parent goals. |
| **Back-compat** | Existing `type='bar'` TTV seeds and legacy quests with null `lensGoalId` are treated as **shadow** (valid state, surfaced for fold-in) — no destructive backfill. |

## Conceptual Model

Game language (WHO/WHAT/WHERE/Energy/Throughput):

| Dimension | In QLA |
|-----------|--------|
| **WHAT** (the work) | **Quests** (`CustomBar type='quest'`). A TTV task is a nascent quest. |
| **WHERE** (alignment) | The **lens-goal lineage**: `year → quarter → month → week` per domain (relationships / career / money / health / allyship). A quest lives at **week**. |
| **Energy** | Vibeulons (unchanged; TTV Tier-2 economy `2.08 TTVE` mints on completion — orthogonal). |
| **Throughput** | Tap the Vein = the morning **Open Up / Clean Up** ritual whose Commit is a **Show Up** seed. Quests are Show Up. |

```
Tap the Vein (freewrite → brainstorm → COMMIT)
        │  mintQuestFromText (born as quest, carries lineage)
        ▼
   Quest (CustomBar type='quest')
        │  hangs on ─────────────► Weekly LensGoal ──parentGoalId──► Month ──► Quarter ──► Year
        │                                (aligned)
        └─ no weekly goal? ──────► SHADOW QUEST ──► fold in (attach/descend) │ acknowledge (keep)
        ▼
   Vault (canonical inventory: Hand/Vault · Garden · Quests · Shadow rooms)
```

## API Contracts (API-First)

All are **Server Actions** (`'use server'`, `{ data } | { error }`) unless noted. Define shapes
before UI.

### `mintQuestFromText` (shared helper, not exported to client)
```ts
// src/lib/quests/mint.ts
function mintQuestFromText(
  playerId: string,
  text: string,
  opts: { weeklyLensGoalId?: string | null; sourceTaskId?: string | null; sourceBarId?: string | null }
): Promise<{ questId: string }>
// Creates CustomBar{type:'quest'}, copies lensId/lensGoalId/plantSnapshot from the weekly goal
// (via buildLensGoalSnapshot), creates PlayerQuest{status:'assigned'}, links sourceTaskId.questId.
// If weeklyLensGoalId is absent/invalid → quest is created as SHADOW (lensGoalId null).
```

### `commitTask` (modified — src/actions/tap-the-vein.ts)
```ts
function commitTask(input: {
  text: string
  weeklyLensGoalId?: string | null      // NEW — must be a week-cadence active goal to be aligned
  lensLevel?: string | null; lensCategory?: string | null; lensFaceKey?: string | null
}): Promise<TtvResult<{ task: TtvTaskDTO; questId: string; aligned: boolean; placedIn: 'hand' | 'vault' }>>
// Now mints a QUEST (not a bare bar). aligned=false when no valid weekly goal → shadow.
```

### `getVaultInventory` (new — src/actions/vault.ts)
```ts
type VaultRoom = 'seeds' | 'garden' | 'quests' | 'shadow'
function getVaultInventory(input: { room?: VaultRoom; cursor?: string; take?: number }):
  Promise<TtvResult<{ items: VaultItemDTO[]; nextCursor: string | null; counts: Record<VaultRoom, number> }>>
// Single canonical query over owned active CustomBars. Paginated (replaces the 50-cap).
```

### `getQuestLineage` (new — src/actions/quests.ts)
```ts
function getQuestLineage(questId: string): Promise<TtvResult<{ trace: LensGoalTrace | null; aligned: boolean }>>
// Reuses buildLensGoalSnapshot to walk week→month→quarter→year.
```

### `listShadowQuests` / `foldQuestIntoGoal` / `acknowledgeShadowQuest` (new — src/actions/quests.ts)
```ts
function listShadowQuests(): Promise<TtvResult<{ quests: VaultItemDTO[] }>>
function foldQuestIntoGoal(input: { questId: string; weeklyLensGoalId: string }): Promise<TtvResult<{ aligned: true }>>
function acknowledgeShadowQuest(questId: string): Promise<TtvResult<{ shadowAcknowledgedAt: string }>>
```

- **Route vs Action**: all Server Actions (React/`useTransition` surfaces). No external/webhook
  surface → no Route Handlers.

## User Stories

### P1: The commit lands as an aligned quest
**As a player**, after I commit a move in Tap the Vein, I want it to become a **quest attached to
this week's goal** and appear in my Vault, so my daily work is visibly part of a larger arc.
**Acceptance**: Committing with a selected weekly goal creates a `type='quest'` CustomBar with that
`lensGoalId`, a `PlayerQuest`, `task.questId` set; it shows in Vault → Quests; its detail page shows
the week→year lineage; `aligned=true`.

### P1: One inventory
**As a player**, I want the Vault to show **everything** (seeds, planted, quests, shadow), so I
never lose work to a second hidden list. **Acceptance**: Every owned active CustomBar reachable from
the old `/bars` is reachable in `/vault`; `/bars` redirects; pagination (no silent 50-cap drop).

### P1: Shadow quests surface and fold in
**As a player**, when a quest isn't tied to a weekly goal, I want it flagged as a **shadow quest**
with a one-tap **fold-in**, so out-of-alignment work is visible and resolvable. **Acceptance**: a
quest with null/invalid weekly `lensGoalId` appears in the Shadow room; `foldQuestIntoGoal` attaches
it and moves it to Quests; `acknowledgeShadowQuest` keeps it flagged but sets `shadowAcknowledgedAt`.

### P2: Lineage & rollup visible in the Observatory
**As a player**, I want each weekly goal to show the quests hanging on it and roll progress up to
month/quarter/year, so I can see the arc filling in. **Acceptance**: `getGoalRollup` returns child
counts/progress per cadence; Observatory renders it (display-only).

## Functional Requirements

### Phase 1: Foundation — unify inventory + stop losing lineage
- **FR1**: `getVaultInventory` server action: single query over owned active CustomBars, room
  filter + cursor pagination + per-room counts. `/vault` renders from it.
- **FR2**: `/bars` and `/bars` list sub-routes redirect to `/vault` (detail `/bars/[id]` retained).
- **FR3**: `growQuestFromBar` copies `lensId`/`lensGoalId`/`plantSnapshot` from source BAR onto the
  quest (never null when source has them). Regression-guard test.
- **FR4**: Extract `mintQuestFromText` (`src/lib/quests/mint.ts`) shared by grow + TTV paths.

### Phase 2: Tasks born as quests + weekly attachment + quest detail
- **FR5**: `commitTask` mints a quest via `mintQuestFromText` (not a bare bar), threads
  `weeklyLensGoalId`, returns `{ questId, aligned, placedIn }`; links `task.questId`.
- **FR6**: TTV Commit UI requires/encourages selecting an **active weekly goal**; offers inline
  "descend a weekly goal" when none exist for the chosen domain (reuse lenses descent action).
- **FR7**: `/bars/[id]` renders `type='quest'` (remove the type gate): show lineage chain
  (`getQuestLineage`), alignment badge, and fold-in when shadow.
- **FR8**: `upgradeTaskToQuest` retained as back-compat (idempotent redirect to the quest;
  no double-mint).

### Phase 3: Shadow surfacing, fold-in, rollup, verification
- **FR9**: `listShadowQuests`, `foldQuestIntoGoal`, `acknowledgeShadowQuest`; Vault **Shadow** room
  + a Quests surface listing aligned vs shadow.
- **FR10**: Wire `LensGoal.alignmentType` display + `CustomBar.shadowAcknowledgedAt`.
- **FR11**: `getGoalRollup` read-model; Observatory/Lenses render child progress up the chain
  (display-only, no auto-complete).
- **FR12**: Verification quest `cert-quest-lineage-alignment-v1` (see below).

## Non-Functional Requirements

- **Backward compatibility**: legacy `type='bar'` TTV seeds and quests with null `lensGoalId` are
  valid **shadow** items — no destructive migration; a one-time optional backfill script may mark
  obvious matches but is not required.
- **Performance**: Vault must paginate (cursor), never silently cap. Lineage/rollup reads are
  bounded (≤4 cadence hops; batch parent lookups).
- **Dual-track**: no AI anywhere in the loop.
- **Security**: every action scoped to `getCurrentPlayer()`; ownership checked on quest/goal ids.

## Persisted data & Prisma (required — schema changes)

> Process contract: ship the migration with the schema, or `migrate deploy` breaks prod. See
> [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md).

**Additive only** (`CustomBar`):
- `shadowAcknowledgedAt DateTime?` — player knowingly kept an out-of-alignment quest.
- (Verify/keep) `lensGoalId String?` index for the Vault/quest-by-goal queries — add
  `@@index([creatorId, type, status])` and `@@index([lensGoalId])` if absent.

No new models (reuse `CustomBar`, `PlayerQuest`, `LensGoal`, `TapTheVeinTask`). `alignmentType`
already exists on `LensGoal`.

| Check | Done |
|-------|------|
| Prisma fields named above (`shadowAcknowledgedAt`, indexes) | ☐ |
| `tasks.md` includes `npx prisma migrate dev --name add_quest_shadow_alignment` + commit `prisma/migrations/…` | ☐ |
| `npm run db:sync` after schema edit; `npm run check` | ☐ |
| Human glanced at migration.sql (additive) | ☐ |

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Vault list size | Cursor pagination; per-room counts via `groupBy`, not full scans |
| Lineage reads | Bounded ≤4 hops; batch `parentGoalId` lookups (no N+1) |
| AI | None used — dual-track |

## Verification Quest (required — UX feature)

- **ID**: `cert-quest-lineage-alignment-v1`
- **Steps** (Twine passages, one per step; final passage no-link mints reward):
  1. Open Tap the Vein, freewrite, brainstorm, and **commit a move** with this week's goal selected.
  2. Open **Vault → Quests**; confirm the committed move appears as a **quest**.
  3. Open the quest; confirm the **lineage chain** (week → month → quarter → year) renders.
  4. Commit a move with **no weekly goal**; confirm it appears in **Vault → Shadow** as a shadow quest.
  5. **Fold it in** to a weekly goal; confirm it moves to Quests and shows `aligned`.
- **Narrative framing** (Bruised Banana Fundraiser): "Verify the daily loop so party guests can
  turn a morning check-in into an aligned quest — proving the engine before the residency launch."
- **Structure**: TwineStory + CustomBar `isSystem:true`, `visibility:'public'`, id
  `cert-quest-lineage-alignment-v1`, idempotent seed (`seed:cert:quest-lineage-alignment`).
  Reference: [cyoa-certification-quests](../cyoa-certification-quests/).

## Dependencies

- **1.45 CGLA** (Core Game Loop Audit) — this realizes H1/H2 (TTV→BAR, unified inventory) and
  extends them to quests+lineage.
- **PR #158 lenses lineage** — `LensGoal` cadence/`parentGoalId`, `buildLensGoalSnapshot`,
  `resolveLensGoalTrace`, lenses descent action.
- **2.11 TTVU** — superseded (born-as-quest replaces the manual upgrade ceremony).

## References

- Inventory: `src/app/vault/page.tsx`, `src/lib/vault-queries.ts` (`chargeRoomWhere`,
  `VAULT_SERVER_LIST_CAP`), `src/actions/bars.ts` (`listMyBars`), `src/app/bars/page.tsx`.
- Quests: `src/actions/bars.ts` (`growQuestFromBar`), `src/actions/tap-the-vein.ts`
  (`commitTask`, `ensureBarForTask`, `upgradeTaskToQuest`), `PlayerQuest`, `src/app/quest/**`.
- Lenses: `src/lib/lenses/lineage.ts`, `lineage-types.ts`, `workshop.ts`, `ensure.ts`,
  `src/actions/lens-goals.ts`, `src/app/observatory/**`, `src/app/lenses/**`.
- Detail: `src/app/bars/[id]/page.tsx`, `src/actions/bars.ts` (`getBarDetail`).
- Prisma: `prisma/schema.prisma` (`CustomBar` 294–460, `LensGoal` 651–679, `PlayerQuest` 1169–1184,
  `TapTheVeinTask` 702–747).
- Workflow: [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md),
  [fail-fix-workflow](../../../.cursor/rules/fail-fix-workflow.mdc).
