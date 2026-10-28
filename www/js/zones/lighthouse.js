// ---------------- Lighthouse Tower (v70) ----------------
// Third of the 6-batch "new area" sequence, reached from Withered Crossroads'
// own reserved west exit (SUNLIT_WEST_EXIT_SPOT/g.sun.westGate). Unlike
// the sprawling overworld zones (Forest/Mountain Pass/Withered Crossroads) or
// the Mine's randomly-regenerated multi-room floors, this is a small,
// fixed-floor dungeon: 5 small, contained rectangular floors, each with
// PERMANENT stairs (fixed position, not regenerated on re-entry, and not
// gated on clearing the floor the way the Mine's post-clear portal is) up
// to the next floor. The stairs' side ALTERNATES floor to floor, because
// each flight of stairs physically emerges on the SAME side of the floor
// above that it left from below -- so a floor's ENTRANCE side always
// matches the PREVIOUS floor's STAIRS side:
//   Floor 1: entrance RIGHT (arriving from Withered Crossroads), stairs LEFT.
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
  // v553: the same 18-room build as the Lighthouse (towerMaze), mossier walls; the top floor is 12 rooms then the
  // great hall where the witch hangs in her cage and the trolls keep watch by two bonfires
  const top = floor===LIGHTHOUSE_FLOOR_COUNT, seed = tripSeed('ft') + floor*131;   // v525: new rooms every trip
  const R = towerMaze(floor, {seed, C:top ? 4 : LH_MAZE_C, R:LH_MAZE_R, hall:top, hallFires:true, witch:true, side:top ? 'left' : null, waypoint:floor===1, fireP:0.5, wallPal:['#4e5148','#22241f','#363931']});
  R.ft = true; R.clearPortal = undefined;
  return R;
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
  const room = g.room;
  // v553: goblins huddle round the bonfires with a snake or two among them; other rooms hold small goblin packs, some a troll; bats roost in a few
  const spot = (r, cx, cy, rad)=>{ for(let t=0;t<40;t++){ const x = cx!=null ? cx+rand(-rad,rad) : rand(r.x0+80, r.x1-80), y = cy!=null ? cy+rand(-rad,rad) : rand(r.y0+80, r.y1-80); if(x>r.x0+50 && x<r.x1-50 && y>r.y0+50 && y<r.y1-50 && !posBlockedByObstacles(x,y,24,room.obstacles) && dist({x,y},room.entrance)>260 && (!room.waypoint || dist({x,y},room.waypoint)>200)) return {x,y}; } return null; };
  const ring = (fire, n, types)=>{ for(let k=0;k<n;k++){ const a = (k/n)*Math.PI*2 + rand(-0.3,0.3), rr = rand(74, 108), q = {x:fire.x + Math.cos(a)*rr, y:fire.y + Math.sin(a)*rr*0.9};
    if(posBlockedByObstacles(q.x, q.y, 22, room.obstacles)) continue; const e = spawnEnemy(g, types(k), q); if(e){ e.homeX = q.x; e.homeY = q.y; e.wanderRadius = 14; } } };
  for(const r of room.rooms){
    if(r.start) continue;
    if(r.fire){
      const n = 3 + Math.floor(Math.random()*3);
      ring(r.fire, n, k=>k===0 ? 'goblinarcher' : 'goblin');
      for(let k=0, ns=Math.random()<0.6 ? 1 : 0; k<ns; k++){ const q = spot(r, r.fire.x, r.fire.y, 160); if(q) spawnEnemy(g, 'poisonsnake', q); }
    } else if(Math.random() < 0.85){
      const c = spot(r); if(!c) continue;
      const nG = 2 + Math.floor(Math.random()*2);
      for(let k=0;k<nG;k++){ const q = spot(r, c.x, c.y, 80); if(q) spawnEnemy(g, 'goblin', q); }
      if(Math.random()<0.5){ const q = spot(r, c.x, c.y, 90); if(q) spawnEnemy(g, 'goblinarcher', q); }
      if(Math.random()<0.3){ const q = spot(r, c.x, c.y, 120); if(q) spawnEnemy(g, 'poisonsnake', q); }
      if(floor>=2 && Math.random()<0.22){ const q = spot(r, c.x, c.y, 100); if(q) spawnEnemy(g, 'cavetroll', q); }
    }
    if(Math.random() < 0.13 && typeof cryptBat==='function'){ const c = spot(r); if(c) for(let k=0, n=3+Math.floor(Math.random()*2); k<n; k++) cryptBat(g, c.x+rand(-50,50), c.y+rand(-50,50)); }
  }
  if(room.hall){
    // v354/v456: the hall is held by elite cave trolls round the witch's cage, goblins at the bonfires by the door
    const hl = room.hall, wch = room.witchSpot, cx = wch.x - 260, cy = wch.y;
    for(let k=0;k<3;k++){ const a = k/3*Math.PI*2+0.6, e = spawnEnemy(g, 'cavetroll', {x:cx+Math.cos(a)*110, y:cy+Math.sin(a)*110}); if(e){ makeElite(e, pickMods(2)); e.ftGuard = true; } }
    for(let k=0;k<2;k++){ const e = spawnEnemy(g, 'cavetroll', {x:hl.cx+rand(-120,120), y:hl.cy+(k?300:-300)}); if(e) e.ftGuard = true; }
    for(const b of room.bonfires.filter(b=>b.x>hl.x0)) ring(b, 4, k=>k%2 ? 'goblinarcher' : 'goblin');
    for(let k=0;k<2;k++){ const e = spawnEnemy(g, 'poisonsnake', {x:hl.cx+rand(-200,200), y:hl.cy+rand(-420,420)}); }
    g.enemies._dense = true;   // the top floor stays exactly these packs (no density top-up)
    showMsg('The witch\'s captors wait in the great hall...', 2.0);
  } else g.enemies._dense = true;
}
// v490: a Map Bearer (ringed in gold) holds the first floor; slaying it charts every Forgotten Tower floor (p.ftMapFound)
function ftEnsureMapBearer(g){
  const room = g.room, p = g.player;
  if(!room || p.ftMapFound || g.enemies.some(e=>e.ftMapCarrier && e.hp>0)) return;
  const ent = room.entrance;
  const cand = g.enemies.filter(e=>e.hp>0 && !e.ftGuard && (e.type==='goblin' || e.type==='cavetroll')).map(e=>({e, d:Math.hypot(e.x-ent.x, e.y-ent.y)})).filter(c=>c.d>=450).sort((a,b)=>Math.abs(a.d-800)-Math.abs(b.d-800));
  const e = cand.length ? cand[0].e : null; if(!e) return;
  e.ftMapCarrier = true; e.mapCarrier = true; e.mapHolder = true;
  e.hp = Math.round(e.hp*2); e.maxHp = Math.round(e.maxHp*2); e.r = Math.round(e.r*1.12); e.xpMul = Math.max(e.xpMul||1, 2.5);
}
function enterForgottenTower(floor, opts){
  opts = opts || {};
  const g = game;
  floor = clamp(floor||1, 1, LIGHTHOUSE_FLOOR_COUNT);
  g.scene = 'lighthouse';
  g.lighthouseFloor = floor;
  g.tower = makeForgottenTowerFloor(floor);
  g.room = g.tower;
  if(floor===LIGHTHOUSE_FLOOR_COUNT && game.player.witchRescued){ g.tower.witch = null; const ws = g.tower.witchSpot || {x:g.tower.w/2, y:g.tower.h/2}; g.tower.clearPortal = {x:ws.x + (ws.x > g.tower.w/2 ? -130 : 130), y:ws.y+60, r:24, toWitch:true}; }
  g.depth = 28 + Math.ceil(floor*0.6); // 29..31
  if(opts.fromAbove && g.tower.stairs){
    g.player.x = g.tower.stairs.x + 70; g.player.y = g.tower.stairs.y;   // v553
  } else {
    g.player.x = g.tower.entrance.x + (g.tower.entranceSide==='right' ? -70 : 70); g.player.y = g.tower.entrance.y;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg('Forgotten Tower -- Floor '+floor, 1.6);
  if(!game.player.witchRescued) addQuestOnce(game.player, 'witch_find', 'The Witch of the Black Marsh', 'The witch is missing. Search for the witch.', 1);
  g.ftStore = g.ftStore || {};
  if(g.ftStore[floor]) g.enemies = g.ftStore[floor];
  else spawnForgottenTowerFloor(g, floor);
  ftEnsureMapBearer(g);   // v490
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
function makeLighthouseFloor(floor){
  tripSeed('lh');   // v525: part of the same trip as the maze floors
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
    // clear of the geometry" placement rule Withered Crossroads' own waypoint uses.
    waypoint = null;   // v489: the floor-1 waypoint is removed
  }
  // v94 (quest feature): the rooftop's own second waypoint is REMOVED --
  // floor 5 no longer has a waypoint at all. In its place, clearing the
  // floor now spawns a one-time portal back to Withered Crossroads (see the
  // g.scene==='lighthouse' branch in update()), and the beacon itself
  // starts off, lit only once the player interacts with it (see
  // turnOnBeacon/drawLighthouseBeaconIso's new `on` param).
  if(!rooftop) return makeLighthouseMazeFloor(floor);   // v467: floors 1-4 are a new warren of rooms every visit
  return makeLighthouseRoof(floor, entranceSide);
}
// v552: the rooftop is open air -- a round stone deck ringed by a railing, the beacon in the middle, the sea far below
// to the west and the Withered Crossroads far below to the east (drawLhRoof in render/render.js)
const LH_ROOF_S = 1500, LH_ROOF_R = 640;
function makeLighthouseRoof(floor, entranceSide){
  const w = LH_ROOF_S, h = LH_ROOF_S, cx = w/2, cy = h/2, RR = LH_ROOF_R, obstacles = [];
  const entrance = {x: cx + (entranceSide==='right' ? 1 : -1)*(RR-90), y: cy, r:34};
  const beacon = {x:cx, y:cy, r:70};
  obstacles.push({x:cx-36, y:cy-36, w:72, h:72, isProp:true, noDraw:true});
  // the railing: a ring of overlapping invisible blocks just outside the deck
  for(let a=0; a<Math.PI*2; a+=Math.PI*2/180){ const x = cx + Math.cos(a)*(RR+30), y = cy + Math.sin(a)*(RR+30); obstacles.push({x:Math.round(x-30), y:Math.round(y-30), w:60, h:60, isProp:true, noDraw:true, rail:true}); }
  const posts = []; for(let i=0;i<48;i++){ const a = i/48*Math.PI*2; posts.push({x:cx + Math.cos(a)*(RR+6), y:cy + Math.sin(a)*(RR+6)}); }
  return { w, h, obstacles, floor, rooftop:true, openRoof:true, roofC:{x:cx, y:cy}, roofR:RR, roofPosts:posts, entranceSide, entrance, stairs:null, waypoint:null, beacon };
}
// v552: floors 1-4 are 18 rooms (6x3) joined by doorways along a random spanning tree with no shortcuts; of a few
// trees the one with the longest walk to the stairs is kept, so the way up crosses most of the floor. Rooms are
// furnished (barrels, crates, beds, bonfires the bandits gather round) and one dead-end room hides a cache.
const LH_MAZE_C = 6, LH_MAZE_R = 3, LH_CELL_W = 620, LH_CELL_H = 560;
const LH_MAZE_W = LH_MAZE_C*LH_CELL_W, LH_MAZE_H = LH_MAZE_R*LH_CELL_H;
function makeLighthouseMazeFloor(floor){
  const seed = tripSeed('lh') + floor*977;   // v525: a fresh maze every trip
  return towerMaze(floor, {seed, C:LH_MAZE_C, R:LH_MAZE_R, wallPal:['#6a6458','#2c2924','#48443c']});
}
// v553: shared by the Lighthouse and the Forgotten Tower. o.hall adds a great hall (LH_HALL_W wide, full height) past
// the last column, reached by one door from the furthest room of that column; o.side forces the side you come in on.
const LH_HALL_W = 1400;
function towerMaze(floor, o){
  const seed = o.seed, rnd = subSeeded(seed);
  const C = o.C, R = o.R, cw = o.cw||LH_CELL_W, ch = o.ch||LH_CELL_H, mw = C*cw, w = mw + (o.hall ? (o.hallW||LH_HALL_W) : 0), h = R*ch, T = 34, D = o.door||150;
  const obstacles = [];
  const wall = (x,y,ww,hh)=>{ if(ww>4 && hh>4) obstacles.push({x:Math.round(x), y:Math.round(y), w:Math.round(ww), h:Math.round(hh), mazeWall:true}); };
  const id = (c,r)=>r*C+c, cells = [];
  for(let r=0;r<R;r++) for(let c=0;c<C;c++) cells.push({c, r, x0:c*cw, x1:(c+1)*cw, y0:r*ch, y1:(r+1)*ch, cx:(c+0.5)*cw, cy:(r+0.5)*ch});
  const key = (a,b)=>Math.min(a,b)+'-'+Math.max(a,b);
  const nbrs = (i)=>{ const c = i%C, r = Math.floor(i/C), out = []; if(c>0) out.push(i-1); if(c<C-1) out.push(i+1); if(r>0) out.push(i-C); if(r<R-1) out.push(i+C); return out; };
  // where you come in: floor 1 through the tower door on the east or west wall, higher floors at an end column
  const side = o.side || (rnd()<0.5 ? 'left' : 'right'), startIdx = id(side==='left' ? 0 : C-1, Math.floor(rnd()*R));
  let best = null;
  for(let tr=0; tr<12; tr++){
    const open = new Set(), seen = new Set([startIdx]), stack = [startIdx];
    while(stack.length){ const cur = stack[stack.length-1], nx = nbrs(cur).filter(n=>!seen.has(n)); if(!nx.length){ stack.pop(); continue; } const n = nx[Math.floor(rnd()*nx.length)]; open.add(key(cur,n)); seen.add(n); stack.push(n); }
    const distTo = new Array(C*R).fill(-1), q = [startIdx]; distTo[startIdx] = 0;
    while(q.length){ const cur = q.shift(); for(const n of nbrs(cur)) if(distTo[n]<0 && open.has(key(cur,n))){ distTo[n] = distTo[cur]+1; q.push(n); } }
    const far = o.hall ? Math.max(...distTo.filter((d,i)=>i%C===C-1)) : Math.max(...distTo);
    if(!best || far > best.far) best = {open, distTo, far};
  }
  const {open, distTo, far} = best;
  const doors = [];
  for(let c=1;c<C;c++) for(let r=0;r<R;r++){ const x = c*cw, y0 = r*ch, y1 = (r+1)*ch;
    if(open.has(key(id(c-1,r), id(c,r)))){ const d = y0 + ch*(0.3 + rnd()*0.4); wall(x-T/2, y0, T, d-D/2-y0); wall(x-T/2, d+D/2, T, y1-(d+D/2)); doors.push({x, y:d}); }
    else wall(x-T/2, y0, T, y1-y0); }
  for(let r=1;r<R;r++) for(let c=0;c<C;c++){ const y = r*ch, x0 = c*cw, x1 = (c+1)*cw;
    if(open.has(key(id(c,r-1), id(c,r)))){ const d = x0 + cw*(0.3 + rnd()*0.4); wall(x0, y-T/2, d-D/2-x0, T); wall(d+D/2, y-T/2, x1-(d+D/2), T); doors.push({x:d, y}); }
    else wall(x0, y-T/2, cw, T); }
  const startCell = cells[startIdx];
  let entrance, entranceSide = side;
  if(floor===1) entrance = {x: side==='right' ? mw-70 : 70, y: startCell.cy, r:34};
  else entrance = {x: startCell.cx + (rnd()-0.5)*cw*0.25, y: startCell.cy + (rnd()-0.5)*ch*0.25, r:34};
  const farCells = cells.filter((cl,i)=>distTo[i]===far && (!o.hall || i%C===C-1)), sc = farCells[Math.floor(rnd()*farCells.length)];
  let stairs = {x: sc.cx + (rnd()-0.5)*cw*0.3, y: sc.cy + (rnd()-0.5)*ch*0.3, r:30}, hall = null, witch = null;
  if(o.hall){   // the hall's wall, one door from the furthest room; no stairs on this floor
    const d = sc.cy + (rnd()-0.5)*ch*0.3;
    wall(mw-T/2, 0, T, d-D/2); wall(mw-T/2, d+D/2, T, h-(d+D/2)); doors.push({x:mw, y:d});
    hall = {x0:mw, x1:w, y0:0, y1:h, cx:(mw+w)/2, cy:h/2, door:{x:mw, y:d}};
    if(o.witch) witch = {x:w-150, y:h/2, r:22, caged:true};
    for(const fx of [0.32, 0.62]) for(const fy of [0.2, 0.8]){ const px = mw + (w-mw)*fx; obstacles.push({x:Math.round(px-36), y:Math.round(h*fy-36), w:72, h:72, col:o.pillarCol||['#7a7f86','#2c3036','#4c5158'], hz:80}); }
    stairs = null;
  }
  const waypoint = o.waypoint ? {x: entrance.x + (side==='right' ? -170 : 170), y: entrance.y - 120, r:22} : null;   // v489: the Lighthouse's floor-1 waypoint is removed; the Forgotten Tower keeps one
  const deg = (i)=>nbrs(i).filter(n=>open.has(key(i,n))).length;
  const rooms = cells.map((cl,i)=>({x0:cl.x0, x1:cl.x1, y0:cl.y0, y1:cl.y1, cx:cl.cx, cy:cl.cy, start:i===startIdx, stairsRoom:cl===sc, steps:distTo[i], dead:deg(i)===1 && i!==startIdx && cl!==sc}));
  // furniture: invisible blockers (isProp) plus a draw list
  const decor = [], bonfires = [];
  const avoidPts = [entrance, stairs, waypoint, witch].filter(Boolean);
  const clear = (x,y,rr)=> x>40 && y>40 && x<mw-40 && y<h-40 && avoidPts.every(a=>dist({x,y}, a) > 170) && doors.every(d=>dist({x,y}, d) > 125+rr) && decor.every(d=>dist({x,y}, d) > (d.rr||20)+rr+8);
  const block = (x,y,bw,bh)=>{ const o = {x:Math.round(x-bw/2), y:Math.round(y-bh/2), w:Math.round(bw), h:Math.round(bh), isProp:true, noDraw:true, lhProp:true}; obstacles.push(o); return o; };
  for(const r of rooms){
    if(r.start) continue;
    const inner = 58;
    if(!r.stairsRoom && rnd() < (o.fireP!=null ? o.fireP : 0.42)){   // a bonfire in the middle of the room, bedrolls round it
      const x = r.cx + (rnd()-0.5)*cw*0.2, y = r.cy + (rnd()-0.5)*ch*0.2;
      if(clear(x,y,40)){ const b = {k:'bonfire', x, y, rr:40}; decor.push(b); bonfires.push(b); block(x, y, 46, 46); r.fire = b; }
    }
    // barrels and crates stacked along the walls
    const nStack = 1 + Math.floor(rnd()*3);
    for(let s=0; s<nStack; s++){
      const wallSide = Math.floor(rnd()*4);
      let x = wallSide===0 ? r.x0+inner : wallSide===1 ? r.x1-inner : r.x0+inner+rnd()*(cw-inner*2);
      let y = wallSide===2 ? r.y0+inner : wallSide===3 ? r.y1-inner : r.y0+inner+rnd()*(ch-inner*2);
      const n = 2 + Math.floor(rnd()*3);
      for(let k=0;k<n;k++){
        const px = x + (wallSide>=2 ? k*34 : (rnd()-0.5)*10), py = y + (wallSide<2 ? k*30 : (rnd()-0.5)*10);
        if(!clear(px,py,18)) continue;
        const kind = rnd()<0.55 ? 'barrel' : 'crate', s1 = 1.05 + rnd()*0.25;
        decor.push({k:kind, x:px, y:py, s:s1, rr:18}); block(px, py, 28, 28);
      }
    }
    if(o.theme==='fht'){   // v554: dwarven rooms -- benches along a wall, now and then a statue of an old king
      if(rnd() < 0.55){ const top = rnd()<0.5, n = 1 + Math.floor(rnd()*2);
        for(let k=0;k<n;k++){ const x = r.x0 + 100 + k*120 + rnd()*30, y = top ? r.y0 + 60 : r.y1 - 60; if(!clear(x, y, 40)) continue; block(x, y, 74, 26); decor.push({k:'bench', x, y, rr:40}); } }
      if(!r.stairsRoom && rnd() < 0.3){ const x = r.cx + (rnd()-0.5)*cw*0.3, y = r.cy + (rnd()-0.5)*ch*0.3; if(clear(x, y, 34)){ block(x, y, 46, 46); decor.push({k:'statue', x, y, rr:34}); } }
    }
    // beds in about a third of the rooms
    else if(rnd() < 0.35){
      const nb = 1 + Math.floor(rnd()*2);
      for(let k=0;k<nb;k++){
        const top = rnd()<0.5, x = r.x0 + 90 + k*110 + rnd()*40, y = top ? r.y0 + 62 : r.y1 - 100;
        if(!clear(x+30, y+19, 44)) continue;
        const o = block(x+30, y+19, 60, 38); o.noDraw = true;
        decor.push({k:'bed', x:x+30, y:y+19, rr:44, bed:{x:o.x, y:o.y, w:o.w, h:o.h}});
      }
    }
  }
  // one dead-end room hides a supply cache
  const deadRooms = rooms.filter(r=>r.dead), cr = deadRooms.length ? deadRooms[Math.floor(rnd()*deadRooms.length)] : null;
  let cache = null;
  if(cr){ for(let t=0;t<30;t++){ const x = cr.cx + (rnd()-0.5)*cw*0.4, y = cr.cy + (rnd()-0.5)*ch*0.4; if(clear(x,y,30)){ cache = {x:Math.round(x), y:Math.round(y), r:22, opened:false}; cr.cache = true; break; } } }
  if(hall && o.hallFires){   // bonfires either side of the hall door, where the trolls keep watch
    for(const fy of [-1, 1]){ const b = {k:'bonfire', x:mw + 360, y:hall.door.y + fy*230, rr:40}; if(b.y > 120 && b.y < h-120){ decor.push(b); bonfires.push(b); block(b.x, b.y, 46, 46); } }
  }
  return { w, h, obstacles, floor, rooftop:!!o.hall, maze:true, entranceSide, entrance, stairs, waypoint, beacon:null, rooms, doors, hall, witch, witchSpot:witch ? {x:witch.x, y:witch.y} : null,
    lhSeed:seed, lhDecor:decor, bonfires, lhCache:cache, wallPal:o.wallPal, mw };
}
// v552: the furniture and the cache
function pushLhDecorDrawables(g, drawables){
  const t = g.tower; if(!t || !t.lhDecor) return;
  const cam = g.camera, clk = g.clock||0;
  for(const d of t.lhDecor){
    const i = toIso(d.x, d.y); if(cam && (i.x<cam.x-160 || i.x>cam.x+W+160 || i.y<cam.y-120 || i.y>cam.y+H+160)) continue;
    drawables.push({depth:d.x+d.y, draw: d.k==='bonfire' ? ()=>drawCampFireIso(d, clk) : d.k==='bed' ? ()=>drawBedIso(d.bed) : (d.k==='bench' || d.k==='statue') ? ()=>drawFhtDecor(d) : ()=>drawRvDecor(d, clk)});
  }
  const c = t.lhCache;
  if(c) drawables.push({depth:c.x+c.y, draw:()=>drawChestIso(c)});
}
function lhCacheTick(g, p){
  const t = g.tower, c = t && t.lhCache; if(!c) return;
  const k = 'cache'+t.floor, st = t.ft ? g.ftStore : t.fht ? g.fhtStore : g.lhStore;
  if(st && st[k]) c.opened = true;
  if(c.opened || dist(p, c) > c.r + p.r + 4) return;
  c.opened = true; if(st) st[k] = true;
  owLootChest(g, c, false); showMsg(t.ft ? 'A goblin stash' : t.fht ? 'A dwarven strongbox' : 'A bandit supply cache', 1.8);
}
// Floors 1-4: a handful of Bandits/Bandit Archers (reusing Withered Crossroads'
// exact monster types), a modest count appropriate to the small floor size
// rather than the overworld's sprawling pack system -- just a simple fixed
// spawnEnemy() call per enemy, same as how the Mine spreads a floor's count
// across spawnEnemy() calls in spawnWave(). Count edges up slightly with
// floor number for a gentle ramp toward the rooftop.
function spawnLighthouseFloor(g, floor){
  const room = g.room;
  if(!room.rooftop && room.maze){
    // v552: bandits in about nine rooms of ten -- round the bonfire where there is one -- bats in some, a brute near the stairs
    const spot = (r, cx, cy, rad)=>{ for(let t=0;t<40;t++){ const x = cx!=null ? cx+rand(-rad,rad) : rand(r.x0+80, r.x1-80), y = cy!=null ? cy+rand(-rad,rad) : rand(r.y0+80, r.y1-80); if(x>r.x0+50 && x<r.x1-50 && y>r.y0+50 && y<r.y1-50 && !posBlockedByObstacles(x,y,22,room.obstacles) && dist({x,y},room.entrance)>260) return {x,y}; } return null; };
    for(const r of room.rooms){
      if(r.start) continue;
      if(r.fire){
        const n = 3 + Math.floor(Math.random()*3) + (floor>=3 ? 1 : 0);
        for(let k=0;k<n;k++){
          const a = (k/n)*Math.PI*2 + rand(-0.3,0.3), rr = rand(72, 104), q = {x:r.fire.x + Math.cos(a)*rr, y:r.fire.y + Math.sin(a)*rr*0.9};
          if(posBlockedByObstacles(q.x, q.y, 22, room.obstacles)) continue;
          const e = spawnEnemy(g, k===0 && Math.random()<0.6 ? 'banditarcher' : 'bandit', q);
          if(e){ e.homeX = q.x; e.homeY = q.y; e.wanderRadius = 14; e.facing = Math.atan2(r.fire.y-q.y, r.fire.x-q.x); }
        }
      } else if(Math.random() < 0.9){
        const nB = 1 + Math.floor(Math.random()*2) + (floor>=3 ? 1 : 0), nA = Math.random()<0.5 ? 1 : 0;
        for(let k=0;k<nB;k++){ const q = spot(r); if(q) spawnEnemy(g, 'bandit', q); }
        for(let k=0;k<nA;k++){ const q = spot(r); if(q) spawnEnemy(g, 'banditarcher', q); }
      }
      if(Math.random() < 0.18 && typeof cryptBat==='function'){ const c = spot(r); if(c) for(let k=0, n=3+Math.floor(Math.random()*3); k<n; k++) cryptBat(g, c.x+rand(-50,50), c.y+rand(-50,50)); }
      if(r.stairsRoom || (r.steps>0 && dist({x:r.cx,y:r.cy}, room.stairs) < 500)){ const q = spot(r); if(q) spawnEnemy(g, 'banditbrute', q); }
    }
    // v552: ONE Map Bearer (ringed in gold), on the ground floor; its map charts every floor of this climb
    if(floor===1){ const ent = room.entrance, cand = g.enemies.filter(e=>e.hp>0 && e.type==='bandit').map(e=>({e, d:dist(e,ent)})).filter(c=>c.d>=300).sort((x,y)=>Math.abs(x.d-800)-Math.abs(y.d-800));
      const b = cand.length ? cand[0].e : null;
      if(b){ b.mapCarrier = true; b.mapHolder = true; b.hp = Math.round(b.hp*2); b.maxHp = Math.round(b.maxHp*2); b.r = Math.round(b.r*1.12); b.xpMul = Math.max(b.xpMul||1, 2.5); } }
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
  g.depth = [11,12,13,14,16][Math.max(0,Math.min(4,(g.lighthouseFloor||1)-1))]; // v529: climbs from the Crossroads' Lv 10 -- floors 11/12/13/14, rooftop 16
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

