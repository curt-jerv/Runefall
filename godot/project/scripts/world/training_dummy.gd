class_name TrainingDummy
extends StaticBody3D
## A target to shoot at. Its life comes from the exported monster data (a level-10 "grunt"), so the numbers match the HTML game.

@export var monster_type := "grunt"
@export var level := 10

var max_life := 100.0
var life := 100.0
var bar: Label3D


func _ready() -> void:
	add_to_group("enemies")
	var stats := GameData.monster_stats(monster_type, level)
	max_life = float(stats.get("life", 100.0))
	life = max_life
	var shape := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = 0.35
	cyl.height = 1.8
	shape.shape = cyl
	shape.position.y = 0.9
	add_child(shape)
	var post := MeshInstance3D.new()
	var m := CylinderMesh.new()
	m.top_radius = 0.18
	m.bottom_radius = 0.25
	m.height = 1.7
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#5a4632")
	m.material = mat
	post.mesh = m
	post.position.y = 0.85
	add_child(post)
	var straw := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.32
	sm.height = 0.7
	var smat := StandardMaterial3D.new()
	smat.albedo_color = Color("#6b6440")
	sm.material = smat
	straw.mesh = sm
	straw.position.y = 1.45
	add_child(straw)
	bar = Label3D.new()
	bar.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	bar.position.y = 2.3
	bar.font_size = 48
	bar.outline_size = 8
	add_child(bar)
	_update_bar()


func take_hit(dmg: float) -> void:
	life = maxf(0.0, life - dmg)
	_update_bar()
	var num := Label3D.new()
	num.text = str(int(dmg))
	num.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	num.modulate = Color("#ffd27a")
	num.font_size = 64
	num.outline_size = 10
	num.position = Vector3(randf_range(-0.3, 0.3), 2.0, 0)
	add_child(num)
	var tw := create_tween()
	tw.tween_property(num, "position:y", 2.9, 0.7)
	tw.parallel().tween_property(num, "modulate:a", 0.0, 0.7)
	tw.tween_callback(num.queue_free)
	if life <= 0.0:
		life = max_life   # a dummy never dies; it just refills
		_update_bar()


func _update_bar() -> void:
	bar.text = "%s  %d / %d" % [monster_type.capitalize(), int(life), int(max_life)]
