"""Clothing as separate garments (J5): the long robe, the sash and the topknot, each skinned to the J4 figure's one rig.

    python content/ontology-game/cave/garments.py --build average --palette dusk --out DIR
    python content/ontology-game/cave/garments.py --all --out DIR [--sheet]

Each garment is its own mesh, cut by script from the figure it is worn on, offset from the surface beneath and then
thickened, and weighted from that surface, so the game can put one on or take it off at runtime by binding it to the
figure's skeleton (three.js: one SkinnedMesh per garment, the figure's bones by name). Three garments from the robe
set (cc-robe-set), each in the robe set's three palettes (dusk, jade, hemp), for each of the three builds:

- robe: an ankle-length outer robe with wide sleeves to the wrist, belted at the sash's height, a crossed collar
  worn left over right (the J4 collar's own line, character.collar_path) and side slits. It is cut as two flat
  panels, sewn, and draped on the standing body by Blender's cloth solver (drape(); round 3). Above the hips it
  takes its weights from the body under it, the sleeves from the arm. Below the hips it hangs from the hips and from
  two hem bones in the rig (character.HEM_BONES): the front panel goes with whichever leg is ahead, the back panel
  with whichever is behind, and the sides with their own thigh. This is root-game's rule that hanging cloth rides
  the pelvis, not the legs (kit_engine.js skirtWeights), with hem bones where root-game runs its cloth solver
  (spec.md, J5: "a few extra bones in its hem first").
- sash: a band at the waist, knotted in front on the wearer's left with two tails. It is cut twice, once on the body
  ("sash") and once over the robe ("sash-robe"), so it sits close whichever is under it; weights come from the layer
  beneath.
- topknot: hair over the crown and back of the head, gathered into a bun on top with a tie and a pin through it.
  Rigid on the head.

From root-game (wendell-britt/root-game, engine/kit_engine.js; copied as ideas, nothing there is edited): the sash's
ring construction (rows of points round the body), the A-line cut that flares toward the hem, slits where the robe
must part over the legs (slitColumns), and its fullness rule, that a hanging garment is cut wide enough for the
stride rather than for standing. Here the fullness is found by walking: fit() pushes the cloth out wherever a body
point came through it at any key of the walk, and repeats until none does.

The test, per garment and build, at every one of the walk's 25 keys: a covered body point (a point of the body the
garment covers when standing) that lies outside the garment's surface is a point through it, unless its nearest
garment point is at an open edge (the hem, a slit, a cuff, the neck), where a leg or a hand is meant to come out.
Where the body faces itself a few centimetres away (under the arm, between the thighs) it is not tested: the robe's
cloth is caught there, as real cloth is, and nobody sees it (cover_robe).
report.json carries the counts; test J5 (tools/blender-cloud/tests/test_bpy.py) requires zero and each GLB under
150 KB. Needs bpy (tools/blender-cloud/README.md).
"""
import argparse, json, math, os, sys

import bpy
import bmesh
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import character as C  # noqa: E402

GARMENTS = ("robe", "sash", "sash-robe", "topknot")
MAX_BYTES = 150 * 1024
THICK = 0.004                                    # metres of cloth, outward (solidify); the test uses the inner face
LAST_THROUGH = []                                # (key, point, distance) of the last test's points through
MAX_PUSH = 0.015                                 # metres, the most one round of the fit moves a point
TOL, EDGE = 0.002, 0.015                         # metres: outside by more than TOL counts, unless within EDGE of an opening
ARMS = ("shoulderL", "shoulderR", "elbowL", "elbowR")
TRUNK = ("hips", "spine", "neck", "hipL", "hipR", "kneeL", "kneeR", "ankleL", "ankleR")


def hexc(h):
    return C.hexc(h)


# The robe set's three colourways, one per palette, so a palette dresses the whole figure. Choices, for his eye.
COLOURWAYS = {
    # dusk: an ink-indigo robe with a cream collar over the indigo tunic; old-gold sash; ink hair, gold pin
    "dusk": {"robe": hexc("27243f"), "edge": hexc("e9dfc6"), "lining": hexc("44407a"), "sash": hexc("b8913f"),
             "knot": hexc("8f6d2a"), "hair": hexc("17141b"), "tie": hexc("44407a"), "pin": hexc("c9a24a")},
    # jade: a deep pine robe, cream collar; pale-gold sash; dark-brown hair, jade pin
    "jade": {"robe": hexc("244a3f"), "edge": hexc("efe7d2"), "lining": hexc("4e8270"), "sash": hexc("cdb47a"),
             "knot": hexc("a08c55"), "hair": hexc("2a1d17"), "tie": hexc("4e8270"), "pin": hexc("7fbf9f")},
    # hemp: an undyed flax robe, walnut collar; walnut sash; ash-grey hair, wooden pin
    "hemp": {"robe": hexc("b3a688"), "edge": hexc("6e4e36"), "lining": hexc("d2c8b2"), "sash": hexc("6e4e36"),
             "knot": hexc("52392a"), "hair": hexc("6b6660"), "tie": hexc("d2c8b2"), "pin": hexc("8a6542")},
}

# the robe's cut
HEM, SLIT = 0.15, 0.54                           # metres above the floor: the hem shows the ankle ties; the slits are
                                                 # cut to here and hang a little higher once belted (round 3: room for the stride)


# ---- reading the figure ---------------------------------------------------------------------------------------

def bone_weights(obj):
    """[{bone: weight}] per vertex, from the vertex groups."""
    names = {g.index: g.name for g in obj.vertex_groups}
    return [{names[g.group]: g.weight for g in v.groups if g.weight > 0} for v in obj.data.vertices]


def main_bone(w):
    return max(w, key=w.get) if w else None


def posed(obj, frame):
    """World positions of obj's vertices at frame, through its armature."""
    sc = bpy.context.scene
    sc.frame_set(frame)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    mw = obj.matrix_world
    co = [mw @ v.co for v in me.vertices]
    ev.to_mesh_clear()
    return co


def weight_source(obj, keep, only=None):
    """A lookup: the weights of obj's nearest points (four, by inverse distance) among the vertices keep() accepts
    (and, if given, among the indices in only)."""
    W = bone_weights(obj)
    idx = [i for i, v in enumerate(obj.data.vertices) if keep(v.co, W[i]) and (only is None or i in only)]
    kd = KDTree(len(idx))
    for n, i in enumerate(idx):
        kd.insert(obj.matrix_world @ obj.data.vertices[i].co, i)
    kd.balance()

    def at(co, k=4):
        acc = {}
        found = kd.find_n(co, k)
        for _, i, d in found:
            f = 1.0 / max(d, 1e-4)
            for b, x in W[i].items():
                acc[b] = acc.get(b, 0.0) + f * x
        return norm(acc)
    return at


def norm(w, top=4):
    w = dict(sorted(((b, x) for b, x in w.items() if x > 1e-4), key=lambda kv: -kv[1])[:top])
    t = sum(w.values()) or 1.0
    return {b: x / t for b, x in w.items() if x / t > 0.01}


