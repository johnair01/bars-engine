# Spec: BAR, Emotional Alchemy, Nook, and Between Integration

## The ask

> “Before this we need a plan to integrate bars with emotional alchemy and the nook and the between. Spirits and bars seem to want to connect and daemons have been slightly orphaned but I think that’s ok for now.” — Wendell, 2026-10-27

**Who it is for:** a player making something real through a BAR, and sometimes tending a relationship through a Between.
**What they feel now, and what should change:** BAR creation, Emotional Alchemy, the Nook, and the Between each hold meaningful parts of the player’s life, but currently ask the player to carry the continuity alone. They should read as one consentful loop: make → notice charge → work the pattern → return with a next move → optionally offer a distilled result to relationship space.

**New-player premise:** a BAR is an emergent anchor, not an admission requirement. A player without BARs or spirits must be able to enter the Nook, learn safely, work what is alive now, and decide later whether any outcome should become a BAR or spirit relationship.

## Purpose

Make the BAR the agency and provenance object that can open an Emotional Alchemy practice, feed a private Thought String constellation in the dojo, and receive the resulting practice insight back as a concrete BAR evolution. Spirits are the elemental, embodied companion and progression layer for this loop: they already inhabit the Between and will inhabit the Nook, where they can accompany BAR work, consume metabolized elemental energy, and grow toward ally state without exposing private material. The Nook is the player’s private threshold and navigation home; the Between is a deliberately shared relationship garden, never a default destination for private material.

## User stories

### Work a BAR without losing its lineage

**As a player**, I want to enter Emotional Alchemy or the dojo from a BAR and return to that same BAR with a visible, concrete next move, so the reflection serves something I am actually making.
**Acceptance:** a BAR’s detail surface shows its emotional reading, private constellation links, and player-selected practice outcomes without exposing raw reflective text.

### Begin before you have a BAR

**As a brand-new player**, I want to enter the dojo without first inventing a project, a BAR, or a spirit, so curiosity, friction, and desire can become meaningful material instead of a signup obstacle.
**Acceptance:** from the Nook, a player can choose Learn, Something alive now, or Make something. They may end a private practice by discarding it, settling it as a revisitable seed, or deliberately planting a BAR from it.

### Keep private work private by default

**As a player**, I want my thought strings and charged concepts to stay mine unless I deliberately distill and offer something, so I can use the dojo honestly.
**Acceptance:** no raw Thought String, charge history, 3-2-1 text, or daemon is copied to a Between or another player’s BAR automatically.

### Tend relationship material with consent

**As a player in a Between**, I want to offer a distilled BAR or practice invitation to the shared garden, so a relationship can be tended without making my private inner work communal property.
**Acceptance:** an offer is sealed until the other member accepts; acceptance creates a new shared item or shared BAR reference, not access to the source constellation.

### Let elemental spirits participate without becoming interpreters

**As a player**, I want a spirit with elemental affinity to accompany a BAR/dojo/Between loop, consume metabolized elemental energy, and grow through levels toward ally state, so regular practice visibly expands what I can craft in the game.
**Acceptance:** a player may invite a compatible spirit as a witness/companion from the Nook or Between, see why its element resonates with the BAR’s player-chosen EA reading, and feed it player-created elemental embers from completed practice. Spirit growth unlocks increasingly impactful, clearly named BAR, Nook, and Between upgrades. Spirits never infer emotional content or publish private data.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Center of gravity | BAR is the agency object: the thing being made, revised, offered, or acted on. | Wendell, 2026-10-27 |
| Entry requirement | A BAR is never required for first dojo practice. The player may begin from a live feeling/friction/desire and plant a BAR only when it becomes useful. | Wendell, 2026-10-27 |
| Emotional Alchemy role | EA reads the felt energy aligned with a BAR; it does not diagnose the BAR or automatically write Thought Strings. | Wendell + existing EA doctrine |
| Thought String role | A private constellation is the conceptual **pattern grammar** attached to a BAR: charged and positive word-triangles, strings, branches, edits, and provenance. It is the bridge between EA element, daemon-family recognition, and crafting ingredients. | Wendell, 2026-10-27 |
| Nook role | Private home and threshold: enter BAR work, EA, private dojo, or choose a shared room after orientation. | Existing Nook portal contract |
| Between role | Consentful relationship garden for distilled offers, mutual agreements, and shared artifacts; it is not a private-work dashboard. | Existing Between privacy model |
| Spirits | Elemental progression vessels and companions. Their affinity gives an EA reading an embodied resonance; player-issued embers feed levels, ally-state growth, and crafting capacity for BAR/Nook/Between upgrades. No interpretation, ownership transfer, or automatic harvest of difficult experience. | Wendell, 2026-10-27 |
| Daemons | Daemon families are the behavioral/editorial lineages of spirits. A charge may reveal a daemon through 3-2-1 or an accumulated-energy evolution choice point; animal form makes that lineage collectible and embodied. | Wendell, 2026-10-27 |
| Affinity | BARs may be suggested as compatible only through player-approved distilled ingredients. They are never merged automatically. | Wendell, 2026-10-27 |

