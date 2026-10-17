"""The character creator (J4): one faceless player figure from a theme, a build and a palette, rigged and walking.

    python content/ontology-game/cave/character.py --build average --palette dusk --out DIR
    python content/ontology-game/cave/character.py --all --out DIR [--sheet]
    python content/ontology-game/cave/character.py --warp victim --out DIR           # one WARP row
    python content/ontology-game/cave/character.py --daemons --out DIR [--sheet]     # the frame and every WARP row
    python content/ontology-game/cave/character.py --one-number --out DIR [--sheet]  # the frame, eleven one number off

The theme is the Taoist cultivation robe set (cc-robe-set, bpt-robe-theme), the wardrobe the 2D sprite creator also
draws from (cs-one-studio). In J4 the set is painted onto the body as its under-layer: a plain short-sleeved top to the
waist, tied trousers, a sash and cloth shoes. The long robe, the sash as cloth and the topknot are J5's separate
garments, skinned to this same rig.

The body starts from the body map's figure (body/build_figure.py: rounded parts, 1.75 m, no face, no sex, age or skin
colour) and is stylized away from it after his first look (a bigger head, a plain trunk, rounder limbs), widened or
narrowed by the build and fused into one surface. Its rig carries the cave avatar's joint names
(cave.js buildAvatar: hips, spine, neck, head; hip, knee, ankle; shoulder, elbow, wrist), and its one animation,
"Walk", is cave.js poseAvatar baked at a mid stride: two steps a second, so one cycle is one second, 24 keys in
Blender and 60 in the GLB (one a frame in the game), with the corners of poseAvatar's max() and abs() rounded (round 7
of J5, ramp()).

Each figure is one GLB under 300 KB (the kill line). report.json says, per figure, its bytes, triangles and the walk's
joint checks; the test (J4 in tools/blender-cloud/tests/test_bpy.py) checks the exported GLBs again on their own.
Needs bpy (tools/blender-cloud/README.md).
"""
import argparse, json, math, os, sys

import bpy
import bmesh
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

# ---- the theme: builds and palettes ---------------------------------------------------------------------------
# A build scales the body's widths and depths; height stays 1.75 m so the walk's stride is the same for all (a choice).
# (trunk and hips, limbs, shoulder span)
BUILDS = {
    "slight": (0.86, 0.84, 0.93),
    "average": (1.0, 1.0, 1.0),
    "broad": (1.2, 1.22, 1.1),
}
# The robe set's colours, linear RGB. Skin is the cave's "self" figure colour for every palette (cave.js AVATAR_LOOK),
# so a palette dresses the figure and never colours the body (build_figure.py: no skin colour). Choices, for his eye.
SKIN = (0.69, 0.62, 0.53)


def hexc(h):
    """sRGB hex to linear RGB."""
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


PALETTES = {
    # dusk: indigo tunic, slate trousers, old-gold sash, cream trim
    "dusk": {"tunic": hexc("44407a"), "trousers": hexc("2c2e44"), "sash": hexc("b8913f"), "trim": hexc("e9dfc6"),
             "shoes": hexc("1e1b24")},
    # jade: green tunic, pine trousers, pale-gold sash, cream trim
    "jade": {"tunic": hexc("4e8270"), "trousers": hexc("2d4038"), "sash": hexc("cdb47a"), "trim": hexc("efe7d2"),
             "shoes": hexc("221f1c")},
    # hemp: the undyed set, oat tunic, ash trousers, walnut sash, bone trim
    "hemp": {"tunic": hexc("d2c8b2"), "trousers": hexc("857e70"), "sash": hexc("6e4e36"), "trim": hexc("f4efe3"),
             "shoes": hexc("3a3029")},
}
THEMES = {"robe_set": {"builds": BUILDS, "palettes": PALETTES}}

# ---- the warp: a blockage worn in the body ---------------------------------------------------------------------
# Frame, flesh, warp (call sheet blender-frame-flesh-warp, item 2). An NPC generated from a player's blockage is this
# same figure with the warp applied last: after the body is fused and before the weights are painted, so the rig, the
# weights and the walk all follow the warped body. One row per daemon, since the record maps a blockage to the daemon
# that holds it and the daemon to a spirit family (sg-body-from, ch1-npc-from-blockage). The numbers are first
# choices read from each daemon's "in you" line in council/daemons/daemons.yaml, for his eye.
#   arms      arm length, 1 = the frame (legs stay, so the height and the walk's stride stay)
#   head      head size about the top of the neck
#   curve     radians the upper back rounds forward across the spine (minus arches it back)
#   stoop     radians the trunk leans forward from the waist (minus leans back)
#   hands     the hands' pose, one of HANDS, or a (left, right) pair: open, relaxed or a fist (Wendell, 2026-10-14:
#             "Some gestures are palm out and others are balled fists we need the rig to be able to make this
#             distinction")
#   gesture   the daemon's held shape, {joint: (flex, out, turn, twist)} in radians at rest. flex bends the joint its
#             natural way (a minus bends it against: a wrist turned back, a head tipped up); out swings it away from
#             the body's middle (a minus draws it in); turn turns it about the vertical toward the middle; twist turns a hanging
#             bone about its own length first, so a wrist twisted a quarter turn faces its palm back, and forward
#             once the arm is raised. A sided
#             joint named without L or R ("shoulder") takes both sides, mirrored. The feet are set back on the ground
#             after, so a figure that sinks into its knees sinks and does not float.
#
# Round 2 (Wendell, 2026-10-14: "more dramatic and different from each other"): each gesture is built on one of Ruella
# Frank's six fundamental movements (yield, push, reach, grasp, pull, release), the developmental movements of contact
# between child and caregiver. A daemon emerged to protect the vulnerable child, and its body holds the movement stuck
# in that protective form; integration in play is the movement completing. The rows below are a position on the board.
#
# The hands are rigged the way game hands are (Wendell, 2026-10-16: "Let's do some research on how to properly rig and
# use hands"; council/daemons/HANDS.md): the wrist bone is the palm, and each finger is a chain of three bones,
# knuckle, middle and tip, the thumb's first one its metacarpal, set low in the palm so the thumb can swing across it.
# The mesh is made once, open and straight-fingered so the fingers fuse apart, and a hand's shape is a pose of those
# bones: a curl per finger joint and a spread of the fingers. A fist is the same hand closed, so a game can open it.
FINGERS = ("thumb", "index", "middle", "ring", "pinky")
FINGER_BONES = tuple(f"{f}{i}" for f in FINGERS for i in (1, 2, 3))
HAND_POSES = {     # {finger: (knuckle, middle, tip) curl in radians}, and the spread: 0 holds the fingers as wide as
    #               the open hand is made, a minus draws them together (Wendell, 2026-10-16, "Problem areas": spreading
    #               them past the made hand tore the web between them)
    "open": {"curl": {"thumb": (0.1, 0.0, 0.0), **{f: (-0.05, 0.0, 0.0) for f in FINGERS[1:]}}, "spread": 0.0},
    "relaxed": {"curl": {"thumb": (0.15, 0.2, 0.15), "index": (0.25, 0.35, 0.2), "middle": (0.3, 0.45, 0.25),
                         "ring": (0.35, 0.5, 0.3), "pinky": (0.4, 0.55, 0.3)}, "spread": -0.7},
    "fist": {"curl": {"thumb": (0.0, 0.5, 0.45), **{f: (1.5, 1.75, 1.1) for f in FINGERS[1:]}}, "spread": -1.0,
             "thumb_tip": (-0.05, 0.0, -0.08)},   # the thumb laid across the front of the folded fingers
}
HANDS = tuple(HAND_POSES)
NEUTRAL = {"arms": 1.0, "head": 1.0, "curve": 0.0, "stoop": 0.0, "hands": "relaxed", "gesture": {}}
WARP = {
    # PUSH held: stop. Both palms out at chest height, fingers up, elbows bent and braced against an attacker or an
    # obstacle, the trunk set into the push over a bent front knee, the back leg straight and driving (Wendell,
    # 2026-10-14: the straight-armed first try "looks like a zombie")
    "protector": {"arms": 0.98, "head": 0.94, "curve": -0.04, "stoop": 0.06, "hands": "open", "gesture": {
        "shoulder": (1.1, 0.12), "elbow": (1.0, 0, 0.12), "wrist": (0.95, 0, 0, 1.4), "neck": (-0.1,),
        "hipL": (0.36, 0.08), "kneeL": (0.38,), "ankleL": (0.1,), "hipR": (-0.3, 0.08), "ankleR": (-0.2,)}},
    # GRASP held: not until this is handled. Fists clenched and set on the hips, elbows out wide, chest up, chin up,
    # feet together, rigid and tall: the figure takes up the room and holds it (Wendell, 2026-10-16: the fists drawn
    # to the chest "still looks weird"; they read as a boxer's guard, not a grip)
    "controller": {"arms": 0.92, "head": 1.04, "curve": -0.2, "stoop": 0.0, "hands": "fist", "gesture": {
        "shoulder": (-0.5, 0.78, -0.05, 1.56), "elbow": (1.24, 0, 0.12), "neck": (-0.2,), "hip": (0, -0.03)}},
    # PULL held: look at the evidence, from a distance. Chest and head drawn back, elbows pulled behind, hands drawn
    # in to the belly, the front foot out and the weight sunk on the back knee
    "skeptic": {"arms": 1.0, "head": 1.12, "curve": -0.06, "stoop": -0.22, "hands": "fist", "gesture": {
        "shoulder": (-0.45, 0.14), "elbow": (1.45, 0, 0.35), "neck": (-0.32, 0, 0.4), "head": (0, 0.14),
        "hipL": (0.34,), "hipR": (-0.12,), "kneeR": (0.42,), "ankleL": (-0.3,)}},
    # REACH held: there is a problem here and I'll fix it. Pitched far forward over a front knee, both long arms out
    # to the problem, the head up to keep it in sight, the back leg trailing
    "fixer": {"arms": 1.16, "head": 0.97, "curve": 0.1, "stoop": 0.45, "hands": "open", "gesture": {
        "shoulder": (1.9, -0.1), "elbow": (0.08,), "wrist": (-0.35,), "neck": (-0.6,),
        "hipL": (0.38,), "kneeL": (0.5,), "ankleL": (0.15,), "hipR": (-0.3,)}},
    # YIELD collapsed: look at what I have absorbed. Sunk into the ground, knees soft and given way, back rounded,
    # head hung, arms hanging heavy and long
    "victim": {"arms": 1.08, "head": 1.0, "curve": 0.42, "stoop": 0.18, "gesture": {
        "hip": (0.62, 0.05), "knee": (1.2,), "ankle": (0.58,), "shoulder": (-0.12, -0.06),
        "elbow": (0.06,), "neck": (0.75,)}},
    # RELEASE refused: it was probably me. Curled round the hit, arms wrapped round its own middle holding the case,
    # head down and turned away, knees drawn in
    "damaged-self": {"arms": 0.93, "head": 0.88, "curve": 0.6, "stoop": 0.32, "gesture": {
        "shoulderL": (0.62, -0.1), "shoulderR": (0.42, -0.1), "elbow": (1.75, 0, 0.95), "wrist": (0.4,),
        "neck": (0.55, 0.0, 0.35), "hip": (0.22, -0.06, 0.18), "knee": (0.4,), "ankle": (0.18,)}},
    # RELEASE too soon: this is what is actually moving. Arms flung wide and up, palms open, chest thrown up and head
    # back, up on the front foot, giving the feeling away to anyone in reach
    "emotional-body": {"arms": 1.08, "head": 1.18, "curve": -0.32, "stoop": -0.1, "hands": "open", "gesture": {
        "shoulder": (0.55, 1.45), "elbow": (0.15,), "wrist": (-0.5,), "neck": (-0.45,),
        "hipL": (0.25, 0.04), "kneeL": (0.2,), "hipR": (-0.12, 0.04)}},
    # the Player, the vulnerable child at the centre, is not a daemon and holds no blockage. A child's proportions
    # (a big head, short arms) with all six movements still available: soft, upright, open, palms turned forward
    "player": {"arms": 0.88, "head": 1.28, "curve": 0.0, "stoop": 0.0, "gesture": {
        "shoulder": (0.12, 0.2), "elbow": (0.2,), "wrist": (-0.15,), "neck": (-0.06,)}},
}
# An NPC built from a blockage keeps its daemon's row and speaks from that daemon's question set
# (content/ontology-game/daemons/questions.js, bars-engine #329). Its answer to the boss question names who it works
# for, and that is the next NPC the player meets: the figure below. "self" is the unwarped frame. The Protector's boss
# is the body's survival, so it names none, and the Player has none.
BOSSES = ("protector", "self", "controller", "player")
NEXT_FIGURE = {"protector": "protector", "self": None, "controller": "controller", "player": "player"}
# Integration (call sheet blender-frame-flesh-warp, "the held movement completing"): a daemon's held shape lets go into
# the Player's open stance, a push that lands, a grasp that lets go. It is a second action beside Walk, "Integrate",
# keyed on the pose bones from the warped rest, so the daemon keeps its own proportions and only its held shape moves.
# The move is SECS long after a held beat, then rests: HOLD seconds still at each end. Each joint moves over its own part
# of the move, (start, end) as fractions of it, eased in and out; a joint not named moves over the whole. Fingers are
# named by finger ("index"), or as "fingers" for all five. Wendell, 2026-10-16: "Perfect. Let's do the next thing".
# A row's "to" merges over INTEGRATE_TO, for a daemon whose open stance is not the Player's own.
INTEGRATE_TO = {"curve": WARP["player"]["curve"], "stoop": WARP["player"]["stoop"], "hands": "relaxed",
                "gesture": WARP["player"]["gesture"]}
