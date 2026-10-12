"""A downloaded asset + a rigged walking figure -> preview PNG + animated GLB + report.json.

usage: python scene.py ASSET OUT_DIR [--tri-budget 25000] [--tex-max 1024] [--rot-z 0] [--scale 1] [--x 1.5]
ASSET is a .glb (run prepare_asset.py first if it is Draco or meshopt compressed) or a .blend.
Writes OUT_DIR/preview.png, scene.glb and report.json. Look at the preview before trusting the GLB.
"""
import argparse, json, math, pathlib, re, sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
ap = argparse.ArgumentParser()
ap.add_argument("asset")
ap.add_argument("out_dir")
ap.add_argument("--tri-budget", type=int, default=25000, help="decimate the asset to about this many triangles")
ap.add_argument("--tex-max", type=int, default=1024, help="shrink textures larger than this")
ap.add_argument("--rot-z", type=float, default=0.0, help="turn the asset about Z, degrees")
ap.add_argument("--scale", type=float, default=1.0)
ap.add_argument("--x", type=float, default=1.5, help="where the asset stands beside the walker")
ap.add_argument("--max-glb-mb", type=float, default=12.0, help="stop if the GLB is bigger than this")
args = ap.parse_args(argv)
asset_path, out_dir = pathlib.Path(args.asset), pathlib.Path(args.out_dir)
out_dir.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = 24
sc.frame_start, sc.frame_end = 1, 48

# ---- the downloaded asset (never built from primitives) ----
before = set(bpy.data.objects)
if asset_path.suffix.lower() == ".blend":
    with bpy.data.libraries.load(str(asset_path), link=False) as (src, dst):
        dst.objects = list(src.objects)
    for o in dst.objects:
        if o is not None:
            sc.collection.objects.link(o)
else:
    bpy.ops.import_scene.gltf(filepath=str(asset_path))
asset_objs = [o for o in bpy.data.objects if o not in before]
meshes = [o for o in asset_objs if o.type == "MESH"]
if not meshes:
    sys.exit(f"no mesh found in {asset_path.name}")

# Textures: shrink first, then deal with UDIM tiles (the glTF exporter cannot read tiled images).
for im in bpy.data.images:
    if im.size[0] > args.tex_max or im.size[1] > args.tex_max:
        im.scale(min(im.size[0], args.tex_max), min(im.size[1], args.tex_max))
tiled = [im for im in bpy.data.images if im.source == "TILED"]
for im in tiled:
    nums = [t.number for t in im.tiles]
    if len(nums) > 1:
        sys.exit(f"STOP: {asset_path.name} uses a multi-tile UDIM image {im.name!r} with tiles {nums}. "
                 "Copying one tile would drop the others. Use the asset's glTF variant (already baked) or pick another asset.")
    flat = bpy.data.images.new(im.name + "_flat", im.size[0], im.size[1])
    flat.pixels.foreach_set(im.pixels[:])
    flat.update(); flat.pack()
    for m in bpy.data.materials:
        if m.use_nodes:
            for n in m.node_tree.nodes:
                if n.type == "TEX_IMAGE" and n.image == im:
                    n.image = flat

# Everything goes out as JPEG except normal maps and anything feeding an alpha socket, which stay PNG.
# The exporter keeps an image's original encoding, so re-encode: save as JPEG, load it back, repoint the nodes.
tex_dir = out_dir / "tex"
tex_dir.mkdir(exist_ok=True)
jpeg = sc.render.image_settings
jpeg.file_format, jpeg.quality, jpeg.color_mode = "JPEG", 80, "RGB"
recoded = {}
for m in bpy.data.materials:
    if not m.use_nodes:
        continue
    for n in m.node_tree.nodes:
        if n.type != "TEX_IMAGE" or not n.image:
            continue
        im = n.image
        lossless = any(l.to_node.type == "NORMAL_MAP" or l.to_socket.name == "Alpha"
                       for out in n.outputs for l in out.links)
        if lossless or im.name in recoded and recoded[im.name] is None:
            continue
        if im.name not in recoded:
            path = str(tex_dir / (re.sub(r"[^A-Za-z0-9_-]+", "_", im.name) + ".jpg"))
            im.save_render(path, scene=sc)
            new = bpy.data.images.load(path)
            new.colorspace_settings.name = im.colorspace_settings.name
            recoded[im.name] = new
        n.image = recoded[im.name]
jpeg.file_format = "PNG"

def tri_count(objs):
    total = 0
    for o in objs:
        o.data.calc_loop_triangles()
        total += len(o.data.loop_triangles)
    return total

tris_before = tri_count(meshes)
ratio = min(1.0, args.tri_budget / max(tris_before, 1))
if ratio < 1.0:
    for o in meshes:
        d = o.modifiers.new("Decimate", "DECIMATE"); d.ratio = ratio

# Group under one root, turn, scale, stand on the floor.
asset = bpy.data.objects.new("AssetRoot", None)
sc.collection.objects.link(asset)
for o in asset_objs:
    if o.parent is None:
        o.parent = asset
