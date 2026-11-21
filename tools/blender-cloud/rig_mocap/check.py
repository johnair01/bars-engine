"""Read back a retargeted clip: check.py -- MOCAP.blend [ACTION] [--bvh SOURCE.bvh]. Prints one JSON line.

With --bvh it also scores the clip against that source BVH over one cycle (score_math.py): joint angle error for thigh,
shin, upper arm and forearm, arm-swing size against the source, and the arms' opposition to the same-side legs. The cycle
start and length come from the action (retarget.py stores them as src_start and src_period).

For each spine-chain bone, the cycle-mean world rotation away from rest (degrees, XYZ euler), the ankles' lowest
height, the shoulders' mean lift above their rest (degrees; levelled to about 0) and the key count. The retarget levels the head and the torso's yaw; this is how a test sees that it held."""
import bpy, sys, json, math
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import score_math
argv = sys.argv[sys.argv.index("--") + 1:]
BVH = argv.pop(argv.index("--bvh") + 1) if "--bvh" in argv else None
if BVH: argv.remove("--bvh")
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

def run_score():
    """Sample figure and source at the same phase of the cycle, then score_math.score them."""
    N = sc.frame_end - sc.frame_start
    start, P = act["src_start"], act["src_period"]
    # a bone's direction runs from its joint to the next joint (head to head), the same on both skeletons
    FIG = {"thigh": ("thigh", "shin"), "shin": ("shin", "foot"), "upper_arm": ("upper_arm", "forearm"), "forearm": ("forearm", "hand")}
    SRC = {"thigh": ("UpLeg", "Leg"), "shin": ("Leg", "Foot"), "upper_arm": ("Arm", "ForeArm"), "forearm": ("ForeArm", "Hand")}
    bpy.ops.object.select_all(action="DESELECT")
    bpy.ops.import_anim.bvh(filepath=BVH, global_scale=1.0, rotate_mode="NATIVE", update_scene_fps=False, update_scene_duration=False)
    S = bpy.context.object
    fig, src, ff, sf = {}, {}, {}, {}
    def seg(obj, a, b):
        return obj.matrix_world @ obj.pose.bones[a].head, obj.matrix_world @ obj.pose.bones[b].head
    for k in range(N):
        sc.frame_set(sc.frame_start + k)
        for s in ("L", "R"):
            for j, (a, b) in FIG.items():
                h, t = seg(T, f"{a}.{s}", f"{b}.{s}")
                fig.setdefault(f"{j}.{s}", []).append(t - h)
            h, t = seg(T, f"foot.{s}", f"toe.{s}")
            ff.setdefault(s, []).append(t - h)
    for k in range(N):
        fr = start + k * P / N
        sc.frame_set(int(fr), subframe=fr - int(fr))
        for s, side in (("L", "Left"), ("R", "Right")):
            for j, (a, b) in SRC.items():
                h, t = seg(S, side + a, side + b)
                src.setdefault(f"{j}.{s}", []).append(t - h)
            h, t = seg(S, side + "Foot", side + "ToeBase")
            sf.setdefault(s, []).append(t - h)
    def fwd(fs):
        v = [0.0, 0.0]
        for s in fs:
            for d in fs[s]: v[0] += d[0]; v[1] += d[1]
        n = math.hypot(*v) or 1.0
        return (v[0] / n, v[1] / n)
    f_fig, f_src = fwd(ff), fwd(sf)
    out_f = {k: [score_math.sagittal(d, f_fig) for d in v] for k, v in fig.items()}
    out_s = {k: [score_math.sagittal(d, f_src) for d in v] for k, v in src.items()}
    bpy.data.objects.remove(S)
    return score_math.score(out_f, out_s)

row = {"action": act.name, "travel_m": act.get("travel_m"), "keys": sc.frame_end - sc.frame_start + 1,
                              "mean_deg": {n: [round(x, 1) for x in v] for n, v in acc.items()},
                              "shoulder_lift_deg": {s: round(v, 1) for s, v in lift.items()}, "lowest_ankle_m": round(low, 3)}
if BVH: row["score"] = run_score()
print("@@JSON@@" + json.dumps(row))
