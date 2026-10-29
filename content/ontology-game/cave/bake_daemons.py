"""The daemon bodies for the phone: each WARP figure from character.py, stripped to what the cave draws.

character.py --daemons writes one rigged GLB per WARP row (bars-engine #328: the six fundamental movements, the hands
rebuilt per Six-faces-council council/daemons/HANDS.md). This keeps what the cave draws and poses: positions quantised to
16 bits, normals to 8, and per vertex one byte each for its two joints, the first joint's weight and its band (skin,
tunic, trim, sash, trousers, shoes, read back from the robe colours, so cave.js can dress each daemon in its own colour).
character.py's weights never use more than two joints a vertex, so nothing is lost.

The rig rides in the node's extras: each joint's name, parent and rest (the bind pose; the inverse bind matrices are
checked against it and left out), and "honored" and "charged", each joint's turn in the figure's space from the held
shape to the two ends of the trust stances (character.py HONORED and charged, beside each figure as X.stances.json),
which cave.js moves between by trust (the stances of bars-engine #355). A daemon with an Integrate action
(character.py --warp X --integrate, bars-engine #351) carries its keys too, in two buffer views.

Plain Python, no bpy. Run it after character.py --daemons (and --warp controller --integrate into a second folder), or with
--walker on rig_mocap/export_walker.py's GLB for the player's mocap-walking figure (its MocapWalk keys ride as "walk", MocapRun's as "run"):

  python3 content/ontology-game/cave/bake_daemons.py /tmp/blender-cloud/characters content/ontology-game/cave/daemons \
      /tmp/blender-cloud/integrate

The phone budget (Wendell's Big Mind notes, 2026-10-16: "build game-ready models for each daemon instead of placeholders"):
each body file at most BUDGET_BYTES and BUDGET_TRIS. cave.js fetches a body only when a scene asks for that daemon, so a
chamber loads its voice, the next figure and the waiting voices, never all eight. bigmind-test checks the files against
these numbers.
"""
import json, math, os, struct, sys

BUDGET_BYTES, BUDGET_TRIS = 128 * 1024, 7000  # 96 KB before the rig rode along
WALKER_BYTES = 144 * 1024  # the player's own figure carries two clips, walk and run (about 14 KB a clip)
# the figure GLB's id for each daemon id the game uses (cave.js DAEMONS), and the Player for the centre
IDS = ["protector", "controller", "skeptic", "fixer", "victim", "damaged-self", "emotional-body", "player"]
BANDS = ["skin", "tunic", "trim", "sash", "trousers", "shoes"]
SKIN = (0.69, 0.62, 0.53)


