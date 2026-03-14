# Plan: Daemons — Inner Work Unlocks Collectibles

## Summary

Implement the blessed objects system: schema for earned collectibles, unlock triggers per inner work type, and Reliquary UI. Use-in-quests is Phase 2.

## Implementation Order

### Phase 1: Schema + Unlock Triggers

1. **Schema**: Add `BlessedObjectEarned` model to Prisma schema.
2. **EFA trigger**: On EFA completion (321 EFA Integration flow), create `BlessedObjectEarned` with `source: 'efa'`.
3. **321 trigger**: On 321 Shadow Process completion, create with `source: '321'`.
4. **Quest completion trigger**: On quest completion, if quest has `kotterStage` and instance is campaign, check if player already has this stage talisman; if not, create with `source: 'stage_talisman'`.
5. **Campaign participation trigger**: On donate, lore contribution, or campaign quest completion, create with `source: 'campaign_completion'` (or stage-specific).

### Phase 2: Reliquary UI

6. **Reliquary route**: Add `/reliquary` or entry via avatar tap.
7. **Reliquary page**: Query `BlessedObjectEarned` for player; show icon, name, provenance (campaign, stage).
8. **Nav**: Add Reliquary link to avatar or dashboard nav.

### Phase 3: Use-in-Quests (deferred)

9. Define use-in-quests mechanic (Option A or B); implement when spec is updated.

## File Impacts

| Action | File |
|--------|------|
| Edit | `prisma/schema.prisma` — add BlessedObjectEarned |
| Create | `src/lib/blessed-objects.ts` — unlock helpers, queries |
| Edit | EFA completion flow — call unlock |
| Edit | 321 completion flow — call unlock |
| Edit | Quest completion flow — call unlock |
| Edit | Campaign participation flows — call unlock |
| Create | `src/app/reliquary/page.tsx` | `src/app/(dashboard)/reliquary/page.tsx` |
| Edit | Avatar/dashboard nav — link to Reliquary |

## Verification

- [ ] BlessedObjectEarned model exists; migration applied
- [ ] EFA completion creates record
- [ ] 321 completion creates record
- [ ] Quest completion at Kotter stage creates stage talisman
- [ ] Reliquary page shows earned collectibles with provenance
- [ ] loop:ready passes
