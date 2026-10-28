class_name IsoCamera
extends Camera3D
## The fixed isometric play camera, plus short cutscene moves (look up a tower, pull back over a mountain).
## Play view: always the same pitch, yaw and distance, smoothly following the target.
## Cutscene: play_cutscene([{focus, distance, pitch, yaw, time, hold}, ...]) then it glides back to the play view.

signal cutscene_finished

@export var target_path: NodePath
@export var pitch_deg := 50.0        ## how far the camera looks down (degrees)
@export var yaw_deg := 45.0          ## turned 45 degrees, so the world's grid runs diagonally like the HTML game
@export var distance := 20.0         ## metres from the focus point
@export var follow_speed := 8.0      ## higher = snappier follow
@export var focus_height := 1.0      ## look at the hero's chest, not the feet

var target: Node3D
var in_cutscene := false
# the live rig values; cutscenes tween these
var focus := Vector3.ZERO
var cur_pitch := 50.0
var cur_yaw := 45.0
var cur_distance := 20.0


func _ready() -> void:
	fov = 30.0
	target = get_node_or_null(target_path)
	cur_pitch = pitch_deg
	cur_yaw = yaw_deg
	cur_distance = distance
	if target:
		focus = _target_point()
	_apply()


func _process(delta: float) -> void:
	if in_cutscene:
		_apply()   # the tween moves focus / pitch / yaw / distance; keep the camera on them
		return
	if target == null:
		return
	focus = focus.lerp(_target_point(), 1.0 - exp(-follow_speed * delta))
	_apply()


func _target_point() -> Vector3:
	return target.global_position + Vector3.UP * focus_height


## Where the camera sits relative to what it looks at.
static func rig_offset(pitch: float, yaw: float, dist: float) -> Vector3:
	var p := deg_to_rad(pitch)
	var y := deg_to_rad(yaw)
	return Vector3(sin(y) * cos(p), sin(p), cos(y) * cos(p)) * dist


func _apply() -> void:
	global_position = focus + rig_offset(cur_pitch, cur_yaw, cur_distance)
	look_at(focus, Vector3.UP)


## The screen's right and down directions on the ground, for turning joystick input into world movement.
func ground_right() -> Vector3:
	var y := deg_to_rad(cur_yaw)
	return Vector3(cos(y), 0.0, -sin(y))


func ground_down() -> Vector3:
	var y := deg_to_rad(cur_yaw)
	return Vector3(sin(y), 0.0, cos(y))


## shots: Array of Dictionaries {focus: Vector3, distance: float, pitch: float, yaw: float, time: float, hold: float}.
## Missing keys keep the previous value. Finishes by gliding back to the play view.
func play_cutscene(shots: Array, return_time := 1.2) -> void:
	if in_cutscene:
		return
	in_cutscene = true
	var tw := create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	var f := focus
	var p := cur_pitch
	var yw := cur_yaw
	var d := cur_distance
	for shot in shots:
		f = shot.get("focus", f)
		p = shot.get("pitch", p)
		yw = shot.get("yaw", yw)
		d = shot.get("distance", d)
		var t: float = shot.get("time", 1.5)
		tw.tween_property(self, "focus", f, t)
		tw.parallel().tween_property(self, "cur_pitch", p, t)
		tw.parallel().tween_property(self, "cur_yaw", yw, t)
		tw.parallel().tween_property(self, "cur_distance", d, t)
		if shot.get("hold", 0.0) > 0.0:
			tw.tween_interval(shot["hold"])
	var back := _target_point() if target else focus
	tw.tween_property(self, "focus", back, return_time)
	tw.parallel().tween_property(self, "cur_pitch", pitch_deg, return_time)
	tw.parallel().tween_property(self, "cur_yaw", yaw_deg, return_time)
	tw.parallel().tween_property(self, "cur_distance", distance, return_time)
	tw.finished.connect(_end_cutscene)


func _end_cutscene() -> void:
	in_cutscene = false
	cutscene_finished.emit()


func skip_cutscene() -> void:
	if not in_cutscene:
		return
	for tw in get_tree().get_processed_tweens():
		tw.kill()
	cur_pitch = pitch_deg
	cur_yaw = yaw_deg
	cur_distance = distance
	if target:
		focus = _target_point()
	_apply()
	_end_cutscene()
