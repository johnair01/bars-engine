import bpy,sys
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=sys.argv[-2])
fig=bpy.data.objects['Figure']
for m in list(fig.modifiers): fig.modifiers.remove(m)
mw=fig.matrix_world.copy(); fig.parent=None; fig.matrix_world=mw
fig.vertex_groups.clear()
for n in ['Rig','Icosphere']: bpy.data.objects.remove(bpy.data.objects[n])
for a in list(bpy.data.actions): bpy.data.actions.remove(a)
bpy.context.view_layer.objects.active=fig; fig.select_set(True)
bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
print('dims',[round(d,3) for d in fig.dimensions], 'zmin', round(min((fig.matrix_world@v.co).z for v in fig.data.vertices),3))
bpy.ops.wm.save_as_mainfile(filepath=sys.argv[-1])
