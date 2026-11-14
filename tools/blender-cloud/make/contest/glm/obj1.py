
import bpy
import bmesh
import math
from mathutils import Vector
from pathlib import Path

OUT_DIR = "/home/workspace/bars-engine/tools/blender-cloud/make/contest/glm"
OUT_PATH = OUT_DIR + "/obj1.png"
SEGMENTS = 64

# Outer bell surface profile (z, radius) used for seam placement
OUTER = [
    (0.00, 1.04), (0.10, 1.03), (0.22, 1.00), (0.40, 0.96),
    (0.70, 0.90), (1.00, 0.84), (1.35, 0.77), (1.70, 0.70),
    (2.00, 0.64), (2.22, 0.57), (2.36, 0.48), (2.46, 0.36), (2.51, 0.20),
]

# Closed cross-section of the bell wall: outer wall -> crown -> interior -> rim underside
BELL_PROFILE = [
    (1.04, 0.00), (1.03, 0.10), (1.00, 0.22), (0.96, 0.40),
    (0.90, 0.70), (0.84, 1.00), (0.77, 1.35), (0.70, 1.70),
    (0.64, 2.00), (0.57, 2.22), (0.48, 2.36), (0.36, 2.46),
    (0.20, 2.51), (0.00, 2.52), (0.00, 2.40),
    (0.20, 2.38), (0.32, 2.30), (0.44, 2.18), (0.55, 2.00),
    (0.62, 1.80), (0.70, 1.50), (0.78, 1.10), (0.85, 0.70),
    (0.91, 0.35), (0.95, 0.12), (0.94, 0.05), (0.99, 0.02),
]


def bell_r(z):
    z = max(0.0, min(2.51, z))
    for k in range(len(OUTER) - 1):
        z0, r0 = OUTER[k]
        z1, r1 = OUTER[k + 1]
        if z <= z1:
            t = (z - z0) / (z1 - z0)
            return r0 + (r1 - r0) * t
    return OUTER[-1][1]


def clear_scene():
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                 bpy.data.cameras, bpy.data.images, bpy.data.worlds):
        for block in list(coll):
            if block.users == 0:
                coll.remove(block)


