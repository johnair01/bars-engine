import bpy
import math


def build_object():
    # Clear the scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in bpy.data.meshes:
        if block.users == 0:
            bpy.data.meshes.remove(block)
    for block in bpy.data.materials:
        if block.users == 0:
            bpy.data.materials.remove(block)

    # Materials
    def make_material(name, rgba, metallic, roughness):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        return mat

    bronze_mat = make_material("Bronze", (0.549, 0.384, 0.224, 1.0), 1.0, 0.35)
    verdigris_mat = make_material("Verdigris", (0.263, 0.667, 0.545, 1.0), 0.2, 0.6)
    jade_mat = make_material("Jade", (0.165, 0.616, 0.561, 1.0), 0.0, 0.25)
    slate_mat = make_material("Slate", (0.149, 0.275, 0.325, 1.0), 0.0, 0.75)
    gold_mat = make_material("Gold", (0.914, 0.769, 0.416, 1.0), 1.0, 0.2)

    # ---------------- STONE PLINTH ----------------
    # Base slab
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.15))
    base = bpy.context.active_object
    base.name = "Plinth_Base"
    base.scale = (2.0, 2.0, 0.3)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    base.data.materials.append(slate_mat)

    # Middle step
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.4))
    step = bpy.context.active_object
    step.name = "Plinth_Step"
    step.scale = (1.6, 1.6, 0.2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    step.data.materials.append(slate_mat)

    # Top platform
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.6))
    platform = bpy.context.active_object
    platform.name = "Plinth_Top"
    platform.scale = (1.3, 1.3, 0.2)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    platform.data.materials.append(slate_mat)

    # Decorative jade inlay ring on top of platform
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.55, minor_radius=0.04,
        major_segments=48, minor_segments=12,
        location=(0, 0, 0.71)
    )
    inlay = bpy.context.active_object
    inlay.name = "Jade_Inlay"
    inlay.data.materials.append(jade_mat)

    # ---------------- BELL BODY ----------------
    # Bell profile via lathe-like approach using cone with rounded top
    # Main bell body - tapered cylinder (bottom wider than top)
    bpy.ops.mesh.primitive_cone_add(
        vertices=64,
        radius1=0.9,   # bottom radius
        radius2=0.55,  # top radius
        depth=1.4,
        location=(0, 0, 0.7 + 0.7)
    )
    bell_body = bpy.context.active_object
    bell_body.name = "Bell_Body"
    bell_body.data.materials.append(bronze_mat)

    # Rounded bell top (dome)
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=64, ring_count=32,
        radius=0.55,
        location=(0, 0, 0.7 + 1.4)
    )
    bell_dome = bpy.context.active_object
    bell_dome.name = "Bell_Dome"
    bell_dome.scale = (1.0, 1.0, 0.6)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bell_dome.data.materials.append(bronze_mat)

    # Bell rim (thickened bottom edge)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.88, minor_radius=0.08,
        major_segments=64, minor_segments=16,
        location=(0, 0, 0.7 + 0.05)
    )
    bell_rim = bpy.context.active_object
    bell_rim.name = "Bell_Rim"
    bell_rim.data.materials.append(bronze_mat)

    # Verdigris band around lower bell (oxidized band)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=64,
        radius=0.91, depth=0.15,
        location=(0, 0, 0.7 + 0.15)
    )
    verdigris_band = bpy.context.active_object
    verdigris_band.name = "Verdigris_Band"
    verdigris_band.data.materials.append(verdigris_mat)

    # Horizontal decorative gold bands on bell
    for z_off, rad in [(0.55, 0.78), (0.95, 0.70), (1.30, 0.62)]:
        bpy.ops.mesh.primitive_torus_add(
            major_radius=rad, minor_radius=0.025,
            major_segments=64, minor_segments=10,
            location=(0, 0, 0.7 + z_off)
        )
        band = bpy.context.active_object
        band.name = f"Gold_Band_{z_off}"
        band.data.materials.append(gold_mat)

    # Vertical gold ribs on bell (8 evenly spaced)
    for i in range(8):
        angle = (i / 8.0) * 2.0 * math.pi
        # Chord runs from bottom rim to top dome, angled inward
        x_bot = math.cos(angle) * 0.88
        y_bot = math.sin(angle) * 0.88
        x_top = math.cos(angle) * 0.56
        y_top = math.sin(angle) * 0.56
        # Mid point of rib
        mx = (x_bot + x_top) / 2.0
        my = (y_bot + y_top) / 2.0
        mz = 0.7 + 0.7
        dx = x_top - x_bot
        dy = y_top - y_bot
        dz = 1.4
        length = math.sqrt(dx*dx + dy*dy + dz*dz)
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=12, radius=0.025, depth=length,
            location=(mx, my, mz)
        )
        rib = bpy.context.active_object
        rib.name = f"Gold_Rib_{i}"
        # Orient along the rib vector
        vec = (dx, dy, dz)
        # Default cylinder is along Z; rotate to align with vec
        import mathutils
        # Avoid import; compute rotation manually
        # Rodrigues rotation from Z to vec
        v = mathutils.Vector(vec).normalized()
        z = mathutils.Vector((0, 0, 1))
        axis = z.cross(v)
        angle_rot = math.acos(max(-1.0, min(1.0, z.dot(v))))
        if axis.length > 1e-6:
            axis.normalize()
            rib.rotation_mode = 'AXIS_ANGLE'
            rib.rotation_axis_angle = (angle_rot, axis.x, axis.y, axis.z)
        rib.data.materials.append(gold_mat)

    # ---------------- BELL CROWN / LOOP ----------------
    # Crown cylinder on top of dome
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=32, radius=0.15, depth=0.2,
        location=(0, 0, 0.7 + 1.4 + 0.33)
    )
    crown = bpy.context.active_object
    crown.name = "Bell_Crown"
    crown.data.materials.append(bronze_mat)

    # Hanging loop (torus)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.12, minor_radius=0.035,
        major_segments=32, minor_segments=12,
        location=(0, 0, 0.7 + 1.4 + 0.55),
        rotation=(math.radians(90), 0, 0)
    )
    loop = bpy.context.active_object
    loop.name = "Bell_Loop"
    loop.data.materials.append(gold_mat)

    # ---------------- CLAPPER (visible through bell mouth) ----------------
    # Stem
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=16, radius=0.05, depth=1.0,
        location=(0, 0, 0.7 + 0.6)
    )
    stem = bpy.context.active_object
    stem.name = "Clapper_Stem"
    stem.data.materials.append(bronze_mat)

    # Clapper ball
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=32, ring_count=16, radius=0.16,
        location=(0, 0, 0.7 + 0.12)
    )
    clapper = bpy.context.active_object
    clapper.name = "Clapper_Ball"
    clapper.data.materials.append(bronze_mat)

    # ---------------- DECORATIVE ELEMENTS ----------------
    # Jade pendant ornaments at base corners of plinth
    for i in range(4):
        angle = (i / 4.0) * 2.0 * math.pi + math.pi / 4.0
        x = math.cos(angle) * 0.9
        y = math.sin(angle) * 0.9
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=24, ring_count=12, radius=0.1,
            location=(x, y, 0.72)
        )
        pendant = bpy.context.active_object
        pendant.name = f"Jade_Pendant_{i}"
        pendant.data.materials.append(jade_mat)

    # Join all bell parts into a single object
    bpy.ops.object.select_all(action='DESELECT')
    for obj in bpy.data.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = bell_body
    bpy.ops.object.join()
    final_obj = bpy.context.active_object
    final_obj.name = "Ritual_Bell"

    # Set origin to base center
    bpy.context.scene.cursor.location = (0, 0, 0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

    return final_obj


if __name__ == "__main__":
    build_object()
