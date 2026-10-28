# Runefall — Godot rebuild

Runefall rebuilt as a full 3D isometric action RPG in **Godot 4.7** (GDScript, Android first), using the finished HTML game as the design reference.

| Read this | For |
|---|---|
| [docs/PLAN.md](docs/PLAN.md) | the rebuild plan, decisions and phases |
| [docs/ART_BIBLE.md](docs/ART_BIBLE.md) | the look: north star, palette, light, models, the style prompt |
| [docs/DESIGN.md](docs/DESIGN.md) | the game's rules in plain words |
| [docs/ASSET_LIST.md](docs/ASSET_LIST.md) | every model and animation and where it comes from |
| [docs/CUTSCENES.md](docs/CUTSCENES.md) | the camera moments |
| [docs/LAPTOP_SETUP.md](docs/LAPTOP_SETUP.md) | installing everything on the laptop |
| [docs/GODOT_REFERENCE.md](docs/GODOT_REFERENCE.md) | how the project is built (for Claude and code readers) |
| [LICENSES.md](LICENSES.md) | every outside asset and its licence |

- `project/` — the Godot project (open `project/project.godot`). Right now: the Phase 1 test ground with the Ranger, the fixed camera, a tower cutscene, training dummies, touch controls.
- `data/` — the HTML game's data as JSON (also copied into `project/data/`). Re-export with `tools/export-data.js`.
- `tools/` — the data exporter and the Blender scripts (`blender/build.py` assembles the Ranger, `export_godot.py` writes the `.glb` files, `render.py`/`pack.py` made the 2D sprite test).
