"""The spirits' frame: a skeleton for each body family's bases, built first, with the flesh skinned to it (frame, flesh,
warp; council call sheet blender-frame-flesh-warp, Wendell's ruling of 2026-10-14: "we ARE going to be using the rigs
in the cave forms of these sprites emerging").

    /home/user/blenv/bin/python tools/blender-cloud/content/spirits/rig.py IN.glb OUT_DIR --base tortoise --stage creature [--sheet]

The frame is a joint table per base and stage (FRAMES): each bone's head, tail and radius in the builder's own units
(shellback.py: the spirit faces +X, its left is +Y, Z up, the ground at 0), a parent map, and two actions, "Walk" (one
cycle a second, 25 keys) and "Idle" (two seconds, 49 keys). The flesh is the builder's fused body and its cloth and tail,
weighted per vertex to the bones they lie on; every other piece (shell, eyes, beads, ears, growth, the staff) rides the
bone of the flesh it sits on, and the aura rides the root. The warp is what the builder already layers on (the base's
proportions, the element's shell and growth, the nation's style): it changes the pieces, never the joint names, so a
cave form plays the same Walk and Idle whatever the element or nation.

Scale: the builders frame a spirit for the sprite camera, about four times life size. SIZE declares each stage's real
size in metres and the rig bakes it in, so the GLB is 1 unit = 1 m like the cave's characters (1.75 m).

shellback.py can call rig_scene(base, stage) on its built scene before export (#318 imports it once it lands); this file's
command line rigs an exported GLB, which is how the tests and the cave pipeline use it today. Needs bpy (README).
"""
import argparse, json, math, os, pathlib, sys

import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

FPS = 24
WALK_KEYS = 24        # one cycle a second, two steps, like the cave avatar's walk (character.py)
IDLE_KEYS = 48        # two seconds of breathing and looking round
FLOAT_STAGES = ("gas", "core", "hologram")
LIVING_STAGES = ("creature", "ascended")

# ---- scale: what each stage measures in the world -------------------------------------------------------------
# (what is measured, metres, what the builder makes it in its own units on 2026-10-14). The length is the fused body
# along X (snout to rump, tail apart); the height is the fused body's top. A gas, core or hologram is drawn at its
# creature's scale, so it is as big in the world as the creature it becomes. rig_scene warns when a builder's
# measure drifts more than 10% from the units noted here.
SIZE = {
    "tortoise":  {"creature": ("length", 1.2, 2.99), "ascended": ("height", 1.5, 2.36)},   # a young giant tortoise
    "armadillo": {"creature": ("length", 1.0, 2.55), "ascended": ("height", 1.45, 2.32)},  # a giant armadillo's body
    "pangolin":  {"creature": ("length", 0.9, 2.55), "ascended": ("height", 1.45, 2.32)},  # a giant pangolin's body
    "fox":       {"creature": ("length", 0.75, 2.05), "ascended": ("height", 1.4, 2.32)},  # a red fox, nose to rump
    "otter":     {"creature": ("length", 1.0, 1.81), "ascended": ("height", 1.3, 2.32)},  # a river otter, head and body
    "goat":      {"creature": ("length", 0.7, 1.43), "ascended": ("height", 1.2, 2.32)},  # a kid of a few months
}


def unit(base, stage):
    """Metres per builder unit."""
    measure, metres, built = SIZE[base]["creature" if stage in FLOAT_STAGES else stage]
    return metres / built


# ---- the frames -----------------------------------------------------------------------------------------------
# Joint names follow the cave avatar's (character.py, cave.js buildAvatar): hips, spine, neck, head; shoulder, elbow,
# wrist; hip, knee, ankle, so the cave poses every body with one vocabulary. A four-legged body names its forelegs
# shoulder, elbow, wrist and its hind legs hip, knee, ankle, and adds chest between hips and neck; tails are tail1..n.

def _leg(j, names, a, b, c, foot, r):
    """Three bones down a leg: a to b, b to c, c to the toe."""
    up, low, paw = names
    j[up], j[low], j[paw] = (a, b, r), (b, c, r * 0.8), (c, foot, r * 0.7)


def _tail(j, pts, r0, r1):
    for k in range(len(pts) - 1):
        t = k / max(1, len(pts) - 2)
        j[f"tail{k + 1}"] = (pts[k], pts[k + 1], r0 + (r1 - r0) * t)


def _tail_points(pts, n):
    """n + 1 points spaced evenly along a polyline, so a tail gets n bones of one length."""
    pts = [Vector(p) for p in pts]
    seg = [(pts[i + 1] - pts[i]).length for i in range(len(pts) - 1)]
    total, out = sum(seg), []
    for k in range(n + 1):
        d, i = total * k / n, 0
        while i < len(seg) - 1 and d > seg[i]:
            d -= seg[i]; i += 1
        out.append(tuple(pts[i].lerp(pts[i + 1], min(1.0, d / seg[i]))))
    return out


