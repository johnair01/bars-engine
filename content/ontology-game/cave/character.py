"""The character creator (J4): one faceless player figure from a theme, a build and a palette, rigged and walking.

    python content/ontology-game/cave/character.py --build average --palette dusk --out DIR
    python content/ontology-game/cave/character.py --all --out DIR [--sheet]

The theme is the Taoist cultivation robe set (cc-robe-set, bpt-robe-theme), the wardrobe the 2D sprite creator also
draws from (cs-one-studio). In J4 the set is painted onto the body as its under-layer: a tunic whose crossed collar
runs as one band over the shoulders and round the back of the neck, falling
to mid-thigh, tied trousers, a sash and cloth shoes. The long robe, the sash as cloth and the topknot are J5's separate
garments, skinned to this same rig.

The body starts from the body map's figure (body/build_figure.py: rounded parts, 1.75 m, no face, no sex, age or skin
colour) and is stylized away from it after his first look (a bigger head, a plain trunk, rounder limbs), widened or
narrowed by the build and fused into one surface. Its rig carries the cave avatar's joint names
(cave.js buildAvatar: hips, spine, neck, head; hip, knee, ankle; shoulder, elbow, wrist), and its one animation,
"Walk", is cave.js poseAvatar baked at a mid stride: two steps a second, so one cycle is one second, 24 keys.

Each figure is one GLB under 300 KB (the kill line). report.json says, per figure, its bytes, triangles and the walk's
joint checks; the test (J4 in tools/blender-cloud/tests/test_bpy.py) checks the exported GLBs again on their own.
Needs bpy (tools/blender-cloud/README.md).
"""
import argparse, json, math, os, sys

import bpy
import bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

# ---- the theme: builds and palettes ---------------------------------------------------------------------------
# A build scales the body's widths and depths; height stays 1.75 m so the walk's stride is the same for all (a choice).
# (trunk and hips, limbs, shoulder span)
BUILDS = {
    "slight": (0.86, 0.84, 0.93),
    "average": (1.0, 1.0, 1.0),
    "broad": (1.2, 1.22, 1.1),
}
# The robe set's colours, linear RGB. Skin is the cave's "self" figure colour for every palette (cave.js AVATAR_LOOK),
# so a palette dresses the figure and never colours the body (build_figure.py: no skin colour). Choices, for his eye.
SKIN = (0.69, 0.62, 0.53)


def hexc(h):
    """sRGB hex to linear RGB."""
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


PALETTES = {
    # dusk: indigo tunic, slate trousers, old-gold sash, cream trim
    "dusk": {"tunic": hexc("44407a"), "trousers": hexc("2c2e44"), "sash": hexc("b8913f"), "trim": hexc("e9dfc6"),
             "shoes": hexc("1e1b24")},
    # jade: green tunic, pine trousers, pale-gold sash, cream trim
    "jade": {"tunic": hexc("4e8270"), "trousers": hexc("2d4038"), "sash": hexc("cdb47a"), "trim": hexc("efe7d2"),
             "shoes": hexc("221f1c")},
    # hemp: the undyed set, oat tunic, ash trousers, walnut sash, bone trim
    "hemp": {"tunic": hexc("d2c8b2"), "trousers": hexc("857e70"), "sash": hexc("6e4e36"), "trim": hexc("f4efe3"),
             "shoes": hexc("3a3029")},
}
THEMES = {"robe_set": {"builds": BUILDS, "palettes": PALETTES}}

# ---- the walk: cave.js poseAvatar with the stride held at its middle ------------------------------------------
STEPS_PER_S, FPS, KEYS = 2, 24, 24          # cave.js STEPS_PER_S; one cycle (a left and a right step) is one second
AMP = 0.4                                   # radians: cave.js clamps the swing to 0.2..0.62 by the step's length
LEG = 0.96 - 0.085                          # hip to ankle, metres, for the hips' sink

