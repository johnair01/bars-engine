
#!/usr/bin/env python3
"""Heaven Sect contest — object 4: sunken hearth with spirit jars (Shaman Elder's cave house).

Standalone bpy script (Blender 4.2+/5.x, EEVEE):
  python3 obj4.py           -> renders obj4.png (1280x720 turntable frame)
  python3 obj4.py --check   -> prints poly counts + material list

Deterministic: fixed geometry, sin-based variation only (no random module),
pure bpy — no external asset imports, no urllib, no os.system.
Origin at the hearth's visual base (pit centre, floor level z=0), +Y forward
(toward the cave's inner dark), real-world meters.
"""
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

OUTPUT = Path("/home/workspace/bars-engine/tools/blender-cloud/make/contest/glm/obj4.png")

# Palette — cold mountain stone (grey-green), bronze accent, deep pine darks,
# warm ember/talisman glow as the one hot accent family.
COL_FLOOR   = (0.300, 0.335, 0.310)
COL_CAVE    = (0.160, 0.190, 0.175)
COL_RING    = (0.380, 0.415, 0.385)
COL_ASH     = (0.130, 0.125, 0.120)
COL_EMBER   = (0.220, 0.045, 0.015)
COL_COAL    = (0.060, 0.020, 0.012)
COL_GLAZE   = (0.330, 0.400, 0.360)
COL_EARTH   = (0.420, 0.295, 0.200)
COL_BRONZE  = (0.440, 0.310, 0.160)
COL_PAPER   = (0.840, 0.790, 0.660)
COL_TALIS   = (0.500, 0.300, 0.100)

PIT_R, PIT_DEPTH, FLOOR_R = 0.78, 0.55, 3.20
JAR_ANGLES = (15.0, 78.0, 150.0, 218.0, 262.0)
JAR_HEIGHTS = (0.50, 0.78, 0.66, 0.44, 0.57)


