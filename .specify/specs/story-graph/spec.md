# Spec: StoryEdge — the story graph's one table

## Purpose

Add one table, `StoryEdge`, that holds lines between two nodes (NPC to NPC, NPC to place, NPC to quest) in three layers: canon, shared and personal. Players' events write the personal lines; a gate promotes a personal line to shared. This lets the Heaven sect change as people play it, without one player bending it for others.

**Problem**: bars-engine holds the nodes (`NpcConstitution`) and the NPC-to-player line (`NpcRelationshipState`), but no line between two NPCs. The sect's rivalries, debts and teaching lines have nowhere to live.

**Practice**: Deftness Development — spec kit first, contract before UI, deterministic over AI. Design source: `wendell-britt/six-faces-council` `council/callsheets/story-graph.md`. Spec only; no code in this slice.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Gate (Wendell, board row `sg-shared-world-gate`, answered A, 2026-11-10) | A personal line becomes shared when **three different players** have written it **and the Regent check passes**. One player cannot change the shared world alone. |
| Source of truth | An append-only event log (`StoryEvent`). A line's `value` is computed from its events. Events never change; lines can be recomputed or undone by removing an event's effect (`revokedAt`). |
| Canon | Locked. Seeded from `council/story-graph/heaven-sect.yaml`. Play cannot write, edit or delete a canon line; a contradicting play line is refused and the refusal is logged. |
| Shared lines carry structure only | Edge type, the two ends and a value. Never a player's words, charge or BAR text. Words stay in the personal layer (n321: the player's words show only to them). |
| Regent check | Reuses `NpcAction.requiresRegentApproval`: promotion creates an `NpcAction` with `verb: "promote_story_edge"` and `requiresRegentApproval: true`. The edge goes shared only when that action's status is approved. |
| Trust stays where it is | NPC-to-player trust stays in `NpcRelationshipState`. `StoryEdge` holds NPC-to-NPC, NPC-to-place and NPC-to-quest lines. No approval meter: an NPC states trust in its own voice. |
| Decay | Lines nobody walks lose weight on a schedule and compost at zero. The rate is **not decided**; it ships as a config constant (`STORY_EDGE_DECAY_PER_DAY`) with a placeholder and a board question if the first play shows the world growing or shrinking too fast. |
| Another player's daemon | A daemon enters a player's world only after a separate yes (calrunian-sect hard-boundary test on consent). Out of scope here; the table never links a player to another player's daemon. |
| Elder-to-Elder lines | Come from the founder intake (position `sg-elder-lines-from-founder`). The seed leaves them empty until the intake lands; no code invents them. |

## Conceptual Model

| Layer | Who writes it | Who sees it | Changes |
|-------|---------------|-------------|---------|
| canon | Wendell's rulings (seed file) | everyone | only by his ruling |
| shared | promoted play lines (gate) | everyone | recomputed from events; can be undone |
| personal | one player's events | that player only | at once, on each event |

Nodes: Person (`NpcConstitution`), Place, Need/Quest, Card (I Ching), Spirit/daemon. Edge types:

- canon: `certifies`, `answers_to`, `teaches`, `lives_in`
- play: `owes`, `rivals`, `needs`, `offers`, `made_from`

(`trust` between an NPC and a player stays in `NpcRelationshipState`; `trust` between two NPCs is a `StoryEdge` of type `trust`, range -3 to 3.)

## Persisted data & Prisma

Two tables, one migration, additive only.

```prisma
enum StoryEdgeLayer { canon shared personal }

model StoryEdge {
  id           String          @id @default(cuid())
  layer        StoryEdgeLayer
  type         String                  // see Edge types
  fromType     String                  // "npc" | "place" | "quest" | "card"
  fromId       String
  toType       String
  toId         String
  playerId     String?                 // set only when layer = personal
  value        Int             @default(0)
  weight       Float           @default(1)   // decays; composts at 0
  promotedAt   DateTime?
  approvalActionId String?             // NpcAction that holds the Regent check
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  events       StoryEvent[]

  @@unique([layer, type, fromType, fromId, toType, toId, playerId])
  @@index([fromType, fromId])
  @@index([toType, toId])
  @@index([playerId])
  @@map("story_edges")
}

model StoryEvent {
  id         String    @id @default(cuid())
  edgeId     String
  playerId   String
  verb       String                // the act: "helped", "broke_promise", ...
  delta      Int       @default(0) // effect on the edge's value
  sourceType String?               // "bar" | "quest_move" | "hexagram_encounter"
  sourceId   String?               // QuestMoveLog / HexagramEncounterLog / BAR id
  createdAt  DateTime  @default(now())
  revokedAt  DateTime?
  edge       StoryEdge @relation(fields: [edgeId], references: [id], onDelete: Cascade)

  @@index([edgeId])
  @@index([playerId])
  @@map("story_events")
}
```

Notes: `personal` edges carry `playerId`; `canon` and `shared` do not. `StoryEvent` rows are never updated except to set `revokedAt`. A player's words are never stored on either table.

| Check | Done |
|-------|------|
| Models named above | spec |
| `tasks.md` includes: `npx prisma migrate dev --name add_story_edge`, commit `prisma/migrations/…` with `schema.prisma` | to write with the build slice |
| `npm run db:sync`, `npm run check` after the schema edit | build slice |
| Human glances at `migration.sql` (additive only) | build slice |

## How it reads NpcRelationshipState

