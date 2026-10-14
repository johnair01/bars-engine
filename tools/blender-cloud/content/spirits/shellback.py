"""The first spirit proof: the Shellback (the Protector's body family) in its three stages, in all five elements.

Stages (Wendell's board steer on sg-grows-into-shape, 2026-10-14): a gas that solidifies into a core, which then
projects a holographic ally into the world. Each stage is built from primitives here, rendered with Cycles on the CPU
and shrunk to a pixel sprite, so one model gives both assets (sg-assets-modular). Nothing is downloaded.

    /home/user/blenv/bin/python tools/blender-cloud/content/spirits/shellback.py OUT_DIR [--samples 32] [--size 512]

Writes OUT_DIR/render/<element>-<stage>.png, OUT_DIR/sprite/<element>-<stage>.png (96 px, three alpha steps),
OUT_DIR/glb/<element>-<stage>.glb and OUT_DIR/report.json. The same arguments always give the same spirit.
"""
import argparse, json, math, os, pathlib, random, sys

import bpy
from mathutils import Vector

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
STAGES = ["gas", "core", "hologram"]


def lin(c):  # sRGB to linear, so the colours match the tokens
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)


def reset():
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
    cam.data.type = "ORTHO"; cam.data.ortho_scale = 3.0
    sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (3.4, -4.2, 2.6)
    cam.rotation_euler = (Vector((0, 0, 0.35)) - cam.location).to_track_quat("-Z", "Y").to_euler()
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
        sc = reset()
        rng = random.Random(f"shellback-{el}-{st}")
        if st == "gas":
            gas(rng, lt, dk, 140, 0.42)
        elif st == "core":
            gas(rng, lt, dk, 40, 0.38, core_pull=0.45); core(lt)
        else:
            hologram(lt, dk)
        base = f"{el}-{st}"
        render(sc, OUT / "render" / f"{base}.png")
        sprite(OUT / "render" / f"{base}.png", OUT / "sprite" / f"{base}.png", args.sprite)
        bpy.ops.export_scene.gltf(filepath=str(OUT / "glb" / f"{base}.glb"), export_format="GLB", export_apply=True)
        tris = sum(len(o.data.polygons) for o in sc.objects if o.type == "MESH")
        report["items"].append({"element": el, "stage": st, "faces": tris,
                                "glb_kb": round(os.path.getsize(OUT / "glb" / f"{base}.glb") / 1024, 1)})
        print("done", base, tris, flush=True)
(OUT / "report.json").write_text(json.dumps(report, indent=1))
