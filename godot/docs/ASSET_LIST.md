# Runefall in Godot — Asset List

Every model and animation the game needs, and where each comes from.

**Sources:**
- **Q** = Quaternius (CC0). **Q$** = the Quaternius "Source" version, which needs to be bought.
- **MX** = Mixamo (free with an Adobe account).
- **KK** = KayKit (CC0).
- **B** = made for Runefall in Blender.

Priority: **P1** = needed for Phase 1–2, **P2** = needed for the region that uses it, **P3** = nice to have.

---

## Heroes (P1)

| Asset | Source | Notes |
|---|---|---|
| Base body (male/female) + heads | Q (Universal Base Characters, free) | only the head is used under outfits |
| Ranger outfit (3 tiers) | Q (free Ranger outfit) + B tints and extra pieces | tier 2/3 = recolour + feather, mantle and fur pieces in B |
| Warrior outfit (3 tiers) | **Q$** (Knight outfit) + B | gilded tier = B trim and cape |
| Mystic outfit (3 tiers) | **Q$** (Wizard / Noble outfits) + B | hats and circlets in B |
| Bows (3 tiers), staves (3 + 4 spell orbs), swords, axes, maces (3 tiers each) | B | simple low-poly; rarity glow added in Godot |
| Shields (4 looks: buckler, iron-rimmed, steel and crimson, gilded) | B | |
| Hero animations: idle, walk, run, dodge roll, hit, death | Q (Universal Animation Library) | run blended to shorter strides |
| Ranger: bow draw and release, rapid shot, rain of arrows | **MX** (archery pack) | |
| Warrior: sword combo, heavy two-hand swing, shield bash, whirlwind spin, leap and charge | MX + Q (Sword_Attack) | |
| Mystic: cast (one-hand, two-hand, channel), summon | MX + Q (Spell_Simple_*) | |
| Pets: wolf, bear, skeletons, squires, the Cat Companion | Q animals + Q skeleton + hero rig | |

## NPCs (P2)

Aldric, Hobbs, Brom, Garrick, Corwin, Mirelle, the witch, Orrin the peddler, miners, townsfolk.
Source: Q base bodies + Q Peasant outfit (free) + B hats, aprons and props. Animations: Q idle, talk, sit and interact.

## Monsters

| Family | Types in the HTML game | Source |
|---|---|---|
| Humanoid fighters | grunt, archer, brute, cultist, shadowcultist, bandit, banditarcher, banditbrute, banditking | Q bodies + B outfits; MX attacks |
| Undead | skeleton, skeletonarcher, skeletonbrute, zombie, frozenzombie, risendead, shadowghoul, wraith, wraithling, wraithlord, vampire | Q / KK skeletons + zombie; B robes and lanterns |
| Goblins and trolls | goblin, goblinarcher, cavetroll, mtroll, trollelder, giant | Q (monster packs) + B |
| Beasts | wolf, warg (white variant), bear, boar, ram, buffalo, alligator, anaconda, poisonsnake, sandsnake, stormsnake, spider, vulture, harpy, harpyqueen, roc, **Thornback**, **Hookbeak** | Q animal and monster packs; Thornback and Hookbeak in B |
| Dinosaurs (Redridge) | raptor, lightningraptor, trex, armordon, tortuga | Q (dinosaur pack, free) |
| Dwarves of Frosthold | fhdwarf, fhaxe, fhbrute, fhcleric, fhtemplar (Champions), fhturret, the Commander | Q base bodies scaled wide + B plate, beards and turrets |
| Highward knights | hwbulwark, hwduelist, hwguardian, hwmendicant, hwsentinel, hwvanguard, hwwarden | Q$ knight outfit recoloured |
| Constructs | dwconstruct, cogcrawler, coilsentry, gearguard, fallengolem, magmagolem | B (blocky, easy to model) |
| Marsh | giantoad, poisonplant, poisonwalker, the **Exiled Plague Doctor**, crawler | B + Q |
| Fire and Breach | imp, hellhound, firebat, lavabeetle, magmacrawler, brimstonebrute, cinderfiend, balrog, demonboss | Q (monster pack) + B |
| Frost | **Windigo**, the **Mastodon** | B |
| Treants | treant | B (tree kit + rig) |

**Bosses** (B, the most care, P2 each in its region): the Spider Lair guardian, Minotaur, Bandit King, Possessed Graverobber (Defiler), Wraith Lord, Kraken, Marsh Leviathan, Witch-guard trolls, Mastodon, Molten Colossus, Frosthold Commander, Storm Raptor, Gojira, Harpy Queen, the Breach bosses.

Monster animations: idle, move, attack (1–2), hit, death, plus one special per boss (slam, breath, charge, summon). Q packs include basic sets; bosses get theirs keyed in B.

## Environments

| Kit | Source | Notes |
|---|---|---|
| Nature: trees (living and dead), bushes, rocks, cliffs, grass | Q (Ultimate Nature, Stylized Nature) | tinted to the bible palette |
| Town: houses, tavern, smithy, market, fences, lamps | Q (Medieval Village) + B | Mistfall in B from kit parts |
| Dungeon and crypt: walls, floors, doors, pillars, torches, coffins, chests | Q / KK dungeon kits | |
| Castle and keep: walls, towers, gates, banners | Q (Castle kit) + B | Frosthold Keep, Shadow Keep |
| Cemetery: tombstones, iron fences, mausoleums | B + KK | |
| Marsh: dead trees, reeds, bog water, rotten boats | B + Q nature | |
| Snow and ice versions of rocks and trees | B (material swap) | |
| Redridge: red rock spires, canyon walls | B | |
| Lava and Breach: black rock, lava cracks, chains | B | |
| **Landmarks:** the Lighthouse, Frosthold Tower, the Forgotten Tower, Highward, the crypt tomb, the Grave Statue, runestones, waypoints, shrines | **B** | the signature pieces |
| Props: barrels, crates, carts, campfires, tents, beds, wagons, the caravan, bridges | Q + B | |
| Ground: terrain materials (dirt road, dead grass, forest floor, stone, snow, mud, lava) | B / Godot | painted textures |

## Effects, UI and audio

- **VFX:** in Godot (GPU particles, shaders) for fire, ice, lightning, poison, soul, telegraphs and light shafts.
- **UI:** frames, globes, buttons and icons in B / painted; Cinzel and Alegreya fonts (already in the HTML game).
- **Audio:** carried over from the HTML game (`www/audio/`). Still to replace: the **respawn** sound.
