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
| The mouth | 2 Sensation | Names the texture: tightness, tension, numbness, strength, something else | The walls take that texture: they narrow for tightness, stretch into taut strands for tension, fill with fog for numbness and glow for strength **(choice)** |
| The pool | 3 Element | Picks fire, water, wood, metal or earth, then runs Happy Apples to open up and the clean up move that goes with it (`CLEAN_UP_MOVES`) | The pool turns to fire, water, wood, metal or earth: fire burns the blockage away, water rises and dissolves it, wood grows through it, metal clears the fog to a sharp edge, earth settles it into the floor **(choice)** |
| The passage | 4 Daemon | Meets the daemon standing in the way and asks its three questions: its job, who it works for (`DAEMON_WORKS_FOR`), whether it will step aside | The daemon is a figure in the passage. If it steps aside, it moves to the wall and the way opens |
| The gate | 1 Game masters' gate (first stop of the passage) | The six game masters' gate, as the game runs it now | Six standing stones around a ring, one per face, lit as the gate is worked **(choice)** |
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

## The walk, rebuilt around the breath (9 October 2026, after Wendell's playtest on his iPhone)

His words: "holding down the screen doesn't trigger the iPhone select features. We want the figure to be more noticeably
human and walk. And we want to time the walk to the length of the ontology games inhale and exhale. We want the screen to
change as they move though each of the wave steps and having the information on screen instead of the bottom makes it more
immersive switching paths was good but also had the same issues." Five changes answer it.

- **A long press does nothing.** No text selection, magnifier or callout menu, no tap highlight, no double-tap zoom, no
  context menu. The style sheet sets `user-select:none`, `-webkit-touch-callout:none` and a clear tap highlight on the whole
  page, `touch-action:none` on the canvas and the breath ring (the hold area) and `touch-action:manipulation` on buttons, so
  they stay tappable. The script cancels `contextmenu`, `selectstart`, `dragstart` and the three `gesture` events, and
  cancels `touchstart` and `touchmove` on the canvas and the ring with a non-passive listener. Typed text in an input is the
  one exception. The page template in `scripts/build-ontology-game.mjs` now has `maximum-scale=1,user-scalable=no` in its
  viewport. **(choice)** The viewport lock covers the whole cave page, including the body-map picker that opens on it.
- **A jointed human.** The blob is gone. The avatar is built from lathe capsules and one shared sphere: head, neck, torso,
  pelvis, and on each side an upper and lower arm with a hand and an upper and lower leg with a foot. Sixteen named joints
  turn (hips, spine, neck, head, and hip, knee, ankle, shoulder, elbow and wrist on each side). It is still faceless and
  still wears the charge by the same table (tightness drawn in, tension tall and taut, numbness fogged, strength bright) and
  loosens a step at a time. Its geometry is about 24 KB. **(choice)** It is 3.6 units tall, and the camera sits farther back
  and higher (6.2 behind, 4.6 up) so the figure and the sign both fit a phone.
- **The walk is one breath.** The numbers are the game's own: `game.jsx` lines 1330-1331 set `BREATH_IN_MS = 4000` and
  `BREATH_OUT_MS = 6000`, and `cave.js` reads the same two values. While the player holds, one stretch from one W.A.V.E.
  marker to the next takes exactly one breath of holding: the first half of the distance on the 4 s inhale and the second half
  on the 6 s exhale. Footfalls come two a second, so the inhale has 8 steps and the exhale 12, evenly spaced; the inhale
  strides are therefore longer than the exhale ones. Letting go pauses the walk's clock (and the steps with it); the cave's own
  breathing carries on. While the player holds, the cave breathes with the walk, so the walls and the light swell on the inhale
  step. The optional ring still takes over the cave's breath when it is on. The old rule that the walk quickens and slows with
  the cave's breath is gone, because the walk now has its own fixed rhythm. The walk cycle swings the legs from the hips with
  the knees bending as each leg comes through, swings the arms against the legs, turns the torso a little and sinks the hips as
  the legs spread. Standing, the chest swells and the shoulders lift with the breath.
  - **(choice)** The rows of the path are shorter (12 units, and 36 for Welcome, which has no switchback before it) so a stretch is
    about 40 units and the strides stay natural at two steps a second. The side passage's five places are 30 units apart for
    the same reason (one breath of walking each).
  - **(choice)** Calm still walks, at 0.8 of the clock rate, as before.
  - **(choice)** The test speed-up is `state.speed`, which scales the walk clock; it is 1 in play.
