"""The arrival scene for Sprout's character creator: the Infinite Arcade, then the road to the south gate.

Calrunia creator, pass calrunia-creator2 (six-faces-council council/callsheets/calrunia-creator.md, "Brief after that").
Two shots, low poly, dusk palette, every mesh box-modelled here (no downloaded props):

  shot one (8 s)  a corridor of arcade cabinets going on into mist; the camera drifts down it and settles square-on to
                  the cabinet marked for Chapter 1, whose screen shows road mist; hold.
  shot two (5 s)  the camera pushes into that screen (the white-out is added by the encoder), and comes out on a misty
                  road toward the settlement's south gate.

Fog is a shader term (view distance through an exponential), not a volume, so the CPU render stays cheap.
Renders with Cycles on the CPU (EEVEE needs a GPU, see ../../README.md "Still true").

  /home/user/blenv/bin/python arrival.py OUT --still            # one corridor still, OUT/still.png (look at it first)
  /home/user/blenv/bin/python arrival.py OUT [--step N]         # every Nth frame of both shots, then posters and screen-rect.json
  bash encode.sh OUT                                            # MP4 (H.264) and WebM per shot, under 3 MB each

OUT gets shot1/0001.png..., shot2/0001.png..., poster-shot1-first.png, poster-shot1-last.png, poster-shot2-first.png,
poster-shot2-last.png and screen-rect.json: the Chapter 1 screen in shot one's last frame as fractions of the frame
(x, y from the top left, w, h), which Sprout uses to place the creator inside the screen.
"""
import json, math, os, random, shutil, sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Vector

ARGS = sys.argv[1:]
OUT = os.path.abspath(ARGS[0] if ARGS and not ARGS[0].startswith('--') else '/tmp/arcade')
STILL = '--still' in ARGS
STEP = int(ARGS[ARGS.index('--step') + 1]) if '--step' in ARGS else 1
SAMPLES = int(ARGS[ARGS.index('--samples') + 1]) if '--samples' in ARGS else 6
W, H, FPS = 1280, 720, 24
SHOT1, SHOT2, PUSH = 8 * FPS, 5 * FPS, 46          # frames; shot two cuts from the push to the road at PUSH
random.seed(7)

# dusk palette (linear-ish values chosen by eye on the first still)
def hexc(h, a=1.0):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c) + (a,)
FOG_HALL, FOG_ROAD = hexc('#5a4a72'), hexc('#c9a6b8')
SCREEN_HUES = ['#3fd6c4', '#e0569a', '#f0a640', '#7a8cff', '#59d873', '#c86bff']

# ---------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.use_persistent_data = True           # keep the scene between frames
scene.cycles.max_bounces = 3
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 1
scene.cycles.transmission_bounces = 0
scene.cycles.volume_bounces = 0
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = W, H, 100
scene.render.fps = FPS
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Punchy' if 'AgX - Punchy' in [i.identifier for i in scene.view_settings.bl_rna.properties['look'].enum_items] else 'None'
world = bpy.data.worlds.new('dusk'); scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']


