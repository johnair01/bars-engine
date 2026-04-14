# Spec: Chapter-Spoke Template — How a Book Chapter Becomes a Playable Milestone

## Purpose

Define the abstract pattern by which **a chapter of a book becomes a spatial milestone-spoke** in a campaign hub. Chapter 1 of *Mastering the Game of Allyship* is the first concrete instance. Chapters 2–12 will reuse this template. Future books with chapter-as-spoke structure (e.g., Igniting Joy) will reuse it again.

This spec is the structural prerequisite for the chapter 1 demo to be more than decorative. Without it, every chapter risks reinventing its own mechanics. With it, chapter content becomes drop-in.

## Problem

We are building chapter 1 of MTGOA as a spatial walkthrough. The demo acceptance contract requires that chapter 1 produce real BAR creation, real milestone roll-up, and real felt continuity. But chapter 1 is not a one-off — it is the first of 12 chapters in this book, and the pattern itself will be reused in future books.

If we build chapter 1 ad-hoc, three things break:
1. **Chapter 2 takes as long as chapter 1.** No leverage from the first build.
2. **Inconsistency between chapters.** Each chapter invents its own way to be a spoke. Players experience whiplash between chapters.
3. **No clear contract for what "a chapter as a spoke" actually is.** Future authors (including future-team-members) cannot author a chapter without re-deriving the pattern from chapter 1.

The chapter-spoke template fixes this by defining: **what a chapter spoke MUST have, what it MAY have, and how the parts connect to the surrounding hub-and-spoke architecture.**

## Practice

Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. The template is the contract; chapter 1 is the first implementation.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Template scope | A "chapter spoke" is a leaf spatial experience that represents one chapter of a book, contributes to one milestone in its parent book hub, and is composed of standardized components (spaces, NPCs, BAR moments, exit). |
| Required components | Every chapter spoke MUST have: an entry threshold, at least one narrative space, at least one BAR creation moment, an exit threshold, and a milestone roll-up wiring. |
| Optional components | A chapter spoke MAY have: multiple spatial rooms, NPC encounters with face moves, CYOA passages, branching narrative paths, alternate exit conditions, multi-BAR creation. |
| Authoring surface | Chapter content is authored as a structured **ChapterDefinition** — a TypeScript object (or JSON) with required/optional fields. This is the "spec" for one chapter. |
| Per-chapter visual identity | Each chapter MAY override default visual style (palette, room ambient, sprite tint). Defaults to the parent book's design language. Chapter 1 is the first instance and gets bespoke styling for the demo. |
| Reusable vs unique | Common machinery (provider, NPC system, BAR creation, milestone roll-up) is **shared across all chapter spokes**. Per-chapter content (rooms, narrative, NPC dialogue overrides, milestone definition) is **unique per chapter**. |
| Milestone contract | Each chapter spoke is bound to **exactly one milestone** in its parent book hub. Completing the chapter contributes to that milestone. Multiple players can contribute to the same chapter milestone. |
| Roll-up chain | A chapter spoke's milestone progress rolls up: Chapter milestone → Book hub milestone → Org hub milestone → (optionally) parent campaign milestone. The recursive nesting spec (campaign-recursive-nesting) governs the chain. |
| BAR tagging contract | Every BAR created in a chapter spoke is tagged with: `chapterRef`, `bookRef`, `orgRef`, `campaignRef`. These travel with the BAR for all downstream queries and roll-ups. |
| Entry threshold | Players enter a chapter spoke from the parent book hub. Entry is a **threshold**, not an instant cut — the player crosses into the chapter's space and the spatial context shifts (palette, music hint, ambient). |
| Exit threshold | Players exit a chapter spoke by reaching an exit anchor (a portal back to the parent book hub) OR by triggering an exit condition (e.g., completing the BAR creation moment). Exit is also a threshold, with closure / acknowledgement. |
| Re-entry | A player who has previously visited a chapter spoke can re-enter it. Re-entry shows them their previous BARs from this chapter and asks if they want to add another or simply revisit. |
| Completion definition | A chapter spoke is "completed" for a player when they have created at least one BAR within it. Completion is tracked per-player. A chapter spoke can be completed multiple times (each time produces a new BAR). |
| Authoring aids | The template provides scaffolding: a `createChapterSpoke` factory function, default room layouts, default NPC dialogue stubs, default exit anchors. Authors override what they need. |
| Versioning | Each chapter has a version number. Players who completed v1 see v2 as a new opportunity, not a replacement. Versioning is required for the chapter to evolve over time without losing player progress. |

