// Offer to continue a saved character, so progress survives exiting the app/tab.
// With 2+ saved characters, Continue opens a character-select submenu instead
// of always resuming the same one.
function refreshStartScreenButtons(){
  const list = loadAllSaves();
  const continueBtn = document.getElementById('continueBtn');
  const sub = document.getElementById('continueSub');
  if(list.length===0){
    continueBtn.style.display = 'none';
    sub.style.display = 'none';
  } else {
    continueBtn.style.display = 'block';
    sub.style.display = 'block';
    if(list.length===1){
      const s = list[0];
      sub.innerHTML = 'Level '+(s.level||1)+' '+characterLabel(s)+' &middot; '+(s.gold||0)+'g';
    } else {
      sub.innerHTML = list.length+' characters saved';
    }
  }
}
// Renders the character-select submenu. mode 'continue' just picks a character
// to resume; mode 'slotsFull' is shown instead of starting a new character
// once all MAX_CHARACTER_SLOTS are taken, so one can be deleted to make room.
function renderCharSelect(mode){
  const list = loadAllSaves().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  document.getElementById('charSelectSub').textContent = mode==='slotsFull'
    ? ('All '+MAX_CHARACTER_SLOTS+' character slots are full — delete one to create a new character')
    : 'Choose a character to continue';
  const wrap = document.getElementById('charList');
  wrap.innerHTML = '';
  for(const save of list){
    const row = document.createElement('button');
    row.className = 'classCard';
    row.innerHTML =
      '<div class="classIcon">'+(save.cls==='ranger' ? '&#127993;' : save.cls==='mystic' ? '&#128302;' : '&#9876;&#65039;')+'</div>'+
      '<div style="flex:1;">'+
        '<div class="className">Lv.'+(save.level||1)+' '+characterLabel(save)+'</div>'+
        '<div class="classDesc">'+(save.gold||0)+'g &middot; Deaths '+(save.deaths||0)+(save.breachReached ? ' &middot; Breach '+(save.breachBest||0) : '')+'</div>'+
      '</div>'+
      '<div class="charDelete" data-id="'+save.id+'">&#10005;</div>';
    row.addEventListener('click', (ev)=>{
      if(ev.target.closest('.charDelete')) return;
      document.getElementById('charSelect').style.display='none';
      document.getElementById('start').style.display='none';
      startGame(save);
    });
    wrap.appendChild(row);
  }
  wrap.querySelectorAll('.charDelete').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      const id = btn.getAttribute('data-id');
      const save = list.find(s=>s.id===id);
      openConfirmDelete(id, mode, save ? ('Lv.'+(save.level||1)+' '+characterLabel(save)) : null);
    });
  });
}
// Character delete uses its own in-app confirmation modal rather than the
// browser's window.confirm(), which is unreliable (often silently blocked
// or auto-dismissed) inside the Capacitor Android WebView.
let pendingDeleteId = null, pendingDeleteMode = null;
function openConfirmDelete(id, mode, label){
  pendingDeleteId = id; pendingDeleteMode = mode;
  document.getElementById('confirmDeleteText').textContent = 'Delete '+(label||'this character')+'? This cannot be undone.';
  document.getElementById('confirmDeleteOverlay').style.display = 'flex';
}
function closeConfirmDelete(){
  document.getElementById('confirmDeleteOverlay').style.display = 'none';
  pendingDeleteId = null; pendingDeleteMode = null;
}
document.getElementById('confirmDeleteNo').addEventListener('click', closeConfirmDelete);
document.getElementById('confirmDeleteYes').addEventListener('click', ()=>{
  if(pendingDeleteId){
    const mode = pendingDeleteMode;
    deleteSave(pendingDeleteId);
    closeConfirmDelete();
    renderCharSelect(mode);
    refreshStartScreenButtons();
  }
});
// (v244) give Character / Class select the same D2 scene as the title screen
(function(){
  const st = document.getElementById('start'); let n = 0;
  const parts = Array.from(st.children).filter(c=>c.matches('.tsScene,.tsGlow,.tsEmber,.tsVig'));
  for(const id of ['charSelect','classSelect']){
    const host = document.getElementById(id); n++;
    const frag = document.createDocumentFragment();
    for(const part of parts){
      const c = part.cloneNode(true);
      if(c.matches('.tsScene')){ c.innerHTML = c.innerHTML.replace(/id="(ts\w+)"/g,'id="$1_'+n+'"').replace(/url\(#(ts\w+)\)/g,'url(#$1_'+n+')'); }
      frag.appendChild(c);
    }
    host.insertBefore(frag, host.firstChild);
  }
})();
refreshStartScreenButtons();
document.getElementById('continueBtn').addEventListener('click', ()=>{
  const list = loadAllSaves();
  if(list.length===1){
    document.getElementById('start').style.display='none';
    startGame(list[0]);
  } else if(list.length>1){
    renderCharSelect('continue');
    document.getElementById('charSelect').style.display='flex';
  }
});
document.getElementById('startBtn').addEventListener('click', ()=>{
  if(loadAllSaves().length >= MAX_CHARACTER_SLOTS){
    renderCharSelect('slotsFull');
    document.getElementById('charSelect').style.display='flex';
    return;
  }
  document.getElementById('start').style.display='none';
  if(typeof pickClass==='function') pickClass(null);
  document.getElementById('classSelect').style.display='flex';
});
document.getElementById('charBack').addEventListener('click', ()=>{
  document.getElementById('charSelect').style.display='none';
});
// v370: picking a class only highlights it; the Confirm button starts the new character
let pickedClass = null;
function pickClass(cls){
  pickedClass = cls;
  for(const c of ['warrior','ranger','mystic']) document.getElementById('class'+c[0].toUpperCase()+c.slice(1)).classList.toggle('selected', c===cls);
  document.getElementById('classConfirm').disabled = !cls;
}
document.getElementById('classWarrior').addEventListener('click', ()=>pickClass('warrior'));
document.getElementById('classRanger').addEventListener('click', ()=>pickClass('ranger'));
document.getElementById('classMystic').addEventListener('click', ()=>pickClass('mystic'));
document.getElementById('classConfirm').addEventListener('click', ()=>{
  if(!pickedClass) return;
  const cls = pickedClass; pickClass(null);
  document.getElementById('classSelect').style.display='none';
  startGame(null, cls);
});
document.getElementById('classBack').addEventListener('click', ()=>{
  pickClass(null);
  document.getElementById('classSelect').style.display='none';
  document.getElementById('start').style.display='flex';
});
document.getElementById('retryBtn').addEventListener('click', returnToTown);
document.getElementById('respawnRegionBtn').addEventListener('click', respawnInRegion);

// v62: a __test hook for Playwright regression coverage to reach into
// otherwise-closure-scoped internals (this whole file is one IIFE). Not
// referenced by any normal game code path -- purely a test seam.
// v403: tag every pack's members with a shared packId (see the pack-wake alarm in the enemy update loop)
(function(){
  let _packSeq = 0;
  const wrap = orig => function(g, ...rest){ const n0 = g.enemies.length; const r = orig.call(this, g, ...rest); const id = 'pk'+(++_packSeq); for(let i=n0;i<g.enemies.length;i++) g.enemies[i].packId = id; return r; };
  spawnForestPack = wrap(spawnForestPack); spawnSunlitPack = wrap(spawnSunlitPack); spawnLakesidePack = wrap(spawnLakesidePack);
  spawnRiverValleyPack = wrap(spawnRiverValleyPack); spawnRedridgePack = wrap(spawnRedridgePack); spawnFrostholdPack = wrap(spawnFrostholdPack);
  spawnIcyPack = wrap(spawnIcyPack); spawnMountainPassPack = wrap(spawnMountainPassPack);
})();
