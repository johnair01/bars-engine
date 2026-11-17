"""The seated drink of tea on the cultivation figure, authored in Blender (round 6 of the Between tea; Wendell, 2026-11-17: Average
Dusk stays in the Arcade only, so the tea is rebaked for the figure the garden seats at the hearth).

Builds art/between/tea-drink/tea-drink-<f|m>.blend and bakes public/between/m/cult/tea-drink-<f|m>.glb, the clips
public/between/tea-drink.js plays on the live figure. Rerun it whenever a key below changes (the figure is the kneel of
public/between/cult/kneel.js, dumped from the page itself):

    npm i --no-save --prefix /tmp/t three@0.160.0 three-mesh-bvh@0.8.3
    for w in f m; do
      THREE_DIR=/tmp/t/node_modules node tools/tea-cult/dump.mjs $w B2 0.25 > /tmp/tea-cult-$w.json
      node tools/tea-cult/inputs.mjs /tmp/tea-cult-$w.json > /tmp/tea-inputs-$w.json
      blender -b -P art/between/tea-drink/build.py -- /tmp/tea-inputs-$w.json      # Blender 5.2: council/tools/blender_here.py setup
    done

The rig: the cultivation body's own bones as the page poses them kneeling (the hips on the heels, the back over the cushion, the
hands on the thighs), each bone's frame and place in glTF's own world, copied here. The page's bones do not point along +Y to
their child as a Blender rig's do, so the build keeps two armatures. "IK" is the one that is solved: its bones are laid
head to child, a roll chosen so the wrist's +X is the palm (the right hand's; the left hand's palm is its -X), with plain IK
constraints on elbowR/elbowL (chain 2, to the empties HandR/HandL, poles PoleR/PoleL, the wrists copying the empties' turn)
and the cup an object with two Child Of constraints (the stone's CupSpot and the right wrist). "Out" is the one that is
exported: its bone frames are the page's node frames, so the turns written on it are the local turns three.js gives the
page's bones. Each frame the IK armature's pose is turned into the page's node turns by the constant offset between the two
frames (Rb below). The seat is the origin of the figure's frame with y up from the cushion's top (D["top"]).

The drink, as the reference asks (council/callsheets/stills/2026-10-29-tea-drink-research/art-direction.md): reach (a
small draw-back first), pour (the cup still on the stone), lift (up off the stone, in to the lap, the left hand coming
up under the cup), savour (the cup stops under the nose for a breath), three sips that tip the cup a little, more and most,
the head bowing to meet the cup and leading it, the cup on an arc to the middle of the lips, settle (in both hands in the
lap), hold (a breathing loop). The kneeler bows from the hips to the stone and comes back up with the cup. Unequal ease, as Bezier
handles on the hand empties' keys: away from the lap fast (a short handle out), into the lips slow (a long handle in); a
quick level-off off the lips, a slow lowering, and a small overshoot and settle as the cup lands (SETTLE). Overlap: after
the bake the elbows trail the shoulders by LAG_ELBOW frames and the wrists by LAG_WRIST while one hand works alone
(overlap_at). The breath is its own action on an NLA track that combines over the drink (Combine: quaternions multiply).
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
INPUTS = ARGS[0] if ARGS else "/tmp/tea-inputs-f.json"
D = json.load(open(INPUTS))
WHO = D["who"]
OUT_GLB = ARGS[1] if len(ARGS) > 1 else os.path.join(REPO, f"public/between/m/cult/tea-drink-{WHO}.glb")
OUT_BLEND = ARGS[2] if len(ARGS) > 2 else os.path.join(HERE, f"tea-drink-{WHO}.blend")

TOP, CUP, KET = D["top"], D["CUP"], D["KETTLE"]
KS = D["k"]                          # this body's size against the 1.75 m figure the numbers below were first set on
FPS = 30
LAG_ELBOW, LAG_WRIST, LAG_LEFT = 2, 4, 4   # frames the elbow and the wrist trail the shoulder (overlap); the cradling wrist the same
SETTLE = 0.008                       # how far the cup sinks past where it lands, before it settles back (m)
SLANT, DROP = 0.4, 0.012             # the right hand holds the cup slanting down across it, its middle DROP under the hand's line
SPINE = (("spine01", 0.45), ("spine", 0.30), ("spine03", 0.25))   # the bow is shared along the back, from the lowest bone up
CHAIN = ["hips", "spine01", "spine", "spine03", "neck", "head",
         "clavR", "shoulderR", "elbowR", "wristR", "clavL", "shoulderL", "elbowL", "wristL"]
DRIVEN = ["spine01", "spine", "spine03", "neck", "head", "shoulderR", "elbowR", "wristR", "shoulderL", "elbowL", "wristL"]
OUT_NODES = ["root"] + CHAIN
CONV = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))   # glTF (y up) to Blender (z up)
CONV3 = CONV.to_3x3()


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


def rot_of(w):
    """The unit-scale rotation of a three.js world matrix (the root carries a uniform scale)."""
    return gl_mat(w).to_3x3().normalized()


# ---------------------------------------------------------------- the figure as the page kneels her, from the dump
B = D["bones"]
HEAD = {n: CONV @ gl_mat(B[n]["w"]).translation for n in B}                        # joint places, Blender world
RK = {n: CONV3 @ rot_of(B[n]["w"]) for n in B}                                       # the page's node frames, Blender world
RK0 = {n: CONV3 @ rot_of(B[n]["w0"]) for n in B}                                     # and in the bind pose


def palm_of(side):
    """The wrist's palm in the kneel: the bind pose's palm faces down (r0g8/ubc.js PALM_Y), carried by the wrist's turn since."""
    return (RK["wrist" + side] @ RK0["wrist" + side].inverted() @ Vector((0, 0, -1))).normalized()