def quadruped(base):
    """The living creature, on four legs. The numbers are the builders' own (shellback.py creature, creature_long,
    fox_creature): where each leg's capsule runs, where the neck and head sit."""
    j = {"root": ((0, 0, 0), (0.3, 0, 0), 0.1)}
    if base == "tortoise":
        H = Vector((1.2, 0, 1.22))
        j["hips"] = ((-0.65, 0, 0.45), (-0.05, 0, 0.48), 0.32)
        j["chest"] = ((-0.05, 0, 0.48), (0.5, 0, 0.5), 0.32)
        j["neck"] = ((0.5, 0, 0.5), (0.98, 0, 1.02), 0.22)
        j["head"] = ((0.98, 0, 1.02), (H.x + 0.32, 0, H.z + 0.04), 0.24)
        legs = {(1, 0.45): None, (-1, 0.45): None, (1, -0.65): None, (-1, -0.65): None}
        for s, x in legs:
            y = 0.52 * s
            a, c = (x, y * 0.85, 0.42), (x + 0.04, y, 0.08)
            b = tuple((Vector(a) + Vector(c)) / 2)
            names = ("shoulder", "elbow", "wrist") if x > 0 else ("hip", "knee", "ankle")
            _leg(j, [n + ("L" if s > 0 else "R") for n in names], a, b, c, (x + 0.3, y * 1.03, 0.04), 0.21)
        _tail(j, [(-0.95, 0, 0.3), (-1.15, 0, 0.2), (-1.32, 0, 0.11)], 0.08, 0.06)
    elif base in ("armadillo", "pangolin"):
        arma = base == "armadillo"
        H = Vector((1.36, 0, 0.62)) if arma else Vector((1.4, 0, 0.5))
        j["hips"] = ((-0.75, 0, 0.42), (-0.1, 0, 0.42), 0.32)
        j["chest"] = ((-0.1, 0, 0.42), (0.55, 0, 0.43), 0.32)
        j["neck"] = ((0.55, 0, 0.43), (H.x - 0.25, 0, H.z - 0.02), 0.2)
        j["head"] = ((H.x - 0.25, 0, H.z - 0.02), (H.x + 0.3, 0, H.z - 0.04), 0.2)
        for s in (1, -1):
            for x in (0.55, -0.75):
                y = 0.48 * s
                a, c = (x, y * 0.85, 0.4), (x + 0.04, y, 0.08)
                b = tuple((Vector(a) + Vector(c)) / 2)
                names = ("shoulder", "elbow", "wrist") if x > 0 else ("hip", "knee", "ankle")
                _leg(j, [n + ("L" if s > 0 else "R") for n in names], a, b, c, (x + 0.3, y * 1.03, 0.04), 0.18)
        path = ([(-0.75, 0, 0.4), (-1.3, 0, 0.32), (-1.56, -0.05, 0.22), (-1.78, -0.18, 0.12), (-1.93, -0.38, 0.07),
                 (-1.98, -0.6, 0.05)] if arma else
                [(-0.75, 0, 0.44), (-1.22, 0, 0.46), (-1.58, -0.04, 0.33), (-1.88, -0.2, 0.19), (-2.0, -0.5, 0.11),
                 (-1.9, -0.82, 0.08), (-1.66, -1.02, 0.07)])
        _tail(j, _tail_points(path, 5), 0.14 if arma else 0.3, 0.05 if arma else 0.1)
    elif base == "fox":
        H = Vector((0.92, 0, 1.12))
        j["hips"] = ((-0.5, 0, 0.62), (-0.05, 0, 0.64), 0.22)
        j["chest"] = ((-0.05, 0, 0.64), (0.4, 0, 0.68), 0.24)
        j["neck"] = ((0.4, 0, 0.68), (0.82, 0, 1.04), 0.14)
        j["head"] = ((0.82, 0, 1.04), (H.x + 0.36, 0, H.z - 0.06), 0.17)
        # spirit round 11 (#318 6ac49aa+): the fox stands square, its near forepaw down (shellback.py LEGS)
        legs = [((0.38, -0.13, 0.55), (0.42, -0.15, 0.25), (0.47, -0.15, 0.04), "R", True),
                ((0.38, 0.13, 0.55), (0.42, 0.15, 0.25), (0.47, 0.15, 0.04), "L", True),
                ((-0.48, -0.15, 0.52), (-0.65, -0.17, 0.25), (-0.55, -0.17, 0.04), "R", False),
                ((-0.48, 0.15, 0.52), (-0.65, 0.17, 0.25), (-0.55, 0.17, 0.04), "L", False)]
        for a, b, c, side, front in legs:
            names = ("shoulder", "elbow", "wrist") if front else ("hip", "knee", "ankle")
            _leg(j, [n + side for n in names], a, b, c, tuple(Vector(c) + Vector((0.14, 0, 0))), 0.075)
        path = [(-0.5, 0, 0.66), (-0.62, 0, 0.72), (-0.98, 0, 0.84), (-1.22, 0.04, 1.12), (-1.24, 0.1, 1.48), (-1.05, 0.14, 1.7)]
        _tail(j, _tail_points(path, 5), 0.17, 0.12)
    elif base in ("otter", "goat"):
        # spirit round 11: the otter and the kid standing on four feet (shellback.py otter_creature, goat_creature;
        # the leg chains are the builder's LEGS, written into report.json with each creature)
        otter = base == "otter"
        if otter:
            j["hips"] = ((-0.5, 0, 0.45), (-0.05, 0, 0.43), 0.2)
            j["chest"] = ((-0.05, 0, 0.43), (0.36, 0, 0.41), 0.2)
            j["neck"] = ((0.36, 0, 0.43), (0.76, 0, 0.66), 0.14)
            j["head"] = ((0.76, 0, 0.66), (1.12, 0, 0.67), 0.15)
            fore, hind, r = ((0.34, 0.13, 0.34), (0.3, 0.14, 0.19), (0.36, 0.14, 0.06)), \
                ((-0.5, 0.15, 0.37), (-0.59, 0.16, 0.18), (-0.5, 0.16, 0.06)), 0.07
            path, n, r0, r1 = [(-0.5, 0, 0.45), (-0.64, 0, 0.44), (-0.98, 0, 0.36), (-1.26, 0, 0.25), (-1.46, 0, 0.15), (-1.58, 0, 0.09)], 5, 0.15, 0.04
        else:
            j["hips"] = ((-0.36, 0, 0.74), (0.0, 0, 0.78), 0.16)
            j["chest"] = ((0.0, 0, 0.78), (0.3, 0, 0.82), 0.16)
            j["neck"] = ((0.3, 0, 0.84), (0.6, 0, 1.14), 0.085)
            j["head"] = ((0.6, 0, 1.14), (0.86, 0, 1.12), 0.13)
            fore, hind, r = ((0.3, 0.1, 0.7), (0.31, 0.105, 0.38), (0.32, 0.105, 0.08)), \
                ((-0.38, 0.11, 0.66), (-0.47, 0.12, 0.35), (-0.4, 0.12, 0.08)), 0.05
            path, n, r0, r1 = [(-0.36, 0, 0.8), (-0.48, 0, 0.82), (-0.54, 0, 0.92), (-0.55, 0, 1.01)], 3, 0.05, 0.03
        for s in (1, -1):
            for chain, names in ((fore, ("shoulder", "elbow", "wrist")), (hind, ("hip", "knee", "ankle"))):
                a, b, c = [(x, y * s, z) for x, y, z in chain]
                _leg(j, [n_ + ("L" if s > 0 else "R") for n_ in names], a, b, c, (c[0] + 0.12, c[1], c[2]), r)
        _tail(j, _tail_points(path, n), r0, r1)
    else:
        raise SystemExit(f"no frame for base {base}")
    return j


