"""Builds a cave chamber from its recipe, scene.yaml (schema: RECIPE.md). Kept as the record of T1 to T3 (RESULTS.md):
the recipe missed its token line and was dropped (bpt-recipe-result). The chamber the game builds on is cave/chamber.py.

Claude changes the cave by editing the recipe, never this script (blender-pipeline-test Part 2, `bpt-recipe`). The
script reads the recipe, places pieces from cave-kit.glb, makes the chamber's walls and floor, renders two views and
writes a GLB:

    python3 tools/blender-cloud/recipe_trial/build_scene.py --check            # check the recipe only: no Blender, a second
    /home/user/blenv/bin/python tools/blender-cloud/recipe_trial/build_scene.py [recipe] --out /tmp/blender-cloud/scene

Output in --out (kept out of git): chamber.glb, view_front.png, view_top.png, report.json. The same recipe gives the
same file every run (the seed in `chamber`). Positions are metres on the floor: x to the right, y away from the
camera, the chamber's centre at [0, 0].
"""
import json
import math
import os
import random
import sys

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
KIT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "content", "ontology-game", "cave", "cave-kit.glb"))

# Kit pieces a recipe may place. Each is one unit high as built (pool and arch: radius 1), so size is metres.
PIECES = {"pool": 1.0, "gate_stone": 0.16, "portal_arch": 0.1, "stone_spire": 0.25, "glow_cap": 0.43,
          "root_curl": 0.31, "crystal_cluster": 0.36}  # value: footprint radius at size 1, to keep pieces off the wall
LOOK_KEYS = {"colour", "rough", "wet", "glow", "glow_colour"}
OBJECT_KEYS = {"id", "piece", "look", "size", "wide", "turn", "hang", "bed", "at", "ring", "scatter", "wall"}
PLACES = ("at", "ring", "scatter", "wall")


class RecipeError(Exception):
    pass


def _num(v, where, lo=None, hi=None):
    if isinstance(v, bool) or not isinstance(v, (int, float)):
        raise RecipeError(f"{where}: expected a number, got {v!r}")
    if (lo is not None and v < lo) or (hi is not None and v > hi):
        raise RecipeError(f"{where}: {v} is outside {lo} to {hi}")
    return float(v)


def _colour(v, where):
    if not (isinstance(v, str) and len(v) == 7 and v[0] == "#"):
        raise RecipeError(f"{where}: colours are written \"#rrggbb\", got {v!r}")
    try:
        return tuple(int(v[i:i + 2], 16) / 255 for i in (1, 3, 5))
    except ValueError:
        raise RecipeError(f"{where}: {v!r} is not a hex colour")


def _point(v, where):
    if not (isinstance(v, list) and len(v) == 2):
        raise RecipeError(f"{where}: a point is [x, y], got {v!r}")
    return [_num(v[0], where), _num(v[1], where)]


