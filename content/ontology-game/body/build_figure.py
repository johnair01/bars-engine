"""Builds the body-map figure for the Ontology Alchemy Game in Blender and exports it as glTF.

Run with Blender's Python module (pip install bpy, Blender 5.2 LTS) or inside Blender:
    python3 content/ontology-game/body/build_figure.py
Output: content/ontology-game/body/figure.glb, which scripts/build-ontology-game.mjs copies
into the site build. The .glb is committed, so the site build does not need Blender.

The figure is one seamless surface (rounded primitives fused by a voxel remesh), so a tap anywhere lands on the body
and never in a gap between parts. Design choices (choices, not measurements):
- No sex, age, skin colour or face. Players of any body should be able to read it as theirs.
- Standing, arms held a little away from the sides, so the inner arms, flanks and hands
  can each be tapped on a phone.
- Proportions follow the common artists' canon of about 7.5 heads tall, 1.75 units overall.
- Named anchor points sit on the surface, front and back. The page names a tap by its
  nearest anchor, so "my throat" and "the back of my neck" come out of the same tap rule.
  Each anchor's words are stored in the glTF as an extra called "label".
"""
import math
import os

import bpy
import bmesh
from mathutils import Matrix, Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figure.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---- the body, from rounded primitives fused into one surface ----------------------------
bm = bmesh.new()


def ellipsoid(c, rx, ry, rz):
    m = Matrix.Translation(c) @ Matrix.Diagonal((rx, ry, rz, 1))
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0, matrix=m)


