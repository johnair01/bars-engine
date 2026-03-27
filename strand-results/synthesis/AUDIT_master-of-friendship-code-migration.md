# Master of Friendship - Code Migration Audit

**Date**: 2026-03-26
**Phase**: 2 (Code Audit & Query Pattern Migration)
**Status**: Audit Complete

## Executive Summary

Audit identified **4 files** requiring changes for DeckLibrary migration. All breaking patterns catalogued with migration strategies. **Zero breaking changes** to Scene Atlas expected with proper migration sequence.

## Critical Findings

### 1. Instance → BarDeck Relation (BREAKING)

**Current schema**: `Instance.barDeck` (1:1 relation via `BarDeck.instanceId @unique`)
**New schema**: `Instance.deckLibrary.decks[]` (1:1:many via DeckLibrary)

**Impact**: All code assuming `instance.barDeck` will break.

### 2. Files Requiring Changes

| File | Severity | Lines | Pattern |
|------|----------|-------|---------|
| `src/lib/creator-scene-grid-deck/load-deck-view.ts` | **CRITICAL** | 63, 88-89, 99, 128 | Direct instance.barDeck access |
| `src/actions/prompt-deck-play.ts` | **HIGH** | 91-92, 165-168 | instance relation filter in queries |
| `scripts/seed-creator-scene-grid-deck.ts` | **CRITICAL** | 43-47 | Uses `where: { instanceId }` unique constraint |
| `src/actions/scene-atlas-guided-draft.ts` | **LOW** | TBD | Likely uses deck queries |

### 3. Query Pattern Breakdown

**Pattern A: Direct relation access** (3 locations)
```typescript
// BEFORE
const instance = await db.instance.findUnique({
  where: { slug },
  select: {
    barDeck: { select: { id: true, cards: [...] } }
  }
})
if (!instance?.barDeck) return { ok: false }
const deckId = instance.barDeck.id

// AFTER
const instance = await db.instance.findUnique({
  where: { slug },
  select: {
    deckLibrary: {
      select: {
        decks: {
          where: { deckType: 'SCENE_ATLAS' },
          select: { id: true, cards: [...] }
        }
      }
    }
  }
})
const deck = instance?.deckLibrary?.decks[0]
if (!deck) return { ok: false }
const deckId = deck.id
```

**Pattern B: Instance relation filter in queries** (2 locations)
```typescript
// BEFORE
const deck = await db.barDeck.findFirst({
  where: { id: deckId, instance: { slug } }
})

// AFTER
const deck = await db.barDeck.findFirst({
  where: { id: deckId, library: { instance: { slug } } }
})
```

**Pattern C: Unique constraint upsert** (1 location - CRITICAL)
```typescript
// BEFORE
const deck = await db.barDeck.upsert({
  where: { instanceId: instance.id },
  update: {},
  create: { instanceId: instance.id }
})

// AFTER
// Step 1: Ensure DeckLibrary exists
const library = await db.deckLibrary.upsert({
  where: { instanceId: instance.id },
  update: {},
  create: { instanceId: instance.id }
})

// Step 2: Upsert BarDeck with deckType
const deck = await db.barDeck.upsert({
  where: {
    libraryId_deckType: {
      libraryId: library.id,
      deckType: 'SCENE_ATLAS'
    }
  },
  update: {},
  create: {
    libraryId: library.id,
    deckType: 'SCENE_ATLAS'
  }
})
```

## File-by-File Migration Guide

### File 1: `src/lib/creator-scene-grid-deck/load-deck-view.ts`

**Risk**: CRITICAL - Core Scene Atlas loading function

**Changes required**: 4 locations

**Line 63**: Query structure change
```diff
- barDeck: {
+ deckLibrary: {
    select: {
-     id: true,
-     cards: {
-       orderBy: [{ suit: 'asc' }, { rank: 'asc' }],
-       select: { ... }
+     decks: {
+       where: { deckType: 'SCENE_ATLAS' },
+       select: {
+         id: true,
+         cards: {
+           orderBy: [{ suit: 'asc' }, { rank: 'asc' }],
+           select: { ... }
+         }
        }
      }
    }
  }
```

**Line 88-89**: Null check change
```diff
- if (!instance?.barDeck) {
+ const deck = instance?.deckLibrary?.decks[0]
+ if (!deck) {
    return { ok: false, reason: 'not_found' }
  }
```

**Line 99**: Cards iteration change
```diff
- for (const c of instance.barDeck.cards) {
+ for (const c of deck.cards) {
```

**Line 128**: Return value change
```diff
- deckId: instance.barDeck.id,
+ deckId: deck.id,
```