def along_of(side):
    """The hand's length, wrist to the middle finger's first joint, in the kneel."""
    return (HEAD["middle_01_" + side.lower()] - HEAD["wrist" + side]).normalized()


HAND = 1.12 * (HEAD["middle_01_r"] - HEAD["wristR"]).length     # the hand's middle past the wrist joint, along the hand
GRIP = 0.083 * KS                                                # and the cup's middle this far out through the palm, so the wall meets the palm


def eul(x=0.0, y=0.0, z=0.0):
    """three.js Euler XYZ as a quaternion about the WORLD's axes (qx * qy * qz): x bends forward, y turns to the left, z rolls."""
    return (Quaternion(Vector((1, 0, 0)), x) @ Quaternion(Vector((0, 0, 1)), y) @ Quaternion(Vector((0, -1, 0)), z))


bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS


def cols(X, Y, Z):
    return Matrix((X, Y, Z)).transposed()


def armature(name, frames, tails):
    """An armature of CHAIN's bones (and root for the exporter): each bone's head at its joint, its frame the given 3x3, its
    length from `tails` (a place for the tail, or a length)."""
    a = bpy.data.armatures.new(name)
    ob = bpy.data.objects.new(name, a)
    sc.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    for n in (OUT_NODES if name == "Out" else CHAIN):
        eb = a.edit_bones.new(n)
        eb.head = HEAD[n]
        eb.tail = HEAD[n] + Vector((0, 0, 0.05))
        eb.parent = a.edit_bones[B[n]["parent"]] if B[n]["parent"] in a.edit_bones else None
        R = frames[n]
        t = tails.get(n)
        length = (t - HEAD[n]).length if isinstance(t, Vector) else (t or 0.05)
        eb.matrix = Matrix.Translation(HEAD[n]) @ R.to_4x4()
        eb.length = length
    bpy.ops.object.mode_set(mode="OBJECT")
    return ob


# the IK armature: bones laid head to child, the roll nearest the page's own frame (the wrists' from the palm)
tail_of = {"hips": "spine01", "spine01": "spine", "spine": "spine03", "spine03": "neck", "neck": "head",
           "clavR": "shoulderR", "shoulderR": "elbowR", "elbowR": "wristR", "clavL": "shoulderL", "shoulderL": "elbowL", "elbowL": "wristL"}
tails, frames_ik = {}, {}
for n in CHAIN:
    if n in tail_of:
        tails[n] = HEAD[tail_of[n]]
    elif n == "head":
        tails[n] = HEAD["head"] + (HEAD["head"] - HEAD["neck"]).normalized() * 0.20 * KS
    else:                                   # the wrists: along the hand
        tails[n] = HEAD[n] + along_of(n[-1]) * 0.06 * KS
    Y = (tails[n] - HEAD[n]).normalized()
    if n.startswith("wrist"):
        pn = palm_of(n[-1]) * (1 if n.endswith("R") else -1)       # the right wrist's +X is its palm, the left wrist's -X
        X = (pn - Y * pn.dot(Y)).normalized()
    else:
        X = RK[n].col[0].copy()
        X = (X - Y * X.dot(Y))
        if X.length < 0.2:
            X = RK[n].col[2].copy() - Y * RK[n].col[2].dot(Y)
        X.normalize()
    frames_ik[n] = cols(X, Y, X.cross(Y))
