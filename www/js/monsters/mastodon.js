// Woolly Mastodon (Icy Cellar boss): shaggy rust-brown mammoth with a
// trunk and two curved tusks. Same rig conventions as drawBearIso.
// ---------------- Woolly Mastodon AI (v280): its own kit instead of the bear's ----------------
//   Tusk Charge -- locked lane, long wind-up, hits very hard. Earth-Shaking Stomp -- huge ring round itself.
//   Below 50% life: Avalanche -- a barrage of falling ice circles around you, and it moves faster.
const MST_STOMP_R = 180.5, MST_STOMP_IN_R = 90.25, MST_STOMP_OUTER_DMG = 0.6, MST_STOMP_OUTER_DELAY = 0.3, MST_CHARGE_HW = 92, MST_CHARGE_LEN = 760, MST_AVA_R = 105;
function updateMastodon(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  if(e.mSt===undefined){ e.mSt='chase'; e.mT=0; e.mTmax=1; e.mCd=2.2; e.mNext=0; e.mDir=0; e.mHit={}; e.mPts=[]; }
  const st = e.mSt, tgs = [g.player].concat(g.followers||[]), F = e.hp<=e.maxHp*0.5 ? 0.8 : 1;
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  const hit = (tg, mult, kb)=>{ const dm = teleDmg(e, mult); if(tg===g.player) playerDamage(g, dm, e, kb); else applyFollowerDamage(g, tg, dm, e); };
  if(st==='recover'){ e.mT -= dt; e.moving = false; if(e.mT<=0) e.mSt='chase'; return; }
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
    const seq = e.hp<=e.maxHp*0.5 ? ['stomp','avalanche','charge','stomp','charge'] : ['stomp','charge','stomp'];
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
function drawMastodonIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/26;
  drawShadow(iso.x, iso.y, 40*s, 14*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*5) : 0;
  const bob = moving ? Math.abs(Math.sin(t*5))*2 : Math.sin(t*1.6)*0.8;
  const rear = e.mSt==='stompTele' ? clamp(1-e.mT/(e.mTmax||1),0,1) : 0;
  const by = -30+bob-rear*10;
  const fur = flash?HIT_FLASH:'#6d4a32', furL = flash?HIT_FLASH:'#8b6244', furD = flash?HIT_FLASH:'#3d281a';
  ctx.strokeStyle = furD; ctx.lineWidth = 8; ctx.lineCap='round';
  const legs = [[-22,walk],[-8,-walk],[14,-walk],[28,walk]];
  for(const [lx,w] of legs){ ctx.beginPath(); ctx.moveTo(lx,by+6);
    if(rear>0 && lx>=14) ctx.lineTo(lx+4+rear*14, by+30-rear*26);   // v336: front legs lift for the slam
    else ctx.lineTo(lx+w*3,by+30); ctx.stroke(); }
  // body + shoulder hump
  const bg = ctx.createLinearGradient(-30,by-24,30,by+10); bg.addColorStop(0,furL); bg.addColorStop(1,fur);
  ctx.fillStyle = flash?HIT_FLASH:bg; ctx.strokeStyle=furD; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(0,by-4,34,19,0,0,7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(12,by-20,17,12,0,0,7); ctx.fill(); ctx.stroke();
  // shaggy skirt
  ctx.fillStyle = furD;
  ctx.beginPath(); ctx.moveTo(-32,by+4);
  for(let i=0;i<9;i++){ ctx.lineTo(-32+i*8, by+4+(i%2?10:3)); }
  ctx.lineTo(32,by+4); ctx.closePath(); ctx.fill();
  // head
  const hx=38, hy=by-10;
  ctx.fillStyle = flash?HIT_FLASH:furL; ctx.strokeStyle=furD;
  ctx.beginPath(); ctx.ellipse(hx,hy,13,12,0,0,7); ctx.fill(); ctx.stroke();
  // ear
  ctx.fillStyle = furD; ctx.beginPath(); ctx.ellipse(hx-6,hy-2,7,9,0.3,0,7); ctx.fill();
  // trunk
  ctx.strokeStyle = flash?HIT_FLASH:fur; ctx.lineWidth=8;
  ctx.beginPath(); ctx.moveTo(hx+8,hy+2); ctx.quadraticCurveTo(hx+22,hy+14+walk*2,hx+14,hy+30); ctx.stroke();
  // tusks
  ctx.strokeStyle = flash?HIT_FLASH:'#f1ead2'; ctx.lineWidth=4;
  ctx.beginPath(); ctx.moveTo(hx+6,hy+6); ctx.quadraticCurveTo(hx+34,hy+16,hx+30,hy-8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx+2,hy+8); ctx.quadraticCurveTo(hx+26,hy+26,hx+24,hy+4); ctx.stroke();
  // eye
  ctx.fillStyle='#7fe0ff'; ctx.beginPath(); ctx.arc(hx+5,hy-4,2.2,0,7); ctx.fill();
  ctx.restore();
  // hp bar above
  if(e.hp<e.maxHp){
    const bw=70, bx=iso.x-bw/2, byy=iso.y-88*s-6;
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(bx,byy,bw,6);
    ctx.fillStyle='#d94a3a'; ctx.fillRect(bx,byy,bw*Math.max(0,e.hp/e.maxHp),6);
  }
}