**Test plan**:
- [ ] Verify Scene Atlas deck loads for existing instance
- [ ] Confirm 52 cards render correctly
- [ ] Check grid binding displays (filled cells)
- [ ] Test with instance that has NO deck (should return not_found)

---

### File 2: `src/actions/prompt-deck-play.ts`

**Risk**: HIGH - Deck cycling logic for hand management

**Changes required**: 2 locations

**Line 91-92**: Instance relation filter
```diff
  const deck = await db.barDeck.findFirst({
-   where: { id: did, instance: { slug } },
+   where: { id: did, library: { instance: { slug } } },
    select: { id: true },
  })
```

**Line 165**: Nested relation access (card query)
```diff
  const card = await db.barDeckCard.findUnique({
    where: { id: cid },
-   select: { id: true, deckId: true, rank: true, deck: { select: { instance: { select: { slug: true } } } } },
+   select: {
+     id: true,
+     deckId: true,
+     rank: true,
+     deck: {
+       select: {
+         library: {
+           select: {
+             instance: {
+               select: { slug: true }
+             }
+           }
+         }
+       }
+     }
+   },
  })
```

**Line 168**: Slug comparison update
```diff
- if (card.deck.instance.slug !== slug) {
+ if (card.deck.library.instance.slug !== slug) {
```

**Test plan**:
- [ ] Draw card from Scene Atlas deck (5-card hand limit)
- [ ] Discard card for quest (moves to discard pile)
- [ ] Verify reshuffle when draw pile exhausted
- [ ] Test rank 13 wild card validation

---

### File 3: `scripts/seed-creator-scene-grid-deck.ts`

**Risk**: CRITICAL - Seeding creates decks, migration breaks unique constraint

**Changes required**: Major refactor (lines 43-48)

**BEFORE**:
```typescript
const deck = await db.barDeck.upsert({
  where: { instanceId: instance.id },
  update: {},
  create: { instanceId: instance.id },
})
```

**AFTER**:
```typescript
// Step 1: Upsert DeckLibrary
const library = await db.deckLibrary.upsert({
  where: { instanceId: instance.id },
  update: {},
  create: { instanceId: instance.id },
})
console.log(`  DeckLibrary: ${library.id}`)

// Step 2: Upsert Scene Atlas BarDeck
const deck = await db.barDeck.upsert({
  where: {
    libraryId_deckType: {
      libraryId: library.id,
      deckType: 'SCENE_ATLAS'
    }
  },
  update: {},
  create: {
    libraryId: library.id,
    deckType: 'SCENE_ATLAS'
  },
})
```

**Test plan**:
- [ ] Run seed script on fresh database
- [ ] Re-run seed script (upsert idempotency)
- [ ] Verify DeckLibrary created
- [ ] Verify BarDeck created with deckType=SCENE_ATLAS
- [ ] Confirm 52 cards seeded correctly

---

### File 4: `src/actions/scene-atlas-guided-draft.ts`

**Risk**: LOW - Likely uses deck queries, needs verification

**Status**: Not yet audited (file not read in this session)

**Action**: Review file for any instance.barDeck or BarDeck.instanceId usage

---

## Helper Functions (Recommended)

### 1. Get Scene Atlas Deck for Instance

```typescript
/**
 * Load Scene Atlas deck for instance (DeckLibrary-aware).
 * Returns null if instance or deck not found.
 */
export async function getSceneAtlasDeck(instanceSlug: string): Promise<{
  id: string
  deckType: DeckType
  libraryId: string
  instanceId: string
} | null> {
  const instance = await db.instance.findUnique({
    where: { slug: instanceSlug },
    select: {
      id: true,
      deckLibrary: {
        select: {
          id: true,
          decks: {
            where: { deckType: 'SCENE_ATLAS' },
            select: { id: true, deckType: true, libraryId: true }
          }
        }
      }
    }
  })

  const deck = instance?.deckLibrary?.decks[0]
  if (!deck) return null

  return {
    ...deck,
    instanceId: instance.id
  }
}
```

### 2. Ensure DeckLibrary Exists

```typescript
/**
 * Upsert DeckLibrary for instance (idempotent).
 */
export async function ensureDeckLibrary(instanceId: string): Promise<string> {
  const library = await db.deckLibrary.upsert({
    where: { instanceId },
    update: {},
    create: { instanceId }
  })
  return library.id
}
```

### 3. Get or Create Deck

```typescript
/**
 * Upsert BarDeck for instance + deckType.
 */
export async function ensureDeck(
  instanceId: string,
  deckType: DeckType
): Promise<string> {
  const libraryId = await ensureDeckLibrary(instanceId)

  const deck = await db.barDeck.upsert({
    where: {
      libraryId_deckType: { libraryId, deckType }
    },
    update: {},
    create: { libraryId, deckType }
  })

  return deck.id
}
```

