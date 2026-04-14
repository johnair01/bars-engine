# Spec: Adventure Seam Protocol

## Purpose

Define a protocol for **game actions that occur between narrative segments** in the CYOA adventure system. Adventures become pure narrative; game mechanics live in the seams between segments.

**Problem**: The adventure runner treats game actions (BAR creation, 321 reflection, move application) as minor interruptions bolted onto story passages. `bar_emit` is a title+description form inside a passage. `ritual_321` is a component awkwardly embedded in the runner. The result is that neither the narrative nor the game action gets the space it needs. The story pauses for a form; the form lacks narrative context.

The real model: **story creates context, game actions create change.** They alternate. The adventure is connective tissue between the moments where the player does real work.

```
Narrative Segment → [SEAM: game action] → Narrative Segment → [SEAM: game action] → Return
```

**Practice**: Deftness Development. Concrete case first (Ignis's trial with one 321 seam), then extract the general pattern.

## The Seam Model

### What is a seam?

A **seam** is a point where an adventure segment ends and a game action begins. The narrative passage sets up the context ("The ember speaks: something in your world must be transformed"). The seam fires the game action (321 reflection, BAR creation). On completion, the next narrative segment picks up.

### How seams differ from bar_emit

| Dimension | Current `bar_emit` | Seam Protocol |
|-----------|-------------------|---------------|
| **Scope** | One form field inside a passage | Full-screen experience between segments |
| **Context** | Title + description, no narrative setup | Previous segment's terminal passage sets the emotional context |
| **Identity** | Generic "Create a BAR" header | NPC-voiced, move-library-parameterized |
| **Output** | CustomBar row | CustomBar + vibeulons + hub receipt + state for next segment |
| **Navigation** | Advance to next passage | Navigate to next adventure segment (different Adventure row) |
| **Register** | Same UI as story passages | Different register — the story hands off to the game |

### The five seam types

| Seam Type | Trigger | Input | Player Experience | Output |
|-----------|---------|-------|-------------------|--------|
| `321_reflection` | Player reaches epiphany in narrative | Epiphany context from preceding passage | NPC-voiced 3-2-1 shadow dialogue (It/You/I) | 321 responses stored in session |
| `bar_create` | Player completes 321 or reaches BAR moment | 321 responses + move library metadata | Structured reflection form (bar_prompt_template + 4 fields) | CustomBar created, barId passed to next segment |
| `bar_update` | Player returns to existing BAR with new context | Existing barId + new narrative context | Edit form prefilled with existing BAR | Updated CustomBar |
| `move_apply` | Player is prompted to apply a nation/archetype move | MoveDefinition + player context | Move application form with requirements | QuestMoveLog entry, BAR created |
| `carry_and_return` | Adventure complete, player has a BAR to plant | barId + returnTo path | Redirect to spatial room with carrying state | Player in room with `?carrying=barId` |

MVP implements `321_reflection` + `bar_create` + `carry_and_return`. The others are future.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Data model | **No new Prisma models.** Seams are encoded in passage metadata on terminal passages. Adventure segments are regular Adventure rows linked by metadata. |
| Segment linking | Terminal passage of segment N has `metadata.seamAction` + `metadata.nextAdventureSlug`. The runner detects this, executes the seam, then navigates to the next segment. |
| Twee authoring convention | `[seam:type]` tag on passages marks where the story splits. Import script detects seam tags and creates separate Adventure rows per segment. |
| Seam state | Seam outputs (321 responses, barId) are passed between segments via **URL search params** and/or **sessionStorage**. No server-side seam state model. |
| Seam rendering | Each seam type has its own full-screen component. The adventure runner delegates to it when it detects `actionType: 'adventure_seam'`. On completion, the component redirects to the next segment. |
| Immersion continuity | The terminal passage of each segment narratively sets up the seam. "The Challenger places a hand on your heart. Now speak." The seam component opens in the same emotional register, not as a UI break. |
| Backward compatibility | Existing `bar_emit` continues to work for simple inline BAR creation. `adventure_seam` is a separate, richer pattern. No breaking changes to the adventure runner. |
| Import pipeline | `import-npc-twee.ts` is updated to detect `[seam:...]` tags and split the Twee into multiple adventures. Each adventure is a clean narrative segment. Seam metadata links them. |

## Twee Authoring Convention

### Seam tags

```twee
:: EpiphanyChange [seam:321_reflection npc:ignis next:ignis-trial-harvest]
The ember speaks: *"Something in your world must be transformed."* You realise there is
a situation, relationship or habit that no longer aligns. This clarity is your **epiphany**.
```

Tag format: `[seam:<type> <key>:<value> ...]`

| Key | Required | Description |
|-----|----------|-------------|
| `seam` | Yes | Seam type: `321_reflection`, `bar_create`, `carry_and_return` |
| `npc` | For `321_reflection` | NPC id for voiced questions |
| `next` | Yes | Slug of the next adventure segment (or `return` for spatial room redirect) |
| `move` | For `bar_create` | Move key from the library (e.g., `fire_clean-up`) |

### Segment splitting

When the import script encounters a passage with a `[seam:...]` tag:
1. The passage becomes the **terminal passage** of the current segment
2. All passages after it become a **new adventure segment**
3. The terminal passage gets `metadata.actionType: 'adventure_seam'` with the seam config
4. The new segment's Adventure row is created with `slug: <next value>`

### Example: Ignis's Trial split

```
Twee file: cyoa-flow-pyrakanth-clean-up.twee

Segment 1: "ignis-trial-descent" (slug)
  Start → ChooseMove → ChooseGM → IntroMove → RevealRoot →
  paths → Offering → release → Witness → Epiphany*
  
  *EpiphanyChange [seam:321_reflection npc:ignis next:ignis-trial-harvest]
   → terminal passage, metadata: {
       actionType: 'adventure_seam',
       seamType: '321_reflection',
       npcId: 'ignis',
       nextAdventureSlug: 'ignis-trial-harvest'
     }

[SEAM: 321 Reflection — Ignis-voiced, full-screen]
  → 321 responses stored in sessionStorage

Segment 2: "ignis-trial-harvest" (slug)
  GenerateBAR → CompleteReflection
  
  GenerateBAR has metadata: {
    actionType: 'adventure_seam',
    seamType: 'bar_create',
    npcId: 'ignis',
    moveKey: 'fire_clean-up',
    nextAdventureSlug: null  // terminal — carry_and_return
  }
  
  CompleteReflection has metadata: {
    actionType: 'adventure_seam',
    seamType: 'carry_and_return'
  }
```

## Adventure Runner Changes

### New passage handler: `adventure_seam`

When AdventurePlayer loads a passage with `metadata.actionType === 'adventure_seam'`:

1. **Render the passage text** as narrative context (the story sets up the seam)
2. **Below the text**, render the seam component based on `seamType`:
   - `321_reflection` → `SeamReflection321` component (NPC-voiced, full ThreeTwoOneDialogue)
   - `bar_create` → `SeamBarCreate` component (structured reflection form from move library)
   - `carry_and_return` → "Return to the clearing" button with `?carrying=barId`
3. **On seam completion**:
   - Store seam output (321 responses, barId) in sessionStorage
   - If `nextAdventureSlug`: redirect to `/adventure/<nextId>/play?seamData=<key>&returnTo=<path>`
   - If no next: redirect to `returnTo` with carrying params

### Seam state passing

Between segments, seam outputs pass via sessionStorage:

```typescript
// After 321 completion
sessionStorage.setItem('seam_321_responses', JSON.stringify({ it, you, i }))
// Navigate to next segment
router.push(`/adventure/${nextId}/play?returnTo=${returnTo}`)

// Next segment reads 321 data for bar_create seam
const responses = JSON.parse(sessionStorage.getItem('seam_321_responses') ?? '{}')
```

This mirrors the Shadow/321 pattern (`shadow321_metadata` in sessionStorage).

## API Contracts

### No new server actions needed for MVP

- `321_reflection` seam: client-side only (ThreeTwoOneDialogue + sessionStorage)
- `bar_create` seam: calls existing `emitBarFromPassage()` enriched with 321 data + move library metadata
- `carry_and_return` seam: client-side redirect with URL params

### Import script changes

```bash
npx tsx scripts/import-npc-twee.ts
```

Updated to:
1. Detect `[seam:...]` tags on passages
2. Split Twee into segments at seam boundaries
3. Create one Adventure per segment, linked by `nextAdventureSlug` in terminal passage metadata
4. Seed all segments in one run

## Conceptual Model

```
Adventure Segment (pure narrative)
  │
  passage → passage → passage → terminal [seam:321_reflection]
  │                                       │
  │                     ┌─────────────────┘
  │                     ↓
  │              SEAM: 321 Reflection
  │              (NPC-voiced, full-screen)
  │              (outputs: 321 responses → sessionStorage)
  │                     │
  │                     ↓
  │              Adventure Segment (narrative continues)
  │              passage → terminal [seam:bar_create]
  │                                       │
  │                     ┌─────────────────┘
  │                     ↓
  │              SEAM: BAR Create
  │              (structured reflection, move library)
  │              (outputs: barId → sessionStorage)
  │                     │
  │                     ↓
  │              Adventure Segment (ceremony)
  │              passage → terminal [seam:carry_and_return]
  │                                       │
  │                     ┌─────────────────┘
  │                     ↓
  │              REDIRECT: returnTo?carrying=barId
  │              (player back in spatial room with BAR)
```

## User Stories

### P1: Content author marks seams in Twee

**As a** content author, **I want** to mark where game actions happen in my Twee file using `[seam:...]` tags, **so that** the import pipeline knows where to split the story and what game action occurs at each boundary.

**Acceptance**: `[seam:321_reflection npc:ignis next:ignis-trial-harvest]` on a passage causes the import script to split the adventure and link the segments.

### P2: Player experiences seamless narrative → game action → narrative

**As a** player going through Ignis's trial, **I want** the story to flow naturally into the 321 reflection and then into the BAR creation without feeling like the UI switched to a different app, **so that** the ritual feels like one continuous experience.

**Acceptance**: Terminal passage renders its narrative text, then the 321 opens below it in the same visual register. On 321 completion, the next segment loads with the BAR creation seam pre-filled from the 321 responses.

### P3: Adventure segments chain automatically

**As a** player, **I want** completing one segment to automatically open the next, **so that** I don't have to manually navigate between parts of the ritual.

**Acceptance**: Completing the 321 seam in segment 1 automatically navigates to segment 2. Completing the BAR seam in segment 2 redirects me to the spatial room with my BAR.

### P4: Seam outputs carry between segments

**As a** player, **I want** my 321 responses to pre-fill the BAR creation form in the next segment, **so that** my reflection work isn't lost between segments.

**Acceptance**: After completing It/You/I in the 321 seam, the BAR creation seam in the next segment shows my responses as context and pre-fills the description.

## Functional Requirements

### Phase 1: Ignis Split (concrete case)

- **FR1**: Update import script to detect `[seam:...]` tags and split Twee into segments
- **FR2**: Import Pyrakanth Twee as 2 segments: `ignis-trial-descent` + `ignis-trial-harvest`
- **FR3**: Terminal passage of segment 1 has `adventure_seam` metadata with `321_reflection` config
- **FR4**: Build `SeamReflection321` component — renders after terminal passage text, NPC-voiced
- **FR5**: On 321 completion: store responses in sessionStorage, navigate to segment 2
- **FR6**: Segment 2 loads, reads 321 data, renders `bar_create` seam pre-filled with responses
- **FR7**: BAR created with move library metadata + vibeulons
- **FR8**: CompleteReflection redirects to `returnTo` with `?carrying=barId`

### Phase 2: Generalize seam handling

- **FR9**: Adventure runner detects any `adventure_seam` actionType and delegates to seam component registry
- **FR10**: Seam component registry: `{ '321_reflection': SeamReflection321, 'bar_create': SeamBarCreate, 'carry_and_return': SeamCarryReturn }`
- **FR11**: Seam components receive passage context + seam config as props
- **FR12**: Seam state protocol: sessionStorage keys prefixed with `seam_` for cross-segment data

### Phase 3: Authoring pipeline

- **FR13**: Document Twee seam tag convention for content authors
- **FR14**: Import script handles multiple seams per Twee (creates N+1 segments for N seams)
- **FR15**: Validate seam tag syntax during import (error on malformed tags)

## Non-Functional Requirements

- No new Prisma models (seams are passage metadata, segment links are Adventure slug references)
- sessionStorage for cross-segment state (survives navigation, cleared on chain completion)
- Backward compatible — existing `bar_emit` and adventures without seams continue to work
- Mobile-safe — seam components must work on small screens

## Dependencies

- Adventure runner (AdventurePlayer.tsx) — needs `adventure_seam` handler
- ThreeTwoOneDialogue — exists, NPC-voiced variant built
- StructuredBarReflection — exists
- NPC question banks — exists (`src/lib/npc/npc-321-questions.ts`)
- Move library — exists (52 moves)
- Pyrakanth Clean-Up Twee — exists, needs seam tags added
- import-npc-twee.ts — exists, needs seam-aware splitting

## Six Game Master Face Consensus

| Face | Guidance |
|------|----------|
| **Shaman** | Seams are thresholds. Name segments as ritual phases (Descent, Reflection, Harvest). Each phase changes register. |
| **Challenger** | Build one seam (Ignis 321). Don't build an engine. The pattern emerges from the concrete case. |
| **Regent** | No new models. Passage metadata + Adventure slug links. The chain is implicit, not a separate entity. |
| **Architect** | Define the Twee `[seam:...]` convention. This is the authoring contract that scales to all NPCs. |
| **Diplomat** | The terminal passage must narratively hand the player to the seam. Don't break immersion at transitions. |
| **Sage** | Build the 321 seam for Ignis. Ship it. The pattern teaches the rest. |

## References

- [npc-ritual-encounter spec](.specify/specs/npc-ritual-encounter/) — NPC identity + Twee integration
- [cyoa-ritual-nursery-rooms spec](.specify/specs/cyoa-ritual-nursery-rooms/) — spatial infrastructure
- Shadow321Runner (`src/app/shadow/321/Shadow321Runner.tsx`) — sessionStorage pattern, 321 UX
- AdventurePlayer (`src/app/adventure/[id]/play/AdventurePlayer.tsx`) — current runner with bar_emit
- [CYOA immersive context](memory: feedback_cyoa_immersive_context.md) — Twee provides the world
- [NPC world encounter model](memory: feedback_npc_world_encounter.md) — NPCs guide the experience
