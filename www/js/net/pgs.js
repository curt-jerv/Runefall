// v513: Google Play Games -- sign-in, cloud save and the Breach/level leaderboard (Android app only; a plain browser shows the screens but no data).
// Cloud save = one snapshot holding every character, the shared stash and the achievements. The leaderboard has ONE score per player:
// breachDepth*1000 + level (deepest Breach first, then highest level), with the class etc. in the score tag ("mystic.57.22.necromancer").
const PGS_SNAP = 'runefall_cloud_v1', PGS_LB_CACHE = 'rf_lb_cache_v1', PGS_LB_BEST = 'rf_lb_best_v1';
let pgsIn = false, pgsName = '', pgsChecked = false, pgsDirty = false, pgsTimer = null, pgsTop = null, pgsTopMsg = '', pgsInited = false;
function pgsPlugin(){ try{ return window.__pgsMock || nativePlugin('PlayGames'); }catch(e){ return null; } }
function pgsHasLb(){ return !!PGS_LEADERBOARD_ID || !!window.__pgsMock; }
function pgsLsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function pgsLsSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

// ---------- score + tag ----------
function pgsTreeSlug(save){ const t = capstoneTreeName(save); return t ? String(t).toLowerCase().replace(/[^a-z0-9]/g,'') : ''; }
function pgsScoreOf(save){
  const lv = Math.max(1, Math.min(999, save.level||1)), br = save.breachReached ? Math.max(0, save.breachBest||0) : 0;
  return { score: br*1000 + lv, tag: [save.cls||'warrior', lv, br, pgsTreeSlug(save)].join('.') };
}
function pgsParseRow(sc){
  const t = String(sc.scoreTag||'').split('.'), raw = sc.rawScore||0;
  const cls = ['warrior','ranger','mystic'].includes(t[0]) ? t[0] : 'warrior';
  const tree = t[3] ? t[3].charAt(0).toUpperCase()+t[3].slice(1) : '';
  return { rank: sc.rank || 0, name: sc.scoreHolderDisplayName || 'Player', cls, tree,
    level: Math.max(1, +t[1] || (raw%1000)), breach: t[2]!=null && t[2]!=='' ? +t[2] : Math.floor(raw/1000), me: false };
}
function pgsClsName(r){ const c = r.cls.charAt(0).toUpperCase()+r.cls.slice(1); return r.tree ? c+' · '+r.tree : c; }
function pgsSubmit(save){
  const P = pgsPlugin(); if(!P || !pgsIn || !pgsHasLb() || !save) return;
  const s = pgsScoreOf(save), best = +pgsLsGet(PGS_LB_BEST) || 0;
  if(s.score <= best) return;
  P.submitScore({leaderboardId: PGS_LEADERBOARD_ID, score: s.score, scoreTag: s.tag}).then(()=>pgsLsSet(PGS_LB_BEST, String(s.score))).catch(()=>{});
}
function pgsSubmitBest(){ const list = loadAllSaves(); if(list.length) pgsSubmit(list.slice().sort((a,b)=>pgsScoreOf(b).score-pgsScoreOf(a).score)[0]); }

