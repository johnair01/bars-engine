# Plan: World From Image

Implement per [spec.md](spec.md).

## Tracks

**Track A: PlanScene pipeline** (sprout first, then bars-engine). Phases 0 to 3 in spec.md.

**Track B: root-game backdrop experiment.** Separate from the tile pipeline because root-game has no map layer.

## Track A order

1. **Phase 0 (blocks the producer).** image-blaster is driven through Claude Code ("blast it") and its docs leave the output layout undocumented. One real run answers the open questions: where object positions live, units and axes, whether collision data exists, run cost. Needs Wendell's approval of the input image and the spend.
2. **Phase 1 needs no AI.** `PlanScene`, validator, vocab files and the sprout emitter can be built and tested on hand-written fixtures while Phase 0 waits on keys. This is also the dual-track path (P3).
3. **Phase 2** writes the producer adapter against the real Phase 0 output.
4. **Phase 3** adds the bars-engine emitter. Its input contract is already fixed by Phase 1.

## Open questions

| Question | Resolved by |
|----------|-------------|
| How do image-blaster outputs encode object placement? | Phase 0 run |
| Can terrain be read from the splat render, or does the source image give better labels? | Phase 2 comparison on three images |
| Cell size: how many world meters per tile for interiors vs villages? | Phase 2; start with 1 cell = 1 m for interiors and tune with `map:check` |
| Does sprout's asset manifest cover enough kinds (house, well, table, tree) for the vocab? | Phase 1 vocab mapping; missing kinds are listed for Wendell to decide on |
| Where should sprout emitter output be reviewed before copying into the sprout repo? | Wendell |

## Track B: root-game backdrop experiment

root-game renders a procedural 3D courtyard at 288x180 with an orbit camera (`VIEWS` in `rootcloth/sim3d.js`: `side`, `other`, `above`, `three`).

1. Take one image-blaster world from Phase 0.
2. Render it from the angles of `side` and `three`, downsampled to the game's internal resolution with a limited palette.
3. Place the render behind the fighters in a copy of the page, leaving the floor mat and fighters untouched.
4. Judge on a phone: frame time and whether the look matches the 8-bit rig style.

Exit criterion: Wendell's verdict plus measured frame cost. This track touches no code in the bars-engine repo; work happens on a branch in root-game after Wendell asks for it.

## File impact

```
scripts/world-from-image/
  plan-scene.ts          # types, validatePlanScene
  vocab.json             # allowed terrain and object kinds
  vocab.sprout.json
  vocab.bars-engine.json
  emit-sprout.ts
  emit-realm.ts          # Phase 3
  blast.ts               # Phase 2 producer runner
  fixtures/              # hand-written scenes
docs/image-blaster-output.md   # Phase 0 findings
```

No `src/` changes in v1. No Prisma changes.
