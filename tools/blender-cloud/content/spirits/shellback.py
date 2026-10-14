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
Each stage is rendered with Cycles on the CPU and shrunk to a pixel sprite, so one model gives both assets (sg-assets-modular). Nothing is downloaded.

    /home/user/blenv/bin/python tools/blender-cloud/content/spirits/shellback.py OUT_DIR [--samples 32] [--size 512] [--heads] [--nation meridia]

Writes OUT_DIR/render/<element>-<stage>.png, OUT_DIR/sprite/<element>-<stage>.png (96 px, three alpha steps),
OUT_DIR/glb/<element>-<stage>.glb and OUT_DIR/report.json; --heads adds OUT_DIR/head/<element>-<stage>.png, a close-up
of the living creature's and highest ally form's head. The same arguments always give the same spirit.
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
ap.add_argument("--base", default="tortoise", choices=["tortoise", "armadillo", "pangolin"],
                help="the family's animal base (round 4 adds the armadillo and the pangolin)")
ap.add_argument("--heads", action="store_true", help="also render a close-up of the creature's and ally form's head")
ap.add_argument("--nation", default="", choices=["", "meridia"],
                help="the nation where it was met, which adds its regional style over the element's (round 7: Meridia)")
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
}
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


def eye(body, toward, out, S, r=0.06):
    """One eye for every element (round 3, Wendell: "the same eyes but with different eye color"): a ball sunk deep
    into the head where a ray from outside meets it, so only a sliver of its front shows, under a heavy upper lid and a
    thin lower lid in the skin's colour. Round 5, after the players' look ("the big eyes are too Disney like"): the eye
    is smaller and set deeper, and a dark iris, tinted by the element, fills nearly all of what shows, the way a
    tortoise's does, so almost no white is left. The pupil stays black and the catchlight white."""
    out = Vector(out).normalized()
    hit, loc, _, _ = body.ray_cast(Vector(toward) + out * 2, -out)
    at = (loc if hit else Vector(toward)) - out * r * 0.72
    gaze = (out + Vector((0.55, 0, -0.05))).normalized()  # a little forward of straight out, so it looks ahead
    up = (Vector((0, 0, 1)) - out * out.z).normalized()
    side = up.cross(out).normalized()
    frame = Matrix((out, side, up)).transposed()  # local x along out, z up
    eb = ball("eyeball", vmat("eye", 0.25), at, r, seg=48)
    iris = mixc(S["iris"], (0.24, 0.14, 0.06), 0.5)  # a tortoise's brown, tinted by the element
    dark = mixc(iris, (0, 0, 0), 0.6)

    def look(p, n):  # painted on the ball, so the iris sits flush instead of bulging out of it
        c = (p - at).normalized().dot(gaze)
        if c > 0.9: return (0.02, 0.02, 0.02)  # pupil
        if c > 0.45: return mixc(iris, dark, (0.9 - c) / 0.45 * 0.7) if c > 0.52 else dark  # iris, darker at its rim
        return (0.62, 0.56, 0.44)  # what little white shows is shadowed and yellowed
    bpy.context.view_layer.update(); paint(eb, look)
    ball("glint", solid("glint", (1, 1, 1), 0.1, 2.0), at + (gaze + up * 0.1 + side * 0.12).normalized() * r, r * 0.08)
    lid = solid("lid", mixc(S["skin"], S["spot"], 0.25), 0.7)
    for name, keep, s_ in (("lid_upper", lambda v: v.z > 0.18 and v.x > -0.35, 1.12), ("lid_lower", lambda v: v.z < -0.55 and v.x > -0.2, 1.08)):
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
    shell, centres = shell_mesh("shell", 0.98, S)
    shell.location = (-0.15, 0, 0.42); shell.rotation_euler = (0, -0.12, 0)
    growth(rng, shell, centres, 0.98, S, lt)
    # the emblem faces the viewer on the shell's flank
    em = emblem("core", 0.42, lt)
    em.location = (-0.25, -0.7, 0.85); em.rotation_euler = Vector((0, 0, 1)).rotation_difference(Vector((0.05, -0.8, 0.6))).to_euler()
    bpy.context.view_layer.update(); wrap_onto(em, shell)
    H = Vector((1.2, 0, 1.22))
    HEAD["at"] = H
    parts = [("cap", (0.45, 0, 0.5), (0.98, 0, 1.02), 0.22), ("ball", (0.5, 0, 0.42), 0.3)] + tortoise_head(H, 1.2)
    NECK["at"] = (Vector((0.86, 0, 0.9)), Vector((0.53, 0, 0.52)), 0.22)
    feet = []
    for x, y in ((0.45, -0.52), (0.45, 0.52), (-0.65, -0.52), (-0.65, 0.52)):
        parts += [("cap", (x, y * 0.85, 0.42), (x + 0.04, y, 0.08), 0.21),
                  ("ell", (x + 0.06, y * 1.03, 0.05), 0.22, (1.2, 1.05, 0.45))]
        feet.append((Vector((x + 0.06, y * 1.03, 0.04)), Vector((1, 0.5 * (1 if y > 0 else -1), 0))))
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
    drape("shawl", (0.62, 0, 0.86), (-0.3, 0, -1), 0.32, 0.62, 0.45, S["cloth"], S["trim"], f"shawl-{el}")
    beads((0.74, 0, 0.88), (0.65, 0, 0.75), 0.3, 18, 0.12, 4, lt, S)
    # a gold bell and a jade disc hang from the shell's rim on the near side
    ball("bell", solid("gold", GOLD, 0.35), (-0.45, -0.8, 0.3), 0.11)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.035, major_segments=20, minor_segments=8,
                                     location=(-0.72, -0.76, 0.27), rotation=(math.pi / 2, 0, 0.5))
    bpy.context.active_object.data.materials.append(jade_of(lt))
    smooth(bpy.context.active_object)
    tassel(Vector((-0.45, -0.82, 0.16)), S["tassel"], 0.9); tassel(Vector((-0.72, -0.78, 0.15)), S["tassel"], 0.9)
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
    H = Vector((0.2, 0, 2.05))
    HEAD["at"] = H
    NECK["at"] = (Vector((0.06, 0, 1.72)), Vector((0.2, 0, 1)), 0.17)
    parts = tortoise_head(H, 0.88) + [
             ("cap", (0.0, 0, 1.55), (0.12, 0, 1.92), 0.13), ("cap", (0, 0, 0.95), (0, 0, 1.5), 0.3),
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


report = {"family": "shellback", "base": args.base, "nation": args.nation or None, "daemon": "protector", "stages": STAGES, "items": []}
for d in ("render", "sprite", "glb"): (OUT / d).mkdir(parents=True, exist_ok=True)
for el, (lt, dk) in ELEMENTS.items():
    if args.only and el != args.only: continue
    for st in STAGES:
        if args.stages and st not in args.stages.split(","): continue
        long_ = args.base != "tortoise"
        sc = reset(1.3, 3.8) if st == "ascended" else reset(0.7 if long_ else 0.75, 4.5 if long_ else 4.0) if st == "creature" \
            else reset(0.35, 3.7) if (st == "hologram" and long_) else reset()
        rng = random.Random(f"shellback-{el}-{st}")  # gas and core are the family's, the same for every base
        if st == "gas":
            gas(rng, lt, dk, 140, 0.42)
        elif st == "core":
            gas(rng, lt, dk, 40, 0.38, core_pull=0.45); core(lt)
        elif st == "hologram":
            hologram(lt, dk) if args.base == "tortoise" else hologram_long(lt, dk, args.base)
        elif st == "creature":
            creature(sc, el, lt, dk) if args.base == "tortoise" else creature_long(sc, el, lt, dk, args.base)
        else:
            ascended(sc, el, lt, dk) if args.base == "tortoise" else ascended_long(sc, el, lt, dk, args.base)
        if args.nation:
            nation_layer(args.nation, st, args.base, lt)
        base = f"{el}-{st}"
        render(sc, OUT / "render" / f"{base}.png")
        sprite(OUT / "render" / f"{base}.png", OUT / "sprite" / f"{base}.png", args.sprite)
        bpy.ops.export_scene.gltf(filepath=str(OUT / "glb" / f"{base}.glb"), export_format="GLB", export_apply=True)
        tris = sum(len(o.data.polygons) for o in sc.objects if o.type == "MESH")
        report["items"].append({"element": el, "stage": st, "faces": tris,
                                "glb_kb": round(os.path.getsize(OUT / "glb" / f"{base}.glb") / 1024, 1)})
        if args.heads and st in ("creature", "ascended"):
            (OUT / "head").mkdir(exist_ok=True)
            cam, h = sc.camera, HEAD["at"]
            cam.data.ortho_scale = 0.95
            cam.location = h + Vector((1.5, -2.1, 0.45))
            cam.rotation_euler = (h - cam.location).to_track_quat("-Z", "Y").to_euler()
            render(sc, OUT / "head" / f"{base}.png")
        print("done", base, tris, flush=True)
(OUT / "report.json").write_text(json.dumps(report, indent=1))
