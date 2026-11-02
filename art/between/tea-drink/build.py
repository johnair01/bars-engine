"""The seated drink of tea, authored in Blender (round 5 of the Between tea; his choice on look tea-drink-look-1).

Builds art/between/tea-drink/tea-drink.blend from average-dusk.glb and bakes public/between/m/dusk/tea-drink.glb, the
clips public/between/tea-drink.js plays on the live figure. Rerun it whenever a key below changes:

    npm i --no-save --prefix /tmp/t three@0.160.0
    THREE_DIR=/tmp/t/node_modules/three node tools/tea-drink-inputs.mjs > /tmp/tea-inputs.json
    /home/user/blenv/bin/python art/between/tea-drink/build.py -- /tmp/tea-inputs.json
    THREE_DIR=/tmp/t/node_modules/three node tools/tea-hand-probe.mjs        # the check

(/home/user/blenv is the bpy 5.2.2 pip package, tools/blender-cloud/README.md.) The scene stands on the round 4 numbers:
tools/tea-drink-inputs.mjs prints the sat figure as the page poses it and tea-pose.js's stone, kettle, cup spot, cup size,
HAND and GRIP, all in metres, so the stone here is the stone the page draws.

The rig (recorded for the next round): Average Dusk's own 20-bone armature, as imported. Its bones point along +Y to their
child's head like a Blender rig's, so each Blender bone frame is the glTF node frame (checked below, to 1e-5) and a pose
here exports as the same local turns three.js gives the page's figure. Plain IK constraints with pole targets hold on it
(Rigify's metarig fit was not needed for two two-bone arms): IK on elbowR/elbowL, chain 2, to the empties HandR/HandL, poles
PoleR/PoleL, the wrists copying the empties' turn; once the left hand is under the cup, HandL copies CradleL, an empty
parented to the cup, so the cradle rides the cup. The cup is an object with two Child Of constraints, the stone's CupSpot
and the right wrist, switched on the frame the hand lifts it.

The drink, as the reference asks (council/callsheets/stills/2026-10-29-tea-drink-research/art-direction.md): reach (a
small draw-back first), pour (the cup still on the stone), lift (up off the stone, over the knee, in to the lap, the left
hand coming up under the cup), savour (the cup stops under the nose for a breath), three sips that tip the cup a little,
more and most, the head bowing to meet the cup and leading it, the cup on an arc to the middle of the lips, settle (in both
hands in the lap), hold (a breathing loop). Unequal ease, as Bezier handles on the hand empties' keys: away from the lap fast
(a short handle out), into the lips slow (a long handle in); a quick level-off off the lips, a slow lowering, and a small
overshoot and settle as the cup lands (SETTLE). Overlap: after the bake the elbows trail
the shoulders by LAG_ELBOW frames and the wrists by LAG_WRIST while one hand works alone (overlap_at). The breath is its own action on an NLA track that combines
over the drink (Combine: quaternions multiply), so either can change without the other.
"""
import json
import math
import os
import sys

import bpy
from bpy_extras import anim_utils
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
INPUTS = ARGS[0] if ARGS else "/tmp/tea-inputs.json"
OUT_GLB = ARGS[1] if len(ARGS) > 1 else os.path.join(REPO, "public/between/m/dusk/tea-drink.glb")
OUT_BLEND = ARGS[2] if len(ARGS) > 2 else os.path.join(HERE, "tea-drink.blend")
GLB = os.path.join(REPO, "public/between/m/dusk/average-dusk.glb")

D = json.load(open(INPUTS))
TOP, CUP, KET, HAND, GRIP = D["top"], D["CUP"], D["KETTLE"], D["HAND"], D["GRIP"]
FPS = 30
LAG_ELBOW, LAG_WRIST, LAG_LEFT = 2, 4, 4   # frames the elbow and the wrist trail the shoulder (overlap); the cradling wrist the same, so it stays under the cup
SETTLE = 0.008                       # how far the cup sinks past where it lands, before it settles back (m)
SLANT, DROP = 0.4, 0.012             # the right hand holds the cup slanting down across it, its middle DROP under the hand's line
DRIVEN = ["spine", "neck", "head", "shoulderR", "elbowR", "wristR", "shoulderL", "elbowL", "wristL"]
CONV = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))   # glTF (y up) to Blender (z up)


def fr(t):
    """Seconds into the drink to a frame (frame 1 is t 0)."""
    return 1 + round(t * FPS)


def S(x, y, z):
    """A point in the seat's frame (x the figure's left, y up from the seat's top, z ahead) in Blender's world."""
    return Vector((x, -z, y + TOP))


def Sd(x, y, z):
    return Vector((x, -z, y))


def seat_of(v):
    return [v.x, v.z - TOP, -v.y]


def q_gl(a):
    return Quaternion((a[3], a[0], a[1], a[2]))


def gl_mat(w):
    """A three.js matrix (its toArray, column by column) as a Matrix."""
    return Matrix([w[0:4], w[4:8], w[8:12], w[12:16]]).transposed()


def eul(x=0.0, y=0.0, z=0.0):
    """three.js Euler XYZ as a quaternion (qx * qy * qz), the convention stance.js and tea-pose.js write turns in."""
    return Quaternion((1, 0, 0), x) @ Quaternion((0, 1, 0), y) @ Quaternion((0, 0, 1), z)


