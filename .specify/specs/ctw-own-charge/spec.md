# Spec: your own charge walks all three lands

<!-- Charge to world, slice 6. Pass: six-faces-council council/passes/charge-to-world-2_2026-11-04.md. -->

game: yes
intake: council/callsheets/charge-to-world.md

## The ask

> "so a charge becomes an asset without his futzing." (Wendell, 2026-10-28, on the Lazy Dungeon Master and the six unpacking questions)

## Purpose

A player's own six answers become the three walkable lands of their episode, with no one drafting by hand.

## Game type

A game of passion with a thread of skill, as the three lands already are (pass friends-fire-1); this slice changes the
episode's input, not its play.

## Conceptual Model

WHO: the player, at the nook's map stand. WHAT: their charge, drafted by rules into the sheet's free text. WHERE: the
Unfinished Clearing, the Scale-House and the Friends' Fire, the kit's three built lands.

## User stories

### Bring your own charge

The player walks to the stand, chooses "Bring a charge", and finds the six questions blank, with "Try the sample's
answers" one button away. They answer and unroll the episode; the panes rise with the kit's stills.

### Walk it

The player steps through the doorway and hears the hum of the work they named; at the Scale-House the path card names
their own belief's villain; at the fire the friend they named asks to hear it, and the last card offers a step on their
own work.

### Verification quest

Walk your own charge: at the stand, answer the six questions with an invented charge, unroll, step through, give the
stump four notes, set the bag in the balance and lay the plank, sit at the fire and hand the song to the friend you
named. Done when the last card shows your own work and key.

## Requirements

- FR-001 The stand's six questions open blank for the player's own charge; the sample's answers are a second button.
- FR-002 A charge the player wrote carries none of the sample's unasked fields.
- FR-003 A charge with no `drafted` block is drafted by fixed rules from its answers (`public/calrunia/episode-draft.js`), never by a model; the same answers give the same sheet.
- FR-004 The drafted block names the kit's three places and aspects, so every piece of all three lands builds and no card shows a "[to draft" marker.
- FR-005 The friend at the fire is the first person named in question 3 with the role friend, or the first named; with no one named, Oriel stands in. The cards say that friend's name.
- FR-006 The clearing's path card names the player's own belief's villain; a land whose element is not built says the forest stands in.
- FR-007 The sample's own drafted block is never replaced, and its sheet still matches the Python tool line for line.
- FR-008 A missing answer is named in plain words on the form; no ontology id or field name reaches the player.

## Design decisions

The drafter fills the kit, not a new kit: the three built lands carry any charge (`ctw2-one-kit-any-charge`). The
daemon is the Protector for every belief. The land's music stands for any unfinished work.

## Contracts

`draft(charge, g)` returns a `drafted` block in the shape of `sample-player.json`'s, plus `by: "episode-draft.js"`.
`withDraft(charge, g)` returns the charge unchanged when it has a drafted block. `people(charge)` returns `{ friend,
neighbour }`.

## Ontology

<!-- The design ontology's output contract. The face named owns the line. -->

- `design_intent`: a player's own six answers become the three walkable lands of their episode, with no hand drafting (Diplomat)
- `intrinsic_pleasure`: recognition, the world speaking your words back; Expression first, Fellowship with the friend you named (Shaman)
- `ontology_objects`: Session, EncounterDefinition, Location (encounter, villain, road-home), Character (the named friend and neighbour, the Protector), Capability, DevelopmentLine (Sage)
- `mechanical_claims`: the same answers give the same world; every piece of the three lands builds for any valid charge; no line comes from a model; the sample's drafted block stands (Architect)
- `aqal_attention`: I (your own words as the world), We (the friend you named), It (the walk), Its (the drafter's tables); the line is the player's, the kit the creative line's for now (Shaman)
- `agency_and_consent`: you walk to the map stand in your nook, answer six questions in your own words or take the sample's, and step through the doorway into a clearing that hums the work you named; nothing leaves the tab (Diplomat)
- `evidence_and_unknowns`: evidence: the stand, sheet and land code read in pass charge-to-world-2; unknown: how his own charge reads, whether the Weigher's act reads for another belief, whether the questions are too long on a phone (Sage)
- `provenance_effects`: keeps the sample's drafted block, the sheet and its parity test, every land and card; adds episode-draft.js; retires the sample's unasked fields in a written charge (Regent)
- `risks_and_tests`: canned-sounding templates; dissonance for other beliefs; test below (Challenger)
- `implementation_translation`: `public/calrunia/episode-draft.js`, `public/between/charge-world.js`, `public/between/land/land.js`, `src/lib/between/__tests__/episode-draft.test.ts` (Architect)
- `decision_or_open_authority`: four council positions (ctw2-draft-from-your-words, ctw2-one-kit-any-charge, ctw2-stand-opens-blank, ctw2-friend-you-named); no question; his look on his own charge (Regent)

## Reserved items

This feature holds no reserved item. A real charge and the names typed in question 3 stay in the player's own tab
(sessionStorage) and reach no server and no repo (`ctw-pilot`).

## Clarify

The reach test ran on four questions (request.md, step 2); all four stand as positions. There is no open marker in
this spec.

## How we will know it failed

- **The cheap test, run before the look:** `episode-draft.test.ts` walks a second invented charge (relational line, "I don't belong", anxious for a season, two people named) through all three lands.
- **The result that stops the work:** a land builds fewer than three pieces, a card shows "[to draft", or any drafted line quotes the sample's words; or his look says his own charge does not read as his.

## Definition of done

- [ ] `scripts/local/check.sh --build` passes, with the new vitest file.
- [ ] Frames of an invented charge walked, read before posting.
- [ ] Look `ctw-own-charge-look-1` posted.

## Dependencies

The stand (#461, #462), the three lands (#471, #502, #529, #556).

## References

Pass charge-to-world-2; pass friends-fire-1; `public/between/ctw/sample-player.json`.

## Signed

<!-- One line per stage reached, naming every owner in council/pipeline.yaml. -->

- intake: shaman, diplomat (2026-11-04, from council/callsheets/charge-to-world.md; intake_check ok)
- spec: architect, regent (2026-11-04)
- clarify: sage (2026-11-04; four questions, four positions, no board question)
- falsify: challenger (2026-11-04; the vitest walk of a second invented charge)
- plan: architect, regent (2026-11-04)
- analyze: sage, challenger (2026-11-04; contract_check.py exits 0)
