"""Read back a retargeted clip: check.py -- MOCAP.blend [ACTION]. Prints one JSON line.

For each spine-chain bone, the cycle-mean world rotation away from rest (degrees, XYZ euler), the ankles' lowest
height, the shoulders' mean lift above their rest (degrees; levelled to about 0) and the key count. The retarget levels the head and the torso's yaw; this is how a test sees that it held."""
import bpy, sys, json, math
argv = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.open_mainfile(filepath=argv[0])
T = bpy.data.objects["GAME_RIG_Figure"]; sc = bpy.context.scene
act = bpy.data.actions[argv[1] if len(argv) > 1 else "MocapWalk"]
T.animation_data.action = act
sc.frame_start, sc.frame_end = int(act.frame_range[0]), int(act.frame_range[1])
names = ["spine", "spine.001", "spine.002", "spine.003", "spine.004", "spine.005", "spine.006"]
acc = {n: [0.0, 0.0, 0.0] for n in names}
frames = range(sc.frame_start, sc.frame_end)  # the last key repeats the first
low = 9.0
lift = {s: 0.0 for s in ("shoulder.L", "shoulder.R")}
def elev(v): return math.degrees(math.asin(max(-1, min(1, v.normalized().z))))
for f in frames:
    sc.frame_set(f)
    for n in names:
        pb = T.pose.bones[n]
        d = (pb.matrix.to_3x3() @ pb.bone.matrix_local.to_3x3().inverted()).to_euler("XYZ")
        for i in range(3): acc[n][i] += math.degrees(d[i]) / len(frames)
    for s in lift:
        pb = T.pose.bones[s]
        lift[s] += (elev(pb.tail - pb.head) - elev(pb.bone.tail_local - pb.bone.head_local)) / len(frames)
    low = min(low, min((T.matrix_world @ T.pose.bones[b].head).z for b in ("foot.L", "foot.R")))
print("@@JSON@@" + json.dumps({"action": act.name, "travel_m": act.get("travel_m"), "keys": sc.frame_end - sc.frame_start + 1,
                              "mean_deg": {n: [round(x, 1) for x in v] for n, v in acc.items()},
                              "shoulder_lift_deg": {s: round(v, 1) for s, v in lift.items()}, "lowest_ankle_m": round(low, 3)}))
