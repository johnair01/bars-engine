"""Writes chamber_code.py: the same chamber as scene.yaml, written as plain bpy code with every value inline.

T2 compares editing the recipe with editing this. It is what the chamber looks like when Claude writes Blender code
directly: no recipe, no placement helpers, one line per piece.
    python3 tools/blender-cloud/recipe_trial/make_code_baseline.py <scene.yaml> <out.py>
"""
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAVE = os.path.normpath(os.path.join(HERE, "..", "..", "..", "content", "ontology-game", "cave"))
sys.path.insert(0, HERE)
import build_scene  # noqa: E402

r = build_scene.load(sys.argv[1])
ch, lt = r["chamber"], r["light"]


def hexc(c):
    return "#" + "".join(f"{round(v * 255):02x}" for v in c)


L = [f'''"""The pool chamber of the Cave of Lessons, built in Blender. Run: /home/user/blenv/bin/python content/ontology-game/cave/chamber.py [--no-render]
Writes chamber.glb, view_front.png, view_top.png into /tmp/blender-cloud/chamber (or the folder after --out).\nTo change the chamber, edit this file: the pieces are one place(...) line each, near the end (bpt-recipe-result)."""
import math, os, random, sys
import bpy
import bmesh

KIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cave-kit.glb")  # pieces: pool, gate_stone, portal_arch, stone_spire, glow_cap, root_curl, crystal_cluster, crystal_cluster_bed; each 1 unit high (pool, arch: radius 1)
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "/tmp/blender-cloud/chamber"
os.makedirs(OUT, exist_ok=True)
R, H, SEED, ROUGH = {ch["radius"]:g}, {ch["height"]:g}, {ch["seed"]}, {ch["rough"]:g}  # chamber radius and height in metres
LIGHT, LIGHT_STRENGTH, AMBIENT = "{hexc(lt["colour"])}", {lt["strength"]:g}, {lt["ambient"]:g}

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=KIT)
kit = {{o.name: o.data for o in sc.objects}}
for o in list(sc.objects):
    bpy.data.objects.remove(o)


def rgb(h):
    return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))


def mat(name, colour, rough, glow=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*rgb(colour), 1)
    p.inputs["Roughness"].default_value = rough
    if glow:
        p.inputs["Emission Color"].default_value = (*rgb(colour), 1)
        p.inputs["Emission Strength"].default_value = glow
    return m


def place(name, piece, material, loc, rot_deg, scale):
    ob = bpy.data.objects.new(name, kit[piece].copy())
    sc.collection.objects.link(ob)
    ob.data.materials.clear()
    ob.data.materials.append(material)
    ob.location = loc
    ob.rotation_euler = tuple(math.radians(a) for a in rot_deg)
    ob.scale = scale
    return ob


# ---- materials ----''']
for name, lk in r["looks"].items():
    dark = 1 - 0.45 * lk["wet"]
    col = hexc(tuple(c * dark for c in lk["colour"]))
    rough = round(lk["rough"] * (1 - 0.8 * lk["wet"]), 3)
    glow = f", glow={lk['glow'] * 5:g}" if lk["glow"] else ""
    L.append(f'M_{name.upper()} = mat("{name}", "{col}", {rough:g}{glow})')

src = open(os.path.join(HERE, "build_scene.py")).read()
walls = src[src.index("    # walls and floor"):src.index("    counts, warnings")]
walls = "\n".join(l[4:] for l in walls.splitlines())
walls = walls.replace('ch["rough"]', "ROUGH").replace('r["walls"]', "M_WALL").replace('r["floor"]', "M_FLOOR")
walls = walls.replace("random.Random(seed)", "random.Random(SEED)")
L.append("\n\ndef add(name, mesh, material):\n    ob = bpy.data.objects.new(name, mesh)\n    sc.collection.objects.link(ob)\n"
         "    mesh.materials.append(material)\n    return ob\n\n")
L.append(walls.rstrip())
L.append("\n# ---- pieces: name, piece, material, location (x right, y back, z up; metres), rotation (degrees), scale ----")
counts = {}
for ob, x, y, z, t, s, hang in build_scene.placements(r):
    piece = ob["piece"]
    counts[piece] = counts.get(piece, 0) + 1
    w = ob.get("wide", 1)
    sc_ = (s, s, s) if piece == "pool" else (s * w, s * w, s)
    zz = z + (0.06 * s if piece == "pool" else 0)
    parts = [(piece, ob.get("look", "wall"))]
    if piece == "crystal_cluster":
        parts.append(("crystal_cluster_bed", ob.get("bed", "wall")))
    for pname, look in parts:
        L.append(f'place("{ob.get("id", piece)}.{counts[piece]}", "{pname}", M_{look.upper()}, ({x:.2f}, {y:.2f}, {zz:.2f}), '
                 f'({180 if hang else 0}, 0, {t:.0f}), ({sc_[0]:.2f}, {sc_[1]:.2f}, {sc_[2]:.2f}))')

rend = src[src.index("    glb = os.path.join(out_dir"):src.index("    with open(os.path.join(out_dir, \"report.json\")")]
rend = "\n".join(l[4:] for l in rend.splitlines())
rend = rend.replace("out_dir", "OUT").replace('lt["colour"]', "rgb(LIGHT)").replace('lt["strength"]', "LIGHT_STRENGTH")
rend = rend.replace('lt["ambient"]', "AMBIENT").replace("if render:", 'if "--no-render" not in sys.argv:')
rend = rend.replace('    report = {"objects": counts, "triangles": tris, "glb_bytes": os.path.getsize(glb), "warnings": warnings}\n', "")
rend = rend.replace('report = {"objects": counts, "triangles": tris, "glb_bytes": os.path.getsize(glb), "warnings": warnings}\n', "")
L.append("\n" + rend.rstrip())
L.append('print(f"wrote {glb}: {os.path.getsize(glb) // 1024} KB, {tris} triangles")')
open(sys.argv[2], "w").write("\n".join(L) + "\n")
