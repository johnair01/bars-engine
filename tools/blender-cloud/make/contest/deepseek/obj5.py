
import bpy
import math
from mathutils import Vector

# ---------------------------------------------------------------------------
# Talisman Formation Set — Heaven Sect contest object 5
# Chalked circle, hovering paper slips, working glow.
# Deterministic, pure bpy, origin at visual base, +Y forward, meters.
# ---------------------------------------------------------------------------

def _clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                  bpy.data.cameras, bpy.data.curves):
        for item in list(block):
            try:
                block.remove(item)
            except Exception:
                pass


def _mat(name, base_color, roughness=0.6, metallic=0.0,
         emission_color=None, emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        out = nt.nodes.get("Material Output") or nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(bsdf.outputs[0], out.inputs[0])
    bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if emission_color is not None:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emission_color, 1.0)
        elif "Emission" in bsdf.inputs:
            bsdf.inputs["Emission"].default_value = (*emission_color, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        mat.blend_method = 'BLEND'
    return mat


def _add_mesh_obj(name, verts, faces, mat=None, collection=None):
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    (collection or bpy.context.scene.collection).objects.link(obj)
    if mat is not None:
        obj.data.materials.append(mat)
    return obj


def _ring_verts(radius, z, segments, cx=0.0, cy=0.0):
    verts = []
    for i in range(segments):
        a = 2.0 * math.pi * i / segments
        verts.append((cx + radius * math.cos(a), cy + radius * math.sin(a), z))
    return verts


def _build_chalk_circle(mat_chalk, mat_chalk_dim, mat_glow_ring):
    """Chalked circle on the ground: outer ring, inner ring, trigram ticks,
    central taiji disc, and a faint glowing inner ring."""
    objs = []
    segments = 96

    # Outer chalk ring (thin flat annulus)
    r_out = 1.60
    r_in = 1.50
    z = 0.005
    verts = []
    faces = []
    outer = _ring_verts(r_out, z, segments)
    inner = _ring_verts(r_in, z, segments)
    verts.extend(outer)
    verts.extend(inner)
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((i, j, segments + j, segments + i))
    objs.append(_add_mesh_obj("Chalk_OuterRing", verts, faces, mat_chalk))

    # Inner chalk ring
    r_out2 = 1.05
    r_in2 = 0.98
    verts = []
    faces = []
    outer = _ring_verts(r_out2, z, segments)
    inner = _ring_verts(r_in2, z, segments)
    verts.extend(outer)
    verts.extend(inner)
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((i, j, segments + j, segments + i))
    objs.append(_add_mesh_obj("Chalk_InnerRing", verts, faces, mat_chalk))

    # Glowing inner ring (emissive)
    r_out3 = 0.92
    r_in3 = 0.86
    verts = []
    faces = []
    outer = _ring_verts(r_out3, z + 0.001, segments)
    inner = _ring_verts(r_in3, z + 0.001, segments)
    verts.extend(outer)
    verts.extend(inner)
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((i, j, segments + j, segments + i))
    objs.append(_add_mesh_obj("Glow_Ring", verts, faces, mat_glow_ring))

    # Central taiji disc (two half-discs, dark and light)
    disc_segments = 48
    r_disc = 0.55
    # Light half (yang) — right side
    verts = [(0.0, 0.0, z + 0.002)]
    faces = []
    for i in range(disc_segments + 1):
        a = -math.pi / 2 + math.pi * i / disc_segments
        verts.append((r_disc * math.cos(a), r_disc * math.sin(a), z + 0.002))
    for i in range(disc_segments):
        faces.append((0, i + 1, i + 2))
    objs.append(_add_mesh_obj("Taiji_Light", verts, faces, mat_chalk))

    # Dark half (yin) — left side
    verts = [(0.0, 0.0, z + 0.002)]
    faces = []
    for i in range(disc_segments + 1):
        a = math.pi / 2 + math.pi * i / disc_segments
        verts.append((r_disc * math.cos(a), r_disc * math.sin(a), z + 0.002))
    for i in range(disc_segments):
        faces.append((0, i + 1, i + 2))
    objs.append(_add_mesh_obj("Taiji_Dark", verts, faces, mat_chalk_dim))

    # Trigram ticks around the outer ring (8 trigrams, 3 bars each)
    for t in range(8):
        base_angle = 2.0 * math.pi * t / 8.0
        for bar in range(3):
            r_bar = 1.22 + bar * 0.09
            bar_len = 0.16
            bar_w = 0.035
            # bar oriented tangentially
            cx = r_bar * math.cos(base_angle)
            cy = r_bar * math.sin(base_angle)
            tx = -math.sin(base_angle)
            ty = math.cos(base_angle)
            nx = math.cos(base_angle)
            ny = math.sin(base_angle)
            # broken bar for even trigrams on middle bar
            broken = (t % 2 == 0) and (bar == 1)
            if broken:
                # two short segments
                for sgn in (-1, 1):
                    off = sgn * bar_len * 0.55
                    p0 = (cx + tx * (off - bar_len * 0.35) + nx * 0.0,
                          cy + ty * (off - bar_len * 0.35) + ny * 0.0, z + 0.003)
                    p1 = (cx + tx * (off + bar_len * 0.35) + nx * 0.0,
                          cy + ty * (off + bar_len * 0.35) + ny * 0.0, z + 0.003)
                    p2 = (p1[0] + nx * bar_w, p1[1] + ny * bar_w, z + 0.003)
                    p3 = (p0[0] + nx * bar_w, p0[1] + ny * bar_w, z + 0.003)
                    verts = [p0, p1, p2, p3]
                    faces = [(0, 1, 2, 3)]
                    objs.append(_add_mesh_obj("Trigram_%d_%d_%d" % (t, bar, sgn),
                                              verts, faces, mat_chalk))
            else:
                p0 = (cx - tx * bar_len + nx * 0.0, cy - ty * bar_len + ny * 0.0, z + 0.003)
                p1 = (cx + tx * bar_len + nx * 0.0, cy + ty * bar_len + ny * 0.0, z + 0.003)
                p2 = (p1[0] + nx * bar_w, p1[1] + ny * bar_w, z + 0.003)
                p3 = (p0[0] + nx * bar_w, p0[1] + ny * bar_w, z + 0.003)
                verts = [p0, p1, p2, p3]
                faces = [(0, 1, 2, 3)]
                objs.append(_add_mesh_obj("Trigram_%d_%d" % (t, bar),
                                          verts, faces, mat_chalk))
    return objs


def _build_slip(name, location, rotation_euler, size, mat_paper, mat_ink, mat_glow):
    """A single paper slip: thin quad with a small ink mark and a glowing edge."""
    w = size * 0.5
    h = size
    verts = [(-w, 0.0, -h), (w, 0.0, -h), (w, 0.0, h), (-w, 0.0, h)]
    faces = [(0, 1, 2, 3)]
    obj = _add_mesh_obj(name, verts, faces, mat_paper)
    obj.location = location
    obj.rotation_euler = rotation_euler

    # Ink mark (small quad on the slip)
    iw = w * 0.35
    ih = h * 0.35
    iverts = [(-iw, -0.001, -ih), (iw, -0.001, -ih), (iw, -0.001, ih), (-iw, -0.001, ih)]
    ifaces = [(0, 1, 2, 3)]
    ink = _add_mesh_obj(name + "_ink", iverts, ifaces, mat_ink)
    ink.parent = obj

    # Glowing edge strip (bottom)
    gw = w * 0.9
    gverts = [(-gw, -0.002, -h), (gw, -0.002, -h),
              (gw, -0.002, -h + 0.02), (-gw, -0.002, -h + 0.02)]
    gfaces = [(0, 1, 2, 3)]
    glow = _add_mesh_obj(name + "_glow", gverts, gfaces, mat_glow)
    glow.parent = obj
    return obj


def _build_hovering_slips(mat_paper, mat_ink, mat_glow):
    """Eight paper slips hovering in a ring above the chalk circle."""
    objs = []
    count = 8
    radius = 1.25
    base_z = 0.85
    for i in range(count):
        a = 2.0 * math.pi * i / count
        x = radius * math.cos(a)
        y = radius * math.sin(a)
        # slight vertical bob, deterministic
        z = base_z + 0.06 * math.sin(a * 3.0)
        # face inward toward center, tilt slightly
        rot_z = a + math.pi / 2.0
        rot_x = math.radians(12.0) * math.cos(a * 2.0)
        rot_y = math.radians(8.0) * math.sin(a * 2.0)
        slip = _build_slip("Slip_%02d" % i, (x, y, z),
                           (rot_x, rot_y, rot_z), 0.22,
                           mat_paper, mat_ink, mat_glow)
        objs.append(slip)
    return objs


def _build_central_glow(mat_glow_core):
    """A small floating emissive core at the center of the formation."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.09,
                                          location=(0.0, 0.0, 0.55))
    core = bpy.context.active_object
    core.name = "Formation_Core"
    core.data.materials.append(mat_glow_core)
    return core


def build_object():
    _clear_scene()

    # Palette — restrained: chalk white, ink black, warm gold glow, paper cream
    mat_chalk = _mat("Chalk_White", (0.92, 0.90, 0.84), roughness=0.9)
    mat_chalk_dim = _mat("Chalk_Dim", (0.35, 0.33, 0.30), roughness=0.9)
    mat_glow_ring = _mat("Glow_Ring", (1.0, 0.72, 0.30), roughness=0.4,
                         emission_color=(1.0, 0.62, 0.22), emission_strength=3.5)
    mat_paper = _mat("Paper_Cream", (0.88, 0.82, 0.68), roughness=0.85)
    mat_ink = _mat("Ink_Black", (0.06, 0.05, 0.05), roughness=0.7)
    mat_glow_edge = _mat("Glow_Edge", (1.0, 0.55, 0.18), roughness=0.4,
                         emission_color=(1.0, 0.55, 0.18), emission_strength=4.0)
    mat_glow_core = _mat("Glow_Core", (1.0, 0.85, 0.45), roughness=0.3,
                         emission_color=(1.0, 0.78, 0.35), emission_strength=8.0)

    _build_chalk_circle(mat_chalk, mat_chalk_dim, mat_glow_ring)
    _build_hovering_slips(mat_paper, mat_ink, mat_glow_edge)
    _build_central_glow(mat_glow_core)

    # Ground plane (subtle, so the chalk reads)
    bpy.ops.mesh.primitive_plane_add(size=8.0, location=(0.0, 0.0, 0.0))
    ground = bpy.context.active_object
    ground.name = "Ground"
    ground.data.materials.append(_mat("Ground_Stone", (0.22, 0.24, 0.22), roughness=0.95))

    # Lights
    bpy.ops.object.light_add(type='POINT', location=(0.0, 0.0, 1.4))
    point = bpy.context.active_object
    point.name = "Formation_PointLight"
    point.data.energy = 120.0
    point.data.color = (1.0, 0.72, 0.35)
    point.data.shadow_soft_size = 0.4

    bpy.ops.object.light_add(type='AREA', location=(2.5, -2.5, 3.0))
    area = bpy.context.active_object
    area.name = "Formation_AreaLight"
    area.data.energy = 300.0
    area.data.color = (0.85, 0.90, 1.0)
    area.data.size = 3.0
    # aim at origin
    direction = Vector((0.0, 0.0, 0.5)) - area.location
    area.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

    # Camera — looking down at the formation from a low angle
    bpy.ops.object.camera_add(location=(2.6, -3.2, 2.4))
    cam = bpy.context.active_object
    cam.name = "Formation_Camera"
    target = Vector((0.0, 0.0, 0.55))
    direction = target - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 35.0
    bpy.context.scene.camera = cam

    # Render engine
    scene = bpy.context.scene
    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except Exception:
        try:
            scene.render.engine = 'BLENDER_EEVEE'
        except Exception:
            scene.render.engine = 'BLENDER_WORKBENCH'

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = "/home/workspace/bars-engine/tools/blender-cloud/make/contest/deepseek/obj5.png"

    # World — dark, cool
    world = bpy.data.worlds.new("Formation_World") if not bpy.data.worlds else bpy.data.worlds[0]
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0.03, 0.04, 0.06, 1.0)
        bg.inputs[1].default_value = 0.4

    return scene


if __name__ == "__main__":
    build_object()
    bpy.ops.render.render(write_still=True)
    print("READY")
