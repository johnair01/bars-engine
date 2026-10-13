"""The cave's three stone textures as seamless tiles for cave.js. Run: /home/user/blenv/bin/python content/ontology-game/cave/bake_tiles.py
Writes textures/wet_stone.jpg, dry_stone.jpg and crystal_vein.jpg (512 px) beside this file. Each tile is one square
of stone TILE metres on a side. Its point is taken on a torus in 4D (x, y from u; z, w from v), so the pattern
repeats exactly at the edges and there is no seam. The colours are neutral greys: cave.js tints them with the charge's
wall colour. crystal_vein keeps its violet veins, which glow. v runs down the wall, so wet_stone's streaks run down."""
import math, os, sys
import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from textures import node, texture  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "textures")
PX, TILE, QUALITY = 512, 4.0, 82
TILES = (("wet_stone", "#a8a8a8"), ("dry_stone", "#9a9a9a"), ("crystal_vein", "#a0a0a0"))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"  # Workbench and EEVEE need a GPU; the cloud has none
sc.cycles.device, sc.cycles.samples = "CPU", 1
bpy.ops.mesh.primitive_plane_add(size=1)
plane = bpy.context.active_object
os.makedirs(OUT, exist_ok=True)


def circle(nt, uv_axis, trig):
    """TILE / 2 pi times cos or sin of 2 pi times one UV axis."""
    ang = node(nt, "ShaderNodeMath", operation="MULTIPLY")
    nt.links.new(uv_axis, ang.inputs[0])
    ang.inputs[1].default_value = 2 * math.pi
    f = node(nt, "ShaderNodeMath", operation=trig)
    nt.links.new(ang.outputs[0], f.inputs[0])
    r = node(nt, "ShaderNodeMath", operation="MULTIPLY")
    nt.links.new(f.outputs[0], r.inputs[0])
    r.inputs[1].default_value = TILE / (2 * math.pi)
    return r.outputs[0]


for kind, colour in TILES:
    img = bpy.data.images.new(kind, PX, PX)
    m = bpy.data.materials.new(kind)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    uv = node(nt, "ShaderNodeSeparateXYZ")
    nt.links.new(node(nt, "ShaderNodeTexCoord").outputs["UV"], uv.inputs[0])
    vec = node(nt, "ShaderNodeCombineXYZ")
    for i, (axis, trig) in enumerate((("X", "COSINE"), ("X", "SINE"), ("Y", "COSINE"))):
        nt.links.new(circle(nt, uv.outputs[axis], trig), vec.inputs[i])
    w = circle(nt, uv.outputs["Y"], "SINE")
    col = texture(nt, kind, colour, vec.outputs[0], w)
    emit, out = node(nt, "ShaderNodeEmission"), node(nt, "ShaderNodeOutputMaterial")
    nt.links.new(col, emit.inputs["Color"])
    nt.links.new(emit.outputs[0], out.inputs["Surface"])
    nt.nodes.active = node(nt, "ShaderNodeTexImage", image=img)
    plane.data.materials.clear()
    plane.data.materials.append(m)
    bpy.ops.object.bake(type="EMIT", margin=0)
    path = os.path.join(OUT, kind + ".jpg")
    img.file_format, sc.render.image_settings.quality = "JPEG", QUALITY
    img.save(filepath=path, quality=QUALITY)
    print(f"wrote {path}: {os.path.getsize(path) // 1024} KB")
