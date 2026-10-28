extends SceneTree
## Headless checks: the ported formulas must match the numbers exported from the HTML game.
##   godot --headless --path godot/project --script res://tests/run_tests.gd

var fails := 0
var passes := 0


func _initialize() -> void:
	var f := FileAccess.open("res://data/progression.json", FileAccess.READ)
	var prog: Dictionary = JSON.parse_string(f.get_as_text())
	_check_list("xp_for_level", prog["xp_for_level"], func(l: int) -> float: return Formulas.xp_for_level(l), 0.0)
	_check_list("par_life", prog["par_life"], func(l: int) -> float: return Formulas.par_life(l), 0.0)
	_check_list("par_hit", prog["par_hit"], func(l: int) -> float: return Formulas.par_hit(l), 0.051)
	_check_list("monster_std_life", prog["monster_std_life"], func(l: int) -> float: return round(Formulas.monster_std_life(l)), 0.0)
	_check_list("monster_std_damage", prog["monster_std_damage"], func(l: int) -> float: return Formulas.monster_std_damage(l), 0.051)
	_check_list("attr_main_at_level", prog["attr_main_at_level"], func(l: int) -> float: return Formulas.attr_main_at_level(l), 0.0)
	# a few spot checks of rules that have no exported table
	_expect("monster_level under-levelled", Formulas.monster_level(5, 10), 10)
	_expect("monster_level over-levelled cap", Formulas.monster_level(80, 10), 14)
	_expect("hit_level_factor in grace", Formulas.hit_level_factor(15, 10), 1.0)
	_expect("dex evasion caps at 15", Formulas.dex_evasion_pct(5000, 1), 15.0)
	_expect("base life Lv10 Str47", Formulas.base_life(10, 47), 274.0)
	print("TESTS passed=%d failed=%d" % [passes, fails])
	quit(1 if fails > 0 else 0)


func _check_list(label: String, expected: Array, fn: Callable, tol: float) -> void:
	var bad := 0
	for i in expected.size():
		var got: float = fn.call(i + 1)
		if absf(got - float(expected[i])) > tol:
			if bad < 3:
				print("  FAIL %s level %d: got %s expected %s" % [label, i + 1, got, expected[i]])
			bad += 1
	if bad == 0:
		passes += 1
		print("  ok   %s (%d levels)" % [label, expected.size()])
	else:
		fails += 1


func _expect(label: String, got: Variant, want: Variant) -> void:
	if (typeof(got) == TYPE_FLOAT or typeof(want) == TYPE_FLOAT) and absf(float(got) - float(want)) < 0.001 or got == want:
		passes += 1
		print("  ok   " + label)
	else:
		fails += 1
		print("  FAIL %s: got %s want %s" % [label, got, want])