arm = armature("IK", frames_ik, tails)
RE = {b.name: (arm.matrix_world @ b.matrix_local).to_3x3() for b in arm.data.bones}   # the IK bones' rest frames
RB = {n: RE[n].inverted() @ RK[n] for n in CHAIN}                                       # node frame = IK frame @ RB (a constant turn)
PB = arm.pose.bones
for pb in PB:
    pb.rotation_mode = "QUATERNION"
arm.animation_data_create()

# the Out armature: the page's node frames, for the glTF export
out = armature("Out", {n: RK[n] for n in OUT_NODES}, {})
bpy.context.view_layer.update()
bone_err = max(((arm.matrix_world @ b.head_local) - HEAD[b.name]).length for b in arm.data.bones)
assert bone_err < 1e-5, f"IK bones are {bone_err} m off their joints"
frame_err = max(abs(((CONV3 @ rot_of(B[b.name]["w"])).inverted() @ (out.matrix_world @ b.matrix_local).to_3x3())[i][j] - (i == j))
                for b in out.data.bones for i in range(3) for j in range(3))
assert frame_err < 1e-4, f"Out bone frames differ from the page's nodes by {frame_err}"

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


Kt = D["kettle"]
stone = cylinder("Stone", KET["stone"][1], KET["stone"][0], KET["top"] + 0.4, 16)
stone.location = S(Kt["x"], -0.4, Kt["z"])
pot = cylinder("Kettle", KET["body"], KET["body"] * 0.6, KET["height"], 12)
pot.location = S(Kt["x"], KET["top"], Kt["z"])
seat = cylinder("Seat", 0.40, 0.38, 0.14, 24)
seat.location = S(0, -0.14, 0)
cs = D["cupSpot"]

cup = cylinder("Cup", CUP["r"] * 0.78, CUP["r"], CUP["h"], 16, -CUP["h"] / 2)   # its middle at the origin, +Z up
ear = cylinder("CupEar", 0.008, 0.008, 0.012, 8)                               # the cup's little ear, at its +X
ear.parent = cup
ear.location = (CUP["r"] * 0.95, 0, -0.006)
cup.rotation_mode = "QUATERNION"

# ---------------------------------------------------------------- the arm rig: IK to the hand empties, poles, wrist turns
handR, handL = empty("HandR", 0.05, "ARROWS"), empty("HandL", 0.05, "ARROWS")
poleR, poleL = empty("PoleR", 0.04, "SPHERE"), empty("PoleL", 0.04, "SPHERE")


def pole_place(side):
    """Where the elbow sits in the kneel, pushed out from the shoulder-to-wrist line: the elbow points at the pole."""
    s, e, w = HEAD["shoulder" + side], HEAD["elbow" + side], HEAD["wrist" + side]
    ax = (w - s).normalized()
    off = (e - s) - ax * (e - s).dot(ax)
    return e + off.normalized() * 0.45


poleR.location, poleL.location = pole_place("R"), pole_place("L")
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
# the lips: the face's front at the height of the mouth, read off the skinned head
my = HEAD["head"].z - TOP + 0.055 * KS
fronts = [p[2] for p in D["skin"] if abs(p[0]) < 0.015 and abs(p[1] - TOP - my) < 0.012]
MOUTH = {"x": 0.0, "y": my, "z": max(fronts)}
mouth.matrix_world = Matrix.Translation(S(MOUTH["x"], MOUTH["y"], MOUTH["z"]))
bpy.context.view_layer.update()


def bone_world(n):
    return arm.matrix_world @ PB[n].matrix


def set_influence(side, k, frame):
    for b, c in (("elbow" + side, "IK"), ("wrist" + side, "Turn")):
        con = PB[b].constraints[c]
        con.influence = k
        con.keyframe_insert("influence", frame=frame)


