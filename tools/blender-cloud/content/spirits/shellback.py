"""The first spirit proof: the Shellback (the Protector's body family) in its five stages, in all five elements.

Stages (Wendell's board steers on sg-grows-into-shape and sg-holo-stages, 2026-10-14): a gas that solidifies into a
core, which projects a holographic ally into the world, which becomes a living creature, whose highest ally form is
humanoid. The gas, core and hologram are built from primitives; the living creature and highest ally form are
fused metaballs painted per vertex, after Wendell's "Taoist Tortoise" concept (2026-10-14: "too geometric"), and
each element gives them its own shell, growth, colours and aura (round 2, "dramatically stronger contrasts"). Round 3
gives every element the same lidded eye with only the iris colour changing, a lava crust in place of fire's spikes,
and ribbons of water in place of water's ring of drops. Round 5, after the players' look at round 3, gives the tortoise
the concept's face (a domed skull and a beak that overhangs the lower jaw, with a carved mouth seam in place of the
painted smile) and every base a smaller, deeper-set eye whose dark iris leaves almost no white. Round 7 adds the nation
layer (--nation meridia): the regional style of where the spirit was met, over the element's, on every stage.
Round 8 adds the Player's Romp family with its fox (--base fox), round 9 its otter (--base otter), round 10 its kid goat
(--base goat), all in the Romp's wanderer outfit when they stand.
Each stage is rendered with Cycles on the CPU and shrunk to a pixel sprite, so one model gives both assets (sg-assets-modular). Nothing is downloaded.

    /home/user/blenv/bin/python tools/blender-cloud/content/spirits/shellback.py OUT_DIR [--samples 32] [--size 512] [--heads] [--nation meridia]

Writes OUT_DIR/render/<element>-<stage>.png, OUT_DIR/sprite/<element>-<stage>.png (96 px, three alpha steps),
OUT_DIR/glb/<element>-<stage>.glb and OUT_DIR/report.json; --heads adds OUT_DIR/head/<element>-<stage>.png, a close-up
of the living creature's and highest ally form's head. The same arguments always give the same spirit.

Round 12 adds the satisfaction states (pass spirit-states 1, positions ss-markers, ss-feral-stance, ss-not-veiled):
--state dissatisfied|neutral|satisfied poses the same model and changes its materials, and --polarity veils (above 0)
or floods (below 0) it. The poses are the tortoise's; the material layer works on every base.
"""
import argparse, json, math, os, pathlib, random, sys

import bpy
from mathutils import Matrix, Quaternion, Vector, noise

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--samples", type=int, default=32)
ap.add_argument("--size", type=int, default=512)
ap.add_argument("--sprite", type=int, default=96)
ap.add_argument("--only", default="", help="element to build alone, for a quick look")
ap.add_argument("--stages", default="", help="comma-separated stages to build, for a quick look")
ap.add_argument("--base", default="tortoise", choices=["tortoise", "armadillo", "pangolin", "fox", "otter", "goat"],
                help="the animal base (round 4 adds the armadillo and the pangolin; round 8 the Player's Romp's fox, round 9 its otter, round 10 its kid goat)")
ap.add_argument("--heads", action="store_true", help="also render a close-up of the creature's and ally form's head")
ap.add_argument("--nation", default="", choices=["", "meridia"],
                help="the nation where it was met, which adds its regional style over the element's (round 7: Meridia)")
ap.add_argument("--state", default="neutral", choices=["dissatisfied", "neutral", "satisfied"],
                help="round 12 (ss-markers): the spirit's satisfaction state, a pose plus material settings on the same model")
ap.add_argument("--polarity", type=int, default=0,
                help="round 12 veil test (ss-not-veiled, ps-polarity): above 0 veils the spirit, below 0 floods it")
args = ap.parse_args(argv)
OUT = pathlib.Path(args.out)

# The game's element tokens (bars-engine src/lib/ui/card-tokens.ts), lifted for glow on a dark ground.
ELEMENTS = {
    "earth": ((0.91, 0.72, 0.29), (0.54, 0.29, 0.09)),
    "wood":  ((0.37, 0.82, 0.54), (0.18, 0.35, 0.24)),
    "fire":  ((0.94, 0.53, 0.29), (0.55, 0.16, 0.12)),
    "water": ((0.31, 0.75, 0.82), (0.10, 0.23, 0.36)),
    "metal": ((0.87, 0.90, 0.92), (0.43, 0.47, 0.53)),
}
STAGES = ["gas", "core", "hologram", "creature", "ascended"]
HEAD = {}  # where the last built head sits, for the --heads close-up
LEGS = {}  # round 11: the living creature's four leg chains as built (shoulder, elbow, wrist; hip, knee, ankle), for
           # the spirit rig (bars-engine #325); written into report.json with each creature


def lin(c):  # sRGB to linear, so the colours match the tokens
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


def reset(aim_z=0.35, ortho=3.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = args.samples
    sc.cycles.use_denoising = False
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = args.size
    sc.view_settings.view_transform = "Standard"
    w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.0
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    cam.data.type = "ORTHO"; cam.data.ortho_scale = ortho
    sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (3.4, -4.2, 2.6 + aim_z - 0.35)
    cam.rotation_euler = (Vector((0, 0, aim_z)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    return sc


def mat(name, color, strength, alpha, scan=False):
    """Principled emission with alpha, which glTF keeps. scan=True adds hologram scanlines in the render only."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*lin(color), 1)
    p.inputs["Emission Color"].default_value = (*lin(color), 1)
    p.inputs["Emission Strength"].default_value = strength
    p.inputs["Alpha"].default_value = alpha
    p.inputs["Roughness"].default_value = 0.35
    if scan:
        tc = nt.nodes.new("ShaderNodeTexCoord"); wv = nt.nodes.new("ShaderNodeTexWave")
        wv.bands_direction = "Z"; wv.inputs["Scale"].default_value = 4.0; wv.inputs["Distortion"].default_value = 0
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.55; ramp.color_ramp.elements[0].color = (alpha * 0.45,) * 3 + (1,)
        ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (min(1, alpha * 1.6),) * 3 + (1,)
        nt.links.new(tc.outputs["Object"], wv.inputs["Vector"])
        nt.links.new(wv.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], p.inputs["Alpha"])
    return m


def obj_from(op, name, m, **kw):
    op(**kw)
    o = bpy.context.active_object; o.name = name
    o.data.materials.append(m)
    for f in o.data.polygons: f.use_smooth = False
    return o


def gas(rng, lt, dk, n, spread, core_pull=0.0):
    """A drifting cloud of small motes, densest at the heart."""
    motes = [mat(f"mote{i}", lt if i % 3 else dk, 1.8 - i * 0.4, 0.55 - i * 0.12) for i in range(3)]
    for i in range(n):
        v = Vector((rng.gauss(0, spread), rng.gauss(0, spread), rng.gauss(0, spread * 0.8)))
        v *= (1 - core_pull)
        r = 0.035 + rng.random() * 0.07 * (1 - core_pull * 0.6)
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, f"mote{i}", motes[i % 3],
                 subdivisions=1, radius=r, location=(v.x, v.y, 0.35 + v.z))


def core(lt, at=(0, 0, 0.35), size=0.32):
    """The Shellback's core: a hexagonal bipyramid, the scute of a shell made solid."""
    gem = mat("core", lt, 2.4, 0.95)
    top = obj_from(bpy.ops.mesh.primitive_cone_add, "core_top", gem, vertices=6, radius1=size, depth=size * 1.1,
                   location=(at[0], at[1], at[2] + size * 0.55))
    bot = obj_from(bpy.ops.mesh.primitive_cone_add, "core_bot", gem, vertices=6, radius1=size, depth=size * 1.1,
                   location=(at[0], at[1], at[2] - size * 0.55), rotation=(math.pi, 0, 0))
    return top, bot


def hologram(lt, dk):
    """The projected body: a faceted tortoise of light, its hex shell traced in brighter edges."""
    skin = mat("holo", lt, 1.1, 0.32, scan=True)
    edge = mat("edge", lt, 2.2, 0.9)
    deep = mat("deep", lt, 0.9, 0.22, scan=True)
    shell = obj_from(bpy.ops.mesh.primitive_uv_sphere_add, "shell", skin, segments=8, ring_count=5, radius=1.0,
                     location=(0, 0, 0.32))
    shell.scale = (1.0, 0.82, 0.62)
    for v in shell.data.vertices:  # flatten the underside into a plastron
        if v.co.z < -0.15: v.co.z = -0.15
    wire = shell.copy(); wire.data = shell.data.copy(); wire.name = "shell_edges"
    bpy.context.scene.collection.objects.link(wire)
    wire.data.materials.clear(); wire.data.materials.append(edge)
    md = wire.modifiers.new("w", "WIREFRAME"); md.thickness = 0.022; md.use_replace = True
    wire.scale = shell.scale * 1.01
    obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "head", skin, subdivisions=1, radius=0.27, location=(1.12, 0, 0.42))
    bpy.context.active_object.scale = (1.2, 0.9, 0.85)
    for x, y in ((0.55, 0.55), (0.55, -0.55), (-0.55, 0.55), (-0.55, -0.55)):
        obj_from(bpy.ops.mesh.primitive_cylinder_add, "leg", deep, vertices=6, radius=0.14, depth=0.42,
                 location=(x, y, 0.0))
    obj_from(bpy.ops.mesh.primitive_cone_add, "tail", deep, vertices=5, radius1=0.12, depth=0.36,
             location=(-1.05, 0, 0.18), rotation=(0, -math.pi / 2, 0))
    eye = mat("eye", (1, 1, 1), 9.0, 1.0)
    for y in (0.13, -0.13):
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "eye", eye, subdivisions=1, radius=0.045,
                 location=(1.33, y, 0.5))
    ring = mat("ring", lt, 2.0, 0.7)
    obj_from(bpy.ops.mesh.primitive_torus_add, "projector", ring, major_radius=1.2, minor_radius=0.018,
             major_segments=48, minor_segments=4, location=(0, 0, -0.22))
    core(lt, at=(0, 0, 0.38), size=0.2)


def solid(name, color, rough=0.6, glow=0.0, metal=0.0, alpha=1.0):
    """An opaque material for the living stages; glow is for the core, trim and aura."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*lin(color), 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    p.inputs["Emission Color"].default_value = (*lin(color), 1)
    p.inputs["Emission Strength"].default_value = glow
    p.inputs["Alpha"].default_value = alpha
    return m


def mixc(a, b, t):
    return tuple(x * (1 - t) + y * t for x, y in zip(a, b))


def lights(sc):
    for name, loc, power in (("key", (3, -3, 5), 900), ("rim", (-3, 3, 3), 400), ("fill", (4, -1, 1), 250)):
        L = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
        L.data.energy = power; L.data.size = 3; L.location = loc
        L.rotation_euler = (Vector((0, 0, 0.6)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        sc.collection.objects.link(L)
    sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.45


# The living stages follow Wendell's concept art, "Taoist Tortoise - Young Adult Concept" (2026-10-14): a soft,
# rounded tortoise with a shell carrying a yin-yang and the eight trigrams, a long neck with big eyes, stout
# spotted legs, a shawl, prayer beads and tassels. The art is concept only (cs-chatgpt-ai-art); every piece is
# rebuilt here from fused metaballs and painted per vertex, so the GLB carries the same colours.
#
# Round 2 (Wendell, 2026-10-14 17:12: "dramatically stronger contrasts" between the elements): each element sets
# the shell's material and what grows from it, colours the skin, eyes and cloth, and adds an aura, because an aura
# alone is lost at the 96 px sprite. Seams that glow are their own material slot, so the GLB keeps the glow.
STYLE = {
    "wood": dict(shell=(0.50, 0.46, 0.34), shell_hi=(0.62, 0.58, 0.46), rough=0.8, metal=0.0, moss=True, seam=None,
                 plastron=(0.62, 0.55, 0.40), skin=(0.48, 0.55, 0.26), spot=(0.25, 0.31, 0.12), throat=(0.86, 0.82, 0.55),
                 cloth=(0.88, 0.85, 0.70), trim=(0.20, 0.45, 0.18), tassel=(0.66, 0.22, 0.12), bead=(0.40, 0.22, 0.10),
                 iris=(0.5, 0.3, 0.1), staff=((0.42, 0.28, 0.16), 0.7, 0.0),
                 growth="sapling", aura="leaves"),
    "fire": dict(shell=(0.09, 0.075, 0.075), shell_hi=(0.2, 0.15, 0.14), rough=0.5, metal=0.0, moss=False,
                 seam=((1.0, 0.32, 0.04), 5.0, 0.028), plastron=(0.3, 0.12, 0.08),
                 skin=(0.58, 0.2, 0.11), spot=(0.2, 0.06, 0.04), throat=(0.98, 0.7, 0.32),
                 cloth=(0.5, 0.07, 0.05), trim=(0.08, 0.06, 0.06), tassel=(1.0, 0.72, 0.2), bead=(0.07, 0.06, 0.06),
                 iris=(0.85, 0.32, 0.06), staff=((0.08, 0.07, 0.07), 0.3, 0.0),
                 growth="obsidian", aura="embers"),
    "water": dict(shell=(0.06, 0.36, 0.46), shell_hi=(0.18, 0.58, 0.64), rough=0.08, metal=0.0, moss=False,
                  seam=((0.78, 0.97, 1.0), 2.0, 0.018), plastron=(0.75, 0.88, 0.88),
                  skin=(0.28, 0.55, 0.64), spot=(0.1, 0.28, 0.42), throat=(0.86, 0.95, 0.94),
                  cloth=(0.1, 0.22, 0.48), trim=(0.88, 0.96, 0.98), tassel=(0.9, 0.97, 1.0), bead=(0.92, 0.9, 0.88),
                  iris=(0.1, 0.42, 0.9), staff=((0.62, 0.66, 0.66), 0.6, 0.0),
                  growth="shells", aura="streams"),
    "metal": dict(shell=(0.74, 0.76, 0.8), shell_hi=(0.95, 0.96, 0.98), rough=0.38, metal=0.7, moss=False,
                  seam=((1.0, 0.8, 0.42), 2.5, 0.016), plastron=(0.55, 0.57, 0.62),
                  skin=(0.5, 0.56, 0.65), spot=(0.28, 0.32, 0.42), throat=(0.88, 0.89, 0.92),
                  cloth=(0.94, 0.95, 0.97), trim=(0.24, 0.27, 0.34), tassel=(0.88, 0.7, 0.3), bead=(0.6, 0.62, 0.66),
                  iris=(0.3, 0.5, 0.75), staff=((0.75, 0.77, 0.8), 0.25, 1.0),
                  growth="plates", aura="rings"),
    "earth": dict(shell=(0.38, 0.34, 0.29), shell_hi=(0.55, 0.5, 0.42), rough=0.95, metal=0.0, moss=False,
                  seam=((1.0, 0.6, 0.1), 2.5, 0.02), plastron=(0.6, 0.48, 0.3),
                  skin=(0.76, 0.56, 0.3), spot=(0.42, 0.26, 0.12), throat=(0.94, 0.84, 0.6),
                  cloth=(0.62, 0.42, 0.18), trim=(0.26, 0.15, 0.07), tassel=(0.96, 0.68, 0.18), bead=(0.3, 0.2, 0.12),
                  iris=(0.78, 0.5, 0.1), staff=((0.42, 0.28, 0.16), 0.8, 0.0),
                  growth="crystals", aura="pebbles"),
}
MOSS = (0.36, 0.47, 0.18)
GOLD = (0.72, 0.56, 0.25)


def select_only(o):
    for x in bpy.context.view_layer.objects: x.select_set(False)
    bpy.context.view_layer.objects.active = o; o.select_set(True)


def apply_mods(o):
    select_only(o)
    for m in list(o.modifiers):
        with bpy.context.temp_override(object=o, active_object=o):
            bpy.ops.object.modifier_apply(modifier=m.name)


def smooth(o):
    for p in o.data.polygons: p.use_smooth = True


def vmat(name, rough=0.7, glow=0.0, metal=0.0):
    """A material that takes its colour from the mesh's painted colours (COLOR_0 in the GLB)."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    ca = nt.nodes.new("ShaderNodeVertexColor"); ca.layer_name = "Col"
    nt.links.new(ca.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if glow:
        nt.links.new(ca.outputs["Color"], p.inputs["Emission Color"])
        p.inputs["Emission Strength"].default_value = glow
    return m


def paint(o, fn):
    """Colour each vertex from its world position and normal."""
    me = o.data
    ca = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    me.color_attributes.active_color = ca
    mw = o.matrix_world; nm = mw.to_3x3()
    for v in me.vertices:
        c = fn(mw @ v.co, (nm @ v.normal).normalized())
        ca.data[v.index].color = (*lin(c), 1)


GROW = 1.3  # a lone metaball's surface sits inside its radius; this brings it back out


def blob(name, parts, res=0.03, faces=7000):
    """Metaballs fused into one smooth body. parts: ("ball", at, r), ("ell", at, r, (sx, sy, sz)), ("cap", a, b, r)."""
    mb = bpy.data.metaballs.new(name); mb.resolution = mb.render_resolution = res; mb.threshold = 0.6
    o = bpy.data.objects.new(name, mb); bpy.context.scene.collection.objects.link(o)
    for p in parts:
        if p[0] == "cap":
            a, b = Vector(p[1]), Vector(p[2])
            e = mb.elements.new(type="CAPSULE"); e.co = (a + b) / 2; e.radius = p[3] * GROW
            e.size_x = (b - a).length / 2; e.rotation = Vector((1, 0, 0)).rotation_difference(b - a)
        else:
            e = mb.elements.new(type="BALL" if p[0] == "ball" else "ELLIPSOID"); e.co = p[1]; e.radius = p[2] * GROW
            if p[0] == "ell": e.size_x, e.size_y, e.size_z = p[3]
    select_only(o)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.view_layer.objects.active; o.name = name
    if len(o.data.polygons) > faces:
        d = o.modifiers.new("d", "DECIMATE"); d.ratio = faces / len(o.data.polygons); apply_mods(o)
    smooth(o)
    return o


def skin_paint(body, seed, throat, S):
    """Skin in the element's colour with darker rounded spots and a pale throat; throat(p, n) says where the pale
    skin goes. The spots cover the nearest third of each cell, so their size holds whatever the noise's range."""
    cell = lambda p: noise.voronoi(p * 7.0 + Vector((seed, 0, 0)))[0][0]
    ds = sorted(cell(v.co) for v in body.data.vertices)
    lo, hi = ds[len(ds) // 6], ds[len(ds) // 3]

    def fn(p, n):
        d = cell(p)
        c = S["skin"]
        if d < hi: c = mixc(S["spot"], S["skin"], max(0, (d - lo) / (hi - lo)))
        t = throat(p, n)
        if t > 0: c = mixc(c, S["throat"], min(1, t))
        return mixc(c, (0.1, 0.1, 0.08), 0.12 * max(0, -n.z))  # a little darker underneath
    return fn


# The Shellback family's three animal bases (sg-body-from A: the urge picks the family, the family has two or three
# bases). Each base sets the shell's proportions and how it is divided: the tortoise's scutes, the armadillo's
# transverse bands between two shields, the pangolin's overlapping scales pointing back. Round 4 builds the second
# and third; the eye, element styling and aura are shared, so the base is the only thing that changes.
BASES = {
    "tortoise": dict(squash=(1.0, 0.86, 0.72), pattern="scutes"),
    "armadillo": dict(squash=(1.3, 0.8, 0.64), pattern="bands"),
    "pangolin": dict(squash=(1.36, 0.74, 0.62), pattern="scales"),
    "fox": dict(squash=(1.0, 1.0, 1.0), pattern="none", family="romp"),  # round 8: the Player's Romp, no shell
    "otter": dict(squash=(1.0, 1.0, 1.0), pattern="none", family="romp"),  # round 9: the Romp's second base
    "goat": dict(squash=(1.0, 1.0, 1.0), pattern="none", family="romp"),  # round 10: the Romp's third base, the kid goat
}
FAMILY = BASES[args.base].get("family", "shellback")
SHELL_SQUASH = Vector(BASES[args.base]["squash"])


def frac(x):
    return x - math.floor(x)


def bands_at(d):
    """The armadillo's shell: seven movable bands across the middle, a shield of small tiles before and behind them.
    Returns (seam, cell distance, cell id, bulge); seam is in the same units as the tortoise's voronoi seam."""
    x0, x1, n = -0.5, 0.45, 8
    if x0 < d.x < x1:
        u = (d.x - x0) / (x1 - x0) * n; i = int(u); f = u - i
        seam = 0.9 * min(f, 1 - f)
        side = int((math.atan2(d.z, d.y) + math.pi) / (math.pi / 4))
        return seam, abs(f - 0.5), ("b", i, side), 0.08 * f - 0.04  # each band rides up over the one behind it
    dist, pts = noise.voronoi(d * 9.0)
    seam = min(dist[1] - dist[0], 2.1 * min(abs(d.x - x0), abs(d.x - x1)) * 3)
    _, big = noise.voronoi(d * 3.0)
    return seam, dist[0] / 3, ("s",) + tuple(round(x, 2) for x in big[0]), 0.012 * noise.noise(d * 14)


def scales_at(d):
    """The pangolin's shell: rows of rounded scales pointing back, each row half a scale over from the last, the free
    edge of each scale lying over the base of the ones behind it. Returns what bands_at does."""
    R, A, lobe = 8, 5.0, 0.62
    u = (1 - d.x) * 0.5 * R; i = math.floor(u); fr = u - i
    phi = math.atan2(d.z, d.y)

    def col(row):
        s = phi / math.pi * A + 0.5 * (row % 2)
        return math.floor(s), frac(s) - 0.5

    jp, bp = col(i - 1)
    reach = lobe * (1 - 4 * bp * bp)  # how far the scale in front reaches back over this row
    if fr < reach:
        row, j, b, pos, length = i - 1, jp, bp, fr + 1, 1 + reach
        edge = reach - fr
    else:
        j, b = col(i)
        row, pos, length = i, fr, 1 + lobe * (1 - 4 * b * b)
        edge = fr - reach
    seam = 0.75 * min(edge, (0.5 - abs(b)) * 0.8) if row == i else 0.75 * edge
    return seam, abs(pos / length - 0.5), ("p", row, j), 0.1 * pos / length - 0.05


def on_shell(d, size, lift=1.0):
    """The point on the shell's dome in direction d, and its outward normal, in the shell's own frame."""
    d = Vector(d).normalized()
    p = Vector((d.x * SHELL_SQUASH.x, d.y * SHELL_SQUASH.y, d.z * SHELL_SQUASH.z)) * size * lift
    n = Vector((p.x / SHELL_SQUASH.x ** 2, p.y / SHELL_SQUASH.y ** 2, p.z / SHELL_SQUASH.z ** 2)).normalized()
    return p, n


def pin(o, host, at, up, spin=0.0):
    """Stand o on its host at `at` (host frame), its +z along `up`, turned by spin about that axis."""
    q = Vector((0, 0, 1)).rotation_difference(Vector(up).normalized()) @ Quaternion((0, 0, 1), spin)
    o.rotation_euler = q.to_euler(); o.location = at; o.parent = host
    return o


def shell_mesh(name, size, S):
    """A domed shell in its own frame (dome along +z), in its element's material: scutes with seams, which glow
    where the element burns or shines, and a flat plastron underneath. Returns the shell and the directions of the
    scute centres on the dome, for what grows from it."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=128, ring_count=64, radius=1.0)
    o = bpy.context.active_object; o.name = name
    g = S["growth"]
    pattern = BASES[args.base]["pattern"]
    cols, seams, centres, sums = [], [], {}, {}
    for v in o.data.vertices:
        d = v.co.normalized()
        if pattern == "scutes":
            dist, pts = noise.voronoi(d * 3.0)
            seam, cd, extra = dist[1] - dist[0], dist[0], 0.0
        else:
            seam, cd, cid, extra = (bands_at if pattern == "bands" else scales_at)(d)
            if d.z > 0.15: sums.setdefault(cid, Vector()); sums[cid] += d
        m = noise.noise(d * 4.5) + 0.35 * noise.noise(d * 11)
        moss = max(0.0, min(1.0, (m + 0.05) * 4)) if (S["moss"] and d.z > 0.35) else 0.0
        wave = math.sin(cd * 50)
        bulge = extra + (1.0 if pattern == "scutes" else 0.35) * {"obsidian": 0.055 * noise.noise(d * 9) + 0.025 * noise.noise(d * 23),
                 "shells": 0.008 * wave,
                 "plates": 0.045 * min(seam, 0.1) / 0.1 - 0.035,
                 "crystals": 0.05 * noise.noise(d * 6) + 0.022 * noise.noise(d * 17)}.get(g, 0.035 * moss)
        f = 1 + 0.035 * min(seam, 0.35) - (0.03 * (1 - seam / 0.09) if seam < 0.09 else 0) + bulge
        p = Vector((d.x * SHELL_SQUASH.x, d.y * SHELL_SQUASH.y, d.z * SHELL_SQUASH.z)) * size * f
        p.z = max(p.z, -0.1 * size)
        v.co = p
        c = mixc(S["shell"], S["shell_hi"], max(0, min(1, 0.5 * noise.noise(d * 7) + 0.4)))
        if g == "shells" and wave > 0.55: c = mixc(c, (0.75, 0.95, 0.97), 0.5)  # wave-carved bands on each scute
        if g == "plates": c = mixc(c, S["shell_hi"], max(0, 1 - cd / 0.35) * 0.6)  # a polished boss per plate
        if seam < 0.14 and not S["seam"]: c = mixc((0.12, 0.1, 0.07), c, (seam / 0.14) ** 1.5)
        if pattern != "scutes":  # each band or scale light at its raised free edge and shaded where it tucks under
            t = max(0.0, min(1.0, 0.5 + extra / (0.08 if pattern == "bands" else 0.1)))
            c = mixc(mixc(c, (0, 0, 0), 0.45 * (1 - t)), S["shell_hi"], 0.5 * t * t)
        if moss: c = mixc(c, mixc(MOSS, (0.5, 0.58, 0.22), 0.5 + 0.5 * noise.noise(d * 20)), moss)
        if p.z < -0.08 * size: c = S["plastron"]
        cols.append(c); seams.append(seam if p.z > -0.08 * size else 1.0)
        if pattern == "scutes" and d.z > 0.15: centres.setdefault(tuple(round(x, 3) for x in pts[0]), Vector(pts[0]).normalized())
    for k, v in sorted(sums.items(), key=lambda kv: str(kv[0])): centres[k] = v.normalized()
    ca = o.data.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, c in enumerate(cols): ca.data[i].color = (*lin(c), 1)
    o.data.materials.append(vmat("shell", S["rough"], metal=S["metal"])); smooth(o)
    if S["seam"]:
        col, strength, thr = S["seam"]
        o.data.materials.append(solid("seam", col, 0.4, strength))
        for poly in o.data.polygons:
            if sum(seams[i] for i in poly.vertices) / len(poly.vertices) < thr: poly.material_index = 1
    return o, [c for c in centres.values() if c.z > 0.2]


def leaves(rng, host, n, size, colors=((0.33, 0.52, 0.18), (0.45, 0.6, 0.2)), flowers=True):
    """Small leaves and a few white flowers growing out of the shell's crown, parented to the shell."""
    greens = [solid(f"leaf{i}", c, 0.7) for i, c in enumerate(colors)]
    petal = solid("petal", (0.95, 0.93, 0.86), 0.6); heart = solid("heart", (0.9, 0.7, 0.2), 0.6)
    verts = [v for v in host.data.vertices if v.co.z > 0.45 * size * 0.72]
    for i in range(n):
        v = verts[rng.randrange(len(verts))]
        if flowers and i % 6 == 5:
            for k in range(5):
                a = k * 2 * math.pi / 5
                bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.035,
                    location=v.co + v.normal * 0.02 + Vector((math.cos(a), math.sin(a), 0)) * 0.035)
                q = bpy.context.active_object; q.scale = (1.3, 0.8, 0.35); q.data.materials.append(petal)
                q.rotation_euler = (0, 0, a); q.parent = host; smooth(q)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.02, location=v.co + v.normal * 0.03)
            q = bpy.context.active_object; q.data.materials.append(heart); q.parent = host
        else:
            bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.06, location=v.co + v.normal * 0.02)
            q = bpy.context.active_object; q.scale = (1.5, 0.7, 0.18); q.data.materials.append(greens[i % 2])
            q.rotation_euler = (rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), rng.uniform(0, 6.3))
            q.parent = host; smooth(q)


