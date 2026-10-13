"""Builds a 3D piece in Blender from one picture of it, and says how well the model matches the picture.

The picture is concept art: one object, seen from the front, on a plain background (cave studio, Wendell's ruling
cs-chatgpt-ai-art: ChatGPT art is concept only, and the piece is rebuilt by us). The tool reads the object's outline
from the picture and builds the shape one of two ways:

  lathe    turns the outline around its centre line, for round things: a stalagmite, a mushroom, a pot.
  inflate  fills the outline with overlapping balls as thick as the shape is wide at each point (Blender metaballs),
           for things with a bend in them: a root, a branch, a lumpy stone.
  crystals splits the picture by colour into crystal and rock, makes one six-sided prism per crystal tip it finds in
           the outline, and inflates the rock bed under them, for a crystal cluster.
  mushrooms finds each cap by its saturated colour, lathes it as a smooth dome with a lip and gills, follows its stem
           down to the dark bed and sweeps a round stem along it, and inflates the bed, for a cluster of mushrooms (J3).
  roots    rebuilds the thick body of the outline as a braid of strands twisting down from the roof, and sweeps a
           tapering tube along each centre line of the fine roots outside it, for a hanging root knot (J3).

With a box from outline (objects.py passes one for picture(..., texture=True)), the J3 modes also lay the picture on
the piece as its colour, projected from the front (J3 round 2).

Then it lays the finished mesh flat against the picture and measures the overlap of the two outlines (intersection
over union, 1.0 is a perfect match), and renders the model from the front and from three-quarters so it can be put
beside the picture.

Run with Blender's Python module (bpy 5.2.2, Python 3.13; README.md here):
    python from_picture.py PICTURE OUT.glb --mode lathe --height 3 --name stone_spire [--faces 600] [--render DIR] [--flat]
Prints one REPORT line of JSON: name, mode, faces, size, outline match.
The GLB is in the page's own axes (Y up, front toward +Z), base on y=0, centred on x=0, like the cave kit.
"""
import argparse
import json
import math
import os
import sys

import bpy
import bmesh
import numpy as np

MAX_SIDE = 160  # the outline is read at this many pixels along the picture's longer side
MODES = ("lathe", "inflate", "crystals", "mushrooms", "roots")
COLOUR = ("crystals", "mushrooms")  # modes that read the picture's colours as well as its outline
FINE = {"mushrooms": 320, "roots": 320}  # modes that read the outline finer than MAX_SIDE
CORE = 8  # roots: pixels from the edge (on the 320 grid) past which the outline is the body, not a tendril


# ---- reading the outline -------------------------------------------------------------------------
def load_rgb(path):
    img = bpy.data.images.load(os.path.abspath(path))
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, img.channels)[::-1]  # top row first
    rgb = px[:, :, :3]
    if img.channels == 4:  # a transparent picture: transparent pixels are background
        rgb = np.where(px[:, :, 3:4] < 0.5, np.nan, rgb)
    return rgb


def shrink(rgb, side):
    h, w = rgb.shape[:2]
    k = max(1, int(math.ceil(max(h, w) / side)))
    h2, w2 = h // k, w // k
    return np.nanmean(rgb[:h2 * k, :w2 * k].reshape(h2, k, w2, k, 3), axis=(1, 3))


def otsu(v):
    hist, edges = np.histogram(v, bins=64)
    mids = (edges[:-1] + edges[1:]) / 2
    best, cut = -1, mids[0]
    for i in range(1, 64):
        w0, w1 = hist[:i].sum(), hist[i:].sum()
        if not w0 or not w1:
            continue
        m0 = (hist[:i] * mids[:i]).sum() / w0
        m1 = (hist[i:] * mids[i:]).sum() / w1
        between = w0 * w1 * (m0 - m1) ** 2
        if between > best:
            best, cut = between, mids[i]
    return cut


def flood(mask, seeds):
    """Pixels of mask reachable from seeds (4-neighbour)."""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    stack = [s for s in seeds if mask[s]]
    for s in stack:
        seen[s] = True
    while stack:
        y, x = stack.pop()
        for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not seen[yy, xx]:
                seen[yy, xx] = True
                stack.append((yy, xx))
    return seen


def outline(path, colour=False, flat=False, side=MAX_SIDE, box=False):
    """The object's mask, top row first: background is the colour around the picture's edge. With colour, also
    returns the picture's colours on the same grid. flat=True is for a picture on a flat plain background (J3's
    pictures): anything that differs from the background by more than a few times the edge's own noise is the
    object, so pale parts close to the background's grey (a lilac stem, a lit crystal face) still count. Without it
    the cut is Otsu's, which suits the stand-ins' textured paper and keeps the kit's dressing as built. side is the
    grid's longer side in pixels; the J3 modes read at twice the usual, so a stem or a tendril is more than a pixel.
    With box, also returns where the grid lies on the picture (see picture_uv)."""
    full = load_rgb(path)
    rgb = shrink(full, side * 3)  # read finely, so a thin dark outline still closes the shape
    nan = np.isnan(rgb).any(axis=2)
    rgb = np.nan_to_num(rgb)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    edge_dist = np.sqrt(((border - bg) ** 2).sum(axis=1))
    cut = max(4 * float(np.percentile(edge_dist, 99)), 0.06) if flat else max(otsu(dist[~nan]), 0.06)
    mask = (dist > cut) & ~nan
    # keep the largest piece, then fill its holes
    h, w = mask.shape
    best = np.zeros_like(mask)
    left = mask.copy()
    while left.any():
        y, x = np.argwhere(left)[0]
        part = flood(left, [(y, x)])
        left &= ~part
        if part.sum() > best.sum():
            best = part
    edge = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    outside = flood(~best, edge)
    mask = ~outside
    k = max(1, int(math.ceil(max(h, w) / side)))
    h2, w2 = h // k, w // k
    mask = mask[:h2 * k, :w2 * k].reshape(h2, k, w2, k).mean(axis=(1, 3)) >= 0.5
    small = rgb[:h2 * k, :w2 * k].reshape(h2, k, w2, k, 3).mean(axis=(1, 3))
    ys, xs = np.nonzero(mask)
    crop = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    out = (mask[crop], small[crop]) if colour else mask[crop]
    if not box:
        return out
    step = k * max(1, int(math.ceil(max(full.shape[:2]) / (side * 3))))  # picture pixels per grid pixel
    return out, {"path": path, "x0": int(xs.min()) * step, "y0": int(ys.min()) * step, "step": step,
                 "w": full.shape[1], "h": full.shape[0], "bg": [float(c) for c in bg], "cut": float(cut)}


