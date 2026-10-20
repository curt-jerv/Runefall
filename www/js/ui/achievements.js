// ---------- v481: Achievements (account-wide, kept in this device's storage) ----------
const ACH_KEY = 'runefall_ach_v1';
const ACH = [
  {id:'firstBlood', icon:'\u{1FA78}', name:'First Blood',      desc:'Slay your first enemy',                 stat:'kills',   goal:1},
  {id:'slayer',     icon:'\u2694\uFE0F', name:'Slayer',        desc:'Slay 100 enemies',                      stat:'kills',   goal:100},
  {id:'butcher',    icon:'\u{1FA93}', name:'Butcher',          desc:'Slay 1,000 enemies',                    stat:'kills',   goal:1000},
  {id:'legion',     icon:'\u{1F480}', name:'Legion\'s Bane',   desc:'Slay 5,000 enemies',                    stat:'kills',   goal:5000},
  {id:'champion',   icon:'\u2B50',    name:'Champion Hunter',  desc:'Slay 25 magic or elite monsters',       stat:'elites',  goal:25},
  {id:'giant',      icon:'\u{1F479}', name:'Giant Slayer',     desc:'Defeat your first boss',                stat:'bosses',  goal:1},
  {id:'bossBreaker',icon:'\u{1F451}', name:'Boss Breaker',     desc:'Defeat 10 bosses',                      stat:'bosses',  goal:10},
  {id:'banditKing', icon:'\u{1F5E1}\uFE0F', name:'Crownless',  desc:'Defeat the Bandit King',                flag:'banditKing'},
  {id:'wraithLord', icon:'\u{1F47B}', name:'Laid to Rest',     desc:'Defeat the Wraith Lord',                flag:'wraithLord'},
  {id:'gojira',     icon:'\u{1F409}', name:'Kaiju Killer',     desc:'Slay Gojira',                           flag:'gojira'},
  {id:'lvl10',      icon:'\u{1F4C8}', name:'Blooded',          desc:'Reach level 10',                        stat:'level',   goal:10},
  {id:'lvl25',      icon:'\u{1F6E1}\uFE0F', name:'Veteran',    desc:'Reach level 25',                        stat:'level',   goal:25},
  {id:'lvl50',      icon:'\u{1F3C6}', name:'Legend',           desc:'Reach level 50',                        stat:'level',   goal:50},
  {id:'rare',       icon:'\u{1F48D}', name:'Fine Steel',       desc:'Equip a rare item',                     flag:'rare'},
  {id:'fullKit',    icon:'\u{1F9E5}', name:'Fully Armed',      desc:'Fill every equipment slot',             stat:'slots',   goal:EQUIP_SLOTS.length},
  {id:'socket',     icon:'\u{1F48E}', name:'Stonesetter',      desc:'Wear an item with a socketed stone',    flag:'socket'},
  {id:'gold',       icon:'\u{1FA99}', name:'Hoarder',          desc:'Hold 10,000 gold at once',              stat:'gold',    goal:10000},
  {id:'potions',    icon:'\u{1F9EA}', name:'Bottoms Up',       desc:'Drink 25 health potions',               stat:'potions', goal:25},
  {id:'closeCall',  icon:'\u2764\uFE0F', name:'Close Call',    desc:'Fall below 5% life and live',           flag:'closeCall'},
  {id:'fallen',     icon:'\u26B0\uFE0F', name:'Fallen Hero',   desc:'Die for the first time',                flag:'fallen'},
];
let achData = null;
function achLoad(){ if(achData) return achData; try{ achData = JSON.parse(localStorage.getItem(ACH_KEY)||'null'); }catch(e){} if(!achData || typeof achData!=='object') achData = {}; achData.got = achData.got||{}; achData.c = achData.c||{}; achData.f = achData.f||{}; return achData; }
function achSave(){ try{ localStorage.setItem(ACH_KEY, JSON.stringify(achLoad())); }catch(e){} }
function achStatVal(a, p){
  const d = achLoad();
  if(a.flag) return d.f[a.flag] ? 1 : 0;
  if(a.stat==='level') return Math.max(d.c.level||0, (p&&p.level)||0);
  if(a.stat==='gold') return Math.max(d.c.gold||0, (p&&p.gold)||0);
  if(a.stat==='slots') return Math.max(d.c.slots||0, p&&p.equipment ? EQUIP_SLOTS.filter(k=>p.equipment[k]).length : 0);
  return d.c[a.stat]||0;
}
const _achQ = [];
function achToast(a){
  if(typeof settings!=='undefined' && settings && settings.hideAch!==false) return;   // v484: pop-ups are off unless turned on in Settings
  _achQ.push(a); if(_achQ.length>1) return;
  const run = ()=>{ const x = _achQ[0]; if(!x) return; const el = document.getElementById('achToast'); if(!el) return;
    el.querySelector('.achIco').textContent = x.icon; el.querySelector('.t2').textContent = x.name; el.classList.add('on');
    try{ sfxPlay('questDone', 0.6); }catch(e){}
    setTimeout(()=>{ el.classList.remove('on'); setTimeout(()=>{ _achQ.shift(); run(); }, 450); }, 3200); };
  run();
}
function achCheck(p){
  const d = achLoad(); let changed = false;
  for(const a of ACH){
    if(d.got[a.id]) continue;
    const v = achStatVal(a, p), goal = a.goal||1;
    if(v >= goal){ d.got[a.id] = Date.now(); changed = true; achToast(a); }
  }
  if(p){ if((p.level||0) > (d.c.level||0)){ d.c.level = p.level; changed = true; } if((p.gold||0) > (d.c.gold||0) && (p.gold||0) <= 10000){ d.c.gold = p.gold; changed = true; } }
  if(changed) achSave();
}
function achAdd(stat, n){ const d = achLoad(); d.c[stat] = (d.c[stat]||0) + (n||1); d._dirty = true; }
function achFlag(f){ const d = achLoad(); if(!d.f[f]){ d.f[f] = 1; d._dirty = true; } }
function achOnKill(g, e){
  if(!e || e.noReward || e.summon || e.isFollower) return;
  if(g && g.player) g.player.killCount = (g.player.killCount||0) + 1;   // v484: per-character kill count
  achAdd('kills');
  if(e.elite || e.magic) achAdd('elites');
  if(e.isBoss || e.isLairBoss || e.bossName || (typeof isGlobeBoss==='function' && isGlobeBoss(e))) achAdd('bosses');
  if(e.bkBoss) achFlag('banditKing');
  if(e.wlord) achFlag('wraithLord');
  if(e.gj) achFlag('gojira');
}
let _achT = 0;
function achTick(g, dt){
  const p = g && g.player; if(!p || !g.started) return;
  if(p.hp>0 && p.maxHp>0 && p.hp < p.maxHp*0.05) achFlag('closeCall');
  _achT -= dt; if(_achT > 0) return; _achT = 1;
  if((p.deaths||0) > 0) achFlag('fallen');
  if(p.equipment){ for(const k of EQUIP_SLOTS){ const it = p.equipment[k]; if(!it) continue; if(it.rarity==='rare') achFlag('rare'); if(Array.isArray(it.socketed) && it.socketed.some(Boolean)) achFlag('socket'); } }
  const d = achLoad(); const dirty = d._dirty; delete d._dirty;
  achCheck(p); if(dirty) achSave();
}
function renderAchievements(){
  const p = game && game.player, d = achLoad(); let got = 0;
  const html = ACH.map(a=>{ const done = !!d.got[a.id]; if(done) got++; const goal = a.goal||1, v = Math.min(goal, achStatVal(a, p));
    const bar = (!done && goal>1) ? '<div class="achBar"><i style="width:'+Math.round(v/goal*100)+'%"></i></div><div class="achDesc" style="font-size:10.5px">'+v.toLocaleString()+' / '+goal.toLocaleString()+'</div>' : '';
    return '<div class="achCard'+(done?' done':'')+'"><div class="achIco">'+a.icon+'</div><div style="flex:1;min-width:0"><div class="achName">'+a.name+'</div><div class="achDesc">'+a.desc+'</div>'+bar+'</div></div>'; }).join('');
  document.getElementById('achList').innerHTML = html;
  document.getElementById('achSummary').textContent = got+' of '+ACH.length+' unlocked';
}
// ---------- Achievements (menu screen) ----------
const achievementsOverlay = document.getElementById('achievementsOverlay');
const achievementsClose = document.getElementById('achievementsClose');
function openAchievements(){
  renderAchievements();
  menuOverlay.style.display = 'none';
  achievementsOverlay.style.display = 'flex';
  // game.modalOpen stays true -- still inside a modal, just a nested screen
}
function closeAchievements(){
  achievementsOverlay.style.display = 'none';
  menuOverlay.style.display = 'flex'; // back to the menu, not fully closed
}
document.getElementById('menuAchievementsBtn').addEventListener('click', openAchievements);
achievementsClose.addEventListener('click', closeAchievements);

