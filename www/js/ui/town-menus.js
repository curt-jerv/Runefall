// ---------- Frosthold gate: Templar Runestone menu (v129) ----------
const runeOverlay = document.getElementById('runeOverlay');
const runeSlot = document.getElementById('runeSlot');
const runeEnterBtn = document.getElementById('runeEnterBtn');
const runeTextEl = document.getElementById('runeText');
let runeItem = null;   // the runestone currently sitting in the slot
function findRunestone(p){ return (p.inventory||[]).find(it=>it.questId==='templar_runestone'); }
function renderRuneMenu(){
  runeSlot.textContent = runeItem ? 'ᚱ' : '+';
  runeSlot.style.borderStyle = runeItem ? 'solid' : 'dashed';
  runeSlot.style.boxShadow = runeItem ? '0 0 20px #5fd0ff' : 'none';
  runeEnterBtn.style.opacity = runeItem ? '1' : '0.4';
}
function openRuneMenu(){
  game.modalOpen = true; runeItem = null;
  runeTextEl.textContent = 'A frost-rimed gate barred by ancient magic. A rune-shaped hollow waits in the stone. Click the slot to insert the Defensive Runestone, then press Enter.';
  renderRuneMenu();
  runeOverlay.style.display = 'flex';
}
function closeRuneMenu(){
  if(runeItem){ forceAddToBag(game.player, runeItem); runeItem = null; }   // unconfirmed: the rune returns to your bag
  runeOverlay.style.display = 'none';
  game.modalOpen = false;
}
runeSlot.addEventListener('click', ()=>{
  const p = game.player;
  if(runeItem){ forceAddToBag(p, runeItem); runeItem = null; }
  else {
    const it = findRunestone(p);
    if(!it){ runeTextEl.textContent = "You don't carry the Defensive Runestone. It lies in the chest at the bottom of the Ancient Ruins (Level 5)."; }
    else { p.inventory.splice(p.inventory.indexOf(it),1); runeItem = it; runeTextEl.textContent = 'The runestone settles into the hollow and begins to glow. Press Enter.'; }
  }
  renderRuneMenu();
});
function runeConfirm(){
  if(!runeItem){ runeTextEl.textContent = 'Insert the Defensive Runestone first.'; return; }
  runeItem = null;
  game.player.frostholdUnlocked = true;
  runeOverlay.style.display = 'none';
  game.modalOpen = false;
  showMsg('The runestone dissolves — the gate of Frosthold Keep grinds open.', 3.0);
  saveGame();
  enterFrosthold();
}
runeEnterBtn.addEventListener('click', runeConfirm);
document.getElementById('runeClose').addEventListener('click', closeRuneMenu);
window.addEventListener('keydown', (ev)=>{ if(ev.key==='Enter' && runeOverlay.style.display==='flex'){ ev.preventDefault(); runeConfirm(); } });

// ---------- Waypoint: Teleport menu ----------
// Shared by both waypoints -- the permanent one in Town and the permanent
// one in Mountain Pass (see makeMountainPass()'s `waypoint` landmark). The
// menu always hides whichever destination button matches where the player
// is teleporting FROM (no point offering "Mountain Pass" from a waypoint
// that's standing in Mountain Pass), and only offers "Abandoned Mine" once
// the player has actually unlocked a checkpoint beyond depth 1 -- the same
// condition that already gates the Town waypoint's own interactability.
const teleportTownBtn = document.getElementById('teleportTown');
const teleportMountainBtn = document.getElementById('teleportMountainPass');
const teleportHighlandsBtn = document.getElementById('teleportHighlands');
const teleportSunlitBtn = document.getElementById('teleportSunlitPlains');
const teleportRiverBtn = document.getElementById('teleportRiverValley');
const teleportLighthouse1Btn = document.getElementById('teleportLighthouse1');
const teleportLighthouse5Btn = document.getElementById('teleportLighthouse5');
const teleportLakesideBtn = document.getElementById('teleportLakeside');
const teleportBlackMarshBtn = document.getElementById('teleportBlackMarsh');
const teleportForgottenTowerBtn = document.getElementById('teleportForgottenTower');
const teleportCursedCemeteryBtn = document.getElementById('teleportCursedCemetery');
const teleportDarkCryptBtn = document.getElementById('teleportDarkCrypt');
const teleportAncientRuinsBtn = document.getElementById('teleportAncientRuins');
const teleportIcySummitBtn = document.getElementById('teleportIcySummit');
const teleportRedridgeBtn = document.getElementById('teleportRedridge');
const teleportHighwardBtn = document.getElementById('teleportHighward');
const teleportCliffsideBtn = document.getElementById('teleportCliffside');
const teleportKeepBtn = document.getElementById('teleportKeep');
const teleportHoldBtn = document.getElementById('teleportHold');
const teleportRingBtn = document.getElementById('teleportRing');
const teleportFrostholdBtn = document.getElementById('teleportFrosthold');
const teleportMineBtn = document.getElementById('teleportMine');
// v69: generalized from a hardcoded two-state (town/mountainpass) toggle
// to "show every destination except wherever you're standing" now that a
// third waypoint exists -- each button hides itself when `from` matches
// its own destination. Withered Crossroads is additionally gated on having
// actually reached it at least once (reachedSunlitPlains), same rule as
// the Mine option's checkpointDepth>1 gate -- Town's/Mountain Pass's own
// waypoint menus are only reachable at all once the player already has
// reachedMountainPass (see updateTown's waypointUnlocked), which does NOT
// imply Withered Crossroads has also been found (a separate branch off the
// Forest), so it needs its own explicit gate here.
// v490: a waypoint is discovered (saved and lit) when the player USES it -- pressing interact opens this menu --
// not just by walking past it. `from` -> that waypoint's save flag (Town's has none: it's always on).
const WAYPOINT_FLAG_BY_FROM = {mountainpass:'reachedMountainPass', highlands:'reachedHighlands', sunlitplains:'reachedSunlitPlains', rivervalley:'reachedRiverValley',
  lighthouse1:'reachedLighthouseTower', lighthouse5:'reachedLighthouseTowerTop', lakeside:'reachedLakesideRuins', deep:'reachedDeepWp', marsh:'reachedBlackMarsh',
  forgottentower:'reachedForgottenTower', cemetery:'reachedCursedCemetery', darkcrypt:'reachedDarkCrypt', ancientruins:'reachedAncientRuins', icysummit:'reachedIcySummit',
  frosthold:'reachedFrostholdWp', redridge:'reachedRedridge', highward:'reachedHighwardWp', cliffside:'reachedCliffWp', keep:'reachedKeepWp', hold:'reachedHoldWp', ring:'reachedRingWp', fhd:'reachedFhdWp'};