## Contracts

### Core loop

`BAR → EA reading → private Thought String pattern map → dojo practice → BAR evolution → optional distilled offer → Between`

Each arrow is optional and reversible. A player may leave a BAR without EA, use EA without a Thought String, or work a Thought String without offering anything to anyone.

### New-player loop

`Nook → Learn | Something alive now | Make something → private Thought String practice → discard | settle seed | plant BAR → hold ember | feed spirit`

| Nook choice | Starting material | Persistent result by default |
|---|---|---|
| **Learn Thought Strings** | Authored tutorial constellation | None; tutorial state only |
| **Something alive now** | A feeling, friction, question, or a few player-chosen words | Private unlinked practice seed |
| **Make something** | A small hope, invitation, project, or desired change | Incipient BAR draft; player decides whether to plant it |
| **Work a BAR** | Existing BAR | Existing BAR provenance and private linked constellation |

- A **practice seed** is private, revisitable material that has not yet become a BAR. It may be discarded without a failure state.
- **Plant a BAR** is an explicit player action available after any live practice. It asks what the player is making, tending, or changing and carries only player-selected distilled outcomes forward.
- A player without a spirit may hold an ember in a private satchel. Spirit creation/calling is an invitation after sufficient voluntarily selected material, never a prerequisite for practice or a forced reward.

### Minimal provenance records

```ts
type BarPracticeLink = {
  barId: string
  emotionalReading?: {
    element?: 'metal' | 'water' | 'wood' | 'fire' | 'earth'
    fromState?: string
    towardState?: string
    chosenBy: 'player'
  }
  constellationIds: string[] // private, owned by the BAR owner
  practiceOutcomes: Array<{
    kind: 'next_move' | 'rewording' | 'support' | 'positive_continuation' | 'eighth_ray_move'
    summary: string
    createdAt: string
  }>
}

type DistilledOffer = {
  sourceBarId: string
  sourceConstellationId?: string // never resolvable by recipient
  kind: 'invitation' | 'agreement' | 'support_request' | 'shared_quest_seed' | 'care_ember'
  title: string
  summary: string
  ingredients?: { emotionalChannel?: string; positiveWords?: string[]; craftForm?: string }
  status: 'draft' | 'offered' | 'accepted' | 'declined' | 'withdrawn'
}

type SpiritPracticeBond = {
  barId: string
  spiritId: string
  element: 'metal' | 'water' | 'wood' | 'fire' | 'earth'
  role: 'witness' | 'companion' | 'recipient_of_care'
  createdBy: 'player'
  // No raw EA answers, word harvest, Thought String, or daemon material.
}

type ElementalEmber = {
  id: string
  sourceBarId: string
  sourcePracticeId: string
  element: 'metal' | 'water' | 'wood' | 'fire' | 'earth'
  intensity: 1 | 2 | 3
  ingredients: string[] // player-selected distilled ingredients only
  dedication?: string
  status: 'held' | 'fed_to_spirit' | 'offered_to_between' | 'crafted'
}

type DaemonSpiritLineage = {
  daemonFamily: string // family owns jobs and style
  animalForm?: string // randomized only after family confirmation
  element: 'metal' | 'water' | 'wood' | 'fire' | 'earth'
  emergence: '321_named' | 'player_named' | 'energy_threshold'
  state: 'latent' | 'daemon_alive' | 'spirit' | 'ally'
  sourceBarIds: string[]
}

type ThoughtStringCraftEvidence = {
  constellationId: string // private source remains private
  chargedPatterns: Array<'triangle' | 'continuation' | 'branch' | 'recurrence'>
  positivePatterns: Array<'triangle' | 'continuation' | 'branch' | 'bridge'>
  selectedWords: string[] // only player-selected words may leave the private map
  edits: Array<'charge_shift' | 'rewording' | 'positive_extension' | 'eighth_ray_move'>
}
```

### Visibility rules

