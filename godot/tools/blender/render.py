# Render sprite frames from ranger.blend.  args after --: engine anims(name:frames,...) dirs outdir [size]
import bpy, math, sys, os
from mathutils import Vector
a = sys.argv[sys.argv.index('--')+1:]
ENGINE, ANIMS, DIRS, OUTD = a[0], a[1], [int(x) for x in a[2].split(',')], a[3]
SIZE = int(a[4]) if len(a)>4 else 192
sc = bpy.context.scene
arm = bpy.data.objects['Hero']
# ---- look: darker, desaturated textures (Runefall grim palette) ----
for m in bpy.data.materials:
    if not m.use_nodes: continue
    nt = m.node_tree
    for n in nt.nodes:
        if n.type=='BSDF_PRINCIPLED':
            inp = n.inputs['Base Color']
            if inp.is_linked:
                src = inp.links[0].from_socket
                hsv = nt.nodes.new('ShaderNodeHueSaturation'); hsv.inputs['Saturation'].default_value = 0.72; hsv.inputs['Value'].default_value = 0.78
                nt.links.new(src, hsv.inputs['Color']); nt.links.new(hsv.outputs['Color'], inp)
            n.inputs['Roughness'].default_value = 0.85
            if 'Specular IOR Level' in n.inputs: n.inputs['Specular IOR Level'].default_value = 0.25
# ---- camera: orthographic, true 2:1 iso (30 deg down), looking toward game +x+y ----
cam = bpy.data.cameras.new('cam'); cam.type='ORTHO'; cam.ortho_scale = 2.6
co = bpy.data.objects.new('cam', cam); sc.collection.objects.link(co); sc.camera = co
d = Vector((1, -1, 0)).normalized()  # camera sits at the bottom of the screen: game (+x,+y) == blender (+1,-1)
el = math.radians(30)
target = Vector((0,0,0.78))
co.location = target + Vector((d.x*math.cos(el), d.y*math.cos(el), math.sin(el)))*20
co.rotation_euler = (target - co.location).to_track_quat('-Z','Y').to_euler()
# ---- lights: warm key from upper left of screen, cool rim from behind, low fill ----
def light(name, energy, color, frm, elev):
    # sun shining from blender ground direction frm, elev degrees above the horizon
    L = bpy.data.lights.new(name, 'SUN'); L.energy = energy; L.color = color; L.angle = math.radians(8)
    o = bpy.data.objects.new(name, L); sc.collection.objects.link(o)
    v = Vector((frm[0], frm[1], 0)).normalized(); e = math.radians(elev)
    o.rotation_euler = (-Vector((v.x*math.cos(e), v.y*math.cos(e), math.sin(e)))).to_track_quat('-Z','Y').to_euler(); return o
light('key', 3.4, (1.0,0.84,0.64), (0.35,-1.6), 48)    # warm, upper left of the screen, in front
light('rim', 3.0, (0.55,0.66,1.0), (-0.6,1.4), 30)     # cool edge light from behind
light('fill', 0.6, (0.75,0.78,0.9), (1.5,0.2), 20)     # weak fill from screen right
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05,0.05,0.06,1); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
sc.render.engine = ENGINE
if ENGINE=='CYCLES':
    sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.cycles.device='CPU'
