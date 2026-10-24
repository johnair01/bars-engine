"""The spirits' core and hologram for the phone: the spirit page's GLBs, stripped to what the cave draws.

shellback.py (tools/blender-cloud/content/spirits) writes five GLBs per base and element: gas, core, hologram, creature and
ascended. The cave draws the gas itself as motes (spirit-forms.js); this bakes the next two stages a spirit unfolds into as
it is sat with (Six-faces-council council/callsheets/spirits-in-caves.md, board sic-unfold-by-sitting). Creature and ally
(the page's "ascended") are baked for the Shellback only, from rig.py's rigged GLBs when its output folder is given (their
frame, Walk and Idle ride along; bars-engine #325), the first family to show all five forms, worn by the elder spirit in
the WAVE room (board sic-demo-showcase = elder). Their sources are ten times the core's triangles, so they are first welded and
simplified by gltf-transform (meshoptimizer; npx fetches it) to fit LATE_BUDGET_BYTES.

Every element of a base has the same shapes; only the colour differs, and the cave colours a spirit by its element's own
hex (cave.js spiritHex). So one file per family and stage is kept, its meshes joined by material, each material keeping
its tone (its colour against the element's light tint: 1 for the light, about a third for the dark), its opacity and its
glow, and white for the eyes. Positions are quantised to 16 bits (KHR_mesh_quantization, dequantised by the node's
scale and translation), normals and UVs are dropped (the cave draws spirits unlit), indices are 16 bits.

Plain Python, no bpy. Run it on the spirit page's output folder (the shared folder's 3d-build/spirit-shellback-2026-10-14):

  python3 content/ontology-game/cave/bake_spirits.py /mnt/project-files/3d-build/spirit-shellback-2026-10-14 \
      content/ontology-game/cave/spirits RIG_OUT

where RIG_OUT holds rig.py's output for the Shellback's fire creature and ascended (tools/blender-cloud/content/spirits):

  blender -b --python tools/blender-cloud/content/spirits/rig.py -- .../glb/fire-creature.glb RIG_OUT --base tortoise --stage creature
  blender -b --python tools/blender-cloud/content/spirits/rig.py -- .../glb/fire-ascended.glb RIG_OUT --base tortoise --stage ascended

bigmind-test checks the files against BUDGET_BYTES.
"""
import json, math, os, struct, sys

BUDGET_BYTES = 64 * 1024
LATE_BUDGET_BYTES = 160 * 1024  # creature and ally: fetched once, when the elder or a spirit first wears them
# with their frame: the skin (4 bytes a vertex), the joints and two clips add about 43 KB to the creature (24 October 2026)
RIGGED_BUDGET_BYTES = 208 * 1024
STAGES = ["core", "hologram"]
# family -> {cave stage: the page's file stage}; the families not named here wear the hologram past it (spirit-forms.js LATE)
LATE = {"shellback": {"creature": "creature", "ally": "ascended"}}
RIGGED = {"shellback": "tortoise"}  # family -> rig.py --base, for the late forms baked with their frame
SIMPLIFY = ["--ratio", "0.1", "--error", "0.01"]
ELEMENT = "fire"  # the shapes are read from one element; the colours are the cave's
# family file -> the base folder under the spirit page's output, its first base with GLBs. The Holdfast (the Controller's,
# rounds 15 and 16) has no GLBs yet, so the Controller wears the Shellback's plain forms, as the Damaged Self and the
# Emotional Body do (spirit-forms.js FAMILIES).
SOURCES = {
    "shellback": "glb",
    "romp": "round11/fox/glb",
    "tinker": "round13/raccoon-neutral/glb",
    "hedge": "round18/pallas-photo-rebuild/pallas-neutral/glb",
    "ballad": "round19/donkey-neutral/glb",
}
COMP = {5126: ("f", 4), 5125: ("I", 4), 5123: ("H", 2), 5121: ("B", 1)}
WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read_glb(path):
    b = open(path, "rb").read()
    jl = struct.unpack_from("<I", b, 12)[0]
    j = json.loads(b[20:20 + jl])
    return j, b[20 + jl + 8:]


