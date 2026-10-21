// v489: pick up where you left off after the phone sleeps.
// v497: every cold start of the app shows the title screen (Continue / New Character) -- nothing is auto-loaded any more.
// Only a reload inside the SAME app session (sessionStorage, which Android clears whenever the app is closed or killed)
// puts the character back in the same zone and spot. A phone that merely locks keeps the app alive, so nothing is lost there.
// Logging out (sleeping in the tavern) clears the note, so that path still goes to the title screen.
const RESUME_KEY = 'rf_resume_v1', RESUME_MAX_AGE = 24*3600*1000;
let resumeEnter = null;   // {fn, args} of the last zone change
(function wrapZoneChanges(){
  const names = Object.keys(window).filter(n=>/^(enter[A-Z]\w*|goToTown\w*|returnToTown)$/.test(n) && typeof window[n]==='function');
  for(const n of names){
    const orig = window[n];
    window[n] = function(...args){
      const r = orig.apply(this, args);
      try{ const a = JSON.parse(JSON.stringify(args)); resumeEnter = {fn:n, args:a}; }catch(e){ resumeEnter = {fn:n, args:[]}; }
      if(/^(goToTown|returnToTown)/.test(n)) resumeEnter = null;   // town needs no enter call
      return r;
    };
  }
})();
let resumeOff = false;
function writeResume(){
  if(resumeOff || !game || !game.started || !game.player || !game.player.saveId) return;
  const p = game.player;
  try{ sessionStorage.setItem(RESUME_KEY, JSON.stringify({id:p.saveId, t:Date.now(), enter:resumeEnter, scene:game.scene, x:p.x, y:p.y, hp:p.hp, mp:p.mp})); }catch(e){}
}
function clearResume(){ try{ sessionStorage.removeItem(RESUME_KEY); }catch(e){} try{ localStorage.removeItem(RESUME_KEY); }catch(e){} }
// every character starts (or loads) facing the screen, with no zone change remembered from whoever played before
startGame = (orig=>function(...a){
  resumeEnter = null; resumeOff = false;
  const r = orig.apply(this, a);
  try{ faceScreen(game && game.player); }catch(e){}
  return r;
})(startGame);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) writeResume(); });
window.addEventListener('pagehide', writeResume);
setInterval(writeResume, 8000);
logOutToTitle = (orig=>function(...a){ resumeOff = true; clearResume(); return orig.apply(this, a); })(logOutToTitle);
(function tryResume(){
  try{ localStorage.removeItem(RESUME_KEY); }catch(e){}   // v497: older builds remembered the character across app restarts -- forget that note
  let R = null;
  try{ R = JSON.parse(sessionStorage.getItem(RESUME_KEY)||'null'); }catch(e){}
  if(!R || !R.id || !(Date.now()-R.t < RESUME_MAX_AGE)) return;
  const save = loadAllSaves().find(s=>s.id===R.id);
  if(!save) return;
  try{
    startGame(save);
    if(R.scene==='town' || !R.enter){ showMsg('Welcome back', 1.4); return; }
    if(typeof window[R.enter.fn]==='function') window[R.enter.fn](...(R.enter.args||[]));
    const g = game, p = g.player, room = g.room;
    if(g.scene===R.scene && room && R.x>0 && R.y>0 && (!room.w || (R.x<room.w && R.y<room.h)) && !posBlockedByObstacles(R.x, R.y, p.r||14, room.obstacles)){
      p.x = R.x; p.y = R.y; p.crX = undefined;
      for(const f of (g.followers||[])){ f.x = p.x; f.y = p.y; }
    }
    if(R.hp>0) p.hp = Math.min(p.maxHp, R.hp);
    if(R.mp>=0) p.mp = Math.min(p.maxMp, R.mp);
    p.invuln = Math.max(p.invuln||0, 2);   // a moment to get your bearings
    showMsg('Welcome back', 1.4);
  }catch(err){
    console.error('resume failed', err);
    try{ if(!(game && game.started)) startGame(save); else goToTown({wipeGold:false}); }catch(e){}
  }
})();
