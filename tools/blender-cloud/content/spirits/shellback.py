"""The first spirit proof: the Shellback (the Protector's body family) in its five stages, in all five elements.

Stages (Wendell's board steers on sg-grows-into-shape and sg-holo-stages, 2026-10-14): a gas that solidifies into a
core, which projects a holographic ally into the world, which becomes a living creature, whose highest ally form is
humanoid. The gas, core and hologram are built from primitives; the living creature and highest ally form are
fused metaballs painted per vertex, after Wendell's "Taoist Tortoise" concept (2026-10-14: "too geometric").
Each stage is rendered with Cycles on the CPU and shrunk to a pixel sprite, so one model gives both assets (sg-assets-modular). Nothing is downloaded.

    /home/user/blenv/bin/python tools/blender-cloud/content/spirits/shellback.py OUT_DIR [--samples 32] [--size 512]

Writes OUT_DIR/render/<element>-<stage>.png, OUT_DIR/sprite/<element>-<stage>.png (96 px, three alpha steps),
OUT_DIR/glb/<element>-<stage>.glb and OUT_DIR/report.json. The same arguments always give the same spirit.
"""
import argparse, json, math, os, pathlib, random, sys

import bpy
from mathutils import Vector, noise

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("--samples", type=int, default=32)
ap.add_argument("--size", type=int, default=512)
ap.add_argument("--sprite", type=int, default=96)
ap.add_argument("--only", default="", help="element to build alone, for a quick look")
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


def solid(name, color, rough=0.6, glow=0.0):
    """An opaque material for the living stages; glow is for the core and trim."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*lin(color), 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Emission Color"].default_value = (*lin(color), 1)
    p.inputs["Emission Strength"].default_value = glow
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
# rounded tortoise with a mossy shell carrying a yin-yang and the eight trigrams, a long neck with big eyes, stout
# spotted legs, a shawl with a green hem, prayer beads and red tassels. The art is concept only (cs-chatgpt-ai-art);
# every piece is rebuilt here from fused metaballs and painted per vertex, so the GLB carries the same colours.
SKIN, SPOT, THROAT = (0.48, 0.53, 0.28), (0.25, 0.29, 0.14), (0.86, 0.80, 0.57)
SHELLC, MOSS, CREAM, RED, GOLD = (0.56, 0.53, 0.42), (0.36, 0.47, 0.18), (0.88, 0.84, 0.72), (0.66, 0.22, 0.12), (0.72, 0.56, 0.25)
BEAD = (0.40, 0.17, 0.10)


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


def vmat(name, rough=0.7, glow=0.0):
    """A material that takes its colour from the mesh's painted colours (COLOR_0 in the GLB)."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes["Principled BSDF"]
    ca = nt.nodes.new("ShaderNodeVertexColor"); ca.layer_name = "Col"
    nt.links.new(ca.outputs["Color"], p.inputs["Base Color"])
    p.inputs["Roughness"].default_value = rough
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


