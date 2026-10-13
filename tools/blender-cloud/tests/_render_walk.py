"""Renders the walker in scene.glb from the side at glTF frames 0, 12, 24, 36 (E2). Run under the bpy venv.
usage: python _render_walk.py scene.glb OUT_DIR
"""
import math, os, sys

import bpy

glb, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=glb)
sc = bpy.context.scene
for o in list(sc.objects):
    if o.type == "MESH" and o.name != "Figure" and not o.find_armature():
        o.hide_render = True  # the stand-in asset; only the walker is looked at
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
cam.data.type, cam.data.ortho_scale = "ORTHO", 2.4
cam.location, cam.rotation_euler = (5, 0, 1.0), (math.radians(90), 0, math.radians(90))
sc.collection.objects.link(cam)
sc.camera = cam
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.data.energy, sun.rotation_euler = 3.5, (math.radians(50), 0, math.radians(60))
sc.collection.objects.link(sun)
sc.world = bpy.data.worlds.new("w")
sc.world.color = (0.8, 0.82, 0.85)
sc.render.engine, sc.cycles.device, sc.cycles.samples = "CYCLES", "CPU", 8
sc.render.resolution_x = sc.render.resolution_y = 240
for f in (0, 12, 24, 36):
    sc.frame_set(f + 1)  # Blender frame 1 is glTF time 0 (scene.py keys from frame 1)
    sc.render.filepath = os.path.join(out, f"walk_{f:02d}.png")
    bpy.ops.render.render(write_still=True)
