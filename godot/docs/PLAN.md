# Runefall in Godot — Rebuild Plan

The HTML version (v570) is finished for the **closed beta**. The Godot version is **Runefall rebuilt as a full 3D game**, using the HTML game as the design reference.

## Decisions (locked)

| Topic | Decision |
|---|---|
| Engine | **Godot 4** (4.7.2 stable at the time of writing), Mobile renderer |
| Language | **GDScript** |
| Camera | **Fixed isometric angle** in play; **short cutscenes** may rotate, tilt and zoom (look up a tower, pull back over a mountain) |
| Saves | **Fresh start**: old HTML characters are not carried over |
| Store | Same listing and app ID **`com.sol.Runefall`**, same signing keystore, higher versionCode |
| Art | Quaternius (CC0) as the base, Mixamo for extra animations, unique things modelled in Blender; checked against `ART_BIBLE.md` |
| Data | Numbers come from `data/*.json`, exported from the HTML game |

## What carries over and what is rebuilt

- **Carries over:** game design and numbers (data files), story, quest text, NPC names, all audio (music, sound effects, voice lines), fonts, the item and skill systems' rules, the Blender/Quaternius art workflow.
- **Rebuilt:** all code, all visuals (3D models instead of drawn figures), all menus.

## Phase 0 — before the laptop (now)

- [x] Art bible (`ART_BIBLE.md`)
- [x] Design rules (`DESIGN.md`)
- [x] Data export (`data/*.json` + `tools/export-data.js`)
- [x] Asset list (`ASSET_LIST.md`), cutscene list (`CUTSCENES.md`)
- [x] Laptop setup steps (`LAPTOP_SETUP.md`), Godot conventions (`GODOT_REFERENCE.md`)
- [x] Godot project skeleton (`project/`), checked to open and run without errors
- [ ] Owner: create the empty private repo **`Runefall-Godot`** on GitHub (see LAPTOP_SETUP.md) so this folder can move there
- [ ] Owner: buy **Quaternius Modular Character Outfits – Fantasy (Source, $20)** for the Warrior and Mystic outfits
- [ ] Owner (optional): Universal Animation Library Source ($15) for more run and combat animations
- [ ] Owner: a free Adobe account for **Mixamo** (bow draw, spell casts, sword combos)
- [ ] Closed beta of the HTML game; collect testers' notes into `DESIGN.md` section 13

## Phase 1 — Foundation (≈ weeks 1–3 on the laptop)

- Player hero (start with the Ranger) moving with the touch joystick on a test ground.
- Fixed isometric camera following the player; cutscene camera that can fly to a point and back.
- Animations: idle, run (speed-matched), shoot, dodge roll, death; animation blending.
- One monster type that chases and attacks; hit, damage numbers, death.
- Basic HUD: life and resource globes, Strike, three skills, Dodge, Potion.
- **Android build on your phone.** Target: steady 60 fps on a mid phone, 30 on a cheap one.
- **Milestone:** "it plays on my phone."

## Phase 2 — Core systems (≈ weeks 4–8)

- Stats and attributes (port of `recalcStats`), damage, hit chance, evasion, block, resistances, ailments.
- Items: rolling from the data tables (checked against `sample_rolls`), bag, equipment, stash, gear visible on the 3D model by tier.
- Skills: the tree screen, ranks, costs, cooldowns; first 3–4 skills per class, then the rest.
- Monster behaviour: packs, chase and give up, telegraphs, elites, threat.
- Saves (local + later cloud), settings, pause menu.
- **Milestone:** a full fight-loot-level loop in one zone.

## Phase 3 — Content (≈ weeks 9–20)

Built region by region, each one fully playable before the next:
1. Mistfall + Dark Forest + Spider Lair + Bear Cave
2. River Valley + Minotaur Cave
3. Withered Crossroads + Lighthouse Tower
4. Cursed Cemetery + Dark Crypt
5. Lakeside Ruins + Ancient Ruins + Flooded Temple + Sunken Depths
6. Black Marsh + Marsh Pool + Forgotten Tower
7. Barren Highlands + Mountain Pass + Icy Summit/Cellar + Mountain Depths
8. Frosthold Keep + Tower + Dungeon
9. Redridge + Red Crater + Raptor Lair + watchtowers + Highward
10. Cliffside + Shadow Keep + the Breach

Each region: the zone (random layout rules from the HTML game), its monsters and boss, its quests and NPC lines, music and ambience, lighting and fog, cutscenes.

## Phase 4 — Store and polish (≈ weeks 20–26)

- Google Play Billing (Cat Companion, Expanded Stash) and Play Games (sign-in, cloud save, leaderboard).
- Performance on cheap phones (quality settings, fewer lights and shadows, lower resolution).
- Achievements, tutorial hints, settings, accessibility (text size, button size).
- The balance pass.

## Phase 5 — Release

- Internal test → closed test → production, as an update to the same listing.
- **Keep the keystore file and its password safe.** Losing them means the app can never be updated.

## How we work

- Code lives in GitHub (`Runefall-Godot`). Claude writes GDScript and scene files, runs Godot (including headless tests) on the laptop, and pushes; you play-test on your phone.
- Every batch gets a version number and a short note, as in the HTML game.
- Small details (like the Thornback notes) go into `DESIGN.md` section 13 and are handled when that system or zone is built.

## Rough timeline

About **5–7 months** part-time. The first real checkpoint is the end of Phase 1: the Ranger running and fighting on your phone.