INTEGRATE = {
    # GRASP lets go: the elbows swing in and down first, so the fists come off the hips outward and never through
    # them; the shoulders follow and the fists open on the way down, the thumb last, as the chest and chin settle
    # The arms end hanging loose at the sides, close in and a little forward, elbows soft, and the back settles a
    # little forward (Wendell, 2026-10-16: "Let the controller hands fall to their sides in a slightly more relaxed
    # posture at the end"; the Player's own stance left them splayed out from the body)
    "controller": {"secs": 3.0, "hold": 0.5, "to": {"curve": 0.03, "stoop": 0.03, "gesture": {
        "shoulder": (0.06, 0.0), "elbow": (0.18,), "wrist": (0.0,), "neck": (0.02,)}}, "phase": {
        "elbow": (0.0, 0.55), "wrist": (0.05, 0.6), "shoulder": (0.15, 0.85), "spine": (0.25, 1.0),
        "neck": (0.3, 1.0), "head": (0.3, 1.0), "hip": (0.4, 1.0), "knee": (0.4, 1.0), "ankle": (0.4, 1.0),
        "index": (0.3, 0.85), "middle": (0.33, 0.88), "ring": (0.36, 0.91), "pinky": (0.39, 0.94),
        "thumb": (0.45, 1.0)}},
}
FLEX = {"neck": 1, "head": 1, "shoulder": -1, "elbow": -1, "wrist": -1, "hip": -1, "knee": 1, "ankle": -1}  # + bends
# each joint its natural way
SPINE_Z = (1.03, 1.42)                                                                 # the spine bone, where curve bends

# ---- the walk: cave.js poseAvatar with the stride held at its middle ------------------------------------------
STEPS_PER_S, FPS, KEYS = 2, 24, 24          # cave.js STEPS_PER_S; one cycle (a left and a right step) is one second
EXPORT_FPS = 60                             # the GLB's walk: a key a frame at the game's 60 (round 7)
AMP = 0.4                                   # radians: cave.js clamps the swing to 0.2..0.62 by the step's length
LEG = 0.96 - 0.085                          # hip to ankle, metres, for the hips' sink

MAX_BYTES, VOXEL, TRIS = 300 * 1024, 0.007, 1850
HAND_VOXEL, HAND_TRIS = 0.0025, 650                                     # each hand, fused on its own
HEM, SASH, CUFF, TIE = (0.68, 0.71), (0.99, 1.07), 0.915, (0.10, 0.14)   # heights of the painted bands, metres
NECK = 1.47                                                             # the collar stands up the neck to here
NECK_BASE = 1.425
CUTS = (*HEM, *SASH, CUFF, *TIE, NECK, NECK_BASE)
SPLIT = 0.03                                                           # metres, longest edge where a line is cut
COLLAR_R = 0.095                                                        # the collar's ring round the neck, metres
COLLAR = 0.024                                                          # half the collar band's width, metres


NECK_C, NECK_R = Vector((0, 0, 1.47)), 0.12                            # the top's round neck: where a ball meets the body


def neckline(co):
    """Below zero inside the top's round neck: the ball round the neck's base, which meets the body in a ring that
    dips a little at the front and back and runs out along the shoulders."""
    return (co - NECK_C).length - NECK_R