def distance(mask):
    """Distance in pixels from each inside pixel to the outline (two-pass chamfer)."""
    h, w = mask.shape
    big = 1e9
    d = np.where(mask, big, 0.0)
    d = np.pad(d, 1)
    a, b = 1.0, 1.4142
    for y in range(1, h + 1):
        for x in range(1, w + 1):
            if d[y, x]:
                d[y, x] = min(d[y, x], d[y - 1, x] + a, d[y, x - 1] + a, d[y - 1, x - 1] + b, d[y - 1, x + 1] + b)
    for y in range(h, 0, -1):
        for x in range(w, 0, -1):
            if d[y, x]:
                d[y, x] = min(d[y, x], d[y + 1, x] + a, d[y, x + 1] + a, d[y + 1, x + 1] + b, d[y + 1, x - 1] + b)
    return d[1:-1, 1:-1]


def saturation(rgb):
    hi, lo = rgb.max(axis=2), rgb.min(axis=2)
    return np.where(hi > 1e-6, (hi - lo) / np.maximum(hi, 1e-6), 0)


def prism(bm, base, tip, radius, sides=6, point=1.8, turn=0.0):
    """A crystal: a six-sided prism from base toward tip, ending in a point point*radius long."""
    base, tip = np.array(base, float), np.array(tip, float)
    axis = tip - base
    length = np.linalg.norm(axis)
    if length < 1e-6:
        return
    axis /= length
    side = np.cross(axis, (0, 0, 1.0))
    if np.linalg.norm(side) < 1e-3:
        side = np.cross(axis, (1.0, 0, 0))
    side /= np.linalg.norm(side)
    up = np.cross(axis, side)
    neck = base + axis * max(length - point * radius, length * 0.4)
    rings = []
    for c in (base, neck):
        rings.append([bm.verts.new(tuple(c + radius * (math.cos(a) * side + math.sin(a) * up)))
                      for a in (turn + 2 * math.pi * j / sides for j in range(sides))])
    apex = bm.verts.new(tuple(tip))
    a, b = rings
    for j in range(sides):
        k = (j + 1) % sides
        bm.faces.new((a[j], a[k], b[k], b[j]))
        bm.faces.new((b[j], b[k], apex))
    bm.faces.new(list(reversed(a)))


def across(mask, x, y, px, py, most=60):
    """Width in pixels of the run of mask through (x, y) along the direction (px, py)."""
    h, w = mask.shape
    n = 0
    for sgn in (1, -1):
        for k in range(1, most):
            xx, yy = int(round(x + sgn * px * k)), int(round(y + sgn * py * k))
            if not (0 <= yy < h and 0 <= xx < w and mask[yy, xx]):
                break
            n += 1
    return n + 1


