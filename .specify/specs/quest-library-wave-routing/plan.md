# Plan: Quest Library Wave Routing and Training

## Summary

Route book-derived quests by move type to EFA pool, Dojo pool, Discovery pool, and Gameboard. Add questPool to CustomBar; auto-assign on approve. Surface EFA pool in EFA UI. Admin discovery queue for Wake Up quests. Model quests and auto-suggest edits are Phase 2+.

## Phases

### Phase 1: Schema and routing (foundation)

- Add `questPool` to CustomBar: `String?` — values: 'efa', 'dojo', 'discovery', 'gameboard'. Null = legacy.
- In `approveQuest` or equivalent (book-quest-review): when status → active, set questPool from moveType.
- Mapping: cleanUp→efa, growUp→dojo, showUp→gameboard, wakeUp→discovery.
- Run `npm run db:sync` after schema change.
- Verify: book quests publish to Quest Library (creatorType='library'). createThreadFromBook already does this.

### Phase 2: getQuestsByPool and EFA surface

- Implement `getQuestsByPool(pool)` in `src/actions/quest-library.ts` or new `src/actions/quest-pools.ts`.
- Query: CustomBar where questPool = pool, status = 'active', completionEffects contains library/bookId or isSystem.
- EFA UI: Add "Learn moves" or "Quest pool" section that fetches EFA pool quests. Link from Emotional First Aid page or dashboard.
- Player can "Pull" EFA quest (reuse pullFromLibrary or similar).

### Phase 3: Discovery queue (admin)

- Admin page or section: `/admin/quests?pool=discovery` or `/admin/discovery`.
- List quests where questPool='discovery'. Admin can approve (assign to other pool), reject, edit.
- New book quests with moveType=wakeUp → questPool='discovery' on approve.

### Phase 4: Dojo pool (stub)

- Dojo pool = query only. No UI. Tag Grow Up quests with questPool='dojo'.
- Future: Game Master Schools / Dojo UI part of larger game map.

### Phase 5: Model quests and suggestions (deferred)

- Model quests: mark select CustomBars as isModelQuest or use config.
- suggestQuestEdits: compare generated quest to model; return suggestions. AI-heavy.
- Extend to adventure: link to quest grammar. Deferred.

### Phase 6: Training (deferred)

- Inject model quests into book analysis prompt.
- Fine-tune: document data requirements; infra phase.

## File Impacts

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add questPool to CustomBar |
| `src/actions/book-quest-review.ts` | Set questPool on approve |
| `src/actions/quest-pools.ts` | New: getQuestsByPool, assignQuestToPool |
| `src/app/emotional-first-aid/page.tsx` or component | Add EFA quest pool section |
| `src/app/admin/quests/page.tsx` or new | Discovery queue filter |
| `scripts/seed-cyoa-certification-quests.ts` | Add cert-quest-library-wave-routing-v1 |

## Data Flow

```
Book PDF → extract → analyze → draft quests (moveType from AI)
    → admin review → approve
    → questPool = f(moveType): cleanUp→efa, growUp→dojo, showUp→gameboard, wakeUp→discovery
    → publish to Quest Library (thread)
    → quests queryable by pool
```

## Dependencies

- Book-to-Quest Library (AZ)
- Book Quest Draft and Admin Review (BN)
- Emotional First Aid (existing)
