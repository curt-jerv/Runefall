// ---------- Organic cave generator (v176) ----------
// Lairs/caves (Raptor Lair, Spider Lair, Bear Cave) use blobby, wobbly-edged
// caverns joined by winding wide passages instead of the Mine's rectangles.
// Output matches genRoom()'s shape (obstacles/floorRects/rooms/entranceRoom/
// exitRoom/entranceSpawn) plus floorMask + organic:kind for the renderer.
function organicCaveBuild(spec){
  const CELL = 50, w = spec.w, h = spec.h, kind = spec.kind;
  const cols = Math.ceil(w/CELL), rows = Math.ceil(h/CELL);
  const data = new Uint8Array(cols*rows);
  const chs = spec.chambers;
  for(const c of chs){ c.p1 = Math.random()*6.28; c.p2 = Math.random()*6.28; if(c.a1==null) c.a1 = 0.12+Math.random()*0.08; if(c.a2==null) c.a2 = 0.06+Math.random()*0.06; }
  const inCh = (c,x,y)=>{
    const dx = x-c.x, dy = y-c.y, ang = Math.atan2(dy,dx);
    const m = 1 + c.a1*Math.sin(3*ang+c.p1) + c.a2*Math.sin(5*ang+c.p2);
    return (dx*dx)/(c.rx*c.rx) + (dy*dy)/(c.ry*c.ry) < m*m;
  };
  const segs = [], blobs = [];
  for(const [ia,ib] of spec.links){
    const A = chs[ia], B = chs[ib];
    const L = dist(A,B), nx = -(B.y-A.y)/L, ny = (B.x-A.x)/L;
    let px = A.x, py = A.y;
    const N = 5;
    for(let i=1;i<=N;i++){
      const t = i/N, off = (i<N ? rand(-0.14,0.14)*L : 0);
      const qx = A.x+(B.x-A.x)*t+nx*off, qy = A.y+(B.y-A.y)*t+ny*off;
      segs.push({ax:px,ay:py,bx:qx,by:qy,r:spec.tunnelR*rand(0.85,1.2)});
      px = qx; py = qy;
    }
  }
  for(const c of chs){
    const n = 3+Math.floor(Math.random()*3);
    for(let i=0;i<n;i++){
      const a = Math.random()*6.28, rr = Math.min(c.rx,c.ry)*rand(0.35,0.55);
      blobs.push({x:c.x+Math.cos(a)*c.rx*0.92, y:c.y+Math.sin(a)*c.ry*0.92, r:rr});
    }
  }
  const segD = (s,x,y)=>{
    const vx = s.bx-s.ax, vy = s.by-s.ay, wx = x-s.ax, wy = y-s.ay;
    const t = clamp((wx*vx+wy*vy)/(vx*vx+vy*vy||1),0,1);
    return Math.hypot(x-(s.ax+vx*t), y-(s.ay+vy*t));
  };
  for(let iy=0; iy<rows; iy++){
    for(let ix=0; ix<cols; ix++){
      const x = ix*CELL+CELL/2, y = iy*CELL+CELL/2;
      if(ix<2||iy<2||ix>=cols-2||iy>=rows-2) continue;
      let f = false;
      for(const c of chs){ if(inCh(c,x,y)){ f = true; break; } }
      if(!f) for(const sg of segs){ if(segD(sg,x,y) < sg.r){ f = true; break; } }
      if(!f) for(const b of blobs){ if(Math.hypot(x-b.x,y-b.y) < b.r){ f = true; break; } }
      if(f) data[iy*cols+ix] = 1;
    }
  }
  const obstacles = [];
  for(let iy=0; iy<rows; iy++){
    for(let ix=0; ix<cols; ix++){
      if(data[iy*cols+ix]) continue;
      let b = false;
      for(let dy=-1; dy<=1 && !b; dy++) for(let dx=-1; dx<=1; dx++){
        const nx=ix+dx, ny=iy+dy;
        if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
        if(data[ny*cols+nx]){ b = true; break; }
      }
      if(b) obstacles.push({x:ix*CELL, y:iy*CELL, w:CELL, h:CELL, mazeWall:true, organic:kind});
    }
  }
  // floorRects: merge horizontal runs, then identical runs on consecutive rows
  const floorRects = []; let open = {};
  for(let iy=0; iy<=rows; iy++){
    const nowOpen = {};
    let ix = 0;
    while(iy<rows && ix<cols){
      if(!data[iy*cols+ix]){ ix++; continue; }
      let j = ix; while(j+1<cols && data[iy*cols+j+1]) j++;
      const key = ix+'-'+j;
      if(open[key]){ open[key].h += CELL; nowOpen[key] = open[key]; }
      else { const r = {x:ix*CELL, y:iy*CELL, w:(j-ix+1)*CELL, h:CELL}; floorRects.push(r); nowOpen[key] = r; }
      ix = j+1;
    }
    open = nowOpen;
  }
  const box = (c,k)=>({x:c.x-c.rx*k, y:c.y-c.ry*k, w:c.rx*2*k, h:c.ry*2*k});
  const K = 0.46;
  const ent = chs[spec.entranceIdx], ex = chs[spec.exitIdx];
  const rooms = spec.mainIdx.map(i=>box(chs[i],K));
  return { w, h, obstacles, floorRects, floorMask:{cols,rows,CELL,data}, organic:kind,
    entranceRoom:box(ent,K), exitRoom:box(ex,K), rooms, entranceSpawn:{x:ent.x,y:ent.y}, chambers:chs };
}
// Random layout: entrance on the left, exit on the right, nMain caverns between,
// visited nearest-neighbour from the entrance.
function organicLayout(kind, w, h, nMain, o){
  const ent = {x:o.margin+o.entR, y:rand(h*0.25,h*0.75), rx:o.entR, ry:o.entR*0.9};
  const ex = {x:w-o.margin-o.exitR, y:rand(h*0.25,h*0.75), rx:o.exitR, ry:o.exitR*0.9};
  const mains = []; let guard = 0;
  while(mains.length<nMain && guard<1500){
    guard++;
    const rx = rand(o.mainR[0],o.mainR[1]), ry = rand(o.mainR[0],o.mainR[1])*0.85;
    const c = {x:rand(o.margin+rx, w-o.margin-rx), y:rand(o.margin+ry, h-o.margin-ry), rx, ry};
    const ok = (d)=> dist(c,d) > (Math.max(c.rx,c.ry)+Math.max(d.rx,d.ry))*0.95;
    if(!ok(ent)||!ok(ex)||mains.some(ok2=>!ok(ok2))) continue;
    mains.push(c);
  }
  while(mains.length<nMain){ const i=mains.length; mains.push({x:w*(0.25+0.5*i/Math.max(1,nMain-1)), y:h*(i%2?0.3:0.7), rx:o.mainR[0], ry:o.mainR[0]*0.85}); }
  const chain = []; const pool = mains.slice(); let cur = ent;
  while(pool.length){ pool.sort((a,b)=>dist(cur,a)-dist(cur,b)); cur = pool.shift(); chain.push(cur); }
  const all = [ent, ...chain, ex];
  const links = []; for(let i=0;i<all.length-1;i++) links.push([i,i+1]);
  // a couple of extra loops make the caves feel less linear
  if(all.length>=4) links.push([1,all.length-2]);
  return organicCaveBuild({kind, w, h, chambers:all, links, tunnelR:o.tunnelR, entranceIdx:0, exitIdx:all.length-1, mainIdx:all.slice(1,-1).map((_,i)=>i+1)});
}
function genOrganicRoom(kind, depth){
  const size = 2500 + Math.min(depth*20,300);
  const R = organicLayout(kind, size, size, 4, {margin:220, entR:150, exitR:230, mainR:[230,320], tunnelR:kind==='bear'?105:100});
  return R;
}
const RAPTOR_LAIR_DEPTH = 43;   // v489: was 49 (Redridge is Lv 42 now)
function makeRaptorLairFloor(floor){
  if(floor===1){
    const R = organicLayout('raptor', 3800, 3000, 4, {margin:260, entR:190, exitR:290, mainR:[330,450], tunnelR:150});
    const e = R.chambers[0], x = R.chambers[R.chambers.length-1];
    R.floor = 1; R.waypoint = null; R.chestSpot = null; R.rods = [];
    R.entrance = {x:e.x, y:e.y, r:30};
    R.stairsDown = {x:x.x, y:x.y, r:30};
    return R;
  }
  const w = 2900, h = 1900;
  const cA = {x:1750, y:950, rx:880, ry:680}, cE = {x:330, y:950, rx:200, ry:180};
  const R = organicCaveBuild({kind:'raptor', w, h, chambers:[cE, cA], links:[[0,1]], tunnelR:150, entranceIdx:0, exitIdx:1, mainIdx:[1]});
  const rods = [{x:cA.x-350,y:cA.y-280},{x:cA.x-350,y:cA.y+280},{x:cA.x+350,y:cA.y-280},{x:cA.x+350,y:cA.y+280}];
  for(const r of rods) R.obstacles.push({x:r.x-32, y:r.y-32, w:64, h:64});
  R.floor = 2; R.entrance = {x:cE.x, y:cE.y, r:30}; R.waypoint = null; R.stairsDown = null; R.chestSpot = null; R.rods = rods;
  R.bossSpot = {x:cA.x+380, y:cA.y};
  return R;
}
function spawnRaptorLairPopulation(g, floor){
  spawnRaptorLairPopulationBase(g, floor);
  for(const e of g.enemies) if(e.type==='raptor'){ e.dmgType='normal'; e.dmgSplit='fire'; e.fireRaptor=true; }
}
function spawnRaptorLairPopulationBase(g, floor){
  const R = g.rlair;
  if(floor===1){
    // v176: big packs (7-11 raptors) in every cavern instead of scattered singles
    const packAt = (rm, n)=>{
      const cx = rand(rm.x+rm.w*0.25, rm.x+rm.w*0.75), cy = rand(rm.y+rm.h*0.25, rm.y+rm.h*0.75);
      for(let i=0;i<n;i++){ const a = Math.random()*6.28, rr = rand(0,80); spawnEnemy(g, 'raptor', {x:cx+Math.cos(a)*rr, y:cy+Math.sin(a)*rr}); }
    };
    for(const rm of R.rooms){ packAt(rm, Math.floor(rand(7,12))); packAt(rm, Math.floor(rand(7,12))); }
    packAt(R.exitRoom, Math.floor(rand(8,12)));
  } else {
    const boss = spawnEnemy(g, 'lightningraptor', {x:R.bossSpot.x, y:R.bossSpot.y});
    boss.isLairBoss = true; boss.bossName = 'Flame Raptor'; boss.baseR = boss.r; initLightningRaptor(boss);
    showMsg('The air shimmers with heat...', 2.0, '#ffb060');
  }
}
function enterRaptorLair(floor, opts){
  opts = opts || {};
  floor = clamp(floor, 1, 2);
  const g = game, p = g.player;
  dungeonPersist(g);
  const stL = dungeonStoreGet(g, 'rlair', floor);
  g.scene = 'raptorlair';
  g.rlair = stL ? stL.room : makeRaptorLairFloor(floor);
  g.room = g.rlair;
  g.depth = RAPTOR_LAIR_DEPTH + floor - 1;
  if(opts.atStairs && g.rlair.stairsDown){ p.x = g.rlair.stairsDown.x; p.y = g.rlair.stairsDown.y + 60; }
  else { p.x = g.rlair.entrance.x + 34; p.y = g.rlair.entrance.y - 46; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg('Raptor Lair — '+(floor===1?'Level 1':'The Ember Den'), 1.8);
  if(stL){ g.enemies = stL.enemies; g.loot = stL.loot || []; g.chest = stL.chest || null; g.bossKilled = !!stL.bossKilled; }
  else spawnRaptorLairPopulation(g, floor);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