def pole_angle_fit(side, hand):
    """The pole angle that points the elbow at its pole, found by trying them: the hand empty on the kneel's wrist, so the
    IK at its first frame holds the arm as the kneel has it."""
    ik = PB["elbow" + side].constraints["IK"]
    ik.influence = 1.0
    hand.matrix_world = Matrix.Translation(HEAD["wrist" + side]) @ RE["wrist" + side].to_4x4()
    best = (1e9, 0.0)
    for deg in range(-180, 180, 3):
        ik.pole_angle = math.radians(deg)
        bpy.context.view_layer.update()
        e, s, w = bone_world("elbow" + side).translation, bone_world("shoulder" + side).translation, bone_world("wrist" + side).translation
        err = (e - HEAD["elbow" + side]).length
        best = min(best, (err, deg))
    ik.pole_angle = math.radians(best[1])
    ik.influence = 0.0
    return best


fitR = pole_angle_fit("R", handR)
fitL = pole_angle_fit("L", handL)
bpy.context.view_layer.update()
assert fitR[0] < 0.02 and fitL[0] < 0.02, f"the IK cannot hold the kneel's elbows: {fitR} {fitL}"

if os.environ.get("TEA_STAGE") == "rig":
    print("STAGE rig ok", json.dumps({"bone_err": bone_err, "frame_err": frame_err, "poleR": fitR, "poleL": fitL,
                                      "mouth": MOUTH, "hand": HAND, "grip": GRIP}))
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
LAP = (-0.02, 0.40, 0.09)        # the cup's middle held in front of the belly, in both hands, the back a little forward
REST = (-0.02, 0.385, 0.07)      # and settled a little lower and nearer once the sips are done
BOW = 0.70                       # how far she bows from the hips to the cup on the stone (rad)


def tipU(th):
    """The cup's up, tipped th toward the face (its top comes back toward the drinker, its foot goes up and away)."""
    return Sd(0, math.cos(th), -math.sin(th)).normalized()


def proj(a, U):
    v = a - U * a.dot(U)
    return v.normalized() if v.length > 1e-6 else Sd(0, 0, 1)


# ---------------------------------------------------------------- the Drink action: head, neck, spine
act = bpy.data.actions.new("Drink")
act.use_fake_user = True
arm.animation_data.action = act


def key_fk(bone, t, x=0.0, y=0.0, z=0.0):
    """A turn about the world's axes (x bends forward) on a bone, written in the bone's own frame."""
    qe = RE[bone].to_quaternion()
    PB[bone].rotation_quaternion = qe.inverted() @ eul(x, y, z) @ qe
    PB[bone].keyframe_insert("rotation_quaternion", frame=fr(t))


def look(t, pitch, yaw=0.0):
    """The head and neck turn together, the neck taking 40 percent: pitch + bows the face down, yaw - turns it to the right."""
    key_fk("neck", t, 0.4 * pitch, 0.4 * yaw)
    key_fk("head", t, 0.6 * pitch, 0.6 * yaw)


def lean(t, fwd, side=0.0):
    """The bow from the hips, shared along the back: + bends forward, side + leans to the right."""
    for b, share in SPINE:
        key_fk(b, t, fwd * share, 0.0, side * share)


# the head leads: it goes to the stone before the hand, to the lap before the cup, and bows to the lips as the cup rises
look(0.0, 0.0); look(0.25, 0.0); look(1.5, 0.12, -0.35); look(2.6, 0.16, -0.40); look(4.9, 0.14, -0.38)
look(5.3, 0.14, -0.36); look(6.4, 0.12, -0.10); look(7.4, 0.16, 0.0)
look(7.9, 0.15, 0.0); look(8.8, 0.10, 0.0); look(10.4, 0.10, 0.0)
lean(0.0, 0.0); lean(0.3, -0.02, 0.0); lean(1.9, BOW, 0.05); lean(5.2, BOW, 0.05); lean(6.6, 0.18, 0.01)
lean(7.6, 0.12, 0.0); lean(9.0, 0.10, 0.0); lean(10.4, 0.10, 0.0)


def sip_fk(T0, kind, first=False):
    a = 1.2 if first else 1.4                 # the cup reaches the lips
    look(T0 + 0.15, 0.10 if first else -0.06)
    look(T0 + a - 0.2, 0.12)                  # bowed to meet it, a little before it arrives
    look(T0 + a + 0.6, 0.11)
    look(T0 + a + 1.2, 0.0 if kind in ("sip3", "sip") else 0.09)   # the last sips: the head tips back as the cup empties
    look(T0 + a + 1.45, 0.02 if kind in ("sip3", "sip") else 0.07)
    look(T0 + 4.3, -0.12)                     # the savour: the head lifts, the gaze goes out to the fire
    look(T0 + SIP_LEN, -0.08)
    lean(T0 + 0.2, 0.12 if first else 0.08)
    lean(T0 + a, 0.12)
    lean(T0 + a + 1.2, 0.10)
    lean(T0 + 4.3, 0.0)                       # the chest opens
    lean(T0 + SIP_LEN, 0.04)