def crystals(name, mask, rgb, unit, seed=3):
    """A crystal cluster. The saturated part of the picture is crystal, the rest is the rock bed. Each crystal tip is
    a peak of the crystal outline's reach from the cluster's foot, and becomes one prism pointing at it, as wide as
    the picture's crystal is there. Prisms alternate a little toward and away from the viewer, so the cluster has
    depth. The rock bed is inflated from its outline and kept low-poly."""
    rng = np.random.default_rng(seed)
    h, w = mask.shape
    sat, val = saturation(rgb), rgb.max(axis=2)
    rock = mask & (sat < max(0.18, otsu(sat[mask]))) & (val < 0.6)  # grey and dark; a white highlight is crystal
    crystal = mask & ~rock
    ys, xs = np.nonzero(crystal)
    foot = np.array([np.median(xs), ys.max() - 0.12 * h])  # picture coords, y down
    # reach of the crystal outline from the foot, per degree from straight up
    ang = np.degrees(np.arctan2(xs - foot[0], foot[1] - ys))
    reach = np.hypot(xs - foot[0], ys - foot[1])
    bins = np.full(181, 0.0)
    for a, r in zip(np.round(ang).astype(int) + 90, reach):
        if 0 <= a <= 180 and r > bins[a]:
            bins[a] = r
    sm = np.convolve(bins, np.ones(5) / 5, mode="same")
    tips = []
    for a in range(3, 178):
        win = sm[max(0, a - 6):a + 7]
        if sm[a] > 0.18 * h and sm[a] == win.max() and sm[a] - win.min() > 0.03 * h:
            if not tips or a - tips[-1] >= 6:
                tips.append(a)
    bm = bmesh.new()
    for i, a in enumerate(tips):
        th = math.radians(a - 90)
        L = bins[max(0, a - 2):a + 3].max()
        dx, dy = math.sin(th), -math.cos(th)
        samples = [across(crystal, foot[0] + dx * L * t, foot[1] + dy * L * t, dy, -dx) for t in np.linspace(0.55, 0.85, 7)]
        r = max(1.5, float(np.median(samples)) * 0.5)
        r = min(r, 0.09 * h)
        depth = rng.uniform(0.3, 1.0) * (1 if i % 2 else -1) * L * 0.35
        to3 = lambda px, py, z=0.0: ((px - w / 2) * unit, (h - 1 - py) * unit, z * unit)
        base = to3(foot[0] + dx * L * 0.12, foot[1] + dy * L * 0.12, 0)
        tip = to3(foot[0] + dx * L, foot[1] + dy * L, depth)
        prism(bm, base, tip, r * unit * 0.95, turn=rng.uniform(0, math.pi / 3))
    ob = to_object(name, bm)
    for p in ob.data.polygons:
        p.use_smooth = False
    parts = [ob]
    if rock.sum() > 0.04 * mask.sum():
        bed = inflate(name + "_bed", rock, unit, stride=2, swell=1.7)
        m = bed.modifiers.new("low", "DECIMATE")
        m.ratio = min(1.0, 220 / max(1, len(bed.data.polygons)))
        bpy.context.view_layer.update()
        bed.data = bpy.data.meshes.new_from_object(bed.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        bed.modifiers.clear()
        for p in bed.data.polygons:
            p.use_smooth = False
        parts.append(bed)
    return parts, len(tips)


def pieces(mask):
    """The connected pieces of a mask, largest first."""
    left, out = mask.copy(), []
    while left.any():
        y, x = np.argwhere(left)[0]
        part = flood(left, [(y, x)])
        left &= ~part
        out.append(part)
    return sorted(out, key=lambda p: -int(p.sum()))


def filled(mask):
    """The mask with its holes filled."""
    h, w = mask.shape
    edge = [(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)]
    return ~flood(~mask, edge)


def tube(bm, pts, radii, sides=6, tips=(True, True)):
    """A round tube through the 3D points pts, radii[i] wide at each; a pointed end where tips says so, else flat."""
    pts = [np.array(p, float) for p in pts]
    if len(pts) < 2:
        return
    rings, side_prev = [], None
    for i, (c, r) in enumerate(zip(pts, radii)):
        t = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        t /= max(np.linalg.norm(t), 1e-9)
        side = np.cross(t, (0, 0, 1.0)) if side_prev is None else side_prev - t * np.dot(side_prev, t)
        if np.linalg.norm(side) < 1e-6:
            side = np.cross(t, (1.0, 0, 0))
        side /= np.linalg.norm(side)
        side_prev = side
        up = np.cross(t, side)
        rings.append([bm.verts.new(tuple(c + r * (math.cos(a) * side + math.sin(a) * up)))
                      for a in (2 * math.pi * j / sides for j in range(sides))])
    for a, b in zip(rings, rings[1:]):
        for j in range(sides):
            k = (j + 1) % sides
            bm.faces.new((a[j], a[k], b[k], b[j]))
    for end, ring, nxt, sharp in ((0, rings[0], pts[1], tips[0]), (-1, rings[-1], pts[-2], tips[1])):
        if sharp:
            apex = bm.verts.new(tuple(pts[end] + (pts[end] - nxt) / max(np.linalg.norm(pts[end] - nxt), 1e-9) * radii[end]))
            for j in range(sides):
                k = (j + 1) % sides
                bm.faces.new((ring[j], ring[k], apex) if end else (ring[k], ring[j], apex))
        else:
            bm.faces.new(list(reversed(ring)) if end == 0 else ring)


def low_bed(name, bed, unit, faces=220, swell=1.6):
    """The rock or moss under a cluster: inflated from its outline, kept low-poly and faceted."""
    ob = inflate(name, bed, unit, stride=2, swell=swell)
    m = ob.modifiers.new("low", "DECIMATE")
    m.ratio = min(1.0, faces / max(1, len(ob.data.polygons)))
    bpy.context.view_layer.update()
    ob.data = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    ob.modifiers.clear()
    for p in ob.data.polygons:
        p.use_smooth = False
    return ob


def mushrooms(name, mask, rgb, unit, seed=5):
    """A mushroom cluster. Dark pixels are the bed (moss and stone). Each cap's dome is a piece of the picture's
    strongest colour; its rows set a smooth dome that is lathed, with a lip under the rim and gills closing in toward
    the stem. Each stem is followed down the picture from under its cap to the bed and swept as a round stem that
    flares at its foot. Caps step a little toward and away from the viewer so the cluster has depth, and each stem
    stands at its cap's depth. Returns the caps, the stems and the bed as three parts, and the number of caps."""
    rng = np.random.default_rng(seed)
    h, w = mask.shape
    sat, val = saturation(rgb), rgb.max(axis=2)
    bed = mask & (val < 0.5)
    bed_main = pieces(bed)[0] if bed.any() else bed
    seeds = pieces(mask & ~bed & (sat > 0.5))  # a cap's top: the strongest colour in the picture
    # a piece under an eighth of the largest is a highlight or a fleck at a cap's edge (J3's picture has two, at 0.09)
    seeds = [c for c in seeds if c.sum() >= 0.12 * seeds[0].sum()] if seeds else []
    to3 = lambda px, py, z: ((px - w / 2) * unit, (h - 1 - py) * unit, z)

    def run(r, x, lo, hi):
        """The run of mask in row r through column x, clipped to lo..hi; None if x is outside the mask."""
        x = int(round(x))
        if not (0 <= x < w and mask[r, x]):
            return None
        a = b = x
        while a - 1 >= max(0, lo) and mask[r, a - 1]:
            a -= 1
        while b + 1 <= min(w - 1, hi) and mask[r, b + 1]:
            b += 1
        return a, b

    # each cap: its dome is the coloured piece, row by row; under the rim, the gills close in toward the stem
    caps = []
    for c in seeds:
        ys, xs = np.nonzero(c)
        cx, cy = xs.mean(), ys.mean()
        if any(x0 <= cx <= x1 and y0 <= cy <= y1 for _, x0, x1, y0, y1, _, _ in caps):
            continue  # a highlight or a shadow on a cap already found
        # a cap drawn leaning: find its lean from the piece's shape (a cap is wider than it is tall, so its axis is
        # the direction it is thinnest in), and read its rows square to that axis
        f = np.argwhere(filled(c)).astype(float)
        centre = f.mean(axis=0)
        evals, evecs = np.linalg.eigh(np.cov((f - centre).T))
        ax = evecs[:, 0] if evecs[0, 0] <= 0 else -evecs[:, 0]  # (dy, dx), pointing up the picture
        lean = max(-0.6, min(0.6, math.atan2(-ax[1], -ax[0])))  # radians, positive leans right
        cs, sn = math.cos(lean), math.sin(lean)
        ry = (f[:, 0] - centre[0]) * cs + (f[:, 1] - centre[1]) * sn  # down the cap's own axis
        rx = (f[:, 1] - centre[1]) * cs - (f[:, 0] - centre[0]) * sn  # across it
        rows, rad = [], []
        for r in range(int(math.floor(ry.min())), int(math.ceil(ry.max())) + 1):
            sel = np.abs(ry - r) < 0.5
            if sel.any():
                rows.append(r)
                rad.append(max((rx[sel].max() - rx[sel].min() + 1) / 2, 0.5))
        rad = np.maximum.accumulate(rad)  # a dome widens downward
        rim, top, bottom = float(rad[-1]), rows[0], rows[-1]
        t = (np.array(rows) - top + 0.5) / (bottom - top + 0.5)
        # the dome as one smooth curve, r = rim (1 - (1 - t)^2)^a, with a fitted to the rows read, so the cap is a
        # clean dome rather than the picture's pixel steps lathed into lumps
        a = min(np.linspace(0.2, 1.2, 21), key=lambda a: float(((rim * (1 - (1 - t) ** 2) ** a - rad) ** 2).sum()))
        gill = max(2.0, 0.3 * (bottom - top))
        # the coloured dome stops above the rim: the gills' pale skirt below it is wider, so the rim is as wide as
        # the outline is just under the dome (held to 1.6 times the dome, so a neighbour's run does not count)
        cxp, wide = centre[1], rim
        for j in range(int(gill) + 1):
            yy = int(round(centre[0] + bottom + j))
            r = run(yy, cxp, int(cxp - 1.6 * rim), int(cxp + 1.6 * rim)) if 0 <= yy < h else None
            if r and r[0] > cxp - 1.6 * rim and r[1] < cxp + 1.6 * rim and (r[1] - r[0] + 1) / 2 > wide:
                wide = (r[1] - r[0] + 1) / 2
        k = wide / rim
        dome = [(top + (bottom - top) * u, rim * (1 - (1 - u) ** 2) ** a * (1 + (k - 1) * u ** 3))
                for u in np.linspace(0.06, 1, 10)]
        rim = wide
        # a thin lip that turns under the rim, then the gills closing in toward the stem
        under = [(bottom + 0.1 * gill, 1.03 * rim), (bottom + 0.3 * gill, 0.98 * rim), (bottom + 0.7 * gill, 0.62 * rim),
                 (bottom + gill, 0.26 * rim)]
        caps.append((dome + under, centre[1] - rim, centre[1] + rim, centre[0] + top, centre[0] + bottom + gill,
                     centre, lean))
    cbm, depth, feet = bmesh.new(), [], []
    seg = 16
    for i, (prof, x0, x1, y0, y1, centre, lean) in enumerate(caps):
        width = x1 - x0
        cs, sn = math.cos(lean), math.sin(lean)
        z = 0.0 if i == 0 else (1 if i % 2 else -1) * rng.uniform(0.35, 0.8) * width * unit * 0.6
        at = lambda r, xr, zr: to3(centre[1] + r * sn + xr * cs, centre[0] + r * cs - xr * sn, z + zr * unit)
        depth.append((x0, x1, y1, z))
        ringv = [[cbm.verts.new(at(r, rr * math.cos(2 * math.pi * j / seg), rr * math.sin(2 * math.pi * j / seg)))
                  for j in range(seg)] for r, rr in prof]
        top = cbm.verts.new(at(prof[0][0] - 0.06 * (prof[-5][0] - prof[0][0]), 0, 0))
        for j in range(seg):
            cbm.faces.new((ringv[0][(j + 1) % seg], ringv[0][j], top))
        for ra, rb in zip(ringv, ringv[1:]):
            for j in range(seg):
                k = (j + 1) % seg
                cbm.faces.new((ra[j], ra[k], rb[k], rb[j]))
        cbm.faces.new(list(reversed(ringv[-1])))
        r_end = prof[-1][0]
        feet.append((centre[1] + r_end * sn, centre[0] + r_end * cs, prof[-1][1], prof[-5][1], z))
    caps_ob = to_object(name, cbm)
    for p in caps_ob.data.polygons:
        p.use_smooth = True
    parts = [caps_ob]
    bed_all = filled(bed_main)
    # each stem: followed down the picture from under its cap to the bed, row by row, keeping to the pale run
    # nearest the line so far and no wider than the stem already is, then swept as one round stem; where another
    # cap hides it, it carries on straight
    free = mask & ~silhouette(caps_ob, mask.shape, unit) & ~bed_all
    sbm = bmesh.new()
    for fx, fy, foot, rim, z in feet:
        x, half, gap, line = fx, None, 0, []
        y = int(round(fy))
        line.append((fx, fy - 2 * foot, foot))
        while y < h - 1:
            y += 1
            xi = int(round(x))
            if 0 <= xi < w and bed_all[y, xi]:
                line.append((x, y + 2, line[-1][2]))
                break
            reach = int(max(2, 1.6 * (half or foot)))
            row = free[y, max(0, xi - reach):min(w, xi + reach + 1)]
            if not row.any():
                gap += 1
                line.append((x, y, line[-1][2]))
                continue
            gap = 0
            cols = np.nonzero(row)[0] + max(0, xi - reach)
            near = cols[np.argmin(np.abs(cols - x))]
            r = run(y, near, near - reach, near + reach)
            if r is None:
                continue
            lo, hi = r
            span = (hi - lo + 1) / 2
            most = max(1.0, 0.4 * rim) if half is None else min(half * 1.15, 0.4 * rim)  # a stem is no wider
            span = min(span, most)                                                      # than 0.4 of its cap
            mid = (lo + hi) / 2 if (hi - lo + 1) / 2 <= most else x  # a wider run is stems merging: hold the line
            x = 0.6 * x + 0.4 * mid
            half = span if half is None else 0.7 * half + 0.3 * span
            line.append((x, y, half))
        if len(line) < 3:
            continue
        xs = np.convolve(np.pad([p[0] for p in line], 3, mode="edge"), np.ones(7) / 7, mode="valid")
        hs = np.convolve(np.pad([p[2] for p in line], 3, mode="edge"), np.ones(7) / 7, mode="valid")
        ys = [p[1] for p in line]
        idx = list(range(0, len(line), 3)) + ([len(line) - 1] if (len(line) - 1) % 3 else [])
        n = len(idx)
        pts = [to3(xs[i], ys[i], z) for i in idx]
        # a stem flares into the gills at its top and into the moss at its foot
        flare = lambda u: 1 + 0.6 * max(0, 0.2 - u) / 0.2 + 0.35 * max(0, u - 0.7) / 0.3
        radii = [hs[i] * unit * flare(k / max(1, n - 1)) for k, i in enumerate(idx)]
        tube(sbm, pts, radii, sides=8, tips=(False, False))
    if sbm.verts:
        ob = to_object(name + "_stems", sbm)
        for p in ob.data.polygons:
            p.use_smooth = True
        parts.append(ob)
    else:
        sbm.free()
    if bed_main.sum() > 0.03 * mask.sum():
        parts.append(low_bed(name + "_bed", bed_all, unit, swell=1.35))
    return parts, len(caps)


def fit_faces(ob, faces):
    """Decimates in place to at most faces, keeping the piece where it is."""
    if len(ob.data.polygons) > faces:
        m = ob.modifiers.new("fit", "DECIMATE")
        m.ratio = faces / len(ob.data.polygons)
        bpy.context.view_layer.update()
        ob.data = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear()
    for p in ob.data.polygons:
        p.use_smooth = True


def thin(mask):
    """The mask thinned to lines one pixel wide (Zhang and Suen)."""
    img = np.pad(mask.astype(np.uint8), 1)
    changed = True
    while changed:
        changed = False
        for step in (0, 1):
            P = img
            p2, p3, p4, p5 = P[:-2, 1:-1], P[:-2, 2:], P[1:-1, 2:], P[2:, 2:]
            p6, p7, p8, p9 = P[2:, 1:-1], P[2:, :-2], P[1:-1, :-2], P[:-2, :-2]
            c = P[1:-1, 1:-1]
            ring = [p2, p3, p4, p5, p6, p7, p8, p9, p2]
            B = sum(p.astype(int) for p in ring[:8])
            A = sum(((ring[i] == 0) & (ring[i + 1] == 1)).astype(int) for i in range(8))
            m1, m2 = (p2 * p4 * p6, p4 * p6 * p8) if step == 0 else (p2 * p4 * p8, p2 * p6 * p8)
            gone = (c == 1) & (B >= 2) & (B <= 6) & (A == 1) & (m1 == 0) & (m2 == 0)
            if gone.any():
                changed = True
                img[1:-1, 1:-1][gone] = 0
    return img[1:-1, 1:-1].astype(bool)


def centre_lines(skel, d):
    """The thinned mask as lines from end or fork to end or fork, with the short spurs a thick shape's thinning
    leaves at its edges dropped."""
    pts = set(map(tuple, np.argwhere(skel)))
    nb = lambda p: [(p[0] + dy, p[1] + dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1)
                    if (dy or dx) and (p[0] + dy, p[1] + dx) in pts]
    deg = {p: len(nb(p)) for p in pts}
    nodes = {p for p in pts if deg[p] != 2}
    used, lines = set(), []
    for n in sorted(nodes):
        for q in nb(n):
            if (n, q) in used:
                continue
            line, prev, cur = [n, q], n, q
            used |= {(n, q), (q, n)}
            while cur not in nodes:
                nxt = [r for r in nb(cur) if r != prev and (cur, r) not in used]
                if not nxt:
                    break
                r = nxt[0]
                used |= {(cur, r), (r, cur)}
                line.append(r)
                prev, cur = cur, r
            lines.append(line)
    keep = []
    for line in lines:
        ends = [deg[line[0]], deg[line[-1]]]
        root = line[0] if ends[0] != 1 else line[-1]
        if 1 in ends and 2 not in ends and min(ends) == 1 and max(ends) > 2 and len(line) < 1.3 * d[root]:
            continue  # a spur: shorter than the shape is thick where it leaves
        keep.append((line, ends))
    return keep


def roots(name, mask, unit, seed=11, strands=4):
    """A root knot that hangs from the roof: a braid of a few thick strands twisting down through the body of the
    outline, and a thin tendril falling along each centre line of the picture's fine roots. The body is where the
    outline is thicker than CORE pixels from its edge; there the picture's strands overlap into one filled shape, so
    they are rebuilt as a braid, each strand winding round the body's middle as wide as the body is at that row. The
    tendrils outside it are swept as tubes that taper to a point at their free end and reach back into the body at the
    other, swinging toward or away from the viewer the further they fall, so they hang in depth."""
    rng = np.random.default_rng(seed)
    h, w = mask.shape
    d = distance(mask)
    core = d > CORE
    to3 = lambda px, py, z: ((px - w / 2) * unit, (h - 1 - py) * unit, z * unit)
    bm = bmesh.new()
    # the braid: each row's widest run of body gives its middle and half-width
    rows = []
    for y in range(h):
        xs = np.nonzero(core[y])[0]
        if len(xs):
            body = max((r for r in np.split(xs, np.nonzero(np.diff(xs) > 1)[0] + 1)), key=len)
            rows.append((y, (body[0] + body[-1]) / 2, (body[-1] - body[0] + 1) / 2 + CORE))
    if rows:
        y0, y1 = rows[0][0], rows[-1][0]
        span = max(1, y1 - y0)
        ys = np.array([r[0] for r in rows], float)
        mid = np.convolve(np.pad([r[1] for r in rows], 4, mode="edge"), np.ones(9) / 9, mode="valid")
        half = np.convolve(np.pad([r[2] for r in rows], 4, mode="edge"), np.ones(9) / 9, mode="valid")
        turns = 1.25  # how many times a strand winds round the braid from the roof to the body's tip
        for i in range(strands):
            phase = 2 * math.pi * i / strands + rng.uniform(-0.3, 0.3)
            pts, radii = [], []
            for k in list(range(0, len(rows), 4)) + ([len(rows) - 1] if (len(rows) - 1) % 4 else []):
                t = (ys[k] - y0) / span
                a = phase + 2 * math.pi * turns * t
                swing = 0.55 * half[k]
                pts.append(to3(mid[k] + swing * math.sin(a), ys[k], 0.6 * swing * math.cos(a)))
                radii.append(max(0.8, 0.5 * half[k] * (1 - 0.35 * t)) * unit)
            pts[0] = (pts[0][0], (h - 1 - y0 + 1) * unit, pts[0][2])  # every strand starts at the roof
            tube(bm, pts, radii, sides=8, tips=(False, True))
    # the tendrils: centre lines of what lies outside the body
    near = core.copy()
    for _ in range(3):
        near = near | np.roll(near, 1, 0) | np.roll(near, -1, 0) | np.roll(near, 1, 1) | np.roll(near, -1, 1)
    fine = mask & ~near
    lines = centre_lines(thin(fine), d)
    deep = core.copy()
    for _ in range(6):
        deep = deep | np.roll(deep, 1, 0) | np.roll(deep, -1, 0) | np.roll(deep, 1, 1) | np.roll(deep, -1, 1)
    # how far each tendril swings toward or away from the viewer: a smooth field, so the pieces a fork splits one
    # tendril into still meet, zero where the tendrils leave the body and growing with how far they have fallen
    low = np.array([np.nonzero(core[:, x])[0].max() if core[:, x].any() else -1 for x in range(w)], float)
    have = np.nonzero(low >= 0)[0]
    low = np.interp(np.arange(w), have, low[have]) if len(have) else np.full(w, h / 2)
    sway = lambda x, y: (0.12 * w * math.sin(2 * math.pi * x / (0.45 * w) + 1.3)
                         * min(1.0, max(0.0, (y - low[min(w - 1, max(0, x))] + 0.25 * h) / (0.5 * h))))
    kept = 0
    for line, ends in lines:
        if len(line) < 4:
            continue
        # the end that touches the body is where the tendril grows from; it reaches a few pixels into the body
        a_in, b_in = deep[line[0]], deep[line[-1]]
        if b_in and not a_in:
            line, ends = line[::-1], ends[::-1]
        if deep[line[0]]:
            (y, x), (y2, x2) = line[0], line[min(3, len(line) - 1)]
            line = [(int(round(y + (y - y2) * 2)), int(round(x + (x - x2) * 2)))] + list(line)
        step = 3
        idx = list(range(0, len(line), step))
        if idx[-1] != len(line) - 1:
            idx.append(len(line) - 1)
        n = len(idx)
        r = [max(0.7, 1.1 * float(d[min(h - 1, max(0, y)), min(w - 1, max(0, x))])) for y, x in (line[i] for i in idx)]
        r = np.minimum(r, 1.3 * np.median(r))  # the end reaching into the body keeps the tendril's own width
        r = np.convolve(np.pad(r, 1, mode="edge"), np.ones(3) / 3, mode="valid")
        pts, radii = [], []
        for k, i in enumerate(idx):
            t = k / max(1, n - 1)
            y, x = line[i]
            pts.append(to3(x, y, sway(x, y)))
            radii.append(r[k] * (1 - 0.6 * max(0, t - 0.4) / 0.6 if ends[-1] == 1 else 1) * unit)
        tube(bm, pts, radii, sides=5, tips=(False, ends[-1] == 1))
        kept += 1
    ob = to_object(name, bm)
    for p in ob.data.polygons:
        p.use_smooth = True
    return [ob], strands + kept


# ---- the picture as a texture ---------------------------------------------------------------------
TEX_SIDE = 640  # the texture's longer side in pixels at most: J3's pictures are 640 square, so read at full size


def picture_uv(ob, box, shape, unit):
    """UVs that lay the picture on the piece from the front: each vertex takes the picture's colour where it sits in
    the front view, so a cap carries its spots and gills and the bed its moss, and the back mirrors the front. Run
    before place(), while the piece is still in the grid's own coordinates. The UVs cover the crop the texture is cut
    to (picture_texture)."""
    h, w = shape
    me = ob.data
    uv = me.uv_layers.new(name="picture")
    at = lambda co: (min(1, max(0, (co.x / unit + w / 2 + 0.5) / w)), min(1, max(0, 1 - ((h - 1) - co.y / unit + 0.5) / h)))
    for loop in me.loops:
        uv.data[loop.index].uv = at(me.vertices[loop.vertex_index].co)


def fill(rgb, known):
    """rgb with the pixels not known filled smoothly from the known ones around them (pull-push: average down a
    pyramid of halvings, then fill each level's holes from the coarser one), so the fill has no streaks."""
    if known.all() or not known.any():
        return rgb
    h, w = known.shape
    h2, w2 = (h + 1) // 2, (w + 1) // 2
    pad = lambda a: np.pad(a, [(0, h2 * 2 - h), (0, w2 * 2 - w)] + [(0, 0)] * (a.ndim - 2), mode="edge")
    wt = pad(known.astype(float)).reshape(h2, 2, w2, 2).sum(axis=(1, 3))
    acc = (pad(rgb * known[..., None])).reshape(h2, 2, w2, 2, 3).sum(axis=(1, 3))
    small = np.where(wt[..., None] > 0, acc / np.maximum(wt, 1e-9)[..., None], 0)
    small = fill(small, wt > 0)
    up = np.repeat(np.repeat(small, 2, 0), 2, 1)[:h, :w]
    return np.where(known[..., None], rgb, up)


def picture_texture(box, mask, name):
    """The picture cut to the piece's crop, with the background filled from the piece's own edge colours so no grey
    shows where a UV lands just outside the outline, at most TEX_SIDE pixels on its longer side. A pixel keeps its
    own colour only inside the outline (less its edge pixel, where the picture blends into the background) and away
    from the background's colour. Returns a packed Blender image."""
    h, w = mask.shape
    rgb = np.nan_to_num(load_rgb(box["path"]))
    s = box["step"]
    rgb = rgb[box["y0"]:box["y0"] + h * s, box["x0"]:box["x0"] + w * s]
    k = max(1, int(math.ceil(max(rgb.shape[:2]) / TEX_SIDE)))
    hh, ww = rgb.shape[0] // k, rgb.shape[1] // k
    rgb = rgb[:hh * k, :ww * k].reshape(hh, k, ww, k, 3).mean(axis=(1, 3))
    # background shows through the gaps inside the outline too, a little lighter or darker than at the edge
    known = np.sqrt(((rgb - np.array(box["bg"])) ** 2).sum(axis=2)) > max(2 * box["cut"], 0.12)
    grey = (saturation(rgb) < 0.08) & (np.abs(rgb.max(axis=2) - max(box["bg"])) < 0.2)  # a neutral grey near the
    known &= ~grey                                                                         # background's is a gap
    inner = mask & np.roll(mask, 1, 0) & np.roll(mask, -1, 0) & np.roll(mask, 1, 1) & np.roll(mask, -1, 1)
    up = np.repeat(np.repeat(inner, s, 0), s, 1)[:hh * k:k, :ww * k:k]
    known &= up[:hh, :ww] if up.shape[0] >= hh and up.shape[1] >= ww else np.pad(up, ((0, hh - up.shape[0]), (0, ww - up.shape[1])))
    rgb = fill(rgb, known)
    img = bpy.data.images.new(name, ww, hh)
    img.pixels[:] = np.concatenate([rgb[::-1], np.ones((hh, ww, 1))], axis=2).ravel().tolist()
    img.file_format = "JPEG"
    img.pack()
    return img


# ---- building ------------------------------------------------------------------------------------
def to_object(name, bm):
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def profile_rows(radius, top, bottom, most, tol=0.6):
    """The rows the lathe keeps: the fewest that hold the profile within tol pixels (Douglas-Peucker), so a dome
    keeps its curve and a thin lip is not stepped over."""
    keep = {top, bottom}

    def split(a, b):
        if b - a < 2:
            return
        ys = np.arange(a + 1, b)
        line = radius[a] + (radius[b] - radius[a]) * (ys - a) / (b - a)
        err = np.abs(radius[a + 1:b] - line)
        i = int(err.argmax())
        if err[i] > tol:
            keep.add(a + 1 + i)
            split(a, a + 1 + i)
            split(a + 1 + i, b)

    split(top, bottom)
    rows = sorted(keep, reverse=True)
    while len(rows) > most + 1:  # over budget: drop the row whose loss is least
        loss = [abs(radius[rows[i]] - (radius[rows[i - 1]] + radius[rows[i + 1]]) / 2) for i in range(1, len(rows) - 1)]
        rows.pop(1 + int(np.argmin(loss)))
    return rows


def lathe(name, mask, unit, segments=12, levels=40):
    """Turns the outline's half-width around the centre line. Each row's half-width is the mean of its left and right
    reach from the centre, so a picture drawn a little off true still gives a round piece."""
    h, w = mask.shape
    cols = np.arange(w)
    rows = [r for r in range(h) if mask[r].any()]
    centre = np.median([cols[mask[r]].mean() for r in rows])
    radius = np.zeros(h)
    for r in rows:
        c = cols[mask[r]]
        radius[r] = ((centre - c.min()) + (c.max() - centre) + 1) / 2
    k = np.array([1, 2, 3, 2, 1], float)
    radius = np.convolve(np.pad(radius, 2, mode="edge"), k / k.sum(), mode="valid")
    picks = profile_rows(radius, rows[0], rows[-1], levels)  # bottom row first
    bm = bmesh.new()
    ringz = []
    for r in picks:
        y = (h - 1 - r) * unit
        rr = max(radius[r], 0.0) * unit
        ringz.append([bm.verts.new((rr * math.cos(2 * math.pi * j / segments), y,
                                    rr * math.sin(2 * math.pi * j / segments))) for j in range(segments)])
    for a, b in zip(ringz, ringz[1:]):
        for j in range(segments):
            k2 = (j + 1) % segments
            bm.faces.new((a[j], b[j], b[k2], a[k2]))
    bm.faces.new(list(reversed(ringz[-1])))
    bm.faces.new(ringz[0])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=unit * 0.25)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return to_object(name, bm)


