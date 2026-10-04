# Spec: World From Image (image-to-plan-scene converter)

## Purpose

Turn one image into a **plan scene**: a top-down grid of terrain labels, a list of placed objects with footprints, and door/spawn points. Small emitters then translate a plan scene into each target game's own map format. The first producer is [image-blaster](https://github.com/neilsonnn/image-blaster) (single image to a 3D world); a hand-written or editor-made plan scene is equally valid input.

**Problem**: Three of Wendell's repos need places, and each stores them differently. Writing a converter per source-and-target pair multiplies the work. A neutral middle format lets one image-to-world step serve all of them.

**Practice**: Deftness Development — spec kit first, API-first (contract before code), deterministic over AI. AI runs at authoring time only. Every generated scene is a draft that a human reviews before it reaches a game.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Middle format | `PlanScene` (below). Cell-based, top-down, game-agnostic. Terrain and object `kind` are keys from a controlled vocabulary (`vocab.json`). |
| Where AI runs | Authoring time. Games ship hand-reviewed maps, and generation stays out of the runtime. Matches the Portland community's allergy to AI: the non-AI path (editor, hand-written scene) is first-class. |
| Provenance | Every scene carries `provenance: "ai_draft" \| "human_authored" \| "human_reviewed"`. Emitters copy it into the target's metadata where a field exists. Promotion to `human_reviewed` is an explicit step. |
| First target | `sprout`: it has the strictest validator (`npm run map:check`), so converter mistakes show up as FAIL with a picture. |
| Second target | `bars-engine` `RealmData` through `src/lib/spatial-map/import/json-adapter.ts`. Loose string tile types make it the easier emitter. |
| `root-game` | Separate experiment (pre-rendered backdrops from fixed camera angles). It has no map layer, so no emitter. See plan.md, Track B. |
| 3D role | Meshes supply **footprints and positions** (bounding boxes projected to the ground plane) and an orthographic top-down render for terrain labeling. Gaussian splats serve as reference imagery only. |
| No edits to sprout | The emitter writes a spec file that a human copies into `sprout/specs/maps/`. sprout's own docs hold player-facing "maker" work until its playtest gate. |
| Spend and privacy | World Labs, FAL and ElevenLabs are paid third-party services. Input images leave the machine. The runner prints what it will send and the services it will call, and requires `--yes`. Keys live in the environment. Audio generation is off by default. |

## Conceptual Model

| Dimension | Here |
|-----------|------|
| **WHO** | The author (Wendell or a steward) who supplies an image and judges the result. |
| **WHAT** | A place: terrain, objects, doors, spawns. |
| **WHERE** | Which game receives it: sprout village/farm/interior, a bars-engine spatial room. |
| **Energy** | Generation spend (API cost) and review attention. Both are budgeted per run. |
| **Moves** | Wake Up (see what the image holds), Clean Up (fix what fails `map:check`), Show Up (promote to `human_reviewed` and ship). |

```
image ──► producer ──► PlanScene ──► emitter ──► target map file ──► target's own validator
 (image-blaster)       (vocab-bound)  (sprout | bars-engine)          (map:check | map editor)
                           ▲
 hand-written / editor ────┘
```

## API Contracts (API-First)

### PlanScene (the contract between producers and emitters)

```ts
type Provenance = 'ai_draft' | 'human_authored' | 'human_reviewed'

interface PlanScene {
  version: 1
  id: string                       // lower_snake, becomes the target file name
  kind: 'village' | 'farm' | 'forest' | 'interior' | 'cave'
  provenance: Provenance
  source?: { image: string; producer: string; runId?: string }
  grid: { width: number; height: number }   // cells; one cell = one target tile
  terrain: string[]                // height rows, each `width` vocab keys joined by ',' (ex. "grass,grass,path")
  objects: PlanObject[]
  links: PlanLink[]
  preview?: string                 // path to a top-down PNG of the source world
  notes?: string[]                 // producer remarks, e.g. low-confidence regions
}

interface PlanObject {
  id: string
  kind: string                     // vocab key: 'tree' | 'house' | 'well' | 'table' | ...
  at: [x: number, y: number]       // top-left cell
  footprint: [w: number, h: number]
  solid?: boolean                  // default from vocab
  mesh?: string                    // path to a source .glb, for sprite baking later
  confidence?: number              // 0..1, producer's own estimate
}

interface PlanLink {
  kind: 'door' | 'spawn' | 'exit'
  name: string
  at: [number, number]
  target?: { scene: string; spawn: string }
}
```

### Vocabulary

`world-from-image/vocab.json` lists the allowed terrain and object keys. Each target has a mapping file (`vocab.sprout.json`, `vocab.bars-engine.json`) from vocab key to that target's asset id or tile string. A key without a mapping makes the emitter report it and stop.

### Emitters

```ts
function emitSproutSpec(scene: PlanScene, map: VocabMap): { spec: object; warnings: string[] }
function emitRealmData(scene: PlanScene, map: VocabMap): { realm: RealmData; anchors: AnchorDraft[]; warnings: string[] }
```

- **sprout**: merge runs of equal terrain into `ground`, `water`, `path`, `forest` rectangles; map objects to `prop` and `building` features with `at`; links become `exit` and `spawn` features. Output is `specs/maps/<id>.json`, checked with `npm run map:check -- <file>`.
- **bars-engine**: terrain key becomes `floor`; solid objects set `impassable` and `object`; links become `teleporter` tiles or `AnchorDraft` rows for `createAnchor`. Output goes through `JsonRealmAdapter`, then the map editor.

