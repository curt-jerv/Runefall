// ---------------- Sunken Depths & Marsh Pool (v262) ----------------
// Two boss sub-zones that run on the 'lighthouse' scene rig (room.subzone = 'sunken' | 'pool').
//  * Sunken Depths -- off the Lakeside Ruins' Stonehenge once the Ancient Ruins are open. A flooded cave
//    (skeletons, storm snakes, alligators) leads to a long stone bridge over an underground lake: the Kraken.
//  * Marsh Pool -- a poisoned sinkhole at the south-east of the Black Marsh. Marsh monsters, giant crocodiles
//    and a great pool with the Leviathan. No bridge. The whole zone poisons the player (% of max life).
const SUNKEN_DEPTH = 26;
const SUNK_W = 5382, SUNK_H = 1472, SUNK_CY = 736;           // 46px-aligned so painted tiles match the collision rects
const SUNK_LAKE_X0 = 1909, SUNK_LAKE_X1 = 4163, SUNK_BR_Y0 = 621, SUNK_BR_Y1 = 851;
const POOL_W = 3818, POOL_H = 2208;
const POOL_CX = 2900, POOL_CY = 1104, POOL_RX = 650, POOL_RY = 800;
const SUNKEN_STATIC_STACKS = 2, SUNKEN_STATIC_PCT = 0.003;   // v491: each Static stack = 0.3% of max life per second (lightning, cut by lightning resistance)
const POOL_POISON_TICK_PCT = 0.03, POOL_POISON_TICK_S = 3;   // 3% of max life every 3s (applied smoothly), cut by poison resistance
function poolDepth(){ return BM_DEPTH + 1; }
function subWaterAt(room, x, y){
  const ws = room.waters;
  for(let i=0;i<ws.length;i++){ const q = ws[i]; if(x>q.x && x<q.x+q.w && y>q.y && y<q.y+q.h) return true; }
  return false;
}
function subNearestDry(room, x, y){
  if(!subWaterAt(room,x,y)) return {x,y};
  for(let r=20;r<=420;r+=20){
    for(let k=0;k<16;k++){
      const a = k*Math.PI/8, px = x+Math.cos(a)*r, py = y+Math.sin(a)*r;
      if(px>30 && py>30 && px<room.w-30 && py<room.h-30 && !subWaterAt(room,px,py) && !subWaterAt(room,px+22,py) && !subWaterAt(room,px-22,py) && !subWaterAt(room,px,py+22) && !subWaterAt(room,px,py-22)) return {x:px,y:py};
    }
  }
  return {x,y};
}
function subFinish(room){
  room.waters = room.obstacles.filter(o=>o.isWater);
  room.dryObstacles = room.obstacles.filter(o=>!o.isWater);
  room.waterAt = (x,y)=>subWaterAt(room,x,y);
  room.nearestDry = (x,y)=>subNearestDry(room,x,y);
  room.floor = 1; room.mine = false; room.fht = false; room.ft = false; room.rooftop = false; room.bossFloor = true;
  room.stairs = null; room.waypoint = null; room.beacon = null; room.witch = null; room.clearPortal = undefined;
  return room;
}
function subSeeded(seed){ let s = seed; return ()=>{ s = (s*1103515245 + 12345) & 0x7fffffff; return s/0x7fffffff; }; }
// v456: Sunken Depths is an organic grotto (like the Bear Cave): winding flooded caverns, then a great pool where the
// Kraken lives, crossed by a narrow wooden walkway to a small island, and a treasure alcove beside it.
const SKP = {cx:4300, cy:1330, rx:540, ry:420, isx:4075, isy:1330, isr:125, brY:1330, brHalf:48, brX0:3640};
function makeSunkenDepths(){
  const w = 5400, h = 2400, saveRand = Math.random, rnd = subSeeded(8821);
  Math.random = rnd;
  let R;
  try{
    const chs = [{x:300, y:1200, rx:200, ry:175}, {x:900, y:700, rx:300, ry:240}, {x:1000, y:1700, rx:280, ry:230}, {x:1700, y:1150, rx:340, ry:280},
                 {x:2400, y:620, rx:300, ry:240}, {x:2450, y:1760, rx:320, ry:240}, {x:3100, y:1150, rx:300, ry:260},
                 {x:4200, y:1300, rx:790, ry:650, a1:0.06, a2:0.04}, {x:4950, y:440, rx:270, ry:200, a1:0.08, a2:0.05}];
    const links = [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[6,7],[7,8]];
    R = organicCaveBuild({kind:'grotto', w, h, chambers:chs, links, tunnelR:110, entranceIdx:0, exitIdx:7, mainIdx:[1,2,3,4,5,6]});
    // grotto pools, off to the side in each cavern
    const pools = [];
    for(let i=1;i<=6;i++){
      const c = chs[i];
      for(let k=0;k<2;k++){
        const a = rnd()*6.28, pw = Math.round(c.rx*(0.38+rnd()*0.22)), ph = Math.round(c.ry*(0.32+rnd()*0.2));
        const cx = c.x+Math.cos(a)*c.rx*0.42, cy = c.y+Math.sin(a)*c.ry*0.42, q = {x:Math.round(cx-pw/2), y:Math.round(cy-ph/2), w:pw, h:ph};
        let ok = true;
        for(let yy=q.y-30; yy<=q.y+q.h+30 && ok; yy+=25) for(let xx=q.x-30; xx<=q.x+q.w+30; xx+=25) if(!mineOpenAt(R,xx,yy)){ ok = false; break; }
        if(ok && dist({x:cx,y:cy}, c) > 80 && pools.every(o=>!(q.x<o.x+o.w+70 && q.x+q.w>o.x-70 && q.y<o.y+o.h+70 && q.y+q.h>o.y-70))) pools.push(q);
      }
    }
    for(const q of pools) R.obstacles.push({x:q.x, y:q.y, w:q.w, h:q.h, isWater:true});
    // the Kraken's pool: water cells inside an ellipse, leaving the island and the walkway dry
    const TS = 46;
    for(let ty=Math.floor((SKP.cy-SKP.ry)/TS)*TS; ty<SKP.cy+SKP.ry; ty+=TS){
      let run = null;
      for(let tx=Math.floor((SKP.cx-SKP.rx)/TS)*TS; tx<=SKP.cx+SKP.rx+TS; tx+=TS){
        const mx = tx+TS/2, my = ty+TS/2, nx = (mx-SKP.cx)/SKP.rx, ny = (my-SKP.cy)/SKP.ry;
        const wet = nx*nx+ny*ny < 1 && Math.hypot(mx-SKP.isx, my-SKP.isy) > SKP.isr && !(Math.abs(my-SKP.brY) < SKP.brHalf && mx < SKP.isx);
        if(wet){ if(!run) run = {x:tx, y:ty, w:TS, h:TS+1, isWater:true, isLake:true}; else run.w += TS; }
        else if(run){ R.obstacles.push(run); run = null; }
      }
      if(run) R.obstacles.push(run);
    }
    const rocks = [];
    for(let i=0;i<80;i++){ const c = deepMineSpot(R, null, 20); if(c && !R.obstacles.some(o=>o.isWater && c.x>o.x-30 && c.x<o.x+o.w+30 && c.y>o.y-30 && c.y<o.y+o.h+30)) rocks.push({x:c.x, y:c.y, s:rand(0.6,1.2)}); }
    const crystals = [];
    for(let i=0;i<40;i++){ const c = deepMineSpot(R, null, 20); if(c) crystals.push({x:c.x, y:c.y, s:rand(0.6,1.3), hue:rnd()<0.5 ? 0 : 1, ph:rnd()*6}); }   // v490: 40 glowing crystals (was 70) -- each is an additive blend
    const ch = chs[8];
    const horde = [];
    for(let i=0;i<9;i++){ const a = i/9*6.28 + rnd()*0.4, rr = 70 + rnd()*70; horde.push({x:ch.x+Math.cos(a)*rr*1.2, y:ch.y+Math.sin(a)*rr*0.75, s:0.7+rnd()*0.6, gems:rnd()<0.5}); }
    const ent = chs[0];
    const entrance = {x:ent.x-ent.rx*0.6, y:ent.y, r:34};
    Object.assign(R, {subzone:'sunken', entrance, entranceSide:'left', entranceSpot:{x:entrance.x+90, y:entrance.y},
      chestSpot:{x:ch.x, y:ch.y, r:24}, extraChestSpot:{x:ch.x+125, y:ch.y+38, r:24}, portalSpot:{x:ch.x-150, y:ch.y+70},
      pools, rocks, crystals, horde, woodBridge:{x0:SKP.brX0, x1:SKP.isx-SKP.isr+20, y:SKP.brY, half:SKP.brHalf}, island:{x:SKP.isx, y:SKP.isy, r:SKP.isr}, name:'Sunken Depths'});
  } finally { Math.random = saveRand; }
  return subFinish(R);
}
function makePoolEllipse(obstacles){
  const TS = 46, y0 = POOL_CY - POOL_RY;
  for(let ty = Math.floor(y0/TS)*TS - 23; ty < POOL_CY + POOL_RY; ty += TS){
    const yc = ty + TS/2, k = (yc-POOL_CY)/POOL_RY; if(Math.abs(k) >= 1) continue;
    const half = POOL_RX*Math.sqrt(1-k*k);
    const L = Math.round((POOL_CX-half+23)/TS)*TS - 23, R = Math.round((POOL_CX+half+23)/TS)*TS - 23;
    if(R-L < TS) continue;
    obstacles.push({x:L, y:ty, w:R-L, h:TS+1, isWater:true, isLake:true});
  }
}
function makeMarshPool(){
  const w = POOL_W, h = POOL_H, cy = POOL_CY;
  const entrance = {x:16, y:cy, r:34};
  const obstacles = [];
  makePoolEllipse(obstacles);
  const inPool = (x,y)=>{ const dx=(x-POOL_CX)/(POOL_RX+90), dy=(y-POOL_CY)/(POOL_RY+90); return dx*dx+dy*dy < 1; };
  // stagnant ponds on the land west of the pool (one big crocodile or two snakes each)
  const ponds = []; let tries = 0;
  while(ponds.length < 7 && tries < 900){
    tries++;
    const pw = Math.round(rand(180,330)/46)*46, ph = Math.round(rand(100,200)/46)*46;
    const px = Math.round(rand(360, 1950)/46)*46 - 23, py = Math.round(rand(160, h-160-ph)/46)*46 - 23;
    const c = {x:px+pw/2, y:py+ph/2};
    if(dist(c, {x:entrance.x+90, y:cy}) < 420) continue;
    if(inPool(px,py) || inPool(px+pw,py) || inPool(px,py+ph) || inPool(px+pw,py+ph)) continue;
    if(px+pw > POOL_CX-POOL_RX-240) continue;
    if(ponds.some(q=>dist(c,{x:q.x+q.w/2,y:q.y+q.h/2}) < 400)) continue;
    ponds.push({x:px, y:py, w:pw, h:ph});
  }
  for(const q of ponds){ q.isWater = true; obstacles.push(q); }
  const room = { w, h, obstacles, subzone:'pool', entrance, entranceSide:'left', entranceSpot:{x:entrance.x+90, y:cy},
    chestSpot:{x:POOL_CX-POOL_RX-170, y:cy-40, r:24}, ponds, name:'Marsh Pool' };
  subFinish(room);
  const dryOK = (x,y,m)=> !subWaterAt(room,x,y) && !subWaterAt(room,x+m,y) && !subWaterAt(room,x-m,y) && !subWaterAt(room,x,y+m) && !subWaterAt(room,x,y-m);
  room.dryOK = dryOK;
  const trees = [];
  for(const bp of zoneBorderPoints(w, h, 40, 210, [{x:entrance.x,y:entrance.y,r:170}])) trees.push({x:bp.x, y:bp.y, s:rand(0.95,1.25)});
  for(let i=0;i<110;i++){
    const x = rand(120,w-120), y = rand(100,h-100);
    if(!dryOK(x,y,30) || dist({x,y},entrance) < 300) continue;
    trees.push({x, y, s:rand(0.8,1.3)});
  }
  const reeds = [];
  for(let i=0;i<520;i++){
    const x = rand(60,w-60), y = rand(60,h-60);
    const nearWater = subWaterAt(room,x+34,y)||subWaterAt(room,x-34,y)||subWaterAt(room,x,y+34)||subWaterAt(room,x,y-34);
    if(!nearWater && Math.random()<0.85) continue;
    if(subWaterAt(room,x,y)) continue;
    reeds.push({x, y, s:rand(0.7,1.25)});
  }
  const rocks = [];
  for(let i=0;i<40;i++){ const x = rand(100,w-100), y = rand(100,h-100); if(dryOK(x,y,30)) rocks.push({x,y,s:rand(0.6,1.2)}); }
  room.trees = trees; room.reeds = reeds; room.rocks = rocks;
  return room;
}
// storm snakes / giant crocodiles
function spawnBigCroc(g, pos){
  const e = spawnEnemy(g, 'alligator', pos);
  e.bigCroc = true; e.r = 34; e.hp = Math.round(e.hp*3.4); e.maxHp = e.hp; e.dmg *= 1.5; e.armor = 14; e.speed *= 0.85;
  return e;
}
function subFreeSpot(room, x0, x1, y0, y1, avoid, tries){
  for(let t=0;t<(tries||80);t++){
    const x = rand(x0,x1), y = rand(y0,y1);
    if(room.obstacles.some(o=>x>o.x-44 && x<o.x+o.w+44 && y>o.y-44 && y<o.y+o.h+44)) continue;
    if(avoid && avoid.some(a=>dist({x,y},a) < a.r)) continue;
    return {x,y};
  }
  return null;
}
function subWaterSpot(room, rect, tries){
  for(let t=0;t<(tries||60);t++){
    const x = rand(rect.x+30, rect.x+rect.w-30), y = rand(rect.y+30, rect.y+rect.h-30);
    if(subWaterAt(room,x,y)) return {x,y};
  }
  return null;
}
function spawnSunkenDepths(g){
  const room = g.room, av = [{x:room.entrance.x, y:room.entrance.y, r:380}, {x:SKP.cx, y:SKP.cy, r:SKP.rx+120}, {x:room.chestSpot.x, y:room.chestSpot.y, r:320}];
  const sp = (type,pos)=> pos && mineOpenAt(room,pos.x,pos.y) && !subWaterAt(room,pos.x,pos.y) ? spawnEnemy(g, type, pos) : null;
  const land = ()=> deepMineSpot(room, av, 80);
  const near = (c,r)=>({x:c.x+rand(-r,r), y:c.y+rand(-r,r)});
  for(let i=0;i<6;i++){ const c = land(); if(!c) continue; for(let k=0;k<3+Math.floor(Math.random()*2);k++) sp('skeleton', near(c,80)); sp('skeletonarcher', near(c,90)); }
  for(let i=0;i<4;i++){ const c = land(); if(!c) continue; for(let k=0;k<3;k++) sp('stormsnake', near(c,70)); }
  // squids everywhere -- in the pools and crawling over the rocks
  for(const q of room.pools){ for(let k=0;k<2;k++){ const s2 = subWaterSpot(room, q); if(s2) spawnSquid(g, s2); } }
  for(let i=0;i<12;i++){ const c = land(); if(!c) continue; for(let k=0;k<2+Math.floor(Math.random()*2);k++){ const pt = near(c,70); if(mineOpenAt(room,pt.x,pt.y) && !subWaterAt(room,pt.x,pt.y)) spawnSquid(g, pt); } }
  // electric eels in the water
  for(const q of room.pools){ const s3 = subWaterSpot(room, q); if(s3) spawnEel(g, s3); }
  for(let i=0;i<3;i++){ const a = i*2.1+0.5, pt = {x:SKP.cx+Math.cos(a)*SKP.rx*0.75, y:SKP.cy+Math.sin(a)*SKP.ry*0.75}; if(subWaterAt(room,pt.x,pt.y)) spawnEel(g, pt); }
  // bats in the vaults
  for(let i=0;i<7;i++){ const c = land(); if(!c) continue; for(let k=0;k<2+Math.floor(Math.random()*2);k++){ const b = spawnEnemy(g, 'firebat', near(c,60)); if(b){ b.reg = true; b.color = '#3c4a5a'; b.dmgType = null; } } }
  for(let i=0;i<2;i++){ const q = room.pools[i*2]; if(q){ const s4 = subWaterSpot(room, q); if(s4) sp('alligator', s4) || spawnEnemy(g,'alligator',s4); } }
  spawnSunkenKraken(g);
}
// v456 Electric eel: a storm snake that never leaves the water, drawn as a dark, glowing eel
function spawnEel(g, pos){
  const e = spawnEnemy(g, 'stormsnake', pos); if(!e) return null;
  e.eel = true; e.swimmer = true; e.speed = rand(95,115); e.r = 15; e.maxHp = Math.round(e.maxHp*1.6); e.hp = e.maxHp; e.dmg *= 1.2; e.sparkCd = rand(0.5,2);
  e.aggroRange = 420; e.leashRange = 700; e.wanderRadius = 0;
  return e;
}
function spawnMarshPool(g){
  const room = g.room, av = [{x:room.entrance.x, y:room.entrance.y, r:420}];
  const sp = (type,pos)=> pos && spawnEnemy(g, type, pos);
  const landTpl = [[['zombie',2,4]],[['zombie',2,3]],[['giantoad',1,2]],[['giantoad',1,2],['zombie',1,2]],[['poisonplant',2,3]],[['poisonplant',1,2],['zombie',1,2]],[['poisonplant',1,2],['giantoad',1,1]]];
  for(let i=0;i<20;i++){
    const c = subFreeSpot(room, 340, POOL_CX-POOL_RX-260, 160, room.h-160, av); if(!c) continue;
    for(const [type,mn,mx] of landTpl[Math.floor(Math.random()*landTpl.length)]){
      const n = mn + Math.floor(Math.random()*(mx-mn+1));
      for(let k=0;k<n;k++){
        for(let t=0;t<12;t++){ const x = c.x+rand(-110,110), y = c.y+rand(-110,110); if(x<60||y<60||x>room.w-60||y>room.h-60||!room.dryOK(x,y,22)) continue; spawnEnemy(g, type, {x,y}); break; }
      }
    }
  }
  // the far bank (east of the pool) is a poisoned strip with a few more packs
  for(let i=0;i<4;i++){ const c = subFreeSpot(room, POOL_CX+POOL_RX+60, room.w-120, 140, room.h-140, null); if(c){ sp('zombie', c); sp('giantoad', {x:c.x+40,y:c.y}); sp('poisonplant', {x:c.x-40,y:c.y+30}); } }
  // ponds: a big crocodile each (every other one adds an anaconda)
  room.ponds.forEach((q,i)=>{
    const s = subWaterSpot(room, q); if(s) spawnBigCroc(g, s);
    if(i%2===1){ const s2 = subWaterSpot(room, q); if(s2) sp('anaconda', s2); }
  });
  // two more giants lurk in the shallows of the final pool
  for(let i=0;i<2;i++){ const a = Math.PI + (i?0.9:-0.9); const s = {x:POOL_CX+Math.cos(a)*POOL_RX*0.82, y:POOL_CY+Math.sin(a)*POOL_RY*0.82}; if(subWaterAt(room,s.x,s.y)) spawnBigCroc(g, s); }
  spawnPoolLeviathan(g);
}
function enterSubZone(kind, opts){
  opts = opts || {};
  const g = game, p = g.player;
  g.scene = 'lighthouse'; g.lighthouseFloor = 1;
  g.tower = kind==='sunken' ? makeSunkenDepths() : kind==='temple' ? makeFloodedTemple() : kind==='rrtower' ? makeRRTower(opts.id, opts.floor) : makeMarshPool();
  g.room = g.tower;
  g.depth = kind==='sunken' ? SUNKEN_DEPTH : kind==='temple' ? TEMPLE_DEPTH : kind==='rrtower' ? RR_DEPTH + (opts.floor||1) : poolDepth();
  g.player.x = g.tower.entrance.x + 90; g.player.y = g.tower.entrance.y;
  if(opts.atWaypoint && g.tower.waypoint){ g.player.x = g.tower.waypoint.x; g.player.y = g.tower.waypoint.y + 40; }
  if(opts.atStairs && g.tower.stairsDown){ g.player.x = g.tower.stairsDown.x - 90; g.player.y = g.tower.stairsDown.y; }
  if(kind==='rrtower' && opts.from==='above' && g.tower.rrUp){ g.player.x = g.tower.rrUp.x - 110; g.player.y = g.tower.rrUp.y; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  g.poolT = 0;
  showMsg(g.tower.name+'  (Lv. '+g.depth+')', 1.8);
  if(kind==='sunken') spawnSunkenDepths(g); else if(kind==='temple') spawnFloodedTemple(g); else if(kind==='rrtower'){ const key = g.tower.rrId+'_'+(g.tower.rrFloor||1); if(g.rrStore && g.rrStore[key]) g.enemies = g.rrStore[key].filter(e=>e.hp>0); else spawnRRTower(g); } else spawnMarshPool(g);
  // v489: the boss is back each visit, so the chest/portal only appear after this visit's kill
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  saveGame();
}
function enterSunkenDepths(opts){ enterSubZone('sunken', opts); }
function enterMarshPool(opts){ enterSubZone('pool', opts); }
// after the boss: a reward chest (once per character) and a portal home to Mistfall
function subBossDown(g){
  const t = g.tower, p = g.player;
  if(!t || !t.chestSpot || t.clearPortal) return;
  t.clearPortal = t.portalSpot ? {x:t.portalSpot.x, y:t.portalSpot.y, r:24, toTown:true} : {x:t.chestSpot.x-40, y:t.chestSpot.y+140, r:24, toTown:true};
  const looted = t.subzone==='sunken' ? p.sunkenChestLooted : p.poolChestLooted;
  if(!looted) g.chest = {x:t.chestSpot.x, y:t.chestSpot.y, r:24, opened:false, subBoss:true};
  if(t.extraChestSpot && !p.sunkenChest2Looted) t.extraChest = {x:t.extraChestSpot.x, y:t.extraChestSpot.y, r:24, opened:false};   // v456: a second chest of lost gear
}
function openSubChest(g){
  const p = g.player, t = g.tower;
  g.chest.opened = true;
  if(t.subzone==='sunken') p.sunkenChestLooted = true; else p.poolChestLooted = true;
  p.gold += 300 + g.depth*10;
  if(t.subzone==='sunken'){ forceAddToBag(p, makeTemplarRunestoneItem()); showMsg('Chest: Defensive Runestone + gold', 3.2, '#9fe0ff'); npcMark(p, 'scholar', true); }
  else {
    const it = classRewardItem(p, Math.max(p.level, g.depth), 'reward');
    forceAddToBag(p, it);
    const it2 = generateItem(Math.max(p.level, g.depth), 'magic', null, null, p);
    forceAddToBag(p, it2);
    showMsg('Chest: '+it.name+' + '+it2.name+' + gold', 2.6);
  }
  g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.5, max:0.5, color:'#e8c44a'});
  bagPulse(); saveGame();
}
function updateSubZone(g, dt){
  const p = g.player, t = g.tower;
  updatePortalChoice(false);
  let skind = null;
  if(dist(p, t.entrance) < t.entrance.r + p.r + 22) skind = t.subzone==='sunken' ? 'sunkenToTemple' : t.subzone==='temple' ? 'templeToRuins' : 'poolToMarsh';
  else if(t.waypoint && dist(p, t.waypoint) < t.waypoint.r + p.r + 24){ skind = 'waypointAncientRuins'; }
  else if(t.stairsDown && dist(p, t.stairsDown) < t.stairsDown.r + p.r + 22) skind = 'toSunkenDepths';
  else if(t.clearPortal && dist(p, t.clearPortal) < t.clearPortal.r + p.r + 22) skind = 'toTownFromTower';
  updateInteractPrompt(skind);
  if(g.bossKilled && !t.clearPortal){ subBossDown(g); showMsg(t.subzone==='sunken' ? 'Explore the area for any lost treasures.' : 'The Leviathan sinks into the pool.', 3.0, undefined, true); }
  if(t.extraChest && !t.extraChest.opened && dist(t.extraChest,p) < t.extraChest.r+p.r){
    t.extraChest.opened = true; p.sunkenChest2Looted = true;
    const it = classRewardItem(p, Math.max(p.level, g.depth), 'rare'), it2 = classRewardItem(p, Math.max(p.level, g.depth), 'reward');
    forceAddToBag(p, it); forceAddToBag(p, it2); p.gold += 250;
    showMsg('Lost treasure: '+it.name+' + '+it2.name+' + gold', 3.0, '#ffd27a');
    g.particles.push({type:'burst', x:t.extraChest.x, y:t.extraChest.y, t:0.5, max:0.5, color:'#e8c44a'}); try{ sfxPlay('chest', 1); }catch(e){}
    bagPulse(); saveGame();
  }
  if(g.chest && !g.chest.opened && g.chest.subBoss && dist(g.chest,p) < g.chest.r+p.r) openSubChest(g);
  // v491: the Sunken Depths are charged with static -- two stacks of a lightning debuff while you are down here
  if(t.subzone==='sunken' && !g.over && p.hp>0){
    const rate = p.maxHp*SUNKEN_STATIC_PCT*SUNKEN_STATIC_STACKS*(1-elementResist(p,'lightning')/100);
    p.hp -= rate*dt; g.staticT = (g.staticT||0) + dt;
    if(Math.random() < dt*1.5) g.particles.push({type:'burst', x:p.x+rand(-14,14), y:p.y-rand(10,34), t:0.18, max:0.18, color:'#bfe6ff'});
    if(p.hp<=0){ p.hp=0; endGame(g); }
  }
  if(t.subzone==='pool' && !g.over && p.hp>0){
    const rate = p.maxHp*POOL_POISON_TICK_PCT/POOL_POISON_TICK_S*(1-elementResist(p,'poison')/100);
    p.hp -= rate*dt; g.poolT = (g.poolT||0) + dt;
    if(p.hp<=0){ p.hp=0; endGame(g); }
  }
}
function drawPoolOverlay(g){
  const t = g.clock||0;
  const vg = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);
  vg.addColorStop(0,'rgba(90,200,70,0)'); vg.addColorStop(1,'rgba(90,200,70,'+(0.20+0.05*Math.sin(t*2))+')');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = 'rgba(170,255,120,0.55)';
  for(let i=0;i<34;i++){ const x = ((i*211.7)%W), y = H - (((i*97.3) + t*(18+(i%4)*8)) % (H+30)); ctx.beginPath(); ctx.arc(x, y, 1.6+(i%3)*0.7, 0, 7); ctx.fill(); }
  ctx.save();
  ctx.font = "bold 12px Cinzel, Georgia, serif"; ctx.textAlign='center';
  ctx.fillStyle = '#c8ff9a'; ctx.shadowColor='rgba(0,0,0,0.8)'; ctx.shadowBlur=4;
  const pct = POOL_POISON_TICK_PCT*100*(1-elementResist(g.player,'poison')/100);
  ctx.fillText('☠ POISONED  −'+pct.toFixed(1).replace(/\.0$/,'')+'% max life every '+POOL_POISON_TICK_S+'s', W/2, hudBottomPx()+16);
  ctx.restore();
}
// ---- painting ----
function drawKpFloors(room, cam){
  for(const z of room.kpFloors){
    const a = toIso(z.x0,z.y0), b = toIso(z.x1,z.y0), c = toIso(z.x1,z.y1), d = toIso(z.x0,z.y1);
    const minX = Math.min(a.x,b.x,c.x,d.x)-cam.x, maxX = Math.max(a.x,b.x,c.x,d.x)-cam.x, minY = Math.min(a.y,b.y,c.y,d.y)-cam.y, maxY = Math.max(a.y,b.y,c.y,d.y)-cam.y;
    if(maxX<-40 || minX>W+40 || maxY<-40 || minY>H+40) continue;
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.lineTo(d.x,d.y); ctx.closePath();
    ctx.fillStyle = z.col; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2; ctx.stroke();
  }
}
// v490: the Sunken Depths / Flooded Temple ground is baked into the chunk cache; only the water tiles (precomputed once)
// are repainted live each frame -- the old code walked every tile of the whole cave twice a frame.
function subWetTiles(room){
  if(room._wetTiles) return room._wetTiles;
  const TS = 46, out = [];
  for(let wx=0; wx<=room.w; wx+=TS) for(let wy=0; wy<=room.h; wy+=TS){
    if(!subWaterAt(room,wx,wy)) continue;
    const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS);
    out.push({wx, wy, s:wx+wy, checker:((ix+iy)%2+2)%2, hh:tileHash(ix,iy)});
  }
  out.sort((a,b)=>a.s-b.s);   // sorted by iso row (x+y), so a frame only walks the visible band
  return (room._wetTiles = out);
}
function drawSubWaterLive(room, cam){
  const TS = 46, clk = (game&&game.clock)||0, L = subWetTiles(room);
  const s0 = (cam.y-80)/ISO_KY, s1 = (cam.y+H+80)/ISO_KY;
  let lo = 0, hi = L.length; while(lo<hi){ const m = (lo+hi)>>1; if(L[m].s < s0) lo = m+1; else hi = m; }
  for(let i=lo; i<L.length; i++){
    const t = L[i]; if(t.s > s1) break;
    const iso = toIso(t.wx,t.wy), sx = iso.x-cam.x;
    if(sx < -80 || sx > W+80) continue;
    const shim = (Math.floor((t.wx+t.wy)/TS*0.5 + clk*0.7) % 2 + 2) % 2;
    ctx.fillStyle = (t.checker^shim) ? '#10303e' : '#0c2833'; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
    if(t.hh>0.9){ ctx.fillStyle='rgba(140,200,230,'+(0.10+0.08*Math.sin(clk*1.6+t.hh*30))+')'; ctx.beginPath(); ctx.ellipse(iso.x+(t.hh-0.95)*120, iso.y, 9, 3.4, 0, 0, 7); ctx.fill(); }
  }
}
function drawSubFloor(room, cam){
  const TS = 46, clk = (game&&game.clock)||0;
  const pool = room.subzone==='pool';
  if(room.subzone==='sunken' || room.subzone==='temple'){
    cachedFloor(room, cam, c=>{ drawFloor(room, c); if(FLOOR_PASS!==1) drawSubWaterLive(room, c); }, c=>drawSubWaterLive(room, c));
    if(room.bridge) drawStoneBridge(room.bridge, 0, 440, false);
    if(room.woodBridge) drawWoodWalkway(room.woodBridge);
    return;
  }
  if(!pool) cachedFloor(room, cam, c=>drawFloor(room, c), null);   // v501: the ground is pre-painted into chunks like the Sunken Depths
  if(room.kpFloors) drawKpFloors(room, cam);
  if(room.subzone==='highward') drawHwFloorInlay(room, cam);
  for(let wx=-TS; wx<=room.w+TS; wx+=TS){
    for(let wy=-TS; wy<=room.h+TS; wy+=TS){
      const iso = toIso(wx,wy), sx = iso.x-cam.x, sy = iso.y-cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const ix = Math.floor(wx/TS), iy = Math.floor(wy/TS), checker = ((ix+iy)%2+2)%2, hh = tileHash(ix,iy);
      const wet = wx>=0 && wy>=0 && wx<=room.w && wy<=room.h && subWaterAt(room,wx,wy);
      let fill;
      if(pool){
        if(wet){
          const shim = (Math.floor((wx+wy)/TS*0.5 + clk*0.9) % 2 + 2) % 2;
          const big = Math.abs(wx-POOL_CX)<POOL_RX && Math.abs(wy-POOL_CY)<POOL_RY && subWaterAt(room,wx+TS*2,wy) && subWaterAt(room,wx-TS*2,wy);
          fill = big ? ((checker^shim) ? '#3f9a4a' : '#378a42') : ((checker^shim) ? '#2c4a3c' : '#264236');
        } else {
          const nearW = subWaterAt(room,wx+TS,wy)||subWaterAt(room,wx-TS,wy)||subWaterAt(room,wx,wy+TS)||subWaterAt(room,wx,wy-TS);
          if(nearW) fill = checker ? '#2c3a22' : '#26321c';
          else if(hh > 0.88) fill = '#1f2a1c';
          else fill = checker ? '#3a4a2a' : '#334226';
        }
        ctx.fillStyle = fill; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(wet && hh>0.93){ ctx.fillStyle='rgba(190,255,130,'+(0.25+0.2*Math.sin(clk*2+hh*40))+')'; ctx.beginPath(); ctx.ellipse(iso.x+(hh-0.96)*160, iso.y, 6, 2.8, 0, 0, 7); ctx.fill(); }
      } else if(wet){
        const shim = (Math.floor((wx+wy)/TS*0.5 + clk*0.7) % 2 + 2) % 2;
        fill = (checker^shim) ? '#10303e' : '#0c2833';
        ctx.fillStyle = fill; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hh>0.9){ ctx.fillStyle='rgba(140,200,230,'+(0.10+0.08*Math.sin(clk*1.6+hh*30))+')'; ctx.beginPath(); ctx.ellipse(iso.x+(hh-0.95)*120, iso.y, 9, 3.4, 0, 0, 7); ctx.fill(); }
      }
    }
  }
  if(!pool && room.bridge) drawStoneBridge(room.bridge, 0, 440, false);
  if(room.woodBridge) drawWoodWalkway(room.woodBridge);
}
function drawSubEntranceIso(room, clock){
  const e = room.entrance;
  if(room.subzone==='keep'){ if(room.hell) drawHellPortal(e, clock); else drawKeepDoor(e, clock); return; }
  if(room.subzone==='highward'){ if(room.hwFloor===1) drawHwGateIso(e, true, clock); else drawStairsDownIso(e, clock); } else if(room.subzone==='rrtower' && (room.rrFloor||1)>1) drawStairsDownIso(e, clock); else if(room.subzone==='sunken' || room.subzone==='temple' || room.subzone==='rrtower') drawMineEntranceIso(e, clock); else drawSinkholeGateIso(e, clock);
}
// Marsh Pool entrance (v262): a mossy sinkhole rimmed with stakes, glowing toxic green and bubbling.
function drawSinkholeGateIso(pos, clock){
  const iso = toIso(pos.x,pos.y), t = clock||0;
  drawShadow(iso.x, iso.y, 66, 24);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#2e3a22'; ctx.beginPath(); ctx.ellipse(0,0,70,31,0,0,7); ctx.fill();
  ctx.fillStyle='#5a4a30'; ctx.beginPath(); ctx.ellipse(0,2,60,25,0,0,7); ctx.fill();
  const gr = ctx.createRadialGradient(0,3,4,0,3,54);
  gr.addColorStop(0,'#08140a'); gr.addColorStop(0.55,'#1f5a26'); gr.addColorStop(1,'#4fb04a');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0,3,54,22,0,0,7); ctx.fill();
  ctx.strokeStyle='rgba(20,30,12,0.8)'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle='rgba(190,255,140,0.7)';
  for(let i=0;i<7;i++){ const ph=((t*0.5+i*0.15)%1), bx=Math.sin(i*2.3)*34, by=3-ph*34; ctx.globalAlpha=1-ph; ctx.beginPath(); ctx.arc(bx, by, 2+ph*3, 0, 7); ctx.fill(); }
  ctx.globalAlpha=1;
  for(const sx of [-66,-34,34,66]){
    ctx.strokeStyle='#4a3a26'; ctx.lineWidth=3.4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(sx,10); ctx.lineTo(sx+(sx<0?-3:3),-26); ctx.stroke();
    ctx.fillStyle='#d9d4bc'; ctx.beginPath(); ctx.arc(sx+(sx<0?-3:3),-30,5,0,7); ctx.fill();
    ctx.fillStyle='#14180e'; ctx.fillRect(sx+(sx<0?-5:1),-31,2,2.4); ctx.fillRect(sx+(sx<0?-1.4:4.6),-31,2,2.4);
  }
  ctx.restore();
}

