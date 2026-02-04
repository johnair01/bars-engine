---
description: Gap analysis between existing implementation and new roadmap
---

# Transcend and Include: Gap Analysis

What exists + What's proposed = Integrated roadmap.

> *"The higher stage transcends and includes the lower."*

---

## Current Implementation (Already Built)

### ✅ Schema (Exists)
| Model | Fields | Status |
|-------|--------|--------|
| `Vibulon` | id, ownerId, originSource, originId, originTitle, stakedOnBarId | **EXISTS** |
| `VibulonEvent` | id, playerId, source, amount, notes | **PARTIAL** (missing move type) |
| `CustomBar` | id, creatorId, title, parentId, rootId, visibility | **EXISTS** |
| `Account` | id, email, passwordHash | **EXISTS** |
| `Player` | id, accountId, nationId, playbookId | **EXISTS** |
| `Nation` | id, wakeUp, cleanUp, growUp, showUp | **EXISTS** |
| `Playbook` | id, wakeUp, cleanUp, growUp, showUp | **EXISTS** |

### ✅ Features (Exists)
| Feature | Status | Location |
|---------|--------|----------|
| Quest creation | ✅ | `/create-bar` |
| Quest completion | ✅ | `actions/quest.ts` |
| Vibulon earning | ✅ | `actions/economy.ts` |
| Vibulon transfer | ✅ | `actions/delegate-bar.ts` |
| Available bars | ✅ | `/bars/available` |
| Auth (Account/Player) | ✅ | `/conclave` |
| 8 Nations | ✅ | `seed.ts` |
| 8 Playbooks (Trigrams) | ✅ | `seed.ts` |
| Basic moves (wakeUp, etc.) | ✅ | `seed.ts` |

---

## Proposed Additions (New Roadmap)

### 🔵 Schema Changes Needed

| Change | Table | Field | Purpose |
|--------|-------|-------|---------|
| ADD | `VibulonEvent` | `moveType` | Track which archetype move generated |
| ADD | `VibulonEvent` | `questId` | Link event to specific quest |
| ADD | `Vibulon` | `generation` | Track hops from origin |
| ADD | `CustomBar` | `kotterStage` | Track quest's current change stage |

### 🔵 Features Needed

| Feature | Priority | Archetypes Served |
|---------|----------|-------------------|
| Quest stage tracking | P1 | All (game loop) |
| Move type on vibulon events | P1 | All (identity) |
| Archetype affinity matching | P2 | All (engagement) |
| Generation tracking | P3 | 6, 9 (trust/history) |

---

## Integration Map

```
EXISTING                    +  PROPOSED               =  INTEGRATED
────────────────────────────────────────────────────────────────────
Vibulon.originSource           |  moveType             |  Full provenance
VibulonEvent.source            |  kotterStage          |  Stage-aware economy
Playbook.moves (JSON)          |  8 archetype moves    |  Named moves (⚡🤝👁🎭💧🔥🌬⛰)
CustomBar.rootId               |  kotterStage          |  Quest progression
8 Trigram Playbooks            |  8 Kotter stages      |  Complete type system
```

---

## No Duplication Needed

| Roadmap Item | Already Exists | Reuse? |
|--------------|----------------|--------|
| Quest creation | ✅ | YES |
| Assign to others | ✅ (visibility + claimedBy) | YES |
| Basic completion | ✅ | YES |
| Vibulon earning | ✅ | EXTEND (add moveType) |
| Vibulon transfer | ✅ | EXTEND (add generation) |
| Playbook system | ✅ | EXTEND (formalize moves) |

---

## Implementation Priority (Revised)

### Alpha Complete ✅
- [x] Quest creation
- [x] Basic completion
- [x] Vibulon earning
- [x] 8 Playbooks exist

### Beta (Next)
- [ ] Add `moveType` to `VibulonEvent`
- [ ] Add `kotterStage` to `CustomBar`
- [ ] Formalize 8 moves per playbook
- [ ] Quest stage progression logic

### Launch
- [ ] Add `generation` to `Vibulon`
- [ ] Full provenance UI
- [ ] Archetype affinity bonuses
- [ ] "The Sage" (AI hexagram guidance)

---

## Context Files Summary

| File | Purpose | Duplication? |
|------|---------|--------------|
| `player_archetypes.md` | 8 types × stages × moves | NEW (extends playbook concept) |
| `feature_roadmap.md` | Archetype needs × dev stages | NEW (prioritization) |
| `vibeulons_schema.md` | Provenance spec | EXTENDS existing `Vibulon` model |

---

## Recommendation

1. **Keep existing implementation** - It's the foundation
2. **Extend schema minimally** - Add `moveType`, `kotterStage`, `generation`
3. **Formalize playbook moves** - Map existing moves to Kotter stages
4. **Build incrementally** - Each release adds one layer of depth

The vibes already flow. Now we're adding identity to the flow.
