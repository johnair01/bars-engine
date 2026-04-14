# Spec: NPC Ritual Encounter — Named NPCs + CYOA Ritual Journey

## Purpose

Wire the authored CYOA Twee content through named NPC encounters in spatial rooms, so that players experience an **immersive narrative journey** — not a form wizard — that produces a BAR they carry to a nursery to plant.

**Problem**: Three layers of work exist but aren't integrated:
1. **Authored CYOA content** — The Pyrakanth Clean-Up Twee has 20 nodes of immersive narrative (charcoal plains, burn offering ritual, ember witness, 3 release paths). It's sitting in `docs/examples/` unplayed.
2. **Move library mechanics** — 52 moves with core_prompt, bar_integration, vibeulon_rules. Drives rewards and BAR creation. Currently rendered as form fields.
3. **Spatial NPC encounters** — Named NPCs (Ignis, Kaelen, etc.) in intro rooms. Currently show a modal with a greeting and "Walk with [Face]."

None of these connect. The Twee provides the world. The move library provides the mechanics. The NPCs provide the character. They need to be one experience.

**Practice**: Deftness Development. The adventure runner already plays Twee content. The twee-to-flow pipeline already converts Twee → Adventure + Passage rows. Don't rebuild what exists.

## The Integration Architecture

```
Player walks to Ignis in intro room
  → Interact → NPC encounter modal shows Ignis's identity
  → "Enter Ignis's trial" → opens adventure runner
  → Adventure runner plays the Pyrakanth Clean-Up Twee
    → 20 nodes of authored CYOA with choices
    → At GenerateBAR passage: bar_emit creates BAR with move library metadata
    → At CompleteReflection: ceremony + "Return to the clearing"
  → Player returns to intro room, carrying BAR
  → Walks to Clean Up nursery → plants BAR on spoke bed
```

The key insight: **adventure then reflection.** The adventure runner plays the authored CYOA (landscape, choices, emotional arc). At the reflection point — after the Witness/Epiphany passages — the 321 dialogue opens for NPC-voiced integration. The BAR emerges from the 321 reflection, not from a form field.

```
CYOA Adventure (experience)     →  321 Reflection (integration)  →  BAR (output)
charcoal plains, burn offering     "What does your anger want       "From Tend the Fire,
release paths, ember witness        you to DO?" (Ignis-voiced)       I learned that ______"
player makes choices                It... You... I...                carry → plant in nursery
```

The adventure runner handles the CYOA. At the seam passage (after Epiphany, before GenerateBAR), the runner hands off to a 321 reflection phase — the same proven Shadow/321 dialogue but voiced by the NPC and contextualized by what the player just experienced in the CYOA. The BAR emerges from the 321, enriched with move library metadata.

## The 6 Named NPCs

| NPC | Face | Nation | Tagline | Their CYOA |
|-----|------|--------|---------|------------|
| **Ignis** the Unbroken | challenger | Pyrakanth (fire) | "Passion through Friction" | Pyrakanth Clean-Up Twee (**exists**) |
| **Kaelen** the Moon-Caller | shaman | Virelune (wood) | "Spontaneous Growth" | Needs authoring |
| **Sola** the Heart of Lamenth | diplomat | Lamenth (water) | "Beauty in Tragedy" | Needs authoring |
| **Aurelius** the Law-Giver | regent | Meridia (earth) | "Balance at Noon" | Needs authoring |
| **Vorm** the Master Architect | architect | Argyra (metal) | "Precision for the Forge" | Needs authoring |
| **The Witness** | sage | All | "The Meta-Observer" | Needs authoring |

Each NPC offers a distinct CYOA adventure with their voice, their nation's landscape, and their face's developmental lens. Ignis's Twee is the template for all 6.

## What Makes Each NPC's CYOA Feel Different

This is the sharp delineation requirement. Same spine (intake → reveal → release → witness → BAR), different world:

| Phase | Ignis (fire/challenger) | Kaelen (wood/shaman) |
|-------|------------------------|---------------------|
| **Opening** | "You carry anger from the land of fire. What work do you want to do with it?" | "Something is growing beneath the surface. What is it reaching toward?" |
| **Landscape** | Charcoal plain, thick red sky, pit of blackened stones | Moonlit forest clearing, moss-covered roots, living soil |
| **Reveal** | "Where in your body do you feel this anger?" | "If this feeling were a seed, what kind of light does it need?" |
| **Release paths** | Confront / Transform / Sacrifice (fire metaphors) | Listen / Compost / Tend (growth metaphors) |
| **Witness** | "This is your essence. Anger protected it." (ember in ashes) | "This is what was growing. Joy is beneath everything." (sprout through stone) |
| **BAR prompt** | "Take this insight and craft an action." | "Name what the green moon showed you." |
| **Pacing** | Fast, direct, confrontational | Slow, poetic, invitational |

## Design Decisions