def check(recipe):
    """Raises RecipeError naming the first thing wrong. Returns the recipe with defaults filled in."""
    if not isinstance(recipe, dict):
        raise RecipeError("the recipe is not a mapping")
    unknown = set(recipe) - {"chamber", "light", "looks", "walls", "floor", "objects"}
    if unknown:
        raise RecipeError(f"top level: unknown key(s) {sorted(unknown)}")
    ch = dict(recipe.get("chamber") or {})
    ch["radius"] = _num(ch.get("radius", 7), "chamber.radius", 2, 30)
    ch["height"] = _num(ch.get("height", 5), "chamber.height", 1, 30)
    ch["seed"] = int(_num(ch.get("seed", 7), "chamber.seed"))
    ch["rough"] = _num(ch.get("rough", 0.06), "chamber.rough", 0, 0.3)
    lt = dict(recipe.get("light") or {})
    lt["colour"] = _colour(lt.get("colour", "#ffffff"), "light.colour")
    lt["strength"] = _num(lt.get("strength", 1), "light.strength", 0, 10)
    lt["ambient"] = _num(lt.get("ambient", 0.15), "light.ambient", 0, 5)
    looks = {}
    for name, lk in (recipe.get("looks") or {}).items():
        if not isinstance(lk, dict):
            raise RecipeError(f"looks.{name}: expected a mapping")
        bad = set(lk) - LOOK_KEYS
        if bad:
            raise RecipeError(f"looks.{name}: unknown key(s) {sorted(bad)}; allowed {sorted(LOOK_KEYS)}")
        looks[name] = {"colour": _colour(lk.get("colour", "#808080"), f"looks.{name}.colour"),
                       "rough": _num(lk.get("rough", 0.8), f"looks.{name}.rough", 0, 1),
                       "wet": _num(lk.get("wet", 0), f"looks.{name}.wet", 0, 1),
                       "glow": _num(lk.get("glow", 0), f"looks.{name}.glow", 0, 10)}
        looks[name]["glow_colour"] = _colour(lk["glow_colour"], f"looks.{name}.glow_colour") \
            if "glow_colour" in lk else looks[name]["colour"]
    for part in ("walls", "floor"):
        if recipe.get(part, part) not in looks and part in recipe:
            raise RecipeError(f"{part}: look {recipe[part]!r} is not in looks")
    ids, objs = set(), []
    for i, ob in enumerate(recipe.get("objects") or []):
        where = f"objects[{i}]" + (f" ({ob.get('id')})" if isinstance(ob, dict) and ob.get("id") else "")
        if not isinstance(ob, dict):
            raise RecipeError(f"{where}: expected a mapping")
        bad = set(ob) - OBJECT_KEYS
        if bad:
            raise RecipeError(f"{where}: unknown key(s) {sorted(bad)}; allowed {sorted(OBJECT_KEYS)}")
        if ob.get("piece") not in PIECES:
            raise RecipeError(f"{where}: piece {ob.get('piece')!r} is not one of {sorted(PIECES)}")
        for k in ("look", "bed"):
            if k in ob and ob[k] not in looks:
                raise RecipeError(f"{where}: {k} {ob[k]!r} is not in looks")
        places = [k for k in PLACES if k in ob]
        if len(places) != 1:
            raise RecipeError(f"{where}: give exactly one of {list(PLACES)}, got {places or 'none'}")
        size = ob.get("size", 1)
        if isinstance(size, list):
            if len(size) != 2:
                raise RecipeError(f"{where}.size: a range is [min, max]")
            [_num(s, f"{where}.size", 0.05, 30) for s in size]
        else:
            _num(size, f"{where}.size", 0.05, 30)
        if "wide" in ob:
            _num(ob["wide"], f"{where}.wide", 0.1, 10)
        if "turn" in ob and ob["turn"] != "random":
            _num(ob["turn"], f"{where}.turn")
        place = ob[places[0]]
        if places[0] == "at":
            _point(place, f"{where}.at")
        else:
            if not isinstance(place, dict):
                raise RecipeError(f"{where}.{places[0]}: expected a mapping")
            allowed = {"ring": {"around", "radius", "count", "start"}, "scatter": {"near", "radius", "count"},
                       "wall": {"at", "count", "from", "to"}}[places[0]]
            bad = set(place) - allowed
            if bad:
                raise RecipeError(f"{where}.{places[0]}: unknown key(s) {sorted(bad)}; allowed {sorted(allowed)}")
            if "count" in place:
                _num(place["count"], f"{where}.{places[0]}.count", 1, 60)
            for k in ("around", "near"):
                if k in place and not isinstance(place[k], list) and place[k] not in ids:
                    raise RecipeError(f"{where}.{places[0]}.{k}: {place[k]!r} is not the id of an earlier object")
            if places[0] == "wall" and "at" not in place and not {"count", "from", "to"} <= set(place):
                raise RecipeError(f"{where}.wall: give at (one piece) or count, from and to (a row)")
        if "id" in ob:
            if ob["id"] in ids:
                raise RecipeError(f"{where}: id {ob['id']!r} is used twice")
            ids.add(ob["id"])
        objs.append(ob)
    for name in ("wall", "floor"):
        looks.setdefault(name, {"colour": (0.4, 0.37, 0.34), "rough": 0.85, "wet": 0, "glow": 0,
                                "glow_colour": (0.4, 0.37, 0.34)})
    return {"chamber": ch, "light": lt, "looks": looks, "walls": recipe.get("walls", "wall"),
            "floor": recipe.get("floor", "floor"), "objects": objs}


