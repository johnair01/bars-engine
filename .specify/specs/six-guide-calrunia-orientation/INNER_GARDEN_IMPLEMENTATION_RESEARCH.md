# Inner-Garden Implementation Research

> Companion artifacts:
> - [GUIDE_CAMPAIGN_MATRIX.md](./GUIDE_CAMPAIGN_MATRIX.md) defines the six Guide campaigns as game types, player fantasies, core loops, and unlock paths.
> - [CALRUNIAN_OPPOSITION_MATRIX.md](./CALRUNIAN_OPPOSITION_MATRIX.md) grounds each Guide's heroic opposition in existing Calrunia lore and world logic.
> - [BARS_CALRUNIA_WORLD_MECHANICS.md](./BARS_CALRUNIA_WORLD_MECHANICS.md) explains how BARs function as the membrane object between outer-world behavior and inner-world Calrunian play.
> - [PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md](./PIXI_TO_INNER_GARDEN_BRIDGE_DECISION.md) frames the Pixi world as a draft/proving ground and defines the deprecation/bridge decision path.
>
> This document answers the implementation question: how can those six game types be created by integrating the current bars-engine Pixi world draft with the more robust Inner Garden prototype in the Library?

## Source Correction

The first pass of this document was based on the **current bars-engine Pixi world draft**, especially campaign hub rooms, spoke portals, face NPCs, nursery rooms, carried BARs, planted spoke beds, and the Collaboration Board.

That was useful, but incomplete.

There is a separate and more robust **Inner Garden source prototype** in the Library:

```text
The Library/04 Quests/Campaigns/inner-garden
```

That prototype is not yet fully incorporated into bars-engine. It contains the stronger game design layer:

- farming loop
- emotion-to-seed loop
- harvest-to-card loop
- cultivation progression
- BAR deck mechanics
- cultivation manuals
- trigram advocate NPCs
- Calrunia nation data
- local save/state loop
- manual bridge export back to bars-engine charge capture

So the corrected integration frame is:

> The bars-engine Pixi world is the current host surface. The Library Inner Garden prototype is the richer game design source that should upgrade it.

## Producer Read

The combined system already contains the bones of a playable RPG campaign loop.

The current bars-engine Pixi world gives us a navigable campaign membrane:

```text
enter world
-> choose a Guide face
-> pick or generate a move
-> carry a BAR
-> enter a nursery
-> complete a ritual or plant the BAR
-> record spoke progress
-> show campaign growth
```

That is close enough to the six Guide campaign idea that the next move should be composition, not invention.

The Library Inner Garden prototype gives us a fuller cultivation game:

```text
real emotional input / BAR
-> seed
-> plant
-> water / nurture / meditate
-> harvest fruit
-> mint or unlock card
-> strengthen cultivation
-> use card / manual / quest progress
-> export bridge payload or return to outer-world action
```

> Recommendation: use bars-engine as the integrated product shell and persistence layer, while importing the Inner Garden prototype's farming, cultivation, deck/manual, BAR-to-card, and advocate ideas as the upgrade path for Calrunian play.

## Library Inner Garden Prototype Findings

### 1. The prototype already knows what the game is about

`DESIGN.md` defines Inner Garden as a game about transforming real emotions into virtual power. Its four pillars match the Mastering Allyship move ladder:

| Inner Garden Pillar | Prototype Meaning | Allyship Meaning |
|---------------------|------------------|------------------|
| Wake Up | discover skills, cards, lore, intentions | notice the real signal |
| Clean Up | process emotional/material accumulation | metabolize charge and shadow |
| Grow Up | permanent progression, cultivation levels, strategy | build capacity and structure |
| Show Up | daily engagement, real-life consistency | take the outer-world move |

### 2. The prototype has the BAR-to-card loop we need

`DeckSystem.js` already treats BARs as a game input:

```text
BAR fields
-> mint witness card
-> spend card for cultivation reflection
-> export bridge payload
```

This is the missing inner-world character object layer: a BAR can become a card, a card can become a cultivation technique, and a technique can become a repeatable play verb.

### 3. Farming is the embodied metaphor missing from bars-engine

`FarmingSystem.js` provides concrete verbs:

- plant seed
- water crop
- nurture crop
- advance growth stage
- harvest fruit
- upgrade garden

Current bars-engine has BAR maturity, Garden panels, Hand/Vault, and spoke planting, but not a spatially embodied tending loop. The prototype's farming system is the strongest candidate for making allyship feel like practice rather than content consumption.

