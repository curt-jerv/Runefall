// ---------------- Leviathans (v128) ----------------
// One state machine for every water boss: the Kraken (Sunken Depths, Breach), the Marsh Leviathan (Black Marsh river,
// e.marsh) and the Marsh Pool / Breach Leviathans (free-swimming pools, e.cfg). (v530: the old Lakeside Ruins bridge
// leviathans are gone -- nothing lives in that lake any more.)
// Loop: Poison Volley -> Surge (telegraphed slam) -> Volley -> Dive
// (invulnerable, re-emerges with a big telegraphed slam, then is Exposed: +25% damage taken).
const LV_LANE = 190, LV_R = 70, LV_HP_MULT = 20, LV_DMG_MULT = 2.6;
const LV_VOLLEY_TELE = 0.7, LV_SURGE_TELE = 1.1, LV_SURGE_R = 95, LV_DIVE_T = 1.4, LV_EMERGE_TELE = 0.9, LV_EMERGE_R = 110, LV_EXPOSED_T = 2.4;
const KR_STRIKE_T = 1.15, KR_STRIKE_R = 62, KR_STRIKE_DMG = 0.945, KR_DMG_TUNE = 0.72;   // v206/v212: Kraken hits softened (~-20%, then another -10%)
function spawnLeviathanBoss(g, pos, cfg){
  // v489: bosses come back on every visit (was: the Kraken stays dead)
  const e = spawnEnemy(g, 'leviathan', pos);
  if(cfg) e.cfg = cfg;
  e.kraken = true; e.dmgType = 'lightning'; e.krStrikes = [];
  e.lvBoss = true; e.isLairBoss = true; e.bossName = 'The Kraken';
  e.r = LV_R; e.hp = Math.round(e.hp/3*LV_HP_MULT); e.maxHp = e.hp; e.dmg = e.dmg*LV_DMG_MULT*KR_DMG_TUNE; e.atkCdMax = 1.6; e.armor = 6;
  e.lvState = 'idle'; e.lvT = 0; e.lvCd = 2.0; e.lvIdx = 0; e.lvSide = -1; e.lvSpeed = 230; e.exposedT = 0; e.lvPt = null; e.lvSpoke = false;
  return e;
}
function spawnMarshLeviathan(g, room){
  if(g.player && (g.player.leviathanSlain || g.player.partLeviathan)) return null;   // (v244) the Leviathan stays dead
  const x = BM_BRIDGES[0]-520, y = bmRiverY(bmSliceC(x));
  const e = spawnEnemy(g, 'leviathan', {x, y});
  e.marsh = true; e.lvBoss = true; e.isLairBoss = true; e.bossName = 'The Marsh Leviathan';
  e.r = LV_R/2; e.hp = Math.round(e.hp/3*LV_HP_MULT); e.maxHp = e.hp; e.dmg = e.dmg*LV_DMG_MULT; e.atkCdMax = 1.6; e.armor = 6;
  e.lvState = 'idle'; e.lvT = 0; e.lvCd = 2.0; e.lvIdx = 0; e.lvSide = -1; e.lvSpeed = 230; e.exposedT = 0; e.lvPt = null; e.lvSpoke = false;
  return e;
}
function spawnSunkenKraken(g){
  // v456: free-swimming in the great pool (it circles the island instead of patrolling a bridge)
  return spawnLeviathanBoss(g, {x:SKP.cx+260, y:SKP.cy}, {free:true, bounds:[SKP.cx-SKP.rx+90, SKP.cx+SKP.rx-90], y0:SKP.cy-SKP.ry+80, y1:SKP.cy+SKP.ry-80, cx:SKP.cx+240, cy:SKP.cy});
}
const LV_LAND_SPEED = 130;   // v521: about a skeleton's walking pace
function spawnPoolLeviathan(g){
  const e = spawnEnemy(g, 'leviathan', {x:POOL_CX-POOL_RX+260, y:POOL_CY});
  e.cfg = {free:true, bounds:[POOL_CX-POOL_RX+80, POOL_CX+POOL_RX-80], y0:POOL_CY-POOL_RY+80, y1:POOL_CY+POOL_RY-80, cx:POOL_CX, cy:POOL_CY};
  e.pool = true; e.lvBoss = true; e.isLairBoss = true; e.bossName = 'The Leviathan';
  e.r = Math.round(LV_R*0.7); e.hp = Math.round(e.hp/3*LV_HP_MULT); e.maxHp = e.hp; e.dmg = e.dmg*LV_DMG_MULT; e.atkCdMax = 1.6; e.armor = 6;
  e.lvState = 'idle'; e.lvT = 0; e.lvCd = 2.0; e.lvIdx = 0; e.lvSide = -1; e.lvSpeed = 230; e.exposedT = 0; e.lvPt = null; e.lvSpoke = false;
  return e;
}
// free-swimming pool: pull a point toward the pool's centre until it is open water
function lvPoolPt(e, x, y){
  const c = e.cfg, rm = game.room;
  for(let k=0;k<=24;k++){
    const f = k/24, px = x+(c.cx-x)*f, py = y+(c.cy-y)*f;
    if(rm.waterAt(px,py) && rm.waterAt(px+34,py) && rm.waterAt(px-34,py) && rm.waterAt(px,py+34) && rm.waterAt(px,py-34)) return {x:px,y:py};
  }
  return {x:c.cx, y:c.cy};
}
// v521: where the pool leviathan climbs ashore: follow the line from the pool's centre toward the player to the water's edge, plus a little
function lvShorePt(e, tx, ty){
  const c = e.cfg, rm = game.room, a = Math.atan2(ty-c.cy, tx-c.cx), ux = Math.cos(a), uy = Math.sin(a);
  let r = 0; while(r<2200 && rm.waterAt(c.cx+ux*r, c.cy+uy*r)) r += 20;
  return {x:c.cx+ux*(r+90), y:c.cy+uy*(r+90)};
}
function lvHomeY(e, x){
  if(e.cfg) return e.cfg.cy + e.lvSide*LV_LANE;
  return bmRiverY(bmSliceC(x)) + e.lvSide*32;   // the Marsh Leviathan
}
function lvBounds(e){
  if(e && e.cfg) return e.cfg.bounds;
  return [BM_BRIDGES[0]-1100, BM_BRIDGES[0]+1100];   // the Marsh Leviathan
}
function lvHit(g, e, cx, cy, R, mult, kb){
  const p = g.player;
  if(dist({x:cx,y:cy}, p) < R){   // v521: exactly the drawn ring (it used to add the player's radius on top)
    let k = null;
    if(kb){ const a = Math.atan2(p.y-cy, p.x-cx); k = {x:Math.cos(a)*kb, y:Math.sin(a)*kb}; }
    playerDamage(g, e.dmg*mult, e, k);
  }
  if(g.followers) for(const f of g.followers) if(dist({x:cx,y:cy}, f) < R) applyFollowerDamage(g, f, e.dmg*mult, e);
}
function updateLeviathanBoss(g, e, dt, target, d, room){
  const p = g.player;
  e.moving = false;
  if(e.exposedT>0) e.exposedT -= dt;
  if(e.invulnT>0){ e.invulnT -= dt; if(e.hp<e.guardHp) e.hp = e.guardHp; }
  const wasActive = e.active;
  e.active = d < oneScreenDist();
  if(!e.active) return;
  if(!wasActive && !e.lvSpoke){ e.lvSpoke = true; showMsg(e.kraken ? 'The Kraken rises!' : (e.pool ? 'The Leviathan rises!' : 'The Marsh Leviathan rises!'), 2.0, e.kraken ? '#9fd8ff' : undefined); }
  const enraged = e.hp/e.maxHp < 0.4;
  if(e.kraken && e.krStrikes){
    for(let i=e.krStrikes.length-1;i>=0;i--){
      const k = e.krStrikes[i]; k.t -= dt;
      if(k.t<=0){
        lvHit(g, e, k.x, k.y, KR_STRIKE_R, KR_STRIKE_DMG, 60);
        g.particles.push({type:'burst', x:k.x, y:k.y, t:0.35, max:0.35, color:'#fff2a0'});
        g.particles.push({type:'ring', x:k.x, y:k.y, t:0.4, max:0.4, r:KR_STRIKE_R, color:'#ffe046'});
        shakeScreen(g, 2, 0.1);
        e.krStrikes.splice(i,1);
      }
    }
  }
  const face = ()=>{ const a=Math.atan2(target.y-e.y, target.x-e.x); e.facing={x:Math.cos(a),y:Math.sin(a)}; e.faceSign=screenFacingSign(e.facing.x,e.facing.y); return a; };
  // swim: follow the target along its water, hugging the near shore
  const swim = ()=>{
    const [lo,hi] = lvBounds(e);
    let tx = clamp(target.x, lo, hi), ty;
    if(e.cfg && e.cfg.free){ const pt = lvPoolPt(e, tx, clamp(target.y, e.cfg.y0, e.cfg.y1)); tx = pt.x; ty = pt.y; }
    else ty = lvHomeY(e, e.x);
    const dx = tx-e.x, dy = ty-e.y;
    const sp = e.lvSpeed*(enraged?1.2:1);
    if(Math.abs(dx)>4){ e.x += Math.sign(dx)*Math.min(Math.abs(dx), sp*dt); e.moving = true; }
    if(Math.abs(dy)>4){ e.y += Math.sign(dy)*Math.min(Math.abs(dy), (e.cfg&&e.cfg.free?230:160)*dt); }
  };
  // v521 Marsh Pool Leviathan: at 75% life it hauls itself out of the pool and fights on the shore (skeleton-speed walk);
  // at 25% it plods back into the water and finishes the fight there.
  if(e.pool){
    const fr = e.hp/e.maxHp;
    if(!e.lvBeached && fr<=0.75 && e.lvState==='idle'){ e.lvBeached = true; e.lvState = 'beach'; e.lvShore = lvShorePt(e, target.x, target.y); showMsg('The Leviathan heaves itself out of the pool!', 2.4, '#b6ff7a'); }
    else if(e.onLand && !e.lvReturned && fr<=0.25 && (e.lvState==='land' || e.lvState==='volleyTele' || e.lvState==='surgeTele')){ e.lvReturned = true; e.lvState = 'retreat'; e.windT = 0; showMsg('The Leviathan retreats into the pool!', 2.4, '#b6ff7a'); }
  }
  const st = e.lvState;
  if(st==='beach'){
    face(); const sp = 150, dx = e.lvShore.x-e.x, dy = e.lvShore.y-e.y, dd = Math.hypot(dx,dy);
    if(dd>8){ e.x += dx/dd*Math.min(dd,sp*dt); e.y += dy/dd*Math.min(dd,sp*dt); e.moving = true; }
    else { e.onLand = true; e.lvState = 'exposed'; e.lvT = 1.4; e.exposedT = 1.4; e.lvCd = 1.2; }
  } else if(st==='land'){
    face(); const reach = e.r+target.r+26;
    e.lvCd -= dt;
    if(tickEnemyWindup(g, e, target, target!==p, reach, dt)){
      // mid bite
    } else if(e.lvCd<=0 && d<420){
      e.windT = 0; e.lvIdx = (e.lvIdx||0)+1;
      if(e.lvIdx%3===0){ e.lvState = 'volleyTele'; e.lvT = LV_VOLLEY_TELE; }
      else { e.lvState = 'surgeTele'; e.lvT = LV_SURGE_TELE; e.lvPt = {x:target.x, y:target.y}; }
    } else if(d>reach){
      const ang = steerAngleTo(e, target.x, target.y, room.obstacles);
      e.x += Math.cos(ang)*LV_LAND_SPEED*dt; e.y += Math.sin(ang)*LV_LAND_SPEED*dt; e.moving = true;
      pushOutOfObstacles(e, room.obstacles); e.x = clamp(e.x, e.r, room.w-e.r); e.y = clamp(e.y, e.r, room.h-e.r);
    } else if(e.atkCd<=0) beginEnemyMelee(e);
  } else if(st==='retreat'){
    e.invulnT = 1; e.guardHp = e.hp; e.moving = true;
    const c = e.cfg, dx = c.cx-e.x, dy = c.cy-e.y, dd = Math.hypot(dx,dy);
    e.x += dx/dd*160*dt; e.y += dy/dd*160*dt;
    e.facing = {x:dx/dd, y:dy/dd}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y);
    if(room.waterAt(e.x,e.y) && room.waterAt(e.x+34,e.y) && room.waterAt(e.x-34,e.y)){ e.onLand = false; e.invulnT = 0; e.lvState = 'idle'; e.lvCd = 1.2; }
  } else if(st==='idle'){
    swim();
    face();
    if(tickEnemyWindup(g, e, target, target!==p, e.r+target.r+30, dt)) return;
    if(d < e.r+target.r+30 && e.atkCd<=0) beginEnemyMelee(e);
    e.lvCd -= dt;
    if(e.lvCd<=0){
      const pat = (e.kraken ? ['volley','storm','surge','volley','storm','dive'] : ['volley','surge','volley','dive'])[e.lvIdx++%(e.kraken?6:4)];
      e.windT = 0;
      if(pat==='storm'){
        // Kraken: Storm Surge -- a scatter of telegraphed lightning strikes around (and on) the target
        const n = enraged ? 6 : 4;
        for(let i=0;i<n;i++){ const a = Math.random()*Math.PI*2, r0 = i===0 ? 0 : rand(60,200);
          e.krStrikes.push({x:target.x+Math.cos(a)*r0, y:target.y+Math.sin(a)*r0, t:KR_STRIKE_T+i*0.12, max:KR_STRIKE_T+i*0.12}); }
        showMsg('Storm Surge!', 0.9, '#9fd8ff');
        e.lvCd = enraged ? 1.2 : 1.8;
      }
      else if(pat==='volley'){ e.lvState='volleyTele'; e.lvT=LV_VOLLEY_TELE; }
      else if(pat==='surge'){ e.lvState='surgeTele'; e.lvT=LV_SURGE_TELE; e.lvPt={x:target.x, y:target.y}; }
      else { e.lvState='dive'; e.lvT=LV_DIVE_T; e.invulnT=LV_DIVE_T; e.guardHp=e.hp; }
    }
  } else if(st==='volleyTele'){
    e.lvT -= dt; face(); e.atkAnimT = 0.1;
    if(e.lvT<=0){
      const a = face(), n = enraged ? 5 : 3;
      for(let i=0;i<n;i++){
        const aa = a + (i-(n-1)/2)*0.22;
        if(e.kraken) g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(aa)*250,vy:Math.sin(aa)*250,r:9,dmg:e.dmg*0.6,from:'enemy',life:2.6,color:'#8fd0ff',srcEnemy:e,targetRef:target});
        else g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(aa)*210,vy:Math.sin(aa)*210,r:9,dmg:e.dmg*0.6,from:'enemy',life:2.6,color:'#7dd45a',srcEnemy:e,targetRef:target,isPoisonBall:true});
      }
      e.lvState = e.onLand ? 'land' : 'idle'; e.lvCd = enraged ? 1.1 : 1.7;
    }
  } else if(st==='surgeTele'){
    e.lvT -= dt; face(); e.atkAnimT = 0.1;
    // lunge toward the marked spot while charging up
    if(!e.onLand){ const [lo,hi] = lvBounds(e); e.x += clamp(e.lvPt.x-e.x,-90*dt,90*dt); e.x = clamp(e.x,lo,hi); }
    if(e.lvT<=0){
      lvHit(g, e, e.lvPt.x, e.lvPt.y, LV_SURGE_R, 1.5, 100);
      g.particles.push({type:'ring', x:e.lvPt.x, y:e.lvPt.y, t:0.5, max:0.5, r:LV_SURGE_R, color:e.kraken?'#ffe046':'#7dd45a'});
      g.particles.push({type:'burst', x:e.lvPt.x, y:e.lvPt.y, t:0.4, max:0.4, color:e.kraken?'#fff2a0':'#7dd45a'});
      e.lvState = e.onLand ? 'land' : 'idle'; e.lvCd = enraged ? 1.1 : 1.8; e.exposedT = Math.max(e.exposedT, 0.8);
    }
  } else if(st==='dive'){
    e.lvT -= dt; e.sub = true;
    if(e.lvT<=0){
      // resurface on the player's side, opposite lane, right under them
      e.lvSide = -e.lvSide;
      const [lo,hi] = lvBounds(e);
      e.x = clamp(target.x, lo, hi); e.y = lvHomeY(e, e.x);
      if(e.cfg && e.cfg.free){ const pt = lvPoolPt(e, e.x, clamp(target.y, e.cfg.y0, e.cfg.y1)); e.x = pt.x; e.y = pt.y; }
      e.lvPt = {x:target.x, y:target.y}; e.sub = false;
      e.lvState='emergeTele'; e.lvT=LV_EMERGE_TELE; e.invulnT = 0;
    }
  } else if(st==='emergeTele'){
    e.lvT -= dt; face(); e.atkAnimT = 0.1;
    if(e.lvT<=0){
      lvHit(g, e, e.lvPt.x, e.lvPt.y, LV_EMERGE_R, 1.6, 120);
      g.particles.push({type:'ring', x:e.lvPt.x, y:e.lvPt.y, t:0.6, max:0.6, r:LV_EMERGE_R, color:e.kraken?'#ffe046':'#b6ff7a'});
      if(e.kraken) g.particles.push({type:'burst', x:e.lvPt.x, y:e.lvPt.y, t:0.5, max:0.5, color:'#fff2a0'});
      e.lvState='exposed'; e.lvT=LV_EXPOSED_T; e.exposedT = LV_EXPOSED_T;
      showMsg(e.kraken ? 'The Kraken is overcharged!' : 'The Leviathan is exposed!', 1.2);
    }
  } else { // exposed: it's stunned and open to attack
    e.lvT -= dt; face();
    if(e.lvT<=0){ e.lvState = e.onLand ? 'land' : 'idle'; e.lvCd = enraged ? 1.2 : 1.8; }
  }
}
// v207: the Kraken's ground warnings are yellow and crackle with lightning (Marsh Leviathan stays green).
// Draws jagged bolts from the centre out to the rim of a circle of radius Rpx (already in the flattened iso ground plane).
function drawZapBolts(Rpx, frac, seed){
  const t = (game&&game.clock)||0, n = 7;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for(let b=0;b<n;b++){
    const a = b*(Math.PI*2/n) + seed*1.7 + Math.floor(t*14+b)*0.35;
    const len = Rpx*(0.55+0.45*frac), segs = 5;
    const path = [];
    for(let k=0;k<=segs;k++){
      const r = len*k/segs, jit = k===0 ? 0 : (((Math.sin(t*41+b*7.3+k*5.1+seed)*43758.5453)%1+1)%1-0.5)*Rpx*0.22;
      path.push([Math.cos(a)*r - Math.sin(a)*jit, Math.sin(a)*r + Math.cos(a)*jit]);
    }
    ctx.strokeStyle = 'rgba(255,240,140,'+(0.35+0.5*frac)+')'; ctx.lineWidth = 3.4;
    ctx.beginPath(); path.forEach((q,k)=>k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,230,'+(0.5+0.5*frac)+')'; ctx.lineWidth = 1.3;
    ctx.beginPath(); path.forEach((q,k)=>k?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1])); ctx.stroke();
  }
  ctx.restore();
}
function drawLeviathanTelegraph(e){
  if(e.kraken && e.krStrikes){
    for(const k of e.krStrikes){
      const f = clamp(1-k.t/k.max,0,1), iso = toIso(k.x,k.y), Rpx = KR_STRIKE_R*ISO_KX*Math.SQRT2;
      ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
      ctx.strokeStyle='rgba(255,224,70,'+(0.55+f*0.45)+')'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(0,0,Rpx,0,7); ctx.stroke();
      ctx.fillStyle='rgba(255,214,60,'+(0.10+f*0.30)+')'; ctx.beginPath(); ctx.arc(0,0,Rpx*f,0,7); ctx.fill();
      drawZapBolts(Rpx, f, k.x*0.013+k.y*0.007);
      ctx.restore();
    }
  }
  let R=0, frac=0, pt=e.lvPt, col=e.kraken?'255,222,70':'125,212,90';
  if(e.lvState==='surgeTele'){ R=LV_SURGE_R; frac=clamp(1-e.lvT/LV_SURGE_TELE,0,1); }
  else if(e.lvState==='emergeTele'){ R=LV_EMERGE_R; frac=clamp(1-e.lvT/LV_EMERGE_TELE,0,1); if(!e.kraken) col='182,255,122'; }
  else return;
  if(!pt) return;
  const iso = toIso(pt.x, pt.y);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX);
  ctx.strokeStyle='rgba('+col+','+(0.5+frac*0.5)+')'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2,0,7); ctx.stroke();
  ctx.fillStyle='rgba('+col+','+(0.10+frac*0.28)+')';
  ctx.beginPath(); ctx.arc(0,0,R*ISO_KX*Math.SQRT2*frac,0,7); ctx.fill();
  if(e.kraken) drawZapBolts(R*ISO_KX*Math.SQRT2, frac, pt.x*0.011);
  ctx.restore();
}
function spawnLakesidePack(g, anchor, template){
  const t = template || LAKE_PACK_TEMPLATES[Math.floor(Math.random()*LAKE_PACK_TEMPLATES.length)];
  const n = forestPackSize(t);
  const spread = 100 + n*18;
  for(let i=0;i<n;i++){
    spawnEnemy(g, t.type, {x:anchor.x+rand(-spread,spread), y:anchor.y+rand(-spread,spread)});
  }
}
function enterLakesideRuins(opts){
  opts = opts || {};
  const g = game;
  g.scene = 'lakesideruins';
  // Waypoint rework: reachedLakesideRuins is no longer set on mere zone
  // entry -- it's now set when the player walks up to this zone's own
  // waypoint marker (see the nearLakeWaypoint proximity check in update(),
  // which calls discoverWaypoint).
  g.lake = makeLakesideRuins();
  g.room = g.lake;
  if(g.player.ruinsEvent===2) g.player.ruinsEvent = 1;   // an interrupted deciphering starts over
  // Fixed area level (static difficulty)
  g.depth = 21; // (v148) region level ladder: Sunlit 12 < Lighthouse 13-15 < Cemetery 17 < Crypt 19 < Lakeside 21 < Ruins 23-27 < Marsh 28 < Mountain Pass 30
  // Waypoint rework: teleporting in via the Teleport menu (opts.atWaypoint)
  // lands the player AT this zone's own waypoint marker, not the generic
  // gate entrance -- see openTeleportMenu's teleportLakesideBtn.
  if(opts.fromMarsh){
    g.player.x = g.lake.marshGate.x - 90; g.player.y = g.lake.marshGate.y;
  } else if(opts.fromSunken){
    g.player.x = g.lake.sunkenGate.x; g.player.y = g.lake.sunkenGate.y + 90;
  } else if(opts.fromRuins){
    g.player.x = g.lake.ruinsSpot.x; g.player.y = g.lake.ruinsSpot.y + 85;
  } else if(opts.atWaypoint){
    g.player.x = g.lake.waypoint.x; g.player.y = g.lake.waypoint.y + 40;
  } else {
    // Arrives just east of the west entrance gate, same "beside the gate
    // you came from" convention every other zone transition follows.
    g.player.x = g.lake.sunlitGate.x + 90; g.player.y = g.lake.sunlitGate.y;
  }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  showMsg('Lakeside Ruins', 1.4);
  // Same pack-anchor/pool-density approach as Withered Crossroads' own
  // population (see LAKE_PACK_ANCHOR_TARGET/LAKE_PACK_COUNT above).
  const anchors = shuffle(breatheAnchors(g.lake.packAnchors, {gap:380}));
  const count = Math.min(LAKE_PACK_COUNT, anchors.length);
  for(let i=0;i<count;i++){
    spawnLakesidePack(g, anchors[i]);
  }
  // v456: Treants lurk in the groves (Primal Heartwood)
  if(g.lake.groves) for(const gv of g.lake.groves){
    const n = Math.random()<0.4 ? 2 : 1;
    for(let k=0;k<n;k++){ const e = spawnEnemy(g, 'treant', {x:gv.x+rand(-60,60), y:gv.y+rand(-50,50)}); if(e){ e.r = 30; e.wanderRadius = 60; e.leashRange = 520; } }
  }
  // Leviathans: hidden-until-proximity, spawned directly at their own
  // fixed spots inside the water rather than through the pack system above.
  // (v128) One unique Bridge Leviathan boss guards the west bridge span, plus a single
  // regular leviathan lurking off the east span (the other two were dropped).
  // (v262) the Kraken now lives in the Sunken Depths (see enterSunkenDepths)
  // A one-off reward chest at the island's Stonehenge -- a judgment call
  // (the brief left this optional): a payoff for making the trip across
  // the bridge, using the same 70%-item/30%-gold chest logic every other
  // chest in the game already uses (see this scene's own inline chest-open
  // check in the main update loop).
  g.chest = null; // (v147) island chest removed
  roadEvRoll(g);   // v529: one random road encounter
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = g.player.x; f.y = g.player.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}

