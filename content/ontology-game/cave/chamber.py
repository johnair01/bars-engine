"""The pool chamber of the Cave of Lessons, built in Blender. Run: /home/user/blenv/bin/python content/ontology-game/cave/chamber.py [--no-render]
Writes chamber.glb (its textures packed inside), view_front.png, view_top.png and textures/*.jpg into /tmp/blender-cloud/chamber (or the folder after --out).
To change the chamber, edit this file: the pieces are one place(...) line each, near the end (bpt-recipe-result), and
the objects one obj(...) line each (J2, objects.py). A Blendkit object needs the network the first time it is fetched."""
import math, os, random, sys
import bpy
import bmesh

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from textures import node, rgb, texture  # noqa: E402  the three stone textures, shared with bake_tiles.py
from objects import blenderkit, check, cushion, local, obj, picture, script  # noqa: E402  J2: placed objects

KIT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cave-kit.glb")  # pieces: pool, gate_stone, portal_arch, stone_spire, glow_cap, root_curl, crystal_cluster, crystal_cluster_bed; each 1 unit high (pool, arch: radius 1)
OUT = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "/tmp/blender-cloud/chamber"
os.makedirs(OUT, exist_ok=True)
R, H, SEED, ROUGH = 7, 5, 7, 0.06  # chamber radius and height in metres
LIGHT, LIGHT_STRENGTH, AMBIENT = "#ffd9a8", 1, 0.15

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
bpy.ops.import_scene.gltf(filepath=KIT)
kit = {o.name: o.data for o in sc.objects}
for o in list(sc.objects):
    bpy.data.objects.remove(o)


def mat(name, colour, rough, glow=0.0, texture=None, scale=1.0):
    """texture: wet_stone, dry_stone or crystal_vein, made from noise and Voronoi nodes and baked to a 512 px JPEG
    per surface; scale > 1 makes the pattern finer."""
    m = bpy.data.materials.new(name)
    if texture:
        m["texture"], m["scale"], m["colour"] = texture, scale, colour
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*rgb(colour), 1)
    p.inputs["Roughness"].default_value = rough
    if glow:
        p.inputs["Emission Color"].default_value = (*rgb(colour), 1)
        p.inputs["Emission Strength"].default_value = glow
    return m


def place(name, piece, material, loc, rot_deg, scale):
    ob = bpy.data.objects.new(name, kit[piece].copy())
    sc.collection.objects.link(ob)
    if material.get("texture") and not ob.data.uv_layers:
        unwrap(ob)
    ob.data.materials.clear()
    ob.data.materials.append(material)
    ob.location = loc
    ob.rotation_euler = tuple(math.radians(a) for a in rot_deg)
    ob.scale = scale
    return ob


