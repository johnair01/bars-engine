
# Spec Kit Prompt — Bridge Scenario Engine (Archetype-Gated Multiplayer Encounter System)

You are implementing a new subsystem in the **bars-engine** codebase.

This subsystem enables players at a party or campaign session to participate in a **live cooperative scenario**, similar in spirit to a bridge simulator, where players coordinate actions to advance a shared mission.

However, in this system **mission progression is gated by archetypal capacities rather than seat roles.**

The system must be **API-first**, integrate with the existing **campaign / BAR / quest / vibeulon ecosystem**, and preserve lineage.

---

# Developer-Facing Summary

The Bridge Scenario Engine is a multiplayer encounter system embedded within campaigns.

Players join a live **scenario run** where each participant occupies a **scenario seat** (an interface position with information and controls) but progresses the mission using the **capacities of their archetype**.

Scenario progression occurs through **phase-based state transitions** driven by player actions, facilitator interventions, and scenario triggers.

Scenarios may mint downstream artifacts such as:

- BARs
- quest updates
- vibeulon allocations
- daemon traces
- campaign state changes

The system must support **facilitator (GM) oversight** and preserve lineage between scenario events and resulting game artifacts.

---

# Ontological Model

## Scenario Seats

Seats represent **operational interfaces** within a scenario.

Examples may include:

- Comms
- Scanner
- Navigation
- Systems Triage
- Pattern Board
- Operations Lead

Seats determine:

- what information a player sees
- what UI controls they have
- what kinds of scenario actions they can submit

Seats **do not determine progression authority.**

---

## Archetypes

Archetypes represent **transformational capacities** within the system.

Progression through scenario phases may require actions associated with specific archetypes.

Known archetypes include:

- The Danger Walker
- The Bold Heart
- The Still Point
- The Truth Seer
- The Joyful Connector
- The Subtle Influence
- The Decisive Storm
- **[Eighth Archetype — MUST BE DISCOVERED FROM THE CODEBASE]**

Before implementing archetype-gated logic:

You **must search the repository** for the canonical archetype set.

Search for:

archetype  
dangerWalker
boldHeart
stillPoint
truthSeer  
joyfulConnector  
subtleInfluence  
decisiveStorm  

Also search for:

- enums
- models
- archetype ability definitions
- archetype quest logic
- archetype tags
- archetype UI labels

If the eighth archetype exists in the codebase, use the **canonical definition exactly as implemented.**

Do **not invent or rename archetypes.**

If the archetype list is incomplete in the codebase, report findings and request clarification.

---

# Core Design Principle

Scenario advancement is **archetype-gated**, not seat-gated.

Meaning:

A phase may require actions aligned with specific archetypes, regardless of which seat a player occupies.

Example conceptual progression:

Phase: "Signal Interpretation"

Requires:
- Truth Seer action
- Joyful Connector synchronization

Seat location does not determine capability; **archetype alignment does.**

---

# Non-Negotiable Rules

1. Implement API-first architecture
2. Do not assume the repo lacks scenario or encounter systems
3. Seats and archetypes must remain **separate concepts**
4. Archetypes gate progression, not seats
5. Facilitator controls must be first-class
6. Preserve lineage from scenario outcomes into BARs / quests / vibeulons / daemon systems
7. Twine may be integrated for narrative content but **must not be the authoritative runtime state**

---

# Required Process

## Step 1 — Search the Existing Codebase

Before proposing implementation, inspect the repo for:

scenario  
mission  
encounter  
campaign  
instance  
phase  
stateMachine  
archetype  
roleAssignment  
twine  
event  
socket  
quest  
BAR  
vibeulon  
daemon  
facilitator  
gm  

Identify:

- existing scenario systems
- campaign instance structures
- event feed infrastructure
- real-time messaging
- archetype definitions
- quest outcome pipelines

Document:

- files found
- structures discovered
- extension points
- conflicts with this feature

---

# Required Entities (Proposed)

## BridgeScenarioDefinition

Represents a reusable scenario template.

Fields:

