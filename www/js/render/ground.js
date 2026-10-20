// ---------- Iso drawing helpers ----------
function roundRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function drawShadow(sx,sy,rx,ry){
  ctx.beginPath();
  ctx.fillStyle='rgba(0,0,0,0.42)';
  ctx.ellipse(sx,sy+2,rx,ry,0,0,7);
  ctx.fill();
}
// v470: while the ground is painted, each flat tile is pulled part-way toward the average ground colour so the floor
// reads as one continuous surface (the grime texture then supplies the detail) instead of a checkerboard
let moodFloor = false, moodFloorK = 0.45;
const MOOD_FLOOR_ACC = {r:0, g:0, b:0, n:0, mr:-1, mg:0, mb:0}, MOOD_FILL_CACHE = new Map();
function moodFloorBegin(){ const A = MOOD_FLOOR_ACC; if(A.n>20){ A.mr = A.r/A.n; A.mg = A.g/A.n; A.mb = A.b/A.n; } A.r = A.g = A.b = A.n = 0; moodFloor = moodOn() && !MOOD_DBG.noFlat; }
function moodFlattenFill(){
  const v = ctx.fillStyle; if(typeof v!=='string') return;
  let c = MOOD_FILL_CACHE.get(v);
  if(c===undefined){
    c = null;
    let m = /^#([0-9a-f]{6})$/i.exec(v);
    if(m) c = [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)];
    else if((m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v)) && (m[4]==null || +m[4]>=0.99)) c = [+m[1], +m[2], +m[3]];
    if(MOOD_FILL_CACHE.size < 6000) MOOD_FILL_CACHE.set(v, c);
  }
  if(!c) return;
  const A = MOOD_FLOOR_ACC; A.r += c[0]; A.g += c[1]; A.b += c[2]; A.n++;
  if(A.mr<0) return;
  const k = moodFloorK;
  ctx.fillStyle = 'rgb('+Math.round(c[0]+(A.mr-c[0])*k)+','+Math.round(c[1]+(A.mg-c[1])*k)+','+Math.round(c[2]+(A.mb-c[2])*k)+')';
}
// v487: ground chunk cache. The flat ground of most zones is painted once into 512px tiles ("chunks") and reused
// every frame; only moving parts (water ripples, shimmer, waterfalls) are repainted live on top.
// FLOOR_PASS: 0 = paint everything (normal), 1 = baking a chunk (skip moving parts), 2 = live pass (moving parts only)
let FLOOR_PASS = 0;
const FCH = 512, FCH_MAX = 14;
const FLOOR_CACHE = {key:'', chunks:new Map(), warm:0, mood:null, ids:0, tick:0, pool:[]};
function bakeFloorChunk(cx, cy, sc, px, bake){
  const C = FLOOR_CACHE;
  const c = C.pool.pop() || document.createElement('canvas');
  if(c.width!==px || c.height!==px){ c.width = px; c.height = px; }
  const cc = c.getContext('2d');
  cc.setTransform(1,0,0,1,0,0); cc.globalAlpha = 1; cc.globalCompositeOperation = 'source-over'; cc.clearRect(0,0,px,px);
  cc.setTransform(sc,0,0,sc,-cx*px,-cy*px);
  const sCtx = ctx, sW = W, sH = H;
  ctx = cc; W = FCH; H = FCH; FLOOR_PASS = 1;
  try{ bake({x:cx*FCH, y:cy*FCH}); } finally { ctx = sCtx; W = sW; H = sH; FLOOR_PASS = 0; }
  return {c, used:0};
}
// obj: the room/terrain the ground belongs to (a new object = a new cache). bake(cam) paints the ground with the
// global ctx (FLOOR_PASS 0 or 1); live(cam), if given, repaints the moving parts on top (FLOOR_PASS 2).
function cachedFloor(obj, cam, bake, live){
  const m = ctx.getTransform();
  if(window.__noFloorCache || !obj || m.b || m.c || Math.abs(m.a-m.d)>1e-6 || Math.abs(m.a-DPR)>1e-6){ FLOOR_PASS = 0; bake(cam); return; }
  const C = FLOOR_CACHE, A = MOOD_FLOOR_ACC;
  if(!obj.__fcId) obj.__fcId = ++C.ids;
  const key = (game&&game.scene)+'|'+obj.__fcId+'|'+DPR+'|'+(moodFloor?1:0);
  if(key!==C.key){ C.key = key; for(const ch of C.chunks.values()) if(C.pool.length<4) C.pool.push(ch.c); C.chunks.clear(); C.warm = 0; C.mood = null; }
  if(C.warm < 3){ C.warm++; FLOOR_PASS = 0; bake(cam); return; }   // a few normal frames first, so the ground's average colour (moodFlattenFill) settles
  if(!C.mood) C.mood = [A.mr, A.mg, A.mb];
  A.mr = C.mood[0]; A.mg = C.mood[1]; A.mb = C.mood[2];
  const sc = m.a, px = Math.round(FCH*sc), now = ++C.tick;
  const wx0 = -m.e/sc, wy0 = -m.f/sc, wx1 = wx0 + canvas.width/sc, wy1 = wy0 + canvas.height/sc;
  const get = (cx,cy)=>{ const k = cx+','+cy; let ch = C.chunks.get(k); if(!ch){ ch = bakeFloorChunk(cx,cy,sc,px,bake); C.chunks.set(k,ch); } ch.used = now; return ch; };
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  for(let cy=Math.floor(wy0/FCH); cy<=Math.floor(wy1/FCH); cy++) for(let cx=Math.floor(wx0/FCH); cx<=Math.floor(wx1/FCH); cx++) ctx.drawImage(get(cx,cy).c, Math.round(m.e + cx*px), Math.round(m.f + cy*px));
  ctx.restore();
  // bake at most one chunk just outside the view per frame, so walking rarely waits on a new one
  const PM = 200;
  pre: for(let cy=Math.floor((wy0-PM)/FCH); cy<=Math.floor((wy1+PM)/FCH); cy++) for(let cx=Math.floor((wx0-PM)/FCH); cx<=Math.floor((wx1+PM)/FCH); cx++){ if(!C.chunks.has(cx+','+cy)){ get(cx,cy); break pre; } }
  while(C.chunks.size > FCH_MAX){ let ok = null, ou = Infinity; for(const [k,ch] of C.chunks) if(ch.used<ou){ ou = ch.used; ok = k; } if(C.pool.length<4) C.pool.push(C.chunks.get(ok).c); C.chunks.delete(ok); }
  if(live){ FLOOR_PASS = 2; try{ live(cam); } finally { FLOOR_PASS = 0; } }
  A.r = A.g = A.b = A.n = 0;
}
function drawDiamond(cx,cy,a,b){
  if(moodFloor) moodFlattenFill();
  ctx.beginPath();
  ctx.moveTo(cx, cy-b); ctx.lineTo(cx+a, cy); ctx.lineTo(cx, cy+b); ctx.lineTo(cx-a, cy);
  ctx.closePath(); ctx.fill();
}
// A cheap deterministic hash so decorations (ore glints, rubble) stay put
// frame to frame instead of re-rolling every render.
function tileHash(ix,iy){
  const h = Math.sin(ix*12.9898 + iy*78.233) * 43758.5453;
  return h - Math.floor(h);
}

