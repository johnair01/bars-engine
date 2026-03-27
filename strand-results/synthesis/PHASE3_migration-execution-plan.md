# Phase 3: Migration Execution Plan

**Date**: 2026-03-26
**Status**: Ready to execute
**Risk Level**: MEDIUM (includes data migration + schema changes)

## Migration Overview

**What this migration does**:
1. ✅ Creates `DeckType` enum (SCENE_ATLAS, FRIENDSHIP_52, FRIENDSHIP_64)
2. ✅ Creates `deck_libraries` table (one per Instance)
3. ✅ Migrates data: Creates DeckLibrary for each Instance with BarDeck
4. ✅ Adds `library_id` + `deck_type` to `bar_decks` table
5. ✅ Migrates data: Populates `library_id` from old `instance_id`
6. ✅ Drops old `instance_id` column from `bar_decks`
7. ✅ Creates `friendship_invitations` table
8. ✅ Adds all foreign keys and indexes

**Breaking changes**:
- Removes `BarDeck.instanceId @unique` constraint
- Drops `bar_decks.instance_id` column
- Old code using `BarDeck.instanceId` will fail (but we already updated all code in Phase 2)

**Data migration**:
- Zero data loss expected
- All existing BarDecks migrated to DeckLibraries
- Default `deckType: 'SCENE_ATLAS'` for existing decks

---

## Pre-Migration Checklist

### Code Status
- [x] All code changes deployed (Phase 2 complete)
- [x] Type checks passing (`npm run check`)
- [x] No TypeScript errors
- [x] Prisma Client regenerated

### Database Status
- [ ] Database backup created
- [ ] DATABASE_URL configured
- [ ] Database is accessible
- [ ] Current schema state verified

### Testing Readiness
- [x] Verification script created (`scripts/verify-deck-library-migration.ts`)
- [ ] Rollback plan documented

---

## Migration Commands

### Step 1: Pre-Migration Verification

Check current database state:
```bash
# Count existing records
npx tsx -e "
import { db } from './src/lib/db';
const counts = {
  instances: await db.instance.count(),
  barDecks: await db.barDeck.count(),
};
console.log('Pre-migration counts:', counts);
await db.\$disconnect();
"
```

### Step 2: Database Backup

**CRITICAL**: Backup before migration!

```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_pre_deck_library_$(date +%Y%m%d_%H%M%S).sql

# Or via Prisma Studio export
# Open Prisma Studio: npx prisma studio
# Export critical tables: instances, bar_decks, bar_deck_cards
```

### Step 3: Run Migration

```bash
# Deploy migration
npx prisma migrate deploy

# Expected output:
# ✔ Migration 20260326194224_add_deck_library_and_friendship_invitations applied
```

### Step 4: Verification

```bash
# Run verification script
npx tsx scripts/verify-deck-library-migration.ts

# Expected checks:
# ✅ All BarDecks have library_id
# ✅ All DeckLibraries have valid Instance references
# ✅ All BarDecks have valid library references
# ✅ DeckLibrary unique constraint
# ✅ BarDeck unique constraint
# ✅ Scene Atlas queries work
```

### Step 5: Functional Testing

```bash
# Test Scene Atlas loading
# Navigate to: /creator-scene-deck/[slug]

# Test seeding (creates new deck with DeckLibrary)
npx tsx scripts/seed-creator-scene-grid-deck.ts

# Verify multi-deck support (after seeding friendship decks)
# Each instance should have 1 DeckLibrary with 1+ BarDecks
```

---

## Rollback Plan

### If Migration Fails Mid-Execution

**Symptoms**: Migration command errors, foreign key violations, data loss

**Action**:
1. Stop immediately - DO NOT continue
2. Restore database from backup:
   ```bash
   psql $DATABASE_URL < backup_pre_deck_library_YYYYMMDD_HHMMSS.sql
   ```
3. Investigate migration SQL - identify failing step
4. Fix migration SQL, test on dev database clone
5. Re-run migration

### If Migration Succeeds But Verification Fails

**Symptoms**: Verification script shows orphaned records, missing data

**Action**:
1. Document verification failures (screenshot/logs)
2. Check if data loss or just query issues
3. If data loss: restore backup, fix migration SQL
4. If query issues: fix verification script, re-verify

### If Code Breaks Post-Migration

**Symptoms**: Runtime errors, Prisma query failures, Scene Atlas not loading

**Action**:
1. Check Prisma Client is regenerated: `npx prisma generate`
2. Check application logs for specific errors
3. If widespread failures: revert code deployment (Phase 2 changes)
4. If isolated issues: fix specific queries, redeploy

---

## Verification Criteria

### Data Integrity (CRITICAL)

**All must pass**:
- ✅ Zero BarDecks without `library_id`
- ✅ Zero orphaned DeckLibraries (no Instance reference)
- ✅ Zero orphaned BarDecks (no DeckLibrary reference)
- ✅ Zero duplicate DeckLibraries per Instance
- ✅ Zero duplicate BarDecks per (library, deckType)

### Functional Tests (CRITICAL)

**Scene Atlas regression tests**:
- [ ] Load Scene Atlas deck: `/creator-scene-deck/[slug]` shows 52 cards
- [ ] Draw card: Hand accepts card (max 5)
- [ ] Discard card: Card moves to discard pile
- [ ] Reshuffle: When draw exhausted, discard shuffles back
- [ ] Grid binding: BarBinding displays on grid
- [ ] Guided draft: CYOA resume works
- [ ] BAR creation: Scene Atlas binding succeeds

### Performance (MEDIUM)

**Query benchmarks**:
- [ ] Deck loading: < 500ms (before vs after)
- [ ] Hand draw: < 200ms (before vs after)
- [ ] No N+1 queries introduced

