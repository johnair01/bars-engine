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

## The first three chambers

The figure has about fifty named places (`body/build_figure.py`, `ANCHORS`). A chamber per place is too many for a
first draft, so places are grouped into regions and each region has one chamber **(choice)**. The first slice opens
three regions:

- **Throat:** throat, jaw, mouth, back of the neck.
- **Heart:** heart, upper chest, sternum, both sides of the chest, upper back, between the shoulder blades.
- **Belly:** belly, lower belly, solar plexus, both sides of the ribs, mid and lower back.

These are where people most often place emotion in the body in Nummenmaa and colleagues' body maps of emotion
(*PNAS*, 2014), and the body map's own example is "chest, then jaw" (`body-map.js`). A tap anywhere else says that
chamber is not open yet and offers to carry on in the original game's flow, so no player is stuck **(choice)**.

## How it is built

- **Chambers** are made by one Blender script, `cave/build_chambers.py`, the same way `build_figure.py` makes the
  figure: `pip install bpy` (5.2.2 runs on the cloud's Python 3.13), no Blender window, lighting baked into the
  textures, exported as one `.glb` per chamber and committed. The texture and element looks are switched on the page
  with materials and light, so three chambers need three files, not three times fifteen.
- **The daemon** is built by script from fused rounded shapes like the figure, with no face, so the seven daemons
  share one body and differ by colour, posture and what they carry **(choice)**. TRELLIS.2 on his Mac stays out of
  the first slice (`c3d-meshy-alternatives`).
- **Textures** are script-made or CC0 from Poly Haven, each listed in `cave/manifest.json` with its source and
  licence (`c3d-cc0-only`).
- **The page** loads three.js r128 from cdnjs, the version `body-map.js` already uses, and the chamber files only
  when the player enters a chamber. Each chamber stays under about 3 MB (`c3d-phone-budget`).
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
| 2 | `build_chambers.py` builds the throat chamber; the page dives in from the figure and walks the five places | Sonnet |
| 3 | The heart and belly chambers; the texture and element looks | Sonnet |
| 4 | The daemon figure and the passage; the words wired from the copied tables | Opus |
| 5 | Phone tests (size, frame rate, one-finger walk) and a playable link on his steps list | Sonnet |
| 6 and 7 | His play, and the fixes his steers ask for | Sonnet |

## Tests

- By the end of day 2: the throat chamber loads under 3 MB and the walk runs at phone size in the browser test.
- By the end of day 5: all three chambers pass the same test, and a player can go in, through all five places and
  out, with the scan saved.
- By the end of the week: Wendell has walked three chambers and passed one daemon; the week's measured cost is
  recorded beside the estimate of $35 to $100.
