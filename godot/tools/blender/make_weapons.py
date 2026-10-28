# Simple low-poly weapons for Runefall, grip at the origin, blade along +Y (the hand bone's direction).
#   blender -b --python make_weapons.py -- <out_dir>
import bpy, bmesh, sys, os
OUT = sys.argv[sys.argv.index('--')+1]; os.makedirs(OUT, exist_ok=True)
def mat(name, rgb, metal=0.0, rough=0.7):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    return m
def box(name, size, loc, m, taper=1.0):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]; v.co.y *= size[1]; v.co.z *= size[2]
        if taper != 1.0 and v.co.y > 0: v.co.x *= taper; v.co.z *= taper
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); o.location = loc; me.materials.append(m)
    bpy.context.scene.collection.objects.link(o); return o
def export(name, parts):
    for o in bpy.context.scene.objects: o.select_set(o in parts)
    bpy.context.view_layer.objects.active = parts[0]; bpy.ops.object.join()
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name+'.glb'), export_format='GLB', use_selection=True, export_animations=False)
    for o in list(bpy.context.scene.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
iron = mat('RustyIron', (0.33, 0.29, 0.26), 0.7, 0.55); wood = mat('GripWood', (0.18, 0.11, 0.06)); leather = mat('Leather', (0.22, 0.14, 0.09))
# tier-1 short sword: worn iron blade, crossguard, leather grip, pommel
export('sword_t1', [box('blade', (0.035, 0.62, 0.008), (0, 0.42, 0), iron, taper=0.45),
                    box('guard', (0.16, 0.025, 0.03), (0, 0.10, 0), iron),
                    box('grip', (0.028, 0.18, 0.028), (0, 0.0, 0), leather),
                    box('pommel', (0.045, 0.04, 0.045), (0, -0.1, 0), iron)])
# tier-1 club (brutes): a knotted wooden club
export('club_t1', [box('head', (0.09, 0.42, 0.09), (0, 0.42, 0), wood, taper=1.35),
                   box('handle', (0.035, 0.3, 0.035), (0, 0.05, 0), leather)])
print('WEAPONS', os.listdir(OUT))