def smooth(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def hull(pts):
    """Convex hull of 2D points, counter-clockwise (monotone chain)."""
    pts = sorted(set(pts))
    if len(pts) < 3:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and cross(lo[-2], lo[-1], p) <= 0:
            lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and cross(hi[-2], hi[-1], p) <= 0:
            hi.pop()
        hi.append(p)
    return lo[:-1] + hi[:-1]


def hull_radius(poly, cx, cy, th):
    """How far from (cx, cy), at angle th, the ray leaves the polygon."""
    dx, dy = math.cos(th), math.sin(th)
    best = 0.0
    for (ax, ay), (bx, by) in zip(poly, poly[1:] + poly[:1]):
        ex, ey = bx - ax, by - ay
        den = dx * ey - dy * ex
        if abs(den) < 1e-12:
            continue
        t = ((ax - cx) * ey - (ay - cy) * ex) / den
        u = ((ax - cx) * dy - (ay - cy) * dx) / den
        if t > 0 and -1e-9 <= u <= 1 + 1e-9:
            best = max(best, t)
    return best


def section(coords, z, band=0.02, edges=None):
    """The convex outline of a surface at height z: its vertices within band of z, and where its edges cross z (the
    decimated body has long triangles, so its vertices alone miss the outline). edges: [(a, b)] into coords."""
    pts = [(round(c.x, 5), round(c.y, 5)) for c in coords if abs(c.z - z) < band]
    for a, b in edges or ():
        A, B = coords[a], coords[b]
        if (A.z - z) * (B.z - z) < 0:
            P = A.lerp(B, (z - A.z) / (B.z - A.z))
            pts.append((round(P.x, 5), round(P.y, 5)))
    return hull(pts)


def edges_of(obj, keep):
    """Edges of obj with both ends in keep, as index pairs."""
    return [tuple(e.vertices) for e in obj.data.edges if e.vertices[0] in keep and e.vertices[1] in keep]


# ---- making a mesh object -------------------------------------------------------------------------------------

def mesh_object(name, verts, faces, colours, weights, rig, parts=None, inner=()):
    """A skinned mesh: verts [Vector], faces [[i]], colours [rgb] per face, weights [{bone: w}] per vertex, and
    parts [int] per face (the robe: 0 its body, 1 the left sleeve, 2 the right), kept as the face attribute "part"."""
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    obj = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(obj)
    groups = {}
    for i, w in enumerate(weights):
        for b, x in w.items():
            if b not in groups:
                groups[b] = obj.vertex_groups.new(name=b)
            groups[b].add([i], x, "REPLACE")
    # inner: vertices on an open edge that is not an opening (the sleeve's top, tucked inside the robe's body)
    ia = me.attributes.new("inner", "INT", "POINT")
    flags = [0] * len(verts)
    for i in inner:
        flags[i] = 1
    ia.data.foreach_set("value", flags)
    pa = me.attributes.new("part", "INT", "FACE")
    pa.data.foreach_set("value", parts or [0] * len(faces))
    col = me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    for p in me.polygons:
        for li in p.loop_indices:
            col.data[li].color = (*colours[p.index], 1.0)
        p.use_smooth = True
    obj.parent = rig
    m = obj.modifiers.new("Rig", "ARMATURE")
    m.object = rig
    return obj


def outward(obj, centre_of=None):
    """Turn each connected piece's faces so their normals point away from the wearer: away from centre_of(face
    centre) when given, else from the piece's own middle."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    seen = set()
    for f0 in bm.faces:
        if f0.index in seen:
            continue
        island, todo = [], [f0]
        seen.add(f0.index)
        while todo:
            f = todo.pop()
            island.append(f)
            for e in f.edges:
                for g in e.link_faces:
                    if g.index not in seen:
                        seen.add(g.index)
                        todo.append(g)
        mid = sum((v.co for f in island for v in f.verts), Vector()) / sum(len(f.verts) for f in island)
        s = sum(f.normal.dot(f.calc_center_median() - (centre_of(f.calc_center_median()) if centre_of else mid))
                for f in island)
        if s < 0:
            bmesh.ops.reverse_faces(bm, faces=island)
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


def material(obj, name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.85
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    mat.use_backface_culling = False
    obj.data.materials.append(mat)


# ---- the robe: cut flat, sewn, and draped on the body by Blender's cloth solver --------------------------------
#
# Round 3 (Wendell, 2026-10-14: "We're making it look like something instead of simulating what happens"): the robe
# is no longer shaped round the body by rule. It is cut as two flat panels (front and back, a body and two sleeves
# each), sewn at the shoulders, along the sleeves and down the sides to the slits, and let fall on the standing body
# under gravity. The cloth's rest lengths and its flat bend come from the flat pattern (Blender's rest shape key), so
# where it lies flat, folds or bunches is the solver's answer. A belt at the sash's height is simulated too: that
# band of cloth shrinks until it grips the waist. Choices, for his eye: the pattern's sizes below, and the cloth's
# stiffness (the solver's settings in drape()).

CLOTH_H = 0.022                                  # metres between the pattern's points while draping
ROBE_VERTS = 1150                                # the draped robe is reduced to about this many points for the phone
EASE = 0.05                                      # metres added to the chest's half width for the body panel
HEM_CUT = 0.05                                   # the pattern's hem: the belt takes up about 0.1 m, so it hangs near HEM
FLARE = 0.07                                     # metres the panel widens from the waist to the hem (a slight A-line)
NECK_HALF = 0.085                                # half the neck opening across the shoulders
SCOOP = {-1: 0.07, 1: 0.015}                     # metres the neckline drops at the middle: front, back
CUFF_W = 0.40                                    # the sleeve's depth at the cuff, top seam to bottom seam (a wide sleeve)
CLEAR = 0.006                                    # metres the cloth is held off the body while it falls (room for the
                                                 # reduction and the skinning to cut corners)
ARM_OUT = math.radians(5)                        # the arms a little out from rest while the seams close
BELT = 0.35                                      # how much the belt band shrinks to grip the waist
F_SEW, F_DOWN, F_END = 50, 80, 110               # frames: sewing pose held, arms back to rest, settled


def pattern(fig, build, shoulder):
    """One panel's flat pattern, in (x, z): the body, A-line below the waist, its top edge the body's own shoulder
    line (shoulder(x), measured) plus the cloth, and a sleeve on each side cut on the grain (its columns upright)
    from the body's side above the armpit out to the wrist, deepening toward the cuff. Returns the points, the faces,
    each face's part (0 body, 1 left sleeve, 2 right), the seam points (shared by front and back), and how far up the
    shoulder rows each point is (for the neckline)."""
    rest = [fig.matrix_world @ v.co for v in fig.data.vertices]
    W = bone_weights(fig)
    chest = max(abs(c.x) for c, w in zip(rest, W) if main_bone(w) in ("spine", "hips") and 1.05 < c.z < 1.30)
    J = C.joints(build)
    sh, el, wr = (Vector(J[b + "L"][0]) for b in ("shoulder", "elbow", "wrist"))
    za = sh.z - 0.13                                     # the armpit
    wb = max(chest, sh.x) + EASE
    rn = NECK_HALF
    ztop = lambda x: shoulder(max(abs(x), rn)) + 0.012
    flare = lambda z: FLARE * smooth(1.0, HEM_CUT, z)
    nb = max(8, round(2 * wb / CLOTH_H))
    nlow = max(4, round((za - HEM_CUT) / CLOTH_H))
    nup = max(3, round((ztop(wb) - za) / CLOTH_H))
    verts, idx, upper, faces, parts, seams = [], {}, [], [], [], set()
    for k in range(nlow + nup + 1):
        for i in range(nb + 1):
            u = -1 + 2 * i / nb
            if k <= nlow:
                z = HEM_CUT + (za - HEM_CUT) * k / nlow
                x = u * (wb + flare(z))
            else:
                x = u * wb
                z = za + (ztop(x) - za) * (k - nlow) / nup
            idx[("b", i, k)] = len(verts)
            verts.append((x, z))
            upper.append(max(0.0, (k - nlow) / nup))
    for k in range(nlow + nup):
        for i in range(nb):
            faces.append([idx[("b", i, k)], idx[("b", i + 1, k)], idx[("b", i + 1, k + 1)], idx[("b", i, k + 1)]])
            parts.append(0)
    for k in range(nlow + 1):                            # the side seams, from the armpit down to the slits
        if verts[idx[("b", 0, k)]][1] >= SLIT:
            seams |= {idx[("b", 0, k)], idx[("b", nb, k)]}
    for i in range(nb + 1):                              # the shoulder seams, from the neck out
        if abs(verts[idx[("b", i, nlow + nup)]][0]) > rn - 1e-6:
            seams.add(idx[("b", i, nlow + nup)])
    arm_len = (wr - sh).length
    ns = max(6, round(arm_len / CLOTH_H))
    below = math.pi / 2 - (abs(math.atan2(sh.x - el.x, sh.z - el.z)) + ARM_OUT)   # the sewing pose's arm
    for s, side in ((1, "L"), (-1, "R")):
        icol = nb if s > 0 else 0
        top = Vector(verts[idx[("b", icol, nlow + nup)]])
        pit = Vector(verts[idx[("b", icol, nlow)]])
        top_end = top + Vector((s * math.cos(below), -math.sin(below))) * arm_len
        w0 = top.y - pit.y
        for j in range(1, ns + 1):
            t = j / ns
            T = top.lerp(top_end, t)
            w = w0 + (CUFF_W - w0) * smooth(0.0, 0.9, t)
            for m in range(nup + 1):
                idx[(side, j, m)] = len(verts)
                verts.append((T.x, T.y - w * (nup - m) / nup))
                upper.append(0.0)
        q = lambda jj, mm: idx[("b", icol, nlow + mm)] if jj == 0 else idx[(side, jj, mm)]
        for j in range(ns):
            for m in range(nup):
                f = [q(j, m), q(j + 1, m), q(j + 1, m + 1), q(j, m + 1)]
                faces.append(f if s > 0 else f[::-1])
                parts.append(1 if s > 0 else 2)
        for j in range(1, ns):                           # the sleeve's top and bottom seams; the cuff stays open
            seams |= {idx[(side, j, 0)], idx[(side, j, nup)]}
    return verts, faces, parts, seams, upper


def arms_out(rig, ang):
    """Pose quaternions turning each upper arm out from rest by ang, about the figure's front-to-back axis."""
    out = {}
    for side, s in (("L", -1), ("R", 1)):
        B = rig.data.bones["shoulder" + side].matrix_local.to_3x3()
        out["shoulder" + side] = (B.inverted() @ Matrix.Rotation(s * ang, 3, "Y") @ B).to_quaternion()
    return out


def drape(fig, rig, build):
    """Sew the panels round the body in the sewing pose and let the cloth fall. Returns the settled points, the
    faces and each face's part. The rig's walk is set aside while the cloth falls and put back after."""
    sc = bpy.context.scene
    walk = rig.animation_data.action
    rig.animation_data.action = bpy.data.actions.new("Drape")
    q = arms_out(rig, ARM_OUT)
    for pb in rig.pose.bones:
        pb.rotation_mode, pb.rotation_quaternion = "QUATERNION", (1, 0, 0, 0)
    for f, on in ((1, 1), (F_SEW, 1), (F_DOWN, 0), (F_END, 0)):
        for b, qq in q.items():
            rig.pose.bones[b].rotation_quaternion = qq if on else (1, 0, 0, 0)
            rig.pose.bones[b].keyframe_insert("rotation_quaternion", frame=f)
    body = posed(fig, 1)
    W = bone_weights(fig)
    polys = [list(p.vertices) for p in fig.data.polygons]
    tree = BVHTree.FromPolygons(body, polys)
    top_tree = BVHTree.FromPolygons(body, [p for p in polys if all(main_bone(W[v]) not in ("head", "neck") for v in p)])

    def shoulder(x):                                     # the top of the body at x (not the head or neck)
        hits = [top_tree.ray_cast(Vector((x, y, 2.0)), Vector((0, 0, -1)))[0] for y in (-0.04, -0.02, 0, 0.02, 0.04)]
        return max([h.z for h in hits if h is not None] or [1.40])

    def depth(x, z, s):                                  # how far the body reaches toward the front (s -1) or back
        hit = tree.ray_cast(Vector((x, s * 1.0, z)), Vector((0, -s, 0)))[0]
        return abs(hit.y) if hit is not None and hit.y * s > -0.05 else 0.0
    verts2, faces2, parts, seams, upper = pattern(fig, build, shoulder)
    # the two panels: a seam point is one point shared by both. Each starts wrapped round the body in front (or
    # behind) it, clear of it; its rest shape is the flat pattern, the front a hair in front of the back
    verts, flat, back = [], [], {}
    for side in (-1, 1):
        for i, (x, z) in enumerate(verts2):
            if side == 1 and i in seams:
                continue
            if i not in seams and abs(x) < NECK_HALF and upper[i] > 0:   # the neckline, scooped
                z -= SCOOP[side] * (1 - (x / NECK_HALF) ** 2) * upper[i]
            if side == 1:
                back[i] = len(verts)
            verts.append(Vector((x, 0.0 if i in seams else side * (max(depth(x, z, side), 0.03) + 0.015), z)))
            flat.append(Vector((x, 0.0 if i in seams else side * 0.002, z)))
    bk = lambda i: i if i in seams else back[i]
    faces = [list(f) for f in faces2] + [[bk(i) for i in reversed(f)] for f in faces2]
    me = bpy.data.meshes.new("robe-cloth")
    me.from_pydata([tuple(v) for v in verts], [], faces)
    cl = bpy.data.objects.new("robe-cloth", me)
    sc.collection.objects.link(cl)
    cl.shape_key_add(name="Basis")
    rest_key = cl.shape_key_add(name="Flat")
    for v, p in zip(rest_key.data, flat):
        v.co = p
    rest_key.value = 0.0
    belt = cl.vertex_groups.new(name="belt")             # the sash's band of cloth, which shrinks to grip the waist
    for i, p in enumerate(flat):
        w = min(1.0, 1.5 * max(0.0, 1 - abs(p.z - 1.03) / 0.06))
        if w > 0:
            belt.add([i], w, "REPLACE")
    # a seam has no crease of its own (the flat pattern folds the front onto the back there): no bending stiffness
    # near a seam, so it lies as the cloth either side of it falls
    sk = KDTree(len(seams))
    for i in seams:
        sk.insert(Vector((verts2[i][0], 0, verts2[i][1])), i)
    sk.balance()
    bend = cl.vertex_groups.new(name="bend")
    for i, p in enumerate(flat):
        bend.add([i], smooth(0.0, 2.5 * CLOTH_H, sk.find(Vector((p.x, 0, p.z)))[2]), "REPLACE")
    collide = fig.modifiers.new("Collide", "COLLISION")
    fig.collision.thickness_outer, fig.collision.cloth_friction = CLEAR, 5
    mod = cl.modifiers.new("Cloth", "CLOTH")
    s = mod.settings
    s.rest_shape_key = rest_key
    s.shrink_min, s.shrink_max, s.vertex_group_shrink = 0.0, BELT, "belt"   # shrink = min + (max - min) * weight
    s.quality, s.mass, s.air_damping = 10, 0.25, 1.5
    s.tension_stiffness, s.compression_stiffness, s.shear_stiffness = 20, 3, 10
    s.bending_stiffness, s.bending_stiffness_max, s.vertex_group_bending = 0.0, 0.05, "bend"
    cs = mod.collision_settings
    cs.collision_quality, cs.distance_min = 5, CLEAR
    cs.use_self_collision, cs.self_distance_min = True, 0.004
    mod.point_cache.frame_start, mod.point_cache.frame_end = 1, F_END
    sc.frame_start, sc.frame_end = 1, F_END
    for f in range(1, F_END + 1):
        sc.frame_set(f)
    ev = cl.evaluated_get(bpy.context.evaluated_depsgraph_get())
    co = [cl.matrix_world @ v.co for v in ev.data.vertices]
    fig.modifiers.remove(collide)
    bpy.data.objects.remove(cl)
    rig.animation_data.action = walk
    for pb in rig.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
    sc.frame_start, sc.frame_end = 1, C.KEYS + 1
    sc.frame_set(1)
    return co, faces, parts + parts


def reduce(co, faces, parts, target):
    """The draped cloth, smoothed a little (the solver's last few millimetres of chatter) and reduced to about target
    points. Each face keeps the part of the full cloth's face nearest it."""
    me = bpy.data.meshes.new("tmp")
    me.from_pydata([tuple(v) for v in co], [], faces)
    obj = bpy.data.objects.new("tmp", me)
    bpy.context.scene.collection.objects.link(obj)
    bm = bmesh.new()
    bm.from_mesh(me)
    for _ in range(2):
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.to_mesh(me)
    bm.free()
    full = BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [list(p.vertices) for p in me.polygons])
    dec = obj.modifiers.new("Dec", "DECIMATE")
    dec.ratio = min(1.0, target / len(me.vertices))
    out = bpy.data.meshes.new_from_object(obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    V = [v.co.copy() for v in out.vertices]
    F = [list(p.vertices) for p in out.polygons]
    P = [parts[full.find_nearest(p.center)[2]] for p in out.polygons]
    bpy.data.objects.remove(obj)
    bpy.data.meshes.remove(me)
    bpy.data.meshes.remove(out)
    return V, F, P


def robe(fig, rig, build, cw):
    """The draped robe, reduced, weighted from the body under it, its trim painted: the crossed collar (J4's line,
    left over right), a band round the neckline, the hem and the cuffs."""
    co, faces, parts = drape(fig, rig, build)
    verts, faces, parts = reduce(co, faces, parts, ROBE_VERTS)
    W = bone_weights(fig)
    from_body = weight_source(fig, lambda c, w: main_bone(w) in ("hips", "spine", "neck", "hipL", "hipR",
                                                                  "shoulderL", "shoulderR"))
    from_arm = {s: weight_source(fig, lambda c, w, s=s: main_bone(w) in ("spine", "shoulder" + s, "elbow" + s, "wrist" + s))
                for s in "LR"}
    sleeve_of = {}
    for f, p in zip(faces, parts):
        for v in f:
            sleeve_of.setdefault(v, set()).add(p)
    weights = []
    for i, p in enumerate(verts):
        ps = sleeve_of.get(i, {0})
        if 0 in ps:
            weights.append(skirt_weights(p, from_body(p)))
        else:
            weights.append(from_arm["L" if 1 in ps else "R"](p))
    obj = mesh_object("robe", verts, faces, [cw["robe"]] * len(faces), weights, rig, parts)
    # the trim: bands along the neckline, the hem and the cuffs, each cut on an exact line its width in from the edge
    co = [v.co.copy() for v in obj.data.vertices]
    edges = openings(obj)
    bands = []
    for a, b in edges:
        A, B = co[a], co[b]
        if A.z > 1.25 and B.z > 1.25 and abs(A.x) < 0.15:
            w = 0.022                                    # the neckline
        elif A.z < 0.3 and B.z < 0.3:
            w = 0.04                                     # the hem
        elif min(A.z, B.z) > 0.7 and max(abs(A.x), abs(B.x)) > 0.2:
            w = 0.035                                    # a cuff
        else:
            continue                                     # a slit: no band
        n = max(1, int((A - B).length / 0.004))
        bands += [(A.lerp(B, t / n), w) for t in range(n + 1)]
    kd = KDTree(len(bands))
    for n, (c, _) in enumerate(bands):
        kd.insert(c, n)
    kd.balance()

    def trim(c):
        found = kd.find_n(c, 8)
        return min((d - bands[n][1] for _, n, d in found), default=1.0)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    collar = C.collar_path(bm, build)
    C.cut_along(bm, lambda c: collar(c) - C.COLLAR * 1.15)
    C.cut_along(bm, trim)
    bm.to_mesh(obj.data)
    bm.free()
    me = obj.data
    col = me.color_attributes["Col"]
    for p in me.polygons:
        c = p.center
        if (c.z > 1.0 and collar(c) < C.COLLAR * 1.15) or trim(c) < 0:
            for li in p.loop_indices:
                col.data[li].color = (*cw["edge"], 1.0)
    outward(obj)
    return obj


def skirt_weights(p, body):
    """Below the hips the robe hangs from the hips, its front panel on hemF, its back panel on hemB and its sides on
    their own thigh, more so toward the hem; above them it takes the body's weights (blended between)."""
    t = smooth(1.02, 0.55, p.z)
    if t <= 0:
        return body
    th = math.atan2(p.y, p.x)
    front, back = max(0.0, -math.sin(th)) ** 1.5, max(0.0, math.sin(th)) ** 1.5
    sideways = abs(math.cos(th)) ** 2
    thigh = "hipL" if p.x > 0 else "hipR"
    hang = {"hemF": 0.9 * front, "hemB": 0.9 * back, thigh: 0.55 * sideways}
    hang["hips"] = max(0.05, 1.0 - sum(hang.values()))
    out = {}
    for b, x in body.items():
        out[b] = out.get(b, 0.0) + (1 - t) * x
    for b, x in hang.items():
        out[b] = out.get(b, 0.0) + t * x
    return norm(out)


# ---- the sash -------------------------------------------------------------------------------------------------

SASH_Z = (0.985, 0.995, 1.030, 1.065, 1.075)


def sash(under, rig, cw, name):
    """A band round the waist over `under` (the figure or the robe), knotted in front on the wearer's left, with two
    tails falling over the front. Weights from the layer beneath."""
    rest = [under.matrix_world @ v.co for v in under.data.vertices]
    W = bone_weights(under)
    if under.name.startswith("robe"):
        keep = sorted(body_part_verts(under))              # the robe's body, not its sleeves
    else:
        keep = [i for i, w in enumerate(W) if main_bone(w) in ("hips", "spine", "hipL", "hipR")]
    sedges = edges_of(under, set(keep))
    src = weight_source(under, lambda co, w: True, set(keep))
    tree = BVHTree.FromPolygons(rest, [list(p.vertices) for p in under.data.polygons])
    verts, weights, faces, colours, rows = [], [], [], [], []
    N = 32
    for n, z in enumerate(SASH_Z):
        poly = section(rest, z, 0.0, sedges)
        lip = 0.003 if n in (0, len(SASH_Z) - 1) else 0.008   # the edges roll in to the cloth beneath
        row = []
        for j in range(N):
            th = 2 * math.pi * j / N
            r = hull_radius(poly, 0.0, 0.0, th) + lip
            p = Vector((r * math.cos(th), r * math.sin(th), z))
            row.append(len(verts))
            verts.append(p)
            weights.append(src(p))
        rows.append(row)
    for n in range(len(SASH_Z) - 1):
        for j in range(N):
            k = (j + 1) % N
            faces.append([rows[n][j], rows[n][k], rows[n + 1][k], rows[n + 1][j]])
            colours.append(cw["sash"])
    nband = len(faces)

    def front_of(x, z, out):
        hit = tree.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))[0]
        y = hit.y if hit else -0.15
        return Vector((x, y - out, z))
    # the knot: a flattened lump on the band
    kc = front_of(0.06, 1.03, 0.012)
    k0 = len(verts)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=1.0,
                              matrix=Matrix.Translation(kc) @ Matrix.Diagonal((0.034, 0.016, 0.03, 1)))
    for v in bm.verts:
        verts.append(v.co.copy())
        weights.append(src(v.co))
    for f in bm.faces:
        faces.append([k0 + v.index for v in f.verts])
        colours.append(cw["knot"])
    bm.free()
    # two tails hanging from the knot, lying on the cloth beneath at 1 cm off it
    for x0, end, width in ((0.045, 0.80, 0.042), (0.085, 0.84, 0.038)):
        t0 = len(verts)
        zs = [1.01 - (1.01 - end) * k / 6 for k in range(7)]
        for k, z in enumerate(zs):
            x = x0 + 0.01 * k / 6
            for dx in (-width / 2, width / 2):
                p = front_of(x + dx, z, 0.012 + 0.002 * k)
                verts.append(p)
                weights.append(src(p))
        for k in range(6):
            a = t0 + 2 * k
            faces.append([a, a + 1, a + 3, a + 2])
            colours.append(cw["knot"] if k == 5 else cw["sash"])
    # the band is part 0, the knot and tails part 3: the test holds the body to the band (a body point always lies
    # outside the knot's back, which faces the body)
    obj = mesh_object(name, verts, faces, colours, weights, rig, [0] * nband + [3] * (len(faces) - nband))
    outward(obj, lambda c: Vector((0, 0, c.z)))
    return obj


