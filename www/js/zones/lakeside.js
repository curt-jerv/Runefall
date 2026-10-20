// ---------------- Lakeside Ruins (v71) ----------------
// Fourth of the 6-batch "new area" sequence, reached from Sunlit Plains'
// own reserved east exit (SUNLIT_EAST_EXIT_SPOT/g.sun.eastGate). Same open,
// standing-population zone shape as the Forest/Mountain Pass/Sunlit Plains
// (no genRoom() floors), and the exact same footprint as Sunlit Plains
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
const LAKE_W = SUN_W, LAKE_H = SUN_H;
const LAKE_CX = LAKE_W/2, LAKE_CY = LAKE_H/2;
const LAKE_ROAD_HALFW = 120; // (v147: doubled) width either side of the road/bridge centerline
const LAKESIDE_ENTRANCE_SPOT = {x:16, y:LAKE_CY};
// The lake footprint -- big and centered, spanning nearly half the zone's
// width -- with the road-width gap cut out of its vertical middle.
const LAKE_WATER_X = LAKE_CX - 1200, LAKE_WATER_W = 2400;
const LAKE_WATER_Y0 = LAKE_CY - 800, LAKE_WATER_Y1 = LAKE_CY + 800;
// (v121) The island is now a big walkable landmass: 800x600, carved out of
// the lake with real collision (before, only the visual paving was round --
// the walkable part was just the 120px bridge band).
const LAKE_ISLAND_HX = 400, LAKE_ISLAND_HY = 300;
const LAKE_ISLAND_R = LAKE_ISLAND_HX; // kept for the test export
function lakeOnRoad(x,y){ return Math.abs(y-LAKE_CY) < LAKE_ROAD_HALFW; }
function lakeOnIsland(x,y){ return Math.abs(x-LAKE_CX) < LAKE_ISLAND_HX && Math.abs(y-LAKE_CY) < LAKE_ISLAND_HY; }
function lakeWaterAt(x,y){
  return x>LAKE_WATER_X && x<LAKE_WATER_X+LAKE_WATER_W && y>LAKE_WATER_Y0 && y<LAKE_WATER_Y1 && !lakeOnRoad(x,y) && !lakeOnIsland(x,y);
}
function lakeWaterRects(){
  const X0=LAKE_WATER_X, X1=LAKE_WATER_X+LAKE_WATER_W, IL=LAKE_CX-LAKE_ISLAND_HX, IR=LAKE_CX+LAKE_ISLAND_HX;
  const rh=LAKE_ROAD_HALFW, ih=LAKE_ISLAND_HY;
  const R=(x,y,w,h)=>({x,y,w,h,isWater:true});
  return [
    R(X0,LAKE_WATER_Y0,IL-X0,LAKE_CY-rh-LAKE_WATER_Y0), R(IL,LAKE_WATER_Y0,IR-IL,LAKE_CY-ih-LAKE_WATER_Y0), R(IR,LAKE_WATER_Y0,X1-IR,LAKE_CY-rh-LAKE_WATER_Y0),
    R(X0,LAKE_CY+rh,IL-X0,LAKE_WATER_Y1-LAKE_CY-rh), R(IL,LAKE_CY+ih,IR-IL,LAKE_WATER_Y1-LAKE_CY-ih), R(IR,LAKE_CY+rh,X1-IR,LAKE_WATER_Y1-LAKE_CY-rh),
  ];
}
const LAKE_PACK_ANCHOR_TARGET = SUNLIT_PACK_ANCHOR_TARGET;
// Fewer standing packs than Sunlit Plains' 70 -- the lake itself eats a
// large, uninhabitable chunk of this same-sized footprint, so the walkable
// shoreline area is smaller even though the zone's outer bounds match.
const LAKE_PACK_COUNT = 55;
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
// Leviathans (v71) are NOT part of the pack-anchor system above -- they
// live in the water, hidden until the player is close (see the dedicated
// e.type==='leviathan' branch in update()), so they're spawned directly at
// these fixed spots deep inside the two water rects instead.
const LAKE_LEVIATHAN_COUNT = 3;
function lakeNearWaterAt(x,y,m){ for(const d of [[0,0],[m,0],[-m,0],[0,m],[0,-m],[m*0.7,m*0.7],[-m*0.7,-m*0.7],[m*0.7,-m*0.7],[-m*0.7,m*0.7]]) if(lakeWaterAt(x+d[0],y+d[1])) return true; return false; }
function makeLakesideRuins(){
  const w=LAKE_W, h=LAKE_H;
  const sunlitGate = {x:LAKESIDE_ENTRANCE_SPOT.x, y:LAKESIDE_ENTRANCE_SPOT.y, r:34};
  const marshGate = {x:w-16, y:LAKE_CY, r:34}; // v144: east exit to the Black Marsh
  const obstacles = lakeWaterRects();
  const waterNorth = obstacles[0], waterSouth = obstacles[3];
  function inWater(x,y){ return lakeWaterAt(x,y); }
  function offLimits(x,y){ return lakeOnRoad(x,y) || lakeOnIsland(x,y) || inWater(x,y); }

  // sparse shoreline decoration -- same sparse-grass-and-rock brief as
  // Sunlit Plains, kept off the road/bridge, the water, and the island
  // (which gets its own dedicated stone-ring landmark instead).
  const rocks = [];
  for(let i=0;i<50;i++){
    const x = rand(70, w-70), y = rand(70, h-70);
    if(offLimits(x,y)) continue;
    rocks.push({x, y, s:rand(0.6,1.3)});
  }
  const grassTufts = [];
  for(let i=0;i<900;i++){   // v456: long grass all over the land around the lake
    const x = rand(50, w-50), y = rand(50, h-50);
    if(offLimits(x,y)) continue;
    grassTufts.push({x, y, s:rand(0.8,1.6), c: Math.random()<0.5 ? '#4a6230' : '#56683a'});
  }

  // A dedicated permanent waypoint, same shared mechanism/art as every
  // other zone's -- nudged onto the near (west) shoreline, off the road.
  const waypoint = {x:sunlitGate.x+300, y:LAKE_CY-260, r:22, off:true};   // v489: no waypoint here any more (spot kept as a landing point)

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
  while(packAnchors.length < LAKE_PACK_ANCHOR_TARGET && tries<6000){
    tries++;
    const x = rand(140, w-140), y = rand(140, h-140);
    if(offLimits(x,y)) continue;
    if(dist({x,y},sunlitGate) < 240 || dist({x,y},marshGate) < 240) continue;
    if(dist({x,y},waypoint) < 220) continue;
    if(packAnchors.some(a=>dist(a,{x,y}) < 280)) continue;
    packAnchors.push({x,y});
  }

  // Leviathan spawn spots -- well inside each water rect (padded off both
  // the shoreline and the bridge gap), spread across both halves of the lake.
  // (v121) Now hugging the bridge (just outside its edge, west of the island)
  // so they engage anyone crossing, instead of lurking far out in the lake.
  const leviathanSpots = [
    {x:LAKE_CX-950, y:LAKE_CY-200},
    {x:LAKE_CX-620, y:LAKE_CY+200},
    {x:LAKE_CX+900, y:LAKE_CY-200},
  ];

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
    {x:marshGate.x, y:marshGate.y, r:170},
  ])){
    trees.push({x:bp.x, y:bp.y});
  }

  // v456: groves of old trees on the dry land around the lake (the Treants' home)
  const groves = [], groveObs = [];
  for(let i=0;i<900 && groves.length<14;i++){
    const x = rand(320, w-320), y = rand(260, h-260);
    if(offLimits(x,y) || lakeNearWaterAt(x,y,230)) continue;
    if(dist({x,y},sunlitGate)<520 || dist({x,y},marshGate)<520 || dist({x,y},waypoint)<360) continue;
    if(groves.some(gv=>dist(gv,{x,y})<560)) continue;
    groves.push({x,y});
  }
  for(const gv of groves){
    const n = 16 + Math.floor(Math.random()*10);
    for(let k=0;k<n;k++){
      const a = Math.random()*Math.PI*2, d = 30 + Math.random()*240, x = gv.x+Math.cos(a)*d, y = gv.y+Math.sin(a)*d*0.85;
      if(offLimits(x,y) || lakeNearWaterAt(x,y,90)) continue;
      if(trees.some(tr=>Math.abs(tr.x-x)<44 && Math.abs(tr.y-y)<44)) continue;
      trees.push({x, y, s:rand(1.6,2.7), dark:Math.random()<0.6, dead:Math.random()<0.14});
      groveObs.push({x:x-9, y:y-9, w:18, h:18, isProp:true, noDraw:true});
    }
  }
  const ruinsSpot = {x:LAKE_CX, y:LAKE_CY-45, r:40};
  const sunkenGate = {x:LAKE_CX+330, y:LAKE_CY-250, r:34};   // (v262) the Sunken Depths cave mouth, just outside the Stonehenge ring
  // v193 scenery: toppled and standing columns, ruined wall runs, weathered statues, glowing runes, driftwood, reeds, lily pads, mist and a dock
  const lakeProps = [], lakeDecor = [];
  const lFree = (x,y,ww,hh,m)=>{ for(const [px,py] of [[x,y],[x+ww,y],[x,y+hh],[x+ww,y+hh],[x+ww/2,y+hh/2]]) if(offLimits(px,py)) return false;
    return x>150 && y>150 && x+ww<w-150 && y+hh<h-150 && dist({x:x+ww/2,y:y+hh/2},sunlitGate)>260 && dist({x:x+ww/2,y:y+hh/2},marshGate)>260 && dist({x:x+ww/2,y:y+hh/2},waypoint)>200
      && !lakeProps.some(o=>x<o.x+o.w+m && x+ww>o.x-m && y<o.y+o.h+m && y+hh>o.y-m); };
  for(let i=0;i<700 && lakeProps.filter(o=>o.kind==='column').length<32;i++){ const x=rand(160,w-200), y=rand(160,h-200); if(lFree(x,y,26,26,50)) lakeProps.push({x,y,w:26,h:26,isProp:true,kind:'column',broken:Math.random()<0.5,tall:rand(48,78)}); }
  for(let i=0;i<500 && lakeProps.filter(o=>o.kind==='wallruin').length<16;i++){ const horiz=Math.random()<0.5, len=rand(90,170), x=rand(160,w-340), y=rand(160,h-340), ww=horiz?len:18, hh=horiz?18:len; if(lFree(x,y,ww,hh,60)) lakeProps.push({x,y,w:ww,h:hh,isProp:true,kind:'wallruin',tall:rand(26,44)}); }
  const lOk = (x,y)=>!offLimits(x,y) && !lakeProps.some(o=>x>o.x-10 && x<o.x+o.w+10 && y>o.y-10 && y<o.y+o.h+10);
  for(let i=0;i<24;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'columnfall',x,y,r:rand(0,3.1)}); }
  for(let i=0;i<9;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'statue',x,y,broken:Math.random()<0.5}); }
  for(let i=0;i<16;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'rune',x,y,s:rand(0.8,1.5)}); }
  for(let i=0;i<24;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y) && (lakeWaterAt(x+70,y)||lakeWaterAt(x-70,y)||lakeWaterAt(x,y+70)||lakeWaterAt(x,y-70))) lakeDecor.push({k:'driftwood',x,y,r:rand(-0.4,0.4)}); }
  for(let i=0;i<220;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y) && (lakeWaterAt(x+50,y)||lakeWaterAt(x-50,y)||lakeWaterAt(x,y+50)||lakeWaterAt(x,y-50))) lakeDecor.push({k:'reed',x,y,s:rand(0.8,1.4),c:'#5f7f3a'}); }
  for(let i=0;i<320;i++){ const x=rand(LAKE_WATER_X,LAKE_WATER_X+LAKE_WATER_W), y=rand(LAKE_WATER_Y0,LAKE_WATER_Y1); if(lakeWaterAt(x,y)) lakeDecor.push({k:'lily',x,y,s:rand(0.7,1.3),f:Math.random()<0.25}); }
  for(let i=0;i<50;i++){ const x=rand(120,w-120), y=rand(300,h-300); lakeDecor.push({k:'mistpatch',x,y,r:rand(120,240)}); }
  for(let i=0;i<70;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'bush',x,y,s:rand(0.8,1.3),berries:false}); }
  for(let i=0;i<70;i++){ const x=rand(120,w-120), y=rand(120,h-120); if(lOk(x,y)) lakeDecor.push({k:'flowers',x,y,n:9,r:rand(26,50),cols:['#8ab4ff','#ffffff','#c8a8ff']}); }
  lakeDecor.push({k:'dock',x:LAKE_WATER_X-34,y:LAKE_CY+LAKE_ROAD_HALFW+240});
  for(const o of lakeProps) obstacles.push(o);
  for(const o of groveObs) obstacles.push(o);
  return { w, h, obstacles, dryObstacles:obstacles.filter(o=>!o.isWater), decor:lakeDecor, sunlitGate, marshGate, rocks, grassTufts, trees, groves, waypoint, packAnchors,
    ruinsSpot, sunkenGate, islandStones, leviathanSpots, waterNorth, waterSouth,
    scholarSpot:{x:ruinsSpot.x-58, y:ruinsSpot.y+34, id:7, robe:'#2c4a78', long:true, tool:'book'},
    entranceSpot:LAKESIDE_ENTRANCE_SPOT };
}