def body_parts(build):
    """The body map's parts (build_figure.py, the same numbers), each tagged with the bone that carries it.
    Returns [(bone, bmesh)], one bmesh per part so each vertex of the fused surface can find the part it came from."""
    wt, wl, ws = BUILDS[build]
    parts = []

    def new(bone):
        bm = bmesh.new()
        parts.append((bone, bm))
        return bm

    def ellipsoid(bm, c, rx, ry, rz):
        m = Matrix.Translation(c) @ Matrix.Diagonal((rx, ry, rz, 1))
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0, matrix=m)

    def limb(bm, a, b, ra, rb):
        a, b = Vector(a), Vector(b)
        d = b - a
        rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=ra, radius2=rb, depth=d.length,
                              matrix=Matrix.Translation((a + b) / 2) @ rot)
        ellipsoid(bm, a, ra, ra, ra)
        ellipsoid(bm, b, rb, rb, rb)

    def loft(bm, profile, segments=32, steps=8):
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

    def hand(n):
        """The hand open at rest (hand_layout), one part per bone: the palm a block of four metacarpals from the
        wrist to the knuckles, filled and padded, and each finger bone a tapered limb; the thumb's metacarpal carries
        the ball of the thumb, which moves with it."""
        origin, M = hand_frame(build, n)
        s = 1 if n == "L" else -1
        M4 = Matrix.Translation(origin) @ M.to_4x4()
        lay = hand_layout(build, n)
        k = HAND_K * wl ** 0.5
        palm = new("wrist" + n)
        # the wrist: a ball on the joint, which turns into itself at any bend, so a bent hand shows no stub at the
        # cuff (Wendell, 2026-10-16, "Problem areas": the stop hand's wrist crumpled), and a neck to the palm
        # (Wendell, 2026-10-16: the stop's wrists "still a little weird", a knob at the heel): the heel is as wide as
        # the cuff's end, flat as a wrist is, so the two meet at a bend
        ellipsoid(palm, (0, 0, 0), 0.021 * k, 0.021 * k, 0.021 * k)
        ellipsoid(palm, (0, -0.003 * k, -0.02 * k), 0.016 * k, 0.027 * k, 0.022 * k)
        for f in FINGERS[1:]:
            h = lay[f + "1"][0]
            limb(palm, (s * 0.002, h.y * 0.35, -0.02 * k), h, 0.012 * k, lay[f + "1"][2] * 1.05)
        ellipsoid(palm, (-s * 0.002, -0.003 * k, -0.056 * k), 0.014 * k, 0.036 * k, 0.034 * k)
        for b, (h, t, ra, rb) in lay.items():
            if b == "wrist":
                continue
            bm = new(b + n)
            limb(bm, h, t, ra, rb)
            if b == "thumb1":
                ellipsoid(bm, h.lerp(t, 0.45) + Vector((s * 0.004, 0.01 * k, 0.0)), 0.012 * k, 0.017 * k, 0.025 * k)
        for b, bm in parts:
            if in_hand(b) and b.endswith(n):
                bmesh.ops.transform(bm, matrix=M4, verts=bm.verts)

    # Stylized, not realistic (Wendell, 2026-10-13, round 1: "build proportions are close to human but are hitting
    # uncanny valley"): about six heads tall where build_figure.py's canon is seven and a half, a short neck, a plain
    # tapered trunk with no waist or chest sculpting, rounder and thicker limbs, plain hands and rounded feet, nearer
    # the cave's capsule avatar and the daemons than the body map.
    j = joints(build)
    ellipsoid(new("head"), (0, 0.0, 1.615), 0.112, 0.118, 0.13)
    limb(new("neck"), (0, 0.008, 1.42), (0, 0.008, 1.52), 0.06, 0.056)
    trunk = [(z, rx * wt, ry * wt) for z, rx, ry in
             [(0.90, 0.150, 0.100), (0.98, 0.158, 0.106), (1.06, 0.152, 0.104), (1.15, 0.150, 0.102),
              (1.25, 0.158, 0.104), (1.32, 0.164, 0.102), (1.38, 0.160, 0.094), (1.44, 0.105, 0.072)]]
    trunk[-2] = (trunk[-2][0], 0.160 * ws, trunk[-2][2])   # the shoulders follow the shoulder span
    low = new("hips")
    loft(low, trunk[:3])
    ellipsoid(low, (0, 0.0, 0.92), 0.150 * wt, 0.092 * wt, 0.06)
    loft(new("spine"), trunk[2:])
    sx = j["shoulderL"][0][0]
    limb(new("spine"), (-sx + 0.02, 0.0, 1.385), (sx - 0.02, 0.0, 1.385), 0.06 * wl, 0.06 * wl)
    for n in ("L", "R"):
        limb(new("shoulder" + n), *j["shoulder" + n], 0.054 * wl, 0.046 * wl)
        limb(new("elbow" + n), *j["elbow" + n], 0.045 * wl, 0.026 * wl)     # the forearm narrows to the wrist
        hand(n)
        limb(new("hip" + n), *j["hip" + n], 0.088 * wl, 0.066 * wl)
        limb(new("knee" + n), *j["knee" + n], 0.064 * wl, 0.05 * wl)
        a = Vector(j["ankle" + n][0])
        ellipsoid(new("ankle" + n), (a.x + math.copysign(0.005, a.x), -0.035, 0.045), 0.055 * wl, 0.105, 0.048)
    return parts


def collar_path(bm, build):
    """The crossed collar's centre line, laid on the body's surface as points every 4 mm, worn left over right: from
    the figure's right side under the arm, up across the chest to the left of the neck, round the back of the neck over
    both shoulders, then the short under-edge from the right of the neck down to where it meets the long one.
    (Wendell, 2026-10-13, round 1: "We'd expect smooth collars that are painted on the shoulders".)"""
    tree = BVHTree.FromBMesh(bm)
    wt = BUILDS[build][0]
    r, zr, a0 = COLLAR_R, 1.415, math.radians(40)                 # the ring round the neck, and where it opens in front

    def ring(a):
        return Vector((r * math.sin(a), -r * math.cos(a) + 0.008, zr))

    def front(x, z):                                           # a point on the chest, seen straight from the front
        hit = tree.ray_cast(Vector((x, -1.0, z)), Vector((0, 1, 0)))[0]
        return hit if hit else tree.find_nearest(Vector((x, 0, z)))[0]

    L, R = ring(a0), ring(-a0)
    A = Vector((-0.125 * wt, 0, 1.13))                         # the long edge's end, the right side under the arm
    D_t = (L.x - 0.0) / (L.x - A.x)                            # where the under-edge meets it, on the middle line
    D = Vector((0.0, 0, L.z + (A.z - L.z) * D_t))
    pts = []

    def line(p, q):
        n = max(2, int((Vector((q.x - p.x, q.z - p.z))).length / 0.004))
        pts.extend(front(p.x + (q.x - p.x) * k / n, p.z + (q.z - p.z) * k / n) for k in range(n + 1))

    line(A, L)
    n = int(r * (2 * math.pi - 2 * a0) / 0.004)
    pts.extend(tree.find_nearest(ring(a0 + (2 * math.pi - 2 * a0) * k / n))[0] for k in range(n + 1))
    line(R, D)
    kd = KDTree(len(pts))
    for i, p in enumerate(pts):
        kd.insert(p, i)
    kd.balance()
    return lambda co: kd.find(co)[2]


