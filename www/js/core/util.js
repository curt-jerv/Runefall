// ---------- Utility ----------
function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function rand(a,b){ return a+Math.random()*(b-a); }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=arr[i]; arr[i]=arr[j]; arr[j]=t; } return arr; }
// Generic zone-boundary marker ring (Sept 2026 patch): returns evenly
// spaced points hugging all four edges of a w x h zone, inset by margin,
// for scattering decorative "you've reached the edge" border props
// (tombstones/rocks/trees) around an open zone's playable area -- reused
// by Cursed Cemetery/Withered Crossroads/Lakeside Ruins below instead of each
// zone inventing its own perimeter-walking loop. gaps is a list of
// {x,y,r} points (gates/exits); any candidate point within r of a gap is
// skipped so that gate/exit stays visually and functionally clear.
function zoneBorderPoints(w, h, margin, spacing, gaps){
  gaps = gaps || [];
  const pts = [];
  function clear(x,y){ return !gaps.some(gp=>dist({x,y},gp) < gp.r); }
  for(let x=margin; x<=w-margin+0.001; x+=spacing){
    if(clear(x,margin)) pts.push({x, y:margin});
    if(clear(x,h-margin)) pts.push({x, y:h-margin});
  }
  // starts one step in from the top/bottom rows above so corners aren't
  // double-stamped with two overlapping props.
  for(let y=margin+spacing; y<h-margin; y+=spacing){
    if(clear(margin,y)) pts.push({x:margin, y});
    if(clear(w-margin,y)) pts.push({x:w-margin, y});
  }
  return pts;
}
// The Forest's dirt trail is a handful of waypoints (not a straight line) from
// the Town-side gate to the Mine-side gate; given any x, finds the trail's
// y-center there by interpolating between the two bracketing waypoints.
function forestTrailYAt(waypoints, x){
  for(let i=0;i<waypoints.length-1;i++){
    const a = waypoints[i], b = waypoints[i+1];
    const lo = Math.min(a.x,b.x), hi = Math.max(a.x,b.x);
    if(x>=lo && x<=hi){
      const t = (x-a.x)/((b.x-a.x)||1);
      return a.y + (b.y-a.y)*t;
    }
  }
  return waypoints[waypoints.length-1].y;
}
function circleRectCollide(cx,cy,cr,rx,ry,rw,rh){
  const nx=clamp(cx,rx,rx+rw), ny=clamp(cy,ry,ry+rh);
  const ddx=cx-nx, ddy=cy-ny; return ddx*ddx+ddy*ddy < cr*cr;   // v315: no Math.hypot in the hot path
}
// v487: obstacle lookup grid. Zones have up to a few hundred obstacles and every monster used to test all of them
// every frame; during a simulation step each big obstacle list gets a grid (checked once per step and rebuilt if any
// obstacle moved, appeared or vanished) and only nearby obstacles are tested. Outside update() nothing changes.
let OBS_FRAME = 0, OBS_IN_UPDATE = false;
const OBS_CELL = 128, OBS_GRIDS = new WeakMap(), OBS_IDS = [];
function obsGrid(list){
  if(!OBS_IN_UPDATE || !list || list.length < 24) return null;
  let G = OBS_GRIDS.get(list);
  if(G && G.f===OBS_FRAME && G.n===list.length) return G;
  let sum = 0;
  for(let i=0;i<list.length;i++){ const o = list[i]; sum += o.x*1.3 + o.y*2.7 + o.w*5.1 + o.h*7.9 + i; }
  if(G && G.n===list.length && G.sum===sum){ G.f = OBS_FRAME; return G; }   // nothing moved, added or removed
  if(!G){ G = {f:0, n:0, sum:0, m:new Map(), all:[], seen:null, q:0}; OBS_GRIDS.set(list, G); }
  G.f = OBS_FRAME; G.n = list.length; G.sum = sum; G.m.clear(); G.all.length = 0;
  if(!G.seen || G.seen.length < list.length) G.seen = new Int32Array(list.length*2);
  for(let i=0;i<list.length;i++){
    const o = list[i], x0 = Math.floor(o.x/OBS_CELL), x1 = Math.floor((o.x+o.w)/OBS_CELL), y0 = Math.floor(o.y/OBS_CELL), y1 = Math.floor((o.y+o.h)/OBS_CELL);
    if(!(x1-x0 < 40 && y1-y0 < 40)){ G.all.push(i); continue; }   // huge (or odd) rects are simply always tested
    for(let cx=x0; cx<=x1; cx++) for(let cy=y0; cy<=y1; cy++){ const k = (cx+32768)*65536+(cy+32768); let a = G.m.get(k); if(!a) G.m.set(k, a = []); a.push(i); }
  }
  return G;
}
// indices (ascending, so pushes happen in the original order) of the obstacles whose cells touch the box x±r, y±r
function obsQuery(G, x, y, r){
  const out = OBS_IDS; out.length = 0;
  const q = ++G.q, seen = G.seen;
  for(const i of G.all){ seen[i] = q; out.push(i); }
  const x0 = Math.floor((x-r)/OBS_CELL), x1 = Math.floor((x+r)/OBS_CELL), y0 = Math.floor((y-r)/OBS_CELL), y1 = Math.floor((y+r)/OBS_CELL);
  for(let cx=x0; cx<=x1; cx++) for(let cy=y0; cy<=y1; cy++){ const a = G.m.get((cx+32768)*65536+(cy+32768)); if(a) for(const i of a){ if(seen[i]!==q){ seen[i] = q; out.push(i); } } }
  if(out.length > 1) out.sort((a,b)=>a-b);
  return out;
}
function pushOutOfObstacles(ent, list){
  if(!list) return;
  const G = obsGrid(list);
  if(!G){ for(const o of list) pushOutOfRect(ent,o); return; }
  const ids = obsQuery(G, ent.x, ent.y, (ent.r||0)*2+4);   // wide enough to cover the shove from an earlier rect
  for(let k=0;k<ids.length;k++) pushOutOfRect(ent, list[ids[k]]);
}
// v487: monster separation via a spatial grid -- only monsters sharing a grid cell are compared. Monsters well
// off-screen wait in place (see the onScreen check in the monster loop), so only those near the view are separated.
const SEP_CELL = 64, SEP_GRID = new Map(), SEP_ACT = []; let SEP_STAMP = 0, SEP_SEEN = new Int32Array(256);
function sepPush(a, b){
  const d=dist(a,b), min=a.r+b.r;
  if(d<min && d>0.01){
    const push=(min-d)/2, ang=Math.atan2(b.y-a.y,b.x-a.x);
    a.x-=Math.cos(ang)*push; a.y-=Math.sin(ang)*push;
    b.x+=Math.cos(ang)*push; b.y+=Math.sin(ang)*push;
  }
}
function separateEnemies(list){
  const act = SEP_ACT; act.length = 0;
  const cam = game && game.camera;
  for(const e of list) if(!cam || isPointOnScreen(game, e.x, e.y, 400 + (e.r||0)*2)) act.push(e);
  const n = act.length;
  if(n < 24){ for(let i=0;i<n;i++) for(let j=i+1;j<n;j++) sepPush(act[i], act[j]); return; }
  const f = ++SEP_STAMP;
  if(SEP_SEEN.length < n) SEP_SEEN = new Int32Array(n*2);
  for(let i=0;i<n;i++){
    const a = act[i], r = a.r||0, x0 = Math.floor((a.x-r)/SEP_CELL), x1 = Math.floor((a.x+r)/SEP_CELL), y0 = Math.floor((a.y-r)/SEP_CELL), y1 = Math.floor((a.y+r)/SEP_CELL);
    for(let cx=x0; cx<=x1; cx++) for(let cy=y0; cy<=y1; cy++){
      const k = (cx+32768)*65536+(cy+32768); let c = SEP_GRID.get(k);
      if(!c){ c = {f:0, a:[]}; SEP_GRID.set(k, c); }
      if(c.f!==f){ c.f = f; c.a.length = 0; }
      c.a.push(i);
    }
  }
  if(SEP_GRID.size > 20000) SEP_GRID.clear();
  const seen = SEP_SEEN; seen.fill(-1, 0, n);
  for(let i=0;i<n;i++){
    const a = act[i], r = a.r||0, x0 = Math.floor((a.x-r)/SEP_CELL), x1 = Math.floor((a.x+r)/SEP_CELL), y0 = Math.floor((a.y-r)/SEP_CELL), y1 = Math.floor((a.y+r)/SEP_CELL);
    for(let cx=x0; cx<=x1; cx++) for(let cy=y0; cy<=y1; cy++){
      const c = SEP_GRID.get((cx+32768)*65536+(cy+32768)); if(!c || c.f!==f) continue;
      for(const j of c.a){ if(j>i && seen[j]!==i){ seen[j] = i; sepPush(a, act[j]); } }
    }
  }
}
function pushOutOfRect(ent,r){
  if(!circleRectCollide(ent.x,ent.y,ent.r,r.x,r.y,r.w,r.h)) return;
  const nx=clamp(ent.x,r.x,r.x+r.w), ny=clamp(ent.y,r.y,r.y+r.h);
  let dx=ent.x-nx, dy=ent.y-ny; let d=Math.hypot(dx,dy);
  if(d<0.001){
    // v215: centre is INSIDE the rect (fast dash/knockback tunnelled in). The old code always shoved +x by
    // a radius every frame, which made units 'skim' along water edges. Exit through the nearest side instead.
    const dl=ent.x-r.x, dr=r.x+r.w-ent.x, dt=ent.y-r.y, db=r.y+r.h-ent.y, m=Math.min(dl,dr,dt,db);
    if(m===dl) ent.x = r.x-ent.r; else if(m===dr) ent.x = r.x+r.w+ent.r; else if(m===dt) ent.y = r.y-ent.r; else ent.y = r.y+r.h+ent.r;
    return;
  }
  const push=ent.r-d;
  ent.x += (dx/d)*push; ent.y += (dy/d)*push;
}
// ---- Simple corner-steering helper for followers/monsters ----
// A naive "move straight at the target, then push out of whatever wall you
// clipped" scheme locks up on obstacle corners (the entity oscillates
// in place, pushed one way by collision and pulled back the other way by
// the target). This does a short lookahead: if stepping straight toward
// the target would immediately collide with a nearby obstacle, it tries a
// handful of alternate angles (a cheap "steer around the corner") and
// picks the first one that's clear, remembering which side worked so it
// doesn't flip-flop frame to frame. Not real pathfinding -- just enough to
// unstick arcade-style chase AI against wall corners.
function posBlockedByObstacles(x,y,r,obstacles){
  if(!obstacles || !obstacles.length) return false;
  const G = obsGrid(obstacles);   // v487
  if(G){ const ids = obsQuery(G, x, y, r+1); for(let k=0;k<ids.length;k++){ const o = obstacles[ids[k]]; if(circleRectCollide(x,y,r,o.x,o.y,o.w,o.h)) return true; } return false; }
  for(let i=0;i<obstacles.length;i++){
    const o = obstacles[i];
    if(circleRectCollide(x,y,r,o.x,o.y,o.w,o.h)) return true;
  }
  return false;
}
function updateStuckTracking(ent, dt){
  ent._stuckCheckT = (ent._stuckCheckT||0) + dt;
  if(ent._stuckPos==null) ent._stuckPos = {x:ent.x, y:ent.y};
  if(ent._stuckCheckT >= 0.4){
    const moved = Math.hypot(ent.x-ent._stuckPos.x, ent.y-ent._stuckPos.y);
    ent._isStuck = moved < 6;
    ent._stuckPos.x = ent.x; ent._stuckPos.y = ent.y;
    ent._stuckCheckT = 0;
  }
}
// v516: wall-aware chasing. In rooms built from walls (towers, crypts, caves, the Keep) an enemy that cannot see its target follows a
// flow field (breadth-first distances from the target over a coarse grid) around the walls instead of pressing into them.
const NAV_CELL = 40, NAV_PAD = 20, NAV_MAX_GOALS = 8;
function navBuild(room){
  const n = room.obstacles.length;
  if(room._nav && room._nav.n===n) return room._nav;
  const cols = Math.ceil(room.w/NAV_CELL), rows = Math.ceil(room.h/NAV_CELL), blocked = new Uint8Array(cols*rows);
  for(const o of room.obstacles){
    if(o.w==null || o.noNav) continue;
    const x0 = Math.max(0,Math.floor((o.x-NAV_PAD)/NAV_CELL)), x1 = Math.min(cols-1,Math.floor((o.x+o.w+NAV_PAD)/NAV_CELL));
    const y0 = Math.max(0,Math.floor((o.y-NAV_PAD)/NAV_CELL)), y1 = Math.min(rows-1,Math.floor((o.y+o.h+NAV_PAD)/NAV_CELL));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const cx = (x+0.5)*NAV_CELL, cy = (y+0.5)*NAV_CELL, dx = Math.max(o.x-cx,0,cx-(o.x+o.w)), dy = Math.max(o.y-cy,0,cy-(o.y+o.h));
      if(dx*dx+dy*dy < (NAV_PAD+NAV_CELL*0.35)*(NAV_PAD+NAV_CELL*0.35)) blocked[y*cols+x] = 1;
    }
  }
  return room._nav = {n, cols, rows, blocked, goals:new Map()};
}
function navField(nav, gx, gy){
  const {cols, rows, blocked} = nav, key = gy*cols+gx;
  const hit = nav.goals.get(key); if(hit) return hit;
  const d = new Int32Array(cols*rows).fill(-1), q = [];
  let start = key;
  if(blocked[start]){ start = -1; for(let r=1;r<=3 && start<0;r++) for(let dy=-r;dy<=r && start<0;dy++) for(let dx=-r;dx<=r;dx++){ const x = gx+dx, y = gy+dy; if(x<0||y<0||x>=cols||y>=rows) continue; if(!blocked[y*cols+x]){ start = y*cols+x; break; } } }
  if(start>=0){
    d[start] = 0; q.push(start);
    for(let qi=0; qi<q.length && qi<40000; qi++){
      const i = q[qi], x = i%cols, y = (i-x)/cols;
      for(let k=0;k<4;k++){
        const nx = x+(k===0?1:k===1?-1:0), ny = y+(k===2?1:k===3?-1:0); if(nx<0||ny<0||nx>=cols||ny>=rows) continue;
        const j = ny*cols+nx; if(d[j]>=0 || blocked[j]) continue; d[j] = d[i]+1; q.push(j);
      }
    }
  }
  if(nav.goals.size >= NAV_MAX_GOALS) nav.goals.delete(nav.goals.keys().next().value);
  nav.goals.set(key, d);
  return d;
}
function navFlowAngle(ent, tx, ty){
  const room = game && game.room; if(!room || !room.obstacles) return null;
  const nav = navBuild(room), cols = nav.cols, rows = nav.rows;
  const gx = clamp(Math.floor(tx/NAV_CELL),0,cols-1), gy = clamp(Math.floor(ty/NAV_CELL),0,rows-1);
  const d = navField(nav, gx, gy);
  const ex = clamp(Math.floor(ent.x/NAV_CELL),0,cols-1), ey = clamp(Math.floor(ent.y/NAV_CELL),0,rows-1);
  let best = -1, bx = 0, by = 0, here = d[ey*cols+ex];
  // from inside the inflated wall band (or a pocket) look for the best neighbouring cell instead of giving up
  for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
    if(!dx && !dy) continue; const x = ex+dx, y = ey+dy; if(x<0||y<0||x>=cols||y>=rows) continue;
    const v = d[y*cols+x]; if(v<0) continue;
    if(dx && dy && (nav.blocked[ey*cols+x] || nav.blocked[y*cols+ex])) continue;   // no cutting wall corners
    if(best<0 || v<best){ best = v; bx = x; by = y; }
  }
  if(best<0 || (here>=0 && best>=here)) return null;
  return Math.atan2((by+0.5)*NAV_CELL-ent.y, (bx+0.5)*NAV_CELL-ent.x);
}
function navRoomOn(room){ if(room._navOn===undefined) room._navOn = !!(room.obstacles && room.obstacles.some(o=>o.mazeWall)); return room._navOn; }
function steerAngleTo(ent, tx, ty, obstacles){
  const dx = tx-ent.x, dy = ty-ent.y;
  const baseAng = Math.atan2(dy,dx);
  if(!obstacles || !obstacles.length) return baseAng;
  if(ent.flowChase && game && game.room && game.room.floorMask && game.player && Math.abs(tx-game.player.x)<6 && Math.abs(ty-game.player.y)<6 && losBlocked(obstacles, ent.x, ent.y, tx, ty)){
    const fa = mineFlowAngle(ent); if(fa!=null) return fa;   // v377: the quest horde finds its way through the warren
  }
  if(!ent.flying && game && game.room && navRoomOn(game.room) && game.player){
    const toP = Math.abs(tx-game.player.x)<6 && Math.abs(ty-game.player.y)<6;
    if(toP ? !enemyLOS(game, ent, game.player) : losBlocked(obstacles, ent.x, ent.y, tx, ty)){ const na = navFlowAngle(ent, tx, ty); if(na!=null) return na; }   // v516
  }
  const r = ent.r||10;
  const look = Math.max(r*1.6, 22);
  const clear = (ang)=> !posBlockedByObstacles(ent.x+Math.cos(ang)*look, ent.y+Math.sin(ang)*look, r, obstacles);
  // when actively stuck, skip straight ahead entirely and go right to the
  // wider steering angles -- the direct line is what's causing the jam
  if(!ent._isStuck && clear(baseAng)){ return baseAng; }
  const side = ent._steerSide || 1;
  const offsetsDeg = ent._isStuck ? [60,90,120,150] : [30,45,60,90,120];
  for(const deg of offsetsDeg){
    const off = deg*Math.PI/180;
    for(const s of [side, -side]){
      const ang = baseAng + off*s;
      if(clear(ang)){ ent._steerSide = s; return ang; }
    }
  }
  // boxed in on every side tried -- fall back to the direct line; the
  // circle/rect push-out that runs after movement still keeps it legal
  return baseAng;
}

