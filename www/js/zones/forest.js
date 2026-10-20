// ---------- v193 Dark Forest ----------
// v459: the Dark Forest is an inverted L -- a wide band running east from Mistfall along the top, then a column
// turning south down the far east side to the River Valley exit. The south-west block is impassable deep wood.
const FOREST_TOP_H = 1500, FOREST_COL_X = 3700;
function forestOpenAt(x, y, m){ m = m||0; return !(x < m || y < m || x > FOREST_W-m || y > FOREST_H-m); }   // v467: the whole forest is open again
function makeForest(){
  const w=FOREST_W, h=FOREST_H;
  const townGate = {x:16, y:rand(180,340), r:34};
  const sunGate = {x:rand(4500,4800), y:h-16, r:34};
  // v474: the trail takes a different course each visit -- one of several shapes, each with its own random bends
  const waypoints = [{x:townGate.x, y:townGate.y}];
  const jx = (x)=>clamp(x+rand(-110,110), 260, w-260), jy = (y)=>clamp(y+rand(-110,110), 260, h-300);
  const shape = Math.floor(Math.random()*4);
  if(shape===0){        // east along the north, round the corner, south down the east side
    for(const x of [700,1400,2100,2800,3400]) waypoints.push({x:x+rand(-80,80), y:rand(460,1040)});
    waypoints.push({x:4250+rand(-80,80), y:rand(700,950)});
    waypoints.push({x:sunGate.x+rand(-160,120), y:1700+rand(-100,100)});
    waypoints.push({x:sunGate.x+rand(-180,180), y:2450+rand(-120,120)});
  } else if(shape===1){ // straight down the west side first, then east along the southern woods
    waypoints.push({x:jx(520), y:jy(700)}); waypoints.push({x:jx(760), y:jy(1500)}); waypoints.push({x:jx(640), y:jy(2300)});
    waypoints.push({x:jx(1300), y:jy(2900)}); waypoints.push({x:jx(2200), y:jy(2750)}); waypoints.push({x:jx(3100), y:jy(3000)}); waypoints.push({x:jx(3900), y:jy(2800)});
  } else if(shape===2){ // a long meandering diagonal through the heart of the forest
    const n = 7;
    for(let i=1;i<=n;i++){ const t = i/(n+1), side = (i%2 ? 1 : -1)*rand(160,380);
      waypoints.push({x:jx(townGate.x + (sunGate.x-townGate.x)*t + side*0.6), y:jy(townGate.y + (h-500-townGate.y)*t - side*0.8)}); }
  } else {              // switchbacks: east, drop south, back west, drop again, east to the gate
    waypoints.push({x:jx(1600), y:jy(520)}); waypoints.push({x:jx(3300), y:jy(700)});
    waypoints.push({x:jx(3900), y:jy(1250)}); waypoints.push({x:jx(2500), y:jy(1700)}); waypoints.push({x:jx(1100), y:jy(2000)});
    waypoints.push({x:jx(900), y:jy(2700)}); waypoints.push({x:jx(2300), y:jy(3000)}); waypoints.push({x:jx(3700), y:jy(2900)});
  }
  waypoints.push({x:sunGate.x+rand(-140,140), y:h-420});
  waypoints.push({x:sunGate.x, y:sunGate.y});
  const sunRoad = [];
  // the two lairs: the Spider Lair in the top band, the Bear Cave down the east column
  let spiderLairGate = null, bearCaveGate = null;
  // v467: both lairs land anywhere in the forest, well apart, off the trail but not far from it
  for(let t=0; t<1500 && !spiderLairGate; t++){ const x = rand(500, w-500), y = rand(350, h-450), d = distToPolyline(waypoints,x,y).d; if(d>320 && d<1100 && dist({x,y},townGate)>1100 && dist({x,y},sunGate)>800) spiderLairGate = {x,y,r:34}; }
  for(let t=0; t<1500 && !bearCaveGate; t++){ const x = rand(500, w-500), y = rand(350, h-450), d = distToPolyline(waypoints,x,y).d; if(d>320 && d<1100 && dist({x,y},townGate)>1100 && dist({x,y},sunGate)>800 && (!spiderLairGate || dist({x,y},spiderLairGate)>1600)) bearCaveGate = {x,y,r:34}; }
  if(!spiderLairGate) spiderLairGate = {x:2300, y:FOREST_TOP_H-340, r:34};
  if(!bearCaveGate) bearCaveGate = {x:w-380, y:2500, r:34};
  const roadPolys = [{pts:waypoints, hw:46}];
  const branchTo = (gate)=>{
    const best = distToPolyline(waypoints, gate.x, gate.y);
    const P = best.p, pts = [{x:P.x,y:P.y}];
    const nx = -(gate.y-P.y), ny = (gate.x-P.x), nl = Math.hypot(nx,ny)||1;
    for(const t of [0.33,0.66]){ const j = rand(-90,90); pts.push({x:P.x+(gate.x-P.x)*t+nx/nl*j, y:P.y+(gate.y-P.y)*t+ny/nl*j}); }
    pts.push({x:gate.x, y:gate.y});
    return pts;
  };
  roadPolys.push({pts:branchTo(spiderLairGate), hw:34}, {pts:branchTo(bearCaveGate), hw:34});
  const roadGrid = makeRoadGrid(w, h, roadPolys);
  const nearRoad = (x,y,m)=>roadNearGrid(roadGrid,x,y,m);

  // trees: unbroken treelines along every edge of the L (gaps at the two exits), plus a deep wall of dark wood filling the corner
  const trees=[];
  const tsz = ()=>rand(0.95,1.4);
  for(let x=40; x<w-40; x+=70) trees.push({x, y:36, dark:true, s:tsz()});                                                     // north edge
  for(let y=90; y<h-40; y+=80) if(Math.abs(y-townGate.y) > 55) trees.push({x:36, y, dark:true, s:tsz()});                      // west edge
  for(let y=90; y<h-90; y+=80) trees.push({x:w-36, y, dark:true, s:tsz()});                                                    // far east edge
  for(let x=40; x<w-40; x+=70) if(Math.abs(x-sunGate.x) > 70) trees.push({x, y:h-36, dark:true, s:tsz()});                     // south edge
  const mountainGate = null;
  const lairsAndGates = [townGate, sunGate, spiderLairGate, bearCaveGate];
  // ---- collidable props: big trees, fallen logs, boulders, ponds ----
  const props = [];
  const overlapsProp = (x,y,ww,hh,m)=>props.some(o=>x<o.x+o.w+m && x+ww>o.x-m && y<o.y+o.h+m && y+hh>o.y-m);
  const okSpot = (x,y,ww,hh,m)=>{
    if(x<130||y<130||x+ww>w-130||y+hh>h-130) return false;
    if(!forestOpenAt(x,y,120) || !forestOpenAt(x+ww,y+hh,120) || !forestOpenAt(x+ww,y,120) || !forestOpenAt(x,y+hh,120)) return false;
    if(lairsAndGates.some(gt=>dist({x:x+ww/2,y:y+hh/2},gt) < 240+Math.max(ww,hh)/2)) return false;
    if(nearRoad(x,y,60)||nearRoad(x+ww,y,60)||nearRoad(x,y+hh,60)||nearRoad(x+ww,y+hh,60)||nearRoad(x+ww/2,y+hh/2,60)) return false;
    return !overlapsProp(x,y,ww,hh,m);
  };
  const place = (count, make, tries)=>{ let n=0; for(let i=0;i<tries && n<count;i++){ const o = make(); if(o && okSpot(o.x,o.y,o.w,o.h,o.pad||40)){ props.push(o); n++; } } };
  place(16, ()=>{ const ww=rand(200,330), hh=rand(140,230); return makePondProps(rand(200,w-600), rand(200,h-450), ww, hh, false); }, 400);
  place(45, ()=>{ const x=rand(160,w-160), y=rand(160,h-160); return {x:x-16,y:y-16,w:32,h:32,isProp:true,kind:'bigtree',s:rand(0.95,1.35),pad:30}; }, 500);
  place(42, ()=>{ const len=rand(120,210), horiz=Math.random()<0.5; return {x:rand(160,w-360), y:rand(160,h-360), w:horiz?len:26, h:horiz?26:len, isProp:true, kind:'log', seed:Math.random(), pad:34}; }, 500);
  place(26, ()=>({x:rand(160,w-260), y:rand(160,h-260), w:46, h:38, isProp:true, kind:'boulder', s:rand(0.85,1.25), pad:30}), 400);
  // normal (walk-through) trees stay off roads and props; a few more than before for the darker, denser feel
  for(let i=0;i<340;i++){
    const x = rand(90, w-90), y = rand(90, h-90);
    if(!forestOpenAt(x,y,70)) continue;
    if(nearRoad(x,y,50)) continue;
    if(lairsAndGates.some(gt=>dist({x,y},gt) < 110)) continue;
    if(props.some(o=>x>o.x-30 && x<o.x+o.w+30 && y>o.y-30 && y<o.y+o.h+30)) continue;
    trees.push({x,y,dark:true,s:tsz()});
  }
  // walk-through decor: ferns, glowing mushrooms, stumps, old bones
  const decor = [];
  const dOk = (x,y)=>forestOpenAt(x,y,40) && !nearRoad(x,y,20) && !props.some(o=>x>o.x-8 && x<o.x+o.w+8 && y>o.y-8 && y<o.y+o.h+8);
  for(let i=0;i<520;i++){ const x=rand(80,w-80), y=rand(80,h-80); if(dOk(x,y)) decor.push({k:'fern', x, y, s:rand(0.8,1.5), dark:true}); }
  for(let i=0;i<170;i++){ const x=rand(80,w-80), y=rand(80,h-80); if(dOk(x,y)) decor.push({k:'mushroom', x, y, s:rand(0.8,1.4), glow:Math.random()<0.5, c:['#8a5aa8','#5a8aa8','#a85a5a'][i%3]}); }
  for(let i=0;i<50;i++){ const x=rand(80,w-80), y=rand(80,h-80); if(dOk(x,y)) decor.push({k:'stump', x, y, s:rand(0.9,1.5)}); }
  for(let i=0;i<24;i++){ const x=rand(80,w-80), y=rand(80,h-80); if(dOk(x,y)) decor.push({k:'bones', x, y, r:rand(0,3)}); }

  // pack anchors: clusters spread across the map, off roads, props and gates
  const packAnchors = [];
  let tries=0;
  while(packAnchors.length < FOREST_PACK_ANCHOR_TARGET && tries<6000){
    tries++;
    const x = rand(140, w-140), y = rand(140, h-140);
    if(nearRoad(x,y,110)) continue;
    if(!forestOpenAt(x,y,170)) continue;
    if(dist({x,y},townGate) < 240 || dist({x,y},sunGate) < 300) continue;
    if(dist({x,y},spiderLairGate) < 220 || dist({x,y},bearCaveGate) < 220) continue;
    if(props.some(o=>x>o.x-60 && x<o.x+o.w+60 && y>o.y-60 && y<o.y+o.h+60)) continue;
    if(packAnchors.some(a=>dist(a,{x,y}) < 280)) continue;
    packAnchors.push({x,y});
  }
  return { w, h, obstacles:props, townGate, mountainGate, spiderLairGate, bearCaveGate, sunGate, lShape:false, trees, decor, waypoints, roadGrid, roadPolys, packAnchors, hunters:[],
    guards: makeTownGuards(townGate) };
}
// v403 (D2-style packs): fixed-size packs now vary a little (a pack of 5 is usually 5, sometimes 4 or 6)
function staggerN(n){ if(n<=1) return n; const r = Math.random(); return Math.max(1, n + (r<0.22 ? -1 : r<0.38 ? 1 : 0)); }
function forestPackSize(t){ return t.count!=null ? staggerN(t.count) : Math.floor(rand(t.countMin, t.countMax+1)); }
// v403 breathing room: big open zones get quiet stretches. Anchors inside "calm" cells (~22% of the map, re-rolled each
// visit) are mostly dropped, and packs that sit too close together are thinned so fights arrive one at a time.
function breatheAnchors(anchors, o){
  o = o || {}; const cell = o.cell||1100, calm = o.calm!=null ? o.calm : 0.22, gap = o.gap||460, seed = Math.random()*1e4;
  const hash = (cx,cy)=>{ const v = Math.sin(cx*127.1+cy*311.7+seed)*43758.5453; return v-Math.floor(v); };
  const out = [];
  for(const a of anchors){
    if(hash(Math.floor(a.x/cell), Math.floor(a.y/cell)) < calm && Math.random() > 0.22) continue;
    if(Math.random() > 0.2 && out.some(b=>dist(a,b) < gap)) continue;
    out.push(a);
  }
  return out;
}
// Spawns a same-type cluster of enemies around an anchor point instead of one
// at a time near the player -- this is a "pack" the player can see and choose
// whether to engage with, spread out from other packs across the Forest.
// Defaults to a random template (wolf/spider) when none is given; enterForest()
// now spawns several packs (see FOREST_PACK_COUNT) at entry, each randomly
// wolf or spider, rather than one fixed pack per template.
function spawnForestPack(g, anchor, template){
  const t = template || FOREST_PACK_TEMPLATES[Math.floor(Math.random()*FOREST_PACK_TEMPLATES.length)];
  const n = forestPackSize(t);
  // v62: spread radius increased substantially (was 40 + n*6, topping out
  // ~70px) so pack members land clearly spaced out around the anchor
  // instead of clumped in a tight blob -- now ~100-190px depending on size.
  const spread = 100 + n*18;
  for(let i=0;i<n;i++){
    const e = spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
    // Mountain Pass's polar-bear pack reuses the regular bear enemy entirely
    // (stats/AI/charge attack), just flagged with a cosmetic variant that
    // drawBearIso reads to swap its coat color -- see makeMountainPass.
    if(t.variant) e.variant = t.variant;
  }
}

