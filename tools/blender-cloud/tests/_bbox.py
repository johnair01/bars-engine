"""Imports a GLB with bpy and prints {"tris", "bbox"} (world space, metres). Run under the bpy venv. Used by A1."""
import json, sys

import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[1])
dg = bpy.context.evaluated_depsgraph_get()
tris, pts = 0, []
for o in bpy.context.scene.objects:
    if o.type == "MESH":
        me = o.evaluated_get(dg).to_mesh()
        me.calc_loop_triangles()
        tris += len(me.loop_triangles)
        pts += [o.matrix_world @ v.co for v in me.vertices]
print("BBOX " + json.dumps({"tris": tris, "bbox": [[min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]]}))
