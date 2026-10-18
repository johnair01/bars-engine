"""Read back a retargeted MocapWalk: check.py -- MOCAP.blend. Prints one JSON line.

For each spine-chain bone, the cycle-mean world rotation away from rest (degrees, XYZ euler), the ankles' lowest
height and the key count. The retarget levels the head and the torso's yaw; this is how a test sees that it held."""
import bpy, sys, json, math
bpy.ops.wm.open_mainfile(filepath=sys.argv[-1])
T = bpy.data.objects["GAME_RIG_Figure"]; sc = bpy.context.scene
act = bpy.data.actions["MocapWalk"]
names = ["spine", "spine.001", "spine.002", "spine.003", "spine.004", "spine.005", "spine.006"]
acc = {n: [0.0, 0.0, 0.0] for n in names}
frames = range(sc.frame_start, sc.frame_end)  # the last key repeats the first
low = 9.0
for f in frames:
    sc.frame_set(f)
    for n in names:
        pb = T.pose.bones[n]
        d = (pb.matrix.to_3x3() @ pb.bone.matrix_local.to_3x3().inverted()).to_euler("XYZ")
        for i in range(3): acc[n][i] += math.degrees(d[i]) / len(frames)
    low = min(low, min((T.matrix_world @ T.pose.bones[b].head).z for b in ("foot.L", "foot.R")))
print("@@JSON@@" + json.dumps({"keys": sc.frame_end - sc.frame_start + 1,
                              "mean_deg": {n: [round(x, 1) for x in v] for n, v in acc.items()},
                              "lowest_ankle_m": round(low, 3)}))
