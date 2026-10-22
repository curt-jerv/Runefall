// ---------------- Lakeside Ruins (v71) ----------------
// Fourth of the 6-batch "new area" sequence, reached from Withered Crossroads'
// own reserved east exit (SUNLIT_EAST_EXIT_SPOT/g.sun.eastGate). Same open,
// standing-population zone shape as the Forest/Mountain Pass/Withered Crossroads
// (no genRoom() floors), and the exact same footprint as Withered Crossroads
// (LAKE_W/LAKE_H = SUN_W/SUN_H) -- but instead of a "+"-shaped crossroad,
// a single straight road enters from the WEST edge (mirroring "the road
// enters from the left" -- the player arrives here coming out of Sunlit
// Plains' east gate) and runs to a bridge/causeway crossing a big lake at
// dead center, reaching a round island exactly in the middle of the lake.
// The island carries a ring of tall standing stones -- a "Stonehenge"
// landmark (drawLakesideStoneIso) -- purely decorative/atmospheric.
//
// Water/collision (judgment call -- no prior convention for blocking
// terrain existed outside dungeon walls): the lake is modeled as TWO
// rectangles pushed into room.obstacles exactly like any other obstacle,
// so the existing pushOutOfRect/posBlockedByObstacles/steerAngleTo
// machinery blocks player and land-enemy foot movement into it for free,
// the same way it already blocks movement into a dungeon wall -- no new
// collision system needed. Each rect is flagged {isWater:true}, and that
// flag is exempted in exactly two places elsewhere: the projectile/
// obstacle collision check (so arrows/spells/poison-balls sail OVER water
// instead of splashing into it like a wall would) and the generic
// per-obstacle "draw a stone dungeon block" pass (water is drawn as part
// of the ground tiling instead -- see drawLakesideRuinsFloor). The two
// rects leave a full-width gap at the road's y-band; that gap doubles as
// BOTH the bridge/causeway across the lake AND the ground the island
// itself sits on, so no separate bridge geometry is needed beyond where
// the two lake rects stop and start again.
// v530: the Lakeside Ruins are bigger (7600x5400), forested, and re-rolled every trip: the whole lake complex (lake,
// bridge, island Stonehenge with the Ancient Ruins and the Sunken Depths mouth) sits somewhere random, the west
// (Crossroads) and east (Black Marsh) gates slide along their edges, and winding Crossroads-width roads join each gate
// to the bridge. The LAKE_* globals below are reset by lakeSetCenter() on every build, so everything that reads them
// (the Leviathan lanes, the ruins event, the floor painter) follows the lake. One seed per trip (g._lakeSeed), kept
// while you stay in the lake country (lakeKeepsSeed: the Ruins, Ancient Ruins, Sunken Depths, Flooded Temple).
let LAKE_W = 7600, LAKE_H = 5400;
let LAKE_CX = LAKE_W/2, LAKE_CY = LAKE_H/2;
// v531: a smaller lake around the island, and ONE bridge from a random side (LAKE_DIR 'W'|'E'|'N'|'S') out to the
// island. The only gate is the Crossroads one on the west edge (the Black Marsh is reached through the Sunken Depths).
const LAKE_ROAD_HALFW = 100;   // the stone bridge (the land road is SUN_ROAD_HALFW, like the Crossroads)
const LAKE_MARGIN = 380;       // open water between the island and the shore
let LAKESIDE_ENTRANCE_SPOT = {x:16, y:LAKE_CY};
let LAKE_DIR = 'W', LAKE_RECT = null, LAKE_BRIDGE = null;
let LAKE_WATER_X = 0, LAKE_WATER_W = 0, LAKE_WATER_Y0 = 0, LAKE_WATER_Y1 = 0;   // the lake's bounds (kept for older callers)
// (v121) The island is a big walkable landmass: 800x600, carved out of the lake with real collision.
const LAKE_ISLAND_HX = 400, LAKE_ISLAND_HY = 300;
const LAKE_ISLAND_R = LAKE_ISLAND_HX; // kept for the test export
let LAKE_ROADS = [], LAKE_ROAD_GRID = null;
function lakeSetCenter(cx, cy, dir){
  LAKE_CX = cx; LAKE_CY = cy; LAKE_DIR = dir || 'W';
  const L = LAKE_RECT = {x0:cx-LAKE_ISLAND_HX-LAKE_MARGIN, x1:cx+LAKE_ISLAND_HX+LAKE_MARGIN, y0:cy-LAKE_ISLAND_HY-LAKE_MARGIN, y1:cy+LAKE_ISLAND_HY+LAKE_MARGIN};
  LAKE_WATER_X = L.x0; LAKE_WATER_W = L.x1-L.x0; LAKE_WATER_Y0 = L.y0; LAKE_WATER_Y1 = L.y1;
  const bh = LAKE_ROAD_HALFW, IX0 = cx-LAKE_ISLAND_HX, IX1 = cx+LAKE_ISLAND_HX, IY0 = cy-LAKE_ISLAND_HY, IY1 = cy+LAKE_ISLAND_HY;
  LAKE_BRIDGE = dir==='E' ? {x0:IX1-10, x1:L.x1+10, y0:cy-bh, y1:cy+bh, horiz:true}
              : dir==='N' ? {x0:cx-bh, x1:cx+bh, y0:L.y0-10, y1:IY0+10, horiz:false}
              : dir==='S' ? {x0:cx-bh, x1:cx+bh, y0:IY1-10, y1:L.y1+10, horiz:false}
              :             {x0:L.x0-10, x1:IX0+10, y0:cy-bh, y1:cy+bh, horiz:true};
}
// the bridge's shore end, and the outward direction from the island
function lakeBridgeShore(){ const d = {W:[-1,0], E:[1,0], N:[0,-1], S:[0,1]}[LAKE_DIR], L = LAKE_RECT;
  return {x: d[0]<0 ? L.x0 : d[0]>0 ? L.x1 : LAKE_CX, y: d[1]<0 ? L.y0 : d[1]>0 ? L.y1 : LAKE_CY, dx:d[0], dy:d[1]}; }
