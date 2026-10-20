// ---------------- Black Marsh (v144) ----------------
// East of Lakeside Ruins. A long, HORIZONTAL zone that winds along a river:
// the trail hugs one bank and crosses over to the other at two narrow plank
// bridges. Water (the river + scattered stagnant ponds) is modeled exactly
// like Lakeside's lake -- isWater rects that block foot movement but not
// projectiles -- except that swimmers (alligator, anaconda) ignore them by
// using room.dryObstacles. Forgotten Tower (far east gate) is a sealed placeholder.
const BM_W = 7200, BM_H = 3800, BM_DEPTH = 28;
// v459: the marsh is an arrowhead (>) -- the south arm runs east along the river to the Forgotten Tower at the tip,
// then the north arm doubles back west to the Barren Highlands.
// v490: the dead-bog wedge between the arms is now the Great Black River -- a wide river through the middle of the
// whole marsh (west edge to east edge) that bends north near the tip. Its only crossing is one plank bridge just
// north of the Forgotten Tower door (BM_MID_BRIDGE_X), so the arms meet only there.
const BM_MID = 1900, BM_TIP_SPREAD = 1100, BM_MID_BRIDGE_X = 7000;
function bmTopY(x){ return BM_TIP_SPREAD*clamp(x/BM_W,0,1); }                       // outer north edge
function bmBotY(x){ return BM_H - BM_TIP_SPREAD*clamp(x/BM_W,0,1); }                // outer south edge
function bmMidHalf(x){ return 250 - 95*clamp(x/BM_W,0,1); }                         // half-width of the great river
function bmMidY(x){ const t = clamp((x-5200)/1800,0,1); return BM_MID + 110*Math.sin(x/760+0.6) + 45*Math.sin(x/290+1.3) - 260*t*t*(3-2*t); }
function bmWedgeHalf(x){ return bmMidHalf(x); }   // (kept for older callers: how far the middle band reaches from its centre line)
function bmMidGap(c){ return Math.abs(c-BM_MID_BRIDGE_X) < BM_SLICE*1.75; }        // 4 open slices = 160px bridge
function bmMidRiverAt(x, y){ const c = bmSliceC(x); return !bmMidGap(c) && Math.abs(y-bmMidY(c)) < bmMidHalf(c); }
function bmOpenAt(x, y, m){ m = m||0; if(x < m || x > BM_W-m || y < bmTopY(x)+m || y > bmBotY(x)-m) return false; return !(Math.abs(y-bmMidY(x)) < bmMidHalf(x)+m); }
function bmLowCenter(x){ return ((bmMidY(x) + bmMidHalf(x)) + bmBotY(x))/2; }
function bmLowHalf(x){ return (bmBotY(x) - (bmMidY(x) + bmMidHalf(x)))/2; }
function bmUpTrailY(x){ const top = bmTopY(x), bot = bmMidY(x) - bmMidHalf(x); return (top+bot)/2 + 110*Math.sin(x/520+1) * clamp(((bot-top)/2-200)/300, 0.2, 1); }
const BM_JOIN_X = BM_MID_BRIDGE_X;
const TOAD_SPLASH_R = 78;
const ARMORDON_TAIL_R = 72, RAPTOR_LEAP_R = 52;   // v490: armordon tail ring was 105 (shrunk with the body, then 20% more)
const RAPTOR_TELE_T = 0.7, RAPTOR_LEAP_RANGE = 240;   // v490: was 0.4s / 320 -- slower crouch, no leaps from off screen
const ARMORDON_REFLECT_PCT = 0.2, ARMORDON_REFLECT_CD = 0.8, ARMORDON_REFLECT_CAP_PCT = 0.05; // reflected share of a hit; per-reflect cooldown; cap as share of your max HP
const BM_RW = 90, BM_SLICE = 40, BM_TRAIL_OFF = 215, BM_TRAIL_HALFW = 46;
const BM_BRIDGES = [2400, 4720]; // slice boundaries; the two slices touching each are left open (80px plank bridge)
function bmRiverY(x){ const f = clamp((bmLowHalf(x)-300)/440, 0.15, 1); return bmLowCenter(x) + f*(280*Math.sin(x/650) + 90*Math.sin(x/240+2)); }
function bmSliceC(x){ return (Math.floor(x/BM_SLICE)+0.5)*BM_SLICE; }
function bmGap(c){ for(const b of BM_BRIDGES) if(Math.abs(c-b) < BM_SLICE*1.75) return true; /* (v147) 4 open slices = 160px bridge */ return false; }
function bmRiverAt(x,y){
  const c = bmSliceC(x);
  if(bmGap(c)) return false;
  return Math.abs(y-bmRiverY(c)) < BM_RW;
}
function bmOnPlank(x,y){
  const c = bmSliceC(x);
  if(bmMidGap(c) && Math.abs(y-bmMidY(c)) < bmMidHalf(c)+BM_SLICE*0.6) return true;   // v490: the tower bridge
  return bmGap(c) && Math.abs(y-bmRiverY(c)) < BM_RW+BM_SLICE*0.6;
}
// distance from a point to the trail (bank-following segments joined by the two vertical bridge legs)
function bmTrailDist(x,y){
  let best = 1e9;
  const segs = [[0,BM_BRIDGES[0],-1],[BM_BRIDGES[0],BM_BRIDGES[1],1],[BM_BRIDGES[1],BM_W,-1]];
  for(const s of segs){
    const cx = clamp(x,s[0],s[1]);
    best = Math.min(best, Math.hypot(x-cx, y-(bmRiverY(cx)+s[2]*BM_TRAIL_OFF)));
  }
  for(const b of BM_BRIDGES){
    const ya = bmRiverY(b)-BM_TRAIL_OFF, yb = bmRiverY(b)+BM_TRAIL_OFF;
    best = Math.min(best, Math.hypot(x-b, y-clamp(y,ya,yb)));
  }
  // the north arm's trail, and the climb joining the two arms near the tower
  { const cx = clamp(x, 0, BM_JOIN_X); best = Math.min(best, Math.hypot(x-cx, y-bmUpTrailY(cx))); }
  { const ya = bmUpTrailY(BM_JOIN_X), yb = bmTrailPt(BM_JOIN_X).y; best = Math.min(best, Math.hypot(x-BM_JOIN_X, y-clamp(y, Math.min(ya,yb), Math.max(ya,yb)))); }
  return best;
}
function bmTrailPt(x){ // trail centre on the bank it is following at x
  const s = x<BM_BRIDGES[0] ? -1 : x<BM_BRIDGES[1] ? 1 : -1;
  return {x, y:bmRiverY(x)+s*BM_TRAIL_OFF};
}
function bmWaterAt(room, x, y){
  if(bmRiverAt(x,y) || bmMidRiverAt(x,y)) return true;
  const ps = room.ponds;
  for(let i=0;i<ps.length;i++){ const q=ps[i]; if(x>q.x && x<q.x+q.w && y>q.y && y<q.y+q.h) return true; }
  return false;
}
function bmNearestDry(room, x, y){
  if(!bmWaterAt(room,x,y)) return {x,y};
  for(let r=20;r<=260;r+=20){
    for(let k=0;k<12;k++){
      const a = k*Math.PI/6, px = x+Math.cos(a)*r, py = y+Math.sin(a)*r;
      if(px>30 && py>30 && px<room.w-30 && py<room.h-30 && !bmWaterAt(room,px,py) && !bmWaterAt(room,px+22,py) && !bmWaterAt(room,px-22,py) && !bmWaterAt(room,px,py+22) && !bmWaterAt(room,px,py-22)) return {x:px,y:py};
    }
  }
  return {x,y};
}
const BM_LAND_TEMPLATES = [
  [['zombie',2,4]],
  [['zombie',2,3]],
  [['giantoad',1,2]],
  [['giantoad',1,2],['zombie',1,2]],
  [['poisonplant',2,3]],
  [['poisonplant',1,2],['zombie',1,2]],
  [['poisonplant',1,2],['giantoad',1,1]],
];
const BM_LAND_PACKS = 46;
function makeBlackMarsh(){
  const w = BM_W, h = BM_H;
  const obstacles = [];
  // river: one water rect per slice (bridge slices left open)
  for(let sx=0; sx<w; sx+=BM_SLICE){
    const c = sx+BM_SLICE/2;
    if(bmGap(c)) continue;
    const yc = bmRiverY(c);
    obstacles.push({x:sx, y:yc-BM_RW, w:BM_SLICE+1, h:BM_RW*2, isWater:true});
  }
  // v490: the great river through the middle, one slice per 40px; the bridge slices north of the tower stay open
  for(let sx=0; sx<w; sx+=BM_SLICE){
    const c = sx+BM_SLICE/2;
    if(bmMidGap(c)) continue;
    const yc = bmMidY(c), hh = bmMidHalf(c);
    obstacles.push({x:sx, y:yc-hh, w:BM_SLICE+1, h:hh*2, isWater:true, bmMid:true});
  }
  const westGate = {x:16, y:bmTrailPt(16).y, r:34};
  const eastGate = {x:w-16, y:bmTrailPt(w-16).y, r:34};
  const highGate = {x:16, y:bmUpTrailY(16), r:34};   // v459: the north arm's far end -- the road up into the Barren Highlands
  // (v262) the Marsh Pool: a sinkhole gate. v490: moved to the north edge of the north arm, east beyond the tower bridge
  const pgx = w-850;
  const poolGate = {x:pgx, y:bmTopY(pgx)+16, r:34};
  // the dead-bog outside the two arms: impassable slices (80px) along the outer edges (v490: the middle is the river now)
  for(let sx=0; sx<w; sx+=80){
    const x0 = sx, x1 = Math.min(w, sx+80);
    const top = Math.max(bmTopY(x0), bmTopY(x1)), bot = Math.min(bmBotY(x0), bmBotY(x1));
    if(top > 4) obstacles.push({x:x0, y:-400, w:x1-x0, h:top+400, bogVoid:true});
    if(bot < h-4) obstacles.push({x:x0, y:bot, w:x1-x0, h:h-bot+400, bogVoid:true});
  }
  // witch's house just inside the entrance, north of the trail; cauldron out front; waypoint beside it
  const hx = 600, hy = bmTrailPt(hx).y - 205;
  const house = {x:hx, y:hy, w:150, h:104};
  const houseRect = {x:hx-75, y:hy-52, w:150, h:104, isKeep:true};
  const cauldron = {x:hx+30, y:hy+52+52, r:20};
  const cauRect = {x:cauldron.x-16, y:cauldron.y-12, w:32, h:24, isKeep:true};
  const waypoint = {x:hx+200, y:hy+92, r:22};
  obstacles.push(houseRect, cauRect);
  // v456: goblin barricades in an arc before the Forgotten Tower, with a gap where the trail runs through
  const barricades = [];
  for(let a=Math.PI*0.62; a<=Math.PI*1.38; a+=0.13){
    const bx = eastGate.x + Math.cos(a)*330, by = eastGate.y + Math.sin(a)*330;
    if(Math.abs(by - bmTrailPt(bx).y) < 70) continue;
    if(by < eastGate.y && Math.abs(bx - BM_MID_BRIDGE_X) < 110) continue;   // v490: the path down from the tower bridge
    if(bmMidRiverAt(bx,by) || bmMidRiverAt(bx-30,by) || bmMidRiverAt(bx+30,by) || !bmOpenAt(bx,by,20)) continue;
    const o = {x:Math.round(bx-30), y:Math.round(by-14), w:60, h:28, woodBarricade:true};
    barricades.push(o); obstacles.push(o);
  }
  const room = { w, h, obstacles, ponds:[], westGate, eastGate, highGate, poolGate, house, cauldron, waypoint, barricades, arrow:true };
  // stagnant ponds (blocked like water), kept off the trail, gates, house area and river
  const ponds = [];
  let tries = 0;
  while(ponds.length < 30 && tries < 1600){
    tries++;
    const pw = rand(150,320), ph = rand(90,190);
    const px = rand(500, w-500), py = rand(80, h-80-ph);
    const cx = px+pw/2, cy = py+ph/2;
    if(!bmOpenAt(px,py,40) || !bmOpenAt(px+pw,py+ph,40) || !bmOpenAt(px+pw,py,40) || !bmOpenAt(px,py+ph,40)) continue;
    if(dist({x:cx,y:cy}, highGate) < 420) continue;
    const rc = bmRiverY(cx);
    if(Math.abs(cy-rc) < BM_RW+ph/2+70) continue;
    if(Math.abs(cy-bmMidY(cx)) < bmMidHalf(cx)+ph/2+90) continue;   // v490: off the great river's banks
    if(Math.abs(cx-BM_MID_BRIDGE_X) < 380 && cy < eastGate.y) continue;
    if(bmTrailDist(cx,cy) < 110+Math.max(pw,ph)/2*0.7) continue;
    if(dist({x:cx,y:cy}, house) < 340 || dist({x:cx,y:cy}, waypoint) < 260) continue;
    if(dist({x:cx,y:cy}, eastGate) < 420) continue;
    if(dist({x:cx,y:cy}, poolGate) < 420) continue;
    if(ponds.some(q=>dist({x:cx,y:cy},{x:q.x+q.w/2,y:q.y+q.h/2}) < 380)) continue;
    // don't bury either bridge approach
    if(BM_BRIDGES.some(b=>Math.abs(cx-b) < 330)) continue;
    ponds.push({x:px, y:py, w:pw, h:ph});
  }
  for(const q of ponds){ q.isWater = true; obstacles.push(q); }
  room.ponds = ponds;
  room.dryObstacles = obstacles.filter(o=>!o.isWater);
  room.waterAt = (x,y)=>bmWaterAt(room,x,y);
  room.nearestDry = (x,y)=>bmNearestDry(room,x,y);
  const dryOK = (x,y,m)=> !bmWaterAt(room,x,y) && !bmWaterAt(room,x+m,y) && !bmWaterAt(room,x-m,y) && !bmWaterAt(room,x,y+m) && !bmWaterAt(room,x,y-m);
  const clearOfBuildings = (x,y,m)=> !houseRect.x || !(x>houseRect.x-m && x<houseRect.x+houseRect.w+m && y>houseRect.y-m && y<houseRect.y+houseRect.h+m);
  room.dryOK = (x,y,m)=> bmOpenAt(x,y,m||0) && dryOK(x,y,m);
  room.safe = [[westGate,420],[house,270],[waypoint,240],[cauldron,220],[highGate,420]];
  room.isSafe = (x,y)=> room.safe.some(sf=>dist({x,y},sf[0])<sf[1]);
  // decor
  const trees = [];
  // v456: a thick wall of swamp trees along every edge (three rows, the outer two beyond the walkable ground) so the border reads as impassable
  { const gaps = [westGate, eastGate, poolGate, highGate];
    const gapOK = (x,y)=>!gaps.some(q=>Math.hypot(x-q.x, y-q.y) < 200);
    for(const [off, sp, sc] of [[30, 85, [0.95,1.3]], [-70, 95, [1.05,1.45]], [-170, 120, [1.1,1.6]]]){
      for(let x=20; x<w; x+=sp){
        const jx = x+rand(-14,14);
        const yt = bmTopY(jx)+off, yb = bmBotY(jx)-off;
        if(gapOK(jx,yt)) trees.push({x:jx, y:yt+rand(-14,14), s:rand(sc[0],sc[1])});
        if(gapOK(jx,yb)) trees.push({x:jx, y:yb+rand(-14,14), s:rand(sc[0],sc[1])});
      }
      for(let y=20; y<h; y+=sp){ if(bmOpenAt(30,y,0) && gapOK(16,y)) trees.push({x:off>0?30:off+10, y:y+rand(-14,14), s:rand(sc[0],sc[1])}); if(bmOpenAt(w-30,y,0) && gapOK(w-16,y)) trees.push({x:w-(off>0?30:off+10), y:y+rand(-14,14), s:rand(sc[0],sc[1])}); }
    }
  }
  for(let i=0;i<300;i++){
    const x = rand(120,w-120), y = rand(100,h-100);
    if(!bmOpenAt(x,y,60) || !dryOK(x,y,26) || bmTrailDist(x,y) < 70 || !clearOfBuildings(x,y,50)) continue;
    if(dist({x,y},waypoint) < 90 || dist({x,y},cauldron) < 90) continue;
    if(Math.abs(x-BM_MID_BRIDGE_X) < 200 && Math.abs(y-bmMidY(x)) < bmMidHalf(x)+220) continue;   // v490: keep the bridge ends clear
    trees.push({x, y, s:rand(0.8,1.3)});
  }
  const reeds = [];
  for(let i=0;i<840;i++){
    const x = rand(60,w-60), y = rand(60,h-60);
    if(!bmOpenAt(x,y,30)) continue;
    const nearWater = bmWaterAt(room,x+34,y)||bmWaterAt(room,x-34,y)||bmWaterAt(room,x,y+34)||bmWaterAt(room,x,y-34);
    if(!nearWater && Math.random()<0.8) continue;
    if(bmWaterAt(room,x,y) || bmTrailDist(x,y) < 40 || !clearOfBuildings(x,y,30)) continue;
    reeds.push({x, y, s:rand(0.7,1.25)});
  }
  room.trees = trees; room.reeds = reeds;
  // pack anchors -- land
  const anchors = [];
  tries = 0;
  while(anchors.length < Math.round(BM_LAND_PACKS*1.6) && tries < 12000){
    tries++;
    const x = rand(300,w-300), y = rand(140,h-140);
    if(!bmOpenAt(x,y,110) || !dryOK(x,y,40) || !clearOfBuildings(x,y,80)) continue;
    if(dist({x,y},highGate) < 480) continue;
    if(dist({x,y},westGate) < 480 || dist({x,y},house) < 300 || dist({x,y},waypoint) < 280 || dist({x,y},eastGate) < 320 || dist({x,y},poolGate) < 380) continue;
    if(anchors.some(a=>dist(a,{x,y}) < 300)) continue;
    anchors.push({x,y});
  }
  room.landAnchors = anchors;
  // water anchors -- along the river and in the ponds
  const wet = [];
  for(let x=1000; x<w-500; x+=520){
    const xx = x+rand(-120,120);
    if(BM_BRIDGES.some(b=>Math.abs(xx-b)<170)) continue;
    wet.push({x:xx, y:bmRiverY(bmSliceC(xx))+rand(-40,40), kind:'river'});
  }
  for(const q of ponds) wet.push({x:q.x+q.w/2, y:q.y+q.h/2, kind:'pond', pw:q.w, ph:q.h});
  room.wetAnchors = wet;
  room.entranceSpot = {x:westGate.x+90, y:westGate.y};
  room.highSpot = {x:highGate.x+90, y:highGate.y};
  return room;
}
function spawnBlackMarshPack(g, tpl, a, room){
  for(const [type,mn,mx] of tpl){
    const n = mn + Math.floor(Math.random()*(mx-mn+1));
    const spread = type==='poisonplant' ? 90 : 90+n*16;
    for(let i=0;i<n;i++){
      for(let t=0;t<14;t++){
        const x = a.x+rand(-spread,spread), y = a.y+rand(-spread,spread);
        if(x<60||y<60||x>room.w-60||y>room.h-60) continue;
        if(!room.dryOK(x,y,22) || room.isSafe(x,y)) continue;
        if(x>room.house.x-110 && x<room.house.x+110 && y>room.house.y-90 && y<room.house.y+90) continue;
        spawnEnemy(g, type, {x,y}); break;
      }
    }
  }
}
function spawnBlackMarshWet(g, a, room){
  const swimmerPick = ()=> Math.random()<0.5 ? 'alligator' : 'anaconda';
  let types;
  if(a.kind==='river'){
    const gators = 1+Math.floor(Math.random()*2), snakes = 1+Math.floor(Math.random()*2);
    types = [];
    for(let i=0;i<gators;i++) types.push('alligator');
    for(let i=0;i<snakes;i++) types.push('anaconda');
  } else {
    types = Math.random()<0.55 ? ['anaconda','anaconda'] : [swimmerPick()];
  }
  for(const type of types){
    for(let t=0;t<14;t++){
      const x = a.kind==='pond' ? a.x+rand(-a.pw*0.35,a.pw*0.35) : a.x+rand(-110,110);
      const y = a.kind==='pond' ? a.y+rand(-a.ph*0.3,a.ph*0.3) : bmRiverY(bmSliceC(x))+rand(-BM_RW*0.6,BM_RW*0.6);
      if(!bmWaterAt(room,x,y) || room.isSafe(x,y)) continue;
      spawnEnemy(g, type, {x,y}); break;
    }
  }
}
function enterBlackMarsh(opts){
  opts = opts || {};
  const g = game;
  g.scene = 'blackmarsh';
  g.bm = makeBlackMarsh();
  g.room = g.bm;
  g.depth = BM_DEPTH;
  if(opts.atWaypoint){
    g.player.x = g.bm.waypoint.x; g.player.y = g.bm.waypoint.y + 40;
  } else if(opts.fromPool){
    g.player.x = g.bm.poolGate.x; g.player.y = g.bm.poolGate.y + 95;   // v490: the gate is on the north edge now
  } else if(opts.fromTower){
    g.player.x = g.bm.eastGate.x - 90; g.player.y = g.bm.eastGate.y;
  } else if(opts.fromHighlands){
    g.player.x = g.bm.highGate.x + 90; g.player.y = g.bm.highGate.y;
  } else {
    g.player.x = g.bm.westGate.x + 90; g.player.y = g.bm.westGate.y;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Black Marsh', 1.6);
  const room = g.bm;
  for(const a of shuffle(room.landAnchors.slice())){
    spawnBlackMarshPack(g, BM_LAND_TEMPLATES[Math.floor(Math.random()*BM_LAND_TEMPLATES.length)], a, room);
  }
  for(const a of room.wetAnchors) spawnBlackMarshWet(g, a, room);
  // v456: goblin archers posted behind the barricades
  for(let k=0;k<6;k++){ const a = Math.PI*0.68 + k*0.13; let x = room.eastGate.x + Math.cos(a)*215, y = room.eastGate.y + Math.sin(a)*215; if(!room.dryOK(x,y,24)){ const d = bmNearestDry(room, x, y); x = d.x; y = d.y; } if(!room.dryOK(x,y,20)) continue; const e = spawnEnemy(g, 'goblinarcher', {x, y}); if(e){ e.wanderRadius = 0; e.leashRange = 260; } }   // v490: never in the river
  for(let k=0;k<2;k++){ const e = spawnEnemy(g, 'goblin', {x:room.eastGate.x-170, y:room.eastGate.y+(k?60:-60)}); if(e) e.wanderRadius = 20; }
  // (v262) the Leviathan now lives in the Marsh Pool (see enterMarshPool)
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
