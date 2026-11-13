"""Free pass, object 3: the founder's-hall hearth with its six jars.

Built from the answered look fp-hearth-concept-look-2 (A, "Build the hearth and jars from this"). Shape from the
concept's right-hand drawing: a cream plaster back wall with a dark post at the centre and a ceiling beam above, two
paned windows, a square grey stone surround with a dark opening and a timber mantel, a log fire in the opening, and
six round-shouldered orange jars with dark lids standing on the boards, three each side of the fireplace in uneven
sizes. The wall is the north wall of the hall (+Y); the floor boards match floor.py.

Entry point `build_object()` builds into a fresh scene. Deterministic, pure bpy, no network, no randomness.
Standalone: `python3 hearth.py` renders hearth_<view>.png beside this file; `--check` prints counts and the layout
self-test (six jars, three a side, none overlapping the surround or each other).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

C_TIMBER = [(0.26, 0.15, 0.075, 1), (0.24, 0.14, 0.07, 1), (0.29, 0.17, 0.085, 1), (0.25, 0.145, 0.072, 1)]
C_SEAM = (0.17, 0.11, 0.07, 1)
C_PLASTER = (0.90, 0.84, 0.68, 1)
C_POST = (0.30, 0.19, 0.11, 1)
C_STONE = (0.13, 0.13, 0.125, 1)
C_STONE_D = (0.09, 0.09, 0.085, 1)
C_SOOT = (0.035, 0.03, 0.028, 1)
C_MANTEL = (0.38, 0.25, 0.14, 1)
C_JAR = (0.90, 0.20, 0.01, 1)
C_LID = (0.09, 0.06, 0.04, 1)
C_LOG = (0.24, 0.15, 0.08, 1)
C_GLASS = (0.95, 0.86, 0.62, 1)

HALL_X, WALL_H = 16.0, 5.2
WALL_Y = 0.0                 # the north wall's face; the room lies at -Y
OPEN_W, OPEN_H = 2.0, 1.55   # the fire opening
SURR_T = 0.6                 # stone surround thickness around the opening
SURR_D = 0.55                # how far the surround stands out from the wall
# (side, centre offset from the fireplace middle, radius, height) for the six jars; uneven on purpose.
JARS = [
    (-1, 2.60, 0.34, 0.72), (-1, 3.55, 0.50, 0.98), (-1, 4.55, 0.44, 0.84),
    (+1, 2.70, 0.44, 0.86), (+1, 3.70, 0.52, 1.02), (+1, 4.80, 0.40, 0.76),
]
# Half the surround's width, the jars must stand clear of it.
SURR_HALF = OPEN_W / 2 + SURR_T


def layout_selftest():
    """Six jars, three on each side, clear of the surround and of each other."""
    assert len(JARS) == 6
    assert sum(1 for j in JARS if j[0] < 0) == 3 and sum(1 for j in JARS if j[0] > 0) == 3
    for side in (-1, 1):
        row = sorted((j for j in JARS if j[0] == side), key=lambda j: j[1])
        assert row[0][1] - row[0][2] > SURR_HALF + 0.05, "jar touches the surround"
        for a, b in zip(row, row[1:]):
            assert b[1] - b[2] > a[1] + a[2] + 0.02, "jars overlap"
        assert row[-1][1] + row[-1][2] < HALL_X / 2 - 0.2
    return True


def _mat(name, color, rough=0.7, metal=0.0, emit=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = strength
    return m


def _box(name, size, loc, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = size
    ob.rotation_euler = rot
    ob.data.materials.append(mat)
    return ob


def _revolve(name, profile, loc, mat, segs=48):
    """Lathe a (radius, height) profile, bottom to top, around Z into a closed solid."""
    verts, faces = [], []
    n = len(profile)
    for r, z in profile:
        for i in range(segs):
            a = 2 * math.pi * i / segs
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for k in range(n - 1):
        for i in range(segs):
            j = (i + 1) % segs
            faces.append((k * segs + i, k * segs + j, (k + 1) * segs + j, (k + 1) * segs + i))
    faces.append(tuple(reversed(range(segs))))                  # base
    faces.append(tuple(range((n - 1) * segs, n * segs)))        # top
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.data.materials.append(mat)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def _jar(name, x, y, r, h, m_jar, m_lid):
    """A round-shouldered jar of radius r (at its belly) and height h, with a short neck and a dark lid."""
    p = [(r * 0.62, 0.0), (r * 0.78, h * 0.04), (r * 0.94, h * 0.22), (r, h * 0.42), (r * 0.96, h * 0.62),
         (r * 0.80, h * 0.80), (r * 0.58, h * 0.90), (r * 0.54, h * 0.95), (r * 0.60, h * 0.96), (r * 0.58, h)]
    _revolve(name, p, (x, y, 0.0), m_jar)
    lid_h = h * 0.07
    _revolve(name + "_lid", [(r * 0.62, h), (r * 0.62, h + lid_h), (r * 0.50, h + lid_h * 1.05), (0.0, h + lid_h * 1.05)],
             (x, y, 0.0), m_lid)


def _flame(name, x, y, z, scale, m):
    _revolve(name, [(0.0, 0.0), (0.16 * scale, 0.05 * scale), (0.20 * scale, 0.22 * scale), (0.12 * scale, 0.5 * scale),
                    (0.03 * scale, 0.78 * scale), (0.0, 0.9 * scale)], (x, y, z), m, 24)


def build_object():
    layout_selftest()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    timbers = [_mat(f"Timber{i}", c, 0.5) for i, c in enumerate(C_TIMBER)]
    m_seam = _mat("Seam", C_SEAM, 0.9)
    m_plaster = _mat("Plaster", C_PLASTER, 0.9)
    m_post = _mat("Post", C_POST, 0.7)
    m_stone = _mat("Stone", C_STONE, 0.85)
    m_stone_d = _mat("StoneDark", C_STONE_D, 0.9)
    m_soot = _mat("Soot", C_SOOT, 0.95)
    m_mantel = _mat("Mantel", C_MANTEL, 0.6)
    m_jar = _mat("JarGlaze", C_JAR, 0.42)
    m_lid = _mat("JarLid", C_LID, 0.5, 0.3)
    m_log = _mat("Log", C_LOG, 0.85)
    m_glass = _mat("Paper", C_GLASS, 0.5, 0.0, (1.0, 0.82, 0.5, 1), 1.1)
    m_fl_o = _mat("FlameOuter", (1.0, 0.25, 0.01, 1), 0.5, 0.0, (1.0, 0.25, 0.01, 1), 3.0)
    m_fl_m = _mat("FlameMid", (1.0, 0.55, 0.05, 1), 0.5, 0.0, (1.0, 0.55, 0.05, 1), 4.0)
    m_fl_c = _mat("FlameCore", (1.0, 0.85, 0.35, 1), 0.5, 0.0, (1.0, 0.85, 0.35, 1), 5.0)

    # Boards, matching floor.py's layout (0.6 m wide, running the long way), over the hall's near edge.
    bw, depth = 0.6, 12.0
    n = int(round(depth / bw))
    for i in range(n):
        y = bw / 2 - depth + i * bw
        _box(f"Board{i}", (HALL_X, bw - 0.03, 0.10), (0, y, -0.05), timbers[(i * 3 + (i // 4)) % 4], (0, 0, 0))
        _box(f"Seam{i}", (HALL_X, 0.03, 0.09), (0, y + bw / 2, -0.055), m_seam)
    # Floor boards run the hall's long way, which is along X here; staggered butt joints.
    for i in range(n):
        y = bw / 2 - depth + i * bw
        for j in range(1, 3):
            x = -HALL_X / 2 + ((i * 7 + j * 6.0) % HALL_X)
            _box(f"Joint{i}_{j}", (0.03, bw - 0.03, 0.09), (x, y, -0.052), m_seam)

    # Back wall, ceiling, centre post, ceiling beam.
    _box("Wall", (HALL_X, 0.3, WALL_H), (0, WALL_Y + 0.15, WALL_H / 2), m_plaster)
    _box("Ceiling", (HALL_X, 12.0, 0.2), (0, WALL_Y - 5.9, WALL_H + 0.1), m_post)
    _box("Post", (0.32, 0.22, WALL_H - 3.0), (0, WALL_Y - 0.11, 3.0 + (WALL_H - 3.0) / 2), m_post)
    _box("Beam", (HALL_X, 0.42, 0.34), (0, WALL_Y - 0.21, WALL_H - 0.17), m_post)
    _box("CrossBeam", (0.42, 11.0, 0.40), (0, WALL_Y - 5.5, WALL_H - 0.2), m_post)
    for sx in (-1, 1):
        _box(f"SidePost{sx}", (0.26, 0.2, WALL_H), (sx * (HALL_X / 2 - 0.13), WALL_Y - 0.1, WALL_H / 2), m_post)
        # A window each side: a paper pane in a timber frame, split by thin muntins (three across, two down).
        wx, wz, ww, wh = sx * 3.9, 3.1, 2.3, 1.9
        _box(f"WinPane{sx}", (ww, 0.02, wh), (wx, WALL_Y - 0.01, wz), m_glass)
        for k, (cx, cz, sw, sh) in enumerate([(wx, wz + wh / 2, ww + 0.16, 0.08), (wx, wz - wh / 2, ww + 0.16, 0.08),
                                              (wx - ww / 2, wz, 0.08, wh), (wx + ww / 2, wz, 0.08, wh),
                                              (wx, wz, ww, 0.04), (wx - ww / 6, wz, 0.04, wh), (wx + ww / 6, wz, 0.04, wh)]):
            _box(f"Frame{sx}_{k}", (sw, 0.08, sh), (cx, WALL_Y - 0.04, cz), m_post)

    # Fireplace: dark soot back, stone surround standing proud of the wall, timber mantel.
    ow, oh = OPEN_W, OPEN_H
    sw, sh = ow + 2 * SURR_T, oh + 2 * SURR_T
    _box("FireBack", (ow, 0.06, oh), (0, WALL_Y - 0.03, SURR_T + oh / 2), m_soot)
    _box("FireRecessL", (0.02, SURR_D * 0.9, oh), (-ow / 2, WALL_Y - SURR_D * 0.45, SURR_T + oh / 2), m_stone_d)
    _box("FireRecessR", (0.02, SURR_D * 0.9, oh), (ow / 2, WALL_Y - SURR_D * 0.45, SURR_T + oh / 2), m_stone_d)
    side_h = SURR_T + oh
    _box("SurroundL", (SURR_T, SURR_D, side_h), (-(ow / 2 + SURR_T / 2), WALL_Y - SURR_D / 2, side_h / 2), m_stone)
    _box("SurroundR", (SURR_T, SURR_D, side_h), ((ow / 2 + SURR_T / 2), WALL_Y - SURR_D / 2, side_h / 2), m_stone)
    _box("SurroundTop", (sw, SURR_D, SURR_T), (0, WALL_Y - SURR_D / 2, side_h + SURR_T / 2), m_stone)
    _box("Hearthstone", (sw + 0.5, 0.9, 0.12), (0, WALL_Y - 0.45, 0.06), m_stone_d)
    # Panel seams cut into the surround (thin dark lines, as the concept's slab joints).
    _box("SeamV", (0.02, 0.01, SURR_T), (0, WALL_Y - SURR_D - 0.002, side_h + SURR_T / 2), m_stone_d)
    _box("Mantel", (sw + 1.3, SURR_D + 0.2, 0.2), (0, WALL_Y - (SURR_D + 0.2) / 2, sh + 0.1), m_mantel)

    # Fire: two logs laid across, three flame tongues, a warm point light.
    for k, (lx, ang) in enumerate([(-0.25, 0.25), (0.25, -0.2)]):
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.1, depth=1.5, location=(lx, WALL_Y - 0.22, 0.28 + k * 0.1))
        lg = bpy.context.active_object
        lg.name = f"Log{k}"
        lg.rotation_euler = (0, math.radians(90), ang)
        lg.data.materials.append(m_log)
    _box("LogBed", (1.7, 0.5, 0.1), (0, WALL_Y - 0.25, 0.18), m_stone_d)
    _flame("FlameOuter", 0, WALL_Y - 0.22, 0.34, 1.35, m_fl_o)
    _flame("FlameLeft", -0.35, WALL_Y - 0.22, 0.34, 0.8, m_fl_m)
    _flame("FlameRight", 0.33, WALL_Y - 0.22, 0.34, 0.9, m_fl_m)
    _flame("FlameMid", 0, WALL_Y - 0.22, 0.34, 0.95, m_fl_m)
    _flame("FlameCore", 0, WALL_Y - 0.22, 0.34, 0.55, m_fl_c)
    bpy.ops.object.light_add(type="POINT", location=(0, WALL_Y - 0.9, 0.9))
    fire = bpy.context.active_object
    fire.name = "FireLight"
    fire.data.energy = 260
    fire.data.color = (1.0, 0.6, 0.25)
    fire.data.shadow_soft_size = 0.3

    # The six jars, standing on the boards in front of the wall.
    for k, (side, off, r, h) in enumerate(JARS):
        _jar(f"Jar{k}", side * off, WALL_Y - 0.15 - r - (0.12 if k % 2 else 0.0), r, h, m_jar, m_lid)

    # Light: warm window sun from the left, soft fill, and the fire.
    bpy.ops.object.light_add(type="SUN", location=(-6, -8, 10))
    sun = bpy.context.active_object
    sun.data.energy = 2.2
    sun.data.color = (1.0, 0.92, 0.78)
    sun.rotation_euler = (math.radians(62), math.radians(5), math.radians(-20))
    bpy.ops.object.light_add(type="AREA", location=(0, -5, 4.5))
    fill = bpy.context.active_object
    fill.data.energy = 330
    fill.data.size = 10
    fill.data.color = (1.0, 0.9, 0.75)

    bpy.ops.object.camera_add(location=(0, -9.0, 1.65))
    cam = bpy.context.active_object
    cam.name = "Camera"
    cam.data.lens = 28
    cam.rotation_euler = (Vector((0, 0, 1.9)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam

    w = bpy.data.worlds.new("World")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.12, 0.10, 0.08, 1)
    bpy.context.scene.world = w
    return bpy.context.scene


def _render(path, loc, look, lens=28, res=(1600, 700)):
    sc = bpy.context.scene
    cam = sc.camera
    cam.location = loc
    cam.data.lens = lens
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.view_settings.view_transform = "Standard"
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 48
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = path
    sc.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    build_object()
    if "--check" in sys.argv:
        polys = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
        jars = sum(1 for o in bpy.data.objects if o.name.startswith("Jar") and not o.name.endswith("_lid"))
        print("LAYOUT_SELFTEST", layout_selftest(), "JARS", jars, "POLYS", polys, "OBJECTS", len(bpy.data.objects))
    else:
        _render(os.path.join(here, "hearth_front.png"), (0, -9.0, 1.65), (0, 0, 1.9), 28)
        _render(os.path.join(here, "hearth_three-quarter.png"), (-5.5, -7.5, 2.6), (0.4, 0, 1.2), 32, (1400, 900))
        print("READY")
