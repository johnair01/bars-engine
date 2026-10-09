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
| 3 | One generic chamber in place of the spot shapes; the portal asks charge, channel and face, then the chamber forms in that look; paths and portals between the sensations of one sitting | Sonnet |
| 4 | The daemon figure and the passage; the words wired from the copied tables | Opus |
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
