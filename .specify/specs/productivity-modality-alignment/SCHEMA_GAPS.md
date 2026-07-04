# Schema Gap Proposals — Productivity Modality Alignment

**Status:** C1 pilot **shipped** (PlayerQuest.metadataJson + UI). C2 cascade columns still proposals only.  
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

### C1 — Waiting-for / external blocker

```ts
// Quest-level metadata (CustomBar or dedicated questOpsJson) — single-layer v1
// waitingFor: {
//   kind: 'person' | 'org' | 'system' | 'approval' | 'other'
//   label: string          // "Landlord", "IRS", "Client (Acme)"
//   since: string          // ISO
//   askedFor?: string
//   followUpAt?: string
//   lastPingAt?: string    // in-app "ping" move, not push notification
// }
```

**Rationale:** GTD waiting-for = ball outside player's court. **Not** in-app player delegation in single-layer v1. Mindwtr person+date pattern adapted as free-text external party.

**Multiplayer extension (defer):** `waitingOnPlayerId` on `PlayerQuest` when campaign delegation ships.

**Email follow-up:** In-app first; optional email only via [humane-notifications](../humane-notifications/spec.md) `waitingForEmail` pref.

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