# ---------------------------------------------------------------- the figure, sat as the page sits it
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS
bpy.ops.import_scene.gltf(filepath=GLB)
arm = bpy.data.objects["Rig"]
for o in list(bpy.data.objects):
    if o.name == "Icosphere":
        bpy.data.objects.remove(o)
for a in list(bpy.data.actions):
    bpy.data.actions.remove(a)
arm.animation_data_create()
arm.animation_data.action = None

# the Blender bone frames against the glTF node frames: the same, or the export would not match the page
W = {}


def gl_world(n):
    if n not in W:
        b = D["bones"][n]
        L = Matrix.Translation(b["p0"]) @ q_gl(b["q0"]).to_matrix().to_4x4()
        W[n] = gl_world(b["parent"]) @ L if b["parent"] else L
    return W[n]


frame_err = max(abs(((CONV @ gl_world(b.name)).inverted() @ (arm.matrix_world @ b.matrix_local))[i][j] - (i == j))
                for b in arm.data.bones if b.name in D["bones"] for i in range(4) for j in range(4))
assert frame_err < 1e-4, f"bone frames differ from the glTF nodes by {frame_err}"

PB = arm.pose.bones
for pb in PB:
    pb.rotation_mode = "QUATERNION"
SIT_BASIS = {}
BONES = [n for n in D["bones"] if n in arm.data.bones]   # the page's dressing adds two hem bones the file does not have
for n in BONES:
    b = D["bones"][n]
    q0, q = q_gl(b["q0"]), q_gl(b["q"])
    SIT_BASIS[n] = (q0.inverted() @ q, q0.inverted() @ (Vector(b["p"]) - Vector(b["p0"])))


def sit_pose():
    for n, (q, p) in SIT_BASIS.items():
        PB[n].rotation_quaternion = q
        PB[n].location = p


sit_pose()
bpy.context.view_layer.update()
# the sat joints here against the page's (tools/tea-rig.mjs), in metres
sit_err = max(((arm.matrix_world @ PB[n].head) - (CONV @ gl_mat(D["bones"][n]["w"])).translation).length
              for n in BONES)
assert sit_err < 1e-4, f"the sit here is {sit_err} m off the page's"

# the sit as its own action, at the bottom of the stack
sit_act = bpy.data.actions.new("Sit")
sit_act.use_fake_user = True
arm.animation_data.action = sit_act
for n in BONES:
    PB[n].keyframe_insert("rotation_quaternion", frame=1)
    if n == "hips":
        PB[n].keyframe_insert("location", frame=1)
tr = arm.animation_data.nla_tracks.new()
tr.name = "Sit"
tr.strips.new("Sit", 1, sit_act)
arm.animation_data.action = None

