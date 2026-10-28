# Assemble a Quaternius character: an outfit + the base head (+ optional hair/beard), on the shared 'Hero' armature,
# with every Universal Animation Library action kept (so export_godot.py can write them, or skip them).
#   OUTFIT=Male_Peasant HAIR=Hair_Buzzed,Hair_Beard TINT=0.55,0.42,0.38 OUT=bandit.blend  blender -b --python build_character.py
# Q is the folder holding the three unzipped Quaternius packs (outfits/, ubc/, ual/).
import bpy, bmesh, os
Q = os.environ.get('Q', '/tmp/claude-0/-home-user-Runefall/bc8a9f99-9a3a-56ce-a149-20c8edb42f9c/scratchpad/qt/')
OUTFIT = os.environ.get('OUTFIT', 'Male_Ranger')
HAIR = [h for h in os.environ.get('HAIR', '').split(',') if h]
TINT = [float(x) for x in os.environ.get('TINT', '1,1,1').split(',')]   # multiply the outfit's colours (darker / dirtier variants)
OUT = os.environ['OUT']
OUTFITS = Q+'outfits/Modular Character Outfits - Fantasy[Standard]/Exports/glTF (Godot-Unreal)/Outfits/'
BASE = Q+'ubc/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'
HAIRS = Q+'ubc/Universal Base Characters[Standard]/Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/'
UAL = Q+'ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb'
bpy.ops.wm.read_factory_settings(use_empty=True)
def imp(f):
    before = set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=f); return [o for o in bpy.data.objects if o not in before]
def kill(objs):
    for o in objs: bpy.data.objects.remove(o, do_unlink=True)
def adopt(objs, arm):
    # move meshes onto our armature and drop the armature they came with
    for o in objs:
        if o.type != 'MESH' or o.name.startswith('Icosphere'): continue
        for m in o.modifiers:
            if m.type == 'ARMATURE': m.object = arm
        mw = o.matrix_world.copy(); o.parent = arm; o.matrix_world = mw
    kill([o for o in objs if o.type == 'ARMATURE' or o.name.startswith('Icosphere')])
out = imp(OUTFITS+OUTFIT+'.gltf')
arm = [o for o in out if o.type == 'ARMATURE'][0]; arm.name = 'Hero'
kill([o for o in out if o.name.startswith('Icosphere')])
base = imp(BASE)
barm = [o for o in base if o.type == 'ARMATURE'][0]
neckz = (barm.matrix_world @ barm.data.bones['neck_01'].head_local).z
for o in base:
    if o.type == 'MESH' and o.name.startswith('SuperHero'):
        bm = bmesh.new(); bm.from_mesh(o.data); mw = o.matrix_world
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if (mw @ v.co).z < neckz-0.02], context='VERTS')   # keep only the head
        bm.to_mesh(o.data); bm.free()
adopt(base, arm)
for h in HAIR:
    adopt(imp(HAIRS+h+'.gltf'), arm)
if TINT != [1,1,1]:
    for m in {s.material for o in arm.children for s in o.material_slots if s.material}:
        if not m.use_nodes or 'Superhero' in m.name or 'Eye' in m.name: continue   # leave skin and eyes alone
        for n in m.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                inp = n.inputs['Base Color']
                mix = m.node_tree.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
                mix.inputs['Factor'].default_value = 1.0; mix.inputs['B'].default_value = (*TINT, 1)
                if inp.is_linked:
                    m.node_tree.links.new(inp.links[0].from_socket, mix.inputs['A'])
                else:
                    mix.inputs['A'].default_value = inp.default_value
                m.node_tree.links.new(mix.outputs['Result'], inp)
anim = imp(UAL)
for a in bpy.data.actions: a.use_fake_user = True
kill(anim)
for o in list(bpy.data.objects):
    if o.type == 'MESH' and o.parent is None: kill([o])
print('BUILT', OUTFIT, [o.name for o in arm.children])
bpy.ops.wm.save_as_mainfile(filepath=OUT)