A player's view of an NPC is the union of three reads: canon edges from/to the NPC, shared edges from/to the NPC, and that player's personal edges. `NpcRelationshipState` is read unchanged for the NPC-to-player line. An event that both moves trust and writes an NPC-to-NPC line (the player helps lieutenant A finish what student B left) writes one `StoryEvent` and updates `NpcRelationshipState` in the same transaction. Nothing is copied between the two tables.

## API Contracts (API-First)

Server-side library, `src/lib/story-graph/`. Route handlers and UI come in a later slice.

```ts
// Write: the only way a play line changes.
function recordStoryEvent(input: {
  playerId: string
  verb: string
  edge: { type: string; fromType: string; fromId: string; toType: string; toId: string }
  delta: number
  source?: { type: 'bar' | 'quest_move' | 'hexagram_encounter'; id: string }
}): Promise<{ ok: true; edgeId: string; eventId: string } | { ok: false; reason: 'contradicts_canon' | 'unknown_node' }>
// Refuses (and logs) when the edge contradicts a canon edge.

// Read: choices for the page of the adventure.
function getStoryView(input: { playerId: string; nodeType: string; nodeId: string }):
  Promise<{ edges: Array<{ id: string; layer: 'canon'|'shared'|'personal'; type: string; toType: string; toId: string; value: number }> }>

// Gate: run after each event (and by a daily job).
function considerPromotion(edgeKey: { type: string; fromId: string; toId: string }):
  Promise<{ promoted: boolean; reason?: 'fewer_than_3_players' | 'awaiting_regent' | 'regent_declined' }>
// Counts distinct playerId among non-revoked events on matching personal edges. At 3 or more, opens an NpcAction
// (verb "promote_story_edge", requiresRegentApproval true). On approval, writes the shared edge with the same structure.

function revokeStoryEvent(eventId: string): Promise<void>  // sets revokedAt, recomputes the edge, re-runs the gate downward (a shared edge that falls below 3 players is withdrawn)
```

## User Stories

### P1: Walk in and be asked something real
**As a player**, I walk into the Growth Blueprint study and the lieutenant asks for help with what another student left half-done, so my choice has weight.
**Acceptance**: `getStoryView` for that lieutenant returns the canon lines plus any shared and my personal lines, ranked later by the page builder. Choosing "help" calls `recordStoryEvent`; my personal line changes at once; no other player sees it.

### P2: A line becomes everyone's
**As Wendell**, I want a rivalry to appear for everyone only after three players' play wrote it and the Regent check passed, so the world grows from repeated play and one player cannot bend it.
**Acceptance**: with two players' events, `considerPromotion` returns `fewer_than_3_players`. With a third, it opens one `NpcAction` awaiting approval; the edge is not yet shared. After approval it is shared. Revoking one of the three events withdraws it.

### P3: Canon holds
**As Wendell**, I want play unable to touch my rulings.
**Acceptance**: `recordStoryEvent` for an edge that contradicts a canon line returns `contradicts_canon`, writes no event and logs the refusal.

## Functional Requirements

### Phase 1: Schema and seed
- **FR1**: Add `StoryEdge`, `StoryEvent` and the layer enum in one additive migration.
- **FR2**: Seed canon edges from `heaven-sect.yaml` (founder, 6 Elders, 30 lieutenants, one team; 48 edges, canon ones only). The seed is idempotent.

### Phase 2: Write and read
- **FR3**: `recordStoryEvent` writes an event and updates the personal edge in one transaction, and updates `NpcRelationshipState` when the event moves NPC-to-player trust.
- **FR4**: `getStoryView` returns canon, shared and the caller's personal edges, never another player's personal edges.
- **FR5**: Refuse canon contradictions with a logged refusal.

### Phase 3: Gate and decay
- **FR6**: `considerPromotion` per the gate above. Shared edges store structure only.
- **FR7**: Decay job lowers `weight` by `STORY_EDGE_DECAY_PER_DAY`; at zero the edge composts (soft-deleted, events kept).

## Non-Functional Requirements

- Additive migration only; no change to existing tables.
- `getStoryView` reads three indexed queries; ranking cost per page is **not measured** and belongs to the build slice.
- Non-AI path first-class: nothing here calls a model.
- Privacy: no player text, charge value or BAR body on `StoryEdge` or `StoryEvent`.

## Verification Quest (required for UX features)

- **ID**: `cert-story-graph-v1`
- **Steps**: (1) as player 1, help a lieutenant; see a personal line only for player 1. (2) As players 2 and 3, write the same line; after the third the line awaits Regent approval and is still unshared. (3) Approve; every player sees it. (4) Revoke one event; the line is withdrawn. (5) Try to write a line that contradicts a canon edge; refused.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Open items (not decided; not blocking the spec)

- Decay rate (`STORY_EDGE_DECAY_PER_DAY`).
- How a villager made from a 3-2-1 enters the sect's graph (npc-from-321 places villagers in the village, not the sect).
- Cost of ranking choices per page.

## Dependencies

- `NpcConstitution`, `NpcRelationshipState`, `NpcAction` (`requiresRegentApproval`), `QuestMoveLog`, `HexagramEncounterLog`.
- Council seed: `council/story-graph/heaven-sect.yaml` in `wendell-britt/six-faces-council`.

## References

- `council/callsheets/story-graph.md` (council repo), calrunian-sect.md, npc-from-321.md, iching-two-move.md.
- Prisma workflow: [prisma-migration-discipline skill](../../../.agents/skills/prisma-migration-discipline/SKILL.md).
