"""Builds the Cave of Lessons chamber kit in Blender and writes the table of spot shapes.

Run with Blender's Python module (pip install bpy, 5.2.2 for Python 3.13):
    python3 content/ontology-game/cave/build_kit.py
Output, both committed so the site build needs no Blender:
    cave-kit.glb  six unit pieces the page scales and bends to each spot (DESIGN.md, "How it is built")
    spots.json    one row per named place on the figure: width, height, length, bend, light side

Pieces are authored in the page's own axes (Y up, a passage along -Z) and exported with export_yup=False so the
file keeps them as written. Every unit piece runs along -Z from z=0 to z=-1 (or sits on z=0), at radius 1. Design choices, not
measurements: the sizes below turn the figure's girth in metres into chamber units (CHAMBER_PER_METRE).
"""
import json
import math
import os
import random
import struct

import bpy
import bmesh
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
FIGURE = os.path.join(HERE, "..", "body", "figure.glb")
OUT_KIT = os.path.join(HERE, "cave-kit.glb")
OUT_SPOTS = os.path.join(HERE, "spots.json")

# ---- spot shapes, from the figure ---------------------------------------------------------
CHAMBER_PER_METRE = 36.0  # a 0.34 m chest is a 12-unit-wide vault; a 0.116 m neck is a 4-unit tube
# The figure's girth, as build_figure.py draws it: (z, half-width, half-depth) for the trunk,
# and the radius of each limb part.
TRUNK = [(0.90, 0.150, 0.092), (0.98, 0.165, 0.104), (1.06, 0.152, 0.100), (1.13, 0.134, 0.092),
         (1.21, 0.146, 0.098), (1.30, 0.163, 0.106), (1.37, 0.168, 0.096), (1.43, 0.120, 0.068)]
HEAD = (0.078, 0.115)
NECK = 0.058


def trunk_at(z):
    z = min(max(z, TRUNK[0][0]), TRUNK[-1][0])
    for (z0, a0, b0), (z1, a1, b1) in zip(TRUNK, TRUNK[1:]):
        if z0 <= z <= z1:
            t = (z - z0) / (z1 - z0)
            return a0 + (a1 - a0) * t, b0 + (b1 - b0) * t
    return TRUNK[-1][1], TRUNK[-1][2]


def lerp(a, b, t):
    return a + (b - a) * min(max(t, 0.0), 1.0)


def girth_of(name, z):
    """(kind, half-width, half-height in metres, length in chamber units, bend degrees)."""
    base = name.split("_", 1)[1] if name.startswith(("left_", "right_")) else name
    if base in ("throat", "back_of_neck", "side_of_neck"):
        return "tube", NECK, NECK, 14, 0
    if base in ("crown", "forehead", "eyes", "jaw", "back_of_head", "mouth", "nose", "temple", "ear", "cheek"):
        return "dome", HEAD[0], HEAD[1], 16, 0
    if base in ("upper_arm", "elbow", "inner_elbow", "forearm", "wrist"):
        r = lerp(0.047, 0.029, (1.385 - z) / 0.5)
        return "limb", r, r, 44, 22
    if base == "hand":
        return "limb", 0.045, 0.07, 22, 12
    if base in ("thigh", "back_of_thigh", "knee", "back_of_knee"):
        r = lerp(0.085, 0.055, (0.96 - z) / 0.46)
        return "limb", r, r, 46, 14
    if base in ("calf", "shin", "ankle", "heel"):
        r = lerp(0.053, 0.035, (0.50 - z) / 0.42)
        return "limb", r, r, 40, 10
    if base == "foot":
        return "limb", 0.05, 0.11, 22, 8
    hw, hd = trunk_at(z)
    return "vault", hw, hd * 1.6, 28, 8  # a vault is taller than the body is deep, so it can be walked in


def read_anchors(path):
    """The named places stored in figure.glb (build_figure.py ANCHORS): name, words, region, point."""
    with open(path, "rb") as f:
        data = f.read()
    jlen = struct.unpack_from("<I", data, 12)[0]
    nodes = json.loads(data[20:20 + jlen])["nodes"]
    return [n for n in nodes if n.get("extras", {}).get("label") and "translation" in n]


def build_spots():
    spots = []
    for n in read_anchors(FIGURE):
        x, y, zf = n["translation"]  # glTF is Y-up, the figure faces +Z
        name = n["name"].replace("anchor.", "")
        kind, hw, hh, length, bend = girth_of(name, y)
        if abs(zf) < 0.02 or y > 1.7:
            side = "side" if y <= 1.7 else "top"
        else:
            side = "front" if zf > 0 else "back"
        sign = 1 if x >= 0 else -1
        spots.append({
            "id": name,
            "words": n["extras"]["label"],
            "region": n["extras"].get("region"),
            "position": [round(v, 4) for v in n["translation"]],
            "side": side,
            "kind": kind,
            "width": round(max(2.6, 2 * hw * CHAMBER_PER_METRE), 2),
            "height": round(max(2.6, 2 * hh * CHAMBER_PER_METRE), 2),
            "length": length,
            "bend": bend * sign,
        })
    spots.sort(key=lambda s: s["id"])
    return spots


# ---- kit pieces ----------------------------------------------------------------------------
rng = random.Random(7)  # fixed, so the kit is the same file every run
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def to_object(name, bm):
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob


