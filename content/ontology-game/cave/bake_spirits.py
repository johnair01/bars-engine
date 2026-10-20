"""The spirits' core and hologram for the phone: the spirit page's GLBs, stripped to what the cave draws.

shellback.py (tools/blender-cloud/content/spirits) writes five GLBs per base and element: gas, core, hologram, creature and
ascended. The cave draws the gas itself as motes (spirit-forms.js); this bakes the next two stages a spirit unfolds into as
it is sat with (Six-faces-council council/callsheets/spirits-in-caves.md, board sic-unfold-by-sitting). Creature and ally
(the page's "ascended") are baked for the Shellback only, the first family to show all five forms, worn by the elder spirit in
the WAVE room (board sic-demo-showcase = elder). Their sources are ten times the core's triangles, so they are first welded and
simplified by gltf-transform (meshoptimizer; npx fetches it) to fit LATE_BUDGET_BYTES.

Every element of a base has the same shapes; only the colour differs, and the cave colours a spirit by its element's own
hex (cave.js spiritHex). So one file per family and stage is kept, its meshes joined by material, each material keeping
its tone (its colour against the element's light tint: 1 for the light, about a third for the dark), its opacity and its
glow, and white for the eyes. Positions are quantised to 16 bits (KHR_mesh_quantization, dequantised by the node's
scale and translation), normals and UVs are dropped (the cave draws spirits unlit), indices are 16 bits.

Plain Python, no bpy. Run it on the spirit page's output folder (the shared folder's 3d-build/spirit-shellback-2026-10-14):

  python3 content/ontology-game/cave/bake_spirits.py /mnt/project-files/3d-build/spirit-shellback-2026-10-14 \
      content/ontology-game/cave/spirits

bigmind-test checks the files against BUDGET_BYTES.
"""
import json, math, os, struct, sys

BUDGET_BYTES = 64 * 1024
LATE_BUDGET_BYTES = 160 * 1024  # creature and ally: fetched once, when the elder or a spirit first wears them
STAGES = ["core", "hologram"]
# family -> {cave stage: the page's file stage}; the families not named here wear the hologram past it (spirit-forms.js LATE)
LATE = {"shellback": {"creature": "creature", "ally": "ascended"}}
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
WIDTH = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4}


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


