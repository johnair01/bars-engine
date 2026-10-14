# Spec: Blender pipeline test plan

<!-- Tooling plan, so the six-faces pipeline's "not_for" applies: tests for tools that already exist get a plan and a
     pull request, not the full feature pipeline. Kept in the spec kit layout for the record. No UI, no persistence,
     no Prisma change, so no verification quest and no API contract. Stages and owners: council/pipeline.yaml in
     wendell-britt/six-faces-council. Call sheet: council/callsheets/blender-pipeline-test.md there. -->

## The ask

> "Your one job is the plan for testing the Blender pipeline, as that sheet describes. Write the spec kit in
> bars-engine, open a draft PR, write a ledger record, update the sheet and the index, and stop. Build no tests and
> change nothing in the pipeline."
> (Wendell, project thread, 2026-10-13)

**Who it is for:** the session that builds these tests next, and anyone who changes the pipeline after that.
**What they feel now, and what should change:** everything in the pipeline was checked once, by hand, by the session
that built it. Nothing tells the next session whether a change broke it. After the tests exist, one command in a
cloud session says what still works, what broke, and which pictures a person has to look at.

## Purpose

Plan the tests for the Blender pipeline, and the spikes that show whether it can change the cave from words and pictures (Part 2): what each test proves, the result that fails it, where it runs, and who
has to be there. This kit plans; it builds nothing and changes no file under `tools/blender-cloud/` or
`content/ontology-game/`.

## What the pipeline is (2026-10-13)

