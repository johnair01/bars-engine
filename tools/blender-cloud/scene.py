"""Chair asset + rigged walking figure -> preview PNG + animated GLB.
usage: python scene.py CHAIR_BLEND OUT_DIR   (writes preview.png and scene.glb)
"""
import sys, math, bpy
from mathutils import Vector

chair_path, out_dir = sys.argv[1], sys.argv[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = 24
sc.frame_start, sc.frame_end = 1, 48

# ---- the downloaded chair (BlenderKit .blend, no primitives) ----
with bpy.data.libraries.load(chair_path, link=False) as (src, dst):
    dst.objects = list(src.objects)
chair_objs = [o for o in dst.objects if o is not None]
for o in chair_objs:
    sc.collection.objects.link(o)
for im in bpy.data.images:
    if im.size[0] > 1024:
        im.scale(1024, 1024)
# glTF export cannot read UDIM tiles: copy tile 1001 into a plain image and repoint the nodes
for im in list(bpy.data.images):
    if im.source == 'TILED':
        flat = bpy.data.images.new(im.name + "_flat", im.size[0], im.size[1])
        flat.pixels.foreach_set(im.pixels[:])
        flat.update(); flat.pack()
        for m in bpy.data.materials:
            if m.use_nodes:
                for n in m.node_tree.nodes:
                    if n.type == 'TEX_IMAGE' and n.image == im:
                        n.image = flat
chair = chair_objs[0]
print("CHAIR", chair.name, chair.type, tuple(round(x, 3) for x in chair.dimensions), "faces", len(chair.data.polygons))
dec = chair.modifiers.new("Decimate", 'DECIMATE'); dec.ratio = 0.15
chair.location = (1.5, 0.0, 0.0)
chair.rotation_euler = (0, 0, math.radians(-90))   # tuned after first preview

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
bpy.ops.object.select_all(action='DESELECT')
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
    return b
bone("hips",  (0, 0, 0.90), (0, 0, 1.00))
bone("spine", (0, 0, 1.00), (0, 0, 1.50), "hips")
bone("head",  (0, 0, 1.50), (0, 0, 1.90), "spine")
bone("armL",  (-0.30, 0, 1.50), (-0.30, 0, 0.95), "spine")
bone("armR",  (0.30, 0, 1.50), (0.30, 0, 0.95), "spine")
bone("legL",  (-0.14, 0, 0.90), (-0.14, 0, 0.0), "hips")
bone("legR",  (0.14, 0, 0.90), (0.14, 0, 0.0), "hips")
bpy.ops.object.mode_set(mode='OBJECT')

bpy.ops.object.select_all(action='DESELECT')
fig.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
groups = [g.name for g in fig.vertex_groups]
print("WEIGHT GROUPS:", groups)

# ---- 48-frame walk cycle, in place ----
bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='POSE')
P = arm.pose.bones
for pb in P: pb.rotation_mode = 'XYZ'
sw, asw = math.radians(32), math.radians(26)
def key(f, t):  # t in [0,1) of cycle
    s = math.sin(2 * math.pi * t)
    P["legL"].rotation_euler.x = sw * s
    P["legR"].rotation_euler.x = -sw * s
    P["armL"].rotation_euler.x = -asw * s
    P["armR"].rotation_euler.x = asw * s
    P["spine"].rotation_euler.z = math.radians(5) * s
    P["head"].rotation_euler.z = -math.radians(5) * s
    P["hips"].location.z = 0.03 * abs(math.cos(2 * math.pi * t)) * -1 + 0.0
    for pb in P:
        pb.keyframe_insert("rotation_euler", frame=f)
    P["hips"].keyframe_insert("location", frame=f)
for i in range(9):
    key(1 + i * 6, (i * 6) / 48.0)
bpy.ops.object.mode_set(mode='OBJECT')
arm.animation_data.action.name = "WalkCycle"
for fc in arm.animation_data.action.fcurves if hasattr(arm.animation_data.action, "fcurves") else []:
    for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'

# ---- floor / light / camera (render only) ----
bpy.ops.mesh.primitive_plane_add(size=10, location=(0, 0, 0)); floor = bpy.context.active_object; floor.name = "Floor"
floor.data.materials.append(mat("floor", (0.55, 0.58, 0.60), 0.9))
bpy.ops.object.light_add(type='SUN', rotation=(math.radians(50), math.radians(10), math.radians(-30)))
bpy.context.active_object.data.energy = 3.5
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.80, 0.85, 1)
sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
bpy.ops.object.camera_add(location=(3.6, -4.2, 1.9))
cam = bpy.context.active_object; sc.camera = cam
d = Vector((0.6, 0, 0.85)) - cam.location
cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 38

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 24
sc.cycles.use_denoising = False
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 854, 480, 100
sc.frame_set(13)
sc.render.filepath = f"{out_dir}/preview.png"
bpy.ops.render.render(write_still=True)
print("RENDERED", sc.render.filepath)

# ---- GLB export without floor/light/camera ----
bpy.ops.object.select_all(action='DESELECT')
for o in [fig, arm, chair]:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=f"{out_dir}/scene.glb", export_format='GLB', use_selection=True,
                          export_animations=True, export_skins=True, export_image_format='AUTO',
                          export_apply=True)
print("EXPORTED")