def material(name, color, emit=0.0, emit_color=None, rough=0.8, fog=FOG_HALL, density=0.045, image=None):
    """A flat material whose surface fades into fog with distance from the camera."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; n = nt.nodes; l = nt.links; n.clear()
    out = n.new('ShaderNodeOutputMaterial')
    if image is not None:
        tex = n.new('ShaderNodeTexImage'); tex.image = image; tex.interpolation = 'Linear'
        surf = n.new('ShaderNodeEmission'); l.new(tex.outputs['Color'], surf.inputs['Color']); surf.inputs['Strength'].default_value = emit
    elif emit > 0:
        surf = n.new('ShaderNodeEmission'); surf.inputs['Color'].default_value = emit_color or color; surf.inputs['Strength'].default_value = emit
    else:
        surf = n.new('ShaderNodeBsdfPrincipled'); surf.inputs['Base Color'].default_value = color; surf.inputs['Roughness'].default_value = rough
    cam = n.new('ShaderNodeCameraData')
    mul = n.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = -density
    ex = n.new('ShaderNodeMath'); ex.operation = 'EXPONENT'
    inv = n.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    l.new(cam.outputs['View Distance'], mul.inputs[0]); l.new(mul.outputs[0], ex.inputs[0]); l.new(ex.outputs[0], inv.inputs[1])
    fe = n.new('ShaderNodeEmission'); fe.inputs['Color'].default_value = fog; fe.inputs['Strength'].default_value = 1.0
    mix = n.new('ShaderNodeMixShader')
    l.new(inv.outputs[0], mix.inputs[0]); l.new(surf.outputs[0], mix.inputs[1]); l.new(fe.outputs[0], mix.inputs[2])
    l.new(mix.outputs[0], out.inputs['Surface'])
    return m


class Mesh:
    """Boxes, quads and cones gathered into one mesh, so thousands of pieces cost one object (bpy.ops per piece is slow)."""
    def __init__(self): self.v, self.f, self.m, self.mats = [], [], [], []

    def _mat(self, mat):
        if mat not in self.mats: self.mats.append(mat)
        return self.mats.index(mat)

    def _add(self, verts, faces, loc, rot, mat):
        R = Euler(rot).to_matrix(); o = len(self.v); mi = self._mat(mat)
        self.v += [tuple(R @ Vector(p) + Vector(loc)) for p in verts]
        self.f += [tuple(o + i for i in fc) for fc in faces]; self.m += [mi] * len(faces)

    def box(self, size, loc, mat, rot=(0, 0, 0)):
        x, y, z = (s / 2 for s in size)
        vs = [(-x, -y, -z), (x, -y, -z), (x, y, -z), (-x, y, -z), (-x, -y, z), (x, -y, z), (x, y, z), (-x, y, z)]
        self._add(vs, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], loc, rot, mat)

    def quad(self, size, loc, rot, mat):
        x, y = size[0] / 2, size[1] / 2
        self._add([(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0)], [(0, 1, 2, 3)], loc, rot, mat)

    def cone(self, r, h, loc, mat, n=6):
        vs = [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), -h / 2) for i in range(n)] + [(0, 0, h / 2)]
        self._add(vs, [tuple(range(n - 1, -1, -1))] + [(i, (i + 1) % n, n) for i in range(n)], loc, (0, 0, 0), mat)

    def finish(self, name):
        me = bpy.data.meshes.new(name); me.from_pydata(self.v, [], self.f)
        uv = me.uv_layers.new()
        for poly in me.polygons:                       # quads get a 0..1 square, which the screen images use
            for k, li in enumerate(poly.loop_indices): uv.data[li].uv = ((0, 0), (1, 0), (1, 1), (0, 1))[k % 4]
        for mt in self.mats: me.materials.append(mt)
        me.polygons.foreach_set('material_index', self.m); me.update()
        ob = bpy.data.objects.new(name, me); scene.collection.objects.link(ob)
        return ob


def light(kind, loc, energy, color, size=0.25, rot=(0, 0, 0)):
    ld = bpy.data.lights.new(kind.lower(), kind); ld.energy = energy; ld.color = color
    if kind != 'SUN': ld.shadow_soft_size = size
    ob = bpy.data.objects.new(kind.lower(), ld); ob.location = loc; ob.rotation_euler = rot
    scene.collection.objects.link(ob); return ob


def road_mist_image():
    """The Chapter 1 screen: a pale road running into mist, drawn into pixels (no texture files)."""
    import numpy as np
    w, h = 256, 192
    img = bpy.data.images.new('road_mist', w, h)
    y, x = np.mgrid[0:h, 0:w].astype(float)
    t = y / (h - 1)                                      # 0 at the bottom row (Blender images start at the bottom)
    sky = np.stack([0.80 + 0.12 * t, 0.70 + 0.12 * t, 0.80 + 0.10 * t], -1)
    horizon = 0.46
    ground = np.stack([0.30 + 0.5 * t, 0.30 + 0.45 * t, 0.36 + 0.45 * t], -1)
    px = np.where((t < horizon)[..., None], ground, sky)
    half = 0.03 + (horizon - t) * 0.9                    # the road narrows toward the horizon
    road = (t < horizon) & (np.abs(x / w - 0.5) < half)
    px[road] = np.stack([0.62 + 0.5 * t[road], 0.55 + 0.5 * t[road], 0.55 + 0.45 * t[road]], -1)
    for gx in (0.5,):                                    # a far gate: two posts and a lintel, faint in the mist
        post = (np.abs(t - (horizon + 0.05)) < 0.06) & ((np.abs(x / w - gx + 0.035) < 0.006) | (np.abs(x / w - gx - 0.035) < 0.006))
        lintel = (np.abs(t - (horizon + 0.105)) < 0.008) & (np.abs(x / w - gx) < 0.05)
        px[post | lintel] = (0.48, 0.40, 0.48)
    mist = np.exp(-((t - horizon) / 0.12) ** 2)[..., None]
    px = px * (1 - 0.55 * mist) + 0.55 * mist * np.array([0.92, 0.86, 0.90])
    rgba = np.concatenate([px, np.ones((h, w, 1))], -1).astype(np.float32)
    img.pixels.foreach_set(rgba.ravel())
    img.pack()
    return img


# ---------------------------------------------------------------- the arcade
M = {
    'floor': material('floor', hexc('#2a2236'), rough=0.35),
    'ceil': material('ceil', hexc('#1a1626')),
    'body': [material('body%d' % i, hexc(h)) for i, h in enumerate(['#3a2e52', '#2e3350', '#4a2f48', '#33284a'])],
    'trim': material('trim', hexc('#1c1724')),
    'wall': material('wall', hexc('#241d33')),
    'panel': material('panel', hexc('#5b4a6e')),
    'gold_body': material('gold_body', hexc('#5a3b2c')),
    'gold': material('gold', hexc('#f2c55c'), emit=6.0),
    'gold_text': material('gold_text', hexc('#fff2c8'), emit=9.0),
    'lamp': material('lamp', hexc('#ffb36b'), emit=5.0),
}
SCREENS = [material('screen%d' % i, hexc(h), emit=1.3) for i, h in enumerate(SCREEN_HUES)]
MARQ = [material('marq%d' % i, hexc(h), emit=1.8) for i, h in enumerate(SCREEN_HUES)]
ROAD_IMG = road_mist_image()
CH1_SCREEN = material('ch1_screen', (1, 1, 1, 1), emit=1.6, image=ROAD_IMG)

AISLE = 1.5            # cabinet fronts stand at x = +-AISLE
PITCH = 1.3            # cabinet spacing along the corridor: a 0.86 m cabinet and a gap of about 0.45 m (round 2, his note)
CH1_Y = 4 - 9 * PITCH  # the Chapter 1 cabinet, on the left (on the cabinet grid)
SCR_W, SCR_H, SCR_Z = 0.62, 0.465, 1.36
UPPER = 0.95           # the upper body's height at scale 1; other cabinets stand 0.8 to 1.3 of it (round 2: varied heights)


HALL = Mesh()


def cabinet(side, y, ch1=False, hs=1.0):
    """One upright cabinet, box-modelled, its front facing the aisle. side -1 is left (x < 0). hs scales the upper body's
    height (the base and control panel stay at hand height); the Chapter 1 cabinet keeps 1, so the hold frames it the same."""
    s = side
    body = M['gold_body'] if ch1 else random.choice(M['body'])
    d, w, up = 0.75, 0.86, UPPER * hs
    top = 1.0 + up                                                              # the upper body's top
    sz = SCR_Z if ch1 else 1.0 + (SCR_Z - 1.0) * hs                             # screen centre, scaled with the body
    cx = s * (AISLE + d / 2)
    HALL.box((d, w, 1.0), (cx, y, 0.5), body)                                  # base
    HALL.box((d * 0.8, w, up), (cx + s * d * 0.1, y, 1.0 + up / 2), body)     # upper, set back
    HALL.box((0.36, w + 0.02, 0.09), (s * (AISLE + 0.06), y, 1.02), M['panel'], rot=(0, s * -0.35, 0))  # control panel
    HALL.box((d * 0.8, w + 0.06, 0.24), (cx + s * d * 0.1, y, top + 0.11), M['trim'])                   # marquee housing
    for dy in (-1, 1):
        HALL.box((d + 0.02, 0.04, top + 0.15), (cx, y + dy * (w / 2 + 0.01), (top + 0.15) / 2), M['trim'])  # side rails
    rot = (math.pi / 2, 0, s * -math.pi / 2)                                    # vertical, facing the aisle
    fx = s * (AISLE + d * 0.1 - 0.02)
    scr = (Vector((fx - s * 0.002, y, SCR_Z)), Euler(rot)) if ch1 else None
    HALL.quad((SCR_W, SCR_H), (fx - s * 0.002, y, sz), rot, CH1_SCREEN if ch1 else random.choice(SCREENS))
    HALL.quad((SCR_W + 0.1, SCR_H + 0.1), (fx + s * 0.004, y, sz), rot, M['trim'])
    HALL.quad((w * 0.92, 0.17), (fx - s * 0.002, y, top + 0.11), rot, M['gold'] if ch1 else random.choice(MARQ))
    for b in range(2):                                                          # two buttons on the panel
        HALL.box((0.05, 0.05, 0.04), (s * (AISLE + 0.06), y + (b - 0.5) * 0.18, 1.08), random.choice(MARQ))
    if ch1:
        bpy.ops.object.text_add(location=(fx - s * 0.01, y, 2.025), rotation=rot)
        t = bpy.context.object; t.data.body = 'CHAPTER 1'; t.data.align_x = 'CENTER'; t.data.size = 0.11
        t.data.extrude = 0.004; t.data.materials.append(M['gold_text'])
        # a warm lamp hung above it, so the eye finds it from far off
        HALL.box((0.12, 0.12, 0.08), (s * (AISLE - 0.25), y, 2.75), M['lamp'])
        light('POINT', (s * (AISLE - 0.35), y, 2.6), 60, (1.0, 0.72, 0.42), 0.3)
    return scr


HALL.box((8, 220, 0.1), (0, -100, -0.05), M['floor'])
HALL.box((8, 220, 0.1), (0, -100, 3.2), M['ceil'])
for side in (-1, 1):                                                            # back walls, seen through the gaps
    HALL.box((0.1, 220, 3.2), (side * (AISLE + 0.95), -100, 1.6), M['wall'])
STRIP = material('strip', hexc('#d9b8ff'), emit=2.5)
ch1 = None
for i in range(-4, 89):                                                        # to y = -110, just short of the far glow
    y = 4 - i * PITCH
    for side in (-1, 1):
        is1 = side == -1 and abs(y - CH1_Y) < 1e-6
        s = cabinet(side, y, ch1=is1, hs=1.0 if is1 else random.choice((0.8, 0.88, 0.96, 1.06, 1.16, 1.3)))
        if is1: ch1 = s
    if i % 4 == 0:                                                              # strip lights overhead, receding
        HALL.box((0.08, 0.9, 0.03), (0, y, 3.13), STRIP)
if ch1 is None:                                                                 # snap CH1_Y onto the grid
    raise SystemExit('CH1_Y is not on the cabinet grid')
# the far glow at the end of the corridor
HALL.quad((8, 3.3), (0, -112, 1.6), (math.pi / 2, 0, 0), material('far', hexc('#f2a7c4'), emit=3.0, density=0.0))
HALL.finish('arcade')

# ---------------------------------------------------------------- the road to the south gate (far from the arcade)
RX = 400.0
R = {
    'ground': material('ground', hexc('#4f5a4a'), fog=FOG_ROAD, density=0.032),
    'road': material('road', hexc('#8a7a6a'), fog=FOG_ROAD, density=0.032),
    'wood': material('wood', hexc('#4a3426'), fog=FOG_ROAD, density=0.032),
    'roof': material('roof', hexc('#5e3a3a'), fog=FOG_ROAD, density=0.032),
    'tree': material('tree', hexc('#33463a'), fog=FOG_ROAD, density=0.032),
    'rock': material('rock', hexc('#6a6470'), fog=FOG_ROAD, density=0.032),
    'lantern': material('lantern', hexc('#ffc27a'), emit=14.0, fog=FOG_ROAD, density=0.02),
}
ROAD = Mesh()
ROAD.box((200, 200, 0.1), (RX, 0, -0.05), R['ground'])
ROAD.box((3.2, 200, 0.02), (RX, 0, 0.01), R['road'])
GATE_Y = -19
for dx in (-1, 1):
    ROAD.box((0.4, 0.4, 4.2), (RX + dx * 2.1, GATE_Y, 2.1), R['wood'])
    ROAD.box((0.25, 0.25, 0.35), (RX + dx * 2.1, GATE_Y + 0.35, 2.9), R['lantern'])
    for k in range(1, 14):                                                      # the palisade either side
        h = 3.0 + 0.25 * math.sin(k * 1.7)
        ROAD.box((0.42, 0.42, h), (RX + dx * (2.1 + k * 0.48), GATE_Y, h / 2), R['wood'])
ROAD.box((5.2, 0.5, 0.35), (RX, GATE_Y, 4.25), R['wood'])
ROAD.box((5.8, 1.2, 0.18), (RX, GATE_Y, 4.55), R['roof'])
for dx in (-1, 1):
    light('POINT', (RX + dx * 2.1, GATE_Y + 0.9, 2.9), 80, (1.0, 0.7, 0.4))
for k in range(40):                                                             # low-poly trees and rocks along the road
    side = random.choice((-1, 1)); y = random.uniform(-60, 8); x = RX + side * random.uniform(4, 22)
    if random.random() < 0.7:
        hgt = random.uniform(2.5, 5.5)
        ROAD.cone(hgt * 0.32, hgt, (x, y, hgt / 2 + 0.6), R['tree'])
        ROAD.box((0.2, 0.2, 0.7), (x, y, 0.35), R['wood'])
    else:
        r = random.uniform(0.3, 0.8); ROAD.box((r * 1.6, r * 1.3, r), (x, y, 0.2), R['rock'], rot=(0.2, 0.3, random.uniform(0, 3)))
ROAD.finish('road')

# ---------------------------------------------------------------- lights and camera
sun = light('SUN', (0, 0, 10), 0.6, (1.0, 0.6, 0.55), rot=(0.9, 0.2, 0.6))
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); scene.collection.objects.link(cam); scene.camera = cam
cam.data.sensor_width = 36; cam.data.lens = 36; cam.data.clip_start = 0.02; cam.data.clip_end = 400

SCR_X = -(AISLE + 0.75 * 0.1 - 0.02) + 0.002          # the left screens' plane
END_DIST = 2.05                                       # camera to screen at the hold
END_LIFT = 0.255                                      # camera above the screen's centre, so the marquee is in frame
P_START = (Vector((0.15, 6.5, 1.75)), Vector((math.radians(88), 0, math.radians(180))))
P_END = (Vector((SCR_X + END_DIST, CH1_Y, SCR_Z + END_LIFT)), Vector((math.radians(90), 0, math.radians(90))))


def ease(t):
    return t * t * (3 - 2 * t)


def ease_out(t):
    return 1 - (1 - t) ** 3


def shot1_pose(f):
    """Drift down the corridor, then turn and settle square-on to the Chapter 1 cabinet; hold from DRIFT on."""
    DRIFT = int(6.2 * FPS)
    t = min(f / DRIFT, 1.0)
    # travel along y with an ease, then swing in: the turn starts in the second half
    y = P_START[0].y + (CH1_Y - P_START[0].y) * ease_out(min(t / 0.85, 1.0))
    turn = ease(max(0.0, (t - 0.45) / 0.55))
    x = P_START[0].x + (P_END[0].x - P_START[0].x) * turn
    z = P_START[0].z + (P_END[0].z - P_START[0].z) * ease(t)
    # while travelling the camera looks a little ahead and left, so the turn reads as one move
    rz = math.radians(180) + (math.radians(90) - math.radians(180)) * turn
    rx = math.radians(88) + math.radians(2) * ease(t)
    bob = 0.0 if t >= 1 else 0.01 * math.sin(f * 0.21) * (1 - t)
    return Vector((x, y, z + bob)), Vector((rx, 0, rz))


def shot2_pose(f):
    if f < PUSH:                                      # push straight into the screen glass
        t = ease(f / PUSH) ** 1.6
        loc = P_END[0].copy(); loc.x = P_END[0].x - (END_DIST - 0.06) * t; loc.z = P_END[0].z - END_LIFT * t
        return loc, P_END[1]
    t = (f - PUSH) / (SHOT2 - PUSH)                   # out on the road, walking toward the south gate
    y = 8 - 10 * ease_out(t)
    return Vector((RX + 0.2 * math.sin(t * 2), y, 1.65 + 0.02 * math.sin(f * 0.4))), Vector((math.radians(88), 0, math.radians(180)))


def set_pose(loc, rot, road=False):
    cam.location = loc; cam.rotation_euler = rot
    bg.inputs['Color'].default_value = FOG_ROAD if road else FOG_HALL
    bg.inputs['Strength'].default_value = 1.0
    sun.data.energy = 2.0 if road else 0.4


def render(path):
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def screen_rect():
    set_pose(*shot1_pose(SHOT1 - 1)); bpy.context.view_layer.update()
    c, r = ch1; R = r.to_matrix()
    pts = [world_to_camera_view(scene, cam, c + R @ Vector((dx * SCR_W / 2, dy * SCR_H / 2, 0))) for dx in (-1, 1) for dy in (-1, 1)]
    x0, x1 = min(p.x for p in pts), max(p.x for p in pts); y0, y1 = min(p.y for p in pts), max(p.y for p in pts)
    return {'x': round(x0, 4), 'y': round(1 - y1, 4), 'w': round(x1 - x0, 4), 'h': round(y1 - y0, 4),
            'frame': {'width': W, 'height': H}, 'note': 'Chapter 1 cabinet screen in the last frame of shot one; fractions of the frame, origin top left'}


os.makedirs(OUT, exist_ok=True)
if STILL:
    f = int(ARGS[ARGS.index('--frame') + 1]) if '--frame' in ARGS else int(2.5 * FPS)
    shot = ARGS[ARGS.index('--shot') + 1] if '--shot' in ARGS else '1'
    if shot == '1': set_pose(*shot1_pose(f))
    else: set_pose(*shot2_pose(f), road=f >= PUSH)
    render(os.path.join(OUT, 'still.png'))
    print('STILL', os.path.join(OUT, 'still.png'), json.dumps(screen_rect()))
    raise SystemExit
for name, n, pose in (('shot1', SHOT1, shot1_pose), ('shot2', SHOT2, shot2_pose)):
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    for f in range(0, n, STEP):
        p = os.path.join(d, '%04d.png' % (f + 1))
        if os.path.exists(p): continue                # resumable
        loc, rot = pose(f)
        if f >= STEP and (loc, rot) == pose(f - STEP):    # the hold: the camera is still, so the frame is the one before
            shutil.copy(os.path.join(d, '%04d.png' % (f - STEP + 1)), p); continue
        set_pose(loc, rot, road=(name == 'shot2' and f >= PUSH))
        render(p)
    last = max(range(0, n, STEP))
    shutil.copy(os.path.join(d, '0001.png'), os.path.join(OUT, 'poster-%s-first.png' % name))
    shutil.copy(os.path.join(d, '%04d.png' % (last + 1)), os.path.join(OUT, 'poster-%s-last.png' % name))
rect = screen_rect()
json.dump(rect, open(os.path.join(OUT, 'screen-rect.json'), 'w'), indent=1)
print('DONE', OUT, json.dumps(rect))
