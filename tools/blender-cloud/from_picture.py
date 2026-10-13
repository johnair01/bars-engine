"""Builds a 3D piece in Blender from one picture of it, and says how well the model matches the picture.

The picture is concept art: one object, seen from the front, on a plain background (cave studio, Wendell's ruling
cs-chatgpt-ai-art: ChatGPT art is concept only, and the piece is rebuilt by us). The tool reads the object's outline
from the picture and builds the shape one of two ways:

  lathe    turns the outline around its centre line, for round things: a stalagmite, a mushroom, a pot.
  inflate  fills the outline with overlapping balls as thick as the shape is wide at each point (Blender metaballs),
           for things with a bend in them: a root, a branch, a lumpy stone.
  crystals splits the picture by colour into crystal and rock, makes one six-sided prism per crystal tip it finds in
           the outline, and inflates the rock bed under them, for a crystal cluster.
  mushrooms finds each cap by its saturated colour, lathes it, follows its stem down to the dark bed and sweeps a
           round stem along it, and inflates the bed, for a cluster of mushrooms (J3).
  roots    thins the outline to its centre lines and sweeps a round tube along each one, as thick as the picture is
           wide there, so fine tendrils and the gaps between strands survive, for a hanging root knot (J3).

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


def outline(path, colour=False, flat=False, side=MAX_SIDE):
    """The object's mask, top row first: background is the colour around the picture's edge. With colour, also
    returns the picture's colours on the same grid. flat=True is for a picture on a flat plain background (J3's
    pictures): anything that differs from the background by more than a few times the edge's own noise is the
    object, so pale parts close to the background's grey (a lilac stem, a lit crystal face) still count. Without it
    the cut is Otsu's, which suits the stand-ins' textured paper and keeps the kit's dressing as built. side is the
    grid's longer side in pixels; the J3 modes read at twice the usual, so a stem or a tendril is more than a pixel."""
    rgb = shrink(load_rgb(path), side * 3)  # read finely, so a thin dark outline still closes the shape
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
    return (mask[crop], small[crop]) if colour else mask[crop]


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
    strongest colour; it is lathed row by row from that piece, with gills under the rim closing in toward the stem.
    What the caps and the bed leave (the stems and the gills' glow) is inflated. Caps step a little toward and away from
    the viewer so the cluster has depth, and each stem moves with the cap above it. Returns the caps, the stems and the
    bed as three parts, and the number of caps."""
    rng = np.random.default_rng(seed)
    h, w = mask.shape
    sat, val = saturation(rgb), rgb.max(axis=2)
    bed = mask & (val < 0.5)
    bed_main = pieces(bed)[0] if bed.any() else bed
    seeds = pieces(mask & ~bed & (sat > 0.5))  # a cap's top: the strongest colour in the picture
    seeds = [c for c in seeds if c.sum() >= 0.06 * seeds[0].sum()] if seeds else []
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
        rad = list(np.maximum.accumulate(rad))  # a dome widens downward
        rim = rad[-1]
        gill = max(2.0, 0.25 * (rows[-1] - rows[0]))
        prof = list(zip(rows, rad)) + [(rows[-1] + gill * 0.5, 0.85 * rim), (rows[-1] + gill, 0.35 * rim)]
        caps.append((prof, centre[1] - rim, centre[1] + rim, centre[0] + rows[0], centre[0] + rows[-1] + gill,
                     centre, lean))
    cbm, depth = bmesh.new(), []
    for i, (prof, x0, x1, y0, y1, centre, lean) in enumerate(caps):
        width = x1 - x0
        cs, sn = math.cos(lean), math.sin(lean)
        at = lambda r, xr, zr: to3(centre[1] + r * sn + xr * cs, centre[0] + r * cs - xr * sn, z + zr * unit)
        z = 0.0 if i == 0 else (1 if i % 2 else -1) * rng.uniform(0.35, 0.8) * width * unit * 0.6
        depth.append((x0, x1, y1, z))
        rad = np.convolve(np.pad([p[1] for p in prof], 1, mode="edge"), np.ones(3) / 3, mode="valid")
        rows = [p[0] for p in prof]
        keep = profile_rows(np.array(rad), 0, len(rad) - 1, 14, tol=0.8)
        seg = 12
        ringv = []
        for k in sorted(keep):
            r, rr = rows[k], rad[k]
            ringv.append([cbm.verts.new(at(r, rr * math.cos(2 * math.pi * j / seg), rr * math.sin(2 * math.pi * j / seg)))
                          for j in range(seg)])
        top = cbm.verts.new(at(rows[0] - 0.5, 0, 0))
        for j in range(seg):
            cbm.faces.new((ringv[0][(j + 1) % seg], ringv[0][j], top))
        for a, b in zip(ringv, ringv[1:]):
            for j in range(seg):
                k = (j + 1) % seg
                cbm.faces.new((a[j], a[k], b[k], b[j]))
        cbm.faces.new(list(reversed(ringv[-1])))
    caps_ob = to_object(name, cbm)
    for p in caps_ob.data.polygons:
        p.use_smooth = True
    parts = [caps_ob]
    bed_all = filled(bed_main)
    stems = mask & ~silhouette(caps_ob, mask.shape, unit) & ~bed_all  # stems and gills: what the caps and bed leave
    if stems.sum():
        ob = inflate(name + "_stems", stems, unit, stride=2, swell=1.3)
        fit_faces(ob, 500)
        for v in ob.data.vertices:  # each stem stands as far forward or back as the cap above it
            px, py = v.co.x / unit + w / 2, h - 1 - v.co.y / unit
            v.co.z *= 0.6  # where stems overlap in the picture they inflate as one; keep that lump shallow
            above = [(y1, z) for x0, x1, y1, z in depth if x0 <= px <= x1 and y1 <= py + 2]
            if above:
                v.co.z += max(above)[1]
        parts.append(ob)
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


def roots(name, mask, unit, seed=11):
    """A root knot: a round tube along each centre line of the outline, as thick as the outline is wide there, so a
    tendril one or two pixels wide stays a tendril. Each line bows a little toward or away from the viewer between its
    ends, so the strands cross in depth and still meet where they fork."""
    rng = np.random.default_rng(seed)
    h, w = mask.shape
    d = distance(mask)
    bm = bmesh.new()
    lines = centre_lines(thin(mask), d)
    for line, ends in lines:
        if len(line) < 3 and 1 not in ends:
            continue
        step = max(2, int(np.median([d[p] for p in line]) * 0.8))
        idx = list(range(0, len(line), step))
        if idx[-1] != len(line) - 1:
            idx.append(len(line) - 1)
        rad = [max(0.7, float(d[line[i]]) * 1.05) for i in idx]
        bow = rng.uniform(-1, 1) * 0.8 * float(np.median(rad))
        pts = []
        for t, i in zip(np.linspace(0, 1, len(idx)), idx):
            y, x = line[i]
            pts.append(((x - w / 2) * unit, (h - 1 - y) * unit, bow * math.sin(math.pi * t) * unit))
        sides = 6 if max(rad) > 2.5 else 4
        tube(bm, pts, [r * unit for r in rad], sides=sides, tips=(ends[0] == 1, ends[1] == 1))
    ob = to_object(name, bm)
    for p in ob.data.polygons:
        p.use_smooth = True
    return [ob], len(lines)


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


def build(name, mask, unit, mode, faces):
    """Builds, fits to the face budget and scores the piece. For inflate, tries a few swells (the balls' surface
    sits inside their radius) and keeps the one whose outline fits the picture best. Returns the parts (one, or
    for crystals the cluster and its rock bed), the model's outline and the outline match."""
    if mode == "crystals":
        mask, rgb = mask
        parts, _ = crystals(name, mask, rgb, unit)
        place(parts)
        sil, iou = match(parts, mask, unit)
        return parts, sil, iou
    if mode == "mushrooms":
        mask, rgb = mask
        parts, _ = mushrooms(name, mask, rgb, unit)
        place(parts)
        sil, iou = match(parts, mask, unit)
        return parts, sil, iou
    if mode == "roots":
        parts, _ = roots(name, mask, unit)
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