def biped(base):
    """The highest ally form, standing (shellback.py ascended, ascended_long, fox_ascended): legs, a trunk, arms with
    the staff in the left hand, and the long bases' and the fox's tail."""
    fox = base == "fox"
    H = Vector((0.16, 0, 2.02)) if fox else Vector((0.2, 0, 2.03 if base != "tortoise" else 2.05))
    j = {"root": ((0, 0, 0), (0, 0, 0.3), 0.1),
         "hips": ((0, 0, 0.8), (0, 0, 1.0), 0.28),
         "spine": ((0, 0, 1.0), (0, 0, 1.52), 0.3 if not fox else 0.26),
         "neck": ((0.0, 0, 1.55), (0.1 if fox else 0.12, 0, 1.9), 0.13 if not fox else 0.11),
         "head": ((0.1 if fox else 0.12, 0, 1.9), (H.x + 0.12, 0, H.z + 0.28), 0.24 if not fox else 0.2)}
    for s, n in ((1, "L"), (-1, "R")):
        sh, el, hd = ((Vector((0, s * 0.36, 1.5)), Vector((0.08, s * 0.44, 1.13)), Vector((0.3, s * 0.38, 0.96))) if fox else
                      (Vector((0, s * 0.42, 1.5)), Vector((0.1, s * 0.5, 1.12)), Vector((0.32, s * 0.42, 0.95))))
        j["shoulder" + n] = (tuple(sh), tuple(el), 0.1 if not fox else 0.08)
        j["elbow" + n] = (tuple(el), tuple(hd), 0.09 if not fox else 0.07)
        j["wrist" + n] = (tuple(hd), tuple(hd + Vector((0.12, 0, -0.02))), 0.1 if not fox else 0.08)
        y = s * (0.17 if fox else 0.2)
        top, foot = Vector((0, y, 0.85)), (Vector((0.04, y, 0.1)) if fox else Vector((0.02, y * 1.1, 0.12)))
        knee = (top + foot) / 2 + Vector((0.02, 0, 0))
        j["hip" + n] = (tuple(top), tuple(knee), 0.15 if not fox else 0.11)
        j["knee" + n] = (tuple(knee), tuple(foot), 0.14 if not fox else 0.1)
        j["ankle" + n] = (tuple(foot), tuple(foot + Vector((0.2, 0, -0.07))), 0.12)
    if base == "armadillo":
        path = [(-0.1, 0, 1.0), (-0.3, 0, 0.95), (-0.55, -0.05, 0.6), (-0.72, -0.15, 0.3), (-0.8, -0.32, 0.08), (-0.7, -0.52, 0.04)]
        _tail(j, _tail_points(path, 4), 0.1, 0.04)
    elif base == "pangolin":
        path = [(-0.1, 0, 1.0), (-0.3, 0, 1.0), (-0.6, 0, 0.7), (-0.86, -0.05, 0.38), (-1.0, -0.2, 0.13), (-0.95, -0.5, 0.08),
                (-0.72, -0.72, 0.07)]
        _tail(j, _tail_points(path, 5), 0.22, 0.08)
    elif fox:
        path = [(-0.05, 0, 0.9), (-0.2, 0, 0.85), (-0.6, 0, 0.55), (-0.95, -0.1, 0.45), (-1.15, -0.2, 0.75), (-1.1, -0.25, 1.15)]
        _tail(j, _tail_points(path, 5), 0.15, 0.1)
    return j


