// ---------- Support submenu (v81) ----------
// Cat Companion and Expanded Stash are now real ON/OFF toggles, nested
// behind a "Support" button using the exact same menuOverlay-hides/
// sub-overlay-shows pattern Settings and Achievements already use.
// Persistence judgment call: both toggles live in the SAME account-wide
// `settings` object (dc_settings_v1) that Master Volume already uses,
// rather than on the per-character save (p.*) -- consistent with how the
// Town stash itself (STASH_KEY, dc_stash_v1) is already explicitly
// shared/account-wide "by every character on this device" (see its own
// modalSub text), and Expanded Stash is really just extending that same
// shared chest, so gating it per-character would be an inconsistent mix
// of scopes for one physical chest. Cat Companion follows suit for the
// same "Support Shop is an account-wide perk" reasoning.
const supportOverlay = document.getElementById('supportOverlay');
const supportClose = document.getElementById('supportClose');
// v392: the Support box can be opened from the Menu or by talking to the cat in Mistfall.
// Purchases are STUBBED for now (iapPurchase grants immediately) -- swap its body for the real store billing call at launch.
const IAP = { cat:{sku:'runefall_cat_companion', price:'$2.99', own:'catOwned'}, stash:{sku:'runefall_expanded_stash', price:'$1.99', own:'stashOwned'} };
const iapOwned = k=>!!settings[IAP[k].own];
// v485: real Google Play Billing in the Android app (Capacitor + @capgo/native-purchases). In a plain browser
// (testing, GitHub Pages) the perks still unlock for free, as before.
function iapPlugin(){
  try{ const C = window.Capacitor; if(!C || !(C.isNativePlatform && C.isNativePlatform())) return null;
    return (C.Plugins && C.Plugins.NativePurchases) || (C.registerPlugin ? C.registerPlugin('NativePurchases') : null); }catch(e){ return null; }
}
let iapBusy = false;
function iapGrant(k){ settings[IAP[k].own] = true; saveSettings(settings); }
function iapPurchase(k, done){
  const NP = iapPlugin();
  if(!NP){ iapGrant(k); done(true); return; }
  if(iapBusy) return; iapBusy = true;
  NP.purchaseProduct({ productIdentifier:IAP[k].sku, productType:'inapp', isConsumable:false })
    .then(()=>{ iapBusy = false; iapGrant(k); done(true); })
    .catch(err=>{ iapBusy = false; const m = String((err && (err.message||err.code)) || err || '');
      if(/already.?own|ITEM_ALREADY_OWNED|\b7\b/i.test(m)){ iapGrant(k); done(true); return; }
      showMsg(/cancel/i.test(m) ? 'Purchase cancelled' : 'Purchase failed -- please try again', 2.2); done(false); });
}
// On start-up (and from the Restore button): ask Google Play what this account owns, grant it, and take back refunds.
function iapRestore(manual){
  const NP = iapPlugin(); if(!NP){ if(manual) showMsg('Purchases are restored in the Play Store version', 2.2); return; }
  Promise.resolve(NP.restorePurchases ? NP.restorePurchases().catch(()=>{}) : null)
    .then(()=>NP.getPurchases({ productType:'inapp' }))
    .then(res=>{
      const list = (res && res.purchases) || [];
      const owned = id=>list.some(p0=>p0 && p0.productIdentifier===id && (p0.purchaseState==null || p0.purchaseState==='1' || /PURCHASED/i.test(String(p0.purchaseState))));
      let got = 0;
      // v489: a restore only ever ADDS purchases. Google Play can answer with an empty or still-pending list right after
      // launch (billing not connected yet, a test purchase still settling), which used to wipe what had been bought.
      for(const k of Object.keys(IAP)){ const has = owned(IAP[k].sku); if(has && !settings[IAP[k].own]){ got++; settings[IAP[k].own] = true; } }
      saveSettings(settings);
      try{ refreshSupportToggles(); if(game && game.started && game.player) ensureFollowers(game); }catch(e){}
      if(manual) showMsg(got ? 'Purchases restored ('+got+')' : 'Purchases are up to date', 2.2, '#f4d36a');
    })
    .catch(()=>{ if(manual) showMsg('Could not reach Google Play -- try again later', 2.4); });
  // show the store's local prices
  try{ NP.getProducts({ productIdentifiers:Object.values(IAP).map(x=>x.sku), productType:'inapp' }).then(r=>{
    for(const pr of ((r && r.products)||[])){ const k = Object.keys(IAP).find(k0=>IAP[k0].sku===pr.identifier || IAP[k0].sku===pr.productIdentifier); if(k && pr.priceString) IAP[k].price = pr.priceString; }
    try{ refreshSupportToggles(); }catch(e){}
  }).catch(()=>{}); }catch(e){}
}
setTimeout(()=>iapRestore(false), 1500); setTimeout(()=>iapRestore(false), 9000);   // v489: a second pass once billing has surely connected
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) iapRestore(false); });
let supportFromCat = false;
function openSupport(fromCat){
  supportFromCat = fromCat===true;
  if(supportFromCat){ game.modalOpen = true; } else menuOverlay.style.display = 'none';
  supportOverlay.style.display = 'flex';
  refreshSupportToggles();
  // game.modalOpen stays true -- still inside a modal, just a nested screen
}
function closeSupport(){
  supportOverlay.style.display = 'none';
  if(supportFromCat){ supportFromCat = false; game.modalOpen = false; }
  else menuOverlay.style.display = 'flex'; // back to the menu, not fully closed
}
document.getElementById('menuSupportBtn').addEventListener('click', ()=>openSupport(false));
document.getElementById('restorePurchasesBtn').addEventListener('click', ()=>iapRestore(true));
supportClose.addEventListener('click', closeSupport);