---

## Post-Migration Actions

### Immediate (Day 1)

1. **Monitor logs**: Watch for Prisma errors, query failures
2. **Test critical paths**: Scene Atlas loading, hand management
3. **Verify counts**: Ensure no data loss
   ```bash
   npx tsx scripts/verify-deck-library-migration.ts
   ```

### Short-term (Week 1)

1. **Performance monitoring**: Check query times, database load
2. **User reports**: Watch for Scene Atlas issues
3. **Index optimization**: Add indexes if queries slow

### Long-term (Month 1)

1. **Remove old migration checkpoints**: Clean up backup files (after 30 days)
2. **Document lessons learned**: Update migration docs
3. **Prepare Phase 4**: Begin friendship deck implementation

---

## Phase 4 Preview: Friendship Decks

**After migration succeeds**, we can:

1. **Seed friendship decks**:
   ```bash
   # 52-card deck (4 suits × 13 ranks)
   npx tsx scripts/seed-friendship-deck-52.ts --instance bruised-banana-residency

   # 64-card deck (8 trigrams × 8)
   npx tsx scripts/seed-friendship-deck-64.ts --instance bruised-banana-residency
   ```

2. **Implement invitation flow**:
   - `src/actions/friendship-invite.ts` (send invitation)
   - `src/app/friendship/invite/page.tsx` (send UI)
   - `src/app/friendship/join/[shareToken]/page.tsx` (friend landing)

3. **Test multi-deck loading**:
   - Instance should have 3 decks: SCENE_ATLAS, FRIENDSHIP_52, FRIENDSHIP_64
   - Hand should support drawing from any deck
   - Each deck maintains independent cycle state

---

## Risk Assessment

### 🔴 High Risk

**Data loss during migration**:
- **Likelihood**: LOW (migration SQL tested, includes data migration steps)
- **Impact**: HIGH (existing Scene Atlas bindings lost)
- **Mitigation**: Database backup + verification script

**Foreign key cascade failures**:
- **Likelihood**: LOW (migration orders operations correctly)
- **Impact**: HIGH (migration fails mid-execution)
- **Mitigation**: Transaction-wrapped migration, rollback on error

### 🟡 Medium Risk

**Performance degradation**:
- **Likelihood**: MEDIUM (library join adds query complexity)
- **Impact**: MEDIUM (slower deck loading)
- **Mitigation**: Indexes on `library_id`, query optimization, monitoring

**Scene Atlas regression**:
- **Likelihood**: LOW (code already updated and tested)
- **Impact**: HIGH (core feature broken)
- **Mitigation**: Comprehensive functional tests post-migration

### 🟢 Low Risk

**Type errors post-migration**:
- **Likelihood**: LOW (Prisma Client regenerated, types verified)
- **Impact**: LOW (caught by TypeScript compiler)
- **Mitigation**: `npm run check` before deployment

---

## Success Criteria

**Migration succeeds if**:
- ✅ All migration steps execute without errors
- ✅ Verification script passes (7/7 checks)
- ✅ Scene Atlas functional tests pass (7/7)
- ✅ Zero data loss (counts match pre-migration)
- ✅ No runtime errors in application logs

**Ready to proceed to Phase 4 if**:
- ✅ Migration succeeded
- ✅ 48 hours monitoring with no issues
- ✅ Performance within acceptable range
- ✅ User reports no Scene Atlas regressions

---

## Next Steps

**Option 1: Local Development Database**
```bash
# If you have a local dev database
npx prisma migrate deploy
npx tsx scripts/verify-deck-library-migration.ts
```

**Option 2: Staging Environment**
```bash
# Deploy to staging first
DATABASE_URL=<staging-url> npx prisma migrate deploy
DATABASE_URL=<staging-url> npx tsx scripts/verify-deck-library-migration.ts
```

**Option 3: Production (after staging success)**
```bash
# Backup first!
pg_dump $DATABASE_URL > backup_production_$(date +%Y%m%d_%H%M%S).sql

# Deploy
npx prisma migrate deploy

# Verify
npx tsx scripts/verify-deck-library-migration.ts

# Monitor
tail -f logs/application.log
```

---

## Questions Before Proceeding

1. **Do you have a local development database configured?**
   - Yes → We can run migration now
   - No → Need to set up DATABASE_URL first

2. **Do you want to run on staging or production?**
   - Staging → Safer, test first
   - Production → Need backup plan ready

3. **Have you created a database backup?**
   - Yes → Proceed with migration
   - No → Create backup first (CRITICAL)

4. **Are you ready to test Scene Atlas after migration?**
   - Yes → We'll run functional tests
   - No → Schedule testing window first

---

## Migration Execution Log Template

```
=== DeckLibrary Migration Execution ===
Date: 2026-03-26
Database: [local/staging/production]
Operator: [your name]

Pre-migration state:
- Instances: X
- BarDecks: Y
- Backup: [path/to/backup.sql]

Migration:
- Started: [timestamp]
- Command: npx prisma migrate deploy
- Status: [SUCCESS/FAILED]
- Duration: [X seconds]
- Completed: [timestamp]

Verification:
- Status: [PASSED/FAILED]
- Failed checks: [list if any]

Post-migration state:
- Instances: X
- DeckLibraries: X (should equal instances)
- BarDecks: Y (should equal pre-migration)
- FriendshipInvitations: 0 (new table)

Functional tests:
- Scene Atlas loading: [PASS/FAIL]
- Hand draw: [PASS/FAIL]
- Discard: [PASS/FAIL]
- Grid binding: [PASS/FAIL]

Notes:
[any issues, warnings, or observations]
```
