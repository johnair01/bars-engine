# Plan: Admin Certification Suite

## Summary

Complete the Admin Certification Suite: filter completed cert quests from Market available list, prevent launching from Adventures, improve pickup error, add revalidatePath for Restore.

## Implementation (Done)

### Phase 1: Market Filter
- getMarketContent: exclude system quests where player has completed assignment (graveyardIds)
- Filter applied after nation/playbook gating

### Phase 2: Adventures Hard-Lock
- For completed certification quests: render Link to /bars/available instead of /adventures/[id]/play
- Show "Restore in Market to re-run" hint

### Phase 3: pickupMarketQuest Error
- When existing.status === 'completed' && quest.isSystem: return specific error message

### Phase 4: restoreCertificationQuest Revalidate
- Add revalidatePath('/adventures') so Restore refreshes Adventures page

## File Impact

| File | Change |
|------|--------|
| src/actions/market.ts | Filter graveyard from available; pickup error |
| src/actions/admin-certification.ts | revalidatePath /adventures |
| src/app/adventures/page.tsx | Completed cert → link to Market, not play |
