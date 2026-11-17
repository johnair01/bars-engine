# Contact and reference-scale measurements, 2026-11-17 (before any cloth change)

Status: measurement and two verified fixes. **No cloth method is chosen. No visual approval is given or implied.** Wendell
reviews the sheets in this folder first (T007).

## Reproduce

Source: PR #718 branch `codex/robe-motion-gates-20261111` at `72b646f8`, plus this change. All of it runs in the cloud
environment (Chromium with SwiftShader), not on the Mac and not in GitHub Actions.

```
python3 tools/blender-cloud/tests/motion_lab_server.py          # http://127.0.0.1:8767
# Playwright must resolve next to the script (copy motion_measure.mjs beside a Playwright install)
MOTION_OUT=/tmp/m node motion_measure.mjs                                   # all 14 cells, numbers only (~4 min)
MOTION_SHOTS=1 MOTION_SHOTS_ONLY=1 MOTION_OUT=/tmp/a node motion_measure.mjs   # fixed-camera frames, 10 cells
MOTION_QUERY='?legacy=1' ...                                                # the same, with the old contact code
```

- Cells: both bases (`f` 1.66 m default, `m` 1.75 m default) x slight and broad at 1.50 and 1.95 m, and average at 1.50,
  its default and 1.95 m (14 cells). Frames are shot for the spec's cheap matrix (slight 1.50, slight 1.95, average default,
  broad 1.50, broad 1.95) on both bases.
- Outfit B2, controls at their defaults (speed 1, stride 1, arm 1, lean 1.6, clearance .5, compression 1, lift 1, jump 1).
- Clip phases. Run (`pose`, 0.64 s loop): strike 0, compression .09, toe-off .20, flight .35, then the same on the other foot
  at .50 .59 .70 .85. Jump (seconds): grounded 0, preload .18, takeoff .28, apex .58, descent .86, landing .96, recovered
  1.12. Walk (1.2 s): .00 .25 .50 .75. Walk is measured but untouched.
- Camera: the lab's own (fov 25, 7.2 m back when the orange reference is shown, target 0.92 m up, yaw 0, pitch .03, zoom 1),
  side view, canvas 520x612. For jump frames only, `follow` keeps the target on the figure's forward travel.
- Measurement: `public/between/cult/motion-measure.js` reads the lab's own pose through `window.__motionLabControl`.
  Ground is world y = 0. "Sole" is the lowest vertex of the visible boots (body where a build has none). Every value is
  stored in metres (`...M`) and as a fraction of the built stature (`...H`). `robeInsideBody` counts robe vertices whose
  nearest body vertex (within 6 cm) lies on the far side of its outward normal by more than 4 mm. It is an
  approximation, the same on every cell, and not a mesh-against-mesh test.
- Raw results: `baseline-motion-measure.json` (code before the fixes), `after-motion-measure.json`.

## What the baseline showed

| Finding | Baseline | Unit |
|---|---|---|
| Jump grounded, landing and recovered poses stand **below** the ground | boots 3.4 cm (1.50 m) to 5.3 cm (1.95 m) under y = 0; preload and landing 2.1 to 4.7 cm under | 2.2 to 2.7 % of height |
| Run foot strike and compression float | 1.3 to 2.5 cm above ground | 0.9 to 1.7 % of height |
| Orange reference never changes size | run/walk rig scale 1 and jump rig .05 on every body; the needed scale is 0.84 (1.50 m) to 1.10 (1.95 m) by leg length | factor |
| Orange reference floats | lowest bone at run strike 13.4 cm above ground on every body | 8.1 % of height at 1.66 m |
| Knee gap, ankle gap, hip height | identical across slight/average/broad at one height (they come from bones, and the builds change the surface only) | the builds differ only in `robeInsideBody` |
| Robe against body | up to 196 robe vertices inside the body at jump landing (m broad 1.95), deepest 5.8 cm | 3.0 % of height |
| World-metre motion | run flight lift .09 m and jump apex .54 m on every height: apex is .361 of height at 1.50 m and .278 at 1.95 m | not body-relative |
| Walk forward-left frame | boots 2.4 to 3.5 cm under ground at the swing frame; walk numbers are unchanged by this change | left alone on purpose |

