// ---- Highward (v287): the floating Templar fortress. Five floors, an inverted pyramid (each floor wider than the last). ----
const HW_DEPTH = 46;   // v489: Highward floors are Lv 46-50 (were 50-54)
const HW_FLOORS = 5, HW_W = [5600,6400,7200,8000,8800], HW_H = [2600,3000,3400,3800,4200];   // v421: rooms-and-halls fortress, ~4x the old floor area
const HW_UP_FRAC = [0.5,0.82,0.18,0.82,null], HW_DOWN_FRAC = [null,0.5,0.82,0.18,0.82];
const HW_WARNING = 'When shadows wake beneath the Hold, three bearers bind what none may hold.';
function makeHighwardRunestoneItem(){
  return { id:'it'+Math.random().toString(36).slice(2,9), slotType:'questitem', rarity:'rare',
    name:'Templar Runestone', affixes:[], color:'#ffe08a', questId:'highward_runestone', unsellable:true,
    questDesc:'A rune-carved stone marked with a Templar crown, taken from the guardian of Highward. Quest item -- cannot be sold.' };
}
function makeHighward(f){
  const w = HW_W[f-1], h = HW_H[f-1], rnd = subSeeded(9100+f*53);
  const Ri = (lo,hi)=> Math.round((lo+rnd()*(hi-lo))/50)*50;
  const M = 200, GAP = 260, CW = 200;
  const rooms = [];
  const add = (x,y,rw,rh,kind)=>{ const r = {x:Math.round(x), y:Math.round(y), w:rw, h:rh, kind, id:rooms.length, deg:0}; rooms.push(r); return r; };
  const fits = (x,y,rw,rh)=> x>=M && y>=M && x+rw<=w-M && y+rh<=h-M && rooms.every(o=> x>o.x+o.w+GAP || x+rw<o.x-GAP || y>o.y+o.h+GAP || y+rh<o.y-GAP);
  let start, endR = null, boss = null;
  if(f===1){ start = add(Math.round(w/2-650), h-M-900, 1300, 900, 'start'); endR = add(w-M-800, M, 800, 900, 'end'); }   // v425: one wide lobby (west + east gates, waypoint in the middle)
  else if(f<5){ const left = f%2===1; start = add(left?M:w-M-700, h-M-700, 700, 700, 'start'); endR = add(left?w-M-700:M, M, 700, 700, 'end'); }
  else { start = add(w/2-350, h-M-700, 700, 700, 'start'); boss = add(w/2-700, M, 1400, 900, 'boss'); }
  const target = [8,10,12,14,15][f-1];
  for(let tries=0; rooms.length < target+2 && tries<4000; tries++){
    const t = rnd(); let rw, rh, kind;
    if(t<0.22){ if(rnd()<0.5){ rw = Ri(1400,1900); rh = Ri(500,650); } else { rw = Ri(500,650); rh = Ri(1400,1900); } kind = 'hall'; }
    else { rw = Ri(550,900); rh = Ri(550,900); kind = 'chamber'; }
    const x = Ri(M, w-M-rw), y = Ri(M, h-M-rh);
    if(fits(x,y,rw,rh)) add(x,y,rw,rh,kind);
  }
  const cxOf = r=>r.x+r.w/2, cyOf = r=>r.y+r.h/2, dd = (a,b)=>Math.hypot(cxOf(a)-cxOf(b), cyOf(a)-cyOf(b));
  // spanning tree from the start room, then a single link for the boss sanctum, then a few loops
  const nodes = rooms.filter(r=>r!==boss), edges = [];
  let hwFirst = null;
  if(f===1){   // the lobby has exactly one way out: north, to the first room of the fortress
    let bd = 1e9; for(const r of nodes){ if(r===start || r.y+r.h > start.y-120) continue; const d = Math.hypot(cxOf(r)-cxOf(start), cyOf(r)-start.y); if(d<bd){ bd = d; hwFirst = r; } }
    if(!hwFirst) hwFirst = nodes.find(r=>r!==start);
  }
  const tn = f===1 ? nodes.filter(r=>r!==start) : nodes, inT = new Set([f===1 ? hwFirst.id : start.id]);
  while(inT.size < tn.length){
    let best = null;
    for(const a of tn) if(inT.has(a.id)) for(const b of tn) if(!inT.has(b.id)){ const d = dd(a,b); if(!best || d<best.d) best = {a,b,d}; }
    edges.push(best); inT.add(best.b.id);
  }
  if(f===1) edges.push({a:start, b:hwFirst, anchor:true});
  if(boss){ let best = null; for(const a of nodes){ if(a===start) continue; const d = dd(a,boss); if(!best || d<best.d) best = {a, b:boss, d}; } edges.push(best); }
  for(const e of edges){ e.a.deg++; e.b.deg++; }
  for(let k=0, tries=0; k<2 && tries<60; tries++){
    const a = nodes[Math.floor(rnd()*nodes.length)], b = nodes[Math.floor(rnd()*nodes.length)];
    if(a===b || a.deg<2 || b.deg<2 || dd(a,b)>2200 || edges.some(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))) continue;
    edges.push({a,b}); a.deg++; b.deg++; k++;
  }
  const floorRects = rooms.map(r=>({x:r.x, y:r.y, w:r.w, h:r.h}));
  for(const e of edges){
    const ax = cxOf(e.a), ay = e.anchor ? e.a.y+CW/2 : cyOf(e.a), bx = cxOf(e.b), by = cyOf(e.b);
    if(e.anchor){ floorRects.push({x:ax-CW/2, y:Math.min(ay,by)-CW/2, w:CW, h:Math.abs(by-ay)+CW}); floorRects.push({x:Math.min(ax,bx)-CW/2, y:by-CW/2, w:Math.abs(bx-ax)+CW, h:CW}); continue; }
    if(rnd()<0.5){ floorRects.push({x:Math.min(ax,bx)-CW/2, y:ay-CW/2, w:Math.abs(bx-ax)+CW, h:CW}); floorRects.push({x:bx-CW/2, y:Math.min(ay,by)-CW/2, w:CW, h:Math.abs(by-ay)+CW}); }
    else { floorRects.push({x:ax-CW/2, y:Math.min(ay,by)-CW/2, w:CW, h:Math.abs(by-ay)+CW}); floorRects.push({x:Math.min(ax,bx)-CW/2, y:by-CW/2, w:Math.abs(bx-ax)+CW, h:CW}); }
  }
  const obstacles = darkCryptCarveObstacles(floorRects, w, h);
  // dead-end rooms: a big pack and a chest; every room gets statues, braziers, pillars or crosses
  const chests = [], deco = [];
  for(const r of rooms){
    if(r.deg===1 && (r.kind==='chamber' || r.kind==='hall')){ r.kind = 'dead'; chests.push({x:cxOf(r), y:cyOf(r)+40, r:24, opened:false}); }
  }
  for(const r of rooms){
    const cx = cxOf(r), cy = cyOf(r);
    const corners = [[r.x+70,r.y+70],[r.x+r.w-70,r.y+70],[r.x+70,r.y+r.h-70],[r.x+r.w-70,r.y+r.h-70]];
    corners.forEach((c,i)=>{
      if(r.kind==='start' && i>=2) return;
      if((i+r.id)%2===0) deco.push({type:'brazier', x:c[0], y:c[1]});
      else { deco.push({type:'statue', x:c[0], y:c[1]}); obstacles.push({x:c[0]-22, y:c[1]-22, w:44, h:44, isProp:true, kind:'hwstatue'}); }
    });
    if(r.kind==='dead' || r.kind==='boss'){ for(const fx of [0.27,0.73]){ const px = r.x+r.w*fx, py = r.y+90; deco.push({type:'cross', x:px, y:py}); obstacles.push({x:px-16, y:py-16, w:32, h:32, isProp:true, kind:'hwcross'}); } }
    if(r.kind==='hall'){
      const horiz = r.w>r.h;
      const len = horiz ? r.w : r.h, thick = horiz ? r.h : r.w, c0 = horiz ? r.x : r.y, cm = horiz ? cx : cy;
      for(let u=c0+220; u<c0+len-180; u+=360){
        if(Math.abs(u-cm)<220) continue;
        for(const side of [-1,1]){
          const px = horiz ? u : (horiz?0:cx)+side*(thick/2-110), py = horiz ? cy+side*(thick/2-110) : u;
          const qx = horiz ? u : cx+side*(thick/2-110);
          obstacles.push({x:qx-28, y:py-28, w:56, h:56, mazeWall:true});
        }
      }
    } else if(r.kind==='chamber' || r.kind==='dead'){
      if(r.w>=800 && r.h>=800){ for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) obstacles.push({x:cx+sx*r.w*0.27-28, y:cy+sy*r.h*0.27-28, w:56, h:56, mazeWall:true}); }
    }
  }
  // entrances
  let hwReturn = null, entrance, entranceSpot, hwUp = null, waypoint = null, eastGates = null, altar = null, hwSwitch = null, guardPos = null, chamber = null;
  if(f===1){
    entrance = {x:start.x+70, y:cyOf(start), r:34}; entranceSpot = {x:entrance.x+90, y:entrance.y};
    waypoint = {x:cxOf(start), y:cyOf(start), r:22};
    eastGates = [{x:start.x+start.w-70, y:cyOf(start), r:44, side:'L'}];
  } else {
    entrance = {x:cxOf(start), y:start.y+start.h-110, r:32}; entranceSpot = {x:entrance.x, y:entrance.y-90};
  }
  if(endR) hwUp = {x:cxOf(endR), y:endR.y+110, r:32};
  if(boss){
    chamber = {x:boss.x, y:boss.y, w:boss.w, h:boss.h};
    const cx = cxOf(boss);
    altar = {x:Math.round(cx-170), y:Math.round(boss.y+200), r:40};
    hwSwitch = {x:Math.round(cx+170), y:Math.round(boss.y+200), r:34};
    guardPos = {x:cx, y:Math.round(cyOf(boss)+40)};
    hwReturn = {x:cx, y:Math.round(boss.y+boss.h-190), r:36};
  }
  const room = { w, h, obstacles, floorRects, subzone:'highward', hwFloor:f, entrance, entranceSide:'left', entranceSpot,
    hwUp, hwDown: f>=2 ? entrance : null, chamber, guardPos, altar, hwSwitch, hwReturn, rocks:[], ladders:[], name:'Highward — Floor '+f,
    wallPal:['#b88a3e','#4a3018','#8a6228'], pal:['#3d3530','#2f2824','#4a3e36','#352c27'], noOre:true,
    hwRooms:rooms, hwDeco:deco, chests, startRoom:start, endRoom:endR, hwFirstRoom:hwFirst, rooms:rooms.map(r=>({x:r.x,y:r.y,w:r.w,h:r.h})) };
  subFinish(room);
  room.waypoint = waypoint; room.stairsDown = null;
  if(eastGates) room.eastGates = eastGates;
  return room;
}
function hwStoreSave(g){
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='highward'){ g.hwStore = g.hwStore || {}; g.hwStore[g.tower.hwFloor] = {enemies:g.enemies, greeted:!!g.tower.greeted, chests:(g.tower.chests||[]).map(c=>!!c.opened)}; }
}
function spawnHighward(g){
  const room = g.room, f = room.hwFloor, p = g.player;
  const av = [{x:room.entrance.x, y:room.entrance.y, r:(f===1?260:300)}];
  if(room.waypoint) av.push({x:room.waypoint.x, y:room.waypoint.y, r:(f===1?200:300)});
  if(room.eastGates) for(const gt of room.eastGates) av.push({x:gt.x, y:gt.y, r:260});
  if(room.hwUp) av.push({x:room.hwUp.x, y:room.hwUp.y, r:170});
  const S='hwsentinel', Wd='hwwarden', V='hwvanguard';
  const W = [[.62,.28,.10],[.46,.34,.20],[.36,.34,.30],[.30,.30,.40],[.24,.30,.46]][f-1];
  const pick = ()=>{ const t = Math.random(); return t<W[0] ? S : t<W[0]+W[1] ? V : Wd; };
  const made = [];
  const ri = (a,b)=> a+Math.floor(Math.random()*(b-a+1));
  const clampIn = (r,x,y)=>({x:clamp(x, r.x+90, r.x+r.w-90), y:clamp(y, r.y+90, r.y+r.h-90)});
  const pack = (r, n, forced)=>{
    const c = subFreeSpot(room, r.x+120, r.x+r.w-120, r.y+120, r.y+r.h-120, av, 60); if(!c) return [];
    const out = [];
    let extra = [];
    if(!forced && n>=5){ extra.push('hwmendicant'); if(Math.random()<0.6) extra.push('hwbulwark'); n -= extra.length; }
    if(!forced && n>=4 && Math.random() < 0.3+0.05*f){ const k = f>=3 ? 4 : 3; extra = extra.concat(Array(k).fill('hwduelist')); n -= k-1; }
    n += extra.length; forced = forced || Array(n-extra.length).fill(null).concat(extra);
    for(let i=0;i<n;i++){
      const type = (forced && forced[i]) || pick();
      const q = clampIn(r, c.x+rand(-150,150), c.y+rand(-130,130));
      const pos = subFreeSpot(room, q.x-40, q.x+40, q.y-40, q.y+40, null, 12) || c;
      const e = spawnEnemy(g, type, pos); if(e){ made.push(e); out.push(e); }
    }
    return out;
  };
  const sc = 0.9 + 0.1*f;
  for(const r of room.hwRooms){
    if(r.kind==='start'){
      if(f===1){   // the lobby: two packs holding the north corners, either side of the way out
        pack({x:r.x+120, y:r.y+20, w:520, h:430}, ri(6,8));
        pack({x:r.x+r.w-640, y:r.y+20, w:520, h:430}, ri(6,8));
      }
      continue;
    }
    if(r.kind==='boss'){
      for(const [dx,dy] of [[-300,-60],[300,-60],[-300,230],[300,230]]){ const e = spawnEnemy(g, Wd, {x:room.guardPos.x+dx, y:room.guardPos.y+dy}); if(e){ e.hwSentry = true; made.push(e); } }
      for(const [dx,dy,tp] of [[0,320,'hwmendicant'],[-160,300,'hwbulwark'],[160,300,'hwbulwark']]){ const e = spawnEnemy(g, tp, {x:room.guardPos.x+dx, y:room.guardPos.y+dy}); if(e){ e.hwSentry = true; made.push(e); } }
      {   // v489: the Warden stands again on every visit
        const gd = spawnEnemy(g, 'hwguardian', room.guardPos);
        if(gd){ gd.eliteName = 'Ancient Warden'; gd.hwGuardian = true; gd.leashRange = 99999; gd.xpMul = 10; }
      }
      continue;
    }
    let n = r.kind==='dead' ? ri(11,15) : r.kind==='hall' ? ri(6,9) : ri(5,8);
    n = Math.round(n*sc);
    const first = (f===1 && r===room.hwFirstRoom);
    const forced = r.kind==='dead' ? [Wd,Wd,S,S,V,V] : first ? [Wd] : null;
    if(first) n = Math.max(n, 8);
    const grp = pack(r, n, forced);
    if(first && grp.length){
      // the protectors wait in the first room past the lobby; the Gilded Warden among them carries the Highward map
      grp.slice(0,4).forEach(e=>{ e.hwProtector = true; });
      grp[0].hwMapCarrier = true; grp[0].mapCarrier = true; grp[0].mapHolder = true; grp[0].xpMul = 3;
    }
  }
  if(f>=2 && f<=4 && made.length){ const cand = made.filter(e=>!e.hwProtector && !e.elite && !e.hwSentry); for(let k=0;k<Math.ceil(made.length/18);k++){ const e = cand[Math.floor(Math.random()*cand.length)]; if(e) makeElite(e, pickMods(2)); } }
  // keep pace with the dungeon: a floor's worth of minions is worth about half an XP bar
  const K = XP_KILLS_A + XP_KILLS_B*g.depth, N = Math.max(1, made.filter(e=>!e.hwSentry).length);
  const mul = clamp(0.5*K/N, 0.6, 5);
  for(const e of made) e.xpMul = e.hwSentry ? 2 : mul;
}
function enterHighward(floor, opts){
  opts = opts || {};
  const g = game, p = g.player;
  hwStoreSave(g);
  g.scene = 'lighthouse'; g.lighthouseFloor = floor;
  g.tower = makeHighward(floor); g.room = g.tower;
  g.depth = HW_DEPTH + floor - 1;
  const t = g.tower;
  if(opts.from==='below' && t.hwDown){ p.x = t.hwDown.x; p.y = t.hwDown.y - 90; }
  else if(opts.from==='above' && t.hwUp){ p.x = t.hwUp.x; p.y = t.hwUp.y + 100; }
  else if(opts.from==='wp' && t.waypoint){ p.x = t.waypoint.x; p.y = t.waypoint.y + 45; }
  else if(opts.from==='cliffside' && t.eastGates){ p.x = t.eastGates[0].x - 130; p.y = t.eastGates[0].y; }
  else { p.x = t.entranceSpot.x; p.y = t.entranceSpot.y; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  g.hwStore = g.hwStore || {};
  const st = g.hwStore[floor];
  if(st && floor===HW_FLOORS && !st.enemies.some(e=>e.hwGuardian && e.hp>0)){ delete g.hwStore[floor]; spawnHighward(g); }   // v489: the Warden's floor refills after a kill
  else if(st){ g.enemies = st.enemies.filter(e=>e.hp>0); t.greeted = st.greeted; if(st.chests) t.chests.forEach((c,i)=>{ c.opened = !!st.chests[i]; }); }
  else spawnHighward(g);
  if(floor===1 && !p.hwMapFound && !g.enemies.some(e=>e.hwMapCarrier && e.hp>0)){
    // v425b: make sure the map bearer exists (also repairs floors restored from an older layout)
    const fr = t.hwFirstRoom, fx = fr ? fr.x+fr.w/2 : t.entrance.x, fy = fr ? fr.y+fr.h/2 : t.entrance.y;
    let best = null, bd = 1e9;
    for(const e of g.enemies){ if(e.hp<=0 || e.hwSentry) continue; const d = Math.hypot(e.x-fx, e.y-fy) - (e.hw==='warden'?400:0); if(d<bd){ bd = d; best = e; } }
    if(best){ best.hwMapCarrier = true; best.mapCarrier = true; best.mapHolder = true; best.xpMul = Math.max(best.xpMul||1, 3); }
  }
  t.hasGuardian = g.enemies.some(e=>e.hwGuardian && e.hp>0);
  showMsg(t.name+'  (Lv. '+g.depth+')', 1.8);
  if(!getQuest(p,'hw_runestone') && !p.highwardSlain){ addQuestOnce(p, 'hw_runestone', 'The Third Runestone', 'Highward holds the last Templar Runestone. Climb the fortress and take it.', 1); updateQuestBadge(); }
  g.followers = [];
  ensureFollowers(g);
  for(const fo of g.followers){ fo.x = p.x; fo.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  saveGame();
}
function hwGuardianDown(g){
  const p = g.player, t = g.tower;
  p.highwardSlain = true;
  const it = classRewardItem(p, Math.max(p.level, g.depth), 'reward'); forceAddToBag(p, it);
  p.gold += 600; gainXp(g, 800 + g.depth*25);
  const q = getQuest(p,'hw_runestone'); if(q){ q.desc='The Ancient Warden has fallen. Take the Templar Runestone from the altar, then throw the switch behind it to open the eastern gate.'; }
  g.particles.push({type:'burst', x:t.guardPos.x, y:t.guardPos.y, t:0.6, max:0.6, color:'#ffe08a'});
  bagPulse(); updateQuestBadge(); saveGame();
  showBigMsg('THE ANCIENT WARDEN FALLS', 'The altar and the gate switch are free', 4.6, false, true);
  showMsg(it.name+' + 600 gold', 3.2, '#ffe08a');
}
function hwAltarReady(p){ return !!(p && p.highwardSlain && !p.hwRuneTaken); }
function hwSwitchReady(p){ return !!(p && p.highwardSlain && !p.hwSwitchOn); }
function takeHwRunestone(){
  const g = game, p = g.player;
  if(!hwAltarReady(p)) return;
  p.hwRuneTaken = true;
  forceAddToBag(p, makeHighwardRunestoneItem());
  const q = getQuest(p,'hw_runestone'); if(q){ q.status='complete'; q.rewarded=true; q.progress=q.total; q.desc='You hold the Templar Runestone and its warning.'; }
  bagPulse(); updateQuestBadge(); saveGame();
  showNpcText('Templar Runestone', 'The runestone lifts from its altar, and as your fingers close on it the carved words burn into the air:\n\n\u201C'+HW_WARNING+'\u201D\n\nSomewhere behind the altar a switch waits to open the eastern gate.', 'Take it', ()=>{ showMsg('Templar Runestone obtained', 3.0, '#ffe08a'); });
}
function pullHwSwitch(){
  const g = game, p = g.player;
  if(!hwSwitchReady(p)) return;
  p.hwSwitchOn = true; p.hwCrossing = true;
  shakeScreen(g, 5, 0.6);
  showMsg('Far below, the eastern gate grinds open. A golden portal opens in the sanctum to carry you back down.', 4.0, '#ffe08a');
  saveGame();
}
function updateHighward(g, dt){
  const p = g.player, t = g.tower;
  updatePortalChoice(false);
  let k = null;
  if(t.hwFloor===1 && dist(p, t.entrance) < t.entrance.r + p.r + 22) k = 'hwToCanyon';
  else if(t.hwDown && dist(p, t.hwDown) < t.hwDown.r + p.r + 22) k = 'hwDown';
  else if(t.hwUp && dist(p, t.hwUp) < t.hwUp.r + p.r + 22) k = 'hwUp';
  else if(t.waypoint && dist(p, t.waypoint) < t.waypoint.r + p.r + 24){ k = 'waypointHighward'; }
  else if(t.hwReturn && p.hwSwitchOn && dist(p, t.hwReturn) < t.hwReturn.r + p.r + 24) k = 'hwReturn';
  else if(t.altar && hwAltarReady(p) && dist(p, t.altar) < t.altar.r + p.r + 24) k = 'hwAltar';
  else if(t.hwSwitch && hwSwitchReady(p) && dist(p, t.hwSwitch) < t.hwSwitch.r + p.r + 24) k = 'hwSwitch';
  else if(t.eastGates){ for(const gt of t.eastGates) if(dist(p, gt) < gt.r + p.r + 22){ k = p.hwSwitchOn ? 'hwEastOpen' : 'hwEastLocked'; break; } }
  updateInteractPrompt(k);
  if(t.hwFloor===1 && !t.greeted){
    for(const e of g.enemies){ if(e.hwProtector && e.hp>0 && dist(e,p) < 600){ t.greeted = true; showMsg('“You are here for the runestone? Then you must die.”', 4.6, '#ffd27a'); for(const q of g.enemies) if(q.hwProtector) q.aggroed = true; break; } }
  }
  for(const c of (t.chests||[])){
    if(!c.opened && dist(p,c) < c.r+p.r+8 && !g.enemies.some(e=>e.hp>0 && !e.hwSentry && dist(e,c)<420 && !e.passive)){
      c.opened = true;
      const it = classRewardItem(p, Math.max(p.level, g.depth), 'rare'); forceAddToBag(p, it);
      const it2 = generateItem(Math.max(p.level, g.depth), 'magic', null, null, p); forceAddToBag(p, it2);
      const gold = 120 + g.depth*8; p.gold += gold;
      showMsg('Chest: '+it.name+' + '+it2.name+' + '+gold+' gold', 3.0, '#ffe08a');
      g.particles.push({type:'burst', x:c.x, y:c.y, t:0.5, max:0.5, color:'#e8c44a'}); bagPulse(); saveGame();
    } else if(!c.opened && dist(p,c) < c.r+p.r+8 && !c.warned){ c.warned = true; showMsg('Clear the room guardians first.', 1.6, '#ffd27a'); }
  }
  if(t.hasGuardian && !g.enemies.some(e=>e.hwGuardian && e.hp>0)){ t.hasGuardian = false; if(!p.highwardSlain) hwGuardianDown(g); else { bossRekillRare(g, t.guardPos); showBigMsg('THE ANCIENT WARDEN FALLS', 'A rare treasure lies where it stood', 3.6, false, true); } }
}
// v420: a glowing gold portal that fills a gate opening. cx,cy = centre of the opening (local coords), rx/ry = half size.
function drawGoldPortal(cx, cy, rx, ry, clock, lit){
  const t = clock||0;
  ctx.save(); ctx.translate(cx, cy);
  if(!lit){
    ctx.fillStyle='#1c1814'; ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.fill();
    ctx.strokeStyle='rgba(120,100,60,0.55)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.ellipse(0,0,rx*0.8,ry*0.8,0,0,7); ctx.stroke();
    ctx.restore(); return;
  }
  const pulse = 0.85+0.15*Math.sin(t*3);
  const g1 = ctx.createRadialGradient(0,0,2,0,0,Math.max(rx,ry));
  g1.addColorStop(0,'rgba(255,250,215,0.98)'); g1.addColorStop(0.45,'rgba(255,210,100,0.92)'); g1.addColorStop(1,'rgba(200,120,20,0.55)');
  ctx.shadowColor='#ffcf5a'; ctx.shadowBlur=26*pulse;
  ctx.fillStyle=g1; ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.fill();
  ctx.shadowBlur=0;
  ctx.save(); ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.clip();
  ctx.strokeStyle='rgba(255,255,230,0.65)'; ctx.lineWidth=2; ctx.lineCap='round';
  for(let i=0;i<3;i++){
    const a0 = t*1.8 + i*2.1;
    ctx.beginPath(); ctx.ellipse(0,0,rx*(0.35+0.2*i),ry*(0.35+0.2*i),a0*0.2,a0,a0+2.2); ctx.stroke();
  }
  ctx.fillStyle='rgba(255,255,255,0.85)';
  for(let i=0;i<7;i++){ const f = ((t*0.5+i*0.143)%1); ctx.beginPath(); ctx.arc(Math.sin(i*5.3)*rx*0.6, ry*0.9-f*ry*1.8, 1.6, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle='rgba(255,224,140,0.9)'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.stroke();
  ctx.restore();
}
function drawHwGateIso(gt, open, clock){
  const iso = toIso(gt.x, gt.y), t = clock||0;
  drawShadow(iso.x, iso.y+4, 52, 16);
  ctx.save(); ctx.translate(iso.x, iso.y);
  // fortress gate: rust-stone piers, gold-capped lintel with a crest
  ctx.fillStyle='#6a4a2a'; ctx.fillRect(-40,-96,16,100); ctx.fillRect(24,-96,16,100);
  ctx.fillStyle='#8a6232'; ctx.fillRect(-40,-96,5,100); ctx.fillRect(24,-96,5,100);
  ctx.fillStyle='#b88a3e'; ctx.fillRect(-46,-108,92,14);
  ctx.fillStyle='#e0b85a'; ctx.fillRect(-46,-108,92,3.5);
  ctx.fillStyle='#8a6228'; ctx.beginPath(); ctx.moveTo(-10,-108); ctx.lineTo(0,-122); ctx.lineTo(10,-108); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='#2a1a0c'; ctx.lineWidth=1.2; ctx.strokeRect(-40,-96,16,100); ctx.strokeRect(24,-96,16,100); ctx.strokeRect(-46,-108,92,14);
  drawGoldPortal(0, -48, 22, 46, t, !!open);
  if(!open){ ctx.strokeStyle='#8a6aff'; ctx.lineWidth=2; ctx.globalAlpha=0.5+0.3*Math.sin(t*2); ctx.beginPath(); ctx.moveTo(-12,-76); ctx.lineTo(12,-22); ctx.moveTo(12,-76); ctx.lineTo(-12,-22); ctx.stroke(); ctx.globalAlpha=1; }
  ctx.restore();
}
// ---- Highward Ancient Warden, knights and set pieces (v420) ----
const _hwOff = document.createElement('canvas'); _hwOff.width = 460; _hwOff.height = 400;
const _hwCx = _hwOff.getContext('2d');
const HW_WASH = {duelist:'rgba(200,118,58,0.46)', bulwark:'rgba(112,104,94,0.56)', sentinel:'rgba(178,92,40,0.52)', vanguard:'rgba(214,150,56,0.55)', warden:'rgba(150,104,28,0.55)', guardian:'rgba(236,188,70,0.50)'};
const HW_WASH2 = {duelist:'rgba(150,28,22,0.28)', bulwark:'rgba(40,30,20,0.22)', warden:'rgba(150,26,22,0.34)', guardian:'rgba(120,20,18,0.22)'};
function drawHwKnightIso(e){
  const iso = toIso(e.x, e.y), kind = e.hw;
  if(kind==='mendicant'){ drawHwMendicantIso(e); return; }
  const pv = e._pv || (e._pv = {equipment:{mainhand:{slotType:'weapon1h'}, offhand:{slotType:kind==='duelist' ? 'weapon1h' : 'shield'}}, invuln:0, lookBody:kind==='duelist' ? 1 : 2, lookHelm:kind==='duelist' ? 1 : 2, noShadow:true, hwHammer:1, towerShield:kind==='bulwark'});
  pv.hwHammer = kind==='warden' ? 2 : kind==='vanguard' ? 3 : kind==='duelist' ? 0 : 1;
  pv.x = e.x; pv.y = e.y; pv.r = kind==='guardian' ? 28.5 : kind==='warden' ? 18.7 : kind==='vanguard' ? 18 : kind==='bulwark' ? 20 : kind==='duelist' ? 15.5 : 17;
  pv.faceSign = e.faceSign||1; pv.animT = e.animT||0; pv.moving = !!e.moving && !(e.tState==='tele');
  pv.atkAnimT = e.atkAnimT>0 ? Math.min(e.atkAnimT, 0.22) : 0; pv.atkAnimMax = 0.22;
  pv.castAnimT = (e.tState==='tele' || e.chWind>0) ? 0.25 : 0;
  pv.blocking = e.shieldUp>0 || (kind==='bulwark' && !(e.guardBrokenT>0)); pv.hitFlash = 0;
  if(kind==='duelist' && e.invulnT>0) pv.dodging = true; else pv.dodging = false;
  const sc = pv.r/16;
  drawShadow(iso.x, iso.y, 17*sc, 6.5*sc);
  const main = ctx, PX = 230, PY = 330;
  ctx = _hwCx;
  try{
    _hwCx.setTransform(1,0,0,1,0,0); _hwCx.clearRect(0,0,460,400);
    _hwCx.setTransform(1,0,0,1,PX-iso.x,PY-iso.y);
    drawWarrior(pv);
    _hwCx.setTransform(1,0,0,1,0,0);
    _hwCx.globalCompositeOperation = 'source-atop';
    _hwCx.fillStyle = e.hitT>0 ? 'rgba(255,255,255,0.78)' : (HW_WASH[kind]||HW_WASH.sentinel);
    _hwCx.fillRect(0,0,460,400);
    if(e.hitT<=0){ if(HW_WASH2[kind]){ _hwCx.fillStyle = HW_WASH2[kind]; _hwCx.fillRect(0,0,460,400); } _hwCx.fillStyle = 'rgba(40,22,8,0.18)'; _hwCx.fillRect(0,0,460,400); }
    _hwCx.globalCompositeOperation = 'source-over';
  } finally { ctx = main; }
  ctx.drawImage(_hwOff, iso.x-PX, iso.y-PY);
  if(e.shieldUp>0){
    ctx.save(); ctx.translate(iso.x, iso.y-e.r*1.4); ctx.scale(1, 1.1);
    ctx.strokeStyle='rgba(255,226,140,'+(0.5+0.3*Math.sin((game.clock||0)*8))+')'; ctx.lineWidth=3; ctx.shadowColor='#ffd060'; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.arc(0,0,e.r*1.25,0,7); ctx.stroke(); ctx.restore();
  }
  if(kind==='guardian'){
    // unique look: a pulsing gold aura and a floating crown of hammers above the helm
    const tm = game.clock||0, top = iso.y - pv.r*4.1;
    ctx.save(); ctx.globalCompositeOperation='lighter';
    const ag = ctx.createRadialGradient(iso.x, iso.y-pv.r*1.6, 8, iso.x, iso.y-pv.r*1.6, pv.r*3.2); ag.addColorStop(0,'rgba(255,200,80,'+(0.22+0.08*Math.sin(tm*3))+')'); ag.addColorStop(1,'rgba(255,160,40,0)');
    ctx.fillStyle=ag; ctx.beginPath(); ctx.arc(iso.x, iso.y-pv.r*1.6, pv.r*3.2, 0, 7); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(iso.x, top+Math.sin(tm*2)*2); ctx.fillStyle='#ffd66a'; ctx.strokeStyle='#6a4a10'; ctx.lineWidth=1.2; ctx.shadowColor='#ffcf5a'; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.moveTo(-18,0); ctx.lineTo(-18,-12); ctx.lineTo(-9,-5); ctx.lineTo(0,-16); ctx.lineTo(9,-5); ctx.lineTo(18,-12); ctx.lineTo(18,0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  if(kind==='guardian'){
    ctx.save(); ctx.font='bold 12px Alegreya,Georgia, serif'; ctx.textAlign='center'; ctx.lineWidth=3; ctx.strokeStyle='rgba(0,0,0,.85)'; ctx.fillStyle='#ffe08a';
    ctx.strokeText('Ancient Warden', iso.x, iso.y-pv.r*4.5-18); ctx.fillText('Ancient Warden', iso.x, iso.y-pv.r*4.5-18); ctx.restore();
  }
  drawHpBar(iso, pv.r*(kind==='guardian'?4.5:4.6), kind==='guardian' ? e.r*1.5 : e.r, e.hp, e.maxHp);
}
function drawHwTelegraph(e){
  drawHwStatusFx(e);
  const flat = (px,py,R,frac,col)=>{
    const q = toIso(px,py); ctx.save(); ctx.translate(q.x,q.y); ctx.scale(1, ISO_KY/ISO_KX);
    const rr = R*ISO_KX*Math.SQRT2;
    ctx.strokeStyle='rgba('+col+','+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,0,rr,0,7); ctx.stroke();
    ctx.fillStyle='rgba('+col+','+(0.10+frac*0.28)+')'; ctx.beginPath(); ctx.arc(0,0,rr*frac,0,7); ctx.fill(); ctx.restore();
  };
  if(e.tState==='tele' && e.tPt) flat(e.tPt.x, e.tPt.y, e.slamR, clamp(1-e.tT/e.slamTele,0,1), '230,170,70');
  if(e.rainQ) for(const r of e.rainQ) flat(r.x, r.y, 54, clamp(1-r.t/1.1,0,1), '255,210,90');
  if(e.chWind>0 && e.chAng!=null){
    const a = toIso(e.x,e.y), b = toIso(e.x+Math.cos(e.chAng)*380, e.y+Math.sin(e.chAng)*380);
    ctx.save(); ctx.strokeStyle='rgba(255,200,90,'+(0.4+0.4*Math.sin((game.clock||0)*30))+')'; ctx.lineWidth=14; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.restore();
  }
}
