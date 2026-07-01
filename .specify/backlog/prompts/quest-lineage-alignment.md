# Prompt: Quest Lineage & Shadow Alignment (QLA)

**Use when implementing the QLA loop:** unify the Vault, make Tap-the-Vein commits *born as quests*
carrying lens lineage, hang every quest on a weekly lens goal (rolling up week→month→quarter→year),
and surface out-of-alignment work as **shadow quests**.

## Context
- Spec/plan/tasks: [.specify/specs/quest-lineage-alignment/](../../specs/quest-lineage-alignment/)
- Extends **1.45 CGLA** (fragmented inventory, TTV islanded); **supersedes** the manual upgrade
  ceremony of **2.11 TTVU**. Builds on PR #158 lenses lineage.
- Substrate already exists — this is connective tissue, not new foundations:
  `CustomBar{type:'quest', lensId, lensGoalId, plantSnapshot}`, `LensGoal{cadence, parentGoalId}`,
  `buildLensGoalSnapshot` (walks week→year), `PlayerQuest`, lenses descent action.

## Decisions (locked)
- **Vault canonical** — one inventory; `/bars` list redirects to `/vault`; retire the 50-cap.
- **Born as quest at commit** — `commitTask` mints `type='quest'` via shared `mintQuestFromText`.
- **Weekly attachment required** — a quest hangs on a `week`-cadence `LensGoal`; else it's shadow.
- **Lineage never lost** — `growQuestFromBar` + mint path copy `lensId/lensGoalId/plantSnapshot`.

## Known bug this kills
`growQuestFromBar` currently hardcodes `lensId`/`lensGoalId` to null → quests lose their lineage.

## Prompt text
> Implement per [.specify/specs/quest-lineage-alignment/tasks.md](../../specs/quest-lineage-alignment/tasks.md)
> in phase order. **API-first**: land `mintQuestFromText`, `getVaultInventory`, and the quest actions
> before UI. Phase 1 (unify Vault + lineage fix) has **no schema change** and ships first. Phase 2
> adds the `add_quest_shadow_alignment` migration (author DB-free per docs/PRISMA_MIGRATE_STRATEGY.md;
> `db push` forbidden) and makes commits born-as-quests. Phase 3 adds shadow surfacing + rollup +
> the `cert-quest-lineage-alignment-v1` verification quest. Each phase: `npm run build` + `npm run check`.

## Checklist (phase order)
- [ ] P1: `mintQuestFromText` · `growQuestFromBar` lineage fix + test · `getVaultInventory` ·
  Vault renders from it (cap removed) · `/bars`→`/vault` redirect
- [ ] P2: migration (`shadowAcknowledgedAt` + indexes) · `commitTask` mints quests w/ weekly
  attachment · `/bars/[id]` renders quests + lineage · `upgradeTaskToQuest` idempotent
- [ ] P3: shadow room + fold-in/acknowledge · `alignmentType` display · `getGoalRollup` in
  Observatory · `cert-quest-lineage-alignment-v1`

## Reference
- Inventory: `src/app/vault/page.tsx`, `src/lib/vault-queries.ts`, `src/actions/bars.ts`
  (`listMyBars`, `growQuestFromBar`, `getBarDetail`).
- TTV/quests: `src/actions/tap-the-vein.ts`, `src/app/quest/**`, `PlayerQuest`.
- Lenses: `src/lib/lenses/lineage.ts`, `src/actions/lens-goals.ts`, `src/app/observatory/**`.
- Prisma discipline: [prisma-migration-discipline](../../../.agents/skills/prisma-migration-discipline/SKILL.md),
  [PRISMA_MIGRATE_STRATEGY](../../../docs/PRISMA_MIGRATE_STRATEGY.md).