# ---- the topknot ----------------------------------------------------------------------------------------------

HEAD_C, HEAD_R = Vector((0, 0.0, 1.615)), Vector((0.112, 0.118, 0.13))   # character.body_parts' head


def hairline(lon):
    """Height of the hairline at longitude lon (0 at the left side, -pi/2 the face, +pi/2 the back of the head)."""
    s = math.sin(lon)                                  # -1 at the face, +1 at the back
    return 1.672 - 0.035 * (1 + s) - 0.04 * max(0.0, s) ** 2


def topknot(fig, rig, cw):
    """A cap of hair over the crown and the back of the head, 5 mm off it, a bun on top, its tie and a pin."""
    verts, faces, colours = [], [], []
    rest = [fig.matrix_world @ v.co for v in fig.data.vertices]
    W = bone_weights(fig)
    head = [c for c, w in zip(rest, W) if main_bone(w) == "head"]
    tree = BVHTree.FromPolygons(rest, [list(p.vertices) for p in fig.data.polygons])
    LON, LAT = 24, 9
    top = len(verts)
    verts.append(Vector((0, 0.004, HEAD_C.z + HEAD_R.z + 0.006)))
    rings = []
    for i in range(1, LAT + 1):
        ring = []
        for j in range(LON):
            lon = 2 * math.pi * j / LON
            dz = hairline(lon) - HEAD_C.z
            phi_max = math.acos(max(-0.95, min(0.95, dz / HEAD_R.z)))
            phi = phi_max * i / LAT
            d = Vector((HEAD_R.x * math.sin(phi) * math.cos(lon), HEAD_R.y * math.sin(phi) * math.sin(lon),
                        HEAD_R.z * math.cos(phi)))
            # lay the point on the head itself, 5 mm out (the fused surface is smoother than the ellipsoid)
            o = HEAD_C + d * 1.6
            hit = tree.ray_cast(o, (HEAD_C - o).normalized())[0]
            p = (hit + d.normalized() * 0.005) if hit else HEAD_C + d * 1.04
            ring.append(len(verts))
            verts.append(p)
        rings.append(ring)
    for j in range(LON):
        k = (j + 1) % LON
        faces.append([top, rings[0][k], rings[0][j]])
        colours.append(cw["hair"])
    for i in range(LAT - 1):
        for j in range(LON):
            k = (j + 1) % LON
            faces.append([rings[i][j], rings[i][k], rings[i + 1][k], rings[i + 1][j]])
            colours.append(cw["hair"])
    ncap = len(faces)
    # the bun, its tie and the pin, built as small closed parts
    crown = HEAD_C + Vector((0, 0.01, HEAD_R.z + 0.005))
    for kind, mat, colour in (
            ("sphere", Matrix.Translation(crown + Vector((0, 0, 0.034))) @ Matrix.Diagonal((0.042, 0.04, 0.034, 1)), "hair"),
            ("ring", Matrix.Translation(crown + Vector((0, 0, 0.006))) @ Matrix.Diagonal((0.034, 0.032, 0.012, 1)), "tie"),
            ("pin", Matrix.Translation(crown + Vector((0, 0, 0.038))) @ Matrix.Rotation(math.pi / 2, 4, "Y") @
             Matrix.Diagonal((0.0045, 0.0045, 0.15, 1)), "pin")):
        bm = bmesh.new()
        if kind == "sphere":
            bmesh.ops.create_uvsphere(bm, u_segments=14, v_segments=8, radius=1.0, matrix=mat)
        else:
            bmesh.ops.create_cone(bm, cap_ends=True, segments=14 if kind == "ring" else 6, radius1=1.0, radius2=1.0,
                                  depth=1.0, matrix=mat)
        base = len(verts)
        for v in bm.verts:
            verts.append(v.co.copy())
        for f in bm.faces:
            faces.append([base + v.index for v in f.verts])
            colours.append(cw[colour])
        bm.free()
    weights = [{"head": 1.0}] * len(verts)
    obj = mesh_object("topknot", verts, faces, colours, weights, rig, [0] * ncap + [3] * (len(faces) - ncap))
    outward(obj)
    del head
    return obj