MAX_BYTES, VOXEL, TRIS = 300 * 1024, 0.007, 2500
HEM, SASH, CUFF, TIE = (0.68, 0.71), (0.99, 1.07), 0.93, (0.10, 0.14)   # heights of the painted bands, metres
NECK = 1.47                                                             # the collar stands up the neck to here
NECK_BASE = 1.425
CUTS = (*HEM, *SASH, CUFF, *TIE, NECK, NECK_BASE)
SPLIT = 0.03                                                           # metres, longest edge where a line is cut
COLLAR_R = 0.095                                                        # the collar's ring round the neck, metres
COLLAR = 0.024                                                          # half the collar band's width, metres


def body_parts(build):
    """The body map's parts (build_figure.py, the same numbers), each tagged with the bone that carries it.
    Returns [(bone, bmesh)], one bmesh per part so each vertex of the fused surface can find the part it came from."""
    wt, wl, ws = BUILDS[build]
    parts = []

    def new(bone):
        bm = bmesh.new()
        parts.append((bone, bm))
        return bm

    def ellipsoid(bm, c, rx, ry, rz):
        m = Matrix.Translation(c) @ Matrix.Diagonal((rx, ry, rz, 1))
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0, matrix=m)

    def limb(bm, a, b, ra, rb):
        a, b = Vector(a), Vector(b)
        d = b - a
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=ra, radius2=rb, depth=d.length,
                              matrix=Matrix.Translation((a + b) / 2) @ rot)
        ellipsoid(bm, a, ra, ra, ra)
        ellipsoid(bm, b, rb, rb, rb)

    def loft(bm, profile, segments=32, steps=8):
        rings = []
        for (z0, rx0, ry0), (z1, rx1, ry1) in zip(profile, profile[1:]):
            for k in range(steps):
                t = (1 - math.cos(math.pi * k / steps)) / 2
                rings.append((z0 + (z1 - z0) * k / steps, rx0 + (rx1 - rx0) * t, ry0 + (ry1 - ry0) * t))
        rings.append(profile[-1])
        verts = [[bm.verts.new((rx * math.cos(2 * math.pi * j / segments), ry * math.sin(2 * math.pi * j / segments), z))
                  for j in range(segments)] for z, rx, ry in rings]
        for a, b in zip(verts, verts[1:]):
            for j in range(segments):
                bm.faces.new((a[j], a[(j + 1) % segments], b[(j + 1) % segments], b[j]))
        bm.faces.new(list(reversed(verts[0])))
        bm.faces.new(verts[-1])

    # Stylized, not realistic (Wendell, 2026-10-13, round 1: "build proportions are close to human but are hitting
    # uncanny valley"): about six heads tall where build_figure.py's canon is seven and a half, a short neck, a plain
    # tapered trunk with no waist or chest sculpting, rounder and thicker limbs, mitten hands and rounded feet, nearer
    # the cave's capsule avatar and the daemons than the body map.
    j = joints(build)
    ellipsoid(new("head"), (0, 0.0, 1.615), 0.112, 0.118, 0.13)
    limb(new("neck"), (0, 0.008, 1.42), (0, 0.008, 1.52), 0.06, 0.056)
    trunk = [(z, rx * wt, ry * wt) for z, rx, ry in
             [(0.90, 0.150, 0.100), (0.98, 0.158, 0.106), (1.06, 0.152, 0.104), (1.15, 0.150, 0.102),
              (1.25, 0.158, 0.104), (1.32, 0.164, 0.102), (1.38, 0.160, 0.094), (1.44, 0.105, 0.072)]]
    trunk[-2] = (trunk[-2][0], 0.160 * ws, trunk[-2][2])   # the shoulders follow the shoulder span
    low = new("hips")
    loft(low, trunk[:3])
    ellipsoid(low, (0, 0.0, 0.92), 0.150 * wt, 0.092 * wt, 0.06)
    loft(new("spine"), trunk[2:])
    sx = j["shoulderL"][0][0]
    limb(new("spine"), (-sx + 0.02, 0.0, 1.385), (sx - 0.02, 0.0, 1.385), 0.06 * wl, 0.06 * wl)
    for n in ("L", "R"):
        limb(new("shoulder" + n), *j["shoulder" + n], 0.054 * wl, 0.046 * wl)
        limb(new("elbow" + n), *j["elbow" + n], 0.045 * wl, 0.039 * wl)
        wr = Vector(j["wrist" + n][0]) * 0.35 + Vector(j["wrist" + n][1]) * 0.65
        ellipsoid(new("wrist" + n), wr, 0.042 * wl, 0.05 * wl, 0.06)
        limb(new("hip" + n), *j["hip" + n], 0.088 * wl, 0.066 * wl)
        limb(new("knee" + n), *j["knee" + n], 0.064 * wl, 0.05 * wl)
        a = Vector(j["ankle" + n][0])
        ellipsoid(new("ankle" + n), (a.x + math.copysign(0.005, a.x), -0.035, 0.045), 0.055 * wl, 0.105, 0.048)
    return parts


