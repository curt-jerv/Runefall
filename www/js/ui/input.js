// ---------- Input: joystick ----------
const joyzone = document.getElementById('joyzone');
const joybase = document.getElementById('joybase');
const joyknob = document.getElementById('joyknob');
let joyActive=false, joyId=null, joyCenter={x:0,y:0}, joyVec={x:0,y:0};
// v315: PC controls state (keyboard + mouse). Everything funnels into the same joyVec / want-flags / handlers the touch UI uses.
const PC = {mouseOn:false, kbOn:false, mx:0, my:0, lmb:false, strikeKey:false, kbW:false, kbA:false, kbS:false, kbD:false, hadKb:false, lastTouch:0, hold:null, rebinding:null, khT:0};
const PC_PICK_R = 70;   // an enemy counts as 'under the cursor' within this many world px of it (+ its own radius)
const JOY_R = 55;

function joyStart(id,x,y){
  joyActive=true; joyId=id; joyCenter={x,y};
  joybase.style.display='block';
  joybase.style.left=(x-59)+'px'; joybase.style.top=(y-59)+'px';
  joyknob.style.left='59px'; joyknob.style.top='59px';
}
function joyMove(x,y){
  let dx=x-joyCenter.x, dy=y-joyCenter.y;
  const d=Math.hypot(dx,dy);
  const cl=Math.min(d,JOY_R);
  const ang=Math.atan2(dy,dx);
  const kx=Math.cos(ang)*cl, ky=Math.sin(ang)*cl;
  joyknob.style.left=(59+kx)+'px'; joyknob.style.top=(59+ky)+'px';
  joyVec = d<8 ? {x:0,y:0} : {x:dx/Math.max(d,1)* Math.min(d/JOY_R,1), y:dy/Math.max(d,1)*Math.min(d/JOY_R,1)};
}
function joyEnd(){
  joyActive=false; joyId=null; joyVec={x:0,y:0};
  joybase.style.display='none';
}
joyzone.addEventListener('touchstart',e=>{
  e.preventDefault();
  if(joyActive){
    // recover from a stale joystick (touchend swallowed by an overlay, e.g. the death screen)
    let still=false; for(const t of e.touches){ if(t.identifier===joyId && t.target!==e.changedTouches[0].target) still=true; }
    if(still) return;
  }
  const t=e.changedTouches[0];
  joyStart(t.identifier, t.clientX, t.clientY);
},{passive:false});
joyzone.addEventListener('touchmove',e=>{
  e.preventDefault();
  for(const t of e.changedTouches){ if(t.identifier===joyId) joyMove(t.clientX,t.clientY); }
},{passive:false});
joyzone.addEventListener('touchend',e=>{
  for(const t of e.changedTouches){ if(t.identifier===joyId) joyEnd(); }
});
joyzone.addEventListener('touchcancel',()=>joyEnd());
// mouse fallback for desktop testing
let mouseDown=false;
joyzone.addEventListener('mousedown',e=>{ mouseDown=true; joyStart('m',e.clientX,e.clientY); });
window.addEventListener('mousemove',e=>{ if(mouseDown) joyMove(e.clientX,e.clientY); });
window.addEventListener('mouseup',()=>{ if(mouseDown){ mouseDown=false; joyEnd(); }});