# ---- the test: body points through the garment, at every key of the walk -------------------------------------

def openings(obj):
    """The open edges (hem, slits, cuffs, neck) as vertex pairs; not the sleeve's top, which is inside the robe."""
    me = obj.data
    inner = [d.value for d in me.attributes["inner"].data]
    count = {}
    for p in me.polygons:
        for e in p.edge_keys:
            count[e] = count.get(e, 0) + 1
    return [e for e, n in count.items() if n == 1 and not (inner[e[0]] and inner[e[1]])]


def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (p - (a + ab * t)).length


def through(wearer, cover, garment, keys, parts_of=None, ray_from=None):
    """For each key: the covered points of `wearer` outside `garment`'s surface and not at an opening. A point is a
    vertex index, or a tuple of indices for the middle of a face (a body face can bulge through between vertices).
    parts_of(i): the garment parts (face attribute "part") that may hold point i, its own first; a point held by any
    of them is covered (an arm inside its sleeve, or tucked inside the robe's body at the shoulder).
    ray_from(p): where to look out from for point p, or None. A point held only by its own part (the robe's body,
    a sash's band) also counts as through when the line from there out through it meets no cloth: the nearest-face
    test alone can be fooled where cloth folds.
    Returns ([count per key], {garment vertex: push needed})."""
    me = garment.data
    polys = [list(p.vertices) for p in me.polygons]
    part = [d.value for d in me.attributes["part"].data]
    edges = openings(garment)
    groups = {}
    for i in cover:
        groups.setdefault(tuple(parts_of(i if isinstance(i, int) else i[0])) if parts_of else (None,), []).append(i)
    counts, push = [], {}
    LAST_THROUGH.clear()
    rest = [wearer.matrix_world @ v.co for v in wearer.data.vertices]
    for k in keys:
        wc = posed(wearer, 1 + k)
        gc = posed(garment, 1 + k)
        trees = {}

        def tree(pid):
            if pid not in trees:
                sel = [f for f in range(len(polys)) if pid is None or part[f] == pid]
                trees[pid] = (BVHTree.FromPolygons(gc, [polys[f] for f in sel]), sel)
            return trees[pid]
        n = 0
        for pids, idx in groups.items():
            for i in idx:
                p = wc[i] if isinstance(i, int) else sum((wc[v] for v in i), Vector()) / len(i)
                first, held = None, False
                for pid in pids:
                    t, sel = tree(pid)
                    loc, nor, fi, _ = t.find_nearest(p)
                    if loc is None:
                        continue
                    d = (p - loc).dot(nor)
                    if d <= TOL or any(seg_dist(loc, gc[a], gc[b]) < EDGE for a, b in edges):
                        held = True                        # inside, or a leg or a hand out through an opening
                        break
                    if first is None:
                        first = (d, polys[sel[fi]])
                if held and ray_from and len(pids) == 1:
                    o = ray_from(p)
                    if o is not None:
                        d = Vector((p.x - o.x, p.y - o.y, 0))
                        t, sel = tree(pids[0])
                        if d.length > 1e-6 and t.ray_cast(p, d.normalized(), 0.6)[0] is None:
                            loc, nor, fi, _ = t.find_nearest(p)
                            held, first = False, (max(0.0, (p - loc).dot(nor)), polys[sel[fi]])
                if held or first is None:
                    continue
                LAST_THROUGH.append((k, i, first[0]))
                n += 1
                d, vs = first
                rest_p = rest[i] if isinstance(i, int) else sum((rest[v] for v in i), Vector()) / len(i)
                for v in vs:
                    if d + 0.008 > push.get(v, (0.0, None))[0]:
                        push[v] = (d + 0.008, rest_p)
        counts.append(n)
    return counts, push


