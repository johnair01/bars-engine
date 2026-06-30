# Pixi World To Inner Garden Bridge Decision

> Companion artifacts:
> - [INNER_GARDEN_IMPLEMENTATION_RESEARCH.md](./INNER_GARDEN_IMPLEMENTATION_RESEARCH.md) identifies the Library Inner Garden prototype as the richer source design.
> - [GUIDE_CAMPAIGN_MATRIX.md](./GUIDE_CAMPAIGN_MATRIX.md) defines the six Guide campaigns as game types.
> - [BARS_CALRUNIA_WORLD_MECHANICS.md](./BARS_CALRUNIA_WORLD_MECHANICS.md) explains BARs as the membrane object between outer-world behavior and inner-world play.
>
> This document reframes the current bars-engine Pixi world as a draft/proving ground, not the canonical Calrunia game layer.

## Decision Frame

The Pixi world work should be treated as a **draft integration experiment**:

> How might campaigns, BARs, Guide NPCs, and 2D movement become playable in a sprite world?

The Library Inner Garden prototype should be treated as the **source game design**:

> How does real emotional and allyship material become seeds, cards, cultivation, manuals, advocates, and Calrunian progression?

The product move is therefore not "throw away Pixi" and not "paste Inner Garden into bars-engine."

The move is:

> Deprecate Pixi as the canonical world model, preserve the useful campaign integration lessons, and bridge/migrate toward Inner Garden as the canonical Calrunian play layer.

## What The Pixi Draft Proved

The Pixi work is still valuable because it proved several important integration ideas:

| Pixi Draft Idea | Keep? | Why |
|-----------------|-------|-----|
| Campaign world entry route | Yes | Players need a threshold from app utility into play |
| Campaign hub / spokes | Maybe | Useful metaphor for campaign structure, but may not be the final world map |
| Guide NPC anchors | Yes | The six faces as game-mode hosts still matter |
| Nursery rooms | Maybe | Wake/Clean/Grow/Show rooms map well to Inner Garden pillars, but may become farm/ritual areas |
| Carrying a BAR | Yes | Strong membrane mechanic; should survive |
| Planting a BAR on a spoke | Yes, revised | Planting should become seed/farm/campaign evidence, not only spoke bed state |
| Collaboration Board | Yes, revised | Useful campaign feedback surface, but it should explain what grew and what changed |
| Pixi room engine as canonical world | No / deprecate | Inner Garden has the richer game loop and should become the canonical play layer |

## What Inner Garden Supersedes

The Library Inner Garden prototype supersedes the Pixi draft in these domains:

| Domain | Pixi Draft | Inner Garden Source |
|--------|------------|--------------------|
| Player identity | avatar in room | cultivator with stats, Qi, cards, manuals, garden |
| BAR transformation | carry/plant BAR | BAR -> seed/card -> cultivation artifact |
| Emotional play | modal ritual | seed quality, meditation, nurture, harvest |
| Progression | planted spoke beds | cultivation levels, card unlocks, manuals, garden growth |
| Sects/archetypes | Guide face NPCs | 5 nations x 8 trigram advocates / sect lineages |
| Game feel | spatial navigation + modals | farming/cultivation/card loop |
| Return to bars-engine | spoke bed receipt | bridge payload / charge capture / move evidence |

## Deprecation Principle

Do not remove Pixi code just because Inner Garden is stronger.

Deprecate by role:

1. **Freeze** Pixi as a prototype surface unless it is actively needed for a bridge.
2. **Extract** the useful patterns: BAR carrying, Guide selection, campaign entry, planted evidence.
3. **Rename** internal docs so Pixi is not described as "the inner garden."
4. **Bridge** bars-engine to the Library Inner Garden loop.
5. **Replace** Pixi world entry with Inner Garden entry once the bridge proves value.
6. **Remove or archive** Pixi routes only after no Guide/campaign flow depends on them.

## Six Game Master Analysis

### Shaman

The Shaman sees the core risk:

> If we keep both systems alive without naming their roles, players and builders will split the soul of the game.

Shaman recommendation:

- Treat Pixi as an old ritual vessel.
- Preserve what it taught: crossing threshold, carrying charge, planting evidence.
- Move the emotional transformation center of gravity into Inner Garden's seed, meditation, nurture, and harvest loop.

What to remove:

- Any Pixi language that says "this is the inner garden" if it is only a spatial lobby.

What to preserve:

- The feeling of crossing into a charged inner place.

### Challenger

The Challenger sees the action problem:

> This project needs a decisive cut. Pixi cannot remain half-canonical forever.

Challenger recommendation:

- Mark Pixi world as deprecated/prototype in docs.
- Stop adding major new Guide campaign features directly to Pixi unless they are bridge work.
- Build one concrete BAR -> Inner Garden -> bars-engine return loop.

What to remove:

- New feature investment in Pixi-only campaign rooms.

What to preserve:

- The working mechanics that prove BAR carrying and planting can create game-state changes.

### Regent

The Regent sees governance and migration risk:

> Deprecation without stewardship creates orphaned routes, broken expectations, and unclear ownership.

Regent recommendation:

- Define ownership boundaries:
  - bars-engine owns auth, BARs, campaigns, persistence, unlocks.
  - Inner Garden owns play loop, cultivation, seeds, cards, manuals.
  - bridge owns translation contracts.
- Create a retirement checklist before deleting routes.

What to remove:

- Ambiguous ownership of player progress between localStorage and database.

What to preserve:

- Campaign membership, roles, and contribution accountability in bars-engine.

### Architect

The Architect sees the systems shape:

> Pixi and Inner Garden are not competing engines. They are currently two layers without an interface.

Architect recommendation:

- Build the bridge as a contract first:

```text
bars-engine CustomBar
-> Inner Garden seed/card import
-> Inner Garden play result
-> bars-engine CustomBar / move evidence / campaign contribution
```

- Do not start with visual migration. Start with data translation and one playable path.

What to remove:

- Duplicate concepts with no contract: garden, seed, card, planting, progress.

What to preserve:

- Any Pixi schema or code that already models spatial anchors, planted state, or campaign receipts.

### Diplomat

The Diplomat sees the stakeholder and player communication issue:

> If we call this a deprecation, people may hear "lost work." We need to frame it as succession.

Diplomat recommendation:

- Name Pixi as the draft that taught us how campaign play could become spatial.
- Name Inner Garden as the richer game that now inherits the mission.
- Communicate the bridge as "bringing the campaign work into the better play loop."

What to remove:

- Competing player-facing entry points that make users wonder which world is real.

What to preserve:

- Any Pixi-facing demos/screenshots that help explain the campaign vision, clearly labeled as prototype.

### Sage

The Sage sees the pattern:

> The Pixi draft solved the portal problem. Inner Garden solves the game problem. The bridge must solve the return problem.

Sage recommendation:

- Use the I Ching/oracle layer to decide when a BAR should become a seed, card, manual lesson, Guide prompt, or campaign contribution.
- Treat Inner Garden as the inner-world processor.
- Treat bars-engine as the outer-world accountability and meaning system.

What to remove:

- Lore-only or map-only features that do not transform player behavior.

What to preserve:

- The core triadic movement:

```text
outer-world material
-> inner-world cultivation
-> outer-world move/evidence
```

## Bridge Model

The bridge should be explicit and boring before it becomes magical.

### Import

```text
bars-engine CustomBar / charge_capture
-> bridge payload
-> Inner Garden seed or witness card
```

Minimum fields:

- source BAR id
- player id or anonymous session id
- title / summary
- behavior
- activation
- result
- emotion channel
- intensity
- campaignRef
- Guide face, if selected
- hexagram/trigram context, if present

### Inner Garden Play

```text
seed/card
-> plant / nurture / meditate / harvest / spend
-> cultivation result
```

Possible outputs:

- harvested insight
- witness card
- spent card
- cultivation XP
- manual progress
- Guide completion evidence
- campaign contribution candidate

### Return

```text
Inner Garden result
-> bars-engine import
-> CustomBar / move evidence / campaign progress / unlock
```

