class_name CharacterRig
## Every humanoid (heroes, bandits, dwarves...) uses the Quaternius 'Hero' armature, so they all share one animation
## library (the 42 Universal Animation Library clips that came with the Ranger) and the same weapon bones.

const ANIM_SOURCE := "res://assets/characters/ranger/ranger.glb"
static var _library: AnimationLibrary


static func library() -> AnimationLibrary:
	if _library == null:
		var src: Node = (load(ANIM_SOURCE) as PackedScene).instantiate()
		var ap: AnimationPlayer = src.find_child("AnimationPlayer", true, false)
		_library = ap.get_animation_library("")
		src.free()
	return _library


## Returns the model's AnimationPlayer, creating one with the shared library when the model came without animations.
static func animations(model: Node3D) -> AnimationPlayer:
	var ap: AnimationPlayer = model.find_child("AnimationPlayer", true, false)
	if ap == null:
		ap = AnimationPlayer.new()
		ap.name = "AnimationPlayer"
		model.add_child(ap)
		ap.root_node = NodePath("..")
		ap.add_animation_library("", library())
	return ap


## Puts a weapon model in a hand ("hand_r" / "hand_l"). pos/rot are in the hand bone's space (metres, degrees).
static func attach(model: Node3D, scene: PackedScene, bone: String, pos := Vector3.ZERO, rot := Vector3.ZERO) -> Node3D:
	var skel: Skeleton3D = model.find_child("Skeleton3D", true, false)
	if skel == null or skel.find_bone(bone) < 0:
		return null
	var att := BoneAttachment3D.new()
	att.bone_name = bone
	skel.add_child(att)
	var w: Node3D = scene.instantiate()
	w.position = pos
	w.rotation_degrees = rot
	att.add_child(w)
	return w
