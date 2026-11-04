"""Render one place spec as a still, in Blender (bpy), from the state alone. Run under the bpy venv:

    /home/user/blenv/bin/python tools/blender-cloud/place_render.py state.json out.png [--size 960x540] [--samples 48] [--glb out.glb]
    /home/user/blenv/bin/python tools/blender-cloud/place_render.py --strip OUT_DIR

The scene is built from `place_spec.build(state)` and nothing else: the extent sets the tunnel (or, for earth, a low open
run), the seat sets the camera and the carried light, `light.lit_m` sets how far that light reaches, the props come from
`procgen.py` where the spec says `from: procgen` and from plain primitives where the kind has no generator yet, and the
materials come from the spec's material names. Randomness is `random.Random(int(seed, 16))`, so a rebuild is the same
scene. Spec: six-faces-council .specify/specs/place-generator/plan.md, step 3 and 4.

What is approximated, said plainly: the carried light's reach is an emissive term in the shader that falls to zero at
`lit_m` (Cycles has no cutoff distance), added to a real point light for form; the rock's colour is a Voronoi crack
pattern like the served cave's, not its baked stone textures (`textures.py`); crystals, basalt, shells and reef are
primitives. `TUNE` holds the per-element exposure and tint, set by measuring the first frames with swatch.py.
"""
import json, math, os, random, sys

import bpy
import bmesh
from mathutils import Vector, noise

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import place_spec  # noqa: E402
import procgen  # noqa: E402

# per element: base rock colour (sRGB hex), exposure (scales ambient and carried light), crack contrast, light colour, floor colour
TUNE = {
    "metal": dict(rock="#aa9aa8", floor="#847888", ambient=0.6, gain=0.95, crack=0.8, light="#ffe2bf", sky="#2a2830", expo=0.42),
    "wood": dict(rock="#8aa08a", floor="#6e7c66", ambient=0.6, gain=0.95, crack=0.8, light="#f4f4e4", sky="#242826", expo=0.45),
    "water": dict(rock="#8ea3ab", floor="#a6a58f", ambient=0.6, gain=0.95, crack=0.5, light="#e9f1ff", sky="#242a30", expo=0.4),
    "fire": dict(rock="#9c8680", floor="#6a605e", ambient=0.6, gain=0.95, crack=0.78, light="#ffd8b0", sky="#2a2424", expo=0.6),
    "earth": dict(rock="#9a948c", floor="#8a8a6e", ambient=0.6, gain=0.95, crack=0.6, light="#fff4e0", sky="#2f2f33", expo=0.3),
}


# a floor that lights less leaves more of the run in the dark, which drops edge density; the crack contrast makes it up
CRACK_BY_FLOOR = {"lower": 1.25, "middle": 1.0, "upper": 1.0}
EXPO_BY_FLOOR = {"lower": 1.9, "middle": 1.0, "upper": 0.72}


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)) + (1.0,)


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene


