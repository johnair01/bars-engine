# Spec: The shared charge engine

<!-- bars-engine's spec template with the council's three sections (The ask, Whose decision, How we will know it
     failed). Callsheet: six-faces-council council/callsheets/charge-engine.md. Prefix ce-. -->

game: yes
intake: council/callsheets/charge-engine.md
assets: none - the engine draws nothing; slice 1 reuses the hollow, its cards and the block walk as built

## The ask

> Wendell answered A on `cut50-charge-engine` (Council Board, 2026-11-09): one shared charge-engine module, starting
> with the hollow's WAVE.

**Who it is for:** a player sitting at the hearth in the hollow with something charged in them, and later the same
player in the cave and the first game.
**What they feel now, and what should change:** today the hollow's WAVE is seven Next taps that save a feeling and a
line. The player clicks through a charge instead of breathing it. The first game's WAVE made the body steer: each
step was a breath, any step could be blocked and returned to, and the exhale was a real choice. The player should get
that back in the 3D places, from one engine every place shares.

## Purpose

One plain JavaScript module holds the charge: what the player reads in the body, where they are in the WAVE, which
blocks they opened and how the charge moved. The hollow uses it first. The cave and the first game take the same module
later, so a charge reads and moves the same way in every place.

## Conceptual model

- **WHO:** the player, seated at the hearth (avatar in the hollow, `/ontology-game/between`).
- **WHAT:** a `Charge`: the founder intake's reading (channel, intensity, direction, body, goal), the WAVE's progress,
  a stack of blocks, and a route log of moves.
- **WHERE:** `public/calrunia/charge-engine.js`, a plain ES module beside `spirit-care.js`, which set the precedent
  ("plain module, no three.js, so the caves and Big Mind can take it").

The engine owns no screen. A place draws the cards and calls the engine; the engine returns the next `Charge` and what
the place should show.

## Contracts

### The reading (matches the founder intake)