def cut_along(bm, field):
    """Cuts every face where field(co) changes sign, at the exact crossing, so the line field = 0 is a run of edges and a
    band painted on one side of it ends on a smooth edge. Triangles first, so each face is crossed at most twice."""
    # the decimated surface has triangles longer than the band is wide, so near the line its edges are first halved
    # until none is longer than SPLIT; otherwise the band could pass between two vertices and never be cut
    for _ in range(4):
        long = [e for e in bm.edges if e.calc_length() > SPLIT
                and min(abs(field(e.verts[0].co)), abs(field(e.verts[1].co)),
                        abs(field((e.verts[0].co + e.verts[1].co) / 2))) < 0.6 * e.calc_length()]
        if not long:
            break
        bmesh.ops.subdivide_edges(bm, edges=long, cuts=1, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    val = {v: field(v.co) for v in bm.verts}
    made = set()
    for e in list(bm.edges):
        a, b = e.verts
        fa, fb = val[a], val[b]
        if (fa < 0) != (fb < 0) and abs(fa - fb) > 1e-9:
            at = a.co.lerp(b.co, fa / (fa - fb))
            _, nv = bmesh.utils.edge_split(e, a, 0.5)
            nv.co = at                                         # placed here, not by edge_split's own fraction
            val[nv] = 0.0
            made.add(nv)
    for f in list(bm.faces):
        new = [v for v in f.verts if v in made]
        if len(new) == 2 and not any(new[1] in e.verts for e in new[0].link_edges):
            bmesh.utils.face_split(f, new[0], new[1])


def joints(build):
    """{bone: (head, tail)} in Blender space: Z up, the figure faces -Y, its own left is +X (build_figure.py)."""
    _, wl, ws = BUILDS[build]
    j = {"hips": ((0, 0, 0.96), (0, 0, 1.03)), "spine": ((0, 0, 1.03), (0, 0, 1.42)),
         "neck": ((0, 0.008, 1.42), (0, 0.008, 1.50)), "head": ((0, 0.0, 1.50), (0, 0.0, 1.75))}
    for n, s in (("L", 1), ("R", -1)):
        sh, el = 0.19 * ws, 0.27 * ws + 0.08 * (ws - 1)
        j["shoulder" + n] = ((s * sh, 0, 1.385), (s * el, 0.01, 1.13))
        j["elbow" + n] = ((s * el, 0.01, 1.13), (s * (el + 0.075 * wl ** 0.5), -0.02, 0.89))
        origin, M = hand_frame(build, n)
        for b, (h, t, _, _) in hand_layout(build, n).items():
            j[b + n] = (tuple(origin + M @ h), tuple(origin + M @ t))
        hx = 0.09 * wl ** 0.5
        j["hip" + n] = ((s * hx, 0, 0.96), (s * (hx + 0.015), 0.0, 0.50))
        j["knee" + n] = ((s * (hx + 0.015), 0.0, 0.50), (s * (hx + 0.025), 0.015, 0.085))
        j["ankle" + n] = ((s * (hx + 0.025), 0.015, 0.085), (s * (hx + 0.03), -0.13, 0.03))
    # two hem bones for J5's long robe, hanging from the hips: the front panel goes with whichever leg is forward and
    # the back panel with whichever is back (garments.py). The body carries no weight on them.
    j["hemF"] = ((0, -0.02, 0.96), (0, -0.02, 0.40))
    j["hemB"] = ((0, 0.02, 0.96), (0, 0.02, 0.40))
    return j


HAND_K = 1.02           # the hand's scale: wrist crease to middle fingertip 0.19 m at the frame's 1.75 m, near a
#                        person's (hand length is about a tenth of height); it grows with the arm's thickness


def hand_frame(build, side):
    """The hand's frame: its origin at the wrist joint (the forearm's end) and the rotation that turns the hand from
    its own frame (hanging down -Z, palm toward the body, thumb forward -Y) to the forearm's line at rest."""
    _, wl, ws = BUILDS[build]
    s = 1 if side == "L" else -1
    el = 0.27 * ws + 0.08 * (ws - 1)
    w = Vector((s * (el + 0.075 * wl ** 0.5), -0.02, 0.89))
    d = Vector((w[0] + s * 0.02, -0.03, 0.76)) - w
    return w, Vector((0, 0, -1)).rotation_difference(d.normalized()).to_matrix()


def hand_layout(build, side):
    """The hand at rest in its own frame (hand_frame), open with the fingers straight and a little fanned:
    {bone: (head, tail, radius at head, radius at tail)} for the wrist (the palm, wrist crease to the middle knuckle)
    and each finger bone. Proportions from life: the palm about as long as the middle finger, the knuckles on an arch
    with the middle one lowest, the index and ring a little shorter than the middle and the little finger about three
    quarters of it; a finger's three bones about 5 : 3 : 2.5 (council/daemons/HANDS.md)."""
    _, wl, _ = BUILDS[build]
    s = 1 if side == "L" else -1
    k = HAND_K * wl ** 0.5
    out = {"wrist": (Vector((0, 0, 0)), Vector((0, -0.008 * k, -0.093 * k)), 0.021 * k, 0.012 * k)}
    knuckle = {"index": (-0.029, -0.089), "middle": (-0.01, -0.093), "ring": (0.009, -0.089), "pinky": (0.026, -0.079)}
    size = {"index": (0.92, 1.0), "middle": (1.0, 1.0), "ring": (0.95, 0.95), "pinky": (0.76, 0.84)}
    fan = {"index": -0.18, "middle": -0.02, "ring": 0.12, "pinky": 0.3}  # spread wide, as the stop holds them
    for f, (y, z) in knuckle.items():
        p = Vector((s * 0.003, y * k, z * k))
        d = Vector((0, math.sin(fan[f]), -math.cos(fan[f])))
        ln, r = size[f]
        for i, (seg, rr) in enumerate(((0.045, 0.0098), (0.029, 0.0091), (0.023, 0.0083)), 1):
            q = p + d * seg * ln * k
            out[f"{f}{i}"] = (p, q, rr * r * k, rr * r * k * 0.94)
            p = q
    p = Vector((-s * 0.008, -0.022 * k, -0.018 * k))           # the thumb's metacarpal starts low in the palm
    d = Matrix.Rotation(-0.2, 3, "X") @ Vector((-s * 0.32, -0.5, -0.8)).normalized()
    for i, (seg, rr) in enumerate(((0.044, 0.0135), (0.031, 0.0118), (0.027, 0.0104)), 1):
        q = p + d * seg * k
        out[f"thumb{i}"] = (p, q, rr * k, rr * k * 0.94)
        p = q
    return out


def hand_rotations(build, side, shape):
    """A hand pose (HAND_POSES) as each finger bone's rotation in the world at rest: a curl about the bone's hinge,
    which takes a finger toward the palm and the thumb across it, and at the knuckle a spread about the palm's
    normal, away from the middle finger (for the thumb, away from the index)."""
    s = 1 if side == "L" else -1
    _, M = hand_frame(build, side)
    pose, out, layout = HAND_POSES[shape], {}, hand_layout(build, side)
    fan = {"thumb": -0.2, "index": -0.1, "middle": 0.0, "ring": 0.08, "pinky": 0.2}
    for f in FINGERS:
        for i in (1, 2, 3):
            h, t, _, _ = layout[f"{f}{i}"]
            d = (t - h).normalized()
            toward = Vector((-s * 0.55, 1, 0.1)) if f == "thumb" else Vector((-s, 0, 0))
            R = Matrix.Rotation(pose["curl"][f][i - 1], 3, d.cross(toward).normalized())
            if i == 1:
                R = Matrix.Rotation(pose["spread"] * fan[f], 3, "X") @ R
            out[f"{f}{i}"] = R
    if "thumb_tip" in pose:             # swing the whole thumb from its root so its tip lands where the pose puts it
        h = layout["thumb1"][0]
        A, at = Matrix.Identity(3), h.copy()
        for i in (2, 3):
            a, b, _, _ = layout[f"thumb{i}"]
            A = A @ out[f"thumb{i}"]
            at = at + A @ (b - a)
        at = at + (layout["thumb1"][1] - h)
        x, y, z = pose["thumb_tip"]
        k = HAND_K * BUILDS[build][1] ** 0.5
        out["thumb1"] = (at - h).rotation_difference(Vector((s * x, y * k, z * k)) - h).to_matrix()
    return {b: M @ R @ M.transposed() for b, R in out.items()}


PARENT = {"hips": None, "spine": "hips", "neck": "spine", "head": "neck"}
for _n in ("L", "R"):
    PARENT.update({"shoulder" + _n: "spine", "elbow" + _n: "shoulder" + _n, "wrist" + _n: "elbow" + _n,
                   "hip" + _n: "hips", "knee" + _n: "hip" + _n, "ankle" + _n: "knee" + _n})
    for _f in FINGERS:
        PARENT.update({f"{_f}1{_n}": "wrist" + _n, f"{_f}2{_n}": f"{_f}1{_n}", f"{_f}3{_n}": f"{_f}2{_n}"})
PARENT.update({"hemF": "hips", "hemB": "hips"})
HEM_BONES = ("hemF", "hemB")             # no body part lies on them, so nearest_blend gives the body no weight there
BODY = tuple(b for b in PARENT if b.rstrip("LR") not in FINGER_BONES)     # the bones the walk moves


def in_hand(bone):
    return bone.rstrip("LR") in ("wrist",) + FINGER_BONES


def warp_maps(J, w, build):
    """The warp as one map per bone, {bone: f(point) -> point}, each carried down the chain from its parent so a child
    follows wherever its parent moved it. The spine bends along its length (curve) after leaning at the waist (stoop);
    the head scales about its joint; the upper arm and forearm stretch along their own axis (arms); each joint in the
    gesture turns about its head. Everything else rides its parent rigidly. Last, the whole figure is set back down so
    its lowest foot stands where it stood."""
    z0, z1 = SPINE_Z
    steps = 200
    table, p = [], Vector((0, 0, z0))

    def angle(z):
        return w["stoop"] + w["curve"] * min(1.0, max(0.0, (z - z0) / (z1 - z0)))

    for k in range(steps + 1):                                   # the bent spine's centre line, by the height it had
        table.append(p.copy())
        z = z0 + (z1 - z0) * k / steps
        a = angle(z + (z1 - z0) / steps / 2)
        p += Vector((0, -math.sin(a), math.cos(a))) * ((z1 - z0) / steps)

    def spine_at(z):
        if z <= z0:
            base = table[0]
            off = z - z0
        elif z >= z1:
            base = table[-1]
            off = z - z1
        else:
            t = (z - z0) / (z1 - z0) * steps
            i = min(int(t), steps - 1)
            base, off = table[i].lerp(table[i + 1], t - i), 0.0
        R = Matrix.Rotation(angle(z), 3, "X")
        return base + R @ Vector((0, 0, off)), R

    def spine_map(x):
        c, R = spine_at(x.z)
        return c + R @ Vector((x.x, x.y, 0))

    hands = (w["hands"],) * 2 if isinstance(w["hands"], str) else tuple(w["hands"])
    fingers = {b + n: R for n, shape in zip("LR", hands) for b, R in hand_rotations(build, n, shape).items()}
    maps, rots = {}, {}
    for b, parent in PARENT.items():
        h, t = Vector(J[b][0]), Vector(J[b][1])
        if b == "spine":
            maps[b], rots[b] = spine_map, (lambda x: spine_at(x.z)[1])
            continue
        if parent is None:
            Fp, Rp = (lambda x: x.copy()), Matrix.Identity(3)
        else:
            Fp, Rp = maps[parent], rots[parent](h)
        S = Matrix.Identity(3)
        if b == "head":
            S = S * w["head"]
        elif b.startswith(("shoulder", "elbow")):
            d = (t - h).normalized()
            S = S + (w["arms"] - 1) * Matrix([[d[i] * d[j] for j in range(3)] for i in range(3)])
        R = fingers[b] if b in fingers else gesture_rotation(b, w["gesture"])
        A, at = Rp @ R, Fp(h)
        maps[b] = (lambda x, at=at, A=A @ S, h=h: at + A @ (x - h))
        rots[b] = (lambda x, A=A: A)
    feet = [maps[f"ankle{s}"](Vector(J[f"ankle{s}"][k])).z - J[f"ankle{s}"][k][2] for s in "LR" for k in (0, 1)]
    down = Vector((0, 0, min(feet)))
    return {b: (lambda x, f=f: f(x) - down) for b, f in maps.items()}


def gesture_rotation(bone, gesture):
    """The rest rotation a gesture gives one bone (see WARP): flex about X the joint's natural way, then out about Y and
    turn about Z, both mirrored by side so out is away from the middle and turn is toward it; twist about Z first,
    mirrored so plus turns the palm back."""
    base = bone.rstrip("LR")
    g = gesture.get(bone, gesture.get(base) if base != bone else None)
    if not g or base not in FLEX:
        return Matrix.Identity(3)
    flex, out, turn, twist = (tuple(g) + (0.0, 0.0, 0.0))[:4]
    s = {"L": -1, "R": 1}.get(bone[len(base):], 1)
    return (Matrix.Rotation(s * turn, 3, "Z") @ Matrix.Rotation(s * out, 3, "Y")
            @ Matrix.Rotation(FLEX[base] * flex, 3, "X") @ Matrix.Rotation(s * twist, 3, "Z"))


def rest_turns(J, w, build):
    """Each bone's turn from the frame under a warp, as warp_maps gives it (rotation only, no stretch): a joint's own
    gesture or finger pose after its parent's turn. The spine bends along its length, so the spine bone takes the turn
    of its chord, half the curve on top of the stoop, and a bone hung on it takes the turn where it hangs."""
    z0, z1 = SPINE_Z
    hands = (w["hands"],) * 2 if isinstance(w["hands"], str) else tuple(w["hands"])
    fingers = {b + n: R for n, shape in zip("LR", hands) for b, R in hand_rotations(build, n, shape).items()}
    out = {}
    for b, parent in PARENT.items():
        if b == "spine":
            out[b] = Matrix.Rotation(w["stoop"] + w["curve"] / 2, 3, "X")
            continue
        z = J[b][0][2]
        Rp = (Matrix.Identity(3) if parent is None else out[parent] if parent != "spine" else
              Matrix.Rotation(w["stoop"] + w["curve"] * min(1.0, max(0.0, (z - z0) / (z1 - z0))), 3, "X"))
        out[b] = Rp @ (fingers[b] if b in fingers else gesture_rotation(b, w["gesture"]))
    return out


def fcurves(act):
    """An action's F-curves: Blender 5 keeps them in the action's layers and slots."""
    if hasattr(act, "fcurves"):
        return list(act.fcurves)
    return [fc for layer in act.layers for strip in layer.strips for bag in strip.channelbags for fc in bag.fcurves]


def integrate_action(rig, J, w, w_to, build, plan):
    """The Integrate action: every bone turns from the warped rest (w) to the stance w_to, each over its own part of
    the move (plan, an INTEGRATE row), and the hips rise or sink so the lower foot stays on the ground."""
    held, to = rest_turns(J, w, build), rest_turns(J, w_to, build)
    world = {b: to[b] @ held[b].inverted() for b in PARENT}       # each bone's turn in the world, rest to stance
    goal = {}
    for pb in rig.pose.bones:
        Bm = pb.bone.matrix_local.to_3x3()
        parent = PARENT[pb.name]
        local = world[parent].inverted() @ world[pb.name] if parent else world[pb.name]
        goal[pb.name] = (Bm.inverted() @ local @ Bm).to_quaternion()

    def part(bone):
        base = bone.rstrip("LR")
        name = base[:-1] if base in FINGER_BONES else base
        return plan["phase"].get(name, plan["phase"].get("fingers" if base in FINGER_BONES else name, (0.0, 1.0)))

    def ease(x):
        x = min(1.0, max(0.0, x))
        return x * x * (3 - 2 * x)

    hold, secs = plan["hold"], plan["secs"]
    n = round((2 * hold + secs) * FPS)
    feet = [b for b in PARENT if b.startswith("ankle")]
    ground = min(min(rig.data.bones[b].head_local.z, rig.data.bones[b].tail_local.z) for b in feet)
    hips = rig.pose.bones["hips"]
    rig.animation_data.action = None                                       # pose freely, then key
    frames = []
    for k in range(n + 1):
        t = (k / FPS - hold) / secs
        rot = {}
        for pb in rig.pose.bones:
            a, b = part(pb.name)
            rot[pb.name] = pb.rotation_quaternion = Quaternion().slerp(goal[pb.name], ease((t - a) / (b - a)))
        hips.location = (0, 0, 0)
        bpy.context.view_layer.update()
        low = min(min((rig.matrix_world @ rig.pose.bones[b].head).z, (rig.matrix_world @ rig.pose.bones[b].tail).z)
                  for b in feet)
        frames.append((rot, hips.bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, ground - low))))
    # keys every STEP frames, and for each bone only across its own part of the move (it holds still either side),
    # straight lines between them: the eased curve is in the keys, and the figure stays under its byte line
    STEP = 3
    act = bpy.data.actions.new("Integrate")
    rig.animation_data.action = act
    h0 = round(hold * FPS)
    for pb in rig.pose.bones:
        if abs(goal[pb.name].angle) < 1e-3:
            continue
        a, b = (h0 + round(x * secs * FPS) for x in part(pb.name))
        for k in sorted({a, b, *range(a, b, STEP)}):
            pb.rotation_quaternion = frames[k][0][pb.name]
            pb.keyframe_insert("rotation_quaternion", frame=k + 1)
    for k in sorted({0, n, *range(h0, n - h0, STEP), n - h0}):
        hips.location = frames[k][1]
        hips.keyframe_insert("location", frame=k + 1)
    for fc in fcurves(act):
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"
    return act, n