- **Each W.A.V.E. step has its own screen.** `STEP_LOOK` in `cave.js` gives each stretch a light colour, a fog and background
  colour, a fog thickness, an ambient level and a wall openness. **(choice)** The first five light colours are the game's
  element colours in the order Earth, Fire, Water, Wood, Metal (Welcome, Acknowledge, Allow, Accept, Appreciate), then gold
  for Validate and daylight for Exhale; the fog brightens and thins, and the walls open from 0.88 to 1.38 of their width as
  the steps climb. When the avatar leaves a marker the light, fog and openness ease to the next stretch over about a second and
  a half, with a short surge of light. The walls change spatially too: the rings within a few units past a marker blend into
  the next stretch's width. Side passages share one violet look. **(choice)** Neighbouring rows still never touch, and the test
  now measures that with the walls at their widest.
- **The words are in the scene, and so are the choices.** A step's name and its prompt are drawn on a canvas and hung in the
  cave as a sprite that faces the camera, above the marker ahead (while walking it slides along the path ahead of the avatar,
  so the player reads the next step as they go). It is drawn at a constant size on the screen, about nine tenths of the width
  of a phone, with 20 px words and a 30 px name at 390 by 844. The choices ("Go on", "This step won't go further", Skip, the
  five places' buttons) are a small translucent card that hangs under the marker's projected position; it is not a bottom sheet
  and nothing docks to the bottom while walking. The same holds in the side passages: the place name and its question are in
  the scene and its choices float by the place. The doorway's charge and feeling pages, and the path between places, keep the
  bottom panel as they were. The same words are also kept as page text that a screen reader hears. **(choice)** In the
  pool place the element stands farther ahead of the marker, so the card never covers it.

Tests: `cave-test.mjs` keeps its earlier checks (updated where the interface moved) and adds checks for the points above:
no bottom panel while walking and at a marker, the sign's words, position and type size, a distinct light and fog for each
stretch with the walls opening, the jointed limbs swinging against each other, a stretch taking one 10 s breath at normal
speed with 8 footfalls in the inhale and 12 in the exhale, the pause on letting go, the breath numbers matching `game.jsx`,
and the iOS guards.

## The loop rebuild (10 October 2026, after Wendell's playtest notes)

His words: "The loop should be 1) Choose 2) talk the bath while breathing 3) Choose another option 4) See the scene change in
response to choice." Also: the text was not visible through the whole walk, the cave was narrow with major segments, side
paths should loop back onto the path they branch from (playtesters), the six game masters should give branch paths, and "the
daemon stands aside even when you say the daemon doesn't stand aside".

- **The choice opens the way.** Past each marker the next stretch stays gathered shut (its walls at half width) and keeps the
  old light until the player chooses. Go on opens it: the walls widen over about a second and a half, the light turns to the
  stretch's own, and a surge runs through. Naming the feeling at the doorway opens the first stretch the same way. Nothing
  changes on a timer.
- **The pane and the modal.** The words are a small pane that sits above the figure's head and follows it on the screen the
  whole walk (15 px type at 390 by 844). At a stop it grows into the modal, high on the screen so the figure and the way ahead
  stay in sight, holding every choice the stop needs. "Look around" folds it back to the pane; tapping the pane opens it again.
  The sprite sign and the floating card are gone. The doorway pages keep the bottom panel.
- **A wider, continuous cave.** The chamber's half-width is 6 (was 4.4) and the charges spread less (tightness 0.78, strength
  1.2). The walls are one surface swept along the path, a ring every unit with rock bumps that flow along it, in place of the
  kit's instanced rings; openness blends over 8 units past a marker. Rows sit far enough apart that walls never meet opened
  wide and breathing in.
