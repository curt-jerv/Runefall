// ---------------- Ancient Ruins (v120): 5 big maze levels beneath Lakeside Ruins ----------------
// Each level is a fresh recursive-backtracker maze (plus a few knocked-through walls so it
// isn't all dead ends). Level 1's entrance is the way back to Lakeside Ruins, levels 2-5 have
// stairs up, levels 1-4 have stairs down at the farthest cell, and level 5 ends in a guarded
// chest. A waypoint sits at the entrance of level 2.
const ANCIENT_RUINS_FLOORS = 1;   // v276: floor 1 is the ruins (Templar Revenant); the flooded temple and the Kraken's depths are sub-zones below it
const RUINS_CELL = 250, RUINS_PAD = 50; // 5 tiles per cell: room = tiles 1..3, corridors = tiles 4..5 (aligned to the 50px wall grid)
function makeAncientRuinsFloor(floor, opts){
  const fhd = !!(opts && opts.fhd);
  const N = (opts && opts.N) || (11 + floor); // 12..16 cells per side
  const CS = RUINS_CELL, PAD = RUINS_PAD;
  const w = N*CS, h = N*CS;
  const open = []; // open[cy][cx] = {e:bool, s:bool}
  const seen = [];
  for(let y=0;y<N;y++){ open.push([]); seen.push([]); for(let x=0;x<N;x++){ open[y].push({e:false,s:false}); seen[y].push(false); } }
  const carve = (x1,y1,x2,y2)=>{
    if(x2===x1+1) open[y1][x1].e = true;
    else if(x2===x1-1) open[y2][x2].e = true;
    else if(y2===y1+1) open[y1][x1].s = true;
    else open[y2][x2].s = true;
  };
  const sx = 0, sy = N-1;
  const stack = [[sx,sy]]; seen[sy][sx] = true;
  while(stack.length){
    const [cx,cy] = stack[stack.length-1];
    const nb = [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]].filter(([nx,ny])=>nx>=0&&ny>=0&&nx<N&&ny<N&&!seen[ny][nx]);
    if(!nb.length){ stack.pop(); continue; }
    const [nx,ny] = nb[Math.floor(Math.random()*nb.length)];
    carve(cx,cy,nx,ny); seen[ny][nx] = true; stack.push([nx,ny]);
  }
  // knock through some walls -> loops
  for(let i=0;i<N*2;i++){
    const cx = Math.floor(Math.random()*(N-1)), cy = Math.floor(Math.random()*(N-1));
    if(Math.random()<0.5) open[cy][cx].e = true; else open[cy][cx].s = true;
  }
  // BFS from start for the farthest cell
  const dmap = []; for(let y=0;y<N;y++){ dmap.push(new Array(N).fill(-1)); }
  const q = [[sx,sy]]; dmap[sy][sx] = 0; let far = [sx,sy];
  while(q.length){
    const [cx,cy] = q.shift();
    const d = dmap[cy][cx];
    if(d>dmap[far[1]][far[0]]) far = [cx,cy];
    const links = [];
    if(cx<N-1 && open[cy][cx].e) links.push([cx+1,cy]);
    if(cx>0 && open[cy][cx-1].e) links.push([cx-1,cy]);
    if(cy<N-1 && open[cy][cx].s) links.push([cx,cy+1]);
    if(cy>0 && open[cy-1][cx].s) links.push([cx,cy-1]);
    for(const [nx,ny] of links){ if(dmap[ny][nx]<0){ dmap[ny][nx] = d+1; q.push([nx,ny]); } }
  }
  // v413: the boss chamber must be a real distance (straight-line) from the entrance, not just far by path
  { const minD = N*0.62; let best = null, bd = -1;
    for(let cy=0;cy<N;cy++) for(let cx=0;cx<N;cx++){ if(dmap[cy][cx]<0) continue; const ed = Math.hypot(cx-sx, cy-sy); if(ed>=minD && dmap[cy][cx]>bd){ bd = dmap[cy][cx]; best = [cx,cy]; } }
    if(best) far = best;
    else { let md = -1; for(let cy=0;cy<N;cy++) for(let cx=0;cx<N;cx++){ const ed = Math.hypot(cx-sx, cy-sy); if(ed>md){ md = ed; far = [cx,cy]; } } } }
  const floorRects = [];
  const RW = CS-PAD*2; // 150: room width (3 tiles)
  const rooms = [];
  for(let cy=0;cy<N;cy++){
    for(let cx=0;cx<N;cx++){
      const r = {x:cx*CS+PAD, y:cy*CS+PAD, w:RW, h:RW};
      floorRects.push(r);
      if(!(cx===sx&&cy===sy) && !(cx===far[0]&&cy===far[1])) rooms.push(r);
      if(open[cy][cx].e) floorRects.push({x:cx*CS+CS-PAD, y:cy*CS+PAD, w:PAD*2, h:RW});
      if(open[cy][cx].s) floorRects.push({x:cx*CS+PAD, y:cy*CS+CS-PAD, w:RW, h:PAD*2});
    }
  }
  const entranceRoom = {x:sx*CS+PAD, y:sy*CS+PAD, w:RW, h:RW};
  // the far cell becomes a full-cell chamber (tiles 0..4) -- boss arena on the last floor
  let exitRoom = {x:far[0]*CS, y:far[1]*CS, w:CS, h:CS};
  if(!fhd && floor===ANCIENT_RUINS_FLOORS){
    // Boss arena: the far cell plus its neighbours toward the maze interior (up to 3x3 cells),
    // opened into one big chamber so the boss has room to work.
    const ax0 = Math.max(0, far[0]-(far[0]>=N-1?2:1)), ax1 = Math.min(N-1, ax0+2);
    const ay0 = Math.max(0, far[1]-(far[1]>=N-1?2:1)), ay1 = Math.min(N-1, ay0+2);
    exitRoom = {x:ax0*CS, y:ay0*CS, w:(ax1-ax0+1)*CS, h:(ay1-ay0+1)*CS};
    for(let i=rooms.length-1;i>=0;i--){ const r=rooms[i]; if(r.x>=exitRoom.x && r.x<exitRoom.x+exitRoom.w && r.y>=exitRoom.y && r.y<exitRoom.y+exitRoom.h) rooms.splice(i,1); }
  }
  if(fhd && floor===FHD_FLOORS){
    const A = 4, ax0 = clamp(far[0]-2, 0, N-A), ay0 = clamp(far[1]-2, 0, N-A);
    exitRoom = {x:ax0*CS, y:ay0*CS, w:A*CS, h:A*CS};
    for(let i=rooms.length-1;i>=0;i--){ const r=rooms[i]; if(r.x>=exitRoom.x && r.x<exitRoom.x+exitRoom.w && r.y>=exitRoom.y && r.y<exitRoom.y+exitRoom.h) rooms.splice(i,1); }
  }
  floorRects.push(exitRoom);
  const obstacles = darkCryptCarveObstacles(floorRects, w, h);
  const ox = sx*CS, oy = sy*CS;
  const entrance = {x:ox+84, y:oy+CS-84, r:30};
  const endC = {x:far[0]*CS+CS/2, y:far[1]*CS+CS/2};
  const stairsDown = floor<(fhd?FHD_FLOORS:ANCIENT_RUINS_FLOORS) ? {x:endC.x, y:endC.y, r:30} : null;
  const chestSpot = floor===(fhd?FHD_FLOORS:ANCIENT_RUINS_FLOORS) ? {x:endC.x, y:endC.y, r:20} : null;
  const waypoint = null;   // v283: the Ancient Ruins waypoint now stands just inside the Flooded Temple
  return { w, h, obstacles, floorRects, rooms, entranceRoom, exitRoom, floor, entrance, waypoint, stairsDown, chestSpot, mazeN:N, fhd, pal: fhd?FHD_PAL[floor]:undefined, wallPal: fhd?FHD_WALL[floor]:undefined };
}
// Same roster as the Cursed Cemetery (skeletons, skeleton archers, spiders,
// skeletal brutes), with brutes getting more common on deeper floors.
const RUINS_MONSTERS_BY_FLOOR = {
  1:['skeleton','skeleton','skeletonarcher','spider'],
  2:['skeleton','skeleton','skeletonarcher','spider','skeletonbrute'],
  3:['skeleton','skeletonarcher','spider','skeletonbrute'],
  4:['skeleton','skeletonarcher','spider','skeletonbrute','skeletonbrute'],
  5:['skeleton','skeletonarcher','spider','skeletonbrute','skeletonbrute'],
};
// ---------------- v417: the Templar Revenant (Ancient Ruins mini boss; replaces the old Ruins Warlord) ----------------
// An old Templar protector, now undead: black-and-blue plate, moss-grown. Scales with the area level like any monster.
//   Shield Slam   -- close-range ring around him.
//   Grave Smite   -- a marked patch of ground erupts in blue fire a moment later (3 patches when enraged).
//   Raise Dead    -- at 70% and 35% life (and now and then) he calls skeletons from the ground.
const REV_HP_MULT = 10, REV_DMG_MULT = 0.6, REV_R = 24, REV_SLAM_TELE = 0.8, REV_SLAM_R = 125, REV_SMITE_TELE = 1.05, REV_SMITE_R = 92, REV_RAISE_TELE = 1.3, REV_RAISE_R = 190, REV_MAX_ADDS = 6, REV_NAME = 'Templar Revenant';
function initRevenant(e){
  e.rev = true; e.bossName = REV_NAME; e.isLairBoss = true; e.r = REV_R; e.baseR = REV_R;
  e.maxHp = Math.round(e.maxHp*REV_HP_MULT); e.hp = e.maxHp; e.dmg *= REV_DMG_MULT; e.armor = Math.max(e.armor||0, 14);
  e.speed = 68; e.baseSpeed = e.speed; e.atkCdMax = 1.5; e.baseAtkCd = e.atkCdMax;
  e.rvState = 'chase'; e.rvT = 0; e.rvCd = 2.4; e.rvRaised = 0; e.rvZones = []; e.rvAddT = 14; e.rvEnraged = false; e.rvRaiseN = 3;
}
function revAdds(g){ let n = 0; for(const x of g.enemies) if(x.rvAdd && x.hp>0) n++; return n; }
function updateRevenant(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player, frac = e.hp/e.maxHp;
  const face = (ang)=>{ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  const hitArea = (cx, cy, R, mult)=>{
    if(dist({x:cx,y:cy}, p) < R) playerDamage(g, e.dmg*mult*TELE_DMG_MULT, e, null);   // v456: only inside the drawn ring
    if(g.followers) for(const f of g.followers) if(dist({x:cx,y:cy}, f) < R) applyFollowerDamage(g, f, e.dmg*mult*TELE_DMG_MULT, e);
  };
  e.moving = false;
  if(!e.rvFast){ e.rvFast = true; e.baseSpeed = (e.baseSpeed||e.speed)*2; e.speed *= 2; }   // v456
  if(!e.rvEnraged && frac < 0.3){ e.rvEnraged = true; e.speed = e.baseSpeed*1.25; showMsg('The Revenant’s eyes blaze', 1.6, '#7fd0ff'); g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:150, color:'#5fb8ff'}); }
  // ground patches resolve on their own clock, whatever he is doing
  for(let i=e.rvZones.length-1;i>=0;i--){
    const z = e.rvZones[i]; z.t -= dt;
    if(z.t<=0){
      hitArea(z.x, z.y, z.r, 1.0);
      g.particles.push({type:'burst', x:z.x, y:z.y, t:0.45, max:0.45, color:'#6fc8ff'}); g.particles.push({type:'ring', x:z.x, y:z.y, t:0.45, max:0.45, r:z.r, color:'#3a8cff'});
      e.rvZones.splice(i,1);
    }
  }
  const raise = (n)=>{
    const cap = Math.min(n, REV_MAX_ADDS - revAdds(g));
    for(let i=0;i<cap;i++){
      const a = Math.random()*Math.PI*2, rd = REV_RAISE_R*(0.45+Math.random()*0.5);
      const sk = spawnEnemy(g, (i===2 ? 'skeletonarcher' : 'skeleton'), {x:clamp(e.x+Math.cos(a)*rd,40,room.w-40), y:clamp(e.y+Math.sin(a)*rd,40,room.h-40)});
      if(sk){ sk.rvAdd = true; sk.engaged = true; sk.aggroRange = 99999; g.particles.push({type:'burst', x:sk.x, y:sk.y, t:0.4, max:0.4, color:'#7fc8ff'}); }
    }
  };
  const st = e.rvState;
  if(st==='chase'){
    e.rvCd -= dt; e.rvAddT -= dt; e.atkCd -= dt;
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+2, dt)) return;
    if(frac < 0.7 - 0.35*e.rvRaised && e.rvRaised < 2){ e.rvRaised++; e.rvState = 'raise'; e.rvT = REV_RAISE_TELE; e.rvRaiseN = 3; e.windT = 0; showMsg('The dead answer the Revenant’s call', 1.8, '#9fd8ff'); return; }
    if(e.rvAddT <= 0 && revAdds(g) < 3){ e.rvAddT = 16; e.rvState = 'raise'; e.rvT = REV_RAISE_TELE*0.8; e.rvRaiseN = 2; e.windT = 0; return; }
    if(e.rvCd <= 0 && d < 460){
      e.windT = 0;
      if(d < 150 && Math.random() < 0.6){ e.rvState = 'slamTele'; e.rvT = REV_SLAM_TELE; }
      else {
        e.rvState = 'smiteTele'; e.rvT = REV_SMITE_TELE; face(Math.atan2(target.y-e.y, target.x-e.x));
        const T = REV_SMITE_TELE, n = e.rvEnraged ? 3 : 1;
        for(let i=0;i<n;i++){ const a = Math.random()*6.28, rd = i===0 ? 0 : 130+Math.random()*120; e.rvZones.push({x:clamp(target.x+Math.cos(a)*rd,60,room.w-60), y:clamp(target.y+Math.sin(a)*rd,60,room.h-60), r:REV_SMITE_R, t:T, max:T}); }
      }
      return;
    }
    if(d > e.r+target.r+2){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt;
      e.moving = true; face(ang);
    } else if(e.atkCd<=0){ beginEnemyMelee(e); }
  } else if(st==='slamTele'){
    e.rvT -= dt; e.atkAnimT = 0.1; face(Math.atan2(target.y-e.y, target.x-e.x));
    if(e.rvT<=0){
      hitArea(e.x, e.y, REV_SLAM_R, 0.9);
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.35, max:0.35, color:'#9fc4e8'}); g.particles.push({type:'ring', x:e.x, y:e.y, t:0.45, max:0.45, r:REV_SLAM_R, color:'#8ab8e8'});
      e.rvState = 'recover'; e.rvT = 0.9;
    }
  } else if(st==='smiteTele'){
    e.rvT -= dt; e.atkAnimT = 0.1;
    if(e.rvT<=0){ e.rvState = 'recover'; e.rvT = 0.8; }
  } else if(st==='raise'){
    e.rvT -= dt; e.atkAnimT = 0.1;
    if(e.rvT<=0){ raise(e.rvRaiseN); g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:REV_RAISE_R, color:'#7fc8ff'}); e.rvState = 'recover'; e.rvT = 0.9; }
  } else {
    e.rvT -= dt;
    if(e.rvT<=0){ e.rvState = 'chase'; e.rvCd = e.rvEnraged ? 1.9 : 2.7; }
  }
  e.x = clamp(e.x, e.r, room.w-e.r); e.y = clamp(e.y, e.r, room.h-e.r);
}
function drawRevenantTelegraph(e){
  const flat = (x, y, R, frac, col, solid)=>{
    const iso = toIso(x,y);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba('+col+','+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,0,R*ISO_KX,0,7); ctx.stroke();
    ctx.fillStyle='rgba('+col+','+(0.10+frac*0.24)+')'; ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*(solid?1:frac),0,7); ctx.fill();
    ctx.restore();
  };
  for(const z of e.rvZones) flat(z.x, z.y, z.r, clamp(1-z.t/z.max,0,1), '70,160,255', false);
  if(e.rvState==='slamTele') flat(e.x, e.y, REV_SLAM_R, clamp(1-e.rvT/REV_SLAM_TELE,0,1), '170,200,235', false);
  else if(e.rvState==='raise') flat(e.x, e.y, REV_RAISE_R, clamp(1-e.rvT/REV_RAISE_TELE,0,1), '110,200,150', false);
}
// black / blue plate with moss, glowing blue eyes, a cracked kite shield and a pale-blue blade
function drawRevenantIso(e){
  const iso = toIso(e.x,e.y), s = e.r/16*1.1, face = e.faceSign||1, t = e.animT||0, flash = e.hitT>0;
  const C = (c)=> flash ? '#e8f2ff' : c;
  const walk = e.moving ? Math.sin(t*9) : 0, bob = e.moving ? Math.abs(Math.sin(t*9))*1.6 : Math.sin(t*2)*1.1;
  const tele = e.rvState==='slamTele' || e.rvState==='smiteTele' || e.rvState==='raise', swing = (e.atkAnimT||0)>0 ? clamp(e.atkAnimT/0.35,0,1) : 0;
  drawShadow(iso.x, iso.y, 19*s, 8*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle='rgba(70,150,255,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,e.r*1.25,0,7); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s*1.06); ctx.lineJoin = 'round';
  // tattered cape
  const flut = Math.sin(t*5)*2 + walk*2;
  ctx.fillStyle = C('#0f1a2c'); ctx.beginPath(); ctx.moveTo(-6,-46+bob); ctx.quadraticCurveTo(-24+flut,-20,-17-flut*0.4,2); ctx.lineTo(-13,-3); ctx.lineTo(-10,3); ctx.lineTo(-6,-2); ctx.lineTo(-3,2); ctx.lineTo(-2,-40+bob); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C('#3c5a30'); ctx.beginPath(); ctx.ellipse(-12+flut*0.3,-24,3.2,5,0.3,0,7); ctx.fill();
  // legs: greaves + sabatons
  for(const [lx,sw] of [[-7.5,-walk*6],[1.5,walk*6]]){
    const ly = sw*0.15;
    ctx.fillStyle = C('#1a2234'); roundRect(lx,-21-ly,6.6,21+ly,2.4); ctx.fill(); ctx.strokeStyle='#05070c'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle = C('#2e4468'); ctx.beginPath(); ctx.ellipse(lx+3.3,-12-ly*0.6,3.4,2.5,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C('#10151f'); ctx.beginPath(); ctx.moveTo(lx-0.6,-1.6); ctx.lineTo(lx+8.8,-1.6); ctx.lineTo(lx+11,1.2); ctx.lineTo(lx-0.6,1.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C('#46663a'); ctx.beginPath(); ctx.ellipse(lx+3,-5-ly*0.4,2.2,1.4,0,0,7); ctx.fill();
  }
  // torn tabard
  ctx.fillStyle = C('#14284a'); ctx.beginPath(); ctx.moveTo(-6,-26+bob); ctx.lineTo(6,-26+bob); ctx.lineTo(6.6,-8); ctx.lineTo(3,-10.5); ctx.lineTo(0,-6); ctx.lineTo(-3.4,-10); ctx.lineTo(-6.6,-7); ctx.closePath(); ctx.fill();
  // breastplate
  const tg = ctx.createLinearGradient(-11,-47+bob,11,-20+bob); tg.addColorStop(0,'#3b4a6c'); tg.addColorStop(0.5,'#1d2740'); tg.addColorStop(1,'#0c111c');
  ctx.fillStyle = flash ? '#e8f2ff' : tg; roundRect(-10.5,-47+bob,21,26,6); ctx.fill(); ctx.strokeStyle='#05070c'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.fillStyle='rgba(120,170,255,0.22)'; ctx.fillRect(-8.5,-44+bob,2,15);
  // faded templar cross, faintly glowing
  ctx.save(); ctx.shadowColor='rgba(90,190,255,0.9)'; ctx.shadowBlur=7; ctx.fillStyle = C('#5fb4dc');
  ctx.fillRect(-1.3,-42+bob,2.6,13); ctx.fillRect(-5,-38+bob,10,2.6); ctx.restore();
  ctx.fillStyle = C('#14192a'); ctx.fillRect(-10.5,-24+bob,21,3.2);
  // moss on the plate
  ctx.fillStyle = C('#46663a'); for(const [mx,my,mr] of [[-8,-40,3],[7,-31,2.4],[-4,-24,2.2],[9,-43,2]]){ ctx.beginPath(); ctx.ellipse(mx,my+bob,mr,mr*0.7,0.4,0,7); ctx.fill(); }
  ctx.fillStyle = C('#5f8248'); for(const [mx,my] of [[-7,-41],[7.6,-31.6]]){ ctx.beginPath(); ctx.arc(mx,my+bob,1.1,0,7); ctx.fill(); }
  // pauldrons
  for(const sg of [-1,1]){
    ctx.save(); ctx.translate(sg*11.5,-44+bob);
    const pg = ctx.createRadialGradient(-1.5,-1.5,0.5,0,0,7.4); pg.addColorStop(0,'#3e4f74'); pg.addColorStop(1,'#10162a');
    ctx.fillStyle = flash ? '#e8f2ff' : pg; ctx.beginPath(); ctx.ellipse(0,0,7,5.8,0,0,7); ctx.fill(); ctx.strokeStyle='#05070c'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle = C('#46663a'); ctx.beginPath(); ctx.ellipse(sg*-1.5,-2.4,3.6,2,0.2,0,7); ctx.fill();
    ctx.restore();
  }
  // shield arm (front): cracked kite shield
  ctx.save(); ctx.translate(-14,-30+bob+(tele?-3:0));
  ctx.fillStyle = C('#101a30'); ctx.beginPath(); ctx.moveTo(-8,-14); ctx.lineTo(8,-14); ctx.lineTo(8.5,2); ctx.lineTo(0,13); ctx.lineTo(-8.5,2); ctx.closePath(); ctx.fill(); ctx.strokeStyle='#4a6288'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.save(); ctx.shadowColor='rgba(90,190,255,0.8)'; ctx.shadowBlur=6; ctx.fillStyle = C('#4aa6d4'); ctx.fillRect(-1.2,-10,2.4,18); ctx.fillRect(-5,-5,10,2.4); ctx.restore();
  ctx.strokeStyle='rgba(0,0,0,0.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(5,-13); ctx.lineTo(1.5,-4); ctx.lineTo(4.5,1); ctx.stroke();
  ctx.fillStyle = C('#46663a'); ctx.beginPath(); ctx.ellipse(-5.6,-11,3.4,2,0.4,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(6,6,2.4,1.6,0.2,0,7); ctx.fill();
  ctx.restore();
  // sword arm (back): raised in the telegraphs, swings on a hit
  ctx.save(); ctx.translate(13,-34+bob);
  const rot = tele ? 0.2 : (swing>0 ? -0.9+ (1-swing)*2.2 : -0.35);
  if(tele) ctx.translate(2,-7);
  ctx.rotate(rot);
  ctx.fillStyle = C('#1a2234'); roundRect(-2,-1,4,10,1.5); ctx.fill();
  ctx.fillStyle = C('#4a6288'); ctx.fillRect(-4.5,-3,9,2.6);
  ctx.save(); ctx.shadowColor='rgba(110,200,255,0.9)'; ctx.shadowBlur=8; ctx.fillStyle = C('#a9c6dc');
  ctx.beginPath(); ctx.moveTo(-1.8,-3); ctx.lineTo(0,-30); ctx.lineTo(1.8,-3); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.restore();
  // helm: great helm, glowing eyes, mossy crown, tattered plume
  ctx.fillStyle = C('#1a2338'); roundRect(-6.2,-60+bob,12.4,15,4); ctx.fill(); ctx.strokeStyle='#05070c'; ctx.lineWidth=1.3; ctx.stroke();
  ctx.fillStyle = C('#2e4468'); ctx.fillRect(-6.2,-54+bob,12.4,1.8);
  ctx.fillStyle = '#04060a'; ctx.fillRect(-4.6,-52.4+bob,9.2,2.4);
  ctx.save(); ctx.shadowColor='rgba(90,210,255,1)'; ctx.shadowBlur=9; ctx.fillStyle = flash ? '#ffffff' : '#8fe8ff'; ctx.fillRect(-3.8,-51.8+bob,2.6,1.4); ctx.fillRect(1.2,-51.8+bob,2.6,1.4); ctx.restore();
  ctx.fillStyle = C('#46663a'); ctx.beginPath(); ctx.ellipse(-1.5,-60+bob,4.6,2,0.2,0,7); ctx.fill(); ctx.fillStyle = C('#5f8248'); ctx.beginPath(); ctx.arc(2,-61+bob,1.2,0,7); ctx.fill();
  ctx.fillStyle = C('#0f1a2c'); ctx.beginPath(); ctx.moveTo(-1,-60+bob); ctx.quadraticCurveTo(-9+Math.sin(t*5)*2,-64+bob,-10,-52+bob); ctx.lineTo(-7,-56+bob); ctx.lineTo(-5,-50+bob); ctx.lineTo(-2,-58+bob); ctx.closePath(); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 56*s, e.r*1.6, e.hp, e.maxHp);
  ctx.save(); ctx.font='bold 11px Alegreya,Georgia, serif'; ctx.textAlign='center'; ctx.fillStyle='rgb(120,190,255)'; ctx.shadowColor='rgba(0,0,0,0.9)'; ctx.shadowBlur=4;
  ctx.fillText(e.bossName, iso.x, iso.y-56*s-8); ctx.restore();
}