def make_procedural_material(name, col_a, col_b, noise_scale, rough_a, rough_b,
                             metallic, bump=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    bsdf.inputs["Metallic"].default_value = metallic
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = noise_scale
    ramp_c = nt.nodes.new("ShaderNodeValToRGB")
    ramp_c.color_ramp.elements[0].position = 0.35
    ramp_c.color_ramp.elements[0].color = (*col_a, 1.0)
    ramp_c.color_ramp.elements[1].position = 0.72
    ramp_c.color_ramp.elements[1].color = (*col_b, 1.0)
    nt.links.new(noise.outputs["Fac"], ramp_c.inputs["Fac"])
    nt.links.new(ramp_c.outputs["Color"], bsdf.inputs["Base Color"])
    ramp_r = nt.nodes.new("ShaderNodeValToRGB")
    ramp_r.color_ramp.elements[0].position = 0.35
    ramp_r.color_ramp.elements[0].color = (rough_a,) * 3 + (1.0,)
    ramp_r.color_ramp.elements[1].position = 0.72
    ramp_r.color_ramp.elements[1].color = (rough_b,) * 3 + (1.0,)
    nt.links.new(noise.outputs["Fac"], ramp_r.inputs["Fac"])
    nt.links.new(ramp_r.outputs["Color"], bsdf.inputs["Roughness"])
    if bump > 0.0:
        bnode = nt.nodes.new("ShaderNodeBump")
        bnode.inputs["Strength"].default_value = bump
        nt.links.new(noise.outputs["Fac"], bnode.inputs["Height"])
        nt.links.new(bnode.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def make_plain_material(name, color, metallic, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def add_mesh(name, verts, faces, mat, smooth=False):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    if mat is not None:
        obj.data.materials.append(mat)
    if smooth:
        for poly in mesh.polygons:
            poly.use_smooth = True
    return obj


def add_box(name, sx, sy, sz, cx, cy, cz, mat):
    hx, hy, hz = sx / 2.0, sy / 2.0, sz / 2.0
    verts = [
        (cx - hx, cy - hy, cz - hz), (cx + hx, cy - hy, cz - hz),
        (cx + hx, cy + hy, cz - hz), (cx - hx, cy + hy, cz - hz),
        (cx - hx, cy - hy, cz + hz), (cx + hx, cy - hy, cz + hz),
        (cx + hx, cy + hy, cz + hz), (cx - hx, cy + hy, cz + hz),
    ]
    faces = [(3, 2, 1, 0), (4, 5, 6, 7), (0, 1, 5, 4),
             (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return add_mesh(name, verts, faces, mat, smooth=False)


def lathe(name, profile, segments, mat, zoff=0.0, smooth=True):
    verts = []
    rings = []
    for (r, z) in profile:
        zz = z + zoff
        if r < 1e-4:
            rings.append(("P", len(verts)))
            verts.append((0.0, 0.0, zz))
        else:
            idxs = []
            for i in range(segments):
                a = 2.0 * math.pi * i / segments
                idxs.append(len(verts))
                verts.append((r * math.cos(a), r * math.sin(a), zz))
            rings.append(("R", idxs))
    faces = []
    nr = len(rings)
    for k in range(nr):
        k2 = (k + 1) % nr
        t1, i1 = rings[k]
        t2, i2 = rings[k2]
        if t1 == "R" and t2 == "R":
            for i in range(segments):
                j = (i + 1) % segments
                faces.append((i1[i], i1[j], i2[j], i2[i]))
        elif t1 == "P" and t2 == "R":
            for i in range(segments):
                j = (i + 1) % segments
                faces.append((i1, i2[j], i2[i]))
        elif t1 == "R" and t2 == "P":
            for i in range(segments):
                j = (i + 1) % segments
                faces.append((i1[i], i1[j], i2))
    return add_mesh(name, verts, faces, mat, smooth=smooth)


def add_strip(name, pts, width, lift, mat):
    verts = []
    faces = []
    n = len(pts)
    for (th, z) in pts:
        r = bell_r(z) + lift
        x = r * math.cos(th)
        y = r * math.sin(th)
        verts.append((x, y, z + width * 0.5))
        verts.append((x, y, z - width * 0.5))
    for k in range(n - 1):
        a, b = 2 * k, 2 * k + 1
        c, d = 2 * k + 3, 2 * k + 2
        faces.append((a, b, c, d))
    return add_mesh(name, verts, faces, mat, smooth=True)


def ring_pts(z, w0=0.0, w1=2.0 * math.pi, steps=48):
    return [(w0 + (w1 - w0) * i / steps, z) for i in range(steps + 1)]


def crack_pts(th0, z0, th1, z1, steps=10, wig=0.04, ph=0.0):
    return [(th0 + (th1 - th0) * i / steps + wig * math.sin(i * 1.9 + ph),
             z0 + (z1 - z0) * i / steps) for i in range(steps + 1)]


def add_loop(name, zc, mat):
    verts = []
    faces = []
    maj, mnr = 28, 14
    R, r = 0.14, 0.05
    for i in range(maj):
        u = 2.0 * math.pi * i / maj
        cx = 0.0
        cy = R * math.sin(u)
        cz = zc + R * math.cos(u)
        ny, nz = math.sin(u), math.cos(u)
        for j in range(mnr):
            v = 2.0 * math.pi * j / mnr
            verts.append((cx + r * math.sin(v),
                          cy + r * math.cos(v) * ny,
                          cz + r * math.cos(v) * nz))
    for i in range(maj):
        i2 = (i + 1) % maj
        for j in range(mnr):
            j2 = (j + 1) % mnr
            faces.append((i * mnr + j, i * mnr + j2,
                          i2 * mnr + j2, i2 * mnr + j))
    return add_mesh(name, verts, faces, mat, smooth=True)


def aim_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def build_object():
    scene = bpy.context.scene
    clear_scene()

    mat_bronze = make_procedural_material(
        "BronzeAged", (0.36, 0.24, 0.12), (0.16, 0.30, 0.24),
        6.0, 0.35, 0.62, 0.9, bump=0.02)
    mat_gold = make_plain_material("GoldSeam", (1.0, 0.76, 0.34), 1.0, 0.3)
    mat_stone = make_procedural_material(
        "StoneGreyGreen", (0.42, 0.45, 0.42), (0.34, 0.38, 0.35),
        14.0, 0.80, 0.92, 0.0, bump=0.08)
    mat_moss = make_procedural_material(
        "StoneMossy", (0.40, 0.43, 0.40), (0.15, 0.28, 0.14),
        4.0, 0.82, 0.95, 0.0, bump=0.10)
    mat_floor = make_procedural_material(
        "StoneFloor", (0.30, 0.33, 0.31), (0.24, 0.27, 0.25),
        18.0, 0.85, 0.95, 0.0, bump=0.06)

    # Plinth: stacked courses, moss on the two oldest (bottom) courses
    add_box("plinth_course_1", 3.4, 3.4, 0.30, 0.0, 0.0, 0.15, mat_moss)
    add_box("plinth_course_2", 3.0, 3.0, 0.30, 0.0, 0.0, 0.45, mat_moss)
    add_box("plinth_course_3", 2.6, 2.6, 0.30, 0.0, 0.0, 0.75, mat_stone)
    add_box("plinth_cap", 2.3, 2.3, 0.10, 0.0, 0.0, 0.95, mat_stone)

    # Bronze setting pad on the cap
    lathe("bell_pad", [(0.0, 0.0), (1.12, 0.0), (1.12, 0.06), (0.0, 0.06)],
          SEGMENTS, mat_bronze, zoff=1.00)

    # Bell body (origin at world base, rim at z = 1.06)
    lathe("bell_body", BELL_PROFILE, SEGMENTS, mat_bronze, zoff=1.06)

    # Crown suspension loop
    add_loop("bell_loop", 3.66, mat_bronze)

    # Gold repair seams: full ring, two patch arcs, three diagonal cracks
    add_strip("seam_ring", ring_pts(1.15, 0.0, 2.0 * math.pi, 56), 0.05, 0.014, mat_gold)
    add_strip("seam_arc_1", ring_pts(0.62, 0.4, 1.6, 20), 0.04, 0.014, mat_gold)
    add_strip("seam_arc_2", ring_pts(0.62, 3.5, 4.7, 20), 0.04, 0.014, mat_gold)
    add_strip("seam_crack_1", crack_pts(0.9, 1.95, 1.35, 0.95, 10, 0.05, 0.7), 0.035, 0.014, mat_gold)
    add_strip("seam_crack_2", crack_pts(3.7, 2.10, 4.05, 1.20, 10, 0.04, 2.1), 0.035, 0.014, mat_gold)
    add_strip("seam_crack_3", crack_pts(5.3, 0.55, 5.05, 0.18, 8, 0.03, 4.0), 0.03, 0.014, mat_gold)

    # Cast relief bands (bronze, subtle)
    add_strip("band_high", ring_pts(1.75, 0.0, 2.0 * math.pi, 56), 0.07, 0.012, mat_bronze)
    add_strip("band_low", ring_pts(0.85, 0.0, 2.0 * math.pi, 56), 0.05, 0.012, mat_bronze)

    # Courtyard stone floor
    g = 20.0
    add_mesh("ground", [(-g, -g, 0.0), (g, -g, 0.0), (g, g, 0.0), (-g, g, 0.0)],
             [(0, 1, 2, 3)], mat_floor, smooth=False)

    # Lights
    key = bpy.data.lights.new("key_area", type="AREA")
    key.energy = 1500.0
    key.color = (1.0, 0.94, 0.85)
    key.size = 6.0
    key_obj = bpy.data.objects.new("key_area", key)
    scene.collection.objects.link(key_obj)
    key_obj.location = (6.0, -4.5, 8.0)
    aim_at(key_obj, (0.0, 0.0, 2.2))

    warm = bpy.data.lights.new("warm_point", type="POINT")
    warm.energy = 80.0
    warm.color = (1.0, 0.55, 0.28)
    warm.shadow_soft_size = 0.15
    warm_obj = bpy.data.objects.new("warm_point", warm)
    scene.collection.objects.link(warm_obj)
    warm_obj.location = (2.6, 2.2, 1.4)

    # Camera: low angle, looking up at the bell (wonder = scale)
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 50.0
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = (6.2, -6.8, 1.5)
    aim_at(cam_obj, (0.0, 0.0, 2.4))
    scene.camera = cam_obj

    # World: cold mountain air
    if scene.world is None:
        scene.world = bpy.data.worlds.new("World")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg is None:
        bg = scene.world.node_tree.nodes.new("ShaderNodeBackground")
        outn = scene.world.node_tree.nodes.get("World Output")
        scene.world.node_tree.links.new(bg.outputs[0], outn.inputs[0])
    bg.inputs["Color"].default_value = (0.018, 0.028, 0.030, 1.0)
    bg.inputs["Strength"].default_value = 0.5

    return {
        "materials": [m.name for m in bpy.data.materials],
        "objects": [o.name for o in scene.objects],
    }


if __name__ == "__main__":
    info = build_object()
    scene = bpy.context.scene

    total_polys = sum(len(o.data.polygons) for o in scene.objects
                      if o.type == "MESH" and o.data is not None)
    print("polys:", total_polys)
    print("materials:", info["materials"])

    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    try:
        scene.eevee.taa_render_samples = 32
    except Exception:
        pass
    try:
        scene.view_settings.view_transform = "Standard"
    except Exception:
        pass

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.frame_set(1)

    Path(OUT_DIR).mkdir(parents=True, exist_ok=True)
    scene.render.filepath = OUT_PATH[:-4]
    bpy.ops.render.render(write_still=True)
    print("render engine:", scene.render.engine)
    print("wrote:", OUT_PATH)
    print("READY")