# ---------------------------------------------------------------- the hearth: the seat, the stone, the pot, the cup
def mesh_obj(name, verts, faces, parent=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    sc.collection.objects.link(ob)
    if parent:
        ob.parent = parent
    return ob


def cylinder(name, r0, r1, h, seg=16, z0=0.0):
    v = [(r0 * math.cos(2 * math.pi * i / seg), r0 * math.sin(2 * math.pi * i / seg), z0) for i in range(seg)]
    v += [(r1 * math.cos(2 * math.pi * i / seg), r1 * math.sin(2 * math.pi * i / seg), z0 + h) for i in range(seg)]
    f = [(i, (i + 1) % seg, seg + (i + 1) % seg, seg + i) for i in range(seg)]
    f += [tuple(range(seg))[::-1], tuple(range(seg, 2 * seg))]
    return mesh_obj(name, v, f)


def empty(name, size=0.03, kind="PLAIN_AXES"):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = kind
    e.empty_display_size = size
    e.rotation_mode = "QUATERNION"
    sc.collection.objects.link(e)
    return e


K = D["kettle"]
stone = cylinder("Stone", KET["stone"][1], KET["stone"][0], KET["top"] + 0.4, 16)
stone.location = S(K["x"], -0.4, K["z"])
pot = cylinder("Kettle", KET["body"], KET["body"] * 0.6, KET["height"], 12)
pot.location = S(K["x"], KET["top"], K["z"])
seat = cylinder("Seat", 0.32, 0.30, 0.12, 20)
seat.location = S(0, -0.12, 0)
cs = D["cupSpot"]

cup = cylinder("Cup", CUP["r"] * 0.78, CUP["r"], CUP["h"], 16, -CUP["h"] / 2)   # its middle at the origin, +Z up
ear = cylinder("CupEar", 0.008, 0.008, 0.012, 8)                               # the cup's little ear, at its +X
ear.parent = cup
ear.location = (CUP["r"] * 0.95, 0, -0.006)
cup.rotation_mode = "QUATERNION"

# ---------------------------------------------------------------- the arm rig: IK to the hand empties, poles, wrist turns
handR, handL = empty("HandR", 0.05, "ARROWS"), empty("HandL", 0.05, "ARROWS")
poleR, poleL = empty("PoleR", 0.04, "SPHERE"), empty("PoleL", 0.04, "SPHERE")
poleR.location, poleL.location = S(-0.50, 0.15, -0.05), S(0.50, 0.15, -0.05)
for side, hand, pole in (("R", handR, poleR), ("L", handL, poleL)):
    ik = PB["elbow" + side].constraints.new("IK")
    ik.name = "IK"
    ik.target, ik.pole_target, ik.chain_count, ik.use_tail = hand, pole, 2, True
    cr = PB["wrist" + side].constraints.new("COPY_ROTATION")
    cr.name = "Turn"
    cr.target = hand
    for c in (ik, cr):
        c.influence = 0.0

mouth = empty("Mouth", 0.02, "SPHERE")       # the lips on this faceless head, carried by the head
mouth.parent, mouth.parent_type, mouth.parent_bone = arm, "BONE", "head"
bpy.context.view_layer.update()
mouth.matrix_world = Matrix.Translation(S(D["MOUTH"]["x"], D["MOUTH"]["y"], D["MOUTH"]["z"]))
bpy.context.view_layer.update()


def bone_world(n):
    return arm.matrix_world @ PB[n].matrix


def set_influence(side, k, frame):
    for b, c in (("elbow" + side, "IK"), ("wrist" + side, "Turn")):
        con = PB[b].constraints[c]
        con.influence = k
        con.keyframe_insert("influence", frame=frame)


def pole_angle_fit(side, hand, target):
    """The pole angle that points the elbow at its pole, found by trying them (the cheap check before any key)."""
    ik = PB["elbow" + side].constraints["IK"]
    ik.influence = 1.0
    hand.location = target
    best = (1e9, 0.0)
    for deg in range(-180, 180, 5):
        ik.pole_angle = math.radians(deg)
        bpy.context.view_layer.update()
        e, s, w = bone_world("elbow" + side).translation, bone_world("shoulder" + side).translation, bone_world("wrist" + side).translation
        ax = (w - s).normalized()
        foot = s + ax * (e - s).dot(ax)
        p = ik.pole_target.location
        pf = s + ax * (p - s).dot(ax)
        err = ((e - foot).normalized() - (p - pf).normalized()).length
        best = min(best, (err, deg))
    ik.pole_angle = math.radians(best[1])
    ik.influence = 0.0
    return best


fitR = pole_angle_fit("R", handR, S(-0.05, 0.30, 0.27))
fitL = pole_angle_fit("L", handL, S(0.05, 0.22, 0.27))
bpy.context.view_layer.update()

if os.environ.get("TEA_STAGE") == "rig":
    print("STAGE rig ok", json.dumps({"frame_err": frame_err, "sit_err": sit_err, "poleR": fitR, "poleL": fitL}))
    sys.exit(0)

# ---------------------------------------------------------------- the beats (seconds), and the clips they bake to
SIP_LEN = 5.0
T = {"reach": 0.0, "pour": 2.6, "lift": 5.2, "savour": 7.8, "sip1": 10.4}
T["sip2"] = T["sip1"] + SIP_LEN
T["sip3"] = T["sip2"] + SIP_LEN
T["settle"] = T["sip3"] + SIP_LEN
T["hold"] = T["settle"] + 1.2
HOLD_FROM, HOLD_TO = T["hold"] + 4.0, T["hold"] + 8.0   # the hold loop is cut from its second breath, once the arms are still
EXTRA = HOLD_TO                          # "Take a sip" after the drink: one more sip from the hold, back to the hold
END = EXTRA + SIP_LEN + 4.0
CLIPS = [("reach", 0.0, T["pour"]), ("pour", T["pour"], T["lift"]), ("lift", T["lift"], T["savour"]),
         ("savour", T["savour"], T["sip1"]), ("sip1", T["sip1"], T["sip2"]), ("sip2", T["sip2"], T["sip3"]),
         ("sip3", T["sip3"], T["settle"]), ("settle", T["settle"], T["hold"]), ("hold", HOLD_FROM, HOLD_TO),
         ("sip", EXTRA, EXTRA + SIP_LEN)]
SAVOUR = (3.6, SIP_LEN + 0.2)            # of each sip: the savour swells as the cup comes down and lands, gone by the next
TIP = {"sip1": 0.30, "sip2": 0.55, "sip3": 0.85, "sip": 0.85}   # each sip tips the cup further (rad at the end of the sip)
BREATH = {"period": 4.0, "spine": 0.022, "neck": -0.5}       # one breath every four seconds, the neck half against it

UPV = Sd(0, 1, 0)
LAP = (-0.03, 0.30, 0.27)        # the cup's middle held in front of the belly, in both hands
REST = (-0.03, 0.28, 0.255)      # and settled a little lower and nearer once the sips are done


def tipU(th):
    """The cup's up, tipped th toward the face (its top comes back toward the drinker, its foot goes up and away)."""
    return Sd(0, math.cos(th), -math.sin(th)).normalized()


def proj(a, U):
    v = a - U * a.dot(U)
    return v.normalized() if v.length > 1e-6 else Sd(0, 0, 1)


def cols(X, Y, Z):
    return Matrix((X, Y, Z)).transposed()


# ---------------------------------------------------------------- the Drink action: head, neck, spine, IK switches
act = bpy.data.actions.new("Drink")
act.use_fake_user = True
arm.animation_data.action = act


def key_fk(bone, t, x=0.0, y=0.0, z=0.0):
    PB[bone].rotation_quaternion = SIT_BASIS[bone][0] @ eul(x, y, z)
    PB[bone].keyframe_insert("rotation_quaternion", frame=fr(t))


def look(t, pitch, yaw=0.0):
    """The head and neck turn together, the neck taking 40 percent: pitch + bows the face down, yaw - turns it to the right."""
    key_fk("neck", t, 0.4 * pitch, 0.4 * yaw)
    key_fk("head", t, 0.6 * pitch, 0.6 * yaw)


def lean(t, fwd, side=0.0):
    key_fk("spine", t, fwd, 0.0, side)       # + bends forward, side + leans to the right


# the head leads: it goes to the stone before the hand, to the lap before the cup, and bows to the lips as the cup rises
look(0.0, 0.0); look(0.25, 0.0); look(1.5, 0.30, -0.45); look(2.6, 0.34, -0.45); look(4.9, 0.32, -0.42)
look(5.3, 0.32, -0.40); look(6.4, 0.24, -0.12); look(7.4, 0.28, 0.0)
look(7.9, 0.27, 0.0); look(8.8, 0.13, 0.0); look(10.4, 0.12, 0.0)
lean(0.0, 0.0); lean(0.3, -0.01, 0.0); lean(1.9, 0.14, 0.05); lean(5.2, 0.14, 0.05); lean(6.6, 0.06, 0.01)
lean(7.6, 0.03, 0.0); lean(9.0, 0.06, 0.0); lean(10.4, 0.06, 0.0)


def sip_fk(T0, kind, first=False):
    a = 1.2 if first else 1.4                 # the cup reaches the lips
    look(T0 + 0.15, 0.12 if first else -0.08)
    look(T0 + a - 0.2, 0.13)                  # bowed to meet it, a little before it arrives
    look(T0 + a + 0.6, 0.12)
    look(T0 + a + 1.2, 0.0 if kind in ("sip3", "sip") else 0.10)   # the last sips: the head tips back as the cup empties
    look(T0 + a + 1.45, 0.02 if kind in ("sip3", "sip") else 0.08)
    look(T0 + 4.3, -0.12)                     # the savour: the head lifts, the gaze goes out to the fire
    look(T0 + SIP_LEN, -0.08)
    lean(T0 + 0.2, 0.06 if first else 0.02)
    lean(T0 + a, 0.07)
    lean(T0 + a + 1.2, 0.06)
    lean(T0 + 4.3, -0.05)                     # the chest opens
    lean(T0 + SIP_LEN, -0.03)


for k in ("sip1", "sip2", "sip3"):
    sip_fk(T[k], k, first=(k == "sip1"))
look(T["settle"] + 0.6, 0.06); look(T["hold"], 0.08); lean(T["settle"] + 0.6, 0.0); lean(T["hold"], 0.02)
look(HOLD_FROM, 0.08); lean(HOLD_FROM, 0.02); look(EXTRA, 0.08); lean(EXTRA, 0.02)
sip_fk(EXTRA, "sip")
look(END, 0.08); lean(END, 0.02)

# the IK switches: off (the sit's own arm) until each hand goes to work, then on for good
set_influence("R", 0.0, fr(0.0)); set_influence("R", 1.0, fr(0.3))
set_influence("L", 0.0, fr(0.0)); set_influence("L", 0.0, fr(5.5)); set_influence("L", 1.0, fr(5.8))
for b in ("elbowR", "wristR", "elbowL", "wristL"):
    for c in PB[b].constraints:
        c.influence = 0.0

# ---------------------------------------------------------------- the hands, keyed from where the cup should be
KEYS = {"R": [], "L": []}   # (frame, ease) per key, for the handle pass
LEFT_UNTIL = 1e9            # the left hand is keyed until it rides the cup (CRADLE)


def wrist_frame(side, C, U, f):
    """The wrist's place and turn that hold a cup with its middle at C and its up U. Right: the palm (the wrist's +X) against
    the cup's side, the hand's length (+Y) across the cup, so the middle is HAND along the hand and GRIP out through the
    palm. Left: the palm (its -X) up under the cup's foot, the hand's middle under the cup's middle."""
    if side == "R":
        n = U.cross(f).normalized()
        fs = (f * math.cos(SLANT) - U * math.sin(SLANT)).normalized()
        R = cols(n, fs, n.cross(fs))
        p = C - fs * HAND - n * GRIP + U * DROP
    else:
        X = -U
        R = cols(X, f, X.cross(f))
        hc = C - U * (CUP["h"] / 2 + 0.050) + Sd(0, 0, -0.01)
        p = hc - f * 0.092
    return (Matrix.Translation(p) @ R.to_4x4())


LASTQ = {}


def same_hemisphere(side, hand):
    """Keep each key's quaternion on the side of the last one, so the curves between them take the short way round."""
    q = hand.rotation_quaternion.copy()
    if side in LASTQ and LASTQ[side].dot(q) < 0:
        q.negate()
        hand.rotation_quaternion = q
    LASTQ[side] = q


def key_hand(side, t, C, U, ease="hold", f0=None):
    hand = handR if side == "R" else handL
    frame = fr(t)
    sc.frame_set(frame)
    if side == "L" and not f0:   # the cradling hand's fingers run forward and across under the cup, whatever the forearm does
        f0 = proj(Sd(-0.6, 0, 0.8), U)
    f = f0 or proj(bone_world("wrist" + side).translation - bone_world("elbow" + side).translation, U)
    for _ in range(1 if f0 else 4):          # the hand's run across the cup follows the forearm, solved again each time
        keyed = f
        hand.matrix_world = wrist_frame(side, C, U, f)
        same_hemisphere(side, hand)
        hand.keyframe_insert("location", frame=frame)
        hand.keyframe_insert("rotation_quaternion", frame=frame)
        sc.frame_set(frame)
        f = proj(bone_world("wrist" + side).translation - bone_world("elbow" + side).translation, U)
    KEYS[side].append((frame, ease))
    return keyed


def key_fk_wrist(side, t):
    """The hand empty on the wrist where the sit's own arm has it, so the IK takes over without a jump."""
    hand = handR if side == "R" else handL
    frame = fr(t)
    sc.frame_set(frame)
    hand.matrix_world = bone_world("wrist" + side).copy()
    same_hemisphere(side, hand)
    hand.keyframe_insert("location", frame=frame)
    hand.keyframe_insert("rotation_quaternion", frame=frame)
    KEYS[side].append((frame, "hold"))


def lips(t, th, gap=0.003):
    """The cup's middle that puts its near rim on the middle of the lips, tipped th, at t (the head as keyed then)."""
    sc.frame_set(fr(t))
    M = mouth.matrix_world.translation
    U = tipU(th)
    Dn = Sd(0, -math.sin(th), -math.cos(th))      # from the cup's middle toward the face, square to its up
    return seat_of(M + Sd(0, 0, gap) - U * (CUP["h"] / 2) - Dn * CUP["r"]), U


def nose(t):
    sc.frame_set(fr(t))
    M = mouth.matrix_world.translation
    return seat_of(M + Sd(0, -0.012, 0.078))


def both(t, C, th=0.0, ease="hold", left=True):
    """Both hands on the cup at C. ease "land": the cup arrives a little low (SETTLE under C, slowly) and comes back up to C
    over the next third of a second: the overshoot and settle, as keys rather than BACK easing, which leaves a key at full
    speed and jolts the arm."""
    U = tipU(th) if not isinstance(th, Vector) else th
    keys = [(t, S(*C) - UPV * SETTLE, "slowin"), (t + 0.35, S(*C), "hold")] if ease == "land" else [(t, S(*C), ease)]
    for tt, P, e in keys:
        key_hand("R", tt, P, U, e)
        if left and tt <= LEFT_UNTIL:
            key_hand("L", tt, P, U, e)


# reach: the sit's hand, a small draw-back, out over the knee on an arc, slow onto the cup's side on the stone
key_fk_wrist("R", 0.0)
key_fk_wrist("R", 0.3)
sc.frame_set(fr(0.3))
w0 = seat_of(bone_world("wristR").translation)
handR.location = S(w0[0] + 0.012, w0[1] + 0.02, w0[2] - 0.02)        # anticipation: back and up a touch
handR.keyframe_insert("location", frame=fr(0.6))
handR.keyframe_insert("rotation_quaternion", frame=fr(0.6))
KEYS["R"].append((fr(0.6), "hold"))
cup_spot = (cs["x"], cs["y"], cs["z"])
over = (cs["x"] * 0.66, cs["y"] + 0.10, cs["z"] * 0.9 + 0.03)
key_hand("R", 1.6, S(*over), UPV, "pass")
f_grab = key_hand("R", 2.5, S(*cup_spot), UPV, "slowin")
key_hand("R", 2.6, S(*cup_spot), UPV, "hold", f0=f_grab)
key_hand("R", 5.2, S(*cup_spot), UPV, "hold", f0=f_grab)        # the pour: the cup stays on the stone, the hand on it
n_grab = UPV.cross(f_grab).normalized()
pre = seat_of(S(*cup_spot) - n_grab * 0.035 + UPV * 0.045)              # the hand comes in to the cup's side, not through it
key_hand("R", 2.15, S(*pre), UPV, "pass", f0=f_grab)
spot = empty("CupSpot", 0.03, "CUBE")
spot.matrix_world = Matrix.Translation(S(*cup_spot)) @ cols(n_grab, UPV.cross(n_grab), UPV).to_4x4()

# the cup: on the stone's spot until the hand lifts it, then in the right hand
cS, sS = math.cos(SLANT), math.sin(SLANT)    # the cup in the wrist's frame: wrist_frame("R", ...) read backwards
G = Matrix.Translation((GRIP, HAND + DROP * sS, DROP * cS)) @ cols(Vector((1, 0, 0)), Vector((0, -cS, sS)), Vector((0, -sS, -cS))).to_4x4()
c_st = cup.constraints.new("CHILD_OF")
c_st.name, c_st.target = "OnStone", spot
c_st.inverse_matrix = Matrix.Identity(4)
c_h = cup.constraints.new("CHILD_OF")
c_h.name, c_h.target, c_h.subtarget = "InHand", arm, "wristR"
c_h.inverse_matrix = G
GRAB = fr(T["lift"])
for f, a, b in ((1, 1.0, 0.0), (GRAB - 1, 1.0, 0.0), (GRAB, 0.0, 1.0)):
    c_st.influence, c_h.influence = a, b
    c_st.keyframe_insert("influence", frame=f)
    c_h.keyframe_insert("influence", frame=f)
for fc in cup.animation_data.action.layers[0].strips[0].channelbags[0].fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = "CONSTANT"

# lift: up and toward the seat (clear of the spout), over the knee, into the lap; the left hand comes up under it
toward = Vector((-cs["x"], -cs["z"])).normalized()
up1 = (cs["x"] + toward.x * 0.05, cs["y"] + 0.06, cs["z"] + toward.y * 0.05)
key_hand("R", 5.9, S(*up1), UPV, "pass")
key_hand("R", 6.75, S(-0.30, 0.33, 0.30), UPV, "pass")
key_fk_wrist("L", 5.5)
key_fk_wrist("L", 5.8)
key_hand("L", 6.8, S(-0.12, 0.30, 0.31), UPV, "pass")      # the left hand rises from the knee to meet the cup at the lap
both(7.5, LAP, 0.0, "land")

# from here the left hand rides the cup: its IK target copies an empty parented to the cup, so it stays under the cup's foot
# however the right hand carries and tips it (keyed on its own, the two hands drift apart between keys)
CRADLE = 7.85
sc.frame_set(fr(CRADLE))
fL = proj(Sd(-0.6, 0, 0.8), UPV)
cradle = empty("CradleL", 0.03, "ARROWS")
cradle.parent = cup
cradle.matrix_parent_inverse = Matrix.Identity(4)
cradle.matrix_basis = cup.matrix_world.inverted() @ wrist_frame("L", cup.matrix_world.translation, UPV, fL)
ct = handL.constraints.new("COPY_TRANSFORMS")
ct.name, ct.target = "OnCup", cradle
for f, k in ((1, 0.0), (fr(7.5), 0.0), (fr(CRADLE), 1.0)):
    ct.influence = k
    ct.keyframe_insert("influence", frame=f)
LEFT_UNTIL = CRADLE
both(T["savour"], LAP, 0.0, "fast")

# savour: up to under the nose on a short arc, a breath there (a few mm up and back)
both(8.4, (LAP[0] * 0.5, 0.45, 0.31), 0.0, "pass")
n0 = nose(9.0)
both(9.0, n0, 0.0, "slowin")
both(9.8, (n0[0], n0[1] + 0.004, n0[2]), 0.0, "pass")
both(T["sip1"], n0, 0.0, "fast")


def sip_keys(T0, kind, start, first=False):
    th = TIP[kind]
    a = 1.2 if first else 1.4
    if not first:
        both(T0 + 0.25, (start[0], start[1] - 0.008, start[2] + 0.004), 0.0, "fast")   # anticipation: a little dip
        c1, _ = lips(T0 + a, th * 0.5)
        both(T0 + 0.8, ((start[0] + c1[0]) / 2, (start[1] + c1[1]) / 2 + 0.03, max(start[2], c1[2]) + 0.04), 0.0, "pass")
    else:
        both(T0 + 0.25, (start[0], start[1] - 0.003, start[2] + 0.006), 0.0, "fast")
    for dt, k, ease in ((a, 0.5, "slowin"), (a + 0.3, 0.62, "pass"), (a + 0.6, 0.75, "pass"), (a + 0.9, 0.88, "pass"),
                        (a + 1.2, 1.0, "fast")):
        c, U = lips(T0 + dt, th * k)
        both(T0 + dt, c, U, ease)
    c, _ = lips(T0 + a + 1.2, th)
    both(T0 + a + 1.55, (c[0], c[1] - 0.01, c[2] + 0.015), th * 0.3, "pass")   # a quick level-off, the rim just off the lips
    both(T0 + a + 1.95, (c[0], c[1] - 0.03, c[2] + 0.05), 0.0, "pass")
    both(T0 + 4.45, LAP, 0.0, "land")                                          # and a slow lowering, landing with a settle
    both(T0 + SIP_LEN, LAP, 0.0, "fast")


sip_keys(T["sip1"], "sip1", n0, first=True)
sip_keys(T["sip2"], "sip2", LAP)
sip_keys(T["sip3"], "sip3", LAP)
both(T["settle"] + 0.75, REST, 0.0, "land")       # settle: the cup comes down in both hands, the shoulders drop
both(T["hold"], REST, 0.0, "hold")
both(HOLD_FROM, REST, 0.0, "hold")
both(EXTRA, REST, 0.0, "fast")
sip_keys(EXTRA, "sip", REST)
both(END, REST, 0.0, "hold")



# ---------------------------------------------------------------- the Graph Editor pass: unequal ease on the hands' curves
def channel_fcurves(ob):
    ad = ob.animation_data
    return list(anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot).fcurves)


