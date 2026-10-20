// ---------------- Black Marsh art (v144) ----------------
function drawBlackMarshFloor(room, cam){
  const TS = 46, clk = (game&&game.clock)||0;
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      if(wx<0||wy<0||wx>room.w||wy>room.h){ const ef = edgeFill(room, wx, wy); if(ef){ if(FLOOR_PASS!==2){ ctx.fillStyle = ef; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); } continue; } }
      const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS);
      const checker = ((ix+iy)%2+2)%2, hh = tileHash(ix,iy);
      let fill, pad = false;
      if(room.arrow && !bmOpenAt(wx, wy, -30)){
        if(FLOOR_PASS===2) continue;
        ctx.fillStyle = hh > 0.85 ? '#0e1510' : (checker ? '#141e14' : '#111a11'); drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hh > 0.93){ ctx.fillStyle = 'rgba(40,60,44,0.6)'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y, 12, 5, 0, 0, 7); ctx.fill(); }
        continue;
      }
      if(bmOnPlank(wx,wy)){
        if(FLOOR_PASS===2) continue;
        fill = ((Math.floor(wy/23))%2) ? '#8c6c44' : '#7a5c38';
      } else if(bmWaterAt(room,wx,wy)){
        if(FLOOR_PASS===1) continue;
        const shim = (Math.floor((wx+wy)/TS*0.5 + clk*0.9) % 2 + 2) % 2;
        fill = (checker^shim) ? '#2c4a3c' : '#264236';
        pad = hh > 0.9;
      } else if(FLOOR_PASS===2){
        continue;
      } else if(bmTrailDist(wx,wy) < BM_TRAIL_HALFW){
        fill = checker ? '#5a4a30' : '#514228';
      } else {
        const nearW = bmWaterAt(room,wx+TS,wy)||bmWaterAt(room,wx-TS,wy)||bmWaterAt(room,wx,wy+TS)||bmWaterAt(room,wx,wy-TS);
        if(nearW) fill = checker ? '#2c3a22' : '#26321c';                // wet mud by the banks
        else if(hh > 0.88) fill = '#1f2a1c';                              // dark bog patch
        else fill = checker ? '#3a4a2a' : '#334226';                      // mossy marsh ground
      }
      ctx.fillStyle = fill;
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
      if(pad){
        ctx.fillStyle = '#4c7a3a';
        ctx.beginPath(); ctx.ellipse(iso.x+(hh-0.95)*90, iso.y, 7, 3.2, 0, 0, 7); ctx.fill();
      }
    }
  }
}
function drawSwampTreeIso(t){
  const iso = toIso(t.x,t.y), s = t.s||1, tm = (game&&game.clock)||0;
  drawShadow(iso.x, iso.y, 20*s, 8*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  ctx.fillStyle='#2e2618';
  ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(-3,-22); ctx.lineTo(-6,-46); ctx.lineTo(3,-46); ctx.lineTo(2,-22); ctx.lineTo(8,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#14100a'; ctx.lineWidth=1; ctx.stroke();
  // heavy, drooping canopy
  const blobs = [[-14,-52,15,9],[10,-56,17,10],[0,-66,15,9],[-4,-46,20,8]];
  for(const b of blobs){
    ctx.fillStyle='#24401f'; ctx.beginPath(); ctx.ellipse(b[0],b[1],b[2],b[3],0,0,7); ctx.fill();
    ctx.fillStyle='rgba(90,130,60,0.25)'; ctx.beginPath(); ctx.ellipse(b[0]-3,b[1]-2,b[2]*0.6,b[3]*0.5,0,0,7); ctx.fill();
  }
  // hanging moss
  ctx.strokeStyle='#5f7a44'; ctx.lineWidth=1.6; ctx.lineCap='round';
  for(let i=0;i<7;i++){
    const mx = -20+i*7, sw = Math.sin(tm*1.1+i+t.x*0.01)*1.6;
    ctx.beginPath(); ctx.moveTo(mx,-46); ctx.quadraticCurveTo(mx+sw,-38,mx+sw*1.5,-30-(i%3)*4); ctx.stroke();
  }
  ctx.restore();
}
function drawReedsIso(r){
  const iso = toIso(r.x,r.y), s = r.s||1, tm=(game&&game.clock)||0;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  ctx.lineCap='round';
  for(let i=0;i<5;i++){
    const bx = -8+i*4, sw = Math.sin(tm*1.4+i*1.3+r.x*0.02)*1.8, hgt = 20+((i*7)%9);
    ctx.strokeStyle = i%2 ? '#6a8a3e' : '#557530'; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(bx,0); ctx.quadraticCurveTo(bx+sw,-hgt*0.6,bx+sw*1.6,-hgt); ctx.stroke();
    if(i===1||i===3){ ctx.strokeStyle='#5a3a20'; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(bx+sw*1.5,-hgt+1); ctx.lineTo(bx+sw*1.6,-hgt-6); ctx.stroke(); }
  }
  ctx.restore();
}
// The witch's hut: timber walls, a crooked witch-hat roof, a green-lit window and a chimney trailing smoke.
function drawWitchHouseIso(h){
  const tm = (game&&game.clock)||0;
  const R = {x:h.x-75, y:h.y-52, w:150, h:104};
  const c0=toIso(R.x,R.y), c1=toIso(R.x+R.w,R.y), c2=toIso(R.x+R.w,R.y+R.h), c3=toIso(R.x,R.y+R.h);
  drawShadow((c0.x+c2.x)/2, (c0.y+c2.y)/2+6, 100, 34);
  const hz = 44;
  drawBlock(R, hz, '#3a2c20', '#2a2016', '#4a3826');
  // door + window on the two visible faces
  const lerp = (a,b,u)=>({x:a.x+(b.x-a.x)*u, y:a.y+(b.y-a.y)*u});
  const face = (a,b,u0,u1,h0,h1,fill,stroke)=>{
    const p0=lerp(a,b,u0), p1=lerp(a,b,u1);
    ctx.fillStyle=fill; ctx.beginPath();
    ctx.moveTo(p0.x,p0.y-h0); ctx.lineTo(p1.x,p1.y-h0); ctx.lineTo(p1.x,p1.y-h1); ctx.lineTo(p0.x,p0.y-h1); ctx.closePath(); ctx.fill();
    if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1.2; ctx.stroke(); }
  };
  face(c3,c2,0.44,0.62,0,28,'#1a120c','#0c0806');           // door
  face(c3,c2,0.5,0.53,12,14,'#c9a45a',null);
  const glow = 0.65+0.25*Math.sin(tm*2.3);
  face(c3,c2,0.14,0.30,16,32,'rgba(150,255,110,'+glow+')','#0c0806'); // front window
  face(c1,c2,0.30,0.55,16,32,'rgba(150,255,110,'+glow+')','#0c0806'); // side window
  // crooked witch-hat roof (pyramid, apex leaning off-centre)
  const ov = 14, top = hz, apexH = hz+64;
  const q0=toIso(R.x-ov,R.y-ov), q1=toIso(R.x+R.w+ov,R.y-ov), q2=toIso(R.x+R.w+ov,R.y+R.h+ov), q3=toIso(R.x-ov,R.y+R.h+ov);
  const ap = toIso(h.x+10, h.y-6);
  ctx.fillStyle='#2a1a3e';
  ctx.beginPath(); ctx.moveTo(q2.x,q2.y-top); ctx.lineTo(q3.x,q3.y-top); ctx.lineTo(ap.x,ap.y-apexH); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#1c1230';
  ctx.beginPath(); ctx.moveTo(q1.x,q1.y-top); ctx.lineTo(q2.x,q2.y-top); ctx.lineTo(ap.x,ap.y-apexH); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1; ctx.stroke();
  // roof band + a bent tip
  ctx.strokeStyle='#5a3a78'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(q3.x,q3.y-top); ctx.lineTo(q2.x,q2.y-top); ctx.lineTo(q1.x,q1.y-top); ctx.stroke();
  ctx.fillStyle='#1c1230'; ctx.beginPath(); ctx.moveTo(ap.x-4,ap.y-apexH+8); ctx.quadraticCurveTo(ap.x+2,ap.y-apexH-6,ap.x+13,ap.y-apexH-6); ctx.lineTo(ap.x+2,ap.y-apexH+4); ctx.closePath(); ctx.fill();
  // chimney + smoke
  const ch = toIso(h.x-40, h.y+8);
  ctx.fillStyle='#4a4238'; ctx.fillRect(ch.x-5, ch.y-top-46, 10, 26);
  ctx.strokeStyle='#1a1610'; ctx.lineWidth=1; ctx.strokeRect(ch.x-5, ch.y-top-46, 10, 26);
  for(let i=0;i<5;i++){
    const ph = ((tm*0.45+i*0.2)%1);
    ctx.fillStyle='rgba(140,220,120,'+(0.32*(1-ph))+')';
    ctx.beginPath(); ctx.arc(ch.x+Math.sin(ph*5+i)*7+ph*10, ch.y-top-52-ph*46, 5+ph*8, 0, 7); ctx.fill();
  }
}
function drawWitchIso(npc, clock, showIndicator){
  const iso = toIso(npc.x, npc.y), t = clock||0, bob = Math.sin(t*2.2)*1;
  drawShadow(iso.x, iso.y, 13, 6);
  const caged = !!npc.caged;
  const cageBars = (front)=>{
    ctx.save(); ctx.strokeStyle = '#5a5f66'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    const R = 21, ry = 10, H = 66;
    for(let i=0;i<10;i++){ const a = i/10*Math.PI*2, sy = Math.sin(a); if((sy>0)!==front) continue;
      const bx = iso.x+Math.cos(a)*R, by = iso.y+sy*ry; ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx,by-H); ctx.stroke(); }
    if(!front){ ctx.beginPath(); ctx.ellipse(iso.x, iso.y-H, R, ry, 0, 0, Math.PI*2); ctx.stroke(); }
    else { ctx.strokeStyle = '#3c4046'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y, R, ry, 0, 0, Math.PI); ctx.stroke(); ctx.beginPath(); ctx.ellipse(iso.x, iso.y-H*0.5, R, ry, 0, 0, Math.PI); ctx.stroke(); }
    ctx.restore();
  };
  if(caged) cageBars(false);
  ctx.save(); ctx.translate(iso.x, iso.y+bob);
  const robe = ctx.createLinearGradient(-11,-28,11,4);
  robe.addColorStop(0,'#6a3f8c'); robe.addColorStop(1,'#33194a');
  ctx.fillStyle = robe; ctx.beginPath(); ctx.moveTo(-8,-27); ctx.lineTo(8,-27); ctx.lineTo(12,6); ctx.lineTo(-12,6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#1c0d2a'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(13,-30); ctx.lineTo(15,6); ctx.stroke();
  ctx.fillStyle = '#7fd06a'; ctx.beginPath(); ctx.arc(13,-32,3,0,7); ctx.fill();
  ctx.fillStyle = '#b8c99a'; ctx.beginPath(); ctx.arc(0,-33,6.5,0,7); ctx.fill();
  ctx.strokeStyle = '#2a3a20'; ctx.lineWidth = 1; ctx.stroke();
  // wide-brimmed pointed hat
  ctx.fillStyle = '#2a1440';
  ctx.beginPath(); ctx.ellipse(0,-37,13,4,0,0,7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7,-38); ctx.lineTo(3,-58); ctx.lineTo(8,-38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9a03a'; ctx.fillRect(-7,-41,15,2.5);
  ctx.restore();
  if(caged) cageBars(true);
  if(showIndicator){
    const ey = iso.y-70+Math.sin(t*3)*3;
    ctx.save(); ctx.font = "bold 20px Cinzel, Georgia, serif"; ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd93a'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 3;
    ctx.strokeText('!', iso.x, ey); ctx.fillText('!', iso.x, ey); ctx.restore();
  }
}
// (v152) Hurricane: a wind-ring that follows the caster -- a rotating funnel of streaks, debris and rain,
// wider at the top like the Diablo 2 druid skill, with the odd lightning flash. Drawn in a back pass and a front pass so it wraps the player.
function drawHurricaneIso(p, clock, front){
  const R = HURRICANE_RADIUS*aoeRadiusMult(p);
  const elapsed = (p.hurricaneDurMax||4) - p.hurricaneT;
  const a = Math.max(0, Math.min(1, elapsed/0.35, p.hurricaneT/0.5));
  if(a<=0) return;
  const H = 105;
  const base = toIso(p.x, p.y);
  ctx.save();
  ctx.lineCap = 'round';
  const inFront = (th)=> (Math.cos(th)+Math.sin(th)) > 0;
  if(!front){
    // stormy ground shadow + swirling ground ring
    ctx.globalAlpha = a*0.35;
    ctx.fillStyle = '#20303a';
    ctx.beginPath(); ctx.ellipse(base.x, base.y-4, R*ISO_KX, R*ISO_KY, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = a*0.5; ctx.strokeStyle = '#9ec3d3'; ctx.lineWidth = 2;
    for(let k=0;k<3;k++){
      const st = clock*2.4 + k*2.1;
      ctx.beginPath(); ctx.ellipse(base.x, base.y-4, R*ISO_KX, R*ISO_KY, 0, st, st+1.5); ctx.stroke();
    }
    // translucent funnel body between the ground ring and the cloud band
    const cone = ctx.createLinearGradient(0, base.y-H, 0, base.y);
    cone.addColorStop(0,'rgba(70,90,108,0.30)'); cone.addColorStop(1,'rgba(90,115,130,0.10)');
    ctx.globalAlpha = a; ctx.fillStyle = cone;
    ctx.beginPath(); ctx.moveTo(base.x-R*ISO_KX*1.0, base.y-H); ctx.lineTo(base.x-R*ISO_KX*0.32, base.y-4);
    ctx.lineTo(base.x+R*ISO_KX*0.32, base.y-4); ctx.lineTo(base.x+R*ISO_KX*1.0, base.y-H); ctx.closePath(); ctx.fill();
    // faint dark storm-cloud band at the top of the funnel
    ctx.globalAlpha = a*0.28; ctx.fillStyle = '#39485a';
    ctx.beginPath(); ctx.ellipse(base.x, base.y-H, R*ISO_KX*1.05, R*ISO_KY*1.05, 0, 0, 7); ctx.fill();
  }
  // swirling wind bands: stacked rotating arcs, wider toward the top (funnel)
  const LV = 9;
  for(let j=0;j<LV;j++){
    const h = (j+0.5)/LV, rr = R*(0.3+0.7*h);
    const cx = base.x, cy = base.y - 6 - h*H, rx = rr*ISO_KX, ry = rr*ISO_KY;
    const spd = (3.4 - 1.5*h) * (j%2 ? 1 : 1.12);
    for(let k=0;k<3;k++){
      const t0 = clock*spd + k*2.094 + j*0.9, len = 1.15;
      ctx.globalAlpha = a*(0.32+0.32*h);
      ctx.strokeStyle = (j+k)%4===0 ? '#e2f0f7' : '#9dbccd';
      ctx.lineWidth = 1.6 + h*1.6;
      ctx.beginPath();
      let pen = false;
      for(let m=0;m<=12;m++){
        const t = t0 + len*m/12, sn = Math.sin(t);
        if((sn>0)!==front){ pen = false; continue; }
        const x = cx + Math.cos(t)*rx, y = cy + sn*ry;
        if(pen) ctx.lineTo(x,y); else { ctx.moveTo(x,y); pen = true; }
      }
      ctx.stroke();
    }
  }
  // debris (leaves, dust, pebbles) whirling low and fast
  const cols = ['#6b8a3a','#8a6a3a','#5b4a34','#b9b29a','#7a9a4a'];
  for(let i=0;i<16;i++){
    const h = ((i*0.618034) % 1)*0.75;
    const th = clock*(4.6-2*h) + i*1.7;
    if(inFront(th)!==front) continue;
    const rr = R*(0.3 + 0.7*h)*(0.9+0.1*Math.sin(clock*3+i));
    const q = toIso(p.x+Math.cos(th)*rr, p.y+Math.sin(th)*rr);
    ctx.globalAlpha = a*0.9; ctx.fillStyle = cols[i%cols.length];
    ctx.save(); ctx.translate(q.x, q.y-h*H); ctx.rotate(clock*6+i);
    ctx.fillRect(-2.5,-1.5,5,3); ctx.restore();
  }
  if(front){
    // rain slanting through the ring
    ctx.strokeStyle = 'rgba(190,220,240,0.7)'; ctx.lineWidth = 1;
    for(let i=0;i<26;i++){
      const ph = ((clock*1.9 + i*0.137) % 1);
      const ang = i*2.7, rr = R*0.85*Math.sqrt(((i*0.618)%1));
      const q = toIso(p.x+Math.cos(ang)*rr, p.y+Math.sin(ang)*rr);
      const y = q.y - H*(1-ph);
      ctx.globalAlpha = a*0.6;
      ctx.beginPath(); ctx.moveTo(q.x+5, y-12); ctx.lineTo(q.x, y); ctx.stroke();
    }
    // occasional lightning flicker from the cloud band down into the ring
    const fl = (clock*1.7) % 1;
    if(fl < 0.09){
      const seed = Math.floor(clock*1.7);
      const ang = seed*2.13, rr = R*0.7;
      const q = toIso(p.x+Math.cos(ang)*rr, p.y+Math.sin(ang)*rr);
      ctx.globalAlpha = a; ctx.strokeStyle = '#f4f0b0'; ctx.lineWidth = 2; ctx.shadowColor = '#f4f0b0'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(base.x+(q.x-base.x)*0.3, base.y-H);
      const n = 5; for(let k=1;k<=n;k++){ ctx.lineTo(base.x+(q.x-base.x)*(0.3+0.7*k/n)+(k<n?((k*37+seed*11)%13-6):0), base.y-H+(q.y-(base.y-H))*k/n); }
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Storm passive indicator: a small dark cloud hovering above the character, with a few rain drops and a rare flicker.
function drawStormCloudIso(p, clock){
  const iso = toIso(p.x, p.y);
  const bob = Math.sin(clock*1.6)*2;
  const cx = iso.x, cy = iso.y - 92 + bob;
  ctx.save();
  ctx.globalAlpha = 0.95;
  const puff = (dx,dy,r,c)=>{ ctx.fillStyle = c; ctx.beginPath(); ctx.arc(cx+dx, cy+dy, r, 0, 7); ctx.fill(); };
  puff(-11,3,7,'#4b5868'); puff(11,3,7,'#4b5868'); puff(0,2,9,'#56657a');
  puff(-6,-3,8,'#6a7a90'); puff(7,-2,7,'#6a7a90'); puff(0,-6,7,'#7d8ea4');
  // rain
  ctx.strokeStyle = 'rgba(170,205,235,0.85)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for(let i=0;i<5;i++){
    const ph = ((clock*1.6 + i*0.21) % 1);
    const x = cx - 10 + i*5 + ph*2, y = cy + 9 + ph*18;
    ctx.globalAlpha = 0.85*(1-ph);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x-1.5, y+4); ctx.stroke();
  }
  // rare little flicker
  if((clock % 3.1) < 0.12){
    ctx.globalAlpha = 1; ctx.strokeStyle = '#f7f0a0'; ctx.lineWidth = 1.8; ctx.shadowColor = '#f7f0a0'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(cx+1, cy+8); ctx.lineTo(cx-3, cy+15); ctx.lineTo(cx+2, cy+16); ctx.lineTo(cx-2, cy+24); ctx.stroke();
  }
  ctx.restore();
}
function drawCauldronIso(c){
  const iso = toIso(c.x,c.y), tm=(game&&game.clock)||0;
  drawShadow(iso.x, iso.y+2, 26, 10);
  ctx.save(); ctx.translate(iso.x, iso.y);
  // fire logs
  ctx.strokeStyle='#3a2410'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-15,2); ctx.lineTo(13,-3); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-12,-3); ctx.lineTo(15,3); ctx.stroke();
  const fl = 5+Math.sin(tm*11)*1.6;
  ctx.fillStyle='#e2703a'; ctx.beginPath(); ctx.ellipse(0,-2,11,fl,0,0,7); ctx.fill();
  ctx.fillStyle='#f6c04a'; ctx.beginPath(); ctx.ellipse(0,-2,6,fl*0.6,0,0,7); ctx.fill();
  // pot
  ctx.fillStyle='#1c1c20'; ctx.beginPath(); ctx.ellipse(0,-15,18,15,0,0,7); ctx.fill();
  ctx.strokeStyle='#0a0a0c'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle='#2c2c32'; ctx.beginPath(); ctx.ellipse(0,-25,17,6.5,0,0,7); ctx.fill();
  ctx.fillStyle='#7ddc4c'; ctx.beginPath(); ctx.ellipse(0,-25,14,4.8,0,0,7); ctx.fill();
  // bubbles + green vapour
  for(let i=0;i<4;i++){
    const ph = (tm*0.9+i*0.27)%1;
    ctx.fillStyle='rgba(200,255,150,'+(0.9*(1-ph))+')';
    ctx.beginPath(); ctx.arc(-8+i*5.5, -25-ph*6, 1.8+((i*3)%3)*0.6, 0, 7); ctx.fill();
  }
  for(let i=0;i<4;i++){
    const ph = (tm*0.5+i*0.25)%1;
    ctx.fillStyle='rgba(130,230,100,'+(0.35*(1-ph))+')';
    ctx.beginPath(); ctx.arc(Math.sin(ph*6+i*2)*8, -30-ph*44, 6+ph*9, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function drawTortugaIso(e){
  const iso = toIso(e.x,e.y), face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0, s = e.r/17;
  drawShadow(iso.x, iso.y, 26*s, 9*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const skin = flash?'#fff':'#7a9a52', dark = flash?'#fff':'#4a6a34', shell = flash?'#fff':'#5c4a2a', hi = flash?'#fff':'#86703c';
  const sw = Math.sin(t*6)*(e.moving?2.5:0.6);
  ctx.fillStyle = dark;
  for(const [lx,ph] of [[-13,0],[-4,Math.PI],[7,0],[15,Math.PI]]){ ctx.beginPath(); ctx.ellipse(lx, -3+Math.sin(t*6+ph)*(e.moving?1.2:0), 4, 3, 0, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-19,-8); ctx.lineTo(-27,-5+sw*0.3); ctx.lineTo(-19,-4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(23+sw*0.3,-11,7,5,0,0,7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(26,-13,1.2,0,7); ctx.fill();
  ctx.fillStyle = shell; ctx.strokeStyle = '#2a2010'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-20,-7); ctx.bezierCurveTo(-20,-31,20,-31,20,-7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = hi; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-10,-9); ctx.lineTo(-6,-22); ctx.lineTo(6,-22); ctx.lineTo(10,-9); ctx.moveTo(0,-22); ctx.lineTo(0,-27); ctx.moveTo(-6,-22); ctx.lineTo(-14,-16); ctx.moveTo(6,-22); ctx.lineTo(14,-16); ctx.stroke();
  ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(0,-7,20,3,0,0,7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 22*s, e.r, e.hp, e.maxHp);
}
function drawGatorIso(e){
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/20;
  if(e.sub){
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
    ctx.strokeStyle='rgba(190,235,205,0.35)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.ellipse(2,0,34+Math.sin(t*2)*2,9,0,0,7); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#3a5228';
    for(let i=0;i<4;i++){ ctx.beginPath(); ctx.ellipse(-10+i*6,-3,3.2,2.2,0,0,7); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(22,-2,9,3.6,0,0,7); ctx.fill();
    ctx.fillStyle='#e6d84a'; ctx.beginPath(); ctx.arc(19,-6,1.7,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(24,-6,1.5,0,7); ctx.fill();
    ctx.restore();
    drawHpBar(iso, 22*s, e.r, e.hp, e.maxHp);
    return;
  }
  const tele = e.lungeState==='tele', lunge = e.lungeState==='lunge', moving = e.moving;
  drawShadow(iso.x, iso.y, 34*s, 10*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const body = flash?'#fff':'#4a6a34', dark = flash?'#fff':'#2c4020', belly = flash?'#fff':'#b0b478';
  const sw = Math.sin(t*3)*(moving?4:2);
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.moveTo(-14,-10); ctx.quadraticCurveTo(-34,-8+sw,-46,-2+sw*1.4); ctx.quadraticCurveTo(-30,0,-14,-2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = dark; ctx.lineWidth=4.2; ctx.lineCap='round';
  for(const [lx,ph] of [[-9,0],[11,Math.PI]]){ const o = moving?Math.sin(t*8+ph)*3:0; ctx.beginPath(); ctx.moveTo(lx,-4); ctx.lineTo(lx+o,4); ctx.stroke(); }
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0,-9,21,8.5,0,0,7); ctx.fill();
  ctx.strokeStyle='#1a2a12'; ctx.lineWidth=1.2; ctx.stroke();
  ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(1,-5,17,3.2,0,0,Math.PI); ctx.fill();
  ctx.fillStyle = dark;
  for(let i=0;i<6;i++){ const rx=-14+i*5.6; ctx.beginPath(); ctx.moveTo(rx-2,-16); ctx.lineTo(rx,-21); ctx.lineTo(rx+2,-16); ctx.closePath(); ctx.fill(); }
  // head: long snout, jaws open when winding up / lunging
  const jaw = tele ? 8 : lunge ? 9 : Math.max(0,Math.sin(t*2.5))*2;
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(15,-16); ctx.lineTo(38,-12-jaw*0.3); ctx.lineTo(38,-9-jaw*0.5); ctx.lineTo(15,-8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(15,-8); ctx.lineTo(36,-8+jaw*0.6); ctx.lineTo(36,-5+jaw); ctx.lineTo(15,-3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#f4f0dc';
  for(let i=0;i<5;i++){ const tx=20+i*3.6; ctx.beginPath(); ctx.moveTo(tx,-8); ctx.lineTo(tx+1.4,-8+2.6+jaw*0.2); ctx.lineTo(tx+2.8,-8); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = (tele||lunge)?'#ff4a2a':'#e6d84a';
  ctx.beginPath(); ctx.arc(21,-16,2,0,7); ctx.fill();
  ctx.fillStyle='#120c04'; ctx.fillRect(20.4,-17.4,1.2,2.8);
  ctx.restore();
  drawHpBar(iso, 34*s, e.r, e.hp, e.maxHp);
}
// Storm Snake (Sunken Depths, v262): a slim blue serpent with yellow lightning markings that crackles with sparks.
function drawSquidIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, flash = e.hitT>0, s = e.r/16, charge = e.sparkT>0 || e.atkAnimT>0;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(120,200,255,0.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 26+Math.sin(t*2)*2, 9, 0, 0, 7); ctx.fill();   // ripple
  ctx.lineCap = 'round';
  for(let i=0;i<7;i++){   // tentacles
    const bx = -12+i*4, ph = t*4+i*0.9;
    ctx.strokeStyle = flash ? '#fff' : (i%2 ? '#5b4fb8' : '#4a3fa0'); ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(bx, -8); ctx.quadraticCurveTo(bx+Math.sin(ph)*6, 2, bx+Math.sin(ph+1)*8, 9+(i%3)); ctx.stroke();
  }
  const mg = ctx.createLinearGradient(0,-40,0,-6); mg.addColorStop(0, flash?'#fff':'#8f7bff'); mg.addColorStop(1, flash?'#fff':'#4a3fa0');
  ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(-12,-8); ctx.quadraticCurveTo(-14,-34,0,-42); ctx.quadraticCurveTo(14,-34,12,-8); ctx.closePath(); ctx.fill();   // mantle
  ctx.strokeStyle = '#1e1850'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = '#10143a'; ctx.beginPath(); ctx.ellipse(0,-10,12,5,0,0,7); ctx.fill();
  ctx.fillStyle = charge ? '#fff6a0' : '#ffe35a'; ctx.beginPath(); ctx.arc(-5,-12,2.3,0,7); ctx.arc(5,-12,2.3,0,7); ctx.fill();   // eyes
  ctx.strokeStyle = 'rgba(200,235,255,0.95)'; ctx.lineWidth = 1.3;   // crackling arcs
  for(let k=0;k<(charge?4:2);k++){ if(!charge && ((Math.floor(t*9)+k)%3)) continue; const ph = Math.floor(t*14)+k*7, dx = Math.sin(ph*12.9898)*12, dy = -22-Math.abs(Math.cos(ph*7.1))*14; ctx.beginPath(); ctx.moveTo(dx*0.3,-28); ctx.lineTo(dx*0.6,dy*0.8); ctx.lineTo(dx*0.35,dy*0.85); ctx.lineTo(dx,dy); ctx.stroke(); }
  ctx.restore();
  drawHpBar(iso, 24*s, e.r+10, e.hp, e.maxHp);
}
function drawEelIso(e){
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/14;
  const N = 15, amp = e.moving?6:3, spd = e.moving?9:3, charge = e.sparkT>0 || e.atkAnimT>0;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.strokeStyle = 'rgba(160,230,255,0.35)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 2, 30, 8, 0, 0, 7); ctx.stroke();   // ripple ring
  const pos = (i)=>({x:24-i*3.8, y:-4+Math.sin(t*spd-i*0.7)*amp});
  for(let i=N-1;i>=0;i--){
    const q = pos(i), rad = 4.6 - i*0.22;
    ctx.fillStyle = flash ? '#fff' : (i%2 ? '#1d2c34' : '#16242b');
    ctx.beginPath(); ctx.ellipse(q.x, q.y, rad, rad*0.8, 0, 0, 7); ctx.fill();
    if(!flash){ ctx.fillStyle = 'rgba(110,230,255,'+(charge ? 0.9 : 0.45+0.25*Math.sin(t*6+i))+')'; ctx.beginPath(); ctx.arc(q.x, q.y-rad*0.55, 1.1, 0, 7); ctx.fill(); }
  }
  const hd = pos(0);
  ctx.fillStyle = flash ? '#fff' : '#22343e'; ctx.beginPath(); ctx.ellipse(hd.x+3, hd.y, 6.5, 4.4, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#9ff0ff'; ctx.beginPath(); ctx.arc(hd.x+5, hd.y-1.5, 1.3, 0, 7); ctx.fill();
  if(charge){ ctx.strokeStyle = '#bff4ff'; ctx.lineWidth = 1.2; ctx.beginPath(); for(let k=0;k<4;k++){ const b = pos(2+k*3); ctx.moveTo(b.x, b.y-5); ctx.lineTo(b.x+3, b.y-11); ctx.lineTo(b.x-1, b.y-14); } ctx.stroke(); }
  ctx.restore();
}
function drawGoldHordeIso(hd){
  const iso = toIso(hd.x, hd.y), s = hd.s;
  ctx.save(); ctx.translate(iso.x, iso.y);
  const g2 = ctx.createRadialGradient(-6*s, -10*s, 2, 0, -4*s, 34*s); g2.addColorStop(0,'#fff2a8'); g2.addColorStop(0.45,'#e8b83a'); g2.addColorStop(1,'#8a5a14');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 34*s, 13*s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(-32*s, 0); ctx.quadraticCurveTo(-18*s, -26*s, 0, -28*s); ctx.quadraticCurveTo(18*s, -26*s, 32*s, 0); ctx.quadraticCurveTo(0, 10*s, -32*s, 0); ctx.fill();
  ctx.fillStyle = '#ffe27a';
  for(let k=0;k<9;k++){ const cx = (k*13%50-25)*s, cy = (-4-(k*7%18))*s; ctx.beginPath(); ctx.ellipse(cx, cy, 3.4*s, 1.6*s, 0, 0, 7); ctx.fill(); }
  if(hd.gems){ ctx.fillStyle = '#6ad0ff'; ctx.beginPath(); ctx.arc(-8*s, -16*s, 2.6*s, 0, 7); ctx.fill(); ctx.fillStyle = '#ff5a6a'; ctx.beginPath(); ctx.arc(10*s, -12*s, 2.4*s, 0, 7); ctx.fill();
    ctx.fillStyle = '#d8a83a'; ctx.strokeStyle = '#6a4a10'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14*s,-20*s); ctx.lineTo(22*s,-20*s); ctx.lineTo(20*s,-12*s); ctx.lineTo(16*s,-12*s); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  const tw = 0.5+0.5*Math.sin(((game&&game.clock)||0)*3 + hd.x);
  ctx.fillStyle = 'rgba(255,255,230,'+(0.5*tw)+')'; ctx.beginPath(); ctx.arc(-4*s, -22*s, 1.8, 0, 7); ctx.fill();
  ctx.restore();
}
function drawGrottoCrystalIso(c, clock){
  const iso = toIso(c.x, c.y), s = c.s, gl = 0.55+0.35*Math.sin((clock||0)*1.4+c.ph);
  const col = c.hue ? '120,220,255' : '150,255,200';
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba('+col+','+(0.12*gl)+')'; ctx.beginPath(); ctx.ellipse(0, -4, 22*s, 10*s, 0, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  for(const [dx,hgt,lean] of [[-5,18,-0.25],[0,26,0.05],[6,16,0.3]]){ ctx.fillStyle = 'rgba('+col+','+(0.55+0.3*gl)+')'; ctx.beginPath(); ctx.moveTo(dx*s-3*s, 0); ctx.lineTo(dx*s+lean*hgt*s, -hgt*s); ctx.lineTo(dx*s+3*s, 0); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function drawWoodWalkway(b){
  const corner = (x,y)=>toIso(x,y);
  ctx.save();
  const a = corner(b.x0, b.y-b.half), bb = corner(b.x1, b.y-b.half), c = corner(b.x1, b.y+b.half), d = corner(b.x0, b.y+b.half);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(a.x, a.y+6); ctx.lineTo(bb.x, bb.y+6); ctx.lineTo(c.x, c.y+6); ctx.lineTo(d.x, d.y+6); ctx.closePath(); ctx.fill();
  for(let x=b.x0; x<b.x1; x+=18){
    const p1 = corner(x, b.y-b.half), p2 = corner(Math.min(b.x1,x+15), b.y-b.half), p3 = corner(Math.min(b.x1,x+15), b.y+b.half), p4 = corner(x, b.y+b.half);
    const v = 90 + ((x*7)%23);
    ctx.fillStyle = 'rgb('+v+','+Math.round(v*0.72)+','+Math.round(v*0.45)+')'; ctx.strokeStyle = 'rgba(30,18,8,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y); ctx.lineTo(p3.x,p3.y); ctx.lineTo(p4.x,p4.y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 3;
  for(let x=b.x0; x<=b.x1; x+=90){ for(const sd of [-1,1]){ const pp = corner(x, b.y+sd*b.half); ctx.beginPath(); ctx.moveTo(pp.x, pp.y+4); ctx.lineTo(pp.x, pp.y-16); ctx.stroke(); } }
  ctx.strokeStyle = 'rgba(200,170,120,0.8)'; ctx.lineWidth = 1.4;
  for(const sd of [-1,1]){ ctx.beginPath(); for(let x=b.x0; x<=b.x1; x+=90){ const pp = corner(x, b.y+sd*b.half); if(x===b.x0) ctx.moveTo(pp.x, pp.y-14); else ctx.quadraticCurveTo(pp.x-30, pp.y-8, pp.x, pp.y-14); } ctx.stroke(); }
  ctx.restore();
}
function drawStormSnakeIso(e){
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/13;
  const N = 11, amp = e.moving?5:2.6, spd = e.moving?10:3.2, charge = e.sparkT>0 || e.atkAnimT>0;
  drawShadow(iso.x, iso.y, 22*s, 7*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const pos = (i)=>({x:20-i*4.1, y:-8+Math.sin(t*spd-i*0.8)*amp});
  for(let i=N-1;i>=0;i--){
    const q = pos(i), rad = 5.2 - i*0.3;
    ctx.fillStyle = flash?'#fff':(i%2?'#2f86b4':'#277399');
    ctx.beginPath(); ctx.ellipse(q.x, q.y, rad, rad*0.95, 0, 0, 7); ctx.fill();
    if(!flash && i%2===0){ ctx.fillStyle='#ffe35a'; ctx.beginPath(); ctx.moveTo(q.x-2,q.y-rad*0.5); ctx.lineTo(q.x+1,q.y-rad*0.9); ctx.lineTo(q.x,q.y-rad*0.2); ctx.lineTo(q.x+2.4,q.y-rad*0.6); ctx.lineTo(q.x-1,q.y+rad*0.1); ctx.closePath(); ctx.fill(); }
  }
  const hd = pos(0);
  ctx.fillStyle = flash?'#fff':'#3b9ccc';
  ctx.beginPath(); ctx.ellipse(hd.x+3, hd.y, 7.5, 5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle='#0f3347'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#fff6a0'; ctx.beginPath(); ctx.arc(hd.x+4,hd.y-2,1.7,0,7); ctx.fill();
  ctx.fillStyle='#10202a'; ctx.fillRect(hd.x+3.7,hd.y-3.2,0.8,2.4);
  ctx.strokeStyle='#ffe35a'; ctx.lineWidth=1.1;
  ctx.beginPath(); ctx.moveTo(hd.x+10,hd.y+0.5); ctx.lineTo(hd.x+16,hd.y+0.5); ctx.lineTo(hd.x+19,hd.y-1.5); ctx.moveTo(hd.x+16,hd.y+0.5); ctx.lineTo(hd.x+19,hd.y+2.5); ctx.stroke();
  // crackling arcs
  const nA = charge ? 4 : 2;
  ctx.lineCap='round'; ctx.lineJoin='round';
  for(let k=0;k<nA;k++){
    if(!charge && ((Math.floor(t*9)+k)%3)) continue;
    const b = pos(1+k*2), ph = Math.floor(t*14)+k*7;
    const dx = Math.sin(ph*12.9898)*9, dy = -6-Math.abs(Math.cos(ph*7.1))*10;
    ctx.strokeStyle='rgba(200,235,255,0.95)'; ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.moveTo(b.x,b.y-3); ctx.lineTo(b.x+dx*0.4,b.y+dy*0.5); ctx.lineTo(b.x+dx*0.2,b.y+dy*0.55); ctx.lineTo(b.x+dx,b.y+dy); ctx.stroke();
  }
  ctx.restore();
  drawHpBar(iso, 22*s, e.r, e.hp, e.maxHp);
}
function drawAnacondaIso(e){
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/16;
  const sub = !!e.sub, N = 13, amp = e.moving?5.5:3, spd = e.moving?9:3;
  if(!sub) drawShadow(iso.x, iso.y, 26*s, 8*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  if(sub){
    ctx.strokeStyle='rgba(190,235,205,0.35)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.ellipse(0,0,28+Math.sin(t*2)*2,7,0,0,7); ctx.stroke();
  }
  const pos = (i)=>({x:22-i*4.2, y:-8+Math.sin(t*spd-i*0.75)*amp});
  for(let i=N-1;i>=0;i--){
    const q = pos(i), rad = 5.6 - i*0.3;
    if(sub && (i%3)!==0) continue;
    ctx.fillStyle = flash?'#fff':(i%2?'#55652a':'#4a5a24');
    ctx.beginPath(); ctx.ellipse(q.x, q.y, rad, rad*(sub?0.55:0.95), 0, 0, 7); ctx.fill();
    if(!sub && i%2===0 && !flash){ ctx.fillStyle='#1f2810'; ctx.beginPath(); ctx.ellipse(q.x, q.y-rad*0.35, rad*0.55, rad*0.32, 0, 0, 7); ctx.fill(); }
  }
  const hd = pos(0);
  ctx.fillStyle = flash?'#fff':'#5f7230';
  ctx.beginPath(); ctx.ellipse(hd.x+3, hd.y, 7.5, 5, 0, 0, 7); ctx.fill();
  ctx.strokeStyle='#1c2410'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='#e6d84a'; ctx.beginPath(); ctx.arc(hd.x+4,hd.y-2,1.5,0,7); ctx.fill();
  ctx.fillStyle='#100c04'; ctx.fillRect(hd.x+3.7,hd.y-3.2,0.8,2.4);
  if(e.atkAnimT>0 || (Math.floor(t*2.2)%3===0)){
    ctx.strokeStyle='#d0304a'; ctx.lineWidth=1.1;
    ctx.beginPath(); ctx.moveTo(hd.x+10,hd.y+0.5); ctx.lineTo(hd.x+16,hd.y+0.5); ctx.lineTo(hd.x+19,hd.y-1.5); ctx.moveTo(hd.x+16,hd.y+0.5); ctx.lineTo(hd.x+19,hd.y+2.5); ctx.stroke();
  }
  ctx.restore();
  drawHpBar(iso, 24*s, e.r, e.hp, e.maxHp);
}
function drawToadIso(e){
  const iso = toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/20;
  const air = e.tState==='air', tele = e.tState==='tele';
  const hop = e.hop||0;
  drawShadow(iso.x, iso.y, (26-hop*0.15)*s, 9*s);
  ctx.save(); ctx.translate(iso.x, iso.y-hop); ctx.scale(face*s, s*(tele?0.82:1));
  const skin = flash?'#fff':'#6a7a34', dark = flash?'#fff':'#3e4a1c', belly = flash?'#fff':'#b4b070';
  const pulse = 1+Math.sin(t*3)*0.05 + (tele?0.18:0);
  // hind legs
  ctx.strokeStyle = dark; ctx.lineWidth=5; ctx.lineCap='round'; ctx.lineJoin='round';
  const kick = air ? -6 : 0;
  ctx.beginPath(); ctx.moveTo(-8,-8); ctx.lineTo(-17,-2+kick*0.3); ctx.lineTo(-11,3+kick); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8,-8); ctx.lineTo(15,-3); ctx.lineTo(19,3); ctx.stroke();
  // body
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(0,-14,20*pulse,14*pulse,0,0,7); ctx.fill();
  ctx.strokeStyle='#1c2410'; ctx.lineWidth=1.3; ctx.stroke();
  ctx.fillStyle = belly; ctx.beginPath(); ctx.ellipse(3,-8,14,6,0,0,Math.PI); ctx.fill();
  // warts
  ctx.fillStyle = dark;
  for(const [wx,wy] of [[-8,-22],[-2,-26],[6,-24],[-12,-15],[2,-19]]){ ctx.beginPath(); ctx.arc(wx,wy,1.9,0,7); ctx.fill(); }
  // head: wide mouth, bulging eyes
  ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(14,-16,9,7,0,0,7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='#1c1208'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(9,-13); ctx.quadraticCurveTo(17,-9,23,-14); ctx.stroke();
  ctx.fillStyle = '#d8d24a'; ctx.beginPath(); ctx.arc(12,-23,3.4,0,7); ctx.fill(); ctx.beginPath(); ctx.arc(19,-22,3,0,7); ctx.fill();
  ctx.fillStyle = '#140e04'; ctx.fillRect(11.4,-24.4,1.4,3.4); ctx.fillRect(18.4,-23.4,1.4,3);
  // poison-green swelling sac when about to leap
  if(tele){ ctx.fillStyle='rgba(140,240,90,0.55)'; ctx.beginPath(); ctx.ellipse(6,-5,9,5,0,0,7); ctx.fill(); }
  ctx.restore();
  drawHpBar(iso, 34*s, e.r, e.hp, e.maxHp);
}
function drawPoisonPlantIso(e){
  const iso = toIso(e.x,e.y), t=e.animT||0, flash=e.hitT>0, s=e.r/14;
  const spit = e.spitT>0, swell = spit ? 1+ (1-e.spitT/0.4)*0.35 : 1+Math.sin(t*2)*0.04;
  drawShadow(iso.x, iso.y, 18*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  // ground leaves
  ctx.fillStyle = flash?'#fff':'#2f5a26';
  for(const a of [-2.6,-2.0,-1.1,-0.5]){
    ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(Math.cos(a)*14,Math.sin(a)*8-6,Math.cos(a)*24,Math.sin(a)*6-2); ctx.quadraticCurveTo(Math.cos(a)*12,Math.sin(a)*4+2,0,0); ctx.fill();
  }
  // stalk (sways, leans back when spitting)
  const sway = Math.sin(t*1.6)*2 - (spit?3:0);
  ctx.strokeStyle = flash?'#fff':'#3d7a30'; ctx.lineWidth=5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(sway*0.5,-16,sway,-30); ctx.stroke();
  // head: bulb with a toothed maw
  ctx.save(); ctx.translate(sway,-34); ctx.scale(swell,swell);
  ctx.fillStyle = flash?'#fff':'#6a2f7a'; ctx.beginPath(); ctx.ellipse(0,0,12,10,0,0,7); ctx.fill();
  ctx.strokeStyle='#22102a'; ctx.lineWidth=1.2; ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#a4e06a'; ctx.beginPath(); ctx.ellipse(0,1,8,5.5+(spit?2.5:0),0,0,7); ctx.fill();
  ctx.fillStyle='#f4f0dc';
  for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(i*2.2-1,-3.6); ctx.lineTo(i*2.2,-0.5); ctx.lineTo(i*2.2+1,-3.6); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  // spore droplets drifting up
  for(let i=0;i<3;i++){
    const ph = (t*0.6+i*0.33)%1;
    ctx.fillStyle='rgba(160,240,110,'+(0.5*(1-ph))+')'; ctx.beginPath(); ctx.arc(Math.sin(ph*5+i*2)*9+sway, -42-ph*22, 2.2, 0, 7); ctx.fill();
  }
  ctx.restore();
  drawHpBar(iso, 56*s, e.r*1.5, e.hp, e.maxHp);
}