def inflate(name, mask, unit, stride=2, swell=1.25, one=False):
    """Fills the outline with metaballs, each as big as the distance to the outline there. one=True keeps only the
    largest connected piece (an inflate-mode piece is one shape; the crystals' rock bed is several stones)."""
    d = distance(mask)
    h, w = mask.shape
    mb = bpy.data.metaballs.new(name + "_balls")
    mb.resolution = unit * 3.0
    mb.render_resolution = unit * 3.0
    mb.threshold = 0.6
    for y in range(0, h, stride):
        for x in range(0, w, stride):
            if d[y, x] >= 1.0:
                e = mb.elements.new()
                e.co = ((x - w / 2) * unit, (h - 1 - y) * unit, 0.0)
                e.radius = (d[y, x] + 0.5) * unit * swell
    ob = bpy.data.objects.new(name + "_balls", mb)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.update()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(ob)
    if one:
        keep_largest(me)
    out = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(out)
    return out


def keep_largest(me):
    """Keeps only the largest connected piece. Metaballs can leave a small blob loose where the outline thins out
    (root_curl had a 10-vertex blob at the hook's tip, P3 in tools/blender-cloud/tests)."""
    bm = bmesh.new()
    bm.from_mesh(me)
    seen, islands = set(), []
    for v in bm.verts:
        if v.index in seen:
            continue
        island, todo = [], [v]
        seen.add(v.index)
        while todo:
            u = todo.pop()
            island.append(u)
            for e in u.link_edges:
                o = e.other_vert(u)
                if o.index not in seen:
                    seen.add(o.index)
                    todo.append(o)
        islands.append(island)
    if len(islands) > 1:
        islands.sort(key=len)
        bmesh.ops.delete(bm, geom=[v for island in islands[:-1] for v in island], context="VERTS")
        bm.to_mesh(me)
    bm.free()