def floating():
    """The gas, the core and the hologram: one bone they all float on."""
    return {"root": ((0, 0, 0), (0, 0, 0.3), 0.1), "float": ((0, 0, 0.3), (0, 0, 0.9), 0.5)}


def parents(j):
    p = {}
    for b in j:
        if b == "root":
            p[b] = None
        elif b == "float" or b == "hips":
            p[b] = "root"
        elif b == "chest":
            p[b] = "hips"
        elif b == "spine":
            p[b] = "hips"
        elif b == "neck":
            p[b] = "chest" if "chest" in j else "spine"
        elif b == "head":
            p[b] = "neck"
        elif b.startswith("tail"):
            k = int(b[4:])
            p[b] = "hips" if k == 1 else f"tail{k - 1}"
        else:
            name, side = b[:-1], b[-1]
            chain = {"shoulder": "chest" if "chest" in j else "spine", "elbow": "shoulder", "wrist": "elbow",
                     "hip": "hips", "knee": "hip", "ankle": "knee"}[name]
            p[b] = chain if chain in ("chest", "spine", "hips") else chain + side
    return p


def frame(base, stage):
    j = floating() if stage in FLOAT_STAGES else quadruped(base) if stage == "creature" else biped(base)
    return {b: (Vector(h), Vector(t), r) for b, (h, t, r) in j.items()}, parents(j)


# Which bones each piece of flesh may take weights from. The rest of the pieces are rigid.
def skin_bones(name, bones):
    tails = {b for b in bones if b.startswith("tail")}
    if name == "tail":
        return tails | {"hips"}
    if name == "robe":
        return {b for b in bones if b in ("hips", "spine") or b[:-1] in ("hip", "knee")}
    if name in ("shawl", "scarf"):
        return {b for b in bones if b in ("spine", "chest", "neck") or b[:-1] == "shoulder"}
    if name == "body":
        return set(bones) - tails - {"root", "float"}
    return None


# Rigid pieces that always ride the head: the eyes. The ally's staff stands in front of its face, so before 24 October
# 2026 the staff's reach (then 1.6 of the hand's radius, 0.36 m) also took the eyes, the heart core and the necklace's beads
# onto the left hand, and they swung with the staff while the face turned (Wendell, spirit-rig-look-01: "The shellbacks face
# moves but its eyes stay out and its unsettling"). The reach is now the staff's own width round the hand (0.13 m).
EYE_PARTS = ("eyeball", "eyewhite", "iris", "pupil", "glint")
STAFF_REACH = 0.6


# ---- the walk and the idle ------------------------------------------------------------------------------------
# A pose is {bone: (about X, about Y, about Z)} in radians, about the world's axes at the bone's head: X runs ahead,
# so a turn about Y swings a leg ahead (negative) or back (positive), about X rolls, about Z turns.