The return is essential. Without it, Inner Garden becomes a side game. With it, Inner Garden becomes the inner-world processor for allyship practice.

## Interview: What We Need To Decide

### 1. Canonical Experience

When you imagine a player "entering Calrunia" six months from now, what do they see first?

- Inner Garden farm/cultivation screen
- campaign hub/spoke map
- Guide selection surface
- I Ching/oracle prompt
- something else

### 2. Pixi Fate

Which of these is closest to your intent?

- Pixi is fully retired once Inner Garden is integrated.
- Pixi remains as a map shell around Inner Garden mechanics.
- Pixi remains only for campaign hub/prototype demos.
- Pixi code is archived but its concepts are ported.

### 3. First Bridge Slice

Which first loop would be most valuable to put in front of people?

- Shaman: charged BAR -> seed -> meditation/nurture -> harvested insight
- Challenger: pressure BAR -> decisive action card -> outer-world evidence
- Sage: BAR + I Ching -> recommended Guide/sect/manual
- Architect: campaign need -> growable build plot -> contribution evidence

### 4. Player Identity

Inside Calrunia, is the player primarily:

- a cultivator
- a campaign ally
- a Guide apprentice
- a nation citizen
- a sect initiate
- all of these, in a progression order

### 5. Campaign Relationship

Are campaigns supposed to be:

- the reason the player enters Inner Garden
- one content type inside Inner Garden
- outer-world containers that Inner Garden helps metabolize
- the main multiplayer/social layer around individual cultivation

### 6. Deletion Boundaries

What can we safely remove or freeze now?

- Pixi route development
- nursery room expansion
- spoke bed UI work
- face NPC trial work
- campaign hub world map work
- none yet, only relabel

### 7. Demo Goal

For the people you want to put this in front of, what problem should the demo solve?

- "I have emotional charge and need to transform it."
- "I am stuck and need a concrete allyship move."
- "I need to understand my role in a campaign."
- "I need a playful way to keep practicing."
- "I need to see that this is more than lore."

## Proposed Near-Term Decision

Interview update:

1. There are **two games** in the product hierarchy:
   - a card-based campaign management game that deposits players into a village/lobby of available campaigns
   - Inner Garden as the immersive story/cultivation game that teaches Mastering Allyship mechanics
2. Campaigns appear in Inner Garden later. Players first learn cultivation, emotional practice, cards, and allyship mechanics.
3. Pixi should be fully retired after its useful concepts are ported.
4. The first bridge loop should be Shaman, because Inner Garden already has an MVP version of this loop.
5. The Shaman loop must speak to the player's bars-engine Hand and Vault.
6. Campaigns are one reason to enter Inner Garden, not the only reason.
7. The routes may remain, but the Pixi runtime does not need to remain.
8. The artifact must solve a practical user problem: provide a quick, fun, immersive way to teach increasingly complex Mastering Allyship concepts and practices.

Updated decision:

1. Mark Pixi world as **prototype / draft spatial campaign layer**.
2. Stop expanding Pixi runtime.
3. Keep routes where they still function as product thresholds, but replace their runtime target over time.
4. Preserve BAR carrying, Guide selection, planting, campaign lobby, campaign-state receipt, and village/lobby concepts.
5. Define a bridge contract from bars-engine Hand/Vault BARs to Inner Garden seeds/cards.
6. Build the Shaman bridge slice first: Hand/Vault BAR -> Inner Garden seed/card -> Shaman cultivation loop -> returned insight/evidence BAR.

## Two-Game Hierarchy

The emerging product hierarchy is:

```text
bars-engine outer utility
-> card-based campaign management game
-> village / campaign lobby
-> Inner Garden immersive cultivation game
-> later campaign re-entry as advanced play
```

### Game 1: Card-Based Campaign Management

This game is closer to a campaign operations layer.

Its job:

- show available campaigns
- organize players, offers, needs, roles, and moves
- manage cards/BARs as campaign objects
- provide the village/lobby threshold
- connect outer-world action to game-state accountability

This is where campaigns are legible early.

### Game 2: Inner Garden

This game is the immersive curriculum layer.

