"""Export the rigged, mocap-walking figure for the cave: export_walker.py -- MOCAP.blend OUT.glb. Prints one JSON line.

Keeps the mesh and the game skeleton (GAME_RIG_Figure, renamed Rig, the name bake_daemons.py reads) with the MocapWalk
action and, when the step made one, MocapRun, drops the control rig, and limits every vertex to its two strongest bones, renormalised, because the cave's body
format carries two joints a vertex (bake_daemons.py). The walk is sampled at every frame as straight-line keys.
Then bake it for the phone: python3 content/ontology-game/cave/bake_daemons.py --walker OUT.glb content/ontology-game/cave/player/walker.glb"""
import bpy, json, sys

src, out = sys.argv[-2:]
bpy.ops.wm.open_mainfile(filepath=src)
T, fig = bpy.data.objects["GAME_RIG_Figure"], bpy.data.objects["Figure"]
names = {b.name for b in T.data.bones if b.use_deform}
# the mesh rides the game skeleton: its groups carry the deform bones' names (Rigify's DEF- prefix dropped)
for vg in list(fig.vertex_groups):
    if vg.name not in names and vg.name.startswith("DEF-") and vg.name[4:] in names:
        vg.name = vg.name[4:]
for vg in list(fig.vertex_groups):
    if vg.name not in names:
        fig.vertex_groups.remove(vg)
mw = fig.matrix_world.copy()
fig.parent = None
fig.matrix_world = mw
for m in fig.modifiers:
    if m.type == "ARMATURE":
        m.object = T
for o in list(bpy.data.objects):
    if o not in (T, fig):
        bpy.data.objects.remove(o)
for pb in T.pose.bones:
    for c in list(pb.constraints):
        pb.constraints.remove(c)
bpy.ops.object.select_all(action="DESELECT")
bpy.context.view_layer.objects.active = fig
fig.select_set(True)
bpy.ops.object.vertex_group_limit_total(group_select_mode="ALL", limit=2)
bpy.ops.object.vertex_group_normalize_all(group_select_mode="ALL", lock_active=False)
T.name = "Rig"
ident = all(abs(T.matrix_world[i][j] - (i == j)) < 1e-5 for i in range(4) for j in range(4)) and \
    all(abs(fig.matrix_world[i][j] - (i == j)) < 1e-5 for i in range(4) for j in range(4))
act = bpy.data.actions["MocapWalk"]
keep = [a for a in (act, bpy.data.actions.get("MocapRun")) if a]
for a in list(bpy.data.actions):
    if a not in keep:
        bpy.data.actions.remove(a)
T.animation_data.action = act
sc = bpy.context.scene
sc.frame_start, sc.frame_end = int(act.frame_range[0]), int(act.frame_range[1])
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_yup=True, export_normals=True, export_texcoords=False,
                          export_skins=True, export_def_bones=True, export_animations=True, export_animation_mode="ACTIONS",
                          export_force_sampling=True, export_optimize_animation_size=False, export_frame_range=True,
                          export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_extras=True)  # extras: each clip's travel_m
print("@@JSON@@" + json.dumps({"ok": ident, "bones": len(names), "groups": len(fig.vertex_groups),
                              "frames": [sc.frame_start, sc.frame_end], "identity": ident,
                              "actions": {a.name: a.get("travel_m") for a in keep}}))