function lakeKeepsSeed(g){ return g.scene==='lakesideruins' || g.scene==='ancientruins' || (g.scene==='lighthouse' && g.tower && (g.tower.subzone==='sunken' || g.tower.subzone==='temple')); }
function lakeRoadDist(x,y){ return LAKE_ROAD_GRID ? sunRoadNear({roads:LAKE_ROADS, roadGrid:LAKE_ROAD_GRID}, x, y).d : 1e9; }
function lakeOnBridge(x,y){ const B = LAKE_BRIDGE; return !!B && x > B.x0 && x < B.x1 && y > B.y0 && y < B.y1; }
function lakeOnRoad(x,y){ return lakeOnBridge(x,y) || lakeRoadDist(x,y) < SUN_ROAD_HALFW; }
function lakeOnIsland(x,y){ return Math.abs(x-LAKE_CX) < LAKE_ISLAND_HX && Math.abs(y-LAKE_CY) < LAKE_ISLAND_HY; }
function lakeWaterAt(x,y){
  const L = LAKE_RECT; if(!L) return false;
  return x>L.x0 && x<L.x1 && y>L.y0 && y<L.y1 && !lakeOnBridge(x,y) && !lakeOnIsland(x,y);
}
// the lake minus the island and the bridge, as plain rectangles: four bands round the island, the bridge's band split in two
function lakeWaterRects(){
  const L = LAKE_RECT, B = LAKE_BRIDGE, IX0 = LAKE_CX-LAKE_ISLAND_HX, IX1 = LAKE_CX+LAKE_ISLAND_HX, IY0 = LAKE_CY-LAKE_ISLAND_HY, IY1 = LAKE_CY+LAKE_ISLAND_HY;
  const R = (x0,y0,x1,y1)=>({x:x0, y:y0, w:x1-x0, h:y1-y0, isWater:true});
  const out = [];
  const band = (x0,y0,x1,y1,side)=>{
    if(side!==LAKE_DIR){ out.push(R(x0,y0,x1,y1)); return; }
    if(B.horiz){ out.push(R(x0,y0,x1,B.y0), R(x0,B.y1,x1,y1)); } else { out.push(R(x0,y0,B.x0,y1), R(B.x1,y0,x1,y1)); }
  };
  band(L.x0, L.y0, L.x1, IY0, 'N'); band(L.x0, IY1, L.x1, L.y1, 'S'); band(L.x0, IY0, IX0, IY1, 'W'); band(IX1, IY0, L.x1, IY1, 'E');
  return out;
}
// Catmull-Rom through key points (as the Crossroads roads)
function lakeSpline(P){
  const out = [];
  for(let i=0;i<P.length-1;i++){
    const p0 = P[Math.max(0,i-1)], p1 = P[i], p2 = P[i+1], p3 = P[Math.min(P.length-1,i+2)];
    const n = Math.max(2, Math.ceil(Math.hypot(p2.x-p1.x, p2.y-p1.y)/60));
    for(let k=0;k<n;k++){ const t = k/n, t2 = t*t, t3 = t2*t;
      const cr = (a,b,c,d)=>0.5*((2*b) + (-a+c)*t + (2*a-5*b+4*c-d)*t2 + (-a+3*b-3*c+d)*t3);
      out.push({x:clamp(cr(p0.x,p1.x,p2.x,p3.x), 60, LAKE_W-60), y:clamp(cr(p0.y,p1.y,p2.y,p3.y), 60, LAKE_H-60)}); }
  }
  out.push(P[P.length-1]);
  return out;
}
// one winding road: the west gate -> round the lake if it has to -> the bridge's shore end
function lakeBuildRoads(gW){
  const L = LAKE_RECT, S = lakeBridgeShore(), A = {x:S.x+S.dx*320, y:S.y+S.dy*320};
  const wet = (rd)=>rd.some(q=>q.x > L.x0-70 && q.x < L.x1+70 && q.y > L.y0-70 && q.y < L.y1+70 && !lakeOnBridge(q.x,q.y));
  let road = null;
  for(let k=0;k<24 && !road;k++){
    const m = 300 + k*25;   // corner clearance round the lake
    const NW = {x:L.x0-m, y:L.y0-m}, NE = {x:L.x1+m, y:L.y0-m}, SW = {x:L.x0-m, y:L.y1+m}, SE = {x:L.x1+m, y:L.y1+m};
    const goNorth = gW.y < LAKE_CY ? Math.random()<0.75 : Math.random()<0.25;
    const corners = LAKE_DIR==='W' ? [] : LAKE_DIR==='N' ? [NW] : LAKE_DIR==='S' ? [SW] : (goNorth ? [NW, NE] : [SW, SE]);
    const first = corners[0] || A, start = {x:200, y:gW.y}, keys = [{x:0, y:gW.y}, start];
    const dx = first.x-start.x, dy = first.y-start.y, len = Math.hypot(dx,dy)||1, nx = -dy/len, ny = dx/len;
    const mids = len > 1600 ? 2 : len > 700 ? 1 : 0;
    for(let i=1;i<=mids;i++){ const t = i/(mids+1), o = rand(-1,1)*Math.min(380, len*0.25); const q = {x:start.x+dx*t+nx*o, y:clamp(start.y+dy*t+ny*o, 300, LAKE_H-300)}; if(q.x > L.x0-m && q.x < L.x1+m && q.y > L.y0-m && q.y < L.y1+m) continue; keys.push(q); }
    keys.push(...corners, A, {x:S.x+S.dx*120, y:S.y+S.dy*120}, {x:S.x-S.dx*20, y:S.y-S.dy*20});
    const r = lakeSpline(keys);
    if(!wet(r.slice(0, -3)) || k===23) road = r;
  }
  LAKE_ROADS = [road]; LAKE_ROAD_GRID = sunRoadGrid(LAKE_ROADS);
}
const LAKE_PACK_ANCHOR_TARGET = 300;   // v530: twice the ground (was the Crossroads' 140)
// Fewer standing packs than Withered Crossroads' 70 -- the lake itself eats a
// large, uninhabitable chunk of this same-sized footprint, so the walkable
// shoreline area is smaller even though the zone's outer bounds match.
const LAKE_PACK_COUNT = 110;   // v530: was 55 on half the area
const LAKE_PACK_TEMPLATES = [
  { type:'bandit', countMin:2, countMax:4 },
  // Skeleton (first appearance, see spawnEnemy's 'skeleton' branch): two
  // templates so it shows up roughly as often as Bandit across the pool.
  { type:'skeleton', countMin:2, countMax:4 },
  { type:'skeleton', countMin:1, countMax:3 },
  // Spider: the exact existing Spider Lair/Forest 'spider' type, just
  // added to this zone's spawn pool -- no new monster type needed.
  { type:'spider', countMin:1, countMax:3 },
  // v215: Tortuga (lake-bank turtle, drops Tortuga Shell parts)
  { type:'tortuga', countMin:2, countMax:3 },
];
function lakeNearWaterAt(x,y,m){ for(const d of [[0,0],[m,0],[-m,0],[0,m],[0,-m],[m*0.7,m*0.7],[-m*0.7,-m*0.7],[m*0.7,-m*0.7],[-m*0.7,m*0.7]]) if(lakeWaterAt(x+d[0],y+d[1])) return true; return false; }
function makeLakesideRuins(){
  const g = game, saveRand = Math.random;
  if(g && !g._lakeSeed) g._lakeSeed = 1 + Math.floor(Math.random()*1e8);
  if(g) Math.random = subSeeded(g._lakeSeed);
  try{ return lakeBuild(); } finally { Math.random = saveRand; }
}
function lakeBuild(){
  const w=LAKE_W, h=LAKE_H;
  // v531: the island ruins sit anywhere, their one bridge facing any way (an east bridge keeps clear of the far edge)
  const dir = ['W','E','N','S'][Math.floor(Math.random()*4)];
  const ex = LAKE_ISLAND_HX+LAKE_MARGIN, ey = LAKE_ISLAND_HY+LAKE_MARGIN, pad = 700;
  lakeSetCenter(Math.round(rand(pad+ex+(dir==='W' ? 300 : 0), w-pad-ex-(dir==='E' ? 300 : 0))), Math.round(rand(pad+ey, h-pad-ey)), dir);
  const sunlitGate = {x:16, y:Math.round(rand(h*0.2, h*0.8)), r:34};
  LAKESIDE_ENTRANCE_SPOT = {x:sunlitGate.x, y:sunlitGate.y};
  lakeBuildRoads(sunlitGate);
  const obstacles = lakeWaterRects();
  function inWater(x,y){ return lakeWaterAt(x,y); }
  function offLimits(x,y){ return lakeOnRoad(x,y) || lakeOnIsland(x,y) || inWater(x,y); }

  // sparse shoreline decoration -- same sparse-grass-and-rock brief as
  // Withered Crossroads, kept off the road/bridge, the water, and the island
  // (which gets its own dedicated stone-ring landmark instead).
  const rocks = [];
  for(let i=0;i<100;i++){
    const x = rand(70, w-70), y = rand(70, h-70);
    if(offLimits(x,y)) continue;
    rocks.push({x, y, s:rand(0.6,1.3)});
  }
  const grassTufts = [];
  for(let i=0;i<1800;i++){   // v456: long grass all over the land around the lake
    const x = rand(50, w-50), y = rand(50, h-50);
    if(offLimits(x,y)) continue;
    grassTufts.push({x, y, s:rand(0.8,1.6), c: Math.random()<0.5 ? '#4a6230' : '#56683a'});
  }

  // A dedicated permanent waypoint, same shared mechanism/art as every
  // other zone's -- nudged onto the near (west) shoreline, off the road.
  const waypoint = {x:sunlitGate.x+300, y:clamp(sunlitGate.y-260, 300, h-300), r:22, off:true};   // v489: no waypoint here any more (spot kept as a landing point)

  // The island's Stonehenge -- a fixed ring of 9 standing stones around
  // dead center, purely decorative/atmospheric (see drawLakesideStoneIso).
  const islandStones = [];
  const STONE_COUNT = 12, STONE_RING_R = 240;
  for(let i=0;i<STONE_COUNT;i++){
    const ang = (i/STONE_COUNT)*Math.PI*2;
    islandStones.push({x:LAKE_CX+Math.cos(ang)*STONE_RING_R, y:LAKE_CY+Math.sin(ang)*STONE_RING_R, rot:ang});
  }

  const packAnchors = [];
  let tries=0;
  while(packAnchors.length < LAKE_PACK_ANCHOR_TARGET && tries<20000){
    tries++;
    const x = rand(140, w-140), y = rand(140, h-140);
    if(offLimits(x,y)) continue;
    if(dist({x,y},sunlitGate) < 240) continue;
    if(dist({x,y},waypoint) < 220) continue;
    if(packAnchors.some(a=>dist(a,{x,y}) < 280)) continue;
    packAnchors.push({x,y});
  }


  // Zone-edge boundary markers (Sept 2026 patch): a ring of plain trees
  // (drawTreeIso, the same prop the Dark Forest's own treeline border
  // uses) walking this zone's outer edge, so the playable shoreline's
  // border reads clearly -- this zone otherwise has no edge treatment of
  // its own (its "boundary" was previously just the unmarked map edge).
  // A single gap is left at the west entrance gate; the border ring stays
  // well clear of the central lake/island by construction (the lake only
  // spans the zone's vertical middle, far from all 4 edges).
  const trees = [];
  for(const bp of zoneBorderPoints(w, h, 40, 220, [
    {x:sunlitGate.x, y:sunlitGate.y, r:170},
  ])){
    trees.push({x:bp.x, y:bp.y});
  }

  // v456: groves of old trees on the dry land around the lake (the Treants' home)
  const groves = [], groveObs = [];
  for(let i=0;i<3000 && groves.length<34;i++){   // v530: a forested shore (was 14 groves)
    const x = rand(320, w-320), y = rand(260, h-260);
    if(offLimits(x,y) || lakeNearWaterAt(x,y,230) || lakeRoadDist(x,y) < 200) continue;
    if(dist({x,y},sunlitGate)<520 || dist({x,y},waypoint)<360) continue;
    if(groves.some(gv=>dist(gv,{x,y})<560)) continue;
    groves.push({x,y});
  }
  for(const gv of groves){
    const n = 16 + Math.floor(Math.random()*10);
    for(let k=0;k<n;k++){
      const a = Math.random()*Math.PI*2, d = 30 + Math.random()*240, x = gv.x+Math.cos(a)*d, y = gv.y+Math.sin(a)*d*0.85;
      if(offLimits(x,y) || lakeNearWaterAt(x,y,90) || lakeRoadDist(x,y) < 80) continue;
      if(trees.some(tr=>Math.abs(tr.x-x)<44 && Math.abs(tr.y-y)<44)) continue;
      trees.push({x, y, s:rand(1.6,2.7), dark:Math.random()<0.6, dead:Math.random()<0.14});
      groveObs.push({x:x-9, y:y-9, w:18, h:18, isProp:true, noDraw:true});
    }
  }
  // v530: lone trees and small stands between the groves, so the whole shore reads as old woodland
  for(let i=0;i<1400;i++){
    const x = rand(200, w-200), y = rand(200, h-200);
    if(offLimits(x,y) || lakeNearWaterAt(x,y,120) || lakeRoadDist(x,y) < 90) continue;
    if(dist({x,y},sunlitGate)<380 || dist({x,y},waypoint)<240) continue;
    if(packAnchors.some(a=>dist(a,{x,y}) < 120)) continue;
    if(trees.some(tr=>Math.abs(tr.x-x)<70 && Math.abs(tr.y-y)<70)) continue;
    trees.push({x, y, s:rand(1.3,2.3), dark:Math.random()<0.5, dead:Math.random()<0.1});
    groveObs.push({x:x-9, y:y-9, w:18, h:18, isProp:true, noDraw:true});
  }
  const ruinsSpot = {x:LAKE_CX, y:LAKE_CY-45, r:40};
  const sunkenGate = {x:LAKE_CX+330, y:LAKE_CY-250, r:34};   // (v262) the Sunken Depths cave mouth, just outside the Stonehenge ring
  // v193 scenery: toppled and standing columns, ruined wall runs, weathered statues, glowing runes, driftwood, reeds, lily pads, mist and a dock
  const lakeProps = [], lakeDecor = [];
  const lFree = (x,y,ww,hh,m)=>{ for(const [px,py] of [[x,y],[x+ww,y],[x,y+hh],[x+ww,y+hh],[x+ww/2,y+hh/2]]) if(offLimits(px,py)) return false;
    return x>150 && y>150 && x+ww<w-150 && y+hh<h-150 && dist({x:x+ww/2,y:y+hh/2},sunlitGate)>260 && dist({x:x+ww/2,y:y+hh/2},waypoint)>200
      && !lakeProps.some(o=>x<o.x+o.w+m && x+ww>o.x-m && y<o.y+o.h+m && y+hh>o.y-m); };
  for(let i=0;i<1400 && lakeProps.filter(o=>o.kind==='column').length<56;i++){ const x=rand(160,w-200), y=rand(160,h-200); if(lFree(x,y,26,26,50)) lakeProps.push({x,y,w:26,h:26,isProp:true,kind:'column',broken:Math.random()<0.5,tall:rand(48,78)}); }
  for(let i=0;i<1000 && lakeProps.filter(o=>o.kind==='wallruin').length<28;i++){ const horiz=Math.random()<0.5, len=rand(90,170), x=rand(160,w-340), y=rand(160,h-340), ww=horiz?len:18, hh=horiz?18:len; if(lFree(x,y,ww,hh,60)) lakeProps.push({x,y,w:ww,h:hh,isProp:true,kind:'wallruin',tall:rand(26,44)}); }
  const lOk = (x,y)=>!offLimits(x,y) && !lakeProps.some(o=>x>o.x-10 && x<o.x+o.w+10 && y>o.y-10 && y<o.y+o.h+10);
  for(let i=0;i<24;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'columnfall',x,y,r:rand(0,3.1)}); }
  for(let i=0;i<9;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'statue',x,y,broken:Math.random()<0.5}); }
  for(let i=0;i<16;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'rune',x,y,s:rand(0.8,1.5)}); }
  for(let i=0;i<24;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y) && (lakeWaterAt(x+70,y)||lakeWaterAt(x-70,y)||lakeWaterAt(x,y+70)||lakeWaterAt(x,y-70))) lakeDecor.push({k:'driftwood',x,y,r:rand(-0.4,0.4)}); }
  for(let i=0;i<220;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y) && (lakeWaterAt(x+50,y)||lakeWaterAt(x-50,y)||lakeWaterAt(x,y+50)||lakeWaterAt(x,y-50))) lakeDecor.push({k:'reed',x,y,s:rand(0.8,1.4),c:'#5f7f3a'}); }
  for(let i=0;i<320;i++){ const x=rand(LAKE_WATER_X,LAKE_WATER_X+LAKE_WATER_W), y=rand(LAKE_WATER_Y0,LAKE_WATER_Y1); if(lakeWaterAt(x,y)) lakeDecor.push({k:'lily',x,y,s:rand(0.7,1.3),f:Math.random()<0.25}); }
  for(let i=0;i<90;i++){ const x=rand(120,w-120), y=rand(300,h-300); lakeDecor.push({k:'mistpatch',x,y,r:rand(120,240)}); }
  for(let i=0;i<70;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'bush',x,y,s:rand(0.8,1.3),berries:false}); }
  for(let i=0;i<70;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'flowers',x,y,n:9,r:rand(26,50),cols:['#8ab4ff','#ffffff','#c8a8ff']}); }
  { const S = lakeBridgeShore(), px = S.dy, py = -S.dx, dk = {x:S.x+px*(LAKE_ROAD_HALFW+240)+S.dx*30, y:S.y+py*(LAKE_ROAD_HALFW+240)+S.dy*30}; if(!lakeWaterAt(dk.x,dk.y)) lakeDecor.push({k:'dock', x:dk.x, y:dk.y}); }
  for(const o of lakeProps) obstacles.push(o);
  for(const o of groveObs) obstacles.push(o);
  return { w, h, obstacles, dryObstacles:obstacles.filter(o=>!o.isWater), decor:lakeDecor, sunlitGate, rocks, grassTufts, trees, groves, waypoint, packAnchors,
    ruinsSpot, sunkenGate, islandStones, bridge:LAKE_BRIDGE, lakeDir:LAKE_DIR,
    scholarSpot:{x:ruinsSpot.x-58, y:ruinsSpot.y+34, id:7, robe:'#2c4a78', long:true, tool:'book'},
    entranceSpot:LAKESIDE_ENTRANCE_SPOT, roads:LAKE_ROADS, roadGrid:LAKE_ROAD_GRID };
}