## Conceptual Model

```
BOOK (e.g., Mastering the Game of Allyship)
  │
  ├─ Book hub clearing (spatial)
  │   ├─ 8 spokes (one per chapter)
  │   │
  │   ├─ Spoke 0 ──→ CHAPTER 1 SPOKE
  │   │                ├─ Entry threshold
  │   │                ├─ Narrative spaces (1-N rooms)
  │   │                ├─ NPC encounters (0-6 face NPCs)
  │   │                ├─ BAR creation moment(s)
  │   │                ├─ Exit threshold
  │   │                └─ Milestone wiring → Chapter 1 milestone
  │   │
  │   ├─ Spoke 1 ──→ CHAPTER 2 SPOKE  (same template, different content)
  │   ├─ Spoke 2 ──→ CHAPTER 3 SPOKE
  │   └─ ...
  │
  └─ Book milestone aggregator
      └─ Aggregates all chapter milestones into "book progress"
```

| Dimension | This Spec |
|-----------|-----------|
| **WHO** | Players walking through chapters; authors writing chapters |
| **WHAT** | A chapter as a spatial milestone-spoke |
| **WHERE** | Inside a book hub, which is inside an org hub, which can be inside a campaign |
| **Energy** | Each chapter is a transformation arc — entry to exit changes the player |
| **Personal throughput** | Chapter completion produces a BAR that contributes to milestone roll-up |

## API Contracts

### ChapterDefinition

The structured authoring surface. One per chapter.

```typescript
type ChapterDefinition = {
  // Identity
  chapterRef: string             // e.g., 'mtgoa-chapter-1'
  bookRef: string                // e.g., 'mtgoa-book'
  orgRef: string                 // e.g., 'mtgoa-org'
  parentCampaignRef?: string     // e.g., 'bruised-banana' (optional, for cross-campaign roll-up)

  // Display
  title: string                  // e.g., "Chapter 1: The Call to Play"
  shortTitle: string             // e.g., "Call to Play"
  emoji?: string
  version: string                // e.g., 'v1'
  description: string

  // Spatial structure
  rooms: ChapterRoomDefinition[]
  entrySpoke: { roomSlug: string; tileX: number; tileY: number }
  exitConditions: ExitCondition[]

  // Content
  narrativePassages: NarrativePassage[]
  npcDialogueOverrides: NpcDialogueOverride[]
  barCreationMoments: BarCreationMoment[]

  // Milestone wiring
  milestone: ChapterMilestoneDefinition

  // Visual identity (optional — falls back to book defaults)
  visualStyle?: ChapterVisualStyle

  // Wiki callouts (for orientation)
  wikiCallouts?: WikiCallout[]
}
```

### Component types

```typescript
type ChapterRoomDefinition = {
  slug: string                   // e.g., 'chapter-1-threshold'
  name: string
  layout: 'octagon' | 'rect' | 'custom'
  size: { width: number; height: number }
  anchors: ChapterAnchor[]
  ambientPalette?: string        // e.g., 'twilight', 'forest', 'forge'
}

type ChapterAnchor = {
  type: 'face_npc' | 'narrative_passage' | 'bar_moment' | 'exit_threshold' | 'wiki_callout'
  tileX: number
  tileY: number
  config: Record<string, unknown>  // type-specific
}

type NarrativePassage = {
  id: string
  triggerAnchorId: string        // which anchor opens this passage
  twee: string                   // Twee-formatted narrative
  voicedAs?: string              // 'shaman', 'challenger', etc. — chapter-aware
}

type NpcDialogueOverride = {
  face: GameMasterFace
  greeting: string               // chapter-specific, overrides face-default
  invitation: string
  // Optional: per-spoke per-chapter dialogue (uses existing dialogue context system)
}

type BarCreationMoment = {
  id: string
  triggerAnchorId: string
  promptText: string
  defaultMoveType: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp'
  barTypeHint?: string           // 'player_response' | 'vibe' | etc.
}

type ExitCondition = {
  type: 'reach_anchor' | 'create_bar' | 'manual'
  anchorId?: string              // for reach_anchor type
  message: string                // closure text shown on exit
}

type ChapterMilestoneDefinition = {
  milestoneRef: string           // e.g., 'mtgoa-book-milestone-chapter-1'
  title: string                  // e.g., "Players answer the Call to Play"
  description: string
  rollupTo: {
    parentMilestoneRef: string   // e.g., 'mtgoa-book-progress'
    weight: number               // 0..1, how much this chapter contributes
  }
  completionCriteria: {
    minBarsRequired: number      // typically 1
    barFilters?: {
      moveType?: string
      tagged?: string[]
    }
  }
}

type ChapterVisualStyle = {
  paletteOverride?: 'twilight' | 'forge' | 'forest' | 'water' | 'metal' | 'earth'
  spriteTint?: string
  ambientHint?: string           // music/SFX hint, not enforced
}

type WikiCallout = {
  triggerAnchorId: string
  linkText: string
  linkPath: string               // e.g., '/wiki/mtgoa-organization'
  contextNote: string            // why the player might want to read this
}
```

