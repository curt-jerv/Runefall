# Runefall — Art Bible

The one page every model, texture, light, effect and menu is checked against.
If a piece of art does not fit this page, it does not go in the game.

---

## 1. North Star

> **A dying, rain-dark frontier where the old runes are failing.**
> Worn, heavy, quiet. Lit by fire. Magic is rare, and it is the only thing that glows.

Three words to test any piece of art: **Worn. Heavy. Fire-lit.**

- **Worn** — nothing is new. Edges are chipped, cloth is frayed, paint has faded, wood is grey.
- **Heavy** — chunky silhouettes, thick limbs, big hands and boots, armour that looks like it weighs something. No spindly, delicate or cartoon shapes.
- **Fire-lit** — the warm light comes from fires, torches, braziers and spells. The world itself is cold and dim.

Touchstones (for mood, not to copy): Diablo 1 and 2 (the dread and the quiet), Darkest Dungeon (worn grimness), early Dark Souls (melancholy, decay), Grim Dawn (a ruined frontier).
What we are **not**: bright high fantasy, cartoon (Fortnite, Torchlight), glossy realism, neon sci-fi.

---

## 2. Camera and scale

- **Fixed isometric camera**, looking down at ~35° (close to the old 2:1 sprite view), slightly zoomed so the hero is about 1/8 of the screen height on a phone.
- Everything must **read from above at phone size**: big, clear silhouettes; helmets, shoulders, weapons and shields slightly oversized (about +15%) so they read.
- **Cutscenes** may rotate, tilt and zoom (look up at a tower, pull back over a mountain). Gameplay never does.
- Units: **1 Godot unit = 1 metre.** A human is 1.8 m. Doors are 2.4 m; walls 3–4 m; trees 5–9 m.

---

## 3. Colour

The world is desaturated earth and stone. Saturated colour is **reserved** for fire, magic, loot and danger, so the eye always finds what matters.

| Use | Colours (hex) | Notes |
|---|---|---|
| Earth / mud / road | `#3b3226` `#4a3f2f` `#5b4d38` | brown-grey, never orange |
| Dead grass / straw | `#5e5838` `#6b6440` `#4c4a2e` | olive and straw, low saturation |
| Forest | `#1f2a1c` `#2c3a26` `#3a4a30` | dark, almost black-green |
| Stone / walls | `#4a4a48` `#5e5c57` `#2f2f30` | cold grey with a hint of blue |
| Wood (old) | `#4a3a2a` `#5a4632` `#3a2c20` | grey-brown, weathered |
| Snow / ice | `#c8d0d8` `#9fb2c4` `#6e8aa6` | blue-grey, never pure white |
| Marsh / poison | `#3c4a2a` `#5a6a2a` + glow `#9acd32` | sickly yellow-green |
| Lava / Breach | `#2a1a14` + glow `#ff6a1a` `#ffb347` | dark crust, bright cracks |
| **Fire / warm light** | `#ff8a3d` `#ffb35a` `#ffd27a` | the main warm accent |
| **Cold magic** | `#7ad0ff` `#4aa8ff` | ice, mana |
| **Lightning** | `#e6e35a` `#fff6a0` | |
| **Necromancy / soul** | `#a06ad0` `#6a3a9a` | |
| **Poison** | `#9acd32` | |
| Blood | `#7a1a1a` | dark, never bright red |

**Item rarity colours** (kept from the HTML game): normal `#c8c8c8`, magic `#6a8cff`, rare `#ffd94a`, set/unique (future) `#3ad16a` / `#c7883a`.

**Rule:** at most one saturated accent colour per character or prop. Everything else stays in the muted palette.

---

## 4. Light and atmosphere

- **Outdoors:** overcast or low sun. Soft, cool sky light (blue-grey) plus one warm or neutral key light low in the sky. Long, soft shadows.
- **Fog** in every zone (Godot volumetric or depth fog), denser in valleys, forests and marshes. Fog is part of the mood: it hides the edges of the world.
- **Indoors / underground:** almost dark. The player carries a **warm light radius** (it grows with Light Radius gear), torches and braziers make pools of light, and spells light up the room when cast.
- **Post-processing:** slight desaturation (about −20%), a brown-sepia lift in the shadows, gentle contrast, a vignette, and a faint film grain (optional in settings). Bloom only on fire and magic.
- **Day/night:** none for now. Each zone has a fixed mood (see section 8).