def unwrap(ob):
    for o in sc.objects:
        o.select_set(o == ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake(objects, material):
    """Bakes the material's texture onto the first object's UVs; the others are copies of the same piece."""
    ob = objects[0]
    name = f"{material.name}_{ob.data.name.split('.')[0]}"
    img = bpy.data.images.new(name, TEX, TEX)
    m = bpy.data.materials.new(name + "_bake")
    nt = m.node_tree
    nt.nodes.clear()
    coord, scale = node(nt, "ShaderNodeTexCoord"), node(nt, "ShaderNodeVectorMath", operation="MULTIPLY")
    scale.inputs[1].default_value = tuple(material["scale"] * s for s in ob.scale)
    nt.links.new(coord.outputs["Object"], scale.inputs[0])
    col = texture(nt, material["texture"], material["colour"], scale.outputs[0])
    emit, out = node(nt, "ShaderNodeEmission"), node(nt, "ShaderNodeOutputMaterial")
    nt.links.new(col, emit.inputs["Color"])
    nt.links.new(emit.outputs[0], out.inputs["Surface"])
    target = node(nt, "ShaderNodeTexImage", image=img)
    nt.nodes.active = target
    ob.data.materials[0] = m
    for o in sc.objects:
        o.select_set(o == ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.bake(type="EMIT", margin=4)
    path = os.path.join(OUT, "textures", name + ".jpg")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.file_format, sc.render.image_settings.quality = "JPEG", 82
    img.save(filepath=path, quality=82)
    bpy.data.images.remove(img)
    img = bpy.data.images.load(path)
    final = material.copy()
    final.name = name
    p, tex = final.node_tree.nodes["Principled BSDF"], final.node_tree.nodes.new("ShaderNodeTexImage")
    tex.image = img
    final.node_tree.links.new(tex.outputs["Color"], p.inputs["Base Color"])
    if material["texture"] == "crystal_vein":  # the veins glow; the dark rock barely does
        p.inputs["Emission Color"].default_value = (1, 1, 1, 1)
        final.node_tree.links.new(tex.outputs["Color"], p.inputs["Emission Color"])
        p.inputs["Emission Strength"].default_value = 0.6
    for o in objects:
        o.data.materials[0] = final
    bpy.data.materials.remove(m)
    return path


# ---- materials (texture: wet_stone, dry_stone, crystal_vein; scale: how fine) ----
TEX = 512
M_WALL = mat("wall", "#6b6159", 0.5, texture="wet_stone", scale=1.0)
M_FLOOR = mat("floor", "#5a524b", 0.9, texture="dry_stone", scale=1.0)
M_ROCK = mat("rock", "#8c8075", 0.8, texture="crystal_vein", scale=1.0)
M_STONE = mat("stone", "#70707e", 0.8, texture="dry_stone", scale=1.0)
M_WATER = mat("water", "#112933", 0.02)
M_GLOW = mat("glow", "#7fe8c8", 0.8, glow=2.75)
M_CRYSTAL = mat("crystal", "#8f84ff", 0.25, glow=2.25)
M_ROOT = mat("root", "#4a3426", 0.9)
M_ARCH = mat("arch", "#fff1b0", 0.8, glow=5)
M_CLOTH = mat("cloth", "#6e2f2a", 0.95)
M_CAP = mat("cap", "#5a3fd6", 0.6, glow=0.7)  # J3: tightness glows cold violet
M_STEM = mat("stem", "#a994ea", 0.7, glow=0.2)
M_AMBER = mat("amber", "#e0861a", 0.25, glow=0.9)  # J3: tension's sharp amber


def add(name, mesh, material):
    ob = bpy.data.objects.new(name, mesh)
    sc.collection.objects.link(ob)
    mesh.materials.append(material)
    return ob


# walls and floor, made here so their size follows the recipe
noise = random.Random(SEED)
ph = [noise.uniform(0, 6.3) for _ in range(4)]

def wall_r(a, t):
    w = 1 + ROUGH * (0.6 * math.sin(3 * a + ph[0]) + 0.4 * math.sin(7 * a + ph[1] + 2 * t))
    return R * w * (1 - 0.18 * t * t)  # leans in toward the roof

seg, rings = 64, 8
for part, keep in (("walls", lambda a: math.cos(a) >= 0), ("walls_front", lambda a: math.cos(a) < 0)):
    bm = bmesh.new()
    grid = {}
    for j in range(seg + 1):
        a = 2 * math.pi * (j % seg) / seg
        for i in range(rings + 1):
            t = i / rings
            rr = wall_r(a, t)
            grid[j, i] = (rr * math.sin(a), rr * math.cos(a), H * t)
    verts = {}
    for j in range(seg):
        if not keep(2 * math.pi * (j + 0.5) / seg):
            continue
        for i in range(rings):
            quad = [(j, i), (j, i + 1), (j + 1, i + 1), (j + 1, i)]  # wound to face the chamber's centre
            for q in quad:
                if q not in verts:
                    verts[q] = bm.verts.new(grid[q])
            bm.faces.new([verts[q] for q in quad])
    bm.normal_update()
    me = bpy.data.meshes.new(part)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = add(part, me, M_WALL)
    unwrap(ob)
    if part == "walls_front":
        ob.visible_camera = False  # cut away so the camera sees in; the GLB keeps it

bm = bmesh.new()
centre = bm.verts.new((0, 0, 0))
edge = [bm.verts.new((wall_r(2 * math.pi * j / seg, 0) * math.sin(2 * math.pi * j / seg),
                      wall_r(2 * math.pi * j / seg, 0) * math.cos(2 * math.pi * j / seg), 0)) for j in range(seg)]
for j in range(seg):
    bm.faces.new((centre, edge[(j + 1) % seg], edge[j]))
me = bpy.data.meshes.new("floor")
bm.to_mesh(me)
bm.free()
unwrap(add("floor", me, M_FLOOR))

# ---- pieces: name, piece, material, location (x right, y back, z up; metres), rotation (degrees), scale ----
place("pool.1", "pool", M_WATER, (0.00, 0.50, 0.11), (0, 0, 0), (1.80, 1.80, 1.80))
place("stones.1", "gate_stone", M_STONE, (0.00, 3.50, 0.00), (0, 0, -0), (5.28, 5.28, 2.40))
place("stones.2", "gate_stone", M_STONE, (2.60, 2.00, 0.00), (0, 0, -60), (5.28, 5.28, 2.40))
place("stones.3", "gate_stone", M_STONE, (2.60, -1.00, 0.00), (0, 0, -120), (5.28, 5.28, 2.40))
place("stones.4", "gate_stone", M_STONE, (0.00, -2.50, 0.00), (0, 0, -180), (5.28, 5.28, 2.40))
place("stones.5", "gate_stone", M_STONE, (-2.60, -1.00, 0.00), (0, 0, -240), (5.28, 5.28, 2.40))
place("stones.6", "gate_stone", M_STONE, (-2.60, 2.00, 0.00), (0, 0, -300), (5.28, 5.28, 2.40))
place("arch.1", "portal_arch", M_ARCH, (0.00, 6.17, 0.00), (0, 0, 0), (2.60, 2.60, 2.60))
place("spires.1", "stone_spire", M_ROCK, (-5.15, -2.97, 0.00), (0, 0, 120), (1.93, 1.93, 1.93))
place("spires.2", "stone_spire", M_ROCK, (-6.03, 0.53, 0.00), (0, 0, 85), (1.50, 1.50, 1.50))
place("spires.3", "stone_spire", M_ROCK, (-4.51, 3.79, 0.00), (0, 0, 50), (2.16, 2.16, 2.16))
place("caps.1", "glow_cap", M_GLOW, (4.46, 2.52, 0.00), (0, 0, 294), (0.69, 0.69, 0.69))
place("caps.2", "glow_cap", M_GLOW, (4.38, 2.09, 0.00), (0, 0, 303), (0.97, 0.97, 0.97))
place("caps.3", "glow_cap", M_GLOW, (4.13, 2.93, 0.00), (0, 0, 90), (0.99, 0.99, 0.99))
place("roots.1", "root_curl", M_ROOT, (3.21, 5.57, 4.85), (180, 0, -30), (1.70, 1.70, 1.70))
place("roots.2", "root_curl", M_ROOT, (6.04, 2.20, 4.85), (180, 0, -70), (1.64, 1.64, 1.64))
place("roots.3", "root_curl", M_ROOT, (6.04, -2.20, 4.85), (180, 0, -110), (1.53, 1.53, 1.53))
place("roots.4", "root_curl", M_ROOT, (3.21, -5.57, 4.85), (180, 0, -150), (1.86, 1.86, 1.86))
place("crystals.1", "crystal_cluster", M_CRYSTAL, (5.11, -2.38, 0.00), (0, 0, -115), (2.20, 2.20, 2.20))
place("crystals.1", "crystal_cluster_bed", M_ROCK, (5.11, -2.38, 0.00), (0, 0, -115), (2.20, 2.20, 2.20))

# ---- objects (J2): name, source, (x, y) on the floor, turn (degrees), height (metres), byte budget, face budget,
# material (None keeps the source's own; a list, one per part, for a picture mode that makes parts). Sources:
# blenderkit(query, index, id), picture(file, mode), script(builder). hang=z hangs the object with its top at z.
OBJECTS = []
obj("boulder.1", blenderkit("boulder", 0, "eff99517-c257-4525-9fe3-41bf2e367197"), (-3.20, -4.60), 30, 0.90, 120_000, 1200, None, OBJECTS)
obj("bowl.1", picture("offering_bowl.jpg", "lathe"), (0.70, -3.40), 0, 0.30, 60_000, 400, M_STONE, OBJECTS)
obj("cushion.1", script(cushion), (-0.80, -3.50), 0, 0.22, 20_000, 300, M_CLOTH, OBJECTS)
# J3: his concept pictures (pictures/j3_*.jpg), traced with no code of their own. Parts take a material each.
obj("mushrooms.1", picture("j3_mushroom.jpg", "mushrooms", flat=True, texture=True), (-4.10, 1.60), 20, 0.90, 200_000, 0, [M_CAP, M_STEM, M_STONE], OBJECTS)
obj("amber.1", picture("j3_crystal.jpg", "crystals", flat=True, texture=True), (3.20, -4.80), -30, 1.10, 100_000, 0, [M_AMBER, M_ROCK], OBJECTS)
# Greenery: his Blendkit picks (2026-10-13, "Let's go with that pick and also the stylize pitcher plant"), CC0,
# exported to GLB because Blendkit offers them only as .blend: local(file, id, mesh).
obj("mossrock.1", local("rock-with-moss.glb", "4e142bae-6a0f-4bdc-94f0-2521b53de988"), (-4.90, 2.80), 40, 0.55, 150_000, 1200, None, OBJECTS)
obj("fern.1", local("fern-02.glb", "ac5a7010-e00c-46e7-8fbc-a8a0d9b7a9c4", "fern_02_b"), (-5.60, -1.40), 0, 0.50, 170_000, 1200, None, OBJECTS)
obj("fern.2", local("fern-02.glb", "ac5a7010-e00c-46e7-8fbc-a8a0d9b7a9c4", "fern_02_a"), (2.10, 4.90), 70, 0.40, 170_000, 1200, None, OBJECTS)
obj("grass.1", local("high-grass-clump.glb", "b21584e9-56bb-43a2-b00b-f0bd7e1e6c03"), (-1.90, -4.50), 0, 0.35, 80_000, 1200, None, OBJECTS)
obj("grass.2", local("high-grass-clump.glb", "b21584e9-56bb-43a2-b00b-f0bd7e1e6c03"), (1.90, -4.20), 120, 0.30, 80_000, 1200, None, OBJECTS)
obj("pitcher.1", local("pitcher-plant.glb", "bb9424ca-0bc6-49f2-89ff-bb66fcca60cf"), (4.90, 0.30), -60, 0.60, 120_000, 1200, None, OBJECTS)
obj("rootknot.1", picture("j3_root.jpg", "roots", faces=6000, flat=True, texture=True), (-1.60, 4.00), 10, 2.00, 290_000, 0, M_ROOT, OBJECTS, hang=4.85)

# ---- bake each textured surface: one JPEG per piece and texture ----
sc.render.engine = "CYCLES"  # Workbench and EEVEE need a GPU; the cloud has none
sc.cycles.device, sc.cycles.samples = "CPU", 1
groups = {}
for o in sc.objects:
    m = o.data.materials[0] if o.type == "MESH" and o.data.materials else None
    if m and m.get("texture"):
        groups.setdefault((m.name, o.data.name.split(".")[0] if o.name[:5] != "walls" else o.name), []).append(o)
baked = [bake(objs, bpy.data.materials[mname]) for (mname, _), objs in sorted(groups.items())]
placed = check(OBJECTS, wall_r, H, OUT)

glb = os.path.join(OUT, "chamber.glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format="GLB", export_apply=True, export_texcoords=True,
                          export_normals=True, export_image_format="JPEG", export_jpeg_quality=82)
tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in sc.objects if o.type == "MESH")

if "--no-render" not in sys.argv:
    world = bpy.data.worlds.new("cave")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (*rgb(LIGHT), 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = AMBIENT
    sc.world = world
    lamp = bpy.data.lights.new("roof", "AREA")
    lamp.color, lamp.energy, lamp.size = rgb(LIGHT), 250 * LIGHT_STRENGTH * (R / 7) ** 2, R
    lo = bpy.data.objects.new("roof", lamp)
    lo.location = (0, -R * 0.2, H * 1.1)
    sc.collection.objects.link(lo)
    sc.cycles.samples, sc.cycles.seed = 24, 0
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = 640, 400
    sc.render.image_settings.file_format = "PNG"
    sc.view_settings.view_transform = "AgX"
    cam_data = bpy.data.cameras.new("cam")
    cam = bpy.data.objects.new("cam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    from mathutils import Vector
    for view, loc, ortho in (("front", (0.35 * R, -2.1 * R, 1.25 * R + 0.3 * H), False),
                             ("top", (0, 0, 2.5 * R + H), True)):
        cam.location = loc
        target = Vector((0, 0.1 * R, 0.2 * H)) if not ortho else Vector((0, 0.0001, 0))
        cam.rotation_euler = (target - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        cam_data.type = "ORTHO" if ortho else "PERSP"
        cam_data.ortho_scale = 2.3 * R
        cam_data.lens = 35
        for w in ("walls", "walls_front"):
            sc.objects[w].visible_camera = not ortho and w == "walls"  # from above, the floor's edge is the wall
        sc.render.filepath = os.path.join(OUT, f"view_{view}.png")
        bpy.ops.render.render(write_still=True)
print(f"wrote {glb}: {os.path.getsize(glb) // 1024} KB, {tris} triangles, {len(baked)} textures")
for row in placed:
    print(f"  {row['id']}: {row['bytes'] // 1024} KB of {row['budget_bytes'] // 1024}, {row['faces']} faces, "
          f"lowest vertex {row['lowest_cm']} cm, {row['licence']}")
