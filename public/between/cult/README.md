# Cultivation characters, as the game loads them

A copy of the cultivation characters' review preview (Six-faces-council, the shells preview at
`/mnt/project-files/3d-build/cultivation-shells-4-preview/`, accessories round 4, 2026-11-05), so a place in the game
can build her or him in the page exactly as the preview does. First used by the coaching walk
(`public/coaching/walk.html`, round 2, Wendell's steer on cw-walk-look-1).

- `make/`, `r0g8/`, `ubc/`: the preview's files. Two changes: `r0g8/ubc.js` loads the bodies from `ubc/` beside it
  (not beside the page), and `make/mix.js` makes its stills renderer on first use, so a game page opens no second
  WebGL context.
- `walker.js`: `makeWalker({ who: 'f' | 'm', outfit })` builds the figure and walks it. The stride aims the limbs as
  the preview's `step` pose does, with the phase advanced by the ground covered. It is a stand-in until the
  cultivation pipeline's clips stage (stage 4) gives these bones a walk clip.
- The page's import map needs `three-mesh-bvh` (0.8.3) beside `three`.

When a cultivation round changes the figures, copy its `make/` over this one and keep the two changes above.
