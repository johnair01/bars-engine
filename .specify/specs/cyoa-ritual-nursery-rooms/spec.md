# Spec: CYOA Ritual Nursery Rooms

## Purpose

Replace the current form-wizard CYOA composer with a **spatial ritual experience** rooted in authored narrative content. Players enter a campaign-scoped introduction room, then walk into one of four nursery rooms (Wake Up, Clean Up, Grow Up, Show Up) where they experience a face-guided ritual that produces a BAR.

**Problem**: The current CYOA composer is a 5-step form wizard (select emotion, select face, select template, type text, confirm). It works architecturally but feels like filling out a form, not playing a game. The Pyrakanth Clean-Up Twee flow demonstrates what the experience *should* feel like — a 20-node guided ritual with authored prose, branching choices, emotional arc, and BAR generation at the climax. The gap between "select your template" and "name your anger and offer it to the fire" is the gap between a tool and a game.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI. Authored content first; AI generation as future layer.

## Root Cause Analysis: Why the Current Experience Fails

### Signal Feedback (2026-04-08)

| Signal | Root Cause |
|--------|-----------|
| "BAR should appear on the same page as a modal so players can use it immediately" | BAR creation happens on a separate page; no spatial continuity |
| "This should be a spatial room with links that can be clicked and a modal opening up with this info" | Spoke seeds page renders flat card list instead of a navigable room |
| "It doesn't feel like a game" | Composer is a sequential form wizard with no narrative voice, no landscape, no ritual framing |
| "BARs aren't high quality enough to make this obvious" | BAR generation is disconnected from the emotional ritual that should produce it |
| "The architecture does seem to be correct, but the UI is very bad" | Correct data flow, wrong interaction pattern |

### Gap Analysis: Form Wizard vs Ritual Flow

| Dimension | Current Composer | Pyrakanth Clean-Up (Target) |
|-----------|-----------------|----------------------------|
| **Entry** | `/composer/[id]?params` — direct URL load | Walk into a spatial room; GM greets you |
| **Emotional intake** | "Select a channel: Fear / Anger / Sadness / Joy / Neutrality" (radio buttons) | "What emotion rises most strongly? Think of the root of your anger — its taste, its origin." |
| **Face selection** | Grid of 6 CultivationCards with recommendation scores | "Six figures appear. You have chosen to travel with the Challenger — a warrior of red." |
| **Move selection** | "Select your path" (template cards) | "We will perform a Burn Offering. Your anger is fuel." |
| **Core ritual** | *Does not exist* | 3-phase guided experience: reveal root → choose release method → witness what remains |
| **BAR creation** | "Set your intention" (text input, step 4 of 5) | "Take this insight and craft an action. Your BAR must be specific, tangible, and aligned with the change you've seen." |
| **Completion** | "Freeze build" (confirm button) → silent save to ledger | "You have performed the Burn Offering. You have cleaned up your anger and turned it into purpose." |
| **Return** | Redirect to hub | Walk back through portal to spoke room |

### The Five Missing Qualities

1. **Spatial presence** — Player should be *in* a room, not *on* a page
2. **Narrative voice** — A GM face should speak to the player in authored prose
3. **Emotional arc** — The ritual has phases (reveal, release, witness) that build on each other
4. **Inline BAR creation** — BAR appears at the climax of the ritual, not as a form field
5. **Ceremony** — Completion is witnessed and named, not silently saved

## Design Decisions (Interview-Validated)

