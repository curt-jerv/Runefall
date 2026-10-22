// Woolly Mastodon (Icy Cellar boss): shaggy rust-brown mammoth with a
// trunk and two curved tusks. Same rig conventions as drawBearIso.
// ---------------- Woolly Mastodon AI (v280): its own kit instead of the bear's ----------------
//   Tusk Charge -- locked lane, long wind-up, hits very hard. Earth-Shaking Stomp -- huge ring round itself.
//   Below 50% life: Avalanche -- a barrage of falling ice circles around you, and it moves faster.
const MST_STOMP_R = 180.5, MST_STOMP_IN_R = 90.25, MST_STOMP_OUTER_DMG = 0.6, MST_STOMP_OUTER_DELAY = 0.3, MST_CHARGE_HW = 92, MST_CHARGE_LEN = 760, MST_AVA_R = 62;
// v523: three Avalanche phases (at 75%, 50% and 25% life): it rears and trumpets while the ceiling comes down for ~6s --
// a steady rain of small telegraphed circles around you, each one hit by a falling boulder, with the screen shaking.
const MST_AVA_PHASES = [0.75, 0.5, 0.25], MST_AVA_DUR = 6.2, MST_AVA_EVERY = 0.3, MST_AVA_TELE = 1.1;
function updateMastodon(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  if(e.mSt===undefined){ e.mSt='chase'; e.mT=0; e.mTmax=1; e.mCd=2.2; e.mNext=0; e.mDir=0; e.mHit={}; e.mPts=[]; e.mRocks=[]; e.mAvaPh=0; }
  if(!e.mRocks) e.mRocks = [];
  // falling boulders land whatever the Mastodon is doing
  for(let i=e.mRocks.length-1;i>=0;i--){
    const rk = e.mRocks[i]; rk.t -= dt;
    if(rk.t<=0){
      for(const tg of [g.player].concat(g.followers||[])) if(dist(tg,rk) < MST_AVA_R + tg.r*0.3){ const dm = teleDmg(e, 0.55); if(tg===g.player) playerDamage(g, dm, e); else applyFollowerDamage(g, tg, dm, e); }
      g.particles.push({type:'ring', x:rk.x, y:rk.y, t:0.35, max:0.35, r:MST_AVA_R, color:'#cfeaff'});
      g.particles.push({type:'burst', x:rk.x, y:rk.y, t:0.4, max:0.4, color:'#e8f6ff'});
      shakeScreen(g, 3, 0.12);
      e.mRocks.splice(i,1);
    }
  }
  if((e.mAvaPh||0) < MST_AVA_PHASES.length && e.hp <= e.maxHp*MST_AVA_PHASES[e.mAvaPh||0] && (e.mSt==='chase' || e.mSt==='recover')){
    e.mAvaPh = (e.mAvaPh||0)+1; e.mSt = 'avaPhase'; e.mT = e.mTmax = MST_AVA_DUR; e.mAvaSpawn = 0.4; e.windT = 0;
    showMsg('The Mastodon trumpets -- the ceiling gives way! AVALANCHE!', 2.6, '#cfeaff'); shakeScreen(g, 8, 0.5);
  }
  const st = e.mSt, tgs = [g.player].concat(g.followers||[]), F = e.hp<=e.maxHp*0.5 ? 0.8 : 1;
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  const hit = (tg, mult, kb)=>{ const dm = teleDmg(e, mult); if(tg===g.player) playerDamage(g, dm, e, kb); else applyFollowerDamage(g, tg, dm, e); };
  if(st==='recover'){ e.mT -= dt; e.moving = false; if(e.mT<=0) e.mSt='chase'; return; }
  if(st==='avaPhase'){
    e.mT -= dt; e.moving = false; e.atkAnimT = 0.1; face(Math.atan2(target.y-e.y, target.x-e.x));
    shakeScreen(g, 2.5, 0.12);
    e.mAvaSpawn -= dt;
    if(e.mAvaSpawn<=0 && e.mT>MST_AVA_TELE*0.6){
      e.mAvaSpawn = MST_AVA_EVERY*(0.85+Math.random()*0.3);
      const j = Math.random()*6.283, jr = rand(0, 46);
      e.mRocks.push({x:target.x+Math.cos(j)*jr, y:target.y+Math.sin(j)*jr, t:MST_AVA_TELE, max:MST_AVA_TELE, seed:Math.random()*6});
      if(Math.random()<0.7){ const a = Math.random()*6.283, rr = rand(90, 360); e.mRocks.push({x:target.x+Math.cos(a)*rr, y:target.y+Math.sin(a)*rr, t:MST_AVA_TELE*rand(0.9,1.2), max:MST_AVA_TELE*1.1, seed:Math.random()*6}); }
    }
    if(e.mT<=0){ e.mSt='recover'; e.mT = 1.2; }
    return;
  }
  if(st==='stompTele'){
    e.mT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.mT<=0){
      // v336: two-tier shockwave -- inner ring now (full damage + 0.2s stun), outer ring 0.3s later at 60%
      e.mStompHit = {};
      tgs.forEach((tg,i)=>{ if(dist(tg,e) < MST_STOMP_IN_R + tg.r*0.5){
        e.mStompHit[i] = true;
        const safe = tg===g.player && (tg.invuln>0 || tg.dodging || tg.vanishT>0);
        hit(tg, 1.05);
        if(tg===g.player && !safe) tg.stunT = Math.max(tg.stunT||0, 0.2);
      } });
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.45, max:0.45, r:MST_STOMP_IN_R, color:'#e8f6ff'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.5, max:0.5, color:'#e8f6ff'});
      shakeScreen(g, 8, 0.35);
      e.mSt='stompOuter'; e.mT = e.mTmax = MST_STOMP_OUTER_DELAY;
    }
    return;
  }
  if(st==='stompOuter'){
    e.mT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.mT<=0){
      tgs.forEach((tg,i)=>{ if(!e.mStompHit[i] && dist(tg,e) < MST_STOMP_R + tg.r*0.5){ hit(tg, 1.05*MST_STOMP_OUTER_DMG); } });
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:MST_STOMP_R, color:'#bfeaff'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#cfeaff'});
      shakeScreen(g, 6, 0.3);
      e.mSt='recover'; e.mT = 1.0*F;
    }
    return;
  }
  if(st==='chargeTele'){
    e.mT -= dt; e.moving = false; e.atkAnimT = 0.1; face(e.mDir);
    if(e.mT<=0){ e.mSt='charge'; e.mT = 0.65; e.mHit = {}; }
    return;
  }
  if(st==='charge'){
    e.mT -= dt; e.moving = true; face(e.mDir);
    const sp = 780*chillMult*dt, nx = e.x + Math.cos(e.mDir)*sp, ny = e.y + Math.sin(e.mDir)*sp;
    const blocked = !room.floorRects && (nx<60 || ny<60 || nx>room.w-60 || ny>room.h-60) || (nx<60||ny<60||nx>room.w-60||ny>room.h-60) || posBlockedByObstacles(nx, ny, e.r*0.7, room.obstacles);
    if(blocked){ shakeScreen(g, 6, 0.3); g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#e8f6ff'}); e.mSt='recover'; e.mT = 1.4*F; e.moving=false; return; }
    e.x = nx; e.y = ny;
    tgs.forEach((tg,i)=>{ if(!e.mHit[i] && dist(tg,e) < e.r+tg.r+10){ e.mHit[i] = true; hit(tg, 2.0); } });
    if(e.mT<=0){ e.mSt='recover'; e.mT = 1.0*F; e.moving=false; }
    return;
  }
  if(st==='avaTele'){
    e.mT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.mT<=0){
      for(const pt of e.mPts){
        for(const tg of tgs) if(dist(tg,pt) < MST_AVA_R + tg.r*0.5) hit(tg, 0.9);   // v336: avalanche another -10% (1.0 -> 0.9)
        g.particles.push({type:'ring', x:pt.x, y:pt.y, t:0.45, max:0.45, r:MST_AVA_R, color:'#cfeaff'});
        g.particles.push({type:'burst', x:pt.x, y:pt.y, t:0.4, max:0.4, color:'#e8f6ff'});
      }
      shakeScreen(g, 6, 0.3);
      e.mPts = []; e.mSt='recover'; e.mT = 0.9*F;
    }
    return;
  }
  const reach = (e.r+target.r+4)*1.5;   // v331: melee swipe area +50%
  updateStuckTracking(e, dt);
  e.mCd -= dt;
  if(e.mCd<=0){
    const seq = e.hp<=e.maxHp*0.5 ? ['stomp','charge','stomp','charge'] : ['stomp','charge','stomp'];   // v523: the avalanche is its own phase now
    const mv = seq[e.mNext % seq.length];
    let ok = true;
    if(mv==='stomp'){ if(d < MST_STOMP_R*0.95){ e.mSt='stompTele'; e.mT = e.mTmax = 0.8*F; } else ok = false; }
    else if(mv==='charge'){ if(d > 140 && d < MST_CHARGE_LEN && enemyLOS(g,e,target)){ e.mDir = Math.atan2(target.y-e.y, target.x-e.x); e.mSt='chargeTele'; e.mT = e.mTmax = 0.7*F; } else ok = false; }
    else {
      e.mPts = [];
      for(let i=0;i<7;i++){ const a = Math.random()*6.283, rr = i===0 ? 0 : rand(70, 420); e.mPts.push({x:target.x+Math.cos(a)*rr, y:target.y+Math.sin(a)*rr}); }
      e.mSt='avaTele'; e.mT = e.mTmax = 0.95*F;
    }
    if(ok){ e.mNext++; e.mCd = 2.0 + Math.random()*0.6; e.windT = 0; return; }
    e.mCd = 0.5; e.mNext++;
  }
  if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
  } else if(d>reach){
    const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
    face(ang);
    const sp = e.speed*1.3*chillMult*(e.hp<=e.maxHp*0.5 ? 1.25 : 1);
    e.x += Math.cos(ang)*sp*dt; e.y += Math.sin(ang)*sp*dt; e.moving = true;
  } else if(e.atkCd<=0){ beginEnemyMelee(e); }
}
function drawMstTelegraph(e){
  if(e.mRocks && e.mRocks.length){
    for(const rk of e.mRocks){
      const f = clamp(1-rk.t/rk.max,0,1), iso = toIso(rk.x,rk.y);
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
      ctx.strokeStyle='rgba(170,225,255,'+(0.45+f*0.5)+')'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(0,0,MST_AVA_R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
      ctx.fillStyle='rgba(150,210,255,'+(0.08+f*0.24)+')'; ctx.beginPath(); ctx.arc(0,0,MST_AVA_R*ISO_KX*Math.SQRT2*f,0,7); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,'+(0.1+f*0.3)+')'; ctx.beginPath(); ctx.arc(0,0,MST_AVA_R*ISO_KX*0.9*f,0,7); ctx.fill();   // the boulder's shadow growing
      ctx.restore();
    }
  }
  const st = e.mSt; if(st!=='stompTele' && st!=='stompOuter' && st!=='chargeTele' && st!=='avaTele') return;
  const frac = clamp(1-e.mT/(e.mTmax||1),0,1);
  ctx.save();
  if(st==='chargeTele'){
    const ca = Math.cos(e.mDir), sa = Math.sin(e.mDir), hw = MST_CHARGE_HW, L = MST_CHARGE_LEN;
    const pts = [[0,-hw],[L,-hw],[L,hw],[0,hw]].map(q=>toIso(e.x + ca*q[0] - sa*q[1], e.y + sa*q[0] + ca*q[1]));
    ctx.beginPath(); pts.forEach((q,i)=> i? ctx.lineTo(q.x,q.y) : ctx.moveTo(q.x,q.y)); ctx.closePath();
    ctx.fillStyle='rgba(255,80,60,'+(0.10+frac*0.28)+')'; ctx.fill();
    ctx.strokeStyle='rgba(255,110,80,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5; ctx.stroke();
  } else {
    const circles = st==='stompTele' ? [{x:e.x,y:e.y,R:MST_STOMP_IN_R},{x:e.x,y:e.y,R:MST_STOMP_R}] : st==='stompOuter' ? [{x:e.x,y:e.y,R:MST_STOMP_R}] : (e.mPts||[]).map(p=>({x:p.x,y:p.y,R:MST_AVA_R}));
    for(const c of circles){
      const iso = toIso(c.x,c.y);
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
      ctx.strokeStyle='rgba(170,225,255,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(0,0,c.R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
      ctx.fillStyle='rgba(150,210,255,'+(0.08+frac*0.26)+')'; ctx.beginPath(); ctx.arc(0,0,c.R*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}
// v523: a boulder of ice-crusted rock dropping into its circle (drawn above the ground, sorted with the characters)
function drawMstRock(rk){
  const f = clamp(1-rk.t/rk.max,0,1); if(f < 0.45) return;
  const k = (f-0.45)/0.55, iso = toIso(rk.x, rk.y), fall = (1-k)*(1-k)*320, sd = rk.seed||0, R = 15+((sd*7)%5);
  ctx.save(); ctx.translate(iso.x + (1-k)*40, iso.y - fall - R*0.6); ctx.rotate(sd + k*2.2);
  ctx.fillStyle = '#56606c'; ctx.strokeStyle = '#1f262e'; ctx.lineWidth = 1.4;
  ctx.beginPath(); for(let i=0;i<7;i++){ const a = i/7*6.283, rr = R*(0.75+0.25*Math.sin(sd*3+i*2.1)); i ? ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr*0.85) : ctx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr*0.85); } ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(235,246,255,0.9)'; ctx.beginPath(); ctx.ellipse(-2, -R*0.45, R*0.7, R*0.3, -0.2, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-R*0.3, -R*0.1, R*0.3, R*0.2, 0, 0, 7); ctx.fill();
  ctx.restore();
  if(k < 0.9){ ctx.save(); ctx.globalAlpha = 0.5*(1-k); ctx.fillStyle = '#e8f4ff'; for(let i=0;i<4;i++){ ctx.fillRect(iso.x + (1-k)*40 + Math.sin(sd+i)*R, iso.y - fall - R - 8 - i*9, 2, 2); } ctx.restore(); }
}
// v523: a more fearsome, frost-bound mastodon -- dark shaggy hide frosted white at the tips, ice spikes along the
// spine, icicles under the belly, glowing ice-blue eyes, heavy ice-sheathed tusks (the far tusk sits BEHIND the head)
function drawMastodonIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/26;
  drawShadow(iso.x, iso.y, 44*s, 15*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const walk = moving ? Math.sin(t*5) : 0;
  const bob = moving ? Math.abs(Math.sin(t*5))*2 : Math.sin(t*1.6)*0.8;
  const rear = e.mSt==='stompTele' ? clamp(1-e.mT/(e.mTmax||1),0,1) : e.mSt==='avaPhase' ? 0.55+0.15*Math.sin(t*6) : 0;
  const by = -32+bob-rear*10;
  const fur = flash?HIT_FLASH:'#4a3a30', furL = flash?HIT_FLASH:'#6a5444', furD = flash?HIT_FLASH:'#241a14', frost = flash?HIT_FLASH:'#dceaf3', ice = flash?HIT_FLASH:'#9fd6f2';
  // legs: thick pillars with frost-caked feet
  const legs = [[-24,walk],[-9,-walk],[14,-walk],[29,walk]];
  for(const [lx,w] of legs){
    const front = lx>=14, lift = rear>0 && front;
    const fx = lift ? lx+4+rear*14 : lx+w*3, fy = lift ? by+32-rear*26 : by+32;
    ctx.strokeStyle = furD; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(lx,by+6); ctx.lineTo(fx,fy); ctx.stroke();
    ctx.fillStyle = frost; ctx.beginPath(); ctx.ellipse(fx, fy+1, 7, 3.2, 0, 0, 7); ctx.fill();
  }
  // body + towering shoulder hump
  const bg = ctx.createLinearGradient(-30,by-30,30,by+12); bg.addColorStop(0,furL); bg.addColorStop(1,fur);
  ctx.fillStyle = flash?HIT_FLASH:bg; ctx.strokeStyle=furD; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,by-4,36,20,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(13,by-22,19,15,0,0,7); ctx.fill(); ctx.stroke();
  // jagged ice spikes along the spine
  ctx.fillStyle = ice; ctx.strokeStyle = 'rgba(30,60,80,0.6)'; ctx.lineWidth = 1;
  for(const [sx,sy,h] of [[-24,by-17,8],[-12,by-22,11],[1,by-30,14],[13,by-36,17],[24,by-30,12]]){ ctx.beginPath(); ctx.moveTo(sx-4,sy+3); ctx.lineTo(sx+1,sy-h); ctx.lineTo(sx+5,sy+3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // frost streaks on the hide
  ctx.strokeStyle = 'rgba(220,236,246,0.32)'; ctx.lineWidth = 1.2;
  for(let i=0;i<7;i++){ const x0 = -28+i*8; ctx.beginPath(); ctx.moveTo(x0, by-12+(i%2)*4); ctx.lineTo(x0+3, by-4+(i%3)*3); ctx.stroke(); }
  // shaggy skirt with frosted tips and icicles
  ctx.fillStyle = furD;
  ctx.beginPath(); ctx.moveTo(-34,by+4);
  for(let i=0;i<10;i++){ ctx.lineTo(-34+i*7.6, by+4+(i%2?12:3)); }
  ctx.lineTo(34,by+4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = frost; for(let i=1;i<10;i+=2){ ctx.beginPath(); ctx.arc(-34+i*7.6, by+14, 1.8, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(200,232,250,0.85)';
  for(const ix of [-20,-6,8,20]){ ctx.beginPath(); ctx.moveTo(ix-2.5, by+12); ctx.lineTo(ix+2.5, by+12); ctx.lineTo(ix, by+21+Math.sin(ix)*2); ctx.closePath(); ctx.fill(); }
  // head (lowered, heavy brow)
  const hx=40, hy=by-12-rear*6;
  // the FAR tusk first, so the head covers its root
  ctx.strokeStyle = flash?HIT_FLASH:'#d9cfb4'; ctx.lineWidth=5;
  ctx.beginPath(); ctx.moveTo(hx+1,hy+9); ctx.quadraticCurveTo(hx+24,hy+28,hx+27,hy+6); ctx.stroke();
  ctx.strokeStyle = ice; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(hx+25,hy+16); ctx.quadraticCurveTo(hx+28,hy+10,hx+27,hy+6); ctx.stroke();
  // ear
  ctx.fillStyle = furD; ctx.beginPath(); ctx.ellipse(hx-8,hy-1,8,11,0.3,0,7); ctx.fill();
  ctx.fillStyle = flash?HIT_FLASH:furL; ctx.strokeStyle=furD; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(hx,hy,14,13,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = furD; ctx.beginPath(); ctx.moveTo(hx-6,hy-9); ctx.quadraticCurveTo(hx+6,hy-15,hx+13,hy-6); ctx.lineTo(hx+8,hy-4); ctx.quadraticCurveTo(hx+2,hy-9,hx-6,hy-6); ctx.closePath(); ctx.fill();   // brow
  ctx.fillStyle = frost; ctx.beginPath(); ctx.ellipse(hx-2,hy-11,9,3,-0.2,0,7); ctx.fill();   // frost on the crown
  // trunk (raised and curled while it trumpets)
  ctx.strokeStyle = flash?HIT_FLASH:fur; ctx.lineWidth=9;
  ctx.beginPath(); ctx.moveTo(hx+9,hy+3);
  if(rear>0.3) ctx.quadraticCurveTo(hx+30,hy-6,hx+26,hy-26); else ctx.quadraticCurveTo(hx+24,hy+15+walk*2,hx+15,hy+32);
  ctx.stroke();
  // frost breath from the trunk
  ctx.fillStyle = 'rgba(225,240,250,0.45)';
  for(let i=0;i<3;i++){ const u = (t*0.8+i/3)%1, bx = rear>0.3 ? hx+26 : hx+15, byy = rear>0.3 ? hy-28 : hy+33; ctx.globalAlpha = 0.5*(1-u); ctx.beginPath(); ctx.arc(bx+u*10, byy-u*8, 2+u*5, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  // the NEAR tusk, long and sheathed in ice at the tip
  ctx.strokeStyle = flash?HIT_FLASH:'#f1ead2'; ctx.lineWidth=6;
  ctx.beginPath(); ctx.moveTo(hx+6,hy+7); ctx.quadraticCurveTo(hx+40,hy+20,hx+35,hy-12); ctx.stroke();
  ctx.strokeStyle = ice; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(hx+39,hy+4); ctx.quadraticCurveTo(hx+38,hy-5,hx+35,hy-12); ctx.stroke();
  // glowing ice-blue eye
  ctx.save(); ctx.shadowColor = '#6fe0ff'; ctx.shadowBlur = 8; ctx.fillStyle = flash?'#fff':'#bff4ff';
  ctx.beginPath(); ctx.ellipse(hx+5,hy-4,2.8,1.8,-0.3,0,7); ctx.fill(); ctx.restore();
  ctx.restore();
  // hp bar above
  if(e.hp<e.maxHp){
    const bw=70, bx=iso.x-bw/2, byy=iso.y-92*s-6;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx,byy,bw,6);
    ctx.fillStyle='#d94a3a'; ctx.fillRect(bx,byy,bw*Math.max(0,e.hp/e.maxHp),6);
  }
}
