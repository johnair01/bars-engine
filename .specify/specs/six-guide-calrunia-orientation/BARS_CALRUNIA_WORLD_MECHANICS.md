# BARs and Calrunia World Mechanics

> Companion artifacts:
> - [GUIDE_CAMPAIGN_MATRIX.md](./GUIDE_CAMPAIGN_MATRIX.md) defines the six Guide campaigns as game types, player fantasies, core loops, and unlock paths.
> - [CALRUNIAN_OPPOSITION_MATRIX.md](./CALRUNIAN_OPPOSITION_MATRIX.md) grounds each Guide's heroic opposition in existing Calrunia lore and world logic.
> - [INNER_GARDEN_IMPLEMENTATION_RESEARCH.md](./INNER_GARDEN_IMPLEMENTATION_RESEARCH.md) maps the six game types onto the inner-garden systems already present in bars-engine.
>
> This document answers the production question underneath both: how do BARs let outer-world player behavior affect inner-world Calrunian play?

## Producer Frame

This project has already spent real time and money building a large set of systems. The pre-production mandate is therefore:

> Do not invent a new game layer until the existing bars-engine pieces have been turned into playable loops.

The core pieces already in the engine:

- `CustomBar`: the universal object for notes, charges, quests, invitations, offers, evidence, and campaign artifacts.
- `HandSlot`: a bounded six-slot in-world inventory.
- Vault / Garden maturity: captured BARs mature from raw capture into contextualized, elaborated, shared, acted, and integrated material.
- Move Generator: turns BARs into move-ready action.
- Emotional Alchemy / 3-2-1: metabolizes charge.
- Superpower translation: turns allyship cards into personalized quests.
- Campaigns / Instances: outer-world causes and inner-world play spaces.
- Milestones / Needs / Contributions: real-world campaign impact.
- Gameboard Aid Offers: offers of help attached to campaign slots.
- I Ching / Hexagram context: oracle/pattern layer.
- Nations / Archetypes / Sects: identity, terrain, discipline.

The design problem:

> How do outer-world player actions affect inner-world Calrunian play, and how does inner-world play return as changed outer-world behavior?

The answer should be built around BARs.

## BARs As The Membrane Object

BARs are the object that can exist on both sides of the portal.

| Outer-World Meaning | Calrunian Meaning | Existing Engine Support |
|---------------------|------------------|-------------------------|
| note / captured thought | seed / talisman / carried charge | `CustomBar`, `seedMetabolization` |
| active concern | object in the Hand | `HandSlot` |
| action commitment | quest or move | `moveType`, `moveAspect`, `QuestMoveLog` |
| emotional material | elemental/national terrain | `nation`, `emotionalAlchemyTag`, 3-2-1 flows |
| campaign contribution | aid, milestone, need | `campaignRef`, `MilestoneNeed`, `MilestoneContribution`, `GameboardAidOffer` |
| evidence of action | world-state update | `storyContent`, `completionEffects`, `createdBarId` |
| invitation / social bridge | emissary object | invitation BARs, event invite BARs, shares |
| oracle-attuned situation | hexagram-marked artifact | `hexagramId`, I Ching context |

So the basic world rule can be:

> A BAR is a piece of outer-world reality that has been made playable inside Calrunia.

## Outer World To Inner World

The player affects Calrunia by bringing real material into the game as BARs.

```text
Outer-world situation
-> BAR capture
-> BAR enters Hand / Vault / Garden
-> Move, alchemy, superpower, Guide, or oracle reads it
-> Calrunian world state changes
```

Examples:

- A captured fear becomes an Argyran object in the Hand.
- A direct-action commitment becomes Breakpoint pressure in a campaign.
- An invitation BAR becomes a Diplomat emissary.
- A milestone contribution becomes visible world repair.
- A completed 3-2-1 becomes Shaman evidence that the Failed Mirror has cleared.
- An I Ching-attuned BAR becomes Sage narrative data.

## Inner World To Outer World

Calrunia affects the outer world by transforming BARs into moves, quests, invitations, offers, and contribution artifacts.

```text
Calrunian reading / game mode
-> move candidate
-> quest / commitment / invitation / offer
-> player acts outside the app
-> player returns with evidence
-> BAR matures and world state updates
```

The important loop is not "lore consumed." It is "behavior changed."

## Design Principles

### From Jane McGonigal

Make the work feel playable by giving players clear goals, voluntary obstacles, feedback, social meaning, and urgent optimism.

Application:

