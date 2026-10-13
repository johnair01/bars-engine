"""Makes the synthetic fixtures the bpy tests need, so no test downloads anything it does not have to.
Run under the bpy venv:
    python _make_fixtures.py cube OUT.glb          a 12-triangle box, the stand-in asset for the walker tests
    python _make_fixtures.py udim OUT.blend N      a box whose material uses a UDIM image with N tiles (G3)
"""
import sys

import bpy

kind, out = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_cube_add(size=0.5, location=(0, 0, 0.25))
box = bpy.context.active_object
box.name = "TestBox"
if kind == "cube":
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB")
else:
    im = bpy.data.images.new("udim_test", 8, 8, tiled=True)
    for n in range(1, int(sys.argv[3])):
        im.tiles.new(tile_number=1001 + n)
    im.pack()
    mat = bpy.data.materials.new("udim_mat")
    mat.use_nodes = True
    node = mat.node_tree.nodes.new("ShaderNodeTexImage")
    node.image = im
    mat.node_tree.links.new(node.outputs["Color"], mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"])
    box.data.materials.append(mat)
    bpy.ops.wm.save_as_mainfile(filepath=out)
