# Assemble the Quaternius Ranger outfit + base head, attach UAL animations, save ranger.blend
import bpy, bmesh, math
Q='/tmp/claude-0/-home-user-Runefall/bc8a9f99-9a3a-56ce-a149-20c8edb42f9c/scratchpad/qt/'
OUT='/tmp/claude-0/-home-user-Runefall/bc8a9f99-9a3a-56ce-a149-20c8edb42f9c/scratchpad/bl/ranger.blend'
bpy.ops.wm.read_factory_settings(use_empty=True)
def imp(f):
    before=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f); return [o for o in bpy.data.objects if o not in before]
def kill(objs):
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
out = imp(Q+'outfits/Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits/Male_Ranger.gltf')
arm = [o for o in out if o.type=='ARMATURE'][0]; arm.name='Hero'
kill([o for o in out if o.name.startswith('Icosphere')])
base = imp(Q+'ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf')
barm = [o for o in base if o.type=='ARMATURE'][0]
neckz = (barm.matrix_world @ barm.data.bones['neck_01'].head_local).z
for o in base:
    if o.type!='MESH' or o.name.startswith('Icosphere'): continue
    if o.name.startswith('SuperHero'):
        bm = bmesh.new(); bm.from_mesh(o.data)
        mw = o.matrix_world
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if (mw @ v.co).z < neckz-0.02], context='VERTS')
        bm.to_mesh(o.data); bm.free()
    for m in o.modifiers:
        if m.type=='ARMATURE': m.object = arm
    mw = o.matrix_world.copy(); o.parent = arm; o.matrix_world = mw
kill([o for o in base if o.type=='ARMATURE' or o.name.startswith('Icosphere')])
anim = imp(Q+'ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb')
for a in bpy.data.actions: a.use_fake_user = True
kill(anim)
for o in list(bpy.data.objects):
    if o.type=='MESH' and o.parent is None: kill([o])
print('neckz', neckz, 'objs', [o.name for o in bpy.data.objects])
bpy.ops.wm.save_as_mainfile(filepath=OUT)