def warp_body(mesh, parts, J, w, build):
    """Applies the warp to the fused surface (each vertex by its bones' maps, blended as the weights will blend them),
    to each body part (rigidly with its own bone, so the weights read the warped parts) and to the joints.
    Returns the warped joints, the rest positions, which the painted bands keep using, and each vertex's blend, which
    the weights reuse: read on the unwarped body, where a fist's fingers lie apart from its palm and a hand set on the
    hip lies apart from the hip, so a held shape can be let go (Integrate) without the surface tearing."""
    maps = warp_maps(J, w, build)
    trees = [(b, BVHTree.FromBMesh(bm)) for b, bm in parts]
    rest = [v.co.copy() for v in mesh.vertices]
    hands = hand_shells(mesh, trees)
    blends = []
    for v in mesh.vertices:
        _, blend = nearest_blend(v.co, trees, hands[v.index])
        blends.append(blend)
        tot = sum(blend.values())
        v.co = sum((maps[b](v.co) * (x / tot) for b, x in blend.items()), Vector())
    for b, bm in parts:
        for v in bm.verts:
            v.co = maps[b](v.co)
    mesh.update()
    return {b: (tuple(maps[b](Vector(h))), tuple(maps[b](Vector(t)))) for b, (h, t) in J.items()}, rest, blends


LINKS = {b: {b} | {PARENT[b]} - {None} | {c for c, p in PARENT.items() if p == b} for b in PARENT}


def hand_shells(mesh, trees):
    """Which vertices belong to a hand: the hands are fused apart from the body, so each is its own closed shell, and a
    shell is a hand's when most of its vertices lie nearest a hand part. Returns a bool per vertex."""
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    out, seen = [False] * len(bm.verts), set()
    for v0 in bm.verts:
        if v0.index in seen:
            continue
        shell, todo = [], [v0]
        seen.add(v0.index)
        while todo:
            v = todo.pop()
            shell.append(v.index)
            for e in v.link_edges:
                o = e.other_vert(v)
                if o.index not in seen:
                    seen.add(o.index)
                    todo.append(o)
        votes = sum(in_hand(nearest_blend(bm.verts[i].co, trees)[0]) for i in shell[::7])
        if votes * 2 > len(shell[::7]):
            for i in shell:
                out[i] = True
    bm.free()
    return out


def nearest_blend(co, trees, hand=None):
    """The part a point lies nearest, and its weights: that part, blended with its parent or child where the two meet
    (a joint), the two strongest kept. hand: True for a vertex of a hand's shell, False for the body's, which then
    take only their own parts: the hand and the body never share a vertex, so a bent wrist turns the whole hand at
    the cuff and neither drags the sleeve after it nor dents the cuff's end (Wendell, 2026-10-16, "Problem areas")."""
    d = {}
    for b, t in trees:
        if hand is None or in_hand(b) == hand:
            d[b] = min(d.get(b, 1e9), t.find_nearest(co)[3])
    best = min(d, key=d.get)
    fall = 0.004 if in_hand(best) else 0.012                    # a finger's bones are short; they blend over less
    w = {b: math.exp(-(d[b] - d[best]) / fall) for b in LINKS[best] if b in d}
    w = dict(sorted(w.items(), key=lambda kv: -kv[1])[:2])
    tot = sum(w.values())
    return best, {b: x / tot for b, x in w.items() if x / tot > 0.02}


SOFT = 0.3                                  # the width of the walk's rounded corners (round 7)


def ramp(x, e=SOFT):
    """max(0, x) with its corner rounded over -e..e so its speed and its acceleration never jump (its slope is a
    smoothstep). J4's walk took max(0, x) and |x| straight from cave.js: the knee began to bend, the elbow to fold and
    the hips to sink at full speed from a standstill, twice a step, and the ankles and cuffs jerked (round 7)."""
    if x <= -e:
        return 0.0
    if x >= e:
        return x
    u = (x + e) / (2 * e)
    return 2 * e * (u ** 3 - u ** 4 / 2)


def sabs(x, e=SOFT):
    return ramp(x, e) + ramp(-x, e)


def pose(t):
    """cave.js poseAvatar at walk time t (seconds), moving, mid stride: {bone: (rot about X, rot about Z)} and the
    hips' drop. cave.js turns groups about their own x (the figure's left) and y (up); in Blender those are X and Z."""
    ph, A = t * math.pi * STEPS_PER_S, AMP
    sL, sR = math.sin(ph), math.sin(ph + math.pi)
    r = {}
    r["hipL"], r["hipR"] = -A * sL, -A * sR
    r["kneeL"] = 0.12 + 0.95 * ramp(math.cos(ph))
    r["kneeR"] = 0.12 + 0.95 * ramp(math.cos(ph + math.pi))
    r["ankleL"], r["ankleR"] = -(r["hipL"] + r["kneeL"]) * 0.8, -(r["hipR"] + r["kneeR"]) * 0.8
    B = A * 0.85
    r["shoulderL"], r["shoulderR"] = B * sL, B * sR
    r["elbowL"] = -(0.25 + 0.35 * ramp(-sL))
    r["elbowR"] = -(0.25 + 0.35 * ramp(-sR))
    # the hem bones (J5): the front panel follows the leg that is ahead, the back panel the thigh that is behind. A
    # positive turn about X swings a hanging bone back. Round 6: no longer the shin's kick too; the robe's cloth is held
    # near these bones (cloth.js blend), and a back panel that rose with the heel held the cloth up (CLOTH.md).
    r["hemF"] = -0.9 * A * sabs(sL)                               # 0.9 min(hipL, hipR), rounded
    r["hemB"] = 0.9 * A * sabs(sL)                                # 0.9 max(hipL, hipR), rounded
    rot = {k: (v, 0.0) for k, v in r.items()}
    rot["spine"] = (0.07, 0.14 * sL)
    rot["hips"] = (0.0, -0.1 * sL)
    drop = LEG * (1 - math.cos(A)) * 0.85 * sabs(sL)
    return rot, drop