for k in ("sip1", "sip2", "sip3"):
    sip_fk(T[k], k, first=(k == "sip1"))
look(T["settle"] + 0.6, 0.06); look(T["hold"], 0.08); lean(T["settle"] + 0.6, 0.04); lean(T["hold"], 0.06)
look(HOLD_FROM, 0.08); lean(HOLD_FROM, 0.06); look(EXTRA, 0.08); lean(EXTRA, 0.06)
sip_fk(EXTRA, "sip")
look(END, 0.08); lean(END, 0.06)

# the IK is on from the first frame: the hands are planted where the kneel has them (on the thighs) until each goes to work
for s in ("R", "L"):
    set_influence(s, 1.0, 1)
    set_influence(s, 1.0, fr(END))

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
        hc = C - U * (CUP["h"] / 2 + 0.050 * KS) + Sd(0, 0, -0.01)
        p = hc - f * HAND
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


REST_HAND = {s: Matrix.Translation(HEAD["wrist" + s]) @ RE["wrist" + s].to_4x4() for s in "RL"}


def key_rest(side, t):
    """The hand empty on the wrist where the kneel has it: the hand stays on the thigh, whatever the back does."""
    hand = handR if side == "R" else handL
    frame = fr(t)
    hand.matrix_world = REST_HAND[side].copy()
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
    return seat_of(M + Sd(0, -0.012, 0.078 * KS))


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


# the left hand stays planted on its thigh until it comes up under the cup
key_rest("L", 0.0)
key_rest("L", 5.5)
# reach: the hand where the kneel has it, a small draw-back, out over the knee on an arc, slow onto the cup's side on the stone
key_rest("R", 0.0)
key_rest("R", 0.3)
w0 = seat_of(HEAD["wristR"])
handR.location = S(w0[0] + 0.012, w0[1] + 0.02, w0[2] - 0.02)        # anticipation: back and up a touch
handR.keyframe_insert("location", frame=fr(0.6))
handR.keyframe_insert("rotation_quaternion", frame=fr(0.6))
KEYS["R"].append((fr(0.6), "hold"))
cup_spot = (cs["x"], cs["y"], cs["z"])
rest_hand = Vector(seat_of(HEAD["middle_01_r"]))
over = tuple(rest_hand.lerp(Vector(cup_spot), 0.55) + Vector((0, 0.09, 0)))
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

# lift: up and toward the seat (clear of the spout), in to the lap; the left hand comes up under it
toward = Vector((-cs["x"], -cs["z"])).normalized()
up1 = (cs["x"] + toward.x * 0.05, cs["y"] + 0.07, cs["z"] + toward.y * 0.05)
key_hand("R", 5.9, S(*up1), UPV, "pass")
key_hand("R", 6.75, S(LAP[0] - 0.12, LAP[1] + 0.02, LAP[2] + 0.06), UPV, "pass")
key_rest("L", 5.8)
key_hand("L", 6.8, S(LAP[0] + 0.05, LAP[1] - 0.04, LAP[2] + 0.06), UPV, "pass")      # the left hand rises from the thigh to meet the cup at the lap
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
both(8.4, (LAP[0] * 0.5, 0.5, 0.19), 0.0, "pass")
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

# ---------------------------------------------------------------- the stack: Drink, then Breath combined over it
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
    for b, q in (("spine", -BREATH["spine"] * k), ("neck", -BREATH["spine"] * BREATH["neck"] * k)):
        qe = RE[b].to_quaternion()
        PB[b].rotation_quaternion = qe.inverted() @ eul(q) @ qe            # in: the chest lifts a little
        PB[b].keyframe_insert("rotation_quaternion", frame=fr(t))
    t += step
ad.action = None
tb = ad.nla_tracks.new()
tb.name = "Breath"
sb = tb.strips.new("Breath", 1, br)
sb.blend_type = "COMBINE"
sc.frame_start, sc.frame_end = 1, fr(END)

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

