"""Compile validated jian identity rules to closed meshes, GLBs, and inventory views.

Run: blender -b -t 2 --python build_inventory_v2.py
"""
import bpy
import bmesh
import importlib.util
import json
import math
from pathlib import Path
import sys
from mathutils import Vector
import argparse

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from transform_contract import compile_jian

parser = argparse.ArgumentParser()
parser.add_argument("--spec", type=Path, default=HERE / "jian-identities.json")
parser.add_argument("--output", type=Path, default=HERE / "review")
parser.add_argument("--only", choices=["Argyra","Pyrakanth","Lamenth","Virelune","Meridia"])
args = parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])
SPEC = args.spec.resolve()
PACK = compile_jian(SPEC)
BASE = (SPEC.parent / PACK["base"]["code"]).resolve()
spec = importlib.util.spec_from_file_location("jian_base", BASE)
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
OUT = args.output.resolve()
OUT.mkdir(exist_ok=True)

def mat(name, value, metalness):
    def linear(c):
        c=c/255
        return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
    rgb = tuple(linear(int(value[i:i+2],16)) for i in (1,3,5)) + (1,)
    m = bpy.data.materials.new(name)
    m.diffuse_color = rgb
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgb
    bsdf.inputs["Metallic"].default_value = metalness
    bsdf.inputs["Roughness"].default_value = .38 if metalness else .74
    return m

def rod(name, a, b, radius, material):
    a, b = (Vector(p) if len(p)==3 else Vector((p[0],0,p[1])) for p in (a,b))
    d = b-a
    bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=radius,depth=d.length,location=(a+b)/2)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = d.to_track_quat("Z","Y").to_euler()
    obj.data.materials.append(material)

def tapered_detail(name, a, b, radius, material, vertices=8):
    a,b=Vector(a),Vector(b)
    d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius,radius2=.0008,
                                    depth=d.length,location=(a+b)/2)
    o=bpy.context.object;o.name=name
    o.rotation_euler=d.to_track_quat("Z","Y").to_euler()
    o.data.materials.append(material)

def add_details(name,row):
    for op in row.get("detail_ops",[]):
        kind,count,length=op["kind"],op["count"],op["length_m"]
        material=mat(name+"-"+kind,op["color"],0 if kind=="wood_scales" else .5)
        if kind=="flame_tines":
            for i in range(count):
                side=-1 if i%2 else 1; tier=i//2
                x=.045+.023*tier; z=.014+.043*tier
                tapered_detail("FlameGuard%02d"%i,(side*x,-.002,z),
                               (side*(x+.014),-.002,z+length*(1-.15*tier)),.006,material)
        elif kind=="flame_inlay":
            for i in range(count):
                x=(i-(count-1)/2)*.011
                tapered_detail("FlameGrip%02d"%i,(x,-.021,-.14),
                               (x+.004,-.021,-.14+length*(1-.12*abs(i-(count-1)/2))),.003,material)
        elif kind=="wood_scales":
            for i in range(count):
                x=(i-(count-1)/2)*.008
                rod("WoodScale%02d"%i,(x,-.021,-.134),(x,-.021,-.134+length),.0025,material)
        elif kind=="leaf_terminals":
            ends=sorted((a["to"] for a in row["guard_arms"]),key=lambda p:p[0])
            for i,p in enumerate((ends[0],ends[-1])):
                bpy.ops.mesh.primitive_uv_sphere_add(segments=8,ring_count=4,radius=1,location=(p[0],-.002,p[1]))
                o=bpy.context.object;o.name="LeafTerminal%02d"%i
                o.scale=(length/2,.004,length/4)
                o.data.materials.append(material)

def replace_pommel(kind, material):
    original = bpy.data.objects["Pommel"]
    pos = original.location.copy()
    length = original.dimensions.z
    bpy.data.objects.remove(original,do_unlink=True)
    if kind == "ring":
        bpy.ops.mesh.primitive_torus_add(major_segments=12,minor_segments=6,
                                         major_radius=max(.009,length/2-.004),minor_radius=.0035,
                                         location=pos,rotation=(math.pi/2,0,0))
        o=bpy.context.object
    elif kind in ("square","stone"):
        bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
        o = bpy.context.object
        o.dimensions = ((.05 if kind=="square" else .072),(.028 if kind=="square" else .043),length)
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    elif kind == "hex_point":
        bpy.ops.mesh.primitive_cone_add(vertices=6,radius1=.006,radius2=.033,depth=length,location=pos)
        o = bpy.context.object
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.028,location=pos)
        o = bpy.context.object
        o.scale = ((.95 if kind=="droplet" else .75),.7,length/.056)
        # Shift mass toward the grip for a hanging droplet; flatten for a seed.
        for v in o.data.vertices:
            t = (v.co.z/.028+1)/2
            v.co.x *= (1.12-.28*t) if kind=="droplet" else 1
    o.name = "Pommel"
    o.data.materials.append(material)