def bake(src, out, late=False):
    j, bin_ = read_glb(src)
    mats = j.get("materials", [])
    light = None  # the element's light tint, as the page's core wears it
    for m in mats:
        if m.get("name", "").startswith("core") and m.get("pbrMetallicRoughness", {}).get("baseColorFactor"):
            light = m["pbrMetallicRoughness"]["baseColorFactor"][:3]; break
    light = light or (1, 1, 1)
    groups = {}  # material index -> [positions, indices]
    parent = {c: i for i, n in enumerate(j["nodes"]) for c in n.get("children", [])}
    def placed(i, v):  # through the node and every parent above it (the creature's and ally's parts hang off a root)
        while i is not None: v = world(j["nodes"][i], v); i = parent.get(i)
        return (v[0], -v[2], v[1])  # Blender's glTF export is y-up; the cave reads the page's z-up
    for ni, n in enumerate(j["nodes"]):
        if "mesh" not in n: continue
        for p in j["meshes"][n["mesh"]]["primitives"]:
            g = groups.setdefault(p.get("material", -1), [[], [], []])
            base = len(g[0])
            g[0].extend(placed(ni, v) for v in accessor(j, bin_, p["attributes"]["POSITION"]))
            if late and "COLOR_0" in p["attributes"]: g[2].extend(accessor(j, bin_, p["attributes"]["COLOR_0"]))
            g[1].extend(base + i[0] for i in accessor(j, bin_, p["indices"]))
    allp = [v for g in groups.values() for v in g[0]]
    lo = [min(v[k] for v in allp) for k in range(3)]; hi = [max(v[k] for v in allp) for k in range(3)]
    mid = [(lo[k] + hi[k]) / 2 for k in range(3)]; half = [max(1e-6, (hi[k] - lo[k]) / 2) for k in range(3)]
    blob, views, accs, prims, tris = bytearray(), [], [], [], 0
    def put(data, target):
        while len(blob) % 4: blob.append(0)
        views.append({"buffer": 0, "byteOffset": len(blob), "byteLength": len(data), "target": target}); blob.extend(data)
        return len(views) - 1
    for mi, (pos, idx, cols) in sorted(groups.items()):
        assert len(pos) < 65536, src
        # with the normals and UVs gone, corners that sat apart only for them are one vertex again
        seen, keep, remap, kcol = {}, [], [], []
        for vi, v in enumerate(pos):
            k = tuple(max(-32767, min(32767, round((v[c] - mid[c]) / half[c] * 32767))) for c in range(3))
            if k not in seen:
                seen[k] = len(keep); keep.append(k)
                if len(cols) == len(pos): kcol.append(cols[vi])
            remap.append(seen[k])
        idx = [remap[i] for i in idx]; pos = keep
        q = bytearray()
        for k in pos: q += struct.pack("<hhhh", *k, 0)
        pv = put(q, 34962); views[pv]["byteStride"] = 8
        iv = put(struct.pack("<%dH" % len(idx), *idx), 34963)
        accs.append({"bufferView": pv, "componentType": 5122, "normalized": True, "count": len(pos), "type": "VEC3",
                     "min": [-1, -1, -1], "max": [1, 1, 1]})
        accs.append({"bufferView": iv, "componentType": 5123, "count": len(idx), "type": "SCALAR"})
        m = mats[mi] if mi >= 0 else {}
        attrs = {"POSITION": len(accs) - 2}
        if kcol:  # the creature's and ally's painted skin, shell and cloth: one sRGB byte colour per vertex
            c = bytearray()
            for col in kcol: c += bytes(round(x * 255) for x in srgb(col)) + b"\xff"
            cv = put(bytes(c), 34962)
            accs.append({"bufferView": cv, "componentType": 5121, "normalized": True, "count": len(kcol), "type": "VEC4"}); attrs["COLOR_0"] = len(accs) - 1
        prims.append({"attributes": attrs, "indices": len(accs) - (2 if kcol else 1),
                      "extras": dict(look(m, light, late), name=m.get("name", ""))})
        tris += len(idx) // 3
    gltf = {"asset": {"version": "2.0", "generator": "bars-engine bake_spirits.py"}, "extensionsUsed": ["KHR_mesh_quantization"],
            "extensionsRequired": ["KHR_mesh_quantization"], "scene": 0, "scenes": [{"nodes": [0]}],
            "nodes": [{"name": os.path.basename(out)[:-4], "mesh": 0, "scale": half, "translation": mid}],
            "meshes": [{"primitives": prims}], "accessors": accs, "bufferViews": views, "buffers": [{"byteLength": len(blob)}]}
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4); blob += b"\0" * (-len(blob) % 4)
    data = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack("<II", len(js), 0x4E4F534A) + js + \
        struct.pack("<II", len(blob), 0x004E4942) + bytes(blob)
    open(out, "wb").write(data)
    return len(data), tris, os.path.getsize(src)


def simplified(src, tmp):
    import subprocess
    cli = ["npx", "--yes", "@gltf-transform/cli@4"]
    subprocess.run(cli + ["weld", src, tmp + ".w.glb"], check=True, capture_output=True)
    subprocess.run(cli + ["simplify", tmp + ".w.glb", tmp] + SIMPLIFY, check=True, capture_output=True)
    os.remove(tmp + ".w.glb")
    return tmp


def main(root, dest):
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
            tmp = simplified(src, out + ".s.glb")
            size, tris, _ = bake(tmp, out, late=True); was = os.path.getsize(src); os.remove(tmp)
            assert size <= LATE_BUDGET_BYTES, (out, size)
            report["%s-%s" % (fam, st)] = {"bytes": size, "tris": tris, "source_bytes": was, "source": "%s/%s-%s.glb" % (SOURCES[fam], ELEMENT, page), "simplify": " ".join(SIMPLIFY)}
            print("%-16s %6d bytes (from %7d), %5d triangles" % (fam + "-" + st, size, was, tris))
    json.dump(report, open(os.path.join(dest, "report.json"), "w"), indent=1)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