// ---------- leaderboard data ----------
async function pgsLoadTop(n){
  const P = pgsPlugin();
  if(!P) return {rows:[], msg:'Open the Android app to see the leaderboard'};
  if(!pgsHasLb()) return {rows:[], msg:'The leaderboard is not set up yet'};
  if(!pgsIn) return {rows:[], msg:'Sign in to Google Play Games to see the top players'};
  try{
    const r = await P.loadTopScores({leaderboardId: PGS_LEADERBOARD_ID, maxResults: n, forceReload: true});
    const rows = (r.scores||[]).map(pgsParseRow);
    pgsLsSet(PGS_LB_CACHE, JSON.stringify(rows));
    return {rows, msg: rows.length ? '' : 'No scores yet. Be the first!'};
  }catch(e){
    let cached = []; try{ cached = JSON.parse(pgsLsGet(PGS_LB_CACHE)||'[]'); }catch(_){}
    return {rows: cached.slice(0,n), msg: cached.length ? '' : 'Could not reach the leaderboard'};
  }
}
function pgsRowHtml(r, i){
  return '<div class="lbRow'+(r.me?' me':'')+'"><span class="lbRank">'+(r.rank||i+1)+'</span><span class="lbName">'+escHtml(r.name)+'</span>'+
    '<span class="lbCls">'+escHtml(pgsClsName(r))+'</span><span class="lbStat"><span class="lbLv">Lv '+r.level+'</span><span class="lbBr">'+(r.breach>0 ? 'Breach '+r.breach : '')+'</span></span></div>';
}
function escHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
async function pgsRefreshTop5(){
  const box = document.getElementById('lbTop5'); if(!box) return;
  const r = await pgsLoadTop(5);
  box.innerHTML = r.rows.length ? r.rows.map(pgsRowHtml).join('') : '<div class="lbEmpty">'+escHtml(r.msg)+'</div>';
}
async function pgsOpenBoard(){
  const scr = document.getElementById('lbScreen'), list = document.getElementById('lbList'), me = document.getElementById('lbMe');
  scr.style.display = 'flex'; list.innerHTML = '<div class="lbEmpty">Loading&hellip;</div>'; me.innerHTML = '';
  const r = await pgsLoadTop(25);
  list.innerHTML = r.rows.length ? r.rows.map(pgsRowHtml).join('') : '<div class="lbEmpty">'+escHtml(r.msg)+'</div>';
  const P = pgsPlugin();
  if(P && pgsIn && pgsHasLb()){
    try{
      const c = await P.loadCurrentPlayerScore({leaderboardId: PGS_LEADERBOARD_ID});
      if(c && c.score){ const row = pgsParseRow(c.score); row.me = true; row.name = 'You'; me.innerHTML = '<div class="lbMeTitle">Your rank</div>'+pgsRowHtml(row, 0); }
    }catch(e){}
  }
}

// ---------- sign-in ----------
function pgsRenderStatus(){
  const b = document.getElementById('pgsBtn'); if(!b) return;
  const P = pgsPlugin();
  b.style.display = P ? '' : 'none';
  b.textContent = pgsIn ? '☁ Google Play Games' + (pgsName ? ' · '+pgsName : '') : 'Sign in to Google Play Games';
  b.classList.toggle('on', pgsIn);
}
async function pgsSetSignedIn(v){
  pgsIn = !!v;
  const P = pgsPlugin();
  if(pgsIn && P){ try{ const pl = await P.getPlayer(); pgsName = (pl && (pl.player ? pl.player.displayName : pl.displayName)) || ''; }catch(e){ pgsName = ''; } }
  else { pgsName = ''; }
  pgsRenderStatus(); pgsRefreshTop5();
  if(pgsIn){ await pgsCloudCheck(); pgsSubmitBest(); }
}
async function pgsInit(){
  if(pgsInited) return; pgsInited = true;
  const P = pgsPlugin(); pgsRenderStatus(); pgsRefreshTop5();
  if(!P) return;
  try{ await P.initialize(); }catch(e){}
  try{ P.addListener('signInStateChanged', ev=>{ if(!!ev.signedIn !== pgsIn) pgsSetSignedIn(ev.signedIn); }); }catch(e){}
  try{ const r = await P.signIn(); await pgsSetSignedIn(r && r.signedIn); }catch(e){ pgsRenderStatus(); }
}
async function pgsSignInClick(){
  const P = pgsPlugin(); if(!P) return;
  if(pgsIn){ await pgsRefreshTop5(); return; }
  try{ const r = await P.signIn({silent:false}); await pgsSetSignedIn(r && r.signedIn); }catch(e){}
}