def tube(name, pts, r, m):
    """A round tube along points, as a mesh."""
    cu = bpy.data.curves.new(name, "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = r; cu.bevel_resolution = 3
    sp = cu.splines.new("POLY"); sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts): sp.points[i].co = (*p, 1)
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o)
    select_only(o); bpy.ops.object.convert(target="MESH")
    o = bpy.context.view_layer.objects.active; o.data.materials.append(m); smooth(o)
    return o


def sapling(rng, host, size, lt):
    """Wood: a young tree growing from the crown of the shell, and vines trailing down its sides."""
    bark, vine = solid("bark", (0.36, 0.24, 0.13), 0.85), solid("vine", (0.22, 0.4, 0.14), 0.7)
    top, _ = on_shell((0, 0, 1), size)
    pts = [top + Vector((0.04 * math.sin(k), 0.02 * k, 0.0)) * size + Vector((0, 0, 0.13 * k * size)) for k in range(6)]
    tube("trunk", pts, 0.045 * size, bark).parent = host
    for a, k in ((0.6, 3), (2.6, 4), (4.4, 3)):  # three branches
        b0 = pts[k]; b1 = b0 + Vector((math.cos(a) * 0.22, math.sin(a) * 0.22, 0.15)) * size
        tube("branch", [b0, (b0 + b1) / 2 + Vector((0, 0, 0.04 * size)), b1], 0.022 * size, bark).parent = host
    canopy = [solid("canopy", c, 0.75, 0.15) for c in ((0.28, 0.6, 0.2), (0.42, 0.72, 0.26), (0.2, 0.46, 0.16))]
    for i in range(16):
        c = pts[-1] + Vector((rng.gauss(0, 0.2), rng.gauss(0, 0.2), rng.gauss(0.02, 0.1))) * size
        o = ball("leafclump", canopy[i % 3], c, rng.uniform(0.08, 0.13) * size, (1.2, 1.0, 0.8), 12); o.parent = host
    for a in (-1.0, -0.2, 0.6, 2.4, 3.4):  # vines from the crown down the flanks, leafing as they go
        path = [on_shell((math.sin(t) * math.cos(a + 0.4 * t), math.sin(t) * math.sin(a + 0.4 * t), math.cos(t)), size, 1.03)[0]
                for t in [0.25 + 0.16 * k for k in range(9)]]
        tube("vine", path, 0.016 * size, vine).parent = host
        for p in path[1::2]:
            q = ball("vineleaf", canopy[1], p, 0.05 * size, (1.6, 0.7, 0.2), 8); q.parent = host
            q.rotation_euler = (rng.uniform(-0.8, 0.8), rng.uniform(-0.8, 0.8), rng.uniform(0, 6.3))


def flame(name, at, up, h, cols):
    """A small flame: a teardrop drawn up into a tip and bent a little, a pale heart inside a see-through skin."""
    up = Vector(up).normalized(); out = []
    for k, (col, alpha, s) in enumerate(cols):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=h * 0.28 * s)
        o = bpy.context.active_object; o.name = name
        for v in o.data.vertices:
            t = max(0.0, v.co.z / (h * 0.28 * s))
            v.co.x *= 1 - 0.85 * t; v.co.y *= 1 - 0.85 * t
            v.co.z *= 1 + 2.6 * t
            v.co.x += 0.25 * h * t * t  # the tip leans
        o.data.materials.append(solid(name, col, 0.5, 6.0 - 2 * k, alpha=alpha)); smooth(o)
        o.rotation_euler = Vector((0, 0, 1)).rotation_difference(up).to_euler(); o.location = at
        out.append(o)
    return out


def lava_crust(rng, host, centres, size):
    """Fire (round 3, Wendell: the spikes "don't look very natural"): cooled lava swelling up out of the seams as low
    rounded basalt ridges and blisters, fused like the body and split by glowing cracks, with a few small flames
    rising from the hottest seams. Nothing has a straight side."""
    top = sorted(centres, key=lambda c: -c.z)[:12 if args.base == "tortoise" else 6]  # fewer, so bands and scales show
    parts = []
    for i, c in enumerate(top):
        at, n = on_shell(c, size, 0.95)
        parts.append(("ball", tuple(at), size * rng.uniform(0.11, 0.16)))
        near = min((d for d in top if d is not c), key=lambda d: (d - c).length)
        b, _ = on_shell(near, size, 0.94)
        parts.append(("cap", tuple(at), tuple(at + (b - at) * 0.6), size * 0.07))  # a ridge running toward its neighbour
        for _ in range(2):  # smaller blisters beside it
            j = (c + Vector((rng.gauss(0, 0.18), rng.gauss(0, 0.18), rng.gauss(0, 0.08)))).normalized()
            parts.append(("ball", tuple(on_shell(j, size, 0.96)[0]), size * rng.uniform(0.05, 0.08)))
    crust = blob("crust", parts, 0.012 * size / 0.6, 6000)
    crust.parent = host
    rock = solid("basalt", (0.07, 0.06, 0.06), 0.55)
    crack = solid("crack", (1.0, 0.36, 0.05), 0.4, 6.0)
    crust.data.materials.append(rock); crust.data.materials.append(crack)
    for poly in crust.data.polygons:
        p = poly.center
        dist, _ = noise.voronoi(p * (9.0 / size))
        if dist[1] - dist[0] < 0.06: poly.material_index = 1
    bpy.context.view_layer.update()
    up = (host.matrix_world.inverted().to_3x3() @ Vector((0, 0, 1))).normalized()
    hot = (((1.0, 0.8, 0.35), 0.8, 0.45), ((1.0, 0.4, 0.06), 0.4, 1.0))
    for c in top[1:12:4] if args.base == "tortoise" else top[0:6:2]:  # three, spread over the crown
        at, n = on_shell(c, size, 1.06)
        h = size * rng.uniform(0.13, 0.19)
        for o in flame("wisp", at + up * h * 0.25, (up * 2 + n).normalized(), h, hot): o.parent = host


def growth(rng, host, centres, size, S, lt, upright=True):
    """What the element grows from the shell's crown."""
    g = S["growth"]
    rng.shuffle(centres)
    if g == "sapling":
        leaves(rng, host, int(34 * size), size, ((0.3, 0.55, 0.16), (0.48, 0.68, 0.2)))
        if upright: sapling(rng, host, size, lt)
        else:
            vine = solid("vine", (0.22, 0.4, 0.14), 0.7); green = solid("canopy", (0.36, 0.66, 0.22), 0.75, 0.15)
            for a in (-1.2, -0.3, 0.6, 1.5, 2.6, 3.6):
                path = [on_shell((math.sin(t) * math.cos(a), math.sin(t) * math.sin(a), math.cos(t)), size, 1.03)[0]
                        for t in [0.1 + 0.18 * k for k in range(8)]]
                tube("vine", path, 0.02 * size, vine).parent = host
                for p in path[1::2]:
                    q = ball("vineleaf", green, p, 0.06 * size, (1.6, 0.7, 0.2), 8); q.parent = host
                    q.rotation_euler = (rng.uniform(-0.8, 0.8), rng.uniform(-0.8, 0.8), rng.uniform(0, 6.3))
    elif g == "obsidian": lava_crust(rng, host, centres, size)
    elif g == "shells":  # small seashells, pearls and water beading on the crown
        conch, pearl = solid("conch", (0.96, 0.82, 0.74), 0.3), solid("pearl", (0.95, 0.95, 0.97), 0.12, 0.3)
        drop = solid("droplet", (0.7, 0.93, 1.0), 0.02, 0.6, alpha=0.7)
        for i, c in enumerate(sorted(centres, key=lambda c: -c.z)[:8]):
            at, n = on_shell(c, size, 0.99)
            if i % 3 == 2:
                ball("pearl", pearl, at + n * 0.03 * size, 0.05 * size, seg=12).parent = host; continue
            bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.07 * size, radius2=0.0, depth=0.17 * size)
            o = bpy.context.active_object; o.data.materials.append(conch); smooth(o)
            tw = o.modifiers.new("t", "SIMPLE_DEFORM"); tw.deform_method = "TWIST"; tw.angle = 2.5; apply_mods(o)
            side = n.cross(Vector((0, 0, 1)) if abs(n.z) < 0.9 else Vector((1, 0, 0))).normalized()
            pin(o, host, at + n * 0.04 * size, side + n * 0.4, rng.uniform(0, 6.3))
        verts = [v for v in host.data.vertices if v.co.z > 0.3 * size * 0.72]
        for _ in range(26):
            v = verts[rng.randrange(len(verts))]
            ball("bead", drop, v.co + v.normal * 0.015 * size, rng.uniform(0.018, 0.034) * size, (1, 1, 0.7), 10).parent = host
    elif g == "plates":  # a rivet at the heart of every plate and a crest of blades along the spine
        rivet, blade = solid("rivet", GOLD, 0.25, 0.4, 1.0), solid("blade", (0.86, 0.88, 0.92), 0.15, 0.6, 1.0)
        for c in centres:
            at, n = on_shell(c, size, 1.03)
            ball("rivet", rivet, at, 0.032 * size, seg=10).parent = host
        for t in (-0.75, -0.38, 0.0, 0.38, 0.75):
            at, n = on_shell((math.sin(t), 0, math.cos(t)), size, 0.98)
            h = (0.24 - 0.1 * abs(t)) * size
            bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.16 * size, depth=h)
            o = bpy.context.active_object; o.scale = (1.0, 0.12, 1.0); o.data.materials.append(blade)
            pin(o, host, at + n * h * 0.45, n, t * 0.3)
    elif g == "crystals":  # amber crystal clusters breaking out of the stone
        amber = solid("amber", (1.0, 0.62, 0.12), 0.12, 3.5)
        for c in sorted(centres, key=lambda c: -c.z)[:7]:
            at, n = on_shell(c, size, 0.97)
            for k in range(rng.randint(3, 5)):
                h, r = size * rng.uniform(0.12, 0.34), size * rng.uniform(0.03, 0.055)
                tilt = (n + Vector((rng.gauss(0, 0.35), rng.gauss(0, 0.35), rng.gauss(0, 0.2)))).normalized()
                bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=r, depth=h)
                o = bpy.context.active_object; o.data.materials.append(amber); pin(o, host, at + tilt * h * 0.45, tilt)
                bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r, depth=r * 1.8)
                o = bpy.context.active_object; o.data.materials.append(amber); pin(o, host, at + tilt * (h * 0.95 + r * 0.9), tilt)


def ribbon(name, rng, centre, radii, z0, z1, phase, turns, width=0.05, n=120):
    """A thin strand of water spiralling up round the body: a flat ribbon that swells in the middle and thins to
    nothing at both ends, turning over as it climbs, nearly clear with a brighter edge on each side."""
    across = (-1.0, -0.88, 0.0, 0.88, 1.0)
    verts, faces = [], []
    wob = rng.uniform(0, 6.3)
    for i in range(n + 1):
        t = i / n
        a = phase + t * turns * 2 * math.pi
        p = Vector((centre[0] + math.cos(a) * radii[0] * (1 + 0.08 * math.sin(3 * a + wob)),
                    centre[1] + math.sin(a) * radii[1] * (1 + 0.08 * math.sin(3 * a + wob)),
                    z0 + (z1 - z0) * t + 0.06 * math.sin(5 * t * math.pi + wob)))
        radial = Vector((math.cos(a), math.sin(a), 0))
        tw = 0.7 * math.sin(2 * math.pi * t * 1.5 + wob)  # the ribbon turns over as it climbs
        w = width * math.sin(math.pi * t) ** 0.7
        d = Vector((0, 0, 1)) * math.cos(tw) + radial * math.sin(tw)
        for u in across: verts.append(tuple(p + d * u * w))
    m = len(across)
    for i in range(n):
        for j in range(m - 1): faces.append((i * m + j, i * m + j + 1, (i + 1) * m + j + 1, (i + 1) * m + j))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    body = solid("stream", (0.62, 0.92, 1.0), 0.05, 0.8, alpha=0.2)
    edge = solid("streamedge", (0.8, 0.97, 1.0), 0.05, 2.0, alpha=0.6)
    for x in (body, edge): x.use_backface_culling = False; me.materials.append(x)
    for f in me.polygons:
        if (f.index % (m - 1)) in (0, m - 2): f.material_index = 1
    smooth(o)
    return o


def aura(rng, kind, lt, centre, radii, top):
    """The element's aura around the spirit: a glowing pool at its feet and the element moving in the air.
    centre and radii bound the body; top is the height of the head."""
    cx, cy, cz = centre; rx, ry, rz = radii
    for k, (s, a) in enumerate(((1.0, 0.32), (1.18, 0.2), (1.38, 0.1))):  # the pool, brightest under the body
        bpy.ops.mesh.primitive_circle_add(vertices=64, radius=1.0, fill_type="NGON", location=(cx, cy, 0.004 + 0.002 * k))
        o = bpy.context.active_object; o.scale = (rx * s, ry * s, 1); o.data.materials.append(solid("pool", lt, 0.5, 2.0, alpha=a))
    if kind == "embers":
        hot = [solid(f"ember{i}", c, 0.5, 8.0) for i, c in enumerate(((1.0, 0.86, 0.4), (1.0, 0.55, 0.12), (0.9, 0.22, 0.05)))]
        for _ in range(80):
            u = rng.random() ** 0.8
            z = 0.1 + u * (top + 0.5)
            spread = 1.15 - 0.5 * u
            p = (cx + rng.gauss(0, rx * 0.5 * spread), cy + rng.gauss(0, ry * 0.5 * spread), z)
            ball("ember", hot[min(2, int(u * 3))], p, (0.045 - 0.028 * u) * rng.uniform(0.6, 1.2), (1, 1, 1.6), 8)
    elif kind == "streams":  # round 3 (Wendell: strands of lightweight water, not spilled drops)
        for k in range(2):
            ribbon(f"stream{k}", rng, (cx, cy), (rx * (1.05 + 0.12 * k), ry * (1.05 + 0.12 * k)),
                   0.12 + 0.15 * k, top * (0.8 + 0.15 * k), k * math.pi, 0.75 + 0.15 * k)
        for k, (s, a) in enumerate(((1.05, 0.95), (1.4, 0.6), (1.8, 0.3))):  # ripples spreading from the feet
            bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.012, major_segments=64, minor_segments=6,
                                             location=(cx, cy, 0.012))
            o = bpy.context.active_object; o.scale = (rx * s * 0.8, ry * s * 0.8, 1)
            o.data.materials.append(solid("ripple", (0.7, 0.95, 1.0), 0.2, 3.0, alpha=a))
    elif kind == "leaves":
        greens = [solid(f"drift{i}", c, 0.7, 0.4) for i, c in enumerate(((0.32, 0.68, 0.2), (0.55, 0.8, 0.25), (0.82, 0.78, 0.3)))]
        for k in range(30):  # leaves drifting up in a spiral
            t = k / 30
            a = k * 2.4
            r = 1.05 + 0.25 * rng.random()
            p = (cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r, 0.12 + t * (top + 0.2))
            o = ball("drift", greens[k % 3], p, 0.06, (1.7, 0.75, 0.15), 8)
            o.rotation_euler = (rng.uniform(-1, 1), rng.uniform(-1, 1), a)
        petal = solid("petal", (0.98, 0.92, 0.9), 0.6, 0.3)
        for _ in range(8):
            p = (cx + rng.gauss(0, rx * 0.7), cy + rng.gauss(0, ry * 0.7), rng.uniform(0.3, top))
            ball("petal", petal, p, 0.03, (1.3, 0.8, 0.3), 8).rotation_euler = (rng.uniform(-1, 1), rng.uniform(-1, 1), 0)
    elif kind == "rings":
        ring = solid("ring", (0.92, 0.94, 0.98), 0.15, 3.0, 1.0)
        gold = solid("goldring", (1.0, 0.8, 0.42), 0.2, 2.5, 1.0)
        shard = solid("shard", (0.85, 0.88, 0.95), 0.1, 1.5, 1.0)
        for m, s, tilt in ((ring, 1.15, (0.35, 0.18, 0)), (gold, 1.35, (-0.28, 0.42, 0.6))):
            bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.014, major_segments=96, minor_segments=6,
                                             location=(cx, cy, cz), rotation=tilt)
            o = bpy.context.active_object; o.scale = (rx * s, ry * s, rx * s); o.data.materials.append(m)
        for k in range(12):  # shards orbiting on the inner ring
            a = k * 2 * math.pi / 12 + 0.2
            p = Matrix.Rotation(0.35, 3, "X") @ Matrix.Rotation(0.18, 3, "Y") @ Vector((math.cos(a) * rx * 1.15, math.sin(a) * ry * 1.15, 0))
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=0, radius=0.05, location=(cx + p.x, cy + p.y, cz + p.z))
            o = bpy.context.active_object; o.scale = (0.5, 0.5, 1.6); o.data.materials.append(shard)
            o.rotation_euler = (rng.uniform(0, 3), rng.uniform(0, 3), a)
    elif kind == "pebbles":
        stone = solid("pebble", (0.46, 0.4, 0.34), 0.95)
        amber = solid("speck", (1.0, 0.65, 0.15), 0.2, 4.0)
        dust = solid("dust", (0.85, 0.72, 0.5), 0.9, 0.6, alpha=0.6)
        for k in range(14):  # stones lifted into the air around it
            a = k * 2 * math.pi / 14 + rng.uniform(-0.2, 0.2)
            p = (cx + math.cos(a) * rx * rng.uniform(1.0, 1.3), cy + math.sin(a) * ry * rng.uniform(1.0, 1.3),
                 rng.uniform(0.15, cz + rz * 0.9))
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=rng.uniform(0.04, 0.1), location=p)
            o = bpy.context.active_object; o.data.materials.append(stone)
            for v in o.data.vertices: v.co *= 1 + 0.25 * noise.noise(v.co * 20 + Vector((k, 0, 0)))
            o.rotation_euler = (rng.uniform(0, 3), rng.uniform(0, 3), 0)
        for _ in range(10):
            p = (cx + rng.gauss(0, rx * 0.8), cy + rng.gauss(0, ry * 0.8), rng.uniform(0.2, top))
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=0, radius=0.035, location=p)
            bpy.context.active_object.data.materials.append(amber)
        for _ in range(40):
            p = (cx + rng.gauss(0, rx * 0.8), cy + rng.gauss(0, ry * 0.8), rng.uniform(0.02, 0.45) ** 1.5)
            ball("dust", dust, p, rng.uniform(0.01, 0.022), seg=6)


