"""Free pass, object 2: the founder's-hall floor with the eight ba gua marks.

Built from the answered look fp-floor-concept-look-1 (A, "Build from this shape", note: "We've lost the ba gua
markers"). Shape from the concept: a round gold-ochre inlay set into pale polished timber boards, eight marks around
a centre disc, a thin red lacquer line leading outward. The marks are the eight TRUE trigrams, three stacked lines
each, drawn in code from TRIGRAMS below (yang = one solid line, yin = a line broken in two). The drawing in the look
had garbled marks; this build does not take them from any picture.

Layout is the Early Heaven (Fuxi) ring with Qian, the Heaven trigram of this sect, at the top; each trigram's first
line is the innermost, so a mark reads from the centre outward.

Entry point `build_object()` builds into a fresh scene. Deterministic, pure bpy, no network, no randomness.
Standalone: `python3 floor.py` renders floor_<view>.png beside this file; `--check` prints counts and runs the
trigram self-test.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

# Lines read bottom to top (innermost to outermost): 1 = yang (solid), 0 = yin (broken).
TRIGRAMS = {
    "Qian": (1, 1, 1),  # heaven
    "Dui": (1, 1, 0),   # lake
    "Li": (1, 0, 1),    # fire
    "Zhen": (1, 0, 0),  # thunder
    "Xun": (0, 1, 1),   # wind
    "Kan": (0, 1, 0),   # water
    "Gen": (0, 0, 1),   # mountain
    "Kun": (0, 0, 0),   # earth
}
# Early Heaven order, clockwise from the top (south at the top, as the old diagrams hang it).
RING_ORDER = ("Qian", "Xun", "Kan", "Gen", "Kun", "Zhen", "Li", "Dui")

# Pale timber, gold-ochre inlay, bronze rim, lacquer red, cream centre (from the concept's palette).
C_TIMBER = [(0.72, 0.60, 0.43, 1), (0.69, 0.57, 0.40, 1), (0.74, 0.63, 0.46, 1), (0.70, 0.58, 0.42, 1)]
C_SEAM = (0.30, 0.22, 0.14, 1)
C_GOLD = (0.78, 0.56, 0.22, 1)
C_BRONZE = (0.42, 0.27, 0.12, 1)
C_MARK = (0.10, 0.045, 0.02, 1)
C_CREAM = (0.90, 0.82, 0.62, 1)
C_RED = (0.60, 0.07, 0.05, 1)

HALL_X, HALL_Y = 30.0, 20.0
DISC_R = 6.2
RING_R = 4.3      # centre of each trigram mark
CENTRE_R = 1.55
LINE_LEN, LINE_W, LINE_GAP = 1.9, 0.20, 0.20


def trigram_selftest():
    """The eight marks are the eight distinct trigrams, and opposite marks are exact complements."""
    assert len(set(TRIGRAMS.values())) == 8
    assert set(RING_ORDER) == set(TRIGRAMS)
    for i in range(4):
        a, b = TRIGRAMS[RING_ORDER[i]], TRIGRAMS[RING_ORDER[i + 4]]
        assert all(x != y for x, y in zip(a, b)), (RING_ORDER[i], RING_ORDER[i + 4])
    assert TRIGRAMS["Qian"] == (1, 1, 1) and TRIGRAMS["Kun"] == (0, 0, 0)
    return True


def _mat(name, color, rough=0.7, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


def _box(name, size, loc, mat, rot_z=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0], size[1], size[2])
    ob.rotation_euler = (0, 0, rot_z)
    ob.data.materials.append(mat)
    return ob


def _disc(name, radius, depth, loc, mat, verts=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(mat)
    return ob


def _half_disc(name, radius, depth, z, mat, start, segs=48):
    """A half disc, built as a prism, starting at angle `start` and sweeping 180 degrees."""
    verts, faces = [], []
    ring = [(radius * math.cos(start + math.pi * i / segs), radius * math.sin(start + math.pi * i / segs)) for i in range(segs + 1)]
    pts = [(0.0, 0.0)] + ring
    for x, y in pts:
        verts.append((x, y, 0.0))
    for x, y in pts:
        verts.append((x, y, depth))
    n = len(pts)
    for i in range(1, n - 1):
        faces.append((0, i + 1, i))
        faces.append((n, n + i, n + i + 1))
    for i in range(1, n - 1):
        faces.append((i, i + 1, n + i + 1, n + i))
    faces.append((0, n, n + n - 1, n - 1))
    faces.append((0, 1, n + 1, n))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.location = (0, 0, z)
    ob.data.materials.append(mat)
    return ob


def _ring_band(name, r_in, r_out, depth, z, mat, verts=128):
    me = bpy.data.meshes.new(name)
    vs, fs = [], []
    for i in range(verts):
        a = 2 * math.pi * i / verts
        for r in (r_in, r_out):
            vs.append((r * math.cos(a), r * math.sin(a), 0.0))
            vs.append((r * math.cos(a), r * math.sin(a), depth))
    for i in range(verts):
        j = (i + 1) % verts
        i0, j0 = i * 4, j * 4
        fs.append((i0 + 1, j0 + 1, j0 + 3, i0 + 3))  # top
        fs.append((i0, i0 + 2, j0 + 2, j0))            # bottom
        fs.append((i0, j0, j0 + 1, i0 + 1))            # inner wall
        fs.append((i0 + 2, i0 + 3, j0 + 3, j0 + 2))    # outer wall
    me.from_pydata(vs, [], fs)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    ob.location = (0, 0, z)
    ob.data.materials.append(mat)
    return ob


def _trigram(name, angle, mat):
    """Three stacked lines on the radius through `angle`; the first line is the innermost."""
    rows = TRIGRAMS[name]
    rx, ry = math.cos(angle), math.sin(angle)      # outward
    tx, ty = -math.sin(angle), math.cos(angle)     # along the line
    pitch = LINE_W + LINE_GAP
    for k, yang in enumerate(rows):
        d = RING_R + (k - 1) * pitch
        cx, cy = rx * d, ry * d
        if yang:
            _box(f"{name}_{k}", (LINE_LEN, LINE_W, 0.03), (cx, cy, 0.075), mat, angle + math.pi / 2)
        else:
            seg = (LINE_LEN - 0.36) / 2
            for s in (-1, 1):
                off = s * (0.18 + seg / 2)
                _box(f"{name}_{k}_{'a' if s < 0 else 'b'}", (seg, LINE_W, 0.03),
                     (cx + tx * off, cy + ty * off, 0.075), mat, angle + math.pi / 2)


def build_object():
    trigram_selftest()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)

    timbers = [_mat(f"Timber{i}", c, 0.55) for i, c in enumerate(C_TIMBER)]
    m_seam = _mat("Seam", C_SEAM, 0.9)
    m_gold = _mat("GoldInlay", C_GOLD, 0.35, 0.6)
    m_bronze = _mat("BronzeRim", C_BRONZE, 0.4, 0.8)
    m_mark = _mat("MarkInlay", C_MARK, 0.6, 0.0)
    m_cream = _mat("Cream", C_CREAM, 0.6)
    m_red = _mat("Lacquer", C_RED, 0.25)

    # Boards: 0.6 m wide, running the hall's long way, a dark seam between each, tones cycling by a fixed pattern.
    bw = 0.6
    n = int(round(HALL_Y / bw))
    for i in range(n):
        y = -HALL_Y / 2 + bw / 2 + i * bw
        _box(f"Board{i}", (HALL_X, bw - 0.03, 0.10), (0, y, -0.05), timbers[(i * 3 + (i // 4)) % 4])
        _box(f"Seam{i}", (HALL_X, 0.03, 0.09), (0, y + bw / 2, -0.055), m_seam)
    # Butt joints, staggered per board.
    for i in range(n):
        y = -HALL_Y / 2 + bw / 2 + i * bw
        for j in range(1, 5):
            x = -HALL_X / 2 + ((i * 7 + j * 6.0) % HALL_X)
            _box(f"Joint{i}_{j}", (0.03, bw - 0.03, 0.09), (x, y, -0.052), m_seam)

    # The inlay: bronze rim, gold disc, thin inner line, then the eight marks and the centre.
    _ring_band("Rim", DISC_R, DISC_R + 0.22, 0.09, 0.0, m_bronze)
    _disc("GoldDisc", DISC_R, 0.07, (0, 0, 0.035), m_gold)
    _ring_band("InnerLine", RING_R + 1.35, RING_R + 1.43, 0.085, 0.0, m_bronze)
    _ring_band("CentreLine", CENTRE_R + 0.55, CENTRE_R + 0.62, 0.085, 0.0, m_bronze)
    for i, name in enumerate(RING_ORDER):
        _trigram(name, math.pi / 2 - i * math.pi / 4, m_mark)

    # Centre disc with a small Taiji and its two dots.
    _disc("Centre", CENTRE_R, 0.09, (0, 0, 0.045), m_cream)
    _half_disc("TaijiDark", CENTRE_R * 0.78, 0.03, 0.09, m_mark, math.pi / 2)
    r = CENTRE_R * 0.78
    _disc("TaijiTop", r / 2, 0.03, (0, r / 2, 0.135), m_mark, 48)
    _disc("TaijiBot", r / 2, 0.03, (0, -r / 2, 0.135), m_cream, 48)
    _disc("DotTop", r / 8, 0.03, (0, r / 2, 0.165), m_mark, 24)
    _disc("DotBot", r / 8, 0.03, (0, -r / 2, 0.165), m_cream, 24)

    # Red lacquer line from the rim toward the hall's door (south), with a round end.
    _box("LacquerLine", (0.14, HALL_Y / 2 - DISC_R - 0.9, 0.04), (0, -(DISC_R + 0.22 + (HALL_Y / 2 - DISC_R - 0.22) / 2) + 0.55, 0.02), m_red)
    _disc("LacquerDot", 0.22, 0.05, (0, -HALL_Y / 2 + 0.9, 0.025), m_red, 32)

    # Lights and camera. Warm key with soft sun; a three-quarter view as the concept's drawing sat.
    bpy.ops.object.light_add(type="SUN", location=(6, -8, 14))
    sun = bpy.context.active_object
    sun.data.energy = 3.2
    sun.data.color = (1.0, 0.92, 0.78)
    sun.rotation_euler = (math.radians(48), math.radians(8), math.radians(22))
    bpy.ops.object.light_add(type="AREA", location=(0, 0, 9))
    fill = bpy.context.active_object
    fill.data.energy = 900
    fill.data.size = 12
    fill.data.color = (1.0, 0.85, 0.62)

    bpy.ops.object.camera_add(location=(0, -15.5, 15.0))
    cam = bpy.context.active_object
    cam.name = "Camera"
    cam.data.lens = 40
    cam.rotation_euler = (Vector((0, -0.5, 0)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam

    w = bpy.data.worlds.new("World")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.09, 0.08, 0.07, 1)
    bpy.context.scene.world = w
    return bpy.context.scene


def _render(path, loc, look, lens=40, res=(1280, 720)):
    sc = bpy.context.scene
    cam = sc.camera
    cam.location = loc
    cam.data.lens = lens
    cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = 32
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = path
    sc.render.image_settings.file_format = "PNG"
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    build_object()
    if "--check" in sys.argv:
        tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
        print("TRIGRAM_SELFTEST", trigram_selftest(), "POLYS", tris, "OBJECTS", len(bpy.data.objects))
    else:
        _render(os.path.join(here, "floor_three-quarter.png"), (0, -15.5, 15.0), (0, -0.5, 0), 40)
        _render(os.path.join(here, "floor_top.png"), (0, 0, 17.5), (0, 0, 0), 40, (1000, 1000))
        print("READY")