def accessor(j, bin_, i):
    a = j["accessors"][i]; v = j["bufferViews"][a["bufferView"]]
    f, size = COMP[a["componentType"]]; n = WIDTH[a["type"]]
    stride = v.get("byteStride", size * n); off = v.get("byteOffset", 0) + a.get("byteOffset", 0)
    return [struct.unpack_from("<" + f * n, bin_, off + q * stride) for q in range(a["count"])]


def quat_apply(q, p):
    x, y, z, w = q; px, py, pz = p
    ix, iy, iz, iw = w * px + y * pz - z * py, w * py + z * px - x * pz, w * pz + x * py - y * px, -x * px - y * py - z * pz
    return (ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x)


def world(n, p):
    s = n.get("scale", (1, 1, 1)); p = (p[0] * s[0], p[1] * s[1], p[2] * s[2])
    p = quat_apply(n.get("rotation", (0, 0, 0, 1)), p)
    t = n.get("translation", (0, 0, 0))
    return (p[0] + t[0], p[1] + t[1], p[2] + t[2])


# shellback.py's scan materials (mat(..., scan=True)) lose their alpha in the glTF export, which writes 1; the page's own
SCAN_ALPHA = {"holo": 0.32, "deep": 0.22}


def lum(c): return (c[0] + c[1] + c[2]) / 3
def srgb(c): return [round(max(0.0, min(1.0, x)) ** (1 / 2.2), 3) for x in c[:3]]  # the cave's renderer writes colours as given


# The creature's and ally's painted materials (shader nodes, no base colour in the glTF) take the element's colour at a tone.
PAINTED = {"skin": 0.85, "shell": 1.0, "cloth": 0.7}


def look(m, light, late=False):
    """A material's tone against the light tint, its opacity and glow; white stays white (the eyes, a glint)."""
    pbr = m.get("pbrMetallicRoughness", {}); base = pbr.get("baseColorFactor")
    emit = m.get("emissiveFactor"); strength = m.get("extensions", {}).get("KHR_materials_emissive_strength", {}).get("emissiveStrength", 1)
    col = base[:3] if base else emit or (1, 1, 1)
    alpha = base[3] if base else 1.0
    white = min(col) > 0.95
    painted = late and not base and not emit
    if painted: return {"tone": PAINTED.get(m.get("name", "").split(".")[0], 0.85), "white": False, "opacity": 1.0, "glow": 0, "paint": "vertex"}
    if late and not white: return {"tone": 1.0, "white": False, "opacity": 1.0, "glow": round(min(4.0, (lum(emit) if emit else 0) * strength), 3), "rgb": srgb(col)}
    alpha = SCAN_ALPHA.get(m.get("name", "").split(".")[0], alpha)
    return {"tone": 1.0 if white else round(min(1.6, lum(col) / max(1e-6, lum(light))), 3), "white": white,
            "opacity": round(alpha, 3), "glow": round(min(4.0, (lum(emit) if emit else 0) * strength), 3)}