def fit(wearer, cover, garment, keys, rounds=14, parts=None, ray_from=None):
    """root-game's fullness, found by walking: push the cloth out (in its standing shape, along its normals) wherever
    a covered point came through at any key, and again, until none does. A round that leaves more points through than
    the best so far is undone and the next pushes are halved. Returns the rounds' counts."""
    me = garment.data
    log, best, scale = [], None, 1.0
    for _ in range(rounds):
        counts, push = through(wearer, cover, garment, keys, parts, ray_from)
        total = sum(counts)
        log.append(total)
        if best is not None and total > best[0]:
            for v, co in zip(me.vertices, best[1]):          # worse than before: back to the best, smaller steps
                v.co = co
            me.update()
            scale *= 0.5
            counts, push = through(wearer, cover, garment, keys, parts, ray_from)
            total = sum(counts)
        if best is None or total <= best[0]:
            best = (total, [v.co.copy() for v in me.vertices])
        if not push:
            break
        me.update()
        spread = dict(push)
        for p in me.polygons:                              # spread each push to the face's neighbours, at half
            vs = list(p.vertices)
            m = max((push[v] for v in vs if v in push), key=lambda dp: dp[0], default=None)
            if m:
                for v in vs:
                    if v not in spread or spread[v][0] < 0.5 * m[0]:
                        spread[v] = (0.5 * m[0], m[1])
        for v, (d, bp) in spread.items():
            # out along the cloth's normal, turned to point away from the body point that came through (a draped
            # cloth folds, and a fold's normal can face the body)
            n = me.vertices[v].normal.copy()
            if n.dot(me.vertices[v].co - bp) < 0:
                n = -n
            me.vertices[v].co += n * min(d, MAX_PUSH) * scale
        me.update()
    return log