def fuse(bms, voxel, smooth, tris):
    """Parts fused into one closed surface: a voxel remesh, a smooth (factor, iterations), and a decimation to about
    tris triangles. Returns a new mesh."""
    raw = bpy.data.meshes.new("Raw")
    all_bm = bmesh.new()
    for bm in bms:
        tmp = bpy.data.meshes.new("tmp")
        bm.to_mesh(tmp)
        all_bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
    all_bm.to_mesh(raw)
    all_bm.free()
    ob = bpy.data.objects.new("Fusing", raw)
    bpy.context.scene.collection.objects.link(ob)
    for kind, opts in (("REMESH", {"mode": "VOXEL", "voxel_size": voxel}),
                       ("SMOOTH", {"factor": smooth[0], "iterations": smooth[1]}), ("DECIMATE", {"ratio": 1.0})):
        m = ob.modifiers.new(kind, kind)
        for k, v in opts.items():
            setattr(m, k, v)
    dg = bpy.context.evaluated_depsgraph_get()
    whole = len(ob.evaluated_get(dg).data.polygons) * 2            # quads, as triangles
    ob.modifiers["DECIMATE"].ratio = min(1.0, tris / whole)         # every build lands near the same count
    dg = bpy.context.evaluated_depsgraph_get()
    out = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(raw)
    return out


def build(build_name, palette, out_dir, theme="robe_set", warp=None, warp_name=None, boss=None, integrate=False):
    """warp: a WARP row's name, or a dict of the warp's numbers (missing ones are the frame's) named by warp_name.
    boss: the NPC's answer to its boss question, one of BOSSES, kept on the report row as npc.boss.
    integrate: add the Integrate action beside Walk (INTEGRATE, by the warp's name)."""
    if boss is not None and boss not in BOSSES:
        raise SystemExit(f"no boss {boss}; there is {', '.join(BOSSES)}")
    fig, rig = make(build_name, palette, theme, warp, warp_name, integrate)
    return export(fig, rig, build_name, palette, out_dir, theme, boss)


def warp_row(warp, warp_name):
    """The warp's numbers over the frame's, and its name."""
    if isinstance(warp, str):
        if warp not in WARP:
            raise SystemExit(f"no warp {warp}; there is {', '.join(WARP)}")
        warp, warp_name = WARP[warp], warp
    return {**NEUTRAL, **(warp or {})}, warp_name


def make(build_name, palette, theme="robe_set", warp=None, warp_name=None, integrate=False):
    """The figure and its walking rig in a fresh scene, not yet exported (J5's garments are cut on these). The warp,
    its name and the Integrate action, if any, ride on the rig for export()."""
    if theme not in THEMES:
        raise SystemExit(f"no theme {theme}; there is {', '.join(THEMES)}")
    if build_name not in BUILDS or palette not in PALETTES:
        raise SystemExit(f"builds: {', '.join(BUILDS)}; palettes: {', '.join(PALETTES)}")
    w, warp_name = warp_row(warp, warp_name)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    name = f"{build_name}-{palette}" + (f"-{warp_name}" if warp_name else "")

    # the body: every part into one mesh, fused by a voxel remesh, smoothed and brought to a phone budget
    hands = (w["hands"],) * 2 if isinstance(w["hands"], str) else tuple(w["hands"])
    if any(h not in HANDS for h in hands):
        raise SystemExit(f"hands: {', '.join(HANDS)}")
    parts = body_parts(build_name)
    # the body fused by a voxel remesh, smoothed and brought to a phone budget; each hand fused on its own at a finer
    # voxel and its own budget, then joined, so the body's decimation never eats the fingers (Wendell, 2026-10-15:
    # "Hands look very weird the wrists are in the wrong place and too large and the hands too small")
    body = fuse([bm for bone, bm in parts if not in_hand(bone)], VOXEL, (0.8, 8), TRIS)
    joined = bmesh.new()
    joined.from_mesh(body)
    for n in "LR":
        hand_mesh = fuse([bm for bone, bm in parts if in_hand(bone) and bone.endswith(n)], HAND_VOXEL, (0.5, 2),
                         HAND_TRIS)
        joined.from_mesh(hand_mesh)
        bpy.data.meshes.remove(hand_mesh)
    for _, bm in parts:
        bm.verts.ensure_lookup_table()
    fused = bpy.data.meshes.new("Fused")
    joined.to_mesh(fused)
    joined.free()
    bpy.data.meshes.remove(body)
    fig = bpy.data.objects.new("Figure", fused)
    scene.collection.objects.link(fig)
    fused.name = f"Figure-{name}"
    # cut the surface level at each painted band's edge (hem, sash, cuff, ankle tie), so a band ends on an edge
    # and not across the long thin triangles the decimation leaves on the limbs
    bm = bmesh.new()
    bm.from_mesh(fused)
    for z in CUTS:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, z), plane_no=(0, 0, 1))
    cut_along(bm, neckline)
    bm.to_mesh(fused)
    bm.free()
    for p in fused.polygons:
        p.use_smooth = True

    # the warp, last: the fused body, its parts and its joints, before the weights are painted
    J0 = J = joints(build_name)
    rest = [v.co.copy() for v in fused.vertices]
    J, rest, blends = warp_body(fused, parts, J, w, build_name)        # always: a hand at rest is posed (NEUTRAL relaxed)
    trees = [(bone, BVHTree.FromBMesh(bm)) for bone, bm in parts]
    for _, bm in parts:
        bm.free()

    # the rig: the cave avatar's joints
    arm_data = bpy.data.armatures.new("Rig")
    rig = bpy.data.objects.new("Rig", arm_data)
    scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    for bone in PARENT:
        eb = arm_data.edit_bones.new(bone)
        eb.head, eb.tail = J[bone]
        eb.roll = 0
    for bone, parent in PARENT.items():
        if parent:
            arm_data.edit_bones[bone].parent = arm_data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")

    # weights: each vertex goes to the part it lay nearest before the warp, and blends with that part's parent or
    # child where the two meet (a joint), so the surface bends at a joint and never pulls an arm into the trunk. The
    # bands are painted by the part each vertex lies nearest now
    groups = {b: fig.vertex_groups.new(name=b) for b in PARENT}
    bone_of = []
    hands = hand_shells(fused, trees)
    for v in fused.vertices:
        bone_of.append(nearest_blend(v.co, trees, hands[v.index])[0])
        for b, x in blends[v.index].items():
            groups[b].add([v.index], x, "REPLACE")
    fig.parent = rig
    mod = fig.modifiers.new("Rig", "ARMATURE")
    mod.object = rig

    # the robe set's under-layer, painted per vertex
    pal = PALETTES[palette]
    col = fused.color_attributes.new("Col", "BYTE_COLOR", "CORNER")

    def paint(co, bone):
        # a plain top to the waist with short sleeves, over tied trousers: the long robe is J5's garment, so the
        # under-layer does not repeat its collar, cuffs or hem (Wendell, 2026-10-14: "The figrues without robes
        # should have bare or basic tops so they aren't duplicating the robes")
        x, y, z = co
        if bone.startswith(("shoulder", "elbow")):
            return pal["tunic"] if z > SASH[1] else SKIN            # the sleeve ends near the elbow, on a level cut
        if bone in ("head", "neck") or in_hand(bone) or neckline(Vector(co)) < 0:
            return SKIN
        if bone.startswith("ankle"):
            return pal["shoes"]
        if bone.startswith("knee"):
            return pal["trim"] if TIE[0] < z < TIE[1] else pal["trousers"]   # the trousers tied at the ankle
        if SASH[0] < z < SASH[1] and not bone.startswith(("shoulder", "elbow")):
            return pal["sash"]
        if bone.startswith("hip") or z < SASH[0]:
            return pal["trousers"]
        return pal["tunic"]

    # one colour per face, so a band's edge is a clean step and never a streak smeared along a long triangle; the
    # bands are placed on the body as it was before the warp, so a stooped figure's sash still sits at its waist
    for poly in fused.polygons:
        bones = [bone_of[i] for i in poly.vertices]
        centre = sum((rest[i] for i in poly.vertices), Vector()) / len(poly.vertices)
        rgb = paint(centre, max(set(bones), key=bones.count))
        for li in poly.loop_indices:
            col.data[li].color = (*rgb, 1.0)
    mat = bpy.data.materials.new(f"Robe-{palette}")
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.85
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    fused.materials.append(mat)

    # the walk, and the Integrate action beside it
    rig.animation_data_create()
    walk = rig.animation_data.action = key_walk(rig, FPS)
    scene.frame_start, scene.frame_end = 1, KEYS + 1
    rig["warp"] = json.dumps({"w": w, "name": warp_name})
    if integrate:
        if warp_name not in INTEGRATE:
            raise SystemExit(f"no integration for {warp_name}; there is {', '.join(INTEGRATE)}")
        for pb in rig.pose.bones:
            pb.location, pb.rotation_quaternion = (0, 0, 0), (1, 0, 0, 0)
        act, n = integrate_action(rig, J0, w, {**w, **INTEGRATE_TO, **INTEGRATE[warp_name].get("to", {})},
                                 build_name, INTEGRATE[warp_name])
        act.use_fake_user = True
        rig["integrate"] = n + 1
        rig.animation_data.action = walk
    return fig, rig


