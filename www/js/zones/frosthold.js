// ---------------- Frosthold Keep (v129) ----------------
// A big outdoor castle at the end of the Mountain Pass road, unlocked with the Templar Runestone.
// Snowy approach in the west, a curtain wall with a west gatehouse and corner/mid towers, a bailey full of
// barracks/pillars/barricades, and a U-shaped central keep. The Tower and Dungeon doors are reserved (sealed).
const FH_W = 4800, FH_H = 3600, FH_DEPTH = 39;
const FH_WALL = {x0:1250, x1:4350, y0:450, y1:3150, t:80};
const FH_PACKS = [
  {mix:[['fhdwarf',4],['fhbrute',1],['fhcleric',1]]}, {mix:[['fhdwarf',5]]}, {mix:[['fhdwarf',3],['fhbrute',2],['fhcleric',1]]},
  {mix:[['fhbrute',3],['fhcleric',1]]}, {mix:[['fhdwarf',4],['fhbrute',1]]}, {mix:[['fhdwarf',5],['fhcleric',1]]},
  {mix:[['fhdwarf',3],['fhaxe',3]]}, {mix:[['fhbrute',1],['fhdwarf',2],['fhaxe',3],['fhcleric',1]]}, {mix:[['fhaxe',4],['fhdwarf',2]]},
];
function makeFrosthold(){
  const w=FH_W, h=FH_H, cy=h/2, W_=FH_WALL;
  const blocks = [];
  const box = (x,y,bw,bh,hz,kind)=>{ blocks.push({x,y,w:bw,h:bh,hz,kind}); };
  // curtain wall (west wall has the gate opening y 1650..1950)
  box(W_.x0, W_.y0, W_.x1-W_.x0, W_.t, 110, 'wall');
  box(W_.x0, W_.y1-W_.t, W_.x1-W_.x0, W_.t, 110, 'wall');
  box(W_.x0, W_.y0+W_.t, W_.t, (cy-150)-(W_.y0+W_.t), 110, 'wall');
  box(W_.x0, cy+150, W_.t, (W_.y1-W_.t)-(cy+150), 110, 'wall');
  box(W_.x1-W_.t, W_.y0+W_.t, W_.t, (cy-150)-(W_.y0+W_.t), 110, 'wall');
  box(W_.x1-W_.t, cy+150, W_.t, (W_.y1-W_.t)-(cy+150), 110, 'wall');
  // corner towers, mid towers, gatehouse towers
  for(const [tx,ty] of [[W_.x0,W_.y0],[W_.x1,W_.y0],[W_.x0,W_.y1],[W_.x1,W_.y1]]) box(tx-110, ty-110, 220, 220, 190, 'tower');
  for(const tx of [2000,2800,3600]){ box(tx-80, W_.y0-40, 160, 160, 160, 'tower'); box(tx-80, W_.y1-120, 160, 160, 160, 'tower'); }
  for(const ty of [1100,2500]) box(W_.x0-40, ty-80, 160, 160, 160, 'tower');
  box(W_.x0-60, cy-150-200, 200, 200, 175, 'tower');
  box(W_.x0-60, cy+150,     200, 200, 175, 'tower');
  box(W_.x1-140, cy-150-200, 200, 200, 175, 'tower');
  box(W_.x1-140, cy+150,     200, 200, 175, 'tower');
  // central keep: U-shape open to the west, corner towers
  box(2500, 1350, 1000, 120, 135, 'wall');
  box(2500, 2130, 1000, 120, 135, 'wall');
  box(3380, 1350, 120, 900, 135, 'wall');
  for(const [tx,ty] of [[2500,1350],[3500,1350],[2500,2250],[3500,2250]]) box(tx-100, ty-100, 200, 200, 200, 'tower');
  // barracks
  for(const [bx,by,bw,bh] of [[1550,700,340,220],[1550,2680,340,220],[3700,700,400,220],[3700,2680,400,220],[2100,700,300,200],[2200,2700,300,200]]) box(bx,by,bw,bh,95,'house');
  const gates = [
    {id:'pass',    x:16,   y:cy,   r:38, label:'MOUNTAIN PASS',     act:'toMountainPassFromFrost', art:'keep', big:1.45, labelH:150},
    {id:'tower',   x:3200, y:cy,   r:38, label:'FROSTHOLD TOWER',   act:'toFhTower', art:'ftower', dz:380, labelH:112, fadeH:600},
    {id:'dungeon', x:2800, y:2790, r:38, label:'FROSTHOLD DUNGEON', act:'toFhDungeon', art:'fhdungeon', dz:380, labelH:118, fadeH:200},
    {id:'redridge', x:w-16, y:cy, r:38, label:'REDRIDGE CANYON', act:'toRedridge', art:true},
  ];
  const waypoint = {x:2250, y:cy, r:30};
  const keepouts = gates.map(gt=>({x:gt.x,y:gt.y,r:150})); keepouts.push({x:waypoint.x,y:waypoint.y,r:170});
  const overlaps = (x,y,bw,bh,pad)=> blocks.some(b=> x < b.x+b.w+pad && x+bw > b.x-pad && y < b.y+b.hz*0+b.h+pad && y+bh > b.y-pad);
  const nearKeepout = (x,y,bw,bh)=> keepouts.some(k=> dist({x:x+bw/2,y:y+bh/2},k) < k.r+Math.max(bw,bh)/2);
  // pillars + barricades in the bailey, ruined outposts on the approach
  let tries=0, n=0;
  while(n<16 && tries<600){ tries++;
    const x=rand(W_.x0+150,W_.x1-210), y=rand(W_.y0+150,W_.y1-210);
    if(overlaps(x,y,60,60,70) || nearKeepout(x,y,60,60) || Math.abs(y+30-cy)<160 && x<W_.x0+700) continue;
    box(x,y,60,60,95,'pillar'); n++; }
  tries=0; n=0;
  while(n<10 && tries<600){ tries++;
    const horiz = Math.random()<0.5, bw = horiz?220:36, bh = horiz?36:220;
    const x=rand(W_.x0+150,W_.x1-330), y=rand(W_.y0+150,W_.y1-330);
    if(overlaps(x,y,bw,bh,90) || nearKeepout(x,y,bw,bh) || Math.abs(y+bh/2-cy)<170 && x<W_.x0+800) continue;
    box(x,y,bw,bh,38,'barricade'); n++; }
  tries=0; n=0;
  while(n<7 && tries<600){ tries++;
    const horiz = Math.random()<0.5, bw = horiz?240:60, bh = horiz?60:240;
    const x=rand(150,W_.x0-200), y=rand(200,h-440);
    if(overlaps(x,y,bw,bh,120) || nearKeepout(x,y,bw,bh) || Math.abs(y+bh/2-cy)<200) continue;
    box(x,y,bw,bh,55,'wall'); n++; }
  tries=0; n=0;
  while(n<4 && tries<600){ tries++;
    const x=rand(250,W_.x0-350), y=rand(250,h-450);
    if(overlaps(x,y,130,130,140) || nearKeepout(x,y,130,130) || Math.abs(y+65-cy)<260) continue;
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
  for(let i=0;i<160;i++){
    const x=rand(60,w-60), y=rand(60,h-60);
    const inside = x>W_.x0-30 && x<W_.x1+30 && y>W_.y0-30 && y<W_.y1+30;
    if(inside || Math.abs(y-cy)<130 && (x<W_.x0 || x>W_.x1)) continue;
    if(overlaps(x-20,y-20,40,40,40)) continue;
    rocks.push({x,y,s:rand(0.7,1.5)});
  }
  // pack anchors: clear of every block, gate and each other
  const okAnchor = (x,y)=> !blocks.some(b=> x>b.x-100 && x<b.x+b.w+100 && y>b.y-100 && y<b.y+b.h+100) && !gates.some(gt=>dist({x,y},gt)<300) && dist({x,y},waypoint)>300;
  const anchors = [];
  const want = (zone, cnt, region)=>{
    let t=0, c=0;
    while(c<cnt && t<3000){ t++;
      const x=rand(region[0],region[1]), y=rand(region[2],region[3]);
      if(!okAnchor(x,y) || anchors.some(a=>dist(a,{x,y})<300)) continue;
      anchors.push({x,y,zone}); c++;
    }
  };
  want('approach', 6, [250,W_.x0-150,250,h-250]);
  want('ward',     12, [W_.x0+150,W_.x1-150,W_.y0+150,W_.y1-150]);
  want('keep',     2, [2600,3300,1500,2100]);
  want('east',     2, [W_.x1+100,w-150,300,h-300]);
  // eastern approach toward Redridge: red-rock outcrops, cacti and bones lining the road, thickening toward the exit
  const eastDeco = [];
  for(let i=0;i<70;i++){
    const x = rand(W_.x1+60, w-40), y = rand(80, h-80);
    if(Math.abs(y-cy) < 120) continue;
    const f = (x-W_.x1)/(w-W_.x1);
    if(Math.random() > 0.25+f*0.75) continue;
    eastDeco.push({x,y,s:rand(0.9,1.5),k:Math.random()<0.6?'rock':Math.random()<0.6?'cactus':'bones'});
  }
  // waymarker cairns flanking the road out of the east gate
  for(let k=0;k<5;k++){ const x = W_.x1+90+k*80; for(const sy of [-1,1]) eastDeco.push({x,y:cy+sy*118,s:1.2,k:'rock'}); }
  return { w, h, depth:FH_DEPTH, name:'Frosthold Keep', obstacles, blocks, chunks, gates, waypoint, rocks, eastDeco, packAnchors:anchors, wall:W_ };
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