def bake(src, out, late=False, row=None):
    """row: rig.py's report row for a rigged source (the creature's and ally's frame, bars-engine #325). The file then
    keeps the glTF's own y-up metres (the clips are in metres), with each vertex's two joints in _SKIN and the joints, Walk
    and Idle in the node's extras; spirit-forms.js turns it into the page's units as it reads it."""
    j, bin_ = read_glb(src)
    mats = j.get("materials", [])
    light = None  # the element's light tint, as the page's core wears it
    for m in mats:
        if m.get("name", "").startswith("core") and m.get("pbrMetallicRoughness", {}).get("baseColorFactor"):
            light = m["pbrMetallicRoughness"]["baseColorFactor"][:3]; break
    light = light or (1, 1, 1)
    groups = {}  # material index -> [positions, indices, colours, skin]
    parent = {c: i for i, n in enumerate(j["nodes"]) for c in n.get("children", [])}
    rig = rig_of(j, bin_, parent, row) if row else None
    def placed(i, v):  # through the node and every parent above it (the creature's and ally's parts hang off a root)
        while i is not None: v = world(j["nodes"][i], v); i = parent.get(i)
        return (v[0], -v[2], v[1])  # Blender's glTF export is y-up; the cave reads the page's z-up
    for ni, n in enumerate(j["nodes"]):
        if "mesh" not in n: continue
        for p in j["meshes"][n["mesh"]]["primitives"]:
            g = groups.setdefault(p.get("material", -1), [[], [], [], []])
            base = len(g[0]); at = p["attributes"]; pts = accessor(j, bin_, at["POSITION"])
            if rig: ps, sk = rig["place"](ni, n, p, pts); g[0].extend(ps); g[3].extend(sk)
            else: g[0].extend(placed(ni, v) for v in pts)
            if late and "COLOR_0" in at: g[2].extend(accessor(j, bin_, at["COLOR_0"]))
            g[1].extend(base + i[0] for i in accessor(j, bin_, p["indices"]))
    allp = [v for g in groups.values() for v in g[0]]
    lo = [min(v[k] for v in allp) for k in range(3)]; hi = [max(v[k] for v in allp) for k in range(3)]
    mid = [(lo[k] + hi[k]) / 2 for k in range(3)]; half = [max(1e-6, (hi[k] - lo[k]) / 2) for k in range(3)]
    blob, views, accs, prims, tris = bytearray(), [], [], [], 0
    def put(data, target):
        while len(blob) % 4: blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(data), "target": target}); blob.extend(data)
        return len(views) - 1
    for mi, (pos, idx, cols, skin) in sorted(groups.items()):
        assert len(pos) < 65536, src
        # with the normals and UVs gone, corners that sat apart only for them are one vertex again
        seen, keep, remap, kcol, kskin = {}, [], [], [], []
        for vi, v in enumerate(pos):
            k = tuple(max(-32767, min(32767, round((v[c] - mid[c]) / half[c] * 32767))) for c in range(3))
            sk = skin[vi] if skin else None
            if (k, sk) not in seen:
                seen[k, sk] = len(keep); keep.append(k)
                if len(cols) == len(pos): kcol.append(cols[vi])
                if sk: kskin.append(sk)
            remap.append(seen[k, sk])
        idx = [remap[i] for i in idx]; pos = keep
        q = bytearray()
        for k in pos: q += struct.pack("<hhhh", *k, 0)
        pv = put(q, 34962); views[pv]["byteStride"] = 8
        iv = put(struct.pack("<%dH" % len(idx), *idx), 34963)
        accs.append({"bufferView": pv, "componentType": 5122, "normalized": True, "count": len(pos), "type": "VEC3",
                     "min": [-1, -1, -1], "max": [1, 1, 1]})
        accs.append({"bufferView": iv, "componentType": 5123, "count": len(idx), "type": "SCALAR"})
        ii = len(accs) - 1
        m = mats[mi] if mi >= 0 else {}
        attrs = {"POSITION": len(accs) - 2}
        if kcol:  # the creature's and ally's painted skin, shell and cloth: one sRGB byte colour per vertex
            c = bytearray()
            for col in kcol: c += bytes(round(x * 255) for x in srgb(col)) + b"\xff"
            cv = put(bytes(c), 34962)
            accs.append({"bufferView": cv, "componentType": 5121, "normalized": True, "count": len(kcol), "type": "VEC4"}); attrs["COLOR_0"] = len(accs) - 1
        if kskin and m.get("name", "").split(".")[0] in ("eyewhite", "iris", "pupil", "glint"):  # spirit-rig-look-01: eyes off the face
            assert {rig["joints"][a][0] for a, _, _ in kskin} == {"head"}, (src, m.get("name"), "the eyes must ride the head")
        if kskin:  # joint a, joint b, a's weight of 255, 0 (bake_daemons.py's _SKIN, its band byte unused)
            sv = put(b"".join(struct.pack("<4B", a, b, w, 0) for a, b, w in kskin), 34962); views[sv]["byteStride"] = 4
            accs.append({"bufferView": sv, "componentType": 5121, "count": len(kskin), "type": "VEC4"}); attrs["_SKIN"] = len(accs) - 1
        prims.append({"attributes": attrs, "indices": ii, "extras": dict(look(m, light, late), name=m.get("name", ""))})
        tris += len(idx) // 3
    node = {"name": os.path.basename(out)[:-4], "mesh": 0, "scale": half, "translation": mid}
    if rig:
        node["extras"] = {"frame": "y-up metres", "unit": row["metres_per_unit"], "joints": rig["joints"]}
        for key, act in (("walk", "Walk"), ("idle", "Idle")):
            keys = clip_of(j, bin_, rig, act)
            fr = b"".join(struct.pack("<%dH" % len(f), *f) for _, _, f, _ in keys)
            vals = b"".join(struct.pack("<%dh" % len(v), *(round(max(-1, min(1, x)) * 32767) for x in v)) for _, _, _, vs in keys for v in vs)
            node["extras"][key] = {"fps": 24, "frames": put(fr, None), "values": put(vals, None), "length": max(max(f) for _, _, f, _ in keys),
                                   "channels": [[k, path, len(f)] for k, path, f, _ in keys]}
            for v in views[-2:]: v.pop("target")
        # the body's way over the ground in one Walk cycle: as far as a foot sweeps (rig.py's steps)
        node["extras"]["walk"]["travel"] = max(s["travel"] for s in row["steps"].values())
    gltf = {"asset": {"version": "2.0", "generator": "bars-engine bake_spirits.py"}, "extensionsUsed": ["KHR_mesh_quantization"],
            "extensionsRequired": ["KHR_mesh_quantization"], "scene": 0, "scenes": [{"nodes": [0]}],
            "nodes": [node], "meshes": [{"primitives": prims}], "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(blob)}]}
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4); blob += b"\0" * (-len(blob) % 4)
    data = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack("<II", len(js), 0x4E4F534A) + js + \
        struct.pack("<II", len(blob), 0x004E4942) + bytes(blob)
    open(out, "wb").write(data)
    return len(data), tris, os.path.getsize(src)


