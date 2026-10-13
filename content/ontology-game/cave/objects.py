"""Objects placed in the chamber (J2): one obj(...) line in chamber.py each, from one of three sources.

  blenderkit(query, index, id)   a pinned CC0 Blendkit model: the index-th free result for the query, which must
                                 still be the asset with that id. Anything not CC0 stops the build (cs-cc0-or-own).
  picture(file, mode)            a model built from a picture in pictures/ by tools/blender-cloud/from_picture.py
  script(builder)                a model built by a function here

Each object is scaled to its height, stood on the floor, checked (lowest vertex within 1 cm of the floor, every vertex
inside the walls, its GLB under its byte budget) and given a manifest row (cs-manifest-row) in manifest.json.
Needs bpy; a Blendkit source also needs the network (tools/blender-cloud/README.md).
"""
import json, math, os, subprocess, sys

import bpy
import bmesh

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.join(HERE, "..", "..", "..", "tools", "blender-cloud")
sys.path.insert(0, TOOLS)
import from_picture  # noqa: E402
import prepare_asset  # noqa: E402

CACHE = os.environ.get("BLENDERKIT_CACHE", "/tmp/blender-cloud/assets")
MANIFEST = os.path.join(HERE, "manifest.json")
FLOOR_TOL, WALL_GAP, TEX_MAX = 0.01, 0.05, 256  # metres, metres, pixels


def blenderkit(query, index, id, licence="cc_zero"):
    return {"kind": "blenderkit", "query": query, "index": index, "id": id, "licence": licence}


def picture(file, mode, faces=400):
    return {"kind": "picture", "file": file, "mode": mode, "faces": faces}


def script(builder):
    return {"kind": "script", "builder": builder}


def stop(msg):
    sys.exit(f"STOP: {msg}")


# ---- the three sources: each returns one mesh object, any size, and what the manifest row says of it ----

def from_blenderkit(name, src, faces):
    folder = os.path.join(CACHE, f"{src['query'].replace(' ', '_')}-{src['index']}-{src['licence']}")
    have = [f for f in os.listdir(folder) if f.endswith(".json")] if os.path.isdir(folder) else []
    if not have:
        env = dict(os.environ)
        if os.path.exists("/root/.ccr/ca-bundle.crt"):
            env.setdefault("SSL_CERT_FILE", "/root/.ccr/ca-bundle.crt")
        r = subprocess.run(["python3", os.path.join(TOOLS, "blenderkit_fetch.py"), src["query"], folder,
                            "--index", str(src["index"]), "--license", "any" if src["licence"] != "cc_zero" else "cc_zero"],
                           capture_output=True, text=True, env=env)
        if r.returncode:
            stop(f"{name}: Blendkit fetch failed: {(r.stderr or r.stdout).strip()[-300:]}")
        have = [f for f in os.listdir(folder) if f.endswith(".json")]
    info = json.load(open(os.path.join(folder, have[0])))
    if info.get("license") != "cc_zero":
        stop(f"{name}: {info['name']!r} is {info.get('license')}, not CC0. Only CC0 or own work goes in the cave "
             "(cs-cc0-or-own).")
    if src["id"] and info["id"] != src["id"]:
        stop(f"{name}: result {src['index']} for {src['query']!r} is now {info['name']!r} ({info['id']}), not the pinned "
             f"{src['id']}. Find the pinned asset's new index, or pin the new one after looking at it.")
    glb = os.path.join(folder, have[0][:-5] + ".glb")
    plain = os.path.join(folder, "decoded.glb")
    if not os.path.exists(plain):
        prepare_asset.prepare(glb, plain)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=plain)
    new = [o for o in bpy.data.objects if o not in before]
    meshes = [o for o in new if o.type == "MESH"]
    for o in new:
        if o.type != "MESH":
            bpy.data.objects.remove(o)
    for o in bpy.context.scene.objects:
        o.select_set(o in meshes)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    ob.parent = None
    for m in ob.data.materials:  # keep only the colour map, capped: the chamber is a phone page
        nt = m.node_tree
        for n in [n for n in nt.nodes if n.type == "TEX_IMAGE"]:
            if not any(l.to_socket.name == "Base Color" for l in n.outputs["Color"].links):
                nt.nodes.remove(n)
            elif max(n.image.size) > TEX_MAX:
                n.image.scale(min(n.image.size[0], TEX_MAX), min(n.image.size[1], TEX_MAX))
        for n in nt.nodes:
            if n.type == "BSDF_PRINCIPLED":  # the maps that drove these are gone: matte stone, not metal
                n.inputs["Metallic"].default_value, n.inputs["Roughness"].default_value = 0.0, 0.85
    used = {n.uv_map for m in ob.data.materials for n in m.node_tree.nodes if n.type == "UVMAP"} or {ob.data.uv_layers[0].name}
    for uv in [uv for uv in ob.data.uv_layers if uv.name not in used]:  # keep the set the colour map reads, drop the rest
        ob.data.uv_layers.remove(uv)
    bm = bmesh.new()  # a decoded Draco mesh can come with every triangle on its own vertices; decimating that shreds it
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(ob.data)
    bm.free()
    from_picture.fit(ob, faces)
    row = {"source": f"Blendkit {info['name']!r} by {info['author'].strip()}, {info['source']} (query {src['query']!r}, "
                     f"result {src['index']})", "licence": "CC0", "blenderkit_id": info["id"]}
    return ob, row