| Topic | Decision |
|-------|----------|
| Content authorship | Twee files are source of truth. One authored flow per nation×face×move cell. AI generation is a future layer, not MVP. |
| Introduction room | Campaign-scoped. Every player enters the same room. The room's aesthetic and framing come from the campaign (e.g., Bruised Banana's Conclave). From there, the 4 nursery portals split the experience by move type. |
| Spatial rendering | Use existing Pixi-based `RoomRenderer`. Nursery rooms are `MapRoom` rows with custom tilemaps + anchors. |
| Nursery structure | 4 rooms per spoke: `wake-up`, `clean-up`, `grow-up`, `show-up`. Each room contains a portal back to the spoke introduction room and an activity anchor that launches the ritual CYOA. |
| Ritual CYOA | Played via the existing adventure runner (`/adventure/[id]/play`). The Twee content is imported through `twee-to-flow` and stored as an Adventure. The runner renders authored passages with choices. |
| BAR creation | **Modal overlay** on GenerateBAR passage. When the adventure runner hits a `[bar-creation]`-tagged passage, a modal slides up with BAR input ("I will..."). Player submits, modal closes, ritual continues underneath. BAR is created as `CustomBar` row. |
| Face selection | **6 Face NPC anchors** in the introduction room. Player walks up to a face NPC, interacts (modal greeting with authored prose), and locks that face for the session. Uses existing NPC anchor system. |
| Aesthetic transition | Introduction room = **campaign aesthetic** (BB Conclave cedar/intention). Ritual = **player's nation drives aesthetic**. A Pyrakanth player sees "Tend the Fire" prose; an Argyra player sees "Face the Voice" prose. `launchNurseryRitual()` resolves `(nation + archetype + moveType)` → move definition from the library. |
| Emotional vector | Derived from daily check-in (if exists) or from the ritual's intake passage. Not a separate form step. |
| Composer relationship | **Backend-only.** The existing composer step system (`step-registry.ts`) and `resolveAdaptiveSteps()` run server-side as the invisible data resolver. It pre-fills what it can (face from spoke draw, emotion from check-in), but the player NEVER sees the step wizard. The spatial room + ritual flow IS the UI. |
| Missing content fallback | **"Path not yet woven"** in-world message + return portal. Matches the EndNonPath pattern in the existing Twee. Player walks back to intro room. |
| Non-AI mode | First-class. All ritual content is authored or move-library-driven. The system works without any AI calls. |
| Move library (52 moves) | **Canonical content source.** 20 nation moves + 32 archetype moves define game mechanics (core_prompt, reflection_schema, bar_integration, vibeulon_rules). Stored at `src/lib/nation/move-library.json` + `archetype-move-library.json`. Typed accessor: `src/lib/nation/move-library-accessor.ts`. |
| Routing: 3 axes | **Nation** (element/emotional channel) drives the indigenous move name and landscape. **Archetype** (trigram playbook) drives the personal variation. **Face** (GM lens) drives the narrative voice wrapping the move. Face is a voice layer, not a content layer. |
| BAR creation | **Structured reflection form**, not free-text. Each move defines `bar_integration.bar_prompt_template` (e.g., "From Tend the Fire, I learned that ______") and `reflection_schema.required_fields` (what_i_did, what_happened, what_resistance_appeared, what_changed). The BAR modal renders this form. |
| 3-2-1 shadow dialogue | **Core mechanic** for every Clean Up move. The ritual flow renders a 3-step structured input (It... You... I...) for the shadow dialogue. This is a reusable component, not per-move authored content. |
| MVP content scope | **52 move definitions** (already authored in library) + **move-parameterized Twee templates** (small number, face-voiced). No need for 120 Twee files — the library carries the mechanics, Twee wraps it in narrative. |
| NarrativeTemplate | **In scope.** Extract the 4-category template spine (awareness → emotional_processing → behavioral_experiment → action) into a `NarrativeTemplate` (kind: EPIPHANY). Move categories map directly to WCGS stages. |

## Non-Goals (Explicit Exclusions)

- AI-generated ritual content (future layer, not MVP)
- Composer wizard UI changes (it becomes backend-only, not redesigned)
- Mobile-specific optimizations (existing runner is responsive; sufficient)
- Tile sprite textures (keep colored rects for rooms; textures are cosmetic future work)
- Inter-nursery portals (only hub↔nursery; no Wake Up→Clean Up direct links)
- Domain translations beyond `gather_resources` (extensible later per campaign allyship domain)
- Level 2+ moves (library is Level 1 only; higher levels are future content)

## Conceptual Model

```
Campaign Hub (octagon clearing)
  └── Spoke Portal [0-7]
        └── Spoke Introduction Room (campaign-scoped)
              │  "Welcome to the Burning Garden..."
              │  [Face NPCs — select GM voice for this session]
              │
              ├── Wake Up Nursery Room
              │     └── [Activity Anchor] → resolveNurseryMoves(nation, archetype, wake_up)
              │           → Move: "Spot the Spark" (nation) + "Breathe into Courage" (archetype)
              │           → Face voice wraps the core_prompt in authored prose
              │           → Structured BAR: bar_prompt_template + 4-field reflection
              │
              ├── Clean Up Nursery Room
              │     └── [Activity Anchor] → Adventure: nation×face×cleanUp Twee
              │           └── BAR created at climax passage
              │
              ├── Grow Up Nursery Room
              │     └── [Activity Anchor] → Adventure: nation×face×growUp Twee
              │           └── BAR created at climax passage
              │
              └── Show Up Nursery Room
                    └── [Activity Anchor] → Adventure: nation×face×showUp Twee
                          └── BAR created at climax passage
```

