class_name Globe
extends Control
## A Diablo-style orb: dark glass filled from the bottom by 'value' (0..1), with a number in the middle.

@export var fill_color := Color("#a8262a")
@export var radius := 46.0
var value := 1.0
var text := ""


func set_value(v: float, label: String) -> void:
	value = clampf(v, 0.0, 1.0)
	text = label
	queue_redraw()


func _draw() -> void:
	var c := Vector2(radius, radius)
	draw_circle(c, radius, Color(0.04, 0.03, 0.03, 0.85))
	if value > 0.0:
		# the liquid: every point of the circle below the fill line
		var top := c.y + radius - 2.0 * radius * value
		var pts := PackedVector2Array()
		for i in 65:
			var a := TAU * i / 64.0
			var p := c + Vector2(cos(a), sin(a)) * (radius - 3.0)
			pts.append(Vector2(p.x, maxf(p.y, top)))
		draw_colored_polygon(pts, fill_color)
		draw_circle(c + Vector2(-radius * 0.3, -radius * 0.35), radius * 0.22, Color(1, 1, 1, 0.08))
	draw_arc(c, radius, 0, TAU, 64, Color("#c9a24a"), 3.0)
	if text != "":
		var f := get_theme_default_font()
		var sz := f.get_string_size(text, HORIZONTAL_ALIGNMENT_CENTER, -1, 18)
		draw_string_outline(f, c - Vector2(sz.x / 2, -6), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, 5, Color.BLACK)
		draw_string(f, c - Vector2(sz.x / 2, -6), text, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color("#f0e6d0"))
