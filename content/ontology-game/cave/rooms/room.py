"""Builds a cave room from a room spec (room.json), the structured form of a written room description (rooms/README.md).
Run: /home/user/blenv/bin/python content/ontology-game/cave/rooms/room.py rooms/<room>/room.json [--out DIR] [--no-render]

Writes into DIR (default /tmp/blender-cloud/rooms/<id>): room.glb, report.json, and, unless --no-render, the shell alone
and the dressed room from three cameras (shell_<view>.png, room_<view>.png). The spec says everything about the room;
this file only knows how to make each kind of part:

  shell      an oval floor, walls standing straight to wall_height_m, and a dome to height_m (hidden from the cameras,
             so they can see in). Openings are cut from the walls; a framed one gets stone jambs and a lintel.
  things     each placed by objects.obj() with the cave's sources: blenderkit (pinned CC0), local (the greenery picks),
             script (a builder in objects.py), plus two kinds added here: procgen (roots and mushrooms from
             tools/blender-cloud/procgen.py) and kit (a piece of cave-kit.glb).
  lights     a point light for each thing that says light; a faint fill the spec has to justify.

Every thing is checked (on the floor or hung below the dome, inside the walls) and the result lands in report.json with
the sentence of the description it came from, so each part traces back to the words.
"""
import json, math, os, random, sys

import bpy
import bmesh
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
CAVE = os.path.dirname(HERE)
sys.path.insert(0, CAVE)
sys.path.insert(0, os.path.join(CAVE, "..", "..", "..", "tools", "blender-cloud"))
import objects  # noqa: E402  the cave's object sources and obj()
import procgen  # noqa: E402
from textures import node, rgb, texture  # noqa: E402

SPEC_PATH = sys.argv[1]
SPEC = json.load(open(SPEC_PATH))


def in_metres(spec):
    """A spec written in player heights ("units": "player_heights", every *_m field and every position counted in the
    player's height) becomes metres here, at player_height_m a player height; light power goes with the square."""
    k = spec.get("player_height_m", 1.7)
    for key in ("width_m", "length_m", "height_m", "wall_height_m"):
        if key in spec["shell"]:
            spec["shell"][key] *= k
    if "cove" in spec["shell"]:
        spec["shell"]["cove"]["watts"] *= k * k
    if "rock" in spec["shell"]:
        spec["shell"]["rock"]["size_m"] = [c * k for c in spec["shell"]["rock"]["size_m"]]
    for h in spec["shell"].get("hollows", []):
        for key in ("z_m", "width_m", "height_m", "depth_m"):
            h[key] *= k
    for o in spec.get("openings", []):
        for key in ("width_m", "height_m", "fill_height_m"):
            if key in o:
                o[key] *= k
    for t in spec.get("things", []) + spec.get("lights", []):
        t["at"] = [c * k for c in t["at"]]
        for key in ("height_m", "hang_m", "z_m", "scale", "at_z"):
            if key in t:
                t[key] *= k
        if "watts" in t:
            t["watts"] *= k * k
        if "size" in t.get("source", {}):
            t["source"]["size"] = [c * k for c in t["source"]["size"]]
        if t.get("squash"):
            t["squash"]["width_m"] *= k
        if t.get("light"):
            t["light"]["at_z"] *= k
            t["light"]["watts"] *= k * k
    for v in spec.get("views", {}).values():
        v["from"], v["to"] = [c * k for c in v["from"]], [c * k for c in v["to"]]


if SPEC.get("units") == "player_heights":
    in_metres(SPEC)
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else f"/tmp/blender-cloud/rooms/{SPEC['id']}"
os.makedirs(OUT, exist_ok=True)
FLOOR_TOL, WALL_GAP = 0.01, 0.03

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene


# ---- materials: colour, roughness, optional glow, optional stone texture (rendered live from nodes) ----
def material(name, m):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*rgb(m["colour"]), 1)
    p.inputs["Roughness"].default_value = m.get("roughness", 0.8)
    if m.get("glow"):
        p.inputs["Emission Color"].default_value = (*rgb(m["colour"]), 1)
        p.inputs["Emission Strength"].default_value = m["glow"]
    if m.get("texture"):
        coord = node(nt, "ShaderNodeTexCoord")
        nt.links.new(texture(nt, m["texture"], m["colour"], coord.outputs["Object"]), p.inputs["Base Color"])
    if m.get("rock"):
        rock_surface(nt, p, m)
    return mat