**WHO**: Player (authenticated, campaign member, has nation + archetype)
**WHAT**: Ritual CYOA that metabolizes emotional charge into a BAR
**WHERE**: Spatial nursery room → adventure runner → back to nursery → back to spoke
**Energy**: Emotional vector (channel + altitude) → ritual arc → BAR (insight/vibe/story)
**Throughput**: One BAR per ritual completion. Receipt recorded in hub ledger.

## API Contracts (API-First)

### getNurseryRoomsForSpoke

**Input**: `{ instanceId: string, spokeIndex: number }`
**Output**: `{ rooms: Array<{ id, slug, nurseryType, name, hasActiveRitual: boolean }> }`

```ts
'use server'
export async function getNurseryRoomsForSpoke(
  instanceId: string,
  spokeIndex: number
): Promise<{ rooms: NurseryRoomSummary[] }>
```

### launchNurseryRitual

**Input**: `{ nurseryRoomId: string, face: GameMasterFace, emotionalVector?: EmotionalVector }`
**Output**: `{ adventureId: string, startPassage: string, returnPath: string }`

Resolves the correct authored Adventure for this nation×face×move combination. If no exact match exists, falls back to a generic move-scoped adventure.

```ts
'use server'
export async function launchNurseryRitual(
  nurseryRoomId: string,
  face: GameMasterFace,
  emotionalVector?: EmotionalVector
): Promise<{ adventureId: string; startPassage: string; returnPath: string }>
```

### completeNurseryRitual

**Input**: `{ adventureId: string, barText: string, epiphanyType: string, releasePath?: string }`
**Output**: `{ barId: string, receiptId: string }`

Creates the BAR, records the build receipt in the hub ledger, and returns the player to the nursery room.

```ts
'use server'
export async function completeNurseryRitual(input: {
  adventureId: string
  barText: string
  epiphanyType: 'change' | 'boundary' | 'passion' | 'lie'
  releasePath?: 'confront' | 'transform' | 'sacrifice'
  spokeIndex: number
  instanceId: string
  face: GameMasterFace
  emotionalVector: EmotionalVector
}): Promise<{ barId: string; receiptId: string }>
```

### seedNurseryRooms

**Input**: `{ instanceId: string, spatialMapId: string, spokeIndex: number }`
**Output**: `{ rooms: MapRoom[] }`

Creates 4 nursery rooms + anchors for a spoke. Called once per spoke during campaign setup.

```ts
// scripts/seed-nursery-rooms.ts (or server action for lazy-create)
export async function seedNurseryRooms(
  instanceId: string,
  spatialMapId: string,
  spokeIndex: number
): Promise<MapRoom[]>
```

## User Stories

### P1: Player enters spoke and sees spatial introduction room

**As a** player who has reached a spoke on the campaign hub, **I want** to enter a spatial room that introduces the spoke's theme, **so that** I feel like I'm entering a place, not loading a page.

**Acceptance**:
- Spoke portal from hub navigates to `/world/{instanceSlug}/spoke-{i}-intro`
- Introduction room renders in Pixi with campaign-scoped welcome text
- 4 nursery portals visible (labeled Wake Up, Clean Up, Grow Up, Show Up)
- Portal back to campaign hub visible

### P2: Player walks into a nursery room and launches a ritual

**As a** player in the introduction room, **I want** to walk through a nursery portal and start a guided ritual, **so that** I experience the game's emotional alchemy as a narrative journey.

**Acceptance**:
- Nursery room renders with activity anchor
- Stepping on anchor opens ritual launch modal (or auto-launches)
- Ritual plays via adventure runner with authored Twee content
- GM face speaks in authored voice throughout
- Ritual has clear phases (intake → core ritual → witness → BAR)

### P3: Player creates a BAR at the climax of the ritual

**As a** player at the witness/epiphany stage of a ritual, **I want** to write my BAR commitment inline within the ritual flow, **so that** the BAR feels like a natural outcome of the emotional work, not a form field.

**Acceptance**:
- GenerateBAR passage renders inline BAR creation component
- Player writes "I will..." commitment
- BAR is created and linked to the adventure + spoke
- Completion passage witnesses the commitment with authored prose

