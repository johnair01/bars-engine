# Refit the Rigify metarig to landmark joints (from the J4 generator's joint table), then save.
import bpy,sys
from mathutils import Vector as V
bpy.ops.wm.open_mainfile(filepath=sys.argv[-2])
for o in list(bpy.data.objects):
    if o.name.startswith('RIG_') or o.name.startswith('WGT'): bpy.data.objects.remove(o)
for c in list(bpy.data.collections):
    if c.name.startswith('WGT'): bpy.data.collections.remove(c)
fig=bpy.data.objects['Figure']
toe_y=min(v.co.y for v in fig.data.vertices if v.co.z<0.08)
heel_y=max(v.co.y for v in fig.data.vertices if v.co.z<0.08)
m=bpy.data.objects['META_Figure']; m.location=(0,0,0)
bpy.context.view_layer.objects.active=m; bpy.ops.object.mode_set(mode='EDIT')
eb=m.data.edit_bones
CONN={b.name:b.use_connect for b in eb}
L={ # name: (head, tail) for the .L side; .R is mirrored
 'shoulder':((0.03,0.0,1.40),(0.17,0.0,1.39)),
 'upper_arm':((0.19,0.0,1.385),(0.27,0.01,1.13)),
 'forearm':((0.27,0.01,1.13),(0.345,-0.02,0.89)),
 'hand':((0.345,-0.02,0.89),(0.383,-0.039,0.70)),
 'thigh':((0.09,0.0,0.96),(0.105,-0.01,0.50)),
 'shin':((0.105,-0.01,0.50),(0.115,0.015,0.085)),
 'foot':((0.115,0.015,0.085),(0.12,toe_y*0.55,0.02)),
 'toe':((0.12,toe_y*0.55,0.02),(0.12,toe_y,0.02)),
 'heel.02':((0.08,heel_y,0.0),(0.15,heel_y,0.0)),
 'pelvis':((0.0,0.0,0.96),(0.10,-0.08,1.06)),
 'breast':((0.10,-0.06,1.28),(0.10,-0.16,1.28)),
}
C={'spine':((0,0,0.96),(0,0,1.06)),'spine.001':((0,0,1.06),(0,0,1.17)),'spine.002':((0,0,1.17),(0,0,1.29)),
   'spine.003':((0,0,1.29),(0,0.005,1.42)),'spine.004':((0,0.005,1.42),(0,0.01,1.48)),'spine.005':((0,0.01,1.48),(0,0.008,1.53)),
   'spine.006':((0,0.008,1.53),(0,0.005,1.72))}
def put(n,h,t):
    b=eb.get(n)
    if not b: print('missing',n); return
    z=b.z_axis.copy(); b.use_connect=False; b.head=V(h); b.tail=V(t); b.align_roll(z)
import os
if not os.environ.get("NOSPINE"):
    for n,(h,t) in C.items(): put(n,h,t)
for n,(h,t) in L.items():
    put(n+'.L',h,t); put(n+'.R',(-h[0],h[1],h[2]),(-t[0],t[1],t[2]))
for b in eb:
    if CONN.get(b.name) and b.parent: b.use_connect=True
bpy.ops.object.mode_set(mode='OBJECT')
for c in m.users_collection: c.hide_viewport=False
m.hide_viewport=False; m.hide_set(False); m.hide_select=False
for o in bpy.data.objects: o.select_set(False)
m.select_set(True)
print('meta hidden', m.hide_get(), [c.name for c in m.users_collection])
print('toe_y',round(toe_y,3),'heel_y',round(heel_y,3))
bpy.ops.wm.save_as_mainfile(filepath=sys.argv[-1])