def verify():
    result = {}
    for name in ("Blade","Guard","Grip","Pommel"):
        if name not in bpy.data.objects: raise RuntimeError("missing "+name)
    socket=bpy.data.objects.get("GripSocket")
    if not socket or socket.type!="EMPTY": raise RuntimeError("missing GripSocket")
    grip=bpy.data.objects["Grip"]
    if abs(socket.location.z-grip.location.z)>.001: raise RuntimeError("GripSocket is not at grip center")
    for o in (x for x in bpy.data.objects if x.type=="MESH"):
        bm=bmesh.new();bm.from_mesh(o.data)
        bad=sum(1 for e in bm.edges if not e.is_manifold)
        result[o.name]={"nonmanifold_edges":bad,"triangles":sum(len(f.verts)-2 for f in bm.faces)}
        bm.free()
        if bad: raise RuntimeError(f"{o.name}: {bad} nonmanifold edges")
    bpy.context.view_layer.update()
    blade=bpy.data.objects["Blade"]
    bz=[(blade.matrix_world@v.co).z for v in blade.data.vertices]
    z=[(o.matrix_world@Vector(c)).z for o in bpy.data.objects if o.type=="MESH" for c in o.bound_box]
    result["dimensions_m"]={"blade":max(bz)-min(bz),"overall":max(z)-min(z)}
    if abs(result["dimensions_m"]["blade"]-.838)>.005 or abs(result["dimensions_m"]["overall"]-1.038)>.005:
        raise RuntimeError("measured length changed")
    result["total_triangles"]=sum(v["triangles"] for v in result.values() if isinstance(v,dict) and "triangles" in v)
    if result["total_triangles"]>1500: raise RuntimeError("inventory mesh triangle budget exceeded")
    return result

def setup_studio():
    bpy.ops.object.camera_add(location=(.13,-2.7,.32))
    cam=bpy.context.object
    cam.name="InventoryCamera"
    target=Vector((0,0,.32))
    cam.rotation_euler=(target-cam.location).to_track_quat("-Z","Y").to_euler()
    cam.data.type="ORTHO";cam.data.ortho_scale=1.18
    bpy.context.scene.camera=cam
    bpy.ops.object.light_add(type="AREA",location=(-1,-2,1.4))
    light=bpy.context.object;light.data.energy=120;light.data.size=2.2
    bpy.ops.object.light_add(type="AREA",location=(1,1,0))
    light=bpy.context.object;light.data.energy=65;light.data.size=2.8
    scene=bpy.context.scene
    scene.render.engine="BLENDER_EEVEE"
    scene.render.resolution_x=360;scene.render.resolution_y=480;scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"
    scene.world.color=(.026,.038,.052)
    scene.view_settings.view_transform="Standard"
    scene.view_settings.look="Medium High Contrast"
    scene.view_settings.exposure=0

def build(name, row):
    base.build_object()
    blade,guard,grip=(bpy.data.objects[n] for n in ("Blade","Guard","Grip"))
    for i,scale in enumerate(row["blade_profile"]):
        for j in range(4): blade.data.vertices[4*i+j].co.x*=scale
    for v in guard.data.vertices: v.co.x*=.18
    grip.scale.x*=row["grip_radius_multiplier"]
    grip.scale.y*=row["grip_radius_multiplier"]
    palette=row["palette"]
    mats={role:mat(name+"-"+role,palette[role],0 if role=="grip" else .65) for role in palette}
    for o,role in ((blade,"blade"),(guard,"guard"),(grip,"grip")):
        o.data.materials.clear();o.data.materials.append(mats[role])
    for i,arm in enumerate(row["guard_arms"]): rod("GuardArm%02d"%i,arm["from"],arm["to"],arm["radius_m"],mats["guard"])
    replace_pommel(row["pommel"],mats["pommel"])
    for i,z in enumerate((-.014,-.15)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=.024*row["grip_radius_multiplier"],depth=.006,location=(0,0,z))
        o=bpy.context.object;o.name="GripCollar%02d"%i;o.data.materials.append(mats["guard"])
    add_details(name,row)
    socket=bpy.data.objects.new("GripSocket",None)
    bpy.context.collection.objects.link(socket)
    socket.location=grip.location.copy()
    socket.empty_display_size=.01
    checks=verify()
    for o in bpy.data.objects:o.select_set(o.type in ("MESH","EMPTY"))
    bpy.context.view_layer.objects.active=blade
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name.lower()+".glb")),export_format="GLB",use_selection=True)
    setup_studio()
    bpy.context.scene.render.filepath=str(OUT/(name.lower()+".png"))
    bpy.ops.render.render(write_still=True)
    return checks

checks={name:build(name,row) for name,row in PACK["variants"].items() if not args.only or name==args.only}
(OUT/"checks.json").write_text(json.dumps(checks,indent=2))
