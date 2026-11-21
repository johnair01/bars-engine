# Result

Recipe `cultivation-locomotion`, ticket `cl-run-gait`: "The run reads as a run from the side."

Lane: DeepAI Code. Council ticket `cmwlaocoy000dubo5nwqbubvb` in the `deepai` lane (the freebuff lane closed the same
ticket without a check, because that machine has no browser).

## Changed

`public/sect/cult/cultwalk.js`, the `RUN` object only:

| knob | before | after |
|---|---|---|
| `RUN.lean` | 0.14 | -0.14 |
| `RUN.arm` | 1.6 | 2.0 |

**The lean.** The lean is applied as a rotation about the figure's left axis
(`setFromAxisAngle(lft, -RUN.lean * pc * st.amp)` in `cultwalk.js`), so a positive `RUN.lean` tipped the torso
*backwards*. Measured from the side over 70 frames of a full-pace run, the shoulders sat 8.2 degrees behind the hips; the
walk measures 0.3 degrees, so that 8 degrees was the run's own lean, and it pointed the wrong way. At `RUN.lean = -0.14`
the run leans forward 7.7 degrees, which is the "a little forward" the target asks for. The knob reads negative only
because the rotation takes the sign; the code could take the sign instead and the number stay positive.

**The arms.** `RUN.arm` multiplies the arm swing, so the run's arms swing harder than the walk's. Wrist travel along the
heading, measured over the same 70 frames: 0.271 m at the walk, 0.336 m at the run before this change, 0.412 m after, so
the run's arms now travel about 1.5 times the walk's.

Nothing else moved. `MOVE`, `CAM`, `step()`, the route, the figure's build, the bounds and every file outside
`public/sect/cult/cultwalk.js` are untouched.

## The check

The recipe's check, `(async()=>{await window.heaven.walking; return (await import('/sect/heaven/movecheck.js')).moveCheck()})()`,
whole result on this branch:

```json
{
 "breaks": [
  { "k": "camera inWall", "frames": 3, "first": [94.5, 26.7, 34.9] },
  { "k": "camera hidden", "frames": 3, "first": [94.5, 26.7, 34.9] }
 ],
 "scores": {
  "walk": 1.3, "walkSlide": 0, "run": 4.2, "runSlide": 0.014,
  "apex": 0.67, "air": 0.67, "feetUp": 0.79, "cameraFrames": 16948,
  "cam_inWall": 3, "cam_underGround": 0, "cam_hidden": 3, "cam_pop": 0
 },
 "level": [ { "leg": 146, "stuckAt": [3, -52.7], "to": [-2, -59.9] } ],
 "ok": false
}
```

The two breaks are the camera's, at the road bend, and they are not this ticket's: the untouched `main` gives exactly the
same two breaks and the same first frame, and round 30's published numbers are the same again. The camera frames belong
to ticket `cl-cam-road`, which is #836 on this repo and is not merged; this branch does not carry it.

With #836's camera fix applied on top of this branch, the same check comes back whole and clear:

```json
{ "breaks": [], "ok": true,
  "scores": { "walk": 1.3, "walkSlide": 0, "run": 4.2, "runSlide": 0.014, "apex": 0.67, "air": 0.67, "feetUp": 0.79,
              "cameraFrames": 16948, "cam_inWall": 0, "cam_underGround": 0, "cam_hidden": 0, "cam_pop": 0 } }
```

The only number this change moved in the check is `runSlide`: 0.021 on untouched `main`, 0.014 here (bound 0.08).

## The film

Three seconds of the run through the Heaven sect's great court, the camera four metres to the figure's side, thirty
frames a second, driven by the page's own `simulate(1/30)` with `heaven.manual` on. The film on the Council Board plays
at twelve frames a second, so the stride reads.

Measured over the last 70 frames of each film:

| | before | after |
|---|---|---|
| lean (shoulders against hips, along the heading) | -8.2 degrees (backwards) | +7.7 degrees (forwards) |
| arm swing, wrist travel along the heading | 0.336 m | 0.412 m |
| frames with both feet clear of the ground | 32.9% | 35.7% |

The flight was already there in round 30 and stays. The stance share is 0.36 of the cycle, so neither foot is on the
ground for the other 28% of each stride: about a seventh of a second at 4.2 m/s.

Pictures: the film, a still in mid-flight, the same stride before and after side by side, and one stride in nine frames,
all on the Council Board row for this ticket.

## Not checked

- `clipReport()` (report only) was not run. This ticket changes `RUN.lean` and `RUN.arm`, which the clip report does
  not read, but the report is the only thing that measures the bones' loop gaps, so they are still the round-30 numbers.
- The stair ticket (`cl-stair-run`) was not taken and the stair was not filmed. `MOVE.stairRun` is untouched.
- The film was rendered in software GL (Chromium with SwiftShader) at 800 by 450. A player with a graphics card sees the
  same code, not the same picture.
- The camera was not looked at as a film. This ticket does not touch it.
- The check was run twice on each side of the change on this machine and the numbers moved only in `runSlide`.

## Questions

- The lean knob now reads negative, because the code applies the rotation about the figure's left axis. Would you rather
  the code take the sign and the number stay positive? Nothing else depends on it.