TRIGRAMS = ("111", "110", "101", "100", "011", "010", "001", "000")


def taiji(x, y):
    """True where the emblem glows: the light half of the yin-yang, its rim and the eight trigrams around it."""
    r = math.hypot(x, y)
    if r < 0.46:
        qx, qy = x / 0.46, y / 0.46
        up, dn = math.hypot(qx, qy - 0.5), math.hypot(qx, qy + 0.5)
        if up < 0.14: return False
        if dn < 0.14: return True
        if up < 0.5: return True
        if dn < 0.5: return False
        return qx > 0
    if r < 0.5: return True
    th = math.atan2(y, x); k = round(th / (math.pi / 4)); off = th - k * math.pi / 4
    t = r * math.sin(off)
    if abs(t) > 0.15: return False
    for j, (r0, r1) in enumerate(((0.6, 0.68), (0.74, 0.82), (0.88, 0.96))):
        if r0 < r < r1: return TRIGRAMS[k % 8][j] == "1" or abs(t) > 0.035
    return False


def emblem(name, radius, lt, glow=2.2, subdiv=64):
    """The spirit's core grown into its body: a glowing yin-yang ringed by the eight trigrams, flat in its own frame."""
    import bmesh
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=subdiv, y_subdivisions=subdiv, size=2 * radius)
    g = bpy.context.active_object; g.name = name
    bm = bmesh.new(); bm.from_mesh(g.data)
    gone = [f for f in bm.faces if not taiji(*(f.calc_center_median().xy / radius))]
    bmesh.ops.delete(bm, geom=gone, context="FACES")
    bm.to_mesh(g.data); bm.free()
    ca = g.data.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i in range(len(g.data.vertices)): ca.data[i].color = (*lin(lt), 1)
    g.data.materials.append(vmat("core", 0.3, glow))
    return g


def wrap_onto(o, target, offset=0.012):
    m = o.modifiers.new("w", "SHRINKWRAP"); m.target = target; m.wrap_method = "NEAREST_SURFACEPOINT"; m.offset = offset
    apply_mods(o)


def drape(name, top, down, r_top, r_bot, length, base, trim, seed, sides=1.0):
    """Cloth hanging from a ring: a shawl or robe with soft folds and a hem in a second colour."""
    rng = random.Random(seed)
    S, R = 72, 16
    ph = [rng.uniform(0, 6.3) for _ in range(3)]
    verts, faces, cols = [], [], []
    for j in range(R + 1):
        t = j / R
        for i in range(S):
            a = i * 2 * math.pi / S
            fold = 0.035 * t * (math.sin(9 * a + ph[0]) + 0.5 * math.sin(14 * a + ph[1]))
            L = length * (1 + 0.18 * sides * math.cos(2 * a) + 0.06 * math.sin(3 * a + ph[2]))
            r = r_top + (r_bot - r_top) * t ** 0.8 + fold
            verts.append((r * math.cos(a), r * math.sin(a), -t * L))
            hem = t > 0.74
            band = 0.83 < t < 0.88
            cols.append(mixc(base, mixc(base, (0, 0, 0), 0.4), 0.3 * t) if not hem else (mixc(base, trim, 0.3) if band else trim))
    for j in range(R):
        for i in range(S):
            a, b = j * S + i, j * S + (i + 1) % S
            faces.append((a, b, b + S, a + S))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    ca = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, c in enumerate(cols): ca.data[i].color = (*lin(c), 1)
    m = vmat("cloth", 0.95); m.use_backface_culling = False; me.materials.append(m)
    o.location = top
    o.rotation_euler = Vector((0, 0, -1)).rotation_difference(Vector(down).normalized()).to_euler()
    s = o.modifiers.new("s", "SOLIDIFY"); s.thickness = 0.018
    apply_mods(o); smooth(o)
    return o


def ball(name, m, at, r, scale=(1, 1, 1), seg=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=seg // 2, radius=r, location=at)
    o = bpy.context.active_object; o.name = name; o.scale = scale; o.data.materials.append(m); smooth(o)
    return o


def jade_of(lt):
    return solid("jade", mixc(lt, (0.75, 0.85, 0.78), 0.45), 0.25, 0.25)


def beads(center, axis, radius, n, droop, jade_at, lt, S):
    """A string of prayer beads round the neck, one jade bead in the element's colour with a knot and a tassel."""
    axis = Vector(axis).normalized()
    u = axis.cross(Vector((0, 0, 1))) if abs(axis.z) < 0.95 else Vector((0, 1, 0))
    u.normalize(); v = axis.cross(u).normalized()
    bm, jm = solid("bead", S["bead"], 0.3, metal=S["metal"]), jade_of(lt)
    for k in range(n):
        a = k * 2 * math.pi / n
        p = Vector(center) + radius * (math.cos(a) * u + math.sin(a) * v)
        p.z -= droop * max(0, math.sin(a)) ** 2
        jade = k == jade_at
        ball("bead", jm if jade else bm, p, 0.085 if jade else 0.062, seg=10)
        if jade: tassel(p - Vector((0, 0, 0.09)), S["tassel"], 0.75)


def tassel(at, col, s=1.0):
    gold, red = solid("gold", GOLD, 0.35), solid("tassel", col, 0.9)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.035 * s, minor_radius=0.011 * s, major_segments=12, minor_segments=5,
                                     location=at, rotation=(math.pi / 2, 0, 0))
    bpy.context.active_object.data.materials.append(gold)
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.055 * s, radius2=0.014 * s, depth=0.24 * s,
                                    location=Vector(at) - Vector((0, 0, 0.15 * s)))
    o = bpy.context.active_object; o.data.materials.append(red); smooth(o)


def eye(body, toward, out, S, r=0.06, bar=False, iris=None):
    """One eye for every element (round 3, Wendell: "the same eyes but with different eye color"): a ball sunk deep
    into the head where a ray from outside meets it, so only a sliver of its front shows, under a heavy upper lid and a
    thin lower lid in the skin's colour. Round 5, after the players' look ("the big eyes are too Disney like"): the eye
    is smaller and set deeper, and a dark iris, tinted by the element, fills nearly all of what shows, the way a
    tortoise's does, so almost no white is left. The pupil stays black and the catchlight white. Round 10: bar=True draws a
    goat's pupil, a level bar across the iris, and iris sets the iris's own colour (the kid's amber)."""
    out = Vector(out).normalized()
    hit, loc, _, _ = body.ray_cast(Vector(toward) + out * 2, -out)
    at = (loc if hit else Vector(toward)) - out * r * 0.72
    gaze = (out + Vector((0.55, 0, -0.05))).normalized()  # a little forward of straight out, so it looks ahead
    up = (Vector((0, 0, 1)) - out * out.z).normalized()
    side = up.cross(out).normalized()
    frame = Matrix((out, side, up)).transposed()  # local x along out, z up
    eb = ball("eyeball", vmat("eye", 0.25), at, r, seg=48)
    iris = iris or mixc(S["iris"], (0.24, 0.14, 0.06), 0.5)  # a tortoise's brown, tinted by the element
    gu = (up - gaze * gaze.dot(up)).normalized(); gs = gaze.cross(gu)  # level and upright across the iris
    dark = mixc(iris, (0, 0, 0), 0.6)

    def look(p, n):  # painted on the ball, so the iris sits flush instead of bulging out of it
        c = (p - at).normalized().dot(gaze)
        d = (p - at).normalized()
        if bar and c > 0.5 and abs(d.dot(gu)) < 0.1 and abs(d.dot(gs)) < 0.4: return (0.02, 0.02, 0.02)  # a goat's bar
        if not bar and c > 0.9: return (0.02, 0.02, 0.02)  # pupil
        if c > 0.45: return mixc(iris, dark, (0.9 - c) / 0.45 * 0.7) if c > 0.52 else dark  # iris, darker at its rim
        return (0.62, 0.56, 0.44)  # what little white shows is shadowed and yellowed
    bpy.context.view_layer.update(); paint(eb, look)
    up_lid, low_lid, glint_c, glint_r, glint_g = EYE[look_state()]
    ball("glint", solid("glint", glint_c, 0.1, glint_g), at + (gaze + up * 0.1 + side * 0.12).normalized() * r, r * glint_r)
    lid = solid("lid", mixc(S["skin"], S["spot"], 0.25), 0.7)
    for name, keep, s_ in (("lid_upper", lambda v: v.z > up_lid and v.x > -0.35, 1.12), ("lid_lower", lambda v: v.z < low_lid and v.x > -0.2, 1.08)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=r * s_)
        o = bpy.context.active_object; o.name = name
        import bmesh
        bm = bmesh.new(); bm.from_mesh(o.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep(v.co / (r * s_))], context="VERTS")
        bm.to_mesh(o.data); bm.free()
        sd = o.modifiers.new("s", "SOLIDIFY"); sd.thickness = r * 0.12; apply_mods(o)
        o.matrix_world = Matrix.Translation(at) @ frame.to_4x4()
        o.data.materials.append(lid); smooth(o)


def claws(foot, ahead, s=1.0):
    m = solid("claw", (0.24, 0.22, 0.2), 0.4)
    ahead = Vector(ahead).normalized(); side = ahead.cross(Vector((0, 0, 1))).normalized()
    for k in (-1, 0, 1):
        p = Vector(foot) + ahead * 0.2 * s + side * k * 0.09 * s
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.045 * s, depth=0.1 * s, location=p)
        o = bpy.context.active_object; o.data.materials.append(m); smooth(o)
        o.rotation_euler = Vector((0, 0, 1)).rotation_difference(ahead + Vector((0, 0, -0.5))).to_euler()


def mouth_seam(body, centre, z0, sweep=80, rise=0.03, r=0.008):
    """Where the upper jaw meets the lower (round 5, the players: "the mouth is also strange", in place of round 1's
    painted smile). Rays fired inward round the snout from centre find the skin; the seam runs through those points from
    one corner of the mouth, round the tip, to the other, lifting by rise at the corners as the concept's does. A thin
    dark tube half sunk into the skin draws it, and the skin darkens beside it, so it reads as a groove. Returns a test
    for the paint: how close a point is to the seam, 0 far to 1 on it."""
    centre = Vector(centre); pts = []
    for k in range(41):
        a = math.radians(-sweep + 2 * sweep * k / 40)
        d = Vector((math.cos(a), math.sin(a), 0))
        o = Vector((centre.x, centre.y, z0 + rise * (abs(a) / math.radians(sweep)) ** 2))
        hit, loc, nrm, _ = body.ray_cast(o + d * 1.5, -d)
        if hit: pts.append(loc - nrm * r * 0.4)
    if len(pts) > 2: tube("mouth", pts, r, solid("mouthline", (0.07, 0.06, 0.05), 0.6))

    def near(p):
        if not pts: return 0.0
        dd = min((p - q).length for q in pts[::2])
        return max(0.0, 1 - dd / (r * 4))
    return near


def tortoise_head(H, s=1.0):
    """Metaball parts for the tortoise's head, after the Taoist Tortoise concept's face: a smooth domed skull, a blunt
    snout whose upper jaw overhangs the lower like a beak, a low brow over each eye, and a lower jaw set a little back
    and under, so the mouth seam falls where they meet. Round 6 flattened the whole head and was reverted (Wendell,
    2026-10-14: "you made the turtles HEAD flat instead of it's face flat and now it looks worse. Revert the change and
    make the snout move 30% closer to the top of the head"): round 5's domed skull, with the snout raised by SNOUT_UP,
    30% of the way from where it sat towards the crown."""
    v = lambda x, y, z: H + Vector((x, y, z)) * s
    u = SNOUT_UP
    return [("ell", v(0, 0, 0.02), 0.25 * s, (1.15, 0.86, 0.88)),       # skull
            ("ell", v(0.2, 0, -0.03 + u), 0.155 * s, (1.1, 0.84, 0.82)), # upper jaw
            ("ball", v(0.31, 0, -0.065 + u), 0.075 * s),                 # the beak's tip
            ("ell", v(0.12, 0, -0.15 + u), 0.14 * s, (1.35, 0.78, 0.45)), # lower jaw
            ("ell", v(0.12, 0.12, 0.065), 0.06 * s, (1.5, 0.6, 0.45)),    # brows
            ("ell", v(0.12, -0.12, 0.065), 0.06 * s, (1.5, 0.6, 0.45))]


SNOUT_UP = 0.085  # the crown sits 0.24 over the head's centre and the upper jaw 0.03 under it: 30% of 0.27 up


def nostrils(body, H, s=1.0):
    """Two small dark nostrils on top of the beak's tip, found by dropping onto the skin, so they follow its shape."""
    at = []
    for y in (0.035, -0.035):
        o = H + Vector((0.37, y, 0)) * s
        hit, loc, _, _ = body.ray_cast(o + Vector((0, 0, 1)), Vector((0, 0, -1)))
        at.append(loc if hit else o)
    return lambda p: any((p - q).length < 0.014 * s for q in at)


def creature(sc, el, lt, dk):
    """The living Shellback: a young tortoise sage, after Wendell's Taoist Tortoise concept, in its element."""
    S = STYLE[el]
    lights(sc)
    rng = random.Random(f"creature-{el}")
    P = CREATURE_POSE[look_state()]
    shell, centres = shell_mesh("shell", 0.98, S)
    shell.location = (-0.15, 0, P["shell_z"]); shell.rotation_euler = (0, P["tip"], 0)
    growth(rng, shell, centres, 0.98, S, lt)
    # the emblem faces the viewer on the shell's flank
    em = emblem("core", 0.42, lt)
    em.location = (-0.25, -0.7, 0.85 + P["shell_z"] - 0.42); em.rotation_euler = Vector((0, 0, 1)).rotation_difference(Vector((0.05, -0.8, 0.6))).to_euler()
    bpy.context.view_layer.update(); wrap_onto(em, shell)
    H = Vector(P["head"])
    HEAD["at"] = H
    root = Vector((0.45, 0, 0.5))
    neck_end = H + Vector((-0.22, 0, -0.2))
    parts = [("cap", tuple(root), tuple(neck_end), 0.22), ("ball", (0.5, 0, 0.42), 0.3)] + tortoise_head(H, 1.2)
    NECK["at"] = (root + (neck_end - root) * 0.75, (neck_end - root).normalized(), 0.22)
    feet = []
    for (x, y), (fx, fy) in zip(((0.45, -0.52), (0.45, 0.52), (-0.65, -0.52), (-0.65, 0.52)), P["feet"]):
        parts += [("cap", (x, y * 0.85, 0.42), (x + 0.04 + fx, y * fy, 0.08), 0.21),
                  ("ell", (x + 0.06 + fx, y * 1.03 * fy, 0.05), 0.22, (1.2, 1.05, 0.45))]
        feet.append((Vector((x + 0.06 + fx, y * 1.03 * fy, 0.04)), Vector((1, 0.5 * (1 if y > 0 else -1), 0))))
    parts.append(("cap", (-1.05, 0, 0.25), (-1.3, 0, 0.12), 0.07))
    body = blob("body", parts, 0.028, 12000)
    seam = mouth_seam(body, H + Vector((0.16, 0, 0)), H.z - 0.115 + SNOUT_UP * 1.2, 78, 0.035, 0.009)
    nose = nostrils(body, H, 1.2)
    throat = lambda p, n: min(1, max(0, (H.z - 0.12 + SNOUT_UP * 1.2 - p.z) / 0.06)) if (p.x > 0.55 and (n.x > 0.3 or n.z < -0.3)) else 0
    base = skin_paint(body, 1.3, throat, S)
    paint(body, lambda p, n: (0.1, 0.08, 0.06) if nose(p) else mixc(base(p, n), (0.08, 0.07, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("skin", 0.75 if S["rough"] > 0.3 else 0.4))
    for f, ahead in feet: claws(f, ahead)
    for s in (1, -1):
        eye(body, H + Vector((0.14, 0, 0.04)), (0.45, s * 0.88, 0.12), S, 0.07)
    lift = Vector(P["collar"])  # the shawl and beads ride the neck's root as the head lowers or rises
    drape("shawl", tuple(Vector((0.62, 0, 0.86)) + lift), (-0.3, 0, -1), 0.32, 0.62, 0.45, S["cloth"], S["trim"], f"shawl-{el}")
    beads(tuple(Vector((0.74, 0, 0.88)) + lift), tuple((neck_end - root).normalized()), 0.3, 18, 0.12, 4, lt, S)
    # a gold bell and a jade disc hang from the shell's rim on the near side
    dz = P["shell_z"] - 0.42 + P["rim"]  # the rim moves with the shell
    ball("bell", solid("gold", GOLD, 0.35), (-0.45, -0.8, 0.3 + dz), 0.11)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.035, major_segments=20, minor_segments=8,
                                     location=(-0.72, -0.76, 0.27 + dz), rotation=(math.pi / 2, 0, 0.5))
    bpy.context.active_object.data.materials.append(jade_of(lt))
    smooth(bpy.context.active_object)
    tassel(Vector((-0.45, -0.82, 0.16 + dz)), S["tassel"], 0.9); tassel(Vector((-0.72, -0.78, 0.15 + dz)), S["tassel"], 0.9)
    aura(rng, S["aura"], lt, (0.1, 0, 0.7), (1.35, 0.95, 0.75), 1.55)


def staff_top(el, at, lt, S):
    """What the staff carries: the element in the sage's hand."""
    x, y, z = at
    if el == "wood":
        green = solid("sprout", (0.36, 0.68, 0.22), 0.7, 0.2)
        for k in range(7):
            a = k * 2 * math.pi / 7
            o = ball("sprout", green, (x + 0.09 * math.cos(a), y + 0.09 * math.sin(a), z + 0.05 + 0.03 * (k % 2)), 0.08, (1.6, 0.7, 0.25), 10)
            o.rotation_euler = (0.5 * math.sin(a), -0.5 * math.cos(a), a)
        ball("bud", solid("bud", (0.95, 0.9, 0.85), 0.5, 0.5), (x, y, z + 0.1), 0.05)
    elif el == "fire":
        ball("flame", solid("flamecore", (1.0, 0.7, 0.2), 0.4, 12.0), (x, y, z + 0.12), 0.1)
        bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.12, depth=0.36, location=(x, y, z + 0.27))
        o = bpy.context.active_object; o.data.materials.append(solid("flame", (1.0, 0.42, 0.06), 0.5, 7.0, alpha=0.6)); smooth(o)
        iron = solid("iron", (0.1, 0.09, 0.09), 0.3, metal=1.0)
        for r in (0.0, math.pi / 2):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.13, minor_radius=0.014, location=(x, y, z + 0.12), rotation=(math.pi / 2, 0, r))
            bpy.context.active_object.data.materials.append(iron)
    elif el == "water":
        ball("pearl", solid("orb", (0.75, 0.95, 1.0), 0.03, 2.5, alpha=0.85), (x, y, z + 0.12), 0.12)
        bpy.ops.mesh.primitive_torus_add(major_radius=0.16, minor_radius=0.012, location=(x, y, z + 0.12), rotation=(1.2, 0.3, 0))
        bpy.context.active_object.data.materials.append(solid("wave", (0.7, 0.95, 1.0), 0.2, 3.0))
    elif el == "metal":
        bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.02, location=(x, y, z + 0.17), rotation=(math.pi / 2, 0, 0.5))
        bpy.context.active_object.data.materials.append(solid("hoop", (0.9, 0.92, 0.95), 0.15, 0.8, 1.0))
        chime = solid("chime", GOLD, 0.2, 0.6, 1.0)
        for k in (-1, 0, 1):
            bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.012, depth=0.16, location=(x + 0.04 * k, y + 0.05 * k, z + 0.06))
            bpy.context.active_object.data.materials.append(chime)
    elif el == "earth":
        amber = solid("amber", (1.0, 0.62, 0.12), 0.12, 3.5)
        for k, (dx, dy, h) in enumerate(((0, 0, 0.3), (0.06, 0.03, 0.2), (-0.05, -0.04, 0.18))):
            bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.045, depth=h, location=(x + dx, y + dy, z + h / 2),
                                                rotation=(dy * 4, -dx * 4, 0))
            bpy.context.active_object.data.materials.append(amber)
            bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.045, depth=0.08, location=(x + dx * 1.3, y + dy * 1.3, z + h + 0.03),
                                            rotation=(dy * 4, -dx * 4, 0))
            bpy.context.active_object.data.materials.append(amber)