### P4: Player returns to nursery room after ritual

**As a** player who completed a ritual, **I want** to return to the nursery room with a visible record of what I did, **so that** I feel the ritual had lasting impact.

**Acceptance**:
- Adventure completion routes back to nursery room
- Nursery room shows completion indicator (e.g., glowing anchor, receipt badge)
- Player can walk back to introduction room and choose another nursery

### P5: Campaign-scoped introduction room

**As a** GM/admin, **I want** the spoke introduction room's aesthetic and welcome text to come from the campaign, **so that** each campaign feels distinct while sharing the nursery structure.

**Acceptance**:
- Introduction room tilemap can vary per campaign (or use a template)
- Welcome text / NPC dialogue sourced from campaign config
- Nursery room structure is consistent across campaigns

## Functional Requirements

### Phase 1: Spatial Nursery Infrastructure

- **FR1**: `buildNurseryRoom(nurseryType)` generates tilemap + anchors for each nursery type
- **FR2**: `buildSpokeIntroRoom(campaignRef, spokeIndex)` generates the introduction room with 4 nursery portals + hub return portal
- **FR3**: Seeding script creates 5 rooms per spoke (1 intro + 4 nurseries) as MapRoom rows
- **FR4**: Spoke portal in campaign hub routes to introduction room instead of flat seeds page
- **FR5**: Introduction room renders campaign-scoped welcome text via anchor or NPC dialogue

### Phase 2: Ritual Adventure Wiring

- **FR6**: Import Pyrakanth Clean-Up Twee via `twee-to-flow` pipeline as first canonical Adventure
- **FR7**: `launchNurseryRitual()` resolves correct Adventure for nation×face×move
- **FR8**: Adventure runner renders authored passages with choices (existing infrastructure)
- **FR9**: GenerateBAR passage node renders inline BAR creation component
- **FR10**: `completeNurseryRitual()` creates BAR, records receipt in hub ledger, routes back to nursery

### Phase 3: Content Authoring Pipeline

- **FR11**: Twee template structure documented (intake → core ritual → witness → BAR → completion)
- **FR12**: Second authored flow (e.g., Argyra×Shaman×Wake Up) validates the template is reusable
- **FR13**: Nation move names (Mirror Meditation, Burn Offering, etc.) seeded into Nation model columns
- **FR14**: Face×move routing table maps (face, nurseryType, nationElement) → adventureId

## Non-Functional Requirements

- No AI calls required for MVP (authored content only)
- Ritual CYOA must work on mobile (existing adventure runner is responsive)
- Room rendering must handle low-end devices (Pixi already optimized)
- BAR creation must be immediate (no loading state after "I will..." submission)

## Persisted Data & Prisma

No new schema changes needed. Uses existing models:
- `MapRoom` + `SpatialMapAnchor` (nursery rooms)
- `Adventure` + `AdventureNode` (ritual CYOA content via twee-to-flow)
- `CustomBar` (BAR created at ritual climax)
- `CampaignHubStateV1.completedBuilds` (receipt ledger)
- `Nation.wakeUp/cleanUp/growUp/showUp` (move name columns — need data seeding)

| Check | Done |
|-------|------|
| No new Prisma models needed | Yes |
| Seeding scripts for nursery rooms + nation moves | Pending |

## Gap Analysis: Post-Ritual Game Loop (Signal Feedback 2026-04-08)

### Signal

> "the ritual can be completed, but since I've already completed it I expect that what I input should be turned into a BAR and I should have the option to plant the BAR once I've completed the ritual"

### Root Cause

The ritual creates a `CustomBar` in the DB but doesn't integrate it into the spoke progression system. Five gaps:

| # | Gap | Status | Impact |
|---|-----|--------|--------|
| 1 | **Post-ritual BAR planting** | Missing | Player completes ritual but can't plant the BAR on the spoke. The ritual feels disconnected from the campaign. |
| 2 | **Hub ledger receipt** | Missing | `completeNurseryRitual()` creates a BAR but doesn't write a `CompletedBuildReceipt` to `CampaignHubStateV1.completedBuilds`. Hub has no knowledge the ritual happened. |
| 3 | **Nursery completion state** | Missing | Re-entering a completed nursery shows fresh "Begin Ritual" instead of the completed BAR. No spatial memory. |
| 4 | **Vibeulons + reward economy** | Missing | Every move defines `vibeulon_rules` (base_reward, stretch_bonus) but no rewards are awarded. |
| 5 | **Campaign-scoped intro room** | Missing | Intro room has no campaign-specific welcome text. First impression is a room of colored tiles, not a narrative space. |

