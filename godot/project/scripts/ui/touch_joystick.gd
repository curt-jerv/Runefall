class_name TouchJoystick
extends Control
## Left-thumb joystick. Touch anywhere in this area; the knob follows your thumb. value = screen right/down, length 0..1.

signal moved(value: Vector2)

@export var radius := 90.0
var value := Vector2.ZERO
var _finger := -1
var _origin := Vector2.ZERO
var _knob := Vector2.ZERO


func _gui_input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		if event.pressed and _finger == -1:
			_finger = event.index
			_origin = event.position
			_knob = _origin
		elif not event.pressed and event.index == _finger:
			_finger = -1
			value = Vector2.ZERO
			moved.emit(value)
		queue_redraw()
	elif event is InputEventScreenDrag and event.index == _finger:
		var off: Vector2 = event.position - _origin
		if off.length() > radius:
			off = off.normalized() * radius
		_knob = _origin + off
		value = off / radius
		moved.emit(value)
		queue_redraw()


func _draw() -> void:
	if _finger == -1:
		return
	draw_circle(_origin, radius, Color(0.08, 0.06, 0.05, 0.45))
	draw_arc(_origin, radius, 0, TAU, 48, Color("#c9a24a"), 3.0)
	draw_circle(_knob, radius * 0.38, Color("#c9a24a", 0.8))
