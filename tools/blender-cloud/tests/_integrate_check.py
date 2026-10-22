"""Checks a daemon figure's Integrate action from the exported file (J7): the held shape lets go into the open stance.
Run under the bpy venv. Prints one JSON line.

usage: python _integrate_check.py FIGURE.glb
Joints are read where the glTF puts them (each bone's head and tail, posed, in world space), so the check does not
trust the builder. The figure faces -Y and its own left is +X once imported (Z up).
  hands   each hand opens: the middle fingertip ends at least a third farther from the wrist than it starts
  arms    each wrist comes away from where it was held, by 10 cm or more. The left forearm then hangs at the side
          (its drop at least half its length) and the right is offered forward (at least half its length forward of
          its elbow, and no more than 5 cm above it): HONORED["controller"] in character.py, the right hand out low
          and open for the child to hold, the left loose at its side
  ground  every key, the lower foot is within 1 cm of the ground it stands on at rest
  knees, elbows  as the walk: never folding the wrong way
  still   the first two keys are the same pose, and so are the last two (a held beat at each end)
"""
import json, sys

import bpy

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[1])
sc = bpy.context.scene
rig = next(o for o in sc.objects if o.type == "ARMATURE")
act = bpy.data.actions.get("Integrate")
if act is None:
    print(json.dumps({"problems": ["no Integrate action"]}))
    sys.exit(0)
for tr in list(rig.animation_data.nla_tracks):
    rig.animation_data.nla_tracks.remove(tr)
rig.animation_data.action = act
f0, f1 = (int(round(x)) for x in act.frame_range)


def pose(f):
    sc.frame_set(f)
    return {pb.name: (rig.matrix_world @ pb.head, rig.matrix_world @ pb.tail) for pb in rig.pose.bones}


def fold(p, a, b, c):
    u, v = p[b][0] - p[a][0], p[c][0] - p[b][0]
    return u.normalized().cross(v.normalized()).x


REST = {b.name: rig.matrix_world @ b.head_local for b in rig.data.bones}
feet = [b for b in REST if b.startswith("ankle")]
ground = min(min((rig.matrix_world @ rig.data.bones[b].head_local).z, (rig.matrix_world @ rig.data.bones[b].tail_local).z)
             for b in feet)
frames = list(range(f0, f1 + 1))
P = [pose(f) for f in frames]
problems, worst_ground = [], 0.0
for k, p in enumerate(P):
    low = min(min(p[b][0].z, p[b][1].z) for b in feet)
    worst_ground = max(worst_ground, abs(low - ground))
    if abs(low - ground) > 0.01:
        problems.append(f"at key {k} the lower foot is {(low - ground) * 100:.1f} cm off the ground")
    for s in "LR":
        if fold(p, "hip" + s, "knee" + s, "ankle" + s) < -0.02:
            problems.append(f"knee{s} folds forward at key {k}")
        if fold(p, "shoulder" + s, "elbow" + s, "wrist" + s) > 0.02:
            problems.append(f"elbow{s} folds backward at key {k}")
first, last = P[0], P[-1]
# HONORED["controller"]: the left loose at its side, the right hand offered forward and open (character.py, 2026-10-17)
HANGING, OFFERED = "L", "R"
opened = {}
for s in "LR":
    reach = [(p["middle3" + s][1] - p["wrist" + s][0]).length for p in (first, last)]
    opened[s] = round(reach[1] / reach[0], 3)
    if reach[1] < reach[0] * 4 / 3:
        problems.append(f"hand {s} does not open: fingertip {reach[0] * 100:.1f} to {reach[1] * 100:.1f} cm from the wrist")
    moved = (last["wrist" + s][0] - first["wrist" + s][0]).length
    if moved < 0.1:
        problems.append(f"wrist {s} moves only {moved * 100:.1f} cm")
    fore = last["wrist" + s][0] - last["elbow" + s][0]
    if s == HANGING and -fore.z < 0.5 * fore.length:
        problems.append(f"forearm {s} does not end hanging: {(-fore.z) * 100:.1f} cm of drop over {fore.length * 100:.1f} cm")
    if s == OFFERED:
        forward = -fore.y                                     # the figure faces -Y
        if forward < 0.5 * fore.length:
            problems.append(f"the offered forearm {s} reaches only {forward * 100:.1f} cm forward of its elbow, "
                            f"of {fore.length * 100:.1f} cm")
        if fore.z > 0.05:
            problems.append(f"the offered hand {s} ends {fore.z * 100:.1f} cm above its elbow")
still = max(max((a[b][0] - c[b][0]).length for b in a) for a, c in ((P[0], P[1]), (P[-2], P[-1])))
if still > 1e-4:
    problems.append(f"no held beat at an end: {still * 100:.2f} cm between the end keys")
print(json.dumps({"keys": len(frames), "seconds": round(len(frames) / sc.render.fps, 2), "problems": problems,
                  "opened": opened, "ground_cm": round(worst_ground * 100, 3)}))
