
#!/usr/bin/env python3
"""Heaven Sect contest — object 2: trigram floor (founder's hall, 30x20 m).

Standalone bpy script (Blender 4.2+/5.x, EEVEE):
  python3 obj2_trigram_floor.py           -> renders obj2.png (1280x720)
  python3 obj2_trigram_floor.py --check   -> prints poly counts + material list

Deterministic: fixed geometry, no randomness, no external asset imports.
Origin at the floor's visual base (z=0), +Y forward (entrance side), meters.
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

OUTPUT = Path("/home/workspace/bars-engine/tools/blender-cloud/make/contest/glm/obj2.png")

# Palette — cold mountain stone, bronze/gold, deep pine (restrained 3D set)
COL_STONE  = (0.360, 0.400, 0.372)
COL_WORN   = (0.235, 0.258, 0.243)
COL_BRONZE = (0.512, 0.368, 0.208)
COL_GOLD   = (0.760, 0.590, 0.240)
COL_PINE   = (0.048, 0.115, 0.075)
COL_IVORY  = (0.845, 0.815, 0.720)
COL_ASHEN  = (0.026, 0.038, 0.034)

FLOOR_W, FLOOR_D = 30.0, 20.0

TRIGRAMS = {  # bottom line -> top line, 1 = solid, 0 = broken
    "qian": (1, 1, 1), "dui": (1, 1, 0), "li": (1, 0, 1), "zhen": (1, 0, 0),
    "xun":  (0, 1, 1), "kan": (0, 1, 0), "gen": (0, 0, 1), "kun": (0, 0, 0),
}
# Later Heaven bagua around the Taiji. World dirs: N=+Y, E=+X.
LAYOUT = (
    ("li",  -90.0), ("kun", -135.0), ("dui", 180.0), ("qian", 135.0),
    ("kan",   90.0), ("gen",   45.0), ("zhen",   0.0), ("xun",  -45.0),
)

BAR_W, BAR_H, BAR_D = 1.40, 0.14, 0.02
ROW_STEP, SEG_W, BREAK = 0.24, 0.64, 0.12


def make_mesh(name, verts, faces, mat=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    if mat is not None:
        ob.data.materials.append(mat)
    return ob


def add_box(name, sx, sy, sz, cx, cy, cz, mat, rz=0.0):
    """Box centered at (cx, cy, cz), optionally rotated rz around Z."""
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    c, s = math.cos(rz), math.sin(rz)
    corners = []
    for lx, ly, lz in ((-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz),
                       (-hx, -hy,  hz), (hx, -hy,  hz), (hx, hy,  hz), (-hx, hy,  hz)):
        corners.append((cx + lx * c - ly * s, cy + lx * s + ly * c, cz + lz))
    faces = ((0, 1, 2, 3), (7, 6, 5, 4), (0, 4, 5, 1),
             (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0))
    return make_mesh(name, corners, faces, mat)


def fan_disc(name, r, seg, z, mat, a0=0.0, a1=2 * math.pi, cx=0.0, cy=0.0):
    verts = [(cx, cy, z)]
    for i in range(1, seg + 1):
        a = a0 + (a1 - a0) * i / seg
        verts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    faces = [(0, i, i + 1) for i in range(1, seg + 1)]
    return make_mesh(name, verts, faces, mat)


def annulus(name, r_in, r_out, seg, z, mat, cx=0.0, cy=0.0):
    verts = [(cx + r_out * math.cos(2 * math.pi * i / seg),
              cy + r_out * math.sin(2 * math.pi * i / seg), z) for i in range(seg)]
    verts += [(cx + r_in * math.cos(2 * math.pi * i / seg),
               cy + r_in * math.sin(2 * math.pi * i / seg), z) for i in range(seg)]
    faces = [(i, (i + 1) % seg, seg + (i + 1) % seg, seg + i) for i in range(seg)]
    return make_mesh(name, verts, faces, mat)


def make_material(name, color, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def build_object():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)

    mats = {
        "stone":  make_material("stone_floor", COL_STONE, 0.88),
        "worn":   make_material("worn_threshold", COL_WORN, 0.96),
        "bronze": make_material("bronze_border", COL_BRONZE, 0.42, 0.9),
        "gold":   make_material("gold_inlay", COL_GOLD, 0.32, 1.0),
        "pine":   make_material("pine_inlay", COL_PINE, 0.75),
        "ivory":  make_material("taiji_light", COL_IVORY, 0.60),
        "ashen":  make_material("taiji_dark", COL_ASHEN, 0.55),
    }

    # Hall floor slab — top surface is the visual base at z=0
    add_box("hall_floor", FLOOR_W, FLOOR_D, 0.30, 0.0, 0.0, -0.15, mats["stone"])

    # Bronze border frame (flush inlay, half-sunk into the slab)
    add_box("border_s", FLOOR_W, 0.5, 0.04, 0.0, -FLOOR_D / 2 + 0.25, 0.0, mats["bronze"])
    add_box("border_n", FLOOR_W, 0.5, 0.04, 0.0,  FLOOR_D / 2 - 0.25, 0.0, mats["bronze"])
    add_box("border_w", 0.5, FLOOR_D - 1.0, 0.04, -FLOOR_W / 2 + 0.25, 0.0, 0.0, mats["bronze"])
    add_box("border_e", 0.5, FLOOR_D - 1.0, 0.04,  FLOOR_W / 2 - 0.25, 0.0, 0.0, mats["bronze"])

    # Worn thresholds where ranks were given (forward/entrance side, +Y)
    add_box("threshold_main", 6.0, 1.6, 0.012, 0.0, 8.9, 0.007, mats["worn"])
    add_box("threshold_w", 2.0, 1.2, 0.012, -11.0, 9.2, 0.007, mats["worn"])
    add_box("threshold_e", 2.0, 1.2, 0.012,  11.0, 9.2, 0.007, mats["worn"])
    add_box("worn_path", 2.2, 4.2, 0.012, 0.0, 6.2, 0.007, mats["worn"])

    # Gold guide ring between center and trigram circle
    annulus("guide_ring", 5.5, 5.7, 64, 0.004, mats["gold"])

    # Eight trigram inlays on pine base plates
    R = 7.0
    for name, ang in LAYOUT:
        a = math.radians(ang)
        cx, cy = R * math.cos(a), R * math.sin(a)
        rz = a - math.pi / 2  # local +Y (top line) points outward from center
        fan_disc(f"tri_base_{name}", 1.0, 32, 0.004, mats["pine"], cx=cx, cy=cy)
        c, s = math.cos(rz), math.sin(rz)
        for row, solid in enumerate(TRIGRAMS[name]):
            ly = -ROW_STEP + row * ROW_STEP
            bx = cx - ly * s
            by = cy + ly * c
            if solid:
                add_box(f"tri_{name}_l{row}", BAR_W, BAR_H, BAR_D,
                        bx, by, 0.015, mats["gold"], rz=rz)
            else:
                for side, lx in (("a", -(SEG_W / 2 + BREAK / 2)),
                                 ("b",  (SEG_W / 2 + BREAK / 2))):
                    wx = cx + lx * c - ly * s
                    wy = cy + lx * s + ly * c
                    add_box(f"tri_{name}_l{row}{side}", SEG_W, BAR_H, BAR_D,
                            wx, wy, 0.015, mats["gold"], rz=rz)

    # Central Taiji medallion
    annulus("taiji_frame", 2.0, 2.35, 64, 0.004, mats["gold"])
    annulus("taiji_accent", 2.35, 2.5, 64, 0.004, mats["pine"])
    fan_disc("taiji_light", 2.0, 64, 0.006, mats["ivory"])
    fan_disc("taiji_dark_half", 2.0, 64, 0.008, mats["ashen"],
             a0=math.pi, a1=2 * math.pi)
    fan_disc("taiji_dark_bulge", 1.0, 48, 0.010, mats["ashen"], cx=0.0, cy=1.0)
    fan_disc("taiji_light_bulge", 1.0, 48, 0.010, mats["ivory"], cx=0.0, cy=-1.0)
    fan_disc("taiji_dot_light", 0.28, 24, 0.012, mats["ivory"], cx=0.0, cy=1.0)
    fan_disc("taiji_dot_dark", 0.28, 24, 0.012, mats["ashen"], cx=0.0, cy=-1.0)

    # Key: warm point light over the medallion
    key = bpy.data.lights.new("key_point", 'POINT')
    key.energy = 900.0
    key.color = (1.0, 0.88, 0.68)
    key.shadow_soft_size = 0.6
    key_ob = bpy.data.objects.new("key_point", key)
    key_ob.location = (0.0, 0.0, 9.0)
    bpy.context.collection.objects.link(key_ob)

    # Fill: cool rectangular area light from the hall's high windows
    fill = bpy.data.lights.new("fill_area", 'AREA')
    fill.shape = 'RECTANGLE'
    fill.size = 10.0
    fill.size_y = 6.0
    fill.energy = 1600.0
    fill.color = (0.82, 0.90, 1.0)
    fill_ob = bpy.data.objects.new("fill_area", fill)
    fill_ob.location = (9.0, -9.0, 7.5)
    aim = Vector((0.0, 0.0, 0.8)) - Vector(fill_ob.location)
    fill_ob.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(fill_ob)

    # Camera: low-angle-enough turntable framing that fits the 30 m floor
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 24.0
    cam_ob = bpy.data.objects.new("Camera", cam_data)
    cam_ob.location = (0.0, -19.0, 15.0)
    look = Vector((0.0, 0.8, 0.0)) - Vector(cam_ob.location)
    cam_ob.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(cam_ob)

    world = bpy.data.worlds.new("HallWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.012, 0.018, 0.020, 1.0)
    bg.inputs[1].default_value = 1.0

    return {"objects": list(bpy.data.objects), "materials": mats,
            "world": world, "camera": cam_ob}


def render_scene(state):
    scene = bpy.context.scene
    engines = {e.identifier for e in
               bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    scene.render.engine = ("BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines
                           else "BLENDER_EEVEE")
    scene.world = state["world"]
    scene.camera = state["camera"]
    try:
        scene.eevee.taa_render_samples = 64
    except AttributeError:
        pass
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = str(OUTPUT)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print(f"rendered: {OUTPUT}")
    print("READY")


def main():
    state = build_object()
    if "--check" in sys.argv:
        meshes = [o for o in bpy.data.objects if o.type == 'MESH']
        polys = sum(len(o.data.polygons) for o in meshes)
        mats = sorted({m.name for o in meshes for m in o.data.materials if m})
        print(f"meshes: {len(meshes)}")
        print(f"total_polys: {polys}")
        for m in mats:
            print(f"material: {m}")
        return
    render_scene(state)


if __name__ == "__main__":
    main()