def ascended(sc, el, lt, dk):
    """The highest ally form: the tortoise sage standing upright in a long robe, shell on its back, a staff in hand
    and its core grown into a yin-yang medallion over its heart, all in its element."""
    S = STYLE[el]
    lights(sc)
    rng = random.Random(f"ascended-{el}")
    shell, centres = shell_mesh("shell", 0.62, S)
    shell.location = (-0.24, 0, 1.25); shell.rotation_euler = (0, -math.pi / 2, 0)
    growth(rng, shell, centres, 0.62, S, lt, upright=False)
    A = ALLY_POSE[look_state()]
    H = Vector(A["head"])
    HEAD["at"] = H
    NECK["at"] = (Vector((0.06, 0, 1.72)), Vector((0.2, 0, 1)), 0.17)
    parts = tortoise_head(H, 0.88) + [
             ("cap", (0.0, 0, 1.55), tuple(H + Vector((-0.08, 0, -0.13))), 0.13), ("cap", (0, 0, 0.95), (0, 0, 1.5), 0.3),
             ("ball", (0, 0, 0.9), 0.3), ("cap", (0, -0.32, 1.52), (0, 0.32, 1.52), 0.15)]
    feet = []
    w = A["stance"]
    for y in (-0.2, 0.2):
        parts += [("cap", (0, y, 0.85), (0.02, y * 1.1 * w, 0.12), 0.15), ("ell", (0.09, y * 1.1 * w, 0.05), 0.17, (1.3, 1.0, 0.45))]
        feet.append((Vector((0.09, y * 1.1 * w, 0.04)), Vector((1, 0.4 * (1 if y > 0 else -1), 0))))
    hands = []
    for s in (-1, 1):
        sh = Vector((0, s * 0.42, 1.5))
        el_, hd = (Vector((a[0], s * a[1], a[2])) for a in (A["elbow"], A["hand"]))
        parts += [("cap", sh, el_, 0.1), ("cap", el_, hd, 0.09), ("ball", hd + Vector((0.04, 0, 0)), 0.1)]
        hands.append(hd + Vector((0.04, 0, 0)))
    body = blob("body", parts, 0.025, 12000)
    seam = mouth_seam(body, H + Vector((0.12, 0, 0)), H.z - 0.085 + SNOUT_UP * 0.88, 78, 0.026, 0.007)
    nose = nostrils(body, H, 0.88)
    throat = lambda p, n: min(1, max(0, (H.z - 0.09 + SNOUT_UP * 0.88 - p.z) / 0.05)) if (p.z > 1.5 and (n.x > 0.35 or n.z < -0.3)) else 0
    base = skin_paint(body, 2.1, throat, S)
    paint(body, lambda p, n: (0.1, 0.08, 0.06) if nose(p) else mixc(base(p, n), (0.08, 0.07, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("skin", 0.75 if S["rough"] > 0.3 else 0.4))
    for f, ahead in feet: claws(f, ahead, 0.8)
    for s in (1, -1):
        eye(body, H + Vector((0.1, 0, 0.03)), (0.45, s * 0.88, 0.12), S, 0.054)
    drape("robe", (0.02, 0, 1.12), (0, 0, -1), 0.4, 0.5, 0.85, S["cloth"], S["trim"], f"robe-{el}", 0.15)
    drape("shawl", (0.02, 0, 1.7), (0, 0, -1), 0.24, 0.5, 0.36, mixc(S["cloth"], S["trim"], 0.35), S["trim"], f"shawl-{el}", 0.5)
    plate = ball("plastron", solid("plate", S["plastron"], 0.6, metal=S["metal"]), (0.27, 0, 1.22), 0.25, (0.35, 0.8, 1.0), 24)
    em = emblem("core", 0.17, lt, 2.6, 56)
    em.location = (0.37, 0, 1.22); em.rotation_euler = (0, math.pi / 2, 0)
    bpy.context.view_layer.update(); wrap_onto(em, plate, 0.01)
    beads((0.05, 0, 1.68), (0.15, 0, 1), 0.27, 18, 0.1, 4, lt, S)
    # the staff, held in the far hand so the medallion stays in view, carries the element at its head
    col, rough, metal = S["staff"]
    h = hands[1]
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.035, depth=2.15, location=(h.x, h.y + 0.02, 1.0))
    o = bpy.context.active_object; o.data.materials.append(solid("staff", col, rough, metal=metal)); o.rotation_euler = (-0.04, 0, 0); smooth(o)
    staff_top(el, (h.x, h.y + 0.06, 2.08), lt, S)
    aura(rng, S["aura"], lt, (0.0, 0, 1.15), (0.75, 0.75, 1.0), 2.35)


# Round 4: the Shellback's other two animal bases. The armadillo carries banded armour and big upright ears, and its
# ringed tail; the pangolin is scaled from crown to tail tip, with a long broad tail that curls round at the end. Both
# keep round 3's lidded eye (only the iris colour changes), the element styling, the cloth, beads and aura.

def along(path):
    """at(t) gives the point and direction a fraction t of the way along a path of points, by length."""
    pts = [Vector(p) for p in path]
    segs = [(b - a).length for a, b in zip(pts, pts[1:])]
    total = sum(segs)

    def at(t):
        d = t * total
        for i, sl in enumerate(segs):
            if d <= sl or i == len(segs) - 1:
                return pts[i].lerp(pts[i + 1], min(1.0, d / sl)), (pts[i + 1] - pts[i]).normalized()
            d -= sl
    return at, total


def across(d):
    """Two directions square to d and to each other."""
    u = d.cross(Vector((0, 0, 1)))
    if u.length < 1e-3: u = d.cross(Vector((0, 1, 0)))
    u.normalize()
    return u, d.cross(u).normalized()


def armour(name, S, t=0.4):
    return solid(name, mixc(S["shell"], S["shell_hi"], t), S["rough"], metal=S["metal"])


def underlay(name, S):
    """What shows between bands and scales: the element's glowing seam, or a dark groove where nothing glows."""
    return solid(name, S["seam"][0], 0.4, S["seam"][1]) if S["seam"] else solid(name, (0.12, 0.1, 0.07), 0.9)


def tail(name, path, r0, r1, S, kind):
    """The tail, in the shell's own material. rings: the armadillo's telescoping rings, a seam at every joint.
    scales: the pangolin's broad overlapping scales, six to a row, each row half a scale over, their free edges
    lifting toward the tip, over a body that shows the element's seam colour between them."""
    at, total = along(path)
    a, b, line = armour(f"{name}a", S, 0.3), armour(f"{name}b", S, 0.65), underlay(f"{name}seam", S)
    if kind == "rings":
        n = 12
        for k in range(n):
            t0 = k / n; r = r0 + (r1 - r0) * t0
            p, d = at(t0 + 0.5 / n)
            bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=r, radius2=r * 0.86, depth=total / n * 1.06, location=p)
            o = bpy.context.active_object; o.name = name; o.data.materials.append(b if k % 2 else a); smooth(o)
            o.rotation_euler = Vector((0, 0, 1)).rotation_difference(d).to_euler()
            q, d0 = at(t0)
            bpy.ops.mesh.primitive_torus_add(major_radius=r * 0.94, minor_radius=max(0.008, r * 0.08), major_segments=24,
                                             minor_segments=5, location=q)
            o = bpy.context.active_object; o.data.materials.append(line)
            o.rotation_euler = Vector((0, 0, 1)).rotation_difference(d0).to_euler()
        ball("tailtip", a, at(1.0)[0], r1 * 0.9)
        return
    parts = []
    for k in range(6):
        t0, t1 = k / 6, (k + 1) / 6
        parts.append(("cap", tuple(at(t0)[0]), tuple(at(t1)[0]), (r0 + (r1 - r0) * (t0 + t1) / 2) * 0.72))
    core_ = blob(f"{name}core", parts, 0.02, 4000); core_.data.materials.append(line)
    n, m = 10, 6
    for k in range(n):
        t = (k + 0.35) / n; r = r0 + (r1 - r0) * t
        p, d = at(t); u, v = across(d)
        for j in range(m):
            ang = (j + 0.5 * (k % 2)) * 2 * math.pi / m
            e = math.cos(ang) * u + math.sin(ang) * v
            x = (d + e * 0.3).normalized(); z = (e - x * e.dot(x)).normalized(); y = z.cross(x)
            o = ball(name, b if (j + k) % 2 else a, p + e * r * 0.78, 1.0,
                     (total / n * 0.78, math.pi * r / m * 1.2, r * 0.2), 16)
            o.rotation_euler = Matrix((x, y, z)).transposed().to_euler()


def ears(H, S, s=1.0):
    """The armadillo's big upright ears, leaning out and back. Round 6 (Wendell: "the ears need to be a bit more
    point"): each is a thin leaf, broad at the root and drawn to a point, set further back so the eyes stay clear."""
    m = solid("ear", mixc(S["skin"], S["spot"], 0.25), 0.75)
    for side in (1, -1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16, radius=1.0)
        o = bpy.context.active_object; o.name = "ear"
        for v in o.data.vertices:  # a leaf: round at the root, tapering to a sharp tip
            t = (v.co.z + 1) / 2
            w = (1 - t) ** 0.6 * min(1.0, 0.35 + 2.5 * t)
            v.co = Vector((v.co.x * 0.13 * w, v.co.y * 0.045, (t * 0.48 - 0.06))) * s
        o.location = H + Vector((-0.14, side * 0.13, 0.12)) * s
        o.rotation_euler = (-side * 0.45, -0.35, side * 0.3)
        o.data.materials.append(m); smooth(o)


def head_armour(base, H, S, s=1.0, body=None, path=(), outs=()):
    """The armadillo's head shield, or the pangolin's scales running from its crown down the back of its neck."""
    m = armour("headarmour", S, 0.5)
    if base == "armadillo":
        ball("shield", m, H + Vector((0.02, 0, 0.13)) * s, 0.16 * s, (1.35, 0.95, 0.38), 20).rotation_euler = (0, 0.15, 0)
        return
    # round 6 (Wendell: "their head scales need to fold into the [shell] more than turtle or armadille. We want it to
    # feel more like scales and they are floating more"): rows of scales run from the crown down the back of the neck
    # and on under the shell's front rim, growing as they go, each one lifted clear of the skin with a lit gap beneath,
    # so they read as loose scales hovering in place, not a stack on the head.
    glow = underlay("scalegap", S)
    rows = len(path) - 1
    for i in range(len(path)):
        a, out = Vector(path[i]), Vector(outs[i]).normalized()
        ahead = (Vector(path[max(i - 1, 0)]) - Vector(path[min(i + 1, rows)])).normalized()
        t = i / rows
        r = (0.075 + 0.07 * t) * s
        ahead = (ahead - out * out.dot(ahead)).normalized()
        across = out.cross(ahead).normalized()
        out2 = (out * math.cos(0.25) + ahead * math.sin(0.25)).normalized()  # nose dips in, tail lifts: the next row tucks under
        frame = Matrix((across.cross(out2), across, out2)).transposed().to_euler()
        for k in ((0,) if i == 0 else (-1, 1) if i % 2 else (-1.6, 0, 1.6)):
            q = a + across * k * r * 0.85
            hit, loc, nrm, _ = body.ray_cast(q + out * 1.2, -out)
            base_at = loc if hit else q
            lift = (0.04 + 0.03 * t) * s
            at = base_at + out * lift
            o = ball("scale", m, at, r, (1.3, 1.0, 0.28), 16)
            o.rotation_euler = frame
            ball("scalegap", glow, base_at + out * lift * 0.35, r * 0.45, (1.2, 1.0, 0.25), 12).rotation_euler = frame


def snout(H, base, s=1.0):
    """Metaball parts for the long head: a rounded skull drawn out into a long tapering snout."""
    v = lambda x, y, z: H + Vector((x, y, z)) * s
    if base == "armadillo":
        # round 6 (Wendell: "who9le face needs to be pointy ... with the flat snout"): no round skull and thin tube now;
        # the head narrows all the way from the ears to the tip, and the snout is flattened top to bottom
        return taper(v, (-0.04, 0, 0), (0.47, 0, -0.18), 0.2 * s, 0.055 * s, (1.25, 0.95, 0.8), (1.4, 0.8, 0.42))
    # round 6 (Wendell: "pangolin needs a shorter nose than armadillo"): about two thirds as long, still tapering
    return taper(v, (0, 0, 0), (0.31, 0, -0.1), 0.19 * s, 0.055 * s, (1.25, 0.9, 0.8), (1.3, 0.85, 0.6))


def taper(v, a, b, r0, r1, sc0, sc1, n=9):
    """Metaball ellipsoids close enough to fuse into one smooth taper from a to b, shrinking and flattening as they go."""
    out = []
    for k in range(n):
        t = k / (n - 1)
        out.append(("ell", v(*[x + (y - x) * t for x, y in zip(a, b)]), r0 + (r1 - r0) * t ** 0.8,
                    tuple(x + (y - x) * t for x, y in zip(sc0, sc1))))
    return out


def hologram_long(lt, dk, base):
    """The projected body of the long bases: a faceted shell whose rings run across the back, as the armadillo's bands
    or the pangolin's rows of scales, a pointed snout, and the armadillo's ears or the pangolin's long tail."""
    skin = mat("holo", lt, 1.1, 0.32, scan=True)
    edge = mat("edge", lt, 2.2, 0.9)
    deep = mat("deep", lt, 0.9, 0.22, scan=True)
    sx, sy, sz = BASES[base]["squash"]
    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=9 if base == "armadillo" else 11, radius=1.0)
    shell = bpy.context.active_object; shell.name = "shell"; shell.data.materials.append(skin)
    for v in shell.data.vertices:  # the poles turned fore and aft, so the rings run across the back
        x, y, z = v.co
        v.co = Vector((z * sx * 0.92, y * sy * 0.92, max(x * sz * 0.92, -0.15)))
    for f in shell.data.polygons: f.use_smooth = False
    shell.location = (-0.05, 0, 0.32)
    wire = shell.copy(); wire.data = shell.data.copy(); wire.name = "shell_edges"
    bpy.context.scene.collection.objects.link(wire)
    wire.data.materials.clear(); wire.data.materials.append(edge)
    md = wire.modifiers.new("w", "WIREFRAME"); md.thickness = 0.022; md.use_replace = True
    wire.scale = (1.01, 1.01, 1.01)
    front = sx * 0.92 - 0.05
    obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "head", skin, subdivisions=1, radius=0.22,
             location=(front + 0.08, 0, 0.36))
    bpy.context.active_object.scale = (1.2, 0.85, 0.8)
    obj_from(bpy.ops.mesh.primitive_cone_add, "snout", skin, vertices=5, radius1=0.1, depth=0.42,
             location=(front + 0.42, 0, 0.3), rotation=(0, math.pi / 2 + 0.25, 0))
    if base == "armadillo":
        for side in (1, -1):
            obj_from(bpy.ops.mesh.primitive_cone_add, "ear", deep, vertices=4, radius1=0.08, depth=0.28,
                     location=(front + 0.0, side * 0.13, 0.62), rotation=(-side * 0.4, -0.3, 0))
        obj_from(bpy.ops.mesh.primitive_cone_add, "tail", deep, vertices=6, radius1=0.11, depth=0.8,
                 location=(-sx * 0.92 - 0.4, 0, 0.12), rotation=(0, -math.pi / 2 - 0.15, 0))
    else:
        for k, (r1, r2, d, x) in enumerate(((0.3, 0.2, 0.45, 0.2), (0.2, 0.09, 0.5, 0.65))):
            t = obj_from(bpy.ops.mesh.primitive_cone_add, "tail", skin, vertices=6, radius1=r1, radius2=r2, depth=d,
                         location=(-sx * 0.92 - x, 0, 0.18 - 0.07 * k), rotation=(0, -math.pi / 2 - 0.12, 0))
            tw = t.copy(); tw.data = t.data.copy(); bpy.context.scene.collection.objects.link(tw)
            tw.data.materials.clear(); tw.data.materials.append(edge)
            md = tw.modifiers.new("w", "WIREFRAME"); md.thickness = 0.02; md.use_replace = True
    for x, y in ((0.6, 0.45), (0.6, -0.45), (-0.65, 0.45), (-0.65, -0.45)):
        obj_from(bpy.ops.mesh.primitive_cylinder_add, "leg", deep, vertices=6, radius=0.12, depth=0.4, location=(x, y, 0.0))
    eye_ = mat("eye", (1, 1, 1), 9.0, 1.0)
    for y in (0.12, -0.12):
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "eye", eye_, subdivisions=1, radius=0.04,
                 location=(front + 0.24, y, 0.45))
    ring = mat("ring", lt, 2.0, 0.7)
    obj_from(bpy.ops.mesh.primitive_torus_add, "projector", ring, major_radius=1.45, minor_radius=0.018,
             major_segments=48, minor_segments=4, location=(0, 0, -0.22))
    core(lt, at=(0, 0, 0.38), size=0.2)


def creature_long(sc, el, lt, dk, base):
    """The living armadillo or pangolin, in its element, dressed like the tortoise sage."""
    S = STYLE[el]
    lights(sc)
    rng = random.Random(f"creature-{base}-{el}")
    arma = base == "armadillo"
    shell, centres = shell_mesh("shell", 0.95, S)
    shell.location = (-0.1, 0, 0.44); shell.rotation_euler = (0, -0.03 if arma else 0.06, 0)
    growth(rng, shell, centres, 0.95, S, lt)
    em = emblem("core", 0.38, lt)
    em.location = (-0.2, -0.66, 0.8); em.rotation_euler = Vector((0, 0, 1)).rotation_difference(Vector((0.05, -0.8, 0.6))).to_euler()
    bpy.context.view_layer.update(); wrap_onto(em, shell)
    H = Vector((1.36, 0, 0.62)) if arma else Vector((1.4, 0, 0.5))
    HEAD["at"] = H
    NECK["at"] = (H + Vector((-0.42, 0, -0.04)), Vector((1, 0, 0.12)), 0.2)
    parts = snout(H, base) + [("cap", (0.7, 0, 0.44), (H.x - 0.18, 0, H.z - 0.02), 0.2),
                              ("ball", (0.35, 0, 0.42), 0.32), ("ball", (-0.55, 0, 0.42), 0.32)]
    feet = []
    for x, y in ((0.55, -0.48), (0.55, 0.48), (-0.75, -0.48), (-0.75, 0.48)):
        parts += [("cap", (x, y * 0.85, 0.4), (x + 0.04, y, 0.08), 0.18 if arma else 0.17),
                  ("ell", (x + 0.06, y * 1.03, 0.05), 0.2, (1.25, 1.05, 0.45))]
        feet.append((Vector((x + 0.06, y * 1.03, 0.04)), Vector((1, 0.5 * (1 if y > 0 else -1), 0)), x > 0))
    body = blob("body", parts, 0.028, 12000)
    throat = lambda p, n: 1.0 if (n.z < -0.15 and p.x > 0.9) else 0
    paint(body, skin_paint(body, 1.3, throat, S))
    body.data.materials.append(vmat("skin", 0.75 if S["rough"] > 0.3 else 0.4))
    for f, ahead, front in feet: claws(f, ahead, 1.25 if (front and not arma) else 0.9)
    for s in (1, -1):
        # the armadillo's sits below its head shield, so the shield's rim reads as its brow
        # round 6: the armadillo's eyes sit on the sides of its head, looking out more than ahead; the pangolin's are
        # set further apart (Wendell: "space pangolin eyes a littlre more")
        eye(body, H + (Vector((0.02, 0, -0.01)) if arma else Vector((0.02, 0, 0.05))), (0.12, s * 0.98, 0.1) if arma else (0.22, s * 0.95, 0.2), S,
            0.064 if arma else 0.06)
    if arma: ears(H, S)
    head_armour(base, H, S, 1.0, body,
                [H + Vector((0.04, 0, 0.12)), H + Vector((-0.12, 0, 0.14)), H + Vector((-0.3, 0, 0.12)), H + Vector((-0.5, 0, 0.1)),
                 Vector((0.72, 0, 0.78)), Vector((0.55, 0, 0.92))],
                [(0.3, 0, 1), (0, 0, 1), (-0.2, 0, 1), (-0.3, 0, 1), (-0.1, 0, 1), (-0.3, 0, 1)])
    tail("tail", [(-1.3, 0, 0.32), (-1.56, -0.05, 0.22), (-1.78, -0.18, 0.12), (-1.93, -0.38, 0.07), (-1.98, -0.6, 0.05)]
         if arma else [(-1.22, 0, 0.46), (-1.58, -0.04, 0.33), (-1.88, -0.2, 0.19), (-2.0, -0.5, 0.11),
                       (-1.9, -0.82, 0.08), (-1.66, -1.02, 0.07)],
         0.14 if arma else 0.33, 0.04 if arma else 0.09, S, "rings" if arma else "scales")
    neck = Vector((H.x - 0.44, 0, H.z - 0.06))  # behind the head, so the snout and ears stay clear of the cloth
    drape("shawl", neck, (-0.45, 0, -1), 0.22, 0.42, 0.3, S["cloth"], S["trim"], f"shawl-{base}-{el}")
    beads(neck + Vector((0.05, 0, 0.03)), (0.7, 0, 0.7), 0.22, 16, 0.08, 4, lt, S)
    ball("bell", solid("gold", GOLD, 0.35), (-0.45, -0.8, 0.3), 0.11)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.035, major_segments=20, minor_segments=8,
                                     location=(-0.72, -0.76, 0.27), rotation=(math.pi / 2, 0, 0.5))
    bpy.context.active_object.data.materials.append(jade_of(lt))
    smooth(bpy.context.active_object)
    tassel(Vector((-0.45, -0.82, 0.16)), S["tassel"], 0.9); tassel(Vector((-0.72, -0.78, 0.15)), S["tassel"], 0.9)
    aura(rng, S["aura"], lt, (0.0, 0, 0.6), (1.55, 0.95, 0.65), 1.35)


def ascended_long(sc, el, lt, dk, base):
    """The highest ally form of the long bases: the tortoise sage's robe, staff and medallion, with the armadillo's
    banded shell and ears or the pangolin's scales on its back and its long scaled tail sweeping the ground."""
    S = STYLE[el]
    lights(sc)
    rng = random.Random(f"ascended-{base}-{el}")
    arma = base == "armadillo"
    shell, centres = shell_mesh("shell", 0.56, S)
    shell.location = (-0.24, 0, 1.22); shell.rotation_euler = (0, -math.pi / 2, 0)
    growth(rng, shell, centres, 0.56, S, lt, upright=False)
    H = Vector((0.2, 0, 2.03))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.06, 0, 1.7)), Vector((0.2, 0, 1)), 0.17)
    parts = snout(H, base, 0.85) + [("cap", (0.0, 0, 1.55), (0.12, 0, 1.9), 0.13), ("cap", (0, 0, 0.95), (0, 0, 1.5), 0.3),
                                    ("ball", (0, 0, 0.9), 0.3), ("cap", (0, -0.32, 1.52), (0, 0.32, 1.52), 0.15)]
    feet = []
    for y in (-0.2, 0.2):
        parts += [("cap", (0, y, 0.85), (0.02, y * 1.1, 0.12), 0.15), ("ell", (0.09, y * 1.1, 0.05), 0.17, (1.3, 1.0, 0.45))]
        feet.append((Vector((0.09, y * 1.1, 0.04)), Vector((1, 0.4 * (1 if y > 0 else -1), 0))))
    hands = []
    for s in (-1, 1):
        sh, el_, hd = Vector((0, s * 0.42, 1.5)), Vector((0.1, s * 0.5, 1.12)), Vector((0.32, s * 0.42, 0.95))
        parts += [("cap", sh, el_, 0.1), ("cap", el_, hd, 0.09), ("ball", hd + Vector((0.04, 0, 0)), 0.1)]
        hands.append(hd + Vector((0.04, 0, 0)))
    body = blob("body", parts, 0.025, 12000)
    throat = lambda p, n: 1.0 if (n.x > 0.4 and p.z > 1.5 and p.z < H.z - 0.04) else 0
    paint(body, skin_paint(body, 2.1, throat, S))
    body.data.materials.append(vmat("skin", 0.75 if S["rough"] > 0.3 else 0.4))
    for f, ahead in feet: claws(f, ahead, 0.8 if arma else 1.0)
    for s in (1, -1):
        eye(body, H + (Vector((0.02, 0, -0.01)) if arma else Vector((0.02, 0, 0.04))), (0.12, s * 0.98, 0.1) if arma else (0.22, s * 0.95, 0.18), S, 0.054)
    if arma: ears(H, S, 0.85)
    head_armour(base, H, S, 0.85, body,
                [H + Vector((0.03, 0, 0.1)), H + Vector((-0.1, 0, 0.11)), H + Vector((-0.2, 0, 0.0)), Vector((-0.06, 0, 1.82)),
                 Vector((-0.16, 0, 1.68)), Vector((-0.3, 0, 1.58))],
                [(0.3, 0, 1), (-0.2, 0, 1), (-1, 0, 0.6), (-1, 0, 0.3), (-1, 0, 0.4), (-0.8, 0, 1)])
    tail("tail", [(-0.3, 0, 0.95), (-0.55, -0.05, 0.6), (-0.72, -0.15, 0.3), (-0.8, -0.32, 0.08), (-0.7, -0.52, 0.04)]
         if arma else [(-0.3, 0, 1.0), (-0.6, 0, 0.7), (-0.86, -0.05, 0.38), (-1.0, -0.2, 0.13), (-0.95, -0.5, 0.08),
                       (-0.72, -0.72, 0.07)],
         0.1 if arma else 0.22, 0.035 if arma else 0.07, S, "rings" if arma else "scales")
    drape("robe", (0.02, 0, 1.12), (0, 0, -1), 0.4, 0.5, 0.85, S["cloth"], S["trim"], f"robe-{base}-{el}", 0.15)
    drape("shawl", (0.02, 0, 1.7), (0, 0, -1), 0.24, 0.5, 0.36, mixc(S["cloth"], S["trim"], 0.35), S["trim"], f"shawl-{base}-{el}", 0.5)
    plate = ball("plastron", solid("plate", S["plastron"], 0.6, metal=S["metal"]), (0.27, 0, 1.22), 0.25, (0.35, 0.8, 1.0), 24)
    em = emblem("core", 0.17, lt, 2.6, 56)
    em.location = (0.37, 0, 1.22); em.rotation_euler = (0, math.pi / 2, 0)
    bpy.context.view_layer.update(); wrap_onto(em, plate, 0.01)
    beads((0.05, 0, 1.68), (0.15, 0, 1), 0.27, 18, 0.1, 4, lt, S)
    col, rough, metal = S["staff"]
    h = hands[1]
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.035, depth=2.15, location=(h.x, h.y + 0.02, 1.0))
    o = bpy.context.active_object; o.data.materials.append(solid("staff", col, rough, metal=metal)); o.rotation_euler = (-0.04, 0, 0); smooth(o)
    staff_top(el, (h.x, h.y + 0.06, 2.08), lt, S)
    aura(rng, S["aura"], lt, (0.0, 0, 1.15), (0.8, 0.8, 1.0), 2.35)