| Material | BAR owner | Spirit companion | Between partner | System affinity |
|---|---|---|---|---|
| Raw word harvest / Thought String / charge history | full | none | never | never |
| EA raw reflection / 3-2-1 text | full under existing privacy rules | none | never | never |
| BAR EA tag/triad | full | optional symbolic display only | only if included in an accepted offer | only as an opted-in aggregate ingredient |
| Distilled offer | full | may accompany | sees only offered fields after acceptance | eligible only if player marks it discoverable |
| Daemon | full under current lineage | no special access | current explicit Between rules only | excluded in M1 |

### Elemental companion grammar

- A BAR’s Emotional Alchemy reading can name one or more player-selected elements. This is an invitation to resonance, not an automated matching score.
- In the Nook, a player can call an owned spirit of a matching element to accompany a BAR into private dojo practice.
- In a Between, a visiting spirit remains owned by its player under existing Between rules. A partner sees its presence and any explicitly offered care token, never its owner’s source charge or private constellation.
- A completed practice may yield an **ember** with an element, intensity, player-selected distilled ingredients, and optional dedication. The player may keep it, feed an owned spirit, include it in a sealed Between offer, or later use it in a crafting recipe.
- Feeding a matching-element spirit supplies elemental growth. Levels unlock named capacities; reaching **ally state** unlocks stronger crafting recipes rather than merely cosmetic progression.
- Crafting consumes only player-selected embers and explicit materials. Its outputs may improve a BAR’s practice capacity, open/evolve a Nook feature, or create an offered upgrade for a Between. Recipes show inputs and outcome before commitment.
- A later spirit-seed flow may allow a player to create a spirit from accumulated, voluntarily selected elemental practice material. It must show the exact inputs and allow editing/declining; it is never an automatic conversion of difficult feeling into a creature.

### Daemon-family and animal grammar

- A **daemon family** names the recurring strategy/function becoming visible in the charge. It supplies the spirit's jobs, interaction style, visual language, and later ally crafting specialties.
- An **animal form** is the collectible embodiment of a daemon-family spirit. It is a randomized draw only after the player confirms the family; randomness never decides what is psychologically true for a player.
- The elemental reading, daemon family, and animal form are separate axes: **element = fuel/channel; family = job/style; animal = body/collectible expression**.
- A Thought String provides the **visible pattern evidence** for a daemon-family choice: which charged triangles recur, which roles/words connect, where the player extends toward positive charge, and what edits they repeatedly choose. It can suggest a family, but only the player names/confirms one.
- While completing 3-2-1, a player may name/select the daemon family the charge represents. The existing 3-2-1 → daemon lineage and the BAR-linked Thought String become complementary evidence for spirit emergence rather than separate dead-end systems.
- After enough voluntarily fed, provenance-bearing emotional energy accumulates, present an **evolution choice point**: defer, name/select the living daemon family, or review the evidence. Only after confirmation may the game draw an eligible animal and create the individual daemon-spirit.
- A daemon-spirit begins in `daemon_alive` state. Repeated practice and matching elemental nourishment can transform it into `spirit`, then `ally`; this is relationship and capability growth, not deletion of the pattern. The source Thought String stays revisitable and is never consumed.

### Thought Strings as crafting grammar

- The private constellation is the authoritative map of a BAR's conceptual material. It is not replaced by EA, 3-2-1, a daemon, or a spirit.
- **Charged regions** show where the BAR's energy is currently caught or activated. **Positive regions** show player-authored continuations, supports, values, and possible creation paths.
- A practice can yield a player-selected **bridge**: a visible relationship from a charged triangle/region to a positive triangle/region. A bridge is a first-class craft ingredient, not a claim that the old pattern disappeared.
- Crafting recipes may require pattern ingredients—such as a positive continuation, a bridge, a repeated shared word, or a deliberately settled string—plus elemental embers and spirit capability. They may never silently read/consume a raw constellation.
- Daemon-family jobs determine how an ally helps edit a string; the player remains the author. For example, a family may offer a boundary-oriented, repair-oriented, or discernment-oriented edit, but it does not rewrite the map.

## Phased plan

### Phase 0 — Establish the shared language (no migration)

- Treat the current `CustomBar` EA triad fields, `/shadow/321?chargeBarId=`, Nook’s private dojo door, and Between private/shared records as the existing substrate.
- Add player-facing language that separates **felt emotional energy**, **private conceptual Thought Strings**, and **shared distilled offers**.
- Falsification: if a new player cannot state what stays private after one BAR → dojo → return loop, do not advance.
- Falsification: if a player who has no BAR and no spirit cannot begin and leave one small private practice without being forced to name a project, stop and redesign the entry.

### Phase 1 — Private BAR → EA → spirit → dojo loop

