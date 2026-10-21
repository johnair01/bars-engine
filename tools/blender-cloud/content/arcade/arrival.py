"""The arrival scene for Sprout's character creator: the Infinite Arcade, then the road to the south gate.

Calrunia creator, pass calrunia-creator2 (six-faces-council council/callsheets/calrunia-creator.md, "Brief after that").
Two shots, low poly, dusk palette, every mesh box-modelled here (no downloaded props):

  shot one (8 s)  a corridor of arcade cabinets going on into mist; the camera drifts down it and settles square-on to
                  the cabinet marked for Chapter 1, whose screen shows road mist; hold.
  shot two (5 s)  the camera pushes into that screen (the white-out is added by the encoder), and comes out on a misty
                  road toward the settlement's south gate.

Round 3 (his note on round 2): each cabinet height is a cabinet type with its own screen shape (TYPES: cocktail, cabaret,
candy, upright, vertical shooter, widescreen deluxe), and every control panel carries ball-top joysticks and round buttons.

Fog is a shader term (view distance through an exponential), not a volume, so the CPU render stays cheap.
Renders with Cycles on the CPU (EEVEE needs a GPU, see ../../README.md "Still true").

  /home/user/blenv/bin/python arrival.py OUT --still            # one corridor still, OUT/still.png (look at it first)
  /home/user/blenv/bin/python arrival.py OUT [--step N]         # every Nth frame of both shots, then posters and screen-rect.json
  /home/user/blenv/bin/python arrival.py OUT --still --side Y  # square-on to the right-hand wall at y = Y, to check the types
  bash encode.sh OUT                                            # MP4 (H.264) and WebM per shot, under 3 MB each

OUT gets shot1/0001.png..., shot2/0001.png..., poster-shot1-first.png, poster-shot1-last.png, poster-shot2-first.png,
poster-shot2-last.png and screen-rect.json: the Chapter 1 screen in shot one's last frame as fractions of the frame
(x, y from the top left, w, h), which Sprout uses to place the creator inside the screen.
"""
import json, math, os, random, shutil, sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Matrix, Vector

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
        R = rot if isinstance(rot, Matrix) else Euler(rot).to_matrix(); o = len(self.v); mi = self._mat(mat)
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

    def cyl(self, r, h, loc, mat, rot=(0, 0, 0), n=12):
        """A prism standing on local z (its base at loc), for buttons, stick shafts and base plates."""
        vs = [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), z) for z in (0, h) for i in range(n)]
        fs = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
        self._add(vs, fs, loc, rot, mat)

    def ball(self, r, loc, mat, n=10, rings=6):
        vs = [(0, 0, -r)] + [(r * math.sin(math.pi * k / rings) * math.cos(2 * math.pi * i / n), r * math.sin(math.pi * k / rings) * math.sin(2 * math.pi * i / n),
                               -r * math.cos(math.pi * k / rings)) for k in range(1, rings) for i in range(n)] + [(0, 0, r)]
        top = len(vs) - 1; fs = [(0, (i + 1) % n + 1, i + 1) for i in range(n)]
        for k in range(rings - 2):
            a, b = 1 + k * n, 1 + (k + 1) * n
            fs += [(a + i, a + (i + 1) % n, b + (i + 1) % n, b + i) for i in range(n)]
        fs += [(top - n + i, top - n + (i + 1) % n, top) for i in range(n)]
        self._add(vs, fs, loc, (0, 0, 0), mat)

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


HALL = Mesh()


# Cabinet types (round 3, his note: "the height change needs to also have screen shapes to match the new heights"). Proportions
# from real cabinets, scaled up a little to stand beside the Chapter 1 cabinet: a cocktail table (0.76 x 0.53 x 0.94 m, the
# screen face-up under glass), a cabaret or mini upright (about 1.5 m, a 13-19 in 4:3 screen), a Japanese candy cabinet (Sega
# Astro City, 1445 x 750 x 905 mm, a big 4:3 screen leaning well back, a rounded top, played sitting), the standard upright
# (1.73 x 0.61 x 0.84 m, 4:3), the vertical shooter (Galaga, 1942: the same monitor turned to 3:4 portrait) and a later deluxe
# (16:9 widescreen, a big lit topper). Sources: Arcade Otaku wiki (Astro City), Prime Time Amusements (upright), Betson
# (cocktail), ArcadeControls forum (mini); the vertical and deluxe sizes are estimates.
#   w, d   width along the corridor, depth          base, top   the lower body's top (hand height), the upper body's top
#   scr    screen width, height, centre height, tilt back from vertical in degrees (90: face up)
#   marq   marquee height (0: none)                 players, buttons   per cabinet, per player
TYPES = {
    'cocktail': dict(w=0.62, d=0.80, base=0.76, top=0.76, scr=(0.46, 0.345, 0.0, 90), marq=0, players=2, buttons=2),
    'cabaret': dict(w=0.58, d=0.66, base=0.92, top=1.58, scr=(0.36, 0.27, 1.27, 12), marq=0.14, players=1, buttons=3),
    'candy': dict(w=0.86, d=0.88, base=0.74, top=1.56, scr=(0.62, 0.465, 1.13, 24), marq=0.0, players=2, buttons=6),
    'upright': dict(w=0.80, d=0.84, base=1.0, top=1.95, scr=(0.56, 0.42, 1.40, 12), marq=0.24, players=2, buttons=3),
    'vertical': dict(w=0.70, d=0.82, base=1.0, top=2.06, scr=(0.42, 0.56, 1.47, 12), marq=0.22, players=1, buttons=2),
    'deluxe': dict(w=1.04, d=0.88, base=1.0, top=2.30, scr=(0.88, 0.495, 1.64, 6), marq=0.30, players=2, buttons=4),
}
CH1_TYPE = dict(w=0.86, d=0.75, base=1.0, top=1.95, scr=(SCR_W, SCR_H, SCR_Z, 0), marq=0.24, players=2, buttons=3)
BUTTON = [material('button%d' % i, hexc(h), emit=0.9) for i, h in enumerate(SCREEN_HUES + ['#f4f0e8'])]
M['metal'] = material('metal', hexc('#9a98a6'), rough=0.3)
M['coin'] = material('coin', hexc('#ff5a3c'), emit=4.0)
M['stool'] = material('stool', hexc('#7a2e3a'), rough=0.6)