def ease_pass(ob, keys):
    """Per key: hold (flat, even handles), fast (flat, a short handle out: quick away), slowin (flat, a long handle in: a slow
    arrival), pass (auto-clamped, so the arc runs through it smoothly). A landing (both(..., "land")) is two keys: a little low,
    slowly, then back up."""
    ease = dict(keys)
    for fc in channel_fcurves(ob):
        kps = fc.keyframe_points
        for i, kp in enumerate(kps):
            e = ease.get(round(kp.co.x), "hold")
            kp.interpolation = "BEZIER"
            if e == "pass":
                kp.handle_left_type = kp.handle_right_type = "AUTO_CLAMPED"
                continue
            kp.handle_left_type = kp.handle_right_type = "FREE"
            prev = kps[i - 1].co.x if i > 0 else kp.co.x - 3
            nxt = kps[i + 1].co.x if i + 1 < len(kps) else kp.co.x + 3
            li = {"slowin": 0.62}.get(e, 0.33) * (kp.co.x - prev)
            ro = {"fast": 0.10}.get(e, 0.33) * (nxt - kp.co.x)
            kp.handle_left = (kp.co.x - li, kp.co.y)
            kp.handle_right = (kp.co.x + ro, kp.co.y)
        fc.update()


ease_pass(handR, KEYS["R"])
ease_pass(handL, KEYS["L"])