### 4. Emotion is already playable material

`EmotionSystem.js` turns real-life emotional entries into seeds, with intensity affecting quality and meditation improving the seed before planting.

This maps cleanly to bars-engine:

```text
charge_capture / CustomBar
-> emotion channel
-> seed quality
-> planting / nurturing
-> harvest
-> card / move / cultivation growth
```

### 5. Cultivation gives players inner-world identity

`CultivationSystem.js` tracks virtue stats, cultivation experience, Qi, cultivation level, and breakthrough progress.

This answers a gap from the broader design conversation:

> Players need a character identity inside the inner world.

In the prototype, the player is not just a user with tasks. They are a cultivator with stats, Qi, levels, cards, manuals, and a garden.

### 6. Calrunia advocates are closer to sect gameplay than current Guide NPCs

`CalruniaAdvocates.js` contains a 5 nation x 8 trigram advocate roster. That is more granular than the six Game Master faces and more aligned with the sect/archetype work.

Important implication:

> The six Game Master faces can introduce types of games, while the eight trigram advocate/sect lines can determine the player's deeper Calrunian discipline.

The faces are game modes. The sects are lineages.

### 7. The bridge already exists in miniature

`BarChargeBridge.js` exports an `ig-bar-charge-bridge.v0` payload that maps Inner Garden BAR/card state back toward bars-engine `charge_capture`.

That means the integration does not have to begin with a full rewrite. The prototype already assumes a bridge pattern:

```text
inner-garden object
-> bridge JSON
-> bars-engine charge/custom BAR
```

## Existing Bars-Engine Host Structure

### 1. Campaign Hub

The octagon campaign hub already gives campaigns a world map.

Existing support:

- `buildOctagonCampaignHubRooms` creates an eight-spoke hub.
- Each spoke is entered through a `spoke_portal` anchor.
- `campaignHubState` can store spoke-level hexagram, changing-line, face, and completion data.
- The Card Club portal already connects world play back to an outer product surface.

Design interpretation:

> The hub is the campaign board. It is where outer-world problems become explorable Calrunian territory.

### 2. Spoke Clearing

Each spoke intro room already provides Guide selection.

Existing support:

- `buildSpokeIntroRoom` creates a clearing with six `face_npc` anchors.
- The six faces are Shaman, Challenger, Regent, Architect, Diplomat, and Sage.
- `FaceNpcModal` lets a player choose a Guide, pick a move, launch an authored trial, and carry a generated BAR.
- Face selection persists through room navigation with `?face=`.

Design interpretation:

> The spoke clearing is the threshold where a player chooses what kind of game they are playing.

### 3. Nurseries

Each spoke has four activity rooms.

Existing support:

- `wake-up`
- `clean-up`
- `grow-up`
- `show-up`

Each nursery has a `nursery_activity` anchor that can launch a ritual or accept a carried BAR.

Design interpretation:

> The nursery is the mechanic room. It turns Guide intent into a BAR artifact that can be planted into campaign state.

### 4. BAR Carrying And Planting

The world already treats BARs as portable inner-world objects.

Existing support:

- `RoomCanvas` carries selected BAR state across world rooms through `?carrying=`.
- `FaceNpcModal` can create or select a move BAR and place it into the player's carrying state.
- `NurseryActivityModal` detects carried BARs and offers to plant them.
- `plantBarOnSpoke` anchors the BAR into a `SpokeMoveBed`.
- `plantKernelFromBar` lets later players add supporting kernels to the same bed.
- `CollaborationBoard` visualizes planted beds across spokes.

Design interpretation:

> Planting is already the world-state write. It is the moment an outer-world allyship object becomes Calrunian campaign progress.

## Revised Core Reuse Pattern

The six Guide campaigns can be built by combining the two loops:

```text
outer-world problem
-> captured BAR
-> Guide face selection
-> seed/card/manual/cultivation treatment
-> nursery room, farm plot, ritual, or authored trial
-> BAR/card transformation
-> planted garden or spoke evidence
-> visible campaign and character progress
-> outer-world move
```

The game type changes by Guide. The product shell and persistence should stay stable.

## Six Guide Games Inside The Existing Loop

