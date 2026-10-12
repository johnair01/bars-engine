# Tasks: Blender cloud hardening

## Before the build

- [x] [claude] Falsification test: Draco GLB decodes with `@gltf-transform/cli` and imports into pip `bpy`.
  Result 2026-10-12: passed. 515 KB to 5.1 MB, one mesh, 0.51 x 0.56 x 0.94 m, three 1K images.
- [x] [claude] 2.3 Read BlenderKit's terms and licence pages. Result 2026-10-12: no attribution needed; nothing on
  scripted API use either way; but Royalty Free models in a web page must not be extractable. The published
  viewer breaks that. New tasks 10 and 11 below.

## Steps only Wendell can take

- [ ] [wendell] **Do:** Check whether BlenderKit search works without a key from your own machine.
  **Where:** a terminal on your computer, outside the cloud container
  **Enter:** `curl -s "https://api.blenderkit.com/api/v1/search/?query=chair&page_size=1" | head -c 300`
  **Check:** JSON starting with `{"count":` means it works unauthenticated; an error message means a key is needed.
  **Device:** computer · **Safe to stop after:** yes

## Build

- [x] [claude] 1. `blenderkit_fetch.py`: glTF default, `BLENDERKIT_API_KEY`, persisted UUID, `--selftest`, 403 message.
  Result: selftest ok; with a fake key the header goes to api.blenderkit.com only, never to assets.blenderkit.com, and
  nothing is sent when unset; a 403 prints the API's message; the asset page URL in the sidecar returns 200.
- [x] [claude] 2. `prepare_asset.py`; `scene.py` takes `.glb` or `.blend`.
  Result: three CC0 glTFs decoded and imported (stool, table, two chairs). Meshopt decode untested: no sample asset used it.
- [x] [claude] 3. `scene.py`: UDIM preflight. Result: a synthetic two-tile image stops with the tile list; the old chair's one tile passed in the earlier spike.
- [x] [claude] 4. `scene.py`: triangle budget, texture cap, JPEG re-encode, size report and size stop.
  Result: a 617,708-triangle chair with 11 textures went to 25,000 triangles and 12.02 MB (stopped at the 12 MB limit),
  then 7.3 MB once non-normal maps were re-encoded as JPEG. Setting `image.file_format` did not change the export;
  re-encoding and repointing the nodes did.
- [x] [claude] 5. Run the chair through the new path. Result: the Royalty Free chair's decoded glTF imported at the same size as its .blend (0.51 x 0.56 x 0.94 m) in the earlier spike. The new path was exercised on CC0 chairs.
- [x] [claude] 6. Two other assets end to end. Result: a CC0 dining table (21,148 triangles, 1.3 MB GLB) and a CC0 chair, both looked at.
  A lamp was not run; the table and chairs stand in. Previews showed correct textures and placement.
- [x] [claude] 7. Viewer loads the model as a separate file. Result: artifacts do not serve `.glb`, so it ships as base64 in `model.json`. Loaded in headless Chromium over http, then published as version 5; the artifact lists both files.
- [x] [claude] 8. three@0.170.0 as ES modules. Result: same layout and stats (7 bones, 1,318 triangles, WalkCycle 2.04 s) in headless Chromium, no console errors. Ambient light raised to 0.85 pi so the floor matches the old brightness (red channel 227). The published page itself has not been viewed.
- [x] [claude] 9. README: asset checklist, the six problems and the seventh.
- [x] [claude] 10. CC0 by default, sidecar JSON, build refuses other licences. Result: a royalty_free sidecar stops the build with a message; the CC0 one builds.
- [x] [claude] 11. Published viewer now uses CC0 "Painted Wooden Chair 02" by Poly Haven (version 5). Earlier artifact versions, 1 to 4, still hold the Royalty Free chair in the artifact's history.
- [ ] [claude] The repo's checks pass; the preview builds.

## Verify and ship

- [ ] [claude] Definition of done in spec.md, checked, with test output pasted under each of the six problems.
- [ ] [claude] Board position: merges on the next board read unless flipped.
- [ ] [claude] Ledger record written; this file ticked.
