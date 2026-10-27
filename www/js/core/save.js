// ---------- Save / continue progress (multiple character slots) ----------
// Progress persists across exiting the app/tab: level, gold, gear, skills.
// A saved character always resumes safely in Town (same as a death/return
// does), so no dungeon layout or enemy state needs to be saved. Up to
// MAX_CHARACTER_SLOTS characters can be saved side by side; each carries its
// own id so saveGame() knows which slot to update.
const SAVES_KEY = 'dc_saves_v2';
const OLD_SAVE_KEY = 'dc_save_v1'; // single-slot format from before multi-character support
const MAX_CHARACTER_SLOTS = 3;
// v273 quest-chain overhaul: every old character/stash is wiped exactly once (the world's progression changed completely)
try{
  if(!localStorage.getItem('dc_wipe_v273')){
    localStorage.removeItem(SAVES_KEY); localStorage.removeItem(OLD_SAVE_KEY); localStorage.removeItem('dc_stash_v1');
    localStorage.setItem('dc_wipe_v273','1');
  }
}catch(e){}
function genSaveId(){ return 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
function loadAllSaves(){
  try{
    const raw = localStorage.getItem(SAVES_KEY);
    if(!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  }catch(e){ return []; }
}
function writeAllSaves(list){
  try{ localStorage.setItem(SAVES_KEY, JSON.stringify(list)); }catch(e){}
}
// ---- Shared stash (Town chest) ----
// Deliberately stored under its OWN localStorage key, entirely separate
// from any per-character save in dc_saves_v2 -- every character on this
// client reads and writes the same chest, so switching characters (or a
// character dying, which never touches this key at all) can never lose or
// wall off its contents. Written immediately on every deposit/withdraw/
// gold-transfer rather than waiting on the periodic autosave.
const STASH_KEY = 'dc_stash_v1';
// v81 Expanded Stash: the chest now holds up to 4 tabs (stash.tabs[0..3]),
// each its own independent 10x6 grid (same BAG_COLS/BAG_ROWS as the bag).
// Tab 0 is the original, always-available stash and is kept mirrored onto
// `stash.items` (a plain reference to whichever tab array is currently
// active -- see syncStashItemsView) so every pre-existing bit of stash
// code below (drag/drop, openItemDetail, renderStash, etc.) that already
// reads/writes `stash.items` keeps working completely unchanged; only the
// tab-switcher itself needs to know tabs exist at all. Tabs 1-3 only
// become reachable while the Support submenu's Expanded Stash toggle is
// ON (settings.expandedStash) -- see renderStashTabs -- but their
// contents are NEVER deleted by turning the toggle off, only hidden, so
// items already stored there are safe either way (the safer, more
// player-friendly choice vs. discarding them).
const STASH_TAB_COUNT = 4;
let stashActiveTab = 0;
// v490: mana potions no longer exist -- old ones in a save are removed and sold for half price (125g each).
// Lives here (not town/economy.js) because loadStash runs while this file loads.
function stripManaPotions(list){ if(!Array.isArray(list)) return 0; let n = 0; for(let i=list.length-1;i>=0;i--){ const it = list[i]; if(it && it.slotType==='potion' && it.potionKind==='mana'){ list.splice(i,1); n++; } } return n*125; }
function loadStash(){
  try{
    const raw = localStorage.getItem(STASH_KEY);
    if(!raw) return {gold:0, items:[], tabs:[[],[],[],[]]};
    const obj = JSON.parse(raw);
    if(obj && typeof obj==='object'){
      let tabs;
      if(Array.isArray(obj.tabs)){
        tabs = [];
        for(let i=0;i<STASH_TAB_COUNT;i++) tabs.push(Array.isArray(obj.tabs[i]) ? obj.tabs[i] : []);
      } else {
        // Migrate a pre-Expanded-Stash save (single flat `items` array,
        // no `tabs` field yet) into Tab 1, leaving the 3 new tabs empty.
        tabs = [Array.isArray(obj.items) ? obj.items : [], [], [], []];
      }
      let mg = 0; for(const tb of tabs) mg += stripManaPotions(tb);   // v490: mana potions are gone -- sold for half price
      return {gold: (obj.gold||0) + mg, items: tabs[0], tabs};
    }
  }catch(e){}
  return {gold:0, items:[], tabs:[[],[],[],[]]};
}
function saveStash(){
  try{
    // stash.items is always literally the same array as stash.tabs[stashActiveTab]
    // (see syncStashItemsView), so this already reflects any edit made
    // through stash.items -- just persist all 4 tabs together.
    localStorage.setItem(STASH_KEY, JSON.stringify({gold:stash.gold||0, tabs:stash.tabs}));
  }catch(e){}
}
// Points stash.items at the currently-active tab's array. Called on load
// and any time stashActiveTab changes.
function syncStashItemsView(){ stash.items = stash.tabs[stashActiveTab]; }
let stash = loadStash();
syncStashItemsView();
// Migrate a pre-existing single-slot save into the new multi-character list,
// once, so nobody's progress from before this update is lost.
(function migrateOldSave(){
  try{
    const oldRaw = localStorage.getItem(OLD_SAVE_KEY);
    if(oldRaw){
      if(loadAllSaves().length===0){
        const old = JSON.parse(oldRaw);
        if(old && typeof old==='object'){
          old.id = genSaveId();
          old.updatedAt = Date.now();
          writeAllSaves([old]);
        }
      }
      localStorage.removeItem(OLD_SAVE_KEY);
    }
  }catch(e){}
})();
// ---------- Waypoint discovery ----------
// Waypoint rework: a world waypoint (every zone's `waypoint` landmark
// except Town's, which is always available -- see updateTown's interact
// prompt below) is permanently unlocked the moment the player physically
// walks up to it in the world (the same proximity check that shows its
// "Teleport" interact prompt -- see each zone's nearXWaypoint constant),
// NOT simply by entering that zone via its gate. Once discovered it's
// saved right away, same one-shot "set a flag + saveGame()" pattern every
// other permanent unlock in this file already uses, and it persists
// across save/reload via the existing p.reachedX fields in saveGame/
// newGame. flagName is one of those existing player fields (e.g.
// 'reachedMountainPass') reused as the discovered-waypoint flag.
// v490: discovery now happens when the player USES the waypoint (interact -> openTeleportMenu, see
// WAYPOINT_FLAG_BY_FROM in ui/town-menus.js), not on proximity; the waypoint then draws lit (waypointLit).
function discoverWaypoint(flagName){
  const p = game.player;
  if(!p[flagName]){
    p[flagName] = true;
    saveGame();
  }
}
function saveGame(){
  if(!game || !game.started || !game.player.saveId) return;
  try{
    const p = game.player;
    const data = {
      id: p.saveId, v:2, xpCurve3:true,
      level:p.level, xp:p.xp, xpNext:p.xpNext, gold:p.gold, souls:p.souls||0,
      skillPoints:p.skillPoints, skills:p.skills, rangerV227:true, warriorV266:true, rangerV267:true, mysticV268:true, mysticV269:true, mysticV270:true, skillsV454:true, skillsV455:true, skillsV459:true, skillsV492:true, skillsV495:true, skillsV497:true, skillsV545:true, skillsV460:true, skillsV466:true, skillsV475:true, skillsV476:true, skillsV477:true, skillsV480:true, skillsV481:true, skillsV489:true,
      skillSlots:p.skillSlots||{main:'strike', slot1:null, slot2:null, slot3:null},
      equipment:p.equipment, inventory:p.inventory,
      quests:p.quests||[],
      checkpointDepth:p.checkpointDepth||1, deaths:p.deaths||0,
      reachedMountainPass:p.reachedMountainPass||false,
      reachedIcySummit:p.reachedIcySummit||false,
      reachedRedridge:p.reachedRedridge||false, reachedFrostholdWp:p.reachedFrostholdWp||false, reachedCrater:p.reachedCrater||false, gojiraSlain:p.gojiraSlain||false, obsidianTaken:p.obsidianTaken||false, dragonboltGiven:p.dragonboltGiven||false, hunterRuneRewarded:p.hunterRuneRewarded||false, runeforgeUnlocked:p.runeforgeUnlocked||false,
      partLeviathan:p.partLeviathan||false, witchRareGiven:!!p.witchRareGiven, partMastodon:p.partMastodon||false, recipeBoss:p.recipeBoss||{}, playTime:p.playTime||0, killCount:p.killCount||0, partThunder:p.partThunder||false, partKraken:p.partKraken||false, witchRescued:p.witchRescued||false, witchBrewed:p.witchBrewed||false, partsHarvest:p.partsHarvest||false, recipeBookTaken:p.recipeBookTaken||false, recipeBookRead:p.recipeBookRead||false, knightEquip:p.knightEquip||null, parts:p.parts||{}, recipes:p.recipes||{}, witchStock:p.witchStock||null, fhtRuneTaken:p.fhtRuneTaken||false, purpleDrunk:p.purpleDrunk||false,
      shrineBlessed:p.shrineBlessed||false, forestHunterPos:p.forestHunterPos||null, leviathanSlain:p.leviathanSlain||false, krakenSlain:p.krakenSlain||false, wmSeen:p.wmSeen||{},
      frostholdUnlocked:p.frostholdUnlocked||false, snowWallOpen:p.snowWallOpen||false, heartstoneTaken:p.heartstoneTaken||false, defilerSlain:p.defilerSlain||false, inscriptionTaken:p.inscriptionTaken||false, scholarMet:p.scholarMet||false, scholarMeet:p.scholarMeet||false, scholarLeft:p.scholarLeft||false, ruinsEvent:p.ruinsEvent||0, scholarRead:p.scholarRead||false, fhDungeonKey:p.fhDungeonKey||false, fhDungeonOpen:p.fhDungeonOpen||false, fhDungeonDone:p.fhDungeonDone||false, redridgeWallOpen:p.redridgeWallOpen||false, shrineStage:p.shrineStage||0, scholarEast:p.scholarEast||false, fhCmdSlain:p.fhCmdSlain||false, fhCmdLooted:p.fhCmdLooted||false, constructSlain:p.constructSlain||false, heartstoneDone:p.heartstoneDone||false, witchPotionStarted:p.witchPotionStarted||false, npcMarks:p.npcMarks||{},
      reachedSunlitPlains:p.reachedSunlitPlains||false,
      reachedRiverValley:p.reachedRiverValley||false, bridgeCleared:p.bridgeCleared||false, bridgeChiefDead:p.bridgeChiefDead||false,
      reachedLighthouseTower:p.reachedLighthouseTower||false,
      reachedLighthouseTowerTop:p.reachedLighthouseTowerTop||false,
      reachedLakesideRuins:p.reachedLakesideRuins||false,
      reachedBlackMarsh:p.reachedBlackMarsh||false, reachedForgottenTower:p.reachedForgottenTower||false, reachedHighlands:p.reachedHighlands||false,
      reachedCursedCemetery:p.reachedCursedCemetery||false,
      cemeteryCleared:p.cemeteryCleared||false,
      reachedDarkCrypt:p.reachedDarkCrypt||false, darkCryptCp:p.darkCryptCp||false,
      darkCryptChestLooted:p.darkCryptChestLooted||false,
      reachedAncientRuins:p.reachedAncientRuins||false,
      ruinsEntranceOpen:p.ruinsEntranceOpen||false,
      ancientRuinsChestLooted:p.ancientRuinsChestLooted||false, ruinsWarlordSlain:p.ruinsWarlordSlain||false, sunkenChestLooted:p.sunkenChestLooted||false, poolChestLooted:p.poolChestLooted||false, heartChestLooted:p.heartChestLooted||false, colossusSlain:p.colossusSlain||false,
      potionSlot:p.potionSlot||'health', potionEq:p.potionEq||null, beltV478:!!p.beltV478, barStock:p.barStock||null, barRestockAt:p.barRestockAt||0, vendorRestockAt:p.vendorRestockAt||0, beerT:p.beerT||0, coffeeT:p.coffeeT||0,
      lighthouseFloor5Cleared:p.lighthouseFloor5Cleared||false,
      lighthouseBeaconOn:p.lighthouseBeaconOn||false,
      lighthouseChestLooted:p.lighthouseChestLooted||false,
      minerQ:p.minerQ||0, sunkenChest2Looted:!!p.sunkenChest2Looted, reachedMineWp:p.reachedMineWp||false, reachedFhdWp:p.reachedFhdWp||false, reachedHighwardWp:p.reachedHighwardWp||false, reachedDeepWp:p.reachedDeepWp||false, reachedCliffWp:p.reachedCliffWp||false, reachedKeepWp:p.reachedKeepWp||false, reachedHoldWp:p.reachedHoldWp||false, sleptAt:p.sleptAt||0, sleptBed:p.sleptBed||0, wellRestedT:p.wellRestedT||0, breachReached:p.breachReached||false, reachedRingWp:p.reachedRingWp||false, breachBest:p.breachBest||0, breachClears:p.breachClears||0, wraithLordSlain:p.wraithLordSlain||false, breachContained:p.breachContained||false, runesPlaced:p.runesPlaced||{}, wlRework427:p.wlRework427||false, wlReset435:p.wlReset435||false, wlSkillReward:p.wlSkillReward||false, skGateOpen:p.skGateOpen||false, keepLore:p.keepLore||{}, keepMaps:p.keepMaps||{}, tpBeacons:p.tpBeacons||[], harpyQueenSlain:p.harpyQueenSlain||false, harpyTalonTaken:p.harpyTalonTaken||false, highwardSlain:p.highwardSlain||false, hwCrossing:p.hwCrossing||false, hwRuneTaken:p.hwRuneTaken||false, hwSwitchOn:p.hwSwitchOn||false, hwMapFound:p.hwMapFound||false, wayfarerMet:p.wayfarerMet||false, scholarWarnedRR:p.scholarWarnedRR||false, scholarThirdRead:p.scholarThirdRead||false, scholarKeyTalk:p.scholarKeyTalk||false, rrBeacons:p.rrBeacons||{}, mineDeepest:p.mineDeepest||0, balrogSlain:p.balrogSlain||false, hammerTaken:p.hammerTaken||false, smithSockets:p.smithSockets||false, socketUses:p.socketUses||0, ftMapFound:p.ftMapFound||false,
      cls:p.cls||'warrior',
      updatedAt: Date.now(),
    };
    const list = loadAllSaves();
    const idx = list.findIndex(s=>s.id===data.id);
    if(idx>=0) list[idx] = data; else list.push(data);
    writeAllSaves(list);
  }catch(e){}
}
function deleteSave(id){
  writeAllSaves(loadAllSaves().filter(s=>s.id!==id));
}
// Kept for backward compatibility with anything expecting a single "the"
// saved character -- returns the most recently updated one, if any.
function loadSavedGame(){
  const list = loadAllSaves();
  if(list.length===0) return null;
  return list.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0];
}
// Builds the "Warrior · Defender"-style label shown per character slot
// (character-select screen). v64: once a character has ranked up ANY
// capstone skill, that capstone's tree name becomes the character's
// "specialization title" here instead of whichever tree merely happens to
// have the first point spent in it -- since only one capstone can ever be
// ranked per character (see committedCapstone, now a single slot spanning
// all of that character's class's trees), the capstone that's actually
// allocated IS, definitionally, the first (and only) one ever allocated.
// Falls back to the old "first tree with any points" behavior for a
// character who hasn't committed to a capstone yet.
function capstoneTreeName(save){
  if(!save.skills) return null;
  const TREES = treesForClass(save.cls);
  for(const key of Object.keys(TREES)){
    const tree = TREES[key];
    for(const node of tree.nodes){
      if(node.capstone && (save.skills[node.id]||0) > 0) return tree.name;
    }
  }
  return null;
}
function characterLabel(save){
  const clsName = save.cls==='ranger' ? 'Ranger' : save.cls==='mystic' ? 'Mystic' : 'Warrior';
  const treeName = capstoneTreeName(save); // sub-tree label only once a capstone is allocated
  return treeName ? (clsName+' · '+treeName) : clsName;
}
// Main/primary talent tree for the Inventory screen header: prefers the
// committed capstone tree (same "definitionally the main tree" logic as
// capstoneTreeName above -- a capstone can only ever be reached in one
// tree since points are shared across all three), and before a capstone
// is reached, falls back to whichever tree currently has the MOST points
// invested in it (summed across all of that tree's nodes), rather than
// just the first tree with any points at all -- a more accurate "main
// tree so far" for a character still mid-build.
function mainTreeName(save){
  if(!save.skills) return null;
  const capstone = capstoneTreeName(save);
  if(capstone || true) return capstone || null; // no label until a capstone is allocated
  const TREES = treesForClass(save.cls);
  let best = null, bestPts = 0;
  for(const key of Object.keys(TREES)){
    const tree = TREES[key];
    let pts = 0;
    for(const node of tree.nodes) pts += (save.skills[node.id]||0);
    if(pts > bestPts){ bestPts = pts; best = tree.name; }
  }
  return best;
}
// save whenever the app/tab is being backgrounded or closed, plus a
// periodic autosave so progress isn't lost even if those events don't fire
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);
window.addEventListener('beforeunload', saveGame);
setInterval(saveGame, 8000);
setInterval(()=>{ if(game && game.started && game.player && !document.hidden) game.player.playTime = (game.player.playTime||0) + 1; }, 1000);   // v467: play time, in seconds

