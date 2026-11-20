// ---------------- v570: the Hell Bovine ----------------
// A huge infernal bull: three times a normal monster's life, always drops a rare. Drawn procedurally for now
// (drawHellBovineIso) -- when the bull sprite arrives it can replace that one function.
// Three attacks, each with a readable wind-up:
//   Charge  -- paws the ground (lane locked at the start), then thunders forward; on impact you are thrown into the air
//              (p.launchT: you fly back, land, and cannot act while airborne).
//   Stomp   -- rears up on its hind legs, front hooves high, then slams down: a ring of damage around it and a short stun.
//   Hellfire Gore -- lowers its burning horns and sweeps them through a wide cone in front of it; sets you on fire.
const HB_LIFE_MULT = 3, HB_DMG_MULT = 1.35;
const HB_CHARGE_WIND = 0.85, HB_CHARGE_DUR = 0.9, HB_CHARGE_SPD = 3.6, HB_CHARGE_CD = 7, HB_CHARGE_RANGE = 420;
const HB_STOMP_WIND = 0.95, HB_STOMP_R = 125, HB_STOMP_CD = 6.5, HB_STOMP_STUN = 0.6;
const HB_GORE_WIND = 0.65, HB_GORE_R = 120, HB_GORE_ARC = 1.1, HB_GORE_CD = 4.2;
const HB_LAUNCH_T = 0.75, HB_LAUNCH_H = 70, HB_LAUNCH_PUSH = 170;
function hellBovineStats(x, y, depth){
  const L = 55+7*depth, D = 13+2.2*depth;   // the old 'standard monster' (spawnEnemy rescales by area level)
  return {type:'hellbovine', x, y, r:27, hp:L*HB_LIFE_MULT, maxHp:L*HB_LIFE_MULT, speed:rand(92,102), dmg:D*HB_DMG_MULT, atkCd:1, atkCdMax:1.3,
    color:'#7a1a10', state:'chase', hitT:0, armor:14, hellBovine:true, heavy:true,
    hbState:'idle', hbT:0, hbChargeCd:rand(1.5,3), hbStompCd:rand(3,5), hbGoreCd:rand(1,2.5)};
}
function hbFace(e, ang){ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); }
function launchPlayer(g, ang){
  const p = g.player; if(!p || p.dodging) return;
  playerKnock(p, ang, HB_LAUNCH_PUSH);
  p.launchT = HB_LAUNCH_T; p.movementStopT = Math.max(p.movementStopT||0, HB_LAUNCH_T);
}
function playerLaunchTick(g, dt){ const p = g.player; if(p && p.launchT>0){ p.launchT -= dt; p.movementStopT = Math.max(p.movementStopT||0, 0.05); if(p.launchT<=0){ p.launchT = 0; shakeScreen(g, 3, 0.15); } } }
function playerLaunchZ(p){ return p && p.launchT>0 ? Math.sin((1 - p.launchT/HB_LAUNCH_T)*Math.PI)*HB_LAUNCH_H : 0; }
function updateHellBovine(g, e, dt, target, d, isF, chillMult, room){
  const p = g.player, reach = e.r+target.r+8;
  updateStuckTracking(e, dt);
  e.hbChargeCd -= dt; e.hbStompCd -= dt; e.hbGoreCd -= dt;
  const st = e.hbState;
  if(st==='chargeWind'){
    e.hbT -= dt; e.moving = false;
    if(e.hbT<=0){ e.hbState = 'charge'; e.hbT = HB_CHARGE_DUR; e.hbHit = false; try{ sfxPlay('enemyHeavy', 0.8); }catch(err){} }
    return;
  }
  if(st==='charge'){
    e.hbT -= dt; e.moving = true;
    const sp = e.speed*HB_CHARGE_SPD*chillMult;
    e.x += Math.cos(e.hbDir)*sp*dt; e.y += Math.sin(e.hbDir)*sp*dt;
    if(Math.random()<dt*14) g.particles.push({type:'burst', x:e.x-Math.cos(e.hbDir)*e.r, y:e.y-Math.sin(e.hbDir)*e.r, t:0.35, max:0.35, color:'#ff6a2a'});
    if(!e.hbHit && dist(e, target) < e.r+target.r+10){
      e.hbHit = true;
      const dm = teleDmg(e, 1.5);
      if(isF) applyFollowerDamage(g, target, dm, e);
      else { playerDamage(g, dm, e); launchPlayer(g, e.hbDir); }
      g.particles.push({type:'burst', x:target.x, y:target.y, t:0.4, max:0.4, color:'#ffb060'});
      shakeScreen(g, 6, 0.25);
      e.hbT = Math.min(e.hbT, 0.12);
    }
    if(e.hbT<=0 || (e.stuckT||0) > 0.3){ e.hbState = 'recover'; e.hbT = 0.7; e.atkCd = e.atkCdMax; }
    return;
  }
  if(st==='stompWind'){
    e.hbT -= dt; e.moving = false;
    if(e.hbT<=0){
      if(dist(e, p) < HB_STOMP_R + p.r){ playerDamage(g, teleDmg(e, 1.3), e); if(!p.dodging) p.stunT = Math.max(p.stunT||0, HB_STOMP_STUN), p.movementStopT = Math.max(p.movementStopT||0, HB_STOMP_STUN); }
      if(g.followers) for(const f of g.followers) if(dist(e, f) < HB_STOMP_R + f.r) applyFollowerDamage(g, f, e.dmg*1.3, e);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:HB_STOMP_R, color:'#ff8a3a'});
      for(let i=0;i<8;i++){ const a = i/8*6.283; g.particles.push({type:'burst', x:e.x+Math.cos(a)*HB_STOMP_R*0.7, y:e.y+Math.sin(a)*HB_STOMP_R*0.7, t:0.4, max:0.4, color:'#c85a2a'}); }
      shakeScreen(g, 8, 0.3);
      e.hbState = 'recover'; e.hbT = 0.6; e.atkCd = e.atkCdMax*0.8;
    }
    return;
  }
  if(st==='goreWind'){
    e.hbT -= dt; e.moving = false;
    if(e.hbT<=0){
      const hitIn = (o)=>{ const dd = dist(e, o); if(dd > HB_GORE_R + o.r) return false; let df = Math.abs(Math.atan2(o.y-e.y, o.x-e.x) - e.hbDir); if(df>Math.PI) df = 2*Math.PI-df; return df < HB_GORE_ARC; };
      if(hitIn(p)){ playerDamage(g, teleDmg(e, 1.15), e); if(!p.dodging && !(p.immolateT>0)){ p.burnT = Math.max(p.burnT||0, 3); p.burnDps = Math.max(p.burnDps||0, e.dmg*0.12); } }
      if(g.followers) for(const f of g.followers) if(hitIn(f)) applyFollowerDamage(g, f, e.dmg*1.15, e);
      g.particles.push({type:'wave', x:e.x, y:e.y, ang:e.hbDir, arc:HB_GORE_ARC, reach:HB_GORE_R, t:0.3, max:0.3, c1:'255,90,30', c2:'255,200,120'});
      e.hbState = 'recover'; e.hbT = 0.45; e.atkCd = e.atkCdMax*0.6;
    }
    return;
  }
  if(st==='recover'){ e.hbT -= dt; e.moving = false; if(e.hbT<=0) e.hbState = 'idle'; return; }
  // idle / chase: pick an attack
  const ang = Math.atan2(target.y-e.y, target.x-e.x);
  if(e.hbChargeCd<=0 && d > 170 && d < HB_CHARGE_RANGE && enemyLOS(g, e, target)){
    e.hbState = 'chargeWind'; e.hbT = HB_CHARGE_WIND; e.hbMax = HB_CHARGE_WIND; e.hbDir = ang; hbFace(e, ang); e.hbChargeCd = HB_CHARGE_CD; return;
  }
  if(e.hbStompCd<=0 && d < HB_STOMP_R*0.85){
    e.hbState = 'stompWind'; e.hbT = HB_STOMP_WIND; e.hbMax = HB_STOMP_WIND; hbFace(e, ang); e.hbStompCd = HB_STOMP_CD; return;
  }
  if(e.hbGoreCd<=0 && d < reach+30){
    e.hbState = 'goreWind'; e.hbT = HB_GORE_WIND; e.hbMax = HB_GORE_WIND; e.hbDir = ang; hbFace(e, ang); e.hbGoreCd = HB_GORE_CD; return;
  }
  if(d > reach){
    const a2 = steerAngleTo(e, target.x, target.y, room.obstacles);
    e.x += Math.cos(a2)*e.speed*chillMult*dt; e.y += Math.sin(a2)*e.speed*chillMult*dt; e.moving = true; hbFace(e, a2);
  } else e.moving = false;
}
function hellBovineDeath(g, e){
  const p = g.player; if(!p) return;
  const it = generateItem(Math.max(p.level||1, e.ml||1), 'rare', null, null, p);
  if(it) g.loot.push({type:'item', x:e.x+rand(-14,14), y:e.y+rand(-14,14), r:8, item:it});
}
// one Hell Bovine on a spot clear of walls (used by the zones that host it)
function spawnHellBovine(g, pos){
  const e = spawnEnemy(g, 'hellbovine', pos);
  if(e){ e.aggroRange = 360; e.leashRange = 900; e.wanderRadius = 60; }
  return e;
}
function drawHellBovineTelegraph(e){
  const flat = (x, y, R, frac, col, full)=>{ const q = toIso(x, y); ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle = 'rgba('+col+','+(0.5+0.5*frac)+')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, R*ISO_KX*Math.SQRT2, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba('+col+','+(0.1+0.25*frac)+')'; ctx.beginPath(); ctx.arc(0, 0, R*ISO_KX*Math.SQRT2*(full?1:frac), 0, 7); ctx.fill(); ctx.restore(); };
  const k = e.hbMax>0 ? clamp(1 - e.hbT/e.hbMax, 0, 1) : 0;
  if(e.hbState==='stompWind') flat(e.x, e.y, HB_STOMP_R, k, '255,120,50');
  else if(e.hbState==='chargeWind'){   // the locked lane
    const a = toIso(e.x, e.y), b = toIso(e.x+Math.cos(e.hbDir)*HB_CHARGE_RANGE, e.y+Math.sin(e.hbDir)*HB_CHARGE_RANGE);
    ctx.save(); ctx.strokeStyle = 'rgba(255,110,40,'+(0.25+0.45*k)+')'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
  } else if(e.hbState==='goreWind'){
    const q = toIso(e.x, e.y); ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, ISO_KY/ISO_KX);
    const ia = Math.atan2(Math.sin(e.hbDir)+Math.cos(e.hbDir), Math.cos(e.hbDir)-Math.sin(e.hbDir));   // the facing in the flattened ground plane
    const R = HB_GORE_R*ISO_KX*Math.SQRT2;
    ctx.fillStyle = 'rgba(255,90,30,'+(0.12+0.25*k)+')'; ctx.strokeStyle = 'rgba(255,140,60,'+(0.5+0.4*k)+')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0, 0, R, ia-HB_GORE_ARC, ia+HB_GORE_ARC); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
function drawHellBovineIso(e){
  const iso = toIso(e.x, e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/27;
  const F = c=>flash ? '#fff' : c;
  const st = e.hbState, k = e.hbMax>0 ? clamp(1 - e.hbT/e.hbMax, 0, 1) : 0;
  const rear = st==='stompWind' ? Math.sin(Math.min(1, k*1.25)*Math.PI*0.5) : 0;   // front legs up, then down
  const lower = st==='goreWind' ? k : st==='chargeWind' ? 0.5 : st==='charge' ? 0.7 : 0;
  const paw = st==='chargeWind' ? Math.sin(t*22)*4 : 0;
  const gait = e.moving ? Math.sin(t*(st==='charge' ? 20 : 9)) : 0;
  drawHellBovineTelegraph(e);
  drawShadow(iso.x, iso.y, 40*s, 13*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  // rear on the hind legs: pivot the body round the back hooves
  ctx.translate(-20, 0); ctx.rotate(-rear*0.55); ctx.translate(20, 0);
  const body = ctx.createLinearGradient(0,-60,0,-18); body.addColorStop(0, F('#7a2014')); body.addColorStop(1, F('#2a0a06'));
  // legs
  ctx.strokeStyle = F('#1e0806'); ctx.lineCap = 'round';
  for(const [lx, ph, front] of [[-22,1,0],[-12,-1,0],[14,1,1],[24,-1,1]]){
    ctx.lineWidth = 7.5;
    const lift = front ? rear*16 : 0, sw = gait*ph*6 + (front && st==='chargeWind' && ph>0 ? paw : 0);
    ctx.beginPath(); ctx.moveTo(lx, -30); ctx.lineTo(lx+sw*0.6, -15-lift*0.5); ctx.lineTo(lx+sw, -2-lift); ctx.stroke();
    ctx.fillStyle = F('#0a0404'); ctx.beginPath(); ctx.ellipse(lx+sw+1, -1-lift, 4.6, 2.6, 0, 0, 7); ctx.fill();
  }
  // body: deep chest, hump of muscle over the shoulders
  ctx.fillStyle = body; ctx.strokeStyle = F('#120403'); ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-30,-34); ctx.quadraticCurveTo(-34,-52,-18,-56); ctx.quadraticCurveTo(4,-60,14,-70); ctx.quadraticCurveTo(30,-66,32,-46); ctx.quadraticCurveTo(30,-30,18,-26); ctx.lineTo(-24,-26); ctx.closePath(); ctx.fill(); ctx.stroke();
  // glowing cracks in the hide
  ctx.strokeStyle = 'rgba(255,'+(110+Math.round(40*Math.sin(t*5)))+',30,0.85)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-20,-46); ctx.lineTo(-12,-40); ctx.lineTo(-4,-48); ctx.moveTo(6,-58); ctx.lineTo(12,-50); ctx.lineTo(20,-56); ctx.moveTo(-26,-34); ctx.lineTo(-18,-31); ctx.stroke();
  // tail with a burning tuft
  ctx.strokeStyle = F('#2a0a06'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-30,-44); ctx.quadraticCurveTo(-40,-40+Math.sin(t*4)*4,-38,-28); ctx.stroke();
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.arc(-38,-27,2.6,0,7); ctx.fill();
  // head (lowered for the gore and the charge)
  ctx.save(); ctx.translate(28, -54); ctx.rotate(lower*0.55);
  ctx.fillStyle = F('#4a120c'); ctx.strokeStyle = F('#120403'); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-4,-8); ctx.quadraticCurveTo(10,-12,18,-2); ctx.quadraticCurveTo(22,8,16,14); ctx.quadraticCurveTo(6,16,0,10); ctx.quadraticCurveTo(-6,2,-4,-8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = F('#2a0806'); ctx.beginPath(); ctx.ellipse(17,10,5,3.6,0.3,0,7); ctx.fill();   // muzzle
  ctx.fillStyle = '#d8b04a'; ctx.beginPath(); ctx.arc(15,12,1.4,0,7); ctx.fill();                // nose ring
  ctx.fillStyle = 'rgba(255,200,60,0.95)'; ctx.beginPath(); ctx.arc(9,-2,1.9,0,7); ctx.fill(); // burning eye
  // horns: long, curving forward, tips glowing
  for(const [hx, hy, dir] of [[2,-9,1],[-2,-7,-1]]){
    ctx.strokeStyle = F('#e8d8b0'); ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx-6+dir, hy-16, hx+12, hy-22); ctx.stroke();
    ctx.fillStyle = st==='goreWind' ? '#ffb040' : '#ff6a2a'; ctx.beginPath(); ctx.arc(hx+12, hy-22, 2.2, 0, 7); ctx.fill();
  }
  if(st==='goreWind' || st==='charge'){ ctx.globalAlpha = 0.6; ctx.fillStyle = '#ff7a2a'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(10+i*4, -26-Math.random()*6, 2, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
  ctx.restore();
  ctx.restore();
  drawHpBar(iso, 82*s, e.r*1.6, e.hp, e.maxHp);
  ctx.save(); ctx.font = 'bold 11px Alegreya,Georgia,serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ff9a5a'; ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4;
  ctx.fillText('Hell Bovine', iso.x, iso.y-82*s-10); ctx.restore();
}
