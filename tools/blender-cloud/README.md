# Blender in the cloud

Headless Blender 5.2.2 as the `bpy` pip package, used to arrange a free
BlenderKit asset with a rigged walking figure, render a preview, and export an
animated GLB for a three.js viewer. Nothing here needs a display or a GPU.

Published viewer: https://claude.ai/artifact/SUZYu1w1P5b61Cn6pj7Vwg

## Run it

```bash
uv venv --python 3.13 /home/user/blenv
uv pip install --python /home/user/blenv/bin/python bpy==5.2.2

export SSL_CERT_FILE=/root/.ccr/ca-bundle.crt
python3 tools/blender-cloud/blenderkit_fetch.py "wooden chair" assets/ --file-type blend
/home/user/blenv/bin/python -I tools/blender-cloud/scene.py assets/<Name>.blend out/
python3 tools/blender-cloud/build_viewer.py out/scene.glb out/cloud-walker.html
```

`scene.py` renders `out/preview.png` (854x480, CPU Cycles, 24 samples) and
exports `out/scene.glb`. Look at the preview before exporting for real. Keep
downloaded assets and outputs out of git.

## Files

| File | Job |
|---|---|
| `blenderkit_fetch.py` | Search BlenderKit, take the Nth free result, download one file type. |
| `scene.py` | Import the asset, build the six-box figure, rig it with 7 bones (automatic weights), key a 48-frame walk, render, export. |
| `viewer_template.html`, `build_viewer.py` | Embed the GLB in the Cloud Walker viewer page. |

## Things that cost time

- **API key:** the sandbox proxy adds the BlenderKit key for `api.blenderkit.com`. Send no key and never read it.
- **Download links:** a file's `downloadUrl` needs `?scene_uuid=<any new uuid>`, or it returns 403 "Parameter scene_uuid not set". The reply holds a `filePath` on `assets.blenderkit.com`, which must be on the network allowlist.
- **User-Agent:** `assets.blenderkit.com` returns 403 to Python's default User-Agent. Curl works, and so does the fetch script.
- **glTF variants:** BlenderKit glTF files use Draco compression, and the `bpy` pip wheel has no Draco decoder, so they fail to import. Download the `blend` file type instead.
- **Size:** a `.blend` can be over 100 MB with 8K textures. `scene.py` shrinks textures to 1K and decimates to 15% so the page stays under 5 MB.
- **UDIM textures:** the glTF exporter cannot read tiled images. `scene.py` copies tile 1001 into a plain image first.
- **three.js:** use `three@0.128.0` from `cdn.jsdelivr.net/npm`. cdnjs lacks the loaders.
- **Asset check:** the chair's front and scale were found by looking at the preview. Do the same for a new asset and adjust `chair.rotation_euler` and `chair.location` in `scene.py`.

## Licences

The chair is "Vintage Wooden Chair" by Matteo Pascale, a free royalty-free
BlenderKit model. Credit the author on any page that shows it. Check the
licence field the fetch script prints for every new asset.