def skin_paint(body, seed, throat):
    """Olive skin with darker rounded spots and a pale throat; throat(p, n) says where the pale skin goes.
    The spots cover the nearest third of each cell, so their size holds whatever the noise's range."""
    cell = lambda p: noise.voronoi(p * 7.0 + Vector((seed, 0, 0)))[0][0]
    ds = sorted(cell(v.co) for v in body.data.vertices)
    lo, hi = ds[len(ds) // 6], ds[len(ds) // 3]

    def fn(p, n):
        d = cell(p)
        c = SKIN
        if d < hi: c = mixc(SPOT, SKIN, max(0, (d - lo) / (hi - lo)))
        t = throat(p, n)
        if t > 0: c = mixc(c, THROAT, min(1, t))
        return mixc(c, (0.1, 0.1, 0.08), 0.12 * max(0, -n.z))  # a little darker underneath
    return fn


def shell_mesh(name, size, el_dk):
    """A domed shell in its own frame (dome along +z): bulging scutes with sunken seams, moss on the crown,
    and a flat plastron underneath. Returns the object at the origin."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=1.0)
    o = bpy.context.active_object; o.name = name
    base = mixc(SHELLC, el_dk, 0.22)
    cols = []
    for v in o.data.vertices:
        d = v.co.normalized()
        dist, _ = noise.voronoi(d * 3.0)
        seam = dist[1] - dist[0]
        m = noise.noise(d * 4.5) + 0.35 * noise.noise(d * 11)
        moss = max(0.0, min(1.0, (m + 0.05) * 4)) if d.z > 0.35 else 0.0
        f = 1 + 0.035 * min(seam, 0.35) - (0.03 * (1 - seam / 0.09) if seam < 0.09 else 0) + 0.035 * moss
        p = Vector((d.x * 1.0, d.y * 0.86, d.z * 0.72)) * size * f
        p.z = max(p.z, -0.1 * size)
        v.co = p
        c = mixc(base, (0.62, 0.58, 0.46), 0.3 * noise.noise(d * 7) + 0.15)
        if seam < 0.14: c = mixc((0.12, 0.1, 0.07), c, (seam / 0.14) ** 1.5)
        if moss: c = mixc(c, mixc(MOSS, (0.5, 0.58, 0.22), 0.5 + 0.5 * noise.noise(d * 20)), moss)
        if p.z < -0.08 * size: c = (0.62, 0.55, 0.40)  # plastron
        cols.append(c)
    ca = o.data.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, c in enumerate(cols): ca.data[i].color = (*lin(c), 1)
    o.data.materials.append(vmat("shell", 0.8)); smooth(o)
    return o


def leaves(rng, host, n, size):
    """Small leaves and a few white flowers growing out of the shell's moss, parented to the shell."""
    greens = [solid(f"leaf{i}", c, 0.7) for i, c in enumerate(((0.33, 0.52, 0.18), (0.45, 0.6, 0.2)))]
    petal = solid("petal", (0.95, 0.93, 0.86), 0.6); heart = solid("heart", (0.9, 0.7, 0.2), 0.6)
    verts = [v for v in host.data.vertices if v.co.z > 0.45 * size * 0.72]
    for i in range(n):
        v = verts[rng.randrange(len(verts))]
        if i % 6 == 5:
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


def drape(name, top, down, r_top, r_bot, length, trim, seed, sides=1.0):
    """Cloth hanging from a ring: a cream shawl or robe with soft folds and a coloured hem."""
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
            cols.append(mixc(CREAM, (0.7, 0.66, 0.55), 0.3 * t) if not hem else (mixc(CREAM, trim, 0.3) if band else trim))
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


def beads(center, axis, radius, n, droop, jade_at, lt):
    """A string of prayer beads round the neck, one jade bead in the element's colour with a knot and a tassel."""
    axis = Vector(axis).normalized()
    u = axis.cross(Vector((0, 0, 1))) if abs(axis.z) < 0.95 else Vector((0, 1, 0))
    u.normalize(); v = axis.cross(u).normalized()
    bm, jm = solid("bead", BEAD, 0.35), solid("jade", mixc(lt, (0.75, 0.85, 0.78), 0.45), 0.25, 0.25)
    for k in range(n):
        a = k * 2 * math.pi / n
        p = Vector(center) + radius * (math.cos(a) * u + math.sin(a) * v)
        p.z -= droop * max(0, math.sin(a)) ** 2
        jade = k == jade_at
        ball("bead", jm if jade else bm, p, 0.085 if jade else 0.062, seg=10)
        if jade: tassel(p - Vector((0, 0, 0.09)), 0.75)


def tassel(at, s=1.0):
    gold, red = solid("gold", GOLD, 0.35), solid("tassel", RED, 0.9)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.035 * s, minor_radius=0.011 * s, major_segments=12, minor_segments=5,
                                     location=at, rotation=(math.pi / 2, 0, 0))
    bpy.context.active_object.data.materials.append(gold)
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=0.055 * s, radius2=0.014 * s, depth=0.24 * s,
                                    location=Vector(at) - Vector((0, 0, 0.15 * s)))
    o = bpy.context.active_object; o.data.materials.append(red); smooth(o)


