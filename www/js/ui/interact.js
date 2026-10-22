// (v121) Sleep in a tavern bed: save, then return to the title / character screen.
// ---- v399: sleeping in a tavern bed logs you out; come back after 1h+ for the Well Rested buff (lasts 1/4 of the time away, away time capped at 4h) ----
const WELL_RESTED_REGEN = 1;   // +1% of max life per second (the Life Regen % stat; items roll about 0.3-1.5)
const WELL_RESTED_MIN_S = 3600, WELL_RESTED_MAX_S = 4*3600;
function fmtRestTime(sec){ sec = Math.max(0, Math.ceil(sec)); const m = Math.floor(sec/60), s2 = sec%60; return m>=60 ? Math.floor(m/60)+'h '+(m%60)+'m' : m>0 ? m+'m '+(s2<10?'0':'')+s2+'s' : s2+'s'; }
let wrIconEl = null, wrBoxEl = null, wrUiT = 0;
function wellRestedUi(){
  const p = game && game.player, on = !!(p && p.wellRestedT>0 && game.started);
  if(!wrIconEl){
    wrIconEl = document.createElement('div'); wrIconEl.id = 'wrIcon';
    wrIconEl.style.cssText = 'position:fixed;left:8px;top:48px;width:36px;height:36px;box-sizing:border-box;border:2px solid #c8a050;border-radius:6px;background:#17130f;color:#f0e6d0;display:none;align-items:center;justify-content:center;font-size:19px;z-index:60;cursor:pointer;box-shadow:0 0 8px rgba(200,160,80,.45);';
    wrIconEl.innerHTML = '<span>\u{1F319}</span><small id="wrIconT" style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);font-size:9px;white-space:nowrap;color:#e8d8b0;text-shadow:0 1px 2px #000;"></small>';
    document.body.appendChild(wrIconEl);
    wrBoxEl = document.createElement('div');
    wrBoxEl.style.cssText = 'display:none;position:fixed;left:8px;top:92px;width:min(250px,80vw);z-index:9000;padding:10px 12px;border-radius:10px;background:rgba(22,18,13,.97);border:1px solid #6a5a3a;color:#f0e6d0;font-size:12px;line-height:1.4;';
    document.body.appendChild(wrBoxEl);
    wrBoxEl.addEventListener('click', ()=>{ wrBoxEl.style.display = 'none'; });
    wrIconEl.addEventListener('click', ()=>{ if(!game.player || !(game.player.wellRestedT>0)) return; if(wrBoxEl.style.display==='block'){ wrBoxEl.style.display = 'none'; return; } wrBoxEl.innerHTML = '<b style="color:#e8c44a">Well Rested</b><br>+5% Magic Find<br>+'+WELL_RESTED_REGEN+'% life regeneration per second<br>Time left: '+fmtRestTime(game.player.wellRestedT)+'<br><span style="opacity:.6">Tap to close</span>'; wrBoxEl.style.display = 'block'; });
  }
  wrIconEl.style.display = 'none';   // v452: shown in the buff row instead
  if(!on && wrBoxEl) wrBoxEl.style.display = 'none';
  if(on){ const t = document.getElementById('wrIconT'); if(t) t.textContent = fmtRestTime(p.wellRestedT); }
}
function wellRestedTick(p, dt){
  p.wellRestedT -= dt; wrUiT -= dt;
  if(p.wellRestedT<=0){ p.wellRestedT = 0; recalcStats(p); wellRestedUi(); showMsg('You no longer feel Well Rested', 2.4); return; }
  if(wrUiT<=0){ wrUiT = 0.5; wellRestedUi(); }
}
// on login: a character who slept in a tavern bed wakes up upstairs beside it, and earns the buff for time away
function applyBedWake(){
  const g = game, p = g.player;
  if(!p || !p.sleptAt) return;
  const away = (Date.now() - p.sleptAt)/1000, bedIdx = p.sleptBed||0;
  p.sleptAt = 0;
  enterTavern(); tavernGoUpstairs();
  const b = g.tavern.beds[bedIdx] || g.tavern.beds[0];
  p.x = (b.x + b.w/2 < g.tavern.w/2) ? b.x + b.w + 46 : b.x - 46; p.y = b.y + b.h/2;
  if(away >= WELL_RESTED_MIN_S){
    p.wellRestedT = Math.max(p.wellRestedT||0, Math.min(away, WELL_RESTED_MAX_S)/4);
    recalcStats(p); wellRestedUi();
    showMsg('You wake up Well Rested ('+fmtRestTime(p.wellRestedT)+')', 3.4, '#e8c44a');
  } else showMsg('You wake up in your bed', 2.2);
  saveGame();
}
function logOutToTitle(){
  try{ const g = game, p = g.player; let bi = 0, bd = 1e9; (g.tavern&&g.tavern.beds||[]).forEach((b,i)=>{ const d = dist(p,{x:b.x+b.w/2,y:b.y+b.h/2}); if(d<bd){ bd = d; bi = i; } }); p.sleptAt = Date.now(); p.sleptBed = bi; }catch(e){}
  try{ saveGame(); }catch(e){}
  showMsg('You drift off to sleep...', 1.2);
  setTimeout(()=>{ try{ location.reload(); }catch(e){} }, 700);
}
// v485: Android back button -- closes the open window, otherwise opens the Menu (on the title screen it leaves the app)
try{ const C = window.Capacitor, AppP = C && C.Plugins && C.Plugins.App;
  if(AppP && AppP.addListener && C.isNativePlatform && C.isNativePlatform()) AppP.addListener('backButton', ()=>{
    const open = [...document.querySelectorAll('.modalOverlay')].filter(o=>o.style.display==='flex').pop();
    if(open){ const cb = open.querySelector('.closeBtn'); if(cb){ cb.click(); return; } }
    if(game && game.started && !game.over){ if(!game.modalOpen) openMenu(); return; }
    try{ saveGame(); }catch(e){} AppP.exitApp();
  });
}catch(e){}
document.getElementById('menuExitBtn').addEventListener('click', ()=>{
  closeMenu();
  exitGameClient();
});