| Guide | Game Type | Prototype Mechanic To Import | bars-engine Host Piece | First Playable Slice |
|-------|-----------|------------------------------|-----------------------|----------------------|
| Shaman | Ritual transformation RPG | emotion seed, meditation boost, harvest-as-insight | Emotional Alchemy, `clean-up`, BAR maturity | Charged BAR becomes a planted seed, then a harvested insight card |
| Challenger | Threshold action RPG | card/manual technique for decisive action | Move Generator, `show-up`, `QuestMoveLog` | A pressure BAR becomes a Challenger card that must be spent on an outer action |
| Regent | Stewardship and oath RPG | cultivation level, Qi, responsibility stats | Roles, commitments, `HandSlot`, campaign membership | A player takes an oath card/manual and plants it as public stewardship |
| Architect | Builder / strategy RPG | farm upgrade / plot expansion / growth planning | `CampaignMilestone`, `MilestoneNeed`, `SpokeMoveBed` | A campaign need becomes a growable build plot with contribution kernels |
| Diplomat | Social alliance RPG | advocate NPCs, visas/citizenship, relationship manuals | invitations, shares, aid offers, membership | An invitation BAR becomes a bridge card that recruits or repairs a relationship |
| Sage | Oracle / synthesis RPG | manual selection, trigram advocate reading, pattern diagnosis | I Ching, `hexagramId`, `campaignHubState` | A hexagram recommends a Guide face, sect/manual, and next cultivation move |

## Three Production Options

### Option A: Bridge The Prototype As A Separate Play Surface

This is the fastest way to honor the robust prototype without forcing a rewrite.

Keep the Inner Garden canvas game as its own playable artifact, but add a clean bars-engine bridge.

Player experience:

```text
I capture or choose a BAR in bars-engine.
I send it into Inner Garden.
It becomes a seed/card/manual object.
I play the garden loop.
I export/return the result into bars-engine.
```

Pros:

- Respects the prototype as a working game.
- Lowest disruption to bars-engine.
- Lets people feel the gardening/cultivation loop quickly.
- Builds on the existing bridge export idea.

Risks:

- Split experience across surfaces.
- Auth and persistence remain awkward until an API bridge exists.

### Option B: Import Inner Garden Mechanics Into Pixi Rooms

Use bars-engine Pixi rooms as the host, but implement Inner Garden mechanics as React/Pixi panels and actions.

Examples:

- farm plots become room anchors
- seeds become `CustomBar` records or child records
- cards become BAR/manual artifacts
- cultivation level becomes player progress
- advocates become world NPC anchors

Pros:

- Unified app experience.
- Uses bars-engine auth, database, and campaign state.
- Makes Guide campaigns feel native.

Risks:

- More engineering cost.
- Requires schema decisions.
- Could lose the prototype's simple game feel if over-productized.

### Option C: Full Calrunian Cultivation RPG In Bars-Engine

This is the long-term direction: planted BARs visibly repair rooms, alter NPC dialogue, unlock nation rooms, reveal sects, and change campaign weather.

Pros:

- Most magical.
- Best match for the long-term Calrunian promise.

Risks:

- Highest cost.
- Easy to overbuild before the core allyship loop is validated.

## Recommended First Slice

Build a thin version of Option A, then migrate toward Option B.

The first slice should prove one sentence:

> A real outer-world allyship problem can enter Inner Garden as a BAR, become a seed/card through play, and return to bars-engine as a usable allyship move or planted campaign artifact.

Minimum viable path:

1. Player selects a BAR in bars-engine.
2. bars-engine creates an Inner Garden bridge payload.
3. Inner Garden imports that BAR as a seed or witness card.
4. Player plants, nurtures, meditates, or harvests it.
5. Inner Garden exports a result payload.
6. bars-engine imports that result as a `CustomBar`, `charge_capture`, planted spoke bed, or campaign contribution.
7. The campaign hub or Garden surface shows visible progress.

This respects the existing prototype and gives bars-engine a clear integration target.

## Guide Mechanics From Existing Pieces

### Shaman

Best existing fit:

- Inner Garden emotion seed and meditation loop
- `clean-up` nursery
- Emotional Alchemy
- 3-2-1 ritual pattern
- `NurseryRitualFlow`
- BAR maturity from raw charge to named insight

Mechanic:

> Convert charge into meaning.

The Shaman Guide should be introduced when the player has a BAR with emotional heat, ambiguity, projection, grief, fear, or shadow.

### Challenger

Best existing fit:

- Inner Garden manual/card technique loop
- `show-up` nursery
- Move Generator
- carried BAR
- `QuestMoveLog`
- planted action evidence

