// ---------------- Frosthold Dungeon (v278): 5 ancient-dwarven maze floors under Frosthold Keep ----------------
//   Floor 1: ordinary Frosthold dwarves. Floors 2-5: dwarven construct machines (cogcrawlers, gearguards, coil sentries),
//   each floor with its own element. Floor 5 ends in the Ancient Dwarven Construct. It runs on the 'ancientruins' scene rig (room.fhd).
const FHD_FLOORS = 5;
const FHD_INFO = {
  1:{name:'Frozen Vaults', el:'cold'}, 2:{name:'Boiler Halls', el:'fire'}, 3:{name:'Storm Foundry', el:'lightning'},
  4:{name:'Corroded Depths', el:'poison'}, 5:{name:'The Grand Engine', el:'lightning'},
};
const FHD_PAL = {
  1:['#3c4a58','#2e3a46','#46566a','#34424f'], 2:['#5a3a2c','#46291f','#664434','#4e3024'], 3:['#3b3f5e','#2c3050','#464b6e','#343960'],
  4:['#3a4a36','#2b3a29','#46583f','#34432f'], 5:['#4a4438','#38332a','#575040','#3f3a2f'],
};
const FHD_WALL = {
  1:['#56687a','#222c36','#34414e'], 2:['#6a4636','#2c1812','#46281d'], 3:['#4e5480','#1c2038','#323860'],
  4:['#50644a','#1c2a1a','#2f4029'], 5:['#665e4a','#26221a','#3e382c'],
};
const FHD_EL_COL = {cold:'#bfeaff', fire:'#ff8a3a', lightning:'#8fd8ff', poison:'#8fe05a'};
function fhdDepth(f){ return FH_DEPTH + 1 + Math.floor(f/2); }   // v489: Lv 40-42

