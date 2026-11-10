
import bpy
import math
from mathutils import Vector

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for item in list(block):
            block.remove(item)

def make_material(name, color, metallic=0.0, roughness=0.5, emission=None, emission_strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if emission is not None:
        bsdf.inputs["Emission Color"].default_value = (*emission, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat

def add_box(name, size, location, material, rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0]/2, size[1]/2, size[2]/2)
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.data.materials.append(material)
    return obj

def add_cylinder(name, radius, depth, location, material, rotation=(0,0,0), vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=location, vertices=vertices)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = rotation
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    obj.data.materials.append(material)
    return obj

def add_sphere(name, radius, location, material, segments=16, rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(material)
    return obj

def build_object():
    clear_scene()

    # Materials
    bronze = make_material("Bronze", (0.42, 0.28, 0.14), metallic=0.9, roughness=0.35)
    bronze_dark = make_material("BronzeDark", (0.22, 0.15, 0.08), metallic=0.85, roughness=0.5)
    gold = make_material("GoldSeam", (0.85, 0.62, 0.18), metallic=1.0, roughness=0.25)
    pine = make_material("PineDark", (0.10, 0.16, 0.10), metallic=0.0, roughness=0.75)
    pine_light = make_material("PineLight", (0.18, 0.26, 0.16), metallic=0.0, roughness=0.7)
    stone = make_material("Stone", (0.38, 0.40, 0.36), metallic=0.0, roughness=0.9)
    leather = make_material("Leather", (0.28, 0.16, 0.08), metallic=0.0, roughness=0.8)
    tassel = make_material("TasselRed", (0.55, 0.10, 0.08), metallic=0.0, roughness=0.85)

    # Ground / sparring court edge
    add_box("CourtGround", (6.0, 6.0, 0.1), (0, 0, -0.05), stone)

    # Rack: two A-frame supports of dark pine
    # Base feet
    add_box("RackFootL", (0.9, 0.25, 0.12), (-0.55, 0, 0.06), pine)
    add_box("RackFootR", (0.9, 0.25, 0.12), (0.55, 0, 0.06), pine)
    # Vertical posts (slightly angled)
    add_box("RackPostL", (0.10, 0.10, 1.35), (-0.55, 0, 0.72), pine, rotation=(0, math.radians(-6), 0))
    add_box("RackPostR", (0.10, 0.10, 1.35), (0.55, 0, 0.72), pine, rotation=(0, math.radians(6), 0))
    # Crossbar
    add_box("RackCrossbar", (1.35, 0.10, 0.10), (0, 0, 1.32), pine_light)
    # Secondary lower crossbar
    add_box("RackCrossbarLow", (1.20, 0.08, 0.08), (0, 0, 0.55), pine_light)
    # Diagonal braces
    add_box("RackBraceL", (0.08, 0.08, 0.75), (-0.30, 0, 0.55), pine, rotation=(0, math.radians(35), 0))
    add_box("RackBraceR", (0.08, 0.08, 0.75), (0.30, 0, 0.55), pine, rotation=(0, math.radians(-35), 0))

    # Guan Dao: shaft ~2m, blade on top, rests on rack
    # Shaft (slightly tilted, resting on crossbar)
    shaft_len = 2.0
    shaft_radius = 0.035
    shaft_center_z = 1.32  # resting on crossbar
    # Shaft is tilted slightly forward
    shaft_tilt = math.radians(8)
    add_cylinder("Shaft", shaft_radius, shaft_len, (0, 0.05, shaft_center_z), bronze_dark,
                 rotation=(shaft_tilt, 0, 0), vertices=16)

    # Shaft butt cap (bottom)
    butt_z = shaft_center_z - (shaft_len/2) * math.cos(shaft_tilt)
    butt_y = 0.05 - (shaft_len/2) * math.sin(shaft_tilt)
    add_cylinder("ButtCap", 0.045, 0.10, (0, butt_y, butt_z), bronze, vertices=16)

    # Gold bands on shaft
    for i, t in enumerate([-0.35, 0.0, 0.35]):
        band_z = shaft_center_z + t * shaft_len * math.cos(shaft_tilt)
        band_y = 0.05 + t * shaft_len * math.sin(shaft_tilt)
        add_cylinder(f"ShaftBand{i}", 0.042, 0.04, (0, band_y, band_z), gold, vertices=16)

    # Blade socket (top of shaft)
    top_z = shaft_center_z + (shaft_len/2) * math.cos(shaft_tilt)
    top_y = 0.05 + (shaft_len/2) * math.sin(shaft_tilt)
    add_cylinder("BladeSocket", 0.055, 0.18, (0, top_y, top_z), bronze, vertices=16)

    # Blade: broad curved blade (guan dao style) — build from a scaled/tapered shape
    # Use a cube scaled and rotated to approximate the broad blade
    blade_base_z = top_z + 0.09
    blade_base_y = top_y
    # Main blade body
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, blade_base_y + 0.02, blade_base_z + 0.35))
    blade = bpy.context.active_object
    blade.name = "Blade"
    blade.scale = (0.035, 0.22, 0.55)
    blade.rotation_euler = (math.radians(-8), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    blade.data.materials.append(bronze)

    # Blade edge (gold seam)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, blade_base_y + 0.20, blade_base_z + 0.35))
    edge = bpy.context.active_object
    edge.name = "BladeEdge"
    edge.scale = (0.012, 0.04, 0.55)
    edge.rotation_euler = (math.radians(-8), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    edge.data.materials.append(gold)

    # Blade tip (tapered)
    bpy.ops.mesh.primitive_cone_add(radius1=0.10, radius2=0.0, depth=0.25,
                                     location=(0, blade_base_y + 0.05, blade_base_z + 0.72))
    tip = bpy.context.active_object
    tip.name = "BladeTip"
    tip.rotation_euler = (math.radians(-8), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    tip.data.materials.append(bronze)

    # Blade back hook (small curved protrusion)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, blade_base_y - 0.10, blade_base_z + 0.55))
    hook = bpy.context.active_object
    hook.name = "BladeHook"
    hook.scale = (0.03, 0.10, 0.08)
    hook.rotation_euler = (math.radians(20), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    hook.data.materials.append(bronze_dark)

    # Red tassel near socket
    add_cylinder("TasselKnot", 0.05, 0.06, (0, top_y - 0.02, top_z - 0.05), tassel, vertices=12)
    for i in range(5):
        angle = i * (2*math.pi/5)
        tx = 0.04 * math.cos(angle)
        ty = top_y - 0.02 + 0.04 * math.sin(angle)
        add_cylinder(f"TasselStrand{i}", 0.008, 0.22, (tx, ty, top_z - 0.18), tassel, vertices=6)

    # Leather grip wrap on lower shaft
    grip_z = shaft_center_z - 0.55 * math.cos(shaft_tilt)
    grip_y = 0.05 - 0.55 * math.sin(shaft_tilt)
    add_cylinder("Grip", 0.045, 0.30, (0, grip_y, grip_z), leather,
                 rotation=(shaft_tilt, 0, 0), vertices=16)

    # Small stone marker at court edge
    add_box("CourtMarker", (0.4, 0.4, 0.15), (1.8, 1.2, 0.075), stone)

    # Lights
    bpy.ops.object.light_add(type='POINT', location=(1.5, -2.0, 2.5))
    point_light = bpy.context.active_object
    point_light.name = "PointLight"
    point_light.data.energy = 400
    point_light.data.color = (1.0, 0.92, 0.80)

    bpy.ops.object.light_add(type='AREA', location=(-2.0, -1.5, 3.0))
    area_light = bpy.context.active_object
    area_light.name = "AreaLight"
    area_light.data.energy = 300
    area_light.data.size = 3.0
    area_light.data.color = (0.85, 0.90, 1.0)
    area_light.rotation_euler = (math.radians(50), 0, math.radians(-40))

    # Camera
    bpy.ops.object.camera_add(location=(2.6, -3.2, 2.0))
    cam = bpy.context.active_object
    cam.name = "Camera"
    cam.rotation_euler = (math.radians(72), 0, math.radians(38))
    cam.data.lens = 50
    bpy.context.scene.camera = cam

    # Render settings
    scene = bpy.context.scene
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.filepath = "/home/workspace/bars-engine/tools/blender-cloud/make/contest/deepseek/obj3.png"
    scene.render.image_settings.file_format = 'PNG'

    # World background
    world = bpy.data.worlds.new("World") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.05, 0.06, 0.08, 1.0)
        bg.inputs[1].default_value = 0.6

    bpy.ops.render.render(write_still=True)
    print("READY")

if __name__ == "__main__":
    build_object()
