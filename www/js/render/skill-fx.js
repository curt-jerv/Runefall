// v342: Juggernaut wind -- speed lines + fading ghost trail behind the charging player, and a shout flare during the war cry
function drawJuggFx(p){
  if(!p) return;
  const now = performance.now()/1000;
  if(p.juggWindT>0){
    const iso = toIso(p.x,p.y), k = 1 - p.juggWindT/JUGG_WIND;
    ctx.save(); ctx.translate(iso.x, iso.y-34); ctx.strokeStyle='rgba(255,150,100,'+(0.35+0.4*Math.sin(now*30)**2)+')'; ctx.lineWidth=3; ctx.lineCap='round';
    for(let i=0;i<10;i++){ const a=i/10*6.283+now*2, r1=22+k*14, r2=r1+10+8*Math.sin(now*25+i);
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*r1, Math.sin(a)*r1*0.8); ctx.lineTo(Math.cos(a)*r2, Math.sin(a)*r2*0.8); ctx.stroke(); }
    ctx.restore();
  }
  if(!(p.juggT>0) || !p.juggTrail) return;
  const tr = p.juggTrail, dir = p.juggDir || p.facing;
  ctx.save(); ctx.lineCap='round';
  for(let i=1;i<tr.length;i++){
    const a = toIso(tr[i-1].x,tr[i-1].y), b = toIso(tr[i].x,tr[i].y), f = i/tr.length;
    ctx.strokeStyle='rgba(255,170,110,'+(0.45*f)+')'; ctx.lineWidth=2+9*f;
    ctx.beginPath(); ctx.moveTo(a.x,a.y-14); ctx.lineTo(b.x,b.y-14); ctx.stroke();
  }
  const ip = toIso(p.x,p.y), bx = toIso(p.x-dir.x*60, p.y-dir.y*60);
  const ux = bx.x-ip.x, uy = bx.y-ip.y, ul = Math.hypot(ux,uy)||1;
  ctx.strokeStyle='rgba(255,230,200,0.6)'; ctx.lineWidth=2;
  for(let i=0;i<6;i++){ const off=(i-2.5)*7, ph=((now*3+i*0.37)%1), len=18+22*ph;
    const sx = ip.x + ux/ul*(10+ph*50) - uy/ul*off*0.6, sy = ip.y-16 + uy/ul*(10+ph*50) + ux/ul*off*0.6;
    ctx.globalAlpha = 0.7*(1-ph); ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx+ux/ul*len, sy+uy/ul*len); ctx.stroke(); }
  ctx.restore();
}
// v337: gray ring on the floor showing how far the Bulwark release will reach
// v480: Aura of Retribution -- a slow ring of holy embers at the Templar's feet
function drawRetribAura(p){
  if(!p || p.cls!=='warrior' || !p.skills || !((p.skills.auraOfRetribution||0)>0)) return;
  const iso = toIso(p.x,p.y), t = (game && game.clock) || 0, R = 34 + 2*Math.sin(t*2);
  ctx.save(); ctx.translate(iso.x, iso.y+2); ctx.scale(1, 0.45);
  const gr = ctx.createRadialGradient(0,0,R*0.3,0,0,R*1.15); gr.addColorStop(0,'rgba(255,170,60,0)'); gr.addColorStop(0.75,'rgba(255,150,50,0.16)'); gr.addColorStop(1,'rgba(255,120,40,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,R*1.15,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,190,90,0.55)'; ctx.lineWidth = 1.6; ctx.setLineDash([7,6]); ctx.lineDashOffset = -t*14;
  ctx.beginPath(); ctx.arc(0,0,R,0,7); ctx.stroke(); ctx.setLineDash([]);
  for(let i=0;i<6;i++){ const a = t*0.9 + i*1.047; ctx.fillStyle = 'rgba(255,214,140,'+(0.5+0.4*Math.sin(t*4+i))+')'; ctx.beginPath(); ctx.arc(Math.cos(a)*R, Math.sin(a)*R, 2.2, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawBulwarkRing(p){
  if(!p || !(p.guardianT>0) || p.bulwarkT>0) return;   // v362: no ring for Bulwark
  const R = (p.bulwarkT>0 ? BULWARK_R : GUARDIAN_PULL_R)*aoeRadiusMult(p), iso = toIso(p.x,p.y);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.scale(1, ISO_KY/ISO_KX);
  const pulse = 0.5 + 0.5*Math.sin(performance.now()/260);
  ctx.strokeStyle = 'rgba(195,200,210,'+(0.55+0.25*pulse)+')'; ctx.lineWidth = 3;
  ctx.fillStyle = 'rgba(160,166,178,0.10)';
  ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2,0,7); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function drawShieldThrowIso(st){
  const iso = toIso(st.x, st.y);
  ctx.save();
  ctx.translate(iso.x, iso.y-18);
  ctx.rotate((performance.now()/1000)*16);   // v337: spins clockwise like a thrown disc, out and back
  drawWarriorShield(17, 26, '#cdd8e6', 1);
  ctx.restore();
}
// Precise Shot (Marksman capstone): a simple red straight line drawn from
// the player outward in the current aim direction while p.aiming is true --
// reuses the exact same world-to-iso projection (toIso) the arrows above
// draw with, just as a stroked line instead of a sprite.
function drawAimLineIso(p){
  if(!p || !(p.aiming || (p.aimShotHold && holdAimCommit))) return;
  const len = 220;
  const iso1 = toIso(p.x, p.y);
  const iso2 = toIso(p.x + p.aimDir.x*len, p.y + p.aimDir.y*len);
  ctx.save();
  ctx.strokeStyle = '#e2384f';
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.85;
  ctx.shadowColor = '#e2384f'; ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(iso1.x, iso1.y-34);   // (v245) chest/shoulder height
  ctx.lineTo(iso2.x, iso2.y-34);
  ctx.stroke();
  ctx.restore();
}
// v236: Guardian -- golden aegis dome with rotating globe lines, ground sigil and rising motes
function drawGuardianAura(p, iso, s){
  const T = game.clock||0, ph = T*2.2, cx = iso.x, cy = iso.y-20*s;
  const pulse = 0.5+0.5*Math.sin(T*6), fade = p.guardianT<0.7 ? Math.max(0,p.guardianT/0.7) : 1;
  ctx.save(); ctx.globalAlpha = fade;
  ctx.save(); ctx.translate(iso.x, iso.y+2); ctx.scale(1,0.5);
  const R1 = 30*s;
  ctx.strokeStyle = 'rgba(240,208,120,0.75)'; ctx.lineWidth = 2; ctx.shadowColor = '#f0d078'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(0,0,R1,0,7); ctx.stroke();
  ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0,0,R1*0.72,0,7); ctx.stroke();
  ctx.rotate(ph); ctx.fillStyle = 'rgba(255,236,160,0.9)'; ctx.shadowBlur = 4;
  for(let i=0;i<6;i++){
    const a = i*Math.PI/3; ctx.save(); ctx.translate(Math.cos(a)*R1*0.86, Math.sin(a)*R1*0.86); ctx.rotate(a+Math.PI/2);
    ctx.beginPath(); ctx.moveTo(0,-5*s); ctx.lineTo(3*s,0); ctx.lineTo(0,5*s); ctx.lineTo(-3*s,0); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  const rx = 25*s, ry = 34*s;
  const gr = ctx.createRadialGradient(cx,cy,4*s,cx,cy,ry);
  gr.addColorStop(0,'rgba(255,240,170,0.04)'); gr.addColorStop(0.72,'rgba(240,200,100,'+(0.10+0.06*pulse)+')'); gr.addColorStop(1,'rgba(255,225,130,'+(0.36+0.14*pulse)+')');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,226,130,'+(0.7+0.2*pulse)+')'; ctx.lineWidth = 2.2; ctx.shadowColor = '#f0d078'; ctx.shadowBlur = 12; ctx.stroke();
  ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,236,170,0.3)';
  for(let k=0;k<3;k++){ const w = Math.abs(Math.cos(ph+k*Math.PI/3)); ctx.beginPath(); ctx.ellipse(cx,cy,rx*Math.max(0.04,w),ry,0,0,7); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry*0.28,0,0,7); ctx.stroke();
  ctx.fillStyle = '#fff4c0';
  for(let i=0;i<6;i++){   // rising motes
    const u = (T*0.55+i/6)%1, x = cx+Math.sin(i*2.4+T*1.3)*20*s, y = cy+30*s-u*66*s, z = Math.sin(u*Math.PI)*2.4*s+0.3;
    ctx.globalAlpha = fade*Math.sin(u*Math.PI);
    ctx.fillRect(x-z*0.25,y-z,z*0.5,z*2); ctx.fillRect(x-z,y-z*0.25,z*2,z*0.5);
  }
  ctx.restore();
}
// v236: Assault -- rage aura: heat pool on the ground, red glow, licking flame wisps that grow with the rage ramp
function drawAssaultAura(p, iso, s){
  const T = game.clock||0, durMax = p.assaultDurMax||1, frac = clamp(1-p.assaultT/durMax,0,1);
  const cx = iso.x, cy = iso.y-20*s, fl = 0.5+0.5*Math.sin(T*15);
  ctx.save();
  ctx.save(); ctx.translate(iso.x, iso.y+2); ctx.scale(1,0.5);
  const gg = ctx.createRadialGradient(0,0,2,0,0,(30+4*fl+frac*8)*s);
  gg.addColorStop(0,'rgba(255,90,40,'+(0.45+frac*0.25)+')'); gg.addColorStop(1,'rgba(200,20,10,0)');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0,0,(30+4*fl+frac*8)*s,0,7); ctx.fill();
  ctx.restore();
  ctx.globalCompositeOperation = 'lighter';
  const bg = ctx.createRadialGradient(cx,cy,2,cx,cy,42*s);
  bg.addColorStop(0,'rgba(255,70,30,'+(0.18+frac*0.22+fl*0.05)+')'); bg.addColorStop(1,'rgba(255,40,10,0)');
  ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx,cy,42*s,0,7); ctx.fill();
  const n = 8+Math.round(frac*6);
  for(let i=0;i<n;i++){
    const u = (T*(0.85+(i%4)*0.12)+i*0.37)%1;
    const x = cx+Math.sin(i*5.1)*16*s+Math.sin(T*6+i)*4*s*u, y = iso.y-2*s-u*60*s;
    const h = 16*s*(1-u*0.5)*(1+frac*0.5), wd = (1-u)*5.5*s*(1+frac*0.5);
    ctx.globalAlpha = (1-u)*0.85;
    ctx.fillStyle = u<0.4 ? '#ff3a1a' : u<0.75 ? '#ff7a26' : '#ffb84a';
    ctx.beginPath(); ctx.moveTo(x,y-h); ctx.quadraticCurveTo(x+wd,y-h*0.3,x,y); ctx.quadraticCurveTo(x-wd,y-h*0.3,x,y-h); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffd08a';
  for(let j=0;j<5;j++){   // embers
    const u = (T*1.6+j*0.2)%1; ctx.globalAlpha = (1-u)*0.9;
    ctx.fillRect(cx+Math.sin(j*3.7+T*2)*18*s, iso.y-10*s-u*70*s, 1.6, 1.6);
  }
  ctx.restore();
}
function drawProjectilesIso(list){
  for(const pr of list){
    const iso = toIso(pr.x,pr.y);
    if(pr.isSoulFire){ drawSoulFireIso(pr, iso); continue; }   // v489
    if(pr.isTornado){
      // v269: pseudo-3D funnel -- stacked, widening ellipses spinning at different speeds, ground dust and flying debris
      const ck = game.clock||0, spin = (pr.life||0)*7, H = 60, baseRx = pr.r*ISO_KX*ISO_SQ2*1.15*0.85;   // v311: shorter and 15% smaller
      ctx.save();
      ctx.translate(iso.x, iso.y);
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0, 0, baseRx*1.1, baseRx*0.45, 0, 0, 7); ctx.fill();
      const layers = 11;
      for(let i=0;i<layers;i++){
        const u = i/(layers-1), y = -u*H, rx = baseRx*(0.35+1.05*u*u+0.25*u), ry = rx*0.36, sp = spin*(1.7-u);
        const sway = Math.sin(ck*3+u*3)*3*u;
        ctx.globalAlpha = 0.28+0.22*(1-u);
        ctx.fillStyle = i%2 ? 'rgba(170,196,206,0.55)' : 'rgba(205,224,232,0.5)';
        ctx.beginPath(); ctx.ellipse(sway, y, rx, ry, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.75; ctx.strokeStyle = u>0.6 ? '#eef7fb' : '#aebfc8'; ctx.lineWidth = 1.8-u*0.5;
        ctx.beginPath(); ctx.ellipse(sway, y, rx, ry, 0, sp, sp+3.6); ctx.stroke();
      }
      ctx.globalAlpha = 0.9; ctx.fillStyle = '#d9e6ea';
      for(let j=0;j<7;j++){   // debris orbiting the funnel
        const u = (j*0.137+ck*0.5)%1, an = spin*1.4+j*2.1, rx = baseRx*(0.35+1.05*u*u+0.25*u)*1.1;
        ctx.beginPath(); ctx.arc(Math.cos(an)*rx, -u*H+Math.sin(an)*rx*0.36, 1.6+(1-u)*1.2, 0, 7); ctx.fill();
      }
      ctx.restore();
    } else if(pr.isLightningArc){
      // Lightning Arc (v100): continuous arcing lightning bolt connecting
      // the projectile to the player (origin), with jagged/branching paths
      // for visual interest and additional arcs to chained targets.
      ctx.save();
      ctx.strokeStyle = pr.color;
      ctx.shadowColor = pr.color; ctx.shadowBlur = 8;
      ctx.lineWidth = 2.5;
      // Draw main jagged bolt from projectile back to origin (player or last chain)
      const jitterAmp = 3 + (pr.chainsLeft||0)*0.5;
      const segCount = 8;
      ctx.beginPath();
      ctx.moveTo(iso.x, iso.y-16);
      for(let i=1;i<=segCount;i++){
        const t = i/segCount;
        const jx = (Math.random()-0.5)*jitterAmp*2;
        const jy = (Math.random()-0.5)*jitterAmp*2;
        // Interpolate to player position
        ctx.lineTo(iso.x+(jx-iso.x*t)+(jx*t), iso.y-16+(jy-16*t)+(jy*t));
      }
      ctx.stroke();
      // Add thin branching bolts for visual effect
      ctx.lineWidth = 1.2; ctx.globalAlpha = 0.6;
      for(let b=0;b<2;b++){
        const branchStart = Math.random()*segCount;
        ctx.beginPath();
        ctx.moveTo(iso.x+(Math.random()-0.5)*8, iso.y-16+(Math.random()-0.5)*8);
        for(let i=0;i<3;i++){
          const bx = (Math.random()-0.5)*6;
          const by = (Math.random()-0.5)*6;
          ctx.lineTo(iso.x+bx, iso.y-16+by);
        }
        ctx.stroke();
      }
      ctx.restore();
    } else if(pr.isAxe){
      pr.spin = (pr.spin||0) + 0.5;
      ctx.save(); ctx.translate(iso.x, iso.y-16); ctx.rotate(pr.spin);
      ctx.strokeStyle='#5a3f24'; ctx.lineWidth=2.4; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(0,-8); ctx.stroke();
      ctx.fillStyle='#dfe9f3'; ctx.strokeStyle='#1c2430'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,-8); ctx.quadraticCurveTo(-10,-11,-9,-1); ctx.lineTo(0,-3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if(pr.isFireball){
      // v236: living fireball -- flame-tongue comet with a white-hot core, flickering tail puffs, embers and a hot glow
      const ck = game.clock||0, ph = pr.x*0.013+pr.y*0.017+ck*22;
      const isoV = toIso(pr.x+pr.vx*0.02, pr.y+pr.vy*0.02);
      const ang = Math.atan2(isoV.y-iso.y, isoV.x-iso.x);
      const R = pr.r*1.3;
      ctx.save();
      ctx.translate(iso.x, iso.y-16);
      ctx.globalCompositeOperation = 'lighter';
      for(let i=8;i>=1;i--){   // tail puffs following the path back
        const tp = toIso(pr.x-pr.vx*0.013*i, pr.y-pr.vy*0.013*i), k = 1-i/9, wob = Math.sin(ph*0.6+i*1.9)*2.2;
        ctx.globalAlpha = 0.55*k;
        ctx.fillStyle = i>5 ? '#b8280c' : i>2 ? '#ff5a16' : '#ff9a2a';
        ctx.beginPath(); ctx.arc(tp.x-iso.x+wob*0.3, tp.y-iso.y+wob, R*(0.28+0.62*k), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const gl = ctx.createRadialGradient(0,0,0,0,0,R*2.6);
      gl.addColorStop(0,'rgba(255,200,90,0.65)'); gl.addColorStop(0.5,'rgba(255,100,20,0.25)'); gl.addColorStop(1,'rgba(255,60,0,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,0,R*2.6,0,7); ctx.fill();
      ctx.rotate(ang);
      const cols = ['#ff3d0c','#ff8a1e','#ffd24a'];
      for(let i=0;i<3;i++){   // three nested licking flame tongues pointing backward
        const f = Math.sin(ph*1.3+i*2.1), sc = 1-i*0.22;
        ctx.fillStyle = cols[i]; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.moveTo(R*0.95*sc, 0);
        ctx.quadraticCurveTo(R*0.2, -R*1.05*sc, -R*(2.1-i*0.3)*sc+f*2, f*2.2*sc);
        ctx.quadraticCurveTo(R*0.2, R*1.05*sc, R*0.95*sc, 0); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const cg = ctx.createRadialGradient(R*0.1,0,0,0,0,R*0.85);
      cg.addColorStop(0,'#ffffff'); cg.addColorStop(0.45,'#fff0a0'); cg.addColorStop(1,'rgba(255,150,40,0.9)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0,0,R*0.85,0,7); ctx.fill();
      ctx.fillStyle = '#ffd860';
      for(let j=0;j<4;j++){   // drifting embers
        const u = ((ck*2.2+j*0.27)%1), a2 = j*2.3+ph*0.05;
        ctx.globalAlpha = (1-u)*0.9;
        ctx.beginPath(); ctx.arc(-R*(0.8+u*2.6), Math.sin(a2)*R*(0.5+u*0.6), 1.5*(1-u)+0.4, 0, 7); ctx.fill();
      }
      ctx.restore();
    } else if(pr.isDeathBolt){
      // v297: Death Bolt -- a black, pointed shard with a white-hot centre, thin violet rim and a short dark smoke trail
      const ck = game.clock||0, ph = pr.x*0.02+pr.y*0.017+ck*30;
      const isoV = toIso(pr.x+pr.vx*0.02, pr.y+pr.vy*0.02);
      const ang = Math.atan2(isoV.y-iso.y, isoV.x-iso.x), L = pr.r*3.9, Wd = pr.r*0.9;
      ctx.save();
      for(let k=6;k>=1;k--){   // smoky trail
        const tp = toIso(pr.x-pr.vx*0.012*k, pr.y-pr.vy*0.012*k), f = 1-k/7;
        ctx.globalAlpha = 0.38*f; ctx.fillStyle = k>3 ? '#2a1238' : '#0c0610';
        ctx.beginPath(); ctx.arc(tp.x+Math.sin(ph+k)*1.2, tp.y-16+Math.cos(ph*0.8+k)*1.2, Wd*(0.35+0.6*f), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.translate(iso.x, iso.y-16); ctx.rotate(ang);
      ctx.shadowColor = pr.lifeSteal ? '#ff4aa0' : '#9a5cff'; ctx.shadowBlur = 9;
      ctx.fillStyle = '#07030b'; ctx.strokeStyle = pr.lifeSteal ? '#d03a78' : '#7a4ad0'; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(L, 0); ctx.lineTo(L*0.1, -Wd); ctx.lineTo(-L*0.55+Math.sin(ph)*0.8, -Wd*0.35); ctx.lineTo(-L*0.85, 0);
      ctx.lineTo(-L*0.55+Math.sin(ph+2)*0.8, Wd*0.35); ctx.lineTo(L*0.1, Wd); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.95;   // white centre
      ctx.beginPath(); ctx.moveTo(L*0.62, 0); ctx.lineTo(L*0.1, -Wd*0.38); ctx.lineTo(-L*0.3, 0); ctx.lineTo(L*0.1, Wd*0.38); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if(pr.isIceBolt){
      // v236: crystalline ice lance -- faceted shard, frosty streak, orbiting crystal fragments and twinkling snow
      const ck = game.clock||0, ph = pr.x*0.011+pr.y*0.015+ck*9;
      const isoV = toIso(pr.x+pr.vx*0.02, pr.y+pr.vy*0.02);
      const ang = Math.atan2(isoV.y-iso.y, isoV.x-iso.x);
      const L = pr.r*2.3;
      ctx.save();
      ctx.translate(iso.x, iso.y-16);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = 'lighter';
      const tg = ctx.createLinearGradient(-L*3.6,0,0,0);
      tg.addColorStop(0,'rgba(120,200,255,0)'); tg.addColorStop(1,'rgba(170,230,255,0.75)');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(0,-L*0.34); ctx.lineTo(-L*3.6,0); ctx.lineTo(0,L*0.34); ctx.closePath(); ctx.fill();
      const gl = ctx.createRadialGradient(0,0,0,0,0,L*1.7);
      gl.addColorStop(0,'rgba(170,235,255,0.6)'); gl.addColorStop(1,'rgba(80,170,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,0,L*1.7,0,7); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      for(let k=0;k<2;k++){   // small crystals orbiting the tail
        const a2 = ph*1.6+k*Math.PI, ox = -L*0.75+Math.cos(a2)*L*0.3, oy = Math.sin(a2)*L*0.5;
        ctx.save(); ctx.translate(ox,oy); ctx.rotate(a2);
        ctx.fillStyle = 'rgba(200,240,255,0.9)';
        ctx.beginPath(); ctx.moveTo(3.2,0); ctx.lineTo(0,-1.6); ctx.lineTo(-3.2,0); ctx.lineTo(0,1.6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      const sg = ctx.createLinearGradient(-L*0.6,-L*0.3,L*0.9,L*0.3);
      sg.addColorStop(0,'#3a8fe0'); sg.addColorStop(0.5,'#b4ecff'); sg.addColorStop(1,'#ffffff');
      ctx.fillStyle = sg; ctx.strokeStyle = '#e4f8ff'; ctx.lineWidth = 1; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(L,0); ctx.lineTo(L*0.15,-L*0.27); ctx.lineTo(-L*0.55,-L*0.17); ctx.lineTo(-L*0.75,0); ctx.lineTo(-L*0.55,L*0.17); ctx.lineTo(L*0.15,L*0.27); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';   // bright upper facet + spine
      ctx.beginPath(); ctx.moveTo(L*0.92,0); ctx.lineTo(L*0.15,-L*0.25); ctx.lineTo(-L*0.5,-L*0.15); ctx.lineTo(-L*0.3,0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-L*0.7,0); ctx.lineTo(L*0.95,0); ctx.stroke();
      ctx.restore();
      ctx.save();   // twinkling snow motes left in the wake (screen-axis aligned)
      ctx.translate(iso.x, iso.y-16); ctx.fillStyle = '#e8f8ff';
      for(let j=0;j<5;j++){
        const u = ((ck*1.8+j*0.21)%1), tp = toIso(pr.x-pr.vx*0.02*(j+1)*1.2, pr.y-pr.vy*0.02*(j+1)*1.2);
        const sx = tp.x-iso.x, sy = tp.y-iso.y+Math.sin(ph+j*2)*5, sz = (1-u)*2.4+0.5;
        ctx.globalAlpha = (1-u)*0.9;
        ctx.fillRect(sx-sz*0.25, sy-sz, sz*0.5, sz*2); ctx.fillRect(sx-sz, sy-sz*0.25, sz*2, sz*0.5);
      }
      ctx.restore();
    } else if(pr.isArcaneBolt){
      // v454 Mystic Strike: a small violet orb with a soft glow and a short fading tail
      const ck = (game&&game.clock)||0;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for(let j=4;j>=1;j--){
        const tp = toIso(pr.x-pr.vx*0.012*j, pr.y-pr.vy*0.012*j);
        ctx.globalAlpha = 0.16*(5-j)/4; ctx.fillStyle = '#9b5cff';
        ctx.beginPath(); ctx.arc(tp.x, tp.y-16, 6-j*0.8, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      const gr = ctx.createRadialGradient(iso.x, iso.y-16, 0, iso.x, iso.y-16, 11);
      gr.addColorStop(0,'rgba(240,220,255,0.95)'); gr.addColorStop(0.4,'rgba(181,123,255,0.8)'); gr.addColorStop(1,'rgba(120,60,220,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(iso.x, iso.y-16, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#f4ecff'; ctx.beginPath(); ctx.arc(iso.x, iso.y-16, 2.6+0.5*Math.sin(ck*30), 0, 7); ctx.fill();
      ctx.restore();
    } else if(pr.isArrow){
      const isoV = toIso(pr.x+pr.vx, pr.y+pr.vy);
      const ang = Math.atan2(isoV.y-iso.y, isoV.x-iso.x);
      ctx.save();
      ctx.translate(iso.x, iso.y-16);
      ctx.rotate(ang);
      ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(6,0); ctx.stroke();
      ctx.fillStyle = pr.color;
      ctx.beginPath(); ctx.moveTo(9,0); ctx.lineTo(4,-2.6); ctx.lineTo(4,2.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#c9a074'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(-6,-2); ctx.moveTo(-9,0); ctx.lineTo(-6,2); ctx.stroke();
      ctx.restore();
    } else if(pr.isWeb){
      // a small spinning web-strand bolt instead of a plain dot
      ctx.save();
      ctx.translate(iso.x, iso.y-16);
      ctx.rotate((pr.life||0)*6);
      ctx.strokeStyle = 'rgba(220,240,210,0.9)'; ctx.lineWidth = 1.3;
      ctx.shadowColor = '#8fd05a'; ctx.shadowBlur = 5;
      for(let i=0;i<4;i++){
        const a = i*Math.PI/4;
        ctx.beginPath(); ctx.moveTo(Math.cos(a)*-pr.r, Math.sin(a)*-pr.r); ctx.lineTo(Math.cos(a)*pr.r, Math.sin(a)*pr.r); ctx.stroke();
      }
      ctx.beginPath();
      for(let i=0;i<=8;i++){
        const a = i*Math.PI/4;
        const rr = pr.r*0.6;
        ctx[i===0?'moveTo':'lineTo'](Math.cos(a)*rr, Math.sin(a)*rr);
      }
      ctx.stroke();
      ctx.restore();
    } else if(pr.isKnife){
      // v476: the Bandit King's thrown knives -- a steel blade and a wrapped grip, flying point-first
      const isoV = toIso(pr.x+pr.vx, pr.y+pr.vy), ang = Math.atan2(isoV.y-iso.y, isoV.x-iso.x);
      ctx.save(); ctx.translate(iso.x, iso.y-18); ctx.rotate(ang);
      ctx.fillStyle = '#e6e9ee'; ctx.strokeStyle = '#2a2c30'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(11,0); ctx.lineTo(1,-2.6); ctx.lineTo(-2,-2.2); ctx.lineTo(-2,2.2); ctx.lineTo(1,2.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.moveTo(9,0); ctx.lineTo(0,0); ctx.stroke();
      ctx.fillStyle = '#8a6a3a'; ctx.fillRect(-3.6,-3.6,1.8,7.2);
      ctx.fillStyle = '#3a2416'; ctx.fillRect(-9.5,-1.6,6,3.2);
      ctx.restore();
    } else if(pr.isDeathBolt){
      // v469 Death Bolt: a black core in a violet shroud, with a pale skull-glint
      ctx.save();
      const pu = 0.5+0.5*Math.sin((pr.life||0)*22);
      const gr = ctx.createRadialGradient(iso.x, iso.y-16, 1, iso.x, iso.y-16, pr.r*2.2);
      gr.addColorStop(0, 'rgba(170,80,220,0.9)'); gr.addColorStop(0.5, 'rgba(90,20,130,0.55)'); gr.addColorStop(1, 'rgba(40,0,60,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(iso.x, iso.y-16, pr.r*2.2, 0, 7); ctx.fill();
      ctx.fillStyle = '#12021a'; ctx.beginPath(); ctx.arc(iso.x, iso.y-16, pr.r*(0.75+0.1*pu), 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(230,210,255,0.85)'; ctx.beginPath(); ctx.arc(iso.x-pr.r*0.25, iso.y-16-pr.r*0.15, pr.r*0.18, 0, 7); ctx.arc(iso.x+pr.r*0.25, iso.y-16-pr.r*0.15, pr.r*0.18, 0, 7); ctx.fill();
      ctx.restore();
    } else if(pr.isSoulOrb){
      // Soul Sap's soul-orb visual (v99 fix): a small glowing white orb,
      // reusing this same plain-circle projectile draw but with a soft
      // outer glow so it reads as "a soul", not just a plain bolt.
      ctx.save();
      ctx.shadowColor = '#e8dcff'; ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(iso.x, iso.y-16, pr.r, 0,7); ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath(); ctx.fillStyle=pr.color;
      ctx.arc(iso.x, iso.y-16, pr.r, 0,7); ctx.fill();
    }
  }
}
// Combat feel (v104): the melee wind-up "tell" -- a red ground ring around the
// enemy that tightens/brightens as the swing is about to land.
// v191 bear charge telegraph: a red lane in the locked charge direction that fills as the wind-up completes.
function drawBearChargeLane(e){
  const boar = e.type==='boar', zom = e.type==='frozenzombie';
  const frac = zom ? clamp(1 - e.zChargeWindT/ZOMBIE_CHARGE_WIND, 0, 1) : boar ? clamp(1 - e.boarWindT/BOAR_CHARGE_WIND, 0, 1) : clamp(1 - e.chargeWindT/BEAR_CHARGE_WIND, 0, 1);
  const len = zom ? e.speed*ZOMBIE_CHARGE_SPEED_MULT*ZOMBIE_CHARGE_DUR + e.r + 26 : boar ? e.speed*BOAR_CHARGE_SPEED_MULT*BOAR_CHARGE_DUR + e.r + 26 : e.speed*BEAR_CHARGE_SPEED_MULT*BEAR_CHARGE_DUR + e.r + 26, hw = e.r + 14 + (boar||zom ? 0 : BEAR_CHARGE_HIT_BONUS);
  const dir = zom ? e.zChargeDir : boar ? e.boarChargeDir : e.chargeDir;
  const ux = Math.cos(dir), uy = Math.sin(dir), nx = -uy, ny = ux;
  const P = (a,b)=>toIso(e.x+ux*a+nx*b, e.y+uy*a+ny*b);
  const p1=P(0,-hw), p2=P(len,-hw), p3=P(len,hw), p4=P(0,hw);
  const q2=P(len*frac,-hw), q3=P(len*frac,hw);
  ctx.save();
  ctx.fillStyle = 'rgba(255,74,58,'+(0.10+0.06*frac)+')';
  ctx.strokeStyle = 'rgba(255,90,70,'+(0.45+0.5*frac)+')'; ctx.lineWidth = 2+frac*2;
  ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.lineTo(p3.x,p3.y); ctx.lineTo(p4.x,p4.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,60,40,'+(0.22+0.3*frac)+')';
  ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(q2.x,q2.y); ctx.lineTo(q3.x,q3.y); ctx.lineTo(p4.x,p4.y); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawEnemyTell(e){
  const frac = clamp(1 - e.windT/(e.windMax||0.3), 0, 1);
  const iso = toIso(e.x, e.y);
  const reach = e.r + 24 + (e.type==='bear' ? BEAR_REACH_BONUS : 0) + (e.meleeBonus||0);
  ctx.save();
  ctx.fillStyle = 'rgba(255,74,58,'+(0.10+0.28*frac)+')';
  ctx.strokeStyle = 'rgba(255,90,70,'+(0.35+0.55*frac)+')';
  ctx.lineWidth = 2 + 2*frac;
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, reach*ISO_KX*(1.15-0.15*frac), reach*ISO_KY*(1.15-0.15*frac), 0, 0, 7);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}
// v323: banner/consecrate are GROUND effects -- 'ground' pass paints them under every character, 'pole' pass is the standing flag
function drawParticlesIso(list, pass){
  for(const pt of list){
    if(pt.type==='bannerFx' || pt.type==='consecrateFx'){
      if(pass==='ground' || pass==='pole'){} else continue;
      if(pass==='pole' && pt.type!=='bannerFx') continue;
    } else if(pt.type==='frostzone' || pt.type==='vortex' || pt.type==='zone' || pt.type==='tsRing' || pt.type==='trapmark' || pt.type==='meteorMark' || pt.type==='burnzone' || pt.type==='stormMark'){   // v441: ground effects draw on the floor, under every character
      if(pass!=='ground') continue;
    } else if(pass) continue;
    const a = pt.t/pt.max;
    const iso = toIso(pt.x, pt.y);
    if((pt.type==='burst' || pt.type==='ring' || pt.type==='slash') && game && game.camera){   // v487: off-screen sparks/rings are not drawn
      const cm = game.camera, mg = 120 + (pt.r||0)*1.5, sx = iso.x-cm.x, sy = iso.y-cm.y;
      if(sx < -mg || sx > W+mg || sy < -mg-60 || sy > H+mg) continue;
    }
    if(pt.type==='dbWisp'){
      ctx.fillStyle = 'rgba(120,40,170,'+(a*0.7)+')'; ctx.beginPath(); ctx.arc(iso.x, iso.y-16-(1-a)*6, 2+3*a, 0, 7); ctx.fill();
    } else if(pt.type==='deathLink'){
      // v469 Death Bolt leap: a dark tendril between the two targets
      const isoB = toIso(pt.x2, pt.y2);
      ctx.save(); ctx.globalAlpha = Math.min(1, a*1.6); ctx.lineCap = 'round';
      ctx.shadowColor = '#9a40d0'; ctx.shadowBlur = 10;
      const mx = (iso.x+isoB.x)/2 + (Math.random()*2-1)*12, my = (iso.y+isoB.y)/2 - 34 + (Math.random()*2-1)*8;
      for(const [w,c] of [[5,'rgba(60,10,90,0.8)'],[2,'#c890ff']]){
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(iso.x, iso.y-22);
        ctx.quadraticCurveTo(mx, my, isoB.x, isoB.y-22); ctx.stroke();
      }
      ctx.restore();
    } else if(pt.type==='bolt'){
      // Lightning Arc (v106): a jagged lightning bolt from the caster's chest
      // to the target's, re-jittered every frame so it crackles, fading out.
      const isoB = toIso(pt.x2, pt.y2);
      const x0 = iso.x, y0 = iso.y-30, x1 = isoB.x, y1 = isoB.y-22;
      const len = Math.hypot(x1-x0, y1-y0) || 1;
      const nx = -(y1-y0)/len, ny = (x1-x0)/len;
      const segs = Math.max(4, Math.round(len/22));
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalAlpha = Math.min(1, a*1.4);
      ctx.shadowColor = '#e6e35a'; ctx.shadowBlur = 12;
      const pts = [[x0,y0]];
      for(let i=1;i<segs;i++){
        const f = i/segs, off = (Math.random()*2-1)*9;
        pts.push([x0+(x1-x0)*f+nx*off, y0+(y1-y0)*f+ny*off]);
      }
      pts.push([x1,y1]);
      for(let pass=0; pass<2; pass++){ // wide yellow glow, then a thin white core on the same path
        ctx.strokeStyle = pass===0 ? '#e6e35a' : '#ffffff';
        ctx.lineWidth = pass===0 ? 4 : 1.8;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='beam'){
      const i2 = toIso(pt.x2, pt.y2);
      const y0 = iso.y-26, y1 = i2.y-16, w = pt.w||20;
      const fl = 1 + Math.sin((game && game.clock || 0)*45)*0.1;
      ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = Math.min(1, a*1.6);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(220,20,5,0.26)'; ctx.lineWidth = w*1.7*fl;
      ctx.beginPath(); ctx.moveTo(iso.x, y0); ctx.lineTo(i2.x, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(215,30,10,0.5)'; ctx.lineWidth = w*0.95*fl;
      ctx.beginPath(); ctx.moveTo(iso.x, y0); ctx.lineTo(i2.x, y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(230,60,35,0.6)'; ctx.lineWidth = w*0.3*fl;
      ctx.beginPath(); ctx.moveTo(iso.x, y0); ctx.lineTo(i2.x, y1); ctx.stroke();
      const g0 = ctx.createRadialGradient(iso.x, y0, 0, iso.x, y0, w*1.2);
      g0.addColorStop(0,'rgba(240,70,40,0.6)'); g0.addColorStop(0.4,'rgba(235,50,20,0.45)'); g0.addColorStop(1,'rgba(200,20,5,0)');
      ctx.fillStyle = g0; ctx.beginPath(); ctx.arc(iso.x, y0, w*1.2, 0, 7); ctx.fill();
      ctx.restore();
      continue;
    }
    if(pt.type==='tsRing'){
      // v446 Thunderstep: a plain yellow circle expanding on the ground
      const u = 1-a, R = pt.r*(0.35+0.65*u), rx = R*ISO_KX*ISO_SQ2, ry = R*ISO_KY*ISO_SQ2;
      ctx.save(); ctx.globalAlpha = a*0.9;
      ctx.fillStyle = 'rgba(240,226,90,0.18)'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#f2e45a'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();
      continue;
    }
    if(pt.type==='iceBlast'){
      // v445 Ice Armor explosion: an expanding frost disc, a bright shock ring and a crown of ice spikes bursting outward
      const k = 1 - a, R = pt.r*(0.25 + 0.75*Math.min(1, k*1.6)), rx = R*ISO_KX*ISO_SQ2, ry = R*ISO_KY*ISO_SQ2, cy = iso.y-4;
      const sr = (n)=>{ const x = Math.sin(n*127.1+pt.seed*7.3)*43758.5453; return x-Math.floor(x); };
      ctx.save();
      ctx.globalAlpha = Math.min(1, a*1.5)*0.55;
      const gr = ctx.createRadialGradient(iso.x, cy, 0, iso.x, cy, rx);
      gr.addColorStop(0,'rgba(230,248,255,0.9)'); gr.addColorStop(0.55,'rgba(140,205,255,0.55)'); gr.addColorStop(1,'rgba(70,140,230,0.15)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = Math.min(1, a*1.6);
      ctx.shadowColor = '#bfeaff'; ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(235,250,255,0.95)'; ctx.lineWidth = 4*a+1.5;
      ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,190,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(iso.x, cy, rx*0.82, ry*0.82, 0, 0, 7); ctx.stroke();
      ctx.shadowBlur = 0;
      for(let i=0;i<20;i++){   // ice spikes thrust up around the ring
        const an = i/20*6.283 + sr(i)*0.25, bx = iso.x+Math.cos(an)*rx*0.92, by = cy+Math.sin(an)*ry*0.92;
        const h = (16 + sr(i+30)*22) * Math.min(1, k*3) * (0.6+0.4*a), w = 4 + sr(i+60)*3;
        const g2 = ctx.createLinearGradient(bx, by, bx, by-h); g2.addColorStop(0,'rgba(90,150,230,0.95)'); g2.addColorStop(1,'rgba(240,252,255,0.95)');
        ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(bx-w, by); ctx.lineTo(bx+(sr(i+90)-0.5)*4, by-h); ctx.lineTo(bx+w, by); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='stormMark'){
      // v466 Stormcall: a crackling target circle that tightens before the strike
      const R = pt.r, rx = R*ISO_KX*ISO_SQ2, ry = R*ISO_KY*ISO_SQ2, cy = iso.y-3, k = pt.prog||0, ck = game.clock||0;
      ctx.save();
      ctx.fillStyle = 'rgba(120,200,255,'+(0.06+0.16*k)+')'; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = pt.emp ? 'rgba(255,255,255,'+(0.6+0.3*k)+')' : 'rgba(160,225,255,'+(0.5+0.4*k)+')'; ctx.lineWidth = 2;
      ctx.setLineDash([6,5]); ctx.lineDashOffset = ck*50; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(200,240,255,'+(0.4+0.5*k)+')'; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.ellipse(iso.x, cy, rx*(1-0.75*k)+3, ry*(1-0.75*k)+1.5, 0, 0, 7); ctx.stroke();
      ctx.restore();
      continue;
    }
    if(pt.type==='skybolt'){
      // v466 Stormcall: a bolt from the sky with a white flash at the ground
      const a = pt.t/pt.max, top = iso.y - 520, ck = game.clock||0;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const pts = [], N = 9; for(let i=0;i<=N;i++){ const u = i/N; pts.push([iso.x + (i===0||i===N ? 0 : Math.sin(i*3.7+(pt.seed||0)+ck*30)*14*(1-u*0.3)), top + (iso.y-6-top)*u]); }
      for(const [w,c] of [[pt.emp?12:9,'rgba(120,200,255,'+(0.35*a)+')'],[pt.emp?5:3.5,'rgba(220,245,255,'+(0.9*a)+')'],[1.5,'rgba(255,255,255,'+a+')']]){
        ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q,i)=> i ? ctx.lineTo(q[0],q[1]) : ctx.moveTo(q[0],q[1])); ctx.stroke(); }
      ctx.globalAlpha = 0.8*a; const gl = ctx.createRadialGradient(iso.x, iso.y-8, 2, iso.x, iso.y-8, 60); gl.addColorStop(0,'rgba(255,255,255,0.9)'); gl.addColorStop(1,'rgba(140,210,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(iso.x, iso.y-8, 60, 0, 7); ctx.fill();
      ctx.restore();
      continue;
    }
    if(pt.type==='meteorMark'){
      // v460 Meteor: the target circle darkens and tightens as the rock comes down
      const R = pt.r, rx = R*ISO_KX*ISO_SQ2, ry = R*ISO_KY*ISO_SQ2, cy = iso.y-3, k = pt.prog||0, pul = 0.5+0.5*Math.sin((game.clock||0)*18);
      ctx.save();
      ctx.fillStyle = 'rgba(20,6,0,'+(0.15+0.35*k)+')'; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx*(0.25+0.6*k), ry*(0.25+0.6*k), 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,'+Math.round(120+60*pul)+',40,'+(0.45+0.4*k)+')'; ctx.lineWidth = 2;
      ctx.setLineDash([8,6]); ctx.lineDashOffset = -(game.clock||0)*40; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255,90,30,'+(0.3+0.5*k)+')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx*(1-0.7*k)+4, ry*(1-0.7*k)+2, 0, 0, 7); ctx.stroke();
      ctx.restore();
      continue;
    }
    if(pt.type==='meteorFall'){
      // v460 Meteor: a burning rock streaking down from the upper left
      const k = pt.prog||0, u = 1-k, hx = iso.x - u*170, hy = iso.y - 18 - u*360, R = 21 + 9*k;
      ctx.save();
      const tg = ctx.createLinearGradient(hx, hy, hx-90, hy-190); tg.addColorStop(0,'rgba(255,170,60,0.85)'); tg.addColorStop(0.4,'rgba(230,80,20,0.45)'); tg.addColorStop(1,'rgba(120,30,10,0)');
      ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(hx-R*0.8, hy+R*0.5); ctx.lineTo(hx-100, hy-200); ctx.lineTo(hx+R*0.6, hy-R*0.8); ctx.closePath(); ctx.fill();
      const gl = ctx.createRadialGradient(hx, hy, R*0.4, hx, hy, R*2.4); gl.addColorStop(0,'rgba(255,200,90,0.55)'); gl.addColorStop(1,'rgba(255,90,20,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(hx, hy, R*2.4, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a2418'; ctx.beginPath();
      for(let i=0;i<9;i++){ const an = i/9*6.283, rr = R*(0.82+0.18*Math.sin(i*2.7+(pt.seed||0))); i ? ctx.lineTo(hx+Math.cos(an)*rr, hy+Math.sin(an)*rr) : ctx.moveTo(hx+Math.cos(an)*rr, hy+Math.sin(an)*rr); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,150,50,0.9)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,190,80,0.85)'; ctx.beginPath(); ctx.arc(hx+R*0.25, hy+R*0.25, R*0.4, 0, 7); ctx.fill();
      ctx.restore();
      continue;
    }
    if(pt.type==='burnzone'){
      // v460 Meteor: scorched crater with flames licking up from it
      const R = pt.r, rx = R*ISO_KX*ISO_SQ2, ry = R*ISO_KY*ISO_SQ2, cy = iso.y-3, k = pt.prog||0, fade = k>0.8 ? (1-k)/0.2 : 1, clk = game.clock||0;
      const sr = (n)=>{ const x = Math.sin(n*127.1+(pt.seed||0)*3.7)*43758.5453; return x-Math.floor(x); };
      ctx.save(); ctx.globalAlpha = fade;
      const gr = ctx.createRadialGradient(iso.x, cy, 0, iso.x, cy, rx);
      gr.addColorStop(0,'rgba(255,120,30,0.55)'); gr.addColorStop(0.35,'rgba(120,30,8,0.6)'); gr.addColorStop(0.8,'rgba(30,12,8,0.55)'); gr.addColorStop(1,'rgba(30,12,8,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,140,40,0.55)'; ctx.lineWidth = 1.2;
      for(let i=0;i<8;i++){ const an = sr(i)*6.283, r1 = 0.4+sr(i+9)*0.5; ctx.beginPath(); ctx.moveTo(iso.x+Math.cos(an)*rx*0.12, cy+Math.sin(an)*ry*0.12); ctx.lineTo(iso.x+Math.cos(an+0.2)*rx*r1*0.6, cy+Math.sin(an+0.2)*ry*r1*0.6); ctx.lineTo(iso.x+Math.cos(an)*rx*r1, cy+Math.sin(an)*ry*r1); ctx.stroke(); }
      for(let i=0;i<14;i++){
        const an = sr(i+20)*6.283, rr = Math.sqrt(sr(i+40))*0.85, fx = iso.x+Math.cos(an)*rx*rr, fy = cy+Math.sin(an)*ry*rr;
        const h = (10+sr(i+60)*14) * (0.7+0.3*Math.sin(clk*9+i*1.7)), w = 3+sr(i+80)*3;
        ctx.fillStyle = 'rgba(255,'+Math.round(90+80*sr(i+90))+',30,0.8)';
        ctx.beginPath(); ctx.moveTo(fx-w, fy); ctx.quadraticCurveTo(fx-w*0.6, fy-h*0.6, fx+Math.sin(clk*6+i)*2, fy-h); ctx.quadraticCurveTo(fx+w*0.6, fy-h*0.6, fx+w, fy); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,230,140,0.75)'; ctx.beginPath(); ctx.ellipse(fx, fy-h*0.22, w*0.35, h*0.2, 0, 0, 7); ctx.fill();
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='frostzone'){
      // v269: icy ground (Blizzard / Permafrost): frosted sheet, cracks and rim crystals. Radius uses the true iso footprint (sqrt2).
      ctx.save();
      const R = pt.r, rx = R*ISO_KX*ISO_SQ2, ry = R*ISO_KY*ISO_SQ2, cy = iso.y-4;
      const rgb = pt.perma ? '30,62,135' : '42,82,160';   // v441: darker blue
      const sr = (n)=>{ const x = Math.sin(n*127.1+pt.x*0.37+pt.y*0.71)*43758.5453; return x-Math.floor(x); };
      ctx.globalAlpha = pt.perma ? 0.78+0.08*Math.sin((game.clock||0)*3) : 0.8;
      const gr = ctx.createRadialGradient(iso.x, cy, 0, iso.x, cy, rx);
      gr.addColorStop(0, 'rgba('+rgb+',0.10)'); gr.addColorStop(0.7, 'rgba('+rgb+',0.28)'); gr.addColorStop(1, 'rgba('+rgb+',0.46)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(120,165,225,0.45)'; ctx.lineWidth = 1;
      for(let i=0;i<11;i++){   // frost cracks
        const an = sr(i)*6.283, r0 = sr(i+20)*0.25, r1 = 0.55+sr(i+40)*0.4, mid = (r0+r1)/2 + (sr(i+60)-0.5)*0.15, am = an+(sr(i+80)-0.5)*0.5;
        ctx.beginPath(); ctx.moveTo(iso.x+Math.cos(an)*rx*r0, cy+Math.sin(an)*ry*r0);
        ctx.lineTo(iso.x+Math.cos(am)*rx*mid, cy+Math.sin(am)*ry*mid);
        ctx.lineTo(iso.x+Math.cos(an)*rx*r1, cy+Math.sin(an)*ry*r1); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(95,140,210,0.75)';
      for(let i=0;i<16;i++){   // ice crystals around the rim
        const an = i/16*6.283+sr(i+100)*0.3, bx = iso.x+Math.cos(an)*rx*0.97, by = cy+Math.sin(an)*ry*0.97, h = 7+sr(i+120)*8;
        ctx.beginPath(); ctx.moveTo(bx-3, by); ctx.lineTo(bx, by-h); ctx.lineTo(bx+3, by); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(70,120,200,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.stroke();
      ctx.restore();
      continue;
    }
    if(pt.type==='vortex'){
      // v269 Flame Vortex: three spiral arms of fire winding in around the caster
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const R = pt.r, rxg = R*ISO_KX*ISO_SQ2, ryg = R*ISO_KY*ISO_SQ2;
      const gg = ctx.createRadialGradient(iso.x, iso.y-4, 0, iso.x, iso.y-4, rxg);
      gg.addColorStop(0,'rgba(220,40,20,0.05)'); gg.addColorStop(1,'rgba(200,20,0,0.007)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-4, rxg, ryg, 0, 0, 7); ctx.fill();
      const arms = 3, steps = 26, grow = 0.85 + 0.15*Math.min(1, (pt.prog||0)*6);
      for(let k=0;k<arms;k++){
        for(let i=0;i<steps;i++){
          const u = i/steps, ang = pt.spin + k*6.283/arms + u*4.2, rad = R*(0.18+0.82*u)*grow;
          const q = toIso(pt.x+Math.cos(ang)*rad, pt.y+Math.sin(ang)*rad);
          const lift = 6 + (1-u)*26*Math.abs(Math.sin(pt.spin*0.7+k+u*3));
          const sz = 3.5 + u*7;
          ctx.globalAlpha = 0.03 + 0.085*u;
          ctx.fillStyle = u>0.7 ? '#c41408' : u>0.35 ? '#e02a10' : '#ff5a28';
          ctx.beginPath(); ctx.arc(q.x, q.y-lift, sz, 0, 7); ctx.fill();
        }
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='novaRing'){
      // v454 Nova: one clean expanding lightning ring with a few fixed sparks on its edge (no per-frame random flicker)
      const u = 1-a, k = Math.min(1, 0.2+u*1.15), rx = pt.r*ISO_KX*ISO_SQ2*k, ry = pt.r*ISO_KY*ISO_SQ2*k, cy = iso.y-6;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(150,220,255,'+(0.10*a)+')'; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(200,240,255,'+(0.9*a)+')'; ctx.lineWidth = 1.5+3*a;
      ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,200,255,'+(0.5*a)+')'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(iso.x, cy, rx*0.86, ry*0.86, 0, 0, 7); ctx.stroke();
      ctx.strokeStyle = 'rgba(235,250,255,'+(0.85*a)+')'; ctx.lineWidth = 1.4;
      for(let i=0;i<10;i++){
        const an = i/10*6.283 + pt.seed, cx = iso.x+Math.cos(an)*rx, cyy = cy+Math.sin(an)*ry, o = (i%2?1:-1)*3;
        ctx.beginPath(); ctx.moveTo(cx, cyy); ctx.lineTo(cx+o, cyy-5); ctx.lineTo(cx-o*0.5, cyy-9); ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='novaBolt'){
      // v269 Nova: radial lightning forks racing out to the edge, a bright expanding ring, core flash
      ctx.save();
      const u = 1-a, R = pt.r, rx = R*ISO_KX*ISO_SQ2*Math.min(1, 0.25+u*1.1), ry = R*ISO_KY*ISO_SQ2*Math.min(1, 0.25+u*1.1), cy = iso.y-8;
      ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createRadialGradient(iso.x, cy, 0, iso.x, cy, 46*a+8);
      cg.addColorStop(0,'rgba(255,255,230,'+(0.4*a)+')'); cg.addColorStop(1,'rgba(230,227,90,0)');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(iso.x, cy, 46*a+8, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(230,227,90,'+(0.07*a)+')'; ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,252,200,'+Math.min(0.5,a*0.8)+')'; ctx.lineWidth = 1.5+2.5*a; ctx.shadowColor = '#e6e35a'; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.ellipse(iso.x, cy, rx, ry, 0, 0, 7); ctx.stroke();
      ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      const n = pt.big ? 14 : 7;
      for(let i=0;i<n;i++){
        const an = i/n*6.283 + (pt.x*0.01), segs = 6; let lx = iso.x, ly = cy;
        ctx.beginPath(); ctx.moveTo(lx, ly);
        for(let sg=1; sg<=segs; sg++){
          const f = sg/segs*Math.min(1, 0.2+u*1.2), jx = (Math.random()-0.5)*9, jy = (Math.random()-0.5)*6;
          ctx.lineTo(iso.x+Math.cos(an)*R*ISO_KX*ISO_SQ2*f+jx, cy+Math.sin(an)*R*ISO_KY*ISO_SQ2*f+jy);
        }
        ctx.globalAlpha = Math.min(0.55, a*0.8); ctx.stroke();
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='zone'){
      // persistent ground effect (Plague / poison trap cloud): a soft filled ellipse with a rim
      ctx.save(); ctx.globalAlpha = pt.subtle ? 0.16 : 0.9;
      const rx = pt.r*ISO_KX, ry = pt.r*ISO_KY;
      const gr = ctx.createRadialGradient(iso.x, iso.y-6, 0, iso.x, iso.y-6, rx);
      gr.addColorStop(0, (pt.color||'#7dd45a')+'55'); gr.addColorStop(1, (pt.color||'#7dd45a')+'18');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-6, rx, ry, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = (pt.color||'#7dd45a')+(pt.subtle?'88':'99'); ctx.lineWidth = pt.subtle ? 1.2 : 2; ctx.stroke();
      ctx.restore();
      continue;
    }
    if(pt.type==='iceshard'){
      // (v147) ice bolt falling from the top-right of the screen at 45deg, D2 Blizzard style
      const el = pt.max - pt.t, fall = pt.fall||0.32;
      ctx.save();
      if(el < fall){
        const f = 1 - el/fall, H = 300*f, hx = iso.x + H, hy = iso.y - 8 - H, L = 34;
        ctx.globalAlpha = 0.95; ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(120,190,255,0.35)'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx+L*1.6,hy-L*1.6); ctx.stroke();
        ctx.strokeStyle = 'rgba(190,230,255,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx+L,hy-L); ctx.stroke();
        ctx.fillStyle = '#eaf7ff'; ctx.beginPath(); ctx.arc(hx,hy,3.5,0,7); ctx.fill();
      } else {
        const k = 1 - (el-fall)/Math.max(0.01,pt.max-fall);
        ctx.globalAlpha = Math.max(0,k)*0.9;
        ctx.fillStyle = '#d6f0ff';
        const spr = 5+(1-k)*6;
        for(let q=0;q<6;q++){   // faceted shards, not a puddle
          const qa = q*1.047+0.3, qx = iso.x+Math.cos(qa)*spr, qy = iso.y-4+Math.sin(qa)*spr*0.5;
          ctx.beginPath(); ctx.moveTo(qx-2, qy+1); ctx.lineTo(qx, qy-5-(1-k)*4); ctx.lineTo(qx+2, qy+1); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-4, 4*k+1, 2*k+0.5, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#eaf7ff'; ctx.lineWidth = 2;
        for(let i=0;i<5;i++){ const an = i*1.26+0.4, rr = 8+(1-k)*12; ctx.beginPath(); ctx.moveTo(iso.x+Math.cos(an)*4, iso.y-6+Math.sin(an)*2); ctx.lineTo(iso.x+Math.cos(an)*rr, iso.y-6-(1-k)*10+Math.sin(an)*rr*0.5); ctx.stroke(); }
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='rexfoot'){
      const k = clamp(1-pt.t/pt.max,0,1), sc = k<0.18 ? 1+0.4*(1-k/0.18) : 1, al = k<0.18 ? k/0.18 : Math.max(0, 1-(k-0.18)/0.82);
      const S = pt.r*0.95*sc, ca = Math.cos(pt.ang), sa = Math.sin(pt.ang);
      const W = (lx,ly)=>{ const q = toIso(pt.x + (ca*lx - sa*ly)*S, pt.y + (sa*lx + ca*ly)*S); return q; };
      const poly = (pts)=>{ ctx.beginPath(); pts.forEach(([lx,ly],i)=>{ const q = W(lx,ly); if(i) ctx.lineTo(q.x,q.y); else ctx.moveTo(q.x,q.y); }); ctx.closePath(); ctx.fill(); ctx.stroke(); };
      const toe = (rot, len, wd)=>{ const c=Math.cos(rot), s2=Math.sin(rot), T=(x,y)=>[x*c-y*s2, x*s2+y*c];
        poly([T(0.05,-wd),T(len*0.72,-wd*0.8),T(len,0),T(len*0.72,wd*0.8),T(0.05,wd)]);
        poly([T(len*0.86,-wd*0.45),T(len*1.28,0),T(len*0.86,wd*0.45)]); };
      ctx.save(); ctx.globalAlpha = al; ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(190,20,10,0.22)'; ctx.strokeStyle = '#ff3a2a'; ctx.lineWidth = 3.2;
      const pad = []; for(let i=0;i<16;i++){ const an=i/16*6.2832; pad.push([-0.42+Math.cos(an)*0.46, Math.sin(an)*0.42]); }
      poly(pad); toe(0,1.0,0.17); toe(-0.62,0.82,0.15); toe(0.62,0.82,0.15); toe(3.14,0.34,0.1);
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,90,60,0.6)'; ctx.lineWidth = 7; ctx.globalAlpha = al*0.45;
      poly(pad); toe(0,1.0,0.17); toe(-0.62,0.82,0.15); toe(0.62,0.82,0.15);
      ctx.restore();
      continue;
    }
    if(pt.type==='skyArrow'){
      // v454 Rain of Arrows: a single arrow streaking straight up out of the ranger's bow
      const u = 1 - a, y0 = iso.y - 34 - u*u*520;
      ctx.save(); ctx.globalAlpha = Math.min(1, a*2.2); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,240,190,0.35)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(iso.x+6, y0+10); ctx.lineTo(iso.x+6, y0+70); ctx.stroke();
      ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(iso.x+6, y0); ctx.lineTo(iso.x+6, y0+20); ctx.stroke();
      ctx.fillStyle = '#e8c44a'; ctx.beginPath(); ctx.moveTo(iso.x+6, y0-6); ctx.lineTo(iso.x+3.4, y0+1); ctx.lineTo(iso.x+8.6, y0+1); ctx.closePath(); ctx.fill();
      if(u < 0.25){ ctx.globalAlpha = (0.25-u)*3; ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.arc(iso.x+6, iso.y-34, 7, 0, 7); ctx.fill(); }
      ctx.restore();
      continue;
    }
    if(pt.type==='trapmark'){
      ctx.save(); const rx = 18*ISO_KX, ry = 18*ISO_KY;
      ctx.globalAlpha = pt.armed ? 0.95 : 0.5; ctx.strokeStyle = pt.color; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx, ry, 0, 0, 7); ctx.stroke();
      ctx.fillStyle = pt.color+'44'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(iso.x-rx*0.6, iso.y-2); ctx.lineTo(iso.x+rx*0.6, iso.y-2); ctx.moveTo(iso.x, iso.y-2-ry*0.7); ctx.lineTo(iso.x, iso.y-2+ry*0.7); ctx.stroke();
      ctx.restore();
      continue;
    }
    if(pt.type==='num'){
      // damage number: floats up and fades; crits are bigger and gold
      ctx.save();
      ctx.globalAlpha = Math.min(1, a*1.6);
      ctx.font = (pt.crit ? 'bold 20px ' : pt.small ? 'bold 11px ' : 'bold 14px ') + 'system-ui, sans-serif';
      ctx.textAlign = 'center';
      const ny = iso.y - 34 - (1-a)*(pt.crit?34:26);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(pt.text, iso.x, ny);
      ctx.fillStyle = pt.col ? pt.col : pt.gold ? '#ffd23a' : pt.crit ? '#ffe27a' : '#ffffff'; ctx.fillText(pt.text, iso.x, ny);
      ctx.restore();
      continue;
    }
    if(pt.type==='wave'){
      const k = clamp(1-pt.t/pt.max,0,1), A = pt.arc||0.7, R1 = pt.reach*(0.5+0.55*k), n = 12;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for(const [r0f, alp, col] of [[0.62, 0.55, pt.c1||'255,140,50'], [0.9, 0.9, pt.c2||'255,230,160']]){
        const R0 = R1*r0f, o = [], inn = [];
        for(let i=0;i<=n;i++){ const an = pt.ang + (i/n-0.5)*2*A*(0.75+0.25*k); o.push(toIso(pt.x+Math.cos(an)*R1, pt.y+Math.sin(an)*R1)); inn.push(toIso(pt.x+Math.cos(an)*R0, pt.y+Math.sin(an)*R0)); }
        ctx.beginPath(); o.forEach((q,i)=>{ if(i) ctx.lineTo(q.x,q.y-22); else ctx.moveTo(q.x,q.y-22); }); for(let i=inn.length-1;i>=0;i--) ctx.lineTo(inn[i].x, inn[i].y-22); ctx.closePath();
        ctx.fillStyle = 'rgba('+col+','+(alp*(1-k)*0.85)+')'; ctx.fill();
      }
      ctx.restore();
      continue;
    }
    if(pt.type==='slash'){
      ctx.save(); ctx.translate(iso.x, iso.y-30); ctx.rotate(pt.ang*0.4);
      if(pt.color){ ctx.globalAlpha = a; ctx.strokeStyle = pt.color; }
      else { ctx.strokeStyle = pt.crit ? ('rgba(255,226,122,'+a+')') : ('rgba(255,220,180,'+a+')'); }
      ctx.lineWidth = pt.crit ? 6 : 4;
      ctx.beginPath(); ctx.arc(0,0,pt.crit?23.5:20,-0.9,0.9); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.restore();
    } else if(pt.type==='arcaneStrike'){
      // v373: small arcane burst: glowing orb, a violet crescent, a fading rune ring and a few sparks
      const k = 1-a, col = pt.crit ? '255,226,122' : '190,140,255';
      ctx.save(); ctx.translate(iso.x, iso.y-30); ctx.rotate(pt.ang*0.4);
      ctx.lineCap = 'round';
      const gr = ctx.createRadialGradient(8,0,0,8,0,20+k*6); gr.addColorStop(0,'rgba(245,235,255,'+(a*0.9)+')'); gr.addColorStop(0.4,'rgba('+col+','+(a*0.55)+')'); gr.addColorStop(1,'rgba('+col+',0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(8,0,20+k*6,0,7); ctx.fill();
      ctx.strokeStyle = 'rgba('+col+','+(a*0.55)+')'; ctx.lineWidth = pt.crit ? 14 : 10;
      ctx.beginPath(); ctx.arc(0,0,24+k*10,-0.85,0.85); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,225,255,'+a+')'; ctx.lineWidth = pt.crit ? 5 : 3.2;
      ctx.beginPath(); ctx.arc(0,0,24+k*10,-0.85,0.85); ctx.stroke();
      ctx.save(); ctx.scale(1,0.6); ctx.strokeStyle = 'rgba('+col+','+(a*0.85)+')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(14,0,8+k*20,0,7); ctx.stroke();
      ctx.setLineDash([4,5]); ctx.beginPath(); ctx.arc(14,0,4+k*13,k*6,k*6+7); ctx.stroke(); ctx.restore();
      ctx.fillStyle = 'rgba(250,240,255,'+a+')';
      for(let j=0;j<6;j++){ const an = -1.0+j*0.4, rr = 18+k*(18+j*3); ctx.fillRect(Math.cos(an)*rr-1.6, Math.sin(an)*rr-1.6, 3.2, 3.2); }
      ctx.restore();
    } else if(pt.type==='burst'){
      ctx.beginPath(); ctx.fillStyle=(pt.color||'#fff'); ctx.globalAlpha=a;
      ctx.arc(iso.x, iso.y-16, 16*(1-a)+5, 0,7); ctx.fill(); ctx.globalAlpha=1;
    } else if(pt.type==='gasCloud'){
      // v237: billowing green poison cloud (poison trap + plague): soft overlapping puffs that drift, rise and swirl
      const T = game.clock||0, f = Math.max(0, Math.min(1, pt.f==null?1:pt.f)), R = pt.r||90;
      const TH = pt.thin ? 1 : 0;   // v268: Plague's big cloud is drawn much thinner so you can see through it
      const n = TH ? Math.max(6, Math.min(12, Math.round(R/24))) : Math.max(10, Math.min(34, Math.round(R/8)));
      ctx.save();
      const c0 = toIso(pt.x, pt.y);
      ctx.fillStyle = 'rgba(50,120,30,'+((TH?0.07:0.22)*f)+')';
      ctx.beginPath(); ctx.ellipse(c0.x, c0.y-2, R*ISO_KX*0.95, R*ISO_KY*0.95, 0, 0, 7); ctx.fill();
      for(let i=0;i<n;i++){
        const dir = i%2 ? 1 : -1, a0 = i*2.399+(pt.seed||0)+T*0.22*dir, rr = Math.sqrt((i+0.5)/n)*R*0.82;
        const bob = Math.sin(T*1.5+i*1.7), rise = ((T*0.28+i*0.137)%1);
        const q = toIso(pt.x+Math.cos(a0)*rr+bob*4, pt.y+Math.sin(a0)*rr);
        const sz = R*ISO_KX*(TH?0.1:0.2+(i%3)*0.045)*(0.92+0.1*Math.sin(T*2+i)), a = (TH?0.2:0.5)*f*(1-rise*0.4);
        ctx.save(); ctx.translate(q.x, q.y-8-rise*20); ctx.scale(1,0.68);
        const gr = ctx.createRadialGradient(0,0,0,0,0,sz);
        gr.addColorStop(0,'rgba(165,240,95,'+a+')'); gr.addColorStop(0.55,'rgba(85,170,45,'+(a*0.75)+')'); gr.addColorStop(1,'rgba(35,95,25,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,sz,0,7); ctx.fill(); ctx.restore();
      }
      if(TH){ ctx.strokeStyle='rgba(140,220,90,'+(0.35*f)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(c0.x, c0.y-2, R*ISO_KX*0.97, R*ISO_KY*0.97, 0, 0, 7); ctx.stroke(); }
      ctx.fillStyle = 'rgba(200,255,140,'+(0.7*f)+')';
      for(let j=0;j<7;j++){   // tiny spores drifting upward
        const u = (T*0.5+j*0.19)%1, a1 = j*2.9+(pt.seed||0), rr = R*0.7*((j%4)/4+0.15);
        const q = toIso(pt.x+Math.cos(a1)*rr, pt.y+Math.sin(a1)*rr);
        ctx.globalAlpha = (1-u)*0.8*f; ctx.fillRect(q.x-1, q.y-10-u*34, 2.2, 2.2);
      }
      ctx.restore();
    } else if(pt.type==='gasBurst'){
      const pp = 1-a, R = pt.r||90, c0 = toIso(pt.x, pt.y), THB = pt.thin ? 0.35 : 1;
      ctx.save();
      for(let i=0;i<12;i++){
        const ang = (pt.seed||0)+i*Math.PI/6, d = pp*R*(0.55+0.3*((i*5)%3)/2);
        const q = toIso(pt.x+Math.cos(ang)*d, pt.y+Math.sin(ang)*d), sz = R*ISO_KX*(0.12+0.18*pp)*(pt.thin?0.5:1);
        ctx.save(); ctx.translate(q.x, q.y-10-pp*14); ctx.scale(1,0.7);
        const gr = ctx.createRadialGradient(0,0,0,0,0,sz), al = 0.7*a*THB;
        gr.addColorStop(0,'rgba(175,245,100,'+al+')'); gr.addColorStop(0.6,'rgba(80,165,40,'+(al*0.7)+')'); gr.addColorStop(1,'rgba(35,95,25,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,sz,0,7); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    } else if(pt.type==='fireImpact'){
      const pp = 1-a, sd = pt.seed||0.3;
      ctx.save(); ctx.translate(iso.x, iso.y-14); ctx.globalCompositeOperation = 'lighter';
      const fr = 6+22*pp, fg = ctx.createRadialGradient(0,0,0,0,0,fr);
      fg.addColorStop(0,'rgba(255,250,200,'+a+')'); fg.addColorStop(0.5,'rgba(255,140,40,'+(a*0.8)+')'); fg.addColorStop(1,'rgba(255,60,10,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0,0,fr,0,7); ctx.fill();
      for(let i=0;i<8;i++){   // radiating flame petals
        const ang = sd*6+i*Math.PI/4, len = (8+30*pp)*(0.8+0.4*((i*7)%3)/2), w = 5*(1-pp);
        ctx.save(); ctx.rotate(ang); ctx.scale(1,0.75); ctx.globalAlpha = a*0.9;
        ctx.fillStyle = i%2 ? '#ff6a1a' : '#ffb040';
        ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(len,0); ctx.lineTo(4,0); ctx.quadraticCurveTo(len*0.5,-w,len,0); ctx.quadraticCurveTo(len*0.5,w,4,0); ctx.fill();
        ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#ffd860';
      for(let i=0;i<10;i++){   // sparks with gravity
        const ang = sd*9+i*0.63, d = (10+34*pp)*(0.6+((i*5)%4)*0.15);
        ctx.globalAlpha = a; ctx.fillRect(Math.cos(ang)*d, Math.sin(ang)*d*0.7+22*pp*pp, 2, 2);
      }
      ctx.globalAlpha = a*0.25*pp; ctx.fillStyle = '#2a1a14'; ctx.beginPath(); ctx.arc(0,-8*pp,10+16*pp,0,7); ctx.fill();
      ctx.restore();
    } else if(pt.type==='iceImpact'){
      const pp = 1-a, sd = pt.seed||0.3;
      ctx.save(); ctx.translate(iso.x, iso.y-14);
      ctx.globalCompositeOperation = 'lighter';
      const fr = 16*(1-pp)+4, fg = ctx.createRadialGradient(0,0,0,0,0,fr*1.6);
      fg.addColorStop(0,'rgba(255,255,255,'+a+')'); fg.addColorStop(1,'rgba(110,190,255,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0,0,fr*1.6,0,7); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(190,235,255,'+(a*0.9)+')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0,6,8+30*pp,(8+30*pp)*0.5,0,0,7); ctx.stroke();
      for(let i=0;i<9;i++){   // shattering crystal shards
        const ang = sd*6+i*Math.PI*2/9, d = 6+32*pp*(0.75+((i*5)%3)*0.15), L = 9*(1-pp*0.6);
        ctx.save(); ctx.translate(Math.cos(ang)*d, Math.sin(ang)*d*0.75+10*pp*pp); ctx.rotate(ang+pp*2);
        ctx.globalAlpha = a; ctx.fillStyle = i%2 ? '#c8f0ff' : '#7cc8ff';
        ctx.beginPath(); ctx.moveTo(L,0); ctx.lineTo(0,-L*0.3); ctx.lineTo(-L*0.6,0); ctx.lineTo(0,L*0.3); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    } else if(pt.type==='guardCast'){
      const pp = 1-a;
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.globalCompositeOperation = 'lighter';
      const cw = 26*(1-pp*0.5), ch = 150*Math.min(1,pp*3+0.2), cg = ctx.createLinearGradient(0,0,0,-ch);
      cg.addColorStop(0,'rgba(255,230,140,'+(a*0.8)+')'); cg.addColorStop(1,'rgba(255,230,140,0)');
      ctx.fillStyle = cg; ctx.fillRect(-cw/2,-ch,cw,ch);
      ctx.strokeStyle = 'rgba(255,226,130,'+a+')'; ctx.lineWidth = 3;
      for(let k=0;k<2;k++){ const rr = (10+70*Math.max(0,pp-k*0.15)); ctx.beginPath(); ctx.ellipse(0,0,rr,rr*0.5,0,0,7); ctx.stroke(); }
      ctx.fillStyle = '#fff4c0';
      for(let i=0;i<10;i++){ const u = (pp*1.2+i*0.1)%1, x = Math.sin(i*2.1)*26, y = -u*110; ctx.globalAlpha = a*(1-u); ctx.fillRect(x-1,y-1,2.4,2.4); }
      ctx.restore();
    } else if(pt.type==='rageCast'){
      const pp = 1-a;
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.globalCompositeOperation = 'lighter';
      const rr = 12+100*pp;
      ctx.strokeStyle = 'rgba(255,70,40,'+a+')'; ctx.lineWidth = 5*(1-pp)+1.5;
      ctx.beginPath(); ctx.ellipse(0,0,rr,rr*0.5,0,0,7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,190,90,'+(a*0.8)+')'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0,0,rr*0.7,rr*0.35,0,0,7); ctx.stroke();
      const fg = ctx.createRadialGradient(0,-16,0,0,-16,40+30*pp); fg.addColorStop(0,'rgba(255,120,60,'+(a*0.7)+')'); fg.addColorStop(1,'rgba(255,40,10,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0,-16,40+30*pp,0,7); ctx.fill();
      for(let i=0;i<10;i++){   // flame spikes thrown upward
        const x = (i-4.5)*7, h = (22+30*((i*7)%4)/3)*Math.min(1,pp*4)*a+4;
        ctx.globalAlpha = a*0.9; ctx.fillStyle = i%2 ? '#ff4a1a' : '#ffa030';
        ctx.beginPath(); ctx.moveTo(x-3,0); ctx.quadraticCurveTo(x,-h*0.6,x+Math.sin(i)*3,-h); ctx.quadraticCurveTo(x+1,-h*0.4,x+3,0); ctx.fill();
      }
      ctx.restore();
    } else if(pt.type==='roaFx'){
      // v251 Rain of Arrows: a glowing ground circle appears, then arrows streak down out of the sky into it
      const el = pt.max - pt.t, D = RAIN_OF_ARROWS_DELAY, R = pt.r, rx = R*ISO_KX, ry = R*ISO_KY;
      const fadeIn = Math.min(1, el/0.15), fadeOut = el > D ? Math.max(0, 1-(el-D)/0.6) : 1, A = fadeIn*fadeOut, T = game.clock||0;
      ctx.save();
      ctx.translate(iso.x, iso.y-2);
      const gg = ctx.createRadialGradient(0,0,rx*0.1,0,0,rx);
      gg.addColorStop(0,'rgba(232,196,74,'+(0.05*A)+')'); gg.addColorStop(1,'rgba(232,196,74,'+(0.28*A)+')');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,226,130,'+(0.9*A)+')'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,226,130,'+(0.4*A)+')'; ctx.lineWidth = 1;
      for(let k=0;k<6;k++){ const an = k*Math.PI/3 + T*0.8; ctx.beginPath(); ctx.moveTo(Math.cos(an)*rx*0.34, Math.sin(an)*ry*0.34); ctx.lineTo(Math.cos(an)*rx*0.7, Math.sin(an)*ry*0.7); ctx.stroke(); }
      // arrows
      const FALL = 0.26, SKY = 300;
      for(const ar of pt.arrows){
        const u = (el - ar.tl)/FALL;
        const lx = ar.ox*rx, ly = ar.oy*ry;
        if(u >= 0 && u < 1){
          const yy = ly - (1-u)*SKY, xx = lx + (1-u)*SKY*ar.sl*0.4;
          ctx.strokeStyle = 'rgba(255,240,200,0.85)'; ctx.lineWidth = 1.6;
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx - (xx-lx)*0.08, yy - 26); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(xx - (xx-lx)*0.08, yy - 26); ctx.lineTo(xx - (xx-lx)*0.2, yy - 70); ctx.stroke();
          ctx.fillStyle = '#e8e0c0'; ctx.beginPath(); ctx.moveTo(xx,yy+3); ctx.lineTo(xx-2,yy-3); ctx.lineTo(xx+2,yy-3); ctx.closePath(); ctx.fill();
        } else if(u >= 1){
          const age = el - ar.tl - FALL, st = Math.max(0, 1 - age/0.5) * fadeOut;
          if(age < 0.18){ ctx.strokeStyle = 'rgba(255,230,160,'+(0.7*(1-age/0.18))+')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(lx,ly,4+age*60,(4+age*60)*0.5,0,0,7); ctx.stroke(); }
          ctx.strokeStyle = 'rgba(230,220,190,'+st+')'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + ar.sl*5, ly - 14); ctx.stroke();
          ctx.strokeStyle = 'rgba(200,70,60,'+st+')'; ctx.beginPath(); ctx.moveTo(lx + ar.sl*5, ly - 14); ctx.lineTo(lx + ar.sl*6.5, ly - 18); ctx.stroke();
        }
      }
      ctx.restore();
    } else if(pt.type==='bannerFx'){
      const tt = (game && game.clock) || 0, war = pt.btype==='war';
      const col = war ? '226,80,58' : '111,180,255';
      ctx.save();
      const rx = pt.r*ISO_KX*ISO_SQ2, ry = pt.r*ISO_KY*ISO_SQ2;
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba('+col+',0.10)'; ctx.strokeStyle = 'rgba('+col+',0.55)'; ctx.lineWidth = 2; ctx.setLineDash([10,7]);
      if(pass==='ground'){ ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); continue; }
      ctx.setLineDash([]);
      // pole + waving flag
      ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(iso.x, iso.y-2); ctx.lineTo(iso.x, iso.y-70); ctx.stroke();
      const w1 = Math.sin(tt*4)*4, w2 = Math.sin(tt*4+1.4)*5;
      ctx.fillStyle = 'rgb('+col+')';
      ctx.beginPath(); ctx.moveTo(iso.x, iso.y-68); ctx.quadraticCurveTo(iso.x+16, iso.y-70+w1, iso.x+32, iso.y-62+w2); ctx.lineTo(iso.x+28, iso.y-52+w2); ctx.quadraticCurveTo(iso.x+14, iso.y-54+w1, iso.x, iso.y-48); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(iso.x+14, iso.y-58+w1*0.6, 3, 0, 7); ctx.fill();
      ctx.restore();
    } else if(pt.type==='consecrateFx'){
      const tt = (game && game.clock) || 0;
      ctx.save();
      const rx = pt.r*ISO_KX*ISO_SQ2, ry = pt.r*ISO_KY*ISO_SQ2;
      const gr = ctx.createRadialGradient(iso.x, iso.y-2, 0, iso.x, iso.y-2, rx);
      gr.addColorStop(0, 'rgba(255,233,160,0.42)'); gr.addColorStop(0.7, 'rgba(255,200,90,0.22)'); gr.addColorStop(1, 'rgba(255,170,60,0.08)');
      ctx.fillStyle = gr; ctx.strokeStyle = 'rgba(255,220,120,0.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,190,0.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx*(0.45+0.1*Math.sin(tt*3)), ry*(0.45+0.1*Math.sin(tt*3)), 0, 0, 7); ctx.stroke();
      ctx.restore();
    } else if(pt.type==='smiteFx'){
      ctx.save();
      const rr = (pt.wrath ? 22 : 13) * (0.5 + a*0.7);
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createRadialGradient(iso.x, iso.y-22, 0, iso.x, iso.y-22, rr);
      gr.addColorStop(0, 'rgba(255,255,240,'+(0.95*a)+')'); gr.addColorStop(0.45, 'rgba(255,214,110,'+(0.7*a)+')'); gr.addColorStop(1, 'rgba(255,170,50,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(iso.x, iso.y-22, rr, 0, 7); ctx.fill();
      ctx.restore();
    } else if(pt.type==='judgeTele'){
      ctx.save();
      const rx = pt.r*ISO_KX*ISO_SQ2, ry = pt.r*ISO_KY*ISO_SQ2, f = pt.frac||0;
      ctx.fillStyle = 'rgba(255,200,90,'+(0.08+0.22*f)+')'; ctx.strokeStyle = 'rgba(255,170,60,'+(0.4+0.5*f)+')'; ctx.lineWidth = 2+2*f;
      ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx, ry, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,240,170,'+(0.15+0.3*f)+')';
      ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx*f, ry*f, 0, 0, 7); ctx.fill();
      ctx.restore();
    } else if(pt.type==='judgePillar'){
      ctx.save();
      const rx = pt.r*ISO_KX*ISO_SQ2, ry = pt.r*ISO_KY*ISO_SQ2, w = rx*0.9*a;
      ctx.globalCompositeOperation = 'lighter';
      const gr = ctx.createLinearGradient(iso.x-w, 0, iso.x+w, 0);
      gr.addColorStop(0, 'rgba(255,170,60,0)'); gr.addColorStop(0.5, 'rgba(255,245,200,'+(0.9*a)+')'); gr.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = gr; ctx.fillRect(iso.x-w, iso.y-320, w*2, 320);
      ctx.fillStyle = 'rgba(255,220,120,'+(0.55*a)+')'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-2, rx*(1.1-0.3*a), ry*(1.1-0.3*a), 0, 0, 7); ctx.fill();
      ctx.restore();
    } else if(pt.type==='ring'){
      ctx.save();
      ctx.globalAlpha = a*0.8;
      ctx.strokeStyle = pt.color||'#fff';
      ctx.lineWidth = 3;
      if(pt.exact){ ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(iso.x, iso.y, (pt.r||50)*(1-a)*ISO_KX*Math.SQRT2, (pt.r||50)*(1-a)*ISO_KY*Math.SQRT2, 0, 0, 7); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(iso.x, iso.y-10, (pt.r||50)*(1-a)*0.9*ISO_KX+8, (pt.r||50)*(1-a)*0.9*ISO_KY+4, 0, 0, 7); ctx.stroke(); }
      ctx.restore();
    }
  }
}
let _hpBarTopY = null;   // v237: screen y of the top of the last hp bar drawn (name plates sit above it)
function drawHpBar(iso, topY, r, hp, maxHp){
  if(_suppressHpBar) return;
  const bw = 26*(r/16);
  _hpBarTopY = Math.min(_hpBarTopY==null ? 1e9 : _hpBarTopY, iso.y-topY);
  if(_hpQueue){ _hpQueue.push([iso,topY,r,hp,maxHp]); return; }
  ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(iso.x-bw/2, iso.y-topY, bw, 4);
  ctx.fillStyle='#e0455f'; ctx.fillRect(iso.x-bw/2, iso.y-topY, bw*clamp(hp/maxHp,0,1), 4);
}

function drawFriendlySkeleton(f){
  const fi = toIso(f.x, f.y);
  ctx.save(); ctx.translate(fi.x, fi.y); ctx.scale(1,0.5); ctx.strokeStyle='rgba(130,255,170,0.6)'; ctx.fillStyle='rgba(130,255,170,0.12)'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(0,0,f.r*1.35,0,7); ctx.fill(); ctx.stroke(); ctx.restore();
  f.type = 'skeleton'; drawSkeletonEnemy(f);
}
let _suppressHpBar = false;
function drawGateArcher(a){ _suppressHpBar = true; try{ drawSkeletonEnemy(a); }finally{ _suppressHpBar = false; }
  const fi = toIso(a.x, a.y); ctx.save(); ctx.translate(fi.x, fi.y); ctx.scale(1,0.5); ctx.strokeStyle='rgba(180,120,255,0.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,a.r*1.2,0,7); ctx.stroke(); ctx.restore(); }
function drawSoulGate(gt){
  const iso = toIso(gt.x, gt.y), T = (game&&game.clock)||0, open = Math.min(1, gt.t/0.4);
  const W = 30*open, H = 62*open;
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='rgba(120,60,200,0.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 46, 20, 0, 0, 7); ctx.fill();
  ctx.translate(0, -H*0.55);
  const gr = ctx.createRadialGradient(0,0,2,0,0,H*0.6);
  gr.addColorStop(0,'rgba(240,220,255,0.95)'); gr.addColorStop(0.45,'rgba(150,80,230,0.85)'); gr.addColorStop(1,'rgba(50,20,100,0.9)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0,0,W,H*0.55,0,0,7); ctx.fill();
  ctx.strokeStyle='rgba(210,170,255,0.9)'; ctx.lineWidth=3; ctx.stroke();
  for(let k=0;k<4;k++){ const a=T*2.2+k*1.57; ctx.strokeStyle='rgba(235,215,255,'+(0.55-k*0.1)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,W*(0.25+0.17*k),H*0.55*(0.25+0.17*k),a,0,4.2); ctx.stroke(); }
  ctx.restore();
}
function pushNecroDrawables(g, drawables){
  if(g.soulGate){ const gt = g.soulGate; drawables.push({depth:gt.x+gt.y, draw:()=>drawSoulGate(gt)}); }
  if(g.gateArchers) for(const a of g.gateArchers) drawables.push({depth:a.x+a.y, draw:()=>drawGateArcher(a)});
}
// v301: Squires get their own foot-soldier look: kettle helm, padded gambeson with a stance-coloured sash, round shield and a short sword
// v324: Squires wear the player's warrior sprite, scaled down -- 65% of the player's size at rank 1 up to 90% at rank 5
function squireVisScale(rank){ return 0.65 + 0.0625*(clamp(rank||1,1,5)-1); }
function drawSquireIso(f){
  const pl = game && game.player;
  if(!pl){ drawSquireIsoOld(f); return; }
  const vis = squireVisScale(effectiveRank(pl,'squire')||1);
  const sq = f._wp || (f._wp = {equipment:{mainhand:{slotType:'weapon1h'}, offhand:{slotType:'shield'}}, invuln:0, isSquire:true});
  const sw = (f.atkCd>FOLLOWER_ATK_CD-0.24) ? clamp((f.atkCd-(FOLLOWER_ATK_CD-0.24))/0.24,0,1) : 0;
  sq.x=f.x; sq.y=f.y; sq.r=16*vis; sq.faceSign=f.faceSign||1; sq.animT=f.animT||0; sq.moving=!!f.moving;
  sq.atkAnimT = sw*0.22; sq.atkAnimMax = 0.22; sq.hitFlash = f.hitT>0 ? f.hitT : 0;
  { const ke = uq(pl,'uq_templar') && pl.knightEquip; sq.knightHelm = !!(ke && ke.helm); sq.knightArmor = !!(ke && ke.armor); }
  drawWarrior(sq);
  const iso = toIso(f.x,f.y);
  if(f.taunting){ ctx.save(); ctx.fillStyle='#ffd23a'; ctx.font='bold 13px Alegreya,Georgia, serif'; ctx.textAlign='center'; ctx.fillText('!', iso.x, iso.y-66*vis); ctx.restore(); }
  drawHpBar(iso, 72*vis, f.r*Math.max(1,vis*1.2), f.hp, f.maxHp);
}
function drawSquireIsoOld(f){
  const iso = toIso(f.x,f.y);
  const s = f.r/16, face = f.faceSign||1, t = f.animT||0, flash = f.hitT>0;
  const moving = f.moving;
  const stance = ({attack:'#e2703a', guard:'#5b8cff'}[f.stance]) || '#c9a24a';
  const walk = moving ? Math.sin(t*10) : 0, bob = moving ? Math.abs(Math.sin(t*10))*1.6 : Math.sin(t*2.2)*0.6;
  const sw = (f.atkCd>FOLLOWER_ATK_CD-0.24) ? clamp((f.atkCd-(FOLLOWER_ATK_CD-0.24))/0.24,0,1) : 0;   // 1 -> 0 over the swing
  drawShadow(iso.x, iso.y, 14*s, 6.5*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const k = flash ? 1 : 0, P = (c)=> flash ? '#ffffff' : c;
  // legs + boots
  for(const [lx,sg] of [[-4.6,-walk],[1.2,walk]]){
    const ly = sg*2;
    ctx.fillStyle=P('#5a4630'); roundRect(lx,-14-ly*0.2,3.6,14+ly*0.2,1.6); ctx.fill();
    ctx.fillStyle=P('#2e2218'); ctx.beginPath(); ctx.moveTo(lx-0.6,-4); ctx.lineTo(lx+3.8,-4); ctx.lineTo(lx+5.6,0.8); ctx.lineTo(lx-0.6,0.8); ctx.closePath(); ctx.fill();
  }
  // tunic skirt + gambeson torso
  const by = -13+bob;
  ctx.fillStyle=P('#8a7452'); ctx.beginPath(); ctx.moveTo(-6.4,by); ctx.lineTo(6.4,by); ctx.lineTo(7.4,by+6); ctx.lineTo(-7.4,by+6); ctx.closePath(); ctx.fill();
  const tg = ctx.createLinearGradient(-6,by-16,6,by); tg.addColorStop(0,'#c8b48a'); tg.addColorStop(1,'#8a7452');
  ctx.fillStyle = flash ? '#ffffff' : tg; roundRect(-6.6,by-16,13.2,17,3.4); ctx.fill(); ctx.strokeStyle='#3a2c1a'; ctx.lineWidth=1.1; ctx.stroke();
  ctx.strokeStyle='rgba(60,44,24,0.35)'; ctx.lineWidth=0.8; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(-6,by-12+i*4.6); ctx.lineTo(6,by-12+i*4.6); ctx.stroke(); }   // quilting
  // stance sash (diagonal) + belt
  ctx.strokeStyle = flash ? '#ffffff' : stance; ctx.lineWidth=3; ctx.lineCap='butt'; ctx.beginPath(); ctx.moveTo(-6,by-15); ctx.lineTo(6,by-2); ctx.stroke();
  ctx.fillStyle=P('#3a2a18'); ctx.fillRect(-6.8,by-3,13.6,2.4); ctx.fillStyle=P('#b8923a'); ctx.fillRect(-1.2,by-3.2,2.4,3);
  // steel pauldron on the sword shoulder
  ctx.fillStyle=P('#aab3c4'); ctx.beginPath(); ctx.ellipse(6.2,by-15,3.6,2.8,0,0,7); ctx.fill(); ctx.strokeStyle='#2c3340'; ctx.lineWidth=0.9; ctx.stroke();
  // shield arm + round shield
  ctx.strokeStyle=P('#8a7452'); ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(-6,by-13); ctx.lineTo(-9,by-7); ctx.stroke();
  ctx.save(); ctx.translate(-10.5,by-8); 
  const sg2 = ctx.createRadialGradient(-1,-1,0.5,0,0,7.4); sg2.addColorStop(0,'#9a7a4a'); sg2.addColorStop(1,'#5a4226');
  ctx.fillStyle = flash ? '#ffffff' : sg2; ctx.beginPath(); ctx.ellipse(0,0,4.2,7.4,0,0,7); ctx.fill(); ctx.strokeStyle=P('#c9d0dc'); ctx.lineWidth=1.3; ctx.stroke();
  ctx.fillStyle=P(stance); ctx.beginPath(); ctx.arc(0,0,1.8,0,7); ctx.fill(); ctx.strokeStyle='#2a1e12'; ctx.lineWidth=0.6; ctx.stroke();
  ctx.restore();
  // sword arm + short sword (swings on attack)
  ctx.save(); ctx.translate(6.6,by-13); ctx.rotate(sw>0 ? (1-sw)*1.7-0.8 : -0.15);
  ctx.strokeStyle=P('#8a7452'); ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(1.6,6); ctx.stroke();
  ctx.translate(1.6,6);
  ctx.fillStyle=P('#d8dce4'); ctx.beginPath(); ctx.moveTo(-1,0); ctx.lineTo(-0.8,-13); ctx.lineTo(0.2,-15.5); ctx.lineTo(1.2,-13); ctx.lineTo(1,0); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#3a3428'; ctx.lineWidth=0.7; ctx.stroke();
  ctx.fillStyle=P('#b8923a'); ctx.fillRect(-3,-0.4,6,1.8); ctx.fillStyle=P('#3a2a18'); ctx.fillRect(-0.9,1.4,1.8,3);
  ctx.restore();
  // head: face + kettle helm with a stance-coloured band
  const hy = by-21;
  ctx.fillStyle=P('#d9b48c'); ctx.beginPath(); ctx.arc(0,hy+1,5.2,0,7); ctx.fill(); ctx.strokeStyle='#4a3220'; ctx.lineWidth=0.8; ctx.stroke();
  if(!flash){ ctx.fillStyle='#2a1e16'; ctx.beginPath(); ctx.arc(-2,hy+1.2,0.8,0,7); ctx.arc(2,hy+1.2,0.8,0,7); ctx.fill(); }
  const hgd = ctx.createLinearGradient(-6,hy-6,6,hy); hgd.addColorStop(0,'#d4dae6'); hgd.addColorStop(1,'#6a7488');
  ctx.fillStyle = flash ? '#ffffff' : hgd; ctx.beginPath(); ctx.arc(0,hy-0.8,5.8,Math.PI,0); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#2c3340'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle=P('#9aa4b8'); ctx.beginPath(); ctx.ellipse(0,hy-0.6,8,1.9,0,0,7); ctx.fill(); ctx.stroke();    // wide kettle brim
  ctx.fillStyle=P(stance); ctx.fillRect(-5.6,hy-2.6,11.2,1.3);
  ctx.restore();
  if(f.taunting){ ctx.save(); ctx.fillStyle='#ffd23a'; ctx.font='bold 13px Alegreya,Georgia, serif'; ctx.textAlign='center'; ctx.fillText('!', iso.x, iso.y-52*s); ctx.restore(); }
  drawHpBar(iso, 46*s, f.r, f.hp, f.maxHp);
}
// v382: shared art for the standing demons (summoned demon, imps, the purple archer demon): digitigrade legs with cloven hooves, a lashing
// spade tail, a muscular chest cracked with ember light, spiked pauldrons, clawed hands, swept horns, fangs and glowing eyes.
const FLOAT_DEMON_PAL = {
  summon:{ light:'#d9505e', mid:'#a02636', dark:'#2e0810', horn:'#d8c9a8', hornDk:'#6a5a44', eye:'#ffd24a', glow:'255,90,40', cloth:'#3a1218', bone:'#d8c9a8' },
  imp:   { light:'#e8744a', mid:'#b8341e', dark:'#3a0806', horn:'#3a1208', hornDk:'#1a0806', eye:'#ffe066', glow:'255,130,40', cloth:'#4a1a10', bone:'#d8c098' },
  archer:{ light:'#a98ae8', mid:'#6a4aa0', dark:'#1d1238', horn:'#2a1a44', hornDk:'#120a24', eye:'#9ad6ff', glow:'150,110,255', cloth:'#2a1c48', bone:'#cfc4e8' }
};
function drawFloatDemon(iso, s, face, t, kind, o){
  o = o || {}; const P = FLOAT_DEMON_PAL[kind] || FLOAT_DEMON_PAL.summon, fl = !!o.flash, atk = !!o.atk, moving = !!o.moving;
  const C = (c)=> fl ? '#ffffff' : c, flick = 0.82 + 0.18*Math.sin(t*10 + 1.3);
  const ph = moving ? t*10 : 0, walk = moving ? Math.sin(ph) : 0, bob = moving ? Math.abs(Math.sin(ph))*1.6 : Math.sin(t*2.2)*0.7;
  drawShadow(iso.x, iso.y, 11*s, 4.2*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const ol = fl ? '#fff' : P.dark;
  // lashing tail with a spade tip (behind everything)
  { const sw = Math.sin(t*3.4)*5 + (moving ? Math.sin(ph*0.5)*3 : 0), x0 = -4, y0 = -15 - bob;
    ctx.strokeStyle = C(P.mid); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.bezierCurveTo(x0-12,y0+4,x0-16+sw*0.5,y0-8,x0-20+sw,y0-20-sw*0.4); ctx.stroke();
    ctx.strokeStyle = C(P.dark); ctx.lineWidth = 1; ctx.stroke();
    const tx = x0-20+sw, ty = y0-20-sw*0.4; ctx.fillStyle = C(P.light); ctx.strokeStyle = ol; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(tx,ty-5); ctx.lineTo(tx+4,ty+1); ctx.lineTo(tx,ty+0.5); ctx.lineTo(tx-4,ty+2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // legs: thigh forward, shin back, cloven hoof
  for(const sd of [-1,1]){
    const sw = walk*sd*3.4, hx = sd*4.2, hipY = -17 - bob, kx = hx + 4.2 + sw*0.5, ky = -9.5 - bob*0.5, ax = hx + 1 + sw, ay = -3 + Math.max(0, -sw)*0.4;
    ctx.strokeStyle = C(P.mid); ctx.lineWidth = 4.4; ctx.beginPath(); ctx.moveTo(hx,hipY); ctx.lineTo(kx,ky); ctx.stroke();
    ctx.lineWidth = 3.2; ctx.beginPath(); ctx.moveTo(kx,ky); ctx.lineTo(ax,ay); ctx.stroke();
    ctx.strokeStyle = ol; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx+2,hipY); ctx.lineTo(kx+2,ky); ctx.lineTo(ax+1.6,ay); ctx.stroke();
    ctx.fillStyle = C(P.dark); ctx.beginPath(); ctx.moveTo(ax-2.2,ay); ctx.lineTo(ax+3.4,ay); ctx.lineTo(ax+4.2,0.2); ctx.lineTo(ax+1.4,0.2); ctx.lineTo(ax+0.8,-0.6); ctx.lineTo(ax-1.6,0.2); ctx.lineTo(ax-2.6,0.2); ctx.closePath(); ctx.fill();
  }
  // torn cloth at the hips with a bone buckle
  ctx.fillStyle = C(P.cloth); ctx.strokeStyle = ol; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-6.4,-18-bob); ctx.lineTo(6.4,-18-bob); ctx.lineTo(7,-10-bob); ctx.lineTo(4,-12-bob); ctx.lineTo(1,-8.5-bob); ctx.lineTo(-2.2,-12-bob); ctx.lineTo(-6.8,-9.5-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  if(!fl){ ctx.fillStyle = P.bone; ctx.beginPath(); ctx.ellipse(0,-17.4-bob,1.9,1.3,0,0,7); ctx.fill(); }
  // torso: broad shoulders tapering to the waist
  let g = ctx.createLinearGradient(-9,-31-bob,9,-16-bob); g.addColorStop(0,P.light); g.addColorStop(1,P.dark);
  ctx.fillStyle = fl ? '#fff' : g; ctx.strokeStyle = ol; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-9.2,-29-bob); ctx.quadraticCurveTo(-10,-23-bob,-5.6,-16.5-bob); ctx.lineTo(5.6,-16.5-bob); ctx.quadraticCurveTo(10,-23-bob,9.2,-29-bob); ctx.quadraticCurveTo(0,-33-bob,-9.2,-29-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  if(!fl){
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0,-29-bob); ctx.lineTo(0,-17-bob); ctx.moveTo(-4.6,-26-bob); ctx.quadraticCurveTo(-1.6,-25-bob,-1,-22-bob); ctx.moveTo(4.6,-26-bob); ctx.quadraticCurveTo(1.6,-25-bob,1,-22-bob); ctx.moveTo(-3.8,-21-bob); ctx.lineTo(-1,-20-bob); ctx.moveTo(3.8,-21-bob); ctx.lineTo(1,-20-bob); ctx.stroke();
    // ember cracks across the chest
    ctx.strokeStyle = 'rgba('+P.glow+','+(0.95*flick)+')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1,-29-bob); ctx.lineTo(-3,-25.5-bob); ctx.lineTo(-1,-23-bob); ctx.lineTo(-2.4,-19.5-bob); ctx.moveTo(1.4,-27-bob); ctx.lineTo(3.4,-24-bob); ctx.lineTo(1.6,-21.5-bob); ctx.stroke();
    g = ctx.createRadialGradient(0,-23-bob,0.5,0,-23-bob,8); g.addColorStop(0,'rgba('+P.glow+','+(0.45*flick)+')'); g.addColorStop(1,'rgba('+P.glow+',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,-23-bob,8,0,7); ctx.fill();
  }
  // spiked pauldrons
  for(const sd of [-1,1]){ ctx.fillStyle = C(P.mid); ctx.strokeStyle = ol; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.ellipse(sd*9.6,-28.5-bob,3.8,3,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C(P.horn); ctx.beginPath(); ctx.moveTo(sd*8.6,-30.6-bob); ctx.lineTo(sd*10.2,-36-bob); ctx.lineTo(sd*11.6,-30.4-bob); ctx.closePath(); ctx.fill(); ctx.strokeStyle = fl?'#fff':P.hornDk; ctx.stroke(); }
  // arms (the right one reaches out when it strikes) with three claws each
  for(const sd of [-1,1]){
    const strike = (atk && sd===1), sh = {x:sd*9.4, y:-27-bob};
    const el = strike ? {x:sd*13.5,y:-24-bob} : {x:sd*12.4,y:-21-bob+Math.sin(t*2.3+sd)*0.6+walk*sd*-0.8};
    const hd = strike ? {x:sd*21,y:-23.5-bob} : {x:sd*11.6,y:-14.2-bob+Math.sin(t*2.3+sd)*0.7+walk*sd*-1.2};
    ctx.strokeStyle = C(P.mid); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(sh.x,sh.y); ctx.lineTo(el.x,el.y); ctx.lineTo(hd.x,hd.y); ctx.stroke();
    ctx.strokeStyle = ol; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(sh.x+sd*1.8,sh.y); ctx.lineTo(el.x+sd*1.8,el.y); ctx.lineTo(hd.x+sd*1.6,hd.y); ctx.stroke();
    ctx.strokeStyle = C(P.bone); ctx.lineWidth = 1.1; const dx = strike ? sd*4.4 : sd*1.2, dy = strike ? 0 : 4.2;
    ctx.beginPath(); ctx.moveTo(hd.x,hd.y); ctx.lineTo(hd.x+dx-(strike?0:1.6),hd.y+dy-(strike?2.4:0)); ctx.moveTo(hd.x,hd.y); ctx.lineTo(hd.x+dx,hd.y+dy); ctx.moveTo(hd.x,hd.y); ctx.lineTo(hd.x+dx+(strike?0:1.6),hd.y+dy+(strike?2.4:0)); ctx.stroke();
    if(o.bow && sd===-1){ ctx.strokeStyle = C(P.bone); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(hd.x-2,hd.y-5,9,-1.35,1.35); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(hd.x-2+9*Math.cos(-1.35),hd.y-5+9*Math.sin(-1.35)); ctx.lineTo(hd.x-2+9*Math.cos(1.35),hd.y-5+9*Math.sin(1.35)); ctx.stroke(); }
  }
  // head
  const hy0 = -37.5-bob;
  for(const sd of [-1,1]){ ctx.fillStyle = C(P.mid); ctx.strokeStyle = ol; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(sd*5.2,hy0-0.5); ctx.lineTo(sd*12,hy0-3.6); ctx.lineTo(sd*5.8,hy0+3.2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  g = ctx.createRadialGradient(-2,hy0-2,1,0,hy0,8.5); g.addColorStop(0,P.light); g.addColorStop(1,P.mid);
  ctx.fillStyle = fl ? '#fff' : g; ctx.strokeStyle = ol; ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(-5.6,hy0-3); ctx.quadraticCurveTo(-6.4,hy0+4,-3,hy0+7); ctx.lineTo(3,hy0+7); ctx.quadraticCurveTo(6.4,hy0+4,5.6,hy0-3); ctx.quadraticCurveTo(0,hy0-8,-5.6,hy0-3); ctx.closePath(); ctx.fill(); ctx.stroke();
  for(const sd of [-1,1]){ ctx.fillStyle = C(P.horn); ctx.strokeStyle = fl?'#fff':P.hornDk; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(sd*2.6,hy0-5.4); ctx.quadraticCurveTo(sd*10.6,hy0-8.6,sd*10.2,hy0-19); ctx.quadraticCurveTo(sd*6.6,hy0-11,sd*0.9,hy0-6.4); ctx.closePath(); ctx.fill(); ctx.stroke();
    if(!fl){ ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(sd*5.2,hy0-8.2); ctx.lineTo(sd*4.4,hy0-6.9); ctx.moveTo(sd*7.4,hy0-11.2); ctx.lineTo(sd*6.2,hy0-9.8); ctx.stroke(); } }
  if(!fl){
    ctx.strokeStyle = P.dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-5.4,hy0-3.2); ctx.lineTo(-1,hy0-1.2); ctx.moveTo(5.4,hy0-3.2); ctx.lineTo(1,hy0-1.2); ctx.stroke();
    for(const sd of [-1,1]){ ctx.fillStyle = 'rgba('+P.glow+',0.5)'; ctx.beginPath(); ctx.arc(sd*2.8,hy0-0.4,3.2,0,7); ctx.fill(); ctx.fillStyle = P.eye; ctx.beginPath(); ctx.ellipse(sd*2.8,hy0-0.4,1.8,1.1,sd*-0.4,0,7); ctx.fill(); }
    ctx.fillStyle = '#1a0408'; ctx.beginPath(); ctx.moveTo(-3.6,hy0+3.2); ctx.quadraticCurveTo(0,hy0+(atk?9:6),3.6,hy0+3.2); ctx.quadraticCurveTo(0,hy0+4.2,-3.6,hy0+3.2); ctx.fill();
    ctx.fillStyle = '#f4ecd8'; ctx.beginPath(); ctx.moveTo(-3,hy0+3.5); ctx.lineTo(-2,hy0+6); ctx.lineTo(-1,hy0+3.8); ctx.moveTo(3,hy0+3.5); ctx.lineTo(2,hy0+6); ctx.lineTo(1,hy0+3.8); ctx.fill();
    ctx.strokeStyle = P.dark; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-1.2,hy0+2); ctx.lineTo(-0.5,hy0+0.6); ctx.moveTo(1.2,hy0+2); ctx.lineTo(0.5,hy0+0.6); ctx.stroke();
  }
  ctx.restore();
}
function drawFollowerIso(f){
  if(game && (game.scene==='town' || game.scene==='tavern') && (f.kind||'knight')!=='knight' && f.kind!=='cat') return;   // v402: only Squires (and the cat) show in town
  if(!f._stDraw && (f.chillT>0 || f.poisonT>0 || f.burnT>0) && _statusDepth===0){ f._stDraw = true; try{ drawWithStatus(f, ()=>drawFollowerIso(f), true); } finally { f._stDraw = false; } return; }
  if(f.kind==='skeleton'){ drawFriendlySkeleton(f); return; }
  if((f.leapZ||0)>0 || f.shieldHp>0){
    const fi = toIso(f.x,f.y);
    if(f.shieldHp>0 && !f._shDraw){
      f._shDraw = true;
      try{ drawFollowerIso(f); }finally{ f._shDraw = false; }
      ctx.save(); ctx.strokeStyle='rgba(150,235,120,0.75)'; ctx.fillStyle='rgba(150,235,120,0.12)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.ellipse(fi.x, fi.y-f.r*1.1-(f.leapZ||0), f.r*1.5, f.r*1.9, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      return;
    }
    if((f.leapZ||0)>0 && !f._lpDraw){
      f._lpDraw = true;
      drawShadow(fi.x, fi.y, 14, 6);
      ctx.save(); ctx.translate(0, -f.leapZ);
      try{ drawFollowerIso(f); }finally{ f._lpDraw = false; }
      ctx.restore();
      return;
    }
  }
  // Animal Companions share the exact same art as their real Forest
  // counterparts -- just draw the follower object straight through the
  // wolf/bear rig, which only reads x/y/r/faceSign/animT/moving/hitT/hp/maxHp.
  if(f.kind==='wolf'){ drawWolfIso(f); return; }
  if(f.kind==='bear'){ drawBearIso(f); return; }
  // Cat Companion (v81): its own small quadruped rig -- same profile-and-
  // flip technique as Wolf/Boar (see drawWolfIso) rather than the
  // humanoid rig below, since a cat needs a distinct non-humanoid
  // silhouette; drawn small and orange/cream rather than reusing a real
  // enemy's art (there's no wild "cat" monster to share with).
  if(f.kind==='cat'){ drawCatIso(f); return; }
  // Necromancer minions (v78): reuse this exact same generic humanoid rig
  // (legs/torso/head silhouette) rather than building 2 brand-new sprite
  // rigs from scratch -- just a bone-white palette (no shield, a small
  // claw instead of a sword) for the skeleton, and a dark red/horned
  // palette for the demon. Judgment call: cheaper and visually consistent
  // with how every other follower kind already shares art (Wolf/Bear
  // literally reuse their wild-monster rig verbatim), given neither
  // minion needed a mechanically distinct silhouette.
  if(f.kind!=='demon'){ drawSquireIso(f); return; }
  { const _iso = toIso(f.x,f.y); drawBoundDemonIso(_iso, f.r/14.5, f.faceSign||1, f.animT||0, {flash:f.hitT>0, moving:f.moving, atk:(f.animT||0)<0.25 && f.atkCd>0});   // v489: the bound demon has its own heavier body
    if(f.taunting){ ctx.save(); ctx.fillStyle = '#ffd23a'; ctx.font = 'bold 13px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('!', _iso.x, _iso.y - 58*(f.r/14.5)); ctx.restore(); }
    drawHpBar(_iso, 52*(f.r/14.5), f.r, f.hp, f.maxHp); return; }
  const isSkeleton = f.kind==='skeleton', isDemon = f.kind==='demon';
  const iso = toIso(f.x,f.y);
  const s = f.r/16, face = f.faceSign||1, t = f.animT||0;
  const moving = f.moving, flash = f.hitT>0;
  const stanceColor = isSkeleton ? '#c9bfa8' : isDemon ? '#b4293f' : ({attack:'#e2703a', guard:'#5b8cff'}[f.stance] || '#c9bfa8');
  const darkColor = '#241c14';

  drawShadow(iso.x, iso.y, 15*s, 7*s);

  ctx.save();
  ctx.translate(iso.x, iso.y);
  ctx.scale(face*s, s);

  const cyc = 10;
  const walk = moving ? Math.sin(t*cyc) : 0;
  const bob = moving ? Math.abs(Math.sin(t*cyc))*2 : Math.sin(t*2.2)*0.6;
  const legLen = 13, torsoW=13, torsoH=16, headR=6.5;
  const legSwing = walk*5;
  const baseY = -legLen + bob;

  // legs
  ctx.fillStyle = isSkeleton ? '#d8cdb8' : isDemon ? '#3a0c10' : darkColor;
  roundRect(-torsoW*0.28-2.5, baseY-legLen-legSwing*0.1, 5, legLen+legSwing*0.1, 2); ctx.fill();
  roundRect(torsoW*0.28-2.5, baseY-legLen+legSwing*0.1, 5, legLen-legSwing*0.1, 2); ctx.fill();

  // torso
  let torsoFill;
  if(flash){ torsoFill = '#ffffff'; }
  else if(isSkeleton){
    const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY);
    tg.addColorStop(0, '#eee6d2'); tg.addColorStop(1, '#a89a78');
    torsoFill = tg;
  } else if(isDemon){
    const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY);
    tg.addColorStop(0, '#c8384a'); tg.addColorStop(1, '#5a0c14');
    torsoFill = tg;
  } else {
    const tg = ctx.createLinearGradient(-torsoW/2, baseY-torsoH, torsoW/2, baseY);
    tg.addColorStop(0, '#cdd0d6'); tg.addColorStop(1, '#5a5f68');
    torsoFill = tg;
  }
  ctx.fillStyle = torsoFill;
  roundRect(-torsoW/2, baseY-torsoH, torsoW, torsoH, torsoW*0.3); ctx.fill();
  ctx.strokeStyle = stanceColor; ctx.lineWidth = 1.6; ctx.stroke();

  if(isSkeleton){
    // bare bone claw instead of a shield/sword
    ctx.strokeStyle = '#eee6d2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(torsoW/2+2, baseY-torsoH*0.6); ctx.lineTo(torsoW/2+8, baseY-torsoH*1.05); ctx.stroke();
  } else if(isDemon){
    // small pair of horns instead of a shield/sword
    ctx.strokeStyle = '#241c14'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4,baseY-torsoH-headR*0.4); ctx.lineTo(-7,baseY-torsoH-headR*1.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4,baseY-torsoH-headR*0.4); ctx.lineTo(7,baseY-torsoH-headR*1.4); ctx.stroke();
  } else {
    // shield (off-hand)
    ctx.fillStyle = '#7a6a44';
    ctx.beginPath(); ctx.ellipse(-torsoW/2-4, baseY-torsoH*0.55, 4.5, 7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 1; ctx.stroke();
    // sword (main hand)
    ctx.strokeStyle = '#d8d8de'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(torsoW/2+2, baseY-torsoH*0.6); ctx.lineTo(torsoW/2+9, baseY-torsoH*1.15); ctx.stroke();
  }

  // head
  const headY = baseY-torsoH-headR*0.55;
  ctx.fillStyle = flash ? '#ffffff' : isSkeleton ? '#eee6d2' : isDemon ? '#7a1420' : '#c9a479';
  ctx.beginPath(); ctx.arc(0, headY, headR, 0, 7); ctx.fill();
  ctx.strokeStyle = darkColor; ctx.lineWidth = 1; ctx.stroke();
  if(isSkeleton){
    // small dark eye sockets
    ctx.fillStyle = '#0a0806';
    ctx.beginPath(); ctx.arc(-2.2, headY-0.5, 1.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(2.2, headY-0.5, 1.4, 0, 7); ctx.fill();
  } else if(isDemon && !flash){
    // glowing eyes
    ctx.fillStyle = '#ffd23a';
    ctx.beginPath(); ctx.arc(-2.2, headY-0.5, 1.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(2.2, headY-0.5, 1.4, 0, 7); ctx.fill();
  }

  ctx.restore();

  if(f.taunting){
    ctx.save();
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 13px Cinzel, Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', iso.x, iso.y - (legLen+torsoH+headR*2+8)*s);
    ctx.restore();
  }

  drawHpBar(iso, (legLen+torsoH+headR*2+6)*s, f.r, f.hp, f.maxHp);
}

// Ice Armor (Mystic): a pulsing frosty-blue shell + orbiting ice shards around
// the hero while the buff is active; flickers faster as it is about to expire.
function drawIceArmorAura(p, iso, s){
  const t = p.animT||0;
  const frac = (p.iceArmorHp||0)/Math.max(1,p.iceArmorMax||1);
  const fade = frac<0.25 ? (0.5+0.5*Math.sin(t*22)) : 1;
  ctx.save();
  ctx.globalAlpha = (0.5 + Math.sin(t*4)*0.1) * fade;
  const gr = ctx.createRadialGradient(iso.x, iso.y-20, 4*s, iso.x, iso.y-20, 30*s);
  gr.addColorStop(0,'rgba(140,210,255,0.05)');
  gr.addColorStop(0.7,'rgba(110,190,255,0.28)');
  gr.addColorStop(1,'rgba(160,225,255,0.55)');
  ctx.fillStyle = gr;
  ctx.shadowColor = '#7ad0ff'; ctx.shadowBlur = 14;
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y-20, 22*s, 30*s, 0, 0, 7); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#bfeaff';
  ctx.stroke();
  ctx.shadowBlur = 6; ctx.fillStyle = '#e6f8ff';
  for(let i=0;i<4;i++){
    const a = t*2.2 + i*Math.PI/2;
    const sx = iso.x + Math.cos(a)*24*s, sy = iso.y-20 + Math.sin(a)*32*s;
    ctx.beginPath(); ctx.moveTo(sx, sy-5*s); ctx.lineTo(sx+3*s, sy); ctx.lineTo(sx, sy+5*s); ctx.lineTo(sx-3*s, sy); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// v191 Unbreakable: golden shield dome + rotating rune ring + a timer arc that drains as the buff runs out.
function drawUnbreakableAura(p, iso, s){
  const tt = (game&&game.clock)||0, durMax = unbreakDur(p.unbreakRank||1);
  const frac = clamp(p.unbreakT/durMax, 0, 1);
  const fade = Math.min(1, p.unbreakT/0.6) * (p.unbreakT<1.2 ? (0.6+0.4*Math.sin(tt*24)) : 1);   // flickers when about to expire
  ctx.save();
  ctx.globalAlpha = fade;
  // ground ring
  ctx.strokeStyle = 'rgba(240,208,120,0.9)'; ctx.lineWidth = 3; ctx.shadowColor = '#f0d078'; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y+2, 34*s*1.0, 34*s*0.5, 0, 0, 7); ctx.stroke();
  // timer arc
  ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y+2, 40*s, 40*s*0.5, 0, -Math.PI/2, -Math.PI/2 + Math.PI*2*frac); ctx.stroke();
  // dome
  const gr = ctx.createRadialGradient(iso.x, iso.y-22*s, 4*s, iso.x, iso.y-22*s, 40*s);
  gr.addColorStop(0,'rgba(255,236,160,0.02)'); gr.addColorStop(0.8,'rgba(255,214,110,0.16)'); gr.addColorStop(1,'rgba(255,214,110,0.42)');
  ctx.fillStyle = gr; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.ellipse(iso.x, iso.y-22*s, 30*s, 38*s, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,225,140,'+(0.55+0.25*Math.sin(tt*6))+')'; ctx.lineWidth = 2;
  ctx.stroke();
  // orbiting rune sparks
  ctx.fillStyle = '#fff3c4';
  for(let i=0;i<4;i++){ const a = tt*2.2 + i*Math.PI/2; ctx.beginPath(); ctx.arc(iso.x+Math.cos(a)*34*s, iso.y-20*s+Math.sin(a)*17*s, 2.4, 0, 7); ctx.fill(); }
  ctx.restore();
}
// v193 Whirlwind: the warrior holds the sword straight out to the side (90 deg from the body) and spins it
// around the ground plane, Diablo-2 barbarian style. Half the sweep is drawn behind the body, half in front.
function drawWhirlBlade(p, iso, s, mh, front){
  const tt = (game&&game.clock)||0, th0 = (p.whirlAng!=null ? p.whirlAng : tt*24);
  const reach = (WHIRLWIND_REACH + (p.weaponReachBonus||0)) * aoeRadiusMult(p);
  const L = reach*1.0, big = !!(mh && mh.twoHanded), dual = !!(p.equipment && p.equipment.offhand && p.equipment.offhand.slotType==='weapon1h');
  const H = 32*s;   // shoulder height of the blade above the ground
  const base = {x:iso.x, y:iso.y-H};
  const pt = (a, r)=>{ const q = toIso(p.x+Math.cos(a)*r, p.y+Math.sin(a)*r); return {x:q.x, y:q.y-H}; };
  const isFront = (a)=> (Math.cos(a)+Math.sin(a)) >= 0;
  ctx.save(); ctx.lineCap = 'round';
  const blades = dual ? [th0, th0+Math.PI] : [th0];
  for(const th of blades){
    // motion trail behind the blade
    for(let k=0;k<14;k++){
      const a0 = th - k*0.11, a1 = th - (k+1)*0.11;
      if(isFront((a0+a1)/2) !== front) continue;
      const p0 = pt(a0, L), p1 = pt(a1, L);
      ctx.strokeStyle = 'rgba(255,240,215,'+(0.55*(1-k/14))+')'; ctx.lineWidth = (big?13:10)*s*(1-k/22);
      ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.stroke();
    }
    if(isFront(th) !== front) continue;
    const hand = pt(th, 11*s), tip = pt(th, L);
    ctx.strokeStyle = '#5b6575'; ctx.lineWidth = 5*s;           // outstretched arm
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(hand.x, hand.y); ctx.stroke();
    ctx.strokeStyle = '#2a2620'; ctx.lineWidth = (big?7:5.4)*s;  // blade outline
    ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = '#eef1f6'; ctx.lineWidth = (big?4.6:3.2)*s; // blade
    ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    const gd0 = pt(th+Math.PI/2, 4*s), gd1 = pt(th-Math.PI/2, 4*s);   // crossguard
    const gdx = gd0.x - base.x, gdy = gd0.y - base.y;
    ctx.strokeStyle = '#a8863a'; ctx.lineWidth = 2.6*s;
    ctx.beginPath(); ctx.moveTo(hand.x+gdx*1.2, hand.y+gdy*1.2); ctx.lineTo(hand.x-gdx*1.2, hand.y-gdy*1.2); ctx.stroke();
  }
  ctx.restore();
}
// v199 Cleave: a normal-length sword swung level across the waist through the front arc, with a red sweep
// sector on the ground plane showing the swing's direction and reach. (front=false draws the sector + rear half.)
function drawCleaveSwing(p, iso, s, mh, front){
  const dur = p.cleaveMax||0.34, f = clamp(1 - p.cleaveT/dur, 0, 1), e = 1-Math.pow(1-Math.min(1,f*1.3),3);   // fast start, settles
  const half = CLEAVE_HALF_ANGLE, a0 = (p.cleaveAng||0) - half, th = a0 + 2*half*e;
  const H = 24*s, R = (p.cleaveReach||77) + 14, L = 46;   // L = ordinary sword length in world units
  const fade = f>0.65 ? 1-(f-0.65)/0.35 : 1;
  const pt = (a, r)=>{ const q = toIso(p.x+Math.cos(a)*r, p.y+Math.sin(a)*r); return {x:q.x, y:q.y-H}; };
  const isFront = (a)=> (Math.cos(a)+Math.sin(a)) >= 0;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if(!front){
    // simple red crescent trailing behind the swinging blade (Path of Exile style slash), fading with age
    const N = 14, r0 = R*0.5;
    ctx.globalAlpha = fade;
    for(let k=0;k<N;k++){
      const aa = a0+(th-a0)*k/N, ab = a0+(th-a0)*(k+1)/N, age = (k+1)/N;
      const o0 = pt(aa,R), o1 = pt(ab,R), i0 = pt(aa,r0+(R-r0)*(0.55*(1-age))), i1 = pt(ab,r0+(R-r0)*(0.55*(1-(k+2)/N)));
      ctx.fillStyle = 'rgba(225,45,40,'+(0.10+0.5*age*age)+')';
      ctx.beginPath(); ctx.moveTo(i0.x,i0.y); ctx.lineTo(o0.x,o0.y); ctx.lineTo(o1.x,o1.y); ctx.lineTo(i1.x,i1.y); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
