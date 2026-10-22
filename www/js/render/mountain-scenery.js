// Mountain Pass: the same checker-tile ground rendering as the Forest,
// just recolored -- rocky gray/dirt-gray along the trail, snow white off
// it, instead of the Forest's dirt/grass palette.
// ---- (v250) Mountain Pass scenery ----
// Dark Forest gateway: two giant trees whose boughs knit together over the road, with black mist underneath
function drawForestArch(d, clk){
  const a = toIso(d.x, d.y-120), b = toIso(d.x, d.y+120), m = toIso(d.x, d.y);
  const topA = {x:a.x, y:a.y-190}, topB = {x:b.x, y:b.y-210};
  ctx.save();
  const mist = ctx.createRadialGradient(m.x, m.y-30, 6, m.x, m.y-30, 150);
  mist.addColorStop(0,'rgba(2,6,4,0.78)'); mist.addColorStop(0.6,'rgba(4,10,7,0.4)'); mist.addColorStop(1,'rgba(4,10,7,0)');
  ctx.fillStyle = mist; ctx.beginPath(); ctx.ellipse(m.x, m.y-30, 150, 120, 0, 0, 7); ctx.fill();
  // knitted boughs
  ctx.strokeStyle = '#17110c'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(topA.x, topA.y); ctx.bezierCurveTo(topA.x+30, topA.y-60, topB.x-30, topB.y-60, topB.x, topB.y); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(topA.x, topA.y+14); ctx.bezierCurveTo(topA.x+20, topA.y-34, topB.x-20, topB.y-34, topB.x, topB.y+14); ctx.stroke();
  // hanging moss + canopy clumps
  for(let i=0;i<=10;i++){ const t=i/10, x=topA.x+(topB.x-topA.x)*t, y=topA.y+(topB.y-topA.y)*t - Math.sin(t*Math.PI)*58;
    ctx.fillStyle = i%2?'#0f2418':'#14301f'; ctx.beginPath(); ctx.ellipse(x, y, 24, 15, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(40,70,48,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y+8); ctx.lineTo(x+Math.sin(clk*1.3+i)*2, y+26+(i%3)*8); ctx.stroke(); }
  // faint eyes in the dark
  if(Math.sin(clk*0.9)>0.2){ ctx.fillStyle='rgba(255,200,90,0.8)'; ctx.fillRect(m.x-9, m.y-52, 3, 2); ctx.fillRect(m.x+5, m.y-52, 3, 2); }
  ctx.restore();
}
// Frosthold Keep seen from the road: curtain walls, round towers and a great central tower rising behind the gate
function drawFrostholdBackdrop(gp, clock, lite){
  const iso = toIso(gp.x, gp.y), t = clock||0;
  ctx.save(); ctx.translate(iso.x+(lite?0:60), iso.y-(lite?10:30));
  const outline = '#161b22';
  const snow = (x,y,w)=>{ ctx.fillStyle='#f2f8fc'; ctx.fillRect(x,y,w,5); };
  const stoneG = (x0,y0,x1,y1)=>{ const g2=ctx.createLinearGradient(0,y0,0,y1); g2.addColorStop(0,'#8d98a6'); g2.addColorStop(1,'#3b434d'); return g2; };
  // mountain silhouette
  if(!lite){
  ctx.fillStyle='#4b5662'; ctx.beginPath(); ctx.moveTo(-420,0); ctx.lineTo(-330,-190); ctx.lineTo(-240,-130); ctx.lineTo(-120,-330); ctx.lineTo(0,-250); ctx.lineTo(150,-420); ctx.lineTo(300,-230); ctx.lineTo(420,-310); ctx.lineTo(520,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#eef4f9'; ctx.beginPath(); ctx.moveTo(-120,-330); ctx.lineTo(-160,-270); ctx.lineTo(-100,-290); ctx.lineTo(-70,-262); ctx.lineTo(0,-250); ctx.lineTo(-30,-282); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(150,-420); ctx.lineTo(95,-330); ctx.lineTo(150,-352); ctx.lineTo(205,-318); ctx.closePath(); ctx.fill();
  }
  // curtain wall with crenellations
  ctx.fillStyle=stoneG(0,-110,0,0); ctx.strokeStyle=outline; ctx.lineWidth=1.5;
  ctx.fillRect(-400,-112,800,112); ctx.strokeRect(-400,-112,800,112);
  ctx.fillStyle='#56606c'; for(let x=-400;x<400;x+=26){ ctx.fillRect(x,-124,16,12); ctx.strokeRect(x,-124,16,12); }
  snow(-400,-114,800);
  ctx.strokeStyle='rgba(15,20,26,0.35)'; ctx.lineWidth=1; for(let y=-90;y<0;y+=22){ ctx.beginPath(); ctx.moveTo(-400,y); ctx.lineTo(400,y); ctx.stroke(); }
  // great central tower (three tiers, spire, glowing windows)
  const tiers = lite ? [] : [[-92,92,-270,'#7a8592'],[-70,70,-380,'#6f7a87'],[-48,48,-470,'#656f7b']];
  let base=-100;
  for(const [x0,x1,top,col] of tiers){
    ctx.fillStyle=stoneG(0,top,0,base); ctx.fillRect(x0,top,x1-x0,base-top); ctx.strokeStyle=outline; ctx.lineWidth=1.5; ctx.strokeRect(x0,top,x1-x0,base-top);
    ctx.fillStyle='#515b67'; for(let x=x0;x<x1-8;x+=22){ ctx.fillRect(x,top-10,14,10); ctx.strokeRect(x,top-10,14,10); }
    snow(x0,top-2,x1-x0);
    // lit windows
    for(let wy=top+22; wy<base-20; wy+=52) for(const wx of [x0+(x1-x0)*0.28, x0+(x1-x0)*0.72]){
      const fl = 0.75+0.25*Math.sin(t*3+wx+wy);
      ctx.fillStyle='#0b0f14'; ctx.beginPath(); ctx.moveTo(wx-6,wy+22); ctx.lineTo(wx-6,wy+6); ctx.quadraticCurveTo(wx,wy-6,wx+6,wy+6); ctx.lineTo(wx+6,wy+22); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(255,176,80,'+(0.8*fl)+')'; ctx.beginPath(); ctx.moveTo(wx-4,wy+20); ctx.lineTo(wx-4,wy+7); ctx.quadraticCurveTo(wx,wy-2,wx+4,wy+7); ctx.lineTo(wx+4,wy+20); ctx.closePath(); ctx.fill();
    }
    base = top;
  }
  // spire roof + beacon + banners
  if(!lite){
  ctx.fillStyle='#26405c'; ctx.beginPath(); ctx.moveTo(-58,-480); ctx.lineTo(0,-610); ctx.lineTo(58,-480); ctx.closePath(); ctx.fill(); ctx.strokeStyle=outline; ctx.stroke();
  ctx.fillStyle='#f2f8fc'; ctx.beginPath(); ctx.moveTo(-34,-534); ctx.lineTo(0,-610); ctx.lineTo(34,-534); ctx.lineTo(18,-542); ctx.lineTo(0,-528); ctx.lineTo(-18,-542); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2a2f36'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-610); ctx.lineTo(0,-640); ctx.stroke();
  ctx.fillStyle='#8f1f2c'; ctx.beginPath(); ctx.moveTo(0,-640); ctx.lineTo(30,-632+Math.sin(t*3)*2); ctx.lineTo(0,-622); ctx.closePath(); ctx.fill();
  const bf = 8+Math.sin(t*7)*2, bg = ctx.createRadialGradient(0,-500,2,0,-500,60); bg.addColorStop(0,'rgba(255,170,70,0.45)'); bg.addColorStop(1,'rgba(255,170,70,0)');
  ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(0,-500,60,0,7); ctx.fill();
  for(const bx of [-92,92]){ ctx.fillStyle='#7a1f2a'; ctx.beginPath(); ctx.moveTo(bx-8,-262); ctx.lineTo(bx+8,-262); ctx.lineTo(bx+8,-200); ctx.lineTo(bx,-212); ctx.lineTo(bx-8,-200); ctx.closePath(); ctx.fill(); }
  }
  // flanking round towers with conical roofs
  for(const tx of [-250,250]){
    ctx.fillStyle=stoneG(0,-250,0,0); ctx.fillRect(tx-44,-230,88,230); ctx.strokeStyle=outline; ctx.lineWidth=1.5; ctx.strokeRect(tx-44,-230,88,230);
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(tx+14,-230,30,230);
    ctx.fillStyle='#26405c'; ctx.beginPath(); ctx.moveTo(tx-54,-230); ctx.lineTo(tx,-320); ctx.lineTo(tx+54,-230); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#f2f8fc'; ctx.beginPath(); ctx.moveTo(tx-30,-262); ctx.lineTo(tx,-320); ctx.lineTo(tx+30,-262); ctx.lineTo(tx+12,-270); ctx.lineTo(tx,-256); ctx.lineTo(tx-12,-270); ctx.closePath(); ctx.fill();
    for(const wy of [-180,-110]){ const fl = 0.75+0.25*Math.sin(t*3+tx+wy); ctx.fillStyle='rgba(255,176,80,'+(0.75*fl)+')'; ctx.fillRect(tx-4,wy,8,18); }
  }
  // drifting fog at the foot
  const fog = ctx.createRadialGradient(0,0,10,0,0,430); fog.addColorStop(0,'rgba(210,225,240,0.28)'); fog.addColorStop(1,'rgba(210,225,240,0)');
  ctx.fillStyle=fog; ctx.beginPath(); ctx.ellipse(0,0,430,60,0,0,7); ctx.fill();
  ctx.restore();
}
function drawMtnDeco(d){
  const k = d.k, s = d.s||1, clk = (game&&game.clock)||0;
  if(k==='rock'){ drawRockIso(d); return; }
  if(k==='deadpine'){ drawDeadTreeIso(d); return; }
  if(k==='crag'){ drawIceCragIso(d); return; }
  if(k==='forestarch'){ drawForestArch(d, clk); return; }
  const iso = toIso(d.x,d.y);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  if(k==='fpine' || k==='forestgiant'){
    const big = k==='forestgiant', sc = big?2.6:1.15;
    ctx.scale(sc,sc);
    drawShadow(0,0,15,6.5);
    ctx.fillStyle = big?'#1c1410':'#2a1c12'; ctx.fillRect(big?-3.5:-2.5,-18,big?7:5,18);
    for(let i=0;i<4;i++){
      const w = 30-i*6, topY=-22-i*13, baseY=-6-i*13;
      const g2 = ctx.createLinearGradient(-w/2,topY,w/2,baseY); g2.addColorStop(0,'#1f3a2a'); g2.addColorStop(1,'#0b1a12');
      ctx.fillStyle=g2; ctx.beginPath(); ctx.moveTo(0,topY); ctx.lineTo(-w/2,baseY); ctx.lineTo(w/2,baseY); ctx.closePath(); ctx.fill();
      ctx.fillStyle='rgba(8,16,12,0.5)'; ctx.beginPath(); ctx.moveTo(0,topY); ctx.lineTo(w/2,baseY); ctx.lineTo(w*0.1,baseY); ctx.closePath(); ctx.fill();
    }
  } else if(k==='pine'){
    drawShadow(0,0,15,6.5);
    ctx.fillStyle='#3a2a1c'; ctx.fillRect(-2.5,-18,5,18);
    for(let i=0;i<3;i++){
      const w = 26-i*6, topY=-22-i*13, baseY=-8-i*13;
      const g2 = ctx.createLinearGradient(-w/2,topY,w/2,baseY); g2.addColorStop(0,'#3f6a4a'); g2.addColorStop(1,'#1c3a28');
      ctx.fillStyle=g2; ctx.beginPath(); ctx.moveTo(0,topY); ctx.lineTo(-w/2,baseY); ctx.lineTo(w/2,baseY); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#f4f8fb'; ctx.beginPath(); ctx.moveTo(0,topY); ctx.lineTo(-w*0.34,topY+(baseY-topY)*0.5); ctx.lineTo(-w*0.1,topY+(baseY-topY)*0.42); ctx.lineTo(w*0.1,topY+(baseY-topY)*0.55); ctx.lineTo(w*0.34,topY+(baseY-topY)*0.5); ctx.closePath(); ctx.fill();
    }
  } else if(k==='drift'){
    ctx.fillStyle='rgba(120,140,160,0.25)'; ctx.beginPath(); ctx.ellipse(2,1,24,7,0,0,7); ctx.fill();
    const g2 = ctx.createLinearGradient(0,-12,0,2); g2.addColorStop(0,'#ffffff'); g2.addColorStop(1,'#d3e0ea');
    ctx.fillStyle=g2; ctx.beginPath(); ctx.moveTo(-22,0); ctx.quadraticCurveTo(-12,-14,0,-11); ctx.quadraticCurveTo(14,-15,24,0); ctx.closePath(); ctx.fill();
  } else if(k==='cairn'){
    drawShadow(0,0,12,5);
    const st = [[0,-4,10,5],[1,-11,7.5,4.5],[-1,-17,5,3.5]];
    st.forEach((q,i)=>{ ctx.fillStyle=i%2?'#8a9099':'#767c85'; ctx.strokeStyle='#32373d'; ctx.lineWidth=1; ctx.beginPath(); ctx.ellipse(q[0],q[1],q[2],q[3],0,0,7); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle='#f4f8fb'; ctx.beginPath(); ctx.ellipse(-1,-20,3.5,1.6,0,0,7); ctx.fill();
  } else if(k==='brazier'){
    drawShadow(0,0,11,4.5);
    ctx.fillStyle='#4a525c'; ctx.strokeStyle='#20262c'; ctx.lineWidth=1;
    ctx.fillRect(-4,-24,8,24); ctx.strokeRect(-4,-24,8,24);
    ctx.beginPath(); ctx.moveTo(-11,-28); ctx.lineTo(11,-28); ctx.lineTo(7,-20); ctx.lineTo(-7,-20); ctx.closePath(); ctx.fill(); ctx.stroke();
    const fl = 6+Math.sin(clk*9+d.x)*1.6, gl = ctx.createRadialGradient(0,-32,1,0,-32,22);
    gl.addColorStop(0,'rgba(255,170,70,0.5)'); gl.addColorStop(1,'rgba(255,170,70,0)');
    ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,-32,22,0,7); ctx.fill();
    ctx.fillStyle='#e2703a'; ctx.beginPath(); ctx.moveTo(-6,-28); ctx.quadraticCurveTo(-4,-28-fl,0,-30-fl*1.4); ctx.quadraticCurveTo(4,-28-fl,6,-28); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffd070'; ctx.beginPath(); ctx.moveTo(-3,-28); ctx.quadraticCurveTo(0,-28-fl*0.9,3,-28); ctx.closePath(); ctx.fill();
  } else if(k==='banner'){
    drawShadow(0,0,9,4);
    ctx.fillStyle='#3a2c1c'; ctx.fillRect(-1.5,-62,3,62);
    ctx.fillStyle='#7a1f2a'; ctx.strokeStyle='#2a0a10'; ctx.lineWidth=1;
    const wv = Math.sin(clk*2.4+d.x*0.01)*3;
    ctx.beginPath(); ctx.moveTo(1.5,-60); ctx.lineTo(21+wv,-58); ctx.lineTo(19+wv,-32); ctx.lineTo(11+wv,-38); ctx.lineTo(1.5,-30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#e8c44a'; ctx.fillRect(7+wv*0.6,-54,5,10);
  } else if(k==='cart'){
    drawShadow(0,0,20,7);
    ctx.fillStyle='#5a4030'; ctx.strokeStyle='#241810'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-16,-14); ctx.lineTo(16,-14); ctx.lineTo(12,-2); ctx.lineTo(-12,-2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#6e6a60'; for(const [ox,oy] of [[-9,-17],[-2,-19],[6,-17],[11,-16]]){ ctx.beginPath(); ctx.arc(ox,oy,4.5,0,7); ctx.fill(); }
    ctx.fillStyle='#2a2a2a'; for(const ox of [-9,9]){ ctx.beginPath(); ctx.arc(ox,0,4,0,7); ctx.fill(); }
  } else if(k==='timber'){
    drawShadow(0,0,22,6);
    ctx.strokeStyle='#241810'; ctx.lineWidth=1; ctx.fillStyle='#6a4a30';
    ctx.fillRect(-18,-40,6,40); ctx.strokeRect(-18,-40,6,40); ctx.fillRect(12,-40,6,40); ctx.strokeRect(12,-40,6,40);
    ctx.fillRect(-22,-44,44,7); ctx.strokeRect(-22,-44,44,7);
    ctx.fillStyle='#f4f8fb'; ctx.fillRect(-22,-46,44,3);
  } else if(k==='spoil'){
    drawShadow(0,0,22,7);
    ctx.fillStyle='#6a5d50'; ctx.strokeStyle='#2c2620'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(-10,-14); ctx.lineTo(2,-18); ctx.lineTo(14,-10); ctx.lineTo(24,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#8a7a68'; ctx.beginPath(); ctx.moveTo(-10,-14); ctx.lineTo(2,-18); ctx.lineTo(-2,-8); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#f4f8fb'; ctx.beginPath(); ctx.moveTo(-6,-16); ctx.lineTo(2,-18); ctx.lineTo(6,-14); ctx.lineTo(-2,-13); ctx.closePath(); ctx.fill();
  } else if(k==='wagon'){
    drawShadow(0,0,26,8);
    ctx.fillStyle='#5a4030'; ctx.strokeStyle='#241810'; ctx.lineWidth=1.2;
    ctx.save(); ctx.rotate(-0.12); ctx.fillRect(-20,-16,40,10); ctx.strokeRect(-20,-16,40,10); ctx.restore();
    ctx.strokeStyle='#3a2a1c'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(-10,-6,8,0,7); ctx.stroke();
    ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-18,-6); ctx.lineTo(-2,-6); ctx.moveTo(-10,-14); ctx.lineTo(-10,2); ctx.stroke();
    ctx.fillStyle='#f4f8fb'; ctx.beginPath(); ctx.ellipse(4,-16,14,3,-0.12,0,7); ctx.fill();
  } else if(k==='statue'){
    drawShadow(0,0,14,5);
    ctx.fillStyle='#7b8490'; ctx.strokeStyle='#2c323a'; ctx.lineWidth=1.2;
    ctx.fillRect(-9,-8,18,8); ctx.strokeRect(-9,-8,18,8);
    ctx.beginPath(); ctx.moveTo(-6,-8); ctx.lineTo(-7,-34); ctx.lineTo(-3,-42); ctx.lineTo(3,-42); ctx.lineTo(6,-30); ctx.lineTo(5,-8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#f4f8fb'; ctx.beginPath(); ctx.moveTo(-3,-42); ctx.lineTo(3,-42); ctx.lineTo(4,-37); ctx.lineTo(-4,-38); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawMountainPassFloor(room, cam){
  const TS = 46;
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    const trailY = forestTrailYAt(room.waypoints, wx);
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const checker = (((Math.floor(wx/TS)+Math.floor(wy/TS))%2)+2)%2;
      const onPath = Math.abs(wy-trailY) < 58;
      if(onPath) ctx.fillStyle = checker ? '#6b6660' : '#5e5a54';
      else ctx.fillStyle = checker ? '#e8eef2' : '#d7e0e6';
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
    }
  }
}
// Withered Crossroads (v69): a light, open grassland checkerboard, deliberately
// brighter/sparser-reading than the Forest's dark mossy green -- reuses the
// exact same tile-grid rendering approach as drawForestFloor/
// drawMountainPassFloor for visual consistency, just with its own "+"-
// shaped road test (see makeSunlitPlains' onRoad()) instead of a single
// winding trail, since this zone's road is a straight north-south/east-west
// crossroad rather than a point-to-point trail.
// v522: the Crossroads are weathered -- rough old rutted roads with ragged verges, broken cobbles and potholes,
// and dead, sun-bleached grass in patches of straw, brown earth and faded olive. The south still fades into the
// Cemetery's blighted ground. Everything here is static, so it is baked into the cached floor chunks.
function drawSunlitPlainsFloor(room, cam){
  const TS = 46;
  const o0 = toIso(0,0), oN = toIso(0,1), oE = toIso(1,0);
  const dNS = {x:oN.x-o0.x, y:oN.y-o0.y}, dEW = {x:oE.x-o0.x, y:oE.y-o0.y};
  if(FLOOR_PASS!==2) for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      if(wx<0||wy<0||wx>room.w||wy>room.h){ const ef = edgeFill(room, wx, wy); if(ef){ ctx.fillStyle = ef; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); } continue; }
      const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS);
      const checker = ((ix+iy)%2+2)%2, hs = tileHash(ix, iy), h2 = tileHash(iy*3+7, ix*5+1);
      const rn = sunRoadNear(room, wx, wy);   // v527: winding roads to gates that move every visit
      const onPath = rn.d < SUN_ROAD_HALFW;
      const verge = !onPath && rn.d < SUN_ROAD_HALFW+TS && h2 < 0.55;   // ragged, worn road edges
      const blight = clamp((wy-(room.h-900))/900,0,1) * clamp(1-(Math.abs(wx-(room.southGate ? room.southGate.x : SUN_CX))-500)/900,0,1);
      const bl = blight*blight*(3-2*blight);
      let base;
      if(onPath) base = hs < 0.15 ? [128,112,84] : hs < 0.55 ? [146,128,94] : [138,121,88];
      else if(verge) base = h2 < 0.25 ? [116,102,72] : [106,94,64];
      else base = hs < 0.18 ? [78,66,46] : hs < 0.30 ? [70,76,46] : hs < 0.62 ? [90,82,52] : [84,77,49];
      const sh = checker ? -3 : 0; base = [base[0]+sh, base[1]+sh, base[2]+sh];
      ctx.fillStyle = mixRGB(base, onPath ? [74,68,80] : [46,48,64], bl);
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
      if(bl > 0.85) continue;
      const ix0 = iso.x, iy0 = iso.y;
      if(onPath){
        const d = {x:dEW.x*rn.ux + dNS.x*rn.uy, y:dEW.y*rn.ux + dNS.y*rn.uy}, n = {x:-dEW.x*rn.uy + dNS.x*rn.ux, y:-dEW.y*rn.uy + dNS.y*rn.ux};
        // two wheel ruts running along the road
        const off = rn.off;
        for(const rr of [-18, 18]){
          const k = rr - off; if(Math.abs(k) > TS*0.5) continue;
          const cx = ix0 + n.x*k, cy = iy0 + n.y*k;
          ctx.strokeStyle = 'rgba(52,40,26,0.42)'; ctx.lineWidth = 2.6;
          ctx.beginPath(); ctx.moveTo(cx - d.x*TS*0.55, cy - d.y*TS*0.55); ctx.lineTo(cx + d.x*TS*0.55, cy + d.y*TS*0.55); ctx.stroke();
          ctx.strokeStyle = 'rgba(160,142,106,0.25)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx - d.x*TS*0.55 + 1, cy - d.y*TS*0.55 - 1.5); ctx.lineTo(cx + d.x*TS*0.55 + 1, cy + d.y*TS*0.55 - 1.5); ctx.stroke();
        }
        // a few surviving cobbles, cracked and sunken
        if(hs > 0.45){
          for(let c=0;c<3;c++){
            const u = tileHash(ix*7+c, iy*11-c), v = tileHash(ix*13-c, iy*3+c*5);
            const px = ix0 + (u-0.5)*TS*0.75, py = iy0 + (v-0.5)*TS*0.36, r = 3 + u*2.5;
            ctx.fillStyle = 'rgba(96,90,82,0.85)'; ctx.beginPath(); ctx.moveTo(px-r, py); ctx.lineTo(px-r*0.3, py-r*0.5); ctx.lineTo(px+r, py-r*0.25); ctx.lineTo(px+r*0.6, py+r*0.45); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(150,142,126,0.5)'; ctx.fillRect(px-r*0.5, py-r*0.4, r*0.9, 1);
          }
        }
        // potholes with puddle-dark centres
        if(h2 < 0.12){ ctx.fillStyle = 'rgba(46,36,24,0.55)'; ctx.beginPath(); ctx.ellipse(ix0+(hs-0.5)*14, iy0+2, 7, 3.2, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(150,130,96,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
        // hairline cracks in the packed earth
        if(h2 > 0.7){ ctx.strokeStyle = 'rgba(48,36,22,0.35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(ix0-10, iy0-2); ctx.lineTo(ix0-3, iy0+1); ctx.lineTo(ix0+2, iy0-3); ctx.lineTo(ix0+9, iy0); ctx.stroke(); }
      } else {
        // dead grass: short straw strokes, bare earth patches and the odd pebble
        if(hs > 0.3){
          ctx.lineWidth = 1; ctx.lineCap = 'round';
          for(let k=0;k<4;k++){
            const u = tileHash(ix*5+k, iy*9-k), v = tileHash(ix*2-k, iy*7+k*3);
            const px = ix0 + (u-0.5)*TS*0.8, py = iy0 + (v-0.5)*TS*0.38, lean = (u-0.5)*4;
            ctx.strokeStyle = k%2 ? 'rgba(170,150,96,0.55)' : 'rgba(118,100,62,0.6)';
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px+lean, py-4-v*3); ctx.moveTo(px+2, py); ctx.lineTo(px+2+lean*1.4, py-3-u*3); ctx.stroke();
          }
        }
        if(h2 < 0.14){ ctx.fillStyle = 'rgba(92,74,50,0.5)'; ctx.beginPath(); ctx.ellipse(ix0+(hs-0.5)*16, iy0, 10+hs*6, 4+hs*2, 0, 0, 7); ctx.fill(); }
        if(h2 > 0.9){ ctx.fillStyle = 'rgba(120,114,100,0.8)'; ctx.beginPath(); ctx.ellipse(ix0+(hs-0.5)*20, iy0+(h2-0.95)*40, 2.2, 1.3, 0, 0, 7); ctx.fill(); }
      }
    }
  }
  for(const o of (room.obstacles||[])){ if(o.kind==='pond'){ const io = toIso(o.x+o.w/2,o.y+o.h/2); const sx=io.x-cam.x, sy=io.y-cam.y; if(sx>-300 && sx<W+300 && sy>-260 && sy<H+260) drawPondIso(o, (game&&game.clock)||0); } }
}
// Lakeside Ruins (v71): same tile-grid rendering approach as the other
// overworld zones, but with FOUR tile categories instead of two -- island
// (innermost), water, bridge/road, and shoreline grass, checked in that
// priority order per tile. The lake's actual collision (obstacles: room)
// is just two rectangles (see makeLakesideRuins) with a road-width gap;
// this tiling reproduces that exact same geometry purely visually so the
// painted water/bridge/island line up pixel-for-pixel with where the
// player can and can't actually walk.
// v215: redesigned shoreline + bridge. Water gets depth bands (pale shallows -> deep), animated foam and sparkles
// along the bank; the land gets a wet-sand/mud beach; the bridge is laid stone slabs with low parapet rails and
// pier shadows; the island gets a mossy stone rim.
function lakeNearWater(wx,wy,TS,maxK){
  for(let k=1;k<=maxK;k++){
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){
      if((dx||dy) && lakeWaterAt(wx+dx*k*TS, wy+dy*k*TS)) return k;
    }
  }
  return 0;
}
function lakeShoreDist(wx,wy,TS,maxK){
  for(let k=1;k<=maxK;k++){
    for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++){
      if((dx||dy) && !lakeWaterAt(wx+dx*k*TS, wy+dy*k*TS)) return k;
    }
  }
  return maxK+1;
}
function drawLakesideRuinsFloor(room, cam){
  const TS = 46, clk = (game&&game.clock)||0;
  const rails = [];
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    const inWaterX = wx > LAKE_WATER_X && wx < LAKE_WATER_X+LAKE_WATER_W;
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      if(wx<0||wy<0||wx>room.w||wy>room.h){ const ef = edgeFill(room, wx, wy); if(ef){ if(FLOOR_PASS!==2){ ctx.fillStyle = ef; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); } continue; } }
      const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS);
      const checker = (((ix+iy)%2)+2)%2;
      const hsh = tileHash(ix,iy);
      const onIsland = lakeOnIsland(wx,wy);
      const onBridge = lakeOnBridge(wx,wy), rdD = onBridge ? 0 : lakeRoadDist(wx,wy), onRoad = onBridge || rdD < SUN_ROAD_HALFW;   // v530: winding land roads
      const inWater = lakeWaterAt(wx,wy);
      let shore = 0;
      const wTile = !onIsland && inWater, fpSkip = FLOOR_PASS===1 ? wTile : FLOOR_PASS===2 ? !wTile : false;
      if(onIsland){
        const nearW = inWaterX ? lakeNearWater(wx,wy,TS,1) : 0;
        ctx.fillStyle = nearW ? (checker ? '#5a5648' : '#524e42') : (checker ? '#6a6556' : '#5f5b4e');
      } else if(inWater){
        const sd = lakeShoreDist(wx,wy,TS,3);
        const shimmer = (Math.floor((wx+wy)/TS*0.5 + clk*1.2) % 2 + 2) % 2;
        const pal = sd===1 ? ['#4f6e66','#48665e'] : sd===2 ? ['#375654','#314e4c'] : sd===3 ? ['#28434a','#233d43'] : ['#1d343c','#1a2f36'];
        ctx.fillStyle = pal[(checker^shimmer)?0:1];
        shore = sd;
      } else if(onRoad){
        if(onBridge){
          // laid stone slabs, alternate courses darker, a faint cracked slab now and then
          const course = (((Math.floor(wx/TS)*1)+iy)%3+3)%3;
          ctx.fillStyle = course===0 ? '#6f6a5e' : course===1 ? '#666157' : '#767064';
        } else ctx.fillStyle = hsh < 0.2 ? '#6a5a40' : (checker ? '#76664a' : '#6c5d42');
      } else {
        const nw = lakeNearWater(wx,wy,TS,2);
        if(rdD < SUN_ROAD_HALFW+TS && tileHash(iy*3+7, ix*5+1) < 0.55) ctx.fillStyle = checker ? '#5a5038' : '#544a34';   // worn road verge
        else if(nw===1) ctx.fillStyle = checker ? '#5e5442' : '#564d3c';       // wet sand / mud right at the water
        else if(nw===2) ctx.fillStyle = checker ? '#4a5236' : '#444c32';  // sparse dry-grass fringe
        else ctx.fillStyle = hsh < 0.07 ? '#323f2a' : hsh > 0.94 ? '#454332' : (checker ? '#3b4a2f' : '#3f4f33');   // v456: dark, overgrown grass
      }
      if(fpSkip){
        if(FLOOR_PASS===2 && onBridge && !onIsland){ if(lakeWaterAt(wx, wy-TS)) rails.push([wx-TS/2, wy-TS/2, wx+TS/2, wy-TS/2, -1]); if(lakeWaterAt(wx, wy+TS)) rails.push([wx-TS/2, wy+TS/2, wx+TS/2, wy+TS/2, 1]); }
        continue;
      }
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
      if(inWater){
        if(shore===1){
          // animated foam line + lapping wavelets on the bank-side tiles
          const a = 0.22 + 0.16*Math.sin(clk*2 + wx*0.03 + wy*0.02);
          ctx.strokeStyle = 'rgba(255,255,255,'+a+')'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(iso.x-TS*ISO_KX*0.6, iso.y); ctx.lineTo(iso.x, iso.y-TS*ISO_KY*0.6); ctx.lineTo(iso.x+TS*ISO_KX*0.6, iso.y); ctx.stroke();
        }
        if(hsh>0.86){
          const a = 0.25 + 0.25*Math.sin(clk*3 + hsh*40);
          ctx.fillStyle = 'rgba(235,250,255,'+Math.max(0,a)+')';
          ctx.fillRect(iso.x + (hsh*9%1-0.5)*TS*0.6, iso.y + (hsh*17%1-0.5)*TS*0.3, 2, 1.2);
        }
      } else if(onBridge && !onIsland){
        // slab joints
        ctx.strokeStyle = 'rgba(40,36,28,0.22)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(iso.x-TS*ISO_KX, iso.y); ctx.lineTo(iso.x, iso.y+TS*ISO_KY); ctx.lineTo(iso.x+TS*ISO_KX, iso.y); ctx.stroke();
        if(hsh>0.9){ ctx.fillStyle='rgba(70,110,60,0.35)'; ctx.beginPath(); ctx.ellipse(iso.x+(hsh*7%1-0.5)*18, iso.y+(hsh*13%1-0.5)*8, 4, 1.8, 0, 0, 7); ctx.fill(); }
        // parapet rails on the water-facing sides (queued, drawn after the deck so no tile overwrites them)
        if(lakeWaterAt(wx, wy-TS)) rails.push([wx-TS/2, wy-TS/2, wx+TS/2, wy-TS/2, -1]);
        if(lakeWaterAt(wx, wy+TS)) rails.push([wx-TS/2, wy+TS/2, wx+TS/2, wy+TS/2, 1]);
      } else if(!onRoad && !onIsland){
        // pebbles/reeds on the beach
        const nw = lakeNearWater(wx,wy,TS,1);
        if(nw && hsh>0.6){
          ctx.fillStyle = 'rgba(90,80,60,0.5)';
          ctx.beginPath(); ctx.ellipse(iso.x+(hsh*11%1-0.5)*20, iso.y+(hsh*5%1-0.5)*8, 2.2, 1.2, 0, 0, 7); ctx.fill();
        }
      }
    }
  }
  if(FLOOR_PASS!==1) for(const r of rails){
    const A = toIso(r[0],r[1]), B = toIso(r[2],r[3]);
    const ax = A.x, ay = A.y, bx = B.x, by = B.y;
    if(Math.max(ax,bx)-cam.x<-80||Math.min(ax,bx)-cam.x>W+80||Math.min(ay,by)-cam.y>H+80||Math.max(ay,by)-cam.y<-80) continue;
    ctx.lineCap = 'butt';
    ctx.strokeStyle = 'rgba(10,30,36,0.45)'; ctx.lineWidth = 5;                       // shadow cast onto the water
    ctx.beginPath(); ctx.moveTo(ax, ay+3); ctx.lineTo(bx, by+3); ctx.stroke();
    ctx.strokeStyle = '#5a564c'; ctx.lineWidth = 4;                                    // parapet side face
    ctx.beginPath(); ctx.moveTo(ax, ay+1); ctx.lineTo(bx, by+1); ctx.stroke();
    ctx.strokeStyle = '#bdb6a2'; ctx.lineWidth = 2;                                    // parapet cap
    ctx.beginPath(); ctx.moveTo(ax, ay-2); ctx.lineTo(bx, by-2); ctx.stroke();
  }
}
// Cursed Cemetery (v72): same tile-grid rendering approach as every other
// overworld zone (a straight north-south path, cemOnRoad()), but in a
// dark blue-gray/purple NIGHT palette instead of any daylight ground
// color -- the "dark-toned zone" ask from the brief, kept a shade lighter
// than the sky gradient above it so the ground plane still reads clearly
// against it rather than blending into a flat black.
function drawCemeteryFloor(room, cam){
  const TS = 46;
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    const onPathX = cemOnRoad(wx, CEM_H/2); // cemOnRoad only depends on x
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      if(wx<0||wy<0||wx>room.w||wy>room.h){ const ef = edgeFill(room, wx, wy); if(ef){ if(FLOOR_PASS!==2){ ctx.fillStyle = ef; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); } continue; } }
      const checker = (((Math.floor(wx/TS)+Math.floor(wy/TS))%2)+2)%2;
      if(onPathX) ctx.fillStyle = checker ? '#3a3448' : '#332e40';
      else ctx.fillStyle = checker ? '#20233a' : '#262a42';
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
    }
  }
}
// A low wooden fence frames the town square instead of dungeon stone walls,
// with a gap left open on the right where the road leads out to the Forest.
// v196: a squat stone gatepost with an iron lantern cage, flanking Mistfall's road exit
function drawGatePillarIso(gp, clock){
  drawBlock({x:gp.x-10,y:gp.y,w:24,h:14}, 6, '#5a5e6c','#1c1e28','#30333f');
  drawBlock({x:gp.x-6,y:gp.y+1,w:16,h:12}, 58, '#666a78','#1a1c26','#2e313d');
  ctx.save(); ctx.translate(0,-54); drawBlock({x:gp.x-9,y:gp.y-1,w:22,h:16}, 7, '#70747f','#1e202a','#363946'); ctx.restore();   // capstone on top of the shaft
  const iso = toIso(gp.x+2, gp.y+7), t = clock||0;
  const ly = iso.y-58-16;
  ctx.save();
  ctx.strokeStyle = '#111219'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(iso.x,ly-4); ctx.lineTo(iso.x,ly+3); ctx.stroke();
  ctx.fillStyle = '#20222c'; ctx.fillRect(iso.x-5,ly+3,10,11); ctx.strokeRect(iso.x-5,ly+3,10,11);
  const fl = 0.75+0.25*Math.sin(t*6+gp.y);
  ctx.fillStyle = 'rgba(255,170,80,'+(0.55*fl)+')'; ctx.fillRect(iso.x-3,ly+5,6,7);
  ctx.restore();
}
function drawTownPerimeter(room){
  const wt=9, hz=24, top='#565a68', right='#1a1c24', front='#2c2f3a';
  const roadY = room.roadY||170, gap=50;
  drawBlock({x:-wt,y:-wt,w:room.w+wt*2,h:wt}, hz, top,right,front);
  drawBlock({x:TOWN_SHORE_X,y:room.h,w:room.w+wt-TOWN_SHORE_X,h:wt}, hz, top,right,front);   // v384: open water in the SW corner
  drawBlock({x:-wt,y:0,w:wt,h:TOWN_SHORE_Y}, hz, top,right,front);
  drawBlock({x:room.w,y:0,w:wt,h:roadY-gap}, hz, top,right,front);
  drawBlock({x:room.w,y:roadY+gap,w:wt,h:room.h-(roadY+gap)}, hz, top,right,front);
}
function drawTreeIso(t){
  const iso = toIso(t.x,t.y), sc = t.s||1, dk = !!t.dark;
  drawShadow(iso.x, iso.y, 15*sc, 6.5*sc);
  ctx.save(); ctx.translate(iso.x, iso.y); if(sc!==1) ctx.scale(sc,sc);
  ctx.fillStyle='#4a3220'; ctx.fillRect(-3,-20,6,20);
  ctx.strokeStyle='#241a10'; ctx.lineWidth=1; ctx.strokeRect(-3,-20,6,20);
  for(let i=0;i<3;i++){
    const w = 24-i*6, topY=-22-i*13, baseY=-8-i*13;
    const grd = ctx.createLinearGradient(-w/2,topY,w/2,baseY);
    if(dk){ grd.addColorStop(0,'#2f5c3a'); grd.addColorStop(1,'#123219'); } else { grd.addColorStop(0,'#4a8a4e'); grd.addColorStop(1,'#245a2c'); }
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.moveTo(0,topY); ctx.lineTo(-w/2,baseY); ctx.lineTo(w/2,baseY); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1; ctx.stroke();
  }
  ctx.restore();
}
// Cursed Cemetery's dead tree (v72): a visually distinct "gnarled, bare,
// leafless" variant of drawTreeIso above -- same trunk-scale/shadow
// treatment, but the leafy triangular canopy is replaced entirely by a
// handful of thin, forking bare branches (no fill shapes at all above the
// trunk), in a dark gray-brown palette instead of any green, per the
// brief's explicit "old dead trees... no leafy canopy" ask.
function drawDeadTreeIso(t){
  const iso = toIso(t.x,t.y);
  const s = t.s||1;
  drawShadow(iso.x, iso.y, 14*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  // gnarled trunk -- a slightly bent silhouette rather than a plain
  // rectangle, to read as old/twisted rather than a young sapling.
  ctx.fillStyle='#3a352e';
  ctx.beginPath();
  ctx.moveTo(-4,0); ctx.lineTo(-3,-18); ctx.lineTo(1,-34); ctx.lineTo(4,-34); ctx.lineTo(2,-18); ctx.lineTo(3,0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#1c1912'; ctx.lineWidth=1; ctx.stroke();
  // bare, forking branches -- plain strokes, no leaf fill of any kind
  ctx.strokeStyle='#4a443a'; ctx.lineWidth=2; ctx.lineCap='round';
  const branches = [
    [[1,-30],[-11,-42],[-16,-50]], [[1,-30],[-11,-42],[-6,-52]],
    [[2,-32],[12,-44],[18,-52]], [[2,-32],[12,-44],[7,-54]],
    [[1,-34],[-2,-48],[-8,-58]], [[1,-34],[-2,-48],[3,-56]],
  ];
  for(const b of branches){
    ctx.beginPath(); ctx.moveTo(b[0][0],b[0][1]); ctx.lineTo(b[1][0],b[1][1]); ctx.lineTo(b[2][0],b[2][1]); ctx.stroke();
  }
  ctx.restore();
}
// Mountain Pass's decorative boulder scatter -- the same purely-cosmetic
// role as the Forest's trees (not in room.obstacles, so nothing blocks
// movement), just a simple low-poly gray rock with a snow cap on top.
function drawRockIso(rk){
  const iso = toIso(rk.x,rk.y);
  const s = rk.s||1;
  drawShadow(iso.x, iso.y, 15*s, 6.5*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  ctx.fillStyle='#7d838c';
  ctx.beginPath();
  ctx.moveTo(-14,-1); ctx.lineTo(-9,-15); ctx.lineTo(5,-18); ctx.lineTo(14,-5); ctx.lineTo(9,6); ctx.lineTo(-6,7);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#3e4348'; ctx.lineWidth=1; ctx.stroke();
  // snow cap along the top edge
  ctx.fillStyle='#f0f5f8';
  ctx.beginPath(); ctx.moveTo(-9,-15); ctx.lineTo(5,-18); ctx.lineTo(1,-10); ctx.lineTo(-6,-9); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// Withered Crossroads' own boulder scatter (v69) -- same purely-cosmetic role and
// low-poly silhouette as drawRockIso above, just without the Mountain
// Pass's snow cap (this zone is sunny grassland, not a snowline) and in a
// warmer tan-gray palette to fit the open plains look.
function drawPlainsRockIso(rk){
  const iso = toIso(rk.x,rk.y);
  const s = rk.s||1;
  drawShadow(iso.x, iso.y, 14*s, 6*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  ctx.fillStyle='#9c9078';
  ctx.beginPath();
  ctx.moveTo(-13,-1); ctx.lineTo(-8,-13); ctx.lineTo(5,-16); ctx.lineTo(13,-4); ctx.lineTo(8,6); ctx.lineTo(-6,6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#5c543e'; ctx.lineWidth=1; ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.moveTo(-8,-13); ctx.lineTo(5,-16); ctx.lineTo(0,-8); ctx.lineTo(-6,-7); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// Withered Crossroads' sparse grass-tuft scatter (v69) -- a handful of simple
// blade shapes, the zone's other decoration alongside its boulders; kept
// deliberately cheap (a few strokes, no gradient) since a much larger
// number of these are scattered than the Forest's trees.
function drawGrassTuftIso(t){
  const iso = toIso(t.x,t.y);
  const s = t.s||1;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  ctx.strokeStyle=t.c||'#5a8a3a'; ctx.lineWidth=2; ctx.lineCap='round';
  for(const dx of [-4,-1,2,5]){
    ctx.beginPath(); ctx.moveTo(dx,2); ctx.quadraticCurveTo(dx+(dx<0.5?-2:2), -6, dx+(dx<0.5?-1:1), -10); ctx.stroke();
  }
  ctx.restore();
}
// Lakeside Ruins island landmark (v71): one tall weathered stone pillar --
// a set of these placed in a ring (see makeLakesideRuins' islandStones) is
// the island's "Stonehenge". Purely decorative/atmospheric, modeled on the
// same flat static-prop drawing approach as the Forest's tree/Mountain
// Pass's rock scatter -- a simple tapered gray monolith with a darker
// weathered face and a mossy-crack flourish, tall enough to read as a
// landmark at the zone's normal camera distance.
function drawLakesideStoneIso(st){
  const iso = toIso(st.x,st.y);
  drawShadow(iso.x, iso.y, 20, 8);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#6b6a62';
  ctx.beginPath();
  ctx.moveTo(-10,4); ctx.lineTo(-8,-52); ctx.lineTo(-4,-62); ctx.lineTo(4,-62); ctx.lineTo(8,-52); ctx.lineTo(10,4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#33322c'; ctx.lineWidth=1.4; ctx.stroke();
  // a darker weathered face down one side
  ctx.fillStyle='rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.moveTo(0,-60); ctx.lineTo(4,-60); ctx.lineTo(9,2); ctx.lineTo(2,2); ctx.closePath(); ctx.fill();
  // moss/crack streaks
  ctx.strokeStyle='rgba(120,150,90,0.4)'; ctx.lineWidth=1.5; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-5,-30); ctx.lineTo(-6,-6); ctx.stroke();
  ctx.strokeStyle='rgba(20,18,14,0.5)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(3,-45); ctx.lineTo(1,-20); ctx.stroke();
  ctx.restore();
}
// Cursed Cemetery's grave/tombstone scatter (v72) -- the zone's defining
// decoration per the brief ("filled with old graves and tombstones"). Two
// simple weathered-stone silhouettes chosen per-grave (gr.cross): a
// rounded headstone, or a plain grave cross -- both drawn as flat static
// props exactly like the Forest's tree/Mountain Pass's rock scatter, just
// in a pale weathered-stone palette that reads clearly against this
// zone's dark night ground.
function drawGraveIso(gr){
  const iso = toIso(gr.x,gr.y);
  const s = gr.s||1, rot = gr.rot||0;
  drawShadow(iso.x, iso.y, 11*s, 5*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s); ctx.rotate(rot);
  if(gr.cross){
    ctx.fillStyle='#8c8778';
    ctx.beginPath(); ctx.moveTo(-2,2); ctx.lineTo(-2,-22); ctx.lineTo(2,-22); ctx.lineTo(2,2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-9,-14); ctx.lineTo(-9,-10); ctx.lineTo(9,-10); ctx.lineTo(9,-14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#33312a'; ctx.lineWidth=1;
    ctx.strokeRect(-2,-22,4,24); ctx.strokeRect(-9,-14,18,4);
  } else {
    ctx.fillStyle='#948e7c';
    ctx.beginPath();
    ctx.moveTo(-8,2); ctx.lineTo(-8,-10); ctx.quadraticCurveTo(-8,-19,0,-19); ctx.quadraticCurveTo(8,-19,8,-10); ctx.lineTo(8,2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#3a382e'; ctx.lineWidth=1.2; ctx.stroke();
    // a faint weathered crack down the face
    ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-2,-16); ctx.lineTo(1,-2); ctx.stroke();
  }
  ctx.restore();
}
// The Cursed Cemetery's sealed tomb (v72) -- present from the very first
// visit, drawn either sealed/locked or unlocked/open based purely on the
// `unlocked` flag (p.cemeteryCleared), same "one static prop with two
// visual states" pattern drawWaypointIso already uses for its lit/dormant
// portal look. Sealed: a plain stone mausoleum face with a barred, dark
// (non-glowing) doorway -- clearly a closed structure, no opening. Once
// unlocked: the bars are gone, the doorway glows faintly with a cold blue
// light (echoing the Skeleton's own eye-glow color) inviting the player in,
// same "add a glow the locked state never had" cue drawLighthouseDoorIso/
// drawRuinsGateIso use for their own gates.
// Slab of ancient runes on the Lakeside island -- glows once the Ruins Map is in the bag.
function drawRuinsSlabIso(pos, clock, active){
  const iso = toIso(pos.x, pos.y), t = clock||0;
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle = '#3c3a34'; ctx.beginPath(); ctx.ellipse(0,0,34,15,0,0,7); ctx.fill();
  ctx.strokeStyle = '#1c1a16'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.strokeStyle = active ? 'rgba(58,212,255,'+(0.55+Math.sin(t*3)*0.3)+')' : '#6a655a';
  ctx.lineWidth = 2;
  if(active){ ctx.shadowColor = '#3ad4ff'; ctx.shadowBlur = 10; }
  ctx.beginPath(); ctx.ellipse(0,0,22,9,0,0,7); ctx.stroke();
  for(let i=0;i<6;i++){ const a=i*Math.PI/3; ctx.beginPath(); ctx.moveTo(Math.cos(a)*22, Math.sin(a)*9); ctx.lineTo(Math.cos(a)*30, Math.sin(a)*12); ctx.stroke(); }
  ctx.restore();
}
function drawTombIso(pos, clock, unlocked, variant){
  const iso = toIso(pos.x, pos.y);
  const t = clock||0;
  const ruins = variant==='ruins';
  drawShadow(iso.x, iso.y+6, 46, 18);
  ctx.save(); ctx.translate(iso.x, iso.y);
  // big weathered stone mausoleum face
  const faceGrad = ctx.createLinearGradient(-36,-64,36,4);
  faceGrad.addColorStop(0, ruins ? '#6a6448' : unlocked ? '#4a4658' : '#4a473e');
  faceGrad.addColorStop(1, ruins ? '#3a3624' : unlocked ? '#26243a' : '#26241c');
  ctx.fillStyle = faceGrad;
  roundRect(-36,-58,72,58,5); ctx.fill();
  ctx.strokeStyle='#151310'; ctx.lineWidth=1.6; ctx.stroke();
  // stepped roof cap
  ctx.fillStyle = ruins ? '#544e38' : unlocked ? '#3a3850' : '#3a3830';
  ctx.beginPath(); ctx.moveTo(-40,-58); ctx.lineTo(40,-58); ctx.lineTo(30,-70); ctx.lineTo(-30,-70); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#151310'; ctx.lineWidth=1.2; ctx.stroke();
  // the doorway itself
  ctx.fillStyle = '#08070a';
  roundRect(-16,-46,32,46,3); ctx.fill();
  if(unlocked){
    const pulse = 0.6+Math.sin(t*2.2)*0.25;
    ctx.save();
    const glow = ctx.createRadialGradient(0,-20,1,0,-20,20*pulse);
    glow.addColorStop(0,'rgba(58,212,255,0.55)'); glow.addColorStop(1,'rgba(58,212,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(0,-20,20*pulse,24*pulse,0,0,7); ctx.fill();
    ctx.restore();
  } else {
    // sealed: heavy iron bars across the doorway, and a chained-shut plaque
    ctx.strokeStyle='#2a2622'; ctx.lineWidth=3;
    for(const bx of [-9,-1,7]){ ctx.beginPath(); ctx.moveTo(bx,-46); ctx.lineTo(bx,0); ctx.stroke(); }
    ctx.strokeStyle='#3a352c'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(-16,-30); ctx.lineTo(16,-24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16,-16); ctx.lineTo(16,-10); ctx.stroke();
  }
  // a carved rune/skull marker above the doorway
  ctx.fillStyle = unlocked ? '#3ad4ff' : '#6a655a';
  ctx.beginPath(); ctx.arc(0,-52,4.5,0,7); ctx.fill();
  ctx.restore();
}