def place(parts):
    """Puts the parts' shared base on y=0 and centres them together on x=0 and z=0."""
    v = np.concatenate([np.array([p.co[:] for p in ob.data.vertices]) for ob in parts])
    lo, hi = v.min(axis=0), v.max(axis=0)
    shift = np.array([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
    for ob in parts:
        for p in ob.data.vertices:
            p.co = tuple(np.array(p.co[:]) + shift)
        ob.data.update()
    return parts


def fit(ob, faces):
    """Decimates to the face budget, puts the base on y=0 and centres it on x=0 and z=0."""
    bpy.context.view_layer.objects.active = ob
    # Decimate counts triangles, so a quad mesh can come out over the budget (root_curl came out at 682 against 500,
    # P5): decimate again from what came out until the face count fits.
    for _ in range(6):
        if len(ob.data.polygons) <= faces:
            break
        m = ob.modifiers.new("fit", "DECIMATE")
        m.ratio = faces / len(ob.data.polygons)
        bpy.context.view_layer.update()
        me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear()
        ob.data = me
    v = np.array([p.co[:] for p in ob.data.vertices])
    lo, hi = v.min(axis=0), v.max(axis=0)
    shift = np.array([-(lo[0] + hi[0]) / 2, -lo[1], -(lo[2] + hi[2]) / 2])
    for p in ob.data.vertices:
        p.co = tuple(np.array(p.co[:]) + shift)
    for p in ob.data.polygons:
        p.use_smooth = True
    ob.data.update()
    return ob


# ---- checking ------------------------------------------------------------------------------------
def silhouette(ob, shape, unit):
    """The mesh drawn flat onto the picture's grid, front view (x right, y up)."""
    h, w = shape
    sil = np.zeros(shape, bool)
    v = np.array([p.co[:] for p in ob.data.vertices])
    gx = v[:, 0] / unit + (w - 1) / 2
    gy = (h - 1) - v[:, 1] / unit
    yy, xx = np.mgrid[0:h, 0:w]
    for poly in ob.data.polygons:
        idx = list(poly.vertices)
        for t in range(1, len(idx) - 1):
            a, b, c = idx[0], idx[t], idx[t + 1]
            x0, x1 = int(max(0, math.floor(min(gx[a], gx[b], gx[c])))), int(min(w - 1, math.ceil(max(gx[a], gx[b], gx[c]))))
            y0, y1 = int(max(0, math.floor(min(gy[a], gy[b], gy[c])))), int(min(h - 1, math.ceil(max(gy[a], gy[b], gy[c]))))
            if x1 < x0 or y1 < y0:
                continue
            px, py = xx[y0:y1 + 1, x0:x1 + 1], yy[y0:y1 + 1, x0:x1 + 1]
            d = (gy[b] - gy[c]) * (gx[a] - gx[c]) + (gx[c] - gx[b]) * (gy[a] - gy[c])
            if abs(d) < 1e-9:
                continue
            l1 = ((gy[b] - gy[c]) * (px - gx[c]) + (gx[c] - gx[b]) * (py - gy[c])) / d
            l2 = ((gy[c] - gy[a]) * (px - gx[c]) + (gx[a] - gx[c]) * (py - gy[c])) / d
            inside = (l1 >= -0.02) & (l2 >= -0.02) & (1 - l1 - l2 >= -0.02)
            sil[y0:y1 + 1, x0:x1 + 1] |= inside
    return sil


def match(ob, mask, unit):
    """Outline overlap of model and picture, at the best sideways shift (where the piece sits is free). ob may be a
    list of parts, scored together."""
    sil0 = np.zeros(mask.shape, bool)
    for part in (ob if isinstance(ob, list) else [ob]):
        sil0 |= silhouette(part, mask.shape, unit)
    best = (sil0, 0.0)
    w = mask.shape[1]
    for dx in range(-w // 6, w // 6 + 1):
        sil = np.roll(sil0, dx, axis=1)
        iou = float((sil & mask).sum() / max(1, (sil | mask).sum()))
        if iou > best[1]:
            best = (sil, iou)
    return best


def render(ob, out_png, yaw_deg, size=480):
    """A plain clay render of the piece (or list of parts), to stand beside its picture."""
    parts = ob if isinstance(ob, list) else [ob]
    sc = bpy.context.scene
    for o in list(sc.objects):
        if o.type in ("CAMERA", "LIGHT"):
            bpy.data.objects.remove(o)
    v = np.concatenate([np.array([p.co[:] for p in o.data.vertices]) for o in parts])
    hi = v.max(axis=0)
    span = max(hi[1], np.ptp(v[:, 0]), np.ptp(v[:, 2]))
    for o in parts:
        o.rotation_euler = (math.radians(90), 0, math.radians(yaw_deg))  # page axes (Y up) to Blender's (Z up)
    cam_data = bpy.data.cameras.new("cam")
    cam_data.type = "ORTHO"
    width = max(np.ptp(v[:, 0]), np.ptp(v[:, 2]))
    cam_data.ortho_scale = max(hi[1], width / 0.8) * 1.15  # the frame is 0.8 as wide as it is tall
    cam = bpy.data.objects.new("cam", cam_data)
    cam.location = (0, -span * 4, hi[1] / 2)
    cam.rotation_euler = (math.radians(90), 0, 0)
    sc.collection.objects.link(cam)
    sc.camera = cam
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.5
    sun.rotation_euler = (math.radians(55), 0, math.radians(-40))
    sc.collection.objects.link(sun)
    for o in parts:
        if not o.data.materials:
            mat = bpy.data.materials.new("clay")
            mat.use_nodes = True
            mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.72, 0.68, 0.62, 1)
            mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.9
            o.data.materials.append(mat)
    sc.render.engine = "CYCLES"  # Workbench and EEVEE need a GPU; the cloud has none
    sc.cycles.device = "CPU"
    sc.cycles.samples = 16
    if not sc.world:
        sc.world = bpy.data.worlds.new("w")
    sc.world.color = (0.18, 0.17, 0.16)
    sc.render.resolution_x = int(size * 0.8)
    sc.render.resolution_y = size
    sc.render.filepath = out_png
    bpy.ops.render.render(write_still=True)
    for o in parts:
        o.rotation_euler = (0, 0, 0)


def textured(parts, box, mask, unit):
    """With box (outline's), gives each part the picture's UVs and its texture (the image is in ob["picture"])."""
    if box is None:
        return
    img = picture_texture(box, mask, parts[0].name + "_picture")
    for ob in parts:
        picture_uv(ob, box, mask.shape, unit)
        ob["picture"] = img.name


def build(name, mask, unit, mode, faces, box=None):
    """Builds, fits to the face budget and scores the piece. For inflate, tries a few swells (the balls' surface
    sits inside their radius) and keeps the one whose outline fits the picture best. Returns the parts (one, or
    for crystals the cluster and its rock bed), the model's outline and the outline match. With box (outline's), the
    J3 modes also carry the picture as a texture (textured)."""
    if mode == "crystals":
        mask, rgb = mask
        parts, _ = crystals(name, mask, rgb, unit)
        textured(parts, box, mask, unit)
        place(parts)
        sil, iou = match(parts, mask, unit)
        return parts, sil, iou
    if mode == "mushrooms":
        mask, rgb = mask
        parts, _ = mushrooms(name, mask, rgb, unit)
        textured(parts, box, mask, unit)
        place(parts)
        sil, iou = match(parts, mask, unit)
        return parts, sil, iou
    if mode == "roots":
        parts, _ = roots(name, mask, unit)
        textured(parts, box, mask, unit)
        if len(parts[0].data.polygons) > faces:
            fit(parts[0], faces)
        place(parts)
        sil, iou = match(parts, mask, unit)
        return parts, sil, iou
    ob = fit(lathe(name, mask, unit) if mode == "lathe" else inflate(name, mask, unit, one=True), faces)
    sil, iou = match(ob, mask, unit)
    if mode == "inflate":
        for swell in (1.4, 1.55, 1.7, 1.85):
            trial = fit(inflate(name + "_try", mask, unit, swell=swell, one=True), faces)
            tsil, tiou = match(trial, mask, unit)
            if tiou > iou:
                bpy.data.objects.remove(ob)
                ob, sil, iou = trial, tsil, tiou
                ob.name = ob.data.name = name
            else:
                bpy.data.objects.remove(trial)
    return [ob], sil, iou


def main(argv):
    ap = argparse.ArgumentParser()
    ap.add_argument("picture")
    ap.add_argument("out")
    ap.add_argument("--mode", choices=MODES, required=True)
    ap.add_argument("--height", type=float, required=True, help="height of the piece in page units")
    ap.add_argument("--name", required=True)
    ap.add_argument("--faces", type=int, default=600)
    ap.add_argument("--render", help="folder for front.png and three-quarter.png")
    ap.add_argument("--flat", action="store_true", help="the picture's background is flat and plain (see outline)")
    a = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    mask = outline(a.picture, colour=a.mode in COLOUR, flat=a.flat, side=FINE.get(a.mode, MAX_SIDE))
    unit = a.height / (mask[0] if a.mode in COLOUR else mask).shape[0]
    parts, sil, iou = build(a.name, mask, unit, a.mode, a.faces)
    mask = mask[0] if a.mode in COLOUR else mask
    v = np.concatenate([np.array([p.co[:] for p in o.data.vertices]) for o in parts])
    size = [round(float(x), 3) for x in v.max(axis=0) - v.min(axis=0)]
    for o in list(bpy.context.scene.objects):
        o.select_set(o in parts)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.export_scene.gltf(filepath=os.path.abspath(a.out), export_format="GLB", use_selection=True,
                              export_apply=True, export_yup=False, export_normals=True, export_texcoords=False,
                              export_materials="NONE")
    report = {"name": a.name, "mode": a.mode, "picture": os.path.basename(a.picture), "faces": sum(len(o.data.polygons) for o in parts),
              "size_xyz": size, "outline_match": round(iou, 3), "bytes": os.path.getsize(a.out)}
    if a.render:
        os.makedirs(a.render, exist_ok=True)
        np.save(os.path.join(a.render, a.name + "_mask.npy"), np.stack([mask, sil]))
        render(parts, os.path.join(a.render, a.name + "_front.png"), 0)
        render(parts, os.path.join(a.render, a.name + "_three_quarter.png"), 40)
    print("REPORT " + json.dumps(report))
    return report


if __name__ == "__main__":
    main(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
