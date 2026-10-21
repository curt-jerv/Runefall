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
- Version each batch (last: v494 — player back view when facing up the screen, four shield tiers, squires keep the tier-2 helm, softer Ranger/Mystic torso edges; v493 — HUD overhaul (landscape: globes + menu bar along the bottom; portrait: along the top), compact action buttons (Strike 74px, skills on a 74px ring, Dodge on the bottom row, Potion + Interact on the right edge), darker zones + Light Radius everywhere, quest rewards wait for bag room; v492 — Defender rework (Mirror of Steel, Seismic Anchor; Reckoning/Immovable removed), Skill Damages group, shadow-keep music, death/respawn/arc sounds, light radius affix + dark veil, tower line-of-sight, landscape HUD top bar; v491 — Sunken static, Knights figure, small tuning; v490 enemy/boss/quest/zone batch; v489 big gameplay/UI batch; v488 code split into folders; v487 performance). Bump the save-migration flags (`skillsV4xx`, newest `skillsV492`) when a skill tree layout changes and refund points.
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
- Resume after the phone sleeps: `core/resume.js` (loaded last) records the last enter*/goToTown* call in `rf_resume_v1` and replays it on reload.
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
- HUD (v493): `#hudDock` (life globe, menu buttons + XP bar, resource globe) sits along the bottom in landscape and along the top in portrait; region name, buffs and messages go under the top HUD (`#topWrap`). Action buttons: Strike (74px) in the corner, skills on a 74px ring, Dodge at the end of the bottom row, Potion then Interact up the right edge (end of css/game.css).
- Darkness (v493): `drawLightVeil` darkens every zone but town; the Dark Crypt and caves keep their own dark. `lightRadiusMult(p)` (+Light Radius gear, cap 60%) widens every light except the Dark Crypt's.
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
