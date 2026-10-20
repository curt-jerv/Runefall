// ---------------- Lighthouse Tower (v70) ----------------
// Third of the 6-batch "new area" sequence, reached from Sunlit Plains'
// own reserved west exit (SUNLIT_WEST_EXIT_SPOT/g.sun.westGate). Unlike
// the sprawling overworld zones (Forest/Mountain Pass/Sunlit Plains) or
// the Mine's randomly-regenerated multi-room floors, this is a small,
// fixed-floor dungeon: 5 small, contained rectangular floors, each with
// PERMANENT stairs (fixed position, not regenerated on re-entry, and not
// gated on clearing the floor the way the Mine's post-clear portal is) up
// to the next floor. The stairs' side ALTERNATES floor to floor, because
// each flight of stairs physically emerges on the SAME side of the floor
// above that it left from below -- so a floor's ENTRANCE side always
// matches the PREVIOUS floor's STAIRS side:
//   Floor 1: entrance RIGHT (arriving from Sunlit Plains), stairs LEFT.
//   Floor 2: entrance LEFT (matches floor 1's stairs), stairs RIGHT.
//   Floor 3: entrance RIGHT (matches floor 2's stairs), stairs LEFT.
//   Floor 4: entrance LEFT (matches floor 3's stairs), stairs RIGHT.
//   Floor 5 (rooftop): entrance RIGHT (matches floor 4's stairs) -- no
//     further stairs. A big lighthouse beacon centerpiece sits dead-center
//     instead, and this is the dungeon's "boss floor": denser, tougher
//     Bandit Brutes/Bandit Archers than floors 1-4, plus a reward chest.
const LIGHTHOUSE_FLOOR_COUNT = 5;
// Deliberately small/contained -- well under Mountain Pass's 1500x1050
// open zone, let alone the Mine's 2050+ multi-room floors, so each floor
// reads as a proper "tower interior room" rather than another sprawling
// outdoor zone. The rooftop gets a little extra room for the beacon
// centerpiece and its denser boss-floor population, while staying small.
const LIGHTHOUSE_W = 940, LIGHTHOUSE_H = 700;
const LIGHTHOUSE_ROOFTOP_W = 1080, LIGHTHOUSE_ROOFTOP_H = 820;
// Odd floors enter on the RIGHT/exit on the LEFT, even floors enter on
// the LEFT/exit on the RIGHT -- this is what makes floor N's entrance side
// always match floor N-1's stairs side (see the batch comment above),
// and it generalizes cleanly to the rooftop (floor 5, odd -> entrance
// RIGHT, matching floor 4's RIGHT-side stairs) without a special case.
function lighthouseEntranceSide(floor){ return (floor%2===1) ? 'right' : 'left'; }
function lighthouseStairsSide(floor){ return (floor%2===1) ? 'left' : 'right'; }
// (v149) Forgotten Tower: same 5-floor side-to-side stair layout as the Lighthouse, bigger floors with pillars.
const FT_W = 2300, FT_H = 1600, FT_TOP_W = 2500, FT_TOP_H = 1700;   // v456: room-and-corridor floors
// v456: every floor is a warren of rooms joined by doorways (3 columns x 2 rows, a door in every dividing wall);
// the top floor ends in a great hall against the far wall where the witch hangs in her cage, guarded by the trolls.
function makeForgottenTowerFloor(floor){
  const top = floor===LIGHTHOUSE_FLOOR_COUNT;
  const w = top ? FT_TOP_W : FT_W, h = top ? FT_TOP_H : FT_H;
  const entranceSide = lighthouseEntranceSide(floor);
  const entrance = {x: entranceSide==='right' ? w-70 : 70, y: h/2, r:34};
  let stairs = null;
  if(!top){ const ss = lighthouseStairsSide(floor); stairs = {x: ss==='right' ? w-70 : 70, y: h/2, r:30}; }
  const rnd = subSeeded(4400 + floor*131);
  const obstacles = [], T = 34, D = 170;
  const wall = (x,y,ww,hh)=>{ if(ww>4 && hh>4) obstacles.push({x:Math.round(x), y:Math.round(y), w:Math.round(ww), h:Math.round(hh), mazeWall:true}); };
  const vWall = (x, y0, y1, doors)=>{ let cur = y0; for(const d of doors.sort((a,b)=>a-b)){ wall(x-T/2, cur, T, d-D/2-cur); cur = d+D/2; } wall(x-T/2, cur, T, y1-cur); };
  const hWall = (y, x0, x1, doors)=>{ let cur = x0; for(const d of doors.sort((a,b)=>a-b)){ wall(cur, y-T/2, d-D/2-cur, T); cur = d+D/2; } wall(cur, y-T/2, x1-cur, T); };
  const fromL = entranceSide==='left';
  const rooms = [];
  let witch = null, hall = null;
  if(!top){
    const xs = [w/3, 2*w/3], my = h/2;
    // vertical walls: each has one door in the top half and (sometimes) one in the bottom half
    for(const x of xs){ const d1 = 140+rnd()*(my-320), d2 = my+180+rnd()*(my-320); vWall(x, 0, h, rnd()<0.6 ? [d1,d2] : [rnd()<0.5 ? d1 : d2]); }
    // horizontal walls per column -- the door is at the outer end in the entrance/stairs columns (they sit on the middle line)
    const colX = [[0,xs[0]],[xs[0],xs[1]],[xs[1],w]];
    colX.forEach(([x0,x1],ci)=>{
      let door = x0 + (x1-x0)*(0.3+rnd()*0.4);
      const outer = ci===0 ? x0+150 : ci===2 ? x1-150 : null;
      hWall(my, x0+(ci===0?0:T/2), x1-(ci===2?0:T/2), outer!=null ? [outer, door] : [door]);
      for(const [ry0,ry1] of [[0,my],[my,h]]) rooms.push({x0, x1, y0:ry0, y1:ry1, cx:(x0+x1)/2, cy:(ry0+ry1)/2});
    });
    // a few crates and rubble in the rooms
    for(const r of rooms){ if(rnd()<0.55){ const sz = 40+rnd()*24; const cx = r.x0+60+rnd()*(r.x1-r.x0-160), cy = r.y0+60+rnd()*(r.y1-r.y0-160);
      if(dist({x:cx,y:cy}, entrance) > 260 && (!stairs || dist({x:cx,y:cy}, stairs) > 260)) obstacles.push({x:Math.round(cx), y:Math.round(cy), w:Math.round(sz), h:Math.round(sz), col:['#6a5232','#2e2214','#4a3820'], hz:30}); } }
  } else {
    // the top floor: two rows of side rooms near the stairs, a corridor, then the great hall against the far wall
    const split = fromL ? w*0.42 : w*0.58, my = h/2;
    vWall(split, 0, h, [my-260, my+260]);
    const nearX0 = fromL ? 0 : split, nearX1 = fromL ? split : w;
    const midX = (nearX0+nearX1)/2;
    vWall(midX, 0, h, [my-330, my+330]);
    hWall(my, nearX0+(fromL?0:T/2), midX-T/2, [fromL ? nearX0+150 : midX-180]);
    hWall(my, midX+T/2, nearX1-(fromL?T/2:0), [fromL ? midX+180 : nearX1-150]);
    for(const [a,b] of [[nearX0,midX],[midX,nearX1]]) for(const [ry0,ry1] of [[0,my],[my,h]]) rooms.push({x0:a, x1:b, y0:ry0, y1:ry1, cx:(a+b)/2, cy:(ry0+ry1)/2});
    const hx0 = fromL ? split : 0, hx1 = fromL ? w : split;
    hall = {x0:hx0, x1:hx1, y0:0, y1:h, cx:(hx0+hx1)/2, cy:my};
    // pillars down the hall
    for(const fx of [0.3, 0.55]) for(const fy of [0.22, 0.78]){ const px = hx0+(hx1-hx0)*(fromL?fx:1-fx); obstacles.push({x:Math.round(px-36), y:Math.round(h*fy-36), w:72, h:72, col:['#7a7f86','#2c3036','#4c5158'], hz:80}); }
    witch = {x: fromL ? w-150 : 150, y:my, r:22, caged:true};
  }
  // (v247) floor 1 has a real waypoint (not a stray portal) just inside the entrance
  const waypoint = floor===1 ? {x: entranceSide==='right' ? w-190 : 190, y:h/2-110, r:22} : null;
  return { w, h, obstacles, floor, rooftop:top, ft:true, entranceSide, entrance, stairs, waypoint, beacon:null, witch, witchSpot:witch ? {x:witch.x, y:witch.y} : null, clearPortal:undefined, rooms, hall,
    wallPal:['#4e5148','#22241f','#363931'] };
}
function ftOpenSpot(room, avoid, minD){
  for(let t=0;t<80;t++){
    const x = rand(90, room.w-90), y = rand(90, room.h-90);
    if(room.obstacles.some(o=>x>o.x-40 && x<o.x+o.w+40 && y>o.y-40 && y<o.y+o.h+40)) continue;
    if(avoid && avoid.some(a=>a && dist({x,y},a)<(minD||260))) continue;
    return {x,y};
  }
  return {x:room.w/2, y:room.h/2+200};
}
function spawnForgottenTowerFloor(g, floor){
  const room = g.room, av = [room.entrance, room.stairs];
  const sp = (type, avoid, d)=> spawnEnemy(g, type, ftOpenSpot(room, avoid||av, d));
  // v456: goblins hold the rooms in packs
  const inRoom = (r, m)=>{ for(let t=0;t<40;t++){ const x = rand(r.x0+m, r.x1-m), y = rand(r.y0+m, r.y1-m); if(!posBlockedByObstacles(x,y,26,room.obstacles) && (!av.some(a=>a && dist({x,y},a)<240))) return {x,y}; } return null; };
  const pack = (r, nG, nA, nT)=>{ const c = inRoom(r, 110); if(!c) return; const around = ()=>{ for(let t=0;t<12;t++){ const pt = {x:c.x+rand(-80,80), y:c.y+rand(-80,80)}; if(pt.x>r.x0+40 && pt.x<r.x1-40 && pt.y>r.y0+40 && pt.y<r.y1-40 && !posBlockedByObstacles(pt.x,pt.y,22,room.obstacles)) return pt; } return c; };
    for(let k=0;k<nG;k++) spawnEnemy(g, 'goblin', around()); for(let k=0;k<nA;k++) spawnEnemy(g, 'goblinarcher', around()); for(let k=0;k<nT;k++) spawnEnemy(g, 'cavetroll', around()); };
  if(!room.rooftop){
    const rs = (room.rooms||[]).filter(r=>!(room.entrance.x>r.x0 && room.entrance.x<r.x1 && room.entrance.y>r.y0-1 && room.entrance.y<r.y1+1 && Math.abs(room.entrance.y-(r.y0+r.y1)/2)<1));
    (room.rooms||[]).forEach((r,i)=>{ const startRoom = room.entrance.x>r.x0 && room.entrance.x<r.x1; pack(r, startRoom ? 2 : 3+Math.floor(Math.random()*2+floor/2), 1+(i%2), (!startRoom && floor>=2 && i%3===1) ? 1 : 0); });
  } else {
    // v354/v456: the hall is held by a pack of elite cave trolls around the witch's cage; goblins fill the side rooms
    const hl = room.hall, wch = room.witchSpot, dir = wch.x > hl.cx ? -1 : 1;
    const cx = wch.x + dir*260, cy = wch.y;
    for(let k=0;k<3;k++){
      const a = k/3*Math.PI*2+0.6, e = spawnEnemy(g, 'cavetroll', {x:cx+Math.cos(a)*110, y:cy+Math.sin(a)*110});
      if(e){ makeElite(e, pickMods(2)); e.ftGuard = true; }
    }
    for(let k=0;k<2;k++){ const e = spawnEnemy(g, 'cavetroll', {x:hl.cx+rand(-120,120), y:hl.cy+(k?260:-260)}); if(e) e.ftGuard = true; }
    for(let k=0;k<4;k++) spawnEnemy(g, 'goblinarcher', {x:hl.cx+rand(-200,200), y:hl.cy+rand(-420,420)});
    for(let k=0;k<6;k++) spawnEnemy(g, 'goblin', {x:hl.cx+rand(-260,260), y:hl.cy+rand(-380,380)});
    for(const r of (room.rooms||[])) pack(r, 3+Math.floor(Math.random()*2), 1, 0);
    g.enemies._dense = true;   // the top floor stays exactly these packs (no density top-up)
    showMsg('The witch\'s captors wait in the great hall...', 2.0);
  }
}
function enterForgottenTower(floor, opts){
  opts = opts || {};
  const g = game;
  floor = clamp(floor||1, 1, LIGHTHOUSE_FLOOR_COUNT);
  g.scene = 'lighthouse';
  g.lighthouseFloor = floor;
  g.tower = makeForgottenTowerFloor(floor);
  g.room = g.tower;
  if(floor===LIGHTHOUSE_FLOOR_COUNT && game.player.witchRescued){ g.tower.witch = null; const ws = g.tower.witchSpot || {x:g.tower.w/2, y:g.tower.h/2}; g.tower.clearPortal = {x:ws.x + (ws.x > g.tower.w/2 ? -130 : 130), y:ws.y+60, r:24, toTown:true}; }
  g.depth = 28 + Math.ceil(floor*0.6); // 29..31
  if(opts.fromAbove && g.tower.stairs){
    g.player.x = g.tower.stairs.x + (lighthouseStairsSide(floor)==='right' ? -70 : 70); g.player.y = g.tower.stairs.y;
  } else {
    g.player.x = g.tower.entrance.x + (g.tower.entranceSide==='right' ? -70 : 70); g.player.y = g.tower.entrance.y;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg('Forgotten Tower -- Floor '+floor, 1.6);
  if(!game.player.witchRescued) addQuestOnce(game.player, 'witch_find', 'The Witch of the Black Marsh', 'The witch is missing. Search for the witch.', 1);
  g.ftStore = g.ftStore || {};
  if(g.ftStore[floor]) g.enemies = g.ftStore[floor];
  else spawnForgottenTowerFloor(g, floor);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
function makeLighthouseFloor(floor){
  const rooftop = floor===LIGHTHOUSE_FLOOR_COUNT;
  const w = rooftop ? LIGHTHOUSE_ROOFTOP_W : LIGHTHOUSE_W;
  const h = rooftop ? LIGHTHOUSE_ROOFTOP_H : LIGHTHOUSE_H;
  const entranceSide = lighthouseEntranceSide(floor);
  const entrance = {x: entranceSide==='right' ? w-70 : 70, y: h/2, r:34};
  let stairs = null, waypoint = null, beacon = null;
  if(!rooftop){
    const stairsSide = lighthouseStairsSide(floor);
    stairs = {x: stairsSide==='right' ? w-70 : 70, y: h/2, r:30};
  } else {
    // the rooftop's big light-feature centerpiece, dead center
    beacon = {x:w/2, y:h/2, r:46};
  }
  if(floor===1){
    // A waypoint just inside floor 1, near the entrance -- nudged off to
    // the side and back from the entrance's own centerline, same "nudge
    // clear of the geometry" placement rule Sunlit Plains' own waypoint uses.
    waypoint = {x: entrance.x + (entranceSide==='right' ? -150 : 150), y: h/2 - 150, r:22};
  }
  // v94 (quest feature): the rooftop's own second waypoint is REMOVED --
  // floor 5 no longer has a waypoint at all. In its place, clearing the
  // floor now spawns a one-time portal back to Sunlit Plains (see the
  // g.scene==='lighthouse' branch in update()), and the beacon itself
  // starts off, lit only once the player interacts with it (see
  // turnOnBeacon/drawLighthouseBeaconIso's new `on` param).
  if(!rooftop) return makeLighthouseMazeFloor(floor);   // v467: floors 1-4 are a new warren of rooms every visit
  return { w, h, obstacles:[], floor, rooftop, entranceSide, entrance, stairs, waypoint, beacon };
}
// v467: a 3x3 grid of rooms joined by doorways (a random spanning tree plus a couple of extra doors). You arrive in one room
// and the stairs up wait in the room furthest away, so every floor is a short crawl. Each floor keeps its layout until you reload.
const LH_MAZE_W = 2000, LH_MAZE_H = 1500;
function makeLighthouseMazeFloor(floor){
  const g = game; g.lhSeeds = g.lhSeeds || {};
  if(!g.lhSeeds[floor]) g.lhSeeds[floor] = 1 + Math.floor(Math.random()*1e9);
  const rnd = subSeeded(g.lhSeeds[floor]);
  const w = LH_MAZE_W, h = LH_MAZE_H, C = 3, R = 3, cw = w/C, ch = h/R, T = 34, D = 150;
  const obstacles = [];
  const wall = (x,y,ww,hh)=>{ if(ww>4 && hh>4) obstacles.push({x:Math.round(x), y:Math.round(y), w:Math.round(ww), h:Math.round(hh), mazeWall:true}); };
  const id = (c,r)=>r*C+c, cells = [];
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) cells.push({c, r, x0:c*cw, x1:(c+1)*cw, y0:r*ch, y1:(r+1)*ch, cx:(c+0.5)*cw, cy:(r+0.5)*ch});
  // random spanning tree (DFS), then two extra doors for loops
  const open = new Set(), seen = new Set([0]), stack = [0], key = (a,b)=>Math.min(a,b)+'-'+Math.max(a,b);
  const nbrs = (i)=>{ const c = i%C, r = Math.floor(i/C), out = []; if(c>0) out.push(i-1); if(c<C-1) out.push(i+1); if(r>0) out.push(i-C); if(r<R-1) out.push(i+C); return out; };
  while(stack.length){ const cur = stack[stack.length-1], nx = nbrs(cur).filter(n=>!seen.has(n)); if(!nx.length){ stack.pop(); continue; } const n = nx[Math.floor(rnd()*nx.length)]; open.add(key(cur,n)); seen.add(n); stack.push(n); }
  for(let k=0, t=0; k<2 && t<40; t++){ const a = Math.floor(rnd()*C*R), ns = nbrs(a), b = ns[Math.floor(rnd()*ns.length)]; if(!open.has(key(a,b))){ open.add(key(a,b)); k++; } }
  // walls along every inner boundary, with a doorway where two rooms connect
  for(let c=1;c<C;c++) for(let r=0;r<R;r++){ const x = c*cw, y0 = r*ch, y1 = (r+1)*ch;
    if(open.has(key(id(c-1,r), id(c,r)))){ const d = y0 + ch*(0.3 + rnd()*0.4); wall(x-T/2, y0, T, d-D/2-y0); wall(x-T/2, d+D/2, T, y1-(d+D/2)); }
    else wall(x-T/2, y0, T, y1-y0); }
  for(let r=1;r<R;r++) for(let c=0;c<C;c++){ const y = r*ch, x0 = c*cw, x1 = (c+1)*cw;
    if(open.has(key(id(c,r-1), id(c,r)))){ const d = x0 + cw*(0.3 + rnd()*0.4); wall(x0, y-T/2, d-D/2-x0, T); wall(d+D/2, y-T/2, x1-(d+D/2), T); }
    else wall(x0, y-T/2, cw, T); }
  // where you come in: floor 1 through the tower door on an outer wall, higher floors by the stairs from below
  let startCell;
  let entrance, entranceSide;
  if(floor===1){
    const side = rnd()<0.5 ? 'left' : 'right', r0 = Math.floor(rnd()*R);
    startCell = cells[id(side==='left' ? 0 : C-1, r0)];
    entrance = {x: side==='right' ? w-70 : 70, y: startCell.cy, r:34}; entranceSide = side;
  } else {
    startCell = cells[Math.floor(rnd()*cells.length)];
    entrance = {x: startCell.cx + (rnd()-0.5)*cw*0.3, y: startCell.cy + (rnd()-0.5)*ch*0.3, r:34}; entranceSide = 'left';
  }
  // the stairs up: the room furthest away through the doors
  const distTo = new Array(C*R).fill(-1), q = [id(startCell.c, startCell.r)]; distTo[q[0]] = 0;
  while(q.length){ const cur = q.shift(); for(const n of nbrs(cur)) if(distTo[n]<0 && open.has(key(cur,n))){ distTo[n] = distTo[cur]+1; q.push(n); } }
  const far = Math.max(...distTo), farCells = cells.filter((cl,i)=>distTo[i]===far);
  const sc = farCells[Math.floor(rnd()*farCells.length)];
  const stairs = {x: sc.cx + (rnd()-0.5)*cw*0.4, y: sc.cy + (rnd()-0.5)*ch*0.35, r:30};
  const waypoint = floor===1 ? {x: entrance.x + (entranceSide==='right' ? -170 : 170), y: entrance.y - 120, r:22} : null;
  // crates and rubble in the rooms
  for(const cl of cells){
    const n = Math.floor(rnd()*3);
    for(let k=0;k<n;k++){ const sz = 40+rnd()*26, x = cl.x0+90+rnd()*(cw-220), y = cl.y0+90+rnd()*(ch-220);
      if(dist({x,y}, entrance) < 200 || dist({x,y}, stairs) < 200 || (waypoint && dist({x,y}, waypoint) < 140)) continue;
      obstacles.push({x:Math.round(x), y:Math.round(y), w:Math.round(sz), h:Math.round(sz), col:['#6a5232','#2e2214','#4a3820'], hz:30}); }
  }
  const rooms = cells.map(cl=>({x0:cl.x0, x1:cl.x1, y0:cl.y0, y1:cl.y1, cx:cl.cx, cy:cl.cy, start:cl===startCell, steps:distTo[id(cl.c,cl.r)]}));
  return { w, h, obstacles, floor, rooftop:false, maze:true, entranceSide, entrance, stairs, waypoint, beacon:null, rooms,
    wallPal:['#6a6458','#2c2924','#48443c'] };
}
// Floors 1-4: a handful of Bandits/Bandit Archers (reusing Sunlit Plains'
// exact monster types), a modest count appropriate to the small floor size
// rather than the overworld's sprawling pack system -- just a simple fixed
// spawnEnemy() call per enemy, same as how the Mine spreads a floor's count
// across spawnEnemy() calls in spawnWave(). Count edges up slightly with
// floor number for a gentle ramp toward the rooftop.
function spawnLighthouseFloor(g, floor){
  const room = g.room;
  if(!room.rooftop && room.maze){
    // v467: a bandit pack in every room except the one you arrive in; the stairs room is held by a brute
    const spot = (r)=>{ for(let t=0;t<40;t++){ const x = rand(r.x0+80, r.x1-80), y = rand(r.y0+80, r.y1-80); if(!posBlockedByObstacles(x,y,22,room.obstacles) && dist({x,y},room.entrance)>260) return {x,y}; } return null; };
    for(const r of room.rooms){
      if(r.start) continue;
      const nB = 1 + Math.floor(Math.random()*2) + (floor>=3 ? 1 : 0), nA = Math.random()<0.6 ? 1 : 0;
      for(let k=0;k<nB;k++){ const q = spot(r); if(q) spawnEnemy(g, 'bandit', q); }
      for(let k=0;k<nA;k++){ const q = spot(r); if(q) spawnEnemy(g, 'banditarcher', q); }
      if(r.steps>0 && dist({x:r.cx,y:r.cy}, room.stairs) < 500){ const q = spot(r); if(q) spawnEnemy(g, 'banditbrute', q); }
    }
    g.enemies._dense = true;   // exactly these packs
  } else if(!room.rooftop){
    const banditCount = 2 + Math.floor(floor/2); // floors 1-4: 2,2,3,3
    const archerCount = 1 + Math.floor(floor/3); // floors 1-4: 1,1,1,2
    for(let i=0;i<banditCount;i++) spawnEnemy(g, 'bandit');
    for(let i=0;i<archerCount;i++) spawnEnemy(g, 'banditarcher');
  } else {
    // Floor 5 (rooftop): the dungeon's boss floor -- introduces Bandit
    // Brutes alongside more Bandit Archers and a couple of regular
    // Bandits, roughly doubling a normal floor's population, similar in
    // spirit to how the Mine/Spider Lair/Bear Cave boss floors are
    // noticeably denser/tougher than a regular floor.
    // v461: the Bandit King holds the rooftop with his guard
    // v480: he waits behind the beacon, untouchable, and sends six brutes and six archers first
    const bc = room.beacon || {x:room.w/2, y:room.h/2};
    const king = spawnEnemy(g, 'banditking', {x:bc.x + (room.entranceSide==='right' ? -95 : 95), y:bc.y - 30});
    if(king){ king.bkHold = true; }
    for(let i=0;i<12;i++){
      const e = spawnEnemy(g, i<6 ? 'banditbrute' : 'banditarcher'); if(!e) continue;
      e.bkCrew = true; e.bkWait = true; e._aggro0 = e.aggroRange; e.aggroRange = 0;   // v486: they hold their posts around the beacon
      for(let tr=0; tr<12; tr++){
        const a = (i/12)*Math.PI*2 + rand(-0.2,0.2), rr = (i<6 ? rand(130,190) : rand(210,270));
        const nx = clamp(bc.x + Math.cos(a)*rr, 60, room.w-60), ny = clamp(bc.y + Math.sin(a)*rr, 60, room.h-60);
        if(!posBlockedByObstacles(nx, ny, e.r, room.obstacles)){ e.x = nx; e.y = ny; e.homeX = nx; e.homeY = ny; break; }
      }
      e.wanderRadius = 12;
    }
    g.enemies._dense = true;   // exactly the King and his twelve
  }
}
function enterLighthouseTower(floor, opts){
  opts = opts || {};
  const g = game;
  g.scene = 'lighthouse';
  g.lighthouseFloor = floor || 1;
  // Waypoint rework: reachedLighthouseTower is no longer set on mere floor-1
  // entry -- it's now set when the player walks up to floor 1's own
  // waypoint marker (see the lhKind==='waypointLighthouse1' proximity
  // check in update(), which calls discoverWaypoint). The rooftop (floor
  // 5) has no physical waypoint marker of its own (see makeLighthouseFloor's
  // comment), so reachedLighthouseTowerTop keeps its original "first
  // arrival" trigger below -- there's no marker to walk up to instead.
  if(g.lighthouseFloor===LIGHTHOUSE_FLOOR_COUNT && !g.player.reachedLighthouseTowerTop){
    g.player.reachedLighthouseTowerTop = true;
    saveGame();
  }
  g.tower = makeLighthouseFloor(g.lighthouseFloor);
  g.room = g.tower;
  // Threads the floor number through the shared depth-based enemy stat
  // formulas (see spawnEnemy) -- the exact same "g.depth stands in for how
  // far along this dungeon you are" convention the Mine/Spider Lair/Bear
  // Cave already use (g.depth = g.player.checkpointDepth or a fixed 5).
  g.depth = [9,10,10,13,15][Math.max(0,Math.min(4,(g.lighthouseFloor||1)-1))]; // v237: floors 1-3 = 9/10/10, floor 4 = 13, rooftop = 15
  // Waypoint rework: teleporting in via the Teleport menu (opts.atWaypoint,
  // only ever passed for floor 1, the only floor with a waypoint) lands the
  // player AT that waypoint marker, not the generic floor entrance.
  if(opts.atWaypoint && g.tower.waypoint){
    g.player.x = g.tower.waypoint.x; g.player.y = g.tower.waypoint.y + 30;
  } else if(opts.fromAbove && g.tower.stairs){
    g.player.x = g.tower.stairs.x + (g.tower.maze ? 70 : (lighthouseStairsSide(g.lighthouseFloor)==='right' ? -70 : 70));
    g.player.y = g.tower.stairs.y;
  } else {
    g.player.x = g.tower.entrance.x + (g.tower.entranceSide==='right' ? -70 : 70);
    g.player.y = g.tower.entrance.y;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg(g.tower.rooftop ? 'Lighthouse Tower -- Rooftop' : ('Lighthouse Tower -- Floor '+g.lighthouseFloor), 1.6);
  // Monsters don't respawn until the game reloads: each floor's surviving enemies are kept in g.lhStore.
  g.lhStore = g.lhStore || {};
  if(g.lhStore[g.lighthouseFloor]) g.enemies = g.lhStore[g.lighthouseFloor];
  else spawnLighthouseFloor(g, g.lighthouseFloor);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
function lighthouseDescend(){
  const g = game;
  if(!g.tower || g.lighthouseFloor <= 1) return;
  if(g.tower.ft) enterForgottenTower(g.lighthouseFloor-1, {fromAbove:true}); else enterLighthouseTower(g.lighthouseFloor-1, {fromAbove:true});
}
function lighthouseAscend(){
  const g = game;
  if(!g.tower || g.lighthouseFloor >= LIGHTHOUSE_FLOOR_COUNT) return;
  if(g.tower.ft) enterForgottenTower(g.lighthouseFloor+1); else enterLighthouseTower(g.lighthouseFloor+1);
}

