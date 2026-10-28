extends Node3D
## Phase 1 test ground: the Ranger, the fixed isometric camera, training dummies, a campfire and a tall tower
## to try the cutscene camera on (press C or the TOWER button).
## Command line (for automated checks):  -- --shot=res://out.png [--frames=90] [--cutscene] [--move=1,0.4]

var player: Player
var cam: IsoCamera
var tower_top := Vector3(-22, 18, -26)
var _shot_path := ""
var _shot_frames := 90
var _frame := 0
var _auto_move := Vector2.ZERO
var _auto_shoot := false
var _move_frames := 999999


func _ready() -> void:
	_build_environment()
	_build_ground()
	cam = IsoCamera.new()
	add_child(cam)
	player = Player.new()
	player.name = "Player"
	add_child(player)
	player.global_position = Vector3(0, 0.1, 0)
	cam.target_path = cam.get_path_to(player)
	cam.target = player
	cam.make_current()
	player.cam = cam
	player.shot_fired.connect(_on_shot)
	var d := TrainingDummy.new()
	add_child(d)
	d.global_position = Vector3(-2.5, 0, 5.5)
	_spawn_pack()
	_build_hud()
	_read_args()


func _read_args() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--shot="):
			_shot_path = a.trim_prefix("--shot=")
		elif a.begins_with("--frames="):
			_shot_frames = int(a.trim_prefix("--frames="))
		elif a == "--cutscene":
			play_tower_cutscene.call_deferred()
		elif a == "--closeup":
			cam.distance = 4.5
			cam.pitch_deg = 18.0
			cam.cur_distance = 4.5
			cam.cur_pitch = 18.0
		elif a == "--autoshoot":
			_auto_shoot = true
		elif a.begins_with("--move-frames="):
			_move_frames = int(a.trim_prefix("--move-frames="))
		elif a.begins_with("--move="):
			var p := a.trim_prefix("--move=").split(",")
			_auto_move = Vector2(float(p[0]), float(p[1]))


func _process(_delta: float) -> void:
	if _auto_move != Vector2.ZERO:
		player.joystick = _auto_move if _frame < _move_frames else Vector2.ZERO
	if _auto_shoot and _frame >= _move_frames:
		player.attack()
	if Input.is_action_just_pressed("cutscene"):
		play_tower_cutscene()
	if _shot_path != "":
		_frame += 1
		if _frame == _shot_frames:
			var img := get_viewport().get_texture().get_image()
			img.save_png(_shot_path)
			print("SHOT ", _shot_path, " ", img.get_size())
			get_tree().quit()


func play_tower_cutscene() -> void:
	# tilt up the tower to its top, hold, then glide back to the play view
	cam.play_cutscene([
		{"focus": Vector3(tower_top.x, 3, tower_top.z), "distance": 26.0, "pitch": 20.0, "yaw": 30.0, "time": 1.4},
		{"focus": tower_top, "distance": 30.0, "pitch": 8.0, "yaw": 20.0, "time": 2.2, "hold": 0.8},
	])


## A bandit pack (3 bandits and a brute with a club) up the road; a new pack comes when they all fall.
var _pack_alive := 0


func _spawn_pack() -> void:
	var at := Vector3(12, 0, -12)
	var kinds := ["bandit", "bandit", "bandit", "banditbrute"]
	_pack_alive = kinds.size()
	for i in kinds.size():
		var m := Monster.new()
		m.monster_type = kinds[i]
		m.level = 1
		m.position = at + Vector3(cos(i * 1.7) * 2.2, 0.1, sin(i * 1.7) * 2.2)
		m.died.connect(_on_monster_died)
		add_child(m)


func _on_monster_died(_m: Monster) -> void:
	_pack_alive -= 1
	if _pack_alive <= 0:
		get_tree().create_timer(5.0).timeout.connect(_spawn_pack)


func _on_shot(from: Vector3, dir: Vector3) -> void:
	var a := Arrow.new()
	a.dir = dir
	# a typical same-level weapon hit (the HTML game's par hit) with a little spread
	a.damage = Formulas.par_hit(player.level) * randf_range(0.8, 1.2)
	add_child(a)
	a.global_position = from


func _build_environment() -> void:
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color("#14161a")
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color("#5d6878")
	env.ambient_light_energy = 0.55
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.fog_enabled = true
	env.fog_light_color = Color("#2a2e34")
	env.fog_density = 0.03
	env.adjustment_enabled = true
	env.adjustment_saturation = 0.8
	env.adjustment_contrast = 1.06
	env.glow_enabled = true
	env.glow_intensity = 0.6
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	var sun := DirectionalLight3D.new()
	sun.light_color = Color("#d9c7a8")
	sun.light_energy = 0.9
	sun.shadow_enabled = true
	sun.rotation_degrees = Vector3(-50, 150, 0)   # from behind the camera's left, so shadows fall away up-screen
	add_child(sun)


func _mat(hex: String, rough := 0.9) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(hex)
	m.roughness = rough
	return m