- Each Guide needs a visible win condition.
- The obstacle should be meaningful, not fake friction.
- The player should see evidence that their move mattered.
- Social play should make allyship feel collective rather than solitary.

### From Yu-kai Chou

Use motivational drivers carefully: meaning, accomplishment, ownership, social influence, scarcity, unpredictability, avoidance, and creativity.

Application:

- Unlocks should feel like earned mastery, not artificial scarcity.
- BARs create ownership.
- Guides create meaning.
- Campaign milestones create accomplishment.
- Invitations and aid offers create social influence.
- I Ching creates mystery, but must return to action.

### From C. Thi Nguyen

Games are designed agencies. Players temporarily take on goals and constraints to experience and practice forms of agency.

Application:

- Each Guide should give the player a distinct agency.
- Shaman agency is ritual transformation.
- Challenger agency is decisive interruption.
- Regent agency is stewardship.
- Architect agency is system-building.
- Diplomat agency is relational translation.
- Sage agency is pattern-reading into action.

## Multiple Design Options For BAR / World Intersection

### Option A: BARs As Carried Relics

**Pitch**: BARs are physicalized as objects in the player's Hand. The six-slot Hand is the immediate play inventory.

**Existing pieces**:

- `HandSlot`
- `HandGlance`
- `CustomBar.nation`
- `seedMetabolization`
- Move Generator

**Mechanic**:

- Player chooses which BARs to carry.
- A carried BAR influences available Guide routes, move candidates, nation reveal, and oracle readings.
- Hand size creates a meaningful constraint: what are you actually carrying now?

**Strengths**:

- Uses existing bounded inventory.
- Makes outer-world concerns feel embodied.
- Strong fit for Nguyen: players practice the agency of selective attention.

**Risks**:

- Could feel like inventory management unless the carried BARs visibly change play.

**Best use**:

- Default cross-world mechanic.

### Option B: BARs As Seeds That Grow The World

**Pitch**: BAR maturity determines how much a real-world concern has entered Calrunia.

**Existing pieces**:

- `seedMetabolization`
- Vault / Garden maturity labels
- `markMoveReady()`
- BAR Garden

**Mechanic**:

```text
Captured
-> context_named
-> elaborated
-> shared_or_acted
-> integrated
```

Each maturity stage changes the Calrunian expression:

| Maturity | Calrunian Expression |
|----------|----------------------|
| captured | seed / spark |
| context_named | named object / clue |
| elaborated | quest seed / terrain marker |
| shared_or_acted | world event / contribution |
| integrated | lore, title, unlock, or permanent world change |

**Strengths**:

- Already in code.
- Makes ordinary note-taking become world-building.
- Gives feedback without needing a large new map.

**Risks**:

- Maturity must be legible to players.

**Best use**:

- The backbone of BAR-to-Calrunia progression.

### Option C: BARs As Quest Fuel

**Pitch**: A BAR can be converted into a quest, and completing the quest changes both player state and campaign state.

**Existing pieces**:

- `sourceBarId`
- `questsFromBar`
- `QuestMoveLog`
- quest generation
- `moveType`, `moveAspect`, `allyshipTarget`

**Mechanic**:

- Player selects a BAR.
- Guide/move/oracle translates it into a quest.
- Quest completion creates a new BAR or move log.
- Returned evidence alters campaign progress or unlocks lore.

**Strengths**:

- Directly tied to changed behavior.
- Lets each Guide become a campaign with quests.

**Risks**:

- Quest generation has sprawled; must constrain scope.

**Best use**:

- Guide campaign episodes.

### Option D: BARs As Campaign Contributions

**Pitch**: BARs become scoped contributions toward real campaign milestones.

**Existing pieces**:

- `campaignRef`
- `MilestoneNeed`
- `MilestoneContribution`
- `GameboardAidOffer`
- superpower translation

**Mechanic**:

- Campaign has milestone needs.
- Player's BAR/superpower/orientation matches a need.
- BAR becomes offer, action, or evidence.
- Completion moves milestone progress.
- Calrunia reflects the campaign's healing/rebuilding.

**Strengths**:

- Strongest outer-world impact loop.
- Direct fit for Mastering Allyship.
- McGonigal-style meaningful social goal.

**Risks**:

- Requires careful campaign stewardship.

**Best use**:

- First public campaign / launch campaign.

### Option E: BARs As Oracle Cases

**Pitch**: A BAR is submitted to the I Ching / Sage layer as a live case.

**Existing pieces**:

- `hexagramId`
- I Ching cast context
- trigram/sect docs
- Move Generator candidate system

**Mechanic**:

- Player selects a BAR or outer-world tension.
- Cast/read hexagram.
- Upper/lower trigrams produce sect tension.
- Oracle adds a move candidate.
- Player acts and returns evidence.

**Strengths**:

- Clean bridge between outer artifact and inner-world lore.
- Turns I Ching into decision aid, not flavor.

**Risks**:

- If output is not actionable, it becomes decorative.

**Best use**:

- Sage Guide and sect introduction.

### Option F: BARs As World Wounds / Repairs

**Pitch**: Campaign BARs map to wounds in the Calrunian world; completed outer-world actions repair those wounds.

**Existing pieces**:

- campaign instances
- spatial maps / world rooms
- campaign milestones
- BARs collapsed from instances
- story bridges

**Mechanic**:

- Campaign defines a Calrunian region or crisis.
- BARs become wounds, resources, allies, or keys in that region.
- Completing moves changes the room, unlocks lore, or repairs a faction relationship.

**Strengths**:

- Most RPG-like.
- Makes collective progress visible.

**Risks**:

- Highest production cost.
- Should not be first unless reused through existing world room infrastructure.

**Best use**:

- Later campaign visualization layer after Guide mechanics prove themselves.

## Recommended Producer Strategy

Do not pick one option. Layer them by production cost:

```text
Foundation: BARs as Carried Relics
Progression: BARs as Seeds That Grow
Action: BARs as Quest Fuel
Impact: BARs as Campaign Contributions
Mystery: BARs as Oracle Cases
RPG World: BARs as World Wounds / Repairs
```

This lets us use what exists now while preserving the long-term Calrunian RPG fantasy.

## Mechanics By Guide Campaign

## Shaman Guide: Ritual Transformation Game

### Existing Pieces To Reuse

- BAR capture
- Emotional First Aid / 3-2-1
- `emotionalAlchemyTag`
- `nation`
- seed maturity

### Player Loop

```text
Choose charged BAR
-> name charge
-> perform 3-2-1 / alchemy ritual
-> create transformed meaning BAR
-> reveal emotional terrain / nation
```

### Core Mechanics

- **Charge Rating**: intensity gates ritual depth.
- **Shadow Dialogue**: player writes It / You / I.
- **Nation Reveal**: emotional channel maps to Calrunian terrain.
- **Mirror Clearing**: successful ritual advances BAR maturity.

### Outer-World Effect

The player stops acting from projection and creates a cleaner next move.

### Inner-World Effect

The Failed Mirror clears around a specific BAR, region, or NPC.

## Challenger Guide: Threshold Action Game

### Existing Pieces To Reuse

- Move Generator
- `moveType`
- `moveAspect`
- evidence fields
- QuestMoveLog
- BAR maturity

### Player Loop

```text
Choose avoided BAR
-> identify cost of delay
-> choose pressure move
-> commit deadline
-> complete action
-> return proof
```

### Core Mechanics

- **Threshold Clock**: player sets a real deadline.
- **Proof Of Move**: completion requires evidence text or artifact.
- **Dread Cut**: one decisive interruption can close a bad future but has cost.
- **Crisis Discipline**: system distinguishes needed urgency from habitual emergency.

### Outer-World Effect

The player does the avoided action.

### Inner-World Effect

The Uncut Future is closed before it roots.

## Regent Guide: Governance And Oath Game

### Existing Pieces To Reuse

- roles
- invitation roles
- campaign membership
- commitment BARs
- recurring quests
- campaign milestones

### Player Loop

```text
Accept role
-> define responsibility
-> create oath BAR
-> steward recurring commitment
-> review with evidence
```

### Core Mechanics

- **Oath BAR**: a role commitment becomes a persistent object.
- **Stewardship Track**: commitments are reviewed over time.
- **Authority With Consent**: role scope must be explicit.
- **Repair Action**: dropped commitments create repair quests, not shame loops.

### Outer-World Effect

The player holds a real responsibility more clearly.

### Inner-World Effect

The Burden Throne becomes a legitimate office instead of control or abdication.

## Architect Guide: Builder / Strategy Game

### Existing Pieces To Reuse

- campaign milestones
- milestone needs
- superpower translation
- campaign planning/admin tools
- quest generation

### Player Loop

```text
Choose messy goal
-> map structure gap
-> break into milestone needs
-> assign superpower-fit actions
-> test and revise
```

### Core Mechanics

