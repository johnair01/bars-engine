"""Checks a character GLB's walk from the exported file (J4): W3's swing and swap, and no joint inverted. Run under the
bpy venv. Prints one JSON line.

usage: python _walk_check.py FIGURE.glb
Joints are read where the glTF puts them (each bone's head, posed, in world space), so the check does not trust the
builder. The figure faces -Y and its own left is +X once imported (Z up).
  swing   at a quarter of the cycle the thighs swing opposite ways, and by three quarters they have swapped (W3)
  knees   every key, each shin folds backward from its thigh or stays straight; never forward
  elbows  every key, each forearm folds forward from its upper arm or stays straight; never backward
  loop    the last key's pose is the first key's
"""
import json, sys

import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[1])
sc = bpy.context.scene
rig = next(o for o in sc.objects if o.type == "ARMATURE")
act = rig.animation_data.action
f0, f1 = (int(round(x)) for x in act.frame_range)
TOL = 0.02  # a straight limb, within about a degree


def heads(f):
    sc.frame_set(f)
    return {pb.name: rig.matrix_world @ pb.head for pb in rig.pose.bones}


def fold(h, a, b, c):
    """The fold at joint b, as the X part of (b - a) x (c - b), per unit length: + folds backward, - forward."""
    u, v = h[b] - h[a], h[c] - h[b]
    return u.normalized().cross(v.normalized()).x


frames = list(range(f0, f1 + 1))
n = len(frames) - 1
H = [heads(f) for f in frames]
problems, worst = [], {"knee": 1.0, "elbow": -1.0}
for k, h in enumerate(H):
    for s in "LR":
        kn = fold(h, "hip" + s, "knee" + s, "ankle" + s)
        el = fold(h, "shoulder" + s, "elbow" + s, "wrist" + s)
        worst["knee"], worst["elbow"] = min(worst["knee"], kn), max(worst["elbow"], el)
        if kn < -TOL:
            problems.append(f"knee{s} folds forward at key {k}")
        if el > TOL:
            problems.append(f"elbow{s} folds backward at key {k}")


def thigh_y(h, s):
    return (h["knee" + s] - h["hip" + s]).normalized().y  # - forward, + back


q1, q3 = H[n // 4], H[3 * n // 4]
if not thigh_y(q1, "L") * thigh_y(q1, "R") < 0:
    problems.append("at a quarter of the cycle the thighs swing the same way")
if not (thigh_y(q1, "L") * thigh_y(q3, "L") < 0 and thigh_y(q1, "R") * thigh_y(q3, "R") < 0):
    problems.append("at three quarters the thighs have not swapped")
drift = max((H[0][b] - H[-1][b]).length for b in H[0])
if drift > 1e-3:
    problems.append(f"the last key is {drift * 100:.2f} cm from the first")
print(json.dumps({"keys": len(frames), "problems": problems, "worst_knee": round(worst["knee"], 4),
                  "worst_elbow": round(worst["elbow"], 4), "loop_cm": round(drift * 100, 4)}))
