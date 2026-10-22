// ---------------- Mountain Pass ----------------
// A rocky, snow-covered open zone between the Dark Forest and the Abandoned
// Mine -- structurally a sibling of the Forest (open area, standing
// respawning population, no genRoom() floors) rather than a dungeon like
// the Mine/Spider Lair/Bear Cave. One edge gate leads back to the Forest
// (landing at the Forest's own mountainGate), the other holds the Mine's
// actual entrance (a stone stairway, same prop the Town shortcut uses).
const MOUNTAIN_PASS_PACK_TEMPLATES = [
  { type:'frozenzombie', count:5 },
  { type:'bear', countMin:2, countMax:3, variant:'polar' },
];
// (v250) The Mountain Pass is rebuilt as an inverted-T of terraced ground (shares the Redridge Crater's
// per-tile height field, so ramps, cliffs and elevation-following sprites all just work). A long east-west road
// climbs from the Dark Forest (west, low) to Frosthold Keep (east, high); a north stem climbs on to the Icy Summit.
// The Abandoned Mine's adit sits on the south wall of the road.
const MTN_TS = 50, MTN_W = 13700, MTN_H = 8000, MTN_M = 300;   // v514: the road is ~40% longer and the descent has two more terraces
const MTN_BAR_Y0 = 2950, MTN_BAR_Y1 = 4100, MTN_JX = 7000, MTN_STEM_HALF = 550;
// (v263) the Pass is now a cross: a south stem of switchback terraces descends from the road to the Mountain Depths
const MTN_S_END = 7600, MTN_SLEDGE = [4640, 5140, 5640, 6140, 6640, 7140], MTN_SS_LV = [120, 100, 80, 60, 40, 20, 0];
const MTN_BX = [2000, 4400, 7800, 9800, 11700], MTN_BLV = [0, 60, 120, 180, 240, 300];
const MTN_SY = [2300, 1650, 1100, 800],        MTN_SLV = [120, 180, 240, 300, 360];
function mtnTrailY(x){ return 3550 + 120*Math.sin(x/700); }
function mtnTrailX(y){ return MTN_JX + 100*Math.sin(y/500); }
function mtnBaseElev(x,y){
  if(y > MTN_BAR_Y1 && Math.abs(x-MTN_JX) <= MTN_STEM_HALF){ let k = 0; while(k<MTN_SLEDGE.length && y>=MTN_SLEDGE[k]) k++; return MTN_SS_LV[k]; }
  if(y >= MTN_BAR_Y0){ let k = 0; while(k<MTN_BX.length && x>=MTN_BX[k]) k++; return MTN_BLV[k]; }
  let k = 0; while(k<MTN_SY.length && y<=MTN_SY[k]) k++; return MTN_SLV[k];
}
function mtnInRegion(x,y){
  return (x>=MTN_M && x<=MTN_W-MTN_M && y>=MTN_BAR_Y0 && y<=MTN_BAR_Y1) || (Math.abs(x-MTN_JX)<=MTN_STEM_HALF && y>=MTN_M && y<MTN_BAR_Y0) || (Math.abs(x-MTN_JX)<=MTN_STEM_HALF && y>MTN_BAR_Y1 && y<=MTN_S_END);
}
function makeMountainPass(){
  const TS = MTN_TS, w = MTN_W, h = MTN_H, cols = w/TS, rows = h/TS, N = cols*rows;
  const forestGate = {x:MTN_M+24, y:mtnTrailY(MTN_M+24), r:34};
  const frostGate  = {x:w-MTN_M-24, y:mtnTrailY(w-MTN_M-24), r:38};
  const mineGate   = {x:MTN_JX, y:MTN_S_END-16, r:40};   // (v263) the Mountain Depths gate at the foot of the south stem
  const summitGate = {x:mtnTrailX(MTN_M+24), y:MTN_M+24, r:38};
  const waypoint   = {x:MTN_JX-430, y:3330, r:22};
  // ramps: elevation blends linearly along `axis` between the rect's low and high coordinate
  const ramps = [];
  const rampX = (bx, cy, lo, hi)=>ramps.push({x0:bx-160, x1:bx+160, y0:cy-175, y1:cy+175, axis:'x', a:lo, b:hi});
  const rampY = (by, cx, lo, hi)=>ramps.push({x0:cx-175, x1:cx+175, y0:by-160, y1:by+160, axis:'y', a:hi, b:lo});   // north end is higher
  MTN_BX.forEach((bx,i)=>{
    const lo = MTN_BLV[i], hi = MTN_BLV[i+1], ty = mtnTrailY(bx);
    rampX(bx, ty, lo, hi);
    rampX(bx, clamp(ty + (i%2 ? -560 : 560), MTN_BAR_Y0+220, MTN_BAR_Y1-220), lo, hi);
  });
  MTN_SY.forEach((by,i)=>{
    const lo = MTN_SLV[i], hi = MTN_SLV[i+1], tx = mtnTrailX(by);
    rampY(by, tx, lo, hi);
    rampY(by, clamp(tx + (i%2 ? 330 : -330), MTN_JX-MTN_STEM_HALF+230, MTN_JX+MTN_STEM_HALF-230), lo, hi);
  });
  // switchback terraces: each ledge is a wall band with one ramp gap, alternating west / east
  const ledgeGaps = MTN_SLEDGE.map((ly,i)=>{ const gx = i%2===0 ? MTN_JX-MTN_STEM_HALF+200 : MTN_JX+MTN_STEM_HALF-200; ramps.push({x0:gx-175, x1:gx+175, y0:ly-160, y1:ly+160, axis:'y', a:MTN_SS_LV[i], b:MTN_SS_LV[i+1]}); return {ly, gx}; });
  // raised shelves (+55) tucked against the walls, each reached by its own short ramp -- good perches for elite packs
  const shelves = [];
  const shelfSpecs = [
    {x:2300,y:3010,w:560,h:300, rx:2580, side:'s'}, {x:5200,y:3790,w:560,h:290, rx:5480, side:'n'},
    {x:8700,y:3010,w:600,h:300, rx:9000, side:'s'}, {x:10700,y:3800,w:600,h:290, rx:11000, side:'n'},
    {x:6460,y:1900,w:360,h:380, rx:6640, side:'e'}, {x:7320,y:1000,w:230,h:420, rx:7435, side:'w'},
  ];
  for(const s of shelfSpecs){
    const base = mtnBaseElev(s.x+s.w/2, s.y+s.h/2);
    shelves.push({x:s.x, y:s.y, w:s.w, h:s.h, e:base+55});
    if(s.side==='s') ramps.push({x0:s.rx-150, x1:s.rx+150, y0:s.y+s.h, y1:s.y+s.h+250, axis:'y', a:base+55, b:base});
    else if(s.side==='n') ramps.push({x0:s.rx-150, x1:s.rx+150, y0:s.y-250, y1:s.y, axis:'y', a:base, b:base+55});
    else if(s.side==='e') ramps.push({x0:s.x+s.w, x1:s.x+s.w+250, y0:s.y+s.h/2-130, y1:s.y+s.h/2+130, axis:'x', a:base+55, b:base});
    else ramps.push({x0:s.x-250, x1:s.x, y0:s.y+s.h/2-130, y1:s.y+s.h/2+130, axis:'x', a:base, b:base+55});
  }
  const elevAt = (x,y)=>{
    let e = mtnBaseElev(x,y);
    for(const s of shelves) if(x>=s.x && x<s.x+s.w && y>=s.y && y<s.y+s.h) e = s.e;
    for(const r of ramps){
      if(x>=r.x0 && x<=r.x1 && y>=r.y0 && y<=r.y1){
        const t = r.axis==='x' ? (x-r.x0)/(r.x1-r.x0) : (y-r.y0)/(r.y1-r.y0);
        e = r.a + (r.b-r.a)*t;
      }
    }
    return e;
  };
  // walkable mask, then carve organic rock blobs into the edges and drop boulder outcrops in the interior
  const W0 = new Uint8Array(N);
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++) W0[iy*cols+ix] = mtnInRegion((ix+0.5)*TS,(iy+0.5)*TS) ? 1 : 0;
  for(const lg of ledgeGaps){   // ledge walls across the south stem, minus the ramp gap
    for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
      const x = (ix+0.5)*TS, y = (iy+0.5)*TS;
      if(Math.abs(y-lg.ly) <= 75 && Math.abs(x-MTN_JX) < MTN_STEM_HALF && Math.abs(x-lg.gx) > 175) W0[iy*cols+ix] = 0;
    }
  }
  const keepClear = [forestGate, frostGate, mineGate, summitGate, waypoint].map(q=>({x:q.x,y:q.y,r:360}));
  const nearRamp = (x,y,pad)=>ramps.some(r=>x>r.x0-pad && x<r.x1+pad && y>r.y0-pad && y<r.y1+pad);
  const nearTrail = (x,y,d)=> (y>=MTN_BAR_Y0-40 && Math.abs(y-mtnTrailY(x))<d) || (y<MTN_BAR_Y0+40 && Math.abs(x-mtnTrailX(y))<d);
  const blobs = [];
  const addBlob = (x,y,r)=>{
    if(keepClear.some(c=>dist({x,y},c)<c.r+r*0.5) || nearRamp(x,y,r*0.6)) return;
    blobs.push({x,y,r});
  };
  for(let i=0;i<150;i++){   // edge bites
    const side = Math.random();
    let x,y;
    if(side<0.35){ x = rand(MTN_M, w-MTN_M); y = MTN_BAR_Y1 - rand(-30,60); if(Math.abs(x-MTN_JX)<MTN_STEM_HALF+120) continue; }
    else if(side<0.55){ x = rand(MTN_M, w-MTN_M); y = MTN_BAR_Y0 + rand(-30,60); if(Math.abs(x-MTN_JX)<MTN_STEM_HALF+120) continue; }
    else if(side<0.62){ x = MTN_M + rand(-30,60); y = rand(MTN_BAR_Y0, MTN_BAR_Y1); }
    else if(side<0.69){ x = w-MTN_M - rand(-30,60); y = rand(MTN_BAR_Y0, MTN_BAR_Y1); }
    else if(side<0.85){ x = MTN_JX - MTN_STEM_HALF + rand(-30,60); y = rand(MTN_M, MTN_BAR_Y0); }
    else { x = MTN_JX + MTN_STEM_HALF - rand(-30,60); y = rand(MTN_M, MTN_BAR_Y0); }
    addBlob(x,y,rand(80,210));
  }
  for(let i=0;i<60;i++){   // south stem: rough west / east walls
    const west = Math.random()<0.5, y = rand(MTN_BAR_Y1+60, MTN_S_END-60);
    addBlob(MTN_JX + (west?-1:1)*(MTN_STEM_HALF - rand(-30,60)), y, rand(80,190));
  }
  for(let i=0;i<70;i++){    // interior outcrops
    const bar = Math.random()<0.72;
    const x = bar ? rand(MTN_M+300, w-MTN_M-300) : rand(MTN_JX-MTN_STEM_HALF+150, MTN_JX+MTN_STEM_HALF-150);
    const y = bar ? rand(MTN_BAR_Y0+200, MTN_BAR_Y1-200) : rand(MTN_M+300, MTN_BAR_Y0-100);
    if(nearTrail(x,y,190)) continue;
    addBlob(x,y,rand(55,115));
  }
  for(const b of blobs){
    const ix0 = Math.max(0,Math.floor((b.x-b.r)/TS)), ix1 = Math.min(cols-1,Math.floor((b.x+b.r)/TS));
    const iy0 = Math.max(0,Math.floor((b.y-b.r)/TS)), iy1 = Math.min(rows-1,Math.floor((b.y+b.r)/TS));
    for(let iy=iy0;iy<=iy1;iy++) for(let ix=ix0;ix<=ix1;ix++) if(dist({x:(ix+0.5)*TS,y:(iy+0.5)*TS},b)<b.r) W0[iy*cols+ix] = 0;
  }
  // heights + wall rings
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
  // blocked tiles: every wall tile within 6 rings, plus the lip of any cliff step
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
  // ground colours: Dark Forest moss in the west, flagstone near the keep, blue ice up the stem, spoil near the mine
  const C = new Uint8Array(N*3);
  const mix = (a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  const SNOW=[228,236,242], MOSS=[92,118,86], DIRT=[96,80,62], FLAG=[142,150,162], ICE=[170,212,238], ROCK=[94,100,110], ROAD=[116,114,110], SPOIL=[124,106,88];
  for(let iy=0; iy<rows; iy++) for(let ix=0; ix<cols; ix++){
    const i = iy*cols+ix, x = (ix+0.5)*TS, y = (iy+0.5)*TS, hh = tileHash(ix,iy), h2 = tileHash(ix*3+7,iy*5+1);
    let c;
    if(K[i]>=3){
      c = mix(ROCK, SNOW, (h2>0.55 ? 0.55 : 0.12) + Math.min(0.3, E[i]/1200));
      if(x < 2200) c = mix(c, [118,104,84], 0.45*(1-x/2200)*(h2<0.5?1:0.4));   // v516: the west end matches the Barren Highlands (dry brown rock, patchy snow)
      if(x < 900) c = mix(c, [74,66,58], clamp(1.0-x/900,0,1)*0.55);
      if(x > w-1500) c = mix(c, [118,126,140], clamp((x-(w-1500))/900,0,1)*0.85);   // Frosthold: dressed castle stone
      if(y > MTN_BAR_Y1-120 && Math.abs(x-MTN_JX) < MTN_STEM_HALF+420) c = mix(c, [44,42,54], clamp(0.35+(y-MTN_BAR_Y1)/1800,0,0.92));   // (v263) south stem: dark basalt
    } else {
      c = SNOW;
      const fw = clamp(0.62-(x-MTN_M)/2800,0,0.62);   // v516: patchy barren ground over the snow, fading out eastward (the Highlands' top-right corner is the same patchy snow)
      if(fw>0 && h2 < fw*1.15) c = mix(c, h2<fw*0.55 ? [152,134,94] : [114,96,74], 0.6+0.3*hh);
      const fe = clamp((x-(w-3300))/1700,0,1);
      if(fe>0 && y>=MTN_BAR_Y0) c = mix(c, FLAG, fe*0.8 + ((ix+iy)%2?0.03:-0.03));
      const fi = clamp((2900-y)/1900,0,1);
      if(fi>0 && y<MTN_BAR_Y0+40) c = mix(c, ICE, fi*0.75);
      const dm = dist({x,y},mineGate)/680;
      if(y > MTN_BAR_Y1+10 && Math.abs(x-MTN_JX) <= MTN_STEM_HALF+60){   // the descent: dark stone, deeper = darker
        const dk = clamp((y-MTN_BAR_Y1)/2400,0,1);
        c = mix(((ix+iy)%2) ? [86,84,94] : [78,76,88], [34,32,42], dk*0.85);
        if(h2>0.86) c = mix(c,[24,22,30],0.5);
        if(dm<1) c = mix(c, SPOIL, (1-dm)*0.55*(0.6+0.4*h2));
      } else
      if(dm<1) c = mix(c, SPOIL, (1-dm)*0.85*(0.6+0.4*h2));
      { const dw = dist({x,y},forestGate)/900; if(dw<1) c = mix(c, h2<0.5?[126,108,82]:[108,92,70], (1-dw)*0.7); }   // v516: trampled barren soil at the Highlands gate
      if(nearTrail(x,y,70)) c = mix(c, ROAD, 0.85);
      else if(nearTrail(x,y,105)) c = mix(c, ROAD, 0.3);
    }
    C[i*3] = c[0]; C[i*3+1] = c[1]; C[i*3+2] = c[2];
  }
  const walk = (x,y)=>{ const ix=Math.floor(x/TS), iy=Math.floor(y/TS); if(ix<0||iy<0||ix>=cols||iy>=rows) return false; const i=iy*cols+ix; return !B[i] && K[i]<3 && Math.abs(CH[i*4]-CH[i*4+2])<8; };
  const flat = (x,y,d)=>walk(x,y)&&walk(x+d,y)&&walk(x-d,y)&&walk(x,y+d)&&walk(x,y-d);
  // pack anchors by district: forest-edge wolves, bears mid-pass, frozen dead toward the summit and the keep
  const gates = [forestGate, frostGate, mineGate, summitGate];
  const packAnchors = []; let tries = 0;
  while(packAnchors.length<68 && tries<45000){
    tries++;
    const x = rand(MTN_M+120, w-MTN_M-120), y = rand(MTN_M+120, MTN_S_END-120);
    if(!flat(x,y,70)) continue;
    if(gates.some(q=>dist({x,y},q)<420) || dist({x,y},waypoint)<320) continue;
    if(packAnchors.some(a=>dist(a,{x,y})<330)) continue;
    packAnchors.push({x,y});
  }
  packAnchors.sort((a,b)=>a.x-b.x);
  // scenery by district
  const deco = []; tries = 0;
  const put = (k,x,y,s,extra)=>{ if(dist({x,y},waypoint)<190) return; if(walk(x,y)) deco.push(Object.assign({k,x,y,s:s||1}, extra||{})); };
  while(deco.length<1100 && tries<45000){
    tries++;
    const x = rand(MTN_M+40, w-MTN_M-40), y = rand(MTN_M+40, MTN_S_END-40);
    if(!walk(x,y) || nearTrail(x,y,62)) continue;
    if(gates.some(q=>dist({x,y},q)<110) || dist({x,y},waypoint)<190) continue;   // v329: nothing stands on or in front of the waypoint
    const q = Math.random(), stem = y<MTN_BAR_Y0;
    const dm = dist({x,y},mineGate);
    if(dm<620){
      put(q<0.3?'spoil':q<0.5?'timber':q<0.62?'cart':q<0.85?'rock':'drift', x,y, rand(0.8,1.3));
    } else if(y > MTN_BAR_Y1+10){
      put(q<0.4?'rock':q<0.62?'crag':q<0.8?'spoil':q<0.9?'timber':'cairn', x,y, rand(0.8,1.4), {h:rand(50,110)});
    } else if(stem){
      const hi = clamp((2900-y)/1900,0,1);
      put(q<0.38+0.2*hi?'crag':q<0.62?'drift':q<0.85?'rock':'pine', x,y, rand(0.7,1.5), {h:rand(55,120)});
    } else if(x<2500){
      put(q<0.16?'pine':q<0.4?'deadpine':q<0.62?'rock':q<0.84?'drift':q<0.94?'cairn':'wagon', x,y, rand(0.8,1.5));
    } else if(x>w-3100){
      put(q<0.4?'rock':q<0.65?'drift':q<0.8?'crag':q<0.9?'statue':'pine', x,y, rand(0.8,1.4), {h:rand(50,90)});
    } else {
      put(q<0.34?'rock':q<0.58?'drift':q<0.76?'pine':q<0.88?'cairn':'crag', x,y, rand(0.8,1.5), {h:rand(50,100)});
    }
  }
  // the keep's approach: banners and braziers line the road; ruined watch posts mark the last two terraces
  for(let x=w-3300; x<w-MTN_M-120; x+=330){
    const ty = mtnTrailY(x);
    put(((x/330|0)%2)?'banner':'brazier', x, ty-120, 1);
    put(((x/330|0)%2)?'brazier':'banner', x, ty+120, 1);
  }
  // forest border: a dense, dark treeline hugging the first stretch of road, and a solid wall of woods standing on the cliff blocks
  for(let x=MTN_M+120; x<2200; x+=190){   // v516: dead trees, boulders and snowy pines line the first stretch (no dark forest border any more)
    const ty = mtnTrailY(x);
    for(const sy of [-1,1]){ const q = Math.random(); put(q<0.4?'deadpine':q<0.7?'rock':'pine', x+rand(-30,30), ty+sy*rand(150,260), rand(1.0,1.5)); }
  }
  // v516: the old wall of woods on the west cliffs is gone -- those cliffs are plain rock now, with a few boulders
  for(let x=60; x<1000; x+=170){
    for(let y=MTN_BAR_Y0-260; y<MTN_BAR_Y1+260; y+=240){
      const ix=Math.floor(x/TS), iy=Math.floor(y/TS); if(ix<0||iy<0||ix>=cols||iy>=rows) continue;
      if(K[iy*cols+ix]<3) continue;
      if(x>MTN_M-40 && Math.abs(y-forestGate.y)<150) continue;   // keep the gateway itself open
      deco.push({k:Math.random()<0.5?'rock':'crag', x:x+rand(-30,30), y:y+rand(-30,30), s:rand(1.0,1.6), h:rand(50,100)});
    }
  }
  // the descent: braziers light each ramp gap, a lantern post stands at the foot
  for(const lg of ledgeGaps){ put('brazier', lg.gx-210, lg.ly-30, 1); put('brazier', lg.gx+210, lg.ly-30, 1); put('brazier', lg.gx-210, lg.ly+150, 1); put('brazier', lg.gx+210, lg.ly+150, 1); }
  // north stem: ice spires flank the road toward the summit cave
  for(let y=MTN_BAR_Y0-120; y>MTN_M+160; y-=260){
    const tx = mtnTrailX(y);
    put('crag', tx-170-rand(0,60), y, rand(0.9,1.4), {h:rand(80,140)});
    put('crag', tx+170+rand(0,60), y, rand(0.9,1.4), {h:rand(80,140)});
  }
  deco.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  return { isMtn:true, name:'Mountain Pass', w, h, ts:TS, cols, rows, E, K, B, CH, C, wallDrop:120, edgeLines:true, colorFn:mtnColor,
    obstacles, rocks:[], waypoints:[], packAnchors, waypoint, deco, forestGate, frostGate, mineGate, depthsGate:mineGate, summitGate, ledgeGaps };
}
function mtnColor(R, i, hj, k, f){
  const j = (0.94+hj*0.12)*(f||1), b = i*3;
  return 'rgb('+Math.round(R.C[b]*j)+','+Math.round(R.C[b+1]*j)+','+Math.round(R.C[b+2]*j)+')';
}

