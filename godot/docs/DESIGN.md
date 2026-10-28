# Runefall — Game Design (rules in plain words)

This is how Runefall plays, taken from the finished HTML version (v570), so nothing is lost in the Godot rebuild.
**The exact numbers live in `godot/data/*.json`**, exported straight from the running HTML game (`tools/export-data.js`).
This page explains what those numbers mean. When this page and the data disagree, the data wins.

---

## 1. The game in one paragraph

An isometric action RPG for phones in the mood of Diablo 2. You pick a **Warrior, Ranger or Mystic**, start in the town of **Mistfall**, and push outward through about 30 zones (levels 1 to 60+). You fight packs of monsters, elites and bosses, pick up randomly rolled gear, spend skill points in three trees per class, and follow a chain of quests about failing runestones. The endgame is **the Breach**: an endless descent of floors under the Shadow Keep.

---

## 2. Controls (phone first)

- **Left thumb:** virtual joystick to move.
- **Right thumb:** a big **Strike** button (basic attack), three **skill buttons** around it, **Dodge** (a roll with a short cooldown and charges), **Potion**, and **Interact** (talk, open, pick up, take stairs).
- Attacks and spells **auto-aim** at the nearest visible enemy; holding some skills (Aimed Shot) shows an aim line.
- A PC keyboard and mouse layout exists too (keybinds in Settings).
- **Fixed camera.** Cutscenes may move it (see CUTSCENES.md).

---

## 3. Classes and resources

| Class | Main attribute | Resource | Weapon | Armour material |
|---|---|---|---|---|
| **Warrior** | Strength | **Rage** (0–100; builds by hitting and being hit, decays out of combat) | swords, axes, maces (one- or two-handed), shields | plate |
| **Ranger** | Dexterity | **Stamina** (100 + more with Dexterity; regenerates; arrows refill 5) | bows | leather |
| **Mystic** | Intelligence | **Mana** (20 + 1.3 per Intelligence; regenerates over time) | staves (each staff carries one basic spell: fire, ice, lightning or soul) | robes |

Necromancer Mystics also collect **souls** (max 50) from kills, spent on Necromancer skills.

---

## 4. Attributes (no points to spend)

- **Strength, Dexterity, Intelligence** grow by themselves with level: the class's main one starts at 20 and gets +3 per level; the other two start at 10 and get +1 per level. Gear adds more ("of Might", "of Agility", "of Mind").
- **Strength:** +2 life each, +1% physical damage per 5.
- **Dexterity:** +1 Defense each, +1% bow damage per 5, a little evasion chance (full up to 8%, then tapering, max 15%).
- **Intelligence:** +1.3 mana each (Mystic), +1% elemental damage per 5.
- **Life** = 100 + 8 per level + 2 per Strength.
- **Gear requirements:** plate, swords and shields need Strength; leather and bows need Dexterity; robes and staves need Intelligence. Anyone can wear any armour if they have the stat. Weapons stay locked to their class. Gear worn without its requirement does nothing (shown in red).

---

## 5. Combat rules

- **Hit chance (monsters on you):** the monster's Attack Rating against your Defense, scaled by level. At your own level monsters hit a Mystic ~85–90%, a Ranger ~70–80%, a Warrior ~60%. Monsters from lower areas miss more once you are 5+ levels above them.
- **Evasion chance:** gear, Dexterity and skills; capped at 60%. "Evaded!" means the hit missed. The **Dodge button** is a separate thing: a quick roll that makes you briefly untouchable.
- **Block:** shields give a block chance (base 10%), raised by Defender skills.
- **Resistances:** fire, cold, lightning, poison; capped at 75%. Monsters have 25% base resistance.
- **Damage types:** physical, fire (burns over time), cold (chills = slows; cold spells can freeze), lightning (charges, stuns briefly), poison (damage over time, stacks from different sources), bleed (stacks like poison). Monsters can deal pure elemental damage or a 50/50 split (Frosthold dwarves cold, Black Marsh poison, raptors and firebats fire).
- **Gear elemental damage works like Diablo 2:** every hit applies its ailment (cold always chills, fire always burns a little).
- **Crits:** a chance and a multiplier from gear and skills.
- **Leech:** life steal from gear, capped at 50%.
- **Potions:** one button, 10 s cooldown, stacks of 5; health globes drop from some monsters.
- **Telegraphs:** big monster and boss attacks show a ground warning (ring, cone, line) first; a started attack always finishes.
- **Threat:** monsters attack whoever is closest (you or your pets) unless someone else has built a lot more threat.

