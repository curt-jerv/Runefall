// ---------------- Mountain Depths / Ember Caverns / Heart of the Mountain (v263) ----------------
// The dungeon at the foot of the Mountain Pass' south stem. Three floors on the 'lighthouse' scene rig
// (room.deep = 1|2|3): goblins and cave trolls; fire monsters (lava beetles, fire bats, magma golems); and the
// Heart of the Mountain, whose huge arena holds the Molten Colossus.
const DEEP_FLOORS = 3, DEEP_BASE_LEVEL = 36;
const DEEP_NAMES = ['Mountain Depths', 'Ember Caverns', 'Heart of the Mountain'];
const HEART_W = 4020, HEART_H = 1400, HEART_AX0 = 1886, HEART_AX1 = 3836, HEART_AY0 = 148, HEART_AY1 = 1252;   // (v352) arena halved (was 5520x3128); v456 halved again and made an organic bowl
const HEART_CX = (HEART_AX0+HEART_AX1)/2, HEART_CY = HEART_H/2, HEART_RX = (HEART_AX1-HEART_AX0)/2, HEART_RY = (HEART_AY1-HEART_AY0)/2;
// v505: the Breach's Molten Colossus floor brings its own bowl (room.heartGeo); every other room uses the real Heart of the Mountain
const HEART_DEF = {AX0:HEART_AX0, AX1:HEART_AX1, AY0:HEART_AY0, AY1:HEART_AY1, CX:HEART_CX, CY:HEART_CY, RX:HEART_RX, RY:HEART_RY};
function heartG(){ const r = (typeof game!=='undefined' && game && game.room) || null; return (r && r.heartGeo) || HEART_DEF; }
// v456: the arena is an ellipse; this keeps a point (or a body of radius m) inside it
function heartEllD(x, y){ const G = heartG(), nx = (x-G.CX)/G.RX, ny = (y-G.CY)/G.RY; return Math.sqrt(nx*nx+ny*ny); }
function heartClampPt(x, y, m){
  const G = heartG(), k = 0.9, rx = Math.max(40, G.RX*k - m), ry = Math.max(40, G.RY*k - m), nx = (x-G.CX)/rx, ny = (y-G.CY)/ry, d = Math.sqrt(nx*nx+ny*ny);
  return d<=1 ? {x, y} : {x:G.CX + (x-G.CX)/d, y:G.CY + (y-G.CY)/d};
}
const HIT_FLASH = '#8e3a32';   // (v263) dull red hit flash for bosses (the old pure white was blinding)
function deepFloorLevel(f){ return DEEP_BASE_LEVEL + f - 1; }
function deepEntranceSide(f){ return (f%2===1) ? 'left' : 'right'; }
function heartLavaAt(room, x, y){
  if(!(room.lavaInset > 0)) return false;
  if(x<heartG().AX0-120) return false;
  const d = heartEllD(x, y);   // v456: the lava creeps in from the rim of the bowl
  return d < 1.25 && (1-d)*heartG().RY*0.95 < room.lavaInset;
}
// v456: Ember Caverns and the Heart of the Mountain are organic caves now (like the Bear Cave), with lava pools in the caverns
const deepOrgCache = {};
function makeDeepOrganicFloor(f){
  const tb = tripSeed('deep');   // v525: the Ember Caverns change every trip (the Heart's boss bowl stays fixed)
  if(deepOrgCache[f] && (f===3 || deepOrgCache[f]._trip===tb)) return deepOrgCache[f];
  const saveRand = Math.random, rnd = subSeeded(f===3 ? f*9133 + 71 : tb + f*9133);   // v525: the Ember Caverns change every trip (the Heart's boss bowl stays fixed)
  Math.random = rnd;
  let R;
  try{
    const boss = f===3;
    let chs, links, w, h;
    if(!boss){
      w = 5800; h = 3300;   // v514: ~2.1x the area (was 3900x2300): a longer chain of caverns with side loops
      chs = [{x:300, y:h*0.5, rx:200, ry:175}];
      const NM = 8;
      for(let i=0;i<NM;i++){ const rx = 250+rnd()*120, x = 950 + i*((w-2200)/(NM-1)); chs.push({x:x+(rnd()-0.5)*160, y:h*(i%2 ? 0.30 : 0.68)+(rnd()-0.5)*260, rx, ry:rx*(0.75+rnd()*0.2)}); }
      const NE = 4;
      for(let i=0;i<NE;i++){ const rx = 200+rnd()*80; chs.push({x:1500+i*((w-3000)/(NE-1))+(rnd()-0.5)*220, y:i%2 ? h*0.85 : h*0.14, rx, ry:rx*0.8}); }
      chs.push({x:w-330, y:h*0.5, rx:230, ry:200});
      const E = chs.length-1;
      links = [[0,1]]; for(let i=1;i<NM;i++) links.push([i,i+1]); links.push([NM,E]);
      for(let i=0;i<NE;i++){ const m1 = 1 + Math.round(i*(NM-1)/(NE-0.5)) , m2 = Math.min(NM, m1+2); links.push([NM+1+i, m1]); links.push([NM+1+i, m2]); }
    } else {
      w = HEART_W; h = HEART_H;
      chs = [{x:300, y:h*0.5, rx:190, ry:165}, {x:820, y:h*0.3, rx:250, ry:200}, {x:1350, y:h*0.62, rx:240, ry:200},
             {x:HEART_CX, y:HEART_CY, rx:HEART_RX, ry:HEART_RY, a1:0.05, a2:0.03}];
      links = [[0,1],[1,2],[2,3],[0,2]];
    }
    R = organicCaveBuild({kind:boss ? 'heart' : 'ember', w, h, chambers:chs, links, tunnelR:boss ? 115 : 105, entranceIdx:0, exitIdx:chs.length-1, mainIdx:chs.map((_,i)=>i).slice(1,-1)});
    const ent = chs[0], ex = chs[chs.length-1];
    const entrance = {x:ent.x-ent.rx*0.6, y:ent.y, r:34};
    const stairs = boss ? null : {x:ex.x+ex.rx*0.5, y:ex.y, r:30};
    // lava pools: off to the side of each cavern so the way through stays open
    const pools = [];
    const open = (x,y)=>mineOpenAt(R,x,y);
    for(let i=1;i<chs.length-(boss?1:1);i++){
      const c = chs[i];
      for(let k=0;k<(boss?1:2);k++){
        const a = rnd()*6.28, pw = Math.round(c.rx*(0.35+rnd()*0.2)), ph = Math.round(c.ry*(0.3+rnd()*0.2));
        const cx = c.x+Math.cos(a)*c.rx*0.45, cy = c.y+Math.sin(a)*c.ry*0.45, q = {x:Math.round(cx-pw/2), y:Math.round(cy-ph/2), w:pw, h:ph};
        let ok = true;
        for(let yy=q.y-30; yy<=q.y+q.h+30 && ok; yy+=25) for(let xx=q.x-30; xx<=q.x+q.w+30; xx+=25) if(!open(xx,yy)){ ok = false; break; }
        if(ok && dist({x:cx,y:cy}, c) > 70 && pools.every(o=>!(q.x<o.x+o.w+80 && q.x+q.w>o.x-80 && q.y<o.y+o.h+80 && q.y+q.h>o.y-80))) pools.push(q);
      }
    }
    for(const q of pools) R.obstacles.push({x:q.x, y:q.y, w:q.w, h:q.h, isWater:true, isLava:true});
    Object.assign(R, {deep:f, floor:f, name:DEEP_NAMES[f-1], entrance, stairs, entranceSide:'left', entranceSpot:{x:entrance.x+90, y:entrance.y},
      mine:false, fht:false, ft:false, rooftop:false, bossFloor:boss, waypoint:null, beacon:null, witch:null, clearPortal:undefined,
      chestSpot: boss ? {x:HEART_CX, y:HEART_CY, r:24} : null, lavaInset:0, organicDeep:true});
    if(f===2) R.waypoint = {x:ent.x+60, y:ent.y-105, r:22};   // v489: Ember Caverns waypoint, beside the arrival stairs
    R.waters = R.obstacles.filter(o=>o.isWater);
  } finally { Math.random = saveRand; }
  const room = R;
  room.lavaAt = (x,y)=> subWaterAt(room,x,y) || (room.bossFloor && heartLavaAt(room,x,y));
  room._trip = tb; deepOrgCache[f] = room;
  return room;
}
function makeDeepFloor(f){
  if(f===1) return makeDeepMineFloor();
  if(f===2 || f===3){ const r = makeDeepOrganicFloor(f); r.lavaInset = 0; r.clearPortal = undefined; return r; }
  const boss = f===3;
  const w = f===1 ? 2622 : f===2 ? 2898 : HEART_W, h = f===1 ? 1426 : f===2 ? 1518 : HEART_H;
  const es = deepEntranceSide(f), ss = es==='left' ? 'right' : 'left';
  const entrance = {x: es==='left' ? 70 : w-70, y:h/2, r:34};
  const stairs = boss ? null : {x: ss==='left' ? 70 : w-70, y:h/2, r:30};
  const rnd = subSeeded(f*7717 + 211);
  const obstacles = [];
  const lavaRects = [];
  const snap = v=>Math.round(v/46)*46-23;
  if(f>=2){
    const nPools = boss ? 4 : 8;
    for(let i=0;i<nPools*6 && lavaRects.length<nPools;i++){
      const pw = snap(rnd()*200+200)+23, ph = snap(rnd()*140+160)+23;
      const px = snap(boss ? 300+rnd()*1100 : 300+rnd()*(w-600)), py = snap(160+rnd()*(h-320-ph));
      const c = {x:px+pw/2, y:py+ph/2};
      if(dist(c,entrance) < 330 || (stairs && dist(c,stairs) < 330)) continue;
      if(Math.abs(c.y-h/2) < 140 && boss) continue;
      if(lavaRects.some(q=>px<q.x+q.w+120 && px+pw>q.x-120 && py<q.y+q.h+120 && py+ph>q.y-120)) continue;
      lavaRects.push({x:px, y:py, w:pw, h:ph});
    }
    for(const q of lavaRects) obstacles.push({x:q.x, y:q.y, w:q.w, h:q.h, isWater:true, isLava:true});
  }
  // pillars
  const cols = boss ? 3 : 5, rows = 3, pw0 = boss ? 1600 : w;
  for(let cx=1; cx<=cols; cx++) for(let ry=1; ry<=rows; ry++){
    if(rnd() < 0.3) continue;
    const px = pw0*(cx/(cols+1)) + (rnd()-0.5)*110, py = h*(ry/(rows+1)) + (rnd()-0.5)*110, sz = 56 + Math.floor(rnd()*56);
    if(dist({x:px,y:py}, entrance) < 240 || (stairs && dist({x:px,y:py}, stairs) < 240)) continue;
    if(lavaRects.some(q=>px>q.x-sz-60 && px<q.x+q.w+sz+60 && py>q.y-sz-60 && py<q.y+q.h+sz+60)) continue;
    obstacles.push({x:Math.round(px-sz/2), y:Math.round(py-sz/2), w:sz, h:sz});
  }
  if(boss){   // divider wall between the antechamber and the arena, with one gateway
    obstacles.push({x:1702, y:-46, w:92, h:h/2-150+46});
    obstacles.push({x:1702, y:h/2+150, w:92, h:h/2-150+46});
  }
  const room = { w, h, obstacles, deep:f, floor:f, name:DEEP_NAMES[f-1], entrance, stairs, entranceSide:es, entranceSpot:{x:entrance.x+(es==='left'?90:-90), y:h/2},
    mine:false, fht:false, ft:false, rooftop:false, bossFloor:boss, waypoint:null, beacon:null, witch:null, clearPortal:undefined,
    chestSpot: boss ? {x:HEART_CX, y:HEART_CY, r:24} : null, lavaInset:0 };
  room.waters = obstacles.filter(o=>o.isWater);
  room.lavaAt = (x,y)=> subWaterAt(room,x,y) || (boss && heartLavaAt(room,x,y));
  return room;
}
function spawnDeepFloor(g, f){
  const room = g.room, av = [{x:room.entrance.x,y:room.entrance.y,r:360}];
  if(room.stairs) av.push({x:room.stairs.x,y:room.stairs.y,r:320});
  const orgF = !!room.organicDeep;
  const sp = (type,pos)=> (pos && (!orgF || mineOpenAt(room,pos.x,pos.y)) && (type==='firebat' || !posBlockedByObstacles(pos.x, pos.y, 22, room.obstacles))) ? spawnEnemy(g, type, pos) : null;
  const spot = (x0,x1,y0,y1)=> orgF ? (()=>{ for(let k=0;k<60;k++){ const c = deepMineSpot(room, av, 40); if(c && c.x>=x0 && c.x<=x1) return c; } return null; })() : subFreeSpot(room, x0, x1, y0, y1, av, 120);
  const around = (c,r)=>({x:c.x+rand(-r,r), y:c.y+rand(-r,r)});
  if(f===1){
    const avoidMine = [{x:room.entrance.x,y:room.entrance.y,r:380},{x:room.stairs.x,y:room.stairs.y,r:300},{x:room.camp.x,y:room.camp.y,r:360}];
    const mp = (type,pos)=> (pos && mineOpenAt(room,pos.x,pos.y) && !posBlockedByObstacles(pos.x,pos.y,22,room.obstacles)) ? spawnEnemy(g, type, pos) : null;
    for(let i=0;i<34;i++){
      const c = deepMineSpot(room, avoidMine, 80); if(!c) continue;
      for(let k=0;k<3+Math.floor(Math.random()*3);k++) mp('goblin', around(c,90));
      for(let k=0;k<1+(i%2);k++) mp('goblinarcher', around(c,100));
      if(i%2===0) mp('cavetroll', around(c,45));
    }
    for(let i=0;i<6;i++){ const c = deepMineSpot(room, avoidMine, 80); if(c){ mp('cavetroll', c); mp('cavetroll', around(c,60)); } }
    for(let i=0;i<10;i++){ const c = deepMineSpot(room, avoidMine, 80); if(c) for(let k=0;k<3;k++){ const e = spawnEnemy(g, 'firebat', around(c,110)); if(e && !mineOpenAt(room,e.x,e.y)){ e.x = c.x; e.y = c.y; } } }
    if((g.player.minerQ||0)===1 && !g.enemies.some(e=>e.minerSwarm && e.hp>0)) startMinerSwarm(g);   // reloaded mid-quest: the horde is still coming
  } else {
    const heart = f===3, X1 = heart ? HEART_AX0-150 : room.w-160;
    const nBeetle = heart ? 6 : 28, nBat = heart ? 3 : 10, nGolem = heart ? 5 : 14;
    for(let i=0;i<nBeetle;i++){ const c = spot(160, X1, 120, room.h-120); if(!c) continue; for(let k=0;k<3+Math.floor(Math.random()*2);k++) sp('lavabeetle', around(c,90)); }
    for(let i=0;i<nBat;i++){ const c = spot(160, X1, 120, room.h-120); if(!c) continue; for(let k=0;k<3;k++) sp('firebat', around(c,100)); }
    for(let i=0;i<nGolem;i++){ const c = spot(160, X1, 120, room.h-120); if(!c) continue; sp('magmagolem', c); if(i%3===0) sp('magmagolem', around(c,70)); }
    if(heart){   // v489: the Colossus rises again on every visit
      const e = spawnEnemy(g, 'colossus', {x:HEART_CX+260, y:HEART_CY});
      e.isLairBoss = true; e.bossName = 'The Molten Colossus'; initColossus(e);
      showMsg('The mountain itself stirs...', 2.4, '#ff9a50');
    }
  }
}
function enterDeep(floor, opts){
  opts = opts || {};
  const g = game, p = g.player;
  floor = clamp(floor||1, 1, DEEP_FLOORS);
  g.scene = 'lighthouse'; g.lighthouseFloor = floor;
  g.tower = makeDeepFloor(floor); g.room = g.tower;
  g.depth = deepFloorLevel(floor);
  const t = g.tower;
  if(opts.atWaypoint && t.waypoint){ p.x = t.waypoint.x; p.y = t.waypoint.y + 40; }
  else if(opts.fromBelow && t.stairs){ p.x = t.stairs.x + (t.entranceSide==='left' ? -70 : 70); p.y = t.stairs.y; }
  else { p.x = t.entrance.x + (t.entranceSide==='left' ? 70 : -70); p.y = t.entrance.y; }
  p.crX = undefined;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false; g.blasts=[];
  showMsg(t.name+'  (Lv. '+g.depth+')', 1.8);
  g.deepStore = g.deepStore || {};
  if(g.deepStore[floor] && !(t.bossFloor && !g.deepStore[floor].some(e=>e.colossus && e.hp>0))) g.enemies = g.deepStore[floor];   // v489: a slain Colossus floor refills
  else spawnDeepFloor(g, floor);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  g.miners = null; g.minerRun = null; if(floor===1) setupMiners(g);
  g._heatWarned = false;
  updateInteractPrompt(null);
  saveGame();
}