---

## 5. Shapes and models

- **Low-poly but not faceted:** smooth-shaded, about 3–8k triangles per character, 50–3k per prop. Quaternius style is the baseline.
- **Textures:** simple colour maps with painted wear, dirt in crevices and lighter worn edges. No photo textures. One small texture atlas per kit where possible.
- **Silhouette first:** every character and monster must be recognisable as a solid black shape from the game camera.
- **Proportions:** realistic-heroic (heads ~1/7 of the height). Never chibi or big-head.
- **Wear pass on everything:** chips, dents, frayed hems, moss on stone, rust on iron, soot near fires.

---

## 6. Heroes — the three classes, three looks each

The look changes with the **item level of the worn chest piece**, as in the HTML game: below 25 / 25–59 / 60 and up.

### Warrior (plate) — "the last soldier of a fallen order"
1. **Worn:** iron skullcap, padded gambeson, chain shirt, bare steel, a rough round shield.
2. **Steel:** winged crested helm, steel breastplate and pauldrons, crimson tabard, kite shield.
3. **Gilded:** gilded wings on the helm, gold-trimmed plate, a long red cape, gilded heater shield.

### Ranger (leather) — "the hunter who never left the woods"
1. **Worn:** brown cap or hood, laced leather jerkin, simple boots, short bow.
2. **Hooded:** green hood with a red feather, studded leather, green mantle, recurve bow.
3. **Master:** gold-stitched hood with a green feather, layered leather and fur, long bow with carved limbs.

### Mystic (robe) — "a scholar who read the wrong books"
1. **Worn:** cloth cowl, slate robe, rope belt, a gnarled staff.
2. **Adept:** purple circlet with a gem, purple robes with silver trim, a staff with a glowing crystal.
3. **Archmage:** tall archmage hat, bright purple robes with gold runes, a staff with a floating orb.

**Shields** have four looks (buckler / iron-rimmed wood / steel and crimson / gilded), following the shield's own tier.
**Weapons** follow item level: plain iron → finer steel and trim → gilded with a rarity-coloured glow.

---

## 7. Monster families

Each family has a shape language and a colour key so the player learns them at a glance.

| Family | Shape and colour | Examples |
|---|---|---|
| **Beasts** | low, long, forward-leaning; fur browns and greys; glowing eyes only on elites | wolves, wargs (white on the mountains), bears, boars, Thornback, Hookbeak, rams |
| **Bandits and outlaws** | ragged human, mismatched leather and cloth, hoods and masks; dull reds and browns | bandits, archers, brutes, the Bandit King |
| **Undead** | thin, broken, bone-white with green-black rot; lantern-green soul glow | skeletons, zombies, ghouls, the Possessed Graverobber, the Wraith Lord |
| **Goblins and cave things** | small, hunched, big ears and hands; mossy greens and greys | goblins, cave trolls, spiders, bats |
| **Dwarves of Frosthold** | short and very wide, heavy plate with blue-steel and frost; braided beards | dwarven squads, Champions, Clerics, the Commander, turrets |
| **Marsh** | bloated, wet, yellow-green, dripping | giant toads, plague doctors, the Marsh Leviathan |
| **Frost** | tall, gaunt or huge, icy blues, icicles, breath vapour | Windigo, the Mastodon, frozen zombies |
| **Fire and Breach** | cracked black stone with lava light; horns and spikes | imps, demons, the Molten Colossus, firebats |
| **Sea and depths** | tentacles, scales, barnacles; deep blue and teal | Kraken, Leviathans, the Sunken Depths things |

**Elites** keep their family look plus a coloured aura matching their modifier (fire orange, cold blue, lightning yellow, poison green).
**Bosses** are 1.5–3x size, with one signature shape (horns, a lantern, a crown, tentacles) visible from the camera.

---

## 8. Zones — the mood of each place