// ---------- Interact prompt (Blacksmith / zone gates) ----------
let interactKind = null;
const btnInteract = document.getElementById('btnInteract');
const interactLbl = document.getElementById('interactLbl');
const INTERACT_LABELS = {toLakeFromSunken:'Return to the Lakeside Ruins', rescueHunter:'Talk to the Hunter', townCat:'Talk', townsfolk:'Talk', locketWoman:'Talk', dockCaptain:'Talk to the Captain', depthsMiner:'Talk', toDefilerTomb:'Enter the Tomb', fromDefilerTomb:'Leave the Tomb', cemStatue:'Touch the Statue', wayfarer:'Talk', rrTower:'Enter Watchtower', rrTowerExit:'Leave Watchtower', hwToCanyon:'Leave Highward', hwUp:'Climb the Stairs', rrUp:'Climb the Stairs', rrDown:'Descend the Stairs', hwDown:'Descend the Stairs', hwEastLocked:'Eastern Gate (Sealed)', hwEastOpen:'Step Through the Portal', hwAltar:'Take the Runestone', hwReturn:'Step Through the Portal', hwSwitch:'Pull the Switch', cliffToHighward:'Return to Highward', toHarpyNest:"Enter the Harpy's Nest", nestToCliff:'Leave the Nest', shadowKeepGate:'Shadow Keep Gate', waypointCliff:'Teleport', keepToCliff:'Leave Shadow Keep', keepPrev:'Go Back', keepNext:'Go Onward', keepLore:'Examine', keepBeacon:'Light the Beacon', waypointKeep:'Teleport', keepStairs:'Descend to the Dungeon', waypointHold:'Teleport', breachToTown:'Return to Mistfall', waypointRing:'Teleport', ringPlace:'Place the Runestones', runeAltar:'Runestone Altar', breachEnter:'Enter the Breach', waypointHighward:'Waypoint', rrBeacon:'Light the Beacon', redridgeBridgeOpen:'Cross the Skybridge', depthsToPass:'Climb to the Mountain Pass', deepUp:'Ascend the Stairs', deepDown:'Descend the Stairs', toFhTower:'Enter the Frosthold Tower', fhtToKeep:'Leave the Tower', lairExit:'Leave the Lair', fhtPortalKeep:'Return to Frosthold Keep', waypointFrosthold:'Teleport', fhtUp:'Climb the stairs', fhtDown:'Descend the stairs', pickupItem:'Pick up item', toForgottenTower:'Enter the Forgotten Tower', toMarshFromTower:'Return to the Black Marsh', toWitchCamp:"Go to the Witch's camp", toTownFromTower:'Return to Mistfall', toSunkenDepths:'Enter the Sunken Depths', sunkenToLakeside:'Return to Lakeside Ruins', toMarshPool:'Enter the Marsh Pool', poolToMarsh:'Return to the Black Marsh', waypointForgottenTower:'Teleport', marshCauldron:'Examine the Cauldron', talkWitchTower:'Talk to the Witch', lighthouseStairsDown:'Descend the Stairs', shop:'Talk to Blacksmith', toForest:'Enter the Dark Forest', toTown:'Return to Mistfall', toMine:'Enter the Frosthold Dungeon', toFhDungeon:'Enter the Frosthold Dungeon', toMountainDepths:'Descend into the Mountain Depths', mineToPass:'Return to Frosthold Keep', mineUp:'Ascend the Stairs', mineDown:'Descend the Stairs', waypointMine:'Teleport', quest:'Talk to Old Man', well:'Look Into the Well', bonfireHunter:'Talk to the Hunter', toSpiderLair:'Enter the Spider Lair', toBearCave:'Enter the Bear Cave', toMountainPass:'Enter the Mountain Pass', toForestFromMountain:'Enter the Barren Highlands', toHighlands:'Enter the Barren Highlands', toMarshFromHighlands:'Descend to the Black Marsh', toPassFromHighlands:'Climb to the Mountain Pass', waypointHighlands:'Teleport', toSunlitPlains:'Enter Withered Crossroads', toForestFromSunlit:'Return to the River Valley', toRiverValley:'Enter the River Valley', toForestFromRiver:'Return to the Dark Forest', toSunlitPlainsFromRiver:'Enter Withered Crossroads', waypointRiver:'Teleport', toMinotaurCave:'Enter the Minotaur Cave', toLighthouseTower:'Enter Lighthouse Tower', toSunlitPlainsFromLighthouse:'Return to Withered Crossroads', lighthouseStairsUp:'Ascend the Stairs', toLakesideRuins:'Enter Lakeside Ruins', toBlackMarsh:'Enter the Black Marsh', toLakesideFromMarsh:'Return to Lakeside Ruins', forgottenSealed:'Forgotten Tower (Sealed)', waypointMarsh:'Teleport', toSunlitPlainsFromLakeside:'Return to Withered Crossroads', toCursedCemetery:'Enter Cursed Cemetery', toSunlitPlainsFromCemetery:'Return to Withered Crossroads', tombSealed:'Tomb (Sealed)', toDarkCrypt:'Enter the Dark Crypt', toCursedCemeteryFromCrypt:'Return to Cursed Cemetery', waypoint:'Teleport', waypointMtn:'Teleport', waypointSun:'Teleport', waypointLighthouse1:'Teleport', waypointLighthouse5:'Teleport', waypointLakeside:'Teleport', waypointDeep:'Teleport', shrineToTown:'Return to Mistfall', waypointCemetery:'Teleport', waypointDarkCrypt:'Teleport', openCrypt:'Open the Crypt', waypointLocked:'Waypoint (Locked)', stash:'Open Stash', barkeeper:'Talk to Barkeeper', toTavern:'Enter the Tavern', tavernLocked:'Tavern (Closed)', toTownFromTavern:'Return to Mistfall', tavernStairsUp:'Go Upstairs', tavernStairsDown:'Go Downstairs', beacon:'Light the Beacon', barShop:'Talk to the Bartender', bardShop:'Talk to the Bard', gamblerShop:'Talk to the Gambler', lighthouseClearPortal:'Return to Withered Crossroads', studyRuins:'Begin Deciphering', scholarRuins:'Talk to the Scholar', toFloodedTemple:'Descend to the Flooded Temple', templeToRuins:'Climb to the Ancient Ruins', sunkenToTemple:'Climb to the Flooded Temple', toTownFromRuins:'Return to Mistfall', toAncientRuins:'Enter the Ancient Ruins', toLakesideFromRuins:'Leave the Ancient Ruins', ruinsDown:'Descend the Stairs', ruinsUp:'Ascend the Stairs', waypointAncientRuins:'Teleport', waypointFhd:'Teleport', toFrosthold:'Approach Frosthold Keep', toMountainPassFromFrost:'Return to the Mountain Pass', fhSealed:'Sealed Door', toRedridge:'Enter Redridge Canyon', toFrostholdFromRedridge:'Return to Frosthold Keep', redridgeEastSealed:'The Road East (Sealed)', waypointRedridge:'Teleport', toRaptorLair:'Enter the Raptor Lair', toRedridgeEast:'To the Eastern Canyon', toRedridgeWest:'To the Western Canyon', toRedCrater:'Enter Redridge Crater', toRedridgeFromCrater:'Return to Redridge Canyon', takeObsidianRune:'Take the Obsidian Obelisk', obsidianSealed:'The Runestone is Guarded', runeforge:'Use the Runeforge Anvil', toRedridgeFromLair:'Return to Redridge Canyon', lairDown:'Descend the Stairs', lairUp:'Ascend the Stairs', shrineAltar:'Pray at the Shrine', shrineSealed:'Ancient Altar', toIcySummit:'Go to the Icy Summit', toIcyShrine:'Enter Mountain Top Shrine', toIcyCellar:'Enter the Icy Cellar', toMountainPassFromIcy:'Descend to the Mountain Pass', waypointIcy:'Teleport', tavernLogout:'Sleep & Log Out', snowWall:'Wall of Snow', fhDungeonLocked:'Locked', fhDungeonKeyhole:'Place the Key', shrineInsert:'Place the Runestone', fhdToKeep:'Leave the Dungeon', fhdPortalKeep:'Return to Frosthold Keep', fhdUp:'Ascend the Stairs', fhdDown:'Descend the Stairs', takeRunestone2:'Take the Runestone', redridgeWall:'Ancient Machinery', inspectTomb:'Inspect the Sarcophagus', talkGraverobbers:'Talk to the Graverobbers', scholarTalk:'Talk to the Scholar'};
// v86: item 4 -- a single glyph per interactKind for the new small circular
// button (see .interactBtn's CSS comment for why this replaced the old
// wide text bar). Reuses the SAME single-letter convention the Region Map
// popup already established for these exact landmarks (see
// renderRegionMap()'s pts list: 'W' Waypoint, 'B' Blacksmith, 'S' Stash,
// '!' the Old Man/quest, 'O' the Well, 'F' the Bonfire/Hunter) rather than
// inventing a second icon language -- extended with plain, obvious emoji
// glyphs for zone-transition kinds (a door for entering/returning through
// a gate, a torch for the Mine, stairs for ascending, a lock for a
// not-yet-unlocked waypoint) since no icon convention already existed for
// those elsewhere in the game.
const INTERACT_ICONS = {rescueHunter:'\u{1F4AC}', depthsMiner:'\u{1F4AC}', depthsToPass:'\u{1F6AA}', deepUp:'\u{1FA9C}', deepDown:'\u{1FA9C}', toFhTower:'\u{1F6AA}', fhtToKeep:'\u{1F6AA}', lairExit:'\u{1FA9C}', fhtPortalKeep:'\u{1F300}', waypointFrosthold:'W', fhtUp:'\u{1FA9C}', fhtDown:'\u{1FA9C}', 
  shop:'B', toForest:'\u{1F6AA}', toTown:'\u{1F6AA}', toMine:'\u{1F525}', mineToPass:'\u{1F6AA}', toFhDungeon:'\u{1F6AA}', toMountainDepths:'\u{1F6AA}', toSunkenDepths:'\u{1F6AA}', sunkenToLakeside:'\u{1F6AA}', toMarshPool:'\u{1F6AA}', poolToMarsh:'\u{1F6AA}', mineUp:'\u{1FA9C}', mineDown:'\u{1FA9C}',
  pickupItem:'\u2193', quest:'!', well:'O', bonfireHunter:'F',
  toSpiderLair:'\u{1F6AA}', toBearCave:'\u{1F6AA}', toMountainPass:'\u{1F6AA}',
  toForestFromMountain:'\u{1F6AA}', toSunlitPlains:'\u{1F6AA}', toForestFromSunlit:'\u{1F6AA}', toRiverValley:'\u{1F6AA}', toForestFromRiver:'\u{1F6AA}', toSunlitPlainsFromRiver:'\u{1F6AA}', waypointRiver:'W', toMinotaurCave:'\u{1F6AA}',
  toLighthouseTower:'\u{1F6AA}', toSunlitPlainsFromLighthouse:'\u{1F6AA}',
  lighthouseStairsUp:'\u{1FA9C}', lighthouseStairsDown:'\u{1FA9C}', toLakesideRuins:'\u{1F6AA}', toSunlitPlainsFromLakeside:'\u{1F6AA}',
  toCursedCemetery:'\u{1F6AA}', toSunlitPlainsFromCemetery:'\u{1F6AA}', tombSealed:'\u{1F512}',
  toDarkCrypt:'\u{1F6AA}', toCursedCemeteryFromCrypt:'\u{1F6AA}', toDefilerTomb:'\u{1F6AA}', fromDefilerTomb:'\u{1F6AA}', cemStatue:'\u271D',
  toLakeFromSunken:'\u{1F6AA}', waypoint:'W', waypointMtn:'W', waypointSun:'W', waypointLighthouse1:'W', waypointForgottenTower:'W', toTownFromTower:'\u{1F6AA}', waypointLighthouse5:'W',
  barShop:'\u{1F37A}', bardShop:'\u{1F3B6}', gamblerShop:'\u{1F3B2}', studyRuins:'\u{1F4DC}', toAncientRuins:'\u{1F6AA}', toLakesideFromRuins:'\u{1F6AA}', ruinsDown:'\u{1FA9C}', ruinsUp:'\u{1FA9C}', waypointAncientRuins:'W', waypointFhd:'W',
  toFrosthold:'\u{1F6AA}', toMountainPassFromFrost:'\u{1F6AA}', fhSealed:'\u{1F512}', fhDungeonKeyhole:'\u{1F511}', toRedridge:'\u{1F6AA}', toFrostholdFromRedridge:'\u{1F6AA}', redridgeEastSealed:'\u{1F512}', wayfarer:'\u{1F4AC}', rrTower:'\u{1F3F0}', rrTowerExit:'\u{1F6AA}', hwToCanyon:'\u{1F6AA}', hwUp:'\u2B06', rrUp:'\u2B06', rrDown:'\u2B07', hwDown:'\u2B07', hwEastLocked:'\u{1F512}', hwEastOpen:'\u{1F300}', hwAltar:'\u{1F4A0}', hwReturn:'\u{1F300}', hwSwitch:'\u2699', cliffToHighward:'\u{1F6AA}', toHarpyNest:'\u{1FAB6}', nestToCliff:'\u{1F6AA}', shadowKeepGate:'\u{1F6AA}', waypointCliff:'W', keepToCliff:'\u{1F6AA}', keepPrev:'\u{1F6AA}', keepNext:'\u{1F6AA}', keepLore:'\u{1F4DC}', keepBeacon:'\u{1F525}', waypointKeep:'W', keepStairs:'\u{1F573}', waypointHold:'W', breachToTown:'\u{1F300}', waypointRing:'W', ringPlace:'\u{1F4A0}', runeAltar:'\u{1F4A0}', breachEnter:'\u{1F300}', waypointHighward:'W', rrBeacon:'\u{1F525}', redridgeBridgeOpen:'\u{1F309}', waypointRedridge:'W', toRaptorLair:'\u{1F6AA}', toRedridgeEast:'\u{1F6AA}', toRedridgeWest:'\u{1F6AA}', toRedCrater:'\u{1F6AA}', toRedridgeFromCrater:'\u{1F6AA}', takeObsidianRune:'\u{1F48E}', obsidianSealed:'\u{1F512}', runeforge:'\u2692', toRedridgeFromLair:'\u{1F6AA}', lairDown:'\u25BC', lairUp:'\u25B2', shrineAltar:'\u2728', shrineSealed:'\u{1F512}', toIcySummit:'\u{1F6AA}', toIcyShrine:'\u{1F6AA}', toIcyCellar:'\u{1F6AA}', toMountainPassFromIcy:'\u{1F6AA}', waypointIcy:'W', snowWall:'\u2744', fhDungeonLocked:'\u{1F512}', fhdToKeep:'\u{1F6AA}', fhdPortalKeep:'\u{1F300}', fhdUp:'\u{1FA9C}', fhdDown:'\u{1FA9C}', takeRunestone2:'\u{1F4A0}', redridgeWall:'\u{1F512}', scholarRuins:'!', toFloodedTemple:'\u{1FA9C}', templeToRuins:'\u{1FA9C}', sunkenToTemple:'\u{1FA9C}', toTownFromRuins:'\u{1F6AA}', inspectTomb:'\u{1F50D}', talkGraverobbers:'!', scholarTalk:'!',
  waypointLakeside:'W', waypointDeep:'W', shrineToTown:'\u{1F300}', waypointMarsh:'W', waypointHighlands:'W', toHighlands:'\u{1F6AA}', toMarshFromHighlands:'\u{1F6AA}', toPassFromHighlands:'\u{1F6AA}', toBlackMarsh:'\u{1F6AA}', toLakesideFromMarsh:'\u{1F6AA}', forgottenSealed:'\u{1F512}', toForgottenTower:'\u{1F6AA}', toMarshFromTower:'\u{1F6AA}', toWitchCamp:'\u{1F300}', marshCauldron:'\u{1F9EA}', talkWitchTower:'\u{1F4AC}', waypointCemetery:'W', waypointDarkCrypt:'W', openCrypt:'\u26B0', waypointLocked:'\u{1F512}',
  stash:'S', townCat:'\u{1F408}', townsfolk:'\u{1F4AC}', locketWoman:'\u{1F4AC}', dockCaptain:'\u{1F4AC}',
  barkeeper:'!', toTavern:'\u{1F6AA}', tavernLocked:'\u{1F512}', toTownFromTavern:'\u{1F6AA}',
  tavernStairsUp:'\u{1FA9C}', tavernStairsDown:'\u{1FA9C}', tavernLogout:'\u{1F6CF}', beacon:'\u{1F4A1}', lighthouseClearPortal:'\u{1F6AA}',
};
// (v157) items the player dropped are no longer auto-picked up: an interact button appears next to them
function nearestDroppedItem(){
  const g = game, p = g && g.player;
  if(!g || !p || !g.loot) return null;
  let best=null, bd=1e9;
  for(const l of g.loot){
    if(!lootIsManual(l) || l.type!=='item' || l.dropGrace>0) continue;
    const d = dist(l,p);
    if(d < l.r+p.r+34 && d<bd){ bd=d; best=l; }
  }
  return best;
}
function pickupNearbyDropped(){
  const g = game, p = g.player, l = nearestDroppedItem();
  if(!l) return;
  if(addToBag(p, l.item)){ const eq = tryAutoEquip(p, l.item); showMsg(eq ? 'Equipped: '+l.item.name : l.item.name, 1.2); bagPulse(); const i=g.loot.indexOf(l); if(i>=0) g.loot.splice(i,1); }
  else showMsg(fullMsgFor(l.item), 1.0);
}
function updateInteractPrompt(kind){
  if(!kind && game && typeof roadEvKind==='function') kind = roadEvKind(game);   // v529 road encounters
  if(!kind && nearestDroppedItem()) kind = 'pickupItem';
  interactKind = kind;
  if(!kind){ btnInteract.style.display = 'none'; return; }
  // v492: a fat, bold down-arrow for pick-up (a drawn shape, so it stays heavy on every phone font)
  const it = kind==='pickupItem' && nearestDroppedItem();
  if(it) interactLbl.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M9 2.5h6v9.5h4.6L12 21.5 4.4 12H9z" fill="currentColor" stroke="#000" stroke-width="1" stroke-linejoin="round"/></svg>';
  else interactLbl.textContent = INTERACT_ICONS[kind] || '?';
  // v489: the pick-up arrow takes the item's quality colour (grey / blue / yellow ...)
  interactLbl.style.color = it && it.item ? (it.item.color || '') : '';
  interactLbl.style.fontSize = ''; interactLbl.style.fontWeight = '';
  btnInteract.title = INTERACT_LABELS[kind] || 'Interact';
  btnInteract.style.display = 'flex';
}
bindBtn(btnInteract, ()=>{
  if(interactKind==='pickupItem') pickupNearbyDropped();
  else if(/^road[A-Z]|^cellarExit$/.test(interactKind||'')) roadEvInteract(interactKind);   // v529
  else if(interactKind==='rescueHunter') rescueHunterNow();
  else if(interactKind==='shop') openBlacksmithMenu();
  else if(interactKind==='toForest') enterForest();
  else if(interactKind==='toTown') goToTownFromForest();
  else if(interactKind==='toFhTower') enterFhTower(1);
  else if(interactKind==='lairExit'){ if(game.scene==='minotaurcave') enterRiverValley('minotaurcave'); else enterForest(game.scene); }
  else if(interactKind==='fhtToKeep' || interactKind==='fhtPortalKeep') enterFrosthold({fromTower:true});
  else if(interactKind==='waypointFrosthold') openTeleportMenu('frosthold');
  else if(interactKind==='fhtUp') fhtStairsUp();
  else if(interactKind==='fhtDown') fhtStairsDown();
  else if(interactKind==='toFhDungeon') enterFhDungeon(1);
  else if(interactKind==='fhdToKeep' || interactKind==='fhdPortalKeep') enterFrosthold({fromDungeon:true});
  else if(interactKind==='fhdUp') enterFhDungeon(game.ruins.floor-1, {atStairs:true});
  else if(interactKind==='fhdDown') enterFhDungeon(game.ruins.floor+1);
  else if(interactKind==='takeRunestone2') takeRunestone2();
  else if(interactKind==='toMountainDepths') enterDeep(1);
  else if(interactKind==='depthsToPass') enterMountainPass({fromDepths:true});
  else if(interactKind==='depthsMiner') talkMiner();
  else if(interactKind==='deepUp') deepStairsUp();
  else if(interactKind==='waypointDeep') openTeleportMenu('deep');
  else if(interactKind==='shrineToTown') goToTownSafe();
  else if(interactKind==='deepDown') deepStairsDown();
  else if(interactKind==='quest') talkToQuestGiver();
  else if(interactKind==='well') drinkFromWell();
  else if(interactKind==='townCat') openSupport(true);
  else if(interactKind==='townsfolk' || interactKind==='dockCaptain') talkTownTip(game._tipNpcNear);   // v490
  else if(interactKind==='locketWoman') talkLocketWoman();   // v519
  else if(interactKind==='bonfireHunter') openHunterDialogue();
  else if(interactKind==='toSpiderLair') enterSpiderLair();
  else if(interactKind==='toBearCave') enterBearCave();
  else if(interactKind==='toMountainPass') enterMountainPass();
  else if(interactKind==='toForestFromMountain') enterHighlands({fromPass:true});
  else if(interactKind==='toSunlitPlains') enterSunlitPlains();
  else if(interactKind==='toForestFromSunlit') enterRiverValley('sunlitplains');
  else if(interactKind==='toRiverValley') enterRiverValley();
  else if(interactKind==='toForestFromRiver') enterForest('rivervalley');
  else if(interactKind==='toSunlitPlainsFromRiver') enterSunlitPlains('river');
  else if(interactKind==='waypointRiver') openTeleportMenu('rivervalley');
  else if(interactKind==='toMinotaurCave') enterMinotaurCave();
  else if(interactKind==='toLighthouseTower') enterLighthouseTower(1);
  else if(interactKind==='toSunlitPlainsFromLighthouse') enterSunlitPlains('lighthouse');
  else if(interactKind==='lighthouseStairsUp') lighthouseAscend();
  else if(interactKind==='lighthouseStairsDown') lighthouseDescend();
  else if(interactKind==='toLakesideRuins') enterLakesideRuins();
  else if(interactKind==='toSunlitPlainsFromLakeside') enterSunlitPlains('lakeside');
  else if(interactKind==='toCursedCemetery') enterCursedCemetery();
  else if(interactKind==='toSunlitPlainsFromCemetery') enterSunlitPlains('cemetery');
  else if(interactKind==='tombSealed') showMsg('This tomb is sealed. Touch the statue.', 1.8);
  else if(interactKind==='cemStatue'){ if(game.cem && !(game.cem.evt && game.cem.evt.stage>0) && !game.player.cemeteryCleared) startCemeteryEvent(game); }
  else if(interactKind==='toDefilerTomb' || interactKind==='fromDefilerTomb'){
    const c = game.crypt, p = game.player; if(c){
      const to = interactKind==='toDefilerTomb' ? {x:c.tombDoor.x, y:c.tombDoor.y-70} : {x:c.hallDoor.x, y:c.hallDoor.y+70};
      game.particles.push({type:'ring', x:p.x, y:p.y, t:0.4, max:0.4, r:60, color:'#7a5cff'});
      p.x = to.x; p.y = to.y; p.facing = interactKind==='toDefilerTomb' ? {x:0,y:-1} : {x:0,y:1};
      for(const f of (game.followers||[])){ f.x = to.x + rand(-20,20); f.y = to.y + rand(-10,20); }
      game.particles.push({type:'ring', x:to.x, y:to.y, t:0.4, max:0.4, r:60, color:'#7a5cff'});
    } }
  else if(interactKind==='toDarkCrypt') enterDarkCrypt();
  else if(interactKind==='toCursedCemeteryFromCrypt') enterCursedCemetery('crypt');
  else if(interactKind==='waypoint') openTeleportMenu('town');
  else if(interactKind==='waypointMtn') openTeleportMenu('mountainpass');
  else if(interactKind==='waypointSun') openTeleportMenu('sunlitplains');
  else if(interactKind==='waypointLighthouse1') openTeleportMenu('lighthouse1');
  else if(interactKind==='waypointLighthouse5') openTeleportMenu('lighthouse5');
  else if(interactKind==='waypointLakeside') openTeleportMenu('lakeside');
  else if(interactKind==='toBlackMarsh') enterBlackMarsh();
  else if(interactKind==='toHighlands') enterHighlands({fromMarsh:true});
  else if(interactKind==='toMarshFromHighlands') enterBlackMarsh({fromHighlands:true});
  else if(interactKind==='toPassFromHighlands') enterMountainPass();
  else if(interactKind==='waypointHighlands') openTeleportMenu('highlands');
  else if(interactKind==='toLakesideFromMarsh') enterLakesideRuins({fromMarsh:true});
  else if(interactKind==='toForgottenTower') enterForgottenTower(1);
  else if(interactKind==='toMarshFromTower') enterBlackMarsh({fromTower:true});
  else if(interactKind==='toWitchCamp') enterBlackMarsh({atCauldron:true});   // v517
  else if(interactKind==='toLakeFromSunken') enterLakesideRuins({fromRuins:true});   // v507: the island in the middle of the Lakeside Ruins
  else if(interactKind==='toTownFromTower') (game.tower && (game.tower.subzone || game.tower.deep)) ? goToTownFromBoss() : goToTownSafe();
  else if(interactKind==='toSunkenDepths') enterSunkenDepths();
  else if(interactKind==='sunkenToLakeside') enterLakesideRuins({fromSunken:true});
  else if(interactKind==='toMarshPool') enterMarshPool();
  else if(interactKind==='poolToMarsh') enterBlackMarsh({fromPool:true});
  else if(interactKind==='waypointForgottenTower') openTeleportMenu('forgottentower');
  else if(interactKind==='marshCauldron') witchCauldronInteract();
  else if(interactKind==='talkWitchTower') witchTowerInteract();
  else if(interactKind==='forgottenSealed') showMsg('A fog-choked gate. The Forgotten Tower lies beyond -- it will not open yet.', 2.6);
  else if(interactKind==='waypointMarsh') openTeleportMenu('marsh');
  else if(interactKind==='waypointCemetery') openTeleportMenu('cemetery');
  else if(interactKind==='waypointDarkCrypt') openTeleportMenu('darkcrypt');
  else if(interactKind==='openCrypt'){ const tm = game.crypt && game.crypt.tomb; if(tm && tm.state==='closed'){ tm.state='opening'; tm.t=2.0; showMsg('The crypt lid grinds open...', 2.0, '#b9a8ff'); shakeScreen(game, 6, 1.6); updateInteractPrompt(null); } }
  else if(interactKind==='waypointLocked') showMsg("You haven't discovered this route yet.", 2.0);
  else if(interactKind==='stash') openStash();
  else if(interactKind==='barkeeper') talkToBarkeeper();
  else if(interactKind==='toTavern') enterTavern();
  else if(interactKind==='tavernLocked') showMsg('Closed: supply ships can\'t dock when the lighthouse beacon is off.', 3.0);
  else if(interactKind==='toTownFromTavern') goToTownFromTavern();
  else if(interactKind==='tavernStairsUp') tavernGoUpstairs();
  else if(interactKind==='tavernStairsDown') tavernGoDownstairs();
  else if(interactKind==='tavernLogout') logOutToTitle();
  else if(interactKind==='beacon') turnOnBeacon();
  else if(interactKind==='lighthouseClearPortal') enterSunlitPlains('lighthouse');
  else if(interactKind==='barShop'){ const bq = getQuest(game.player, QUEST_LIGHT_THE_WAY.id); if(bq && bq.status==='active' && bq.stage==='return') talkToBarkeeper(); else openShop('bar'); }   // v198: the turn-in happens at the bar
  else if(interactKind==='bardShop') openShop('bard');
  else if(interactKind==='gamblerShop') openShop('gambler');
  else if(interactKind==='studyRuins') studyLakesideRuins();
  else if(interactKind==='toAncientRuins') enterAncientRuins(1);
  else if(interactKind==='toLakesideFromRuins') enterLakesideRuins({fromRuins:true});
  else if(interactKind==='ruinsDown') enterAncientRuins(game.ruins.floor+1);
  else if(interactKind==='ruinsUp') enterAncientRuins(game.ruins.floor-1, {atStairs:true});
  else if(interactKind==='waypointAncientRuins') openTeleportMenu('ancientruins');
  else if(interactKind==='waypointFhd') openTeleportMenu('fhd');
  else if(interactKind==='toIcySummit') enterIcyZone('summit', game.scene==='icyzone' ? game.iz.kind : 'pass');
  else if(interactKind==='toIcyShrine') enterIcyZone('shrine', 'summit');
  else if(interactKind==='toIcyCellar') enterIcyZone('cellar', 'summit');
  else if(interactKind==='toMountainPassFromIcy') enterMountainPass({fromSummit:true});
  else if(interactKind==='waypointIcy') openTeleportMenu('icysummit');
  else if(interactKind==='shrineAltar') claimShrineBlessing();
  else if(interactKind==='shrineInsert') insertShrineRunestone();
  else if(interactKind==='toFrosthold'){ game.player.frostholdUnlocked = true; enterFrosthold(); }
  else if(interactKind==='snowWall') showMsg('A towering wall of packed snow blocks the way to Frosthold Keep.', 2.6, '#bfe3ff');
  else if(interactKind==='fhDungeonKeyhole') placeFhKey();
  else if(interactKind==='fhDungeonLocked') showMsg('Locked. The great door will not budge without its key.', 2.4);
  else if(interactKind==='redridgeWall') showMsg('A wall of ancient dwarven machinery seals the pass. It hums faintly.', 2.6, '#ffc27a');
  else if(interactKind==='toMountainPassFromFrost') enterMountainPass({fromFrost:true});
  else if(interactKind==='toRedridge') enterRedridge('frost');
  else if(interactKind==='toFrostholdFromRedridge') enterFrosthold({fromRedridge:true});
  else if(interactKind==='redridgeEastSealed') showMsg('The gate is dark and its portal sleeps. Three Templar watchtowers must be lit first.', 3.0);
  else if(interactKind==='wayfarer') talkWayfarer();
  else if(interactKind==='rrTower'){ const tw = game._rrTowerNear; if(tw) enterRRTower(tw.id); }
  else if(interactKind==='rrTowerExit') enterRedridge('tower', {atTower:true, towerId:game.tower.rrId, part:game.tower.rrId===1 ? 'west' : 'east'});
  else if(interactKind==='rrBeacon') lightRRBeacon();
  else if(interactKind==='rrUp') rrGoFloor(1);
  else if(interactKind==='rrDown') rrGoFloor(-1);
  else if(interactKind==='redridgeBridgeOpen') enterHighward(1, {from:'landing'});
  else if(interactKind==='hwToCanyon'){ hwStoreSave(game); enterRedridge('bridge', {atBridge:true}); }
  else if(interactKind==='hwUp') enterHighward(game.tower.hwFloor+1, {from:'below'});
  else if(interactKind==='hwDown') enterHighward(game.tower.hwFloor-1, {from:'above'});
  else if(interactKind==='waypointHighward') openTeleportMenu('highward');
  else if(interactKind==='hwEastLocked') showMsg('The eastern gate is sealed. A switch in the Ancient Warden\u2019s sanctum, at the top of the fortress, will open it.', 3.6);
  else if(interactKind==='hwAltar') takeHwRunestone();
  else if(interactKind==='hwReturn'){ hwStoreSave(game); enterHighward(1, {from:'cliffside'}); showMsg('The portal carries you down to the eastern gates.', 2.6, '#ffe08a'); }
  else if(interactKind==='hwSwitch') pullHwSwitch();
  else if(interactKind==='hwEastOpen') enterCliffside({});
  else if(interactKind==='cliffToHighward') enterHighward(1, {from:'cliffside'});
  else if(interactKind==='toHarpyNest') enterCliffside({nest:true});
  else if(interactKind==='nestToCliff') enterCliffside({fromNest:true});
  else if(interactKind==='waypointCliff') openTeleportMenu('cliffside');
  else if(interactKind==='shadowKeepGate'){
    if(hasAllRunestones(game.player)){ game.player.skGateOpen = true; showBigMsg('SHADOW KEEP', 'The three runestones answer. The wards part.', 3.2); enterKeep(1, {from:'cliff'}); }
    else showMsg('The gate of Shadow Keep stands sealed. Templar wards burn along its arch, waiting on the three runestones: the Defensive, the Offensive and the Templar.', 5.0);
  }
  else if(interactKind==='keepToCliff'){ kpStoreSave(game); enterCliffside({fromKeep:true}); }
  else if(interactKind==='keepPrev'){ if(game.tower.kpArea===9) enterKeep(7, {from:'breach'}); else enterKeep(game.tower.kpArea===7 ? 3 : game.tower.kpArea-1, {from:'next'}); }
  else if(interactKind==='keepNext'){ if(game.tower.kpArea===7 && !game.player.wraithLordSlain) showMsg('The passage beyond the breach is sealed by the Wraith Lord’s will. Destroy him first.', 4.0); else if(game.tower.kpArea===9){ enterKeep(9, {bf:game.tower.bf+1, seed:(Date.now()%100000)}); } else enterKeep(game.tower.kpArea+1, {}); }
  else if(interactKind==='waypointHold') openTeleportMenu('hold');
  else if(interactKind==='waypointRing') openTeleportMenu('ring');
  else if(interactKind==='ringPlace') placeRunestones();
  else if(interactKind==='runeAltar') openRuneAltar(game._altarNear);
  else if(interactKind==='breachEnter') enterBreach();
  else if(interactKind==='breachToTown') goToTownFromBoss();
  else if(interactKind==='keepLore') readKeepLore(game._keepLoreNear);
  else if(interactKind==='waypointKeep') openTeleportMenu('keep');
  else if(interactKind==='keepBeacon') lightKeepBeacon(game._beaconNear);
  else if(interactKind==='keepStairs'){ const bt = game.tower.beacons; if(bt && !bt.every(b=>b.lit)) showMsg('The stairs are sealed. Light the beacons to open the way  ('+bt.filter(b=>b.lit).length+'/3)', 4.2, '#ffcf7a'); else enterKeep(7, {}); }
  else if(interactKind==='waypointRedridge') openTeleportMenu('redridge');
  else if(interactKind==='toRaptorLair') enterRaptorLair(1);
  else if(interactKind==='toRedridgeEast') enterRedridge('west', {part:'east', fromWest:true});
  else if(interactKind==='toRedridgeWest') enterRedridge('east', {part:'west', fromEast:true});
  else if(interactKind==='toRedCrater') enterRedCrater();
  else if(interactKind==='toRedridgeFromCrater') enterRedridge('crater', {atCrater:true});
  else if(interactKind==='takeObsidianRune') takeObsidianRune();
  else if(interactKind==='obsidianSealed') showMsg('The Obsidian Obelisk is guarded \u2014 Gojira still lives.', 2.4, '#ff9a6a');
  else if(interactKind==='runeforge') openShop('runeforge');
  else if(interactKind==='toRedridgeFromLair') enterRedridge('lair', {atLair:true});
  else if(interactKind==='lairDown') enterRaptorLair(2);
  else if(interactKind==='lairUp') enterRaptorLair(1, {atStairs:true});
  else if(interactKind==='inspectTomb') inspectSarcophagus();
  else if(interactKind==='scholarRuins') talkScholarRuins();
  else if(interactKind==='toFloodedTemple') enterFloodedTemple();
  else if(interactKind==='templeToRuins') enterAncientRuins(1, {atBoss:true});
  else if(interactKind==='sunkenToTemple') enterFloodedTemple({atStairs:true});
  else if(interactKind==='toTownFromRuins') goToTownFromBoss();
  else if(interactKind==='talkGraverobbers') talkGraverobbers();
  else if(interactKind==='scholarTalk') talkScholar();
  else if(interactKind==='fhSealed') showMsg('The way is sealed \u2014 this part of Frosthold is not open yet.', 2.4);
  else if(interactKind==='shrineSealed') showMsg(((game.player.shrineStage||0)>=1) ? 'The guardians stir -- defeat them!' : 'An ancient altar. A hollow in the stone waits for a runestone.', 2.4);
});