The charge goals founder intake (council `charge-goals-sect.md` at 435cc4b; intake page
https://claude.ai/artifact/KkCQKXKotgpvddqzQWxuVE) asks five things. The engine stores them with the intake's names.

```js
reading = {
  channel:   "joy" | "anger" | "sadness" | "fear" | "neutral",
  intensity: 0..10,                                 // integer
  direction: "toward" | "away" | "both" | "cant_tell",
  body:      string,                                // the player's own words, never rewritten
  goal:      string | null                          // a goal id from the player's charge goals, or null
}
```

The intake says `neutral`; the move table and the first game say `neutrality` / "Neutrality". The engine stores
`neutral` in the reading and maps it to the table's `neutrality` only when it looks up a cycle (`tableChannel()`).
`channelOf(anyName)` accepts all three spellings and the element names the hollow uses (`FEELS` in `garden.js`:
wood=joy, fire=anger, earth=neutral, metal=fear, water=sadness).

### The charge

```js
Charge = {
  v: 1,
  id, startedAt,
  reading,                                          // above
  element,                                          // derived from reading.channel: wood|fire|earth|metal|water
  state: "dissatisfied" | "neutral" | "satisfied",  // the move table's states; starts "dissatisfied"
  location: string | null, texture: string | null,  // the body scan after the exhale
  face: string | null, belief: string | null,       // slices 2 and 3; kept so the first game can move in
  wave: {
    step: "welcome"|"acknowledge"|"allow"|"accept"|"appreciate"|"validate"|"exhale"|"scan"|"done",
    stepAt: number,                                 // ms when this step's breath began
    rungReached: string | null,                     // the last of the four rungs the player passed
    stoppedAtRung: boolean,                         // from Allow on, stopping at a rung still completes the WAVE
    alignment: null | "stay" | "release"
  },
  steps:      [{ id, at, rung?: true, blocked?: true }],
  blockStack: [{ step, size: 1..10, words, at }],   // nests; the top frame is the block being walked
  route:      [{ kind: "block-open"|"block-return"|"move"|"appreciate"|"exhale", at, ... }]
}
```

Every function is pure: it takes a `Charge` and returns a new one. Time is passed in (`now`), never read inside, so the
engine runs the same in a test, the hollow, the cave and the first game's build.

### Functions

| Function | Does | Refuses |
|---|---|---|
| `startCharge(reading, now)` | New `Charge` at `welcome`, state `dissatisfied`. | a reading with an unknown channel or intensity outside 0-10 |
| `breathOf(charge, now)` | `{phase: "in"|"out"|"done", t}` for the ring on the card. | none |
| `nextStep(charge, now, {skipBreath})` | Moves to the next WAVE step and logs it. | before the out-breath ends, unless `skipBreath` |
| `stopAtRung(charge, now)` | Ends the WAVE at the rung reached (from Allow on) and goes to the exhale. | before Allow |
| `openBlock(charge, {size, words}, now)` | Pushes a frame for the current step and logs `block-open`. | none; blocks nest |
| `returnFromBlock(charge, outcome, now)` | Pops the top frame, puts the player back on that exact step with a fresh breath, logs `block-return` with `outcome`. | an empty stack |
| `exhale(charge, "stay"|"release", now)` | Sets `alignment`, goes to `scan`. | any step but `exhale` |
| `scan(charge, {location, texture}, now)` | Records the body scan, sets `done`. | any step but `scan` |
| `move(charge, "sheng"|"ke", now)` | Moves channel by the cycle and state by the routing table, logs `move`. | a WAVE that is not done |
| `emberOf(charge)` | `{feel, from, to, by}` for the hollow's ember. | none |
| `toRecord(charge)` | The plain object a place saves. | none |

Constants exported: `WAVE_STEPS` (moved here from `spirit-care.js`, which re-exports it), `BREATH = {inMs: 4000,
outMs: 6000}` (council placeholders, `oag-wave-breath`; the first game's and the cave's numbers), `SIZE_WORDS`
(pebble to wall, 1-10), `ROUTING` (the first game's `routingTable`).

`ROUTING`, unchanged from game.jsx:

```js
sheng: { dissatisfied: "neutral", neutral: "satisfied", satisfied: "satisfied" }
ke:    { dissatisfied: "dissatisfied", neutral: "dissatisfied", satisfied: "satisfied" }
```

The cycles come from `public/calrunia/move-table.json`, a fourth copy of the council's `schema/move-table.json`.
`src/lib/quest-grammar/__tests__/move-table.test.ts` gains one check that the public copy equals the `src` copy.

### The ember

`emberOf` returns `{feel, from, to, by}`. `from` is the element the charge started in, `to` is the element it ends in,
`by` is `"wave"` when no move was made or the move-table id (`wood_fire`, ...) of the last move. `feel` equals `to`, so
`feed()` in `spirit-care.js` keeps working; `feed()` changes to read `ember.to ?? ember.feel`.

### What the hollow saves

Today: `{feel, line, at, wave: 7}` and an ember `{feel}`. After slice 1: `{feel, line, at, wave: 7, charge:
toRecord(charge)}` and the ember from `emberOf`. Readers that know only `feel` keep working. Storage stays on the
device (localStorage), as today. Nothing goes to the server.

## User stories

### P1: Breathe the WAVE in the hollow

**As a** player at the hearth, I want each WAVE card to breathe with me, so the charge moves in my body and not under
my thumb.
**Acceptance:** each card shows a ring that fills for four seconds and empties for six; the card's button appears when
the out-breath ends; "Skip the breath" is always there.

### P2: Something's in the way

**As a** player stuck on a step, I want to say something is in the way, walk it, and come back to the same step.
**Acceptance:** every step has "Something's in the way". It asks the block's size (pebble to wall) and words, then
opens the block walk (`block-room.js`). Leaving the walk puts the player back on the step they left, with a new
breath. A block opened from inside a block returns to the inner step first.

### P3: The exhale is a choice

**As a** player at the exhale, I want to choose whether this stays or goes out on the breath.
**Acceptance:** two buttons, "Let it stay" and "Breathe it out". Each leads to the body scan with its own prompt (the
first game's words: "You let it stay. Where does it live in the body?" and "You exhaled it out. What's left behind,
where do you feel it now?").

### P4: The ember says where the charge went

**As a** player who finished a WAVE, I want my ember to carry where the charge started and where it ended, so the
spirit I feed gets what I actually moved.
**Acceptance:** the saved ember has `from`, `to` and `by`; a spirit of the `to` element is fed twice over.

## Functional requirements

### Phase 1: the hollow's WAVE (this slice)

- **FR-001** `public/calrunia/charge-engine.js` exists as a plain ES module with no DOM, three.js or React import, and
  exports the functions and constants above.
- **FR-002** The engine reads the reading with the founder intake's five fields and names, and maps `neutral`.
- **FR-003** `nextStep` refuses before the out-breath ends unless the breath is skipped.
- **FR-004** `openBlock` / `returnFromBlock` nest and return to the exact step, and log both moves on `route`.
- **FR-005** `exhale` is a fork of `stay` and `release`; both lead to `scan`.
- **FR-006** `stopAtRung` works from Allow on and still completes the WAVE.
- **FR-007** `move` follows the move table's cycles and the first game's routing table.
- **FR-008** `emberOf` returns `{feel, from, to, by}`; `feed()` reads `to`.
- **FR-009** The hollow's check-in sheet (`garden.js` `checkinSheet`, `finishWave`) runs on the engine: breath ring on
  each card, "Something's in the way" on every step opening the block walk, the exhale fork, the reading's five fields
  asked at the start.
- **FR-010** A parity test feeds one scripted charge through the engine and through the first game's rules (step
  order, routing table, cycles) and gets the same steps, route and end state.

### Phase 2: the cave and the first game (next slice)

- **FR-011** `cave.js` reads `BREATH` and the block stack from the engine.
- **FR-012** `scripts/build-ontology-game.mjs` inlines the engine into game.jsx (the build has no imports), and
  game.jsx drops its own copies of `WAVE_STEPS`, `routingTable` and the breath numbers.

### Phase 3 (later)

- **FR-013** The gate, the belief report and the route map read the engine's `route`.

## Non-functional requirements

- The module stays under about 400 lines and loads in the browser with no build step.
- The player's words in `body`, `words` and `line` are stored exactly as typed.

## Persisted data & Prisma

No schema change. The charge lives on the device. `TapTheVeinDailySession.chargeStrength` stays unwritten; wiring the
reading to Postgres is its own spec, and the storage rule (coach sees only what the player sends) governs it.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| One shared module, starting with the hollow's WAVE | A plain ES module in `public/calrunia/` | Wendell, `cut50-charge-engine` A (2026-11-09) |
| Reading field names | The founder intake's five, `neutral` mapped | The founder intake (charge-goals-sect.md point 7) |
| Breath length | 4 s in, 6 s out, skippable | Council placeholders, `oag-wave-breath`; unchanged |
| Every step can be blocked and returned to | Block stack, exact-step return | `oag-wave-blocks` |
| What a block opens from the hollow | The block walk, a room (`block-room.js`), not a card in the sheet | Position `ce-block-opens-the-room`, from `bm1-block-is-a-room` (Wendell 2026-11-01 19:03Z: "They should go into a room that has the blocks weather in it") |
| What the exhale forks to | Stay or release, both to the body scan; the 3-2-1 stays in the block walk | Position `ce-exhale-stay-release`, from the built first game (game.jsx line 3484: both alignments go to `scan`) |
| Ember shape | `{feel, from, to, by}`, `feel` kept | Callsheet design point 4 |

### Whose decision

Wendell decided the module and its first slice. The two positions above come from the record, so they stand unless he
flips them on the board. The doc "The first ontology game against the immersive build" said an aligned exhale "stays
for a 3-2-1". The built first game does not do that: both "stay" and "release" go to the body scan, and the 3-2-1
lives in the block walk's three stands. The spec follows the built game, because that is the experience he asked to
get back.

## Ontology

- `design_intent`: the body steers the charge again in the 3D places. [Diplomat]
- `intrinsic_pleasure`: the out-breath landing as the button appears; coming back to the exact step after a block. [Shaman]
- `ontology_objects`: Charge, Block, Spirit (fed by the ember), Rule (the routing table). [Sage]
- `mechanical_claims`: a step cannot be passed faster than one breath unless skipped; a block always returns to its
  step; a move lands where the move table says. [Architect]
- `aqal_attention`: upper left (the body report in the player's words) leads; lower right (the module) serves it. [Shaman]
- `agency_and_consent`: "Skip the breath", "Stop" and stopping at a rung are always there; nothing leaves the device. [Diplomat]
- `evidence_and_unknowns`: known from game.jsx and the cave; unknown whether a breath ring on a 3D card feels like the
  first game's pacer. The cheap test answers it. [Sage]
- `provenance_effects`: WAVE text keeps one home (the engine), so the cave, the hollow and the first game cannot drift. [Regent]
- `risks_and_tests`: the hollow's old saves must still load; parity test against game.jsx's rules. [Challenger]
- `implementation_translation`: plain ES module plus a JSON copy of the move table; the hollow imports it, the
  first-game build inlines it in phase 2. [Architect]
- `decision_or_open_authority`: none open; two positions recorded above. [Regent]

## Reserved items

None. The reading stays on the device; no money, prose of his, names or consent change.

## How we will know it failed

- **The cheap test, run before building the hollow's screens:** the parity test (FR-010) on the engine alone. One
  scripted charge (fear, intensity 7, toward, "tight behind the sternum", no goal) goes welcome to exhale with one
  block on Allow, a release, and one sheng move. The engine must give the first game's step order, return to Allow,
  land on sadness with state `neutral`, and emit ember `{from: "metal", to: "water", by: "metal_water"}`.
- **The proof after slice 1:** one player, one charge, run once in the first game and once in the rebuilt hollow. The
  two body reports (location, texture, the words after the exhale) are put side by side (doc recommendation 6).
- **The result that stops the work:** the hollow's body report comes back thinner than the first game's (fewer body
  words, no location), or the player skips the breath on most cards. Either means the breath does not land in 3D, and
  the next round redraws the card before the cave takes the engine.

## Verification Quest

1. Open `/ontology-game/between`, sit at the hearth, open the check-in.
2. Name a charge: pick fear, slide intensity to 7, pick "toward", type a body line.
3. Watch the Welcome ring breathe in and out; the button appears at the end of the out-breath.
4. On Allow, press "Something's in the way", choose "stone", type a few words. The block walk opens.
5. Leave the walk. The sheet is back on Allow with a new breath.
6. At the exhale, press "Breathe it out". The body scan asks what is left behind.
7. Finish. No move was made, so the ember reads `from: "metal"`, `to: "metal"`, `by: "wave"`.
8. Feed a spirit. Its care rises by the ember's `to` element.

## Dependencies

- `public/calrunia/spirit-care.js` (WAVE text moves out; `feed()` reads `to`).
- `public/between/garden.js` (`checkinSheet` ~2734, `finishWave` ~3883), `public/between/block-room.js`.
- `src/lib/quest-grammar/move-table.json` and its test.

## References

- Callsheet: six-faces-council `council/callsheets/charge-engine.md`.
- The doc: https://claude.ai/artifact/HBLJMzJ4VL2M9KR9WmwVKv
- First game: `content/ontology-game/game.jsx` (`WAVE_STEPS` ~1092, breath 1330, `openBlock` ~2070,
  `returnFromBlock` ~2125, `routingTable` 2444, exhale 3484).
- Cave: `content/ontology-game/cave/cave.js` line 54.

## Definition of done

- [ ] `npx tsx` runs the engine's parity test and the move-table test green.
- [ ] `scripts/local/check.sh --build` passes.
- [ ] Stills of the hollow's WAVE (ring, block return, exhale fork) on the board as a look.
- [ ] Wendell runs one charge in both places for the body-report comparison (his step).

## Signed

- intake: shaman, diplomat (2026-11-09)
- spec: architect, regent (2026-11-09)
- clarify: sage (2026-11-09; both open items answered from the record as positions)
- falsify: challenger (2026-11-09; parity test and body-report comparison)
- assets: regent, architect (2026-11-09; none)
- plan: architect, regent (2026-11-09)
- analyze: sage, challenger (2026-11-09; contract_check)