// ---------- cloud save ----------
function pgsBlob(){
  return JSON.stringify({ v:1, ts:Date.now(), saves: loadAllSaves(), stash: pgsLsGet(STASH_KEY), ach: pgsLsGet(ACH_KEY) });
}
function pgsSummary(list){
  if(!list.length) return 'no characters';
  return list.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).map(s=>'Lv.'+(s.level||1)+' '+characterLabel(s)+(s.breachReached?' (Breach '+(s.breachBest||0)+')':'')).join(', ');
}
async function pgsUpload(force){
  const P = pgsPlugin(); if(!P || !pgsIn || !pgsChecked) return;
  const list = loadAllSaves(); if(!list.length && !force) return;
  pgsDirty = false;
  const top = list.reduce((m,s)=>Math.max(m, s.level||1), 1);
  try{ await P.saveSnapshot({ name: PGS_SNAP, data: pgsBlob(), description: 'Runefall · '+list.length+' character'+(list.length===1?'':'s')+' · top level '+top, progressValue: top, playedTimeMillis: 0 }); }
  catch(e){ pgsDirty = true; }
}
function pgsQueueUpload(delay){
  pgsDirty = true; if(pgsTimer) return;
  pgsTimer = setTimeout(()=>{ pgsTimer = null; pgsUpload(false); }, delay==null ? 25000 : delay);
}
function pgsApplyCloud(blob){
  writeAllSaves(blob.saves||[]);
  try{ if(blob.stash!=null) localStorage.setItem(STASH_KEY, blob.stash); if(blob.ach!=null) localStorage.setItem(ACH_KEY, blob.ach); }catch(e){}
  location.reload();   // reload so the stash/achievements/characters are read fresh
}
function pgsAsk(cloud){
  return new Promise(res=>{
    const ov = document.getElementById('cloudOverlay');
    document.getElementById('cloudText').innerHTML = 'Cloud save from '+new Date(cloud.ts||0).toLocaleString()+':<br><b>'+escHtml(pgsSummary(cloud.saves||[]))+'</b><br><br>This device:<br><b>'+escHtml(pgsSummary(loadAllSaves()))+'</b><br><br><i>Keeping this device replaces the cloud save.</i>';
    ov.style.display = 'flex';
    document.getElementById('cloudUse').onclick = ()=>{ ov.style.display='none'; res('cloud'); };
    document.getElementById('cloudKeep').onclick = ()=>{ ov.style.display='none'; res('local'); };
  });
}
async function pgsCloudCheck(){
  const P = pgsPlugin(); if(!P || !pgsIn || pgsChecked) return;
  if(typeof game!=='undefined' && game && game.started) return;   // never swap saves under a running game
  let cloud = null;
  try{ const r = await P.loadSnapshot({name: PGS_SNAP}); if(r && r.snapshot && r.snapshot.data) cloud = JSON.parse(r.snapshot.data); }catch(e){ return; }   // unreadable: leave pgsChecked false so nothing is uploaded over it
  const local = loadAllSaves(), cl = (cloud && cloud.saves) || [];
  if(!cl.length){ pgsChecked = true; if(local.length) pgsUpload(false); return; }
  if(!local.length){ pgsApplyCloud(cloud); return; }
  const lm = new Map(local.map(s=>[s.id, s]));
  const differs = cl.some(c=>{ const l = lm.get(c.id); return !l || (c.updatedAt||0) > (l.updatedAt||0)+1000; });
  if(!differs){ pgsChecked = true; pgsQueueUpload(3000); return; }
  const pick = await pgsAsk(cloud);
  if(pick==='cloud'){ pgsApplyCloud(cloud); return; }
  pgsChecked = true; pgsUpload(true);
}

// ---------- hooks ----------
(function(){
  const _save = saveGame;
  saveGame = function(){
    _save.apply(this, arguments);
    try{ if(game && game.started && game.player && game.player.saveId){
      pgsSubmit({cls:game.player.cls, level:game.player.level, breachReached:game.player.breachReached, breachBest:game.player.breachBest, skills:game.player.skills});
      pgsQueueUpload();
    } }catch(e){}
  };
  const _del = deleteSave;
  deleteSave = function(id){ _del.apply(this, arguments); pgsDirty = true; if(pgsChecked) pgsUpload(true); };
})();
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && pgsDirty && pgsChecked){ if(pgsTimer){ clearTimeout(pgsTimer); pgsTimer = null; } pgsUpload(false); } });

// ---------- screens ----------
(function(){
  const st = document.getElementById('start'), host = document.getElementById('lbScreen');
  if(host){   // same D2 scene behind the leaderboard as the other title screens
    const frag = document.createDocumentFragment();
    Array.from(st.children).filter(c=>c.matches('.tsScene,.tsGlow,.tsEmber,.tsVig')).forEach(part=>{
      const c = part.cloneNode(true);
      if(c.matches('.tsScene')) c.innerHTML = c.innerHTML.replace(/id="(ts\w+)"/g,'id="$1_lb"').replace(/url\(#(ts\w+)\)/g,'url(#$1_lb)');
      frag.appendChild(c);
    });
    host.insertBefore(frag, host.firstChild);
  }
  const on = (id, fn)=>{ const e = document.getElementById(id); if(e) e.addEventListener('click', fn); };
  on('lbBtn', pgsOpenBoard);
  on('lbBack', ()=>{ document.getElementById('lbScreen').style.display = 'none'; });
  on('lbRefresh', pgsOpenBoard);
  on('pgsBtn', pgsSignInClick);
  pgsInit();
})();