def eye(body, toward, out, r=0.085):
    """A big round eye set into the head where a ray from outside meets it: pale ball, brown iris, black pupil
    and a white catchlight."""
    out = Vector(out).normalized()
    hit, loc, _, _ = body.ray_cast(Vector(toward) + out * 2, -out)
    at = (loc if hit else Vector(toward)) - out * r * 0.55
    ball("eyeball", solid("eyewhite", (0.93, 0.9, 0.82), 0.3), at, r)
    ball("iris", solid("iris", (0.5, 0.3, 0.1), 0.25), Vector(at) + out * r * 0.4, r * 0.75)
    ball("pupil", solid("pupil", (0.03, 0.03, 0.03), 0.2), Vector(at) + out * r * 0.68, r * 0.45)
    ball("glint", solid("glint", (1, 1, 1), 0.1, 3.0), Vector(at) + out * r * 0.95 + Vector((0, 0, r * 0.3)), r * 0.16)


def claws(foot, ahead, s=1.0):
    m = solid("claw", (0.24, 0.22, 0.2), 0.4)
    ahead = Vector(ahead).normalized(); side = ahead.cross(Vector((0, 0, 1))).normalized()
    for k in (-1, 0, 1):
        p = Vector(foot) + ahead * 0.2 * s + side * k * 0.09 * s
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.045 * s, depth=0.1 * s, location=p)
        o = bpy.context.active_object; o.data.materials.append(m); smooth(o)
        o.rotation_euler = Vector((0, 0, 1)).rotation_difference(ahead + Vector((0, 0, -0.5))).to_euler()


def mouth(head, fwd_x, width, z0):
    """A smile painted as a thin dark line across the snout."""
    def on(p):
        y = p.y / width
        return p.x > head.x + fwd_x and abs(y) < 1 and abs(p.z - (z0 + 0.05 * y * y)) < 0.012
    return on


def creature(sc, lt, dk):
    """The living Shellback: a young tortoise sage, after Wendell's Taoist Tortoise concept."""
    lights(sc)
    rng = random.Random(f"creature-{lt}")
    shell = shell_mesh("shell", 0.98, dk)
    shell.location = (-0.15, 0, 0.42); shell.rotation_euler = (0, -0.12, 0)
    leaves(rng, shell, 34, 0.98)
    # the emblem faces the viewer on the shell's flank
    em = emblem("core", 0.42, lt)
    em.location = (-0.25, -0.7, 0.85); em.rotation_euler = Vector((0, 0, 1)).rotation_difference(Vector((0.05, -0.8, 0.6))).to_euler()
    bpy.context.view_layer.update(); wrap_onto(em, shell)
    H = Vector((1.2, 0, 1.22))
    parts = [("cap", (0.45, 0, 0.5), (0.98, 0, 1.02), 0.22), ("ell", H, 0.3, (1.15, 0.92, 0.88)),
             ("ball", H + Vector((0.27, 0, -0.04)), 0.18), ("ball", H + Vector((0.02, 0.13, 0.15)), 0.11),
             ("ball", H + Vector((0.02, -0.13, 0.15)), 0.11), ("ball", (0.5, 0, 0.42), 0.3)]
    feet = []
    for x, y in ((0.45, -0.52), (0.45, 0.52), (-0.65, -0.52), (-0.65, 0.52)):
        parts += [("cap", (x, y * 0.85, 0.42), (x + 0.04, y, 0.08), 0.21),
                  ("ell", (x + 0.06, y * 1.03, 0.05), 0.22, (1.2, 1.05, 0.45))]
        feet.append((Vector((x + 0.06, y * 1.03, 0.04)), Vector((1, 0.5 * (1 if y > 0 else -1), 0))))
    parts.append(("cap", (-1.05, 0, 0.25), (-1.3, 0, 0.12), 0.07))
    body = blob("body", parts, 0.028, 12000)
    smile = mouth(H, 0.2, 0.17, H.z - 0.08)
    throat = lambda p, n: (1.0 if (n.x > 0.35 and n.z < 0.1 and p.z > 0.55 and p.x > 0.55) else 0) * (1 if p.z < H.z + 0.05 else 0)
    base = skin_paint(body, 1.3, throat)
    paint(body, lambda p, n: (0.12, 0.1, 0.08) if smile(p) else mixc(base(p, n), lt, 0.08))
    body.data.materials.append(vmat("skin", 0.75))
    for f, ahead in feet: claws(f, ahead)
    for s in (1, -1):
        eye(body, H + Vector((0.1, 0, 0.08)), (0.5, s * 0.85, 0.15), 0.1)
    drape("shawl", (0.62, 0, 0.86), (-0.3, 0, -1), 0.32, 0.62, 0.45, mixc((0.27, 0.45, 0.35), dk, 0.3), f"shawl-{lt}")
    beads((0.74, 0, 0.88), (0.65, 0, 0.75), 0.3, 18, 0.12, 4, lt)
    # a gold bell and a jade disc hang from the shell's rim on the near side
    ball("bell", solid("gold", GOLD, 0.35), (-0.45, -0.8, 0.3), 0.11)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.08, minor_radius=0.035, major_segments=20, minor_segments=8,
                                     location=(-0.72, -0.76, 0.27), rotation=(math.pi / 2, 0, 0.5))
    bpy.context.active_object.data.materials.append(solid("jade", mixc(lt, (0.75, 0.85, 0.78), 0.45), 0.25, 0.25))
    smooth(bpy.context.active_object)
    tassel(Vector((-0.45, -0.82, 0.16)), 0.9); tassel(Vector((-0.72, -0.78, 0.15)), 0.9)