def walk_pose(kind, base, t):
    ph = 2 * math.pi * t
    r = {}
    if kind == "float":
        r["float"] = (0.0, -0.12, 0.0)                                  # leaning into the glide
        return r, Vector((0, 0, 0.06 * math.sin(2 * ph)))
    if kind == "biped":
        A = 0.32 if base != "fox" else 0.4
        sL, sR = math.sin(ph), math.sin(ph + math.pi)
        for n, s in (("L", sL), ("R", sR)):
            c = math.cos(ph if n == "L" else ph + math.pi)
            r["hip" + n] = (0.0, -A * s, 0.0)
            r["knee" + n] = (0.0, 0.1 + 0.8 * max(0.0, c), 0.0)        # the knee bends back as the leg swings through
            r["ankle" + n] = (0.0, -(-A * s + r["knee" + n][1]) * 0.8, 0.0)
        # the staff hand (left) holds the staff and barely swings; the free arm swings against its leg
        r["shoulderL"] = (0.0, 0.08 * sR, 0.0)
        r["shoulderR"] = (0.0, 0.7 * A * sL, 0.0)
        r["elbowR"] = (0.0, -(0.15 + 0.25 * max(0.0, -sL)), 0.0)
        r["spine"] = (0.0, 0.04, 0.1 * sL)
        r["hips"] = (0.0, 0.0, -0.08 * sL)
        r["head"] = (0.0, -0.03, -0.06 * sL)
        for k in range(1, 7):
            r[f"tail{k}"] = (0.0, 0.0, 0.12 * math.sin(ph * 2 - 0.6 * k))
        return r, Vector((0, 0, -0.03 * abs(sL)))
    # four legs, a walk in four beats: left hind, left fore, right hind, right fore, a quarter cycle apart
    A = {"tortoise": 0.32, "armadillo": 0.42, "pangolin": 0.38, "fox": 0.5, "otter": 0.4, "goat": 0.45}[base]
    offs = {"hipL": 0.0, "shoulderL": 0.25, "hipR": 0.5, "shoulderR": 0.75}
    for up, o in offs.items():
        a = ph - 2 * math.pi * o
        s, c = math.sin(a), math.cos(a)
        side, fore = up[-1], up.startswith("shoulder")
        low, paw = ("elbow" if fore else "knee") + side, ("wrist" if fore else "ankle") + side
        lift = max(0.0, c)                                              # the foot comes up as the leg swings ahead
        u = -A * s
        if fore:
            r[up], r[low] = (0.0, u - 0.15 * lift, 0.0), (0.0, 0.55 * lift, 0.0)
        else:
            r[up], r[low] = (0.0, u - 0.2 * lift, 0.0), (0.0, -0.45 * lift, 0.0)   # the hock folds the other way
        r[paw] = (0.0, -(r[up][1] + r[low][1]), 0.0)                    # the paw stays level with the ground
    roll = 0.04 * math.sin(2 * ph)
    r["hips"] = (roll, 0.0, 0.05 * math.sin(ph))
    r["chest"] = (-roll, 0.0, -0.05 * math.sin(ph))
    r["neck"] = (0.0, 0.04 * math.sin(2 * ph), 0.0)
    r["head"] = (0.0, -0.04 * math.sin(2 * ph), 0.04 * math.sin(ph))
    sway = 0.22 if base == "fox" else 0.14
    for k in range(1, 7):
        r[f"tail{k}"] = (0.0, 0.0, sway * math.sin(ph - 0.7 * k))
    return r, Vector((0, 0, -0.015 * abs(math.sin(2 * ph))))


def idle_pose(kind, base, t):
    """Two seconds: breathing, a slow look round, the tail swaying. t runs 0..1 over the two seconds."""
    ph = 2 * math.pi * t
    r = {}
    if kind == "float":
        r["float"] = (0.0, 0.0, 0.25 * math.sin(ph))
        return r, Vector((0, 0, 0.05 * math.sin(ph)))
    breathe = 0.025 * math.sin(2 * ph)
    trunk = "spine" if kind == "biped" else "chest"
    r[trunk] = (0.0, -breathe, 0.0)
    r["neck"] = (0.0, breathe * 0.6, 0.0)
    r["head"] = (0.04 * math.sin(ph), -0.03 * math.sin(2 * ph), 0.22 * math.sin(ph))
    for k in range(1, 7):
        r[f"tail{k}"] = (0.0, 0.0, 0.1 * math.sin(ph - 0.5 * k))
    if kind == "biped":
        r["shoulderR"] = (0.0, 0.04 * math.sin(2 * ph), 0.0)
    return r, Vector((0, 0, 0))


# ---- building it ----------------------------------------------------------------------------------------------

def _bake(o):
    """Bake an object's world transform into its own mesh, unparented, so every piece sits in the scene's space."""
    mw = o.matrix_world.copy()
    o.parent = None
    if o.data.users > 1:
        o.data = o.data.copy()
    o.data.transform(mw)
    o.matrix_world = Matrix.Identity(4)


def _seg_dist(p, a, b):
    ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-12)))
    return (p - (a + ab * t)).length