### Server actions

```typescript
// Register a chapter (called once per chapter at seed time)
action registerChapterSpoke(input: {
  definition: ChapterDefinition
}): Promise<{ success: true; chapterRef: string } | { error: string }>

// Get a chapter's full definition (for client rendering)
action getChapterSpoke(input: {
  chapterRef: string
}): Promise<ChapterDefinition | { error: string }>

// Record that a player has entered a chapter
action recordChapterEntry(input: {
  chapterRef: string
}): Promise<{ success: true; isReentry: boolean } | { error: string }>

// Record completion (creates the milestone progress entry)
action recordChapterCompletion(input: {
  chapterRef: string
  barId: string
}): Promise<{ success: true; milestoneProgress: number } | { error: string }>

// Get a player's progress through a book's chapters
action getPlayerChapterProgress(input: {
  bookRef: string
}): Promise<Array<{
  chapterRef: string
  title: string
  visited: boolean
  completed: boolean
  barCount: number
}>>
```

### Authoring helpers

```typescript
// Factory function for creating chapter definitions with sane defaults
function createChapterSpoke(input: Partial<ChapterDefinition> & {
  chapterRef: string
  bookRef: string
  title: string
}): ChapterDefinition

// Default octagon room with face NPCs at standard positions
function defaultChapterClearing(chapterRef: string): ChapterRoomDefinition

// Default exit anchor pointing back to the book hub
function defaultExitAnchor(bookHubSlug: string): ChapterAnchor
```

## User Stories

### P0 — Author a Chapter

**CST-1**: As a chapter author, I can write a `ChapterDefinition` with the required fields and the system handles the rest (room generation, NPC placement, BAR wiring, milestone hookup).

**CST-2**: As a chapter author, I can override default visual style, default NPC dialogue, and default room layouts when my chapter needs something specific.

**CST-3**: As a chapter author, I can preview a chapter in isolation without needing the full book hub deployed.

### P0 — Play a Chapter

**CST-4**: As a player entering a chapter spoke, I cross a threshold that signals "I am now in this chapter" — visually, atmospherically, and structurally.

**CST-5**: As a player walking through a chapter, the World State Provider keeps my carrying state, selected face, and HUD continuous across all rooms within the chapter.

**CST-6**: As a player creating a BAR in a chapter, the BAR is automatically tagged with chapter, book, org, and parent campaign refs.

**CST-7**: As a player exiting a chapter, I see a closure moment acknowledging what I just did, and I see my BAR added to my hand.

**CST-8**: As a player completing a chapter, my BAR contributes to the chapter milestone, and I can see that progress in the book hub.

### P1 — Re-entry

**CST-9**: As a player who already completed a chapter, re-entering shows me my previous BARs from this chapter and asks if I want to revisit (read-only) or contribute again (new BAR).

**CST-10**: As a player on a re-entry, the chapter does not force me to walk through the full narrative again — I can fast-forward to the BAR creation moment.

### P2 — Roll-up Visibility

**CST-11**: As a player viewing the book hub, I see chapter milestones with progress bars showing how much of each chapter has been completed (across all players).

**CST-12**: As a player viewing the org hub, I see the book milestone with progress aggregated from all chapter milestones.

### P3 — Authoring Workflow

