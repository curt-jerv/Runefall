// ---------- v315: PC controls (keyboard + mouse) ----------
// WASD moves (feeds the same joyVec the touch stick uses), left click = Strike (hold = keep attacking), right click = Dodge.
// Skills 1-3, Potion, Interact, and an extra Dodge/Strike key are rebindable in Settings > Controls. Keys are stored as KeyboardEvent.code.
const KEYBIND_DEFAULTS = {slot1:'Digit1', slot2:'Digit2', slot3:'Digit3', potion:'KeyQ', interact:'KeyE', dodge:'Space', strike:''};
const KEYBIND_LABELS = {slot1:'Skill 1', slot2:'Skill 2', slot3:'Skill 3', potion:'Potion', interact:'Interact / Pick up', dodge:'Dodge (extra key)', strike:'Strike (extra key)'};
const KEYBIND_ORDER = ['slot1','slot2','slot3','potion','interact','dodge','strike'];
const KEY_RESERVED = {KeyW:1, KeyA:1, KeyS:1, KeyD:1, Escape:1, MetaLeft:1, MetaRight:1, ContextMenu:1};
function getKeybinds(){
  const kb = Object.assign({}, KEYBIND_DEFAULTS), s = settings.keybinds;
  if(s && typeof s==='object'){ for(const k of KEYBIND_ORDER) if(typeof s[k]==='string') kb[k] = s[k]; }
  return kb;
}
function keyName(code){
  if(!code) return '';
  return code.replace(/^Key/,'').replace(/^Digit/,'').replace(/^Numpad/,'Num ').replace(/^(Shift|Control|Alt)(Left|Right)$/,'$1').replace('Backquote','`').replace('Minus','-').replace('Equal','=').replace('BracketLeft','[').replace('BracketRight',']').replace('Semicolon',';').replace('Quote',"'").replace('Comma',',').replace('Period','.').replace('Slash','/').replace('Backslash','\\')
    .replace('ArrowUp','↑').replace('ArrowDown','↓').replace('ArrowLeft','←').replace('ArrowRight','→');
}
function pcEnabled(){ return settings.pcControls!==false; }
function pcLive(){ return pcEnabled() && !!game && game.started && !game.over && !!game.player; }
function uiOpen(){
  if(game && game.modalOpen) return true;
  const els = document.getElementsByClassName('modalOverlay');
  for(let i=0;i<els.length;i++){ const d = els[i].style.display; if(d && d!=='none') return true; }
  return false;
}
function pcNow(){ return (typeof performance!=='undefined' ? performance.now() : Date.now()); }
function pcTouchRecent(){ return pcNow() - PC.lastTouch < 900; }
function pcRefreshBody(){ document.body.classList.toggle('pcMode', pcEnabled() && (PC.mouseOn || PC.kbOn)); canvas.style.cursor = (pcEnabled() && PC.mouseOn) ? 'crosshair' : ''; }
function refreshKeyHints(){
  const kb = getKeybinds();
  const map = {btnSlot1:keyName(kb.slot1), btnSlot2:keyName(kb.slot2), btnSlot3:keyName(kb.slot3), btnPotion:keyName(kb.potion),
    btnAttack:'LMB', btnDodge:'RMB'};
  for(const id in map){
    const el = document.getElementById(id); if(!el) continue;
    let h = el.querySelector('.kh'); if(!h){ h = document.createElement('i'); h.className = 'kh'; el.appendChild(h); }
    if(h.textContent!==map[id]) h.textContent = map[id];
  }
  const bi = document.getElementById('btnInteract'); if(bi) bi.setAttribute('data-key', keyName(kb.interact));
  PC.khT = pcNow();
}
// Held-to-charge Aimed Shot (same rules as the touch pad: a quick tap = 1.5x, held = full), fired toward the cursor when the mouse is active.
// v545: show the loading aim line while a key/mouse hold draws the bow
function pcAimLoad(p){ if(!p) return; p.aimShotHold = true; p.aimLoadT0 = (typeof performance!=='undefined' ? performance.now() : Date.now()); p.aimDir = {x:p.facing.x, y:p.facing.y}; }
function pcFireAimed(){
  const h = PC.hold; PC.hold = null; if(game && game.player) game.player.aimShotHold = false; if(!h || !game || !game.player) return;
  const p = game.player, c = pcCursorWorld();
  if(c){ const dx=c.x-p.x, dy=c.y-p.y, d=Math.hypot(dx,dy); holdAimShotDir = d>4 ? {x:dx/d, y:dy/d} : null; } else holdAimShotDir = null;
  aimShotFull = (pcNow() - h.t0) >= AIMED_HOLD_MS;
  wantAimedShot = true;
}
function pcSlotDown(slotKey){
  const p = game.player; if(!p || !p.skillSlots) return;
  if(p.skillSlots[slotKey]==='aimedShot' && aimedHoldReady(slotKey)){ PC.hold = {slot:slotKey, t0:pcNow(), via:'key:'+slotKey}; pcAimLoad(p); return; }
  triggerSkillSlot(slotKey);
}
function pcAttackPress(){
  const p = game.player; if(!p) return;
  const main = p.skillSlots ? p.skillSlots.main : 'strike';
  if(main==='aimedShot' && aimedHoldReady('main')){ PC.hold = {slot:'main', t0:pcNow(), via:'attack'}; pcAimLoad(game.player); return; }
  onAttackDown();
}
function pcAttackRelease(){
  if(PC.hold && PC.hold.via==='attack') pcFireAimed();
  onAttackUp();
}
function pcDodge(){
  const p = game.player; if(!p) return;
  if(!joyActive && !(PC.kbW||PC.kbA||PC.kbS||PC.kbD)){      // standing still: dodge toward the cursor
    const c = pcCursorWorld();
    if(c){ const dx=c.x-p.x, dy=c.y-p.y, d=Math.hypot(dx,dy); if(d>4){ p.facing = {x:dx/d, y:dy/d}; p.faceSign = screenFacingSign(p.facing.x, p.facing.y); } }
  }
  wantDodge = true;
}
function pcFrame(){
  if(!pcEnabled()){ if(PC.hadKb){ PC.hadKb = false; if(!joyActive) joyVec = {x:0,y:0}; } return; }
  if(!joyActive){
    const x = (PC.kbD?1:0) - (PC.kbA?1:0), y = (PC.kbS?1:0) - (PC.kbW?1:0);
    if(x||y){ const m = Math.hypot(x,y); joyVec = {x:x/m, y:y/m}; PC.hadKb = true; }
    else if(PC.hadKb){ joyVec = {x:0,y:0}; PC.hadKb = false; }
  }
  if((PC.lmb || PC.strikeKey) && pcLive() && !PC.hold && !uiOpen() && !combatActionsBlocked()){
    const p = game.player;
    if(!p.skillSlots || (p.skillSlots.main||'strike')==='strike') onAttackDown();   // only plain Strike auto-repeats (toggle skills like Whirlwind must not)
  }
  if(PC.khT===0 || pcNow()-PC.khT > 1000) refreshKeyHints();
}
function pcReleaseAll(){
  PC.kbW = PC.kbA = PC.kbS = PC.kbD = false; PC.lmb = false; PC.strikeKey = false; PC.hold = null;
  if(attackHeld) onAttackUp();
}
window.addEventListener('blur', pcReleaseAll);
window.addEventListener('touchstart', ()=>{ PC.lastTouch = pcNow(); if(PC.mouseOn || PC.kbOn){ PC.mouseOn = false; PC.kbOn = false; PC.lmb = false; pcRefreshBody(); } }, {capture:true, passive:true});
window.addEventListener('touchend', ()=>{ PC.lastTouch = pcNow(); }, {capture:true, passive:true});
window.addEventListener('mousemove', ev=>{
  if(pcTouchRecent()) return;
  PC.mx = ev.clientX; PC.my = ev.clientY;
  if(!PC.mouseOn){ PC.mouseOn = true; pcRefreshBody(); }
}, true);
function pcGameTarget(t){ return t===canvas || t===joyzone || t===aimzone || t===document.body || t===document.documentElement || (t && t.id==='wrap'); }
window.addEventListener('mousedown', ev=>{
  if(pcTouchRecent() || !pcLive() || !pcGameTarget(ev.target) || uiOpen()) return;
  PC.mx = ev.clientX; PC.my = ev.clientY; if(!PC.mouseOn){ PC.mouseOn = true; pcRefreshBody(); }
  if(ev.button===0){ ev.preventDefault(); ev.stopPropagation(); PC.lmb = true; pcAttackPress(); }
  else if(ev.button===2){ ev.preventDefault(); ev.stopPropagation(); pcDodge(); }
}, true);
window.addEventListener('mouseup', ev=>{
  if(ev.button===0 && PC.lmb){ PC.lmb = false; if(!PC.strikeKey) pcAttackRelease(); }
}, true);
window.addEventListener('contextmenu', ev=>{ if(!pcTouchRecent() && pcLive() && pcGameTarget(ev.target)) ev.preventDefault(); }, true);

