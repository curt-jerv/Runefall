// ---------- Shared Stash (Town chest) ----------
// A second bag grid (#stashGrid) alongside a mirror of the player's own
// bag (#stashBagGrid), reusing the exact same .bagCell rendering, the
// drag-and-drop system above, and the item-detail popup -- items dragged
// (or tapped -> Withdraw/Store in Stash) between the two move between
// stash.items and p.inventory. stash.gold is separate from p.gold; the
// two gold cells swap their whole totals on a tap (see transferGold*).
// v81: tab-switcher row for the 4 stash tabs -- only shown (and only
// switchable past Tab 1) while settings.expandedStash is ON. Reuses the
// skill tree's existing .treeTabs/.treeTabBtn look for visual consistency
// with the rest of the Menu-family popups rather than a new tab style.
function renderStashTabs(){
  const wrap = document.getElementById('stashTabs');
  if(!(settings.expandedStash && settings.stashOwned)){
    wrap.style.display = 'none';
    if(stashActiveTab!==0){ stashActiveTab = 0; syncStashItemsView(); }
    return;
  }
  wrap.style.display = 'flex';
  wrap.innerHTML = '';
  for(let i=0;i<STASH_TAB_COUNT;i++){
    const b = document.createElement('div');
    b.className = 'treeTabBtn' + (i===stashActiveTab ? ' active' : '');
    b.textContent = 'Tab '+(i+1);
    b.addEventListener('click', ()=>{
      if(stashActiveTab===i) return;
      stashActiveTab = i;
      syncStashItemsView();
      renderStashTabs();
      renderStash();
    });
    wrap.appendChild(b);
  }
}
function renderStash(){
  const p = game.player;
  document.getElementById('stashGoldNum').textContent = stash.gold||0;
  document.getElementById('bagGoldNum').textContent = p.gold||0;
  const CELL = 32;
  const stashGridEl = document.getElementById('stashGrid');
  stashGridEl.querySelectorAll('.bagCell').forEach(el=>el.remove());
  for(let i=0;i<stash.items.length;i++){
    const it = stash.items[i];
    if(it.gx==null || it.gy==null) continue;
    const [w,h] = itemShape(it);
    const el = document.createElement('div');
    el.className = 'bagCell';
    el.style.left = (it.gx*CELL+1)+'px';
    el.style.top = (it.gy*CELL+1)+'px';
    el.style.width = (w*CELL-2)+'px';
    el.style.height = (h*CELL-2)+'px';
    el.style.borderColor = it.color; if(it.crimson){ el.style.boxShadow = '0 0 8px 2px rgba(142,15,38,.85), inset 0 0 8px rgba(142,15,38,.6)'; }
    el.dataset.idx = i;
    el.innerHTML =
      bagItemHtml(it);
    el.title = it.name+' — '+it.affixes.map(affixTooltipLine).join(', ');
    makeItemDraggable(el, i, 'stash');
    stashGridEl.appendChild(el);
  }
  const stashBagEl = document.getElementById('stashBagGrid');
  stashBagEl.querySelectorAll('.bagCell').forEach(el=>el.remove());
  for(let i=0;i<p.inventory.length;i++){
    const it = p.inventory[i];
    if(it.gx==null || it.gy==null) continue;
    const [w,h] = itemShape(it);
    const el = document.createElement('div');
    el.className = 'bagCell';
    el.style.left = (it.gx*CELL+1)+'px';
    el.style.top = (it.gy*CELL+1)+'px';
    el.style.width = (w*CELL-2)+'px';
    el.style.height = (h*CELL-2)+'px';
    el.style.borderColor = it.color; if(it.crimson){ el.style.boxShadow = '0 0 8px 2px rgba(142,15,38,.85), inset 0 0 8px rgba(142,15,38,.6)'; }
    el.dataset.idx = i;
    el.innerHTML =
      bagItemHtml(it);
    el.title = it.name+' — '+it.affixes.map(affixTooltipLine).join(', ');
    makeItemDraggable(el, i, 'inv');
    stashBagEl.appendChild(el);
  }
}
function openStash(){
  game.modalOpen = true; try{ sfxPlay('stashOpen', 1); }catch(e){}
  stash = loadStash(); // pick up anything another character/session stored
  { let moved = 0; for(const tab of (stash.tabs||[])){ for(let i=tab.length-1;i>=0;i--){ if(isNoStashItem(tab[i])){ const it = tab.splice(i,1)[0]; delete it.gx; delete it.gy; forceAddToBag(game.player, it); moved++; } } } if(moved){ saveStash(); showMsg('Quest items went back to your bag', 2.2, '#ffd93a'); } }   // v452
  stashActiveTab = 0;
  syncStashItemsView();
  renderStashTabs();
  renderStash();
  stashOverlay.style.display = 'flex';
}
function closeStash(){
  stashOverlay.style.display = 'none';
  document.getElementById('itemDetailOverlay').style.display = 'none';
  game.modalOpen = false;
}
document.getElementById('stashClose').addEventListener('click', closeStash);