function refreshSupportToggles(){
  const rc = document.getElementById('toggleCatCompanion'), rs = document.getElementById('toggleExpandedStash');
  rc.classList.toggle('owned', iapOwned('cat')); rc.classList.toggle('unowned', !iapOwned('cat'));
  rs.classList.toggle('owned', iapOwned('stash')); rs.classList.toggle('unowned', !iapOwned('stash'));
  document.getElementById('buyCatBtn').textContent = IAP.cat.price; document.getElementById('buyStashBtn').textContent = IAP.stash.price;
  setToggleUI(rc, iapOwned('cat') && !!settings.catCompanion);
  setToggleUI(rs, iapOwned('stash') && !!settings.expandedStash);
}
// the town cat hops off her cushion and trots after the player
function catLeavesTown(){
  if(!(game && game.started && game.player)) return;
  const had = (game.followers||[]).some(f=>f.kind==='cat');
  ensureFollowers(game);
  if(!had && game.scene==='town' && game.town && game.town.cat){
    const f = (game.followers||[]).find(q=>q.kind==='cat'); if(f){ f.x = game.town.cat.x; f.y = game.town.cat.y; }
  }
}
function setCatCompanion(on){
  settings.catCompanion = !!on; saveSettings(settings); refreshSupportToggles();
  if(on) catLeavesTown(); else if(game && game.started && game.player) ensureFollowers(game);
}
document.getElementById('buyCatBtn').addEventListener('click', (ev)=>{
  ev.stopPropagation();
  iapPurchase('cat', ok=>{ if(!ok) return; setCatCompanion(true); showMsg('Cat Companion unlocked!', 2.2, '#f4d36a'); });
});
document.getElementById('buyStashBtn').addEventListener('click', (ev)=>{
  ev.stopPropagation();
  iapPurchase('stash', ok=>{ if(!ok) return; settings.expandedStash = true; saveSettings(settings); refreshSupportToggles();
    if(stashOverlay.style.display==='flex'){ renderStashTabs(); renderStash(); }
    showMsg('Expanded Stash unlocked!', 2.2, '#f4d36a'); });
});
document.getElementById('toggleCatCompanion').addEventListener('click', ()=>{
  if(!iapOwned('cat')) return;
  setCatCompanion(!settings.catCompanion);
  showMsg(settings.catCompanion ? 'Cat Companion: ON' : 'Cat Companion: OFF', 1.4);
});
document.getElementById('toggleExpandedStash').addEventListener('click', ()=>{
  if(!iapOwned('stash')) return;
  settings.expandedStash = !settings.expandedStash;
  saveSettings(settings);
  refreshSupportToggles();
  // Turning it off never deletes what's in tabs 2-4 -- see renderStashTabs:
  // it just forces the active tab back to Tab 1 and hides the tab bar, so
  // toggling back ON restores exactly what was there.
  if(stashOverlay.style.display==='flex'){ renderStashTabs(); renderStash(); }
  showMsg(settings.expandedStash ? 'Expanded Stash: ON' : 'Expanded Stash: OFF', 1.4);
});

// v486: the region name lives in the row under the top band (it never fits beside the bars in landscape)
try{ const zp = document.getElementById('zonePlaque'), sh = document.getElementById('subHud'); if(zp && sh) sh.insertBefore(zp, sh.firstChild);
  setInterval(()=>{ zp.classList.toggle('bossUp', (window.__bossBarBottom||0) > 0); }, 300); }catch(e){}