def rock_surface(nt, p, m):
    """Rock drawn live: broad patches of lighter and darker stone, the seams and hollows darkened by ambient occlusion,
    and moss (m["moss"], a colour) gathered in the seams in patches. Cycles only; the GLB keeps the plain colour."""
    def mix_rgb(fac, a, b, blend="MIX"):
        n = node(nt, "ShaderNodeMix", data_type="RGBA", blend_type=blend)
        if isinstance(fac, float):
            n.inputs[0].default_value = fac
        else:
            nt.links.new(fac, n.inputs[0])
        for sock, v in ((n.inputs[6], a), (n.inputs[7], b)):
            if isinstance(v, tuple):
                sock.default_value = v
            else:
                nt.links.new(v, sock)
        return n.outputs[2]

    def math_(op, a, b=None, clamp=True):
        n = node(nt, "ShaderNodeMath", operation=op)
        n.use_clamp = clamp
        for sock, v in zip(n.inputs, (a, b)):
            if v is None:
                continue
            if isinstance(v, float):
                sock.default_value = v
            else:
                nt.links.new(v, sock)
        return n.outputs[0]

    coord = node(nt, "ShaderNodeTexCoord")
    c = rgb(m["colour"])
    broad = node(nt, "ShaderNodeTexNoise", **{"Scale": 0.9, "Detail": 6.0, "Roughness": 0.65})
    nt.links.new(coord.outputs["Object"], broad.inputs["Vector"])
    stone = mix_rgb(broad.outputs["Fac"], tuple(x * 0.45 for x in c) + (1,), tuple(min(1, x * 1.3) for x in c) + (1,))
    grain = node(nt, "ShaderNodeTexNoise", **{"Scale": 6.0, "Detail": 3.0})
    nt.links.new(coord.outputs["Object"], grain.inputs["Vector"])
    stone = mix_rgb(0.3, stone, grain.outputs["Color"], "OVERLAY")
    ao = node(nt, "ShaderNodeAmbientOcclusion", samples=8)
    ao.inputs["Distance"].default_value = m.get("seam_m", 0.6)
    crevice = math_("SUBTRACT", 1.0, ao.outputs["AO"])
    darker = mix_rgb(crevice, stone, (0.04, 0.03, 0.025, 1))
    out = darker
    if m.get("moss"):
        patch = node(nt, "ShaderNodeTexNoise", **{"Scale": 1.4, "Detail": 4.0})
        nt.links.new(coord.outputs["Object"], patch.inputs["Vector"])
        patchy = math_("MULTIPLY", math_("SUBTRACT", patch.outputs["Fac"], 0.38), 6.0)
        mossy = math_("MULTIPLY", math_("MULTIPLY", crevice, 5.0), patchy)
        out = mix_rgb(mossy, darker, (*rgb(m["moss"]), 1))
    nt.links.new(out, p.inputs["Base Color"])


SHELL = SPEC["shell"]
MATS = {k: material(k, v) for k, v in SPEC.get("materials", {}).items()}
MATS["wall"], MATS["floor"] = material("wall", SHELL["wall"]), material("floor", SHELL["floor"])
MATS["dome"] = material("dome", SHELL.get("dome", SHELL["wall"]))


# ---- the shell ----
RX, RY, H = SHELL["width_m"] / 2, SHELL["length_m"] / 2, SHELL["height_m"]
HW = SHELL.get("wall_height_m", H * 0.85)
noise = random.Random(SHELL.get("seed", 1))
PH = [noise.uniform(0, 6.3) for _ in range(3)]


def wall_r(a, t=0.0):
    """Distance from the centre to the wall at angle a (0 is straight ahead, away from the door; clockwise seen from
    above), for an oval with a little roughness. objects.check's signature, so the same function checks things."""
    oval = 1 / math.sqrt((math.sin(a) / RX) ** 2 + (math.cos(a) / RY) ** 2)
    return oval * (1 + SHELL.get("rough", 0.0) * (0.6 * math.sin(3 * a + PH[0]) + 0.4 * math.sin(7 * a + PH[1])))


