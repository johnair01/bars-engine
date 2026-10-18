"""Run a blender-skills script (.claude/skills/blender-*/scripts) under the bpy pip package.

The skills' own run_in_blender.py needs a Blender executable; here Blender is the `bpy` module, so this loads an
optional file and runs the script in-process. Its JSON comes back on one @@JSON@@ line.

    /home/user/blenv/bin/python tools/blender-cloud/skill_run.py blender-asset-qa/qa_check.py --glb robe.glb -- --profile game
    /home/user/blenv/bin/python tools/blender-cloud/skill_run.py blender-simulation/sim_setup.py --blend in.blend -- --cloth Sheet --bake
"""
import pathlib
import runpy
import sys

import bpy

SKILLS = pathlib.Path(__file__).resolve().parents[2] / ".claude" / "skills"

args = sys.argv[1:]
rest = args[args.index("--") + 1:] if "--" in args else []
head = args[:args.index("--")] if "--" in args else args
script = SKILLS / head[0].replace("/", "/scripts/", 1)
opts = dict(zip(head[1::2], head[2::2]))

if "--blend" in opts:
    bpy.ops.wm.open_mainfile(filepath=opts["--blend"])
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if "--glb" in opts:
        bpy.ops.import_scene.gltf(filepath=opts["--glb"])

sys.path.insert(0, str(script.parent))
sys.argv = [str(script), "--", *rest]
runpy.run_path(str(script), run_name="__main__")
