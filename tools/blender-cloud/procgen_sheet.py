"""Render a contact sheet of procgen shapes: python procgen_sheet.py OUT.png [roots|mushrooms|blend]. Run under the bpy venv.
Each cell is one shape, seeds 1 to N across, styles or forms down. Look at it; the numbers do not say whether it is natural."""
import sys, os, math, bpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import procgen as pg

out, kind = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "roots")
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = 24
sc.render.resolution_x, sc.render.resolution_y = 1600, 1000
sc.view_settings.view_transform = "Standard"
sc.world = bpy.data.worlds.new("w"); sc.world.use_nodes = True
sc.world.node_tree.nodes["Background"].inputs[0].default_value = (0.35, 0.37, 0.4, 1)
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")); sun.data.energy = 3
sun.rotation_euler = (math.radians(55), math.radians(15), math.radians(-25)); sc.collection.objects.link(sun)
mat = bpy.data.materials.new("m"); mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.33, 0.25, 1)
mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.8


def add(verts, faces, x, y, name):
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.update()
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me); sc.collection.objects.link(ob); ob.location = (x, y, 0)
    return ob


if kind == "roots":
    styles, cols, gap = list(pg.ROOT_STYLES), 5, 3.2
    for r, s in enumerate(styles):
        for c in range(cols):
            v, f = pg.root_system(seed=c + 1, roots=3, spread=0.5, **pg.ROOT_STYLES[s])
            # hang them: flip so the trunk's `up` becomes the top of the cell and the tips dangle or sprawl
            add(v, f, c * gap, 0, f"{s}{c}").location.z = -r * gap
    w, h = cols * gap, len(styles) * gap
elif kind == "clusters":
    cols, gap = 4, 2.6
    rows = [("clump", 11), ("ring", 11), ("drift", 9), ("colony", 11)]
    for r, (k, n) in enumerate(rows):
        for c in range(cols):
            if k == "colony":
                v, f = pg.colony(seed=c + 1, count=n)
            else:
                v, f, _ = pg.mushroom_cluster(seed=c + 1, kind=k, count=n, forms=("dome", "bell", "flat", "cone", "parasol")[: 3 + c % 3])
            add(v, f, c * gap, 0, f"{k}{c}").location.y = -r * gap
    # roots: knot and mat in the last two rows of the sheet are on a second render (kind "rootclusters")
    w, h = cols * gap, len(rows) * gap
elif kind == "rootclusters":
    cols, gap = 4, 4.2
    for r, k in enumerate(("knot", "mat")):
        for c in range(cols):
            v, f = pg.root_cluster(seed=c + 1, kind=k, count=5 if k == "knot" else 6)
            add(v, f, c * gap, 0, f"{k}{c}").location.z = -r * gap
    w, h = cols * gap, 2 * gap
else:
    forms = list(pg.MUSHROOM_FORMS)
    cols, gap = 5, 0.9
    for r, s in enumerate(forms):
        for c in range(cols):
            v, f = pg.mushroom(seed=c + 1, **pg.MUSHROOM_FORMS[s])
            add(v, f, c * gap, 0, f"{s}{c}").location.z = -r * 1.05
    w, h = cols * gap, len(forms) * 1.05
cam = bpy.data.cameras.new("cam"); cam.type = "ORTHO"
top = kind == "clusters"  # clusters are laid out on the ground: look down at them from above and in front
cam.ortho_scale = h * 1.6 * 1.05 if kind != 'roots' else max(w, h * 1.6) * 1.05
co = bpy.data.objects.new("cam", cam); sc.collection.objects.link(co); sc.camera = co
if top:
    tilt = math.radians(25)  # from straight down
    cx, cy = (w - gap) / 2, -(h - gap) / 2
    co.location = (cx, cy - 20 * math.tan(tilt), 20)
    co.rotation_euler = (tilt, 0, 0)
    cam.ortho_scale = max(w, h * 1.6) * 1.05
else:
    wide = kind in ("roots", "rootclusters")
    co.location = (w / 2 - (0.5 * gap if not wide else 1.5), -20, -h / 2 + (0.4 if not wide else 1.2))
    co.rotation_euler = (math.radians(90), 0, 0)
    if kind == "rootclusters":
        cam.ortho_scale = max(w, h * 1.6) * 1.05
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("wrote", out)
