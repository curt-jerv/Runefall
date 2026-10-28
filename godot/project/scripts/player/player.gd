class_name Player
extends CharacterBody3D
## The hero: moves with the on-screen joystick (or WASD/arrows), shoots, rolls, plays the Quaternius animations.
## Speeds are the HTML game's numbers converted to metres (Formulas.m): 170 units/s -> ~4.6 m/s.

signal shot_fired(from: Vector3, dir: Vector3)

const MODEL: PackedScene = preload("res://assets/characters/ranger/ranger.glb")
const BOW: PackedScene = preload("res://assets/weapons/bow_t1.glb")
const JOG_NATURAL_SPEED := 5.26    ## Jog_Fwd covers 4.91 m in 0.933 s; played faster or slower to match our speed

@export var camera_path: NodePath
@export var move_speed := 4.6
@export var dodge_speed := 10.0
@export var dodge_time := 0.24
@export var dodge_cooldown := 1.55
@export var attack_time := 0.45

var cam: IsoCamera
var model: Node3D
var anim: AnimationPlayer
var joystick := Vector2.ZERO        ## from the on-screen joystick: x = screen right, y = screen down, length 0..1
var facing := Vector3(0, 0, 1)
var dodge_t := 0.0
var dodge_cd := 0.0
var dodge_dir := Vector3.ZERO
var attack_t := 0.0
var dead := false


func _ready() -> void:
	cam = get_node_or_null(camera_path)
	_ensure_input_actions()
	var shape := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.35
	cap.height = 1.8
	shape.shape = cap
	shape.position.y = 0.9
	add_child(shape)
	model = MODEL.instantiate()
	add_child(model)
	anim = model.find_child("AnimationPlayer", true, false)
	if anim:
		# Godot drops the '_Loop' suffix on import and makes those animations repeat by itself
		anim.play("Idle")
	_attach_bow()
	# the hero's own warm light (the HTML game's light radius)
	var glow := OmniLight3D.new()
	glow.light_color = Color("#ffb35a")
	glow.light_energy = 1.4
	glow.omni_range = 7.0
	glow.position = Vector3(0, 2.2, 0)
	add_child(glow)


func _attach_bow() -> void:
	var skel: Skeleton3D = model.find_child("Skeleton3D", true, false)
	if skel == null or skel.find_bone("hand_r") < 0:
		return
	var att := BoneAttachment3D.new()
	att.bone_name = "hand_r"
	skel.add_child(att)
	var bow := BOW.instantiate()
	bow.position = Vector3(0.0, 0.06, 0.02)
	bow.rotation_degrees = Vector3(-90, 0, 0)
	att.add_child(bow)


func _physics_process(delta: float) -> void:
	if dead:
		return
	dodge_cd = maxf(0.0, dodge_cd - delta)
	attack_t = maxf(0.0, attack_t - delta)
	var input := joystick
	if input.length() < 0.05:
		input = Input.get_vector("move_left", "move_right", "move_up", "move_down")
	var dir := Vector3.ZERO
	if cam and input.length() > 0.05:
		dir = (cam.ground_right() * input.x + cam.ground_down() * input.y)
		if dir.length() > 1.0:
			dir = dir.normalized()
	if Input.is_action_just_pressed("dodge"):
		dodge()
	if Input.is_action_just_pressed("attack"):
		attack()
	if dodge_t > 0.0:
		dodge_t -= delta
		velocity = dodge_dir * dodge_speed
	elif attack_t > 0.0:
		velocity = Vector3.ZERO   # plant the feet while the shot goes off
	else:
		velocity = dir * move_speed
		if dir.length() > 0.05:
			facing = dir.normalized()
	if not is_on_floor():
		velocity.y -= 20.0 * delta
	move_and_slide()
	model.rotation.y = atan2(facing.x, facing.z)
	_animate()


func _animate() -> void:
	if anim == null:
		return
	var speed := Vector2(velocity.x, velocity.z).length()
	if dodge_t > 0.0:
		_play("Roll", 1.5)
	elif attack_t > 0.0:
		_play("Pistol_Shoot", 1.6)
	elif speed > 0.2:
		_play("Jog_Fwd", speed / JOG_NATURAL_SPEED)
	else:
		_play("Idle", 1.0)


func _play(anim_name: String, speed_scale: float) -> void:
	if not anim.has_animation(anim_name):
		return
	if anim.current_animation != anim_name:
		anim.play(anim_name, 0.12)
	anim.speed_scale = speed_scale


func dodge() -> void:
	if dodge_cd > 0.0 or dead:
		return
	dodge_t = dodge_time * 2.0
	dodge_cd = dodge_cooldown
	dodge_dir = facing
	if anim and anim.has_animation("Roll"):
		anim.play("Roll", 0.05)


func attack() -> void:
	if attack_t > 0.0 or dead:
		return
	attack_t = attack_time
	var target := _nearest_enemy(Formulas.m(720.0))
	if target:
		var to := target.global_position - global_position
		to.y = 0.0
		facing = to.normalized()
	if anim and anim.has_animation("Pistol_Shoot"):
		anim.play("Pistol_Shoot", 0.05)
	shot_fired.emit(global_position + Vector3.UP * 1.4 + facing * 0.5, facing)


func _nearest_enemy(max_dist: float) -> Node3D:
	var best: Node3D = null
	var bd := max_dist
	for e in get_tree().get_nodes_in_group("enemies"):
		var d: float = global_position.distance_to((e as Node3D).global_position)
		if d < bd:
			bd = d
			best = e
	return best


func _ensure_input_actions() -> void:
	var keys := {
		"move_left": [KEY_A, KEY_LEFT], "move_right": [KEY_D, KEY_RIGHT],
		"move_up": [KEY_W, KEY_UP], "move_down": [KEY_S, KEY_DOWN],
		"dodge": [KEY_SPACE], "attack": [KEY_J, KEY_ENTER], "cutscene": [KEY_C],
	}
	for action in keys:
		if InputMap.has_action(action):
			continue
		InputMap.add_action(action)
		for k in keys[action]:
			var ev := InputEventKey.new()
			ev.physical_keycode = k
			InputMap.action_add_event(action, ev)
