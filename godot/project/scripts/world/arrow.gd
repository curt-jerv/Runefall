class_name Arrow
extends Node3D
## A basic arrow: flies straight, hits the first enemy it touches, lives 1.9 s (as in the HTML game).

var dir := Vector3.FORWARD
var speed := 13.0          ## HTML 480 units/s
var damage := 10.0
var life := 1.9


func _ready() -> void:
	var mesh := MeshInstance3D.new()
	var shaft := CylinderMesh.new()
	shaft.top_radius = 0.02
	shaft.bottom_radius = 0.02
	shaft.height = 0.7
	mesh.mesh = shaft
	mesh.rotation_degrees = Vector3(90, 0, 0)
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color("#cbb98c")
	mat.emission_enabled = true
	mat.emission = Color("#ffb35a") * 0.3
	shaft.material = mat
	add_child(mesh)
	look_at(global_position + dir, Vector3.UP)


func _physics_process(delta: float) -> void:
	life -= delta
	if life <= 0.0:
		queue_free()
		return
	global_position += dir * speed * delta
	for e in get_tree().get_nodes_in_group("enemies"):
		var flat: Vector3 = (e as Node3D).global_position - global_position
		flat.y = 0.0
		if flat.length() < 0.6:
			e.take_hit(damage)
			queue_free()
			return
