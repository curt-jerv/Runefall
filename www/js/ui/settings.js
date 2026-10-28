// ---------- Menu (Settings / Log Out / Exit) ----------
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');
const menuBtn = document.getElementById('menuBtn');
const settingsOverlay = document.getElementById('settingsOverlay');
const settingsClose = document.getElementById('settingsClose');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValueLabel = document.getElementById('volumeValueLabel');

const SETTINGS_KEY = 'dc_settings_v1';
function loadSettings(){
  try{
    const raw = localStorage.getItem(SETTINGS_KEY);
    if(raw){ const s = JSON.parse(raw); if(s && typeof s==='object') return s; }
  }catch(e){}
  return { volume: 1, sfxVol: 1, musicVol: 1, audioOffV402: true, audio100V452: true };
}
function saveSettings(s){
  try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }catch(e){}
}
let settings = loadSettings();
if(!settings.brightV547){ settings.bright = 0.7; settings.brightV547 = true; saveSettings(settings); }   // v547: brightness starts at 70% (slider 50-120%)
// v487: apply the saved Graphics quality (see gfxLevel by resize())
function gfxApply(level){ level = Math.max(0, Math.min(2, level)); glowMode = level; if(level!==gfxLevel){ gfxLevel = level; resize(); } }
function gfxInit(){ const v = settings.gfxQ || 'auto'; gfxApply(v==='high' ? 2 : v==='low' ? 0 : 1); }
gfxInit();
// v402: sound starts OFF. One-time reset for saved settings from before this change (sliders stay adjustable).
if(!settings.audioOffV402){ settings.audioOffV402 = true; saveSettings(settings); }
if(!settings.audio100V452){ settings.audio100V452 = true; settings.volume = 1; settings.sfxVol = 1; settings.musicVol = 1; saveSettings(settings); }   // v452: all audio at 100% by default
// v81: Cat Companion / Expanded Stash toggles default to off (undefined ==
// falsy) for anyone who's never touched the Support submenu -- no explicit
// default needed here the way `volume` has one, since "off" is already
// this object's implicit default for any missing boolean key.
// v392: Support perks are purchases now; anyone who already had a toggle ON keeps it as owned
if(settings.catCompanion && !settings.catOwned) settings.catOwned = true;
if(settings.expandedStash && !settings.stashOwned) settings.stashOwned = true;
volumeSlider.value = Math.round((settings.volume!=null ? settings.volume : 0.8)*100);
volumeValueLabel.textContent = volumeSlider.value+'%';
volumeSlider.addEventListener('input', ()=>{
  const v = parseInt(volumeSlider.value,10)||0;
  volumeValueLabel.textContent = v+'%';
  settings.volume = v/100;
  saveSettings(settings);
  try{ audApplyVolumes(); }catch(e){}
});
[['musicSlider','musicValueLabel','musicVol',0],['sfxSlider','sfxValueLabel','sfxVol',0]].forEach(([sid,lid,key,def])=>{
  const sl = document.getElementById(sid), lb = document.getElementById(lid); if(!sl||!lb) return;
  sl.value = Math.round((settings[key]!=null ? settings[key] : def)*100); lb.textContent = sl.value+'%';
  sl.addEventListener('input', ()=>{ const v = parseInt(sl.value,10)||0; lb.textContent = v+'%'; settings[key] = v/100; saveSettings(settings); try{ audApplyVolumes(); if(key==='sfxVol') sfxPlay('coin',1); }catch(e){} });
});

function openMenu(){
  game.modalOpen = true;
  menuOverlay.style.display = 'flex';
}
function closeMenu(){
  menuOverlay.style.display = 'none';
  game.modalOpen = false;
}
menuClose.addEventListener('click', closeMenu);
menuBtn.addEventListener('click', ()=>{
  if(!game || !game.started || game.over) return;
  if(game.modalOpen) return;
  openMenu();
});

