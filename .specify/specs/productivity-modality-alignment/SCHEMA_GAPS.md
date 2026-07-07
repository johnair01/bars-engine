# Schema Gap Proposals — Productivity Modality Alignment

**Status:** Proposals only — **no migrations** until Phase C ratified per [plan.md](./plan.md).  
**Authority:** [RESEARCH.md](./RESEARCH.md), [SIX_GAME_MASTER_REVIEW.md](./SIX_GAME_MASTER_REVIEW.md)

---

## Phase A–B: No schema required (loop wiring first)

These gaps may close via existing fields + actions:

| Gap | Existing hook | Wiring task |
|-----|---------------|-------------|
| Stale quest / no next action | `NextActionBridge` | Require on quest activation; surface on complete |
| PARA project vs area | `LensGoal`, `CustomBar.campaignRef` | Document semantics; QLA lineage |
| Daily WIP | `TapTheVeinTask` cap | Already enforced — document only |
| Review / carry | `TapTheVeinTask.status`, `carryCount` | Daily Reflection beat in TTV |

---

## Phase C: Proposed schema (if loop wiring insufficient)

### C1 — Waiting-for / delegation

```prisma
// On PlayerQuest or CustomBar metadata — prefer metadata first
// PlayerQuest.waitingOnPlayerId String?
// PlayerQuest.delegatedAt DateTime?
// PlayerQuest.followUpAt DateTime?
```

**Rationale:** Mindwtr `Waiting For` list; communal campaigns need delegated quest tracking.  
**Alternative:** `metadataJson.waitingFor: { playerId, since, note }` before new columns.

### C2 — Next-action cascade state

```prisma
// NextActionBridge — extend, do not replace
// suggestedNextQuestId String?  // cascade promote target
// blockedByQuestId String?       // dependency (optional, simple)
// cascadeVersion Int @default(1) // idempotent promote
```

**Rationale:** Tandem cascade on complete. Start with **computed** cascade in `next-action-bridge.ts` before persisting blocked graph.

### C3 — Lens review session

```prisma
// model LensReviewSession {
//   id, playerId, lensId, phase String // get_clear | get_current | get_creative
//   completedSteps Json, completedAt DateTime?
// }
```

**Rationale:** Tandem/Mindwtr guided weekly review. **Defer** — may be `LensWorkshopDraft` extension first.

### C4 — LensGoal area kind (PARA)

```prisma
// LensGoal.goalKind String @default("horizon") // horizon | area | project
```

**Rationale:** PARA distinction without new entity. Maps Projects → quests, Areas → LensGoal.

---

## Metadata-first preference (Regent ruling)

Prefer `CustomBar.metadataJson` / `PlayerQuest` string fields for Phase C.1 pilot before Prisma migration. Migration required only when querying across players at scale (campaign waiting-for dashboard).

---

## Explicit non-goals

- No `Inbox` table (capture = BAR/TTV/charge)
- No `@context` tag table (use existing domain/face/move)
- No Eisenhower quadrant fields
- No streak counters on `WritingSession` without opt-in flag
