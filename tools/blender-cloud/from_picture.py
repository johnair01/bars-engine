"""Builds a 3D piece in Blender from one picture of it, and says how well the model matches the picture.

The picture is concept art: one object, seen from the front, on a plain background (cave studio, Wendell's ruling
cs-chatgpt-ai-art: ChatGPT art is concept only, and the piece is rebuilt by us). The tool reads the object's outline
from the picture and builds the shape one of two ways:

  lathe    turns the outline around its centre line, for round things: a stalagmite, a mushroom, a pot.
  inflate  fills the outline with overlapping balls as thick as the shape is wide at each point (Blender metaballs),
           for things with a bend in them: a root, a branch, a lumpy stone.
  crystals splits the picture by colour into crystal and rock, makes one six-sided prism per crystal tip it finds in
           the outline, and inflates the rock bed under them, for a crystal cluster.

Then it lays the finished mesh flat against the picture and measures the overlap of the two outlines (intersection
over union, 1.0 is a perfect match), and renders the model from the front and from three-quarters so it can be put
beside the picture.

Run with Blender's Python module (bpy 5.2.2, Python 3.13; README.md here):
    python from_picture.py PICTURE OUT.glb --mode lathe --height 3 --name stone_spire [--faces 600] [--render DIR]
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


def outline(path, colour=False):
    """The object's mask, top row first: background is the colour around the picture's edge. With colour, also
    returns the picture's colours on the same grid."""
    rgb = shrink(load_rgb(path), MAX_SIDE * 3)  # read finely, so a thin dark outline still closes the shape
    nan = np.isnan(rgb).any(axis=2)
    rgb = np.nan_to_num(rgb)
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((rgb - bg) ** 2).sum(axis=2))
    mask = (dist > max(otsu(dist[~nan]), 0.06)) & ~nan
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
    k = max(1, int(math.ceil(max(h, w) / MAX_SIDE)))
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


def inflate(name, mask, unit, stride=2, swell=1.25):
    """Fills the outline with metaballs, each as big as the distance to the outline there."""
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
    out = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(out)
    return out


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
    if len(ob.data.polygons) > faces:
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
    ob = fit((lathe if mode == "lathe" else inflate)(name, mask, unit), faces)
    sil, iou = match(ob, mask, unit)
    if mode == "inflate":
        for swell in (1.4, 1.55, 1.7, 1.85):
            trial = fit(inflate(name + "_try", mask, unit, swell=swell), faces)
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
    ap.add_argument("--mode", choices=("lathe", "inflate", "crystals"), required=True)
    ap.add_argument("--height", type=float, required=True, help="height of the piece in page units")
    ap.add_argument("--name", required=True)
    ap.add_argument("--faces", type=int, default=600)
    ap.add_argument("--render", help="folder for front.png and three-quarter.png")
    a = ap.parse_args(argv)

    bpy.ops.wm.read_factory_settings(use_empty=True)
    mask = outline(a.picture, colour=a.mode == "crystals")
    unit = a.height / (mask[0] if a.mode == "crystals" else mask).shape[0]
    parts, sil, iou = build(a.name, mask, unit, a.mode, a.faces)
    mask = mask[0] if a.mode == "crystals" else mask
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