def collar_path(bm, build):
    """The crossed collar's centre line, laid on the body's surface as points every 4 mm, worn left over right: from
    the figure's right side under the arm, up across the chest to the left of the neck, round the back of the neck over
    both shoulders, then the short under-edge from the right of the neck down to where it meets the long one.
    (Wendell, 2026-10-13, round 1: "We'd expect smooth collars that are painted on the shoulders".)"""
    tree = BVHTree.FromBMesh(bm)
    wt = BUILDS[build][0]
    r, zr, a0 = COLLAR_R, 1.415, math.radians(40)                 # the ring round the neck, and where it opens in front

    def ring(a):
        return Vector((r * math.sin(a), -r * math.cos(a) + 0.008, zr))

    def front(x, z):                                           # a point on the chest, seen straight from the front
        hit = tree.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))[0]
        return hit if hit else tree.find_nearest(Vector((x, 0, z)))[0]

    L, R = ring(a0), ring(-a0)
    A = Vector((-0.125 * wt, 0, 1.13))                         # the long edge's end, the right side under the arm
    D_t = (L.x - 0.0) / (L.x - A.x)                            # where the under-edge meets it, on the middle line
    D = Vector((0.0, 0, L.z + (A.z - L.z) * D_t))
    pts = []

    def line(p, q):
        n = max(2, int((Vector((q.x - p.x, q.z - p.z))).length / 0.004))
        pts.extend(front(p.x + (q.x - p.x) * k / n, p.z + (q.z - p.z) * k / n) for k in range(n + 1))

    line(A, L)
    n = int(r * (2 * math.pi - 2 * a0) / 0.004)
    pts.extend(tree.find_nearest(ring(a0 + (2 * math.pi - 2 * a0) * k / n))[0] for k in range(n + 1))
    line(R, D)
    kd = KDTree(len(pts))
    for i, p in enumerate(pts):
        kd.insert(p, i)
    kd.balance()
    return lambda co: kd.find(co)[2]