def key_walk(rig, fps, name="Walk", first=1):
    """The walk (one second, pose()) keyed fps times a second as a new action, from frame first."""
    act = bpy.data.actions.new(name)
    held = rig.animation_data.action
    rig.animation_data.action = act
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"
    prev = {}
    for k in range(fps + 1):
        rot, drop = pose((k / fps) % 1.0)
        for pb in rig.pose.bones:
            if pb.name not in BODY:
                continue                                           # the walk leaves the fingers as posed
            Bm = pb.bone.matrix_local.to_3x3()
            ax, az = rot.get(pb.name, (0.0, 0.0))
            R = Matrix.Rotation(az, 3, "Z") @ Matrix.Rotation(ax, 3, "X")
            q = (Bm.inverted() @ R @ Bm).to_quaternion()
            if k and q.dot(prev[pb.name]) < 0:
                q.negate()                                         # keep the keys on one side, so they interpolate short
            pb.rotation_quaternion = q
            pb.keyframe_insert("rotation_quaternion", frame=k + first)
            if pb.name == "hips":
                pb.location = Bm.inverted() @ Vector((0, 0, -drop))
                pb.keyframe_insert("location", frame=k + first)
        prev = {pb.name: pb.rotation_quaternion.copy() for pb in rig.pose.bones if pb.name in BODY}
    rig.animation_data.action = held
    return act


def retime(act, k):
    """Moves an action's keys and handles to k times their frame, in place: the same seconds at k times the fps."""
    for fc in fcurves(act):
        for kp in fc.keyframe_points:
            kp.co.x, kp.handle_left.x, kp.handle_right.x = (v * k for v in (kp.co.x, kp.handle_left.x, kp.handle_right.x))
        fc.update()


def export(fig, rig, build_name, palette, out_dir, theme="robe_set", boss=None):
    warp = json.loads(rig.get("warp", "null")) or {"w": NEUTRAL, "name": None}
    w, warp_name = warp["w"], warp["name"]
    integrate = "integrate" in rig
    name, fused = f"{build_name}-{palette}" + (f"-{warp_name}" if warp_name else ""), fig.data
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{name}.glb")
    # The walk is sampled at every frame and written as linear keys (J5 round 6). Written from Blender's Bezier curves
    # (export_force_sampling off) it became cubic splines whose quaternions flip sign between some keys (hips, hemB,
    # hipL/R, shoulders) with tangents near 48; three.js interpolates those component by component, the long way
    # round, so the hips and hem bones swung and snapped back every step: the jitter under the belt in the game.
    # three.js slerps linear quaternion keys the short way. Blender keeps its Bezier curves, which garments.py's
    # through test poses from (linear keys in Blender let the slight figure's knee through by 1 to 3 points).
    # Round 7 (his note on round 6: "Better hems around arms and legs still a bit jittery"): the game gets the walk keyed
    # 60 times a second, one key a frame, from pose() itself. At 24 linear keys a second the elbows, knees and ankles
    # turned a corner in speed at every key, 2 or 3 frames apart, and the cuffs and ankles shook with it (CLOTH.md).
    # The keys start at frame 0: the exporter writes a key's time as frame / fps, and keys from frame 1 started the clip
    # at 1/24 s, so three.js held the first pose that long at every loop, a hitch once a second.
    # Blender keeps its own 24 Bezier keys for the through test; the dense action exists only while the GLB is written.
    # A figure with an Integrate action writes both as their keys, each on its own NLA track: the walk's 60 straight
    # lines and the Integrate's keys moved to the same seconds at 60. Sampled at every frame, as the walk alone is, the
    # two come to about 450 KB, over the byte line.
    sc, keep = bpy.context.scene, rig.animation_data.action
    held = (sc.render.fps, sc.frame_start, sc.frame_end)
    keep.name, dense = "Walk-blender", key_walk(rig, EXPORT_FPS, first=0)
    keys, extra = {"Walk": EXPORT_FPS + 1}, []
    sc.render.fps, sc.frame_start, sc.frame_end = EXPORT_FPS, 0, EXPORT_FPS
    opts = dict(filepath=path, export_format="GLB", export_yup=True, export_normals=True, export_texcoords=False,
                export_skins=True, export_animations=True, export_force_sampling=True, export_vertex_color="ACTIVE",
                export_all_vertex_colors=False)
    try:
        if integrate:
            # the exporter's ACTIONS mode writes every action the rig can play, so Blender's own walk goes while the
            # GLB is written (key_walk makes it again after) and the Integrate is moved to 60 and back
            dense.name, integ = "Walk", bpy.data.actions["Integrate"]
            for fc in fcurves(dense):
                for kp in fc.keyframe_points:
                    kp.interpolation = "LINEAR"
            retime(integ, EXPORT_FPS / FPS)
            extra.append(integ)
            keys["Integrate"] = rig["integrate"]
            rig.animation_data.action = None
            bpy.data.actions.remove(keep)
            keep = None
            for a_ in (dense, integ):                               # both actions export, each on its own track
                tr = rig.animation_data.nla_tracks.new()
                tr.name = a_.name
                tr.strips.new(a_.name, round(a_.frame_range[0]), a_)
            bpy.ops.export_scene.gltf(**{**opts, "export_force_sampling": False}, export_animation_mode="ACTIONS")
        else:
            rig.animation_data.action = dense
            bpy.ops.export_scene.gltf(**opts, export_animation_mode="ACTIVE_ACTIONS", export_frame_range=True,
                                      export_nla_strips_merged_animation_name="Walk")   # the clip's name (round 9)
    finally:
        for tr in list(rig.animation_data.nla_tracks):
            rig.animation_data.nla_tracks.remove(tr)
        bpy.data.actions.remove(dense)
        for a_ in extra:
            retime(a_, FPS / EXPORT_FPS)
        sc.render.fps, sc.frame_start, sc.frame_end = held
        if keep is None:
            keep = key_walk(rig, FPS)
        rig.animation_data.action = keep
        keep.name = "Walk"
    size = os.path.getsize(path)
    row = {"id": name, "theme": theme, "build": build_name, "palette": palette, "warp": warp_name,
           "warp_numbers": {k: v for k, v in w.items() if v != NEUTRAL[k]}, "file": os.path.basename(path),
           "npc": {"daemon": warp_name if warp_name in WARP else None, "boss": boss,
                   "next": (NEXT_FIGURE[boss] or "frame") if boss else None},
           "bytes": size, "tris": sum(len(p.vertices) - 2 for p in fused.polygons), "verts": len(fused.vertices),
           "bones": len(PARENT), "keys": keys["Walk"], "actions": keys}
    if size > MAX_BYTES:
        raise SystemExit(f"{name}.glb is {size // 1024} KB, over the {MAX_BYTES // 1024} KB line")
    return row


