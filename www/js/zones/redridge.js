// ---------------- Redridge Canyon (v153) ----------------
// Far-east region past Frosthold Keep's east gate. A long sandstone canyon: cliff bands top and bottom, two
// cross ridges that force a winding route (gaps alternate south / north), mesas, and packs of Reflective
// Armordons, Jumping Raptors and Sand Snakes. Waypoint by the west entrance; the east end is a sealed passage.
const RR_W = 6400, RR_H = 6400, RR_DEPTH = 48;   // v483: was 43   // v419: square (was 9000x4300)
// v420: every pack is a single type with 8-12 monsters (armordons 6-9, they are big)
const RR_PACKS = ['armordon','raptor','sandsnake','crawler','raptor','sandsnake','crawler','armordon'];
function rrPackSize(type){ return type==='armordon' ? 6+Math.floor(Math.random()*4) : 8+Math.floor(Math.random()*5); }
const CRAWLER_TONGUE_LEN = 420, CRAWLER_TONGUE_HW = 34, CRAWLER_TONGUE_WIND = 0.6, CRAWLER_PULL_SPEED = 1000;
// v456: the canyon is two zones now. West: the Last Wayfarer, Watchtower I, the Frosthold gate and the Skybridge.
// East: Watchtowers II and III, the Raptor Lair and the Crater road. A canyon pass joins them.
const RR_PARTS = {
  west:{ w:3900, h:3900, XB:[1500, 2700], LV:[210, 150, 100], label:'Redridge Canyon — West',
    gates:[ {id:'frost',  x:324,  y:1500, r:64, label:'FROSTHOLD KEEP', act:'toFrostholdFromRedridge', art:'keep', big:1.5},
            {id:'bridge', x:1500, y:324,  r:70, label:'SKYBRIDGE', act:'redridgeEastSealed', art:true, big:1.125, labelH:120},
            {id:'east',   x:3576, y:2300, r:70, label:'EASTERN CANYON', act:'toRedridgeEast'} ],
    waypoint:{x:760, y:1330, r:22}, camp:{x:1250, y:1800, r:34}, towers:[{id:1, x:2350, y:1100}],
    ramps:[[1750,3200],[900,2600]], spines:[[2000,2300,2700,3500,0.45]], anchors:42, herds:5 },
  east:{ w:3900, h:4300, XB:[1300, 2500], LV:[100, 50, 0], label:'Redridge Canyon — East',
    gates:[ {id:'west',   x:324,  y:2300, r:70, label:'WESTERN CANYON', act:'toRedridgeWest'},
            {id:'crater', x:2100, y:324,  r:70, label:'REDRIDGE CRATER', act:'toRedCrater', art:true, big:1.0, labelH:80},
            {id:'lair',   x:3100, y:3976, r:70, label:'RAPTOR LAIR', act:'toRaptorLair', art:true, big:1.0, labelH:80} ],
    waypoint:null, camp:null, towers:[{id:2, x:1600, y:3150}, {id:3, x:3100, y:1250}],
    ramps:[[1500,3600],[1100,3000]], spines:[[2200,1700,2900,3000,0.6]], anchors:46, herds:5 }
};
function rrGate(rr, id){ return (rr.gates||[]).find(gt=>gt.id===id) || rr.gates[0]; }
function makeRedridge(part){
  const PC = RR_PARTS[part==='east' ? 'east' : 'west'];
  // v419: Redridge Canyon rebuilt on the height-field terrain engine (same one as the Crater and Mountain Pass): a SQUARE
  // canyon that steps down from the Frosthold plateau in the north-west to the scorched floor in the south-east, with
  // steep ramps between tiers, free-standing hills (the watchtowers stand on the tallest) and rough rock outcrops
  // instead of the old straight cliff blocks.
  const TS = 50, w = PC.w, h = PC.h, cols = w/TS, rows = h/TS, N = cols*rows, M = 300;
  const XB = PC.XB, LV = PC.LV;
  const xb = (k,y)=> XB[k] + 120*Math.sin(y/700 + k*1.7);
  const baseElev = (x,y)=>{ let k = 0; while(k<XB.length && x>=xb(k,y)) k++; return LV[k]; };
  const gates = PC.gates.map(gt=>Object.assign({}, gt));
  const waypoint = PC.waypoint ? Object.assign({}, PC.waypoint) : null;
  const camp = PC.camp ? Object.assign({}, PC.camp) : null;   // the Last Wayfarer's camp
  const towers = PC.towers.map(t=>Object.assign({}, t));
  for(const t of towers){ t.door = {x:t.x+130, y:t.y+130, r:40}; t.hill = {x:t.x, y:t.y, rTop:150, band:270, up:95}; }
  // ramps: steep strips cut through every tier step
  const ramps = [];
  const RAMP_Y = PC.ramps;
  RAMP_Y.forEach((ys,k)=>ys.forEach(yc=>{ const xc = xb(k,yc); ramps.push({x0:xc-160, x1:xc+160, y0:yc-190, y1:yc+190, a:LV[k], b:LV[k+1]}); }));
  // hills: a tower hill each, plus lower mounds scattered over the tiers
  const hills = towers.map(t=>({x:t.hill.x, y:t.hill.y, rTop:t.hill.rTop, band:t.hill.band, up:t.hill.up}));
  const keepouts = gates.map(gt=>({x:gt.x,y:gt.y,r:360})).concat(waypoint ? [{x:waypoint.x,y:waypoint.y,r:240}] : []).concat(camp ? [{x:camp.x,y:camp.y,r:340}] : []).concat(towers.map(t=>({x:t.x,y:t.y,r:300})));
  const nearBoundary = (x,y,d)=> XB.some((_,k)=>Math.abs(x-xb(k,y))<d);
  let tries = 0, nm = 0;
  while(nm<6 && tries<4000){ tries++;
    const x = rand(M+500, w-M-500), y = rand(M+500, h-M-500), rTop = rand(90,140), band = 200, up = rand(45,65);
    if(nearBoundary(x,y,rTop+band+120) || keepouts.some(k=>dist({x,y},k)<k.r+rTop+band) || hills.some(q=>dist(q,{x,y})<q.rTop+q.band+rTop+band+60)) continue;
    hills.push({x,y,rTop,band,up}); nm++;
  }
  const elevAt = (x,y)=>{
    let e = baseElev(x,y);
    for(const r of ramps){ if(x>=r.x0 && x<=r.x1 && y>=r.y0 && y<=r.y1) e = r.a + (r.b-r.a)*(x-r.x0)/(r.x1-r.x0); }
    for(const hl of hills){
      const d = dist({x,y},hl);
      if(d < hl.rTop+hl.band){
        const top = baseElev(hl.x,hl.y)+hl.up, s = d<=hl.rTop ? 1 : 1-(d-hl.rTop)/hl.band;
        e = e + (top-e)*s;
      }
    }
    return e;
  };
  // walkable mask: the inset square, bitten at the edges by rock blobs, with outcrops dropped inside
  const W0 = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){ const x=(ix+0.5)*TS, y=(iy+0.5)*TS; W0[iy*cols+ix] = (x>=M && x<=w-M && y>=M && y<=h-M) ? 1 : 0; }
  const nearRamp = (x,y,pad)=>ramps.some(r=>x>r.x0-pad && x<r.x1+pad && y>r.y0-pad && y<r.y1+pad);
  const nearHill = (x,y,pad)=>hills.some(q=>dist(q,{x,y})<q.rTop+q.band*0.5+pad);
  const blobs = [];
  const addBlob = (x,y,r)=>{ if(keepouts.some(c=>dist({x,y},c)<c.r+r*0.4) || nearRamp(x,y,r*0.6) || nearHill(x,y,r)) return; blobs.push({x,y,r}); };
  for(let i=0;i<110;i++){   // edge bites
    const side = Math.floor(Math.random()*4), t = rand(M, w-M), o = rand(-30,70);
    if(side===0) addBlob(t, M+o, rand(80,210)); else if(side===1) addBlob(t, h-M-o, rand(80,210));
    else if(side===2) addBlob(M+o, t, rand(80,210)); else addBlob(w-M-o, t, rand(80,210));
  }
  for(let i=0;i<60;i++) addBlob(rand(M+250, w-M-250), rand(M+250, h-M-250), rand(55,135));   // interior outcrops
  // two jagged rock spines (no straight walls) that make the route wind: broken rows of blobs with wide gaps
  const spine = (x0,y0,x1,y1,gapAt)=>{ const n = 14; for(let i=0;i<=n;i++){ const t = i/n; if(Math.abs(t-gapAt)<0.13) continue; addBlob(x0+(x1-x0)*t+rand(-50,50), y0+(y1-y0)*t+rand(-50,50), rand(90,150)); } };
  for(const sp0 of PC.spines) spine(sp0[0], sp0[1], sp0[2], sp0[3], sp0[4]);
  for(const b of blobs){
    const ix0 = Math.max(0,Math.floor((b.x-b.r)/TS)), ix1 = Math.min(cols-1,Math.floor((b.x+b.r)/TS));
    const iy0 = Math.max(0,Math.floor((b.y-b.r)/TS)), iy1 = Math.min(rows-1,Math.floor((b.y+b.r)/TS));
    for(let iy=iy0;iy<=iy1;iy++) for(let ix=ix0;ix<=ix1;ix++) if(dist({x:(ix+0.5)*TS,y:(iy+0.5)*TS},b)<b.r) W0[iy*cols+ix] = 0;
  }
  // heights + wall rings (same recipe as the Mountain Pass)
  const E = new Float32Array(N), K = new Uint8Array(N), RING = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){ const i = iy*cols+ix; if(W0[i]){ E[i] = elevAt((ix+0.5)*TS,(iy+0.5)*TS); K[i] = 0; } }
  const WALL_ADD = [0, 55, 80, 100, 110, 110, 110];
  for(let ring=1; ring<=6; ring++){
    for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
      const i = iy*cols+ix; if(W0[i] || RING[i]) continue;
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
  // the tower bodies are solid
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
  for(const t of towers) obstacles.push({x:t.x-75, y:t.y-75, w:150, h:150, isKeep:true});
  // ground colours: pale sandstone on the high plateau, deepening to brick red on the floor; rust-red canyon walls
  const C = new Uint8Array(N*3);
  const mix = (a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  const SAND=[226,182,128], CLAY=[178,100,62], DEEP=[142,72,46], ROCKH=[150,82,56], ROCKL=[96,46,32], ROAD=[222,184,134];
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix, x = (ix+0.5)*TS, y = (iy+0.5)*TS, hh = tileHash(ix,iy), h2 = tileHash(ix*3+7,iy*5+1);
    let c;
    if(K[i]>=3){ c = mix(ROCKL, ROCKH, clamp(E[i]/320,0,1)*0.7 + (h2>0.6?0.25:0)); }
    else {
      const t = clamp(E[i]/210,0,1);
      c = t>0.5 ? mix(CLAY, SAND, (t-0.5)*2) : mix(DEEP, CLAY, t*2);
      if(h2>0.93) c = mix(c, DEEP, 0.35);
      if(((ix+iy)&1)) c = mix(c, [255,230,190], 0.03);
      if(camp && dist({x,y},camp)<230) c = mix(c, [168,118,76], 0.7);
      if(camp && Math.abs(y-gates[0].y)<85 && x<camp.x+120) c = mix(c, ROAD, 0.7);
    }
    C[i*3] = c[0]; C[i*3+1] = c[1]; C[i*3+2] = c[2];
  }
  const walk = (x,y)=>{ const ix=Math.floor(x/TS), iy=Math.floor(y/TS); if(ix<0||iy<0||ix>=cols||iy>=rows) return false; const i=iy*cols+ix; return !B[i] && K[i]<3 && Math.abs(CH[i*4]-CH[i*4+2])<14; };
  const flat = (x,y,d)=>walk(x,y)&&walk(x+d,y)&&walk(x-d,y)&&walk(x,y+d)&&walk(x,y-d);
  const okAnchor = (x,y,d)=> flat(x,y,d||70) && (!camp || dist({x,y},camp)>650) && (!waypoint || dist({x,y},waypoint)>650) && dist({x,y},gates[0])>650 && !keepouts.some(k=>dist({x,y},k)<k.r+40);
  const anchors = []; tries=0;
  while(anchors.length<PC.anchors && tries<60000){ tries++;
    const x=rand(M+120,w-M-120), y=rand(M+120,h-M-120);
    if(!okAnchor(x,y) || anchors.some(a=>dist(a,{x,y})<330)) continue;
    anchors.push({x,y});
  }
  const herdAnchors = []; tries=0;
  while(herdAnchors.length<PC.herds && tries<20000){ tries++;
    const x=rand(M+300,w-M-300), y=rand(M+300,h-M-300);
    if(!okAnchor(x,y,170) || anchors.some(a=>dist(a,{x,y})<420) || herdAnchors.some(a=>dist(a,{x,y})<900)) continue;
    herdAnchors.push({x,y});
  }
  const deco = []; tries=0;
  while(deco.length<260 && tries<30000){ tries++;
    const x=rand(M+40,w-M-40), y=rand(M+40,h-M-40);
    if(!walk(x,y) || keepouts.some(k=>dist({x,y},k)<90) || (camp && Math.abs(y-gates[0].y)<85 && x<camp.x+120)) continue;
    const r=Math.random();
    deco.push({x,y,s:rand(0.7,1.4),k: r<0.55?'rock' : r<0.8?'cactus' : 'bones'});
  }
  return { isMtn:true, w, h, depth:RR_DEPTH, name:PC.label, part:(part==='east'?'east':'west'), ts:TS, cols, rows, E, K, B, CH, C, wallDrop:120, colorFn:mtnColor,
    obstacles, blocks:[], chunks:[], gates, waypoint, camp, towers, hills, deco, packAnchors:anchors, herdAnchors };
}
// Buffalo herds (5-8): passive until one of them is hurt, then the whole herd turns on you.
function spawnBuffaloHerd(g, a, id){
  const n = 10 + Math.floor(Math.random()*7);
  for(let i=0;i<n;i++){
    const e = spawnEnemy(g, 'buffalo', {x:a.x+rand(-200,200), y:a.y+rand(-170,170)});
    if(e) e.herdId = id;
  }
}
function spawnRedridgePack(g, anchor, tpl, small){
  const type = Array.isArray(tpl) ? tpl[0][0] : tpl, n = small ? 3+Math.floor(Math.random()*3) : rrPackSize(type);
  for(let i=0;i<n;i++){
    const sp = 90 + n*14;
    spawnEnemy(g, type, {x:anchor.x+rand(-sp,sp), y:anchor.y+rand(-sp,sp)});
  }
}
// v389: the Storm Raptor -- a single, tougher, lightning-biting raptor lurking at a random pack site far from the entrance
const STORM_RAPTOR_PAL = {skin:'#2f6fb0', dark:'#0e2a4a', belly:'#d6ecff', eyeA:'#ffffff', eyeB:'#7fd0ff'};
function spawnStormRaptor(g){
  const R = g.rr, start = R.gates[0];   // (east half: the canyon pass)
  const far = (R.packAnchors||[]).filter(a=>dist(a,start) > 1800);
  const a = far.length ? far[Math.floor(Math.random()*far.length)] : (R.packAnchors||[])[0];
  if(!a) return null;
  const e = spawnEnemy(g, 'raptor', {x:a.x+rand(-60,60), y:a.y+rand(-60,60)});
  if(!e) return null;
  e.stormRaptor = true; e.dmgType = 'lightning'; e.name = 'Storm Raptor';
  e.maxHp = e.hp = Math.round(e.maxHp*4); e.dmg *= 1.35; e.r *= 1.25; e.speed *= 1.08; e.armor = (e.armor||0)+4;
  return e;
}
function drawStormRaptorFx(e){
  const iso = toIso(e.x,e.y), tm = (game.clock||0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for(let i=0;i<3;i++){
    const a0 = tm*3.1 + i*2.1, rx = Math.cos(a0)*e.r*1.5, ry = Math.sin(a0)*e.r*0.7;
    ctx.strokeStyle = 'rgba(150,215,255,'+(0.35+0.35*Math.sin(tm*9+i))+')'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(iso.x+rx, iso.y-14+ry); ctx.lineTo(iso.x+rx*0.5+3, iso.y-26+ry*0.5); ctx.lineTo(iso.x+rx*0.8-3, iso.y-34+ry*0.3); ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.8)';
  ctx.strokeText('Storm Raptor', iso.x, iso.y-e.r*2.4-14); ctx.fillStyle = '#9fdcff'; ctx.fillText('Storm Raptor', iso.x, iso.y-e.r*2.4-14); ctx.restore();
}
function enterRedridge(from, opts){
  opts = opts || {};
  const g = game, p = g.player;
  const part = opts.part || ((opts.atLair || opts.atCrater || opts.fromWest || (opts.atTower && opts.towerId!==1)) ? 'east' : 'west');
  g.scene = 'redridge';
  g.rr = makeRedridge(part);
  g.room = g.rr;
  g.depth = RR_DEPTH;
  if(opts.atWaypoint && g.rr.waypoint){ p.x = g.rr.waypoint.x; p.y = g.rr.waypoint.y + 45; }
  else if(opts.atLair){ const gate = rrGate(g.rr,'lair'); p.x = gate.x; p.y = gate.y - 150; }
  else if(opts.atCrater){ const gate = rrGate(g.rr,'crater'); p.x = gate.x; p.y = gate.y + 150; }
  else if(opts.atBridge){ const gate = rrGate(g.rr,'bridge'); p.x = gate.x; p.y = gate.y + 150; }
  else if(opts.fromWest){ const gate = rrGate(g.rr,'west'); p.x = gate.x + 150; p.y = gate.y; }
  else if(opts.fromEast){ const gate = rrGate(g.rr,'east'); p.x = gate.x - 150; p.y = gate.y; }
  else if(opts.atTower){ const tw = g.rr.towers.find(q=>q.id===opts.towerId) || g.rr.towers[0]; p.x = tw.door.x; p.y = tw.door.y + 80; }
  else { const gate = g.rr.gates[0]; p.x = gate.x + 130; p.y = gate.y; }
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  g.bossKilled = false;
  for(const a of breatheAnchors(g.rr.packAnchors, {gap:560, cell:1300, calm:0.1})) spawnRedridgePack(g, a, RR_PACKS[Math.floor(Math.random()*RR_PACKS.length)]);
  g._herdAlarm = {};
  g.rr.herdAnchors.forEach((a,i)=>spawnBuffaloHerd(g, a, 'bh'+i));
  if(g.rr.part==='east') spawnStormRaptor(g);   // v389: one Storm Raptor somewhere in the canyon (drops the Storm Claw)
  { const ob = g.rr.obstacles; g.enemies = g.enemies.filter(e=>!ob.some(o=>e.x>o.x-e.r && e.x<o.x+o.w+e.r && e.y>o.y-e.r && e.y<o.y+o.h+e.r)); }
  p.crX = undefined;
  showMsg(g.rr.name, 2.0);
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
function drawRedridgeFloor(room, cam){
  const TS = 46, cy = room.h/2;
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const cx = Math.floor(wx/TS), cyy = Math.floor(wy/TS);
      const checker = ((cx+cyy)%2+2)%2;
      const hsh = ((cx*73856093) ^ (cyy*19349663)) & 15;
      const road = Math.abs(wy-cy) < 90 && wx < 500;
      const inCamp = room.camp && Math.hypot(wx-room.camp.x, wy-room.camp.y) < 230;
      if(road) ctx.fillStyle = checker ? '#dcae78' : '#d1a06c';
      else if(inCamp) ctx.fillStyle = checker ? '#a8794a' : '#9c6e42';
      else if(hsh===0) ctx.fillStyle = checker ? '#b46c44' : '#a9613a';
      else ctx.fillStyle = checker ? '#c98a58' : '#bf7f4e';
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
    }
  }
}
function drawRedChunk(c){
  let top='#b8683f', right='#6b301d', front='#8f4a2b';
  if(c.kind==='mesa'){ top='#cf8250'; right='#7a3b22'; front='#a85c36'; }
  drawBlock(c, c.hz, top, right, front);
  const c1=toIso(c.x+c.w,c.y), c2=toIso(c.x+c.w,c.y+c.h), c3=toIso(c.x,c.y+c.h);
  for(let k=1;k*16<c.hz;k++){ const yy=k*16;
    ctx.strokeStyle = (k%3===0)?'rgba(60,20,8,0.28)':'rgba(255,200,150,0.10)'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(c3.x,c3.y-yy); ctx.lineTo(c2.x,c2.y-yy); ctx.lineTo(c1.x,c1.y-yy); ctx.stroke(); }
}
function drawRedDecoIso(d){
  const iso = toIso(d.x,d.y), s=d.s;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s,s);
  if(d.k==='rock'){
    drawShadow(0,0,14,5);
    ctx.fillStyle='#9a5a38'; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-8,-10); ctx.lineTo(3,-13); ctx.lineTo(12,-4); ctx.lineTo(10,2); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#b8734a'; ctx.beginPath(); ctx.moveTo(-8,-10); ctx.lineTo(3,-13); ctx.lineTo(0,-5); ctx.closePath(); ctx.fill();
  } else if(d.k==='cactus'){
    drawShadow(0,0,10,4);
    ctx.strokeStyle='#4f7a3a'; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-9); ctx.lineTo(-8,-11); ctx.lineTo(-8,-18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-13); ctx.lineTo(8,-15); ctx.lineTo(8,-21); ctx.stroke();
  } else {
    ctx.strokeStyle='#e8dcc0'; ctx.lineWidth=2.4; ctx.lineCap='round';
    ctx.beginPath(); ctx.arc(0,-4,9,Math.PI*1.05,Math.PI*1.95); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,-4,6,Math.PI*1.1,Math.PI*1.9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12,1); ctx.lineTo(12,0); ctx.stroke();
  }
  ctx.restore();
}

