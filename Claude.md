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
