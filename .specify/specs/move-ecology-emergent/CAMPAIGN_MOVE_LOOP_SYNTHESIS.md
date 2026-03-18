# Campaign Move Loop — Sage Synthesis

**Date**: 2026-03-17  
**Context**: Emergent Move Ecology implemented (books mined, admins promote). Gap: campaigns are not built *out of* these moves.  
**Synthesis**: Regent + Architect + Challenger perspectives, Integral Theory, project ethos.

---

## Current State (Verified)

| Component | State |
|-----------|-------|
| **NationMove** | Nation-scoped (Metal default), tier CUSTOM→CANDIDATE→CANONICAL, origin BOOK_EXTRACTED |
| **Instance** | Has `scopedNations`, `scopedArchetypes`, `BarDeck`, `GameboardSlot` — **no move pool** |
| **Quest grants** | `grantsMoveId` honored in `quest-engine.ts` — completion → `PlayerNationMoveUnlock` |
| **Move panel** | `getNationMovePanelData` pulls from `player.nationId` + `player.archetypeId` — player-level, not campaign-level |

**Gap**: Moves exist and can be promoted. Quests can grant moves. But the campaign (Instance) has no way to say *which* moves are in play. Players see their global nation/archetype moves, not a campaign-curated set.

---

## Options (Recap)

1. **Instance moveIds** — Add `Instance.moveIds` (JSON array). Instance curates which moves a campaign uses.
2. **Instance-scoped nation** — Campaign gets its own Nation with promoted moves. Schema supports `Nation.instanceId`.
3. **Quest grants** — Already built. Completing quest unlocks move. Does not define the pool.
4. **Full authoring flow** — Admin selects quest thread + move pool when creating campaign.

---

## GM Face Perspectives

### Regent (Structures, Assessment)

**Emphasis**: Clear boundaries, audit trail, integrity.

- **Instance moveIds** is preferable: explicit curation, no ambiguity. "This campaign uses these 12 moves" is auditable.
- Instance-scoped nation adds indirection: moves belong to Nation, Nation belongs to Instance. Two hops. Regent prefers one: Instance → moveIds.
- Quest grants must be validated: `grantsMoveId` should reference a move in the Instance's pool. Regent wants: "If quest grants move X, then X ∈ Instance.moveIds."
- **Assessment**: Option 1 + validation rule. Option 2 is heavier and duplicates structure.

### Architect (Quest Design, Patterns)

**Emphasis**: Quest thread + move pool as co-designed curriculum.

- The campaign is a **developmental arc**. Each quest in the thread can grant a move; the thread's sequence is the move progression.
- Authoring flow is critical: when admin creates a campaign, they select (a) quest thread and (b) move pool. The Architect wants both in one place.
- Quest grants are the *mechanism*; Instance moveIds is the *boundary*. The pool defines what's available; quests unlock within that pool.
- **Assessment**: Option 4 (authoring flow) is the Architect's priority. It requires Option 1 (Instance moveIds) as the schema foundation.

### Challenger (Boundaries, Moves)

**Emphasis**: Clear edges — what's in play, what's not.

- "This campaign uses these moves, period." Not everything. Not chaos. The Challenger wants a bounded set.
- Instance moveIds creates that boundary. Instance-scoped nation does too, but via an extra entity. Challenger prefers directness.
- Quest grants that reference moves *outside* the pool are a boundary violation. Challenger would reject: "Quest grants move X but X is not in Instance.moveIds."
- **Assessment**: Option 1 with strict validation. Option 2 is acceptable but overbuilt.

---

## Integral Theory (AQAL) Lens