def placements(r):
    """Each object entry expanded to (entry, x, y, z, turn_deg, size, hanging), in recipe order. No Blender needed."""
    R, H = r["chamber"]["radius"], r["chamber"]["height"]
    centres, out = {}, []
    for i, ob in enumerate(r["objects"]):
        rng = random.Random(r["chamber"]["seed"] * 1000 + i)
        foot = PIECES[ob["piece"]]

        def size():
            s = ob.get("size", 1)
            return rng.uniform(*s) if isinstance(s, list) else float(s)

        def turn(default):
            t = ob.get("turn", default)
            return rng.uniform(0, 360) if t == "random" else float(t)

        def point(p):
            return centres[p] if isinstance(p, str) else p

        hang = bool(ob.get("hang"))
        rows = []
        if "at" in ob:
            rows.append((*ob["at"], turn(0), size()))
        elif "ring" in ob:
            g = ob["ring"]
            c, rad, n = point(g.get("around", [0, 0])), g.get("radius", 2), int(g.get("count", 6))
            for k in range(n):
                a = math.radians(g.get("start", 0) + 360 * k / n)
                rows.append((c[0] + rad * math.sin(a), c[1] + rad * math.cos(a), turn(-math.degrees(a)), size()))
        elif "scatter" in ob:
            g = ob["scatter"]
            c, rad, n = point(g.get("near", [0, 0])), g.get("radius", 1), int(g.get("count", 3))
            for k in range(n):
                a, d = rng.uniform(0, 2 * math.pi), rad * math.sqrt(rng.random())
                rows.append((c[0] + d * math.cos(a), c[1] + d * math.sin(a), turn("random"), size()))
        else:
            g = ob["wall"]
            angs = [g["at"]] if "at" in g else \
                [g["from"] + (g["to"] - g["from"]) * (k / max(1, g["count"] - 1)) for k in range(int(g["count"]))]
            for a in angs:
                s = size()
                inset = R * (1 - r["chamber"]["rough"]) - (0.15 if hang else foot * s * ob.get("wide", 1) + 0.15)
                rows.append((inset * math.sin(math.radians(a)), inset * math.cos(math.radians(a)), turn(-a), s))
        for x, y, t, s in rows:
            out.append((ob, x, y, H * 0.97 if hang else 0.0, t, s, hang))
        if "id" in ob:
            centres[ob["id"]] = [sum(rw[0] for rw in rows) / len(rows), sum(rw[1] for rw in rows) / len(rows)]
    return out


def load(path):
    with open(path) as f:
        return check(yaml.safe_load(f))