// (v147) Right-side AIM stick, live only while Pyro Torrent is channelling.
const aimzone = document.getElementById('aimzone'), aimbase = document.getElementById('aimbase'), aimknob = document.getElementById('aimknob'), aimhint = document.getElementById('aimhint');
let aimActive=false, aimId=null, aimCenter={x:0,y:0}, aimVec={x:0,y:0};
const AIM_R = 46;
function aimPadCenter(){ return {x:window.innerWidth-8-52, y:window.innerHeight-8-52}; }
function aimStart(id,x,y){ aimActive=true; aimId=id; aimCenter=aimPadCenter(); aimbase.style.display='block'; aimbase.style.left=(aimCenter.x-52)+'px'; aimbase.style.top=(aimCenter.y-52)+'px'; aimknob.style.left='52px'; aimknob.style.top='52px'; aimhint.style.display='none'; aimMove(x,y); }
function aimMove(x,y){
  const dx=x-aimCenter.x, dy=y-aimCenter.y, d=Math.hypot(dx,dy), cl=Math.min(d,AIM_R), a=Math.atan2(dy,dx);
  aimknob.style.left=(52+Math.cos(a)*cl)+'px'; aimknob.style.top=(52+Math.sin(a)*cl)+'px';
  aimVec = d<8 ? {x:0,y:0} : {x:dx/d, y:dy/d};
}
function aimEnd(){ aimActive=false; aimId=null; aimVec={x:0,y:0}; aimbase.style.display='none'; dragAimEl = null; }
function setAimStickVisible(on){
  // v453: no separate aim pad any more -- hold the skill's own button and drag from it to aim
  aimzone.style.display = 'none'; aimhint.style.display = 'none'; document.body.classList.remove('pyroChannel');
  if(!on && aimActive && !dragAimEl) aimEnd();
}
// v453: drag-to-aim straight from a held skill button (Pyro Torrent, Aimed Shot): direction = finger relative to the button's centre
let dragAimEl = null;
function dragAimBegin(el, id){
  const r = el.getBoundingClientRect();
  aimActive = true; aimId = id; aimCenter = {x:r.left+r.width/2, y:r.top+r.height/2}; aimVec = {x:0,y:0}; dragAimEl = el;
}
function dragAimEnd(){ if(dragAimEl){ dragAimEl = null; aimEnd(); } }
aimzone.addEventListener('touchstart',e=>{ e.preventDefault(); const t=e.changedTouches[0]; aimStart(t.identifier,t.clientX,t.clientY); },{passive:false});
aimzone.addEventListener('touchmove',e=>{ e.preventDefault(); for(const t of e.changedTouches){ if(t.identifier===aimId) aimMove(t.clientX,t.clientY); } },{passive:false});
aimzone.addEventListener('touchend',e=>{ for(const t of e.changedTouches){ if(t.identifier===aimId) aimEnd(); } });
aimzone.addEventListener('touchcancel',()=>aimEnd());
let aimMouse=false;
aimzone.addEventListener('mousedown',e=>{ aimMouse=true; aimStart('m',e.clientX,e.clientY); });
window.addEventListener('mousemove',e=>{ if(aimMouse) aimMove(e.clientX,e.clientY); });
window.addEventListener('mouseup',()=>{ if(aimMouse){ aimMouse=false; aimEnd(); } });

// ---------- Input: buttons ----------
let wantStormcall=false, wantRaiseDead=false, wantMeteor=false, wantAttack=false, wantDodge=false, wantShieldBash=false, wantThrow=false, wantGuardian=false, wantWhirlwind=false, wantBattlecry=false, wantAssault=false, wantStance=false, wantRally=false, wantTrap=false, wantPoisonKnives=false, wantVanish=false, wantShadowStep=false, wantRapidShot=false, wantCripplingShot=false, wantStunShot=false, wantPackTactics=false, wantFieldDress=false, wantNova=false, wantTornado=false, wantStorm=false, wantHurricane=false, wantFireball=false, wantIceBolt=false, wantIceArmor=false, wantPyroTorrent=false, wantBlizzard=false, wantImmolate=false, wantFlameVortex=false, wantPermafrost=false, wantFear=false, wantPlague=false,
  // v79 batch: Survivalist tree (Ranger's reworked/renamed Assassin tree)
  // + Marksman's new Rain of Arrows capstone -- see ACTIVE_SKILL_REGISTRY
  // for how each of these gets triggered (either a legacy button's
  // bindBtn, for none of these -- they're all oldBtnId:null, Main/1/2/3
  // slot-only, same convention every post-v74 new active skill uses).
  wantSplinterShot=false, wantExplosiveShot=false, wantSurvivalFieldDress=false, wantPoisonTrap=false, wantFrostTrap=false, wantRainOfArrows=false,
  // v80 batch: Hunter tree rework -- Summon Wolf (now active-triggered)
  // and the brand-new Recall skill. Both oldBtnId:null, Main/1/2/3-slot
  // only, same convention as every post-v74 new active skill.
  wantRecall=false, wantAimedShot=false, wantBeastFury=false, wantHuntersMark=false, wantExplosiveTrap=false,
  // Necromancer's Soul Sap and Djinn's Lightning Arc (v99 fix): both used
  // to be an automatic, unconditional override of the default Main/Strike
  // attack instead of a normal assignable active skill -- see the removed
  // staffItem override branch in updatePlaying() and each skill's own cast
  // block below. Now both fire independently through their own want-flag,
  // same Main/1/2/3-slot-only convention as every other post-v74 active
  // skill (Fireball/Ice Bolt, etc.), with zero side effect on Strike.
  wantSoulSap=false, wantLightningArc=false, wantDeathBolt=false, wantSoulGate=false, wantSoulFire=false;
