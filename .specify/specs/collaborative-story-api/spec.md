# Spec: Collaborative Story API ("Yes-And" Foundation)

## Purpose

Define the technical foundation for **Collaborative Story Branching**. This API allows the narrative engine to look outside of a single player's run and "Yes-And" others' contributions by seeding **BARs** (planted in the Spoke Nursery) back into live adventures as new branches.

**Problem:** Adventures are currently siloed and static. Players cannot easily "branch off" a friend's story or contribute their own "inner world" artifacts (BARs) as permanent narrative paths for others.

**Practice:** Deftness Development — API-first (contract before UI), one-shot integration, legible for entry-level vibecoders.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Data Source** | Leverage `SpokeMoveBed` (SMB) as the "Nursery" for seeds. |
| **Injection** | Use `nodeChoiceOverrides` in the `QuestPacket` to insert dynamic branches. |
| **Branching** | A "Yes-And" branch is a dynamic sub-quest generated from a BAR's metadata and scored via an affinity hub. |
| **Persistence** | Track contributors in `TwineRun.agentMetadata`. |

## Conceptual Model

```text
Spoke Nursery (SMB)
  └─ Move Bed (WakeUp, etc.)
       └─ Seeds (Anchors/Kernels)
            └─ BAR (Title, Description, Polarity)

Collaborative Session
  └─ TwineRun (AdventureContext)
       └─ Injected Choice (From Seed)
            └─ New Branch (Dynamic)
```

## API Contracts (API-First)

### `getSpokeSeeds`
**Input:** `{ spokeIndex: number; moveType: SpokeMoveBedMoveType; campaignRef: string }`  
**Output:** `{ seeds: SpokeSeed[] }`  
Fetches the Anchor and Kernels for a specific move bed, ranked by "watering" progress.

### `compileSpokeQuest`
**Input:** `{ adventureId: string; spokeIndex: number; campaignRef: string }`  
**Output:** `QuestPacket`  
The primary entry point for a Spoke Adventure. It automatically fetches seeds and injects them into the respective nodes (Wake Up, etc.) as **Choice Overrides**.

### `bridgeBranchWithBar`
**Input:** `{ runId: string; nodeId: string; barId: string }`  
**Output:** `{ success: true; targetNodeId: string }`  
Mutation that "consumes" a BAR to create a persistent branch in the current run, registering the player as a collaborator.

## Functional Requirements

- **FR1**: API must return seeds with enough metadata (title, emoji, element) for the UI to render a "Seed Card."
- **FR2**: `compileSpokeQuest` must support `COLLAB` tagging in Twine content to know *where* to offer branches.
- **FR3**: The API must be "fail-safe"—if no seeds exist, the adventure should proceed with its default authored path.
- **FR4**: Tracking of "Yes-And" chains in `agentMetadata` for provenance.

## Non-Functional Requirements

- **Legibility:** All API functions must use descriptive names and JSDoc so "vibecoders" can easily call them from React components.
- **Idempotency:** Re-compiling a spoke quest within the same run should return consistent seeds unless the nursery has changed significantly.
