// ---------------- Dark Crypt (v73: the real dungeon) ----------------
// The final zone of this 6-batch content expansion (Dark Forest -> Sunlit
// Plains -> {Lighthouse Tower, Lakeside Ruins, Cursed Cemetery} -> Dark
// Crypt), replacing the v72 stub in place. A FIXED, hand-laid-out
// corridor-based dungeon -- not a randomly generated, depth-scaled
// genRoom() Mine floor, since this is a one-off destination rather than an
// endless dungeon -- built the same way genRoom() builds a Mine floor: a
// chain of rectangular rooms connected by tunnelRects() corridors, then a
// coarse-grid pass carves 'mazeWall' rock obstacles everywhere that
// borders a walkable floor cell. This reuses every one of the Mine's own
// rendering/collision primitives (drawFloor/drawWalls/drawBlock,
// room.obstacles, generic wall collision, and spawnEnemy's own
// room.rooms-targeting) completely unchanged.
//
// Layout, bottom (entrance, arriving from the Cursed Cemetery tomb) to top
// (the vampire-guarded chest room): entranceRoom -> room1 -> room2 -> room3
// -> exitRoom, snaking left-right up the map -- a linear-ish crawl with a
// clearly defined "end", per the brief. room1/room2/room3 hold the general
// Skeleton/Zombie/Spider population (spawnEnemy's existing room.rooms
// targeting already spreads non-'boss' spawns across exactly this array,
// with no changes needed there); exitRoom is the vampire chamber holding
// the fixed 5-Vampire pack and the permanent Ruins Map chest.
const DARKCRYPT_W = 8400, DARKCRYPT_H = 9800;  // v503: about 2.7x the old area (was 3600x4200); v514: bigger again (5 x 7 chambers) with a winding route
// Identical coarse-grid carve genRoom() uses for the Mine's own floors --
// duplicated here (not extracted into a shared helper) to avoid touching
// genRoom()'s own tested code path at all.
function darkCryptCarveObstacles(floorRects, w, h){
  const CELL = 50;
  const cols = Math.ceil(w/CELL), rows = Math.ceil(h/CELL);
  const isFloor = new Uint8Array(cols*rows);
  const insideAny = (x,y)=> floorRects.some(r=> x>r.x+6 && x<r.x+r.w-6 && y>r.y+6 && y<r.y+r.h-6);
  for(let iy=0; iy<rows; iy++){
    for(let ix=0; ix<cols; ix++){
      const cx = ix*CELL+CELL/2, cy = iy*CELL+CELL/2;
      if(insideAny(cx,cy)) isFloor[iy*cols+ix] = 1;
    }
  }
  const obstacles = [];
  for(let iy=0; iy<rows; iy++){
    for(let ix=0; ix<cols; ix++){
      if(isFloor[iy*cols+ix]) continue;
      let bordersFloor = false;
      for(let dy=-1; dy<=1 && !bordersFloor; dy++){
        for(let dx=-1; dx<=1; dx++){
          const nx=ix+dx, ny=iy+dy;
          if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
          if(isFloor[ny*cols+nx]){ bordersFloor = true; break; }
        }
      }
      if(bordersFloor) obstacles.push({x:ix*CELL, y:iy*CELL, w:CELL, h:CELL, mazeWall:true});
    }
  }
  return obstacles;
}
// Ambient torch/crystal light sources scattered along the corridors and in
// every room -- see render()'s g.scene==='darkcrypt' darkness-overlay pass
// (DARKCRYPT_TORCH_LIGHT_R). Placed along each tunnel segment's centerline
// at ~240px intervals, nudged perpendicular so they read as wall-mounted
// rather than sitting in the exact walkable middle of the corridor, plus a
// couple in every room's corners and a small cluster in the vampire chamber.
function darkCryptLights(sequence, mainRooms, exitRoom, entranceRoom){
  const lights = [];
  for(let i=0;i<sequence.length-1;i++){
    const a = rectCenter(sequence[i]), b = rectCenter(sequence[i+1]);
    const segLen = dist(a,b);
    const steps = Math.max(1, Math.round(segLen/240));
    const ang = Math.atan2(b.y-a.y, b.x-a.x) + Math.PI/2;
    for(let s=1; s<steps; s++){
      const t = s/steps;
      const side = (s%2===0) ? 1 : -1;
      lights.push({x:a.x+(b.x-a.x)*t+Math.cos(ang)*46*side, y:a.y+(b.y-a.y)*t+Math.sin(ang)*46*side});
    }
  }
  for(const r of mainRooms){
    lights.push({x:r.x+30, y:r.y+30});
    lights.push({x:r.x+r.w-30, y:r.y+r.h-30});
  }
  lights.push({x:entranceRoom.x+entranceRoom.w-40, y:entranceRoom.y+entranceRoom.h-40});
  lights.push({x:exitRoom.x+40, y:exitRoom.y+40});
  lights.push({x:exitRoom.x+exitRoom.w-40, y:exitRoom.y+40});
  lights.push({x:exitRoom.x+exitRoom.w/2, y:exitRoom.y+exitRoom.h-40});
  return lights;
}
function makeDarkCrypt(){
  // v503: a much larger, freshly rolled crypt every visit. Chambers sit on a jittered 4 x 5 grid (a few cells stay empty), are
  // joined by a random minimum spanning tree of tunnels plus a few loops, so the dead ends and side vaults are real. The way in
  // is at the bottom, the way on is always the same: the hall of wardens, its north door, the Defiler's Tomb.
  const w = DARKCRYPT_W, h = DARKCRYPT_H, CORR_W = 150;
  const ri = (a,b)=>Math.round(rand(a,b));
  const exitRoom     = {x:ri(300, w-1250), y:700, w:900, h:560};   // the hall before the tomb, guarded by crypt wardens
  let tombRoom = null;
  for(let t=0; t<40 && !tombRoom; t++){ const tr = {x:ri(80, w-980), y:50, w:900, h:600}; if(!rectsOverlap(tr, exitRoom, 40)) tombRoom = tr; }
  if(!tombRoom) tombRoom = {x:exitRoom.x < w/2 ? w-980 : 80, y:50, w:900, h:600};   // sealed: reached only through the hall's north door
  const entranceRoom = {x:ri(400, w-720), y:h-420, w:320, h:300};
  const COLS = 5, ROWS = 7, gx0 = 220, gx1 = w-220, gy0 = 1550, gy1 = h-1050, cw = (gx1-gx0)/COLS, chh = (gy1-gy0)/ROWS;
  const forceTop = ri(0,COLS-1), forceBot = ri(0,COLS-1), rooms = [];
  for(let cy=0; cy<ROWS; cy++) for(let cx=0; cx<COLS; cx++){
    if(!((cy===0 && cx===forceTop) || (cy===ROWS-1 && cx===forceBot)) && Math.random()<0.18) continue;
    const rw = ri(520,880), rh = ri(420,640);
    rooms.push({x:Math.round(gx0+cx*cw+rand(40, cw-rw-40)), y:Math.round(gy0+cy*chh+rand(30, chh-rh-30)), w:rw, h:rh, cx, cy});
  }
  const cen = rooms.map(rectCenter);
  const edges = [], key = (a,b)=> a<b ? a+','+b : b+','+a, have = new Set();
  const link = (a,b)=>{ if(have.has(key(a,b))) return false; have.add(key(a,b)); edges.push([a,b]); return true; };
  // random spanning tree: shortest links first, each distance fuzzed so no two crypts come out alike
  const pairs = [];
  for(let a=0;a<rooms.length;a++) for(let b=a+1;b<rooms.length;b++){ const d = dist(cen[a],cen[b]); if(d<3200) pairs.push({a,b,d,k:d*rand(0.8,1.25)}); }
  pairs.sort((x,y)=>x.k-y.k);
  const par = rooms.map((_,i)=>i), find = i=> par[i]===i ? i : (par[i]=find(par[i]));
  // v514: a randomised depth-first walk over neighbouring chambers (instead of shortest links) makes one long winding route with dead-end branches
  { const at = {}; rooms.forEach((r,i)=>{ at[r.cx+','+r.cy] = i; });
    const ec = rectCenter(entranceRoom); let start = -1, bd0 = 1e9;
    rooms.forEach((r,i)=>{ if(r.cy===ROWS-1){ const d = dist(cen[i], ec); if(d<bd0){ bd0 = d; start = i; } } });
    const seen = new Set([start]), stack = [start];
    while(stack.length){
      const c = stack[stack.length-1], r = rooms[c];
      const nb = [[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>at[(r.cx+dx)+','+(r.cy+dy)]).filter(n=>n!=null && !seen.has(n));
      if(!nb.length){ stack.pop(); continue; }
      const n = nb[Math.floor(Math.random()*nb.length)]; seen.add(n); link(c,n); par[find(n)] = find(c); stack.push(n);
    } }
  for(const pr of pairs){ const ra = find(pr.a), rb = find(pr.b); if(ra!==rb){ par[ra] = rb; link(pr.a, pr.b); } }
  for(let a=1;a<rooms.length;a++) if(find(a)!==find(0)){ let bd = 1e9, bb = 0; for(let b=0;b<rooms.length;b++) if(find(b)===find(0)){ const d = dist(cen[a],cen[b]); if(d<bd){ bd = d; bb = b; } } par[find(a)] = find(0); link(a, bb); }
  for(const pr of pairs){ if(edges.length >= rooms.length-1 + 2) break; if(pr.d<2100 && Math.random()<0.05) link(pr.a, pr.b); }   // v514: at most one or two loops (shortcuts) now
  const nearestIn = (pt, list)=>{ let bi = list[0], bd = 1e9; for(const i of list){ const d = dist(pt, cen[i]); if(d<bd){ bd = d; bi = i; } } return bi; };
  const botRooms = rooms.map((r,i)=>r.cy===ROWS-1 ? i : -1).filter(i=>i>=0), topRooms = rooms.map((r,i)=>r.cy===0 ? i : -1).filter(i=>i>=0);
  const inRoom = nearestIn(rectCenter(entranceRoom), botRooms), outRoom = nearestIn(rectCenter(exitRoom), topRooms);
  // the shortest chain of chambers from the entrance to the hall is the "main path"
  const adj = rooms.map(()=>[]); for(const [a,b] of edges){ adj[a].push(b); adj[b].push(a); }
  const prev = new Array(rooms.length).fill(-2); prev[inRoom] = -1; const qu = [inRoom];
  for(let qi=0; qi<qu.length; qi++) for(const n of adj[qu[qi]]) if(prev[n]===-2){ prev[n] = qu[qi]; qu.push(n); }
  const pathIdx = []; for(let c=outRoom; c>=0; c=prev[c]) pathIdx.unshift(c);
  const mainRooms = pathIdx.map(i=>rooms[i]), sideRooms = rooms.filter((r,i)=>pathIdx.indexOf(i)<0);
  const floorRects = [entranceRoom, ...rooms, exitRoom], tunnels = [];
  const addTunnel = (a,b,wd)=>{ const sw = Math.random()<0.5, r = sw ? tunnelRects(b.x,b.y,a.x,a.y,wd) : tunnelRects(a.x,a.y,b.x,b.y,wd); floorRects.push(...r); tunnels.push({a,b,rects:r}); };
  for(const [a,b] of edges) addTunnel(cen[a], cen[b], CORR_W);
  addTunnel(rectCenter(entranceRoom), cen[inRoom], CORR_W);
  addTunnel(cen[outRoom], rectCenter(exitRoom), CORR_W);
  floorRects.push(tombRoom);
  const obstacles = darkCryptCarveObstacles(floorRects, w, h);
  // Entry/exit gate back to Cursed Cemetery -- same "the entry point IS the
  // way back out" convention every other zone-transition gate follows. The
  // player lands just north of it (see enterDarkCrypt), inside entranceRoom.
  const cemeteryGate = {x:entranceRoom.x+entranceRoom.w/2, y:entranceRoom.y+220, r:34};
  // A dedicated permanent waypoint near the entrance -- same shared
  // mechanism/art/Teleport-menu entry every other zone's waypoint uses.
  const waypoint = {x:entranceRoom.x+60, y:entranceRoom.y+60, r:22};
  // The permanent chest at the far end, guarded by the vampire pack -- see
  // enterDarkCrypt/update()'s g.scene==='darkcrypt' branch for its one-shot
  // p.darkCryptChestLooted handling (a PLAYER-level flag, unlike every
  // other chest's per-visit g.chest.opened, so it can never be looted a
  // second time even across visits/re-entries).
  // v225: a big crypt at the far end (no chest until its occupant is destroyed)
  const tcx = tombRoom.x+tombRoom.w/2, tcy = tombRoom.y+110;   // v310: crypt against the far wall, a long way from the door
  const tomb = {x:tcx, y:tcy, state:'open', t:0, rect:{x:tcx-110, y:tcy-60, w:220, h:120}};
  obstacles.push({x:tomb.rect.x, y:tomb.rect.y, w:tomb.rect.w, h:tomb.rect.h, isProp:true, isCrypt:true});
  const chestSpot = {x:tcx, y:tombRoom.y+tombRoom.h-190, r:20};
  // v310: the doorway pair -- one in the hall's north wall, one at the south end of the tomb
  const hallDoor = {x:exitRoom.x+exitRoom.w/2, y:exitRoom.y+24, r:34};
  const tombDoor = {x:tombRoom.x+tombRoom.w/2, y:tombRoom.y+tombRoom.h-24, r:34};
  // v516: a chest in every dead-end side room (a chamber with a single tunnel that is not on the way to the hall); marked on the map
  const sideChests = [];
  rooms.forEach((r,i)=>{ if(adj[i].length===1 && pathIdx.indexOf(i)<0){ const c = rectCenter(r); sideChests.push({x:Math.round(c.x), y:Math.round(c.y), r:22, opened:false}); } });
  // v519: The Silver Locket -- while that quest is open, ONE random dead-end chest holds the locket (a different chest each visit until it is found)
  { const lq = (typeof game!=='undefined' && game && game.player) ? getQuest(game.player, 'silver_locket') : null;
    if(lq && lq.status==='active' && lq.progress<lq.total){
      if(!sideChests.length){ const sr = rooms.find((r,i)=>pathIdx.indexOf(i)<0) || rooms[0]; if(sr){ const c = rectCenter(sr); sideChests.push({x:Math.round(c.x), y:Math.round(c.y), r:22, opened:false}); } }
      if(sideChests.length) sideChests[Math.floor(Math.random()*sideChests.length)].locket = true;
    } }
  const lights = []; // (v120) no candle/torch lights: the player's own light is the only illumination
  return { w, h, obstacles, floorRects, rooms:rooms, mainPath:mainRooms, tunnels, entranceRoom, exitRoom, tombRoom, hallDoor, tombDoor, bossSpawned:false, bossDone:false,
    cemeteryGate, waypoint, chestSpot, sideChests, lights, tomb, chestShown:false, wraithDone:false, chestDelay:0,
    // v240: invisible respawn -- ONLY while the Wraith Lord fight is live, 'respawn in region' puts you in the chamber before the boss room
    cpRoom:rooms[outRoom], respawnPoint:{x:cen[outRoom].x, y:cen[outRoom].y} };
}
// General population -- Skeleton/Zombie/Spider spread across room1/room2/
// room3 via spawnEnemy's existing room.rooms targeting (any non-'boss' type
// with room.rooms present lands in a random one of them, unchanged) --
// roughly the same per-visit density as Spider Lair's own 16-spider
// population. Plus the fixed 5-Vampire pack, placed directly and
// exclusively inside exitRoom (never mixed into the general spawn pool).
// Repopulates every visit, same as every other repeatable zone's packs
// (Cursed Cemetery excepted, which is a one-time-clear checkpoint zone) --
// only the chest itself (p.darkCryptChestLooted) is a permanent one-shot.
// v536: crypt bats -- quick little fliers in swarms, half a bat's life and a fifth of its bite, no fire
function cryptBat(g, x, y){
  const b = spawnEnemy(g, 'firebat', {x, y}); if(!b) return null;
  b.reg = true; b.color = '#4a3c56'; b.dmgType = null; b.dmgSplit = null; b.cryptBat = true;
  b.hp = b.maxHp = Math.max(1, Math.round(b.maxHp*0.5)); b.dmg *= 0.2;
  return b;
}
function spawnDarkCryptPopulation(g){
  // v503: the bigger crypt is stocked in loose packs -- every chamber holds one or two packs, the tunnels have pickets of skeletons,
  // and the vaults off the main path are a little fuller. Packs keep their distance from each other and from the entrance.
  const C = g.crypt, e0 = rectCenter(C.entranceRoom), centers = [];
  const okSpot = (x,y,gap)=> Math.hypot(x-e0.x, y-e0.y) > 520 && !posBlockedByObstacles(x, y, 20, C.obstacles) && centers.every(c=>Math.hypot(c.x-x, c.y-y) > gap);
  const pack = (x, y, type, n, spread)=>{ centers.push({x,y}); for(let k=0;k<n;k++){ const px = x+rand(-spread,spread), py = y+rand(-spread,spread); if(!posBlockedByObstacles(px, py, 18, C.obstacles)) spawnEnemy(g, type, {x:px, y:py}); } };
  // v536: smaller packs (3-4) spread over more spots instead of big 5-packs plus a density top-up, and bat swarms
  const kinds = ['skeleton','skeleton','zombie','spider'];
  const packSize = t=> t==='skeleton' ? 3+Math.floor(Math.random()*2) : 3;
  const roomSpot = (r, gap)=>{ for(let t=0;t<14;t++){ const x = rand(r.x+110, r.x+r.w-110), y = rand(r.y+110, r.y+r.h-110); if(okSpot(x, y, gap)) return {x, y}; } return null; };
  for(const r of C.rooms){
    const side = !(C.mainPath && C.mainPath.indexOf(r) >= 0), npk = 2 + (side && Math.random()<0.4 ? 1 : 0);
    for(let k=0;k<npk;k++){
      const type = kinds[Math.floor(Math.random()*kinds.length)], s = roomSpot(r, 260);
      if(s) pack(s.x, s.y, type, packSize(type), 60);
    }
    if(Math.random() < 0.5){ const s = roomSpot(r, 200); if(s){ centers.push(s); for(let k=0, n=6+Math.floor(Math.random()*3); k<n; k++) cryptBat(g, s.x+rand(-60,60), s.y+rand(-60,60)); } }
  }
  // pickets along the tunnels: a pair of skeletons about every 700px of corridor
  for(const tn of (C.tunnels||[])){
    for(const r of tn.rects){
      const horiz = r.w >= r.h, L = horiz ? r.w : r.h, n = Math.floor(L/700);
      for(let k=0;k<n;k++){
        const t = (k+0.5+rand(-0.25,0.25))/n, x = horiz ? r.x+r.w*t : r.x+r.w/2, y = horiz ? r.y+r.h/2 : r.y+r.h*t;
        if(C.rooms.concat([C.entranceRoom, C.exitRoom]).some(q=> x>q.x-60 && x<q.x+q.w+60 && y>q.y-60 && y<q.y+q.h+60)) continue;
        if(okSpot(x, y, 330)) pack(x, y, Math.random()<0.25 ? 'spider' : 'skeleton', 2, 40);
      }
    }
  }
  // v536: the first pack on the way in is led by the Map Bearer -- a big skeleton brute ringed in gold with three skeletons
  { const a1 = rectCenter(C.mainPath[0]), er = C.entranceRoom;
    let bx = (e0.x+a1.x)/2, by = (e0.y+a1.y)/2;
    const tn = (C.tunnels||[]).find(q=>Math.abs(q.a.x-e0.x)<1 && Math.abs(q.a.y-e0.y)<1);   // the tunnel out of the entrance room
    const pts = [];
    if(tn) for(const r of tn.rects){ const horiz = r.w >= r.h, L = horiz ? r.w : r.h; for(let d=20; d<L; d+=40) pts.push(horiz ? {x:r.x+d, y:r.y+r.h/2} : {x:r.x+r.w/2, y:r.y+d}); }
    const outside = q=> !(q.x>er.x-180 && q.x<er.x+er.w+180 && q.y>er.y-180 && q.y<er.y+er.h+180);
    const pick = pts.filter(q=>outside(q) && !posBlockedByObstacles(q.x, q.y, 30, C.obstacles)).sort((u,v)=>Math.hypot(u.x-e0.x,u.y-e0.y)-Math.hypot(v.x-e0.x,v.y-e0.y))[0];
    if(pick){ bx = pick.x; by = pick.y; }
    const b = spawnEnemy(g, 'skeletonbrute', {x:bx, y:by});
    if(b){ b.r = Math.round(b.r*1.35); b.maxHp = Math.round(b.maxHp*2.2); b.hp = b.maxHp; b.dmg *= 1.1; b.mapCarrier = true; b.mapHolder = true; b.xpMul = Math.max(b.xpMul||1, 2.5); b.cryptBearer = true; }
    for(let k=0;k<3;k++){ const a = k/3*Math.PI*2, x = bx+Math.cos(a)*55, y = by+Math.sin(a)*55; if(!posBlockedByObstacles(x, y, 18, C.obstacles)) spawnEnemy(g, 'skeleton', {x, y}); } }
  // v490: the entrance / waypoint room is a safe room -- anything that rolled a spot in it goes
  { const er = g.crypt.entranceRoom, m = 140;
    g.enemies = g.enemies.filter(e=>e.cryptBearer || !(e.x>er.x-m && e.x<er.x+er.w+m && e.y>er.y-m && e.y<er.y+er.h+m)); }
  // v321: the vampire pack in the chamber before the boss hall is gone
  // v275: elite skeleton wardens guard the hall before the Defiler's Tomb
  { const hr = g.crypt.exitRoom;
    const wMods = pickMods(g.depth>=30 ? 2 : 1);   // v321: the hall's brutes are one magic pack sharing the same mods
    for(let i=0;i<4;i++){ const b = spawnEnemy(g, 'skeletonbrute', {x:rand(hr.x+90, hr.x+hr.w-90), y:rand(hr.y+90, hr.y+hr.h-90)}); if(b) makeMagic(b, wMods); } }
}
function enterDarkCrypt(opts){
  opts = opts || {};
  const g = game, p = g.player;
  g.scene = 'darkcrypt';
  g.crypt = makeDarkCrypt();
  g.room = g.crypt;
  if(p.defilerSlain && !p.inscriptionTaken){ g.crypt.bossSpawned = true; g.crypt.bossDone = true; }   // v489: once the inscription is taken, the Graverobber rises again each visit
  // Fixed area level (static difficulty)
  g.depth = 19;
  // Waypoint rework: teleporting in via the Teleport menu (opts.atWaypoint)
  // lands the player AT this zone's own waypoint marker, not the generic
  // gate entrance -- see openTeleportMenu's teleportDarkCryptBtn.
  // Waypoint rework: reachedDarkCrypt is no longer set on mere zone entry
  // -- it's now set when the player walks up to this zone's own waypoint
  // marker (see the nearCryptWaypoint proximity check in update(), which
  // calls discoverWaypoint).
  if(opts.atWaypoint){
    g.player.x = g.crypt.waypoint.x; g.player.y = g.crypt.waypoint.y + 30;
  } else {
    g.player.x = g.crypt.cemeteryGate.x; g.player.y = g.crypt.cemeteryGate.y - 80;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Dark Crypt', 1.4);
  spawnDarkCryptPopulation(g);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}


