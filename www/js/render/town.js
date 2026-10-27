// ---------- Town (outdoors) ----------
// How far past the room's own bounds the ground texture keeps tiling, so the
// grass/path continues a good distance beyond the town fence or forest tree
// line instead of cutting off right at the edge (which used to make the map
// look like a small island floating in the sky/void once the camera panned
// toward a wall). Tiles outside the screen are still skipped cheaply below,
// so this costs a bit more loop iteration, not more actual drawing.
const GROUND_MARGIN = 700;
function drawTownFloor(room, cam){
  // v196 Mistfall reskin: cold slate cobbles, a worn flagstone road and a plaza round the well, sunken grey-green grass beyond
  const TS = 46, T = game && game.town, well = T && T.well;
  if(FLOOR_PASS!==2) for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
    for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const gx = Math.floor(wx/TS), gy = Math.floor(wy/TS);
      const checker = ((gx+gy)%2+2)%2, hsh = (((gx*73856093) ^ (gy*19349663))>>>0)%100;
      const dRoad = Math.abs(wy-(room.roadY||170));
      const spur = !(dRoad<60) && townPathAt(T,wx,wy);
      const onPath = dRoad < 60 || spur;
      const inPlaza = well && Math.hypot(wx-well.x, wy-well.y) < 150;
      const outside = wx<0 || wy<0 || wx>room.w || wy>room.h;
      let paved = false;
      if(outside) ctx.fillStyle = checker ? '#0f1716' : '#0c1312';
      else if(onPath){
        paved = true;
        ctx.fillStyle = spur ? (hsh<25 ? '#2a241e' : (checker ? '#3c342a' : '#362e25')) : hsh<22 ? '#2b2d36' : (dRoad>60-TS ? (checker?'#4a4d5a':'#444756') : (checker ? '#3b3e4a' : '#353845'));
      } else if(inPlaza){
        paved = true;
        ctx.fillStyle = hsh<18 ? '#2a2c35' : (checker ? '#3f4250' : '#383b48');
      } else ctx.fillStyle = hsh<14 ? '#121b19' : (checker ? '#1b2926' : '#18251f');
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
      if(outside) continue;
      if(paved){
        // cobble seams, chips and the odd wet sheen
        ctx.strokeStyle = 'rgba(8,8,14,0.45)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(iso.x-14,iso.y-2); ctx.lineTo(iso.x+2,iso.y+5); ctx.moveTo(iso.x+3,iso.y-6); ctx.lineTo(iso.x+15,iso.y); ctx.stroke();
        if(hsh%4===0){ ctx.strokeStyle = 'rgba(120,130,160,0.16)'; ctx.beginPath(); ctx.moveTo(iso.x-10,iso.y+6); ctx.lineTo(iso.x+8,iso.y+9); ctx.stroke(); }
        if(hsh%7===2){ ctx.fillStyle = 'rgba(70,96,86,0.35)'; ctx.beginPath(); ctx.ellipse(iso.x+5,iso.y+1,7,3,0,0,7); ctx.fill(); }   // moss in the cracks
        if(hsh%11===3){ ctx.fillStyle = 'rgba(90,110,150,0.18)'; ctx.beginPath(); ctx.ellipse(iso.x-4,iso.y,9,3.5,0,0,7); ctx.fill(); }   // puddle
      } else {
        if(hsh%4===0){ ctx.strokeStyle = 'rgba(70,104,92,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for(let k=-1;k<=1;k++){ ctx.moveTo(iso.x+k*7,iso.y+3); ctx.lineTo(iso.x+k*7+k*1.5,iso.y-4); } ctx.stroke(); }
        if(hsh%13===5){ ctx.fillStyle = 'rgba(120,130,150,0.22)'; ctx.beginPath(); ctx.ellipse(iso.x,iso.y,8,3.6,0,0,7); ctx.fill(); }   // scattered flagstone
      }
    }
  }
  drawTownWater(room, cam);
}
// A darker, mossier checkerboard than the town square, with a worn dirt
// trail running between the two forest gates.
// v456: the first stretch of Mistfall seen past the Dark Forest's west edge (town gate lines up with the forest's town gate)
function townPreviewOffset(g){ const T=g.town, F=g.forest; if(!T||!F||!F.townGate||!T.gate) return null; return {dx:F.townGate.x - T.gate.x - 40, dy:F.townGate.y - T.gate.y}; }
function drawTownPreviewFloor(g, cam){
  const o = townPreviewOffset(g); if(!o) return;
  const io = toIso(o.dx, o.dy), h = g.room.h;
  ctx.save();
  const c1 = toIso(0,-3000), c2 = toIso(0,h+3000), c3 = toIso(-3600,h+3000), c4 = toIso(-3600,-3000);
  ctx.beginPath(); ctx.moveTo(c1.x,c1.y); ctx.lineTo(c2.x,c2.y); ctx.lineTo(c3.x,c3.y); ctx.lineTo(c4.x,c4.y); ctx.closePath(); ctx.clip();
  ctx.translate(io.x, io.y);
  const c2m = {x:cam.x-io.x, y:cam.y-io.y};
  drawTownFloor(g.town, c2m);
  if(FLOOR_PASS!==2) drawTownPerimeter(g.town);
  ctx.restore();
}
function pushTownPreviewDrawables(g, cam, drawables){
  const o = townPreviewOffset(g); if(!o) return;
  const T = g.town, io = toIso(o.dx, o.dy);
  const vis = (x,y)=>{ const i=toIso(x+o.dx,y+o.dy); return i.x>cam.x-260 && i.x<cam.x+W+260 && i.y>cam.y-360 && i.y<cam.y+H+260; };
  const add = (x,y,fn)=>{ if(!vis(x,y)) return; drawables.push({depth:(x+o.dx)+(y+o.dy), draw:()=>{ ctx.save(); ctx.translate(io.x, io.y); fn(); ctx.restore(); }}); };
  const clk = g.clock||0;
  if(T.trees) for(const tr of T.trees) add(tr.x,tr.y,()=>(tr.dead ? drawDeadTreeIso(tr) : drawTreeIso(tr)));
  if(T.outerTrees) for(const tr of T.outerTrees){ if(tr.x > T.w-20) continue; add(tr.x,tr.y,()=>(tr.dead ? drawDeadTreeIso(tr) : drawTreeIso(tr))); }
  if(T.decoBuildings) for(const db of T.decoBuildings) add(db.x+db.w/2, db.y+db.h/2, ()=>drawBuildingIso(db));
  if(T.tavern){ const tb=T.tavern; add(tb.x+tb.w/2, tb.y+tb.h/2, ()=>drawBuildingIso(tb)); }
  if(T.blacksmith) add(T.blacksmith.x, T.blacksmith.y, ()=>drawBlacksmithIso(T.blacksmith, clk));
  if(T.well) add(T.well.x, T.well.y, ()=>drawWellIso(T.well, clk));
  if(T.tent) add(T.tent.x, T.tent.y, ()=>drawTentIso(T.tent));
  if(T.bonfire) add(T.bonfire.x, T.bonfire.y, ()=>drawBonfireIso(T.bonfire, clk));
  if(T.waypoint) add(T.waypoint.x, T.waypoint.y, ()=>drawWaypointIso(T.waypoint, clk, true));
  if(T.props) for(const pr of T.props) add(pr.x, pr.y+(pr.k==='fence'?pr.len/2:0), ()=>drawTownProp(pr, clk));
  for(const sgn of [-1,1]){ const gp = {x:T.w-6, y:(T.roadY||TOWN_ROAD_Y)+sgn*56-(sgn<0?14:0)}; add(gp.x, gp.y+14, ()=>drawGatePillarIso(gp, clk)); }
}
// v456: the ground past a zone's exit takes on the next zone's colours, so you can see where you're headed
const EDGE_PAL = { forest:['#13291b','#173320'], river:['#2a4a28','#30522c'], sunlit:['#3f4a2c','#454f30'], lake:['#363f2e','#3c4633'],
  cemetery:['#20233a','#262a42'], marsh:['#2f3d22','#29361e'], mountain:['#5d5348','#544a40'], coast:['#4c4c4a','#454543'] };