asset.rotation_euler = (0, 0, math.radians(args.rot_z))
asset.scale = (args.scale,) * 3
bpy.context.view_layer.update()
corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
low = min(c.z for c in corners)
cx = (min(c.x for c in corners) + max(c.x for c in corners)) / 2
cy = (min(c.y for c in corners) + max(c.y for c in corners)) / 2
asset.location = (args.x - cx, -cy, -low)
bpy.context.view_layer.update()
dims = [round(max(c[i] for c in corners) - min(c[i] for c in corners), 3) for i in range(3)]
print("ASSET", asset_path.name, "dims", dims, "tris", tris_before, "->", round(tris_before * ratio))

# ---- six-box figure ----
def mat(name, rgb, rough=0.6):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = rough
    return m
cloth = mat("cloth", (0.10, 0.30, 0.70)); skin = mat("skin", (0.80, 0.50, 0.35), 0.5)

def box(name, center, size, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(m); return o

parts = [
    box("torso", (0, 0, 1.20), (0.50, 0.28, 0.60), cloth),
    box("head",  (0, 0, 1.68), (0.30, 0.30, 0.30), skin),
    box("armL",  (-0.34, 0, 1.25), (0.14, 0.14, 0.60), skin),
    box("armR",  (0.34, 0, 1.25), (0.14, 0.14, 0.60), skin),
    box("legL",  (-0.14, 0, 0.45), (0.20, 0.20, 0.90), cloth),
    box("legR",  (0.14, 0, 0.45), (0.20, 0.20, 0.90), cloth),
]
bpy.ops.object.select_all(action="DESELECT")
for p in parts: p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join(); fig = bpy.context.active_object; fig.name = "Figure"

# ---- seven-bone armature ----
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm = bpy.context.active_object; arm.name = "Rig"
ed = arm.data.edit_bones
for b in list(ed): ed.remove(b)
def bone(name, head, tail, parent=None):
    b = ed.new(name); b.head = head; b.tail = tail
    if parent: b.parent = ed[parent]
bone("hips",  (0, 0, 0.90), (0, 0, 1.00))
bone("spine", (0, 0, 1.00), (0, 0, 1.50), "hips")
bone("head",  (0, 0, 1.50), (0, 0, 1.90), "spine")
bone("armL",  (-0.30, 0, 1.50), (-0.30, 0, 0.95), "spine")
bone("armR",  (0.30, 0, 1.50), (0.30, 0, 0.95), "spine")
bone("legL",  (-0.14, 0, 0.90), (-0.14, 0, 0.0), "hips")
bone("legR",  (0.14, 0, 0.90), (0.14, 0, 0.0), "hips")
bpy.ops.object.mode_set(mode="OBJECT")
bpy.ops.object.select_all(action="DESELECT")
fig.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type="ARMATURE_AUTO")

# ---- 48-frame walk cycle, in place ----
bpy.ops.object.mode_set(mode="POSE")
P = arm.pose.bones
for pb in P: pb.rotation_mode = "XYZ"
sw, asw = math.radians(32), math.radians(26)
def key(f, t):
    s = math.sin(2 * math.pi * t)
    P["legL"].rotation_euler.x = sw * s
    P["legR"].rotation_euler.x = -sw * s
    P["armL"].rotation_euler.x = -asw * s
    P["armR"].rotation_euler.x = asw * s
    P["spine"].rotation_euler.z = math.radians(5) * s
    P["head"].rotation_euler.z = -math.radians(5) * s
    P["hips"].location.z = -0.03 * abs(math.cos(2 * math.pi * t))
    for pb in P: pb.keyframe_insert("rotation_euler", frame=f)
    P["hips"].keyframe_insert("location", frame=f)
for i in range(9):
    key(1 + i * 6, (i * 6) / 48.0)
bpy.ops.object.mode_set(mode="OBJECT")
arm.animation_data.action.name = "WalkCycle"

# ---- floor / light / camera (render only) ----
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0)); floor = bpy.context.active_object; floor.name = "Floor"
floor.data.materials.append(mat("floor", (0.55, 0.58, 0.60), 0.9))
bpy.ops.object.light_add(type="SUN", rotation=(math.radians(50), math.radians(10), math.radians(-30)))
bpy.context.active_object.data.energy = 3.5
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.80, 0.85, 1)
sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
bpy.ops.object.camera_add(location=(3.6, -4.2, 1.9))
cam = bpy.context.active_object; sc.camera = cam
cam.rotation_euler = (Vector((0.6, 0, 0.85)) - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 38
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 24
sc.cycles.use_denoising = False
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 854, 480, 100
sc.frame_set(13)
sc.render.filepath = str(out_dir / "preview.png")
bpy.ops.render.render(write_still=True)

# ---- GLB export without floor, light, camera ----
bpy.ops.object.select_all(action="DESELECT")
for o in [fig, arm, asset] + asset_objs:
    o.select_set(True)
glb = out_dir / "scene.glb"
bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", use_selection=True, export_animations=True,
                          export_skins=True, export_image_format="AUTO", export_jpeg_quality=80, export_apply=True)
size_mb = glb.stat().st_size / 1048576
report = {"asset": asset_path.name, "dims_m": dims, "tris_before": tris_before, "tris_after": round(tris_before * ratio),
          "tex_max": args.tex_max, "glb_mb": round(size_mb, 2)}
(out_dir / "report.json").write_text(json.dumps(report, indent=2))
print("REPORT", json.dumps(report))
if size_mb > args.max_glb_mb:
    sys.exit(f"STOP: scene.glb is {size_mb:.1f} MB, over {args.max_glb_mb} MB. Lower --tri-budget or --tex-max.")