def from_picture_file(name, src, faces):
    mask = from_picture.outline(os.path.join(HERE, "pictures", src["file"]))
    parts, _, iou = from_picture.build(name, mask, 1.0 / mask.shape[0], src["mode"], src["faces"])
    ob = parts[0]
    ob.data.transform(__import__("mathutils").Matrix.Rotation(math.pi / 2, 4, "X"))  # the tool builds Y up
    row = {"source": f"cave/objects.py from pictures/{src['file']} ({src['mode']}, tools/blender-cloud/from_picture.py)",
           "licence": "own work", "outline_match": round(iou, 3)}
    return ob, row


def from_script(name, src, faces):
    bm = bmesh.new()
    src["builder"](bm)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    return ob, {"source": f"cave/objects.py, {src['builder'].__name__}()", "licence": "own work"}


SOURCES = {"blenderkit": from_blenderkit, "picture": from_picture_file, "script": from_script}


# ---- builders for script(...) objects: each adds one closed mesh to bm, Z up, any size ----

def cushion(bm, segments=16):
    """A round sitting cushion (zafu): a squashed drum with soft edges and a dimpled top, pleated round the side."""
    rings = [(0.00, 0.80), (0.04, 0.93), (0.12, 1.00), (0.30, 1.00), (0.40, 0.94), (0.46, 0.80), (0.50, 0.45),
             (0.47, 0.0)]
    loops = []
    for z, r in rings:
        loop = []
        for j in range(segments):
            a = 2 * math.pi * j / segments
            pleat = 1 + 0.03 * (j % 2) * (0.1 < z < 0.42)
            loop.append(bm.verts.new((r * pleat * math.cos(a), r * pleat * math.sin(a), z)))
        loops.append(loop)
    for a, b in zip(loops, loops[1:]):
        for j in range(segments):
            k = (j + 1) % segments
            bm.faces.new((a[j], a[k], b[k], b[j]))
    bm.faces.new(list(reversed(loops[0])))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)  # the top's centre ring closes to a point


# ---- placing and checking ----

def obj(name, src, at, turn, height, budget, faces, material, objects):
    """Builds the object, scales it to height (metres), stands it on the floor at at=(x, y), turned turn degrees."""
    ob, row = SOURCES[src["kind"]](name, src, faces)
    ob.name = ob.data.name = name
    v = [c.co for c in ob.data.vertices]
    lo = [min(p[i] for p in v) for i in range(3)]
    hi = [max(p[i] for p in v) for i in range(3)]
    s = height / (hi[2] - lo[2])
    from mathutils import Matrix
    ob.data.transform(Matrix.Diagonal((s, s, s, 1)) @ Matrix.Translation((-(lo[0] + hi[0]) / 2, -(lo[1] + hi[1]) / 2,
                                                                          -lo[2])))
    ob.location = (at[0], at[1], 0)
    ob.rotation_euler = (0, 0, math.radians(turn))
    if material is not None:
        ob.data.materials.clear()
        ob.data.materials.append(material)
        if material.get("texture") and not ob.data.uv_layers:  # baked by chamber.py, which needs UVs
            for x in bpy.context.scene.objects:
                x.select_set(x == ob)
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.mode_set(mode="EDIT")
            bpy.ops.mesh.select_all(action="SELECT")
            bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.01)
            bpy.ops.object.mode_set(mode="OBJECT")
    objects.append({"ob": ob, "row": {"id": f"chamber.{name}", "kind": "object", "in": "chamber.glb",
                                      **row, "budget_bytes": budget, "faces": len(ob.data.polygons),
                                      "at": [at[0], at[1]], "height_m": height}})
    return ob


def check(objects, wall_r, H, out):
    """The J2 kill line, per object: on the floor, inside the walls, under budget. Writes each object's row into
    manifest.json (cs-manifest-row); stops on the first miss after reporting them all."""
    misses, rows = [], []
    for o in objects:
        ob, row = o["ob"], o["row"]
        bpy.context.view_layer.update()
        world = [ob.matrix_world @ c.co for c in ob.data.vertices]
        low = min(p.z for p in world)
        if abs(low) > FLOOR_TOL:
            misses.append(f"{ob.name}: lowest vertex {low * 100:.1f} cm from the floor (most 1 cm)")
        out_of = [p for p in world if math.hypot(p.x, p.y) > wall_r(math.atan2(p.x, p.y), max(0, p.z) / H) - WALL_GAP]
        if out_of:
            misses.append(f"{ob.name}: {len(out_of)} vertices within {WALL_GAP * 100:.0f} cm of the wall or past it")
        path = os.path.join(out, f"object_{ob.name}.glb")
        for x in bpy.context.scene.objects:
            x.select_set(x == ob)
        bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_apply=True,
                                  export_image_format="JPEG", export_jpeg_quality=82)
        row["bytes"] = os.path.getsize(path)
        if row["bytes"] > row["budget_bytes"]:
            misses.append(f"{ob.name}: {row['bytes']} bytes, over its budget of {row['budget_bytes']}")
        row["lowest_cm"], row["status"] = round(low * 100, 2), "built"
        rows.append(row)
    m = json.load(open(MANIFEST))
    keep = [a for a in m["assets"] if not a["id"].startswith("chamber.")]
    at = next((i for i, a in enumerate(keep) if a["id"] > "chamber."), len(keep))
    m["assets"] = keep[:at] + rows + keep[at:]
    with open(MANIFEST, "w") as f:
        f.write(json.dumps(m, indent=2) + "\n")
    json.dump(rows, open(os.path.join(out, "objects.json"), "w"), indent=2)
    if misses:
        stop("J2 kill line missed:\n  " + "\n  ".join(misses))
    return rows