function openTeleportMenu(from){
  game.modalOpen = true;
  { const wf = WAYPOINT_FLAG_BY_FROM[from]; if(wf){ const fresh = !game.player[wf]; discoverWaypoint(wf); if(fresh) showMsg('Waypoint activated', 1.8, '#9fd8ff'); } }   // v490
  // Waypoint rework: Town is always listed (never gated on any discovery
  // flag -- see discoverWaypoint/updateTown's comment). Mountain Pass now
  // gates on reachedMountainPass too, same as every other zone below --
  // it used to be listed unconditionally, which meant it could show up as
  // a destination before the player had ever discovered its waypoint.
  teleportTownBtn.style.display = (from==='town') ? 'none' : '';
  teleportMountainBtn.style.display = (from!=='mountainpass' && game.player.reachedMountainPass) ? '' : 'none';
  teleportHighlandsBtn.style.display = (from!=='highlands' && game.player.reachedHighlands) ? '' : 'none';
  teleportSunlitBtn.style.display = (from!=='sunlitplains' && game.player.reachedSunlitPlains) ? '' : 'none';
  teleportRiverBtn.style.display = (from!=='rivervalley' && game.player.reachedRiverValley) ? '' : 'none';
  // v70: Lighthouse Tower has TWO waypoints (Level 1 and the rooftop Level
  // 5) rather than one -- each gated on having reached that specific floor
  // at least once (reachedLighthouseTower/reachedLighthouseTowerTop),
  // same rule as reachedSunlitPlains above, and each hides itself only
  // when `from` is that exact floor (so, e.g., standing at the Level 1
  // waypoint still offers a jump straight to Level 5 once discovered).
  teleportLighthouse1Btn.style.display = 'none';   // v489: Lighthouse floor-1 waypoint removed
  teleportLighthouse5Btn.style.display = 'none'; // rooftop waypoint removed
  // v71: Lakeside Ruins gets its own waypoint, gated on reachedLakesideRuins,
  // same rule as reachedSunlitPlains above.
  teleportLakesideBtn.style.display = 'none';   // v489: Lakeside waypoint removed
  teleportDeepBtn.style.display = (from!=='deep' && game.player.reachedDeepWp) ? '' : 'none';   // v489: Ember Caverns
  teleportBlackMarshBtn.style.display = (from!=='marsh' && game.player.reachedBlackMarsh) ? '' : 'none';
  teleportForgottenTowerBtn.style.display = (from!=='forgottentower' && game.player.reachedForgottenTower) ? '' : 'none';   // v340: listed right under Black Marsh
  // v72: Cursed Cemetery gets its own waypoint, gated on
  // reachedCursedCemetery, same rule as reachedSunlitPlains above.
  teleportCursedCemeteryBtn.style.display = 'none';   // v453: no Cursed Cemetery waypoint
  // v73: Dark Crypt gets its own waypoint, gated on reachedDarkCrypt, same
  // rule as reachedSunlitPlains/reachedCursedCemetery above.
  teleportDarkCryptBtn.style.display = (from!=='darkcrypt' && game.player.reachedDarkCrypt) ? '' : 'none';
  teleportAncientRuinsBtn.style.display = (from!=='ancientruins' && game.player.reachedAncientRuins) ? '' : 'none';
  teleportIcySummitBtn.style.display = (from!=='icysummit' && game.player.reachedIcySummit) ? '' : 'none';
  teleportFrostholdBtn.style.display = (from!=='frosthold' && game.player.reachedFrostholdWp) ? '' : 'none';
  teleportRedridgeBtn.style.display = (from!=='redridge' && game.player.reachedRedridge) ? '' : 'none';
  teleportHighwardBtn.style.display = (from!=='highward' && game.player.reachedHighwardWp) ? '' : 'none';
  teleportCliffsideBtn.style.display = (from!=='cliffside' && game.player.reachedCliffWp) ? '' : 'none';
  teleportKeepBtn.style.display = (from!=='keep' && game.player.reachedKeepWp) ? '' : 'none';
  teleportHoldBtn.style.display = (from!=='hold' && game.player.reachedHoldWp) ? '' : 'none';
  teleportRingBtn.style.display = 'none';
  teleportMineBtn.style.display = (from!=='fhd' && game.player.reachedFhdWp) ? '' : 'none';   // v282: now the Frosthold Dungeon waypoint (the old Mine waypoint is retired)
  teleportOverlay.style.display = 'flex';
}
function closeTeleportMenu(){
  if(game) game._spawnRoom = null;   // v283: whatever zone a waypoint drops you into, that arrival spot is the respawn spot
  teleportOverlay.style.display = 'none';
  game.modalOpen = false;
}
document.getElementById('teleportClose').addEventListener('click', closeTeleportMenu);
teleportTownBtn.addEventListener('click', ()=>{
  // From the Mountain Pass waypoint -- keeps gold, same shortcut-not-a-
  // punishment intent as the Mine option below, and lands the player
  // beside Town's own waypoint (see goToTown's nearWaypoint option).
  closeTeleportMenu();
  goToTown({wipeGold:false, nearWaypoint:true});
});
teleportHighlandsBtn.addEventListener('click', ()=>{ closeTeleportMenu(); enterHighlands({atWaypoint:true}); });
teleportMountainBtn.addEventListener('click', ()=>{
  // Waypoint rework: lands AT the zone's own waypoint marker, not the
  // generic Forest-gate entrance -- see enterMountainPass's opts.atWaypoint.
  closeTeleportMenu();
  enterMountainPass({atWaypoint:true});
});
teleportRiverBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterRiverValley('waypoint');
});
teleportSunlitBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterSunlitPlains('waypoint');
});
teleportLighthouse1Btn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterLighthouseTower(1, {atWaypoint:true});
});
teleportLighthouse5Btn.addEventListener('click', ()=>{
  // The rooftop has no waypoint marker of its own (see makeLighthouseFloor's
  // comment) -- lands at its regular entrance, same as always.
  closeTeleportMenu();
  enterLighthouseTower(LIGHTHOUSE_FLOOR_COUNT);
});
teleportLakesideBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterLakesideRuins({atWaypoint:true});
});
teleportBlackMarshBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterBlackMarsh({atWaypoint:true});
});
teleportForgottenTowerBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterForgottenTower(1);
});
teleportCursedCemeteryBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterCursedCemetery('waypoint');
});
teleportDarkCryptBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterDarkCrypt({atWaypoint:true});
});
teleportIcySummitBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterIcyZone('summit', 'waypoint', {atWaypoint:true});
});
teleportFrostholdBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterFrosthold({atWaypoint:true});
});
teleportHighwardBtn.addEventListener('click', ()=>{ closeTeleportMenu(); enterHighward(1, {from:'wp'}); });
teleportCliffsideBtn.addEventListener('click', ()=>{ closeTeleportMenu(); enterCliffside({atWaypoint:true}); });
teleportKeepBtn.addEventListener('click', ()=>{ closeTeleportMenu(); enterKeep(2, {from:'wp'}); });
teleportHoldBtn.addEventListener('click', ()=>{ closeTeleportMenu(); enterKeep(7, {from:'wp'}); });
teleportRingBtn.addEventListener('click', ()=>{ closeTeleportMenu(); enterKeep(7, {from:'wp'}); });
teleportRedridgeBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterRedridge('waypoint', {atWaypoint:true});
});
teleportAncientRuinsBtn.addEventListener('click', ()=>{
  closeTeleportMenu();
  enterFloodedTemple({atWaypoint:true});
});
const teleportDeepBtn = document.getElementById('teleportDeep');
teleportDeepBtn.addEventListener('click', ()=>{ closeTeleportMenu(); enterDeep(2, {atWaypoint:true}); });
teleportMineBtn.addEventListener('click', ()=>{
  // Frosthold Dungeon waypoint (this button's id is a leftover from the retired Abandoned Mine)
  closeTeleportMenu();
  enterFhDungeon(2, {atWaypoint:true});
});