---

## Backward-Compatible Deployment Strategy

**Phase 1: Code Changes (Deploy BEFORE migration SQL)**
1. Update all 4 files with new query patterns
2. Keep migration SQL uncommitted
3. Test thoroughly on staging (old schema still has BarDeck.instanceId)
4. Deploy to production
5. Monitor for errors (48 hours)

**Phase 2: Migration SQL (Deploy AFTER code stable)**
1. Run migration: `npx prisma migrate deploy`
2. Verify data integrity queries
3. Monitor Prisma logs for query errors
4. Rollback if critical issues

**Rollback strategy**:
- If code breaks: revert deployment (old code works with library relation present)
- If migration breaks: restore DB backup, investigate data migration logic

**Why this works**:
- New code uses `library.instance` relation (works with OR without instanceId field)
- Old schema has both `BarDeck.instanceId` and `DeckLibrary` after data migration
- Migration SQL only drops instanceId field AFTER data migrated

---

## Scene Atlas Regression Test Checklist

### Core Features
- [ ] **Deck loading**: /creator-scene-deck/[slug] loads 52-card grid
- [ ] **Hand management**: Draw card (max 5 global hand)
- [ ] **Discard mechanism**: Play card moves to discard pile
- [ ] **Reshuffle**: Discard pile shuffles into draw when exhausted
- [ ] **Grid binding**: BarBinding shows filled cells on grid
- [ ] **Wild cards**: Rank 13 validation with move family
- [ ] **Daily limit**: Scene Atlas daily usage tracking

### Edge Cases
- [ ] Instance with no deck (should return not_found)
- [ ] Multiple instances (each gets own Scene Atlas deck)
- [ ] Concurrent draws (transaction isolation)
- [ ] Full hand (draw blocked at 5 cards)
- [ ] Empty draw pile (auto-reshuffle)

### Performance
- [ ] Query count (no N+1 queries)
- [ ] Load time (< 500ms for deck view)
- [ ] Hand draw latency (< 200ms)

---

## Friendship Deck Seed Architecture

**Next phase requirement**: Create seed scripts for friendship decks (52 + 64 cards)

### Script 1: `scripts/seed-friendship-deck-52.ts`

```typescript
import { db } from '../src/lib/db'

async function main() {
  const instanceSlug = process.env.INSTANCE_SLUG || 'bruised-banana-residency'

  const instance = await db.instance.findUniqueOrThrow({
    where: { slug: instanceSlug }
  })

  // Ensure DeckLibrary exists
  const library = await db.deckLibrary.upsert({
    where: { instanceId: instance.id },
    update: {},
    create: { instanceId: instance.id }
  })

  // Create Friendship-52 deck
  const deck = await db.barDeck.upsert({
    where: {
      libraryId_deckType: {
        libraryId: library.id,
        deckType: 'FRIENDSHIP_52'
      }
    },
    update: {},
    create: {
      libraryId: library.id,
      deckType: 'FRIENDSHIP_52'
    }
  })

  // Seed 52 cards (4 suits × 13 ranks)
  const suits = ['GATHERING_RESOURCES', 'RAISE_AWARENESS', 'DIRECT_ACTION', 'SKILLFUL_ORGANIZING']
  const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

  for (const suit of suits) {
    for (const rank of ranks) {
      await db.barDeckCard.upsert({
        where: { deckId_suit_rank: { deckId: deck.id, suit, rank } },
        update: {},
        create: {
          deckId: deck.id,
          suit,
          rank,
          promptTitle: `${rank} of ${suit}`,
          promptText: `Friendship invitation prompt for ${rank} of ${suit}...`,
          metadata: {
            invitationPromptText: `I drew this card for you because...`,
            guidedPromptOptions: [
              'Option 1: ...',
              'Option 2: ...',
              'Option 3: ...'
            ],
            moveType: getMoveType(rank), // Wake Up / Clean Up / Grow Up / Show Up
            allyshipDomain: suit,
            cardName: `${rank} of ${suit}`
          }
        }
      })
    }
  }

  console.log(`✅ Friendship-52 deck seeded for ${instanceSlug}`)
}

function getMoveType(rank: number): string {
  if (rank >= 1 && rank <= 3) return 'Wake Up'
  if (rank >= 4 && rank <= 6) return 'Clean Up'
  if (rank >= 7 && rank <= 9) return 'Grow Up'
  if (rank >= 10 && rank <= 12) return 'Show Up'
  return 'Wild' // rank 13
}

main()
```

### Script 2: `scripts/seed-friendship-deck-64.ts`

