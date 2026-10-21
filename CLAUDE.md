# Runefall — notes for Claude

Runefall is an HTML5/Canvas isometric action RPG (Diablo 2 mood) built for Android phones, with no frameworks or build step.
The owner has no coding experience: explain things plainly, batch changes, and keep summaries short.

## Layout
- `www/index.html` — the page: HTML for every screen/menu, links the CSS, then `js/load.js`.
- `www/js/` — the game code (v488 split of the old single script, ~97 files): `core/` (boot, saves, game state, loop, update, HUD), `ui/` (menus, inventory, skill tree, settings, store), `items/`, `skills/` (per class), `combat/`, `quests/`, `town/`, `zones/` (one per area), `monsters/`, `render/` (drawing), `audio/`.
- `www/js/load.js` — the ordered file list. Files are plain scripts sharing one global scope (no modules); ORDER MATTERS. The loader fetches everything, then runs it all at once.
- `www/css/` (styles), `www/fonts/` (Cinzel, Alegreya), `www/audio/sfx|music/` (ogg; paths in `SND_BANK` / `MUS_BANK`).
- `www/privacy.html` — privacy policy, served by GitHub Pages at https://curt-jerv.github.io/Runefall/privacy.html
- `capacitor.config.json` — appId `com.sol.Runefall` (permanent, never change it).
- `package.json` — Capacitor 8 + `@capacitor/app`, `@capacitor/screen-orientation`, `@capgo/native-purchases`.
- `scripts/patch-android.py` — run in CI after `cap add android`: sets versionCode from the run number, release signing, removes any orientation lock.
- `.github/workflows/build-aab.yml` — manual "Run workflow" → signed release `.aab` (artifact `runefall-release-aab-N`). Node 22, JDK 21. Secrets: ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS.
- `.github/workflows/build-android.yml` — manual debug APK. `static.yml` — GitHub Pages deploy of `www/`.

