// ================= Cliffside Ascent (v290, Stage A) =================
// A storm-lashed cliff road north of Highward's eastern bridge. It re-uses the Mountain Pass' height-field engine
// (scene 'mountainpass', g.mtn.isCliff): sheer rock walls rise on the west side, the east side is a drop into the sea.
// Harpy's Nest is a second, smaller map of the same engine (g.mtn.nest) reached from a cave mouth off the road.
const CLF_TS = 50, CLF_W = 3400, CLF_H = 11700, CLF_Y0 = CLF_H-420, CLF_Y1 = 420, CLF_DEPTH = 55, /* v483: was 58 */ CLF_WALL_DROP = 340;
const NEST_W = 2600, NEST_H = 2600, NEST_CX = 1300, NEST_CY = 1200, NEST_R = 880, NEST_HARPIES = 16;
const CLF_TYPES = {shadowghoul:1, risendead:1, fallengolem:1, vulture:1, harpy:1, harpyqueen:1};
const CLF_PACK = {
  ghoul:{type:'shadowghoul', countMin:4, countMax:6}, risen:{type:'risendead', countMin:5, countMax:7}, golem:{type:'fallengolem', countMin:1, countMax:2},
  vult:{type:'vulture', countMin:3, countMax:4}, harpy:{type:'harpy', countMin:3, countMax:4}, wraith:{type:'wraithling', countMin:3, countMax:4},
};
function clfCx(y){ const s = CLF_H-y; return 1500 + 480*Math.sin(s/1150) + 170*Math.sin(s/470+1); }
function clfHalf(y){ const s = CLF_H-y; return 165 + 45*Math.sin(s/310) + 25*Math.sin(s/131+2); }
function clfElev(y){ const t = clamp((CLF_Y0-y)/(CLF_Y0-CLF_Y1),0,1); return 340*t + 26*Math.sin((CLF_H-y)/560); }
function isCliff(g){ return !!(g && g.scene==='mountainpass' && g.mtn && g.mtn.isCliff); }
function nestRimR(a){ return NEST_R + 70*Math.sin(3*a) + 45*Math.sin(7*a+1); }
function makeCliffside(kind){
  const nest = kind==='nest';
  const TS = CLF_TS, w = nest ? NEST_W : CLF_W, h = nest ? NEST_H : CLF_H, cols = w/TS, rows = h/TS, N = cols*rows;
  const rnd = subSeeded(nest ? 7711 : 7701), rr = (a,b)=>a+(b-a)*rnd();
  const wpY = CLF_H-3770, nestY = CLF_H-6890;
  const hwGate = {x:clfCx(CLF_Y0+90), y:CLF_Y0+90, r:44};
  const keepGate = {x:clfCx(CLF_Y1-70), y:CLF_Y1-70, r:80};
  const waypoint = {x:clfCx(wpY)-30, y:wpY, r:22};
  const nestGate = {x:clfCx(nestY)-570, y:nestY, r:48};
  const exitGate = {x:NEST_CX, y:NEST_CY+NEST_R+250, r:46};
  const discs = nest ? [] : [{x:clfCx(wpY), y:wpY, r:250},{x:clfCx(nestY)-300, y:nestY, r:300},{x:keepGate.x, y:CLF_Y1+60, r:340}];
  const W0 = new Uint8Array(N), OC = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const x = (ix+0.5)*TS, y = (iy+0.5)*TS, i = iy*cols+ix;
    let ok = false;
    if(nest){
      const dx = x-NEST_CX, dy = y-NEST_CY, rd = Math.hypot(dx,dy);
      ok = rd < nestRimR(Math.atan2(dy,dx)) || (y>NEST_CY && y<exitGate.y+30 && Math.abs(x-NEST_CX)<135);
    } else {
      if(y>=CLF_Y1-110 && y<=CLF_Y0+110) ok = Math.abs(x-clfCx(y)) < clfHalf(y);
      for(const d of discs) if(Math.hypot(x-d.x,y-d.y) < d.r) ok = true;
    }
    W0[i] = ok ? 1 : 0;
    if(!ok && !nest && y>=CLF_Y1-110 && y<=CLF_Y0+110 && x>clfCx(y)) OC[i] = 1;
  }
  const elevAt = (x,y)=>{
    if(nest){ const rd = Math.hypot(x-NEST_CX,y-NEST_CY); const rim = 60*Math.pow(Math.min(1,rd/NEST_R),3); const sm = clamp((360-rd)/160,0,1); return rim + 40*sm*sm*(3-2*sm); }
    return clfElev(y);
  };
  const E = new Float32Array(N), K = new Uint8Array(N), RING = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){ const i = iy*cols+ix; if(W0[i]){ E[i] = elevAt((ix+0.5)*TS,(iy+0.5)*TS); K[i] = 0; } }
  const WALL_ADD = [0, 55, 80, 100, 110, 110, 110];
  for(let ring=1; ring<=6; ring++){
    for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
      const i = iy*cols+ix; if(W0[i] || RING[i] || OC[i]) continue;
      let best = -1;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy) continue; const nx=ix+dx, ny=iy+dy; if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
        const j = ny*cols+nx;
        if(W0[j] || (RING[j] && RING[j]===ring-1)) best = Math.max(best, W0[j] ? E[j] : E[j]-WALL_ADD[ring-1]);
      }
      if(best>=0){ RING[i] = ring; E[i] = best + WALL_ADD[ring]; }
    }
  }
  for(let i=0;i<N;i++) if(!W0[i]){ K[i] = RING[i] && RING[i]<=4 ? 3 : 4; if(!RING[i]) E[i] = 0; }
  const B = new Uint8Array(N), nbs = [[1,0],[-1,0],[0,1],[0,-1]];
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix;
    if(K[i]>=3){ if(RING[i] && RING[i]<=6) B[i] = 1; continue; }
    for(const [dx,dy] of nbs){
      const nx = ix+dx, ny = iy+dy; if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
      const j = ny*cols+nx;
      if(K[j]<3 && E[i]-E[j] > CR_STEP){ B[i] = 1; break; }
    }
  }
  // the sea: wall off two tiles of void beside the road and remember the shoreline for the surf
  const shore = [];
  if(!nest) for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix; if(!W0[i]) continue;
    let edge = false;
    for(let dy=-2;dy<=2;dy++) for(let dx=-2;dx<=2;dx++){
      const nx = ix+dx, ny = iy+dy; if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
      const j = ny*cols+nx; if(OC[j]){ B[j] = 1; if(Math.abs(dx)<=1 && Math.abs(dy)<=1) edge = true; }
    }
    if(edge && (ix+iy)%2===0) shore.push({x:(ix+1.5)*TS, y:(iy+0.5)*TS, e:E[i], ph:rnd()*6.28});
  }
  const CH = new Float32Array(N*4);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix, own = E[i];
    for(let k=0;k<4;k++){
      const cx = (k===1||k===2) ? 1 : 0, cy = k>=2 ? 1 : 0;
      let sum = 0, n = 0;
      for(let ddy=cy-1; ddy<=cy; ddy++) for(let ddx=cx-1; ddx<=cx; ddx++){
        const nx = ix+ddx, ny = iy+ddy; if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
        const j = ny*cols+nx;
        if(Math.abs(E[j]-own) <= CR_STEP){ sum += E[j]; n++; }
      }
      CH[i*4+k] = n ? sum/n : own;
    }
  }
  const obstacles = []; let open = {};
  for(let iy=0; iy<=rows; iy++){
    const now = {}; let ix = 0;
    while(iy<rows && ix<cols){
      if(!B[iy*cols+ix]){ ix++; continue; }
      let j = ix; while(j+1<cols && B[iy*cols+j+1]) j++;
      const key = ix+'-'+j;
      if(open[key]){ open[key].h += TS; now[key] = open[key]; }
      else { const r = {x:ix*TS, y:iy*TS, w:(j-ix+1)*TS, h:TS, isKeep:true}; obstacles.push(r); now[key] = r; }
      ix = j+1;
    }
    open = now;
  }
  // ground: wet black stone, moss in the damp, a violet cast the nearer the keep
  const C = new Uint8Array(N*3);
  const mix = (a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix, x = (ix+0.5)*TS, y = (iy+0.5)*TS, hh = tileHash(ix,iy), h2 = tileHash(ix*3+7,iy*5+1);
    const prog = nest ? 0.5 : clamp((CLF_Y0-y)/(CLF_Y0-CLF_Y1),0,1);
    let c;
    if(K[i]>=3){
      c = mix([30,34,42], [66,70,82], h2*0.7 + Math.min(0.25,E[i]/1500));
      if(h2>0.8) c = mix(c,[22,26,34],0.5);
    } else {
      c = ((ix+iy)%2) ? [74,78,86] : [68,72,80];
      if(h2<0.22) c = mix(c,[56,72,62],0.55);
      if(hh>0.9) c = mix(c,[40,44,52],0.5);
      if(!nest){ const dc = Math.abs(x-clfCx(y)); if(dc<46) c = mix(c,[92,88,84],0.35); }
      else { const rd = Math.hypot(x-NEST_CX,y-NEST_CY); if(rd<340) c = mix(c,[104,86,64],0.55*(1-rd/340)); }
      c = mix(c,[56,44,78], prog*0.38);
    }
    C[i*3] = c[0]; C[i*3+1] = c[1]; C[i*3+2] = c[2];
  }
  const walk = (x,y)=>{ const ix=Math.floor(x/TS), iy=Math.floor(y/TS); if(ix<0||iy<0||ix>=cols||iy>=rows) return false; const i=iy*cols+ix; return !B[i] && K[i]<3 && Math.abs(CH[i*4]-CH[i*4+2])<8; };
  const flat = (x,y,d)=>walk(x,y)&&walk(x+d,y)&&walk(x-d,y)&&walk(x,y+d)&&walk(x,y-d);
  const R = { isMtn:true, isCliff:true, nest, name: nest ? "Harpy's Nest" : 'Cliffside Ascent', w, h, ts:TS, cols, rows, E, K, B, CH, C, wallDrop:CLF_WALL_DROP, colorFn:mtnColor,
    obstacles, rocks:[], waypoints:[], packAnchors:[], waypoint, deco:[], shore, hwGate, keepGate, nestGate, exitGate, walk, boltX:0.5 };
  const gates = nest ? [exitGate] : [hwGate, keepGate, nestGate];
  // pack anchors along the road
  if(!nest){
    for(let y=CLF_Y0-520; y>CLF_Y1+300; y-=rr(215,285)){
      const hf = clfHalf(y), x = clfCx(y) + rr(-0.5,0.5)*hf;
      if(!flat(x,y,60)) continue;
      if(gates.some(q=>dist({x,y},q)<460) || dist({x,y},waypoint)<380) continue;
      R.packAnchors.push({x,y,t:clamp((CLF_Y0-y)/(CLF_Y0-CLF_Y1),0,1)});
    }
  }
  // scenery
  const put = (k,x,y,s,extra)=>{ if(walk(x,y)) R.deco.push(Object.assign({k,x,y,s:s||1}, extra||{})); };
  if(!nest){
    for(let y=CLF_Y0; y>CLF_Y1-60; y-=rr(110,190)){
      const cx = clfCx(y), hf = clfHalf(y), q = rnd();
      // rock side: crags and dead trees clinging to the foot of the wall
      put(q<0.45?'crag':q<0.7?'deadpine':q<0.88?'rock':'grave', cx-hf+rr(20,60), y+rr(-30,30), rr(0.8,1.5), {h:rr(60,130)});
      // sea side: a low parapet of rocks, the odd lantern
      if(rnd()<0.5) put(rnd()<0.5?'rock':'bones', cx+hf-rr(20,50), y+rr(-30,30), rr(0.6,1.1));
      if(rnd()<0.35) put(rnd()<0.5?'bones':'feather', cx+rr(-0.7,0.7)*hf, y+rr(-40,40), rr(0.7,1.2));
    }
    for(let y=CLF_Y0-300; y>CLF_Y1; y-=640){ put('brazier', clfCx(y)+clfHalf(y)-34, y, 1); put('brazier', clfCx(y)-clfHalf(y)+34, y+30, 1); }
    for(const d of discs){ for(let k=0;k<7;k++){ const a = rr(0,6.28), rd = rr(120,d.r-40); put(k%3===0?'bones':k%3===1?'rock':'grave', d.x+Math.cos(a)*rd, d.y+Math.sin(a)*rd, rr(0.8,1.2)); } }
    put('brazier', waypoint.x-90, waypoint.y+30, 1); put('brazier', waypoint.x+90, waypoint.y+30, 1);
    put('brazier', keepGate.x-190, keepGate.y+170, 1.2); put('brazier', keepGate.x+190, keepGate.y+170, 1.2);
    put('brazier', nestGate.x+110, nestGate.y-120, 1); put('brazier', nestGate.x+110, nestGate.y+120, 1);
  } else {
    for(let k=0;k<26;k++){ const a = rr(0,6.28), rd = rr(120,NEST_R-90); put('nestmound', NEST_CX+Math.cos(a)*rd, NEST_CY+Math.sin(a)*rd, rr(0.8,1.5)); }
    for(let k=0;k<40;k++){ const a = rr(0,6.28), rd = rr(60,NEST_R-60); put(k%3===0?'feather':k%3===1?'bones':'rock', NEST_CX+Math.cos(a)*rd, NEST_CY+Math.sin(a)*rd, rr(0.7,1.3)); }
    for(let k=0;k<22;k++){ const a = rr(0,6.28), rd = NEST_R-rr(30,90); put('crag', NEST_CX+Math.cos(a)*rd, NEST_CY+Math.sin(a)*rd, rr(0.9,1.5), {h:rr(70,130)}); }
    put('nestmound', NEST_CX, NEST_CY, 2.6);
    put('brazier', exitGate.x-90, exitGate.y-90, 1); put('brazier', exitGate.x+90, exitGate.y-90, 1);
  }
  R.deco.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  return R;
}
function enterCliffside(opts){
  opts = opts || {};
  const g = game, p = g.player;
  if(g.scene==='lighthouse') hwStoreSave(g);
  g.tower = null;
  const nest = !!opts.nest;
  g.scene = 'mountainpass';
  g.mtn = makeCliffside(nest ? 'nest' : 'path');
  g.room = g.mtn; g.deepStore = null;
  g.depth = CLF_DEPTH + (nest ? 1 : 0);
  const R = g.mtn;
  if(nest){ p.x = R.exitGate.x; p.y = R.exitGate.y - 130; }
  else if(opts.atWaypoint){ p.x = R.waypoint.x; p.y = R.waypoint.y + 50; }
  else if(opts.fromNest){ p.x = R.nestGate.x + 140; p.y = R.nestGate.y; }
  else if(opts.fromKeep){ p.x = R.keepGate.x; p.y = R.keepGate.y + 190; }
  else { p.x = R.hwGate.x; p.y = R.hwGate.y - 130; }
  p.crX = undefined; R.entrySpawn = {x:p.x, y:p.y};
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null; g.bossKilled=false;
  g.stormT = rand(3,8); g.stormFlash = 0; g.stormFlash2 = 0;
  if(nest){
    R.queenSpawned = false; R.queenDone = false; R.nestSpawned = true;
    let n = 0, tries = 0;
    while(n<NEST_HARPIES && tries<400){
      tries++;
      const a = Math.random()*6.28, rd = rand(260, NEST_R-130), x = NEST_CX+Math.cos(a)*rd, y = NEST_CY+Math.sin(a)*rd;
      if(!R.walk(x,y) || dist({x,y},R.exitGate)<420) continue;
      const e = spawnEnemy(g, 'harpy', {x,y}); e.nestHarpy = true; e.aggroRange = 520; e.leashRange = 1400; n++;
    }
    showMsg("Harpy's Nest", 2.0);
    if(!getQuest(p,'clf_nest')){ addQuestOnce(p, 'clf_nest', "The Brood Mother", "Harpies roost in the cliffs above the road. Clear their nest and put down whatever rules it.", 1); updateQuestBadge(); }
  } else {
    for(const a of R.packAnchors){
      const r = Math.random(), t = a.t;
      const k = t<0.3 ? (r<0.3?'ghoul':r<0.6?'risen':r<0.8?'vult':'wraith')
              : t<0.65 ? (r<0.2?'ghoul':r<0.38?'risen':r<0.54?'vult':r<0.7?'golem':r<0.85?'harpy':'wraith')
              : (r<0.25?'harpy':r<0.5?'golem':r<0.65?'ghoul':r<0.78?'risen':r<0.88?'vult':'wraith');
      spawnMountainPassPack(g, a, CLF_PACK[k]);
    }
    const ob = R.obstacles; g.enemies = g.enemies.filter(e=>e.flying || !ob.some(o=>e.x>o.x-e.r && e.x<o.x+o.w+e.r && e.y>o.y-e.r && e.y<o.y+o.h+e.r));
    showMsg('Cliffside Ascent  (Lv. '+g.depth+')', 2.2);
    if(!getQuest(p,'clf_ascent')){ addQuestOnce(p, 'clf_ascent', 'The Cliffside Ascent', 'Climb the storm-lashed road above Highward to the gate of Shadow Keep.', 1); updateQuestBadge(); }
  }
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
  saveGame();
}
function updateCliffside(g, dt){
  const p = g.player, R = g.mtn;
  updatePortalChoice(false);
  crEnforce(g, p);
  stormTick(g, dt);
  let k = null;
  const near = (q,pad)=>dist(p,q) < q.r + p.r + (pad||22);
  if(R.nest){
    if(near(R.exitGate)) k = 'nestToCliff';
    if(R.nestSpawned && !R.queenSpawned && !g.enemies.some(e=>e.nestHarpy && e.hp>0)){
      R.queenSpawned = true; spawnHarpyQueen(g);
      bossMsg('THE BROOD MOTHER', 'The nest falls silent... then the sky tears open.', 4.2); shakeScreen(g, 7, 0.6);
    }
  } else {
    if(near(R.hwGate)) k = 'cliffToHighward';
    else if(near(R.nestGate)) k = 'toHarpyNest';
    else if(near(R.keepGate, 40)) k = 'shadowKeepGate';
    else if(dist(p,R.waypoint) < R.waypoint.r + p.r + 24){ k = 'waypointCliff'; }
  }
  updateInteractPrompt(k);
}
// ---- Harpy Queen Talon (one-time) ----
function harpyQueenSlain(g, e){
  const p = g.player;
  p.harpyQueenSlain = true;
  bossMsg('THE BROOD MOTHER FALLS', 'The nest is silent.', 3.2);
  const q = getQuest(p,'clf_nest'); if(q && !q.rewarded){ q.status='complete'; q.rewarded=true; q.progress=q.total; q.desc='The Brood Mother is dead and her nest cleared.'; p.gold += 800; gainXp(g, 1500); updateQuestBadge(); }
  saveGame();
}
// ---- monsters ----
function updateHarpy(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  updateFireBat(g, e, dt, target, d, isFollowerTarget, chillMult, room);
  e.fbT = (e.fbT||rand(1,3)) - dt;
  if(e.fState==='orbit' && e.fbT<=0 && d<430 && d>120){
    e.fbT = rand(2.6,4.2);
    const ang = Math.atan2(target.y-e.y, target.x-e.x);
    g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(ang)*290,vy:Math.sin(ang)*290,r:7,dmg:e.dmg*0.6,from:'enemy',life:1.8,color:(e.type==='wraithling'?'#a070ff':'#c9c4dc'),srcEnemy:e,targetRef:target});
  }
}
const HQ_R = 50, HQ_TALON_R = 95, HQ_SLAM_TELE = 1.0;
function spawnHarpyQueen(g){
  const R = g.mtn, depth = g.depth;
  const e = spawnEnemy(g, 'harpyqueen', {x:NEST_CX, y:NEST_CY-120});
  e.isLairBoss = true; e.bossName = 'Brood Mother, Queen of the Harpies'; e.harpyQueen = true;
  e.aggroRange = 99999; e.leashRange = 99999; e.wanderRadius = 0; e.baseR = e.r;
  e.qState = 'intro'; e.qT = 1.8; e.qCd = 2.0; e.qIdx = 0; e.qPhase = 1; e.qStrikes = []; e.qSummoned = 0; e.qHit = false;
  return e;
}
function queenHit(g, e, tgt, mult, kb){
  const dm = teleDmg(e, mult);
  if(tgt===g.player) playerDamage(g, dm, e, kb); else applyFollowerDamage(g, tgt, dm, e);
}
function updateHarpyQueen(g, e, dt, target, d, isFollowerTarget, chillMult, room){
  const p = g.player, frac = e.hp/e.maxHp, P = frac>0.66?1:frac>0.33?2:3, F = P===3 ? 0.72 : P===2 ? 0.86 : 1;
  const face = a=>{ e.facing = {x:Math.cos(a), y:Math.sin(a)}; e.faceSign = screenFacingSign(e.facing.x, e.facing.y); };
  e.moving = false; e.hop = 22 + Math.sin(e.animT*5)*5;
  e.qPhase = P;
  // talon strikes resolve whatever else she is doing
  for(let i=e.qStrikes.length-1;i>=0;i--){
    const s = e.qStrikes[i]; s.t -= dt;
    if(s.t<=0){
      const c = {x:s.x,y:s.y};
      if(dist(p,c) < HQ_TALON_R) queenHit(g, e, p, 0.9);
      if(g.followers) for(const f of g.followers) if(dist(f,c) < HQ_TALON_R) queenHit(g, e, f, 0.9);
      g.particles.push({type:'ring', x:s.x, y:s.y, t:0.45, max:0.45, r:HQ_TALON_R, color:'#d8c8ff'});
      g.particles.push({type:'burst', x:s.x, y:s.y, t:0.4, max:0.4, color:'#c9c4dc'});
      shakeScreen(g, 3, 0.15);
      e.qStrikes.splice(i,1);
    }
  }
  // keep her over the nest
  const lim = NEST_R-60, cx = e.x-NEST_CX, cy = e.y-NEST_CY, rd = Math.hypot(cx,cy);
  if(rd>lim){ e.x = NEST_CX+cx/rd*lim; e.y = NEST_CY+cy/rd*lim; }
  // brood calls at 66% and 33%
  if(e.qSummoned < (P-1) && e.qState!=='intro'){
    e.qSummoned++; e.qState = 'screech'; e.qT = 1.1; e.windT = 0;
    showMsg('The Brood Mother shrieks — the flock answers!', 2.4, '#d8c8ff'); shakeScreen(g, 5, 0.5);
    for(let i=0;i<4;i++){ const a = Math.PI*2*i/4+Math.random(), h = spawnEnemy(g, 'harpy', {x:clamp(e.x+Math.cos(a)*220, 60, NEST_W-60), y:clamp(e.y+Math.sin(a)*220, 60, NEST_H-60)}); h.aggroRange = 900; h.leashRange = 3000; h.noReward = true; }
  }
  if(e.qState==='intro'){ e.qT -= dt; face(Math.atan2(target.y-e.y, target.x-e.x)); if(e.qT<=0) e.qState = 'hover'; return; }
  if(e.qState==='screech'){ e.qT -= dt; e.atkAnimT = 0.1; if(e.qT<=0){ e.qState='hover'; e.qCd = 1.2; } return; }
  const seq = P===3 ? ['talons','fan','dive','talons','dive','fan'] : ['fan','talons','dive'];
  if(e.qState==='hover'){
    // circle the target at a hover distance; claw whoever stands close
    face(Math.atan2(target.y-e.y, target.x-e.x));
    e.qAng = (e.qAng===undefined ? Math.atan2(e.y-target.y, e.x-target.x) : e.qAng) + dt*0.55*(e.qDir||(e.qDir=Math.random()<0.5?-1:1));
    const R0 = 210, tx = target.x+Math.cos(e.qAng)*R0, ty = target.y+Math.sin(e.qAng)*R0, dd = Math.hypot(tx-e.x,ty-e.y);
    if(dd>6){ const st = Math.min(e.speed*chillMult*(dd>120?1.3:0.7)*dt, dd); e.x += (tx-e.x)/dd*st; e.y += (ty-e.y)/dd*st; e.moving = true; }
    e.atkCd -= dt;
    if(d < e.r+target.r+55 && e.atkCd<=0){ e.atkCd = 1.1; queenHit(g, e, target, 0.55); e.atkAnimT = 0.25; g.particles.push({type:'burst', x:target.x, y:target.y, t:0.25, max:0.25, color:'#c9c4dc'}); }
    e.qCd -= dt;
    if(e.qCd<=0){
      const mv = seq[e.qIdx++ % seq.length];
      if(mv==='fan'){ e.qState='fanTele'; e.qT = 0.65*F+0.2; e.windT = 0; }
      else if(mv==='talons'){
        e.qState='talonTele'; e.qT = 0.5;
        const n = P===1 ? 3 : P===2 ? 5 : 7;
        e.qStrikes.push({x:target.x, y:target.y, t:HQ_SLAM_TELE*F+0.3, max:HQ_SLAM_TELE*F+0.3});
        for(let i=1;i<n;i++){ const a = Math.random()*6.28, rd = rand(90,330); e.qStrikes.push({x:clamp(target.x+Math.cos(a)*rd,80,NEST_W-80), y:clamp(target.y+Math.sin(a)*rd,80,NEST_H-80), t:HQ_SLAM_TELE*F+0.3+i*0.12, max:HQ_SLAM_TELE*F+0.3+i*0.12}); }
      }
      else { e.qState='diveTele'; e.qT = 0.8*F+0.15; e.windT = 0; e.qDirA = Math.atan2(target.y-e.y, target.x-e.x); }
    }
  } else if(e.qState==='fanTele'){
    e.qT -= dt; e.atkAnimT = 0.1; face(Math.atan2(target.y-e.y, target.x-e.x));
    if(e.qT<=0){
      const base = Math.atan2(target.y-e.y, target.x-e.x), n = P===1 ? 9 : P===2 ? 13 : 17, spread = 1.9;
      for(let i=0;i<n;i++){ const a = base + (i/(n-1)-0.5)*spread; g.projectiles.push({x:e.x,y:e.y,vx:Math.cos(a)*300,vy:Math.sin(a)*300,r:9,dmg:e.dmg*0.55,from:'enemy',life:2.4,color:'#d8d0ee',srcEnemy:e,targetRef:target}); }
      e.qState='hover'; e.qCd = 2.2*F+0.8;
    }
  } else if(e.qState==='talonTele'){
    e.qT -= dt; e.atkAnimT = 0.1;
    if(e.qT<=0){ e.qState='hover'; e.qCd = 2.4*F+1.0; }
  } else if(e.qState==='diveTele'){
    e.qT -= dt; e.atkAnimT = 0.1; face(e.qDirA);
    if(e.qT<=0){ e.qState='dive'; e.qT = 0.55; e.qHit = false; }
  } else if(e.qState==='dive'){
    e.qT -= dt; e.x += Math.cos(e.qDirA)*900*dt; e.y += Math.sin(e.qDirA)*900*dt; face(e.qDirA); e.moving = true;
    for(const tg of [p].concat(g.followers||[])){
      if(!e.qHit && dist(e,tg) < e.r+tg.r+10){ e.qHit = true; queenHit(g, e, tg, 1.3); g.particles.push({type:'burst', x:tg.x, y:tg.y, t:0.3, max:0.3, color:'#d8c8ff'}); }
    }
    if(e.qT<=0){ e.qState='recover'; e.qT = 1.3; }
  } else if(e.qState==='recover'){
    e.qT -= dt;
    if(e.qT<=0){ e.qState='hover'; e.qCd = 1.4*F+0.4; e.qAng = Math.atan2(e.y-target.y, e.x-target.x); }
  }
}
function drawQueenTelegraph(e){
  for(const s of (e.qStrikes||[])){
    const iso = toIso(s.x,s.y), k = 1 - clamp(s.t/s.max,0,1);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(1, ISO_KY/ISO_KX); const RR = HQ_TALON_R*ISO_KX*Math.SQRT2;
    ctx.fillStyle = 'rgba(180,150,255,'+(0.10+0.22*k)+')'; ctx.beginPath(); ctx.arc(0,0,RR,0,7); ctx.fill();
    ctx.strokeStyle = 'rgba(230,215,255,'+(0.5+0.4*k)+')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0,0,RR*(0.35+0.65*k),0,7); ctx.stroke();
    ctx.restore();
  }
  if(e.qState==='diveTele' && e.qDirA!==undefined){
    const a = toIso(e.x,e.y), b = toIso(e.x+Math.cos(e.qDirA)*520, e.y+Math.sin(e.qDirA)*520);
    ctx.save(); ctx.strokeStyle = 'rgba(255,120,150,0.55)'; ctx.lineWidth = 16; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); ctx.restore();
  }
}
// ---- Cliffside art ----
function drawHarpyFigure(t, flap, tele, scale){
  // origin = body centre, facing +x; wings spread both sides
  const skin = '#bdb6c6', skinD = '#8f88a0', hair = '#241f33', wing = '#58526f', wingD = '#2b2740', fea = '#8e87aa';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for(const sx of [-1,1]){
    const lift = -6 + flap*14;
    ctx.fillStyle = sx<0 ? wingD : wing; ctx.strokeStyle = '#13101f'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0,-10);
    ctx.quadraticCurveTo(sx*14,-30+lift*0.5, sx*40,-22+lift);
    ctx.lineTo(sx*36,-14+lift*0.8); ctx.lineTo(sx*31,-17+lift*0.6); ctx.lineTo(sx*27,-9+lift*0.5); ctx.lineTo(sx*21,-12+lift*0.3); ctx.lineTo(sx*15,-3+lift*0.15); ctx.lineTo(sx*7,-2);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = fea; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(sx*6,-9); ctx.lineTo(sx*38,-21+lift); ctx.stroke();
  }
  // legs + talons
  ctx.strokeStyle = skinD; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-2,4); ctx.lineTo(-4,12); ctx.moveTo(3,4); ctx.lineTo(5,12); ctx.stroke();
  ctx.strokeStyle = '#d6cfbc'; ctx.lineWidth = 1.3;
  for(const lx of [-4,5]){ ctx.beginPath(); ctx.moveTo(lx,12); ctx.lineTo(lx-3,16); ctx.moveTo(lx,12); ctx.lineTo(lx+1,17); ctx.moveTo(lx,12); ctx.lineTo(lx+4,15); ctx.stroke(); }
  // torso, tattered cloth
  ctx.fillStyle = skin; ctx.strokeStyle = '#2a2236'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0,-5,5,8.5,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a3a62'; ctx.beginPath(); ctx.moveTo(-5,-2); ctx.lineTo(5,-2); ctx.lineTo(6,4); ctx.lineTo(2,2); ctx.lineTo(-1,5); ctx.lineTo(-6,3); ctx.closePath(); ctx.fill();
  // clawed arms, reaching
  ctx.strokeStyle = skin; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(3,-9); ctx.lineTo(10,-5+(tele?-3:0)); ctx.stroke();
  ctx.strokeStyle = '#d6cfbc'; ctx.lineWidth = 1.1;
  for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(10,-5+(tele?-3:0)); ctx.lineTo(14,-5+(tele?-3:0)+i*2.4); ctx.stroke(); }
  // head + streaming hair
  ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-1,-20); ctx.quadraticCurveTo(-9,-22,-13+Math.sin(t*6)*1.5,-9); ctx.quadraticCurveTo(-7,-12,-3,-9); ctx.closePath(); ctx.fill();
  ctx.fillStyle = skin; ctx.strokeStyle = '#2a2236'; ctx.beginPath(); ctx.ellipse(1.5,-17,4.2,4.6,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.moveTo(-3,-17); ctx.quadraticCurveTo(-2,-23,4,-21); ctx.quadraticCurveTo(1,-19,1,-15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = tele ? '#ff5a3a' : '#ffd24a'; ctx.beginPath(); ctx.arc(3.6,-17,1.1,0,7); ctx.fill();
}
function drawCliffMonsterIso(e){
  const iso = toIso(e.x,e.y), t = e.animT||0, face = e.faceSign||1, flash = e.hitT>0, tp = e.type;
  if(tp==='harpy' || tp==='harpyqueen'){
    const q = tp==='harpyqueen', s = q ? 2.3 : 1, hop = (e.hop||16) + (q?10:0);
    const tele = q ? /Tele$|^screech$/.test(e.qState||'') : e.fState==='tele';
    const flap = (q && (e.qState==='dive'||e.qState==='recover')) || e.fState==='dive' ? 0.1 : Math.sin(t*(tele?24:(q?9:15)));
    drawShadow(iso.x, iso.y, 12*s, 4.4*s);
    ctx.save(); ctx.translate(iso.x, iso.y-hop-10*s); ctx.scale(face*s, s);
    if(q){ const gl = ctx.createRadialGradient(0,-8,2,0,-8,34); gl.addColorStop(0,'rgba(200,170,255,'+(0.3+0.12*Math.sin(t*3))+')'); gl.addColorStop(1,'rgba(160,120,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-8,34,0,7); ctx.fill(); }
    if(flash){ ctx.globalAlpha = 0.55; }
    drawHarpyFigure(t, flap, tele, s);
    if(q){ ctx.fillStyle = '#e8c44a'; ctx.strokeStyle = '#6a4a10'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-3,-21); ctx.lineTo(-2,-27); ctx.lineTo(0,-23); ctx.lineTo(2,-28); ctx.lineTo(4,-23); ctx.lineTo(6,-26); ctx.lineTo(6,-21); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if(flash){ ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(0,-6,9,14,0,0,7); ctx.fill(); }
    ctx.restore();
    if(q) drawHpBar(iso, 92+hop, e.r, e.hp, e.maxHp); else drawHpBar(iso, 44+hop, e.r, e.hp, e.maxHp);
    return;
  }
  if(tp==='vulture'){
    const hop = e.hop||16, tele = e.fState==='tele', dive = e.fState==='dive', s = 1.265;
    const flap = dive ? 0.15 : Math.sin(t*(tele?22:12));
    drawShadow(iso.x, iso.y, 11*s, 4*s);
    ctx.save(); ctx.translate(iso.x, iso.y-hop-8); ctx.scale(face*s, s); ctx.lineJoin='round';
    const body = flash?'#fff':'#2a2430', wing = flash?'#fff':'#3a3342';
    for(const sx of [-1,1]){
      const lift = -4+flap*11;
      ctx.fillStyle = sx<0 ? '#1d1923' : wing; ctx.strokeStyle='#100d14'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(0,-3); ctx.quadraticCurveTo(sx*12,-14+lift*0.5,sx*30,-9+lift); ctx.lineTo(sx*27,-4+lift*0.8); ctx.lineTo(sx*23,-6+lift*0.6); ctx.lineTo(sx*19,0+lift*0.3); ctx.lineTo(sx*14,-1); ctx.lineTo(sx*9,3); ctx.lineTo(sx*4,3); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = body; ctx.strokeStyle='#100d14'; ctx.beginPath(); ctx.ellipse(0,0,6,7.5,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = flash?'#fff':'#5a4a58'; ctx.beginPath(); ctx.ellipse(-1,-5,5.5,3,0,0,7); ctx.fill();   // ruff
    ctx.fillStyle = flash?'#fff':'#b8808a'; ctx.beginPath(); ctx.ellipse(4,-9,2.8,3.6,0,0,7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d8c070'; ctx.beginPath(); ctx.moveTo(6.5,-9.5); ctx.lineTo(11,-7.5); ctx.lineTo(6.5,-7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = tele||dive ? '#ff3a20' : '#ffcf5a'; ctx.beginPath(); ctx.arc(5,-10,1,0,7); ctx.fill();
    ctx.strokeStyle='#d8d0b8'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(-2,6); ctx.lineTo(-3,11); ctx.moveTo(2,6); ctx.lineTo(3,11); ctx.stroke();
    ctx.restore();
    drawHpBar(iso, 42+hop, e.r, e.hp, e.maxHp);
    return;
  }
  if(tp==='fallengolem'){
    const s = e.r/27, tele = e.tState==='tele', wind = e.windT>0 || e.atkAnimT>0;
    const walk = e.moving ? Math.sin(t*4) : 0, bob = e.moving ? Math.abs(walk)*2 : Math.sin(t*1.3);
    const pulse = 0.55+0.45*Math.sin(t*2.6);
    drawShadow(iso.x, iso.y, 30*s, 10*s);
    ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.strokeStyle='#0e1014'; ctx.lineWidth=1.4;
    const rock = flash?'#fff':'#59606c', rockL = flash?'#fff':'#7a8290', rockD = flash?'#fff':'#323841';
    const poly = (pts,fill)=>{ ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]); ctx.closePath(); ctx.fillStyle=fill; ctx.fill(); ctx.stroke(); };
    poly([[-16,-26],[-5,-26],[-4+walk*4,-2],[-18+walk*4,-2]], rockD);
    poly([[5,-26],[16,-26],[18-walk*4,-2],[4-walk*4,-2]], rock);
    const ty = -bob;
    poly([[-24,-30+ty],[-20,-62+ty],[-6,-74+ty],[10,-72+ty],[22,-60+ty],[26,-30+ty],[8,-22+ty],[-10,-22+ty]], rock);
    poly([[-16,-56+ty],[-4,-68+ty],[8,-64+ty],[-2,-52+ty]], rockL);
    // moss and the dead glow of a failed rune
    ctx.fillStyle = flash?'#fff':'rgba(70,96,70,0.7)'; ctx.beginPath(); ctx.ellipse(-12,-62+ty,9,3.2,0,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(14,-34+ty,6,2.4,0,0,7); ctx.fill();
    ctx.strokeStyle = 'rgba(120,180,230,'+(0.35+0.5*pulse*(tele?1.6:1))+')'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-8,-58+ty); ctx.lineTo(0,-46+ty); ctx.lineTo(-6,-36+ty); ctx.moveTo(6,-60+ty); ctx.lineTo(12,-44+ty); ctx.stroke();
    // arms; the right one rises for the smash
    const rise = tele||wind ? -22 : walk*5;
    poly([[-30,-60+ty],[-22,-64+ty],[-20,-30+ty],[-34,-28+ty]], rockD);
    poly([[22,-62+ty],[34,-60+ty],[38,-34+rise*0.2+ty],[24,-34+ty]], rock);
    poly([[-10,-76+ty],[0,-90+ty],[10,-76+ty]], rockL);   // head
    ctx.fillStyle = tele ? '#ff6a4a' : '#8ad0ff'; ctx.fillRect(-4,-82+ty,3,2); ctx.fillRect(2,-82+ty,3,2);
    ctx.restore();
    drawHpBar(iso, 106*s, e.r, e.hp, e.maxHp);
    return;
  }
  // ground humanoids: shadow ghoul / risen dead
  const ghoul = tp==='shadowghoul', s = e.r/(ghoul?14:16), wind = e.windT>0 || e.atkAnimT>0;
  const walk = e.moving ? Math.sin(t*(ghoul?10:5)) : 0, bob = e.moving ? Math.abs(walk)*1.6 : Math.sin(t*1.6)*0.8;
  drawShadow(iso.x, iso.y, 12*s, 4.2*s);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(face*s, s); ctx.lineJoin='round'; ctx.lineCap='round';
  const skin = flash?'#fff':(ghoul?'#2e2820':'#8a9078'), cloth = flash?'#fff':(ghoul?'#1c1626':'#4a4234'), dark = ghoul ? '#0c0812' : '#26261c';
  // legs
  ctx.strokeStyle = skin; ctx.lineWidth = 3.2;
  ctx.beginPath(); ctx.moveTo(-2,-9); ctx.lineTo(-3+walk*4,0); ctx.moveTo(3,-9); ctx.lineTo(4-walk*4,0); ctx.stroke();
  // torso (hunched)
  ctx.fillStyle = cloth; ctx.strokeStyle = dark; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-6,-10-bob); ctx.quadraticCurveTo(-8,-22-bob,-1,-27-bob); ctx.quadraticCurveTo(8,-24-bob,7,-10-bob); ctx.closePath(); ctx.fill(); ctx.stroke();
  if(!ghoul){ ctx.fillStyle = flash?'#fff':'#6a5a42'; ctx.fillRect(-5,-22-bob,10,4); ctx.strokeStyle='#201a10'; ctx.strokeRect(-5,-22-bob,10,4); }   // rusted cuirass plate
  // long arms
  const reach = wind ? 7 : 0;
  ctx.strokeStyle = skin; ctx.lineWidth = ghoul ? 2.4 : 2.8;
  ctx.beginPath(); ctx.moveTo(4,-22-bob); ctx.lineTo(12+reach,-12-bob+(ghoul?5:0)); ctx.moveTo(-3,-22-bob); ctx.lineTo(-9,-11-bob+walk*2); ctx.stroke();
  ctx.strokeStyle = ghoul ? '#9a8ac0' : '#c8c8b0'; ctx.lineWidth = 1;
  for(let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(12+reach,-12-bob+(ghoul?5:0)); ctx.lineTo(17+reach,-11-bob+(ghoul?5:0)+i*2.4); ctx.stroke(); }
  // head
  ctx.fillStyle = skin; ctx.strokeStyle = dark; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(2,-31-bob,4.6,5,0,0,7); ctx.fill(); ctx.stroke();
  if(!ghoul){ ctx.fillStyle = '#1a1a14'; ctx.beginPath(); ctx.ellipse(3.4,-31-bob,1.6,2,0,0,7); ctx.fill(); ctx.fillRect(1,-27.5-bob,4,1.2); }
  ctx.fillStyle = ghoul ? '#c8a0ff' : '#ff8a4a'; ctx.beginPath(); ctx.arc(4,-31.5-bob,1.15,0,7); ctx.fill();
  if(ghoul){ const gl = ctx.createRadialGradient(0,-16,2,0,-16,22); gl.addColorStop(0,'rgba(130,90,200,0.22)'); gl.addColorStop(1,'rgba(130,90,200,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-16,22,0,7); ctx.fill(); }
  ctx.restore();
  drawHpBar(iso, 44*s, e.r, e.hp, e.maxHp);
}
function drawCliffDeco(d){
  const k = d.k, s = d.s||1, clk = (game&&game.clock)||0;
  if(k==='rock'){ drawRockIso(d); return; }
  if(k==='deadpine'){ drawDeadTreeIso(d); return; }
  if(k==='brazier' || k==='statue' || k==='cairn'){ drawMtnDeco(d); return; }
  const iso = toIso(d.x,d.y);
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s); ctx.lineJoin='round';
  if(k==='crag'){
    const hh = d.h||90; drawShadow(0,0,22,7);
    ctx.fillStyle='#2c3038'; ctx.strokeStyle='#0e1014'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(-18,0); ctx.lineTo(-13,-hh*0.55); ctx.lineTo(-5,-hh*0.8); ctx.lineTo(1,-hh); ctx.lineTo(8,-hh*0.62); ctx.lineTo(15,-hh*0.4); ctx.lineTo(19,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#454b57'; ctx.beginPath(); ctx.moveTo(-5,-hh*0.8); ctx.lineTo(1,-hh); ctx.lineTo(8,-hh*0.62); ctx.lineTo(1,-hh*0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(60,90,70,0.55)'; ctx.beginPath(); ctx.ellipse(-8,-hh*0.2,8,3,0,0,7); ctx.fill();
  } else if(k==='grave'){
    drawShadow(0,0,10,4); ctx.fillStyle='#5a606c'; ctx.strokeStyle='#1a1c22'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-6,-14); ctx.quadraticCurveTo(0,-22,6,-14); ctx.lineTo(6,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='#2c3038'; ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(0,-6); ctx.moveTo(-3,-12); ctx.lineTo(3,-12); ctx.stroke();
  } else if(k==='bones'){
    ctx.strokeStyle='#cfc8b0'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-9,0); ctx.lineTo(8,-3); ctx.moveTo(-5,-5); ctx.lineTo(6,2); ctx.stroke();
    ctx.fillStyle='#d8d2bc'; ctx.beginPath(); ctx.ellipse(10,-3,3.4,3,0,0,7); ctx.fill(); ctx.fillStyle='#1a1a14'; ctx.fillRect(9,-4,1.3,1.3); ctx.fillRect(11,-4,1.3,1.3);
  } else if(k==='feather'){
    ctx.strokeStyle='#b9b3cc'; ctx.fillStyle='rgba(185,179,204,0.8)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(-9,2); ctx.quadraticCurveTo(0,-8,10,-2); ctx.quadraticCurveTo(0,-1,-9,2); ctx.fill(); ctx.stroke();
  } else if(k==='nestmound'){
    drawShadow(0,0,26,9);
    ctx.strokeStyle='#4a3a28'; ctx.lineWidth=2.2;
    for(let i=0;i<16;i++){ const a = i*0.9, r = 8+(i%5)*3.4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*1.6,-3+Math.sin(a)*r*0.5); ctx.lineTo(Math.cos(a+1.4)*r*1.6,-8+Math.sin(a+1.4)*r*0.5); ctx.stroke(); }
    ctx.fillStyle='#6a5438'; ctx.beginPath(); ctx.ellipse(0,-4,19,7,0,0,7); ctx.fill();
    ctx.fillStyle='#3a2c1c'; ctx.beginPath(); ctx.ellipse(0,-5,12,4.2,0,0,7); ctx.fill();
    if(((d.x*7+d.y)|0)%3===0){ ctx.fillStyle='#d8d2c0'; ctx.beginPath(); ctx.ellipse(-3,-6,3.2,4,0.2,0,7); ctx.fill(); ctx.beginPath(); ctx.ellipse(3.5,-5.5,3,3.8,-0.2,0,7); ctx.fill(); }
  }
  ctx.restore();
}
function drawCliffGateIso(pos, kind, open, clock){
  const iso = toIso(pos.x,pos.y), t = clock||0;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.lineJoin='round';
  if(kind==='nest'){
    drawShadow(0,6,70,20);
    ctx.fillStyle='#2a2e36'; ctx.strokeStyle='#0c0e12'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(-70,4); ctx.lineTo(-62,-70); ctx.lineTo(-30,-112); ctx.lineTo(30,-116); ctx.lineTo(64,-72); ctx.lineTo(72,4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#050608'; ctx.beginPath(); ctx.moveTo(-40,4); ctx.lineTo(-40,-56); ctx.quadraticCurveTo(0,-98,40,-56); ctx.lineTo(40,4); ctx.closePath(); ctx.fill();
    const gl = ctx.createRadialGradient(0,-30,4,0,-30,52); gl.addColorStop(0,'rgba(210,190,255,'+(0.25+0.1*Math.sin(t*2))+')'); gl.addColorStop(1,'rgba(210,190,255,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,-30,52,0,7); ctx.fill();
    ctx.fillStyle='#ffd24a'; for(const ex of [-9,9]){ ctx.beginPath(); ctx.ellipse(ex,-26,2.2,1.6,0,0,7); ctx.fill(); }
    ctx.strokeStyle='#cfc8b0'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-52,2); ctx.lineTo(-30,-6); ctx.moveTo(38,0); ctx.lineTo(58,-8); ctx.stroke();
    ctx.strokeStyle='#b9b3cc'; ctx.lineWidth=1.4; for(let i=0;i<5;i++){ const fx=-60+i*28; ctx.beginPath(); ctx.moveTo(fx,-60+((i*13)%20)); ctx.quadraticCurveTo(fx+6,-52,fx+2,-40); ctx.stroke(); }
  } else if(kind==='keep'){
    const S = 1.0;
    drawShadow(0,8,170,34);
    // wing walls
    ctx.fillStyle='#14121b'; ctx.strokeStyle='#050408'; ctx.lineWidth=1.5;
    ctx.fillRect(-190,-190,70,194); ctx.strokeRect(-190,-190,70,194); ctx.fillRect(120,-190,70,194); ctx.strokeRect(120,-190,70,194);
    // flanking towers with spires
    for(const sx of [-1,1]){
      const bx = sx*128;
      ctx.fillStyle='#1b1824'; ctx.beginPath(); ctx.moveTo(bx-30,0); ctx.lineTo(bx-30,-300); ctx.lineTo(bx,-352); ctx.lineTo(bx+30,-300); ctx.lineTo(bx+30,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='rgba(180,120,255,'+(0.5+0.4*Math.sin(t*2+sx)) +')'; ctx.fillRect(bx-3,-250,6,22); ctx.fillRect(bx-3,-196,6,18);
    }
    // gatehouse
    ctx.fillStyle='#1a1722'; ctx.beginPath(); ctx.moveTo(-100,0); ctx.lineTo(-100,-236); ctx.lineTo(-70,-248); ctx.lineTo(-40,-274); ctx.lineTo(0,-300); ctx.lineTo(40,-274); ctx.lineTo(70,-248); ctx.lineTo(100,-236); ctx.lineTo(100,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(60,56,76,0.6)'; ctx.lineWidth=1; for(let y=-20;y>-230;y-=22){ ctx.beginPath(); ctx.moveTo(-100,y); ctx.lineTo(100,y); ctx.stroke(); }
    // spikes along the crest
    ctx.fillStyle='#0c0a12'; for(let x=-96;x<=96;x+=24){ ctx.beginPath(); ctx.moveTo(x-5,-240+Math.abs(x)*0.1); ctx.lineTo(x,-262+Math.abs(x)*0.1-((x/24)%2?0:12)); ctx.lineTo(x+5,-240+Math.abs(x)*0.1); ctx.fill(); }
    // the arch
    ctx.fillStyle='#030206'; ctx.beginPath(); ctx.moveTo(-58,0); ctx.lineTo(-58,-130); ctx.quadraticCurveTo(-58,-216,0,-226); ctx.quadraticCurveTo(58,-216,58,-130); ctx.lineTo(58,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#2e2a3c'; ctx.lineWidth=5; ctx.stroke();
    const pul = 0.55+0.45*Math.sin(t*1.7);
    const gl = ctx.createRadialGradient(0,-60,6,0,-60,120); gl.addColorStop(0,'rgba(160,80,255,'+(0.38*pul)+')'); gl.addColorStop(1,'rgba(120,40,200,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(0,-60,120,0,7); ctx.fill();
    if(!open){
      ctx.fillStyle='#211b2a'; ctx.strokeStyle='#08060c'; ctx.lineWidth=2;
      ctx.fillRect(-54,-132,52,132); ctx.strokeRect(-54,-132,52,132); ctx.fillRect(2,-132,52,132); ctx.strokeRect(2,-132,52,132);
      ctx.fillStyle='#3a3248'; for(const by of [-110,-70,-30]){ ctx.fillRect(-54,by,52,7); ctx.fillRect(2,by,52,7); }
      ctx.strokeStyle='rgba(190,120,255,'+(0.45+0.5*pul)+')'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,-66,26,0,7); ctx.moveTo(0,-92); ctx.lineTo(0,-40); ctx.moveTo(-23,-79); ctx.lineTo(23,-53); ctx.moveTo(23,-79); ctx.lineTo(-23,-53); ctx.stroke();
    } else {
      const g2 = ctx.createLinearGradient(0,-130,0,0); g2.addColorStop(0,'rgba(120,50,200,0.0)'); g2.addColorStop(1,'rgba(190,110,255,'+(0.5*pul)+')'); ctx.fillStyle=g2; ctx.fillRect(-58,-210,116,210);
    }
    // skull braziers at the foot
    for(const sx of [-1,1]){ ctx.fillStyle='#d8d2bc'; ctx.beginPath(); ctx.ellipse(sx*84,-10,7,8,0,0,7); ctx.fill(); ctx.fillStyle='#d060ff'; const f = 1+0.3*Math.sin(t*9+sx); ctx.beginPath(); ctx.moveTo(sx*84-5,-16); ctx.quadraticCurveTo(sx*84,-34*f,sx*84+5,-16); ctx.fill(); }
  }
  ctx.restore();
}
function drawCliffSea(g, cam){
  const t = g.clock||0;
  ctx.save(); ctx.translate(cam.x, cam.y);
  for(let i=0;i<30;i++){
    const yy = H*0.46 + (i/30)*H*0.56, amp = 3+i*0.18, ph = t*(0.7+i*0.05)+i*1.7;
    ctx.strokeStyle = 'rgba('+(110+i)+','+(150+i)+',190,'+(0.05+0.09*(i/30))+')'; ctx.lineWidth = 1+i*0.07;
    ctx.beginPath();
    for(let x=-20;x<=W+20;x+=24){ const y = yy+Math.sin(x*0.018+ph)*amp+Math.sin(x*0.007-ph*0.6)*amp*1.6; if(x<0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
    ctx.stroke();
  }
  ctx.restore();
}
function drawCliffSurf(g, cam){
  const R = g.mtn, t = g.clock||0, WD = R.wallDrop;
  ctx.save();
  for(const s of R.shore){
    const sx = (s.x-s.y)*ISO_KX, sy = (s.x+s.y)*ISO_KY - s.e + WD;
    if(sx-cam.x<-80 || sx-cam.x>W+80 || sy-cam.y<-80 || sy-cam.y>H+80) continue;
    const k = 0.5+0.5*Math.sin(t*1.6+s.ph), r = 9+8*k;
    ctx.fillStyle = 'rgba(220,235,250,'+(0.14+0.26*k)+')'; ctx.beginPath(); ctx.ellipse(sx, sy, r*1.6, r*0.45, 0, 0, 7); ctx.fill();
    if(k>0.82){ ctx.fillStyle = 'rgba(235,245,255,0.55)'; ctx.beginPath(); ctx.ellipse(sx+4, sy-10-(k-0.82)*80, 3.5, 6, 0, 0, 7); ctx.fill(); }
  }
  ctx.restore();
}
let _rainDrops = null;
function drawCliffStorm(g){
  const t = g.clock||0;
  ctx.save();
  // night: a cold blue wash that closes in around the player's lantern-light
  ctx.fillStyle = 'rgba(4,8,22,0.30)'; ctx.fillRect(0,0,W,H);
  const vg = ctx.createRadialGradient(W/2,H/2-30,H*0.16, W/2,H/2-30,Math.hypot(W,H)*0.58);
  vg.addColorStop(0,'rgba(2,5,16,0)'); vg.addColorStop(0.55,'rgba(2,5,16,0.28)'); vg.addColorStop(1,'rgba(1,3,10,0.72)');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  // lightning in the distance
  const fl = g.stormFlash||0;
  if(fl>0.01){
    ctx.fillStyle = 'rgba(190,205,255,'+(0.30*fl)+')'; ctx.fillRect(0,0,W,H);
    const bx = (g.boltX||0.5)*W; ctx.strokeStyle = 'rgba(235,240,255,'+(0.85*fl)+')'; ctx.lineWidth = 2.4; ctx.beginPath();
    let x = bx, y = 0; ctx.moveTo(x,y); for(let i=0;i<9;i++){ x += Math.sin(i*12.9898+bx)*34; y += H*0.065; ctx.lineTo(x,y); } ctx.stroke();
  }
  // rain, driven across the view by the sea wind
  if(!_rainDrops){ _rainDrops = []; for(let i=0;i<260;i++) _rainDrops.push({x:Math.random(), y:Math.random(), v:0.8+Math.random()*0.7, l:10+Math.random()*16, n:Math.random()<0.4}); }
  const wind = -0.32, FALL = 620;
  for(const near of [false,true]){
    ctx.strokeStyle = near ? 'rgba(180,200,235,0.30)' : 'rgba(150,170,205,0.15)'; ctx.lineWidth = near ? 1.4 : 1;
    ctx.beginPath();
    for(const d of _rainDrops){
      if(d.n!==near) continue;
      const py = ((d.y*H + t*FALL*d.v) % (H+60)) - 30; let px = (d.x*W + t*FALL*d.v*wind) % (W+120); if(px<0) px += W+120; px -= 60;
      ctx.moveTo(px, py); ctx.lineTo(px+d.l*wind, py+d.l);
    }
    ctx.stroke();
  }
  ctx.restore();
}
function pushCliffDrawables(g, drawables, cam){
  const R = g.mtn, vis = (x,y)=>{ const i=toIso(x,y); return i.x>cam.x-200 && i.x<cam.x+W+200 && i.y>cam.y-360 && i.y<cam.y+H+220; };
  for(const dd of R.deco) if(vis(dd.x,dd.y)) drawables.push({depth:dd.x+dd.y, draw:()=>drawCliffDeco(dd)});
  if(R.nest){
    drawables.push({depth:R.exitGate.x+R.exitGate.y-1, draw:()=>drawCliffGateIso(R.exitGate,'nest',false,g.clock)});
    drawables.push({depth:R.exitGate.x+R.exitGate.y, draw:()=>drawEdgeLabelIso(R.exitGate, 'CLIFFSIDE ASCENT', 110)});
    for(const e of g.enemies) if(e.harpyQueen) drawables.push({depth:-100000+e.x*0.001, draw:()=>drawQueenTelegraph(e)});
  } else {
    drawables.push({depth:R.hwGate.x+R.hwGate.y-1, draw:()=>drawHwGateIso(R.hwGate, true, g.clock||0)});
    drawables.push({depth:R.hwGate.x+R.hwGate.y, draw:()=>drawEdgeLabelIso(R.hwGate, 'HIGHWARD', 132)});
    drawables.push({depth:R.nestGate.x+R.nestGate.y-1, draw:()=>drawCliffGateIso(R.nestGate,'nest',false,g.clock)});
    drawables.push({depth:R.nestGate.x+R.nestGate.y, draw:()=>drawEdgeLabelIso(R.nestGate, "HARPY'S NEST", 130)});
    drawables.push({depth:R.keepGate.x+R.keepGate.y-1, draw:()=>fadeWhenBehind(R.keepGate, 260, 340, ()=>drawCliffGateIso(R.keepGate,'keep',hasAllRunestones(g.player),g.clock))});
    drawables.push({depth:R.keepGate.x+R.keepGate.y, draw:()=>drawEdgeLabelIso(R.keepGate, 'SHADOW KEEP', 120)});
    drawables.push({depth:R.waypoint.x+R.waypoint.y-1, draw:()=>drawWaypointIso(R.waypoint, g.clock||0, waypointLit())});
    drawables.push({depth:R.waypoint.x+R.waypoint.y, draw:()=>drawEdgeLabelIso(R.waypoint, 'WAYPOINT')});
  }
}