// ---------------- Redridge Canyon v284: crawlers, buffalo, camp, towers, skyline ----------------
function drawCrawlerIso(e){
  const iso=toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/18;
  drawShadow(iso.x,iso.y,26*s,9*s);
  ctx.save(); ctx.translate(iso.x,iso.y); ctx.scale(face*s,s);
  const walk=e.moving?Math.sin(t*9):0, rear=e.atkAnimT>0?3:0;
  const body=flash?'#fff':'#5c9a3a', dark=flash?'#fff':'#2f5a1c', belly=flash?'#fff':'#a8c46a';
  ctx.strokeStyle=body; ctx.lineWidth=7; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(-16,-12); ctx.quadraticCurveTo(-34,-8+walk*3,-46,-16+Math.sin(t*4)*3); ctx.stroke();
  ctx.strokeStyle=dark; ctx.lineWidth=4;
  for(const [lx,ph] of [[-10,1],[-2,-1],[8,-1],[14,1]]){ ctx.beginPath(); ctx.moveTo(lx,-9); ctx.lineTo(lx+walk*ph*4+(lx>0?5:-3),0); ctx.stroke(); }
  ctx.fillStyle=body; ctx.beginPath(); ctx.ellipse(0,-13,20,10,0,0,7); ctx.fill();
  ctx.fillStyle=belly; ctx.beginPath(); ctx.ellipse(1,-9,15,5,0,0,7); ctx.fill();
  ctx.fillStyle=dark;
  for(let i=-3;i<=3;i++){ ctx.beginPath(); ctx.moveTo(i*5-2,-22+Math.abs(i)); ctx.lineTo(i*5,-28+Math.abs(i)); ctx.lineTo(i*5+2,-22+Math.abs(i)); ctx.fill(); }
  ctx.fillStyle=body; ctx.beginPath(); ctx.ellipse(21,-15-rear,9,6,0.1,0,7); ctx.fill();
  ctx.fillStyle=flash?'#fff':'#c8602e'; ctx.beginPath(); ctx.ellipse(20,-9-rear,4,3,0,0,7); ctx.fill();
  ctx.fillStyle=flash?'#fff':'#e8d84a'; ctx.beginPath(); ctx.arc(24,-19-rear,2,0,7); ctx.fill();
  ctx.fillStyle='#111'; ctx.fillRect(24.4,-19.6-rear,1.2,1.8);
  ctx.restore();
  drawHpBar(iso, 36*s, e.r, e.hp, e.maxHp);   // v419
}
function drawCrawlerTongue(e){
  const ca=Math.cos(e.tDir), sa=Math.sin(e.tDir), L=CRAWLER_TONGUE_LEN, hw=CRAWLER_TONGUE_HW;
  ctx.save();
  if(e.tState==='tele'){
    const frac = clamp(1-e.tT/CRAWLER_TONGUE_WIND,0,1);
    const pts=[[0,-hw],[L,-hw],[L,hw],[0,hw]].map(q=>toIso(e.x+ca*q[0]-sa*q[1], e.y+sa*q[0]+ca*q[1]));
    ctx.beginPath(); pts.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y)); ctx.closePath();
    ctx.fillStyle='rgba(255,90,110,'+(0.08+frac*0.26)+')'; ctx.fill();
    ctx.strokeStyle='rgba(255,120,130,'+(0.45+frac*0.5)+')'; ctx.lineWidth=2.5; ctx.stroke();
  } else {
    const tipD = e.tState==='pull' && e.tGrab ? Math.min(L, dist(e,e.tGrab)) : L*(1-clamp(e.tT/0.2,0,1)*0.2);
    const m0=toIso(e.x+ca*(e.r+6), e.y+sa*(e.r+6)), m1=toIso(e.x+ca*tipD, e.y+sa*tipD);
    ctx.strokeStyle='#e0607a'; ctx.lineWidth=6; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(m0.x,m0.y-16); ctx.lineTo(m1.x,m1.y-14); ctx.stroke();
    ctx.fillStyle='#f08aa0'; ctx.beginPath(); ctx.arc(m1.x,m1.y-14,6,0,7); ctx.fill();
  }
  ctx.restore();
}
function drawBuffaloIso(e){
  const iso=toIso(e.x,e.y), face=e.faceSign||1, t=e.animT||0, flash=e.hitT>0, s=e.r/22;
  drawShadow(iso.x,iso.y,30*s,10*s);
  ctx.save(); ctx.translate(iso.x,iso.y); ctx.scale(face*s,s);
  const walk=e.moving?Math.sin(t*7):0, hot=!!e.aggroed;
  const fur=flash?'#fff':'#5a4030', mane=flash?'#fff':'#33241a', horn=flash?'#fff':'#e0d8bc';
  ctx.strokeStyle=mane; ctx.lineWidth=6; ctx.lineCap='round';
  for(const [lx,ph] of [[-16,1],[-8,-1],[10,-1],[18,1]]){ ctx.beginPath(); ctx.moveTo(lx,-10); ctx.lineTo(lx+walk*ph*4,0); ctx.stroke(); }
  ctx.strokeStyle=fur; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(-26,-20); ctx.quadraticCurveTo(-32,-14,-30,-6+Math.sin(t*3)*2); ctx.stroke();
  ctx.fillStyle=fur; ctx.beginPath(); ctx.ellipse(0,-19,25,13,0,0,7); ctx.fill();
  ctx.fillStyle=mane; ctx.beginPath(); ctx.ellipse(11,-27,14,11,0,0,7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(22,-16,9,11,0,0,7); ctx.fill();
  ctx.fillStyle=fur; ctx.beginPath(); ctx.ellipse(29,-12,8,7,0.2,0,7); ctx.fill();
  ctx.strokeStyle=horn; ctx.lineWidth=2.6; ctx.beginPath(); ctx.moveTo(27,-18); ctx.quadraticCurveTo(25,-27,30,-27); ctx.stroke();
  ctx.fillStyle=hot?'#ff5a3a':'#1a1008'; ctx.beginPath(); ctx.arc(32,-14,1.6,0,7); ctx.fill();
  ctx.restore();
  drawHpBar(iso, 46*s, e.r, e.hp, e.maxHp);   // v419
}
function drawRRCamp(camp, clock){
  const t=clock||0;
  const at=(dx,dy)=>toIso(camp.x+dx, camp.y+dy);
  // barricade stakes
  ctx.save();
  ctx.strokeStyle='#3e2814'; ctx.lineWidth=4; ctx.lineCap='round';
  for(let i=-6;i<=6;i++){ const q=at(i*30, 150+Math.abs(i)*4); ctx.beginPath(); ctx.moveTo(q.x,q.y); ctx.lineTo(q.x+(i%2?2:-2),q.y-22); ctx.stroke(); }
  // tents
  const tent=(dx,dy,col,col2)=>{ const q=at(dx,dy); drawShadow(q.x,q.y,36,10);
    ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(q.x-34,q.y); ctx.lineTo(q.x,q.y-46); ctx.lineTo(q.x+34,q.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle=col2; ctx.beginPath(); ctx.moveTo(q.x,q.y-46); ctx.lineTo(q.x+34,q.y); ctx.lineTo(q.x+8,q.y); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#1a1008'; ctx.beginPath(); ctx.moveTo(q.x-8,q.y); ctx.lineTo(q.x,q.y-20); ctx.lineTo(q.x+8,q.y); ctx.closePath(); ctx.fill(); };
  tent(-110,-30,'#8a7650','#6a5a3a'); tent(95,-70,'#7a6a48','#5a4c30'); tent(-60,70,'#947f56','#6e5c3a');
  // crates and a map board
  const cr=at(70,40); ctx.fillStyle='#6a4a2a'; ctx.fillRect(cr.x-11,cr.y-16,22,16); ctx.fillStyle='#3e2814'; ctx.fillRect(cr.x-11,cr.y-16,22,3);
  const bd=at(-140,50); ctx.fillStyle='#4a3420'; ctx.fillRect(bd.x-2,bd.y-34,3,34); ctx.fillStyle='#d8c898'; ctx.fillRect(bd.x-14,bd.y-40,28,20); ctx.strokeStyle='#8a2a1a'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(bd.x-9,bd.y-24); ctx.lineTo(bd.x-2,bd.y-32); ctx.lineTo(bd.x+8,bd.y-26); ctx.stroke();
  // campfire
  const f=at(30,-10); drawShadow(f.x,f.y,12,4);
  ctx.fillStyle='#4a4038'; for(let i=0;i<6;i++){ const a=i*1.05; ctx.beginPath(); ctx.arc(f.x+Math.cos(a)*9,f.y+Math.sin(a)*4,2.6,0,7); ctx.fill(); }
  const fl=0.8+0.2*Math.sin(t*9); ctx.fillStyle='#ff9a2a'; ctx.beginPath(); ctx.moveTo(f.x-5,f.y); ctx.quadraticCurveTo(f.x,f.y-22*fl,f.x+5,f.y); ctx.fill();
  ctx.fillStyle='#ffe07a'; ctx.beginPath(); ctx.moveTo(f.x-2.5,f.y); ctx.quadraticCurveTo(f.x,f.y-12*fl,f.x+2.5,f.y); ctx.fill();
  ctx.restore();
}
function drawRRWatchtower(tw, clock, lit){
  const t=clock||0, iso=toIso(tw.x,tw.y);
  drawShadow(iso.x,iso.y+34*2.25,58*2.25,18*2.25);
  ctx.save(); ctx.translate(iso.x,iso.y); ctx.scale(2.25,2.25);   // v419: 3x bigger; v456: 25% smaller again
  // stone shaft
  ctx.fillStyle='#8a7a68'; ctx.beginPath(); ctx.moveTo(-42,40); ctx.lineTo(-30,-130); ctx.lineTo(30,-130); ctx.lineTo(42,40); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#6a5c4c'; ctx.beginPath(); ctx.moveTo(8,-130); ctx.lineTo(30,-130); ctx.lineTo(42,40); ctx.lineTo(14,40); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(40,28,18,0.35)'; ctx.lineWidth=1;
  for(let k=0;k<7;k++){ const yy=36-k*24; ctx.beginPath(); ctx.moveTo(-40+k*1.6,yy); ctx.lineTo(40-k*1.6,yy); ctx.stroke(); }
  // slit windows
  ctx.fillStyle='#1a1008'; for(const yy of [-10,-60,-100]){ ctx.fillRect(-3,yy,6,16); }
  // battlement
  ctx.fillStyle='#9a8a76'; ctx.fillRect(-38,-146,76,18);
  for(let i=-3;i<=3;i++){ ctx.fillRect(i*11-4,-158,8,12); }
  // beacon bowl
  ctx.fillStyle='#3a3028'; ctx.beginPath(); ctx.ellipse(0,-150,14,6,0,0,7); ctx.fill();
  if(lit){
    const fl=0.85+0.15*Math.sin(t*10+tw.id);
    const gr=ctx.createRadialGradient(0,-170,4,0,-170,70*fl); gr.addColorStop(0,'rgba(255,200,90,0.75)'); gr.addColorStop(1,'rgba(255,120,30,0)');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,-170,70*fl,0,7); ctx.fill();
    ctx.fillStyle='#ffb040'; ctx.beginPath(); ctx.moveTo(-9,-152); ctx.quadraticCurveTo(0,-186*fl+14,9,-152); ctx.fill();
  }
  // door arch
  ctx.fillStyle='#1c120a'; ctx.beginPath(); ctx.moveTo(-12,40); ctx.lineTo(-12,12); ctx.arc(0,12,12,Math.PI,0); ctx.lineTo(12,40); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// Highward (a floating Templar fortress high above the canyon) and, far east, the black lights of Shadow Keep
function drawRRSkyline(rr, clock){
  const t=clock||0;
  const hx=rr.w*0.42, hy=700, z=520;
  const P=(dx,dy,dz)=>{ const q=toIso(hx+dx, hy+dy); return {x:q.x, y:q.y-z-dz}; };
  ctx.save();
  ctx.globalAlpha=0.92;
  // inverted pyramid: a narrow tip below, widening to a broad parapet above
  const tip=P(0,0,-60), a=P(-330,-170,380), b=P(330,-170,380), c=P(330,170,380), d=P(-330,170,380);
  ctx.fillStyle='#4b4038'; ctx.beginPath(); ctx.moveTo(tip.x,tip.y); ctx.lineTo(a.x,a.y); ctx.lineTo(d.x,d.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#62564a'; ctx.beginPath(); ctx.moveTo(tip.x,tip.y); ctx.lineTo(d.x,d.y); ctx.lineTo(c.x,c.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#392f28'; ctx.beginPath(); ctx.moveTo(tip.x,tip.y); ctx.lineTo(c.x,c.y); ctx.lineTo(b.x,b.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle='#7a6c5c'; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.lineTo(d.x,d.y); ctx.closePath(); ctx.fill();
  // towers on the parapet
  for(const [dx,dy,h2] of [[-220,-60,150],[0,0,230],[220,-60,150],[-120,100,110],[130,100,110]]){
    const base=P(dx,dy,380), top=P(dx,dy,380+h2);
    ctx.fillStyle='#8a7a68'; ctx.fillRect(base.x-22,top.y,44,base.y-top.y);
    ctx.fillStyle='#5a4c3e'; ctx.fillRect(base.x+4,top.y,18,base.y-top.y);
    ctx.fillStyle='#ffcf70'; ctx.globalAlpha=0.6+0.3*Math.sin(t*2+dx); ctx.fillRect(base.x-4,top.y+30,8,12); ctx.globalAlpha=0.92;
  }
  ctx.restore();
  // Shadow Keep: black spires, violet light and a bruised sky, far to the east
  const sk=(dx,dy,dz)=>{ const q=toIso(rr.w-60+dx, rr.h/2+dy); return {x:q.x, y:q.y-dz}; };
  ctx.save(); ctx.globalAlpha=0.55;
  const g0=sk(0,0,260); const gr=ctx.createRadialGradient(g0.x,g0.y,10,g0.x,g0.y,420); gr.addColorStop(0,'rgba(120,40,200,0.45)'); gr.addColorStop(1,'rgba(40,0,80,0)');
  ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(g0.x,g0.y,420,0,7); ctx.fill();
  ctx.globalAlpha=0.85; ctx.fillStyle='#120a1c';
  for(const [dx,dy,hh,ww] of [[0,0,360,50],[-120,-80,260,38],[110,-60,300,44],[-60,90,220,34],[70,110,250,40]]){ const b2=sk(dx,dy,60), t2=sk(dx,dy,hh);
    ctx.beginPath(); ctx.moveTo(b2.x-ww,b2.y); ctx.lineTo(t2.x,t2.y-30); ctx.lineTo(b2.x+ww,b2.y); ctx.closePath(); ctx.fill(); }
  ctx.globalAlpha=0.6+0.3*Math.sin(t*1.6); ctx.fillStyle='#b070ff';
  for(const [dx,dy] of [[0,0],[-120,-80],[110,-60]]){ const q=sk(dx,dy,230); ctx.beginPath(); ctx.arc(q.x,q.y,4,0,7); ctx.fill(); }
  ctx.restore();
}
