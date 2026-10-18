"""Run a blender-skills script (.claude/skills/blender-*/scripts) under the bpy pip package.

The skills' own run_in_blender.py needs a Blender executable; here Blender is the `bpy` module, so this loads an
optional file and runs the script in-process. Its JSON comes back on one @@JSON@@ line.

Output is kept short because every line lands in the agent's context: Blender's own log goes to a file, and any list or
nested table longer than 6 items is cut to its first 3 plus a count, and zero fields inside a table are dropped. The full JSON is written to --out (default
/tmp/skill_run/<script>.json); pass --full to print it whole instead. `-- --help` prints a script's arguments, so its
source need not be read.

This container, known before you start (each cost a failed run in the 2026-10-18 A/B test):
- No GPU and no libEGL: EEVEE and Workbench cannot render. Preview with Cycles CPU, about 32-64 samples.
- `mathutils.noise.noise(v)`, not `from mathutils import Noise`.
- WebP export fails on 1-channel images; convert them to RGB or use `--set export_image_format=JPEG`.
- No meshopt or Draco in this bpy build: shrink with instancing, decimation and smaller textures.
- qa_check flags every scaled instance as "unapplied scale" and source-asset z-fighting as errors; on a scatter of
  instances those two are expected. `floating` is not: decimating a photoscan leaves loose fragments, and they ship
  unless removed. Delete mesh islands under about 12 verts after decimating, then re-run qa_check until it is empty.

The calls a web prop or scene needs (no SKILL.md beyond blender-core is required for these):
    skill_run.py blender-export-pipelines/export_asset.py --blend s.blend -- --preset web --out s.glb [--set k=v]
    skill_run.py blender-asset-qa/qa_check.py --glb s.glb -- --profile game
    skill_run.py blender-game-optimization/mesh_stats.py --glb s.glb -- --budget web

    /home/user/blenv/bin/python tools/blender-cloud/skill_run.py blender-asset-qa/qa_check.py --glb robe.glb -- --profile game
    /home/user/blenv/bin/python tools/blender-cloud/skill_run.py blender-simulation/sim_setup.py --blend in.blend -- --cloth Sheet --bake
"""
import json
import os
import pathlib
import runpy
import sys
import tempfile

import bpy

SKILLS = pathlib.Path(__file__).resolve().parents[2] / ".claude" / "skills"

args = sys.argv[1:]
rest = args[args.index("--") + 1:] if "--" in args else []
head = args[:args.index("--")] if "--" in args else args
script = SKILLS / head[0].replace("/", "/scripts/", 1)
full = "--full" in head
help_only = "--help" in rest or "-h" in rest
head = [a for a in head if a != "--full"]
opts = dict(zip(head[1::2], head[2::2]))
out = pathlib.Path(opts.get("--out", f"/tmp/skill_run/{script.stem}.json"))
MARK = "@@JSON@@"


def short(v, keep=3, limit=6, depth=0):
    """Cut long lists and dicts to their first items and a count, and drop zero fields below the top level, so a
    190-flag QA result or a 40-object scene costs a few lines."""
    if isinstance(v, dict):
        items = [(k, x) for k, x in v.items() if depth < 2 or x not in (0, 0.0, [], {}, None, False)]
        cut = items[:keep] if len(items) > limit and depth else items
        d = {k: short(x, keep, limit, depth + 1) for k, x in cut}
        if len(cut) < len(items):
            d["..."] = f"{len(items) - keep} more in {out}"
        return d
    if isinstance(v, list):
        if len(v) > limit:
            return [short(x, keep, limit, depth + 1) for x in v[:keep]] + [f"... {len(v) - keep} more in {out}"]
        return [short(x, keep, limit, depth + 1) for x in v]
    return v


# Blender writes its log to fd 1 from C, so swap the descriptor itself, not only sys.stdout.
log = tempfile.NamedTemporaryFile("w+", prefix="skill_run_", suffix=".log", delete=False)
real = os.dup(1)
sys.stdout.flush()
if not help_only:
    os.dup2(log.fileno(), 1)
code = 0
try:

    if "--blend" in opts:
        bpy.ops.wm.open_mainfile(filepath=opts["--blend"])
    else:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        if "--glb" in opts:
            bpy.ops.import_scene.gltf(filepath=opts["--glb"])
    sys.path.insert(0, str(script.parent))
    sys.argv = [str(script), "--", *rest]
    runpy.run_path(str(script), run_name="__main__")
except SystemExit as e:
    code = e.code if isinstance(e.code, int) else 1
except Exception as e:  # report in one line, not a traceback
    print(MARK + json.dumps({"ok": False, "error": f"{type(e).__name__}: {e}"}), flush=True)
    code = 1
finally:
    sys.stdout.flush()
    os.dup2(real, 1)
    os.close(real)

lines = pathlib.Path(log.name).read_text(errors="replace").splitlines()
found = [ln[len(MARK):] for ln in lines if ln.startswith(MARK)]
if help_only:
    pass
elif found:
    data = json.loads(found[-1])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(data, indent=1))
    print(MARK + json.dumps(data if full else short(data), separators=(",", ":")))
else:
    print(MARK + json.dumps({"ok": False, "error": "no result", "log_tail": lines[-8:], "log": log.name}))
    code = code or 1
sys.exit(code)