// Precise Shot (Marksman capstone): whether the STRIKE button is currently
// physically held down. Read by the aiming state machine in updatePlaying();
// see onAttackDown/onAttackUp below for how this gets set.
let attackHeld = false;
const HOLD_REPEAT_MAIN = { explosiveShot:1, splinterShot:1, reave:1, shieldBash:1, smite:1, vengeance:1, cripplingShot:1, stunShot:1, rapidShot:0, fireball:1, iceBolt:1, lightningArc:1, soulSap:1, deathBolt:1 };   // v452: main attacks that repeat while STRIKE is held
function bindBtn(el, fn){
  el.addEventListener('touchstart', e=>{ e.preventDefault(); fn(); }, {passive:false});
  el.addEventListener('mousedown', e=>{ e.preventDefault(); fn(); });
}
function bindHold(el, onDown, onUp){
  el.addEventListener('touchstart', e=>{ e.preventDefault(); onDown(); }, {passive:false});
  el.addEventListener('touchend', e=>{ e.preventDefault(); onUp(); });
  el.addEventListener('touchcancel', ()=>onUp());
  el.addEventListener('mousedown', e=>{ e.preventDefault(); onDown(); });
  el.addEventListener('mouseup', ()=>onUp());
  el.addEventListener('mouseleave', ()=>onUp());
}
// STRIKE normally just tap-fires (wantAttack), but once Precise Shot is
// ranked (bow equipped) it becomes a hold-to-aim button instead -- see
// preciseShotActive()'s gate on the plain-attack code and the Precise Shot
// block in updatePlaying(), which drive the actual aiming state off
// attackHeld rather than off a single tap event.
// v74: the Main slot normally holds 'strike' (default), preserving all the
// above hold-to-aim/Precise-Shot behavior exactly as before. If the player
// has reassigned Main to a different active skill via the skill tree's
// Assign button, tapping STRIKE fires that skill instead (plain tap, via
// the same generic registry the 3 side slots use) and the hold-to-aim path
// is skipped entirely -- Precise Shot only ever applies to the *default*
// Main/Strike, never to a reassigned skill.
// v86: item 3 of the UI/UX overhaul -- the active-skill loadout buttons
// (Main/Slot1/2/3 + Dodge) now stay visible everywhere, including Town, but
// are functionally inert in any non-combat context. Town is the sole such
// context today (per the brief); written as its own named check, rather
// than an inline `game.scene==='town'`, so a future non-combat context
// (a cutscene, a menu-driven scene, etc.) only needs one new clause here.
function combatActionsBlocked(){
  return !!(game && game.started && (game.scene==='town' || game.scene==='tavern'));
}
function onAttackDown(){
  attackHeld = true;
  if(combatActionsBlocked()){ showMsg('I cannot do that here', 1.2); return; }
  const mainSkill = (game && game.player && game.player.skillSlots) ? game.player.skillSlots.main : 'strike';
  if(mainSkill && mainSkill!=='strike'){
    if(mainSkill==='aimedShot' && aimedHoldReady('main')){ const b=document.getElementById('btnAttack'); const r=b.getBoundingClientRect(); holdAimBegin('main', b, 'm', r.left+r.width/2, r.top+r.height/2); return; }
    const entry = ACTIVE_SKILL_REGISTRY[mainSkill];
    // v78: resource-cost gate (see ACTIVE_SKILL_REGISTRY's own comment on
    // the new optional .cost(p) field) -- an unaffordable skill simply
    // doesn't trigger, same as an on-cooldown one silently doesn't.
    if(entry && (!entry.cost || (game.player.souls||0) >= entry.cost(game.player))) entry.trigger();
    return;
  }
  if(game && game.player && game.player.pyroTorrentT>0) return;
  if(!(game && game.player && preciseShotActive(game.player))) wantAttack = true;
}
function onAttackUp(){ attackHeld = false; if(holdAimOn && holdAimSlot==='main') holdAimEnd(true); }
// Main-slot Aimed Shot: the Strike button keeps the touch, so route its drag into the pad
{ const ba = document.getElementById('btnAttack');
  ba.addEventListener('touchstart', e=>{ const p = game && game.player; if(p && p.skillSlots && p.skillSlots.main==='pyroTorrent' && !combatActionsBlocked()){ const t=e.changedTouches[0]; dragAimBegin(ba, t.identifier); } else if(holdAimOn && holdAimSlot==='main'){ const t=e.changedTouches[0]; holdAimId = t.identifier; holdAimStart = {x:t.clientX, y:t.clientY}; } }, {passive:false});
  ba.addEventListener('touchmove', e=>{ if(dragAimEl===ba){ e.preventDefault(); for(const t of e.changedTouches) if(t.identifier===aimId) aimMove(t.clientX,t.clientY); return; } if(!(holdAimOn && holdAimSlot==='main')) return; e.preventDefault(); const t=e.changedTouches[0]; holdAimMove(t.clientX,t.clientY); }, {passive:false});
  ba.addEventListener('touchend', e=>{ if(dragAimEl===ba) dragAimEnd(); });
  window.addEventListener('mousemove', e=>{ if(holdAimOn && holdAimSlot==='main') holdAimMove(e.clientX,e.clientY); }); }
