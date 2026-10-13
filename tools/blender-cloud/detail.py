"""The Blender detail pass on the cave's grown pieces: roots and mushrooms made at phone size, with crisp cap rims,
colour and baked shadow.

The cave's grown pieces (content/ontology-game/cave/grow.py) were made at full detail and decimated to their face budgets,
and decimation rounded the clump caps into blobs (the cave thread, 2026-10-13: "some clump caps came out blobby after
being cut down to fit the phone budget"). Here each piece is grown again, same seeds, at a resolution that fits its
budget from the start, so no decimation runs, and the clump is thrown wider (MAKERS):

  mushrooms  fewer sides and rings, set per piece (RES). The cap keeps more rings than the stem, where the outline is.
  roots      each tube's centre line is thinned where it runs straight, so the rings go where it bends (_thin).

Then, in Blender (build()):

  rim        smooth shading everywhere but the ring round each cap's rim, which is marked sharp, so the rim stays an
             edge and the gills shade apart from the top.
  colour     one grey value per vertex, multiplied into the piece's colour in the page (cave.js sets the tint): cap
             brightest at the rim and darker at the crown with speckle, gills a step down, the stem well down so the
             cap reads apart from it under the glow, roots dark where thick and pale at the tips.
  bake       Cycles ambient occlusion, baked into the same colours, with the ground (or the wall, or the roof) the
             piece grows from in place while it bakes: a clump darkens where its stems crowd and where they meet the
             floor. Stored as COLOR_0 in the GLB, no texture files, so the page's byte budget barely moves.

Pure Python down to build(): `pieces()` returns the meshes and their corner tags with no bpy, for the offline tests.

Run with Blender's Python module (bpy 5.2.2, Python 3.13; README.md here):
    python3 tools/blender-cloud/detail.py OUT.glb                   the four pieces, coloured and baked
    python3 tools/blender-cloud/detail.py --counts                    faces per piece against its budget, no bpy
build_kit.py takes the pieces with `detail.build()` in place of decimating grow.grown()'s.
"""
import math
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAVE = os.path.join(HERE, "..", "..", "content", "ontology-game", "cave")
sys.path.insert(0, HERE)
sys.path.insert(0, CAVE)
import procgen  # noqa: E402
import grow  # noqa: E402

# Resolution per piece (choices, tried against the budgets in grow.GROWN). Mushrooms: sides round the lathe, stem rings,
# gill rings, cap rings. Roots: tube sides, fibre sides, and how far a thinned centre line may stray from the grown one,
# as a share of the tube's radius there.
# fibres: the share of hair-roots kept, spread evenly through them. The creeping mat is mostly hair-roots at full detail
# (about 5,400 of its 9,500 faces); decimation melted them into the trunks, and here a tenth of them stay whole.
RES = {
    "root_hang": dict(tube=5, fiber=3, stray=0.5, fibres=0.85),
    "root_creep": dict(tube=4, fiber=3, stray=1.2, fibres=0.08),
    "mush_clump": dict(sides=16, rings=4, gill_rings=2, cap_rings=9),
    "mush_colony": dict(sides=14, rings=4, gill_rings=2, cap_rings=7, tube=4, fiber=3, stray=0.9, fibres=0.5),
}



def _mush_clump(seed):
    # grow.py's clump was seven thrown close (spread 0.45): five survived the spacing, and their caps leaned into each
    # other and read as one lump. Nine on a wider throw (0.55), same seed and forms, stand apart on their own stems, and
    # being sized by span each comes out smaller (choice, from eight candidates rendered side by side).
    v, f, _bases = procgen.mushroom_cluster(seed=seed, kind="clump", count=9, forms=("bell", "cone", "dome"), spread=0.55)
    return v, f


MAKERS = {"mush_clump": _mush_clump}  # pieces grown differently from grow.GROWN; the rest use grow.py's own maker

# what a vertex is, for colouring
STEM, GILL, CAP, ROOT = 0, 1, 2, 3


def _thin(pts, rad, stray):
    """Drop the points of a centre line that the line through their neighbours already passes close to (within stray
    times the radius there), keeping both ends. The tube keeps its bends and loses the rings on its straight runs."""
    if len(pts) < 3:
        return pts, rad
    keep = [0]
    for i in range(1, len(pts) - 1):
        a, b = pts[keep[-1]], pts[i + 1]
        ab = procgen.sub(b, a)
        L2 = procgen.dot(ab, ab) or 1e-12
        # every point between the last kept one and the next must lie near the straight line a..b
        ok = True
        for j in range(keep[-1] + 1, i + 1):
            ap = procgen.sub(pts[j], a)
            t = max(0.0, min(1.0, procgen.dot(ap, ab) / L2))
            d = procgen.sub(ap, procgen.mul(ab, t))
            if math.sqrt(procgen.dot(d, d)) > stray * rad[j] or abs(rad[j] - procgen.lerp(rad[keep[-1]], rad[i + 1], t)) > 0.25 * rad[j]:
                ok = False
                break
        if not ok:
            keep.append(i)
    keep.append(len(pts) - 1)
    return [pts[i] for i in keep], [rad[i] for i in keep]