def controls(P, R, w, players, buttons, s):
    """Joysticks and buttons on a control panel whose top centre is P and whose rotation is R (local z: the panel's normal,
    local x: the cabinet's depth, local y: along the corridor). Each player has a ball-top stick on a shaft and a base plate,
    then round buttons in a row (or two rows of three, the Japanese layout); round 2's two square buttons read as blocks."""
    at = lambda u, v, h=0.0: P + R @ Vector((u, v, h))
    span = w / players
    for p in range(players):
        vc = -w / 2 + span * (p + 0.5)
        stick = vc - span * 0.26
        HALL.box((0.075, 0.075, 0.006), at(0, stick, 0.003), M['trim'], rot=R)                   # base plate
        HALL.cyl(0.021, 0.004, at(0, stick, 0.006), M['trim'], rot=R)                            # dust washer
        HALL.cyl(0.0065, 0.075, at(0, stick, 0.006), M['metal'], rot=R, n=8)                     # shaft
        HALL.ball(0.021, at(0, stick, 0.098), random.choice(BUTTON[:6]))                         # ball top
        rows = 2 if buttons >= 6 else 1; per = buttons // rows
        hue = random.choice(BUTTON)
        for r in range(rows):
            for k in range(per):
                v = stick + 0.085 + k * 0.042 + r * 0.012                                        # rows offset, so they arc
                u = (s * 0.023 * (1 - 2 * r)) if rows == 2 else 0.0
                u += s * 0.006 * (1 - abs(k - (per - 1) / 2))                                     # a gentle arc in each row
                HALL.cyl(0.0195, 0.006, at(u, v, 0), M['trim'], rot=R)                            # bezel ring
                HALL.cyl(0.0152, 0.016, at(u, v, 0.004), hue if r == 0 or rows == 1 else BUTTON[(BUTTON.index(hue) + 1) % len(BUTTON)], rot=R)


