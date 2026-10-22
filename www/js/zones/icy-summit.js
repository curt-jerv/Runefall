// ---------------- Icy Summit / Mountain Top Shrine / Icy Cellar (v125) ----------------
// Three open zones sharing ONE scene ('icyzone', data in g.iz, g.iz.kind =
// 'summit' | 'shrine' | 'cellar'). Summit is reached from a north gate in the
// Mountain Pass and links east to the Shrine and west to the Cellar. Only the
// Summit has a waypoint. The Summit is freezing: 1 cold damage per second
// (flat, ignores cold resistance).
const COLD_DPS = 1, COLD_DPS_PCT = 0.006;   // v490: bitter cold = the larger of 1 HP or 0.6% of max life per second (was a flat 1); the Icy Cellar is just as cold
const MASTODON_HP_MULT = 11, MASTODON_DMG_MULT = 2.4, MASTODON_R_MULT = 2.1;
const ICY_ZONE_DEFS = {
  summit:{ name:'Icy Summit',          w:4200, h:3100, depth:35 },   // v490: bigger (was 2000x1500); v514: bigger again
  shrine:{ name:'Mountain Top Shrine', w:2300, h:1700, depth:37 },
  cellar:{ name:'Icy Cellar',          w:6000, h:3800, depth:36 },   // v523: a winding frozen cave (makeIcyCellar)
};
const ICY_PACKS = {
  summit:[ {type:'frozenzombie',count:5}, {type:'bear',countMin:2,countMax:3,variant:'polar'}, {type:'warg',countMin:4,countMax:5,variant:'white'}, {type:'windigo',countMin:1,countMax:2} ],
  shrine:[ {type:'frozenzombie',count:5}, {type:'bear',countMin:2,countMax:3,variant:'polar'}, {type:'warg',countMin:4,countMax:5,variant:'white'} ],
  cellar:[ {type:'frozenzombie',count:6}, {type:'warg',countMin:4,countMax:5,variant:'white'}, {type:'bear',countMin:2,countMax:3,variant:'polar'}, {type:'windigo',countMin:1,countMax:2} ],
};
function makeIcyZone(kind){
  if(kind==='cellar') return makeIcyCellar();
  const def = ICY_ZONE_DEFS[kind];
  const w = def.w, h = def.h;
  const z = { kind, name:def.name, w, h, depth:def.depth, obstacles:[], gates:[], rocks:[], packAnchors:[], cold: kind==='summit' || kind==='cellar' };
  if(kind==='summit'){
    z.gates.push({id:'pass',   x:w/2, y:h-16, r:38, label:'MOUNTAIN PASS',       act:'toMountainPassFromIcy', art:'cave'});
    z.gates.push({id:'shrine', x:w-16, y:h/2, r:38, label:'MOUNTAIN TOP SHRINE', act:'toIcyShrine',           art:'cave'});
    z.gates.push({id:'cellar', x:16,  y:h/2, r:38, label:'ICY CELLAR',          act:'toIcyCellar',           art:'cave'});
    z.waypoint = {x:w/2, y:h/2-170, r:22};
    // v523: an old worn path: the Mountain Pass mouth -> the waypoint -> the Shrine's cave
    z.trail = [{x:w/2, y:h-16}, {x:w/2+120, y:h*0.78}, {x:w/2-90, y:h*0.62}, {x:w/2, y:h/2-120}, {x:w*0.63, y:h/2-260}, {x:w*0.8, y:h/2-60}, {x:w-16, y:h/2}];
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
    if(z.trail && icyTrailDist(z, x, y) < 110) continue;
    z.rocks.push({x,y,s:rand(0.7,1.5)});
  }
  for(const bp of zoneBorderPoints(w,h,35,110,gaps)) z.rocks.push({x:bp.x,y:bp.y,s:rand(0.8,1.6)});
  // (v162) a continuous wall of tall ice crags around the zone edge, broken only by the cave mouths
  z.crags = [];
  const wallGaps = z.gates.map(gt=>({x:gt.x,y:gt.y,r:120}));
  for(const bp of zoneBorderPoints(w,h,8,52,wallGaps)) z.crags.push({x:bp.x+rand(-8,8),y:bp.y+rand(-8,8),s:rand(0.9,1.5),h:rand(60,110)});
  const want = kind==='summit' ? 30 : kind==='shrine' ? 12 : 15;   // v490: more packs for the bigger summit
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
// v523: the Icy Cellar is a winding cave of frozen caverns (organic layout like the Bear Cave, but lit like the
// open mountain and freezing cold). The Summit gate opens into the east cavern; a chain of caverns full of packs
// leads west to ONE tunnel into the Woolly Mastodon's great ice hall -- big enough for its charges and avalanches.
// Once you step into the hall, dying brings you back just outside its tunnel (iz.entrySpawn).
function icyTrailDist(z, x, y){
  let best = 1e9; const T = z.trail; if(!T) return best;
  for(let i=0;i<T.length-1;i++){ const a = T[i], b = T[i+1], vx = b.x-a.x, vy = b.y-a.y, t = clamp(((x-a.x)*vx+(y-a.y)*vy)/(vx*vx+vy*vy||1),0,1); best = Math.min(best, Math.hypot(x-(a.x+vx*t), y-(a.y+vy*t))); }
  return best;
}
function makeIcyCellar(){
  const def = ICY_ZONE_DEFS.cellar, w = def.w, h = def.h;
  const ent = {x:w-420, y:h*0.5, rx:250, ry:225};
  const boss = {x:960, y:h*0.5, rx:760, ry:640, a1:0.06, a2:0.03};
  const mains = []; let guard = 0;
  while(mains.length<6 && guard<4000){
    guard++;
    const rx = rand(280,380), ry = rx*rand(0.78,0.95);
    const c = {x:rand(2150+rx, w-760-rx), y:rand(260+ry, h-260-ry), rx, ry};
    const ok = d=> dist(c,d) > (Math.max(c.rx,c.ry)+Math.max(d.rx,d.ry))*1.0;
    if(!ok(ent) || !ok(boss) || mains.some(m=>!ok(m))) continue;
    mains.push(c);
  }
  while(mains.length<6){ const i = mains.length; mains.push({x:2500+i*520, y:h*(i%2?0.3:0.7), rx:280, ry:240}); }
  // visit nearest-neighbour from the entrance, so the route winds; the last cavern holds the door to the hall
  const chain = [], pool = mains.slice(); let cur = ent;
  while(pool.length){ pool.sort((a,b)=>dist(cur,a)-dist(cur,b)); cur = pool.shift(); chain.push(cur); }
  // the westmost cavern must be the last one, next to the hall
  const west = chain.reduce((m,c)=>c.x<m.x?c:m, chain[0]); chain.splice(chain.indexOf(west),1); chain.push(west);
  const all = [ent, ...chain, boss], bi = all.length-1;
  const links = []; for(let i=0;i<all.length-1;i++) links.push([i,i+1]);
  links.push([1, all.length-3]);   // one shortcut loop (never into the hall)
  const R = organicCaveBuild({kind:'ice', w, h, chambers:all, links, tunnelR:115, entranceIdx:0, exitIdx:bi, mainIdx:all.slice(1,-1).map((_,i)=>i+1)});
  const z = Object.assign(R, { kind:'cellar', name:def.name, depth:def.depth, gates:[], rocks:[], crags:[], packAnchors:[], cold:true, organic:'ice' });
  const gx = ent.x+ent.rx*0.55, gy = ent.y;
  z.gates.push({id:'summit', x:gx, y:gy, r:38, label:'ICY SUMMIT', act:'toIcySummit', art:'cave'});
  z.entranceSpot = {x:gx-150, y:gy};
  z.bossSpot = {x:boss.x, y:boss.y};
  z.bossHall = {x:boss.x, y:boss.y, rx:boss.rx, ry:boss.ry};
  { const ante = chain[chain.length-1], a = Math.atan2(ante.y-boss.y, ante.x-boss.x), rr = boss.rx+230;
    z.hallDoorOut = {x:boss.x+Math.cos(a)*rr, y:boss.y+Math.sin(a)*rr}; }
  // two packs in every cavern, one in the tunnels between some of them
  const openAt = (x,y)=>{ const m = z.floorMask, ix = Math.floor(x/m.CELL), iy = Math.floor(y/m.CELL); return ix>=0 && iy>=0 && ix<m.cols && iy<m.rows && m.data[iy*m.cols+ix] && !posBlockedByObstacles(x, y, 30, z.obstacles); };
  for(const c of chain){
    let n = 0, tries = 0;
    while(n<2 && tries<60){ tries++; const a = Math.random()*6.283, rr = rand(0, Math.min(c.rx,c.ry)*0.55), x = c.x+Math.cos(a)*rr, y = c.y+Math.sin(a)*rr;
      if(!openAt(x,y) || z.packAnchors.some(q=>dist(q,{x,y})<220)) continue; z.packAnchors.push({x,y}); n++; }
  }
  // frost-cracked boulders and ice spikes scattered on the cavern floors (decoration only)
  for(const c of chain.concat([ent])){
    for(let i=0;i<3;i++){ const a = Math.random()*6.283, rr = Math.min(c.rx,c.ry)*rand(0.55,0.8), x = c.x+Math.cos(a)*rr, y = c.y+Math.sin(a)*rr; if(openAt(x,y) && dist({x,y},{x:gx,y:gy})>200) z.rocks.push({x,y,s:rand(0.6,1.1)}); }
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

