# Reference → code → reviewed game asset

This is a runnable worked example for a model with little surrounding chat context. Follow the stages in order. Do not invent a source measurement, an approved style rule, or a user reaction. Keep observation, inference, and approval separate.

## 0. Read the packet

Read these files before generating code:

1. `reference/met-27931.jpg` and `evidence.json`: source, license, measurements, visual landmarks, candidate parts, confidence, and unknowns.
2. `base_jian.py`: accepted closed-mesh jian construction and `build_object()` entrypoint.
3. `jian-identities.json`: five current design hypotheses as typed operations and material roles.
4. `feedback-reactions.jsonl` and `review/v3-inventory.png`: the user's exact reactions and accepted inventory view.
5. `transform_contract.py`, `build_inventory.py`, `asset_study.py`, `build_release.py`: compilation and gates.

The source is [Met object 27931](https://www.metmuseum.org/art/collection/search/27931), Public Domain. Its 1.038 m whole-sword and 0.838 m blade measurements constrain **this base study**. They are not universal dimensions for every Calrunian sword.

## 1. Turn a new reference into evidence

For a new asset, save the actual reference file plus title, creator/source, license, URL, image hash, measured scale, and camera/view assumption. Ask a vision model or use code to produce **provisional** image landmarks, part hypotheses, adjacency/attachment graph, and confidence. Mark observed pixels separately from inferred hidden construction. Record unknown depth and cross-section explicitly.

Expected output is an `evidence.json` shaped like this example. A later model should be able to see *why* a part exists and which dimensions came from measurement rather than intuition. Never start by copying this jian's part names or coordinates onto an unrelated object.

## 2. Build the unstyled base

Write Blender Python with `build_object()`, named required meshes, meters, a consistent object frame, and a fixed seed if any randomness is used. Make a gray blockout. For the jian, `Blade`, `Guard`, `Grip`, and `Pommel` are visible parts; the blade tip is +Z in Blender. The hilt is below the guard. Do not add materials or ornament before the assembly and measured size pass.

The base must pass: valid Python; required objects present; zero nonmanifold edges; blade length within ±0.005 m of 0.838 m; full length within ±0.005 m of 1.038 m. Save the code and gate output. If a model response is truncated or malformed, reject it before Blender; do not guess the missing code.

## 3. Define identity as bounded edits

Keep the base's invariant parts and attachment point. Express each variation in JSON with named target parts, numeric ranges, material roles, and a source cue. `jian-identities.json` uses:

- an eight-ring blade width profile;
- guard-arm endpoints and radii in meters;
- a finite pommel vocabulary;
- grip radius multiplier;
- four material roles;
- optional named detail operations with target, count, size, and color.

The five nations are not five arbitrary color swaps. Argyra uses precision and open geometry; Pyrakanth uses rising flame forms in the guard and hilt; Lamenth descends; Virelune uses asymmetric branching and wood; Meridia is solid and weighted. These are approved **inventory studies**, not weapon canon for every character.

Keep cultural construction separate from path handling. A later path overlay may alter balance, grip, blade mass, pose, or animation, but needs actual path rules before implementation. Keep an active elemental effect separate from the unlit object. The inventory asset must read without particles.

## 4. Compile and build

From the bars-engine root:

```sh
python3 tools/blender-cloud/make/jian/transform_contract.py jian tools/blender-cloud/make/jian/jian-identities.json --output /tmp/jian-compiled.json
python3 tools/blender-cloud/make/jian/build_release.py
python3 tools/blender-cloud/make/jian/build_release.py --check
```

The compiler rejects unknown operations, out-of-range values, missing material roles, bad targets, and invalid lengths. The builder generates every GLB and fixed neutral inventory view. The release command requires closed meshes, total triangles ≤1,500 per sword, measured lengths within ±5 mm, and at least 25/255 median blade-to-background luminance difference when the icon is reduced to 72×96 pixels. It verifies `GripSocket` in each GLB and writes content hashes to the public catalog. A Blender traceback is **not** success: `asset_study.py` requires a fresh `checks.json` from the same run, because Blender can report an error while exiting with status 0.

## 5. Review at the right scales

Use the full inventory PNGs for craft, the 72×96-pixel proxy for icon readability, and a real game-camera capture for held gameplay. The current source includes `review/v1-fire-held.png`, `review/v2-inventory.png`, `review/v3-inventory.png`, and `review/v3-96px.png`. In firelight the first family matched only 2/5 in a blind vision read; neutral inventory grayscale v1 also matched 2/5. The later geometry family matched 5/5 in one blind color and one blind grayscale inventory read. Those are **single-model probes with style cues**, not player-study results or aesthetic approval.

Check both object identity and context: a screenshot from a stale browser module or fallback figure is invalid. The earlier gourd study exposed exactly that failure. Save the active spec hash, capture size, camera, lighting, and file hash with every new review image.

## 6. Repair one failed class at a time

Give the model the exact failing measurement or view and the permitted files/parameters. Preserve passing geometry and approved anchors. Examples from this study:

- A higher photo silhouette score did not improve the 48/96-pixel weapon read; change pose or major form before more microgeometry.
- Two square-ended nation swords confused the grayscale evaluator; replace only Argyra's solid finial with an open ring, then rerun the same test.
- Pyrakanth's dark blade disappeared against the inventory backdrop; raise blade contrast and rerun the 96-pixel gate.
- Pale wood in a studio preview came from a color-space error; fix sRGB-to-linear conversion before changing the chosen material.

If the same failure persists after a bounded revision, return the evidence and unresolved question. Do not silently change the design brief or claim a gate passed because a previous output file exists.

## 7. Learn from the user's reaction

Present the actual rendered artifact and ask about what feels convincing, generic, too literal, or emotionally right. Record their **exact words** with artifact hash, view, and context using `record_feedback.py`. Store any model interpretation separately as a hypothesis. Do not turn “looks good” into invented numeric ratings. When possible, change one feature family per revision so a later reaction has a clear cause.

For this family, Wendell's approval led to preserving Argyra and Meridia, adding forged flame accents to Pyrakanth, and adding elegant carved wood to Virelune. Future feedback should continue from `review/v3-inventory.png`, not from a memory of the chat.

## 8. Integrate only when needed

`public/calrunia/weapons/jian/manifest.json` and `index.js` make the five models and inventory icons loadable. They do not equip a character or claim a path assignment. A future integration must align the character hand with `GripSocket`, remove conflicting held props, check animation clearance, and retest at gameplay camera and mobile sizes. Keep the release build reproducible from this packet.
