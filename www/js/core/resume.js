// v489: pick up where you left off. Android may close the app while the phone sleeps; reopening it used to land on
// the title screen. Every zone change is remembered (which enter function ran and with what arguments), and when the
// app goes to the background the zone, position, life and resource are written down. On the next start, if that
// note is fresh and belongs to the most recent character, the game re-enters the same zone/floor at the same spot.
// Monsters and random layouts are new; quests, loot and everything else come from the normal save.
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
  try{
    if(resumeOff || !game || !game.started || !game.player || !game.player.saveId) return;
    const p = game.player;
    localStorage.setItem(RESUME_KEY, JSON.stringify({id:p.saveId, t:Date.now(), enter:resumeEnter, scene:game.scene, x:p.x, y:p.y, hp:p.hp, mp:p.mp}));
  }catch(e){}
}
function clearResume(){ try{ localStorage.removeItem(RESUME_KEY); }catch(e){} }
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) writeResume(); });
window.addEventListener('pagehide', writeResume);
setInterval(writeResume, 8000);
logOutToTitle = (orig=>function(...a){ resumeOff = true; clearResume(); return orig.apply(this, a); })(logOutToTitle);
(function tryResume(){
  let R = null;
  try{ R = JSON.parse(localStorage.getItem(RESUME_KEY)||'null'); }catch(e){}
  if(!R || !R.id || !(Date.now()-R.t < RESUME_MAX_AGE)) return;
  const save = loadAllSaves().find(s=>s.id===R.id);
  if(!save) return;
  try{
    startGame(save);
    if(R.enter && typeof window[R.enter.fn]==='function') window[R.enter.fn](...(R.enter.args||[]));
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