def _bbox(objs):
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in objs:
        for v in o.data.vertices:
            lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
    return lo, hi


def _world_bbox(objs):
    lo, hi = Vector((1e9,) * 3), Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            lo = Vector(map(min, lo, w)); hi = Vector(map(max, hi, w))
    return lo, hi


def _weights(o, J, P, allowed, falloff):
    """Each vertex goes to the bone whose capsule surface it is nearest, and blends with that bone's parent or child
    where they meet, as character.py does with the body map's parts, so the surface bends at a joint."""
    groups = {b: o.vertex_groups.get(b) or o.vertex_groups.new(name=b) for b in allowed}
    links = {b: ({b} | {P[b]} | {c for c, p in P.items() if p == b}) & allowed for b in allowed}
    dom = []
    for v in o.data.vertices:
        d = {b: _seg_dist(v.co, J[b][0], J[b][1]) - J[b][2] for b in allowed}
        best = min(d, key=d.get)
        dom.append(best)
        w = {b: math.exp(-(d[b] - d[best]) / falloff) for b in links[best]}
        w = dict(sorted(w.items(), key=lambda kv: -kv[1])[:2])
        tot = sum(w.values())
        for b, x in w.items():
            if x / tot > 0.02:
                groups[b].add([v.index], x / tot, "REPLACE")
    return dom


def _rigid(o, rig, bone):
    """A rigid piece hangs from its bone as a child node, so it carries no skin weights (a lighter GLB)."""
    o.parent = rig
    o.parent_type = "BONE"
    o.parent_bone = bone
    bpy.context.view_layer.update()
    o.matrix_world = Matrix.Identity(4)


def _keys(rig, action_name, n, fn):
    act = bpy.data.actions.new(action_name)
    act.use_fake_user = True
    rig.animation_data.action = act
    prev = {}
    for k in range(n + 1):
        rot, lift = fn(k / n)
        for pb in rig.pose.bones:
            Bm = pb.bone.matrix_local.to_3x3()
            ax, ay, az = rot.get(pb.name, (0.0, 0.0, 0.0))
            R = Matrix.Rotation(az, 3, "Z") @ Matrix.Rotation(ay, 3, "Y") @ Matrix.Rotation(ax, 3, "X")
            q = (Bm.inverted() @ R @ Bm).to_quaternion()
            if k and q.dot(prev[pb.name]) < 0:
                q.negate()
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=k + 1)
            if pb.name in ("hips", "float"):
                pb.location = Bm.inverted() @ lift
                pb.keyframe_insert("location", frame=k + 1)
            prev[pb.name] = q.copy()
    track = rig.animation_data.nla_tracks.new()
    track.name = action_name
    track.strips.new(action_name, 1, act)
    rig.animation_data.action = None
    return act


def _steps(rig, scene, feet):
    """The Walk read back: how far each foot travels ahead and back over a cycle (metres), and when it is furthest
    ahead (as a fraction of the cycle), so a test can see every foot stepping and the feet taking turns."""
    for t in rig.animation_data.nla_tracks:
        t.mute = t.name != "Walk"
    xs = {b: [] for b in feet}
    for k in range(WALK_KEYS):
        scene.frame_set(k + 1)
        for b in feet:
            xs[b].append((rig.matrix_world @ rig.pose.bones[b].tail).x)
    for t in rig.animation_data.nla_tracks:
        t.mute = False
    scene.frame_set(1)
    return {b: {"travel": round(max(v) - min(v), 3), "ahead_at": round(v.index(max(v)) / WALK_KEYS, 3)} for b, v in xs.items()}


