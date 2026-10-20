// ---------------- v225: Dark Crypt boss -- The Wraith Lord ----------------
// Opened from the big crypt at the end of the Dark Crypt. Fire-sword melee with three telegraphed moves, and at
// 70% / 40% / 15% life he dissolves into an IMMUNE shadow that circles you while skeletons and brutes pour in,
// then pops up behind you with a ring strike.
const WR_SLASH_TELE = 0.8, WR_SLASH_R = 155, WR_SLASH_HALF = 0.95, WR_SLASH_DMG = 1.4;
const WR_RING_TELE = 1.15, WR_RING_R = 195, WR_RING_DMG = 1.3;
const WR_WAVE_TELE = 0.95, WR_WAVE_LEN = 560, WR_WAVE_W = 92, WR_WAVE_DMG = 1.5;
const WR_AMB_TELE = 0.75, WR_AMB_R = 150, WR_AMB_DMG = 1.8;
const WR_PHASES = [0.70, 0.40, 0.15];
const WR_SHADOW_DUR = 9, WR_ADD_CAP = 8;
const WR_SEQ = ['slash','ring','wave','slash','wave','ring'];
// v240: every phase shift makes his big telegraphed attacks 5% faster (shorter wind-ups); base movement is 5% quicker too
function wrTele(e, base){ const v = base/Math.pow(1.05, e.wrPhase||0); e.wrTMax = v; return v; }
function initWraith(e){
  e.speed = (e.speed||60)*1.05;
  e.wraith = true; e.isLairBoss = true; e.bossName = 'The Wraith Lord'; e.baseR = 26; e.engaged = true;
  e.wrState = 'rise'; e.wrT = 2.2; e.wrCd = 1.4; e.wrSeq = 0; e.wrPhase = 0; e.wrImmune = true; e.wrLockHp = e.hp;
  e.wrAlpha = 0; e.wrShadowA = 0; e.wrDir = 0; e.wrAng = 0; e.wrOrbDir = 1; e.wrAddT = 0; e.wrAmb = null;
}
function wraithHit(g, e, target, mult, kb){
  const dmg = teleDmg(e, mult);
  if(target===g.player) playerDamage(g, dmg, e, kb); else applyFollowerDamage(g, target, dmg, e);
}
function wraithFloorOk(room, x, y){
  if(x<60 || y<60 || x>room.w-60 || y>room.h-60) return false;
  if(room.floorRects && !room.floorRects.some(r=> x>r.x+34 && x<r.x+r.w-34 && y>r.y+34 && y<r.y+r.h-34)) return false;
  if(room.obstacles && posBlockedByObstacles(x, y, 26, room.obstacles)) return false;
  return true;
}
function wraithSpawnAdd(g, e, type){
  const p = g.player, room = g.room;
  for(let i=0;i<24;i++){
    const a = Math.random()*Math.PI*2, d = 230+Math.random()*170;
    const x = p.x+Math.cos(a)*d, y = p.y+Math.sin(a)*d;
    if(!wraithFloorOk(room, x, y)) continue;
    const m = spawnEnemy(g, type, {x, y}); if(!m) return null;
    m.wrAdd = true; m.engaged = true; m.aggroed = true;
    g.particles.push({type:'burst', x, y, t:0.45, max:0.45, color:'#7a5cff'});
    return m;
  }
  return null;
}
function wraithStartShadow(g, e){
  const p = g.player;
  e.wrPhase++; e.wrState = 'fadeOut'; e.wrT = 0.7; e.wrImmune = true; e.wrLockHp = e.hp;
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:150, color:'#6a4cff'});
  showMsg('The Wraith Lord dissolves into shadow...', 2.2, '#b9a8ff');
  const brutes = 2 + (e.wrPhase>=3 ? 1 : 0);
  for(let i=0;i<brutes;i++) wraithSpawnAdd(g, e, 'skeletonbrute');
}
function wraithFace(e, ang){ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); }
function updateWraith(g, e, dt){
  const p = g.player, room = g.room;
  e.animT = (e.animT||0) + dt; if(e.hitT>0) e.hitT -= dt;
  e.stunT = 0; e.frozenT = 0; e.fearT = 0; e.staggerT = 0; e.trapRootT = 0; e.windT = 0; e.moving = false;
  const target = pickEnemyTarget(g, e);
  if(e.wrImmune) e.hp = e.wrLockHp;
  const st = e.wrState;
  if(st==='rise'){
    e.wrT -= dt; e.wrAlpha = clamp(1 - e.wrT/2.2, 0, 1);
    if(Math.random()<0.5) g.particles.push({type:'burst', x:e.x+rand(-30,30), y:e.y+rand(-30,30), t:0.4, max:0.4, color:'#7a5cff'});
    if(e.wrT<=0){ e.wrState = 'chase'; e.wrImmune = false; e.wrAlpha = 1; e.wrCd = 1.0; }
  } else if(st==='fadeOut'){
    e.wrT -= dt; e.wrAlpha = clamp(e.wrT/0.7, 0, 1); e.wrShadowA = 1 - e.wrAlpha;
    if(e.wrT<=0){
      e.wrState = 'shadow'; e.wrT = WR_SHADOW_DUR + (e.wrPhase>=3 ? 2 : 0); e.wrAlpha = 0; e.wrShadowA = 1;
      e.wrAng = Math.atan2(e.y-p.y, e.x-p.x); e.wrOrbDir = Math.random()<0.5 ? 1 : -1; e.wrAddT = 0.5;
    }
  } else if(st==='shadow'){
    e.wrT -= dt; e.wrImmune = true;
    e.wrAng += e.wrOrbDir*(1.5 + 0.35*e.wrPhase)*dt;
    if(Math.random()<0.012*60*dt) e.wrOrbDir *= -1;
    let R = 215 + 55*Math.sin((e.animT||0)*1.7);
    let nx = p.x, ny = p.y;
    for(let k=0;k<5;k++){
      nx = p.x + Math.cos(e.wrAng)*R; ny = p.y + Math.sin(e.wrAng)*R;
      if(wraithFloorOk(room, nx, ny)) break;
      R *= 0.72;
    }
    e.x += (nx-e.x)*Math.min(1, dt*9); e.y += (ny-e.y)*Math.min(1, dt*9); e.moving = true;
    if(Math.random()<0.5) g.particles.push({type:'burst', x:e.x+rand(-10,10), y:e.y+rand(-10,10), t:0.35, max:0.35, color:'#2a1650'});
    e.wrAddT -= dt;
    if(e.wrAddT<=0){
      e.wrAddT = Math.max(0.8, 1.6 - 0.25*e.wrPhase);
      const alive = g.enemies.filter(x=>x.wrAdd && x.hp>0).length;
      if(alive < WR_ADD_CAP) wraithSpawnAdd(g, e, 'skeleton');
    }
    if(e.wrT<=0){
      // pop up BEHIND the player (opposite the way they're moving / facing)
      const fx = p.facing ? p.facing.x : 1, fy = p.facing ? p.facing.y : 0, fl = Math.hypot(fx,fy)||1;
      let bx = p.x - fx/fl*150, by = p.y - fy/fl*150;
      if(!wraithFloorOk(room, bx, by)){ bx = p.x + fx/fl*150; by = p.y + fy/fl*150; }
      if(!wraithFloorOk(room, bx, by)){ bx = p.x; by = p.y; }
      e.x = bx; e.y = by; e.wrState = 'ambushTele'; e.wrT = wrTele(e, WR_AMB_TELE); e.wrImmune = false; e.wrShadowA = 0; e.wrAlpha = 0;
      wraithFace(e, Math.atan2(p.y-e.y, p.x-e.x));
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#6a4cff'});
    }
  } else if(st==='ambushTele'){
    e.wrT -= dt; e.wrAlpha = clamp(1 - e.wrT/(e.wrTMax||WR_AMB_TELE)*1.4, 0, 1); e.atkAnimT = 0.1;
    if(e.wrT<=0){
      e.wrAlpha = 1;
      const R = WR_AMB_R;
      if(dist(e,p) < R+p.r) wraithHit(g, e, p, WR_AMB_DMG);
      if(g.followers) for(const f of g.followers) if(dist(e,f) < R+f.r) wraithHit(g, e, f, WR_AMB_DMG);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:R, color:'#ff7a2a'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#ffb05a'});
      shakeScreen(g, 5, 0.25);
      e.wrState = 'recover'; e.wrT = 1.6;
    }
  } else {
    e.wrAlpha = 1; e.wrShadowA = 0; e.wrImmune = false;
    if(!target){ return; }
    const d = dist(e, target);
    if(st==='chase'){
      if(e.wrPhase<3 && e.hp <= e.maxHp*WR_PHASES[e.wrPhase]){ wraithStartShadow(g, e); return; }
      e.wrCd -= dt;
      const ang = Math.atan2(target.y-e.y, target.x-e.x);
      if(e.wrCd<=0){
        let pick = WR_SEQ[e.wrSeq % WR_SEQ.length]; e.wrSeq++;
        if(pick!=='wave' && d>330) pick = 'wave';
        if(pick==='wave' && d<130) pick = 'ring';
        e.wrDir = ang; wraithFace(e, ang);
        if(pick==='slash'){ e.wrState = 'slashTele'; e.wrT = wrTele(e, WR_SLASH_TELE); }
        else if(pick==='ring'){ e.wrState = 'ringTele'; e.wrT = wrTele(e, WR_RING_TELE); }
        else { e.wrState = 'waveTele'; e.wrT = wrTele(e, WR_WAVE_TELE); }
        return;
      }
      if(d > e.r+target.r+70){
        const a2 = steerAngleTo(e, target.x, target.y, room.obstacles);
        e.x += Math.cos(a2)*e.speed*dt; e.y += Math.sin(a2)*e.speed*dt; e.moving = true; wraithFace(e, a2);
      } else wraithFace(e, ang);
    } else if(st==='slashTele'){
      e.wrT -= dt; e.atkAnimT = 0.1;
      if(e.wrT<=0){
        const R = WR_SLASH_R;
        const inCone = (t)=>{ const dd = dist(e,t); if(dd > R+t.r) return false; let da = Math.atan2(t.y-e.y, t.x-e.x) - e.wrDir; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) <= WR_SLASH_HALF || dd < t.r+e.r+18; };
        if(inCone(p)) wraithHit(g, e, p, WR_SLASH_DMG, {x:Math.cos(e.wrDir)*60, y:Math.sin(e.wrDir)*60});
        if(g.followers) for(const f of g.followers) if(inCone(f)) wraithHit(g, e, f, WR_SLASH_DMG);
        g.particles.push({type:'slash', x:e.x+Math.cos(e.wrDir)*50, y:e.y+Math.sin(e.wrDir)*50, t:0.3, max:0.3, ang:e.wrDir, color:'#ff9a3a'});
        g.particles.push({type:'burst', x:e.x+Math.cos(e.wrDir)*90, y:e.y+Math.sin(e.wrDir)*90, t:0.35, max:0.35, color:'#ff7a2a'});
        shakeScreen(g, 3, 0.18);
        e.wrState = 'recover'; e.wrT = 0.9;
      }
    } else if(st==='ringTele'){
      e.wrT -= dt; e.atkAnimT = 0.1;
      if(e.wrT<=0){
        const R = WR_RING_R;
        if(dist(e,p) < R+p.r) wraithHit(g, e, p, WR_RING_DMG);
        if(g.followers) for(const f of g.followers) if(dist(e,f) < R+f.r) wraithHit(g, e, f, WR_RING_DMG);
        g.particles.push({type:'ring', x:e.x, y:e.y, t:0.55, max:0.55, r:R, color:'#ff7a2a'});
        g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#ffb05a'});
        shakeScreen(g, 4, 0.22);
        e.wrState = 'recover'; e.wrT = 1.0;
      }
    } else if(st==='waveTele'){
      e.wrT -= dt; e.atkAnimT = 0.1;
      if(e.wrT<=0){
        const ca = Math.cos(e.wrDir), sa = Math.sin(e.wrDir);
        const inLane = (t)=>{ const rx = t.x-e.x, ry = t.y-e.y; const u = rx*ca+ry*sa, v = -rx*sa+ry*ca; return u>-10 && u<WR_WAVE_LEN+t.r && Math.abs(v) < WR_WAVE_W/2+t.r; };
        if(inLane(p)) wraithHit(g, e, p, WR_WAVE_DMG, {x:ca*70, y:sa*70});
        if(g.followers) for(const f of g.followers) if(inLane(f)) wraithHit(g, e, f, WR_WAVE_DMG);
        for(let u=40; u<WR_WAVE_LEN; u+=55) g.particles.push({type:'burst', x:e.x+ca*u, y:e.y+sa*u, t:0.4, max:0.4, color:'#ff7a2a'});
        shakeScreen(g, 3, 0.2);
        e.wrState = 'recover'; e.wrT = 1.1;
      }
    } else { // recover
      e.wrT -= dt;
      if(e.wrT<=0){ e.wrState = 'chase'; e.wrCd = 1.6; }
    }
  }
  const wer = g.crypt && g.crypt.exitRoom;   // v240: he can never leave the boss chamber
  const keepIn = ()=>{ if(wer){ e.x = clamp(e.x, wer.x+e.r+24, wer.x+wer.w-e.r-24); e.y = clamp(e.y, wer.y+e.r+24, wer.y+wer.h-e.r-24); } };
  keepIn();
  pushOutOfObstacles(e, room.obstacles);
  keepIn();
  e.x = clamp(e.x, e.r, room.w-e.r); e.y = clamp(e.y, e.r, room.h-e.r);
}
function wraithDefeated(g, e){
  const c = g.crypt; if(!c) return;
  c.wraithDone = true; c.chestDelay = 2.4;
  g.flashT = 2.2;
  bossMsg("I'LL NEVER DIE!...", '', 3.8);
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.9, max:0.9, r:260, color:'#ffffff'});
  for(const x of g.enemies) if(x.wrAdd) x.hp = 0, x.noReward = true;
}
function goldPop(g, x, y, amt){ g.particles.push({type:'num', x, y, t:1.0, max:1.0, text:'+'+Math.round(amt)+' gold', gold:true}); }
function drawWraithTelegraph(e){
  const st = e.wrState;
  if(st==='slashTele'){
    const frac = clamp(1 - e.wrT/(e.wrTMax||WR_SLASH_TELE), 0, 1), R = WR_SLASH_R;
    const pts = [toIso(e.x, e.y)];
    for(let i=0;i<=16;i++){ const a = e.wrDir - WR_SLASH_HALF + (2*WR_SLASH_HALF)*i/16; pts.push(toIso(e.x+Math.cos(a)*R, e.y+Math.sin(a)*R)); }
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath();
    ctx.fillStyle = 'rgba(255,110,30,'+(0.12+frac*0.3)+')'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,160,70,'+(0.5+frac*0.5)+')'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  } else if(st==='ringTele' || st==='ambushTele'){
    const tele = e.wrTMax || (st==='ringTele' ? WR_RING_TELE : WR_AMB_TELE), R = st==='ringTele' ? WR_RING_R : WR_AMB_R;
    const frac = clamp(1 - e.wrT/tele, 0, 1), iso = toIso(e.x, e.y);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle = 'rgba(255,120,40,'+(0.5+frac*0.5)+')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,90,30,'+(0.10+frac*0.25)+')';
    ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill(); ctx.restore();
  } else if(st==='waveTele'){
    const frac = clamp(1 - e.wrT/(e.wrTMax||WR_WAVE_TELE), 0, 1);
    const ca = Math.cos(e.wrDir), sa = Math.sin(e.wrDir), hw = WR_WAVE_W/2;
    const pts = [[0,-hw],[WR_WAVE_LEN,-hw],[WR_WAVE_LEN,hw],[0,hw]].map(([u,v])=>toIso(e.x+ca*u-sa*v, e.y+sa*u+ca*v));
    ctx.save(); ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<4;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath();
    ctx.fillStyle = 'rgba(255,110,30,'+(0.12+frac*0.3)+')'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,160,70,'+(0.5+frac*0.5)+')'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }
}
function drawWraithIso(e){
  const iso = toIso(e.x, e.y), t = e.animT||0, s = e.r/18;
  const a = e.wrAlpha==null ? 1 : e.wrAlpha, sa = e.wrShadowA||0;
  e._eye = null;
  drawShadow(iso.x, iso.y, 30*s*Math.max(0.35,a), 11*s*Math.max(0.35,a));
  if(sa>0.02){
    // the shadow form: a smoky black patch with trailing wisps
    ctx.save(); ctx.translate(iso.x, iso.y-8*s); ctx.globalAlpha = sa;
    const gr = ctx.createRadialGradient(0,0,2,0,0,40*s);
    gr.addColorStop(0,'rgba(0,0,0,0.95)'); gr.addColorStop(0.6,'rgba(12,6,24,0.7)'); gr.addColorStop(1,'rgba(12,6,24,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0,0,44*s,30*s,0,0,7); ctx.fill();
    for(let i=0;i<5;i++){
      const ph = t*3+i*1.3; ctx.fillStyle = 'rgba(8,4,18,'+(0.5-i*0.07)+')';
      ctx.beginPath(); ctx.ellipse(Math.cos(ph)*22*s, Math.sin(ph*1.2)*14*s-6*s, (16-i*2)*s, (9-i)*s, ph, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  if(a<=0.03) return;
  const hover = 12*s + Math.sin(t*2.2)*3;
  const fs = e.faceSign||1;
  const raise = (e.wrState==='slashTele'||e.wrState==='ringTele'||e.wrState==='waveTele'||e.wrState==='ambushTele') ? 1 : 0;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(iso.x, iso.y-hover); ctx.scale(s, s);
  // tattered robe
  ctx.fillStyle = '#0a0810';
  ctx.beginPath(); ctx.moveTo(-15,-58); ctx.quadraticCurveTo(-28,-20,-24,8);
  for(let i=0;i<=6;i++){ const x = -24+i*8, y = 8+((i%2)?9:1)+Math.sin(t*3+i)*2.2; ctx.lineTo(x,y); }
  ctx.quadraticCurveTo(28,-20,15,-58); ctx.closePath(); ctx.fill();
  const rg = ctx.createLinearGradient(0,-58,0,10); rg.addColorStop(0,'rgba(90,70,130,0.35)'); rg.addColorStop(1,'rgba(10,8,16,0)');
  ctx.fillStyle = rg; ctx.fill();
  // arm + fiery longsword
  const hx = 18*fs, hy = -32;
  const swAng = raise ? (-1.15*fs) : (-0.55*fs + Math.sin(t*2)*0.06*fs);
  ctx.fillStyle = '#0a0810'; ctx.beginPath(); ctx.ellipse(hx*0.7, hy+2, 9, 5, 0.4*fs, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(swAng);
  const bl = 62;
  const bg = ctx.createLinearGradient(0,0,0,-bl); bg.addColorStop(0,'#ffd27a'); bg.addColorStop(0.5,'#ff7a1a'); bg.addColorStop(1,'#ffe6a0');
  ctx.fillStyle = '#3a2a1a'; ctx.fillRect(-2,0,4,9); ctx.fillStyle = '#7a5a2a'; ctx.fillRect(-7,-2,14,3);
  ctx.shadowColor = '#ff6a1a'; ctx.shadowBlur = 14;
  ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(-3,-2); ctx.lineTo(-2.4,-bl+8); ctx.lineTo(0,-bl); ctx.lineTo(2.4,-bl+8); ctx.lineTo(3,-2); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  for(let i=0;i<6;i++){
    const fy = -8-i*9, fl = Math.sin(t*9+i*1.7);
    ctx.fillStyle = 'rgba(255,'+(120+i*18)+',40,'+(0.55-i*0.05)+')';
    ctx.beginPath(); ctx.ellipse(fl*2.5, fy, 5-i*0.3, 7+fl*1.5, 0, 0, 7); ctx.fill();
  }
  ctx.restore();
  // hood + void face + burning eyes
  ctx.fillStyle = '#0c0a12'; ctx.beginPath(); ctx.moveTo(-13,-54); ctx.quadraticCurveTo(-15,-80,0,-86); ctx.quadraticCurveTo(15,-80,13,-54); ctx.quadraticCurveTo(0,-46,-13,-54); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0,-66,8,10,0,0,7); ctx.fill();
  ctx.shadowColor = '#ff8a2a'; ctx.shadowBlur = 8; ctx.fillStyle = '#ffa23a';
  ctx.beginPath(); ctx.ellipse(-3.6,-67,1.9,1.3,0,0,7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.6,-67,1.9,1.3,0,0,7); ctx.fill();
  ctx.restore();
  if(a>0.5) e._eye = {x:iso.x, y:iso.y-hover-67*s, dx:3.6*s, r:2.2, c:'#ffa23a'};
}

// the big crypt at the end of the Dark Crypt (drawn as stone blocks; the lid slides off when opened)
// v310: a heavy stone doorway with a faint violet glow inside
function drawTombDoorIso(d, clock){
  const iso = toIso(d.x, d.y), cx = iso.x, cy = iso.y, pulse = 0.5+0.5*Math.sin(clock*2.2);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx, cy+4, 38, 14, 0, 0, 7); ctx.fill();
  // dark opening
  ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.moveTo(cx-22, cy); ctx.lineTo(cx-22, cy-46); ctx.arc(cx, cy-46, 22, Math.PI, 0); ctx.lineTo(cx+22, cy); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.10+0.08*pulse;
  const gr = ctx.createRadialGradient(cx, cy-26, 2, cx, cy-26, 34); gr.addColorStop(0,'#9a6aff'); gr.addColorStop(1,'rgba(120,70,255,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy-26, 34, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // stone frame
  ctx.fillStyle = '#6a6d76'; ctx.strokeStyle = 'rgba(8,8,14,0.8)'; ctx.lineWidth = 1.2;
  ctx.fillRect(cx-30, cy-48, 9, 48); ctx.strokeRect(cx-30, cy-48, 9, 48);
  ctx.fillRect(cx+21, cy-48, 9, 48); ctx.strokeRect(cx+21, cy-48, 9, 48);
  ctx.beginPath(); ctx.moveTo(cx-30, cy-48); ctx.arc(cx, cy-48, 30, Math.PI, 0); ctx.lineTo(cx+21, cy-48); ctx.arc(cx, cy-48, 21, 0, Math.PI, true); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#8c8f98'; ctx.fillRect(cx-4, cy-80, 8, 9);   // keystone
  ctx.restore();
}
function drawCryptTomb(tm, clock){
  const R = tm.rect, open = tm.state==='open' ? 1 : tm.state==='opening' ? clamp(1 - tm.t/2.0, 0, 1) : 0;
  const iso = toIso(tm.x, tm.y);
  drawShadow(iso.x, iso.y+18, 150, 44);
  drawBlock(R, 46, '#5b554c', '#2c2822', '#3f3a33');
  const lid = {x:R.x+12+open*96, y:R.y+8, w:R.w-24, h:R.h-16};
  ctx.save(); ctx.translate(0,-46);
  if(open>0){
    const c0=toIso(R.x+12,R.y+8), c1=toIso(R.x+R.w-12,R.y+8), c2=toIso(R.x+R.w-12,R.y+R.h-8), c3=toIso(R.x+12,R.y+R.h-8);
    ctx.fillStyle = '#040206'; ctx.beginPath(); ctx.moveTo(c0.x,c0.y); ctx.lineTo(c1.x,c1.y); ctx.lineTo(c2.x,c2.y); ctx.lineTo(c3.x,c3.y); ctx.closePath(); ctx.fill();
    const gg = ctx.createRadialGradient(iso.x, iso.y, 4, iso.x, iso.y-10, 120);
    gg.addColorStop(0,'rgba(140,90,255,'+(0.55*open)+')'); gg.addColorStop(1,'rgba(140,90,255,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(iso.x, iso.y, 130, 60, 0, 0, 7); ctx.fill();
  }
  drawBlock(lid, 16, '#6a645a', '#34302a', '#494339');
  ctx.restore();
  // carved rune glow on the front face
  ctx.save(); ctx.globalAlpha = 0.35 + 0.15*Math.sin((clock||0)*2);
  ctx.fillStyle = tm.state==='closed' ? '#9a7aff' : '#c8b0ff';
  const fr = toIso(R.x+R.w/2, R.y+R.h);
  for(let i=-2;i<=2;i++){ ctx.fillRect(fr.x+i*22-3, fr.y-36, 6, 14); }
  ctx.restore();
}
