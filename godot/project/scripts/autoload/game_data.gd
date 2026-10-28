extends Node
## The game's design data, exported from the HTML version (godot/tools/export-data.js).
## Every number the rules use comes from here: GameData.skills["trees"], GameData.constant("EVASION_CAP") ...

var progression: Dictionary = {}
var skills: Dictionary = {}
var items: Dictionary = {}
var monsters: Dictionary = {}
var world: Dictionary = {}
var quests: Dictionary = {}
var audio: Dictionary = {}


func _ready() -> void:
	progression = _load("progression")
	skills = _load("skills")
	items = _load("items")
	monsters = _load("monsters")
	world = _load("world")
	quests = _load("quests")
	audio = _load("audio")


func _load(file_name: String) -> Dictionary:
	var path := "res://data/%s.json" % file_name
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		push_error("GameData: cannot open " + path)
		return {}
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if parsed is Dictionary:
		return parsed
	push_error("GameData: bad JSON in " + path)
	return {}


## A named number from the HTML game (EVASION_CAP, LIFE_PER_LEVEL, ...).
func constant(constant_name: String, fallback: float = 0.0) -> float:
	return float(progression.get("constants", {}).get(constant_name, fallback))


## One monster type's stats at the nearest exported level (10, 30 or 60).
func monster_stats(type: String, level: int) -> Dictionary:
	var t: Dictionary = monsters.get("types", {}).get(type, {})
	var by_level: Dictionary = t.get("by_level", {})
	var best := ""
	for k in by_level.keys():
		if best == "" or absi(int(k) - level) < absi(int(best) - level):
			best = k
	return by_level.get(best, {})