def wrap(da):
    return (da + math.pi) % (2 * math.pi) - math.pi


ROCK = SHELL.get("rock")
LUMPS = []  # (angle, height, radius): the big rock forms the wall is made of
if ROCK:
    rr = random.Random(ROCK.get("seed", 1))
    span = 2 * math.pi * (RX + RY) / 2
    for _ in range(ROCK["count"]):
        LUMPS.append((rr.uniform(0, 2 * math.pi), rr.uniform(-0.2, 1.15) * HW, rr.uniform(*ROCK["size_m"])))
HOLLOWS = SHELL.get("hollows", [])


def clear_of_openings(a, z):
    """1 away from every opening, falling to 0 at its edge, so no rock bulges in front of a door."""
    m = 1.0
    for o in SPEC.get("openings", []):
        dx = abs(wrap(a - math.radians(o["angle_deg"]))) * wall_r(a) - o["width_m"] / 2
        dz = z - o["height_m"]
        d = max(dx, dz)
        m = min(m, max(0.0, min(1.0, d / 0.9)))
    return m


def hollow_at(a, z):
    """How far a hollow pushes the wall back at (a, z), and how much of the rock it clears there (0 to 1)."""
    back, clear = 0.0, 0.0
    for h in HOLLOWS:
        u = abs(wrap(a - math.radians(h["angle_deg"]))) * wall_r(a) / (h["width_m"] / 2)
        v = (z - h["z_m"]) / h["height_m"]  # 0 at its flat floor, 1 at the top of its arch
        if v < -0.15 or u > 1.6:
            continue
        top = 1 - u * u  # an arched outline: full height in the middle, falling to the sides
        inside = 0 <= v <= max(0.0, top) ** 0.5 and u <= 1
        if inside:  # eased in over the last stretch of the outline, so the edge is a slope, not a grid step
            m = max(0.0, min(1.0, (1 - u) / 0.45, (max(0.0, top) ** 0.5 - v) / 0.35))
            back = max(back, h["depth_m"] * (1 - 0.35 * v * v) * m * m * (3 - 2 * m))
        clear = max(clear, max(0.0, 1 - max(u - 1, -v, v - 1) / 0.6) if not inside else 1.0)
    return back, clear


def rock_in(a, z):
    """How far the rock forms stand into the room at (a, z): each lump a rounded boulder face, the largest wins, so
    the seams between them read as cracks."""
    if not LUMPS:
        return 0.0
    best = 0.0
    for la, lz, lr in LUMPS:
        dx = abs(wrap(a - la)) * wall_r(a)
        if dx > lr:
            continue
        d2 = (dx * dx + (z - lz) ** 2) / (lr * lr)
        if d2 < 1:
            best = max(best, lr * ROCK["depth"] * (1 - d2) ** 0.45)
    return best


def wall_point(a, z):
    """A point on the shell at angle a and height z: straight wall to HW, then a quarter-ellipse dome to H, made of
    rock forms that stand in from it and hollows cut back into it."""
    if z <= HW:
        k = 1.0
    else:
        s = min(1.0, (z - HW) / (H - HW))
        k = math.sqrt(max(0.0, 1 - s * s))
    back, clear = hollow_at(a, z)
    fade = 1.0 if z <= HW else max(0.0, 1 - (z - HW) / (0.7 * (H - HW)))
    r = wall_r(a) * k - rock_in(a, z) * (1 - clear) * clear_of_openings(a, z) * fade + back
    return (r * math.sin(a), r * math.cos(a), z)


def shell_r(a, z):
    x, y, _ = wall_point(a, z)
    return math.hypot(x, y)


def ceiling_z(x, y):
    """The dome's height above a floor point (for checking what hangs from it)."""
    a = math.atan2(x, y)
    rho = math.hypot(x, y) / wall_r(a)
    return HW if rho >= 1 else HW + (H - HW) * math.sqrt(1 - rho * rho)