def cut_along(bm, field):
    """Cuts every face where field(co) changes sign, at the exact crossing, so the line field = 0 is a run of edges and a
    band painted on one side of it ends on a smooth edge. Triangles first, so each face is crossed at most twice."""
    # the decimated surface has triangles longer than the band is wide, so near the line its edges are first halved
    # until none is longer than SPLIT; otherwise the band could pass between two vertices and never be cut
    for _ in range(4):
        long = [e for e in bm.edges if e.calc_length() > SPLIT
                and min(abs(field(e.verts[0].co)), abs(field(e.verts[1].co)),
                        abs(field((e.verts[0].co + e.verts[1].co) / 2))) < 0.6 * e.calc_length()]
        if not long:
            break
        bmesh.ops.subdivide_edges(bm, edges=long, cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    val = {v: field(v.co) for v in bm.verts}
    made = set()
    for e in list(bm.edges):
        a, b = e.verts
        fa, fb = val[a], val[b]
        if (fa < 0) != (fb < 0) and abs(fa - fb) > 1e-9:
            at = a.co.lerp(b.co, fa / (fa - fb))
            _, nv = bmesh.utils.edge_split(e, a, 0.5)
            nv.co = at                                         # placed here, not by edge_split's own fraction
            val[nv] = 0.0
            made.add(nv)
    for f in list(bm.faces):
        new = [v for v in f.verts if v in made]
        if len(new) == 2 and not any(new[1] in e.verts for e in new[0].link_edges):
            bmesh.utils.face_split(f, new[0], new[1])


def joints(build):
    """{bone: (head, tail)} in Blender space: Z up, the figure faces -Y, its own left is +X (build_figure.py)."""
    _, wl, ws = BUILDS[build]
    j = {"hips": ((0, 0, 0.96), (0, 0, 1.03)), "spine": ((0, 0, 1.03), (0, 0, 1.42)),
         "neck": ((0, 0.008, 1.42), (0, 0.008, 1.50)), "head": ((0, 0.0, 1.50), (0, 0.0, 1.75))}
    for n, s in (("L", 1), ("R", -1)):
        sh, el = 0.19 * ws, 0.27 * ws + 0.08 * (ws - 1)
        j["shoulder" + n] = ((s * sh, 0, 1.385), (s * el, 0.01, 1.13))
        j["elbow" + n] = ((s * el, 0.01, 1.13), (s * (el + 0.075 * wl ** 0.5), -0.02, 0.89))
        w = j["elbow" + n][1]
        j["wrist" + n] = (w, (w[0] + s * 0.02, -0.03, 0.76))
        hx = 0.09 * wl ** 0.5
        j["hip" + n] = ((s * hx, 0, 0.96), (s * (hx + 0.015), 0.0, 0.50))
        j["knee" + n] = ((s * (hx + 0.015), 0.0, 0.50), (s * (hx + 0.025), 0.015, 0.085))
        j["ankle" + n] = ((s * (hx + 0.025), 0.015, 0.085), (s * (hx + 0.03), -0.13, 0.03))
    # two hem bones for J5's long robe, hanging from the hips: the front panel goes with whichever leg is forward and
    # the back panel with whichever is back (garments.py). The body carries no weight on them.
    j["hemF"] = ((0, -0.02, 0.96), (0, -0.02, 0.40))
    j["hemB"] = ((0, 0.02, 0.96), (0, 0.02, 0.40))
    return j


PARENT = {"hips": None, "spine": "hips", "neck": "spine", "head": "neck"}
for _n in ("L", "R"):
    PARENT.update({"shoulder" + _n: "spine", "elbow" + _n: "shoulder" + _n, "wrist" + _n: "elbow" + _n,
                   "hip" + _n: "hips", "knee" + _n: "hip" + _n, "ankle" + _n: "knee" + _n})
PARENT.update({"hemF": "hips", "hemB": "hips"})
HEM_BONES = ("hemF", "hemB")


def pose(t):
    """cave.js poseAvatar at walk time t (seconds), moving, mid stride: {bone: (rot about X, rot about Z)} and the
    hips' drop. cave.js turns groups about their own x (the figure's left) and y (up); in Blender those are X and Z."""
    ph, A = t * math.pi * STEPS_PER_S, AMP
    sL, sR = math.sin(ph), math.sin(ph + math.pi)
    r = {}
    r["hipL"], r["hipR"] = -A * sL, -A * sR
    r["kneeL"] = 0.12 + 0.95 * max(0.0, math.cos(ph))
    r["kneeR"] = 0.12 + 0.95 * max(0.0, math.cos(ph + math.pi))
    r["ankleL"], r["ankleR"] = -(r["hipL"] + r["kneeL"]) * 0.8, -(r["hipR"] + r["kneeR"]) * 0.8
    B = A * 0.85
    r["shoulderL"], r["shoulderR"] = B * sL, B * sR
    r["elbowL"] = -(0.25 + 0.35 * max(0.0, -sL))
    r["elbowR"] = -(0.25 + 0.35 * max(0.0, -sR))
    # the hem bones (J5): the front panel follows the leg that is ahead, the back panel the leg that is behind, its
    # shin kicking back included. A positive turn about X swings a hanging bone back. cave.js computes the same two.
    r["hemF"] = 0.9 * min(r["hipL"], r["hipR"])
    r["hemB"] = 0.9 * max(r["hipL"] + 0.4 * r["kneeL"], r["hipR"] + 0.4 * r["kneeR"])
    rot = {k: (v, 0.0) for k, v in r.items()}
    rot["spine"] = (0.07, 0.14 * sL)
    rot["hips"] = (0.0, -0.1 * sL)
    drop = LEG * (1 - math.cos(A)) * 0.85 * abs(sL)
    return rot, drop


def build(build_name, palette, out_dir, theme="robe_set"):
    fig, rig = make(build_name, palette, theme)
    return export(fig, rig, build_name, palette, out_dir, theme)


def make(build_name, palette, theme="robe_set"):
    """The figure and its walking rig in a fresh scene, not yet exported (J5's garments are cut on these)."""
    if theme not in THEMES:
        raise SystemExit(f"no theme {theme}; there is {', '.join(THEMES)}")
    if build_name not in BUILDS or palette not in PALETTES:
        raise SystemExit(f"builds: {', '.join(BUILDS)}; palettes: {', '.join(PALETTES)}")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    name = f"{build_name}-{palette}"

    # the body: every part into one mesh, fused by a voxel remesh, smoothed and brought to a phone budget
    parts = body_parts(build_name)
    all_bm = bmesh.new()
    trees = []
    for bone, bm in parts:
        tmp = bpy.data.meshes.new("tmp")
        bm.to_mesh(tmp)
        all_bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
        bm.verts.ensure_lookup_table()
        trees.append((bone, BVHTree.FromBMesh(bm)))
    raw = bpy.data.meshes.new("Raw")
    all_bm.to_mesh(raw)
    all_bm.free()
    fig = bpy.data.objects.new("Figure", raw)
    scene.collection.objects.link(fig)
    for kind, opts in (("REMESH", {"mode": "VOXEL", "voxel_size": VOXEL}), ("SMOOTH", {"factor": 0.8, "iterations": 8}),
                       ("DECIMATE", {"ratio": 1.0})):
        m = fig.modifiers.new(kind, kind)
        for k, v in opts.items():
            setattr(m, k, v)
    dg = bpy.context.evaluated_depsgraph_get()
    whole = len(fig.evaluated_get(dg).data.polygons) * 2            # quads, as triangles
    fig.modifiers["DECIMATE"].ratio = TRIS / whole                  # every build lands near the same count
    dg = bpy.context.evaluated_depsgraph_get()
    fused = bpy.data.meshes.new_from_object(fig.evaluated_get(dg))
    fig.modifiers.clear()
    fig.data = fused
    fused.name = f"Figure-{name}"
    # cut the surface level at each painted band's edge (hem, sash, cuff, ankle tie), so a band ends on an edge
    # and not across the long thin triangles the decimation leaves on the limbs
    bm = bmesh.new()
    bm.from_mesh(fused)
    for z in CUTS:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z), plane_no=(0, 0, 1))
    collar = collar_path(bm, build_name)
    cut_along(bm, lambda co: collar(co) - COLLAR)
    bm.to_mesh(fused)
    bm.free()
    for p in fused.polygons:
        p.use_smooth = True
    for _, bm in parts:
        bm.free()

    # the rig: the cave avatar's joints
    J = joints(build_name)
    arm_data = bpy.data.armatures.new("Rig")
    rig = bpy.data.objects.new("Rig", arm_data)
    scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    for bone in PARENT:
        eb = arm_data.edit_bones.new(bone)
        eb.head, eb.tail = J[bone]
        eb.roll = 0
    for bone, parent in PARENT.items():
        if parent:
            arm_data.edit_bones[bone].parent = arm_data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")

    # weights: each vertex goes to the part it lies nearest, and blends with that part's parent or child where
    # the two meet (a joint), so the surface bends at a joint and never pulls an arm into the trunk
    groups = {b: fig.vertex_groups.new(name=b) for b in PARENT}
    body = [b for b in PARENT if b not in HEM_BONES]
    near = {b: [t for bb, t in trees if bb == b] for b in body}
    links = {b: {b} | {PARENT[b]} - {None} | {c for c, p in PARENT.items() if p == b and c in body} for b in body}
    bone_of = []
    for v in fused.vertices:
        d = {}
        for b, ts in near.items():
            d[b] = min(t.find_nearest(v.co)[3] for t in ts)
        best = min(d, key=d.get)
        bone_of.append(best)
        w = {b: math.exp(-(d[b] - d[best]) / 0.012) for b in links[best]}
        w = dict(sorted(w.items(), key=lambda kv: -kv[1])[:2])
        tot = sum(w.values())
        for b, x in w.items():
            if x / tot > 0.02:
                groups[b].add([v.index], x / tot, "REPLACE")
    fig.parent = rig
    mod = fig.modifiers.new("Rig", "ARMATURE")
    mod.object = rig

    # the robe set's under-layer, painted per vertex
    pal = PALETTES[palette]
    col = fused.color_attributes.new("Col", "BYTE_COLOR", "CORNER")

    def paint(co, bone):
        x, y, z = co
        if bone in ("head", "neck"):
            return SKIN if z > NECK else pal["trim"]                # the collar stands a little way up the neck
        if z > NECK_BASE and bone == "spine":
            return pal["trim"]                                      # and is one band all round where neck meets trunk
        if bone.startswith("wrist"):
            return SKIN
        if bone.startswith("ankle"):
            return pal["shoes"]
        if bone.startswith("knee"):
            return pal["trim"] if TIE[0] < z < TIE[1] else pal["trousers"]   # the trousers tied at the ankle
        if SASH[0] < z < SASH[1] and not bone.startswith(("shoulder", "elbow")):
            return pal["sash"]
        if bone.startswith("hip") and bone != "hips":
            if z > HEM[0]:
                return pal["trim"] if z < HEM[1] else pal["tunic"]  # the tunic falls to mid-thigh, hemmed
            return pal["trousers"]
        if bone.startswith("elbow"):
            # the sleeve runs to the wrist with a cuff
            return pal["trim"] if z < CUFF else pal["tunic"]
        if collar(Vector(co)) < COLLAR:
            return pal["trim"]                                      # the crossed collar (collar_path above)
        if bone.startswith("shoulder") or bone in ("spine", "hips"):
            return pal["tunic"]
        return pal["tunic"]

    # one colour per face, so a band's edge is a clean step and never a streak smeared along a long triangle
    for poly in fused.polygons:
        bones = [bone_of[i] for i in poly.vertices]
        rgb = paint(poly.center, max(set(bones), key=bones.count))
        for li in poly.loop_indices:
            col.data[li].color = (*rgb, 1.0)
    mat = bpy.data.materials.new(f"Robe-{palette}")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.85
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    fused.materials.append(mat)

    # the walk
    act = bpy.data.actions.new("Walk")
    rig.animation_data_create()
    rig.animation_data.action = act
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
    for k in range(KEYS + 1):
        t = k / FPS
        rot, drop = pose(t % 1.0)
        for pb in rig.pose.bones:
            Bm = pb.bone.matrix_local.to_3x3()
            ax, az = rot.get(pb.name, (0.0, 0.0))
            R = Matrix.Rotation(az, 3, "Z") @ Matrix.Rotation(ax, 3, "X")
            q = (Bm.inverted() @ R @ Bm).to_quaternion()
            if k and q.dot(prev[pb.name]) < 0:
                q.negate()                                         # keep the keys on one side, so they interpolate short
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=k + 1)
            if pb.name == "hips":
                pb.location = Bm.inverted() @ Vector((0, 0, -drop))
                pb.keyframe_insert("location", frame=k + 1)
        prev = {pb.name: pb.rotation_quaternion.copy() for pb in rig.pose.bones}
    scene.frame_start, scene.frame_end = 1, KEYS + 1
    return fig, rig


