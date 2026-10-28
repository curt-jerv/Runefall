class_name Formulas
## Rules ported 1:1 from the HTML game (www/js). Checked against data/progression.json by tests/run_tests.gd.

## HTML world units per Godot metre (a 1.8 m hero = ~66 units tall on the old screen).
const WORLD_UNITS_PER_METRE := 36.9
const LEVEL_CAP := 80


## Experience needed to go from level l to l+1 (combat/statuses.js xpForLevel).
static func xp_for_level(l: int) -> int:
	var base: float
	if l <= 28:
		base = 92.0 * pow(1.20, l - 1)
	else:
		base = 92.0 * pow(1.20, 27) * pow(1.09, l - 28)
	var a := 1.1 if (l >= 3 and l <= 14) else 1.0
	var b := 1.11 if l >= 10 else 1.0
	return int(floor(base * a * b))


## What a same-level hero is expected to have: life and a typical weapon hit (skills/tree.js).
static func par_life(l: float) -> float:
	return 120.0 + 15.0 * l


static func par_hit(l: float) -> float:
	return 15.0 + 3.7 * l


## A standard monster's hit and life at monster level ml. Each type is a fixed size relative to these.
static func monster_std_damage(ml: float) -> float:
	return 0.1125 * par_life(maxf(1.0, ml))


static func monster_std_life(ml: float) -> float:
	var l := maxf(1.0, ml)
	var late := 1.25 if l >= 40.0 else 1.0
	return par_hit(l) * (4.5 + 0.1 * l) / 0.7 * late


## The level monsters spawn at: the zone's level, pulled up a little by an over-levelled hero.
static func monster_level(player_level: int, zone_level: int) -> int:
	var d := maxi(1, zone_level)
	if player_level <= d:
		return d
	var full := 2 if d < 10 else 5
	var over := player_level - d
	return int(round(d + mini(over, full) * 0.6 + minf(1.0, maxf(0.0, (over - full) * 0.1))))


## Strength / Dexterity / Intelligence by level: the class's main one 20 +3 a level, the others 10 +1.
const CLASS_MAIN_ATTR := {"warrior": "strength", "ranger": "dexterity", "mystic": "intelligence"}


static func attr_main_at_level(l: int) -> int:
	return 20 + 3 * (maxi(1, l) - 1)


static func attr_base(cls: String, key: String, l: int) -> int:
	if CLASS_MAIN_ATTR.get(cls, "") == key:
		return attr_main_at_level(l)
	return 10 + (maxi(1, l) - 1)


## Life = 100 + 8 per level + 2 per Strength (before gear % bonuses).
static func base_life(level: int, strength: int) -> float:
	return 100.0 + 8.0 * level + 2.0 * strength


## Monsters from lower areas miss more once you are 5+ levels above them (items/items.js hitLevelFactor).
static func hit_level_factor(player_level: int, ml: int) -> float:
	var pl := maxi(1, player_level)
	var m := maxi(1, ml)
	if pl - m <= 5:
		return 1.0
	return 2.0 * m / (m + pl - 5)


## Dexterity's evasion chance in %, tapering past 8% (ui/bag.js dexEvasionTapered).
static func dex_evasion_pct(dex: float, level: int) -> float:
	var d := maxf(0.0, dex)
	var raw := minf(45.0, round(1000.0 * d / (d + 25.0 * maxi(1, level) + 100.0)) / 10.0)
	var tapered := raw if raw <= 8.0 else 8.0 + (raw - 8.0) * 0.4
	return round(10.0 * minf(15.0, tapered)) / 10.0


## Convert an HTML distance or speed (world units) to metres.
static func m(world_units: float) -> float:
	return world_units / WORLD_UNITS_PER_METRE