| Quadrant | Implication |
|----------|-------------|
| **I (Interior-Individual)** | Player's subjective experience: "I earned this move by completing that quest." The campaign's move pool shapes what's possible. Bounded = legible transformation. |
| **We (Interior-Collective)** | Campaign as shared ritual. Moves are the shared vocabulary. Instance moveIds = "we use these patterns here." |
| **It (Exterior-Individual)** | Schema: Instance.moveIds, quest.grantsMoveId. Structures that support the loop. |
| **Its (Exterior-Collective)** | System: book extraction → admin promotion → campaign curation → quest grants → player unlock. Composting: books become moves, moves become campaign content. |

**Composting not necromancy**: Book-extracted moves are compost. Admin promotes. Campaign curates. The campaign is the compost pile — it selects what serves its developmental arc.

**Emotional energy as fuel**: Completing a quest that grants a move = metabolizing block → earning a new tool. The campaign designs which tools are available and which quests unlock them.

**Dual-track (AI + non-AI)**: Move pool selection can be fully manual. Admin selects from promoted moves. AI could *suggest* moves based on `narrativeKernel`, but the selection is human. No AI required for the loop to close.

---

## Recommended Path

### Primary: Instance moveIds + Quest Grants + Authoring Flow

**Schema change**:
```prisma
model Instance {
  // ... existing fields ...
  moveIds  String  @default("[]")  // JSON array of NationMove ids — campaign move pool
}
```

**Behavior**:
1. When admin creates or edits a campaign, they select a move pool (from promoted NationMoves).
2. When admin assigns quests to the campaign (BarDeck, GameboardSlot, thread), they set `grantsMoveId` to a move in the pool.
3. `getNationMovePanelData` (or a campaign-scoped variant): when `player.activeInstanceId` is set and `Instance.moveIds` is non-empty, filter moves to those in the pool. Fall back to nation/archetype when no campaign or empty pool.
4. Quest completion already grants `grantsMoveId` → `PlayerNationMoveUnlock`. No change.

**Validation** (Regent + Challenger):
- If `quest.grantsMoveId` is set and quest is campaign-scoped (e.g. in Instance's deck/slots), then `quest.grantsMoveId ∈ Instance.moveIds`. Warn or block if not.

### Defer: Instance-Scoped Nation

Instance-scoped Nation is supported in schema but adds complexity:
- Creating a Nation per campaign means duplicating or linking moves. NationMove has `nationId` (one nation per move).
- To use instance-scoped Nation, we'd either (a) copy moves to the instance Nation, or (b) add many-to-many NationMove–Nation. Heavier than `Instance.moveIds`.
- **Recommendation**: Use Instance moveIds first. Revisit instance-scoped Nation if campaigns need fully isolated nation identity (e.g. "Bruised Banana Nation" with its own lore).

---

## Implementation Order

1. **Schema**: Add `Instance.moveIds` (JSON array, default `[]`). Migration.
2. **Admin UI**: Campaign edit page — "Move pool" picker. Select from promoted moves (tier CANDIDATE or CANONICAL).
3. **Quest authoring**: When assigning quest to campaign, "Grant move" picker filtered to Instance.moveIds.
4. **Move panel**: Extend `getNationMovePanelData` (or add `getCampaignMovePanelData`) to filter by Instance.moveIds when player has activeInstanceId.
5. **Validation**: Optional — warn when quest.grantsMoveId ∉ Instance.moveIds for campaign quests.

---

## Summary

| Question | Answer |
|----------|--------|
| **Which option?** | Instance moveIds (1) + Quest grants (3, already built) + Authoring flow (4) |
| **Why not instance-scoped nation?** | Heavier; Instance moveIds is sufficient for MVP |
| **Regent** | Explicit curation, validation rule |
| **Architect** | Quest thread + move pool co-design in authoring flow |
| **Challenger** | Bounded set, clear edges |
| **Integral** | Campaign as compost pile; moves as shared vocabulary |
| **Dual-track** | No AI required; admin selects manually |

The loop closes when: **Admin curates move pool → Admin assigns quests with grantsMoveId → Player completes quest → Player unlocks move → Move panel shows campaign pool**. Simple, explicit, compostable.