### Design Decisions: Game Loop Closure (Move A)

| Topic | Decision |
|-------|----------|
| BAR planting target | `SpokeMoveBed` model — 4 slots per spoke (wakeUp, cleanUp, growUp, showUp), each with `anchorBarId`. Ritual BAR becomes the anchor bar on the matching slot. |
| Planting flow | After ritual completion, the `NurseryRitualFlow` completion phase shows the created BAR + a "Plant this on Spoke {N}" button. Calls existing `SpokeMoveBed` upsert pattern. |
| Hub receipt | `completeNurseryRitual()` writes a `CompletedBuildReceipt` to `CampaignHubStateV1.completedBuilds` on the Instance. Receipt includes face, moveId, barId, spokeIndex, vibeulons. |
| Nursery state check | `launchNurseryRitual()` also checks if this player has already completed this nursery (by querying SpokeMoveBed for matching campaignRef + spokeIndex + moveType). If completed, returns the existing BAR instead of a fresh ritual context. |
| Nursery activity anchor UX | When nursery is completed: show BAR summary card + "Already complete" badge. When not: show "Begin Ritual" as today. |
| Vibeulons | `completeNurseryRitual()` reads `vibeulon_rules` from the move's `effectsSchema` and creates vibeulon events. base_reward for completion, stretch_bonus if reflection quality meets threshold. |
| Idempotency | Same pattern as `plantSeedFromSpoke()` — check for existing BAR with matching `agentMetadata.sourceType: 'nursery_ritual'` + spokeIndex + moveType before creating. |

### Design Decisions: Campaign Intro Room (Move B)

| Topic | Decision |
|-------|----------|
| Welcome text source | `Instance.narrativeKernel` field (already exists, nullable). If set, displayed via a `welcome_text` anchor in the intro room. If null, show a generic "Welcome to the clearing" message. |
| Anchor type | New `welcome_text` anchor at center of intro room. Not interactive — renders as floating text overlay when player is nearby. |
| Face NPC context | Each face NPC greeting should reference the campaign's narrative kernel (if available) to ground the face in the campaign's story. |
| Rendering | HTML overlay positioned above the room center tile. Fades in on room entry, always visible. Campaign name + kernel text. |

### API Contracts: Game Loop Closure

#### completeNurseryRitual (revised)

**Input**: `{ moveId, barText, reflectionFields, coreResponse, face, spokeIndex, instanceId }`
**Output**: `{ barId, receiptId, vibeulonsAwarded, spokeMoveBedId }`

Now also:
- Writes `CompletedBuildReceipt` to hub ledger
- Awards vibeulons from `vibeulon_rules`
- Upserts `SpokeMoveBed` anchor with the created BAR

#### getNurseryCompletionState

**Input**: `{ instanceId, spokeIndex, nurseryType }`
**Output**: `{ completed: boolean, barId?: string, barTitle?: string, completedAt?: string }`

Checks if the current player has already completed this nursery. Used by NurseryActivityModal to switch between "Begin Ritual" and "Already Complete" views.

### User Stories: Game Loop Closure

#### P6: Player plants a BAR after completing a ritual

**As a** player who just completed a nursery ritual, **I want** to see the BAR I created and plant it on the spoke, **so that** my ritual work becomes part of the campaign's living structure.

**Acceptance**:
- Completion phase shows the BAR title + reflection summary
- "Plant on Spoke {N}" button is visible
- Clicking it creates/updates SpokeMoveBed anchor
- Hub ledger gets a CompletedBuildReceipt
- Vibeulons are awarded per move's vibeulon_rules

#### P7: Nursery remembers completion state

**As a** player returning to a nursery I've already completed, **I want** to see what I did there instead of a fresh ritual, **so that** the game world has memory.

**Acceptance**:
- Activity anchor shows "Completed" indicator
- Interact shows the BAR summary instead of "Begin Ritual"
- Player can still walk to other nurseries that aren't completed

#### P8: Campaign-scoped welcome in intro room

**As a** player entering the spoke intro room, **I want** to see a welcome message grounded in the campaign's story, **so that** I feel oriented before choosing a face and entering a nursery.

