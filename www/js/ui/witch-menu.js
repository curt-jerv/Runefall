// ---------- Witch parts menu (v215): Combine 3 -> 1 higher tier, or Shop for random parts ----------
const witchOverlay = document.getElementById('witchOverlay');
let witchTab = 'combine';
function openWitchParts(tab){
  vendorRestockCheck();
  game.modalOpen = true; witchTab = tab || 'combine';
  witchOverlay.style.display = 'flex';
  renderWitchParts();
}
let cauldronSlots = [null,null,null];
function cauldronReturn(){ const p = game.player; for(let i=0;i<3;i++){ const id = cauldronSlots[i]; if(id){ const [k,t] = id.split('_'); addPart(p,k,+t); cauldronSlots[i] = null; } } }
function closeWitchParts(){ cauldronReturn(); witchOverlay.style.display = 'none'; game.modalOpen = false; }
// ---- v490: Recipe Book helpers (inventory Parts tab + the witch's Recipes tab) ----
// The cauldron works once the witch is freed and has spoken to you at her camp (p.partsHarvest = "taught").
function witchCauldronReady(p){ return !!(p && p.witchRescued && p.partsHarvest); }
// Which part ids (cheapest tier first; Perfect only for amber recipes) would fill this recipe, or null if you lack them.
function recipePartIds(p, r){
  const have = Object.assign({}, p.parts||{}), out = [];
  for(const k of r.parts){
    let got = null;
    for(const t of (r.perfect ? [3] : [1,2,3])){ const id = partId(k,t); if((have[id]||0)>0){ got = id; break; } }
    if(!got) return null;
    have[got]--; out.push(got);
  }
  return out;
}
// One recipe row: stone, its parts (green = you hold it) and a green check mark when you hold all three.
function recipeRowHtml(p, r){
  const sd = PART_DEFS[r.stone], ids = recipePartIds(p, r), have = Object.assign({}, p.parts||{});
  const parts = r.parts.map(k=>{
    let ok = false; for(const t of (r.perfect ? [3] : [1,2,3])){ const id = partId(k,t); if((have[id]||0)>0){ have[id]--; ok = true; break; } }
    return '<span style="color:'+(ok?'#7fd87f':'var(--bone-dim)')+'">'+(r.perfect?'Perfect ':'')+PART_DEFS[k].name+'</span>';
  }).join(' + ');
  return '<div class="partCard rbRow'+(sd.unique?' uq':'')+'"><div class="pIcon">'+sd.icon+'</div><div class="pMain" style="color:'+sd.color+'"><b>'+sd.name+'</b><div class="pSub">'+parts+'</div></div>'
    + (ids ? '<div class="rbCheck" data-rbload="'+r.id+'" title="Load into the cauldron">\u2714</div>' : '<div class="rbCheck off"></div>')+'</div>';
}
// Tap a check mark: open the cauldron with that recipe's parts in the pot. Nothing is brewed until you press Transmute.
function cauldronLoadRecipe(rid){
  const p = game.player, r = STONE_RECIPES.find(x=>x.id===rid); if(!p || !r) return false;
  if(!witchCauldronReady(p)){ showMsg("Bring these to the Witch's cauldron", 2.0, '#e8c860'); return false; }
  cauldronReturn();
  const ids = recipePartIds(p, r);
  if(!ids){ showMsg('You are missing parts for this recipe', 1.6); return false; }
  for(let i=0;i<3;i++){ const [k,t] = ids[i].split('_'); takePart(p,k,+t,1); cauldronSlots[i] = ids[i]; }
  if(invOverlay.style.display==='flex') closeInventory();
  if(witchOverlay.style.display!=='flex') openWitchParts('cauldron'); else { witchTab = 'cauldron'; renderWitchParts(); }
  showMsg('Parts placed in the cauldron. Press Transmute to brew.', 2.2, PART_DEFS[r.stone].color);
  return true;
}
function witchEnsureStock(p){
  if(!Array.isArray(p.witchStock)){
    p.witchStock = [];
    for(let i=0;i<PART_SHOP_SLOTS;i++) p.witchStock.push(PART_SHOP_KEYS[Math.floor(Math.random()*PART_SHOP_KEYS.length)]);
  }
  return p.witchStock;
}
function renderWitchParts(){
  const p = game.player, body = document.getElementById('witchBody');
  document.getElementById('witchTabCombine').classList.toggle('active', witchTab==='combine');
  document.getElementById('witchTabShop').classList.toggle('active', witchTab==='shop');
  document.getElementById('witchTabSell').classList.toggle('active', witchTab==='sell');
  document.getElementById('witchTabCauldron').classList.toggle('active', witchTab==='cauldron');
  document.getElementById('witchTabRecipes').classList.toggle('active', witchTab==='recipes');
  let h = '';
  if(witchTab==='combine'){
    h += '<div style="font-size:12px; color:var(--bone-dim); margin-bottom:8px;">"Bring me three of the same part and I will bind them into one greater part." (5% \u2192 10% \u2192 15%)</div>';
    const ids = Object.keys(p.parts||{}).sort();
    let any = false;
    for(const id of ids){
      const [k,t] = id.split('_'), n = p.parts[id], tier = +t;
      if(tier>=3 || n<3 || PART_DEFS[k].quest) continue;
      any = true;
      h += '<div class="partCard"><div class="pIcon">'+PART_DEFS[k].icon+'</div><div class="pMain" style="color:'+PART_DEFS[k].color+'"><b>'+partName(k,tier)+'</b> \u00d7'+n+'<div class="pSub">3 \u2192 1 '+partName(k,tier+1)+' ('+partDesc(k,tier+1)+')</div></div><div class="partBtn" data-combine="'+id+'">Combine</div></div>';
    }
    if(!any) h += '<div style="color:var(--bone-dim); font-size:12px; padding:8px;">You have no set of three matching parts to combine.</div>';
  } else if(witchTab==='cauldron'){
    h += '<div style="font-size:12px; color:var(--bone-dim); margin-bottom:8px;">"Drop three parts into the pot and see what stirs. What is brewed is not undone, and the parts are lost."</div>';
    h += '<div style="display:flex; gap:8px; margin-bottom:8px;">';
    for(let i=0;i<3;i++){
      const id = cauldronSlots[i];
      if(id){ const [k,t] = id.split('_'); h += '<div class="partCard" data-cslot="'+i+'" style="flex:1; flex-direction:column; text-align:center; cursor:pointer; margin:0;"><div class="pIcon">'+PART_DEFS[k].icon+'</div><div style="color:'+PART_DEFS[k].color+'; font-size:11px;">'+partName(k,+t)+'</div><div class="pSub">tap to remove</div></div>'; }
      else h += '<div class="partCard" style="flex:1; flex-direction:column; text-align:center; opacity:.45; margin:0; min-height:62px; justify-content:center;">Empty</div>';
    }
    h += '</div>';
    const filled = cauldronSlots.filter(Boolean);
    if(filled.length===3){
      const keys = filled.map(id=>id.split('_')[0]), rec = RECIPE_BY_KEY[recipeKey(keys)];
      let msg;
      const imperfect = !!(rec && rec.perfect && !filled.every(id=>+id.split('_')[1]>=3));
      if(imperfect) msg = '<b style="color:#f2a31b">The pot glows amber.</b><div class="pSub">A unique power stirs, but these parts are flawed. Only Perfect parts will do.</div>';
      else if(rec && (p.recipes||{})[rec.id]){ const sd = PART_DEFS[rec.stone]; msg = '<b style="color:'+sd.color+'">'+sd.icon+' '+sd.name+'</b><div class="pSub">'+sd.desc+'</div>'; }
      else if(rec) msg = '<b style="color:#c8a0ff">The mixture glows with strange power.</b><div class="pSub">An unknown reaction. Transmute to find out what it makes.</div>';
      else { let best = 0; for(const r of STONE_RECIPES) best = Math.max(best, recipeOverlap(keys, r)); msg = best>=2 ? '<b style="color:#e8c860">The cauldron hums faintly.</b><div class="pSub">Two of these parts belong together. The third does not.</div>' : '<b style="color:var(--bone-dim)">The mixture sputters.</b><div class="pSub">Nothing stirs. It will likely fizzle and waste the parts.</div>'; }
      h += '<div class="partCard" style="margin-bottom:8px;"><div class="pMain">'+msg+'</div><div class="partBtn" data-transmute="1">Transmute</div></div>';
    } else h += '<div style="font-size:11.5px; color:var(--bone-dim); margin-bottom:8px;">Choose '+(3-filled.length)+' more part'+(3-filled.length===1?'':'s')+' below.</div>';
    const ids = Object.keys(p.parts||{}).filter(id=>{ const d = PART_DEFS[id.split('_')[0]]; return d && !d.stone; }).sort();
    for(const id of ids){
      const [k,t] = id.split('_'), n = p.parts[id];
      h += '<div class="partCard"><div class="pIcon">'+PART_DEFS[k].icon+'</div><div class="pMain" style="color:'+PART_DEFS[k].color+'"><b>'+partName(k,+t)+'</b> \u00d7'+n+'<div class="pSub">'+partDesc(k,+t)+'</div></div><div class="partBtn'+(filled.length>=3?' off':'')+'" data-cadd="'+id+'">Add</div></div>';
    }
    if(!ids.length) h += '<div style="color:var(--bone-dim); font-size:12px; padding:8px;">You have no parts to experiment with.</div>';
  } else if(witchTab==='recipes'){
    const known = p.recipes||{}, nk = STONE_RECIPES.filter(r=>known[r.id]).length;
    h += '<div style="font-size:12px; color:var(--bone-dim); margin-bottom:8px;">Recipes discovered: '+nk+' / '+STONE_RECIPES.length+'. Experiment in the cauldron to learn more.</div><div style="font-size:11.5px; color:#f2a31b; margin-bottom:8px;">Amber stones are UNIQUE: they need three Perfect parts and character level 40 to socket, and once socketed they can never be removed.</div>';
    for(const r of STONE_RECIPES){
      const sd = PART_DEFS[r.stone];
      if(known[r.id]){ const ok = !!recipePartIds(p, r);   // v490: a green check mark loads the cauldron
        h += '<div class="partCard'+(sd.unique?' uq':'')+'"><div class="pIcon">'+sd.icon+'</div><div class="pMain" style="color:'+sd.color+'"><b>'+sd.name+'</b><div class="pSub">'+sd.desc+'</div><div class="pSub">Recipe: '+r.parts.map(k=>(r.perfect?'Perfect ':'')+PART_DEFS[k].name).join(' + ')+'</div></div>'+(ok ? '<div class="rbCheck" data-rbload="'+r.id+'" title="Load into the cauldron">\u2714</div>' : '')+'</div>'; }
      else h += '<div class="partCard'+(sd.unique?' uq':'')+'" style="opacity:.6;"><div class="pIcon">?</div><div class="pMain"><b>'+(sd.unique?'Unknown unique recipe':'Unknown recipe')+'</b><div class="pSub"><i>'+r.hint+'</i></div></div></div>';
    }
  } else if(witchTab==='sell'){
    h += '<div style="font-size:12px; color:var(--bone-dim); margin-bottom:8px;">"I will pay for what you cannot use." You have '+Math.floor(p.gold)+'g.</div>';
    let anyS = false;
    for(const id of Object.keys(p.parts||{}).sort()){
      const [k,t] = id.split('_'), n = p.parts[id], tier = +t;
      if(!PART_DEFS[k] || PART_DEFS[k].quest || n<=0) continue;
      anyS = true; const pr = PART_SELL_PRICE[tier]||0;
      h += '<div class="partCard"><div class="pIcon">'+PART_DEFS[k].icon+'</div><div class="pMain" style="color:'+PART_DEFS[k].color+'"><b>'+partName(k,tier)+'</b> \u00d7'+n+'<div class="pSub">'+partDesc(k,tier)+'</div></div><div class="partBtn" data-sell="'+id+'">Sell '+pr+'g</div></div>';
    }
    if(!anyS) h += '<div style="color:var(--bone-dim); font-size:12px; padding:8px;">You have no parts she will buy. Quest parts cannot be sold.</div>';
  } else {
    const st = witchEnsureStock(p);
    h += '<div style="font-size:12px; color:var(--bone-dim); margin-bottom:8px;">"Something from my shelf?" Restocks in '+restockLabel()+'. You have '+Math.floor(p.gold)+'g.</div>';
    st.forEach((k,i)=>{
      if(!k){ h += '<div class="partCard" style="opacity:.4;"><div class="pMain">Sold</div></div>'; return; }
      h += '<div class="partCard"><div class="pIcon">'+PART_DEFS[k].icon+'</div><div class="pMain" style="color:'+PART_DEFS[k].color+'"><b>'+partName(k,1)+'</b><div class="pSub">'+partDesc(k,1)+'</div></div><div class="partBtn'+(p.gold>=PART_SHOP_PRICE?'':' off')+'" data-buy="'+i+'">Buy '+PART_SHOP_PRICE+'g</div></div>';
    });
  }
  body.innerHTML = h;
}
document.getElementById('witchClose').addEventListener('click', closeWitchParts);
document.getElementById('witchTabCombine').addEventListener('click', ()=>{ cauldronReturn(); witchTab='combine'; renderWitchParts(); });
document.getElementById('witchTabCauldron').addEventListener('click', ()=>{ witchTab='cauldron'; renderWitchParts(); });
document.getElementById('witchTabRecipes').addEventListener('click', ()=>{ cauldronReturn(); witchTab='recipes'; renderWitchParts(); });
document.getElementById('witchTabShop').addEventListener('click', ()=>{ cauldronReturn(); witchTab='shop'; renderWitchParts(); });
document.getElementById('witchTabSell').addEventListener('click', ()=>{ cauldronReturn(); witchTab='sell'; renderWitchParts(); });
document.getElementById('witchBody').addEventListener('click', e=>{
  const p = game.player;
  { const rb = e.target.closest('[data-rbload]'); if(rb){ cauldronLoadRecipe(rb.dataset.rbload); return; } }   // v490
  const c = e.target.closest('[data-combine]');
  if(c){
    const [k,t] = c.dataset.combine.split('_');
    if(+t<3 && takePart(p,k,+t,3)){ addPart(p,k,+t+1); showMsg('Combined: '+partName(k,+t+1), 2.0, PART_DEFS[k].color); saveGame(); renderWitchParts(); try{ renderInventory(); }catch(_){} }
    return;
  }
  const ca = e.target.closest('[data-cadd]');
  if(ca){
    const i = cauldronSlots.indexOf(null); if(i<0) return;
    const [k,t] = ca.dataset.cadd.split('_');
    if(takePart(p,k,+t,1)){ cauldronSlots[i] = ca.dataset.cadd; renderWitchParts(); }
    return;
  }
  const cs = e.target.closest('[data-cslot]');
  if(cs){ const i = +cs.dataset.cslot, id = cauldronSlots[i]; if(id){ const [k,t] = id.split('_'); addPart(p,k,+t); cauldronSlots[i] = null; renderWitchParts(); } return; }
  if(e.target.closest('[data-transmute]')){
    if(cauldronSlots.some(s=>!s)) return;
    const ids3 = cauldronSlots.slice(), keys = ids3.map(id=>id.split('_')[0]), rec = RECIPE_BY_KEY[recipeKey(keys)];
    if(rec && rec.perfect && !ids3.every(id=>+id.split('_')[1]>=3)){
      cauldronReturn(); showMsg('The amber glow gutters out. These parts are not Perfect. Nothing is lost.', 3.2, '#f2a31b'); renderWitchParts(); return;
    }
    cauldronSlots = [null,null,null];
    if(rec){
      const sd = PART_DEFS[rec.stone]; addPart(p, rec.stone, 1);
      try{ achFlag('stoneCraft'); if(sd.unique) achFlag('amberCraft'); }catch(e){}   // v489
      const first = !(p.recipes||{})[rec.id]; if(!p.recipes) p.recipes = {}; p.recipes[rec.id] = true;
      showMsg((sd.unique ? 'A UNIQUE stone is forged: ' : first?'New recipe discovered: ':'Transmuted: ')+sd.name, sd.unique?4.2:3.0, sd.color);
    } else {
      const back = ids3[Math.floor(Math.random()*3)], [bk,bt] = back.split('_'); addPart(p, bk, +bt);
      showMsg('The mixture fizzles. You salvage a '+partName(bk,+bt)+'.', 2.6, '#c8a080');
    }
    saveGame(); renderWitchParts(); try{ renderInventory(); }catch(_){}
    return;
  }
  const sl = e.target.closest('[data-sell]');
  if(sl){
    const [k,t] = sl.dataset.sell.split('_');
    if(PART_DEFS[k] && !PART_DEFS[k].quest && takePart(p,k,+t,1)){ const pr = PART_SELL_PRICE[+t]||0; p.gold += pr; showMsg('Sold: '+partName(k,+t)+'  (+'+pr+'g)', 1.8, PART_DEFS[k].color); saveGame(); renderWitchParts(); try{ renderInventory(); }catch(_){} }
    return;
  }
  const b = e.target.closest('[data-buy]');
  if(b){
    const st = witchEnsureStock(p), i = +b.dataset.buy, k = st[i];
    if(!k) return;
    if(p.gold < PART_SHOP_PRICE){ showMsg('Not enough gold', 1.4); return; }
    p.gold -= PART_SHOP_PRICE; addPart(p,k,1); st[i] = null;
    showMsg('Bought: '+PART_DEFS[k].name, 1.8, PART_DEFS[k].color);
    saveGame(); renderWitchParts(); try{ renderInventory(); }catch(_){}
  }
});
function witchHeartstoneTalk(p){
  if(hasQItem(p,'minotaur_heartstone') && !p.heartstoneDone){
      showNpcText('The Witch', '"A Minotaur Heartstone... it carries a blessing of life. Let me shape it into something you can socket."', 'Please do', ()=>{
        p.inventory = p.inventory.filter(it=>!(it && it.questId==='minotaur_heartstone'));
        p.heartstoneDone = true;
        addPart(p, 'minotaurheart', 2);
        const hq = getQuest(p,'witch_heartstone'); if(hq){ hq.status='complete'; hq.rewarded=true; hq.progress=hq.total; hq.desc='The witch turned the Heartstone into a socketable part: +10% Max HP.'; }
        showMsg('The witch made a socketable part: Minotaur Heartstone (+10% Max HP) \u2014 see the Parts tab', 4.0, '#e0504a');
        updateQuestBadge(); saveGame(); try{ renderInventory(); }catch(e){}
      });
      return true;
  }
  return false;
}
function witchPotionTalkPending(p){
  if(p.witchBrewed) return false;
  if(!p.witchPotionStarted) return !!(hasQItem(p,'electric_tentacle') || p.partKraken);
  return witchPartsHeld(p) >= WITCH_PARTS_TOTAL;
}
function witchCauldronInteract(){
  const p = game.player;
  if(p.witchRescued && p.partsHarvest && !p.witchRecipesGiven){ witchGiveRecipes(p); saveGame(); }   // v483: older saves get their recipes too
  if(p.witchRescued && witchHeartstoneTalk(p)) return;   // v344: the Heartstone is dealt with before she teaches parts harvesting
  // v283: parts harvesting is taught the first time you talk to the freed witch beside her cauldron
  if(p.witchRescued && !p.partsHarvest){
    showNpcText('The Witch', '"You freed me. Take this as thanks. Bring me the parts you cut from what you slay -- claw, pelt, tooth and horn -- and my cauldron will bind them into stones for your gear."', 'Teach me', ()=>{
      p.partsHarvest = true; witchGiveRecipes(p);   // v490: partsHarvest now means "the witch taught you" -- parts drop from the start; this opens her cauldron
      if(!p.witchRareGiven){ p.witchRareGiven = true; const wr = classRewardItem(p, Math.max(1, p.level||1), 'rare'); forceAddToBag(p, wr); bagPulse(); showMsg('The witch\u2019s cauldron is open to you. She also gives you: '+wr.name, 4.0); }
      else showMsg('The witch\u2019s cauldron is open to you \u2014 transmute your parts into stones', 3.2);
      saveGame(); try{ renderInventory(); }catch(e){}
    });
    return;
  }
  // v490: once she has taught you, her cauldron opens straight away (no need to brew her potion first),
  // unless she has something to say about the potion quest
  if(p.witchRescued && p.partsHarvest && !witchPotionTalkPending(p)){
    if(false){
      showNpcText('The Witch', '"Cut parts from what you slay and I will teach you to bind their power into your gear."', 'Teach me', ()=>{
        p.partsHarvest = true;
        showMsg('Parts harvesting unlocked \u2014 find parts in the Parts tab of your inventory', 3.2);
        saveGame(); try{ renderInventory(); }catch(e){}
      });
      return;
    }
    openWitchParts('combine');
    return;
  }
  if(p.witchRescued){
    if(witchHeartstoneTalk(p)) return;
    if(!p.witchPotionStarted && (hasQItem(p,'electric_tentacle') || p.partKraken)){
      // v456: what she says depends on how many rare parts you already carry
      const nParts = witchPartsHeld(p);
      const line = nParts>=WITCH_PARTS_TOTAL ? '"By the old gods, you\'ve collected the vital ingredients for a masterful potion."'
        : nParts>=2 ? '"A Kraken\'s tentacle... and more besides! With a few more rare parts, I could brew you a special potion."'
        : '"A Kraken\'s tentacle, still alive with lightning... Perhaps this, with some other rare parts, I could brew you a special potion."';
      showNpcText('The Witch', line, nParts>=WITCH_PARTS_TOTAL ? 'Continue' : 'I will find them', ()=>{
        p.witchPotionStarted = true;
        addQuestOnce(p, 'witch_parts', 'A Special Recipe', WITCH_RECIPE_DESC, WITCH_PARTS_TOTAL);
        updatePartsQuest(p);
        showMsg('New quest: A Special Recipe', 3.0);
        updateQuestBadge(); saveGame();
      });
      return;
    }
    if(p.witchPotionStarted && witchPartsHeld(p)>=WITCH_PARTS_TOTAL){
      showNpcText('The Witch', '"You have all four! Give them here."', 'Brew the potion', ()=>{
        const gone = {leviathan_scale:1, electric_tentacle:1, molten_shell:1, fire_claw:1, mastodon_hoof:1};
        p.inventory = p.inventory.filter(it=>!(it && it.slotType==='questitem' && gone[it.questId]));
        p.witchBrewed = true;
        const q = getQuest(p, 'witch_parts');
        if(q){ q.status = 'complete'; q.rewarded = true; q.progress = q.total; q.desc = 'The witch brewed a special purple potion from the four parts.'; }
        forceAddToBag(p, makePotionItem('purple'));
        showMsg('Quest complete: A Special Recipe', 2.8);
        showMsg('The witch consumed the parts and brewed a purple potion -- drink it from your inventory', 4.0, '#c98bff');
        updateQuestBadge(); saveGame(); if(typeof renderInventory==='function') try{ renderInventory(); }catch(e){}
      });
      return;
    }
    if(p.witchPotionStarted){
      showNpcText('The Witch', '"I need '+WITCH_PARTS_TOTAL+' beast parts. You hold '+witchPartsHeld(p)+' so far."', 'Farewell');
      return;
    }
    showNpcText('The Witch', '"Bring me anything strange you cut from the beasts."', 'Farewell');
    return;
  }
  showNpcText('The Cauldron', 'She is missing... I wonder where.', 'Continue', ()=>{
        const q = addQuestOnce(p, 'witch_find', 'The Witch of the Black Marsh', 'The witch is missing. Search for the witch.', 1);
    if(q.status==='active' && !q._seenCauldron){
      q._seenCauldron = true;
      q.desc = 'The witch is missing. Search for the witch.';
      showMsg('Quest updated: The Witch of the Black Marsh', 2.6);
    }
    updateQuestBadge(); saveGame();
  });
}
function witchTowerInteract(){
  const p = game.player;
  if(game.enemies.some(e=>e.hp>0 && (e.ftGuard || !game.enemies.some(x=>x.ftGuard)))){
    showNpcText('The Witch', '"Careful! Defeat the trolls guarding me before you open my cage."', 'Continue');
    return;
  }
  const wPos = game.tower && game.tower.witch ? {x:game.tower.witch.x, y:game.tower.witch.y} : {x:game.tower.w/2, y:game.tower.h/2};
  showNpcText('The Witch', '"Thank you. Come see me by my camp."', 'Continue', ()=>{
    p.witchRescued = true;
    if(game.tower) game.tower.witch = null;
    // Quests are tracked even if you never spoke to the Hunter or the cauldron.
    const sq = getQuest(p, 'show_scale');
    if(sq && sq.status==='active'){ sq.status = 'complete'; sq.rewarded = true; sq.progress = sq.total; }
    const q = addQuestOnce(p, 'witch_find', 'The Witch of the Black Marsh', 'Find the witch.', 1);
    q.status = 'complete'; q.rewarded = true; q.desc = 'You freed the witch from the Forgotten Tower.'; q.progress = q.total;
    showMsg('Quest complete: The Witch of the Black Marsh', 2.8);
    if(game.tower && game.tower.ft){ game.tower.clearPortal = {x:wPos.x + (wPos.x > game.tower.w/2 ? -130 : 130), y:wPos.y+60, r:24, toTown:true}; showMsg('A portal opens -- it leads back to Mistfall.', 2.6, '#9fd8ff'); }
    ensureHeartstoneQuest(p);
    updateQuestBadge(); saveGame();
  });
}
function huntBossKilled(id){
  let q = getQuest(game.player, id);
  const def = HUNTER_QUESTS.find(d=>d.Q.id===id);
  // (v147) Killed before ever talking to the Hunter: the hunt still counts.
  if(!q && def){
    if(!game.player.quests) game.player.quests = [];
    q = {id:def.Q.id, name:def.Q.name, desc:def.Q.desc, status:'active', progress:0, total:def.Q.total, killed:false};
    game.player.quests.push(q);
  }
  if(id!=='hunt_minotaur'){ const tr = HUNT_TROPHY[id] || HUNT_TROPHY.hunt_leviathan; grantBossTrophy(tr[0], tr[1]); }
  { const GB = {hunt_minotaur:['THE MINOTAUR IS SLAIN','The bone halls fall silent'], hunt_leviathan:['THE LEVIATHAN IS SLAIN','The Leviathan sinks beneath the poisoned water'], hunt_kraken:['THE KRAKEN IS SLAIN','The deep is quiet once more'], hunt_mastodon:['THE MASTODON IS SLAIN','The frozen earth stops shaking'], hunt_colossus:['THE MOLTEN COLOSSUS IS SLAIN','The mountain falls silent']};
    const gb = GB[id]; if(gb){ if(id==='hunt_leviathan'||id==='hunt_kraken'||id==='hunt_mastodon'||id==='hunt_colossus') showBigMsg(gb[0], gb[1], 4.6, false, true); else bossMsg(gb[0], gb[1], 3.4); } }
  if(id==='hunt_leviathan' || id==='hunt_kraken'){ // (v149/v244) whether or not the hunt was accepted
    const hp = game.player;
    if(id==='hunt_leviathan') hp.leviathanSlain = true; else hp.krakenSlain = true;
    if(false && !getQuest(hp,'show_scale') && !getQuest(hp,'witch_find') && !hp.witchRescued) addQuestOnce(hp, 'show_scale', id==='hunt_kraken' ? "The Kraken's Tentacle" : "The Leviathan's Scale", 'Show this to the Hunter.', 1);
  }
  if(q && def && q.status==='active' && !q.killed){
    q.killed = true; q.progress = q.total; q.desc = def.Q.descDone;
    { const hq = getQuest(game.player, QUEST_FIND_HUNTERS.id), hunterHome = !!(hq && hq.status==='complete');   // v486: the Hunter may not be in Mistfall yet
      if(!hunterHome){ q.desc = MINO_NO_HUNTER; showMsg('"I hold a unique item. Perhaps I can find someone who knows what to do with it."', 3.6); }
      else showMsg('Target slain! Return to the Hunter.', 3.0); }
    updateQuestBadge(); saveGame();
  }
}
function huntMastodonKilled(){ huntBossKilled('hunt_mastodon'); }
const hunterTextEl = document.getElementById('hunterText');
const hunterTalkBtnEl = document.getElementById('hunterTalkBtn');
const HUNTER_THANKS = '"Thank you for finding me."';
const HUNTER_SCALE_TEXT = '"Ah, you killed the Kraken! I\'ve heard of a witch who lives in the Black Marsh -- she might know what to do with the tentacle you carry. But beware... a great, mysterious monster lurks in the marsh. Beware."';
const HUNTER_SCALE_TEXT_LV = '"Ah, you killed the Leviathan! I\'ve heard of a witch who lives in the Black Marsh -- she might know what to do with the scale you carry. But beware... a great, mysterious monster lurks in the marsh. Beware."';
function hunterIsKraken(p){ return !!(p.krakenSlain||p.partKraken); }
function hunterScaleStage(p){
  return false;   // v279: the scale/tentacle 'show the hunter' stage is replaced by the Minotaur Heartstone chain
  const sq = getQuest(p, 'show_scale');
  if(!sq || sq.status!=='active') return false;
  const cur = hunterCurrent(p);
  if(cur && cur.q && cur.q.killed) return false; // claim the hunt reward first
  return true;
}
function openHunterDialogue(){
  game.modalOpen = true;
  const cur = hunterCurrent(game.player);
  if(hunterScaleStage(game.player)){ hunterTextEl.textContent = hunterIsKraken(game.player) ? HUNTER_SCALE_TEXT : HUNTER_SCALE_TEXT_LV; hunterTalkBtnEl.textContent = hunterIsKraken(game.player) ? 'Show Tentacle' : 'Show Scale'; }
  else if(gojiraChainStage(game.player)==='bolt'){ hunterTextEl.textContent = HUNTER_BOLT_TEXT; hunterTalkBtnEl.textContent = 'Take the Dragon Bolt'; }
  else if(gojiraChainStage(game.player)==='reward'){ hunterTextEl.textContent = HUNTER_RUNE_TEXT; hunterTalkBtnEl.textContent = 'Claim Reward'; }
  else if(!cur){ const mq = getQuest(game.player,'hunt_minotaur'); hunterTextEl.textContent = (mq && mq.status==='complete' && !game.player.krakenSlain) ? '"Quiet lately. If you come across anything strange out there, come and tell me."' : HUNTER_THANKS; hunterTalkBtnEl.textContent = 'Talk'; }
  else if(!cur.q){ hunterTextEl.textContent = cur.def.offer; hunterTalkBtnEl.textContent = 'Accept Hunt'; }
  else if(!cur.q.killed){ hunterTextEl.textContent = cur.def.remind; hunterTalkBtnEl.textContent = 'Talk'; }
  else { hunterTextEl.textContent = cur.def.done; hunterTalkBtnEl.textContent = 'Claim Reward'; }
  hunterOverlay.style.display = 'flex';
}
function closeHunterDialogue(){
  hunterOverlay.style.display = 'none';
  game.modalOpen = false;
}
document.getElementById('hunterClose').addEventListener('click', closeHunterDialogue);
document.getElementById('hunterTalkBtn').addEventListener('click', ()=>{
  const p = game.player;
  const cur = hunterCurrent(p);
  closeHunterDialogue();
  if(hunterScaleStage(p)){
    const sq = getQuest(p, 'show_scale');
    sq.status = 'complete'; sq.rewarded = true; sq.progress = sq.total;
    addQuestOnce(p, 'witch_find', 'The Witch of the Black Marsh', 'Find the witch at her cauldron, near the Black Marsh entrance.', 1);
    showMsg('New quest: The Witch of the Black Marsh', 3.0);
    updateQuestBadge(); saveGame();
    return;
  }
  { const gs = gojiraChainStage(p); if(gs){ claimGojiraChain(p, gs); return; } }
  if(!cur){ showMsg(HUNTER_THANKS, 2.2); return; }
  const {def, q} = cur;
  if(!q){
    if(!p.quests) p.quests = [];
    const already = !!(HUNT_PART_FLAG[def.Q.id] && p[HUNT_PART_FLAG[def.Q.id]]) || (def.Q.id==='hunt_kraken' && !!p.krakenSlain);
    p.quests.push({id:def.Q.id, name:def.Q.name, desc:already?def.Q.descDone:def.Q.desc, status:'active', progress:already?def.Q.total:0, total:def.Q.total, killed:already});
    showMsg(already ? 'Quest accepted: '+def.Q.name+' \u2014 you already hold its trophy!' : 'Quest accepted: '+def.Q.name, 2.4);
    updateQuestBadge(); saveGame();
  } else if(!q.killed){
    showMsg('Hunt: '+def.Q.name, 2.2);   // v344: short toast instead of the old wall of text
  } else {
    q.status = 'complete'; q.rewarded = true;
    // v456: rewards are gear for YOUR class (weapon or armor of your material); the Colossus pays a rare piece and 3 health potions
    const item = def.ring==='poison' ? makeResistRewardRing(p, 'poisonResistPct', 'Emerald Ring', 'Antivenom') : classRewardItem(p, Math.max(p.level, def.lvl), def.rareGear ? 'rare' : 'reward');
    forceAddToBag(p, item);
    const xt = [];
    if(def.resNext){ const ri = classResistRewardItem(p, Math.max(p.level, def.lvl), def.resNext, 'rare'); forceAddToBag(p, ri); xt.push(ri.name+' ('+RES_LABEL[def.resNext].replace(' %','')+')'); }   // v483
    if(def.tome){ forceAddToBag(p, makeSkillTomeItem()); xt.push('Tome of Skill'); }
    for(const k of (def.extras||[])){ forceAddToBag(p, makePotionItem(k)); xt.push(POTION_DEFS[k].name); }
    if(def.classWeapon){   // v283: a rare weapon for the player's class, at the player's current level
      const wc = p.cls==='ranger' ? 'bow' : p.cls==='mystic' ? 'staff' : 'weapon1h';
      const wi = generateItem(Math.max(1,p.level||1), 'reward', wc, null, p);
      forceAddToBag(p, wi); xt.push(wi.name);
    }
    p.gold += def.gold;
    if(def.xp) gainXp(game, Math.round(xpForKill(def.lvl, true)*def.xp));
    showMsg('Quest complete: '+item.name+(xt.length?' + '+xt.join(' + '):'')+(def.gold?' + '+def.gold+' gold':''), 4.2);
    if(def.Q.id==='hunt_minotaur') startWitchQuest(p);
    bagPulse(); updateQuestBadge(); saveGame();
  }
});
document.getElementById('hunterShopBtn').addEventListener('click', ()=>{
  closeHunterDialogue();
  openShop('hunter');
});