# Round 8: the second body family, the Player's Romp (sg-body-from A: the urge picks the family; the Romp's bases are
# the fox, the otter and the kid goat), with its fox base first. No concept art exists for any Romp base, so the fox is
# built from the image prompt written for it (council/loops/prompts/spirit-generator-r8.md in the council's repo): a
# narrow pointed muzzle, tall pointed ears with dark backs, a white bib and cheek ruff, dark stockings, and a brush of
# a tail longer than its body with a pale tip, carried high. Where the Shellback sits, the Romp plays: the creature
# has a forepaw lifted mid-step. The family has its own gas, drifting in a looping trail like a swishing tail, and its
# own core, cut as a fox's jewel (the onion-tipped star ball, hoshi no tama, that foxes carry in Japanese folk tales).
# It keeps every spirit's shared pieces: the lidded eye, the yin-yang core grown into its body, cloth, beads, tassel,
# and the element's aura; the element sets the coat and what the tail and ruff carry, as it sets the Shellback's shell.
FUR = {  # coat, saddle (darker along the back), pale (bib, cheeks, tail tip), stocking (legs and ear backs)
    "wood":  ((0.56, 0.5, 0.24), (0.36, 0.36, 0.14), (0.92, 0.9, 0.74), (0.2, 0.2, 0.1)),
    "fire":  ((0.86, 0.33, 0.1), (0.55, 0.14, 0.05), (0.98, 0.9, 0.78), (0.1, 0.05, 0.04)),
    "water": ((0.34, 0.56, 0.7), (0.16, 0.3, 0.46), (0.9, 0.96, 0.98), (0.08, 0.14, 0.24)),
    "metal": ((0.7, 0.72, 0.76), (0.36, 0.38, 0.44), (0.97, 0.97, 0.98), (0.12, 0.12, 0.15)),
    "earth": ((0.84, 0.62, 0.32), (0.6, 0.4, 0.18), (0.97, 0.9, 0.74), (0.28, 0.17, 0.08)),
}


def romp_gas(rng, lt, dk, n=150):
    """The Romp's gas: motes strung along a looping trail, a tail swished through the air, thickest at its head."""
    motes = [mat(f"mote{i}", lt if i % 3 else dk, 1.8 - i * 0.4, 0.55 - i * 0.12) for i in range(3)]
    for i in range(n):
        t = rng.random() ** 1.6  # most motes at the trail's head
        a = 0.6 + t * 2.4 * math.pi
        c = Vector((0.75 * math.sin(a) * (1 - 0.45 * t), 0.5 * math.sin(2 * a) * (1 - 0.45 * t), 0.25 * math.cos(a) - 0.2 * t))
        c += Vector((rng.gauss(0, 1), rng.gauss(0, 1), rng.gauss(0, 1))) * (0.05 + 0.13 * t)
        r = (0.03 + rng.random() * 0.06) * (1.25 - 0.6 * t)
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, f"mote{i}", motes[i % 3], subdivisions=1, radius=r,
                 location=(c.x, c.y, 0.38 + c.z))


def romp_core(lt, at=(0, 0, 0.35), size=0.32):
    """The Romp's core, cut as a fox's jewel: a faceted round pearl drawn up into a flame-like point that leans as it
    rises, ringed below the point by a band of brighter facets."""
    gem = mat("core", lt, 2.4, 0.95)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=8, radius=size, location=at)
    o = bpy.context.active_object; o.name = "core"; o.data.materials.append(gem)
    for v in o.data.vertices:
        t = max(0.0, v.co.z / size)
        sq = 1 - 0.9 * t ** 1.5
        a = 1.4 * t  # the point twists as it rises
        x, y = v.co.x * sq, v.co.y * sq
        v.co = Vector((x * math.cos(a) - y * math.sin(a) + 0.35 * size * t ** 2, x * math.sin(a) + y * math.cos(a),
                       v.co.z * (1 + 1.3 * t ** 1.3)))
    for f in o.data.polygons: f.use_smooth = False
    band = mat("coreband", lt, 3.6, 0.9)
    bpy.ops.mesh.primitive_torus_add(major_radius=size * 0.82, minor_radius=size * 0.06, major_segments=10,
                                     minor_segments=3, location=(at[0], at[1], at[2] + size * 0.3))
    bpy.context.active_object.data.materials.append(band)
    return o


def fox_hologram(lt, dk):
    """The projected fox: a faceted body of light, its edges traced brighter, tall ears and a big tail carried high."""
    skin = mat("holo", lt, 1.1, 0.32, scan=True)
    edge = mat("edge", lt, 2.2, 0.9)
    deep = mat("deep", lt, 0.9, 0.22, scan=True)

    def traced(o):
        w = o.copy(); w.data = o.data.copy(); bpy.context.scene.collection.objects.link(w)
        w.data.materials.clear(); w.data.materials.append(edge)
        md = w.modifiers.new("w", "WIREFRAME"); md.thickness = 0.018; md.use_replace = True
    body = obj_from(bpy.ops.mesh.primitive_uv_sphere_add, "body", skin, segments=8, ring_count=6, radius=1.0, location=(0, 0, 0.5))
    body.scale = (0.75, 0.32, 0.32); traced(body)
    head = obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "head", skin, subdivisions=1, radius=0.2, location=(0.82, 0, 0.82))
    head.scale = (1.1, 0.95, 0.85); traced(head)
    obj_from(bpy.ops.mesh.primitive_cone_add, "snout", skin, vertices=5, radius1=0.1, depth=0.34,
             location=(1.08, 0, 0.76), rotation=(0, math.pi / 2 + 0.25, 0))
    for side in (1, -1):
        traced(obj_from(bpy.ops.mesh.primitive_cone_add, "ear", skin, vertices=3, radius1=0.09, depth=0.3,
                        location=(0.76, side * 0.11, 1.07), rotation=(-side * 0.25, -0.15, 0)))
    for x, y in ((0.5, 0.15), (0.5, -0.15), (-0.5, 0.15), (-0.5, -0.15)):
        obj_from(bpy.ops.mesh.primitive_cylinder_add, "leg", deep, vertices=5, radius=0.06, depth=0.5, location=(x, y, 0.0))
    at, _ = along([(-0.7, 0, 0.55), (-1.05, 0, 0.75), (-1.2, 0.04, 1.1), (-1.08, 0.08, 1.4)])
    for k in range(4):  # the brush, in four facets, swelling then drawn to a point
        t0, t1 = k / 4, (k + 1) / 4
        p0, p1 = at(t0)[0], at(t1)[0]
        r0, r1 = (0.1, 0.19, 0.22, 0.17)[k], (0.19, 0.22, 0.17, 0.02)[k]
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r0, radius2=r1, depth=(p1 - p0).length, location=(p0 + p1) / 2)
        o = bpy.context.active_object; o.name = "tail"; o.data.materials.append(skin)
        o.rotation_euler = Vector((0, 0, 1)).rotation_difference(p1 - p0).to_euler(); traced(o)
    eye_ = mat("eye", (1, 1, 1), 9.0, 1.0)
    for y in (0.1, -0.1):
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "eye", eye_, subdivisions=1, radius=0.035, location=(0.98, y, 0.88))
    ring = mat("ring", lt, 2.0, 0.7)
    obj_from(bpy.ops.mesh.primitive_torus_add, "projector", ring, major_radius=1.35, minor_radius=0.018,
             major_segments=48, minor_segments=4, location=(0, 0, -0.22))
    romp_core(lt, at=(0, 0, 0.48), size=0.17)


def fox_head(H, s=1.0):
    """Metaball parts for the fox's head: a rounded skull, a narrow muzzle drawn out to a point, cheek ruffs swept back."""
    v = lambda x, y, z: H + Vector((x, y, z)) * s
    return [("ell", v(0, 0, 0), 0.17 * s, (1.1, 0.95, 0.85))] + \
        taper(v, (0.1, 0, -0.035), (0.31, 0, -0.08), 0.105 * s, 0.038 * s, (1.2, 0.95, 0.85), (1.3, 0.85, 0.75), 8) + \
        [("ell", v(-0.04, 0.11, -0.07), 0.1 * s, (1.3, 0.7, 0.9)), ("ell", v(-0.04, -0.11, -0.07), 0.1 * s, (1.3, 0.7, 0.9))]


def fox_ears(H, F, s=1.0):
    """Tall pointed ears in the coat's colour, dark toward the tip and pale inside, leaning a little out."""
    inner = solid("earinner", mixc(F[2], F[0], 0.2), 0.85)
    for side in (1, -1):
        for name, m, sc, off in (("ear", None, (1, 0.36, 1), 0), ("earin", inner, (0.72, 0.2, 0.8), 0.024)):
            bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.1 * s, depth=0.24 * s)
            o = bpy.context.active_object; o.name = name; o.scale = sc; smooth(o)
            if m is None:  # the coat's colour, darkening to the tip
                h = 0.12 * s
                paint(o, lambda p, n, z0=o.location.z: mixc(F[0], F[3], max(0.0, min(1.0, ((p.z - z0) / h - 0.1) * 1.4))))
                m = vmat("ear", 0.8)
            o.data.materials.append(m)
            o.rotation_euler = (-side * 0.28, -0.18, 0)
            bpy.context.view_layer.update()
            fwd = (o.matrix_world.to_3x3() @ Vector((1, 0, 0))).normalized()
            o.location = H + Vector((-0.05, side * 0.1, 0.19)) * s + fwd * off * s


def fluff(o, amt, scale=14.0, seed=0.0):
    """Clumps of fur: push the skin out along its normals by a little noise."""
    for v in o.data.vertices:
        v.co += v.normal * amt * (0.5 + noise.noise(v.co * scale + Vector((seed, 0, 0))))


def seg_dist(p, a, b):
    a, b = Vector(a), Vector(b); ab = b - a
    t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
    return (p - (a + ab * t)).length


def fox_paint(H, F, s, tail_tip, low=0.28, bib_x=0.3, bib_z=(0.55, 9.0), shins=()):
    """The fox's coat: the element's colour, darker along the back, a pale bib, cheeks, muzzle and belly, dark
    stockings, and the pale tip of the tail. shins are the lower leg segments, dark wherever the paw is."""
    def fn(p, n):
        c = mixc(F[0], F[1], max(0.0, n.z - 0.45) * 0.9)
        head = (p - H).length < 0.42 * s
        if head and (p.z < H.z - 0.04 * s or (p.x > H.x + 0.05 * s and n.z < 0.1)): c = F[2]  # cheeks and muzzle
        if not head and p.x > bib_x and n.x > 0.15 and abs(p.y) < 0.13 * s and bib_z[0] < p.z < min(bib_z[1], H.z - 0.08 * s): c = F[2]  # bib
        if n.z < -0.55: c = mixc(c, F[2], 0.7)
        if p.z < low: c = mixc(F[3], c, max(0.0, (p.z - low + 0.12) / 0.12) if p.z > low - 0.12 else 0.0)  # stockings
        if any(seg_dist(p, a, b) < 0.085 for a, b in shins): c = F[3]
        if tail_tip and (p - tail_tip).length < 0.22 * s: c = F[2]
        return c
    return fn


def tail_path(pts, n=14):
    at, _ = along(pts)
    return [at(k / (n - 1))[0] for k in range(n)]


def fox_tail(name, pts, r, F, s=1.0):
    """The brush: fused balls along the path, swelling past the root and drawn to a point, fluffed, the tip pale."""
    path = tail_path(pts)
    m = len(path) - 1
    parts = [("ball", tuple(p), r * (0.45 + 1.1 * math.sin(math.pi * min(1.0, k / m * 0.92 + 0.08)) ** 0.8) * (1 - 0.6 * (k / m) ** 3))
             for k, p in enumerate(path)]
    o = blob(name, parts, 0.022 * s, 6000)
    fluff(o, 0.03 * s, 9.0, 3.0)
    tip = path[-1]
    paint(o, lambda p, n: F[2] if (p - tip).length < 0.3 * s else mixc(F[0], F[1], max(0.0, n.z - 0.3) * 0.7))
    o.data.materials.append(vmat("fur", 0.85))
    return path


def fox_growth(rng, el, S, F, lt, spine, tail, s=1.0):
    """What the element does to the fox, as it does to the Shellback's shell: fire's tail burns at the tip, water's
    trails a ribbon of water, wood's ruff and tail grow leaves and small flowers, metal wears engraved plates on its
    shoulders and a blade crest down its tail, earth breaks out in amber crystals along its spine."""
    tip, d_tip = tail[-1], (tail[-1] - tail[-3]).normalized()
    if el == "fire":
        hot = (((1.0, 0.85, 0.4), 0.85, 0.5), ((1.0, 0.45, 0.08), 0.45, 1.0))
        for k, (dx, dy) in enumerate(((0, 0), (0.06, 0.05), (-0.05, -0.05))):
            flame("tailfire", tip + Vector((dx, dy, 0)) * s, (d_tip + Vector((0, 0, 1.4))).normalized(), (0.42 - 0.12 * k) * s, hot)
        glow = solid("ember", (1.0, 0.5, 0.1), 0.5, 4.0)
        for p in tail[-5:-1]: ball("cinder", glow, p + Vector((rng.gauss(0, 0.08), rng.gauss(0, 0.08), 0.12)) * s, 0.025 * s, seg=8)
    elif el == "water":
        o = ribbon("tailstream", rng, (tip.x, tip.y), (0.22 * s, 0.22 * s), tip.z - 0.1 * s, tip.z + 0.5 * s, 0.0, 1.2, 0.06 * s)
        drop = solid("droplet", (0.7, 0.93, 1.0), 0.02, 0.6, alpha=0.7)
        for p in spine + tail[::2]:
            ball("bead", drop, p + Vector((rng.gauss(0, 0.05), rng.gauss(0, 0.05), 0.12)) * s, rng.uniform(0.018, 0.03) * s, (1, 1, 0.7), 10)
    elif el == "wood":
        greens = [solid(f"leaf{i}", c, 0.7, 0.1) for i, c in enumerate(((0.3, 0.55, 0.16), (0.48, 0.68, 0.2)))]
        petal, heart = solid("petal", (0.97, 0.95, 0.9), 0.6, 0.2), solid("heart", (0.9, 0.7, 0.2), 0.6)
        for i, p in enumerate(spine[:3] + tail[2::2]):  # leaf sprays on the ruff and along the brush
            for k in range(3):
                q = ball("leaf", greens[(i + k) % 2], p + Vector((rng.gauss(0, 0.07), rng.gauss(0, 0.07), 0.13 + 0.03 * k)) * s,
                         0.065 * s, (1.6, 0.7, 0.18), 8)
                q.rotation_euler = (rng.uniform(-0.7, 0.7), rng.uniform(-0.7, 0.7), rng.uniform(0, 6.3))
            if i % 2 == 0:
                c = p + Vector((0, -0.05, 0.17)) * s
                for k in range(5):
                    a = k * 2 * math.pi / 5
                    ball("petal", petal, c + Vector((math.cos(a), math.sin(a), 0)) * 0.035 * s, 0.035 * s, (1.3, 0.8, 0.35), 8).rotation_euler = (0, 0, a)
                ball("heart", heart, c + Vector((0, 0, 0.01)) * s, 0.02 * s, seg=8)
    elif el == "metal":
        plate, rivet = solid("pauldron", (0.8, 0.82, 0.86), 0.25, 0.3, 0.9), solid("rivet", GOLD, 0.25, 0.4, 1.0)
        blade = solid("blade", (0.86, 0.88, 0.92), 0.15, 0.6, 1.0)
        for p in spine[:2]:  # plates over each shoulder
            for side in (1, -1):
                o = ball("pauldron", plate, p + Vector((0.02, side * 0.12, -0.02)) * s, 0.13 * s, (1.1, 0.5, 0.75), 20)
                o.rotation_euler = (side * 0.6, 0, 0)
                ball("rivet", rivet, p + Vector((0.02, side * 0.18, 0.04)) * s, 0.022 * s, seg=10)
        for k, p in enumerate(tail[3:-2:2]):
            d = (tail[min(len(tail) - 1, 4 + 2 * k)] - p).normalized()
            up = Vector((0, 0, 1)) - d * d.z
            bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.09 * s, depth=0.2 * s)
            o = bpy.context.active_object; o.scale = (1.0, 0.12, 1.0); o.data.materials.append(blade)
            o.location = p + up.normalized() * 0.17 * s
            o.rotation_euler = Vector((0, 0, 1)).rotation_difference(up).to_euler()
    elif el == "earth":
        amber = solid("amber", (1.0, 0.62, 0.12), 0.12, 3.5)
        for p in spine[1:] + tail[3:8:2]:
            for k in range(rng.randint(2, 4)):
                h, r = s * rng.uniform(0.1, 0.22), s * rng.uniform(0.025, 0.045)
                tilt = Vector((rng.gauss(0, 0.35), rng.gauss(0, 0.35), 1)).normalized()
                at = p + Vector((0, 0, 0.08)) * s
                bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=r, depth=h, location=at + tilt * h * 0.45)
                o = bpy.context.active_object; o.data.materials.append(amber)
                o.rotation_euler = Vector((0, 0, 1)).rotation_difference(tilt).to_euler()
                bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r, depth=r * 1.8, location=at + tilt * (h * 0.95 + r * 0.9))
                o = bpy.context.active_object; o.data.materials.append(amber)
                o.rotation_euler = Vector((0, 0, 1)).rotation_difference(tilt).to_euler()


def fox_face(body, H, S, F, s, r):
    """The fox's eyes, nose and mouth, on the shared lidded eye, its lids in the coat's colour."""
    lids = dict(S, skin=F[0], spot=F[1])
    for side in (1, -1):
        # round 8 look (Wendell: "the eyes are a little too close together"): each eye moved out to the side of the
        # skull and turned a little further out
        eye(body, H + Vector((0.07, side * 0.055, 0.04)) * s, (0.4, side * 0.88, 0.2), lids, r)
    tip = H + Vector((0.37, 0, -0.07)) * s
    hit, loc, _, _ = body.ray_cast(tip + Vector((1, 0, 0)), Vector((-1, 0, 0)))
    ball("nose", solid("nose", (0.04, 0.035, 0.035), 0.3), (loc if hit else tip), 0.032 * s, (1.0, 1.15, 0.8), 16)
    return mouth_seam(body, H + Vector((0.18, 0, 0)) * s, H.z - 0.105 * s, 55, 0.02 * s, 0.006 * s)


def bagua_on(lt, at, facing, r, glow=2.6):
    """The core's yin-yang and trigrams, flat, standing at `at` and facing `facing`."""
    em = emblem("core", r, lt, glow, 48)
    em.location = at; em.rotation_euler = Vector((0, 0, 1)).rotation_difference(Vector(facing).normalized()).to_euler()
    return em


def token(lt, S, at, r):
    """Round 8 look (Wendell: "the bagua element is cute but doesn't play well with the fox fur"): the Romp carries its
    core off the fur, as a jade token hung from its beads with the yin-yang and trigrams on its face, turned to the
    sprite camera."""
    face = (CAM_DIR + Vector((0, 0, 0.2))).normalized()
    rot = Vector((0, 0, 1)).rotation_difference(face).to_euler()
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=r, depth=r * 0.22, location=at, rotation=rot)
    o = bpy.context.active_object; o.name = "token"; o.data.materials.append(jade_of(lt)); smooth(o)
    bagua_on(mixc(lt, (1, 1, 1), 0.25), Vector(at) + face * r * 0.13, face, r * 0.85)
    tassel(Vector(at) - Vector((0, 0, r * 1.1)), S["tassel"], 0.6)


def stand(legs):
    """Name four (top, middle, foot) leg chains, fore pair first then hind, near (-Y, right) before far, in the cave
    avatar's joint names, and check they stand: every foot on the ground and the pairs mirrored across the spine."""
    out = {}
    for k, (a, b, c) in enumerate(legs):
        side = "R" if a[1] < 0 else "L"
        names = ("shoulder", "elbow", "wrist") if k < 2 else ("hip", "knee", "ankle")
        for n, q in zip(names, (a, b, c)):
            out[n + side] = [round(x, 4) for x in q]
    for n in ("shoulder", "elbow", "wrist", "hip", "knee", "ankle"):
        l, r = out[n + "L"], out[n + "R"]
        assert abs(l[0] - r[0]) < 1e-6 and abs(l[1] + r[1]) < 1e-6 and abs(l[2] - r[2]) < 1e-6, f"{n} not mirrored"
    for n in ("wristL", "wristR", "ankleL", "ankleR"):
        assert out[n][2] <= 0.09, f"{n} off the ground"
    return out


