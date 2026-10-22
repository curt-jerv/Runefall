// ---- v85: Region Map popup -- see the HTML/CSS comments above
// #regionMapOverlay for the overall design. zoneDisplayName() is the same
// scene-name logic the old top-right #depthNum plaque used to run inline
// in update()/updateTown(), pulled out into its own helper so both the
// Region Map and the Character Stats popup (see statSummaryHtml) can
// share it instead of duplicating the ternary chain a third time.
function zoneDisplayName(){
  const g = game;
  if(!g || !g.started) return 'Mistfall Square';
  if(g.scene==='town') return 'Mistfall Square';
  if(g.scene==='forest') return 'Dark Forest';
  // Patch (Sept 2026): 'sunlitplains' had no case here -- it fell through to
  // the "Depths -- Floor N" default below, which is wrong (Withered Crossroads
  // isn't a dungeon floor and has no g.depth of its own). Added while
  // wiring up its Region Map schematic below.
  if(g.scene==='sunlitplains') return 'Withered Crossroads';
  if(g.scene==='rivervalley') return 'River Valley';
  if(g.scene==='minotaurcave') return 'Minotaur Cave';
  if(g.scene==='lakesideruins') return 'Lakeside Ruins';
  if(g.scene==='cursedcemetery') return 'Cursed Cemetery';
  if(g.scene==='blackmarsh') return 'Black Marsh';
  if(g.scene==='highlands') return 'Barren Highlands';
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep') return g.tower.name;
  if(g.scene==='mountainpass') return isCliff(g) ? (g.mtn.nest ? "Harpy's Nest" : 'Cliffside Ascent') : 'Mountain Pass';
  if(g.scene==='icyzone') return g.iz ? g.iz.name : 'Icy Summit';
  if(g.scene==='frosthold') return 'Frosthold Keep';
  if(g.scene==='redridge') return (g.rr && g.rr.name) || 'Redridge Canyon';
  if(g.scene==='redcrater') return 'Redridge Crater';
  if(g.scene==='raptorlair') return 'Raptor Lair \u2014 Level '+(g.rlair?g.rlair.floor:1);
  if(g.scene==='spiderlair') return 'Spider Lair';
  if(g.scene==='bearcave') return 'Bear Cave';
  if(g.scene==='ancientruins') return (g.ruins && g.ruins.fhd) ? ('Frosthold Dungeon \u2014 '+FHD_INFO[g.ruins.floor].name) : 'Ancient Ruins \u2014 Level '+(g.ruins?g.ruins.floor:1);
  if(g.scene==='darkcrypt') return 'Dark Crypt';
  if(g.scene==='lighthouse' && g.tower && (g.tower.subzone || g.tower.deep)) return g.tower.name+' (Lv. '+g.depth+')';
  if(g.scene==='lighthouse' && g.tower && g.tower.fht) return 'Frosthold Tower \u2014 Floor '+g.lighthouseFloor+' (Lv. '+g.depth+')';
  if(g.scene==='lighthouse') return (g.tower && g.tower.ft ? 'Forgotten Tower' : 'Lighthouse Tower')+(g.lighthouseFloor?' \u2014 Floor '+g.lighthouseFloor:'');
  if(g.scene==='tavern') return 'The Tavern';
  return 'The Depths — Floor '+(g.depth||1);
}
// Static reference lists of the landmarks typically found in each
// procedurally-generated zone. This is a first-pass baseline, NOT a live
// discovery-tracking system -- unlike Town (which has fixed, known
// landmark coordinates plotted for real below), these zones regenerate
// per visit, so there's no stable layout to plot a schematic from yet.
const ZONE_LANDMARKS = {
  mountainpass: [['Forest Trail (back)','F'], ['Mountain Depths (far south)','M'], ['Icy Summit (north)','^'], ['Frosthold Keep (east)','K']],
  frosthold: [['Mountain Pass (west gate)','P'], ['Frosthold Tower','T'], ['Frosthold Dungeon (sealed)','D'], ['Waypoint','W'], ['Redridge Canyon (east gate)','R']],
  redridge: [['Frosthold Keep (west gate)','F'], ['Waypoint','W'], ['The Road East (sealed)','E'], ['Raptor Lair (south)','L'], ['Redridge Crater (north)','C']],
  redcrater: [['Redridge Canyon (south gate)','R'], ['Obsidian Obelisk','O'], ['Gojira','!']],
  raptorlair: [['Redridge Canyon (back)','R'], ['Stairs Down','v'], ['Flame Raptor','!']],
  icyzone: [['Icy Summit','^'], ['Mountain Top Shrine (east)','S'], ['Icy Cellar (west)','C']],
  spiderlair: [['Forest Entrance (back)','F'], ['Spider Boss Den','!']],
  bearcave: [['Forest Entrance (back)','F'], ['Bear Den','!']],
  minotaurcave: [['River Valley Entrance (back)','R'], ['Minotaur\'s Lair','!']],
  lighthouse: [['Mountain Pass Entrance (back)','M'], ['Tower Ascent','^']],
  lakesideruins: [['Withered Crossroads (west)','S'], ['Ancient Ruins (island)','R']],
  blackmarsh: [['Cave from the Sunken Depths (far west, one way)','C'], ["Witch\'s House & Cauldron",'H'], ['Waypoint','W'], ['Forgotten Tower (far east)','T'], ['Tower Bridge (over the great river)','='], ['Marsh Pool (north edge, east)','P'], ['Barren Highlands (north-west)','B']],
};
// Patch (Sept 2026): shared plotting helper, factored out of the old
// Town-only branch below so the same "plot fixed landmark coords + the
// player's own dot on a WxH box" logic can also drive the new Dark Forest
// and Withered Crossroads schematics -- those two zones (unlike the procedural
// dungeon floors/lairs still on the generic ZONE_LANDMARKS list above) have
// a fixed, known footprint (FOREST_W/H, SUN_W/H) and fixed gate objects
// (g.forest.*Gate, g.sun.*Gate), so a real "you are here + exits" schematic
// is possible for them the same way it already was for Town.
// v533: earthier, painted ground colours per region (Diablo-style parchment maps)
const MAP_TINT = {highlands:'#4f4838', forest:'#24301e', rivervalley:'#2e3d25', sunlitplains:'#5a5034', cursedcemetery:'#272834', lakesideruins:'#2b3a27', blackmarsh:'#26322a', mountainpass:'#47464a', icyzone:'#8996a3', frosthold:'#566070', redridge:'#6a3d28', redcrater:'#56291c', lighthouse:'#4a4842', town:'#4a4232'};
// Marker colours (kept as the badge's inner glow): gates green, waypoint cyan, danger red, stairs/loot gold
function mapMarkStyle(lm){
  const ic = lm.icon, lb = (lm.label||'');
  if(lb==='Waypoint') return '#5fd0ff';
  if(ic==='!' || /Gojira|Rex|Lair$|Boss|Bandit/.test(lb) && ic==='!') return '#e05a5a';
  if(ic==='▼' || ic==='▲' || ic==='*' || ic==='?' || ic==='O' || ic==='S' && /Altar|Stash/.test(lb)) return '#e8c44a';
  return '#7fd87f';
}
// which little picture a marker gets, from its letter and label
function mapGlyphKind(ch, label, col){
  const lb = label || '';
  if(lb==='Waypoint' || (ch==='W' && col==='#5fd0ff')) return 'waypoint';
  if(ch==='!') return 'skull';
  if(ch==='▼') return 'down';
  if(ch==='▲') return 'up';
  if(ch==='★' || ch==='■') return 'chest';
  if(ch==='✦') return 'flame';
  if(/Cave|Lair|Depths|Tunnel|Mine|Den|Nest/.test(lb)) return 'cave';
  if(/Tower|Watchtower|Lighthouse|Keep/.test(lb)) return 'tower';
  if(/Camp|Graverobbers|Wayfarer|Cauldron/.test(lb)) return 'fire';
  if(/House|Witch|Tavern/.test(lb)) return 'house';
  if(/Statue|Shrine|Altar|Obelisk|Stone/.test(lb) || ch==='+') return 'shrine';
  if(/Ruins|Crypt|Tomb/.test(lb)) return 'tomb';
  if(/Bridge/.test(lb) || ch==='=') return 'bridge';
  if(/Waterfall|Pool|Lake/.test(lb) || ch==='~') return 'water';
  return 'gate';
}
// a dark iron medallion with a gold rim and a small drawn picture -- used by every region and dungeon map
function mapBadge(c, x, y, ch, col, label, R){
  R = R || 12;
  const kind = mapGlyphKind(ch, label, col);
  c.save(); c.translate(x, y);
  c.fillStyle = 'rgba(0,0,0,.55)'; c.beginPath(); c.arc(1.5, 2, R+2, 0, 7); c.fill();
  const gr = c.createRadialGradient(0, -R*0.3, 1, 0, 0, R);
  gr.addColorStop(0, col); gr.addColorStop(0.55, 'rgba(30,22,14,.92)'); gr.addColorStop(1, '#120d08');
  c.fillStyle = gr; c.globalAlpha = 1; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
  c.lineWidth = 2.2; c.strokeStyle = '#b8902e'; c.stroke();
  c.lineWidth = 0.8; c.strokeStyle = 'rgba(255,230,150,.55)'; c.beginPath(); c.arc(0, 0, R-2.2, Math.PI*1.1, Math.PI*1.9); c.stroke();
  const s = R/12, fg = '#f2e4bc', dk = '#1a120a';
  c.lineJoin = 'round'; c.lineCap = 'round'; c.scale(s, s);
  const P = (pts, fill)=>{ c.beginPath(); pts.forEach((q,i)=>i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1])); c.closePath(); c.fillStyle = fill; c.fill(); };
  if(kind==='waypoint'){ c.shadowColor = '#5fd0ff'; c.shadowBlur = 6; P([[0,-7],[5,0],[0,7],[-5,0]], '#bff0ff'); c.shadowBlur = 0; P([[0,-3.4],[2.4,0],[0,3.4],[-2.4,0]], '#2a6a8a'); }
  else if(kind==='skull'){ c.fillStyle = '#f0e8d8'; c.beginPath(); c.arc(0,-1.5,5.6,0,7); c.fill(); c.fillRect(-3.4,2,6.8,3.6); c.fillStyle = dk; c.beginPath(); c.arc(-2.1,-1.6,1.6,0,7); c.arc(2.1,-1.6,1.6,0,7); c.fill(); c.fillRect(-0.5,0.6,1,1.6); c.fillRect(-2.4,3.6,1,2); c.fillRect(-0.5,3.6,1,2); c.fillRect(1.4,3.6,1,2); }
  else if(kind==='down' || kind==='up'){ c.fillStyle = fg; for(let i=0;i<3;i++){ const w = 3+i*2.4, yy = kind==='down' ? -5+i*3.6 : 4-i*3.6; c.fillRect(-w, yy, w*2, 2.2); } P(kind==='down' ? [[-3,5.6],[3,5.6],[0,8.6]] : [[-3,-5.4],[3,-5.4],[0,-8.4]], '#e8c44a'); }
  else if(kind==='chest'){ c.fillStyle = '#8a5a2a'; c.fillRect(-6,-2,12,7.5); c.fillStyle = '#a8703a'; c.beginPath(); c.moveTo(-6,-2); c.quadraticCurveTo(0,-8,6,-2); c.closePath(); c.fill(); c.fillStyle = '#e8c44a'; c.fillRect(-6,-1.2,12,1.3); c.fillRect(-1,-1,2,3.4); }
  else if(kind==='flame'){ P([[0,-8],[4.5,0],[2.6,5],[-2.6,5],[-4.5,0]], '#ffb040'); P([[0,-3.5],[2,1.6],[0,4.6],[-2,1.6]], '#fff0a0'); }
  else if(kind==='cave'){ P([[-8,6],[-6,-1],[-2,-6],[3,-6],[7,-1],[8,6]], '#8a8478'); P([[-4.2,6],[-4,0],[0,-3.4],[4,0],[4.2,6]], dk); }
  else if(kind==='tower'){ c.fillStyle = fg; c.fillRect(-3.4,-4,6.8,10.5); for(let i=0;i<3;i++) c.fillRect(-4.2+i*3.2,-7,2.2,3.2); c.fillStyle = dk; c.fillRect(-1,-1.4,2,3); c.fillRect(-1.4,3.4,2.8,3.1); }
  else if(kind==='fire'){ c.strokeStyle = '#7a5434'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-5,6); c.lineTo(5,3.6); c.moveTo(5,6); c.lineTo(-5,3.6); c.stroke(); P([[0,-7],[4,0],[2.4,4.6],[-2.4,4.6],[-4,0]], '#ff9a2a'); P([[0,-2.4],[1.8,2],[0,4.2],[-1.8,2]], '#ffe07a'); }
  else if(kind==='house'){ P([[-7,-0.5],[0,-7],[7,-0.5]], '#b5543a'); c.fillStyle = fg; c.fillRect(-5,-0.5,10,7); c.fillStyle = dk; c.fillRect(-1.4,2,2.8,4.5); }
  else if(kind==='shrine'){ c.fillStyle = fg; c.fillRect(-1.6,-8,3.2,15); c.fillRect(-5.4,-4.4,10.8,3); c.fillStyle = 'rgba(190,150,255,.8)'; c.beginPath(); c.arc(0,-3,1.4,0,7); c.fill(); }
  else if(kind==='tomb'){ P([[-7,6],[-7,-1],[0,-7],[7,-1],[7,6]], '#9a948a'); c.fillStyle = dk; c.beginPath(); c.moveTo(-2.6,6); c.lineTo(-2.6,0.6); c.arc(0,0.6,2.6,Math.PI,0); c.lineTo(2.6,6); c.closePath(); c.fill(); }
  else if(kind==='bridge'){ c.strokeStyle = fg; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-8,-1); c.lineTo(8,-1); c.stroke(); c.lineWidth = 1.6; c.beginPath(); c.arc(-3.5,5,4,Math.PI,0); c.arc(3.5,5,4,Math.PI,0); c.stroke(); }
  else if(kind==='water'){ c.strokeStyle = '#8fd0ff'; c.lineWidth = 1.8; for(const yy of [-3,1.5,6]){ c.beginPath(); c.moveTo(-7,yy); c.quadraticCurveTo(-3.5,yy-3,0,yy); c.quadraticCurveTo(3.5,yy+3,7,yy); c.stroke(); } }
  else {   // a stone archway: the way to another region
    c.fillStyle = '#a8a092'; c.beginPath(); c.moveTo(-7,7); c.lineTo(-7,-1.5); c.arc(0,-1.5,7,Math.PI,0); c.lineTo(7,7); c.lineTo(3.8,7); c.lineTo(3.8,-1.5); c.arc(0,-1.5,3.8,0,Math.PI,true); c.lineTo(-3.8,7); c.closePath(); c.fill();
    c.fillStyle = 'rgba(127,216,127,.55)'; c.beginPath(); c.moveTo(-3.8,7); c.lineTo(-3.8,-1.5); c.arc(0,-1.5,3.8,Math.PI,0); c.lineTo(3.8,7); c.closePath(); c.fill();
  }
  c.restore();
}
// the painted ground of an overworld region map: the zone's own colours, water, roads, woods, graves and walls
function paintRegionTerrain(c, R, w, h, k, ox, oy, tint){
  const rnd = (seed=>()=>((seed = (seed*1664525 + 1013904223)>>>0)/4294967296))(9177 + Math.round(w+h));
  const hx = parseInt(tint.slice(1,3),16), hy = parseInt(tint.slice(3,5),16), hz = parseInt(tint.slice(5,7),16);
  const shade = (f, a)=>'rgba('+Math.round(clamp(hx*f,0,255))+','+Math.round(clamp(hy*f,0,255))+','+Math.round(clamp(hz*f,0,255))+','+a+')';
  // height-field zones carry their own tile colours: paint them straight in
  if(R.C && R.cols && R.rows){
    const tc = document.createElement('canvas'); tc.width = R.cols; tc.height = R.rows; const tx = tc.getContext('2d'), im = tx.createImageData(R.cols, R.rows);
    for(let i=0;i<R.cols*R.rows;i++){ const wall = R.K && R.K[i]>=3, f = wall ? 0.45 : 0.82; im.data[i*4] = R.C[i*3]*f; im.data[i*4+1] = R.C[i*3+1]*f; im.data[i*4+2] = R.C[i*3+2]*f; im.data[i*4+3] = 255; }
    tx.putImageData(im, 0, 0); c.imageSmoothingEnabled = true; c.drawImage(tc, ox, oy, R.cols*R.ts*k, R.rows*R.ts*k);
  } else {
    c.fillStyle = tint; c.fillRect(ox, oy, w*k, h*k);
    // mottled, painterly ground: soft blotches of lighter and darker earth
    const n = Math.min(900, Math.round(w*h*k*k/260));
    for(let i=0;i<n;i++){ const x = ox+rnd()*w*k, y = oy+rnd()*h*k, r = 6+rnd()*22, f = 0.7+rnd()*0.6; const gr = c.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0, shade(f, 0.32)); gr.addColorStop(1, shade(f, 0)); c.fillStyle = gr; c.fillRect(x-r,y-r,r*2,r*2); }
  }
  // water: deep blue with a pale shoreline
  const water = (R.obstacles||[]).filter(o=>o.isWater && o.w!=null);
  if(water.length){
    // small free-standing ponds read as rounded pools; river slices and lake bands join up into one body of water
    const pond = o=>o.w < 320 && o.h < 320 && !o.isLake && !o.bmMid && o.w > 60 && o.h > 40 && Math.abs(o.w-o.h) > 4;
    const shape = (o, pad)=>{ const X = ox+o.x*k-pad, Y = oy+o.y*k-pad, Wd = Math.max(1.2,o.w*k)+pad*2, Hd = Math.max(1.2,o.h*k)+pad*2;
      if(pond(o)){ c.beginPath(); c.ellipse(X+Wd/2, Y+Hd/2, Wd/2, Hd/2, 0, 0, 7); c.fill(); } else c.fillRect(X, Y, Wd, Hd); };
    c.fillStyle = 'rgba(120,150,150,.5)'; for(const o of water) shape(o, 1.4);
    c.fillStyle = '#1f3a52'; for(const o of water) shape(o, 0);
  }
  // dead bog and void around the edges of a zone
  c.fillStyle = 'rgba(6,8,6,.8)'; for(const o of (R.obstacles||[])) if(o.bogVoid) c.fillRect(ox+o.x*k, oy+o.y*k, o.w*k, o.h*k);
  // roads: a worn dirt track with a darker edge
  const polys = [];
  for(const rp of (R.roadPolys||[])) if(rp.pts && rp.pts.length>1) polys.push([rp.pts, rp.hw||40]);
  for(const rd of (R.roads||[])) if(rd && rd.length>1) polys.push([rd, 46]);
  if(game && game.scene==='rivervalley' && typeof RV_ROAD!=='undefined'){ polys.push([RV_ROAD, 46]); if(RV_TRAIL && RV_TRAIL.length>1) polys.push([RV_TRAIL, 30]); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  for(const [pts, hw] of polys){
    const path = ()=>{ c.beginPath(); pts.forEach((q,i)=>{ const X = ox+q.x*k, Y = oy+q.y*k; i?c.lineTo(X,Y):c.moveTo(X,Y); }); };
    path(); c.strokeStyle = 'rgba(30,20,10,.55)'; c.lineWidth = Math.max(3.4, hw*2*k+2.4); c.stroke();
    path(); c.strokeStyle = '#8a7650'; c.lineWidth = Math.max(2, hw*2*k); c.stroke();
    path(); c.strokeStyle = 'rgba(200,180,130,.35)'; c.lineWidth = Math.max(0.8, hw*0.6*k); c.stroke();
  }
  // woods, dead trees, graves
  const dots = (list, col, r, max)=>{ if(!list) return; c.fillStyle = col; let i = 0; for(const t of list){ if(++i > max) break; c.beginPath(); c.arc(ox+t.x*k, oy+t.y*k, r, 0, 7); c.fill(); } };
  dots(R.trees, 'rgba(14,30,14,.75)', Math.max(1.4, 26*k), 2500);
  dots(R.deadTrees, 'rgba(40,34,28,.8)', Math.max(1.2, 20*k), 800);
  if(R.graves){ c.fillStyle = 'rgba(190,186,200,.4)'; for(const gr of R.graves){ const X = ox+gr.x*k, Y = oy+gr.y*k; c.fillRect(X-0.5, Y-2, 1, 3); c.fillRect(X-1.3, Y-1.3, 2.6, 0.8); } }
  // walls, keeps, fences, cliffs and big rocks
  for(const o of (R.obstacles||[])){
    if(o.w==null || o.h==null || o.isWater) continue;
    if(o.ironFence){ c.fillStyle = '#0c0b10'; c.fillRect(ox+o.x*k, oy+o.y*k, Math.max(1.6,o.w*k), Math.max(1.6,o.h*k)); continue; }
    const big = Math.max(o.w,o.h)>=110 && Math.min(o.w,o.h)>=40;
    if(!o.isCliff && !o.isKeep && !big && !o.owFeat && !o.mausoleum) continue;
    c.fillStyle = o.isKeep ? 'rgba(20,14,8,.55)' : 'rgba(10,8,5,.45)';
    c.fillRect(ox+o.x*k, oy+o.y*k, Math.max(1.2,o.w*k), Math.max(1.2,o.h*k));
  }
}
function mapFit(box){
  const r = box.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio||1);
  return {W:Math.max(200,Math.floor(r.width)), H:Math.max(160,Math.floor(r.height)), dpr};
}
function plotRegionMapPoints(box, pts, w, h, p){
  box.classList.remove('genericMode');
  const g = game, R = g.room || {};
  const fit = mapFit(box), PAD = 14;
  // pick canvas shape: same aspect as the zone, fitted to the box
  const k0 = Math.min((fit.W-2*PAD)/w, (fit.H-2*PAD)/h);
  const CW = Math.round(w*k0+2*PAD), CH = Math.round(h*k0+2*PAD);
  const cv = document.createElement('canvas');
  cv.width = CW*fit.dpr; cv.height = CH*fit.dpr; cv.style.width = CW+'px'; cv.style.height = CH+'px';
  box.appendChild(cv);
  const c = cv.getContext('2d'); c.scale(fit.dpr, fit.dpr);
  const k = k0, ox = PAD, oy = PAD, tint = MAP_TINT[g.scene] || '#58503f';
  c.fillStyle = '#0b0907'; c.fillRect(0,0,CW,CH);
  c.fillStyle = '#1d1812'; c.fillRect(ox-4,oy-4,w*k+8,h*k+8);
  c.save(); c.beginPath(); c.rect(ox,oy,w*k,h*k); c.clip();
  if(g.scene==='mountainpass' && g.mtn && !g.mtn.isCliff && typeof mtnInRegion==='function'){
    c.fillStyle = '#1d1812'; c.fillRect(ox,oy,w*k,h*k);
    c.fillStyle = tint; const st = 40;
    for(let y=0;y<h;y+=st) for(let x=0;x<w;x+=st) if(mtnInRegion(x+st/2,y+st/2)) c.fillRect(ox+x*k, oy+y*k, st*k+0.8, st*k+0.8);
  } else paintRegionTerrain(c, R, w, h, k, ox, oy, tint);   // v533: painted ground, water, roads, woods and walls
  c.restore();
  c.strokeStyle = '#9c7f4a'; c.lineWidth = 1.5; c.strokeRect(ox,oy,w*k,h*k);
  const mx = v=>ox+clamp(v,0,w)*k, my = v=>oy+clamp(v,0,h)*k;
  const rad = Math.max(10, Math.min(14, 9+k*8));
  const labels = [];
  for(const lm of pts){
    if(!lm.pos) continue;
    const x = mx(lm.pos.x), y = my(lm.pos.y), col = mapMarkStyle(lm);
    mapBadge(c, x, y, lm.icon, col, lm.label, rad);
    labels.push({x,y,t:lm.label});
  }
  c.font = 'bold 12px Alegreya,Georgia,serif'; c.textBaseline = 'middle';
  for(const L of labels){
    const wd = c.measureText(L.t).width; let tx = L.x, al = 'center';
    if(L.x - wd/2 < 4) { tx = L.x - rad; al = 'left'; } else if(L.x + wd/2 > CW-4) { tx = L.x + rad; al = 'right'; }
    const ty = L.y + rad + 9 > CH-6 ? L.y - rad - 9 : L.y + rad + 9;
    c.textAlign = al; c.lineWidth = 3.5; c.strokeStyle = 'rgba(0,0,0,.85)'; c.strokeText(L.t, tx, ty); c.fillStyle = '#efe6d2'; c.fillText(L.t, tx, ty);
  }
  if(p && typeof p.x==='number'){
    const x = mx(p.x), y = my(p.y);
    c.fillStyle = '#ff7a3d'; c.beginPath(); c.arc(x,y,9,0,7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke();
    c.font = 'bold 13px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const ty = y - 20 < 10 ? y + 22 : y - 20, hw = c.measureText('YOU ARE HERE').width/2 + 4, tx = clamp(x, hw, CW-hw);
    c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.9)'; c.strokeText('YOU ARE HERE', tx, ty); c.fillStyle = '#ffb27a'; c.fillText('YOU ARE HERE', tx, ty);
  }
}
function mapYouLabel(c, x, y, S){ c.font='bold 13px system-ui'; c.textAlign='center'; c.textBaseline='middle'; const ty = y-20<10 ? y+22 : y-20, hw = c.measureText('YOU ARE HERE').width/2+4, tx = Math.max(hw, Math.min(S-hw, x)); c.lineWidth=4; c.strokeStyle='rgba(0,0,0,.9)'; c.strokeText('YOU ARE HERE',tx,ty); c.fillStyle='#ffb27a'; c.fillText('YOU ARE HERE',tx,ty); }
function rectCenterSafe(r){ return r ? {x:r.x+r.w/2, y:r.y+r.h/2} : null; }
// v281: floor-plan map for the Mountain Depths floors (same look as the dungeon maps, always charted)
function renderDeepMap(g, p, box){
  const R = g.tower;
  box.classList.remove('genericMode');
  const cv = document.createElement('canvas'); const S = 640;
  cv.width = S; cv.height = S; cv.style.cssText = 'width:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;height:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;display:block';
  box.appendChild(cv);
  const c = cv.getContext('2d'), k = (S-24)/Math.max(R.w,R.h), ox = 12 + ((S-24)-R.w*k)/2, oy = 12 + ((S-24)-R.h*k)/2;
  c.fillStyle = '#0b0907'; c.fillRect(0,0,S,S);
  c.fillStyle = '#1d1812'; c.fillRect(ox-3,oy-3,R.w*k+6,R.h*k+6);
  if(R.floorRects){ c.fillStyle = '#58503f'; for(const fr of R.floorRects) c.fillRect(ox+fr.x*k, oy+fr.y*k, fr.w*k+0.6, fr.h*k+0.6); }
  else { c.fillStyle = '#58503f'; c.fillRect(ox,oy,R.w*k,R.h*k); }
  c.strokeStyle = '#9c7f4a'; c.lineWidth = 1.5; c.strokeRect(ox,oy,R.w*k,R.h*k);
  if(R.bossFloor && R.lavaAt){   // the Heart's lava lake, sampled
    c.fillStyle = '#c4501f'; const st = 36;
    for(let y=0;y<R.h;y+=st) for(let x=0;x<R.w;x+=st) if(R.lavaAt(x+st/2,y+st/2)) c.fillRect(ox+x*k, oy+y*k, st*k+0.6, st*k+0.6);
  }
  for(const o of (R.floorRects ? [] : (R.obstacles||[]))){
    c.fillStyle = o.isLava ? '#c4501f' : '#1d1812';
    c.fillRect(ox+Math.max(0,o.x)*k, oy+Math.max(0,o.y)*k, Math.min(o.w, R.w-Math.max(0,o.x))*k, Math.min(o.h, R.h-Math.max(0,o.y))*k);
  }
  const mark = (pt, ch, col, lb)=>{ if(!pt) return; const x=ox+pt.x*k, y=oy+pt.y*k; mapBadge(c, x, y, ch, col, lb, 13); };
  mark(R.entrance, R.deep===1 ? 'E' : '\u25B2', '#7fd87f');
  mark(R.stairs, '\u25BC', '#e8c44a');
  if(R.isDeepMine && R.camp && (p.minerQ||0)<3) mark(R.camp, '!', '#ffd870');
  const col = (g.enemies||[]).find(e=>e.colossus && e.hp>0);
  if(col) mark({x:col.x,y:col.y}, '!', '#e05a5a');
  if(R.chestSpot && p.colossusSlain) mark(R.chestSpot, '\u2605', '#e8c44a');
  if(p && typeof p.x==='number'){ c.fillStyle='#ff7a3d'; c.beginPath(); c.arc(ox+p.x*k, oy+p.y*k, 9, 0, 7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); mapYouLabel(c, ox+p.x*k, oy+p.y*k, S); }
}
// v425: Highward floor plan -- walls, chambers, halls, statues and gates; charted once the Gilded Warden is slain
function renderKeepMap(g, p, box){
  const R = g.tower, a = R.kpArea;
  box.classList.remove('genericMode');
  if(!(p.keepMaps||{})[a]){
    box.classList.add('genericMode');
    box.innerHTML = '<div style="padding:28px 12px;text-align:center;color:var(--bone-dim);font-family:Alegreya,Georgia,serif;line-height:1.6;">No map of this floor yet.<br>Slay the Map Bearer (ringed in gold) to find it.</div>';
    return;
  }
  const cv = document.createElement('canvas'); const S = 640;
  cv.width = S; cv.height = S; cv.style.cssText = 'width:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;height:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;display:block';
  box.appendChild(cv);
  const c = cv.getContext('2d'), k = (S-24)/Math.max(R.w,R.h), ox = 12 + ((S-24)-R.w*k)/2, oy = 12 + ((S-24)-R.h*k)/2;
  c.fillStyle = '#0b0907'; c.fillRect(0,0,S,S);
  c.fillStyle = '#3a3226'; c.fillRect(ox,oy,R.w*k,R.h*k);
  for(const f of (R.kpFloors||[])){ c.fillStyle = '#4a4131'; c.fillRect(ox+f.x0*k, oy+f.y0*k, (f.x1-f.x0)*k, (f.y1-f.y0)*k); }
  for(const o of R.obstacles){ c.fillStyle = o.mazeWall ? '#100c08' : o.isProp ? '#7a6a50' : '#221b14'; c.fillRect(ox+o.x*k, oy+o.y*k, Math.max(1.5,o.w*k), Math.max(1.5,o.h*k)); }
  const mark = (pt, ch, col, lb)=>{ if(!pt) return; const x=ox+pt.x*k, y=oy+pt.y*k; mapBadge(c, x, y, ch, col, lb, 12); };
  mark(R.entrance, 'E', '#7fd87f'); mark(R.exitDoor, '\u25B6', '#e8c44a'); mark(R.holdStairs, '\u25BC', R.beacons && !R.beacons.every(b=>b.lit) ? '#c05a4a' : '#e8c44a'); mark(R.waypoint, 'W', '#5fd0ff');
  if(R.beacons) for(const b of R.beacons) mark(b, '\u2726', b.lit ? '#ffcf7a' : '#8a7a60');
  if(p && typeof p.x==='number'){ c.fillStyle='#ff7a3d'; c.beginPath(); c.arc(ox+p.x*k, oy+p.y*k, 9, 0, 7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); mapYouLabel(c, ox+p.x*k, oy+p.y*k, S); }
}
// v467: Lighthouse floors -- walls and doorways; the stairs only show once you have found them
function renderLhMazeMap(g, p, box){
  const R = g.tower;
  box.classList.remove('genericMode');
  if(!R.mapFound){   // v505: charted by this floor's Map Bearer
    box.classList.add('genericMode');
    box.innerHTML = '<div style="padding:28px 12px;text-align:center;color:var(--bone-dim);font-family:Alegreya,Georgia,serif;line-height:1.6;">No map of this floor yet.<br>Slay the Map Bearer (ringed in gold) to find it.</div>';
    return;
  }
  const cv = document.createElement('canvas'); const S = 640, fit = mapFit(box), side = Math.min(fit.W, fit.H);
  cv.width = S; cv.height = S; cv.style.cssText = 'width:'+side+'px;height:'+side+'px;display:block;margin:0 auto';
  box.appendChild(cv);
  const c = cv.getContext('2d'), k = (S-24)/Math.max(R.w,R.h), ox = 12 + ((S-24)-R.w*k)/2, oy = 12 + ((S-24)-R.h*k)/2;
  c.fillStyle = '#0b0907'; c.fillRect(0,0,S,S);
  c.fillStyle = '#3e382d'; c.fillRect(ox,oy,R.w*k,R.h*k);
  for(const o of R.obstacles){ c.fillStyle = o.mazeWall ? '#100c08' : '#6a5a40'; c.fillRect(ox+o.x*k, oy+o.y*k, Math.max(1.5,o.w*k), Math.max(1.5,o.h*k)); }
  c.strokeStyle = '#8a6e40'; c.lineWidth = 2; c.strokeRect(ox, oy, R.w*k, R.h*k);
  const mark = (pt, ch, col, lb)=>{ if(!pt) return; const x=ox+pt.x*k, y=oy+pt.y*k; mapBadge(c, x, y, ch, col, lb, 12); };
  mark(R.entrance, R.floor===1 ? 'E' : '\u25BC', '#7fd87f'); mark(R.waypoint, 'W', '#5fd0ff');
  if(R.stairsSeen) mark(R.stairs, '\u25B2', '#e8c44a');
  if(p && typeof p.x==='number'){ c.fillStyle='#ff7a3d'; c.beginPath(); c.arc(ox+p.x*k, oy+p.y*k, 9, 0, 7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); mapYouLabel(c, ox+p.x*k, oy+p.y*k, S); }
}
function renderHwMap(g, p, box){
  const R = g.tower;
  box.classList.remove('genericMode');
  if(!p.hwMapFound){
    box.classList.add('genericMode');
    box.innerHTML = '<div style="padding:28px 12px;text-align:center;color:var(--bone-dim);font-family:Alegreya,Georgia,serif;line-height:1.6;">No map of Highward yet.<br>Slay the Map Bearer (ringed in gold) in the first hall to find it.</div>';
    return;
  }
  const cv = document.createElement('canvas'); const S = 640;
  cv.width = S; cv.height = S; cv.style.cssText = 'width:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;height:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;display:block';
  box.appendChild(cv);
  const c = cv.getContext('2d'), k = (S-24)/Math.max(R.w,R.h), ox = 12 + ((S-24)-R.w*k)/2, oy = 12 + ((S-24)-R.h*k)/2;
  c.fillStyle = '#0b0907'; c.fillRect(0,0,S,S);
  c.fillStyle = '#2a1c10'; c.fillRect(ox,oy,R.w*k,R.h*k);
  // wall outline = slightly grown floor, then floor on top
  c.fillStyle = '#b88a3e'; for(const fr of R.floorRects) c.fillRect(ox+fr.x*k-2, oy+fr.y*k-2, fr.w*k+4, fr.h*k+4);
  c.fillStyle = '#5c4630'; for(const fr of R.floorRects) c.fillRect(ox+fr.x*k, oy+fr.y*k, fr.w*k, fr.h*k);
  for(const r of (R.hwRooms||[])){   // chambers and halls read lighter than corridors
    c.fillStyle = r.kind==='boss' ? '#7a4a30' : r.kind==='dead' ? '#6e5236' : r.kind==='hall' ? '#6a5438' : '#675036';
    c.fillRect(ox+r.x*k+1, oy+r.y*k+1, r.w*k-2, r.h*k-2);
    c.strokeStyle = 'rgba(224,184,90,.55)'; c.lineWidth = 1; c.strokeRect(ox+r.x*k+3, oy+r.y*k+3, r.w*k-6, r.h*k-6);
  }
  for(const o of (R.obstacles||[])) if(o.mazeWall){ c.fillStyle = '#2a1c10'; c.fillRect(ox+o.x*k, oy+o.y*k, o.w*k, o.h*k); }
  for(const d of (R.hwDeco||[])){ if(d.type==='brazier'){ c.fillStyle = '#ff9a3a'; c.fillRect(ox+d.x*k-1.5, oy+d.y*k-1.5, 3, 3); } else { c.fillStyle = '#e0c068'; c.fillRect(ox+d.x*k-2, oy+d.y*k-2, 4, 4); } }
  const mark = (pt, ch, col, lb)=>{ if(!pt) return; const x=ox+pt.x*k, y=oy+pt.y*k; mapBadge(c, x, y, ch, col, lb, 12); };
  if(R.hwFloor===1){ mark(R.entrance,'R','#7fd87f'); if(R.eastGates) for(const gt of R.eastGates) mark(gt,'C','#7fd87f'); }
  else mark(R.entrance,'\u25BC','#e8c44a');
  mark(R.hwUp,'\u25B2','#e8c44a'); mark(R.waypoint,'W','#5fd0ff');
  for(const ch of (R.chests||[])) mark(ch,'\u2605', ch.opened?'#8a7a50':'#e8c44a');
  if(R.altar) mark(R.altar,'A','#ffe08a'); if(R.hwSwitch) mark(R.hwSwitch,'S','#d8c8ff');
  if(R.guardPos && !p.highwardSlain) mark(R.guardPos,'!','#e05a5a');
  if(p && typeof p.x==='number'){ c.fillStyle='#ff7a3d'; c.beginPath(); c.arc(ox+p.x*k, oy+p.y*k, 9, 0, 7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); mapYouLabel(c, ox+p.x*k, oy+p.y*k, S); }
}
// v490: floor plan for the cave-style sub-zones (Sunken Depths, Flooded Temple): the real floor-mask cells with a bronze
// rim, water in blue, and the landmarks. Charted once the floor's Map Bearer is slain, like the other dungeon maps.
function renderSubCaveMap(g, p, box){
  const R = g.tower, m = R.floorMask;
  box.classList.remove('genericMode');
  if(!R.mapFound){
    box.classList.add('genericMode');
    box.innerHTML = '<div style="padding:28px 12px;text-align:center;color:var(--bone-dim);font-family:Alegreya,Georgia,serif;line-height:1.6;">No map of this floor yet.<br>Slay the Map Bearer (ringed in gold) to find it.</div>';
    return;
  }
  const fit = mapFit(box), PAD = 14;
  const k = Math.min((fit.W-2*PAD)/R.w, (fit.H-2*PAD)/R.h), CW = Math.round(R.w*k+2*PAD), CH = Math.round(R.h*k+2*PAD), SC = 2;
  const cv = document.createElement('canvas'); cv.width = CW*SC; cv.height = CH*SC; cv.style.cssText = 'width:'+CW+'px;height:'+CH+'px;display:block;margin:0 auto';
  box.appendChild(cv);
  const c = cv.getContext('2d'); c.scale(SC, SC);
  const ox = PAD, oy = PAD, X = v=>ox+v*k, Y = v=>oy+v*k;
  c.fillStyle = '#0b0907'; c.fillRect(0,0,CW,CH);
  c.fillStyle = '#17130e'; c.fillRect(ox-2, oy-2, R.w*k+4, R.h*k+4);
  const cells = (fn)=>{ for(let iy=0; iy<m.rows; iy++){ let run = -1; for(let ix=0; ix<=m.cols; ix++){ const on = ix<m.cols && m.data[iy*m.cols+ix]; if(on && run<0) run = ix; if(!on && run>=0){ fn(run*m.CELL, iy*m.CELL, (ix-run)*m.CELL, m.CELL); run = -1; } } } };
  const g2 = Math.max(1.5, 14*k);
  c.fillStyle = '#9c7f4a'; cells((x,y,w,h)=>c.fillRect(X(x)-g2, Y(y)-g2, w*k+g2*2, h*k+g2*2));   // rim
  c.fillStyle = '#2a2219'; cells((x,y,w,h)=>c.fillRect(X(x)-g2*0.45, Y(y)-g2*0.45, w*k+g2*0.9, h*k+g2*0.9));
  c.fillStyle = R.subzone==='temple' ? '#56605a' : '#4f5a5c'; cells((x,y,w,h)=>c.fillRect(X(x), Y(y), w*k+0.6, h*k+0.6));
  c.fillStyle = '#2f5f86';
  for(const o of R.obstacles){ if(!o.isWater) continue; c.fillRect(X(o.x), Y(o.y), Math.max(1.5,o.w*k), Math.max(1.5,o.h*k)); }
  for(const o of R.obstacles){ if(o.templeCol || (o.isProp && !o.organic)){ c.fillStyle = '#8a8070'; c.fillRect(X(o.x), Y(o.y), Math.max(2,o.w*k), Math.max(2,o.h*k)); } }
  if(R.woodBridge){ const b = R.woodBridge; c.fillStyle = '#9a7444'; c.fillRect(X(b.x0), Y(b.y-b.half), (b.x1-b.x0)*k, b.half*2*k); }
  if(R.island){ c.fillStyle = '#4f5a5c'; c.beginPath(); c.arc(X(R.island.x), Y(R.island.y), R.island.r*k, 0, 7); c.fill(); }
  const mark = (pt, ch, col, lb)=>{ if(!pt) return; const x=X(pt.x), y=Y(pt.y); mapBadge(c, x, y, ch, col, lb, 11); };
  if(R.subzone==='temple'){ mark(R.entrance, 'E', '#7fd87f'); mark(R.waypoint, 'W', '#5fd0ff'); mark(R.stairsDown, '▼', '#e8c44a'); }
  else {
    mark(R.entrance, '▲', '#7fd87f');
    const kr = (g.enemies||[]).find(e=>e.kraken && e.hp>0);
    if(kr) mark({x:SKP.cx, y:SKP.cy-SKP.ry*0.35}, '!', '#e05a5a');
    if(g.chest && !g.chest.opened) mark(g.chest, '★', '#e8c44a');
    if(R.extraChest && !R.extraChest.opened) mark(R.extraChest, '★', '#e8c44a');
    if(R.clearPortal) mark(R.clearPortal, 'M', '#5fd0ff');
  }
  if(p && typeof p.x==='number'){ c.fillStyle='#ff7a3d'; c.beginPath(); c.arc(X(p.x), Y(p.y), 8, 0, 7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); mapYouLabel(c, X(p.x), Y(p.y), CW); }
}
// v490: Forgotten Tower floors -- walls, doorways and stairs; charted on every floor once the Map Bearer on floor 1 is slain
function renderFtMap(g, p, box){
  const R = g.tower;
  box.classList.remove('genericMode');
  if(!p.ftMapFound){
    box.classList.add('genericMode');
    box.innerHTML = '<div style="padding:28px 12px;text-align:center;color:var(--bone-dim);font-family:Alegreya,Georgia,serif;line-height:1.6;">No map of the Forgotten Tower yet.<br>Slay the Map Bearer (ringed in gold) on the first floor to find it.</div>';
    return;
  }
  const fit = mapFit(box), PAD = 14;
  const k = Math.min((fit.W-2*PAD)/R.w, (fit.H-2*PAD)/R.h), CW = Math.round(R.w*k+2*PAD), CH = Math.round(R.h*k+2*PAD), SC = 2;
  const cv = document.createElement('canvas'); cv.width = CW*SC; cv.height = CH*SC; cv.style.cssText = 'width:'+CW+'px;height:'+CH+'px;display:block;margin:0 auto';
  box.appendChild(cv);
  const c = cv.getContext('2d'); c.scale(SC, SC);
  const ox = PAD, oy = PAD;
  c.fillStyle = '#0b0907'; c.fillRect(0,0,CW,CH);
  c.fillStyle = '#4a4436'; c.fillRect(ox, oy, R.w*k, R.h*k);
  for(const r of (R.rooms||[])){ c.strokeStyle = 'rgba(224,184,90,.35)'; c.lineWidth = 1; c.strokeRect(ox+r.x0*k+4, oy+r.y0*k+4, (r.x1-r.x0)*k-8, (r.y1-r.y0)*k-8); }
  if(R.hall){ const h = R.hall; c.fillStyle = '#56503f'; c.fillRect(ox+h.x0*k+3, oy+h.y0*k+3, (h.x1-h.x0)*k-6, (h.y1-h.y0)*k-6); }
  for(const o of R.obstacles){ c.fillStyle = o.mazeWall ? '#120e09' : '#7a6a50'; c.fillRect(ox+o.x*k, oy+o.y*k, Math.max(1.5,o.w*k), Math.max(1.5,o.h*k)); }
  c.strokeStyle = '#9c7f4a'; c.lineWidth = 2; c.strokeRect(ox, oy, R.w*k, R.h*k);
  const mark = (pt, ch, col, lb)=>{ if(!pt) return; const x=ox+pt.x*k, y=oy+pt.y*k; mapBadge(c, x, y, ch, col, lb, 12); };
  mark(R.entrance, R.floor===1 ? 'B' : '▼', '#7fd87f'); mark(R.stairs, '▲', '#e8c44a'); mark(R.waypoint, 'W', '#5fd0ff');
  if(R.witch) mark(R.witch, '?', '#e8c44a');
  if(R.clearPortal) mark(R.clearPortal, 'M', '#5fd0ff');
  if(p && typeof p.x==='number'){ c.fillStyle='#ff7a3d'; c.beginPath(); c.arc(ox+p.x*k, oy+p.y*k, 9, 0, 7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); mapYouLabel(c, ox+p.x*k, oy+p.y*k, CW); }
}
// v481: D2-style finish for every map canvas -- dark vignette, faint grain and a bronze double frame
function mapFinish(cv, dpr){
  try{
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, u = (dpr||1);
    c.save(); c.setTransform(1,0,0,1,0,0);
    const vg = c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.hypot(W,H)*0.55);
    vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.55)');
    c.fillStyle = vg; c.fillRect(0,0,W,H);
    c.globalAlpha = 0.05; for(let i=0;i<Math.min(9000,(W*H)/90);i++){ c.fillStyle = Math.random()<0.5 ? '#000' : '#d8c8a0'; c.fillRect(Math.random()*W, Math.random()*H, u, u); }
    c.globalAlpha = 1;
    c.strokeStyle = '#000'; c.lineWidth = 6*u; c.strokeRect(0,0,W,H);
    c.strokeStyle = '#7a5f2c'; c.lineWidth = 2*u; c.strokeRect(2*u,2*u,W-4*u,H-4*u);
    c.strokeStyle = 'rgba(232,196,74,.28)'; c.lineWidth = 1*u; c.strokeRect(6*u,6*u,W-12*u,H-12*u);
    c.restore();
  }catch(e){}
}
function renderRegionMap(){
  renderRegionMap0();
  if(!worldMapShown) for(const cv of document.querySelectorAll('#regionMapCanvas > canvas')) mapFinish(cv, cv.width > 700 ? 2 : 1);
}
function renderRegionMap0(){
  const g = game, p = g.player;
  document.getElementById('regionMapTitle').textContent = zoneDisplayName() + (g.depth && !/Lv\./.test(zoneDisplayName()) && g.scene!=='town' && g.scene!=='tavern' ? '  \u00B7  Area Level '+g.depth : '');
  const box = document.getElementById('regionMapCanvas');
  box.innerHTML = '';
  box.style.aspectRatio = '';
  box.classList.remove('genericMode');
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='keep' && g.tower.kpArea<=3){ renderKeepMap(g, p, box); return; }
  if(g.scene==='lighthouse' && g.tower && g.tower.deep){ renderDeepMap(g, p, box); return; }
  if(g.scene==='lighthouse' && g.tower && g.tower.subzone==='highward'){ renderHwMap(g, p, box); return; }
  if(g.scene==='lighthouse' && g.tower && g.tower.maze){ renderLhMazeMap(g, p, box); return; }
  if(g.scene==='lighthouse' && g.tower && (g.tower.subzone==='sunken' || g.tower.subzone==='temple') && g.tower.floorMask){ renderSubCaveMap(g, p, box); return; }   // v490
  if(g.scene==='lighthouse' && g.tower && g.tower.ft && !g.tower.subzone){ renderFtMap(g, p, box); return; }   // v490
  // (v147/148) Layout-style maps: real floor plans for maze/room dungeons.
  const LAYOUT = {
    ancientruins: ()=>g.ruins && ({R:g.ruins, marks:[[g.ruins.entrance,'E','#7fd87f'],[g.ruins.stairsDown,'\u25BC','#e8c44a'],[g.ruins.waypoint,'W','#5fd0ff'],...(g.bossKilled?[[g.ruins.chestSpot,'\u2605','#e8c44a']]:[])]}),
    darkcrypt: ()=>g.crypt && ({R:g.crypt, marks:[[g.crypt.cemeteryGate,'C','#7fd87f'],[g.crypt.waypoint,'W','#5fd0ff'],[g.crypt.chestShown?g.crypt.chestSpot:g.crypt.tomb,'\u2605','#e8c44a']].concat((g.crypt.sideChests||[]).filter(c=>!c.opened).map(c=>[c,'\u25A0','#e8c44a']))}),
    raptorlair: ()=>g.rlair && ({R:g.rlair, marks:[[g.rlair.entrance,'E','#7fd87f'],[g.rlair.stairsDown,'\u25BC','#e8c44a'],[g.rlair.bossSpot,'!','#e05a5a']]}),
    dungeon: ()=>g.room && g.room.floorRects && ({R:g.room, marks:[[g.room.entranceSpawn,'E','#7fd87f'],[rectCenterSafe(g.room.exitRoom),'!','#e05a5a']]}),
    spiderlair: ()=>g.room && g.room.floorRects && ({R:g.room, marks:[[g.room.entranceSpawn,'E','#7fd87f'],[rectCenterSafe(g.room.exitRoom),'!','#e05a5a']]}),
    bearcave: ()=>g.room && g.room.floorRects && ({R:g.room, marks:[[g.room.entranceSpawn,'E','#7fd87f'],[rectCenterSafe(g.room.exitRoom),'!','#e05a5a']]}),
    minotaurcave: ()=>g.room && g.room.floorRects && ({R:g.room, marks:[[g.room.entranceSpawn,'E','#7fd87f'],[rectCenterSafe(g.room.exitRoom),'!','#e05a5a']]}),
  };
  const lay = LAYOUT[g.scene] && LAYOUT[g.scene]();
  if(lay && !(lay.R.mapFound || (g.room && g.room.mapFound))){
    box.classList.add('genericMode'); box.style.aspectRatio = '';
    box.innerHTML = '<div style="padding:28px 12px;text-align:center;color:var(--bone-dim);font-family:Alegreya,Georgia,serif;line-height:1.6;">No map of this floor yet.<br>Slay the Map Bearer (ringed in gold) to find it.</div>';
    return;
  }
  if(lay){
    const R = lay.R;
    box.classList.remove('genericMode');
    const cv = document.createElement('canvas'); const S = 640;
    cv.width = S; cv.height = S; cv.style.cssText = 'width:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;height:'+Math.min(mapFit(box).W,mapFit(box).H)+'px;display:block';
    box.appendChild(cv);
    const c = cv.getContext('2d'), k = (S-24)/Math.max(R.w,R.h), ox = 12, oy = 12;
    c.fillStyle = '#0b0907'; c.fillRect(0,0,S,S);
    c.fillStyle = '#1d1812'; c.fillRect(ox,oy,R.w*k,R.h*k);        // solid rock/walls
    c.fillStyle = '#58503f';
    for(const fr of R.floorRects) c.fillRect(ox+fr.x*k, oy+fr.y*k, fr.w*k, fr.h*k);   // passages & chambers
    c.strokeStyle = '#9c7f4a'; c.lineWidth = 1.5;
    for(const fr of R.floorRects) c.strokeRect(ox+fr.x*k, oy+fr.y*k, fr.w*k, fr.h*k);
    c.fillStyle = '#58503f';
    for(const fr of R.floorRects) c.fillRect(ox+fr.x*k+1.5, oy+fr.y*k+1.5, Math.max(0,fr.w*k-3), Math.max(0,fr.h*k-3)); // hide inner seams
    const mark = (pt, ch, col, lb)=>{ if(!pt) return; const x=ox+pt.x*k, y=oy+pt.y*k; mapBadge(c, x, y, ch, col, lb, 13); };
    for(const [pt,ch,col] of lay.marks) mark(pt,ch,col);
    if(p && typeof p.x==='number'){ c.fillStyle='#ff7a3d'; c.beginPath(); c.arc(ox+p.x*k, oy+p.y*k, 9, 0, 7); c.fill(); c.strokeStyle='#fff'; c.lineWidth=2.5; c.stroke(); mapYouLabel(c, ox+p.x*k, oy+p.y*k, S); }
    return;
  }
  // (v148) Fixed-footprint overworld zones -- landmark schematics like the Dark Forest's.
  const SCH = {
    lighthouse: ()=>{ const t=g.tower; return t && {w:t.w,h:t.h,pts:[{pos:t.entrance,label:t.fht?(t.floor===1?'Frosthold Keep':'Stairs Down'):t.deep?(t.floor===1?(t.deep?'Mountain Pass':'Frosthold Keep'):'Stairs Up'):'Entrance',icon:t.fht?'\u25BC':t.deep?'\u25B2':'E'},{pos:t.stairs,label:t.fht?'Stairs Up':t.deep?'Stairs Down':'Stairs Up',icon:t.fht?'\u25B2':t.deep?'\u25BC':'\u25B2'},{pos:t.waypoint,label:'Waypoint',icon:'W'},{pos:t.beacon,label:'Beacon',icon:'*'},{pos:t.witch,label:'Captive Witch',icon:'?'}]}; },
    mountainpass: ()=>{ const m=g.mtn; if(m && m.isCliff) return {w:m.w,h:m.h,pts:m.nest ? [{pos:m.exitGate,label:'Cliffside Ascent',icon:'C'}] : [{pos:m.hwGate,label:'Highward',icon:'H'},{pos:m.waypoint,label:'Waypoint',icon:'W'},{pos:m.nestGate,label:"Harpy's Nest",icon:'N'},{pos:m.keepGate,label:'Shadow Keep',icon:'K'}]}; return m && {w:m.w,h:m.h,pts:[{pos:m.forestGate,label:'Barren Highlands',icon:'H'},{pos:m.waypoint,label:'Waypoint',icon:'W'},{pos:m.mineGate,label:'Mountain Depths',icon:'M'},{pos:m.summitGate,label:'Icy Summit',icon:'^'},{pos:m.frostGate,label:'Frosthold Keep',icon:'K'}]}; },
    icyzone: ()=>{ const z=g.iz; if(!z) return null; const pts=z.gates.map(gt=>({pos:gt,label:gt.label.replace(/\b(\w)(\w*)/g,(m,a,b)=>a+b.toLowerCase()),icon:'>'})); if(z.waypoint) pts.push({pos:z.waypoint,label:'Waypoint',icon:'W'}); if(z.altar) pts.push({pos:z.altar,label:'Shrine Altar',icon:'S'}); if(z.bossSpot) pts.push({pos:z.bossSpot,label:'Mastodon\u2019s Lair',icon:'!'}); return {w:z.w,h:z.h,pts}; },
    frosthold: ()=>{ const f=g.fh; return f && {w:f.w,h:f.h,pts:f.gates.map(gt=>({pos:gt,label:gt.label.replace(/\b(\w)(\w*)/g,(m,a,b)=>a+b.toLowerCase()),icon:'>'})).concat([{pos:f.waypoint,label:'Waypoint',icon:'W'}])}; },
    redridge: ()=>{ const r=g.rr; if(!r) return null; const IC = {frost:['Frosthold Keep','F'], bridge:['Skybridge','B'], east:['Eastern Canyon','E'], west:['Western Canyon','W'], lair:['Raptor Lair','L'], crater:['Redridge Crater','C']};
      return {w:r.w,h:r.h,pts:[...r.gates.map(gt=>({pos:gt, label:(IC[gt.id]||[gt.label])[0], icon:(IC[gt.id]||['','?'])[1]})), ...(r.waypoint?[{pos:r.waypoint,label:'Waypoint',icon:'W'}]:[]), ...(r.camp?[{pos:r.camp,label:'Wayfarer\u2019s Camp',icon:'C'}]:[]), ...r.towers.map(tw=>({pos:tw.door,label:'Watchtower '+tw.id,icon:'T'}))]}; },
    highlands: ()=>{ const r=g.hl; if(!r) return null; return {w:r.w,h:r.h,pts:[{pos:hlGate(r,'marsh'),label:'Black Marsh',icon:'B'},{pos:hlGate(r,'pass'),label:'Mountain Pass',icon:'M'},{pos:r.waypoint,label:'Waypoint',icon:'W'},...r.camps.map(c=>({pos:c,label:'Troll Camp',icon:'!'}))]}; },
    redcrater: ()=>{ const r=g.crater; return r && {w:r.w,h:r.h,pts:[{pos:r.gates[0],label:'Redridge Canyon',icon:'R'},...(game.player.obsidianTaken?[]:[{pos:r.runeSpot,label:'Obsidian Obelisk',icon:'O'}]),{pos:r.bossSpot,label:game.player.gojiraSlain?'Rex, the Crater King':'Gojira',icon:'!'}]}; },
    lakesideruins: ()=>{ const l=g.lake; return l && {w:l.w,h:l.h,pts:[{pos:l.sunlitGate,label:'Withered Crossroads',icon:'S'},{pos:l.waypoint.off?null:l.waypoint,label:'Waypoint',icon:'W'},{pos:l.ruinsSpot,label:'Ancient Ruins',icon:'R'}]}; },
    blackmarsh: ()=>{ const b=g.bm; if(!b) return null; const pts=[{pos:b.westGate,label:'Cave from the Sunken Depths',icon:'C'},{pos:b.highGate,label:'Barren Highlands',icon:'B'},{pos:b.house,label:'Witch\u2019s House',icon:'H'},{pos:b.waypoint,label:'Waypoint',icon:'W'},{pos:b.eastGate,label:'Forgotten Tower',icon:'T'},{pos:b.poolGate,label:'Marsh Pool',icon:'P'}]; for(const bx of BM_BRIDGES) pts.push({pos:{x:bx,y:bmTrailPt(bx).y},label:'',icon:'='}); pts.push({pos:{x:BM_MID_BRIDGE_X,y:bmMidY(BM_MID_BRIDGE_X)},label:'Tower Bridge',icon:'='}); return {w:b.w,h:b.h,pts}; },   // v490: the great river and its one bridge
    rivervalley: ()=>{ const r=g.rv; if(!r) return null; const pts=[{pos:r.northGate,label:'Dark Forest',icon:'F'},{pos:r.waypoint,label:'Waypoint',icon:'W'},{pos:r.bridgeC,label:'Old Bridge',icon:'='},{pos:r.southGate,label:'Withered Crossroads',icon:'S'},{pos:r.caveGate,label:'Minotaur Cave',icon:'M'},{pos:r.waterfall,label:'Waterfall',icon:'~'}]; if(!game.player.bridgeCleared) pts.push({pos:{x:RV_BX+300,y:r.bridgeC.y-220},label:'Bandit Camp',icon:'!'}); return {w:r.w,h:r.h,pts}; },
    cursedcemetery: ()=>{ const c=g.cem; return c && {w:c.w,h:c.h,pts:[{pos:c.sunlitGate,label:'Withered Crossroads',icon:'S'},{pos:c.camp,label:'Graverobbers',icon:'G'},{pos:c.statue,label:'Grave Statue',icon:'+'},{pos:c.tomb,label:'Dark Crypt',icon:'D'}]}; },
  };
  const sch = SCH[g.scene] && SCH[g.scene]();
  if(sch){ plotRegionMapPoints(box, sch.pts.filter(q=>q.pos), sch.w, sch.h, p); return; }
  if(g.scene==='town' && g.town){
    const t = g.town;
    const pts = [
      {pos:t.waypoint, label:'Waypoint', icon:'W'},
      {pos:t.blacksmith, label:'Brom', icon:'B'},
      {pos:t.stashChest, label:'Stash', icon:'S'},
      {pos:t.questGiver, label:'Aldric the Elder', icon:'!'},
      {pos:t.well, label:'Well', icon:'O'},
      {pos:t.gate, label:'Forest Gate', icon:'G'},
    ];
    const huntersQuest = typeof getQuest==='function' && typeof QUEST_FIND_HUNTERS!=='undefined' ? getQuest(p, QUEST_FIND_HUNTERS.id) : null;
    if(huntersQuest && huntersQuest.status==='complete'){
      pts.push({pos:t.bonfire, label:'Bonfire', icon:'F'});
    }
    plotRegionMapPoints(box, pts, t.w, t.h, p);
  } else if(g.scene==='forest' && g.forest){
    // Dark Forest schematic (Sept 2026 patch): plotted from the zone's own
    // real gate objects (see makeForest()) exactly like Town's landmarks
    // are -- Town Gate (west edge, back to Town), Mountain Pass gate (east
    // edge), Withered Crossroads gate (south edge, relocated there in v87), and
    // the Spider Lair/Bear Cave dungeon gates in the interior.
    const f = g.forest;
    const pts = [
      {pos:f.townGate, label:'Mistfall Gate', icon:'T'},
      {pos:f.sunGate, label:'River Valley', icon:'R'},
      {pos:f.spiderLairGate, label:'Spider Lair', icon:'!'},
      {pos:f.bearCaveGate, label:'Bear Cave', icon:'!'},
    ];
    if(f.hunters) for(const h of f.hunters){ if(!h.found) pts.push({pos:h, label:'Missing Hunter', icon:'H'}); }
    plotRegionMapPoints(box, pts, f.w, f.h, p);
  } else if(g.scene==='sunlitplains' && g.sun){
    // Withered Crossroads schematic (Sept 2026 patch): plotted from the zone's
    // own crossroad gate objects (see makeSunlitPlains()) -- north entrance
    // back to the Dark Forest, plus its 3 outer-ring exits (Lighthouse
    // Tower west, Lakeside Ruins east, Cursed Cemetery south) and its
    // permanent waypoint.
    const s = g.sun;
    const pts = [
      {pos:s.forestGate, label:'River Valley', icon:'R'},
      {pos:s.westGate, label:'Lighthouse Tower', icon:'L'},
      {pos:s.eastGate, label:'Lakeside Ruins', icon:'R'},
      {pos:s.southGate, label:'Cursed Cemetery', icon:'C'},
      {pos:s.waypoint, label:'Waypoint', icon:'W'},
    ];
    plotRegionMapPoints(box, pts, s.w, s.h, p);
  } else {
    box.classList.add('genericMode');
    const list = ZONE_LANDMARKS[g.scene] || [];
    let html = '<div class="regionMapGenericNote">A detailed layout of this area hasn&rsquo;t been charted yet. Known landmarks:</div>';
    html += '<div class="regionMapListWrap">';
    if(list.length===0){
      html += '<div class="regionMapListItem">No landmarks recorded for this area yet.</div>';
    } else {
      for(const [label,icon] of list){
        html += '<div class="regionMapListItem"><div class="schIcon">'+icon+'</div><div>'+label+'</div></div>';
      }
    }
    html += '</div>';
    box.innerHTML = html;
  }
}
const regionMapOverlay = document.getElementById('regionMapOverlay');
function openRegionMap(){
  if(!game || !game.started || game.over) return;
  if(game.modalOpen) return;
  game.modalOpen = true;
  worldMapShown = false; document.querySelector('#worldMapBtn .schName').textContent = 'World Map';
  regionMapOverlay.style.display = 'flex';
  renderRegionMap();
}
function closeRegionMap(){
  if(typeof wmAnim!=='undefined') cancelAnimationFrame(wmAnim);
  regionMapOverlay.style.display = 'none';
  game.modalOpen = false;
}
document.getElementById('mapBtn').addEventListener('click', openRegionMap);
document.getElementById('regionMapClose').addEventListener('click', closeRegionMap);