def new_mat(name, color, rough=0.85, metal=0.0, emit=None, emit_str=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")

    def set_in(names, value):
        for n in names:
            s = bsdf.inputs.get(n)
            if s is not None:
                s.default_value = value
                return

    set_in(("Base Color",), color)
    set_in(("Roughness",), rough)
    set_in(("Metallic",), metal)
    if emit is not None:
        set_in(("Emission Color", "Emission"), emit)
        set_in(("Emission Strength",), emit_str)
    return m


def make_mesh(name, verts, faces, mat=None, smooth=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    if mat is not None:
        ob.data.materials.append(mat)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return ob


def lathe(name, profile, mat, segs=28, closed=False, caps=True, smooth=True):
    """Revolve a (radius, z) profile around the Z axis."""
    verts, rings = [], []
    for (r, z) in profile:
        ring = []
        for i in range(segs):
            a = 2.0 * math.pi * i / segs
            ring.append(len(verts))
            verts.append((r * math.cos(a), r * math.sin(a), z))
        rings.append(ring)
    faces = []
    span = range(len(rings)) if closed else range(len(rings) - 1)
    for j in span:
        j2 = (j + 1) % len(rings)
        for i in range(segs):
            i2 = (i + 1) % segs
            faces.append((rings[j][i], rings[j][i2], rings[j2][i2], rings[j2][i]))
    if not closed and caps:
        r0, z0 = profile[0]
        r1, z1 = profile[-1]
        if r0 > 1e-5:
            c = len(verts)
            verts.append((0.0, 0.0, z0))
            for i in range(segs):
                faces.append((rings[0][(i + 1) % segs], rings[0][i], c))
        if r1 > 1e-5:
            c = len(verts)
            verts.append((0.0, 0.0, z1))
            for i in range(segs):
                faces.append((rings[-1][i], rings[-1][(i + 1) % segs], c))
    return make_mesh(name, verts, faces, mat, smooth)


def blob(name, r, loc, mat, squish=0.65, wobble=0.10, phase=0.0, su=10, sv=6):
    """Low-poly sphere with deterministic sin-based wobble (stones, embers)."""
    verts = [(0.0, 0.0, r)]
    rings = []
    for v in range(1, sv):
        phi = math.pi * v / sv
        ring = []
        for u in range(su):
            th = 2.0 * math.pi * u / su
            f = 1.0 + wobble * math.sin(3.0 * th + phase) * math.sin(2.0 * phi + 1.7 * phase)
            rr = r * f
            ring.append(len(verts))
            verts.append((rr * math.sin(phi) * math.cos(th),
                          rr * math.sin(phi) * math.sin(th),
                          rr * math.cos(phi)))
        rings.append(ring)
    bot = len(verts)
    verts.append((0.0, 0.0, -r))
    faces = []
    for u in range(su):
        u2 = (u + 1) % su
        faces.append((0, rings[0][u2], rings[0][u]))
    for j in range(len(rings) - 1):
        for u in range(su):
            u2 = (u + 1) % su
            faces.append((rings[j][u], rings[j][u2], rings[j + 1][u2], rings[j + 1][u]))
    for u in range(su):
        u2 = (u + 1) % su
        faces.append((bot, rings[-1][u], rings[-1][u2]))
    ob = make_mesh(name, verts, faces, mat, smooth=True)
    ob.scale = (1.0, 1.0, squish)
    ob.location = loc
    return ob


def box(name, sx, sy, sz, loc, mat, rx=0.0, ry=0.0, rz=0.0):
    hx, hy, hz = sx / 2, sy / 2, sz / 2
    verts = [(-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz),
             (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)]
    faces = [(0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    ob = make_mesh(name, verts, faces, mat)
    ob.location = loc
    ob.rotation_euler = (rx, ry, rz)
    return ob


def tube(name, p0, p1, r, mat, segs=8):
    """Cylinder between two world-space points (tripod legs)."""
    d = Vector(p1) - Vector(p0)
    ln = d.length
    d = d / ln
    up = Vector((0.0, 0.0, 1.0)) if abs(d.z) < 0.95 else Vector((1.0, 0.0, 0.0))
    u = d.cross(up).normalized()
    v = d.cross(u).normalized()
    verts, faces = [], []
    for p in (p0, p1):
        for i in range(segs):
            a = 2.0 * math.pi * i / segs
            off = r * (math.cos(a) * u + math.sin(a) * v)
            verts.append((p[0] + off.x, p[1] + off.y, p[2] + off.z))
    for i in range(segs):
        i2 = (i + 1) % segs
        faces.append((i, i2, segs + i2, segs + i))
    for cap_center, ring_base in ((p0, 0), (p1, segs)):
        c = len(verts)
        verts.append(cap_center)
        for i in range(segs):
            i2 = (i + 1) % segs
            faces.append((c, ring_base + i, ring_base + i2))
    return make_mesh(name, verts, faces, mat, smooth=True)


def disc(name, r, z, mat, segs=28):
    verts = [(0.0, 0.0, z)]
    for i in range(segs):
        a = 2.0 * math.pi * i / segs
        verts.append((r * math.cos(a), r * math.sin(a), z))
    faces = [(0, i + 1, (i + 1) % segs + 1) for i in range(segs)]
    return make_mesh(name, verts, faces, mat)


def jar_profile(h, rb):
    belly = rb * 1.55
    neck = rb * 0.62
    lip = rb * 0.80
    return [(rb * 0.82, 0.0), (rb, 0.05 * h), (belly, 0.38 * h),
            (belly * 1.02, 0.50 * h), (rb * 0.90, 0.68 * h), (neck, 0.82 * h),
            (neck * 1.02, 0.86 * h), (lip, 0.92 * h), (lip * 0.88, 0.97 * h),
            (lip * 0.80, h)]


def build_object():
    mats = {
        "stone_floor": new_mat("stone_floor", COL_FLOOR, rough=0.90),
        "stone_cave": new_mat("stone_cave", COL_CAVE, rough=0.95),
        "stone_ring": new_mat("stone_ring", COL_RING, rough=0.85),
        "ash": new_mat("ash", COL_ASH, rough=1.0),
        "ember": new_mat("ember", COL_EMBER, rough=0.90,
                         emit=(1.0, 0.34, 0.07), emit_str=5.0),
        "coal_glow": new_mat("coal_glow", COL_COAL, rough=1.0,
                             emit=(1.0, 0.30, 0.08), emit_str=1.6),
        "stoneware_green": new_mat("stoneware_green", COL_GLAZE, rough=0.45),
        "stoneware_brown": new_mat("stoneware_brown", COL_EARTH, rough=0.55),
        "bronze": new_mat("bronze", COL_BRONZE, rough=0.38, metal=1.0),
        "paper": new_mat("paper", COL_PAPER, rough=0.90),
        "talisman_glow": new_mat("talisman_glow", COL_TALIS, rough=0.80,
                                 emit=(1.0, 0.62, 0.26), emit_str=3.2),
    }

    # Cave house shell: one wobbling dark dome, camera sits inside it.
    blob("cave_shell", 4.6, (0.0, 0.4, 0.6), mats["stone_cave"],
         squish=0.80, wobble=0.22, phase=0.7, su=24, sv=10)

    # Stone floor with the sunken pit opening (annular slab, z -0.12..0).
    lathe("floor", [(PIT_R, -0.12), (FLOOR_R, -0.12), (FLOOR_R, 0.0), (PIT_R, 0.0)],
          mats["stone_floor"], segs=48, closed=True, caps=False)

    # Pit shaft wall + bed: ash, faint coal glow, ember lumps.
    lathe("pit_wall", [(PIT_R, 0.0), (PIT_R, -PIT_DEPTH)], mats["stone_cave"],
          segs=48, caps=False)
    disc("pit_bottom", PIT_R, -PIT_DEPTH, mats["stone_cave"])
    disc("ash_bed", 0.74, -0.50, mats["ash"])
    disc("coal_bed", 0.66, -0.46, mats["coal_glow"])
    for k in range(7):
        a = 2.0 * math.pi * k / 7.0 + 0.35
        rr = 0.12 + 0.34 * abs(math.sin(2.2 * k + 0.8))
        s = 0.07 + 0.05 * abs(math.sin(1.9 * k + 2.0))
        blob(f"ember_{k}", s, (rr * math.cos(a), rr * math.sin(a), -0.40),
             mats["ember"], squish=0.5, wobble=0.25, phase=0.9 * k)

    # Fire ring: nine worn stones seated around the opening.
    for k in range(9):
        a = 2.0 * math.pi * k / 9.0 + 0.12
        rr = 0.99 + 0.03 * math.sin(2.0 * a)
        s = 0.15 + 0.045 * math.sin(3.0 * a + 1.3)
        blob(f"rim_stone_{k}", s, (rr * math.cos(a), rr * math.sin(a), 0.05),
             mats["stone_ring"], squish=0.55, wobble=0.16, phase=1.1 * k)

    # Bronze tripod over the fire: three legs, a ring, a small ritual pot.
    for k, deg in enumerate((90.0, 210.0, 330.0)):
        a = math.radians(deg)
        tube(f"tripod_leg_{k}",
             (1.18 * math.cos(a), 1.18 * math.sin(a), 0.0),
             (0.40 * math.cos(a), 0.40 * math.sin(a), 1.18),
             0.035, mats["bronze"])
    ring_prof = [(0.40 + 0.026 * math.cos(t), 1.18 + 0.026 * math.sin(t))
                 for t in [2.0 * math.pi * i / 10.0 for i in range(10)]]
    lathe("tripod_ring", ring_prof, mats["bronze"], segs=40, closed=True, caps=False)
    lathe("ritual_pot",
          [(0.06, 1.16), (0.13, 1.17), (0.155, 1.22), (0.16, 1.26),
           (0.13, 1.32), (0.10, 1.35), (0.115, 1.38), (0.105, 1.40)],
          mats["bronze"], segs=24)

    # Five spirit jars around the hearth, each sealed with a glowing talisman.
    for k in range(5):
        a = math.radians(JAR_ANGLES[k])
        rad = 1.78 + 0.22 * math.sin(k * 2.3 + 0.5)
        h = JAR_HEIGHTS[k]
        rb = 0.13 + 0.11 * h
        jx, jy = rad * math.cos(a), rad * math.sin(a)
        glaze = mats["stoneware_green"] if k % 2 == 0 else mats["stoneware_brown"]
        lathe(f"spirit_jar_{k}", jar_profile(h, rb), glaze, segs=28)
        rz = a + 0.5
        box(f"seal_strip_{k}", 0.055, 0.012, 0.30, (jx, jy, h + 0.02),
            mats["paper"], rx=0.22, rz=rz)
        box(f"seal_band_{k}", 0.060, 0.017, 0.10, (jx, jy, h + 0.02),
            mats["talisman_glow"], rx=0.22, rz=rz)
        if k in (1, 3):
            box(f"seal_strip_{k}b", 0.050, 0.012, 0.22, (jx + 0.06, jy + 0.04, h + 0.01),
                mats["paper"], rx=-0.30, rz=a + 2.4)

    # A few loose stones and a spare slip on the floor.
    for k in range(6):
        a = 2.0 * math.pi * k / 6.0 + 0.9
        rr = 1.45 + 0.9 * abs(math.sin(1.3 * k + 0.2))
        s = 0.06 + 0.05 * abs(math.sin(2.6 * k))
        blob(f"pebble_{k}", s, (rr * math.cos(a), rr * math.sin(a), 0.02),
             mats["stone_cave"] if k % 2 else mats["stone_ring"],
             squish=0.40, wobble=0.20, phase=0.6 * k)
    box("spare_slip", 0.06, 0.012, 0.26, (1.15, -1.05, 0.135),
        mats["paper"], rx=math.radians(80.0), rz=0.7)

    # Lights: warm point over the coals, cold area light from the cave mouth.
    key = bpy.data.lights.new("hearth_point", 'POINT')
    key.energy = 100.0
    key.color = (1.0, 0.50, 0.20)
    key.shadow_soft_size = 0.12
    key_ob = bpy.data.objects.new("hearth_point", key)
    key_ob.location = (0.0, 0.0, 0.35)
    bpy.context.collection.objects.link(key_ob)

    fill = bpy.data.lights.new("cave_mouth_area", 'AREA')
    fill.shape = 'RECTANGLE'
    fill.size = 3.0
    fill.size_y = 2.0
    fill.energy = 400.0
    fill.color = (0.70, 0.82, 0.88)
    fill_ob = bpy.data.objects.new("cave_mouth_area", fill)
    fill_ob.location = (0.5, -3.6, 2.3)
    aim = Vector((0.0, 0.3, 0.4)) - Vector(fill_ob.location)
    fill_ob.rotation_euler = aim.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(fill_ob)

    # Camera: single turntable frame — low, intimate, looking slightly up at the jars.
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 28.0
    cam_ob = bpy.data.objects.new("Camera", cam_data)
    cam_ob.location = (2.7, -3.4, 1.7)
    look = Vector((0.0, 0.1, 0.35)) - Vector(cam_ob.location)
    cam_ob.rotation_euler = look.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(cam_ob)

    world = bpy.data.worlds.new("CaveWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.008, 0.012, 0.014, 1.0)
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
        scene.eevee.taa_render_samples = 48
    except AttributeError:
        pass
    try:
        scene.view_settings.view_transform = 'Standard'
    except Exception:
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