- **Milestone Decomposition**: big work becomes scoped needs.
- **Dependency Map**: identify bottlenecks.
- **Need Cards**: each need is playable by a superpower/orientation.
- **Working Container Test**: a structure only succeeds if someone can use it.

### Outer-World Effect

The campaign gets a usable plan or coordination system.

### Inner-World Effect

The Endless Scaffold is converted into a living structure.

## Diplomat Guide: Social Alliance Game

### Existing Pieces To Reuse

- invitation BARs
- BAR sharing
- GameboardAidOffer
- campaign marketplace / aid offers
- social links / responses

### Player Loop

```text
Choose relational BAR
-> map people and tension
-> craft invitation / repair / bridge
-> send or offer
-> return relational signal
```

### Core Mechanics

- **Ally Map**: who is involved and what each person needs to receive.
- **Invitation Craft**: create an invitation BAR or share.
- **Repair Move**: name harm and next right contact.
- **Signal Return**: player records what happened relationally.

### Outer-World Effect

The player makes a move that lands better with people.

### Inner-World Effect

The Clouded Assembly becomes a table where truth and difference can be held.

## Sage Guide: Oracle / Synthesis Game

### Existing Pieces To Reuse

- I Ching casting
- `hexagramId`
- trigram/sect data
- Move Generator candidate list
- completed move review

### Player Loop

```text
Choose live BAR / tension
-> cast or read I Ching
-> identify upper/lower trigram
-> receive sect-of-the-moment
-> choose oracle move candidate
-> act and extract lesson
```

### Core Mechanics

- **Case Reading**: BAR becomes the oracle case.
- **Upper/Lower Force**: visible force and hidden force.
- **Sect Candidate**: oracle adds a move candidate to Move Generator.
- **Doctrine Extraction**: completed action produces a lesson BAR.

### Outer-World Effect

The player acts from pattern recognition rather than confusion.

### Inner-World Effect

The Deferred Synthesis advances without pretending to be complete.

## Three Viable Product Directions

### Direction 1: The Pragmatic Guide Layer

**Build only a Guide selection surface and use existing pages as unlock destinations.**

Flow:

```text
Need prompt
-> choose Guide
-> complete small quest
-> deep link to existing surface
```

Pros:

- lowest cost
- fast proof of orientation model
- uses existing app

Cons:

- lightest Calrunia fantasy

Best first if production risk is high.

### Direction 2: The BAR-As-Relic RPG Layer

**Make Hand/Vault/Garden the center of the first Calrunian RPG loop.**

Flow:

```text
capture BAR
-> carry in Hand
-> Guide reads carried BAR
-> move / alchemy / oracle transforms it
-> maturity changes
```

Pros:

- uses strongest existing cross-world object
- gives players a character-like inventory
- makes world logic visible

Cons:

- needs careful UX to avoid feeling abstract

Best first if we want the app to feel game-like quickly.

### Direction 3: The Campaign Impact RPG Layer

**Tie BARs directly to milestones, needs, offers, and visible campaign progress.**

Flow:

```text
campaign need
-> player superpower / Guide
-> BAR quest
-> real-world contribution
-> milestone progress
-> Calrunia repair
```

Pros:

- strongest allyship value
- proves changed behavior and impact
- good for first public campaign

Cons:

- needs steward-authored campaign content

Best first if the goal is putting this in front of people soon.

## Recommended First Slice

Build a **BAR Portal Loop** that can support all six Guides without implementing them all.

Minimal loop:

```text
Pick a BAR from Hand
-> ask "What kind of help do you need?"
-> recommend a Guide
-> run one Guide-specific mechanic
-> update BAR maturity / storyContent
-> produce one outer-world move
```

This should be deterministic and mostly use existing pages:

- Shaman routes to Emotional Alchemy / 3-2-1.
- Challenger routes to Move Generator.
- Architect routes to milestone/need planning.
- Diplomat routes to invitation/aid offer.
- Sage routes to I Ching / oracle candidate.
- Regent routes to role/commitment BAR.

## Design Guardrails

- Every inner-world effect must be backed by a BAR mutation, quest log, contribution, or unlock.
- Every Guide must return the player to a concrete outer-world action or artifact.
- Do not add new currencies until vibeulons and BAR maturity are clearly used.
- Do not add new world state if `CustomBar`, `Instance`, `Milestone`, or `QuestMoveLog` can hold the data.
- Lore should explain an experienced mechanic, not replace the mechanic.
- The player should always know: what am I carrying, what game am I playing, what changed because I acted?