| Part | Where | State |
|---|---|---|
| Cloud tools | `tools/blender-cloud/`: `blenderkit_fetch.py`, `prepare_asset.py`, `scene.py`, `build_viewer.py`, `viewer_template.html` | on main (PR #281) |
| Picture path | `tools/blender-cloud/from_picture.py` (lathe, inflate, crystals, outline match, render), `content/ontology-game/cave/pictures/`, the `DRESSING` table in `cave/build_kit.py` | only on PR #285, open on 2026-10-13 |
| Cave builds | `content/ontology-game/body/build_figure.py`, `cave/build_kit.py`, `cave.js`, `cave-test.mjs` (126 checks at 390 by 844), `cave/manifest.json` with its budgets | on main; #285 changes the kit, the manifest and the checks |
| Published pages | Cloud Walker https://claude.ai/artifact/SUZYu1w1P5b61Cn6pj7Vwg; picture comparison https://claude.ai/artifact/568K2pwc7Lz5X9Kyftbzza | private URLs; a cloud session cannot open them |

This plan is written against main plus #285. Tests for the picture path (P-tests below) wait for #285 to merge.

## What has been checked, by hand only

From ledger `2026-10-12-blender-cloud-session.json` and `.specify/specs/blender-cloud-hardening/tasks.md`:
byte-for-byte rebuilds of `figure.glb`, `cave-kit.glb` and `spots.json` (main, before #285); the fetch `--selftest`;
the key header going only to the API host; the 403 message; Draco decode and import of four CC0 glTFs; the two-tile
UDIM stop (synthetic image); the triangle budget and the 12 MB stop; the licence gate; the viewer in headless
Chromium (7 bones, 1,318 triangles, 2.04 s WalkCycle, no console errors); the cave's 126 checks on #285.

## The tests

Each test has an id, what it proves, and its kill line: the number or observable result that fails it. The
Challenger owns the kill lines. **Tier** says where it can run:

- **offline**: plain Python 3 or Node, no `bpy`, no network. Seconds.
- **bpy**: needs the `bpy==5.2.2` venv from the README, no network. About a minute.
- **net**: needs the network hosts in N4.
- **eyes**: the test makes a contact sheet; a person looks and writes one line of verdict.
- **wendell**: only he can do it (his own machine, or a private URL).

### Stop conditions and gates (offline unless marked)

| Id | Proves | Kill line | Tier | Match |
|---|---|---|---|---|
| G1 | The licence gate refuses anything not CC0 | `build_viewer.py` with a `royalty_free` sidecar exits non-zero and writes no `viewer.html`; a `cc_zero` sidecar builds. Either way round wrong fails. | offline | exact |
| G2 | The licence gate cannot be skipped by a missing or odd sidecar | No sidecar, a sidecar with no `license` key, and `"license": "CC0"` (wrong spelling) each stop the build with a `STOP:` line and write no page. Read of the code on 2026-10-13: the missing-key case exits on a `KeyError` stack trace, not a `STOP:` line, so G2 is expected to fail there on its first run. Fixing it is a pipeline change for the build thread, not this plan. | offline | exact |
| G2b | The `--allow-restricted` flag is accounted for | `build_viewer.py` has an `--allow-restricted` flag that lets a Royalty Free model into a page. `cs-cc0-or-own` says the studio's tools refuse one. The test passes only if the flag is gone, or if a page built with it is marked so it cannot be published (the build thread decides which). Until then it fails, on purpose, so the gap stays visible. | offline | exact |
| G3 | The UDIM stop | A synthetic two-tile image stops `scene.py` with a message naming the asset and both tiles; a one-tile image passes. | bpy | exact |
| G4 | The size stop | `scene.py --max-glb-mb 0.5` on the dining table stops with the size in the message and leaves no GLB counted as done; the default 12 MB passes for it (1.3 MB). | bpy | exact |
| G5 | The triangle budget | The table run at `--tri-budget 5000` reports between 4,500 and 5,500 triangles, and the `REPORT` line's count equals a count of the exported GLB's indices. | bpy | ±10% budget, exact report-vs-file |
| G6 | The manifest budgets hold | For every `cave/manifest.json` asset with `budget_bytes`, the file on disk is at or under it; every asset's `bytes` equals its file size; every asset has `source` and `licence`, and `licence` is `own work` or `CC0`. | offline | exact |
| G7 | The key goes only to the API host | With `BLENDERKIT_API_KEY=fake`, a local stub server standing in for both hosts sees `Authorization` on the API path only, and never on the asset path; unset, it sees none on either. The key never appears in stdout, stderr or any file written. | offline | exact |

### Rebuilds that must match the committed file (bpy)

| Id | Proves | Kill line | Match |
|---|---|---|---|
| R1 | `build_figure.py` is deterministic | Rebuilt `figure.glb` has the same SHA-256 as the committed one. | exact bytes |
| R2 | `build_kit.py` is deterministic, picture dressing included | Rebuilt `cave-kit.glb` and `spots.json` have the same SHA-256 as committed. Run twice: the two runs agree with each other too. The byte-for-byte result was proven before #285 added `from_picture`; R2 is the first proof since. If it fails only on #285, the cause is in the dressing (crystal seed, metaball tessellation) and the test reports which piece differs by comparing per-mesh vertex counts. | exact bytes |
| R3 | The rebuild stays fast | R1 and R2 together finish in under 30 s (measured about 6 s on main). | time |

### The walker's numbers (bpy, then offline)

Nobody has checked the walk cycle's numbers, only its pictures.

| Id | Proves | Kill line | Match |
|---|---|---|---|
| W1 | The rig is the rig | The exported `scene.glb` has 7 joints with the names in `scene.py`, one animation named WalkCycle, and 1,318 triangles in the figure. | exact |
| W2 | The cycle loops and lasts 2.04 s | Every channel's first and last keyframe values agree within 1e-4; the last key's time is 2.04 s ±0.01. | tolerance |
| W3 | The legs alternate | At a quarter of the cycle the two thigh rotations about the swing axis have opposite signs, and at the half they have swapped. A walker whose legs move together fails. | sign, not value |
| W4 | The numbers do not drift | Each joint's rotation at frames 0, 12, 24, 36 matches a stored `walk_keys.json` within 1e-4 radians. The first run writes the file and a person checks W3's picture before it is committed. | tolerance |

### glTF validity (bpy to make, net once for the validator)

| Id | Proves | Kill line | Match |
|---|---|---|---|
| V1 | Every output is valid glTF | The Khronos validator (npm `gltf-validator`, one pinned exact version) reports 0 errors on `figure.glb`, `cave-kit.glb`, a `scene.glb` and each `from_picture` GLB. Warnings are listed in the summary, not failed. | exact: zero errors |

### Assets never tried (net, then bpy)

| Id | Proves | Kill line | Match |
|---|---|---|---|
| A1 | Meshopt decoding works | The dining table's decoded GLB is re-compressed with `gltf-transform meshopt`, then fed to `prepare_asset.py`. It reports meshopt, decodes, and `bpy` imports a mesh with the same triangle count and the same bounding box (±1 mm) as the uncompressed table. Making the fixture ourselves avoids hunting for a meshopt asset. | tolerance |
| A2 | A multi-material asset survives | One pinned CC0 asset with at least three materials (other than the 11-texture chair) runs fetch, decode, `scene.py`, viewer. The exported GLB has the same number of materials as the import, every texture is at or under 1024, and the preview passes E1. | exact counts, eyes |
| A3 | A real multi-tile UDIM asset is refused, not mangled | Search CC0 models for one with a tiled image (up to 40 results). If one is found, pin it: `scene.py` stops with the G3 message. If none is found, record "none in 40" with the date and G3's synthetic image stays the test. | exact |
| A4 | Pinned fixtures have not drifted | For each fixture in `fixtures.json` (see below), the search the README uses returns the pinned id at the pinned index, with licence `cc_zero`. If the index has moved, the test fails with the id it found, so a drifted fixture never passes silently. | exact id |

### Network and the run's limits

| Id | Proves | Kill line | Tier | Match |
|---|---|---|---|---|
| N1 | The fetch path works end to end | `blenderkit_fetch.py --selftest` exits 0. | net | exact |
| N2 | The 403 message still reads | With `scene_uuid` removed (the test passes an empty cache path), the script prints the API's own message, not a stack trace. | net | text present |
| N3 | Fetch works without the sandbox proxy | Already on Your steps as `cave-studio-02` and in the hardening kit. Wendell's result from his machine is the test. | wendell | as stated in the step |
| N4 | The hosts the pipeline needs answer | `api.blenderkit.com`, `assets.blenderkit.com` (or the host the selftest resolves to), `registry.npmjs.org` and `cdn.jsdelivr.net` each answer an HTTPS request within 10 s. The summary names each one up or down, so a later failure points at the host first. | net | per host |
| N5 | A heavy run fits | The 617,708-triangle Wooden Chair (`c8857203-ba76-4d34-9ee7-906293144d4e`) runs fetch to viewer in under 10 minutes with peak memory under 4 GB (`/usr/bin/time -v`). The numbers are the council's, marked; the first run records the real figures and the kill line becomes twice those. | net, bpy | time, memory |

### The picture path (bpy, after #285 merges)

| Id | Proves | Kill line | Match |
|---|---|---|---|
| P1 | Each `DRESSING` piece still matches its picture | Each piece's outline match is within 0.01 of the number in `manifest.json` (stone_spire 0.987, glow_cap 0.974, root_curl 0.885, crystal_cluster 0.829). A drop of more than 0.01 fails. A rise passes and is listed. | tolerance |
| P2 | The score is the overlap it claims to be | From the saved `_mask.npy`, the test computes intersection over union itself and gets the tool's number within 0.001. | tolerance |
| P3 | Each mode makes the right kind of shape | lathe: the mesh is round (width and depth within 5% of each other). inflate: the mesh is one connected piece. crystals: at least two parts, the crystals and the bed. | exact |
| P4 | The crystal count is tracked | Counts the prisms in `crystal_cluster`. Today it is 6 where his picture has about 10 (cave-studio sheet). The test records the count and is marked a known gap: it fails only if the count drops below 6. It turns into a hard test at 9 or more once the cave-studio strand fixes it. | floor |
| P5 | Face budgets hold | Each piece's face count is at or under its `DRESSING` budget (crystals has none and is listed). | exact |
| P6 | The cave still plays | `cave-test.mjs` passes all its checks at 390 by 844 (126 on #285). | exact |

### The score trap: how the pictures get looked at (eyes)

Outline-only scored 0.88 and looked like a blob; the crystal cluster scored 0.829 and looked right. The number says
the outline overlaps. It cannot say whether a stalagmite looks like a stalagmite. So no picture-path test passes on the number
alone:

| Id | Proves | Kill line | Match |
|---|---|---|---|
| E1 | A person saw each new or changed render | The runner writes one contact sheet: per piece, the picture, the front render, the three-quarter render, and the two outlines laid over each other in two colours, with the score printed under it. The run's summary lists every piece whose score or GLB changed since the last committed sheet. A changed piece is not done until a person writes one line beside it in `tests/LOOKED.md`: who looked, the date, and "looks like the picture" or what is wrong. A change with no line fails the run. | eyes |
| E2 | The walker still walks | The same sheet holds four frames of the walk (0, 12, 24, 36) from the side. Looked at with E1 whenever W4's stored keys change. | eyes |
| E3 | The published pages show what the local files show | Wendell opens the Cloud Walker and the comparison page on his phone after a republish, and says whether each loads and moves. A cloud session cannot open them; it checks the same files locally first (headless Chromium, no console errors), which is in the runner. | wendell |

For routine runs, the session itself can do the looking, reading the sheet as an image. Any dressing that
ships into the cave goes to Wendell's eyes through the existing `cs-first-test` rule: he looks at its preview before
it merges.

## Part 2: what the pipeline can make from words and pictures

> "we are looking to test the pipeline, but also see about using blender kit et al to use natural language to update
> the cave and existing assets in the games we are making. we need to know if we can start from an image into assets
> and have claude create scenes from natural language with the least amount of token usage. The test case we want to
> have is on the cave. I want the cave to be able to proceedurally create textured details and add objects and create
> basic work on a character creator based on a theme. The biggest test will be how we can render clothing options for
> players exploring these worlds"
> (Wendell, project thread, 2026-10-13)

Part 1 asks whether the pipeline still works. Part 2 asks whether it can do five new jobs, all on the cave, and
what each costs in tokens. Each is a spike with a kill line, run in the order below, cheapest first. A failed spike
stops only its own line.

### The one idea that keeps tokens low: Claude edits a recipe, a script builds it

Claude never writes Blender code to change the cave. It edits a short recipe file, `cave/scene.yaml`: which
pieces stand where, which procedural texture each surface wears, which CC0 or picture-built objects are placed, and
for the character creator, which body, garments and colours. A fixed builder script (committed, run by anyone, in a
Claude thread or in Codex, per `c3d-codex-rebuilds`) turns the recipe into GLBs. A change in words becomes a change
of a few lines. The builder is read once when it is written, never on each edit.

| Id | Proves | Kill line | Tier |
|---|---|---|---|
| T1 | A natural-language edit costs little | Ten sample asks ("add three glowing mushrooms by the pool", "make the walls wetter", "swap the gate stones for crystal"), each in a fresh short thread that reads only CLAUDE.md, the recipe and its schema. Each edit stays under 20,000 tokens beyond the thread's opening load and under 2,000 output tokens, read from the session's result events. The council's numbers, marked; the first run sets the real baseline. | net (platform), eyes |
| T2 | The recipe path beats writing code | The same ten asks done by writing `bpy` code directly, in matched threads. The recipe path must cost at most a third of the code path in tokens, with no worse result on E1's sheet. If it does not, the recipe idea is dropped and Part 2 plans around direct code. | net (platform), eyes |
| T3 | An edit lands as asked | For each of the ten asks, a person who did not write it reads the ask and the contact sheet and says yes or no. 8 of 10 yes passes. | eyes |

**Result (2026-10-13, #291):** T1 passed (every edit under 20,000 tokens past the opening load), T3 passed (8 of 10 on
both paths), T2 missed: the recipe cost 0.69 of the code path, where the line was a third. Both files are short, so
the edit's own cost is small next to the opening load every thread pays. Per this section, the recipe is dropped
(`bpt-recipe-result`, which he let stand). Claude now edits one committed Blender script for the chamber,
`content/ontology-game/cave/chamber.py`, one `place(...)` line per piece; every job below is an edit to that script
where the tables say "recipe line". The recipe, its builder and the token numbers stay in
`tools/blender-cloud/recipe_trial/` as the record (`RESULTS.md`). One finding carries forward: no edit on either path
looked at a render before calling itself done, and one look would have caught each miss, so every job thread looks at
its render before it reports.

### The five jobs

| Id | Job | Proves | Kill line | Tier |
|---|---|---|---|---|
| J1 | Procedural textured detail | A recipe line like `walls: {texture: wet_stone, scale: 2}` gives the cave's surfaces a texture made in Blender from noise and Voronoi nodes, baked to one 512 px JPEG per surface with UVs. | The kit plus its textures stays under the 3 MB budget (`c3d-phone-budget`); the cave still passes `cave-test.mjs` at 390 by 844 and holds 30 frames a second in headless Chromium on the 4x CPU throttle; three textures (wet stone, dry stone, crystal vein) look different on the sheet. | bpy, eyes |
| J2 | Add objects | A recipe line places an object from one of three sources: a pinned CC0 BlenderKit asset, a model built by `from_picture.py`, or a model built by script. | Each lands on the floor (lowest vertex within 1 cm of the floor), inside the chamber's walls, under its manifest budget, with a manifest row (`cs-manifest-row`). A non-CC0 source stops the build (`cs-cc0-or-own`). | bpy, net |
| J3 | Picture to asset | One of his own concept pictures (through the Drive inbox, `cs-chatgpt-by-drive`) becomes a placed piece with no hand-written code. | Outline match at or above 0.85 and a yes on the sheet (the score trap holds: both, never the score alone). Three pictures tried; two of three pass. A picture with depth the outline tools cannot read (a figure, a garment) is expected to fail here; that is recorded, and TRELLIS.2 on his Mac (`c3d-meshy-alternatives`) is the next tool to try, outside the cloud. | bpy, eyes |
| J4 | Character creator from a theme | A recipe block `character: {theme: robe_set, build: average, palette: dusk}` makes a player figure: the cave's faceless figure (`cave-avatar-self`, `build_figure.py`) with three builds and three palettes. | Nine figures on one sheet, each one GLB under 300 KB, each walking with the cave's walk cycle with no joint inverted (W3's check, per figure). The theme for the test is the Taoist cultivation robe set (`cc-robe-set`), so the 3D creator and the 2D one share one wardrobe (`cs-one-studio`). | bpy, eyes |
| J5 | Clothing options (the biggest test) | Garments are separate meshes skinned to the figure's one rig, built by script from the body (offset from its surface, then thickened), with weights copied from the body, reusing root-game's garment work first (below). The game swaps them at runtime. Three garments from the robe set: long robe, sash, topknot, each in three colourways. | (a) Through the whole walk cycle, no body vertex shows through a garment at frames 0, 12, 24 and 36, from front, side and back (a script counts body vertices outside the garment's surface; zero passes, and the sheet is looked at). (b) Each garment is under 150 KB. (c) In headless Chromium, swapping a garment on the walking figure takes under 100 ms and drops no frame below 30 a second. (d) A contact sheet of 3 builds by 3 garments by 3 colourways goes to his eye, as `cc-wardrobe-gate` asks of all new clothing. | bpy, eyes, wendell |

**J1 result (2026-10-13, #292, merged; in the cave game through #294, merged):** wet stone on the walls, dry stone on
the floor and gate stones, crystal vein on the spires and crystal bed, six 512 px JPEGs. The chamber is 465 KB of the
3 MB budget and the three textures look different. The frame-rate line is judged on his phone, not in the cloud
(`bpt-j1-frame-rate`): the cloud browser draws without a graphics chip, so the untextured chamber already misses 30 a
second there (27.7 on the 4x throttle; 19.7 textured).

**J2 result (2026-10-13):** passed. `content/ontology-game/cave/objects.py` adds one `obj(...)` line per object to
`chamber.py`, from any of the three sources: Blendkit's CC0 "Boulder 01" by Poly Haven (`boulder`, result 0, pinned by
id), a stone offering bowl that from_picture.py lathes from a stand-in picture (`pictures/offering_bowl.jpg`, outline match 0.991), and a
sitting cushion built by script. Each stands on the floor (lowest vertex 0.0 cm), inside the walls (5 cm clear), under
its budget (boulder 65 KB of 117, bowl 43 of 58, cushion 5 of 19) and writes its manifest row. The chamber is 565 KB
of the 3 MB budget. Tests J2 and J2b (`test_bpy.py`): J2 builds the chamber and checks every row; J2b feeds the build a
Royalty Free sidecar and the build stops (`cs-cc0-or-own`). Two traps found on the way: the decoded Draco boulder had
every triangle on its own vertices, so decimating it shredded the rock until objects.py merged the vertices first; and its
colour map read the second of two UV sets, so dropping "the extra one" turned it black. `objects.py` handles
both. The chamber build now needs the network the first time a Blendkit object is fetched; after that it
reads the cache under `/tmp/blender-cloud/assets`.

**Start from root-game.** Wendell's steer on `bpt-skinned-garments` (2026-10-13): "Use as much as we can from the
root game for this as we’ve already done many garment tests there". So J5's thread begins by listing what root-game
already has (`wendell-britt/root-game`, call sheet `root.md`): its garment shapes (robe, sleeves, skirt), the clothes'
spacing off the body (6 cm, and squashed at 3 cm where two fighters press, `rg-stance-by-move`), its collision
shapes, its cloth solver and the phone cloth it ships. Each piece is reused, ported to the cave figure, or set aside
with a reason written in tasks.md. The root-game strand owns those files; J5 copies or imports and never edits
them there.

Cloth simulation stays out of the first round unless root-game's solver ports cheaply. Skinned garments move with
the body; a long robe that should swing gets a few extra bones in its hem first, then root-game's solver, and only
then anything new.

**J4 result (2026-10-13):** passed on the machine half; round 2's sheet waits for his eye. `content/ontology-game/cave/character.py`
makes a figure from a theme, a build and a palette: `--theme robe_set --build average --palette dusk`, or `--all` for
the nine. With the recipe dropped, the "recipe block" is those three words on the command line. The body starts from
the body map's figure (`build_figure.py`'s parts, 1.75 m, no face) in three builds (slight, average, broad), fused into
one surface. Its rig has the cave avatar's sixteen joint names (`cave.js` buildAvatar), and its one animation, Walk, is
`cave.js` poseAvatar baked at a mid stride: one second, 25 keys. The robe set is painted on as the under-layer in three
palettes (dusk, jade, hemp): a crossed collar worn left over right, a tunic to mid-thigh with a hem, a sash, sleeves
with cuffs, trousers tied at the ankle, cloth shoes. Each vertex is weighted to the body part it came from, blended with
that part's parent or child at a joint, so an arm never pulls the trunk. Test J4 reads each walk back from the GLB:
W3's swing and swap pass, and no knee or elbow folds the wrong way at any key; J4b bends a copy's knees forward and the
check catches it.

Round 1 (his look, 2026-10-13 22:14, `j4-look-01`): "The collars are broken so it doesn’t read as undergarments or an
undershirt. We’d expect smooth collars that are painted on the shoulders" and "Also build proportions are close to
human but are hitting uncanny valley". Round 2: the collar is one band laid on the surface, from the right side up
across the chest, over both shoulders and round the back of the neck, and standing a little way up the neck. The
surface is cut exactly along each band's edge (`cut_along`), so a band is a smooth line and never a staircase of
triangles. The body moved away from realism: a bigger head (about six and a half heads tall, where the body map is
seven and a half), a short neck, a plain trunk with no waist or chest sculpting, thicker limbs, mitten hands and rounded
feet. The nine GLBs are 246 to 266 KB (line 300). The long robe, the sash as cloth and the topknot are J5's, as separate
meshes on this rig. The figures reach the game when J5's garments are wired into `cave.js`.

**J5 result (2026-10-13):** passed on the machine half; the sheet waits for his eye (`cc-wardrobe-gate`).
`content/ontology-game/cave/garments.py` cuts three garments of the robe set on each of the nine J4 figures, each its own
skinned mesh on the figure's rig: an ankle-length robe with wide sleeves, the crossed collar (J4's `collar_path`, left over
right) and side slits to the knee; a sash knotted in front on the wearer's left with two tails, cut twice (`sash` on the
body, `sash-robe` over the robe) so it sits close on either; and a topknot (hair over the crown and back of the head, a
bun, its tie and a pin). Each comes in the three palettes (dusk, jade, hemp). What came from root-game, and what was set
aside, is in tasks.md.

- Built from the body: the robe is rings measured from the standing body's own outline at each height (where its edges
  cross that height, since the decimated body's vertices alone miss it), offset and flared to an A-line, then thickened
  4 mm outward. Above the hips it takes the body's weights; the sleeves take the arm's.
- The hem bones: J4's rig gains two bones, `hemF` and `hemB`, hanging from the hips. The walk turns the front one with
  whichever leg is ahead and the back one with whichever is behind (character.py `pose`). Below the hips the robe hangs
  from the hips and these two, and its sides from their own thigh. The body carries no weight on them, and the J4 walk
  tests still pass. cave.js must compute the same two when the figures are wired in.
- (a) The test checks every covered body point, and the middle of every covered face, at all 25 keys of the walk (the
  walk is one second, 25 keys, so the plan's frames 0, 12, 24 and 36 became every key). A point is through when it lies
  outside the garment's surface and is not at an opening (hem, slits, cuffs, neck), or when the line out from the body's
  middle through it meets no cloth (that second check found what the first missed where cloth folds: a speck of tunic at
  the hip on the first sheet). Where a point came through, `fit()` pushes the cloth out and walks again: root-game's
  fullness rule, found by walking. The robe needs one or two rounds; all 36 garments end at zero. Without the fit
  (`--no-fit`, test J5b) the robe has points through.
- (b) Robe 109 to 119 KB, sash 20, topknot 28 (line 150). Each garment's skin uses the figure's own joint names.
- (c) `tools/blender-cloud/tests/j5_swap.mjs` in headless Chromium: the wardrobe is parsed and bound to the figure's
  bones once on loading (about 50 ms for twelve garments), and a swap (take one off, put the next on) takes under 1 ms.
  The frame after a swap is no slower than the walk's own at the median (16.7 ms). The 30 a second line is judged on
  his phone, as J1's was (`bpt-j1-frame-rate`): the cloud browser draws without a graphics chip, and its walk alone has
  frames of 33 to 50 ms before any swap.
- (d) Three pictures in `/mnt/project-files/3d-build/j5-garments-2026-10-13/`: each garment alone in each palette on the
  three builds (27 figures), the whole set on all nine, and the average dusk figure in the set from the front, the side
  and the back at four points of the walk. The sheet is rendered from the GLBs, rebound to the figure's armature by
  bone name, the same way the game will swap them.

Round 2 (his look, 2026-10-13 23:24, `j5-look-01`): "We still have issues with how the garments hang on the shoulders.
There's peeking through on top. None of the robes do this well. Also the hems are being held open against gravity. We
want them to hang more". The shoulder tops were not in the test's covered points (it stopped at 1.40 m), so they passed
unseen. Now the robe's rows from the chest to the neck are laid over the body from the inside out, so they follow the
nearly level top of the shoulder, and the test covers the trunk up to the neck. The hem's A-line went from 11 cm to
3 cm, and the back hem bone follows the kicking shin a little more (`hemB` = hip + 0.6 knee), so the walk needs less
room and the fit no longer opens the hem into a bell. `fit()` now undoes a round that leaves more points through and
halves its next step. The robe is 117 to 125 KB. All 36 garments end at zero, and J4, J4b, J5, J5b and J5c pass.
Pictures in `/mnt/project-files/3d-build/j5-round2-2026-10-13/`.

Round 3 (his look, 2026-10-14 00:25, `j5-look-02`): "Yeah the shoulders are still funky. They aren't operating like
clothes it's very obvious they are being rendered by geometry and handwaving", and "We're making it look like
something instead of simulating what happens". The robe is no longer laid round the body by rule. It is cut as two
flat panels (a body and two sleeves each), sewn at the shoulders, along the sleeves and down the sides to the slits,
and dropped on the standing body by Blender's cloth solver, with the flat pattern as the cloth's rest shape, so where
it lies flat, folds or bunches is the solver's answer. A belt at the sash's height is simulated by shrinking that band
of cloth until it grips the waist. The draped cloth's trim is cut in at full detail, then the cloth is reduced for the
phone with the trim's lines kept: every robe is 109 to 112 KB. The walk test no longer counts the points where the
body faces itself a few centimetres away (under the arm, between the thighs), where real cloth is caught too.
Open: J5 passes on the average build; on slight and broad the cloth solver does not settle the same way on every run,
and some drapes leave up to 30 points through at the hips mid-stride that `fit()` does not clear. J4, J4b, J5b and
J5c pass. Pictures in `/mnt/project-files/3d-build/j5-round3-2026-10-14/`.

Round 4 (his look, 2026-10-14 16:46): "the places where there are slits in the robe aren't separating when they walk.
The figrues without robes should have bare or basic tops so they aren't duplicating the robes. The hems also need to
feel like they are more than just painted on". Near each slit, each panel now hangs from its own leg's hem bone, so
the slit opens in the stride. The walk test counts a leg out through a slit as held when no cloth lies between the
point and its bone. The hem and the cuffs are turned back inside the robe, round a 6 mm fold and 3 cm up. The hem is
stiffened in the cloth solver and its edge is smoothed, as the cuffs already were. The figure's painted under-layer is
a plain short-sleeved top to the waist with a round neck, over the tied trousers. Every robe is 136 to 138 KB. J4,
J4b, J5, J5b and J5c pass. Pictures in `/mnt/project-files/3d-build/j5-round4-2026-10-14/`.

### What Part 2 does not do

No daemon's or spirit's words (`cs-no-written-words`). No figure has a face, and no garment or figure is built
from a photograph of a real person. No Royalty Free model goes into a page. The 2D sprite creator in sprout is not
touched; J4 and J5 only borrow its wardrobe.

## Who has to be there

| Who | Tests |
|---|---|
| Every run, offline, no `bpy` | G1, G2, G2b, G6, G7 |
| Every run, offline, with `bpy` | G3, G4, G5, R1 to R3, W1 to W4, P1 to P6 (P after #285), the local half of E3 |
| Network | V1 (once, then cached), A1 to A4, N1, N2, N4, N5 |
| A person's eyes | E1, E2 |
| Wendell | N3 (step `cave-studio-02`, already on Your steps), E3 after a republish, J5(d) the clothing sheet |
| Token reads (platform result events, after each thread) | T1, T2 |

## Exact or tolerance

- **Exact bytes:** R1, R2. These scripts are deterministic by design; any byte change is a change someone made.
- **Exact counts and text:** gates, joint and material counts, face budgets, validator errors, fixture ids.
- **Tolerance:** keyframe values (1e-4), cycle length (0.01 s), outline scores (0.01; 0.001 for the recomputed one),
  triangle budgets (10%), bounding boxes (1 mm).
- **Never compared by pixel:** renders. Blender's renderer and the headless browser differ by machine and version,
  so a pixel diff would fail on noise and teach people to ignore it. Renders go on the contact sheet for E1.

## Fixtures

`tools/blender-cloud/tests/fixtures.json` pins each CC0 asset by id, because a search index drifts:

| Fixture | Id | Used by |
|---|---|---|
| Chair (stool) | `94eaeda7-5ef1-44a3-988e-4821002d8650` | A4 |
| Dining table | `929d574b-02ed-4b48-ba5b-2ce3214a31d6` | G4, G5, A1, A4 |
| Wooden Chair, 617,708 triangles | `c8857203-ba76-4d34-9ee7-906293144d4e` | N5, A4 |
| Painted Wooden Chair 02 (in the published viewer) | read from its sidecar when the build thread starts | A4 |
| A multi-material asset | chosen and pinned in A2 | A2 |

Each row records the query, the index, the name, the licence and the date pinned. Downloaded asset files stay out of
git (the README's rule); only `fixtures.json`, the small synthetic images, `walk_keys.json` and the contact sheet's
last committed version go in. No fixture is a photograph of a real person, and no test writes a daemon's or a
spirit's words (`cs-no-written-words`).

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Where the tests live | A new `tools/blender-cloud/tests/`; no existing file changes. The cave's own `cave-test.mjs` stays where it is and the runner calls it. | call sheet, to stay clear of the cave-studio strand |
| How a session runs them | One command, `python3 tools/blender-cloud/tests/run.py --tier offline,bpy[,net]`, run in the background; it writes `$W/test-summary.md`, at most 30 lines: one line per test with pass, fail or skipped and why, then every render waiting for eyes | CLAUDE.md, long jobs write a summary file |
| The GitHub `check` job | Runs only the offline tier (G1, G2, G2b, G6, G7) as one extra step with plain Python, no `bpy`. The `bpy` wheel is a large download on every push, and Blender work changes rarely. A test marked as a known gap (G2 and G2b until fixed, P4) is reported in the job's log and does not fail it, so the job never goes red on a gap everyone already knows. The `bpy` and net tiers run in a cloud session whenever `tools/blender-cloud/`, `cave/` or `body/` change. | council (Architect, Challenger) |
| Renders | Looked at, never pixel-diffed | council, from the score trap |
| Meshopt fixture | Made from the table with gltf-transform, not searched for | council: cheaper and pinned by construction |
| The CC0 gate | Tested, never loosened. A gap G2 finds goes to the board as a finding. | Wendell, `cs-cc0-or-own` (`.specify/specs/cave-studio/request.md`) |
| Crystal count | Floor at today's 6, hard test once fixed | cave-studio sheet, known gap |
| How words change the cave (Part 2) | Tested first: a short recipe, `cave/scene.yaml`, against writing `bpy` code directly (T2). The recipe missed T2, so Claude edits the committed `cave/chamber.py`, one line per piece | council (Architect, Challenger); `bpt-recipe-result`, 2026-10-13 |
| Theme for the character test | The Taoist cultivation robe set, so the 3D and 2D creators share one wardrobe | `cc-robe-set`, `cs-one-studio` |
| How clothing is made | Separate garment meshes skinned to the figure's one rig, built by script from the body, swapped at runtime; no cloth simulation in round one | council (Architect, Challenger); his eye on the result per `cc-wardrobe-gate` |
| Textures | Procedural nodes in Blender, baked to 512 px JPEGs, within the 3 MB budget | `c3d-phone-budget` |
| Order of Part 2 | T1 to T3 (the recipe and its cost) first, then J1, J2, J3, J4, J5 | council: the recipe's cost decided how every later job is written |

## Reserved items

None reach Wendell. Every fork above was answerable from the record, so each stands as a council position unless he
flips it; Part 2's four are on the Council Board as positions (`bpt-recipe`, `bpt-robe-theme`, `bpt-skinned-garments`,
`bpt-order`). His tests (N3, E3, J5(d)) are steps, not questions.

## How we will know the plan failed

- **The cheap test, run before building the rest:** R2 on #285's branch, twice. If `build_kit.py` with picture
  dressing is not byte for byte deterministic, the exact-match tier is wrong for the kit and the plan changes R2 to
  per-mesh vertex counts and bounding boxes. Nothing else in this kit depends on that answer.
- **The result that stops the work:** the offline and `bpy` tiers cannot finish in one cloud session sitting
  (install plus run over 15 minutes), or more than one test in ten fails on main with no code change (flaky). Then the
  tiers are cut down before anything is added.

## Definition of done (for the build thread, not this one)

- [ ] `tools/blender-cloud/tests/` holds `run.py`, `fixtures.json`, `walk_keys.json`, `LOOKED.md` and the synthetic
  images; no other file in the repo changed except the `check` workflow's one step.
- [ ] Offline and `bpy` tiers pass on main in one run; the summary file is pasted in `tasks.md`.
- [ ] The net tier ran once; N4's host list and N5's real time and memory are recorded.
- [ ] The first contact sheet was looked at and `LOOKED.md` has its lines.
- [ ] After #285 merges, the P-tests pass and the sheet holds the four dressing pieces.
- [ ] Part 2: T1 to T3 measured and recorded with token numbers; J1 to J5 each passed or stopped at its kill line, with
  the clothing sheet in front of Wendell.

## Dependencies

- `.specify/specs/blender-cloud-hardening/` (what each tool does and why)
- `.specify/specs/cave-studio/` and PR #285 (the picture path)

## References

- `tools/blender-cloud/README.md`; `content/ontology-game/cave/manifest.json`; `content/ontology-game/cave/cave-test.mjs`
- Ledger `2026-10-12-blender-cloud-session.json` in wendell-britt/six-faces-council
- Board positions `cs-rebuild-proof`, `cs-cc0-or-own`, `cs-manifest-row`, `cs-first-test`, `cs-no-written-words`, `c3d-phone-budget`