# ---------------------------------------------------------------- the stack: Sit, then Drink, then Breath combined over both
ad = arm.animation_data
ad.action = None
tr = ad.nla_tracks.new()
tr.name = "Drink"
tr.strips.new("Drink", 1, act)
br = bpy.data.actions.new("Breath")
br.use_fake_user = True
ad.action = br
step = BREATH["period"] / 4
t = 0.0
while t <= END + step:
    k = math.sin(2 * math.pi * t / BREATH["period"])
    PB["spine"].rotation_quaternion = eul(-BREATH["spine"] * k)            # in: the chest lifts a little
    PB["neck"].rotation_quaternion = eul(-BREATH["spine"] * BREATH["neck"] * k)
    PB["spine"].keyframe_insert("rotation_quaternion", frame=fr(t))
    PB["neck"].keyframe_insert("rotation_quaternion", frame=fr(t))
    t += step
ad.action = None
tb = ad.nla_tracks.new()
tb.name = "Breath"
sb = tb.strips.new("Breath", 1, br)
sb.blend_type = "COMBINE"
sc.frame_start, sc.frame_end = 1, fr(END)

# the authored scene, before any bake: this is the file the next round opens and nudges
sit_pose()
sc.frame_set(fr(T["sip2"] + 1.4))
os.makedirs(os.path.dirname(OUT_BLEND), exist_ok=True)