Mechanic:

> Convert avoidance into a decisive move.

The Challenger Guide should be introduced when the player has named the problem but has not yet acted.

### Regent

Best existing fit:

- cultivation stats, Qi, levels
- roles and membership
- commitment BARs
- `HandSlot` as oath loadout
- `SpokeMoveBed` as public responsibility

Mechanic:

> Convert willingness into held responsibility.

The Regent Guide should be introduced when a player is ready to own a role, keep a promise, or steward a recurring obligation.

### Architect

Best existing fit:

- farm plots, garden upgrades, growth planning
- `grow-up` nursery
- `CampaignMilestone`
- `MilestoneNeed`
- `MilestoneContribution`
- Collaboration Board

Mechanic:

> Convert concern into structure.

The Architect Guide should be introduced when a problem is too large for one move and needs a plan, sequence, or scaffold.

### Diplomat

Best existing fit:

- Calrunia advocate NPC roster
- wandering cultivators / visa / citizenship design
- invitation BARs
- Gameboard Aid Offers
- shares
- campaign membership and roles
- spoke kernels from multiple players

Mechanic:

> Convert isolation into relationship.

The current nursery set does not include an `open-up` room even though the broader WAVE move grammar includes Open Up. For the first slice, Diplomat can use `wake-up`, `grow-up`, and `show-up` as "read the room, build the bridge, send the invitation." A later slice should consider adding an Open Up room or equivalent relationship anchor.

### Sage

Best existing fit:

- cultivation manuals
- trigram advocate reading
- I Ching
- `hexagramId`
- `campaignHubState.spokes`
- `getFacesForHexagram`
- orientation face filtering

Mechanic:

> Convert complexity into pattern.

The Sage Guide should be introduced when the player does not know which Guide or move is appropriate. Sage reads the situation and recommends available faces, sects, or next moves.

## Unlock Logic

The current orientation code already thinks in six independently completable face packets.

Existing support:

- `compileOrientationMetaPacket`
- `ORIENTATION_SUB_PACKET_FACES`
- per-face sub-packet status
- all-six completion state

Production interpretation:

> Orientation packets are the tutorial layer; inner-garden Guide campaigns are the embodied layer.

Possible unlock ladder:

| Completion | Unlock |
|------------|--------|
| Complete first Guide orientation | enter that Guide's spoke loop |
| Plant first Guide BAR | unlock that Guide's basic app surface |
| Plant all four nursery types for one Guide | unlock Guide campaign completion |
| Complete multiple Guide campaigns | reveal nation and sect identity |
| Complete Sage synthesis | unlock I Ching-driven Guide recommendations |

## I Ching As Campaign Weather

The engine already supports a useful bridge between divination and Guide selection:

- `CustomBar.hexagramId` can attach oracle context to player material.
- `campaignHubState.spokes[].hexagramId` can make a spoke feel divinatorily alive.
- `getFacesForHexagram` maps hexagram trigrams to available Game Master faces.

This lets the I Ching operationalize allyship without becoming a separate lore page:

```text
player brings problem
-> oracle names the pattern
-> trigrams recommend available Guide faces
-> Guide turns pattern into a move
-> BAR plants evidence into the campaign
```

This is the strongest current route from divinatory power to allyship practice.

## Gaps To Resolve

### 0. Integration Source Of Truth

The current spec must treat `The Library/04 Quests/Campaigns/inner-garden` as a source artifact, not a side note.

Immediate action:

- define what should be ported
- define what should remain linked/prototyped
- define what bars-engine owns
- define what the Library prototype owns

### 1. Guide Campaign Registry

There is no single authored registry that says:

- which Guide owns which game type
- which nursery types are preferred
- which app surfaces unlock
- which antagonist pressure is active
- which completion condition counts

This can be a lightweight content registry before it is a database model.

### 2. Open Up Has No Nursery

The broader move grammar has Wake, Open, Clean, Grow, Show, but the inner garden currently has only Wake, Clean, Grow, Show.

Decision needed:

- add an Open Up nursery later
- treat Open Up as a Diplomat-specific modal
- fold Open Up into Wake/Grow/Show for the first implementation slice

### 3. Guide Completion Is Not Yet World Completion

Orientation can track face packet completion, and planting can track spoke bed progress, but there is not yet a unified "Guide campaign status" that connects:

```text
orientation completion
-> inner-garden action
-> app unlock
-> outer-world evidence
```