def ascended(sc, lt, dk):
    """The highest ally form: the tortoise sage standing upright in a long robe, shell on its back, a staff in hand
    and its core grown into a yin-yang medallion over its heart."""
    lights(sc)
    rng = random.Random(f"ascended-{lt}")
    shell = shell_mesh("shell", 0.62, dk)
    shell.location = (-0.24, 0, 1.25); shell.rotation_euler = (0, -math.pi / 2, 0)
    leaves(rng, shell, 22, 0.62)
    H = Vector((0.2, 0, 2.05))
    parts = [("ell", H, 0.22, (1.15, 0.92, 0.9)), ("ball", H + Vector((0.2, 0, -0.03)), 0.13),
             ("ball", H + Vector((0.02, 0.1, 0.11)), 0.08), ("ball", H + Vector((0.02, -0.1, 0.11)), 0.08),
             ("cap", (0.0, 0, 1.55), (0.12, 0, 1.92), 0.13), ("cap", (0, 0, 0.95), (0, 0, 1.5), 0.3),
             ("ball", (0, 0, 0.9), 0.3), ("cap", (0, -0.32, 1.52), (0, 0.32, 1.52), 0.15)]
    feet = []
    for y in (-0.2, 0.2):
        parts += [("cap", (0, y, 0.85), (0.02, y * 1.1, 0.12), 0.15), ("ell", (0.09, y * 1.1, 0.05), 0.17, (1.3, 1.0, 0.45))]
        feet.append((Vector((0.09, y * 1.1, 0.04)), Vector((1, 0.4 * (1 if y > 0 else -1), 0))))
    hands = []
    for s in (-1, 1):
        sh, el, hd = Vector((0, s * 0.42, 1.5)), Vector((0.1, s * 0.5, 1.12)), Vector((0.32, s * 0.42, 0.95))
        parts += [("cap", sh, el, 0.1), ("cap", el, hd, 0.09), ("ball", hd + Vector((0.04, 0, 0)), 0.1)]
        hands.append(hd + Vector((0.04, 0, 0)))
    body = blob("body", parts, 0.025, 12000)
    smile = mouth(H, 0.14, 0.12, H.z - 0.07)
    throat = lambda p, n: 1.0 if (n.x > 0.4 and p.z > 1.5 and p.z < H.z - 0.02) else 0
    base = skin_paint(body, 2.1, throat)
    paint(body, lambda p, n: (0.12, 0.1, 0.08) if smile(p) else mixc(base(p, n), lt, 0.08))
    body.data.materials.append(vmat("skin", 0.75))
    for f, ahead in feet: claws(f, ahead, 0.8)
    for s in (1, -1):
        eye(body, H + Vector((0.08, 0, 0.06)), (0.5, s * 0.85, 0.15), 0.075)
    trim = mixc((0.27, 0.45, 0.35), dk, 0.3)
    drape("robe", (0.02, 0, 1.12), (0, 0, -1), 0.4, 0.5, 0.85, trim, f"robe-{lt}", 0.15)
    drape("shawl", (0.02, 0, 1.7), (0, 0, -1), 0.24, 0.5, 0.36, trim, f"shawl-{lt}", 0.5)
    plate = ball("plastron", solid("plate", (0.66, 0.6, 0.44), 0.6), (0.27, 0, 1.22), 0.25, (0.35, 0.8, 1.0), 24)
    em = emblem("core", 0.17, lt, 2.6, 56)
    em.location = (0.37, 0, 1.22); em.rotation_euler = (0, math.pi / 2, 0)
    bpy.context.view_layer.update(); wrap_onto(em, plate, 0.01)
    beads((0.05, 0, 1.68), (0.15, 0, 1), 0.27, 18, 0.1, 4, lt)
    # a wooden staff with a gourd, held in the far hand so the medallion stays in view
    wood = solid("staff", (0.42, 0.28, 0.16), 0.7)
    h = hands[1]
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.035, depth=2.15, location=(h.x, h.y + 0.02, 1.0))
    o = bpy.context.active_object; o.data.materials.append(wood); o.rotation_euler = (-0.04, 0, 0); smooth(o)
    gourd = solid("gourd", (0.78, 0.58, 0.28), 0.5)
    ball("gourd", gourd, (h.x, h.y + 0.06, 2.12), 0.1); ball("gourd", gourd, (h.x, h.y + 0.06, 2.27), 0.07)
    tassel(Vector((h.x, h.y + 0.1, 2.0)), 0.8)


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