SEG = 288 if ROCK else 96
NW, ND = (24, 10) if ROCK else (6, 6)
WALL_Z = sorted({HW * i / NW for i in range(NW + 1)} | {h["z_m"] for h in HOLLOWS})  # a ring at each hollow's floor
DOME_Z = [HW + (H - HW) * math.sin(math.pi / 2 * i / ND) for i in range(1, ND + 1)]
OPEN = []  # (opening, set of cut segment indices)
for o in SPEC.get("openings", []):
    a0 = math.radians(o["angle_deg"])
    cut = set()
    for j in range(SEG):
        a = 2 * math.pi * (j + 0.5) / SEG
        da = (a - a0 + math.pi) % (2 * math.pi) - math.pi
        if abs(da) * wall_r(a) < o["width_m"] / 2:
            cut.add(j)
    OPEN.append((o, cut))


def is_cut(j, z_bottom):
    return any(j in cut and z_bottom < o["height_m"] for o, cut in OPEN)


def mesh_object(name, verts, faces, mat):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    me.materials.append(mat)
    return ob


def shell_part(name, zs, keep, mat):
    """Quads between consecutive heights zs, for the segments keep(angle) accepts, wound to face the room."""
    verts, faces, idx = [], [], {}
    for j in range(SEG):
        if not keep(2 * math.pi * (j + 0.5) / SEG):
            continue
        for i in range(len(zs) - 1):
            if is_cut(j, zs[i]):
                continue
            quad = [(j, i), (j, i + 1), (j + 1, i + 1), (j + 1, i)]
            for q in quad:
                if q not in idx:
                    idx[q] = len(verts)
                    verts.append(wall_point(2 * math.pi * (q[0] % SEG) / SEG, zs[q[1]]))
            faces.append([idx[q] for q in quad])
    ob = mesh_object(name, verts, faces, mat)
    if ROCK:  # the seams between rock faces stay sharp, so they read as cracks
        ob.data.set_sharp_from_angle(angle=math.radians(28))
    return ob


back, front = (lambda a: math.cos(a) >= 0), (lambda a: math.cos(a) < 0)
shell = {"walls_back": shell_part("walls_back", WALL_Z, back, MATS["wall"]),
         "walls_front": shell_part("walls_front", WALL_Z, front, MATS["wall"]),
         "dome": shell_part("dome", [HW] + DOME_Z, lambda a: True, MATS["dome"])}
ring = [wall_point(2 * math.pi * j / SEG, 0) for j in range(SEG)]
shell["floor"] = mesh_object("floor", [(0, 0, 0)] + ring, [(0, (j + 1) % SEG + 1, j + 1) for j in range(SEG)], MATS["floor"])


def box(name, centre, size, turn, mat):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    me.materials.append(mat)
    ob.location, ob.rotation_euler = centre, (0, 0, -turn)
    return ob


before_kit = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=os.path.join(CAVE, "cave-kit.glb"))
KIT = {}
for o in set(bpy.data.objects) - before_kit:
    if o.type == "MESH":
        KIT[o.name.split(".")[0]] = o.data  # a kit piece can share a name with a shell part (floor)
    bpy.data.objects.remove(o)
KIT_ARCH = KIT["portal_arch"]


def tint(obs, colour):
    """Multiplies each material's colour map by colour: a model whose colours came in grey takes the words' colour."""
    for ob in obs:
        for i, m in enumerate(ob.data.materials):
            t = m.copy()
            nt = t.node_tree
            p = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
            mul = nt.nodes.new("ShaderNodeMix")
            mul.data_type, mul.blend_type = "RGBA", "MULTIPLY"
            mul.inputs["Factor"].default_value = 1.0
            mul.inputs["B"].default_value = (*rgb(colour), 1)
            link = next((l for l in nt.links if l.to_socket == p.inputs["Base Color"]), None)
            if link:
                nt.links.new(link.from_socket, mul.inputs["A"])
            else:
                mul.inputs["A"].default_value = p.inputs["Base Color"].default_value
            nt.links.new(mul.outputs["Result"], p.inputs["Base Color"])
            ob.data.materials[i] = t


