// ---------------- Cursed Cemetery (v72) ----------------
// Fifth of the 6-batch "new area" sequence, reached from Withered Crossroads'
// own reserved south exit (SUNLIT_SOUTH_EXIT_SPOT/g.sun.southGate) -- the
// player arrives at this zone's own NORTH edge, continuing straight south
// along the Dark Forest -> Withered Crossroads -> Cursed Cemetery line.
//
// Size: shrunk to HALF ITS PREVIOUS SIZE (Sept 2026 patch) -- read as half
// each linear dimension (CEM_W/CEM_H both halved, so the zone's total
// area is a quarter of what it was), per an explicit request to make this
// zone smaller. The previous footprint (3800 x 2700, itself "half the
// area of Withered Crossroads" per the original v72 batch's own judgment call)
// is now halved again to 1900 x 1350, keeping the exact same aspect
// ratio. Every fixed landmark below (entrance, tomb, waypoint, road) is
// expressed relative to CEM_W/CEM_H/CEM_CX so it repositions itself
// automatically; the handful of absolute-pixel margins, exclusion radii
// and minimum-spacing values that AREN'T naturally proportional (the
// offLimits distances, the pack-anchor placement margins, etc., all listed
// below) are explicitly halved too so the zone keeps the same relative
// "breathing room" feel at its new smaller size instead of those fixed
// margins suddenly eating up a much bigger fraction of the map. The pack
// anchor target/count are cut to a quarter (matching the quartered area)
// rather than just halved again, so packs stay spread out instead of
// overcrowding a zone with 4x less room.
//
// Structurally this is the same open, standing-population zone shape as
// the Forest/Mountain Pass/Withered Crossroads/Lakeside Ruins (no genRoom()
// floors) -- a single straight road/path runs from the north entrance
// down to the sealed tomb entrance at the zone's south end, with graves
// and dead trees scattered off the path rather than a crossroad (there's
// nothing past this zone yet except the Dark Crypt stub the tomb itself
// leads to, so a crossroad shape isn't needed).
// v532: the cemetery is long now (2600x4200). A winding road leads south from the Crossroads gate, past the
// graverobbers' camp just inside the gate and skeleton stragglers and crows along the way, to a walled graveyard:
// wrought-iron fencing with one gate, rows of tombstones, the Grave Statue in the middle (its wave event plays out
// inside the fence) and the Dark Crypt's tomb at the far end.
const CEM_W = 2600, CEM_H = 4200;
const CEM_CX = CEM_W/2;
const CEM_ROAD_HALFW = 46; // same visual road width as Withered Crossroads' crossroad
const CEMETERY_ENTRANCE_SPOT = {x:CEM_CX, y:16};
const CEM_FENCE = {x0:330, x1:CEM_W-330, y0:2500, y1:4060, gateHalf:85};
const CEM_STATUE_SPOT = {x:CEM_CX, y:3220};
const CEM_TOMB_SPOT = {x:CEM_CX, y:3880};
const CEM_CAMP_SPOT = {x:CEM_CX+300, y:330};
let CEM_ROADS = [], CEM_ROAD_GRID = null;
function cemRoadDist(x,y){ return CEM_ROAD_GRID ? sunRoadNear({roads:CEM_ROADS, roadGrid:CEM_ROAD_GRID}, x, y).d : 1e9; }
function cemOnRoad(x,y){ return cemRoadDist(x,y) < CEM_ROAD_HALFW; }
function cemInFence(x,y,m){ m = m||0; const F = CEM_FENCE; return x > F.x0+m && x < F.x1-m && y > F.y0+m && y < F.y1-m; }
const CEM_PACK_ANCHOR_TARGET = 8;    // packs inside the fence (until the crypt is opened)
const CEM_PACK_COUNT = 8;
const CEM_STRAGGLERS = 22, CEM_CROW_FLOCKS = 7;
const CEM_PACK_TEMPLATES = [
  { type:'skeleton', countMin:2, countMax:4 },
  { type:'skeleton', countMin:1, countMax:3 },
  { type:'skeletonarcher', countMin:1, countMax:2 },
  { type:'spider', countMin:1, countMax:2 },
  { type:'skeletonbrute', countMin:1, countMax:1 },
];
function makeCursedCemetery(){
  const w=CEM_W, h=CEM_H, F = CEM_FENCE;
  const sunlitGate = {x:CEMETERY_ENTRANCE_SPOT.x, y:CEMETERY_ENTRANCE_SPOT.y, r:34};
  const tomb = {x:CEM_TOMB_SPOT.x, y:CEM_TOMB_SPOT.y, r:40};
  const statue = {x:CEM_STATUE_SPOT.x, y:CEM_STATUE_SPOT.y, r:34};   // v299: the Grave Statue in the middle of the graveyard
  const fenceGate = {x:CEM_CX, y:F.y0};
  // the road: winding down from the gate to the fence, then a gentler path to the statue and on to the tomb
  const outer = sunWindingRoad({x:CEM_CX, y:0}, {x:CEM_CX, y:F.y0-160}, 420, w, h); outer.splice(1, 0, {x:CEM_CX, y:200}); outer.push({x:CEM_CX, y:F.y0+40});
  const inner = sunWindingRoad({x:CEM_CX, y:F.y0+40}, {x:CEM_CX, y:statue.y-70}, 110, w, h);
  const last = sunWindingRoad({x:CEM_CX, y:statue.y+70}, {x:CEM_CX, y:tomb.y-60}, 90, w, h);
  CEM_ROADS = [outer, inner, last]; CEM_ROAD_GRID = sunRoadGrid(CEM_ROADS);
  const camp = {x:CEM_CAMP_SPOT.x, y:CEM_CAMP_SPOT.y, r:30};
  // wrought-iron fence, in short runs so each draws in the right order; one gate where the road comes in
  const obstacles = [], T = 14, seg = (x0,y0,x1,y1)=>{ const horiz = y0===y1, L = horiz ? x1-x0 : y1-y0; for(let o=0;o<L;o+=120){ const l = Math.min(120, L-o); obstacles.push(horiz ? {x:x0+o, y:y0-T/2, w:l, h:T, ironFence:true, horiz:true} : {x:x0-T/2, y:y0+o, w:T, h:l, ironFence:true, horiz:false}); } };
  seg(F.x0, F.y0, fenceGate.x-F.gateHalf, F.y0); seg(fenceGate.x+F.gateHalf, F.y0, F.x1, F.y0);
  seg(F.x0, F.y1, F.x1, F.y1); seg(F.x0, F.y0, F.x0, F.y1); seg(F.x1, F.y0, F.x1, F.y1);
  const gatePosts = [{x:fenceGate.x-F.gateHalf, y:F.y0}, {x:fenceGate.x+F.gateHalf, y:F.y0}];
  const nearFence = (x,y,m)=>(Math.abs(y-F.y0)<m || Math.abs(y-F.y1)<m) && x>F.x0-m && x<F.x1+m || (Math.abs(x-F.x0)<m || Math.abs(x-F.x1)<m) && y>F.y0-m && y<F.y1+m;
  function offLimits(x,y,m){
    m = m||0;
    return cemRoadDist(x,y) < CEM_ROAD_HALFW+30+m || dist({x,y},sunlitGate) < 160 || dist({x,y},tomb) < 190 || dist({x,y},statue) < 200 || dist({x,y},camp) < 230 || nearFence(x,y,40);
  }
  const deadTrees = [];
  for(let i=0;i<220 && deadTrees.length<44;i++){
    const x = rand(60, w-60), y = rand(60, h-60), inF = cemInFence(x,y);
    if(offLimits(x,y,20) || (inF && Math.random()<0.75)) continue;
    if(deadTrees.some(t=>dist(t,{x,y})<140)) continue;
    deadTrees.push({x, y, s:rand(0.8,1.4)});
  }
  // tombstones: rows of them inside the fence, a scatter of older ones along the way down
  const graves = [];
  for(let row=F.y0+110; row<F.y1-80; row+=95){
    for(let col=F.x0+90; col<F.x1-60; col+=78){
      const x = col+rand(-14,14), y = row+rand(-12,12);
      if(Math.random()<0.18 || offLimits(x,y) || dist({x,y},statue) < 260) continue;
      graves.push({x, y, s:rand(0.8,1.2), rot:rand(-0.15,0.15), cross:Math.random()<0.45});
    }
  }
  for(let i=0;i<400 && graves.filter(g=>!cemInFence(g.x,g.y)).length<60;i++){
    const x = rand(60, w-60), y = rand(250, F.y0-80);
    if(offLimits(x,y) || graves.some(g=>dist(g,{x,y})<60)) continue;
    graves.push({x, y, s:rand(0.7,1.1), rot:rand(-0.25,0.25), cross:Math.random()<0.5, old:true});
  }
  // packs inside the fence (they stay away from the statue so its event has room), stragglers outside
  const packAnchors = [];
  for(let t=0;t<4000 && packAnchors.length<CEM_PACK_ANCHOR_TARGET;t++){
    const x = rand(F.x0+120, F.x1-120), y = rand(F.y0+150, F.y1-120);
    if(offLimits(x,y) || dist({x,y},statue) < 480 || dist({x,y},fenceGate) < 260 || packAnchors.some(a=>dist(a,{x,y})<260)) continue;
    packAnchors.push({x,y});
  }
  const stragglers = [];
  for(let t=0;t<4000 && stragglers.length<CEM_STRAGGLERS;t++){
    const x = rand(120, w-120), y = rand(500, F.y0-120);
    if(offLimits(x,y) || dist({x,y},camp) < 800 || dist({x,y},sunlitGate) < 600 || stragglers.some(a=>dist(a,{x,y})<300)) continue;
    stragglers.push({x,y});
  }
  const crowSpots = [];
  for(let t=0;t<2000 && crowSpots.length<CEM_CROW_FLOCKS;t++){
    const x = rand(150, w-150), y = rand(450, h-150);
    if(offLimits(x,y) || dist({x,y},camp) < 800 || dist({x,y},statue) < 450 || crowSpots.some(a=>dist(a,{x,y})<600)) continue;
    crowSpots.push({x,y});
  }
  // the edge of the map: a ring of old graves and dead trees, gaps at the gate
  for(const bp of zoneBorderPoints(w, h, 30, 150, [{x:sunlitGate.x, y:sunlitGate.y, r:160}])){
    if(Math.random()<0.5) graves.push({x:bp.x, y:bp.y, s:rand(0.8,1.1), rot:rand(-0.12,0.12), cross:Math.random()<0.5});
    else deadTrees.push({x:bp.x, y:bp.y, s:rand(0.8,1.3)});
  }
  const graverobbers = makeGraverobbers(camp);
  return { w, h, obstacles, sunlitGate, tomb, statue, deadTrees, graves, waypoint:null, packAnchors, stragglers, crowSpots, camp, graverobbers, gatePosts, fence:F,
    roads:CEM_ROADS, roadGrid:CEM_ROAD_GRID, entranceSpot:CEMETERY_ENTRANCE_SPOT };
}
// wrought-iron fencing: black posts with spear-tip finials, two rails, the odd bent or missing bar
function drawIronFenceIso(o){
  const L = o.horiz ? o.w : o.h, cx = o.x+o.w/2, cy = o.y+o.h/2, H = 38;
  const at = (k)=> o.horiz ? toIso(o.x+k, cy) : toIso(cx, o.y+k);
  ctx.save(); ctx.lineCap = 'round';
  const a = at(0), b = at(L);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x, a.y+2); ctx.lineTo(b.x, b.y+2); ctx.stroke();
  ctx.strokeStyle = '#17151b'; ctx.lineWidth = 2.2;
  for(const hh of [H*0.35, H*0.8]){ ctx.beginPath(); ctx.moveTo(a.x, a.y-hh); ctx.lineTo(b.x, b.y-hh); ctx.stroke(); }
  for(let k=0;k<=L;k+=15){
    const q = at(k), big = k%60===0, sd = tileHash(Math.round(o.x+k), Math.round(o.y)), hh = big ? H+8 : H + (sd>0.9 ? -10 : 0);
    if(!big && sd < 0.06) continue;   // a missing bar
    ctx.strokeStyle = big ? '#201d24' : '#1a181e'; ctx.lineWidth = big ? 3.4 : 1.6;
    const lean = !big && sd > 0.94 ? 4 : 0;
    ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x+lean, q.y-hh); ctx.stroke();
    ctx.fillStyle = '#2a262e'; ctx.beginPath(); ctx.moveTo(q.x+lean-2.4, q.y-hh+1); ctx.lineTo(q.x+lean, q.y-hh-6); ctx.lineTo(q.x+lean+2.4, q.y-hh+1); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(150,140,170,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y-H*0.8-1); ctx.lineTo(b.x, b.y-H*0.8-1); ctx.stroke();   // a dull sheen on the top rail
  ctx.restore();
}
// the two stone gateposts either side of the opening, each topped with a little iron lantern
function drawCemGatePostIso(gp, clock){
  drawBlock({x:gp.x-12, y:gp.y-12, w:24, h:24}, 62, '#4a4852', '#1a1920', '#2c2a33');
  const io = toIso(gp.x, gp.y), fl = 0.7+0.3*Math.sin((clock||0)*5+gp.x);
  ctx.save(); ctx.fillStyle = 'rgba(160,220,140,'+(0.35*fl)+')'; ctx.beginPath(); ctx.arc(io.x, io.y-74, 14, 0, 7); ctx.fill();
  ctx.fillStyle = '#1a181e'; ctx.fillRect(io.x-4, io.y-80, 8, 10); ctx.fillStyle = 'rgba(190,240,170,'+(0.8*fl)+')'; ctx.fillRect(io.x-2.5, io.y-78, 5, 6); ctx.restore();
}
// the graverobbers' camp: a small fire, bedrolls, a shovel stuck in a heap of dirt and a sack of "finds"
function drawGraverobberCampIso(c, clock){
  const t = clock||0, at = (dx,dy)=>toIso(c.x+dx, c.y+dy);
  ctx.save();
  for(const [dx,dy,col] of [[-70,-40,'#5a4a3a'],[60,-60,'#4a3e46'],[-30,60,'#3e4a3a']]){ const q = at(dx,dy); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(q.x, q.y, 22, 8, 0.2, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(q.x+10, q.y-1, 6, 4, 0, 0, 7); ctx.fill(); }
  const dirt = at(80,40); ctx.fillStyle = '#3a3026'; ctx.beginPath(); ctx.ellipse(dirt.x, dirt.y-4, 18, 9, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(dirt.x+2, dirt.y-6); ctx.lineTo(dirt.x+6, dirt.y-34); ctx.stroke();
  ctx.fillStyle = '#8a8e96'; ctx.beginPath(); ctx.moveTo(dirt.x-2, dirt.y-4); ctx.lineTo(dirt.x+6, dirt.y-4); ctx.lineTo(dirt.x+4, dirt.y+4); ctx.lineTo(dirt.x, dirt.y+4); ctx.closePath(); ctx.fill();
  const sack = at(-80,30); ctx.fillStyle = '#7a6a48'; ctx.beginPath(); ctx.ellipse(sack.x, sack.y-8, 10, 12, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e8c44a'; ctx.beginPath(); ctx.arc(sack.x+3, sack.y-19, 2.4, 0, 7); ctx.fill();
  const f = at(0,0); drawShadow(f.x, f.y, 14, 5);
  ctx.fillStyle = '#4a4038'; for(let i=0;i<7;i++){ const a = i*0.9; ctx.beginPath(); ctx.arc(f.x+Math.cos(a)*11, f.y+Math.sin(a)*5, 3, 0, 7); ctx.fill(); }
  const fl = 0.8+0.2*Math.sin(t*9);
  const gl = ctx.createRadialGradient(f.x, f.y-8, 2, f.x, f.y-8, 60); gl.addColorStop(0,'rgba(255,170,70,'+(0.35*fl)+')'); gl.addColorStop(1,'rgba(255,120,40,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(f.x, f.y-8, 60, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.moveTo(f.x-6, f.y); ctx.quadraticCurveTo(f.x, f.y-26*fl, f.x+6, f.y); ctx.fill();
  ctx.fillStyle = '#ffe07a'; ctx.beginPath(); ctx.moveTo(f.x-3, f.y); ctx.quadraticCurveTo(f.x, f.y-14*fl, f.x+3, f.y); ctx.fill();
  ctx.restore();
}
// ---------- Grave Statue event (v299) ----------
// Touch the statue: "None shall pass". Three waves of skeletons claw out of the graves, then a final pack of 5 Skeletal Brutes; clear them and the Dark Crypt opens.
const CEM_MULT = 5;   // v309: 5x as many monsters, arriving 5x as fast
const CEM_WAVES = [ {skeleton:6}, {skeleton:7, skeletonarcher:2}, {skeleton:8, skeletonarcher:3}, {skeletonbrute:5} ];
function cemeterySpawnFromGraves(g, type, n){
  const st = g.cem.statue;
  for(let i=0;i<n;i++){
    // v309: they claw up in a ring close around the statue instead of from the far graves
    const a = rand(0, Math.PI*2), rr = rand(170, 420);   // v490: spread wider
    const sp = {x:clamp(st.x+Math.cos(a)*rr, 40, g.cem.w-40), y:clamp(st.y+Math.sin(a)*rr*0.8, 40, g.cem.h-40)};
    const e = spawnEnemy(g, type, sp);
    if(!e) continue;
    e.engaged = true; e.aggroed = true; e.cemEvt = true; e.aggroRange = 2000; e.leashRange = 99999; e.stunT = Math.max(e.stunT||0, 0.5);
    g.particles.push({type:'burst', x:e.x, y:e.y, t:0.45, max:0.45, color:'#7a6a58'});
    g.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:34, color:'#6a5a48'});
  }
}
// v453 rework: 5-7 risen dead every 5 seconds for 20 seconds, then 3 skeleton brutes burst out beside the crypt entrance.
// When every one of them is dead, the crypt opens.
const CEM_BATCH_EVERY = 5, CEM_BATCH_TIME = 40, CEM_BRUTES = 3;   // v490: twice the waves (8 over 40s), each about half the size
function startCemeteryEvent(g){
  g.cem.evt = {stage:1, t:0, nextBatch:0, brutes:false};
  showBigMsg('None shall pass', '', 3.4, true);
  shakeScreen(g, 5, 0.5);
  g.particles.push({type:'ring', x:g.cem.statue.x, y:g.cem.statue.y, t:0.7, max:0.7, r:240, color:'#9a4aff'});
}
function updateCemeteryEvent(g, p, dt){
  const ev = g.cem.evt; if(!ev || ev.stage<=0 || p.cemeteryCleared) return;
  if(ev.t==null){ ev.t = 0; ev.nextBatch = 0; ev.brutes = false; }   // an event started by an older version
  ev.t += dt;
  if(ev.t < CEM_BATCH_TIME){
    if(ev.t >= ev.nextBatch){
      const n = 3 + Math.floor(Math.random()*2), arch = Math.floor(n/3);
      cemeterySpawnFromGraves(g, 'skeleton', n-arch); cemeterySpawnFromGraves(g, 'skeletonarcher', arch);
      ev.nextBatch += CEM_BATCH_EVERY;
      showMsg('The dead rise...', 1.6, '#c8b0ff');
    }
    return;
  }
  if(!ev.brutes){
    ev.brutes = true;
    const tb = g.cem.tomb;
    for(let i=0;i<CEM_BRUTES;i++){
      const a = -Math.PI*0.5 + (i-1)*0.7, sp = {x:clamp(tb.x+Math.cos(a)*170, 40, g.cem.w-40), y:clamp(tb.y+Math.sin(a)*170, 40, g.cem.h-40)};
      const e = spawnEnemy(g, 'skeletonbrute', sp); if(!e) continue;
      e.engaged = true; e.aggroed = true; e.cemEvt = true; e.aggroRange = 2000; e.leashRange = 99999; e.stunT = Math.max(e.stunT||0, 0.6);
      g.particles.push({type:'burst', x:sp.x, y:sp.y, t:0.6, max:0.6, color:'#9a8a78'});
    }
    showMsg('Brutes guard the crypt entrance', 2.4, '#c8b0ff'); shakeScreen(g, 4, 0.4);
    return;
  }
  if(g.enemies.some(e=>e.cemEvt && e.hp>0)) return;
  ev.stage = 0;
  p.cemeteryCleared = true; saveGame();
  showBigMsg('The way opens', '', 3.2); shakeScreen(g, 6, 0.6);
  g.particles.push({type:'ring', x:g.cem.tomb.x, y:g.cem.tomb.y, t:0.8, max:0.8, r:200, color:'#ffe9a0'});
}
function drawGraveStatueIso(st, clock, active, done){
  const iso = toIso(st.x, st.y), cx = iso.x, cy = iso.y;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx+6, cy+6, 46, 20, 0, 0, 7); ctx.fill();
  // stepped plinth (two iso slabs)
  function slab(w, y0, hgt, top, left, right){
    const dy = w*0.5;
    ctx.fillStyle = left; ctx.beginPath(); ctx.moveTo(cx-w, y0-hgt); ctx.lineTo(cx, y0-hgt+dy); ctx.lineTo(cx, y0+dy); ctx.lineTo(cx-w, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = right; ctx.beginPath(); ctx.moveTo(cx+w, y0-hgt); ctx.lineTo(cx, y0-hgt+dy); ctx.lineTo(cx, y0+dy); ctx.lineTo(cx+w, y0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = top; ctx.beginPath(); ctx.moveTo(cx, y0-hgt-dy); ctx.lineTo(cx+w, y0-hgt); ctx.lineTo(cx, y0-hgt+dy); ctx.lineTo(cx-w, y0-hgt); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.stroke();
  }
  slab(46, cy+4, 10, '#8c8f98', '#5d6068', '#46484f');
  slab(32, cy-6, 14, '#9a9da6', '#666971', '#4c4e56');
  const by = cy-20;   // base of the cross
  // cross: tall shaft + arms with a lit left face and dark right face
  function bar(x0, y0, w, hgt){
    ctx.fillStyle = '#a9acb4'; ctx.fillRect(x0, y0, w*0.55, hgt);
    ctx.fillStyle = '#6a6d76'; ctx.fillRect(x0+w*0.55, y0, w*0.45, hgt);
    ctx.strokeStyle = 'rgba(10,10,16,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(x0, y0, w, hgt);
  }
  bar(cx-7, by-96, 14, 96);          // shaft
  bar(cx-30, by-74, 60, 13);         // arms
  ctx.fillStyle = '#b9bcc4'; ctx.beginPath(); ctx.moveTo(cx-7, by-96); ctx.lineTo(cx, by-102); ctx.lineTo(cx+7, by-96); ctx.closePath(); ctx.fill(); ctx.stroke();
  // weathering: cracks and moss
  ctx.strokeStyle = 'rgba(20,20,28,0.55)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx-3, by-90); ctx.lineTo(cx-1, by-80); ctx.lineTo(cx-4, by-70); ctx.moveTo(cx+18, by-72); ctx.lineTo(cx+20, by-65); ctx.stroke();
  ctx.fillStyle = 'rgba(70,110,60,0.55)'; ctx.beginPath(); ctx.ellipse(cx-4, by-6, 9, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+22, by-62, 5, 3, 0, 0, 7); ctx.fill();
  // skull carved on the shaft
  ctx.fillStyle = '#2c2c34'; ctx.beginPath(); ctx.arc(cx-1, by-46, 5, 0, 7); ctx.fill();
  ctx.fillStyle = '#d4d6dc'; ctx.fillRect(cx-3.5, by-47.5, 2, 2.4); ctx.fillRect(cx+0.5, by-47.5, 2, 2.4);
  // aura: slow violet pulse while waiting, hard pulse during the event, gone once the crypt is open
  if(!done){
    const k = active ? 0.5+0.5*Math.sin(clock*9) : 0.5+0.5*Math.sin(clock*2.2);
    const gr = ctx.createRadialGradient(cx, by-60, 2, cx, by-60, 70);
    gr.addColorStop(0, 'rgba(160,90,255,'+(0.22+0.3*k*(active?1.4:0.8))+')'); gr.addColorStop(1, 'rgba(120,60,200,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, by-60, 70, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function spawnCemeteryPack(g, anchor, template){
  const t = template || CEM_PACK_TEMPLATES[Math.floor(Math.random()*CEM_PACK_TEMPLATES.length)];
  const n = forestPackSize(t);
  const spread = 90 + n*16;
  for(let i=0;i<n;i++){
    spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
  }
}
function enterCursedCemetery(from){
  const g = game;
  g.scene = 'cursedcemetery';
  // Waypoint rework: reachedCursedCemetery is no longer set on mere zone
  // entry -- it's now set when the player walks up to this zone's own
  // waypoint marker (see the nearCemWaypoint proximity check in update(),
  // which calls discoverWaypoint).
  g.cem = makeCursedCemetery();   // (no waypoint since v453)
  g.room = g.cem;
  // Fixed area level (static difficulty)
  g.depth = 17;
  if(from==='crypt'){
    // Arrives just north of the tomb, same "beside the gate you came from"
    // convention -- the Dark Crypt's own return gate leads back out beside
    // the tomb it's entered through, not all the way back at the north
    // entrance.
    g.player.x = g.cem.tomb.x; g.player.y = g.cem.tomb.y - 90;
  } else if(from==='waypoint'){
    // Waypoint rework: arriving via the Teleport menu lands the player AT
    // this zone's own waypoint marker -- see openTeleportMenu's
    // teleportCursedCemeteryBtn.
    g.player.x = g.cem.sunlitGate.x; g.player.y = g.cem.sunlitGate.y + 120;
  } else {
    // Arrives just south of the north entrance gate, same convention.
    g.player.x = g.cem.sunlitGate.x; g.player.y = g.cem.sunlitGate.y + 120;
  }
  owFeatures(g);   // v525: random mausoleums and broken plot walls
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Cursed Cemetery', 1.4);
  // Same pack-anchor/pool-density approach as every other overworld zone,
  // just scaled to this zone's own (half-area) CEM_PACK_ANCHOR_TARGET/
  // CEM_PACK_COUNT above -- skipped entirely once the zone has already
  // been cleared once (p.cemeteryCleared), so a returning player doesn't
  // have to fight through a freshly-repopulated graveyard just to reach
  // the now-unlocked tomb.
  if(!g.player.cemeteryCleared){
    const anchors = shuffle(g.cem.packAnchors.slice());
    const count = Math.min(CEM_PACK_COUNT, anchors.length);
    for(let i=0;i<count;i++){
      spawnCemeteryPack(g, anchors[i]);
    }
  }
  // v532: stragglers shambling along the way down, and crows on the old graves
  for(const a of g.cem.stragglers){ const n = 1 + Math.floor(Math.random()*3); for(let i=0;i<n;i++){ const e = spawnEnemy(g, i===2 || Math.random()<0.2 ? 'skeletonarcher' : 'skeleton', {x:a.x+rand(-70,70), y:a.y+rand(-60,60)}); if(e) e.wanderRadius = 90; } }
  for(const a of g.cem.crowSpots){ const n = 3 + Math.floor(Math.random()*2); for(let i=0;i<n;i++){ const e = spawnEnemy(g, 'vulture', {x:a.x+rand(-60,60), y:a.y+rand(-50,50)}); if(!e) continue;
    e.crow = true; e.name = 'Crow'; e.r = 10; e.maxHp = e.hp = Math.round(e.maxHp*0.6); e.dmg *= 0.7; e.aggroRange = 210; e.wanderRadius = 70; } }
  // nothing starts close to the graverobbers' camp
  { const c = g.cem.camp; g.enemies = g.enemies.filter(e=>dist(e, c) > 650); }
  owPoiRoll(g);   // v525: caches, a shrine, a guarded hoard
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