---

## 6. Skills

- **Three trees per class, 10 skills per tree** (9 trees, about 90 skills; all listed in `data/skills.json` with names, positions, prerequisites and per-rank values).
  - Warrior: **Defender** (shields, blocking, slams), **Berserker** (charge, whirlwind, fury), **Templar** (holy weapon, banners, squires).
  - Ranger: **Survivalist** (traps, evasion, healing, Mirage), **Marksman** (multi, rapid, splinter, rain, aimed shots), **Hunter** (wolf and bear companions, special shots).
  - Mystic: **Djinn** (lightning and wind, Storm Ward, Hurricane), **Elementalist** (fire and ice, Mana Shield, Meteor, Blizzard), **Necromancer** (souls, skeletons, Plague).
- **Tree rows unlock by level:** 1, 7, 14, 21, then the bottom (capstone) row at 32.
- Ranks 1–10 (gear can push some higher). One skill point per level (plus tomes).
- **Costs:** mana and stamina costs grow +8% per rank; rage skills have their own steps; the four Mystic capstones cost 95 mana.
- **Tooltip layout (keep it):** short thematic line, what it does, damage at rank 1 → rank 10 (or current + next rank once learned), extra stats, cost, cooldown.
- **Damage numbers** for weapon skills are "% of weapon damage" per rank (`weapon_damage_pct_by_rank`).

---

## 7. Monsters

- **Monster level** = the zone's level, pulled up a little if you are over-levelled (half a level per level, at most +4).
- **One life curve and one damage curve by monster level** (`monster_std_life`, `monster_std_damage` in `data/progression.json`). Each monster type is a fixed size relative to that standard: an average normal hits for ~9% of a same-level hero's life and takes 4–10 hits to kill; trolls, golems and brutes hit harder and soak more.
- From monster level 40 on, monsters have +25% life.
- **Packs:** most zones place monsters in packs around anchors; some zones add camps (bandits around a fire), swarms (bats, crows) and wandering beasts.
- **Elites:** a champion with 1–2 modifiers (fire, cold, lightning, poison, fast, tough, and more), a name and a coloured aura; better loot.
- **Map Bearers:** in towers and the crypt, a marked monster carries the floor's map.
- **Bosses** come back on every visit; after you die to one it returns at 33% life. Each boss has phases (new attacks at 75/50/25% life). Re-kills drop a rare instead of the quest item.
- 85 monster types with life, damage, speed and size at levels 10/30/60 are in `data/monsters.json`.

---

## 8. Items and loot

- **Slots:** helm, chest, gloves, boots, belt, two rings, amulet, main hand, off hand (shield).
- **Rarity:** normal (white), magic (blue, 1–2 mods), rare (yellow, more mods and a random two-word name).
- **Item level** sets the base tier (three looks: below 25, 25–59, 60+) and which mods can roll.
- **Mods (affixes)** from a weighted pool: flat and % damage, elemental damage, attack speed, crit, life, mana, resistances, Defense, evasion, block, life steal, move speed, light radius, magic find, gold find, +skills, attributes. Attribute mods favour their material (Strength on plate and so on).
- **Sockets and stones:** gear can take socketed stones (everyday stones and rarer unique ones).
- **Parts and recipes:** monsters drop parts; the witch's cauldron and the blacksmith turn parts into items through recipes.
- **Vendors:** blacksmith (Brom), barkeeper (Hobbs: potions), a gambler, and a rare travelling peddler. Gold from monsters, sales and quests.
- **Bag and stash:** a 10-column bag; a shared stash with tabs (an extra tab is an in-app purchase).
- `data/items.json` has every table, plus 300 real rolled items to test the Godot loot code against.

