// ---------------- Withered Crossroads (v69) ----------------
// Second of the 6-batch "new area off the Dark Forest" sequence -- an open,
// sparse grassland reached via the Forest's new sunGate (top-middle exit,
// using the strip the v68 batch deliberately kept clear for this). Same
// structural shape as the Forest/Mountain Pass (open standing-population
// zone, no genRoom() floors), but laid out as a simple "+"-shaped crossroad
// instead of one winding trail: a straight north-south road runs from the
// entrance at the top down through the exact center, where an east-west
// road crosses it. Three of that cross's four ends are future zone exits
// (see SUNLIT_* reserved-spot constants below) that later batches will
// wire up -- this batch only leaves them clean and open. Same footprint as
// the (v68-expanded) Dark Forest, so the two zones read as comparable in
// scale.
const SUN_W = FOREST_W, SUN_H = FOREST_H;
// Fixed (not randomized) crossroad geometry -- every exit/waypoint/pack
// anchor below is placed relative to these, so a future batch dropping in
// the Lighthouse Tower/Lakeside Ruins/Cursed Cemetery triggers can find
// its exact spot from these constants alone rather than recomputing it:
//   - North entrance (from the Dark Forest): (SUN_CX, 16)
//   - Crossroad center (also the waypoint's neighborhood): (SUN_CX, SUN_CY)
//   - South reserved exit (future Cursed Cemetery, batch 5): (SUN_CX, SUN_H-16)
//   - West reserved exit (future Lighthouse Tower, batch 3): (16, SUN_CY)
//   - East reserved exit (future Lakeside Ruins, batch 4): (SUN_W-16, SUN_CY)
const SUN_CX = SUN_W/2, SUN_CY = SUN_H/2;
const SUN_ROAD_HALFW = 46; // visual road width either side of centerline, see drawSunlitPlainsFloor
// (v527: the real gates are random now -- see makeSunlitPlains; these are only the old centred defaults)
const SUNLIT_SOUTH_EXIT_SPOT = {x:SUN_CX, y:SUN_H-16};
const SUNLIT_WEST_EXIT_SPOT = {x:16, y:SUN_CY};
const SUNLIT_EAST_EXIT_SPOT = {x:SUN_W-16, y:SUN_CY};
// How many pack anchors to try to place -- reuses the Dark Forest's own
// post-v68 target/spacing 1-for-1 since the two zones share the exact same
// footprint, so pack density and the spread-out, not-clumped feel match.
const SUNLIT_PACK_ANCHOR_TARGET = FOREST_PACK_ANCHOR_TARGET;
const SUNLIT_PACK_COUNT = 70;
// v527: the Lighthouse (west), Lakeside Ruins (east) and Cemetery (south) gates sit at a random spot along their
// edge every visit; a winding old road runs from each gate (and from the Forest gate) into the crossroad centre
// beside the waypoint. room.roads = the smoothed polylines, room.roadGrid = buckets for sunRoadNear().
function sunWindingRoad(a, b, wob, bw, bh){
  bw = bw || SUN_W; bh = bh || SUN_H;
  const dx = b.x-a.x, dy = b.y-a.y, L = Math.hypot(dx,dy)||1, nx = -dy/L, ny = dx/L;
  const key = [a];
  const mids = L > 1400 ? 3 : 2;
  for(let i=1;i<=mids;i++){ const t = i/(mids+1), o = (i%2 ? 1 : -1)*rand(0.45,1)*wob*(Math.random()<0.5?1:-1); key.push({x:a.x+dx*t+nx*o, y:a.y+dy*t+ny*o}); }
  key.push(b);
  const out = [];
  for(let i=0;i<key.length-1;i++){
    const p0 = key[Math.max(0,i-1)], p1 = key[i], p2 = key[i+1], p3 = key[Math.min(key.length-1,i+2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2.x-p1.x, p2.y-p1.y)/60));
    for(let k=0;k<n;k++){ const t = k/n, t2 = t*t, t3 = t2*t;
      const cr = (q0,q1,q2,q3)=>0.5*((2*q1) + (-q0+q2)*t + (2*q0-5*q1+4*q2-q3)*t2 + (-q0+3*q1-3*q2+q3)*t3);
      out.push({x:clamp(cr(p0.x,p1.x,p2.x,p3.x), 60, bw-60), y:clamp(cr(p0.y,p1.y,p2.y,p3.y), 60, bh-60)}); }
  }
  out.push({x:b.x, y:b.y});
  return out;
}
function sunRoadGrid(roads){
  const C = 200, G = new Map(), R = 200;
  roads.forEach((rd,ri)=>{ for(let i=0;i<rd.length-1;i++){
    const a = rd[i], b = rd[i+1];
    for(let gx=Math.floor((Math.min(a.x,b.x)-R)/C); gx<=Math.floor((Math.max(a.x,b.x)+R)/C); gx++)
      for(let gy=Math.floor((Math.min(a.y,b.y)-R)/C); gy<=Math.floor((Math.max(a.y,b.y)+R)/C); gy++){ const k = gx*10000+gy; let L = G.get(k); if(!L) G.set(k, L = []); L.push(ri*100000+i); }
  } });
  return {C, G};
}
// nearest road point: {d, ux, uy (unit direction along the road), off (signed side offset)}
function sunRoadNear(room, x, y){
  const out = {d:1e9, ux:1, uy:0, off:0};
  const RG = room && room.roadGrid; if(!RG) return out;
  const L = RG.G.get(Math.floor(x/RG.C)*10000 + Math.floor(y/RG.C)); if(!L) return out;
  for(const id of L){
    const rd = room.roads[Math.floor(id/100000)], i = id%100000, a = rd[i], b = rd[i+1];
    const vx = b.x-a.x, vy = b.y-a.y, ll = vx*vx+vy*vy||1, t = clamp(((x-a.x)*vx+(y-a.y)*vy)/ll,0,1);
    const px = a.x+vx*t, py = a.y+vy*t, d = Math.hypot(x-px, y-py);
    if(d < out.d){ const l = Math.sqrt(ll); out.d = d; out.ux = vx/l; out.uy = vy/l; out.off = ((x-px)*(-out.uy) + (y-py)*out.ux); }
  }
  return out;
}
const SUNLIT_PACK_TEMPLATES = [
  { type:'bandit', countMin:2, countMax:4 },
  { type:'bandit', countMin:2, countMax:4 },
  { type:'banditarcher', countMin:1, countMax:3 },
  { type:'boar', countMin:1, countMax:3 },
];
function makeSunlitPlains(){
  const w=SUN_W, h=SUN_H;
  const forestGate = {x:SUN_CX, y:16, r:34};
  // v527: random gate spots along each edge, and the winding roads that join them at the centre
  const westGate = {x:16, y:Math.round(rand(h*0.2, h*0.8)), r:34};
  const eastGate = {x:w-16, y:Math.round(rand(h*0.2, h*0.8)), r:34};
  const southGate = {x:Math.round(rand(w*0.22, w*0.78)), y:h-16, r:34};
  const ctr = {x:SUN_CX, y:SUN_CY};
  const roads = [
    sunWindingRoad(ctr, {x:forestGate.x, y:0}, 260),
    sunWindingRoad(ctr, {x:0, y:westGate.y}, 380),
    sunWindingRoad(ctr, {x:w, y:eastGate.y}, 380),
    sunWindingRoad(ctr, {x:southGate.x, y:h}, 300),
  ];
  // the last stretch runs straight in through each gate
  roads[0].splice(-1, 0, {x:forestGate.x, y:220}); roads[1].splice(-1, 0, {x:240, y:westGate.y});
  roads[2].splice(-1, 0, {x:w-240, y:eastGate.y}); roads[3].splice(-1, 0, {x:southGate.x, y:h-220});
  const roadGrid = sunRoadGrid(roads);
  const roomR = {roads, roadGrid};

  // sparse decoration only -- "mostly simple grass and rock, open
  // landscape" per the brief, deliberately far sparser than the Forest's
  // tree scatter (which this zone has none of) to read as open plains by
  // contrast. Kept off both roads and away from the crossroad center/exits.
  function onRoad(x,y){ return sunRoadNear(roomR, x, y).d < SUN_ROAD_HALFW; }
  const rocks = [];
  for(let i=0;i<70;i++){
    const x = rand(70, w-70), y = rand(70, h-70);
    if(onRoad(x,y)) continue;
    rocks.push({x, y, s:rand(0.6,1.3)});
  }
  const grassTufts = [];
  for(let i=0;i<160;i++){
    const x = rand(50, w-50), y = rand(50, h-50);
    if(onRoad(x,y)) continue;
    grassTufts.push({x, y, s:rand(0.7,1.2), c:['#8a7a4a','#7d6c42','#6e6a3e','#94844f'][Math.floor(Math.random()*4)]});   // v522: dead, sun-bleached grass
  }

  // A dedicated, permanent waypoint fixture, same shared mechanism/art as
  // Town's and Mountain Pass's (see drawWaypointIso/openTeleportMenu) --
  // nudged off to the side of the crossroad center so it doesn't sit
  // directly on either road's visual centerline.
  const waypoint = {x:SUN_CX+150, y:SUN_CY-150, r:22};

  const packAnchors = [];
  let tries=0;
  while(packAnchors.length < SUNLIT_PACK_ANCHOR_TARGET && tries<6000){
    tries++;
    const x = rand(140, w-140), y = rand(140, h-140);
    if(onRoad(x,y)) continue;
    if(dist({x,y},forestGate) < 560) continue;   // v350: pack anchors keep well clear of the entrance (pack members scatter up to ~280 around their anchor)
    if(sunRoadNear(roomR, x, y).d < 120) continue;   // v527: packs camp beside the roads, not on them
    if(dist({x,y},southGate) < 440 || dist({x,y},westGate) < 440 || dist({x,y},eastGate) < 440) continue;
    if(dist({x,y},waypoint) < 520) continue;
    if(packAnchors.some(a=>dist(a,{x,y}) < 280)) continue;
    packAnchors.push({x,y});
  }

  // Zone-edge boundary markers (Sept 2026 patch): a ring of the same
  // boulder prop (drawPlainsRockIso) already used for this zone's interior
  // scatter, walking the outer edge so the playable area's border reads
  // clearly at a glance -- gaps left at all 4 gates so none of them get
  // blocked. Pushed into the same `rocks` array/render pass as the interior
  // scatter above, so no new drawing code is needed.
  for(const bp of zoneBorderPoints(w, h, 40, 220, [
    {x:forestGate.x, y:forestGate.y, r:150},
    {x:westGate.x, y:westGate.y, r:150},
    {x:eastGate.x, y:eastGate.y, r:150},
    {x:southGate.x, y:southGate.y, r:150},
  ])){
    rocks.push({x:bp.x, y:bp.y, s:rand(0.7,1.3)});
  }

  // v193 scenery: ponds, haystacks, fenced farm plots with scarecrows, wildflowers, berry bushes, cairns, wagons, a windmill
  const sunProps = [], sunDecor = [], reserved = [];
  const gatesS = [forestGate, westGate, eastGate, southGate, waypoint];
  const offRoadS = (x,y,m)=>sunRoadNear(roomR, x, y).d > SUN_ROAD_HALFW+m;
  const boxFree = (list,x,y,ww,hh,m)=>!list.some(o=>x<o.x+o.w+m && x+ww>o.x-m && y<o.y+o.h+m && y+hh>o.y-m);
  const sFree = (x,y,ww,hh,m)=>offRoadS(x,y,m) && offRoadS(x+ww,y+hh,m) && offRoadS(x+ww,y,m) && offRoadS(x,y+hh,m) && x>150 && y>150 && x+ww<w-150 && y+hh<h-150
    && gatesS.every(gt=>dist({x:x+ww/2,y:y+hh/2},gt)>280) && boxFree(sunProps,x,y,ww,hh,50) && boxFree(reserved,x,y,ww,hh,30);
  for(let i=0;i<500 && sunProps.filter(o=>o.kind==='pond').length<7;i++){ const ww=rand(170,290), hh=rand(120,210), x=rand(160,w-160-ww), y=rand(160,h-160-hh); if(sFree(x,y,ww,hh,90)) sunProps.push(makePondProps(x,y,ww,hh,true)); }
  for(let n=0;n<3;n++) for(let tr=0;tr<120;tr++){
    const px=rand(200,w-560), py=rand(200,h-460), rw=6*46, rh=4*46;
    if(!sFree(px,py,rw,rh,130)) continue;
    reserved.push({x:px,y:py,w:rw,h:rh});
    for(let i=0;i<6;i++){ sunDecor.push({k:'fence',x:px+i*46,y:py,horiz:true}); if(i!==2&&i!==3) sunDecor.push({k:'fence',x:px+i*46,y:py+rh,horiz:true}); }
    for(let j=0;j<4;j++){ sunDecor.push({k:'fence',x:px,y:py+j*46,horiz:false}); sunDecor.push({k:'fence',x:px+rw,y:py+j*46,horiz:false}); }
    sunDecor.push({k:'scarecrow',x:px+rw/2,y:py+rh/2});
    for(let r=0;r<3;r++) sunDecor.push({k:'flowers',x:px+70+r*70,y:py+60+(r%2)*70,n:11,r:34,cols:['#e8c44a','#d8b03a','#f0d868']});
    break;
  }
  for(let i=0;i<600 && sunProps.filter(o=>o.kind==='haystack').length<14;i++){ const x=rand(160,w-200), y=rand(160,h-200); if(sFree(x,y,44,36,60)) sunProps.push({x,y,w:44,h:36,isProp:true,kind:'haystack'}); }
  for(let i=0;i<300;i++){ const x=rand(180,w-260), y=rand(180,h-260); if(sFree(x-40,y-30,80,60,150)){ sunProps.push({x:x-24,y:y-14,w:48,h:30,isProp:true,kind:'windmillbase'}); break; } }
  const dFree = (x,y)=>offRoadS(x,y,10) && boxFree(sunProps,x,y,1,1,14) && boxFree(reserved,x,y,1,1,-4);
  const palettes = [['#f4d03a','#ffffff','#f49ac1'],['#7aa8ff','#ffffff','#c9a0ff'],['#ff7a5a','#ffd27a','#ffffff'],['#f49ac1','#ffffff','#ffd2e6']];
  for(let i=0;i<150;i++){ const x=rand(80,w-80), y=rand(80,h-80); if(dFree(x,y)) sunDecor.push({k:'flowers',x,y,n:Math.floor(rand(6,13)),r:rand(28,60),cols:palettes[i%palettes.length]}); }
  for(let i=0;i<110;i++){ const x=rand(80,w-80), y=rand(80,h-80); if(dFree(x,y)) sunDecor.push({k:'bush',x,y,s:rand(0.8,1.4),berries:Math.random()<0.4}); }
  for(let i=0;i<14;i++){ const x=rand(80,w-80), y=rand(80,h-80); if(dFree(x,y)) sunDecor.push({k:'cairn',x,y}); }
  for(let i=0;i<3;i++){ const rd = roads[Math.floor(Math.random()*4)], q = rd[Math.floor(rand(0.25,0.8)*rd.length)], nr = sunRoadNear(roomR, q.x, q.y), side = Math.random()<0.5?-1:1;
    const x = q.x - nr.uy*side*(SUN_ROAD_HALFW+70), y = q.y + nr.ux*side*(SUN_ROAD_HALFW+70);
    if(gatesS.every(gt=>dist({x,y},gt)>240) && offRoadS(x,y,40)) sunDecor.push({k:'wagon',x,y}); }
  return { w, h, obstacles:sunProps, decor:sunDecor, forestGate, westGate, eastGate, southGate, rocks, grassTufts, waypoint, packAnchors, roads, roadGrid,
    southExitSpot:{x:southGate.x, y:southGate.y}, westExitSpot:{x:westGate.x, y:westGate.y}, eastExitSpot:{x:eastGate.x, y:eastGate.y} };
}
function spawnSunlitPack(g, anchor, template){
  const t = template || SUNLIT_PACK_TEMPLATES[Math.floor(Math.random()*SUNLIT_PACK_TEMPLATES.length)];
  const n = forestPackSize(t);
  const spread = 100 + n*18;
  for(let i=0;i<n;i++){
    spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
  }
}

