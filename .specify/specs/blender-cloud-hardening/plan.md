# Plan: Blender cloud hardening

<!-- Spec: ./spec.md. -->

## Approach

Fix the asset path first, because three of the six problems (Draco, UDIM, size) shrink once the glTF variant is
the default: it arrives with plain 1K textures and a small file. Then harden the fetch script, then the viewer.
The viewer goes last because it works today and the risk of changing it is highest. The full Blender build was
weighed as the Draco fix and set aside: it is a large download that replaces the interpreter, while the decode
step is one command and already proven.

## Files touched

| File | Change |
|---|---|
| `tools/blender-cloud/blenderkit_fetch.py` | glTF default, optional key env var, persisted UUID, `--selftest`, clearer 403 message |
| `tools/blender-cloud/prepare_asset.py` (new) | Detect Draco or meshopt in a GLB, decode with gltf-transform, report what it did |
| `tools/blender-cloud/scene.py` | Accept `.glb` or `.blend`, UDIM preflight, triangle budget, texture cap, JPEG base colour, size report |
| `tools/blender-cloud/viewer_template.html`, `build_viewer.py` | Module build of three, external GLB fetch, same design |
| `tools/blender-cloud/README.md` | New asset checklist; problems and what each became |

## Order

1. Read BlenderKit's API and terms pages (task 2.3). It can stop the work, so it goes first.
2. Fetch script: glTF default, key env var, persisted UUID, selftest.
3. `prepare_asset.py`, then `scene.py` changes. Run the chair, then a second asset.
4. Viewer: external GLB first on the old three, then the module upgrade, each republished only after a local screenshot.
5. README and checks.

## Rollback

The artifact keeps its earlier versions. If a republished viewer misbehaves on the real page, republish the previous
version's file from git history. The page itself cannot be viewed from this container, so the first check after
each republish is a headless load of the same file locally.

## What Wendell does, and when

One optional step, after task 2.2: confirm whether the BlenderKit search works with no proxy and no key from his
own machine. Nothing else waits on it. It is in tasks.md and goes on the steps tab when the council board is
reachable from a session.