def cabinet(side, y, ch1=False, kind=None):
    """One cabinet of a type in TYPES, box-modelled, its front facing the aisle. side -1 is left (x < 0). The Chapter 1
    cabinet keeps round 1's upright with its screen square-on, so the hold frames it the same and screen-rect stays put."""
    s = side; T = CH1_TYPE if ch1 else TYPES[kind]
    body = M['gold_body'] if ch1 else random.choice(M['body'])
    w, d, base, top, marq = T['w'], T['d'], T['base'], T['top'], T['marq']
    sw, sh, sz, tilt = T['scr']
    cx = s * (AISLE + d / 2)
    face = s * (AISLE + 0.2 * d)                                                 # the upper body's front plane
    rot = (math.pi / 2, 0, s * -math.pi / 2)                                    # vertical, facing the aisle
    R = Matrix.Rotation(s * -math.radians(tilt), 3, 'Y') @ Euler(rot).to_matrix()
    n = R @ Vector((0, 0, 1))                                                   # the screen's normal, toward the player
    screen_mat = CH1_SCREEN if ch1 else random.choice(SCREENS)
    scr = None
    if kind == 'cocktail':
        HALL.box((d, w, base), (cx, y, base / 2), body)
        HALL.box((d + 0.04, w + 0.04, 0.025), (cx, y, base + 0.0125), M['trim'])                # glass top and its rim
        HALL.quad((sw, sh), (cx, y, base + 0.027), R, screen_mat)
        for e in (-1, 1):                                                                       # a player at each end
            ey = y + e * (w / 2 + 0.07)
            HALL.box((0.30, 0.14, 0.07), (cx, ey, base - 0.06), M['panel'])
            Rp = Matrix.Rotation(e * 0.25, 3, 'X')
            controls(Vector((cx, ey, base - 0.025)), Rp @ Matrix.Rotation(math.pi / 2, 3, 'Z'), 0.30, 1, 2, s)
        HALL.box((0.02, 0.18, 0.22), (s * (AISLE - 0.005), y, 0.36), M['trim'])                 # coin door on the aisle side
        for dz in (-0.04, 0.04): HALL.box((0.012, 0.02, 0.04), (s * (AISLE - 0.016), y + dz, 0.4), M['coin'])
        return None
    HALL.box((d, w, base), (cx, y, base / 2), body)                                            # base
    cap = 0.2 if kind == 'candy' else 0.0                                       # the candy cabinet's rounded top, its radius
    HALL.box((d * 0.8, w, top - base - cap), (cx + s * d * 0.1, y, (base + top - cap) / 2), body)   # upper, set back
    if cap:
        HALL.box((d * 0.8 - cap, w, cap), (cx + s * (d * 0.1 + cap / 2), y, top - cap / 2), body)
        HALL.cyl(cap, w, (face + s * cap, y - w / 2, top - cap), body, rot=(-math.pi / 2, 0, 0), n=16)
    HALL.box((0.02, w + 0.01, 0.1), (s * (AISLE - 0.005), y, 0.05), M['trim'])                # kick plate
    door_z = min(0.42, base * 0.45)
    HALL.box((0.02, 0.22, 0.28), (s * (AISLE - 0.005), y, door_z), M['trim'])                 # coin door
    for dy in (-0.05, 0.05): HALL.box((0.012, 0.024, 0.045), (s * (AISLE - 0.016), y + dy, door_z + 0.06), M['coin'])
    # the screen: square-on for Chapter 1 (round 1's place), otherwise leaning back by its type's tilt, standing proud of the
    # body by enough that its top edge clears the front; a bezel slab behind it and a chin under it
    if ch1:
        c = Vector((s * (AISLE + d * 0.1 - 0.02) - s * 0.002, y, sz))
        scr = (c.copy(), Euler(rot))
    else:
        c = Vector((face - s * (0.03 + (sh / 2 + 0.05) * math.sin(math.radians(tilt))), y, sz))
    HALL.quad((sw, sh), c, R, screen_mat)
    HALL.box((sw + 0.1, sh + 0.1, 0.05), c - n * 0.027, M['trim'], rot=R)
    low = c - R @ Vector((0, sh / 2 + 0.05, 0))                                                # the bezel's bottom edge
    if low.z > base + 0.02:
        HALL.box((abs(face - low.x) + 0.02, w * 0.96, low.z - base), ((face + low.x) / 2, y, (base + low.z) / 2), body)
    # the top: a marquee housing over the screen (lit), or for the candy cabinet a rounded cap with a thin lit strip
    if kind == 'candy':
        a = math.radians(40)                                                    # a thin lit strip on the curve
        HALL.quad((w * 0.8, 0.07), (face + s * cap * (1 - math.cos(a)) - s * 0.004, y, top - cap + cap * math.sin(a)),
                  Matrix.Rotation(s * -a, 3, 'Y') @ Euler(rot).to_matrix(),
                  random.choice(MARQ))
        HALL.cyl(0.18, 0.48, (s * (AISLE - 0.5), y, 0), M['stool'], n=10)                    # the stool it is played from
    elif marq:
        hx = cx + s * d * 0.1 - s * 0.03
        HALL.box((d * 0.8 + 0.06, w + 0.06, marq), (hx, y, top + marq / 2 - 0.01), M['trim'])
        mx = (s * (AISLE + d * 0.1 - 0.02) - s * 0.002) if ch1 else hx - s * (d * 0.4 + 0.032)
        HALL.quad((w * 0.92, marq * 0.7), (mx, y, top + marq / 2 - 0.01), rot, M['gold'] if ch1 else random.choice(MARQ))
        for dy in (-1, 1):
            HALL.box((d + 0.02, 0.04, top + marq * 0.6), (cx, y + dy * (w / 2 + 0.01), (top + marq * 0.6) / 2), M['trim'])  # side rails
    # the control panel, sloped toward the player, with sticks and round buttons
    pd = 0.42 if kind == 'candy' else 0.36
    Rp = Euler((0, s * (-0.22 if kind == 'candy' else -0.35), 0)).to_matrix()
    pc = Vector((s * (AISLE + 0.06), y, base + 0.02))
    HALL.box((pd, w + 0.02, 0.09), pc, M['panel'], rot=Rp)
    controls(pc + Rp @ Vector((0, 0, 0.045)), Rp, w, T['players'], T['buttons'], s)
    if ch1:
        bpy.ops.object.text_add(location=(s * (AISLE + d * 0.1 - 0.02) - s * 0.01, y, 2.025), rotation=rot)
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
        s = cabinet(side, y, ch1=is1, kind=None if is1 else random.choice(list(TYPES)))
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
END_DIST = 1.3                                        # camera to screen at the hold (round 3, his note: the screen bigger in frame)
END_LIFT = 0.05                                       # camera a little above the screen centre
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
    if '--side' in ARGS:                                   # checking the cabinet types: square-on to the right wall
        cam.data.lens = 18; set_pose(Vector((-1.2, float(ARGS[ARGS.index('--side') + 1]), 1.4)), Vector((math.radians(84), 0, math.radians(-90))))
    elif shot == '1': set_pose(*shot1_pose(f))
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
