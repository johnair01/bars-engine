# Tasks: Blender pipeline test plan

## The plan (this thread, 2026-10-13)

- [x] [claude] Read the call sheet, the hardening kit, the cave-studio kit, the README, #285's diff and the manifest.
- [x] [claude] Write spec.md (the tests, tiers, kill lines, fixtures, the score trap) and plan.md (files, order, CI).
- [x] [claude] Reach test on every fork: none reach Wendell. Each stands as a council position in spec.md.
- [x] [claude] Found on reading the code, recorded as known-gap tests: G2 (a sidecar with no `license` key crashes
  instead of stopping cleanly) and G2b (`build_viewer.py --allow-restricted` lets a Royalty Free model into a page,
  against `cs-cc0-or-own`). Neither is fixed here.

## Before the build (build thread, 2026-10-13)

- [x] [claude] Falsify: R2 twice. #285 had merged, so it ran on main. `cave-kit.glb` and `spots.json` came out byte for
  byte the same as committed, both runs. The exact-bytes tier stands for the kit.
- [x] [claude] #285 merged; everything ran against main.
- [ ] [claude] Read the Painted Wooden Chair 02 id from its sidecar into `fixtures.json`. Blocked: this environment's
  network refused Blendkit (N4), and no sidecar is in the repo. A4 pins it on the first run that reaches Blendkit.

## Build

- [x] [claude] 1. Offline tier: G1, G2, G2b, G6, G7, and the CI step. G2 and G2b marked known gaps.
- [x] [claude] 2. Raised G2 and G2b on the board as positions `bpt-licence-stop` and `bpt-no-restricted-flag`; both
  stood (board read 0107). Fixed in `build_viewer.py`: a sidecar with no licence stops with a STOP: line, and
  `--allow-restricted` is gone. G2 and G2b are no longer gaps. `bpt-root-curl` (P3, P5) waits for the cave-studio strand.
- [x] [claude] 3. `bpy` tier: G3, R1 to R3, W1 to W4. `walk_keys.json` committed after the walk frames were looked at.
  G4 and G5 skip: they need the dining table, and Blendkit is unreachable here.
- [x] [claude] 4. Contact sheet, `LOOKED.md`, first look written.
- [~] [claude] 5. Network tier: V1, A1, N4 ran. N1, N2, A2 to A4 and N5 skip until a session can reach Blendkit.
- [x] [claude] 6. P1 to P6, dressing pieces on the sheet.

## Results of the first full run (2026-10-13, main at fd3ce02)

```
pass: G1 G6 G7 R1 R2 R3 G3 W1 W2 W3 W4 P1 P2 E1 E2 V1 A1 P6
known gap: G2 (no-licence sidecar crashes on KeyError), G2b (--allow-restricted), P3 (root_curl in 2 pieces),
           P4 (7 prisms, floor 6), P5 (root_curl 682 faces, budget 500)
fail: N4 (api.blenderkit.com, assets.blenderkit.com and cdn.jsdelivr.net refused by this environment's network)
skipped: G4, G5, N1, N2, A2, A3, A4, N5 (each needs Blendkit)
offline + bpy: 41 s. P6 (cave-test.mjs, 126 checks) needs npm packages, so it sits in the net tier: 200 s the first time.
```

