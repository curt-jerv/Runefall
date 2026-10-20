# Runefall — notes for Claude

Runefall is a single-file HTML5/Canvas isometric action RPG (Diablo 2 mood) built for Android phones.
The owner has no coding experience: explain things plainly, batch changes, and keep summaries short.

## Layout
- `www/index.html` — the whole game (one ~9 MB file: HTML + CSS + JS + base64 music). This is the file to edit.
- `www/privacy.html` — privacy policy, served by GitHub Pages at https://curt-jerv.github.io/Runefall/privacy.html
- `capacitor.config.json` — appId `com.sol.Runefall` (permanent, never change it).
- `package.json` — Capacitor 8 + `@capacitor/app`, `@capacitor/screen-orientation`, `@capgo/native-purchases`.
- `scripts/patch-android.py` — run in CI after `cap add android`: sets versionCode from the run number, release signing, removes any orientation lock.
- `.github/workflows/build-aab.yml` — manual "Run workflow" → signed release `.aab` (artifact `runefall-release-aab-N`). Node 22, JDK 21. Secrets: ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS.
- `.github/workflows/build-android.yml` — manual debug APK. `static.yml` — GitHub Pages deploy of `www/`.

## Working on the game
- Version each batch (last: v487 — performance batch). Bump the save-migration flags (`skillsV4xx`) when a skill tree layout changes and refund points.
- After every edit: syntax-check the inline script (extract the main `<script>` and run `node --check`). A `// comment` added mid-line swallows the rest of that line — the most common breakage.
- Test with Playwright (Chromium is at /opt/pw-browsers/chromium). Hooks: `window.__test` (getGame, stepSim, spawnEnemy, enter*…), `window.__enter` (every zone's enter function), `window.__simPause = true` to step manually.
- Phone layouts to check: landscape ~800x360 / 915x412, portrait 390x844.

## Performance (v487)
- Graphics quality (`settings.gfxQ`: auto/high/medium/low → `gfxLevel`): sets the drawing resolution (`gfxDpr`) and glow strength (main ctx `shadowBlur` is scaled in `perfPatchCtx`, which also reuses gradients). Auto steps down when frames are slow (`gfxAutoTune`).
- Ground is pre-painted into 512px chunks (`cachedFloor`). Floor painters check `FLOOR_PASS` (1 = baking, skip moving water; 2 = live, moving water only). A new floor painter with animation must follow that pattern.
- Collisions use grids (`pushOutOfObstacles`, `obsGrid`, `separateEnemies`); use `pushOutOfObstacles(ent, list)` instead of looping `pushOutOfRect`.

## Store / release state (Oct 2026)
- Play Console app created; internal testing live (build 2). New personal account → needs a closed test with 12+ testers for 14 days before production.
- In-app products (one-time, purchase option id `buy`): `runefall_cat_companion` $2.99, `runefall_expanded_stash` $1.99. Billing code: `iapPurchase` / `iapRestore` in index.html (free unlock in a plain browser).
- Every new upload needs a higher versionCode (the workflow handles it).

## Game design notes
- Classes/trees: Warrior (Defender, Berserker, Templar), Ranger (Survivalist, Marksman, Hunter), Mystic (Djinn, Elementalist, Necromancer).
- Enemy damage: `dmgType` (pure element) and `dmgSplit` (50/50 physical + element, e.g. Frosthold dwarves cold, raptors/firebats fire, Black Marsh poison).
- Achievements are account-wide in localStorage (`runefall_ach_v1`); pop-ups hidden by default (Settings toggle).



# CLAUDE.md - Runefall Project Guidelines

## 🛡️ Project Overview
Runefall is an isometric mobile/web ARPG built with vanilla HTML5, CSS3, and JavaScript. 

## 🛠️ Tech Stack & Architecture
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+ Modules).
- **Rendering:** HTML5 Canvas API and/or CSS-based DOM layering for isometric grid and UI.
- **Version Control:** Git / GitHub (`https://github.com/curt-jerv/Runefall`).

## 📁 Repository Structure Rules
- `/assets/sprites/` - Character sprites organized by tier (tier1, tier2, tier3) and animations.
- `/assets/environment/` - Isometric tiles, buildings, trees, and props.
- `/assets/ui/` - HUD elements, button frames, and menu screens.
- `/js/` - Modular JavaScript files (`game.js`, `renderer.js`, `input.js`, `player.js`).
- `/css/` - Responsive stylesheets supporting both portrait and landscape layouts.

## 💻 Coding Standards
- Write clean, modular, object-oriented or functional ES6 JavaScript without heavy frameworks.
- Ensure all UI screens (like the Character Selection screen) are fully responsive in both **portrait** and **landscape** viewports.
- Always check asset paths relative to the root before writing code.
- Keep comments concise and focused on game logic architecture.