- Build the Nook entry chooser: Learn Thought Strings, Something alive now, Make something, and Work a BAR when a player has BARs.
- Add a BAR detail action: “Read the energy” opens the existing EA path with `chargeBarId` and an explicit return route.
- Add “Work the pattern” opens/creates a private constellation scoped to that BAR.
- Return a selected practice outcome to the BAR: one next move, support, rewording, or positive continuation. No raw transcripts copied.
- The Nook is the visual threshold for the dojo; BAR deep links may enter the same private room directly and preserve the return path.
- Let the player call an owned elemental spirit as witness/companion from the Nook. The UI explains the resonance using the player’s chosen EA element and creates a private `SpiritPracticeBond`.
- Complete a practice into an optional elemental ember that the player can keep or feed to their spirit. Matching embers grow the spirit toward ally state, which unlocks the first small crafting recipes.
- Preserve the existing 3-2-1 daemon choice as a player-authored daemon-family signal, and show it on linked BAR provenance without copying raw 3-2-1 answers.
- Return the player-selected Thought String outcome—not the entire string—to BAR provenance: charged/positive pattern type, optional bridge, chosen words, and edit made.
- Add explicit end states for unlinked practice: discard, settle as private seed, or plant a BAR. No choice is framed as completion or failure.

### Phase 2 — Provenance and crafting ingredients

- Persist private constellation ↔ BAR links, word charge, triangle topology, charged/positive regions, bridges, and reversible practice history.
- Let the player mark an outcome as a reusable **craft ingredient**: positive words, EA channel, craft form, and one portable move.
- Surface compatible ingredients across the player’s own BARs first. Suggestions are explainable and require explicit attachment.
- Add the daemon-spirit evolution choice point: player reviews accumulated BAR/EA/practice evidence, confirms/defer daemon family, then receives a randomized eligible animal form.
- Define each daemon family's editing jobs, visual style, and ally-state Thought String crafting specialties before adding its animal pool.

### Phase 3 — Distillation into the Between

- From a BAR, create a sealed offer to a selected Between: invitation, agreement, support request, shared quest seed, or care ember.
- The receiving member accepts, declines, or leaves it pending. An accepted offer becomes a fresh shared object with only the distilled content.
- A player may invite a spirit to accompany an accepted offer or include a care ember; this is atmosphere and care, not interpretation.

### Phase 4 — Optional cross-player crafting

- Only after Phases 1–3 demonstrate clear consent can players publish a forkable, anonymous pattern template.
- Compatibility uses the player-approved distilled ingredient set, never raw charge material, names, relationships, or daemon records.

## Reserved items

- **Consent:** any cross-player, Between, or discoverability behavior requires explicit player action and clear preview of the exact fields shared.
- **Privacy:** raw EA answers, raw Thought Strings, charge histories, and daemon material remain private by default.
- **Spirits:** define the first spirit level curve, ally-state threshold, and first unlocked recipes before implementation. No effect may imply spiritual diagnosis or automatic extraction of difficult experience.
- **Money / paywall:** none.

## How we will know it failed

- **The cheap test, run before building:** storyboard one BAR through every handoff and list exactly what is visible to its owner, spirit, partner, and an affinity suggestion. The test passes only if every external field comes from a deliberate Distilled Offer.
- **The result that stops the work:** if the loop requires someone to expose private reflection in order to make a BAR useful or to participate in a Between, stop and redesign the handoff.

## Definition of done

- [ ] A player can start EA from a BAR and return to the same BAR.
- [ ] A player with no BAR or spirit can enter from the Nook, begin a private practice seed, and leave it discarded, settled, or planted as a BAR.
- [ ] A player can start a private BAR-scoped constellation from a BAR and return one explicit practice outcome.
- [ ] A player can deliberately distill a charged-to-positive Thought String bridge into a BAR ingredient without exposing the raw constellation.
- [ ] BAR provenance shows the player-selected EA reading and outcomes without raw reflection text.
- [ ] A player can call a same-element owned spirit from the Nook to accompany BAR practice, then keep or feed a player-authored elemental ember.
- [ ] A player without a spirit can hold a player-authored ember without blocked progression or pressure to create a companion.
- [ ] Feeding embers grows a spirit toward ally state and unlocks previewable, player-chosen crafting recipes for BARs, Nook, and the Between.
- [ ] A player may identify a daemon family during 3-2-1 or at an accumulated-energy evolution choice point, review what data informed it, defer it, and only then draw an eligible animal form.
- [ ] A player can create, preview, withdraw, accept, or decline a sealed distilled offer in a Between.
- [ ] Phone preview demonstrates BAR → EA/dojo → BAR and one optional BAR → Between offer path.
- [ ] Wendell confirms the distinction between private work, distillation, and shared tending feels true.
