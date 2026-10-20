// ---------------- Sunlit Plains (v69) ----------------
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
const SUNLIT_SOUTH_EXIT_SPOT = {x:SUN_CX, y:SUN_H-16};
const SUNLIT_WEST_EXIT_SPOT = {x:16, y:SUN_CY};
const SUNLIT_EAST_EXIT_SPOT = {x:SUN_W-16, y:SUN_CY};
// How many pack anchors to try to place -- reuses the Dark Forest's own
// post-v68 target/spacing 1-for-1 since the two zones share the exact same
// footprint, so pack density and the spread-out, not-clumped feel match.
const SUNLIT_PACK_ANCHOR_TARGET = FOREST_PACK_ANCHOR_TARGET;
const SUNLIT_PACK_COUNT = 70;
const SUNLIT_PACK_TEMPLATES = [
  { type:'bandit', countMin:2, countMax:4 },
  { type:'bandit', countMin:2, countMax:4 },
  { type:'banditarcher', countMin:1, countMax:3 },
  { type:'boar', countMin:1, countMax:3 },
];
function makeSunlitPlains(){
  const w=SUN_W, h=SUN_H;
  const forestGate = {x:SUN_CX, y:16, r:34};

  // sparse decoration only -- "mostly simple grass and rock, open
  // landscape" per the brief, deliberately far sparser than the Forest's
  // tree scatter (which this zone has none of) to read as open plains by
  // contrast. Kept off both roads and away from the crossroad center/exits.
  function onRoad(x,y){
    return Math.abs(x-SUN_CX) < SUN_ROAD_HALFW || Math.abs(y-SUN_CY) < SUN_ROAD_HALFW;
  }
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
    grassTufts.push({x, y, s:rand(0.7,1.2)});
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
    if(dist({x,y},SUNLIT_SOUTH_EXIT_SPOT) < 440 || dist({x,y},SUNLIT_WEST_EXIT_SPOT) < 440 || dist({x,y},SUNLIT_EAST_EXIT_SPOT) < 440) continue;
    if(dist({x,y},waypoint) < 520) continue;
    if(packAnchors.some(a=>dist(a,{x,y}) < 280)) continue;
    packAnchors.push({x,y});
  }

  // v70: the west reserved exit spot is now a real gate, same {x,y,r:34}
  // shape every other zone-transition gate uses (townGate/mountainGate/
  // sunGate/etc) -- built from the exact SUNLIT_WEST_EXIT_SPOT coordinates
  // the v69 batch reserved, so it wires up in-place without moving
  // anything.
  const westGate = {x:SUNLIT_WEST_EXIT_SPOT.x, y:SUNLIT_WEST_EXIT_SPOT.y, r:34};
  // v71: the east reserved exit spot is now a real gate into Lakeside
  // Ruins -- same {x,y,r:34} shape as westGate above, built from the exact
  // SUNLIT_EAST_EXIT_SPOT coordinates the v69 batch reserved.
  const eastGate = {x:SUNLIT_EAST_EXIT_SPOT.x, y:SUNLIT_EAST_EXIT_SPOT.y, r:34};
  // v72: the south reserved exit spot is now a real gate into Cursed
  // Cemetery -- same {x,y,r:34} shape as westGate/eastGate above, built
  // from the exact SUNLIT_SOUTH_EXIT_SPOT coordinates the v69 batch
  // reserved.
  const southGate = {x:SUNLIT_SOUTH_EXIT_SPOT.x, y:SUNLIT_SOUTH_EXIT_SPOT.y, r:34};

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
  const offRoadS = (x,y,m)=>Math.abs(x-SUN_CX)>SUN_ROAD_HALFW+m && Math.abs(y-SUN_CY)>SUN_ROAD_HALFW+m;
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
  for(let i=0;i<3;i++){ const side=Math.random()<0.5?-1:1; const onNS=Math.random()<0.5; const x=onNS?SUN_CX+side*(SUN_ROAD_HALFW+70):rand(300,w-300), y=onNS?rand(300,h-300):SUN_CY+side*(SUN_ROAD_HALFW+70); if(gatesS.every(gt=>dist({x,y},gt)>240)) sunDecor.push({k:'wagon',x,y}); }
  return { w, h, obstacles:sunProps, decor:sunDecor, forestGate, westGate, eastGate, southGate, rocks, grassTufts, waypoint, packAnchors,
    southExitSpot:SUNLIT_SOUTH_EXIT_SPOT, westExitSpot:SUNLIT_WEST_EXIT_SPOT, eastExitSpot:SUNLIT_EAST_EXIT_SPOT };
}
function spawnSunlitPack(g, anchor, template){
  const t = template || SUNLIT_PACK_TEMPLATES[Math.floor(Math.random()*SUNLIT_PACK_TEMPLATES.length)];
  const n = forestPackSize(t);
  const spread = 100 + n*18;
  for(let i=0;i<n;i++){
    spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
  }
}