**Acceptance**:
- If Instance.narrativeKernel is set, it renders as a text overlay in the intro room
- Campaign name is displayed
- Generic fallback if no kernel set

### Functional Requirements: Game Loop Closure (Phase 2.5)

- **FR15**: `completeNurseryRitual()` writes `CompletedBuildReceipt` to `CampaignHubStateV1.completedBuilds`
- **FR16**: `completeNurseryRitual()` upserts `SpokeMoveBed` with BAR as anchor
- **FR17**: `completeNurseryRitual()` awards vibeulons from `vibeulon_rules`
- **FR18**: `getNurseryCompletionState()` checks SpokeMoveBed for existing anchor
- **FR19**: NurseryRitualFlow completion phase shows BAR + "Plant on Spoke" CTA
- **FR20**: NurseryActivityModal switches UI based on completion state
- **FR21**: Intro room renders Instance.narrativeKernel as welcome text overlay

## Six Game Master Face Analysis

### Shaman
Don't template-generate 120 flows. The Pyrakanth Clean-Up Twee has authored soul ("Even hesitation is information"). Deepen this one flow first. Let a real player complete it before multiplying.

### Challenger
Ship the vertical slice. Import the Twee, wire it to a real Adventure, make it playable. Stop designing; start wiring. The spoke seeds page is already broken — players can't use it. Replace it now.

### Regent
Seed the 20 national move names into the 5 Nation rows. Without data, the allyship matrix is lore without teeth. The `Nation.wakeUp/cleanUp/growUp/showUp` columns exist but are empty.

### Architect
The Pyrakanth flow's node structure is modular: Intake (3 nodes) → Guided Ritual (7 nodes) → Release (6 nodes) → Epiphany (5 nodes) → BAR (2 nodes). Extract this as a NarrativeTemplate (kind: EPIPHANY, stepCount: 5) after the first flow is playable.

### Diplomat
These docs are creator-authored lore, not AI-generated. Treat them as authoritative narrative voice. Save to `.agent/context/` so AI agents respect the tonal register. The Portland community's AI allergy demands this.

### Sage
Three moves in order: (1) Seed the world data (Regent). (2) Wire the Pyrakanth flow end-to-end (Challenger). (3) Extract the template spine (Architect). Don't template before you play. Don't generate before you author.

## Verification Quest

- **ID**: `cert-nursery-ritual-v1`
- **Steps**:
  1. Navigate to campaign hub → enter spoke portal
  2. Verify introduction room renders with campaign-scoped welcome
  3. Walk to Clean Up nursery portal → enter nursery room
  4. Launch ritual → verify Pyrakanth Clean-Up Twee plays with authored prose
  5. Complete 3-phase ritual (reveal → release → witness)
  6. Write BAR at GenerateBAR passage → verify BAR created in DB
  7. Verify completion passage renders witness text
  8. Return to nursery room → verify completion indicator
  9. Walk back to introduction room → verify all 4 nursery portals accessible

## Dependencies

- Spatial room system (MATURE — Pixi renderer, portal navigation, anchor system all production-proven)
- Adventure runner (`/adventure/[id]/play`) — existing, works
- `twee-to-flow` pipeline — existing, works
- `Nation` model with wakeUp/cleanUp/growUp/showUp columns — exist, need data seeding
- `CampaignHubStateV1.completedBuilds` — just added in this session

## References

- [NATION_FACE_INDIGENOUS_ALLYSHIP.md](../../docs/NATION_FACE_INDIGENOUS_ALLYSHIP.md) — 5×6 face×nation matrix with style notes
- [cyoa-flow-pyrakanth-clean-up.twee](../../docs/examples/cyoa-flow-pyrakanth-clean-up.twee) — canonical first ritual flow
- [PYRAKANTH_CLEAN_UP_SYSTEM_BRIEF.md](../../docs/examples/PYRAKANTH_CLEAN_UP_SYSTEM_BRIEF.md) — system brief with state model
- `src/lib/spatial-world/octagon-campaign-hub.ts` — reference room builder
- `src/lib/twee-to-flow/` — Twee import pipeline
- `src/lib/cyoa-composer/step-registry.ts` — existing composer steps (becomes backend resolver)
- `.feedback/cert_feedback.jsonl` — player signals that motivated this spec
- Prisma workflow: [prisma-migration-discipline skill](../../.agents/skills/prisma-migration-discipline/SKILL.md)