def export(fig, rig, build_name, palette, out_dir, theme="robe_set"):
    name, fused = f"{build_name}-{palette}", fig.data
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{name}.glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_yup=True, export_normals=True,
                              export_texcoords=False, export_skins=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_frame_range=True, export_force_sampling=False,
                              export_vertex_color="ACTIVE", export_all_vertex_colors=False)
    size = os.path.getsize(path)
    row = {"id": name, "theme": theme, "build": build_name, "palette": palette, "file": os.path.basename(path),
           "bytes": size, "tris": sum(len(p.vertices) - 2 for p in fused.polygons), "verts": len(fused.vertices),
           "bones": len(PARENT), "keys": KEYS + 1}
    if size > MAX_BYTES:
        raise SystemExit(f"{name}.glb is {size // 1024} KB, over the {MAX_BYTES // 1024} KB line")
    return row


def sheet(rows, out_dir):
    """Nine figures on one sheet, builds down and palettes across, each caught a quarter of the way through the walk,
    seen from the front three-quarter; and a side strip of the average dusk figure at four points of the walk."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for row in rows:
        before = set(sc.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(out_dir, row["file"]))
        bi, pi = list(BUILDS).index(row["build"]), list(PALETTES).index(row["palette"])
        for o in set(sc.objects) - before:
            if o.parent is None:
                o.location = ((pi - 1) * 0.95, 0, (1 - bi) * 2.05)
    sc.frame_set(1 + KEYS // 4)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.type, cam.data.ortho_scale = "ORTHO", 6.6
    d = Vector((math.sin(math.radians(-25)), -math.cos(math.radians(-25)), 0.12)).normalized()
    cam.location = Vector((0, 0, 0.9)) + d * 12
    cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(cam)
    sc.camera = cam
    for e, rz, rx in ((3.2, 35, 50), (1.2, -140, 60)):
        sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
        sun.data.energy, sun.rotation_euler = e, (math.radians(rx), 0, math.radians(rz))
        sc.collection.objects.link(sun)
    sc.world = bpy.data.worlds.new("w")
    sc.world.color = (0.16, 0.15, 0.17)
    sc.render.engine, sc.cycles.device, sc.cycles.samples = "CYCLES", "CPU", 24
    sc.render.resolution_x, sc.render.resolution_y = 900, 1260
    sc.view_settings.view_transform = "Standard"
    sc.render.filepath = os.path.join(out_dir, "sheet.png")
    bpy.ops.render.render(write_still=True)

    # the walk strip: the average dusk figure from its left side at keys 0, 6, 12 and 18, side by side
    import numpy as np
    for o in sc.objects:
        o.hide_render = True
    strip = next(r for r in rows if r["build"] == "average" and r["palette"] == "dusk")
    before = set(sc.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(out_dir, strip["file"]))
    for o in set(sc.objects) - before:
        o.hide_render = False
        if o.parent is None:
            o.location = (0, 0, 0)
    cam.data.ortho_scale = 2.2
    side = bpy.data.objects.new("side", bpy.data.lights.new("side", "SUN"))
    side.data.energy, side.rotation_euler = 3.0, (math.radians(60), 0, math.radians(100))
    sc.collection.objects.link(side)
    cam.location, cam.rotation_euler = (8, 0, 0.9), (math.radians(90), 0, math.radians(90))
    sc.render.resolution_x, sc.render.resolution_y = 300, 600
    cells = []
    for k in (0, 6, 12, 18):
        sc.frame_set(1 + k)
        sc.render.filepath = os.path.join(out_dir, f"walk_{k:02d}.png")
        bpy.ops.render.render(write_still=True)
        im = bpy.data.images.load(sc.render.filepath)
        cells.append(np.array(im.pixels[:], np.float32).reshape(600, 300, 4))
    img = bpy.data.images.new("strip", 1200, 600)
    img.pixels.foreach_set(np.hstack(cells).ravel())
    img.filepath_raw = os.path.join(out_dir, "walk.png")
    img.file_format = "PNG"
    img.save()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--theme", default="robe_set")
    ap.add_argument("--build", default="average")
    ap.add_argument("--palette", default="dusk")
    ap.add_argument("--all", action="store_true", help="every build in every palette")
    ap.add_argument("--sheet", action="store_true", help="render sheet.png and walk.png (Cycles, CPU)")
    ap.add_argument("--out", default=os.path.join(os.environ.get("W", "/tmp/blender-cloud"), "characters"))
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    combos = [(b, p) for b in BUILDS for p in PALETTES] if a.all else [(a.build, a.palette)]
    rows = [build(b, p, a.out, a.theme) for b, p in combos]
    with open(os.path.join(a.out, "report.json"), "w") as f:
        json.dump(rows, f, indent=1)
    for r in rows:
        print(f"{r['id']}: {r['bytes'] // 1024} KB, {r['tris']} triangles, {r['bones']} bones, {r['keys']} keys")
    if a.sheet:
        sheet(rows, a.out)
        print(f"sheet: {os.path.join(a.out, 'sheet.png')}, {os.path.join(a.out, 'walk.png')}")


if __name__ == "__main__":
    main()
