// ---------------- Raptor Lair (v154) ----------------
// Redridge Canyon's dungeon. Floor 1: a raptor-only maze. Floor 2: the Flame Raptor's arena.
// Flame Raptor (fire damage) -- unique fight:
//   * Blaze Rush   -- telegraphed lane dash that leaves an burning trail on the ground (stay off it).
//   * Chain Pounce -- three telegraphed leaps in a row, each landing where you were standing.
//   * Inferno Nova -- it slowly builds Charge; at full charge it roars and detonates. The blast only hits
//                     anyone it has a line of sight to: break the line behind one of the four obsidian pillars.
//   * Firestorm  -- at 66% and 33% HP: summons raptors and calls telegraphed meteors for a while.
//   * Below 30% HP it enrages (faster moves, shorter cooldowns). Immune to crowd control.
const LR_RUSH_TELE = 0.85, LR_RUSH_LEN = 560, LR_RUSH_W = 70, LR_RUSH_SPEED = 1100, LR_RUSH_DMG = 1.5, LR_RUSH_REC = 1.1;
const LR_POUNCE_TELE = 0.5, LR_POUNCE_AIR = 0.28, LR_POUNCE_R = 78, LR_POUNCE_DMG = 1.2, LR_POUNCE_N = 3;
const LR_NOVA_TELE = 2.0, LR_NOVA_R = 640, LR_NOVA_DMG = 2.0, LR_CHARGE_TIME = 16;
const LR_STORM_DUR = 8, LR_STRIKE_R = 54, LR_STRIKE_DMG = 1.1, LR_TRAIL_DPS = 0.35, LR_MAX_ADDS = 6;
function initLightningRaptor(e){
  e.lr = true; e.lrAwake = false; e.lrState = 'chase'; e.lrT = 0; e.lrCd = 2.0; e.lrNext = 0; e.lrCharge = 0;
  e.lrDir = 0; e.lrHitP = false; e.lrHitF = []; e.lrPn = 0; e.lrPhase = 0; e.lrStormT = 0; e.lrStrikeCd = 0;
  e.lrTrails = []; e.lrStrikes = []; e.lrTravel = 0;
}
function lrHit(g, e, target, mult, kb){
  const dmg = teleDmg(e, mult);
  if(target===g.player) playerDamage(g, dmg, e, kb); else applyFollowerDamage(g, target, dmg, e);
}
function updateLightningRaptor(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player;
  const face = (ang)=>{ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  e.moving = false;
  if(!e.lrAwake){
    if(d < 720 || e.hp < e.maxHp){ e.lrAwake = true; showMsg('The Flame Raptor screeches!', 2.2, '#ffb060'); shakeScreen(g, 6, 0.4); }
    else return;
  }
  const frac = e.hp/e.maxHp, enr = frac < 0.3;
  const spd = e.speed*(enr?1.25:1)*chillMult;
  // ground hazards: burning trail + telegraphed strikes tick regardless of what it is doing
  for(let i=e.lrTrails.length-1;i>=0;i--){
    const tr = e.lrTrails[i]; tr.t -= dt; tr.tick -= dt;
    if(tr.tick<=0){
      tr.tick = 0.5;
      if(dist(p,tr) < tr.r+p.r) playerDamage(g, e.dmg*LR_TRAIL_DPS, e);
      if(g.followers) for(const f of g.followers) if(dist(f,tr) < tr.r+f.r) applyFollowerDamage(g, f, e.dmg*LR_TRAIL_DPS, e);
    }
    if(tr.t<=0) e.lrTrails.splice(i,1);
  }
  for(let i=e.lrStrikes.length-1;i>=0;i--){
    const s = e.lrStrikes[i]; s.t -= dt;
    if(s.t<=0){
      if(dist(p,s) < LR_STRIKE_R+p.r) lrHit(g, e, p, LR_STRIKE_DMG);
      if(g.followers) for(const f of g.followers) if(dist(f,s) < LR_STRIKE_R+f.r) lrHit(g, e, f, LR_STRIKE_DMG);
      g.particles.push({type:'burst', x:s.x, y:s.y, t:0.35, max:0.35, color:'#ffd08a'});
      g.particles.push({type:'ring', x:s.x, y:s.y, t:0.4, max:0.4, r:LR_STRIKE_R, color:'#ff8a3a'});
      shakeScreen(g, 2, 0.1);
      e.lrStrikes.splice(i,1);
    }
  }
  if(e.lrStormT>0){
    e.lrStormT -= dt; e.lrStrikeCd -= dt;
    if(e.lrStrikeCd<=0){
      e.lrStrikeCd = enr ? 0.4 : 0.55;
      const a = Math.random()*Math.PI*2, rr = Math.random()<0.4 ? 0 : rand(40,190);
      e.lrStrikes.push({x:clamp(p.x+Math.cos(a)*rr,60,room.w-60), y:clamp(p.y+Math.sin(a)*rr,60,room.h-60), t:0.95, max:0.95});
    }
  }
  const st = e.lrState;
  if(st==='chase'){
    e.lrCd -= dt;
    e.lrCharge = Math.min(1, e.lrCharge + dt/(LR_CHARGE_TIME*(enr?0.7:1)));
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+2, dt)) return;
    if((e.lrPhase<1 && frac<0.66) || (e.lrPhase<2 && frac<0.33)){
      e.lrState='stormTele'; e.lrT=1.1; e.windT=0; e.lrPhase++; e.tState='tele';
      showMsg('Meteors rain down on the arena!', 2.0, '#ffb060');
      return;
    }
    if(e.lrCharge>=1 && d<900){
      e.lrState='novaTele'; e.lrT=LR_NOVA_TELE; e.windT=0;
      showMsg('INFERNO NOVA — break line of sight behind a pillar!', 2.2, '#ffe680');
      return;
    }
    if(e.lrCd<=0 && d<700){
      e.windT=0;
      if(e.lrNext===0){ e.lrState='rushTele'; e.lrT=LR_RUSH_TELE*(enr?0.8:1); e.lrDir=Math.atan2(target.y-e.y,target.x-e.x); face(e.lrDir); e.tState='tele'; }
      else { e.lrState='pounceTele'; e.lrPn=LR_POUNCE_N; e.lrT=LR_POUNCE_TELE*(enr?0.8:1); e.tPt={x:target.x,y:target.y}; e.tState='tele'; }
      e.lrNext = 1-e.lrNext;
      return;
    }
    if(d > e.r+target.r+2){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*spd*dt; e.y += Math.sin(ang)*spd*dt; e.moving = true; face(ang);
    } else if(e.atkCd<=0){ beginEnemyMelee(e); }
  } else if(st==='rushTele'){
    e.lrT -= dt; e.atkAnimT = 0.1;
    if(e.lrT<=0){ e.lrState='rush'; e.lrT = LR_RUSH_LEN/LR_RUSH_SPEED; e.lrHitP=false; e.lrHitF=[]; e.lrTravel=0; e.tState='idle'; }
  } else if(st==='rush'){
    e.lrT -= dt; e.moving = true;
    const px=e.x, py=e.y;
    e.x += Math.cos(e.lrDir)*LR_RUSH_SPEED*dt; e.y += Math.sin(e.lrDir)*LR_RUSH_SPEED*dt;
    pushOutOfObstacles(e, room.obstacles);
    const moved = Math.hypot(e.x-px, e.y-py), blocked = moved < LR_RUSH_SPEED*dt*0.5;
    e.lrTravel += moved;
    if(e.lrTravel > 45){ e.lrTravel = 0; e.lrTrails.push({x:e.x, y:e.y, r:34, t:3.5, tick:0.15}); }
    g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:'#ffb060'});
    const kb = {x:Math.cos(e.lrDir)*70, y:Math.sin(e.lrDir)*70};
    if(!e.lrHitP && dist(e,p) < e.r+p.r+12){ e.lrHitP = true; lrHit(g, e, p, LR_RUSH_DMG, kb); }
    if(g.followers) for(const f of g.followers) if(e.lrHitF.indexOf(f)<0 && dist(e,f) < e.r+f.r+12){ e.lrHitF.push(f); lrHit(g, e, f, LR_RUSH_DMG); }
    if(e.lrT<=0 || blocked){ e.lrState='recover'; e.lrT=LR_RUSH_REC; g.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:90, color:'#ffb060'}); }
  } else if(st==='pounceTele'){
    e.lrT -= dt; e.atkAnimT = 0.1;
    if(e.lrT<=0){ e.lrState='pounceAir'; e.lrT=LR_POUNCE_AIR; e.tFrom={x:e.x,y:e.y}; e.tState='air'; face(Math.atan2(e.tPt.y-e.y,e.tPt.x-e.x)); }
  } else if(st==='pounceAir'){
    e.lrT -= dt;
    const k = 1-clamp(e.lrT/LR_POUNCE_AIR,0,1);
    e.x = e.tFrom.x+(e.tPt.x-e.tFrom.x)*k; e.y = e.tFrom.y+(e.tPt.y-e.tFrom.y)*k;
    e.hop = Math.sin(k*Math.PI)*70; e.moving = true;
    if(e.lrT<=0){
      e.hop = 0; e.lrPn--;
      if(dist(p,e) < LR_POUNCE_R+p.r) lrHit(g, e, p, LR_POUNCE_DMG);
      if(g.followers) for(const f of g.followers) if(dist(f,e) < LR_POUNCE_R+f.r) lrHit(g, e, f, LR_POUNCE_DMG);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:LR_POUNCE_R, color:'#ffb060'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#ffe2a0'});
      shakeScreen(g, 3, 0.12);
      if(e.lrPn>0){ e.lrState='pounceTele'; e.lrT=LR_POUNCE_TELE*(enr?0.7:0.85); e.tPt={x:target.x,y:target.y}; e.tState='tele'; }
      else { e.lrState='recover'; e.lrT=0.9; e.tState='idle'; }
    }
  } else if(st==='novaTele'){
    e.lrT -= dt; e.atkAnimT = 0.1; e.tState='tele';
    if(Math.random()<0.5) g.particles.push({type:'burst', x:e.x+rand(-30,30), y:e.y+rand(-30,30), t:0.25, max:0.25, color:'#ffd08a'});
    if(e.lrT<=0){
      e.tState='idle';
      const dm = LR_NOVA_DMG;
      if(dist(e,p) < LR_NOVA_R && hasLOS(g,e,p)) lrHit(g, e, p, dm);
      else showMsg('You break the line of sight!', 1.2, '#ffb060');
      if(g.followers) for(const f of g.followers) if(dist(e,f) < LR_NOVA_R && hasLOS(g,e,f)) lrHit(g, e, f, dm);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:LR_NOVA_R, color:'#ffd08a'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.5, max:0.5, color:'#ffffff'});
      shakeScreen(g, 9, 0.35);
      e.lrCharge = 0; e.lrState='recover'; e.lrT=1.8;
    }
  } else if(st==='stormTele'){
    e.lrT -= dt; e.atkAnimT = 0.1;
    if(e.lrT<=0){
      e.tState='idle';
      const alive = g.enemies.filter(x=>x.lrAdd && x.hp>0).length;
      for(let i=0;i<3 && alive+i<LR_MAX_ADDS;i++){
        const a = Math.random()*Math.PI*2;
        const r2 = spawnEnemy(g, 'raptor', {x:clamp(e.x+Math.cos(a)*120,60,room.w-60), y:clamp(e.y+Math.sin(a)*120,60,room.h-60)});
        if(r2){ r2.lrAdd = true; r2.engaged = true; r2.aggroed = true; r2.dmgType='normal'; r2.dmgSplit='fire'; r2.fireRaptor=true; }
      }
      e.lrStormT = LR_STORM_DUR; e.lrStrikeCd = 0.3;
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:200, color:'#ffb060'});
      e.lrState='recover'; e.lrT=0.6;
    }
  } else { // recover (vulnerable)
    e.lrT -= dt; e.lrCharge = Math.min(1, e.lrCharge + dt/(LR_CHARGE_TIME*(enr?0.7:1)));
    if(e.lrT<=0){ e.lrState='chase'; e.lrCd = enr ? 1.6 : 2.6; }
  }
  e.x = clamp(e.x, e.r, room.w-e.r); e.y = clamp(e.y, e.r, room.h-e.r);
}
function drawLightningRaptorIso(e){
  drawRaptorIso(e, {skin:'#c4501e', dark:'#5a1a08', belly:'#ffd48a', eyeA:'#ffe', eyeB:'#fc6'});
  const iso = toIso(e.x,e.y), t = e.animT||0, s = e.r/14;
  const ch = e.lrAwake ? (e.lrCharge||0) : 0.2;
  ctx.save();
  const gl = ctx.createRadialGradient(iso.x, iso.y-26*s, 4, iso.x, iso.y-26*s, 40*s);
  gl.addColorStop(0,'rgba(255,150,60,'+(0.18+ch*0.32)+')'); gl.addColorStop(1,'rgba(255,150,60,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(iso.x, iso.y-26*s, 40*s, 0, 7); ctx.fill();
  const seed = Math.floor(t*14), n = 2 + Math.floor(ch*6);
  ctx.strokeStyle='rgba(255,220,150,0.9)'; ctx.lineWidth=1.4; ctx.lineJoin='round';
  for(let i=0;i<n;i++){
    let a = ((seed*13+i*57)%360)*Math.PI/180, x = iso.x+Math.cos(a)*10*s, y = iso.y-24*s+Math.sin(a)*8*s;
    ctx.beginPath(); ctx.moveTo(x,y);
    for(let k=0;k<4;k++){ a += ((seed*7+i*31+k*17)%9-4)*0.35; x += Math.cos(a)*9*s; y += Math.sin(a)*7*s; ctx.lineTo(x,y); }
    ctx.stroke();
  }
  ctx.font="bold 11px Alegreya,Georgia, serif"; ctx.textAlign='center'; ctx.fillStyle='#ffd08a'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
  ctx.fillText('Flame Raptor', iso.x, iso.y-50*s-8);
  ctx.restore();
}
function drawLightningRaptorTelegraph(e){
  if(!e.lrAwake) return;
  ctx.save();
  const st = e.lrState;
  // burning ground trail
  for(const tr of e.lrTrails){
    const iso = toIso(tr.x,tr.y), a = clamp(tr.t/1.2,0,1)*(0.55+0.2*Math.sin((e.animT||0)*30+tr.x));
    ctx.fillStyle='rgba(255,110,30,'+(a*0.55)+')';
    ctx.beginPath(); ctx.ellipse(iso.x, iso.y, tr.r*ISO_KX, tr.r*ISO_KY, 0, 0, 7); ctx.fill();
    ctx.strokeStyle='rgba(255,230,180,'+a+')'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(iso.x-tr.r*0.6,iso.y); ctx.lineTo(iso.x-tr.r*0.2,iso.y-4); ctx.lineTo(iso.x+tr.r*0.1,iso.y+3); ctx.lineTo(iso.x+tr.r*0.6,iso.y-2); ctx.stroke();
  }
  // incoming meteors
  for(const s of e.lrStrikes){
    const f = clamp(1-s.t/s.max,0,1), iso = toIso(s.x,s.y);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,170,90,'+(0.5+f*0.5)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,LR_STRIKE_R*ISO_KX,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,130,50,'+(0.10+f*0.3)+')'; ctx.beginPath(); ctx.arc(0,0,LR_STRIKE_R*ISO_KX*f,0,7); ctx.fill();
    ctx.restore();
  }
  if(st==='rushTele'){
    const frac = clamp(1-e.lrT/LR_RUSH_TELE,0,1), ca=Math.cos(e.lrDir), sa=Math.sin(e.lrDir), hw=LR_RUSH_W/2;
    const pts=[[0,-hw],[LR_RUSH_LEN,-hw],[LR_RUSH_LEN,hw],[0,hw]].map(([u,v])=>toIso(e.x+ca*u-sa*v, e.y+sa*u+ca*v));
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<4;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath();
    ctx.fillStyle='rgba(255,110,30,'+(0.12+frac*0.3)+')'; ctx.fill();
    ctx.strokeStyle='rgba(255,200,120,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2; ctx.stroke();
  } else if(st==='pounceTele' && e.tPt){
    const frac = clamp(1-e.lrT/LR_POUNCE_TELE,0,1), iso = toIso(e.tPt.x,e.tPt.y);
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,200,120,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,LR_POUNCE_R*ISO_KX,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,110,30,'+(0.10+frac*0.28)+')'; ctx.beginPath(); ctx.arc(0,0,LR_POUNCE_R*ISO_KX*frac,0,7); ctx.fill();
  } else if(st==='novaTele'){
    const frac = clamp(1-e.lrT/LR_NOVA_TELE,0,1), iso = toIso(e.x,e.y);
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,240,150,'+(0.35+frac*0.6)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,LR_NOVA_R*ISO_KX,0,7); ctx.stroke();
    ctx.strokeStyle='rgba(255,160,70,'+(0.3+frac*0.6)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,LR_NOVA_R*ISO_KX*frac,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,140,60,'+(0.04+frac*0.12)+')'; ctx.beginPath(); ctx.arc(0,0,LR_NOVA_R*ISO_KX*frac,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawLightningRodIso(rod, boss, clock){
  const iso = toIso(rod.x, rod.y);
  const charged = boss && boss.lr && boss.hp>0 ? (boss.lrState==='novaTele' ? 1 : boss.lrCharge||0) : 0;
  drawBlock({x:rod.x-32,y:rod.y-32,w:64,h:64}, 84, '#5e4a42', '#2a1c18', '#40302a');
  const top = toIso(rod.x, rod.y);
  ctx.save();
  ctx.strokeStyle='#8a6a5a'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(top.x, top.y-84); ctx.lineTo(top.x, top.y-124); ctx.stroke();
  const pulse = 0.5+0.5*Math.sin(clock*(4+charged*10));
  const gl = ctx.createRadialGradient(top.x, top.y-128, 1, top.x, top.y-128, 16+charged*14);
  gl.addColorStop(0,'rgba(255,230,180,'+(0.6+charged*0.4)+')'); gl.addColorStop(1,'rgba(255,110,30,0)');
  ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(top.x, top.y-128, 16+charged*14+pulse*3, 0, 7); ctx.fill();
  ctx.fillStyle='#ffe2a0'; ctx.beginPath(); ctx.arc(top.x, top.y-128, 4, 0, 7); ctx.fill();
  ctx.restore();
}

