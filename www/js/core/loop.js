// v452: the player sits 20% of the screen lower than before (was H/2-40), so you see more of what is ahead/above
function camPlayerY(){ return H/2 - 40 + H*0.2; }
let _camShift = 0;
// v470: if the atmosphere effects drag a slow phone under ~28fps, step them down once (High -> Low -> grain off).
// Only while the player hasn't picked a Graphics setting themselves; frame-rate-capped phones (30fps) never trip it.
const MOOD_TUNE = {n:0, sum:0};
// v487: Auto quality -- every ~1.5s of play, a slow average (under ~45fps) steps the quality down one level;
// a long smooth stretch steps it back up to Medium (each bounce makes the next step-up wait twice as long).
const GFX_TUNE = {n:0, sum:0, good:0, need:20, rose:false};
function gfxAutoTune(rawMs){
  if(!game || !game.started || game.modalOpen || window.__simPause || !settings || (settings.gfxQ && settings.gfxQ!=='auto')) return;
  if(!(rawMs>0) || rawMs>250 || document.hidden) return;
  const T = GFX_TUNE; T.n++; T.sum += rawMs;
  if(T.n < 90) return;
  const avg = T.sum/T.n; T.n = 0; T.sum = 0;
  const cap30 = fpsFrameMs() > 20, slowMs = cap30 ? 45 : 22, goodMs = cap30 ? 36 : 13;   // v489: judged against the chosen frame-rate
  if(avg > slowMs && gfxLevel>0){ if(T.rose) T.need = Math.min(T.need*2, 320); T.rose = false; T.good = 0; gfxApply(gfxLevel-1); return; }
  if(avg < goodMs && gfxLevel<1){ if(++T.good >= T.need){ T.good = 0; T.rose = true; gfxApply(gfxLevel+1); } }
  else T.good = 0;
}
function moodAutoTune(rawMs){
  if(!game || !game.started || game.modalOpen || window.__simPause || !settings || settings.atmosChosen) return;
  if(!(rawMs>0) || rawMs>250) return;
  MOOD_TUNE.n++; MOOD_TUNE.sum += rawMs;
  if(MOOD_TUNE.n < 300) return;
  const avg = MOOD_TUNE.sum/MOOD_TUNE.n; MOOD_TUNE.n = 0; MOOD_TUNE.sum = 0;
  if(avg < 36) return;
  if(settings.atmos!=='low' && settings.atmos!==false){ settings.atmos = 'low'; saveSettings(settings); try{ syncGraphicsUI(); }catch(e){} }
  else if(settings.grain!==false){ settings.grain = false; saveSettings(settings); try{ syncGraphicsUI(); }catch(e){} }
}
// v489: frame-rate target (Settings > Graphics: 30 or 60). Frames that arrive early are skipped, which also keeps
// 90/120Hz phones at 60 instead of drawing (and heating up) twice as often.
function fpsFrameMs(){ return (settings && +settings.fpsCap===30) ? 1000/30 : 1000/60; }
function loop(t){
  if(t-lastT < fpsFrameMs()*0.65 && t>lastT){ requestAnimationFrame(loop); return; }
  try{ moodAutoTune(t-lastT); }catch(err){}
  try{ gfxAutoTune(t-lastT); }catch(err){}
  const dt = Math.min((t-lastT)/1000, 0.05);
  lastT = t;
  try{ pcFrame(); }catch(err){}
  if(game && game.started && !game.over && !window.__simPause){
    // Combat feel (v104): hit-stop freezes the simulation for a few frames
    // (render still runs); screen-shake decays on real time either way.
    tickBuffs(dt);
    if(game.shakeT>0) game.shakeT -= dt;
    if(game.hitStopT>0) game.hitStopT -= dt;
    else update(dt);
  }
  try{ audioFrame(dt); }catch(err){}
  try{ if(game && game.followers && game.followers.length && game.player){ const live = game.followers.filter(f=>f.hp>0); if(live.length){ game.player._fSnapRoom = game.room; } if(live.length) game.player._fSnap = live.map(f=>({kind:f.kind||'knight', hp:f.hp, maxHp:f.maxHp})); } }catch(err){}
  // v405: while the (landscape) inventory panel is open, slide the view left so the player stays visible beside it
  let _cs = 0;
  try{
    let tgt = 0;
    if(game && game.camera && invOverlay.style.display==='flex' && window.matchMedia('(min-aspect-ratio:1/1) and (min-width:640px)').matches){
      const cw = invOverlay.querySelector('.modalCard').getBoundingClientRect().width;
      tgt = (cw/Math.max(1,window.innerWidth)) * W / 2;
    }
    _camShift += (tgt-_camShift) * Math.min(1, dt*10); if(Math.abs(tgt-_camShift)<0.5) _camShift = tgt;
    _cs = _camShift; if(_cs && game.camera) game.camera.x += _cs;
  }catch(err){ _cs = 0; }
  if(!window.__simPause){ try{ render(); }catch(err){   // v497: one bad frame no longer freezes the whole game (the loop used to stop here and show the error box)
    window.__renderErrors = (window.__renderErrors||0) + 1; if(window.__renderErrors<=3) console.error('render error', err);
    try{ ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over'; }catch(e2){} } }
  if(_cs && game.camera) game.camera.x -= _cs;
  requestAnimationFrame(loop);
}

// v239: a trap thrown at/into a wall (or off the floor) slid back toward the player to the first open spot,
// so enemies can actually walk into its trigger radius
function trapSpotOpen(g, x, y){
  const R = g.room; if(!R) return true;
  if(R.obstacles && R.obstacles.some(o=>!o.isWater && circleRectCollide(x,y,16,o.x,o.y,o.w,o.h))) return false;
  if(R.floorRects && R.floorRects.length && !R.floorRects.some(r=>x>r.x+10 && x<r.x+r.w-10 && y>r.y+10 && y<r.y+r.h-10)) return false;   // v454: was 28 -- narrow corridors rejected every spot
  return true;
}
function snapTrapPos(g, p, x, y){
  if(trapSpotOpen(g, x, y)) return {x, y};
  const dx = p.x-x, dy = p.y-y, d = Math.hypot(dx,dy)||1;
  // v454: look around the target first (an enemy hugging a wall), then back along the throw; the player's feet are the very last resort
  for(let rr=14; rr<=56; rr+=14) for(let k=0;k<8;k++){ const an = Math.atan2(dy,dx) + k*Math.PI/4; const nx = x+Math.cos(an)*rr, ny = y+Math.sin(an)*rr; if(trapSpotOpen(g, nx, ny)) return {x:nx, y:ny}; }
  for(let st=12; st<=d; st+=12){ const nx = x+dx/d*st, ny = y+dy/d*st; if(trapSpotOpen(g, nx, ny)) return {x:nx, y:ny}; }
  return {x:p.x, y:p.y};
}
function placeSurvTrap(g, trap){
  if(!g.thrownTraps) g.thrownTraps = [];
  const same = g.thrownTraps.filter(t=>t.kind===trap.kind);
  if(same.length >= SURV_TRAP_MAX*(uq(g.player,'uq_survivalist')?2:1)){ const i = g.thrownTraps.indexOf(same[0]); if(i>=0) g.thrownTraps.splice(i,1); }
  g.thrownTraps.push(trap);
  if(uq(g.player,'uq_survivalist') && !trap._echo){   // v383 Snare of Echoes: a second trap lands beside the first
    const pl = g.player, dx = trap.x-pl.x, dy = trap.y-pl.y, d = Math.hypot(dx,dy)||1, off = Math.max(26, trap.r*0.9);
    let ex = trap.x - dy/d*off, ey = trap.y + dx/d*off;
    if(!trapSpotOpen(g, ex, ey)){ ex = trap.x + dy/d*off; ey = trap.y - dx/d*off; }
    if(!trapSpotOpen(g, ex, ey)){ ex = trap.x; ey = trap.y; }
    const twin = Object.assign({}, trap, {x:ex, y:ey, _echo:true});
    if(same.length+1 >= SURV_TRAP_MAX*2){ const j = g.thrownTraps.indexOf(same[1]||same[0]); if(j>=0) g.thrownTraps.splice(j,1); }
    g.thrownTraps.push(twin);
    g.particles.push({type:'burst', x:ex, y:ey, t:0.2, max:0.2, color:'#f2a31b'});
  }
}
// v205: like nearestEnemy, but only enemies actually visible on the player's screen count (Charge, ranged auto-aim)
const ONSCREEN_PAD_X = 30, ONSCREEN_PAD_TOP = 70, ONSCREEN_PAD_BOTTOM = 36;   // v502
function enemyOnScreen(g, e){
  const cam = g.camera; if(!cam) return true;
  const io = toIso(e.x, e.y), sx = io.x-cam.x, sy = io.y-cam.y;
  return sx>=ONSCREEN_PAD_X && sx<=W-ONSCREEN_PAD_X && sy>=ONSCREEN_PAD_TOP && sy<=H-ONSCREEN_PAD_BOTTOM;   // v502: the enemy's feet must be a little inside the screen, so its whole body is in view (v497 used the exact edge)
}
// v315: with the mouse active the PLAYER's auto-target prefers the enemy under the cursor. Nothing under the cursor falls back to the
// normal nearest-enemy pick, except while the strike button is held: then it returns null so the swing/shot goes toward the cursor.
function pcCursorWorld(){
  const g = game; if(!g || !g.camera || !PC.mouseOn || settings.pcControls===false) return null;
  const ix = PC.mx + g.camera.x, iy = PC.my + g.camera.y;
  let z = 0; if((g.scene==='redcrater' || g.scene==='mountainpass' || g.scene==='redridge' || g.scene==='highlands') && g.player) z = crElevAt(g.player.x, g.player.y);
  const a = ix/ISO_KX, b = (iy+z)/ISO_KY;
  return {x:(a+b)/2, y:(b-a)/2};
}
function pcAimPick(g, from, maxD, onScreen, exclude){
  const c = pcCursorWorld(); if(!c) return undefined;
  let best = null, bd = 1e9; const lim = maxD||99999;
  for(const e of g.enemies){
    if(exclude && exclude.indexOf(e)>=0) continue;
    if(dist(from,e) - Math.max(0,(e.r||0)-30) - bigBossReach(e) >= lim) continue;
    const cd = Math.sqrt((e.x-c.x)*(e.x-c.x) + (e.y-c.y)*(e.y-c.y));
    if(cd >= e.r+PC_PICK_R || cd >= bd) continue;
    if(onScreen && !enemyOnScreen(g,e)) continue;
    if(!hasLOS(g,from,e)) continue;
    bd = cd; best = e;
  }
  if(best) return best;
  return PC.lmb ? null : undefined;
}
const RANGED_TARGET_R = 720;
function nearestEnemyOnScreen(g, from, maxD){
  if(PC.mouseOn && g.player===from){ const r = pcAimPick(g, from, maxD, true); if(r!==undefined) return r; }
  const cam = g.camera; if(!cam) return nearestEnemy(g, from, maxD);
  const lim = from===g.player ? Math.max(maxD||0, RANGED_TARGET_R) : (maxD||99999); let best=null, bs=Infinity;   // v548: your ranged attacks and spells reach anything you can see on screen   // v497: bs starts at Infinity (it used to start at maxD, which dropped every enemy that was not already fighting you beyond ~80 units)
  for(const e of g.enemies){
    if(!enemyOnScreen(g,e)) continue;
    const d=dist(from,e) - Math.max(0, (e.r||0)-30) - bigBossReach(e);   // v452/v453: huge monsters are targeted from their edge; the great beasts from further out
    if(d>=lim) continue;
    const sc = d + (from===g.player && !enemyEngagedWith(e, from) ? 260 : 0);   // v490: monsters already fighting you come first
    if(sc<bs && hasLOS(g,from,e)){ bs=sc; best=e; }
  }
  return best;
}
// v453: extra auto-target reach vs the great beasts only (Molten Colossus, Kraken, Leviathans, Ember Tyrant, Gojira, the Crater King)
function bigBossReach(e){ return (e && (e.colossus || e.lvBoss || e.kraken || e.balrog || e.gj || e.trex)) ? 240 : 0; }
function nearestEnemy(g, from, maxD, exclude){
  if(PC.mouseOn && g.player===from){ const r = pcAimPick(g, from, maxD, false, exclude); if(r!==undefined) return r; }
  const isP = g.player===from;
  let best=null, bd=maxD||99999, bs=Infinity;
  for(const e of g.enemies){
    if(exclude && exclude.indexOf(e)>=0) continue;
    const d=dist(from,e) - Math.max(0, (e.r||0)-30) - bigBossReach(e);   // v452/v453: huge monsters are targeted from their edge; the great beasts from further out
    if(d>=bd) continue;
    // v490: your own auto-aim skips anything off screen and prefers monsters already fighting you
    const sc = isP ? d + (enemyEngagedWith(e, from) ? 0 : 260) : d;
    if(sc<bs && (!isP || enemyOnScreen(g,e)) && hasLOS(g,from,e)){ bs=sc; best=e; }
  }
  return best;
}
function enemyEngagedWith(e, p){ return !!(e.aggroed || e.engaged || e._tgt===p || (e.lastAttackedT||0)>0 || e.state==='attack'); }