def limb(a, b, ra, rb):
    """A tapered capsule from a (radius ra) to b (radius rb)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    m = Matrix.Translation((a + b) / 2) @ rot
    bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=ra, radius2=rb, depth=d.length, matrix=m)
    ellipsoid(a, ra, ra, ra)
    ellipsoid(b, rb, rb, rb)


def loft(profile, segments=32, steps=8):
    """A closed-sided tube through elliptical rings (z, rx, ry), eased between key rings."""
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


# Z is up, the figure faces -Y (towards Blender's front view), its own left is +X.
# Sizes are true radii in units of about one metre.
ellipsoid((0, 0.005, 1.625), 0.078, 0.098, 0.115)          # head
limb((0, 0.012, 1.44), (0, 0.012, 1.57), 0.058, 0.052)     # neck
# Trunk: elliptical cross-sections from hips to shoulders, lofted into one tube.
# (z, half-width, half-depth), read from the front and side silhouettes of the canon.
TRUNK = [(0.90, 0.150, 0.092), (0.98, 0.165, 0.104), (1.06, 0.152, 0.100), (1.13, 0.134, 0.092),
         (1.21, 0.146, 0.098), (1.30, 0.163, 0.106), (1.37, 0.168, 0.096), (1.43, 0.120, 0.068)]
loft(TRUNK)
ellipsoid((0, 0.0, 0.92), 0.150, 0.092, 0.06)              # closes the hips
limb((-0.17, 0.0, 1.385), (0.17, 0.0, 1.385), 0.06, 0.06)  # shoulder line
for s in (-1, 1):
    # Arms, held about 17 degrees off the sides
    limb((s * 0.19, 0, 1.385), (s * 0.27, 0.01, 1.13), 0.047, 0.038)
    limb((s * 0.27, 0.01, 1.13), (s * 0.345, -0.02, 0.89), 0.037, 0.029)
    ellipsoid((s * 0.365, -0.025, 0.825), 0.026, 0.045, 0.07)  # hand
    # Legs
    limb((s * 0.09, 0, 0.96), (s * 0.105, 0.0, 0.50), 0.085, 0.055)
    limb((s * 0.105, 0.0, 0.50), (s * 0.115, 0.015, 0.085), 0.053, 0.035)
    ellipsoid((s * 0.12, -0.035, 0.035), 0.042, 0.11, 0.036)  # foot

raw = bpy.data.meshes.new("Raw")
bm.to_mesh(raw)
bm.free()
fig = bpy.data.objects.new("Figure", raw)
scene.collection.objects.link(fig)

# Fuse the overlapping parts into one closed surface (voxel remesh), soften the seams, and
# keep the triangle count phone-sized.
rm = fig.modifiers.new("Remesh", "REMESH")
rm.mode = "VOXEL"
rm.voxel_size = 0.007
sm = fig.modifiers.new("Smooth", "SMOOTH")
sm.factor = 0.8
sm.iterations = 8
dec = fig.modifiers.new("Decimate", "DECIMATE")
dec.ratio = 0.12
dg = bpy.context.evaluated_depsgraph_get()
fused = bpy.data.meshes.new_from_object(fig.evaluated_get(dg))
fig.modifiers.clear()
fig.data = fused
for p in fig.data.polygons:
    p.use_smooth = True

mat = bpy.data.materials.new("Clay")
mat.diffuse_color = (0.78, 0.74, 0.70, 1.0)
mat.roughness = 0.8
fig.data.materials.append(mat)


# ---- anchors: the named places a tap resolves to -----------------------------------------
# (name, words, x, z, side). side "f" sits on the front surface, "b" on the back; the
# script projects each one onto the surface along Y, so only height and width are given.
# "l"/"r" names are the figure's own left and right (a choice: the page labels sides and
# says so under the figure).
ANCHORS = [
    ("crown", "the top of my head", 0, 1.745, "t"),
    ("forehead", "my forehead", 0, 1.68, "f"),
    ("eyes", "my eyes", 0, 1.635, "f"),
    ("jaw", "my jaw", 0, 1.55, "f"),
    ("back_of_head", "the back of my head", 0, 1.64, "b"),
    ("throat", "my throat", 0, 1.49, "f"),
    ("back_of_neck", "the back of my neck", 0, 1.49, "b"),
    ("heart", "my heart", 0, 1.32, "f"),
    ("upper_chest", "my upper chest", 0, 1.39, "f"),
    ("solar_plexus", "my solar plexus", 0, 1.20, "f"),
    ("belly", "my belly", 0, 1.06, "f"),
    ("pelvis", "my pelvis", 0, 0.96, "f"),
    ("upper_back", "my upper back", 0, 1.33, "b"),
    ("mid_back", "my mid back", 0, 1.18, "b"),
    ("lower_back", "my lower back", 0, 1.03, "b"),
    ("seat", "my seat", 0, 0.95, "b"),
    # Finer places, for the zoomed-in view of each part (Wendell, 6 October 2026: "click a
    # section and be able to zoom in to fine tune").
    ("mouth", "my mouth", 0, 1.565, "f"),
    ("nose", "my nose", 0, 1.60, "f"),
    ("between_shoulder_blades", "between my shoulder blades", 0, 1.38, "b"),
    ("lower_belly", "my lower belly", 0, 1.00, "f"),
    ("sternum", "my sternum", 0, 1.26, "f"),
]
for s, side in ((1, "left"), (-1, "right")):
    ANCHORS += [
        (f"{side}_shoulder", f"my {side} shoulder", s * 0.20, 1.43, "t"),
        (f"{side}_chest", f"the {side} side of my chest", s * 0.11, 1.31, "f"),
        (f"{side}_ribs", f"my {side} ribs", s * 0.12, 1.17, "f"),
        (f"{side}_hip", f"my {side} hip", s * 0.15, 0.96, "f"),
        (f"{side}_shoulder_blade", f"my {side} shoulder blade", s * 0.11, 1.33, "b"),
        (f"{side}_upper_arm", f"my {side} upper arm", s * 0.23, 1.26, "s"),
        (f"{side}_elbow", f"my {side} elbow", s * 0.29, 1.13, "s"),
        (f"{side}_forearm", f"my {side} forearm", s * 0.335, 1.00, "s"),
        (f"{side}_hand", f"my {side} hand", s * 0.395, 0.80, "s"),
        (f"{side}_thigh", f"my {side} thigh", s * 0.10, 0.72, "f"),
        (f"{side}_knee", f"my {side} knee", s * 0.11, 0.50, "f"),
        (f"{side}_calf", f"my {side} calf", s * 0.115, 0.30, "b"),
        (f"{side}_shin", f"my {side} shin", s * 0.115, 0.30, "f"),
        (f"{side}_foot", f"my {side} foot", s * 0.125, 0.04, "f"),
        (f"{side}_temple", f"my {side} temple", s * 0.07, 1.66, "s"),
        (f"{side}_ear", f"my {side} ear", s * 0.07, 1.62, "s"),
        (f"{side}_cheek", f"my {side} cheek", s * 0.045, 1.595, "f"),
        (f"{side}_jaw", f"the {side} side of my jaw", s * 0.05, 1.56, "f"),
        (f"{side}_side_of_neck", f"the {side} side of my neck", s * 0.05, 1.50, "s"),
        (f"{side}_collarbone", f"my {side} collarbone", s * 0.09, 1.42, "f"),
        (f"{side}_armpit", f"my {side} armpit", s * 0.175, 1.33, "f"),
        (f"{side}_side_of_belly", f"the {side} side of my belly", s * 0.10, 1.08, "f"),
        (f"{side}_lower_back", f"the {side} side of my lower back", s * 0.08, 1.04, "b"),
        (f"{side}_inner_elbow", f"the inside of my {side} elbow", s * 0.275, 1.13, "f"),
        (f"{side}_wrist", f"my {side} wrist", s * 0.355, 0.88, "s"),
        (f"{side}_back_of_thigh", f"the back of my {side} thigh", s * 0.10, 0.72, "b"),
        (f"{side}_back_of_knee", f"the back of my {side} knee", s * 0.11, 0.50, "b"),
        (f"{side}_ankle", f"my {side} ankle", s * 0.118, 0.10, "f"),
        (f"{side}_heel", f"my {side} heel", s * 0.12, 0.035, "b"),
    ]



# The parts a first tap zooms into. Each anchor belongs to one; the page frames the part's
# anchors when it is tapped.
def region_of(name):
    for side in ("left", "right"):
        if name.startswith(side + "_"):
            rest = name[len(side) + 1:]
            if rest in ("upper_arm", "elbow", "inner_elbow", "forearm", "wrist", "hand", "armpit"):
                return side + "_arm"
            if rest in ("thigh", "back_of_thigh", "knee", "back_of_knee", "calf", "shin", "ankle", "foot", "heel"):
                return side + "_leg"
            if rest in ("temple", "ear", "cheek", "jaw", "side_of_neck"):
                return "head"
            if rest in ("shoulder_blade", "lower_back"):
                return "back"
            if rest in ("chest", "collarbone", "shoulder"):
                return "chest"
            return "belly"  # ribs, hip, side_of_belly
    if name in ("crown", "forehead", "eyes", "nose", "mouth", "jaw", "back_of_head", "throat", "back_of_neck"):
        return "head"
    if name in ("upper_back", "mid_back", "lower_back", "seat", "between_shoulder_blades"):
        return "back"
    if name in ("heart", "upper_chest", "sternum"):
        return "chest"
    return "belly"  # solar_plexus, belly, lower_belly, pelvis


dg = bpy.context.evaluated_depsgraph_get()
fig_eval = fig.evaluated_get(dg)
for name, words, x, z, side in ANCHORS:
    if side == "t":  # straight down from above
        origin, direction = Vector((x, 0, 2.2)), Vector((0, 0, -1))
    elif side == "s":  # from the figure's outside edge, inwards
        origin, direction = Vector((math.copysign(1.2, x), 0, z)), Vector((-math.copysign(1, x), 0, 0))
    elif side == "f":
        origin, direction = Vector((x, -1.0, z)), Vector((0, 1, 0))
    else:
        origin, direction = Vector((x, 1.0, z)), Vector((0, -1, 0))
    hit, loc, _n, _i = fig_eval.ray_cast(origin, direction)
    if not hit:
        raise SystemExit(f"anchor {name} missed the body")
    emp = bpy.data.objects.new(f"anchor.{name}", None)
    emp.location = loc
    emp["label"] = words
    emp["region"] = region_of(name)
    scene.collection.objects.link(emp)

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    export_extras=True,
    export_apply=True,
    export_yup=True,
    export_normals=True,
    export_texcoords=False,
)
print(f"wrote {OUT}: {len(fig.data.polygons)} faces, {len(ANCHORS)} anchors, "
      f"{os.path.getsize(OUT) // 1024} KB")