def material(name, colour, reach, ambient, gain, crack, scale=2.2, rough=0.9, emit=None, seat=(0, 0.6, 1.5)):
    """Rock or ground: Voronoi cracks over a noise tint. Brightness = ambient + gain * a mask that falls to 0 at `reach`
    metres from the seat (the carried light), so the lit run is as long as the spec says."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    coord = nt.nodes.new("ShaderNodeTexCoord")
    vor = nt.nodes.new("ShaderNodeTexVoronoi")
    vor.feature = "DISTANCE_TO_EDGE"
    vor.inputs["Scale"].default_value = scale
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 4.0
    nz.inputs["Detail"].default_value = 6.0
    nt.links.new(coord.outputs["Object"], vor.inputs["Vector"])
    nt.links.new(coord.outputs["Object"], nz.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")  # crack lines: dark where the cell edge is near
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (1 - crack * 0.97, 1 - crack * 0.97, 1 - crack * 0.97, 1)
    ramp.color_ramp.elements[1].position = 0.13
    ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    nt.links.new(vor.outputs["Distance"], ramp.inputs["Fac"])
    tint = nt.nodes.new("ShaderNodeMath")  # 0.75..1.15 variation across the stone
    tint.operation = "MULTIPLY_ADD"
    tint.inputs[1].default_value = 0.5
    tint.inputs[2].default_value = 0.72
    nt.links.new(nz.outputs["Fac"], tint.inputs[0])
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    mix.inputs["A"].default_value = colour
    nt.links.new(ramp.outputs["Color"], mix.inputs["B"])
    mult = nt.nodes.new("ShaderNodeMix")
    mult.data_type = "RGBA"
    mult.blend_type = "MULTIPLY"
    mult.inputs["Factor"].default_value = 1.0
    nt.links.new(mix.outputs["Result"], mult.inputs["A"])
    nt.links.new(tint.outputs["Value"], mult.inputs["B"])
    # carried-light mask from distance to the seat, 1 at the seat, 0 at `reach`
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    dist = nt.nodes.new("ShaderNodeVectorMath")
    dist.operation = "DISTANCE"
    dist.inputs[1].default_value = seat
    nt.links.new(geo.outputs["Position"], dist.inputs[0])
    mask = nt.nodes.new("ShaderNodeMapRange")
    mask.interpolation_type = "SMOOTHSTEP"
    mask.inputs["From Min"].default_value = reach * 0.25
    mask.inputs["From Max"].default_value = reach
    mask.inputs["To Min"].default_value = 1.0
    mask.inputs["To Max"].default_value = 0.0
    nt.links.new(dist.outputs["Value"], mask.inputs["Value"])
    lvl = nt.nodes.new("ShaderNodeMath")
    lvl.operation = "MULTIPLY_ADD"
    lvl.inputs[1].default_value = gain
    lvl.inputs[2].default_value = ambient
    nt.links.new(mask.outputs["Result"], lvl.inputs[0])
    em = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(mult.outputs["Result"], em.inputs["Color"])
    nt.links.new(lvl.outputs["Value"], em.inputs["Strength"])
    bsdf = nt.nodes.new("ShaderNodeBsdfDiffuse")
    nt.links.new(mult.outputs["Result"], bsdf.inputs["Color"])
    add = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(em.outputs["Emission"], add.inputs[0])
    nt.links.new(bsdf.outputs["BSDF"], add.inputs[1])
    nt.links.new(add.outputs["Shader"], out.inputs["Surface"])
    return m


def glow(name, colour, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = colour
    em.inputs["Strength"].default_value = strength
    nt.links.new(em.outputs["Emission"], out.inputs["Surface"])
    return m


def mesh_obj(name, verts, faces, mat, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], [tuple(f) for f in faces])
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.data.materials.append(mat)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return ob


def tunnel(spec, rng, mat_wall, mat_floor, open_roof):
    """An arch cross-section swept down +Y, wall noise from the seed. Earth leaves the roof off (a low open run)."""
    L, H, mouth = spec["extent"]["length_m"], spec["extent"]["height_m"], spec["extent"]["mouth"]
    W = {"far": 5.0, "near": 7.0, "wide": 9.0, "low": 6.0, "a_barrow_door": 12.0}.get(mouth, 6.0)
    seg, step = 30, 0.45
    rings = int((L + 6) / step) + 1
    off = Vector((rng.uniform(0, 99), rng.uniform(0, 99), rng.uniform(0, 99)))
    verts, faces = [], []
    for r in range(rings):
        y = -3 + r * step
        bend = 0.0 if y < 0 else 0.35 * math.sin(y / 6.0)
        for s in range(seg + 1):
            t = math.pi * s / seg
            top = 0.55 if open_roof else 1.0
            x = (W / 2) * math.cos(t)
            z = H * top * (math.sin(t) ** 0.7)
            rough = 0.28 * noise.fractal(Vector((x, y, z)) * 0.5 + off, 0.5, 2.0, 4)
            nrm = Vector((x, 0, z - 0.2)).normalized()
            verts.append((x + bend + nrm.x * rough, y, z + nrm.z * rough))
    for r in range(rings - 1):
        for s in range(seg):
            a = r * (seg + 1) + s
            faces.append((a, a + 1, a + seg + 2, a + seg + 1))
    walls = mesh_obj("walls", verts, faces, mat_wall)
    fv, ff = [], []
    for r in range(rings):
        y = -3 + r * step
        for s, x in enumerate((-W / 2, 0, W / 2)):
            n = 0.07 * noise.fractal(Vector((x, y, 0)) * 1.6 + off, 0.5, 2.0, 4)
            fv.append((x + (0 if y < 0 else 0.35 * math.sin(y / 6.0)), y, n))
    for r in range(rings - 1):
        for s in range(2):
            a = r * 3 + s
            ff.append((a, a + 1, a + 4, a + 3))
    mesh_obj("floor", fv, ff, mat_floor)
    return W


def put(ob, loc, scale=1.0, rot=(0, 0, 0)):
    ob.location = loc
    ob.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
    ob.rotation_euler = rot
    return ob


def prim(kind, mat, name):
    if kind == "cone":
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.12, radius2=0.0, depth=0.7)
    elif kind == "prism":
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.28, depth=1.0)
    elif kind == "ball":
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.5)
    elif kind == "box":
        bpy.ops.mesh.primitive_cube_add(size=1.0)
    elif kind == "disc":
        bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.5, depth=0.03)
    ob = bpy.context.active_object
    ob.name = name
    ob.data.materials.append(mat)
    return ob


def scatter(spec, rng, W, mats):
    """Props from the spec's `props`, by kind. Counts are the spec's. Positions are random.Random(seed), kept to the run."""
    L = spec["extent"]["length_m"]
    H = spec["extent"]["height_m"]

    def spot(side=None, ymin=1.0, ymax=None):
        y = rng.uniform(ymin, ymax or L * 0.9)
        x = (W / 2 - 0.5) * rng.uniform(-0.95, 0.95) if side is None else side * (W / 2 - rng.uniform(0.3, 0.9))
        return x, y

    for p in spec["props"]:
        k, n = p["kind"], p["count"]
        for i in range(n):
            nm = f"{k}-{i}"
            if k == "crystal":
                x, y = spot(side=rng.choice((-1, 1)))
                put(prim("cone", mats["crystal"], nm), (x, y, 0.4), rng.uniform(0.8, 1.7), (rng.uniform(-.4, .4), rng.uniform(-.4, .4), rng.uniform(0, 6)))
            elif k == "root":
                v, f = procgen.root_system(seed=rng.randrange(10 ** 6), roots=2, spread=0.5, **procgen.ROOT_STYLES["hanging"])
                x, y = spot(ymin=1.5)
                ob = mesh_obj(nm, v, f, mats["root"])
                put(ob, (x, y, H * 0.85), 1.1, (math.pi, 0, rng.uniform(0, 6)))  # grown from the roof, hanging
            elif k == "mushroom":
                v, f = procgen.mushroom(seed=rng.randrange(10 ** 6), **procgen.MUSHROOM_FORMS[rng.choice(("dome", "bell", "flat"))])
                x, y = spot(side=rng.choice((-1, 1)))
                put(mesh_obj(nm, v, f, mats["mush"]), (x, y, 0.0), rng.uniform(1.2, 2.2))
            elif k == "grass_clump":
                x, y = spot()
                put(prim("cone", mats["grass"], nm), (x, y, 0.3), (0.8, 0.8, rng.uniform(1.0, 1.8)))
            elif k == "shell":
                x, y = spot()
                put(prim("ball", mats["shell"], nm), (x, y, 0.12), (0.5, 0.4, 0.18), (0, 0, rng.uniform(0, 6)))
            elif k == "tide_pool":
                x, y = spot()
                put(prim("disc", mats["water"], nm), (x, y, 0.04), rng.uniform(1.6, 2.6))
            elif k == "reef":
                x, y = spot(side=rng.choice((-1, 1)))
                put(prim("ball", mats["reef"], nm), (x, y, 0.35), (rng.uniform(.6, 1.1), rng.uniform(.6, 1.1), rng.uniform(.8, 1.5)))
            elif k == "basalt_column":
                x, y = spot(side=rng.choice((-1, 1)))
                h = rng.uniform(2.0, H * 0.9)
                put(prim("prism", mats["basalt"], nm), (x, y, h / 2), (1.0, 1.0, h))
            elif k == "lava_seam":
                y = rng.uniform(1.0, L * 0.85)
                side = 1 if i % 2 else -1
                put(prim("box", mats["lava"], nm), (side * (W / 2 - 0.35), y, 1.2), (0.06, rng.uniform(2.5, 4.0), 0.12))
            elif k == "ember_drift":
                x, y = spot()
                put(prim("ball", mats["lava"], nm), (x, y, rng.uniform(0.8, H * 0.8)), 0.06)
            elif k == "standing_stone":
                x, y = spot()
                h = rng.uniform(1.4, 2.4)
                put(prim("box", mats["stone"], nm), (x, y, h / 2), (rng.uniform(.5, .9), rng.uniform(.3, .5), h), (0, 0, rng.uniform(-.3, .3)))
            elif k == "barrow_door":
                put(prim("box", mats["stone"], nm), (0, L * 0.92, 1.2), (2.4, 0.5, 2.4))


def build_scene(state, size, samples):
    spec = place_spec.build(state)
    el = state["element"]
    T = dict(TUNE[el])
    T["crack"] = min(1.0, T["crack"] * (1.6 if not state["charge"]["route_open"] else CRACK_BY_FLOOR[state["charge"]["floor"]]))
    T["expo"] *= EXPO_BY_FLOOR[state["charge"]["floor"]] * (1.7 if not state["charge"]["route_open"] else 1.0)
    T["ambient"] *= T["expo"]
    T["gain"] *= T["expo"]
    rng = random.Random(int(spec["seed"], 16))
    sc = reset()
    reach = spec["light"]["lit_m"]
    closed = not state["charge"]["route_open"]
    seat = (0.0, 0.6, spec["camera"]["height_m"] - 0.2)
    wall = material("rock", hex_rgb(T["rock"]), reach, T["ambient"], T["gain"], T["crack"], seat=seat)
    floor = material("floor", hex_rgb(T["floor"]), reach, T["ambient"] * 0.45, T["gain"] * 4.0, T["crack"] * 0.8, scale=4.0, seat=seat)  # the floor carries the reach: bright to lit_m, then dim
    if closed:  # the run is dark; one seam where it arrives (mab-unlit-path-still-arrives)
        wall = material("rock", hex_rgb(T["rock"]), 0.6, T["ambient"], T["gain"] * 0.2, T["crack"], seat=seat)
        floor = material("floor", hex_rgb(T["floor"]), 0.6, T["ambient"], T["gain"] * 0.2, T["crack"] * 0.8, scale=4.0, seat=seat)
    mats = dict(
        crystal=glow("crystal", hex_rgb("#d8c9ff"), 1.2), root=material("root", hex_rgb("#6d5a46"), reach, 0.35, 0.6, 0.3, scale=9.0),
        mush=glow("mush", hex_rgb("#e7d8b5"), 0.7), grass=material("grass", hex_rgb("#7a8f4a"), reach, 0.35, 0.6, 0.3, scale=9.0),
        shell=glow("shell", hex_rgb("#efe3d6"), 0.8), water=glow("water", hex_rgb("#7fa6c8"), 0.6),
        reef=material("reef", hex_rgb("#b98a86"), reach, 0.35, 0.6, 0.3, scale=6.0), basalt=material("basalt", hex_rgb("#5f5558"), reach, 0.35, 0.6, 0.5, scale=6.0),
        lava=glow("lava", hex_rgb("#ff6a1a"), 6.0), stone=material("stone", hex_rgb("#9a968b"), reach, 0.35, 0.6, 0.5, scale=5.0))
    W = tunnel(spec, rng, wall, floor, open_roof=(el == "earth"))
    scatter(spec, rng, W, mats)
    if closed:  # the arrival seam
        put(prim("box", mats["lava"] if el == "fire" else mats["crystal"], "arrival"), (0, spec["extent"]["length_m"] * 0.5, 1.0), (0.1, 0.1, 2.0))
    if spec["light"].get("far_answer_lit") is False:
        pass  # the far seat stays dark until it answers: nothing is placed there
    ld = bpy.data.lights.new("carried", "POINT")
    ld.energy = 40 * T["gain"] * (0.35 if closed else 1.0)
    ld.color = hex_rgb(T["light"])[:3]
    ld.shadow_soft_size = 0.4
    lo = bpy.data.objects.new("carried", ld)
    sc.collection.objects.link(lo)
    lo.location = seat
    cam = bpy.data.cameras.new("cam")
    cam.angle = math.radians(spec["camera"]["fov_deg"])
    co = bpy.data.objects.new("cam", cam)
    sc.collection.objects.link(co)
    co.location = (0, 0, spec["camera"]["height_m"])
    co.rotation_euler = (math.radians(86), 0, 0)  # looking down +Y, a little below the horizon
    sc.camera = co
    w = bpy.data.worlds.new("w")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = hex_rgb(T["sky"])
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6
    sc.world = w
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.view_settings.view_transform = "Standard"
    sc.render.resolution_x, sc.render.resolution_y = size
    sc.render.image_settings.file_format = "PNG"
    return spec


def render(state, out, size=(960, 540), samples=48, glb=None):
    spec = build_scene(state, size, samples)
    sc = bpy.context.scene
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
    if glb:
        bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB")
    return spec


def main(argv):
    size, samples, glb = (960, 540), 48, None
    if "--size" in argv:
        size = tuple(int(x) for x in argv[argv.index("--size") + 1].split("x"))
    if "--samples" in argv:
        samples = int(argv[argv.index("--samples") + 1])
    if "--glb" in argv:
        glb = argv[argv.index("--glb") + 1]
    if argv and argv[0] == "--strip":
        d = argv[1]
        os.makedirs(d, exist_ok=True)
        for st in place_spec.strip_states():
            render(st, os.path.join(d, place_spec.place_id(st) + ".png"), size, samples)
            print("rendered", place_spec.place_id(st), flush=True)
        return
    state = json.load(open(argv[0]))
    render(state, argv[1], size, samples, glb)


if __name__ == "__main__":
    main(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:])
