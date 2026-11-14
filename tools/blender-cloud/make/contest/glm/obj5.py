
import bpy
import math
import os
import sys
from mathutils import Vector

OUT_PATH = "/home/workspace/bars-engine/tools/blender-cloud/make/contest/glm/obj5.png"
TAU = math.tau


def look_at(ob, target):
    d = (target - ob.location).normalized()
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def make_mat(name, color, rough=0.85, emit=None, strength=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = rough
    if emit is not None:
        try:
            bsdf.inputs['Emission Color'].default_value = (*emit, 1.0)
            bsdf.inputs['Emission Strength'].default_value = strength
        except KeyError:
            bsdf.inputs['Emission'].default_value = (*emit, 1.0)
    return mat


def mesh_obj(name, verts, faces, mat=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if mat is not None:
        me.materials.append(mat)
    return ob


def ring(r_in, r_out, z, n=96, wob_in=None, wob_out=None):
    verts = []
    for i in range(n):
        a = TAU * i / n
        r = r_in + (wob_in(a) if wob_in else 0.0)
        verts.append((math.cos(a) * r, math.sin(a) * r, z))
    for i in range(n):
        a = TAU * i / n
        r = r_out + (wob_out(a) if wob_out else 0.0)
        verts.append((math.cos(a) * r, math.sin(a) * r, z))
    faces = [(i, n + i, n + (i + 1) % n, (i + 1) % n) for i in range(n)]
    return verts, faces


def disc_cyl(r, z0, z1, n=64):
    verts, faces = [], []
    for z in (z0, z1):
        for i in range(n):
            a = TAU * i / n
            rr = r(a) if callable(r) else r
            verts.append((math.cos(a) * rr, math.sin(a) * rr, z))
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    faces.append(tuple(range(n - 1, -1, -1)))
    faces.append(tuple(range(n, 2 * n)))
    return verts, faces


def slip_box(w, t, h):
    hx, hy = w / 2.0, t / 2.0
    verts = [(-hx, -hy, 0), (hx, -hy, 0), (hx, hy, 0), (-hx, hy, 0),
             (-hx, -hy, h), (hx, -hy, h), (hx, hy, h), (-hx, hy, h)]
    faces = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return verts, faces


def front_plane(w, z0, z1, y):
    hw = w / 2.0
    verts = [(-hw, y, z0), (hw, y, z0), (hw, y, z1), (-hw, y, z1)]
    return verts, [(0, 3, 2, 1)]


def build_object():
    scene = bpy.context.scene
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)

    try:
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
    except TypeError:
        scene.render.engine = 'BLENDER_EEVEE'
    ee = scene.eevee
    if hasattr(ee, 'use_glow'):
        ee.use_glow = True
        ee.glow_threshold = 1.0
        ee.glow_strength = 0.6

    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.frame_start = 1
    scene.frame_end = 1

    world = bpy.data.worlds.get('World') or bpy.data.worlds.new('World')
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (0.010, 0.013, 0.020, 1.0)
    bg.inputs[1].default_value = 1.0
    scene.world = world

    mat_stone = make_mat('stone_greygreen', (0.26, 0.33, 0.29), 0.92)
    mat_chalk = make_mat('chalk_glow', (0.88, 0.86, 0.76), 1.0, (1.0, 0.82, 0.50), 0.9)
    mat_paper = make_mat('paper_cream', (0.90, 0.84, 0.68), 0.8)
    mat_rune = make_mat('rune_ember', (0.20, 0.05, 0.03), 0.6, (1.0, 0.38, 0.10), 4.0)
    mat_seal = make_mat('seal_red', (0.50, 0.10, 0.08), 0.7, (1.0, 0.20, 0.10), 1.5)
    mat_core = make_mat('core_gold', (0.70, 0.50, 0.20), 0.4, (1.0, 0.65, 0.25), 5.0)

    slab_wob = lambda a: 2.7 + 0.04 * math.sin(5 * a + 1.0) + 0.02 * math.sin(11 * a)
    v, f = disc_cyl(slab_wob, -0.04, 0.08, 64)
    mesh_obj('Stone_Slab', v, f, mat_stone)

    zc = 0.082
    v, f = ring(2.02, 2.2, zc, 96,
                lambda a: 0.03 * math.sin(9 * a + 2.1),
                lambda a: 0.035 * math.sin(7 * a + 0.7))
    mesh_obj('ChalkRing_Outer', v, f, mat_chalk)
    v, f = ring(1.34, 1.46, zc, 96,
                lambda a: 0.02 * math.sin(8 * a + 1.2),
                lambda a: 0.02 * math.sin(11 * a + 4.0))
    mesh_obj('ChalkRing_Mid', v, f, mat_chalk)
    v, f = ring(0.50, 0.56, zc, 64,
                lambda a: 0.015 * math.sin(6 * a),
                lambda a: 0.015 * math.sin(9 * a + 3.0))
    mesh_obj('ChalkRing_Center', v, f, mat_chalk)

    tv, tf = [], []
    for k in range(8):
        a = TAU * k / 8 + 0.2
        w, r1, r2 = 0.035, 1.56, 1.90
        pts = []
        for rr, aa in ((r1, a - w), (r1, a + w), (r2, a + w), (r2, a - w)):
            pts.append((math.cos(aa) * rr, math.sin(aa) * rr, zc))
        b = 4 * k
        tv.extend(pts)
        tf.append((b, b + 1, b + 2, b + 3))
    mesh_obj('ChalkTicks', tv, tf, mat_chalk)

    v, f = disc_cyl(0.42, 0.083, 0.093, 48)
    mesh_obj('Glow_Core', v, f, mat_core)

    root = bpy.data.objects.new('talisman_formation_set', None)
    bpy.context.scene.collection.objects.link(root)

    n_slips, R = 7, 1.72
    for i in range(n_slips):
        phi = math.pi / 2 + TAU * i / n_slips
        h = 0.55 + 0.95 * (0.5 + 0.5 * math.sin(i * 2.399963 + 0.7))
        lean = -0.08 - 0.05 * math.sin(i * 1.3 + 0.4)
        loc = (math.cos(phi) * R, math.sin(phi) * R, h)
        rot = (lean, 0.0, phi - math.pi / 2)

        v, f = slip_box(0.09, 0.004, 0.30)
        slip = mesh_obj('Slip_%02d' % i, v, f, mat_paper)
        slip.location = loc
        slip.rotation_euler = rot

        v, f = front_plane(0.064, 0.06, 0.22, 0.0035)
        rune = mesh_obj('Rune_%02d' % i, v, f, mat_rune)
        rune.location = loc
        rune.rotation_euler = rot

        v, f = front_plane(0.05, 0.235, 0.285, 0.0035)
        seal = mesh_obj('Seal_%02d' % i, v, f, mat_seal)
        seal.location = loc
        seal.rotation_euler = rot

        for ob in (slip, rune, seal):
            ob.parent = root

    for ob in bpy.data.objects:
        if ob is not root and ob.parent is None:
            ob.parent = root

    def add_light(name, ltype, energy, color, loc, size=0.0, target=None):
        ld = bpy.data.lights.new(name, ltype)
        ld.energy = energy
        ld.color = color
        if ltype == 'POINT':
            ld.shadow_soft_size = 0.2
        if ltype == 'AREA':
            ld.size = size
        ob = bpy.data.objects.new(name, ld)
        ob.location = loc
        bpy.context.scene.collection.objects.link(ob)
        if target is not None:
            look_at(ob, target)
        ob.parent = root
        return ob

    add_light('Key_Point', 'POINT', 45.0, (1.0, 0.60, 0.30), (0.0, 0.0, 1.0))
    add_light('Fill_Area', 'AREA', 220.0, (0.72, 0.82, 1.00), (2.4, -2.6, 3.4),
              size=2.5, target=Vector((0.0, 0.0, 0.5)))

    cam_data = bpy.data.cameras.new('Camera')
    cam_data.lens = 42.0
    cam = bpy.data.objects.new('Camera', cam_data)
    cam.location = (5.2, -5.6, 1.6)
    bpy.context.scene.collection.objects.link(cam)
    look_at(cam, Vector((0.0, 0.0, 0.75)))
    scene.camera = cam

    return scene


def main():
    scene = build_object()
    if '--check' in sys.argv:
        total = 0
        for ob in scene.objects:
            polys = len(ob.data.polygons) if ob.type == 'MESH' else 0
            total += polys
            print('%s: %d polys (%s)' % (ob.name, polys, ob.type))
        print('total polys: %d' % total)
        print('materials: %s' % ', '.join(sorted(m.name for m in bpy.data.materials)))
        return
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = OUT_PATH
    bpy.ops.render.render(write_still=True)
    print('READY')


if __name__ == '__main__':
    main()
