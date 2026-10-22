// ---- Redridge watchtower interiors (v286) ----
const RRT_W = 2400, RRT_H = 1000;
const RRT_NAMES = {1:'Watchtower I — Scavenger Roost', 2:'Watchtower II — Windward Stair', 3:'Watchtower III — Captain’s Hall'};
const RRT_CLUES = {
  1:['The Roost Beacon burns','A scout’s journal lies by the brazier: “Lights in the far east keep. Black ones. Something lives in Shadow Keep, and it is not the Templars.” The first span of the skybridge shivers and hardens into light.'],
  2:['The Stair Beacon burns','Scratched into the brazier: “The soldiers in the east keep walk without breath. Cultists drive them. Shadow has taken them whole.” The second span of the skybridge answers.'],
  3:['The Captain’s Beacon burns','A broken Templar standard bears a last warning: “When the stones answer, the Hold shall open.” The final span of the skybridge ignites, and Highward’s gate groans wide.']
};
function rrBeaconCount(p){ const b = p.rrBeacons || {}; return (b[1]?1:0)+(b[2]?1:0)+(b[3]?1:0); }
const RRT_FLOORS = 3;   // v461: every watchtower has three floors; the beacon burns on the top one
function makeRRTower(id, floor){
  floor = floor || 1;
  const top = floor===RRT_FLOORS;
  const w = RRT_W, h = RRT_H, cy = h/2, rnd = subSeeded(tripSeed('rrt'+id)+id*37+(floor-1)*911);   // v525: new rooms every trip
  const entrance = {x:70, y:cy, r:34};
  const rrBeacon = top ? {x:w-230, y:cy, r:30, id} : null;
  const rrUp = top ? null : {x:w-210, y:cy, r:32};
  const goal = rrBeacon || rrUp;
  const obstacles = [], ladders = [], vents = [], props = [];
  const farFrom = (x,y,d)=> dist({x,y},entrance) > d && dist({x,y},goal) > d;
  if(id===1){
    for(let i=0;i<14;i++){ const x = 360+rnd()*(w-760), y = 120+rnd()*(h-240), sz = 54+Math.floor(rnd()*30); if(!farFrom(x,y,260)) continue; obstacles.push({x:Math.round(x-sz/2), y:Math.round(y-sz/2), w:sz, h:sz}); }
    if(top) props.push({k:'scout', x:goal.x-120, y:goal.y+70});
  } else if(id===2){
    const wallXs = [[820, 1380, 1900],[700, 1260, 1820],[900, 1440, 1960]][floor-1].map(x=>Math.round(x + (rnd()-0.5)*160));   // v525: walls shift every trip
    const flip = rnd()<0.5;
    wallXs.forEach((wx,i)=>{
      const gapTop = (((i+floor+1)%2===0) !== flip);                       // alternate which end the gap is on
      const gy0 = gapTop ? 70 + Math.round(rnd()*120) : h-70-200-Math.round(rnd()*120), gy1 = gy0+200;
      if(gy0>0) obstacles.push({x:wx, y:0, w:46, h:gy0});
      obstacles.push({x:wx, y:gy1, w:46, h:h-gy1});
      ladders.push({x:wx+23, y:gapTop?gy1+10:gy0-10, up:!gapTop});      // a broken ladder beside the gap
      for(const dx of [-120,0,120]) vents.push({x:wx+23+dx*0.55, y:(gy0+gy1)/2+(dx===0?0:(dx>0?44:-44)), r:48, ph:(i+dx/60)*0.9});
    });
    for(let i=0;i<7;i++){ const x = 300+rnd()*(w-700), y = 140+rnd()*(h-280); if(!farFrom(x,y,300)) continue; if(wallXs.some(wx=>Math.abs(x-wx)<130)) continue; vents.push({x, y, r:50, ph:rnd()*3.6}); }
  } else {
    for(let px=520; px<w-380; px+=300) for(const py0 of [cy-250, cy+250]){ if(rnd()<0.25) continue; const px1 = px + (rnd()-0.5)*120, py = py0 + (rnd()-0.5)*160, sz = 50+Math.round(rnd()*30); if(!farFrom(px1,py,200)) continue; obstacles.push({x:Math.round(px1-sz/2), y:Math.round(py-sz/2), w:sz, h:sz}); }   // v525: the pillars move every trip
    if(top) props.push({k:'standard', x:goal.x-150, y:goal.y-110});
  }
  const room = { w, h, obstacles, subzone:'rrtower', rrId:id, rrFloor:floor, rrUp, entrance, entranceSide:'left', entranceSpot:{x:entrance.x+90, y:cy}, rrBeacon, ladders, vents, props, rocks:[], name:RRT_NAMES[id]+(top ? ' (Beacon)' : ' — Floor '+floor),
    wallPal:['#7e7260','#3c342a','#5a5042'] };
  subFinish(room);
  room.waypoint = null; room.stairsDown = null;
  return room;
}
function spawnRRTower(g){
  const room = g.room, id = room.rrId;
  if(g.player.rrBeacons && g.player.rrBeacons[id]) return;          // already lit -- the tower stays quiet
  const goal = room.rrBeacon || room.rrUp, fl = room.rrFloor || 3;
  const av = [{x:room.entrance.x, y:room.entrance.y, r:420}, {x:goal.x, y:goal.y, r:(id===3 && fl===3 ? 60 : 130)}];
  const sp = (type, pos)=> pos && spawnEnemy(g, type, pos);
  const grp = (x0,x1,types)=>{ const c = subFreeSpot(room, x0, x1, 120, room.h-120, av); if(!c) return; for(const t of types) sp(t, subFreeSpot(room, c.x-90, c.x+90, c.y-90, c.y+90, null, 20) || c); };
  if(fl<3){   // v461: the lower floors of each tower
    if(id===1){
      for(let i=0;i<3+fl;i++) grp(520, room.w-420, ['bandit','bandit','banditarcher']);
      for(let i=0;i<fl+1;i++) grp(900, room.w-420, ['banditbrute']);
      for(let i=0;i<fl;i++) grp(700, room.w-420, ['raptor','raptor']);
    } else if(id===2){
      const W = room.obstacles.length ? [520, 1000, 1500, 2000] : [520, 1000, 1500, 2000];
      for(let k=0;k<4;k++){ grp(W[k], W[k]+300, ['skeleton','skeleton','skeletonarcher']); grp(W[k], W[k]+300, fl===2 && k>=2 ? ['cultist','skeleton','skeleton'] : ['skeletonbrute','skeleton']); }
    } else {
      for(let i=0;i<3+fl;i++) grp(520, room.w-520, ['skeletonbrute','skeleton','skeleton','skeletonarcher']);
      for(let i=0;i<fl+1;i++) grp(800, room.w-520, ['cultist','cultist','skeleton']);
      if(fl===2){ const t = sp('fhtemplar', subFreeSpot(room, 1200, room.w-600, 200, room.h-200, av)); if(t) t.dark = true; }
    }
    return;
  }
  if(id===1){
    for(let i=0;i<5;i++) grp(520, room.w-420, ['bandit','bandit','banditarcher']);
    for(let i=0;i<3;i++) grp(900, room.w-420, ['banditbrute']);
    for(let i=0;i<2;i++) grp(700, room.w-420, ['raptor','raptor']);
  } else if(id===2){
    for(let i=0;i<5;i++) grp(520, 780, ['skeleton','skeleton','skeletonarcher']);
    grp(900, 1340, ['skeletonbrute','skeleton','skeleton','skeleton']); grp(900, 1340, ['cultist','skeleton','skeleton']); grp(900, 1340, ['skeleton','skeleton','skeletonarcher']);
    grp(1440, 1860, ['skeletonbrute','skeletonarcher','skeleton','skeleton']); grp(1440, 1860, ['cultist','cultist','skeleton']); grp(1440, 1860, ['skeleton','skeleton','skeletonarcher']);
    grp(1960, room.w-420, ['skeletonbrute','skeletonbrute','cultist','skeleton']); grp(1960, room.w-420, ['skeletonarcher','skeletonarcher','skeleton','skeleton']); grp(1960, room.w-420, ['cultist','skeleton','skeleton']);
  } else {
    for(let i=0;i<4;i++) grp(520, room.w-520, ['skeletonbrute','skeleton','skeleton','skeletonarcher']);
    for(let i=0;i<3;i++) grp(800, room.w-520, ['cultist','cultist','skeleton','skeleton']);
    for(let i=0;i<2;i++) grp(520, room.w-520, ['skeleton','skeleton','skeleton','skeletonarcher']);
    for(let i=0;i<2;i++){ const t = sp('fhtemplar', subFreeSpot(room, 1200, room.w-600, 200, room.h-200, av)); if(t) t.dark = true; }
    const cap = spawnEnemy(g, 'fhtemplar', {x:room.rrBeacon.x-230, y:room.rrBeacon.y});
    if(cap){
      const mods = shuffle(Object.keys(SPECIAL_MODS).filter(k=>!['regen','vampiric','shielded','stoneSkin'].includes(k))); const ele = mods.filter(k=>SPECIAL_MODS[k].grp==='ele');
      const pick = [mods.find(k=>!SPECIAL_MODS[k].grp), ele[0]].filter(Boolean);
      const baseHp = cap.maxHp;
      makeElite(cap, pick); cap.eliteName = 'Shadow Captain'; cap.rrCaptain = true; cap.dark = true;
      cap.maxHp = Math.round(baseHp*2.2); cap.hp = cap.maxHp; cap.color = '#7a5ac0'; cap.leashRange = 99999;   // v419: no regeneration, far less health (was x1.8 plus random mods)
    }
  }
}
function enterRRTower(id){
  const g = game; if(!g) return;
  g.rrTowerReturn = id; g.rrStore = {};
  enterSubZone('rrtower', {id, floor:1});
}
function rrGoFloor(dir){
  const g = game, t = g && g.tower; if(!t || t.subzone!=='rrtower') return;
  g.rrStore = g.rrStore || {}; g.rrStore[t.rrId+'_'+(t.rrFloor||1)] = g.enemies;
  const nf = clamp((t.rrFloor||1) + dir, 1, RRT_FLOORS);
  enterSubZone('rrtower', {id:t.rrId, floor:nf, from:dir<0 ? 'above' : 'below'});
}
function rrBeaconBlocked(g){
  const t = g.tower, id = t.rrId;
  if(id===1 && g.enemies.some(e=>e.hp>0)) return 'Scavengers still hold the roost. Clear them before the brazier will take a flame.';
  if(id===3 && g.enemies.some(e=>e.hp>0 && e.rrCaptain)) return 'The Shadow Captain still stands. The beacon will not light while he guards it.';
  return null;
}
function lightRRBeacon(){
  const g = game, p = g.player, t = g.tower; if(!t || t.subzone!=='rrtower') return;
  const id = t.rrId;
  p.rrBeacons = p.rrBeacons || {};
  if(p.rrBeacons[id]){ showMsg('The beacon already burns.', 1.8); return; }
  const why = rrBeaconBlocked(g); if(why){ showMsg(why, 3.0); return; }
  p.rrBeacons[id] = true;
  const n = rrBeaconCount(p);
  // v490: lighting the first beacon starts the Wayfarer's quest if you haven't met him yet, and the tracker always shows the count
  const q = addQuestOnce(p, 'rr_towers', 'The Three Beacons', 'Light the three Templar watchtower beacons in Redridge Canyon.', 3);
  if(n<3) q.desc = 'Light the three Templar watchtower beacons in Redridge Canyon ('+n+'/3 lit).';
  if(!p.wayfarerMet) npcMark(p, 'wayfarer', true);
  if(q){ q.progress = n; if(n>=3){ q.status = 'complete'; q.rewarded = false; q.desc = 'All three beacons burn and the skybridge to Highward is whole. Tell the Last Wayfarer.'; npcMark(p, 'wayfarer', true); } }
  g.particles.push({type:'burst', x:t.rrBeacon.x, y:t.rrBeacon.y, t:0.6, max:0.6, color:'#ffcf70'});
  showNpcText(RRT_CLUES[id][0], RRT_CLUES[id][1], 'Continue', ()=>{ showMsg('Beacons lit: '+n+' / 3', 3.0); });
  updateQuestBadge(); saveGame();
}
function updateRRTower(g, dt){
  const p = g.player, t = g.tower;
  updatePortalChoice(false);
  let k = null;
  if(dist(p, t.entrance) < t.entrance.r + p.r + 22) k = (t.rrFloor||1)>1 ? 'rrDown' : 'rrTowerExit';
  else if(t.rrUp && dist(p, t.rrUp) < t.rrUp.r + p.r + 22) k = 'rrUp';
  else if(t.rrBeacon && dist(p, t.rrBeacon) < t.rrBeacon.r + p.r + 26) k = 'rrBeacon';
  // v490: once the beacon burns, a portal by it takes you straight back outside the tower
  if(t.rrBeacon && p.rrBeacons && p.rrBeacons[t.rrId] && !t.exitPortal) t.exitPortal = fixLootSpot(g, {x:t.rrBeacon.x-150, y:t.rrBeacon.y+90, r:26});
  if(t.exitPortal && !k && dist(p, t.exitPortal) < t.exitPortal.r + p.r + 22) k = 'rrTowerExit';
  updateInteractPrompt(k);
  if(t.vents && !g.over && p.hp>0){
    const clk = g.clock||0;
    for(const v of t.vents){
      const cyc = (clk+v.ph)%3.6, n = Math.floor((clk+v.ph)/3.6);
      v.state = cyc<2.4 ? 0 : cyc<3.0 ? 1 : 2;
      if(v.state===2 && v.hitN!==n){
        v.hitN = n;
        if(dist(p, v) < v.r + p.r*0.5){ playerDamage(g, (12+g.depth*2.2)*TELE_DMG_MULT, null); g.particles.push({type:'burst', x:p.x, y:p.y, t:0.3, max:0.3, color:'#bfe6ff'}); }
      }
    }
  }
}
function drawRRBeaconIso(b, clock, lit){
  const iso = toIso(b.x,b.y), t = clock||0;
  drawShadow(iso.x, iso.y+6, 40, 14);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#6a5c4c'; ctx.beginPath(); ctx.moveTo(-26,6); ctx.lineTo(-18,-34); ctx.lineTo(18,-34); ctx.lineTo(26,6); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#8a7a68'; ctx.beginPath(); ctx.ellipse(0,-36,24,10,0,0,7); ctx.fill();
  ctx.fillStyle='#2a221a'; ctx.beginPath(); ctx.ellipse(0,-37,17,6.5,0,0,7); ctx.fill();
  if(lit){
    const fl=0.85+0.15*Math.sin(t*10);
    const gr=ctx.createRadialGradient(0,-52,4,0,-52,110*fl); gr.addColorStop(0,'rgba(255,200,90,0.8)'); gr.addColorStop(1,'rgba(255,120,30,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,-52,110*fl,0,7); ctx.fill();
    ctx.fillStyle='#ffb040'; ctx.beginPath(); ctx.moveTo(-12,-38); ctx.quadraticCurveTo(0,-84*fl,12,-38); ctx.fill();
    ctx.fillStyle='#fff2b0'; ctx.beginPath(); ctx.moveTo(-5,-38); ctx.quadraticCurveTo(0,-62*fl,5,-38); ctx.fill();
  } else {
    ctx.fillStyle='rgba(150,150,160,0.5)'; for(let i=0;i<3;i++){ const ph=((t*0.4+i*0.33)%1); ctx.globalAlpha=0.5*(1-ph); ctx.beginPath(); ctx.arc(Math.sin(i*2+t)*4, -40-ph*28, 3+ph*4, 0, 7); ctx.fill(); }
    ctx.globalAlpha=1;
  }
  ctx.restore();
}
function drawRRVentIso(v, clock){
  const iso = toIso(v.x,v.y), st = v.state||0;
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#2b2620'; ctx.beginPath(); ctx.ellipse(0,0,28,12,0,0,7); ctx.fill();
  ctx.fillStyle = st===0 ? '#3d352c' : st===1 ? '#d8f0ff' : '#ffffff';
  ctx.beginPath(); ctx.ellipse(0,0,19,8,0,0,7); ctx.fill();
  if(st===1){ ctx.strokeStyle='rgba(180,225,255,'+(0.5+0.4*Math.sin((clock||0)*30))+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(0,0,v.r*1.0,v.r*0.42,0,0,7); ctx.stroke(); }
  if(st===2){
    const gr=ctx.createLinearGradient(0,0,0,-90); gr.addColorStop(0,'rgba(210,240,255,0.85)'); gr.addColorStop(1,'rgba(210,240,255,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.ellipse(0,0,v.r*0.9,v.r*0.38,0,0,7); ctx.fill(); ctx.fillRect(-22,-90,44,90);
  }
  ctx.restore();
}
function drawRRLadderIso(l){
  const iso = toIso(l.x,l.y);
  ctx.save(); ctx.translate(iso.x, iso.y-26);
  ctx.strokeStyle='#5a4326'; ctx.lineWidth=4; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-8,30); ctx.lineTo(-10,-34); ctx.moveTo(8,30); ctx.lineTo(10,-8); ctx.stroke();
  ctx.lineWidth=3; for(const yy of [24,10,-4,-18]){ ctx.beginPath(); ctx.moveTo(-9,yy); ctx.lineTo(9,yy+(yy<-6?-30:0)); ctx.stroke(); }
  ctx.restore();
}
function drawRRTowerProp(pr){
  const iso = toIso(pr.x,pr.y);
  ctx.save(); ctx.translate(iso.x, iso.y);
  if(pr.k==='scout'){
    drawShadow(0,2,22,8);
    ctx.fillStyle='#4d5a3a'; ctx.beginPath(); ctx.ellipse(0,-4,20,8,0.1,0,7); ctx.fill();
    ctx.fillStyle='#d8b890'; ctx.beginPath(); ctx.arc(-18,-6,5,0,7); ctx.fill();
    ctx.fillStyle='#6b4a2a'; ctx.fillRect(4,-12,12,9);
  } else {
    drawShadow(0,2,16,6);
    ctx.strokeStyle='#4a3a28'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(3,-46); ctx.stroke();
    ctx.fillStyle='#8a2a2a'; ctx.beginPath(); ctx.moveTo(3,-46); ctx.lineTo(24,-40); ctx.lineTo(8,-30); ctx.lineTo(20,-22); ctx.lineTo(3,-24); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

