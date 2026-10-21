// ---- Frosthold Tower (v167) -------------------------------------------
// 5 floors above the Keep's east gate door. Permanent stairs up/down, floors 1-4 packed with Frosthold
// minions, floor 4 holds 7 Frosthold Champions; once they are all down a chest appears with the
// Frost Templar Runestone. Runs on the 'lighthouse' scene rig with room.fht = true.
const FHT_FLOORS = 5;
function fhtDepth(f){ return FH_DEPTH + Math.ceil(f/2); }   // v489: Lv 40-42 (Redridge after it is 42)
// v355: Frosthold Tower floors are now divided by walls into rooms (doorways are 260+ wide so enemies and the player path through easily)
const FHT_WALL_T = 44, FHT_WALL_SEG = 120, FHT_WALL_COL = ['#8a97a8','#3b4552','#566270'];
function fhtWall(list, x0, y0, x1, y1, gaps){
  const vert = Math.abs(x1-x0) < Math.abs(y1-y0), a0 = vert ? y0 : x0, a1 = vert ? y1 : x1, T = FHT_WALL_T;
  for(let a=a0; a<a1-1; a+=FHT_WALL_SEG){
    const b = Math.min(a1, a+FHT_WALL_SEG), mid = (a+b)/2;
    if(gaps && gaps.some(gp=>Math.abs(mid-gp.c) < gp.half + (b-a)/2 - 1)) continue;
    const o = vert ? {x:Math.round(x0-T/2), y:Math.round(a), w:T, h:Math.round(b-a)} : {x:Math.round(a), y:Math.round(y0-T/2), w:Math.round(b-a), h:T};
    o.col = FHT_WALL_COL; o.hz = 66; o.fhWall = true; list.push(o);
  }
}
function makeFhtFloor(f){
  const boss = f>=4, cmd = f===FHT_FLOORS;
  const w = boss ? 2100 : 1700, h = boss ? 1400 : 1100;
  const es = (f%2===1) ? 'left' : 'right', ss = (f%2===1) ? 'right' : 'left';
  const entrance = {x: es==='left' ? 70 : w-70, y:h/2, r:34};
  const stairs = cmd ? null : {x: ss==='left' ? 70 : w-70, y:h/2, r:30};
  let seed = f*6151 + 77;
  const rnd = ()=>{ seed = (seed*1103515245 + 12345) & 0x7fffffff; return seed/0x7fffffff; };
  const obstacles = [];
  let bossRoom = null, turretSpots = null;
  if(cmd){
    // the Commander's hall is walled off from the rest of the floor: one gateway, side chambers in the antechamber
    const bx0 = Math.round(w*0.36);
    fhtWall(obstacles, bx0, 0, bx0, h, [{c:h/2, half:140}]);
    fhtWall(obstacles, 300, Math.round(h*0.27), bx0, Math.round(h*0.27), [{c:520, half:100}]);
    fhtWall(obstacles, 300, Math.round(h*0.73), bx0, Math.round(h*0.73), [{c:520, half:100}]);
    bossRoom = {x0:bx0+30, x1:w-60, y0:60, y1:h-60};
    const bcx = (bossRoom.x0+bossRoom.x1)/2, bcy = h/2;
    turretSpots = [{x:bcx-250,y:bcy-230},{x:bcx-250,y:bcy+230},{x:bcx+250,y:bcy-230},{x:bcx+250,y:bcy+230}];   // v355: closer to the fight
  } else if(boss){
    fhtWall(obstacles, Math.round(w*0.42), 0, Math.round(w*0.42), h, [{c:h*0.5, half:230}]);
    fhtWall(obstacles, Math.round(w*0.7), 0, Math.round(w*0.7), h, [{c:h*0.3, half:170},{c:h*0.78, half:150}]);
  } else {
    const xA = Math.round(w*0.31), xB = Math.round(w*0.65);
    fhtWall(obstacles, xA, 0, xA, h, [{c:h*(0.28+0.44*rnd()), half:150}]);
    fhtWall(obstacles, xB, 0, xB, h, [{c:h*(0.28+0.44*rnd()), half:150}]);
    const my = Math.round(h*(0.42+0.16*rnd()));
    fhtWall(obstacles, xA, my, xB, my, [{c:(xA+xB)/2+(rnd()-0.5)*120, half:130}]);
  }
  const walls = obstacles.slice();
  const chestSpot = boss ? {x: es==='left' ? w*0.82 : w*0.18, y:h/2, r:24} : null;
  const cols = boss ? 5 : 4, rows = 3;
  for(let cx=1; cx<=cols; cx++) for(let cy=1; cy<=rows; cy++){
    if(rnd() < 0.45) continue;
    const px = w*(cx/(cols+1)) + (rnd()-0.5)*90, py = h*(cy/(rows+1)) + (rnd()-0.5)*90;
    const sz = 54 + Math.floor(rnd()*44);
    if(dist({x:px,y:py}, entrance) < 230 || (stairs && dist({x:px,y:py}, stairs) < 230)) continue;
    if(turretSpots && turretSpots.some(t=>dist({x:px,y:py}, t) < 150)) continue;
    if(chestSpot && dist({x:px,y:py}, chestSpot) < 200) continue;
    if(walls.some(o=>px>o.x-sz-70 && px<o.x+o.w+sz+70 && py>o.y-sz-70 && py<o.y+o.h+sz+70)) continue;
    if(cmd && px < w*0.36+90) continue;
    obstacles.push({x:Math.round(px-sz/2), y:Math.round(py-sz/2), w:sz, h:sz});
  }
  return { w, h, obstacles, floor:f, fht:true, mine:false, bossFloor:boss, cmdFloor:cmd, bossRoom, turretSpots, rooftop:false, ft:false, entranceSide:es, entrance, stairs, waypoint:null, beacon:null, witch:null, clearPortal:undefined, chestSpot };
}
function spawnFhtFloor(g, f){
  const room = g.room, av = [room.entrance, room.stairs];
  const inWall = (x,y)=>room.obstacles.some(o=>x>o.x-26 && x<o.x+o.w+26 && y>o.y-26 && y<o.y+o.h+26);
  const sp = (type, pos)=>{   // v355: never spawn inside a wall or pillar
    if(pos && inWall(pos.x,pos.y)){ for(let k=0;k<30;k++){ const q = {x:pos.x+rand(-140,140), y:pos.y+rand(-140,140)}; if(!inWall(q.x,q.y)){ pos = q; break; } } if(inWall(pos.x,pos.y)) pos = ftOpenSpot(room, av, 200); }
    return spawnEnemy(g, type, pos);
  };
  if(f < 4){
    const groups = 6 + f;
    for(let i=0;i<groups;i++){
      const c = ftOpenSpot(room, av, 300);
      const nD = 1 + Math.floor(Math.random()*2), nA = 1 + (i%2), nB = (i%2===0 || f>=3) ? 1 : 0, nZ = (f>=2 && i%3===0) ? 1 : 0;
      for(let k=0;k<nD;k++) sp('fhdwarf', {x:c.x+rand(-80,80), y:c.y+rand(-80,80)});
      for(let k=0;k<nA;k++) sp('fhaxe', {x:c.x+rand(-90,90), y:c.y+rand(-90,90)});
      for(let k=0;k<nB;k++) sp('fhbrute', {x:c.x+rand(-40,40), y:c.y+rand(-40,40)});
      for(let k=0;k<nZ;k++) sp('frozenzombie', {x:c.x+rand(-70,70), y:c.y+rand(-70,70)});
      if(i%2===1) sp('fhcleric', {x:c.x+rand(-60,60), y:c.y+rand(-60,60)});   // v462
    }
  } else if(f===4){
    if(!g.player.fhtRuneTaken){
      // seven Templars in a wide arc around the chest spot
      const cs = room.chestSpot;
      for(let i=0;i<7;i++){
        const a = (i/6-0.5)*2.2 + (room.entranceSide==='left' ? 0 : Math.PI);
        const px = cs.x + Math.cos(a)*300*(room.entranceSide==='left'?-1:1)*-1, py = cs.y + Math.sin(a)*300;
        const t = sp('fhtemplar', {x:clamp(px,120,room.w-120), y:clamp(py,120,room.h-120)});
        t.isFhtTemplar = true;
      }
      for(let i=0;i<3;i++){
        const c = ftOpenSpot(room, av.concat([cs]), 380);
        sp('fhdwarf', {x:c.x, y:c.y}); sp('fhaxe', {x:c.x+40, y:c.y+30});
      }
      sp('fhcleric', {x:cs.x + (room.entranceSide==='left' ? 120 : -120), y:cs.y});   // v462: a cleric tends the Champions
      showMsg('Seven Frosthold Champions guard the way up...', 2.2, '#dfe8ff');
    }
  } else {   // v489: the Commander is back on every visit
    const cs = room.chestSpot;
    const c = spawnEnemy(g, 'fhtemplar', {x:cs.x - (room.entranceSide==='left'?1:-1)*220, y:cs.y});
    initFhCommander(c);
    if(room.bossRoom){   // the antechamber's side chambers hold the Commander's guard
      const ax = room.w*0.36*0.62;
      for(const gy of [room.h*0.14, room.h*0.86]){
        sp('fhdwarf', {x:ax+rand(-60,60), y:gy+rand(-40,40)}); sp('fhdwarf', {x:ax+rand(-60,60), y:gy+rand(-40,40)}); sp('fhaxe', {x:ax+rand(-60,60), y:gy+rand(-40,40)});
      }
      sp('fhbrute', {x:room.w*0.36*0.5, y:room.h*0.5+rand(-150,150)});
    }
    showMsg('The Frosthold Commander waits at the summit...', 2.6, '#ffd9a0');
  }
}
function enterFhTower(floor, opts){
  opts = opts || {};
  const g = game;
  floor = clamp(floor||1, 1, FHT_FLOORS);
  g.scene = 'lighthouse';
  g.lighthouseFloor = floor;
  g.tower = makeFhtFloor(floor);
  g.room = g.tower;
  g.depth = fhtDepth(floor);
  if(opts.fromBelow && g.tower.stairs){
    g.player.x = g.tower.stairs.x + (g.tower.stairs.x < 200 ? 70 : -70); g.player.y = g.tower.stairs.y;
  } else {
    g.player.x = g.tower.entrance.x + (g.tower.entranceSide==='left' ? 70 : -70); g.player.y = g.tower.entrance.y;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg('Frosthold Tower — Floor '+floor+'  (Lv. '+g.depth+')', 1.8);
  g.fhtStore = g.fhtStore || {};
  if(g.fhtStore[floor]) g.enemies = g.fhtStore[floor];
  else spawnFhtFloor(g, floor);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  saveGame();
}
function fhtStairsUp(){ const g = game; if(g.tower && g.tower.fht && g.lighthouseFloor < FHT_FLOORS){ if(g.lighthouseFloor===4 && !g.player.fhtRuneTaken){ showMsg('The Frosthold Champions bar the stairs. Defeat them first.', 2.4); return; } enterFhTower(g.lighthouseFloor+1); } }
function fhtStairsDown(){ const g = game; if(g.tower && g.tower.fht && g.lighthouseFloor > 1) enterFhTower(g.lighthouseFloor-1, {fromBelow:true}); }
function makeFrostRunestoneItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Offensive Runestone', affixes:[], color:'#ff9a6a', questId:'frost_templar_runestone', unsellable:true,
    questDesc:'A rune-carved stone marked with a sword, taken from the Ancient Dwarven Construct beneath Frosthold. A matching hum answers from somewhere far to the east. Quest item -- cannot be sold.' };
}
function openTemplarChest(g){
  const p = g.player;
  g.chest.opened = true;
  if(!p.fhtRuneTaken){
    p.fhtRuneTaken = true;
    const it = classRewardItem(p, Math.max(p.level, 42), 'reward');
    forceAddToBag(p, it);
    p.gold += 500;
    showMsg('The Frosthold Champions are defeated \u2014 the stairs to the summit are open', 3.0);
    g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.5, max:0.5, color:'#9fe4ff'});
    bagPulse(); saveGame();
  }
}
// ---- Frosthold Commander (floor 5 of the Tower) ----
//   Solo boss, hits ~25% harder than a Templar. Ground slam (ring), charge (lane), summons dwarf adds.
//   At 50% life the ancient machine awakens: four stationary dwarven turrets throw fireballs for the rest of the fight.
const FHC_SLAM_R = 215, FHC_CHARGE_HALF = 62, FHC_CHARGE_LEN = 560, FHC_ADD_CAP = 5;
function initFhCommander(e){
  e.fhCmd = true; e.isLairBoss = true; e.bossName = 'Frosthold Commander'; e.engaged = true; e.aggroed = true;
  e.r = 17;   // v456: half the old size (was 33)
  e.hp = Math.round(e.hp*3.2); e.maxHp = e.hp; e.dmg = e.dmg*1.25; e.armor = (e.armor||0) + 6; e.baseSpeed = e.speed = 62;   // v490: this line used to sit behind the comment above, so none of it applied
  e.aggroRange = 900; e.leashRange = 99999; e.wanderRadius = 0;
  e.cState = 'chase'; e.cT = 0; e.cTmax = 1; e.cCd = 2.6; e.cPhase = 1; e.cNext = 0; e.cDir = 0; e.cHit = false;
}
function spawnFhTurrets(g, room){
  for(const sp of (room.turretSpots||[])){
    const t = spawnEnemy(g, 'fhturret', {x:sp.x, y:sp.y});
    if(t){ t.fhTurret = true; t.noReward = true; t.engaged = true; t.aggroed = true; }
    g.particles.push({type:'burst', x:sp.x, y:sp.y, t:0.5, max:0.5, color:'#ffb050'});
    g.particles.push({type:'ring', x:sp.x, y:sp.y, t:0.6, max:0.6, r:70, color:'#ffb050'});
  }
}
function fhCmdHit(g, e, tgt, mult){
  const dm = teleDmg(e, mult);
  if(tgt===g.player) playerDamage(g, dm, e); else applyFollowerDamage(g, tgt, dm, e);
}
function fhCmdTargets(g){ return [g.player].concat(g.followers||[]); }
// v490: a boss speaks once when you first come close
function bossGreet(g, e, line, r){ if(e._greeted || !g.player || dist(e, g.player) > (r||420) || !enemyLOS(g, e, g.player)) return; e._greeted = true; showMsg(line, 5); }
function updateFhCommander(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player, st = e.cState;
  bossGreet(g, e, '\u201cThe mountain\u2019s treasures belong to us!\u201d');
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  const F = e.cPhase===2 ? 1.6 : 1;   // v490: phase 2 telegraphs/recoveries are twice as long as before (was 0.8 -- far too quick)
  if(e.cPhase===1 && e.hp <= e.maxHp*0.5 && st!=='awaken'){
    e.cPhase = 2; e.cState = 'awaken'; e.cT = e.cTmax = 1.7; e.moving = false;
    showBigMsg('THE ANCIENT MACHINE AWAKENS', 'Dwarven turrets rise from the floor', 3.4);
    shakeScreen(g, 6, 1.2); spawnFhTurrets(g, room);
    g.particles.push({type:'ring', x:e.x, y:e.y, t:0.7, max:0.7, r:260, color:'#ffb050'});
    return;
  }
  if(st==='awaken'){ e.cT -= dt; e.moving = false; e.atkAnimT = 0.1; if(e.cT<=0){ e.cState='chase'; e.cCd = 1.0; } return; }
  if(st==='recover'){ e.cT -= dt; e.moving = false; if(e.cT<=0) e.cState='chase'; return; }
  if(st==='slamTele'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.cT<=0){
      for(const tg of fhCmdTargets(g)) if(dist(tg,e) < FHC_SLAM_R + tg.r*0.5) fhCmdHit(g, e, tg, 1.6);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:FHC_SLAM_R, color:'#d9a066'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#b8a078'});
      shakeScreen(g, 6, 0.25);
      e.cState='recover'; e.cT = 0.8*F;
    }
    return;
  }
  if(st==='chargeTele'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1; face(e.cDir);
    if(e.cT<=0){ e.cState='charge'; e.cT = 0.55; e.cHit = {}; }
    return;
  }
  if(st==='charge'){
    e.cT -= dt; e.moving = true; face(e.cDir);
    const sp = 760*chillMult*dt, nx = e.x + Math.cos(e.cDir)*sp, ny = e.y + Math.sin(e.cDir)*sp;
    const blocked = nx<80 || ny<80 || nx>room.w-80 || ny>room.h-80 || room.obstacles.some(o=> nx>o.x-e.r*0.6 && nx<o.x+o.w+e.r*0.6 && ny>o.y-e.r*0.6 && ny<o.y+o.h+e.r*0.6);
    if(blocked){ shakeScreen(g, 5, 0.25); g.particles.push({type:'burst', x:e.x, y:e.y, t:0.4, max:0.4, color:'#b8a078'}); e.cState='recover'; e.cT = 1.3*F; e.moving = false; return; }
    e.x = nx; e.y = ny;
    fhCmdTargets(g).forEach((tg, i)=>{ if(!e.cHit[i] && dist(tg,e) < e.r+tg.r+8){ e.cHit[i] = true; fhCmdHit(g, e, tg, 1.5); } });
    if(e.cT<=0){ e.cState='recover'; e.cT = 0.9*F; e.moving = false; }
    return;
  }
  if(st==='summonTele'){
    e.cT -= dt; e.moving = false; e.atkAnimT = 0.1;
    if(e.cT<=0){
      const alive = g.enemies.filter(x=>x.cAdd && x.hp>0).length;
      for(let i=0;i<3 && alive+i<FHC_ADD_CAP;i++){
        const a = Math.random()*Math.PI*2, rr = e.r+rand(50,150);
        const pos = {x:clamp(e.x+Math.cos(a)*rr, 100, room.w-100), y:clamp(e.y+Math.sin(a)*rr, 100, room.h-100)};
        const c = spawnEnemy(g, i%2===0 ? 'fhdwarf' : 'fhaxe', pos);
        if(c){ c.cAdd = true; c.noReward = true; c.engaged = true; c.aggroed = true; }
        g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.4, max:0.4, color:'#9fd8ff'});
      }
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:e.r+120, color:'#9fd8ff'});
      e.cState='recover'; e.cT = 0.7*F;
    }
    return;
  }
  // chase / melee
  const reach = e.r+target.r+4;
  updateStuckTracking(e, dt);
  e.cCd -= dt;
  if(e.cCd<=0){
    const seq = e.cPhase===2 ? ['charge','slam','summon','slam','charge'] : ['slam','charge','summon'];
    const mv = seq[e.cNext % seq.length];
    let ok = true;
    if(mv==='slam'){ if(d < FHC_SLAM_R*0.95 && enemyLOS(g,e,target)){ e.cState='slamTele'; e.cT = e.cTmax = 0.95*F; } else ok = false; }
    else if(mv==='charge'){ if(d > 130 && d < FHC_CHARGE_LEN && enemyLOS(g,e,target)){ e.cDir = Math.atan2(target.y-e.y, target.x-e.x); e.cState='chargeTele'; e.cT = e.cTmax = 0.8*F; } else ok = false; }
    else { if(g.enemies.filter(x=>x.cAdd && x.hp>0).length < FHC_ADD_CAP-1){ e.cState='summonTele'; e.cT = e.cTmax = 0.9*F; } else ok = false; }
    if(ok){ e.cNext++; e.cCd = (e.cPhase===2 ? 3.5 : 3.0) + Math.random()*1.0; e.windT = 0; return; }
    e.cCd = 0.45; if(!(mv==='slam' && d>=FHC_SLAM_R*0.95)) e.cNext++;
  }
  if(tickEnemyWindup(g, e, target, isFollowerTarget, reach, dt)){
  } else if(d>reach){
    const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
    face(ang);
    const sp = e.speed*chillMult*(e.cPhase===2 ? 1.1 : 1);   // v491: phase 2 is quicker again, but milder (was 1.2)
    e.x += Math.cos(ang)*sp*dt; e.y += Math.sin(ang)*sp*dt; e.moving = true;
  } else if(e.atkCd<=0){ beginEnemyMelee(e); }
}
function updateFhTurret(g, e, dt, target, d){
  e.moving = false;
  if(e.fbT>0){
    e.fbT -= dt; e.atkAnimT = 0.1;
    if(e.fbT<=0){
      const ang = Math.atan2(target.y-e.y, target.x-e.x);
      g.projectiles.push({x:e.x,y:e.y-14,vx:Math.cos(ang)*330,vy:Math.sin(ang)*330,r:10,dmg:e.dmg*1.1,from:'enemy',life:2.4,color:'#ff7a2a',srcEnemy:e,targetRef:target});
      g.particles.push({type:'burst', x:e.x+Math.cos(ang)*18, y:e.y+Math.sin(ang)*18, t:0.25, max:0.25, color:'#ffb050'});
    }
  } else {
    e.fbCd -= dt;
    if(e.fbCd<=0 && d<1100 && enemyLOS(g,e,target)){ e.fbT = 0.4; e.fbMax = 0.4; e.fbCd = 1.4+Math.random()*0.8; /* v355: fires roughly twice as fast */ }
  }
}
function fhCommanderSlain(g, e){
  const p = g.player;
  p.fhCmdSlain = true;
  for(const x of g.enemies) if(x.fhTurret || x.cAdd){ x.hp = 0; x.noReward = true; }
  if(g.tower && g.tower.fht){
    const cx = clamp(e.x,100,g.tower.w-100), cy = clamp(e.y,100,g.tower.h-100);
    if(!p.fhCmdLooted) g.chest = {x:cx, y:cy, r:24, opened:false, cmd:true};   // v489: re-kills drop a rare instead of the chest
    g.tower.clearPortal = {x:clamp(cx+110, 80, g.tower.w-80), y:clamp(cy+40, 80, g.tower.h-80), r:24};   // v456: right beside the chest
  }
  bossMsg('FROSTHOLD COMMANDER SLAIN', 'The ancient machine falls silent', 3.6);
  shakeScreen(g, 6, 0.6);
  saveGame();
}
function makeFhKeyItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Frosthold Dungeon Key', affixes:[], color:'#ffd27a', questId:'fh_dungeon_key', unsellable:true,
    questDesc:'A heavy dwarven key, taken from the Frosthold Commander. It opens the great door of the Frosthold Dungeon. Quest item -- cannot be sold.' };
}
function openCmdChest(g){
  const p = g.player;
  g.chest.opened = true;
  if(!p.fhCmdLooted){
    p.fhCmdLooted = true; p.fhDungeonKey = true;
    forceAddToBag(p, makeAncientHammerItem());
    forceAddToBag(p, makeFhKeyItem());
    forceAddToBag(p, classRewardItem(p, Math.max(p.level, 46), 'reward'));
    p.gold += 600;
    const q = getQuest(p, 'frost_east');
    if(q && q.status==='active'){ q.status='complete'; q.rewarded=true; q.progress=q.total; q.desc='The Commander fell. The machine beneath Frosthold is next.'; }
    if(!getQuest(p, 'frost_depths')) p.quests.push({id:'frost_depths', name:'Beneath Frosthold', desc:'The Commander carried a key to the Frosthold Dungeon. Use it at the great door at the south of the Keep and see what lies beneath.', status:'active', progress:0, total:1});
    if(!getQuest(p, QUEST_HAMMER.id)) p.quests.push({id:QUEST_HAMMER.id, name:QUEST_HAMMER.name, desc:QUEST_HAMMER.descReturn, status:'active', progress:QUEST_HAMMER.total, total:QUEST_HAMMER.total, stage:'return'});
    showMsg('Ancient Smithing Hammer and Frosthold Dungeon Key obtained', 3.4, '#ffd27a');
    npcMark(p, 'scholar', true);   // v490: the scholar has thoughts on the key
    g.particles.push({type:'burst', x:g.chest.x, y:g.chest.y, t:0.5, max:0.5, color:'#ffb060'});
    updateQuestBadge(); bagPulse(); saveGame();
  }
}
// v355: the Frosthold Commander gets his own look -- black-iron war plate with frost-blue glow, horned great helm, tattered cape and a huge rune hammer
function drawFhCommanderIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/15.5;
  const st = e.cState||'chase';
  const rise = (st==='slamTele') ? 1 : (st==='chargeTele' ? 0.5 : 0);
  const swing = (st==='recover' && e.cT>0 && e.cT<0.5) ? 1 : (e.atkAnimT>0 ? clamp(e.atkAnimT/0.3,0,1) : 0);
  drawShadow(iso.x, iso.y, 24*s, 8.5*s);
  if(e.cPhase===2){ ctx.save(); const g2 = ctx.createRadialGradient(iso.x, iso.y-26*s, 4, iso.x, iso.y-26*s, 52*s); g2.addColorStop(0,'rgba(255,150,60,0.28)'); g2.addColorStop(1,'rgba(255,150,60,0)'); ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(iso.x, iso.y-26*s, 52*s, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*7) : 0, bob = moving ? Math.abs(Math.sin(t*7))*1.5 : Math.sin(t*1.8)*0.7;
  const F = c=>flash?'#fff':c;
  const blackP = e.hp < e.maxHp*0.5;   // v456: bright white plate, turning black at half life
  const iron = blackP ? '#2a2f38' : '#d4dae4', ironL = blackP ? '#4a5262' : '#f2f5fa', ironD = blackP ? '#121519' : '#9aa3b2', gold = '#d9a93e', ice = blackP ? '#ff6a4a' : '#8fdcff';
  if(e.cEnraged){ ctx.save(); const rg = ctx.createRadialGradient(iso.x, iso.y-26*s, 2, iso.x, iso.y-26*s, 44*s); rg.addColorStop(0,'rgba(255,60,40,0.35)'); rg.addColorStop(1,'rgba(255,60,40,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(iso.x, iso.y-26*s, 44*s, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle='#0c1018'; ctx.lineWidth=1.3; ctx.lineJoin='round';
  // tattered cape
  const fl = Math.sin(t*5)*2 + walk*1.5;
  ctx.fillStyle = F('#1c2a44'); ctx.beginPath(); ctx.moveTo(-9,-36+bob); ctx.quadraticCurveTo(-20-fl,-18,-16-fl*0.5,-1); ctx.lineTo(-11,-4); ctx.lineTo(-8,1); ctx.lineTo(-3,-5); ctx.lineTo(0,-2); ctx.lineTo(2,-20); ctx.closePath(); ctx.fill(); ctx.stroke();
  // legs: heavy greaves + sabatons
  for(const sd of [-1,1]){
    const lift = sd>0 ? -walk : walk;
    ctx.fillStyle = F(iron); roundRect(sd*6-5, -14+lift*1.2, 10, 14-lift*1.2, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = F(ironL); ctx.beginPath(); ctx.arc(sd*6, -8+lift*0.8, 3.4, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = F(ironD); ctx.beginPath(); ctx.moveTo(sd*6-6,-1+lift*0.6); ctx.lineTo(sd*6+8,-1+lift*0.6); ctx.lineTo(sd*6+11,2); ctx.lineTo(sd*6-6,2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // tassets + torso
  ctx.fillStyle = F(ironD); ctx.beginPath(); ctx.moveTo(-13,-17+bob); ctx.lineTo(13,-17+bob); ctx.lineTo(14,-8+bob); ctx.lineTo(0,-5+bob); ctx.lineTo(-14,-8+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  const tg = ctx.createLinearGradient(-15,-40+bob,15,-16+bob); tg.addColorStop(0,ironL); tg.addColorStop(0.55,iron); tg.addColorStop(1,ironD);
  ctx.fillStyle = flash?'#fff':tg; roundRect(-15,-41+bob,30,26,7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = F(gold); ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(-13,-34+bob); ctx.lineTo(0,-28+bob); ctx.lineTo(13,-34+bob); ctx.stroke();
  ctx.fillStyle = F(ice); ctx.shadowColor = ice; ctx.shadowBlur = e.cPhase===2 ? 10 : 5; ctx.beginPath(); ctx.moveTo(0,-37+bob); ctx.lineTo(4,-30+bob); ctx.lineTo(0,-22+bob); ctx.lineTo(-4,-30+bob); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0;
  ctx.strokeStyle='#0c1018'; ctx.lineWidth=1.3; ctx.stroke();
  ctx.fillStyle = F(gold); ctx.fillRect(-15,-20+bob,30,3);
  // spiked pauldrons
  for(const sd of [-1,1]){
    ctx.fillStyle = F(ironL); ctx.beginPath(); ctx.ellipse(sd*17,-38+bob,8,6,sd*0.2,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = F(gold); ctx.beginPath(); ctx.moveTo(sd*13,-42+bob); ctx.lineTo(sd*19,-52+bob); ctx.lineTo(sd*21,-41+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // horned great helm with a burning frost plume
  const hy = -49+bob;
  ctx.fillStyle = F(iron); ctx.beginPath(); ctx.arc(0,hy,9.5,Math.PI,0); ctx.lineTo(9.5,hy+9); ctx.lineTo(5,hy+12); ctx.lineTo(-5,hy+12); ctx.lineTo(-9.5,hy+9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = F(ironL); ctx.fillRect(-1.2,hy-9.5,2.4,21);
  ctx.fillStyle = flash?'#fff':'#05080d'; ctx.fillRect(-7,hy,14,3.4);
  ctx.fillStyle = F(ice); ctx.shadowColor=ice; ctx.shadowBlur=6; ctx.fillRect(-5.4,hy+0.7,3.4,1.6); ctx.fillRect(2,hy+0.7,3.4,1.6); ctx.shadowBlur=0;
  ctx.fillStyle = F('#e9e2c8');
  for(const sd of [-1,1]){ ctx.beginPath(); ctx.moveTo(sd*8,hy-4); ctx.quadraticCurveTo(sd*17,hy-6,sd*16,hy-17); ctx.quadraticCurveTo(sd*11,hy-9,sd*6,hy-7); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = F(ice); ctx.beginPath(); ctx.moveTo(0,hy-9.5); ctx.quadraticCurveTo(-3-fl*0.3,hy-22,6-fl*0.6,hy-24); ctx.quadraticCurveTo(7,hy-14,2,hy-9.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  // off arm: bracer fist
  ctx.fillStyle = F(iron); ctx.beginPath(); ctx.arc(-18,-24+bob,5,0,7); ctx.fill(); ctx.stroke();
  // great hammer (rises on the slam telegraph, drives down on the swing)
  ctx.save(); ctx.translate(22,-24+bob);
  ctx.rotate(rise>0 ? -2.5*rise-0.2 : (swing>0 ? (1-swing)*2.6-1.1 : -0.35+walk*0.12));
  ctx.strokeStyle = F('#4a3220'); ctx.lineWidth=3.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,8); ctx.lineTo(0,-30); ctx.stroke();
  ctx.fillStyle = F('#aeb9c8'); ctx.strokeStyle='#0c1018'; ctx.lineWidth=1.3; roundRect(-10,-42,20,15,3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = F(gold); ctx.fillRect(-10,-36,20,2.4);
  ctx.fillStyle = F(ice); ctx.shadowColor=ice; ctx.shadowBlur=6; ctx.beginPath(); ctx.arc(0,-34.5,2.6,0,7); ctx.fill(); ctx.shadowBlur=0;
  ctx.restore();
  ctx.restore();
  drawHpBar(iso, 66*s*0.9, e.r*1.1, e.hp, e.maxHp);
}
// v419: the Cultist -- the Mystic's rig in black robes, summoning skeletons around itself
const CULT_MAX_MINIONS = 4;
function cultistSummon(g, e, target, d, dt){
  if(cultPortalZone(g)){ cultPortalTick(g, e, target, d, dt); return; }   // v499
  e.sumCd -= dt;
  if(e.sumCd>0 || d>520) return;
  const mine = g.enemies.filter(m=>m.hp>0 && m.cultOwner===e).length;
  if(mine>=CULT_MAX_MINIONS){ e.sumCd = 2; return; }
  e.sumCd = 9 + Math.random()*3; e.atkAnimT = 0.5; e.castAnimT = 0.5;
  raiseCultGuard(g, e, 2, true);
  g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:70, color:'#a03040'});
}
// v499: in the 3rd Redridge watchtower and in Shadow Keep, cultists tear open a red portal beside themselves and imps climb out
// (like the Necromancer's Soul Gate, in red). At most CULT_PORTAL_IMPS imps of one cultist live at a time; the portal closes after a few seconds.
const CULT_PORTAL_IMPS = 3, CULT_PORTAL_LIFE = 5.5, CULT_PORTAL_GAP = 1.5, CULT_PORTAL_CD = 11;
function cultPortalZone(g){ return !!(g && ((g.room && g.room.rrId===3) || inShadowKeep(g))); }
function cultPortalTick(g, e, target, d, dt){
  const pt = e.cPortal;
  if(pt){
    pt.t += dt;
    if(pt.t > 0.5 && pt.n < 2 && pt.t >= 0.7 + pt.n*CULT_PORTAL_GAP){
      pt.n++;
      const mine = g.enemies.filter(m=>m.hp>0 && m.cultOwner===e).length;
      if(mine < CULT_PORTAL_IMPS){
        const m = spawnEnemy(g, 'imp', {x:pt.x+rand(-14,14), y:pt.y+rand(-10,10)});
        if(m){ m.cultOwner = e; m.noReward = true; m.aggroRange = 700; m.leashRange = 99999; m.engaged = true; m.aggroed = true; g.particles.push({type:'burst', x:pt.x, y:pt.y, t:0.4, max:0.4, color:'#ff5a3a'}); }
      }
    }
    if(pt.t >= CULT_PORTAL_LIFE) e.cPortal = null;
    return;
  }
  e.pCd = (e.pCd===undefined ? rand(2,5) : e.pCd) - dt;
  if(e.pCd > 0 || d > 520) return;
  e.pCd = CULT_PORTAL_CD + Math.random()*3;
  if(g.enemies.filter(m=>m.hp>0 && m.cultOwner===e).length >= CULT_PORTAL_IMPS) return;
  const a = Math.random()*Math.PI*2;
  let pos = {x:e.x+Math.cos(a)*70, y:e.y+Math.sin(a)*70};
  if(g.room && posBlockedByObstacles(pos.x, pos.y, 20, g.room.obstacles||[])) pos = {x:e.x, y:e.y};
  e.cPortal = {x:pos.x, y:pos.y, t:0, n:0}; e.atkAnimT = 0.5; e.castAnimT = 0.5;
  g.particles.push({type:'ring', x:pos.x, y:pos.y, t:0.5, max:0.5, r:60, color:'#d02a2a'});
}
function drawCultPortal(e){
  const pt = e.cPortal; if(!pt) return;
  const iso = toIso(pt.x, pt.y), T = (game&&game.clock)||0, open = Math.min(1, pt.t/0.45) * Math.min(1, (CULT_PORTAL_LIFE-pt.t)/0.5);
  if(open <= 0) return;
  const W = 28*open, H = 58*open;
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='rgba(200,30,30,0.28)'; ctx.beginPath(); ctx.ellipse(0, 2, 44, 19, 0, 0, 7); ctx.fill();
  ctx.translate(0, -H*0.55);
  const gr = ctx.createRadialGradient(0,0,2,0,0,H*0.6);
  gr.addColorStop(0,'rgba(255,230,200,0.95)'); gr.addColorStop(0.45,'rgba(230,50,30,0.88)'); gr.addColorStop(1,'rgba(80,6,10,0.92)');
  ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0,0,W,H*0.55,0,0,7); ctx.fill();
  ctx.strokeStyle='rgba(255,140,110,0.9)'; ctx.lineWidth=3; ctx.stroke();
  for(let k=0;k<4;k++){ const an=T*2.2+k*1.57; ctx.strokeStyle='rgba(255,200,170,'+(0.55-k*0.1)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,W*(0.25+0.17*k),H*0.55*(0.25+0.17*k),an,0,4.2); ctx.stroke(); }
  ctx.restore();
}
// v436: a cultist's skeletons are the small black-and-red brute set, scaled down to the cultist's own size
function raiseCultGuard(g, e, n, fx){
  for(let k=0;k<n;k++){
    const a = Math.random()*Math.PI*2, pos = {x:e.x+Math.cos(a)*(fx?50:60), y:e.y+Math.sin(a)*(fx?50:60)};
    if(g.room && posBlockedByObstacles(pos.x, pos.y, 14, g.room.obstacles||[])) continue;
    const m = spawnEnemy(g, 'skeletonbrute', pos);
    if(m){ m.mini = true; m.hp = m.maxHp = Math.max(1, Math.round(m.maxHp*0.6)); m.dmg *= 0.8; m.cultOwner = e; m.aggroRange = 600; m.leashRange = 99999; if(fx) g.particles.push({type:'burst', x:pos.x, y:pos.y, t:0.4, max:0.4, color:'#a03040'}); }
  }
}
function drawCultistIso(e){
  const pv = {x:e.x, y:e.y, r:e.r*1.05, faceSign:e.faceSign||1, animT:e.animT||0, moving:e.moving, atkAnimT:Math.min(e.atkAnimT||0,0.22), castAnimT:Math.min(e.castAnimT||0,0.25),
    hitFlash:e.hitT>0?0.2:0, equipment:{mainhand:{slotType:'staff', spell:'fire'}}, dodging:false, invuln:0, iceArmorT:0, vanishT:0, guardianT:0, assaultT:0, lookBody:2, lookHelm:2, cultist:true};
  drawMystic(pv);
  const iso = toIso(e.x,e.y);
  drawHpBar(iso, 56, e.r*1.1, e.hp, e.maxHp);
}
function drawTemplarIso(e){
  const iso = toIso(e.x,e.y);
  const face = e.faceSign||1, t = e.animT||0, moving = e.moving, flash = e.hitT>0;
  const s = e.r/17;
  const swing = e.atkAnimT>0 ? clamp(e.atkAnimT/0.3,0,1) : 0;
  drawShadow(iso.x, iso.y, 20*s, 7.5*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  const walk = moving ? Math.sin(t*8) : 0, bob = moving ? Math.abs(Math.sin(t*8))*1.4 : Math.sin(t*2)*0.6;
  const dk = !!e.dark;   // v419: black-and-red armour for the Templars of the Redridge watchtowers
  const plate = flash?'#fff':(dk?'#2b2629':'#e6ebf2'), plateD = flash?'#fff':(dk?'#0f0b0d':'#8a97aa'), gold = flash?'#fff':(dk?'#a82020':'#e0b84a');
  ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.2;
  ctx.fillStyle = flash?'#fff':(dk?'#1c1719':'#6c7a8e');
  roundRect(-8,-11-walk*1.2, 6.5, 11+walk*1.2, 2); ctx.fill(); ctx.stroke();
  roundRect(1.5,-11+walk*1.2, 6.5, 11-walk*1.2, 2); ctx.fill(); ctx.stroke();
  // surcoat/cloak
  ctx.fillStyle = flash?'#fff':(dk?'#6e1212':'#2f6fb8');
  ctx.beginPath(); ctx.moveTo(-11,-24+bob); ctx.lineTo(11,-24+bob); ctx.lineTo(13,-4); ctx.lineTo(-13,-4); ctx.closePath(); ctx.fill(); ctx.stroke();
  // breastplate
  const tg = ctx.createLinearGradient(-12,-27+bob,12,-9+bob); tg.addColorStop(0,plate); tg.addColorStop(1,plateD);
  ctx.fillStyle = tg; roundRect(-12,-27+bob,24,17,4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = gold; ctx.fillRect(-1.5,-27+bob,3,17); ctx.fillRect(-12,-13+bob,24,2.5);
  // pauldrons
  ctx.fillStyle = plate;
  for(const sx of [-1,1]){ ctx.beginPath(); ctx.ellipse(sx*13,-25+bob,5.5,4.5,0,0,7); ctx.fill(); ctx.stroke(); }
  // great helm + plume
  const hy = -33+bob;
  ctx.fillStyle = plate; ctx.beginPath(); ctx.arc(0,hy,8,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash?'#fff':(dk?'#ff3a2a':'#20293a'); ctx.fillRect(-5.5,hy-1.5,11,2.6);
  ctx.fillStyle = gold; ctx.fillRect(-0.8,hy-8,1.6,16);
  ctx.fillStyle = flash?'#fff':(dk?'#7a0c0c':'#c8402f');
  ctx.beginPath(); ctx.moveTo(0,hy-8); ctx.quadraticCurveTo(9,hy-14,10,hy-4); ctx.quadraticCurveTo(4,hy-8,0,hy-5); ctx.closePath(); ctx.fill(); ctx.stroke();
  // kite shield
  ctx.fillStyle = flash?'#fff':(dk?'#231d20':'#f0f3f8');
  ctx.beginPath(); ctx.moveTo(-19,-28+bob); ctx.lineTo(-8,-28+bob); ctx.lineTo(-8,-14+bob); ctx.lineTo(-13.5,-5+bob); ctx.lineTo(-19,-14+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash?'#fff':(dk?'#b02020':'#2f6fb8'); ctx.fillRect(-14.5,-27+bob,2,20); ctx.fillRect(-19,-21+bob,11,2.4);
  // mace arm (raised on smash telegraph)
  const raise = e.tState==='tele';
  ctx.save(); ctx.translate(13,-22+bob); ctx.rotate(raise ? -2.4 : (swing>0 ? (1-swing)*2.4-0.9 : -0.25+walk*0.15));
  ctx.strokeStyle = flash?'#fff':'#5a3f24'; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,4); ctx.lineTo(0,-22); ctx.stroke();
  ctx.fillStyle = flash?'#fff':(dk?'#4a3f44':'#c9d4e0'); ctx.strokeStyle='#1c2430'; ctx.lineWidth=1.2;
  ctx.beginPath(); ctx.arc(0,-25,6.5,0,7); ctx.fill(); ctx.stroke();
  ctx.restore();
  ctx.restore();
  drawHpBar(iso, 48*s*0.9, e.r*1.1, e.hp, e.maxHp);
}

// ---- Ancient Smithing Hammer (quest item, 1 wide x 3 tall in the bag) ----
function makeAncientHammerItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare', shape:[1,3],
    name:'Ancient Smithing Hammer', affixes:[], color:'#ffb060', questId:'ancient_hammer', unsellable:true,
    questDesc:'A huge rune-etched hammer of the first dwarven smiths, taken from the Frosthold Commander. Bring it to the Blacksmith. Quest item -- cannot be sold.' };
}
// ---- The Balrog (floor 10 boss, fire) ----
//   * Flame Lash  -- telegraphed long lane; the whip cracks along it and leaves embers.
//   * Molten Slam -- big telegraphed ring around it; leaves burning pools. Get out or roll through.
//   * Fireball Fan -- a wide fan of fireballs; sidestep between them.
//   * Horde Call  -- at 66% and 33% HP it roars for its goblin/troll horde.
//   * Below 35% HP it enrages: faster, shorter cooldowns, and calls down flame pillars on you.
const BAL_WHIP_LEN = 480, BAL_WHIP_W = 74, BAL_WHIP_TELE = 0.9, BAL_WHIP_DMG = 1.6;
const BAL_SLAM_R = Math.round(185*2.2), BAL_SLAM_TELE = 1.2, BAL_SLAM_DMG = 2.0;   // v252: slam ring is 2.2x the old 185
const BAL_FAN_TELE = 0.85, BAL_FAN_DMG = 0.7, BAL_MAX_ADDS = 10, BAL_POOL_DPS = 0.3, BAL_STRIKE_R = 58, BAL_STRIKE_DMG = 0.85;
function initBalrog(e){
  e.balrog = true; e.bAwake = false; e.bState = 'chase'; e.bT = 0; e.bCd = 2.2; e.bNext = 0; e.bDir = 0; e.bPhase = 0;
  e.bPools = []; e.bStrikes = []; e.bStormT = 0; e.bStrikeCd = 0;
}
function balHit(g, e, target, mult, kb){
  const dmg = teleDmg(e, mult);
  if(target===g.player) playerDamage(g, dmg, e, kb); else applyFollowerDamage(g, target, dmg, e);
}
function updateBalrog(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player;
  const face = (ang)=>{ e.facing = {x:Math.cos(ang), y:Math.sin(ang)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  e.moving = false;
  if(!e.bAwake){
    if(d < 760 || e.hp < e.maxHp){ e.bAwake = true; showMsg('The Ember Tyrant awakens!', 2.4, '#ff9a50'); shakeScreen(g, 7, 0.5); }
    else return;
  }
  const frac = e.hp/e.maxHp, enr = frac < 0.35;
  const spd = e.speed*(enr?1.3:1)*chillMult;
  for(let i=e.bPools.length-1;i>=0;i--){
    const pl = e.bPools[i]; pl.t -= dt; pl.tick -= dt;
    if(pl.tick<=0){
      pl.tick = 0.5;
      if(dist(p,pl) < pl.r+p.r) playerDamage(g, e.dmg*BAL_POOL_DPS, e);
      if(g.followers) for(const f of g.followers) if(dist(f,pl) < pl.r+f.r) applyFollowerDamage(g, f, e.dmg*BAL_POOL_DPS, e);
    }
    if(pl.t<=0) e.bPools.splice(i,1);
  }
  for(let i=e.bStrikes.length-1;i>=0;i--){
    const s = e.bStrikes[i]; s.t -= dt;
    if(s.t<=0){
      if(dist(p,s) < BAL_STRIKE_R+p.r) balHit(g, e, p, BAL_STRIKE_DMG);
      if(g.followers) for(const f of g.followers) if(dist(f,s) < BAL_STRIKE_R+f.r) balHit(g, e, f, BAL_STRIKE_DMG);
      g.particles.push({type:'burst', x:s.x, y:s.y, t:0.35, max:0.35, color:'#ffd08a'});
      g.particles.push({type:'ring', x:s.x, y:s.y, t:0.4, max:0.4, r:BAL_STRIKE_R, color:'#ff8a3a'});
      e.bStrikes.splice(i,1);
    }
  }
  if(e.bStormT>0){
    e.bStormT -= dt; e.bStrikeCd -= dt;
    if(e.bStrikeCd<=0){
      e.bStrikeCd = 0.28;   // v252: many more small impact circles during the add phase
      for(let k=0;k<3;k++){
        const a = Math.random()*Math.PI*2, rr = k===0 ? rand(0,60) : rand(40,300);
        const sx = clamp(p.x+Math.cos(a)*rr,60,room.w-60), sy = clamp(p.y+Math.sin(a)*rr,60,room.h-60);
        if(room.bridge && sx>room.bridge.x0-40 && sx<room.bridge.x1+40) continue;
        e.bStrikes.push({x:sx, y:sy, t:1.0, max:1.0});
      }
    }
  }
  const st = e.bState;
  if(st==='chase'){
    e.bCd -= dt;
    if(tickEnemyWindup(g, e, target, isFollowerTarget, e.r+target.r+2, dt)) return;
    if((e.bPhase<1 && frac<0.66) || (e.bPhase<2 && frac<0.33)){
      e.bPhase++; e.bState='summonTele'; e.bT=1.3; e.windT=0;
      showMsg('The Ember Tyrant bellows — its imps swarm in!', 2.2, '#ff9a50');
      return;
    }
    if(e.bCd<=0 && d<700){
      e.windT = 0;
      const mv = e.bNext%3; e.bNext++;
      if(mv===0){ e.bState='whipTele'; e.bT=BAL_WHIP_TELE*(enr?0.8:1); e.bDir=Math.atan2(target.y-e.y,target.x-e.x); face(e.bDir); }
      else if(mv===1 && d<BAL_SLAM_R+150){ e.bState='slamTele'; e.bT=BAL_SLAM_TELE*(enr?0.8:1); }
      else { e.bState='fanTele'; e.bT=BAL_FAN_TELE*(enr?0.8:1); e.bDir=Math.atan2(target.y-e.y,target.x-e.x); face(e.bDir); }
      return;
    }
    if(d > e.r+target.r+2){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*spd*dt; e.y += Math.sin(ang)*spd*dt; e.moving = true; face(ang);
    } else if(e.atkCd<=0){ beginEnemyMelee(e); }
  } else if(st==='whipTele'){
    e.bT -= dt; e.atkAnimT = 0.1;
    if(e.bT<=0){
      const ca=Math.cos(e.bDir), sa=Math.sin(e.bDir), hw=BAL_WHIP_W/2;
      const inLane = (o)=>{ const dx=o.x-e.x, dy=o.y-e.y, u=dx*ca+dy*sa, v=-dx*sa+dy*ca; return u>0 && u<BAL_WHIP_LEN && Math.abs(v)<hw+o.r; };
      if(inLane(p)) balHit(g, e, p, BAL_WHIP_DMG, {x:ca*60, y:sa*60});
      if(g.followers) for(const f of g.followers) if(inLane(f)) balHit(g, e, f, BAL_WHIP_DMG);
      for(let u=60; u<=BAL_WHIP_LEN; u+=70){
        g.particles.push({type:'burst', x:e.x+ca*u, y:e.y+sa*u, t:0.3, max:0.3, color:'#ffb060'});
        if(u%140===0) e.bPools.push({x:e.x+ca*u, y:e.y+sa*u, r:34, t:3.0, tick:0.2});
      }
      shakeScreen(g, 5, 0.2);
      e.bState='recover'; e.bT=0.9;
    }
  } else if(st==='slamTele'){
    e.bT -= dt; e.atkAnimT = 0.1;
    if(e.bT<=0){
      if(dist(p,e) < BAL_SLAM_R+p.r) balHit(g, e, p, BAL_SLAM_DMG);
      if(g.followers) for(const f of g.followers) if(dist(f,e) < BAL_SLAM_R+f.r) balHit(g, e, f, BAL_SLAM_DMG);
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.6, max:0.6, r:BAL_SLAM_R, color:'#ff8a3a'});
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.5, max:0.5, color:'#ffe2a0'});
      for(let k=0;k<9;k++){ const a=Math.random()*Math.PI*2, rr=rand(90,BAL_SLAM_R-40); e.bPools.push({x:e.x+Math.cos(a)*rr, y:e.y+Math.sin(a)*rr, r:44, t:5, tick:0.2}); }
      shakeScreen(g, 9, 0.35);
      e.bState='recover'; e.bT=1.1;
    }
  } else if(st==='fanTele'){
    e.bT -= dt; e.atkAnimT = 0.1;
    if(e.bT<=0){
      const n = enr ? 13 : 9, base = Math.atan2(target.y-e.y, target.x-e.x), spread = 1.15;
      for(let k=0;k<n;k++){
        const aa = base + (k/(n-1)-0.5)*spread;
        g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(aa)*260,vy:Math.sin(aa)*260,r:10,dmg:e.dmg*BAL_FAN_DMG,from:'enemy',life:2.6,color:'#ff8a3a',srcEnemy:e,targetRef:target});
      }
      g.particles.push({type:'burst', x:e.x, y:e.y, t:0.3, max:0.3, color:'#ffd08a'});
      e.bState='recover'; e.bT=0.8;
    }
  } else if(st==='summonTele'){
    e.bT -= dt; e.atkAnimT = 0.1;
    if(e.bT<=0){
      const alive = g.enemies.filter(x=>x.balAdd && x.hp>0).length;
      for(let i=0;i<6 && alive+i<BAL_MAX_ADDS;i++){
        const a = Math.random()*Math.PI*2;
        const pos = {x:clamp(e.x+Math.cos(a)*(150+BAL_SLAM_R*0.3),60,room.w-60), y:clamp(e.y+Math.sin(a)*(150+BAL_SLAM_R*0.3),60,room.h-60)};
        // little demons (imps): grunts, with a couple of archers, shrunk to ~3/4 size
        const r2 = spawnEnemy(g, i%3===2 ? 'archer' : 'grunt', pos);
        if(r2){ r2.balAdd = true; r2.engaged = true; r2.r = r2.baseR = Math.round(r2.r*0.75); r2.imp = true; }
      }
      e.bStormT = 9; e.bStrikeCd = 0.4;
      g.particles.push({type:'ring', x:e.x, y:e.y, t:0.5, max:0.5, r:220, color:'#ff8a3a'});
      shakeScreen(g, 6, 0.3);
      e.bState='recover'; e.bT=0.7;
    }
  } else {
    e.bT -= dt;
    if(e.bT<=0){ e.bState='chase'; e.bCd = enr ? 1.3 : 2.4; }
  }
  e.x = clamp(e.x, e.r, room.w-e.r); e.y = clamp(e.y, e.r, room.h-e.r);
  if(room.bridge) e.x = Math.min(e.x, room.bridge.x0 - e.r);   // v252: the Tyrant never steps onto the bridge
  pushOutOfObstacles(e, room.obstacles);
}
function drawBalrogTelegraph(e){
  if(!e.bAwake) return;
  ctx.save();
  for(const pl of e.bPools){
    const iso = toIso(pl.x,pl.y), a = clamp(pl.t/1.2,0,1)*(0.55+0.2*Math.sin((e.animT||0)*30+pl.x));
    ctx.fillStyle='rgba(255,110,30,'+(a*0.5)+')';
    ctx.beginPath(); ctx.ellipse(iso.x, iso.y, pl.r*ISO_KX, pl.r*ISO_KY, 0, 0, 7); ctx.fill();
    ctx.strokeStyle='rgba(255,220,150,'+(a*0.8)+')'; ctx.lineWidth=1.5; ctx.stroke();
  }
  for(const s of e.bStrikes){
    const f = clamp(1-s.t/s.max,0,1), iso = toIso(s.x,s.y);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,170,90,'+(0.5+f*0.5)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,BAL_STRIKE_R*ISO_KX,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,130,50,'+(0.10+f*0.3)+')'; ctx.beginPath(); ctx.arc(0,0,BAL_STRIKE_R*ISO_KX*f,0,7); ctx.fill();
    ctx.restore();
  }
  const st = e.bState;
  if(st==='whipTele'){
    const frac = clamp(1-e.bT/BAL_WHIP_TELE,0,1), ca=Math.cos(e.bDir), sa=Math.sin(e.bDir), hw=BAL_WHIP_W/2;
    const pts=[[0,-hw],[BAL_WHIP_LEN,-hw],[BAL_WHIP_LEN,hw],[0,hw]].map(([u,v])=>toIso(e.x+ca*u-sa*v, e.y+sa*u+ca*v));
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<4;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath();
    ctx.fillStyle='rgba(255,110,30,'+(0.12+frac*0.3)+')'; ctx.fill();
    ctx.strokeStyle='rgba(255,200,120,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2; ctx.stroke();
  } else if(st==='slamTele'){
    const frac = clamp(1-e.bT/BAL_SLAM_TELE,0,1), iso = toIso(e.x,e.y);
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,200,120,'+(0.5+frac*0.5)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,BAL_SLAM_R*ISO_KX,0,7); ctx.stroke();
    ctx.fillStyle='rgba(255,110,30,'+(0.08+frac*0.26)+')'; ctx.beginPath(); ctx.arc(0,0,BAL_SLAM_R*ISO_KX*frac,0,7); ctx.fill();
  } else if(st==='fanTele'){
    const frac = clamp(1-e.bT/BAL_FAN_TELE,0,1), n=5, spread=1.15;
    ctx.strokeStyle='rgba(255,190,110,'+(0.3+frac*0.5)+')'; ctx.lineWidth=2;
    const o = toIso(e.x,e.y);
    for(let k=0;k<n;k++){
      const aa = e.bDir + (k/(n-1)-0.5)*spread, q = toIso(e.x+Math.cos(aa)*380, e.y+Math.sin(aa)*380);
      ctx.beginPath(); ctx.moveTo(o.x,o.y); ctx.lineTo(q.x,q.y); ctx.stroke();
    }
  } else if(st==='summonTele'){
    const frac = clamp(1-e.bT/1.3,0,1), iso = toIso(e.x,e.y);
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba(255,90,40,'+(0.4+frac*0.5)+')'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(0,0,220*ISO_KX*frac,0,7); ctx.stroke();
  }
  ctx.restore();
}
// v170: the floor-10 boss, redrawn from scratch as an original towering infernal: a hulking
// charred-stone brute wreathed in a mane of living fire, with magma-veined hide, sweeping ember wings,
// a great curled crown of horns and a whip of flame. Poses follow bState so every attack reads.
function drawBalrogIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, s = e.r/16*0.95, flash = e.hitT>0;
  const st = e.bState||'chase', moving = e.moving;
  const face = e.faceSign||1;
  const tele = st!=='chase' && st!=='recover';
  const walk = moving ? Math.sin(t*6) : 0, bob = moving ? Math.abs(Math.sin(t*6))*2 : Math.sin(t*1.6)*1.2;
  const pulse = 0.75+0.25*Math.sin(t*3.4);
  const hide = flash?HIT_FLASH:'#2a1612', hideL = flash?HIT_FLASH:'#4a2a20', hideD = flash?HIT_FLASH:'#150a08';
  const magma = flash?HIT_FLASH:'#ff8a2a', hot = flash?HIT_FLASH:'#ffd27a';
  // arm poses: [shoulder-to-hand angle] per state
  let whipA = -0.2 + walk*0.1, offA = 0.25 - walk*0.1;
  if(st==='whipTele'){ whipA = -2.4; offA = 0.5; }
  else if(st==='slamTele'){ whipA = -2.7; offA = -2.7; }
  else if(st==='fanTele'){ whipA = -1.3; offA = 1.3; }
  else if(st==='summonTele'){ whipA = -2.2; offA = -2.2; }
  else if(st==='recover'){ whipA = 0.5; offA = 0.5; }
  const wingLift = tele ? 0.3 : 0, flap = Math.sin(t*2.2)*0.12 + wingLift;
  const flame = (x,y,sz,ph)=>{
    const fl = 0.8+Math.sin(t*9+ph)*0.25;
    const g2 = ctx.createRadialGradient(x,y,1,x,y,sz*fl);
    g2.addColorStop(0,'#fff0b0'); g2.addColorStop(0.35,'#ffa030'); g2.addColorStop(1,'rgba(200,40,10,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(x-sz*0.55*fl,y+sz*0.3); ctx.quadraticCurveTo(x-sz*0.5*fl,y-sz*0.6,x+Math.sin(t*7+ph)*sz*0.25,y-sz*1.7*fl); ctx.quadraticCurveTo(x+sz*0.5*fl,y-sz*0.6,x+sz*0.55*fl,y+sz*0.3); ctx.closePath(); ctx.fill();
  };
  drawShadow(iso.x, iso.y+2, 40*s, 13*s);
  // ground heat glow
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1,0.5);
  const hg = ctx.createRadialGradient(0,0,4,0,0,60*s); hg.addColorStop(0,'rgba(255,110,30,'+(0.35*pulse)+')'); hg.addColorStop(1,'rgba(255,60,10,0)');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(0,0,60*s,0,7); ctx.fill(); ctx.restore();

  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#0c0504'; ctx.lineWidth = 1.4;

  // ---- wings (behind everything): bone arm + three fingers + scalloped, ember-lit membrane
  for(const sx of [-1,1]){
    ctx.save(); ctx.scale(sx,1);
    const tipX = 84, tipY = -104 - flap*60;
    const pts = [[tipX,tipY],[92,-70+flap*25],[72,-44+flap*14],[50,-34]];
    ctx.fillStyle = flash?HIT_FLASH:'#1d0b09';
    ctx.beginPath(); ctx.moveTo(12,-58);
    ctx.quadraticCurveTo(46,-96-flap*40,tipX,tipY);
    ctx.lineTo(pts[1][0],pts[1][1]); ctx.quadraticCurveTo(88,-56,pts[2][0],pts[2][1]);
    ctx.quadraticCurveTo(64,-38,pts[3][0],pts[3][1]); ctx.quadraticCurveTo(34,-38,14,-30);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // bones
    ctx.strokeStyle = flash?HIT_FLASH:'#5a2c1e'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(12,-58); ctx.quadraticCurveTo(46,-96-flap*40,tipX,tipY);
    for(const p of pts.slice(1,3)){ ctx.moveTo(30,-60); ctx.lineTo(p[0],p[1]); }
    ctx.stroke();
    // glowing edge / membrane veins
    ctx.strokeStyle = 'rgba(255,120,40,'+(0.45+0.25*pulse)+')'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(tipX,tipY); ctx.lineTo(pts[1][0],pts[1][1]); ctx.quadraticCurveTo(88,-56,pts[2][0],pts[2][1]); ctx.quadraticCurveTo(64,-38,pts[3][0],pts[3][1]); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = '#0c0504'; ctx.lineWidth = 1.4;
  }

  // ---- mane of fire streaming up and back from the head
  for(let i=-3;i<=3;i++) flame(i*9, -84-Math.abs(i)*3+bob*0.3, 13-Math.abs(i)*1.6, i*1.9);

  // ---- legs: thick digitigrade limbs ending in cloven hooves
  for(const sx of [-1,1]){
    const w2 = sx*walk*4;
    ctx.fillStyle = hide;
    ctx.beginPath(); ctx.moveTo(sx*6,-30); ctx.lineTo(sx*20,-30); ctx.quadraticCurveTo(sx*26,-18,sx*17+w2,-12); ctx.lineTo(sx*20+w2,-2); ctx.lineTo(sx*9+w2,-2); ctx.lineTo(sx*10+w2,-13); ctx.quadraticCurveTo(sx*6,-20,sx*6,-30); ctx.closePath(); ctx.fill(); ctx.stroke();
    // hoof
    ctx.fillStyle = hideD; ctx.beginPath(); ctx.moveTo(sx*8+w2,-2); ctx.lineTo(sx*22+w2,-2); ctx.lineTo(sx*23+w2,3); ctx.lineTo(sx*7+w2,3); ctx.closePath(); ctx.fill(); ctx.stroke();
    // ember glow at knee
    ctx.fillStyle = 'rgba(255,130,40,'+(0.5*pulse)+')'; ctx.beginPath(); ctx.arc(sx*17+w2*0.6,-13,2.6,0,7); ctx.fill();
  }

  // ---- lashing tail of embers
  ctx.strokeStyle = hideL; ctx.lineWidth = 3.4;
  ctx.beginPath(); ctx.moveTo(0,-28+bob); ctx.quadraticCurveTo(-30,-20+Math.sin(t*3)*4,-38,-6+Math.sin(t*3+1)*3); ctx.stroke();
  flame(-38,-6+Math.sin(t*3+1)*3,6,2.2);
  ctx.strokeStyle = '#0c0504'; ctx.lineWidth = 1.4;

  // ---- torso: massive chest, narrow waist, kilt of armoured plates
  const tg = ctx.createLinearGradient(-22,-70+bob,22,-30+bob); tg.addColorStop(0,hideL); tg.addColorStop(0.5,hide); tg.addColorStop(1,hideD);
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.moveTo(-24,-66+bob); ctx.quadraticCurveTo(-30,-52+bob,-13,-30+bob); ctx.lineTo(13,-30+bob); ctx.quadraticCurveTo(30,-52+bob,24,-66+bob); ctx.quadraticCurveTo(0,-74+bob,-24,-66+bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  // plated loin guard
  ctx.fillStyle = hideD;
  for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*5.5-3,-31+bob); ctx.lineTo(i*5.5+3,-31+bob); ctx.lineTo(i*5.5+2,-20+bob+Math.abs(i)*1.2); ctx.lineTo(i*5.5-2,-20+bob+Math.abs(i)*1.2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // magma cracks across the chest and belly
  ctx.strokeStyle = magma; ctx.lineWidth = 1.7; ctx.globalAlpha = 0.6+0.4*pulse;
  ctx.beginPath();
  ctx.moveTo(0,-68+bob); ctx.lineTo(-3,-58+bob); ctx.lineTo(3,-50+bob); ctx.lineTo(-2,-40+bob); ctx.lineTo(1,-32+bob);
  ctx.moveTo(-3,-58+bob); ctx.lineTo(-14,-54+bob); ctx.lineTo(-19,-46+bob);
  ctx.moveTo(3,-50+bob); ctx.lineTo(15,-52+bob); ctx.lineTo(19,-44+bob);
  ctx.moveTo(-8,-66+bob); ctx.lineTo(-12,-62+bob); ctx.moveTo(9,-66+bob); ctx.lineTo(13,-61+bob);
  ctx.stroke();
  ctx.strokeStyle = hot; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0,-68+bob); ctx.lineTo(-3,-58+bob); ctx.lineTo(3,-50+bob); ctx.stroke();
  ctx.globalAlpha = 1; ctx.strokeStyle = '#0c0504'; ctx.lineWidth = 1.4;
  // glow spilling from the chest
  const cg = ctx.createRadialGradient(0,-52+bob,2,0,-52+bob,26); cg.addColorStop(0,'rgba(255,140,50,'+(0.35*pulse)+')'); cg.addColorStop(1,'rgba(255,90,20,0)');
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0,-52+bob,26,0,7); ctx.fill();

  // ---- arms (upper arm + forearm along the pose angle), whip in the front hand
  const arm = (sx, ang, isWhip)=>{
    const shx = sx*24, shy = -62+bob;
    const ex = shx + Math.sin(ang)*sx*-1*20 + sx*4, ey = shy + Math.cos(ang)*20;
    const hx = shx + Math.sin(ang)*sx*-1*40 + sx*6, hy = shy + Math.cos(ang)*40;
    ctx.strokeStyle = '#0c0504'; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(shx,shy); ctx.lineTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.strokeStyle = hide; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(shx,shy); ctx.lineTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
    ctx.strokeStyle = hideL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(shx-1,shy-2); ctx.lineTo(ex-1,ey-1); ctx.stroke();
    // vambrace
    ctx.fillStyle = hideD; ctx.beginPath(); ctx.arc(ex,ey,5,0,7); ctx.fill(); ctx.stroke();
    // fist + fire
    ctx.fillStyle = hide; ctx.beginPath(); ctx.arc(hx,hy,6,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,50,'+(0.6*pulse)+')'; ctx.beginPath(); ctx.arc(hx,hy,3,0,7); ctx.fill();
    if(isWhip){
      // whip of flame: long sagging curve trailing from the fist
      const lash = st==='whipTele' ? 1 : 0;
      const wx = hx + (lash?-62:-30) * -sx*0 + sx*(lash?60:34), wy = hy + (lash?-30:34);
      ctx.strokeStyle = magma; ctx.lineWidth = 2.6; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.moveTo(hx,hy); ctx.bezierCurveTo(hx+sx*16,hy+(lash?-26:6)+Math.sin(t*6)*4,hx+sx*30,hy+(lash?-40:30),wx,wy); ctx.stroke();
      ctx.strokeStyle = hot; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.bezierCurveTo(hx+sx*16,hy+(lash?-26:6)+Math.sin(t*6)*4,hx+sx*30,hy+(lash?-40:30),wx,wy); ctx.stroke();
      ctx.globalAlpha = 1; flame(wx,wy,6,4.1);
    } else {
      flame(hx,hy-4,7+ (tele?3:0),1.3);
    }
    ctx.strokeStyle = '#0c0504'; ctx.lineWidth = 1.4;
  };
  arm(-1, offA, false);
  arm(1, whipA, true);

  // ---- shoulders: spiked stone pauldrons
  for(const sx of [-1,1]){
    ctx.fillStyle = hideL; ctx.beginPath(); ctx.ellipse(sx*25,-64+bob,10,8,sx*0.3,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hideD;
    for(let k=0;k<3;k++){ const px = sx*(21+k*5), py = -70+bob-k*1.5; ctx.beginPath(); ctx.moveTo(px-2.4,py+1); ctx.lineTo(px+sx*1.5,py-11-k*2); ctx.lineTo(px+2.4,py+1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  }

  // ---- head: heavy brow, snarling jaw, glowing eyes, great crown of horns
  const hy = -78+bob;
  ctx.fillStyle = hide;
  ctx.beginPath(); ctx.moveTo(-10,hy-6); ctx.quadraticCurveTo(-13,hy+6,-7,hy+13); ctx.lineTo(7,hy+13); ctx.quadraticCurveTo(13,hy+6,10,hy-6); ctx.quadraticCurveTo(0,hy-13,-10,hy-6); ctx.closePath(); ctx.fill(); ctx.stroke();
  // brow ridge
  ctx.fillStyle = hideD; ctx.beginPath(); ctx.moveTo(-11,hy-3); ctx.lineTo(0,hy+1); ctx.lineTo(11,hy-3); ctx.lineTo(9,hy-6); ctx.lineTo(0,hy-3); ctx.lineTo(-9,hy-6); ctx.closePath(); ctx.fill();
  // eyes
  const roar = tele ? 1 : 0;
  ctx.fillStyle = hot; ctx.shadowColor = '#ff8a2a'; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(-8,hy); ctx.lineTo(-2.5,hy+1.5); ctx.lineTo(-3.5,hy+3.2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8,hy); ctx.lineTo(2.5,hy+1.5); ctx.lineTo(3.5,hy+3.2); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  // maw: glowing, opens wide on telegraphs
  const mo = 2.5 + roar*4;
  ctx.fillStyle = '#ff5a1a'; ctx.beginPath(); ctx.moveTo(-6,hy+7); ctx.lineTo(6,hy+7); ctx.lineTo(4,hy+7+mo); ctx.lineTo(-4,hy+7+mo); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4ead0';
  for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(k*2.4-1,hy+7); ctx.lineTo(k*2.4+1,hy+7); ctx.lineTo(k*2.4,hy+9.5); ctx.closePath(); ctx.fill(); }
  // horns: two great curling pairs
  ctx.fillStyle = flash?HIT_FLASH:'#3b1e17'; ctx.strokeStyle = '#0c0504';
  for(const sx of [-1,1]){
    ctx.beginPath(); ctx.moveTo(sx*7,hy-8); ctx.quadraticCurveTo(sx*24,hy-10,sx*26,hy-32); ctx.quadraticCurveTo(sx*17,hy-18,sx*4,hy-13); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx*9,hy-2); ctx.quadraticCurveTo(sx*24,hy+0,sx*29,hy-10); ctx.quadraticCurveTo(sx*20,hy-5,sx*8,hy-6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,50,0.55)'; ctx.beginPath(); ctx.arc(sx*26,hy-31,2.4,0,7); ctx.fill(); ctx.fillStyle = flash?HIT_FLASH:'#3b1e17';
  }
  ctx.restore();
  // sparks
  ctx.save();
  for(let i=0;i<6;i++){
    const ph = (t*0.8+i*0.17)%1, sxp = iso.x + Math.sin(i*2.7+t)*26*s, syp = iso.y - (30+ph*90)*s;
    ctx.fillStyle = 'rgba(255,'+(150+ph*60|0)+',60,'+(1-ph)*0.8+')'; ctx.beginPath(); ctx.arc(sxp,syp,1.6*s*(1-ph*0.5),0,7); ctx.fill();
  }
  ctx.restore();
}
// Cave troll telegraph: club smash circle where you were standing.
// v217: smaller slam, longer warning; ring is drawn at TRUE world radius (x sqrt2 for the iso projection) so it matches the hit area
const TROLL_SLAM_R = 49, TROLL_SLAM_TELE = 1.35, TROLL_SLAM_TRIGGER = 140;
function drawTrollTelegraph(e){
  if(!(e.tState==='tele' && e.tPt)) return;
  ctx.save();
  const frac = clamp(1-e.tT/TROLL_SLAM_TELE,0,1), iso = toIso(e.tPt.x,e.tPt.y);
  ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle='rgba(230,150,80,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
  const SR = e.slamR||TROLL_SLAM_R;
  ctx.beginPath(); ctx.arc(0,0,SR*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
  ctx.fillStyle='rgba(220,120,50,'+(0.10+frac*0.28)+')'; ctx.beginPath(); ctx.arc(0,0,SR*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill();
  ctx.restore();
}
function drawFhCmdTelegraph(e){
  const st = e.cState; if(st!=='slamTele' && st!=='chargeTele' && st!=='summonTele') return;
  const frac = clamp(1-e.cT/(e.cTmax||1),0,1);
  ctx.save();
  if(st==='chargeTele'){
    const ca = Math.cos(e.cDir), sa = Math.sin(e.cDir), hw = FHC_CHARGE_HALF, L = FHC_CHARGE_LEN;
    const pts = [[0,-hw],[L,-hw],[L,hw],[0,hw]].map(q=>toIso(e.x + ca*q[0] - sa*q[1], e.y + sa*q[0] + ca*q[1]));
    ctx.beginPath(); pts.forEach((q,i)=> i? ctx.lineTo(q.x,q.y) : ctx.moveTo(q.x,q.y)); ctx.closePath();
    ctx.fillStyle='rgba(220,120,50,'+(0.10+frac*0.28)+')'; ctx.fill();
    ctx.strokeStyle='rgba(230,150,80,'+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5; ctx.stroke();
  } else {
    const R = st==='slamTele' ? FHC_SLAM_R : e.r+120, iso = toIso(e.x,e.y), col = st==='slamTele' ? '230,150,80' : '150,210,255';
    ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
    ctx.strokeStyle='rgba('+col+','+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
    ctx.fillStyle='rgba('+col+','+(0.08+frac*0.26)+')'; ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawTurretIso(e){
  const iso = toIso(e.x,e.y), flash = e.hitT>0;
  const ch = e.fbT>0 ? 1-clamp(e.fbT/(e.fbMax||0.6),0,1) : 0;
  drawShadow(iso.x, iso.y, 22, 8);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.strokeStyle='#1c1812'; ctx.lineWidth=1.4;
  ctx.fillStyle = flash?'#fff':'#5e5038'; roundRect(-16,-13,32,13,3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#8a7448'; roundRect(-11,-36,22,25,4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = flash?'#fff':'#c8a050'; ctx.fillRect(-11,-27,22,3); ctx.fillRect(-11,-19,22,2);
  ctx.fillStyle='rgba(255,140,40,'+(0.35+ch*0.6)+')'; ctx.beginPath(); ctx.arc(0,-31,4+ch*7,0,7); ctx.fill();
  ctx.restore();
}

// Spider Lair and Bear Cave: single-floor dungeon zones reached from the
// Forest, reusing genRoom()'s entrance/main-rooms/exit-room/tunnel layout
// exactly like the Mine, but populated with one enemy type and always
// guarded by an upscaled version of that type in the exit room -- fixed
// at a depth of 5 (a boss floor by the Mine's own isBossFloor rule) so the
// generic portal/chest/boss-clear flow in update() applies unchanged.
function enterSpiderLair(){
  const g = game;
  g.scene = 'spiderlair';
  // Fixed area level (static difficulty)
  g.depth = 3;   // v228: lowered from 6
  g.room = genOrganicRoom('spider', g.depth);
  g.player.x = g.room.entranceSpawn.x; g.player.y = g.room.entranceSpawn.y;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg('The Spider Lair', 1.4);
  spawnSpiderLairWave(g);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
function enterBearCave(){
  const g = game;
  g.scene = 'bearcave';
  // Fixed area level (static difficulty)
  g.depth = 4;   // v228: lowered from 8
  g.room = genOrganicRoom('bear', g.depth);
  g.player.x = g.room.entranceSpawn.x; g.player.y = g.room.entranceSpawn.y;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  showMsg('The Bear Cave', 1.4);
  spawnBearCaveWave(g);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
// Spiders fill the main rooms, a handful of escorts and one upscaled
// "boss" spider (drawSpiderIso, just scaled up -- see SPIDER_BOSS_* mults)
// guard the exit room. If the hunters quest is active and hunter #2 (the
// one "trapped beside the spider boss") hasn't been found yet, he's placed
// right there too.
function spawnSpiderLairWave(g){
  const guardRoom = g.room.exitRoom;
  // Density doubled along with the Mine's boss floors, for consistency --
  // a bigger guard cluster around the boss plus more scattered through the
  // main rooms, still confined to this single-room-exit layout.
  for(let i=0;i<6;i++){
    const pos = {x:rand(guardRoom.x+45,guardRoom.x+guardRoom.w-45), y:rand(guardRoom.y+45,guardRoom.y+guardRoom.h-45)};
    spawnEnemy(g, 'spider', pos);
  }
  const bossPos = {x:guardRoom.x+guardRoom.w/2, y:guardRoom.y+guardRoom.h/2};
  const boss = spawnEnemy(g, 'spider', bossPos);
  boss.r = Math.round(boss.r*SPIDER_BOSS_R_MULT);
  boss.hp = Math.round(boss.hp*SPIDER_BOSS_HP_MULT); boss.maxHp = boss.hp;
  boss.dmg = boss.dmg*SPIDER_BOSS_DMG_MULT;
  boss.isLairBoss = true;
  // v480: no lone spiders -- the rest of the lair comes in packs of three (densifyDungeon)
  showMsg('The Spider Lair boss stirs...', 1.8);
  g.spiderLairHunter = null;
  const p = g.player, q = getQuest(p, QUEST_FIND_HUNTERS.id);
  // v65: the hunter is always placed here, whether or not the Old Man's
  // quest has been formally accepted yet -- only an already-rescued flag
  // (foundSpider) suppresses him, so he never comes back once found.
  if(!(q && q.foundSpider)){
    g.spiderLairHunter = {
      x:clamp(bossPos.x+55, guardRoom.x+24, guardRoom.x+guardRoom.w-24),
      y:clamp(bossPos.y+40, guardRoom.y+24, guardRoom.y+guardRoom.h-24),
      r:14, found:false,
    };
  }
}
// Bears fill the main rooms, with one upscaled "boss" bear (drawBearIso,
// just scaled up -- see BEAR_BOSS_* mults) guarding the exit room for
// pacing consistency with the Mine and Spider Lair. Hunter #3 ("at the end
// of the Bear Cave") is placed in that same exit room if still missing.
function spawnBearCaveWave(g){
  const guardRoom = g.room.exitRoom;
  // Density doubled along with the Mine's boss floors, for consistency --
  // a bigger guard cluster around the boss plus more scattered through the
  // main rooms, still confined to this single-room-exit layout.
  // v190: first-quest tuning -- 2 guards (was 4), 6 scattered (was 12), cave bears hit ~19% softer; boss unchanged
  for(let i=0;i<2;i++){
    const pos = {x:rand(guardRoom.x+45,guardRoom.x+guardRoom.w-45), y:rand(guardRoom.y+45,guardRoom.y+guardRoom.h-45)};
    const gb = spawnEnemy(g, 'bear', pos); if(gb) gb.dmg *= BEAR_CAVE_DMG_MULT;
  }
  const bossPos = {x:guardRoom.x+guardRoom.w/2, y:guardRoom.y+guardRoom.h/2};
  const boss = spawnEnemy(g, 'bear', bossPos);
  boss.r = Math.round(boss.r*BEAR_BOSS_R_MULT);
  boss.hp = Math.round(boss.hp*BEAR_BOSS_HP_MULT); boss.maxHp = boss.hp;
  boss.dmg = boss.dmg*BEAR_BOSS_DMG_MULT;
  boss.isLairBoss = true;
  // v474: no lone wanderers -- the rest of the cave's bears come in packs (densifyDungeon)
  showMsg('A great bear guards the den...', 1.8);
  g.bearCaveHunter = null;
  const p = g.player, q = getQuest(p, QUEST_FIND_HUNTERS.id);
  // v65: same always-present rule as the Spider Lair hunter above.
  if(!(q && q.foundBear)){
    g.bearCaveHunter = {
      x:clamp(bossPos.x-55, guardRoom.x+24, guardRoom.x+guardRoom.w-24),
      y:clamp(bossPos.y+45, guardRoom.y+24, guardRoom.y+guardRoom.h-24),
      r:14, found:false,
    };
  }
}

// The Forest sits between Town and the Mine -- a standing, respawning
// population of wolves/spiders/bears rather than a floor to clear.
function enterForest(from){
  const g = game;
  g.scene = 'forest';
  g.forest = makeForest();
  g.room = g.forest;
  // Fixed area level (static difficulty)
  g.depth = 1;
  // Coming from the Spider Lair or Bear Cave lands you back beside that
  // zone's own entrance gate, not the generic Town-gate spawn -- only a
  // fresh Town->Forest crossing (or no origin given) uses the Town gate.
  let spawnGate = g.forest.townGate, offX = 120, offY = 0;
  if(from==='spiderlair'){ spawnGate = g.forest.spiderLairGate; offX = 0; offY = 90; }
  else if(from==='bearcave'){ spawnGate = g.forest.bearCaveGate; offX = 0; offY = -90; }
  // v87: sunGate moved from the top edge to the bottom edge -- the spawn
  // offset flips sign to match (still "away from the edge, into the
  // interior", now that's -y/north instead of +y/south).
  else if(from==='sunlitplains' || from==='rivervalley'){ spawnGate = g.forest.sunGate; offX = 0; offY = -120; }
  g.player.x = spawnGate.x + offX; g.player.y = spawnGate.y + offY; // clear of the edge-gate trigger radius so the "Return to X" prompt doesn't fire immediately on entry
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('The Dark Forest', 1.4);
  // v62: seed the Forest with several smaller wolf/spider packs (randomly
  // typed per anchor) spread across its anchor points, instead of one big
  // fixed pack per type -- see FOREST_PACK_COUNT/FOREST_PACK_TEMPLATES.
  // This whole population is only (re)generated here, on zone entry -- the
  // standing over-time respawn timer that used to top it back up while the
  // player stayed in the zone has been removed (see update()); leaving and
  // re-entering the Forest is now what repopulates it.
  // v68: FOREST_PACK_COUNT raised from 7 to 70 (10x), spawned from the also-
  // 10x'd anchor pool (FOREST_PACK_ANCHOR_TARGET) at the same ~50% of the
  // pool as before -- so, combined with each pack's unchanged 1-5 count and
  // the zone's own ~10x area increase, the Forest ends up with roughly 10x
  // its previous total roaming population (was ~7 packs * ~3 avg = ~21
  // enemies; now ~70 packs * ~3 avg = ~210) at essentially the same
  // per-area density and the same spread-out, not-clumped feel -- see
  // README "Version 68" for the full reasoning.
  const anchors = shuffle(breatheAnchors(g.forest.packAnchors, {gap:380}));
  const FOREST_PACK_COUNT = Math.min(70, anchors.length);
  for(let i=0;i<FOREST_PACK_COUNT;i++){
    spawnForestPack(g, anchors[i]);
  }
  // The Forest's one bear (item 1, v62): a single fixed spawn near the Bear
  // Cave entrance rather than a roaming pack -- a small random offset off
  // the gate so it isn't standing directly on the entrance trigger.
  // v68: the Bear Cave entrance moved off the map edge into the interior
  // (see makeForest), so the old "-Math.abs(sin)" bias (which pushed the
  // bear inward, away from the bottom edge the gate used to sit on) no
  // longer applies -- a plain full-circle offset around the gate's current
  // position is used instead, so the bear still always follows wherever
  // g.forest.bearCaveGate actually is rather than any stale/hardcoded spot.
  {
    const gate = g.forest.bearCaveGate;
    const bang = Math.random()*Math.PI*2;
    const bx = clamp(gate.x + Math.cos(bang)*FOREST_BEAR_OFFSET, 60, g.forest.w-60);
    const by = clamp(gate.y + Math.sin(bang)*FOREST_BEAR_OFFSET, 60, g.forest.h-60);
    spawnEnemy(g, 'bear', {x:bx, y:by});
  }
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  spawnQuestHunters(g);
}

// Mountain Pass sits between the Forest and the Abandoned Mine -- an open,
// standing-population zone like the Forest itself (not a genRoom() floor),
// reached via the Forest's own mountainGate and holding the Mine's actual
// entrance at its far edge.
function enterMountainPass(opts){
  opts = opts || {};
  const g = game;
  g.scene = 'mountainpass';
  // Waypoint rework: reachedMountainPass is no longer set on mere zone
  // entry -- it's now set the moment the player walks up to this zone's
  // own waypoint marker (see the nearMtnWaypoint proximity check in
  // update(), which calls discoverWaypoint) so it truly means "this
  // zone's waypoint has been discovered", matching every other zone's
  // waypoint below.
  g.mtn = makeMountainPass();
  g.room = g.mtn;
  g.deepStore = null;
  // Fixed area level (static difficulty)
  g.depth = 33;   // v459: +3 (the Barren Highlands, Lv 30, now come before the pass)
  // Waypoint rework: teleporting in via the Teleport menu (opts.atWaypoint)
  // lands the player AT this zone's own waypoint marker, not the generic
  // Forest-gate entrance -- see openTeleportMenu's teleportMountainBtn.
  if(opts.atWaypoint){
    g.player.x = g.mtn.waypoint.x; g.player.y = g.mtn.waypoint.y + 40;
  } else if(opts.fromSummit){
    g.player.x = g.mtn.summitGate.x; g.player.y = g.mtn.summitGate.y + 130;
  } else if(opts.fromFrost){
    g.player.x = g.mtn.frostGate.x - 130; g.player.y = g.mtn.frostGate.y;
  } else if(opts.fromMine || opts.fromDepths){
    g.player.x = g.mtn.mineGate.x; g.player.y = g.mtn.mineGate.y - 130;   // (also used when climbing back up from the Mountain Depths)
  } else {
    g.player.x = g.mtn.forestGate.x + 120; g.player.y = g.mtn.forestGate.y;
  }
  g.player.crX = undefined;
  g.mtn.entrySpawn = {x:g.player.x, y:g.player.y};   // v281: respawn here after a death
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Mountain Pass', 1.4);
  // district mix: wolves and bears at the forest edge, bears mid-pass, the frozen dead up the stem and toward the keep
  const GOB = {type:'goblin', countMin:4, countMax:5}, TRL = {type:'cavetroll', count:2}, WOLF = {type:'warg', countMin:4, countMax:5, variant:'white'}, ZOM = {type:'frozenzombie', count:5}, BEAR = {type:'bear', countMin:2, countMax:3, variant:'polar'};
  for(const a of breatheAnchors(g.mtn.packAnchors, {gap:460, cell:1400})){
    const r = Math.random();
    const t = a.y > MTN_BAR_Y1 ? (r<0.55 ? GOB : r<0.8 ? TRL : WOLF)
            : a.y < MTN_BAR_Y0 ? (r<0.55 ? ZOM : r<0.8 ? WOLF : BEAR)
            : a.x < 3000 ? (r<0.5 ? WOLF : r<0.8 ? BEAR : ZOM)
            : a.x > 6600 ? (r<0.6 ? ZOM : BEAR)
            : (r<0.45 ? BEAR : r<0.8 ? ZOM : WOLF);
    spawnMountainPassPack(g, a, t);
  }
  { const ob = g.mtn.obstacles; g.enemies = g.enemies.filter(e=>!ob.some(o=>e.x>o.x-e.r && e.x<o.x+o.w+e.r && e.y>o.y-e.r && e.y<o.y+o.h+e.r)); }
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