bindHold(document.getElementById('btnAttack'), onAttackDown, onAttackUp);
bindBtn(document.getElementById('btnRapidShot'), ()=>wantRapidShot=true);
// Dodge is exempt from combatActionsBlocked() above -- every other active
// skill (and the basic Strike attack) is disabled in Town, but Dodge is
// the one skill that keeps working everywhere, Town included: normal dash
// physics in Dark Forest/Sunlit Plains/Mountain Pass/dungeon floors via
// the main combat update() (with the v91 sub-stepped anti-tunneling dash
// collision), and via updateTown()'s own mirrored dodge block while in
// Town. No "I cannot do that here" gate belongs on this button.
bindBtn(document.getElementById('btnDodge'), ()=>{
  wantDodge=true;
});
// (v124) Potion button: tap = drink the assigned potion; hold = cycle which kind is assigned
// (health / beer / coffee). If the assigned kind runs out, the next kind you carry is used.
const POTION_KINDS = ['health','beer','coffee'];   // v490: mana potions removed
const POTION_EMOJI = {health:'\u2764\uFE0F', beer:'\u{1F37A}', coffee:'\u2615'};
function potionCount(p, kind){ let n=0; for(const it of p.inventory) if(it.slotType==='potion' && it.potionKind===kind) n++; return n; }
// v478 potion belt: health potions live ONLY in the belt (never the bag). Capacity: 1 with no belt, 3 with any
// belt, 4 with a tier-2 belt, 5 with tier 3 and up. Other potions (beer, coffee) stay in the bag and are drunk from there.
const POTION_STACK_MAX = 5;
const POTION_CD = 10, POTION_INSTANT = 0.10, POTION_HOT = 0.50, POTION_HOT_DUR = 4;
function beltCapacity(p){ const b = p && p.equipment && p.equipment.belt; if(!b) return 1; const t = b.tier||1; return t>=3 ? 5 : t===2 ? 4 : 3; }
function isHealthPotion(it){ return !!(it && it.slotType==='potion' && it.potionKind==='health'); }
function fullMsgFor(it){ return isHealthPotion(it) ? 'Belt is full' : 'Bag is full!'; }
let potionStackOff = false;
function dropPotionsAtFeet(p, n){
  const g = (typeof game!=='undefined') ? game : null; if(!g || !g.started || !g.loot) return false;
  for(let i=0;i<n;i++){ const l = {type:'item', x:p.x+rand(-26,26), y:p.y+rand(-26,26), r:8, item:makePotionItem('health'), dropGrace:1.2}; try{ fixLootSpot(g, l); }catch(e){} g.loot.push(l); }   // v490
  return true;
}
function ensurePotionEq(p){
  if(!p.potionEq) p.potionEq = {kind:'health', n:0};
  const eq = p.potionEq;
  if(!p.beltV478){
    // one-time move to the belt: other kinds go back to the bag, health potions come out of the bag into the belt
    p.beltV478 = true;
    potionStackOff = true;
    try{
      if(eq.kind!=='health' && eq.n>0){ if(POTION_DEFS[eq.kind]) for(let i=0;i<eq.n;i++) forceAddToBag(p, makePotionItem(eq.kind)); eq.n = 0; }   // v490: an old mana belt is simply emptied
      eq.kind = 'health';
      let spare = 0;
      for(let i=p.inventory.length-1;i>=0;i--){ const it = p.inventory[i]; if(isHealthPotion(it)){ p.inventory.splice(i,1); if(eq.n < beltCapacity(p)) eq.n++; else spare++; } }
      if(spare>0){ p.gold = (p.gold||0) + spare*Math.round(BAR_POTION_PRICE/2); setTimeout(()=>{ try{ showMsg('Health potions now live in your belt -- '+spare+' spare sold for '+(spare*Math.round(BAR_POTION_PRICE/2))+'g', 4, '#ffd27a'); }catch(e){} }, 2600); }
    } finally { potionStackOff = false; }
  }
  eq.kind = 'health'; p.potionSlot = 'health';
  const cap = beltCapacity(p);
  if(eq.n > cap && !potionStackOff){ const extra = eq.n - cap; if(dropPotionsAtFeet(p, extra)){ eq.n = cap; showMsg('Your belt cannot hold them all', 1.6); } }
  return eq;
}
function tryStackPotion(p, item){
  if(potionStackOff || !isHealthPotion(item) || !p.equipment) return false;
  const eq = ensurePotionEq(p);
  if(eq.n >= beltCapacity(p)) return false;
  eq.n++; return true;
}
function unsocketPotions(p){ showMsg('Health potions can only be in your belt', 1.6); return 0; }
function socketPotion(p, item){
  if(!isHealthPotion(item)){ showMsg(item && item.potionKind==='purple' ? 'Drink it from the inventory' : 'Only health potions go in your belt -- drink this one from your bag', 1.6); return; }
  const idx = p.inventory.indexOf(item);
  const eq = ensurePotionEq(p);
  if(eq.n >= beltCapacity(p)){ showMsg('Belt is full', 1.2); return; }
  if(idx>=0) p.inventory.splice(idx,1);
  eq.n++;
  showMsg('Health Potion x'+eq.n+' in your belt', 1.2);
}
function usePotionSlot(){
  const p = game && game.player; if(!p || !game.started) return;
  const eq = ensurePotionEq(p);
  if(eq.n<=0){ showMsg('No health potions in your belt', 1.0); return; }
  if(p.potionCd>0){ showMsg('Potion ready in '+Math.ceil(p.potionCd)+'s', 0.9); return; }
  if(usePotion(p, {potionKind:eq.kind})){
    eq.n--; try{ achAdd('potions'); }catch(e){}
    try{ if(typeof renderInventory==='function') renderInventory(); }catch(e){}
    saveGame();
  }
}
bindHold(document.getElementById('btnPotion'),
  ()=>{},
  ()=>{ usePotionSlot(); });