# ---------------------------------------------------------------- bake: the evaluated pose every frame (IK, NLA, breath)
frames = range(1, fr(END) + 1)
baked = bpy.data.actions.new("DrinkBaked")
opts = anim_utils.BakeOptions(only_selected=False, do_pose=True, do_object=False, do_visual_keying=True,
                              do_constraint_clear=False, do_parents_clear=False, do_clean=False,
                              do_location=False, do_rotation=True, do_scale=False, do_bbone=False,
                              do_custom_props=False)
anim_utils.bake_action(arm, action=baked, frames=frames, bake_options=opts)

# read the bake back as per-frame quaternions, signs kept continuous, and the cup's place in the hand and on the stone
cb = anim_utils.action_get_channelbag_for_slot(baked, arm.animation_data.action_slot)
Q = {}
for n in DRIVEN:
    fcs = [cb.fcurves.find(f'pose.bones["{n}"].rotation_quaternion', index=i) for i in range(4)]
    rows = []
    for f in frames:
        q = Quaternion([fc.evaluate(f) for fc in fcs])
        q.normalize()
        if rows and rows[-1].dot(q) < 0:
            q.negate()
        rows.append(q)
    Q[n] = rows
# overlap: the elbow trails the shoulder, the wrist trails further (the curves dragged a few frames late), while one hand
# works alone (overlap_at). Dragged in the world, not on the bones' own curves: the forearm points where it pointed LAG_ELBOW frames ago, the hand (and so the cup)
# turns as it turned LAG_WRIST frames ago, so a trailing wrist never wobbles the cup while the forearm swings.
Q0 = {n: q_gl(D["bones"][n]["q0"]) for n in BONES}
HIPS = Q0["hips"] @ SIT_BASIS["hips"][0]


