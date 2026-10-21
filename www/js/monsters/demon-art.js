// ---- demon art ----
function drawDemonIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, tp = e.type, kind = e.dboss;
  const look = tp==='hellhound' ? 'hound' : kind==='houndlord' ? 'hound' : (tp==='cinderfiend' || kind==='cinderqueen') ? 'caster' : 'brute';
  const sc = kind==='houndlord' ? 2.0 : kind==='cinderqueen' ? 1.7 : kind==='warden' ? 2.2 : tp==='brimstonebrute' ? (e.bigDemon ? 1.8 : 1.15) : tp==='cinderfiend' ? 0.95 : (tp==='hellhound' ? 1.2 : 0.85);
  const body = flash ? '#fff' : (kind==='houndlord'||tp==='hellhound') ? '#5a2218' : (look==='caster') ? '#3a1030' : '#4a3028';
  const dk = '#140606', acc = e.dbEnr ? '#ff3a1a' : '#ff8a3a', walk = e.moving ? Math.sin(t*9) : 0, bob = e.moving ? Math.abs(walk)*2 : Math.sin(t*1.6)*1.2;
  const tele = e.dbState==='tele' || e.tState==='tele' || e.atkAnimT>0;
  drawShadow(iso.x, iso.y, 20*sc, 7*sc);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*sc, sc); ctx.lineJoin='round'; ctx.lineCap='round'; ctx.strokeStyle = dk; ctx.lineWidth = 1.2;
  if(kind){ const gl = ctx.createRadialGradient(0,-24,3,0,-24,56); gl.addColorStop(0,'rgba(255,110,50,0.3)'); gl.addColorStop(1,'rgba(255,60,30,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-24,56,0,7); ctx.fill(); }
  if(look==='hound'){
    ctx.fillStyle = body; for(const [x,ph] of [[-12,0],[-6,2],[8,1],[14,3]]){ ctx.fillRect(x-1.5+Math.sin(t*9+ph)*(e.moving?3:0),-9,3.5,9); }
    ctx.beginPath(); ctx.ellipse(0,-15-bob,17,8.5,0,0,7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(17,-19-bob,8,6,0.2,0,7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15,-24-bob); ctx.lineTo(13,-31-bob); ctx.lineTo(19,-25-bob); ctx.moveTo(20,-24-bob); ctx.lineTo(21,-31-bob); ctx.lineTo(24,-24-bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16,-16-bob); ctx.lineTo(-26,-20-bob+Math.sin(t*6)*2); ctx.lineTo(-16,-12-bob); ctx.fill();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(21,-20-bob,1.4,0,7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,120,40,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10,-22-bob); ctx.quadraticCurveTo(0,-30-bob,12,-24-bob); ctx.stroke();
    if(tele){ ctx.fillStyle='#fff'; ctx.fillRect(24,-17-bob,3,2); }
  } else if(look==='caster'){
    // v382: legs and cloven hooves under a shorter, tattered robe (it used to trail to the ground with no legs)
    { const lw = e.moving ? Math.sin(t*9)*3 : 0; ctx.strokeStyle = flash?'#fff':'#5a1a30'; ctx.lineWidth = 4; for(const sd of [-1,1]){ const sw = lw*sd; ctx.beginPath(); ctx.moveTo(sd*3.6,-14); ctx.lineTo(sd*5.4+sw*0.4,-7.5); ctx.lineTo(sd*3.6+sw,-2); ctx.stroke(); ctx.fillStyle = flash?'#fff':'#1a0610'; ctx.beginPath(); ctx.moveTo(sd*3.6+sw-2.4,-2.4); ctx.lineTo(sd*3.6+sw+2.8,-2.4); ctx.lineTo(sd*3.6+sw+3.6,0.4); ctx.lineTo(sd*3.6+sw-2.8,0.4); ctx.closePath(); ctx.fill(); } ctx.strokeStyle = dk; ctx.lineWidth = 1.2;
      const tl = Math.sin(t*3.4)*4; ctx.strokeStyle = flash?'#fff':'#5a1a30'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-3,-13); ctx.bezierCurveTo(-12,-10,-14+tl*0.5,-18,-17+tl,-26); ctx.stroke(); ctx.fillStyle = acc; ctx.beginPath(); ctx.moveTo(-17+tl,-31); ctx.lineTo(-14+tl,-25); ctx.lineTo(-20+tl,-25.5); ctx.closePath(); ctx.fill(); ctx.strokeStyle = dk; ctx.lineWidth = 1.2; }
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-9.5,-9-bob); ctx.lineTo(-7,-30-bob); ctx.quadraticCurveTo(0,-38-bob,7,-30-bob); ctx.lineTo(9.5,-9-bob); ctx.lineTo(6,-12.5-bob); ctx.lineTo(3,-8.5-bob); ctx.lineTo(0,-12.5-bob); ctx.lineTo(-3,-8-bob); ctx.lineTo(-6,-12-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#2a0a20'; ctx.beginPath(); ctx.moveTo(-6,-28-bob); ctx.quadraticCurveTo(-30,-44-bob,-22,-14-bob); ctx.lineTo(-8,-20-bob); ctx.moveTo(6,-28-bob); ctx.quadraticCurveTo(30,-44-bob,22,-14-bob); ctx.lineTo(8,-20-bob); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,-36-bob,6,0,7); ctx.fillStyle = body; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a1008'; ctx.beginPath(); ctx.moveTo(-4,-40-bob); ctx.lineTo(-8,-49-bob); ctx.lineTo(-1,-41-bob); ctx.moveTo(4,-40-bob); ctx.lineTo(8,-49-bob); ctx.lineTo(1,-41-bob); ctx.fill();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(-2,-36.5-bob,1.2,0,7); ctx.arc(2.4,-36.5-bob,1.2,0,7); ctx.fill();
    const cg = ctx.createRadialGradient(11,tele?-34-bob:-22-bob,1,11,tele?-34-bob:-22-bob,tele?14:7); cg.addColorStop(0,'rgba(255,200,100,0.95)'); cg.addColorStop(1,'rgba(255,100,40,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(11,tele?-34-bob:-22-bob,tele?14:7,0,7); ctx.fill();
  } else {
    ctx.fillStyle = body; ctx.fillRect(-12+walk*2,-14,9,14); ctx.fillRect(3-walk*2,-14,9,14); ctx.strokeRect(-12+walk*2,-14,9,14); ctx.strokeRect(3-walk*2,-14,9,14);
    ctx.beginPath(); ctx.ellipse(0,-28-bob,18,16,0,0,7); ctx.fill(); ctx.stroke();
    const rise = tele ? -22 : walk*4; ctx.beginPath(); ctx.moveTo(14,-34-bob); ctx.lineTo(28,-14+rise-bob); ctx.lineTo(34,-12+rise-bob); ctx.lineTo(20,-38-bob); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-14,-34-bob); ctx.lineTo(-28,-12-bob); ctx.lineTo(-22,-10-bob); ctx.lineTo(-10,-30-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,-48-bob,8,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6a2a14'; ctx.beginPath(); ctx.moveTo(-6,-53-bob); ctx.lineTo(-13,-65-bob); ctx.lineTo(-2,-55-bob); ctx.moveTo(6,-53-bob); ctx.lineTo(13,-65-bob); ctx.lineTo(2,-55-bob); ctx.fill();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(-3,-48.5-bob,1.5,0,7); ctx.arc(3.4,-48.5-bob,1.5,0,7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,110,40,0.85)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8,-34-bob); ctx.lineTo(-2,-26-bob); ctx.lineTo(-8,-20-bob); ctx.moveTo(8,-36-bob); ctx.lineTo(3,-28-bob); ctx.lineTo(9,-22-bob); ctx.stroke();
  }
  ctx.restore();
  drawHpBar(iso, (look==='hound'?36:look==='caster'?58:72)*sc*0.9+8, e.r, e.hp, e.maxHp);
}

const WL_NAMES = ['The Wraith Lord, Fallen Commander','The Wraith Lord, Unbound','The Wraith Lord, Hold-Bound'];
function spawnWraithLord(g, pos){
  const e = spawnEnemy(g, 'wraithlord', pos);
  e.isLairBoss = true; e.bossName = WL_NAMES[0]; e.wlord = true;
  e.aggroRange = 99999; e.leashRange = 99999; e.wanderRadius = 0; e.baseR = e.r;
  e.wlState = 'dormant'; e.wlT = 0; e.wlCd = 2; e.wlIdx = 0; e.wlPhase = 1; e.wlZones = []; e.wlSummons = 0; e.baseArmor = e.armor;
  return e;
}
function wlHit(g, e, tgt, mult){
  const dm = teleDmg(e, mult), hit = (amt, src)=>{ if(tgt===g.player) playerDamage(g, amt, src); else applyFollowerDamage(g, tgt, amt, src); };
  if((e.wlPhase||1)>=2){   // v427: the flaming sword burns as it cuts -- part physical, part fire
    hit(dm*0.6, e); hit(dm*0.5, {dmgType:'fire', hp:0, x:e.x, y:e.y, r:0});
  } else hit(dm, e);
}
function wlZoneResolve(g, e, z){
  const p = g.player, tgts = [p].concat(g.followers||[]);
  for(const tg of tgts){
    let hit = false;
    if(z.kind==='circle') hit = dist(tg,z) < z.r + (tg.r||10)*0.5;
    else if(z.kind==='cone'){ const a = Math.atan2(tg.y-z.y, tg.x-z.x); let da = Math.abs(a-z.ang); da = Math.min(da, Math.PI*2-da); hit = dist(tg,z) < z.r+(tg.r||10) && da < z.arc/2; }
    else { const dx = Math.cos(z.ang), dy = Math.sin(z.ang), rx = tg.x-z.x, ry = tg.y-z.y, al = rx*dx+ry*dy, pe = Math.abs(-rx*dy+ry*dx); hit = al>-20 && al<z.len+20 && pe < z.r+(tg.r||10)*0.5; }
    if(hit) wlHit(g, e, tg, z.mult||1);
  }
  const col = z.rupt ? '#ff6a3a' : '#c8a8ff';
  if(z.kind==='circle'){ g.particles.push({type:'ring', x:z.x, y:z.y, t:0.45, max:0.45, r:z.r, color:col}); g.particles.push({type:'burst', x:z.x, y:z.y, t:0.4, max:0.4, color:col}); shakeScreen(g, z.rupt?3:5, 0.2); }
  else if(z.kind==='cone'){ g.particles.push({type:'burst', x:z.x+Math.cos(z.ang)*z.r*0.6, y:z.y+Math.sin(z.ang)*z.r*0.6, t:0.3, max:0.3, color:col}); shakeScreen(g, 3, 0.15); }
  else { for(let i=0;i<7;i++) g.particles.push({type:'burst', x:z.x+Math.cos(z.ang)*z.len*i/6, y:z.y+Math.sin(z.ang)*z.len*i/6, t:0.35, max:0.35, color:col}); shakeScreen(g, 4, 0.2); }
}
function wlSpawnMinions(g, e, type, n, rad){
  const room = g.room;
  for(let i=0;i<n;i++){
    const a = Math.PI*2*i/n + Math.random();
    const pos = subFreeSpot(room, e.x+Math.cos(a)*rad-40, e.x+Math.cos(a)*rad+40, e.y+Math.sin(a)*rad-40, e.y+Math.sin(a)*rad+40, null, 20) || {x:e.x+Math.cos(a)*rad, y:e.y+Math.sin(a)*rad};
    const m = spawnEnemy(g, type, pos); if(!m) continue;
    m.aggroRange = 900; m.leashRange = 3000; m.noReward = true; m.wlMinion = true;
    g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.4, max:0.4, color:type==='imp'?'#ff6a3a':'#a070ff'});
  }
}
const WL_SHADOW_DUR = 9;
function wlBreachPos(g, e){
  const t = g.tower; if(t && t.breach) return t.breach;
  if(t && t.props) for(const pr of t.props) if(pr.kind==='breach') return pr;
  return {x:e.x+300, y:e.y, r:120};
}
function wlSigilPos(g, e){
  const t = g.tower; let best = null;
  if(t && t.props) for(const pr of t.props) if(pr.kind==='sigil' && (pr.r||0)>=330) best = pr;
  return best || {x:e.x, y:e.y, r:330};
}
function wlBreachSpawn(g, e, type){
  const room = g.room, b = wlBreachPos(g, e), a = Math.random()*6.28, rd = rand(20,90);
  const bx = b.x+Math.cos(a)*rd, by = b.y+Math.sin(a)*rd+30;
  const pos = subFreeSpot(room, bx-40, bx+40, by-40, by+40, null, 16) || {x:bx, y:by};
  const m = spawnEnemy(g, type, pos); if(!m) return null;
  m.aggroRange = 900; m.leashRange = 3000; m.noReward = true; m.wlMinion = true; m.engaged = true; m.aggroed = true;
  g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.45, max:0.45, color:'#ff6a3a'});
  return m;
}
function wlBigDemon(g, e){
  const m = wlBreachSpawn(g, e, 'brimstonebrute'); if(!m) return;
  m.bigDemon = true; m.r = 38; m.hp = m.maxHp = Math.round(m.maxHp*2.2); m.dmg *= 1.15; m.armor = 16; m.speed *= 1.1;
  g.particles.push({type:'ring', x:m.x, y:m.y, t:0.6, max:0.6, r:110, color:'#ff5a2a'}); shakeScreen(g, 4, 0.3);
}
function wlStartShadow(g, e, np){
  e.wlNext = np; e.wlState = 'fadeOut'; e.wlT = 0.7; e.wlImmune = true; e.wlLockHp = e.hp; e.wlZones.length = 0;
  e.wlShield = false; e.armor = e.baseArmor; e.wlAlpha = 1; e.wlShadowA = 0;
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:170, color:'#6a4cff'});
  showMsg('The Wraith Lord dissolves into shadow...', 2.4, '#b9a8ff'); shakeScreen(g, 6, 0.6);
  if(np===3) g.holdRupt = 1;
}
function wlApplyPhase(g, e){
  e.wlPhase = e.wlNext; e.wlNext = 0; e.wlImmune = false; e.bossName = WL_NAMES[e.wlPhase-1]; e.wlCd = 1.2;
  if(e.wlPhase===2){ e.baseArmor = 8; e.armor = 8; e.speed = 150; bossMsg('THE ARMOR SHATTERS', 'The Wraith Lord is unbound', 3.6); }
  else { e.baseArmor = 6; e.armor = 6; e.speed = 168; e.dmg *= 1.15; e.wlRupT = 2.5; e.wlImpT = 11; bossMsg('THE DEMON HOLD RUPTURES', 'Something vast stirs beyond the breach', 4.0); }
}
function updateWraithLord(g, e, dt, target, d, isFT, chill, room){
  const p = g.player, frac = e.hp/e.maxHp, P = frac>0.66 ? 1 : frac>0.33 ? 2 : 3, F = e.wlPhase===3 ? 0.8 : e.wlPhase===2 ? 0.9 : 1;
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  const toT = ()=>Math.atan2(target.y-e.y, target.x-e.x);
  e.moving = false; e.windT = 0;
  if(e.invulnT>0){ e.invulnT -= dt; if(e.hp<e.guardHp) e.hp = e.guardHp; }
  for(let i=e.wlZones.length-1;i>=0;i--){ const z = e.wlZones[i]; z.t -= dt; if(z.t<=0){ wlZoneResolve(g, e, z); e.wlZones.splice(i,1); } }
  e.x = clamp(e.x, 70, room.w-70); e.y = clamp(e.y, 70, room.h-70);
  const st = e.wlState;
  const go = (state, T, cd)=>{ e.wlState = state; e.wlT = T; if(cd!==undefined) e.wlCd = cd; };
  const stepTo = (tx,ty,mul)=>{ const a2 = steerAngleTo(e, tx, ty, room.obstacles), sp = e.speed*chill*(mul||1)*dt; e.x += Math.cos(a2)*sp; e.y += Math.sin(a2)*sp; e.moving = true; };
  if(st==='dormant'){
    if(d<720 || e.hp<e.maxHp){ e.wlState = 'intro'; e.wlT = 2.4; e.invulnT = 2.4; e.guardHp = e.hp; bossMsg('THE WRAITH LORD', 'Fallen commander of Shadow Keep', 3.4); shakeScreen(g, 4, 0.6); }
    return;
  }
  if(st==='intro'){ e.wlT -= dt; face(toT()); if(e.wlAlpha!=null && e.wlAlpha<1) e.wlAlpha = clamp((2.6-e.wlT)/1.5, 0, 1); if(e.wlT<=0){ e.wlState = 'idle'; e.wlCd = 1.2; e.wlAlpha = 1; } return; }
  if(P>e.wlPhase && !e.wlNext){ wlStartShadow(g, e, e.wlPhase+1); return; }
  if(st==='fadeOut'){
    e.wlT -= dt; e.wlAlpha = clamp(e.wlT/0.7, 0, 1); e.wlShadowA = 1 - e.wlAlpha; e.atkAnimT = 0.1;
    if(e.wlT<=0){
      e.wlState = 'shadow'; e.wlT = WL_SHADOW_DUR + (e.wlNext===3 ? 2 : 0); e.wlAlpha = 0; e.wlShadowA = 1;
      e.wlAng = Math.atan2(e.y-p.y, e.x-p.x); e.wlOrbDir = Math.random()<0.5 ? 1 : -1;
      e.wlImpsLeft = 10; e.wlImpT2 = 0.3; e.wlBigLeft = e.wlNext===2 ? 1 : 3; e.wlBigT = 1.0;
      showMsg('Demons pour from the breach!', 2.4, '#ff9a6a');
    }
    return;
  }
  if(st==='shadow'){
    e.wlT -= dt; e.wlImmune = true; e.wlAlpha = 0; e.wlShadowA = 1; e.moving = true;
    e.wlAng += e.wlOrbDir*(1.5 + 0.35*e.wlNext)*dt; if(Math.random()<0.012*60*dt) e.wlOrbDir *= -1;
    let R = 215 + 55*Math.sin((e.animT||0)*1.7), nx = p.x, ny = p.y;
    for(let k=0;k<5;k++){ nx = p.x + Math.cos(e.wlAng)*R; ny = p.y + Math.sin(e.wlAng)*R; if(wraithFloorOk(room, nx, ny)) break; R *= 0.72; }
    e.x += (nx-e.x)*Math.min(1, dt*9); e.y += (ny-e.y)*Math.min(1, dt*9);
    if(Math.random()<0.5) g.particles.push({type:'burst', x:e.x+rand(-10,10), y:e.y+rand(-10,10), t:0.35, max:0.35, color:'#2a1650'});
    e.wlImpT2 -= dt;
    if(e.wlImpsLeft>0 && e.wlImpT2<=0){ e.wlImpT2 = 0.7; e.wlImpsLeft--; wlBreachSpawn(g, e, 'imp'); }
    e.wlBigT -= dt;
    if(e.wlBigLeft>0 && e.wlBigT<=0){ e.wlBigT = 2.6; e.wlBigLeft--; wlBigDemon(g, e); }
    if(e.wlT<=0){
      const fx = p.facing ? p.facing.x : 1, fy = p.facing ? p.facing.y : 0, fl = Math.hypot(fx,fy)||1;
      let bx = p.x - fx/fl*150, by = p.y - fy/fl*150;
      if(!wraithFloorOk(room, bx, by)){ bx = p.x + fx/fl*150; by = p.y + fy/fl*150; }
      if(!wraithFloorOk(room, bx, by)){ bx = p.x; by = p.y; }
      e.x = bx; e.y = by; e.wlShadowA = 0; e.wlAlpha = 0;
      wlApplyPhase(g, e); face(Math.atan2(p.y-e.y, p.x-e.x));
      e.wlZones.push({kind:'circle', x:e.x, y:e.y, r:190, t:1.0, max:1.0, mult:1.6, col:'255,90,60'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#6a4cff'});
      if(e.wlPhase===2) wlSpawnMinions(g, e, 'wraithling', 3, 220);
      e.wlState = 'emerge'; e.wlT = 1.0;
    }
    return;
  }
  if(st==='emerge'){ e.wlT -= dt; e.wlAlpha = clamp(1 - e.wlT/1.0*1.3, 0, 1); e.atkAnimT = 0.1; if(e.wlT<=0){ e.wlAlpha = 1; shakeScreen(g, 5, 0.25); go('recover', 0.9); } return; }
  // phase 3: the rupture rains fire; the breach keeps feeding him imps
  if(e.wlPhase>=3){
    e.wlRupT -= dt;
    if(e.wlRupT<=0){
      e.wlRupT = rand(1.6,2.5)*(frac<0.15?0.75:1);
      const T = 1.35;
      e.wlZones.push({kind:'circle', x:target.x, y:target.y, r:105, t:T, max:T, mult:0.6, rupt:true, col:'255,90,60'});
      for(let i=0;i<2;i++){ const a = Math.random()*6.28, rd = rand(120,380); e.wlZones.push({kind:'circle', x:clamp(target.x+Math.cos(a)*rd,80,room.w-80), y:clamp(target.y+Math.sin(a)*rd,80,room.h-80), r:105, t:T+0.2, max:T+0.2, mult:0.6, rupt:true, col:'255,90,60'}); }
    }
    e.wlImpT -= dt; if(e.wlImpT<=0){ e.wlImpT = 14; wlSpawnMinions(g, e, 'imp', 2, 220); }
  }
  if(st==='swingTele'){ e.wlT -= dt; e.atkAnimT = 0.12; if(e.wlT<=0){ e.atkAnimT = 0.3; go('recover', 0.45); } return; }
  if(st==='recover'){ e.wlT -= dt; face(toT()); if(e.wlT<=0) e.wlState = 'idle'; return; }
  if(st==='chargeTele' || st==='dashTele'){
    e.wlT -= dt; e.atkAnimT = 0.1;
    if(e.wlT<=0){
      const len = st==='chargeTele' ? 480 : 620;
      for(let i=1;i<=6;i++) g.particles.push({type:'burst', x:e.x+Math.cos(e.wlDirA)*len*i/6, y:e.y+Math.sin(e.wlDirA)*len*i/6, t:0.35, max:0.35, color:st==='dashTele'?'#a070ff':'#c8c8e0'});
      e.x = clamp(e.x+Math.cos(e.wlDirA)*len, 70, room.w-70); e.y = clamp(e.y+Math.sin(e.wlDirA)*len, 70, room.h-70);
      go('recover', st==='chargeTele' ? 0.8 : 0.5);
    }
    return;
  }
  if(st==='shield'){
    e.wlT -= dt; face(toT());
    if(d>e.r+target.r+40) stepTo(target.x, target.y, 0.55);
    if(e.wlT<=0){ e.wlShield = false; e.armor = e.baseArmor; go('recover', 0.5); }
    return;
  }
  if(st==='tpOut'){ e.wlT -= dt; if(e.wlT<=0){
    const a = toT(), bx = target.x+Math.cos(a)*120, by = target.y+Math.sin(a)*120;
    const pos = subFreeSpot(room, bx-50, bx+50, by-50, by+50, null, 20); if(pos){ e.x = pos.x; e.y = pos.y; } 
    g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#a070ff'}); go('tpIn', 0.3); } return; }
  if(st==='tpIn'){ e.wlT -= dt; face(toT()); if(e.wlT<=0){ const T = 0.55*F; e.wlZones.push({kind:'cone', x:e.x, y:e.y, ang:toT(), arc:2.0, r:170, t:T, max:T, mult:1.0}); go('swingTele', T); } return; }
  if(st==='blastTele'){
    e.wlT -= dt; e.atkAnimT = 0.1; face(toT());
    if(e.wlT<=0){
      const n = e.wlPhase===3 ? 16 : 12, off = Math.random()*6.28;
      for(let i=0;i<n;i++){ const a = off+Math.PI*2*i/n; g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,r:8,dmg:e.dmg*0.55,from:'enemy',life:2.6,color:'#a070ff',srcEnemy:e,targetRef:target}); }
      const aim = toT(); for(let k=-2;k<=2;k++){ const a = aim+k*0.2; g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*330,vy:Math.sin(a)*330,r:8,dmg:e.dmg*0.6,from:'enemy',life:2.2,color:'#e0b0ff',srcEnemy:e,targetRef:target}); }
      shakeScreen(g, 4, 0.2); go('recover', 0.6);
    }
    return;
  }
  if(st==='summon'){
    e.wlT -= dt; e.atkAnimT = 0.1; face(toT());
    if(e.wlT<=0){
      const C = wlSigilPos(g, e);
      for(let i=0;i<5;i++){
        const ph = -Math.PI/2 + Math.PI*2*i/5, ax = C.x + 0.7*(C.r||330)*0.78*Math.cos(ph-Math.PI/4), ay = C.y + 0.7*(C.r||330)*0.78*Math.sin(ph-Math.PI/4);
        const pos = subFreeSpot(room, ax-30, ax+30, ay-30, ay+30, null, 10) || {x:ax, y:ay};
        const m = spawnEnemy(g, 'skeleton', pos); if(!m) continue;
        m.mini = true; m.hp = m.maxHp = Math.max(1, Math.round(m.maxHp*0.6)); m.aggroRange = 900; m.leashRange = 3000; m.noReward = true; m.wlMinion = true; m.engaged = true; m.aggroed = true;
        g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.5, max:0.5, color:'#ff3a3a'}); g.particles.push({type:'ring', x:pos.x, y:pos.y, t:0.5, max:0.5, r:60, color:'#c02030'});
      }
      if(e.wlPhase>=3) wlSpawnMinions(g, e, 'imp', 2, 200);
      showMsg('Skeletons claw up out of the pentagram!', 2.2, '#e08080');
      go('recover', 0.7);
    }
    return;
  }
  if(st==='siphon'){
    e.wlT -= dt; e.atkAnimT = 0.1; face(toT());
    if(e.wlT<=0){
      let alive = 0; for(const m of g.enemies) if(m.siphImp && m.hp>0) alive++;
      const heal = e.maxHp*0.015*alive; e.hp = Math.min(e.maxHp, e.hp+heal); e.armor = e.baseArmor; e.wlSiph = false;
      showMsg(alive ? 'He feeds on the breach — '+alive+' imp'+(alive>1?'s':'')+' left alive!' : 'The siphon is cut — the imps are dead!', 2.4, alive?'#ff9a6a':'#c8e0ff');
      go('recover', 1.0);
    }
    return;
  }
  // ---- idle: close in, poke, and pick a move ----
  face(toT());
  const want = e.wlPhase===1 ? 70 : 90;
  if(d>e.r+target.r+want) stepTo(target.x, target.y, 1);
  e.atkCd -= dt;
  if(d<e.r+target.r+55 && e.atkCd<=0){ e.atkCd = 1.3; wlHit(g, e, target, 0.45); e.atkAnimT = 0.25; g.particles.push({type:'burst', x:target.x, y:target.y, t:0.25, max:0.25, color:'#c8c8e0'}); }
  e.wlCd -= dt;
  if(e.wlCd>0) return;
  e.wlCd = rand(1.2,2.0)*F;
  if(e.wlPhase===1 && e.wlSummons<2 && frac < (e.wlSummons===0 ? 0.88 : 0.77)){ e.wlSummons++; go('summon', 1.0); return; }
  const seq1 = ['swing','bash','charge','shield','swing','charge'], seq2 = ['dash','blink','blast','summon','siphon','blink','blast','dash'], seq3 = ['dash','blink','blast','blink','summon','blast','dash','swing'];
  const seq = e.wlPhase===1 ? seq1 : e.wlPhase===2 ? seq2 : seq3, mv = seq[e.wlIdx++ % seq.length];
  const T0 = (e.wlPhase===1 ? 0.75 : 0.65)*F;
  if(mv==='swing'){ e.wlZones.push({kind:'cone', x:e.x, y:e.y, ang:toT(), arc:1.9, r:165, t:T0, max:T0, mult:1.0}); go('swingTele', T0); }
  else if(mv==='bash'){ const T = 0.6*F; e.wlZones.push({kind:'circle', x:e.x, y:e.y, r:125, t:T, max:T, mult:0.9, col:'200,200,230'}); go('swingTele', T); }
  else if(mv==='charge'){ e.wlDirA = toT(); const T = 0.9*F; e.wlZones.push({kind:'line', x:e.x, y:e.y, ang:e.wlDirA, len:480, r:55, t:T, max:T, mult:1.1}); go('chargeTele', T); }
  else if(mv==='shield'){ e.wlShield = true; e.armor = 90; go('shield', 2.4); showMsg('He raises his shield — wait it out', 1.8, '#c8c8e0'); }
  else if(mv==='dash'){ e.wlDirA = toT(); const T = 0.85*F; e.wlZones.push({kind:'line', x:e.x, y:e.y, ang:e.wlDirA, len:620, r:48, t:T, max:T, mult:1.1}); go('dashTele', T); }
  else if(mv==='blink'){ go('tpOut', 0.45); g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#a070ff'}); }
  else if(mv==='blast') go('blastTele', 0.9*F);
  else if(mv==='summon') go('summon', 1.0);
  else if(mv==='siphon'){
    e.wlSiph = true; e.armor = 95; go('siphon', 6.5);
    for(let i=0;i<3;i++){ wlSpawnMinions(g, e, 'imp', 1, 200+i*30); const m = g.enemies[g.enemies.length-1]; if(m && m.type==='imp') m.siphImp = true; }
    showMsg('The Wraith Lord drinks from the breach — kill the imps!', 2.6, '#ff9a6a');
  }
}
function wraithLordSlain(g, e){
  const p = g.player;
  p.wraithLordSlain = true; g.holdRupt = 1;
  if(!p.wlSkillReward){ p.wlSkillReward = true; p.skillPoints = (p.skillPoints||0) + 2; showMsg('The Wraith Lord is destroyed: +2 Skill Points', 4.0); }
  for(const o of g.enemies) if(o!==e && o.noReward) o.hp = 0;
  g.wlFlashT = 2.2; shakeScreen(g, 9, 1.2);
  bossMsg('CONTAIN THE BREACH!', 'Set the three Runestones in the altars', 5.0, '#cfe8ff');
  const mq = getQuest(p,'sk_main');
  if(mq && mq.status==='active'){ mq.progress = Math.max(mq.progress,2); mq.desc = 'The Wraith Lord is dead, but the breach he opened stays wide. Set the Defensive, Offensive and Templar Runestones in the three altars around the pentagram to contain it.'; }
  updateQuestBadge();
  saveGame();
}
function openRuneAltar(al){
  const p = game.player; if(!al) return;
  const nm = RUNE_NAMES[al.rune], it = runeItemOf(p, al.rune);
  const sym = {shield:'a shield', sword:'a sword', cross:'a crowned cross'}[al.rune];
  if(it) showNpcText('Altar of the '+nm.replace(' Runestone',''), 'A socket is cut into the old stone, carved with '+sym+'. Your '+nm+' hums as you hold it near, and the curse it carries pulls toward the altar.\n\nSet it in the socket?', 'Place Runestone', ()=>placeRune(al.rune));
  else showNpcText('Altar of the '+nm.replace(' Runestone',''), 'A socket is cut into the old stone, carved with '+sym+'. It is empty.\n\nYou are not carrying the '+nm+'.', 'Leave');
}
function placeRune(rune){
  const g = game, p = g.player; p.runesPlaced = p.runesPlaced || {};
  if(p.runesPlaced[rune] || p.breachContained) return;
  const it = runeItemOf(p, rune); if(!it && !p.skGateOpen) return;
  if(it) p.inventory = p.inventory.filter(x=>x!==it);
  p.runesPlaced[rune] = true;
  const al = g.tower && g.tower.altars ? g.tower.altars.find(x=>x.rune===rune) : null;
  if(al) for(let i=0;i<14;i++){ const a2 = Math.PI*2*i/14; g.particles.push({type:'burst', x:al.x+Math.cos(a2)*50, y:al.y+Math.sin(a2)*50, t:0.7, max:0.7, color:'#9ad0ff'}); }
  shakeScreen(g, 3, 0.4); try{ sfxPlay('banner', 0.6); }catch(e){}
  recalcStats(p); try{ renderInventory(); }catch(e){}
  const n = ['shield','sword','cross'].filter(r=>p.runesPlaced[r]).length;
  if(n<3){ showMsg('The '+RUNE_NAMES[rune]+' is set. '+n+' of 3 placed.', 3.0, '#9ad0ff'); saveGame(); return; }
  p.breachContained = true; g.holdRupt = 1;
  bossMsg('THE BREACH IS CONTAINED', 'Bound to this single portal', 5.0);
  shakeScreen(g, 7, 1.0);
  if(g.tower && g.tower.breach) for(let i=0;i<24;i++){ const a2 = Math.PI*2*i/24; g.particles.push({type:'burst', x:g.tower.breach.x+Math.cos(a2)*230, y:g.tower.breach.y+Math.sin(a2)*230, t:0.8, max:0.8, color:'#9ad0ff'}); }
  const mq = getQuest(p,'sk_main');
  if(mq && mq.status!=='complete'){ mq.status = 'complete'; mq.rewarded = true; mq.progress = mq.total; mq.desc = 'The Wraith Lord is destroyed and the breach is contained to a single portal in the Demon Hold. What stirs beyond it remains.'; p.gold += 3000; gainXp(g, 6000 + g.depth*60); showMsg('Quest complete: The Wraith Lord’s Return', 3.6, '#e8c44a'); }
  ensureBreachQuest(p); updateQuestBadge();
  showNpcText('The Breach Is Contained', 'The third Runestone settles into its altar, and the old Templar wards wake all at once, like men rising from a long vigil.\n\nThe skull-shaped breach does not close. It cannot. But the wards pull it in from every crack and seam in the Keep until it shrinks to a single portal, and the altars hold it there.\n\nSomething vast moves behind it. It does not break through. Not yet.\n\nThe Keep is free of the Wraith Lord, and the Hold is open but contained. Demons will keep coming, but only through that portal. You can enter it and purge them before they escape.', 'Close');
  saveGame();
}
function placeRunestones(){   // legacy hook: place every runestone you carry
  for(const r of ['shield','sword','cross']) if(runeItemOf(game.player, r) || game.player.skGateOpen) placeRune(r);
}
function wlPolyPath(pts){ ctx.beginPath(); pts.forEach((q,i)=>{ const s = toIso(q[0],q[1]); if(i) ctx.lineTo(s.x,s.y); else ctx.moveTo(s.x,s.y); }); ctx.closePath(); }
function drawWlTelegraph(e){
  for(const z of (e.wlZones||[])){
    const k = 1 - clamp(z.t/z.max,0,1), col = z.col || '200,150,255';
    let pts = [];
    if(z.kind==='circle'){ for(let i=0;i<28;i++){ const a = Math.PI*2*i/28; pts.push([z.x+Math.cos(a)*z.r, z.y+Math.sin(a)*z.r]); } }
    else if(z.kind==='cone'){ pts.push([z.x,z.y]); const n = 14; for(let i=0;i<=n;i++){ const a = z.ang - z.arc/2 + z.arc*i/n; pts.push([z.x+Math.cos(a)*z.r, z.y+Math.sin(a)*z.r]); } }
    else { const dx = Math.cos(z.ang), dy = Math.sin(z.ang), nx = -dy*z.r, ny = dx*z.r; pts = [[z.x+nx,z.y+ny],[z.x+dx*z.len+nx,z.y+dy*z.len+ny],[z.x+dx*z.len-nx,z.y+dy*z.len-ny],[z.x-nx,z.y-ny]]; }
    ctx.save(); wlPolyPath(pts);
    ctx.fillStyle = 'rgba('+col+','+(0.10+0.24*k)+')'; ctx.fill();
    ctx.strokeStyle = 'rgba('+col+','+(0.5+0.4*k)+')'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
  }
  if(e.wlState==='siphon' && g_room_breach()){
    const b = g_room_breach(), a = toIso(b.x,b.y), c = toIso(e.x,e.y);
    ctx.save(); ctx.strokeStyle = 'rgba(255,110,70,0.65)'; ctx.lineWidth = 6; ctx.setLineDash([14,10]); ctx.lineDashOffset = -((game.clock||0)*60); ctx.beginPath(); ctx.moveTo(a.x,a.y-40); ctx.lineTo(c.x,c.y-40); ctx.stroke(); ctx.restore();
  }
}
function g_room_breach(){ const t = game.tower; return t && t.breach ? t.breach : null; }
function drawWraithLordIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, P = e.wlPhase||1, st = e.wlState;
  const wa = e.wlAlpha==null ? 1 : e.wlAlpha, sa = e.wlShadowA||0;
  const alpha = (st==='tpOut' ? clamp((e.wlT||0)/0.45,0.08,1) : st==='tpIn' ? clamp(1-(e.wlT||0)/0.3,0.08,1) : 1) * wa;
  const s = e.r/34*1.2, bob = e.moving ? Math.abs(Math.sin(t*3))*2.2 : Math.sin(t*1.3)*1.6;
  const raise = (st==='swingTele'||st==='chargeTele'||st==='dashTele'||st==='blastTele'||st==='summon'||st==='siphon'||st==='emerge') ? 1 : 0, sw = e.atkAnimT>0 && !raise;
  drawShadow(iso.x, iso.y, 46*s*Math.max(0.3,wa), 14*s*Math.max(0.3,wa));
  if(sa>0.02){
    // the shadow form (same smoky patch as the Dark Crypt wraith), bigger
    ctx.save(); ctx.translate(iso.x, iso.y-10*s); ctx.globalAlpha = sa;
    const gr = ctx.createRadialGradient(0,0,2,0,0,48*s); gr.addColorStop(0,'rgba(0,0,0,0.95)'); gr.addColorStop(0.6,'rgba(18,4,16,0.7)'); gr.addColorStop(1,'rgba(18,4,16,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0,0,54*s,36*s,0,0,7); ctx.fill();
    for(let i=0;i<6;i++){ const ph = t*3+i*1.3; ctx.fillStyle = 'rgba(8,2,12,'+(0.5-i*0.06)+')'; ctx.beginPath(); ctx.ellipse(Math.cos(ph)*26*s, Math.sin(ph*1.2)*16*s-6*s, (18-i*2)*s, (10-i)*s, ph, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,60,40,'+(0.5+0.4*Math.sin(t*6))+')'; ctx.beginPath(); ctx.arc(-6*s,-4*s,2.2*s,0,7); ctx.arc(6*s,-4*s,2.2*s,0,7); ctx.fill();
    ctx.restore();
  }
  if(alpha<=0.03) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round';
  const ac = P===3 ? '255,70,50' : P===2 ? '160,100,255' : '255,50,50', pul = 0.5+0.5*Math.sin(t*2.4);
  const gl = ctx.createRadialGradient(0,-60,4,0,-60,120); gl.addColorStop(0,'rgba('+ac+','+(0.20+0.12*pul)+')'); gl.addColorStop(1,'rgba('+ac+',0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-60,120,0,7); ctx.fill();
  ctx.strokeStyle = '#05030a'; ctx.lineWidth = 1.4;
  const spike = (x,y,dx,dy,w)=>{ const l = Math.hypot(dx,dy)||1, nx = -dy/l*w, ny = dx/l*w; ctx.beginPath(); ctx.moveTo(x+nx,y+ny); ctx.lineTo(x+dx,y+dy); ctx.lineTo(x-nx,y-ny); ctx.closePath(); ctx.fill(); ctx.stroke(); };
  if(P===1){
    // ---- the Dark Lord: black spiked plate, jagged crown, a huge serrated blade ----
    const A1 = flash?'#fff':'#2a2834', A2 = flash?'#fff':'#16141e', A3 = flash?'#fff':'#46425a', SP = flash?'#fff':'#0e0c14';
    // cape
    ctx.fillStyle = flash?'#fff':'#2c0a14'; ctx.beginPath(); ctx.moveTo(-20,-102-bob); ctx.lineTo(-34+Math.sin(t*2)*2,-14); ctx.lineTo(-22,-4); ctx.lineTo(-10,-12+Math.sin(t*3)*2); ctx.lineTo(4,-2); ctx.lineTo(18,-12+Math.sin(t*3+1)*2); ctx.lineTo(30+Math.sin(t*2+1)*2,-8); ctx.lineTo(22,-102-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    // legs + knee spikes + boots
    ctx.fillStyle = A2; ctx.fillRect(-13,-40,11,40); ctx.strokeRect(-13,-40,11,40); ctx.fillRect(3,-40,11,40); ctx.strokeRect(3,-40,11,40);
    ctx.fillStyle = SP; spike(-14,-28,-9,-7,3.2); spike(14,-28,9,-7,3.2);
    ctx.fillStyle = A1; ctx.fillRect(-15,-8,14,8); ctx.fillRect(2,-8,14,8);
    // torso
    ctx.fillStyle = A1; ctx.beginPath(); ctx.moveTo(-22,-98-bob); ctx.lineTo(22,-98-bob); ctx.lineTo(16,-40-bob); ctx.lineTo(-16,-40-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A3; ctx.beginPath(); ctx.moveTo(-14,-94-bob); ctx.lineTo(14,-94-bob); ctx.lineTo(10,-58-bob); ctx.lineTo(0,-50-bob); ctx.lineTo(-10,-58-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SP; spike(0,-84-bob,0,-4,0.1); spike(0,-70-bob,0,10,4);
    ctx.strokeStyle = 'rgba(255,50,40,'+(0.55+0.35*pul)+')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6,-88-bob); ctx.lineTo(0,-76-bob); ctx.lineTo(6,-88-bob); ctx.moveTo(0,-76-bob); ctx.lineTo(0,-60-bob); ctx.stroke(); ctx.strokeStyle = '#05030a'; ctx.lineWidth = 1.4;
    ctx.fillStyle = A2; ctx.fillRect(-18,-44-bob,36,6); ctx.strokeRect(-18,-44-bob,36,6);
    ctx.fillStyle = SP; for(let i=-2;i<=2;i++) spike(i*7,-44-bob,0,6,2.2);
    // pauldrons with spikes
    ctx.fillStyle = A1; ctx.beginPath(); ctx.ellipse(-27,-96-bob,13,9,-0.3,0,7); ctx.ellipse(27,-96-bob,13,9,0.3,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SP; spike(-34,-100-bob,-12,-20,3.4); spike(-26,-104-bob,-4,-24,3.4); spike(-18,-103-bob,6,-18,3);
    spike(34,-100-bob,12,-20,3.4); spike(26,-104-bob,4,-24,3.4); spike(18,-103-bob,-6,-18,3);
    // off arm
    ctx.strokeStyle = A2; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-28,-92-bob); ctx.lineTo(-36,-62-bob+Math.sin(t*2)*2); ctx.stroke(); ctx.strokeStyle = '#05030a'; ctx.lineWidth = 1.4;
    ctx.fillStyle = A1; ctx.beginPath(); ctx.arc(-37,-58-bob,6,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle = SP; spike(-40,-60-bob,-8,-4,2.2); spike(-39,-54-bob,-7,4,2);
    // v499: the black spiked kite shield on the off arm -- held low normally, raised in front of him (glowing) for the Shield move
    { const up = st==='shield' || e.wlShield, sx = up ? -8 : -42, sy = (up ? -78 : -54) - bob, ss = up ? 1.25 : 0.9;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(ss, ss);
      if(up){ ctx.shadowColor = '#ff3a2a'; ctx.shadowBlur = 14; }
      ctx.fillStyle = flash?'#fff':A2; ctx.strokeStyle = up ? '#ff4a3a' : '#05030a'; ctx.lineWidth = up ? 2 : 1.4;
      ctx.beginPath(); ctx.moveTo(-15,-24); ctx.lineTo(15,-24); ctx.lineTo(14,2); ctx.lineTo(0,26); ctx.lineTo(-14,2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = flash?'#fff':A3; ctx.beginPath(); ctx.moveTo(-10,-19); ctx.lineTo(10,-19); ctx.lineTo(9,0); ctx.lineTo(0,17); ctx.lineTo(-9,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = SP; spike(-15,-24,-5,-10,3); spike(0,-24,0,-12,3); spike(15,-24,5,-10,3);
      ctx.strokeStyle = 'rgba(255,50,40,'+(0.55+0.35*pul)+')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(0,10); ctx.moveTo(-6,-4); ctx.lineTo(6,-4); ctx.stroke();
      ctx.restore(); }
    // helm + crown of spikes
    ctx.fillStyle = A2; ctx.beginPath(); ctx.moveTo(-12,-124-bob); ctx.lineTo(12,-124-bob); ctx.lineTo(13,-100-bob); ctx.lineTo(-13,-100-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SP; for(let i=-3;i<=3;i++){ const h = (i%2===0) ? 26 : 17; spike(i*4.2,-123-bob,i*0.8,-h,2.6); }
    spike(-12,-116-bob,-12,-10,2.4); spike(12,-116-bob,12,-10,2.4);
    ctx.fillStyle = '#000'; ctx.fillRect(-9,-114-bob,18,5);
    ctx.save(); ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 10; ctx.fillStyle = '#ff3a2a'; ctx.fillRect(-7,-113-bob,5,2.6); ctx.fillRect(2,-113-bob,5,2.6); ctx.restore();
    // sword arm + huge serrated blade
    ctx.strokeStyle = A2; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(28,-92-bob); ctx.lineTo(raise?30:38,raise?-100-bob:-64-bob); ctx.stroke(); ctx.strokeStyle = '#05030a'; ctx.lineWidth = 1.4;
    ctx.save(); ctx.translate(raise?30:38, raise?-100-bob:-64-bob); ctx.rotate(raise ? -0.45 : sw ? 1.05 : 0.18);
    ctx.fillStyle = A1; ctx.beginPath(); ctx.arc(0,0,6,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SP; ctx.fillRect(-2.5,-2,5,16); ctx.fillStyle = A3; ctx.fillRect(-14,-9,28,5); ctx.strokeRect(-14,-9,28,5); spike(-14,-6,-8,-9,2.4); spike(14,-6,8,-9,2.4);
    const BL = 112, bgr = ctx.createLinearGradient(0,-8,0,-BL); bgr.addColorStop(0,'#2a2430'); bgr.addColorStop(0.5,'#4a2a3a'); bgr.addColorStop(1,'#8a2a2a');
    ctx.save(); ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 16; ctx.fillStyle = bgr; ctx.strokeStyle = '#ff4a3a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-6,-10); for(let i=0;i<7;i++){ const y = -14-i*(BL-26)/7; ctx.lineTo(-6-(i%2?0:3.5), y); } ctx.lineTo(0,-BL-4);
    for(let i=6;i>=0;i--){ const y = -14-i*(BL-26)/7; ctx.lineTo(6+(i%2?0:3.5), y); } ctx.lineTo(6,-10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,120,90,'+(0.5+0.4*pul)+')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(0,-BL+6); ctx.stroke();
    ctx.restore();
  } else {
    // ---- the Unbound: a ringwraith ghoul -- tall pointed hood, tattered cloak, flaming sword ----
    const body = flash?'#fff':(P===3?'#1c0a14':'#171024'), body2 = flash?'#fff':(P===3?'#2e1020':'#261a3a');
    const hov = 8 + Math.sin(t*2)*2.5;
    ctx.translate(0,-hov);
    // cloak
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-17,-96-bob);
    ctx.quadraticCurveTo(-36,-50,-34,-4+Math.sin(t*4)*3);
    for(let i=0;i<=7;i++){ const x = -34+i*9.7, y = -2+((i%2)?11:0)+Math.sin(t*4+i)*3; ctx.lineTo(x,y); }
    ctx.quadraticCurveTo(36,-50,17,-96-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = body2; ctx.beginPath(); ctx.moveTo(-10,-92-bob); ctx.quadraticCurveTo(-18,-40,-14,-6); ctx.lineTo(-4,-12); ctx.quadraticCurveTo(-2,-50,-4,-90-bob); ctx.fill();
    // shoulders
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-30,-84-bob); ctx.quadraticCurveTo(0,-104-bob,30,-84-bob); ctx.lineTo(26,-70-bob); ctx.quadraticCurveTo(0,-82-bob,-26,-70-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    // tall POINTED hood
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-17,-84-bob); ctx.quadraticCurveTo(-18,-112-bob,-6,-124-bob); ctx.quadraticCurveTo(0,-134-bob,7,-146-bob+Math.sin(t*2)*1.5);
    ctx.quadraticCurveTo(9,-122-bob,15,-110-bob); ctx.quadraticCurveTo(19,-96-bob,17,-84-bob); ctx.quadraticCurveTo(0,-76-bob,-17,-84-bob); ctx.fill(); ctx.stroke();
    ctx.fillStyle = body2; ctx.beginPath(); ctx.moveTo(-5,-122-bob); ctx.quadraticCurveTo(0,-134-bob,6,-144-bob); ctx.quadraticCurveTo(2,-120-bob,-1,-108-bob); ctx.fill();
    // void face + circlet + eyes
    ctx.fillStyle = '#020104'; ctx.beginPath(); ctx.moveTo(-10,-98-bob); ctx.quadraticCurveTo(0,-114-bob,10,-98-bob); ctx.quadraticCurveTo(8,-82-bob,0,-80-bob); ctx.quadraticCurveTo(-8,-82-bob,-10,-98-bob); ctx.fill();
    ctx.strokeStyle = P===3 ? '#e0a050' : '#b8a8e8'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-11,-101-bob); ctx.quadraticCurveTo(0,-108-bob,11,-101-bob); ctx.stroke(); ctx.strokeStyle = '#05030a'; ctx.lineWidth = 1.4;
    ctx.save(); ctx.shadowColor = P===3 ? '#ff5a2a' : '#c890ff'; ctx.shadowBlur = 10; ctx.fillStyle = P===3 ? '#ff6a3a' : '#e0b8ff';
    ctx.beginPath(); ctx.ellipse(-4,-94-bob,2.4,1.6,0.2,0,7); ctx.ellipse(4,-94-bob,2.4,1.6,-0.2,0,7); ctx.fill(); ctx.restore();
    // off hand, long fingers
    ctx.strokeStyle = body; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-24,-78-bob); ctx.lineTo(-38,-48-bob+Math.sin(t*3)*3); ctx.stroke();
    ctx.lineWidth = 1.6; for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(-38,-48-bob+Math.sin(t*3)*3); ctx.lineTo(-44+i*3,-38-bob+Math.sin(t*3)*3); ctx.stroke(); }
    // flaming sword arm
    const hx = raise?30:38, hy = raise?-108-bob:-60-bob;
    ctx.strokeStyle = body; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(22,-78-bob); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.save(); ctx.translate(hx,hy); ctx.rotate(raise ? -0.5 : sw ? 1.05 : 0.2);
    const BL = 104, fg = ctx.createLinearGradient(0,0,0,-BL); fg.addColorStop(0,'#fff0b0'); fg.addColorStop(0.4,'#ffb030'); fg.addColorStop(1,'#ff4a10');
    ctx.fillStyle = '#2a1a10'; ctx.fillRect(-2.5,-2,5,13); ctx.fillStyle = '#8a6a30'; ctx.fillRect(-9,-4,18,4);
    ctx.save(); ctx.shadowColor = '#ff6a1a'; ctx.shadowBlur = 20; ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(-4,-4); ctx.lineTo(-3.4,-BL+10); ctx.lineTo(0,-BL); ctx.lineTo(3.4,-BL+10); ctx.lineTo(4,-4); ctx.closePath(); ctx.fill(); ctx.restore();
    for(let i=0;i<9;i++){ const fy = -8-i*10.5, fl = Math.sin(t*10+i*1.7); ctx.fillStyle = 'rgba(255,'+(110+i*14)+',30,'+(0.62-i*0.04)+')'; ctx.beginPath(); ctx.ellipse(fl*3, fy, 6.5-i*0.35, 9+fl*2, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,230,150,0.8)'; ctx.beginPath(); ctx.ellipse(Math.sin(t*12)*2,-BL-6,3.5,9,0,0,7); ctx.fill();
    ctx.restore();
    if(P===3){ for(let i=0;i<4;i++){ const a2 = t*1.5+i*1.6; ctx.fillStyle = 'rgba(255,120,40,0.7)'; ctx.fillRect(Math.cos(a2)*30, -70+Math.sin(a2*1.3)*34-((t*20+i*12)%30), 2.5, 2.5); } }
  }
  ctx.restore();
  if(wa>0.35) drawHpBar(iso, 150*s, e.r, e.hp, e.maxHp);
}
function wlDarkFight(g){ const t = g.tower; return !!(g.scene==='lighthouse' && t && t.subzone==='keep' && t.kpArea===7 && t.wlTriggered && !g.player.wraithLordSlain); }
function drawBlackCover(g){
  const t = g.blackFx.t, a = t<0.12 ? t/0.12 : t<0.55 ? 1 : clamp(1-(t-0.55)/0.8, 0, 1);
  if(a<=0.005) return;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore();
}
function drawWhiteFlash(g){
  const el = 2.2 - g.wlFlashT, a = el<0.25 ? el/0.25 : el<0.6 ? 1 : clamp(1-(el-0.6)/1.6, 0, 1);
  if(a<=0.005) return;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore();
}
function drawBreachProp(pr, clk){
  const shrink = pr.hold ? clamp(game.holdShrinkV||0, 0, 1) : 0;
  if(shrink>0.98) return;   // v434: fully shrunk -- a regular red portal stands here instead
  if(shrink>0){ ctx.save(); const sc = 1-shrink; ctx.scale(sc, sc); }
  drawBreachPropBody(pr, clk, shrink);
  if(shrink>0) ctx.restore();
}
function drawBreachPropBody(pr, clk, shrink){
  const R = pr.r||120, rup = shrink>0 ? 0 : (game.holdRuptV||0), big = !!pr.big, contained = !!pr.hold ? false : !!game.player.breachContained;
  // the larger presence beyond the portal
  if(rup>0.02){
    const a = rup*(big?0.85:0.5)*(0.8+0.2*Math.sin(clk*1.3)), sc = R/120*(big?1:0.8);
    ctx.save(); ctx.translate(0,-R*0.9); ctx.scale(sc,sc); ctx.globalAlpha = a;
    ctx.fillStyle = '#12060a'; ctx.beginPath(); ctx.ellipse(0,-30,92,112,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-70,-100); ctx.quadraticCurveTo(-120,-190,-60,-230); ctx.quadraticCurveTo(-72,-160,-36,-126); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(70,-100); ctx.quadraticCurveTo(120,-190,60,-230); ctx.quadraticCurveTo(72,-160,36,-126); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,90,40,'+(0.7+0.3*Math.sin(clk*2))+')'; ctx.beginPath(); ctx.ellipse(-30,-52,13,6,0.3,0,7); ctx.ellipse(30,-52,13,6,-0.3,0,7); ctx.fill();
    ctx.restore();
  }
  ctx.save(); ctx.scale(1, ISO_KY/ISO_KX);
  const RR = R*ISO_KX*Math.SQRT2*0.62, pul = 0.5+0.5*Math.sin(clk*2);
  const g1 = ctx.createRadialGradient(0,0,2,0,0,RR); g1.addColorStop(0,'rgba(255,200,120,0.9)'); g1.addColorStop(0.35,'rgba(255,60,40,'+(0.65+0.2*pul)+')'); g1.addColorStop(1,'rgba(40,0,10,0)');
  ctx.fillStyle = g1; ctx.beginPath(); ctx.arc(0,0,RR*(1+0.05*pul),0,7); ctx.fill();
  ctx.restore();
  // the rip, standing upright
  ctx.save(); ctx.translate(0,-R*0.55);
  const w = R*0.42, h = R*0.95, g2 = ctx.createLinearGradient(0,-h,0,h*0.2); g2.addColorStop(0,'rgba(20,0,10,0.9)'); g2.addColorStop(0.5,'rgba(255,70,40,0.9)'); g2.addColorStop(1,'rgba(255,220,150,0.9)');
  ctx.fillStyle = g2; ctx.strokeStyle = '#1a0408'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,-h); ctx.quadraticCurveTo(w*1.1,-h*0.4,w*0.4,h*0.2); ctx.lineTo(-w*0.5,h*0.2); ctx.quadraticCurveTo(-w*1.0,-h*0.4,0,-h); ctx.fill(); ctx.stroke();
  if(contained){ ctx.strokeStyle = 'rgba(150,200,255,'+(0.5+0.3*pul)+')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0,-h*0.35,w*1.25,h*0.8,0,0,7); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,240,200,0.55)'; ctx.lineWidth = 1.6; for(let i=0;i<4;i++){ const o = (i-1.5)*w*0.35; ctx.beginPath(); ctx.moveTo(o,-h*0.8+Math.sin(clk*2+i)*6); ctx.quadraticCurveTo(o+8*Math.sin(clk*3+i),-h*0.2,o*0.6,h*0.15); ctx.stroke(); }
  ctx.restore();
}
function drawKeepExtraProp(pr, clk){
  const k = pr.kind;
  if(k==='breach'){ drawBreachProp(pr, clk); return true; }
  if(k==='chains'){
    ctx.strokeStyle = '#6a6a78'; ctx.lineWidth = 2.4; for(const o of [-8,0,8]){ for(let y=-130+Math.abs(o); y<-18; y+=11){ ctx.beginPath(); ctx.ellipse(o+Math.sin(clk*0.8+y*0.05+pr.x)*1.5, y, 2.4, 4.2, 0, 0, 7); ctx.stroke(); } }
    ctx.fillStyle = '#3a3a46'; ctx.fillRect(-12,-22,24,6); return true;
  }
  if(k==='rift'){
    const pul = 0.5+0.5*Math.sin(clk*2.6+pr.x*0.01);
    ctx.save(); ctx.scale(1, ISO_KY/ISO_KX);
    const gr = ctx.createRadialGradient(0,0,2,0,0,46); gr.addColorStop(0,'rgba(255,150,70,'+(0.55+0.3*pul)+')'); gr.addColorStop(1,'rgba(200,30,20,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,46,0,7); ctx.fill();
    ctx.strokeStyle = '#120406'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26,6); ctx.lineTo(-10,-4); ctx.lineTo(-2,5); ctx.lineTo(12,-6); ctx.lineTo(28,2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,200,120,0.9)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore(); return true;
  }
  return false;
}
function drawKeepDoor(pos, clock){
  const iso = toIso(pos.x,pos.y), t = clock||0;
  drawShadow(iso.x, iso.y+4, 52, 16);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.lineJoin='round';
  ctx.fillStyle='#2a2636'; ctx.strokeStyle='#0a0810'; ctx.lineWidth=1.5; ctx.fillRect(-46,-100,92,102); ctx.strokeRect(-46,-100,92,102);
  ctx.fillStyle='#030206'; ctx.beginPath(); ctx.moveTo(-28,2); ctx.lineTo(-28,-60); ctx.quadraticCurveTo(-28,-96,0,-98); ctx.quadraticCurveTo(28,-96,28,-60); ctx.lineTo(28,2); ctx.closePath(); ctx.fill();
  const pul = 0.5+0.5*Math.sin(t*1.8), gl = ctx.createRadialGradient(0,-30,3,0,-30,50); gl.addColorStop(0,'rgba(150,80,255,'+(0.3*pul)+')'); gl.addColorStop(1,'rgba(120,40,200,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,-30,50,0,7); ctx.fill();
  ctx.strokeStyle='#4a4660'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-28,2); ctx.lineTo(-28,-60); ctx.quadraticCurveTo(-28,-96,0,-98); ctx.quadraticCurveTo(28,-96,28,-60); ctx.lineTo(28,2); ctx.stroke();
  ctx.restore();
}
function drawKeepWalls(room){
  const wt = 22, hz = 60, wp = room.wallPal;
  drawBlock({x:-wt,y:-wt,w:room.w+wt*2,h:wt}, hz, wp[0],wp[1],wp[2]);
  drawBlock({x:-wt,y:room.h,w:room.w+wt*2,h:wt}, hz, wp[0],wp[1],wp[2]);
  drawBlock({x:-wt,y:0,w:wt,h:room.h}, hz, wp[0],wp[1],wp[2]);
  drawBlock({x:room.w,y:0,w:wt,h:room.h}, hz, wp[0],wp[1],wp[2]);
}
function drawKeepProp(pr, clk){
  const k = pr.kind, p = game.player;
  if(k==='brazier'){ drawMtnDeco({k:'brazier',x:pr.x,y:pr.y,s:pr.s||1}); return; }
  if(k==='grave' || k==='bones'){ drawCliffDeco({k:k,x:pr.x,y:pr.y,s:pr.s||1}); return; }
  if(k==='pew'){ drawBlock({x:pr.x,y:pr.y,w:pr.w,h:pr.h}, 16, '#4a3a2c','#241a12','#32261c'); return; }
  if(KP_BLK[k]){ const B = KP_BLK[k]; drawBlock({x:pr.x,y:pr.y,w:pr.w,h:pr.h}, B[0], B[1], B[2], B[3]);
    if(k==='bunk'){ const c = toIso(pr.x+pr.w/2, pr.y+pr.h/2); ctx.fillStyle = '#8a2a30'; ctx.beginPath(); ctx.ellipse(c.x-4, c.y-B[0]-2, 14, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#d8d0b8'; ctx.beginPath(); ctx.ellipse(c.x+12, c.y-B[0]-3, 6, 3, 0, 0, 7); ctx.fill(); }
    else if(k==='rack'){ const c = toIso(pr.x+pr.w/2, pr.y+pr.h/2); ctx.strokeStyle = '#c8ccd8'; ctx.lineWidth = 2; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(c.x+i*9, c.y-B[0]); ctx.lineTo(c.x+i*9+3, c.y-B[0]-26); ctx.stroke(); } }
    else if(k==='table'){ const c = toIso(pr.x+pr.w/2, pr.y+pr.h/2); ctx.fillStyle = '#d8cfae'; ctx.beginPath(); ctx.ellipse(c.x-10, c.y-B[0]-2, 5, 2.4, 0, 0, 7); ctx.ellipse(c.x+12, c.y-B[0]-1, 4, 2, 0, 0, 7); ctx.fill(); }
    return; }
  if(k==='carpet'){
    const x0 = pr.x-pr.w/2, x1 = pr.x+pr.w/2, y0 = pr.y-pr.h/2, y1 = pr.y+pr.h/2, col = pr.col||'#5a1426';
    const P4 = [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    wlPolyPath(P4); ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#b8964a'; ctx.lineWidth = 2; ctx.stroke();
    const I = 12, P5 = [[x0+I,y0+I],[x1-I,y0+I],[x1-I,y1-I],[x0+I,y1-I]]; wlPolyPath(P5); ctx.strokeStyle = 'rgba(184,150,74,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    return;
  }
  if(k==='machine'){ drawBlock({x:pr.x,y:pr.y,w:pr.w,h:pr.h}, 70, '#5a4a52','#221a20','#3a2e34'); const c = toIso(pr.x+pr.w/2, pr.y+pr.h/2), pul = 0.5+0.5*Math.sin(clk*2.2); ctx.save(); ctx.translate(c.x, c.y-84); const gg = ctx.createRadialGradient(0,0,2,0,0,40); gg.addColorStop(0,'rgba(255,120,70,'+(0.6+0.3*pul)+')'); gg.addColorStop(1,'rgba(255,60,40,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0,0,40,0,7); ctx.fill(); ctx.strokeStyle='#2a1a1e'; ctx.lineWidth=3; ctx.beginPath(); for(let i=0;i<8;i++){ const a = i*Math.PI/4+clk*0.8; ctx.moveTo(Math.cos(a)*10,Math.sin(a)*10); ctx.lineTo(Math.cos(a)*19,Math.sin(a)*19); } ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,12,0,7); ctx.stroke(); ctx.restore(); return; }
  if(k==='bars'){ drawBlock({x:pr.x-pr.w/2,y:pr.y-pr.h/2,w:pr.w,h:pr.h}, 54, '#6a6a78','#2a2a34','#44444f'); return; }
  const iso = toIso(pr.x,pr.y), unread = pr.id && !(p.keepLore && p.keepLore[pr.id]);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.lineJoin='round';
  if(drawKeepExtraProp(pr, clk)){ ctx.restore(); return; }
  if(unread){ const a = 0.25+0.2*Math.sin(clk*3+pr.x); ctx.fillStyle='rgba(255,220,120,'+a+')'; ctx.beginPath(); ctx.ellipse(0,2,26,10,0,0,7); ctx.fill(); }
  if(k==='mural'){
    ctx.fillStyle='#1a1018'; ctx.fillRect(-20,-74,40,70); ctx.fillStyle='#5a2a34'; ctx.fillRect(-17,-71,34,64);
    ctx.fillStyle='#c8a050'; ctx.fillRect(-17,-71,34,3); ctx.fillRect(-17,-10,34,3);
    ctx.fillStyle='#1a0c10'; ctx.beginPath(); ctx.arc(0,-50,6,0,7); ctx.fill(); ctx.fillRect(-6,-44,12,28);
    ctx.strokeStyle='#e8c070'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(0,-30); ctx.lineTo(0,-70); ctx.stroke();
  } else if(k==='tome'){
    drawShadow(0,0,14,5); ctx.fillStyle='#4a3420'; ctx.fillRect(-3,-22,6,22); ctx.beginPath(); ctx.moveTo(-14,-22); ctx.lineTo(14,-22); ctx.lineTo(10,-32); ctx.lineTo(-10,-32); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#d8cfae'; ctx.beginPath(); ctx.moveTo(-9,-30); ctx.lineTo(0,-27); ctx.lineTo(9,-30); ctx.lineTo(9,-24); ctx.lineTo(0,-22); ctx.lineTo(-9,-24); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(220,170,255,'+(0.2+0.15*Math.sin(clk*2))+')'; ctx.beginPath(); ctx.arc(0,-28,14,0,7); ctx.fill();
  } else if(k==='slab'){
    drawShadow(0,0,14,5); ctx.fillStyle='#585468'; ctx.strokeStyle='#1a1822'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-12,-40); ctx.quadraticCurveTo(0,-50,12,-40); ctx.lineTo(12,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(20,18,30,0.8)'; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(-7,-34+i*6); ctx.lineTo(7-(i%2)*3,-34+i*6); ctx.stroke(); }
  } else if(k==='sigil'){
    const r = pr.r||120, pul = 0.55+0.45*Math.sin(clk*1.6);
    ctx.scale(1, ISO_KY/ISO_KX); const RR = r*ISO_KX*Math.SQRT2*0.7;
    ctx.strokeStyle='rgba('+(pr.cl||'200,40,60')+','+(0.35+0.4*pul)+')'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(0,0,RR,0,7); ctx.arc(0,0,RR*0.78,0,7); ctx.stroke();
    ctx.beginPath(); for(let i=0;i<5;i++){ const a = -Math.PI/2+i*Math.PI*4/5; const x = Math.cos(a)*RR*0.78, y = Math.sin(a)*RR*0.78; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); } ctx.closePath(); ctx.stroke();
    ctx.fillStyle='rgba('+(pr.cl2||'120,10,30')+','+(0.12+0.12*pul)+')'; ctx.beginPath(); ctx.arc(0,0,RR,0,7); ctx.fill();
  } else if(k==='altar'){
    if(pr.hold && p.wraithLordSlain && !p.breachContained){   // v427: after the Wraith Lord falls the altar calls for the Runestones
      const pu = 0.6+0.4*Math.sin(clk*2.6);
      const bm = ctx.createLinearGradient(0,-300,0,0); bm.addColorStop(0,'rgba(255,255,255,0)'); bm.addColorStop(1,'rgba(200,230,255,'+(0.5*pu)+')');
      ctx.fillStyle = bm; ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(-10,-300); ctx.lineTo(10,-300); ctx.lineTo(22,0); ctx.closePath(); ctx.fill();
      const hg = ctx.createRadialGradient(0,-24,2,0,-24,120); hg.addColorStop(0,'rgba(220,240,255,'+(0.8*pu)+')'); hg.addColorStop(1,'rgba(120,180,255,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0,-24,120,0,7); ctx.fill();
    }
    drawShadow(0,0,40,13); ctx.fillStyle='#2a2634'; ctx.strokeStyle='#0a0810'; ctx.lineWidth=1.5; ctx.fillRect(-34,-22,68,22); ctx.strokeRect(-34,-22,68,22); ctx.fillStyle='#3a3548'; ctx.fillRect(-28,-34,56,12); ctx.strokeRect(-28,-34,56,12);
    ctx.strokeStyle='rgba(230,60,80,'+(0.5+0.4*Math.sin(clk*2))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-20,-28); ctx.lineTo(20,-28); ctx.moveTo(0,-32); ctx.lineTo(0,-24); ctx.stroke();
  } else if(k==='runealtar'){
    const col = pr.rune==='shield' ? '95,208,255' : pr.rune==='sword' ? '255,154,106' : '255,224,138';
    const placed = !!(p.runesPlaced||{})[pr.rune], live = p.wraithLordSlain && !placed, pu = 0.55+0.45*Math.sin(clk*2.4+pr.x*0.01);
    if(live || placed){ const bm = ctx.createLinearGradient(0,-260,0,-30); bm.addColorStop(0,'rgba('+col+',0)'); bm.addColorStop(1,'rgba('+col+','+((placed?0.55:0.4)*pu)+')'); ctx.fillStyle = bm; ctx.beginPath(); ctx.moveTo(-16,-30); ctx.lineTo(-7,-260); ctx.lineTo(7,-260); ctx.lineTo(16,-30); ctx.closePath(); ctx.fill(); }
    drawShadow(0,0,36,12);
    ctx.lineJoin = 'round'; ctx.strokeStyle='#0a0810'; ctx.lineWidth=1.5;
    ctx.fillStyle='#2a2634'; ctx.fillRect(-26,-18,52,18); ctx.strokeRect(-26,-18,52,18);
    ctx.fillStyle='#3a3548'; ctx.fillRect(-19,-44,38,26); ctx.strokeRect(-19,-44,38,26);
    ctx.fillStyle='#4a445c'; ctx.fillRect(-23,-50,46,8); ctx.strokeRect(-23,-50,46,8);
    const gl = ctx.createRadialGradient(0,-58,1,0,-58,34); gl.addColorStop(0,'rgba('+col+','+(placed ? 0.95 : live ? 0.7*pu+0.2 : 0.12)+')'); gl.addColorStop(1,'rgba('+col+',0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-58,34,0,7); ctx.fill();
    ctx.strokeStyle = 'rgba('+col+','+(placed||live ? 0.95 : 0.35)+')'; ctx.lineWidth = 2.2; ctx.beginPath();
    if(placed){ ctx.fillStyle = 'rgba('+col+',0.9)'; ctx.beginPath(); ctx.moveTo(0,-76); ctx.lineTo(8,-60); ctx.lineTo(0,-50); ctx.lineTo(-8,-60); ctx.closePath(); ctx.fill(); ctx.beginPath(); }
    if(pr.rune==='shield'){ ctx.moveTo(-6,-44); ctx.lineTo(6,-44); ctx.lineTo(5,-36); ctx.lineTo(0,-32); ctx.lineTo(-5,-36); ctx.closePath(); }
    else if(pr.rune==='sword'){ ctx.moveTo(0,-45); ctx.lineTo(0,-31); ctx.moveTo(-5,-39); ctx.lineTo(5,-39); }
    else { ctx.moveTo(0,-45); ctx.lineTo(0,-31); ctx.moveTo(-5,-41); ctx.lineTo(5,-41); ctx.moveTo(-4,-45); ctx.lineTo(0,-48); ctx.lineTo(4,-45); }
    ctx.stroke();
  } else if(k==='socket'){
    const col = pr.rune==='shield' ? '95,208,255' : pr.rune==='sword' ? '255,154,106' : '255,224,138';
    drawShadow(0,0,14,5); ctx.fillStyle='#2a2634'; ctx.strokeStyle='#0a0810'; ctx.lineWidth=1.2; ctx.fillRect(-9,-26,18,26); ctx.strokeRect(-9,-26,18,26);
    const gl = ctx.createRadialGradient(0,-30,1,0,-30,18); gl.addColorStop(0,'rgba('+col+','+(((pr.ring && !p.breachContained && !p.wraithLordSlain) ? 0.15 : 1)*(0.55+0.3*Math.sin(clk*2.2)))+')'); gl.addColorStop(1,'rgba('+col+',0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,-30,18,0,7); ctx.fill();
    ctx.strokeStyle='rgba('+col+',0.95)'; ctx.lineWidth=2; ctx.beginPath();
    if(pr.rune==='shield'){ ctx.moveTo(-5,-36); ctx.lineTo(5,-36); ctx.lineTo(4,-27); ctx.lineTo(0,-23); ctx.lineTo(-4,-27); ctx.closePath(); }
    else if(pr.rune==='sword'){ ctx.moveTo(0,-38); ctx.lineTo(0,-24); ctx.moveTo(-5,-31); ctx.lineTo(5,-31); }
    else { ctx.moveTo(0,-38); ctx.lineTo(0,-24); ctx.moveTo(-5,-33); ctx.lineTo(5,-33); }
    ctx.stroke();
  } else if(k==='pylon'){
    drawShadow(0,0,12,4.4); ctx.fillStyle='#1c1824'; ctx.strokeStyle='#08060c'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-6,-50); ctx.lineTo(0,-58); ctx.lineTo(6,-50); ctx.lineTo(8,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    const gl = ctx.createRadialGradient(0,-40,1,0,-40,20); gl.addColorStop(0,'rgba(255,60,80,'+((pr.broken?0.12:1)*(0.6+0.3*Math.sin(clk*3+pr.x)))+')'); gl.addColorStop(1,'rgba(255,40,60,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,-40,20,0,7); ctx.fill();
  } else if(k==='banner'){
    ctx.fillStyle='#3a1a24'; ctx.strokeStyle='#14080c'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-12,-80); ctx.lineTo(12,-80); ctx.lineTo(12,-30); ctx.lineTo(7,-36); ctx.lineTo(2,-28); ctx.lineTo(-4,-38); ctx.lineTo(-9,-30); ctx.lineTo(-12,-42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='#8a7040'; ctx.beginPath(); ctx.moveTo(-14,-82); ctx.lineTo(14,-82); ctx.stroke();
  } else if(k==='fountain'){
    drawShadow(0,0,40,14); ctx.fillStyle='#4a4658'; ctx.strokeStyle='#14121c'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.ellipse(0,-6,38,14,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#10202c'; ctx.beginPath(); ctx.ellipse(0,-8,31,10.5,0,0,7); ctx.fill();
    ctx.fillStyle='#5a5668'; ctx.fillRect(-4,-28,8,22); ctx.beginPath(); ctx.ellipse(0,-28,9,3.5,0,0,7); ctx.fill();
  }
  ctx.restore();
}