def rig_scene(base, stage, scene=None):
    """Rig the built spirit in the scene: scale it to metres, build its frame, skin its flesh, key Walk and Idle.
    Returns a report row. Leaves the scene ready to export (export_glb)."""
    scene = scene or bpy.context.scene
    scene.render.fps = FPS
    meshes = [o for o in scene.objects if o.type == "MESH"]
    for o in meshes:
        _bake(o)
    for o in [o for o in scene.objects if o.type == "EMPTY"]:
        bpy.data.objects.remove(o)
    f = unit(base, stage)
    S = Matrix.Scale(f, 4)
    kind = "float" if stage in FLOAT_STAGES else "quad" if stage == "creature" else "biped"
    J, P = frame(base, stage)
    notes = []
    body = next((o for o in meshes if o.name.split(".")[0] == "body" and len(o.data.vertices) > 1000), None)
    if kind != "float":
        if body is None:
            raise SystemExit(f"{base} {stage}: no fused body to skin")
        lo, hi = _bbox([body])
        measure, metres, built = SIZE[base][stage]
        got = (hi.x - lo.x) if measure == "length" else hi.z
        if abs(got - built) / built > 0.1:
            notes.append(f"the body's {measure} is {got:.2f} units, SIZE notes {built}: it is {got * f:.2f} m, not {metres} m")
    # metres, before anything is weighted, so the falloffs and the joint table are in the units the GLB will carry
    for o in meshes:
        o.data.transform(S)
    J = {b: (h * f, t * f, r * f) for b, (h, t, r) in J.items()}

    arm = bpy.data.armatures.new("Frame")
    rig = bpy.data.objects.new("Frame", arm)
    scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    for b, (h, t, _) in J.items():
        eb = arm.edit_bones.new(b)
        eb.head, eb.tail = h, t
        eb.roll = 0
    for b, p in P.items():
        if p:
            arm.edit_bones[b].parent = arm.edit_bones[p]
    bpy.ops.object.mode_set(mode="OBJECT")

    # the flesh: per-vertex weights; anchors say which bone the flesh carries where
    falloff = 0.03 * f / 0.4
    flesh, anchors, rigid = {}, [], []
    for o in meshes:
        key = o.name.split(".")[0]
        allowed = skin_bones(key, J) if kind != "float" else None
        if allowed and len(o.data.vertices) > 200:
            flesh[o.name] = _weights(o, J, P, allowed, falloff)
            anchors.append((o, flesh[o.name]))
        else:
            rigid.append(o)
    trees = [(BVHTree.FromPolygons([v.co for v in o.data.vertices], [p.vertices for p in o.data.polygons]), o, dom)
             for o, dom in anchors]
    shell = None
    if kind == "quad":
        shell = next((o for o in rigid if o.name.split(".")[0] == "shell"), None)
    staff_at = None
    if kind == "biped":
        h = J["wristL"][0]
        staff_at = (h.x, h.y)
    gap = 0.12 * f / 0.4
    count, placed = {}, {}
    for o in rigid:
        key = o.name.split(".")[0]
        c = sum((v.co for v in o.data.vertices), Vector()) / max(1, len(o.data.vertices))
        bone = None
        if kind == "float":
            bone = "float"
        elif key in ("shell", "plastron"):
            bone = "chest" if kind == "quad" else "spine"
        elif key in EYE_PARTS and "head" in J:
            bone = "head"                                               # the eyes turn with the face, whatever lies near them
        elif staff_at and math.hypot(c.x - staff_at[0], c.y - staff_at[1]) < 0.14 * f / 0.4 * STAFF_REACH:
            bone = "wristL"                                             # the staff and what it carries, in the left hand
        else:
            best, bd = None, gap
            for tree, a, dom in trees:
                loc, _, idx, d = tree.find_nearest(c)
                if loc is not None and d < bd:
                    best, bd = dom[a.data.polygons[idx].vertices[0]], d
            if best is None and shell is not None:
                # pieces on the shell (the core's emblem, growth, the bell) ride the shell's bone
                st = BVHTree.FromPolygons([v.co for v in shell.data.vertices], [p.vertices for p in shell.data.polygons])
                loc, _, _, d = st.find_nearest(c)
                if loc is not None and d < gap:
                    best = "chest"
            bone = best or "root"                                       # the aura and dust ride the root
        _rigid(o, rig, bone)
        count[bone] = count.get(bone, 0) + 1
        placed[o.name] = bone

    for o, _ in anchors:
        o.parent = rig
        m = o.modifiers.new("Frame", "ARMATURE")
        m.object = rig

    # the joints sit inside the flesh: each bone's middle is under the body's surface or within its radius of it
    outside = []
    if body is not None:
        # under the body, or under the shell for a tortoise's hips
        hosts = [body] + ([shell] if shell is not None else [])
        hts = [BVHTree.FromPolygons([v.co for v in o.data.vertices], [p.vertices for p in o.data.polygons]) for o in hosts]
        for b, (h, t, r) in J.items():
            if b in ("root",) or b.startswith("tail"):
                continue
            mid = (h + t) / 2
            ok = False
            for bt in hts:
                loc, nrm, _, d = bt.find_nearest(mid)
                if loc is not None and ((mid - loc).dot(nrm) < 0 or d < r):
                    ok = True
            if not ok:
                outside.append(b)
    if outside:
        notes.append("bones outside the body: " + ", ".join(outside))

    rig.animation_data_create()
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
    _keys(rig, "Walk", WALK_KEYS, lambda t: (lambda r, lift: (r, lift * f / 0.4))(*walk_pose(kind, base, t)))
    _keys(rig, "Idle", IDLE_KEYS, lambda t: (lambda r, lift: (r, lift * f / 0.4))(*idle_pose(kind, base, t)))
    scene.frame_start, scene.frame_end = 1, WALK_KEYS + 1

    steps = {} if kind == "float" else _steps(rig, scene, ["ankleL", "ankleR"] + (["wristL", "wristR"] if kind == "quad" else []))
    bpy.context.view_layer.update()
    lo, hi = _world_bbox([o for o in meshes if placed.get(o.name) != "root"] or meshes)
    return {"base": base, "stage": stage, "kind": kind, "metres_per_unit": round(f, 4), "bones": len(J),
            "flesh": sorted(flesh), "rigid": len(rigid), "rigid_by_bone": dict(sorted(count.items())),
            "size_m": [round(x, 3) for x in (hi - lo)], "steps": steps, "notes": notes}


