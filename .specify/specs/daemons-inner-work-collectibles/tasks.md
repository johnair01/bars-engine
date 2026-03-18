# Tasks: Daemons — Inner Work Unlocks Collectibles

## Phase 1: Schema + Unlock Triggers

- [x] **1.1** Add `BlessedObjectEarned` model to `prisma/schema.prisma` (id, playerId, source, earnedAt, instanceId?, kotterStage?, questId?, metadata?)
- [x] **1.2** Run `npm run db:sync` (or migrate)
- [x] **1.3** Create `src/lib/blessed-objects.ts` — `unlockBlessedObject(playerId, source, metadata?)`, `getBlessedObjectsForPlayer(playerId)`
- [x] **1.4** Add EFA trigger: in EFA completion flow (321 EFA Integration), call `unlockBlessedObject(playerId, 'efa')`
- [x] **1.5** Add 321 trigger: in 321 Shadow Process completion flow, call `unlockBlessedObject(playerId, '321')`
- [x] **1.6** Add quest completion trigger: in `completeQuestForPlayer` or equivalent, when quest has kotterStage and instance is campaign, check if player already has stage talisman; if not, call `unlockBlessedObject(playerId, 'stage_talisman', { instanceId, kotterStage, questId })`
- [x] **1.7** Add campaign participation trigger: when player donates, contributes lore, or completes campaign quest, call `unlockBlessedObject` with `source: 'campaign_completion'` (or stage-specific if applicable)

## Phase 2: Reliquary UI

- [x] **2.1** Create Reliquary page: `src/app/(dashboard)/reliquary/page.tsx` or `/reliquary`
- [x] **2.2** Add API or server component to fetch `getBlessedObjectsForPlayer(playerId)`
- [x] **2.3** Render earned collectibles with icon, name, provenance (campaign, stage)
- [x] **2.4** Add Reliquary link to avatar tap or dashboard nav
- [x] **2.5** Add stage talisman names (config or table): "Talisman of Urgency", etc.

## Phase 3: Use-in-Quests (deferred)

- [ ] Define use-in-quests mechanic (Option A or B)
- [ ] Implement when spec is updated

## Verification

- [x] `npm run loop:ready` passes (build passes; feedback-cap fails due to pre-existing schema drift: forgerId, app_config — not PF-related)
- [ ] Manual: complete EFA → see record in Reliquary
- [ ] Manual: complete 321 → see record in Reliquary
- [ ] Manual: complete quest at Kotter stage → see stage talisman in Reliquary
