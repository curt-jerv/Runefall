// ---------------- Gojira, the crater dragon (v177) ----------------
// Phase 1: a colossal quadruped -- stomps, tail sweeps, fire spit, a bulldozer charge and lava eruptions.
// At 50% she roars, heals to full and takes to the sky (phase 2): flame-breath sweeps, meteor rain, a crushing dive
// and radial ember volleys. Her hit-circle never changes, so melee can always reach her. Mortal weapons cannot finish
// her: life is floored at 3% and below 10% the player may hurl the Dragon Bolt (see throwDragonBolt).
const GJ_R = 105, GJ_STRIKE_R = 62, GJ_STOMP_R = 300, GJ_SWEEP_IN = 130, GJ_SWEEP_OUT = 390;
const GJ_CHARGE_LEN = 780, GJ_CHARGE_W = 140, GJ_CHARGE_SPEED = 1050;
const GJ_BREATH_LEN = 1050, GJ_BREATH_HALF = 0.2, GJ_DIVE_R = 210, GJ_MAX_LIFT = 100;
const GJ_SEQ1 = ['spit','stomp','charge','sweep','lava','stomp'], GJ_SEQ2 = ['breath','rain','breath','dive','volley','breath'];
function initGojira(e){
  e.gj = true; e.gjAwake = false; e.gjPhase = 1; e.gjState = 'idle'; e.gjT = 0; e.gjCd = 2.2; e.gjIdx = 0;
  e.gjAir = false; e.gjLift = 0; e.gjStrikes = []; e.gjFires = []; e.gjDir = 0; e.gjOrb = Math.random()*6.28; e.gjHitP = false;
  e.gjSlain = false; e.gjFrozen = false; e.gjAdds = false; e.gjTick = 0; e.gjRounds = 0; e.gjSweep = 1; e.gjHint = 0; e.gjHitF = [];
  // mortal weapons can never finish her: below 3% (phase 2) or 1 hp (phase 1) the setter refuses; only the Bolt (gjSlain) kills
  let hpv = e.hp;
  Object.defineProperty(e, 'hp', { configurable:true, enumerable:true,
    get(){ return hpv; },
    set(v){
      if(!e.gjSlain){ const fl = e.gjPhase===2 ? e.maxHp*0.03 : 1; if(v < fl) v = fl; }
      hpv = v;
    } });
}
function spawnGojira(g){
  const R = g.crater;
  const e = spawnEnemy(g, 'gojira', {x:R.bossSpot.x, y:R.bossSpot.y});
  e.isLairBoss = true; e.bossName = 'Gojira'; e.baseR = e.r; initGojira(e);
  e.dmg *= 2.0 + Math.max(0, (g.player.level||1)-44)*0.11; e.pctFloor = 0.16;
  return e;
}
// v182: she hits far harder against high-level players; telegraphed slams also take a slice of max life
function gjHit(g, e, target, mult, kb){
  let dmg = teleDmg(e, mult);
  if(target===g.player && mult>=0.9) dmg = Math.max(dmg, (g.player.maxHp||100)*(e.pctFloor||0.16)*mult);
  if(target===g.player) playerDamage(g, dmg, e, kb); else applyFollowerDamage(g, target, dmg, e);
}
function gjAreaHit(g, e, x, y, r, mult, inner){
  const p = g.player, c = {x,y};
  const inside = (t)=>{ const dd = dist(t,c); return dd < r && (!inner || dd > inner); };
  if(inside(p)){ const a = Math.atan2(p.y-y, p.x-x); gjHit(g, e, p, mult, {x:Math.cos(a)*60, y:Math.sin(a)*60}); }
  if(g.followers) for(const f of g.followers) if(inside(f)) gjHit(g, e, f, mult);
}
function gjBoom(g, x, y, r, col, shake){
  g.particles.push({type:'ring', x, y, t:0.5, max:0.5, r, color:col||'#ff9a3a'});
  g.particles.push({type:'ring', x, y, t:0.35, max:0.35, r:r*0.6, color:'#ffe2a0'});
  g.particles.push({type:'burst', x, y, t:0.45, max:0.45, color:'#ffd08a'});
  if(shake) shakeScreen(g, shake, 0.3);
}
function gojiraOrbit(g, e, dt, target, spd, radius){
  // she circles her target but never backs away from someone closing in, so melee can always reach her
  const vx = e.x-target.x, vy = e.y-target.y, dd = Math.hypot(vx,vy)||1;
  // v456: swoops like the fire bats -- faster circling that flips direction now and then, with the radius breathing in and out
  e.gjFlipT = (e.gjFlipT==null ? 3 : e.gjFlipT) - dt;
  if(e.gjFlipT<=0){ e.gjFlipT = 2.5 + Math.random()*2.5; if(Math.random()<0.6) e.gjOrbDir = -(e.gjOrbDir||1); }
  const wob = radius*(0.75 + 0.35*Math.sin(((g.clock||0))*1.3 + (e.gjOrb||0)));
  const ang = Math.atan2(vy,vx) + dt*(e.gjAir ? Math.min(1.6, spd/Math.max(160,wob)*1.1) : 0.5)*(e.gjOrbDir||1);
  const r = e.gjAir ? wob : Math.min(dd, radius);
  const tx = target.x+Math.cos(ang)*r, ty = target.y+Math.sin(ang)*r;
  const md = Math.hypot(tx-e.x, ty-e.y);
  if(md>8){ const st = Math.min(spd*dt, md); e.x += (tx-e.x)/md*st; e.y += (ty-e.y)/md*st; e.moving = true; }
  const lim = CR_R_TOP-260, cx = e.x-CR_CX, cy = e.y-CR_CY, rr = Math.hypot(cx,cy);
  if(rr>lim){ e.x = CR_CX+cx/rr*lim; e.y = CR_CY+cy/rr*lim; }
  const a = Math.atan2(target.y-e.y, target.x-e.x); e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
}
function updateGojira(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player, mx = e.maxHp;
  const face = (ang)=>{ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  e.moving = false;
  if(e.gjSlain) return;
  // ground hazards and telegraphed eruptions tick whatever else she is doing
  for(let i=e.gjFires.length-1;i>=0;i--){
    const f = e.gjFires[i]; f.t -= dt; f.tick -= dt;
    if(f.tick<=0){ f.tick = 0.5; gjAreaHit(g, e, f.x, f.y, f.r, 0.22); }
    if(f.t<=0) e.gjFires.splice(i,1);
  }
  for(let i=e.gjStrikes.length-1;i>=0;i--){
    const s = e.gjStrikes[i]; s.t -= dt;
    if(s.t<=0){
      gjAreaHit(g, e, s.x, s.y, GJ_STRIKE_R, 0.95);
      gjBoom(g, s.x, s.y, GJ_STRIKE_R, '#ff8a3a', 2);
      e.gjStrikes.splice(i,1);
    }
  }
  const targetLift = (e.gjAir && e.gjState!=='grounded' && e.gjState!=='kneel' && e.gjState!=='diveAir') ? (e.gjState==='diveTele' ? 170 : GJ_MAX_LIFT) : 0;
  if(e.gjState!=='diveAir') e.gjLift += (targetLift-e.gjLift)*Math.min(1, dt*3.2);
  if(e.gjFrozen) return;
  if(!e.gjAwake){
    if(dist(e,p)<400 || e.hp<mx){ e.gjAwake = true; e.gjCd = 2.6; showBigMsg('GOJIRA', 'The crater dragon awakens!', 3.4); shakeScreen(g, 9, 0.6); }
    else return;
  }
  const frac = e.hp/mx, enr = frac < 0.3;
  // only the Dragon Bolt can finish her
  if(e.gjPhase===2 && e.hp <= mx*0.03+1 && e.gjState!=='kneel'){
    e.gjState = 'kneel'; e.gjAir = false; e.tState = 'idle';
    showMsg('Gojira sinks to the ground, spent... only the Dragon Bolt can slay her!', 4.0, '#ffd07a');
  }
  if(e.gjState==='kneel'){ e.gjHint -= dt; if(e.gjHint<=0){ e.gjHint = 14; if(!(p.inventory||[]).some(it=>it&&it.questId==='dragon_bolt')) showMsg('Fetch the Dragon Bolt from the Hunter, then return.', 3.0, '#ffd07a'); } return; }
  // ---- phase change ----
  if(e.gjPhase===1 && frac<=0.5 && e.gjState!=='roar'){
    e.gjState = 'roar'; e.gjT = 3.4; e.windT = 0; e.tState = 'tele';
    showBigMsg('GOJIRA ROARS', 'She heals... and takes to the sky!', 3.4);
    gjBoom(g, e.x, e.y, 520, '#ffb060', 12);
  }
  const spd = e.speed*(enr?1.25:1)*chillMult;
  const st = e.gjState;
  if(st==='idle'){
    e.gjCd -= dt;
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+2, dt)) return;
    if(e.gjCd<=0 && d<950){
      const mv = GJ_SEQ1[e.gjIdx++%GJ_SEQ1.length]; e.windT = 0; e.tState = 'tele';
      if(mv==='stomp'){ e.gjState='stompTele'; e.gjT=1.1; }
      else if(mv==='sweep'){ e.gjState='sweepTele'; e.gjT=1.0; }
      else if(mv==='spit'){ e.gjState='spitTele'; e.gjT=0.8; }
      else if(mv==='charge'){ e.gjState='chargeTele'; e.gjT=0.95; e.gjDir=Math.atan2(target.y-e.y,target.x-e.x); face(e.gjDir); }
      else { e.gjState='lavaTele'; e.gjT=0.9; }
      return;
    }
    if(d > e.r+target.r+2){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*spd*dt; e.y += Math.sin(ang)*spd*dt; e.moving = true; face(ang);
    } else if(e.atkCd<=0) beginEnemyMelee(e);
  }
  else if(st==='stompTele' || st==='sweepTele'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    if(e.gjT<=0){
      e.tState = 'idle';
      if(st==='stompTele'){ gjAreaHit(g, e, e.x, e.y, GJ_STOMP_R, 1.7); gjBoom(g, e.x, e.y, GJ_STOMP_R, '#ff9a3a', 10); }
      else { gjAreaHit(g, e, e.x, e.y, GJ_SWEEP_OUT, 1.4, GJ_SWEEP_IN); gjBoom(g, e.x, e.y, GJ_SWEEP_OUT, '#ffb060', 7); }
      e.gjState = 'recover'; e.gjT = 1.0;
    }
  }
  else if(st==='spitTele'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    const a0 = Math.atan2(target.y-e.y, target.x-e.x); face(a0);
    if(e.gjT<=0){
      e.tState = 'idle';
      for(let k=-1;k<=1;k++){
        const aa = a0+k*0.26;
        g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(aa)*300,vy:Math.sin(aa)*300,r:17,dmg:e.dmg*0.95,from:'enemy',life:2.4,color:'#ff8a3a',srcEnemy:e,targetRef:target});
      }
      g.particles.push({type:'burst', x:e.x+Math.cos(a0)*e.r, y:e.y+Math.sin(a0)*e.r, t:0.3, max:0.3, color:'#ffd08a'});
      e.gjState = 'recover'; e.gjT = 0.9;
    }
  }
  else if(st==='chargeTele'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    if(e.gjT<=0){ e.tState='idle'; e.gjState='charge'; e.gjT = GJ_CHARGE_LEN/GJ_CHARGE_SPEED; e.gjHitP = false; e.gjHitF = []; }
  }
  else if(st==='charge'){
    e.gjT -= dt; e.moving = true;
    const px = e.x, py = e.y;
    e.x += Math.cos(e.gjDir)*GJ_CHARGE_SPEED*dt; e.y += Math.sin(e.gjDir)*GJ_CHARGE_SPEED*dt;
    pushOutOfObstacles(e, room.obstacles);
    const moved = Math.hypot(e.x-px, e.y-py), blocked = moved < GJ_CHARGE_SPEED*dt*0.5;
    g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:'#ff9a3a'});
    const kb = {x:Math.cos(e.gjDir)*80, y:Math.sin(e.gjDir)*80};
    if(!e.gjHitP && dist(e,p) < e.r+p.r+10){ e.gjHitP = true; gjHit(g, e, p, 1.8, kb); }
    if(g.followers) for(const f of g.followers) if(e.gjHitF.indexOf(f)<0 && dist(e,f) < e.r+f.r+10){ e.gjHitF.push(f); gjHit(g, e, f, 1.8); }
    if(e.gjT<=0 || blocked){ e.gjState='recover'; e.gjT=1.4; gjBoom(g, e.x, e.y, 150, '#ffb060', 6); }
  }
  else if(st==='lavaTele'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    if(e.gjT<=0){
      e.tState = 'idle';
      for(let k=0;k<7;k++){
        const a = Math.random()*Math.PI*2, rr = k<2 ? 0 : rand(60,260);
        e.gjStrikes.push({x:p.x+Math.cos(a)*rr, y:p.y+Math.sin(a)*rr, t:0.9+k*0.22, max:0.9+k*0.22});
      }
      e.gjState = 'recover'; e.gjT = 1.4;
    }
  }
  else if(st==='recover'){
    e.gjT -= dt;
    if(e.gjT<=0){ e.gjState = e.gjPhase===1 ? 'idle' : 'fly'; e.gjCd = enr ? 1.3 : 2.2; e.tState = 'idle'; }
  }
  else if(st==='roar'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    e.hp = Math.max(e.hp, mx*(0.5+0.5*(1-e.gjT/3.4)));
    if(Math.random()<0.4) g.particles.push({type:'burst', x:e.x+rand(-90,90), y:e.y+rand(-90,90), t:0.3, max:0.3, color:'#ffb060'});
    if(e.gjT<=0){
      e.hp = mx; e.gjPhase = 2; e.gjAir = true; e.gjState = 'takeoff'; e.gjT = 1.4; e.tState = 'idle';
      gjBoom(g, e.x, e.y, 480, '#ffd08a', 12);
    }
  }
  else if(st==='takeoff'){
    e.gjT -= dt;
    if(e.gjT<=0){ e.gjState = 'fly'; e.gjCd = 1.4; }
  }
  else if(st==='fly'){
    e.gjCd -= dt;
    if(!e.gjAdds && frac<0.25){
      e.gjAdds = true; showMsg('Gojira calls her brood!', 2.4, '#ffb060');
      for(let i=0;i<4;i++){
        const a = i*1.57+0.6, r2 = spawnEnemy(g, 'raptor', {x:clamp(p.x+Math.cos(a)*300,80,room.w-80), y:clamp(p.y+Math.sin(a)*300,80,room.h-80)});
        if(r2){ r2.engaged = true; r2.aggroed = true; r2.dmgType='normal'; r2.dmgSplit='fire'; r2.fireRaptor = true; }
      }
    }
    gojiraOrbit(g, e, dt, target, spd*1.4, 300);
    if(e.gjCd<=0){
      const mv = GJ_SEQ2[e.gjIdx++%GJ_SEQ2.length];
      e.tState = 'tele';
      if(mv==='breath'){ e.gjState='breathTele'; e.gjT=1.3; e.gjDir=Math.atan2(target.y-e.y,target.x-e.x); e.gjSweep = Math.random()<0.5?1:-1; }
      else if(mv==='rain'){ e.gjState='rainTele'; e.gjT=0.9; }
      else if(mv==='dive'){ e.gjState='diveTele'; e.gjT=1.4; e.tPt = {x:target.x,y:target.y}; }
      else { e.gjState='volleyTele'; e.gjT=0.9; e.gjRounds = 2; }
    }
  }
  else if(st==='breathTele'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    if(e.gjT>0.5){ const a = Math.atan2(target.y-e.y,target.x-e.x); e.gjDir += crAngDiff(a,e.gjDir)*Math.min(1,dt*4); }
    face(e.gjDir);
    if(e.gjT<=0){ e.gjState='breath'; e.gjT=2.1; e.gjTick=0; e.tState='tele'; }
  }
  else if(st==='breath'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    const prog = 1 - e.gjT/2.1, a = e.gjDir + e.gjSweep*(prog-0.5)*1.7;
    e.gjBreathA = a; face(a);
    e.gjTick -= dt;
    if(e.gjTick<=0){
      e.gjTick = 0.2;
      const inCone = (t)=>{ const dd = dist(e,t); if(dd>GJ_BREATH_LEN) return false; const ta = Math.atan2(t.y-e.y,t.x-e.x); return Math.abs(crAngDiff(ta,a)) < GJ_BREATH_HALF + t.r/Math.max(60,dd); };
      if(inCone(p)) gjHit(g, e, p, 0.5);
      if(g.followers) for(const f of g.followers) if(inCone(f)) gjHit(g, e, f, 0.5);
    }
    for(let k=0;k<3;k++){ const rr = rand(140,GJ_BREATH_LEN); g.particles.push({type:'burst', x:e.x+Math.cos(a)*rr, y:e.y+Math.sin(a)*rr, t:0.25, max:0.25, color:'#ff9a3a'}); }
    if(e.gjT<=0){ e.gjState='fly'; e.gjCd = enr?1.2:2.0; e.tState='idle'; e.gjBreathA = null; }
  }
  else if(st==='rainTele'){
    e.gjT -= dt; e.atkAnimT = 0.1; gojiraOrbit(g, e, dt, target, spd, 360);
    if(e.gjT<=0){ e.gjState='rain'; e.gjT = enr ? 7.5 : 6.2; e.gjTick = 0; e.tState='idle'; showMsg('Fire rains from the sky!', 1.8, '#ffb060'); }
  }
  else if(st==='rain'){
    e.gjT -= dt; e.gjTick -= dt; gojiraOrbit(g, e, dt, target, spd*1.1, 380);
    if(e.gjTick<=0){
      e.gjTick = enr ? 0.32 : 0.42;
      const a = Math.random()*Math.PI*2, rr = Math.random()<0.4 ? 0 : rand(40,230);
      e.gjStrikes.push({x:clamp(p.x+Math.cos(a)*rr,60,room.w-60), y:clamp(p.y+Math.sin(a)*rr,60,room.h-60), t:0.95, max:0.95});
    }
    if(e.gjT<=0){ e.gjState='fly'; e.gjCd = enr?1.2:2.0; }
  }
  else if(st==='diveTele'){
    e.gjT -= dt; e.atkAnimT = 0.1;
    if(e.gjT>0.6 && e.tPt){ e.tPt.x += (target.x-e.tPt.x)*Math.min(1,dt*3); e.tPt.y += (target.y-e.tPt.y)*Math.min(1,dt*3); }
    gojiraOrbit(g, e, dt, {x:e.tPt.x,y:e.tPt.y,r:0}, spd, 300);
    if(e.gjT<=0){ e.gjState='diveAir'; e.gjT=0.55; e.tFrom = {x:e.x,y:e.y}; e.gjLift0 = e.gjLift; }
  }
  else if(st==='diveAir'){
    e.gjT -= dt;
    const k = 1-clamp(e.gjT/0.55,0,1);
    e.x = e.tFrom.x+(e.tPt.x-e.tFrom.x)*k; e.y = e.tFrom.y+(e.tPt.y-e.tFrom.y)*k;
    e.gjLift = e.gjLift0*(1-k*k); e.moving = true;
    if(e.gjT<=0){
      e.gjLift = 0; e.tState = 'idle';
      gjAreaHit(g, e, e.x, e.y, GJ_DIVE_R, 2.0);
      gjBoom(g, e.x, e.y, GJ_DIVE_R+60, '#ff8a3a', 14);
      e.gjFires.push({x:e.x, y:e.y, r:130, t:5, tick:0.3});
      e.gjState = 'grounded'; e.gjT = enr ? 1.8 : 2.8;
    }
  }
  else if(st==='grounded'){
    e.gjT -= dt;
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+2, dt)) return;
    if(d < e.r+target.r+6 && e.atkCd<=0) beginEnemyMelee(e);
    if(e.gjT<=0){ e.gjState='takeoff'; e.gjT=0.8; }
  }
  else if(st==='volleyTele'){
    e.gjT -= dt; e.atkAnimT = 0.1; gojiraOrbit(g, e, dt, target, spd*0.6, 360);
    if(e.gjT<=0){
      e.tState = 'idle';
      const n = 14, off = e.gjRounds===2 ? 0 : Math.PI/n;
      for(let k=0;k<n;k++){
        const aa = k/n*Math.PI*2+off;
        g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(aa)*250,vy:Math.sin(aa)*250,r:14,dmg:e.dmg*0.75,from:'enemy',life:3.4,color:'#ff9a3a',srcEnemy:e,targetRef:p});
      }
      gjBoom(g, e.x, e.y, 200, '#ff9a3a', 5);
      e.gjRounds--;
      if(e.gjRounds>0){ e.gjState='volleyTele'; e.gjT=0.6; e.tState='tele'; }
      else { e.gjState='fly'; e.gjCd = enr?1.2:2.0; }
    }
  }
  if(g.scene!=='redcrater'){ e.x = clamp(e.x, 100, room.w-100); e.y = clamp(e.y, 100, room.h-100); }   // v398: bosses reused in the Breach stay inside the room
  else if(e.gjPhase===1){ const cx = e.x-CR_CX, cy = e.y-CR_CY, rr = Math.hypot(cx,cy), lim = CR_R_FLOOR-e.r-30; if(rr>lim){ e.x = CR_CX+cx/rr*lim; e.y = CR_CY+cy/rr*lim; } }
}
// ---------------- Rex, the Crater King (v184) ----------------
// Takes Gojira's place on the crater floor after she is slain. Two telegraphed moves:
//   * Crushing Leap -- marks your position, springs onto it and crushes everything in the circle.
//   * Earthshaker Roar -- a huge shockwave ring around him; get out of it (or dodge) before it lands.
// Between moves he chases and bites. Immune to crowd control; enrages below 30% life.
const TX_BITE_R = 115, TX_ROAR_R = 340;
function spawnTrex(g){
  const R = g.crater;
  const e = spawnEnemy(g, 'trex', {x:R.bossSpot.x, y:R.bossSpot.y});
  e.isLairBoss = true; e.bossName = 'Rex, the Crater King'; e.trex = true; e.trState = 'idle'; e.trT = 0; e.trCd = 1.6; e.trIdx = 0; e.trPt = null; e.trWoke = false;
  e.dmg *= 1.5 + Math.max(0, (g.player.level||1)-44)*0.09; e.pctFloor = 0.13;
  return e;
}
function updateTrex(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player;
  e.moving = false;
  const face = (ang)=>{ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  const enr = e.hp < e.maxHp*0.3, spd = e.speed*(enr?1.25:1)*chillMult, st = e.trState;
  if(!e.trWoke && d < 520){ e.trWoke = true; bossMsg('REX', 'The Crater King hunts you!', 3.0); shakeScreen(g, 6, 0.5); }
  if(st==='idle'){
    e.trCd -= dt;
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+2, dt)) return;
    if(e.trCd<=0 && d<520){
      const mv = e.trIdx++%2;
      e.trPt = {x:target.x, y:target.y};
      if(mv===0){ e.trState='biteTele'; e.trT=0.9; } else { e.trState='roarTele'; e.trT=1.2; }
      face(Math.atan2(target.y-e.y, target.x-e.x));
      return;
    }
    if(d > e.r+target.r+2){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*spd*dt; e.y += Math.sin(ang)*spd*dt; e.moving = true; face(ang);
    } else if(e.atkCd<=0) beginEnemyMelee(e);
  }
  else if(st==='biteTele'){
    e.trT -= dt; e.atkAnimT = 0.1;
    if(e.trT>0.35){ e.trPt.x += (target.x-e.trPt.x)*Math.min(1,dt*2.5); e.trPt.y += (target.y-e.trPt.y)*Math.min(1,dt*2.5); }
    face(Math.atan2(e.trPt.y-e.y, e.trPt.x-e.x));
    if(e.trT<=0){ e.trState='leap'; e.trT=0.25; e.trFrom = {x:e.x,y:e.y}; }
  }
  else if(st==='leap'){
    e.trT -= dt; e.moving = true;
    const k = 1-clamp(e.trT/0.25,0,1);
    e.x = e.trFrom.x+(e.trPt.x-e.trFrom.x)*k; e.y = e.trFrom.y+(e.trPt.y-e.trFrom.y)*k;
    pushOutOfObstacles(e, room.obstacles);
    if(e.trT<=0){
      gjAreaHit(g, e, e.x, e.y, TX_BITE_R, 1.4);
      gjBoom(g, e.x, e.y, TX_BITE_R+40, '#d8b060', 9);
      e.trState='recover'; e.trT=1.0;
    }
  }
  else if(st==='roarTele'){
    e.trT -= dt; e.atkAnimT = 0.1;
    if(e.trT<=0){
      gjAreaHit(g, e, e.x, e.y, TX_ROAR_R, 1.0);
      gjBoom(g, e.x, e.y, TX_ROAR_R, '#e0c070', 11);
      e.trState='recover'; e.trT=1.1;
    }
  }
  else if(st==='recover'){
    e.trT -= dt;
    if(e.trT<=0){ e.trState='idle'; e.trCd = enr ? 1.3 : 2.1; }
  }
  if(g.scene!=='redcrater'){ e.x = clamp(e.x, 100, room.w-100); e.y = clamp(e.y, 100, room.h-100); }   // v398
  else { const cx = e.x-CR_CX, cy = e.y-CR_CY, rr = Math.hypot(cx,cy), lim = CR_R_FLOOR-e.r-30; if(rr>lim){ e.x = CR_CX+cx/rr*lim; e.y = CR_CY+cy/rr*lim; } }
}
function drawTrexTelegraph(e){
  if(!e.trex || e.hp<=0) return;
  const st = e.trState;
  if(st!=='biteTele' && st!=='roarTele') return;
  const ring = (x,y,r,frac)=>{
    const iso = toIso(x,y);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle = 'rgba(255,210,120,'+(0.5+frac*0.5)+')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0,0,r*ISO_KX*1.4142,0,7); ctx.stroke();
    ctx.fillStyle = 'rgba(230,120,30,'+(0.08+frac*0.26)+')';
    ctx.beginPath(); ctx.arc(0,0,r*ISO_KX*1.4142*frac,0,7); ctx.fill();
    ctx.restore();
  };
  if(st==='biteTele') ring(e.trPt.x, e.trPt.y, TX_BITE_R, clamp(1-e.trT/0.9,0,1));
  else ring(e.x, e.y, TX_ROAR_R, clamp(1-e.trT/1.2,0,1));
}
function drawTrexIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/62;
  const tele = e.trState==='biteTele' || e.trState==='roarTele' || e.trState==='leap';
  const air = e.trState==='leap' ? Math.sin(clamp(1-e.trT/0.25,0,1)*Math.PI)*60 : 0;
  const body = flash?'#6a7434':'#5a6b2a', dark = flash?'#434f22':'#33401a', belly = flash?'#b0a070':'#c9b070', spike = '#1e2610';
  drawShadow(iso.x, iso.y, 100*s*(1-air/300), 30*s*(1-air/300));
  ctx.save(); ctx.translate(iso.x, iso.y-air); ctx.scale(face*s, s);
  ctx.lineJoin='round'; ctx.lineCap='round';
  const run = e.moving ? Math.sin(t*7) : 0;
  // tail
  for(let i=0;i<9;i++){ const u=i/9, u2=(i+1)/9;
    ctx.strokeStyle = body; ctx.lineWidth = 30*(1-u)+5;
    ctx.beginPath(); ctx.moveTo(-40-u*95, -60+u*14+Math.sin(u*3+t*3)*4*u); ctx.lineTo(-40-u2*95, -60+u2*14+Math.sin(u2*3+t*3)*4*u2); ctx.stroke(); }
  // far leg
  ctx.strokeStyle = dark; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(-6,-46); ctx.lineTo(-14+run*8,-22); ctx.lineTo(-8+run*10,0); ctx.stroke();
  // body
  ctx.fillStyle = body; ctx.strokeStyle = spike; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(0,-64,58,38,-0.18,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(6,-50,44,15,-0.18,0,Math.PI); ctx.fill();
  ctx.fillStyle = spike; for(let i=0;i<6;i++){ const sx=-38+i*13, sy=-96+Math.abs(i-2)*3; ctx.beginPath(); ctx.moveTo(sx-4,sy+4); ctx.lineTo(sx+1,sy-9); ctx.lineTo(sx+7,sy+3); ctx.closePath(); ctx.fill(); }
  // near leg
  ctx.strokeStyle = body; ctx.lineWidth = 21; ctx.beginPath(); ctx.moveTo(14,-46); ctx.lineTo(24-run*8,-22); ctx.lineTo(20-run*10,0); ctx.stroke();
  ctx.strokeStyle = '#eadbb8'; ctx.lineWidth = 3; for(const c of [-5,0,5]){ ctx.beginPath(); ctx.moveTo(20-run*10+c,0); ctx.lineTo(28-run*10+c,3); ctx.stroke(); }
  // tiny arm
  ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(40,-58); ctx.lineTo(52,-48); ctx.stroke();
  // neck + head
  ctx.strokeStyle = body; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(38,-76); ctx.quadraticCurveTo(58,-92,66,-112); ctx.stroke();
  const hx = 74, hy = -118, open = tele ? 16 : 5+Math.sin(t*3)*2;
  ctx.fillStyle = dark; ctx.strokeStyle = spike; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hx-6,hy+6); ctx.lineTo(hx+44,hy+8+open); ctx.lineTo(hx+40,hy+18+open); ctx.lineTo(hx-4,hy+18+open*0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2ead0'; for(let i=0;i<5;i++){ const tx=hx+6+i*8; ctx.beginPath(); ctx.moveTo(tx,hy+8+open*0.6); ctx.lineTo(tx+3,hy+15+open*0.6); ctx.lineTo(tx+6,hy+8+open*0.6); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = body; ctx.strokeStyle = spike;
  ctx.beginPath(); ctx.moveTo(hx-12,hy-14); ctx.lineTo(hx+22,hy-18); ctx.lineTo(hx+48,hy-4); ctx.lineTo(hx+44,hy+8); ctx.lineTo(hx-6,hy+8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffcf3a'; ctx.beginPath(); ctx.ellipse(hx+18,hy-6,5,3,-0.25,0,7); ctx.fill();
  ctx.fillStyle = '#1a0806'; ctx.beginPath(); ctx.ellipse(hx+19,hy-6,1.6,2.4,0,0,7); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.font = "bold 13px Cinzel, Georgia, serif"; ctx.textAlign = 'center'; ctx.fillStyle = '#e8d08a'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4;
  ctx.fillText('Rex, the Crater King', iso.x, iso.y-170*s*0.9-air-4);
  ctx.restore();
}
function gojiraSlain(e){
  const g = game, p = g.player;
  p.gojiraSlain = true;
  const q = getQuest(p, 'slay_gojira');
  if(q && q.status==='active'){ q.killed = true; q.progress = q.total; q.desc = 'Gojira is dead. Inspect the Obsidian Obelisk on the crater floor.'; }
  showBigMsg('GOJIRA IS SLAIN', 'Inspect the obelisk', 5.0, false, true);
  for(let i=0;i<3;i++) dropLoot(g, e.x+rand(-90,90), e.y+rand(-90,90), 'gojira', true, e);
  for(let i=0;i<8;i++) g.particles.push({type:'burst', x:e.x+rand(-120,120), y:e.y+rand(-120,120), t:0.6, max:0.6, color:'#ffd08a'});
  gjBoom(g, e.x, e.y, 600, '#ffe2a0', 16);
  updateQuestBadge(); saveGame();
}
// ---- Dragon Bolt ----
function dragonBoltAvailable(){
  const g = game; if(!g || !g.started || g.scene!=='redcrater') return null;
  const e = g.enemies.find(x=>x.gj && x.hp>0 && !x.gjSlain && !x.gjFrozen);
  if(!e || e.hp/e.maxHp > 0.10) return null;
  if(!(g.player.inventory||[]).some(it=>it && it.questId==='dragon_bolt')) return null;
  return e;
}
function throwDragonBolt(){
  const g = game, p = g.player, e = dragonBoltAvailable();
  if(!e) return;
  p.inventory = p.inventory.filter(it=>!(it && it.questId==='dragon_bolt'));
  e.gjFrozen = true; e.tState = 'idle';
  g.boltFx = {t:0, dur:0.95, fx:p.x, fy:p.y, e};
  showBigMsg('THE DRAGON BOLT FLIES', '', 1.2);
  shakeScreen(g, 4, 0.4);
  updateBoltBtn(); saveGame();
}
function updateBoltBtn(){
  const btn = document.getElementById('boltBtn'); if(!btn) return;
  const on = !!dragonBoltAvailable() && !(game.boltFx);
  if(on !== (btn.style.display==='block')) btn.style.display = on ? 'block' : 'none';
}
function updateBoltFx(g, dt){
  const fx = g.boltFx; if(!fx) return;
  fx.t += dt;
  if(fx.t >= fx.dur){
    const e = fx.e; g.boltFx = null;
    if(e && e.hp>0){
      e.gjSlain = true; e.hp = 0;
      g.flashT = 1.0; shakeScreen(g, 20, 0.7);
      gjBoom(g, e.x, e.y, 700, '#ffffff', 0);
    }
  }
}
function drawBoltFx(g){
  const fx = g.boltFx; if(!fx || !fx.e) return;
  const k = clamp(fx.t/fx.dur,0,1), e = fx.e;
  const arcAt = kk=>Math.sin(kk*Math.PI)*120;
  const pos = kk=>{ const x = fx.fx+(e.x-fx.fx)*kk, y = fx.fy+(e.y-fx.fy)*kk, io = toIso(x,y); return {x:io.x, y:io.y-60-arcAt(kk)}; };
  const P = pos(k), P0 = pos(Math.max(0,k-0.03)), tClock = fx.t*14;
  let ang = Math.atan2(P.y-P0.y, P.x-P0.x); if(P.x===P0.x && P.y===P0.y) ang = -Math.PI/2;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  // fiery trail: layered flames drifting back along the flight path
  for(let i=1;i<=14;i++){
    const kk = Math.max(0,k-i*0.012), Q = pos(kk), a = 1-i/15;
    const r = 20*a+4;
    const gr = ctx.createRadialGradient(Q.x, Q.y, 1, Q.x, Q.y, r);
    gr.addColorStop(0, 'rgba(255,230,140,'+(0.75*a)+')'); gr.addColorStop(0.5,'rgba(255,130,40,'+(0.45*a)+')'); gr.addColorStop(1,'rgba(200,40,10,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(Q.x+Math.sin(tClock+i)*3*a, Q.y+Math.cos(tClock*1.3+i)*3*a, r, 0, 7); ctx.fill();
  }
  // glow around the head
  const gl = ctx.createRadialGradient(P.x, P.y, 2, P.x, P.y, 52);
  gl.addColorStop(0,'rgba(255,240,180,0.95)'); gl.addColorStop(0.4,'rgba(255,170,60,0.45)'); gl.addColorStop(1,'rgba(255,120,30,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(P.x, P.y, 52, 0, 7); ctx.fill();
  // the bolt itself, pointing along its flight
  ctx.translate(P.x, P.y); ctx.rotate(ang); ctx.scale(1.25,1.25);
  ctx.strokeStyle = '#3a2812'; ctx.lineWidth = 1.2;
  ctx.fillStyle = '#d8402a'; ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(-38,-10); ctx.lineTo(-30,-1.5); ctx.lineTo(-40,0); ctx.lineTo(-30,1.5); ctx.lineTo(-38,10); ctx.closePath(); ctx.fill(); ctx.stroke();   // fletching
  const sg = ctx.createLinearGradient(0,-3,0,3); sg.addColorStop(0,'#f0dcae'); sg.addColorStop(1,'#8a6a3a');
  ctx.fillStyle = sg; ctx.fillRect(-30,-2.6,34,5.2); ctx.strokeRect(-30,-2.6,34,5.2);
  ctx.fillStyle = '#d8a83a'; ctx.fillRect(-18,-3.3,4,6.6); ctx.fillRect(-10,-3.3,3,6.6);
  ctx.fillStyle = '#f1e2bc'; ctx.beginPath(); ctx.moveTo(24,0); ctx.lineTo(8,-8); ctx.lineTo(10,-3); ctx.lineTo(3,-3); ctx.lineTo(3,3); ctx.lineTo(10,3); ctx.lineTo(8,8); ctx.closePath(); ctx.fill(); ctx.stroke();   // barbed head
  ctx.shadowColor = '#ff9a3a'; ctx.shadowBlur = 10; ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(6,0); ctx.stroke();
  ctx.restore();
}
// ---- rendering ----
function drawGojiraIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/62;
  const lift = e.gjLift||0, spread = clamp(lift/GJ_MAX_LIFT,0,1)*(e.gjState==='diveAir'?0.6:1);
  const roar = e.gjState==='roar' || /Tele$/.test(e.gjState||'') || e.gjState==='breath';
  const kneel = e.gjState==='kneel';
  const scale = flash?'#6a2820':(kneel?'#6a4a44':'#5b1c15'), dark = flash?'#3c1510':(kneel?'#3a2622':'#2a0b08'), belly = flash?'#b87850':'#dc9048';
  const membrane = flash?'#7a3228':(kneel?'#5a3a36':'#8a2a1c'), spike = '#160709', horn = '#eadbb8';
  drawShadow(iso.x, iso.y, 120*s*(1-lift/500), 36*s*(1-lift/500));
  if(e.gjState==='diveTele' && e.tPt){ /* telegraph drawn separately */ }
  ctx.save(); ctx.translate(iso.x, iso.y-lift*0.9); ctx.scale(face*s, s);
  ctx.lineJoin='round'; ctx.lineCap='round';
  const run = (e.moving && spread<0.3) ? Math.sin(t*7) : 0;
  const dangle = spread>0.5;
  // far legs
  ctx.strokeStyle = dark; ctx.lineWidth = 13;
  const leg = (hx, ph, col)=>{
    ctx.strokeStyle = col;
    const sw = run*ph*9, kx = hx+8+sw*0.5, ky = dangle ? -20 : -20, fx2 = hx+(dangle?-6:4)+sw, fy2 = dangle ? -6 : 0;
    ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(hx,-44); ctx.lineTo(kx,ky); ctx.stroke();
    ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(kx,ky); ctx.lineTo(fx2,fy2); ctx.stroke();
    ctx.strokeStyle = horn; ctx.lineWidth = 3;
    for(const c of [-4,0,4]){ ctx.beginPath(); ctx.moveTo(fx2+c,fy2); ctx.lineTo(fx2+c+7,fy2+3); ctx.stroke(); }
  };
  leg(-40, -1, dark); leg(26, 1, dark);
  // tail
  const tw = Math.sin(t*3)*8*(e.moving?1:0.4);
  for(let i=0;i<10;i++){
    const u = i/10, u2 = (i+1)/10;
    const px = -58-u*105, py = -50+u*8+Math.sin(u*3+t*3)*tw*u;
    const qx = -58-u2*105, qy = -50+u2*8+Math.sin(u2*3+t*3)*tw*u2;
    ctx.strokeStyle = scale; ctx.lineWidth = 26*(1-u)+4;
    ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(qx,qy); ctx.stroke();
    if(i%2===0){ ctx.fillStyle = spike; ctx.beginPath(); ctx.moveTo(px-3,py-(13*(1-u)+2)); ctx.lineTo(px+4,py-(24*(1-u)+5)); ctx.lineTo(px+8,py-(13*(1-u)+2)); ctx.fill(); }
  }
  // far wing
  const wing = (dx, dy, dk, big)=>{
    const f = Math.sin(t*4.6+dx)*0.42*spread;
    const sh = {x:-8+dx, y:-86+dy};
    const elb = {x:sh.x-24-26*spread, y:sh.y-34-88*spread*(big?1:0.92)+f*40};
    const tip = {x:sh.x-56-46*spread*(big?1:0.9), y:sh.y-24-150*spread*(big?1:0.92)+f*90+ (1-spread)*30};
    ctx.fillStyle = dk; ctx.strokeStyle = spike; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(elb.x, elb.y); ctx.lineTo(tip.x, tip.y);
    const back = {x:sh.x-52, y:sh.y+14};
    for(let k=1;k<=4;k++){
      const a = k/4, px2 = tip.x+(back.x-tip.x)*a, py2 = tip.y+(back.y-tip.y)*a;
      const cx2 = tip.x+(back.x-tip.x)*(a-0.125)+ (4-k)*3, cy2 = tip.y+(back.y-tip.y)*(a-0.125)-9;
      ctx.quadraticCurveTo(cx2, cy2+16, px2, py2);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = spike; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(elb.x,elb.y); ctx.lineTo(back.x,back.y); ctx.moveTo(elb.x,elb.y); ctx.lineTo(tip.x+(back.x-tip.x)*0.5, tip.y+(back.y-tip.y)*0.5); ctx.stroke();
  };
  wing(14, -6, dark, false);
  // body
  ctx.fillStyle = scale; ctx.strokeStyle = spike; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(-4,-56,68,37,-0.04,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(2,-44,58,17,-0.04,0,Math.PI); ctx.fill();
  ctx.strokeStyle = 'rgba(70,24,10,0.55)'; ctx.lineWidth = 1.4;
  for(let i=-44;i<52;i+=13){ ctx.beginPath(); ctx.moveTo(i,-46); ctx.lineTo(i+2,-30); ctx.stroke(); }
  // scales shading + molten cracks
  ctx.strokeStyle = 'rgba(255,140,50,'+(0.35+0.25*Math.sin(t*3))+')'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-30,-66); ctx.lineTo(-18,-60); ctx.lineTo(-24,-52); ctx.moveTo(18,-72); ctx.lineTo(28,-64); ctx.lineTo(20,-56); ctx.stroke();
  // dorsal spikes
  ctx.fillStyle = spike;
  for(let i=0;i<9;i++){ const sx = -52+i*13, sy = -88+Math.abs(i-4)*3.4; ctx.beginPath(); ctx.moveTo(sx-5,sy+3); ctx.lineTo(sx+2,sy-(15-Math.abs(i-4)*1.2)); ctx.lineTo(sx+8,sy+2); ctx.closePath(); ctx.fill(); }
  // near legs
  leg(-30, 1, scale); leg(36, -1, scale);
  // near wing
  wing(0, 0, membrane, true);
  // neck + head
  ctx.strokeStyle = scale; ctx.lineWidth = 27;
  ctx.beginPath(); ctx.moveTo(50,-66); ctx.quadraticCurveTo(76,-76,90,-100); ctx.stroke();
  ctx.lineWidth = 19; ctx.beginPath(); ctx.moveTo(84,-92); ctx.lineTo(98,-104); ctx.stroke();
  ctx.strokeStyle = belly; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(56,-58); ctx.quadraticCurveTo(80,-66,92,-88); ctx.stroke();
  const hx = 104, hy = -106, open = roar ? 12 : 3+Math.sin(t*3)*1.5;
  ctx.fillStyle = dark; ctx.strokeStyle = spike; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hx-6,hy+open*0.5); ctx.lineTo(hx+34,hy+8+open); ctx.lineTo(hx+30,hy+15+open); ctx.lineTo(hx-4,hy+14+open*0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  if(roar){ const mg = ctx.createRadialGradient(hx+22,hy+9+open*0.5,1,hx+22,hy+9+open*0.5,16); mg.addColorStop(0,'rgba(255,230,140,0.95)'); mg.addColorStop(1,'rgba(255,90,20,0)'); ctx.fillStyle = mg; ctx.beginPath(); ctx.arc(hx+22,hy+9+open*0.5,16,0,7); ctx.fill(); }
  ctx.fillStyle = scale; ctx.beginPath(); ctx.moveTo(hx-10,hy-10); ctx.lineTo(hx+16,hy-16); ctx.lineTo(hx+40,hy-3); ctx.lineTo(hx+36,hy+5); ctx.lineTo(hx-6,hy+6-open*0.2+2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = horn;
  ctx.beginPath(); ctx.moveTo(hx-6,hy-10); ctx.quadraticCurveTo(hx-30,hy-28,hx-46,hy-16); ctx.lineTo(hx-30,hy-14); ctx.quadraticCurveTo(hx-20,hy-16,hx-2,hy-6); ctx.fill();
  ctx.beginPath(); ctx.moveTo(hx+8,hy-14); ctx.quadraticCurveTo(hx-8,hy-38,hx-26,hy-34); ctx.lineTo(hx-12,hy-26); ctx.quadraticCurveTo(hx-2,hy-24,hx+14,hy-11); ctx.fill();
  if(!e.gjAwake){ ctx.strokeStyle = '#1a0806'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx+8,hy-6); ctx.lineTo(hx+18,hy-5); ctx.stroke(); }
  else { ctx.fillStyle = kneel ? '#8a7a6a' : '#ffd23a'; ctx.beginPath(); ctx.ellipse(hx+13,hy-6,5,2.6,-0.25,0,7); ctx.fill(); }
  if(e.gjAwake){ ctx.fillStyle = '#1a0806'; ctx.beginPath(); ctx.ellipse(hx+14,hy-6,1.6,2.2,0,0,7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,170,70,0.9)'; ctx.beginPath(); ctx.arc(hx+36,hy-1,1.6,0,7); ctx.fill();
  ctx.restore();
  // aura + name
  ctx.save();
  const gl = ctx.createRadialGradient(iso.x, iso.y-70*s-lift, 10, iso.x, iso.y-70*s-lift, 150*s);
  gl.addColorStop(0,'rgba(255,120,40,'+(kneel?0.05:0.14)+')'); gl.addColorStop(1,'rgba(255,120,40,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(iso.x, iso.y-70*s-lift, 150*s, 0, 7); ctx.fill();
  ctx.font = "bold 13px Cinzel, Georgia, serif"; ctx.textAlign = 'center'; ctx.fillStyle = '#ffd08a'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4;
  ctx.fillText('Gojira'+(kneel?' — SPENT':!e.gjAwake?'  z Z z':''), iso.x, iso.y-(150+ (spread>0.3?150:0))*s*0.9-lift-4);
  ctx.restore();
}
function drawGojiraTelegraph(e){
  if(!e.gjAwake || e.gjSlain) return;
  const st = e.gjState;
  ctx.save();
  for(const f of e.gjFires){
    const iso = toIso(f.x,f.y), a = clamp(f.t/1.2,0,1)*(0.6+0.2*Math.sin((e.animT||0)*20+f.x));
    ctx.fillStyle = 'rgba(255,100,30,'+(a*0.5)+')'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y, f.r*ISO_KX*1.4142, f.r*ISO_KY*1.4142, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,150,'+a+')'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  for(const s of e.gjStrikes){
    const fr = clamp(1-s.t/s.max,0,1), iso = toIso(s.x,s.y);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle = 'rgba(255,170,90,'+(0.5+fr*0.5)+')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0,0,GJ_STRIKE_R*ISO_KX*1.4142,0,7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,120,40,'+(0.10+fr*0.3)+')'; ctx.beginPath(); ctx.arc(0,0,GJ_STRIKE_R*ISO_KX*1.4142*fr,0,7); ctx.fill();
    ctx.restore();
  }
  const ring = (x,y,r,frac,inner)=>{
    const iso = toIso(x,y);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle = 'rgba(255,200,120,'+(0.5+frac*0.5)+')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0,0,r*ISO_KX*1.4142,0,7); if(inner){ ctx.moveTo(inner*ISO_KX*1.4142,0); ctx.arc(0,0,inner*ISO_KX*1.4142,0,7); } ctx.stroke();
    ctx.fillStyle = 'rgba(255,110,30,'+(0.08+frac*0.26)+')';
    ctx.beginPath(); ctx.arc(0,0,r*ISO_KX*1.4142*frac,0,7); ctx.fill();
    ctx.restore();
  };
  if(st==='stompTele') ring(e.x, e.y, GJ_STOMP_R, clamp(1-e.gjT/1.1,0,1));
  else if(st==='sweepTele') ring(e.x, e.y, GJ_SWEEP_OUT, clamp(1-e.gjT/1.0,0,1), GJ_SWEEP_IN);
  else if(st==='diveTele' && e.tPt) ring(e.tPt.x, e.tPt.y, GJ_DIVE_R, clamp(1-e.gjT/1.4,0,1));
  else if(st==='chargeTele'){
    const frac = clamp(1-e.gjT/0.95,0,1), ca = Math.cos(e.gjDir), sa = Math.sin(e.gjDir), hw = GJ_CHARGE_W/2;
    const pts = [[0,-hw],[GJ_CHARGE_LEN,-hw],[GJ_CHARGE_LEN,hw],[0,hw]].map(([u,v])=>toIso(e.x+ca*u-sa*v, e.y+sa*u+ca*v));
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<4;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath();
    ctx.fillStyle = 'rgba(255,110,30,'+(0.12+frac*0.3)+')'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,120,'+(0.5+frac*0.5)+')'; ctx.lineWidth = 2; ctx.stroke();
  }
  else if(st==='breathTele' || st==='breath'){
    const a = st==='breath' && e.gjBreathA!=null ? e.gjBreathA : e.gjDir, frac = st==='breath' ? 1 : clamp(1-e.gjT/1.3,0,1);
    const o = toIso(e.x,e.y);
    const p1 = toIso(e.x+Math.cos(a-GJ_BREATH_HALF)*GJ_BREATH_LEN, e.y+Math.sin(a-GJ_BREATH_HALF)*GJ_BREATH_LEN);
    const p2 = toIso(e.x+Math.cos(a+GJ_BREATH_HALF)*GJ_BREATH_LEN, e.y+Math.sin(a+GJ_BREATH_HALF)*GJ_BREATH_LEN);
    const g2 = ctx.createLinearGradient(o.x, o.y, (p1.x+p2.x)/2, (p1.y+p2.y)/2);
    g2.addColorStop(0, st==='breath' ? 'rgba(255,230,140,0.75)' : 'rgba(255,190,90,'+(0.15+frac*0.25)+')');
    g2.addColorStop(1, st==='breath' ? 'rgba(255,90,20,0.25)' : 'rgba(255,110,30,'+(0.05+frac*0.12)+')');
    ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.closePath();
    ctx.fillStyle = g2; ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,120,'+(0.4+frac*0.5)+')'; ctx.lineWidth = 1.8; ctx.stroke();
  }
  ctx.restore();
}
function drawObsidianRuneIso(R, open, taken, clock){
  const iso = toIso(R.x, R.y), t = clock||0;
  drawShadow(iso.x, iso.y, 41, 14);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(0.9,0.9);
  // base ring
  ctx.strokeStyle = open ? 'rgba(255,220,120,0.7)' : 'rgba(255,70,40,0.65)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0,0,58,22,0,0,7); ctx.stroke();
  // slab (a tall obsidian shard)
  const hgt = 86;
  ctx.fillStyle = '#120a14'; ctx.strokeStyle = '#3a2440'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(-18,-hgt+10); ctx.lineTo(0,-hgt-8); ctx.lineTo(20,-hgt+8); ctx.lineTo(28,0); ctx.lineTo(0,10); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#241530'; ctx.beginPath(); ctx.moveTo(0,10); ctx.lineTo(28,0); ctx.lineTo(20,-hgt+8); ctx.lineTo(4,-hgt*0.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(-18,-hgt+10); ctx.lineTo(0,-hgt-8); ctx.lineTo(-6,-hgt*0.5); ctx.closePath(); ctx.fill();
  const glow = taken ? 0.15 : 0.55+0.35*Math.sin(t*2.4), col = open ? '255,210,100' : '255,80,40';
  ctx.strokeStyle = 'rgba('+col+','+glow+')'; ctx.lineWidth = 3; ctx.shadowColor = 'rgba('+col+',0.9)'; ctx.shadowBlur = taken ? 2 : 12;
  ctx.beginPath(); ctx.moveTo(-6,-52); ctx.lineTo(4,-58); ctx.lineTo(4,-40); ctx.lineTo(-6,-34); ctx.moveTo(-8,-64); ctx.lineTo(8,-72); ctx.moveTo(-2,-28); ctx.lineTo(8,-24); ctx.stroke();
  ctx.restore();
}

