# BARs Engine Spec - House System v0.1

Status: product/app spec

Purpose: define a bars-engine module for House selection, House profiles, House Trust, House Heat, House clocks, House moves, mission duties, and campaign packet integration.

Related manual artifacts:

- `House Sheet - Provisioners.md`
- `House Sheet - Weavers.md`
- `House Sheet - Linekeepers.md`
- `House Sheet - Lanternbearers.md`
- `Chapter 5 Prose Draft - The Four Houses v0.1.md`
- `BARs Engine Spec - Move Resolver v0.1.md`

## Product Goal

Build an interactive House system that helps players experience Houses as living practice factions, not static character labels.

The app should support:

- House browsing and selection
- House move cards
- House Trust and Heat trackers
- House clocks
- cross-House relationships
- mission duties
- House NPCs and contacts
- campaign packet House content
- integration with the Move Resolver

## Core Principle

The House system must preserve faction life.

Bad:

- player chooses "Provisioner"
- app adds one move
- House disappears until advancement

Good:

- player chooses "Provisioner"
- app records House question, move, feature, shadow, clock, rival contact, Trust, Heat, and mission duties
- House state changes through play
- campaign packets can add House-facing content

## User Flow

## 1. Browse Houses

The House browser displays:

- House name
- domain
- core question
- motto
- symbol / crest
- gift
- shadow
- starting move
- feature
- clock
- advancement prompt

Users can compare Houses by:

- what they notice
- how they help
- what they get wrong
- which Basic Moves they often modify
- sample scene response

## 2. Select House During Character Creation

When a player chooses a House, the app writes to the Student Record:

- house id
- starting move id
- house feature id
- house advancement prompt
- house shadow
- starting House relationship prompt
- any starting Trust or Heat selected during character creation

The app should allow:

- choose House directly
- answer reflective prompts and receive recommendations
- view all four House questions before choosing

## 3. Track House Trust

Each student and crew may track Trust with any House.

Trust state:

- 0 unknown / neutral
- 1 recognized
- 2 trusted
- 3 sponsored

Trust can be attached to:

- student
- crew
- NPC
- mission faction
- campaign packet faction

The app should let players mark Trust with a reason:

- honored House question
- accepted correction
- repaired misuse
- protected domain
- completed House duty
- teacher approval
- campaign packet reward

At 3 Trust, the app should offer a "House Support" interaction:

- choose support type
- record source NPC or House office
- attach cost or obligation if any
- log support in Chronicle
- flag support as used for this episode

Support types:

- teacher counsel
- specialized resource
- protected meeting
- mission lead
- trusted contact
- cross-House training
- temporary move card

## 4. Track House Heat

Each student and crew may track Heat with any House.

Heat state:

- 0 no active concern
- 1 watched
- 2 challenged
- 3 summoned

The app should let players mark Heat with a reason:

- ignored House question
- misused House method
- created cleanup burden
- dismissed warning
- triggered House shadow
- campaign packet consequence

At 3 Heat, the app should require a House scene before Heat increases again.

House scene types:

- hearing
- confrontation
- mentorship session
- repair request
- public correction
- field evaluation
- ominously polite tea

After the scene, the app should offer resolution options:

- reduce Heat to 1 after sincere repair
- reduce Heat to 2 after partial concession
- keep Heat at 3 if student refuses accountability
- convert Heat into a campaign thread

## 5. House Move Cards

Each House move card includes:

- trigger
- Basic Move category
- roll stat options
- 10+ outcome
- 7-9 outcome
- 6- outcome
- options list
- token hooks
- artifact updates

Starting move cards:

- Provisioners: Move The Right Resource
- Weavers: Name The Missing Role
- Linekeepers: Draw The Line
- Lanternbearers: Light The Pattern

Integration with Move Resolver:

- House move can be selected before or during Basic Move selection
- app preselects compatible Basic Moves and stats
- app logs House move result to Student Record and Chronicle
- app suggests Trust / Heat changes after resolution
- app suggests House clock advance when shadow consequences appear

## 6. House Features

Each House feature is once per episode.

Feature cards:

- Provisioners: Supply Cache
- Weavers: The Smallest Container
- Linekeepers: Stand In The Doorway
- Lanternbearers: Consent Before Signal

The app should track:

- available / used state
- scene used
- fictional description
- cost chosen if applicable
- token or Trust changes
- Chronicle note

Features reset:

- at start of new episode
- manually by Guide
- when a campaign packet grants an extra use

## 7. House Clocks

Each House has a default six-step clock.

Default clocks:

- Provisioners: Burnout Spiral
- Weavers: Process Collapse
- Linekeepers: Escalation Spiral
- Lanternbearers: Spectacle Spiral

