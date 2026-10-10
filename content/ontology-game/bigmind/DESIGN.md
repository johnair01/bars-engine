# The Big Mind cave: a fork of the Cave of Lessons

Wendell's steer on the board of 10 October 2026, 20:19 (`bm-phone-first`, overruled): "I want it to be a fork of cave of
lessons that adds chambers between cave hallways with a voice blocking the path". The full brief is sprout
`campaigns/big-mind/build-brief.md` (sprout #37); the board answers are in six-faces-council
`council/ledger/2026-10-10-pull-201920.json`.

This is step 1 of the brief's order of work: the cave mouth, one chamber (the Protector) and the hallway past it. It is
the falsification test. If Wendell does not catch a second voice speaking or feel the chamber work, the next six wait.

## How it is a fork

- **One engine, two caves.** `cave/cave.js` now exports its pieces as `window.__oagCave.kit`: the route, the tunnel, the
  pebbles, the lantern, the faceless avatar and its walk, the daemon body, the breath and the page guards. `bigmind.js`
  builds its cave from those, so a fix to the engine reaches both caves. A page that only borrows the engine sets
  `window.__oagCaveNoStart` before loading `cave.js`, so the Cave of Lessons' doorway stays shut there.
- **No kit file.** The Big Mind cave needs three.js only. It does not load `cave-kit.glb` or `spots.json`.
- **The page** is `/ontology-game/big-mind` on the same site, built by `scripts/build-ontology-game.mjs` **(choice)**.

## The walk

1. **The cave mouth** is one screen of the rules from the workshop's opening: sit out any question or voice, take control
   back with the Self button at any time, walk back up whenever you like. It says this is a game, not therapy, and gives
   a crisis line (988 in the US, findahelpline.com elsewhere) **(choice: which line)**. It says nothing leaves the device.
   When something has been kept, the mouth lists it, with Forget per voice and Delete everything (`bmc-safety`).
2. **The first hallway.** Hold anywhere to walk; let go to stop. The walls breathe with the Cave of Lessons' breath
   (4 s in, 6 s out).
3. **The Protector's chamber.** The tunnel widens to almost twice its width, lit blue. The Protector (the daemon body in
   its own colour, carrying its shield, taller than the player) stands in the middle and blocks the way. The way past it
   stays gathered shut.
4. **The ask.** The guide, unnamed, asks "May I speak to the Protector?" Yes or Not now.
5. **The seat shift.** Yes walks the player into the voice's place. The voice fades as the player enters it, the player
   takes its colour, and a faint figure of the self stays where the player stood. The player turns to face the way they
   came and the camera looks over their shoulder at the self, which is the way the Protector keeps watch **(choice)**.
6. **Three questions**, in the workshop's order: its job, what it protects the self from, how it is thanked. Each offers
   the group's own answers as cards and an open line for the player's words (`bm-cards-and-line`). The second question
   takes several cards. Any question can be sat out.
7. **Secretly speaking** (`bm-dismiss-step-aside`). Some cards are answers another part would give: one about the
   Protector instead of as it (the self's ideas), one in the Fixer's job, one in the Controller's, one in the Skeptic's
   **(choice: which cards)**. The open line is heard for the same tells with a plain word list **(choice)**, and the player
   can always tap "This doesn't sound like the Protector". Any of these brings a second figure out behind the voice. The
   guide names the tell, the player names who spoke (the self's ideas, the Fixer, the Controller, the Skeptic, or not
   sure), thanks it and asks it to wait. It walks on ahead and waits by the wall of the next hallway. The Protector is
   asked again.
8. **Stepping back out.** The guide thanks the voice; the player walks back to the self's place, and the Protector comes
   back and steps to the wall.
9. **Keeping.** The lines the Protector spoke are listed; the player taps the ones to keep. Only those are saved
   (`bm-cards-and-line`).
10. **The way opens.** The walls past the chamber widen and the light surges, as in the Cave of Lessons.
11. **The second hallway.** The parts that were asked to wait stand by the wall; walking past one shows that it waits for
    its own turn. The hallway ends at the Controller, standing in the shut mouth of the next chamber, which says it opens
    in the next build. Walk back up, or rest.

**Declining** (`bm-decline`) is a full move. The Protector steps to the wall and waits, the way opens, and the save marks
it waiting. Nothing is marked skipped. Sitting out every question does the same.

## Saving

At every chamber (`bm-session`, own pace), in `localStorage` under `oag.bigmind.v1`, on this device only
(`bm-first-player`). The record is a seed: per voice its status (`spoken` or `waiting`), the kept lines and when; the parts
waiting; and where to come back in. It spawns no world (`bm-world-later`). Coming back to the mouth offers to go back in
past the Protector.

## Words

The questions and cards paraphrase the workshop transcript, 00:22 to 00:35, with no line quoted longer than one line and
no teacher or programme named (`bm-name-internal`). The cards are the group's answers: attack, danger from anywhere,
pain, shame, looking bad, risk, uncertainty, loss, losing control, too much excitement, other people, itself; for its
thanks, hardly any, the self calls it a prison, unfair, devalued, a full-time job.

## Not in this build

The other six guardian chambers, the check-ins before the Damaged Self and the centre, and the centre itself (the
Vulnerable Child and the player self, where the guide is revealed as the player's own integrated voice, `bm-guide`). The
parts asked to wait come back in later chambers; here they only wait in the hallway.

## Tests

`bigmind-test.mjs`, 55 checks at 390 by 844: the mouth and its rules, walking by holding, the chamber widened and the way
shut, the ask, the Self button, the seat shift, out-of-voice cards and open lines bringing the second figure out, naming
and thanking it, the voice asked again, in-voice lines not flagged, stepping back out, only kept lines saved, the way
opening, the waiting part in the next hallway, the next chamber shut, walking back up, resuming past the Protector,
forgetting, declining, deleting everything, and the Cave of Lessons still opening on its own page. Build with
`npm run build:ontology-game`, then run it from a folder with playwright and three@0.128.0:
`OAG_PUBLIC=/path/to/bars-engine/public OAG_SHOTS=/some/dir node bigmind-test.mjs`.