def fox_creature(sc, el, lt, dk):
    """The living fox, standing square on all four paws, head up, its brush curled high behind it, in its element.
    Round 11 (Wendell, 2026-10-14, on the otter: the legs must suit "moving and rigging and animations"): every Romp
    living creature stands on its own four feet, so the near forepaw that was lifted mid-step is down, the mirror of
    the far one."""
    S, F = STYLE[el], FUR[el]
    lights(sc)
    rng = random.Random(f"creature-fox-{el}")
    H = Vector((0.92, 0, 1.12))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.62, 0, 0.9)), Vector((0.6, 0, 0.8)), 0.15)
    parts = fox_head(H, 1.15) + [("cap", (0.5, 0, 0.72), (0.82, 0, 1.04), 0.14),     # neck
                           ("ell", (0.32, 0, 0.66), 0.25, (1.2, 0.85, 1.0)),  # chest
                           ("cap", (0.25, 0, 0.64), (-0.4, 0, 0.64), 0.19),   # body
                           ("ell", (-0.45, 0, 0.64), 0.23, (1.1, 0.95, 0.95))]  # haunch
    legs = [((0.38, -0.13, 0.55), (0.42, -0.15, 0.25), (0.47, -0.15, 0.04)),
            ((0.38, 0.13, 0.55), (0.42, 0.15, 0.25), (0.47, 0.15, 0.04)),
            ((-0.48, -0.15, 0.52), (-0.65, -0.17, 0.25), (-0.55, -0.17, 0.04)),
            ((-0.48, 0.15, 0.52), (-0.65, 0.17, 0.25), (-0.55, 0.17, 0.04))]
    for a, b, c in legs:
        parts += [("cap", a, b, 0.075), ("cap", b, c, 0.055), ("ell", tuple(Vector(c) + Vector((0.05, 0, 0))), 0.065, (1.4, 0.95, 0.6))]
    parts += [("ell", (-0.45, -0.13, 0.56), 0.17, (1.2, 0.7, 1.1)), ("ell", (-0.45, 0.13, 0.56), 0.17, (1.2, 0.7, 1.1))]  # thighs
    LEGS.update(stand(legs))
    body = blob("body", parts, 0.024, 14000)
    fluff(body, 0.008, 16.0)
    tail = fox_tail("tail", [(-0.62, 0, 0.72), (-0.98, 0, 0.84), (-1.22, 0.04, 1.12), (-1.24, 0.1, 1.48), (-1.05, 0.14, 1.7)], 0.17, F)
    seam = fox_face(body, H, S, F, 1.15, 0.068)
    fn = fox_paint(H, F, 1.15, None, shins=[(b, c) for a, b, c in legs])
    paint(body, lambda p, n: mixc(fn(p, n), (0.06, 0.05, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("fur", 0.85))
    fox_ears(H, F, 1.15)
    drape("scarf", (0.66, 0, 0.94), (-0.55, 0, -0.85), 0.16, 0.22, 0.2, S["cloth"], S["trim"], f"scarf-{el}", 0.6)
    beads((0.7, 0, 0.9), (0.6, 0, 0.8), 0.18, 14, 0.08, 3, lt, S)
    ball("bell", solid("gold", GOLD, 0.35), (0.84, 0.1, 0.68), 0.06)
    token(lt, S, (0.86, -0.1, 0.66), 0.09)
    fox_growth(rng, el, S, F, lt, [Vector((0.5, 0, 0.92)), Vector((0.15, 0, 0.88)), Vector((-0.2, 0, 0.86)), Vector((-0.5, 0, 0.86))], tail)
    aura(rng, S["aura"], lt, (0.0, 0, 0.75), (1.4, 0.8, 0.7), 1.75)



def wanderer(S, lt, el, hand, name, dz=0.0, w=1.0, ink=True, beads_at=(0.05, 0, 1.68)):
    """The Romp's upright outfit. Round 8 look (Wendell: "we want a different outfit for the fox so the upright figures
    don't collide visually with the protectors"): no robe, shawl, medallion or staff. The Romp dresses as a wanderer: a
    short tunic over bare legs, a sash with long ends, a scarf whose tail flies back, a satchel on a strap, and a paper
    lantern of fox-fire on a short pole in place of the staff, the core's yin-yang drawn on its face (ink). dz moves it
    up or down to the body's neck and waist, w widens it to the body's girth; hand holds the lantern pole."""
    Z = Vector((0, 0, dz))
    v = lambda x, y, z: Vector((x * w, y * w, z)) + Z
    drape("tunic", v(0.02, 0, 1.46), (0, 0, -1), 0.3 * w, 0.4 * w, 0.5, S["cloth"], S["trim"], f"tunic-{name}-{el}", 0.3)
    sash = solid("sash", S["trim"], 0.8)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.29 * w, minor_radius=0.045, major_segments=40, minor_segments=8, location=v(0.02, 0, 1.12))
    o = bpy.context.active_object; o.scale = (1, 1, 0.9); o.data.materials.append(sash); smooth(o)
    for k, d in enumerate((0.0, 0.05)):  # the sash's two long ends at the far hip
        ball("sashend", sash, v(0.12 - 0.04 * k, 0.27, 0.96 - 0.12 * k - d), 0.06, (0.6, 0.25, 2.2), 12).rotation_euler = (0.2 * k, 0.15, 0)
    drape("scarf", v(0.05, 0, 1.74), (0.25, 0, -1), 0.14 * w, 0.22 * w, 0.16, S["cloth"], S["trim"], f"scarf-{name}-{el}", 0.5)
    tail_ = ball("scarftail", solid("scarftail", mixc(S["cloth"], S["trim"], 0.3), 0.9), v(-0.22, -0.12, 1.66), 0.13, (1.8, 0.25, 0.5), 16)
    tail_.rotation_euler = (0.3, 0.25, 0.35)
    leather = solid("leather", (0.36, 0.22, 0.12), 0.7)
    bpy.ops.mesh.primitive_cube_add(size=1, location=v(0.0, -0.36, 1.0)); o = bpy.context.active_object
    o.scale = (0.24, 0.08, 0.18); o.rotation_euler = (0, 0, 0.1); o.data.materials.append(leather)
    bev = o.modifiers.new("b", "BEVEL"); bev.width = 0.03; bev.segments = 3; apply_mods(o); smooth(o)
    tube("strap", [v(0.0, -0.36, 1.1), v(0.2, -0.22, 1.35), v(0.22, 0.0, 1.55), v(0.12, 0.22, 1.68), v(-0.08, 0.26, 1.62)], 0.018, leather)
    beads(v(*beads_at), (0.15, 0, 1), 0.2 * w, 14, 0.08, 3, lt, S)
    col, rough, metal = S["staff"]
    h = hand  # the near hand holds the lantern pole forward and up
    tip = h + Vector((0.4, -0.1, 0.5))
    tube("pole", [h - (tip - h) * 0.15, tip], 0.022, solid("pole", col, rough, metal=metal))
    lamp_at = tip - Vector((0, 0, 0.3))
    tube("hook", [tip, tip + Vector((0.02, 0, -0.02)), lamp_at + Vector((0, 0, 0.13))], 0.006, solid("cord", (0.15, 0.1, 0.07), 0.8))
    ball("lantern", solid("lantern", mixc(lt, (1, 0.96, 0.85), 0.35), 0.5, 3.0, alpha=0.9), lamp_at, 0.16, (1, 1, 1.2), 24)
    rim = solid("rim", (0.12, 0.08, 0.06), 0.6)
    for d in (0.185, -0.185):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.075, minor_radius=0.018, major_segments=20, minor_segments=6, location=lamp_at + Vector((0, 0, d)))
        bpy.context.active_object.data.materials.append(rim)
    if ink:
        face = (CAM_DIR + Vector((0, 0, 0.1))).normalized()
        bagua_on((0.15, 0.08, 0.05), lamp_at + face * 0.162, face, 0.11, 0.0)  # drawn in ink on the paper
    tassel(lamp_at - Vector((0, 0, 0.24)), S["tassel"], 0.6)

def fox_ascended(sc, el, lt, dk):
    """The fox's highest ally form: standing upright in a long robe, staff in hand, its core worn as a medallion over
    its heart, its brush sweeping out behind it and up."""
    S, F = STYLE[el], FUR[el]
    lights(sc)
    rng = random.Random(f"ascended-fox-{el}")
    s = 0.9
    H = Vector((0.16, 0, 2.02))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.05, 0, 1.74)), Vector((0.2, 0, 1)), 0.13)
    parts = fox_head(H, s) + [("cap", (0.0, 0, 1.55), (0.1, 0, 1.92), 0.11), ("cap", (0, 0, 0.95), (0, 0, 1.5), 0.26),
                              ("ball", (0, 0, 0.9), 0.27), ("cap", (0, -0.28, 1.52), (0, 0.28, 1.52), 0.12)]
    hands = []
    for side in (-1, 1):
        sh, el_, hd = Vector((0, side * 0.36, 1.5)), Vector((0.08, side * 0.44, 1.13)), Vector((0.3, side * 0.38, 0.96))
        parts += [("cap", sh, el_, 0.08), ("cap", el_, hd, 0.07), ("ball", hd + Vector((0.04, 0, 0)), 0.08)]
        hands.append(hd + Vector((0.04, 0, 0)))
    for y in (-0.17, 0.17):
        parts += [("cap", (0, y, 0.85), (0.04, y, 0.1), 0.11), ("ell", (0.1, y, 0.05), 0.11, (1.5, 0.9, 0.5))]
    body = blob("body", parts, 0.022, 14000)
    fluff(body, 0.007, 16.0)
    tail = fox_tail("tail", [(-0.2, 0, 0.85), (-0.6, 0, 0.55), (-0.95, -0.1, 0.45), (-1.15, -0.2, 0.75), (-1.1, -0.25, 1.15)], 0.15, F, s)
    seam = fox_face(body, H, S, F, s, 0.05)
    fn = fox_paint(H, F, s, None, 0.42, -0.5, (1.6, 9.0))
    paint(body, lambda p, n: mixc(fn(p, n), (0.06, 0.05, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("fur", 0.85))
    fox_ears(H, F, s)
    wanderer(S, lt, el, hands[0], "fox")
    fox_growth(rng, el, S, F, lt, [Vector((0.0, 0, 1.78)), Vector((-0.06, 0, 1.6))], tail, s)
    aura(rng, S["aura"], lt, (-0.2, 0, 1.15), (0.9, 0.8, 1.0), 2.35)


# Round 9: the Romp's second base, the otter, built from its image prompt (council/loops/prompts/spirit-generator-r8.md
# in the council's repo; no concept sheet exists yet): a broad flat skull, a blunt whiskered muzzle with a wide dark
# nose, small round ears set low, a pale throat, a long sleek body on short legs with webbed paws, and a thick tail that
# tapers to a point. It plays the way otters do, rolled half onto its back on a river stone with its forepaws curled
# round the core. It shares the fox's gas and jewel core, and, after Wendell's look at round 8, the Romp's wanderer
# outfit when it stands, and a jade token for its core (never a robe, a staff or a mark on the fur).
OTTER = {  # coat, saddle (darker along the back), pale (throat, cheeks, muzzle), paw
    "wood":  ((0.42, 0.36, 0.2), (0.27, 0.24, 0.12), (0.86, 0.82, 0.62), (0.16, 0.14, 0.08)),
    "fire":  ((0.5, 0.2, 0.09), (0.3, 0.1, 0.05), (0.95, 0.78, 0.55), (0.1, 0.05, 0.04)),
    "water": ((0.22, 0.38, 0.5), (0.11, 0.2, 0.32), (0.82, 0.92, 0.94), (0.06, 0.1, 0.18)),
    "metal": ((0.55, 0.57, 0.62), (0.3, 0.32, 0.38), (0.93, 0.93, 0.95), (0.12, 0.12, 0.15)),
    "earth": ((0.5, 0.33, 0.17), (0.32, 0.2, 0.09), (0.92, 0.8, 0.58), (0.18, 0.11, 0.05)),
}


def otter_head(H, s=1.0, turn=0.0):
    """Metaball parts for the otter's head: a broad flat skull and a short blunt muzzle with two fat whisker pads.
    turn swings the muzzle round toward the camera's side."""
    R = Matrix.Rotation(turn, 3, "Z")
    v = lambda x, y, z: H + R @ Vector((x, y, z)) * s
    return [("ell", v(0, 0, 0), 0.155 * s, (1.05, 1.3, 0.72))] + \
        taper(v, (0.08, 0, -0.03), (0.2, 0, -0.045), 0.1 * s, 0.075 * s, (1.0, 1.25, 0.8), (0.9, 1.3, 0.75), 6) + \
        [("ball", v(0.2, 0.05, -0.055), 0.048 * s), ("ball", v(0.2, -0.05, -0.055), 0.048 * s)]


def otter_bits(body, H, S, F, s, r, turn=0.0):
    """The otter's eyes (small, high and forward on the flat skull), its wide nose, its whiskers and its small round
    ears set low on the sides of the head. Returns the mouth seam."""
    R = Matrix.Rotation(turn, 3, "Z")
    at = lambda x, y, z: H + R @ Vector((x, y, z)) * s
    lids = dict(S, skin=F[0], spot=F[1])
    for side in (1, -1):
        eye(body, at(0.075, side * 0.075, 0.04), R @ Vector((0.5, side * 0.85, 0.35)), lids, r)
    tip = at(0.27, 0, -0.035)
    fwd = R @ Vector((1, 0, 0))
    hit, loc, _, _ = body.ray_cast(tip + fwd, -fwd)
    nose = ball("nose", solid("nose", (0.04, 0.035, 0.035), 0.3), (loc if hit else tip), 0.036 * s, (0.8, 1.6, 0.85), 16)
    nose.rotation_euler = (0, 0, turn)
    ear = solid("ear", mixc(F[0], F[3], 0.4), 0.85)
    for side in (1, -1):
        o = ball("ear", ear, at(-0.05, side * 0.19, 0.025), 0.03 * s, (0.65, 0.4, 0.7), 16)
        o.rotation_euler = (0, 0, turn)
    white = solid("whisker", (0.95, 0.93, 0.88), 0.4)
    for side in (1, -1):
        for k in range(3):
            root = at(0.21, side * 0.07, -0.05 - 0.012 * k)
            tube("whisker", [root, root + R @ Vector((0.05, side * 0.13, 0.03 - 0.03 * k)) * s,
                             root + R @ Vector((0.03, side * 0.24, -0.01 - 0.05 * k)) * s], 0.0025 * s, white)
    return mouth_seam(body, at(0.12, 0, 0), H.z - 0.085 * s, 50, 0.015 * s, 0.005 * s)


def otter_paint(H, F, s, pale, low=-9.0):
    """The otter's coat: the element's colour, darker along the back, a pale throat, cheeks and muzzle, dark paws
    below low. pale(p, n) says where else the pale fur goes (the throat and chest)."""
    def fn(p, n):
        c = mixc(F[0], F[1], max(0.0, -n.z - 0.2) * 0.8)
        head = (p - H).length < 0.36 * s
        if head and p.z < H.z - 0.035 * s: c = F[2]  # cheeks, chin and muzzle
        if not head and pale(p, n): c = mixc(F[2], F[0], 0.15)
        if p.z < low: c = F[3]
        return c
    return fn


def otter_tail(name, pts, r, F, s=1.0):
    """The rudder: thick at the root and tapering evenly to a point, sleek, darker on top."""
    path = tail_path(pts, 12)
    m = len(path) - 1
    o = blob(name, [("ball", tuple(p), r * (1 - 0.82 * (k / m) ** 0.9)) for k, p in enumerate(path)], 0.02 * s, 5000)
    paint(o, lambda p, n: mixc(F[0], F[1], max(0.0, n.z) * 0.6))
    o.data.materials.append(vmat("fur", 0.55))
    return path


def otter_hologram(lt, dk):
    """The projected otter: a long low faceted body of light, a broad flat head, short legs, a thick tapering tail."""
    skin = mat("holo", lt, 1.1, 0.32, scan=True)
    edge = mat("edge", lt, 2.2, 0.9)
    deep = mat("deep", lt, 0.9, 0.22, scan=True)

    def traced(o):
        w = o.copy(); w.data = o.data.copy(); bpy.context.scene.collection.objects.link(w)
        w.data.materials.clear(); w.data.materials.append(edge)
        md = w.modifiers.new("w", "WIREFRAME"); md.thickness = 0.018; md.use_replace = True
    body = obj_from(bpy.ops.mesh.primitive_uv_sphere_add, "body", skin, segments=8, ring_count=6, radius=1.0, location=(-0.05, 0, 0.32))
    body.scale = (0.85, 0.27, 0.24); body.rotation_euler = (0, -0.12, 0); traced(body)
    head = obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "head", skin, subdivisions=1, radius=0.19, location=(0.86, 0, 0.82))
    head.scale = (1.1, 1.15, 0.78); traced(head)
    obj_from(bpy.ops.mesh.primitive_cylinder_add, "neck", skin, vertices=6, radius=0.17, depth=0.3,
             location=(0.7, 0, 0.6), rotation=(0, 0.75, 0))
    traced(obj_from(bpy.ops.mesh.primitive_cone_add, "snout", skin, vertices=6, radius1=0.12, radius2=0.08, depth=0.16,
                    location=(1.06, 0, 0.78), rotation=(0, math.pi / 2 + 0.15, 0)))
    for side in (1, -1):
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "ear", skin, subdivisions=1, radius=0.045, location=(0.8, side * 0.2, 0.88))
    for x, y in ((0.5, 0.15), (0.5, -0.15), (-0.55, 0.15), (-0.55, -0.15)):
        obj_from(bpy.ops.mesh.primitive_cylinder_add, "leg", deep, vertices=5, radius=0.065, depth=0.3, location=(x, y, 0.0))
    at, _ = along([(-0.8, 0, 0.3), (-1.15, 0, 0.12), (-1.45, 0.05, 0.05), (-1.7, 0.12, 0.1)])
    for k in range(4):  # the tail, in four facets, tapering to a point
        t0, t1 = k / 4, (k + 1) / 4
        p0, p1 = at(t0)[0], at(t1)[0]
        r0, r1 = (0.17, 0.13, 0.09, 0.05)[k], (0.13, 0.09, 0.05, 0.01)[k]
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=r0, radius2=r1, depth=(p1 - p0).length, location=(p0 + p1) / 2)
        o = bpy.context.active_object; o.name = "tail"; o.data.materials.append(skin)
        o.rotation_euler = Vector((0, 0, 1)).rotation_difference(p1 - p0).to_euler(); traced(o)
    eye_ = mat("eye", (1, 1, 1), 9.0, 1.0)
    for y in (0.09, -0.09):
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "eye", eye_, subdivisions=1, radius=0.032, location=(0.99, y, 0.88))
    ring = mat("ring", lt, 2.0, 0.7)
    obj_from(bpy.ops.mesh.primitive_torus_add, "projector", ring, major_radius=1.45, minor_radius=0.018,
             major_segments=48, minor_segments=4, location=(0, 0, -0.22))
    romp_core(lt, at=(0, 0, 0.32), size=0.15)