function mixRGB(a,b,t){ return 'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')'; }
function edgeLinks(room){
  if(room._edgeL) return room._edgeL;
  const L = [], sc = game && game.scene;
  const add = (gt,k)=>{ if(!gt) return; const side = gt.x < room.w*0.08 ? 'w' : gt.x > room.w*0.92 ? 'e' : gt.y < room.h*0.08 ? 'n' : 's'; L.push({x:gt.x, y:gt.y, pal:EDGE_PAL[k], side}); };
  if(sc==='forest'){ add(room.sunGate,'river'); }
  else if(sc==='sunlitplains'){ add(room.forestGate,'river'); add(room.westGate,'coast'); add(room.eastGate,'lake'); add(room.southGate,'cemetery'); }
  else if(sc==='lakesideruins'){ add(room.sunlitGate,'sunlit'); }
  else if(sc==='cursedcemetery'){ add(room.sunlitGate,'sunlit'); }
  return room._edgeL = L;
}
// v551: zones whose whole surroundings are painted (no more black squares past the edge): each side shows the land
// beyond it, and the roads run on out through their gates
const OUTSIDE_SIDES = {
  sunlitplains: {n:'river', w:'cliffsea', e:'lake', s:'cemetery'},
  lakesideruins: {w:'sunlitroad', n:'forest', e:'forest', s:'forest'},
};
const OUT_ROAD = ['#5e4d37','#544530'], OUT_ROAD_X = 300;   // the Crossroads' own road beyond the Lakeside's west gate runs north-south this far out
function outsideFill(room, wx, wy, cfg){
  const ix = Math.floor(wx/46), iy = Math.floor(wy/46), ck = ((ix+iy)%2+2)%2, hs = tileHash(ix, iy);
  const dw = -wx, de = wx-room.w, dn = -wy, ds = wy-room.h;
  let side = 'n', d = dn; if(dw>d){ side = 'w'; d = dw; } if(de>d){ side = 'e'; d = de; } if(ds>d){ side = 's'; d = ds; }
  const kind = cfg[side], rw = SUN_ROAD_HALFW + (hs-0.5)*14;
  for(const l of edgeLinks(room)){ if(l.side!==side || kind==='cliffsea') continue; const lat = (side==='w'||side==='e') ? Math.abs(wy-l.y) : Math.abs(wx-l.x); if(lat < rw && (kind!=='sunlitroad' || d < OUT_ROAD_X+SUN_ROAD_HALFW)) return OUT_ROAD[ck]; }
  if(kind==='cliffsea'){
    if(d < 50) return hs<0.3 ? '#5a5248' : (ck ? '#6a6156' : '#625a50');      // the rocky lip
    if(d < 110) return ck ? '#2a2622' : '#24201d';                             // the cliff falling away
    if(d < 150) return hs<0.5 ? '#6e8ea4' : '#58788e';                        // surf breaking at its foot
    return hs<0.15 ? '#1e4a74' : (ck ? '#163c62' : '#133658');                // the open sea below
  }
  if(kind==='sunlitroad'){ if(Math.abs(d-OUT_ROAD_X) < rw) return OUT_ROAD[ck]; const p = ['#5a5234','#544c30']; return hs<0.2 ? '#4e4a2e' : p[ck]; }
  const pal = EDGE_PAL[kind] || EDGE_PAL.forest;
  return hs < 0.12 ? pal[1-ck] : pal[ck];
}
function edgeFill(room, wx, wy){
  { const cfg = OUTSIDE_SIDES[game && game.scene]; if(cfg) return outsideFill(room, wx, wy, cfg); }
  const ix = Math.floor(wx/46), iy = Math.floor(wy/46), ck = ((ix+iy)%2+2)%2;
  for(const l of edgeLinks(room)){
    const along = l.side==='w' ? -wx : l.side==='e' ? wx-room.w : l.side==='n' ? -wy : wy-room.h;
    if(along<=0) continue;
    const lat = (l.side==='w'||l.side==='e') ? Math.abs(wy-l.y) : Math.abs(wx-l.x);
    const t = clamp(along/160,0,1) * clamp(1-(lat-420)/460,0,1);
    if(t>0 && tileHash(ix,iy) < t) return l.pal[ck];
  }
  return null;
}
function drawForestFloor(room, cam){
  const TS = 46, rg = room.roadGrid, clock = (game&&game.clock)||0;
  if(FLOOR_PASS!==2) for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      if(wx<0||wy<0||wx>room.w||wy>room.h){ const ef = edgeFill(room, wx, wy); if(ef){ if(FLOOR_PASS!==2){ ctx.fillStyle = ef; drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); } continue; } }
      const gx = Math.floor(wx/TS), gy = Math.floor(wy/TS);
      const checker = ((gx+gy)%2+2)%2, hsh = (((gx*73856093) ^ (gy*19349663))>>>0)%100;
      if(room.lShape && wx>=0 && wy>=0 && wx<=room.w && wy<=room.h && !forestOpenAt(wx, wy, -40)){
        ctx.fillStyle = hsh<20 ? '#07120b' : (checker ? '#0a170e' : '#0c1a10'); drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); continue;
      }
      const road = roadTileAt(rg, wx, wy);
      if(road){
        ctx.fillStyle = hsh<30 ? '#5e4d37' : hsh<65 ? '#54452f' : '#4b3d2a';
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        // packed-earth road: pebbles and wheel ruts
        ctx.fillStyle = 'rgba(140,124,96,0.55)';
        if(hsh%3===0){ ctx.beginPath(); ctx.ellipse(iso.x-9,iso.y+2,3,1.6,0,0,7); ctx.ellipse(iso.x+7,iso.y-3,2.4,1.3,0,0,7); ctx.fill(); }
        if(hsh%5===1){ ctx.strokeStyle = 'rgba(30,22,14,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(iso.x-16,iso.y-3); ctx.lineTo(iso.x+16,iso.y+3); ctx.stroke(); }
      } else {
        const verge = roadTileAt(rg,wx+TS,wy)||roadTileAt(rg,wx-TS,wy)||roadTileAt(rg,wx,wy+TS)||roadTileAt(rg,wx,wy-TS);
        if(verge) ctx.fillStyle = checker ? '#26361f' : '#2a3b22';
        else ctx.fillStyle = hsh<12 ? '#0e1f15' : (checker ? '#13291b' : '#173320');
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(hsh%4===0){ ctx.strokeStyle = 'rgba(46,92,54,0.55)'; ctx.lineWidth = 1; ctx.beginPath(); for(let k=-1;k<=1;k++){ ctx.moveTo(iso.x+k*7,iso.y+3); ctx.lineTo(iso.x+k*7+k*1.5,iso.y-4); } ctx.stroke(); }
      }
    }
  }
  for(const o of room.obstacles){ if(o.kind==='pond'){ const io = toIso(o.x+o.w/2,o.y+o.h/2); const sx=io.x-cam.x, sy=io.y-cam.y; if(sx>-300 && sx<W+300 && sy>-260 && sy<H+260) drawPondIso(o, clock); } }
}
// Icy zones' ground: Summit = open snowfield, Shrine = pale frosted flagstones
// with a lighter processional path to the altar, Cellar = dark blue ice.
function drawIcyZoneFloor(room, cam){
  const TS = 46, kind = room.kind;
  for(let wx=-GROUND_MARGIN; wx<=room.w+GROUND_MARGIN; wx+=TS){
    for(let wy=-GROUND_MARGIN; wy<=room.h+GROUND_MARGIN; wy+=TS){
      const iso = toIso(wx,wy);
      const sx = iso.x - cam.x, sy = iso.y - cam.y;
      if(sx < -80 || sx > W+80 || sy < -80 || sy > H+80) continue;
      const checker = (((Math.floor(wx/TS)+Math.floor(wy/TS))%2)+2)%2;
      if(wx<0 || wy<0 || wx>room.w || wy>room.h){ ctx.fillStyle = kind==='cellar' ? (checker?'#0a1219':'#070d13') : (checker?'#3a4756':'#323f4d'); drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY); continue; }
      if(kind==='summit'){
        // v523: the old worn path -- packed, dirty snow with bare rock showing through, ragged at the edges
        const td = room.trail ? icyTrailDist(room, wx, wy) : 1e9, hs = tileHash(Math.floor(wx/TS), Math.floor(wy/TS));
        if(td < 58 || (td < 92 && hs < 0.45)) ctx.fillStyle = td < 58 ? (hs<0.25 ? '#a39c90' : checker ? '#bdb6aa' : '#b3ac9f') : (checker ? '#d0ccc4' : '#c6c2b9');
        else ctx.fillStyle = checker ? '#eaf2f8' : '#d9e6ef';
        drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
        if(td < 58 && hs > 0.6){ ctx.fillStyle = 'rgba(90,84,76,0.45)'; ctx.beginPath(); ctx.ellipse(iso.x+(hs-0.8)*30, iso.y+1, 6, 2.6, 0, 0, 7); ctx.ellipse(iso.x-6, iso.y-4, 3, 1.4, 0, 0, 7); ctx.fill(); }   // footprints and stones
        continue;
      }
      else if(kind==='shrine'){
        const path = Math.abs(wy-room.h/2) < 46 && wx < room.w-220;
        ctx.fillStyle = path ? (checker?'#e4ecf2':'#d5dfe8') : (checker?'#9fb0c1':'#90a2b4');
      }
      else ctx.fillStyle = checker ? '#3b5468' : '#324a5c';
      drawDiamond(iso.x, iso.y, TS*ISO_KX, TS*ISO_KY);
    }
  }
}
function drawIcyOverlay(g){
  const t = g.clock||0;
  const vg = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);
  vg.addColorStop(0,'rgba(150,210,255,0)'); vg.addColorStop(1,'rgba(150,210,255,'+(0.22+0.05*Math.sin(t*2))+')');
  ctx.fillStyle = vg; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for(let i=0;i<70;i++){
    const x = ((i*173.3 + t*(40+(i%5)*12)) % (W+40)) - 20;
    const y = ((i*97.7 + t*(30+(i%3)*14)) % (H+20)) - 10;
    ctx.fillRect(x,y,2,2);
  }
  // v523: the cold is shown only by its buff-row icon (the text here sat on top of the zone name)
}
function drawShrineAltarIso(a, clock){
  const iso = toIso(a.x,a.y);
  drawShadow(iso.x, iso.y, 30, 12);
  ctx.save(); ctx.translate(iso.x, iso.y);
  ctx.fillStyle='#7d8996'; ctx.strokeStyle='#39424c'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(-28,0); ctx.lineTo(0,-13); ctx.lineTo(28,0); ctx.lineTo(0,13); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#a9b6c3';
  ctx.beginPath(); ctx.moveTo(-18,-4); ctx.lineTo(0,-13); ctx.lineTo(18,-4); ctx.lineTo(18,-16); ctx.lineTo(0,-25); ctx.lineTo(-18,-16); ctx.closePath(); ctx.fill(); ctx.stroke();
  const pulse = 0.6+0.4*Math.sin(clock*2.4);
  ctx.shadowColor='rgba(120,210,255,'+pulse+')'; ctx.shadowBlur=18;
  ctx.fillStyle='#9fe0ff';
  ctx.beginPath(); ctx.moveTo(0,-56); ctx.lineTo(9,-38); ctx.lineTo(0,-24); ctx.lineTo(-9,-38); ctx.closePath(); ctx.fill();
  ctx.restore();
}