class _Tags:
    """Patches procgen while one piece grows: resolution in, a tag per vertex out, in the order the vertices are made.
    The cluster makers merge parts in the order they were made, so the tags line up with the merged mesh."""

    def __init__(self, res):
        self.res, self.tags, self.fibre_n = res, [], 0

    def __enter__(self):
        self.saved = (procgen.mushroom, procgen._sweep, procgen._fibers, procgen.ROOT_SEGMENTS, procgen.FIBER_SEGMENTS)
        mushroom, sweep, fibers, res, tags = procgen.mushroom, procgen._sweep, procgen._fibers, self.res, self.tags
        state = {"in_fibres": False}

        def tagged_mushroom(*a, **k):
            for key in ("sides", "rings", "gill_rings", "cap_rings"):
                if key in res:
                    k.setdefault(key, res[key])
            v, f = mushroom(*a, **k)
            sides, gill, cap = k.get("sides") or procgen.SIDES, k.get("gill_rings", 5), k.get("cap_rings") or procgen.RINGS
            stem = len(v) // sides - gill - cap
            tags.extend([(STEM, i / max(stem - 1, 1)) for i in range(stem) for _ in range(sides)])
            tags.extend([(GILL, i / max(gill - 1, 1)) for i in range(gill) for _ in range(sides)])
            tags.extend([(CAP, i / (cap - 1)) for i in range(cap) for _ in range(sides)])  # 0 at the rim, 1 at the crown
            return v, f

        def tagged_sweep(pts, rad, segments, verts, faces):
            if state["in_fibres"]:
                self.fibre_n += 1  # golden-ratio steps keep an even spread of whichever share is asked for
                if (self.fibre_n * 0.6180339887) % 1 >= res.get("fibres", 1.0):
                    return
            if "stray" in res:
                pts, rad = _thin(pts, rad, res["stray"])
            n = len(verts)
            sweep(pts, rad, segments, verts, faces)
            if len(verts) > n:
                tags.extend([(ROOT, r) for r in rad for _ in range(segments)] + [(ROOT, rad[0]), (ROOT, rad[-1] * 0.5)])

        def counted_fibers(*a):
            state["in_fibres"] = True
            try:
                fibers(*a)
            finally:
                state["in_fibres"] = False

        procgen.mushroom, procgen._sweep, procgen._fibers = tagged_mushroom, tagged_sweep, counted_fibers
        procgen.ROOT_SEGMENTS = res.get("tube", procgen.ROOT_SEGMENTS)
        procgen.FIBER_SEGMENTS = res.get("fiber", procgen.FIBER_SEGMENTS)
        return self

    def __exit__(self, *exc):
        procgen.mushroom, procgen._sweep, procgen._fibers, procgen.ROOT_SEGMENTS, procgen.FIBER_SEGMENTS = self.saved


def pieces():
    """{piece: (verts, faces, tags, budget)} in the page's axes, sized as grow.GROWN says, at RES. No bpy. The same
    every run. tags[i] is (STEM, GILL, CAP or ROOT, a number): up the stem, out the gills, rim to crown on the cap,
    the tube's radius on a root."""
    out = {}
    for name, make, seed, budget, by in grow.GROWN:
        with _Tags(RES[name]) as t:
            v, f = MAKERS.get(name, make)(seed)
        assert len(t.tags) == len(v), (name, len(t.tags), len(v))
        out[name] = (grow._normalise(grow._to_page(v), by), f, t.tags, budget)
    return out


def shade(tags, seed):
    """One grey value per vertex, before the baked shadow: what the piece is made of, not how it is lit."""
    rng = random.Random(seed)
    roots = [r for kind, r in tags if kind == ROOT]
    rmax = max(roots) if roots else 1.0
    out = []
    for kind, t in tags:
        n = rng.uniform(-1, 1)
        if kind == CAP:  # darker toward the crown, as caps age from the middle; speckled, but not at the crown's point,
            # where the ring's vertices meet and differing values would draw a star
            g = 1.0 - 0.22 * t ** 1.5 + 0.07 * n * (1 - t)
        elif kind == GILL:  # the underside, a step down from the top, so the rim shows as a line
            g = 0.62 + 0.05 * n
        elif kind == STEM:  # well under the cap, darkest at the foot: the cap glows, the stem holds it up
            g = 0.3 + 0.2 * t + 0.03 * n
        else:  # bark: darker where thick, the tips and hair-roots at the page's full root colour, which is dark already
            g = 1.0 - 0.3 * (t / rmax) ** 0.6 + 0.05 * n
        out.append(max(0.0, min(1.0, g)))
    return out


# Where each piece grows from, for the bake: the surface it sits on while its shadow is baked (page axes, unit size).
GROUND = {"root_hang": "roof", "root_creep": "wall", "mush_clump": "floor", "mush_colony": "floor"}