def otter_creature(sc, el, lt, dk):
    """The living otter, standing on its four short legs on the ground: the long low body arched a little over the
    hips, head up and looking ahead, its thick tail running out behind, its core as a jade token hung from its beads.
    Round 11 (Wendell, 2026-10-14: "Otters body is all jacked up. The legs point in strange ways ... The rock is also
    strange ... this will create issues with having it move and rigging and animations"): no stone and nothing in its
    paws, legs in mirrored chains a quadruped rig can walk."""
    S, F = STYLE[el], OTTER[el]
    lights(sc)
    rng = random.Random(f"creature-otter-{el}")
    H = Vector((0.86, 0, 0.71))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.56, 0, 0.55)), Vector((0.86, 0, 0.51)), 0.15)
    s = 1.1
    parts = otter_head(H, s) + [("cap", (0.42, 0, 0.47), (0.76, 0, 0.66), 0.14),  # neck, thick as the head
                                ("cap", (0.36, 0, 0.41), (-0.48, 0, 0.44), 0.19),  # the long low body
                                ("ell", (0.3, 0, 0.41), 0.2, (1.15, 1.0, 1.0)),  # chest
                                ("ell", (-0.48, 0, 0.46), 0.21, (1.15, 1.05, 0.95))]  # hips, the back arched over them
    legs = [((0.34, -0.13, 0.34), (0.3, -0.14, 0.19), (0.36, -0.14, 0.06)),  # forelegs, short and straight
            ((0.34, 0.13, 0.34), (0.3, 0.14, 0.19), (0.36, 0.14, 0.06)),
            ((-0.5, -0.15, 0.37), (-0.59, -0.16, 0.18), (-0.5, -0.16, 0.06)),  # hind legs, the hock behind
            ((-0.5, 0.15, 0.37), (-0.59, 0.16, 0.18), (-0.5, 0.16, 0.06))]
    LEGS.update(stand(legs))
    for a, b, c in legs:
        parts += [("cap", a, b, 0.07), ("cap", b, c, 0.055)]
    for a, b, c in legs[:2]:  # small round forepaws, flat on the ground
        parts.append(("ell", tuple(Vector(c) + Vector((0.035, 0, -0.01))), 0.06, (1.3, 1.0, 0.55)))
    for a, b, c in legs[2:]:  # webbed hind feet, broad and flat, soles down
        parts.append(("ell", tuple(Vector(c) + Vector((0.06, 0, -0.015))), 0.07, (1.6, 1.0, 0.45)))
    parts += [("ell", (-0.47, -0.12, 0.36), 0.15, (1.2, 0.7, 1.1)), ("ell", (-0.47, 0.12, 0.36), 0.15, (1.2, 0.7, 1.1))]  # thighs
    body = blob("body", parts, 0.022, 15000)
    tail = otter_tail("tail", [(-0.64, 0, 0.44), (-0.98, 0, 0.36), (-1.26, 0, 0.25), (-1.46, 0, 0.15), (-1.58, 0, 0.09)], 0.15, F)
    seam = otter_bits(body, H, S, F, s, 0.045)
    fn = otter_paint(H, F, s, lambda p, n: p.x > 0.2 and n.x > 0.15 and n.z < 0.5 and p.z > 0.22, low=0.12)
    paint(body, lambda p, n: mixc(fn(p, n), (0.06, 0.05, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("fur", 0.55))
    drape("scarf", (0.53, 0, 0.57), (-0.7, 0, -0.7), 0.17, 0.23, 0.18, S["cloth"], S["trim"], f"scarf-otter-{el}", 0.6)
    beads((0.57, 0, 0.56), (0.86, 0, 0.51), 0.19, 14, 0.06, 3, lt, S)
    token(lt, S, (0.7, -0.1, 0.35), 0.1)  # hung from the beads at its chest, as the fox wears it
    otter_growth = [Vector((0.42, 0, 0.63)), Vector((0.12, 0, 0.61)), Vector((-0.2, 0, 0.61)), Vector((-0.5, 0, 0.65))]
    fox_growth(rng, el, S, F, lt, otter_growth, tail)
    aura(rng, S["aura"], lt, (-0.1, 0, 0.38), (1.55, 0.85, 0.5), 1.15)


def otter_ascended(sc, el, lt, dk):
    """The otter's highest ally form: standing upright on short legs, propped on its thick tail, in the Romp's
    wanderer outfit with the lantern in its near hand and its core held to its chest as a jade token."""
    S, F = STYLE[el], OTTER[el]
    lights(sc)
    rng = random.Random(f"ascended-otter-{el}")
    s = 0.95
    H = Vector((0.12, 0, 1.92))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.04, 0, 1.64)), Vector((0.15, 0, 1)), 0.15)
    parts = otter_head(H, s) + [("cap", (0.0, 0, 1.45), (0.08, 0, 1.84), 0.15), ("cap", (0, 0, 0.78), (0, 0, 1.42), 0.29),
                                ("ball", (0, 0, 0.72), 0.31), ("cap", (0, -0.27, 1.4), (0, 0.27, 1.4), 0.12)]
    near = [Vector((0, -0.34, 1.38)), Vector((0.08, -0.42, 1.03)), Vector((0.3, -0.36, 0.88))]  # holds the lantern
    far = [Vector((0, 0.34, 1.38)), Vector((0.22, 0.3, 1.1)), Vector((0.4, 0.04, 1.2))]  # holds the token to the chest
    for sh, el_, hd in (near, far):
        parts += [("cap", sh, el_, 0.085), ("cap", el_, hd, 0.07), ("ball", hd + Vector((0.03, 0, 0)), 0.07)]
    for y in (-0.16, 0.16):  # short legs, broad webbed feet
        parts += [("cap", (0, y, 0.6), (0.04, y, 0.1), 0.12), ("ell", (0.12, y, 0.05), 0.11, (1.6, 1.1, 0.45))]
    body = blob("body", parts, 0.022, 15000)
    tail = otter_tail("tail", [(-0.22, 0, 0.6), (-0.5, 0, 0.3), (-0.82, -0.08, 0.1), (-1.12, -0.18, 0.06)], 0.17, F, s)
    seam = otter_bits(body, H, S, F, s, 0.042)
    fn = otter_paint(H, F, s, lambda p, n: n.x > 0.3 and abs(p.y) < 0.17 and 1.3 < p.z < H.z, 0.14)
    paint(body, lambda p, n: mixc(fn(p, n), (0.06, 0.05, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("fur", 0.55))
    wanderer(S, lt, el, near[2] + Vector((0.03, 0, 0)), "otter", dz=-0.1, w=1.08, ink=False, beads_at=(0.05, 0, 1.7))
    token(lt, S, far[2] + Vector((0.1, -0.1, 0.0)), 0.12)
    fox_growth(rng, el, S, F, lt, [Vector((0.0, 0, 1.68)), Vector((-0.08, 0, 1.5))], tail, s)
    aura(rng, S["aura"], lt, (-0.2, 0, 1.1), (0.95, 0.8, 1.0), 2.25)


# Round 10: the Romp's third base, the kid goat, built from its image prompt (council/loops/prompts/spirit-generator-r8.md
# in the council's repo; no concept sheet exists yet): a short straight muzzle, two small horn buds, long floppy ears
# held out sideways, goat eyes with a bar of a pupil across an amber iris, a small beard tuft, a short soft coat in
# cream with patches, slim legs on small black hooves, and a short upright tail. It plays the way kids do, caught
# mid-leap off a small rock with all four hooves in the air. It shares the Romp's gas and jewel core and, when it
# stands, the wanderer outfit; its core is the prompt's brass bell, engraved with the yin-yang and trigrams (never a
# mark on the coat).
GOAT = {  # coat (cream), patch (the element's fawn), pale (muzzle, inner ear), hoof
    "wood":  ((0.9, 0.87, 0.7), (0.5, 0.47, 0.2), (0.97, 0.95, 0.86), (0.07, 0.06, 0.05)),
    "fire":  ((0.96, 0.85, 0.68), (0.78, 0.34, 0.12), (0.99, 0.94, 0.84), (0.07, 0.05, 0.04)),
    "water": ((0.86, 0.9, 0.92), (0.3, 0.46, 0.6), (0.96, 0.98, 0.99), (0.05, 0.07, 0.1)),
    "metal": ((0.9, 0.9, 0.92), (0.46, 0.48, 0.54), (0.98, 0.98, 0.99), (0.08, 0.08, 0.1)),
    "earth": ((0.95, 0.86, 0.66), (0.66, 0.45, 0.2), (0.99, 0.94, 0.82), (0.1, 0.07, 0.04)),
}
AMBER = (0.86, 0.56, 0.12)


def goat_head(H, s=1.0):
    """Metaball parts for the kid's head: a rounded skull and a short straight muzzle, a little down from level."""
    v = lambda x, y, z: H + Vector((x, y, z)) * s
    return [("ell", v(0, 0, 0), 0.14 * s, (1.0, 0.9, 1.0))] + \
        taper(v, (0.07, 0, -0.045), (0.19, 0, -0.095), 0.092 * s, 0.062 * s, (1.1, 0.85, 0.95), (1.05, 0.85, 0.9), 6)


def goat_bits(body, H, S, F, s, r):
    """The kid's eyes (on the sides of the head, a bar of a pupil across an amber iris), its nose, horn buds, long
    floppy ears held out sideways and the tuft of its beard. Returns the mouth seam."""
    at = lambda x, y, z: H + Vector((x, y, z)) * s
    lids = dict(S, skin=F[0], spot=F[1])
    iris = mixc(S["iris"], AMBER, 0.7)
    for side in (1, -1):
        eye(body, at(0.05, side * 0.075, 0.035), (0.3, side * 0.92, 0.22), lids, r, bar=True, iris=iris)
    tip = at(0.26, 0, -0.09)
    hit, loc, _, _ = body.ray_cast(tip + Vector((1, 0, 0.3)), Vector((-1, 0, -0.3)).normalized())
    ball("nose", solid("nose", mixc(F[3], (0.4, 0.3, 0.3), 0.3), 0.35), (loc if hit else tip), 0.026 * s, (0.7, 1.5, 0.9), 16)
    horn = solid("horn", (0.24, 0.21, 0.18), 0.45)
    for side in (1, -1):  # two small horn buds, leaning back
        bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.032 * s, radius2=0.008 * s, depth=0.08 * s,
                                        location=at(-0.03, side * 0.05, 0.125), rotation=(-side * 0.15, -0.45, 0))
        o = bpy.context.active_object; o.name = "horn"; o.data.materials.append(horn); smooth(o)
    ear, inner = solid("ear", F[0], 0.85), solid("earinner", mixc(F[2], (0.9, 0.62, 0.58), 0.35), 0.85)
    for side in (1, -1):  # long, broad and floppy, held out sideways, the tips drooping, their insides turned forward
        o = ball("ear", ear, at(-0.04, side * 0.2, -0.01), 0.13 * s, (0.16, 1.0, 0.4), 20)
        o.rotation_euler = (side * 0.45, 0, side * 0.3)
        o = ball("earin", inner, at(-0.025, side * 0.19, -0.012), 0.11 * s, (0.1, 0.88, 0.3), 20)
        o.rotation_euler = (side * 0.45, 0, side * 0.3)
    o = ball("beard", solid("beard", mixc(F[0], F[1], 0.35), 0.9), at(0.17, 0, -0.17), 0.035 * s, (0.8, 0.8, 1.5), 12)
    o.rotation_euler = (0, -0.4, 0)  # the beard tuft at the chin
    return mouth_seam(body, at(0.15, 0, 0), H.z - 0.12 * s, 45, 0.012 * s, 0.005 * s)


def goat_paint(H, F, s, hooves, seed):
    """The kid's coat: cream, broken by patches of the element's fawn, a pale muzzle, and small black hooves."""
    off = Vector((seed, 0, 0))
    def fn(p, n):
        c = F[0]
        k = noise.noise(p * 3.2 + off) + 0.4 * noise.noise(p * 7.0 + off)
        if k > -0.12: c = mixc(F[0], F[1], min(1.0, (k + 0.12) / 0.08))  # soft-edged patches
        if (p - H).length < 0.3 * s and p.x > H.x + 0.12 * s: c = F[2]  # muzzle
        if any((p - h).length < 0.06 * s for h in hooves): c = F[3]
        return c
    return fn


def goat_tail(name, pts, r, F, s=1.0):
    """A short upright tail, soft and a little tufted."""
    path = tail_path(pts, 8)
    m = len(path) - 1
    o = blob(name, [("ball", tuple(p), r * (1 - 0.55 * (k / m))) for k, p in enumerate(path)], 0.018 * s, 2500)
    fluff(o, 0.01 * s, 18.0, 5.0)
    paint(o, lambda p, n: mixc(F[0], F[1], 0.5))
    o.data.materials.append(vmat("fur", 0.85))
    return path


def goat_bell(lt, S, at, r):
    """The kid's core, as its prompt gives it: a small brass bell on a cord, engraved with the yin-yang and trigrams,
    turned to the sprite camera, the engraving lit faintly in the element's colour."""
    brass = solid("brass", (0.86, 0.66, 0.3), 0.3, metal=1.0)
    at = Vector(at)
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=r, radius2=r * 0.62, depth=r * 1.1, location=at)
    o = bpy.context.active_object; o.name = "goatbell"; o.data.materials.append(brass); smooth(o)
    ball("bellcrown", brass, at + Vector((0, 0, r * 0.55)), r * 0.62, (1, 1, 0.8), 24)
    bpy.ops.mesh.primitive_torus_add(major_radius=r * 1.0, minor_radius=r * 0.1, major_segments=32, minor_segments=8,
                                     location=at - Vector((0, 0, r * 0.55)))
    bpy.context.active_object.data.materials.append(brass)
    ball("clapper", solid("clapper", (0.3, 0.22, 0.12), 0.4, metal=1.0), at - Vector((0, 0, r * 0.7)), r * 0.22, seg=12)
    bpy.ops.mesh.primitive_torus_add(major_radius=r * 0.22, minor_radius=r * 0.06, major_segments=16, minor_segments=6,
                                     location=at + Vector((0, 0, r * 1.05)), rotation=(math.pi / 2, 0, 0))
    bpy.context.active_object.data.materials.append(brass)
    face = (CAM_DIR + Vector((0, 0, 0.15))).normalized()
    bagua_on(mixc(lt, (1, 1, 1), 0.2), at + face * r * 0.86 - Vector((0, 0, r * 0.05)), face, r * 0.62, 1.4)


def goat_hologram(lt, dk):
    """The projected kid: a faceted body of light high on slim legs, a short muzzle, horn buds, ears out sideways,
    a short upright tail."""
    skin = mat("holo", lt, 1.1, 0.32, scan=True)
    edge = mat("edge", lt, 2.2, 0.9)
    deep = mat("deep", lt, 0.9, 0.22, scan=True)

    def traced(o):
        w = o.copy(); w.data = o.data.copy(); bpy.context.scene.collection.objects.link(w)
        w.data.materials.clear(); w.data.materials.append(edge)
        md = w.modifiers.new("w", "WIREFRAME"); md.thickness = 0.018; md.use_replace = True
    body = obj_from(bpy.ops.mesh.primitive_uv_sphere_add, "body", skin, segments=8, ring_count=6, radius=1.0, location=(0, 0, 0.62))
    body.scale = (0.6, 0.25, 0.27); traced(body)
    traced(obj_from(bpy.ops.mesh.primitive_cylinder_add, "neck", skin, vertices=6, radius=0.1, depth=0.42,
                    location=(0.52, 0, 0.88), rotation=(0, 0.55, 0)))
    head = obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "head", skin, subdivisions=1, radius=0.15, location=(0.7, 0, 1.1))
    head.scale = (1.05, 0.85, 0.95); traced(head)
    traced(obj_from(bpy.ops.mesh.primitive_cone_add, "snout", skin, vertices=6, radius1=0.09, radius2=0.055, depth=0.2,
                    location=(0.86, 0, 1.03), rotation=(0, math.pi / 2 + 0.35, 0)))
    for side in (1, -1):
        traced(obj_from(bpy.ops.mesh.primitive_cone_add, "ear", skin, vertices=4, radius1=0.05, depth=0.26,
                        location=(0.66, side * 0.22, 1.1), rotation=(-side * (math.pi / 2 - 0.25), 0, 0)))
        obj_from(bpy.ops.mesh.primitive_cone_add, "horn", skin, vertices=4, radius1=0.03, depth=0.09,
                 location=(0.66, side * 0.05, 1.26), rotation=(0, -0.45, 0))
    for x, y in ((0.4, 0.12), (0.4, -0.12), (-0.4, 0.12), (-0.4, -0.12)):
        obj_from(bpy.ops.mesh.primitive_cylinder_add, "leg", deep, vertices=5, radius=0.045, depth=0.66, location=(x, y, 0.13))
    traced(obj_from(bpy.ops.mesh.primitive_cone_add, "tail", skin, vertices=5, radius1=0.06, depth=0.2,
                    location=(-0.62, 0, 0.84), rotation=(0, -0.5, 0)))
    eye_ = mat("eye", (1, 1, 1), 9.0, 1.0)
    for y in (0.1, -0.1):
        obj_from(bpy.ops.mesh.primitive_ico_sphere_add, "eye", eye_, subdivisions=1, radius=0.03, location=(0.77, y, 1.14))
    ring = mat("ring", lt, 2.0, 0.7)
    obj_from(bpy.ops.mesh.primitive_torus_add, "projector", ring, major_radius=1.25, minor_radius=0.018,
             major_segments=48, minor_segments=4, location=(0, 0, -0.22))
    romp_core(lt, at=(0, 0, 0.62), size=0.15)


def goat_creature(sc, el, lt, dk):
    """The living kid, standing on its four slim legs with every hoof on the ground, head up, ears out, its brass bell
    at its throat. Round 11 (Wendell, 2026-10-14, on the otter's rock: it "will create issues with having it move and
    rigging and animations"): the mid-leap off a rock is gone with the otter's stone; the legs are mirrored chains, the
    forelegs straight down, the hind legs bending back at the hock the way a goat's do."""
    S, F = STYLE[el], GOAT[el]
    lights(sc)
    rng = random.Random(f"creature-goat-{el}")
    s = 1.05
    H = Vector((0.66, 0, 1.22))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.5, 0, 0.96)), Vector((0.45, 0, 0.9)), 0.11)
    parts = goat_head(H, s) + [("cap", (0.36, 0, 0.84), (0.6, 0, 1.14), 0.085),  # neck
                               ("ell", (0.3, 0, 0.82), 0.18, (1.15, 0.8, 1.0)),  # chest
                               ("cap", (0.28, 0, 0.82), (-0.3, 0, 0.74), 0.15),  # barrel
                               ("ell", (-0.34, 0, 0.74), 0.17, (1.1, 0.85, 1.0))]  # haunch
    legs = [((0.3, -0.1, 0.7), (0.31, -0.105, 0.38), (0.32, -0.105, 0.08)),  # forelegs straight down
            ((0.3, 0.1, 0.7), (0.31, 0.105, 0.38), (0.32, 0.105, 0.08)),
            ((-0.38, -0.11, 0.66), (-0.47, -0.12, 0.35), (-0.4, -0.12, 0.08)),  # hind legs, the hock behind
            ((-0.38, 0.11, 0.66), (-0.47, 0.12, 0.35), (-0.4, 0.12, 0.08))]
    LEGS.update(stand(legs))
    hooves = []
    for a, b, c in legs:
        parts += [("cap", a, b, 0.055), ("cap", b, c, 0.04), ("ball", b, 0.046)]  # a knobbly kid's knee at the joint
        hooves.append(Vector(c))
        parts.append(("ell", tuple(Vector(c) + (Vector(c) - Vector(b)).normalized() * 0.03), 0.038, (1.0, 0.9, 1.2)))
    parts += [("ell", (-0.36, -0.1, 0.68), 0.12, (1.2, 0.6, 1.1)), ("ell", (-0.36, 0.1, 0.68), 0.12, (1.2, 0.6, 1.1))]  # thighs
    body = blob("body", parts, 0.02, 15000)
    fluff(body, 0.006, 18.0)
    tail = goat_tail("tail", [(-0.48, 0, 0.82), (-0.54, 0, 0.92), (-0.55, 0, 1.01)], 0.05, F)
    seam = goat_bits(body, H, S, F, s, 0.04)
    fn = goat_paint(H, F, s, [h + (h - Vector(b)).normalized() * 0.03 for h, (a, b, c) in zip(hooves, legs)], list(ELEMENTS).index(el) * 1.7)
    paint(body, lambda p, n: mixc(fn(p, n), (0.06, 0.05, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("fur", 0.85))
    drape("scarf", (0.46, 0, 0.96), (-0.55, 0, -0.85), 0.11, 0.16, 0.15, S["cloth"], S["trim"], f"scarf-goat-{el}", 0.6)
    beads((0.48, 0, 0.94), (0.45, 0, 0.9), 0.14, 12, 0.07, 3, lt, S)
    goat_bell(lt, S, (0.6, -0.08, 0.72), 0.085)
    spine = [Vector((0.38, 0, 0.96)), Vector((0.1, 0, 0.94)), Vector((-0.15, 0, 0.9)), Vector((-0.38, 0, 0.88))]
    fox_growth(rng, el, S, F, lt, spine, tail, 0.8)
    aura(rng, S["aura"], lt, (-0.05, 0, 0.69), (1.35, 0.75, 0.7), 1.6)


def goat_ascended(sc, el, lt, dk):
    """The kid's highest ally form: up on its hind legs on small black hooves, slim, ears out, in the Romp's wanderer
    outfit with the lantern in its near hand, its brass bell on a cord at its chest."""
    S, F = STYLE[el], GOAT[el]
    lights(sc)
    rng = random.Random(f"ascended-goat-{el}")
    s = 0.95
    H = Vector((0.14, 0, 2.0))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.04, 0, 1.74)), Vector((0.2, 0, 1)), 0.11)
    parts = goat_head(H, s) + [("cap", (0.0, 0, 1.55), (0.08, 0, 1.9), 0.085), ("cap", (0, 0, 0.98), (0, 0, 1.5), 0.21),
                               ("ball", (0, 0, 0.92), 0.23), ("cap", (0, -0.26, 1.52), (0, 0.26, 1.52), 0.1)]
    hands, hooves = [], []
    for side in (-1, 1):
        sh, el_, hd = Vector((0, side * 0.33, 1.5)), Vector((0.08, side * 0.4, 1.14)), Vector((0.3, side * 0.35, 0.98))
        parts += [("cap", sh, el_, 0.06), ("cap", el_, hd, 0.048), ("ell", hd + Vector((0.035, 0, 0)), 0.05, (1.0, 0.9, 1.2))]
        hands.append(hd + Vector((0.035, 0, 0))); hooves.append(hd + Vector((0.035, 0, 0)))
    for y in (-0.13, 0.13):  # slim hind legs on small hooves
        parts += [("cap", (0, y, 0.88), (0.05, y, 0.48), 0.08), ("cap", (0.05, y, 0.48), (0.0, y, 0.1), 0.05),
                  ("ell", (0.03, y, 0.05), 0.055, (1.3, 0.9, 1.0))]
        hooves.append(Vector((0.03, y, 0.05)))
    body = blob("body", parts, 0.02, 15000)
    fluff(body, 0.006, 18.0)
    tail = goat_tail("tail", [(-0.2, 0, 0.95), (-0.28, 0, 1.04), (-0.3, 0, 1.13)], 0.05, F, s)
    seam = goat_bits(body, H, S, F, s, 0.036)
    fn = goat_paint(H, F, s, hooves, list(ELEMENTS).index(el) * 1.7)
    paint(body, lambda p, n: mixc(fn(p, n), (0.06, 0.05, 0.05), 0.6 * seam(p)))
    body.data.materials.append(vmat("fur", 0.85))
    wanderer(S, lt, el, hands[0], "goat", dz=0.0, w=0.88, ink=False, beads_at=(0.05, 0, 1.7))
    goat_bell(lt, S, (0.3, -0.1, 1.4), 0.09)
    fox_growth(rng, el, S, F, lt, [Vector((0.0, 0, 1.78)), Vector((-0.06, 0, 1.6))], tail, 0.7)
    aura(rng, S["aura"], lt, (-0.1, 0, 1.15), (0.9, 0.8, 1.0), 2.35)


# Round 7: one nation style over every stage (sg-look-layers: the element sets colour, material and aura; where you
# met the spirit sets the regional style). Meridia, the Golden Noon (Earth; clarity, trade and exchange), in stone and
# terraces: a gold sun crest behind the head, a terraced collar of sandstone steps with gold lips, and trade coins in
# place of the bell. The gas gathers inside a sun ring, the core sits on a terraced plinth, and the hologram stands
# on a terraced dais of light. The nation keeps its own sandstone and gold in every element, so it reads as a second
# axis: a Water spirit met in Meridia is still teal, wearing Meridia's stone and gold.
NATIONS = {
    "meridia": dict(stone=(0.84, 0.72, 0.52), stone_dk=(0.6, 0.48, 0.32), gold=(1.0, 0.76, 0.28), cord=(0.62, 0.12, 0.08)),
}
NECK = {}  # where each living builder's neck runs: (point, axis, radius), for the nation's collar
CAM_DIR = Vector((3.4, -4.2, 0)).normalized()  # the sprite camera's heading, so the crest faces the sprite


def face_cam(o, tilt=0.35):
    o.rotation_euler = Vector((0, 0, 1)).rotation_difference((CAM_DIR + Vector((0, 0, tilt))).normalized()).to_euler()


def sun_crest(N, at, r, light=None):
    """The Golden Noon: a gold ring with twelve tapering rays, standing behind the head and facing the sprite camera."""
    m = light or solid("sun", N["gold"], 0.25, 1.2, metal=0.8)
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=r * 0.07, major_segments=48, minor_segments=8, location=at)
    ring = bpy.context.active_object; ring.name = "sun"; ring.data.materials.append(m); smooth(ring)
    rays = []
    for k in range(12):
        a = k * math.pi / 6
        long_ = 0.55 if k % 2 == 0 else 0.35
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=r * 0.11, depth=r * long_, location=(0, 0, 0))
        o = bpy.context.active_object; o.data.materials.append(m)
        o.rotation_euler = (0, math.pi / 2, 0)  # point out along x, then fan round the ring's own axis
        bpy.context.view_layer.update()
        o.data.transform(o.matrix_basis); o.matrix_basis = Matrix.Identity(4)
        o.data.transform(Matrix.Translation((r * (1.04 + long_ / 2), 0, 0)))
        o.data.transform(Matrix.Rotation(a, 4, "Z"))
        o.parent = ring; rays.append(o)
    face_cam(ring)
    return ring