**CST-13**: As an author, I run a script (`npx tsx scripts/seed-chapter-spoke.ts <chapterRef>`) that takes my `ChapterDefinition`, creates the spatial rooms, wires the milestone, and registers the chapter.

**CST-14**: As an author, I can update a chapter's content and re-run the seed script — existing player BARs are preserved, new content is reflected.

## Functional Requirements

### Phase 1 — Template Skeleton

- **FR1**: Define `ChapterDefinition` type and all sub-types in `src/lib/chapter-spoke/types.ts`
- **FR2**: Implement `createChapterSpoke` factory with sane defaults
- **FR3**: Implement `defaultChapterClearing` and `defaultExitAnchor` helpers
- **FR4**: Add `ChapterRegistration` Prisma model (one row per chapter, holds the serialized definition)
- **FR5**: Implement `registerChapterSpoke` server action

### Phase 2 — Spatial Wiring

- **FR6**: Spatial seed script `seed-chapter-spoke.ts` that takes a `ChapterDefinition` and creates the spatial rooms + anchors in the database
- **FR7**: Bind the chapter spoke to its parent book hub via the existing campaign-spoke-bindings registry
- **FR8**: Ensure chapter rooms inherit the World State Provider (spec 1.40) automatically

### Phase 3 — BAR Tagging + Milestone Roll-up

- **FR9**: Extend the existing BAR creation flows (face move pick, charge capture, etc.) to detect when the player is in a chapter spoke and auto-tag the BAR with chapter/book/org refs
- **FR10**: Implement milestone roll-up — when a BAR is created in a chapter, find the chapter's milestone and increment its progress
- **FR11**: Implement aggregation — book hub queries roll up all chapter milestones into book progress
- **FR12**: Wire `recordChapterCompletion` to update both the chapter milestone and the player's chapter progress record

### Phase 4 — Re-entry + Progress UI

- **FR13**: Implement `getPlayerChapterProgress` for player progress queries
- **FR14**: Implement re-entry detection (`recordChapterEntry` returns `isReentry`)
- **FR15**: Build re-entry UI: "You've already walked this chapter. Continue? Revisit?"
- **FR16**: Build chapter progress display in the book hub view

### Phase 5 — Chapter 1 as First Instance

