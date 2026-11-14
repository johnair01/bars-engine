# Plan: The Friends' Fire, where you play the unfinished bar and a friend plays it home

<!-- Architect and Regent sign this plan; the spec is ./spec.md and the stages are in six-faces-council council/pipeline.yaml. -->

primitives: style the approved land look (ctw-locations-look-1 A, ctw-walk-look-1 and 2 A), thinning at the homeroom's rim; mechanics atlas rhythm-cue-response, narrative-service-as-response, narrative-delayed-choice-consequences, narrative-deliberate-silence (TurnsAndSharedPool, DelayedReturn), proposed canon play-it-on; ontology Location road-home, Character, Capability, Encounter, line creative
footing: ctw-episode-sheet, ctw-walk-look-2, ff1-you-play-it, ff1-hand-it-over, ff1-oriel-follows, ff1-laughter-after-silence, ff1-take-home-offer, ff1-reel-before-rework, ff1-play-it-on
tier: Convened; the fire's play, hand-over, laughter and last card; basis pass friends-fire-1 and his question on build 5
scout: rung 1, the land page's own Web Audio (`pluck`, `tune`, `hz`) and the stump's five seals; Tone.js (rung 2, in use) is not needed for six notes and an ending and costs about 75 kB gzipped on a phone; a CC0 laughter recording is rung 4 (no known tool), searched by the build thread, and the caption stands in if none is found
skills: design-ontology, intake_check, six-faces, primitives, scout, ccgs-roles, satisfaction-reel, art-direction, impeccable, assets_here
skipped: better - the ask was already deepened by his question on build 5 and the pipeline brief; nothing plain was left to deepen
skipped: brief-master - the reel round's brief below follows docs/satisfaction-reel.md's own shape, and the rework brief is written by the callsheet's pipeline brief

## Constitution check

<!-- One row per article of council/constitution.md. An exception names the board row that allows it. -->

| Article | Verdict | Why |
|---|---|---|
| 1 Questions go to the board | pass | Five questions ran the reach test and stand as ff1- positions; nothing asked in chat; the feel goes to him as the reel's look |
| 2 The player comes first | pass | The callsheet's intake passes intake_check; the first 60 seconds start on the far bank in the avatar's body |
| 3 Primitives and footing | pass | primitives, footing and tier lines above |
| 4 Ontology invariants | pass | No score of the player or the song; a pass is a valid turn; no name asked; laughter never varies with the notes; the Game frame passes game_frame_check |
| 5 Cheapest proof first | pass | The reel round's engine check and his keyframe score run before #534 is touched |
| 6 Tool before build | pass | scout line above; the stump's seals, the land kit, #534's place and the crate sit are reused; assets_here runs before stills |
| 7 Something to see | pass | The reel's frames for his look first, then the stills, then the preview at `?place=friends-fire&at=crate` |
| 8 Reserved items | pass | None in this feature (spec.md "Reserved items") |
| 9 One session, one piece | pass | This thread ends at analyze; the reel round, the stills and the rework are each the next thread's one piece |
| 10 Transcend and include | pass | #534 is kept as a prototype and its kept parts are listed below; what is dropped is named with why |

## Approach

The council keeps #534's place and reworks only the act at the fire. The song becomes a small pure engine
(`fire-song.js`), found first in a 2D reel round and then ported, so the rule that matters (Oriel's ending comes from
the player's notes) is tested before any 3D work. The crate card reuses the stump's five seals, so the hands use the
grammar they already learned. The council weighed two other plays: keeping the single button (the cutscene build 5
made) and a timed rhythm track (which would grade the player against a beat). Free notes with a deliberate hand-over
press keep the player's authorship and give no way to get it wrong.

## What of #534 is kept, changed and dropped

| Part of #534 | Verdict | Why |
|---|---|---|
| `friends-fire.js` layout: fire, `SEATS`, crates, houses, lantern, path in, `walkable()` | kept | The level-designer's read: Oriel faces the path across the fire, the houses sit behind Oriel, the crate faces Oriel |
| The guitar model and Oriel holding it; Average Dusk in three looks; `CRATE_SIT` | kept | approved land kit and the code-made sit |
| `place.js` pieces (`fire-ring`, `guitar-tuning`, `empty-crate`), `takeHome()`, `friendHere()` and their tests | kept | the sheet's aspects and treasure, read as data |
| The far bank card and the path back | kept | his A on ctw-walk-look-2 |
| `tune()` and the strummed home chord | kept, extended | the tuning starts on the far bank and lands on the home note (FR-007) |
| `yourNotes()` and sessionStorage `ctw-song` | kept, shown | the stump's notes are lit on the seals rather than hidden (FR-002) |
| `ffAct("play")`: the fixed bar plays itself as "you" | dropped | the player's notes are the play (FR-002, FR-003); a bar that plays itself is the cutscene the pass names |
| Oriel's entry at a fixed time after the bar | changed | on the hand-over, one beat later, at the player's pace (FR-004) |
| The follow camera while seated | changed | the seated framing (FR-006); #534's frame 3 hides the fire behind the player's head |
| The laughter caption "the way friends laugh when a song lands" | dropped | it grades the song (FR-008) |
| The last card's three buttons | changed | two buttons and an offer (FR-009) |
| "Play it again" | dropped | "Stay by the fire" keeps the player there; playing again reopens the seals from the crate card |
| Look `ctw-fire-look-1` | superseded | by the look this plan's build posts |

## Stills before code

After the reel round's yes, and before any change to #534, an art-direction round makes stills from the keep list in
the council's `council/callsheets/stills/2026-11-02-ctw-friends-fire/art-direction.md` (branch
`claude/project-thread-almrpj`): "The approved forest at dusk, the figure and toolbag, the cards whose next move is a
button. New in #534: the rim's lit houses, the fire, the crates, the friends, the guitar, the sit." The reel's last
round adds its own keep lines first, and his last reel note is the art direction's first line. The stills show three
frames: the approach with Oriel's face over the flames, the seated framing with the seals open, and the hand-over. The
round carries `existing:`, `proof:` and `skills:` lines and passes `assets_here.py --check`. #534's four frames are
weighed as a prototype, not copied as the answer.