def cover_robe(fig, robe_obj, build):
    """The body points the robe covers standing: the arms and the trunk down to just above its hem, less the neck
    and the chest above the robe's neckline (the tunic's collar shows there, as it should)."""
    W = bone_weights(fig)
    rc = [v.co for v in robe_obj.data.vertices]
    edges = openings(robe_obj)
    rim = {v for e in edges for v in e}
    neckline = [rc[v] for v in rim if rc[v].z > 1.25 and abs(rc[v].x) < 0.16]
    hem = max(rc[v].z for v in rim if rc[v].z < 0.3)
    # where the body faces itself a few centimetres away (the armpit, between the thighs), the cloth caught between
    # is pressed through one side or the other; nobody sees there, so it is not tested
    body = [v.co for v in fig.data.vertices]
    normals = [v.normal for v in fig.data.vertices]
    kd = KDTree(len(body))
    for i, c in enumerate(body):
        kd.insert(c, i)
    kd.balance()

    J = C.joints(build)
    shx, shz = J["shoulderL"][0][0], J["shoulderL"][0][2]

    def armpit(i, c, b):
        # under the arm: between the side of the trunk and the inside of the upper arm, below the shoulder's joint
        if 0.11 < abs(c.x) < shx + 0.03 and shz - 0.30 < c.z < shz - 0.01:
            if b == "spine" or (b in ARMS and abs(c.x) < shx + 0.03 - 0.03 * (shz - c.z) / 0.3):
                return True
        for _, j, d in kd.find_range(c, 0.045):
            if d > 0.008 and (body[j] - c).normalized().dot(normals[i]) > 0.4 and normals[j].dot(normals[i]) < -0.2:
                return True
        return False
    out = []
    for i, v in enumerate(fig.data.vertices):
        b, c = main_bone(W[i]), v.co
        if armpit(i, c, b):
            continue
        if c.z > 1.28 and abs(c.x) < 0.16 and b not in ARMS:
            near = [n.z for n in neckline if abs(n.x - c.x) < 0.03 and n.y * c.y >= 0]
            if not near or c.z > min(near) - 0.015:
                continue
        if b in ARMS or (b in ("hips", "spine", "hipL", "hipR", "kneeL", "kneeR") and hem + 0.03 < c.z < 1.50):
            out.append(i)
    return out


