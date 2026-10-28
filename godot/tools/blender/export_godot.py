# Export the assembled Ranger (bl/ranger.blend from build.py) and a simple bow to glTF for Godot.
#   blender -b ranger.blend --python export_godot.py -- <out_dir> [name] [anims=1] [bow=1]
# Without animations the model shares the Ranger's animation library in Godot (same 'Hero' armature and bone names).
# Ranger: armature 'Hero' + outfit + head, every Universal Animation Library action as a named animation.
# Bow: a low-poly mesh with its grip at the origin, string facing -X; attach it to the hand bone in Godot.
import bpy, bmesh, math, sys, os
ARGS = sys.argv[sys.argv.index('--')+1:]
OUT = ARGS[0]
NAME = ARGS[1] if len(ARGS) > 1 else 'ranger'
WITH_ANIMS = (ARGS[2] if len(ARGS) > 2 else '1') == '1'
WITH_BOW = (ARGS[3] if len(ARGS) > 3 else '1') == '1'
os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
arm = bpy.data.objects['Hero']
# textures at most 1024 px (plenty from the game camera) so the file stays small
for img in bpy.data.images:
    if img.size[0] > 1024 or img.size[1] > 1024:
        img.scale(min(1024, img.size[0]), min(1024, img.size[1]))
# every action becomes its own NLA track on the Ranger's armature, so the exporter writes each one as a named animation
# (the Universal Animation Library actions were made on another armature object, so 'ACTIONS' mode would skip them)
if not arm.animation_data: arm.animation_data_create()
ad = arm.animation_data
ad.action = None
for t in list(ad.nla_tracks): ad.nla_tracks.remove(t)
for act in (bpy.data.actions if WITH_ANIMS else []):
    if act.name.startswith('A_TPose'): continue
    tr = ad.nla_tracks.new(); tr.name = act.name
    st = tr.strips.new(act.name, int(act.frame_range[0]), act)
    if hasattr(st, 'action_slot') and act.slots: st.action_slot = act.slots[0]
    tr.mute = False
for o in bpy.data.objects: o.select_set(o==arm or o.parent==arm)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, NAME+'.glb'), export_format='GLB', use_selection=True,
    export_animations=WITH_ANIMS, export_animation_mode='NLA_TRACKS', export_force_sampling=True, export_frame_range=False,
    export_image_format='JPEG', export_image_quality=88, export_apply=False)
if not WITH_BOW:
    print('EXPORTED', os.listdir(OUT)); sys.exit(0)
# ---- bow: bezier limbs swept into a mesh ----
for o in list(bpy.data.objects): o.select_set(False)
wood = bpy.data.materials.new('BowWood'); wood.use_nodes = True
bsdf = wood.node_tree.nodes['Principled BSDF']; bsdf.inputs['Base Color'].default_value = (0.16,0.09,0.04,1); bsdf.inputs['Roughness'].default_value = 0.6
strm = bpy.data.materials.new('BowString'); strm.use_nodes = True
strm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.75,0.7,0.6,1)
L, bend = 0.62, 0.16
cu = bpy.data.curves.new('bow','CURVE'); cu.dimensions='3D'; cu.bevel_depth=0.013; cu.bevel_resolution=2
sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
for bp,(x,z) in zip(sp.bezier_points, [(-bend*1.2,-L),(0,0),(-bend*1.2,L)]):
    bp.co=(x,0,z); bp.handle_left_type=bp.handle_right_type='AUTO'
sp.bezier_points[0].radius=0.55; sp.bezier_points[2].radius=0.55; sp.bezier_points[1].radius=1.3
bow = bpy.data.objects.new('Bow', cu); sc.collection.objects.link(bow); cu.materials.append(wood)
sm = bpy.data.curves.new('str','CURVE'); sm.dimensions='3D'; sm.bevel_depth=0.003
s2 = sm.splines.new('POLY'); s2.points.add(1); s2.points[0].co=(-bend*1.2,0,-L,1); s2.points[1].co=(-bend*1.2,0,L,1)
st = bpy.data.objects.new('BowString', sm); sc.collection.objects.link(st); sm.materials.append(strm)
for o in (bow, st):
    bpy.context.view_layer.objects.active = o; o.select_set(True)
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join()
b = bpy.context.view_layer.objects.active; b.name = 'Bow'
for o in bpy.data.objects: o.select_set(o==b)
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'bow_t1.glb'), export_format='GLB', use_selection=True, export_animations=False)
print('EXPORTED', os.listdir(OUT))
