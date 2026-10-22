// ---------------- River Valley rendering (v233) ----------------
function rvCol(a,b,t){ return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')'; }
const RV_FA=[19,41,27], RV_FB=[23,51,32], RV_PA=[143,187,94], RV_PB=[159,200,106];
const RV_RF=[[94,77,55],[84,69,47]], RV_RP=[[201,184,128],[189,174,116]];
function rvNearWaterK(wx,wy,TS,maxK){
  for(let k=1;k<=maxK;k++) for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) if((dx||dy) && rvWaterAt(wx+dx*k*TS, wy+dy*k*TS)) return k;
  return 0;
}
function rvShoreDist(wx,wy,TS,maxK){
  for(let k=1;k<=maxK;k++) for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) if((dx||dy) && !rvWaterAt(wx+dx*k*TS, wy+dy*k*TS)) return k;
  return maxK+1;
}
function drawRiverValleyFloor(room, cam){
  const TS = 46, clk = (game&&game.clock)||0, bc = rvRiverY(RV_BX), bhw = rvRiverHW(RV_BX);
  const plateau = [];
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(wx<=RV_CLIFF_W){ const sy2 = sy-RV_CLIFF_H; if(sx>-80 && sx<W+80 && sy2>-80 && sy2<H+80) plateau.push([wx,wy]); continue; }
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS), checker = (((ix+iy)%2)+2)%2, hsh = tileHash(ix,iy);
      const bl = rvBlend(wy);
      const onBridge = Math.abs(wx-RV_BX) < RV_BRIDGE_HW && Math.abs(wy-bc) < bhw+34;
      if(onBridge){
        if(FLOOR_PASS===2) continue;
        const plank = ((iy%3)+3)%3;
        ctx.fillStyle = plank===0 ? '#8a6a42' : plank===1 ? '#7a5c38' : '#94744a';
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        ctx.strokeStyle = 'rgba(30,18,8,0.5)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(iso.x-TS*ISO_KX*0.5, iso.y-TS*ISO_KY*0.5); ctx.lineTo(iso.x+TS*ISO_KX*0.5, iso.y+TS*ISO_KY*0.5); ctx.stroke();
        if(hsh>0.93){ ctx.fillStyle = '#245c68'; ctx.beginPath(); ctx.moveTo(iso.x-7,iso.y-2); ctx.lineTo(iso.x+2,iso.y-6); ctx.lineTo(iso.x+8,iso.y+1); ctx.lineTo(iso.x-1,iso.y+5); ctx.closePath(); ctx.fill(); }
        else if(hsh<0.12){ ctx.fillStyle='rgba(70,110,60,0.45)'; ctx.beginPath(); ctx.ellipse(iso.x+(hsh*70%1-0.5)*16, iso.y, 6, 2.4, 0, 0, 7); ctx.fill(); }
        continue;
      }
      if(rvWaterAt(wx,wy)){
        if(FLOOR_PASS===1) continue;
        const sd = rvShoreDist(wx,wy,TS,3);
        const shimmer = (Math.floor((wx-wy*0.3)/TS*0.6 - clk*1.1) % 2 + 2) % 2;
        const pal = sd===1 ? ['#86d0c8','#78c4bd'] : sd===2 ? ['#56aab0','#4c9fa8'] : sd===3 ? ['#3d8ca4','#35809a'] : ['#2f7496','#286a8c'];
        ctx.fillStyle = pal[(checker^shimmer)?0:1];
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(sd===1){
          const a = 0.24 + 0.16*Math.sin(clk*2 + wx*0.03 + wy*0.02);
          ctx.strokeStyle = 'rgba(255,255,255,'+a+')'; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(iso.x-TS*ISO_KX*0.6, iso.y); ctx.lineTo(iso.x, iso.y-TS*ISO_KY*0.6); ctx.lineTo(iso.x+TS*ISO_KX*0.6, iso.y); ctx.stroke();
        }
        if(hsh>0.78){   // current streaks drifting east
          const off = ((clk*26 + hsh*200) % (TS*1.2)) - TS*0.6;
          ctx.strokeStyle = 'rgba(235,250,255,0.34)'; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(iso.x+off-9, iso.y+off*0.5-2); ctx.lineTo(iso.x+off+9, iso.y+off*0.5+2); ctx.stroke();
        }
        continue;
      }
      if(FLOOR_PASS===2) continue;
      const road = rvRoadDist(wx,wy) < RV_ROAD_HW;
      if(!road && rvTrailDist(wx,wy) < RV_TRAIL_HW){   // v527: the dirt trail to the Minotaur Cave -- paler, patchy, with grass breaking through
        ctx.fillStyle = rvCol(hsh<0.4?[60,50,34]:[70,58,40], hsh<0.4?[150,132,96]:[160,142,104], bl);
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hsh>0.6){ ctx.strokeStyle = 'rgba(70,110,50,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(iso.x-6,iso.y+2); ctx.lineTo(iso.x-5,iso.y-4); ctx.moveTo(iso.x+5,iso.y+1); ctx.lineTo(iso.x+6,iso.y-5); ctx.stroke(); }
        continue;
      }
      if(road){
        ctx.fillStyle = rvCol(hsh<0.5?RV_RF[0]:RV_RF[1], hsh<0.5?RV_RP[0]:RV_RP[1], bl);
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hsh>0.72){ ctx.fillStyle = 'rgba(150,134,104,0.55)'; ctx.beginPath(); ctx.ellipse(iso.x-8,iso.y+2,3,1.6,0,0,7); ctx.ellipse(iso.x+7,iso.y-3,2.4,1.3,0,0,7); ctx.fill(); }
        else if(hsh<0.2){ ctx.strokeStyle='rgba(30,22,14,0.3)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(iso.x-16,iso.y-3); ctx.lineTo(iso.x+16,iso.y+3); ctx.stroke(); }
        continue;
      }
      const nw = rvNearWaterK(wx,wy,TS,2);
      if(nw===1){ ctx.fillStyle = rvCol(checker?[72,66,46]:[66,60,42], checker?[176,160,116]:[166,150,108], bl); }
      else if(nw===2){ ctx.fillStyle = rvCol([30,52,34],[138,160,96], bl); }
      else ctx.fillStyle = rvCol(hsh<0.12 ? [14,31,21] : (checker?RV_FA:RV_FB), hsh<0.12 ? [124,170,84] : (checker?RV_PA:RV_PB), bl);
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
      if((Math.floor(hsh*100)%4)===0 && nw!==1){
        ctx.strokeStyle = bl<0.5 ? 'rgba(46,92,54,0.55)' : 'rgba(80,134,56,0.55)'; ctx.lineWidth = 1;
        ctx.beginPath(); for(let k=-1;k<=1;k++){ ctx.moveTo(iso.x+k*7,iso.y+3); ctx.lineTo(iso.x+k*7+k*1.5,iso.y-4); } ctx.stroke();
      }
    }
  }
  // bridge rails + posts (old, a few gaps)
  if(FLOOR_PASS!==1){
    const y0 = bc-bhw-34, y1 = bc+bhw+34;
    for(const side of [-1,1]){
      const ex = RV_BX + side*(RV_BRIDGE_HW-4);
      const A = toIso(ex,y0), B = toIso(ex,y1);
      ctx.lineCap='butt';
      ctx.strokeStyle = 'rgba(10,30,36,0.4)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(A.x,A.y+3); ctx.lineTo(B.x,B.y+3); ctx.stroke();
      for(let yy=y0; yy<=y1; yy+=46){
        const q = toIso(ex,yy), hsh = tileHash(Math.floor(yy/46)+side*5, 77);
        ctx.strokeStyle = '#3a2814'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(q.x,q.y-(hsh>0.85?8:20)); ctx.stroke();
        if(hsh<=0.85 && yy+46<=y1){ const q2 = toIso(ex,yy+46); ctx.strokeStyle = '#6a4c2c'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(q.x,q.y-17); ctx.lineTo(q2.x,q2.y-17); ctx.stroke(); }
      }
    }
  }
  // the raised plateau + cliff face + waterfall along the west edge
  if(FLOOR_PASS!==1) drawRvCliff(room, cam, plateau, clk);
  for(const o of room.obstacles){ if(o.kind==='pond'){ const io = toIso(o.x+o.w/2,o.y+o.h/2); const sx=io.x-cam.x, sy=io.y-cam.y; if(sx>-300 && sx<W+300 && sy>-260 && sy<H+260) drawPondIso(o, clk); } }
}
function drawRvCliff(room, cam, plateau, clk){
  const TS = 46, H0 = RV_CLIFF_H, wf = room.waterfall;
  // plateau top (raised): mossy grey rock with the stream running across it to the lip
  for(const [wx,wy] of plateau){
    const iso = toIso(wx,wy), sy = iso.y - H0;
    const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS), checker = (((ix+iy)%2)+2)%2, hsh = tileHash(ix,iy);
    const inStream = Math.abs(wy-wf.y) < wf.hw*0.92;
    if(inStream){
      const shimmer = (Math.floor((wx)/TS*0.6 - clk*1.6) % 2 + 2) % 2;
      ctx.fillStyle = (checker^shimmer) ? '#7cc4c6' : '#6fb8bd';
    } else {
      ctx.fillStyle = hsh<0.15 ? '#56634a' : (checker ? '#7a8468' : '#6e785f');
    }
    drawDiamond(iso.x, sy, TS*ISO_KX*1.03, TS*ISO_KY*1.03);
    if(!inStream && hsh>0.82){ ctx.fillStyle='rgba(40,60,34,0.4)'; ctx.beginPath(); ctx.ellipse(iso.x+(hsh*9%1-0.5)*20, sy, 7, 3, 0, 0, 7); ctx.fill(); }
  }
  // the face (x = RV_CLIFF_W), 60-unit segments
  const SEG = 60, X = RV_CLIFF_W;
  for(let y0=-GROUND_MARGIN; y0<room.h+GROUND_MARGIN; y0+=SEG){
    const a = toIso(X,y0), b = toIso(X,y0+SEG);
    const minX = Math.min(a.x,b.x)-cam.x, maxX = Math.max(a.x,b.x)-cam.x;
    if(maxX<-60 || minX>W+60 || Math.min(a.y,b.y)-H0-cam.y>H+60 || Math.max(a.y,b.y)-cam.y<-60) continue;
    const mid = y0+SEG/2, inFall = Math.abs(mid-wf.y) < wf.hw;
    const hs = tileHash(Math.floor(y0/SEG), 911);
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(b.x,b.y-H0); ctx.lineTo(a.x,a.y-H0); ctx.closePath();
    if(inFall){
      const g2 = ctx.createLinearGradient(0,a.y-H0,0,a.y);
      g2.addColorStop(0,'#dff6fb'); g2.addColorStop(0.6,'#a8dff0'); g2.addColorStop(1,'#eaffff');
      ctx.fillStyle = g2; ctx.fill();
      // falling streaks
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.6;
      for(let k=0;k<4;k++){
        const fx = a.x + (b.x-a.x)*((k+0.5)/4), fy0 = a.y + (b.y-a.y)*((k+0.5)/4);
        const ph = ((clk*1.3 + hs*3 + k*0.27) % 1);
        const yy = fy0 - H0 + ph*H0;
        ctx.beginPath(); ctx.moveTo(fx, yy); ctx.lineTo(fx, Math.min(fy0, yy+34)); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(80,150,180,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo((a.x+b.x)/2,a.y-H0); ctx.lineTo((a.x+b.x)/2,a.y+(b.y-a.y)/2); ctx.stroke();
    } else {
      const g2 = ctx.createLinearGradient(0,a.y-H0,0,a.y);
      g2.addColorStop(0, hs<0.5 ? '#8f8c80' : '#9a9788'); g2.addColorStop(0.55,'#6a675c'); g2.addColorStop(1,'#3e3b34');
      ctx.fillStyle = g2; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 1.2;
      for(const f of [0.3,0.62]){ ctx.beginPath(); ctx.moveTo(a.x,a.y-H0*f+hs*6); ctx.lineTo(b.x,b.y-H0*f-hs*6); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(a.x+(b.x-a.x)*hs,a.y+(b.y-a.y)*hs-H0); ctx.lineTo(a.x+(b.x-a.x)*(hs*0.6+0.2),a.y+(b.y-a.y)*(hs*0.6+0.2)-H0*0.3); ctx.stroke();
      // moss along the lip + ivy drip
      ctx.fillStyle = 'rgba(70,110,52,0.75)'; ctx.beginPath(); ctx.moveTo(a.x,a.y-H0); ctx.lineTo(b.x,b.y-H0); ctx.lineTo(b.x,b.y-H0+10+hs*10); ctx.lineTo(a.x,a.y-H0+8+hs*8); ctx.closePath(); ctx.fill();
      if(hs>0.6){ ctx.strokeStyle='rgba(60,100,48,0.8)'; ctx.lineWidth=2; const ix2 = a.x+(b.x-a.x)*0.5; ctx.beginPath(); ctx.moveTo(ix2,a.y-H0+10); ctx.quadraticCurveTo(ix2+3,a.y-H0*0.6,ix2-2,a.y-H0*0.35); ctx.stroke(); }
    }
  }
  // spray, foam and a soft mist where the water lands
  const base = toIso(X+10, wf.y);
  const bx = base.x - cam.x, by = base.y - cam.y;
  if(bx>-260 && bx<W+260 && by>-200 && by<H+260){
    ctx.save();
    for(let k=0;k<9;k++){
      const ph = (clk*0.5 + k/9) % 1, ox = Math.sin(k*2.3+clk)*wf.hw*0.5*ISO_KX;
      ctx.fillStyle = 'rgba(240,252,255,'+(0.5*(1-ph))+')';
      ctx.beginPath(); ctx.ellipse(base.x+ox, base.y-ph*46, 9+ph*14, 4+ph*6, 0, 0, 7); ctx.fill();
    }
    const mg = ctx.createRadialGradient(base.x,base.y-20,6, base.x,base.y-20,170);
    mg.addColorStop(0,'rgba(225,245,250,0.42)'); mg.addColorStop(1,'rgba(225,245,250,0)');
    ctx.fillStyle = mg; ctx.beginPath(); ctx.ellipse(base.x,base.y-20,190,84,0,0,7); ctx.fill();
    ctx.restore();
  }
}
// ---- camp props ----
function drawRvTent(o){
  const iso = toIso(o.x+o.w/2, o.y+o.h/2), d = o.dir||1, tint = o.tint||0;
  const cols = [['#8a3a2a','#5e2418'],['#7a6a48','#4e4230'],['#5a4a3a','#382c22']][tint];
  drawShadow(iso.x, iso.y+4, 44, 15);
  ctx.save(); ctx.translate(iso.x, iso.y+4);
  ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.moveTo(-36,0); ctx.lineTo(0,-50); ctx.lineTo(6,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.moveTo(6,0); ctx.lineTo(0,-50); ctx.lineTo(38,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#1a1008'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-36,0); ctx.lineTo(0,-50); ctx.lineTo(38,0); ctx.closePath(); ctx.stroke();
  ctx.fillStyle='#120c08'; ctx.beginPath(); ctx.moveTo(-2,0); ctx.lineTo(6,-24); ctx.lineTo(14,0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; for(const k of [-18,-8,20,28]){ ctx.beginPath(); ctx.moveTo(k,0); ctx.lineTo(0,-50); ctx.stroke(); }
  ctx.strokeStyle='#3a2814'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,-50); ctx.lineTo(0,-64); ctx.stroke();
  ctx.fillStyle='#b4293f'; ctx.beginPath(); ctx.moveTo(0,-64); ctx.lineTo(d*14,-60); ctx.lineTo(0,-55); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawRvBarricade(o){
  const n = Math.max(2, Math.round(Math.max(o.w,o.h)/22)), horiz = o.w>=o.h;
  for(let i=0;i<n;i++){
    const wx = horiz ? o.x+(i+0.5)*o.w/n : o.x+o.w/2, wy = horiz ? o.y+o.h/2 : o.y+(i+0.5)*o.h/n;
    const iso = toIso(wx,wy), hh = 34+((i*7)%3)*5;
    ctx.save(); ctx.translate(iso.x, iso.y);
    ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0,2,9,3,0,0,7); ctx.fill();
    ctx.fillStyle='#6a4a2a'; ctx.beginPath(); ctx.moveTo(-4,0); ctx.lineTo(-3,-hh); ctx.lineTo(0,-hh-9); ctx.lineTo(3,-hh); ctx.lineTo(4,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#241708'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.restore();
  }
  // cross-rail
  const A = toIso(o.x, o.y+o.h/2), B = toIso(o.x+o.w, o.y+o.h/2);
  ctx.strokeStyle='#4a3420'; ctx.lineWidth=3; ctx.beginPath();
  if(horiz){ ctx.moveTo(A.x,A.y-14); ctx.lineTo(B.x,B.y-14); ctx.moveTo(A.x,A.y-24); ctx.lineTo(B.x,B.y-24); }
  ctx.stroke();
}
function drawRvProp(o, clk){
  if(o.kind==='rvwall') return;   // v527: the invisible switchback wall (dressed with real props)
  if(o.kind==='rvwagon'){ drawRvWagon(o); return; }
  if(o.kind==='rvtent') drawRvTent(o);
  else if(o.kind==='rvbarricade') drawRvBarricade(o);
  else drawPropIso(o, clk);
}
const RV_DECOR_KINDS = {campfire:1, barrel:1, crate:1, banner:1};
function drawRvDecor(d, clk){
  const iso = toIso(d.x,d.y), s = d.s||1;
  ctx.save(); ctx.translate(iso.x, iso.y);
  if(d.k==='campfire'){
    const fl = 0.75+0.25*Math.sin(clk*9+d.x)*Math.sin(clk*4.1);
    const gl = ctx.createRadialGradient(0,-6,4,0,-6,74); gl.addColorStop(0,'rgba(255,170,70,'+(0.34*fl)+')'); gl.addColorStop(1,'rgba(255,120,40,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(0,-4,80,36,0,0,7); ctx.fill();
    ctx.fillStyle='#3a3630'; for(let i=0;i<8;i++){ const a=i/8*6.28; ctx.beginPath(); ctx.ellipse(Math.cos(a)*15,Math.sin(a)*6,4.4,2.8,0,0,7); ctx.fill(); }
    ctx.strokeStyle='#4a3220'; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-10,2); ctx.lineTo(9,-5); ctx.moveTo(10,2); ctx.lineTo(-8,-5); ctx.stroke();
    ctx.fillStyle='#e8541a'; ctx.beginPath(); ctx.moveTo(-8,-3); ctx.quadraticCurveTo(-7,-18*fl-4,0,-26*fl-2); ctx.quadraticCurveTo(7,-16*fl-2,8,-3); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffc94a'; ctx.beginPath(); ctx.moveTo(-4,-3); ctx.quadraticCurveTo(-3,-12*fl,0,-17*fl); ctx.quadraticCurveTo(3,-10*fl,4,-3); ctx.closePath(); ctx.fill();
  } else if(d.k==='barrel'){
    drawShadow(0,3,12*s,4*s);
    ctx.fillStyle='#6a4a28'; ctx.beginPath(); ctx.moveTo(-9*s,0); ctx.quadraticCurveTo(-12*s,-12*s,-9*s,-24*s); ctx.lineTo(9*s,-24*s); ctx.quadraticCurveTo(12*s,-12*s,9*s,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#241708'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.fillStyle='#8a6a40'; ctx.beginPath(); ctx.ellipse(0,-24*s,9*s,3.6*s,0,0,7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='#2a2018'; ctx.lineWidth=2; for(const yy of [-7*s,-17*s]){ ctx.beginPath(); ctx.moveTo(-10.5*s,yy); ctx.quadraticCurveTo(0,yy+3*s,10.5*s,yy); ctx.stroke(); }
  } else if(d.k==='crate'){
    drawShadow(0,3,14*s,5*s);
    ctx.fillStyle='#7a5a34'; ctx.fillRect(-11*s,-20*s,22*s,20*s); ctx.fillStyle='#94713f'; ctx.beginPath(); ctx.moveTo(-11*s,-20*s); ctx.lineTo(-4*s,-27*s); ctx.lineTo(15*s,-27*s); ctx.lineTo(11*s,-20*s); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#2a1c0c'; ctx.lineWidth=1.3; ctx.strokeRect(-11*s,-20*s,22*s,20*s); ctx.beginPath(); ctx.moveTo(-11*s,-20*s); ctx.lineTo(11*s,0); ctx.moveTo(11*s,-20*s); ctx.lineTo(-11*s,0); ctx.stroke();
  } else if(d.k==='banner'){
    const sw = Math.sin(clk*2.4+d.x*0.01)*3;
    ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0,2,7,2.6,0,0,7); ctx.fill();
    ctx.strokeStyle='#3a2814'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-64); ctx.stroke();
    ctx.fillStyle='#9a2a30'; ctx.beginPath(); ctx.moveTo(1,-62); ctx.lineTo(26+sw,-58); ctx.lineTo(22+sw*1.4,-44); ctx.lineTo(26+sw,-30); ctx.lineTo(1,-34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#241008'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#e8d8b0'; ctx.beginPath(); ctx.arc(11+sw*0.5,-47,4.2,0,7); ctx.fill(); ctx.fillStyle='#9a2a30'; ctx.fillRect(8.4+sw*0.5,-48.4,1.6,1.8); ctx.fillRect(11.6+sw*0.5,-48.4,1.6,1.8);
  }
  ctx.restore();
}
// v527: a broken-down brown wagon (bed, two big wheels, a torn canvas cover) used to wall off the switchbacks
function drawRvWagon(o){
  const c = toIso(o.x+o.w/2, o.y+o.h/2), f = o.flip ? -1 : 1, sd = o.seed||0.5;
  drawShadow(c.x, c.y, 62, 20);
  ctx.save(); ctx.translate(c.x, c.y); ctx.scale(f, 1); ctx.lineJoin = 'round';
  // far wheel
  ctx.strokeStyle = '#3a2716'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(18, -12, 13, 15, 0, 0, 7); ctx.stroke();
  // wagon bed
  ctx.fillStyle = '#6b4a2c'; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-44,-14); ctx.lineTo(30,-34); ctx.lineTo(46,-26); ctx.lineTo(-28,-6); ctx.closePath(); ctx.fill(); ctx.stroke();   // top of the bed
  ctx.fillStyle = '#5a3c22'; ctx.beginPath(); ctx.moveTo(-28,-6); ctx.lineTo(46,-26); ctx.lineTo(46,-12); ctx.lineTo(-28,8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,18,8,0.6)'; ctx.lineWidth = 1; for(let k=1;k<4;k++){ ctx.beginPath(); ctx.moveTo(-28+k*18, -6-k*5); ctx.lineTo(-28+k*18, 8-k*5); ctx.stroke(); }
  // torn canvas hoops
  ctx.fillStyle = 'rgba(206,190,150,0.95)'; ctx.strokeStyle = '#6a5a3a'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-36,-16); ctx.quadraticCurveTo(-30,-58,0,-60); ctx.quadraticCurveTo(26,-62,34,-32); ctx.lineTo(10,-28); ctx.quadraticCurveTo(4,-40,-8,-34); ctx.lineTo(-20,-24); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#5a3c22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-36,-16); ctx.quadraticCurveTo(-30,-58,0,-60); ctx.stroke(); ctx.beginPath(); ctx.moveTo(34,-32); ctx.quadraticCurveTo(26,-62,0,-60); ctx.stroke();
  // near wheel (one wheel broken, tipped)
  ctx.strokeStyle = '#3a2716'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.ellipse(-16, 0, 14, 16, 0, 0, 7); ctx.stroke();
  ctx.lineWidth = 2; for(let k=0;k<4;k++){ const a = k*Math.PI/4+sd; ctx.beginPath(); ctx.moveTo(-16-Math.cos(a)*13, -Math.sin(a)*15); ctx.lineTo(-16+Math.cos(a)*13, Math.sin(a)*15); ctx.stroke(); }
  // a crate spilled beside it
  ctx.fillStyle = '#7a5a34'; ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 1; ctx.fillRect(40, -6, 14, 11); ctx.strokeRect(40, -6, 14, 11);
  ctx.restore();
}