// ---------- Blacksmith menu, quest and socketing (v164) ----------
const smithOverlay = document.getElementById('smithOverlay');
const SOCKETABLE = {helm:1, armor:1, boots:1, gloves:1, shield:1, weapon1h:1, weapon2h:1, bow:1, staff:1};
const MAX_SOCKETS = 3, SOCKET_COST_STEP = 1000;
function isSocketable(it){ return !!(it && SOCKETABLE[it.slotType]); }
// First socketing is free; every later one costs 1000g more than the last (1000, 2000, 3000, ...).
const UNIQUE_STONE_LEVEL = 40;   // v490
function socketCost(p){ return Math.min(SOCKET_COST_MAX, Math.max(0, p.socketUses||0) * SOCKET_COST_STEP); }
const SOCKET_COST_MAX = 3000;   // v464
function socketLineHtml(item){
  if(!isSocketable(item)) return '';
  const n = item.sockets||0;
  if(!n) return '';
  let h = '<div style="margin-top:6px;color:#c9b6ff;font-weight:600;">'+n+' socket'+(n>1?'s':'')+'</div>';
  for(let i=0;i<n;i++){
    const id = item.socketed && item.socketed[i];
    if(id){ const [k,t] = id.split('_'); if(PART_DEFS[k]) h += '<div style="color:'+PART_DEFS[k].color+'; font-size:11.5px;">\u25C6 '+partName(k,+t)+' ('+partDesc(k,+t)+')</div>'; }
    else h += '<div style="color:#7d6fa8; font-size:11.5px;">\u25C7 Empty socket</div>';
  }
  return h;
}
function socketButtonsHtml(item){
  const p = game.player;
  if(!isSocketable(item) || !(item.sockets>0)) return '';   // v490: socketing no longer waits for the witch
  let h = '<div style="margin-top:8px; display:flex; flex-direction:column; gap:5px;">';
  for(let i=0;i<item.sockets;i++){
    const id = item.socketed && item.socketed[i];
    if(id && PART_DEFS[id.split('_')[0]] && PART_DEFS[id.split('_')[0]].unique){ h += '<div style="text-align:center; color:#f2a31b; font-size:11.5px; padding:4px;">\u{1F512} '+PART_DEFS[id.split('_')[0]].name+' is bound forever</div>'; continue; }
    h += '<div class="partBtn" data-sock="'+i+'" style="text-align:center;">'+(id ? 'Remove '+partName(id.split('_')[0], +id.split('_')[1]) : 'Socket a part into socket '+(i+1))+'</div>';
  }
  return h+'</div>';
}
function curDetailItem(){
  const p = game.player;
  return itemDetailSource==='equipped' ? p.equipment[pendingIdx] : itemDetailSource==='stash' ? stash.items[pendingIdx] : p.inventory[pendingIdx];
}
function afterSocketChange(){
  const p = game.player;
  recalcStats(p); saveGame();
  openItemDetail(pendingIdx, itemDetailSource);
  try{ renderInventory(); }catch(e){}
}
const partPickOverlay = document.getElementById('partPickOverlay');
function openPartPicker(cb){
  const p = game.player, list = document.getElementById('partPickList');
  const ids = Object.keys(p.parts||{}).sort();
  list.innerHTML = ids.length ? ids.map(id=>{
    const [k,t] = id.split('_'), d = PART_DEFS[k];
    return '<div class="partCard'+(d.unique?' uq':'')+'"><div class="pIcon">'+d.icon+'</div><div class="pMain" style="color:'+d.color+'"><b>'+partName(k,+t)+'</b> \u00d7'+p.parts[id]+'<div class="pSub">'+partDesc(k,+t)+'</div></div><div class="partBtn" data-pick="'+id+'">'+(d.unique?'Bind forever':'Socket')+'</div></div>';
  }).join('') : '<div style="color:var(--bone-dim); font-size:12px; padding:8px;">You have no parts. Harvest them from monsters or buy some from the Witch.</div>';
  list._cb = cb;
  partPickOverlay.style.display = 'flex';
}
document.getElementById('partPickClose').addEventListener('click', ()=>{ partPickOverlay.style.display='none'; });
document.getElementById('partPickList').addEventListener('click', e=>{
  const b = e.target.closest('[data-pick]'); if(!b) return;
  const cb = document.getElementById('partPickList')._cb;
  partPickOverlay.style.display = 'none';
  if(cb) cb(b.dataset.pick);
});
document.getElementById('itemDetailStats').addEventListener('click', e=>{
  const b = e.target.closest('[data-sock]'); if(!b) return;
  if(performance.now()-itemDetailOpenedAt < ITEM_DETAIL_GUARD_MS*3) return;   // v402: ignore the tap that opened the card (it landed on a socket button)
  const i = +b.dataset.sock, item = curDetailItem(), p = game.player;
  if(!item) return;
  if(!item.socketed) item.socketed = [];
  if(item.socketed[i]){
    const [k,t] = item.socketed[i].split('_');
    if(PART_DEFS[k] && PART_DEFS[k].unique){ showMsg('A unique stone can never be removed', 2.0, '#f2a31b'); return; }
    // v490: pulling a Perfect part back out cracks it down to a Greater part
    const back = (+t>=3 && PART_DEFS[k] && !PART_DEFS[k].stone && !PART_DEFS[k].quest) ? 2 : +t;
    addPart(p,k,back); item.socketed[i] = null;
    if(back < +t) showMsg('The '+partName(k,+t)+' cracks as it comes out: '+partName(k,back), 2.6, PART_DEFS[k].color);
    afterSocketChange();
  } else {
    openPartPicker(id=>{
      const [k,t] = id.split('_');
      if(PART_DEFS[k] && PART_DEFS[k].stone && item.socketed.some(s=>s && PART_DEFS[s.split('_')[0]] && PART_DEFS[s.split('_')[0]].stone)){ showMsg('Only one Stone can be socketed per item', 2.0); return; }
      // v490: amber (unique) stones need character level 40
      if(PART_DEFS[k] && PART_DEFS[k].unique && (p.level||1) < UNIQUE_STONE_LEVEL){ showMsg('Amber stones need character level '+UNIQUE_STONE_LEVEL+' to socket (you are '+(p.level||1)+')', 2.6, '#f2a31b'); return; }
      // v490: only one stone of each kind across everything you wear
      if(PART_DEFS[k] && PART_DEFS[k].stone){
        const worn = Object.values(p.equipment||{}).some(e=>e && e!==item && e.socketed && e.socketed.some(s=>s && s.split('_')[0]===k));
        if(worn && itemDetailSource==='equipped'){ showMsg('You already wear a '+PART_DEFS[k].name+'. Only one of each stone can be socketed in your gear.', 2.8); return; }
        if(worn) showMsg('You already wear a '+PART_DEFS[k].name+' \u2014 only one counts while both are worn', 2.6);
      }
      if(PART_DEFS[k] && PART_DEFS[k].unique){
        const eqHas = Object.values(p.equipment||{}).some(e=>e && e!==item && e.socketed && e.socketed.some(s=>s && PART_DEFS[s.split('_')[0]] && PART_DEFS[s.split('_')[0]].unique));
        if(eqHas){ showMsg('Only 1 unique stone can be equipped at a time', 2.4, '#f2a31b'); return; }
      }
      if(!takePart(p,k,+t)) return;
      item.socketed[i] = id; afterSocketChange();
    });
  }
});
function hasHammer(p){ return (p.inventory||[]).some(it=>it && it.questId==='ancient_hammer'); }
function smithState(p){
  if(p.smithSockets) return 'done';
  return hasHammer(p) ? 'turnin' : 'none';
}
const SMITH_TEXT = {
  none:'"Mind the forge. Take a look at my wares."',
  offer:'"Bring me the Ancient Smithing Hammer from the Frosthold Commander and I will put its power to work on your gear."',
  active:'"The Commander of Frosthold carries it. Look for him at the top of the tower at the east gate of the Keep."',
  turnin:'"The Ancient Smithing Hammer! Hand it here."',
  done:'"I can cut sockets for beast parts now. Your first is free."',
};
function openBlacksmithMenu(){
  const p = game.player, st = smithState(p);
  game.modalOpen = true;
  { let stx = SMITH_TEXT[st]; if(st==='offer'){ const hq0 = getQuest(p, QUEST_FIND_HUNTERS.id); if(!(hq0 && hq0.status==='complete')) stx = stx.replace(/^"You brought those hunters home -- good\. Then you can hear/, '"Listen, traveler, and hear'); } document.getElementById('smithText').textContent = stx; }
  const qb = document.getElementById('smithQuestBtn');
  qb.style.display = (st==='offer' || st==='turnin') ? '' : 'none';
  qb.textContent = st==='turnin' ? 'Hand Over the Hammer' : 'Accept Quest';
  const smithRune = hasItemQ(p,'obsidian_runestone') && !p.runeforgeUnlocked;
  if(smithRune){ document.getElementById('smithText').textContent = SMITH_RUNE_TEXT; qb.style.display = ''; qb.textContent = 'Give the Obsidian Obelisk'; qb.dataset.mode = 'rune'; } else { qb.dataset.mode = ''; if(p.runeforgeUnlocked) document.getElementById('smithText').textContent += ' "The Obsidian Forge beside me is yours whenever you dare."'; }
  document.getElementById('smithSocketBtn').style.display = p.smithSockets ? '' : 'none';
  smithOverlay.style.display = 'flex';
}
function closeBlacksmithMenu(){ smithOverlay.style.display = 'none'; game.modalOpen = false; }
document.getElementById('smithClose').addEventListener('click', closeBlacksmithMenu);
document.getElementById('smithShopBtn').addEventListener('click', ()=>{ closeBlacksmithMenu(); openShop(); });
document.getElementById('smithSocketBtn').addEventListener('click', ()=>{ closeBlacksmithMenu(); openShop('socket'); });
document.getElementById('smithQuestBtn').addEventListener('click', ()=>{
  const p = game.player, st = smithState(p);
  if(document.getElementById('smithQuestBtn').dataset.mode==='rune'){ giveRuneToSmith(); openBlacksmithMenu(); return; }
  if(st==='offer'){
    if(!p.quests) p.quests = [];
    const held = hasHammer(p);
    p.quests.push({id:QUEST_HAMMER.id, name:QUEST_HAMMER.name, desc:held?QUEST_HAMMER.descReturn:QUEST_HAMMER.desc, status:'active', progress:held?QUEST_HAMMER.total:0, total:QUEST_HAMMER.total, stage:held?'return':undefined});
    showMsg('Quest accepted: '+QUEST_HAMMER.name, 2.2);
    updateQuestBadge(); saveGame();
    openBlacksmithMenu();
  } else if(st==='turnin'){
    p.inventory = p.inventory.filter(it=>!(it && it.questId==='ancient_hammer'));
    const q = getQuest(p, QUEST_HAMMER.id);
    if(q){ q.status = 'complete'; q.rewarded = true; q.progress = q.total; q.desc = QUEST_HAMMER.descDone; }
    p.smithSockets = true;
    gainXp(game, Math.round(xpForKill(44, true)*3));
    showMsg('Socketing unlocked — Brom can now socket your gear', 3.0);
    updateQuestBadge(); bagPulse(); saveGame();
    openBlacksmithMenu();
  }
});
// -- the socket screen: reuses the vendor overlay; the left column becomes a "socket bench" you drop gear onto --
function socketMode(){ return game && (game.openVendor==='socket' || game.openVendor==='runeforge') && shopOverlay.style.display==='flex'; }
let benchSetAt = 0;
document.getElementById('socketBench').addEventListener('click', ev=>{
  // tap the item sitting on the bench to take it back off (it never left your bag/equipment)
  if(performance.now()-benchSetAt < 450) return;
  if(!game || !game.socketItem) return;
  if(ev.target && ev.target.closest && ev.target.closest('#socketBenchItem')){ game.socketItem = null; renderSocketPanel(); }
});
function socketBenchSet(item){
  benchSetAt = performance.now();
  game.forgeMsg = null; game.forgeArm = null;
  if(game.openVendor==='runeforge'){
    if(!runeforgeEligible(item)){ showMsg((it0=>it0&&(it0.runeforged||0)>=2 ? 'This item has already been through the Obsidian Forge twice' : 'Only weapons, armor and jewelry can be forged')(item), 1.8, '#ffd93a'); return; }
    game.socketItem = item; renderSocketPanel(); return;
  }
  if(!isSocketable(item)){ showMsg('Only weapons and armor can be socketed', 1.6, '#ffd93a'); return; }
  game.socketItem = item;
  renderSocketPanel();
}
function renderSocketPanel(){
  if(game.openVendor==='runeforge'){ renderRuneforgePanel(); return; }
  const p = game.player;
  let it = game.socketItem;
  if(it && p.inventory.indexOf(it)<0 && !Object.keys(p.equipment||{}).some(k=>p.equipment[k]===it)){ it = game.socketItem = null; }
  const bench = document.getElementById('socketBench');
  bench.classList.toggle('hasItem', !!it);
  document.getElementById('socketBenchEmpty').style.display = it ? 'none' : '';
  const holder = document.getElementById('socketBenchItem');
  const n = it ? (it.sockets||0) : 0;
  if(it){
    let dots = '';
    for(let i=0;i<MAX_SOCKETS;i++) dots += '<span class="sockDot'+(i<n?' on':'')+'"></span>';
    holder.innerHTML =
      '<div style="color:'+it.color+'; font-weight:700; font-size:14px;">'+it.name+'</div>'+
      '<div style="font-size:11px; letter-spacing:.04em; text-transform:uppercase; margin-bottom:6px;">'+itemSubtitle(it)+'</div>'+
      it.affixes.map(a=>'<div>'+affixTooltipLine(a)+'</div>').join('')+
      '<div class="sockRow">'+dots+'</div>';
  } else holder.innerHTML = '';
  const cost = socketCost(p);
  const maxed = it && n>=MAX_SOCKETS;
  document.getElementById('socketInfo').innerHTML =
    (it ? 'Sockets: <b style="color:#c9b6ff">'+n+' / '+MAX_SOCKETS+'</b><br>' : '')+
    (maxed ? 'This item cannot hold more sockets.' : 'Next socketing: <b style="color:'+(cost===0?'#7fe07f':(p.gold>=cost?'#e8c44a':'#ff8a6a'))+'">'+(cost===0?'FREE':cost+'g')+'</b>');
  const btn = document.getElementById('socketDoBtn');
  btn.textContent = maxed ? 'Fully Socketed' : (cost===0 ? 'Add Socket — Free' : 'Add Socket — '+cost+'g');
  btn.style.opacity = (!it || maxed) ? '0.45' : '1';
}
document.getElementById('socketDoBtn').addEventListener('click', ()=>{
  if(game.openVendor==='runeforge'){ runeforgeDo(); return; }
  const p = game.player, it = game.socketItem;
  if(!it){ showMsg('Place a weapon or armor piece on the bench first', 1.6, '#ffd93a'); return; }
  if((it.sockets||0) >= MAX_SOCKETS){ showMsg('That item already has '+MAX_SOCKETS+' sockets', 1.6, '#ffd93a'); return; }
  const cost = socketCost(p);
  if(p.gold < cost){ showMsg('Not enough gold ('+cost+'g needed)', 1.8, '#ff8a6a'); return; }
  p.gold -= cost; p.socketUses = (p.socketUses||0) + 1;
  it.sockets = (it.sockets||0) + 1;
  showMsg('Socket added! ('+it.sockets+'/'+MAX_SOCKETS+')', 1.8, '#c9b6ff');
  renderShop(); saveGame();
});

// ---------- Shop (Blacksmith) UI ----------
const shopOverlay = document.getElementById('shopOverlay');
const shopClose = document.getElementById('shopClose');
// Assigns each vendor-stock item a transient (gx,gy) grid position, using
// the same first-fit shape packer the player's own bag uses, so the stock
// can be drawn as the same icon-grid style instead of a flat text list.
function packStockGrid(stock){
  const placed = [];
  for(const it of stock){
    delete it.gx; delete it.gy;
    const spot = findBagSpot(placed, itemShape(it)) || {gx:0, gy:0};
    it.gx = spot.gx; it.gy = spot.gy;
    placed.push(it);
  }
}
function renderShop(){
  const p = game.player;
  document.getElementById('shopGold').textContent = p.gold+'g';
  if(game.openVendor==='socket' || game.openVendor==='runeforge') renderSocketPanel();
  // Show currently-equipped gear right in the vendor screen too, so the
  // player doesn't have to close the shop and open Inventory to check what
  // they're wearing before buying/selling.
  renderPaperdollInto(document.getElementById('shopPaperdoll'), p, 'shopPdSlot-', true);
  // ---- For Sale: rendered as the same icon-grid as the player's own bag --
  // tap an item to see its name/stats and a Buy button. ----
  packStockGrid(game.town.stock);
  const stockEl = document.getElementById('shopStock');
  stockEl.querySelectorAll('.bagCell').forEach(el=>el.remove());
  const CELL = 32;
  for(let i=0;i<game.town.stock.length;i++){
    const it = game.town.stock[i];
    if(it.gx==null || it.gy==null) continue;
    const [w,h] = itemShape(it);
    const price = buyPriceFor(it);
    const afford = p.gold>=price;
    const el = document.createElement('div');
    el.className = 'bagCell';
    el.style.left = (it.gx*CELL+1)+'px';
    el.style.top = (it.gy*CELL+1)+'px';
    el.style.width = (w*CELL-2)+'px';
    el.style.height = (h*CELL-2)+'px';
    el.style.borderColor = it.color; if(it.crimson){ el.style.boxShadow = '0 0 8px 2px rgba(142,15,38,.85), inset 0 0 8px rgba(142,15,38,.6)'; }
    if(!afford) el.style.opacity = '0.45';
    el.dataset.idx = i;
    el.innerHTML =
      ((bagArtSvg(it)) || ('<div class="bcIcon" style="color:'+it.color+'">'+categoryIconSvg(it.slotType, it)+'</div>'))+
      '<div class="bcLabel" style="position:absolute; left:0; right:0; bottom:1px; color:#f2d98a; text-shadow:0 0 3px #000, 0 0 3px #000;">'+price+'g</div>';
    el.title = it.unidentified ? 'Unidentified '+itemBaseName(it) : it.name+' — '+it.affixes.map(affixTooltipLine).join(', ');
    el.addEventListener('click', ()=>{
      openItemDetail(parseInt(el.dataset.idx,10), 'vendorStock');
    });
    stockEl.appendChild(el);
  }
  let stockEmptyNote = document.getElementById('shopStockEmptyNote');
  if(game.town.stock.length===0){
    if(!stockEmptyNote){
      stockEmptyNote = document.createElement('div');
      stockEmptyNote.id = 'shopStockEmptyNote';
      stockEmptyNote.className = 'bagEmptyNote';
      stockEmptyNote.textContent = 'Sold out for now';
      stockEl.parentNode.insertBefore(stockEmptyNote, stockEl.nextSibling);
    }
  } else if(stockEmptyNote){
    stockEmptyNote.remove();
  }
  // ---- Your Bag: the same grid-shaped inventory used on the Inventory
  // screen, so tapping an item pops up the same item-detail window (with a
  // Sell button added) instead of a separate flat sell list. Items are also
  // draggable straight onto the stock grid above to sell, or (while the
  // Inventory screen happens to be open behind this one) onto a paperdoll
  // slot to equip. ----
  const gridEl = document.getElementById('shopBag');
  gridEl.querySelectorAll('.bagCell').forEach(el=>el.remove());
  const CELL2 = 32;
  for(let i=0;i<p.inventory.length;i++){
    const it = p.inventory[i];
    if(it.gx==null || it.gy==null) continue;
    const [w,h] = itemShape(it);
    const el = document.createElement('div');
    el.className = 'bagCell';
    el.style.left = (it.gx*CELL2+1)+'px';
    el.style.top = (it.gy*CELL2+1)+'px';
    el.style.width = (w*CELL2-2)+'px';
    el.style.height = (h*CELL2-2)+'px';
    el.style.borderColor = it.color; if(it.crimson){ el.style.boxShadow = '0 0 8px 2px rgba(142,15,38,.85), inset 0 0 8px rgba(142,15,38,.6)'; }
    el.dataset.idx = i;
    el.innerHTML =
      bagItemHtml(it);
    el.title = it.name+' — '+it.affixes.map(affixTooltipLine).join(', ');
    makeItemDraggable(el, i, 'shopBag');
    gridEl.appendChild(el);
  }
  let shopEmptyNote = document.getElementById('shopBagEmptyNote');
  if(p.inventory.length===0){
    if(!shopEmptyNote){
      shopEmptyNote = document.createElement('div');
      shopEmptyNote.id = 'shopBagEmptyNote';
      shopEmptyNote.className = 'bagEmptyNote';
      shopEmptyNote.textContent = 'Nothing to sell';
      gridEl.parentNode.insertBefore(shopEmptyNote, gridEl.nextSibling);
    }
  } else if(shopEmptyNote){
    shopEmptyNote.remove();
  }
}
// v86: openShop() now takes an optional vendor id ('blacksmith', the
// default -- unchanged callers keep working exactly as before -- or
// 'hunter') and points game.town.stock at that vendor's own backing
// array before rendering, so renderShop()/packStockGrid()/the buy+sell
// handlers (all of which read/splice game.town.stock directly) work
// completely unmodified against whichever vendor is currently open.
// v182 (v215: now 1 hour): every vendor restocks on one shared clock (p.vendorRestockAt, saved)
function vendorRestockCheck(){
  const p = game.player, now = Date.now();
  if(!p.vendorRestockAt){ p.vendorRestockAt = now + BAR_RESTOCK_MS; return; }
  if(now >= p.vendorRestockAt){
    const t = game.town;
    if(t){ t.blacksmithStock = genShopStock(p.level||1); t.hunterStock = genHunterShopStock(p.level||1); }
    game.tavernVendors = null; p.barStock = null; p.barRestockAt = 0; p.witchStock = null;
    p.vendorRestockAt = now + BAR_RESTOCK_MS;
    saveGame();
  }
}
function restockLabel(){
  const ms = Math.max(0, game.player.vendorRestockAt - Date.now());
  return ms >= 3600000 ? Math.ceil(ms/3600000)+'h' : Math.max(1,Math.ceil(ms/60000))+'m';
}
function openShop(vendor){
  game.modalOpen = true;
  if(!game.town) game.town = makeTown(game.player.level);
  vendorRestockCheck();
  const t = game.town;
  game.openVendor = vendor || 'blacksmith';
  if(vendor==='hunter'){
    t.stock = t.hunterStock;
    document.getElementById('shopTitle').textContent = 'Garrick the Hunter \u2014 restocks in '+restockLabel();
  } else if(vendor==='bar'){
    t.stock = refreshBarStock(game.player);
    document.getElementById('shopTitle').textContent = 'Hobbs the Barkeeper \u2014 restocks in '+restockLabel();
    saveGame();
  } else if(vendor==='bard' || vendor==='gambler'){
    if(!game.tavernVendors) game.tavernVendors = {bard:genBardShopStock(game.player.level), gambler:genGamblerStock(game.player.level)};
    t.stock = game.tavernVendors[vendor];
    document.getElementById('shopTitle').textContent = (vendor==='bard' ? 'The Bard' : 'The Gambler')+' \u2014 restocks in '+restockLabel();
  } else if(vendor==='runeforge'){
    t.stock = t.blacksmithStock;
    document.getElementById('shopTitle').textContent = 'Obsidian Forge';
  } else if(vendor==='socket'){
    t.stock = t.blacksmithStock;
    document.getElementById('shopTitle').textContent = 'Brom \u2014 Socketing';
  } else {
    t.stock = t.blacksmithStock;
    document.getElementById('shopTitle').textContent = 'Brom \u2014 restocks in '+restockLabel();
  }
  game.socketItem = null; game.forgeMsg = null; game.forgeArm = null;
  const sockOn = vendor==='socket' || vendor==='runeforge';
  { const dv = document.querySelector('#socketPanel .invDivider'); if(dv) dv.textContent = vendor==='runeforge' ? 'Obsidian Forge' : 'Socket Bench';
    const em = document.getElementById('socketBenchEmpty'); if(em) em.innerHTML = vendor==='runeforge' ? 'Drag any weapon, armor piece or jewelry here<br>(from your bag or your equipment)<br><span style="font-size:11px;">or just tap it</span>' : 'Drag a weapon or armor piece here<br>(from your bag or your equipment)<br><span style="font-size:11px;">or just tap it</span>'; }
  document.getElementById('socketPanel').style.display = sockOn ? 'block' : 'none';
  document.getElementById('shopStockFrame').style.display = sockOn ? 'none' : '';
  document.getElementById('shopStockLabel').style.display = sockOn ? 'none' : '';
  const sne = document.getElementById('shopStockEmptyNote'); if(sne) sne.style.display = sockOn ? 'none' : '';
  renderShop();
  shopOverlay.style.display='flex';
}
function closeShop(){
  shopOverlay.style.display='none';
  document.getElementById('itemDetailOverlay').style.display = 'none';
  game.modalOpen = false;
  game.socketItem = null;
}
shopClose.addEventListener('click', closeShop);
document.getElementById('boltBtn').addEventListener('click', ()=>{ throwDragonBolt(); });

