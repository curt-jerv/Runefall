// v489: pick up where you left off. Android may close the app while the phone sleeps; reopening it used to land on
// the title screen.
// v495: two notes. A long-lived one (localStorage) only remembers WHICH character was playing: reopening the app after
// it closed starts that character in town. A short-lived one (sessionStorage, cleared when the app or browser tab
// closes) remembers the zone, spot, life and resource: only a reload while the app is still open puts you back there.
// Loading or creating any character forgets the last zone change, so one character can never resume another's zone.
// Logging out (sleeping in the tavern) clears both notes, so that path still goes to the title screen.
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
  const p = game.player, t = Date.now();
  try{ localStorage.setItem(RESUME_KEY, JSON.stringify({id:p.saveId, t})); }catch(e){}
  try{ sessionStorage.setItem(RESUME_KEY, JSON.stringify({id:p.saveId, t, enter:resumeEnter, scene:game.scene, x:p.x, y:p.y, hp:p.hp, mp:p.mp})); }catch(e){}
}
function clearResume(){ try{ localStorage.removeItem(RESUME_KEY); }catch(e){} try{ sessionStorage.removeItem(RESUME_KEY); }catch(e){} }
// v495: every character starts (or loads) facing the screen, with no zone change remembered from whoever played before
startGame = (orig=>function(...a){
  resumeEnter = null; resumeOff = false;
  const r = orig.apply(this, a);
  try{ const p = game && game.player; if(p){ p.facing = {x:0.6, y:0.8}; p._backView = false; p.faceSign = screenFacingSign(p.facing.x, p.facing.y); } }catch(e){}
  return r;
})(startGame);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) writeResume(); });
window.addEventListener('pagehide', writeResume);
setInterval(writeResume, 8000);
logOutToTitle = (orig=>function(...a){ resumeOff = true; clearResume(); return orig.apply(this, a); })(logOutToTitle);
(function tryResume(){
  let R = null, S = null;
  try{ S = JSON.parse(sessionStorage.getItem(RESUME_KEY)||'null'); }catch(e){}
  try{ R = JSON.parse(localStorage.getItem(RESUME_KEY)||'null'); }catch(e){}
  const inSession = !!(S && S.id && Date.now()-S.t < RESUME_MAX_AGE);   // the app never closed: back to the same zone and spot
  if(inSession) R = S;
  if(!R || !R.id || !(Date.now()-R.t < RESUME_MAX_AGE)) return;
  const save = loadAllSaves().find(s=>s.id===R.id);
  if(!save) return;
  try{
    startGame(save);
    if(!inSession || R.scene==='town' || !R.enter){ showMsg('Welcome back', 1.4); return; }   // reopened after closing: start in town
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