cb = anim_utils.action_get_channelbag_for_slot(baked, arm.animation_data.action_slot)
QB = {}                                     # each bone's turn on the IK armature (its own frame), per frame
for n in CHAIN:
    fcs = [cb.fcurves.find(f'pose.bones["{n}"].rotation_quaternion', index=i) for i in range(4)]
    QB[n] = [Quaternion([fc.evaluate(f) for fc in fcs]).normalized() for f in frames] if all(fcs) else None
N = len(frames)

# the page's node frames at each frame: the IK chain's world turns, then the constant offset between the frames
RP = {n: [None] * N for n in CHAIN}          # pose bone world turns
RN = {n: [None] * N for n in CHAIN}          # node world turns
for i in range(N):
    for n in CHAIN:
        par = B[n]["parent"]
        q = QB[n][i].to_matrix() if QB[n] else Matrix.Identity(3)
        RP[n][i] = (RP[par][i] @ RE[par].inverted() @ RE[n] @ q) if par in RP else (RE[n] @ q)
        RN[n][i] = RP[n][i] @ RB[n]


def node_parent(n):
    return B[n]["parent"]


def local_of(n, i, parent_world=None):
    """The page's local turn of node n at frame i, as a Quaternion."""
    pw = parent_world if parent_world is not None else (RN[node_parent(n)][i] if node_parent(n) in RN else RK[node_parent(n)])
    return (pw.inverted() @ RN[n][i]).to_quaternion().normalized()


Q = {n: [local_of(n, i) for i in range(N)] for n in DRIVEN}


def keep_hemisphere(rows):
    for j in range(1, len(rows)):
        if rows[j - 1].dot(rows[j]) < 0:
            rows[j].negate()


# overlap: the elbow trails the shoulder, the wrist trails further (the curves dragged a few frames late), while one hand
# works alone (overlap_at). Dragged in the world, not on the bones' own curves: the forearm points where it pointed LAG_ELBOW frames ago, the hand (and so the cup)
# turns as it turned LAG_WRIST frames ago, so a trailing wrist never wobbles the cup while the forearm swings.
def overlap_at(t):
    """How much of the overlap the arms carry: all of it while one hand works alone (the reach, the pour, the lift's start),
    none once both hands hold the cup, where each arm trailing on its own would pull the hands apart on the cup."""
    lo, hi = T["lift"] + 0.4, T["lift"] + 1.1
    return 1.0 if t <= lo else 0.0 if t >= hi else 0.5 + 0.5 * math.cos(math.pi * (t - lo) / (hi - lo))


for side, lw in (("R", LAG_WRIST), ("L", LAG_LEFT)):
    el, wr = [], []
    for i in range(N):
        we = RN["elbow" + side][max(0, i - LAG_ELBOW)]
        ww = RN["wrist" + side][max(0, i - lw)]
        k = overlap_at(i / FPS)
        sh = RN["shoulder" + side][i]
        e_l = (sh.inverted() @ we).to_quaternion().normalized()
        e_fin = Q["elbow" + side][i].slerp(e_l, k) if k < 1 else e_l
        ew = sh @ e_fin.to_matrix()                                  # the elbow as the page will turn it
        w_l = (we.inverted() @ ww).to_quaternion().normalized()
        w_now = (ew.inverted() @ RN["wrist" + side][i]).to_quaternion().normalized()
        el.append(e_fin)
        wr.append(w_now.slerp(w_l, k) if k < 1 else w_l)
    for rows, n in ((el, "elbow" + side), (wr, "wrist" + side)):
        keep_hemisphere(rows)
        Q[n] = rows
for n in DRIVEN:
    keep_hemisphere(Q[n])

# how well the hands hold their targets: the wrist against its empty, at every key
miss = 0.0
for s, hand in (("R", handR), ("L", handL)):
    for f, _ in KEYS[s]:
        sc.frame_set(f)
        bpy.context.view_layer.update()
        miss = max(miss, (bone_world("wrist" + s).translation - hand.matrix_world.translation).length)
print("IK reach: the worst miss at a key is", round(miss * 1000, 1), "mm")


def put(i):
    for n in CHAIN:
        PB[n].rotation_quaternion = QB[n][i] if QB[n] else Quaternion((1, 0, 0, 0))
    bpy.context.view_layer.update()


ad.action = None
for t_ in ad.nla_tracks:
    t_.mute = True
for b in ("elbowR", "wristR", "elbowL", "wristL"):
    for c in PB[b].constraints:
        c.mute = True