- **FR17**: Author the chapter 1 `ChapterDefinition` for MTGOA
- **FR18**: Run the seed script to create chapter 1's spatial rooms
- **FR19**: Verify chapter 1 meets the demo acceptance contract (felt continuity, milestone wiring, reader's test)
- **FR20**: Document chapter 1 as the reference implementation for chapters 2–12

## Non-Functional Requirements

- **NFR1**: A new chapter can be authored and seeded in under 1 day of work (after the template is built)
- **NFR2**: Chapter rooms inherit the provider transparently — authors don't have to think about state plumbing
- **NFR3**: Chapter completion writes are atomic — BAR creation + milestone update + chapter progress record happen in one transaction
- **NFR4**: Re-entry queries are <100ms (single indexed lookup)
- **NFR5**: Versioning is non-destructive — updating a chapter never deletes player progress

## Persisted Data & Prisma

```prisma
model ChapterRegistration {
  id              String   @id @default(cuid())
  chapterRef      String   @unique
  bookRef         String
  orgRef          String
  version         String   @default("v1")
  definition      Json                          // serialized ChapterDefinition
  registeredAt    DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([bookRef])
  @@index([orgRef])
}

model PlayerChapterProgress {
  id              String   @id @default(cuid())
  playerId        String
  chapterRef      String
  firstEnteredAt  DateTime @default(now())
  lastEnteredAt   DateTime @default(now())
  enterCount      Int      @default(1)
  barCount        Int      @default(0)
  completed       Boolean  @default(false)

  player          Player   @relation(fields: [playerId], references: [id])

  @@unique([playerId, chapterRef])
  @@index([playerId])
  @@index([chapterRef])
}

model ChapterMilestone {
  id                  String   @id @default(cuid())
  chapterRef          String   @unique
  bookRef             String
  title               String
  description         String
  parentMilestoneRef  String?
  rollupWeight        Float    @default(1.0)
  minBarsRequired     Int      @default(1)
  totalBarCount       Int      @default(0)
  totalPlayerCount    Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([bookRef])
}
```

When ready to implement:
- [ ] Create migration: `npx prisma migrate dev --name add_chapter_spoke_template`
- [ ] Run `npm run db:sync` and `npm run check`
- [ ] Author chapter 1 definition
- [ ] Run chapter 1 seed script

## Team Ownership (by Face)

Per the demo acceptance contract pattern. Six people, one spec, clear ownership:

| Face | Owns in this spec | Specific deliverable |
|------|-------------------|---------------------|
| **Sage** (Wendell) | The pattern coherence. Decides when chapter 1 is "good enough" to be the reference for chapters 2–12. Final go/no-go on the template's shape. | The template feels right when used. |
| **Shaman** | Authoring chapter 1 narrative and dialogue. Voice consistency. Threshold ritual content. The Twee passages. NPC dialogue overrides for chapter 1 context. | Chapter 1 narrative content delivered as a `ChapterDefinition`. |
| **Challenger** | Scoping. The no-list for chapter 1's content. Cutting scope when chapter 1 risks bloat. Daily check on whether the chapter is shippable. | Chapter 1 ships within 30 days. |
| **Architect** | The template machinery. `ChapterDefinition` types. Factory functions. Seed script. Prisma models. Server actions. The structural lattice that makes authoring cheap. | Phases 1–3 of this spec (template skeleton, spatial wiring, milestone roll-up). |
| **Regent** | Milestone wiring. The roll-up chain (chapter → book → org → BB). Verification that BARs created in chapter 1 actually contribute to milestones that aggregate up to the BB hub. The structural rules of progress. | Phases 3–4 of this spec (BAR tagging, roll-up, progress UI). |
| **Diplomat** | Felt experience of chapter authoring AND chapter playing. Playtesting both the author workflow (is it easy to write a chapter?) and the player workflow (does it feel like a chapter?). Reader testing for Test 4 of the contract. | Phases 4–5 (re-entry UI, reference implementation polish). |

## Dependencies

- [world-state-provider](../world-state-provider/spec.md) — **required prerequisite**. The chapter spoke template assumes the provider is in place to deliver felt continuity.
- [campaign-recursive-nesting](../campaign-recursive-nesting/spec.md) — **required**. The chapter spoke is a 4th-level node in the nesting tree (BB → MTGOA Org → MTGOA Book → Chapter). The recursive nesting spec governs this.
- [campaign-lifecycle](../campaign-lifecycle/spec.md) — chapter milestones use the lifecycle spec's milestone primitives.
- [milestone-completion-feelings](../milestone-completion-feelings/spec.md) — chapter milestones may carry feeling tags (a chapter promises specific completion feelings).
- [hand-vault-bounded-inventory](../hand-vault-bounded-inventory/spec.md) — **deferred**. Chapter 1 demo can ship without bounded hand. Chapter spokes work better with bounded hand once it ships.
- [world-portal-save-state](../world-portal-save-state/spec.md) — **deferred**. Chapter 1 demo uses single `lastRoomSlug` field. Full save state ships post-demo.

## Convergence with Future Specs

When the prompt deck system (backlog 1.34 PDH) ships, chapter spokes can use prompt deck cards as the structured prompts inside `BarCreationMoment` definitions. The current `BarCreationMoment.promptText` field is the prototype — it folds into prompt deck cards later without breaking the chapter authoring surface.

When the campaign template system matures (deferred work), `ChapterDefinition` and `CampaignTemplate` may share a common base type. They are kindred patterns (both are "structured ways to define a unit of player experience") and may converge.

## Reference Implementation

**Chapter 1 of MTGOA** is the first instance and the template proof. Its `ChapterDefinition` is the reference for chapters 2–12. After the demo ships, future chapter authors copy chapter 1's definition file, change the content, and re-run the seed script.

The chapter 1 definition lives at: `data/chapters/mtgoa/chapter-1.ts` (or `.json` — TBD by Architect).

## References

- `data/face-moves.json` — face move library (used by chapter NPCs)
- `src/lib/npc/dialogue-context.ts` — dialogue overrides per campaign per spoke (chapter spokes use this)
- `src/lib/campaign-hub/spoke-bindings.ts` — static binding registry (extended for chapter bindings)
- `src/lib/spatial-world/nursery-rooms.ts` — existing room patterns to base chapter rooms on
- `.specify/specs/world-state-provider/spec.md` — required infrastructure
- `.specify/contracts/mtgoa-chapter-1-demo-contract.md` — the gate for the first chapter implementation
