# Allyship Move Translator x I Ching Gap Analysis

## Purpose

The current app already contains the move translator we need to build on. The primary surface is now:

- route: `/bars/move-generator`
- page: `src/app/bars/move-generator/page.tsx`
- UI: `src/components/bars/MoveGenerator.tsx`
- persistence: `src/actions/move-generator.ts`

There is also a newer deterministic translation layer for superpower-oriented allyship work:

- `src/lib/superpowers/translate.ts`
- `src/lib/superpowers/matrix.ts`
- `src/lib/superpowers/card-view.ts`
- `src/components/superpowers/AllyshipCard.tsx`

The opportunity is to operationalize the divinatory power of the I Ching inside this existing move translator, so a player can bring an outer-world allyship tension into the game, receive a sect-shaped reading of the moment, and leave with one concrete move back in the outer world.

The goal is not to create more lore pages. The goal is to help someone answer: "What is the next skillful allyship move I can make here?"

## Current Translator Surface

### `/bars/move-generator`

The Move Generator turns a player's held BARs into concrete moves.

Current loop:

```text
BAR in hand
-> player names charge intensity
-> player identifies block / emotional layers
-> system recommends move candidates
-> player fills in concrete steps
-> move is marked ready
```

The key product moment is the "Moves that fit" section in `MoveGenerator.tsx`. It already offers multiple candidate sources:

- **Alchemy**: metabolize the charge into a desired state
- **Face**: use the BAR's GM-face/move type as a move source
- **Domain**: use the campaign's allyship domain as a move source

This is the cleanest insertion point for I Ching. The oracle should become another candidate source:

```text
Oracle / Sect: upper trigram + lower trigram -> disciplined move recommendation
```

### Superpower translation matrix

`src/lib/superpowers/translate.ts` already defines the logic we were looking for in strategic terms:

```text
Existing Allyship Card + Superpower + Orientation = Personalized Quest
```

This is not exactly the same page as `/bars/move-generator`, but it is the same product pattern: take a general allyship card/move and translate it through a personal/world-facing lens.

Current superpower translator:

- `internal` = self-allyship / inner move
- `external` = world-facing allyship / outer move
- superpower = lens prompt + suggested artifact
- deck card = base move and reading

This is highly relevant to the I Ching work because trigram archetypes can become another authored translation lens.

### Nursery ritual flow

The older/adjacent translator surface still matters:

- `src/actions/nursery-ritual.ts`
- `src/components/nursery/NurseryRitualFlow.tsx`
- `src/lib/nation/move-library-accessor.ts`

That path translates nation/archetype moves through `domain_translations`. It is useful precedent, but it is not the artifact we should center for putting this in front of people.

## Current Gaps

| Area | Existing | Gap |
|------|----------|-----|
| Player-facing translator | `/bars/move-generator` turns BARs into move-ready steps | I Ching/sect logic is not a recommendation source |
| Candidate-source pattern | Move Generator already has alchemy, face, and domain candidates | No oracle candidate and no upper/lower trigram provenance |
| Superpower translation | `translateCardForSuperpower()` translates cards by superpower + orientation | Trigram archetypes/sects are not yet a translation lens |
| Inner/outer allyship | `inner-outer-allyship-moves` and superpower orientation encode self/world direction | I Ching readings do not yet decide whether the move is inner, outer, or bridging both |
| Sect lore | Sect names and practitioner archetypes are documented | Runtime code has no sect registry |
| Divination | I Ching casting and trigram structure exist elsewhere | Casts are not connected to move recommendation |
| Outer-world return | Move Generator marks moves ready from BARs | No "try this oracle-shaped move and report what happened" return loop |

## Correct Strategic Frame

The move translator is the practical bridge between Calrunia and the outer world.

```text
Outer world:
  "Here is the allyship tension or BAR I am carrying."

Translator:
  "Here are the move candidates that fit:
   alchemy, face, domain, and oracle."

Calrunian / I Ching layer:
  "The oracle names the visible force and hidden force.
   The sects translate those forces into a disciplined move."

Outer world:
  "Here is the action I will try.
   Here is what happened when I returned."
```

This preserves the movement we want:

```text
problem outside the game
-> lore-mediated diagnosis inside the game
-> disciplined action outside the game
-> returned evidence inside the game
```

## I Ching as Translator Logic

The I Ching should not be decoration. It should add a real recommendation path.

### Upper trigram

The upper trigram names the visible force:

- what is presenting
- what others can see
- what the moment appears to require

### Lower trigram

The lower trigram names the hidden or grounding force:

- what is motivating the situation underneath
- what must be protected
- what distortion may be driving the visible pattern

### Sect tension

The pair creates a sect tension:

```text
upper sect = visible move discipline
lower sect = hidden stabilizing discipline
```

Example:

```text
Outer-world tension:
"Our group is split on whether to publicly name harm or handle it privately."

Cast:
Fire over Mountain

Sect read:
Clear Flame is visible: truth wants to be named.
Still Gate is underneath: containment and boundary are protecting the group.

Move candidate:
Name one true thing inside a bounded container.

Outer-world sentence:
"I think something true needs to be named here, and I want us to do it in a way the group can actually hold."
```

## Sect-to-Move Discipline Bridge

| Sect | Trigram | Practitioner Archetype | Move Discipline | Outer-World Action Shape |
|------|---------|------------------------|-----------------|--------------------------|
| First Motion | Heaven | Bold Heart | Initiate | Make the next honest first move |
| Holding Field | Earth | Devoted Guardian | Stabilize | Create support or container |
| Clear Flame | Fire | Truth Seer | Reveal | Name what is true |
| Deep Current | Water | Danger Walker | Enter depth | Go into the difficult complexity |
| Breakpoint | Thunder | Decisive Storm | Interrupt | Break or stop the harmful pattern |
| Quiet Pressure | Wind | Subtle Influence | Influence | Apply sustained directional pressure |
| Still Gate | Mountain | Still Point | Bound | Refuse, pause, or set a boundary |
| Open Mirror | Lake | Joyful Connector | Invite | Open exchange or shared experience |

## Implementation Shape

### 1. Add a sect registry

Create a small runtime registry, probably near the I Ching/trigram code:

```text
trigram key
sect name
practitioner archetype
move discipline
caution / distortion
outer-world action shape
```

This keeps lore operational without embedding a pile of prose inside the UI.

### 2. Add an oracle move resolver

Create a resolver that accepts:

- hexagram / upper trigram / lower trigram
- optional allyship domain
- optional move aspect: inner / outer
- optional player superpower or archetype

And returns:

- title
- WAVE move key
- source label
- provenance
- one concrete action shape
- one suggested sentence

### 3. Insert oracle into `MoveGenerator` candidates

Current candidate list:

```text
Alchemy · Clean Up
Face move
Domain move
```

Target candidate list:

```text
Alchemy · Clean Up
Face move
Domain move
Oracle / Sect move
```

This keeps the user experience familiar. The oracle is not a new homework assignment; it is another answer to "what move fits?"

### 4. Bridge superpower translation later

Once the sect registry exists, the superpower translator can accept a trigram/sect modifier:

```text
Existing Allyship Card
+ Superpower
+ Orientation
+ Sect tension
= Personalized Quest / Move
```

This is the larger "divinatory allyship" layer.

## Deft Next Slice

Build the smallest thing that makes the I Ching useful inside the current product.

### Slice A: oracle candidate in Move Generator

Add a deterministic oracle candidate to `/bars/move-generator`:

- hardcode or pass a sample trigram pair at first
- show source as `Oracle · Clear Flame over Still Gate`
- produce one move candidate title
- include provenance in "How did we choose this card?"

Why this first:

- it uses the real page people can touch
- no new landing page
- no new lore reading burden
- it proves whether sect language improves move choice

### Slice B: sect registry

Move the hardcoded sample into a reusable registry/resolver.

Why this second:

- gives handbook/lore and UI one shared source
- lets I Ching casts route cleanly into move recommendations

### Slice C: real cast integration

Connect the resolver to a real I Ching cast or stored reading.

Why this third:

- the divination becomes active only after the move candidate UX has proven useful
- avoids building a big oracle flow before we know the output lands

## Six GM Read

### Shaman

The artifact should help a player feel the charge in a real-world tension without drowning in it. The I Ching gives symbolic distance: the problem becomes a pattern the player can work with.

### Challenger

The output must force an action. If the player leaves with insight but no move, the translator failed.

### Regent

Keep the ritual bounded: one tension, one reading, one move, one return.

### Architect

Use the existing Move Generator candidate pattern. Add an oracle candidate source instead of making a new page.

### Diplomat

Sect language lets people name tensions without blaming each other.

### Sage

Divination is not the product; changed action is the product.

## Success Criteria

- `/bars/move-generator` can show an oracle/sect move candidate.
- The candidate visibly uses upper/lower trigram logic as recommendation logic, not flavor text.
- The player receives one concrete action and one usable sentence.
- The result can be saved or marked ready through the existing move flow.
- Someone outside the lore process can use it and feel helped, not assigned reading.