// Damage Numbers toggle (v105): ON by default -- only an explicit `false`
// turns them off, so anyone who's never touched it (undefined) still sees them.
function refreshDamageNumbersToggle(){
  setToggleUI(document.getElementById('toggleDamageNumbers'), settings.damageNumbers!==false);
  setToggleUI(document.getElementById('toggleDotNumbers'), settings.dotNumbers!==false);
  setToggleUI(document.getElementById('toggleFollowerNumbers'), settings.followerNumbers!==false);
}
document.getElementById('toggleDotNumbers').addEventListener('click', ()=>{ settings.dotNumbers = (settings.dotNumbers===false); saveSettings(settings); refreshDamageNumbersToggle(); });
document.getElementById('toggleFollowerNumbers').addEventListener('click', ()=>{ settings.followerNumbers = (settings.followerNumbers===false); saveSettings(settings); refreshDamageNumbersToggle(); });
document.getElementById('toggleDamageNumbers').addEventListener('click', ()=>{
  settings.damageNumbers = (settings.damageNumbers===false);
  saveSettings(settings);
  refreshDamageNumbersToggle();
});
// v172/v247: Auto pick-up toggles (OFF by default, set in Settings > Loot). Items of a rarity whose toggle is off stay on the floor
// until you tap the pick-up button next to them.
function refreshAutoPickToggles(){
  setToggleUI(document.getElementById('toggleAutoCommon'), settings.autoPickCommon===true);
  setToggleUI(document.getElementById('toggleAutoMagic'), settings.autoPickMagic===true);
  setToggleUI(document.getElementById('toggleAutoRare'), settings.autoPickRare===true);
  const pk = (game && game.player && game.player.cls) || 'any';
  setToggleUI(document.getElementById('toggleAutoClassOnly'), !!(settings.autoPickClassOnly && settings.autoPickClassOnly[pk]));
}
document.getElementById('toggleAutoClassOnly').addEventListener('click', ()=>{ const pk = (game && game.player && game.player.cls) || 'any'; settings.autoPickClassOnly = settings.autoPickClassOnly || {}; settings.autoPickClassOnly[pk] = !settings.autoPickClassOnly[pk]; saveSettings(settings); refreshAutoPickToggles(); });
// v452: can this character actually wear/wield the item? (non-gear always counts as usable)
function itemUsableByClass(p, it){
  if(!p || !it || !it.slotType) return true;
  if(it.slotType==='staff') return p.cls==='mystic';
  if(it.slotType==='bow') return p.cls==='ranger';
  if(it.slotType==='weapon2h' || it.slotType==='weapon1h' || it.slotType==='shield') return p.cls==='warrior';   // v489: swords and shields are Warrior gear for auto pick-up
  if(it.material && typeof canEquipArmorMaterial==='function') return canEquipArmorMaterial(p.cls, it.material);
  return true;
}
document.getElementById('toggleAutoCommon').addEventListener('click', ()=>{ settings.autoPickCommon = !(settings.autoPickCommon===true); saveSettings(settings); refreshAutoPickToggles(); });
document.getElementById('toggleAutoMagic').addEventListener('click', ()=>{ settings.autoPickMagic = !(settings.autoPickMagic===true); saveSettings(settings); refreshAutoPickToggles(); });
document.getElementById('toggleAutoRare').addEventListener('click', ()=>{ settings.autoPickRare = !(settings.autoPickRare===true); saveSettings(settings); refreshAutoPickToggles(); });
// v452: standing on an item you have to pick up by hand shows its name (same popup as picking it up)
function lootHoverName(g, p){
  const on = nearestDroppedItem();   // v548: the name shows exactly when the pick-up button does (same item, same reach)
  if(on && g._hoverLoot!==on) showMsg(on.item.unidentified ? 'Unidentified '+itemBaseName(on.item) : on.item.name, 1.6, on.item.color||'');
  g._hoverLoot = on;
}
function lootIsManual(l){
  if(l.playerDropped) return true;
  if(l.type!=='item' || !l.item) return false;
  if(isHealthPotion(l.item)) return false;   // v478: health potions go straight into the belt
  if(l.item.rarity==='common' && settings.autoPickCommon!==true) return true;
  if(l.item.rarity==='magic' && settings.autoPickMagic!==true) return true;
  if(l.item.rarity==='rare' && settings.autoPickRare!==true) return true;
  { const p = game && game.player; if(p && settings.autoPickClassOnly && settings.autoPickClassOnly[p.cls] && !itemUsableByClass(p, l.item)) return true; }
  return false;
}
function openSettings(){
  refreshDamageNumbersToggle(); refreshAutoPickToggles();
  menuOverlay.style.display = 'none';
  settingsOverlay.style.display = 'flex';
  // game.modalOpen stays true -- still inside a modal, just a nested screen
}
function closeSettings(){
  settingsOverlay.style.display = 'none';
  menuOverlay.style.display = 'flex'; // back to the menu, not fully closed
}
const lootOverlay = document.getElementById('lootOverlay');
document.getElementById('settingsLootBtn').addEventListener('click', ()=>{ refreshAutoPickToggles(); settingsOverlay.style.display='none'; lootOverlay.style.display='flex'; });
document.getElementById('lootClose').addEventListener('click', ()=>{ lootOverlay.style.display='none'; settingsOverlay.style.display='flex'; });
// v470: Settings > Graphics
const graphicsOverlay = document.getElementById('graphicsOverlay');
function syncGraphicsUI(){
  const gq = settings.gfxQ || 'auto';
  document.querySelectorAll('#gfxSeg button').forEach(b=>b.classList.toggle('on', b.dataset.v===gq));
  document.querySelectorAll('#fpsSeg button').forEach(b=>b.classList.toggle('on', +b.dataset.v===(+settings.fpsCap===30 ? 30 : 60)));
  { const bs = document.getElementById('brightSlider'), bv = Math.round(brightSetting()*100); if(bs){ bs.value = bv; document.getElementById('brightValueLabel').textContent = bv+'%'; } }
  setToggleUI(document.getElementById('toggleGrain'), settings.grain!==false);
  setToggleUI(document.getElementById('toggleHeroSprites'), settings.heroSprites===true);   // v569
  { const o = settings.orient || 'auto'; document.querySelectorAll('#orientSeg button').forEach(b=>b.classList.toggle('on', b.dataset.v===o)); }
}
document.getElementById('settingsGraphicsBtn').addEventListener('click', ()=>{ syncGraphicsUI(); settingsOverlay.style.display='none'; graphicsOverlay.style.display='flex'; });
document.getElementById('graphicsClose').addEventListener('click', ()=>{ graphicsOverlay.style.display='none'; settingsOverlay.style.display='flex'; });
// v484: Sound sub-menu, and the achievement pop-up toggle (pop-ups hidden by default)
const soundOverlay = document.getElementById('soundOverlay');
document.getElementById('settingsSoundBtn').addEventListener('click', ()=>{ settingsOverlay.style.display='none'; soundOverlay.style.display='flex'; });
document.getElementById('soundClose').addEventListener('click', ()=>{ soundOverlay.style.display='none'; settingsOverlay.style.display='flex'; });
function syncHideAchUI(){ setToggleUI(document.getElementById('toggleHideAch'), settings.hideAch===true); }   // v489: pop-ups shown by default
document.getElementById('toggleHideAch').addEventListener('click', ()=>{ settings.hideAch = !(settings.hideAch===true); saveSettings(settings); syncHideAchUI(); });
syncHideAchUI();
// v486: native helpers -- screen orientation lock and full-screen (system bars hidden) in the Android app
function nativePlugin(name){ try{ const C = window.Capacitor; if(!C || !(C.isNativePlatform && C.isNativePlatform())) return null; return (C.Plugins && C.Plugins[name]) || (C.registerPlugin ? C.registerPlugin(name) : null); }catch(e){ return null; } }
function applyOrientation(){
  const v = settings.orient || 'auto', SO = nativePlugin('ScreenOrientation');
  document.querySelectorAll('#orientSeg button').forEach(b=>b.classList.toggle('on', b.dataset.v===v));
  try{
    if(SO){ (v==='auto' ? SO.unlock() : SO.lock({orientation:v})).catch(()=>{}); }
    else if(screen.orientation && screen.orientation.lock){ if(v==='auto') screen.orientation.unlock(); else screen.orientation.lock(v).catch(()=>{}); }
  }catch(e){}
}
document.querySelectorAll('#orientSeg button').forEach(b=>b.addEventListener('click', ()=>{ settings.orient = b.dataset.v; saveSettings(settings); applyOrientation(); }));
function goImmersive(){ try{ const SB = nativePlugin('SystemBars'); if(SB && SB.hide) SB.hide().catch(()=>{}); }catch(e){} }
applyOrientation(); goImmersive();
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden){ goImmersive(); applyOrientation(); } });
window.addEventListener('resize', ()=>{ setTimeout(goImmersive, 300); });
document.querySelectorAll('#gfxSeg button').forEach(b=>b.addEventListener('click', ()=>{ settings.gfxQ = b.dataset.v; saveSettings(settings); gfxInit(); syncGraphicsUI(); }));
document.querySelectorAll('#fpsSeg button').forEach(b=>b.addEventListener('click', ()=>{ settings.fpsCap = +b.dataset.v; saveSettings(settings); syncGraphicsUI(); }));
// v522: the old Atmosphere switch is now a plain Brightness slider (70-140%), applied in the canvas CSS filter (render/mood.js)
document.getElementById('brightSlider').addEventListener('input', e=>{ settings.bright = (+e.target.value)/100; document.getElementById('brightValueLabel').textContent = e.target.value+'%'; try{ moodCssKey = ''; }catch(err){} saveSettings(settings); });
document.getElementById('toggleHeroSprites').addEventListener('click', ()=>{ settings.heroSprites = (settings.heroSprites!==true); saveSettings(settings); syncGraphicsUI(); });   // v569
document.getElementById('toggleGrain').addEventListener('click', ()=>{ settings.grain = (settings.grain===false); settings.atmosChosen = true; saveSettings(settings); syncGraphicsUI(); });
const combatOverlay = document.getElementById('combatOverlay');
document.getElementById('settingsCombatBtn').addEventListener('click', ()=>{ try{ refreshDamageNumbersToggle(); }catch(e){} settingsOverlay.style.display='none'; combatOverlay.style.display='flex'; });
document.getElementById('combatClose').addEventListener('click', ()=>{ combatOverlay.style.display='none'; settingsOverlay.style.display='flex'; });
document.getElementById('menuSettingsBtn').addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);

// (moved here from ui/support-store.js: it is needed while this file loads)
function setToggleUI(rowEl, on){
  rowEl.classList.toggle('on', !!on);
  const sw = rowEl.querySelector('.toggleSwitch');
  if(sw) sw.classList.toggle('on', !!on);
}
