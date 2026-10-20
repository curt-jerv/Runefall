// ---- v462 Frosthold Cleric: a robed dwarf priest who mends the keep's defenders ----
const FHC_HOT_R = 260, FHC_HOT_PCT = 0.02, FHC_RUNE_R = 120, FHC_RUNE_DUR = 5, FHC_RUNE_PCT = 0.07, FHC_RUNE_CAST = 0.9;
function fhClericAI(g, e, dt, target, d, isFT, chill, room){
  updateStuckTracking(e, dt);
  // a slow mending on everyone nearby
  e.hotT = (e.hotT||0) - dt;
  if(e.hotT<=0){
    e.hotT = 1;
    for(const a of g.enemies){ if(a.hp>0 && a.hp<a.maxHp && dist(a,e) < FHC_HOT_R){ a.hp = Math.min(a.maxHp, a.hp + a.maxHp*(a===e ? FHC_HOT_PCT*0.5 : FHC_HOT_PCT)); a._healFx = 0.6; } }
  }
  // the Healing Rune: a frost-blue circle that mends whoever stands in it -- drag the fight out of it, or kill the cleric
  if(e.rune){
    const r = e.rune; r.t += dt; r.tick = (r.tick||0) - dt;
    if(r.tick<=0){ r.tick = 0.5; for(const a of g.enemies){ if(a.hp>0 && a.hp<a.maxHp && dist(a,r) < FHC_RUNE_R + a.r*0.5){ a.hp = Math.min(a.maxHp, a.hp + a.maxHp*FHC_RUNE_PCT*0.5); a._healFx = 0.6; } } }
    if(r.t >= FHC_RUNE_DUR) e.rune = null;
  }
  if(e.runeCast>0){
    e.runeCast -= dt; e.moving = false; e.castAnimT = 0.2;
    if(e.stunT>0 || e.frozenT>0){ e.runeCast = 0; }
    else if(e.runeCast<=0){ e.rune = {x:e.runeAt.x, y:e.runeAt.y, t:0}; g.particles.push({type:'ring', x:e.runeAt.x, y:e.runeAt.y, t:0.45, max:0.45, r:FHC_RUNE_R, color:'#9fe0ff'}); }
    return;
  }
  e.runeCd = (e.runeCd==null ? rand(3,5) : e.runeCd) - dt;
  if(e.runeCd<=0 && !e.rune){
    // drop it under the most hurt group of allies
    let best = null, bs = 0;
    for(const a of g.enemies){
      if(!(a.hp>0) || a===e || dist(a,e) > 420) continue;
      let sc = 0; for(const b of g.enemies) if(b.hp>0 && dist(a,b) < FHC_RUNE_R) sc += 1 - b.hp/b.maxHp;
      if(sc > bs){ bs = sc; best = a; }
    }
    if(best && bs > 0.25){ e.runeAt = {x:best.x, y:best.y}; e.runeCast = FHC_RUNE_CAST; e.runeCd = rand(8,11); e.windT = 0; return; }
    e.runeCd = 1;
  }
  // stand back behind the line and throw frost bolts
  const want = 230;
  let tx = null, ty = null;
  if(d < want-60){ const a = Math.atan2(e.y-target.y, e.x-target.x); tx = e.x+Math.cos(a)*120; ty = e.y+Math.sin(a)*120; }
  else if(d > want+90 || !enemyLOS(g,e,target)){ tx = target.x; ty = target.y; }
  if(tx!=null){
    const ang = steerAngleTo(e, tx, ty, room.obstacles);
    e.x += Math.cos(ang)*e.speed*chill*dt; e.y += Math.sin(ang)*e.speed*chill*dt; e.moving = true;
    e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
  } else e.moving = false;
  if(e.atkCd<=0 && d < 400 && enemyLOS(g,e,target)){
    e.atkCd = e.atkCdMax; e.castAnimT = 0.3; e.atkAnimT = 0.25;
    const ang = Math.atan2(target.y-e.y, target.x-e.x);
    g.projectiles.push({x:e.x, y:e.y-14, vx:Math.cos(ang)*290, vy:Math.sin(ang)*290, r:8, dmg:e.dmg, from:'enemy', life:1.8, color:'#9fe0ff', srcEnemy:e, targetRef:target});
    e.faceSign = screenFacingSign(Math.cos(ang), Math.sin(ang));
  }
  if(e.castAnimT>0) e.castAnimT -= dt;
}
function drawFhClericFx(e){
  const t = game.clock||0;
  const ring = (x, y, R, a, fill)=>{ const q = toIso(x,y); ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1, ISO_KY/ISO_KX); const rr = R*ISO_KX*Math.SQRT2;
    if(fill){ ctx.fillStyle = 'rgba(70,150,235,'+fill+')'; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(50,125,215,'+Math.min(1,a*1.3)+')'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.stroke();
    // rune marks around the rim
    ctx.lineWidth = 1.6; for(let i=0;i<8;i++){ const an = i/8*6.283 + t*0.4, cx = Math.cos(an)*rr*0.82, cy = Math.sin(an)*rr*0.82; ctx.beginPath(); ctx.moveTo(cx-4, cy); ctx.lineTo(cx+4, cy); ctx.moveTo(cx, cy-4); ctx.lineTo(cx, cy+4); ctx.stroke(); }
    ctx.restore(); };
  if(e.runeCast>0 && e.runeAt){ const k = 1 - e.runeCast/FHC_RUNE_CAST; ring(e.runeAt.x, e.runeAt.y, FHC_RUNE_R*(0.4+0.6*k), 0.3+0.5*k, 0.05+0.1*k); }
  if(e.rune){ const r = e.rune, fade = r.t > FHC_RUNE_DUR-0.6 ? (FHC_RUNE_DUR-r.t)/0.6 : 1; ring(r.x, r.y, FHC_RUNE_R, (0.55+0.2*Math.sin(t*4))*fade, (0.14+0.05*Math.sin(t*3))*fade); }
  drawHwStatusFx(e);
}
// ---- v461 Highward: Mendicant (healer), Bulwark (tower shield), Duelist (twin short swords) ----
const MEND_HOT_R = 280, MEND_HOT_PCT = 0.025, MEND_BURST_R = 330, MEND_BURST_PCT = 0.22, MEND_CAST = 1.2;
const BW_TURN = 1.5, BW_FRONT = 1.15, BW_BLOCK = 0.15, BW_BREAK_FRAC = 0.4, BW_BREAK_DUR = 4, BW_WARD_R = 260, BW_WARD_DUR = 5, BW_WARD_MULT = 0.6;
// called from applyEnemyArmor: frontal block for the Bulwark, the Bulwark's ward on everyone else
function hwGuardMult(p, e, dmg){
  let m = 1;
  if(e.wardUntil && game && (game.clock||0) < e.wardUntil) m *= BW_WARD_MULT;
  if(e.hw==='bulwark' && !(e.guardBrokenT>0) && p){
    let da = Math.atan2(p.y-e.y, p.x-e.x) - (e.bwAng||0); while(da>Math.PI) da -= 2*Math.PI; while(da<-Math.PI) da += 2*Math.PI;
    if(Math.abs(da) < BW_FRONT){
      m *= BW_BLOCK;
      e.guardDmg = (e.guardDmg||0) + dmg;
      if(!(e._blkFx>0)){ e._blkFx = 0.25; if(game && game.particles) game.particles.push({type:'burst', x:e.x+Math.cos(e.bwAng)*e.r, y:e.y+Math.sin(e.bwAng)*e.r, t:0.25, max:0.25, color:'#dfe6ee'}); }
      if(e.guardDmg >= e.maxHp*BW_BREAK_FRAC){
        e.guardBrokenT = BW_BREAK_DUR; e.guardDmg = 0; e.stunT = Math.max(e.stunT||0, 1.0); e.bashWind = 0;
        showMsg('Guard broken!', 1.2, '#ffd27a');
        if(game && game.particles) game.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:e.r*2.2, color:'#ffe08a'});
      }
    }
  }
  return m;
}
function hwMendicantAI(g, e, dt, target, d, isFT, chill, room){
  updateStuckTracking(e, dt);
  // a slow, steady mending on everyone nearby
  e.hotT = (e.hotT||0) - dt;
  if(e.hotT<=0){
    e.hotT = 1;
    for(const a of g.enemies){
      if(!(a.hp>0) || a.hp>=a.maxHp || dist(a,e) > MEND_HOT_R) continue;
      a.hp = Math.min(a.maxHp, a.hp + a.maxHp*(a===e ? MEND_HOT_PCT*0.4 : MEND_HOT_PCT)); a._healFx = 0.6;
    }
  }
  if(e.mCast>0){   // the big prayer: rooted, golden, and worth interrupting
    e.mCast -= dt; e.moving = false;
    if(e.mCast<=0){
      for(const a of g.enemies){ if(a.hp>0 && dist(a,e) < MEND_BURST_R){ a.hp = Math.min(a.maxHp, a.hp + a.maxHp*MEND_BURST_PCT); a._healFx = 1.2; g.particles.push({type:'burst', x:a.x, y:a.y, t:0.45, max:0.45, color:'#ffe9a0'}); } }
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.55, max:0.55, r:MEND_BURST_R, color:'#ffe08a'});
    }
    return;
  }
  if(e.stunT>0 || e.hitStunT>0) e.mCast = 0;
  e.burstCd = (e.burstCd==null ? rand(4,7) : e.burstCd) - dt;
  if(e.burstCd<=0 && g.enemies.some(a=>a.hp>0 && a!==e && a.hp < a.maxHp*0.75 && dist(a,e) < MEND_BURST_R)){
    e.mCast = MEND_CAST; e.burstCd = rand(9,12); e.windT = 0;
    return;
  }
  // keep allies between itself and the player
  const want = 250;
  let tx = null, ty = null;
  if(d < want-60){ const a = Math.atan2(e.y-target.y, e.x-target.x); tx = e.x+Math.cos(a)*120; ty = e.y+Math.sin(a)*120; }
  else if(d > want+90 || !enemyLOS(g,e,target)){ tx = target.x; ty = target.y; }
  if(tx!=null){
    const ang = steerAngleTo(e, tx, ty, room.obstacles);
    e.x += Math.cos(ang)*e.speed*chill*dt; e.y += Math.sin(ang)*e.speed*chill*dt; e.moving = true;
    e.facing = {x:Math.cos(ang), y:Math.sin(ang)};
  } else e.moving = false;
  if(e.atkCd<=0 && d < 420 && enemyLOS(g,e,target)){
    e.atkCd = e.atkCdMax; e.castAnimT = 0.3;
    const ang = Math.atan2(target.y-e.y, target.x-e.x);
    g.projectiles.push({x:e.x, y:e.y-14, vx:Math.cos(ang)*300, vy:Math.sin(ang)*300, r:8, dmg:e.dmg, from:'enemy', life:1.8, color:'#ffe08a', srcEnemy:e, targetRef:target});
    e.faceSign = screenFacingSign(Math.cos(ang), Math.sin(ang));
  }
  if(e.castAnimT>0) e.castAnimT -= dt;
}
function hwBulwarkAI(g, e, dt, target, d, isFT, chill, room){
  const p = g.player, reach = e.r+target.r+4;
  updateStuckTracking(e, dt);
  if(e._blkFx>0) e._blkFx -= dt;
  if(e.guardBrokenT>0) e.guardBrokenT -= dt;
  if(e.bwAng==null) e.bwAng = Math.atan2(target.y-e.y, target.x-e.x);
  // the tower shield swings round slowly -- get behind it
  if(!(e.bashWind>0)){
    const want = Math.atan2(target.y-e.y, target.x-e.x);
    let da = want - e.bwAng; while(da>Math.PI) da -= 2*Math.PI; while(da<-Math.PI) da += 2*Math.PI;
    const step = BW_TURN*dt*(e.guardBrokenT>0 ? 0.5 : 1);
    e.bwAng += clamp(da, -step, step);
  }
  e.facing = {x:Math.cos(e.bwAng), y:Math.sin(e.bwAng)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
  // shield wall: wards nearby allies
  e.wardCd = (e.wardCd==null ? rand(2,4) : e.wardCd) - dt;
  if(e.wardCd<=0 && d < 520){
    e.wardCd = rand(7,9);
    const until = (g.clock||0) + BW_WARD_DUR;
    let n = 0; for(const a of g.enemies){ if(a.hp>0 && a!==e && dist(a,e) < BW_WARD_R){ a.wardUntil = until; n++; } }
    if(n) g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:BW_WARD_R, color:'#a8c8ee'});
  }
  // shield bash
  if(e.bashWind>0){
    e.bashWind -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.bashWind<=0){
      const ax = e.x+Math.cos(e.bwAng)*(e.r+18), ay = e.y+Math.sin(e.bwAng)*(e.r+18), R = 46;
      g.particles.push({type:'burst', x:ax, y:ay, t:0.35, max:0.35, color:'#e8e2d0'});
      if(!isFT && dist(p,{x:ax,y:ay}) < R+p.r && !p.dodging){ playerDamage(g, e.dmg*1.25*TELE_DMG_MULT, e, {x:Math.cos(e.bwAng)*110, y:Math.sin(e.bwAng)*110}); shakeScreen(g, 4, 0.18); }
      else if(isFT && dist(target,{x:ax,y:ay}) < R+(target.r||12)) applyFollowerDamage(g, target, e.dmg*1.25, e);
      e.atkCd = e.atkCdMax;
    }
    return;
  }
  e.bashCd = (e.bashCd==null ? rand(2,4) : e.bashCd) - dt;
  if(e.bashCd<=0 && d < reach+34 && !(e.guardBrokenT>0)){
    e.bashWind = 0.55; e.bashCd = rand(4.5,6.5); e.windT = 0;
    return;
  }
  if(tickEnemyWindup(g, e, target, isFT, reach, dt)){ }
  else if(d>reach){
    const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
    e.x += Math.cos(ang)*e.speed*chill*dt; e.y += Math.sin(ang)*e.speed*chill*dt; e.moving = true;
  } else if(e.atkCd<=0) beginEnemyMelee(e);
}
function hwDuelistAI(g, e, dt, target, d, isFT, chill, room){
  const p = g.player, reach = e.r+target.r+6;
  updateStuckTracking(e, dt);
  if(e.invulnT>0) e.invulnT -= dt;
  if(e.dodgeCd>0) e.dodgeCd -= dt;
  if(e.sideT>0){   // quick sidestep
    e.sideT -= dt;
    const nx = e.x+Math.cos(e.sideAng)*e.speed*3.2*dt, ny = e.y+Math.sin(e.sideAng)*e.speed*3.2*dt;
    if(!posBlockedByObstacles(nx, ny, e.r, room.obstacles)){ e.x = nx; e.y = ny; }
    e.moving = true; return;
  }
  // read the player's swing or an incoming shot and slip aside
  if(!(e.dodgeCd>0) && !isFT && !(e.windT>0)){
    let threat = (p.atkAnimT>0.12 && d < 150);
    if(!threat) for(const pr of g.projectiles){ if(pr.from!=='player') continue; const dx = e.x-pr.x, dy = e.y-pr.y, dd = Math.hypot(dx,dy); if(dd<120 && (dx*pr.vx+dy*pr.vy) > 0){ threat = true; break; } }
    if(threat){
      e.dodgeCd = rand(2.2,3.2);
      if(Math.random() < 0.55){
        const base = Math.atan2(e.y-p.y, e.x-p.x) + (Math.random()<0.5 ? 1 : -1)*Math.PI/2;
        e.sideAng = base; e.sideT = 0.2; e.invulnT = 0.22; e.windT = 0;
        g.particles.push({type:'burst', x:e.x, y:e.y, t:0.2, max:0.2, color:'#e8d0a0'});
        return;
      }
    }
  }
  if(tickEnemyWindup(g, e, target, isFT, reach, dt)){ return; }
  if(d>reach){
    // circle in from a flank rather than straight down the middle
    const side = e.flankSide || (e.flankSide = Math.random()<0.5 ? 1 : -1);
    const a0 = Math.atan2(target.y-e.y, target.x-e.x) + (d>140 ? side*0.45 : 0);
    const ang = steerAngleTo(e, e.x+Math.cos(a0)*80, e.y+Math.sin(a0)*80, room.obstacles);
    e.x += Math.cos(ang)*e.speed*chill*dt; e.y += Math.sin(ang)*e.speed*chill*dt; e.moving = true;
  } else if(e.atkCd<=0){
    beginEnemyMelee(e);
    e.combo = (e.combo||0) + 1;
    if(e.combo>=3){ e.combo = 0; e.atkCd = 1.3; }
  }
}
function drawHwMendicantIso(e){
  const pv = e._pv || (e._pv = {equipment:{mainhand:{slotType:'staff', spell:'fire'}}, dodging:false, invuln:0, iceArmorT:0, vanishT:0, guardianT:0, assaultT:0, lookBody:1, lookHelm:1, mendicant:true});
  pv.x = e.x; pv.y = e.y; pv.r = e.r*1.08; pv.faceSign = e.faceSign||1; pv.animT = e.animT||0; pv.moving = !!e.moving;
  pv.atkAnimT = 0; pv.castAnimT = (e.mCast>0 || e.castAnimT>0) ? 0.25 : 0; pv.hitFlash = e.hitT>0 ? 0.2 : 0;
  const iso = toIso(e.x, e.y), t = game.clock||0;
  if(e.mCast>0){
    const k = 1 - e.mCast/MEND_CAST;
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    const rr = MEND_BURST_R*ISO_KX*Math.SQRT2;
    ctx.strokeStyle = 'rgba(255,224,140,'+(0.35+0.4*k)+')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,224,140,'+(0.06+0.18*k)+')'; ctx.beginPath(); ctx.arc(0,0,rr*k,0,7); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createRadialGradient(iso.x, iso.y-60, 2, iso.x, iso.y-60, 46); gg.addColorStop(0,'rgba(255,236,170,'+(0.5*k+0.2)+')'); gg.addColorStop(1,'rgba(255,200,90,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(iso.x, iso.y-60, 46, 0, 7); ctx.fill(); ctx.restore();
  }
  drawMystic(pv);
  // a small gold halo above the hood
  ctx.save(); ctx.strokeStyle = 'rgba(255,222,130,'+(0.65+0.25*Math.sin(t*3))+')'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y - e.r*4.3, 8, 3, 0, 0, 7); ctx.stroke(); ctx.restore();
  drawHpBar(iso, 56, e.r*1.1, e.hp, e.maxHp);
}
// heal sparkle + Bulwark ward bubble on any Highward enemy (drawn under it)
function drawHwStatusFx(e){
  const iso = toIso(e.x, e.y), t = game.clock||0;
  if(e.wardUntil && t < e.wardUntil){
    ctx.save(); ctx.translate(iso.x, iso.y-2); ctx.scale(1, ISO_KY/ISO_KX);
    const rr = (e.r+10)*ISO_KX*Math.SQRT2;
    ctx.strokeStyle = 'rgba(160,200,240,'+(0.45+0.2*Math.sin(t*5))+')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.stroke();
    ctx.restore();
  }
  if(e._healFx>0){
    e._healFx -= 1/60;
    ctx.save(); ctx.fillStyle = 'rgba(255,230,140,'+Math.min(0.9, e._healFx*1.5)+')';
    for(let i=0;i<3;i++){ const ph = ((t*0.9+i*0.33)%1), x = iso.x+Math.sin(i*2.1+t)*e.r*0.6, y = iso.y - 10 - ph*e.r*2.6; ctx.fillRect(x-1, y-3.5, 2, 7); ctx.fillRect(x-3.5, y-1, 7, 2); }
    ctx.restore();
  }
  if(e.hw==='bulwark' && e.bashWind>0){
    const a = toIso(e.x, e.y), b = toIso(e.x+Math.cos(e.bwAng)*(e.r+40), e.y+Math.sin(e.bwAng)*(e.r+40));
    ctx.save(); ctx.strokeStyle = 'rgba(255,210,120,'+(0.5+0.4*Math.sin(t*30))+')'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
  }
  if(e.hw==='bulwark' && e.guardBrokenT>0){
    ctx.save(); ctx.fillStyle = 'rgba(255,220,120,0.9)'; ctx.font = 'bold 11px Cinzel, Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('GUARD BROKEN', iso.x, iso.y - e.r*4.9 - 10); ctx.restore();
  }
}
// ---- v461 The Bandit King: Lighthouse Tower rooftop boss ----
const BK_LEAP_R = 115, BK_LEAP_WIND = 0.55, BK_LEAP_AIR = 0.6, BK_FAN_WIND = 0.6;
function updateBanditKing(g, e, dt, target, d, isFT, chill, room){
  const p = g.player, reach = e.r+target.r+6;
  // v480: the opening -- he watches from behind the beacon, untouchable, until his crew is dead
  if(e.bkHold){
    e.moving = false; e.invulnT = Math.max(e.invulnT||0, 0.25); e.hp = e.maxHp;
    const fa = Math.atan2(p.y-e.y, p.x-e.x); e.facing = {x:Math.cos(fa), y:Math.sin(fa)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
    // v486: his crew stands guard around the beacon until you come close to it (or hurt one of them)
    const bcn = room.beacon || e;
    if(!e.bkShout && (dist(bcn,p) < 380 || g.enemies.some(o=>o.bkCrew && o.hp>0 && o.hp<o.maxHp))){
      e.bkShout = true; showMsg('\u201CKill him, boys!\u201D', 2.6, '#ffd27a');
      for(const o of g.enemies) if(o.bkCrew && o.hp>0){ o.bkWait = false; o.aggroRange = o._aggro0 || 300; o.aggroed = true; o.engaged = true; }
    }
    if(e.bkShout && g.enemies.filter(o=>o.bkCrew && o.hp>0).length <= 2){   // v486: he jumps in while two of his men still stand
      e.bkHold = false; e.invulnT = 0; e.aggroed = true; e.bkLeapCd = rand(8,10); e.bkFanCd = 3;
      showMsg('\u201CFine, I\u2019ll finish this myself.\u201D', 2.8, '#ffd27a');
      const lx = clamp(p.x, 60, room.w-60), ly = clamp(p.y, 60, room.h-60);
      e.bkLeap = {phase:'wind', t:0, x:lx, y:ly};
    }
    return;
  }
  updateStuckTracking(e, dt);
  const enr = e.hp < e.maxHp*0.3;
  if(enr && !e.bkEnraged){ e.bkEnraged = true; e.speed *= 1.3; e.atkCdMax *= 0.8; showMsg('The Bandit King flies into a rage!', 2.2, '#ff8a5a'); }
  const cdm = enr ? 0.7 : 1;
  // rally the crew at two-thirds and one-third life
  const frac = e.hp/e.maxHp;
  if((e.bkCall||0) < 2 && frac < (e.bkCall ? 0.34 : 0.67)){
    e.bkCall = (e.bkCall||0) + 1;
    showMsg('“To me, lads! Cut them down!”', 2.4, '#ffd27a');
    const kinds = ['bandit','bandit','banditarcher'].concat(e.bkCall===2 ? ['banditbrute'] : []);
    kinds.forEach((k,i)=>{ const a = i*2.2+Math.random(); const x = clamp(e.x+Math.cos(a)*220, 60, room.w-60), y = clamp(e.y+Math.sin(a)*220, 60, room.h-60); const a2 = spawnEnemy(g, k, {x, y}); if(a2){ a2.aggroed = true; a2.engaged = true; a2.xpMul = 0.5; g.particles.push({type:'burst', x, y, t:0.4, max:0.4, color:'#c9a25a'}); } });
  }
  // leap slam
  if(e.bkLeap){
    const L = e.bkLeap; L.t += dt; e.moving = false;
    if(L.phase==='wind'){ e.atkAnimT = 0.1; if(L.t >= BK_LEAP_WIND){ L.phase = 'air'; L.t = 0; L.sx = e.x; L.sy = e.y; } return; }
    if(L.phase==='air'){
      const k = Math.min(1, L.t/BK_LEAP_AIR);
      e.x = L.sx + (L.x-L.sx)*k; e.y = L.sy + (L.y-L.sy)*k; e.bkHop = Math.sin(k*Math.PI)*90;
      if(k>=1){
        e.bkHop = 0; e.bkLeap = null; e.atkCd = e.atkCdMax*0.8;
        const dm = e.dmg*1.6*TELE_DMG_MULT;
        if(dist(p, L) < BK_LEAP_R + p.r*0.5 && !p.dodging){ const a = Math.atan2(p.y-L.y, p.x-L.x); playerDamage(g, dm, e, {x:Math.cos(a)*95, y:Math.sin(a)*95}); }
        if(g.followers) for(const f of g.followers) if(dist(f, L) < BK_LEAP_R) applyFollowerDamage(g, f, dm, e);
        g.particles.push({type:'ring', x:L.x, y:L.y, t:0.45, max:0.45, r:BK_LEAP_R, color:'#e8b060'});
        for(let i=0;i<8;i++){ const a = i/8*6.283; g.particles.push({type:'burst', x:L.x+Math.cos(a)*BK_LEAP_R*0.6, y:L.y+Math.sin(a)*BK_LEAP_R*0.6, t:0.35, max:0.35, color:'#b89a70'}); }
        shakeScreen(g, 7, 0.3);
      }
      return;
    }
  }
  // knife fan
  if(e.bkFan>0){
    e.bkFan -= dt; e.moving = false; e.castAnimT = 0.2;
    if(e.bkFan<=0){
      const n = enr ? 7 : 5, base = e.bkFanAng, spread = 0.95;
      for(let i=0;i<n;i++){ const a = base + (i/(n-1)-0.5)*spread; g.projectiles.push({x:e.x, y:e.y-20, vx:Math.cos(a)*360, vy:Math.sin(a)*360, r:7, dmg:e.dmg*0.5, from:'enemy', life:1.6, color:'#d8dce4', isKnife:true, srcEnemy:e, targetRef:target}); }
      e.atkAnimT = 0.2;
    }
    return;
  }
  e.bkLeapCd = (e.bkLeapCd==null ? 5 : e.bkLeapCd) - dt;
  e.bkFanCd = (e.bkFanCd==null ? 3 : e.bkFanCd) - dt;
  if(e.bkLeapCd<=0 && d < 520 && !(e.windT>0)){
    e.bkLeapCd = rand(8,10)*cdm;
    const lx = clamp(target.x, 60, room.w-60), ly = clamp(target.y, 60, room.h-60);
    e.bkLeap = {phase:'wind', t:0, x:lx, y:ly};
    showMsg('The Bandit King leaps!', 1.0, '#ffd27a');
    return;
  }
  if(e.bkFanCd<=0 && d < 440 && enemyLOS(g,e,target) && !(e.windT>0)){
    e.bkFanCd = rand(5,7)*cdm; e.bkFan = BK_FAN_WIND; e.bkFanAng = Math.atan2(target.y-e.y, target.x-e.x);
    e.faceSign = screenFacingSign(Math.cos(e.bkFanAng), Math.sin(e.bkFanAng));
    return;
  }
  // three-swing cutlass combo
  if(tickEnemyWindup(g, e, target, isFT, reach, dt)) return;
  if(d>reach){
    const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
    e.x += Math.cos(ang)*e.speed*chill*dt; e.y += Math.sin(ang)*e.speed*chill*dt; e.moving = true;
  } else if(e.atkCd<=0){
    beginEnemyMelee(e);
    e.combo = (e.combo||0) + 1;
    if(e.combo < 3) e.atkCd = 0.45; else { e.combo = 0; e.atkCd = e.atkCdMax*1.4; }
  }
}
function drawBanditKingTelegraph(e){
  const flat = (px,py,R,frac,col)=>{
    const q = toIso(px,py); ctx.save(); ctx.translate(q.x,q.y); ctx.scale(1, ISO_KY/ISO_KX);
    const rr = R*ISO_KX*Math.SQRT2;
    ctx.strokeStyle='rgba('+col+','+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.stroke();
    ctx.fillStyle='rgba('+col+','+(0.10+frac*0.28)+')'; ctx.beginPath(); ctx.arc(0,0,rr*frac,0,7); ctx.fill(); ctx.restore();
  };
  if(e.bkLeap){ const L = e.bkLeap, k = L.phase==='wind' ? L.t/(BK_LEAP_WIND+BK_LEAP_AIR) : (BK_LEAP_WIND+L.t)/(BK_LEAP_WIND+BK_LEAP_AIR); flat(L.x, L.y, BK_LEAP_R, clamp(k,0,1), '230,120,60'); }
  if(e.bkFan>0){
    const n = e.bkEnraged ? 7 : 5, a0 = toIso(e.x, e.y);
    ctx.save(); ctx.strokeStyle = 'rgba(240,220,180,'+(0.25+0.35*(1-e.bkFan/BK_FAN_WIND))+')'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for(let i=0;i<n;i++){ const a = e.bkFanAng + (i/(n-1)-0.5)*0.95, b = toIso(e.x+Math.cos(a)*300, e.y+Math.sin(a)*300); ctx.beginPath(); ctx.moveTo(a0.x, a0.y-10); ctx.lineTo(b.x, b.y-10); ctx.stroke(); }
    ctx.restore();
  }
}
function hwKnightAI(g, e, dt, target, d, isFT, chill, room){
  const p = g.player, reach = e.r+target.r+4, kind = e.hw;
  if(kind==='mendicant'){ hwMendicantAI(g, e, dt, target, d, isFT, chill, room); return; }
  if(kind==='bulwark'){ hwBulwarkAI(g, e, dt, target, d, isFT, chill, room); return; }
  if(kind==='duelist'){ hwDuelistAI(g, e, dt, target, d, isFT, chill, room); return; }
  const hurt = (dm, atPt, R)=>{
    if(dist(p, atPt) < R+(R>150?0:0)) playerDamage(g, dm, e);
    if(g.followers) for(const f of g.followers) if(dist(f, atPt) < R) applyFollowerDamage(g, f, dm, e);
  };
  updateStuckTracking(e, dt);
  if(e.shieldUp>0) e.shieldUp -= dt;
  // --- Ancient Warden extras: hammer rain + garrison call ---
  if(kind==='guardian'){
    e.rainCd -= dt;
    if(e.rainCd<=0 && e.tState!=='tele'){
      e.rainCd = 10;
      for(let i=0;i<5;i++){ const a = Math.random()*7, rr = i===0 ? 0 : 90+Math.random()*190; e.rainQ.push({x:target.x+Math.cos(a)*rr, y:target.y+Math.sin(a)*rr, t:1.1+i*0.25}); }
      showMsg('The Ancient Warden hurls hammers!', 1.4, '#ffd27a');
    }
    for(let i=e.rainQ.length-1;i>=0;i--){
      const r = e.rainQ[i]; r.t -= dt;
      if(r.t<=0){
        hurt(e.dmg*0.9*TELE_DMG_MULT, r, 54);
        g.particles.push({type:'ring', x:r.x, y:r.y, t:0.4, max:0.4, r:54, color:'#ffd27a'});
        g.particles.push({type:'burst', x:r.x, y:r.y, t:0.35, max:0.35, color:'#e8c070'});
        e.rainQ.splice(i,1);
      }
    }
    const frac = e.hp/e.maxHp;
    if(e.callPhase<2 && frac < (e.callPhase===0 ? 0.66 : 0.33)){
      e.callPhase++;
      showMsg('The garrison answers the Ancient Warden!', 2.4, '#ffd27a');
      for(let i=0;i<3;i++){ const ang = i*2.1+Math.random(); const a2 = spawnEnemy(g, i===0 ? 'hwwarden' : e.callPhase===2 && i===1 ? 'hwmendicant' : 'hwsentinel', {x:e.x+Math.cos(ang)*140, y:e.y+Math.sin(ang)*140}); if(a2){ a2.aggroed = true; a2.hwAdd = true; } }
      e.shieldUp = 3.2;
    }
  }
  // --- Warden / King: shield wall ---
  if((kind==='warden' || kind==='guardian') && e.tState!=='tele'){
    e.shieldCd -= dt;
    if(e.shieldCd<=0 && d<320){ e.shieldUp = kind==='guardian' ? 2.6 : 2.2; e.shieldCd = (kind==='guardian' ? 12 : 8)+Math.random()*3; }
  }
  // --- Vanguard: charge ---
  if(kind==='vanguard'){
    if(e.chargeCd>0) e.chargeCd -= dt;
    if(e.chWind>0){
      e.chWind -= dt; e.moving = false;
      if(e.chWind<=0){ e.chargeT = 0.5; e.chargeHit = false; }
      return;
    }
    if(e.chargeT>0){
      e.chargeT -= dt;
      const ang = e.chAng;
      e.x += Math.cos(ang)*e.speed*3.4*chill*dt; e.y += Math.sin(ang)*e.speed*3.4*chill*dt; e.moving = true;
      if(!e.chargeHit && dist(e,target) < reach+6){
        e.chargeHit = true;
        const dm = e.dmg*1.3*TELE_DMG_MULT;
        if(isFT) applyFollowerDamage(g, target, dm, e); else playerDamage(g, dm, e);
        e.chargeT = 0; e.atkCd = e.atkCdMax;
      }
      return;
    }
    if(e.chargeCd<=0 && d>160 && d<400 && enemyLOS(g,e,target) && e.tState!=='tele'){
      e.chAng = Math.atan2(target.y-e.y, target.x-e.x); e.chWind = 0.45; e.chargeCd = 5+Math.random()*3;
      e.facing = {x:Math.cos(e.chAng), y:Math.sin(e.chAng)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
      return;
    }
  }
  // --- hammer slam (all) ---
  if(e.tState==='tele'){
    e.tT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.tT<=0){
      const R = e.slamR, dm = e.dmg*1.5*TELE_DMG_MULT;
      hurt(dm, e.tPt, R);
      g.particles.push({type:'ring', x:e.tPt.x, y:e.tPt.y, t:0.45, max:0.45, r:R, color:'#e8b060'});
      g.particles.push({type:'burst', x:e.tPt.x, y:e.tPt.y, t:0.4, max:0.4, color:'#d0a060'});
      shakeScreen(g, kind==='guardian' ? 7 : 4, 0.2);
      e.tState='idle'; e.atkCd = e.atkCdMax*0.7;
    }
    return;
  }
  e.tCd -= dt;
  if(e.tCd<=0 && d < Math.max(120, e.slamR*1.1+e.r) && enemyLOS(g,e,target)){
    e.tState='tele'; e.tT = e.slamTele; e.tCd = (kind==='vanguard' ? 3 : kind==='guardian' ? 4 : 4.5)+Math.random()*2; e.tPt = {x:target.x, y:target.y}; e.windT = 0;
  } else if(tickEnemyWindup(g, e, target, isFT, reach, dt)){
    // mid hammer swing
  } else if(d>reach){
    const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
    e.x += Math.cos(ang)*e.speed*chill*dt; e.y += Math.sin(ang)*e.speed*chill*dt; e.moving = true;
  } else if(e.atkCd<=0){
    beginEnemyMelee(e);
  }
}
// altar with the third runestone
function drawHwAltarIso(pos, ready, taken, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+2, 60, 22);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#4a3828'; ctx.beginPath(); ctx.moveTo(-54,0); ctx.lineTo(0,-22); ctx.lineTo(54,0); ctx.lineTo(0,22); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#6a4e30'; ctx.beginPath(); ctx.moveTo(-40,-8); ctx.lineTo(0,-26); ctx.lineTo(40,-8); ctx.lineTo(0,10); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#8a6a3c'; ctx.fillRect(-26,-44,52,34);
  ctx.fillStyle='#b88a3e'; ctx.fillRect(-30,-50,60,8); ctx.fillStyle='#e0b85a'; ctx.fillRect(-30,-50,60,2.5);
  ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1.2; ctx.strokeRect(-26,-44,52,34); ctx.strokeRect(-30,-50,60,8);
  ctx.strokeStyle='rgba(240,200,100,0.7)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-14,-36); ctx.lineTo(0,-30); ctx.lineTo(14,-36); ctx.moveTo(0,-30); ctx.lineTo(0,-16); ctx.stroke();
  if(!taken){
    const hover = ready ? Math.sin(t*2.2)*4 : 0;
    ctx.shadowColor = ready ? '#ffd060' : '#8a7a5a'; ctx.shadowBlur = ready ? 20 : 4;
    ctx.fillStyle = ready ? '#ffe08a' : '#7a6a50';
    ctx.beginPath(); ctx.moveTo(0,-84+hover); ctx.lineTo(10,-68+hover); ctx.lineTo(6,-54+hover); ctx.lineTo(-6,-54+hover); ctx.lineTo(-10,-68+hover); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle='#4a3a14'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle = ready ? '#fff6d0' : '#a89a78'; ctx.fillRect(-1.2,-76+hover,2.4,14);
  }
  ctx.restore();
}
// the gate switch
function drawHwSwitchIso(pos, on, ready, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+2, 34, 12);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#5a4228'; ctx.fillRect(-18,-30,36,32); ctx.fillStyle='#8a6a3c'; ctx.fillRect(-18,-30,36,6);
  ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1.2; ctx.strokeRect(-18,-30,36,32);
  ctx.fillStyle='#2a2018'; ctx.fillRect(-4,-26,8,18);
  ctx.save(); ctx.translate(0,-18); ctx.rotate(on ? 0.9 : -0.9);
  ctx.strokeStyle='#c9a24a'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-30); ctx.stroke();
  ctx.fillStyle = on ? '#9fffb0' : (ready ? '#ffd060' : '#8a7a5a'); ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = (ready||on) ? 10 : 0;
  ctx.beginPath(); ctx.arc(0,-32,5,0,7); ctx.fill(); ctx.restore();
  ctx.restore();
}
function drawHwBrazier(pos, clock){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#4a3822'; ctx.fillRect(-3,-26,6,28); ctx.fillStyle='#8a6a3c'; ctx.beginPath(); ctx.moveTo(-12,-26); ctx.lineTo(12,-26); ctx.lineTo(8,-18); ctx.lineTo(-8,-18); ctx.closePath(); ctx.fill();
  const fl = 8+3*Math.sin(t*9+pos.x);
  const g3 = ctx.createRadialGradient(0,-32,1,0,-32,22); g3.addColorStop(0,'rgba(255,220,120,0.55)'); g3.addColorStop(1,'rgba(255,160,40,0)');
  ctx.fillStyle=g3; ctx.beginPath(); ctx.arc(0,-32,22,0,7); ctx.fill();
  ctx.fillStyle='#ffb040'; ctx.beginPath(); ctx.moveTo(-6,-26); ctx.quadraticCurveTo(0,-26-fl*2,6,-26); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ffe898'; ctx.beginPath(); ctx.moveTo(-3,-26); ctx.quadraticCurveTo(0,-26-fl*1.3,3,-26); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawHwPillarIso(pos){
  const iso = toIso(pos.x, pos.y);
  drawShadow(iso.x, iso.y+2, 22, 8);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#6a4a2a'; ctx.fillRect(-12,-92,24,94); ctx.fillStyle='#8a6232'; ctx.fillRect(-12,-92,7,94); ctx.fillStyle='#4a3018'; ctx.fillRect(5,-92,7,94);
  ctx.fillStyle='#b88a3e'; ctx.fillRect(-16,-100,32,10); ctx.fillRect(-16,-4,32,6);
  ctx.fillStyle='#e0b85a'; ctx.fillRect(-16,-100,32,2.5);
  ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1; ctx.strokeRect(-12,-92,24,94);
  ctx.fillStyle='rgba(240,200,100,0.8)'; ctx.fillRect(-1.5,-70,3,26);
  ctx.restore();
}
function drawHwStatueIso(pos){
  const iso = toIso(pos.x, pos.y);
  drawShadow(iso.x, iso.y+2, 22, 8);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#7a5a32'; ctx.fillRect(-18,-14,36,16); ctx.fillStyle='#b88a3e'; ctx.fillRect(-18,-14,36,3);
  ctx.fillStyle='#8a8272'; roundRect(-8,-56,16,44,4); ctx.fill();               // body
  ctx.fillStyle='#9a9282'; ctx.beginPath(); ctx.arc(0,-62,7,0,7); ctx.fill();    // helm
  ctx.fillStyle='#6a6254'; ctx.fillRect(-15,-52,8,24); ctx.fillStyle='#b88a3e'; ctx.fillRect(-15,-52,8,3);   // shield
  ctx.fillStyle='#6a6254'; ctx.fillRect(8,-60,3,38); ctx.fillStyle='#8a8272'; ctx.fillRect(5,-66,9,8);        // hammer
  ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1; ctx.strokeRect(-18,-14,36,16);
  ctx.restore();
}
function drawHwCrossIso(pos){
  const iso = toIso(pos.x, pos.y);
  drawShadow(iso.x, iso.y+2, 20, 7);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#6a5a40'; ctx.fillRect(-14,-10,28,12);
  ctx.fillStyle='#8a7a5a'; ctx.fillRect(-5,-86,10,78); ctx.fillRect(-20,-68,40,10);
  ctx.fillStyle='#d8b050'; ctx.fillRect(-1.6,-80,3.2,64); ctx.fillRect(-16,-64,32,3);
  ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1; ctx.strokeRect(-5,-86,10,78); ctx.strokeRect(-20,-68,40,10);
  ctx.restore();
}
// gilded inlay: rune rings and a Templar cross in each chamber, a runner down every hall
function drawHwFloorInlay(room, cam){
  const clk = (game&&game.clock)||0;
  ctx.save(); ctx.lineCap='round';
  const vis = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-500 && i.x<cam.x+W+500 && i.y>cam.y-400 && i.y<cam.y+H+400; };
  for(const r of room.hwRooms){
    const cx = r.x+r.w/2, cy = r.y+r.h/2;
    if(!vis(cx,cy)) continue;
    const iso = (x,y)=>toIso(x,y);
    if(r.kind==='hall'){
      const horiz = r.w>r.h; ctx.strokeStyle='rgba(224,184,90,0.34)'; ctx.lineWidth=3;
      for(const off of [-70,70]){ const a = horiz ? iso(r.x+40, cy+off) : iso(cx+off, r.y+40), b = horiz ? iso(r.x+r.w-40, cy+off) : iso(cx+off, r.y+r.h-40); ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
      continue;
    }
    const c = iso(cx,cy), a = 0.30+0.12*Math.sin(clk*1.5+cx);
    const R0 = Math.min(r.w,r.h)*0.2;
    ctx.strokeStyle='rgba(240,200,100,'+a+')'; ctx.lineWidth=2.6;
    ctx.beginPath(); ctx.ellipse(c.x,c.y,R0*1.42,R0*0.71,0,0,7); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(c.x,c.y,R0*0.85,R0*0.42,0,0,7); ctx.stroke();
    // Templar cross glyph
    const arm = R0*0.9, p1 = iso(cx,cy-arm), p2 = iso(cx,cy+arm*1.2), p3 = iso(cx-arm*0.7,cy-arm*0.2), p4 = iso(cx+arm*0.7,cy-arm*0.2);
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.moveTo(p3.x,p3.y); ctx.lineTo(p4.x,p4.y); ctx.stroke();
    if(r.kind==='boss'){ ctx.strokeStyle='rgba(255,214,110,'+(0.4+0.15*Math.sin(clk*2))+')'; ctx.lineWidth=3.5; for(const k of [2.6,1.9]){ ctx.beginPath(); ctx.ellipse(c.x,c.y,R0*k,R0*k/2,0,0,7); ctx.stroke(); } }
  }
  ctx.restore();
}
// v490: a fresh temple layout on every visit, except when climbing back up from the Sunken Depths (same temple you went down)
function enterFloodedTemple(opts){ if(game.scene==='ancientruins') dungeonPersist(game); if(!(opts && opts.atStairs) || !game.templeSeed) game.templeSeed = 1 + Math.floor(Math.random()*1e9); enterSubZone('temple', opts); }