| Zone | Mood in one line | Palette |
|---|---|---|
| **Town (Mistfall)** | the last warm place: lamplight, smoke, tired people | warm wood, lamp orange, wet stone |
| **Dark Forest** | close, black-green, things moving between the trunks | near-black greens, mist |
| **River Valley** | a long winding road, cold water, ruined bridges | grey-greens, slate water |
| **Withered Crossroads** | dead grass, rutted roads, crows, a gallows feeling | straw, olive, grey sky |
| **Lighthouse** | a dark coastal tower; the beacon is the only light for miles | wet stone, sea blue-black, beacon gold |
| **Cursed Cemetery and Dark Crypt** | iron fences, crooked stones, green soul-light | grey stone, lantern green |
| **Lakeside Ruins** | old stone half-sunk in a lake, quiet and sad | blue-grey water, moss |
| **Black Marsh** | rot, gas and poison; sound swallowed by the bog | yellow-green, brown water |
| **Forgotten Tower** | goblin-infested ruin, bonfires inside stone halls | firelight on stone |
| **Barren Highlands and Mountain Pass** | wind, rock, thin grass, the first snow | rock grey, straw, snow |
| **Icy Summit and Cellar** | blue cold, frozen silence | ice blues, white-grey |
| **Frosthold Keep, Tower and Dungeon** | the dwarves' fortress: stone, iron, forges | steel blue, forge orange |
| **Redridge Canyon and Red Crater** | red rock, heat haze, dust | rust reds, ochre |
| **Shadow Keep and the Breach** | a demon fortress opening into hell | black stone, lava orange |

---

## 9. Effects (VFX)

- Spells are the brightest things on screen, and they **light the world** (each fire or lightning spell carries a small light).
- Shapes are readable from above: rings on the ground for area attacks, a clear projectile head, and a short trail.
- **Enemy danger telegraphs** use a single consistent language: a red-orange ground ring or cone that fills in, then the hit. Never blue (blue is ours).
- Particles are few and chunky (sparks, embers, ice shards), never dust-cloud noise that hides the fight.

---

## 10. UI

- **Iron and parchment:** dark iron frames with worn gold trim, parchment panels, the Cinzel font for titles and Alegreya for body text (both kept from the HTML game).
- Life and mana globes, like Diablo. Rarity colours on item names. Icons painted, not flat.
- UI never covers the centre of the screen in combat.

---

## 11. Do and don't

| Do | Don't |
|---|---|
| chunky, heavy silhouettes | thin, spiky, delicate shapes |
| muted earth palette, one accent | rainbow colours, saturated grass |
| fire and magic as the only glow | glowing everything |
| worn, chipped, dirty edges | clean, new, shiny surfaces |
| fog and darkness hiding the far edge | flat, evenly lit, infinite-view worlds |
| realistic-heroic proportions | chibi, big heads, cartoon eyes |
| painted wear on simple textures | photo textures, heavy normal-map noise |

---

## 12. The style prompt (for AI image tools, concept art or briefing an artist)

Copy this block and add the subject at the end:

```
Dark low-poly fantasy game art, isometric three-quarter view from above, Diablo 2 mood.
A dying, rain-dark frontier: worn, heavy, fire-lit. Chunky readable silhouettes,
realistic-heroic proportions, smooth-shaded low-poly models with hand-painted textures,
chipped and weathered edges, dirt and moss. Muted desaturated earth palette (brown-grey,
olive, cold stone grey); the only saturated colours are fire orange and magic glow.
Overcast cool light, low warm key light from torches or fire, soft long shadows,
light fog, subtle vignette. No cartoon, no chibi, no neon, no photo textures.
Subject:
```

Subject examples:
- `a Ranger in a green hood with a red feather and studded leather, holding a recurve bow`
- `a Thornback: a wolf-sized quilled rodent with a spiked tail, brown-grey fur`
- `the Lighthouse: a dark stone coastal tower at night, its beacon the only light`
- `a Frosthold dwarf warrior: very wide, blue-steel plate with frost, braided beard, war axe`

---

## 13. Sources and licences

- **Quaternius** (CC0, free for commercial use): heroes, outfits, base bodies, animations, nature and dungeon kits.
- **KayKit** (CC0): extra dungeon and prop kits where their style can be toned down to fit.
- **Mixamo** (free with an Adobe account, allowed in commercial games): extra animations (bow, cast, combos).
- **Made for Runefall in Blender:** unique landmarks (Lighthouse, Frosthold Keep, Shadow Keep, the crypt tomb), unique monsters, weapons and props.
- Keep a `LICENSES.md` row for every asset pack used.
