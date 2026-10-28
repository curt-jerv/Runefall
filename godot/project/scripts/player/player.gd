class_name Player
extends CharacterBody3D
## The hero: moves with the on-screen joystick (or WASD/arrows), shoots, rolls, plays the Quaternius animations.
## Speeds are the HTML game's numbers converted to metres (Formulas.m): 170 units/s -> ~4.6 m/s.

signal shot_fired(from: Vector3, dir: Vector3)
signal life_changed(life: float, max_life: float)
signal player_died
signal player_respawned

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
var level := 1
var defense := 0.0
var max_life := 100.0
var life := 100.0
var spawn_point := Vector3.ZERO
var _flash_t := 0.0
var _sfx: Dictionary = {}
var bow: Node3D


func _ready() -> void:
	add_to_group("player")
	cam = get_node_or_null(camera_path)
	spawn_point = global_position
	# life = 100 + 8 per level + 2 per Strength (a Ranger's Strength is the off-stat: 10 +1 a level)
	max_life = Formulas.base_life(level, Formulas.attr_base("ranger", "strength", level))
	life = max_life
	for k in ["bow_shot1", "lf_hit1", "lf_defeat1", "respawn_toll"]:
		var sp := AudioStreamPlayer.new()
		sp.stream = load("res://assets/audio/%s.ogg" % k)
		add_child(sp)
		_sfx[k] = sp
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
	bow = BOW.instantiate()
	bow.position = Vector3(0.0, 0.06, 0.02)
	att.add_child(bow)


func _physics_process(delta: float) -> void:
	if dead:
		return
	_flash_t = maxf(0.0, _flash_t - delta)
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


## The bow stays in the fist (it rides the hand bone) but is kept upright in the world: limbs up, the curved front
## facing where the hero faces, the string toward the body -- whatever angle the hand has in the animation.
func _process(_delta: float) -> void:
	if bow == null:
		return
	var fwd := Vector3(facing.x, 0.0, facing.z).normalized()
	if fwd.length() < 0.1:
		fwd = Vector3(0, 0, 1)
	var up := Vector3.UP
	if attack_t <= 0.0 and dodge_t <= 0.0:
		up = (Vector3.UP + fwd * 0.18).normalized()   # carried: tipped slightly forward, like a bow hanging from a relaxed hand
	# the bow's limbs run along its local Y (Blender's Z became glTF's Y) and its belly faces local +X
	var z := fwd.cross(up).normalized()
	bow.global_basis = Basis(up.cross(z), up, z).scaled(bow.global_basis.get_scale())


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
	_sound("bow_shot1")


func _sound(k: String) -> void:
	if _sfx.has(k):
		_sfx[k].play()


## A monster's hit. Death plays the fall, waits, then brings you back at the spawn point with the bell toll.
func take_damage(amount: float, _from: Node = null) -> void:
	if dead or dodge_t > 0.0:
		return
	life = maxf(0.0, life - amount)
	life_changed.emit(life, max_life)
	_flash_t = 0.25
	_sound("lf_hit1")
	_float_text(str(int(amount)), Color("#ff5a4a"))
	if life <= 0.0:
		_die()


func show_evade() -> void:
	_float_text("Evaded!", Color("#c8d0d8"))


func _die() -> void:
	dead = true
	velocity = Vector3.ZERO
	anim.speed_scale = 1.0
	anim.play("Death01", 0.1)
	_sound("lf_defeat1")
	player_died.emit()
	await get_tree().create_timer(2.6).timeout
	global_position = spawn_point
	life = max_life
	dead = false
	anim.play("Idle", 0.2)
	life_changed.emit(life, max_life)
	_sound("respawn_toll")
	player_respawned.emit()


func _float_text(text: String, col: Color) -> void:
	var num := Label3D.new()
	num.text = text
	num.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	num.modulate = col
	num.font_size = 56
	num.outline_size = 10
	num.no_depth_test = true
	num.position = Vector3(randf_range(-0.3, 0.3), 2.1, 0)
	add_child(num)
	var tw := create_tween()
	tw.tween_property(num, "position:y", 3.0, 0.8)
	tw.parallel().tween_property(num, "modulate:a", 0.0, 0.8)
	tw.tween_callback(num.queue_free)


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