// ---------- Line of sight (v147) ----------
// Walls block targeting, engaging and attacking for enemies, followers and the player's auto-target.
// Water rects and furniture don't block sight.
function losBlocked(obstacles,x1,y1,x2,y2){
  if(!obstacles) return false;
  const minx=Math.min(x1,x2), maxx=Math.max(x1,x2), miny=Math.min(y1,y2), maxy=Math.max(y1,y2);
  const dx=x2-x1, dy=y2-y1;
  for(let i=0;i<obstacles.length;i++){
    const o=obstacles[i];
    if(o.isWater || o.isFurniture || o.isProp) continue;
    if(o.x>maxx || o.x+o.w<minx || o.y>maxy || o.y+o.h<miny) continue;
    let t0=0, t1=1, miss=false;
    if(Math.abs(dx)<1e-9){ if(x1<o.x || x1>o.x+o.w) miss=true; }
    else { let a=(o.x-x1)/dx, b=(o.x+o.w-x1)/dx; if(a>b){const t=a;a=b;b=t;} if(a>t0)t0=a; if(b<t1)t1=b; if(t0>t1) miss=true; }
    if(miss) continue;
    if(Math.abs(dy)<1e-9){ if(y1<o.y || y1>o.y+o.h) continue; }
    else { let a=(o.y-y1)/dy, b=(o.y+o.h-y1)/dy; if(a>b){const t=a;a=b;b=t;} if(a>t0)t0=a; if(b<t1)t1=b; if(t0>t1) continue; }
    return true;
  }
  return false;
}
function hasLOS(g,a,b){ return !(g && g.room && losBlocked(g.room.obstacles, a.x,a.y,b.x,b.y)); }
// cached per enemy (refreshed ~every 0.15s) -- p slot and a general slot
function enemyLOS(g,e,tgt){
  const slot = tgt===g.player ? '_losP' : '_losO';
  let c = e[slot];
  const t = g.clock||0;
  if(c && c.tg===tgt && t-c.t <= c.iv) return c.v;
  // v501: far-away enemies re-check their sight line less often
  const dd = Math.abs(e.x-tgt.x) + Math.abs(e.y-tgt.y), iv = dd > 1000 ? 0.6 : dd > 600 ? 0.3 : 0.15;
  c = e[slot] = {tg:tgt, t:t+Math.random()*0.05, iv, v:hasLOS(g,e,tgt)};
  return c.v;
}
// v501: same cache, one entry per target (followers: the closest-ally pick asks about every one of them each frame)
function enemyLOSMulti(g,e,tgt){
  const t = g.clock||0, m = e._losM || (e._losM = new Map());
  let c = m.get(tgt);
  if(c && t-c.t <= 0.2) return c.v;
  c = {t:t+Math.random()*0.06, v:hasLOS(g,e,tgt)}; m.set(tgt, c);
  if(m.size > 12){ for(const k of m.keys()){ if(!(k.hp>0)) m.delete(k); } }
  return c.v;
}
const BOSS_WAKE_R = 560; // bosses stay rooted until the player is this close with a clear line of sight
const ENGAGE_R = 340; // non-holding scenes: enemies only start acting this close (and with a clear line)

