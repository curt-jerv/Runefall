// ---------- Dark Crypt darkness / fog-of-war overlay (v73, fixed vNext) ----------
// The zone's signature mechanic: outside a small circle right around the
// player, the whole screen goes black. Implemented as a screen-space
// post-process, entirely separate from the isometric world draw above --
// it never touches drawFloor/drawWalls/drawEnemyIso or any other zone's
// rendering, and only ever runs while g.scene==='darkcrypt'.
//
// Technique: build the black-with-holes mask on a SEPARATE offscreen
// canvas (darkCryptMaskCanvas/darkCryptMaskCtx below), then drawImage()
// that finished mask onto the main game canvas in one shot. This is a
// deliberate fix over the original v73 approach, which painted the black
// rect and punched its destination-out holes directly on the main canvas
// that the whole isometric scene had just been drawn to -- since the
// opening fillRect('#000') is a normal source-over paint, it silently
// overwrote (erased) the already-rendered floor/walls/player/enemies
// everywhere, including inside the "lit" hole, and destination-out then
// only ever uncovered TRANSPARENCY there (revealing the page's near-black
// body background, not the actual scene) -- so the "lit" circle around
// the player showed nothing at all, defeating the point of having one.
// Building the mask off-canvas and compositing it on with plain
// source-over avoids this entirely: wherever the mask is transparent
// (inside a hole), drawImage leaves the already-drawn scene pixels
// completely untouched, so the floor/walls/enemies genuinely show through.
//
// Every living enemy's eye position then gets a small, solid, clearly-
// visible red dot painted directly on the main canvas AFTER the mask is
// applied -- see DARKCRYPT_EYE_DOT_R below -- so it always reads on top
// of the darkness overlay even when the enemy itself is still outside the
// lit circle, exactly the "see them coming towards us before we can see
// them" hint the brief asks for.
//
// Radii (screen-space pixels, independent of zoom):
//   - DARKCRYPT_PLAYER_LIGHT_R: the player's own "normal illumination"
//     circle. Calibrated off FOLLOWER_FOLLOW_DIST (=55 world units, how
//     far back a follower stands in Attack stance -- see the follower
//     positioning code) rather than picking an arbitrary pixel count: at
//     this zone's iso projection (ISO_KX=0.85/ISO_KY=0.425), a
//     FOLLOWER_FOLLOW_DIST-length offset lands roughly 35-52 screen px
//     away from the player depending on direction. A radius "just a bit
//     farther than the followers stand" is therefore in that same rough
//     screen-px range, not the raw "15" the original ask floated (which
//     assumes a much finer unit scale than this game actually uses, and
//     at these entity sizes -- player r=16 world units -- would be
//     smaller than the player's own sprite). 90px keeps the circle small
//     and restrictive (per "very restricted... just enough to navigate")
//     while comfortably clearing the followers standing around the player
//     and staying a bit larger than a single ambient torch's own pool of
//     light.
//   - DARKCRYPT_TORCH_LIGHT_R=70: each ambient torch/crystal light is
//     deliberately smaller than the player's own light -- a tiny pool of
//     light hinting at the path rather than lighting a whole room.
//   - DARKCRYPT_EYE_DOT_R=6: the solid red enemy-position dot -- small and
//     unambiguous by design (a "dot", not a soft diffuse glow), so it's
//     instantly readable at a glance even far outside the lit circle.
const DARKCRYPT_PLAYER_LIGHT_R = 213;  // v222: 1.5x // (v120) a little larger: the hero is now the ONLY light
const DARKCRYPT_TORCH_LIGHT_R = 70;
// v224: every underground dungeon gets the crypt's black screen + lit circle, at 2x the crypt's radius
const UNDERGROUND_LIGHT_R = DARKCRYPT_PLAYER_LIGHT_R*2;
function isUndergroundScene(g){
  const sc = g.scene;
  return sc==='dungeon'||sc==='spiderlair'||sc==='bearcave'||sc==='minotaurcave'||sc==='ancientruins'||sc==='raptorlair'||(sc==='lighthouse' && !!(g.room && (g.room.subzone==='sunken' || g.room.subzone==='temple' || g.room.subzone==='rrtower' || g.room.subzone==='highward' || g.room.deep===1 || g.room.deep===3)));
}
const DARKCRYPT_EYE_DOT_R = 6;
// Lazily-created offscreen mask canvas, reused every frame (recreated only
// if the game canvas' own size changes, e.g. on window resize) -- avoids
// allocating a new canvas every single frame this zone is on screen.
let darkCryptMaskCanvas = null, darkCryptMaskCtx = null;
function getDarkCryptMask(){
  if(!darkCryptMaskCanvas || darkCryptMaskCanvas.width!==Math.ceil(W/2) || darkCryptMaskCanvas.height!==Math.ceil(H/2)){
    darkCryptMaskCanvas = document.createElement('canvas');
    darkCryptMaskCanvas.width = Math.ceil(W/2); darkCryptMaskCanvas.height = Math.ceil(H/2);   // v316: half-res (the light is a soft gradient, 4x fewer pixels to fill each frame)
    darkCryptMaskCtx = darkCryptMaskCanvas.getContext('2d');
  }
  return darkCryptMaskCtx;
}
// (v147) every other dungeon gets the same "light closing in" effect, but only a faint 5-10% at the very screen edges.
// (v156) dungeons: a very slight barrel/fish-eye squeeze toward the screen edges, leaving a thin black ring.
let fishCanvas = null;
const FISH_A = 0.07;
function applyFisheye(){
  const cw = canvas.width, ch = canvas.height;
  if(!fishCanvas) fishCanvas = document.createElement('canvas');
  if(fishCanvas.width!==cw || fishCanvas.height!==ch){ fishCanvas.width = cw; fishCanvas.height = ch; }
  const fc = fishCanvas.getContext('2d');
  fc.setTransform(1,0,0,1,0,0); fc.drawImage(canvas,0,0);
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,cw,ch);
  const sw = Math.max(2, Math.round(6*DPR)), half = cw/2;
  const fx = x=>{ const u = (x-half)/half; return half + (x-half)*(1-FISH_A*u*u); };
  for(let x=0;x<cw;x+=sw){
    const w2 = Math.min(sw, cw-x), u = (x+w2/2-half)/half, sy = 1-FISH_A*u*u;
    const dx0 = fx(x), dx1 = fx(x+w2);
    ctx.drawImage(fishCanvas, x, 0, w2, ch, dx0, ch/2-ch*sy/2, Math.max(1,dx1-dx0+0.6), ch*sy);
  }
  ctx.restore();
}
// ---------- v221: dungeon sections ----------
// Only the part of a dungeon the player is actually in (path-distance flood fill over the walkable floor) is shown;
// parallel corridors / far rooms are blacked out and their monsters are not drawn.
const SECTION_SCENES = {dungeon:1, spiderlair:1, bearcave:1, minotaurcave:1, lighthouse:1, darkcrypt:1, raptorlair:1};
const SEC_CS = 40, SEC_D1 = 10, SEC_D2 = 16;
let secCache = null, secCur = null;
function sectionVis(g){
  secCur = null;
  if(!g || !SECTION_SCENES[g.scene]) return null;
  const room = g.room;
  if(!room || !room.floorRects || !room.floorRects.length || room.bossFloor) return null;
  let c = secCache;
  if(!c || c.room!==room){
    const cols = Math.ceil(room.w/SEC_CS)+1, rows = Math.ceil(room.h/SEC_CS)+1;
    const walk = new Uint8Array(cols*rows);
    for(const r of room.floorRects){
      const x0 = Math.max(0, Math.floor((r.x-6)/SEC_CS)), x1 = Math.min(cols-1, Math.ceil((r.x+r.w+6)/SEC_CS));
      const y0 = Math.max(0, Math.floor((r.y-6)/SEC_CS)), y1 = Math.min(rows-1, Math.ceil((r.y+r.h+6)/SEC_CS));
      for(let cy=y0; cy<=y1; cy++) for(let cx=x0; cx<=x1; cx++){
        const mx = (cx+0.5)*SEC_CS, my = (cy+0.5)*SEC_CS;
        if(mx>r.x-6 && mx<r.x+r.w+6 && my>r.y-6 && my<r.y+r.h+6) walk[cy*cols+cx] = 1;
      }
    }
    c = secCache = {room, cols, rows, walk, dist:new Int16Array(cols*rows), key:-1, list:[], extra:[]};
  }
  const p = g.player;
  const pcx = Math.max(0, Math.min(c.cols-1, Math.floor(p.x/SEC_CS))), pcy = Math.max(0, Math.min(c.rows-1, Math.floor(p.y/SEC_CS)));
  const key = pcy*c.cols+pcx;
  if(key!==c.key){
    c.key = key; c.dist.fill(-1);
    const q = [key]; c.dist[key] = 0; const list = [];
    for(let qi=0; qi<q.length; qi++){
      const k = q[qi], d = c.dist[k]; list.push(k);
      if(d>=SEC_D2) continue;
      const cx = k%c.cols, cy = (k/c.cols)|0;
      const nb = [cx>0?k-1:-1, cx<c.cols-1?k+1:-1, cy>0?k-c.cols:-1, cy<c.rows-1?k+c.cols:-1];
      for(const n of nb){ if(n<0 || !c.walk[n] || c.dist[n]>=0) continue; c.dist[n] = d+1; q.push(n); }
    }
    // wall ring: non-walkable cells touching a revealed cell (so walls show around the revealed floor)
    const seen = new Set(), extra = [];
    for(const k of list){
      const cx = k%c.cols, cy = (k/c.cols)|0, d = c.dist[k];
      for(let oy=-1; oy<=1; oy++) for(let ox=-1; ox<=1; ox++){
        const nx = cx+ox, ny = cy+oy; if(nx<0||ny<0||nx>=c.cols||ny>=c.rows) continue;
        const n = ny*c.cols+nx; if(c.walk[n] || seen.has(n)) continue;
        seen.add(n); extra.push([n, d]);
      }
    }
    c.list = list; c.extra = extra;
  }
  secCur = c; return c;
}
function secAlphaD(d){ return d<0 ? 0 : d<=SEC_D1 ? 1 : Math.max(0, 1-(d-SEC_D1)/(SEC_D2-SEC_D1)); }
function secEnemyHidden(e){
  const c = secCur; if(!c) return false;
  const cx = Math.floor(e.x/SEC_CS), cy = Math.floor(e.y/SEC_CS);
  let best = -1;
  for(let oy=-1; oy<=1; oy++) for(let ox=-1; ox<=1; ox++){
    const nx = cx+ox, ny = cy+oy; if(nx<0||ny<0||nx>=c.cols||ny>=c.rows) continue;
    const d = c.dist[ny*c.cols+nx]; if(d>=0 && (best<0 || d<best)) best = d;
  }
  return secAlphaD(best) < 0.35;
}
let secMaskCanvas = null, secMaskCtx = null;
function drawSectionMask(g){
  const c = sectionVis(g); if(!c) return;
  if(!secMaskCanvas || secMaskCanvas.width!==W || secMaskCanvas.height!==H){
    secMaskCanvas = document.createElement('canvas'); secMaskCanvas.width = W; secMaskCanvas.height = H; secMaskCtx = secMaskCanvas.getContext('2d');
  }
  const m = secMaskCtx, cam = g.camera;
  m.globalCompositeOperation = 'source-over'; m.clearRect(0,0,W,H);
  m.fillStyle = 'rgba(0,0,0,0.93)'; m.fillRect(0,0,W,H);
  m.globalCompositeOperation = 'destination-out';
  const hw = SEC_CS*ISO_KX*1.06, hh = SEC_CS*ISO_KY*1.06, WALL = 60;
  m.fillStyle = '#000'; m.beginPath();
  const partial = [];
  for(const k of c.list){
    const cx = k%c.cols, cy = (k/c.cols)|0;
    const iso = toIso((cx+0.5)*SEC_CS, (cy+0.5)*SEC_CS), sx = iso.x-cam.x, sy = iso.y-cam.y;
    if(sx<-hw || sx>W+hw || sy<-hh-WALL || sy>H+hh) continue;
    const a = secAlphaD(c.dist[k]);
    if(a<=0) continue;
    if(a<1){ partial.push([sx,sy,a,0]); continue; }
    m.moveTo(sx-hw,sy); m.lineTo(sx,sy-hh); m.lineTo(sx+hw,sy); m.lineTo(sx,sy+hh); m.closePath();
  }
  m.fill();
  for(const pt of partial){
    m.fillStyle = 'rgba(0,0,0,'+pt[2].toFixed(3)+')'; m.beginPath();
    m.moveTo(pt[0]-hw,pt[1]); m.lineTo(pt[0],pt[1]-hh); m.lineTo(pt[0]+hw,pt[1]); m.lineTo(pt[0],pt[1]+hh); m.closePath(); m.fill();
  }
  for(const ex of c.extra){
    const a = secAlphaD(ex[1]); if(a<=0) continue;
    const k = ex[0], cx = k%c.cols, cy = (k/c.cols)|0;
    const iso = toIso((cx+0.5)*SEC_CS, (cy+0.5)*SEC_CS), sx = iso.x-cam.x, sy = iso.y-cam.y;
    if(sx<-hw || sx>W+hw || sy<-hh-WALL || sy>H+hh) continue;
    m.fillStyle = 'rgba(0,0,0,'+a.toFixed(3)+')'; m.beginPath();
    m.moveTo(sx-hw,sy); m.lineTo(sx-hw,sy-WALL); m.lineTo(sx,sy-hh-WALL); m.lineTo(sx+hw,sy-WALL); m.lineTo(sx+hw,sy); m.lineTo(sx,sy+hh); m.closePath(); m.fill();
  }
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(secMaskCanvas, 0, 0, W, H); ctx.restore();
}
// v221: same idea as the Dark Crypt's black screen with a lit circle around the player, but faint: outside the circle
// the dungeon is only dimmed (DUNGEON_DIM), not blacked out.
const DUNGEON_LIT_R = 230, DUNGEON_FADE_R = 500, DUNGEON_DIM = 0.5;
// ---- (v252) bridge red-glow helper ----
function bridgeRedT(g){
  const r = g.room, p = g.player; if(!r || !r.bridge || !p || r.subzone) return 0;
  const a = r.bridge.x1 + 260, b = r.bridge.x0 + 60;
  return clamp((a - p.x)/(a - b), 0, 1);
}
function drawStoneBridge(B, red, span, glow){
  const T = (game&&game.clock)||0;
  ctx.save();
  // Moria-style stone bridge: a thick stone span with a tapering arched underside, no rails
  const TS = 46, nP = Math.ceil((B.x1-B.x0)/TS), L = B.x1-B.x0;
  const sp = span||L, depthAt = x=>{ const t=(((x-B.x0)%sp)+sp)%sp/sp; return 120 - 62*Math.sin(Math.PI*t); };  // thick at the ends, slimmer mid-span
  const N = span ? Math.max(24, Math.round(L/40)) : 24, topF = [], botF = [];
  for(let k=0;k<=N;k++){ const x=B.x0+L*k/N, p=toIso(x,B.y1); topF.push(p); botF.push({x:p.x,y:p.y+depthAt(x)}); }
  // south face (the side the camera sees)
  const gF = ctx.createLinearGradient(0,topF[N>>1].y,0,topF[N>>1].y+130);
  gF.addColorStop(0,'#4e4232'); gF.addColorStop(0.45,'#2b231b'); gF.addColorStop(1,'rgba(8,6,6,0)');
  ctx.fillStyle = gF; ctx.beginPath(); ctx.moveTo(topF[0].x,topF[0].y);
  for(let k=1;k<=N;k++) ctx.lineTo(topF[k].x,topF[k].y);
  for(let k=N;k>=0;k--) ctx.lineTo(botF[k].x,botF[k].y);
  ctx.closePath(); ctx.fill();
  // block courses on the face
  ctx.strokeStyle = 'rgba(10,7,4,0.5)'; ctx.lineWidth = 1;
  for(let row=1; row<5; row++){
    const f = row/5; ctx.beginPath();
    for(let k=0;k<=N;k++){ const y = topF[k].y + (botF[k].y-topF[k].y)*f; k?ctx.lineTo(topF[k].x,y):ctx.moveTo(topF[k].x,y); }
    ctx.stroke();
    for(let x=B.x0+(row%2?TS*0.5:0); x<B.x1; x+=TS){
      const t=(x-B.x0)/L, p=toIso(x,B.y1), d=depthAt(x);
      ctx.beginPath(); ctx.moveTo(p.x, p.y+d*(row-1)/5); ctx.lineTo(p.x, p.y+d*f); ctx.stroke();
    }
  }
  // stone deck: large flagstones with seams, worn edge
  for(let i=0;i<nP;i++){
    const x0 = B.x0+i*TS, x1 = Math.min(B.x1, x0+TS);
    const q = [toIso(x0,B.y0), toIso(x1,B.y0), toIso(x1,B.y1), toIso(x0,B.y1)];
    ctx.fillStyle = i%2 ? '#352c22' : '#3a3024';
    ctx.beginPath(); ctx.moveTo(q[0].x,q[0].y); for(let k=1;k<4;k++) ctx.lineTo(q[k].x,q[k].y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(12,8,5,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    if(red>0){ ctx.fillStyle = 'rgba(255,70,20,'+(0.14*red*(0.7+0.3*Math.sin(T*3+i)))+')'; ctx.fill(); }
  }
  // thin lip highlight along the near edge
  ctx.strokeStyle = 'rgba(120,98,70,0.45)'; ctx.lineWidth = 2; ctx.beginPath();
  for(let k=0;k<=N;k++) k?ctx.lineTo(topF[k].x,topF[k].y):ctx.moveTo(topF[k].x,topF[k].y);
  ctx.stroke();
  // ember light catching the underside as the Tyrant nears
  if(red>0){ ctx.globalCompositeOperation='lighter'; ctx.fillStyle='rgba(255,70,20,'+(0.10*red)+')';
    ctx.beginPath(); ctx.moveTo(topF[0].x,topF[0].y); for(let k=1;k<=N;k++) ctx.lineTo(topF[k].x,topF[k].y); for(let k=N;k>=0;k--) ctx.lineTo(botF[k].x,botF[k].y); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
  ctx.restore();
}
function drawBridgeGlow(g){
  const t = bridgeRedT(g); if(t<=0) return;
  const T = (game&&game.clock)||0, pul = 0.85+0.15*Math.sin(T*2.4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const cx = W/2, cy = H/2, vg = ctx.createRadialGradient(cx,cy,Math.min(W,H)*0.15,cx,cy,Math.max(W,H)*0.75);
  vg.addColorStop(0,'rgba(120,20,5,'+(0.10*t*pul)+')'); vg.addColorStop(1,'rgba(255,50,15,'+(0.34*t*pul)+')');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  ctx.restore();
}
function drawDungeonVignette(g){
  const cx = W/2, cy = camPlayerY();
  const vg = ctx.createRadialGradient(cx,cy,DUNGEON_LIT_R, cx,cy,DUNGEON_FADE_R);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,'+DUNGEON_DIM+')');
  ctx.save(); ctx.fillStyle = vg; ctx.fillRect(0,0,W,H); ctx.restore();
}
// (v245) line-of-sight shadows: a second effect, independent of the light radius. Anything the player can't see
// (behind walls, around corners) is shadowed and enemies there are not drawn.
let _hudB = 40, _hudBT = 0;
function hudBottomPx(){
  const t = performance.now();
  if(t-_hudBT > 600){ _hudBT = t; const el = document.getElementById('topWrap'); if(el){ const b = el.getBoundingClientRect().bottom; if(b>0 && b<H*0.4) _hudB = b; } }   // v493: the top HUD stack (region name, buffs)
  return _hudB;
}
function losShadowScene(g){ return !!(g && g.started && g.player && (g.scene==='darkcrypt' || isUndergroundScene(g) || (g.scene==='lighthouse' && g.room && g.room.subzone!=='pool' && !kpOutdoor(g)))); }   // v492: every tower and hall (not the Shadow Keep's open courtyard) hides what is behind walls
function losEnemyHidden(g, e){
  if(!losShadowScene(g) || e===g.player) return false;
  if(dist(g.player, e) < 60) return false;
  return !enemyLOS(g, e, g.player);
}
let losCanvas = null, losCtx = null;
const LOS_RANGE = 640;
function losMaskRay(m, px, py, dx, dy, maxT){
  const C = m.CELL; let ix = Math.floor(px/C), iy = Math.floor(py/C);
  const sx = dx>0 ? 1 : -1, sy = dy>0 ? 1 : -1;
  let tx = Math.abs(dx)<1e-9 ? 1e9 : ((ix+(dx>0?1:0))*C - px)/dx, ty = Math.abs(dy)<1e-9 ? 1e9 : ((iy+(dy>0?1:0))*C - py)/dy;
  const ddx = Math.abs(dx)<1e-9 ? 1e9 : C/Math.abs(dx), ddy = Math.abs(dy)<1e-9 ? 1e9 : C/Math.abs(dy);
  for(let n=0; n<200; n++){
    let t; if(tx < ty){ t = tx; tx += ddx; ix += sx; } else { t = ty; ty += ddy; iy += sy; }
    if(t >= maxT) return maxT;
    if(ix<0 || iy<0 || ix>=m.cols || iy>=m.rows || !m.data[iy*m.cols+ix]) return t;
  }
  return maxT;
}
function drawLosShadow(g){
  const p = g.player, room = g.room, obs = room && room.obstacles; if(!p || !obs) return;
  // v490: in organic caves the wall cells are walked on the floor-mask grid (a DDA march) instead of slab-testing every
  // nearby cell against every ray -- the Sunken Depths had ~300 cells x ~3600 rays per frame. Shared cell corners are deduped.
  const M = (room.organic && room.floorMask) ? room.floorMask : null;
  const near = [], cellCorners = M ? new Set() : null;
  for(let i=0;i<obs.length;i++){
    const o = obs[i]; if(o.isWater||o.isFurniture||o.isProp) continue;
    if(o.x>p.x+LOS_RANGE || o.x+o.w<p.x-LOS_RANGE || o.y>p.y+LOS_RANGE || o.y+o.h<p.y-LOS_RANGE) continue;
    if(p.x>=o.x && p.x<=o.x+o.w && p.y>=o.y && p.y<=o.y+o.h) continue;
    if(M && o.organic){ if(Math.abs(o.x+o.w/2-p.x) < 300 && Math.abs(o.y+o.h/2-p.y) < 300) for(const cx of [o.x, o.x+o.w]) for(const cy of [o.y, o.y+o.h]) cellCorners.add(cx*65536+cy); continue; }   // exact corners only close by; 540 even rays cover the rest
    near.push(o);
  }
  if(!near.length && !M) return;
  const angs = [];
  const NU = M ? 540 : 72;
  for(let i=0;i<NU;i++) angs.push(i/NU*Math.PI*2-Math.PI);
  for(const o of near){ for(const [cx,cy] of [[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h]]){ const a = Math.atan2(cy-p.y, cx-p.x); angs.push(a-0.0004, a, a+0.0004); } }
  if(cellCorners) for(const k of cellCorners){ const cx = Math.floor(k/65536), cy = k - cx*65536; const a = Math.atan2(cy-p.y, cx-p.x); angs.push(a-0.0004, a, a+0.0004); }
  angs.sort((a,b)=>a-b);
  const pts = [];
  for(const a of angs){
    const dx = Math.cos(a), dy = Math.sin(a); let tm = LOS_RANGE;
    if(M) tm = losMaskRay(M, p.x, p.y, dx, dy, tm);
    for(const o of near){
      let t0=0, t1=tm;
      if(Math.abs(dx)<1e-9){ if(p.x<o.x||p.x>o.x+o.w) continue; } else { let u=(o.x-p.x)/dx, v=(o.x+o.w-p.x)/dx; if(u>v){const t=u;u=v;v=t;} if(u>t0)t0=u; if(v<t1)t1=v; if(t0>t1) continue; }
      if(Math.abs(dy)<1e-9){ if(p.y<o.y||p.y>o.y+o.h) continue; } else { let u=(o.y-p.y)/dy, v=(o.y+o.h-p.y)/dy; if(u>v){const t=u;u=v;v=t;} if(u>t0)t0=u; if(v<t1)t1=v; if(t0>t1) continue; }
      if(t0<tm) tm = t0;
    }
    pts.push([p.x+dx*(tm+3), p.y+dy*(tm+3)]);
  }
  if(!losCanvas || losCanvas.width!==W || losCanvas.height!==H){ losCanvas = document.createElement('canvas'); losCanvas.width = W; losCanvas.height = H; losCtx = losCanvas.getContext('2d'); }
  const m = losCtx, cam = g.camera;
  m.globalCompositeOperation = 'source-over'; m.clearRect(0,0,W,H);
  m.fillStyle = 'rgba(0,0,0,0.82)'; m.fillRect(0,0,W,H);
  m.globalCompositeOperation = 'destination-out'; m.fillStyle = '#000';
  for(const lift of [0, 30]){   // second pass lifts the lit area so wall faces next to you stay readable
    m.beginPath();
    for(let i=0;i<pts.length;i++){ const io = toIso(pts[i][0], pts[i][1]); const x = io.x-cam.x, y = io.y-cam.y-lift; if(i===0) m.moveTo(x,y); else m.lineTo(x,y); }
    m.closePath(); m.fill();
  }
  ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(losCanvas, 0, 0, W, H); ctx.restore();
}
// v492/v493: the character's own circle of light in every zone but town (the Dark Crypt and the caves keep their own, stronger dark).
// Outside the circle the world is VEIL_MAX_A dark (towers and halls darker still); inside it a light VEIL_CORE_DIM haze stays.
// +Light Radius gear widens every circle of light except the Dark Crypt's.
const VEIL_LIGHT_R = 290, VEIL_MAX_A = 0.8, VEIL_INDOOR_R = 235, VEIL_INDOOR_A = 0.92, VEIL_CORE_DIM = 0.15, VEIL_INDOOR_DIM = 0.28, UNDERGROUND_CORE_DIM = 0.42, UNDERGROUND_LIGHT_SCALE = 0.8;   // v498: caves, depths and towers are clearly darker than the Dark Forest (smaller, dimmer circle of light)
function lightRadiusMult(p){ return 1 + ((p && p.lightRadiusPct)||0); }
function lightVeilScene(g){
  if(!g || !g.started || !g.player) return false;
  const sc = g.scene; if(sc==='town' || sc==='tavern' || sc==='darkcrypt' || isUndergroundScene(g)) return false;
  if(typeof wlDarkFight==='function' && wlDarkFight(g)) return false;
  return true;
}
function drawLightVeil(g){
  const indoor = g.scene==='lighthouse' && !(g.room && g.room.subzone==='pool') && !kpOutdoor(g);
  drawDarkCryptOverlay(g, (indoor ? VEIL_INDOOR_R : VEIL_LIGHT_R)*lightRadiusMult(g.player), false, null, indoor ? VEIL_INDOOR_A : VEIL_MAX_A, indoor ? VEIL_INDOOR_DIM : VEIL_CORE_DIM);
}
function drawDarkCryptOverlay(g, LR, useLights, tint, maxA, coreDim){
  LR = LR || DARKCRYPT_PLAYER_LIGHT_R;
  const cam = g.camera;
  // The camera always centers the player at this exact fixed screen point
  // (see the "camera (iso space, follows player)" block in update()) --
  // computing it directly here avoids re-deriving it from world space.
  const px = W/2, py = Math.round(camPlayerY()/2)*2;   // v453: snap to the half-res mask's pixel grid so the two clipped halves meet without a dark seam
  const mctx = getDarkCryptMask();
  mctx.setTransform(0.5, 0, 0, 0.5, 0, 0);
  mctx.clearRect(0, 0, W, H);
  mctx.globalCompositeOperation = 'source-over';
  mctx.fillStyle = tint || '#000';
  mctx.globalAlpha = (maxA==null ? 1 : maxA);   // v492: the soft outdoor veil is only partly dark
  mctx.fillRect(0, 0, W, H);
  mctx.globalAlpha = 1;
  mctx.globalCompositeOperation = 'destination-out';
  let grd = mctx.createRadialGradient(px, py, 0, px, py, LR);
  const cl = 1 - (coreDim||0);   // v493: coreDim keeps a faint haze even at the centre of the light
  grd.addColorStop(0, 'rgba(0,0,0,'+cl+')');
  grd.addColorStop(0.62, 'rgba(0,0,0,'+(0.83*cl)+')');   // (v245) ~10% darker falloff
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.fillStyle = grd;
  // (v245) the upper half of the light is squashed so it ends right under the top HUD bar instead of being hidden behind it
  const sy0 = clamp((py - hudBottomPx()) / LR, 0.35, 1);
  mctx.save(); mctx.beginPath(); mctx.rect(0, py, W, H); mctx.clip(); mctx.beginPath(); mctx.arc(px, py, LR, 0, Math.PI*2); mctx.fill(); mctx.restore();
  mctx.save(); mctx.beginPath(); mctx.rect(0, 0, W, py); mctx.clip(); mctx.translate(0, py); mctx.scale(1, sy0); mctx.translate(0, -py);
  mctx.beginPath(); mctx.arc(px, py, LR, 0, Math.PI*2); mctx.fill(); mctx.restore();
  if(useLights && g.crypt && g.crypt.lights){
    for(const lt of g.crypt.lights){
      const iso = toIso(lt.x, lt.y);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const tg = mctx.createRadialGradient(sx, sy, 0, sx, sy, DARKCRYPT_TORCH_LIGHT_R);
      tg.addColorStop(0, 'rgba(0,0,0,1)');
      tg.addColorStop(0.6, 'rgba(0,0,0,0.77)');
      tg.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = tg;
      mctx.beginPath(); mctx.arc(sx, sy, DARKCRYPT_TORCH_LIGHT_R, 0, Math.PI*2); mctx.fill();
    }
  }
  if(g.projectiles){   // v499: a Frozen Orb lights up the dark around itself
    for(const pr of g.projectiles){
      if(!pr.isFrozenOrb) continue;
      const iso = toIso(pr.x, pr.y), sx = iso.x - cam.x, sy = iso.y - cam.y - 18;
      if(sx < -200 || sx > W+200 || sy < -200 || sy > H+200) continue;
      const og = mctx.createRadialGradient(sx, sy, 0, sx, sy, 190);
      og.addColorStop(0, 'rgba(0,0,0,0.95)'); og.addColorStop(0.55, 'rgba(0,0,0,0.6)'); og.addColorStop(1, 'rgba(0,0,0,0)');
      mctx.fillStyle = og; mctx.beginPath(); mctx.arc(sx, sy, 190, 0, Math.PI*2); mctx.fill();
    }
  }
  // Composite the finished mask onto the main canvas with plain
  // source-over -- transparent (hole) pixels leave the scene beneath
  // completely untouched, opaque black pixels paint over it, exactly the
  // "reveal what's already drawn" effect the destination-out holes above
  // were meant to produce.
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(darkCryptMaskCanvas, 0, 0, W, H);
  ctx.restore();
  if(tint){   // v456 Heart of the Mountain: a flickering fiery rim around the light
    const ck = (g.clock||0), fl = 0.75 + 0.15*Math.sin(ck*7) + 0.1*Math.sin(ck*13.3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const rg = ctx.createRadialGradient(px, py, LR*0.55, px, py, LR*1.15);
    rg.addColorStop(0, 'rgba(255,90,20,0)'); rg.addColorStop(0.55, 'rgba(255,80,20,'+(0.16*fl)+')'); rg.addColorStop(1, 'rgba(120,20,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // v221: no red dots. Only the enemies' own sprite eyes glow through the dark
  // (position/colour recorded by drawEnemyIso), and only for enemies in the section the player is in.
  ctx.save();
  for(const e of g.enemies){
    if(e.hp<=0 || !e._eye || secEnemyHidden(e) || losEnemyHidden(g, e)) continue;
    const ey = e._eye;
    const sx = ey.x - cam.x, sy = ey.y - cam.y;
    if(sx < -60 || sx > W+60 || sy < -60 || sy > H+60) continue;
    if(Math.hypot(sx-px, sy-py) < LR*0.75) continue;   // inside the light the sprite shows its own eyes
    ctx.fillStyle = ey.c; ctx.shadowColor = ey.c; ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.arc(sx-ey.dx, sy, ey.r, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(sx+ey.dx, sy, ey.r, 0, 7); ctx.fill();
  }
  ctx.restore();
}