def export_glb(path):
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True, export_skins=True,
                              export_animations=True, export_animation_mode="ACTIONS", export_force_sampling=True,
                              export_apply=False)


# ---- looking at it --------------------------------------------------------------------------------------------
CAM_DIR = Vector((3.4, -4.2, 0)).normalized()   # the sprite camera's heading (shellback.py), so a pose reads as a sprite


def sheet(rig, base, stage, out_png, size=320, samples=12):
    """Two rows of rest, four walk frames and two idle frames: from the sprite camera with everything, and from the
    side without the aura, so the legs read. Framed on the spirit itself, not its aura."""
    import numpy as np
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = False
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.view_settings.view_transform = "Standard"
    meshes = [o for o in scene.objects if o.type == "MESH"]
    aura = [o for o in meshes if o.parent_type == "BONE" and o.parent_bone == "root"]
    bpy.context.view_layer.update()
    lo, hi = _world_bbox([o for o in meshes if o not in aura] or meshes)
    mid = (lo + hi) / 2
    span = max(hi - lo) * 1.35
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.type = "ORTHO"; cam.data.ortho_scale = span
    cam.data.clip_end = span * 20
    scene.collection.objects.link(cam); scene.camera = cam
    if not scene.world:
        scene.world = bpy.data.worlds.new("w")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.0; sun.rotation_euler = (0.7, 0.2, 0.6)
    scene.collection.objects.link(sun)
    frames = [(None, 1)] + [("Walk", 1 + k * WALK_KEYS // 4) for k in range(4)] + \
             [("Idle", 1 + IDLE_KEYS // 4), ("Idle", 1 + 3 * IDLE_KEYS // 4)]
    views = [(CAM_DIR * 3 + Vector((0, 0, 1.9)), False), (Vector((0, -3, 0.35)), True)]
    tmp = pathlib.Path(out_png).with_suffix("")
    W, Hh = size * len(frames), size * len(views)
    out = np.zeros((Hh, W, 4), dtype=np.float32)
    out[...] = (0.1, 0.1, 0.12, 1.0)
    for row, (heading, bare) in enumerate(views):
        cam.location = mid + heading.normalized() * span * 4
        cam.rotation_euler = (mid - cam.location).to_track_quat("-Z", "Y").to_euler()
        for o in aura:
            o.hide_render = bare
        for i, (act, fr) in enumerate(frames):
            for t in rig.animation_data.nla_tracks:
                t.mute = t.name != act
            scene.frame_set(fr)
            p = f"{tmp}-{row}-{i}.png"
            scene.render.filepath = p
            bpy.ops.render.render(write_still=True)
            im = bpy.data.images.load(p)
            px = np.empty(size * size * 4, dtype=np.float32)
            im.pixels.foreach_get(px)
            px = px.reshape(size, size, 4)
            y0 = (len(views) - 1 - row) * size                          # Blender's rows run bottom up
            tile = out[y0:y0 + size, i * size:(i + 1) * size]
            tile[..., :3] = px[..., :3] * px[..., 3:] + tile[..., :3] * (1 - px[..., 3:])
            bpy.data.images.remove(im)
            os.remove(p)
    img = bpy.data.images.new("sheet", W, Hh, alpha=True)
    img.pixels.foreach_set(out.ravel())
    img.filepath_raw = str(out_png); img.file_format = "PNG"; img.save()
    for o in aura:
        o.hide_render = False


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("glb")
    ap.add_argument("out")
    ap.add_argument("--base", required=True, choices=sorted(SIZE))
    ap.add_argument("--stage", required=True, choices=FLOAT_STAGES + LIVING_STAGES)
    ap.add_argument("--sheet", action="store_true", help="render the pose sheet (Cycles, CPU)")
    a = ap.parse_args(argv)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=a.glb)
    row = rig_scene(a.base, a.stage)
    out = pathlib.Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    name = f"{pathlib.Path(a.glb).stem}-{a.base}-rig"
    export_glb(out / f"{name}.glb")
    row["file"] = f"{name}.glb"
    row["bytes"] = os.path.getsize(out / row["file"])
    (out / f"{name}.json").write_text(json.dumps(row, indent=1))
    print(json.dumps(row))
    if a.sheet:
        sheet(bpy.data.objects["Frame"], a.base, a.stage, out / f"{name}-poses.png")


if __name__ == "__main__":
    main()