function pcKeyAction(code){ const kb = getKeybinds(); for(const k of KEYBIND_ORDER) if(kb[k] && kb[k]===code) return k; return null; }
function typingTarget(t){ return !!(t && (t.tagName==='INPUT' || t.tagName==='TEXTAREA' || t.tagName==='SELECT' || t.isContentEditable)); }
window.addEventListener('keydown', ev=>{
  if(PC.rebinding){ ev.preventDefault(); ev.stopPropagation(); if(!ev.repeat) pcFinishRebind(ev); return; }
  if(ev.ctrlKey || ev.metaKey || ev.altKey || typingTarget(ev.target)) return;
  if(!pcLive()) return;
  const code = ev.code;
  const moveKey = code==='KeyW' || code==='KeyA' || code==='KeyS' || code==='KeyD';
  const act = moveKey ? null : pcKeyAction(code);
  if(!moveKey && !act) return;
  if(uiOpen()) return;
  ev.preventDefault();
  if(!PC.kbOn){ PC.kbOn = true; pcRefreshBody(); }
  if(moveKey){ if(code==='KeyW') PC.kbW = true; else if(code==='KeyA') PC.kbA = true; else if(code==='KeyS') PC.kbS = true; else PC.kbD = true; return; }
  if(ev.repeat) return;
  if(act==='slot1' || act==='slot2' || act==='slot3') pcSlotDown(act);
  else if(act==='potion') usePotionSlot();
  else if(act==='interact'){ const bi = document.getElementById('btnInteract'); if(bi && bi.style.display!=='none') bi.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true})); }
  else if(act==='dodge') pcDodge();
  else if(act==='strike'){ PC.strikeKey = true; pcAttackPress(); }
}, true);
window.addEventListener('keyup', ev=>{
  const code = ev.code;
  if(code==='KeyW') PC.kbW = false; else if(code==='KeyA') PC.kbA = false; else if(code==='KeyS') PC.kbS = false; else if(code==='KeyD') PC.kbD = false;
  const act = pcKeyAction(code); if(!act) return;
  if(act==='strike' && PC.strikeKey){ PC.strikeKey = false; if(!PC.lmb) pcAttackRelease(); }
  else if(PC.hold && PC.hold.via==='key:'+act) pcFireAimed();
}, true);