def world_of(i, chain):
    w, out = HIPS, {}
    for n in chain:
        w = w @ Q0[n] @ Q[n][i]
        out[n] = w
    return out


N = len(Q["spine"])


def overlap_at(t):
    """How much of the overlap the arms carry: all of it while one hand works alone (the reach, the pour, the lift's start),
    none once both hands hold the cup, where each arm trailing on its own would pull the hands apart on the cup."""
    lo, hi = T["lift"] + 0.4, T["lift"] + 1.1
    return 1.0 if t <= lo else 0.0 if t >= hi else 0.5 + 0.5 * math.cos(math.pi * (t - lo) / (hi - lo))


for side, lw in (("R", LAG_WRIST), ("L", LAG_LEFT)):
    chain = ["spine", "shoulder" + side, "elbow" + side, "wrist" + side]
    Wd = [world_of(i, chain) for i in range(N)]
    el, wr = [], []
    for i in range(N):
        we = Wd[max(0, i - LAG_ELBOW)]["elbow" + side]
        ww = Wd[max(0, i - lw)]["wrist" + side]
        k = overlap_at((i) / FPS)
        e_l = (Q0["elbow" + side].inverted() @ Wd[i]["shoulder" + side].inverted() @ we).normalized()
        w_l = (Q0["wrist" + side].inverted() @ we.inverted() @ ww).normalized()
        el.append(Q["elbow" + side][i].slerp(e_l, k) if k < 1 else e_l)
        # the wrist under the trailing forearm, turned as it was turned lw frames ago (or, with no overlap, as it is now)
        w_now = (Q0["wrist" + side].inverted() @ (Wd[i]["shoulder" + side] @ Q0["elbow" + side] @ el[-1]).inverted() @ Wd[i]["wrist" + side]).normalized()
        wr.append(w_now.slerp(w_l, k) if k < 1 else w_l)
    for rows, n in ((el, "elbow" + side), (wr, "wrist" + side)):
        for j in range(1, N):
            if rows[j - 1].dot(rows[j]) < 0:
                rows[j].negate()
        Q[n] = rows

