# Narrative Game Mechanics & The Integral Emergences Story Engine

This document outlines the collaborative storytelling inspirations behind the Integral Emergences Story Engine and maps them to the system's data schema.

## Core Inspirations

### 1. Hearts Blazing
**Influence:** Roles & Scene Structure
- **Concept:** A collaborative game where players create a 22-episode sci-fi season.
- **Roles:** The specific roles in the engine—**Ace, Leader, Engineer, Veteran, Rookie**—are directly lifted from Hearts Blazing.
- **Mechanics:**
    - **Episode Decks:** Players pull from decks to inspire scenes.
    - **Screen Time Economy:** Players bid on screen time using "cliché cards" (spotlight moments).
    - **Philosophy:** No winning condition; the goal is a competitive yet humane management of spotlight/narrative focus.

**Schema Mapping:**
- **Roles:** The `Role` model in Prisma (`key` enum: ACE, VETERAN, ENGINEER, ROOKIE, LEADER) enforces this structure.
- **Screen Time:** Partially represented by `Vibulon` economy (bidding/action potential) and `CustomBar` claiming (taking "scenes" or quests).

### 2. Thirsty Sword Lesbians
**Influence:** Playbooks & Narrative Arcs
- **Concept:** Players embody archetypes via Playbooks with specific emotional/narrative triggers.
- **Mechanics:**
    - **Narrative Arcs:** Each Playbook has a specific narrative trajectory.
    - **Retirement:** A character ceases to be a "player" (retires/transforms) once their Playbook's conditions/arc are completed.

**Schema Mapping:**
- **Playbooks:** The `Playbook` model defines the archetype.
- **Moves:** Stored as `moves` (JSON) and specific lifecycle moves:
    - `wakeUp` (Awareness)
    - `cleanUp` (Shadow work)
    - `growUp` (Development)
    - `showUp` (Action/Climax)
- **Progression:** The `QuestThread` and `QuestPack` structures likely manage the "Arc", with `allowedPlaybooks` filtering content relevant to specific narrative paths.

### 3. The Quiet Year
**Influence:** Projects & Journeys
- **Concept:** A map-drawing game where the community works on "Projects" that take time to complete.
- **Mechanics:**
    - **Projects:** Long-term undertakings represented by dice on the map.
    - **Map of Meaning:** (Aspirational) The movement of resources (Vibulons) through the system creates a "map of meaning," similar to a Twine-like Choose Your Own Adventure structure.
- **Schema Mapping:**
    - **Journeys:** `QuestThread` and `QuestPack` are the "Projects". They are long-term collaborative or individual efforts that shape the world.
    - **Vibulon Provenance:** `Vibulon.originTitle` and `generation` track the movement of value through the "map," creating a history of interaction.

### 4. Fiasco
**Influence:** Structure & Chaos
- **Concept:** A game of powerful ambition and poor impulse control.
- **Mechanics:**
    - **Two Acts & The Tilt:** The story is strictly divided into two acts. In the middle, a "Tilt" occurs—destabilizing elements that throw the story into chaos.
    - **Relationships:** Currently modeled via "Clan Dynamics" (Shared Nation/Playbook) rather than specific dyadic bonds.
- **Schema Mapping:**
    - **Global Acts:** `GlobalState.currentAct` (Int) tracks the macro-narrative phase.
    - **The Tilt:** A system-wide event (likely an Admin or `StoryTick` trigger) that transitions `currentAct` from 1 to 2, introducing new complications or "Tilt" elements into the active `CustomBar` pool.

## System Implementation Analysis

### Move Rendering
The system renders "moves" primarily through:
- **Playbook Definitions:** `Playbook` records containing JSON definitions of special moves.
- **Lifecycle Triggers:** Explicit columns for `wakeUp`, `cleanUp`, `growUp`, `showUp` on `Playbook` and `Nation` models.
- **Action Events:** `VibulonEvent` tracks `archetypeMove` execution (e.g., THUNDERCLAP, NURTURE, COMMAND) which align with role archetypes.
- **Quest/Bar Types:** `CustomBar` has a `moveType` field, linking specific quests to these lifecycle stages.

### Future Alignment Goals
- Ensure the "bidding" mechanic from Hearts Blazing is felt in the Vibeulon economy.
- Visualising the "Arc" completion state from Thirsty Sword Lesbians more clearly in the UI.
