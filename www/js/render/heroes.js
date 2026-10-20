// v294: the Warrior rig, redrawn: a plated knight with a tabard, big heater shield, layered pauldrons and a crested great helm.
// Pose timers: p.bashAnimT (Shield Slam: the shield itself drives forward), p.vengAnimT (Vengeance: a lunging sword cut),
// p.throwAnimT (Shield Throw: the arm snaps forward and the hand is empty while the shield is away).
function warriorShieldPath(w, h){
  ctx.beginPath(); ctx.moveTo(-w/2,-h/2); ctx.lineTo(w/2,-h/2); ctx.lineTo(w/2,h*0.12); ctx.quadraticCurveTo(w/2,h*0.4,0,h/2); ctx.quadraticCurveTo(-w/2,h*0.4,-w/2,h*0.12); ctx.closePath();
}
let _wsTint = null;   // v482: per-figure shield field colours (Summit protectors)
function drawWarriorShield(w, h, glow, face){
  // face: 0 = seen edge-on (carried at the side), 1 = full face on
  const ww = w*(0.55+0.45*face);
  if(glow){ ctx.shadowColor = glow; ctx.shadowBlur = 12; }
  warriorShieldPath(ww, h);
  const rim = ctx.createLinearGradient(-ww/2,-h/2,ww/2,h/2); rim.addColorStop(0,'#f0f4fa'); rim.addColorStop(0.5,'#98a3b6'); rim.addColorStop(1,'#4c5464');
  ctx.fillStyle = rim; ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#1c2029'; ctx.lineWidth = 1.5; ctx.stroke();
  warriorShieldPath(ww*0.74, h*0.8); ctx.save(); ctx.translate(0,h*0.012);
  const fld = ctx.createLinearGradient(0,-h/2,0,h/2); fld.addColorStop(0,_wsTint?_wsTint[0]:'#b83247'); fld.addColorStop(1,_wsTint?_wsTint[1]:'#6a1624');
  ctx.fillStyle = fld; ctx.fill(); ctx.restore();
  if(face>0.35){
    ctx.strokeStyle = '#e0b84e'; ctx.lineWidth = 2*(0.5+0.5*face); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0,-h*0.32); ctx.lineTo(0,h*0.28); ctx.moveTo(-ww*0.24,-h*0.12); ctx.lineTo(ww*0.24,-h*0.12); ctx.stroke();
  }
  ctx.fillStyle = '#e0b84e'; ctx.beginPath(); ctx.arc(0,-h*0.02,2.5+1.4*face,0,7); ctx.fill();
  ctx.strokeStyle = '#7a5a1a'; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-ww/2+1.6,-h/2+3); ctx.lineTo(-ww/2+1.6,h*0.1); ctx.stroke();
}
function drawWarrior(p){
  const iso = toIso(p.x,p.y); _wsTint = p.shieldT || null;
  const s = p.r/16*((p.juggT>0||p.juggWindT>0) ? JUGG_SCALE : 1), face = p.faceSign||1, t = p.animT||0;   // v342: +5% size from the war cry
  const moving = p.moving, cast = p.castAnimT||0;
  const bashT = p.bashAnimT>0 ? clamp(1-p.bashAnimT/(p.bashAnimMax||0.3),0,1) : -1;
  const vengT = p.vengAnimT>0 ? clamp(1-p.vengAnimT/(p.vengAnimMax||0.28),0,1) : -1;
  const throwT = p.throwAnimT>0 ? clamp(1-p.throwAnimT/0.3,0,1) : -1;
  const atk = (bashT>=0 || vengT>=0 || throwT>=0) ? 0 : (p.atkAnimT||0);
  let alpha = 1;
  if(p.dodging) alpha=0.5; else if(p.hitFlash>0) alpha = 0.55+Math.sin(p.hitFlash*40)*0.2; else if(p.vanishT>0) alpha = 0.3;

  const eq = (p.equipment) || {};
  const mh = eq.mainhand, offh = eq.offhand;
  const twoHand = !!(mh && mh.twoHanded);
  const isBow = !!(mh && mh.slotType==='bow');
  const isStaff = !!(mh && mh.slotType==='staff');
  const hasShield = !!(offh && offh.slotType==='shield');
  const shieldAway = hasShield && p===game.player && !!game.shieldThrow;   // thrown: the hand is empty until it returns
  const offhandSword = !!(offh && offh.slotType==='weapon1h');
  const furyOffSwing = offhandSword && p.furyHandT>0 && p.furyHand==='off';   // v419: Fury's middle hit is the off-hand sword
  const LK = charLooks(p), bodyLook = LK.body, helmLook = LK.helm;   // v393: 0 starter / 1 tier 1 / 2 tier 3 / 3 tier 5
  const plainHelm = p.isSquire ? helmLook<3 : helmLook===2;
  const armCol = bodyLook>=2 ? '#5c6678' : bodyLook===1 ? '#6a4a2c' : '#c8b48c';
  const handA = bodyLook>=2 ? '#c9d2e0' : bodyLook===1 ? '#9a7a54' : '#e0bc94', handB = bodyLook>=2 ? '#5b6575' : bodyLook===1 ? '#4a3220' : '#b08a60';

  if(!p.noShadow) drawShadow(iso.x, iso.y, 16*s, 7.5*s);
  if(p.iceArmorT>0) drawIceArmorAura(p, iso, s);
  if(p.unbreakT>0) drawUnbreakableAura(p, iso, s);
  if(p.whirlwindT>0) drawWhirlBlade(p, iso, s, mh, false);
  else if(p.cleaveT>0) drawCleaveSwing(p, iso, s, mh, false);
  if(p.guardianT>0) drawGuardianAura(p, iso, s);
  if(p.assaultT>0) drawAssaultAura(p, iso, s);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s*1.05, s*1.05*1.07);   // v352: +5% overall, and the warrior stands ~7% taller

  const walk = moving ? Math.sin(t*10) : 0;
  const bob = moving ? Math.abs(Math.sin(t*10))*2 : Math.sin(t*2)*1.2;
  const legSwing = walk*7;
  const flutter = Math.sin(t*6)*3 + walk*2;
  // body lunge for the committed attacks
  let lunge = 0;
  if(bashT>=0) lunge = bashT<0.25 ? -2.5*(bashT/0.25) : bashT<0.55 ? -2.5+9.5*((bashT-0.25)/0.3) : 7*(1-(bashT-0.55)/0.45);
  else if(vengT>=0) lunge = vengT<0.28 ? -2*(vengT/0.28) : 8*Math.sin(Math.min(1,(vengT-0.28)/0.72)*Math.PI*0.85);
  else if(throwT>=0) lunge = 3*Math.sin(throwT*Math.PI);
  ctx.translate(lunge, 0);

  if(bodyLook>=3){
  // cape (two layers)
  const capeBackGrad = ctx.createLinearGradient(-4,-44+bob,-24,-2);
  capeBackGrad.addColorStop(0,p.capeT?p.capeT[2]:p.isSquire?'#2a2216':'#2c0a15'); capeBackGrad.addColorStop(1,p.capeT?p.capeT[3]:p.isSquire?'#14100a':'#160510');
  ctx.fillStyle = capeBackGrad;
  ctx.beginPath(); ctx.moveTo(-6,-43+bob*0.3); ctx.quadraticCurveTo(-22+walk*2+flutter*1.3,-18+bob*0.3,-12-flutter*0.6,3); ctx.lineTo(-2,-2); ctx.lineTo(-3,-41+bob*0.3); ctx.closePath(); ctx.fill();
  const capeGrad = ctx.createLinearGradient(-4,-46+bob,-22,-6);
  capeGrad.addColorStop(0, p.invuln>0 ? '#ffb56a' : p.capeT ? p.capeT[0] : (p.isSquire ? '#9a8458' : '#b8364a')); capeGrad.addColorStop(1,p.capeT?p.capeT[1]:p.isSquire?'#40331c':'#3a0f1c');   // squires: tan cloak, not the player's crimson
  ctx.fillStyle = capeGrad;
  ctx.beginPath(); ctx.moveTo(-7,-44+bob*0.3); ctx.quadraticCurveTo(-16+walk*2+flutter,-21+bob*0.3,-9-flutter*0.4,0); ctx.lineTo(-1,-4); ctx.lineTo(-4,-42+bob*0.3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.8; ctx.stroke();

  }
  if(bodyLook>=2){
  // legs: cuisses, knee cops, greaves and pointed sabatons
  for(const [lx,sw,c0,c1] of [[-7.5,-legSwing,'#6a6478','#2c2734'],[1.5,legSwing,'#4e4858','#241f2a']]){
    const ly = sw*0.15;
    const lg = ctx.createLinearGradient(lx,-20,lx+6,0); lg.addColorStop(0,c0); lg.addColorStop(1,c1);
    ctx.fillStyle = lg; roundRect(lx,-20-ly,6.4,20+ly,2.6); ctx.fill(); ctx.strokeStyle='#17131c'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#aab3c4'; ctx.beginPath(); ctx.ellipse(lx+3.2,-12-ly*0.6,3.4,2.6,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#3a3542'; ctx.beginPath(); ctx.moveTo(lx-0.6,-1.5); ctx.lineTo(lx+8.6,-1.5); ctx.lineTo(lx+11,1.2); ctx.lineTo(lx-0.6,1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // tassets: hip plates over the legs
  ctx.fillStyle='#7c869a'; ctx.strokeStyle='#262c38'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-10,-24+bob); ctx.lineTo(10,-24+bob); ctx.lineTo(11,-14+bob); ctx.lineTo(0,-11+bob); ctx.lineTo(-11,-14+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(-4,-23+bob); ctx.lineTo(-5,-13+bob); ctx.moveTo(4,-23+bob); ctx.lineTo(5,-13+bob); ctx.stroke();

  } else {
  // v393: starter (cloth trousers, wrapped shins) / tier 1 (leather trousers, boots, iron knee studs)
  for(const [lx,sw] of [[-7.5,-legSwing],[1.5,legSwing]]){
    const ly = sw*0.15;
    const lg = ctx.createLinearGradient(lx,-20,lx+6,0);
    if(bodyLook===1){ lg.addColorStop(0,'#5a4630'); lg.addColorStop(1,'#2a1e12'); } else { lg.addColorStop(0,'#8a7a5c'); lg.addColorStop(1,'#4a3e2c'); }
    ctx.fillStyle=lg; roundRect(lx,-20-ly,6.4,20+ly,2.6); ctx.fill(); ctx.strokeStyle='#1c150d'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle = bodyLook===1 ? '#3a2818' : '#4a3826'; roundRect(lx-0.4,-8-ly*0.4,7.2,8.4+ly*0.4,2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#2a1c10'; ctx.beginPath(); ctx.moveTo(lx-0.6,-1.5); ctx.lineTo(lx+8.6,-1.5); ctx.lineTo(lx+10,1.2); ctx.lineTo(lx-0.6,1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(bodyLook===1){ ctx.fillStyle='#b8b2a0'; ctx.beginPath(); ctx.arc(lx+3.2,-13-ly*0.6,1.4,0,7); ctx.fill(); }
    else { ctx.strokeStyle='#6a5a3c'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(lx,-6-ly*0.4); ctx.lineTo(lx+6.4,-4.4-ly*0.4); ctx.moveTo(lx,-3.4-ly*0.2); ctx.lineTo(lx+6.4,-1.8-ly*0.2); ctx.stroke(); }
  }
  }
  if(bodyLook>=2){
  // torso: breastplate with a red tabard and a gold emblem
  const torsoGrad = ctx.createLinearGradient(-11,-46+bob,11,-20+bob);
  torsoGrad.addColorStop(0,'#e2e8f2'); torsoGrad.addColorStop(0.5,'#98a3b6'); torsoGrad.addColorStop(1,'#5a6374');
  ctx.fillStyle = torsoGrad; roundRect(-10.5,-46+bob,21,26,6); ctx.fill();
  ctx.strokeStyle='#2c3340'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect(-8.5,-43+bob,2,16);
  // v301: plain fighter's kit: leather harness straps across the plate and a studded belt (no tabard/cross)
  ctx.strokeStyle='#4a3220'; ctx.lineWidth=2.6; ctx.lineCap='butt';
  ctx.beginPath(); ctx.moveTo(-8.5,-43+bob); ctx.lineTo(8,-25+bob); ctx.moveTo(8.5,-43+bob); ctx.lineTo(-8,-25+bob); ctx.stroke();
  ctx.fillStyle='#b8923a'; ctx.beginPath(); ctx.arc(0,-34+bob,2,0,7); ctx.fill(); ctx.strokeStyle='#3a2a12'; ctx.lineWidth=0.8; ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.18)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-5,-44+bob); ctx.lineTo(-5,-27+bob); ctx.stroke();
  ctx.fillStyle='#4a3220'; ctx.fillRect(-10.5,-24+bob,21,3.2); ctx.fillStyle='#b8923a'; ctx.fillRect(-2.4,-24.4+bob,4.8,4);
  if(p.isSquire){   // squire's quilted tan surcoat over the plate, so they never read as the player
    ctx.fillStyle='rgba(168,146,100,0.92)'; roundRect(-8,-44+bob,16,22,4); ctx.fill(); ctx.strokeStyle='#4a3a1e'; ctx.lineWidth=1; ctx.stroke();
    ctx.strokeStyle='rgba(60,44,24,0.4)'; ctx.lineWidth=0.8; for(let qi=0;qi<4;qi++){ ctx.beginPath(); ctx.moveTo(-7.5,-40+bob+qi*5); ctx.lineTo(7.5,-40+bob+qi*5); ctx.stroke(); }
    ctx.fillStyle='#4a3220'; ctx.fillRect(-10.5,-24+bob,21,3.2); ctx.fillStyle='#b8923a'; ctx.fillRect(-2.4,-24.4+bob,4.8,4);
  }
  // gorget
  ctx.fillStyle='#8a94a8'; ctx.beginPath(); ctx.ellipse(0,-45+bob,7.6,3.4,0,0,7); ctx.fill(); ctx.strokeStyle='#2c3340'; ctx.lineWidth=1; ctx.stroke();

  // pauldrons: big layered shoulder plates
  for(const sideSign of [-1,1]){
    ctx.save(); ctx.translate(sideSign*11,-43+bob);
    for(const [k,rx,ry,dy] of (bodyLook>=3 ? [[0,6.8,5.6,0],[1,5.6,4.4,3.4]] : [[0,6.2,5,0]])){
      const pg = ctx.createRadialGradient(-1.6,-1.6+dy,0.5,0,dy,rx);
      pg.addColorStop(0,k?'#cfd6e2':'#eef2f8'); pg.addColorStop(1,'#5a6475');
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(0,dy,rx,ry,0,0,7); ctx.fill(); ctx.strokeStyle='#272d3a'; ctx.lineWidth=1; ctx.stroke();
    }
    ctx.fillStyle='#c9d0dc'; ctx.beginPath(); ctx.arc(0,-0.4,1.2,0,7); ctx.fill();
    ctx.restore();
  }

  if(bodyLook>=3){   // tier 5: gold trim on the plate
    ctx.strokeStyle='#d8b04a'; ctx.lineWidth=1.3;
    roundRect(-10.5,-46+bob,21,26,6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10,-24+bob); ctx.lineTo(10,-24+bob); ctx.lineTo(11,-14+bob); ctx.lineTo(0,-11+bob); ctx.lineTo(-11,-14+bob); ctx.closePath(); ctx.stroke();
    ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.moveTo(0,-41+bob); ctx.lineTo(2.6,-37.5+bob); ctx.lineTo(0,-34+bob); ctx.lineTo(-2.6,-37.5+bob); ctx.closePath(); ctx.fill();
    for(const sideSign of [-1,1]){ ctx.beginPath(); ctx.ellipse(sideSign*11,-43+bob,6.8,5.6,0,0,7); ctx.stroke(); }
  }
  } else {
  // v393: starter linen tunic with a rope belt / tier 1 padded jerkin with iron studs
  const tg = ctx.createLinearGradient(-10,-46+bob,10,-20+bob);
  if(bodyLook===1){ tg.addColorStop(0,'#7a5a38'); tg.addColorStop(0.6,'#5a4026'); tg.addColorStop(1,'#33241a'); } else { tg.addColorStop(0,'#d8c8a4'); tg.addColorStop(0.6,'#b8a67e'); tg.addColorStop(1,'#82735a'); }
  ctx.fillStyle=tg; roundRect(-10.5,-46+bob,21,26,6); ctx.fill(); ctx.strokeStyle = bodyLook===1 ? '#1f150c' : '#4a3c26'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.14)'; ctx.fillRect(-8.5,-43+bob,2,16);
  if(bodyLook===1){
    ctx.strokeStyle='rgba(20,12,6,0.5)'; ctx.lineWidth=0.8; for(let qi=0;qi<5;qi++){ ctx.beginPath(); ctx.moveTo(-9,-42+bob+qi*4.4); ctx.lineTo(9,-42+bob+qi*4.4); ctx.stroke(); }
    ctx.strokeStyle='#2e2014'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-8.5,-43+bob); ctx.lineTo(8,-25+bob); ctx.stroke();
    ctx.fillStyle='#b8b2a0'; for(const [sx2,sy2] of [[-6,-38],[6,-38],[-6,-31],[6,-31],[-3,-26],[3,-26]]){ ctx.beginPath(); ctx.arc(sx2,sy2+bob,0.9,0,7); ctx.fill(); }
  } else {
    ctx.strokeStyle='#6a5a3c'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-2.4,-46+bob); ctx.lineTo(0,-39+bob); ctx.lineTo(2.4,-46+bob); ctx.stroke();
    ctx.fillStyle='#8a7048'; ctx.fillRect(3,-36+bob,5,4.2); ctx.strokeStyle='rgba(60,44,24,0.6)'; ctx.lineWidth=0.6; ctx.strokeRect(3,-36+bob,5,4.2);
  }
  if(bodyLook===1){ ctx.fillStyle='#2e2014'; ctx.fillRect(-10.5,-24+bob,21,3.2); ctx.fillStyle='#b8923a'; ctx.fillRect(-2.4,-24.4+bob,4.8,4); }
  else { ctx.strokeStyle='#7a5a32'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(-10.5,-22.6+bob); ctx.lineTo(10.5,-22.6+bob); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2,-22.6+bob); ctx.lineTo(3.4,-17.6+bob); ctx.stroke(); }
  if(p.isSquire){   // squire's quilted tan surcoat
    ctx.fillStyle='rgba(168,146,100,0.92)'; roundRect(-8,-44+bob,16,22,4); ctx.fill(); ctx.strokeStyle='#4a3a1e'; ctx.lineWidth=1; ctx.stroke();
    ctx.strokeStyle='rgba(60,44,24,0.4)'; ctx.lineWidth=0.8; for(let qi=0;qi<4;qi++){ ctx.beginPath(); ctx.moveTo(-7.5,-40+bob+qi*5); ctx.lineTo(7.5,-40+bob+qi*5); ctx.stroke(); }
    ctx.fillStyle='#4a3220'; ctx.fillRect(-10.5,-24+bob,21,3.2); ctx.fillStyle='#b8923a'; ctx.fillRect(-2.4,-24.4+bob,4.8,4);
  }
  ctx.fillStyle = bodyLook===1 ? '#6a4a2c' : '#d0bf98'; ctx.beginPath(); ctx.ellipse(0,-45+bob,6.4,2.8,0,0,7); ctx.fill(); ctx.strokeStyle='#33261a'; ctx.lineWidth=0.9; ctx.stroke();
  for(const sideSign of [-1,1]){ ctx.save(); ctx.translate(sideSign*10.6,-43+bob);
    ctx.fillStyle = bodyLook===1 ? '#5a4026' : '#c8b88e'; ctx.strokeStyle = bodyLook===1 ? '#1f150c' : '#4a3c26'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(0,0.4, bodyLook===1?5.4:4.4, bodyLook===1?4.4:3.6,0,0,7); ctx.fill(); ctx.stroke(); ctx.restore(); }
  }
  // off-hand: a big heater shield, or an armoured fist (empty while the shield is thrown)
  if(hasShield && !shieldAway){
    ctx.save();
    const blocking = !!p.blocking;
    let sx = -14, sy = -32+bob, rot = -0.12, fc = 0.15, sc = 1, glow = null;
    if(blocking){ sx = -6; sy = -34+bob; rot = 0; fc = 1; sc = 1.1; glow = '#cdd8e6'; }
    if(p.towerShield){ sy += 6; if(blocking) glow = null; }
    if(bashT>=0){
      const wind = clamp(bashT/0.25,0,1), drive = clamp((bashT-0.25)/0.3,0,1), back = clamp((bashT-0.55)/0.45,0,1);
      const k = bashT<0.25 ? -wind*0.35 : bashT<0.55 ? -0.35+1.35*drive : 1*(1-back);
      sx = -14 + 36*k; sy = -32+bob - 3*Math.max(0,k); rot = -0.12 + 0.12*Math.max(0,k); fc = clamp(0.15 + k*1.1,0.15,1); sc = 1 + 0.32*Math.max(0,k);
      if(k>0.45) glow = '#ffffff';
      if(bashT>=0.25 && bashT<0.62){   // motion streaks trailing behind the driving shield
        ctx.save(); ctx.globalAlpha = 0.5*(1-Math.abs(bashT-0.4)/0.22); ctx.strokeStyle = '#dfe8f4'; ctx.lineWidth = 2; ctx.lineCap='round';
        for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(sx-16,sy+i*7); ctx.lineTo(sx-30,sy+i*7); ctx.stroke(); }
        ctx.restore();
      }
    }
    // the arm holding it
    ctx.strokeStyle=armCol; ctx.lineWidth=4.2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-10.5,-40+bob); ctx.lineTo(sx+(blocking||bashT>=0?-2:4),sy+3); ctx.stroke();
    ctx.translate(sx, sy); ctx.rotate(rot); ctx.scale(sc,sc);
    drawWarriorShield(p.towerShield ? 25 : 17, p.towerShield ? 44 : 26, glow, fc);
    ctx.restore();
  } else if(offhandSword){
    ctx.save(); ctx.translate(-11,-34+bob);
    if(furyOffSwing){
      const osw = atk>0 ? Math.min(1, atk/(p.atkAnimMax||0.22)) : 0;
      ctx.rotate((1-osw)*1.9-0.5); ctx.shadowColor='#fff2c8'; ctx.shadowBlur=8*osw;
    }
    ctx.scale(-1,1);
    const bg = ctx.createLinearGradient(-2,-22,2,4); bg.addColorStop(0,'#f2f4f8'); bg.addColorStop(1,'#8b93a0');
    ctx.strokeStyle='#3a3428'; ctx.fillStyle=bg;
    ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(2,-20); ctx.lineTo(0,-24); ctx.lineTo(-2,-20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#a8863a'; ctx.fillRect(-3,3,6,3);
    ctx.restore();
  } else if(isBow){
    ctx.save(); ctx.translate(-2,-24+bob);
    const fg = ctx.createRadialGradient(-1,-1,0.5,0,0,4.2); fg.addColorStop(0,handA); fg.addColorStop(1,handB);
    ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(0,0,3.8,0,7); ctx.fill(); ctx.strokeStyle='#2e3542'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  } else {
    // empty gauntlet; snaps forward while the shield is being thrown
    const tk = throwT>=0 ? Math.sin(Math.min(1,throwT/0.6)*Math.PI*0.5) : 0, back = throwT>=0 ? clamp((throwT-0.6)/0.4,0,1) : 0, ext = tk*(1-back);
    ctx.save();
    ctx.strokeStyle=armCol; ctx.lineWidth=4.2; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-10.5,-40+bob); ctx.lineTo(-12+ext*30,-33+bob-ext*4); ctx.stroke();
    ctx.translate(-12+ext*30,-32+bob-ext*4);
    const fg = ctx.createRadialGradient(-1,-1,0.5,0,0,5); fg.addColorStop(0,handA); fg.addColorStop(1,handB);
    ctx.fillStyle=fg; ctx.beginPath(); ctx.arc(0,3,4.6,0,7); ctx.fill(); ctx.strokeStyle='#2e3542'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  }

  // weapon arm
  const swing = atk>0 ? Math.min(1, atk/(p.atkAnimMax||0.22)) : 0;
  const raise = cast>0 ? (cast/0.25) : 0;
  ctx.save();
  if(p.whirlwindT>0) ctx.globalAlpha = 0;
  let vengGlow = false;
  if(p.cleaveT>0 && !isBow && !isStaff){
    const cf = clamp(1 - p.cleaveT/(p.cleaveMax||0.34), 0, 1), ce = 1-Math.pow(1-Math.min(1,cf*1.3),3);
    ctx.translate(6,-31+bob); ctx.rotate(1.57 + (0.5-ce)*2.2);
  } else if(vengT>=0 && !isBow && !isStaff){
    // Vengeance: draw back, then drive the blade forward in a straight, lunging cut
    const ve = vengT<0.28 ? -0.5*(vengT/0.28) : -0.5 + 2.15*(1-Math.pow(1-clamp((vengT-0.28)/0.4,0,1),3));
    ctx.translate(9+clamp((vengT-0.28)/0.4,0,1)*7, -36+bob); ctx.rotate(ve); vengGlow = vengT>0.2;
  } else if(throwT>=0 || bashT>=0){
    ctx.translate(9,-35+bob); ctx.rotate(-0.25);   // sword stays low while the shield does the work
  } else {
    ctx.translate(10,-39+bob);
    ctx.rotate((swing>0 && !furyOffSwing) ? (1-swing)*1.9-0.5 : (raise>0 ? -0.6*raise : (furyOffSwing ? -0.5 : 0)));
  }
  ctx.save();
  if(atk>0 && !furyOffSwing){ ctx.shadowColor='#fff2c8'; ctx.shadowBlur=8*swing; }
  if(vengGlow){ ctx.shadowColor='#ff9a3a'; ctx.shadowBlur=14; }
  if(isBow){
    ctx.translate(0,14);   // v452: bow held at the waist/chest instead of head height
    ctx.strokeStyle='#5a3a20'; ctx.lineWidth=2.6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,11); ctx.quadraticCurveTo(10,0,4,-13); ctx.quadraticCurveTo(10,-24,0,-35); ctx.stroke();
    ctx.strokeStyle='#d8cdb8'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(0,11); ctx.lineTo(0,-35); ctx.stroke();
    ctx.fillStyle='#3a2818'; ctx.fillRect(-1.8,-15,3.6,7);
  } else if(isStaff){
    const sg = ctx.createLinearGradient(-2,-34,2,10); sg.addColorStop(0,'#8a6a3c'); sg.addColorStop(1,'#3a2814');
    ctx.fillStyle = sg; ctx.fillRect(-1.6,-34,3.2,44); ctx.strokeStyle='#20150a'; ctx.lineWidth=0.8; ctx.strokeRect(-1.6,-34,3.2,44);
    ctx.fillStyle='#5a4020'; ctx.fillRect(-2.2,2,4.4,6);
    const og = ctx.createRadialGradient(-1,-37,0.5,0,-35,5.2); og.addColorStop(0,'#ffffff'); og.addColorStop(0.5,'#8fd0ff'); og.addColorStop(1,'#1a2028');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(0,-35,4.6,0,7); ctx.fill(); ctx.strokeStyle='#160f08'; ctx.lineWidth=1; ctx.stroke();
  } else if(twoHand){
    ctx.save(); ctx.translate(0,10); ctx.scale(0.6,0.6); ctx.translate(0,-10);   // v425b: 40% smaller in hand
    // greatsword: clearly longer, broader, fullered blade with a winged crossguard and a heavy gold pommel
    const bg = ctx.createLinearGradient(-6,-56,6,8); bg.addColorStop(0,'#ffffff'); bg.addColorStop(0.45,'#b9c6dc'); bg.addColorStop(1,'#5e6a82');
    ctx.strokeStyle='#1c2230'; ctx.fillStyle=bg; ctx.lineWidth=1.1;
    ctx.beginPath(); ctx.moveTo(-4.4,6); ctx.lineTo(-5.4,-46); ctx.lineTo(0,-58); ctx.lineTo(5.4,-46); ctx.lineTo(4.4,6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='rgba(40,52,78,0.55)'; ctx.fillRect(-1.2,-50,2.4,54);
    ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=0.7; ctx.beginPath(); ctx.moveTo(-3.2,4); ctx.lineTo(-3.8,-44); ctx.stroke();
    ctx.fillStyle='#d2a63c'; ctx.strokeStyle='#4a3410'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-13,6); ctx.lineTo(-9,2.4); ctx.lineTo(9,2.4); ctx.lineTo(13,6); ctx.lineTo(9,8.6); ctx.lineTo(-9,8.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#5a3a1a'; ctx.fillRect(-2.6,8.6,5.2,14); ctx.strokeStyle='#241608'; ctx.strokeRect(-2.6,8.6,5.2,14);
    ctx.fillStyle='#e0b848'; ctx.beginPath(); ctx.arc(0,24,4.8,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#8e1b1b'; ctx.beginPath(); ctx.arc(0,24,1.9,0,7); ctx.fill();
    ctx.restore();
  } else if(p.hwHammer){
    // v420: Highward knights carry a one-handed war hammer instead of a sword
    const hs = p.hwHammer===2 ? 1.5 : p.hwHammer===3 ? 0.85 : 1.15;
    ctx.fillStyle='#4a3220'; ctx.strokeStyle='#1c150d'; ctx.lineWidth=0.9;
    ctx.fillRect(-1.5,-26*hs,3,34*hs); ctx.strokeRect(-1.5,-26*hs,3,34*hs);
    const hg2 = ctx.createLinearGradient(0,-33*hs,0,-22*hs); hg2.addColorStop(0,'#e4e8ee'); hg2.addColorStop(1,'#7a8290');
    ctx.fillStyle=hg2; ctx.fillRect(-8*hs,-33*hs,16*hs,10*hs); ctx.strokeRect(-8*hs,-33*hs,16*hs,10*hs);
    ctx.fillStyle='#5a6270'; ctx.fillRect(-8*hs,-33*hs,3*hs,10*hs); ctx.fillRect(5*hs,-33*hs,3*hs,10*hs);
    ctx.beginPath(); ctx.moveTo(-1.6*hs,-33*hs); ctx.lineTo(0,-39*hs); ctx.lineTo(1.6*hs,-33*hs); ctx.closePath(); ctx.fillStyle='#c9d0dc'; ctx.fill(); ctx.stroke();
    ctx.fillStyle='#b8923a'; ctx.fillRect(-3,3,6,2.4);
  } else {
    const bg = ctx.createLinearGradient(-2.4,-28,2.4,4); bg.addColorStop(0,'#f6f8fc'); bg.addColorStop(1,'#8b93a0');
    ctx.strokeStyle='#3a3428'; ctx.fillStyle=bg;
    ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(2.6,-23); ctx.lineTo(0,-28); ctx.lineTo(-2.6,-23); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=0.6; ctx.beginPath(); ctx.moveTo(0,2); ctx.lineTo(0,-22); ctx.stroke();
    ctx.fillStyle='#b8923a'; ctx.fillRect(-4.2,3,8.4,3); ctx.fillStyle='#3a3428'; ctx.fillRect(-1.6,6,3.2,6);
    ctx.fillStyle='#d4dbe8'; ctx.beginPath(); ctx.arc(0,13,2.6,0,7); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
  // weapon-hand gauntlet over the hilt
  // head: open-faced fighter's helm with a nose guard (face visible), short crest ridge
  const hy = -50+bob;
  ctx.fillStyle = p.hitFlash>0 ? '#ffe0d0' : '#d9b48c'; ctx.beginPath(); ctx.arc(0,hy+0.5,6.4,0,7); ctx.fill();
  ctx.strokeStyle='#4a3220'; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle='#2a1e16'; ctx.beginPath(); ctx.arc(-2.6,hy+0.4,0.95,0,7); ctx.arc(2.6,hy+0.4,0.95,0,7); ctx.fill();
  ctx.strokeStyle='rgba(60,36,24,0.7)'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-2,hy+4.2); ctx.lineTo(2,hy+4.2); ctx.stroke();
  if(helmLook>=2 || (p.isSquire && helmLook>=2)){
  const hg = ctx.createRadialGradient(-2.5,hy-4,1,0,hy-2,10); hg.addColorStop(0,'#e6ebf3'); hg.addColorStop(0.6,'#98a3b6'); hg.addColorStop(1,'#566073');
  ctx.fillStyle=hg; ctx.beginPath(); ctx.arc(0,hy-1,7.6,Math.PI,0); ctx.lineTo(7.6,hy-0.4); ctx.lineTo(-7.6,hy-0.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2c3340'; ctx.lineWidth=1.3; ctx.stroke();
  ctx.fillStyle='#8a94a8'; ctx.fillRect(-7.8,hy-1.6,15.6,1.8);                       // brow band
  ctx.fillStyle='#aab3c4'; ctx.fillRect(-0.9,hy-1.2,1.8,6.2); ctx.strokeStyle='#2c3340'; ctx.lineWidth=0.6; ctx.strokeRect(-0.9,hy-1.2,1.8,6.2);   // nose guard
  ctx.fillStyle='#7c869a'; ctx.beginPath(); ctx.moveTo(-7.4,hy-0.4); ctx.lineTo(-5.6,hy-0.4); ctx.lineTo(-5.2,hy+4.6); ctx.lineTo(-7,hy+3.6); ctx.closePath(); ctx.fill(); ctx.stroke();   // cheek plates
  ctx.beginPath(); ctx.moveTo(7.4,hy-0.4); ctx.lineTo(5.6,hy-0.4); ctx.lineTo(5.2,hy+4.6); ctx.lineTo(7,hy+3.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,hy-1,6,3.6,4.9); ctx.stroke();
  const crestC = p.crestC || (p.isSquire?'#7a6a46':'#b02a2a'), trimC = p.isSquire?'#8a7a56':'#c9a24a';
  // swept-back winged helm: steel wings with gold trim, a raised ridge and a tall flowing crest (Squires wear a plain helm: no wings, ridge or crest)
  if(plainHelm){ ctx.strokeStyle='#3a4252'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(0,hy-1,7.6,Math.PI+0.25,-0.25); ctx.stroke(); ctx.fillStyle='#5a6478'; for(const rx of [-4.6,0,4.6]){ ctx.beginPath(); ctx.arc(rx,hy-3.2,0.55,0,7); ctx.fill(); } }
  else { for(const ws of [-1,1]){
    ctx.fillStyle='#aab3c4'; ctx.strokeStyle='#262c38'; ctx.lineWidth=0.9;
    ctx.beginPath(); ctx.moveTo(ws*6.6,hy-1.5); ctx.quadraticCurveTo(ws*13,hy-3,ws*15.5,hy-14); ctx.quadraticCurveTo(ws*10.5,hy-9.5,ws*7.4,hy-7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle=trimC; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(ws*7,hy-2.4); ctx.quadraticCurveTo(ws*12,hy-4.4,ws*14.6,hy-12.4); ctx.stroke();
  }
  ctx.fillStyle='#c3cad8'; ctx.strokeStyle='#262c38'; ctx.lineWidth=0.9;
  ctx.beginPath(); ctx.moveTo(-1.6,hy-7.4); ctx.quadraticCurveTo(0,hy-11.2,1.6,hy-7.4); ctx.lineTo(1.6,hy-1.6); ctx.lineTo(-1.6,hy-1.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=trimC; ctx.fillRect(-7.8,hy-2.4,15.6,1.1);
  ctx.fillStyle=crestC; ctx.beginPath(); ctx.moveTo(-1.4,hy-8.4); ctx.quadraticCurveTo(-3+flutter*0.15,hy-20,5+flutter*0.5,hy-17); ctx.quadraticCurveTo(10+flutter*0.7,hy-14,9+flutter*0.8,hy-6); ctx.quadraticCurveTo(5+flutter*0.3,hy-10.5,2.4,hy-8); ctx.closePath(); ctx.fill();   // tall crest
  ctx.strokeStyle='#4a1414'; ctx.lineWidth=0.7; ctx.stroke();
  }

  } else if(helmLook===1){   // tier 1: iron skullcap with a nose bar and a chinstrap
    const cg = ctx.createRadialGradient(-2.5,hy-4,1,0,hy-2,10); cg.addColorStop(0,'#aab0ba'); cg.addColorStop(0.6,'#6e7480'); cg.addColorStop(1,'#3e434e');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,hy-1.4,7.2,Math.PI,0); ctx.lineTo(7.2,hy-1.4); ctx.lineTo(-7.2,hy-1.4); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#23272f'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.fillStyle='#4a4f5a'; ctx.fillRect(-7.4,hy-2.4,14.8,1.6);
    ctx.fillStyle='#8a909c'; ctx.fillRect(-0.8,hy-1.2,1.6,5); ctx.strokeStyle='#23272f'; ctx.lineWidth=0.5; ctx.strokeRect(-0.8,hy-1.2,1.6,5);
    ctx.fillStyle='#b8b2a0'; for(const rx of [-4.6,0,4.6]){ ctx.beginPath(); ctx.arc(rx,hy-3.6-(rx?0:1),0.7,0,7); ctx.fill(); }
    ctx.strokeStyle='#3a2818'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.moveTo(-6.4,hy+1); ctx.lineTo(-4.6,hy+6.4); ctx.moveTo(6.4,hy+1); ctx.lineTo(4.6,hy+6.4); ctx.stroke();
  } else {   // starter: bare head, short unkempt hair
    ctx.fillStyle='#4a3020'; ctx.beginPath(); ctx.arc(0,hy-1,6.9,Math.PI*0.96,Math.PI*2.04); ctx.lineTo(6.2,hy-1.6); ctx.quadraticCurveTo(2,hy-3.4,-1,hy-2.2); ctx.quadraticCurveTo(-4,hy-3.6,-6.2,hy-1.6); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#241810'; ctx.lineWidth=0.8; ctx.stroke();
  }

  ctx.restore();
  if(p.whirlwindT>0) drawWhirlBlade(p, iso, s, mh, true);
  else if(p.cleaveT>0) drawCleaveSwing(p, iso, s, mh, true);
}

// The Ranger gets its own rig: weathered leather and a hooded cloak in dark
// woodland tones instead of the Warrior's polished plate -- an Aragorn-style
// wanderer rather than a knight. Same animation/weapon logic as drawWarrior,
// just a different look.
// (v128) The two Town Guards now wear the player's Ranger skin (bow drawn via drawRanger).
// v393: character looks -- 0 starter / 1 tier 1 / 2 tier 3 / 3 tier 5, chosen from the equipped body armor and helm
// (item brackets 1-2 -> look 1, 3-4 -> look 2, 5 -> look 3). Squires use their Squire rank instead (1-2 / 3-4 / 5+) and ignore gear.
function lookFromItem(it){
  if(!it) return 0;
  let b = it.bracket;
  if(b===undefined) b = it.ilvl ? baseBracketIdx(it.ilvl) : (it.tier ? [0,2,4][Math.min(3,it.tier)-1] : 0);
  return b<=1 ? 1 : b<=3 ? 2 : 3;
}
function squireLook(){ const pl = game && game.player; const r = (pl && pl.skills) ? (effectiveRank(pl,'squire')||0) : 1; return r>=5 ? 3 : r>=3 ? 2 : 1; }
function charLooks(p){
  if(p.isSquire){ const l = squireLook(); return {body:l, helm:l}; }
  const eq = p.equipment || {};
  return {body: p.lookBody!==undefined ? p.lookBody : lookFromItem(eq.armor), helm: p.lookHelm!==undefined ? p.lookHelm : lookFromItem(eq.helm)};
}
function drawGuardIso(gd){
  drawRanger({x:gd.x, y:gd.y, r:16, faceSign:gd.faceSign||1, animT:gd.animT||0, moving:false,
    atkAnimT:Math.min(gd.atkAnimT||0,0.22), castAnimT:0, hitFlash:0, equipment:{mainhand:{slotType:'bow'}},
    dodging:false, invuln:0, iceArmorT:0, vanishT:0, guardianT:0, assaultT:0, lookBody:2, lookHelm:2});
}
function drawRanger(p){
  const iso = toIso(p.x,p.y);
  const s = p.r/16, face = p.faceSign||1, t = p.animT||0;
  const moving = p.moving, atk = p.atkAnimT||0, cast = p.castAnimT||0;
  let alpha = 1;
  if(p.dodging) alpha=0.5; else if(p.hitFlash>0) alpha = 0.55+Math.sin(p.hitFlash*40)*0.2; else if(p.vanishT>0) alpha = 0.3;
  if(p.mirageAlpha) alpha = p.mirageAlpha;

  const eq = (p.equipment) || {};
  const mh = eq.mainhand, offh = eq.offhand;
  const twoHand = !!(mh && mh.twoHanded);
  const isBow = !!(mh && mh.slotType==='bow');
  const isStaff = !!(mh && mh.slotType==='staff');
  const hasShield = !!(offh && offh.slotType==='shield');
  const offhandSword = !!(offh && offh.slotType==='weapon1h');
  const LK = charLooks(p), bodyLook = LK.body, helmLook = LK.helm;   // v393

  drawShadow(iso.x, iso.y, 15*s, 7*s);
  if(p.iceArmorT>0) drawIceArmorAura(p, iso, s);

  if(p.guardianT>0) drawGuardianAura(p, iso, s);

  if(p.assaultT>0) drawAssaultAura(p, iso, s);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s*1.05, s*1.05);

  const walk = moving ? Math.sin(t*10) : 0;
  const bob = moving ? Math.abs(Math.sin(t*10))*2 : Math.sin(t*2)*1.2;
  const legSwing = walk*7;
  const flutter = Math.sin(t*6)*3 + walk*2;

  if(bodyLook>=2){
  // travel cloak (two-layer, weathered dark green-brown instead of a bright cape)
  const cloakBackGrad = ctx.createLinearGradient(-4,-40+bob,-22,-2);
  cloakBackGrad.addColorStop(0,'#1c2016'); cloakBackGrad.addColorStop(1,'#0c0d08');
  ctx.fillStyle = cloakBackGrad;
  ctx.beginPath();
  ctx.moveTo(-6,-39+bob*0.3);
  ctx.quadraticCurveTo(-20+walk*2+flutter*1.3, -17+bob*0.3, -11-flutter*0.6, 2);
  ctx.lineTo(-2,-2);
  ctx.lineTo(-3,-37+bob*0.3);
  ctx.closePath(); ctx.fill();

  const cloakGrad = ctx.createLinearGradient(-4,-42+bob,-20,-6);
  cloakGrad.addColorStop(0, p.invuln>0 ? '#c9b06a' : (bodyLook>=3 ? '#3f6e46' : '#4a4a34'));
  cloakGrad.addColorStop(1, '#20200f');
  ctx.fillStyle = cloakGrad;
  ctx.beginPath();
  ctx.moveTo(-7,-40+bob*0.3);
  ctx.quadraticCurveTo(-15+walk*2+flutter, -20+bob*0.3, -8-flutter*0.4, -1);
  ctx.lineTo(-1,-4);
  ctx.lineTo(-4,-38+bob*0.3);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.8; ctx.stroke();
  if(bodyLook>=3){ ctx.strokeStyle='#d8b04a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-7,-40+bob*0.3); ctx.quadraticCurveTo(-15+walk*2+flutter,-20+bob*0.3,-8-flutter*0.4,-1); ctx.stroke(); }
  }
  if(bodyLook>=1){
  // v352: quiver slung across the back, fletched arrows poking out over the shoulder
  ctx.save(); ctx.translate(-5,-38+bob); ctx.rotate(-0.35);
  ctx.fillStyle='#4a3420'; roundRect(-3.2,-2,6.4,19,2.6); ctx.fill(); ctx.strokeStyle='#1c140c'; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle='#8a6a44'; ctx.fillRect(-3.2,2,6.4,1.4);
  for(const [ax,fc] of [[-1.8,'#b8423a'],[0,'#e8e0c8'],[1.8,'#b8423a']]){ ctx.strokeStyle='#cbb98c'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(ax,-1); ctx.lineTo(ax*1.6,-8); ctx.stroke(); ctx.fillStyle=fc; ctx.beginPath(); ctx.moveTo(ax*1.6,-8); ctx.lineTo(ax*1.6-1.3,-5.6); ctx.lineTo(ax*1.6+1.3,-5.6); ctx.closePath(); ctx.fill(); }
  ctx.restore();

  }
  // legs (worn leather trousers tucked into boots)
  const legGradL = ctx.createLinearGradient(-7,-18,-1,0);
  legGradL.addColorStop(0, bodyLook===0 ? '#8a7a5a' : '#5a4530'); legGradL.addColorStop(1, bodyLook===0 ? '#4e4230' : '#2c2015');
  ctx.fillStyle=legGradL;
  roundRect(-7,-18-legSwing*0.15, 6, 18+legSwing*0.15, 3); ctx.fill();
  ctx.strokeStyle='#1a130c'; ctx.lineWidth=1; ctx.stroke();
  const legGradR = ctx.createLinearGradient(1,-18,7,0);
  legGradR.addColorStop(0, bodyLook===0 ? '#7a6a4c' : '#463620'); legGradR.addColorStop(1, bodyLook===0 ? '#3e3424' : '#221a10');
  ctx.fillStyle=legGradR;
  roundRect(1,-18+legSwing*0.15, 6, 18-legSwing*0.15, 3); ctx.fill();
  ctx.strokeStyle='#1a130c'; ctx.lineWidth=1; ctx.stroke();
  // dark boot cuffs
  ctx.fillStyle = bodyLook===0 ? '#4a3a28' : '#1c140c';
  ctx.fillRect(-7,-4-legSwing*0.15,6,4); ctx.fillRect(1,-4+legSwing*0.15,6,4);

  if(bodyLook>=1){
  // torso (a laced leather jerkin over a plain shirt, not polished plate)
  const torsoGrad = ctx.createLinearGradient(-9,-42+bob,9,-18+bob);
  torsoGrad.addColorStop(0,'#8a6a44'); torsoGrad.addColorStop(0.55,'#5f4a2e'); torsoGrad.addColorStop(1,'#3a2c1a');
  ctx.fillStyle = torsoGrad;
  roundRect(-9,-42+bob, 18, 24, 5); ctx.fill();
  ctx.strokeStyle='#241a0f'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.strokeStyle='rgba(255,240,210,0.18)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-7,-40+bob); ctx.lineTo(-7,-20+bob); ctx.stroke();
  // criss-crossed lacing up the chest instead of a chest seam + belt buckle
  ctx.strokeStyle='#2a1e10'; ctx.lineWidth=1;
  for(const ly of [-37,-32,-27,-22]){
    ctx.beginPath(); ctx.moveTo(-3,ly+bob); ctx.lineTo(3,ly+3+bob); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3,ly+bob); ctx.lineTo(-3,ly+3+bob); ctx.stroke();
  }
  ctx.fillStyle='#3a2c1a'; ctx.fillRect(-9,-21+bob,18,3);
  // a leather baldric (quiver strap) across the chest, in place of pauldrons
  ctx.strokeStyle='#4a3420'; ctx.lineWidth=3.2;
  ctx.beginPath(); ctx.moveTo(-8,-42+bob); ctx.lineTo(7,-19+bob); ctx.stroke();
  ctx.strokeStyle='#2a1e10'; ctx.lineWidth=0.8;
  ctx.beginPath(); ctx.moveTo(-8,-42+bob); ctx.lineTo(7,-19+bob); ctx.stroke();
  // v352: studded belt with a buckle and a hip pouch, leather bracers and a bronze clasp on the baldric
  ctx.fillStyle='#2a1e10'; ctx.fillRect(-9,-21+bob,18,3.4); ctx.fillStyle='#b8923a'; ctx.fillRect(-2,-21.4+bob,4,4.2);
  ctx.fillStyle='#5a4228'; roundRect(4.4,-19.5+bob,5.4,6.4,1.6); ctx.fill(); ctx.strokeStyle='#1c140c'; ctx.lineWidth=0.8; ctx.stroke();
  ctx.fillStyle='#b8923a'; ctx.beginPath(); ctx.arc(-1,-31+bob,1.5,0,7); ctx.fill();
  ctx.fillStyle='#3a2c1a'; ctx.fillRect(-12.6,-35+bob,3.6,5.6);
  // shoulder mantle
  ctx.fillStyle='#4a4a34'; ctx.beginPath(); ctx.ellipse(-8.2,-38.6+bob,3.4,2.4,0.3,0,7); ctx.ellipse(8.2,-38.6+bob,3.4,2.4,-0.3,0,7); ctx.fill(); ctx.strokeStyle='#14170c'; ctx.lineWidth=0.9; ctx.stroke();

  if(bodyLook>=2){   // tier 3: studded leather
    ctx.fillStyle='#9a8a62'; for(const [sx3,sy3] of [[-7,-38],[7,-38],[-7,-30],[7,-30],[-7,-24],[7,-24]]){ ctx.beginPath(); ctx.arc(sx3,sy3+bob,0.8,0,7); ctx.fill(); }
  }
  if(bodyLook>=3){   // tier 5: gold trim, a leaf-green mantle and a gilded clasp
    ctx.strokeStyle='#d8b04a'; ctx.lineWidth=1; roundRect(-9,-42+bob,18,24,5); ctx.stroke();
    ctx.fillStyle='#3f6e46'; ctx.strokeStyle='#14270f'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.ellipse(-8.4,-39+bob,4.8,3.2,0.3,0,7); ctx.ellipse(8.4,-39+bob,4.8,3.2,-0.3,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.arc(-1,-31+bob,2.1,0,7); ctx.fill();
  }
  } else {
  // v393: starter -- a worn linen shirt, a rope belt, nothing else
  const tg = ctx.createLinearGradient(-9,-42+bob,9,-18+bob); tg.addColorStop(0,'#cdbf9c'); tg.addColorStop(0.6,'#a8987a'); tg.addColorStop(1,'#6e6048');
  ctx.fillStyle=tg; roundRect(-9,-42+bob,18,24,5); ctx.fill(); ctx.strokeStyle='#3e3220'; ctx.lineWidth=1.2; ctx.stroke();
  ctx.strokeStyle='#6a5a3c'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.moveTo(-2.4,-42+bob); ctx.lineTo(0,-35+bob); ctx.lineTo(2.4,-42+bob); ctx.stroke();
  ctx.strokeStyle='#7a5a32'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9,-21+bob); ctx.lineTo(9,-21+bob); ctx.stroke();
  ctx.fillStyle='#8a7048'; ctx.fillRect(2,-33+bob,5,4); ctx.fillStyle='#b8a888'; ctx.beginPath(); ctx.ellipse(-8.6,-39+bob,3.4,2.6,0.3,0,7); ctx.ellipse(8.6,-39+bob,3.4,2.6,-0.3,0,7); ctx.fill();
  }
  // off-hand: shield if one is equipped, otherwise a leather-gloved fist
  if(hasShield){
    ctx.save();
    const raised = p.blocking;
    ctx.translate(raised?-14:-12, (raised?-38:-34)+bob);
    if(raised){ ctx.shadowColor='#c9b878'; ctx.shadowBlur=8; }
    const shieldGrad = ctx.createRadialGradient(-1,-3,1,0,0,10);
    shieldGrad.addColorStop(0,'#6a5030'); shieldGrad.addColorStop(0.6,'#4a3620'); shieldGrad.addColorStop(1,'#241a0e');
    ctx.fillStyle=shieldGrad;
    ctx.beginPath(); ctx.ellipse(0,4,raised?8.4:7,raised?11.5:10,0,0,7); ctx.fill();
    ctx.strokeStyle='#160f08'; ctx.lineWidth=1.3; ctx.stroke();
    ctx.strokeStyle='rgba(255,240,210,0.25)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.ellipse(-1.5,1,4.5,7,0,3.4,5.6); ctx.stroke();
    ctx.fillStyle='#8a7040';
    ctx.beginPath(); ctx.arc(0,4,2.4,0,7); ctx.fill();
    ctx.strokeStyle='#4a3420'; ctx.lineWidth=0.8; ctx.stroke();
    ctx.restore();
  } else if(offhandSword){
    ctx.save(); ctx.translate(-11,-34+bob); ctx.scale(-1,1);
    const bladeGrad = ctx.createLinearGradient(-2,-22,2,4);
    bladeGrad.addColorStop(0,'#e4e6ea'); bladeGrad.addColorStop(1,'#7b8390');
    ctx.strokeStyle='#241a0f'; ctx.fillStyle=bladeGrad;
    ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(2,-20); ctx.lineTo(0,-24); ctx.lineTo(-2,-20); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=0.6;
    ctx.beginPath(); ctx.moveTo(0,2); ctx.lineTo(0,-19); ctx.stroke();
    ctx.fillStyle='#4a3420'; ctx.fillRect(-3,3,6,3);
    ctx.restore();
  } else if(isBow){
    ctx.save(); ctx.translate(-2,-24+bob);
    const fistGrad = ctx.createRadialGradient(-1,-1,0.5,0,0,4.2);
    fistGrad.addColorStop(0,'#8a6a44'); fistGrad.addColorStop(1,'#3a2c1a');
    ctx.fillStyle=fistGrad;
    ctx.beginPath(); ctx.arc(0,0,3.8,0,7); ctx.fill();
    ctx.strokeStyle='#241a0f'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(-11,-32+bob);
    const fistGrad = ctx.createRadialGradient(-1,-1,0.5,0,0,5);
    fistGrad.addColorStop(0,'#8a6a44'); fistGrad.addColorStop(1,'#3a2c1a');
    ctx.fillStyle=fistGrad;
    ctx.beginPath(); ctx.arc(0,3,4.4,0,7); ctx.fill();
    ctx.strokeStyle='#241a0f'; ctx.lineWidth=1; ctx.stroke();
    ctx.restore();
  }

  // weapon arm
  const swing = atk>0 ? (atk/0.22) : 0;
  const raise = cast>0 ? (cast/0.25) : 0;
  ctx.save();
  ctx.translate(9,-38+bob);
  ctx.rotate(swing>0 ? (1-swing)*1.9-0.5 : (raise>0 ? -0.6*raise : 0));
  ctx.save();
  if(atk>0){ ctx.shadowColor='#e8d8a8'; ctx.shadowBlur=8*swing; }
  if(isBow){
    // the signature weapon: a worn wooden recurve bow with a taut string
    ctx.translate(0,14);   // v452: lower, centred on the body
    ctx.strokeStyle='#3a2814'; ctx.lineWidth=2.6; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(0,11);
    ctx.quadraticCurveTo(10,0, 4,-13);
    ctx.quadraticCurveTo(10,-24, 0,-35);
    ctx.stroke();
    ctx.strokeStyle='#cfc4a8'; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(0,11); ctx.lineTo(0,-35); ctx.stroke();
    ctx.fillStyle='#241a0f'; ctx.fillRect(-1.8,-15,3.6,7);
  } else if(isStaff){
    // simple wooden staff, same silhouette as the Mystic's own rig
    const shaftGrad = ctx.createLinearGradient(-2,-34,2,10);
    shaftGrad.addColorStop(0,'#8a6a3c'); shaftGrad.addColorStop(1,'#3a2814');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(-1.6,-34,3.2,44);
    ctx.strokeStyle='#20150a'; ctx.lineWidth=0.8; ctx.strokeRect(-1.6,-34,3.2,44);
    ctx.fillStyle='#5a4020'; ctx.fillRect(-2.2,2,4.4,6);
    const orbGrad = ctx.createRadialGradient(-1,-37,0.5,0,-35,5.2);
    orbGrad.addColorStop(0,'#ffffff'); orbGrad.addColorStop(0.5,'#8fd0ff'); orbGrad.addColorStop(1,'#1a2028');
    ctx.fillStyle = orbGrad;
    ctx.beginPath(); ctx.arc(0,-35,4.6,0,7); ctx.fill();
    ctx.strokeStyle='#160f08'; ctx.lineWidth=1; ctx.stroke();
  } else if(twoHand){
    const bladeGrad = ctx.createLinearGradient(-3,-34,3,6);
    bladeGrad.addColorStop(0,'#e8eaee'); bladeGrad.addColorStop(0.5,'#b3bac6'); bladeGrad.addColorStop(1,'#6a7280');
    ctx.strokeStyle='#241a0f'; ctx.fillStyle=bladeGrad;
    ctx.beginPath(); ctx.moveTo(0,6); ctx.lineTo(3.4,-30); ctx.lineTo(0,-35); ctx.lineTo(-3.4,-30); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.45)'; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(0,3); ctx.lineTo(0,-30); ctx.stroke();
    ctx.fillStyle='#4a3420'; ctx.fillRect(-7,4,14,3);
    ctx.fillStyle='#2a1e10'; ctx.fillRect(-2.2,7,4.4,9);
    ctx.fillStyle=hasShield?'#6a5030':'#3a2c1a';
    ctx.beginPath(); ctx.arc(0,16,3.6,0,7); ctx.fill();
    ctx.strokeStyle='#160f08'; ctx.lineWidth=1; ctx.stroke();
  } else {
    const bladeGrad = ctx.createLinearGradient(-2,-26,2,4);
    bladeGrad.addColorStop(0,'#e4e6ea'); bladeGrad.addColorStop(1,'#7b8390');
    ctx.strokeStyle='#241a0f'; ctx.fillStyle=bladeGrad;
    ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(2,-22); ctx.lineTo(0,-26); ctx.lineTo(-2,-22); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=0.6;
    ctx.beginPath(); ctx.moveTo(0,2); ctx.lineTo(0,-21); ctx.stroke();
    ctx.fillStyle='#4a3420'; ctx.fillRect(-3,3,6,3);
  }
  ctx.restore();
  ctx.restore();

  // head: a pointed leather hood instead of a metal helm, with a shadowed
  // weathered face and no bright plume
  const headY = -48+bob;
  if(helmLook>=2){
  ctx.fillStyle = '#c9976a'; // sun-weathered skin, mostly hidden by the hood
  ctx.beginPath(); ctx.arc(0, headY+1, 6, 0.15, Math.PI-0.15); ctx.fill();
  // hood -- a deep cowl framing the face, drawn over the top/sides of the head
  const hoodGrad = ctx.createLinearGradient(0,headY-9,0,headY+5);
  hoodGrad.addColorStop(0,'#3a4a30'); hoodGrad.addColorStop(1,'#1a2414');
  ctx.fillStyle = hoodGrad;
  ctx.beginPath();
  ctx.moveTo(-7,headY+3);
  ctx.quadraticCurveTo(-8,headY-9, 0,headY-10);
  ctx.quadraticCurveTo(8,headY-9, 7,headY+3);
  ctx.quadraticCurveTo(4,headY-1, 0,headY-1);
  ctx.quadraticCurveTo(-4,headY-1, -7,headY+3);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#0e1409'; ctx.lineWidth=1; ctx.stroke();
  // shadowed brow line under the hood's edge
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.fillRect(-5,headY-1,10,1.6);
  // a hint of stubble/jaw shadow
  ctx.fillStyle='rgba(60,40,25,0.4)';
  ctx.beginPath(); ctx.ellipse(0,headY+4,4,2.2,0,0,7); ctx.fill();
  // v352: keen eyes catching the light under the cowl, a cloth scarf at the neck and a feather in the hood
  ctx.fillStyle='#e8dcb0'; ctx.beginPath(); ctx.arc(-2.2,headY+0.9,0.9,0,7); ctx.arc(2.4,headY+0.9,0.9,0,7); ctx.fill();
  ctx.fillStyle='#2a3a1c'; ctx.beginPath(); ctx.arc(-2.1,headY+0.9,0.45,0,7); ctx.arc(2.5,headY+0.9,0.45,0,7); ctx.fill();
  ctx.fillStyle='#6a4a2a'; ctx.beginPath(); ctx.ellipse(0,headY+7.4,5,1.7,0,0,7); ctx.fill(); ctx.strokeStyle='#1a1208'; ctx.lineWidth=0.8; ctx.stroke();
  ctx.fillStyle='#b8423a'; ctx.beginPath(); ctx.moveTo(5.4,headY-6.6); ctx.quadraticCurveTo(11,headY-12,12,headY-4.4); ctx.quadraticCurveTo(8,headY-8,5.4,headY-5.4); ctx.closePath(); ctx.fill();

  if(helmLook>=3){   // tier 5: gold-stitched hood and a longer feather
    ctx.strokeStyle='#d8b04a'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-7,headY+3); ctx.quadraticCurveTo(-8,headY-9,0,headY-10); ctx.quadraticCurveTo(8,headY-9,7,headY+3); ctx.stroke();
    ctx.fillStyle='#2f8a4a'; ctx.beginPath(); ctx.moveTo(5.6,headY-6.6); ctx.quadraticCurveTo(14,headY-16,16,headY-6); ctx.quadraticCurveTo(10,headY-10,5.6,headY-5.4); ctx.closePath(); ctx.fill();
  }
  } else {
  // v393: starter (bare head, messy hair) / tier 1 (a plain brown cap with a short brim)
  ctx.fillStyle='#c9976a'; ctx.beginPath(); ctx.arc(0,headY+1,6,0,7); ctx.fill(); ctx.strokeStyle='#4a3220'; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle='rgba(60,40,25,0.4)'; ctx.beginPath(); ctx.ellipse(0,headY+4,4,2.2,0,0,7); ctx.fill();
  ctx.fillStyle='#e8dcb0'; ctx.beginPath(); ctx.arc(-2.2,headY+0.9,0.9,0,7); ctx.arc(2.4,headY+0.9,0.9,0,7); ctx.fill();
  ctx.fillStyle='#2a3a1c'; ctx.beginPath(); ctx.arc(-2.1,headY+0.9,0.45,0,7); ctx.arc(2.5,headY+0.9,0.45,0,7); ctx.fill();
  if(helmLook===1){
    ctx.fillStyle='#5a4a30'; ctx.strokeStyle='#241a0f'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(0,headY-1.2,7,Math.PI,0); ctx.lineTo(7.4,headY-1.4); ctx.lineTo(-7.4,headY-1.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#46382a'; ctx.beginPath(); ctx.ellipse(1.4,headY-1.4,8.8,2,0,0,7); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle='#5a3a22'; ctx.strokeStyle='#2a1a0e'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(0,headY-1,6.8,Math.PI*0.96,Math.PI*2.04); ctx.lineTo(6,headY-1.4); ctx.quadraticCurveTo(2,headY-4,-1,headY-2.4); ctx.quadraticCurveTo(-4,headY-4,-6,headY-1.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-3,headY-7); ctx.lineTo(-1.6,headY-9.6); ctx.lineTo(-0.4,headY-6.8); ctx.moveTo(2,headY-7); ctx.lineTo(3.6,headY-9); ctx.lineTo(4.4,headY-5.8); ctx.stroke();
  }
  }
  ctx.restore();
}

// The Mystic: a caster in a green undershirt beneath flowing purple robes,
// channeling spells through a two-handed staff. Same body rig/animation
// timing as the other classes, different silhouette and always a staff.
function drawMystic(p){
  const iso = toIso(p.x,p.y);
  const s = p.r/16, face = p.faceSign||1, t = p.animT||0;
  const moving = p.moving, atk = p.atkAnimT||0;
  let alpha = 1;
  if(p.dodging) alpha=0.5; else if(p.hitFlash>0) alpha = 0.55+Math.sin(p.hitFlash*40)*0.2; else if(p.vanishT>0) alpha = 0.3;

  const eq = (p.equipment) || {};
  const mh = eq.mainhand;
  const spell = (mh && mh.spell) || 'fire';
  const spellColor = p.cultist ? '#e03a48' : p.mendicant ? '#ffe08a' : STAFF_SPELL_INFO[spell].color;
  const LK = charLooks(p), bodyLook = LK.body, helmLook = LK.helm;   // v393: 0 peasant / 1 apprentice / 2 adept / 3 archmage
  let RB = [['#7a6a52','#3e3226'],['#505070','#26263c'],['#3a1f52','#170c22'],['#4a2470','#1c0c30']][bodyLook];
  let RT = [['#8a7a60','#5a4c38','#2e241a'],['#6a6a8c','#464668','#26263c'],['#6a3a8a','#4a2568','#2a1440'],['#8a4aba','#5a2c88','#2e1250']][bodyLook];
  if(p.cultist){ RB = ['#1a1418','#070507']; RT = ['#2e262c','#17121a','#080609']; }
  if(p.mendicant){ RB = ['#d6c9aa','#8c7c5a']; RT = ['#ebdfc2','#b9a780','#6c5b3a']; }   // v461: Highward Mendicant -- pale templar robes   // v419: Cultist -- black robes

  drawShadow(iso.x, iso.y, 15*s, 7*s);
  if((p.staticStacks||0)>0 || p.windReady) drawDjinnFx(p, iso, s);
  if(p.iceArmorT>0) drawIceArmorAura(p, iso, s);

  if(p.guardianT>0) drawGuardianAura(p, iso, s);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s*1.05, s*1.05);

  const walk = moving ? Math.sin(t*10) : 0;
  const bob = moving ? Math.abs(Math.sin(t*10))*2 : Math.sin(t*2)*1.2;
  const legSwing = walk*7;
  const flutter = Math.sin(t*6)*3 + walk*2;

  // trailing robe skirt, billowing purple
  const robeBackGrad = ctx.createLinearGradient(-4,-40+bob,-20,4);
  robeBackGrad.addColorStop(0,RB[0]); robeBackGrad.addColorStop(1,RB[1]);
  ctx.fillStyle = robeBackGrad;
  ctx.beginPath();
  ctx.moveTo(-8,-38+bob*0.3);
  ctx.quadraticCurveTo(-18+walk*2+flutter, -10+bob*0.3, -6-flutter*0.5, 10);
  ctx.lineTo(6,10);
  ctx.quadraticCurveTo(16-walk*2-flutter, -10+bob*0.3, 8,-38+bob*0.3);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.8; ctx.stroke();

  // hem trim glowing faintly with the staff's spell color
  if(bodyLook>=2){
  ctx.strokeStyle = spellColor; ctx.lineWidth=1; ctx.globalAlpha = alpha*0.7;
  ctx.beginPath(); ctx.moveTo(-6-flutter*0.5,10); ctx.lineTo(6,10); ctx.stroke();
  ctx.globalAlpha = alpha;
  }
  if(bodyLook>=3){ ctx.strokeStyle='#d8b04a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-7-flutter*0.5,9); ctx.lineTo(7,9); ctx.stroke(); }

  // feet peeking out from under the robe
  ctx.fillStyle = bodyLook===0 ? '#d9b48a' : '#1c140c';
  ctx.fillRect(-6,-2-legSwing*0.15,5,4); ctx.fillRect(1,-2+legSwing*0.15,5,4);

  // torso: green undershirt visible at the collar, purple robe over the top
  const robeGrad = ctx.createLinearGradient(-9,-42+bob,9,-14+bob);
  robeGrad.addColorStop(0,RT[0]); robeGrad.addColorStop(0.55,RT[1]); robeGrad.addColorStop(1,RT[2]);
  ctx.fillStyle = robeGrad;
  roundRect(-9,-42+bob, 18, 26, 5); ctx.fill();
  ctx.strokeStyle='#1a0e28'; ctx.lineWidth=1.4; ctx.stroke();
  // green undershirt collar/chest strip
  ctx.fillStyle = bodyLook>=2 ? '#3a7a4a' : '#d8ccae';
  ctx.beginPath();
  ctx.moveTo(-3.5,-42+bob); ctx.lineTo(3.5,-42+bob); ctx.lineTo(2,-30+bob); ctx.lineTo(-2,-30+bob);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-7,-40+bob); ctx.lineTo(-7,-18+bob); ctx.stroke();
  // a rope-cord belt instead of lacing/buckle
  ctx.strokeStyle = bodyLook>=2 ? '#c9a24a' : '#7a5a32'; ctx.lineWidth=1.6;
  ctx.beginPath(); ctx.moveTo(-9,-20+bob); ctx.lineTo(9,-20+bob); ctx.stroke();
  // v352: wide sleeves with glowing cuffs, runic trim down the front, a shoulder mantle and a dangling sash
  if(bodyLook>=2){
  ctx.strokeStyle=spellColor; ctx.lineWidth=0.9; ctx.globalAlpha=alpha*0.75;
  ctx.beginPath(); ctx.moveTo(0,-30+bob); ctx.lineTo(0,-21+bob); ctx.moveTo(-2,-27+bob); ctx.lineTo(2,-27+bob); ctx.moveTo(-1.4,-24+bob); ctx.lineTo(1.4,-24+bob); ctx.stroke();
  ctx.globalAlpha=alpha;
  }
  ctx.fillStyle=RB[0]; ctx.beginPath(); ctx.ellipse(-8.6,-41.4+bob,5,3.4,0.25,0,7); ctx.ellipse(8.6,-41.4+bob,5,3.4,-0.25,0,7); ctx.fill(); ctx.strokeStyle='#1a0e28'; ctx.lineWidth=0.9; ctx.stroke();
  ctx.fillStyle=RT[0]; ctx.beginPath(); ctx.moveTo(-9.8,-38+bob); ctx.lineTo(-14,-30+bob); ctx.lineTo(-7.5,-30+bob); ctx.closePath(); ctx.fill(); ctx.stroke();   // off-hand sleeve
  if(bodyLook>=2){ ctx.strokeStyle=spellColor; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-14,-30+bob); ctx.lineTo(-7.5,-30+bob); ctx.stroke(); }
  ctx.fillStyle='#c9a24a'; ctx.beginPath(); ctx.moveTo(2,-20+bob); ctx.lineTo(5,-20+bob); ctx.lineTo(4+flutter*0.2,-9+bob); ctx.lineTo(2.4+flutter*0.2,-9+bob); ctx.closePath(); ctx.fill();

  if(bodyLook>=3){   // archmage: gold embroidery and a few orbiting sparks
    ctx.strokeStyle='#d8b04a'; ctx.lineWidth=1.1; roundRect(-9,-42+bob,18,26,5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9,-30+bob); ctx.lineTo(-6,-26+bob); ctx.lineTo(-9,-22+bob); ctx.moveTo(9,-30+bob); ctx.lineTo(6,-26+bob); ctx.lineTo(9,-22+bob); ctx.stroke();
    ctx.fillStyle=spellColor; ctx.globalAlpha=alpha*0.8; for(let i=0;i<3;i++){ const a2=t*2.2+i*2.1; ctx.beginPath(); ctx.arc(Math.cos(a2)*13,-30+bob+Math.sin(a2)*6,1.2,0,7); ctx.fill(); } ctx.globalAlpha=alpha;
  }
  // off-hand: empty, spell-charged glowing fingertips (staff is always two-handed)
  ctx.save(); ctx.translate(-11,-32+bob);
  ctx.shadowColor = spellColor; ctx.shadowBlur = bodyLook>=2 ? 4 : 0;
  ctx.fillStyle = bodyLook>=2 ? spellColor : '#d9b48a'; ctx.globalAlpha = alpha*0.85;
  ctx.beginPath(); ctx.arc(0,3,3,0,7); ctx.fill();
  ctx.restore();

  // weapon arm: the staff, topped with an orb that glows in the spell's color
  const swing = atk>0 ? (atk/0.22) : 0;
  ctx.save();
  ctx.translate(9,-38+bob);
  ctx.rotate(swing>0 ? (1-swing)*1.4-0.3 : 0);
  if(atk>0){ ctx.shadowColor=spellColor; ctx.shadowBlur=10*swing; }
  const shaftGrad = ctx.createLinearGradient(-2,-34,2,10);
  shaftGrad.addColorStop(0,'#7a5a34'); shaftGrad.addColorStop(1,'#3a2814');
  ctx.fillStyle = shaftGrad;
  ctx.fillRect(-1.6,-34,3.2,44);
  ctx.strokeStyle='#20150a'; ctx.lineWidth=0.8; ctx.strokeRect(-1.6,-34,3.2,44);
  // orb
  const orbGrad = ctx.createRadialGradient(-1,-37,0.5,0,-35,6);
  orbGrad.addColorStop(0,'#ffffff'); orbGrad.addColorStop(0.4,spellColor); orbGrad.addColorStop(1,'#1a0e28');
  ctx.fillStyle = orbGrad;
  ctx.shadowColor = spellColor; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(0,-35,5.2,0,7); ctx.fill();
  ctx.strokeStyle='#160f08'; ctx.lineWidth=1; ctx.stroke();
  ctx.restore();

  // head, hairless simple hood-free caster face with a faint circlet
  const headY = -48+bob;
  ctx.fillStyle = '#d9b48a';
  ctx.beginPath(); ctx.arc(0, headY+1, 6, 0, 7); ctx.fill();
  if(helmLook>=2){ ctx.strokeStyle='#6a3a8a'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.arc(0, headY-2, 6.3, 3.4, 6.0); ctx.stroke(); }
  ctx.fillStyle='rgba(60,40,25,0.25)';
  ctx.beginPath(); ctx.ellipse(0,headY+4,4,2,0,0,7); ctx.fill();
  // v352: flowing hair under a pointed collar, a gem on the circlet and eyes lit by the staff
  ctx.fillStyle=(helmLook>=2?'#2a1a3a':'#4a3020'); ctx.beginPath(); ctx.arc(0,headY-1,6.6,Math.PI*1.02,Math.PI*1.98); ctx.lineTo(5.6,headY-4.4); ctx.quadraticCurveTo(0,headY-2.6,-5.6,headY-4.4); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6.4,headY-2); ctx.quadraticCurveTo(-9+flutter*0.2,headY+5,-6.6-flutter*0.3,headY+11); ctx.lineTo(-4.4,headY+3); ctx.closePath(); ctx.fill();
  if(helmLook>=2){ ctx.fillStyle=spellColor; ctx.shadowColor=spellColor; ctx.shadowBlur=5; ctx.beginPath(); ctx.arc(0,headY-6.4,1.5,0,7); ctx.fill(); ctx.shadowBlur=0; }
  ctx.fillStyle = helmLook>=2 ? spellColor : '#2a1c10'; ctx.beginPath(); ctx.arc(-2.2,headY+1,0.8,0,7); ctx.arc(2.4,headY+1,0.8,0,7); ctx.fill();
  ctx.fillStyle=RT[1]; ctx.beginPath(); ctx.moveTo(-6,-44+bob); ctx.lineTo(0,-39.5+bob); ctx.lineTo(6,-44+bob); ctx.lineTo(7.4,-42+bob); ctx.lineTo(0,-37+bob); ctx.lineTo(-7.4,-42+bob); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#1a0e28'; ctx.lineWidth=0.9; ctx.stroke();

  if(helmLook===1){   // apprentice: a plain cloth cowl
    ctx.fillStyle='#5a5a7a'; ctx.strokeStyle='#26263c'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(-7.2,headY+4); ctx.quadraticCurveTo(-8,headY-9,0,headY-11); ctx.quadraticCurveTo(8,headY-9,7.2,headY+4); ctx.quadraticCurveTo(4,headY-2.6,0,headY-2.8); ctx.quadraticCurveTo(-4,headY-2.6,-7.2,headY+4); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if(helmLook>=3){   // archmage: a tall pointed hat with a gold band and a star
    ctx.fillStyle='#2e1450'; ctx.strokeStyle='#160a28'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(0,headY-4.6,10.4,2.8,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#3a1860'; ctx.beginPath(); ctx.moveTo(-7.4,headY-5); ctx.quadraticCurveTo(-4,headY-8,-1.4,headY-19); ctx.quadraticCurveTo(5+flutter*0.3,headY-26,10+flutter*0.5,headY-24); ctx.quadraticCurveTo(5,headY-16,7.4,headY-5); ctx.quadraticCurveTo(0,headY-7.4,-7.4,headY-5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#d8b04a'; ctx.beginPath(); ctx.ellipse(0,headY-5.8,7.4,1.6,0,0,7); ctx.fill();
    ctx.fillStyle=spellColor; ctx.shadowColor=spellColor; ctx.shadowBlur=4; ctx.beginPath(); ctx.arc(1,headY-13,1.5,0,7); ctx.fill(); ctx.shadowBlur=0;
  }
  ctx.restore();
}