// ---- Frosthold Dungeon layouts (v280): each floor has its own hand-built shape, not a maze ----
//   1 Frozen Vaults: snake of big vault chambers joined by corridors, ice pillars, side alcoves.
//   2 Boiler Halls: wide halls with furnace blocks and steam-vent lanes, joined by narrow catwalks.
//   3 Storm Foundry: central foundry hall inside a ring corridor, assembly belts, coil pylons that call lightning.
//   4 Corroded Depths: an open cavern of overlapping chambers, acid pools and cover pipes.
//   5 The Grand Engine: a big gear chamber, then the boss arena.
const FHD_ICE = ['#8fb8d0','#3a5468','#587c94'], FHD_FURN = ['#8a3a1e','#3a1409','#5a2412'], FHD_PYL = ['#5a7ab8','#1c2a48','#2e4470'], FHD_PIPE = ['#6e8a5a','#24301e','#40543a'], FHD_PILL = ['#8a7a58','#2a2418','#4a4030'];
function makeFhdFloor(floor){
  const snap = v=>Math.round(v/50)*50;
  const rects = [], chambers = [], props = [], haz = [], decor = [];
  const add = (x,y,w,h)=>{ const r = {x:snap(x), y:snap(y), w:snap(w), h:snap(h)}; rects.push(r); return r; };
  const chamber = (x,y,w,h)=>{ const r = add(x,y,w,h); chambers.push(r); return r; };
  const corridor = (a,b,wid)=>{
    const ax = a.x+a.w/2, ay = a.y+a.h/2, bx = b.x+b.w/2, by = b.y+b.h/2, hw = wid/2;
    add(Math.min(ax,bx)-hw, ay-hw, Math.abs(bx-ax)+wid, wid);
    add(bx-hw, Math.min(ay,by)-hw, wid, Math.abs(by-ay)+wid);
  };
  const prop = (x,y,w,h,col,hz)=>props.push({x:snap(x), y:snap(y), w:snap(w), h:snap(h), col, hz});
  let W, H, entrance, stairsDown = null, exitRoom, entranceRoom, spawnRects = [], decorBg = [], bossArena = null;
  if(floor===1){
    W = 3200; H = 2400;
    const c0 = chamber(150,1650,600,500), c1 = chamber(1050,1650,700,500), c2 = chamber(2050,1650,800,500), c3 = chamber(2150,850,700,600), c4 = chamber(1050,850,800,600), c5 = chamber(150,150,900,500);
    corridor(c0,c1,150); corridor(c1,c2,150); corridor(c2,c3,150); corridor(c3,c4,150); corridor(c4,c5,150);
    for(const c of [c1,c2,c3,c4]){
      add(c.x+100, c.y-150, 100, 150); add(c.x+c.w-200, c.y+c.h, 100, 150);   // alcoves
      for(const [px,py] of [[c.x+130,c.y+110],[c.x+c.w-230,c.y+110],[c.x+130,c.y+c.h-210],[c.x+c.w-230,c.y+c.h-210]]) prop(px,py,100,100,FHD_ICE,42);
    }
    entranceRoom = c0; exitRoom = c5;
    entrance = {x:c0.x+90, y:c0.y+c0.h/2, r:30}; stairsDown = {x:c5.x+c5.w-100, y:c5.y+c5.h/2, r:30};
    spawnRects = [c1,c2,c3,c4,c5];
  } else if(floor===2){
    W = 3900; H = 2500;
    const h1 = chamber(150,1000,1000,900), h2 = chamber(1650,800,1100,1100), h3 = chamber(3150,950,650,800);
    corridor(h1,h2,100); corridor(h2,h3,100);   // narrow catwalks
    const s1 = chamber(1900,350,500,450), s2 = chamber(1900,1900,500,450);   // boiler side rooms
    for(const [x,y] of [[350,1100],[350,1650],[850,1100],[850,1650],[1850,900],[1850,1550],[2500,900],[2500,1550],[2125,950],[2125,1700]]) prop(x,y,150,150,FHD_FURN,46);
    for(const [x,y,r] of [[650,1200,62],[650,1700,62],[950,1450,62],[1950,1350,62],[2450,1350,62],[2200,1150,62],[2200,1650,62],[1850,1250,62],[2150,550,62],[2150,2100,62]]) haz.push({kind:'vent', x, y, r, t:Math.random()*5});
    entranceRoom = h1; exitRoom = h3;
    entrance = {x:h1.x+90, y:1450, r:30}; stairsDown = {x:3700, y:1350, r:30};
    spawnRects = [h1,h2,s1,s2];
  } else if(floor===3){
    W = 3200; H = 2600;
    const top = chamber(300,300,2600,250), bot = chamber(300,2050,2600,250), left = chamber(300,300,250,2000), right = chamber(2650,300,250,2000);
    const hall = chamber(1000,800,1200,1000);
    add(550,1200,450,200); add(2200,1200,450,200); add(1500,550,200,250); add(1500,1800,200,250);   // gates
    for(const [x,y] of [[1250,1000],[1950,1000],[1250,1500],[1950,1500]]){ prop(x,y,80,80,FHD_PYL,64); haz.push({kind:'coil', x:x+40, y:y+40, cd:2+Math.random()*3, tp:null, tT:0}); }
    for(const [x,y] of [[1000,380],[2200,380],[1000,2150],[2200,2150]]){ prop(x,y,80,80,FHD_PYL,64); haz.push({kind:'coil', x:x+40, y:y+40, cd:2+Math.random()*3, tp:null, tT:0}); }
    decor.push({kind:'belt', x:650, y:400, w:1900, h:100, dir:1}, {kind:'belt', x:650, y:2100, w:1900, h:100, dir:-1}, {kind:'belt', x:350, y:650, w:100, h:1300, dir:1}, {kind:'belt', x:2750, y:650, w:100, h:1300, dir:-1});
    entranceRoom = {x:300,y:2050,w:600,h:250}; exitRoom = {x:2300,y:300,w:600,h:250};
    entrance = {x:420, y:2175, r:30}; stairsDown = {x:2780, y:430, r:30};
    spawnRects = [top,bot,left,right,hall];
  } else if(floor===4){
    W = 3000; H = 2600;
    const a = chamber(150,1900,900,600), b = chamber(800,1200,1100,900), c = chamber(1700,1650,1100,800), d = chamber(1300,300,1100,900), e = chamber(2350,500,550,900);
    add(1400,1100,300,200);
    for(const [x,y] of [[1000,1330],[1500,1900],[2500,1800],[1650,500],[2050,800],[1100,1650],[2250,2250]]) prop(x,y,50,300,FHD_PIPE,52);
    for(const [x,y,r] of [[1200,1550,130],[1650,1500,120],[2000,2050,140],[2400,1950,120],[2250,2330,110],[1600,850,140],[2000,1000,120],[1500,550,110],[2500,800,120]]) haz.push({kind:'acid', x, y, r, tick:0});
    entranceRoom = a; exitRoom = e;
    entrance = {x:240, y:2200, r:30}; stairsDown = {x:2700, y:950, r:30};
    spawnRects = [b,c,d,e];
  } else {
    W = 3700; H = 2000;
    const en = chamber(150,700,500,600), gear = chamber(900,300,1300,1400), arena = chamber(2500,400,1100,1200);
    add(650,900,300,200); add(2150,900,400,200);
    for(let k=0;k<8;k++){ const ang = Math.PI/8 + k*Math.PI/4; prop(1550+Math.cos(ang)*430-30, 1000+Math.sin(ang)*430-30, 60, 60, FHD_PILL, 70); }
    decor.push({kind:'gear', x:1550, y:1000, r:560}, {kind:'gear', x:3050, y:1000, r:330});
    entranceRoom = en; exitRoom = arena; bossArena = arena;
    entrance = {x:240, y:1000, r:30};
    spawnRects = [gear];
  }
  const walls = darkCryptCarveObstacles(rects, W, H);
  const obstacles = walls.concat(props);
  const rooms = spawnRects.slice();
  return { w:W, h:H, obstacles, floorRects:rects, rooms, entranceRoom, exitRoom, floor, entrance, waypoint:(floor===2 ? {x:480, y:1450, r:22} : null), stairsDown, chestSpot:null, mazeN:0,
    fhd:true, pal:FHD_PAL[floor], wallPal:FHD_WALL[floor], haz, decor, spawnRects, bossArena };
}
// Floor hazards: steam vents (burst), storm coils (call a lightning circle on you), acid pools (damage over time)
function updateFhdHazards(g, dt){
  const R = g.ruins, p = g.player; if(!R || !R.haz) return;
  const dep = g.depth;
  for(const h of R.haz){
    if(h.kind==='vent'){
      h.t += dt; const ph = h.t % 5;
      if(ph>=4 && !h.fired){
        h.fired = true;
        if(dist(p,h) < h.r + p.r) playerDamage(g, (18+dep*2.6)*TELE_DMG_MULT, {dmgType:'fire', hp:0, x:h.x, y:h.y, r:0});
        g.particles.push({type:'burst', x:h.x, y:h.y, t:0.5, max:0.5, color:'#ffd9a0'});
      } else if(ph<4) h.fired = false;
    } else if(h.kind==='coil'){
      if(h.tT>0){
        h.tT -= dt;
        if(h.tT<=0){
          if(dist(p,h.tp) < 115 + p.r*0.5) playerDamage(g, (22+dep*2.8)*TELE_DMG_MULT, {dmgType:'lightning', hp:0, x:h.tp.x, y:h.tp.y, r:0});
          g.particles.push({type:'ring', x:h.tp.x, y:h.tp.y, t:0.4, max:0.4, r:115, color:'#8fd8ff'});
          g.particles.push({type:'burst', x:h.tp.x, y:h.tp.y, t:0.35, max:0.35, color:'#cfeaff'});
          shakeScreen(g, 3, 0.15); h.tp = null;
        }
      } else {
        h.cd -= dt;
        if(h.cd<=0 && dist(p,h) < 720){ h.tp = {x:p.x, y:p.y}; h.tT = 1.1; h.cd = 4.2 + Math.random()*1.6; }
      }
    } else if(h.kind==='acid'){
      if(dist(p,h) < h.r - 10){
        h.tick -= dt;
        if(h.tick<=0){ h.tick = 0.5; playerDamage(g, (6+dep*1.0)*TELE_DMG_MULT, {dmgType:'poison', hp:0, x:h.x, y:h.y, r:0}); }
      } else h.tick = 0;
    }
  }
}
function drawFhdFx(R, clk){
  const tilt = ISO_KY/ISO_KX;
  for(const dc of (R.decor||[])){
    if(dc.kind==='gear'){
      const iso = toIso(dc.x,dc.y), rr = dc.r*ISO_KX*Math.SQRT2;
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, tilt);
      ctx.strokeStyle='rgba(200,170,100,0.35)'; ctx.lineWidth=5;
      ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,rr*0.62,0,7); ctx.stroke(); ctx.beginPath(); ctx.arc(0,0,rr*0.18,0,7); ctx.stroke();
      ctx.rotate(clk*0.12);
      for(let k=0;k<16;k++){ ctx.rotate(Math.PI/8); ctx.fillStyle='rgba(200,170,100,0.28)'; ctx.fillRect(rr-12,-9,24,18); }
      ctx.lineWidth=3; ctx.strokeStyle='rgba(160,200,230,0.25)'; for(let k=0;k<6;k++){ ctx.rotate(Math.PI/3); ctx.beginPath(); ctx.moveTo(rr*0.18,0); ctx.lineTo(rr*0.62,0); ctx.stroke(); }
      ctx.restore();
    } else if(dc.kind==='belt'){
      const horiz = dc.w>=dc.h, n = Math.floor((horiz?dc.w:dc.h)/70), off = (clk*40*dc.dir)%70;
      const P = (x,y)=>toIso(x,y);
      const a = P(dc.x,dc.y), b = P(dc.x+dc.w,dc.y), c = P(dc.x+dc.w,dc.y+dc.h), d = P(dc.x,dc.y+dc.h);
      ctx.save(); ctx.fillStyle='rgba(20,24,40,0.55)'; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.lineTo(d.x,d.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(150,190,230,0.45)'; ctx.lineWidth=3;
      for(let i=0;i<=n;i++){
        const t = ((i*70+off+70)%((horiz?dc.w:dc.h)+1));
        const q0 = horiz ? P(dc.x+t, dc.y+dc.h*0.2) : P(dc.x+dc.w*0.2, dc.y+t), q1 = horiz ? P(dc.x+t+20*dc.dir, dc.y+dc.h*0.5) : P(dc.x+dc.w*0.5, dc.y+t+20*dc.dir), q2 = horiz ? P(dc.x+t, dc.y+dc.h*0.8) : P(dc.x+dc.w*0.8, dc.y+t);
        ctx.beginPath(); ctx.moveTo(q0.x,q0.y); ctx.lineTo(q1.x,q1.y); ctx.lineTo(q2.x,q2.y); ctx.stroke();
      }
      ctx.restore();
    }
  }
  for(const h of (R.haz||[])){
    const iso = toIso(h.x,h.y);
    if(h.kind==='vent'){
      const ph = h.t%5, warn = ph>=3 && ph<4 ? (ph-3) : 0, burst = ph>=4 && ph<4.6;
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, tilt);
      ctx.fillStyle='#1a1008'; ctx.beginPath(); ctx.arc(0,0,h.r*ISO_KX*Math.SQRT2*0.7,0,7); ctx.fill();
      ctx.strokeStyle='#5a4630'; ctx.lineWidth=3; ctx.stroke();
      if(warn>0){ ctx.fillStyle='rgba(255,140,50,'+(0.15+warn*0.45)+')'; ctx.beginPath(); ctx.arc(0,0,h.r*ISO_KX*Math.SQRT2*(0.5+warn*0.5),0,7); ctx.fill(); ctx.strokeStyle='rgba(255,170,80,'+(0.4+warn*0.5)+')'; ctx.stroke(); }
      ctx.restore();
      if(burst){ ctx.save(); ctx.fillStyle='rgba(255,240,220,0.55)'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-40, 20, 46, 0, 0, 7); ctx.fill(); ctx.fillStyle='rgba(255,170,90,0.45)'; ctx.beginPath(); ctx.ellipse(iso.x, iso.y-26, 26, 30, 0, 0, 7); ctx.fill(); ctx.restore(); }
    } else if(h.kind==='coil' && h.tp && h.tT>0){
      const ti = toIso(h.tp.x,h.tp.y), fr = clamp(1-h.tT/1.1,0,1);
      ctx.save(); ctx.translate(ti.x, ti.y); ctx.scale(1, tilt);
      ctx.strokeStyle='rgba(150,220,255,'+(0.5+fr*0.5)+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,0,115*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
      ctx.fillStyle='rgba(140,210,255,'+(0.08+fr*0.28)+')'; ctx.beginPath(); ctx.arc(0,0,115*ISO_KX*Math.SQRT2*fr,0,7); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.strokeStyle='rgba(180,230,255,'+(0.3+fr*0.5)+')'; ctx.lineWidth=2; const hi = toIso(h.x,h.y); ctx.beginPath(); ctx.moveTo(hi.x, hi.y-64); ctx.lineTo(ti.x, ti.y-10); ctx.stroke(); ctx.restore();
    } else if(h.kind==='acid'){
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, tilt);
      const rr = h.r*ISO_KX*Math.SQRT2;
      const gr = ctx.createRadialGradient(0,0,rr*0.1,0,0,rr); gr.addColorStop(0,'rgba(150,230,80,0.75)'); gr.addColorStop(1,'rgba(70,130,40,0.55)');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.fill(); ctx.strokeStyle='rgba(190,255,120,0.6)'; ctx.lineWidth=3; ctx.stroke();
      for(let k=0;k<4;k++){ const a = clk*0.7+k*1.6, b = (Math.sin(clk*2+k*2)+1)/2; ctx.fillStyle='rgba(220,255,160,'+(0.25+b*0.4)+')'; ctx.beginPath(); ctx.arc(Math.cos(a)*rr*0.5, Math.sin(a)*rr*0.5, 3+b*4, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }
}
function spawnFhdPopulation(g, floor){
  const R = g.ruins, p = g.player, el = FHD_INFO[floor].el;
  const types = floor===1 ? ['fhdwarf','fhdwarf','fhaxe','fhbrute','frozenzombie'] : ['cogcrawler','cogcrawler','gearguard','coilsentry'];
  let area = 0; for(const sr of R.spawnRects) area += sr.w*sr.h;
  const packs = Math.max(14, Math.round(area/1e6*24/3));
  const tint = e=>{ if(e && floor>=2){ e.dmgType = el; e.elem = el; } return e; };
  const pick = ()=>{
    for(let k=0;k<40;k++){
      let r = Math.random()*area, sr = R.spawnRects[0];
      for(const c of R.spawnRects){ if(r<c.w*c.h){ sr = c; break; } r -= c.w*c.h; }
      const x = rand(sr.x+60, sr.x+sr.w-60), y = rand(sr.y+60, sr.y+sr.h-60);
      if(dist({x,y}, R.entrance) < 380 || (R.stairsDown && dist({x,y}, R.stairsDown) < 200)) continue;
      if(posBlockedByObstacles(x, y, 40, R.obstacles)) continue;
      return {x,y};
    }
    return null;
  };
  for(let i=0;i<packs;i++){
    const type = types[Math.floor(Math.random()*types.length)];
    const lp = pick(); if(!lp) continue;
    const lead = tint(spawnEnemy(g, type, lp));
    const n = (type==='gearguard') ? 1 + Math.floor(Math.random()*2) : 2 + Math.floor(Math.random()*3);
    for(let k=1;k<n;k++){
      const a = Math.random()*Math.PI*2, d = 28 + Math.random()*32;
      const q = {x:lead.x+Math.cos(a)*d, y:lead.y+Math.sin(a)*d};
      if(posBlockedByObstacles(q.x, q.y, 20, R.obstacles)) continue;
      tint(spawnEnemy(g, type, q));
    }
  }
  if(floor===2 && R.stairsDown){   // v419: a big guard pack at the stairs down into the Storm Foundry
    const sd = R.stairsDown, kinds = ['gearguard','gearguard','gearguard','cogcrawler','cogcrawler','cogcrawler','cogcrawler','coilsentry','coilsentry','coilsentry'];
    let placed = 0;
    for(let k=0;k<60 && placed<kinds.length;k++){
      const a = Math.random()*Math.PI*2, d = 230 + Math.random()*150;
      const q = {x:sd.x - Math.abs(Math.cos(a))*d*0.9, y:sd.y + Math.sin(a)*d};
      if(q.x < R.spawnRects[2].x+30 || posBlockedByObstacles(q.x, q.y, 36, R.obstacles)) continue;
      tint(spawnEnemy(g, kinds[placed], q)); placed++;
    }
  }
  if(floor===FHD_FLOORS){
    const er = R.exitRoom;
    if(!p.constructSlain || p.fhDungeonDone){   // v489: back on every visit once its runestone is taken
      const boss = spawnEnemy(g, 'dwconstruct', {x:er.x+er.w/2, y:er.y+er.h/2});
      initDwConstruct(boss, R);
      showMsg('Something ancient is awake in the Grand Engine...', 2.4, '#ffd9a0');
    } else {
      R.husk = {x:er.x+er.w/2, y:er.y+er.h/2, r:90, taken:false};
    }
  }
}
function enterFhDungeon(floor, opts){
  opts = opts || {};
  floor = clamp(floor, 1, FHD_FLOORS);
  const g = game, p = g.player;
  dungeonPersist(g);
  const stR = dungeonStoreGet(g, 'fhd', floor);
  g.scene = 'ancientruins';
  g.ruins = stR ? stR.room : makeFhdFloor(floor);
  g.room = g.ruins;
  g.depth = fhdDepth(floor);
  if(opts.atStairs && g.ruins.stairsDown){ p.x = g.ruins.stairsDown.x; p.y = g.ruins.stairsDown.y + 60; }
  else if(opts.atWaypoint && g.ruins.waypoint){ p.x = g.ruins.waypoint.x; p.y = g.ruins.waypoint.y + 40; }
  else { p.x = g.ruins.entrance.x + 34; p.y = g.ruins.entrance.y - 46; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Frosthold Dungeon — '+FHD_INFO[floor].name+'  (Lv. '+g.depth+')', 2.0);
  if(stR){ g.enemies = stR.enemies; g.loot = stR.loot || []; g.chest = stR.chest || null; g.bossKilled = !!stR.bossKilled; }
  else { g.bossKilled = false; spawnFhdPopulation(g, floor); }
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  saveGame();
}
// ---- Ancient Dwarven Construct ----
//   Limbs out: slow walk, Piston Smash (telegraphed ring where you stood), Gear Sweep (ring around itself),
//   Summon (cogcrawlers). At 66% and 33% life it retracts its limbs, rolls around the arena bouncing off the
//   walls (armoured, hits hard on contact), then is dizzy -- exposed for +25% damage.
// v490: Furnace Beam -- legs fold in, the chassis drops flat, and a fire beam sweeps one full circle, always starting at 12 o'clock
// (screen-up, world angle -3pi/4) and turning clockwise. Storm Call -- the Kraken's telegraphed lightning circles land around you.
const DWC_LASER_LEN = 820, DWC_LASER_HW = 24, DWC_LASER_TURN = 7.5, DWC_LASER_FLAT = 1.1, DWC_LASER_RISE = 0.8, DWC_LASER_START = -Math.PI*0.75;
const DWC_STRIKE_R = 62, DWC_STRIKE_T = 1.15;
function dwcStrikesTick(g, e, dt){
  if(!e.dwStrikes || !e.dwStrikes.length) return;
  const src = {dmgType:'lightning', hp:0, x:e.x, y:e.y, r:0, dmg:e.dmg, isLairBoss:true, bossName:e.bossName};
  for(let i=e.dwStrikes.length-1;i>=0;i--){
    const k = e.dwStrikes[i]; k.t -= dt; if(k.t>0) continue;
    const dm = teleDmg(e, 1.1);
    if(dist(g.player,k) < DWC_STRIKE_R + g.player.r*0.5) playerDamage(g, dm, src);
    if(g.followers) for(const f of g.followers) if(dist(f,k) < DWC_STRIKE_R + (f.r||12)*0.5) applyFollowerDamage(g, f, dm, src);
    g.particles.push({type:'burst', x:k.x, y:k.y, t:0.35, max:0.35, color:'#fff2a0'});
    g.particles.push({type:'ring', x:k.x, y:k.y, t:0.4, max:0.4, r:DWC_STRIKE_R, color:'#ffe046'});
    shakeScreen(g, 2, 0.1);
    e.dwStrikes.splice(i,1);
  }
}
function dwcLaserHits(g, e, dt){
  e.cLaserTick = (e.cLaserTick||0) - dt; if(e.cLaserTick > 0) return;
  e.cLaserTick = 0.2;
  const ca = Math.cos(e.cLaserAng), sa = Math.sin(e.cLaserAng), src = {dmgType:'fire', hp:0, x:e.x, y:e.y, r:0};
  for(const tg of [g.player].concat(g.followers||[])){
    if(!(tg.hp>0)) continue;
    const rx = tg.x-e.x, ry = tg.y-e.y, along = rx*ca+ry*sa, perp = Math.abs(-rx*sa+ry*ca);
    if(along > e.r*0.4 && along < DWC_LASER_LEN && perp < DWC_LASER_HW + (tg.r||12)*0.6){
      if(tg===g.player && (g.player.dodging || g.player.invuln>0)) continue;
      const dm = teleDmg(e, 0.32);
      if(tg===g.player) playerDamage(g, dm, src); else applyFollowerDamage(g, tg, dm, src);
    }
  }
}
const DWC_SMASH_R = 160, DWC_SWEEP_R = 204, DWC_ROLL_SPEED = 450, DWC_ROLL_T = 9.5, DWC_DIZZY_T = 3.6, DWC_ADD_CAP = 6;   // v419: attack circles -20%, roll +3s, roll speeds up every use
function initDwConstruct(e, room){
  e.dwc = true; e.isLairBoss = true; e.bossName = 'Ancient Dwarven Construct'; e.engaged = true; e.aggroed = true; e.baseR = e.r;
  e.meleeBonus = 50;   // v490: its fists reach well past its own torso
  e.dwStrikes = []; e.cLaserCd = 6;
  e.armorBase = e.armor || 0; e.cState = 'chase'; e.cT = 0; e.cTmax = 1; e.cCd = 2.6; e.cNext = 0; e.cRolls = 0; e.rollAng = 0; e.rvx = 0; e.rvy = 0; e.cHitT = 0; e.tPt = null;
  const er = room.exitRoom;
  e.arena = {x0:er.x+e.r+30, x1:er.x+er.w-e.r-30, y0:er.y+e.r+30, y1:er.y+er.h-e.r-30};
}
function dwcHit(g, e, tg, mult){
  const dm = teleDmg(e, mult);
  if(tg===g.player) playerDamage(g, dm, e); else applyFollowerDamage(g, tg, dm, e);
}
function updateDwConstruct(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const st = e.cState, A = e.arena, tgs = [g.player].concat(g.followers||[]);
  const F = e.cRolls>=2 ? 0.8 : 1;
  if(e.exposedT>0) e.exposedT -= dt;
  e.armor = (st==='retract' || st==='roll') ? e.armorBase+60 : e.armorBase;
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  dwcStrikesTick(g, e, dt);
  if(e.cLaserCd>0) e.cLaserCd -= dt;
  if(st==='flatten'){ e.cT -= dt; e.moving = false; if(e.cT<=0){ e.cState = 'laser'; e.cT = DWC_LASER_TURN; e.cLaserAng = DWC_LASER_START; e.cLaserTick = 0; } return; }
  if(st==='laser'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1;
    e.cLaserAng = DWC_LASER_START + (1 - Math.max(0,e.cT)/DWC_LASER_TURN)*Math.PI*2;
    dwcLaserHits(g, e, dt);
    if(Math.random() < dt*30){ const rr = rand(e.r, DWC_LASER_LEN); g.particles.push({type:'burst', x:e.x+Math.cos(e.cLaserAng)*rr, y:e.y+Math.sin(e.cLaserAng)*rr, t:0.25, max:0.25, color:'#ffb050'}); }
    if(e.cT<=0){ e.cState = 'rise'; e.cT = DWC_LASER_RISE; }
    return;
  }
  if(st==='rise'){ e.cT -= dt; e.moving = false; if(e.cT<=0){ e.cState = 'chase'; e.cCd = 1.4; } return; }
  const trig = (e.cRolls===0 && e.hp<=e.maxHp*0.66) || (e.cRolls===1 && e.hp<=e.maxHp*0.33);
  if(trig && (st==='chase' || st==='recover')){
    e.cRolls++; e.cState = 'retract'; e.cT = e.cTmax = 1.2; e.moving = false;
    bossMsg('THE CONSTRUCT CURLS UP', 'Its limbs retract -- it is about to roll!', 2.6);
    shakeScreen(g, 4, 0.5);
    return;
  }
  if(st==='retract'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.cT<=0){
      const a = Math.atan2(target.y-e.y, target.x-e.x);
      const rsp = DWC_ROLL_SPEED*(1 + 0.4*Math.max(0,e.cRolls-1));   // each roll is faster than the last
      e.rvx = Math.cos(a)*rsp; e.rvy = Math.sin(a)*rsp;
      e.cState = 'roll'; e.cT = DWC_ROLL_T; e.cHitT = 0;
    }
    return;
  }
  if(st==='roll'){
    e.cT -= dt; e.moving = true; e.rollAng += dt*9; e.cHitT -= dt;
    e.x += e.rvx*chillMult*dt; e.y += e.rvy*chillMult*dt;
    let bounced = false;
    if(e.x<A.x0){ e.x = A.x0; e.rvx = Math.abs(e.rvx); bounced = true; } else if(e.x>A.x1){ e.x = A.x1; e.rvx = -Math.abs(e.rvx); bounced = true; }
    if(e.y<A.y0){ e.y = A.y0; e.rvy = Math.abs(e.rvy); bounced = true; } else if(e.y>A.y1){ e.y = A.y1; e.rvy = -Math.abs(e.rvy); bounced = true; }
    if(bounced){
      shakeScreen(g, 4, 0.18);
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.35, max:0.35, color:'#ffd27a'});
    }
    if(e.cHitT<=0){
      let any = false;
      for(const tg of tgs) if(dist(tg,e) < e.r+tg.r){ dwcHit(g, e, tg, 1.3); any = true; }
      if(any) e.cHitT = 0.6;
    }
    if(e.cT<=0){
      e.cState = 'dizzy'; e.cT = DWC_DIZZY_T; e.exposedT = DWC_DIZZY_T; e.moving = false;
      showMsg('The Construct is dizzy — strike now!', 2.2, '#ffe08a');
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:120, color:'#ffe08a'});
    }
    return;
  }
  if(st==='dizzy'){ e.cT -= dt; e.moving = false; if(e.cT<=0){ e.cState = 'chase'; e.cCd = 1.2; } return; }
  if(st==='recover'){ e.cT -= dt; e.moving = false; if(e.cT<=0) e.cState = 'chase'; return; }
  if(st==='smashTele'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.cT<=0){
      for(const tg of tgs) if(dist(tg,e.tPt) < DWC_SMASH_R + tg.r*0.5) dwcHit(g, e, tg, 1.7);
      g.particles.push({type:'ring', x:e.tPt.x, y:e.tPt.y, t:0.5, max:0.5, r:DWC_SMASH_R, color:'#d9a066'});
      g.particles.push({type:'burst', x:e.tPt.x, y:e.tPt.y, t:0.4, max:0.4, color:'#ffd27a'});
      shakeScreen(g, 6, 0.25);
      e.cState = 'recover'; e.cT = 0.9*F;
    }
    return;
  }
  if(st==='sweepTele'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.cT<=0){
      for(const tg of tgs) if(dist(tg,e) < DWC_SWEEP_R + tg.r*0.5) dwcHit(g, e, tg, 1.5);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:DWC_SWEEP_R, color:'#e8a060'});
      shakeScreen(g, 5, 0.25);
      e.cState = 'recover'; e.cT = 0.9*F;
    }
    return;
  }
  if(st==='summonTele'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.cT<=0){
      const alive = g.enemies.filter(x=>x.cAdd && x.hp>0).length;
      for(let i=0;i<4 && alive+i<DWC_ADD_CAP;i++){
        const a = Math.random()*Math.PI*2, rr = e.r+rand(40,140);
        const pos = {x:clamp(e.x+Math.cos(a)*rr, A.x0, A.x1), y:clamp(e.y+Math.sin(a)*rr, A.y0, A.y1)};
        const c = spawnEnemy(g, 'cogcrawler', pos);
        if(c){ c.cAdd = true; c.noReward = true; c.engaged = true; c.aggroed = true; c.dmgType = 'lightning'; c.elem = 'lightning'; }
        g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.4, max:0.4, color:'#8fd8ff'});
      }
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:e.r+110, color:'#8fd8ff'});
      e.cState = 'recover'; e.cT = 0.8*F;
    }
    return;
  }
  // chase / melee
  const reach = e.r+target.r+4 + (e.meleeBonus||0)*0.6;   // v490: swings from further out
  updateStuckTracking(e, dt);
  e.cCd -= dt;
  if(e.cCd<=0){
    const seq = e.cRolls>=1 ? ['smash','storm','sweep','laser','summon','smash','sweep','storm'] : ['smash','sweep','storm','summon','laser'];
    const mv = seq[e.cNext % seq.length];
    let ok = true;
    if(mv==='laser'){   // v490
      if(!(e.cLaserCd>0) && d < DWC_LASER_LEN-60){ e.cState = 'flatten'; e.cT = e.cTmax = DWC_LASER_FLAT; e.cLaserCd = 16; e.cNext++; e.cCd = 2.4; e.windT = 0;
        bossMsg('THE CONSTRUCT DROPS FLAT', 'Its furnace core glows -- keep moving!', 2.4); return; }
      e.cNext++; e.cCd = 0.4; ok = false;
    } else if(mv==='storm'){   // v490: telegraphed lightning circles, like the Kraken's Storm Surge
      if(enemyLOS(g,e,target)){ const n = e.cRolls>=1 ? 6 : 4;
        for(let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, r0 = i===0 ? 0 : rand(60,220);
          e.dwStrikes.push({x:clamp(target.x+Math.cos(a)*r0, A.x0-e.r, A.x1+e.r), y:clamp(target.y+Math.sin(a)*r0, A.y0-e.r, A.y1+e.r), t:DWC_STRIKE_T+i*0.12, max:DWC_STRIKE_T+i*0.12}); }
        showMsg('Lightning crackles through the halls!', 1.0, '#9fd8ff'); e.cNext++; e.cCd = 2.0 + Math.random(); e.windT = 0; return; }
      e.cNext++; e.cCd = 0.4; ok = false;
    }
    if(mv==='laser' || mv==='storm'){ }
    else {
    if(mv==='smash'){ if(d < 520 && enemyLOS(g,e,target)){ e.tPt = {x:target.x, y:target.y}; e.cState = 'smashTele'; e.cT = e.cTmax = 1.05*F; } else ok = false; }
    else if(mv==='sweep'){ if(d < DWC_SWEEP_R*1.1){ e.cState = 'sweepTele'; e.cT = e.cTmax = 1.0*F; } else ok = false; }
    else { if(g.enemies.filter(x=>x.cAdd && x.hp>0).length < DWC_ADD_CAP-2){ e.cState = 'summonTele'; e.cT = e.cTmax = 0.95*F; } else ok = false; }
    if(ok){ e.cNext++; e.cCd = 2.6 + Math.random()*1.0; e.windT = 0; return; }
    e.cCd = 0.5; e.cNext++;
    }
  }
  if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+4, dt)){
  } else if(d>reach){
    const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
    face(ang);
    e.x += Math.cos(ang)*e.speed*chillMult*dt; e.y += Math.sin(ang)*e.speed*chillMult*dt; e.moving = true;
  } else if(e.atkCd<=0){ beginEnemyMelee(e); }
}
function dwConstructSlain(g, e){
  const p = g.player;
  p.constructSlain = true; p.redridgeWallOpen = true;
  for(const x of g.enemies) if(x.cAdd){ x.hp = 0; x.noReward = true; }
  const R = g.ruins;
  if(R && R.fhd){
    const A = e.arena || {x0:e.x-1,x1:e.x+1,y0:e.y-1,y1:e.y+1};
    const hx = clamp(e.x, A.x0, A.x1), hy = clamp(e.y, A.y0, A.y1);
    if(p.fhDungeonDone) R.returnPortal = {x:hx+190, y:hy, r:26};   // v489: a re-kill -- the runestone is already yours, the way back opens at once
    else R.husk = {x:hx, y:hy, r:90, taken:false};   // v419: the way back opens only once the runestone is taken
  }
  bossMsg('THE ANCIENT CONSTRUCT FALLS', p.fhDungeonDone ? 'The machine grinds to a halt once more' : 'Something deep in the mountain grinds open...', 4.0);
  shakeScreen(g, 7, 0.9);
  if(!p.fhDungeonDone) showMsg('A runestone gleams in the wreckage.', 3.2, '#9fe4ff');
  saveGame();
}
function takeRunestone2(){
  const g = game, p = g.player, R = g.ruins;
  if(!R || !R.husk || R.husk.taken || p.fhDungeonDone) return;   // v489: the runestone never drops twice
  R.husk.taken = true; p.fhDungeonDone = true;
  R.returnPortal = {x:R.husk.x+190, y:R.husk.y, r:26};
  const rs = makeFrostRunestoneItem();
  forceAddToBag(p, rs);
  forceAddToBag(p, classRewardItem(p, Math.max(p.level, 48), 'reward'));
  p.gold += 800;
  const q = getQuest(p, 'frost_depths');
  if(q && q.status==='active'){ q.status='complete'; q.rewarded=true; q.progress=q.total; q.desc='You took the Offensive Runestone from the Ancient Dwarven Construct. The wall at Redridge has unlocked.'; }
  showBigMsg('OFFENSIVE RUNESTONE', 'The ancient wall at Redridge stands open', 3.4);
  g.particles.push({type:'burst', x:R.husk.x, y:R.husk.y, t:0.7, max:0.7, color:'#9fe4ff'});
  npcMark(p, 'scholar', true);
  bagPulse(); updateQuestBadge(); saveGame();
}
// v490: drawn after the dungeon darkness so the beam glows (see render.js)
function drawDwBeam(e){
  if(e.cState==='flatten' || e.cState==='laser'){
    const ang = e.cState==='laser' ? e.cLaserAng : DWC_LASER_START, L = e.cState==='laser' ? DWC_LASER_LEN : DWC_LASER_LEN*clamp(1-e.cT/DWC_LASER_FLAT,0,1);
    const a = toIso(e.x, e.y), b = toIso(e.x+Math.cos(ang)*L, e.y+Math.sin(ang)*L), fl = 0.75+0.25*Math.sin((e.animT||0)*30);
    ctx.save(); ctx.lineCap = 'round';
    if(e.cState==='flatten'){ ctx.strokeStyle='rgba(255,140,60,0.55)'; ctx.lineWidth=3; ctx.setLineDash([10,8]); ctx.beginPath(); ctx.moveTo(a.x,a.y-20); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.setLineDash([]); }
    else {
      ctx.globalCompositeOperation='lighter';
      ctx.strokeStyle='rgba(255,90,20,'+(0.35*fl)+')'; ctx.lineWidth=DWC_LASER_HW*2.6; ctx.beginPath(); ctx.moveTo(a.x,a.y-20); ctx.lineTo(b.x,b.y); ctx.stroke();
      ctx.strokeStyle='rgba(255,170,60,'+(0.75*fl)+')'; ctx.lineWidth=DWC_LASER_HW*1.2; ctx.stroke();
      ctx.strokeStyle='rgba(255,245,200,0.95)'; ctx.lineWidth=5; ctx.stroke();
    }
    ctx.restore();
  }
}
function drawDwTelegraph(e){
  // v490: Storm Call circles and the Furnace Beam
  if(e.dwStrikes) for(const k of e.dwStrikes){
    const f = clamp(1-k.t/k.max,0,1), iso = toIso(k.x,k.y), Rpx = DWC_STRIKE_R*ISO_KX*Math.SQRT2;
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,224,70,'+(0.55+f*0.45)+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,0,Rpx,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,214,60,'+(0.10+f*0.30)+')'; ctx.beginPath(); ctx.arc(0,0,Rpx*f,0,7); ctx.fill();
    if(typeof drawZapBolts==='function') drawZapBolts(Rpx, f, k.x*0.013+k.y*0.007);
    ctx.restore();
  }
  const st = e.cState; if(st!=='smashTele' && st!=='sweepTele' && st!=='summonTele' && st!=='retract') return;
  const frac = clamp(1-e.cT/(e.cTmax||1),0,1);
  let cx = e.x, cy = e.y, R = e.r+110, col = '143,216,255';
  if(st==='smashTele'){ cx = e.tPt.x; cy = e.tPt.y; R = DWC_SMASH_R; col = '230,150,80'; }
  else if(st==='sweepTele'){ R = DWC_SWEEP_R; col = '240,170,90'; }
  else if(st==='retract'){ R = e.r+70; col = '255,224,138'; }
  const iso = toIso(cx,cy);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle='rgba('+col+','+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
  ctx.fillStyle='rgba('+col+','+(0.08+frac*0.26)+')'; ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill();
  ctx.restore();
}
function drawDwConstructIso(e){
  // v419: redesigned as a blocky, riveted dwarven machine -- slab legs, a cuboid chassis with a square core, box arms and cube fists.
  // Curled up (retract / roll / dizzy) it folds into a spinning octagonal ball of plates.
  const iso = toIso(e.x,e.y), t = e.animT||0, flash = e.hitT>0, dead = !!e.dead;
  const st = e.cState, flat = !dead && (st==='flatten' || st==='laser' || st==='rise'), curled = !dead && (st==='retract' || st==='roll' || st==='dizzy' || flat);   // v490: flat = legs folded for the Furnace Beam
  const s = e.r/46;
  const roll = e.rollAng||0, moving = !!e.moving && !curled;
  drawShadow(iso.x, iso.y, 52*s, 17*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s, flat ? s*0.7 : s);
  const ink = '#17120a', brz = flash?'#fff':'#a98a4c', brzD = flash?'#fff':'#6e5830', brzL = flash?'#fff':'#d2b46c', steel = flash?'#fff':'#4d4a40', steelL = flash?'#fff':'#74705f';
  const glow = dead ? '#2a2620' : 'rgba(140,225,255,'+clamp(0.7 + Math.sin(t*4)*0.25 + (st==='dizzy'?Math.sin(t*30)*0.2:0), 0.25, 1)+')';
  ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  const box = (x,y,w,h,fill,hi)=>{
    ctx.fillStyle = fill; ctx.fillRect(x,y,w,h);
    if(hi){ ctx.fillStyle = 'rgba(255,240,200,0.22)'; ctx.fillRect(x,y,w,Math.min(3,h*0.2)); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x,y+h-Math.min(3,h*0.2),w,Math.min(3,h*0.2)); }
    ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(x,y,w,h);
  };
  const rivet = (x,y)=>{ ctx.fillStyle = flash?'#fff':'#c9b27a'; ctx.fillRect(x-1.6,y-1.6,3.2,3.2); };
  if(!curled){
    const sag = dead ? 10 : 0;
    const by0 = -40 + sag;                                   // underside of the chassis
    // four slab legs: hip block, shin block, foot plate, with a piston bar
    for(let i=0;i<4;i++){
      const side = (i%2===0) ? -1 : 1, back = i>=2 ? 1 : 0;
      const ph = moving ? Math.sin(t*5+i*Math.PI/2) : 0, lift = Math.max(0,ph)*8;
      const lx = side*(34+back*0) - 7 + (back? side*4 : 0), ly = by0 - 6;
      box(lx-3, ly, 20, 16, brzD, true);                      // hip
      ctx.fillStyle = steel; ctx.fillRect(lx+5, ly+16, 4, 14); ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.strokeRect(lx+5, ly+16, 4, 14);   // piston
      box(lx, ly+16, 14, 18-lift*0.4, brz, true);             // shin
      box(lx-5, -9 - lift, 24, 9, brzD, true);                // foot slab
      rivet(lx+2, ly+5); rivet(lx+11, ly+5);
    }
    // chassis: a stacked cuboid
    box(-48, by0-60, 96, 62, brz, true);
    box(-52, by0-68, 104, 12, brzD, true);                   // top plate
    box(-52, by0-4, 104, 8, brzD, true);                     // belly plate
    for(const px of [-34,-12,12,34]){ ctx.strokeStyle = 'rgba(30,22,10,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px, by0-55); ctx.lineTo(px, by0-8); ctx.stroke(); }
    for(const [rx,ry] of [[-44,by0-62],[44,by0-62],[-44,by0-6],[44,by0-6],[-44,by0-34],[44,by0-34]]) rivet(rx, ry);
    // vents on the left, gear on the right
    for(let k=0;k<4;k++){ ctx.fillStyle = '#1b160d'; ctx.fillRect(-42, by0-52+k*8, 22, 4); }
    ctx.save(); ctx.translate(30, by0-44); ctx.rotate(dead?0:t*1.6); ctx.fillStyle = steelL; ctx.strokeStyle = ink; ctx.lineWidth = 1.5;
    for(let k=0;k<8;k++){ ctx.rotate(Math.PI/4); ctx.fillRect(-2.6,-13,5.2,6); }
    ctx.fillRect(-9,-9,18,18); ctx.strokeRect(-9,-9,18,18); ctx.fillStyle = ink; ctx.fillRect(-3,-3,6,6); ctx.restore();
    // square core
    ctx.fillStyle = '#16120a'; ctx.fillRect(-16, by0-42, 32, 32); ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.strokeRect(-16, by0-42, 32, 32);
    ctx.fillStyle = glow; ctx.fillRect(-11, by0-37, 22, 22);
    if(!dead){ ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-8, by0-34, 7, 7); }
    // head: a square sensor block with a slit eye
    box(-15, by0-92, 30, 24, brzD, true);
    ctx.fillStyle = dead ? '#2a2620' : '#ffb35a'; ctx.fillRect(-10, by0-84, 20, 5);
    box(-3, by0-104, 6, 12, steel, false);                   // antenna mast
    // block arms: shoulder cube, upper arm, forearm, cube fist; they rise for the smash / sweep wind-ups
    const raise = (!dead && (st==='smashTele' || st==='sweepTele')) ? 1 : 0, swing = (e.atkAnimT>0 && !dead) ? 1 : 0;
    for(const side of [-1,1]){
      const sx = side*62, sy = by0-48;
      box(sx-12, sy-12, 24, 24, brz, true); rivet(sx-6, sy-6); rivet(sx+6, sy+6);   // shoulder
      const lift = raise ? -38 : swing ? -14 : (dead ? 22 : Math.sin(t*2+side)*3);
      box(sx-8, sy+12, 16, 30, brzD, true);                                        // upper arm
      ctx.fillStyle = steel; ctx.fillRect(sx-2, sy+14, 4, 26);
      box(sx-10+side*3, sy+40+lift*0.3, 20, 22, brz, true);                        // forearm
      box(sx-15+side*4, sy+60+lift*0.55, 30, 28, brzL, true);                      // fist cube
      rivet(sx-8+side*4, sy+66+lift*0.55); rivet(sx+8+side*4, sy+66+lift*0.55);
    }
  } else {
    // folded ball: a spinning octagon of plates around a square core
    const by = -46, R0 = 46;
    ctx.save(); ctx.translate(0, by); ctx.rotate(roll);
    ctx.fillStyle = brz; ctx.strokeStyle = ink; ctx.lineWidth = 2.5;
    ctx.beginPath(); for(let k=0;k<8;k++){ const a = k*Math.PI/4 + Math.PI/8; const px = Math.cos(a)*R0, py = Math.sin(a)*R0; k?ctx.lineTo(px,py):ctx.moveTo(px,py); } ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = brzD; ctx.beginPath(); for(let k=0;k<8;k++){ const a = k*Math.PI/4 + Math.PI/8; const px = Math.cos(a)*R0*0.7, py = Math.sin(a)*R0*0.7; k?ctx.lineTo(px,py):ctx.moveTo(px,py); } ctx.closePath(); ctx.fill(); ctx.stroke();
    for(let k=0;k<8;k++){ const a = k*Math.PI/4 + Math.PI/8; ctx.strokeStyle = 'rgba(30,22,10,0.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(Math.cos(a)*R0*0.7, Math.sin(a)*R0*0.7); ctx.lineTo(Math.cos(a)*R0, Math.sin(a)*R0); ctx.stroke(); rivet(Math.cos(a+Math.PI/8)*R0*0.86, Math.sin(a+Math.PI/8)*R0*0.86); }
    ctx.fillStyle = '#16120a'; ctx.fillRect(-14,-14,28,28); ctx.strokeStyle = ink; ctx.strokeRect(-14,-14,28,28);
    ctx.fillStyle = glow; ctx.fillRect(-9,-9,18,18);
    ctx.restore();
    if(st==='dizzy'){
      ctx.strokeStyle = '#ffe08a'; ctx.lineWidth = 2;
      for(let k=0;k<3;k++){ const a = t*5 + k*2.1; ctx.beginPath(); ctx.arc(Math.cos(a)*26, by-58+Math.sin(a)*5, 4, 0, 7); ctx.stroke(); }
    }
  }
  ctx.restore();
}
// v419: the dead Construct's runestone -- a tall pulsing beam, a bright halo and a floating rune so it can't be missed
function drawRunestoneBeacon(h, clock){
  const iso = toIso(h.x, h.y), t = clock||0, pulse = 0.65 + 0.35*Math.sin(t*3.2);
  ctx.save(); ctx.translate(iso.x, iso.y-70); ctx.globalCompositeOperation = 'lighter';
  const beam = ctx.createLinearGradient(0,40,0,-260); beam.addColorStop(0,'rgba(120,220,255,'+(0.5*pulse)+')'); beam.addColorStop(1,'rgba(120,220,255,0)');
  ctx.fillStyle = beam; ctx.fillRect(-18-6*pulse,-260,36+12*pulse,300);
  const gr = ctx.createRadialGradient(0,0,6,0,0,150); gr.addColorStop(0,'rgba(190,245,255,'+(0.85*pulse)+')'); gr.addColorStop(0.35,'rgba(100,200,255,'+(0.4*pulse)+')'); gr.addColorStop(1,'rgba(60,150,255,0)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,150,0,7); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(iso.x, iso.y-70-Math.sin(t*2.4)*8);
  ctx.fillStyle = '#e8fbff'; ctx.strokeStyle = '#4fb4ff'; ctx.lineWidth = 3; ctx.shadowColor = '#8fe4ff'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.moveTo(0,-26); ctx.lineTo(15,0); ctx.lineTo(0,26); ctx.lineTo(-15,0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#2a7fc0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5,-8); ctx.lineTo(5,-2); ctx.lineTo(-4,6); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for(let k=0;k<6;k++){ const a = t*1.3 + k*1.05, rr = 40+14*Math.sin(t*2+k); ctx.fillStyle = 'rgba(190,240,255,'+(0.4+0.4*Math.sin(t*5+k))+')'; ctx.beginPath(); ctx.arc(iso.x+Math.cos(a)*rr, iso.y-70+Math.sin(a)*rr*0.5-((t*30+k*40)%90), 2.4, 0, 7); ctx.fill(); }
  ctx.restore();
}
function drawConstructIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, flash = e.hitT>0, face = e.faceSign||1, moving = e.moving;
  const col = FHD_EL_COL[e.dmgType||e.elem||'lightning'] || '#8fd8ff';
  const ink = '#17120a', bz = flash?'#fff':(e.color||'#a98a4c'), bzD = flash?'#fff':'#6e5830';
  const walk = moving ? Math.sin(t*9) : 0;
  ctx.save(); ctx.translate(iso.x, iso.y);
  if(e.type==='cogcrawler'){
    const s = e.r/13; drawShadow(0, 0, 16*s, 6*s);
    ctx.scale(face*s, s); ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
    ctx.strokeStyle = bzD; ctx.lineWidth = 2.2;
    for(let i=0;i<3;i++){ const ph = moving ? Math.sin(t*14+i*2.1)*3 : 0; ctx.beginPath(); ctx.moveTo(-8+i*8,-6); ctx.lineTo(-11+i*9+ph,0); ctx.moveTo(-8+i*8,-6); ctx.lineTo(-5+i*9-ph,0); ctx.stroke(); }
    ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.fillStyle = bz;
    roundRect(-12,-17,24,12,5); ctx.fill(); ctx.stroke();
    // cog on its back
    ctx.save(); ctx.translate(0,-18); ctx.rotate(t*3); ctx.fillStyle = bzD;
    for(let k=0;k<6;k++){ ctx.rotate(Math.PI/3); ctx.fillRect(-1.6,-6.5,3.2,3.4); }
    ctx.beginPath(); ctx.arc(0,0,4.2,0,7); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(7,-12,2.2,0,7); ctx.fill();
  } else if(e.type==='gearguard'){
    const s = e.r/26; drawShadow(0, 0, 24*s, 8.5*s);
    ctx.scale(face*s, s); ctx.strokeStyle = ink; ctx.lineWidth = 1.3;
    const bob = moving ? Math.abs(Math.sin(t*5))*1.6 : Math.sin(t*2)*0.6;
    ctx.fillStyle = bzD;
    roundRect(-11,-14-walk*1.5,9,14+walk*1.5,2); ctx.fill(); ctx.stroke();
    roundRect(2,-14+walk*1.5,9,14-walk*1.5,2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = bz; roundRect(-16,-42+bob,32,30,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = bzD; ctx.fillRect(-16,-28+bob,32,3);
    // shoulder gears
    for(const sd of [-1,1]){ ctx.save(); ctx.translate(sd*18,-38+bob); ctx.rotate(t*2*sd); ctx.fillStyle = bz;
      for(let k=0;k<6;k++){ ctx.rotate(Math.PI/3); ctx.fillRect(-1.8,-8,3.6,4); } ctx.beginPath(); ctx.arc(0,0,6,0,7); ctx.fill(); ctx.stroke(); ctx.restore(); }
    // arms + fists (raised during a slam wind-up)
    const up = (e.tState==='tele') ? -12 : 0;
    for(const sd of [-1,1]){ ctx.fillStyle = bzD; roundRect(sd*17-4,-36+bob+up,8,22,3); ctx.fill(); ctx.stroke(); ctx.fillStyle = bz; ctx.beginPath(); ctx.arc(sd*17,-12+bob+up,7,0,7); ctx.fill(); ctx.stroke(); }
    // head + eye slit
    ctx.fillStyle = bz; roundRect(-8,-54+bob,16,13,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(-5,-49+bob,10,3);
  } else {
    const s = e.r/14; drawShadow(0, 0, 14*s, 5*s);
    ctx.scale(face*s, s); ctx.strokeStyle = ink; ctx.lineWidth = 1.3;
    ctx.strokeStyle = bzD; ctx.lineWidth = 2.2;
    for(let i=-1;i<=1;i++){ const ph = moving ? Math.sin(t*8+i*2)*2.5 : 0; ctx.beginPath(); ctx.moveTo(0,-13); ctx.lineTo(i*9+ph,0); ctx.stroke(); }
    ctx.strokeStyle = ink; ctx.lineWidth = 1.3; ctx.fillStyle = bz;
    roundRect(-5,-34,10,24,3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = bzD; for(let k=0;k<3;k++){ roundRect(-8,-31+k*7,16,3.4,1.4); ctx.fill(); ctx.stroke(); }
    const ch = e.atkAnimT>0 ? 1 : 0;
    ctx.fillStyle = col; ctx.globalAlpha = 0.55+ch*0.4; ctx.beginPath(); ctx.arc(0,-38,4.5+ch*3,0,7); ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.restore();
  drawHpBar(iso, (e.type==='gearguard' ? 62 : e.type==='cogcrawler' ? 30 : 46)*(e.r/(e.type==='gearguard'?26:e.type==='cogcrawler'?13:14)), e.r, e.hp, e.maxHp);   // v419: boiler/foundry machines show life bars
}
function spawnAncientRuinsPopulation(g, floor){
  const types = RUINS_MONSTERS_BY_FLOOR[floor];
  // v215: packs of 3-5 (was lone monsters), many more of them so packs sit close together.
  const packs = 36 + floor*6;
  for(let i=0;i<packs;i++){
    const type = types[Math.floor(Math.random()*types.length)];
    const lead = spawnEnemy(g, type);
    const n = 3 + Math.floor(Math.random()*3);
    for(let k=1;k<n;k++){
      const a = Math.random()*Math.PI*2, d = 28 + Math.random()*32;
      spawnEnemy(g, type, {x:lead.x+Math.cos(a)*d, y:lead.y+Math.sin(a)*d});
    }
  }
  // v456: cave bats flit through every floor
  for(let i=0;i<6+floor*2;i++){
    const lead = spawnEnemy(g, 'firebat'); if(!lead) continue;
    lead.reg = true; lead.color = '#4a3c56'; lead.dmgType = null;
    for(let k=0;k<1+Math.floor(Math.random()*2);k++){ const b = spawnEnemy(g, 'firebat', {x:lead.x+rand(-30,30), y:lead.y+rand(-30,30)}); if(b){ b.reg = true; b.color = '#4a3c56'; b.dmgType = null; } }
  }
  // v215: floor 1 always has one big brute so the zone map can be found early
  if(floor===1){
    const b = spawnEnemy(g, 'skeletonbrute');
    b.r = Math.round(b.r*1.35); b.maxHp = Math.round(b.maxHp*2.2); b.hp = b.maxHp; b.dmg *= 1.1;
  }
  if(floor===ANCIENT_RUINS_FLOORS){
    const er = g.ruins.exitRoom;
    for(let i=0;i<2;i++) spawnEnemy(g, 'skeletonbrute', {x:rand(er.x+50, er.x+er.w-50), y:rand(er.y+50, er.y+er.h-50)});
    const boss = spawnEnemy(g, 'skeletonbrute', {x:er.x+er.w/2, y:er.y+er.h/2});
    initRevenant(boss);   // v417
    showMsg('Something old stirs in the depths...', 2.0);
  }
}
function enterAncientRuins(floor, opts){
  opts = opts || {};
  floor = clamp(floor, 1, ANCIENT_RUINS_FLOORS);
  const g = game, p = g.player;
  dungeonPersist(g);
  const stR = dungeonStoreGet(g, 'ruins', floor);
  g.scene = 'ancientruins';
  g.ruins = stR ? stR.room : makeAncientRuinsFloor(floor);
  g.room = g.ruins;
  g.depth = 22 + floor; // fixed area level per floor (23..27)
  if(opts.atBoss && g.ruins.chestSpot){ p.x = g.ruins.chestSpot.x - 20; p.y = g.ruins.chestSpot.y + 90; }
  else if(opts.atWaypoint && g.ruins.waypoint){ p.x = g.ruins.waypoint.x; p.y = g.ruins.waypoint.y + 34; }
  else if(opts.atStairs && g.ruins.stairsDown){ p.x = g.ruins.stairsDown.x; p.y = g.ruins.stairsDown.y + 60; }
  else { p.x = g.ruins.entrance.x + 34; p.y = g.ruins.entrance.y - 46; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Ancient Ruins — Level '+floor, 1.6);
  if(stR){ g.enemies = stR.enemies; g.loot = stR.loot || []; g.chest = stR.chest || null; g.bossKilled = !!stR.bossKilled; }
  else { g.bossKilled = false; spawnAncientRuinsPopulation(g, floor); }
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

// Old Man's "find 3 hunters" quest: each of the 3 hunters lives in a fixed
// kind of location -- one scattered randomly somewhere reachable in the
// Dark Forest (away from all four gates), one trapped beside the Spider
// Lair's boss, and one waiting at the end (exit room) of the Bear Cave.
// Walking near any of them marks it found and advances shared progress.
function pickHunterSpot(forest){
  let tries = 0, x, y;
  do{
    x = rand(120, forest.w-120); y = rand(120, forest.h-120);
    tries++;
  } while(tries<600 && (
    !forestOpenAt(x,y,150) || dist({x,y}, forest.townGate) < 220 ||
    dist({x,y}, forest.spiderLairGate) < 220 || dist({x,y}, forest.bearCaveGate) < 220 || dist({x,y}, forest.sunGate) < 220 ||
    hunterSpotBlocked(forest, x, y)
  ));
  return {x,y};
}
// v230: a hunter may never be placed inside a tree/rock/prop (he could end up unreachable)
function hunterSpotBlocked(forest, x, y){
  for(const o of (forest.obstacles||[])){ if(circleRectCollide(x, y, 46, o.x, o.y, o.w, o.h)) return true; }
  return false;
}
// v230: which part of the Dark Forest a position is in, for clues
function forestRegionWords(forest, pos){
  const fx = pos.x/forest.w, fy = pos.y/forest.h;
  const ns = fy<0.36 ? 'north' : fy>0.64 ? 'south' : '', ew = fx<0.36 ? 'west' : fx>0.64 ? 'east' : '';
  return (ns||ew) ? ('the '+(ns&&ew ? ns+'-'+ew : ns||ew)+' of the Dark Forest') : 'the heart of the Dark Forest';
}
const HUNTER_NAMES = {foundForest:'Dark Forest hunter', foundSpider:'Spider Lair hunter', foundBear:'Bear Cave hunter'};
function hunterClueFor(p, key){   // v299: just a short pointer, no tracker
  return key==='foundForest' ? 'Check the Dark Forest' : key==='foundSpider' ? 'Check the Spider Lair' : 'Check the Bear Cave';
}
function huntersStatusList(p, q){
  return ['foundForest','foundSpider','foundBear'].map(k=>({key:k, name:HUNTER_NAMES[k], found:!!q[k], clue:q[k] ? '' : hunterClueFor(p,k)}));
}
function spawnQuestHunters(g){
  g.forest.hunters = [];
  const p = g.player;
  const q = getQuest(p, QUEST_FIND_HUNTERS.id);
  // v65: the Forest hunter is always placed, whether or not the Old Man's
  // quest has been accepted yet -- see spawnSpiderLairWave/spawnBearCaveWave
  // for the same rule on the other two. Once actually rescued (foundForest),
  // he doesn't come back.
  if(q && q.foundForest) return;
  let s = p.forestHunterPos;
  if(!s || hunterSpotBlocked(g.forest, s.x, s.y)){
    // the saved spot is now covered by scenery (the forest is re-grown each visit): nudge to free ground nearby, else pick a new one
    let moved = null;
    if(s){ for(let k=0;k<60 && !moved;k++){ const a=Math.random()*6.283, d=40+k*6, x=clamp(s.x+Math.cos(a)*d,120,g.forest.w-120), y=clamp(s.y+Math.sin(a)*d,120,g.forest.h-120); if(!hunterSpotBlocked(g.forest,x,y)) moved={x,y}; } }
    s = moved || pickHunterSpot(g.forest);
    if(!moved || !p.forestHunterPos) p.forestHunterPos = {x:s.x, y:s.y};
  }
  g.forest.hunters = [{x:s.x, y:s.y, r:14, found:false}];
}
// v65: rescuing any hunter before ever talking to the Old Man now starts
// the quest itself (rather than requiring the Old Man's dialogue first) --
// called only once a hunter is actually reached, so simply walking around
// never silently starts the quest. Safe to call when the quest is already
// active/complete: returns the existing quest object untouched.
function ensureHuntersQuestStarted(p){
  if(!p.quests) p.quests = [];
  let q = getQuest(p, QUEST_FIND_HUNTERS.id);
  if(!q){
    q = {id:QUEST_FIND_HUNTERS.id, name:QUEST_FIND_HUNTERS.name, desc:QUEST_FIND_HUNTERS.desc, status:'active', progress:0, total:QUEST_FIND_HUNTERS.total, foundForest:false, foundSpider:false, foundBear:false};
    p.quests.push(q);
    updateQuestBadge();
  }
  return q;
}
// v65: each rescued hunter hints at the next leg of the chase, EXCEPT
// whichever of the 3 happens to be rescued last in a given playthrough --
// that one instead just thanks the player, since there's no one left to
// point at. Per the Old Man's/hunters' own (slightly redundant) account of
// it: both the Dark Forest hunter and the Bear Cave hunter point to the
// Spider Lair, and only the Spider Lair hunter points back to the Bear
// Cave -- implemented exactly as specified, asymmetry and all.
const HUNTER_RESCUE_HINT = {
  foundForest: 'Check the spider lair for my friend',
  foundBear: 'Check the spider lair for my friend',
  foundSpider: 'Check the bear cave',
};
// Shared "walked up to a trapped hunter" check, reused by the Forest, the
// Spider Lair (beside its boss) and the Bear Cave (in its exit room) --
// flagKey is which of the 3 ('foundForest'/'foundSpider'/'foundBear') this
// particular marker represents, so progress only ever counts once per hunter.
// v474: walking up to a trapped hunter only offers the rescue; the interact button frees them
function checkQuestHunterAt(g, hunter, flagKey){
  if(!hunter || hunter.found) return false;
  const p = g.player;
  if(dist(p,hunter) < hunter.r + p.r + 24){ g._hunterAt = {hunter, flagKey}; return true; }
  return false;
}
function rescueHunterNow(){
  const g = game, at = g && g._hunterAt; if(!at) return;
  const hunter = at.hunter, flagKey = at.flagKey, p = g.player;
  if(!hunter || hunter.found || dist(p,hunter) > hunter.r + p.r + 40) return;
  g.lastKillPos = {x:hunter.x, y:hunter.y};   // the way out opens beside the freed hunter
  {
    const q = ensureHuntersQuestStarted(p);
    if(q[flagKey]) return; // already registered -- shouldn't happen since hunter.found guards this, but keep it safe
    hunter.found = true;
    q[flagKey] = true;
    q.progress = Math.min(q.total, q.progress+1);
    const isLast = q.progress>=q.total;
    if(isLast){
      q.status = 'complete';
      showMsg('"Thanks for rescuing me!"', 2.4);
    } else {
      // v489: the freed hunter points you to the next one still missing
      const HUNTER_AREA = {foundForest:'the Dark Forest', foundSpider:'the Spider Lair', foundBear:'the Bear Cave'};
      const next = huntersStatusList(p, q).find(h=>!h.found);
      showMsg('"Thanks for saving me! Check '+(next ? HUNTER_AREA[next.key] : 'the forest')+' for my companions."', 3.4);
    }
    updateQuestBadge();
    saveGame();
  }
}
function forestCheckHunters(g){
  if(!g.forest || !g.forest.hunters || !g.forest.hunters.length) return false;
  for(const h of g.forest.hunters) if(checkQuestHunterAt(g, h, 'foundForest')) return true;
  return false;
}

let bigMsgT = 0;
// v441: on-screen text anchors to the bottom of the top HUD (and the boss bar when a boss is up), so no text covers the character or the middle
function hudTextAnchor(belowBanner){
  let y = 0;
  const tw = document.getElementById('topWrap') || document.getElementById('topStrip');
  if(tw){ const r = tw.getBoundingClientRect(); if(r.height>0) y = r.bottom; }
  if(window.__bossBarBottom) y = Math.max(y, window.__bossBarBottom);
  y += 6;
  const bm = document.getElementById('bigMsg');
  if(bm){
    if(bm.style.top !== Math.round(y)+'px') bm.style.top = Math.round(y)+'px';
    if(belowBanner && (parseFloat(getComputedStyle(bm).opacity) > 0.05 || Date.now() < (showBigMsg._until||0))) y = Math.max(y, bm.getBoundingClientRect().bottom + 2);
  }
  return y;
}
// v490: banners queue up (one after another) instead of overwriting each other; `speech` shows a quoted line in mixed case
const _bmQueue = [];
function showBigMsg(title, sub, dur, small, beast, speech){
  const now = Date.now();
  if(now < (showBigMsg._until||0)){
    if(_bmQueue.length < 5 && !_bmQueue.some(q=>q[0]===title && q[1]===(sub||''))) _bmQueue.push([title, sub||'', dur, small, beast, speech]);
    return;
  }
  showBigMsgNow(title, sub, dur, small, beast, speech);
}
function showBigMsgNext(){ const q = _bmQueue.shift(); if(q) showBigMsgNow.apply(null, q); }
function showBigMsgNow(title, sub, dur, small, beast, speech){
  const el = document.getElementById('bigMsg');
  dur = dur || 4.5; showBigMsg._until = Date.now() + dur*1000 + 250;
  clearTimeout(showBigMsg._q); showBigMsg._q = setTimeout(showBigMsgNext, dur*1000 + 300);
  el.classList.toggle('small', !!small); el.classList.toggle('beast', !!beast); el.classList.toggle('speech', !!speech);
  el.querySelector('.bmTitle').textContent = title; el.querySelector('.bmSub').textContent = sub || '';
  try{ hudTextAnchor(false); }catch(e){}
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  try{ sfxPlay('banner', small?0.6:1); }catch(e){}
  el.style.opacity = 1; bigMsgT = dur || 4.5;
  clearTimeout(showBigMsg._t); showBigMsg._t = setTimeout(()=>{ el.style.transition='opacity .8s'; el.style.opacity=0; setTimeout(()=>{el.style.transition='';},900); }, (dur||4.5)*1000);
}
// v310: only the great beasts (Leviathan, Kraken, Mastodon, Molten Colossus, Gojira) get the big gold banner; every other boss line is a quiet message
function bossMsg(title, sub, dur, color){ showBigMsg(title, sub||'', Math.max(dur||3.6, 3.6), true); }   // v490: boss lines are story banners now (was a small top line)
// v378: one house style for quest / reward lines: "Quest Accepted · Name", "Quest Complete · Name", "Obtained · Item"
function stdMsg(text, color){
  if(typeof text==='string'){ const ob = /^(.+?)\s+obtained!?$/i.exec(text.trim()); if(ob && ob[1].length < 90) text = 'Obtained: '+ob[1]; else text = text.replace(/^Chest:\s*/i, 'Obtained: '); }   // v490: every item line reads 'Obtained · ...'
  const m = /^(New quest|Quest accepted|Quest started|Quest complete|Quest updated|Reward|Obtained|Quest Accepted|Quest Complete)\s*[:\u2014-]\s*(.+)$/i.exec(text||'');
  if(!m) return {text, color};
  const k = m[1].toLowerCase(), head = /^new quest|accepted|started/.test(k) ? 'Quest Accepted' : /complete/.test(k) ? 'Quest Complete' : /updated/.test(k) ? 'Quest Updated' : k==='reward' ? 'Reward' : 'Obtained';
  return {text: head+' \u00b7 '+m[2], color: color || '#c9b27a'};
}
const SKILL_USE_MSGS = new Set(['Wrath!','Whirlwind!','War Cry!','Vortex erupts!','Vanish!','Unbreakable!','Trap set!','Tornado!','Thunderstep!','Storm Surge!','Soul Nova!','Soul Gate!','Shadow Step!','Recall!','Rapid Shot!','Rally!','Rain of Arrows!','Rage Burst!','Pyro Torrent!','Precise Shot!','Poison Trap!','Poison Knives!','Plague!','Permafrost!','Nova!','JUGGERNAUT!','Immolate!','Ice Bolt!','Ice Armor explodes!','Hurricane!','Frost Trap!','Flame Vortex!','Fear!','Explosive Trap!','Charge!','Bulwark!','Bloodrage!','Blizzard!','Beast Fury!','Ambush!','A demon rises to serve you!','Consecrate','Field Dress...','Field Dress',"Hunter's Mark!",'Assault! Rage full']);
function showMsg(text, dur, color, mid){
  if(SKILL_USE_MSGS.has(text)) return;   // v443: active-skill casts no longer print a line at the top of the screen
  // v490: one house style per kind of message --
  //   story (quests, recipes, spoken lines) -> the big banner, queued and held a little longer;
  //   items ("Obtained · ...") -> the lower line, merging pickups that land together; everything else -> the top line.
  if(typeof text==='string' && !mid){
    const t = text.trim();
    if(/^["\u201c\u2018']/.test(t)){ showBigMsg(t, '', Math.max(dur||3, 4.5), true, false, true); return; }
    const qm = /^(New quest|Quest accepted|Quest started|Quest complete|Quest updated|Quest Accepted|Quest Complete)\s*[:\u2014-]\s*(.+)$/i.exec(t);
    if(qm){ const k = qm[1].toLowerCase(), head = /^new quest|accepted|started/.test(k) ? 'Quest Accepted' : /complete/.test(k) ? 'Quest Complete' : 'Quest Updated';
      try{ sfxPlay(head==='Quest Complete' ? 'questDone' : 'questAccept', 1); }catch(e){} showBigMsg(head, qm[2], Math.max(dur||3, 3.8), true); return; }
    const rm = /^(New recipe discovered|Recipe found on [^:]+|A UNIQUE stone is forged|Recipe learned)\s*:\s*(.+)$/i.exec(t);
    if(rm){ showBigMsg(/unique/i.test(rm[1]) ? 'Unique Stone Forged' : 'Recipe Learned', rm[2], Math.max(dur||3, 4), true); return; }
  }
  const _orig = text, s = stdMsg(text, color); text = s.text; color = s.color;
  if(/^Obtained \u00b7 /.test(text) && game.msgText && /^Obtained \u00b7 /.test(game.msgText) && game.msgT > (dur||3)*1.4 - 0.6 && game.msgText.length < 110){
    game.msgText += ', ' + text.slice(11); game.msgT = Math.max(game.msgT, (dur||3)*1.4); return;   // several items at once read as one line
  }
  try{ if(/^Quest Accepted/.test(text)) sfxPlay('questAccept',1); else if(/^Quest Complete/.test(text)) sfxPlay('questDone',1); else if(/^(Reward|Obtained)/.test(text)) sfxPlay('lootRare',0.8); }catch(e){}
  game.msgText = text; game.msgT = (dur||3)*1.4; game.msgColor = color || ''; game.msgPos = mid ? 'mid' : (s.text!==_orig ? 'low' : 'top');
}

function nextDepth(){
  game.depth++;
  game.room = genRoom(game.depth);
  game.player.x = game.room.entranceSpawn.x; game.player.y = game.room.entranceSpawn.y;
  game.enemies = []; game.projectiles=[]; game.loot=[]; game.portal=null; game.chest=null; game.portalIsBoss=false; game.traps=[]; game.bossKilled=false;
  game.player.hp = Math.min(game.player.maxHp, game.player.hp + game.player.maxHp*0.25);
  game.player.mp = game.player.maxMp;
  showMsg('Depth '+game.depth, 1.4);
  spawnWave(game);
  ensureFollowers(game);
  for(const f of game.followers){
    f.x = game.player.x; f.y = game.player.y;
    f.hp = f.maxHp = followerMaxHp(game.player, f);
  }
}

function gainXp(g, amt){
  const p = g.player;
  if(!isFinite(p.xp)) p.xp = 0;   // v441: repair XP broken by the v433 xpLevelMult bug
  if(!isFinite(amt)) amt = 0;
  p.xp += amt;
  let leveled = false;
  while(p.level < LEVEL_CAP && p.xp >= p.xpNext){
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = xpForLevel(p.level);
    p.skillPoints = (p.skillPoints||0) + 1;   // v305: back to 1 point per level (mastery shares the same pool)
    recalcStats(p);
    // v63: leveling up fully restores the character -- full HP (the
    // explicit ask) and, in the same spirit, full MP/resource too, so a
    // level-up always reads as a clean, fully-topped-off fresh start.
    p.hp = p.maxHp;
    p.mp = p.maxMp;
    g.levelUpFlash = 0.8;
    showMsg('Level '+p.level+'!'+((p.skillPoints||0)>=2 ? '  —  '+p.skillPoints+' unspent skill points' : ''), (p.skillPoints||0)>=2 ? 2.4 : 1.2);
    leveled = true;
  }
  if(p.level >= LEVEL_CAP) p.xp = Math.min(p.xp, Math.max(0, p.xpNext-1));
  if(leveled){
    skillsBadge.style.display = 'flex';
    saveGame();
  }
}

// (v155) loot never lands on water tiles (it could not be picked up there): anything dropped over water is moved to the nearest dry spot.
// v478 health potion drops: 8% (v479) from ordinary monsters, 20% magic, 35% elite (Blood Harvest raises these), 2 from bosses
function potionDropChance(g, en, isLairBoss){
  if(en && (en.isBoss || en.isLairBoss || isLairBoss || en.bkBoss)) return 2;
  const base = (en && en.elite) ? 0.35 : (en && en.magic) ? 0.20 : 0.08;   // v479: ordinary monsters 8% (was 5%)
  return base * bloodHarvestMult(g.player);
}
// v478: health globes drop only from the great bosses -- one each time they lose a quarter of their life, two when they fall
function isGlobeBoss(e){ return !!(e && (e.bkBoss || e.kraken || e.lvBoss || e.mastodon || e.colossus || e.prot || e.fhCmd || e.type==='dwconstruct' || e.hwGuardian || e.wlord || e.gj || e.balrog) && !e.kAdd && !e.tentacle); }
function dropGlobes(g, e, n){ for(let k=0;k<n;k++){ const a = Math.random()*6.283, d = rand(40, 90), l = {type:'potion', x:e.x+Math.cos(a)*d, y:e.y+Math.sin(a)*d, r:9}; fixLootSpot(g, l); g.loot.push(l); } }   // v490: never in water / walls
// v490: loot (health potions, health globes, items, gold) never lands where you can't reach it: water, lava,
// walls, rocks or outside a dungeon's floor. A bad spot is nudged to the nearest open one, searching outward and
// trying the side facing the player first; if nothing is found it lands at the player's feet.
function lootSpotBad(g, x, y){
  const rm = g && g.room; if(!rm) return false;
  if(x<20 || y<20 || x>rm.w-20 || y>rm.h-20) return true;
  if(rm.floorRects && !rm.floorRects.some(r=>x>r.x+10 && x<r.x+r.w-10 && y>r.y+10 && y<r.y+r.h-10)) return true;
  try{
    const wf = rm.waterAt || (g.scene==='lakesideruins' && typeof lakeWaterAt==='function' ? lakeWaterAt : null);
    if(wf && wf(x,y)) return true;
    if(Array.isArray(rm.waters) && subWaterAt(rm,x,y)) return true;
    if(rm.lavaAt && rm.lavaAt(x,y)) return true;
  }catch(e){}
  return !!(rm.obstacles && posBlockedByObstacles(x, y, 10, rm.obstacles));
}
function fixLootSpot(g, l){
  if(!l || !lootSpotBad(g, l.x, l.y)) return l;
  const p = g.player, a0 = p ? Math.atan2(p.y-l.y, p.x-l.x) : 0;
  for(let r=16; r<=480; r+=16){
    for(let k=0;k<16;k++){
      const a = a0 + (k%2 ? 1 : -1)*Math.ceil(k/2)*Math.PI/8, px = l.x+Math.cos(a)*r, py = l.y+Math.sin(a)*r;
      if(!lootSpotBad(g, px, py)){ l.x = px; l.y = py; return l; }
    }
  }
  if(p){ l.x = p.x + rand(-8,8); l.y = p.y + rand(-8,8); }
  return l;
}
function bossGlobeTick(g){
  if(!g || !g.enemies) return;
  for(const e of g.enemies){
    if(!(e.hp>0) || !(e.maxHp>0) || !isGlobeBoss(e)) continue;
    const step = e._globeStep||0;
    if(step<3 && e.hp/e.maxHp <= 0.75 - 0.25*step){ e._globeStep = step+1; dropGlobes(g, e, 1); }
  }
}
function dropLoot(g, x, y, enemyType, isLairBoss, en){
  const n0 = g.loot.length;
  dropLootRaw(g, x, y, enemyType, isLairBoss);
  { const pc = potionDropChance(g, en, isLairBoss), n = pc>=1 ? Math.floor(pc) : (Math.random() < pc ? 1 : 0);
    for(let k=0;k<n;k++) g.loot.push({type:'item', x:x+rand(-16,16), y:y+rand(-16,16), r:8, item:makePotionItem('health')}); }
  if(en && en.bkBoss && g.player){ const lvl = Math.max(1, g.player.level||1); for(let k=0;k<2;k++) g.loot.push({type:'item', x:x+rand(-24,24), y:y+rand(-24,24), r:8, item:generateItem(lvl, bossRarity(lvl), null, null, g.player)}); g.loot.push({type:'gold', x:x+rand(-20,20), y:y+rand(-20,20), r:9, amt:Math.ceil(80+g.depth*8)}); }   // v461 Bandit King
  if(g.scene==='lighthouse' && g.tower && g.tower.kpArea===9 && g.player){   // v398: the Breach is the endgame: much more loot, growing with depth
    const bf = g.tower.bf, lvl = Math.max(g.player.level||1, g.depth||1), jit = ()=>rand(-16,16);
    if(Math.random() < Math.min(0.85, 0.12 + 0.012*bf)) g.loot.push({type:'item', x:x+jit(), y:y+jit(), r:8, item:generateItem(lvl, null, null, null, g.player)});
    if(en && (en.elite || en.isLairBoss)){ for(let k=0;k<1+Math.floor(Math.max(0,bf-20)/15);k++) g.loot.push({type:'item', x:x+jit(), y:y+jit(), r:8, item:generateItem(lvl, eliteRarity(lvl), null, null, g.player)}); }
    if(Math.random() < 0.5) g.loot.push({type:'gold', x:x+jit(), y:y+jit(), r:9, amt:Math.ceil((rand(20,45)+g.depth*4+bf*6)*(1+clamp((g.player.goldFindPct||0),0,200)/100))});
  }
  if(en && (en.elite || en.magic)){
    const lvl = Math.max(1, (g.player&&g.player.level)||1);
    if(en.elite){
      g.loot.push({type:'item', x:x+rand(-14,14), y:y+rand(-14,14), r:8, item:generateItem(lvl, eliteRarity(lvl), null, null, g.player)});
      g.loot.push({type:'gold', x:x+rand(-14,14), y:y+rand(-14,14), r:9, amt:Math.ceil((rand(12,28)+g.depth*3)*(1+clamp(((g.player&&g.player.goldFindPct)||0),0,200)/100))});
      if(Math.random()<0.5) g.loot.push({type:'item', x:x+rand(-14,14), y:y+rand(-14,14), r:8, item:generateItem(lvl, null, null, null, g.player)});
    } else if(Math.random()<0.35){
      g.loot.push({type:'item', x:x+rand(-14,14), y:y+rand(-14,14), r:8, item:generateItem(lvl, packRarity(lvl), null, null, g.player)});
    }
  }
  for(let i=n0;i<g.loot.length;i++) fixLootSpot(g, g.loot[i]);   // v490: out of water, lava, walls and rocks (was water only)
}
function dropLootRaw(g, x, y, enemyType, isLairBoss){
  // v82: item generation is keyed off the character's CURRENT LEVEL, not
  // depth -- depth still drives the gold amounts below (monster/depth
  // difficulty scaling, untouched) and enemy scaling elsewhere.
  const charLevel = Math.max(1, monsterLevel(g));   // v250: item level = monster level (D2)
  // v83 Riches/Rich (+Gold Find %): a straight multiplier on every gold
  // pile this function drops.
  const goldMult = 1 + clamp(((g.player&&g.player.goldFindPct)||0), 0, 200)/100;
  if(enemyType==='boss' || isLairBoss){
    // a demon boss (or an upscaled Spider Lair / Bear Cave boss) always
    // drops a hefty pile of gold and a guaranteed good item
    g.loot.push({type:'gold', x, y, r:9, amt:Math.ceil((rand(20,35)+g.depth*2)*goldMult)});
    const item = generateItem(charLevel, bossRarity(charLevel), null, null, g.player);
    g.loot.push({type:'item', x:x+rand(-12,12), y:y+rand(-12,12), r:8, item});
    return;
  }
  // loot drop rates trimmed down overall, so a kill more often yields nothing at all
  const r = Math.random();
  const gp = 0;   // v478: health globes only come from the great bosses now (see bossGlobeTick); potions drop in dropLoot
  if(r<gp+0.22){ g.loot.push({type:'gold', x, y, r:7, amt:Math.ceil((rand(3,9)+g.depth)*goldMult)}); }
  const elite = /brute/.test(enemyType) || enemyType==='bear' || enemyType==='treant' || enemyType==='cavetroll' || enemyType==='fhtemplar' || enemyType==='armordon' || enemyType==='alligator' || enemyType==='vampire' || enemyType==='giant' || enemyType==='trollelder';
  if(Math.random() < (elite ? 0.26 : 0.11)){
    const item = generateItem(charLevel, null, null, null, g.player);
    g.loot.push({type:'item', x:x+rand(-10,10), y:y+rand(-10,10), r:8, item});
  }
}

