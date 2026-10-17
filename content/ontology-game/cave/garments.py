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
  takes its weights from the body under it, the sleeves from the arm. Below the belt (PIN_Z) the robe's body is
  cloth at runtime (cloth.js; round 5, board position j5-skirt-cloth): pinned to the hips at the belt, hanging under
  gravity, carrying the figure's motion, pushed out by leg capsules, its front and back panels free below the slits.
  The GLB marks each point (_CLOTH) and carries the capsules (extras.cloth); its skin weights below the belt (with the
  pelvis, root-game's rule for hanging cloth) are only where the cloth starts. The rig's hem bones (character.HEM_BONES)
  no longer carry the robe.
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
import argparse, json, math, os, subprocess, sys

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
DRAPE_TRIES = 6                                  # processes tried at most, per build and palette, until the fit clears every point
BEND_BODY, BEND_HEM = 0.05, 0.4                  # bending stiffness of the cloth, and of a hemmed edge (the cuff)
CUFF_HEM = 0.10                                  # metres of the cuff that is hemmed
WALK_X = int(os.environ.get("WALK_X", "1"))          # the walk strip's resolution multiple (3 to look closely at a cuff)
CUFF_ROUNDS = 60                                 # smoothing rounds on the hem's open edge, before the trim is cut (25 until
                                                 # round 8; the cuffs too until round 10, when clean_cuffs() made them rings)
SKIRT_SMOOTH = 6                                 # rounds of averaging the skirt's weights with its neighbours'
FIT_MARGIN = 0.008                               # metres past the point that came through that a push aims for
FIT_RADIUS = 0.08                               # metres, how far a push spreads over the cloth (falls off smoothly)
MAX_PUSH = 0.015                                 # metres, the most one round of the fit moves a point
EDGE_SLIT = 0.045                                # metres from a slit's edge within which a leg may be out
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
PIN_Z = 0.95                                     # metres: above this the robe rides the body (the sash covers 0.985
                                                 # to 1.075); below it the robe's body is cloth (cloth.js)
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
    """World positions of obj's vertices at frame, through its armature (or the cloth's, from POSED)."""
    sc = bpy.context.scene
    sc.frame_set(frame)
    if frame in POSED.get(obj.name, {}):
        return POSED[obj.name][frame]
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
ROBE_VERTS = 1450                                # the draped robe is reduced to about this many points for the phone
EASE = 0.05                                      # metres added to the chest's half width for the body panel
HEM_CUT = 0.05                                   # the pattern's hem: the belt takes up about 0.1 m, so it hangs near HEM
FLARE = 0.07                                     # metres the panel widens from the waist to the hem (a slight A-line)
NECK_HALF = 0.085                                # half the neck opening across the shoulders
SCOOP = {-1: 0.07, 1: 0.015}                     # metres the neckline drops at the middle: front, back
SLEEVE_W = 0.40                                  # the depth the sleeve widens toward from the armpit (a wide sleeve)
CUFF_W = 0.26                                    # the sleeve's depth at the cuff, top seam to bottom seam: from the elbow
                                                 # it narrows to this (round 8; at 0.40 the end hung below the hand as a
                                                 # stiff flap)
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
    verts, idx, upper, faces, parts, seams, sleeve = [], {}, [], [], [], set(), {}
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
            w = w0 + (SLEEVE_W - w0) * smooth(0.0, 0.9, t) + (CUFF_W - SLEEVE_W) * smooth(0.5, 1.0, t)
            for m in range(nup + 1):
                idx[(side, j, m)] = len(verts)
                sleeve[len(verts)] = (side, j, m)
                verts.append((T.x, T.y - w * (nup - m) / nup))
                upper.append(0.0)
        q = lambda jj, mm: idx[("b", icol, nlow + mm)] if jj == 0 else idx[(side, jj, mm)]
        for j in range(ns):
            for m in range(nup):
                f = [q(j, m), q(j + 1, m), q(j + 1, m + 1), q(j, m + 1)]
                faces.append(f if s > 0 else f[::-1])
                parts.append(1 if s > 0 else 2)
        for j in range(1, ns + 1):                       # the sleeve's top and bottom seams, to the cuff's corners; the cuff stays open
            seams |= {idx[(side, j, 0)], idx[(side, j, nup)]}
    return verts, faces, parts, seams, upper, (sleeve, ns, nup)


def arms_out(rig, ang):
    """Pose quaternions turning each upper arm out from rest by ang, about the figure's front-to-back axis."""
    out = {}
    for side, s in (("L", -1), ("R", 1)):
        B = rig.data.bones["shoulder" + side].matrix_local.to_3x3()
        out["shoulder" + side] = (B.inverted() @ Matrix.Rotation(s * ang, 3, "Y") @ B).to_quaternion()
    return out


CUFF_LOFT = 0.10                                 # metres of the sleeve's end that are rebuilt as a clean ring (round 10)
CUFF_HARM = 2                                    # the ring's shape round the forearm: harmonics of its radius kept


def clean_cuffs(co, sleeve, bk, build):
    """Each sleeve's end as a clean ring round the forearm (round 10). The cloth crumples where the sleeve's end meets
    the hand, and the cuff's edge came out of the drape as a ragged loop with a tongue where the two panels' corners
    meet; the trim cut along it was torn cream patches (Wendell, round 7: "we do still need to fix the cuffs"). The
    edge ring keeps the drape's size and droop, but smoothly: its points are spread evenly round it, its radius round
    the forearm keeps only CUFF_HARM harmonics and its reach along the forearm only a tilt. The rings in the last
    CUFF_LOFT before it are eased toward the same shape, so the sleeve narrows into the cuff without a crease."""
    sleeve, ns, nup = sleeve
    J = C.joints(build)
    at = {(side, j, m): i for i, (side, j, m) in sleeve.items()}
    co = [c.copy() for c in co]
    for side in ("L", "R"):
        E, Wr = Vector(J["elbow" + side][0]), Vector(J["wrist" + side][0])
        a = (Wr - E).normalized()                        # along the forearm, toward the hand
        u = a.cross(Vector((0, 1, 0))).normalized()      # round it: u across, v front to back
        v = a.cross(u).normalized()
        k_loft = max(2, round(CUFF_LOFT / CLOTH_H))
        for j in range(ns - k_loft, ns + 1):
            # the ring: the front panel from the top seam round to the bottom seam, then the back panel back up
            ring = [at[(side, j, m)] for m in range(nup + 1)] + [bk(at[(side, j, m)]) for m in range(nup - 1, 0, -1)]
            P = [co[i] for i in ring]
            n = len(P)
            c = sum(P, Vector()) / n
            h = [(p - c).dot(a) for p in P]
            flat = [p - a * hh for p, hh in zip(P, h)]
            th = [math.atan2((q - c).dot(v), (q - c).dot(u)) for q in flat]
            r = [(q - c).length for q in flat]
            turn = sum(math.remainder(th[(k + 1) % n] - th[k], math.tau) for k in range(n))
            sgn = 1 if turn >= 0 else -1
            # least squares fits: the radius to CUFF_HARM harmonics, the reach along the forearm to a tilt (one)
            def fit(y, order):
                import numpy as np
                A = np.array([[1.0] + [f(o * t) for o in range(1, order + 1) for f in (math.cos, math.sin)] for t in th])
                x = np.linalg.lstsq(A, np.array(y), rcond=None)[0]
                return lambda t: float(x[0] + sum(x[2 * o - 1] * math.cos(o * t) + x[2 * o] * math.sin(o * t)
                                                  for o in range(1, order + 1)))
            R, H = fit(r, CUFF_HARM), fit(h, 1)
            w = smooth(ns - k_loft, ns, j)
            for k, i in enumerate(ring):
                t = th[0] + sgn * math.tau * k / n           # evenly round, from the top seam
                clean = c + a * H(t) + (u * math.cos(t) + v * math.sin(t)) * R(t)
                co[i] = co[i].lerp(clean, w)
    return co


def drape(fig, rig, build):
    """Sew the panels round the body in the sewing pose and let the cloth fall. Returns the settled points, the
    faces and each face's part (0 to 2 on the front panel, 3 to 5 on the back). The rig's walk is set aside while the cloth falls and put back after."""
    sc = bpy.context.scene
    sc.render.threads_mode, sc.render.threads = "FIXED", 1     # one thread: the solver settles the same way every time
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
    verts2, faces2, parts, seams, upper, sleeve = pattern(fig, build, shoulder)
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
    cuff_x = max(abs(x) for x, _ in verts2)
    for i, p in enumerate(flat):
        # a hem is stiffer than the cloth: the cuff's last few centimetres hang in a clean edge, not a ruffle
        hem = smooth(cuff_x - CUFF_HEM - 0.03, cuff_x - 0.01, abs(p.x)) if abs(p.x) > 0.2 else 0.0
        hem = max(hem, smooth(HEM_CUT + CUFF_HEM + 0.03, HEM_CUT + 0.01, p.z))   # and so is the robe's hem
        near_seam = smooth(0.0, 2.5 * CLOTH_H, sk.find(Vector((p.x, 0, p.z)))[2])
        bend.add([i], max(near_seam * BEND_BODY / BEND_HEM, hem), "REPLACE")
    collide = fig.modifiers.new("Collide", "COLLISION")
    fig.collision.thickness_outer, fig.collision.cloth_friction = CLEAR, 5
    mod = cl.modifiers.new("Cloth", "CLOTH")
    s = mod.settings
    s.rest_shape_key = rest_key
    s.shrink_min, s.shrink_max, s.vertex_group_shrink = 0.0, BELT, "belt"   # shrink = min + (max - min) * weight
    s.quality, s.mass, s.air_damping = 10, 0.25, 1.5
    s.tension_stiffness, s.compression_stiffness, s.shear_stiffness = 20, 3, 10
    s.bending_stiffness, s.bending_stiffness_max, s.vertex_group_bending = 0.0, BEND_HEM, "bend"
    cs = mod.collision_settings
    cs.collision_quality, cs.distance_min = 5, CLEAR
    cs.use_self_collision, cs.self_distance_min = True, 0.004
    mod.point_cache.frame_start, mod.point_cache.frame_end = 1, F_END
    sc.frame_start, sc.frame_end = 1, F_END
    for f in range(1, F_END + 1):
        sc.frame_set(f)
    ev = cl.evaluated_get(bpy.context.evaluated_depsgraph_get())
    co = [cl.matrix_world @ v.co for v in ev.data.vertices]
    co = clean_cuffs(co, sleeve, bk, build)
    fig.modifiers.remove(collide)
    bpy.data.objects.remove(cl)
    rig.animation_data.action = walk
    for pb in rig.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
    sc.frame_start, sc.frame_end = 1, C.KEYS + 1
    sc.frame_set(1)
    return co, faces, parts + [p + 3 for p in parts]              # the back panel's faces are numbered 3 to 5


def trimmed(co, faces, parts, build):
    """The draped cloth, smoothed a little (the solver's last few millimetres of chatter), with its trim cut in at full
    detail: the crossed collar (J4's line, left over right) and bands along the neckline, the hem and the cuffs, each
    on an exact line its width in from the edge. Returns the mesh, each face's part and whether it is trim, and the
    points on the trim's lines (kept when the cloth is reduced)."""
    bm = bmesh.new()
    for c in co:
        bm.verts.new(c)
    bm.verts.ensure_lookup_table()
    for f in faces:
        bm.faces.new([bm.verts[i] for i in f])
    for _ in range(2):
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    # a hem is a smooth line, not the free edge's ripples: round the hem's open edge before cutting the trim (the
    # cuffs are already clean rings, clean_cuffs(), and these rounds only shrank them into the hand)
    cuff_edge = [v for v in bm.verts if any(len(e.link_faces) == 1 for e in v.link_edges) and v.co.z < 0.3]
    for _ in range(CUFF_ROUNDS):
        bmesh.ops.smooth_vert(bm, verts=cuff_edge, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.faces.ensure_lookup_table()
    before = BVHTree.FromBMesh(bm)
    bands = []
    for e in bm.edges:
        if len(e.link_faces) != 1:
            continue
        A, B = (v.co.copy() for v in e.verts)
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
        return min((d - bands[n][1] for _, n, d in kd.find_n(c, 8)), default=1.0)
    collar = C.collar_path(bm, build)
    on_collar = lambda c: collar(c) - C.COLLAR * 1.15 if c.z > 1.0 else 1.0
    C.cut_along(bm, on_collar)
    C.cut_along(bm, trim)
    me = bpy.data.meshes.new("robe-full")
    bm.to_mesh(me)
    bm.free()
    labels = [(parts[before.find_nearest(p.center)[2]], on_collar(p.center) < 0 or trim(p.center) < 0)
              for p in me.polygons]
    keep = set()                                         # the points where two labels meet: the trim's lines, the sleeves'
    seen = {}
    for p, (part, t) in zip(me.polygons, labels):
        lab = (part % 3, t)                              # the front and back of one part meet without a line kept
        for v in p.vertices:
            if seen.setdefault(v, lab) != lab:
                keep.add(v)
    return me, labels, keep


def reduce(me, labels, keep, target):
    """The cloth reduced to about target points for the phone, the trim's lines kept (Blender's decimation, held off
    the kept points, where labels meet). Each face keeps its label."""
    obj = bpy.data.objects.new("tmp", me)
    bpy.context.scene.collection.objects.link(obj)
    kinds = sorted(set(labels))
    lab = me.attributes.new("lab", "INT", "FACE")       # each face's label rides through the decimation with it
    lab.data.foreach_set("value", [kinds.index(x) for x in labels])
    g = obj.vertex_groups.new(name="keep")
    g.add(list(keep), 1.0, "REPLACE")
    dec = obj.modifiers.new("Dec", "DECIMATE")
    dec.ratio = min(1.0, target / len(me.vertices))
    dec.vertex_group, dec.invert_vertex_group, dec.vertex_group_factor = "keep", True, 1000.0
    out = bpy.data.meshes.new_from_object(obj.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    V = [v.co.copy() for v in out.vertices]
    F = [list(p.vertices) for p in out.polygons]
    L = [kinds[d.value] for d in out.attributes["lab"].data]
    bpy.data.objects.remove(obj)
    bpy.data.meshes.remove(me)
    bpy.data.meshes.remove(out)
    return V, F, L


def smooth_skirt(weights, verts, faces, parts, rounds=SKIRT_SMOOTH, top=1.0):
    """Cloth does not fold along the line where one point's weights change from its neighbour's: below the waist each
    point's weights are averaged with its neighbours' a few times, so the skirt bends over a hand's breadth where a
    leg meets it, not at a crease (Wendell, 2026-10-14: the legs "break in ways that don't look exactly like fabric")."""
    near = [set() for _ in verts]
    for f in faces:
        for a in f:
            near[a].update(v for v in f if v != a)
    body_vert = set()
    for f, pt in zip(faces, parts):
        if pt == 0:
            body_vert.update(f)
    free = [i for i in body_vert if verts[i].z < top]
    for _ in range(rounds):
        new = list(weights)
        for i in free:
            acc = {}
            ns = [j for j in near[i] if j in body_vert]
            for b, x in weights[i].items():
                acc[b] = acc.get(b, 0.0) + 0.5 * x
            for j in ns:
                for b, x in weights[j].items():
                    acc[b] = acc.get(b, 0.0) + 0.5 * x / len(ns)
            new[i] = norm(acc)
        weights = new
    return weights


def robe(fig, rig, build, cw):
    """The draped robe with its trim, reduced, hemmed, and weighted from the body under it."""
    co, faces, parts = drape(fig, rig, build)
    verts, faces, labels = reduce(*trimmed(co, faces, parts, build), ROBE_VERTS)
    W = bone_weights(fig)
    J = C.joints(build)
    from_body = weight_source(fig, lambda c, w: main_bone(w) in ("hips", "spine", "neck", "hipL", "hipR",
                                                                  "shoulderL", "shoulderR"))
    from_arm = {s: weight_source(fig, lambda c, w, s=s: main_bone(w) in ("spine", "shoulder" + s, "elbow" + s, "wrist" + s))
                for s in "LR"}
    of = {}
    for f, (p, _) in zip(faces, labels):
        for v in f:
            of.setdefault(v, []).append(p)
    weights, cloth = [], []
    for i, p in enumerate(verts):
        ps = of.get(i, [0])
        if all(q % 3 == 0 for q in ps):
            weights.append(skirt_weights(p, from_body(p)))
            cloth.append(1.0 if p.z < PIN_Z else 0.0)        # the skirt: cloth at runtime (cloth.js)
        else:
            if any(q % 3 == 0 for q in ps):
                weights.append(from_body(p))
            else:
                # a sleeve: from the middle of the forearm on, it rides the forearm alone, so the cuff's ring keeps
                # its shape (round 10; its nearest body points mixed the hand and the hip in)
                s = "L" if 1 in [q % 3 for q in ps] else "R"
                E, Wr = (Vector(J[b + s][0]) for b in ("elbow", "wrist"))
                b = smooth(0.3, 0.7, (p - E).dot(Wr - E) / (Wr - E).length_squared)
                w = {k: (1 - b) * x for k, x in from_arm[s](p).items()}
                w["elbow" + s] = w.get("elbow" + s, 0.0) + b
                weights.append(norm(w))
            cloth.append(0.0)
    weights = smooth_skirt(weights, verts, faces, [p % 3 for p, _ in labels])
    n_faces = len(faces)
    arms = {s: (Vector(J["elbow" + s][0]), (Vector(J["wrist" + s][0]) - Vector(J["elbow" + s][0])).normalized())
            for s in "LR"}
    verts, faces, labels, src = hemmed(verts, faces, labels, arms)
    weights += [weights[src[i]] for i in range(len(weights), len(verts))]   # the turned hem moves with its edge
    base = list(cloth)
    for i in range(len(cloth), len(verts)):            # the hem's edge is stiff (2); the hem turned back inside it
        cloth.append(3.0 * base[src[i]])               # follows that edge (3)
        cloth[src[i]] = 2.0 * base[src[i]]
    colours = [cw["edge"] if t else cw["robe"] for _, t in labels]
    part = [p % 3 if f < n_faces else FACING for f, (p, _) in enumerate(labels)]
    obj = mesh_object("robe", verts, faces, colours, weights, rig, part)
    ca = obj.data.attributes.new("_CLOTH", "FLOAT", "POINT")    # exported as the GLB's _CLOTH: 1 cloth, 2 its hem's edge, 3 the hem turned inside, 0 rides the body
    ca.data.foreach_set("value", cloth)
    outward(obj)
    return obj


HEM_IN, HEM_UP = 0.006, 0.03                     # metres: the hem's turned edge, its thickness and how far the
                                                 # turned-back cloth runs up inside
FACING = 3                                       # the turned hem's faces' part: inside the cloth, never tested


def hemmed(verts, faces, labels, arms=None):
    """The hem and the cuffs turned back inside, as a sewn hem is: the cloth goes on past its edge, round a fold
    HEM_IN thick, and back up inside for HEM_UP, so the edge has a body of its own (Wendell, 2026-10-14: "The hems
    also need to feel like they are more than just painted on"). The slits are left raw. Returns the points, faces and
    labels with the turned hem added after the rest, and for each new point the edge point it was turned from. arms,
    {side: (elbow, along the forearm)}, turns a cuff's fold in toward its forearm (round 10)."""
    count, nxt = {}, {}
    for fi, f in enumerate(faces):
        for a, b in zip(f, f[1:] + f[:1]):
            count[frozenset((a, b))] = count.get(frozenset((a, b)), 0) + 1
            nxt[(a, b)] = fi
    # the hem and the cuffs, not the neckline, and not the slits' sides where the hem's band turns up them
    edges = [(a, b, fi) for (a, b), fi in nxt.items() if count[frozenset((a, b))] == 1 and labels[fi][1]
             and not (verts[a].z > 1.2 and abs(verts[a].x) < 0.2)
             and not (verts[a].z < 0.6 and abs(verts[a].z - verts[b].z) > 0.6 * (verts[a] - verts[b]).length)]
    if not edges:
        return verts, faces, labels, {}
    # each edge point's way into the cloth (away from the edge, along the surface) and the cloth's normal there
    nbr = {}
    for f in faces:
        for a, b in zip(f, f[1:] + f[:1]):
            nbr.setdefault(a, set()).add(b)
            nbr.setdefault(b, set()).add(a)
    on_edge = {v for a, b, _ in edges for v in (a, b)}
    normal = {}
    for f in faces:
        n = (verts[f[1]] - verts[f[0]]).cross(verts[f[2]] - verts[f[0]])
        for v in f:
            if v in on_edge:
                normal[v] = normal.get(v, Vector()) + n
    V, F, L = list(verts), list(faces), list(labels)
    ring, src = {}, {}
    for v in on_edge:
        inside = [verts[u] - verts[v] for u in nbr[v] if u not in on_edge]
        up = sum(inside, Vector()) if inside else Vector((0, 0, 1))
        p = verts[v]
        if arms and p.z > 0.6 and abs(p.x) > 0.2:
            # a cuff: in toward the forearm. The cloth's normal cancels where the cuff's ring crosses a seam (the
            # front and back panels face apart there), and that point's fold shot off as a spike below the hand; and
            # in toward the wearer's middle turned the fold outward on the ring's inner side
            E, a = arms["L" if p.x > 0 else "R"]
            n = (p - E) - a * (p - E).dot(a)
            n.normalize()
        else:
            n = normal[v].normalized()
            if n.dot(Vector((p.x, p.y, 0))) < 0:         # the fold goes in, toward the wearer's middle
                n = -n
        up = (up - n * up.dot(n)).normalized()
        ring[v] = len(V)
        src[len(V)], src[len(V) + 1] = v, v
        V.append(verts[v] - n * HEM_IN)
        V.append(verts[v] - n * HEM_IN + up * HEM_UP)
    for a, b, fi in edges:
        F.append([b, a, ring[a], ring[b]])               # round the fold
        F.append([ring[b], ring[a], ring[a] + 1, ring[b] + 1])   # and back up inside
        L += [labels[fi], labels[fi]]
    return V, F, L, src


def skirt_weights(p, body):
    """Below the hips the robe hangs from the hips, its front panel on hemF, its back panel on hemB and its sides on
    their own thigh, more so toward the hem (round 4's swing; hemB now follows the thigh behind, not the heel); above them it takes the body's weights (blended
    between). The skirt below PIN_Z is cloth at runtime (cloth.js), and these weights give each cloth point its skinned
    place: where the cloth starts, where the waist's blend band and the pelvis's backstop measure from, and where it
    goes if the cloth is off. Round 5 hung it from the pelvis alone, so the band could only hold the cloth to a skirt
    that never moved with the legs, and the leg capsules and the band fought (round 6, CLOTH.md)."""
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


# ---- the skirt as cloth (cloth.js, run over the walk by cloth_walk.mjs) -----------------------------------------
#
# Wendell, 2026-10-14, on round 4: "We're missing something important about how the physics of how the bottom robe is
# supposed to move. It's not moving like clothes and every fix is still too localized". Through round 4 the skirt was
# draped once standing and then glued to the legs by bone weights. Now it is cloth every frame, in the game and here
# alike: the same cloth.js, which Blender runs in Node over the walk for the test and the pictures (board position
# j5-skirt-cloth).

CAPSULES = (("hipL", "kneeL"), ("kneeL", "ankleL"), ("hipR", "kneeR"), ("kneeR", "ankleR"), ("hipL", "hipR"),
            ("kneeL", "kneeL"), ("kneeR", "kneeR"))
CAP_PCT = 0.99                                   # a capsule's radius: this share of its body points lie inside it
TAPER_FROM = 0.75                                # a leg capsule's lower radius (rb): from its points this far down it
POSED = {}                                       # {object name: {frame: [Vector]}}: positions posed() gives instead
                                                 # of the armature's (the robe's cloth over the walk)
CLOTH_JS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cloth_walk.mjs")
NO_LEGS = False                                  # --no-legs: the cloth runs without its leg capsules (test J5b)
WARM = 2.0                                       # seconds walked before the test's keys, so the cloth has settled


def leg_capsules(fig, build):
    """The capsules the skirt's cloth is pushed out by: each thigh (hip to knee) and shin (knee to ankle), the pelvis
    (hip joint to hip joint) and each knee (a ball: a bent knee's front stands out past both thigh and shin), each
    round the body points of its own bones (the pelvis: those between the hip joints, below the waist; a knee: those
    within 8 cm of it)."""
    J, W = C.joints(build), bone_weights(fig)
    out = []
    for a, b in CAPSULES:
        A, B = Vector(J[a][0]), Vector(J[b][0])
        if a == b:                                       # a knee
            own = [v.co for i, v in enumerate(fig.data.vertices) if main_bone(W[i]) in ("hip" + a[-1], a)
                   and (v.co - A).length < 0.08]
        elif a[:-1] == b[:-1]:                           # the pelvis
            own = [v.co for i, v in enumerate(fig.data.vertices) if main_bone(W[i]) in ("hips", "hipL", "hipR")
                   and 0.78 < v.co.z < 0.97 and abs(v.co.x) <= abs(A.x)]
        else:
            own = [v.co for i, v in enumerate(fig.data.vertices) if main_bone(W[i]) == a]
        d = sorted(seg_dist(c, A, B) for c in own)
        cap = {"a": a, "b": b, "r": round(d[min(len(d) - 1, int(CAP_PCT * len(d)))], 4)}
        if a != b and a[:-1] != b[:-1]:
            # a thigh or shin tapers toward its lower joint: radius r at a, rb at b (round 9: a shin as wide as its
            # calf all the way down held the hem 1.3 cm off the ankle; cloth.js narrows the capsule between them)
            u = B - A
            low = sorted(seg_dist(c, A, B) for c in own if (c - A).dot(u) / u.length_squared >= TAPER_FROM)
            if low:
                cap["rb"] = round(min(cap["r"], low[min(len(low) - 1, int(CAP_PCT * len(low)))]), 4)
        if a != b and a[:-1] == b[:-1]:
            cap["backstop"] = True                       # the pelvis: wider than the hips, so it pushes a point out no
                                                         # further than its skinned place (cloth.js backstop, round 6)
        out.append(cap)
    return out


def cloth_job(robe_obj, rig, capsules, scenarios):
    """What cloth_walk.mjs needs: the rig at rest, the robe (points, triangles, the cloth mask, weights), the leg
    capsules and the walks to run."""
    order = []                                           # the bones, parents first
    def visit(bn):
        order.append(bn)
        for ch in bn.children:
            visit(ch)
    for bn in rig.data.bones:
        if bn.parent is None:
            visit(bn)
    idx = {bn.name: i for i, bn in enumerate(order)}
    bones = [{"name": bn.name, "parent": bn.parent.name if bn.parent else None,
              "head": list(rig.matrix_world @ bn.head_local)} for bn in order]
    me = robe_obj.data
    groups = {g.index: g.name for g in robe_obj.vertex_groups}
    rest = [c for v in me.vertices for c in (robe_obj.matrix_world @ v.co)]
    tris = [t for p in me.polygons for k in range(1, len(p.vertices) - 1) for t in (p.vertices[0], p.vertices[k], p.vertices[k + 1])]
    weights = [[[idx[groups[g.group]], g.weight] for g in v.groups if g.weight > 0 and groups[g.group] in idx] for v in me.vertices]
    sim = [d.value for d in me.attributes["_CLOTH"].data]
    return {"bones": bones, "robe": {"rest": rest, "tris": tris, "sim": sim, "weights": weights},
            "capsules": capsules, "scenarios": scenarios}


def run_cloth(job, tag="cloth"):
    """Run cloth_walk.mjs on a job; returns its result."""
    d = os.path.join(os.environ.get("W", "/tmp/blender-cloud"), "cloth-jobs")
    os.makedirs(d, exist_ok=True)
    jp, op = os.path.join(d, tag + "-job.json"), os.path.join(d, tag + "-out.json")
    with open(jp, "w") as f:
        json.dump(job, f)
    r = subprocess.run(["node", CLOTH_JS, jp, op], capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(f"cloth_walk.mjs failed: {r.stderr[-800:]}")
    with open(op) as f:
        return json.load(f)


def walk_keys():
    """The test's walk: the 25 keys of character.py's walk, after WARM seconds of walking (frame 1 + k is key k)."""
    return {"name": "walk", "steps": C.STEPS_PER_S, "amp": C.AMP, "turn": None,
            "samples": [WARM + k / C.FPS for k in range(C.KEYS + 1)]}


def cloth_scenarios():
    """The pictures' walks, eight moments each: one step cycle at the normal stride (character.py's, two steps a
    second); one at a fast stride (cave.js's 2.5 steps a second at its widest swing, 0.62); a quarter turn to the
    left over 0.75 s while walking at the normal stride, from just before it to just after; and (round 6) a stop: the
    walk eases out to standing over 0.4 s, and the cloth settles until it hangs straight down, three seconds on."""
    cyc = lambda steps: 2.0 / steps
    return [{"name": "walk", "steps": C.STEPS_PER_S, "amp": C.AMP, "turn": None,
             "samples": [WARM + i * cyc(C.STEPS_PER_S) / 8 for i in range(8)]},
            {"name": "fast", "steps": 2.5, "amp": 0.62, "turn": None,
             "samples": [WARM + i * cyc(2.5) / 8 for i in range(8)]},
            {"name": "turn", "steps": C.STEPS_PER_S, "amp": C.AMP, "turn": {"at": WARM, "angle": math.pi / 2, "dur": 0.75},
             "samples": [WARM - 0.1 + i * 0.15 for i in range(8)]},
            {"name": "stop", "steps": C.STEPS_PER_S, "amp": C.AMP, "turn": None, "stop": {"at": WARM, "dur": 0.4},
             "samples": [WARM + t for t in (0.0, 0.2, 0.4, 0.6, 0.9, 1.3, 2.0, 3.0)]}]


def cloth_walk(robe_obj, rig, capsules):
    """The robe over the test's walk, cloth below the belt: sets POSED for the robe at each key; returns the result."""
    res = run_cloth(cloth_job(robe_obj, rig, capsules, [walk_keys()]), robe_obj.name)
    s = res["scenarios"][0]["samples"]
    POSED[robe_obj.name] = {1 + k: [Vector(x["robe"][3 * i:3 * i + 3]) for i in range(len(x["robe"]) // 3)]
                            for k, x in enumerate(s)}
    return res


# ---- the sash -------------------------------------------------------------------------------------------------

SASH_Z = (0.985, 0.995, 1.030, 1.065, 1.075)
TAIL_OFF = 0.022                                 # metres the tails lie off the robe (round 6: the cloth below the
                                                 # belt moves up to 2 cm from its skinned place there; at 1.2 cm it hid them)


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
        # the edges roll in to the cloth beneath: its outer face, THICK out (round 6: at 3 mm the robe's outer face
        # showed through the band's edges in ragged teeth)
        lip = THICK + (0.003 if n in (0, len(SASH_Z) - 1) else 0.008)
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
    # two tails hanging from the knot, lying on the cloth beneath at TAIL_OFF off it
    for x0, end, width in ((0.045, 0.80, 0.042), (0.085, 0.84, 0.038)):
        t0 = len(verts)
        zs = [1.01 - (1.01 - end) * k / 6 for k in range(7)]
        for k, z in enumerate(zs):
            x = x0 + 0.01 * k / 6
            for dx in (-width / 2, width / 2):
                p = front_of(x + dx, z, TAIL_OFF + 0.002 * k)
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
    """The open edges (hem, slits, cuffs, neck) as vertex pairs; not the sleeve's top, which is inside the robe. A
    turned hem's faces are not counted, so the hem's fold is the opening."""
    me = obj.data
    inner = [d.value for d in me.attributes["inner"].data]
    part = [d.value for d in me.attributes["part"].data]
    count = {}
    for p in me.polygons:
        for e in p.edge_keys:
            count[e] = count.get(e, 0) + (1 if part[p.index] != FACING else 0)
    return [e for e, n in count.items() if n == 1 and not (inner[e[0]] and inner[e[1]])]


def seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (p - (a + ab * t)).length


def crossings(tree, p, d, reach=0.6):
    """How many times the ray from p along d (unit) crosses the cloth within reach."""
    n, o, left = 0, p.copy(), reach
    while left > 0:
        hit = tree.ray_cast(o, d, left)[0]
        if hit is None:
            return n
        n += 1
        left -= (hit - o).length + 1e-4
        o = hit + d * 1e-4
    return n


def through(wearer, cover, garment, keys, parts_of=None, ray_from=None, limb_of=None, cloth_z=None, cloth_limb=None):
    """For each key: the covered points of `wearer` outside `garment`'s surface and not at an opening. A point is a
    vertex index, or a tuple of indices for the middle of a face (a body face can bulge through between vertices).
    parts_of(i): the garment parts (face attribute "part") that may hold point i, its own first; a point held by any
    of them is covered (an arm inside its sleeve, or tucked inside the robe's body at the shoulder).
    ray_from(p): where to look out from for point p, or None. A point held only by its own part (the robe's body,
    a sash's band) also counts as through when the line from there out through it meets no cloth: the nearest-face
    test alone can be fooled where cloth folds.
    limb_of(i): the leg bone point i lies on where it may step out through a slit, or None. Such a point outside the
    cloth is held when no cloth lies between it and its bone: it came out through the slit, not through the cloth.
    cloth_z: below this height (the point's standing height) the garment is cloth (cloth.js), which folds and pleats
    as it swings: a fold's side can be the face nearest a point that is well inside. There a point is inside when a
    ray out from it (away from its leg bone where limb_of names one, else from the middle) crosses the cloth an odd
    number of times (once through a plain skirt, three times through a fold), by two rays of three; a point on the
    inside of a leg, facing the other, looks out from the middle instead (round 6). cloth_limb(i):
    the leg bone of point i for this test, at any height (a leg's own outward is away from its bone, not the middle).
    Returns ([count per key], {garment vertex: push needed})."""
    me = garment.data
    polys = [list(p.vertices) for p in me.polygons]
    part = [d.value for d in me.attributes["part"].data]
    # a leg comes out of a slit wider than a hand comes out of a cuff: the slit's edges are open to 4.5 cm
    rest_co = [v.co for v in me.vertices]
    edges = [(a, b, EDGE_SLIT if (garment.name.startswith("robe") and 0.15 < min(rest_co[a].z, rest_co[b].z) and max(rest_co[a].z, rest_co[b].z) < 1.0
                                  and max(abs(rest_co[a].x), abs(rest_co[b].x)) < 0.2) else EDGE)
             for a, b in openings(garment)]
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
                i0 = i if isinstance(i, int) else i[0]
                if cloth_z is not None and rest[i0].z < cloth_z and len(pids) == 1:
                    limb = (cloth_limb or limb_of or (lambda _: None))(i0)
                    if limb:
                        pb, mw = wearer.parent.pose.bones[limb], wearer.parent.matrix_world
                        a, b = mw @ pb.head, mw @ pb.tail
                        t = max(0.0, min(1.0, (p - a).dot(b - a) / max((b - a).length_squared, 1e-9)))
                        d = p - a.lerp(b, t)
                    else:
                        d = Vector((p.x, p.y, 0))
                    tr, sel = tree(pids[0])
                    if d.length > 1e-6:
                        dn = d.normalized()            # three rays a little apart, so one along an edge or a fold
                        rad = Vector((p.x, p.y, 0))
                        if limb and rad.length > 1e-6 and dn.dot(rad.normalized()) < -0.3:
                            # the inside of a leg, facing the other one: a ray from there crosses the gap between the
                            # legs, where the weighted cloth now hangs (round 6), so a hidden point read as through.
                            # From there look out from the middle instead, out past its own leg to the robe's side.
                            dn = rad.normalized()
                        odd = sum(crossings(tr, p, (Matrix.Rotation(a, 3, "Z") @ dn).normalized()) % 2   # cannot decide
                                  for a in (-0.25, 0.0, 0.25))
                        if odd >= 2:
                            continue                       # inside the cloth
                        if limb and tr.ray_cast(p, -d.normalized(), d.length)[0] is None:
                            continue                       # out through a slit, clear of the cloth
                        loc, nor, fi, _ = tr.find_nearest(p)
                        LAST_THROUGH.append((k, i, (p - loc).length))
                        n += 1
                        continue
                for pid in pids:
                    t, sel = tree(pid)
                    loc, nor, fi, _ = t.find_nearest(p)
                    if loc is None:
                        continue
                    d = (p - loc).dot(nor)
                    if d <= TOL or any(seg_dist(loc, gc[a], gc[b]) < wide for a, b, wide in edges):
                        held = True                        # inside, or a leg or a hand out through an opening
                        break
                    if first is None:
                        first = (d, polys[sel[fi]], sel[fi])
                if held and ray_from and len(pids) == 1:
                    o = ray_from(p)
                    if o is not None:
                        d = Vector((p.x - o.x, p.y - o.y, 0))
                        t, sel = tree(pids[0])
                        if d.length > 1e-6 and t.ray_cast(p, d.normalized(), 0.6)[0] is None:
                            loc, nor, fi, _ = t.find_nearest(p)
                            held, first = False, (max(0.0, (p - loc).dot(nor)), polys[sel[fi]], sel[fi])
                if held or first is None:
                    continue
                limb = limb_of(i if isinstance(i, int) else i[0]) if limb_of else None
                if limb:
                    pb, mw = wearer.parent.pose.bones[limb], wearer.parent.matrix_world
                    a, b = mw @ pb.head, mw @ pb.tail
                    t = max(0.0, min(1.0, (p - a).dot(b - a) / max((b - a).length_squared, 1e-9)))
                    to = a.lerp(b, t) - p
                    tr, _ = tree(pids[0])
                    if to.length > 1e-6 and tr.ray_cast(p, to.normalized(), to.length)[0] is None:
                        continue                           # out through a slit, clear of the cloth
                LAST_THROUGH.append((k, i, first[0]))
                n += 1
                d, vs, face = first
                for v in vs:
                    if d + FIT_MARGIN > push.get(v, (0.0, None))[0]:
                        push[v] = (d + FIT_MARGIN, face)
        counts.append(n)
    return counts, push


def fit(wearer, cover, garment, keys, rounds=30, parts=None, ray_from=None, limb_of=None):
    """root-game's fullness, found by walking: push the cloth out (in its standing shape, along its normals) wherever
    a covered point came through at any key, and again, until none does. A round that leaves more points through than
    the best so far is undone and the next pushes are halved. Returns the rounds' counts."""
    me = garment.data
    log, best, scale = [], None, 1.0
    for _ in range(rounds):
        counts, push = through(wearer, cover, garment, keys, parts, ray_from, limb_of)
        total = sum(counts)
        log.append(total)
        if best is not None and total > best[0]:
            for v, co in zip(me.vertices, best[1]):          # worse than before: back to the best, smaller steps
                v.co = co
            me.update()
            scale *= 0.5
            counts, push = through(wearer, cover, garment, keys, parts, ray_from, limb_of)
            total = sum(counts)
        if best is None or total <= best[0]:
            best = (total, [v.co.copy() for v in me.vertices])
        if not push:
            break
        me.update()
        kd = KDTree(len(me.vertices))
        for v in me.vertices:
            kd.insert(v.co, v.index)
        kd.balance()
        part = me.attributes["part"].data
        spread = {}
        for v, (d, face) in push.items():
            # out along the normal of the face the point came through (a point is through a face on its outer side
            # by the test). A body panel's fold can face the body: there it is turned to face away from the middle
            n = me.polygons[face].normal.copy()
            radial = Vector((me.vertices[v].co.x, me.vertices[v].co.y, 0.0))
            if part[face].value == 0 and radial.length > 1e-6 and n.dot(radial.normalized()) < -0.2:
                n = -n
            dd = min(d, MAX_PUSH) * scale
            for co, j, dist in kd.find_range(me.vertices[v].co, FIT_RADIUS):   # a smooth bump, not a spike
                w = dd * 0.5 * (1 + math.cos(math.pi * dist / FIT_RADIUS))
                if j not in spread or spread[j][0] < w:
                    spread[j] = (w, n)
        for j, (w, n) in spread.items():
            me.vertices[j].co += n * w
        me.update()
    return log


def polish(*args, **kw):
    """fit() again with a narrower, stronger push, for the few points a drape's wide bumps cannot reach."""
    global FIT_RADIUS, FIT_MARGIN, MAX_PUSH
    keep = FIT_RADIUS, FIT_MARGIN, MAX_PUSH
    FIT_RADIUS, FIT_MARGIN, MAX_PUSH = 0.035, 0.02, 0.02
    try:
        return fit(*args, rounds=20, **kw)
    finally:
        FIT_RADIUS, FIT_MARGIN, MAX_PUSH = keep


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
    """The garment exported skinned, with its attributes (the robe's _CLOTH) and its custom properties as extras
    (the robe's cloth). The thickening is not applied in the GLB (export_apply is off): the cloth is one sheet,
    drawn from both sides."""
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
                              export_apply=False, export_attributes=True, export_extras=True)
    obj.modifiers.remove(obj.modifiers["Thick"])
    return os.path.getsize(path)


def build_all(build, palette, out_dir, do_fit=True):
    keys = list(range(C.KEYS + 1))
    fig, rig = C.make(build, palette)
    fig_row = C.export(fig, rig, build, palette, out_dir)
    cw = COLOURWAYS[palette]
    rows = []
    W = bone_weights(fig)

    def parts(i):                                          # an arm point by its own sleeve (or the robe's body), the rest by the body
        b = main_bone(W[i])
        return ((1 if b.endswith("L") else 2), 0) if b in ARMS else (0,)
    R = robe(fig, rig, build, cw)
    cover = with_faces(fig, cover_robe(fig, R, build))
    # above the slits (wherever the belt has drawn them up to), nothing opens
    rc = [v.co for v in R.data.vertices]
    slit_top = max(rc[v].z for e in openings(R) for v in e if 0.25 < rc[v].z < 1.0 and abs(rc[v].x) > 0.12)
    # and not where the arms come out (a line from the middle out under the arm leaves through the armhole)
    axis = lambda p: Vector((0, 0, p.z)) if p.z > slit_top + 0.03 and not (p.z > 1.1 and abs(p.x) > 0.11) else None
    # a leg below the slits' tops (and just above, where the slit spreads) may step out through a slit
    rp = [d.value for d in R.data.attributes["part"].data]
    body_pts = {v for f in R.data.polygons if rp[f.index] == 0 for v in f.vertices}
    slits = max(rc[v].z for e in openings(R) for v in e if v in body_pts and 0.25 < rc[v].z < 1.0 and abs(rc[v].x) > 0.12)
    legs = lambda i: main_bone(W[i]) if main_bone(W[i]) in ("hipL", "hipR", "kneeL", "kneeR") and \
        fig.data.vertices[i].co.z < slits + 0.08 else None
    # the walking fit shapes the robe above the belt, which rides the body; below it the cloth finds its own way
    zs = lambda i: fig.data.vertices[i if isinstance(i, int) else i[0]].co.z
    upper = [i for i in cover if zs(i) > PIN_Z - 0.02 or main_bone(W[i if isinstance(i, int) else i[0]]) in ARMS]
    log = fit(fig, upper, R, keys, parts=parts, ray_from=axis, limb_of=legs) if do_fit else []
    counts, _ = through(fig, upper, R, keys, parts, axis, legs)
    if do_fit and max(counts) > 0:
        log += polish(fig, upper, R, keys, parts=parts, ray_from=axis, limb_of=legs)   # a few stubborn points: smaller, stronger pushes
    if os.environ.get("GARMENTS_SAVE"):                  # for looking into a build by hand
        bpy.ops.wm.save_as_mainfile(filepath=os.environ["GARMENTS_SAVE"])
    caps = leg_capsules(fig, build)
    R["cloth"] = json.dumps({"capsules": caps})          # glTF extras: cloth.js reads the leg capsules from here
    leg = lambda i: main_bone(W[i]) if main_bone(W[i]) in ("hipL", "hipR", "kneeL", "kneeR") else None
    for opts in json.loads(os.environ.get("CLOTH_SWEEP", "[]")):   # for tuning: cloth.js options tried on this one drape
        os.environ["CLOTH_OPTS"] = json.dumps(opts)
        cloth_walk(R, rig, caps)
        n, _ = through(fig, cover, R, keys, parts, axis, legs, cloth_z=1.0, cloth_limb=leg)
        print(f"sweep {json.dumps(opts)}: through {max(n)} at worst, {sum(n)} in all", flush=True)
        POSED.pop(R.name, None)
    os.environ.pop("CLOTH_OPTS", None) if os.environ.get("CLOTH_SWEEP") else None
    cres = cloth_walk(R, rig, [] if NO_LEGS else caps)
    counts, _ = through(fig, cover, R, keys, parts, axis, legs, cloth_z=1.0, cloth_limb=leg)
    for k, i, d in LAST_THROUGH[:12]:                    # where the cloth let a point through, for the log
        j = i if isinstance(i, int) else i[0]
        print(f"through at key {k}: {main_bone(W[j])} {tuple(round(c, 3) for c in fig.data.vertices[j].co)} by {d * 1000:.1f} mm", flush=True)
    POSED.pop(R.name, None)
    rows.append(("robe", R, counts, log, len(cover)))
    cloth_stats = {"particles": cres["particles"], "free": cres["free"], "node_step_ms": cres["step_ms"],
                   "folds": cres["folds"], "fold_far": cres["fold_far"]}
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
                       "bones": sorted(g.name for g in obj.vertex_groups),
                       **({"cloth": cloth_stats} if g == "robe" else {})})
    return fig_row, report


def sheet(figs, rows, out_dir, walk_only=False):
    """The contact sheet (cc-wardrobe-gate): builds down; across, each garment worn alone in each colourway, caught a
    quarter of the way through the walk from the front three-quarter. Then the whole set on each build and palette,
    and the average dusk figure in the whole set from the front, the side and the back at four points of the walk."""
    import numpy as np

    def load(path):
        before = set(bpy.context.scene.objects)
        bpy.ops.import_scene.gltf(filepath=path)
        return list(set(bpy.context.scene.objects) - before)

    robes, jobs = [], {}                                   # (armature, robe): the robes worn, their skirts cloth

    def dress(fig_objs, files):
        """Put garments on a loaded figure: every garment mesh rebound to the figure's armature (the runtime swap)."""
        arm = next(o for o in fig_objs if o.type == "ARMATURE")
        for f in files:
            for o in load(os.path.join(out_dir, f)):
                if o.type == "MESH" and "_CLOTH" in o.data.attributes:
                    robes.append((arm, o))
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

    def cloth(scenarios):
        """Run each worn robe's skirt over the walks (cloth_walk.mjs, the game's cloth.js): [(robe, samples)]."""
        bpy.context.view_layer.update()                    # the figures were just moved into place
        out = []
        for n, (arm, robe) in enumerate(robes):
            if robe.name not in jobs:                      # the robe as worn, before any cloth is put on it
                jobs[robe.name] = cloth_job(robe, arm, json.loads(robe["cloth"])["capsules"], [])
            res = run_cloth(dict(jobs[robe.name], scenarios=scenarios), f"sheet-{n}")
            out.append((robe, [x for sc in res["scenarios"] for x in sc["samples"]]))
            for m in [m for m in robe.modifiers if m.type == "ARMATURE"]:
                robe.modifiers.remove(m)
            robe.parent = None
            robe.matrix_world = Matrix.Identity(4)
        return out

    def wear(done, i):
        """Each robe's points at its i-th sample."""
        for robe, samples in done:
            pts = samples[i]["robe"]
            robe.data.vertices.foreach_set("co", pts)
            robe.data.update()

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
        robes.clear()
        jobs.clear()
        bpy.ops.wm.read_factory_settings(use_empty=True)
        lights()

    three_q = Vector((math.sin(math.radians(-25)), -math.cos(math.radians(-25)), 0.12))
    builds, pals = list(C.BUILDS), list(C.PALETTES)
    if not walk_only:
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
        wear(cloth([dict(walk_keys(), samples=[WARM + (C.KEYS // 4) / C.FPS])]), 0)
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
        wear(cloth([dict(walk_keys(), samples=[WARM + (C.KEYS // 4) / C.FPS])]), 0)
        setup((900, 1260), 0, 1 + C.KEYS // 4)
        camera(6.6, three_q)
        bpy.context.scene.render.filepath = os.path.join(out_dir, "set-sheet.png")
        bpy.ops.render.render(write_still=True)
    # 3. the average dusk figure in the set, front, side and back, at keys 0, 6, 12 and 18
    clear()
    objs = load(os.path.join(out_dir, figs[("average", "dusk")]))
    arm = dress(objs, ["robe-average-dusk.glb", "sash-robe-average-dusk.glb", "topknot-average-dusk.glb"])
    four = cloth([dict(walk_keys(), samples=[WARM + k / C.FPS for k in (0, 6, 12, 18)])])
    strips = []
    for d in (Vector((0, -1, 0.05)), Vector((1, 0, 0.05)), Vector((0, 1, 0.05))):
        cells = []
        for n, k in enumerate((0, 6, 12, 18)):
            wear(four, n)
            setup((300 * WALK_X, 600 * WALK_X), 0, 1 + k)
            camera(2.2, d)
            bpy.context.scene.render.filepath = os.path.join(out_dir, f"_walk.png")
            bpy.ops.render.render(write_still=True)
            im = bpy.data.images.load(bpy.context.scene.render.filepath, check_existing=False)
            cells.append(np.array(im.pixels[:], np.float32).reshape(600 * WALK_X, 300 * WALK_X, 4))
            bpy.data.images.remove(im)
        strips.append(np.hstack(cells))
    img = bpy.data.images.new("walk", 1200 * WALK_X, 1800 * WALK_X)
    img.pixels.foreach_set(np.vstack(strips[::-1]).ravel())   # Blender's rows run bottom up: front strip on top
    img.filepath_raw = os.path.join(out_dir, "set-walk.png")
    img.file_format = "PNG"
    img.save()
    # 4. the skirt as cloth, from the figure's left: a step cycle at the normal stride, one at the fast stride, and a
    # quarter turn to the left while walking (board position j5-skirt-cloth), and a stop to standing still (round 6)
    rig_bones = []

    def visit(b):
        rig_bones.append(b)
        for ch in b.children:
            visit(ch)
    for b in arm.data.bones:
        if b.parent is None:
            visit(b)
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.rotation_mode = "QUATERNION"

    def pose(D):                                           # the rig as cloth_walk.mjs posed it
        for b in rig_bones:
            m = D[b.name]
            arm.pose.bones[b.name].matrix = Matrix([m[0:4], m[4:8], m[8:12], m[12:16]]).transposed() @ b.matrix_local
            bpy.context.view_layer.update()
    rows = []
    for sc in cloth_scenarios():
        done = cloth([sc])
        cells = []
        for i, x in enumerate(done[0][1]):
            pose(x["deform"])
            wear(done, i)
            setup((300 * WALK_X, 600 * WALK_X), 0, 1)
            pose(x["deform"])
            camera(2.4, Vector((1, 0, 0.05)))
            bpy.context.scene.render.filepath = os.path.join(out_dir, "_walk.png")
            bpy.ops.render.render(write_still=True)
            im = bpy.data.images.load(bpy.context.scene.render.filepath, check_existing=False)
            cells.append(np.array(im.pixels[:], np.float32).reshape(600 * WALK_X, 300 * WALK_X, 4))
            bpy.data.images.remove(im)
        rows.append(np.hstack(cells))
    img = bpy.data.images.new("cloth", rows[0].shape[1], rows[0].shape[0] * len(rows))
    img.pixels.foreach_set(np.vstack(rows[::-1]).ravel())  # normal stride on top, then fast, the turn, the stop
    img.filepath_raw = os.path.join(out_dir, "cloth-walk.png")
    img.file_format = "PNG"
    img.save()
    os.remove(os.path.join(out_dir, "_walk.png"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--build", default="average")
    ap.add_argument("--palette", default="dusk")
    ap.add_argument("--all", action="store_true", help="every build in every palette")
    ap.add_argument("--sheet", action="store_true", help="render the contact sheets (Cycles, CPU)")
    ap.add_argument("--walk-only", action="store_true", help="with --sheet: only the average figure's walk strip")
    ap.add_argument("--sheet-only", action="store_true", help="only render the sheets from the GLBs in --out")
    ap.add_argument("--no-fit", action="store_true", help="skip the walking fit (test J5b: points come through)")
    ap.add_argument("--no-legs", action="store_true", help="the skirt's cloth without its leg capsules (test J5b: legs come through)")
    ap.add_argument("--part", help="(used by --all) write this build's figure and garment rows to this file")
    ap.add_argument("--out", default=os.path.join(os.environ.get("W", "/tmp/blender-cloud"), "garments"))
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    global NO_LEGS
    NO_LEGS = a.no_legs
    os.makedirs(a.out, exist_ok=True)
    if a.sheet_only:                                       # render again from the GLBs already in --out
        with open(os.path.join(a.out, "report.json")) as f:
            rep = json.load(f)
        sheet({(r["build"], r["palette"]): r["file"] for r in rep["figures"]}, rep["garments"], a.out, a.walk_only)
        return
    combos = [(b, p) for b in C.BUILDS for p in C.PALETTES] if a.all else [(a.build, a.palette)]
    figs, report = {}, []
    for b, p in combos:
        if a.all:
            # One fresh process per build and palette. The cloth solver settles differently from one process to the
            # next (a drape of 392 points through at the start, or 91, or 297), and the fit cannot save the rare
            # bad one, and it repeats itself inside a process. So a robe the fit leaves with points through is made
            # again in a new process, up to DRAPE_TRIES times.
            part = os.path.join(a.out, f"part-{b}-{p}.json")
            cmd = [sys.executable, os.path.abspath(__file__), "--build", b, "--palette", p, "--out", a.out, "--part", part]
            cmd += ["--no-fit"] if a.no_fit else []
            cmd += ["--no-legs"] if a.no_legs else []
            for attempt in range(DRAPE_TRIES):
                subprocess.run(cmd, check=True)
                with open(part) as f:
                    fr, rows = json.load(f)
                os.remove(part)
                if a.no_fit or all(r["worst"] == 0 for r in rows):
                    break
                print(f"{b}-{p}: a drape left points through (try {attempt + 1} of {DRAPE_TRIES}), again", flush=True)
        else:
            fr, rows = build_all(b, p, a.out, not a.no_fit)
            if a.part:
                with open(a.part, "w") as f:
                    json.dump([fr, rows], f)
        figs[(b, p)] = fr["file"]
        report += rows
        for r in rows:
            print(f"{r['id']}: {r['bytes'] // 1024} KB, {r['tris']} triangles, through {r['worst']} "
                  f"(fit {r['fit_rounds']})", flush=True)
    with open(os.path.join(a.out, "report.json"), "w") as f:
        json.dump({"figures": [{"build": b, "palette": p, "file": f} for (b, p), f in figs.items()], "garments": report},
                  f, indent=1)
    if a.sheet:
        sheet(figs, report, a.out, a.walk_only)
        print("sheets:", *(os.path.join(a.out, n) for n in ("garments-sheet.png", "set-sheet.png", "set-walk.png", "cloth-walk.png")))


if __name__ == "__main__":
    main()
