# Spec: Blender cloud hardening

<!-- Tooling fix, so the six-faces pipeline's "not_for" applies: a fix to behaviour that already exists gets a
     plan and a pull request, not the full feature pipeline. Kept in the spec kit layout for the record. -->

## The ask

> "yeah let's make a remediation plan for those problems. They all do seem like they are important to fix"
> (Wendell, 2026-10-12, cloud session, after the list of six problems in `tools/blender-cloud/README.md`)

**Who it is for:** whoever runs the Blender cloud pipeline next, a session or Wendell.
**What they feel now, and what should change:** each new asset can break in a new way, and the fixes live in
people's heads. The next asset should either work or stop with a message that says what to do.

## Purpose

Make `tools/blender-cloud/` work on assets other than the chair. Six known problems, each with a fix, a test
and a stop condition. Nothing here changes what the published viewer shows.

## What was proven before this plan (2026-10-12 spikes)

- The chair's glTF download is Draco-compressed. `npx @gltf-transform/cli copy in.glb out.glb` decodes it
  (515 KB to 5.1 MB), and the pip `bpy` imports the result: one mesh, 0.51 x 0.56 x 0.94 m, three 1K textures.
  The 122 MB `.blend` is not needed for this asset.
- The chair's UDIM image has one tile (1001). The single-tile workaround was correct for it. Other assets are untested.
- Blender 5.2.2 for Linux is listed on download.blender.org. Not downloaded or tried.

## The six problems

| # | Problem | Fix | Test |
|---|---|---|---|
| 1 | The fetch script relies on the sandbox proxy for the BlenderKit key. Outside it, unknown. | Read an optional `BLENDERKIT_API_KEY` env var and send it as a Bearer header only when set. Never print it, never write it to disk. | Stub server shows the header is sent when set and absent when not. Real run still works in the sandbox. |
| 2 | `scene_uuid` is an undocumented requirement; a random UUID passes today. | Generate one UUID per machine and reuse it. Add `--selftest` that resolves one thumbnail link. On a 403, print which parameter the API named. Read BlenderKit's API and terms pages for scripted use. | `--selftest` passes now. The 403 message appears when the parameter is removed. |
| 3 | The `bpy` wheel cannot decode Draco, and BlenderKit glTFs use it. | Fetch the glTF variant by default. Decode with `@gltf-transform/cli` before import. Fall back to the `.blend` only if there is no glTF. `scene.py` accepts `.glb` or `.blend`. | Chair imports from the decoded GLB with the same dimensions as the `.blend`. A second asset does the same. |
| 4 | UDIM textures crash the glTF exporter. The one-tile copy would silently drop other tiles. | Preflight: list every tiled image and its tiles. One tile, copy it. More than one, stop and say which asset and tiles. The glTF variant is already baked to plain textures, which avoids most cases. | A synthetic two-tile image stops with the message. The chair still passes. |
| 5 | The page nears the 16 MB limit fast: base64 adds a third, and decimation uses a ratio that means different things per asset. | Decimate to a triangle budget, not a ratio. Cap texture size. Export base colour as JPEG. Print GLB size and triangles. Publish the GLB as a separate artifact file and have the viewer fetch it. | Size and triangle report matches the viewer's stats. The viewer loads the external GLB on the published URL. |
| 6 | The viewer pins three@0.128.0 because cdnjs lacked the loaders. | Move to an ES-module build of three at one exact version at least two weeks old, from cdn.jsdelivr.net/npm, with the same layout, controls and error message. | Headless Chromium screenshot at the same frame matches the old one by eye; the stats strip shows the same bone and triangle counts. |

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Default asset file type | glTF, decoded locally, over `.blend` | council (spike result) |
| Decode tool | `@gltf-transform/cli` via npx | council (spike result); alternative kept: the full Blender build |
| Multi-tile UDIM | Stop with a message; no atlas baking | council: baking changes UVs and is more code than the problem warrants |
| Viewer upgrade timing | Last, after the asset path is solid | council: the viewer works today |

## Reserved items

- Whether BlenderKit's terms allow scripted downloads, and what attribution their licence needs beyond the
  author credit already on the page. Task 2.3 reads them. If they are unclear, that becomes a board question, not a decision here.

## How we will know it failed

- **The cheap test, run before building:** decode and import a Draco GLB with the pip `bpy`. Run on 2026-10-12.
  It passed.
- **The result that stops the work:** a second, different free asset (a table or lamp) fails the full run after
  the fixes: fetch, decode, import, render, export, viewer. Then the asset path needs a rethink, with the full
  Blender build as the next thing to try.

## Definition of done

- [ ] Each of the six problems has its fix and its test passing, with output pasted in tasks.md.
- [ ] Two assets other than the chair run end to end, each with a 480p preview that was looked at.
- [ ] `tools/blender-cloud/README.md` lists what each problem became and the new asset checklist.
- [ ] The viewer is republished to https://claude.ai/artifact/SUZYu1w1P5b61Cn6pj7Vwg and loads in headless Chromium.
- [ ] The repo's checks pass and the Vercel preview builds.