def hexc(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


# character.py's dusk palette, linear RGB, which every --daemons figure wears
DUSK = {"skin": SKIN, "tunic": hexc("44407a"), "trim": hexc("e9dfc6"), "sash": hexc("b8913f"),
        "trousers": hexc("2c2e44"), "shoes": hexc("1e1b24")}
COMP = {5126: ("f", 4), 5123: ("H", 2), 5125: ("I", 4), 5121: ("B", 1)}
SIZES = {"SCALAR": 1, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read_glb(path):
    b = open(path, "rb").read()
    n = struct.unpack_from("<I", b, 12)[0]
    j = json.loads(b[20:20 + n])
    bin0 = 20 + n + 8

    def acc(i):
        a = j["accessors"][i]
        v = j["bufferViews"][a["bufferView"]]
        f, s = COMP[a["componentType"]]
        k = SIZES[a["type"]]
        off = bin0 + v.get("byteOffset", 0) + a.get("byteOffset", 0)
        flat = struct.unpack_from(f"<{a['count'] * k}{f}", b, off)
        if a.get("normalized"):
            top = (1 << (8 * s)) - 1
            flat = [x / top for x in flat]
        return [flat[i * k:(i + 1) * k] for i in range(a["count"])] if k > 1 else list(flat)

    p = j["meshes"][0]["primitives"][0]
    at = p["attributes"]
    return {"pos": acc(at["POSITION"]), "nor": acc(at["NORMAL"]), "col": acc(at["COLOR_0"]), "idx": acc(p["indices"]),
            "joints": acc(at["JOINTS_0"]), "weights": acc(at["WEIGHTS_0"]), "j": j, "acc": acc}


# ---- quaternions as glTF writes them, (x, y, z, w) ----
def qmul(a, b):
    ax, ay, az, aw = a
    bx, by, bz, bw = b
    return (aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
            aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz)


def qinv(a):
    return (-a[0], -a[1], -a[2], a[3])


def qrot(q, v):
    x, y, z, _ = qmul(qmul(q, (v[0], v[1], v[2], 0.0)), qinv(q))
    return (x, y, z)


def rig_of(g):
    """The skin's joints in its own order: [(name, parent index or -1, rest translation, rest rotation)], and each
    joint's rest in the figure's space, (position, rotation). The Rig node is the identity (checked)."""
    j = g["j"]
    joints = j["skins"][0]["joints"]
    order = {n: i for i, n in enumerate(joints)}
    parent = {}
    for i, n in enumerate(j["nodes"]):
        for c in n.get("children", []):
            parent[c] = i
    rig = next(n for n in j["nodes"] if n.get("name") == "Rig")
    if any(k in rig for k in ("translation", "rotation", "scale", "matrix")):
        raise SystemExit("the Rig node is not the identity; fold it into the root joint first")
    rows = []
    for n in joints:
        node = j["nodes"][n]
        rows.append((node["name"], order.get(parent.get(n), -1), tuple(node.get("translation", (0, 0, 0))),
                     tuple(node.get("rotation", (0, 0, 0, 1)))))
    world = [None] * len(rows)

    def at(i):
        if world[i] is None:
            _, pi, t, r = rows[i]
            if pi < 0:
                world[i] = (t, r)
            else:
                pt, pr = at(pi)
                o = qrot(pr, t)
                world[i] = ((pt[0] + o[0], pt[1] + o[1], pt[2] + o[2]), qmul(pr, r))
        return world[i]
    for i in range(len(rows)):
        at(i)
    # the bind pose is the rest: world rest times the inverse bind matrix is the identity, so cave.js can work them out
    ibm = g["acc"](j["skins"][0]["inverseBindMatrices"])
    for (p, r), m in zip(world, ibm):
        for v in ((0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)):
            w = qrot(r, v)
            w = (w[0] + p[0], w[1] + p[1], w[2] + p[2])
            back = [m[k] * w[0] + m[4 + k] * w[1] + m[8 + k] * w[2] + m[12 + k] for k in range(3)]
            if max(abs(a - b) for a, b in zip(back, v)) > 1e-3:
                raise SystemExit("the inverse bind matrices are not the rest pose")
    return rows, world


def end_turns(rows, opens):
    """Each joint's turn in the figure's space from its held rest to one end of the trust stances, as character.py
    wrote it beside the figure (HONORED or charged)."""
    out = []
    for name, _, _, _ in rows:
        q = tuple(opens[name])
        if q[3] < 0:
            q = tuple(-x for x in q)
        out.append([round(x, 4) for x in q])
    return out


def action_of(g, rows, name):
    """An action's keys per joint: [(joint, "r" or "t", [frame], [values])] at 24 frames a second, or None."""
    j = g["j"]
    a = next((a for a in j.get("animations", []) if a["name"] == name), None)
    if not a:
        return None
    joints = j["skins"][0]["joints"]
    out = []
    for c in a["channels"]:
        if c["target"]["path"] == "scale":  # the mocap walk keys scale too, all at one; the body format has no scale
            continue
        s = a["samplers"][c["sampler"]]
        if s.get("interpolation", "LINEAR") != "LINEAR":
            raise SystemExit(f"{name}: only straight-line keys are baked")
        k = joints.index(c["target"]["node"])
        times = g["acc"](s["input"])
        vals = g["acc"](s["output"])
        out.append((k, {"rotation": "r", "translation": "t"}[c["target"]["path"]], [round(t * 24) for t in times],
                    [tuple(v) for v in vals]))
    return out


def band_of(rgb):
    return min(range(len(BANDS)), key=lambda i: sum((a - b) ** 2 for a, b in zip(rgb, DUSK[BANDS[i]])))


def bake(src, out, act_src=None, act="Integrate", key="integrate", more=()):
    g = read_glb(src)
    pos, nor, col, idx = g["pos"], g["nor"], g["col"], g["idx"]
    rows, world = rig_of(g)
    stances = src[:-4] + ".stances.json"  # the walker has none: both ends are its rest
    ends = json.load(open(stances)) if os.path.exists(stances) else {e: {r[0]: (0, 0, 0, 1) for r in rows} for e in ("honored", "charged")}
    lo = [min(p[i] for p in pos) for i in range(3)]
    hi = [max(p[i] for p in pos) for i in range(3)]
    span = [max(h - l, 1e-6) for l, h in zip(lo, hi)]
    qp = b"".join(struct.pack("<3H", *(round((p[i] - lo[i]) / span[i] * 65535) for i in range(3))) + b"\0\0" for p in pos)
    qn = b"".join(struct.pack("<4b", *(max(-127, min(127, round(c * 127))) for c in n), 0) for n in nor)
    bands = [band_of(c[:3]) for c in col]
    # per vertex: its two joints, the first one's share of 255 and its band
    skin = b""
    for jn, wt, band in zip(g["joints"], g["weights"], bands):
        top = sorted(range(4), key=lambda k: -wt[k])
        if wt[top[2]] > 0.01:
            raise SystemExit(f"{src}: a vertex on more than two joints")
        a, b = top[0], top[1]
        w = wt[a] / max(wt[a] + wt[b], 1e-9)
        skin += struct.pack("<4B", int(jn[a]), int(jn[b] if wt[b] > 0 else jn[a]), round(w * 255), band)
    qi = struct.pack(f"<{len(idx)}H", *idx)
    qi += b"\0" * (-len(qi) % 4)
    chunks = [(qp, 8), (qn, 4), (skin, 4), (qi, None)]
    rig = {"joints": [[name, pi, [round(x, 5) for x in t], [round(x, 5) for x in r]] for name, pi, t, r in rows],
           **{end: end_turns(rows, ends[end]) for end in ("honored", "charged")}}
    if act_src:
        a = read_glb(act_src)
        arows, _ = rig_of(a)
        if [r[:2] for r in arows] != [r[:2] for r in rows] or any(
                max(abs(x - y) for x, y in zip(p[2] + p[3], q[2] + q[3])) > 1e-3 for p, q in zip(arows, rows)):
            raise SystemExit(f"{act_src}: its rig is not the baked figure's")
        for act, key in ((act, key), *more):
            keys = action_of(a, rows, act)
            if keys:
                # frames as 16-bit counts at 24 a second; rotations and the hips' shift as 16-bit fractions of one
                fr = b"".join(struct.pack(f"<{len(f)}H", *f) for _, _, f, _ in keys)
                vals = b"".join(struct.pack(f"<{len(v)}h", *(round(max(-1, min(1, x)) * 32767) for x in v))
                                for _, _, _, vs in keys for v in vs)
                fr += b"\0" * (-len(fr) % 4)
                travel = next((x.get("extras", {}).get("travel_m") for x in a["j"].get("animations", []) if x["name"] == act), None)
                rig[key] = {"fps": 24, "frames": len(chunks), "values": len(chunks) + 1, "travel": travel,
                            "channels": [[k, path, len(f)] for k, path, f, _ in keys],
                            "length": max(max(f) for _, _, f, _ in keys)}
                chunks += [(fr, None), (vals, None)]
    views, blob = [], b""
    for chunk, stride in chunks:
        v = {"buffer": 0, "byteOffset": len(blob), "byteLength": len(chunk)}
        if stride:
            v["byteStride"] = stride
        views.append(v)
        blob += chunk
    n = len(pos)
    j = {"asset": {"version": "2.0", "generator": "bake_daemons.py"},
         "extensionsUsed": ["KHR_mesh_quantization"], "extensionsRequired": ["KHR_mesh_quantization"],
         "scene": 0, "scenes": [{"nodes": [0]}],
         # the node's translation and scale undo the 16-bit quantisation, as KHR_mesh_quantization intends
         "nodes": [{"name": os.path.basename(out)[:-4], "mesh": 0, "translation": lo, "scale": span, "extras": rig}],
         "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "_SKIN": 2}, "indices": 3}]}],
         "accessors": [
             {"bufferView": 0, "componentType": 5123, "normalized": True, "count": n, "type": "VEC3",
              "min": [0, 0, 0], "max": [65535, 65535, 65535]},
             {"bufferView": 1, "componentType": 5120, "normalized": True, "count": n, "type": "VEC3"},
             {"bufferView": 2, "componentType": 5121, "count": n, "type": "VEC4"},
             {"bufferView": 3, "componentType": 5123, "count": len(idx), "type": "SCALAR"}],
         "bufferViews": views, "buffers": [{"byteLength": len(blob)}],
         "extras": {"bands": BANDS, "height": hi[1], "skin": "joint a, joint b, a's weight of 255, band"}}
    js = json.dumps(j, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    glb = struct.pack("<3I", 0x46546C67, 2, 28 + len(js) + len(blob)) + struct.pack("<2I", len(js), 0x4E4F534A) + js \
        + struct.pack("<2I", len(blob), 0x004E4942) + blob
    open(out, "wb").write(glb)
    tris = len(idx) // 3
    counts = {BANDS[i]: bands.count(i) for i in range(len(BANDS))}
    return {"id": os.path.basename(out)[:-4], "bytes": len(glb), "tris": tris, "verts": n, "joints": len(rows),
            "height": round(hi[1], 3), "bands": counts, "integrate": "integrate" in rig, "walk": "walk" in rig, "run": "run" in rig}


def main():
    if sys.argv[1] == "--walker":  # the player's figure, rigged with Rigify and walking a CMU mocap clip (rig_mocap/export_walker.py)
        src, out = sys.argv[2], sys.argv[3]
        r = bake(src, out, src, "MocapWalk", "walk", more=[("MocapRun", "run")])
        if r["bytes"] > WALKER_BYTES or r["tris"] > BUDGET_TRIS or not r["walk"] or r["bands"]["skin"] == 0:
            raise SystemExit(f"walker: {r}")
        print(json.dumps(r))
        return
    src, out = sys.argv[1], sys.argv[2]
    acts = sys.argv[3] if len(sys.argv) > 3 else None
    os.makedirs(out, exist_ok=True)
    rows = []
    for d in IDS:
        act = acts and os.path.join(acts, f"average-dusk-{d}.glb")
        r = bake(os.path.join(src, f"average-dusk-{d}.glb"), os.path.join(out, f"{d}.glb"),
                 act if act and os.path.exists(act) else None)
        if r["bytes"] > BUDGET_BYTES or r["tris"] > BUDGET_TRIS:
            raise SystemExit(f"{d}: {r['bytes'] // 1024} KB, {r['tris']} triangles, over the phone budget")
        if r["bands"]["skin"] == 0 or r["bands"]["tunic"] == 0:
            raise SystemExit(f"{d}: the robe colours did not read back ({r['bands']})")
        rows.append(r)
        print(f"{d}: {r['bytes'] // 1024} KB, {r['tris']} triangles, {r['verts']} vertices, {r['joints']} joints, "
              f"{r['height']} m{', Integrate' if r['integrate'] else ''}")
    with open(os.path.join(out, "bodies.json"), "w") as f:
        json.dump({"note": "Baked by bake_daemons.py from character.py --daemons (bars-engine #328), skinned, with "
                           "the Integrate action where character.py --integrate made one (#351). Phone budget: "
                           f"{BUDGET_BYTES // 1024} KB and {BUDGET_TRIS} triangles a body.", "bodies": rows}, f, indent=1)


if __name__ == "__main__":
    main()
