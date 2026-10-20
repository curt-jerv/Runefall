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
const DARKCRYPT_W = 3600, DARKCRYPT_H = 4200;  // v321: roughly half the old length (3 chambers instead of 6; was 3600x5700)
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
  const w = DARKCRYPT_W, h = DARKCRYPT_H, CORR_W = 140;
  // v467: a fresh crypt every visit -- the entrance, the chambers, the side vaults, the hall and the tomb all move
  const ri = (a,b)=>Math.round(rand(a,b));
  const exitRoom     = {x:ri(300, w-1250), y:700, w:900, h:560};   // the hall before the tomb, guarded by crypt wardens
  let tombRoom = null;
  for(let t=0; t<40 && !tombRoom; t++){ const tr = {x:ri(80, w-980), y:50, w:900, h:600}; if(!rectsOverlap(tr, exitRoom, 40)) tombRoom = tr; }
  if(!tombRoom) tombRoom = {x:exitRoom.x < w/2 ? w-980 : 80, y:50, w:900, h:600};   // sealed: reached only through the hall's north door
  const entranceRoom = {x:ri(300, w-620), y:3820, w:320, h:300};
  const N = ri(4,5), mainRooms = [];
  let left = Math.random()<0.5;
  for(let i=0;i<N;i++){
    const rw = ri(480,620), rh = ri(400,480), y = Math.round(3120 - i*(3120-1560)/(N-1) - rh/2 + rand(-60,60));
    const x = left ? ri(150, 1350) : ri(1900, w-rw-150);
    mainRooms.push({x, y:clamp(y, 1500, 3300), w:rw, h:rh});
    left = Math.random()<0.75 ? !left : left;
  }
  const sequence = [entranceRoom, ...mainRooms, exitRoom];
  const floorRects = [entranceRoom, ...mainRooms, exitRoom];
  for(let i=0;i<sequence.length-1;i++){
    const a = rectCenter(sequence[i]), b = rectCenter(sequence[i+1]);
    floorRects.push(...tunnelRects(a.x, a.y, b.x, b.y, CORR_W));
  }
  // side vaults: dead-end chambers off the main path, worth a detour
  const sideRooms = [];
  for(let k=0;k<ri(2,3);k++){
    const host = mainRooms[ri(0, N-1)], hc = rectCenter(host);
    for(let t=0;t<30;t++){
      const sw = ri(360,460), sh = ri(320,400), sx = hc.x < w/2 ? ri(w/2+200, w-sw-120) : ri(120, w/2-sw-200), sy = clamp(Math.round(hc.y - sh/2 + rand(-200,200)), 1450, 3500);
      const r = {x:sx, y:sy, w:sw, h:sh};
      if([...floorRects, tombRoom].some(o=>rectsOverlap(r, o, 90))) continue;
      sideRooms.push(r); floorRects.push(r);
      const c = rectCenter(r); floorRects.push(...tunnelRects(hc.x, hc.y, c.x, c.y, CORR_W*0.85));
      break;
    }
  }
  floorRects.push(tombRoom);
  const obstacles = darkCryptCarveObstacles(floorRects, w, h);
  // Entry/exit gate back to Cursed Cemetery -- same "the entry point IS the
  // way back out" convention every other zone-transition gate follows. The
  // player lands just north of it (see enterDarkCrypt), inside entranceRoom.
  const cemeteryGate = {x:entranceRoom.x+entranceRoom.w/2, y:4040, r:34};
  // A dedicated permanent waypoint near the entrance -- same shared
  // mechanism/art/Teleport-menu entry every other zone's waypoint uses.
  const waypoint = {x:entranceRoom.x+60, y:3880, r:22};
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
  const lights = []; // (v120) no candle/torch lights: the player's own light is the only illumination
  return { w, h, obstacles, floorRects, rooms:mainRooms.concat(sideRooms), mainPath:mainRooms, entranceRoom, exitRoom, tombRoom, hallDoor, tombDoor, bossSpawned:false, bossDone:false,
    cemeteryGate, waypoint, chestSpot, lights, tomb, chestShown:false, wraithDone:false, chestDelay:0,
    // v240: invisible respawn -- ONLY while the Wraith Lord fight is live, 'respawn in region' puts you in the chamber before the boss room
    cpRoom:mainRooms[mainRooms.length-1], respawnPoint:{x:mainRooms[mainRooms.length-1].x+mainRooms[mainRooms.length-1].w/2, y:mainRooms[mainRooms.length-1].y+mainRooms[mainRooms.length-1].h/2} };
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
function spawnDarkCryptPopulation(g){
  for(let i=0;i<18;i++) spawnEnemy(g, 'skeleton');   // v321: half as many (half as many chambers)
  for(let i=0;i<14;i++) spawnEnemy(g, 'zombie');
  for(let i=0;i<14;i++) spawnEnemy(g, 'spider');
  // v239: spider packs lurking in the hallways between the chambers (4 packs of 3) -- extra XP for anyone behind
  { const tun = g.crypt.floorRects.filter(r=>(r.w<=150 || r.h<=150) && r.y+r.h/2 < 3500 && r.w>=110 && r.h>=110);
    const picked = [];
    for(const r of tun.sort(()=>Math.random()-0.5)){
      const c = {x:r.x+r.w/2, y:r.y+r.h/2};
      if(picked.every(q=>Math.hypot(q.x-c.x, q.y-c.y) > 450)) picked.push(c);
      if(picked.length>=4) break;
    }
    for(const c of picked) for(let k=0;k<3;k++) spawnEnemy(g, 'spider', {x:c.x+rand(-45,45), y:c.y+rand(-45,45)});
  }
  // v313: 25 skeletons strung along every tunnel between chambers, plus a pack of 8 in each chamber (except the vampire room)
  { const C = g.crypt, seq = [C.entranceRoom, ...(C.mainPath||C.rooms), C.exitRoom], rects = [C.entranceRoom, ...C.rooms, C.exitRoom];
    const inRoom = (x,y)=> rects.some(r=> x>r.x-90 && x<r.x+r.w+90 && y>r.y-90 && y<r.y+r.h+90);
    for(let i=0;i<seq.length-1;i++){
      const a = rectCenter(seq[i]), bc = rectCenter(seq[i+1]);
      const L1 = Math.abs(bc.x-a.x), L2 = Math.abs(bc.y-a.y), L = L1+L2, sx = Math.sign(bc.x-a.x)||1, sy = Math.sign(bc.y-a.y)||1;
      const cand = [];
      for(let d=0; d<=L; d+=10){
        const x = d<=L1 ? a.x+sx*d : bc.x, y = d<=L1 ? a.y : a.y+sy*(d-L1);
        if(!inRoom(x,y)) cand.push({x,y,h:d<=L1});
      }
      const NT = Math.round(100/(seq.length-1));   // v467: about 100 tunnel skeletons in all, however many chambers the crypt rolled
      for(let k=0;k<NT && cand.length;k++){
        const c = cand[Math.max(0, Math.min(cand.length-1, Math.floor((k+0.5)/NT*cand.length + rand(-0.4,0.4))))];
        spawnEnemy(g, 'skeleton', {x:c.x+(c.h?rand(-10,10):rand(-38,38)), y:c.y+(c.h?rand(-38,38):rand(-10,10))});
      }
    }
    for(let ri=0; ri<C.rooms.length; ri++){
      const r = C.rooms[ri], nk = (C.mainPath && C.mainPath.indexOf(r)<0) ? 5 : 8;
      for(let k=0;k<nk;k++) spawnEnemy(g, 'skeleton', {x:rand(r.x+60, r.x+r.w-60), y:rand(r.y+60, r.y+r.h-60)});
    } }
  // v224: one big brute (skeletal brute skin) in the first corridor so the dungeon map can be found early
  { const C = g.crypt, a0 = rectCenter(C.entranceRoom), a1 = rectCenter((C.mainPath||C.rooms)[0]);
    const b = spawnEnemy(g, 'skeletonbrute', {x:(a0.x+a1.x)/2, y:a0.y});
    b.r = Math.round(b.r*1.35); b.maxHp = Math.round(b.maxHp*2.2); b.hp = b.maxHp; b.dmg *= 1.1; }
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