def with_faces(obj, cover):
    """The covered vertices and the middles of every face whose corners are all covered."""
    cs = set(cover)
    return list(cover) + [tuple(p.vertices) for p in obj.data.polygons if all(v in cs for v in p.vertices)]


def body_part_verts(obj):
    """Vertices on faces of part 0 (for the robe, its body without the sleeves)."""
    part = obj.data.attributes["part"].data
    return {v for p in obj.data.polygons if part[p.index].value == 0 for v in p.vertices}


def cover_band(obj, lo, hi):
    """Points of obj between heights lo and hi (the robe's body only, when obj is the robe)."""
    W = bone_weights(obj)
    keep = body_part_verts(obj) if "part" in obj.data.attributes and obj.name.startswith("robe") else None
    return [i for i, v in enumerate(obj.data.vertices) if (keep is None or i in keep) and lo < v.co.z < hi
            and main_bone(W[i]) not in ARMS + ("wristL", "wristR")]


def cover_head(fig):
    W = bone_weights(fig)
    out = []
    for i, v in enumerate(fig.data.vertices):
        if main_bone(W[i]) != "head":
            continue
        d = v.co - HEAD_C
        lon = math.atan2(d.y / HEAD_R.y, d.x / HEAD_R.x)
        if v.co.z > hairline(lon) + 0.01:
            out.append(i)
    return out


# ---- export and sheet -----------------------------------------------------------------------------------------

def export_garment(obj, rig, path):
    sol = obj.modifiers.new("Thick", "SOLIDIFY")
    sol.thickness, sol.offset, sol.use_rim = THICK, 1.0, True
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = obj
    obj.modifiers.move(obj.modifiers.find("Thick"), 0)      # thicken first, then the armature
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=True, export_yup=True,
                              export_normals=True, export_texcoords=False, export_skins=True,
                              export_animations=False, export_vertex_color="ACTIVE", export_all_vertex_colors=False,
                              export_apply=False)
    obj.modifiers.remove(obj.modifiers["Thick"])
    return os.path.getsize(path)


def build_all(build, palette, out_dir, do_fit=True):
    keys = list(range(C.KEYS + 1))
    fig, rig = C.make(build, palette)
    fig_row = C.export(fig, rig, build, palette, out_dir)
    cw = COLOURWAYS[palette]
    rows = []
    R = robe(fig, rig, build, cw)
    W = bone_weights(fig)

    def parts(i):                                          # an arm point by its own sleeve (or the robe's body), the rest by the body
        b = main_bone(W[i])
        return ((1 if b.endswith("L") else 2), 0) if b in ARMS else (0,)
    cover = with_faces(fig, cover_robe(fig, R, build))
    # above the slits (wherever the belt has drawn them up to), nothing opens
    rc = [v.co for v in R.data.vertices]
    slit_top = max(rc[v].z for e in openings(R) for v in e if 0.25 < rc[v].z < 1.0 and abs(rc[v].x) > 0.12)
    # and not where the arms come out (a line from the middle out under the arm leaves through the armhole)
    axis = lambda p: Vector((0, 0, p.z)) if p.z > slit_top + 0.03 and not (p.z > 1.1 and abs(p.x) > 0.11) else None
    log = fit(fig, cover, R, keys, parts=parts, ray_from=axis) if do_fit else []
    counts, _ = through(fig, cover, R, keys, parts, axis)
    rows.append(("robe", R, counts, log, len(cover)))
    S = sash(fig, rig, cw, "sash")
    cover_s = with_faces(fig, cover_band(fig, SASH_Z[0] + 0.01, SASH_Z[-1] - 0.01))
    band = lambda i: (0,)                                   # held by the band or the cap, not the decoration
    waist = lambda p: Vector((0, 0, p.z))
    log = fit(fig, cover_s, S, keys, parts=band, ray_from=waist) if do_fit else []
    counts, _ = through(fig, cover_s, S, keys, band, waist)
    rows.append(("sash", S, counts, log, len(cover_s)))
    SR = sash(R, rig, cw, "sash-robe")
    cover_r = with_faces(R, cover_band(R, SASH_Z[0] + 0.01, SASH_Z[-1] - 0.01))
    log = fit(R, cover_r, SR, keys, parts=band, ray_from=waist) if do_fit else []
    counts, _ = through(R, cover_r, SR, keys, band, waist)
    rows.append(("sash-robe", SR, counts, log, len(cover_r)))
    T = topknot(fig, rig, cw)
    cover_t = with_faces(fig, cover_head(fig))
    counts, _ = through(fig, cover_t, T, keys, band)
    rows.append(("topknot", T, counts, [], len(cover_t)))
    report = []
    for g, obj, counts, log, ncov in rows:
        material(obj, f"{g}-{palette}")
        name = f"{g}-{build}-{palette}"
        size = export_garment(obj, rig, os.path.join(out_dir, name + ".glb"))
        report.append({"id": name, "garment": g, "build": build, "palette": palette, "file": name + ".glb",
                       "bytes": size, "verts": len(obj.data.vertices), "tris": sum(len(p.vertices) - 2 for p in obj.data.polygons),
                       "covered": ncov, "through": counts, "worst": max(counts), "fit_rounds": log,
                       "bones": sorted(g.name for g in obj.vertex_groups)})
    return fig_row, report