// Saves progress and drops back to the title screen, same as closing and
// reopening the app would -- but from a button instead of the OS.
function logOut(){
  saveGame();
  game.started = false;
  document.getElementById('buttons').style.display = 'none';
  document.getElementById('actionCluster').style.display = 'none';
  updateInteractPrompt(null);
  updatePortalChoice(false);
  skillTreeOverlay.style.display = 'none';
  invOverlay.style.display = 'none';
  charStatsOverlay.style.display = 'none';
  shopOverlay.style.display = 'none';
  menuOverlay.style.display = 'none';
  settingsOverlay.style.display = 'none'; document.getElementById('lootOverlay').style.display = 'none'; document.getElementById('combatOverlay').style.display = 'none'; document.getElementById('controlsOverlay').style.display = 'none'; document.getElementById('graphicsOverlay').style.display = 'none'; document.getElementById('soundOverlay').style.display = 'none'; PC.rebinding = null;
  achievementsOverlay.style.display = 'none';
  supportOverlay.style.display = 'none';
  questGiverOverlay.style.display = 'none';
  questLogOverlay.style.display = 'none';
  stashOverlay.style.display = 'none';
  teleportOverlay.style.display = 'none';
  document.getElementById('overlay').style.display = 'none';
  refreshStartScreenButtons();
  document.getElementById('start').style.display = 'flex';
}
document.getElementById('menuLogoutBtn').addEventListener('click', ()=>{
  closeMenu();
  logOut();
});
// v81: Exit Game -- actually closes the client where that's possible.
//
// Native Android (Capacitor): saves first, then calls the Capacitor App
// plugin's exitApp(), which really does terminate the app process. This
// build has no bundled JS import of @capacitor/app (there was no existing
// Capacitor integration anywhere in this file to follow a prior pattern
// from -- see isNativeApp() below) -- @capacitor/app has been added to
// package.json as a dependency, and on a real native build Capacitor
// injects `window.Capacitor` (with `.Plugins.App`) into the WebView
// automatically once that plugin is installed+synced, so this reads it as
// a global rather than an ES import, matching how a plain <script>-tag
// page (no bundler) has to consume it. IMPORTANT: this JS-level call is
// only half the story -- `npm install` (to actually fetch the package)
// and `npx cap sync android` (to wire its native Java side into the
// Android project) both need to run in a real dev environment outside
// this sandbox before exitApp() will do anything on a real device; until
// then this falls through to the web fallback below even inside the app.
//
// Plain web browser (including this sandbox's own Playwright tests):
// window.close() only actually closes a tab/window the page itself opened
// via script -- every modern browser silently ignores it otherwise, as a
// deliberate security restriction a page can never override. That's a
// real platform limitation, not a bug: there is no way for a webpage to
// force-close a browser tab a person opened themselves. Best-effort
// attempt, then a plain fallback message telling the player it's safe to
// close the tab manually.
function isNativeApp(){
  try{ return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  catch(e){ return false; }
}
function exitGameClient(){
  saveGame();
  if(isNativeApp()){
    try{
      const AppPlugin = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if(AppPlugin && typeof AppPlugin.exitApp==='function'){ AppPlugin.exitApp(); return; }
    }catch(e){}
  }
  try{ window.close(); }catch(e){}
  showMsg('You can close this tab to exit', 3);
}