---

## 9. The world

About 30 zones (`data/world.json` → `zones`, with level and size). Overworld zones are re-rolled every visit (roads, gates, camps, points of interest move); towers and dungeons get a new layout every trip.

Rough order and levels: Mistfall (town) → Dark Forest 1 (with the Spider Lair 3, Bear Cave 4) → River Valley 6 (Minotaur Cave 7) → Withered Crossroads 10 (Lighthouse Tower 11–16) → Cursed Cemetery 17 and the Dark Crypt 19 → Lakeside Ruins 21 (Ancient Ruins, Flooded Temple 25, Sunken Depths 26) → Black Marsh 28 (Marsh Pool, Forgotten Tower 29) → Barren Highlands 32 → Mountain Pass 33 (Icy Summit, Icy Cellar, Mountain Depths 36, Ember Caverns) → Frosthold Keep 39 (Frosthold Tower 40, Frosthold Dungeon) → Redridge Canyon 42 (watchtowers 43, Red Crater 45, Raptor Lair, Highward 46) → Cliffside 55 → Shadow Keep → **the Breach** (endless).

Overworld extras: **road encounters** (caravans, a walking scarecrow, a feral herd, a sealed cellar, a carrion feast, the peddler), **shrines** (90 s buffs), **hidden caches**, **guarded hoards**.

Waypoints connect the big zones; a **Town Portal** (2 s cast) takes you home and back.

---

## 10. Quests and story

The main thread: the **runestones** that protect the land are failing. **Corwin the Scholar** pieces it together; you recover the runestones from the Lakeside Ruins, the dwarves of Frosthold and beyond.

Side quests (`data/quests.json`): Aldric's hunters and the bridge, Hobbs's **Light the Way** (the Lighthouse beacon), Brom's hammer, Mirelle's **Silver Locket**, the graverobbers, the lost miners, the witch in the Forgotten Tower, the hunters' trophy bosses (Minotaur, Mastodon, Leviathan, Kraken, Colossus), and the Wraith Lord.

Named NPCs: **Aldric the Elder, Hobbs the Barkeeper, Brom the Blacksmith, Garrick the Hunter, Corwin the Scholar, Mirelle**, the witch, and Orrin Thistlewick the peddler. Many lines are voiced (`audio.json` → `VOICE_BANK`; the ogg files carry over as they are).

---

## 11. Progression

- **Level cap 80.** XP per level follows Diablo 2's shape: about +20% per level early, about +9% per level from 28 on (`xp_for_level`).
- Old zones give little XP once you outlevel them.
- **Achievements** are account-wide.
- **Leaderboard:** score = Breach floor × 1000 + level.

---

## 12. Store and platform (Android)

- App ID **`com.sol.Runefall`** (permanent; the Godot build ships as an update to the same listing, signed with the **same keystore**).
- In-app purchases (one-time): **Cat Companion** ($2.99), **Expanded Stash** ($1.99). Restores never take ownership away.
- Google Play Games: sign-in, **cloud save** (one snapshot of all characters, stash and achievements), one leaderboard.
- **Fresh start for Godot:** old HTML characters are not carried over.

---

## 13. Things to fix or rethink in the rebuild (owner notes)

- Thornbacks: not in the Withered Crossroads, and their damage a bit lower.
- Run animation: shorter strides for the hero's speed.
- The respawn sound should fit the dark theme.
- A balance pass for the attribute system (skills, monster life and damage) — planned after the core systems are in.