def tube(name, radius_fn, rings, segments, rough=0.0, caps=False, inward=False):
    """An open tube along -Z from z=0 to z=-1; radius_fn(t, angle) shapes it, rough jitters it."""
    bm = bmesh.new()
    grid = []
    for i in range(rings + 1):
        t = i / rings
        row = []
        for j in range(segments):
            a = 2 * math.pi * j / segments
            r = radius_fn(t, a) * (1 + rng.uniform(-rough, rough))
            row.append(bm.verts.new((r * math.cos(a), r * math.sin(a), -t)))
        grid.append(row)
    for a, b in zip(grid, grid[1:]):
        for j in range(segments):
            k = (j + 1) % segments
            f = bm.faces.new((a[j], a[k], b[k], b[j]) if inward else (a[j], b[j], b[k], a[k]))
    if caps:
        bm.faces.new(list(reversed(grid[0])))
        bm.faces.new(grid[-1])
    return to_object(name, bm)


def wall_ring():
    # rock wall: round, a little irregular, one ring deep; the page stacks and bends them
    return tube("wall_ring", lambda t, a: 1.0, 1, 16, rough=0.05, inward=True)


def path_tube():
    return tube("path_tube", lambda t, a: 1.0, 1, 12, inward=True)


def floor():
    bm = bmesh.new()
    nx, nz = 6, 8
    g = [[bm.verts.new((-0.5 + i / nx, rng.uniform(0, 0.02), -j / nz)) for i in range(nx + 1)] for j in range(nz + 1)]
    for a, b in zip(g, g[1:]):
        for i in range(nx):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    return to_object("floor", bm)


def pool():
    # a shallow basin: raised rim, sunk centre, radius 1, centred on the origin
    bm = bmesh.new()
    segs, steps = 24, 5
    rings = []
    for k in range(steps + 1):
        r = k / steps
        h = 0.06 * math.sin(min(r, 1) * math.pi) * (1 if r > 0.78 else -0.4 * (1 - r)) if k else -0.05
        rings.append([bm.verts.new((r * math.cos(2 * math.pi * j / segs), h, r * math.sin(2 * math.pi * j / segs)))
                      for j in range(segs)] if k else [bm.verts.new((0, -0.05, 0))])
    for j in range(segs):
        bm.faces.new((rings[0][0], rings[1][(j + 1) % segs], rings[1][j]))
    for a, b in zip(rings[1:], rings[2:]):
        for j in range(segs):
            k = (j + 1) % segs
            bm.faces.new((a[j], a[k], b[k], b[j]))
    return to_object("pool", bm)


def gate_stone():
    # one standing stone, 1 high, 0.3 wide, tapered; the page sets six in a ring
    bm = bmesh.new()
    sides = 6
    base = [bm.verts.new((0.16 * math.cos(2 * math.pi * j / sides), 0, 0.10 * math.sin(2 * math.pi * j / sides)))
            for j in range(sides)]
    top = [bm.verts.new((0.10 * math.cos(2 * math.pi * j / sides) + rng.uniform(-.02, .02), 1.0,
                         0.07 * math.sin(2 * math.pi * j / sides)))
           for j in range(sides)]
    for j in range(sides):
        k = (j + 1) % sides
        bm.faces.new((base[j], base[k], top[k], top[j]))
    bm.faces.new(list(reversed(base)))
    bm.faces.new(top)
    return to_object("gate_stone", bm)


def portal_arch():
    # an arch of radius 1 standing on z=0, a ring of thickness 0.09 swept over a half circle
    bm = bmesh.new()
    arcs, around, tr = 16, 8, 0.09
    rows = []
    for i in range(arcs + 1):
        th = math.pi * i / arcs
        cx, cy = math.cos(th), math.sin(th)
        rows.append([bm.verts.new((cx * (1 + tr * math.cos(a)), cy * (1 + tr * math.cos(a)), tr * math.sin(a)))
                     for a in (2 * math.pi * j / around for j in range(around))])
    for a, b in zip(rows, rows[1:]):
        for j in range(around):
            k = (j + 1) % around
            bm.faces.new((a[j], a[k], b[k], b[j]))
    return to_object("portal_arch", bm)


if __name__ == "__main__":
    for build in (wall_ring, floor, pool, gate_stone, portal_arch, path_tube):
        build()
    mat = bpy.data.materials.new("Rock")
    mat.diffuse_color = (0.55, 0.5, 0.46, 1.0)
    for ob in scene.objects:
        ob.data.materials.append(mat)
    bpy.ops.export_scene.gltf(filepath=OUT_KIT, export_format="GLB", export_apply=True, export_yup=False,
                              export_normals=True, export_texcoords=False, export_materials="NONE")
    spots = build_spots()
    with open(OUT_SPOTS, "w") as f:
        json.dump({"note": "Written by cave/build_kit.py from body/figure.glb. Units: chamber units "
                           f"({CHAMBER_PER_METRE:g} per metre of body girth). Do not edit by hand.",
                   "spots": spots}, f, indent=1)
        f.write("\n")
    print(f"wrote {OUT_KIT}: {os.path.getsize(OUT_KIT) // 1024} KB; {OUT_SPOTS}: {len(spots)} spots")
