# Godot Reference — how the Runefall project is built

For Claude and anyone reading the code. Plain conventions; keep them as the project grows.

## Engine and settings
- **Godot 4.7.2 stable**, GDScript only, **Mobile** renderer (Vulkan) on phones; `gl_compatibility` is used for automated screenshots.
- Landscape and portrait both allowed (`window/handheld/orientation = sensor`); UI anchors must work in both.
- Touch input emulates the mouse in the editor (`emulate_touch_from_mouse`).

## Folders (`project/`)
| Folder | What |
|---|---|
| `scenes/` | `.tscn` scenes (main, zones, UI screens) |
| `scripts/autoload/` | always-loaded singletons: `GameData` (the JSON data) |
| `scripts/core/` | rules ported from the HTML game (`formulas.gd`: XP, monster curves, attributes, hit chance) |
| `scripts/camera/` | `iso_camera.gd`: the fixed play view + `play_cutscene()` |
| `scripts/player/` | the hero |
| `scripts/world/` | zones, props, projectiles, monsters |
| `scripts/ui/` | HUD and menus (`touch_joystick.gd`) |
| `assets/characters`, `assets/weapons`, `assets/environment` | glTF models (`.glb`) from Blender |
| `data/` | JSON exported from the HTML game (do not edit by hand; re-export) |
| `tests/` | headless checks (`run_tests.gd`) |

## Units and directions
- **1 unit = 1 metre.** A human is 1.8 m.
- HTML distances and speeds convert with `Formulas.m(units)` (36.9 HTML units = 1 m). Hero speed 170 → 4.6 m/s; bow range 340 → 9.2 m; arrow speed 480 → 13 m/s.
- The HTML game's world `x` is Godot `+X`, its `y` is Godot `+Z`. The camera looks from `+X+Z` toward the origin (yaw 45°), so "up the screen" is `-X-Z`, exactly like the old isometric view.
- `IsoCamera.ground_right()` / `ground_down()` turn joystick input (screen right/down) into ground directions.

## Camera
- Play view: `pitch_deg` 50, `yaw_deg` 45, `distance` 20, `fov` 30, smoothed follow. Never rotates in play.
- Cutscenes: `cam.play_cutscene([{focus, distance, pitch, yaw, time, hold}, ...])`; it glides back to the play view and emits `cutscene_finished`. `skip_cutscene()` jumps back. See CUTSCENES.md.

## Characters and animation
- Heroes and humanoid monsters share the **Quaternius universal rig** (65 bones: `root, pelvis, spine_01..03, neck_01, Head, clavicle/upperarm/lowerarm/hand_l/_r, fingers, thigh/calf/foot/ball_l/_r`). Any Universal Animation Library or retargeted Mixamo clip plays on any of them.
- Animations keep their Blender names; Godot drops a trailing `_Loop` and makes those loop (`Idle`, `Jog_Fwd`, `Walk`, `Sprint`...). One-shots: `Pistol_Shoot`, `Roll`, `Death01`, `Sword_Attack`, `Spell_Simple_Shoot`, `Hit_Chest`...
- Run speed is matched by `speed_scale = speed / 5.26` (the jog's own speed) so feet don't slide.
- Weapons are separate `.glb` files attached with `CharacterRig.attach(model, scene, "hand_r")` (bow, sword) or `hand_l` (shield).
- Models without their own animations (bandit, NPCs) get the shared library with `CharacterRig.animations(model)`: same `Hero/Skeleton3D` path, so every clip plays on every humanoid.
- The bow rides the hand bone but its rotation is set in world space each frame (limbs up, belly toward the facing, string toward the body), so it looks right in every animation. Blender's Z (up) arrives as Godot's local Y.
- Blender → Godot: `tools/blender/export_godot.py` (textures at most 1024 px, JPEG; every action exported as an NLA track so it arrives as a named animation).

## Data
- `GameData.skills / items / monsters / world / quests / audio / progression` are the JSON files as Dictionaries.
- `GameData.constant("EVASION_CAP")` reads any named number; `GameData.monster_stats("grunt", 10)` gives a monster's life, damage, speed and size.
- When a rule is ported, add a check to `tests/run_tests.gd` comparing it with the exported numbers.

## Checks to run after every change
```
godot --headless --path project --import                       # (re)import assets, shows script errors
godot --headless --path project --script res://tests/run_tests.gd   # rule checks, exit code 1 on failure
```
Screenshot (no screen needed on Linux): `xvfb-run godot --path project --fixed-fps 30 --rendering-method gl_compatibility -- --shot=out.png --frames=60 [--move=0.8,0.5] [--cutscene]`

## Performance rules (phones)
- Few real-time shadows: the sun plus at most 1–2 shadowed lights near the hero; other lights without shadows.
- Low-poly meshes, textures ≤ 1024 px, one material per prop where possible; reuse meshes (MultiMesh for grass, stones and trees).
- Fog and darkness hide the far world: keep the camera's far plane short.
- Profile on a cheap phone early (Phase 1).

## Style
- Tabs, typed GDScript (`var x: float`, `:=`), `class_name` on reusable scripts, `##` doc comments on anything non-obvious.
- No class name may clash with Godot's own classes (Godot 4.7 has a built-in `VirtualJoystick`, so ours is `TouchJoystick`).