- **Side paths loop back.** A block opens two openings in the wall, out and back, with a lantern between them. The side path
  ramps 10 units down under the cave, swings round a wide loop holding the five places, climbs back and ends on the exact spot
  it left from. Release walks the last of the loop up onto that spot. The loop stays after the player comes back round. A
  block inside a side path loops 10 units deeper again. Skip still jumps back to the main path with a fade.
- **The daemon is a wall.** "Not yet" no longer lets the player on: the stop has no Continue, holding does not walk past it,
  and the daemon's encounter is offered: "Work what it holds", a loop of its own from the daemon's spot (the game's rule, "If a
  block won't release, you dig deeper into what's holding it", `game.jsx` line 3380). Coming back round, the daemon is asked
  again; only Yes opens the way. Skip stays (board `cave-block-branch`: every block offers a skip). The scan saves the
  encounter as `step>daemon`. Board row `cave-daemon-encounter` asks whether the encounter should instead be the spirit rite of
  `ds-intersect`.
- **Each face opens a branch.** The gate is six stops, one per stone. Each stone opens its own short level loop out of the
  wall beside it; walking it, the pane holds that face's question (`game.jsx` precisionQuestions), and at its end the face asks
  it; Back to the ring walks the player round onto the stone's spot, lights the stone and walks on. All six are walked before
  the way out. **(choice)** One face's loop is put away when the next opens, so neighbouring loops never cross. Board row
  `cave-face-branches` holds this as a position.

Tests: `cave-test.mjs` (87 checks) adds the shut stretch that opens only on the choice, the pane above the head through the
whole walk, the modal and its choices, the continuous tunnel and width, the loop that starts and ends on the branch point and
runs under the cave, the two openings and the lantern, the daemon wall, the dig and the second asking, the six face branches,
the camera staying inside the tunnel, and the saved scan.

## No skip at a daemon, and the 3-2-1 (board of 10 October, 02:01)

Ledger `2026-10-10-pull-020047.json`. `cave-daemon-wall` was overruled: "We shouldn't have a skip. If a daemon pops up
then it needs to be worked with. We can pivot to a 321 discussion with the part until it feels satisfied."
`cave-daemon-encounter` was answered "Dig into what it holds", which is already built.

- **No skip at the daemon.** The daemon's stop never offers Skip. Inside any loop opened while a daemon still stands in
  the way (its own dig loop, or a block deeper in it), Skip is gone too. Elsewhere a block keeps its skip
  (`cave-block-branch`) until a daemon shows up **(choice)**.
- **The 3-2-1 with the daemon, as a chat (10 October, 23:14).** Wendell: "we need to actually have an in game interface of
  the 321. At the very least pulling in the version from bars engine with the chat interface". Talk with it now runs the
  chat from bars-engine's `Clean321Flow` (the NOW page), ported as plain JS in `cave.js`: a charge reading from 0 to 10
  before; one thread the player writes entirely, the system never writing a turn; 3 Face it, "it", one voice; 2 Talk to it,
  two voices with a switcher (You, and the daemon named); 1 Be it, "I am"; a charge reading after. Then the pane asks
  whether the daemon feels satisfied. Yes, and it steps to the wall; "Not yet, another round" keeps the thread, starts again
  at 3 with the new reading as the next "before", and counts the round in the title. The chat sits in the modal; the text
  box keeps focus after each line.
- **Staged (board `cave-321-form` = staged, 10 October).** The chat above runs inside a staged scene; each step is a place, and
  one line under the step names where the player stands. Face it: the figure and the daemon across the chamber. Talk to it:
  the figure walks to face it, and the voice switcher swings the camera from over the player's shoulder to over the daemon's.
  Be it: the figure walks to where the daemon stood, turns, and the camera looks back down the passage while the daemon
  stands in the player's place. After: a step back to the player's own place. "Step back" is on every step and returns to the
  far place and pauses, keeping the words; "Go back in" resumes the same step. With the Damaged Self, before Be it the cave
  asks: continue, rest, or go back up. The player writes every line; the daemon's figure moves and never speaks. Not built:
  the on-device charge/seconds/"I" counts of the 17 October test.
- **From Wendell's play on his phone (10 October, 23:39).** Built: the element beside the pool stays out of the scene until the
  player names one; "I don't know" is offered at the doorway and at the pool and keeps it hidden; naming one lights the
  passage in its colour and scatters small ones along both walls. Built (10 October, 23:50): "Game master gates are forks in the path and should probably be at the beginning not the end.
  Eventually they will have different 'games' to offer as the players walk down the paths so seeing them this way at the end is a
  bad user experience." The six stones now stand at the start of the side passage (stops 0 to 5), then the mouth, the pool and
  the daemon (stops 6 to 8), then the way out. Step numbers follow: 1 Game masters' gate, 2 Sensation, 3 Element, 4 Daemon. The
  way on from the first stone waits for its branch, as it did at the end **(choice)**: every branch is walked before the
  sensation, and each is a place the games can later live.
- **(choice)** The written words stay on the page and are not saved with the scan.

## The stone (13 October 2026)

Wendell, 2026-10-13, on the J1 chamber: "ok this is perfection. Let's incorporate what we've made so far into the cave games".
The cave now wears the chamber's three textures. `bake_tiles.py` bakes them from the same shader nodes as `chamber.py`
(now shared in `textures.py`) as seamless 512 px tiles in `textures/` (120 KB together): each point is taken on a torus
in 4D, so a tile meets itself with no seam. In `cave.js`, `stoneOf` makes one set per charge colour: wet stone on the
tunnel walls, dry stone on the floor, crystal vein (its veins glow) on the stone spires and the crystals' rock beds. The tiles
are neutral grey and the charge's wall colour tints them, so tightness, tension, numbness, strength and something else keep
their colours. The crystals are unchanged. The tube carries UVs (along the path and round the profile, one tile per 3.2
chamber units) and one extra column so the tiles wrap. If a tile does not load, its stone is a plain colour, as before.
**(choice)** the tile size and how much each tint is lifted to make up for the grey (`TILE_UNITS`, `STONE` in `cave.js`).

**Growing from the stone (13 October 2026, after his first play).** Wendell: "the placement of the elements need to feel a
lot more matural incuding having the elements comes out of the wall in various ways"; "Also the root elements are unpside
down"; "The rock spires need do have stochastic sizes- stalagtite and stalagmites". The tube now carries mounts: a point on
its surface (along the path and round the profile) whose piece stands on the stone's inward normal, tipped and turned a
little, and moves with the walls as they breathe. Five zones round the profile: the floor's edge, the low, middle and high
wall, and the roof. Crystals come in veins of one to three in any zone (smaller up the wall); spires stand from the floor's
edge or hang from the roof as stalactites, each its own length (most short, a few long) and girth; caps grow in clumps on the
floor's edge and the wall like shelf fungus; roots hang thick end into the roof. The small elements a named feeling scatters
grow the same way: fire and stone at the foot and low wall, water pools at the foot, the young tree leans out of the wall,
metal anywhere. **(choice)** the zones, the size ranges (`ZONES`, `ZONE_SIZE`, `SPIRE`, `ELEMENT_ZONES` in `cave.js`).

**Each charge its own cave, the light the figure's own, wood as roots and grass (13 October 2026).** Wendell: "Strength,
constriction, strength and numbness should have different cave shapes. I'm almost tempted to have the numbness not even
have a cave structure but a blackness"; "the wood elements shouldn't be underground trees thats foolish, but roots and bushes
and grass makes a lot more sense"; "fog of war from a lighting standpoint. You can't see into the full cave. The avaiable
lighting centers around the character and any spirits that are following them". `CAVE_SHAPE` gives each charge a profile:
tightness a squeezed slot whose walls pinch in every six units, tension a tall angular cave of sharp cracked stone, strength a
wide high domed hall, something else the cave as it was. Numbness takes his temptation as the default **(choice)**: its walls
are not drawn, the floor is faint and only glowing things hang in the black. The figure carries the light (`LAMP`: reach 16,
falling off), the sky light is a trace and the far cave sinks into darkened fog; `carryLight` gives any following spirit its
own small light (this cave has none yet; the Big Mind cave's spirits will). Wood is a low bush with grass and a root.

## The WAVE room, first slice (11 October 2026)

The brief is the Next section of six-faces-council `council/callsheets/wave-room.md`; the pass is
`council/passes/6FACE_PASS_wave-room1_2026-10-11.md`. Wendell's words: "A player sits in a room with a door. When they welcome a
sensation the door opens and a 'charge' shows up." The room is the cave's home: the cave is where the player explores, the room
is where what turns up gets worked. It is `openRoom` in `cave.js`, on the same page as the cave.

- **The scene, from the kit.** Four of the kit's wall rings stood upright and stacked make a round room under a low dome, with
  the kit's floor. A door in the far wall has the kit's portal arch over it and light behind it. The seat is a gate stone,
  squat. The player's faceless figure sits on it facing the door, at about 0.6 of the cave's size so it stands under the door
  **(choice)**, in a plain stone colour because the charge has come out of it **(choice)**. The cave's breath (4 s in, 6 s out)
  eases the walls and the light, and Calm stills it.
- **Two ways in** (`wave-room-cave-link` = both). On the cave's front page, "Sit in the WAVE room" opens the body map; the place
  tapped is where the charge is, and the room opens. At a daemon's stop in the cave, "Take it home" sits beside "Talk with it"
  and "Work what it holds". It leaves a lantern at the spot, the cave rests, and the room opens with the charge's texture and
  element already known (`wave-reveal`: a charge from a block starts with its feeling known). When the room is done, "Back to the
  lantern" brings the cave back with the figure where it stood, and the daemon is asked again whether it feels satisfied. Only
  Yes opens the way **(choice)**: the charge was worked, in another place.
- **The flow is a table** (`ROOM_STEPS`, as `STRETCHES` is): Welcome, Witness, Acknowledge, Allow, Accept, Appreciate,
  Validate, then the fork. The words are `WAVE` (game.jsx lines 1092-1108); Witness is the room's own step, "Feel into it. Where
  is it in your body, and what is it like?" **(choice of words)**. Each step takes the cave's `STEP_LOOK` light for its W.A.V.E.
  step, so the room warms and brightens as the steps climb.
  - Welcome: "Welcome it", and the door opens on the next out-breath (at once when Calm is on). A grey shape comes in to the
    middle of the room at its own pace.
  - Witness: where it is (the place from the body map or the cave; "It's somewhere else" opens the body map again) and its
    texture, which the shape takes, by the avatar's charge table.
  - Acknowledge: a name the player writes and an element, with "I don't know". The shape takes the element's colour. Go on waits
    for both.
  - Allow and Accept: one page each. Appreciate has Not now, which moves on to Validate. Validate steadies the shape's
    light (it flickers until then).
  - The fork: the Exhale words, then "What do you actually want right now?" (`wave-room-goal` = asked in the moment; nothing
    stored), then whether the charge pushes the next move toward it or away (`wave-room-validate-first`).
- **Stays** (`wave-room-stay-move`): the cave's staged 3-2-1 chat, the same code (`talk321`, shared now), with a line on every
  step naming what the player wants. Face it from the seat; Talk to it standing face to face, the camera swinging with the voice;
  Be it standing where it stood while it sits in the seat; then back to the seat. It ends with one next move the player writes,
  and the charge takes a place in the room for the sitting.
- **Goes** (`wave-room-release`): a line to it if the player wants, and a name for the light it leaves. "Breathe out": the door
  opens on the out-breath, the charge drifts out over one exhale and a little more, a light in its colour with its name stays on
  the threshold for the sitting, and the door stays ajar. An unnamed light takes the charge's name **(choice)**.
- **Again** (`wave-room-parts-restart`): "Is anything still here that says it belongs?" Yes starts again at Welcome with a new,
  grey charge in the same place. From the third round on, the page also offers to rest it by the door with a lantern
  (`wave-room-stop`), which ends the sitting with the lantern and a small shape beside it.
- **Step back** is on every step from Witness on: the figure stands up and steps back behind the seat, the words are kept, and
  "Go back in" returns to the same step. In the 3-2-1 the chat's own Step back does the same.
- **The words stay on the page.** The player writes every line. The name, the goal, the 3-2-1, the move, the line and the
  light's name live only in the page's memory for the sitting.
- **For the test on 18 October.** After each branch the page asks "Did it leave, or did you get rid of it?" (It left, I got rid
  of it, and It stayed after the stays branch **(choice)**). The answer, the branch, the round and the sitting's start time are
  kept in this device's local storage under `oag:wave-room:test`; `__oagCave.roomTest()` reads them back.

Left for later: the daemon and alchemy extensions, which his phone play by 18 October gates.

Tests: `cave-test.mjs` adds Take it home from the daemon's stop (the lantern, the charge's feeling known, Witness already
answered, a goes round, back to the lantern with the figure where it stood, the daemon asked again with no skip) and the room on
its own from the body map: the seated figure and the shut door, the door waiting for the out-breath, every step in order, Not
now, Validate steadying, the fork asking the goal first, Step back, the stays branch through the staged 3-2-1 to a written move,
two goes rounds with named lights and the door ajar, the restart, the rest offer after round three, the three test answers kept
with their rounds, and storage holding only those answers.

## The WAVE room, second slice (11 October 2026)

Wendell's feedback after his first play of the room, 11 October 22:59, is quoted in the Next section of six-faces-council
`council/callsheets/wave-room.md`; the build takes the readings written there.

- **Talk to it switches by itself.** In 2 · Talk to it, each line sent hands the voice to the other side, and the camera swings
  with it ("Automatic switching in the 2 phase to show the perspective shifting is desired"). This is in `talk321`, so it holds
  in the room and at the cave's daemons alike. The voice buttons stay, to override.
- **At the daemon in the cave.** The narrower reading **(choice)**: the 3-2-1 switching, Allow's two sliders and the glow reach
  the daemon where it stands. The sliders sit on the 3-2-1's first page, under the charge reading ("Allow it: let it be as big
  and as bright as it is"); the daemon grows a little by itself once the talk starts. The whole room flow run in place at the
  daemon is not built: the room is its own scene, so running it in the cave means a second room inside the tunnel. "Take it
  home" still carries the charge to the room.
- **The door slides into the wall.** It no longer swings into the room; it slides sideways behind the wall, so nothing sweeps
  the floor the charge comes in on ("Put it it to the side is desired").
- **Allow grows it.** At Allow the creature grows a little by itself (×1.3), and two sliders say how large it gets (up to ×2) and
  how bright its colour can get (`ALLOW_GROW`, `ALLOW_BRIGHT`). The brightness is a ceiling; the charge fills it.
- **Intensity shows** (`buildAura`, `stepAura`). A halo and sparks in the creature's colour, brighter as its charge rises and
  duller as it is worked: the 3-2-1's readings set the charge (before while it is worked, after once given), Validate dulls it,
  and being kept dulls it again; a daemon dulls once it stands aside. The same aura is on the room's creatures and the cave's
  daemons.
- **Up to three at once.** On every step from Witness to Validate, "What else is here?" can bring in something new: the door
  opens on the out-breath and it comes to a place of its own (the middle, the left, the right), and the player works it now.
  "Working with:" on the page picks which one is worked; each keeps its own step. A fourth waits at the door, and is welcomed
  once the room is clear **(choice)**. When one is worked through, the next one in the room is worked, where it was left; the
  round ends only when the room is empty.
- **Emotions about emotions.** "What else is here?" first asks whether it is about one already in the room. If so it is a layer
  on that creature: a ring in its own colour, with the name the player writes, flickering until it is validated with that
  creature. Validate names it. If that creature is validated already, the layer is validated with it at once **(choice)**. Only
  "Something new" brings in a creature of its own.
- Kept: the player writes every line, words stay on the page, the 18 October question after each creature's branch, the test at
  390 by 844.

Tests: `cave-test.mjs` adds the daemon's sliders, its growth and its glow dulling round to round and once it stands aside; the
voice handing over by itself in the cave and in the room, with the camera; the door sliding clear; and a second sitting with
three creatures: something new to its own place, the focus row, Allow growing by itself and by slider, brightness up and down, a
feeling about the second as a named ring with no new creature, a fourth waiting at the door, picking the second again at its
step, Validate steadying it and its layer and dulling the glow, then each worked through in turn and the waiting one welcomed.

### A style for each face's branch (11 October 2026, after his phone play)

Wendell, from the preview: "Branches are going wild. The screen should give you a dropdown that styles the branch they are on
with the style and vibes of the branch they choose."

- Each face's branch now opens in that face's own look (`FACE_LOOK`): walls in a shade of its stone colour, its light and fog,
  and motes drifting in its light, still for Amber and restless for Red **(choice of each look)**. Before, every face's branch
  shared the side passage's violet hush and its walls.
- While the player walks a face's branch, a dropdown on the screen ("Teal · wide and moving") dresses the branch in any face's
  look. It starts on the branch's own face and hides while a page is open and on the way back to the stone.
- The two glowing openings fade while the player is inside the loop, because the loop is tight and they filled the view.

## One map: the WAVE room and the Big Mind cave come onto the stone (13 October 2026)

Wendell, 2026-10-13, in the cave textures thread: "Also we need to import the WAVE process into this map. I think we're almost
to the point where we can merge the bigmind cave and this cave". This build is the first half: everything the two caves share
now runs on this map, and the Big Mind cave wears it.

- **One branch.** The WAVE room (first and second slices), the Big Mind cave (step 1, the two charges, the sit-down and its
  spirits) and this cave's stone, shapes and carried light are merged into one branch, so the two caves stop drifting apart.
  A face's branch now wears the stone too, tinted to the face's rock, and the style dropdown eases the stone's tint.
- **Sit down, here.** A Sit down button, bottom left, is there the whole walk. It runs the WAVE room's steps in place
  (`ROOM_STEPS`, `talk321`, Allow's sliders), the way the Big Mind cave's sit-down does (`bms-sit-anywhere`, `bms-in-place`):
  a grey shape comes along the path from ahead, takes its texture's colour at Witness and its element's at Acknowledge,
  grows with Allow and steadies at Validate. A breathing ring sits on every step. The game names each charge (two words,
  such as Small Drum); the player can name it at Acknowledge or Validate. Toward at the fork runs the 3-2-1 and asks for one
  next move; Away breathes it out. Whatever page was up (a stop, a daemon's question) is put aside and comes back when the
  player stands. Standing up, partway or at the end, leaves a spirit (`bms-away-lighter`). The full room, with its door and
  up to three creatures, is still reached by Take it home and from the body map.
- **The spirits carry light.** Every spirit that walks with the figure carries a small light in its colour (`carryLight`),
  in this cave and in the Big Mind cave, so the lit circle grows with what the player brings. A spirit let go takes its
  light with it.
- **The Big Mind cave's stone.** Its tunnel is the same J1 stone (`stoneOf`, `tileStone` in the kit), in its own violet-grey.
  Its lighting is unchanged for now: the Protector's chamber keeps its blue light.

**Still to do for the merge:** where the Big Mind cave's chambers sit in this map. It is on the board as `merge-layout`.