Both are pure functions over JSON. Route Handler and Server Action surfaces are out of scope for v1 (CLI scripts only).

### Producer: image-blaster runner

```bash
npm run world:blast -- input/tavern.png --id tavern --kind interior --yes
```

Runs image-blaster, collects its output directory, then writes `PlanScene` JSON and the preview. image-blaster documents its output formats (`.glb`, `.obj`, `.spz`, `.mp3`); its file layout, object-position data and collision data are undocumented. Phase 0 of plan.md inspects a real run and fixes the adapter to what exists.

## User Stories

### P1: Draft a sprout map from a picture

**As the author**, I want to give an image and receive a `map:check`-passing sprout spec plus a preview, so a layout I can edit exists in minutes.

**Acceptance**: `map:check` prints PASS and every door is reachable. The preview PNG shows terrain and objects that match the source image.

### P2: Same scene, second game

**As the author**, I want the same `PlanScene` to load in the bars-engine map editor, so one image serves both games.

**Acceptance**: `JsonRealmAdapter.parse` returns a `RealmData` with no errors, and the editor opens it with walls on the impassable cells.

### P3: Write a scene by hand

**As a steward who avoids generation**, I want to write or edit a `PlanScene` directly and emit it, so the converter has value with no AI step.

**Acceptance**: a hand-written fixture emits valid sprout and bars-engine output with `provenance: "human_authored"`.

## Functional Requirements

### Phase 0: Learn what image-blaster emits

- **FR1**: Run image-blaster on one approved image; record the real output tree in `docs/image-blaster-output.md` (file names, object data, scale, coordinate system, any collision data).
- **FR2**: Record cost per run and wall time.

### Phase 1: PlanScene and sprout emitter

- **FR3**: `PlanScene` type, JSON schema and `validatePlanScene()` (bounds, vocab keys, link targets, solid-footprint overlap).
- **FR4**: `emitSproutSpec` with run-length rectangle merging and vocab mapping.
- **FR5**: Hand-written fixtures for an interior and a village. Their emitted specs pass `map:check`.

### Phase 2: Producer adapter

- **FR6**: Orthographic top-down projection of image-blaster meshes to footprints (axis-aligned bounding boxes snapped to cells).
- **FR7**: Terrain labeling from the top-down render, with a vision model constrained to the vocabulary, one label per cell, with `notes` for low-confidence regions.
- **FR8**: Door and spawn placement: place a spawn at the walkable cell nearest the image's camera origin; propose doors on building footprints and flag them for human confirmation.

### Phase 3: bars-engine emitter

- **FR9**: `emitRealmData` and the anchor drafts.
- **FR10**: Round-trip test through `JsonRealmAdapter`.

## Non-Functional Requirements

- **Spend gate**: no network call to a paid service without `--yes`; a dry run prints the plan.
- **Determinism**: emitters are pure and byte-stable for equal input. Only producers vary between runs.
- **Secrets**: API keys are read from env and kept out of scene files and logs.
- **Footprint**: tool code lives in `scripts/world-from-image/`; no new runtime dependency in the Next.js app.
- **Licensing**: image-blaster is MIT. Generated meshes and splats inherit the terms of World Labs and FAL; record these in `docs/image-blaster-output.md` before any asset ships.

## Persisted data & Prisma

None. No `schema.prisma` change. (A later "import from image" admin surface would need its own spec.)

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Filesystem | Output under `build/world-from-image/<id>/`, git-ignored. Nothing writes to `public/`. |
| AI calls | Authoring time only; per-run spend printed; `--yes` required; cache by input image hash. |
| Env | `WORLDLABS_API_KEY`, `FAL_KEY`, optional `ELEVENLABS_API_KEY`; document in `docs/ENV_AND_VERCEL.md` as local-only. |

## Verification Quest

This is authoring tooling with no player-facing flow, so a Twine certification quest is deferred. Verification is review by the author:

1. Run the P1 flow on three images.
2. Open each preview beside its source image.
3. Wendell judges whether each result is a usable draft (usable, needs edits, or discard) and the verdicts go in the Phase 1 report.

If an admin "import from image" surface is added later, give it `cert-world-from-image-v1` per [cyoa-certification-quests](../cyoa-certification-quests/).

## Dependencies

- [campaign-hub-spatial-map](../campaign-hub-spatial-map/) and [gather-editor-rpg-maker-integration](../gather-editor-rpg-maker-integration/) for the `RealmData` format.
- sprout repo: `docs/map-specs-for-sessions.md`, `docs/tiled-maps.md`, `assets/manifest.json`.
- External: World Labs, FAL, ElevenLabs accounts and keys (producer only).

## References

- `src/lib/spatial-map/types.ts`, `src/lib/spatial-map/import/{adapter,json-adapter}.ts`, `src/actions/spatial-maps.ts`
- `src/lib/spatial-world/pixi-room.ts` (32px tiles)
- sprout: `specs/maps/sample_grid.json`, `tools/kit/planner.mjs`, `maps/map.schema.json`
- root-game: `rootcloth/sim3d.js` (`VIEWS`, `paintFloor`), `HANDOFF.md`
