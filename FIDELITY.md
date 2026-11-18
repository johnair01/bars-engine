# The fidelity gate

The cultivator's walk and run, judged against the CMU capture the repo ships — in numbers, on every body size,
before anyone watches a film.

## Why

Wendell, answering the run look `cl-run-gait-look-1` on 2026-11-17:

> we have Mocap data for how a run is suppsoed to look. what I'm wondering is why aren't we able to assess the fidelity
> of the run with our own models. We need to be able to do this tuning automatically and it should only come to me after
> it's reviewed.

The capture is in the repo (`public/between/cult/reference-cmu-walk-run.glb`, baked for the cave player). The run is
already retargeted from it (`mocap-reference.js`, `retargetRunDirections`). The walk is not: the walk the game plays is
written by hand, twice (the Heaven sect's planted-feet gait in `public/sect/cult/cultwalk.js`, and the aimed-limb gait in
`public/between/cult/walker.js`). A hand walk has no yardstick, so it can only be judged by an eye. This is the yardstick.

## What it measures

The motion lab poses the orange capture rig beside the figure and poses both at the same frame, so the two are measured
in the same world at the same instant (`public/between/cult/motion-fidelity.js`). Six numbers decide whether a walk reads
as a walk, and each is checked against the capture measured on the same frame:

| check | the walk band | the run band |
| --- | --- | --- |
| the swing knee folds | at most 20 degrees straighter than the capture | same |
| the torso lean moves | at least 40% of the capture's lean range | same |
| the torso leans like the capture | mean lean within 6 degrees | within 4 degrees |
| the pelvis stays level | the hips move at most 1.8 times the capture | same |
| the foot lifts | 0.6 to 1.6 times the capture | same |
| the foot comes down near where it left | 0.7 to 1.4 times the capture | same |

The bands are relative, so the capture passes against itself, and a figure that matches the capture passes.

## Running it

A server serving this checkout's `public/` (`python3 -m http.server 8767` in `public/`), then:

```
MOTION_OUT=/tmp/motion-fidelity node tools/blender-cloud/tests/motion_fidelity.mjs
```

The runner walks the body matrix (f/m x slight/average/broad x 1.50/1.66/1.75/1.95), writes
`$MOTION_OUT/motion-fidelity.json`, prints the numbers for the first cell, and **exits 1 when any check on any cell
fails**. `MOTION_CELLS=first` measures one cell; `MOTION_MOTIONS=walk` picks the motions; `MOTION_SHOTS=1` saves a frame
per cell.

The rules themselves are tested without a browser:

```
node --test tools/blender-cloud/tests/motion_fidelity.test.mjs
```

## The baseline (2026-11-17)

The walk the game ships fails on every body size, on two checks:

- **the swing knee folds**: the figure folds to 145-177 degrees, the capture to 104 degrees. The leading leg is locked
  straight, which is what reads as the lunge.
- **the torso lean moves**: the figure's lean does not move at all (0 degrees of range), the capture's moves through
  4.5 degrees as the weight shifts.

The retargeted run passes four of six, and fails one on the flight: the run lifts the foot twice the capture's height
(0.33 m against 0.15 m), which is the float in the run's middle.

## Not checked

- The sect's planted-feet gait is not in the gate yet: the lab measures the Between's figure. The same rules and the
  same comparator take the sect's frames (the sect harness, `tools/gait.js` in the lane's scratch), so the gate can
  judge it without a second rule set.
- The run's speed and stride are not compared with the capture's: the game runs at 4.2 m/s where the capture runs at
  2.96 m/s, so the honest comparison is the capture time-scaled to the game's speed. The gate compares shapes today.
