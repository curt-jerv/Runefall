// ---------------- v550: Thornbacks, Hookbeaks and the Exiled Plague Doctor ----------------
// Thornback: a wolf-sized, heavily quilled rodent. Keeps a little distance and shoots a fan of quills; up close it whips
//   its tail round in a circle. Its quills prick anyone who hits it in melee (e.thorns, see meleeThorns).
// Hookbeak: a big flightless hunting bird in packs of 3-6. Little life; pecks fast, and every few seconds winds up a heavy
//   kick that knocks you backwards (a short slide, stopped by walls -- playerKnockTick).
// Exiled Plague Doctor: an elite loner near the Cursed Cemetery side of the Withered Crossroads. Keeps his distance, lobs
//   poison bombs (a ring on the ground, then a lingering cloud) and throws a fan of three poison knives. Three bats burst
//   out where he falls. Once per visit.
const THORN_QUILL_CD = 2.6, THORN_WHIP_R = 88, THORN_WHIP_WIND = 0.45, THORN_WHIP_CD = 2.8, THORN_REFLECT = 0.35;
const HOOK_KICK_CD = 4.2, HOOK_KICK_WIND = 0.38, HOOK_KICK_PUSH = 120;
const PDOC_CD = 2.3, PDOC_BOMB_R = 78, PDOC_BOMB_T = 0.9, PDOC_CLOUD_T = 3, PDOC_PREFER = 230;
function wildlifeStats(type, x, y, depth){
  const L = 55+7*depth, D = 13+2.2*depth;   // the old 'standard monster' -- spawnEnemy rescales from it by area level
  if(type==='thornback') return {type,x,y,r:16,hp:L*1.15,maxHp:L*1.15,speed:rand(88,100),dmg:D*0.8,atkCd:rand(0.5,2),atkCdMax:1.1,color:'#7a6248',state:'chase',hitT:0,armor:6,
    thorns:THORN_REFLECT, quillCd:rand(0.6,2.2), whipCd:0, whipT:0};
  if(type==='hookbeak') return {type,x,y,r:15,hp:L*0.5,maxHp:L*0.5,speed:rand(150,166),dmg:D*0.5,atkCd:0,atkCdMax:0.45,color:'#6a5a48',state:'chase',hitT:0,armor:2,
    kickCd:rand(1.5,HOOK_KICK_CD), kickT:0};
  if(type==='plaguedoc') return {type,x,y,r:16,hp:L*1.4,maxHp:L*1.4,speed:rand(84,92),dmg:D*0.9,atkCd:1,atkCdMax:PDOC_CD,color:'#2a2a2e',state:'kite',hitT:0,armor:4,
    preferRange:PDOC_PREFER, dmgType:'poison', pdCd:1.2, pdN:0, bombs:[]};
  return null;
}
function wildlifeAggro(e){
  if(e.type==='thornback'){ e.aggroRange = 300; e.leashRange = 520; e.wanderRadius = 50; }
  else if(e.type==='hookbeak'){ e.aggroRange = 320; e.leashRange = 600; e.wanderRadius = 90; }
  else if(e.type==='plaguedoc'){ e.aggroRange = 380; e.leashRange = 700; e.wanderRadius = 60; }
}
const WILDLIFE_TYPES = {thornback:1, hookbeak:1, plaguedoc:1};
// a hit on target (player or follower), with an optional element source
function wildHit(g, target, isF, dmg, src){ if(isF) applyFollowerDamage(g, target, dmg, src); else playerDamage(g, dmg, src); }
function updateThornback(g, e, dt, target, d, isF, chillMult, room){
  updateStuckTracking(e, dt);
  e.quillCd -= dt; e.whipCd -= dt;
  if(e.whipT>0){   // tail whip: wind-up, then the circle lands
    e.whipT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.whipT<=0){
      const p = g.player;
      if(dist(e,p) <= THORN_WHIP_R + p.r*0.5 && !p.dodging) playerDamage(g, teleDmg(e, 1.15), e);
      if(g.followers) for(const f of g.followers) if(f.kind!=='cat' && dist(e,f) <= THORN_WHIP_R + (f.r||12)*0.5) applyFollowerDamage(g, f, teleDmg(e, 1.15), e);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.3, max:0.3, r:THORN_WHIP_R, color:'#c9a878'});
      e.whipSpin = 0.35;
    }
    return;
  }
  if(e.whipSpin>0) e.whipSpin -= dt;
  if(d < THORN_WHIP_R*0.85 && e.whipCd<=0){ e.whipT = THORN_WHIP_WIND; e.whipMax = THORN_WHIP_WIND; e.whipCd = THORN_WHIP_CD; return; }
  const _sx = e.x, _sy = e.y;
  if(d > 200){ const a = steerAngleTo(e, target.x, target.y, room.obstacles); e.x += Math.cos(a)*e.speed*chillMult*dt; e.y += Math.sin(a)*e.speed*chillMult*dt; e.moving = true; }
  else if(d < 120 && e.whipCd > 0.8){ const a = Math.atan2(e.y-target.y, e.x-target.x); e.x += Math.cos(a)*e.speed*0.5*chillMult*dt; e.y += Math.sin(a)*e.speed*0.5*chillMult*dt; e.moving = true; }
  else e.moving = false;
  if(e.quillCd<=0 && d < 330 && d > 70 && enemyLOS(g, e, target)){
    e.quillCd = THORN_QUILL_CD + Math.random()*0.6; e.atkAnimT = 0.25;
    const ang = Math.atan2(target.y-e.y, target.x-e.x);
    for(const o of [-0.18, 0, 0.18]) g.projectiles.push({x:e.x, y:e.y-6, vx:Math.cos(ang+o)*300, vy:Math.sin(ang+o)*300, r:5, dmg:e.dmg*0.55, from:'enemy', life:1.4, color:'#e8dcc0', isArrow:true, isQuill:true, srcEnemy:e, targetRef:target});
  }
  if(Math.abs(e.x-_sx)+Math.abs(e.y-_sy) > 0.01){ e.facing = {x:target.x-e.x, y:target.y-e.y}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); }
}
// a melee hit on a quilled monster pricks the attacker
function meleeThorns(g, p, e){
  if(!(e.thorns>0) || !(e.hp>0) || p.invuln>0) return;
  if((e._thornT||0) > (g.clock||0)) return; e._thornT = (g.clock||0) + 0.25;
  playerDamage(g, Math.max(1, e.dmg*e.thorns), e);
  g.particles.push({type:'burst', x:p.x, y:p.y, t:0.25, max:0.25, color:'#e8dcc0'});
}
function updateHookbeak(g, e, dt, target, d, isF, chillMult, room){
  updateStuckTracking(e, dt);
  e.kickCd -= dt;
  const reach = e.r + target.r + 6;
  if(e.kickT>0){   // heavy kick wind-up
    e.kickT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.kickT<=0){
      e.kickAnim = 0.25;
      if(dist(e,target) <= reach + 18){
        if(isF) applyFollowerDamage(g, target, teleDmg(e, 1.9), e);
        else if(!g.player.dodging){ playerDamage(g, teleDmg(e, 1.9), e); const a = Math.atan2(target.y-e.y, target.x-e.x); playerKnock(g.player, a, HOOK_KICK_PUSH); }
        g.particles.push({type:'burst', x:target.x, y:target.y, t:0.3, max:0.3, color:'#d8c8a0'});
      }
    }
    return;
  }
  if(e.kickAnim>0) e.kickAnim -= dt;
  if(d <= reach + 4 && e.kickCd<=0 && !(e.windT>0)){ e.kickT = HOOK_KICK_WIND; e.kickMax = HOOK_KICK_WIND; e.kickCd = HOOK_KICK_CD + Math.random(); return; }
  if(tickEnemyWindup(g, e, target, isF, reach, dt)) return;   // a quick peck
  if(d > reach){ const a = steerAngleTo(e, target.x, target.y, room.obstacles); e.x += Math.cos(a)*e.speed*chillMult*dt; e.y += Math.sin(a)*e.speed*chillMult*dt; e.moving = true; }
  else if(e.atkCd<=0) beginEnemyMelee(e);
}
// a short slide away from the hit, stopped by walls (the old instant knockback could pass through them)
function playerKnock(p, ang, distance){ p._kb = {vx:Math.cos(ang)*distance/0.2, vy:Math.sin(ang)*distance/0.2, t:0.2}; }
function playerKnockTick(g, dt){
  const p = g.player, k = p && p._kb; if(!k) return;
  const st = Math.min(dt, k.t); k.t -= dt;
  const n = Math.max(1, Math.ceil(Math.hypot(k.vx, k.vy)*st/6));
  for(let i=0;i<n;i++){ p.x += k.vx*st/n; p.y += k.vy*st/n; if(g.room){ p.x = clamp(p.x, p.r, g.room.w-p.r); p.y = clamp(p.y, p.r, g.room.h-p.r); pushOutOfObstacles(p, g.room.obstacles||[]); } }
  if(k.t<=0) p._kb = null;
}
function plagueSrc(e){ if(!e._pSrc){ e._pSrc = Object.create(e); e._pSrc.dmgType = 'poison'; e._pSrc.dmgSplit = null; } return e._pSrc; }
function updatePlagueDoc(g, e, dt, target, d, isF, chillMult, room){
  updateStuckTracking(e, dt);
  e.pdCd -= dt;
  // bombs in flight / clouds on the ground
  for(let i=e.bombs.length-1;i>=0;i--){
    const b = e.bombs[i]; b.t -= dt;
    if(!b.landed && b.t<=0){
      b.landed = true; b.t = PDOC_CLOUD_T; b.tick = 0;
      const p = g.player;
      if(dist(b,p) <= PDOC_BOMB_R + p.r*0.5 && !p.dodging) playerDamage(g, teleDmg(e, 1.0), plagueSrc(e));
      if(g.followers) for(const f of g.followers) if(f.kind!=='cat' && dist(b,f) <= PDOC_BOMB_R) applyFollowerDamage(g, f, teleDmg(e, 1.0), plagueSrc(e));
      g.particles.push({type:'burst', x:b.x, y:b.y, t:0.4, max:0.4, color:'#8fe05a'});
    } else if(b.landed){
      b.tick -= dt;
      if(b.tick<=0){ b.tick = 0.45; const p = g.player; if(dist(b,p) <= PDOC_BOMB_R*0.85) playerDamage(g, teleDmg(e, 0.14), plagueSrc(e)); }
      if(b.t<=0) e.bombs.splice(i,1);
    }
  }
  const _sx = e.x, _sy = e.y;
  if(d < e.preferRange-30){ const a = Math.atan2(e.y-target.y, e.x-target.x); e.x += Math.cos(a)*e.speed*0.6*chillMult*dt; e.y += Math.sin(a)*e.speed*0.6*chillMult*dt; e.moving = true; }
  else if(d > e.preferRange+40){ const a = steerAngleTo(e, target.x, target.y, room.obstacles); e.x += Math.cos(a)*e.speed*chillMult*dt; e.y += Math.sin(a)*e.speed*chillMult*dt; e.moving = true; }
  else e.moving = false;
  if(e.pdCd<=0 && d < 430 && enemyLOS(g, e, target)){
    e.pdCd = PDOC_CD + Math.random()*0.5; e.pdN++; e.atkAnimT = 0.35;
    const ang = Math.atan2(target.y-e.y, target.x-e.x);
    if(e.pdN % 2){   // poison bomb: lands where you stand now
      e.bombs.push({x:target.x, y:target.y, t:PDOC_BOMB_T, max:PDOC_BOMB_T, sx:e.x, sy:e.y, landed:false});
    } else {   // a fan of three poison knives
      for(const o of [-0.22, 0, 0.22]) g.projectiles.push({x:e.x, y:e.y-8, vx:Math.cos(ang+o)*320, vy:Math.sin(ang+o)*320, r:5, dmg:e.dmg*0.6, from:'enemy', life:1.6, color:'#9be06a', isArrow:true, srcEnemy:plagueSrc(e), targetRef:target});
    }
  }
  if(Math.abs(e.x-_sx)+Math.abs(e.y-_sy) > 0.01 || e.atkAnimT>0){ e.facing = {x:target.x-e.x, y:target.y-e.y}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); }
}
// once per visit, an elite plague doctor wanders the Cemetery side (south) of the Withered Crossroads
function spawnPlagueDoctor(g){
  const R = g.room; if(!R || g._plagueDocRoom===R) return null; g._plagueDocRoom = R;
  for(let t=0;t<60;t++){
    const x = rand(R.w*0.18, R.w*0.82), y = rand(R.h*0.74, R.h*0.92);
    if(posBlockedByObstacles(x, y, 24, R.obstacles||[]) || dist({x,y}, g.player) < 700) continue;
    const e = spawnEnemy(g, 'plaguedoc', {x, y}); if(!e) return null;
    makeElite(e, pickMods(2)); e.eliteName = 'Exiled Plague Doctor'; e.bossName = null; e.plagueDoc = true;
    return e;
  }
  return null;
}
function plagueDocDeath(g, e){
  for(let i=0;i<3;i++){ const b = spawnEnemy(g, 'firebat', {x:e.x+rand(-30,30), y:e.y+rand(-30,30)}); if(b){ b.reg = true; b.color = '#3a2a3a'; b.dmgType = null; b.aggroed = true; b.noReward = false; } }
  g.particles.push({type:'burst', x:e.x, y:e.y, t:0.5, max:0.5, color:'#8fe05a'});
}
// crows that hunt in flocks (the Cemetery's crows: weak, quick, diving)
function spawnCrowFlock(g, at, n){
  for(let i=0;i<n;i++){
    const e = spawnEnemy(g, 'vulture', {x:at.x+rand(-90,90), y:at.y+rand(-90,90)}); if(!e) continue;
    e.crow = true; e.name = 'Crow'; e.r = 10; e.maxHp = e.hp = Math.max(1, Math.round(e.maxHp*0.5)); e.dmg *= 0.2; e.aggroRange = 220; e.wanderRadius = 70;
  }
}