sc.render.film_transparent = True
sc.render.resolution_x = sc.render.resolution_y = SIZE; sc.render.resolution_percentage = 100
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
sc.view_settings.view_transform = 'Standard'
BOW = os.environ.get('BOW','')
if BOW:
    import bmesh
    mat = bpy.data.materials.new('bowwood'); mat.use_nodes=True; mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.16,0.09,0.04,1); mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=0.6
    smat = bpy.data.materials.new('bowstring'); smat.use_nodes=True; smat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(0.75,0.7,0.6,1)
    cu = bpy.data.curves.new('bow','CURVE'); cu.dimensions='3D'; cu.bevel_depth=0.013; cu.bevel_resolution=2
    sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
    L=0.62; bend=0.16
    G=float(os.environ.get('GRIPX','0'))
    pts=[(-bend*1.2+G,-L),(G,0),(-bend*1.2+G,L)]   # the grip (middle of the bow) sits on the hand
    for bp,(x,z) in zip(sp.bezier_points,pts):
        bp.co=(x,0,z); bp.handle_left_type=bp.handle_right_type='AUTO'
    sp.bezier_points[0].radius=0.55; sp.bezier_points[2].radius=0.55; sp.bezier_points[1].radius=1.3
    bow = bpy.data.objects.new('Bow', cu); cu.materials.append(mat); sc.collection.objects.link(bow)
    sm = bpy.data.curves.new('str','CURVE'); sm.dimensions='3D'; sm.bevel_depth=0.003
    s2 = sm.splines.new('POLY'); s2.points.add(1); s2.points[0].co=(-bend*1.2+G,0,-L,1); s2.points[1].co=(-bend*1.2+G,0,L,1)
    so = bpy.data.objects.new('String', sm); sm.materials.append(smat); sc.collection.objects.link(so); so.parent = bow
    ax = [float(x) for x in BOW.split(',')]   # rotation (deg) and offset in the hand bone's space
    bow.parent = arm; bow.parent_type='BONE'; bow.parent_bone = os.environ.get('BOWHAND','hand_r')
    bow.rotation_euler = [math.radians(v) for v in ax[:3]]; bow.location = ax[3:6] if len(ax)>=6 else (0,0,0)
def fcurves_of(act):
    try: return list(act.fcurves)
    except Exception: pass
    out = []
    for L in act.layers:
        for st in L.strips:
            for cb in st.channelbags: out += list(cb.fcurves)
    return out
FIST = {}
if BOW and os.environ.get('FIST','1')=='1':
    # the bow hand closes into a fist in every animation: finger pose copied from the aim pose, finger keys muted
    if not arm.animation_data: arm.animation_data_create()
    pa = bpy.data.actions['Pistol_Shoot']; arm.animation_data.action = pa
    if hasattr(arm.animation_data,'action_slot') and pa.slots: arm.animation_data.action_slot = pa.slots[0]
    sc.frame_set(int(sum(pa.frame_range)/2))
    hand = os.environ.get('BOWHAND','hand_r'); side = hand[-2:]
    for pb in arm.pose.bones:
        if pb.name.endswith(side) and any(pb.name.startswith(k) for k in ('index','middle','ring','pinky','thumb')):
            FIST[pb.name] = pb.rotation_quaternion.copy()
    for act in bpy.data.actions:
        for fc in fcurves_of(act):
            if any(('"'+b+'"') in fc.data_path for b in FIST): fc.mute = True
    for b,q in FIST.items(): arm.pose.bones[b].rotation_quaternion = q
if not arm.animation_data: arm.animation_data_create()
for spec in ANIMS.split(','):
    parts = spec.split(':'); name, nf = parts[0], int(parts[1])
    if BOW: bow.rotation_euler = [math.radians(float(v)) for v in (parts[2].split('/') if len(parts)>2 else BOW.split(',')[:3])]
    act = bpy.data.actions[name]
    arm.animation_data.action = act
    if hasattr(arm.animation_data,'action_slot') and act.slots: arm.animation_data.action_slot = act.slots[0]
    f0, f1 = act.frame_range
    loop = name.endswith('Loop')
    for di in DIRS:
        arm.rotation_mode='XYZ'; arm.rotation_euler = (0,0, math.radians(-45*di) + math.radians(90))
        for k in range(nf):
            t = k/nf if (loop or nf<2) else k/(nf-1)
            sc.frame_set(int(round(f0 + (f1-f0)*t)))
            if os.environ.get('CAM_BONE'):   # close-up on one bone (for checking the grip)
                bpy.context.view_layer.update()
                tp = arm.matrix_world @ arm.pose.bones[os.environ['CAM_BONE']].tail
                cam.ortho_scale = float(os.environ.get('CAM_SCALE','0.5'))
                co.location = tp + Vector((d.x*math.cos(el), d.y*math.cos(el), math.sin(el)))*20
            sc.render.filepath = os.path.join(OUTD, f'{name}_d{di}_{k:02d}.png')
            bpy.ops.render.render(write_still=True)
print('DONE')