## What changed

1. Contact solve (`motion-lab.js`). The lowest boot vertex is put on y = 0 through run stance and landing (weight 1, faded
   over half-cycle phase .30 to .44 out and .84 to 1.00 in) and through the jump's grounded, preload (to t = .26, faded by
   .30) and landing and recovery (faded from .90 to .96) phases. Flight keeps the authored lift. Walk code is untouched.
2. Reference scale and floor (`fitReferences`). Each orange rig is scaled by the figure's hip-knee-ankle length over its own,
   then lifted so its lowest toe joint over the cycle sits at the figure's standing ball-joint height.
3. `?legacy=1` restores the old behaviour for "before" frames.

## After (all 14 cells)

| Measure | Before | After |
|---|---|---|
| Sole against ground at run strike/compression and jump grounded/preload/landing/recovered | -5.3 to +3.4 cm | 0.000 m on every cell |
| Reference leg length against figure leg length | 0.84 to 1.10 | 1.000 |
| Reference lowest bone at run strike | 13.4 cm on every body | 11.0 cm (1.50 m) to 14.9 cm (1.95 m, m); its lowest toe over the whole cycle equals the figure's standing ball joint, by construction |
| Reference hip height / figure hip height (run strike, 1.95 m) | .49 / .53 | .537 / .518 |
| Walk, all values and sweep | as measured | identical |
| Run frame-to-frame step, hips (largest of 96 / median) | .0088 / .0034 of height | .0134 / .0036 |
| Run frame-to-frame step, lowest point (largest / median) | .0107 / .0048 | .0153 / .0046 |
| Jump frame-to-frame step, hips (largest) | .0993 | .0658 |
| Run gates in `motion_review_capture.mjs` (compression lower than strike by .02 m, flight higher by .06 m, loop within .02 m) | pass | rootUp -.030, -.057, +.090, -.035 m: pass; the full capture script ran clean on the changed code |

## Remaining failures and open points

- Run toe-off (phase .20) still stands 4.3 to 6.6 cm above ground: the retargeted foot leaves the ground by then, and I
  did not plant through it. Whether it should is a visual call.
- The largest run step grew from .9 % to 1.3 % of height because the planted foot now pulls the hips through the fade.
  Wendell has called the run "herky jerky"; this change must be watched on that note.
- Robe against body is unchanged (the cloth was not touched): 57 to 134 vertices inside at run compression, 83 to
  196 at jump landing, deepest 5.4 cm. Hem height at landing rose by 2 to 4 cm because the figure now stands on the ground.
- Run lift and jump apex are fixed world metres. A 1.95 m figure jumps .28 of its height, a 1.50 m figure .36. Which offsets
  should scale with stature is the plan's step 3 and is not decided here.
- The jump's flat-foot pose (`ankle` aimed along forward) reads long and paddle-like in the body-only jump frames. Not
  measured, only looked at.
- The shadow disc stays at the origin in jump frames; the figure travels away from it.
- Round body, cloth candidates and any visual approval remain open (T004, T005, T007).

## Files

- `compare-body-vs-robe-boundaries.jpg`: four boundary cells (f slight 1.50, f broad 1.95, m slight 1.95, m broad 1.50),
  body then robe, same frames: run strike, compression, flight, jump preload, apex, landing.
- `before-after-m-broad-1.95.jpg`, `before-after-f-slight-1.50.jpg`: legacy code against the fix, robe then body.

## Wendell's note, 2026-11-17 11:15 PT (not yet worked)

> "in general the running needs to have the models leaning forward more. This is how the mocap goes and the models don't match it"

Applies to every body and build, not one frame. Not measured yet. First step for the next session: compare the torso's
forward angle (hips to spine03, from vertical) in the orange CMU run against the figure at the eight run phases on every cell, in
degrees. The lab drives it through `retargetRunDirections` (`torso = targetDir('spine','spine.003', lean)`, control `lean`,
default 1.0; earlier saved notes used 1.6) and `motion.js` run keys carry a separate `lean` (.12 to .16 rad) for the authored clip.
Check which path the run view uses and whether the figure's torso bones follow the aim before raising the control.
