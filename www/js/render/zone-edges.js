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