def build(collection=None, bake=True, samples=32):
    """The four pieces as Blender objects, named as the kit names them, base on y=0 and centred like grow.grown()'s.
    Returns {piece: object}. Needs bpy."""
    import bpy
    import numpy as np

    scene = bpy.context.scene
    collection = collection or scene.collection
    out = {}
    for name, (verts, faces, tags, budget) in pieces().items():
        me = bpy.data.meshes.new(name)
        me.from_pydata(verts, [], faces)
        me.validate()
        ob = bpy.data.objects.new(name, me)
        collection.objects.link(ob)
        # the same shift fit() makes: base on y=0, centred on x and z
        v = np.array(verts)
        lo, hi = v.min(axis=0), v.max(axis=0)
        shift = (-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2)
        me.transform(__import__("mathutils").Matrix.Translation(shift))
        for p in me.polygons:
            p.use_smooth = True
        _sharp_rims(me, tags)
        # one colour per vertex, not per face corner: a corner colour would split every vertex in the export
        col = me.color_attributes.new("Col", "BYTE_COLOR", "POINT")
        for i, g in enumerate(shade(tags, seed=len(verts))):
            col.data[i].color = (g, g, g, 1.0)
        _weld(me)
        col = me.color_attributes["Col"]
        ao = _bake_ao(ob, GROUND[name], samples, floor=0.5 if name.startswith("root") else 0.25) if bake else [1.0] * len(me.vertices)
        for i, a in enumerate(ao):
            g = col.data[i].color[0] * a
            col.data[i].color = (g, g, g, 1.0)
        me.color_attributes.active_color = col
        me.color_attributes.render_color_index = me.color_attributes.active_color_index
        out[name] = ob
    return out


def _sharp_rims(me, tags):
    """Marks the ring of edges round each cap's rim sharp, so the export splits the normals there."""
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(me)
    rim = {i for i, (kind, t) in enumerate(tags) if kind == CAP and t == 0}
    for e in bm.edges:
        if e.verts[0].index in rim and e.verts[1].index in rim:
            e.smooth = False
    bm.to_mesh(me)
    bm.free()


def _weld(me):
    """Joins vertices that sit on one point (each cap's crown, where its last ring closes), so the crown shades as one
    point instead of a star of separate normals."""
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bm.to_mesh(me)
    bm.free()


def _bake_ao(ob, ground, samples, floor):
    """Cycles ambient occlusion, with a stand-in floor, wall or roof under the piece. Returns a list, one value per
    vertex (the mean of its corners), 0 dark to 1 open."""
    import bpy
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.world = scene.world or bpy.data.worlds.new("World")
    hidden = [o for o in scene.objects if o is not ob and not o.hide_render]
    for o in hidden:
        o.hide_render = True
    # the surface the piece grows from, just past its bounds, so the contact shadow bakes in
    bpy.ops.mesh.primitive_plane_add(size=6)
    plane = bpy.context.active_object
    xs = [v.co for v in ob.data.vertices]
    lo = [min(c[i] for c in xs) for i in range(3)]
    hi = [max(c[i] for c in xs) for i in range(3)]
    if ground == "floor":  # page axes, Y up: the plane is XY in Blender's eyes, so turn it flat onto y = base
        plane.rotation_euler = (math.radians(90), 0, 0)
        plane.location = (0, lo[1] - 0.005, 0)
    elif ground == "roof":
        plane.rotation_euler = (math.radians(90), 0, 0)
        plane.location = (0, hi[1] + 0.005, 0)
    else:  # wall: behind the mat, which is pressed flat along z
        plane.location = (0, 0, lo[2] - 0.005)
    me = ob.data
    mat = bpy.data.materials.new(ob.name + "_bake")
    ob.data.materials.append(mat)
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    attr = me.color_attributes.new("AO", "FLOAT_COLOR", "CORNER")
    me.color_attributes.active_color = attr
    bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
    total, n = [0.0] * len(me.vertices), [0] * len(me.vertices)
    for loop in me.loops:
        total[loop.vertex_index] += attr.data[loop.index].color[0]
        n[loop.vertex_index] += 1
    ao = [t / max(k, 1) for t, k in zip(total, n)]
    me.color_attributes.remove(attr)
    me.materials.clear()
    bpy.data.materials.remove(mat)
    bpy.data.objects.remove(plane)
    for o in hidden:
        o.hide_render = False
    return [floor + (1 - floor) * a for a in ao]  # never quite black: the cave light reaches a little into every crevice


def _counts():
    for name, (v, f, tags, budget) in pieces().items():
        before = grow.grown()[name]
        print(f"{name}: {len(f)} faces (budget {budget}; full detail {len(before[1])}), {len(v)} vertices")


if __name__ == "__main__":
    if "--counts" in sys.argv:
        _counts()
        sys.exit(0)
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--samples", type=int, default=32)
    a = ap.parse_args()
    import bpy
    bpy.ops.wm.read_factory_settings(use_empty=True)
    obs = build(samples=a.samples)
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(a.out), export_format="GLB", export_yup=False,
                              export_vertex_color="ACTIVE", export_normals=True, export_texcoords=False,
                              export_materials="NONE", export_apply=True)
    print(f"wrote {a.out}: {os.path.getsize(a.out) // 1024} KB; " +
          ", ".join(f"{n} {len(o.data.polygons)} faces" for n, o in obs.items()))