report = {"family": "shellback", "daemon": "protector", "stages": STAGES, "items": []}
for d in ("render", "sprite", "glb"): (OUT / d).mkdir(parents=True, exist_ok=True)
for el, (lt, dk) in ELEMENTS.items():
    if args.only and el != args.only: continue
    for st in STAGES:
        sc = reset(1.2, 3.3) if st == "ascended" else reset(0.65, 3.3) if st == "creature" else reset()
        rng = random.Random(f"shellback-{el}-{st}")
        if st == "gas":
            gas(rng, lt, dk, 140, 0.42)
        elif st == "core":
            gas(rng, lt, dk, 40, 0.38, core_pull=0.45); core(lt)
        elif st == "hologram":
            hologram(lt, dk)
        elif st == "creature":
            creature(sc, lt, dk)
        else:
            ascended(sc, lt, dk)
        base = f"{el}-{st}"
        render(sc, OUT / "render" / f"{base}.png")
        sprite(OUT / "render" / f"{base}.png", OUT / "sprite" / f"{base}.png", args.sprite)
        bpy.ops.export_scene.gltf(filepath=str(OUT / "glb" / f"{base}.glb"), export_format="GLB", export_apply=True)
        tris = sum(len(o.data.polygons) for o in sc.objects if o.type == "MESH")
        report["items"].append({"element": el, "stage": st, "faces": tris,
                                "glb_kb": round(os.path.getsize(OUT / "glb" / f"{base}.glb") / 1024, 1)})
        print("done", base, tris, flush=True)
(OUT / "report.json").write_text(json.dumps(report, indent=1))