# ---- openings: frame, fill, and a dark backing so the hole reads as a way on ----
OBJECTS, ROWS, LIGHTS = [], [], []
dark = material("beyond", {"colour": "#050505", "roughness": 1.0})
for o, cut in OPEN:
    a0 = math.radians(o["angle_deg"])
    starts = [(2 * math.pi * j / SEG - a0 + math.pi) % (2 * math.pi) - math.pi for j in cut]
    edges = [a0 + min(starts), a0 + max(starts) + 2 * math.pi / SEG]
    top = min(z for z in WALL_Z + DOME_Z if z >= o["height_m"])
    r0 = wall_r(a0)
    out = Vector((math.sin(a0), math.cos(a0), 0))
    across = abs(edges[1] - edges[0]) * r0
    box(f"{o['id']}.beyond", out * (r0 + 0.6), (across + 0.6, 0.05, top), a0, dark).location.z = top / 2
    if o.get("frame"):
        fm = MATS[o.get("frame_material", o["frame"])]
        for k, e in enumerate(edges):
            p = Vector(wall_point(e, 0))
            box(f"{o['id']}.jamb{k}", (p.x, p.y, top / 2), (0.22, 0.4, top), a0, fm)
        if o["frame"] == "arch":  # the kit's arch, stretched round the door, a hand's width into the room
            arch = bpy.data.objects.new(o["id"] + ".arch", KIT_ARCH.copy())
            sc.collection.objects.link(arch)
            arch.data.materials.clear()
            arch.data.materials.append(fm)
            arch.location = out * (r0 - 0.12)
            arch.rotation_euler = (0, 0, -a0)
            arch.scale = ((across + 1.0) / 2.18, 1.6, o.get("fill_height_m", o["height_m"]) * 1.25 / 1.09)
        lintel_z = o.get("fill_height_m", o["height_m"])
        box(f"{o['id']}.lintel", out * r0 + Vector((0, 0, (lintel_z + top) / 2)), (across + 0.3, 0.4, top - lintel_z), a0, fm)
    if o.get("fill"):
        ob = objects.obj(o["id"], {"licence": "cc_zero", **o["fill"]}, (out.x * r0, out.y * r0), -math.degrees(a0) + o.get("fill_turn_deg", 0),
                         o["fill_height_m"], 10 ** 9, o.get("fill_faces", 3000), None, OBJECTS)
        ob.scale.x = (across - 0.05) / ob.dimensions.x if ob.dimensions.x > across else 1.0
        if o.get("fill_tint"):
            tint([ob], o["fill_tint"])
        ROWS.append({"id": o["id"], "says": o["says"], "kind": "opening", "row": OBJECTS[-1]["row"], "in_wall": True})
    else:
        ROWS.append({"id": o["id"], "says": o["says"], "kind": "opening", "row": {"source": "cut from the shell"},
                     "in_wall": True})


# ---- the two sources added for rooms: procgen and kit ----
def from_procgen(name, src, faces):
    if src["make"] == "roots":
        v, f = procgen.root_system(seed=src["seed"], roots=src.get("roots", 2), **procgen.ROOT_STYLES[src["style"]])
        what = f"root_system(seed={src['seed']}, style {src['style']!r})"
    elif src["make"] == "mushrooms":
        v, f, _ = procgen.mushroom_cluster(seed=src["seed"], kind=src.get("cluster", "clump"), count=src.get("count", 9))
        what = f"mushroom_cluster(seed={src['seed']}, kind {src.get('cluster', 'clump')!r})"
    else:
        objects.stop(f"{name}: procgen makes roots or mushrooms, not {src['make']!r}")
    ob = mesh_object(name, v, f, MATS["root"])
    ob.data.materials.clear()
    return ob, {"source": f"tools/blender-cloud/procgen.py, {what}", "licence": "own work"}


