// Boss slam warning: a pulsing red ring on the ground marking exactly where
// the AoE will land, shrinking/intensifying as the telegraph runs out.
function drawSlamRingIso(pos, telegraphT){
  const iso = toIso(pos.x, pos.y);
  const frac = clamp(1 - telegraphT/BOSS_SLAM_TELEGRAPH, 0, 1);
  const pulse = 1 + Math.sin(frac*18)*0.04;
  const rad = BOSS_SLAM_RADIUS*pulse;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  const grad = ctx.createRadialGradient(0,0,rad*0.5,0,0,rad);
  grad.addColorStop(0,'rgba(220,40,20,0)'); grad.addColorStop(0.85,'rgba(220,40,20,'+(0.18+frac*0.22)+')'); grad.addColorStop(1,'rgba(255,80,40,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0,0,rad*ISO_KX,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,60,30,'+(0.5+frac*0.5)+')';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(0,0,rad*ISO_KX,0,7); ctx.stroke();
  ctx.restore();
}
// Hunter's planted trap -- a small covered pit with a few dark spikes,
// sitting flush with the ground until something steps on it.
function drawTrapIso(tr){
  const iso = toIso(tr.x, tr.y);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.fillStyle = 'rgba(20,16,10,0.55)';
  ctx.beginPath(); ctx.ellipse(0,0, 16*ISO_KX, 16, 0,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,40,0.8)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0,0, 16*ISO_KX, 16, 0,0,7); ctx.stroke();
  ctx.fillStyle = '#2a2016';
  for(let i=0;i<5;i++){
    const a = (i/5)*Math.PI*2;
    const px = Math.cos(a)*9*ISO_KX, py = Math.sin(a)*9;
    ctx.beginPath(); ctx.moveTo(px,py-5); ctx.lineTo(px-2,py+2); ctx.lineTo(px+2,py+2); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// v230: unified bandit look -- red face-wrap, leather vest over a rough tunic, belt, boots. Melee bandit: sabre;
// archer: hooded with a shortbow and quiver; brute / tower leader: bigger, bare-armed, iron skullcap, studded pauldrons, war-axe and sash.
// v310: the possessed graverobber -- ragged hooded long coat, a grave-digger's shovel, and pale violet eyes
function drawDefiler(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  const s = e.r/15*1.05;
  const F = (c)=>flash ? '#fff' : c;
  drawShadow(iso.x, iso.y, 15*s, 6*s);
  const lift = e.dfLift||0;   // v548: below 25% life he floats
  if(lift>0){ ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(iso.x, iso.y-lift, 2, iso.x, iso.y-lift, 40*s); gl.addColorStop(0,'rgba(150,90,255,0.35)'); gl.addColorStop(1,'rgba(150,90,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(iso.x, iso.y-lift-14*s, 40*s, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(iso.x, iso.y - lift - (lift>0 ? Math.sin((e.animT||0)*2.4)*3 : 0)); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*9) : 0, bob = moving ? Math.abs(Math.sin(t*9))*1.6 : Math.sin(t*2)*0.6;
  // boots
  ctx.fillStyle = F('#16110c');
  roundRect(-6+walk*3,-5,6,5,2); ctx.fill(); roundRect(1-walk*3,-5,6,5,2); ctx.fill();
  // long ragged coat
  ctx.fillStyle = F('#3b3026'); ctx.strokeStyle = 'rgba(0,0,0,0.65)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-7,-30+bob); ctx.lineTo(7,-30+bob); ctx.lineTo(11,-4); ctx.lineTo(7,-6); ctx.lineTo(4,-3); ctx.lineTo(0,-6); ctx.lineTo(-4,-2); ctx.lineTo(-7,-6); ctx.lineTo(-11,-4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = F('#241c14'); ctx.fillRect(-1.2,-29+bob,2.4,23);          // coat seam
  ctx.fillStyle = F('#5a4630'); ctx.fillRect(-7,-17+bob,14,2.2);            // rope belt
  // back arm + hood
  ctx.fillStyle = F('#2e251c'); roundRect(-10,-28+bob,4,13,2); ctx.fill();
  ctx.fillStyle = F('#1c1610'); ctx.beginPath(); ctx.arc(0,-34+bob,7.4,Math.PI*0.95,Math.PI*2.05); ctx.lineTo(6,-27+bob); ctx.lineTo(-6,-27+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#07050a'; ctx.beginPath(); ctx.ellipse(1.5,-32.5+bob,4.4,4.6,0,0,7); ctx.fill();
  // possessed eyes
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(190,150,255,0.95)';
  ctx.beginPath(); ctx.arc(0.2,-33+bob,1.3,0,7); ctx.arc(3.4,-33+bob,1.3,0,7); ctx.fill(); ctx.restore();
  // shovel (swings on attack)
  ctx.save(); ctx.translate(8,-22+bob); ctx.rotate(atk>0 ? -1.1+ (0.22-Math.min(atk,0.22))*14 : 0.25);
  ctx.strokeStyle = F('#5a3a1c'); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(0,-26); ctx.stroke();
  ctx.fillStyle = F('#8a8f98'); ctx.beginPath(); ctx.moveTo(-4.5,-26); ctx.lineTo(4.5,-26); ctx.lineTo(3.5,-36); ctx.lineTo(0,-39); ctx.lineTo(-3.5,-36); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  // front arm
  ctx.fillStyle = F('#3b3026'); roundRect(5,-28+bob,4,12,2); ctx.fill();
  ctx.fillStyle = F('#b69a7c'); ctx.beginPath(); ctx.arc(8,-16+bob,2.2,0,7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 56*s, e.r*1.35, e.hp, e.maxHp);
}
function drawBandit(e){
  const iso = toIso(e.x,e.y), kind = e.type, face = e.faceSign||1, t = e.animT||0, moving = e.moving, atk = e.atkAnimT||0, flash = e.hitT>0;
  const king = kind==='banditking', brute = kind==='banditbrute' || king, arch = kind==='banditarcher';
  const s = arch ? 1.22*15/16 : king ? e.r/16*0.95 : e.r/16*(brute?1.25:1.22);   // v452: archers drawn exactly at bandit size (v490: both shrunk to the player's height)
  const torsoW = brute?21:arch?13:15, torsoH = brute?23:18, legLen = brute?16:14, headR = brute?8.5:7;
  const F = (c)=>flash ? '#fff' : c;
  const skin = brute ? '#b9805a' : '#d9a87a', tunic = king ? '#8a1c20' : arch ? '#5a6230' : brute ? '#5a3a24' : '#7a5530', vest = king ? '#2a1410' : arch ? '#3a3a1c' : '#2e2016';
  const pants = '#2c241c', boot = '#17120d', red = king ? '#d8a84a' : '#b02a2a', redDark = king ? '#8a6420' : '#701818', bronze = king ? '#f0c860' : '#c9a25a';
  drawShadow(iso.x, iso.y, (torsoW+6)*s*0.9*(king && e.bkHop ? Math.max(0.5, 1-e.bkHop/160) : 1), torsoW*0.38*s);
  ctx.save(); ctx.translate(iso.x, iso.y - (king ? (e.bkHop||0) : 0)); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*11) : 0, bob = moving ? Math.abs(Math.sin(t*11))*2 : Math.sin(t*2.2);
  const swing = walk*6, baseY = -legLen + bob;
  const armY = baseY - torsoH*0.72, reach = atk>0 ? 7 : 0;
  if(king){   // a long crimson cloak with a fur trim, behind everything
    const cw = Math.sin(t*3)*1.5 + (moving ? Math.sin(t*11)*1.5 : 0);
    ctx.fillStyle = F('#5e1014'); ctx.beginPath(); ctx.moveTo(-torsoW*0.55, -legLen-torsoH*0.95+bob); ctx.quadraticCurveTo(-torsoW*1.0-cw, -legLen*0.3, -torsoW*0.85-cw, 2); ctx.lineTo(torsoW*0.55, 2); ctx.quadraticCurveTo(torsoW*0.7, -legLen*0.4, torsoW*0.55, -legLen-torsoH*0.95+bob); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = F('#2a0608'); ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = F('#d8a84a'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-torsoW*0.85-cw, 1); ctx.lineTo(torsoW*0.55, 1); ctx.stroke();
  }
  // back layer: cloak (archer), quiver (archer), sash tails (brute)
  if(arch){
    ctx.fillStyle = F('#3c4422');
    ctx.beginPath(); ctx.moveTo(-torsoW*0.45, baseY-torsoH*0.95); ctx.lineTo(-torsoW*0.85, baseY+legLen*0.1+Math.sin(t*3)*1.2); ctx.lineTo(torsoW*0.1, baseY-torsoH*0.1); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(-torsoW*0.3, baseY-torsoH*0.85); ctx.rotate(-0.35);
    ctx.fillStyle = F('#4a2e16'); roundRect(-3, -2, 6, torsoH*0.7, 2); ctx.fill();
    ctx.fillStyle = F('#d8d0b0'); for(const dx of [-2,0,2]){ ctx.fillRect(dx-0.4, -6, 0.9, 5); }
    ctx.restore();
  }
  // legs + boots
  for(const side of [-1,1]){
    const sw = side*swing*0.5;
    ctx.fillStyle = F(pants); roundRect(side*torsoW*0.3-3, baseY-legLen*0.05+ (side>0?-swing*0.1:swing*0.1), 6, legLen, 2); ctx.fill();
    ctx.fillStyle = F(boot); roundRect(side*torsoW*0.3-3.6, baseY+legLen*0.68+sw*0.12, 7.2, legLen*0.36, 2); ctx.fill();
  }
  // torso: tunic, then leather vest, belt + buckle
  const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY); tg.addColorStop(0, tunic); tg.addColorStop(1, '#2e2016');
  ctx.fillStyle = flash ? '#fff' : tg; roundRect(-torsoW/2, baseY-torsoH, torsoW, torsoH, torsoW*0.28); ctx.fill();
  ctx.strokeStyle = '#1c130c'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = F(vest);
  ctx.beginPath(); ctx.moveTo(-torsoW*0.42, baseY-torsoH*0.96); ctx.lineTo(-torsoW*0.1, baseY-torsoH*0.96); ctx.lineTo(0, baseY-torsoH*0.5); ctx.lineTo(torsoW*0.1, baseY-torsoH*0.96); ctx.lineTo(torsoW*0.42, baseY-torsoH*0.96); ctx.lineTo(torsoW*0.4, baseY-torsoH*0.08); ctx.lineTo(-torsoW*0.4, baseY-torsoH*0.08); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = F('#6a4a2a'); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, baseY-torsoH*0.5); ctx.lineTo(0, baseY-torsoH*0.1); ctx.stroke();
  ctx.fillStyle = F('#17110a'); ctx.fillRect(-torsoW/2, baseY-torsoH*0.24, torsoW, Math.max(2.4, torsoH*0.12));
  ctx.fillStyle = F(bronze); ctx.fillRect(-1.6, baseY-torsoH*0.24+0.2, 3.2, Math.max(2, torsoH*0.12-0.4));
  if(brute){   // red sash slung across the chest, studded leather pauldrons
    ctx.fillStyle = F(red); ctx.beginPath(); ctx.moveTo(-torsoW*0.5, baseY-torsoH*0.95); ctx.lineTo(-torsoW*0.25, baseY-torsoH*0.97); ctx.lineTo(torsoW*0.5, baseY-torsoH*0.2); ctx.lineTo(torsoW*0.25, baseY-torsoH*0.1); ctx.closePath(); ctx.fill();
    for(const sd of [-1,1]){
      ctx.fillStyle = F('#3a2616'); ctx.beginPath(); ctx.ellipse(sd*torsoW*0.5, baseY-torsoH*0.9, 6.4, 5, 0, 0, 7); ctx.fill(); ctx.strokeStyle='#120c07'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle = F(bronze); for(const k of [-1,0,1]){ ctx.beginPath(); ctx.arc(sd*torsoW*0.5+k*2.6, baseY-torsoH*0.9-0.6, 0.9, 0, 7); ctx.fill(); }
    }
  }
  // far arm (behind/at side)
  ctx.fillStyle = F(brute ? skin : tunic);
  ctx.beginPath(); ctx.moveTo(-torsoW/2, armY-1); ctx.lineTo(-torsoW/2-6, armY+8); ctx.lineTo(-torsoW/2-3, armY+10.5); ctx.lineTo(-torsoW/2+2, armY+4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.arc(-torsoW/2-4.6, armY+9.6, 1.9, 0, 7); ctx.fill();
  // near (weapon) arm
  const hx = torsoW/2+4+reach, hy = armY+9;
  ctx.fillStyle = F(brute ? skin : tunic);
  ctx.beginPath(); ctx.moveTo(torsoW/2, armY-1); ctx.lineTo(hx+2, hy-2); ctx.lineTo(hx-1, hy+1.5); ctx.lineTo(torsoW/2-2, armY+4); ctx.closePath(); ctx.fill();
  if(brute){ ctx.fillStyle = F('#4a4a50'); ctx.fillRect(hx-3.6, hy-3.4, 4.6, 2.6); }   // iron bracer
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.arc(hx, hy, 2, 0, 7); ctx.fill();
  if(king){   // fur mantle across the shoulders
    ctx.fillStyle = F('#7a6a58'); ctx.beginPath(); ctx.ellipse(0, baseY-torsoH*0.98, torsoW*0.68, 5.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = F('#a8987e'); for(let k=-3;k<=3;k++){ ctx.beginPath(); ctx.arc(k*torsoW*0.18, baseY-torsoH*0.98-1.5+Math.abs(k)*0.6, 2.2, 0, 7); ctx.fill(); }
  }
  // head
  const headY = baseY-torsoH-headR*0.55;
  ctx.fillStyle = F(skin); ctx.beginPath(); ctx.arc(0, headY, headR, 0, 7); ctx.fill(); ctx.strokeStyle='#3a2414'; ctx.lineWidth=1; ctx.stroke();
  // eyes + brow
  ctx.fillStyle = flash ? '#fff' : '#1a120c';
  ctx.beginPath(); ctx.arc(-headR*0.36, headY-headR*0.12, 1.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(headR*0.36, headY-headR*0.12, 1.2, 0, 7); ctx.fill();
  ctx.strokeStyle = flash ? '#fff' : '#2a1a0e'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-headR*0.65, headY-headR*0.42); ctx.lineTo(-headR*0.12, headY-headR*0.28); ctx.moveTo(headR*0.65, headY-headR*0.42); ctx.lineTo(headR*0.12, headY-headR*0.28); ctx.stroke();
  e._eye = {x:iso.x, y:iso.y+headY*s, dx:headR*0.36*s, r:Math.max(1.4,1.4*s), c:'#e8d8b8'};
  // red face-wrap covering nose and mouth, knot tails fluttering behind
  ctx.fillStyle = F(red);
  ctx.beginPath(); ctx.moveTo(-headR*0.98, headY+headR*0.02); ctx.lineTo(headR*0.98, headY+headR*0.02); ctx.lineTo(headR*0.8, headY+headR*0.78); ctx.quadraticCurveTo(0, headY+headR*1.12, -headR*0.8, headY+headR*0.78); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = F(redDark); ctx.lineWidth = 0.8; ctx.stroke();
  const fl = Math.sin(t*7)*1.6;
  ctx.fillStyle = F(redDark);
  ctx.beginPath(); ctx.moveTo(-headR*0.92, headY+headR*0.1); ctx.lineTo(-headR*1.9, headY+headR*0.5+fl); ctx.lineTo(-headR*1.05, headY+headR*0.62); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-headR*0.92, headY+headR*0.2); ctx.lineTo(-headR*1.7, headY+headR*1.05-fl); ctx.lineTo(-headR*0.95, headY+headR*0.7); ctx.closePath(); ctx.fill();
  // headgear
  if(arch){   // deep hood
    ctx.fillStyle = F('#4a5228');
    ctx.beginPath(); ctx.moveTo(-headR*1.12, headY+headR*0.35); ctx.quadraticCurveTo(-headR*1.3, headY-headR*1.5, 0, headY-headR*1.45); ctx.quadraticCurveTo(headR*1.3, headY-headR*1.5, headR*1.12, headY+headR*0.35); ctx.lineTo(headR*0.75, headY-headR*0.45); ctx.quadraticCurveTo(0, headY-headR*0.85, -headR*0.75, headY-headR*0.45); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#22280f'; ctx.lineWidth=0.9; ctx.stroke();
  } else if(king){   // a battered gold crown over a black bandana
    ctx.fillStyle = F('#1c1414'); ctx.beginPath(); ctx.arc(0, headY-headR*0.3, headR*1.06, Math.PI*1.02, Math.PI*1.98); ctx.closePath(); ctx.fill();
    const cy0 = headY-headR*0.72, gold = F('#f0c860');
    ctx.fillStyle = gold; ctx.strokeStyle = F('#6a4a10'); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-headR*0.95, cy0); ctx.lineTo(-headR*0.95, cy0-headR*0.75); ctx.lineTo(-headR*0.5, cy0-headR*0.35); ctx.lineTo(0, cy0-headR*0.95); ctx.lineTo(headR*0.5, cy0-headR*0.35); ctx.lineTo(headR*0.95, cy0-headR*0.75); ctx.lineTo(headR*0.95, cy0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = F('#c02a2a'); ctx.beginPath(); ctx.arc(0, cy0-headR*0.28, 1.4, 0, 7); ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : '#7a3a30'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(headR*0.15, headY-headR*0.55); ctx.lineTo(headR*0.7, headY+headR*0.05); ctx.stroke();
  } else if(brute){   // iron skullcap with a short spike, scar across the eye
    ctx.fillStyle = F('#5a5c64'); ctx.beginPath(); ctx.arc(0, headY-headR*0.25, headR*1.04, Math.PI*1.05, Math.PI*1.95); ctx.lineTo(headR*0.9, headY-headR*0.5); ctx.lineTo(-headR*0.9, headY-headR*0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#22232a'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle = F('#7a7c84'); ctx.beginPath(); ctx.moveTo(-2, headY-headR*1.2); ctx.lineTo(0, headY-headR*1.9); ctx.lineTo(2, headY-headR*1.2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : '#7a3a30'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(headR*0.15, headY-headR*0.55); ctx.lineTo(headR*0.7, headY+headR*0.05); ctx.stroke();
  } else {   // plain bandit: floppy leather cap + red headband
    ctx.fillStyle = F('#4a3520'); ctx.beginPath(); ctx.arc(0, headY-headR*0.3, headR*1.08, Math.PI*1.02, Math.PI*1.98); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#22170c'; ctx.lineWidth=0.9; ctx.stroke();
    ctx.fillStyle = F(red); ctx.fillRect(-headR*1.02, headY-headR*0.55, headR*2.04, headR*0.3);
  }
  // weapon
  if(arch){
    ctx.save(); ctx.translate(hx+1, hy-1);
    ctx.strokeStyle = F('#5a3a1a'); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(2, 0, 9.5, -1.25, 1.25); ctx.stroke();
    ctx.strokeStyle = F('#e8e0c8'); ctx.lineWidth = 0.7; const bx = 2+Math.cos(1.25)*9.5, by = Math.sin(1.25)*9.5;
    ctx.beginPath(); ctx.moveTo(bx, -by); ctx.lineTo(atk>0 ? bx-4 : bx, 0); ctx.lineTo(bx, by); ctx.stroke();
    if(atk<=0 || true){ ctx.strokeStyle = F('#8a6a3a'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(10, 0); ctx.stroke(); ctx.fillStyle=F('#b8bcc0'); ctx.beginPath(); ctx.moveTo(10,-1.6); ctx.lineTo(14,0); ctx.lineTo(10,1.6); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  } else if(king){   // a broad gilded cutlass
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(atk>0 ? 1.0 : -0.4);
    ctx.fillStyle = F('#3a2414'); ctx.fillRect(-1.6, -1, 3.2, 7);
    ctx.fillStyle = F('#f0c860'); ctx.beginPath(); ctx.ellipse(0, -2, 6, 2.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = F('#d4d8de'); ctx.beginPath(); ctx.moveTo(-2.2, -3); ctx.lineTo(-2.6, -22); ctx.quadraticCurveTo(-1, -34, 7, -32); ctx.quadraticCurveTo(4, -22, 2.4, -3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.restore();
  } else if(brute){
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(atk>0 ? 0.9 : -0.35);
    ctx.fillStyle = F('#4a3220'); ctx.fillRect(-1.6, -30, 3.2, 38);
    ctx.fillStyle = F('#9aa0a8'); ctx.beginPath(); ctx.moveTo(1.5, -31); ctx.lineTo(15, -36); ctx.lineTo(16, -16); ctx.lineTo(1.5, -21); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1e1e22'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = F(red); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-1.6, -8); ctx.lineTo(1.6, -5); ctx.moveTo(-1.6, -4); ctx.lineTo(1.6, -1); ctx.stroke();
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(atk>0 ? 0.9 : -0.45);
    ctx.fillStyle = F('#4a3220'); ctx.fillRect(-1.5, -1, 3, 6);
    ctx.fillStyle = F(bronze); ctx.fillRect(-4.4, -2.6, 8.8, 2);
    ctx.fillStyle = F('#c4c8cc'); ctx.beginPath(); ctx.moveTo(-1.6, -2.6); ctx.lineTo(-1.2, -17); ctx.quadraticCurveTo(0, -25, 4.4, -22); ctx.lineTo(2.2, -13); ctx.lineTo(1.6, -2.6); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 0.9; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  if(king){ const ky = iso.y - (e.bkHop||0); ctx.save(); ctx.font='bold 12px Alegreya,Georgia, serif'; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.85)'; ctx.fillStyle='#ffd27a'; const ty = ky-(legLen+torsoH+headR*2+26)*s; ctx.strokeText('The Bandit King', iso.x, ty); ctx.fillText('The Bandit King', iso.x, ty); ctx.restore(); }
  drawHpBar(king ? {x:iso.x, y:iso.y-(e.bkHop||0)} : iso, (legLen+torsoH+headR*2+10)*s, e.r*1.35, e.hp, e.maxHp);   // v236: bandits show hp bars
}