// ---------------- drawing ----------------
function drawThornbackIso(e){
  const iso = toIso(e.x, e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/16;
  const walk = e.moving ? Math.sin(t*12) : 0, whip = e.whipT>0 ? clamp(1-e.whipT/(e.whipMax||1),0,1) : 0, spin = e.whipSpin>0 ? e.whipSpin/0.35 : 0;
  drawShadow(iso.x, iso.y, 20*s, 8*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const fur = flash ? '#fff' : '#6a5440', furD = flash ? '#fff' : '#3e3024', quill = flash ? '#fff' : '#e4d8bc', ink = '#1a120c';
  // tail -- swings round on the whip
  const ta = -0.4 + whip*1.6 - spin*3.2;
  ctx.strokeStyle = furD; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, -8); ctx.quadraticCurveTo(-24*Math.cos(ta), -8-14*Math.sin(ta), -30*Math.cos(ta), -4-10*Math.sin(ta)); ctx.stroke();
  // legs
  ctx.strokeStyle = furD; ctx.lineWidth = 3.5;
  for(const [lx,ph] of [[-8,0],[-3,1],[6,1],[10,0]]){ const sw = (ph ? walk : -walk)*3; ctx.beginPath(); ctx.moveTo(lx, -7); ctx.lineTo(lx+sw, 0); ctx.stroke(); }
  // body
  ctx.fillStyle = fur; ctx.strokeStyle = ink; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, -12, 15, 8.5, 0, 0, 7); ctx.fill(); ctx.stroke();
  // head + snout + teeth
  ctx.beginPath(); ctx.ellipse(14, -12, 6.5, 5, 0.2, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8d8b8'; ctx.fillRect(18, -10, 1.6, 3); ctx.fillRect(16.3, -10, 1.6, 3);
  ctx.fillStyle = '#1a0f08'; ctx.beginPath(); ctx.arc(15.5, -14, 1.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#c87a6a'; ctx.beginPath(); ctx.arc(20.5, -12, 1.4, 0, 7); ctx.fill();
  // the quills: a thick, spiky crest along the back
  ctx.strokeStyle = quill; ctx.lineWidth = 1.6;
  for(let i=0;i<14;i++){
    const u = i/13, bx = -13+u*24, by = -14-Math.sin(u*Math.PI)*7, a = -Math.PI/2 - 0.9 + u*1.6 + Math.sin(t*3+i)*0.04;
    const ln = 9 + Math.sin(u*Math.PI)*6;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx+Math.cos(a)*ln, by+Math.sin(a)*ln); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(40,30,20,0.6)'; ctx.lineWidth = 1;
  for(let i=0;i<9;i++){ const u = i/8, bx = -10+u*18, by = -13-Math.sin(u*Math.PI)*6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx-2+u*4, by-6); ctx.stroke(); }
  ctx.restore();
}
function drawHookbeakIso(e){
  const iso = toIso(e.x, e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/15;
  const walk = e.moving ? Math.sin(t*14) : 0, peck = e.atkAnimT>0 && !(e.kickT>0) ? 1 : 0, kick = e.kickT>0 ? clamp(1-e.kickT/(e.kickMax||1),0,1) : 0, kicked = e.kickAnim>0 ? 1 : 0;
  drawShadow(iso.x, iso.y, 16*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const body = flash ? '#fff' : '#5c4a38', bodyD = flash ? '#fff' : '#3a2e22', leg = flash ? '#fff' : '#b08a4a', beak = flash ? '#fff' : '#d8b24a', ink = '#16100a';
  // long powerful legs (the near one lifts and drives forward on the kick)
  ctx.strokeStyle = leg; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-4-walk*3, -10); ctx.lineTo(-2-walk*5, 0); ctx.stroke();
  const kx = 4 + walk*5 + kick*-6 + kicked*16, ky = -kick*8 - kicked*6;
  ctx.beginPath(); ctx.moveTo(3, -20); ctx.lineTo(5+walk*3+kick*-4+kicked*8, -10+ky*0.5); ctx.lineTo(kx, ky); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(kx+5, ky+1); ctx.moveTo(kx, ky); ctx.lineTo(kx+3, ky+3); ctx.stroke();
  // round shaggy body + stubby wing + tail plumes
  ctx.fillStyle = bodyD; ctx.beginPath(); ctx.moveTo(-12,-28); ctx.lineTo(-22,-34); ctx.lineTo(-18,-26); ctx.lineTo(-24,-26); ctx.lineTo(-12,-22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = body; ctx.strokeStyle = ink; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, -28, 13, 9, -0.15, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bodyD; ctx.beginPath(); ctx.ellipse(-2, -28, 7, 4, -0.3, 0, 7); ctx.fill();
  // neck + head, leaning in to peck
  const lean = peck*8 + kick*-4;
  ctx.strokeStyle = body; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(8, -32); ctx.lineTo(13+lean*0.6, -42+peck*6); ctx.stroke();
  const hx = 15+lean, hy = -45+peck*8;
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, 7); ctx.fill(); ctx.stroke();
  // big hooked beak
  ctx.fillStyle = beak; ctx.beginPath(); ctx.moveTo(hx+3, hy-4); ctx.quadraticCurveTo(hx+14, hy-4, hx+13, hy+3); ctx.lineTo(hx+10, hy+1); ctx.lineTo(hx+3, hy+2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a0a04'; ctx.beginPath(); ctx.arc(hx+1, hy-1.5, 1.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#c8402a'; ctx.beginPath(); ctx.moveTo(hx-3, hy-5); ctx.lineTo(hx, hy-9); ctx.lineTo(hx+2, hy-5); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawPlagueDocIso(e){
  const iso = toIso(e.x, e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/16*1.05;
  const walk = e.moving ? Math.sin(t*8) : 0, bob = e.moving ? Math.abs(Math.sin(t*8))*1.2 : Math.sin(t*2)*0.5, throwA = e.atkAnimT>0 ? 1 : 0;
  // bombs (lobbed arcs) and their clouds
  for(const b of (e.bombs||[])){
    const bi = toIso(b.x, b.y), Rpx = PDOC_BOMB_R*ISO_KX*Math.SQRT2;
    ctx.save(); ctx.translate(bi.x, bi.y); ctx.scale(1, ISO_KY/ISO_KX);
    if(!b.landed){ const f = clamp(1-b.t/b.max,0,1); ctx.strokeStyle = 'rgba(140,230,90,'+(0.5+f*0.5)+')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0,0,Rpx,0,7); ctx.stroke(); ctx.fillStyle = 'rgba(120,210,70,'+(0.08+f*0.25)+')'; ctx.beginPath(); ctx.arc(0,0,Rpx*f,0,7); ctx.fill(); }
    else { const k = clamp(b.t/PDOC_CLOUD_T,0,1); const gr = ctx.createRadialGradient(0,0,4,0,0,Rpx); gr.addColorStop(0,'rgba(130,220,80,'+(0.4*k)+')'); gr.addColorStop(1,'rgba(90,160,50,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,Rpx,0,7); ctx.fill(); }
    ctx.restore();
    if(!b.landed){ const f = clamp(1-b.t/b.max,0,1), si = toIso(b.sx, b.sy), x = si.x+(bi.x-si.x)*f, y = si.y+(bi.y-si.y)*f - Math.sin(f*Math.PI)*70 - 20;
      ctx.fillStyle = '#4a5a3a'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7); ctx.fill(); ctx.fillStyle = '#9be06a'; ctx.beginPath(); ctx.arc(x+1, y-1, 1.8, 0, 7); ctx.fill(); }
  }
  drawShadow(iso.x, iso.y, 15*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const coat = flash ? '#fff' : '#26242a', coatL = flash ? '#fff' : '#3a3740', mask = flash ? '#fff' : '#d8ccb0', ink = '#0a090c';
  // boots
  ctx.fillStyle = flash ? '#fff' : '#120f0c'; roundRect(-6+walk*3,-5,6,5,2); ctx.fill(); roundRect(1-walk*3,-5,6,5,2); ctx.fill();
  // long trenchcoat, split tails
  ctx.fillStyle = coat; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8,-34+bob); ctx.lineTo(8,-34+bob); ctx.lineTo(12,-3); ctx.lineTo(3,-5); ctx.lineTo(0,-12); ctx.lineTo(-3,-5); ctx.lineTo(-12,-3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = coatL; ctx.fillRect(-1,-33+bob,2,22);
  ctx.fillStyle = flash ? '#fff' : '#4a3a22'; ctx.fillRect(-8,-21+bob,16,2.4);   // belt
  ctx.fillStyle = flash ? '#fff' : '#8a7a4a'; ctx.fillRect(-1.5,-21.3+bob,3,3);  // buckle
  // throwing arm
  ctx.strokeStyle = coat; ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.moveTo(6,-30+bob); ctx.lineTo(12+throwA*2, -24+bob-throwA*14); ctx.stroke();
  ctx.fillStyle = flash ? '#fff' : '#3a2a1a'; ctx.beginPath(); ctx.arc(12+throwA*2, -24+bob-throwA*14, 2.4, 0, 7); ctx.fill();
  if(throwA){ ctx.fillStyle = '#9be06a'; ctx.beginPath(); ctx.arc(13, -40+bob, 2.6, 0, 7); ctx.fill(); }
  // the bird mask: a long curved beak
  ctx.fillStyle = mask; ctx.strokeStyle = ink; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(1, -40+bob, 6, 6.5, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -42+bob); ctx.quadraticCurveTo(16, -40+bob, 19, -33+bob); ctx.quadraticCurveTo(13, -36+bob, 5, -37+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a2a14'; ctx.beginPath(); ctx.arc(3, -42+bob, 2.2, 0, 7); ctx.fill();   // round glass eye
  ctx.fillStyle = 'rgba(160,230,110,0.8)'; ctx.beginPath(); ctx.arc(3.4, -42.4+bob, 0.9, 0, 7); ctx.fill();
  // wide-brimmed hat
  ctx.fillStyle = flash ? '#fff' : '#151317';
  ctx.beginPath(); ctx.ellipse(1, -46+bob, 12, 3.2, -0.05, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-5, -46+bob); ctx.lineTo(-4.5, -55+bob); ctx.lineTo(6, -55+bob); ctx.lineTo(6.5, -46+bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = flash ? '#fff' : '#4a3a22'; ctx.fillRect(-5, -48.5+bob, 11.5, 2);
  ctx.restore();
}
