# Spec: The visitor's nook, where the Between walk begins

<!-- The six-faces pipeline's spec template (six-faces-council council/spec-kit/spec.md), with bars-engine's
     Conceptual Model, Verification Quest, Dependencies and References sections added. Stages and owners:
     council/pipeline.yaml. Pass: six-faces-council council/passes/walk-nook-1_2026-11-05.md. -->

game: yes
intake: council/callsheets/charge-to-world.md

## The ask

> "Yeah we need an end to end demo space of these connected worlds I can use to show people" (Wendell, 2026-11-04 22:52Z), and his B on `ctw-walk-demo-look-1` (2026-11-04 23:32Z): "Claude builds a visitor's nook with no sign-in, so the walk starts where a player wakes; one more round before it ships."

**Who it is for:** someone Wendell shows the Between to (a backer, a partner, a guest), on a phone or laptop, with no
account.
**What they feel now, and what should change:** #602's walk opens in the clearing, past a nook they never see, with a
card that says their nook "stays on the other side". After this, they wake in a nook, unroll a stranger's charge at the
map stand and step through the doorway into the lands it made, as a player does.

## Purpose

`/between/walk` serves the Between's nook with no sign-in and no store. The map stand holds the sample's charge; its
doorway leads into #602's walk through the clearing, the Scale-House, the Friends' Fire and the keeping chamber; the walk
leads back to the nook.

## Game type

A showing of a game of passion (the nook and the Between). Coins: about ten minutes of the visitor's attention; it must
not spend their trust, so nothing asks for a name, an email or a charge of their own. Tickets: none in the walk; the
showing's satisfaction is whether they ask for their own nook.

## Conceptual Model

- **WHO:** the visitor (the figure, default look); the sample player, whose charge waits on the stand.
- **WHAT:** the sample's charge and episode sheet; the two panes; the walk's flag.
- **WHERE:** the nook at `/between/walk`; then `/between/land.html?walk=1` and its places.

## User stories

### Unroll their map

**As a visitor**, I want to find someone's charge on the map stand and unroll it, so I see what a charge becomes.
**Acceptance:** the hint names the room as a visitor's nook and points at the stand; the stand's card tells the charge
in its own words and offers "Unroll their map"; pressing it raises the two panes.

### Step through

**As a visitor**, I want the doorway to lead into the lands, so the walk starts where a player wakes.
**Acceptance:** with the map unrolled, "Walk to the doorway" then "Step through" opens `/between/land.html?walk=1`.

### Come back

**As a visitor**, I want the walk to end where it began.
**Acceptance:** the clearing's arch offers "Back through to the nook"; the chamber's last card offers "Walk it again from
the nook"; both open `/between/walk`.

### Verification quest

**As a tester**, I want to walk it once on a phone before his look. The walk keeps nothing and needs no account, so the
quest is the look itself: the frames from the served page and his walk on the hosted link. No cert quest is seeded,
since a seeded quest needs a signed-in player and the walk is for people without one.

## Requirements

- **FR-001** `GET /between/walk` returns the Between page with no sign-in check (a route, replacing #602's redirect).
- **FR-002** On that path garden.js asks no store (no `/api/between`, no council scroll fetch), builds the nook, runs no
  first minute, and its namecard and hint say "A visitor's nook", never "the store did not answer".
- **FR-003** The map stand in the visitor's nook holds the sample's charge, offers "Unroll their map", and its sheet has
  no "Change the charge".
- **FR-004** The doorway, with the map unrolled, opens `/between/land.html?walk=1`; the chamber's arch from the nook
  keeps `walk=1`.
- **FR-005** In the walk, the clearing's arch, "Start over" and the last card's "Walk it again from the nook" open
  `/between/walk`.
- **FR-006** The signed-in nook at `/ontology-game/between` is unchanged.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Where the walk starts | The visitor's nook at `/between/walk` | Wendell, B on ctw-walk-demo-look-1 |
| Whose charge | The sample's, told in its words; the visitor brings none | council, position wn1-their-charge |
| Where it ends | Back in the nook | council, position wn1-back-to-the-nook |
| How the store is skipped | The stand-in room's path (`storeDown`) | council, position wn1-visitor-nook-first |

## Contracts

`window.__between.visit` (boolean); `charge-world.js` `mount(B, { visit })`; `land.js` `WALK_NOOK = "/between/walk"`.
The feature adds one public route, no table and no Prisma change.

## Ontology

<!-- The design ontology's output contract. The face named owns the line. -->

- `design_intent`: a visitor wakes in a lent nook, unrolls a stranger's charge and walks the four lands it made, without signing in (Shaman)
- `intrinsic_pleasure`: the reveal of a charge becoming land; Discovery, then Narrative (Shaman)
- `ontology_objects`: Location (the nook, homeroom), the episode sheet, the map stand's intake (Architect)
- `mechanical_claims`: the visitor's nook writes nothing; the doorway opens once the map is unrolled; the walk's flag rides every door; the walk ends where it began (Architect)
- `aqal_attention`: It first (walking, the stand, the doorway); I (the visitor's response, never asked); We (a stranger's charge as a person's); Its (no store, no account) (Regent)
- `agency_and_consent`: every move a press; no name, no account, nothing kept (Diplomat)
- `evidence_and_unknowns`: evidence: #602 and its look, his B, the store-down path; unknown: the nook as a first screen on a phone (Sage)
- `provenance_effects`: keeps #602 and every nook system; retires the clearing as the walk's door (Regent)
- `risks_and_tests`: a nook that reads as a broken store; test below (Challenger)
- `implementation_translation`: `src/app/between/walk/route.ts`, garden.js `VISIT`, charge-world.js `opts.visit`, land.js `WALK_NOOK` (Architect)
- `decision_or_open_authority`: three council positions (wn1-visitor-nook-first, wn1-their-charge, wn1-back-to-the-nook); the look is his (Sage)

## Reserved items

This feature holds no reserved item. No money, paywall or real person's name; the sample player is invented.

## Clarify

The reach test ran on one question, whether a visitor brings a charge of their own; the Regent and Diplomat answered it
from the record (nothing in the walk is kept, and option B names no charge of their own). It stands as position
wn1-their-charge; there is no open marker in this spec.

## How we will know it failed

- **The cheap test, run before building:** open `/between/walk` locally with no cookie and read the first frame: the
  hint must say "A visitor's nook" and no request to `/api/between` may go out.
- **The result that stops the work:** the page redirects to sign-in, the nook reads as a broken store, or the doorway
  stays shut; then the store-down path is not the right base and a separate page is weighed.

## Definition of done

- [ ] `scripts/local/check.sh --build` passes.
- [ ] Frames from the served page: the nook on arrival, the stand unrolled, the clearing reached through the doorway.
- [ ] His look on the board.

## Dependencies

#602 (the walk), which this branch carries.

## References

Six-faces-council: `council/passes/walk-nook-1_2026-11-05.md`; `council/callsheets/charge-to-world.md` (briefs "the walk"
and "the visitor's nook").

## Signed

<!-- One line per stage reached, naming every owner in council/pipeline.yaml. -->

- intake: shaman, diplomat (2026-11-05, from council/callsheets/charge-to-world.md, Intake and the visitor's nook brief)
- spec: architect, regent (2026-11-05)
- clarify: sage (2026-11-05; one question, one position, no board question)
- falsify: challenger (2026-11-05; the cheap test above)
- plan: architect, regent (2026-11-05)
- analyze: sage, challenger (2026-11-05)
