"""Render a looping walk: render.py -- SOURCE(.glb|.blend) ARMATURE ACTION OUTDIR FRAMES SAMPLES"""
import bpy,sys
from mathutils import Vector
src,arm,actname,outdir,nframes,samples=sys.argv[sys.argv.index('--')+1:]
nframes=int(nframes)
if src.endswith('.glb'):
    bpy.ops.wm.read_factory_settings(use_empty=True); bpy.ops.import_scene.gltf(filepath=src)
else:
    bpy.ops.wm.open_mainfile(filepath=src)
sc=bpy.context.scene; sc.render.fps=24
A=bpy.data.objects[arm]; act=bpy.data.actions[actname]
A.animation_data_create(); A.animation_data.action=act
if A.animation_data.action_slot is None and act.slots: A.animation_data.action_slot=act.slots[0]
def fcurves(a):
    for l in a.layers:
        for st in l.strips:
            for cb in st.channelbags: yield from cb.fcurves
for fc in fcurves(act):
    if not any(m.type=='CYCLES' for m in fc.modifiers): fc.modifiers.new('CYCLES')
keep={'Figure',arm}
for o in list(bpy.data.objects):
    if o.name not in keep: bpy.data.objects.remove(o)
# stage: floor, sun, fill, camera at 3/4 front (figure faces -Y)
bpy.ops.mesh.primitive_plane_add(size=20); fl=bpy.context.object
m=bpy.data.materials.new('Floor'); m.use_nodes=True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.42,0.42,0.45,1); fl.data.materials.append(m)
sun=bpy.data.objects.new('Sun',bpy.data.lights.new('Sun','SUN')); sun.data.energy=3.5; sun.data.angle=0.05
sun.rotation_euler=(0.75,0.15,0.9); sc.collection.objects.link(sun)
w=bpy.data.worlds.new('W'); sc.world=w; w.use_nodes=True; w.node_tree.nodes['Background'].inputs['Color'].default_value=(0.55,0.6,0.7,1); w.node_tree.nodes['Background'].inputs['Strength'].default_value=0.6
cam=bpy.data.objects.new('Cam',bpy.data.cameras.new('Cam')); sc.collection.objects.link(cam); cam.data.lens=52
cam.location=(2.5,-3.4,1.25); d=Vector((0,0,0.85))-cam.location; cam.rotation_euler=d.to_track_quat('-Z','Y').to_euler(); sc.camera=cam
r=sc.render; r.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=int(samples); sc.cycles.use_denoising=True
sc.cycles.max_bounces=4; r.resolution_x=480; r.resolution_y=360; r.resolution_percentage=100
r.image_settings.file_format='PNG'; r.filepath=outdir.rstrip('/')+'/f_'
sc.frame_start=1; sc.frame_end=nframes
bpy.ops.render.render(animation=True)
print('DONE',outdir)
