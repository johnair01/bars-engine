# Tasks: Blender cloud hardening

## Before the build

- [x] [claude] Falsification test: Draco GLB decodes with `@gltf-transform/cli` and imports into pip `bpy`.
  Result 2026-10-12: passed. 515 KB to 5.1 MB, one mesh, 0.51 x 0.56 x 0.94 m, three 1K images.
- [ ] [claude] 2.3 Read BlenderKit's API and terms pages for scripted use and licence attribution. Record what they say.
  If unclear, raise it as a board question.

## Steps only Wendell can take

- [ ] [wendell] **Do:** Check whether BlenderKit search works without a key from your own machine.
  **Where:** a terminal on your computer, outside the cloud container
  **Enter:** `curl -s "https://api.blenderkit.com/api/v1/search/?query=chair&page_size=1" | head -c 300`
  **Check:** JSON starting with `{"count":` means it works unauthenticated; an error message means a key is needed.
  **Device:** computer · **Safe to stop after:** yes

## Build

- [ ] [claude] 1. `blenderkit_fetch.py`: default to glTF, add `BLENDERKIT_API_KEY` support, persist one UUID, add `--selftest`, name the missing parameter on a 403.
- [ ] [claude] 2. `prepare_asset.py`: detect and decode Draco or meshopt; `scene.py` takes `.glb` or `.blend`.
- [ ] [claude] 3. `scene.py`: UDIM preflight with a stop message for more than one tile.
- [ ] [claude] 4. `scene.py`: triangle budget, texture cap, JPEG base colour, size and triangle report.
- [ ] [claude] 5. Run the chair through the new path; compare dimensions and look at the preview.
- [ ] [claude] 6. Run two other free assets (a table and a lamp) end to end; look at both previews.
- [ ] [claude] 7. Viewer: load the GLB as a separate artifact file; confirm in headless Chromium, then republish.
- [ ] [claude] 8. Viewer: move to an ES-module three at one pinned version; confirm the screenshot and stats; republish.
- [ ] [claude] 9. README: asset checklist, and what each of the six problems became.
- [ ] [claude] The repo's checks pass; the preview builds.

## Verify and ship

- [ ] [claude] Definition of done in spec.md, checked, with test output pasted under each of the six problems.
- [ ] [claude] Board position: merges on the next board read unless flipped.
- [ ] [claude] Ledger record written; this file ticked.