### 4. Lore Unlocks Need Action Gates

Lore should appear when it solves the player's current problem.

Good gates:

- after a player chooses a Guide
- after a player plants a BAR
- after a player gets blocked
- after a hexagram recommends a face
- after a campaign spoke shows a specific antagonist pattern

Weak gates:

- showing Calrunia encyclopedia pages before the player has a task
- explaining nations and sects before the player has felt why identity matters

### 5. Campaign State Needs Better Feedback

The Collaboration Board already shows planted beds, but the player-facing meaning is still early.

Needed:

- "what changed because I planted this?"
- "what does this unlock?"
- "who can build on this?"
- "what outer-world move should happen next?"

### 6. BAR-To-Seed/Card Schema

The prototype has `ig-bar-charge-bridge.v0`, but bars-engine needs an inbound and outbound contract.

Needed:

- bars-engine BAR to Inner Garden seed
- bars-engine BAR to Inner Garden witness card
- Inner Garden harvest to bars-engine `CustomBar`
- Inner Garden spent card to bars-engine move evidence
- Inner Garden cultivation/manual progress to bars-engine unlock status

### 7. Persistence Strategy

Inner Garden currently uses local save state. bars-engine uses account-backed persistence.

Possible sequence:

1. manual import/export
2. signed payload handoff
3. API-backed read/write
4. native bars-engine persistence

## What To Build Next

The deft next move is not only a Guide Campaign Registry. It is a **BAR-to-Inner-Garden bridge contract** plus one playable Guide slice.

Recommended slice:

> Shaman Guide using the Library Inner Garden prototype loop, bridged back into bars-engine.

Why Shaman first:

- The source prototype already turns emotional input into seeds.
- Emotional Alchemy already has strong conceptual fit.
- Clean Up nursery already exists.
- Players can understand the before/after: charged material becomes usable insight.
- It naturally introduces nations after the player has experienced emotional terrain.

Alternative strong slice:

> Sage Guide as the Guide selector.

Why Sage first:

- It operationalizes I Ching immediately.
- It can recommend which of the six games the player should play.
- It becomes the orientation engine for the whole stack.

Producer choice:

Start with Shaman if the goal is emotional proof.
Start with Sage if the goal is system coherence.

For putting this in front of people, Shaman is more legible. Sage is more architecturally elegant.

## Evidence From The Codebase And Library

bars-engine files reviewed:

- `src/lib/spatial-world/octagon-campaign-hub.ts`
- `src/lib/spatial-world/nursery-rooms.ts`
- `src/app/world/[instanceSlug]/[roomSlug]/RoomCanvas.tsx`
- `src/components/world/AnchorModal.tsx`
- `src/components/world/FaceNpcModal.tsx`
- `src/components/world/NurseryActivityModal.tsx`
- `src/components/campaign-hub/CollaborationBoard.tsx`
- `src/actions/nursery-ritual.ts`
- `src/actions/plant-bar-on-spoke.ts`
- `src/actions/spoke-move-seeds.ts`
- `src/lib/quest-grammar/orientationMetaPacket.ts`
- `src/lib/quest-grammar/iching-faces.ts`
- `src/lib/quest-grammar/types.ts`

Library Inner Garden files reviewed:

- `The Library/04 Quests/Campaigns/inner-garden/DESIGN.md`
- `The Library/04 Quests/Campaigns/inner-garden/BARS_ENGINE_INNER_GARDEN_GAP.md`
- `The Library/04 Quests/Campaigns/inner-garden/GAP_ANALYSIS.md`
- `The Library/04 Quests/Campaigns/inner-garden/SPEC_DECK_MECHANICS.md`
- `The Library/04 Quests/Campaigns/inner-garden/js/core/Game.js`
- `The Library/04 Quests/Campaigns/inner-garden/js/systems/FarmingSystem.js`
- `The Library/04 Quests/Campaigns/inner-garden/js/systems/EmotionSystem.js`
- `The Library/04 Quests/Campaigns/inner-garden/js/systems/CultivationSystem.js`
- `The Library/04 Quests/Campaigns/inner-garden/js/systems/DeckSystem.js`
- `The Library/04 Quests/Campaigns/inner-garden/js/systems/QuestSystem.js`
- `The Library/04 Quests/Campaigns/inner-garden/js/data/CalruniaAdvocates.js`
- `The Library/04 Quests/Campaigns/inner-garden/js/data/BarChargeBridge.js`
