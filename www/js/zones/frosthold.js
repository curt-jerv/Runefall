// ---------------- Frosthold Keep (v129) ----------------
// A big outdoor castle at the end of the Mountain Pass road, unlocked with the Templar Runestone.
// Snowy approach in the west, a curtain wall with a west gatehouse and corner/mid towers, a bailey full of
// barracks/pillars/barricades, and a U-shaped central keep. The Tower and Dungeon doors are reserved (sealed).
const FH_W = 8000, FH_H = 5600, FH_DEPTH = 39;
// v516: a square in a square. The outer curtain wall (single gate in the west, from the Mountain Pass; a second, sealed gatehouse
// in the east leads down a walled causeway to Redridge) holds a wide ring road; inside it stands the inner keep wall with ONE gate
// on the far (east) side, so the way in leads round the ring. The waypoint and the great tower stand in the inner courtyard and the
// Frosthold Dungeon door is in the back (south-east) of the ring.
const FH_WALL = {x0:1800, x1:6200, y0:600, y1:5000, t:90};
const FH_INNER = {x0:3050, x1:4950, y0:1850, y1:3750, t:80};
const FH_PACKS = [
  {mix:[['fhdwarf',4],['fhbrute',1],['fhcleric',1]]}, {mix:[['fhdwarf',5]]}, {mix:[['fhdwarf',3],['fhbrute',2],['fhcleric',1]]},
  {mix:[['fhbrute',3],['fhcleric',1]]}, {mix:[['fhdwarf',4],['fhbrute',1]]}, {mix:[['fhdwarf',5],['fhcleric',1]]},
  {mix:[['fhdwarf',3],['fhaxe',3]]}, {mix:[['fhbrute',1],['fhdwarf',2],['fhaxe',3],['fhcleric',1]]}, {mix:[['fhaxe',4],['fhdwarf',2]]},
];
function makeFrosthold(){
  const w=FH_W, h=FH_H, cy=h/2, O=FH_WALL, I=FH_INNER, GAP=160;
  const blocks = [];
  const box = (x,y,bw,bh,hz,kind)=>{ blocks.push({x,y,w:bw,h:bh,hz,kind}); };
  // a wall run along one axis with optional gaps [[from,to],...] (world coordinates along the run)
  const runX = (x0,x1,y,t,hz,gaps)=>{ let cur = x0; for(const [g0,g1] of (gaps||[]).slice().sort((a,b)=>a[0]-b[0])){ if(g0>cur) box(cur,y,g0-cur,t,hz,'wall'); cur = g1; } if(x1>cur) box(cur,y,x1-cur,t,hz,'wall'); };
  const runY = (y0,y1,x,t,hz,gaps)=>{ let cur = y0; for(const [g0,g1] of (gaps||[]).slice().sort((a,b)=>a[0]-b[0])){ if(g0>cur) box(x,cur,t,g0-cur,hz,'wall'); cur = g1; } if(y1>cur) box(x,cur,t,y1-cur,hz,'wall'); };
  // outer curtain wall: west gate (the Pass) and east gatehouse (sealed road to Redridge)
  runX(O.x0, O.x1, O.y0, O.t, 110);
  runX(O.x0, O.x1, O.y1-O.t, O.t, 110);
  runY(O.y0+O.t, O.y1-O.t, O.x0, O.t, 110, [[cy-GAP,cy+GAP]]);
  runY(O.y0+O.t, O.y1-O.t, O.x1-O.t, O.t, 110, [[cy-GAP,cy+GAP]]);
  // outer corner towers, mid-wall towers, gatehouse towers
  for(const [tx,ty] of [[O.x0,O.y0],[O.x1,O.y0],[O.x0,O.y1],[O.x1,O.y1]]) box(tx-120, ty-120, 240, 240, 195, 'tower');
  for(const tx of [2700,3350,4650,5300]){ box(tx-80, O.y0-40, 160, 160, 160, 'tower'); box(tx-80, O.y1-120, 160, 160, 160, 'tower'); }
  for(const ty of [1500,2100,3500,4100]){ box(O.x0-40, ty-80, 160, 160, 160, 'tower'); box(O.x1-120, ty-80, 160, 160, 160, 'tower'); }
  for(const gx of [O.x0-70, O.x1-130]) for(const sy of [-1,1]) box(gx, sy<0 ? cy-GAP-220 : cy+GAP+20, 200, 200, 180, 'tower');
  // inner keep wall: ONE gate, in the east side
  runX(I.x0, I.x1, I.y0, I.t, 135);
  runX(I.x0, I.x1, I.y1-I.t, I.t, 135);
  runY(I.y0+I.t, I.y1-I.t, I.x0, I.t, 135);
  runY(I.y0+I.t, I.y1-I.t, I.x1-I.t, I.t, 135, [[cy-GAP,cy+GAP]]);
  for(const [tx,ty] of [[I.x0,I.y0],[I.x1,I.y0],[I.x0,I.y1],[I.x1,I.y1]]) box(tx-110, ty-110, 220, 220, 205, 'tower');
  for(const sy of [-1,1]) box(I.x1-150, sy<0 ? cy-GAP-190 : cy+GAP-10, 190, 190, 185, 'tower');
  for(const ty of [2400,3200]) box(I.x0-50, ty-70, 140, 140, 150, 'tower');
  for(const tx of [3500,4500]){ box(tx-70, I.y0-30, 140, 140, 150, 'tower'); box(tx-70, I.y1-110, 140, 140, 150, 'tower'); }
  // barracks in the ring corners
  for(const [bx,by,bw,bh] of [[2150,1000,420,240],[2150,4300,420,240],[5500,1000,420,240],[2800,1000,300,220],[4400,1000,300,220],[2750,4350,320,220],[4800,4350,320,220]]) box(bx,by,bw,bh,95,'house');
  // causeway to Redridge (east): parapet walls with towers, ending in the great sealed gate
  const CZ = {x0:O.x1, x1:w-60, half:250};
  runX(CZ.x0+40, CZ.x1, cy-CZ.half-30, 50, 80, []);
  runX(CZ.x0+40, CZ.x1, cy+CZ.half-20, 50, 80, []);
  for(let tx=CZ.x0+340; tx<CZ.x1-300; tx+=480) for(const sy of [-1,1]) box(tx-60, sy<0 ? cy-CZ.half-70 : cy+CZ.half-40, 120, 120, 140, 'tower');
  for(const sy of [-1,1]) box(w-230, sy<0 ? cy-CZ.half-110 : cy+CZ.half-90, 200, 200, 190, 'tower');
  // the west approach: a short walled road (barbican) leading to the gate
  const WA = {x0:60, x1:O.x0-60, half:230};
  runX(WA.x0+240, WA.x1, cy-WA.half-25, 46, 75, []);
  runX(WA.x0+240, WA.x1, cy+WA.half-21, 46, 75, []);
  for(let tx=WA.x0+520; tx<WA.x1-200; tx+=480) for(const sy of [-1,1]) box(tx-55, sy<0 ? cy-WA.half-60 : cy+WA.half-35, 110, 110, 135, 'tower');
  const gates = [
    {id:'pass',    x:16,   y:cy,   r:38, label:'MOUNTAIN PASS',     act:'toMountainPassFromFrost', art:'keep', big:1.45, labelH:150},
    {id:'tower',   x:(I.x0+I.x1)/2, y:cy, r:38, label:'FROSTHOLD TOWER',   act:'toFhTower', art:'ftower', dz:380, labelH:112, fadeH:600},
    {id:'dungeon', x:5450, y:4650, r:38, label:'FROSTHOLD DUNGEON', act:'toFhDungeon', art:'fhdungeon', dz:380, labelH:118, fadeH:200},
    {id:'redridge', x:w-16, y:cy, r:38, label:'REDRIDGE CANYON', act:'toRedridge', art:true},
  ];
  const waypoint = {x:3560, y:cy+330, r:30};
  const keepouts = gates.map(gt=>({x:gt.x,y:gt.y,r:170})); keepouts.push({x:waypoint.x,y:waypoint.y,r:190});
  const overlaps = (x,y,bw,bh,pad)=> blocks.some(b=> x < b.x+b.w+pad && x+bw > b.x-pad && y < b.y+b.h+pad && y+bh > b.y-pad);
  const nearKeepout = (x,y,bw,bh)=> keepouts.some(k=> dist({x:x+bw/2,y:y+bh/2},k) < k.r+Math.max(bw,bh)/2);
  const inRing = (x,y)=> x>O.x0+130 && x<O.x1-130 && y>O.y0+130 && y<O.y1-130 && !(x>I.x0-120 && x<I.x1+120 && y>I.y0-120 && y<I.y1+120);
  const laneOpen = (x,y,bw,bh)=> Math.abs(y+bh/2-cy) < 200 && (x < O.x0+500 || x+bw > I.x1-60);   // keep the straight lanes to both gates clear
  // pillars + barricades on the ring road
  let tries=0, n=0;
  while(n<30 && tries<1500){ tries++;
    const x=rand(O.x0+150,O.x1-210), y=rand(O.y0+150,O.y1-210);
    if(!inRing(x,y) || overlaps(x,y,60,60,110) || nearKeepout(x,y,60,60) || laneOpen(x,y,60,60)) continue;
    box(x,y,60,60,95,'pillar'); n++; }
  tries=0; n=0;
  while(n<20 && tries<1500){ tries++;
    const horiz = Math.random()<0.5, bw = horiz?220:36, bh = horiz?36:220;
    const x=rand(O.x0+150,O.x1-330), y=rand(O.y0+150,O.y1-330);
    if(!inRing(x,y) || overlaps(x,y,bw,bh,130) || nearKeepout(x,y,bw,bh) || laneOpen(x,y,bw,bh)) continue;
    box(x,y,bw,bh,38,'barricade'); n++; }
  // courtyard clutter: a few pillars around the tower plaza
  tries=0; n=0;
  while(n<6 && tries<600){ tries++;
    const x=rand(I.x0+150,I.x1-210), y=rand(I.y0+150,I.y1-210);
    if(overlaps(x,y,60,60,150) || nearKeepout(x,y,60,60) || dist({x:x+30,y:y+30},{x:(I.x0+I.x1)/2,y:cy})<330) continue;
    box(x,y,60,60,95,'pillar'); n++; }
  // ruined outposts outside the walls (not on the approach roads)
  tries=0; n=0;
  while(n<12 && tries<1500){ tries++;
    const horiz = Math.random()<0.5, bw = horiz?240:60, bh = horiz?60:240;
    const x=rand(150,w-400), y=rand(200,h-440);
    const outside = x+bw<O.x0-100 || x>O.x1+100 || y+bh<O.y0-100 || y>O.y1+100;
    if(!outside || overlaps(x,y,bw,bh,140) || nearKeepout(x,y,bw,bh) || Math.abs(y+bh/2-cy)<420) continue;
    box(x,y,bw,bh,55,'wall'); n++; }
  tries=0; n=0;
  while(n<8 && tries<1500){ tries++;
    const x=rand(250,w-380), y=rand(250,h-450);
    const outside = x+130<O.x0-120 || x>O.x1+120 || y+130<O.y0-120 || y>O.y1+120;
    if(!outside || overlaps(x,y,130,130,160) || nearKeepout(x,y,130,130) || Math.abs(y+65-cy)<480) continue;
    box(x,y,130,130,140,'tower'); n++; }
  const obstacles = blocks.map(b=>({x:b.x,y:b.y,w:b.w,h:b.h,isKeep:true}));
  // visual chunks: long walls are cut into short pieces so they depth-sort correctly against actors
  const chunks = [];
  for(const b of blocks){
    if(b.kind==='wall' && Math.max(b.w,b.h)>140){
      const alongX = b.w>=b.h, len = alongX?b.w:b.h, cnt = Math.ceil(len/120), step = len/cnt;
      for(let i=0;i<cnt;i++) chunks.push(alongX ? {x:b.x+i*step,y:b.y,w:step,h:b.h,hz:b.hz,kind:'wall'} : {x:b.x,y:b.y+i*step,w:b.w,h:step,hz:b.hz,kind:'wall'});
    } else chunks.push(b);
  }
  // scatter rocks outside the walls
  const rocks = [];
  for(let i=0;i<260;i++){
    const x=rand(60,w-60), y=rand(60,h-60);
    const inside = x>O.x0-60 && x<O.x1+60 && y>O.y0-60 && y<O.y1+60;
    if(inside || Math.abs(y-cy)<300) continue;
    if(overlaps(x-20,y-20,40,40,40)) continue;
    rocks.push({x,y,s:rand(0.7,1.5)});
  }
  // pack anchors: clear of every block, gate and each other
  const okAnchor = (x,y)=> !blocks.some(b=> x>b.x-100 && x<b.x+b.w+100 && y>b.y-100 && y<b.y+b.h+100) && !gates.some(gt=>dist({x,y},gt)<300) && dist({x,y},waypoint)>300;
  const anchors = [];
  const want = (zone, cnt, region)=>{
    let t=0, c=0;
    while(c<cnt && t<4000){ t++;
      const x=rand(region[0],region[1]), y=rand(region[2],region[3]);
      if(!okAnchor(x,y) || anchors.some(a=>dist(a,{x,y})<320)) continue;
      if(zone==='ward' && !inRing(x,y)) continue;
      anchors.push({x,y,zone}); c++;
    }
  };
  want('approach', 7, [250,O.x0-150,250,h-250]);
  want('ward',     26, [O.x0+150,O.x1-150,O.y0+150,O.y1-150]);
  want('keep',     4, [I.x0+150,I.x1-150,I.y0+150,I.y1-150]);
  want('east',     5, [O.x1+100,w-150,300,h-300]);
  // eastern approach toward Redridge: red-rock outcrops, cacti and bones lining the causeway, thickening toward the exit
  const eastDeco = [];
  for(let i=0;i<110;i++){
    const x = rand(O.x1+60, w-40), y = rand(80, h-80);
    if(Math.abs(y-cy) < CZ.half+80) continue;
    const f = (x-O.x1)/(w-O.x1);
    if(Math.random() > 0.25+f*0.75) continue;
    eastDeco.push({x,y,s:rand(0.9,1.5),k:Math.random()<0.6?'rock':Math.random()<0.6?'cactus':'bones'});
  }
  // braziers' worth of cairns inside the causeway, thinning to the sealed gate
  for(let k=0;k<6;k++){ const x = O.x1+160+k*240; for(const sy of [-1,1]) eastDeco.push({x,y:cy+sy*150,s:1.1,k:'rock'}); }
  return { w, h, depth:FH_DEPTH, name:'Frosthold Keep', obstacles, blocks, chunks, gates, waypoint, rocks, eastDeco, packAnchors:anchors, wall:O, inner:I, causeway:CZ, approach:WA };
}
function spawnFrostholdPack(g, anchor, tpl){
  for(const [type,n0] of tpl.mix){
    const n = staggerN(n0);
    for(let i=0;i<n;i++){
      const sp = 70 + n*14;
      spawnEnemy(g, type, {x:anchor.x+rand(-sp,sp), y:anchor.y+rand(-sp,sp)});
    }
  }
}
function enterFrosthold(opts){
  opts = opts || {};
  const g = game, p = g.player;
  g.scene = 'frosthold';
  g.fh = makeFrosthold();
  g.room = g.fh;
  g.depth = FH_DEPTH;
  const gate = opts.fromRedridge ? g.fh.gates[3] : opts.fromDungeon ? g.fh.gates[2] : opts.fromTower ? g.fh.gates[1] : g.fh.gates[0];
  p.x = opts.fromRedridge ? gate.x - 130 : (opts.fromTower || opts.fromDungeon) ? gate.x : gate.x + 130; p.y = opts.fromTower ? gate.y + 150 : opts.fromDungeon ? gate.y - 150 : gate.y;
  if(opts.atWaypoint){ p.x = g.fh.waypoint.x; p.y = g.fh.waypoint.y + 45; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  for(const a of breatheAnchors(g.fh.packAnchors, {gap:360})){
    const tpl = a.zone==='keep' ? {mix:[['fhbrute',3],['fhdwarf',2],['fhaxe',2],['fhcleric',1]]} : FH_PACKS[Math.floor(Math.random()*FH_PACKS.length)];
    spawnFrostholdPack(g, a, tpl);
  }
  showMsg('Frosthold Keep', 2.0);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