# ---- Blender from here down ------------------------------------------------------------------------------------------
def build(r, out_dir, render=True):
    import bpy
    import bmesh  # after bpy, which puts it on the path

    os.makedirs(out_dir, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    ch, lt = r["chamber"], r["light"]
    R, H, seed = ch["radius"], ch["height"], ch["seed"]

    bpy.ops.import_scene.gltf(filepath=KIT)
    kit = {o.name: o.data for o in sc.objects}
    for o in list(sc.objects):
        bpy.data.objects.remove(o)

    mats = {}

    def material(name):
        if name not in mats:
            lk = r["looks"][name]
            m = bpy.data.materials.new(name)
            m.use_nodes = True
            p = m.node_tree.nodes["Principled BSDF"]
            dark = 1 - 0.45 * lk["wet"]  # wet stone is darker and shinier
            p.inputs["Base Color"].default_value = (*(c * dark for c in lk["colour"]), 1)
            p.inputs["Roughness"].default_value = lk["rough"] * (1 - 0.8 * lk["wet"])
            if lk["glow"]:
                p.inputs["Emission Color"].default_value = (*lk["glow_colour"], 1)
                p.inputs["Emission Strength"].default_value = lk["glow"] * 5
            mats[name] = m
        return mats[name]

    def add(name, mesh, look):
        ob = bpy.data.objects.new(name, mesh)
        sc.collection.objects.link(ob)
        mesh.materials.clear()
        mesh.materials.append(material(look))
        return ob

    # walls and floor, made here so their size follows the recipe
    noise = random.Random(seed)
    ph = [noise.uniform(0, 6.3) for _ in range(4)]

    def wall_r(a, t):
        w = 1 + ch["rough"] * (0.6 * math.sin(3 * a + ph[0]) + 0.4 * math.sin(7 * a + ph[1] + 2 * t))
        return R * w * (1 - 0.18 * t * t)  # leans in toward the roof

    seg, rings = 64, 8
    for part, keep in (("walls", lambda a: math.cos(a) >= 0), ("walls_front", lambda a: math.cos(a) < 0)):
        bm = bmesh.new()
        grid = {}
        for j in range(seg + 1):
            a = 2 * math.pi * (j % seg) / seg
            for i in range(rings + 1):
                t = i / rings
                rr = wall_r(a, t)
                grid[j, i] = (rr * math.sin(a), rr * math.cos(a), H * t)
        verts = {}
        for j in range(seg):
            if not keep(2 * math.pi * (j + 0.5) / seg):
                continue
            for i in range(rings):
                quad = [(j, i), (j, i + 1), (j + 1, i + 1), (j + 1, i)]  # wound to face the chamber's centre
                for q in quad:
                    if q not in verts:
                        verts[q] = bm.verts.new(grid[q])
                bm.faces.new([verts[q] for q in quad])
        bm.normal_update()
        me = bpy.data.meshes.new(part)
        bm.to_mesh(me)
        bm.free()
        for p in me.polygons:
            p.use_smooth = True
        ob = add(part, me, r["walls"])
        if part == "walls_front":
            ob.visible_camera = False  # cut away so the camera sees in; the GLB keeps it

    bm = bmesh.new()
    centre = bm.verts.new((0, 0, 0))
    edge = [bm.verts.new((wall_r(2 * math.pi * j / seg, 0) * math.sin(2 * math.pi * j / seg),
                          wall_r(2 * math.pi * j / seg, 0) * math.cos(2 * math.pi * j / seg), 0)) for j in range(seg)]
    for j in range(seg):
        bm.faces.new((centre, edge[(j + 1) % seg], edge[j]))
    me = bpy.data.meshes.new("floor")
    bm.to_mesh(me)
    bm.free()
    add("floor", me, r["floor"])

    counts, warnings = {}, []
    for ob, x, y, z, t, s, hang in placements(r):
        piece = ob["piece"]
        counts[piece] = counts.get(piece, 0) + 1
        if math.hypot(x, y) > R * (1 - ch["rough"]) - 0.1:
            warnings.append(f"{ob.get('id', piece)} at [{x:.1f}, {y:.1f}] is in or past the wall")
        parts = [(piece, ob.get("look", "wall"))]
        if piece == "crystal_cluster":
            parts.append(("crystal_cluster_bed", ob.get("bed", ob.get("look", "wall"))))
        for pname, look in parts:
            o = add(f"{ob.get('id', piece)}.{counts[piece]}", kit[pname].copy(), look)  # a copy each, so looks differ
            o.location = (x, y, z + (0.06 * s if piece == "pool" else 0))  # the pool's rim sits on the floor
            o.rotation_euler = (math.pi if hang else 0, 0, math.radians(t))
            o.scale = (s * ob.get("wide", 1), s * ob.get("wide", 1), s) if piece != "pool" else (s, s, s)
    glb = os.path.join(out_dir, "chamber.glb")
    bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_apply=True, export_texcoords=False,
                              export_normals=True)
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in sc.objects if o.type == "MESH")
    report = {"objects": counts, "triangles": tris, "glb_bytes": os.path.getsize(glb), "warnings": warnings}

    if render:
        world = bpy.data.worlds.new("cave")
        world.use_nodes = True
        world.node_tree.nodes["Background"].inputs["Color"].default_value = (*lt["colour"], 1)
        world.node_tree.nodes["Background"].inputs["Strength"].default_value = lt["ambient"]
        sc.world = world
        lamp = bpy.data.lights.new("roof", "AREA")
        lamp.color, lamp.energy, lamp.size = lt["colour"], 250 * lt["strength"] * (R / 7) ** 2, R
        lo = bpy.data.objects.new("roof", lamp)
        lo.location = (0, -R * 0.2, H * 1.1)
        sc.collection.objects.link(lo)
        sc.render.engine = "CYCLES"  # Workbench and EEVEE need a GPU; the cloud has none
        sc.cycles.device, sc.cycles.samples, sc.cycles.seed = "CPU", 24, 0
        sc.cycles.use_denoising = True
        sc.render.resolution_x, sc.render.resolution_y = 640, 400
        sc.render.image_settings.file_format = "PNG"
        sc.view_settings.view_transform = "AgX"
        cam_data = bpy.data.cameras.new("cam")
        cam = bpy.data.objects.new("cam", cam_data)
        sc.collection.objects.link(cam)
        sc.camera = cam
        from mathutils import Vector
        for view, loc, ortho in (("front", (0.35 * R, -2.1 * R, 1.25 * R + 0.3 * H), False),
                                 ("top", (0, 0, 2.5 * R + H), True)):
            cam.location = loc
            target = Vector((0, 0.1 * R, 0.2 * H)) if not ortho else Vector((0, 0.0001, 0))
            cam.rotation_euler = (target - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
            cam_data.type = "ORTHO" if ortho else "PERSP"
            cam_data.ortho_scale = 2.3 * R
            cam_data.lens = 35
            for w in ("walls", "walls_front"):
                sc.objects[w].visible_camera = not ortho and w == "walls"  # from above, the floor's edge is the wall
            sc.render.filepath = os.path.join(out_dir, f"view_{view}.png")
            bpy.ops.render.render(write_still=True)
    with open(os.path.join(out_dir, "report.json"), "w") as f:
        json.dump(report, f, indent=1)
    return report


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    path = args[0] if args else os.path.join(HERE, "scene.yaml")
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "/tmp/blender-cloud/scene"
    if "--out" in sys.argv and out in args:
        args.remove(out)
        path = args[0] if args else os.path.join(HERE, "scene.yaml")
    try:
        recipe = load(path)
    except (RecipeError, yaml.YAMLError) as e:
        print(f"STOP: {path}: {e}")
        sys.exit(1)
    n = len(placements(recipe))
    if "--check" in sys.argv:
        print(f"ok: {path}: {len(recipe['objects'])} entries, {n} pieces placed")
        sys.exit(0)
    rep = build(recipe, out, render="--no-render" not in sys.argv)
    print(f"wrote {out}/chamber.glb: {rep['glb_bytes'] // 1024} KB, {rep['triangles']} triangles, {rep['objects']}")
    for w in rep["warnings"]:
        print("WARN: " + w)