// ---- Settings > Controls screen ----
const controlsOverlay = document.getElementById('controlsOverlay');
const controlsList = document.getElementById('controlsKeyList');
const controlsNote = document.getElementById('controlsNote');
function renderControlsList(){
  const kb = getKeybinds();
  setToggleUI(document.getElementById('togglePcControls'), pcEnabled());
  controlsList.innerHTML = KEYBIND_ORDER.map(k=>{
    const listening = PC.rebinding===k, name = keyName(kb[k]);
    return '<div class="toggleRow" style="padding:8px 12px; margin-bottom:6px;"><div class="toggleRowBody"><div class="schName">'+KEYBIND_LABELS[k]+'</div></div>'+
      '<button class="keyCap'+(listening?' listening':'')+(!kb[k]&&!listening?' unset':'')+'" data-act="'+k+'">'+(listening ? 'Press a key…' : (name || 'None'))+'</button></div>';
  }).join('');
}
controlsList.addEventListener('click', ev=>{
  const b = ev.target.closest('.keyCap'); if(!b) return;
  PC.rebinding = (PC.rebinding===b.getAttribute('data-act')) ? null : b.getAttribute('data-act');
  controlsNote.textContent = PC.rebinding ? 'Press the new key for '+KEYBIND_LABELS[PC.rebinding]+'…' : '';
  renderControlsList();
});
function pcFinishRebind(ev){
  const act = PC.rebinding, code = ev.code;
  if(code==='Escape'){ PC.rebinding = null; controlsNote.textContent = ''; renderControlsList(); return; }
  if(code==='Backspace' || code==='Delete'){
    const kb = getKeybinds(); kb[act] = ''; settings.keybinds = kb; saveSettings(settings);
    PC.rebinding = null; controlsNote.textContent = KEYBIND_LABELS[act]+' cleared.'; renderControlsList(); refreshKeyHints(); return;
  }
  if(KEY_RESERVED[code]){ controlsNote.textContent = (code.indexOf('Key')===0 ? keyName(code)+' is reserved for movement' : keyName(code)+' can’t be used')+' — pick another key.'; return; }
  const kb = getKeybinds(); let cleared = null;
  for(const k of KEYBIND_ORDER) if(k!==act && kb[k]===code){ kb[k] = ''; cleared = k; }
  kb[act] = code; settings.keybinds = kb; saveSettings(settings);
  PC.rebinding = null;
  controlsNote.textContent = KEYBIND_LABELS[act]+' → '+keyName(code)+(cleared ? ' ('+KEYBIND_LABELS[cleared]+' was unbound)' : '');
  renderControlsList(); refreshKeyHints();
}
document.getElementById('togglePcControls').addEventListener('click', ()=>{
  settings.pcControls = !pcEnabled(); saveSettings(settings);
  if(!pcEnabled()) pcReleaseAll();
  renderControlsList(); pcRefreshBody();
});
document.getElementById('controlsResetBtn').addEventListener('click', ()=>{
  settings.keybinds = null; saveSettings(settings); PC.rebinding = null; controlsNote.textContent = 'Key bindings reset to defaults.'; renderControlsList(); refreshKeyHints();
});
document.getElementById('settingsControlsBtn').addEventListener('click', ()=>{ renderControlsList(); controlsNote.textContent = ''; settingsOverlay.style.display = 'none'; controlsOverlay.style.display = 'flex'; });
document.getElementById('controlsClose').addEventListener('click', ()=>{ PC.rebinding = null; controlsOverlay.style.display = 'none'; settingsOverlay.style.display = 'flex'; });
refreshKeyHints();