def sheet(figs, rows, out_dir):
    """The contact sheet (cc-wardrobe-gate): builds down; across, each garment worn alone in each colourway, caught a
    quarter of the way through the walk from the front three-quarter. Then the whole set on each build and palette,
    and the average dusk figure in the whole set from the front, the side and the back at four points of the walk."""
    import numpy as np

    def load(path):
        before = set(bpy.context.scene.objects)
        bpy.ops.import_scene.gltf(filepath=path)
        return list(set(bpy.context.scene.objects) - before)

    def dress(fig_objs, files):
        """Put garments on a loaded figure: every garment mesh rebound to the figure's armature (the runtime swap)."""
        arm = next(o for o in fig_objs if o.type == "ARMATURE")
        for f in files:
            for o in load(os.path.join(out_dir, f)):
                if o.type == "MESH":
                    mw = o.matrix_world.copy()
                    for m in o.modifiers:
                        if m.type == "ARMATURE":
                            m.object = arm
                    o.parent = arm
                    o.matrix_world = mw
                elif o.type == "ARMATURE":
                    o.hide_render = True
                    o.hide_viewport = True
        return arm

    def setup(res, scale, frame):
        bpy.context.scene.frame_set(frame)
        bpy.context.scene.render.engine, bpy.context.scene.cycles.device, bpy.context.scene.cycles.samples = "CYCLES", "CPU", 20
        bpy.context.scene.render.resolution_x, bpy.context.scene.render.resolution_y = res
        bpy.context.scene.view_settings.view_transform = "Standard"
        bpy.context.scene.world = bpy.context.scene.world or bpy.data.worlds.new("w")
        bpy.context.scene.world.color = (0.16, 0.15, 0.17)

    def camera(scale, d, target=Vector((0, 0, 0.9))):
        cam = bpy.context.scene.camera or bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        if cam.name not in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.link(cam)
        cam.data.type, cam.data.ortho_scale = "ORTHO", scale
        cam.location = target + d.normalized() * 14
        cam.rotation_euler = (-d.normalized()).to_track_quat("-Z", "Y").to_euler()
        bpy.context.scene.camera = cam

    def lights():
        for e, rz, rx in ((3.2, 35, 50), (1.4, -140, 60), (1.2, 100, 70)):
            sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
            sun.data.energy, sun.rotation_euler = e, (math.radians(rx), 0, math.radians(rz))
            bpy.context.scene.collection.objects.link(sun)

    def clear():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        lights()

    three_q = Vector((math.sin(math.radians(-25)), -math.cos(math.radians(-25)), 0.12))
    builds, pals = list(C.BUILDS), list(C.PALETTES)
    # 1. each garment alone: rows = builds, columns = (robe, sash, topknot) x (dusk, jade, hemp)
    clear()
    cols = [(g, p) for g in ("robe", "sash", "topknot") for p in pals]
    for bi, b in enumerate(builds):
        for ci, (g, p) in enumerate(cols):
            objs = load(os.path.join(out_dir, figs[(b, p)]))
            dress(objs, [f"{g}-{b}-{p}.glb"])
            for o in objs:
                if o.parent is None:
                    o.location = ((ci - 4) * 0.9, 0, (1 - bi) * 2.05)
    setup((2000, 1500), 0, 1 + C.KEYS // 4)
    camera(8.6, three_q)
    bpy.context.scene.render.filepath = os.path.join(out_dir, "garments-sheet.png")
    bpy.ops.render.render(write_still=True)
    # 2. the whole set (robe, sash over it, topknot) on each build and palette
    clear()
    for bi, b in enumerate(builds):
        for pi, p in enumerate(pals):
            objs = load(os.path.join(out_dir, figs[(b, p)]))
            dress(objs, [f"robe-{b}-{p}.glb", f"sash-robe-{b}-{p}.glb", f"topknot-{b}-{p}.glb"])
            for o in objs:
                if o.parent is None:
                    o.location = ((pi - 1) * 0.95, 0, (1 - bi) * 2.05)
    setup((900, 1260), 0, 1 + C.KEYS // 4)
    camera(6.6, three_q)
    bpy.context.scene.render.filepath = os.path.join(out_dir, "set-sheet.png")
    bpy.ops.render.render(write_still=True)
    # 3. the average dusk figure in the set, front, side and back, at keys 0, 6, 12 and 18
    clear()
    objs = load(os.path.join(out_dir, figs[("average", "dusk")]))
    dress(objs, ["robe-average-dusk.glb", "sash-robe-average-dusk.glb", "topknot-average-dusk.glb"])
    strips = []
    for d in (Vector((0, -1, 0.05)), Vector((1, 0, 0.05)), Vector((0, 1, 0.05))):
        cells = []
        for k in (0, 6, 12, 18):
            setup((300, 600), 0, 1 + k)
            camera(2.2, d)
            bpy.context.scene.render.filepath = os.path.join(out_dir, f"_walk.png")
            bpy.ops.render.render(write_still=True)
            im = bpy.data.images.load(bpy.context.scene.render.filepath, check_existing=False)
            cells.append(np.array(im.pixels[:], np.float32).reshape(600, 300, 4))
            bpy.data.images.remove(im)
        strips.append(np.hstack(cells))
    img = bpy.data.images.new("walk", 1200, 1800)
    img.pixels.foreach_set(np.vstack(strips[::-1]).ravel())   # Blender's rows run bottom up: front strip on top
    img.filepath_raw = os.path.join(out_dir, "set-walk.png")
    img.file_format = "PNG"
    img.save()
    os.remove(os.path.join(out_dir, "_walk.png"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", default="average")
    ap.add_argument("--palette", default="dusk")
    ap.add_argument("--all", action="store_true", help="every build in every palette")
    ap.add_argument("--sheet", action="store_true", help="render the contact sheets (Cycles, CPU)")
    ap.add_argument("--sheet-only", action="store_true", help="only render the sheets from the GLBs in --out")
    ap.add_argument("--no-fit", action="store_true", help="skip the walking fit (test J5b: points come through)")
    ap.add_argument("--out", default=os.path.join(os.environ.get("W", "/tmp/blender-cloud"), "garments"))
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    os.makedirs(a.out, exist_ok=True)
    if a.sheet_only:                                       # render again from the GLBs already in --out
        with open(os.path.join(a.out, "report.json")) as f:
            rep = json.load(f)
        sheet({(r["build"], r["palette"]): r["file"] for r in rep["figures"]}, rep["garments"], a.out)
        return
    combos = [(b, p) for b in C.BUILDS for p in C.PALETTES] if a.all else [(a.build, a.palette)]
    figs, report = {}, []
    for b, p in combos:
        fr, rows = build_all(b, p, a.out, not a.no_fit)
        figs[(b, p)] = fr["file"]
        report += rows
        for r in rows:
            print(f"{r['id']}: {r['bytes'] // 1024} KB, {r['tris']} triangles, through {r['worst']} "
                  f"(fit {r['fit_rounds']})", flush=True)
    with open(os.path.join(a.out, "report.json"), "w") as f:
        json.dump({"figures": [{"build": b, "palette": p, "file": f} for (b, p), f in figs.items()], "garments": report},
                  f, indent=1)
    if a.sheet:
        sheet(figs, report, a.out)
        print("sheets:", *(os.path.join(a.out, n) for n in ("garments-sheet.png", "set-sheet.png", "set-walk.png")))


if __name__ == "__main__":
    main()