def sheet(rows, out_dir):
    """Nine figures on one sheet, builds down and palettes across, each caught a quarter of the way through the walk,
    seen from the front three-quarter; and a side strip of the average dusk figure at four points of the walk."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    for row in rows:
        before = set(sc.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(out_dir, row["file"]))
        bi, pi = list(BUILDS).index(row["build"]), list(PALETTES).index(row["palette"])
        for o in set(sc.objects) - before:
            if o.parent is None:
                o.location = ((pi - 1) * 0.95, 0, (1 - bi) * 2.05)
    sc.frame_set(1 + KEYS // 4)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.type, cam.data.ortho_scale = "ORTHO", 6.6
    d = Vector((math.sin(math.radians(-25)), -math.cos(math.radians(-25)), 0.12)).normalized()
    cam.location = Vector((0, 0, 0.9)) + d * 12
    cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
    sc.collection.objects.link(cam)
    sc.camera = cam
    for e, rz, rx in ((3.2, 35, 50), (1.2, -140, 60)):
        sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
        sun.data.energy, sun.rotation_euler = e, (math.radians(rx), 0, math.radians(rz))
        sc.collection.objects.link(sun)
    sc.world = bpy.data.worlds.new("w")
    sc.world.color = (0.16, 0.15, 0.17)
    sc.render.engine, sc.cycles.device, sc.cycles.samples = "CYCLES", "CPU", 24
    sc.render.resolution_x, sc.render.resolution_y = 900, 1260
    sc.view_settings.view_transform = "Standard"
    sc.render.filepath = os.path.join(out_dir, "sheet.png")
    bpy.ops.render.render(write_still=True)

    # the walk strip: the average dusk figure from its left side at keys 0, 6, 12 and 18, side by side
    import numpy as np
    for o in sc.objects:
        o.hide_render = True
    strip = next(r for r in rows if r["build"] == "average" and r["palette"] == "dusk")
    before = set(sc.objects)
    bpy.ops.import_scene.gltf(filepath=os.path.join(out_dir, strip["file"]))
    for o in set(sc.objects) - before:
        o.hide_render = False
        if o.parent is None:
            o.location = (0, 0, 0)
    cam.data.ortho_scale = 2.2
    side = bpy.data.objects.new("side", bpy.data.lights.new("side", "SUN"))
    side.data.energy, side.rotation_euler = 3.0, (math.radians(60), 0, math.radians(100))
    sc.collection.objects.link(side)
    cam.location, cam.rotation_euler = (8, 0, 0.9), (math.radians(90), 0, math.radians(90))
    sc.render.resolution_x, sc.render.resolution_y = 300, 600
    cells = []
    for k in (0, 6, 12, 18):
        sc.frame_set(1 + k)
        sc.render.filepath = os.path.join(out_dir, f"walk_{k:02d}.png")
        bpy.ops.render.render(write_still=True)
        im = bpy.data.images.load(sc.render.filepath)
        cells.append(np.array(im.pixels[:], np.float32).reshape(600, 300, 4))
    img = bpy.data.images.new("strip", 1200, 600)
    img.pixels.foreach_set(np.hstack(cells).ravel())
    img.filepath_raw = os.path.join(out_dir, "walk.png")
    img.file_format = "PNG"
    img.save()


# The figure sheet (call sheet item 3): one frame, average build in dusk, and eleven figures each one number away from
# it, to look at before any row of WARP is trusted. (label, warp numbers)
ONE_NUMBER = [
    ("frame", {}),
    ("arms 0.85", {"arms": 0.85}), ("arms 1.15", {"arms": 1.15}),
    ("head 0.85", {"head": 0.85}), ("head 1.2", {"head": 1.2}),
    ("curve 0.3", {"curve": 0.3}), ("curve -0.15", {"curve": -0.15}),
    ("stoop 0.15", {"stoop": 0.15}), ("stoop -0.08", {"stoop": -0.08}),
    ("neck 0.35", {"gesture": {"neck": (0.35,)}}), ("knee L 0.35", {"gesture": {"kneeL": (0.35,)}}),
    ("shoulder L out 0.4", {"gesture": {"shoulderL": (0, 0.4)}}),
]


def grid_sheet(rows, out_dir, file, cols=4, labels=None, gap_x=1.0):
    """The figures in rest pose on a grid, each labelled, rendered twice: turned to the front three-quarter (file.png)
    and turned to show its left side (file-side.png), since a stoop or a curve reads from the side and arms and head
    from the front."""
    paths = []
    for tag, turn in (("", 25), ("-side", -90)):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        sc = bpy.context.scene
        n_rows = math.ceil(len(rows) / cols)
        gap_z = 2.3
        for i, row in enumerate(rows):
            before = set(sc.objects)
            bpy.ops.import_scene.gltf(filepath=os.path.join(out_dir, row["file"]))
            c, r = i % cols, i // cols
            at = Vector(((c - (cols - 1) / 2) * gap_x, 0, ((n_rows - 1) / 2 - r) * gap_z))
            for o in set(sc.objects) - before:
                if o.type == "ARMATURE" and o.animation_data:
                    o.animation_data.action = None                 # rest pose: the warp alone
                    for pb in o.pose.bones:
                        pb.matrix_basis = Matrix.Identity(4)
                if o.parent is None:
                    o.location, o.rotation_mode = at, "XYZ"
                    o.rotation_euler = (0, 0, math.radians(turn))
            label = (labels or {}).get(row["id"], row.get("warp") or row["id"])
            txt = bpy.data.objects.new("label", bpy.data.curves.new("label", "FONT"))
            txt.data.body, txt.data.size, txt.data.align_x = label, 0.12, "CENTER"
            txt.location, txt.rotation_euler = at + Vector((0, -0.4, -0.22)), (math.radians(90), 0, 0)
            txt.visible_shadow = False                             # or a label shades the head of the row below
            sc.collection.objects.link(txt)
        w, h = cols * gap_x, n_rows * gap_z
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        cam.data.type, cam.data.ortho_scale = "ORTHO", max(w, h)
        cam.location, cam.rotation_euler = (0, -14, 0.78), (math.radians(90), 0, 0)
        sc.collection.objects.link(cam)
        sc.camera = cam
        for e, rz, rx in ((3.2, 35, 50), (1.4, -140, 60)):
            sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
            sun.data.energy, sun.rotation_euler = e, (math.radians(rx), 0, math.radians(rz))
            sc.collection.objects.link(sun)
        sc.world = bpy.data.worlds.new("w")
        sc.world.color = (0.16, 0.15, 0.17)
        sc.render.engine, sc.cycles.device, sc.cycles.samples = "CYCLES", "CPU", 24
        sc.render.resolution_x, sc.render.resolution_y = int(260 * w), int(260 * h)
        sc.view_settings.view_transform = "Standard"
        sc.render.filepath = os.path.join(out_dir, f"{file}{tag}.png")
        bpy.ops.render.render(write_still=True)
        paths.append(sc.render.filepath)
    return paths


def integrate_strip(row, out_dir, cells=7):
    """The Integrate action as strips of the one figure at even points from held to open: integrate.png from the front
    three-quarter, integrate-side.png from its left, and integrate-hands.png close on the right hand."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=os.path.join(out_dir, row["file"]))
    rig = next(o for o in sc.objects if o.type == "ARMATURE")
    rig.animation_data.action = bpy.data.actions["Integrate"]
    for tr in list(rig.animation_data.nla_tracks):
        rig.animation_data.nla_tracks.remove(tr)
    n = row["actions"]["Integrate"]
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.type = "ORTHO"
    sc.collection.objects.link(cam)
    sc.camera = cam
    for e, rz, rx in ((3.2, 35, 50), (1.4, -140, 60), (1.2, 100, 60)):
        sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
        sun.data.energy, sun.rotation_euler = e, (math.radians(rx), 0, math.radians(rz))
        sc.collection.objects.link(sun)
    sc.world = bpy.data.worlds.new("w")
    sc.world.color = (0.16, 0.15, 0.17)
    sc.render.engine, sc.cycles.device, sc.cycles.samples = "CYCLES", "CPU", 24
    sc.view_settings.view_transform = "Standard"
    import numpy as np
    paths = []
    for tag, turn, aim, scale, (w, h) in (("", 25, (0, 0, 0.9), 2.3, (360, 560)), ("-side", 90, (0, 0, 0.9), 2.3, (360, 560)),
                                         ("-hands", 25, None, 0.55, (300, 300))):
        d = Vector((math.sin(math.radians(-turn)), -math.cos(math.radians(-turn)), 0.08)).normalized()
        cam.data.ortho_scale = scale
        sc.render.resolution_x, sc.render.resolution_y = w, h
        imgs = []
        for i in range(cells):
            f = 1 + round(i * (n - 1) / (cells - 1))
            sc.frame_set(f)
            at = Vector(aim) if aim else rig.matrix_world @ rig.pose.bones["wristR"].tail
            cam.location = at + d * 10
            cam.rotation_euler = (-d).to_track_quat("-Z", "Y").to_euler()
            sc.render.filepath = os.path.join(out_dir, f"_cell{tag}_{i}.png")
            bpy.ops.render.render(write_still=True)
            im = bpy.data.images.load(sc.render.filepath)
            imgs.append(np.array(im.pixels[:], np.float32).reshape(h, w, 4))
            bpy.data.images.remove(im)
            os.remove(sc.render.filepath)
        img = bpy.data.images.new("strip" + tag, w * cells, h)
        img.pixels.foreach_set(np.hstack(imgs).ravel())
        img.filepath_raw = os.path.join(out_dir, f"integrate{tag}.png")
        img.file_format = "PNG"
        img.save()
        paths.append(img.filepath_raw)
    return paths


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--theme", default="robe_set")
    ap.add_argument("--build", default="average")
    ap.add_argument("--palette", default="dusk")
    ap.add_argument("--all", action="store_true", help="every build in every palette")
    ap.add_argument("--sheet", action="store_true", help="render sheet.png and walk.png (Cycles, CPU)")
    ap.add_argument("--out", default=os.path.join(os.environ.get("W", "/tmp/blender-cloud"), "characters"))
    ap.add_argument("--warp", default=None, help=f"a WARP row: {', '.join(WARP)}")
    ap.add_argument("--boss", default=None, choices=BOSSES, help="the NPC's answer to its boss question")
    ap.add_argument("--daemons", action="store_true", help="the frame and every WARP row, in --build and --palette")
    ap.add_argument("--one-number", action="store_true", help="the frame and the eleven figures one number from it")
    ap.add_argument("--integrate", action="store_true", help="with --warp: add the Integrate action beside Walk")
    a = ap.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
    if a.daemons or a.one_number:
        if a.daemons:
            todo = [(None, None)] + [(k, None) for k in WARP]
        else:
            todo = [(n.replace(" ", "-").replace(".", "") if n != "frame" else None, v) for n, v in ONE_NUMBER]
        rows = [build(a.build, a.palette, a.out, a.theme, warp=v if v is not None else k, warp_name=k)
                for k, v in todo]
        labels = {r["id"]: n for r, (n, _) in zip(rows, ONE_NUMBER)} if a.one_number else \
            {r["id"]: r["warp"] or "frame" for r in rows}
        with open(os.path.join(a.out, "report.json"), "w") as f:
            json.dump(rows, f, indent=1)
        for r in rows:
            print(f"{r['id']}: {r['bytes'] // 1024} KB, {r['tris']} triangles, {r['warp_numbers']}")
        if a.sheet:
            print("sheets:", *grid_sheet(rows, a.out, "daemons" if a.daemons else "one-number", labels=labels,
                                         gap_x=1.8 if a.daemons else 1.0))   # flung arms need the room
        return
    combos = [(b, p) for b in BUILDS for p in PALETTES] if a.all else [(a.build, a.palette)]
    rows = [build(b, p, a.out, a.theme, warp=a.warp, boss=a.boss, integrate=a.integrate) for b, p in combos]
    with open(os.path.join(a.out, "report.json"), "w") as f:
        json.dump(rows, f, indent=1)
    for r in rows:
        print(f"{r['id']}: {r['bytes'] // 1024} KB, {r['tris']} triangles, {r['bones']} bones, {r['keys']} keys")
    if a.sheet and a.integrate:
        print("strips:", *integrate_strip(rows[0], a.out))
    elif a.sheet:
        sheet(rows, a.out)
        print(f"sheet: {os.path.join(a.out, 'sheet.png')}, {os.path.join(a.out, 'walk.png')}")


if __name__ == "__main__":
    main()