def terraces(N, at, axis, r0, steps=3, rise=0.05, step=0.06, square=False):
    """Stepped sandstone rings, each a step wider going down the axis, each lipped in gold: Meridia's terraced hills."""
    axis = Vector(axis).normalized()
    rot = Vector((0, 0, 1)).rotation_difference(axis).to_euler()
    stone, gold = solid("terrace", N["stone"], 0.85), solid("lip", N["gold"], 0.3, 0.4, metal=0.8)
    for k in range(steps):
        c = Vector(at) - axis * (k * rise)
        r = r0 + k * step
        v = 4 if square else 40
        bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=rise, location=c, rotation=rot)
        o = bpy.context.active_object; o.name = "terrace"; o.data.materials.append(stone)
        if square: o.rotation_euler.rotate_axis("Z", math.pi / 4)
        else: smooth(o)
        bpy.ops.mesh.primitive_torus_add(major_radius=r * (1.0 if not square else 1.08), minor_radius=0.012 + 0.004 * k,
                                         major_segments=v * (1 if not square else 1), minor_segments=6,
                                         location=c + axis * (rise / 2), rotation=rot)
        lip = bpy.context.active_object; lip.data.materials.append(gold)
        if square: lip.rotation_euler.rotate_axis("Z", math.pi / 4)


def coins(N, at, n=3, s=1.0):
    """Trade: a red cord strung with gold cash coins, each with its square hole."""
    gold, hole, cord = solid("coin", N["gold"], 0.25, 0.3, metal=0.9), solid("hole", (0.05, 0.04, 0.03), 0.9), solid("cord", N["cord"], 0.9)
    at = Vector(at)
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.008 * s, depth=0.08 * s * (n + 0.5),
                                        location=at - Vector((0, 0, 0.04 * s * (n + 0.5) - 0.02 * s)))
    bpy.context.active_object.data.materials.append(cord)
    for k in range(n):
        c = at - Vector((0, 0, (0.06 + 0.085 * k) * s))
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.06 * s, depth=0.014 * s, location=c, rotation=(math.pi / 2, 0, 0.6))
        o = bpy.context.active_object; o.name = "coin"; o.data.materials.append(gold); smooth(o)
        bpy.ops.mesh.primitive_cube_add(size=0.034 * s, location=c, rotation=(math.pi / 2, 0, 0.6))
        o = bpy.context.active_object; o.scale = (1, 1, 0.5); o.data.materials.append(hole)
    tassel(at - Vector((0, 0, (0.06 + 0.085 * n) * s)), N["cord"], 0.7 * s)


def nation_layer(nation, st, base, lt):
    N = NATIONS[nation]
    if st == "gas":
        sun_crest(N, (0, 0, 0.35), 0.82, mat("noonlight", N["gold"], 1.4, 0.3))
        # a fifth of the motes take the noon's gold
        gm = mat("noonmote", N["gold"], 1.6, 0.6)
        for o in [o for o in bpy.context.scene.objects if o.name.startswith("mote")][::5]:
            o.data.materials.clear(); o.data.materials.append(gm)
    elif st == "core":
        terraces(N, (0, 0, -0.07), (0, 0, 1), 0.26, 3, 0.08, 0.13, square=True)
        sun_crest(N, (0, 0, 0.42), 0.55, mat("noonlight", N["gold"], 1.4, 0.4))
    elif st == "hologram":
        light = mat("dais", N["gold"], 1.2, 0.2)
        lip = mat("daislip", N["gold"], 2.6, 0.9)
        for k in range(3):
            r, z = 1.05 + (0.2 if base != "tortoise" else 0) - 0.18 * k, -0.25 + 0.05 * k
            bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=r, depth=0.05, location=(0, 0, z), rotation=(0, 0, math.pi / 4))
            bpy.context.active_object.data.materials.append(light)
            bpy.ops.mesh.primitive_torus_add(major_radius=r * 1.0, minor_radius=0.014, major_segments=4, minor_segments=4,
                                             location=(0, 0, z + 0.025), rotation=(0, 0, math.pi / 4))
            bpy.context.active_object.data.materials.append(lip)
        head = [o for o in bpy.context.scene.objects if o.name.startswith("head")][0].location
        sun_crest(N, head - CAM_DIR * 0.3 + Vector((0, 0, 0.14)), 0.3, mat("crestlight", N["gold"], 2.2, 0.6))
    else:
        H = HEAD["at"]
        up = st == "ascended"
        sun_crest(N, H - CAM_DIR * (0.32 if up else 0.42) + Vector((0, 0, 0.12 if up else 0.14)), 0.27 if up else 0.33)
        p, ax, r = NECK["at"]
        terraces(N, p, ax, r, 3, 0.05 if up else 0.06, 0.05 if up else 0.065)
        bell = bpy.context.scene.objects.get("bell")
        if bell:  # the creature's gold bell becomes a string of trade coins
            at = bell.location + Vector((0, 0, 0.1)); bpy.data.objects.remove(bell)
            coins(N, at, 3, 1.1)
        if up:  # the ally form wears its coins at the belt on the near side
            coins(N, (0.36, -0.2, 1.1), 3, 0.95)


# Round 12: the satisfaction states (pass spirit-states 1, 2026-10-16). One model, posed and re-materialled per state
# (ss-markers), so a state costs no new model. Dissatisfied is the Protector's push held and braced, the guard kept past
# its time (ss-feral-stance): forelegs wide, head low under the rim, shell tipped forward; a ragged aura pulling inward
# in a darker, denser shade; narrowed eyes with a hot glint; a cracked, dimmed core; rougher shell and skin. Satisfied is
# the push completed and open: head up and out, a wider, smooth aura with a bright rim (brightness, not gold, which
# Meridia's crest already uses), soft open eyes, a whole and steadier core. Neutral is the render as it was. Each state
# shows on at least two markers that are not colour: the stance and the aura's edge. The gas shows the aura only, the
# core its core, the hologram its aura and scanline. A veiled spirit (polarity above 0, ps-polarity) is faint and fogged
# and its state does not show (ss-not-veiled); a flooding one (below 0) is too big and too bright.
CREATURE_POSE = {
    "neutral": dict(shell_z=0.42, tip=-0.12, head=(1.2, 0, 1.22), feet=[(0, 1)] * 4, rim=0.0, collar=(0, 0, 0)),
    "dissatisfied": dict(shell_z=0.37, tip=0.1, head=(1.0, 0, 0.74), rim=0.07, collar=(0.0, 0, -0.16),
                         feet=[(0.16, 1.5), (0.16, 1.5), (-0.08, 1.2), (-0.08, 1.2)]),
    "satisfied": dict(shell_z=0.44, tip=-0.22, head=(1.32, 0, 1.46), rim=-0.04, collar=(0.03, 0, 0.07),
                      feet=[(0.06, 1.0), (0.06, 1.0), (0, 1.0), (0, 1.0)]),
}
ALLY_POSE = {  # the far hand holds the staff in every pose
    "neutral": dict(head=(0.2, 0, 2.05), stance=1.0, elbow=(0.1, 0.5, 1.12), hand=(0.32, 0.42, 0.95)),
    "dissatisfied": dict(head=(0.36, 0, 1.88), stance=1.7, elbow=(0.34, 0.52, 1.28), hand=(0.64, 0.36, 1.42)),
    "satisfied": dict(head=(0.2, 0, 2.13), stance=1.1, elbow=(0.06, 0.74, 1.45), hand=(0.1, 0.98, 1.72)),
}
EYE = {  # upper lid's edge, lower lid's edge (in the eye's own frame), glint colour, size and glow
    "neutral": (0.18, -0.55, (1, 1, 1), 0.08, 2.0),
    "dissatisfied": (-0.06, -0.3, (1.0, 0.42, 0.08), 0.17, 10.0),
    "satisfied": (0.34, -0.68, (1, 1, 1), 0.14, 3.0),
}
AURA = {}


def look_state():
    """The state the body shows: a veiled spirit's state does not show (ss-not-veiled)."""
    return "neutral" if args.polarity > 0 else args.state


_aura_built = aura


def aura(rng, kind, lt, centre, radii, top):  # the same aura, with its pieces marked for the state layer
    before = set(bpy.data.objects)
    _aura_built(rng, kind, lt, centre, radii, top)
    for o in set(bpy.data.objects) - before: o["aura"] = 1
    AURA.update(centre=Vector(centre), radii=radii, top=top)


def materials_of(o):
    return [m for m in (o.data.materials if o.type == "MESH" else []) if m]


def bsdf(m):
    return m.node_tree.nodes.get("Principled BSDF") if m.use_nodes else None


DONE = set()  # (material, step) pairs already changed: many objects share one material, which must change once


def once(o, step):
    """The object's materials that this step has not changed yet."""
    out = [m for m in materials_of(o) if (m.name, step) not in DONE]
    DONE.update((m.name, step) for m in out)
    return out


def tint(o, f, step="tint"):
    """Apply f to every colour the object shows: its painted vertex colours and its materials' base colours."""
    if o.type != "MESH": return
    ca = o.data.color_attributes.get("Col")
    if ca and (o.data.name, step) not in DONE:
        DONE.add((o.data.name, step))
        for d in ca.data: d.color = (*f(tuple(d.color[:3])), 1)
    for m in once(o, step):
        p = bsdf(m)
        if p and not p.inputs["Base Color"].is_linked:
            p.inputs["Base Color"].default_value = (*f(tuple(p.inputs["Base Color"].default_value[:3])), 1)
        if p and not p.inputs["Emission Color"].is_linked:
            p.inputs["Emission Color"].default_value = (*f(tuple(p.inputs["Emission Color"].default_value[:3])), 1)


def scale_glow(o, k, step="glow"):
    for m in once(o, step):
        p = bsdf(m)
        if p: p.inputs["Emission Strength"].default_value *= k


def ring_at(name, m, c, rx, ry, z, minor=0.02):
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=minor, major_segments=96, minor_segments=6, location=(c.x, c.y, z))
    o = bpy.context.active_object; o.name = name; o.scale = (rx, ry, 1); o.data.materials.append(m)
    return o


def crack(o, cam, dark):
    """A dark zig-zag split across the core, on the face the camera sees."""
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(b) for b in o.bound_box]
    c = sum(pts, Vector()) / 8
    ext = max((p - c).length for p in pts)
    d = (cam.location - c).normalized()
    side = d.cross(Vector((0, 0, 1))).normalized(); up = side.cross(d).normalized()
    z = [(-0.9, 0.1), (-0.45, -0.22), (-0.1, 0.18), (0.25, -0.15), (0.6, 0.2), (0.88, -0.05)]
    path = []
    for t, w in z:
        q = c + up * t * ext * 0.62 + side * w * ext * 0.5
        hit, loc, _, _ = o.ray_cast(o.matrix_world.inverted() @ (q + d * ext * 2), o.matrix_world.inverted().to_3x3() @ -d)
        path.append((o.matrix_world @ loc) + d * 0.01 if hit else q + d * ext * 0.3)
    tube("crack", path, max(0.012, ext * 0.035), dark)


def state_layer(sc, st, lt, dk):
    state, pol = look_state(), args.polarity
    DONE.clear()
    objs = [o for o in sc.objects if o.type == "MESH"]
    cores = [o for o in objs if o.name.split(".")[0] in ("core", "core_top", "core_bot", "core_gem", "romp_core")]
    motes = [o for o in objs if o.name.startswith("mote")]
    halo = [o for o in objs if o.get("aura") or o.name.startswith("projector")] + (motes if st in ("gas", "core") else [])
    c = AURA.get("centre", Vector((0, 0, 0.35))); rx, ry = AURA.get("radii", (0.75, 0.75, 0.6))[:2]
    if st in ("gas", "core", "hologram"):
        c, rx, ry = Vector((0, 0, 0.35)), (1.25 if st == "hologram" else 0.8), (1.0 if st == "hologram" else 0.8)
    deep = mixc(dk, (0, 0, 0), 0.45)
    if state == "dissatisfied":
        for o in objs:  # darker: dense and solid, never faint (ss-not-veiled)
            if o.name.startswith("glint"): continue
            if o in halo:
                tint(o, lambda x: mixc(x, lin(dk), 0.8))
                for m in once(o, "dense"):
                    p = bsdf(m)
                    if p and not p.inputs["Alpha"].is_linked: p.inputs["Alpha"].default_value = min(0.92, p.inputs["Alpha"].default_value * 2.2)
                scale_glow(o, 0.5)
                if o.name.startswith("Circle"):  # the pool goes dense and dark, not bright
                    tint(o, lambda x: lin(mixc(deep, (0, 0, 0), 0.4)), "pool"); scale_glow(o, 0.3, "pool")
            elif o not in cores:
                tint(o, lambda x: mixc(tuple(v * 0.3 for v in x), lin(deep), 0.15))
                for m in materials_of(o):
                    p = bsdf(m)
                    if p: p.inputs["Roughness"].default_value = max(0.9, p.inputs["Roughness"].default_value)
        for o in objs:  # rougher shell and skin
            if o.name.split(".")[0] in ("body", "shell"):
                tex = bpy.data.textures.new("rough", "CLOUDS"); tex.noise_scale = 0.06; tex.noise_depth = 2
                md = o.modifiers.new("rough", "DISPLACE"); md.texture = tex; md.strength = 0.035; md.mid_level = 0.5
        for o in halo:  # the aura pulls in toward the body
            o.location = c + (o.location - c) * 0.72 if o.location.length > 0.01 else o.location
            if o.name.startswith("mote"):
                o.rotation_euler = (c - o.location).to_track_quat("Z", "Y").to_euler(); o.scale = (0.55, 0.55, 2.4)
        for o in cores:  # cracked and dimmed
            scale_glow(o, 0.6, "dim")
            crack(o, sc.camera, solid("crack", (0.02, 0.01, 0.01), 0.9))
        thorn = solid("thorn", mixc(deep, (0, 0, 0), 0.35), 0.6, 0.8, alpha=0.95)
        rng = random.Random(f"thorns-{st}")
        for k in range(34):  # a ragged edge of thorns, every one pointing inward
            a = k * 2 * math.pi / 34 + rng.uniform(-0.08, 0.08)
            z = c.z + rng.uniform(-0.45, 0.75) * (AURA.get("top", 1.2) * 0.6 if st in ("creature", "ascended") else 0.6)
            p = Vector((c.x + math.cos(a) * rx * 1.18, c.y + math.sin(a) * ry * 1.18, max(0.05, z)))
            L = rng.uniform(0.28, 0.55)
            bpy.ops.mesh.primitive_cone_add(vertices=5, radius1=0.075, depth=L, location=p)
            o = bpy.context.active_object; o.name = "thorn"; o.data.materials.append(thorn)
            o.rotation_euler = (Vector((c.x, c.y, p.z)) - p).to_track_quat("Z", "Y").to_euler()
        for o in objs:  # the hologram's scanline breaks up
            for m in once(o, "scan"):
                wv = m.node_tree.nodes.get("Wave Texture") if m.use_nodes else None
                if wv: wv.inputs["Scale"].default_value *= 2.6; wv.inputs["Distortion"].default_value = 7.0
    elif state == "satisfied":
        for o in objs:
            if o in halo:
                d = o.location - c
                o.location = c + Vector((d.x * 1.22, d.y * 1.22, d.z)) if d.length > 0.01 else o.location
                if o.name.startswith("Circle") or o.name.startswith("Torus"): o.scale = (o.scale.x * 1.15, o.scale.y * 1.15, o.scale.z)
                scale_glow(o, 1.1)
            elif not o.name.startswith("glint"):
                tint(o, lambda x: tuple(min(1.0, v * 1.12) for v in x)); scale_glow(o, 1.25)
        for o in cores: scale_glow(o, 1.7, "whole")
        rim = solid("rim", mixc(lt, (1, 1, 1), 0.55), 0.2, 7.0, alpha=0.95)
        soft = solid("rimsoft", mixc(lt, (1, 1, 1), 0.3), 0.2, 2.5, alpha=0.35)
        ground = 0.015 if st in ("creature", "ascended") else c.z - 0.45
        k = 1.4 if st in ("creature", "ascended") else 1.1 if st == "hologram" else 1.25
        ring_at("rim", rim, c, rx * k, ry * k, ground, 0.022)
        ring_at("rimsoft", soft, c, rx * k * 1.06, ry * k * 1.06, ground, 0.05)
        if st in ("gas", "core", "hologram"):  # a slow halo above the smaller forms
            ring_at("halo", rim, c, rx * 0.85, ry * 0.85, c.z + 0.55, 0.016)
        for o in (cores if st in ("core", "hologram") else []):  # the creature's emblem is already its core
            bpy.context.view_layer.update()
            pts = [o.matrix_world @ Vector(b) for b in o.bound_box]; cc = sum(pts, Vector()) / 8
            ext = max((p - cc).length for p in pts)
            if o.name.split(".")[0] != "core_bot": ring_at("corehalo", rim, cc, ext * 1.15, ext * 1.15, cc.z, 0.012)
    if pol > 0:  # veiled: faint and fogged, the state hidden (ss-not-veiled, ps-polarity)
        oc = min(1.0, pol / 10)
        fog = (0.55, 0.58, 0.62)
        for o in objs:
            tint(o, lambda x: mixc(x, lin(fog), oc * 0.65), "veil"); scale_glow(o, 1 - oc * 0.85, "veil")
            for m in once(o, "veilalpha"):
                p = bsdf(m)
                if p and not p.inputs["Alpha"].is_linked: p.inputs["Alpha"].default_value *= 1 - 0.75 * oc
        mist = solid("fog", fog, 1.0, 0.15, alpha=0.16 * oc / 0.6)
        for s_, dzf in ((0.85, 0.0), (1.0, 0.1), (1.15, 0.2)):
            ball("fog", mist, (c.x, c.y, c.z + dzf), 1.0, (rx * s_, ry * s_, (AURA.get("top", 1.0) * 0.6 + 0.3) * s_), 24)
    elif pol < 0:  # flooding: too big and too bright, a glare in its own colour
        fl = min(1.0, -pol / 10)
        g = Matrix.Scale(1 + 0.35 * fl, 4)
        for o in list(sc.objects):
            if o.type == "MESH" and not o.parent: o.matrix_world = g @ o.matrix_world
        for o in objs: scale_glow(o, 1 + 3 * fl, "flood"); tint(o, lambda x: tuple(min(1.0, v * (1 + 0.6 * fl)) for v in x), "flood")
        g = 1 + 0.35 * fl
        for r, a in ((0.95, 0.08), (1.12, 0.05)):
            ball("glare", solid("glare", mixc(lt, (1, 1, 1), 0.2), 0.3, 3.0 * fl, alpha=a), tuple(c * g),
                 1.0, (rx * r * g, ry * r * g, (AURA.get("top", 1.0) * 0.6 + 0.2) * r * g), 32)


def render(sc, path):
    sc.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def sprite(src, dst, px):
    img = bpy.data.images.load(str(src))
    img.scale(px, px)  # Blender's box filter; then hard alpha for a pixel edge
    p = list(img.pixels)
    for i in range(3, len(p), 4):  # three alpha steps keep the hologram see-through as a sprite
        p[i] = 0.0 if p[i] < 0.12 else (0.55 if p[i] < 0.6 else 1.0)
    img.pixels[:] = p
    img.filepath_raw = str(dst); img.file_format = "PNG"; img.save()


report = {"family": FAMILY, "base": args.base, "nation": args.nation or None, "state": args.state, "polarity": args.polarity, "daemon": "player" if FAMILY == "romp" else "protector", "stages": STAGES, "items": []}
for d in ("render", "sprite", "glb"): (OUT / d).mkdir(parents=True, exist_ok=True)
for el, (lt, dk) in ELEMENTS.items():
    if args.only and el != args.only: continue
    for st in STAGES:
        if args.stages and st not in args.stages.split(","): continue
        long_ = args.base != "tortoise"
        fox, otter, goat = args.base == "fox", args.base == "otter", args.base == "goat"
        sc = reset(1.3, 3.8) if st == "ascended" else reset(0.85, 4.3) if (st == "creature" and fox) \
            else reset(0.42, 3.2) if (st == "creature" and otter) else reset(0.66, 3.1) if (st == "creature" and goat) \
            else reset(0.7 if long_ else 0.75, 4.5 if long_ else 4.0) if st == "creature" \
            else reset(0.45, 3.6) if (st == "hologram" and fox) else reset(0.4, 3.5) if (st == "hologram" and otter) \
            else reset(0.5, 3.3) if (st == "hologram" and goat) \
            else reset(0.35, 3.7) if (st == "hologram" and long_) else reset()
        rng = random.Random(f"{FAMILY}-{el}-{st}")  # gas and core are the family's, the same for every base
        if st == "gas":
            romp_gas(rng, lt, dk) if FAMILY == "romp" else gas(rng, lt, dk, 140, 0.42)
        elif st == "core":
            gas(rng, lt, dk, 40, 0.38, core_pull=0.45)
            romp_core(lt, (0, 0, 0.3), 0.3) if FAMILY == "romp" else core(lt)
        elif st == "hologram":
            hologram(lt, dk) if args.base == "tortoise" else fox_hologram(lt, dk) if fox \
                else otter_hologram(lt, dk) if otter else goat_hologram(lt, dk) if goat else hologram_long(lt, dk, args.base)
        elif st == "creature":
            creature(sc, el, lt, dk) if args.base == "tortoise" else fox_creature(sc, el, lt, dk) if fox \
                else otter_creature(sc, el, lt, dk) if otter else goat_creature(sc, el, lt, dk) if goat else creature_long(sc, el, lt, dk, args.base)
        else:
            ascended(sc, el, lt, dk) if args.base == "tortoise" else fox_ascended(sc, el, lt, dk) if fox \
                else otter_ascended(sc, el, lt, dk) if otter else goat_ascended(sc, el, lt, dk) if goat else ascended_long(sc, el, lt, dk, args.base)
        if args.nation:
            nation_layer(args.nation, st, args.base, lt)
        if args.state != "neutral" or args.polarity:
            state_layer(sc, st, lt, dk)
        AURA.clear()
        base = f"{el}-{st}"
        render(sc, OUT / "render" / f"{base}.png")
        sprite(OUT / "render" / f"{base}.png", OUT / "sprite" / f"{base}.png", args.sprite)
        bpy.ops.export_scene.gltf(filepath=str(OUT / "glb" / f"{base}.glb"), export_format="GLB", export_apply=True)
        tris = sum(len(o.data.polygons) for o in sc.objects if o.type == "MESH")
        report["items"].append({"element": el, "stage": st, "faces": tris,
                                "glb_kb": round(os.path.getsize(OUT / "glb" / f"{base}.glb") / 1024, 1)})
        if st == "creature" and LEGS:
            report["items"][-1]["legs"] = dict(LEGS)
        LEGS.clear()
        if args.heads and st in ("creature", "ascended"):
            (OUT / "head").mkdir(exist_ok=True)
            cam, h = sc.camera, HEAD["at"]
            cam.data.ortho_scale = 0.95
            cam.location = h + Vector((1.5, -2.1, 0.45))
            cam.rotation_euler = (h - cam.location).to_track_quat("-Z", "Y").to_euler()
            render(sc, OUT / "head" / f"{base}.png")
        print("done", base, tris, flush=True)
(OUT / "report.json").write_text(json.dumps(report, indent=1))