| Topic | Decision |
|-------|----------|
| Ritual engine | **Two-stage**: Adventure runner plays the authored CYOA (immersive story). At the reflection seam, a 321 dialogue phase opens (NPC-voiced integration). BAR emerges from the 321. Both stages are part of one continuous experience. |
| Twee as source of truth | Each NPC's CYOA is an authored Twee file. Import via `twee-to-flow` pipeline. One Adventure per NPC. The Twee handles the world; the 321 handles the depth work. |
| NPC encounter trigger | Face NPC anchor in intro room → NpcEncounterModal shows NPC identity → "Enter [NPC]'s trial" routes to `/adventure/[slug]/play?returnTo=/world/...&npc=[id]` |
| Two-stage seam | The Twee CYOA runs until the Epiphany passages (EpiphanyChange/Boundary/Passion/Lie). Instead of going directly to GenerateBAR, the adventure runner detects a `actionType: 'ritual_321'` tag on the seam passage and opens the 321 reflection phase as an inline component. After 321 completes, the BAR is created and the adventure continues to CompleteReflection. |
| 321 reflection phase | Adapts our ThreeTwoOneDialogue (or Shadow321's talk phases) with NPC-voiced questions. Ignis asks "What does your anger want you to DO?" Kaelen asks "What is the green moon showing you?" The 321 is contextualized by the CYOA epiphany type the player chose. |
| BAR from 321 | The structured BAR emerges from the 321 reflection. `bar_prompt_template` from the move library prefills the prompt. The 4-field reflection (what_i_did, what_happened, what_resistance_appeared, what_changed) captures the integration. BAR is created with full move library metadata + vibeulons. |
| NPC voice in CYOA passages | Authored directly in the Twee prose — each file is written in that NPC's voice. No runtime injection needed. The Twee IS the experience voice. The 321 is the reflection voice (same NPC, deeper register). |
| Carry-and-plant flow | After CYOA completion, player returns to intro room with `?carrying=[barId]`. Walking to nursery activity anchor shows "Plant [BAR]" CTA. |
| Return path | Adventure runner uses `returnTo` URL param (existing). Returns player to spatial room after completion. |
| MVP content | **1 NPC fully playable**: Ignis (Pyrakanth Clean-Up Twee exists). Other 5 NPCs show "This guide's trial is not yet available." |
| Session persistence | Adventure runner already saves progress via `PlayerAdventureProgress`. Player can resume mid-CYOA. |

## What We Build vs What Already Exists

| Component | Status | Work Needed |
|-----------|--------|-------------|
| Adventure runner | **Exists** | Minor: add ritual metadata handling at bar_emit passage |
| twee-to-flow pipeline | **Exists** | None — import Twee as-is |
| Pyrakanth Clean-Up Twee | **Exists** (docs/examples/) | Tag GenerateBAR with bar_emit metadata |
| Named NPCs | **Exists** in Shadow321Runner | Extract to shared constant |
| Spatial intro room | **Exists** (Phase 1 complete) | Update face_npc anchors with NPC names |
| FaceNpcModal | **Exists** | Redesign as NpcEncounterModal (show named character, route to adventure) |
| NurseryActivityModal | **Exists** | Add "carrying BAR" plant mode |
| bar_emit handling | **Exists** in AdventurePlayer | Enrich with move library metadata (vibeulon_rules, etc.) |
| SpokeMoveBed planting | **Exists** (Phase 2.5) | Extract into standalone `plantBarOnSpoke()` |
| "Carrying BAR" HUD state | **Missing** | URL params + floating indicator |
| Import script for Twee | **Missing** | Script to run twee-to-flow + create Adventure + Passage rows |
| 5 more NPC Twee files | **Missing** | Content authoring (future — not MVP) |

## Conceptual Model

```
Spoke Introduction Room
  │
  ├── [Ignis the Unbroken] ← Interact
  │     → NpcEncounterModal: portrait, tagline, "Enter Ignis's Trial"
  │     → Route: /adventure/pyrakanth-clean-up/play?returnTo=/world/bb-bday-001/spoke-0-intro&npc=ignis
  │     → Adventure runner plays 20-node Pyrakanth Twee
  │     → At GenerateBAR: bar_emit creates BAR inline
  │     → At CompleteReflection: ceremony → redirect to returnTo?carrying=[barId]
  │
  ├── [Kaelen] ← "This guide's trial is not yet available"
  ├── [Vorm] ← "..."
  ├── [Aurelius] ← "..."
  ├── [Sola] ← "..."
  ├── [The Witness] ← "..."
  │
  └── 4 Nursery Portals
        ├── Clean Up Nursery ← if carrying BAR: "Plant [title]" → SpokeMoveBed
        ├── Wake Up Nursery ← "Visit an NPC to begin"
        ├── Grow Up Nursery ← "..."
        └── Show Up Nursery ← "..."
```

## API Contracts

### importTweeAsAdventure (script)

**Input**: Twee file path, adventure slug, NPC metadata
**Output**: Adventure + Passage rows in DB

```bash
npx tsx scripts/import-npc-twee.ts --file docs/examples/cyoa-flow-pyrakanth-clean-up.twee --slug pyrakanth-clean-up --npc ignis
```

### plantBarOnSpoke (new server action)

**Input**: `{ barId: string, instanceSlug: string, spokeIndex: number, nurseryType: string }`
**Output**: `{ planted: boolean, spokeMoveBedId: string }`

Extracted from completeNurseryRitual — just the planting logic.

### completeNpcRitual (enrichment at bar_emit)

When AdventurePlayer creates a BAR via bar_emit, enrich with:
- Move library metadata (vibeulon_rules → award vibeulons)
- Hub ledger receipt (CompletedBuildReceipt)
- NPC + face metadata on the BAR

## User Stories

### P1: Player encounters named NPC in spatial room

**As a** player in the spoke intro room, **I want** to meet Ignis the Unbroken (not "Challenger"), **so that** I feel like I'm in a world with characters.

**Acceptance**: Walking to Ignis shows his name, tagline, description, and "Enter Ignis's Trial."

### P2: NPC launches immersive CYOA adventure

**As a** player who chose Ignis, **I want** to play through the Pyrakanth Clean-Up story with choices, landscapes, and emotional arc, **so that** the ritual feels like a narrative journey.

**Acceptance**: 20-node Twee plays through the adventure runner with authored prose, branching choices (Confront/Transform/Sacrifice), and narrative pacing.

### P3: BAR created at CYOA climax

**As a** player at the GenerateBAR passage, **I want** to write my BAR inline within the story, **so that** it emerges from the narrative, not from a form.

**Acceptance**: bar_emit renders at the GenerateBAR passage. Player writes commitment. BAR created with move library metadata + vibeulons.

### P4: Player carries BAR back and plants it

**As a** player who completed the CYOA, **I want** to return to the intro room carrying my BAR, then walk to the matching nursery to plant it, **so that** planting is a deliberate spatial act.

**Acceptance**: "Carrying: [BAR title]" indicator visible. Nursery activity anchor shows "Plant" CTA. Planting updates SpokeMoveBed.

## Functional Requirements

### Phase 1: Import + Play Twee

- **FR1**: Import Pyrakanth Clean-Up Twee via twee-to-flow → Adventure + Passage rows
- **FR2**: Tag GenerateBAR passage with `actionType: 'bar_emit'` metadata
- **FR3**: Verify adventure plays at `/adventure/pyrakanth-clean-up/play`

### Phase 2: NPC Encounter Wiring

- **FR4**: Extract named NPCs to shared `src/lib/npc/named-guides.ts`
- **FR5**: Redesign FaceNpcModal → NpcEncounterModal (named NPC identity + "Enter trial" CTA)
- **FR6**: NPC anchor routes to `/adventure/[slug]/play?returnTo=...&npc=[id]`
- **FR7**: Map NPC → Adventure slug (ignis → pyrakanth-clean-up, etc.)
- **FR8**: Unavailable NPCs show "This guide's trial is not yet available"

### Phase 3: Carry + Plant

- **FR9**: Adventure completion redirects to `returnTo` with `?carrying=[barId]`
- **FR10**: "Carrying BAR" indicator in room HUD
- **FR11**: Nursery activity anchor: carrying → "Plant" CTA; not carrying → "Visit NPC first"
- **FR12**: `plantBarOnSpoke()` server action
- **FR13**: Enrich bar_emit with move library metadata (vibeulons, hub receipt)

## Dependencies

- Adventure runner (`/adventure/[id]/play`) — exists, proven
- twee-to-flow pipeline — exists, proven
- Pyrakanth Clean-Up Twee — exists at `docs/examples/cyoa-flow-pyrakanth-clean-up.twee`
- Spatial nursery rooms — exists (Phase 1 of prior spec)
- Named NPCs — defined in Shadow321Runner, need extraction
- Move library — exists (52 moves, accessor)
- SpokeMoveBed planting — exists (Phase 2.5 of prior spec)

## References

- [cyoa-flow-pyrakanth-clean-up.twee](docs/examples/cyoa-flow-pyrakanth-clean-up.twee) — Ignis's CYOA (20 nodes)
- [PYRAKANTH_CLEAN_UP_SYSTEM_BRIEF.md](docs/examples/PYRAKANTH_CLEAN_UP_SYSTEM_BRIEF.md) — system brief
- Shadow321Runner — NPC identity source + gold standard UX patterns
- [cyoa-ritual-nursery-rooms spec](.specify/specs/cyoa-ritual-nursery-rooms/) — infrastructure (complete)
- [NPC world encounter model](memory: feedback_npc_world_encounter.md)
- [CYOA immersive context](memory: feedback_cyoa_immersive_context.md)
