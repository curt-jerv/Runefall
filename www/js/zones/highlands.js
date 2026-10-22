// ---------------- Barren Highlands (v459) ----------------
// Open, wind-scoured upland between the Black Marsh and the Mountain Pass: rolling rocky hills, broad plateaus with
// cliff edges (one or two ramps up each), steep impassable ridgelines, shallow ravines, standing boulders, natural stone
// arches and the odd ruined watchtower. Giants roam, wargs prowl, rams graze in herds, rocs circle overhead and troll
// tribes huddle round camp fires on the plateaus. Built on the same height-field terrain engine as the Mountain Pass.
const HL_W = 7600, HL_H = 5400, HL_DEPTH = 32;   // v483: was 30; v516: bigger, a winding route with the Mountain Pass gate in the top-right corner
function makeHighlands(){
  const TS = 50, w = HL_W, h = HL_H, cols = w/TS, rows = h/TS, N = cols*rows, M = 300;
  const gates = [
    {id:'marsh', x:5700, y:h-324, r:70, label:'BLACK MARSH', act:'toMarshFromHighlands', art:true, big:1.0, labelH:80},
    {id:'pass',  x:w-324, y:520,  r:70, label:'MOUNTAIN PASS', act:'toPassFromHighlands', art:true, big:1.0, labelH:80},
  ];
  const marshGate = gates[0], passGate = gates[1];
  const waypoint = {x:marshGate.x-430, y:marshGate.y-360, r:22};
  // v516: the trail switches back twice: west along the south, up the west side, east through the middle, then up the east side to the pass in the top-right corner
  const j = (a)=>rand(-a,a);
  const trail = [{x:marshGate.x, y:marshGate.y}, {x:5560+j(60), y:4560}, {x:4700+j(80), y:4250}, {x:3350+j(80), y:4400}, {x:2100+j(80), y:4050},
                 {x:1450+j(60), y:3500}, {x:1750+j(60), y:2900}, {x:3000+j(80), y:2650}, {x:4400+j(80), y:2850}, {x:5500+j(80), y:2650},
                 {x:6150+j(60), y:2050}, {x:5500+j(80), y:1450}, {x:6300+j(80), y:1000}, {x:w-760, y:680}, {x:passGate.x, y:passGate.y}];
  const trailD = (x,y)=>distToPolyline(trail,x,y).d;
  const keepouts = gates.map(gt=>({x:gt.x,y:gt.y,r:380})).concat([{x:waypoint.x,y:waypoint.y,r:260}]);
  // rolling hills + shallow ravines
  const hills = (x,y)=> 70 + 30*Math.sin(x/760+0.7)*Math.cos(y/880+1.3) + 18*Math.sin((x+y)/470+2) + 12*Math.cos((x-y*0.6)/380);
  const ravines = [];
  for(let k=0;k<3;k++){ const y0 = rand(900, h-900), pts = []; for(let x=M; x<=w-M; x+=500) pts.push({x, y:y0+260*Math.sin(x/900+k*2.1)+rand(-60,60)}); ravines.push(pts); }
  const ravD = (x,y)=>{ let d = 1e9; for(const r of ravines) d = Math.min(d, distToPolyline(r,x,y).d); return d; };
  // broad plateaus: cliff edges, one or two ramps each (troll camps sit on top)
  const plateaus = []; let tries = 0;
  while(plateaus.length < 5 && tries < 4000){ tries++;
    const R = rand(330, 520), x = rand(M+R+300, w-M-R-300), y = rand(M+R+300, h-M-R-300);
    if(trailD(x,y) < R+380 || keepouts.some(k=>dist({x,y},k)<k.r+R+200) || plateaus.some(q=>dist(q,{x,y})<q.R+R+900)) continue;
    const tp = distToPolyline(trail,x,y).p, ra = Math.atan2(tp.y-y, tp.x-x);   // first ramp faces the trail
    plateaus.push({x, y, R, up:rand(70,95), ph:Math.random()*6.28, ramps:[ra].concat(Math.random()<0.6 ? [ra+Math.PI*rand(0.7,1.3)] : [])});
  }
  // steep ridgelines: long, narrow, impassable rock spines
  // two long barrier ridges between the legs of the trail (each reaches one edge of the map, leaving the turn at the other end), so the way really winds
  const ridges = [{x0:2500, y0:3560, x1:w-250, y1:3500, hw:70}, {x0:800, y0:1880, x1:5000, y1:1920, hw:70}]; tries = 0;
  while(ridges.length < 6 && tries < 4000){ tries++;
    const x0 = rand(M+400, w-M-400), y0 = rand(M+400, h-M-400), a = Math.random()*6.28, L = rand(700, 1300), x1 = x0+Math.cos(a)*L, y1 = y0+Math.sin(a)*L;
    if(x1<M+300 || x1>w-M-300 || y1<M+300 || y1>h-M-300) continue;
    let ok = true; for(let t=0;t<=1 && ok;t+=0.1){ const px = x0+(x1-x0)*t, py = y0+(y1-y0)*t; if(trailD(px,py) < 330 || keepouts.some(k=>dist({x:px,y:py},k)<k.r+200) || plateaus.some(q=>dist(q,{x:px,y:py})<q.R+420)) ok = false; }
    if(!ok || ridges.some(r=>distToPolyline([{x:r.x0,y:r.y0},{x:r.x1,y:r.y1}], (x0+x1)/2, (y0+y1)/2).d < 700)) continue;
    ridges.push({x0,y0,x1,y1, hw:rand(55,80)});
  }
  const plateauAt = (x,y)=>{ for(const q of plateaus){ const d = dist(q,{x,y}); const th = Math.atan2(y-q.y, x-q.x), Rr = q.R*(1+0.14*Math.sin(3*th+q.ph)+0.06*Math.sin(7*th)); if(d < Rr+580) return {q, d, Rr, th}; } return null; };
  const elevAt = (x,y)=>{
    let e = hills(x,y);
    const rd = ravD(x,y); if(rd < 230){ const t = 1-rd/230; e -= 48*t*t*(3-2*t); }
    const pl = plateauAt(x,y);
    if(pl){
      const q = pl.q, top = hills(q.x,q.y)+q.up;
      if(pl.d <= pl.Rr) e = top + 6*Math.sin(x/90)*Math.cos(y/110);
      else {
        const onRamp = q.ramps.some(a=>{ let da = Math.abs(((pl.th-a)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI); return da < 0.36; });
        const band = onRamp ? 560 : 40;
        if(pl.d < pl.Rr+band){ const t = (pl.d-pl.Rr)/band; e = top + (e-top)*t; }
      }
    }
    for(const r of ridges){ const dd = distToPolyline([{x:r.x0,y:r.y0},{x:r.x1,y:r.y1}],x,y).d; if(dd < r.hw+30){ const t = dd < r.hw ? 1 : 1-(dd-r.hw)/30; e = Math.max(e, hills(x,y) + 130*t); } }
    return e;
  };
  // walkable mask: inset rectangle bitten by rock at the edges, jagged outcrops inside
  const W0 = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){ const x=(ix+0.5)*TS, y=(iy+0.5)*TS; W0[iy*cols+ix] = (x>=M && x<=w-M && y>=M && y<=h-M) ? 1 : 0; }
  const nearPlateau = (x,y,pad)=>plateaus.some(q=>dist(q,{x,y})<q.R*1.2+580+pad);
  const blobs = [];
  const addBlob = (x,y,r)=>{ if(keepouts.some(c=>dist({x,y},c)<c.r+r*0.4) || nearPlateau(x,y,r*0.5) || trailD(x,y) < r+110) return; blobs.push({x,y,r}); };
  for(let i=0;i<130;i++){
    const side = Math.floor(Math.random()*4), t = rand(M, w-M), o = rand(-30,80);
    if(side===0) addBlob(t, M+o, rand(90,230)); else if(side===1) addBlob(t, h-M-o, rand(90,230));
    else if(side===2) addBlob(M+o, t, rand(90,230)); else addBlob(w-M-o, t, rand(90,230));
  }
  for(let i=0;i<55;i++) addBlob(rand(M+250, w-M-250), rand(M+250, h-M-250), rand(55,120));   // jagged outcrops
  for(const b of blobs){
    const ix0 = Math.max(0,Math.floor((b.x-b.r)/TS)), ix1 = Math.min(cols-1,Math.floor((b.x+b.r)/TS));
    const iy0 = Math.max(0,Math.floor((b.y-b.r)/TS)), iy1 = Math.min(rows-1,Math.floor((b.y+b.r)/TS));
    for(let iy=iy0;iy<=iy1;iy++) for(let ix=ix0;ix<=ix1;ix++) if(dist({x:(ix+0.5)*TS,y:(iy+0.5)*TS},b)<b.r) W0[iy*cols+ix] = 0;
  }
  // heights + wall rings (same recipe as the Mountain Pass)
  const E = new Float32Array(N), K = new Uint8Array(N), RING = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){ const i = iy*cols+ix; if(W0[i]){ E[i] = elevAt((ix+0.5)*TS,(iy+0.5)*TS); K[i] = 0; } }
  const WALL_ADD = [0, 60, 90, 110, 120, 120, 120];
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
      if(K[j]<3 && Math.abs(E[i]-E[j]) > CR_STEP){ B[i] = 1; break; }
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
  // ground colours: faded ochre grass and dusty soil in patches, exposed stone on the heights, a worn dirt trail
  const C = new Uint8Array(N*3);
  const mix = (a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  // v516: the top-right corner (the way to the Mountain Pass) turns to patchy snow, matching the west end of the Pass
  const SNOWC=[228,236,242], snowK = (x,y)=> Math.pow(clamp(1.05-dist({x,y},passGate)/2700,0,1),1.2)*0.62;
  const OCHRE=[158,138,90], DRY=[140,124,84], SOIL=[112,94,72], DUST=[128,110,86], OLIVE=[82,86,56], STONE=[120,120,116], STONED=[78,80,84], TRAIL=[146,124,96];
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix, x = (ix+0.5)*TS, y = (iy+0.5)*TS, hh = tileHash(ix,iy), h2 = tileHash(ix*3+7,iy*5+1);
    let c;
    if(K[i]>=3){ c = mix(STONED, STONE, clamp(E[i]/360,0,1)*0.7 + (h2>0.6?0.18:0)); const sk0 = snowK(x,y); if(sk0>0) c = mix(c, SNOWC, sk0*(h2>0.5?0.75:0.35)); }
    else {
      const patch = 0.5 + 0.5*Math.sin(x/310+1.1)*Math.cos(y/270+0.4) + (hh-0.5)*0.35;
      c = patch > 0.55 ? mix(DRY, OCHRE, clamp((patch-0.55)*2.4,0,1)) : mix(SOIL, DUST, clamp(patch*1.6,0,1));
      if(h2 > 0.9) c = mix(c, OLIVE, 0.55);
      const hi = clamp((E[i]-100)/120,0,1); if(hi>0) c = mix(c, STONE, hi*(h2>0.4?0.75:0.45));
      if(ravD(x,y) < 120) c = mix(c, SOIL, 0.35);
      const td = trailD(x,y); if(td < 70) c = mix(c, TRAIL, td < 46 ? 0.85 : 0.85*(70-td)/24);
      { const sk = snowK(x,y); if(sk>0 && hh < sk*1.5) c = mix(c, td < 60 ? [196,204,212] : SNOWC, 0.55+0.4*h2); }
      if(((ix+iy)&1)) c = mix(c, [255,245,220], 0.025);
    }
    C[i*3] = c[0]; C[i*3+1] = c[1]; C[i*3+2] = c[2];
  }
  const walk = (x,y)=>{ const ix=Math.floor(x/TS), iy=Math.floor(y/TS); if(ix<0||iy<0||ix>=cols||iy>=rows) return false; const i=iy*cols+ix; return !B[i] && K[i]<3 && Math.abs(CH[i*4]-CH[i*4+2])<14; };
  const flat = (x,y,d)=>walk(x,y)&&walk(x+d,y)&&walk(x-d,y)&&walk(x,y+d)&&walk(x,y-d);
  const deco = [];
  const solid = (x,y,ww,hh)=>{ obstacles.push({x:x-ww/2, y:y-hh/2, w:ww, h:hh, isProp:true, hlProp:true}); };
  const freeSpot = (x,y,d,trailPad)=> flat(x,y,d) && trailD(x,y) > (trailPad||90) && !keepouts.some(k=>dist({x,y},k)<k.r*0.6) && !deco.some(o=>o.solid && dist(o,{x,y}) < (o.rad||40)+d);
  // troll camps on the plateaus (and a couple in the open)
  const camps = [];
  // v516: a camp (fire, logs, tent, bones) needs a wide level patch -- no cliff lip, ridge or boulder band anywhere within ~300 of the fire
  const campClear = (x,y,R0)=>{ R0 = R0||300; if(!walk(x,y)) return false; const ix0 = Math.max(0,Math.floor((x-R0)/TS)), ix1 = Math.min(cols-1,Math.floor((x+R0)/TS)), iy0 = Math.max(0,Math.floor((y-R0)/TS)), iy1 = Math.min(rows-1,Math.floor((y+R0)/TS)); for(let iy=iy0;iy<=iy1;iy++) for(let ix=ix0;ix<=ix1;ix++){ if(dist({x:(ix+0.5)*TS,y:(iy+0.5)*TS},{x,y})>R0) continue; const i = iy*cols+ix; if(B[i] || K[i]>=3 || Math.abs(E[i]-E[Math.floor(y/TS)*cols+Math.floor(x/TS)])>CR_STEP) return false; } return ridges.every(r=>distToPolyline([{x:r.x0,y:r.y0},{x:r.x1,y:r.y1}],x,y).d > R0+120); };
  for(const q of plateaus){ if(camps.length>=4) break; for(let k=0;k<12;k++){ const x = q.x+rand(-90,90), y = q.y+rand(-90,90); if(campClear(x,y)){ camps.push({x,y}); break; } } }
  for(tries=0; camps.length<5 && tries<9000; tries++){ const x = rand(M+400,w-M-400), y = rand(M+400,h-M-400); if(freeSpot(x,y,140,420) && campClear(x,y, tries<6000 ? 300 : 240) && !camps.some(c=>dist(c,{x,y})<1300)) camps.push({x,y}); }
  for(const c of camps){
    deco.push({k:'campfire', x:c.x, y:c.y, s:1, solid:true, rad:70}); solid(c.x, c.y, 40, 40);
    for(let a=0;a<6.28;a+=6.28/3) deco.push({k:'sitlog', x:c.x+Math.cos(a+0.4)*95, y:c.y+Math.sin(a+0.4)*95, r:a+0.4+Math.PI/2, s:1});
    deco.push({k:'hidetent', x:c.x+150, y:c.y-120, s:1.1, solid:true, rad:60}); solid(c.x+150, c.y-120, 70, 60);
    deco.push({k:'bones', x:c.x-120, y:c.y+110, s:1.2});
  }
  // ruined watchtowers, broken walls and ancient monuments (accents)
  for(let n=0, t=0; n<3 && t<4000; t++){ const x = rand(M+400,w-M-400), y = rand(M+400,h-M-400); if(!freeSpot(x,y,110,160)) continue; deco.push({k:'ruintower', x, y, s:rand(0.95,1.15), solid:true, rad:110, seed:Math.random()}); solid(x,y,110,110); n++; }
  for(let n=0, t=0; n<12 && t<4000; t++){ const x = rand(M+300,w-M-300), y = rand(M+300,h-M-300); if(!freeSpot(x,y,90,130)) continue;
    const horiz = Math.random()<0.5, len = rand(110,240), hz = rand(18,40), ww = horiz?len:22, hh2 = horiz?22:len;
    obstacles.push({x:x-ww/2, y:y-hh2/2, w:ww, h:hh2, col:['#8a8a84','#3e3f42','#5c5d5e'], hz}); deco.push({k:'wallmark', x, y, solid:true, rad:len/2}); n++; }
  for(let n=0, t=0; n<2 && t<3000; t++){ const x = rand(M+600,w-M-600), y = rand(M+600,h-M-600); if(!freeSpot(x,y,170,220)) continue;   // stone circles
    for(let k=0;k<7;k++){ const a = k/7*6.283, sx = x+Math.cos(a)*150, sy = y+Math.sin(a)*150; deco.push({k:'menhir', x:sx, y:sy, s:rand(0.9,1.3), lean:rand(-0.15,0.15), broken:Math.random()<0.3, solid:true, rad:30}); solid(sx,sy,26,26); }
    deco.push({k:'monument', x, y, s:1.2, solid:true, rad:50}); solid(x,y,44,44); n++; }
  for(let n=0, t=0; n<5 && t<3000; t++){ const x = rand(M+300,w-M-300), y = rand(M+300,h-M-300); if(!freeSpot(x,y,70,120)) continue; deco.push({k:'monument', x, y, s:rand(0.8,1.1), solid:true, rad:45}); solid(x,y,36,36); n++; }
  // natural stone arches (walk under them)
  for(let n=0, t=0; n<4 && t<3000; t++){ const x = rand(M+400,w-M-400), y = rand(M+400,h-M-400); if(!freeSpot(x,y,150,140)) continue;
    const ax = Math.random()<0.5; const dx = ax?120:0, dy = ax?0:120;
    deco.push({k:'arch', x, y, ax, s:rand(1,1.25), solid:true, rad:150}); solid(x-dx, y-dy, 54, 54); solid(x+dx, y+dy, 54, 54); n++; }
  // enormous standing boulders
  for(let n=0, t=0; n<46 && t<6000; t++){ const x = rand(M+150,w-M-150), y = rand(M+150,h-M-150); if(!freeSpot(x,y,60,110)) continue; const s = rand(0.9,1.8); deco.push({k:'boulder', x, y, s, seed:Math.random(), solid:true, rad:40*s}); solid(x,y,52*s,46*s); n++; }
  // twisted trees, hardy pine clusters, thorny shrubs, dry grass
  for(let n=0, t=0; n<70 && t<6000; t++){ const x = rand(M+100,w-M-100), y = rand(M+100,h-M-100); if(!freeSpot(x,y,30,70)) continue; deco.push({k:'twisted', x, y, s:rand(0.9,1.5), seed:Math.random(), solid:true, rad:24}); solid(x,y,16,16); n++; }
  for(let n=0, t=0; n<12 && t<4000; t++){ const cx = rand(M+300,w-M-300), cy = rand(M+300,h-M-300); if(!freeSpot(cx,cy,80,150)) continue;
    for(let k=0;k<5+Math.floor(Math.random()*5);k++){ const x = cx+rand(-150,150), y = cy+rand(-120,120); if(!flat(x,y,24) || trailD(x,y)<80) continue; deco.push({k:'pine', x, y, s:rand(0.9,1.4), solid:true, rad:22}); solid(x,y,16,16); } n++; }
  for(let n=0, t=0; n<220 && t<8000; t++){ const x = rand(M+60,w-M-60), y = rand(M+60,h-M-60); if(!walk(x,y) || trailD(x,y)<55) continue; deco.push({k:'shrub', x, y, s:rand(0.7,1.3), seed:Math.random()}); n++; }
  for(let n=0, t=0; n<900 && t<12000; t++){ const x = rand(M+40,w-M-40), y = rand(M+40,h-M-40); if(!walk(x,y) || trailD(x,y)<48) continue; deco.push({k:'grass', x, y, s:rand(0.8,1.5), c:Math.random()<0.5 ? '#a8925a' : '#8e8a52'}); n++; }
  for(let n=0, t=0; n<40 && t<4000; t++){ const x = rand(M+60,w-M-60), y = rand(M+60,h-M-60); if(!walk(x,y)) continue; deco.push({k: Math.random()<0.5 ? 'pebbles' : 'cairn', x, y, s:rand(0.7,1.2)}); n++; }
  // snowy pines, ice crags and drifts thicken toward the pass; barren scrub thins out
  for(let i=deco.length-1;i>=0;i--){ const d0 = deco[i]; if((d0.k==='grass'||d0.k==='shrub'||d0.k==='twisted') && snowK(d0.x,d0.y) > 0.28 + Math.random()*0.2) deco.splice(i,1); }
  for(let n=0, t=0; n<130 && t<9000; t++){ const x = rand(w-3000,w-M-60), y = rand(M+60,2700); if(snowK(x,y) < 0.12+Math.random()*0.3 || !walk(x,y) || trailD(x,y)<85) continue;
    if(dist({x,y},passGate)<260) continue;
    const q = Math.random(); deco.push(q<0.38 ? {k:'pine', x, y, s:rand(0.9,1.4)} : q<0.6 ? {k:'crag', x, y, s:rand(0.8,1.3), h:rand(55,105)} : q<0.82 ? {k:'drift', x, y, s:rand(0.8,1.4)} : {k:'rock', x, y, s:rand(0.8,1.3)}); n++; }
  deco.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  // anchors for packs, herds, giants and rocs
  const okAnchor = (x,y,d)=> flat(x,y,d||70) && dist({x,y},marshGate)>700 && dist({x,y},passGate)>600 && dist({x,y},waypoint)>600 && !keepouts.some(k=>dist({x,y},k)<k.r+40) && !camps.some(c=>dist(c,{x,y})<500);
  const pick = (n, d, gap)=>{ const out = []; let tt = 0; while(out.length<n && tt<40000){ tt++; const x=rand(M+150,w-M-150), y=rand(M+150,h-M-150); if(!okAnchor(x,y,d) || out.some(a=>dist(a,{x,y})<gap)) continue; out.push({x,y}); } return out; };
  const packAnchors = pick(30, 70, 360), herdAnchors = pick(6, 150, 900), giantAnchors = pick(7, 100, 1100), rocAnchors = pick(8, 40, 900);
  return { isMtn:true, hl:true, w, h, depth:HL_DEPTH, name:'Barren Highlands', ts:TS, cols, rows, E, K, B, CH, C, wallDrop:140, colorFn:mtnColor,
    obstacles, gates, waypoint, trail, plateaus, ridges, camps, deco, packAnchors, herdAnchors, giantAnchors, rocAnchors, edgeLines:true, roadPolys:[{pts:trail, hw:46}], gatesForTest:{marsh:marshGate, pass:passGate, wp:waypoint} };
}
function hlGate(hl, id){ return (hl.gates||[]).find(gt=>gt.id===id) || hl.gates[0]; }
function enterHighlands(opts){
  opts = opts || {};
  const g = game, p = g.player;
  g.scene = 'highlands';
  g.hl = makeHighlands();
  g.room = g.hl;
  g.depth = HL_DEPTH;
  if(opts.atWaypoint){ p.x = g.hl.waypoint.x; p.y = g.hl.waypoint.y + 40; }
  else if(opts.fromPass){ const gt = hlGate(g.hl,'pass'); p.x = gt.x - 130; p.y = gt.y + 40; }
  else { const gt = hlGate(g.hl,'marsh'); p.x = gt.x; p.y = gt.y - 130; }
  p.crX = undefined;
  g.hl.entrySpawn = {x:p.x, y:p.y};
  p.reachedHighlandsZone = true;
  g.enemies = []; g.projectiles=[]; g.loot=[]; g.portal=null; g.chest=null; g.shieldThrow=null; g.portalIsBoss=false; g.traps=[]; g.lastKillPos=null;
  g.hlThunderT = rand(6, 14); g.hlFlash = 0;
  showMsg('The Barren Highlands', 2.0);
  const R = g.hl;
  let pid = 1;
  // wargs prowl in packs; a few loose packs of wargs mixed with a roc or two
  for(const a of breatheAnchors(R.packAnchors, {gap:420, cell:1200})){
    const n = 4 + Math.floor(Math.random()*3), id = 'hlp'+(pid++);
    for(let i=0;i<n;i++){ const e = spawnEnemy(g, 'warg', {x:a.x+rand(-120,120), y:a.y+rand(-120,120)}); if(e) e.packId = id; }
  }
  // rams graze in herds: passive until one is hurt, then the whole herd charges
  R.herdAnchors.forEach((a,k)=>{ const n = 4 + Math.floor(Math.random()*3); for(let i=0;i<n;i++){ const e = spawnEnemy(g, 'ram', {x:a.x+rand(-200,200), y:a.y+rand(-160,160)}); if(e){ e.herdId = 'hlram'+k; e.wanderRadius = 160; } } });
  // giants wander alone, slowly, across the open ground
  for(const a of R.giantAnchors){ const e = spawnEnemy(g, 'giant', {x:a.x, y:a.y}); if(e) e.wanderRadius = 320; }
  // rocs circle in twos and threes
  for(const a of R.rocAnchors){ const n = 2 + (Math.random()<0.4 ? 1 : 0); for(let i=0;i<n;i++) spawnEnemy(g, 'roc', {x:a.x+rand(-90,90), y:a.y+rand(-90,90)}); }
  // troll tribes huddle round their fires, one elder per tribe
  R.camps.forEach((c,k)=>{
    const id = 'hltroll'+k, n = 4 + Math.floor(Math.random()*2);
    for(let i=0;i<n;i++){ const a = i/n*6.283 + 0.3; const e = spawnEnemy(g, 'mtroll', {x:c.x+Math.cos(a)*75, y:c.y+Math.sin(a)*75}); if(e){ e.packId = id; e.wanderRadius = 18; e.campFire = c; } }
    const el = spawnEnemy(g, 'trollelder', {x:c.x+rand(-30,30), y:c.y-110}); if(el){ el.packId = id; el.wanderRadius = 14; el.campFire = c; }
  });
  { const ob = R.obstacles; g.enemies = g.enemies.filter(e=>e.flying || !ob.some(o=>e.x>o.x-e.r && e.x<o.x+o.w+e.r && e.y>o.y-e.r && e.y<o.y+o.h+e.r)); }
  owPoiRoll(g);   // v527: caches, a shrine, a guarded hoard
  g.followers = [];
  ensureFollowers(g);
  for(const f of g.followers){ f.x = p.x; f.y = p.y; }
  document.getElementById('buttons').style.display = 'flex';
  document.getElementById('actionCluster').style.display = 'block';
  updateInteractPrompt(null);
}
// highland props
function drawHlDecoIso(d, clock){
  const k = d.k;
  if(k==='grass'){ drawGrassTuftIso(d); return; }
  if(k==='pine'){ drawMtnDeco({k:'pine', x:d.x, y:d.y, s:d.s}); return; }
  if(k==='cairn'){ drawMtnDeco({k:'cairn', x:d.x, y:d.y, s:d.s}); return; }
  if(k==='crag' || k==='drift' || k==='rock'){ drawMtnDeco(d); return; }   // v516: the snowy corner by the pass
  if(k==='wallmark') return;
  const iso = toIso(d.x, d.y), s = d.s||1, t = clock||0;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if(k==='boulder'){
    ctx.scale(s, s); drawShadow(0, 4, 30, 11);
    const sd = d.seed||0.5, j = (n)=>Math.sin(sd*40+n)*4;
    const gr = ctx.createLinearGradient(-26,-46,24,4); gr.addColorStop(0,'#a2a09a'); gr.addColorStop(0.6,'#76767a'); gr.addColorStop(1,'#4a4b50');
    ctx.fillStyle = gr; ctx.strokeStyle = '#2e2f33'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-28,2); ctx.lineTo(-30+j(1),-18); ctx.lineTo(-18+j(2),-40); ctx.lineTo(2+j(3),-48); ctx.lineTo(20+j(4),-38); ctx.lineTo(28,-16+j(5)); ctx.lineTo(24,2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(30,30,34,0.5)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-8,-40); ctx.lineTo(-2,-20); ctx.lineTo(-10,-6); ctx.moveTo(12,-34); ctx.lineTo(8,-14); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(-18,-40); ctx.lineTo(2,-48); ctx.lineTo(-4,-30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(96,104,66,0.75)'; ctx.beginPath(); ctx.ellipse(-12,-2,12,4,0,0,7); ctx.fill();   // lichen at the foot
  } else if(k==='twisted'){
    ctx.scale(s, s); drawShadow(0, 2, 18, 6);
    const sw = Math.sin(t*1.6 + (d.seed||0)*9)*1.6;
    ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(-8,-14, 10,-24, 2,-38); ctx.stroke();
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(2,-38); ctx.quadraticCurveTo(14,-46,22+sw,-44); ctx.moveTo(1,-30); ctx.quadraticCurveTo(-12,-38,-20+sw,-48); ctx.moveTo(2,-38); ctx.quadraticCurveTo(0,-50,6+sw,-58); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(22+sw,-44); ctx.lineTo(28+sw,-48); ctx.moveTo(-20+sw,-48); ctx.lineTo(-26+sw,-46); ctx.stroke();
    ctx.fillStyle = '#4a5030'; for(const [lx,ly,r] of [[24,-46,6],[-21,-50,7],[6,-60,6],[10,-44,4]]){ ctx.beginPath(); ctx.ellipse(lx+sw,ly,r,r*0.6,0,0,7); ctx.fill(); }
  } else if(k==='shrub'){
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(0,1,13,4,0,0,7); ctx.fill();
    ctx.strokeStyle = '#5a4a30'; ctx.lineWidth = 1.2;
    for(let i=0;i<9;i++){ const a = -Math.PI*(0.1+0.8*i/8), L = 9+((d.seed*10+i)%4)*2; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*L, Math.sin(a)*L*0.9-2); ctx.stroke(); }
    ctx.fillStyle = '#5c5e36'; ctx.beginPath(); ctx.ellipse(-3,-6,6,4,0,0,7); ctx.ellipse(4,-5,5,3.5,0,0,7); ctx.fill();
    ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.arc(-5,-8,1.2,0,7); ctx.arc(5,-7,1.1,0,7); ctx.fill();   // dry red berries
  } else if(k==='pebbles'){
    ctx.scale(s, s); ctx.fillStyle = '#7e7c76';
    for(const [px,py,r] of [[-6,0,3],[3,2,2.4],[8,-1,2],[-1,-3,1.8]]){ ctx.beginPath(); ctx.ellipse(px,py,r,r*0.6,0,0,7); ctx.fill(); }
  } else if(k==='bones'){
    ctx.scale(s, s); ctx.strokeStyle = '#d8d0bc'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(-10,-2); ctx.lineTo(8,2); ctx.moveTo(-4,4); ctx.lineTo(6,-5); ctx.stroke();
    ctx.fillStyle = '#e4dcc8'; ctx.beginPath(); ctx.ellipse(12,-4,5,4,0,0,7); ctx.fill(); ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(11,-5,1,0,7); ctx.arc(14,-5,1,0,7); ctx.fill();
  } else if(k==='menhir'){
    ctx.scale(s, s); drawShadow(0,2,14,5); ctx.rotate(d.lean||0);
    const H = d.broken ? 34 : 62;
    const gr = ctx.createLinearGradient(-10,0,10,0); gr.addColorStop(0,'#9a9890'); gr.addColorStop(1,'#5a5a5c');
    ctx.fillStyle = gr; ctx.strokeStyle = '#2e2e30'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-10,0); ctx.lineTo(-11,-H*0.7); ctx.lineTo(-6,-H); ctx.lineTo(d.broken?2:5,-H-(d.broken?-4:3)); ctx.lineTo(10,-H*0.75); ctx.lineTo(10,0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(100,110,70,0.7)'; ctx.fillRect(-10,-16,6,14);
    ctx.strokeStyle = 'rgba(40,40,44,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4,-H*0.5); ctx.lineTo(2,-H*0.45); ctx.lineTo(-1,-H*0.35); ctx.stroke();
  } else if(k==='monument'){
    ctx.scale(s, s); drawShadow(0,3,26,9);
    ctx.fillStyle = '#5e5e60'; ctx.fillRect(-22,-10,44,10); ctx.fillStyle = '#6e6e70'; ctx.fillRect(-16,-18,32,8);
    const gr = ctx.createLinearGradient(-9,0,9,0); gr.addColorStop(0,'#a4a29a'); gr.addColorStop(1,'#62626a');
    ctx.fillStyle = gr; ctx.strokeStyle = '#2e2e30'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-9,-18); ctx.lineTo(-7,-78); ctx.lineTo(0,-90); ctx.lineTo(7,-78); ctx.lineTo(9,-18); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,40,46,0.55)'; ctx.lineWidth = 1.2;   // weathered carvings
    for(let i=0;i<4;i++){ const y = -30-i*11; ctx.beginPath(); ctx.moveTo(-4,y); ctx.lineTo(0,y-4); ctx.lineTo(4,y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(120,96,64,0.5)'; ctx.beginPath(); ctx.ellipse(10,-2,16,5,0,0,7); ctx.fill();   // half-buried in drifted soil
  } else if(k==='arch'){
    ctx.restore(); drawHlArch(d); return;
  } else if(k==='ruintower'){
    ctx.restore(); drawHlRuinTower(d); return;
  } else if(k==='campfire'){
    drawShadow(0,2,26,9);
    ctx.fillStyle = '#4a4440'; for(let a=0;a<6.28;a+=0.7){ ctx.beginPath(); ctx.ellipse(Math.cos(a)*18, Math.sin(a)*7, 5, 3.4, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#3a2614'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12,2); ctx.lineTo(12,-4); ctx.moveTo(-10,-4); ctx.lineTo(10,3); ctx.stroke();
    const fl = Math.sin(t*9+d.x)*2.5, gl = ctx.createRadialGradient(0,-10,2,0,-10,70);
    gl.addColorStop(0,'rgba(255,170,70,0.5)'); gl.addColorStop(1,'rgba(255,140,40,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0,-10,70,0,7); ctx.fill();
    ctx.fillStyle = '#e2602a'; ctx.beginPath(); ctx.moveTo(-10,0); ctx.quadraticCurveTo(-8,-18-fl,0,-28-fl); ctx.quadraticCurveTo(8,-18+fl,10,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd070'; ctx.beginPath(); ctx.moveTo(-5,0); ctx.quadraticCurveTo(0,-14-fl,5,0); ctx.closePath(); ctx.fill();
    for(let i=0;i<4;i++){ const ph = (t*0.6+i*0.25)%1; ctx.fillStyle = 'rgba(120,120,120,'+(0.35*(1-ph)).toFixed(2)+')'; ctx.beginPath(); ctx.arc(Math.sin(t+i)*6, -30-ph*50, 4+ph*8, 0, 7); ctx.fill(); }
  } else if(k==='sitlog'){
    ctx.rotate(0); const a = d.r||0;
    const A = {x:Math.cos(a)*22, y:Math.sin(a)*22*0.5}; ctx.strokeStyle = '#4a3420'; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(-A.x, -A.y-4); ctx.lineTo(A.x, A.y-4); ctx.stroke();
    ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.ellipse(A.x, A.y-4, 4.5, 4.5, 0, 0, 7); ctx.fill();
  } else if(k==='hidetent'){
    ctx.scale(s, s); drawShadow(0,4,40,14);
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26,0); ctx.lineTo(0,-62); ctx.lineTo(26,0); ctx.moveTo(-4,-70); ctx.lineTo(0,-62); ctx.lineTo(6,-72); ctx.stroke();
    ctx.fillStyle = '#7a6448'; ctx.beginPath(); ctx.moveTo(-30,0); ctx.lineTo(0,-60); ctx.lineTo(30,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5e4a34'; ctx.beginPath(); ctx.moveTo(0,-60); ctx.lineTo(30,0); ctx.lineTo(8,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a1e14'; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(0,-26); ctx.lineTo(8,0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,28,18,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-18,-24); ctx.lineTo(-10,-20); ctx.moveTo(14,-30); ctx.lineTo(20,-22); ctx.stroke();
    ctx.fillStyle = '#e0d6c0'; ctx.beginPath(); ctx.arc(0,-48,4,0,7); ctx.fill();   // a skull totem over the flap
  }
  ctx.restore();
}
function drawHlArch(d){
  const s = d.s||1, ax = d.ax, sp = 120;
  const A = toIso(d.x-(ax?sp:0), d.y-(ax?0:sp)), Bp = toIso(d.x+(ax?sp:0), d.y+(ax?0:sp));
  const H = 150*s;
  drawShadow(A.x, A.y+4, 34, 12); drawShadow(Bp.x, Bp.y+4, 34, 12);
  ctx.save(); ctx.lineJoin = 'round';
  const leg = (P, flip)=>{
    const gr = ctx.createLinearGradient(P.x-26, 0, P.x+26, 0); gr.addColorStop(0,'#9a958c'); gr.addColorStop(1,'#5a5a5e');
    ctx.fillStyle = gr; ctx.strokeStyle = '#2e2e30'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(P.x-30, P.y+2); ctx.lineTo(P.x-26, P.y-H*0.55); ctx.lineTo(P.x-20*flip-4, P.y-H*0.85); ctx.lineTo(P.x+22, P.y-H*0.8); ctx.lineTo(P.x+28, P.y-H*0.45); ctx.lineTo(P.x+30, P.y+2); ctx.closePath(); ctx.fill(); ctx.stroke();
  };
  leg(A, 1); leg(Bp, -1);
  // the span: a thick, weathered band of rock between the two legs
  const mx = (A.x+Bp.x)/2, my = Math.min(A.y,Bp.y) - H*1.05;
  const gr = ctx.createLinearGradient(0, my-30, 0, my+50); gr.addColorStop(0,'#a8a398'); gr.addColorStop(1,'#5e5c5e');
  ctx.fillStyle = gr; ctx.strokeStyle = '#2e2e30'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(A.x-28, A.y-H*0.7); ctx.quadraticCurveTo(mx, my-46, Bp.x+28, Bp.y-H*0.7);
  ctx.lineTo(Bp.x+18, Bp.y-H*0.5); ctx.quadraticCurveTo(mx, my+24, A.x-18, A.y-H*0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(40,38,40,0.45)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(A.x-10, A.y-H*0.62); ctx.quadraticCurveTo(mx, my-10, Bp.x+10, Bp.y-H*0.62); ctx.stroke();
  ctx.fillStyle = 'rgba(96,104,66,0.7)'; ctx.beginPath(); ctx.ellipse(mx, my-14, 30, 6, 0, 0, 7); ctx.fill();   // tufts on top
  ctx.restore();
}
function drawHlRuinTower(d){
  const iso = toIso(d.x, d.y), s = d.s||1, sd = d.seed||0.4;
  ctx.save(); ctx.translate(iso.x, iso.y); ctx.scale(s, s); ctx.lineJoin = 'round';
  drawShadow(0, 6, 70, 26);
  // rubble skirt
  ctx.fillStyle = '#6a6862'; for(let i=0;i<14;i++){ const a = i/14*6.28 + sd, r = 58+((i*37)%11); ctx.beginPath(); ctx.ellipse(Math.cos(a)*r, Math.sin(a)*r*0.45+2, 9, 5, a, 0, 7); ctx.fill(); }
  const H0 = 150, topL = 120 + sd*30, topR = 70 + (1-sd)*40;
  const gr = ctx.createLinearGradient(-50,0,50,0); gr.addColorStop(0,'#a09c92'); gr.addColorStop(0.55,'#7a7874'); gr.addColorStop(1,'#4c4c50');
  ctx.fillStyle = gr; ctx.strokeStyle = '#2c2c2e'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-50,0); ctx.lineTo(-48,-topL); ctx.lineTo(-30,-topL-8); ctx.lineTo(-18,-topL+14); ctx.lineTo(-4,-H0+4); ctx.lineTo(10,-topR-14); ctx.lineTo(26,-topR+6); ctx.lineTo(40,-topR-6); ctx.lineTo(50,-topR+18); ctx.lineTo(50,0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(30,30,34,0.35)'; ctx.lineWidth = 1;
  for(let y=-14; y>-H0; y-=16){ ctx.beginPath(); ctx.moveTo(-49, y); ctx.lineTo(49, y); ctx.stroke(); }
  for(let y=-14, r=0; y>-H0; y-=16, r++){ for(let x=-40+(r%2)*12; x<48; x+=24){ ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y-16); ctx.stroke(); } }
  ctx.fillStyle = '#1e1a18'; ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(-12,-36); ctx.quadraticCurveTo(0,-48,12,-36); ctx.lineTo(12,0); ctx.closePath(); ctx.fill();   // doorway
  ctx.fillStyle = '#1e1a18'; ctx.fillRect(-30,-96,8,16); ctx.fillRect(22,-62,8,14);   // arrow slits
  ctx.fillStyle = 'rgba(92,100,62,0.75)'; ctx.beginPath(); ctx.moveTo(-50,-6); ctx.lineTo(-50,-46); ctx.quadraticCurveTo(-36,-30,-28,-8); ctx.closePath(); ctx.fill();   // creeping moss
  ctx.restore();
}
// atmosphere: overcast blue-grey, drifting cloud shadows, wind streaks, ground mist, distant thunder
function drawHighlandsAtmos(g){
  const t = g.clock||0;
  ctx.save();
  for(let i=0;i<4;i++){
    const x = ((t*22 + i*W*0.43) % (W*1.8)) - W*0.4, y = H*(0.15 + 0.22*i) + Math.sin(t*0.05+i)*40, R = W*0.32;
    const rg = ctx.createRadialGradient(x, y, 10, x, y, R); rg.addColorStop(0,'rgba(10,14,22,0.16)'); rg.addColorStop(1,'rgba(10,14,22,0)');
    ctx.fillStyle = rg; ctx.fillRect(x-R, y-R, R*2, R*2);
  }
  ctx.strokeStyle = 'rgba(225,230,236,0.10)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for(let i=0;i<22;i++){
    const sp = 380 + (i*53)%220, ph = (t*sp + i*977) % (W+400) - 200, y = (i*137.7) % H + Math.sin(t*0.8+i)*8, L = 30 + (i*29)%50;
    ctx.beginPath(); ctx.moveTo(ph, y); ctx.lineTo(ph+L, y+L*0.08); ctx.stroke();
  }
  if(g.hlFlash>0){ ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(190,205,235,'+(g.hlFlash*0.32).toFixed(3)+')'; ctx.fillRect(0,0,W,H); }
  ctx.restore();
  drawAmbientMist(g, 0.12, '182,188,192');
}
function updateHighlandsWeather(g, dt){
  g.hlThunderT = (g.hlThunderT==null ? 10 : g.hlThunderT) - dt;
  if(g.hlFlash>0) g.hlFlash = Math.max(0, g.hlFlash - dt*1.6);
  if(g.hlThunderT<=0){ g.hlThunderT = rand(14, 32); g.hlFlash = rand(0.35, 0.8); setTimeout(()=>{ try{ sfxPlay('thunder', 0.5+Math.random()*0.4); }catch(e){} }, 400+Math.random()*1400); }
}