## Reel round 1 brief (written here, not run)

Strand `ctw-friends-fire`, loop `council/loops/ctw-friends-fire.json`; a Sonnet thread, one round, started with
`python3 council/loops/next_round.py start ctw-friends-fire 1`; folder
`council/callsheets/stills/2026-11-02-ctw-friends-fire-reel-1/` in the council repo (docs/satisfaction-reel.md).

- **Body and place.** The procedural stand-in figure (`artifacts/lantern-hall/v6/rig.js`) seated on a crate at a ring
  of four crates round a fire, drawn on a 2D canvas; Oriel as a second figure across the fire with a guitar shape. No
  asset files.
- **Rules (`rules.md`).** Five note seals, pentatonic, any note right; the stump's notes lit; Oriel plays only after
  "Hand it to Oriel" or "Just listen tonight"; Oriel's ending starts from the last played note, at the player's pace,
  and walks to home in four to six notes; nothing is scored.
- **Engine (`make/engine.js`).** The contract in spec.md, pure.
- **Script (`make/script.js`).** Three sittings: A, the four stump notes 1, 3, 0, 4 played back then hand over; B, one
  note (4) then hand over; C, "Just listen tonight". Refused moves: a hand-over after a pass; a note after the hand-over.
- **Check (`make/check.js`).** Prints pass or fail for: the three endings differ; every ending ends on home; no Oriel
  note before a hand-over or pass; tempo held to 60-110.
- **Frames.** m01 the walk out of the trees with Oriel tuning; m02 the sit, the view settling low; m03 Oriel's ask; m04
  the seals open with the stump's notes lit; m05 the player mid-note, the fire leaning; m06 the hand-over; m07 Oriel
  playing, friends still; m08 the silence; m09 the laugh; m10 the last card. Each frame tagged real (drawn from the
  engine's state) or sample. Sitting A gives the frames; B and C give m06 to m08 as a strip for comparison, and a short
  audio render of each ending sits beside its strip.
- **His look.** One look row with the reel, scored in Emotional Alchemy terms per moment. A gold at m06 with no steer
  ends the rounds; anything else opens round 2 with his notes verbatim.
- **Mechanic.** The round writes `canon/mechanics/play-it-on.yaml` as `status: proposed` with `feel:` numbers (seal
  response 0.15 s, Oriel's entry one beat after the hand-over, 1.5 s silence before laughter); his look rules on it.

## Files touched

Read in bars-engine at `claude/project-thread-almrpj` (a233618, #534). The build stacks on #534.

| File | Change |
|---|---|
| public/between/land/fire-song.js (new) | the song engine, ported from the reel's `make/engine.js` |
| src/lib/between/__tests__/fire-song.test.ts (new) | the reel's three sittings and refused moves, as vitest cases |
| public/between/land/land.js | `ffAct`: seals on the crate card, hand-over, pass, Oriel's ending from `fire-song.js`; the seated camera; the mix and ducking; laughter timing; the last card's two buttons; `?at=crate` and `?song=` on preview hosts |
| public/between/land/friends-fire.js | the fire's light leans toward each note (`warm()` already exists); a tuning point near the far bank |
| public/between/land/place.js | the drafted Oriel line for the recording secret, read from the sheet |
| scripts/seed-cert-ctw-friends-fire.ts (new) | the verification quest `cert-ctw-friends-fire-v1` |
| package.json | `seed:cert:ctw-friends-fire`; the new test in the land test run |

## Verification Quest

`cert-ctw-friends-fire-v1`: a TwineStory with a CustomBar (`isSystem: true`, `visibility: 'public'`), seeded by
`npm run seed:cert:ctw-friends-fire`, framed as readying the episode's road home for its first player. Passages: 1, open
the preview at the Scale-House far bank and follow the path; 2, sit on the empty crate; 3, open the toolbag and play five
notes, then hand it to Oriel; 4, hear Oriel start from your last note; 5, stand up, sit again and choose "Just listen
tonight"; 6, read the last card and take it home (completing it mints the reward).

## Order

1. The falsification test from the spec, first: reel round 1 and its check; his look on the reel.
2. Stills from the keep list (art direction), after the reel's yes.
3. Contracts before screens: `fire-song.js` and its vitest from the reel's engine and script.
4. The crate card's seals, the hand-over and the pass in `land.js`; the seated camera; the audio.
5. The Impeccable critique of the cards; the verification quest seed.
6. The repo's checks, the preview, frames, and a look that supersedes `ctw-fire-look-1`.

## What Wendell does, and when

No [wendell] task in tasks.md. His part is on the board: his score on the reel round's look (before step 2), and his
look at the reworked fire's preview (step 6). Nothing in this plan asks him for a step only he can take.
