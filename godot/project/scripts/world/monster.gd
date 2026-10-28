class_name Monster
extends CharacterBody3D
## A melee monster on the shared humanoid rig: waits, notices you, chases, winds up a swing, hits (or misses by the
## Defense roll), and dies. Life, damage, speed and attack time come from the HTML game's data for its type and level.

signal died(monster: Monster)

const BANDIT: PackedScene = preload("res://assets/characters/bandit/bandit.glb")
const SWORD: PackedScene = preload("res://assets/weapons/sword_t1.glb")
const CLUB: PackedScene = preload("res://assets/weapons/club_t1.glb")

@export var monster_type := "bandit"
@export var level := 10
@export var aggro_range := 11.0
@export var reach := 1.6
@export var windup := 0.45          ## the visible swing before the hit lands

var max_life := 100.0
var life := 100.0
var damage := 10.0
var speed := 2.5
var attack_cd := 1.0
var state := "idle"                 ## idle / chase / windup / recover / dead
var state_t := 0.0
var target: Node3D
var model: Node3D
var anim: AnimationPlayer
var bar_fill: MeshInstance3D
var home := Vector3.ZERO


func _ready() -> void:
	add_to_group("enemies")
	home = global_position
	var s := GameData.monster_stats(monster_type, level)
	max_life = float(s.get("life", 200.0))
	life = max_life
	damage = float(s.get("damage", 20.0))
	speed = Formulas.m(float(s.get("speed", 90.0)))
	attack_cd = float(s.get("attack_cd", 1.0))
	var shape := CollisionShape3D.new()
	shape.name = "Shape"
	var cap := CapsuleShape3D.new()
	cap.radius = 0.35
	cap.height = 1.8
	shape.shape = cap
	shape.position.y = 0.9
	add_child(shape)
	model = BANDIT.instantiate()
	add_child(model)
	var brute := monster_type.ends_with("brute")
	if brute:
		model.scale = Vector3.ONE * 1.18
	anim = CharacterRig.animations(model)
	CharacterRig.attach(model, CLUB if brute else SWORD, "hand_r", Vector3(0, 0.05, 0.02), Vector3(0, 0, -90))
	anim.play("Sword_Idle" if anim.has_animation("Sword_Idle") else "Idle")
	_make_bar()


func _physics_process(delta: float) -> void:
	if state == "dead":
		return
	state_t -= delta
	if target == null:
		target = get_tree().get_first_node_in_group("player")
	var to := Vector3.ZERO
	var dist := 999.0
	if target and not target.get("dead"):
		to = target.global_position - global_position
		to.y = 0.0
		dist = to.length()
	match state:
		"idle":
			if dist < aggro_range:
				state = "chase"
		"chase":
			if dist > aggro_range * 1.8:
				state = "idle"
			elif dist <= reach:
				state = "windup"
				state_t = windup
				anim.play("Sword_Attack", 0.1)
		"windup":
			if state_t <= 0.0:
				_strike(dist)
				state = "recover"
				state_t = attack_cd
		"recover":
			if state_t <= 0.0:
				state = "chase"
	var v := Vector3.ZERO
	if state == "chase" and dist > reach * 0.9:
		v = to.normalized() * speed
	velocity = Vector3(v.x, velocity.y - 20.0 * delta if not is_on_floor() else 0.0, v.z)
	move_and_slide()
	if to.length() > 0.1 and state != "idle":
		model.rotation.y = lerp_angle(model.rotation.y, atan2(to.x, to.z), 1.0 - exp(-12.0 * delta))
	if state == "chase":
		_play("Jog_Fwd" if speed > 2.2 else "Walk", maxf(0.6, speed / (5.26 if speed > 2.2 else 0.97)))
	elif state == "idle" or (state == "recover" and state_t < attack_cd - 0.6):
		_play("Sword_Idle", 1.0)


func _strike(dist: float) -> void:
	if target == null or dist > reach + 0.5:
		return
	var p_level: int = target.get("level") if target.get("level") != null else 1
	var p_def: float = target.get("defense") if target.get("defense") != null else 0.0
	if randf() < Formulas.player_hit_chance(p_def, p_level, level):
		target.take_damage(damage * randf_range(0.85, 1.15), self)
	elif target.has_method("show_evade"):
		target.show_evade()


func _play(n: String, speed_scale: float) -> void:
	if not anim.has_animation(n):
		n = "Idle"
	if anim.current_animation != n:
		anim.play(n, 0.15)
	anim.speed_scale = speed_scale


func take_hit(dmg: float) -> void:
	if state == "dead":
		return
	life = maxf(0.0, life - dmg)
	if state == "idle":
		state = "chase"
	_float_number(str(int(dmg)), Color("#ffd27a"))
	bar_fill.scale.x = maxf(0.001, life / max_life)
	bar_fill.position.x = -0.45 * (1.0 - life / max_life)
	if life <= 0.0:
		_die()


func _die() -> void:
	state = "dead"
	remove_from_group("enemies")
	anim.speed_scale = 1.0
	anim.play("Death01", 0.1)
	$Shape.set_deferred("disabled", true)
	bar_fill.get_parent().visible = false
	died.emit(self)
	var tw := create_tween()
	tw.tween_interval(3.0)
	tw.tween_property(self, "position:y", -1.5, 1.5)
	tw.tween_callback(queue_free)


func _make_bar() -> void:
	var holder := Node3D.new()
	holder.position.y = 2.25
	add_child(holder)
	var bg := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.95, 0.1)
	var m := StandardMaterial3D.new()
	m.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = Color(0.05, 0.03, 0.03)
	m.no_depth_test = true
	q.material = m
	bg.mesh = q
	holder.add_child(bg)
	bar_fill = MeshInstance3D.new()
	var q2 := QuadMesh.new()
	q2.size = Vector2(0.9, 0.06)
	var m2 := m.duplicate()
	m2.albedo_color = Color("#a8262a")
	m2.render_priority = 1
	q2.material = m2
	bar_fill.mesh = q2
	holder.add_child(bar_fill)


func _float_number(text: String, col: Color) -> void:
	var num := Label3D.new()
	num.text = text
	num.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	num.modulate = col
	num.font_size = 64
	num.outline_size = 10
	num.no_depth_test = true
	num.position = Vector3(randf_range(-0.3, 0.3), 2.0, 0)
	add_child(num)
	var tw := create_tween()
	tw.tween_property(num, "position:y", 2.9, 0.7)
	tw.parallel().tween_property(num, "modulate:a", 0.0, 0.7)
	tw.tween_callback(num.queue_free)