// ---------- Isometric projection ----------
const ISO_KX = 0.85, ISO_KY = 0.425; // 2:1 iso ratio
// v497: stand facing the screen (login, respawn, back in town) -- never turned away from the camera
function faceScreen(p){ if(!p) return; p.facing = {x:0.6, y:0.8}; p._backView = false; p.faceSign = screenFacingSign(p.facing.x, p.facing.y); }
function toIso(x,y){ const z = (game && (game.scene==='redcrater' || game.scene==='mountainpass' || game.scene==='redridge' || game.scene==='highlands')) ? crElevAt(x,y) : 0; return { x:(x-y)*ISO_KX, y:(x+y)*ISO_KY - z }; }
// Is a world-space point currently within the visible screen (camera is
// always locked to the player's iso position), plus a small buffer margin
// so things don't just freeze dead at the exact screen edge. Used to keep
// enemies (including the boss) from engaging/attacking while off-screen.
function isPointOnScreen(g, wx, wy, margin){
  margin = margin==null ? 90 : margin;
  const iso = toIso(wx, wy);
  const sx = iso.x - g.camera.x, sy = iso.y - g.camera.y;
  return sx > -margin && sx < W+margin && sy > -margin && sy < H+margin;
}
function isOnScreen(g, e, margin){ return isPointOnScreen(g, e.x, e.y, margin); }
function screenDirToWorld(jx,jy){
  // convert a screen-space joystick direction into a world-space movement direction
  const wx = jx/2 + jy, wy = jy - jx/2;
  const mag = Math.hypot(wx,wy)||1;
  const inMag = Math.hypot(jx,jy);
  return { x:(wx/mag)*inMag, y:(wy/mag)*inMag };
}
function screenFacingSign(fx,fy){ return (fx-fy)>=0 ? 1 : -1; }

