// ---------------- Icy Summit / Mountain Top Shrine / Icy Cellar (v125) ----------------
// Three open zones sharing ONE scene ('icyzone', data in g.iz, g.iz.kind =
// 'summit' | 'shrine' | 'cellar'). Summit is reached from a north gate in the
// Mountain Pass and links east to the Shrine and west to the Cellar. Only the
// Summit has a waypoint. The Summit is freezing: 1 cold damage per second
// (flat, ignores cold resistance).
const COLD_DPS = 1;
const MASTODON_HP_MULT = 11, MASTODON_DMG_MULT = 2.4, MASTODON_R_MULT = 2.1;
const ICY_ZONE_DEFS = {
  summit:{ name:'Icy Summit',          w:2000, h:1500, depth:35 },
  shrine:{ name:'Mountain Top Shrine', w:1500, h:1100, depth:37 },
  cellar:{ name:'Icy Cellar',          w:1700, h:1200, depth:36 },
};
const ICY_PACKS = {
  summit:[ {type:'frozenzombie',count:5}, {type:'bear',countMin:2,countMax:3,variant:'polar'}, {type:'wolf',countMin:4,countMax:5} ],
  shrine:[ {type:'frozenzombie',count:5}, {type:'bear',countMin:2,countMax:3,variant:'polar'}, {type:'wolf',countMin:4,countMax:5} ],
  cellar:[ {type:'frozenzombie',count:6}, {type:'wolf',countMin:4,countMax:5}, {type:'bear',countMin:2,countMax:3,variant:'polar'} ],
};
function makeIcyZone(kind){
  const def = ICY_ZONE_DEFS[kind];
  const w = def.w, h = def.h;
  const z = { kind, name:def.name, w, h, depth:def.depth, obstacles:[], gates:[], rocks:[], packAnchors:[], cold: kind==='summit' };
  if(kind==='summit'){
    z.gates.push({id:'pass',   x:w/2, y:h-16, r:38, label:'MOUNTAIN PASS',       act:'toMountainPassFromIcy', art:'cave'});
    z.gates.push({id:'shrine', x:w-16, y:h/2, r:38, label:'MOUNTAIN TOP SHRINE', act:'toIcyShrine',           art:'cave'});
    z.gates.push({id:'cellar', x:16,  y:h/2, r:38, label:'ICY CELLAR',          act:'toIcyCellar',           art:'cave'});
    z.waypoint = {x:w/2, y:h/2-170, r:22};
  } else if(kind==='shrine'){
    z.gates.push({id:'summit', x:16, y:h/2, r:38, label:'ICY SUMMIT', act:'toIcySummit', art:'cave'});
    z.altar = {x:w-250, y:h/2, r:30};
    z.chestPos = {x:w-250, y:h/2+85};
  } else {
    z.gates.push({id:'summit', x:w-16, y:h/2, r:38, label:'ICY SUMMIT', act:'toIcySummit', art:'cave'});
    z.bossSpot = {x:320, y:h/2};
  }
  const gaps = z.gates.map(gt=>({x:gt.x,y:gt.y,r:130}));
  const keep = z.gates.slice();
  if(z.waypoint) keep.push(z.waypoint);
  if(z.altar) keep.push({x:z.altar.x,y:z.altar.y,r:0}, z.chestPos);
  if(z.bossSpot) keep.push(z.bossSpot);
  const nRocks = Math.round(w*h/9000);
  for(let i=0;i<nRocks;i++){
    const x = rand(70,w-70), y = rand(70,h-70);
    if(keep.some(k=>dist({x,y},k) < 110)) continue;
    z.rocks.push({x,y,s:rand(0.7,1.5)});
  }
  for(const bp of zoneBorderPoints(w,h,35,110,gaps)) z.rocks.push({x:bp.x,y:bp.y,s:rand(0.8,1.6)});
  // (v162) a continuous wall of tall ice crags around the zone edge, broken only by the cave mouths
  z.crags = [];
  const wallGaps = z.gates.map(gt=>({x:gt.x,y:gt.y,r:120}));
  for(const bp of zoneBorderPoints(w,h,8,52,wallGaps)) z.crags.push({x:bp.x+rand(-8,8),y:bp.y+rand(-8,8),s:rand(0.9,1.5),h:rand(60,110)});
  const want = kind==='summit' ? 10 : kind==='shrine' ? 6 : 7;
  let tries=0;
  while(z.packAnchors.length<want && tries<1500){
    tries++;
    const x = rand(160,w-160), y = rand(160,h-160);
    if(z.gates.some(gt=>dist({x,y},gt) < 320)) continue;
    if(z.waypoint && dist({x,y},z.waypoint) < 240) continue;
    if(z.altar && dist({x,y},z.altar) < 200) continue;
    if(z.bossSpot && dist({x,y},z.bossSpot) < 300) continue;
    if(z.packAnchors.some(a=>dist(a,{x,y}) < 300)) continue;
    z.packAnchors.push({x,y});
  }
  return z;
}
function spawnIcyPack(g, anchor, t){
  const n = forestPackSize(t);
  const spread = 60 + n*10;
  for(let i=0;i<n;i++){
    const e = spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
    if(t.variant) e.variant = t.variant;
  }
}
function spawnMountainPassPack(g, anchor, template){
  const t = template || MOUNTAIN_PASS_PACK_TEMPLATES[Math.floor(Math.random()*MOUNTAIN_PASS_PACK_TEMPLATES.length)];
  const n = forestPackSize(t);
  const spread = 40 + n*6;
  for(let i=0;i<n;i++){
    const e = spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
    if(t.variant) e.variant = t.variant;
  }
}