Its job:

- teach Mastering Allyship through play
- turn BARs into seeds/cards/cultivation artifacts
- make emotional alchemy embodied and fun
- introduce nations, sects, advocates, manuals, and practices over time
- make increasingly complex concepts learnable without lore homework

This is where campaigns emerge later, after the player has learned the inner cultivation game.

### Hierarchy Rule

Campaign management can send material into Inner Garden, but Inner Garden should not assume the player already understands campaigns.

```text
campaign mode may be an entry point
but cultivation is the onboarding spine
```

## Routes Without Pixi Runtime

The current route work may still be valuable even if the Pixi runtime is retired.

Keep:

- route names that define player thresholds
- campaign/world entry URLs if they already have product meaning
- server-side campaign context loading
- auth, membership, and campaignRef resolution
- return paths from game mode back to bars-engine

Retire:

- Pixi room rendering as the canonical experience
- Pixi-specific room expansion
- new Pixi-only nursery features
- Pixi-only campaign hub map work

Port concepts:

- Guide selection
- carrying from Hand/Vault
- planting as campaign/cultivation evidence
- village/lobby as campaign threshold
- spoke/hub as possible campaign organization metaphor

## Six Faces On The Updated Hierarchy

### Shaman

Shaman says:

> Inner Garden should be the first true descent. The player should feel a BAR become living material.

Implication:

- The first playable bridge should use existing Shaman/Inner Garden MVP mechanics.
- Hand/Vault must feed the ritual.
- Returned output should be a transformed BAR, not merely a local game reward.

### Challenger

Challenger says:

> Retire the runtime. Do not keep feeding a draft.

Implication:

- Freeze Pixi runtime development now.
- Make a clear cut: routes can stay, Pixi rendering should not receive new campaign feature investment.
- The next visible proof should be playable Inner Garden, not another map room.

### Regent

Regent says:

> Keep the routes until their responsibilities have heirs.

Implication:

- Routes should be evaluated by role, not deleted wholesale.
- If a route owns auth, campaign context, or return flow, keep it and change its target.
- If a route only exists to render Pixi rooms, mark it for retirement.

### Architect

Architect says:

> Define the interface before moving the building.

Implication:

- Build the bridge contract first:

```text
Hand/Vault BAR
-> Inner Garden import
-> Shaman seed/card loop
-> Inner Garden result
-> bars-engine BAR/move evidence
```

- After that, decide whether Inner Garden is embedded, linked, or ported module by module.

### Diplomat

Diplomat says:

> The player must not see two Calrunias.

Implication:

- The campaign game and Inner Garden need clear names and roles.
- "Village" can be the social/campaign threshold.
- "Inner Garden" can be the personal cultivation story.
- Campaigns entering Inner Garden later should feel like maturation, not mode confusion.

### Sage

Sage says:

> Campaigns are not the root. Practice is the root. Campaigns are one application of cultivated capacity.

Implication:

- Inner Garden should be able to stand alone as a fun game.
- Its hidden curriculum is Mastering Allyship.
- Campaign management should become more powerful after cultivation, not be required as the player's first context.

## Updated Removal Map

| Surface / Concept | Recommendation | Reason |
|-------------------|----------------|--------|
| Pixi runtime | Retire after concept porting | Superseded by Inner Garden as canonical play layer |
| Pixi routes | Keep temporarily | They may still own useful thresholds, campaign context, and return paths |
| `/world/...` route semantics | Reassess | May become village/campaign lobby or redirect to Inner Garden entry |
| Nursery expansion in Pixi | Freeze | Inner Garden already has stronger cultivation mechanics |
| Spoke beds | Preserve concept, revise implementation | Planting evidence still matters, but should connect to seeds/cards/cultivation |
| Face NPCs | Preserve concept | Six faces are still game-mode/curriculum guides |
| Campaign hub map | Port concept selectively | Campaign lobby/village may not need spatial Pixi |
| Hand/Vault | Preserve and prioritize | First Shaman loop depends on it |
| Inner Garden local-only save | Bridge then migrate | Useful prototype, but bars-engine needs player-linked continuity |