## Working on the game
- Version each batch (last: v505 — Lighthouse Tower maze floors (1-4) each have a Map Bearer and hide their map until it falls; the Breach is endless: floors 21+ follow `brFloorTheme(bf)` (shuffled cycles of the six themed boss floors minotaur / revenant / mastodon / leviathan / colossus / kraken, with 0-2 ordinary lava floors in front of each), themed floors are built by `brThemedFloor` (zones/shadow-keep.js: rooms + tunnels ending in the boss arena, ~5000x3000, `room.floorRects`, `room.theme`, `room.themeArena`, `room.themePool` for the water arenas, `room.heartGeo` = the Colossus's bowl via `heartG()` in mountain-depths.js) and bosses via `spawnThemedBreachBoss`; `brCheckpoint` = the floor after the last boss floor you cleared; v504 — Map Bearers: Shadow Keep's marked brute is the one nearest the way in (`room._mbZone`), Highward floors 2-4 and every Forgotten Tower floor keep a bearer until their map is found; v503 — the Dark Crypt is a large randomized zone (6600x7600; `makeDarkCrypt` in zones/dark-crypt.js: jittered 4x5 grid of chambers, random spanning tree of tunnels + loops, entrance at the bottom, the same hall -> north door -> Defiler's Tomb at the top; stocked in packs, ~320 monsters with densify `darkcrypt` tune in monsters/elites.js; dying to the Defiler/Wraith Lord still respawns just outside the tomb door via `hallDoor`); v502 — Giant Toads drop Rotting Flesh; auto-target needs the enemy's feet a little inside the screen (`ONSCREEN_PAD_*` in core/loop.js); dying clears every running or pending skill (`clearWantFlags`, `clearWarriorRangerState`, `SKILL_TIMER_KEYS` in combat/combat-feel.js); Highward floors ~5% smaller; poison/chill enemy tinting capped at 10 per frame (statuses.js); v501 — performance: skeleton/gate-archer sprites are cached per animation frame (`drawSkeletonEnemy` → `SKEL_CACHE` in render/undead.js; `window.__noSpriteCache=true` turns it off), tower/keep/Highward ground uses `cachedFloor`, line-of-sight shadow polygon reused until you move 4px and painted at half resolution (folded into the light veil when nothing is drawn between them), far enemies re-check line of sight less often (`enemyLOS`, `enemyLOSMulti`); Veteran's Stone is +6% damage only, Frozen Zombies also drop Rotting Flesh; v500 — wolves circle even for the first pack member (`wolfCircle`, later ones wait longer), Wraith Lord phase-1 shield drawn, white wargs on the Mountain Pass (`variant:'white'`), cultists in Redridge tower 3 and Shadow Keep open red imp portals (`cultPortalTick` in zones/frosthold-tower.js), Explosive Trap blast uses Explosive Shot's little circles, Ambush/Recall/Beast Fury cost 20 Stamina, action-button gaps 12px; v499 — Beast Horn rename, giant toad drops no parts, unique stones +30% (Pyre Heart fire, Eye of the Tempest lightning, Heart of Wrath damage, Crystalline Prism cold), Crystalline Prism turns Ice Bolt into Frozen Orb (skills/mystic.js `castFrozenOrb`/`frozenOrbTick`/`frozenOrbExplode`, own cooldown `p.frozenOrbCd`), Phantom Quiver 50% pierce (`quiverPierce` in skills/ranger.js), four new everyday stones (Veteran's xp, Wayfarer's, Ironhide, Scavenger's); v498 — caves, depths and towers darker than the Dark Forest; v497 — title screen on every cold start, Predator's Instinct split (Steady Breathing on Marksman, ailment damage on the Survivalist node), Explosive Trap/Trap Mastery on the Lv.28 row, Soul Sap 1/2/3 targets at rank 1/3/5 with its own sound, Strike 84px + button gaps, respawn faces the screen, auto-target fixed; v496 — Templar own damage no longer halved by Squire; v495 — login faces the screen, reopen → town, Bulwark under Mirror of Steel, Multi Shot is its own basic shot (swapped with Predator's Instinct), Soul Gate/Soul Hunger on the Lv.14 row, Soul Fire 20 souls, Soul Gate archers 4 souls, darker dungeons; v494 — player back view when facing up the screen, four shield tiers, squires keep the tier-2 helm, softer Ranger/Mystic torso edges; v493 — HUD overhaul (landscape: globes + menu bar along the bottom; portrait: along the top), compact action buttons (Strike 74px, skills on a 74px ring, Dodge on the bottom row, Potion + Interact on the right edge), darker zones + Light Radius everywhere, quest rewards wait for bag room; v492 — Defender rework (Mirror of Steel, Seismic Anchor; Reckoning/Immovable removed), Skill Damages group, shadow-keep music, death/respawn/arc sounds, light radius affix + dark veil, tower line-of-sight, landscape HUD top bar; v491 — Sunken static, Knights figure, small tuning; v490 enemy/boss/quest/zone batch; v489 big gameplay/UI batch; v488 code split into folders; v487 performance). Bump the save-migration flags (`skillsV4xx`, newest `skillsV497`, which refunds any Defender/Marksman/Survivalist/Necromancer node whose prereq or level no longer fits) when a skill tree layout changes and refund points.
- After every edit: `node scripts/check-js.js` (syntax-checks every file and that `load.js` lists them all, and WARNS about code hidden behind a mid-line `// comment` — the most common breakage; treat any warning as a bug).
- Code that runs while a file loads (not inside a function) may only use functions/vars from the same or EARLIER files in `load.js`. New file → add it to `load.js`.
- Testing over http (audio needs it): `cd www && http-server -p 8090`; file:// works too but without audio.
- Test with Playwright (Chromium is at /opt/pw-browsers/chromium). Hooks: `window.__test` (getGame, stepSim, spawnEnemy, enter*…), `window.__enter` (every zone's enter function), `window.__simPause = true` to step manually.
- Phone layouts to check: landscape ~800x360 / 915x412, portrait 390x844.

## Performance (v487)
- Graphics quality (`settings.gfxQ`: auto/high/medium/low → `gfxLevel`): sets the drawing resolution (`gfxDpr`) and glow strength (main ctx `shadowBlur` is scaled in `perfPatchCtx`, which also reuses gradients). Auto steps down when frames are slow (`gfxAutoTune`).
- Ground is pre-painted into 512px chunks (`cachedFloor`). Floor painters check `FLOOR_PASS` (1 = baking, skip moving water; 2 = live, moving water only). A new floor painter with animation must follow that pattern.
- Collisions use grids (`pushOutOfObstacles`, `obsGrid`, `separateEnemies`); use `pushOutOfObstacles(ent, list)` instead of looping `pushOutOfRect`.

## Store / release state (Oct 2026)
- Play Console app created; internal testing live (build 2). New personal account → needs a closed test with 12+ testers for 14 days before production.
- In-app products (one-time, purchase option id `buy`): `runefall_cat_companion` $2.99, `runefall_expanded_stash` $1.99. Billing code: `iapPurchase` / `iapRestore` (www/js/ui/support-store.js) (free unlock in a plain browser).
- Every new upload needs a higher versionCode (the workflow handles it).

## Game design notes
- Classes/trees: Warrior (Defender, Berserker, Templar), Ranger (Survivalist, Marksman, Hunter), Mystic (Djinn, Elementalist, Necromancer).
- Enemy damage: `dmgType` (pure element) and `dmgSplit` (50/50 physical + element, e.g. Frosthold dwarves cold, raptors/firebats fire, Black Marsh poison).
- Achievements are account-wide in localStorage (`runefall_ach_v1`); pop-ups shown by default (`settings.hideAch===true` hides them).
- Resume (v497, `core/resume.js`, loaded last): every cold start shows the title screen (nothing is auto-loaded; the old localStorage note is deleted). sessionStorage `rf_resume_v1` holds the character, zone and spot, so only a reload inside the same app session returns there (a locked phone keeps the app alive anyway). `startGame` is wrapped there to forget the previous zone and call `faceScreen(p)` (core/util.js), which respawn and goToTown call too.
- Auto-target (v497, core/loop.js): `enemyOnScreen` is exactly the visible screen (0..W, 0..H); `nearestEnemyOnScreen` and Soul Sap's extra targets both use it. Ranger Marksman node ids: `steadyBreathing` (stamina), Survivalist `survivalInstinct` is shown as Predator's Instinct (life, speed, +damage vs ailing enemies). Multi Shot is its own basic shot; `soulSapTargets(rank)` = 1 / 2 (rank 3) / 3 (rank 5).
- Bosses respawn every visit (v489); after a death they come back at 33% life (v492), except the Molten Colossus.
- Mirror of Steel reflects in `playerDamage` (combat/combat-feel.js). Seismic Anchor's slow is `anchorSlowMult(e)` (skills/warrior.js), applied in the enemy loop in core/update.js.
- Light radius: `lightRadiusPct` (+Light Radius affix); the dark veil is `lightVeilScene` in render/darkness.js.
- Stat panel: Offense has a collapsible 'Skill Damages' group (ui/inventory.js `skillDmgGroup`). Their `*Slain` flags stay for quests/doors; `bossRekillFlag`/`bossRekillRare` (monsters/minotaur.js) drop a rare instead of the quest item on a re-kill. Exit portals appear only after that visit's kill.
- `skDur(p, d)` applies the Skill Duration % mod (`p.skillDurPct`); ailments use it via the status-timer line in update.js.
- IAP restore (`iapRestore`) only ever adds ownership, never removes it.
- Messages (v490): `showMsg` routes quotes ("...") to a speech banner, quest/recipe lines to the story banner (`showBigMsg`, queued), "Obtained ·" item lines merge. Achievements toast top-left, parts toast under it. Bosses can `bossGreet` once.
- Enemy targeting (v490): threat in `pickEnemyTarget`/`threatTick` (closest ally unless another has ~25% of the monster's life more threat). Telegraphed normal-enemy hits go through `teleDmg` (−25%/−40%, capped at 50% max life).
- Monster level (v490): `monsterLevel` follows an over-levelled player at half speed (max +3/+4).
- Hero art (v494, render/heroes.js): `heroBackView(p)` turns ONLY the player away from the camera while facing up the screen (squires, Knights, Highward, protectors, guards and the Mirage reuse these rigs and always face front). `heroShieldTier` / `drawHeroShield`: the player's shield art follows the item tier (0 buckler, 1 iron-rimmed wood, 2 steel and crimson, 3 gilded); others always tier 2. Drawing a hero costs ~0.05-0.13 ms, so it is not cached.
- `core/spawn-safety.js` moves ordinary monsters away from waypoints/entrances/stairs after every enter*.
- HUD (v493): `#hudDock` (life globe, menu buttons + XP bar, resource globe) sits along the bottom in landscape and along the top in portrait; region name, buffs and messages go under the top HUD (`#topWrap`). Action buttons (end of css/game.css): Strike 84px in the corner, the three skills hugging it, Dodge past skill 1, Potion above skill 3, Interact outside skill 2 on the diagonal; every gap is 6px.
- Darkness (v493, v498): `drawLightVeil` darkens every zone but town; the Dark Crypt keeps its own dark. Caves/depths (`isUndergroundScene`) use a circle at `UNDERGROUND_LIGHT_SCALE` (0.8) of the old size with its centre dimmed by `UNDERGROUND_CORE_DIM`; towers/halls use `VEIL_INDOOR_*`. Measure with the mean canvas brightness near the player (the forest is about 43; caves and dungeons should stay about 20-33). `lightRadiusMult(p)` (+Light Radius gear, cap 60%) widens every light except the Dark Crypt's.
- NPC quest rewards go through `giveRewardIfRoom(p, items)` (ui/bag.js): nothing is given until the whole reward fits (the bag is tidied if needed), and the NPC offers it again.



# CLAUDE.md - Runefall Project Guidelines

## 🛡️ Project Overview
Runefall is an isometric mobile/web ARPG built with vanilla HTML5, CSS3, and JavaScript. 

## 🛠️ Tech Stack & Architecture
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+, plain scripts in one shared scope, loaded in order by `www/js/load.js`).
- **Rendering:** HTML5 Canvas API and/or CSS-based DOM layering for isometric grid and UI.
- **Version Control:** Git / GitHub (`https://github.com/curt-jerv/Runefall`).

## 📁 Repository Structure Rules
Everything the app ships lives under `www/` (Capacitor's webDir):
- `www/js/<topic>/` - game code by topic (see Layout above).
- `www/css/` - stylesheets (portrait and landscape layouts).
- `www/audio/`, `www/fonts/` - sound, music, fonts.
- Planned for the art upgrade: `www/assets/sprites/` (characters/monsters, by tier and animation), `www/assets/environment/` (tiles, buildings, trees, props), `www/assets/ui/` (HUD, frames, menus).

## 💻 Coding Standards
- Write clean, modular, object-oriented or functional ES6 JavaScript without heavy frameworks.
- Ensure all UI screens (like the Character Selection screen) are fully responsive in both **portrait** and **landscape** viewports.
- Always check asset paths relative to the root before writing code.
- Keep comments concise and focused on game logic architecture.