- id
- slug
- name
- description
- scenarioType
- campaignId (optional)
- phaseGraph
- roleSeatDefinitions
- archetypeRequirements
- visibilityRules
- winConditions
- failConditions
- twineStoryId (optional)

---

## BridgeScenarioRun

Represents one live mission instance.

Fields:

- id
- scenarioDefinitionId
- campaignId
- instanceId
- status
- currentPhaseKey
- sharedStateJson
- facilitatorUserId
- startedAt
- endedAt

---

## BridgeSeatAssignment

Maps players to scenario seats.

Fields:

- id
- scenarioRunId
- userId
- seatType
- archetype
- privateStateJson
- status

---

## BridgeAction

Represents a player action submitted during the scenario.

Fields:

- id
- scenarioRunId
- userId
- seatAssignmentId
- archetype
- phaseKey
- actionType
- payloadJson
- visibility
- resolvedAt

---

## BridgeTriggerEvent

Represents system-triggered transitions.

Fields:

- id
- scenarioRunId
- phaseKey
- triggerType
- sourceActionId
- resultJson

---

## BridgeOutcome

Represents downstream effects.

Fields:

- id
- scenarioRunId
- outcomeType
- targetEntityType
- targetEntityId
- metadataJson

Possible outcome types:

- BAR_MINTED
- QUEST_UPDATED
- VIBEULON_ALLOCATED
- DAEMON_TRACE_CREATED
- CAMPAIGN_STATE_CHANGED

---

# Scenario State Model

Scenarios progress through phases.

Example phase structure:

briefing  
signal_detected  
pattern_interpretation  
resource_commitment  
critical_decision  
resolution  
aftermath  

Each phase defines:

- required archetypes
- required actions
- visibility rules
- completion conditions
- timeout rules
- next phase transitions

---

# API Surface (Initial)

## Scenario Definitions

GET /api/bridge-scenarios  
POST /api/bridge-scenarios  
PATCH /api/bridge-scenarios/:id  

---

## Scenario Runs

POST /api/bridge-runs  
GET /api/bridge-runs/:id  
POST /api/bridge-runs/:id/start  
POST /api/bridge-runs/:id/pause  
POST /api/bridge-runs/:id/complete  

---

## Seat Assignment

POST /api/bridge-runs/:id/assign-seat  
GET /api/bridge-runs/:id/seats  

---

## Player Actions

POST /api/bridge-runs/:id/actions  

---

## Event Feed

GET /api/bridge-runs/:id/events  

---

## Facilitator Controls

POST /api/bridge-runs/:id/facilitator/inject-event  
POST /api/bridge-runs/:id/facilitator/advance-phase  
POST /api/bridge-runs/:id/facilitator/reveal-info  

---

# Deftness Hooks

Add extension points for evaluation.

Examples:

deftnessService.evaluateScenarioAction()  
deftnessService.evaluateRoleFit()  
deftnessService.evaluatePhaseTransition()  
deftnessService.evaluateFacilitatorIntervention()  
deftnessService.evaluateScenarioOutcome()  

These hooks should record evaluation metadata but **not enforce scoring yet.**

---

# UI Scope (Minimal)

Initial UI should support:

- scenario lobby
- seat selection
- phase display
- action interface
- shared event feed
- facilitator control panel

Do not build complex UI systems in this phase.

---

# Edge Cases

Handle:

- missing archetype
- duplicate seat assignment
- out-of-phase actions
- facilitator override conflicts
- partial player participation
- scenario abandonment

---

# Non-Goals

This feature should **not**:

- implement a full simulation engine
- replace Twine narrative tooling
- hardcode archetypes
- assume seat == archetype
- implement complex scoring systems

---

# Output Required

Return an implementation plan structured as:

1. Existing Structures Found
2. Archetype Discovery Results
3. Schema / Model Plan
4. Migration Plan
5. Service Architecture
6. API Implementation Plan
7. Phase Engine Design
8. Facilitator Controls
9. Deftness Hooks
10. Testing Strategy
11. Assumptions / TODOs

Where useful include:

- Prisma schema snippets
- TypeScript interfaces
- service method signatures
- migration notes
