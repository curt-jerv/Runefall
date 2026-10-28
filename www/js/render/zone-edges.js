// ---------------- v551: what lies past a zone's edge ----------------
// Zones listed in OUTSIDE_SIDES (render/town.js) have their surroundings painted by outsideFill; this adds the trees
// standing out there (a forest to the north of the Withered Crossroads, scattered trees toward the Lakeside, dead trees
// toward the Cemetery; woods all round the Lakeside Ruins), and the weathered wooden gate between the River Valley and
// the Withered Crossroads.
const OUTER_DENSITY = {forest:0.62, river:0.55, lake:0.2, cemetery:0.12, sunlitroad:0.06};
function outerScenery(room, scene){
  if(room._outer) return room._outer;
  const cfg = OUTSIDE_SIDES[scene], out = [];
  room._outer = out; if(!cfg) return out;
  let s = (Math.floor(room.w*7 + room.h*13) % 2147483647) || 1;
  const rnd = ()=>{ s = (s*16807) % 2147483647; return s/2147483647; };
  const M = 640, step = 74, links = edgeLinks(room);
  for(let wx=-M; wx<=room.w+M; wx+=step) for(let wy=-M; wy<=room.h+M; wy+=step){
    if(wx>=-20 && wy>=-20 && wx<=room.w+20 && wy<=room.h+20) continue;
    const x = wx + (rnd()-0.5)*step*0.8, y = wy + (rnd()-0.5)*step*0.8;
    const dw = -x, de = x-room.w, dn = -y, ds = y-room.h;
    let side = 'n', d = dn; if(dw>d){ side = 'w'; d = dw; } if(de>d){ side = 'e'; d = de; } if(ds>d){ side = 's'; d = ds; }
    const kind = cfg[side]; if(kind==='cliffsea' || d < 60) continue;
    if(rnd() > (OUTER_DENSITY[kind]||0)) continue;
    if(links.some(l=>l.side===side && ((side==='w'||side==='e') ? Math.abs(y-l.y) : Math.abs(x-l.x)) < 160)) continue;   // keep the roads clear
    if(kind==='sunlitroad' && Math.abs(d-OUT_ROAD_X) < 130) continue;
    const dead = kind==='cemetery' || kind==='sunlitroad' || (kind==='lake' && rnd()<0.2);
    out.push({x, y, s:0.9 + rnd()*0.9, dark:kind==='forest' || kind==='river' ? rnd()<0.6 : rnd()<0.3, dead});
  }
  return out;
}
function pushOuterScenery(g, drawables){
  if(!OUTSIDE_SIDES[g.scene] || !g.room) return;
  const cam = g.camera; if(!cam) return;
  for(const t of outerScenery(g.room, g.scene)){
    const i = toIso(t.x, t.y); if(i.x<cam.x-200 || i.x>cam.x+W+200 || i.y<cam.y-60 || i.y>cam.y+H+260) continue;
    drawables.push({depth:t.x+t.y, draw:()=>(t.dead ? drawDeadTreeIso(t) : drawTreeIso(t))});
  }
  if(g.scene==='sunlitplains' && g.sun && g.sun.forestGate) drawables.push({depth:g.sun.forestGate.x+g.sun.forestGate.y-2, draw:()=>drawWitheredGateIso(g.sun.forestGate, g.clock||0)});
}
// two crooked, weathered posts with a sagging beam and a hanging sign -- the way into the Withered Crossroads
function drawWitheredGateIso(pos, clock){
  const t = clock||0, sway = Math.sin(t*1.3)*0.06;
  const post = (dx)=>{
    const q = toIso(pos.x+dx, pos.y);
    drawShadow(q.x, q.y+3, 14, 6);
    ctx.save(); ctx.translate(q.x, q.y);
    ctx.fillStyle = '#4a3a28'; ctx.strokeStyle = '#1e160d'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-5,-96); ctx.lineTo(4,-98); ctx.lineTo(6,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,14,8,0.6)'; ctx.beginPath(); ctx.moveTo(-1,-12); ctx.lineTo(0,-80); ctx.stroke();
    ctx.fillStyle = '#5a4a36'; ctx.fillRect(-7,-30,14,3); ctx.fillRect(-7,-70,14,3);   // iron bands
    ctx.restore();
    return q;
  };
  const a = post(-86), b = post(86);
  ctx.save();
  // the sagging crossbeam
  ctx.strokeStyle = '#3e3020'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a.x-6, a.y-92); ctx.quadraticCurveTo((a.x+b.x)/2, (a.y+b.y)/2-80, b.x+6, b.y-92); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,96,64,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x-6, a.y-95); ctx.quadraticCurveTo((a.x+b.x)/2, (a.y+b.y)/2-83, b.x+6, b.y-95); ctx.stroke();
  // a weathered sign on two ropes
  const mx = (a.x+b.x)/2, my = (a.y+b.y)/2 - 84;
  ctx.translate(mx, my); ctx.rotate(sway);
  ctx.strokeStyle = '#2a2016'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(-24,12); ctx.moveTo(26,0); ctx.lineTo(24,12); ctx.stroke();
  ctx.fillStyle = '#6a5236'; ctx.strokeStyle = '#1e150c'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-34,12); ctx.lineTo(34,10); ctx.lineTo(32,30); ctx.lineTo(-33,31); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,20,10,0.5)'; ctx.beginPath(); ctx.moveTo(-30,20); ctx.lineTo(28,19); ctx.stroke();
  ctx.fillStyle = '#d8c89a'; ctx.font = "bold 8px Cinzel, Georgia, serif"; ctx.textAlign = 'center'; ctx.fillText('CROSSROADS', 0, 25);
  ctx.restore();
  // a crow on the beam
  const cq = {x:b.x-30, y:b.y-98};
  ctx.save(); ctx.fillStyle = '#121014'; ctx.beginPath(); ctx.ellipse(cq.x, cq.y, 6, 4, -0.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cq.x+5, cq.y-4, 3, 0, 7); ctx.fill();
  ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.moveTo(cq.x+7.5, cq.y-4.5); ctx.lineTo(cq.x+11, cq.y-3.5); ctx.lineTo(cq.x+7.5, cq.y-2.8); ctx.closePath(); ctx.fill(); ctx.restore();
}
// ---------------- v552: the Lighthouse rooftop, open to the sky ----------------
// The world far below is drawn on a plane that slides at LH_BELOW_K of the camera's speed (parallax), so it reads as
// a long way down: the sea to the west, the Withered Crossroads to the east, and the tower's own shaft dropping into the haze.
const LH_BELOW_K = 0.36, LH_BELOW_DROP = 0;   // the ground straight below sits behind the deck, so the sea shows past the west rail and the land past the east
function lhCoastX(by){ return -380 + 170*Math.sin(by*0.0011) + 80*Math.sin(by*0.0033+1.7); }
function lhBelowScenery(room){
  if(room._below) return room._below;
  let s = 977; const rnd = ()=>{ s = (s*16807) % 2147483647; return s/2147483647; };
  const trees = [], houses = [], waves = [], road = [];
  for(let i=0;i<900;i++){ const by = (rnd()-0.5)*14000, bx = lhCoastX(by) + 260 + rnd()*9000; trees.push({x:bx, y:by, r:5+rnd()*7, d:rnd()<0.6}); }
  for(let i=0;i<16;i++){ const by = (rnd()-0.5)*6000, bx = lhCoastX(by) + 700 + rnd()*3500; houses.push({x:bx, y:by, w:60+rnd()*50, h:40+rnd()*30}); }
  for(let i=0;i<260;i++){ const by = (rnd()-0.5)*14000, bx = lhCoastX(by) - 150 - rnd()*7000; waves.push({x:bx, y:by, l:40+rnd()*90, ph:rnd()*6.28}); }
  for(let k=0;k<=40;k++){ const bx = 300 + k*220; road.push({x:bx, y:60 + 260*Math.sin(k*0.45) + k*30}); }
  room._below = {trees, houses, waves, road};
  return room._below;
}
function drawLhRoof(room, cam){
  const c = room.roofC, RR = room.roofR, S0 = toIso(c.x, c.y), K = LH_BELOW_K, clk = (game && game.clock) || 0;
  const cc = {x:cam.x + W/2, y:cam.y + H/2};
  const ox = S0.x + (cc.x - S0.x)*(1-K), oy = S0.y + LH_BELOW_DROP + (cc.y - S0.y)*(1-K);
  const B = (bx,by)=>({x:ox + (bx-by)*ISO_KX*K, y:oy + (bx+by)*ISO_KY*K});
  const X0 = cam.x-20, Y0 = cam.y-20, X1 = cam.x+W+20, Y1 = cam.y+H+20, on = (q, m)=>q.x>X0-m && q.x<X1+m && q.y>Y0-m && q.y<Y1+m;
  const sc = lhBelowScenery(room);
  ctx.save();
  // the land: the Crossroads' dead fields
  ctx.fillStyle = '#5e5638'; ctx.fillRect(X0, Y0, X1-X0, Y1-Y0);
  // the sea, west of a ragged coast
  ctx.fillStyle = '#122c46'; ctx.beginPath();
  let first = true;
  for(let by=-9000; by<=9000; by+=300){ const q = B(lhCoastX(by), by); if(first){ ctx.moveTo(q.x, q.y); first = false; } else ctx.lineTo(q.x, q.y); }
  { const a = B(-30000, 9000), b = B(-30000, -9000); ctx.lineTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(210,225,235,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); first = true;
  for(let by=-9000; by<=9000; by+=300){ const q = B(lhCoastX(by)-30, by); if(first){ ctx.moveTo(q.x, q.y); first = false; } else ctx.lineTo(q.x, q.y); }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,180,205,0.28)'; ctx.lineWidth = 1.4;
  for(const wv of sc.waves){ const q = B(wv.x + Math.sin(clk*0.6+wv.ph)*30, wv.y); if(!on(q, 40)) continue; const l = wv.l*K; ctx.beginPath(); ctx.moveTo(q.x-l, q.y); ctx.quadraticCurveTo(q.x, q.y-3, q.x+l, q.y); ctx.stroke(); }
  // a dirt road winding off east, farmhouses and dead trees
  ctx.strokeStyle = '#7e6a48'; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.beginPath();
  sc.road.forEach((pt,i)=>{ const q = B(pt.x, pt.y); if(i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.stroke();
  for(const hs of sc.houses){ const q = B(hs.x, hs.y); if(!on(q, 40)) continue; const hw = hs.w*K*0.9, hh = hs.h*K*0.9;
    ctx.fillStyle = '#4a3c2c'; ctx.fillRect(q.x-hw/2, q.y-hh*0.5, hw, hh*0.5); ctx.fillStyle = '#5a2e22'; ctx.beginPath(); ctx.moveTo(q.x-hw*0.6, q.y-hh*0.5); ctx.lineTo(q.x, q.y-hh*1.1); ctx.lineTo(q.x+hw*0.6, q.y-hh*0.5); ctx.closePath(); ctx.fill(); }
  for(const tr of sc.trees){ const q = B(tr.x, tr.y); if(!on(q, 20)) continue; const r = tr.r*K*2.2;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(q.x+2, q.y+1, r, r*0.45, 0, 0, 7); ctx.fill();
    ctx.fillStyle = tr.d ? '#262c18' : '#3a3018'; ctx.beginPath(); ctx.arc(q.x, q.y-r*0.8, r, 0, 7); ctx.fill(); }
  // haze over everything far below
  const hz = ctx.createLinearGradient(0, Y0, 0, Y1); hz.addColorStop(0, 'rgba(66,62,60,0.3)'); hz.addColorStop(1, 'rgba(34,32,34,0.18)');
  ctx.fillStyle = hz; ctx.fillRect(X0, Y0, X1-X0, Y1-Y0);
  // the tower's shaft dropping away under the deck
  const rx = RR*1.414*ISO_KX, ry = RR*1.414*ISO_KY, sx = rx*0.86, sy = ry*0.86, L = 1400;
  const sg = ctx.createLinearGradient(S0.x-sx, 0, S0.x+sx, 0); sg.addColorStop(0, '#6c645a'); sg.addColorStop(0.45, '#4e4840'); sg.addColorStop(1, '#24212a');
  ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(S0.x-sx, S0.y); ctx.lineTo(S0.x-sx, S0.y+L); ctx.ellipse(S0.x, S0.y+L, sx, sy, 0, Math.PI, 0, true); ctx.lineTo(S0.x+sx, S0.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(20,16,14,0.35)'; ctx.lineWidth = 2;
  for(let k=1;k<20;k++){ ctx.beginPath(); ctx.ellipse(S0.x, S0.y+k*70, sx, sy, 0, 0, Math.PI); ctx.stroke(); }
  ctx.fillStyle = 'rgba(14,10,12,0.75)';
  for(let k=0;k<5;k++){ const wy = S0.y + ry*0.9 + 140 + k*260, wx = S0.x + (k%2 ? 0.35 : -0.4)*sx; ctx.beginPath(); ctx.moveTo(wx-9, wy+30); ctx.lineTo(wx-9, wy); ctx.arc(wx, wy, 9, Math.PI, 0); ctx.lineTo(wx+9, wy+30); ctx.closePath(); ctx.fill(); }
  const fade = ctx.createLinearGradient(0, S0.y+ry, 0, S0.y+L); fade.addColorStop(0, 'rgba(56,58,76,0)'); fade.addColorStop(1, 'rgba(56,58,76,0.95)');
  ctx.fillStyle = fade; ctx.fillRect(S0.x-sx-2, S0.y, sx*2+4, L+sy);
  // the deck's thick edge, then the deck itself
  ctx.fillStyle = '#3a342e'; ctx.beginPath(); ctx.ellipse(S0.x, S0.y+26, rx*1.02, ry*1.02, 0, 0, 7); ctx.fill();
  const dg = ctx.createRadialGradient(S0.x, S0.y, 20, S0.x, S0.y, rx); dg.addColorStop(0, '#827a6c'); dg.addColorStop(1, '#5c564c');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(S0.x, S0.y, rx*1.02, ry*1.02, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(30,26,22,0.45)'; ctx.lineWidth = 1.5;
  const ring = (r)=>{ ctx.beginPath(); ctx.ellipse(S0.x, S0.y, r*1.414*ISO_KX, r*1.414*ISO_KY, 0, 0, 7); ctx.stroke(); };
  for(let r=150; r<RR; r+=80) ring(r);
  for(let r=150; r<RR; r+=80){ const n = Math.round(r/26); for(let i=0;i<n;i++){ const a = (i + (r/80)%2*0.5)/n*Math.PI*2; const p1 = toIso(c.x+Math.cos(a)*r, c.y+Math.sin(a)*r), p2 = toIso(c.x+Math.cos(a)*Math.min(RR, r+80), c.y+Math.sin(a)*Math.min(RR, r+80)); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); } }
  ctx.fillStyle = '#4a4440'; ctx.beginPath(); ctx.ellipse(S0.x, S0.y, 150*1.414*ISO_KX, 150*1.414*ISO_KY, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(200,170,110,0.35)'; ctx.lineWidth = 2; ring(140); ring(118);
  for(let i=0;i<8;i++){ const a = i/8*Math.PI*2, q = toIso(c.x+Math.cos(a)*138, c.y+Math.sin(a)*138), q2 = toIso(c.x+Math.cos(a+0.39)*96, c.y+Math.sin(a+0.39)*96); ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q2.x, q2.y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(S0.x, S0.y, rx*1.02, ry*1.02, 0, 0, 7); ctx.ellipse(S0.x, S0.y, rx*0.94, ry*0.94, 0, 0, 7, true); ctx.fill('evenodd');
  ctx.restore();
}
// the iron railing round the deck: one post per drawable, with the rails out to the next post
function pushLhRoofDrawables(g, drawables){
  const t = g.tower; if(!t || !t.openRoof) return;
  const P = t.roofPosts;
  for(let i=0;i<P.length;i++){
    const a = P[i], b = P[(i+1)%P.length];
    drawables.push({depth:(a.x+b.x)/2+(a.y+b.y)/2, draw:()=>drawLhRailIso(a, b)});
  }
}
function drawLhRailIso(a, b){
  const qa = toIso(a.x, a.y), qb = toIso(b.x, b.y);
  ctx.save();
  ctx.strokeStyle = '#1e1a18'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(qa.x, qa.y-34); ctx.lineTo(qb.x, qb.y-34); ctx.stroke();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(qa.x, qa.y-17); ctx.lineTo(qb.x, qb.y-17); ctx.stroke();
  for(let k=1;k<4;k++){ const x = qa.x+(qb.x-qa.x)*k/4, y = qa.y+(qb.y-qa.y)*k/4; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y-1); ctx.lineTo(x, y-34); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(160,150,140,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(qa.x, qa.y-35.5); ctx.lineTo(qb.x, qb.y-35.5); ctx.stroke();
  ctx.fillStyle = '#2a2420'; ctx.fillRect(qa.x-3, qa.y-38, 6, 38); ctx.fillStyle = '#4a4038'; ctx.fillRect(qa.x-3, qa.y-38, 2, 38);
  ctx.beginPath(); ctx.arc(qa.x, qa.y-40, 4, 0, 7); ctx.fillStyle = '#3a322c'; ctx.fill();
  ctx.restore();
}
function lhRoofOpen(g){ return !!(g && g.scene==='lighthouse' && g.tower && g.tower.openRoof); }
