// ---------------- Fire enemies (v263) ----------------
//   * Lava Beetle  -- beetle-headed hominid: melee claws, a ranged fireball, and a telegraphed leap that splashes fire.
//   * Fire Bat     -- flying; circles the player and dives in (telegraphed) for a burning bite.
//   * Magma Golem  -- cave-troll style brute (telegraphed club smash); when it dies a telegraphed blast ring
//                     goes off: half fire, half physical damage (see golemDeath).
//   * Magma Crawler -- tiny fire lizard that pours out of the Colossus' cracks (no loot / xp).
const BEETLE_LEAP_R = 64, BEETLE_LEAP_TELE = 0.55;
function updateLavaBeetle(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const reach = e.r+target.r+2, p = g.player;
  updateStuckTracking(e, dt);
  if(e.tState==='tele'){
    e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.tT<=0){ e.tState='air'; e.tT=0.4; e.tFrom={x:e.x,y:e.y}; }
  } else if(e.tState==='air'){
    e.tT -= dt;
    const k = 1-clamp(e.tT/0.4,0,1);
    e.x = e.tFrom.x+(e.tPt.x-e.tFrom.x)*k; e.y = e.tFrom.y+(e.tPt.y-e.tFrom.y)*k;
    e.hop = Math.sin(k*Math.PI)*46; e.moving = true;
    if(e.tT<=0){
      e.tState='idle'; e.hop=0; e.atkCd = e.atkCdMax*0.8;
      const R = BEETLE_LEAP_R, dm = e.dmg*1.3*TELE_DMG_MULT;
      if(dist(p,e) < R+p.r) playerDamage(g, dm, e);
      if(g.followers) for(const f of g.followers) if(dist(f,e) < R+f.r) applyFollowerDamage(g, f, dm, e);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.45, max:0.45, r:R, color:'#ff8a3a'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#ff6a20'});
    }
  } else if(e.fbT>0){
    e.fbT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.fbT<=0){
      const ang = Math.atan2(target.y-e.y, target.x-e.x);
      g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*250,vy:Math.sin(ang)*250,r:9,dmg:e.dmg*1.05,from:'enemy',life:2.4,color:'#ff7a2a',srcEnemy:e,targetRef:target});
      g.particles.push({type:'burst', x:e.x+Math.cos(ang)*14, y:e.y+Math.sin(ang)*14, t:0.25, max:0.25, color:'#ffb050'});
    }
  } else {
    e.tCd -= dt; e.fbCd -= dt;
    if(e.tCd<=0 && d<290 && d>95 && enemyLOS(g,e,target)){
      e.tPt = {x:target.x, y:target.y}; e.tState='tele'; e.tT=BEETLE_LEAP_TELE; e.tCd=4.5+Math.random()*2.5; e.windT=0;
    } else if(e.fbCd<=0 && d>125 && d<440 && enemyLOS(g,e,target)){
      e.fbT = 0.55; e.fbMax = 0.55; e.fbCd = 2.6+Math.random()*1.8; e.windT = 0;
    } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
      // mid claw swipe
    } else if(d>reach){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
      e.moving = true;
    } else if(e.atkCd<=0){
      beginEnemyMelee(e);
    }
  }
}
function updateFireBat(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  e.moving = true; e.hop = 16 + Math.sin(e.animT*9)*5;
  e.fCd -= dt;
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  if(e.fAng===undefined){ e.fAng = Math.atan2(e.y-target.y, e.x-target.x); e.fSign = Math.random()<0.5 ? -1 : 1; e.fR = 140 + Math.random()*90; }
  if(e.fState==='tele'){
    e.fT -= dt; e.moving = false; e.atkAnimT = 0.1;
    face(Math.atan2(target.y-e.y, target.x-e.x));
    if(e.fT<=0){ e.fState='dive'; e.fT=0.55; e.fHit=false; e.fDir=Math.atan2(target.y-e.y, target.x-e.x); }
  } else if(e.fState==='dive'){
    e.fT -= dt;
    const sp = e.speed*2.8*chillMult;
    e.x += Math.cos(e.fDir)*sp*dt; e.y += Math.sin(e.fDir)*sp*dt; face(e.fDir);
    if(!e.fHit && dist(e,target) < e.r+target.r+4){
      e.fHit = true;
      const dm = e.dmg*1.2;
      if(isFollowerTarget) applyFollowerDamage(g, target, dm, e); else playerDamage(g, dm, e);
      g.particles.push({type:'burst', x:target.x, y:target.y, t:0.3, max:0.3, color:'#ff8a3a'});
    }
    if(e.fT<=0){ e.fState='orbit'; e.fCd = 2.2+Math.random()*1.6; e.fSign = Math.random()<0.5 ? -1 : 1; e.fAng = Math.atan2(e.y-target.y, e.x-target.x); }
  } else {
    e.fAng += e.fSign*dt*(e.speed*chillMult/e.fR)*0.9;
    const tx = target.x+Math.cos(e.fAng)*e.fR, ty = target.y+Math.sin(e.fAng)*e.fR;
    const a = Math.atan2(ty-e.y, tx-e.x), dd = Math.hypot(tx-e.x, ty-e.y);
    const sp = e.speed*chillMult*(dd>70 ? 1.15 : 0.55);
    e.x += Math.cos(a)*sp*dt; e.y += Math.sin(a)*sp*dt; face(Math.atan2(target.y-e.y, target.x-e.x));
    if(e.fCd<=0 && d<340 && d>70){ e.fState='tele'; e.fT=0.45; e.windT=0; }
  }
}
// ---------------- The Molten Colossus (v263) ----------------
//  Phase 1 (>66%)  The Beast: telegraphed charge across the arena, ground-cracking stomps, a fire-breath cone.
//                  The shell is heavily armoured; every big move leaves it exposed for a moment (take 1.4x, no armour).
//  Phase 2 (33-66) Molten Shell: the shell glows red and soaks up damage (x0.55) unless a weak point is exposed;
//                  lava pools, lava strikes, and Magma Crawlers pour out of the cracks.
//  Phase 3 (<33%)  Heart of the Mountain: shell fractures, the molten core is exposed, the Colossus is ~45% faster
//                  with shorter telegraphs, eruptions rain down, lava floods in from the arena edge, and at ~12% and
//                  ~5% it unleashes a Cataclysm: stand inside a safe circle or be annihilated.
const COL_STOMP_R = 330, COL_BREATH_LEN = 640, COL_BREATH_HALF = 0.46, COL_STRIKE_R = 78, COL_ERUPT_R = 92, COL_SAFE_R = 175, COL_MAX_INSET = 200;
const COL_MV1 = ['charge','breath','stomp'], COL_MV2 = ['stomp','lava','charge','summon','breath','lava'], COL_MV3 = ['erupt','stomp','charge','lava','breath','erupt','summon'];
function initColossus(e){
  e.colossus = true; e.cAwake = false; e.cState = 'chase'; e.cT = 0; e.cCd = 2.2; e.cNext = 0; e.cPhase = 1; e.cDir = 0; e.cHit = false;
  e.cPools = []; e.cStrikes = []; e.cCracks = []; e.cErupts = []; e.colWeak = 0; e.armorBase = e.armor || 0; e.cCata = 0; e.cSafe = null; e.baseR = e.r;
  e.cMove = ''; e.cBreathDir = 0;
}
function colArena(e){ return {x0:HEART_AX0+e.r, x1:HEART_AX1-e.r, y0:HEART_AY0+e.r, y1:HEART_AY1-e.r}; }
function colHit(g, e, tgt, mult, phys){
  const dm = e.dmg*mult*TELE_DMG_MULT;
  const src = phys ? {dmgType:'normal', hp:0, x:e.x, y:e.y, r:0} : e;
  if(tgt===g.player) playerDamage(g, dm, src); else applyFollowerDamage(g, tgt, dm, src);
}
function colHitAll(g, e, test, mult, phys){
  const p = g.player;
  if(test(p)) colHit(g, e, p, mult, phys);
  if(g.followers) for(const f of g.followers) if(test(f)) colHit(g, e, f, mult, phys);
}
function colPool(e, x, y, r, t){ e.cPools.push({x, y, r, t, max:t, tick:0.2}); }
function colCrackSet(e, n, len){
  for(let i=0;i<n;i++){
    const a = (i/n)*Math.PI*2 + Math.random()*0.6, l = len*(0.7+Math.random()*0.5);
    e.cCracks.push({x1:e.x+Math.cos(a)*e.r*0.7, y1:e.y+Math.sin(a)*e.r*0.7, x2:e.x+Math.cos(a)*(e.r*0.7+l), y2:e.y+Math.sin(a)*(e.r*0.7+l), t:7, max:7, warm:0.55});
  }
}
function segDist(px,py,x1,y1,x2,y2){
  const dx=x2-x1, dy=y2-y1, l2=dx*dx+dy*dy; let u = l2>0 ? ((px-x1)*dx+(py-y1)*dy)/l2 : 0; u = clamp(u,0,1);
  return Math.hypot(px-(x1+dx*u), py-(y1+dy*u));
}
function colPickSafe(e, g, room){
  const p = g.player, A = {x0:HEART_CX-HEART_RX*0.55, x1:HEART_CX+HEART_RX*0.55, y0:HEART_CY-HEART_RY*0.45, y1:HEART_CY+HEART_RY*0.45};   // v456: inside the bowl
  const out = [];
  const a0 = Math.random()*Math.PI*2;
  out.push({x:clamp(p.x+Math.cos(a0)*330, A.x0, A.x1), y:clamp(p.y+Math.sin(a0)*330, A.y0, A.y1), r:COL_SAFE_R});
  for(let k=0;k<2;k++){
    for(let tries=0;tries<20;tries++){
      const c = {x:rand(A.x0,A.x1), y:rand(A.y0,A.y1), r:COL_SAFE_R};
      if(out.every(o=>dist(o,c) > 420)){ out.push(c); break; }
    }
  }
  return out;
}
function updateColossus(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player, P3 = e.cPhase===3, F = P3 ? 0.72 : 1;
  const face = (a)=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  e.moving = false;
  if(!e.cAwake){
    if(d < 1500 || e.hp < e.maxHp){ e.cAwake = true; showMsg('The Molten Colossus awakens!', 2.6, '#ff9a50'); shakeScreen(g, 9, 0.7); }
    else return;
  }
  if(e.colWeak>0){ e.colWeak -= dt; if(e.colWeak<0) e.colWeak = 0; }
  e.armor = e.colWeak>0 ? 0 : e.armorBase;
  const frac = e.hp/e.maxHp, spd = e.speed*(P3?1.45:1)*chillMult, AR = colArena(e);
  // ---- persistent hazards ----
  for(let i=e.cPools.length-1;i>=0;i--){
    const pl = e.cPools[i]; pl.t -= dt; pl.tick -= dt;
    if(pl.tick<=0){
      pl.tick = 0.5;
      colHitAll(g, e, o=>dist(o,pl) < pl.r+o.r, 0.18, false);
    }
    if(pl.t<=0) e.cPools.splice(i,1);
  }
  for(let i=e.cCracks.length-1;i>=0;i--){
    const c = e.cCracks[i]; c.t -= dt; if(c.warm>0) c.warm -= dt;
    else {
      c.tick = (c.tick||0) - dt;
      if(c.tick<=0){ c.tick = 0.45; colHitAll(g, e, o=>segDist(o.x,o.y,c.x1,c.y1,c.x2,c.y2) < 24+o.r, 0.15, false); }
    }
    if(c.t<=0) e.cCracks.splice(i,1);
  }
  for(let i=e.cStrikes.length-1;i>=0;i--){
    const s = e.cStrikes[i]; s.t -= dt;
    if(s.t<=0){
      colHitAll(g, e, o=>dist(o,s) < COL_STRIKE_R+o.r, 1.2, false);
      g.particles.push({type:'burst', x:s.x, y:s.y, t:0.35, max:0.35, color:'#ffb060'});
      g.particles.push({type:'ring', x:s.x, y:s.y, t:0.4, max:0.4, r:COL_STRIKE_R, color:'#ff8a3a'});
      colPool(e, s.x, s.y, 56, 4);
      e.cStrikes.splice(i,1);
    }
  }
  for(let i=e.cErupts.length-1;i>=0;i--){
    const s = e.cErupts[i]; s.t -= dt;
    if(s.t<=0){
      colHitAll(g, e, o=>dist(o,s) < COL_ERUPT_R+o.r, 1.7, false);
      g.particles.push({type:'burst', x:s.x, y:s.y, t:0.5, max:0.5, color:'#ffd08a'});
      g.particles.push({type:'ring', x:s.x, y:s.y, t:0.5, max:0.5, r:COL_ERUPT_R, color:'#ff6a20'});
      colPool(e, s.x, s.y, 50, 3);
      shakeScreen(g, 4, 0.2);
      e.cErupts.splice(i,1);
    }
  }
  if(P3 && room.lavaInset < COL_MAX_INSET) room.lavaInset = Math.min(COL_MAX_INSET, room.lavaInset + 2.6*dt);
  // ---- state machine ----
  const st = e.cState;
  const lanesOK = ()=>true;
  if(st==='chase'){
    e.cCd -= dt;
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+6, dt)) return;
    if(e.cPhase===1 && frac<0.66){ e.cState='phaseTele'; e.cT=2.0; e.cNewPhase=2; e.windT=0; showMsg('The Colossus roars — its shell begins to glow!', 2.6, '#ff9a50'); shakeScreen(g, 8, 0.6); return; }
    if(e.cPhase===2 && frac<0.33){ e.cState='phaseTele'; e.cT=2.4; e.cNewPhase=3; e.windT=0; showMsg('The shell fractures — the Heart of the Mountain is exposed!', 3.0, '#ffb060'); shakeScreen(g, 10, 0.8); return; }
    if(e.cPhase===3 && ((e.cCata<1 && frac<0.12) || (e.cCata<2 && frac<0.05))){
      e.cCata++; e.cState='cataTele'; e.cT=3.4; e.cSafe = colPickSafe(e, g, room); e.windT=0;
      showMsg('CATACLYSM — get inside a safe circle!', 2.6, '#ffe08a'); shakeScreen(g, 8, 0.5); return;
    }
    if(e.cCd<=0 && d<1500){
      e.windT = 0;
      const list = e.cPhase===1 ? COL_MV1 : e.cPhase===2 ? COL_MV2 : COL_MV3;
      let mv = list[e.cNext++ % list.length];
      if(mv==='summon' && g.enemies.filter(x=>x.colAdd && x.hp>0).length >= 3) mv = 'lava';
      if(mv==='stomp' && d > COL_STOMP_R+60) mv = 'charge';
      if(mv==='breath' && d > COL_BREATH_LEN+40) mv = 'charge';
      e.cMove = mv;
      const aim = Math.atan2(target.y-e.y, target.x-e.x);
      if(mv==='charge'){ e.cState='chargeTele'; e.cT=1.1*F; e.cDir=aim; face(aim); }
      else if(mv==='stomp'){ e.cState='stompTele'; e.cT=1.0*F; }
      else if(mv==='breath'){ e.cState='breathTele'; e.cT=1.15*F; e.cBreathDir=aim; face(aim); }
      else if(mv==='lava'){ e.cState='lavaTele'; e.cT=0.9*F; }
      else if(mv==='erupt'){ e.cState='eruptTele'; e.cT=0.8*F; }
      else { e.cState='summonTele'; e.cT=1.3*F; }
      return;
    }
    if(d > e.r+target.r+10){
      const ang = steerAngleTo(e, target.x, target.y, []);
      e.x += Math.cos(ang)*spd*dt; e.y += Math.sin(ang)*spd*dt; e.moving = true; face(ang);
    } else if(e.atkCd<=0){ beginEnemyMelee(e); }
  } else if(st==='chargeTele'){
    e.cT -= dt; e.atkAnimT = 0.1;
    if(e.cT<=0){ e.cState='charge'; e.cT=1.9; e.cHit=false; }
  } else if(st==='charge'){
    e.cT -= dt;
    const sp = P3 ? 700 : 560;
    e.x += Math.cos(e.cDir)*sp*dt; e.y += Math.sin(e.cDir)*sp*dt; e.moving = true;
    if(Math.random()<0.5) g.particles.push({type:'burst', x:e.x-Math.cos(e.cDir)*e.r*0.6, y:e.y-Math.sin(e.cDir)*e.r*0.6, t:0.35, max:0.35, color:'#8a6a58'});
    const lim = e.r*0.8;
    if(!e.cHit){
      for(const o of [p].concat(g.followers||[])){
        if(dist(e,o) < lim+o.r){ e.cHit = true; colHit(g, e, o, 1.4, true); shakeScreen(g, 8, 0.25); }
      }
    }
    const cx = clamp(e.x, AR.x0, AR.x1), cy = clamp(e.y, AR.y0, AR.y1), crashed = (cx!==e.x || cy!==e.y);
    e.x = cx; e.y = cy;
    if(crashed){
      shakeScreen(g, 12, 0.5);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:260, color:'#ffb060'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.5, max:0.5, color:'#b8a890'});
      colCrackSet(e, 4, 380);
      e.cState='recover'; e.cT=2.4; e.colWeak = 2.6; showMsg('It slammed into the wall — attack its exposed shell!', 1.8, '#ffe08a');
    } else if(e.cT<=0){ e.cState='recover'; e.cT=1.4*F; e.colWeak = 1.6; }
  } else if(st==='stompTele'){
    e.cT -= dt; e.atkAnimT = 0.1;
    if(e.cT<=0){
      colHitAll(g, e, o=>dist(o,e) < COL_STOMP_R+o.r, 1.1, true);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:COL_STOMP_R, color:'#d9a066'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.5, max:0.5, color:'#b8a078'});
      shakeScreen(g, 11, 0.4);
      colCrackSet(e, P3 ? 8 : 6, 440);
      e.cState='recover'; e.cT=1.2*F; e.colWeak = 1.2;
    }
  } else if(st==='breathTele'){
    e.cT -= dt; e.atkAnimT = 0.1; face(e.cBreathDir);
    if(e.cT<=0){
      const ca = Math.cos(e.cBreathDir), sa = Math.sin(e.cBreathDir), tn = Math.tan(COL_BREATH_HALF);
      const inCone = (o)=>{ const dx=o.x-e.x, dy=o.y-e.y, u=dx*ca+dy*sa, v=-dx*sa+dy*ca; return u>0 && u<COL_BREATH_LEN && Math.abs(v) < u*tn+o.r; };
      colHitAll(g, e, inCone, 1.5, false);
      for(let u=120; u<=COL_BREATH_LEN; u+=110){
        g.particles.push({type:'burst', x:e.x+ca*u, y:e.y+sa*u, t:0.4, max:0.4, color:'#ffb060'});
        if(u%220<110) colPool(e, e.x+ca*u+(Math.random()-0.5)*40, e.y+sa*u+(Math.random()-0.5)*40, 44, 3.5);
      }
      shakeScreen(g, 5, 0.3);
      e.cState='recover'; e.cT=1.3*F; e.colWeak = 1.3;
    }
  } else if(st==='lavaTele'){
    e.cT -= dt; e.atkAnimT = 0.1;
    if(e.cT<=0){
      const n = P3 ? 8 : 5;
      for(let k=0;k<n;k++){
        const a = Math.random()*Math.PI*2, rr = k===0 ? 0 : rand(60, 340);
        { const cp = heartClampPt(p.x+Math.cos(a)*rr, p.y+Math.sin(a)*rr, 40); e.cStrikes.push({x:cp.x, y:cp.y, t:1.0*F, max:1.0*F}); }
      }
      e.cState='recover'; e.cT=1.0*F;
    }
  } else if(st==='eruptTele'){
    e.cT -= dt; e.atkAnimT = 0.1;
    if(e.cT<=0){
      for(let k=0;k<9;k++){
        const a = Math.random()*Math.PI*2, rr = k<2 ? rand(0,50) : rand(80, 460);
        { const cp = heartClampPt(p.x+Math.cos(a)*rr, p.y+Math.sin(a)*rr, 40); e.cErupts.push({x:cp.x, y:cp.y, t:1.2+Math.random()*0.5, max:1.7}); }
      }
      shakeScreen(g, 5, 0.4);
      e.cState='recover'; e.cT=1.0*F;
    }
  } else if(st==='summonTele'){
    e.cT -= dt; e.atkAnimT = 0.1;
    if(e.cT<=0){
      const alive = g.enemies.filter(x=>x.colAdd && x.hp>0).length;
      for(let i=0;i<6 && alive+i<6;i++){
        const a = Math.random()*Math.PI*2, rr = e.r*0.9+rand(30,160);
        const pos = heartClampPt(e.x+Math.cos(a)*rr, e.y+Math.sin(a)*rr, 30);
        const c = spawnEnemy(g, 'magmacrawler', pos);
        if(c){ c.colAdd = true; c.noReward = true; c.engaged = true; }
        g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.4, max:0.4, color:'#ff7a2a'});
      }
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:e.r+160, color:'#ff8a3a'});
      shakeScreen(g, 5, 0.3);
      e.cState='recover'; e.cT=1.1*F; e.colWeak = 1.4;
    }
  } else if(st==='phaseTele'){
    e.cT -= dt; e.atkAnimT = 0.1;
    if(Math.random()<0.4) g.particles.push({type:'burst', x:e.x+rand(-e.r,e.r), y:e.y+rand(-e.r,e.r), t:0.4, max:0.4, color:'#ff8a3a'});
    if(e.cT<=0){
      e.cPhase = e.cNewPhase;
      e.cNext = 0; e.cCd = 1.0;
      if(e.cPhase===2){
        for(let k=0;k<6;k++){
          for(let tries=0;tries<12;tries++){
            const c = heartClampPt(rand(HEART_AX0+150, HEART_AX1-150), rand(HEART_AY0+120, HEART_AY1-120), 120);
            if(dist(c,p) > 360 && dist(c,e) > e.r+160 && e.cPools.every(q=>dist(q,c) > 340)){ colPool(e, c.x, c.y, 100, 45); break; }
          }
        }
        g.particles.push({type:'ring', x:e.x, y:e.y, t:0.7, max:0.7, r:480, color:'#ff5a20'});
      } else {
        room.lavaInset = 1;
        g.particles.push({type:'ring', x:e.x, y:e.y, t:0.8, max:0.8, r:620, color:'#ffd08a'});
      }
      shakeScreen(g, 12, 0.6);
      e.cState='recover'; e.cT=1.4; e.colWeak = 3.0;
    }
  } else if(st==='cataTele'){
    e.cT -= dt; e.atkAnimT = 0.1;
    if(Math.random()<0.6) g.particles.push({type:'burst', x:p.x+rand(-420,420), y:p.y+rand(-300,300), t:0.35, max:0.35, color:'#ff7a2a'});
    if(e.cT<=0){
      const safe = (o)=> e.cSafe.some(s=>dist(o,s) < s.r);
      const dm = 2.0;
      if(!safe(p)) colHit(g, e, p, dm, false);
      if(g.followers) for(const f of g.followers) if(!safe(f)) colHit(g, e, f, dm, false);
      for(let k=0;k<14;k++) g.particles.push({type:'burst', x:p.x+rand(-600,600), y:p.y+rand(-420,420), t:0.5, max:0.5, color:'#ffd08a'});
      g.particles.push({type:'ring', x:p.x, y:p.y, t:0.8, max:0.8, r:700, color:'#ff5a20'});
      shakeScreen(g, 14, 0.8);
      e.cSafe = null;
      e.cState='recover'; e.cT=2.6; e.colWeak = 3.2;
    }
  } else {   // recover
    e.cT -= dt;
    if(e.cT<=0){ e.cState='chase'; e.cCd = (e.cPhase===1 ? 1.8 : e.cPhase===2 ? 1.4 : 0.9); }
  }
  e.x = clamp(e.x, AR.x0, AR.x1); e.y = clamp(e.y, AR.y0, AR.y1);
  { const cp = heartClampPt(e.x, e.y, e.r*0.6); e.x = cp.x; e.y = cp.y; }   // v456: the bowl is round
}
function colossusSlain(e){
  const g = game, p = g.player, room = g.room;
  p.colossusSlain = true;
  if(room){ room.lavaInset = 0; }
  for(const x of g.enemies) if(x.colAdd) x.hp = 0;
  e.cPools = []; e.cStrikes = []; e.cErupts = []; e.cCracks = [];
  huntBossKilled('hunt_colossus');
  colossusAftermath(g);
  showMsg('The Molten Colossus crumbles — the lava recedes.', 3.4, '#ffb060');
  shakeScreen(g, 14, 1.0);
  saveGame();
}
function drawColossusTelegraph(e){
  if(!e.cAwake) return;
  const t = e.animT||0, st = e.cState;
  ctx.save();
  const ell = (x,y,r,fill,stroke,lw)=>{ const i = toIso(x,y); ctx.beginPath(); ctx.ellipse(i.x, i.y, r*ISO_KX*Math.SQRT2, r*ISO_KY*Math.SQRT2, 0, 0, 7); if(fill){ ctx.fillStyle=fill; ctx.fill(); } if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=lw||2; ctx.stroke(); } };
  // the whole-arena Cataclysm wash
  if(st==='cataTele' && e.cSafe){
    const f = clamp(1-e.cT/3.4,0,1);
    ctx.restore(); ctx.save();
    for(const s of e.cSafe){
      const i = toIso(s.x,s.y), pulse = 0.5+0.5*Math.sin(t*6);
      ctx.beginPath(); ctx.ellipse(i.x, i.y, s.r*ISO_KX*Math.SQRT2, s.r*ISO_KY*Math.SQRT2, 0, 0, 7);
      ctx.fillStyle='rgba(120,210,255,'+(0.14+0.12*pulse)+')'; ctx.fill();
      ctx.strokeStyle='rgba(190,235,255,'+(0.7+0.3*pulse)+')'; ctx.lineWidth=3; ctx.stroke();
    }
  }
  for(const c of e.cCracks){
    const a = c.warm>0 ? 0.35 : 0.9, i1 = toIso(c.x1,c.y1), i2 = toIso(c.x2,c.y2), fade = clamp(c.t/1.2,0,1);
    ctx.strokeStyle = 'rgba(255,'+(c.warm>0?150:110)+',40,'+(a*fade)+')'; ctx.lineWidth = c.warm>0 ? 2 : 6;
    ctx.beginPath(); ctx.moveTo(i1.x,i1.y); ctx.lineTo((i1.x+i2.x)/2+8, (i1.y+i2.y)/2-4); ctx.lineTo(i2.x,i2.y); ctx.stroke();
    if(c.warm<=0){ ctx.strokeStyle='rgba(255,230,150,'+(0.7*fade)+')'; ctx.lineWidth=2; ctx.stroke(); }
  }
  for(const pl of e.cPools){
    const a = clamp(pl.t/1.5,0,1)*(0.55+0.15*Math.sin(t*5+pl.x));
    ell(pl.x, pl.y, pl.r, 'rgba(255,100,28,'+(a*0.55)+')', 'rgba(255,214,130,'+(a*0.8)+')', 1.6);
  }
  for(const s of e.cStrikes){
    const f = clamp(1-s.t/s.max,0,1);
    ell(s.x, s.y, COL_STRIKE_R, 'rgba(255,110,40,'+(0.08+f*0.2)+')', 'rgba(255,190,110,'+(0.5+f*0.5)+')', 2.5);
    ell(s.x, s.y, COL_STRIKE_R*f, 'rgba(255,130,50,'+(0.15+f*0.3)+')');
  }
  for(const s of e.cErupts){
    const f = clamp(1-s.t/s.max,0,1);
    ell(s.x, s.y, COL_ERUPT_R, 'rgba(255,80,30,'+(0.08+f*0.22)+')', 'rgba(255,170,90,'+(0.5+f*0.5)+')', 2.5);
    ell(s.x, s.y, COL_ERUPT_R*f, 'rgba(255,200,90,'+(0.15+f*0.3)+')');
  }
  if(st==='chargeTele' || st==='charge'){
    const f = st==='charge' ? 1 : clamp(1-e.cT/1.1,0,1), ca=Math.cos(e.cDir), sa=Math.sin(e.cDir), hw=e.r*0.85, len=1000;
    const pts=[[0,-hw],[len,-hw],[len,hw],[0,hw]].map(([u,v])=>toIso(e.x+ca*u-sa*v, e.y+sa*u+ca*v));
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<4;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath();
    ctx.fillStyle='rgba(255,90,30,'+(0.08+f*0.26)+')'; ctx.fill();
    ctx.strokeStyle='rgba(255,170,100,'+(0.45+f*0.5)+')'; ctx.lineWidth=2.5; ctx.stroke();
  } else if(st==='stompTele'){
    const f = clamp(1-e.cT/1.0,0,1), i = toIso(e.x,e.y);
    ctx.translate(i.x, i.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,190,110,'+(0.5+f*0.5)+')'; ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.arc(0,0,COL_STOMP_R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,110,40,'+(0.08+f*0.26)+')'; ctx.beginPath(); ctx.arc(0,0,COL_STOMP_R*ISO_KX*Math.SQRT2*f,0,7); ctx.fill();
  } else if(st==='breathTele'){
    const f = clamp(1-e.cT/1.15,0,1), ca=Math.cos(e.cBreathDir), sa=Math.sin(e.cBreathDir), tn=Math.tan(COL_BREATH_HALF), L=COL_BREATH_LEN;
    const o = toIso(e.x+ca*e.r*0.6, e.y+sa*e.r*0.6), a1 = toIso(e.x+ca*L-sa*L*tn, e.y+sa*L+ca*L*tn), a2 = toIso(e.x+ca*L+sa*L*tn, e.y+sa*L-ca*L*tn);
    ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(a1.x,a1.y); ctx.lineTo(a2.x,a2.y); ctx.closePath();
    ctx.fillStyle='rgba(255,110,30,'+(0.08+f*0.26)+')'; ctx.fill();
    ctx.strokeStyle='rgba(255,200,120,'+(0.45+f*0.5)+')'; ctx.lineWidth=2.5; ctx.stroke();
  } else if(st==='lavaTele' || st==='eruptTele' || st==='summonTele' || st==='phaseTele'){
    const tot = st==='phaseTele' ? (e.cNewPhase===3?2.4:2.0) : 1.3, f = clamp(1-e.cT/tot,0,1), i = toIso(e.x,e.y);
    ctx.translate(i.x, i.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,100,40,'+(0.4+f*0.5)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,(e.r+80+f*220)*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
  }
  ctx.restore();
}
// ---------------- sprites ----------------
function drawLavaBeetleIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/15;
  const air = e.tState==='air', tele = e.tState==='tele', fb = e.fbT>0, hop = e.hop||0;
  const walk = e.moving ? Math.sin(t*10) : 0, crouch = tele ? 5 : 0;
  drawShadow(iso.x, iso.y, (13-hop*0.1)*s, 4.6*s);
  ctx.save(); ctx.translate(iso.x, iso.y-hop); ctx.scale(face*s, s);
  ctx.lineCap='round'; ctx.lineJoin='round';
  const shell = flash?'#fff':'#6a2418', shellD = flash?'#fff':'#3a120c', skin = flash?'#fff':'#8a3a20', glow = 'rgba(255,'+(tele||fb?190:130)+',40,'+(0.55+0.3*Math.sin(t*5))+')';
  // legs
  ctx.strokeStyle = shellD; ctx.lineWidth = 4.2;
  ctx.beginPath(); ctx.moveTo(-4,-13+crouch); ctx.lineTo(-6+walk*3,-6); ctx.lineTo(-6+walk*4,0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4,-13+crouch); ctx.lineTo(6-walk*3,-6); ctx.lineTo(6-walk*4,0); ctx.stroke();
  // elytra (shell halves behind the torso)
  ctx.fillStyle = shellD; ctx.beginPath(); ctx.ellipse(-5,-27+crouch,9,15,-0.12,0,7); ctx.fill();
  ctx.fillStyle = shell; ctx.beginPath(); ctx.ellipse(-3,-27+crouch,8,14,-0.1,0,7); ctx.fill();
  ctx.strokeStyle = glow; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3,-40+crouch); ctx.lineTo(-4,-14+crouch); ctx.stroke();
  // torso
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(1,-25+crouch,9,13,0,0,7); ctx.fill();
  ctx.strokeStyle = '#2a0c08'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = glow; ctx.lineWidth = 1.1;
  for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(2,-31+i*6+crouch,7-i*0.8,0.35,Math.PI-0.35); ctx.stroke(); }
  // arms (front arm swings up when winding)
  const wind = e.windT>0 || e.atkAnimT>0 ? 1 : 0;
  ctx.strokeStyle = shellD; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(6,-32+crouch); ctx.lineTo(12,-26+crouch-wind*7+walk*2); ctx.lineTo(17,-22+crouch-wind*12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-5,-32+crouch); ctx.lineTo(-11,-24+crouch-walk*2); ctx.lineTo(-13,-17+crouch); ctx.stroke();
  ctx.fillStyle = '#e8d8b8'; for(const [hx,hy] of [[17,-22-wind*12],[19,-24-wind*12],[18,-20-wind*12]]){ ctx.beginPath(); ctx.moveTo(hx,hy+crouch-1.4); ctx.lineTo(hx+4.2,hy+crouch); ctx.lineTo(hx,hy+crouch+1.4); ctx.closePath(); ctx.fill(); }
  // head with mandibles + antennae
  ctx.fillStyle = shell; ctx.beginPath(); ctx.ellipse(4,-43+crouch,7.5,6.5,0,0,7); ctx.fill();
  ctx.strokeStyle = '#2a0c08'; ctx.lineWidth = 1.1; ctx.stroke();
  ctx.strokeStyle = '#d8c8a8'; ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.moveTo(10,-41+crouch); ctx.quadraticCurveTo(15,-38+crouch,12,-35+crouch); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9,-39+crouch); ctx.quadraticCurveTo(13,-34+crouch,9,-32+crouch); ctx.stroke();
  ctx.strokeStyle = shellD; ctx.lineWidth = 1.3;
  const sw = Math.sin(t*4)*2;
  ctx.beginPath(); ctx.moveTo(3,-48+crouch); ctx.quadraticCurveTo(0+sw,-56+crouch,-4+sw,-60+crouch); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6,-48+crouch); ctx.quadraticCurveTo(9+sw,-56+crouch,13+sw,-59+crouch); ctx.stroke();
  ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.arc(7,-45+crouch,2,0,7); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,80,0.5)'; ctx.beginPath(); ctx.arc(7,-45+crouch,4,0,7); ctx.fill();
  // fireball charging between the hands
  if(fb){
    const k = 1-clamp(e.fbT/(e.fbMax||0.55),0,1), r = 3+k*6, gx = 21, gy = -26+crouch;
    const gr = ctx.createRadialGradient(gx,gy,0.5,gx,gy,r*1.8); gr.addColorStop(0,'#fff4b0'); gr.addColorStop(0.45,'#ff9a30'); gr.addColorStop(1,'rgba(220,60,10,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(gx,gy,r*1.8,0,7); ctx.fill();
  }
  ctx.restore();
  drawHpBar(iso, 56*s, e.r, e.hp, e.maxHp);
}
function drawFireBatIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/11, hop = e.hop||16;
  const tele = e.fState==='tele', dive = e.fState==='dive';
  drawShadow(iso.x, iso.y, 9*s, 3.4*s);
  ctx.save(); ctx.translate(iso.x, iso.y-hop-8); ctx.scale(face*s, s);
  ctx.lineJoin='round'; ctx.lineCap='round';
  const flap = dive ? 0.2 : Math.sin(t*(tele?26:17));
  const reg = !!e.reg;
  const body = flash?'#fff':(reg?'#2c2430':'#3a1a14'), mem = flash?'#fff':(reg?'#4a3c56':'#5a2418');
  // wings
  for(const sx of [-1,1]){
    ctx.save(); ctx.scale(1,1);
    const lift = -4 + flap*10, off = sx*0;
    ctx.fillStyle = mem; ctx.strokeStyle = '#1a0806'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,-2);
    ctx.quadraticCurveTo(sx*8, -10+lift*0.4, sx*24, -6+lift);
    ctx.lineTo(sx*18, -1+lift*0.5); ctx.lineTo(sx*14, 3+lift*0.3); ctx.lineTo(sx*8, 1); ctx.lineTo(sx*4, 4);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = reg ? 'rgba(180,170,210,0.55)' : 'rgba(255,130,40,'+(0.7)+')'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(sx*24,-6+lift); ctx.lineTo(sx*18,-1+lift*0.5); ctx.lineTo(sx*14,3+lift*0.3); ctx.lineTo(sx*8,1); ctx.stroke();
    ctx.restore();
  }
  // body + head
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0,0,5.5,7,0,0,7); ctx.fill(); ctx.strokeStyle='#1a0806'; ctx.lineWidth=1; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(3,-7,4.2,4,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1,-10); ctx.lineTo(0,-15); ctx.lineTo(3.5,-10.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(5,-10); ctx.lineTo(7.5,-15); ctx.lineTo(7.5,-9.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = reg ? (tele||dive ? '#ff3a3a' : '#e8d8ff') : (tele||dive ? '#ff3a20' : '#ffa030'); ctx.beginPath(); ctx.arc(5,-7.5,1.5,0,7); ctx.fill();
  if(reg){ ctx.restore(); drawHpBar(iso, 40*s+hop, e.r, e.hp, e.maxHp); return; }
  // ember glow + tail flame
  const gr = ctx.createRadialGradient(0,2,1,0,2,13); gr.addColorStop(0,'rgba(255,150,40,'+(tele?0.6:0.3)+')'); gr.addColorStop(1,'rgba(255,80,10,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,2,13,0,7); ctx.fill();
  const fl = 0.8+0.3*Math.sin(t*14);
  ctx.fillStyle = '#ff9a30'; ctx.beginPath(); ctx.moveTo(-2,6); ctx.quadraticCurveTo(-4,12*fl,-1,16*fl); ctx.quadraticCurveTo(1,11*fl,2,6); ctx.closePath(); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 40*s+hop, e.r, e.hp, e.maxHp);
}
function drawMagmaGolemIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/26;
  const tele = e.tState==='tele', wind = e.windT>0 || e.atkAnimT>0;
  const walk = e.moving ? Math.sin(t*4.5) : 0, bob = e.moving ? Math.abs(walk)*2 : Math.sin(t*1.4);
  const pulse = 0.6+0.4*Math.sin(t*3);
  drawShadow(iso.x, iso.y, 30*s, 10*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle='#120a08'; ctx.lineWidth=1.4;
  const rock = flash?'#fff':'#5a4a46', rockL = flash?'#fff':'#7a6862', rockD = flash?'#fff':'#2e2422';
  const poly = (pts,fill)=>{ ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.stroke(); };
  // legs
  poly([[-16,-26],[-5,-26],[-4+walk*4,-2],[-18+walk*4,-2]], rockD);
  poly([[5,-26],[16,-26],[18-walk*4,-2],[4-walk*4,-2]], rock);
  ctx.fillStyle='rgba(255,120,30,'+(0.5*pulse)+')'; ctx.fillRect(-12+walk*3,-8,6,2); ctx.fillRect(9-walk*3,-8,6,2);
  // torso: stacked boulders
  const ty = -bob;
  poly([[-24,-30+ty],[-20,-64+ty],[-6,-76+ty],[10,-74+ty],[22,-62+ty],[26,-30+ty],[8,-22+ty],[-10,-22+ty]], rock);
  poly([[-16,-58+ty],[-4,-70+ty],[8,-66+ty],[-2,-54+ty]], rockL);
  // lava veins
  ctx.strokeStyle='rgba(255,'+(tele?200:140)+',40,'+(0.55+0.4*pulse)+')'; ctx.lineWidth=2.6;
  ctx.beginPath(); ctx.moveTo(-14,-60+ty); ctx.lineTo(-6,-46+ty); ctx.lineTo(-12,-32+ty); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8,-66+ty); ctx.lineTo(14,-50+ty); ctx.lineTo(6,-36+ty); ctx.stroke();
  const cg = ctx.createRadialGradient(0,-46+ty,1,0,-46+ty,13); cg.addColorStop(0,'rgba(255,230,140,'+(0.8*pulse)+')'); cg.addColorStop(1,'rgba(255,90,20,0)');
  ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,-46+ty,13,0,7); ctx.fill();
  // head
  poly([[-8,-90+ty],[8,-92+ty],[11,-78+ty],[-9,-77+ty]], rockL);
  ctx.fillStyle='#ffb030'; ctx.fillRect(1,-86+ty,6,2.4); ctx.fillStyle='rgba(255,170,50,0.4)'; ctx.fillRect(-1,-88+ty,10,6);
  // arms: raised overhead while smashing
  const up = tele ? 1 : wind ? 0.6 : 0, swing = walk*0.15;
  const arm = (sx, col)=>{
    const sy = -66+ty, hx = sx*(26+up*2), hy = -34+ty - up*58 + (sx>0 ? swing*10 : -swing*10);
    ctx.save(); ctx.strokeStyle='#120a08'; ctx.lineWidth=11; ctx.beginPath(); ctx.moveTo(sx*22,sy); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.strokeStyle=col; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(sx*22,sy); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.fillStyle=col; ctx.strokeStyle='#120a08'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(hx,hy,9,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(255,120,30,'+(0.4+0.4*pulse)+')'; ctx.beginPath(); ctx.arc(hx,hy,4,0,7); ctx.fill();
    ctx.restore();
  };
  arm(-1, rockD); arm(1, rock);
  ctx.restore();
  drawHpBar(iso, 100*s, e.r, e.hp, e.maxHp);
}
function drawMagmaCrawlerIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/10;
  drawShadow(iso.x, iso.y, 11*s, 4*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineCap='round'; ctx.lineJoin='round';
  const wig = e.moving ? Math.sin(t*14) : 0;
  ctx.strokeStyle = flash?'#fff':'#2a120c'; ctx.lineWidth = 2;
  for(let i=0;i<3;i++){ const lx = -6+i*6; ctx.beginPath(); ctx.moveTo(lx,-4); ctx.lineTo(lx-2+wig*(i%2?1:-1)*2,0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(lx,-4); ctx.lineTo(lx+3-wig*(i%2?1:-1)*2,1); ctx.stroke(); }
  ctx.fillStyle = flash?'#fff':'#4a1c10'; ctx.beginPath(); ctx.ellipse(0,-6,11,6,0,0,7); ctx.fill(); ctx.strokeStyle='#1a0806'; ctx.lineWidth=1; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,150,40,'+(0.6+0.3*Math.sin(t*6))+')'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-7,-8); ctx.lineTo(-2,-5); ctx.lineTo(3,-9); ctx.lineTo(8,-6); ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#5a2414'; ctx.beginPath(); ctx.ellipse(10,-7,4.5,3.6,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffc040'; ctx.beginPath(); ctx.arc(12,-8.2,1.2,0,7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 24*s, e.r, e.hp, e.maxHp);
}
// The Molten Colossus: a mountain-sized tortoise. Design units: shell ~230 wide; scaled by r/118.
function drawColossusIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, s = e.r/118*1.3, face = e.faceSign||1;
  const flash = e.hitT>0, ph = e.cPhase||1, weak = e.colWeak>0, st = e.cState||'chase';
  const pulse = 0.7+0.3*Math.sin(t*2.6), tele = /Tele$/.test(st) && st!=='phaseTele';
  const rock = flash?'#6a322c':'#3a302e', rockL = flash?'#80403a':'#5a4a4a', rockD = flash?'#42201c':'#1e1618';
  const gAlpha = ph===1 ? 0.5 : ph===2 ? 0.85 : 1;
  drawShadow(iso.x, iso.y+6, 160*s, 46*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1,0.45);
  const hg = ctx.createRadialGradient(0,0,10,0,0,190*s); hg.addColorStop(0,'rgba(255,100,30,'+(0.30*gAlpha*pulse)+')'); hg.addColorStop(1,'rgba(255,60,10,0)');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0,0,190*s,0,7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle='#0c0706'; ctx.lineWidth=2.2;
  const gait = st==='charge' ? Math.sin(t*14) : e.moving ? Math.sin(t*3.2) : 0;
  const raise = st==='stompTele' ? 30*clamp(1-e.cT/1.0,0,1) : 0;
  const leg = (cx, foot, far, idx)=>{
    const sw = gait*10*(idx%2?1:-1), lift = Math.max(0, gait*(idx%2?1:-1))*7 + (idx===3 ? raise : 0);
    const fy = foot - lift, c = far ? rockD : rock;
    ctx.beginPath(); ctx.moveTo(cx-26,-62); ctx.lineTo(cx+26,-62); ctx.lineTo(cx+30+sw,fy-6); ctx.lineTo(cx+22+sw,fy); ctx.lineTo(cx-22+sw,fy); ctx.lineTo(cx-32+sw,fy-6); ctx.closePath();
    ctx.fillStyle = c; ctx.fill(); ctx.stroke();
    ctx.fillStyle = far ? rockD : rockL; ctx.beginPath(); ctx.moveTo(cx-18,-56); ctx.lineTo(cx-4,-60); ctx.lineTo(cx-8+sw*0.6,fy-14); ctx.lineTo(cx-20+sw*0.6,fy-10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,'+(110+Math.round(60*pulse))+',30,'+(0.55*gAlpha)+')'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(cx+6,-50); ctx.lineTo(cx+10+sw*0.5,-30); ctx.lineTo(cx+4+sw*0.8,fy-10); ctx.stroke();
    ctx.strokeStyle='#0c0706'; ctx.lineWidth=2.2;
    ctx.fillStyle='rgba(255,140,40,'+(0.7*pulse)+')'; ctx.fillRect(cx-18+sw, fy-3, 36, 3);
  };
  // tail stub + far legs
  ctx.fillStyle = rockD; ctx.beginPath(); ctx.moveTo(-108,-66); ctx.lineTo(-156,-42); ctx.lineTo(-110,-36); ctx.closePath(); ctx.fill(); ctx.stroke();
  leg(-62,-18,true,0); leg(58,-18,true,1);
  // belly + lava drips under the shell
  ctx.fillStyle = '#140c0c'; ctx.beginPath(); ctx.ellipse(0,-44,104,20,0,0,7); ctx.fill();
  for(let i=0;i<7;i++){
    const ph2 = (t*0.55+i*0.31)%1, dx = -84+i*28, dy = -40+ph2*34;
    ctx.fillStyle = 'rgba(255,'+(120+i*8)+',30,'+((1-ph2)*0.9)+')';
    ctx.beginPath(); ctx.moveTo(dx-2.4,dy-5); ctx.quadraticCurveTo(dx,dy+6,dx+2.4,dy-5); ctx.closePath(); ctx.fill();
  }
  // near legs
  leg(-82,6,false,2); leg(72,6,false,3);
  // head and neck (front is +x)
  const jaw = st==='breathTele' ? 9+6*Math.sin(t*20) : (e.atkAnimT>0 ? 6 : 1.5);
  ctx.fillStyle = rock; ctx.beginPath(); ctx.moveTo(86,-84); ctx.lineTo(150,-92); ctx.lineTo(154,-44); ctx.lineTo(90,-48); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rock; ctx.beginPath(); ctx.moveTo(138,-98); ctx.lineTo(188,-84); ctx.lineTo(204,-60-jaw*0.2); ctx.lineTo(190,-52-jaw*0.4); ctx.lineTo(140,-52); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rockD; ctx.beginPath(); ctx.moveTo(144,-48); ctx.lineTo(196,-46+jaw); ctx.lineTo(188,-34+jaw); ctx.lineTo(148,-36); ctx.closePath(); ctx.fill(); ctx.stroke();
  if(jaw>3){ const mg = ctx.createRadialGradient(180,-46,1,180,-46,24); mg.addColorStop(0,'rgba(255,240,150,0.95)'); mg.addColorStop(0.5,'rgba(255,130,30,0.8)'); mg.addColorStop(1,'rgba(255,60,10,0)'); ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(180,-46,24,0,7); ctx.fill(); }
  // horns / volcanic protrusions
  ctx.fillStyle = rockL;
  for(const [bx,by,tx,ty,ex] of [[142,-96,134,-138,156],[158,-92,166,-136,174],[174,-88,194,-122,186],[126,-92,108,-128,140]]){
    ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(tx,ty); ctx.lineTo(ex,by+2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(196,-56); ctx.lineTo(214,-40); ctx.lineTo(192,-48); ctx.closePath(); ctx.fill(); ctx.stroke();
  // eyes
  const eg = ctx.createRadialGradient(172,-72,1,172,-72,13); eg.addColorStop(0,'rgba(255,230,120,0.95)'); eg.addColorStop(1,'rgba(255,110,20,0)');
  ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(172,-72,13,0,7); ctx.fill();
  ctx.fillStyle = '#ffa020'; ctx.beginPath(); ctx.ellipse(172,-72,5,3.4,-0.2,0,7); ctx.fill();
  ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.arc(173,-72,1.6,0,7); ctx.fill();
  // ---- shell: a chunk of the mountain
  const crest = [[-112,-52],[-120,-96],[-94,-130],[-72,-124],[-54,-160],[-30,-146],[-8,-180],[14,-152],[38,-172],[58,-142],[84,-134],[104,-102],[116,-56],[98,-44],[60,-50],[20,-40],[-30,-48],[-70,-42],[-100,-46]];
  const shellPath = ()=>{ ctx.beginPath(); ctx.moveTo(crest[0][0],crest[0][1]); for(let i=1;i<crest.length;i++) ctx.lineTo(crest[i][0],crest[i][1]); ctx.closePath(); };
  const sg = ctx.createLinearGradient(0,-180,0,-40); sg.addColorStop(0, flash?'#7e403a':'#5a4a48'); sg.addColorStop(0.55, rock); sg.addColorStop(1, rockD);
  shellPath(); ctx.fillStyle = sg; ctx.fill(); ctx.stroke();
  // rock facets
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for(const f of [[[-94,-130],[-54,-160],[-40,-110],[-84,-100]],[[-8,-180],[38,-172],[30,-120],[-6,-130]],[[58,-142],[104,-102],[84,-84],[50,-100]]]){ ctx.beginPath(); ctx.moveTo(f[0][0],f[0][1]); for(let i=1;i<f.length;i++) ctx.lineTo(f[i][0],f[i][1]); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  for(const f of [[[-112,-52],[-70,-90],[-50,-60]],[[10,-90],[50,-70],[16,-50]],[[84,-134],[116,-56],[90,-70]]]){ ctx.beginPath(); ctx.moveTo(f[0][0],f[0][1]); for(let i=1;i<f.length;i++) ctx.lineTo(f[i][0],f[i][1]); ctx.closePath(); ctx.fill(); }
  // phase 2: the whole shell glows red-hot
  if(ph===2){ shellPath(); ctx.fillStyle='rgba(235,50,20,'+(0.30+0.14*pulse+(tele?0.1:0))+')'; ctx.fill(); }
  // glowing magma cracks
  const cracks = [[[-70,-122],[-58,-98],[-66,-76],[-48,-58]],[[-8,-176],[-4,-142],[10,-118],[0,-90],[16,-62]],[[52,-150],[40,-120],[58,-98],[48,-70]],[[-104,-90],[-84,-84],[-86,-62]],[[84,-126],[76,-100],[92,-78]],[[-30,-140],[-34,-112],[-24,-96]]];
  const crkW = ph===1 ? 2.4 : ph===2 ? 4 : 3.4;
  for(const c of cracks){
    ctx.beginPath(); ctx.moveTo(c[0][0],c[0][1]); for(let i=1;i<c.length;i++) ctx.lineTo(c[i][0],c[i][1]);
    ctx.strokeStyle='rgba(255,'+(100+Math.round(50*pulse))+',30,'+(gAlpha*(0.55+0.3*pulse))+')'; ctx.lineWidth=crkW+1.6; ctx.stroke();
    ctx.strokeStyle='rgba(255,226,140,'+(gAlpha*0.8)+')'; ctx.lineWidth=crkW*0.4; ctx.stroke();
  }
  // phase 3: the shell is fractured open -- the molten core burns through
  if(ph===3){
    const gap = [[-50,-132],[-20,-152],[8,-138],[36,-148],[54,-120],[42,-88],[10,-76],[-24,-84],[-48,-102]];
    ctx.beginPath(); ctx.moveTo(gap[0][0],gap[0][1]); for(let i=1;i<gap.length;i++) ctx.lineTo(gap[i][0],gap[i][1]); ctx.closePath();
    const cg = ctx.createRadialGradient(2,-114,2,2,-114,56); cg.addColorStop(0,'#fff6b8'); cg.addColorStop(0.35,'#ffb030'); cg.addColorStop(0.75,'#e05a14'); cg.addColorStop(1,'#a02a08');
    ctx.fillStyle = cg; ctx.fill(); ctx.strokeStyle='#2a0c06'; ctx.lineWidth=2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(255,245,170,'+(0.35+0.25*pulse)+')'; ctx.beginPath(); ctx.ellipse(2,-114,20+4*pulse,15+3*pulse,0,0,7); ctx.fill();
    // broken shell plates leaning away from the opening
    ctx.fillStyle = rockL;
    for(const f of [[[-56,-136],[-46,-160],[-26,-150],[-30,-134]],[[40,-150],[56,-138],[62,-118],[50,-124]],[[-52,-96],[-34,-84],[-50,-80]]]){ ctx.beginPath(); ctx.moveTo(f[0][0],f[0][1]); for(let i=1;i<f.length;i++) ctx.lineTo(f[i][0],f[i][1]); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }
  // weak points (exposed windows): bright pulsing nodes on the shell
  if(weak || ph===3){
    const k = weak ? 1 : 0.6;
    for(const [wx,wy] of [[-62,-98],[46,-112],[88,-92],[-18,-70]]){
      const wg = ctx.createRadialGradient(wx,wy,1,wx,wy,16*k+5); wg.addColorStop(0,'rgba(255,250,200,'+(0.95*k)+')'); wg.addColorStop(0.5,'rgba(255,200,70,'+(0.6*k)+')'); wg.addColorStop(1,'rgba(255,120,20,0)');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(wx,wy,16*k+5+2*pulse,0,7); ctx.fill();
    }
  }
  // smoke
  for(let i=0;i<7;i++){
    const k = (t*0.42+i/7)%1, sx = -60+((i*47)%130)+Math.sin(t+i)*6, sy = -170-k*100;
    ctx.fillStyle = 'rgba(60,54,54,'+((1-k)*0.34)+')'; ctx.beginPath(); ctx.arc(sx,sy,10+k*22,0,7); ctx.fill();
  }
  if(ph>=2) for(let i=0;i<5;i++){ const k = (t*0.9+i/5)%1, sx = -40+i*24+Math.sin(t*2+i)*5, sy = -150-k*70; ctx.fillStyle='rgba(255,'+(110+i*14)+',30,'+((1-k)*0.8)+')'; ctx.beginPath(); ctx.arc(sx,sy,1.6+(1-k)*1.4,0,7); ctx.fill(); }
  ctx.restore();
  drawHpBar(iso, 215*s, e.r, e.hp, e.maxHp);
}