func _build_ground() -> void:
	var ground := StaticBody3D.new()
	var mi := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(400, 400)
	plane.material = _mat("#4a3f2f")
	mi.mesh = plane
	ground.add_child(mi)
	var col := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(400, 1, 400)
	col.shape = box
	col.position.y = -0.5
	ground.add_child(col)
	add_child(ground)
	# a dirt road and scattered stones, in the bible's palette
	var road := MeshInstance3D.new()
	var rp := PlaneMesh.new()
	rp.size = Vector2(5, 400)
	rp.material = _mat("#5b4d38")
	road.mesh = rp
	road.position.y = 0.01
	road.rotation_degrees.y = 45
	add_child(road)
	var rng := RandomNumberGenerator.new()
	rng.seed = 7
	for i in 60:
		var p := Vector3(rng.randf_range(-40, 40), 0, rng.randf_range(-40, 40))
		if p.length() < 6:
			continue
		var s := MeshInstance3D.new()
		var sm := SphereMesh.new()
		var r := rng.randf_range(0.3, 1.1)
		sm.radius = r
		sm.height = r * 1.3
		sm.radial_segments = 7
		sm.rings = 4
		sm.material = _mat("#5e5c57" if i % 3 else "#4a4a48")
		s.mesh = sm
		s.position = p
		s.rotation_degrees = Vector3(rng.randf_range(-20, 20), rng.randf_range(0, 360), 0)
		add_child(s)
	# campfire: the warm light the bible asks for
	var fire := OmniLight3D.new()
	fire.light_color = Color("#ff8a3d")
	fire.light_energy = 2.2
	fire.omni_range = 6.5
	fire.shadow_enabled = true
	fire.position = Vector3(-4, 0.8, 3)
	add_child(fire)
	var logs := MeshInstance3D.new()
	var lm := CylinderMesh.new()
	lm.top_radius = 0.5
	lm.bottom_radius = 0.6
	lm.height = 0.25
	lm.material = _mat("#3a2c20")
	logs.mesh = lm
	logs.position = Vector3(-4, 0.12, 3)
	add_child(logs)
	var flame := MeshInstance3D.new()
	var fm := SphereMesh.new()
	fm.radius = 0.35
	fm.height = 0.9
	var fmat := StandardMaterial3D.new()
	fmat.albedo_color = Color("#ff8a3d")
	fmat.emission_enabled = true
	fmat.emission = Color("#ff8a3d")
	fmat.emission_energy_multiplier = 3.0
	fm.material = fmat
	flame.mesh = fm
	flame.position = Vector3(-4, 0.6, 3)
	add_child(flame)
	# the tower (a stand-in for the Lighthouse) for the cutscene test
	var tower := MeshInstance3D.new()
	var tm := CylinderMesh.new()
	tm.top_radius = 2.4
	tm.bottom_radius = 3.4
	tm.height = 18.0
	tm.radial_segments = 10
	tm.material = _mat("#4a4a48")
	tower.mesh = tm
	tower.position = Vector3(tower_top.x, 9, tower_top.z)
	add_child(tower)
	var beacon := OmniLight3D.new()
	beacon.light_color = Color("#ffd27a")
	beacon.light_energy = 4.0
	beacon.omni_range = 14.0
	beacon.position = tower_top + Vector3.UP * 0.8
	add_child(beacon)


func _build_hud() -> void:
	var hud := CanvasLayer.new()
	add_child(hud)
	var life := Globe.new()
	life.position = Vector2(20, 20)
	life.size = Vector2(92, 92)
	life.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hud.add_child(life)
	var upd := func(v: float, mx: float) -> void: life.set_value(v / mx, str(int(ceil(v))))
	player.life_changed.connect(upd)
	upd.call(player.life, player.max_life)
	var joy := TouchJoystick.new()
	joy.set_anchors_preset(Control.PRESET_LEFT_WIDE)
	joy.anchor_right = 0.45
	joy.mouse_filter = Control.MOUSE_FILTER_STOP
	joy.moved.connect(func(v: Vector2) -> void: player.joystick = v)
	hud.add_child(joy)
	var strike := _hud_button("STRIKE", Vector2(-170, -170), 130)
	strike.pressed.connect(player.attack)
	hud.add_child(strike)
	var roll := _hud_button("DODGE", Vector2(-300, -110), 80)
	roll.pressed.connect(player.dodge)
	hud.add_child(roll)
	var tw := _hud_button("TOWER", Vector2(-120, 30), 80)
	tw.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	tw.position = Vector2(-120, 30)
	tw.pressed.connect(play_tower_cutscene)
	hud.add_child(tw)


func _hud_button(text: String, offset: Vector2, size: float) -> Button:
	var b := Button.new()
	b.text = text
	b.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	b.position = offset
	b.size = Vector2(size, size)
	b.custom_minimum_size = Vector2(size, size)
	b.focus_mode = Control.FOCUS_NONE
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(0.1, 0.08, 0.06, 0.75)
	sb.border_color = Color("#c9a24a")
	sb.set_border_width_all(3)
	sb.set_corner_radius_all(int(size / 2))
	b.add_theme_stylebox_override("normal", sb)
	b.add_theme_stylebox_override("hover", sb)
	b.add_theme_stylebox_override("pressed", sb)
	b.add_theme_color_override("font_color", Color("#e8d8b0"))
	return b