# ---- the rig (rig.py's frame: a skin of named joints, flesh weighted to them, rigid pieces hanging from their bones) ----
def m4(n):
    """A node's local matrix, row-major 4x4."""
    if "matrix" in n: m = n["matrix"]; return [[m[c * 4 + r] for c in range(4)] for r in range(4)]
    x, y, z, w = n.get("rotation", (0, 0, 0, 1)); s = n.get("scale", (1, 1, 1)); t = n.get("translation", (0, 0, 0))
    R = [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
         [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]
    return [[R[r][c] * s[c] for c in range(3)] + [t[r]] for r in range(3)] + [[0, 0, 0, 1]]


def mm(a, b): return [[sum(a[r][k] * b[k][c] for k in range(4)) for c in range(4)] for r in range(4)]
def mp(a, v): return tuple(a[r][0] * v[0] + a[r][1] * v[1] + a[r][2] * v[2] + a[r][3] for r in range(3))


def m2q(m):
    """The rotation of a row-major matrix without scale, as glTF's (x, y, z, w)."""
    tr = m[0][0] + m[1][1] + m[2][2]
    if tr > 0: s = math.sqrt(tr + 1) * 2; q = ((m[2][1] - m[1][2]) / s, (m[0][2] - m[2][0]) / s, (m[1][0] - m[0][1]) / s, s / 4)
    elif m[0][0] > m[1][1] and m[0][0] > m[2][2]: s = math.sqrt(1 + m[0][0] - m[1][1] - m[2][2]) * 2; q = (s / 4, (m[0][1] + m[1][0]) / s, (m[0][2] + m[2][0]) / s, (m[2][1] - m[1][2]) / s)
    elif m[1][1] > m[2][2]: s = math.sqrt(1 + m[1][1] - m[0][0] - m[2][2]) * 2; q = ((m[0][1] + m[1][0]) / s, s / 4, (m[1][2] + m[2][1]) / s, (m[0][2] - m[2][0]) / s)
    else: s = math.sqrt(1 + m[2][2] - m[0][0] - m[1][1]) * 2; q = ((m[0][2] + m[2][0]) / s, (m[1][2] + m[2][1]) / s, s / 4, (m[1][0] - m[0][1]) / s)
    return q if q[3] >= 0 else tuple(-x for x in q)


def rig_of(j, bin_, parent, row):
    """The joints as [name, parent or -1, rest translation, rest rotation] (the root's carries every node above it), and
    place(node, mesh node, primitive, positions): each vertex at rest in the GLB's space with (joint a, joint b, a's share
    of 255). A skinned part keeps its two heaviest joints (rig.py weights at most two); a rigid piece rides its bone."""
    W = {}
    def wm(i):
        if i not in W: W[i] = mm(wm(parent[i]), m4(j["nodes"][i])) if i in parent else m4(j["nodes"][i])
        return W[i]
    skin = j["skins"][0]; joints = skin["joints"]; at = {n: k for k, n in enumerate(joints)}
    def up(i):  # the nearest joint above a node
        i = parent.get(i)
        while i is not None and i not in at: i = parent.get(i)
        return at.get(i, -1)
    rows = []
    for n in joints:
        node = j["nodes"][n]; pa = up(n)
        if pa < 0: m = wm(n); t = [m[r][3] for r in range(3)]; q = m2q(m)
        else:
            assert parent[n] == joints[pa], node["name"]
            t = list(node.get("translation", (0, 0, 0))); q = tuple(node.get("rotation", (0, 0, 0, 1)))
        assert max(abs(x - 1) for x in node.get("scale", (1, 1, 1))) < 1e-4, node["name"]
        rows.append([node["name"], pa, [round(x, 5) for x in t], [round(x, 5) for x in q]])
    ibm = [[[m[c * 4 + r] for c in range(4)] for r in range(4)] for m in accessor(j, bin_, skin["inverseBindMatrices"])]
    bind = [mm(wm(n), b) for n, b in zip(joints, ibm)]
    def place(ni, n, p, pts):
        a = p["attributes"]
        if "skin" in n and "JOINTS_0" in a:
            J, Wt = accessor(j, bin_, a["JOINTS_0"]), accessor(j, bin_, a["WEIGHTS_0"])
            top = 255 if j["accessors"][a["WEIGHTS_0"]]["componentType"] == 5121 else 65535 if j["accessors"][a["WEIGHTS_0"]]["componentType"] == 5123 else 1
            out, sk = [], []
            for v, jn, wt in zip(pts, J, Wt):
                wt = [x / top for x in wt]; o = sorted(range(4), key=lambda k: -wt[k]); ja, jb = jn[o[0]], jn[o[1]] if wt[o[1]] > 0 else jn[o[0]]
                wa = wt[o[0]] / max(1e-9, wt[o[0]] + wt[o[1]])
                pa, pb = mp(bind[ja], v), mp(bind[jb], v)
                out.append(tuple(pa[c] * wa + pb[c] * (1 - wa) for c in range(3))); sk.append((ja, jb, round(wa * 255)))
            return out, sk
        k = at[ni] if ni in at else up(ni); k = max(0, k); m = wm(ni)
        return [mp(m, v) for v in pts], [(k, k, 255)] * len(pts)
    return {"joints": rows, "place": place, "at": at}


def clip_of(j, bin_, rig, name):
    """An action's keys per joint, [(joint, "r" or "t", [frame], [values])] at 24 frames a second, leaving out what never
    moves from the rest (rig.py keys every bone; the export writes each still one as two held keys) and every scale."""
    a = next(a for a in j["animations"] if a["name"] == name); out = []
    for c in a["channels"]:
        path = {"rotation": "r", "translation": "t"}.get(c["target"]["path"]); k = rig["at"].get(c["target"]["node"])
        if not path or k is None: continue
        s = a["samplers"][c["sampler"]]; times = [t[0] for t in accessor(j, bin_, s["input"])]; vals = accessor(j, bin_, s["output"])
        rest = rig["joints"][k][3 if path == "r" else 2]
        if rig["joints"][k][1] < 0 or max(abs(x - y) for v in vals for x, y in zip(v, rest)) < 1e-4: continue  # the root never moves
        assert s.get("interpolation", "LINEAR") == "LINEAR", (name, c)
        if path == "r":  # one hemisphere, so a slerp between keys never goes the long way round
            vs = [vals[0]]
            for v in vals[1:]: vs.append(tuple(-x for x in v) if sum(x * y for x, y in zip(v, vs[-1])) < 0 else v)
            vals = vs
        assert max(abs(x) for v in vals for x in v) <= 1, (name, "keys past one metre")
        out.append((k, path, [round(t * 24) for t in times], vals))
    f0 = min(f[0] for _, _, f, _ in out)  # the export starts at Blender's frame 1; the cycle starts at 0, and its last key is its first
    return [(k, path, [x - f0 for x in f], v) for k, path, f, v in out]


def simplified(src, tmp):
    import subprocess
    cli = ["npx", "--yes", "@gltf-transform/cli@4"]
    subprocess.run(cli + ["weld", src, tmp + ".w.glb"], check=True, capture_output=True)
    subprocess.run(cli + ["simplify", tmp + ".w.glb", tmp] + SIMPLIFY, check=True, capture_output=True)
    os.remove(tmp + ".w.glb")
    return tmp


def main(root, dest, rigs=None):
    os.makedirs(dest, exist_ok=True)
    report = {}
    for fam, sub in SOURCES.items():
        for st in STAGES:
            src = os.path.join(root, sub, "%s-%s.glb" % (ELEMENT, st)); out = os.path.join(dest, "%s-%s.glb" % (fam, st))
            size, tris, was = bake(src, out)
            assert size <= BUDGET_BYTES, (out, size)
            report["%s-%s" % (fam, st)] = {"bytes": size, "tris": tris, "source_bytes": was, "source": "%s/%s-%s.glb" % (sub, ELEMENT, st)}
            print("%-16s %6d bytes (from %7d), %5d triangles" % (fam + "-" + st, size, was, tris))
    for fam, stages in LATE.items():
        for st, page in stages.items():
            src = os.path.join(root, SOURCES[fam], "%s-%s.glb" % (ELEMENT, page)); out = os.path.join(dest, "%s-%s.glb" % (fam, st))
            row = None
            if rigs:  # rig.py's output for this stage: the same body with its frame, Walk and Idle
                rsrc = os.path.join(rigs, "%s-%s-%s-rig.glb" % (ELEMENT, page, RIGGED[fam]))
                row = json.load(open(rsrc[:-4] + ".json")); src = rsrc
            tmp = simplified(src, out + ".s.glb")
            size, tris, _ = bake(tmp, out, late=True, row=row); was = os.path.getsize(src); os.remove(tmp)
            assert size <= (RIGGED_BUDGET_BYTES if row else LATE_BUDGET_BYTES), (out, size)
            report["%s-%s" % (fam, st)] = {"bytes": size, "tris": tris, "source_bytes": was, "simplify": " ".join(SIMPLIFY),
                                           "source": os.path.relpath(src, rigs) if row else "%s/%s-%s.glb" % (SOURCES[fam], ELEMENT, page)}
            if row: report["%s-%s" % (fam, st)].update(rig="rig.py --base %s --stage %s" % (RIGGED[fam], page), joints=row["bones"])
            print("%-16s %6d bytes (from %7d), %5d triangles%s" % (fam + "-" + st, size, was, tris, ", rigged" if row else ""))
    json.dump(report, open(os.path.join(dest, "report.json"), "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