Clock records include:

- clock id
- House id
- current step
- visible description
- linked mission or episode
- triggers
- consequence notes
- cleared / resolved state

The app should allow:

- advance clock
- reduce clock
- reset clock
- attach clock to mission
- attach clock to NPC or faction
- convert filled clock into episode consequence

## 8. Mission Duties

Before or during a mission, the app may prompt the table to assign House duties.

Duties:

- Provisioner: What resource or capacity must be tracked?
- Weaver: What structure or handoff must exist?
- Linekeeper: What line must not be crossed?
- Lanternbearer: What truth must be handled with consent?

Duty records include:

- duty id
- House id
- assigned student / crew / unassigned
- mission id
- answer text
- current status
- related clocks
- final reflection

Statuses:

- open
- active
- neglected
- fulfilled
- transformed

Neglected duties should suggest:

- mark Heat
- advance House clock
- introduce House NPC challenge
- create end-of-episode reflection

Fulfilled duties should suggest:

- mark Trust
- reduce Heat
- mark Growth if tied to advancement prompt
- add Chronicle note

## 9. Cross-House Training

Cross-House training becomes available when:

- Trust with another House reaches 2
- campaign packet grants opportunity
- Guide adds teacher invitation
- player requests growth around a repeated blind spot

Training record includes:

- student id
- primary House id
- training House id
- teacher / rival / peer NPC
- training question
- blocking habit
- linked Basic Move
- reward
- status

Possible rewards:

- temporary move card
- extra option on a House move
- once-per-episode question
- Heat reduction path
- House contact
- future advancement unlock

## 10. House NPC Registry

The app should support House NPCs.

NPC fields:

- name
- House
- role
- student leader status
- graduation track / Journeyman readiness
- field campaign history
- House voice excerpt
- common room / cultural notes
- attitude toward student / crew
- Trust / Heat relationship
- teaching specialty
- favorite question
- current demand
- campaign packet tag

NPC roles:

- Head of House
- lieutenant teacher
- senior student leader
- peer rival
- senior student
- quartermaster
- archivist
- evaluator
- contact

House NPCs should be reusable across campaign packets.

## 11. Campaign Packet Integration

Campaign packets should be able to define House content:

- featured House
- pressure House
- House NPCs
- House Trust opportunities
- House Heat risks
- House clock triggers
- House-specific mission rewards
- cross-House training opportunities
- House-specific scenes

The app should surface packet content contextually:

- during mission setup
- when a House duty is assigned
- when a move creates Trust or Heat
- when a House clock fills
- during end-of-episode review

## 12. Data Model Sketch

Core entities:

- House
- HouseMove
- HouseFeature
- HouseClockTemplate
- HouseClockInstance
- HouseRelationship
- HouseDuty
- HouseTraining
- HouseNPC
- HouseSupportUse

House:

- id
- name
- domain
- coreQuestion
- motto
- symbolDescription
- gift
- shadow
- knownFor
- getsWrong
- advancementPrompt

HouseRelationship:

- id
- subjectType
- subjectId
- houseId
- trust
- heat
- trustReasonLog
- heatReasonLog
- supportUsedThisEpisode

HouseDuty:

- id
- missionId
- houseId
- assignedToId
- question
- answer
- status
- linkedClockId
- reviewNote

## 13. Acceptance Criteria

The House System is ready for prototype when:

1. A player can choose a House and see its question, move, feature, shadow, and advancement prompt on their Student Record.
2. A table can track House Trust and House Heat from 0 to 3.
3. At 3 Trust, the app can create a House Support record.
4. At 3 Heat, the app can create a required House scene.
5. A House move can pass its result to the Move Resolver.
6. A House feature can be marked used once per episode.
7. A House clock can advance and produce a Chronicle note.
8. A mission can assign and review House duties.
9. Campaign packets can add House-specific NPCs, rewards, risks, and clock triggers.

## 14. Open Product Questions

1. Should House Trust and Heat exist separately for each student and the whole crew?
2. Should Trust at 3 auto-renew each episode, or require an upkeep scene?
3. Should House Support be Guide-approved or player-triggered?
4. Should campaign packets be allowed to override default House clocks?
5. Should cross-House training become part of advancement, or remain an optional module?

## Recommendation

For the first interactive version:

- track House Trust and Heat per student and per crew
- let Guide approve House Support at 3 Trust
- make 3 Heat create a required scene card
- keep default House clocks available in every campaign
- allow campaign packets to add custom clock triggers, not replace the default clocks
- make cross-House training optional until playtesting shows it belongs in core advancement