Two findings the plan did not expect, both in `root_curl`, both already in the committed `cave-kit.glb`: the
inflated curl has a 10-vertex blob separate from the 395-vertex body (seen on the sheet at the hook's tip), and it has
682 faces against its 500 budget. Both are in `from_picture.py`, which the cave-studio strand owns (#289 open), so
they are excused for `root_curl` only and go to the board as positions.

Fixed 2026-10-13 by the cave-studio strand (#289, `bpt-root-curl`): inflate mode keeps only the largest connected piece,
and `fit` decimates again until the face count fits. root_curl is one piece at 499 faces, outline match 0.885 (was
0.89, within P1's 0.01). The crystals' rock bed and every other piece are unchanged. P3 and P5 are hard tests again.

Corrections to spec.md found while building: W1's figure has 72 triangles (six boxes); the 1,318 was the whole
published scene with the chair. W3 compares a quarter with three quarters: at the half both thighs pass straight
down. A1 compresses the committed `figure.glb` when the table is not on disk, so it runs without Blendkit. G7's stub
replaces `urlopen` in a child process rather than listening on a port, since the hosts are fixed in the script. The
UDIM images for G3 are made at run time by `_make_fixtures.py`, so no `synthetic/` folder is committed.

## Part 2: words and pictures (added 2026-10-13 from his second message)

- [x] [claude] Plan T1 to T3 and J1 to J5 in spec.md; four positions on the board.
- [x] [claude] 7a. Recipe schema and builder; T1 to T3 with token numbers (#291). T2 missed, so the recipe is dropped
  and jobs edit `cave/chamber.py` (`bpt-recipe-result`).
- [x] [claude] 7b, J1 textures (#292), wired into the cave game (#294). Frame rate judged on his phone
  (`bpt-j1-frame-rate`).
- [x] [claude] 7b, J2 objects: boulder (Blendkit CC0), offering bowl (picture), cushion (script) in chamber.py
  through `cave/objects.py`; tests J2 and J2b pass (spec.md, J2 result).
- [ ] [claude] 7b, J3 picture to asset (needs his pictures in the Drive inbox).
- [x] [claude] 7c, J4 character creator: `cave/character.py`, nine figures, tests J4 and J4b pass (spec.md, J4 result).
  The sheet goes to his eye on Your steps.
- [x] [claude] 7c, J5 clothing: `cave/garments.py`, robe, sash (on the body and over the robe) and topknot on all nine
  figures; tests J5, J5b (bpy) and J5c (browser swap) pass (spec.md, J5 result). The sheet goes to his eye on Your steps.
  What came from root-game (`wendell-britt/root-game` `engine/kit_engine.js`, read at 81c327a, nothing there edited):
  - Reused as the method: the ring construction (rows of points round the body, a coarse count for the phone), the A-line
    that flares toward the hem, folds that deepen toward the hem (`fold()`), side slits where the robe parts over the
    legs (`slitColumns`), the band built on the torso plus a little for the cloth, and the crossed collar worn left over
    right (`onCollar`, here J4's `collar_path`).
  - Ported as a rule: hanging cloth rides the pelvis, not the legs (`skirtWeights`); the fullness rule (a hanging garment
    is cut for the stride, not for standing), here found by walking (`fit()`).
  - Set aside: the spring bones and cloth solver (`stepFight`, the shared cloth pass, the squash between two fighters'
    legs). On an emulated phone the cloth step alone takes 35 to 40 ms a frame (root-game HANDOFF.md), more than a
    frame, and its hard problems are two fighters pressing together, which the cave does not have. Two hem bones take
    its place (spec.md, J5: "a few extra bones in its hem first").
  - Set aside: Root's hem heights (raised to 0.40 m for its low stance; the cave figure walks upright, so the hem is
    at 0.15 m) and its ANSUR body rows (the cave figure is J4's stylized body, measured directly).

- [x] [claude] 7c, J5 round 5, the skirt as cloth (board position `j5-skirt-cloth`): `cave/cloth.js` (the game's
  cloth, `CaveCloth.attach` for three.js), `cave/cloth_walk.mjs` (the same cloth over the walk for Blender), the robe
  GLB's `_CLOTH` and capsules; tests J5, J5b (with `--no-legs`) and J5d (`j5_cloth.mjs`). Root-game's cloth solver,
  set aside in round 1 as too slow for a phone, is replaced by a smaller one: only the skirt below the belt, about 560
  points, about 1 ms a figure per frame in the cloud browser.
- [ ] [claude] Wire the figures, the garments and cloth.js into `cave.js` together (inline cloth.js before cave.js in
  `scripts/build-ontology-game.mjs`; `CaveCloth.attach(THREE, robeMesh)` once the robe is bound to the avatar's bones,
  then `update(dt)` each frame after the pose and `updateMatrixWorld`, `reset()` after a jump).

## Steps only Wendell can take

- [ ] [wendell] N3 is `cave-studio-02`, already on Your steps.
- [ ] [wendell] E3, after the first republish (the build thread writes the step then, with both links).
- [ ] [wendell] J5(d), the clothing sheet (the J5 thread writes the step, with the file's location).

## Verify and ship

- [x] [claude] Offline and `bpy` tiers pass on main in one run (known gaps reported); summary above.
- [ ] [claude] Definition of done in spec.md checked.
- [ ] [claude] Ledger record written; call sheet updated.