// ---------------- Mountain Depths, floor 1 (v377): a big organic goblin warren ----------------
// About 3x the old floor's area: caverns joined by winding passages (several routes that loop back on each other),
// a stairwell at the far end reached down terraced ramps, and a camp of three lost miners in a side cavern.
const DEEP_MINE_W = 6600, DEEP_MINE_H = 3500;   // v514: ~2x the area (was 4600x2500)
let deepMineCache = null;
const MINE_N8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function mineOpenAt(room, x, y){
  const m = room.floorMask; if(!m) return true;
  const ix = Math.floor(x/m.CELL), iy = Math.floor(y/m.CELL);
  return ix>=0 && iy>=0 && ix<m.cols && iy<m.rows && !!m.data[iy*m.cols+ix];
}
function mineBfs(room, tx, ty){
  const m = room.floorMask, C = m.cols, Rw = m.rows, CELL = m.CELL, d = new Int16Array(C*Rw).fill(-1);
  const sx = clamp(Math.floor(tx/CELL),0,C-1), sy = clamp(Math.floor(ty/CELL),0,Rw-1);
  const q = [sy*C+sx]; d[q[0]] = 0;
  for(let h=0; h<q.length; h++){
    const i = q[h], x = i%C, y = (i/C)|0;
    for(const [dx,dy] of MINE_N8){
      const nx = x+dx, ny = y+dy; if(nx<0||ny<0||nx>=C||ny>=Rw) continue;
      const j = ny*C+nx; if(d[j]>=0 || !m.data[j]) continue;
      if(dx && dy && (!m.data[y*C+nx] || !m.data[ny*C+x])) continue;
      d[j] = d[i]+1; q.push(j);
    }
  }
  return {d, C, Rw, CELL};
}
// the centre of the cell two steps downhill of (x,y) on a BFS field, or null if the field has no route from here
function mineFlowTarget(fld, x, y){
  let cx = clamp(Math.floor(x/fld.CELL),0,fld.C-1), cy = clamp(Math.floor(y/fld.CELL),0,fld.Rw-1), best = fld.d[cy*fld.C+cx];
  let out = null;
  for(let s=0; s<2; s++){
    let bi = -1, bd = best<0 ? 1e9 : best;
    for(const [dx,dy] of MINE_N8){
      const nx = cx+dx, ny = cy+dy; if(nx<0||ny<0||nx>=fld.C||ny>=fld.Rw) continue;
      const v = fld.d[ny*fld.C+nx]; if(v<0) continue;
      if(dx && dy && (fld.d[cy*fld.C+nx]<0 || fld.d[ny*fld.C+cx]<0)) continue;
      if(v<bd){ bd = v; bi = ny*fld.C+nx; }
    }
    if(bi<0) break;
    cx = bi%fld.C; cy = (bi/fld.C)|0; best = bd; out = {x:cx*fld.CELL+fld.CELL/2, y:cy*fld.CELL+fld.CELL/2};
  }
  return out;
}
function minePlayerField(room, p){
  const m = room.floorMask, key = Math.floor(p.x/m.CELL)*10000 + Math.floor(p.y/m.CELL);
  if(!room._pf || room._pf.key!==key){ room._pf = {key, f:mineBfs(room, p.x, p.y)}; }
  return room._pf.f;
}
function mineEntranceField(room){ if(!room._ef) room._ef = mineBfs(room, room.entrance.x, room.entrance.y); return room._ef; }
function mineStairsField(room){ if(!room._sf) room._sf = mineBfs(room, room.stairs.x, room.stairs.y); return room._sf; }
function mineFlowAngle(ent){
  const g = game, room = g.room; if(!room || !room.floorMask || !g.player) return null;
  const tg = mineFlowTarget(minePlayerField(room, g.player), ent.x, ent.y);
  return tg ? Math.atan2(tg.y-ent.y, tg.x-ent.x) : null;
}
function makeDeepMineFloor(){
  const tb = tripSeed('deep');
  if(deepMineCache && deepMineCache._trip===tb) return deepMineCache;
  const w = DEEP_MINE_W, h = DEEP_MINE_H, saveRand = Math.random, rnd = subSeeded(tb + 40417);   // v525: the warren (and the miners' camp) moves every trip
  Math.random = rnd;   // seeded: the warren is the same every visit, so enemies, camp and quest stay put
  let R;
  try{
    const chs = [{x:330, y:h*0.52, rx:215, ry:185}];
    const nCol = 7, nRow = 4;
    for(let cx=0; cx<nCol; cx++) for(let cy=0; cy<nRow; cy++){
      if(rnd() < 0.22) continue;
      const rx = 190 + rnd()*110;
      chs.push({x: 850 + cx*((w-1700)/(nCol-1)) + (rnd()-0.5)*280, y: h*(0.14 + 0.25*cy + (cx%2 ? 0.05 : -0.02)) + (rnd()-0.5)*220, rx, ry: rx*(0.74+rnd()*0.2)});
    }
    chs.push({x:w-340, y:h*0.48, rx:270, ry:230});
    const n = chs.length, links = [], has = {};
    const link = (a,b)=>{ const k = Math.min(a,b)+'-'+Math.max(a,b); if(has[k]||a===b) return false; has[k] = 1; links.push([a,b]); return true; };
    const inT = {0:true};   // minimum spanning tree guarantees every cavern is reachable
    while(Object.keys(inT).length < n){
      let bd = 1e9, ba = -1, bb = -1;
      for(const a in inT) for(let b=0;b<n;b++){ if(inT[b]) continue; const dd = dist(chs[a],chs[b]); if(dd<bd){ bd = dd; ba = +a; bb = b; } }
      link(ba,bb); inT[bb] = true;
    }
    const order = chs.map((_,i)=>i).sort(()=>rnd()-0.5);
    for(const i of order){   // extra passages so there are loops and more than one way through
      const near = chs.map((c,j)=>({j, d:dist(chs[i],c)})).filter(o=>o.j!==i && o.d<1000).sort((a,b)=>a.d-b.d).slice(0,3);
      for(const o of near) if(rnd()<0.6 && link(i,o.j)) break;
    }
    const deg = chs.map(()=>0); links.forEach(([a,b])=>{ deg[a]++; deg[b]++; });
    R = organicCaveBuild({kind:'deepmine', w, h, chambers:chs, links, tunnelR:96, entranceIdx:0, exitIdx:n-1, mainIdx:chs.map((_,i)=>i).slice(1,-1)});
    const ent = chs[0], ex = chs[n-1];
    // the camp: a quiet side cavern near the middle of the map, preferably a dead end
    let campI = -1, cs = 1e9;
    for(let i=1;i<n-1;i++){ const sc = deg[i]*600 + Math.abs(chs[i].x - w*0.42); if(sc<cs){ cs = sc; campI = i; } }
    const cc = chs[campI];
    Object.assign(R, {deep:1, floor:1, name:DEEP_NAMES[0], entranceSide:'left', mine:false, fht:false, ft:false, rooftop:false, bossFloor:false,
      waypoint:null, beacon:null, witch:null, clearPortal:undefined, chestSpot:null, lavaInset:0, waters:[], isDeepMine:true});
    R.entrance = {x:ent.x-ent.rx*0.72, y:ent.y, r:34};
    R.entranceSpot = {x:R.entrance.x+90, y:R.entrance.y};
    R.stairs = {x:ex.x+ex.rx*0.5, y:ex.y, r:30};
    R.lavaAt = ()=>false;
    R.camp = {x:cc.x, y:cc.y, r:150, rx:cc.rx, ry:cc.ry};
    R.chambers = chs; R.links = links;
    // ramps: terraced slopes laid along the real route down to the stairwell
    const sf = mineBfs(R, R.stairs.x, R.stairs.y);
    const path = []; let px = R.entrance.x, py = R.entrance.y;
    for(let guard=0; guard<400; guard++){
      const tg = mineFlowTarget(sf, px, py); if(!tg) break;
      path.push(tg); px = tg.x; py = tg.y;
      if(dist(tg, R.stairs) < 70) break;
    }
    R.ramps = [];
    const openStrip = (cx,cy,ang,len,wid)=>{
      const ca = Math.cos(ang), sa = Math.sin(ang);
      for(let a=-1;a<=1;a+=0.5) for(let b=-1;b<=1;b+=1){ if(!mineOpenAt(R, cx+ca*a*len/2 - sa*b*wid/2, cy+sa*a*len/2 + ca*b*wid/2)) return false; }
      return true;
    };
    const addRamp = (fromEnd, ln)=>{
      const idx0 = Math.max(4, path.length - Math.round(fromEnd/50));
      for(let k=0;k<14;k++){
        const i = clamp(idx0 + (k%2 ? -1 : 1)*Math.ceil(k/2), 4, path.length-5), a = path[i-3], b = path[i+3];
        if(!a || !b) continue;
        const ang = Math.atan2(b.y-a.y, b.x-a.x), c = path[i];
        if(openStrip(c.x, c.y, ang, ln, 130)){ R.ramps.push({x:c.x, y:c.y, ang, len:ln, wid:130}); return; }
      }
    };
    addRamp(260, 300); addRamp(760, 320); addRamp(1350, 320);
    // the final approach into the stairwell chamber
    R.ramps.push({x:R.stairs.x-150, y:R.stairs.y, ang:0, len:300, wid:150, grand:true});
  } finally { Math.random = saveRand; }
  R._trip = tb; deepMineCache = R;
  return R;
}
// a random open, unobstructed point on the floor (weighted by area), or null
function deepMineSpot(room, avoid, tries){
  const rects = room.floorRects; let tot = 0; for(const r of rects) tot += r.w*r.h;
  for(let k=0;k<(tries||60);k++){
    let a = Math.random()*tot, rc = rects[0]; for(const r of rects){ a -= r.w*r.h; if(a<=0){ rc = r; break; } }
    const x = rc.x+40+Math.random()*Math.max(1,rc.w-80), y = rc.y+40+Math.random()*Math.max(1,rc.h-80);
    if(!mineOpenAt(room,x,y)) continue;
    if(posBlockedByObstacles(x,y,34,room.obstacles)) continue;
    if(avoid && avoid.some(q=>dist({x,y},q)<q.r)) continue;
    return {x,y};
  }
  return null;
}
function drawMineRamp(rp, clock){
  const n = 6, L = rp.len/n, ca = Math.cos(rp.ang), sa = Math.sin(rp.ang), px = -sa, py = ca, hw = rp.wid/2;
  const corner = (s, side)=>toIso(rp.x + ca*s + px*side*hw, rp.y + sa*s + py*side*hw);
  ctx.save();
  for(let i=0;i<n;i++){
    const s0 = (i-n/2)*L, s1 = s0+L, sink = i*5, v = Math.round(86 - i*7);
    const a = corner(s0,-1), b = corner(s1,-1), c = corner(s1,1), d = corner(s0,1);
    ctx.fillStyle = 'rgb('+(v+10)+','+(v+2)+','+(v-10)+')';
    ctx.beginPath(); ctx.moveTo(a.x,a.y+sink); ctx.lineTo(b.x,b.y+sink); ctx.lineTo(c.x,c.y+sink); ctx.lineTo(d.x,d.y+sink); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(12,9,6,0.75)'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';   // the drop to the next step
    ctx.beginPath(); ctx.moveTo(b.x,b.y+sink); ctx.lineTo(c.x,c.y+sink); ctx.lineTo(c.x,c.y+sink+5); ctx.lineTo(b.x,b.y+sink+5); ctx.closePath(); ctx.fill();
    const m = toIso(rp.x + ca*(s0+L/2), rp.y + sa*(s0+L/2));   // a small chevron pointing downhill
    ctx.strokeStyle = 'rgba(232,196,74,'+(0.25+0.2*Math.sin((clock||0)*3 - i*0.8))+')'; ctx.lineWidth = 2;
    const dx = (corner(s1,0).x - corner(s0,0).x)*0.22, dy = (corner(s1,0).y - corner(s0,0).y)*0.22;
    ctx.beginPath(); ctx.moveTo(m.x-dx-dy*1.2, m.y+sink-dy+dx*0.6); ctx.lineTo(m.x+dx, m.y+sink+dy); ctx.lineTo(m.x-dx+dy*1.2, m.y+sink-dy-dx*0.6); ctx.stroke();
  }
  ctx.restore();
}
function drawMinerTent(x, y, col){
  const i = toIso(x,y); ctx.save(); ctx.translate(i.x,i.y);
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(0,5,50,17,0,0,7); ctx.fill();
  ctx.fillStyle = col; ctx.strokeStyle = '#1c150e'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-44,3); ctx.lineTo(0,-54); ctx.lineTo(44,3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.beginPath(); ctx.moveTo(0,-54); ctx.lineTo(44,3); ctx.lineTo(10,3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#100b07'; ctx.beginPath(); ctx.moveTo(-11,3); ctx.lineTo(0,-24); ctx.lineTo(11,3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a3622'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0,-54); ctx.lineTo(0,-62); ctx.stroke();
  ctx.restore();
}
function drawMinerFire(x, y, t){
  const i = toIso(x,y); ctx.save(); ctx.translate(i.x,i.y);
  const g2 = ctx.createRadialGradient(0,-6,4,0,-6,120); g2.addColorStop(0,'rgba(255,170,70,0.30)'); g2.addColorStop(1,'rgba(255,120,30,0)');
  ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(0,0,120,60,0,0,7); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0,3,20,7,0,0,7); ctx.fill();
  ctx.fillStyle = '#6a5a4a'; for(let k=0;k<7;k++){ const a = k*0.9; ctx.beginPath(); ctx.ellipse(Math.cos(a)*15, Math.sin(a)*6, 4.5, 3, 0, 0, 7); ctx.fill(); }
  ctx.strokeStyle = '#4a3220'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10,2); ctx.lineTo(8,-3); ctx.moveTo(-8,-3); ctx.lineTo(10,2); ctx.stroke();
  const fl = 1 + 0.18*Math.sin(t*11) + 0.1*Math.sin(t*17+1);
  ctx.fillStyle = '#e8641e'; ctx.beginPath(); ctx.moveTo(-8,0); ctx.quadraticCurveTo(-9,-14*fl,0,-26*fl); ctx.quadraticCurveTo(9,-14*fl,8,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffc85a'; ctx.beginPath(); ctx.moveTo(-4,0); ctx.quadraticCurveTo(-4,-8*fl,0,-15*fl); ctx.quadraticCurveTo(4,-8*fl,4,0); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawMinerCrate(x, y, c1){
  const i = toIso(x,y); ctx.save(); ctx.translate(i.x,i.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0,3,16,6,0,0,7); ctx.fill();
  ctx.fillStyle = c1; ctx.strokeStyle = '#1c150e'; ctx.lineWidth = 1.2; ctx.fillRect(-12,-18,24,19); ctx.strokeRect(-12,-18,24,19);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.moveTo(-12,-9); ctx.lineTo(12,-9); ctx.moveTo(0,-18); ctx.lineTo(0,1); ctx.stroke();
  ctx.restore();
}
const MINER_LOOK = [
  {name:'foreman', dx:34, dy:52, robe:'#7a5a2e', hood:'#4a3420', tool:'lantern', long:false},
  {name:'miner', dx:-62, dy:46, robe:'#5a4a3a', hood:'#3a2c20', tool:'shovel', long:false},
  {name:'miner', dx:96, dy:2, robe:'#4a5a48', hood:'#2e3a2c', tool:'shovel', long:false},
];
function setupMiners(g){
  const p = g.player, t = g.tower;
  g.miners = []; g.minerRun = null;
  if(!t || !t.isDeepMine || (p.minerQ||0) >= 3) return;
  MINER_LOOK.forEach((m,i)=> g.miners.push({x:t.camp.x+m.dx, y:t.camp.y+m.dy, id:20+i, robe:m.robe, hood:m.hood, tool:m.tool, foreman:i===0}));
}
function startMinerSwarm(g){
  const p = g.player, room = g.room; g.minerSwarmSpawned = true;
  const offscreen = (x,y)=>{ const io = toIso(x,y), cam = g.camera; if(!cam) return true; const sx = io.x-cam.x, sy = io.y-cam.y; return sx<-260 || sx>W+260 || sy<-260 || sy>H+260; };
  const spawnAt = (type, c, rad)=>{ for(let k=0;k<12;k++){ const pos = {x:c.x+rand(-rad,rad), y:c.y+rand(-rad,rad)}; if(!mineOpenAt(room,pos.x,pos.y) || posBlockedByObstacles(pos.x,pos.y,24,room.obstacles) || !offscreen(pos.x,pos.y)) continue;
      const e = spawnEnemy(g, type, pos); if(e){ e.aggroRange = 99999; e.leashRange = 99999; e.flowChase = true; e.minerSwarm = true; e.wanderRadius = 0; e.speed *= 1.25; if(type==='cavetroll') makeMagic(e, pickMods(2)); return e; } } return null; };
  const clusters = [];
  for(let tries=0; tries<200 && clusters.length<3; tries++){
    const c = deepMineSpot(room, null, 8); if(!c) continue;
    const d = dist(c,p); if(d<900 || d>1700 || !offscreen(c.x,c.y)) continue;
    if(clusters.some(q=>dist(q,c)<500)) continue;
    clusters.push(c);
  }
  if(!clusters.length){ for(let tries=0; tries<400 && clusters.length<2; tries++){ const c = deepMineSpot(room,null,8); if(c && offscreen(c.x,c.y)) clusters.push(c); } }
  // v490: the horde arrives as three groups over 15 seconds (was one big group at once), each from its own tunnel
  g.minerSpawnAt = spawnAt; g.minerClusters = clusters;
  g.minerWaves = [0, 7.5, 15]; g.minerWaveT = 0;
  minerSwarmTick(g, 0);
  showBigMsg('THE HORDE COMES', 'Goblins and cave trolls pour from the tunnels', 3.2);
  shakeScreen(g, 4, 0.5);
}
function minerSwarmTick(g, dt){
  if(!g.minerWaves || !g.minerWaves.length) return;
  g.minerWaveT = (g.minerWaveT||0) + dt;
  while(g.minerWaves.length && g.minerWaveT >= g.minerWaves[0]){
    const wi = 3 - g.minerWaves.length; g.minerWaves.shift();
    const cl = g.minerClusters || [], c = cl.length ? cl[wi % cl.length] : null, spawnAt = g.minerSpawnAt;
    if(!c || !spawnAt) continue;
    let nG = 0;
    for(let k=0;k<14 && nG<9;k++) if(spawnAt(k%4===3 ? 'goblinarcher' : 'goblin', c, 150)) nG++;
    for(let k=0;k<4;k++) if(spawnAt('cavetroll', c, 90)) break;
    if(wi>0) showMsg(wi===1 ? 'More goblins pour from the tunnels!' : 'The last of the horde arrives!', 2.2, '#ffb070');
  }
}
function makeMinerRing(p){
  let it = null;
  for(let i=0;i<90;i++){ const c = generateItem(Math.max(p.level, 34), 'rare', 'ring', null, p); if(!it) it = c; if(c && c.baseName==='Ruby Ring'){ it = c; break; } }
  const keep = it.affixes.filter(a=>!a.implicit && a.key!=='fireResistPct' && a.key!=='allResistPct').slice(0,2);
  it.affixes = [{key:'fireResistPct', label:'Fire Resist %', value:25, implicit:true}].concat(keep);
  it.rarity = 'rare'; it.name = "Prospector's Thanks";
  return it;
}
function talkMiner(){
  const g = game, p = g.player, q = p.minerQ||0;
  if(q===0){
    voicePlay('miner_offer'); showNpcText('Lost Miner', '"Thank the stars, a living face! We came down here looking for gold and got turned around in these tunnels. Something is stirring out there. Help us get out of here!"', 'I’ll help', ()=>{
      p.minerQ = 1;
      addQuestOnce(p, 'miners_lost', 'Lost in the Depths', 'Three lost miners are camped in the Mountain Depths. Hold off whatever is coming for them.', 1);
      showMsg('New quest: Lost in the Depths', 3.0); updateQuestBadge(); saveGame();
      startMinerSwarm(g);
    });
  } else if(q===1){
    voicePlay('miner_coming', {gap:5}); showNpcText('Lost Miner', '"Here they come! Don’t let them reach us!"', 'Close');
  } else if(q===2){
    voicePlay('miner_reward'); showNpcText('Lost Miner', '"You did it! Thanks. We’re gonna make a break for the exit now. Have this ring we found down here."', 'Take the ring', ()=>{
      const it = makeMinerRing(p); if(!giveRewardIfRoom(p, [it])) return; bagPulse();   // v493
      p.minerQ = 3;
      const qq = getQuest(p, 'miners_lost'); if(qq){ qq.status = 'complete'; qq.rewarded = true; qq.progress = qq.total; qq.desc = 'The miners made it out. They left you a ring.'; }
      gainXp(g, 500 + (g.depth||33)*20);
      showMsg('Reward: '+it.name, 3.2); updateQuestBadge(); saveGame();
      g.minerRun = g.miners.slice();
    });
  } else { voicePlay('miner_leaving', {gap:5}); showNpcText('Lost Miner', '"Go on, we’re heading out."', 'Close'); }
}
function updateDeepMine(g, dt){
  const p = g.player, t = g.tower;
  if(!g.miners) setupMiners(g);
  // v456: the last few stragglers that drift far away count as fled (they used to keep the quest from completing)
  minerSwarmTick(g, dt);
  if(p.minerQ===1 && g.minerSwarmSpawned){
    const left = g.enemies.filter(e=>e.minerSwarm && e.hp>0);
    const qq = getQuest(p, 'miners_lost'); if(qq && left.length) qq.desc = 'Hold off the horde coming for the miners. '+left.length+' remain.';
    if(left.length && left.length<=4) for(const e of left){ if(dist(e,p) > 650){ e._farT = (e._farT||0)+dt; if(e._farT > 5){ e.hp = 0; e.noReward = true; } } else e._farT = 0; }
  }
  // swarm cleared -> the foreman has something for you
  if(p.minerQ===1 && g.minerSwarmSpawned && !(g.minerWaves && g.minerWaves.length) && !g.enemies.some(e=>e.minerSwarm && e.hp>0)){
    p.minerQ = 2; const qq = getQuest(p, 'miners_lost'); if(qq) qq.desc = 'The horde is beaten. Talk to the miners.';
    showMsg('The horde is beaten. Talk to the miners.', 3.0); updateQuestBadge(); saveGame();
  }
  // the miners run for the exit UP and out of the mountain (the entrance), at your own move speed, and vanish there
  if(g.minerRun && g.minerRun.length){
    const sf = mineEntranceField(t), spd = (p.speed||BASE_SPEED), ex = t.entrance;
    for(let i=g.minerRun.length-1;i>=0;i--){
      const m = g.minerRun[i]; let tg = mineFlowTarget(sf, m.x, m.y);
      if(dist(m, ex) < 46 || !tg){ g.miners = g.miners.filter(x=>x!==m); g.minerRun.splice(i,1); g.particles.push({type:'burst', x:m.x, y:m.y, t:0.4, max:0.4, color:'#caa66a'}); continue; }
      if(dist(m, ex) < 160) tg = ex;
      const a = Math.atan2(tg.y-m.y, tg.x-m.x); m.x += Math.cos(a)*spd*dt; m.y += Math.sin(a)*spd*dt;
    }
  }
}
function deepStairsDown(){ const g = game; if(g.tower && g.tower.deep && g.tower.deep < DEEP_FLOORS) enterDeep(g.tower.deep+1); }
function deepStairsUp(){ const g = game; if(g.tower && g.tower.deep && g.tower.deep > 1) enterDeep(g.tower.deep-1, {fromBelow:true}); }
function colossusAftermath(g){
  const t = g.tower, p = g.player;
  if(!t.chestSpot || t.clearPortal) return;
  t.clearPortal = {x:t.chestSpot.x-40, y:t.chestSpot.y+140, r:24, toTown:true};
  if(!p.heartChestLooted) g.chest = {x:t.chestSpot.x, y:t.chestSpot.y, r:24, opened:false, heartChest:true};
}
function openHeartChest(g){
  const p = g.player;
  g.chest.opened = true; p.heartChestLooted = true;
  const it = classRewardItem(p, Math.max(p.level, g.depth), 'reward');
  const it2 = classRewardItem(p, Math.max(p.level, g.depth), 'rare');
  forceAddToBag(p, it); forceAddToBag(p, it2);
  p.gold += 900;
  showMsg('Chest: '+it.name+' + '+it2.name+' + gold', 2.6);
  g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.5, max:0.5, color:'#ffb060'});
  bagPulse(); saveGame();
}
// v490: the Heart of the Mountain scorches -- 0.6% of max life per second as fire (fire resistance helps), like the Marsh Pool's poison
const HEART_HEAT_PCT = 0.006;
function updateDeep(g, dt){
  const p = g.player, t = g.tower;
  if(t && t.bossFloor && !g.over && p.hp>0){
    p.hp -= p.maxHp*HEART_HEAT_PCT*(1-elementResist(p,'fire')/100)*dt; g.heatT = (g.heatT||0) + dt;
    if(!g._heatWarned){ g._heatWarned = true; showMsg('The heat is unbearable -- fire resistance will help here.', 3.4, '#ffb060'); }
    if(p.hp<=0){ p.hp = 0; endGame(g); }
  }
  updatePortalChoice(false);
  if(g.deepStore) g.deepStore[t.floor] = g.enemies;
  let dk = null;
  if(dist(p, t.entrance) < t.entrance.r + p.r + 22) dk = t.floor===1 ? 'depthsToPass' : 'deepUp';
  else if(t.stairs && dist(p, t.stairs) < t.stairs.r + p.r + 22) dk = 'deepDown';
  else if(t.clearPortal && dist(p, t.clearPortal) < t.clearPortal.r + p.r + 22) dk = 'toTownFromTower';
  else if(t.waypoint && dist(p, t.waypoint) < t.waypoint.r + p.r + 24){ dk = 'waypointDeep'; }
  if(t.isDeepMine){
    updateDeepMine(g, dt);
    if(!dk && g.miners && !g.minerRun && g.miners.some(m=>dist(p,m) < 80)) dk = 'depthsMiner';
  }
  updateInteractPrompt(dk);
  if(g.chest && !g.chest.opened && g.chest.heartChest && dist(g.chest,p) < g.chest.r+p.r) openHeartChest(g);
  // golem death-blasts: a telegraphed circle, then 50% fire / 50% physical damage
  if(g.blasts) for(let i=g.blasts.length-1;i>=0;i--){
    const b = g.blasts[i]; b.t -= dt;
    if(b.t<=0){
      const half = b.dmg*0.5;
      if(dist(p,b) < b.r + p.r){
        playerDamage(g, half, {dmgType:'fire', hp:0, x:b.x, y:b.y, r:0});
        playerDamage(g, half, {dmgType:'normal', hp:0, x:b.x, y:b.y, r:0});
      }
      if(g.followers) for(const f of g.followers) if(dist(f,b) < b.r + f.r) applyFollowerDamage(g, f, b.dmg, {dmgType:'normal', hp:0, x:b.x, y:b.y, r:0});
      g.particles.push({type:'burst', x:b.x, y:b.y, t:0.5, max:0.5, color:'#ff9a40'});
      g.particles.push({type:'burst', x:b.x, y:b.y, t:0.4, max:0.4, color:'#9a8e84'});
      g.particles.push({type:'ring', x:b.x, y:b.y, t:0.5, max:0.5, r:b.r, color:'#ff7a2a'});
      shakeScreen(g, 5, 0.25);
      g.blasts.splice(i,1);
    }
  }
  // lava: the heart's rising lava and any open lava (never walkable -- obstacles -- but the arena's tide is not)
  if(t.deep===3 && !g.over && p.hp>0 && t.lavaAt(p.x,p.y) && !t.waters.some(o=>p.x>o.x&&p.x<o.x+o.w&&p.y>o.y&&p.y<o.y+o.h)){
    p.hp -= p.maxHp*0.07*(1-elementResist(p,'fire')/100)*dt;
    g.lavaT = (g.lavaT||0) + dt;
    if(p.hp<=0){ p.hp=0; endGame(g); }
  }
}
function walkerDeath(g, e){
  const R = 150, dm = teleDmg(e, 1.1), src = {dmgType:'poison', hp:0, x:e.x, y:e.y, r:0};
  if(dist(g.player,e) < R+g.player.r) playerDamage(g, dm, src);
  if(g.followers) for(const f of g.followers) if(dist(f,e) < R+f.r) applyFollowerDamage(g, f, dm, src);
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:R, color:'#8fe05a'});
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.4, max:0.4, r:R*0.6, color:'#c8ff7a'});
  for(let i=0;i<10;i++) g.particles.push({type:'burst', x:e.x+rand(-R*0.7,R*0.7), y:e.y+rand(-R*0.7,R*0.7), t:0.5, max:0.5, color:i%2?'#6aa83a':'#a8e060'});
  shakeScreen(g, 5, 0.25);
  for(let i=0;i<3;i++){
    const a = Math.PI*2*i/3 + Math.random()*0.8, room = g.room;
    const pos = (room && room.obstacles && typeof subFreeSpot==='function' && room.subzone) ? (subFreeSpot(room, e.x+Math.cos(a)*50-30, e.x+Math.cos(a)*50+30, e.y+Math.sin(a)*50-30, e.y+Math.sin(a)*50+30, null, 12) || {x:e.x,y:e.y}) : {x:e.x+Math.cos(a)*40, y:e.y+Math.sin(a)*40};
    const sn = spawnEnemy(g, 'poisonsnake', pos); if(sn){ sn.aggroRange = 900; sn.leashRange = 2000; sn.noReward = e.noReward; if(g.tower && g.tower.kpArea===9) brScaleEnemy(sn, g.tower.bf); }
  }
  showMsg('The walker bursts — snakes pour out!', 1.6, '#a8e060');
}
function golemDeath(g, e){
  g.blasts = g.blasts || [];
  g.blasts.push({x:e.x, y:e.y, t:1.3, max:1.3, r:140, dmg:teleDmg(e, 1.3)});
  showMsg('The golem is about to explode!', 1.2, '#ff9a50');
}
function drawBeetleTelegraph(e){
  if(!(e.tState==='tele' && e.tPt)) return;
  const frac = clamp(1-e.tT/BEETLE_LEAP_TELE,0,1), iso = toIso(e.tPt.x,e.tPt.y);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle='rgba(255,140,60,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.2;
  ctx.beginPath(); ctx.arc(0,0,BEETLE_LEAP_R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
  ctx.fillStyle='rgba(255,100,30,'+(0.10+frac*0.28)+')'; ctx.beginPath(); ctx.arc(0,0,BEETLE_LEAP_R*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill();
  ctx.restore();
}
// a faint red-hot wash over the fire floors, stronger in the Heart
function drawEmberOverlay(g){
  const t = g.clock||0, k = g.room.deep===3 ? 1.25 : 1;
  const vg = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.78);
  vg.addColorStop(0,'rgba(120,20,0,0)'); vg.addColorStop(1,'rgba(150,30,0,'+((0.24+0.04*Math.sin(t*1.6))*k)+')');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = 'rgba(255,170,70,0.5)';
  for(let i=0;i<26;i++){ const x = ((i*173.3)%W)+Math.sin(t*0.8+i)*14, y = H - (((i*89.7) + t*(22+(i%4)*9)) % (H+30)); ctx.beginPath(); ctx.arc(x, y, 1.2+(i%3)*0.6, 0, 7); ctx.fill(); }
}
function drawBlasts(g){
  if(!g.blasts || !g.blasts.length) return;
  ctx.save();
  for(const b of g.blasts){
    const f = clamp(1-b.t/b.max,0,1), iso = toIso(b.x,b.y), R = b.r*ISO_KX*Math.SQRT2;
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,'+(130+Math.round(80*f))+',60,'+(0.55+f*0.45)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,R,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,100,30,'+(0.10+f*0.30)+')'; ctx.beginPath(); ctx.arc(0,0,R*f,0,7); ctx.fill();
    ctx.fillStyle='rgba(120,110,104,'+(0.10+f*0.20)+')';
    for(let k=0;k<8;k++){ const a=k*0.785+f*2, rr=R*(0.35+0.5*((k*37)%10)/10); ctx.beginPath(); ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr); ctx.lineTo(Math.cos(a+0.4)*(rr+9),Math.sin(a+0.4)*(rr+9)); ctx.lineTo(Math.cos(a-0.3)*(rr+7),Math.sin(a-0.3)*(rr+7)); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}
// ---- painting ----
function drawDeepFloor(room, cam){
  if(room.deep===1){ drawFloor(room, cam); for(const rp of (room.ramps||[])) drawMineRamp(rp, (game&&game.clock)||0); drawWalls(room); return; }
  const TS = 46, clk = (game&&game.clock)||0, heart = room.deep===3;
  for(let wx=-TS; wx<=room.w+TS; wx+=TS){
    for(let wy=-TS; wy<=room.h+TS; wy+=TS){
      const iso = toIso(wx,wy), sx = iso.x-cam.x, sy = iso.y-cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS), checker = ((ix+iy)%2+2)%2, hh = tileHash(ix,iy);
      const inside = wx>=0 && wy>=0 && wx<=room.w && wy<=room.h;
      if(room.organicDeep && !mineOpenAt(room, wx, wy)){ ctx.fillStyle = '#120a0b'; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); continue; }
      const lava = inside && room.lavaAt(wx,wy);
      let fill;
      if(lava){
        const shim = (Math.floor((wx+wy)/TS*0.5 + clk*0.8) % 2 + 2) % 2;
        fill = (checker^shim) ? '#e2561a' : '#c8420f';
        ctx.fillStyle = fill; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hh>0.8){ ctx.fillStyle='rgba(255,210,90,'+(0.35+0.3*Math.sin(clk*2.2+hh*50))+')'; ctx.beginPath(); ctx.ellipse(iso.x+(hh-0.9)*140, iso.y, 8, 3, 0, 0, 7); ctx.fill(); }
      } else {
        const nearL = inside && (room.lavaAt(wx+TS,wy)||room.lavaAt(wx-TS,wy)||room.lavaAt(wx,wy+TS)||room.lavaAt(wx,wy-TS));
        const arena = heart && heartEllD(wx, wy) < 1.05;
        if(nearL) fill = checker ? '#4a2a22' : '#432620';
        else if(arena){ const rr = Math.hypot(wx-HEART_CX, wy-HEART_CY), ring = Math.abs(((rr/520)%1)-0.5)<0.05; fill = ring ? '#3c2a2c' : (checker ? '#2c2428' : '#272024'); }
        else fill = checker ? '#2c2428' : '#262024';
        if(hh>0.93) fill = '#1c161a';
        ctx.fillStyle = fill; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hh>0.86 && hh<0.93){   // glowing crack
          ctx.strokeStyle='rgba(255,120,40,'+(0.45+0.25*Math.sin(clk*1.6+hh*40))+')'; ctx.lineWidth=1.6;
          ctx.beginPath(); ctx.moveTo(iso.x-14, iso.y-2); ctx.lineTo(iso.x-3, iso.y+3); ctx.lineTo(iso.x+5, iso.y-1); ctx.lineTo(iso.x+16, iso.y+4); ctx.stroke();
        }
        if(nearL){ ctx.fillStyle='rgba(255,110,30,0.10)'; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); }
      }
    }
  }
  drawWalls(room);
}