const ORGANIC_PAL = {
  raptor:{a:'#6a4028', b:'#593420', c:'#7c5232', wt:'#8e5c3a', wr:'#3a2216', wf:'#57351f'},
  spider:{a:'#2b2a38', b:'#23222e', c:'#353349', wt:'#4a4560', wr:'#14131c', wf:'#22202f'},
  bear:{a:'#4a3b24', b:'#3d3020', c:'#574628', wt:'#6a5a3a', wr:'#241c10', wf:'#392c1a'},
  minotaur:{a:'#3c3a42', b:'#333238', c:'#47444e', wt:'#615d6a', wr:'#1c1a20', wf:'#2e2c34'},
  deepmine:{a:'#3b342d', b:'#332d27', c:'#463e35', wt:'#5b5144', wr:'#211c16', wf:'#2f281f'},
  grotto:{a:'#24343a', b:'#1f2e33', c:'#2b3d44', wt:'#3c5560', wr:'#101a1e', wf:'#1c2b31'},
  ember:{a:'#2c2428', b:'#262024', c:'#33292c', wt:'#4a3230', wr:'#1a1012', wf:'#2c1a1a'},
  heart:{a:'#2c2428', b:'#262024', c:'#33292c', wt:'#46282a', wr:'#160c0e', wf:'#281416'},
  temple:{a:'#3e4a46', b:'#36423e', c:'#47554f', wt:'#5f6e68', wr:'#26302d', wf:'#3a4743'},   // v490: the drowned temple's mossy stone
};
function drawOrganicFloor(room, cam){
  const TS = 46, P = ORGANIC_PAL[room.organic] || ORGANIC_PAL.bear, m = room.floorMask, kind = room.organic;
  for(let wy=-TS; wy<=room.h+TS; wy+=TS){
    for(let wx=-TS; wx<=room.w+TS; wx+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const ix = Math.floor(wx/m.CELL), iy = Math.floor(wy/m.CELL);
      if(ix<0||iy<0||ix>=m.cols||iy>=m.rows||!m.data[iy*m.cols+ix]) continue;
      const h = tileHash(Math.floor(wx/TS), Math.floor(wy/TS)), h2 = tileHash(Math.floor(wy/TS)+7, Math.floor(wx/TS)+3);
      ctx.fillStyle = h<0.34 ? P.a : h<0.68 ? P.b : P.c;
      drawDiamond(iso.x, iso.y, TS*ISO_KX*1.04, TS*ISO_KY*1.04);
      if(h2<0.18){ ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(iso.x+(h-0.5)*20, iso.y+(h2-0.1)*30, 9+h*8, 4+h*3, 0.2, 0, 7); ctx.fill(); }
      else if(h2>0.86){
        ctx.save();
        if(kind==='raptor'){ ctx.strokeStyle='rgba(230,200,150,0.35)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(iso.x-8,iso.y+1); ctx.lineTo(iso.x+7,iso.y-2); ctx.moveTo(iso.x-5,iso.y+4); ctx.lineTo(iso.x+9,iso.y+3); ctx.stroke(); }
        else if(kind==='spider'){ ctx.strokeStyle='rgba(210,210,230,0.28)'; ctx.lineWidth=1; ctx.beginPath(); for(let k=0;k<4;k++){ const a=k*0.8+h*3; ctx.moveTo(iso.x,iso.y); ctx.lineTo(iso.x+Math.cos(a)*14, iso.y+Math.sin(a)*6); } ctx.stroke(); ctx.beginPath(); ctx.ellipse(iso.x,iso.y,7,3,0,0,7); ctx.stroke(); }
        else { ctx.fillStyle = h<0.5 ? 'rgba(96,130,60,0.6)' : 'rgba(168,120,50,0.55)'; ctx.beginPath(); ctx.ellipse(iso.x-4,iso.y,4,2,0.3,0,7); ctx.ellipse(iso.x+5,iso.y+3,3.5,1.8,-0.4,0,7); ctx.fill(); }
        ctx.restore();
      }
    }
  }
}
function drawOrganicWall(o){
  const P = ORGANIC_PAL[o.organic] || ORGANIC_PAL.bear;
  const hh = tileHash(o.x/50, o.y/50), hz = 40 + hh*30;
  drawBlock(o, hz, P.wt, P.wr, P.wf);
  // round the blocky top into a boulder
  const c = toIso(o.x+o.w/2, o.y+o.h/2);
  ctx.save();
  ctx.fillStyle = P.wt; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(c.x, c.y-hz-2, 36+hh*8, 19+hh*4, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(c.x-8, c.y-hz-6, 16, 7, 0, 0, 7); ctx.fill();
  if(o.organic==='bear'){ ctx.fillStyle='rgba(90,130,60,0.55)'; ctx.beginPath(); ctx.ellipse(c.x+10, c.y-hz-1, 14, 6, 0, 0, 7); ctx.fill(); }
  else if(o.organic==='temple'){ ctx.fillStyle='rgba(80,140,90,0.45)'; ctx.beginPath(); ctx.ellipse(c.x-6, c.y-hz, 15, 6, 0, 0, 7); ctx.fill(); }   // v490: moss on the temple stone
  else if(o.organic==='spider'){ ctx.strokeStyle='rgba(220,220,240,0.35)'; ctx.beginPath(); ctx.moveTo(c.x-20,c.y-hz-4); ctx.lineTo(c.x+4,c.y-hz+14); ctx.lineTo(c.x+22,c.y-hz-2); ctx.moveTo(c.x-8,c.y-hz+2); ctx.lineTo(c.x+12,c.y-hz+6); ctx.stroke(); }
  else { ctx.fillStyle='rgba(220,110,40,0.16)'; ctx.beginPath(); ctx.ellipse(c.x+6, c.y-hz, 18, 7, 0, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawFloor(room, cam){
  if(room.organic){ drawOrganicFloor(room, cam); return; }
  // rough dirt-and-rock mine floor, with the odd glinting ore vein underfoot.
  // When the floor has a randomly-generated multi-room layout (floorRects),
  // only paint tiles that actually fall inside a room or tunnel -- anywhere
  // else stays the dark cave background, read as unexplored rock.
  const TS = 46;
  const rects = room.floorRects;
  const PAL = room.pal, pc0 = PAL?PAL[0]:'#453a2c', pc1 = PAL?PAL[1]:'#352c22', pc2 = PAL?PAL[2]:'#4e4232', pc3 = PAL?PAL[3]:'#3a3024';
  for(let wy=-TS; wy<=room.h+TS; wy+=TS){
    for(let wx=-TS; wx<=room.w+TS; wx+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      if(rects && !rects.some(r=> wx>r.x-8 && wx<r.x+r.w+8 && wy>r.y-8 && wy<r.y+r.h+8)) continue;
      if(room.abyss && wx>room.abyss.x0 && wx<room.abyss.x1) continue;   // v252: the chasm is painted separately
      const ix=Math.floor(wx/TS), iy=Math.floor(wy/TS);
      const checker = ((ix+iy)%2+2)%2;
      const h = tileHash(ix,iy);
      ctx.fillStyle = checker ? (h>0.85?pc0:pc1) : (h>0.85?pc2:pc3);
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
      if(h>0.9 && room.noOre){ /* castle flagstones: no ore */ } else if(h>0.9){
        // a small glinting ore vein embedded in this tile
        ctx.save();
        ctx.fillStyle = 'rgba(232,196,74,0.6)';
        ctx.beginPath(); ctx.arc(iso.x+(h-0.95)*40, iso.y-3, 2.4, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(iso.x-(h-0.95)*30, iso.y+3, 1.6, 0, 7); ctx.fill();
        ctx.restore();
      } else if(h<0.12){
        // loose rubble
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(iso.x+4, iso.y+2, 4, 2.2, 0.3, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
  }
}
// v435: skull-carved pillars in the Demon Hold -- a skull on each visible face plus a bone-white crown
function drawPillarSkulls(o){
  const c1=toIso(o.x+o.w,o.y), c2=toIso(o.x+o.w,o.y+o.h), c3=toIso(o.x,o.y+o.h), hz=o.hz||78, clk=(game&&game.clock)||0;
  const skull = (cx,cy,sc)=>{
    ctx.save(); ctx.translate(cx,cy); ctx.scale(sc,sc);
    ctx.fillStyle='#e6dcbc'; ctx.strokeStyle='#1a1210'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.ellipse(0,-2,8,8.5,0,0,7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-4.5,4,9,5); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#1c0806'; ctx.beginPath(); ctx.ellipse(-3.4,-2,2.4,2.9,0,0,7); ctx.ellipse(3.4,-2,2.4,2.9,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,1.5); ctx.lineTo(-1.5,4.2); ctx.lineTo(1.5,4.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(255,90,30,'+(0.65+0.3*Math.sin(clk*3+o.x))+')'; ctx.beginPath(); ctx.arc(-3.4,-2,1,0,7); ctx.arc(3.4,-2,1,0,7); ctx.fill();
    ctx.strokeStyle='#1a1210'; ctx.lineWidth=0.9; ctx.beginPath(); for(let i=-1;i<=1;i++){ ctx.moveTo(i*2.6,5); ctx.lineTo(i*2.6,9); } ctx.stroke();
    ctx.restore();
  };
  skull((c2.x+c3.x)/2, (c2.y+c3.y)/2-hz*0.55, 1.05);   // front face
  skull((c1.x+c2.x)/2, (c1.y+c2.y)/2-hz*0.55, 0.95);   // right face
  ctx.strokeStyle='#cfc4a2'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(c3.x,c3.y-hz+2); ctx.lineTo(c2.x,c2.y-hz+2); ctx.lineTo(c1.x,c1.y-hz+2); ctx.stroke();
}
function drawBlock(o, hz, topC, rightC, frontC){
  const c0=toIso(o.x,o.y), c1=toIso(o.x+o.w,o.y), c2=toIso(o.x+o.w,o.y+o.h), c3=toIso(o.x,o.y+o.h);
  ctx.fillStyle = frontC;
  ctx.beginPath();
  ctx.moveTo(c2.x,c2.y-hz); ctx.lineTo(c3.x,c3.y-hz); ctx.lineTo(c3.x,c3.y); ctx.lineTo(c2.x,c2.y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = rightC;
  ctx.beginPath();
  ctx.moveTo(c1.x,c1.y-hz); ctx.lineTo(c2.x,c2.y-hz); ctx.lineTo(c2.x,c2.y); ctx.lineTo(c1.x,c1.y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = topC;
  ctx.beginPath();
  ctx.moveTo(c0.x,c0.y-hz); ctx.lineTo(c1.x,c1.y-hz); ctx.lineTo(c2.x,c2.y-hz); ctx.lineTo(c3.x,c3.y-hz);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1; ctx.stroke();
}
// A mine-shaft support: a crossbeam and two timber posts holding up the
// rock overhead, with a torch mounted on the beam for light.
function drawMineSupport(wx, wy, hz){
  const iso = toIso(wx,wy);
  if(game && game.room && game.room.fhd){
    // dwarven stone pillar with a glowing rune
    ctx.save(); ctx.translate(iso.x, iso.y-hz);
    ctx.fillStyle = (game.room.wallPal&&game.room.wallPal[2])||'#444'; ctx.strokeStyle='#14110c'; ctx.lineWidth=1;
    roundRect(-9,-4,18,hz+6,2); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#a88a4c'; ctx.fillRect(-11,-8,22,6); ctx.fillRect(-11,hz-2,22,5);
    const glow = 0.55 + Math.sin(Date.now()/500+wx*0.3+wy*0.2)*0.25;
    ctx.fillStyle='rgba(140,220,255,'+glow+')'; ctx.fillRect(-1.5,hz*0.25,3,hz*0.4);
    ctx.restore();
    return;
  }
  ctx.save(); ctx.translate(iso.x, iso.y-hz);
  ctx.fillStyle='#4a3826';
  roundRect(-14,0,6,hz+3,1); ctx.fill();
  roundRect(8,0,6,hz+3,1); ctx.fill();
  ctx.strokeStyle='#1e1610'; ctx.lineWidth=1;
  ctx.strokeRect(-14,0,6,hz+3); ctx.strokeRect(8,0,6,hz+3);
  ctx.fillStyle='#5a4632';
  roundRect(-17,-6,34,8,2); ctx.fill();
  ctx.strokeStyle='#1e1610'; ctx.lineWidth=1; ctx.strokeRect(-17,-6,34,8);
  const flick = 4+Math.sin(Date.now()/90+wx*0.7)*1.2;
  ctx.fillStyle='#e2703a';
  ctx.beginPath(); ctx.arc(0,-13,flick,0,7); ctx.fill();
  ctx.fillStyle='rgba(226,112,58,0.35)';
  ctx.beginPath(); ctx.arc(0,-13,10,0,7); ctx.fill();
  ctx.restore();
}
function drawWalls(room){
  // rough excavated rock walls, shored up with timber supports and torchlight
  const wt=18, hz=58, wp = room.wallPal, top = wp?wp[0]:'#463c30', right = wp?wp[1]:'#221c14', front = wp?wp[2]:'#302819';
  drawBlock({x:-wt,y:-wt,w:room.w+wt*2,h:wt}, hz, top,right,front);
  drawBlock({x:-wt,y:room.h,w:room.w+wt*2,h:wt}, hz, top,right,front);
  drawBlock({x:-wt,y:0,w:wt,h:room.h}, hz, top,right,front);
  drawBlock({x:room.w,y:0,w:wt,h:room.h}, hz, top,right,front);
  const spacing = 150, cam = game && game.camera;
  const sup = (x,y)=>{ if(cam){ const i = toIso(x,y); if(i.x < cam.x-120 || i.x > cam.x+W+120 || i.y < cam.y-60 || i.y > cam.y+H+160) return; } drawMineSupport(x, y, hz); };   // v490: skip supports off screen
  for(let wx=60; wx<room.w; wx+=spacing){
    sup(wx, -wt*0.5);
    sup(wx, room.h+wt*0.5);
  }
  for(let wy=60; wy<room.h; wy+=spacing){
    sup(-wt*0.5, wy);
    sup(room.w+wt*0.5, wy);
  }
}

