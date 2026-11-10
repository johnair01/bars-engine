
import bpy
import math
from mathutils import Vector

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            block.remove(item)

def make_material(name, base_color, roughness=0.7, metallic=0.0, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

def add_cylinder(name, radius, depth, location, mat, verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    return obj

def add_cube(name, size, location, mat):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0]/2, size[1]/2, size[2]/2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    return obj

def add_torus(name, major_r, minor_r, location, mat):
    bpy.ops.mesh.primitive_torus_add(major_radius=major_r, minor_radius=minor_r,
                                     major_segments=32, minor_segments=12, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    return obj

def add_uv_sphere(name, radius, location, mat, segments=24, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=radius, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    return obj

def build_object():
    clear_scene()

    # Materials
    stone_dark = make_material("StoneDark", (0.18, 0.20, 0.18), roughness=0.9)
    stone_mid = make_material("StoneMid", (0.28, 0.30, 0.27), roughness=0.85)
    stone_warm = make_material("StoneWarm", (0.35, 0.30, 0.24), roughness=0.9)
    ash_mat = make_material("Ash", (0.10, 0.09, 0.08), roughness=1.0)
    ember_mat = make_material("Ember", (0.9, 0.35, 0.08), roughness=0.6,
                              emission=(1.0, 0.35, 0.05), emission_strength=6.0)
    jar_mat = make_material("Stoneware", (0.42, 0.30, 0.22), roughness=0.75)
    jar_lid = make_material("JarLid", (0.30, 0.22, 0.16), roughness=0.8)
    talisman_mat = make_material("Talisman", (0.92, 0.85, 0.55), roughness=0.6,
                                 emission=(1.0, 0.75, 0.30), emission_strength=2.5)
    ink_mat = make_material("Ink", (0.15, 0.05, 0.05), roughness=0.9)
    moss_mat = make_material("Moss", (0.20, 0.32, 0.18), roughness=1.0)

    # Sunken hearth: outer ring of stones (raised rim), sunken interior
    # Ground plane (cave floor)
    add_cube("CaveFloor", (6.0, 6.0, 0.1), (0, 0, -0.05), stone_dark)

    # Sunken pit: a dark disc slightly below floor
    add_cylinder("PitFloor", 1.4, 0.05, (0, 0, -0.35), ash_mat, verts=48)

    # Ring of stones around the pit (raised rim)
    n_stones = 14
    for i in range(n_stones):
        ang = (i / n_stones) * 2 * math.pi
        r = 1.55
        x = math.cos(ang) * r
        y = math.sin(ang) * r
        # vary size deterministically
        s = 0.28 + 0.06 * ((i * 7) % 5) / 4.0
        h = 0.22 + 0.05 * ((i * 3) % 4) / 3.0
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, h/2 - 0.05))
        stone = bpy.context.active_object
        stone.name = f"RimStone_{i}"
        stone.scale = (s, s * 0.85, h)
        stone.rotation_euler = (0, 0, ang + 0.3 * ((i % 3) - 1))
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        stone.data.materials.append(stone_mid if i % 2 == 0 else stone_warm)

    # Inner ring of smaller stones at pit edge
    for i in range(10):
        ang = (i / 10) * 2 * math.pi + 0.15
        r = 1.15
        x = math.cos(ang) * r
        y = math.sin(ang) * r
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(x, y, -0.15))
        s = 0.18 + 0.04 * ((i * 5) % 3) / 2.0
        stone = bpy.context.active_object
        stone.name = f"InnerStone_{i}"
        stone.scale = (s, s, 0.14)
        stone.rotation_euler = (0, 0, ang)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        stone.data.materials.append(stone_dark)

    # Ember bed in pit
    add_cylinder("EmberBed", 0.95, 0.06, (0, 0, -0.30), ember_mat, verts=32)
    # A few ember chunks
    for i in range(6):
        ang = (i / 6) * 2 * math.pi
        r = 0.35 + 0.15 * ((i * 3) % 4) / 3.0
        x = math.cos(ang) * r
        y = math.sin(ang) * r
        add_uv_sphere(f"Ember_{i}", 0.10 + 0.03 * (i % 3), (x, y, -0.26), ember_mat, segments=12, rings=8)

    # Moss patches on some rim stones
    for i in [1, 4, 7, 10, 12]:
        ang = (i / n_stones) * 2 * math.pi
        r = 1.55
        x = math.cos(ang) * r
        y = math.sin(ang) * r
        add_uv_sphere(f"Moss_{i}", 0.12, (x, y, 0.20), moss_mat, segments=10, rings=6)

    # Five spirit jars arranged around the hearth
    jar_positions = [
        (2.05, 0.55, 0.0),
        (1.55, 1.55, 0.0),
        (-0.55, 2.05, 0.0),
        (-1.85, 0.85, 0.0),
        (-1.35, -1.55, 0.0),
    ]
    for idx, (jx, jy, _) in enumerate(jar_positions):
        # Jar body (bulging)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=0.22,
                                             location=(jx, jy, 0.22))
        body = bpy.context.active_object
        body.name = f"JarBody_{idx}"
        body.scale = (1.0, 1.0, 1.15)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        body.data.materials.append(jar_mat)

        # Jar neck
        add_cylinder(f"JarNeck_{idx}", 0.11, 0.10, (jx, jy, 0.46), jar_mat, verts=16)
        # Jar lid
        add_cylinder(f"JarLid_{idx}", 0.13, 0.05, (jx, jy, 0.53), jar_lid, verts=16)
        # Lid knob
        add_uv_sphere(f"JarKnob_{idx}", 0.04, (jx, jy, 0.57), jar_lid, segments=10, rings=6)

        # Paper talisman seal on the jar front (facing hearth center)
        dx = -jx
        dy = -jy
        dist = math.hypot(dx, dy)
        nx, ny = dx / dist, dy / dist
        ang = math.atan2(ny, nx)
        tx = jx + nx * 0.22
        ty = jy + ny * 0.22
        bpy.ops.mesh.primitive_plane_add(size=0.14, location=(tx, ty, 0.30))
        tal = bpy.context.active_object
        tal.name = f"Talisman_{idx}"
        tal.rotation_euler = (math.radians(90), 0, ang + math.radians(90))
        tal.data.materials.append(talisman_mat)

        # Ink mark on talisman (small dark strip)
        bpy.ops.mesh.primitive_plane_add(size=0.02, location=(tx + nx*0.001, ty + ny*0.001, 0.30))
        ink = bpy.context.active_object
        ink.name = f"Ink_{idx}"
        ink.scale = (1.0, 4.0, 1.0)
        ink.rotation_euler = (math.radians(90), 0, ang + math.radians(90))
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        ink.data.materials.append(ink_mat)

    # Small stone bench / ledge at back
    add_cube("Ledge", (1.6, 0.5, 0.35), (0, -2.4, 0.175), stone_mid)

    # Lights
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 0.6))
    point_light = bpy.context.active_object
    point_light.name = "HearthPointLight"
    point_light.data.energy = 250.0
    point_light.data.color = (1.0, 0.55, 0.25)
    point_light.data.shadow_soft_size = 0.4

    bpy.ops.object.light_add(type='AREA', location=(3.5, -3.5, 4.0))
    area_light = bpy.context.active_object
    area_light.name = "CaveAreaLight"
    area_light.data.energy = 400.0
    area_light.data.color = (0.75, 0.82, 1.0)
    area_light.data.size = 4.0
    # aim at origin
    direction = Vector((0, 0, 0.5)) - area_light.location
    area_light.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    # Camera
    bpy.ops.object.camera_add(location=(4.2, -4.8, 3.2))
    cam = bpy.context.active_object
    cam.name = "Camera"
    target = Vector((0, 0, 0.3))
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 45
    bpy.context.scene.camera = cam

    # Render engine
    scene = bpy.context.scene
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        scene.render.engine = 'BLENDER_EEVEE'

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.filepath = "/home/workspace/bars-engine/tools/blender-cloud/make/contest/deepseek/obj4.png"

    # World background
    world = bpy.data.worlds.new("CaveWorld") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.03, 0.035, 0.05, 1.0)
        bg.inputs[1].default_value = 0.4

    return scene

if __name__ == "__main__":
    scene = build_object()
    bpy.ops.render.render(write_still=True)
    print("READY")