put(fr(T["lift"] + 0.5) - 1)
G_node = RB["wristR"].inverted() @ G.to_3x3()       # the cup in the wrist's node frame, not the IK bone's
p_node = RB["wristR"].inverted() @ G.translation
R3 = Matrix.Rotation(math.radians(90), 3, "X")      # three.js's cup (+Y up, ear +X) in Blender's cup (+Z up, ear +X)
g_q = (G_node @ R3).to_quaternion()
spot_q = (CONV3.inverted() @ spot.matrix_world.to_3x3() @ R3).to_quaternion()
tl_q = lambda q: [q.x, q.y, q.z, q.w]

# ---------------------------------------------------------------- the clips: one action each on the exporter's armature, then the glTF export
ado = out.animation_data_create()
opb = out.pose.bones
for pb in opb:
    pb.rotation_mode = "QUATERNION"
Q_REST = {n: q_gl(B[n]["q"]) for n in OUT_NODES}     # the kneel's own local turns: the clips are written against them
clip_acts = []
for name, t0, t1 in CLIPS:
    ca = bpy.data.actions.new("Clip_" + name)
    ca.use_fake_user = True
    slot = ca.slots.new(id_type="OBJECT", name=out.name)
    ccb = anim_utils.action_ensure_channelbag_for_slot(ca, slot)
    f0, f1 = fr(t0), fr(t1)
    for n in DRIVEN:
        for i in range(4):
            fc = ccb.fcurves.ensure(f'pose.bones["{n}"].rotation_quaternion', index=i, group_name=n)
            fc.keyframe_points.add(f1 - f0 + 1)
            co = []
            for j, f in enumerate(range(f0, f1 + 1)):
                # the page's local turn q, written as the pose basis on a bone whose rest is the kneel's local turn
                co += [j, (Q_REST[n].inverted() @ Q[n][f - 1])[i]]
            fc.keyframe_points.foreach_set("co", co)
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"
            fc.update()
    clip_acts.append(ca)

timeline = {
    "who": WHO, "fps": FPS, "clips": [{"name": n, "start": a, "end": b} for n, a, b in CLIPS],
    "beats": T, "hold": [HOLD_FROM, HOLD_TO], "extra": EXTRA, "sipLen": SIP_LEN, "tip": TIP,
    "grab": T["lift"], "stream": [T["pour"] + 0.2 * 2.6, T["pour"] + 0.85 * 2.6],
    "lips": {k: [T.get(k, EXTRA) + (1.2 if k == "sip1" else 1.4), T.get(k, EXTRA) + (2.4 if k == "sip1" else 2.6)] for k in TIP},
    "nose": [9.0, T["sip1"]], "savour": SAVOUR,
    "driven": DRIVEN,
    "cupInWrist": {"p": list(p_node), "q": tl_q(g_q)},
    "cupStone": {"q": tl_q(spot_q)},
    "mouth": {"seat": [MOUTH["x"], MOUTH["y"], MOUTH["z"]]},
    "lag": {"elbow": LAG_ELBOW, "wrist": LAG_WRIST, "left": LAG_LEFT}, "slant": SLANT, "drop": DROP, "pole": {"R": fitR, "L": fitL},
    "hand": HAND, "grip": GRIP, "miss": miss,
}
sc["tea_drink"] = json.dumps(timeline)

# the file kept: the authored stack live (Drink, Breath, the rig's constraints), the baked clips stored beside it
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

# the export: the clips alone, on the bare Out armature (no mesh, no constraints, no stack)
for o in list(bpy.data.objects):
    if o is not out:
        bpy.data.objects.remove(o)
bpy.ops.object.select_all(action="DESELECT")
out.select_set(True)
bpy.context.view_layer.objects.active = out
for a in list(bpy.data.actions):
    if not a.name.startswith("Clip_"):
        bpy.data.actions.remove(a)
ado.action = clip_acts[0]
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", use_selection=True, export_animations=True,
                          export_animation_mode="ACTIONS", export_force_sampling=False, export_skins=False,
                          export_morph=False, export_extras=True, export_yup=True, export_apply=False,
                          export_anim_slide_to_zero=True, export_materials="NONE", export_def_bones=False,
                          export_optimize_animation_size=False)
print("BUILD ok", json.dumps({"glb": OUT_GLB, "blend": OUT_BLEND, "frames": len(frames), "pole": [fitR, fitL],
                               "clips": [c[0] for c in CLIPS], "miss_mm": round(miss * 1000, 1)}))