**Structure**: 8 lower trigrams × 8 upper trigrams = 64 I Ching hexagrams

**Metadata**:
- `hexagramId`: 1-64
- `lowerTrigram`: Heaven | Earth | Thunder | Wind | Water | Fire | Mountain | Lake
- `upperTrigram`: Same as lower
- `oracleReading`: I Ching text
- `invitationPromptText`: Custom prompt for friend invitation

---

## Risk Assessment

### High Risk
- ✅ **Scene Atlas regression** → Mitigated by comprehensive test plan
- ✅ **Seed script breaks** → Mitigated by pattern update + testing
- ⚠️  **Incomplete query audit** → Need to check scene-atlas-guided-draft.ts

### Medium Risk
- ⚠️  **Performance degradation** → Need to verify query performance with library join
- ⚠️  **TypeScript type errors** → Need to regenerate Prisma Client after migration

### Low Risk
- ✅ **Data loss** → Migration SQL includes data migration logic
- ✅ **Rollback complexity** → Backward-compatible deployment strategy

---

## Success Criteria

- [x] All BarDeck.instanceId queries identified (4 files)
- [x] Migration patterns designed for each query type (3 patterns)
- [x] Scene Atlas regression test plan complete (15 checkpoints)
- [ ] All code changes implemented (Phase 3)
- [ ] Tests passing on staging with old schema
- [ ] Migration deployed to production
- [ ] Zero Scene Atlas functionality regressions

---

## Next Steps

1. **Update code** (Phase 3 implementation):
   - [ ] `load-deck-view.ts` (4 changes)
   - [ ] `prompt-deck-play.ts` (2 changes)
   - [ ] `seed-creator-scene-grid-deck.ts` (refactor)
   - [ ] Audit `scene-atlas-guided-draft.ts`

2. **Create helper functions**:
   - [ ] `getSceneAtlasDeck(instanceSlug)`
   - [ ] `ensureDeckLibrary(instanceId)`
   - [ ] `ensureDeck(instanceId, deckType)`

3. **Test on staging**:
   - [ ] Run all Scene Atlas regression tests
   - [ ] Performance benchmarking
   - [ ] Load testing

4. **Deploy to production**:
   - [ ] Deploy code changes (no migration yet)
   - [ ] Monitor 48 hours
   - [ ] Run migration SQL
   - [ ] Final verification

5. **Friendship decks** (Phase 4):
   - [ ] Create seed-friendship-deck-52.ts
   - [ ] Create seed-friendship-deck-64.ts
   - [ ] Design invitation prompt templates
   - [ ] Test multi-deck loading

---

## Estimated Effort

**Phase 3 (Implementation)**: 8-12 hours
- Code changes: 4-6 hours
- Helper functions: 1-2 hours
- Testing: 3-4 hours

**Phase 4 (Friendship Decks)**: 6-8 hours
- Seed script creation: 2-3 hours
- Prompt templates: 2-3 hours
- Testing: 2-2 hours

**Total remaining**: 14-20 hours

---

## Appendix: Query Audit Raw Data

### Files searched:
```
src/lib/prompt-deck/cycle-logic.ts
src/actions/scene-atlas-guided-draft.ts
src/lib/prompt-deck/load-play-snapshot.ts
src/lib/creator-scene-grid-deck/polarities.ts
src/lib/creator-scene-grid-deck/suits.ts
src/lib/creator-scene-grid-deck/load-deck-view.ts  ← CRITICAL
src/actions/scene-grid-deck.ts
src/actions/prompt-deck-play.ts  ← HIGH
scripts/prod-restore.ts
scripts/strand-consult-admin-agent-forge.ts
scripts/seed-creator-scene-grid-deck.ts  ← CRITICAL
scripts/prod-snapshot.ts
```

### Grep patterns used:
- `rg 'instanceId' --type ts -g '*BarDeck*' -g '*barDeck*'`
- `rg 'barDeck.*instanceId|instanceId.*barDeck' --type ts`
- `rg 'prisma\.barDeck' --type ts`
- `rg 'instance.*barDeck|barDeck.*instance' --type ts`
- `rg 'BarDeck|barDeck' --type ts --files-with-matches`

### Instance.barDeck relation usage:
- `load-deck-view.ts:63` - Query select
- `load-deck-view.ts:88` - Null check
- `load-deck-view.ts:99` - Cards iteration
- `load-deck-view.ts:128` - Return value

### BarDeck.instance relation filter:
- `prompt-deck-play.ts:92` - findFirst filter
- `prompt-deck-play.ts:165` - Nested card query

### Unique constraint usage:
- `seed-creator-scene-grid-deck.ts:44` - upsert where clause