objects.SOURCES["procgen"] = from_procgen
def from_glb(name, src, faces):
    """One of our own GLBs (the body map's figure, for a sense of scale)."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(CAVE, src["file"]))
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in new:
        if o not in meshes:
            bpy.data.objects.remove(o)
    for o in sc.objects:
        o.select_set(o in meshes)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.parent = None
    return ob, {"source": f"cave/{src['file']}", "licence": "own work"}


objects.SOURCES["glb"] = from_glb


def block(bm, size=(1, 1, 1)):
    """A plain stone block, size (x, y, z), standing on z=0: a plinth or a step."""
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    bmesh.ops.translate(bm, vec=(0, 0, size[2] / 2), verts=bm.verts)


def bench(bm, size=(2.2, 0.7, 0.45), rise=0.35, n=16):
    """A low stone bench, size (length, depth, height), its seat dipping in the middle and its ends rising like a saddle,
    edges softened."""
    L, D, Hb = size
    rows = []
    for i in range(n + 1):
        u = i / n * 2 - 1
        top = Hb * (1 + rise * u * u)
        w = D * (1 - 0.12 * u * u)
        ring = [(u * L / 2, -w / 2, 0), (u * L / 2, -w / 2 * 0.96, top * 0.97), (u * L / 2, 0, top), (u * L / 2, w / 2 * 0.96, top * 0.97),
                (u * L / 2, w / 2, 0)]
        rows.append([bm.verts.new(v) for v in ring])
    for a, b in zip(rows, rows[1:]):
        for j in range(4):
            bm.faces.new((a[j], b[j], b[j + 1], a[j + 1]))
        bm.faces.new((a[4], b[4], b[0], a[0]))
    for r in (rows[0], rows[-1][::-1]):
        bm.faces.new(r[::-1])


def ring(bm, size=(1.0, 0.9, 0.01), n=64):
    """A flat ring set into the floor, size (outer radius, inner radius, thickness): an inlay."""
    ro, ri, t = size
    loops = [[bm.verts.new((r * math.cos(2 * math.pi * j / n), r * math.sin(2 * math.pi * j / n), z)) for j in range(n)]
             for r, z in ((ri, 0), (ro, 0), (ro, t), (ri, t))]
    for a, b in zip(loops, loops[1:] + loops[:1]):
        for j in range(n):
            bm.faces.new((a[j], a[(j + 1) % n], b[(j + 1) % n], b[j]))


BUILDERS = {"cushion": objects.cushion, "block": block, "bench": bench, "ring": ring}


# ---- things ----
for t in SPEC["things"]:  # a thing in a hollow stands on its floor, set back into it
    if t.get("hollow"):
        h = next(x for x in HOLLOWS if x["id"] == t["hollow"])
        a = math.radians(h["angle_deg"])
        r = wall_r(a) + h["depth_m"] * 0.45
        t["at"], t["z_m"] = [r * math.sin(a), r * math.cos(a)], h["z_m"]
        t["turn_deg"] = -h["angle_deg"] + t.get("turn_deg", 0)
for l in SPEC.get("lights", []):  # a light in a hollow sits at its mouth, half way up
    if l.get("hollow"):
        h = next(x for x in HOLLOWS if x["id"] == l["hollow"])
        a = math.radians(h["angle_deg"])
        r = wall_r(a) - 0.25
        l["at"], l["at_z"] = [r * math.sin(a), r * math.cos(a)], h["z_m"] + h["height_m"] * 0.5
for t in SPEC["things"]:
    src = dict(t["source"])
    src.setdefault("licence", "cc_zero")
    mat = MATS[t["material"]] if t.get("material") else None
    if src["kind"] == "kit":
        ob = bpy.data.objects.new(t["id"], KIT[src["piece"]].copy())
        sc.collection.objects.link(ob)
        ob.data.materials.clear()
        ob.data.materials.append(mat)
        ob.location = (t["at"][0], t["at"][1], t.get("z_m", 0))
        ob.rotation_euler = (0, 0, math.radians(t.get("turn_deg", 0)))
        ob.scale = (t["scale"],) * 3
        row = {"source": f"cave-kit.glb, piece {src['piece']!r} (cave/build_kit.py)", "licence": "own work"}
        OBJECTS.append({"obs": [ob], "hang": None, "row": row, "free": True})
    else:
        if src["kind"] == "script":
            fn, size = BUILDERS[src["builder"]], src.get("size")
            src["builder"] = (lambda bm, fn=fn, size=size: fn(bm, size)) if size else fn
            src["builder"].__name__ = fn.__name__
        ob = objects.obj(t["id"], src, tuple(t["at"]), t.get("turn_deg", 0), t["height_m"], 10 ** 9, t.get("faces", 1500),
                         mat, OBJECTS, hang=t.get("hang_m"))
        if t.get("squash"):
            ob.scale.x = ob.scale.y = t["squash"]["width_m"] / max(ob.dimensions.x, ob.dimensions.y)
        if t.get("tint"):
            tint(OBJECTS[-1]["obs"], t["tint"])
        if t.get("z_m"):  # stands on something else (a lantern on its plinth)
            for x in OBJECTS[-1]["obs"]:
                x.location.z += t["z_m"]
            OBJECTS[-1]["free"] = True
    ROWS.append({"id": t["id"], "says": t["says"], "kind": "thing", "row": OBJECTS[-1]["row"]})
    if t.get("light"):
        LIGHTS.append((t["id"], t["at"], t["light"]))
for l in SPEC.get("lights", []):
    LIGHTS.append((l["id"], l["at"], l))
cove = SHELL.get("cove")  # lamps hidden along the top of the wall, washing the dome
if cove:
    for i in range(cove["count"]):
        a = 2 * math.pi * (i + 0.5) / cove["count"]
        r = wall_r(a) * cove.get("inset", 0.85)
        LIGHTS.append((f"cove.{i}", [r * math.sin(a), r * math.cos(a)],
                       {"colour": cove["colour"], "watts": cove["watts"], "at_z": HW * cove.get("at", 0.95)}))


# ---- checks: on the floor or hung below the dome, inside the walls ----
bpy.context.view_layer.update()
misses = []
for o in OBJECTS:
    obs, row = o["obs"], o["row"]
    rec = next((r for r in ROWS if r["row"] is row), None)
    world = [x.matrix_world @ c.co for x in obs for c in x.data.vertices]
    low, top = min(p.z for p in world), max(p.z for p in world)
    rec["lowest_cm"], rec["top_m"] = round(low * 100, 1), round(top, 3)
    rec["faces"] = sum(len(x.data.polygons) for x in obs)
    if o.get("free"):
        continue
    if o["hang"] is None and abs(low) > FLOOR_TOL:
        misses.append(f"{rec['id']}: lowest vertex {low * 100:.1f} cm off the floor")
    if o["hang"] is not None:
        over = [p for p in world if p.z > ceiling_z(p.x, p.y) + 0.02]
        if over:
            misses.append(f"{rec['id']}: {len(over)} vertices above the dome")
    if not rec.get("in_wall"):
        outside = [p for p in world if math.hypot(p.x, p.y) > shell_r(math.atan2(p.x, p.y), min(max(p.z, 0), HW)) - WALL_GAP]
        if outside:
            misses.append(f"{rec['id']}: {len(outside)} vertices within {WALL_GAP * 100:.0f} cm of the wall or past it")

# ---- lights ----
for lid, at, l in LIGHTS:
    lamp = bpy.data.lights.new(lid, "POINT")
    lamp.color, lamp.energy, lamp.shadow_soft_size = rgb(l["colour"]), l["watts"], 0.15
    lo = bpy.data.objects.new(lid + ".light", lamp)
    lo.location = (at[0], at[1], l["at_z"])
    sc.collection.objects.link(lo)
fill = SPEC.get("fill_light") or {"colour": "#000000", "strength": 0}
world = bpy.data.worlds.new("cave")
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (*rgb(fill["colour"]), 1)
world.node_tree.nodes["Background"].inputs["Strength"].default_value = fill["strength"]
sc.world = world

# ---- export and report ----
glb = os.path.join(OUT, "room.glb")
# A colour drawn live from nodes (stone, rock, moss) cannot go into a glTF, and the exporter writes white in its place.
# Until a bake step exists, the GLB takes the material's plain colour: the link is lifted for the export and put back
# for the renders.
lifted = []
for mat in bpy.data.materials:
    if not mat.use_nodes or "Principled BSDF" not in mat.node_tree.nodes:
        continue
    if any(n.type == "TEX_IMAGE" for n in mat.node_tree.nodes):  # a model's own pictures (and a tint over them) export as they are
        continue
    sock = mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"]
    for ln in list(sock.links):
        if ln.from_node.type != "TEX_IMAGE":
            lifted.append((mat.node_tree, ln.from_socket, sock))
            mat.node_tree.links.remove(ln)
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_apply=True, export_lights=True,
                          export_image_format="JPEG", export_jpeg_quality=82)
for nt, a, b in lifted:
    nt.links.new(a, b)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in sc.objects if o.type == "MESH")
report = {"id": SPEC["id"], "spec": os.path.relpath(SPEC_PATH, CAVE), "glb_bytes": os.path.getsize(glb), "triangles": tris,
          "parts": [{k: v for k, v in r.items() if k != "row"} | {"source": r["row"].get("source"),
                    "licence": r["row"].get("licence"), "blenderkit_id": r["row"].get("blenderkit_id")} for r in ROWS],
          "left_out": SPEC.get("left_out", []), "misses": misses}
json.dump(report, open(os.path.join(OUT, "report.json"), "w"), indent=2)
print(f"wrote {glb}: {report['glb_bytes'] // 1024} KB, {tris} triangles, {len(ROWS)} parts, {len(misses)} misses")
for m in misses:
    print("  MISS", m)

# ---- renders: the bare shell, then the dressed room, from the same cameras ----
if "--no-render" not in sys.argv:
    sc.render.engine = "CYCLES"  # Workbench and EEVEE need a GPU; the cloud has none
    sc.cycles.device, sc.cycles.samples, sc.cycles.seed = "CPU", int(os.environ.get("ROOM_SAMPLES", 48)), 0
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 800, 520
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "AgX"
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    views = {  # name: camera, aim, walls hidden from the camera (the dome always is), orthographic
        "in": ((0.9, -RY * 1.9, H * 2.1), (0, 0.2 * RY, 0.25), ("walls_front",), False),
        "back": ((-0.9, RY * 1.9, H * 2.1), (0, -0.2 * RY, 0.25), ("walls_back",), False),
        "top": ((0, 0, H * 4), (0, 0.0001, 0), ("walls_front", "walls_back"), True),
    }
    for name, v in SPEC.get("views", {}).items():  # a view inside the room, at the player's eye, sees the dome too
        views[name] = (tuple(v["from"]), tuple(v["to"]), (), False)
    keep_in_shell = {o.name for o in sc.objects if any(o.name.startswith(x["id"] + ".") for x in SPEC.get("openings", []))} | set(shell)
    dressing = [o for o in sc.objects if o.type in ("MESH", "LIGHT") and o.name not in keep_in_shell]
    work = bpy.data.objects.new("work", bpy.data.lights.new("work", "POINT"))  # the shell alone has no lamps of its own
    work.data.energy, work.data.shadow_soft_size, work.location = 120, 0.5, (0, 0, HW * 0.9)
    sc.collection.objects.link(work)
    for stage in ("shell", "room"):
        for o in dressing:
            o.hide_render = stage == "shell"
        work.hide_render = stage == "room"
        for view, (loc, aim, hidden, ortho) in views.items():
            cam.location = loc
            cam.rotation_euler = (Vector(aim) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
            cam_data.type = "ORTHO" if ortho else "PERSP"
            cam_data.ortho_scale = 2.5 * RY * sc.render.resolution_x / sc.render.resolution_y
            cam_data.lens = SPEC.get("views", {}).get(view, {}).get("lens", 30)
            shell["dome"].visible_camera = view in SPEC.get("views", {})
            for w in ("walls_front", "walls_back"):
                shell[w].visible_camera = w not in hidden
            for o in sc.objects:  # an opening in a hidden wall goes with it: frame, door and backing
                side = next((x for x in SPEC.get("openings", []) if o.name == x["id"] or o.name.startswith(x["id"] + ".")), None)
                if side:
                    o.visible_camera = ("walls_back" if math.cos(math.radians(side["angle_deg"])) >= 0 else "walls_front") not in hidden
            sc.render.filepath = os.path.join(OUT, f"{stage}_{view}.png")
            bpy.ops.render.render(write_still=True)
    print("rendered", OUT)