ad.action = None
for t_ in ad.nla_tracks:
    t_.mute = True
for b in ("elbowR", "wristR", "elbowL", "wristL"):
    for c in PB[b].constraints:
        c.mute = True


def put(i):
    for n in DRIVEN:
        PB[n].rotation_quaternion = Q[n][i]
    for n in BONES:
        if n not in DRIVEN:
            PB[n].rotation_quaternion, PB[n].location = SIT_BASIS[n]
    bpy.context.view_layer.update()


put(fr(T["lift"] + 0.5) - 1)
wr = bone_world("wristR")
cupw = wr @ G
cup_in_wrist = G
seat_rot = CONV.inverted()   # Blender world to glTF (the figure's frame, seat origin TOP over the figure's origin)
R3 = Matrix.Rotation(math.radians(90), 4, "X")   # three.js's cup (+Y up, ear +X) in Blender's cup (+Z up, ear +X)
g_in = G @ R3
spot_gl = seat_rot @ spot.matrix_world @ R3
tl_q = lambda m: (lambda q: [q.x, q.y, q.z, q.w])(m.to_quaternion())

# ---------------------------------------------------------------- the clips: one action each, then the glTF export
for a in list(bpy.data.actions):
    if a.name.startswith("Clip_"):
        bpy.data.actions.remove(a)
clip_acts = []
for name, t0, t1 in CLIPS:
    ca = bpy.data.actions.new("Clip_" + name)
    ca.use_fake_user = True
    slot = ca.slots.new(id_type="OBJECT", name=arm.name)
    ccb = anim_utils.action_ensure_channelbag_for_slot(ca, slot)
    f0, f1 = fr(t0), fr(t1)
    for n in DRIVEN:
        for i in range(4):
            fc = ccb.fcurves.ensure(f'pose.bones["{n}"].rotation_quaternion', index=i, group_name=n)
            fc.keyframe_points.add(f1 - f0 + 1)
            co = []
            for j, f in enumerate(range(f0, f1 + 1)):
                co += [j, Q[n][f - 1][i]]
            fc.keyframe_points.foreach_set("co", co)
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
            fc.update()
    clip_acts.append(ca)

timeline = {
    "fps": FPS, "clips": [{"name": n, "start": a, "end": b} for n, a, b in CLIPS],
    "beats": T, "hold": [HOLD_FROM, HOLD_TO], "extra": EXTRA, "sipLen": SIP_LEN, "tip": TIP,
    "grab": T["lift"], "stream": [T["pour"] + 0.2 * 2.6, T["pour"] + 0.85 * 2.6],
    "lips": {k: [T.get(k, EXTRA) + (1.2 if k == "sip1" else 1.4), T.get(k, EXTRA) + (2.4 if k == "sip1" else 2.6)] for k in TIP},
    "nose": [9.0, T["sip1"]], "savour": SAVOUR,
    "driven": DRIVEN,
    "cupInWrist": {"p": list(g_in.translation), "q": tl_q(g_in)},
    "cupStone": {"q": tl_q(spot_gl)},
    "mouth": {"seat": [D["MOUTH"]["x"], D["MOUTH"]["y"], D["MOUTH"]["z"]]},
    "lag": {"elbow": LAG_ELBOW, "wrist": LAG_WRIST, "left": LAG_LEFT}, "slant": SLANT, "drop": DROP, "pole": {"R": fitR, "L": fitL},
}
sc["tea_drink"] = json.dumps(timeline)

# the file kept: the authored stack live (Sit, Drink, Breath, the rig's constraints), the baked clips stored beside it
ad.action = None
for t_ in ad.nla_tracks:
    t_.mute = False
for b in ("elbowR", "wristR", "elbowL", "wristL"):
    for c in PB[b].constraints:
        c.mute = False
bpy.data.actions.remove(baked)
sc.frame_set(fr(T["sip2"] + 1.4))
bpy.context.preferences.filepaths.save_version = 0   # no .blend1 beside it
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, compress=True)

# the export: the clips alone, on the bare armature (no mesh, no constraints, no stack)
for a in list(bpy.data.actions):
    if not a.name.startswith("Clip_"):
        bpy.data.actions.remove(a)
for t_ in list(ad.nla_tracks):
    ad.nla_tracks.remove(t_)
for b in ("elbowR", "wristR", "elbowL", "wristL"):
    for c in list(PB[b].constraints):
        PB[b].constraints.remove(c)
bpy.ops.object.select_all(action="DESELECT")
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
ad.action = clip_acts[0]
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", use_selection=True, export_animations=True,
                          export_animation_mode="ACTIONS", export_force_sampling=False, export_skins=False,
                          export_morph=False, export_extras=True, export_yup=True, export_apply=False,
                          export_anim_slide_to_zero=True, export_materials="NONE", export_def_bones=False,
                          export_optimize_animation_size=False)
print("BUILD ok", json.dumps({"glb": OUT_GLB, "blend": OUT_BLEND, "frames": len(frames), "pole": [fitR, fitL],
                               "clips": [c[0] for c in CLIPS]}))
