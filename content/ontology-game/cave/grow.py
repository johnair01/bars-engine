"""The cave's grown pieces: roots and mushrooms from tools/blender-cloud/procgen.py, turned into kit pieces.

Pure Python, no bpy: build_kit.py calls `grown()` and turns each (verts, faces) into a Blender object, decimates it to its
face budget and exports it with the rest of the kit. procgen is Z up; the kit is in the page's axes (Y up), so each point
(x, y, z) becomes (x, z, -y), a quarter turn about x that keeps the faces' winding.

Wendell, 2026-10-13: "more fractal and natural", "so they aren't so upright", "how the mushrooms and roots cluster",
"let's wire this into the cave". One row per piece in GROWN: the piece, what procgen makes, its seed, its face budget, and
how it is sized. "height": one unit high, base on y=0, centred on x and z (the kit's rule). "span": the widest side is
one unit, so a mat or a clump is sized by how far it spreads. A hanging root grows down from where it starts, so its
thick end is at the top, y=1, the way root_curl hangs (cave.js mounts it with `into`).

    python3 content/ontology-game/cave/grow.py     prints each piece's size and face count before decimating
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "tools", "blender-cloud"))
import procgen  # noqa: E402

# Fewer sides on each tube than procgen's default 7 and 4: a root in the cave is a few pixels across on a phone, and the
# decimation that follows keeps the silhouette better from a lighter start (choice).
TUBE_SIDES, FIBER_SIDES = 5, 3


def _root_hang(seed):
    # roots coming through the roof: three hanging systems from one point, so they braid, with few hair-roots
    return procgen.root_cluster(seed=seed, kind="knot", count=3, style="hanging", spread=0.3)


def _root_creep(seed):
    # roots along the wall: creeping systems started on a line so they overlap into a mat, pressed flat against the stone
    v, f = procgen.root_cluster(seed=seed, kind="mat", count=5, style="creeping", spread=0.2)
    return [(x, y, z * 0.3) for x, y, z in v], f


def _mush_clump(seed):
    v, f, _bases = procgen.mushroom_cluster(seed=seed, kind="clump", count=7, forms=("bell", "cone", "dome"))
    return v, f


def _mush_colony(seed):
    # the pool's colony: a clump with the mycelium threads showing between the stems
    return procgen.colony(seed=seed, count=9, forms=("dome", "bell", "parasol", "bulbous"))


GROWN = [
    # piece, maker, seed, faces, sized by
    ("root_hang", _root_hang, 11, 1400, "height"),
    ("root_creep", _root_creep, 5, 1800, "span"),
    ("mush_clump", _mush_clump, 3, 2200, "span"),
    ("mush_colony", _mush_colony, 7, 3000, "span"),
]


def _to_page(verts):
    return [(x, z, -y) for x, y, z in verts]


def _normalise(verts, by):
    xs, ys, zs = zip(*verts)
    lo = (min(xs), min(ys), min(zs))
    hi = (max(xs), max(ys), max(zs))
    cx, cz = (lo[0] + hi[0]) / 2, (lo[2] + hi[2]) / 2
    unit = (hi[1] - lo[1]) if by == "height" else max(hi[0] - lo[0], hi[2] - lo[2])
    return [((x - cx) / unit, (y - lo[1]) / unit, (z - cz) / unit) for x, y, z in verts]


def grown():
    """{piece: (verts, faces, faces_budget)} in the page's axes, sized as GROWN says. The same every run."""
    procgen.ROOT_SEGMENTS, procgen.FIBER_SEGMENTS = TUBE_SIDES, FIBER_SIDES
    out = {}
    for name, make, seed, budget, by in GROWN:
        v, f = make(seed)
        out[name] = (_normalise(_to_page(v), by), f, budget)
    return out


if __name__ == "__main__":
    for name, (v, f, budget) in grown().items():
        xs, ys, zs = zip(*v)
        print(f"{name}: {len(f)} faces (budget {budget}), size {max(xs) - min(xs):.2f} x {max(ys) - min(ys):.2f} x "
              f"{max(zs) - min(zs):.2f}")
