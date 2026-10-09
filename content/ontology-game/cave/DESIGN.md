# The Cave of Lessons: the ontology game played inside the body

**Day 1 of the first draft** (council position `c3d-week`), 9 October 2026. Wendell's board answer on `c3d-path` was
web, with this steer: "I do think we should fork the ontology game if this is the case, or rather create a version
where the game happens inside the body map instead of the body map being inside the game." The analysis behind it is
six-faces-council `council/passes/6FACE_PASS_3d-build2_2026-10-09.md`.

Every choice below that his words or the record do not settle is marked **(choice)**. Each one stands unless he flips
it on the Council Board.

## What changes

Today the body map is a tool inside the ontology game. A player reaches step 1 of block work and taps the figure to
say where the charge is (`game.jsx`, `OAGBody.pick()`). In the Cave of Lessons the figure is the world. The player
starts in front of the body, taps where the charge is, and the camera goes in at that spot. Inside is a chamber, and
the block work happens there as a walk through it.

The original game stays as it is. The Cave of Lessons is a separate page built from its own folder (this one), so the
two can be played side by side and compared **(choice)**.

## The walk through a chamber

A chamber is a short cave passage with five places along it, one for each part of block work in `BLOCK_STEPS`
(`game.jsx`, pass 3 and Wendell's sketch of 7 October). The player moves forward only after finishing a place, so the
walk is the cycle itself.

| Place | Block step | What the player does there | How the chamber shows it |
|---|---|---|---|
| The mouth | 1 Sensation | Names the texture: tightness, tension, numbness, strength, something else | The walls take that texture: they narrow for tightness, stretch into taut strands for tension, fill with fog for numbness and glow for strength **(choice)** |
| The pool | 2 Element | Picks fire, water, wood, metal or earth, then runs Happy Apples to open up and the clean up move that goes with it (`CLEAN_UP_MOVES`) | The pool turns to fire, water, wood, metal or earth: fire burns the blockage away, water rises and dissolves it, wood grows through it, metal clears the fog to a sharp edge, earth settles it into the floor **(choice)** |
| The passage | 3 Daemon | Meets the daemon standing in the way and asks its three questions: its job, who it works for (`DAEMON_WORKS_FOR`), whether it will step aside | The daemon is a figure in the passage. If it steps aside, it moves to the wall and the way opens |
| The gate | 4 Game masters' gate | The six game masters' gate, as the game runs it now | Six standing stones around a ring, one per face, lit as the gate is worked **(choice)** |
| The way out | Release | The release and the return to the step | Light from above; the camera rises back out of the body to the place it entered, and the scan is saved with `OAGBody.record` |

Passing a daemon by its lesson, the done test for the first slice, is the passage: the daemon steps aside because
the player knows its job and who it works for.

## The body's markers are portals, and the chamber forms from the charge

Two board rulings of 9 October shape this. On `c3d-regions-first` (overruled): "Let's have the chamber change to meet
the spot. Branching off if there are multiple body sensations with portals or paths that connect them." On
`c3d-spot-shape` (overruled, 18:53): the chamber's feeling matches the energy the player brings, so it is not made until
the charge, the elemental channel and the face are known. Chambers stay generic for now, and the markers on the body are
portals for the charge, not pictures of the body part.

**A marker is a portal.** Every named place on the figure (`body/build_figure.py`, `ANCHORS`) is a doorway into the
cave. Where the player taps says where the charge lives; it does not shape the chamber. `spots.json` keeps each place's
words and position so the portal sits on the right spot and the scan is saved there. Its width, height, length and bend
(day 2) are no longer used for the chamber.

**The chamber forms from the energy brought in.** At the portal, before going in, the player names what they bring
**(choice: this order)**:

1. The charge: tightness, tension, numbness, strength or something else (the body map's textures).
2. The elemental channel: fire, water, wood, metal or earth (`CLEAN_UP_MOVES`).
3. The face: one of the six game masters, from the game's faces primer.

Only then does the chamber appear, one generic shape every time, dressed in that energy: the charge sets the walls,
the channel sets the light and the pool, the face sets the gate. With these three moved to the portal, the mouth and
the pool still run the sensation and the practice, and the gate still runs the six game masters' gate, but they start
from what the player already named **(choice)**.

**Several sensations branch into paths.** A body scan can name more than one place, and the body map already joins
the marks of one sitting with a line (`body-map.js`, "chest, then jaw"). In the cave, each place the player names is a
chamber, and each pair named in the same sitting is joined by a path that runs inside the body between them **(choice:
the path follows the straight line through the body, curved to stay inside the figure)**. At the end of a chamber's
passage, a portal opens for each other sensation; the player picks which to follow. A sensation the player has walked
through shows its portal lit on the way back, so the whole scan can be finished in any order.

**Where the paths come from.** The page reads the places named in the current sitting from `OAGBody.marks()`. A new
sensation named inside the cave (the mouth asks "is anything else showing up?") adds a chamber and a portal on the
spot **(choice)**.

## How it is built

- **The chamber kit** is made by one Blender script, `cave/build_kit.py`, the same way `build_figure.py` makes the
  figure: `pip install bpy` (5.2.2 runs on the cloud's Python 3.13), no Blender window, exported as one `cave-kit.glb`
  and committed. The page builds one generic chamber from the kit and dresses it with the charge, channel and face
  the player names at the portal, so every portal and every combination needs one file.
- **Portals** come from a table, `cave/spots.json`, written by the same script from the figure's anchors: each
  place's words, position and side. The page reads it, so the figure and the cave always agree. Its shape fields are
  left over from day 2 and unused since `c3d-spot-shape` was overruled.
- **The daemon** is built by script from fused rounded shapes like the figure, with no face, so the seven daemons
  share one body and differ by colour, posture and what they carry **(choice)**. TRELLIS.2 on his Mac stays out of
  the first slice (`c3d-meshy-alternatives`).
- **Textures** are script-made or CC0 from Poly Haven, each listed in `cave/manifest.json` with its source and
  licence (`c3d-cc0-only`).
- **The page** loads three.js r128 from cdnjs, the version `body-map.js` already uses, and the chamber files only
  when the player enters a chamber. The kit stays under about 3 MB (`c3d-phone-budget`).
- **Movement** is one finger: drag to look, tap the glowing marker ahead to walk to the next place. There is no
  joystick, because the walk only goes forward **(choice)**.
- **Game data** names asset ids from the manifest, never file paths, as in Sprout.
- **The words** the player reads at each place (the clean up moves, the daemons, the questions) are copied from
  `game.jsx` with their line references, so the original stays untouched. Once the cave is kept, the tables move into
  one shared file both pages read **(choice)**.
- **The page address** is `/ontology-game/cave/` on the same site **(choice)**.

## The rest of the week

| Day | Work | Model |
|---|---|---|
| 1 (today) | This design and the manifest | Opus |
| 2 (done 9 Oct) | `build_kit.py` builds the kit and `spots.json`; the page dives in from the figure at any spot and walks the five places. Built: `cave-kit.glb` (17 KB), `spots.json` (79 places), `cave.js`, `cave-test.mjs`; page at `/ontology-game/cave`. Daemon and gate are stand-ins until days 3 and 4 | Sonnet |
| 3 (done 9 Oct) | One generic chamber in place of the spot shapes; the portal asks charge, channel and face, then the chamber forms in that look; paths and portals between the sensations of one sitting. Also built, ahead of day 4: the daemon figure (one body in seven colours, each carrying its own object) that steps aside, and the six gate stones that light as each is stood at | Sonnet |
| 4 | The daemon's own look and posture polished, and the words wired from the copied tables | Opus |
| 5 | Phone tests (size, frame rate, one-finger walk) and a playable link on his steps list | Sonnet |
| 6 and 7 | His play, and the fixes his steers ask for | Sonnet |

## Tests

- By the end of day 2: the kit loads under 3 MB, and a chamber shaped for the throat, the heart and a hand each walks at
  phone size in the browser test.
- By the end of day 3: every portal opens the same chamber, and two scans with different charge, channel and face
  look different in the browser test.
- By the end of day 5: a scan naming two places opens two chambers joined by a path, and a player can go in, through
  both chambers and out, with the scan saved.
- By the end of the week: Wendell has walked his own scan through its chambers and passed one daemon; the week's measured cost is
  recorded beside the estimate of $35 to $100.

## Wendell's playtest notes on day 3 (9 October 2026, evening)

Built the same night (it overrules the portal in "The chamber forms from the energy brought in" above):

- **No face at the doorway.** Players do not know enough about the faces to answer there. The doorway asks the charge and
  then the feeling, and the face is met at the gate, where the player stands at all six stones ("choosing all 6 faces
  when you're in the cave is very cool").
- **One answer per page, and the cave changes with each answer.** The charge page builds the chamber at once in that
  charge's walls; the feeling page makes its element appear. There is no list of choices and no Go in button.
- **Each element is its own object, not a recoloured pool** (fire, a pool of water, a tree, a crystal, a boulder). The
  player can tap it and it answers.

Not built yet; each is a design pass first, and the questions go on the Council Board, not into chat:

1. **A player avatar** instead of first person.
2. **A labyrinth** in place of the straight passage, so the cave feels immersive.
3. **The W.A.V.E. breathing woven into the walk** more closely.
4. **Branching paths that emerge from blockages in the wave patterns.**


## The next build, from the board of 9 October, 20:35

His answers (six-faces-council ledger `2026-10-09-pull-203521.json`; pass `6FACE_PASS_3d-build3_2026-10-09.md`):

- **`cave-spine`: the W.A.V.E. is the path.** The walk through a chamber is Welcome, the four A's, Validate and Exhale,
  one winding stretch per breath. The five places (sensation, element, daemon, the six stones, release) are no longer
  the main walk; they open as a side passage when the player blocks. A walk with no block never meets the daemon or
  the stones.
- **`cave-labyrinth-form`: one winding path.** Switchbacks and bends with no free turns, so nobody gets lost while a
  feeling is live. The path branches only where the player blocks.
- **Standing:** `cave-avatar-self` (a small faceless figure wearing the charge, seen from close behind; hold to walk,
  drag to look), `cave-breath-in-the-cave` (the cave breathes at an easy pace; an optional hold-to-inhale ring; nothing
  scored or required), `cave-block-branch` (a block on any W.A.V.E. step opens the side passage, Release returns to the
  exact spot, blocks nest, the main path stays lit with a lantern where you branched, every block offers a skip) and
  `cave-detour-kept` (a blocked step stays marked on the saved scan).
- **Dropped:** `cave-labyrinth-test` was overruled ("I don't really understand the purpose of this"), so no five-person
  walk is run before he plays. The phone budget in `c3d-phone-budget` still holds in the browser test.

So the doorway still asks the charge and the feeling, the chamber still forms from them, and the gate's six stones move
inside the block passage.

## What the W.A.V.E. build did (9 October 2026, after the board of 20:35)

The doorway is unchanged: the charge page, then the feeling page. After it the chamber is one winding path with a
stretch for each W.A.V.E. step, in order: Welcome, Acknowledge, Allow, Accept, Appreciate, Validate, Exhale. The
path comes from a short table in `cave.js` (`STRETCHES`: a length and a sideways wander for each step) and a seed made
from the place and the charge, so the same scan gives the same cave. Each stretch ends in a switchback to the next,
and the rows sit far enough apart that the walls never meet, which the browser test measures. Each stretch ends at a
glowing marker that shows the step's own words, copied from `WAVE_STEPS` in `game.jsx` (lines 1092-1108), with two
choices: Go on, or "This step won't go further". At Exhale, Go on reads "Come back out", and the camera rises out as before.

- **Blocks branch.** Choosing the block opens a doorway in the wall at that spot and leaves a lantern there. The side
  passage holds the five places in order (sensation, element, daemon with "Not yet", the six stones, release). Release
  walks the player back to the exact marker. A block at any of the first four places opens another passage off it; a
  stack keeps the way back working two deep or more. The main path stays lit with warm stones along its edges. Every
  card in a side passage also has Skip, which returns to the main path without the block work.
- **The avatar.** A small faceless figure built by the daemon's own builder at low segment counts (about 10 KB of
  geometry). It wears the charge: tightness is narrow, tension is tall and taut, numbness is translucent, strength is
  bright. Each step passed loosens it a little. The camera follows close behind and a little above. Holding a thumb
  anywhere walks the avatar along the path toward the next marker, and a drag looks around. The avatar only ever
  stands on the path line.
- **The breath.** About 11 seconds (4.5 in, 6.5 out). The walls ease in and out by a few percent, the light warms on the
  exhale, and the element object and the avatar's chest glow with it. A held thumb walks quicker on the inhale and
  slower on the exhale, never below about half pace, and no step is ever blocked by it. An optional ring turns on from
  the top left: hold to breathe in, let go to breathe out, and the cave follows. The Calm button, always at the top
  right, stills the motion and the light pulsing and hides the ring. No breath is scored or required.
- **The saved scan.** `OAGBody.record` now takes `blocked` and `skipped` lists and keeps them on the mark. A block on a
  W.A.V.E. step is saved under its step id (`allow`); a block met inside that step's side passage is saved as
  `allow>sensation`, `allow>daemon` and so on.

Choices this build made that the board did not settle, each of which stands unless Wendell flips it:

- **(choice)** The side passages sit far below the main cave in the same scene, so they can never cross the path's other
  rows, and the walk into one is a short fade.
- **(choice)** Skip returns to the main path from any depth, where Release returns one level. A skipped block stays marked
  as blocked on the scan, and is also listed under `skipped`.
- **(choice)** The five places each offer "This step won't go further" except Release, which is the way back.
- **(choice)** The element object stands beside the first stretch, and it answers a tap anywhere on the main path.
- **(choice)** Walking pace is 0.8 of full when the cave is calm. The ring hands the breath back to the cave's own cycle
  after 15 seconds untouched.
- **(choice)** At Exhale the card also holds the paths to other places named in the sitting, and the button to name another,
  which the old way out held.
- **(choice)** Passages the player leaves are put away; walking back in, by blocking the same step again, makes a fresh one.

Tests: `cave-test.mjs` now checks the seven stretches in order, the walk on a held thumb, a block and Release, a block
two deep, a skip, the calm button, the saved blocked steps, the size budget and that the page raises no errors. The kit
(`cave-kit.glb`) is unchanged at 17 KB; `build_kit.py` needed no new pieces.
