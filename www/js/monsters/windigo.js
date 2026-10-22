// ---------------- Ice Windigo (v520) ----------------
// A tall frost-furred beast that stands like a werewolf (1.5x the player). Claws: 50% physical / 50% cold (ENEMY_DMG_SPLIT).
// Frost Breath: a slow swirling cloud of frost, 100% cold damage -- fired from range after a short rear-back wind-up.
// Lives in the Icy Summit, Icy Cellar and the north end of the Mountain Pass.
const WINDIGO_BREATH_WIND = 1.1, WINDIGO_BREATH_T = 1.1, WINDIGO_CONE_LEN = 340, WINDIGO_CONE_HALF = 0.36;   // Frost Breath: aimed cone, wind-up then a sustained blast
function windigoBreathSrc(e){
  // the breath is pure cold: a stand-in source that reads like the windigo but has no physical share
  if(!e._breathSrc){ e._breathSrc = Object.create(e); e._breathSrc.dmgType = 'cold'; e._breathSrc.dmgSplit = null; }
  return e._breathSrc;
}
function updateWindigo(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const reach = e.r+target.r+4;
  updateStuckTracking(e, dt);
  if(e.brT>0){   // the breath itself: a locked cone of pure cold, ticking
    e.brT -= dt; e.moving = false; e.atkAnimT = 0.1; e.brTick -= dt;
    if(e.brTick<=0){
      e.brTick = 0.18;
      const a = e.brDir, inCone = t=>{ const dd = dist(e,t); if(dd>WINDIGO_CONE_LEN+t.r) return false; const ta = Math.atan2(t.y-e.y,t.x-e.x); return dd<e.r+20 || Math.abs(crAngDiff(ta,a)) < WINDIGO_CONE_HALF + t.r/Math.max(60,dd); };
      const src = windigoBreathSrc(e), p = g.player;
      if(inCone(p)) playerDamage(g, teleDmg(e, 0.2), src);
      if(g.followers) for(const f of g.followers) if(inCone(f)) applyFollowerDamage(g, f, teleDmg(e, 0.2), src);
    }
    for(let k=0;k<2;k++){ const rr = rand(30,WINDIGO_CONE_LEN), sp = (Math.random()-0.5)*2*WINDIGO_CONE_HALF*(rr/WINDIGO_CONE_LEN+0.2); g.particles.push({type:'burst', x:e.x+Math.cos(e.brDir+sp)*rr, y:e.y+Math.sin(e.brDir+sp)*rr, t:0.3, max:0.3, color:Math.random()<0.5?'#4f82c8':'#7fb4f0'}); }
    e.facing = {x:Math.cos(e.brDir), y:Math.sin(e.brDir)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
  } else if(e.fbT>0){   // wind-up: rears back, the cone fills on the ground; it tracks you until the last moments
    e.fbT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.fbT>0.35){ const a = Math.atan2(target.y-e.y, target.x-e.x); e.brDir = (e.brDir==null) ? a : e.brDir + crAngDiff(a, e.brDir)*Math.min(1,dt*5); }
    e.facing = {x:Math.cos(e.brDir), y:Math.sin(e.brDir)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
    if(e.fbT<=0){ e.brT = WINDIGO_BREATH_T; e.brTick = 0; }
  } else {
    e.fbCd -= dt;
    if(e.fbCd<=0 && d>110 && d<WINDIGO_CONE_LEN-30 && enemyLOS(g,e,target)){
      e.fbT = WINDIGO_BREATH_WIND; e.fbMax = WINDIGO_BREATH_WIND; e.fbCd = 4+Math.random()*2; e.windT = 0; e.brDir = Math.atan2(target.y-e.y, target.x-e.x);
    } else if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
      // mid claw slash
    } else if(d>reach){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
      e.moving = true;
    } else if(e.atkCd<=0){
      beginEnemyMelee(e);
    }
  }
}
function drawWindigoIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, s = e.r/24*1.12;
  const fb = e.fbT>0 || e.brT>0, fbK = e.brT>0 ? 1 : (e.fbT>0 ? clamp(1-e.fbT/(e.fbMax||1),0,1) : 0), slash = (e.windT>0 || e.atkAnimT>0) && !fb ? 1 : 0;
  const walk = e.moving ? Math.sin(t*8) : 0, bob = e.moving ? Math.abs(Math.sin(t*8))*1.8 : Math.sin(t*1.7)*0.8;
  drawShadow(iso.x, iso.y, 26*s, 8.5*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const fur = flash?'#fff':'#c4dcea', furL = flash?'#fff':'#eaf8ff', furD = flash?'#fff':'#7d9fb4', ink = '#1c2e38', ice = flash?'#fff':'#bfeaff';
  const lean = fb ? -fbK*5 : slash*3;   // rears back to breathe, lunges for a slash
  // legs (digitigrade)
  for(const sd of [-1,1]){
    const sw = sd>0 ? walk : -walk;
    ctx.strokeStyle = furD; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(sd*5, -30+bob); ctx.lineTo(sd*8+sw*3, -17); ctx.lineTo(sd*4+sw*5, -5); ctx.stroke();
    ctx.fillStyle = ink; ctx.beginPath(); ctx.ellipse(sd*4+sw*5+3, -2, 7, 3.2, 0, 0, 7); ctx.fill();
  }
  // tail of frosted fur
  ctx.strokeStyle = fur; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-6, -32+bob); ctx.quadraticCurveTo(-24, -30, -26, -16+Math.sin(t*3)*3); ctx.stroke();
  // hunched torso
  const tg = ctx.createLinearGradient(-12, -66, 12, -28); tg.addColorStop(0, furL); tg.addColorStop(1, furD);
  ctx.fillStyle = flash?'#fff':tg; ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-11, -32+bob); ctx.quadraticCurveTo(-17, -52+bob, -9+lean, -66+bob); ctx.quadraticCurveTo(4+lean, -72+bob, 13+lean, -62+bob); ctx.quadraticCurveTo(15, -44+bob, 10, -32+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  // frosted fur tufts along the back and chest
  ctx.fillStyle = furL;
  for(let i=0;i<6;i++){ const yy = -34-i*6+bob, xx = -12-i*0.4+lean*(i/6); ctx.beginPath(); ctx.moveTo(xx,yy); ctx.lineTo(xx-6,yy-3); ctx.lineTo(xx+1,yy-5); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = furL; ctx.lineWidth = 1.1;
  for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(6+lean*0.5, -36-i*6+bob); ctx.lineTo(10+lean*0.5, -38-i*6+bob); ctx.stroke(); }
  // arms with claws: far arm hangs, near arm slashes
  const armY = -60+bob;
  ctx.strokeStyle = furD; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-8+lean, armY); ctx.lineTo(-14, armY+14-walk*2); ctx.lineTo(-13, armY+26); ctx.stroke();
  const ax = 14+slash*14+lean, ay = armY+16-slash*10-(fb?fbK*6:0);
  ctx.strokeStyle = fur; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(9+lean, armY); ctx.lineTo(16+slash*6+lean, armY+10-slash*8); ctx.lineTo(ax, ay+(slash?0:10)); ctx.stroke();
  ctx.fillStyle = '#eef6fa'; ctx.strokeStyle = ink; ctx.lineWidth = 0.7;
  for(const k of [-1,0,1]){ ctx.beginPath(); ctx.moveTo(ax-2, ay+(slash?0:10)+k*2.6); ctx.lineTo(ax+9, ay+(slash?0:10)+k*3.2+2); ctx.lineTo(ax+1, ay+(slash?0:10)+k*2.6+2.2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // wolf head, snout forward
  const hx = 8+lean*1.2+(fb?-fbK*2:0), hy = -74+bob-(fb?fbK*3:0), up = fb ? fbK*5 : 0;
  ctx.fillStyle = flash?'#fff':fur; ctx.strokeStyle = ink; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.ellipse(hx, hy, 9, 8, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx+4, hy-3-up*0.2); ctx.lineTo(hx+19, hy+1-up); ctx.lineTo(hx+18, hy+6-up); ctx.lineTo(hx+4, hy+6); ctx.closePath(); ctx.fill(); ctx.stroke();   // snout
  ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(hx+19, hy+1-up, 1.6, 0, 7); ctx.fill();
  if(fb){ ctx.fillStyle = 'rgba(210,245,255,'+(0.4+fbK*0.5)+')'; ctx.beginPath(); ctx.ellipse(hx+17, hy+6-up, 3+fbK*5, 2+fbK*3, 0, 0, 7); ctx.fill(); }   // frost gathering in the maw
  else if(slash){ ctx.strokeStyle = ink; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(hx+6, hy+6); ctx.lineTo(hx+18, hy+7); ctx.stroke(); }
  // pointed ears
  ctx.fillStyle = furD; ctx.beginPath(); ctx.moveTo(hx-5, hy-6); ctx.lineTo(hx-8, hy-16); ctx.lineTo(hx+1, hy-8); ctx.closePath(); ctx.fill();
  // icy antlers
  ctx.strokeStyle = ice; ctx.lineWidth = 2.2;
  for(const [ox,dir] of [[-2,-1],[4,1]]){
    ctx.beginPath(); ctx.moveTo(hx+ox, hy-7); ctx.quadraticCurveTo(hx+ox+dir*5, hy-18, hx+ox+dir*3+2, hy-27); ctx.stroke();
    ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(hx+ox+dir*3, hy-15); ctx.lineTo(hx+ox+dir*10, hy-19); ctx.moveTo(hx+ox+dir*4+1, hy-22); ctx.lineTo(hx+ox+dir*9, hy-27); ctx.stroke(); ctx.lineWidth = 2.2;
  }
  // glowing cyan eyes
  const ep = 0.75+0.25*Math.sin(t*4);
  ctx.save(); ctx.shadowColor = '#5ff0ff'; ctx.shadowBlur = 8; ctx.fillStyle = 'rgba(120,250,255,'+ep+')';
  ctx.beginPath(); ctx.ellipse(hx+8, hy-2-up*0.3, 2.6, 1.5, -0.25, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(hx+1, hy-2, 2, 1.3, -0.25, 0, 7); ctx.fill(); ctx.restore();
  // breathing a drifting wisp of frost
  ctx.fillStyle = 'rgba(220,244,255,0.5)';
  for(let i=0;i<3;i++){ const u = (t*0.9+i/3)%1; ctx.globalAlpha = 0.5*(1-u); ctx.beginPath(); ctx.arc(hx+20+u*14, hy+2-up-u*6, 2+u*4.5, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawHpBar(iso, 92*s, e.r, e.hp, e.maxHp);
}

// the aimed cone: a thin outline that fills during the wind-up, then a swirling deep-blue blast (Permafrost blue)
function drawWindigoCone(e){
  const breathing = e.brT>0; if(!breathing && !(e.fbT>0)) return;
  const a = e.brDir||0, frac = breathing ? 1 : clamp(1-e.fbT/(e.fbMax||1),0,1), t = (game.clock||0);
  const bi = toIso(e.x,e.y), bs = e.r/24*1.12, bf = e.faceSign||1, o = {x:bi.x+bf*bs*27, y:bi.y-bs*73};
  const L = WINDIGO_CONE_LEN, H = WINDIGO_CONE_HALF;
  const p1 = toIso(e.x+Math.cos(a-H)*L, e.y+Math.sin(a-H)*L), p2 = toIso(e.x+Math.cos(a+H)*L, e.y+Math.sin(a+H)*L), pm = toIso(e.x+Math.cos(a)*L, e.y+Math.sin(a)*L);
  ctx.save();
  const gr = ctx.createLinearGradient(o.x, o.y, pm.x, pm.y);
  if(breathing){ gr.addColorStop(0,'rgba(120,175,240,0.8)'); gr.addColorStop(0.5,'rgba(60,110,200,0.55)'); gr.addColorStop(1,'rgba(40,80,170,0.2)'); }
  else { gr.addColorStop(0,'rgba(79,130,200,'+(0.12+frac*0.3)+')'); gr.addColorStop(1,'rgba(50,95,180,'+(0.04+frac*0.14)+')'); }
  ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.closePath(); ctx.fillStyle = gr; ctx.fill();
  ctx.strokeStyle = 'rgba(110,165,235,'+(0.35+frac*0.5)+')'; ctx.lineWidth = 1.8; ctx.stroke();
  if(breathing){   // drifting frost puffs streaming down the cone
    for(let k=0;k<18;k++){
      const u = ((t*1.4+k*0.173)%1), side = Math.sin(k*2.7)*0.8, ang = a+side*H*u, rr = 20+u*L;
      const q = toIso(e.x+Math.cos(ang)*rr, e.y+Math.sin(ang)*rr), ky = o.y+(q.y-o.y)*0.0;
      ctx.globalAlpha = 0.55*(1-u*0.7); ctx.fillStyle = k%2 ? '#3f70c0' : '#6fa4e8';
      ctx.beginPath(); ctx.arc(q.x, q.y-6-u*10, 6+u*16, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
