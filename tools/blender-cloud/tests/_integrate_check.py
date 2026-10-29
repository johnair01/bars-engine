"""Checks a daemon figure's Integrate action from the exported file (J7): the held shape lets go into the open stance.
Run under the bpy venv. Prints one JSON line.

usage: python _integrate_check.py FIGURE.glb
Joints are read where the glTF puts them (each bone's head and tail, posed, in world space), so the check does not
trust the builder. The figure faces -Y and its own left is +X once imported (Z up).
  hands   each hand opens: the middle fingertip ends at least a third farther from the wrist than it starts
  arms    each wrist comes away from where it was held, by 10 cm or more, and the forearm ends hanging or held out
          (the honored form), never raised more than a fifth of its length above its elbow
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
opened = {}
for s in "LR":
    reach = [(p["middle3" + s][1] - p["wrist" + s][0]).length for p in (first, last)]
    opened[s] = round(reach[1] / reach[0], 3)
    if reach[1] < reach[0] * 4 / 3:
        problems.append(f"hand {s} does not open: fingertip {reach[0] * 100:.1f} to {reach[1] * 100:.1f} cm from the wrist")
    moved = (last["wrist" + s][0] - first["wrist" + s][0]).length
    if moved < 0.1:
        problems.append(f"wrist {s} moves only {moved * 100:.1f} cm")
    # every let-go ends in the daemon's honored form (character.py HONORED, Wendell 2026-10-16), where a hand may be
    # held out to the child, so the forearm ends hanging or held out, never raised above its elbow
    fore = last["wrist" + s][0] - last["elbow" + s][0]
    if -fore.z < -0.2 * fore.length:
        problems.append(f"forearm {s} ends raised")
still = max(max((a[b][0] - c[b][0]).length for b in a) for a, c in ((P[0], P[1]), (P[-2], P[-1])))
if still > 1e-4:
    problems.append(f"no held beat at an end: {still * 100:.2f} cm between the end keys")
print(json.dumps({"keys": len(frames), "seconds": round(len(frames) / sc.render.fps, 2), "problems": problems,
                  "opened": opened, "ground_cm": round(worst_ground * 100, 3)}))