let potionSig = '';
function updatePotionButton(p){
  const el = document.getElementById('btnPotion'); if(!el) return;
  el.style.display = ''; if(document.body.classList.contains('noPotionBtn')) document.body.classList.remove('noPotionBtn');   // v480: the potion button stays visible in town too
  const eq = ensurePotionEq(p);
  { const cdEl = el.querySelector('.cd'); if(cdEl){ const fr = p.potionCd>0 ? Math.min(1, p.potionCd/POTION_CD) : 0; const tf = 'translateY('+Math.round((1-fr)*100)+'%)'; if(cdEl.style.transform!==tf) cdEl.style.transform = tf; } }
  const sig = eq.kind+':'+eq.n+':'+beltCapacity(p);
  if(sig===potionSig) return;
  potionSig = sig;
  el.querySelector('.ico').innerHTML = POTION_EMOJI[eq.kind];
  el.querySelector('.cnt').textContent = eq.n+'/'+beltCapacity(p);
  el.classList.toggle('empty', eq.n===0);
}
bindBtn(document.getElementById('btnThrow'), ()=>wantThrow=true);
bindBtn(document.getElementById('btnGuardian'), ()=>wantGuardian=true);
bindBtn(document.getElementById('btnWhirlwind'), ()=>wantWhirlwind=true);
let wantLeap=false, wantUnbreak=false;
let wantReave=false;
let wantSmite=false, wantVengeance=false, wantBanner=false, wantConsecrate=false, wantJudgment=false, wantBulwark=false, wantBloodrage=false;
let wantSeismic=false, wantMirror=false, wantAnchor=false;   // v492 Defender: Mirror of Steel, Seismic Slam, Seismic Anchor
bindBtn(document.getElementById('btnBattlecry'), ()=>wantBattlecry=true);
bindBtn(document.getElementById('btnAssault'), ()=>wantAssault=true);
bindBtn(document.getElementById('btnStance'), ()=>wantStance=true);
bindBtn(document.getElementById('btnRally'), ()=>wantRally=true);
bindBtn(document.getElementById('btnTrap'), ()=>wantTrap=true);
bindBtn(document.getElementById('btnPoisonKnives'), ()=>wantPoisonKnives=true);
bindBtn(document.getElementById('btnShadowStep'), ()=>wantShadowStep=true);
bindBtn(document.getElementById('btnVanish'), ()=>wantVanish=true);
bindBtn(document.getElementById('btnCripplingShot'), ()=>wantCripplingShot=true);
bindBtn(document.getElementById('btnStunShot'), ()=>wantStunShot=true);
bindBtn(document.getElementById('btnPackTactics'), ()=>wantPackTactics=true);
bindBtn(document.getElementById('btnFieldDress'), ()=>wantFieldDress=true);

